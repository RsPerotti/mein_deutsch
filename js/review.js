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
 * Phase 3 completes it: all four engines now serve review items. Review owns the
 * queue, the counters, the requeue-on-miss and the HUD; each engine is handed
 * exactly one item at a time, draws it, grades it, and hands control back. An
 * engine in reviewMode manages no queue and no cooldown of its own — it cannot,
 * because it can only see its own item and the session spans all four.
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

    // The other three engines. Each item carries the engine that can draw it;
    // _serve() dispatches on that.
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
   * Due items, as index entries. `unknown` is scheduling state for content that
   * no longer exists — dropped silently rather than crashing a session on a
   * renderer that cannot be found.
   */
  dueBreakdown() {
    if (typeof SRS === 'undefined') return { servable: [], unknown: 0 };
    const index = this.buildIndex();
    const servable = [];
    let unknown = 0;

    for (const id of SRS.getDue()) {
      const entry = index[id];
      if (!entry) { unknown++; continue; }
      servable.push(entry);
    }
    return { servable, unknown };
  },

  dueCount() { return this.dueBreakdown().servable.length; },

  /**
   * Most overdue first (PRD §5.7), shuffled within each due date so a session is
   * genuinely mixed rather than clustered by whichever module happens to share a
   * date. Returns index entries, not bare exercises — the engine tag travels
   * with the item all the way to _serve().
   */
  buildQueue() {
    const byDate = {};
    for (const entry of this.dueBreakdown().servable) {
      const st = SRS.get(entry.ex.exercise_id || entry.ex.id);
      const d  = (st && st.d) || '9999-12-31';
      (byDate[d] = byDate[d] || []).push(entry);
    }
    return Object.keys(byDate).sort().flatMap(d => _shuffle(byDate[d]));
  },

  // --- Session -------------------------------------------------------------

  /** Called from the home card. Navigation triggers startSession(). */
  open() {
    if (this.dueCount() === 0) return;
    exerciseMode = 'review';
    // navigateTo() early-returns when the target is already the current screen,
    // so onScreenEnter — and therefore startSession — would never fire and the
    // previous session would silently continue. Unreachable from the home card,
    // but a trap for any future caller.
    if (currentScreen === 'screen-exercise') { this.startSession(); return; }
    navigateTo('screen-exercise');
  },

  // Session state. Review owns all of it; the engines own none of it.
  _queue: [], _cooldown: [], _retries: {},
  _engine: null, _current: null,
  _correct: 0, _incorrect: 0, _total: 0, _active: false,

  isActive() { return this._active; },

  /** Answers given so far this session — the "FRAGE n" position. */
  answeredCount() { return this._correct + this._incorrect; },

  /**
   * Called by onScreenEnter when exerciseMode === 'review'.
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

    this._queue    = queue;
    this._cooldown = [];
    this._retries  = {};
    this._engine   = null;
    this._current  = null;
    this._correct  = 0;
    this._incorrect = 0;
    this._total    = queue.length;
    this._active   = true;

    document.getElementById('exercise-context-label').textContent =
      'WIEDERHOLUNG · ' + queue.length + ' FÄLLIG';

    // None of the module pickers belong to a mixed queue.
    ['prep-difficulty-picker', 'verb-tense-picker', 'dekl-cefr-picker'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    this.updateHud();
    this.next();
  },

  /**
   * Serve the next item, or finish. Called by every engine when it runs out of
   * items — which, in review, is after every single card.
   */
  next() {
    if (this._queue.length === 0 && this._cooldown.length > 0) {
      this._queue    = _shuffle([...this._cooldown]);
      this._cooldown = [];
    }
    if (this._queue.length === 0) { this.finish(); return; }
    this._serve(this._queue.shift());
  },

  /**
   * Hand one item to the engine that can draw it. Each engine gets a session
   * object holding exactly this item: no queue to advance into, no cooldown to
   * flush, so when it asks for the next card it necessarily comes back here.
   *
   * This is the dispatcher PRD §5.4 called for. Phase 2 did not need it because
   * the Main engine already dispatches on `ex.type`; these three cannot share
   * `session`, because each reads its own module-level global.
   */
  _serve(entry) {
    const ex = entry.ex;
    this._engine  = entry.engine;
    this._current = entry;

    const shell = (extra) => Object.assign({
      queue: [ex], cooldown: [], correctCount: 0, totalCount: 1,
      current: null, answered: false, reviewMode: true
    }, extra || {});

    if (entry.engine === 'main') {
      session = shell({
        moduleId: null, category: null,
        tenseContext: null, vergangenheitTense: null,
        retries: {}, newlyUnlocked: []
      });
      _showNext();
    } else if (entry.engine === 'dekl') {
      _deklSession = shell();
      _deklShowNext();
    } else if (entry.engine === 'prefix') {
      _prefixSession = shell();
      _prefixShowNext();
    } else if (entry.engine === 'artikel') {
      _artikelSession = shell();
      _artikelShowNext();
    } else {
      // Unknown engine: skip rather than stall the session.
      this.next();
    }
  },

  /** The "Weiter →" button. Which engine drew the card decides who advances. */
  advance() {
    if (this._engine === 'dekl')    { _deklShowNext();    return; }
    if (this._engine === 'prefix')  { _prefixShowNext();  return; }
    if (this._engine === 'artikel') { _artikelShowNext(); return; }
    _showNext();
  },

  /**
   * Every graded answer in a review session arrives here, from all four engines,
   * via _recordAnswer(). Review counts it and decides whether it comes back.
   */
  onGraded(itemId, isRight) {
    if (!this._active) return;
    if (isRight) { this._correct++; }
    else {
      this._incorrect++;
      // Same rule as module play (blueprint 11.3): a missed item comes back
      // later in the session, but only twice — after that the schedule has it
      // due today anyway, so a third pass is drilling, not review.
      this._retries[itemId] = (this._retries[itemId] || 0) + 1;
      if (this._retries[itemId] <= 2 && this._current) {
        this._cooldown.push(this._current);
      }
    }
    this.updateHud();
  },

  /** The chips and progress bar belong to the session, not to one card. */
  updateHud() {
    const answered = this._correct + this._incorrect;
    const left     = this._queue.length + this._cooldown.length;
    const pct      = this._total > 0
      ? Math.round(Math.min(answered, this._total) / this._total * 100) : 0;

    const bar = document.getElementById('exercise-progress-fill');
    if (bar) bar.style.width = pct + '%';

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set('chip-correct', this._correct);
    set('chip-queue', left);
    set('chip-cooldown', this._cooldown.length);
  },

  /** End of a review session, whether the queue emptied or Ricco left early. */
  finish() {
    this._active = false;
    exerciseMode = 'module';

    navigateTo('screen-results');

    // returnFromResults() goes to screen-module-home, which for a cross-module
    // session would be whichever module was opened last — a stale destination.
    const modBtn = document.getElementById('results-module-btn');
    if (modBtn) modBtn.style.display = 'none';

    const answered  = this._correct + this._incorrect;
    const remaining  = this._queue.length + this._cooldown.length;

    document.getElementById('results-summary').textContent = answered === 0
      ? 'Keine Aufgaben beantwortet.'
      : `${this._correct} von ${answered} richtig.`;

    const pct = answered > 0 ? Math.round(this._correct / answered * 100) : 0;
    document.getElementById('results-stats').innerHTML = `
      <div class="results-stat-row">
        <span>Richtig</span><strong>${this._correct}</strong>
      </div>
      <div class="results-stat-row">
        <span>Falsch</span><strong>${this._incorrect}</strong>
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

    const n = this.dueCount();

    if (n === 0) {
      const scheduled = SRS.countScheduled();
      el.innerHTML = `
        <div class="review-card review-card-empty">
          <div class="review-card-label">Wiederholung</div>
          <div class="review-card-title">Nichts fällig</div>
          <div class="review-card-sub">${scheduled} Aufgaben im Plan</div>
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
        <div class="review-card-sub">Aus allen Modulen</div>
      </div>`;
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = Review;
