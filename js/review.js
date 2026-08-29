/**
 * REVIEW.JS — Wiederholung, the cross-module review session
 *
 * PRD_Wiederholung.md Phase 2. The surface over js/srs.js: a home card showing
 * what is due, and a session that serves those items in one mixed queue drawn
 * from every module at once.
 *
 * The design point (PRD §5.4): this file renders NOTHING itself. There is no
 * single answer path in the app — four engines own their own renderers, grading
 * handlers and session state — so Review builds a queue and hands it to the
 * engine that already knows how to draw and grade each item. Duplicating the
 * thirteen renderers here would guarantee they drift apart.
 *
 * Phase 2 serves only Main-engine items (verbs, nouns, adverbs, adjectives,
 * prepositions, particles, expressions). Deklination, Vorsilben and Artikel have
 * their own session objects and join in Phase 3. The home card counts only what
 * can actually be served, so the number on it is never a promise the session
 * fails to keep.
 */

const Review = {

  // Modules whose exercises the Main engine (`session` + `_showNext`) renders.
  // Everything here goes through the same dispatch in _showNext, which is why a
  // single mixed queue works at all.
  MAIN_MODULES: [
    'module_verbs', 'module_nouns', 'module_adverbs', 'module_adjectives',
    'module_prepositions', 'module_particles', 'module_expressions'
  ],

  _index: null,

  // --- Index: item id → exercise ------------------------------------------

  /**
   * Flat map of every exercise the app can serve, tagged with its source module
   * and engine. Built once and cached; appData does not change after load.
   *
   * Exercises are shallow-cloned with a `_srcModule` tag rather than mutated.
   * The Main engine has a few module-specific behaviours (the verb Regular/
   * Irregular badge, the particle feedback card) that it reads off
   * `session.moduleId` — which is null in a mixed review queue. `_srcModule`
   * lets those behaviours key off the item instead of the session.
   */
  buildIndex(force) {
    if (this._index && !force) return this._index;
    const index = {};

    // `typeof x !== 'undefined'`, not `window.x`. The app's data files declare
    // their globals with top-level `const` / `let`, which creates a lexical
    // global that is NOT a property of window — so `window.appData` is undefined
    // in a real browser, not just under jsdom. Guarding on `window.appData &&`
    // silently indexed nothing from the seven Main modules and left the index
    // holding only the Phase 3 data. Caught by qa-review.js.
    const data = (typeof appData !== 'undefined') ? appData : null;
    if (!data) return (this._index = index);

    for (const moduleId of this.MAIN_MODULES) {
      const list = (data.exercises && data.exercises[moduleId]) || [];
      for (const ex of list) {
        const id = ex.exercise_id || ex.id;
        if (!id) continue;
        index[id] = { ex: { ...ex, _srcModule: moduleId }, moduleId, engine: 'main' };
      }
    }

    // Phase 3 engines. Indexed now so the home card can report honestly on what
    // is due but not yet servable, and so prune() does not delete their state.
    const dekl   = (typeof DECLENSION_DATA !== 'undefined') ? DECLENSION_DATA : {};
    const prefix = (typeof PREFIXES_DATA   !== 'undefined') ? PREFIXES_DATA   : {};
    const later = [
      ['dekl',   dekl.exercises,   'module_adjectives'],
      ['prefix', prefix.exercises, 'module_prefixes']
    ];
    for (const [engine, list, moduleId] of later) {
      for (const ex of (list || [])) {
        const id = ex.exercise_id || ex.id;
        if (!id || index[id]) continue;
        index[id] = { ex: { ...ex, _srcModule: moduleId }, moduleId, engine };
      }
    }

    // Artikel exercises are built at runtime from nouns, so they are derived
    // here the same way startArtikelExercise() derives them.
    for (const n of (data.nouns || [])) {
      const id = 'ex_artikel_' + n.id;
      if (index[id]) continue;
      index[id] = {
        ex: {
          id, type: 'select_article', word_id: n.id, word: n.word,
          english: n.english, correct_article: n.article, _srcModule: 'module_artikel'
        },
        moduleId: 'module_artikel', engine: 'artikel'
      };
    }

    this._index = index;
    return index;
  },

  knownIds() { return new Set(Object.keys(this.buildIndex())); },

  // --- What is due ---------------------------------------------------------

  /**
   * Due items split by whether this phase can serve them.
   * `unknown` is scheduling state for content that no longer exists — dropped
   * silently rather than crashing a session on a missing renderer.
   */
  dueBreakdown() {
    if (typeof SRS === 'undefined') return { servable: [], later: 0, unknown: 0 };
    const index = this.buildIndex();
    const servable = [], counts = { later: 0, unknown: 0 };

    for (const id of SRS.getDue()) {
      const entry = index[id];
      if (!entry) { counts.unknown++; continue; }
      if (entry.engine !== 'main') { counts.later++; continue; }
      servable.push(entry.ex);
    }
    return { servable, later: counts.later, unknown: counts.unknown };
  },

  dueCount() { return this.dueBreakdown().servable.length; },

  /**
   * Most overdue first (PRD §5.7), shuffled within each due date so a session
   * is genuinely mixed rather than clustered by whichever module happens to
   * share a date.
   */
  buildQueue() {
    const items = this.dueBreakdown().servable;
    const byDate = {};
    for (const ex of items) {
      const st = SRS.get(ex.exercise_id || ex.id);
      const d  = (st && st.d) || '9999-12-31';
      (byDate[d] = byDate[d] || []).push(ex);
    }
    return Object.keys(byDate).sort()
      .flatMap(d => _shuffle(byDate[d]));
  },

  // --- Session -------------------------------------------------------------

  /** Called from the home card. Navigation triggers startSession(). */
  open() {
    if (this.dueCount() === 0) return;
    exerciseMode = 'review';
    navigateTo('screen-exercise');
  },

  /**
   * Called by onScreenEnter when exerciseMode === 'review'. Builds the Main
   * engine's own session object with reviewMode set, then hands over: every
   * render, grade and advance from here is the existing engine's code.
   */
  startSession() {
    const queue = this.buildQueue();

    if (queue.length === 0) {
      document.getElementById('exercise-card').innerHTML = `
        <div class="empty-state" style="padding:40px 0">
          <div class="empty-icon">✓</div>
          <p>Nichts fällig.<br>Komm später wieder.</p>
        </div>`;
      return;
    }

    session = {
      moduleId: null, category: null,
      tenseContext: null, vergangenheitTense: null,
      reviewMode: true,
      queue, cooldown: [], retries: {},
      correctCount: 0, incorrectCount: 0, newlyUnlocked: [],
      current: null, answered: false,
      reviewTotal: queue.length
    };

    document.getElementById('exercise-context-label').textContent =
      'WIEDERHOLUNG · ' + queue.length + ' FÄLLIG';

    // None of the module pickers belong to a mixed queue.
    ['prep-difficulty-picker', 'verb-tense-picker', 'dekl-cefr-picker'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    _updateChips();
    _showNext();
  },

  /** End of a review session, whether the queue emptied or Ricco left early. */
  finish() {
    const s = session;
    exerciseMode = 'module';

    navigateTo('screen-results');

    // returnFromResults() goes to screen-module-home, which for a cross-module
    // session would be whichever module was opened last — a stale destination.
    const modBtn = document.getElementById('results-module-btn');
    if (modBtn) modBtn.style.display = 'none';

    const answered  = s.correctCount + (s.incorrectCount || 0);
    const remaining = s.queue.length + s.cooldown.length;

    document.getElementById('results-summary').textContent = answered === 0
      ? 'Keine Aufgaben beantwortet.'
      : `${s.correctCount} von ${answered} richtig.`;

    const pct = answered > 0 ? Math.round(s.correctCount / answered * 100) : 0;
    document.getElementById('results-stats').innerHTML = `
      <div class="results-stat-row">
        <span>Richtig</span><strong>${s.correctCount}</strong>
      </div>
      <div class="results-stat-row">
        <span>Falsch</span><strong>${s.incorrectCount || 0}</strong>
      </div>
      <div class="results-stat-row">
        <span>Trefferquote</span><strong>${pct}%</strong>
      </div>
      <div class="results-stat-row">
        <span>Noch fällig</span><strong>${remaining}</strong>
      </div>`;

    // No module to go back to from a cross-module session.
    document.getElementById('results-unlocked').innerHTML = remaining > 0
      ? `<div class="card" style="text-align:left">Du kannst jederzeit weitermachen —
           der Fortschritt ist nach jeder Antwort gespeichert.</div>`
      : '';
  },

  // --- Home card -----------------------------------------------------------

  renderHomeCard() {
    const el = document.getElementById('home-review-card');
    if (!el) return;
    if (typeof SRS === 'undefined') { el.innerHTML = ''; return; }

    const { servable, later } = this.dueBreakdown();
    const n = servable.length;

    if (n === 0) {
      const scheduled = SRS.countScheduled();
      el.innerHTML = `
        <div class="review-card review-card-empty">
          <div class="review-card-label">Wiederholung</div>
          <div class="review-card-title">Nichts fällig</div>
          <div class="review-card-sub">${scheduled} Aufgaben im Plan${
            later > 0 ? ` · ${later} noch nicht verfügbar` : ''}</div>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="review-card" onclick="Review.open()">
        <div class="review-card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
        <div class="review-card-label">Wiederholung</div>
        <div class="review-card-title">${n} fällig</div>
        <div class="review-card-sub">Aus allen Modulen${
          later > 0 ? ` · ${later} noch nicht verfügbar` : ''}</div>
      </div>`;
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = Review;
