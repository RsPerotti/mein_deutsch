/**
 * GRAMMAR.JS — Grammar curriculum layer
 *
 * localStorage key: app_grammar_lessons
 * Schema: {
 *   [lessonId]: {
 *     status:      'locked' | 'in_progress' | 'complete',
 *     score:       number | null,   // last quiz score (0–1)
 *     attempts:    number,
 *     auto_granted: boolean         // true if unlocked by migration (existing user)
 *   }
 * }
 *
 * Unlock category IDs (used by isCategoryUnlocked):
 *   'stammverben-prasens' — Stammverben, Präsens exercises
 *   'variationen'         — Variationen (separable prefix variants)
 *   'modal-prasens'       — Modal verb exercises
 *   'perfekt'             — Vergangenheit → Perfekt exercises
 *   'prateritum'          — Vergangenheit → Präteritum exercises
 */

const Grammar = {

  KEY: 'app_grammar_lessons',

  PASS_THRESHOLD: 0.8, // 80% correct to pass

  // Ordered list of all lesson IDs — used for migration and iteration
  LESSON_IDS: [
    'verb-basics',
    'regular-conjugation',
    'trennbare-verben',
    'modal-verben',
    'vergangenheit-perfekt',
    'vergangenheit-prateritum'
  ],

  // ─── Internal helpers ────────────────────────────────────────────────────────

  _get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw !== null ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  _set(value) {
    try { localStorage.setItem(this.KEY, JSON.stringify(value)); }
    catch (e) { console.warn('Grammar: localStorage write failed', e); }
  },

  // ─── Lesson state ────────────────────────────────────────────────────────────

  /**
   * Returns the current state object for a lesson.
   * Defaults to locked / no score / 0 attempts if not yet initialised.
   */
  getLessonState(lessonId) {
    const all = this._get() || {};
    return all[lessonId] || { status: 'locked', score: null, attempts: 0, auto_granted: false };
  },

  /**
   * Merges partial state into a lesson's stored state.
   */
  setLessonState(lessonId, partial) {
    const all = this._get() || {};
    all[lessonId] = { ...this.getLessonState(lessonId), ...partial };
    this._set(all);
  },

  isComplete(lessonId) {
    return this.getLessonState(lessonId).status === 'complete';
  },

  /**
   * Call when user starts reading a lesson (doesn't pass / fail yet).
   * Only transitions locked → in_progress; doesn't downgrade complete.
   */
  markStarted(lessonId) {
    const current = this.getLessonState(lessonId);
    if (current.status === 'locked') {
      this.setLessonState(lessonId, { status: 'in_progress' });
    }
  },

  /**
   * Record quiz result. If score >= PASS_THRESHOLD, marks lesson complete
   * and returns true. Otherwise returns false.
   */
  recordQuizResult(lessonId, correctCount, totalCount) {
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const passed = score >= this.PASS_THRESHOLD;
    const current = this.getLessonState(lessonId);
    this.setLessonState(lessonId, {
      status:   passed ? 'complete' : 'in_progress',
      score:    score,
      attempts: (current.attempts || 0) + 1
    });
    return passed;
  },

  // ─── Unlock gate ─────────────────────────────────────────────────────────────

  /**
   * Returns true if the given category ID is accessible to the user.
   * Looks up which lesson (if any) gates this category in GRAMMAR_DATA.
   * If no lesson gates it, the category is open by default.
   */
  isCategoryUnlocked(categoryId) {
    const lessons = (typeof GRAMMAR_DATA !== 'undefined') ? GRAMMAR_DATA : [];
    const gatingLesson = lessons.find(l =>
      Array.isArray(l.unlocks) && l.unlocks.includes(categoryId)
    );
    if (!gatingLesson) return true; // No gate — open to all
    return this.isComplete(gatingLesson.id);
  },

  // ─── Migration ───────────────────────────────────────────────────────────────

  /**
   * init() — run once on every app start (called from app bootstrap in index.html).
   *
   * First-run detection: if app_grammar_lessons is null, this is the first time
   * this version of the app has loaded. We check for existing verb progress and
   * auto-grant all lessons if found — so no existing user loses access to content
   * they've already been practising.
   *
   * After migration the key is set and subsequent calls are no-ops.
   */
  init() {
    if (this._get() !== null) return; // Already initialised — skip

    const hasVerbProgress = this._detectExistingVerbProgress();

    const state = {};
    for (const id of this.LESSON_IDS) {
      state[id] = hasVerbProgress
        ? { status: 'complete', score: null, attempts: 0, auto_granted: true }
        : { status: 'locked',   score: null, attempts: 0, auto_granted: false };
    }

    this._set(state);

    if (hasVerbProgress) {
      console.log('[Grammar] Existing user detected — all lessons auto-granted complete.');
    } else {
      console.log('[Grammar] New user — all lessons initialised as locked.');
    }
  },

  /**
   * Returns true if the user has any root verbs unlocked in the existing
   * app_verbs_root_unlocked key. Used only during the first-run migration.
   */
  _detectExistingVerbProgress() {
    try {
      const raw = localStorage.getItem('app_verbs_root_unlocked');
      if (!raw) return false;
      const list = JSON.parse(raw);
      return Array.isArray(list) && list.length > 0;
    } catch {
      return false;
    }
  }

};

