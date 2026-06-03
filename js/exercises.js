/**
 * EXERCISES.JS — Exercise engine
 * Implements: session management, cooldown (blueprint 11.3),
 * scoring, unlock logic, correct/wrong feedback with flash.
 */

// --- Session state ---
let session = {
  moduleId:       null,
  category:       null,   // 'roots' | 'variants'
  queue:          [],     // exercises to show
  cooldown:       [],     // exercises pushed back (wrong answers)
  retries:        {},     // wordId → retry count this session
  correctCount:   0,
  newlyUnlocked:  [],
  current:        null,
  answered:       false
};

// --- Entry point (called from app.js onScreenEnter) ---
function startExercise(state) {
  const { moduleId, category } = state || {};
  if (!moduleId || !category) return;

  session = {
    moduleId, category,
    queue: [], cooldown: [], retries: {},
    correctCount: 0, newlyUnlocked: [],
    current: null, answered: false
  };

  const exercises = _buildQueue(moduleId, category);

  if (exercises.length === 0) {
    // No content yet — show empty state
    document.getElementById('exercise-card').innerHTML = `
      <div class="empty-state" style="padding:40px 0">
        <div class="empty-icon">🔧</div>
        <p>Noch keine Aufgaben verfügbar.<br>Inhalt wird bald hinzugefügt.</p>
      </div>`;
    return;
  }

  session.queue = _shuffle([...exercises]);

  // Context pill
  const label = category === 'roots' ? 'STAMMVERBEN' : 'VARIATIONEN';
  document.getElementById('exercise-context-label').textContent = 'VERBEN · ' + label;

  _updateChips();
  _showNext();
}

function _buildQueue(moduleId, category) {
  const all = appData.exercises[moduleId] || [];

  if (moduleId !== 'module_verbs') return all.slice(0, 10);

  if (category === 'roots') {
    const rootIds = new Set(appData.verbs.map(v => v.id));
    return all.filter(ex => rootIds.has(ex.word_id)).slice(0, 10);
  }

  // Variants: only exercises for variants of already-unlocked root verbs
  const unlockedRoots = new Set(Progress.getUnlockedRootVerbs());
  const allowedVariantIds = new Set();
  for (const verb of appData.verbs) {
    if (unlockedRoots.has(verb.id)) {
      (verb.prefix_variants || []).forEach(pv => allowedVariantIds.add(pv.id));
    }
  }
  return all.filter(ex => allowedVariantIds.has(ex.word_id)).slice(0, 10);
}

// --- Show next exercise ---
function _showNext() {
  if (session.queue.length === 0 && session.cooldown.length > 0) {
    // Flush cooldown back into queue (Section 11.3)
    session.queue = [...session.cooldown];
    session.cooldown = [];
  }

  if (session.queue.length === 0) {
    _showResults();
    return;
  }

  session.current  = session.queue.shift();
  session.answered = false;

  // Progress bar
  const done  = session.correctCount;
  const total = done + session.queue.length + session.cooldown.length + 1;
  document.getElementById('exercise-progress-fill').style.width =
    total > 0 ? Math.round(done / total * 100) + '%' : '0%';

  // Render by exercise type
  const card = document.getElementById('exercise-card');
  const ex   = session.current;

  if (ex.type === 'translate_word') {
    card.innerHTML = _renderTranslateWord(ex);
  } else if (ex.type === 'fill_blank') {
    card.innerHTML = _renderFillBlank(ex);
  } else if (ex.type === 'conjugation_choice') {
    card.innerHTML = _renderConjugation(ex);
  } else {
    card.innerHTML = _renderTranslateWord(ex); // fallback
  }

  document.getElementById('next-btn').style.display = 'none';
  _updateChips();
}

// --- Render: translate_word ---
function _renderTranslateWord(ex) {
  const word    = ex.question?.de || ex.word_id.replace(/^verb_/, '');
  const prompt  = ex.question?.prompt_en || 'WHAT DOES THIS MEAN?';
  const options = _shuffle([ex.correct_answer, ...ex.wrong_answers.slice(0, 3)]);
  const letters = ['A', 'B', 'C', 'D'];

  // Prefix-color variant verbs
  let wordHtml = _esc(word);
  const prefixVerb = _findPrefixVerb(word);
  if (prefixVerb) {
    wordHtml = `<span class="prefix">${_esc(prefixVerb.prefix)}</span>${_esc(word.slice(prefixVerb.prefix.length))}`;
  }

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Übersetzen</div>
    </div>
    <div class="exercise-word-display">
      <div class="exercise-word">${wordHtml}</div>
      <div>
        <button class="pronounce-btn" onclick="_speak('${_esc(word)}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          Aussprechen
        </button>
      </div>
      <div class="exercise-word-prompt">${_esc(prompt)}</div>
    </div>
    <div class="options-stack" id="opts">
      ${options.map((opt, i) => `
        <button class="option-btn stack-opt"
                data-answer="${_esc(opt)}"
                onclick="selectAnswer(this)">
          <span class="opt-letter">${letters[i]}</span>
          <span class="opt-text">${_esc(opt)}</span>
        </button>`).join('')}
    </div>
    <div class="feedback-text" id="feedback"></div>`;
}

// --- Render: fill_blank ---
function _renderFillBlank(ex) {
  const sentDE = ex.question?.de || '';
  const sentEN = ex.question?.en || '';
  const options = _shuffle([ex.correct_answer, ...ex.wrong_answers.slice(0, 3)]);

  const sentHtml = _esc(sentDE).replace('_____',
    '<span class="exercise-blank" id="blank-span"></span>');

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Lückentext</div>
    </div>
    <div class="exercise-sentence">${sentHtml}</div>
    <div class="exercise-translation" id="ex-translation">${_esc(sentEN)}</div>
    <div class="options-grid" id="opts">
      ${options.map(opt => `
        <button class="option-btn grid-opt"
                data-answer="${_esc(opt)}"
                onclick="selectAnswer(this)">
          <span class="opt-word">${_esc(opt)}</span>
        </button>`).join('')}
    </div>
    <div class="feedback-text" id="feedback"></div>`;
}

