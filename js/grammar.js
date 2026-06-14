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

// ─────────────────────────────────────────
// GRAMMAR QUIZ ENGINE
// ─────────────────────────────────────────

/**
 * Quiz runtime state — lives in window so grammar.js functions can share it.
 * Reset on each quiz start.
 *
 * {
 *   lessonId:     string,
 *   questions:    rule_check question objects (exercise_ref filtered out),
 *   currentIndex: number,
 *   correctCount: number,
 *   answered:     boolean,   // has the user answered the current question?
 *   module:       'verbs' | 'particles'
 * }
 */
window._grammarQuizState = null;

/**
 * Unlock category display names — shown in the results pass message.
 */
const _GRAMMAR_UNLOCK_LABELS = {
  'stammverben-prasens': 'Stammverben (Präsens)',
  'variationen':         'Variationen',
  'modal-prasens':       'Modal Verben',
  'perfekt':             'Vergangenheit · Perfekt',
  'prateritum':          'Vergangenheit · Präteritum'
};

/**
 * Start the Verbs grammar quiz for a given lesson.
 * Filters questions to rule_check only.
 * Navigates to screen-grammar-quiz.
 */
function startGrammarQuiz(lessonId) {
  const lessons  = (typeof GRAMMAR_DATA !== 'undefined') ? GRAMMAR_DATA : [];
  const lesson   = lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const questions = (lesson.quiz || []).filter(q => q.type === 'rule_check');

  window._grammarQuizState = {
    lessonId,
    questions,
    currentIndex: 0,
    correctCount: 0,
    answered:     false,
    module:       'verbs'
  };

  // If already on the quiz screen (e.g. retry), re-render directly.
  if (typeof currentScreen !== 'undefined' && currentScreen === 'screen-grammar-quiz') {
    renderGrammarQuiz();
  } else {
    navigateTo('screen-grammar-quiz');
  }
}

/**
 * Render the current quiz question (or results if finished).
 * Called from onScreenEnter when module === 'verbs'.
 */
function renderGrammarQuiz() {
  const state = window._grammarQuizState;
  if (!state) {
    document.getElementById('grammar-quiz-content').innerHTML =
      '<div style="padding:var(--sp-6);color:var(--color-text-muted)">Kein Quiz aktiv.</div>';
    return;
  }

  const lessons = (typeof GRAMMAR_DATA !== 'undefined') ? GRAMMAR_DATA : [];
  const lesson  = lessons.find(l => l.id === state.lessonId);

  document.getElementById('grammar-quiz-nav-context').textContent =
    (lesson ? lesson.title : 'Quiz') + ' · Quiz';

  if (state.currentIndex >= state.questions.length) {
    _renderGrammarQuizResults();
    return;
  }

  _renderGrammarQuizQuestion();
}

function _renderGrammarQuizQuestion() {
  const state = window._grammarQuizState;
  const q     = state.questions[state.currentIndex];
  const total = state.questions.length;
  const num   = state.currentIndex + 1;

  // Progress label in nav header
  const progEl = document.getElementById('grammar-quiz-progress');
  if (progEl) progEl.textContent = `${num} / ${total}`;

  const optionsHtml = (q.options || []).map((opt, i) => `
    <button class="quiz-option" onclick="submitGrammarAnswer(${i})">${opt}</button>
  `).join('');

  document.getElementById('grammar-quiz-content').innerHTML = `
    <div style="padding:var(--sp-4)">
      <div class="quiz-question-card">
        <div class="quiz-question-text">${q.question}</div>
      </div>

      <div class="quiz-options" id="quiz-options">
        ${optionsHtml}
      </div>

      <div class="quiz-feedback-row" id="quiz-feedback"></div>

      <button class="quiz-next-btn" id="quiz-next-btn"
              onclick="advanceGrammarQuiz()">
        ${num < total ? 'Weiter →' : 'Ergebnis anzeigen →'}
      </button>
    </div>`;

  state.answered = false;
}

/**
 * Called when the user taps a MC option.
 */
function submitGrammarAnswer(selectedIndex) {
  const state = window._grammarQuizState;
  if (!state || state.answered) return;
  state.answered = true;

  const q       = state.questions[state.currentIndex];
  const correct = selectedIndex === q.correct;
  if (correct) state.correctCount++;

  // Style all option buttons
  const buttons = document.querySelectorAll('.quiz-option');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    else if (i === selectedIndex && !correct) btn.classList.add('wrong');
  });

  // Feedback row
  const fbEl = document.getElementById('quiz-feedback');
  if (fbEl) {
    fbEl.className = 'quiz-feedback-row ' + (correct ? 'correct' : 'wrong');
    fbEl.textContent = correct ? '✓ Richtig!' : `✗ Richtig wäre: ${q.options[q.correct]}`;
  }

  // Show next button
  const nextBtn = document.getElementById('quiz-next-btn');
  if (nextBtn) nextBtn.classList.add('visible');
}

