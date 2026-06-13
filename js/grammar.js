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
// GRAMMATIK STRIP — used by app.js
// ─────────────────────────────────────────

/**
 * Returns HTML for the Grammatik lesson strip shown on the Verbs module home.
 * Each card shows lesson title, status icon, and opens the lesson screen on tap.
 */
function renderGrammatikStrip() {
  const lessons = (typeof GRAMMAR_DATA !== 'undefined') ? GRAMMAR_DATA : [];

  // Status icon content per status
  const icons = {
    locked:      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    style="color:var(--color-text-muted)">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>`,
    in_progress: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    style="color:#92400E">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>`,
    complete:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                    style="color:var(--color-green-accent)">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>`
  };

  // Subtitle per status
  const subtitles = {
    locked:      'Noch nicht gestartet',
    in_progress: 'In Bearbeitung',
    complete:    'Abgeschlossen'
  };

  const cards = lessons.map(lesson => {
    const state  = Grammar.getLessonState(lesson.id);
    const status = state.status || 'locked';
    const icon   = icons[status] || icons.locked;

    return `
      <div class="grammatik-lesson-card status-${status}"
           onclick="openLesson('${lesson.id}')">
        <div class="grammatik-lesson-card-left">
          <div class="grammatik-lesson-status-icon ${status}">${icon}</div>
          <div style="min-width:0">
            <div class="grammatik-lesson-title">${lesson.title}</div>
            <div class="grammatik-lesson-subtitle">${subtitles[status]}</div>
          </div>
        </div>
        <svg class="grammatik-lesson-chevron" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>`;
  }).join('');

  return `
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Grammatik
    </div>
    <div class="grammatik-strip">${cards}</div>`;
}