// ─────────────────────────────────────────
// LESSON SCREEN RENDERER
// ─────────────────────────────────────────

/**
 * Navigate to the grammar lesson screen for the given lesson ID.
 * Called from the Grammatik strip in the Verbs module home.
 */
function openLesson(lessonId) {
  window._currentGrammarLessonId = lessonId;
  window._currentGrammarModule   = 'verbs';
  navigateTo('screen-grammar-lesson');
}

/**
 * Render the lesson screen contents.
 * Called from onScreenEnter in app.js.
 */
function renderGrammarLesson(lessonId) {
  const lessons = (typeof GRAMMAR_DATA !== 'undefined') ? GRAMMAR_DATA : [];
  const lesson  = lessons.find(l => l.id === lessonId);
  if (!lesson) {
    document.getElementById('grammar-lesson-content').innerHTML =
      '<div style="padding:var(--sp-6);color:var(--color-text-muted)">Lektion nicht gefunden.</div>';
    return;
  }

  // Mark as started (locked → in_progress; complete stays complete)
  Grammar.markStarted(lessonId);

  // Nav context: "Verben · Lesson Title"
  document.getElementById('grammar-lesson-nav-context').textContent =
    'Verben · ' + lesson.title;

  // ── Explanation sections ──
  const sectionsHtml = (lesson.sections || []).map(sec => `
    <div class="grammar-section">
      <h2 class="grammar-section-heading">${sec.heading}</h2>
      <p class="grammar-section-body">${sec.body}</p>
      ${sec.example_de ? `
        <div class="grammar-example">
          <div class="grammar-example-de">${sec.example_de}</div>
          <div class="grammar-example-en">${sec.example_en || ''}</div>
        </div>` : ''}
    </div>`).join('');

  // ── Key rules ──
  const rulesHtml = (lesson.key_rules || []).length > 0 ? `
    <div class="grammar-key-rules">
      <div class="grammar-key-rules-heading">Schlüsselregeln</div>
      <ul>
        ${lesson.key_rules.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>` : '';

  // ── Quiz CTA ──
  const quizCount  = (lesson.quiz || []).length;
  const state      = Grammar.getLessonState(lessonId);
  const isComplete = state.status === 'complete';
  const ctaLabel   = isComplete
    ? `Quiz wiederholen · ${quizCount} Fragen`
    : `Quiz starten · ${quizCount} Fragen`;

  const ctaHtml = quizCount > 0 ? `
    <div class="grammar-cta-area">
      <button onclick="startGrammarQuiz('${lessonId}')">${ctaLabel}</button>
    </div>` : '';

  // ── Assemble ──
  document.getElementById('grammar-lesson-content').innerHTML = `
    <div class="grammar-lesson-body">
      <h1 class="grammar-lesson-title">${lesson.title}</h1>
      ${sectionsHtml}
      ${rulesHtml}
    </div>
    ${ctaHtml}`;

  // Scroll to top
  document.getElementById('grammar-lesson-content').scrollTop = 0;
}

/**
 * Stub for Phase 3 — quiz engine not yet built.
 * Navigating here will be wired up in Phase 3.
 */
function startGrammarQuiz(lessonId) {
  // Phase 3 will replace this stub with the quiz engine.
  // For now, just show a brief in-screen notice.
  const btn = document.querySelector('.grammar-cta-area button');
  if (btn) {
    btn.textContent = 'Quiz kommt in Phase 3 →';
    btn.style.background = 'var(--color-green-accent)';
    btn.disabled = true;
  }
}