// --- Render: conjugation_choice ---
function _renderConjugation(ex) {
  // Treat the same as translate_word but label it differently
  const html = _renderTranslateWord(ex);
  return html.replace('Übersetzen', 'Konjugation');
}

// --- Answer selection ---
function selectAnswer(btn) {
  if (session.answered) return;
  session.answered = true;

  const chosen  = btn.dataset.answer;
  const correct = session.current.correct_answer;
  const isRight = chosen === correct;

  // Disable all buttons
  document.querySelectorAll('#opts .option-btn').forEach(b => {
    b.style.pointerEvents = 'none';
  });

  if (isRight) {
    btn.classList.add('state-correct');
    session.correctCount++;
    Progress.recordResult(session.current.exercise_id, true);
    _unlockWord(session.current.word_id);

    // Fill blank (if fill_blank type)
    _fillBlank(chosen, true);

    // Green flash → auto-advance after 1.5s
    _flash('green');
    setTimeout(() => _showNext(), 1500);

  } else {
    btn.classList.add('state-wrong');

    // Highlight the correct button
    document.querySelectorAll('#opts .option-btn').forEach(b => {
      if (b.dataset.answer === correct) b.classList.add('state-correct');
    });

    // Fill blank with wrong answer highlighted
    _fillBlank(chosen, false);

    // Show explanation
    const fb = document.getElementById('feedback');
    if (fb && session.current.explanation_en) {
      fb.textContent = session.current.explanation_en;
      fb.style.display = 'block';
    }

    Progress.recordResult(session.current.exercise_id, false);

    // Cooldown logic (Section 11.3)
    const wordId = session.current.word_id;
    session.retries[wordId] = (session.retries[wordId] || 0) + 1;
    if (session.retries[wordId] <= 2) {
      session.cooldown.push(session.current); // back to queue
    } else {
      Progress.addNeedsReview(wordId);        // persistent review flag
    }

    _flash('red');
    document.getElementById('next-btn').style.display = 'block';
  }

  _updateChips();
}

// Called by the "Weiter →" button
function advanceExercise() {
  _showNext();
}

// Called by the back button inside the exercise screen
function exitExerciseEarly() {
  _showResults();
}

// --- Unlock word on correct answer ---
function _unlockWord(wordId) {
  if (Progress.isUnlocked(wordId)) return;

  const isRoot = appData.verbs.some(v => v.id === wordId);
  if (isRoot) {
    Progress.unlockRootVerb(wordId);
  } else {
    Progress.unlockVariant(wordId);
  }
  session.newlyUnlocked.push(wordId);
}

// --- Fill blank helper (for fill_blank type) ---
function _fillBlank(word, correct) {
  const blank = document.getElementById('blank-span');
  if (!blank) return;
  blank.className = correct ? 'exercise-blank filled-correct' : 'exercise-blank filled-wrong';
  blank.textContent = word;
}

// --- Flash animation ---
function _flash(color) {
  const el = document.getElementById('flash-overlay');
  if (!el) return;
  el.className = 'flash-overlay flash-' + color;
  setTimeout(() => { el.className = 'flash-overlay'; }, 400);
}

// --- Results screen ---
function _showResults() {
  navigateTo('screen-results');

  document.getElementById('results-summary').textContent =
    `${session.correctCount} Frage${session.correctCount !== 1 ? 'n' : ''} richtig beantwortet.`;

  document.getElementById('results-stats').innerHTML = `
    <div class="results-stat-row">
      <span>Richtige Antworten</span><strong>${session.correctCount}</strong>
    </div>
    <div class="results-stat-row">
      <span>Neu freigeschaltet</span><strong>${session.newlyUnlocked.length}</strong>
    </div>`;

  if (session.newlyUnlocked.length > 0) {
    const labels = session.newlyUnlocked.map(id => _wordLabel(id)).filter(Boolean);
    document.getElementById('results-unlocked').innerHTML = `
      <div class="label" style="margin-bottom:var(--sp-2)">Neue Wörter</div>
      <div class="card">
        ${labels.map(l => `<div style="padding:6px 0;border-bottom:1px solid var(--color-border)">
          ✓ ${l}</div>`).join('')}
      </div>`;
  } else {
    document.getElementById('results-unlocked').innerHTML = '';
  }
}

function returnHome() {
  navigateTo('screen-home');
}

function returnFromResults() {
  navigateTo('screen-module-home');
}

// --- Chips ---
function _updateChips() {
  document.getElementById('chip-correct').textContent  = session.correctCount;
  document.getElementById('chip-queue').textContent    = session.queue.length + session.cooldown.length;
  document.getElementById('chip-cooldown').textContent = session.cooldown.length;
}

// --- Helpers ---
function _findPrefixVerb(word) {
  for (const v of appData.verbs) {
    const pv = (v.prefix_variants || []).find(p => p.word === word);
    if (pv) return pv;
  }
  return null;
}

function _wordLabel(id) {
  const root = appData.verbs.find(v => v.id === id);
  if (root) return root.root;
  for (const v of appData.verbs) {
    const pv = (v.prefix_variants || []).find(p => p.id === id);
    if (pv) return pv.word;
  }
  return id;
}

function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Pronunciation (also used inline in exercise HTML)
function _speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