/**
 * Advance to next question, or show results if all done.
 */
function advanceGrammarQuiz() {
  const state = window._grammarQuizState;
  if (!state) return;
  state.currentIndex++;
  state.answered = false;

  if (state.currentIndex >= state.questions.length) {
    _renderGrammarQuizResults();
  } else {
    _renderGrammarQuizQuestion();
    // Clear progress label briefly then re-set (already correct — just re-render)
  }
}

function _renderGrammarQuizResults() {
  const state   = window._grammarQuizState;
  const total   = state.questions.length;
  const correct = state.correctCount;
  const pct     = total > 0 ? Math.round(correct / total * 100) : 0;

  const passed  = Grammar.recordQuizResult(state.lessonId, correct, total);

  // Progress label: hide
  const progEl = document.getElementById('grammar-quiz-progress');
  if (progEl) progEl.textContent = '';

  // Unlock label
  const lessons      = (typeof GRAMMAR_DATA !== 'undefined') ? GRAMMAR_DATA : [];
  const lesson       = lessons.find(l => l.id === state.lessonId);
  const unlockIds    = lesson ? (lesson.unlocks || []) : [];
  const unlockLabels = unlockIds.map(id => _GRAMMAR_UNLOCK_LABELS[id] || id);

  const passHtml = `
    <div class="quiz-results-status passed">
      ✓ Bestanden — ${unlockLabels.length > 0
        ? 'Freigeschaltet: ' + unlockLabels.join(', ')
        : 'Lektion abgeschlossen.'}
    </div>
    <button class="primary-btn" style="margin-bottom:var(--sp-3)"
            onclick="navigateBack();navigateBack()">Zurück zu Verben</button>
    <button class="secondary-btn"
            onclick="startGrammarQuiz('${state.lessonId}')">Quiz wiederholen</button>`;

  const failHtml = `
    <div class="quiz-results-status failed">
      Noch nicht bestanden. Du brauchst ${Math.ceil(Grammar.PASS_THRESHOLD * total)} / ${total} richtig.
    </div>
    <button class="primary-btn" style="margin-bottom:var(--sp-3)"
            onclick="startGrammarQuiz('${state.lessonId}')">Noch einmal versuchen</button>
    <button class="secondary-btn"
            onclick="navigateBack()">Lektion nochmal lesen</button>`;

  document.getElementById('grammar-quiz-content').innerHTML = `
    <div style="padding:var(--sp-4)">
      <div class="quiz-results-card">
        <div class="quiz-results-score">${pct}%</div>
        <div class="quiz-results-label">${correct} / ${total} richtig</div>
        ${passed ? passHtml : failHtml}
      </div>
    </div>`;
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
 * Start the Particles grammar quiz for a given lesson.
 */
function startParticleQuiz(lessonId) {
  const pd       = (typeof PARTICLES_DATA !== 'undefined') ? PARTICLES_DATA : {};
  const lessons  = pd.lessons || [];
  const lesson   = lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const questions = (lesson.quiz || []).filter(q => q.type === 'rule_check');

  window._grammarQuizState = {
    lessonId,
    questions,
    currentIndex: 0,
    correctCount: 0,
    answered:     false,
    module:       'particles'
  };

  if (typeof currentScreen !== 'undefined' && currentScreen === 'screen-grammar-quiz') {
    renderParticleQuiz();
  } else {
    navigateTo('screen-grammar-quiz');
  }
}

/**
 * Render quiz for particles module. Called from onScreenEnter.
 */
function renderParticleQuiz() {
  const state = window._grammarQuizState;
  if (!state) return;

  const pd      = (typeof PARTICLES_DATA !== 'undefined') ? PARTICLES_DATA : {};
  const lessons = pd.lessons || [];
  const lesson  = lessons.find(l => l.id === state.lessonId);

  document.getElementById('grammar-quiz-nav-context').textContent =
    (lesson ? lesson.title : 'Quiz') + ' · Quiz';

  if (state.currentIndex >= state.questions.length) {
    _renderParticleQuizResults();
    return;
  }

  _renderGrammarQuizQuestion(); // question renderer is shared
}

function _renderParticleQuizResults() {
  const state   = window._grammarQuizState;
  const total   = state.questions.length;
  const correct = state.correctCount;
  const pct     = total > 0 ? Math.round(correct / total * 100) : 0;

  const passed  = ParticleGrammar.recordQuizResult(state.lessonId, correct, total);

  const progEl = document.getElementById('grammar-quiz-progress');
  if (progEl) progEl.textContent = '';

  const passHtml = `
    <div class="quiz-results-status passed">✓ Bestanden</div>
    <button class="primary-btn" style="margin-bottom:var(--sp-3)"
            onclick="navigateBack();navigateBack()">Zurück zu Partikeln</button>
    <button class="secondary-btn"
            onclick="startParticleQuiz('${state.lessonId}')">Quiz wiederholen</button>`;

  const failHtml = `
    <div class="quiz-results-status failed">
      Noch nicht bestanden. Du brauchst ${Math.ceil(ParticleGrammar.PASS_THRESHOLD * total)} / ${total} richtig.
    </div>
    <button class="primary-btn" style="margin-bottom:var(--sp-3)"
            onclick="startParticleQuiz('${state.lessonId}')">Noch einmal versuchen</button>
    <button class="secondary-btn"
            onclick="navigateBack()">Lektion nochmal lesen</button>`;

  document.getElementById('grammar-quiz-content').innerHTML = `
    <div style="padding:var(--sp-4)">
      <div class="quiz-results-card">
        <div class="quiz-results-score">${pct}%</div>
        <div class="quiz-results-label">${correct} / ${total} richtig</div>
        ${passed ? passHtml : failHtml}
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// ARTIKEL GRAMMAR — mirrors ParticleGrammar for the Artikel module
// localStorage key: app_grammar_artikel_lessons
// ─────────────────────────────────────────

const ArticleGrammar = {

  KEY: 'app_grammar_artikel_lessons',

  PASS_THRESHOLD: 0.8,

  LESSON_IDS: [
    'artikel-gender-intro',
    'artikel-masculine-endings',
    'artikel-feminine-endings',
    'artikel-neuter-endings',
    'artikel-meaning-categories',
    'artikel-compound-tips'
  ],

  _get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw !== null ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  _set(value) {
    try { localStorage.setItem(this.KEY, JSON.stringify(value)); }
    catch (e) { console.warn('ArticleGrammar: localStorage write failed', e); }
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

  init() {
    if (this._get() !== null) return;
    const state = {};
    for (const id of this.LESSON_IDS) {
      state[id] = { status: 'locked', score: null, attempts: 0 };
    }
    this._set(state);
    console.log('[ArticleGrammar] Initialised — all lessons locked for new user.');
  }

};

// ─────────────────────────────────────────
// ARTIKEL LESSON RENDERER
// ─────────────────────────────────────────

function openArticleLesson(lessonId) {
  window._currentGrammarLessonId = lessonId;
  window._currentGrammarModule   = 'artikel';
  navigateTo('screen-grammar-lesson');
}

function renderArticleLesson(lessonId) {
  const lessons = (typeof ARTICLE_GRAMMAR_DATA !== 'undefined') ? ARTICLE_GRAMMAR_DATA : [];
  const lesson  = lessons.find(l => l.id === lessonId);

  if (!lesson) {
    document.getElementById('grammar-lesson-content').innerHTML =
      '<div style="padding:var(--sp-6);color:var(--color-text-muted)">Lektion nicht gefunden.</div>';
    return;
  }

  ArticleGrammar.markStarted(lessonId);

  document.getElementById('grammar-lesson-nav-context').textContent =
    'Artikel · ' + lesson.title;

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

  const rulesHtml = (lesson.key_rules || []).length > 0 ? `
    <div class="grammar-key-rules">
      <div class="grammar-key-rules-heading">Schlüsselregeln</div>
      <ul>
        ${lesson.key_rules.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>` : '';

  const quizCount  = (lesson.quiz || []).length;
  const state      = ArticleGrammar.getLessonState(lessonId);
  const isComplete = state.status === 'complete';
  const ctaLabel   = isComplete
    ? `Quiz wiederholen · ${quizCount} Fragen`
    : `Quiz starten · ${quizCount} Fragen`;

  const ctaHtml = quizCount > 0 ? `
    <div class="grammar-cta-area">
      <button onclick="startArticleQuiz('${lessonId}')">${ctaLabel}</button>
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

function startArticleQuiz(lessonId) {
  const lessons  = (typeof ARTICLE_GRAMMAR_DATA !== 'undefined') ? ARTICLE_GRAMMAR_DATA : [];
  const lesson   = lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const questions = (lesson.quiz || []).filter(q => q.type === 'rule_check');

  window._grammarQuizState = {
    lessonId,
    questions,
    currentIndex: 0,
    correctCount: 0,
    answered:     false,
    module:       'artikel'
  };

  if (typeof currentScreen !== 'undefined' && currentScreen === 'screen-grammar-quiz') {
    renderArticleQuiz();
  } else {
    navigateTo('screen-grammar-quiz');
  }
}

function renderArticleQuiz() {
  const state = window._grammarQuizState;
  if (!state) return;

  const lessons = (typeof ARTICLE_GRAMMAR_DATA !== 'undefined') ? ARTICLE_GRAMMAR_DATA : [];
  const lesson  = lessons.find(l => l.id === state.lessonId);

  document.getElementById('grammar-quiz-nav-context').textContent =
    (lesson ? lesson.title : 'Quiz') + ' · Quiz';

  if (state.currentIndex >= state.questions.length) {
    _renderArticleQuizResults();
    return;
  }

  _renderGrammarQuizQuestion(); // shared question renderer
}

function _renderArticleQuizResults() {
  const state   = window._grammarQuizState;
  const total   = state.questions.length;
  const correct = state.correctCount;
  const pct     = total > 0 ? Math.round(correct / total * 100) : 0;

  const passed  = ArticleGrammar.recordQuizResult(state.lessonId, correct, total);

  const progEl = document.getElementById('grammar-quiz-progress');
  if (progEl) progEl.textContent = '';

  const passHtml = `
    <div class="quiz-results-status passed">✓ Bestanden</div>
    <button class="primary-btn" style="margin-bottom:var(--sp-3)"
            onclick="navigateBack();navigateBack()">Zurück zu Artikel</button>
    <button class="secondary-btn"
            onclick="startArticleQuiz('${state.lessonId}')">Quiz wiederholen</button>`;

  const failHtml = `
    <div class="quiz-results-status failed">
      Noch nicht bestanden. Du brauchst ${Math.ceil(ArticleGrammar.PASS_THRESHOLD * total)} / ${total} richtig.
    </div>
    <button class="primary-btn" style="margin-bottom:var(--sp-3)"
            onclick="startArticleQuiz('${state.lessonId}')">Noch einmal versuchen</button>
    <button class="secondary-btn"
            onclick="navigateBack()">Lektion nochmal lesen</button>`;

  document.getElementById('grammar-quiz-content').innerHTML = `
    <div style="padding:var(--sp-4)">
      <div class="quiz-results-card">
        <div class="quiz-results-score">${pct}%</div>
        <div class="quiz-results-label">${correct} / ${total} richtig</div>
        ${passed ? passHtml : failHtml}
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// ARTIKEL GRAMMATIK ACCORDION
// ─────────────────────────────────────────

let _artikelGramOpen = false;

function toggleArtikelGrammatikAccordion() {
  _artikelGramOpen = !_artikelGramOpen;
  const body    = document.getElementById('artikel-gram-body');
  const chevron = document.getElementById('artikel-gram-chevron');
  if (body)    body.classList.toggle('open', _artikelGramOpen);
  if (chevron) chevron.style.transform = _artikelGramOpen ? 'rotate(180deg)' : '';
}

function _renderArtikelGrammatikStrip(lessons) {
  const total    = lessons.length;
  const done     = lessons.filter(l => ArticleGrammar.isComplete(l.id)).length;
  const bodyClass    = _artikelGramOpen ? 'grammatik-accordion-body open' : 'grammatik-accordion-body';
  const chevronStyle = _artikelGramOpen
    ? 'style="color:var(--color-text-muted);transition:transform 0.2s;flex-shrink:0;transform:rotate(180deg)"'
    : 'style="color:var(--color-text-muted);transition:transform 0.2s;flex-shrink:0"';

  const dotColor = {
    locked:      'var(--color-text-muted)',
    in_progress: '#D97706',
    complete:    'var(--color-green-accent)'
  };

  const rows = lessons.map(l => {
    const state  = ArticleGrammar.getLessonState(l.id);
    const status = state.status || 'locked';
    const color  = dotColor[status] || dotColor.locked;
    return `
    <div class="grammatik-row" onclick="openArticleLesson('${l.id}')">
      <span class="grammatik-row-dot" style="background:${color}"></span>
      <span class="grammatik-row-title">${l.title}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
           style="color:var(--color-text-muted);flex-shrink:0">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>`;
  }).join('');

  return `
    <div class="grammatik-accordion mt-4">
      <div class="grammatik-accordion-header" onclick="toggleArtikelGrammatikAccordion()">
        <div class="grammatik-accordion-left">
          <span class="grammatik-accordion-label">Grammatik</span>
          <span class="grammatik-accordion-count">${done} / ${total}</span>
        </div>
        <svg id="artikel-gram-chevron" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             ${chevronStyle}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="${bodyClass}" id="artikel-gram-body">
        ${rows}
      </div>
    </div>`;
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