// ─────────────────────────────────────────
// PARTICLE GRAMMAR — mirrors Grammar for the Particles module
// localStorage key: app_particles_lesson
// ─────────────────────────────────────────

const ParticleGrammar = {

  KEY: 'app_particles_lesson',

  PASS_THRESHOLD: 0.8,

  LESSON_IDS: [
    'particles-intro',
    'particles-softening',
    'particles-attitude',
    'particles-probability',
    'particles-gradation',
    'particles-doch-answer',
    'particles-connectors',
    'particles-emphasis'
  ],

  _get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw !== null ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  _set(value) {
    try { localStorage.setItem(this.KEY, JSON.stringify(value)); }
    catch (e) { console.warn('ParticleGrammar: localStorage write failed', e); }
  },

  getLessonState(lessonId) {
    const all = this._get() || {};
    return all[lessonId] || { status: 'locked', score: null, attempts: 0 };
  },

  setLessonState(lessonId, partial) {
    const all = this._get() || {};
    all[lessonId] = { ...this.getLessonState(lessonId), ...partial };
    this._set(all);
  },

  isComplete(lessonId) {
    return this.getLessonState(lessonId).status === 'complete';
  },

  markStarted(lessonId) {
    const current = this.getLessonState(lessonId);
    if (current.status === 'locked') {
      this.setLessonState(lessonId, { status: 'in_progress' });
    }
  },

  recordQuizResult(lessonId, correctCount, totalCount) {
    const score  = totalCount > 0 ? correctCount / totalCount : 0;
    const passed = score >= this.PASS_THRESHOLD;
    const current = this.getLessonState(lessonId);
    this.setLessonState(lessonId, {
      status:   passed ? 'complete' : 'in_progress',
      score:    score,
      attempts: (current.attempts || 0) + 1
    });
    return passed;
  },

  /**
   * init() — called on app start. Particles is a new module so there is no
   * existing-user migration needed. If the key is absent, initialise all
   * lessons as locked. Subsequent calls are no-ops.
   */
  init() {
    if (this._get() !== null) return;
    const state = {};
    for (const id of this.LESSON_IDS) {
      state[id] = { status: 'locked', score: null, attempts: 0 };
    }
    this._set(state);
    console.log('[ParticleGrammar] Initialised — all lessons locked for new user.');
  }

};

// ─────────────────────────────────────────
// PARTICLE LESSON RENDERER
// ─────────────────────────────────────────

/**
 * Navigate to the grammar lesson screen for a Particles lesson.
 * Sets a module flag so onScreenEnter routes to the right renderer.
 */
function openParticleLesson(lessonId) {
  window._currentGrammarLessonId = lessonId;
  window._currentGrammarModule   = 'particles';
  navigateTo('screen-grammar-lesson');
}

/**
 * Render the grammar lesson screen for a Particles lesson.
 * Called from onScreenEnter when _currentGrammarModule === 'particles'.
 */
function renderParticleLesson(lessonId) {
  const pd      = (typeof PARTICLES_DATA !== 'undefined') ? PARTICLES_DATA : {};
  const lessons = pd.lessons || [];
  const lesson  = lessons.find(l => l.id === lessonId);

  if (!lesson) {
    document.getElementById('grammar-lesson-content').innerHTML =
      '<div style="padding:var(--sp-6);color:var(--color-text-muted)">Lektion nicht gefunden.</div>';
    return;
  }

  // Mark started
  ParticleGrammar.markStarted(lessonId);

  // Nav context
  document.getElementById('grammar-lesson-nav-context').textContent =
    'Partikeln · ' + lesson.title;

  // Sections
  const sectionsHtml = (lesson.sections || []).map(sec => `
    <div class="grammar-section">
      <h2 class="grammar-section-heading">${sec.heading}</h2>
      <p class="grammar-section-body">${sec.body}</p>
      ${sec.example_de ? `
        <div class="grammar-example">
          <div class="grammar-example-de">${sec.example_de}</div>
          <div class="grammar-example-en">${sec.example_en || ''}</div>
        </div>` : ''}
    </div>`).join('');

  // Key rules
  const rulesHtml = (lesson.key_rules || []).length > 0 ? `
    <div class="grammar-key-rules">
      <div class="grammar-key-rules-heading">Schlüsselregeln</div>
      <ul>
        ${lesson.key_rules.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>` : '';

  // Quiz CTA
  const quizCount  = (lesson.quiz || []).length;
  const state      = ParticleGrammar.getLessonState(lessonId);
  const isComplete = state.status === 'complete';
  const ctaLabel   = isComplete
    ? `Quiz wiederholen · ${quizCount} Fragen`
    : `Quiz starten · ${quizCount} Fragen`;

  const ctaHtml = quizCount > 0 ? `
    <div class="grammar-cta-area">
      <button onclick="startParticleQuiz('${lessonId}')">${ctaLabel}</button>
    </div>` : '';

  document.getElementById('grammar-lesson-content').innerHTML = `
    <div class="grammar-lesson-body">
      <h1 class="grammar-lesson-title">${lesson.title}</h1>
      ${sectionsHtml}
      ${rulesHtml}
    </div>
    ${ctaHtml}`;

  document.getElementById('grammar-lesson-content').scrollTop = 0;
}

/**
 * Stub for particle quiz — Phase 6 (Grammatik build) will wire this up.
 */
function startParticleQuiz(lessonId) {
  const btn = document.querySelector('.grammar-cta-area button');
  if (btn) {
    btn.textContent = 'Quiz kommt bald →';
    btn.style.background = 'var(--color-green-accent)';
    btn.disabled = true;
  }
}

// ─────────────────────────────────────────
// GRAMMATIK ACCORDION — used by app.js
// ─────────────────────────────────────────

// Accordion open/closed state — persists within the session, resets on reload.
// Default: closed (saves space on module home).
let _grammatikOpen = false;

/**
 * Toggle the accordion open/closed.
 * Called from the accordion header's onclick.
 */
function toggleGrammatikAccordion() {
  _grammatikOpen = !_grammatikOpen;
  const body    = document.getElementById('grammatik-accordion-body');
  const chevron = document.getElementById('grammatik-accordion-chevron');
  if (!body || !chevron) return;
  body.classList.toggle('open', _grammatikOpen);
  chevron.style.transform = _grammatikOpen ? 'rotate(180deg)' : '';
}

/**
 * Returns HTML for the Grammatik accordion shown on the Verbs module home.
 * Collapsed by default; tap the header to expand.
 */
function renderGrammatikStrip() {
  const lessons = (typeof GRAMMAR_DATA !== 'undefined') ? GRAMMAR_DATA : [];
  const total   = lessons.length;
  const done    = lessons.filter(l => Grammar.isComplete(l.id)).length;

  // Dot colour per status
  const dotColor = {
    locked:      'var(--color-text-muted)',
    in_progress: '#D97706',
    complete:    'var(--color-green-accent)'
  };

  const rows = lessons.map(lesson => {
    const state  = Grammar.getLessonState(lesson.id);
    const status = state.status || 'locked';
    const color  = dotColor[status] || dotColor.locked;
    return `
      <div class="grammatik-row" onclick="openLesson('${lesson.id}')">
        <span class="grammatik-row-dot" style="background:${color}"></span>
        <span class="grammatik-row-title">${lesson.title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted);flex-shrink:0">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>`;
  }).join('');

  // Reflect in-session open state on re-render (e.g. tense tab switch)
  const bodyClass     = _grammatikOpen ? 'grammatik-accordion-body open' : 'grammatik-accordion-body';
  const chevronStyle  = _grammatikOpen ? 'style="color:var(--color-text-muted);transition:transform 0.2s;flex-shrink:0;transform:rotate(180deg)"'
                                       : 'style="color:var(--color-text-muted);transition:transform 0.2s;flex-shrink:0"';

  return `
    <div class="grammatik-accordion mt-4">
      <div class="grammatik-accordion-header" onclick="toggleGrammatikAccordion()">
        <div class="grammatik-accordion-left">
          <span class="grammatik-accordion-label">Grammatik</span>
          <span class="grammatik-accordion-count">${done} / ${total}</span>
        </div>
        <svg id="grammatik-accordion-chevron" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             ${chevronStyle}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="${bodyClass}" id="grammatik-accordion-body">
        ${rows}
      </div>
    </div>`;
}
