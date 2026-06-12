/**
 * EXERCISES.JS — Exercise engine
 * Implements: session management, cooldown (blueprint 11.3),
 * scoring, unlock logic, correct/wrong feedback with flash.
 * Also handles Word List Practice mode (exerciseMode = 'wordlist').
 */

// --- Exercise mode: 'module' | 'wordlist' ---
let exerciseMode = 'module';

// --- Word List Practice state ---
let wlAllWords = [];   // full pool for the session
let wlSession  = {
  queue:         [],
  passCount:     1,
  passTotal:     0,
  correctCount:  0,
  incorrectCount:0,
  current:       null,
  answered:      false
};

// --- Module session state ---
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
  const { moduleId, category, tenseContext } = state || {};
  if (!moduleId || !category) return;

  // Default Vergangenheit sub-tense to 'perfekt' when starting fresh
  const initVergangenheitTense = tenseContext === 'vergangenheit' ? 'perfekt' : null;

  session = {
    moduleId, category,
    tenseContext: tenseContext || null,           // 'prasens' | 'vergangenheit' | null
    vergangenheitTense: initVergangenheitTense,   // 'perfekt' | 'prateritum'
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

  session.queue = _ensureFirstExposure(_shuffle([...exercises]));

  // Context pill
  let contextLabel;
  if (moduleId === 'module_nouns') {
    const label = category === 'roots' ? 'STAMMNOMEN' : 'VARIATIONEN';
    contextLabel = 'NOMEN · ' + label;
  } else if (moduleId === 'module_adverbs') {
    contextLabel = 'ADVERBIEN · ÜBUNGEN';
  } else if (moduleId === 'module_adjectives') {
    contextLabel = 'ADJEKTIVE · GRUNDFORMEN';
  } else if (moduleId === 'module_prepositions') {
    contextLabel = 'PRÄPOSITIONEN · ÜBUNGEN';
  } else {
    const tcLabel = tenseContext === 'vergangenheit' ? 'VERGANGENHEIT' : 'PRÄSENS';
    const catLabel = category === 'roots' ? 'STAMMVERBEN' : 'VARIATIONEN';
    contextLabel = 'VERBEN · ' + catLabel + ' · ' + tcLabel;
  }
  document.getElementById('exercise-context-label').textContent = contextLabel;

  // Show/hide difficulty picker for prepositions
  const prepPicker = document.getElementById('prep-difficulty-picker');
  if (prepPicker) {
    prepPicker.style.display = moduleId === 'module_prepositions' ? 'block' : 'none';
    if (moduleId === 'module_prepositions') {
      _updateDifficultyPicker(Progress.getPrepositionsDifficulty());
    }
  }

  // Show/hide Verb Vergangenheit sub-picker (Perfekt / Präteritum)
  const verbPicker = document.getElementById('verb-tense-picker');
  if (verbPicker) {
    const showVerbPicker = moduleId === 'module_verbs' && tenseContext === 'vergangenheit';
    verbPicker.style.display = showVerbPicker ? 'block' : 'none';
    if (showVerbPicker) _updateVerbTensePicker(session.vergangenheitTense);
  }

  _updateChips();
  _showNext();
}

function _buildQueue(moduleId, category) {
  const all = appData.exercises[moduleId] || [];

  // Nouns — roots vs variations
  if (moduleId === 'module_nouns') {
    if (category === 'roots') {
      const rootIds = new Set(appData.nouns.filter(n => n.section === 'roots').map(n => n.id));
      return _shuffle(all.filter(ex => rootIds.has(ex.word_id)));
    }
    // Variations: only exercises for variations of already-unlocked root nouns
    const unlockedRootNouns = new Set(Progress.getUnlockedRootNouns());
    if (unlockedRootNouns.size === 0) return [];
    const variationIds = new Set(appData.nouns.filter(n => n.section === 'variations').map(n => n.id));
    return _shuffle(all.filter(ex => variationIds.has(ex.word_id)));
  }

  // Adverbs — single category, serve all exercises
  if (moduleId === 'module_adverbs') return _shuffle([...all]);

  // Adjectives — single category (Grundformen), serve all exercises
  if (moduleId === 'module_adjectives') return _shuffle([...all]);

  // Prepositions — filter by selected difficulty level (exact match)
  // Difficulty levels: 'A1' | 'A2' | 'B1' | 'B2'  (C1/C2 reserved for future expansion)
  if (moduleId === 'module_prepositions') {
    const difficulty = Progress.getPrepositionsDifficulty();
    return _shuffle(all.filter(ex => ex.difficulty === difficulty));
  }

  // Full queue — no session cap. User works through all exercises until complete.
  if (moduleId !== 'module_verbs') return _shuffle([...all]);

  // Verb tense filter — applied before roots/variants split
  // tenseContext: 'prasens' | 'vergangenheit' | null (null = no filter, legacy)
  // vergangenheitTense: 'perfekt' | 'prateritum' (used when tenseContext === 'vergangenheit')
  const tc  = session.tenseContext;
  const vgt = session.vergangenheitTense; // 'perfekt' | 'prateritum'

  let tenseFiltered;
  if (tc === 'prasens') {
    tenseFiltered = all.filter(ex => !ex.tense || ex.tense === 'prasens');
  } else if (tc === 'vergangenheit') {
    // Sub-tense from the picker; default to perfekt
    const sub = vgt || 'perfekt';
    tenseFiltered = all.filter(ex => ex.tense === sub);
  } else {
    // No tense context (legacy / other modules) — serve everything
    tenseFiltered = all;
  }

  if (category === 'roots') {
    const rootIds = new Set(appData.verbs.map(v => v.id));
    return _shuffle(tenseFiltered.filter(ex => rootIds.has(ex.word_id)));
  }

  // Variants: only exercises for variants of already-unlocked root verbs
  const unlockedRoots = new Set(Progress.getUnlockedRootVerbs());
  const allowedVariantIds = new Set();
  for (const verb of appData.verbs) {
    if (unlockedRoots.has(verb.id)) {
      (verb.prefix_variants || []).forEach(pv => allowedVariantIds.add(pv.id));
    }
  }
  return _shuffle(tenseFiltered.filter(ex => allowedVariantIds.has(ex.word_id)));
}

// --- Show next exercise ---
function _showNext() {
  if (session.queue.length === 0 && session.cooldown.length > 0) {
    // Flush cooldown back into queue (Section 11.3)
    session.queue = [...session.cooldown];
    session.cooldown = [];
  }

  if (session.queue.length === 0) {
    returnFromResults();
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
  } else if (ex.type === 'article_choice') {
    card.innerHTML = _renderArticleChoice(ex);
  } else if (ex.type === 'conjugation_choice') {
    card.innerHTML = _renderConjugation(ex);
  } else if (ex.type === 'select_preposition') {
    card.innerHTML = _renderSelectPreposition(ex);
  } else if (ex.type === 'select_case') {
    card.innerHTML = _renderSelectCase(ex);
  } else if (ex.type === 'partizip_ii') {
    card.innerHTML = _renderPartizipII(ex);
    setTimeout(() => document.getElementById('partizip-input')?.focus(), 80);
  } else if (ex.type === 'auxiliary_choice') {
    card.innerHTML = _renderAuxiliaryChoice(ex);
  } else if (ex.type === 'conjugation_table') {
    card.innerHTML = _renderConjugationTable(ex);
    setTimeout(() => document.getElementById('input-ich')?.focus(), 80);
  } else {
    card.innerHTML = _renderTranslateWord(ex); // fallback
  }

  // Inject Regular/Irregular + case badge for verb exercises
  if (session.moduleId === 'module_verbs' && ex.word_id) {
    const badge = _verbMetaBadge(ex.word_id);
    if (badge) {
      const metaEl = card.querySelector('.exercise-meta');
      if (metaEl) metaEl.insertAdjacentHTML('afterend', badge);
    }
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

// --- Render: article_choice ---
// Identical layout to fill_blank but labelled "Artikel"
function _renderArticleChoice(ex) {
  const sentDE  = ex.question?.de || '';
  const sentEN  = ex.question?.en || '';
  const options = _shuffle([ex.correct_answer, ...ex.wrong_answers.slice(0, 3)]);

  const sentHtml = _esc(sentDE).replace('_____',
    '<span class="exercise-blank" id="blank-span"></span>');

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Artikel</div>
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
// Short format (e.g. "wir _____"): show as big word display, no translation.
// Sentence format (e.g. "Er _____ die Party ab."): show as sentence with English below.
function _renderConjugation(ex) {
  const sentDE  = ex.question?.de || '';
  const sentEN  = ex.question?.en || '';
  const options = _shuffle([ex.correct_answer, ...ex.wrong_answers.slice(0, 3)]);

  // Sentence exercise: de has more than 2 words (beyond "pronoun _____")
  const wordCount = sentDE.trim().split(/\s+/).length;
  const isSentence = wordCount > 2;

  if (isSentence) {
    const sentHtml = _esc(sentDE).replace('_____',
      '<span class="exercise-blank" id="blank-span"></span>');

    return `
      <div class="exercise-meta">
        <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
        <div class="exercise-type-label">Konjugation</div>
      </div>
      <div class="exercise-sentence">${sentHtml}</div>
      ${sentEN ? `<div class="exercise-translation" id="ex-translation">${_esc(sentEN)}</div>` : ''}
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

  // Short format: "wir _____" — big word display, no English hint needed
  const displayHtml = _esc(sentDE).replace('_____',
    '<span id="blank-span" class="exercise-blank" style="display:inline-block;min-width:80px;border-bottom:3px solid var(--color-primary);vertical-align:middle;margin:0 8px;font-size:inherit"></span>');

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Konjugation</div>
    </div>
    <div class="exercise-word-display">
      <div class="exercise-word" style="font-size:clamp(2rem,8vw,3rem)">${displayHtml}</div>
      <div class="exercise-word-prompt">WELCHE FORM IST RICHTIG?</div>
    </div>
    <div class="options-stack" id="opts">
      ${options.map((opt, i) => `
        <button class="option-btn stack-opt"
                data-answer="${_esc(opt)}"
                onclick="selectAnswer(this)">
          <span class="opt-letter">${['A','B','C','D'][i]}</span>
          <span class="opt-text">${_esc(opt)}</span>
        </button>`).join('')}
    </div>
    <div class="feedback-text" id="feedback"></div>`;
}

// --- Render: select_preposition ---
// Sentence with a _____ gap; choose the correct preposition from 4 options
function _renderSelectPreposition(ex) {
  const sentDE  = ex.question?.de || '';
  const sentEN  = ex.question?.en || '';
  const options = _shuffle([ex.correct_answer, ...ex.wrong_answers.slice(0, 3)]);

  const sentHtml = _esc(sentDE).replace('_____',
    '<span class="exercise-blank" id="blank-span"></span>');

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Präposition</div>
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

// --- Render: select_case ---
// Full sentence shown with preposition phrase highlighted; choose the case it governs
function _renderSelectCase(ex) {
  const sentDE    = ex.question?.de  || '';
  const sentEN    = ex.question?.en  || '';
  const highlight = ex.question?.highlight || '';
  const options   = _shuffle([ex.correct_answer, ...ex.wrong_answers.slice(0, 3)]);

  // Bold the highlighted phrase inside the German sentence
  let sentHtml = _esc(sentDE);
  if (highlight) {
    const escaped = _esc(highlight);
    sentHtml = sentHtml.replace(escaped,
      `<span class="prep-highlight">${escaped}</span>`);
  }

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Kasus</div>
    </div>
    <div class="exercise-sentence">${sentHtml}</div>
    <div class="exercise-translation" id="ex-translation">${_esc(sentEN)}</div>
    <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);
                margin:-4px var(--sp-5) var(--sp-3);text-align:center;letter-spacing:0.03em">
      Welchen Kasus regiert die hervorgehobene Präposition?
    </div>
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

// --- Render: partizip_ii ---
// Learner types the Partizip II form of the given verb.
function _renderPartizipII(ex) {
  const word = ex.question?.de || ex.word_id.replace(/^verb_/, '');

  let wordHtml = _esc(word);
  const prefixVerb = _findPrefixVerb(word);
  if (prefixVerb) {
    wordHtml = `<span class="prefix">${_esc(prefixVerb.prefix)}</span>${_esc(word.slice(prefixVerb.prefix.length))}`;
  }

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Partizip II</div>
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
      <div class="exercise-word-prompt">WIE LAUTET DAS PARTIZIP II?</div>
    </div>
    <div style="padding: 0 var(--sp-2) var(--sp-4)">
      <input type="text" id="partizip-input" class="partizip-input"
             placeholder="Partizip II eingeben…"
             onkeydown="if(event.key==='Enter') checkPartizipII()"
             autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <button class="check-btn" onclick="checkPartizipII()">Prüfen →</button>
    </div>
    <div class="feedback-text" id="feedback"></div>`;
}

// --- Render: auxiliary_choice ---
// Two-button choice: hat (haben) vs ist (sein).
function _renderAuxiliaryChoice(ex) {
  const word    = ex.question?.de || ex.word_id.replace(/^verb_/, '');
  const options = _shuffle([ex.correct_answer, ...(ex.wrong_answers || []).slice(0, 1)]);

  let wordHtml = _esc(word);
  const prefixVerb = _findPrefixVerb(word);
  if (prefixVerb) {
    wordHtml = `<span class="prefix">${_esc(prefixVerb.prefix)}</span>${_esc(word.slice(prefixVerb.prefix.length))}`;
  }

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Hilfsverb</div>
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
      <div class="exercise-word-prompt">WELCHES HILFSVERB IM PERFEKT?</div>
    </div>
    <div class="options-aux" id="opts">
      ${options.map(opt => `
        <button class="option-btn aux-opt"
                data-answer="${_esc(opt)}"
                onclick="selectAnswer(this)">
          <span class="opt-word">${_esc(opt)}</span>
        </button>`).join('')}
    </div>
    <div class="feedback-text" id="feedback"></div>`;
}

// --- Render: conjugation_table ---
// 6-row table with text inputs; learner fills in all forms at once.
// ex.tense: 'prasens' | 'prateritum' | 'perfekt'
// ex.forms: { ich, du, er_sie_es, wir, ihr, sie_Sie }
function _renderConjugationTable(ex) {
  const word       = ex.question?.de || ex.word_id.replace(/^verb_/, '');
  const tenseLabel = ex.question?.tense_label || '';
  const persons    = ['ich', 'du', 'er_sie_es', 'wir', 'ihr', 'sie_Sie'];
  const display    = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

  let wordHtml = _esc(word);
  const prefixVerb = _findPrefixVerb(word);
  if (prefixVerb) {
    wordHtml = `<span class="prefix">${_esc(prefixVerb.prefix)}</span>${_esc(word.slice(prefixVerb.prefix.length))}`;
  }

  const perfektHint = ex.tense === 'perfekt'
    ? `<div class="exercise-word-prompt" style="margin-top:var(--sp-1);font-size:10px">HILFSVERB + PARTIZIP II</div>` : '';

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">FRAGE ${session.correctCount + 1}</div>
      <div class="exercise-type-label">Tabelle</div>
    </div>
    <div class="exercise-word-display" style="margin-bottom:var(--sp-3)">
      <div class="exercise-word" style="font-size:clamp(1.6rem,6vw,2.4rem)">${wordHtml}</div>
      <div class="exercise-word-prompt">${_esc(tenseLabel.toUpperCase())}</div>
      ${perfektHint}
    </div>
    <div class="conj-table" id="conj-table">
      ${persons.map((p, i) => `
        <div class="conj-row" id="row-${p}">
          <span class="conj-pronoun">${_esc(display[i])}</span>
          <input type="text" class="conj-input" id="input-${p}"
                 autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                 onkeydown="if(event.key==='Enter'){${
                   i < 5
                     ? `document.getElementById('input-${persons[i + 1]}')?.focus()`
                     : 'submitConjugationTable()'
                 };}">
        </div>`).join('')}
    </div>
    <div style="padding: var(--sp-2) var(--sp-2) var(--sp-4)">
      <button class="check-btn" onclick="submitConjugationTable()">Alle prüfen →</button>
    </div>
    <div class="feedback-text" id="feedback"></div>`;
}

// --- Submit: partizip_ii ---
function checkPartizipII() {
  if (session.answered) return;

  const input = document.getElementById('partizip-input');
  if (!input || !input.value.trim()) return;

  const given   = input.value.trim().toLowerCase();
  const correct = (session.current.correct_answer || '').trim().toLowerCase();

  session.answered = true;
  input.disabled   = true;

  const isRight = given === correct;

  if (isRight) {
    input.classList.add('partizip-correct');
    session.correctCount++;
    Progress.recordResult(session.current.exercise_id, true);
    _unlockWord(session.current.word_id);
    _flash('green');
    setTimeout(() => _showNext(), 1500);
  } else {
    input.classList.add('partizip-wrong');

    const fb = document.getElementById('feedback');
    if (fb) {
      fb.innerHTML = `Richtig: <strong>${_esc(session.current.correct_answer)}</strong>`;
      if (session.current.explanation_en) {
        fb.innerHTML += `<br><span style="font-size:0.85em;opacity:0.8">${_esc(session.current.explanation_en)}</span>`;
      }
      fb.style.display = 'block';
    }

    Progress.recordResult(session.current.exercise_id, false);

    const retryKey = session.current.word_id || session.current.exercise_id;
    session.retries[retryKey] = (session.retries[retryKey] || 0) + 1;
    if (session.retries[retryKey] <= 2) session.cooldown.push(session.current);

    _flash('red');
    document.getElementById('next-btn').style.display = 'block';
  }

  _updateChips();
}

// --- Submit: conjugation_table ---
function submitConjugationTable() {
  if (session.answered) return;

  const ex      = session.current;
  const persons = ['ich', 'du', 'er_sie_es', 'wir', 'ihr', 'sie_Sie'];

  // Require all fields filled
  const allFilled = persons.every(p => {
    const v = document.getElementById('input-' + p)?.value.trim();
    return v && v.length > 0;
  });
  if (!allFilled) {
    const fb = document.getElementById('feedback');
    if (fb) { fb.textContent = 'Bitte alle Felder ausfüllen.'; fb.style.display = 'block'; }
    return;
  }

  session.answered = true;

  let allCorrect = true;

  for (const p of persons) {
    const input    = document.getElementById('input-' + p);
    const row      = document.getElementById('row-' + p);
    const expected = (ex.forms[p] || '').toLowerCase();
    const given    = (input?.value.trim() || '').toLowerCase();

    if (input) input.disabled = true;

    if (given === expected) {
      row?.classList.add('row-correct');
      if (input) input.classList.add('partizip-correct');
    } else {
      allCorrect = false;
      row?.classList.add('row-wrong');
      if (input) {
        input.classList.add('partizip-wrong');
        const hint = document.createElement('span');
        hint.className   = 'conj-correct-hint';
        hint.textContent = ex.forms[p];
        input.parentNode.appendChild(hint);
      }
    }
  }

  if (allCorrect) {
    session.correctCount++;
    Progress.recordResult(ex.exercise_id, true);
    _unlockWord(ex.word_id);
    _flash('green');
    setTimeout(() => _showNext(), 1800);
  } else {
    Progress.recordResult(ex.exercise_id, false);

    const retryKey = ex.word_id || ex.exercise_id;
    session.retries[retryKey] = (session.retries[retryKey] || 0) + 1;
    if (session.retries[retryKey] <= 2) session.cooldown.push(ex);

    _flash('red');
    document.getElementById('next-btn').style.display = 'block';
  }

  _updateChips();
}

// --- Answer selection (routes to module or WL handler) ---
function selectAnswer(btn) {
  if (exerciseMode === 'wordlist') { _selectWLAnswer(btn); return; }
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
    // Prepositions have no word unlock mechanic — skip for that module
    if (session.moduleId !== 'module_prepositions') {
      _unlockWord(session.current.word_id);
    }

    // Fill blank (if fill_blank / select_preposition type)
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
    // Use exercise_id as key for prepositions (no word_id); word_id for other modules
    const retryKey = session.current.word_id || session.current.exercise_id;
    session.retries[retryKey] = (session.retries[retryKey] || 0) + 1;
    if (session.retries[retryKey] <= 2) {
      session.cooldown.push(session.current); // back to queue
    } else if (session.moduleId !== 'module_prepositions') {
      Progress.addNeedsReview(retryKey);      // persistent review flag (not for prepositions)
    }

    _flash('red');
    document.getElementById('next-btn').style.display = 'block';
  }

  _updateChips();
}

// Called by the "Weiter →" button
function advanceExercise() {
  if (exerciseMode === 'wordlist') { _showNextWL(); return; }
  _showNext();
}

// Called by the back button inside the exercise screen
function exitExerciseEarly() {
  if (exerciseMode === 'wordlist') {
    exerciseMode = 'module';
    _restoreModuleChips();
    navigateTo('screen-wordlist');
    return;
  }
  returnFromResults();
}

// --- Unlock word on correct answer ---
function _unlockWord(wordId) {
  if (Progress.isUnlocked(wordId)) return;

  const nounEntry = appData.nouns && appData.nouns.find(n => n.id === wordId);
  if (nounEntry) {
    if (nounEntry.section === 'variations') {
      Progress.unlockVariantNoun(wordId);
    } else {
      Progress.unlockRootNoun(wordId);
    }
  } else if (appData.adverbs && appData.adverbs.some(a => a.id === wordId)) {
    Progress.unlockAdverb(wordId);
  } else if (appData.adjectives && appData.adjectives.some(a => a.id === wordId)) {
    Progress.unlockAdjective(wordId);
  } else {
    const isRoot = appData.verbs.some(v => v.id === wordId);
    if (isRoot) {
      Progress.unlockRootVerb(wordId);
    } else {
      Progress.unlockVariant(wordId);
    }
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
  // Clear the full nav stack so home is a clean slate.
  navStack.length = 0;
  const from = document.getElementById(currentScreen);
  const to   = document.getElementById('screen-home');
  from.classList.remove('active');
  to.classList.add('active');
  currentScreen = 'screen-home';
  window.scrollTo(0, 0);
  onScreenEnter('screen-home');
}

function returnFromResults() {
  // Clean exercise and results screens from the stack so pressing back from
  // module-home doesn't loop back to the results screen.
  while (navStack.length && ['screen-exercise', 'screen-results'].includes(navStack[navStack.length - 1])) {
    navStack.pop();
  }
  const from = document.getElementById(currentScreen);
  const to   = document.getElementById('screen-module-home');
  from.classList.remove('active');
  to.classList.add('active');
  currentScreen = 'screen-module-home';
  window.scrollTo(0, 0);
  onScreenEnter('screen-module-home');
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
  const noun = appData.nouns && appData.nouns.find(n => n.id === id);
  if (noun) return `${noun.article} ${noun.word}`;
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

// ═══════════════════════════════════════════════════════
// VERB VERGANGENHEIT SUB-PICKER  (Perfekt / Präteritum)
// ═══════════════════════════════════════════════════════

// Called by verb-tense-picker buttons in index.html
function setVerbTense(tense) {
  session.vergangenheitTense = tense;  // 'perfekt' | 'prateritum'
  _updateVerbTensePicker(tense);

  // Rebuild queue with new sub-tense, preserving session stats
  const exercises = _buildQueue(session.moduleId, session.category);
  session.queue    = _shuffle([...exercises]);
  session.cooldown = [];
  session.current  = null;
  session.answered = false;
  _updateChips();
  _showNext();
}

function _updateVerbTensePicker(tense) {
  const perfektBtn    = document.getElementById('verb-tense-perfekt');
  const prateritumBtn = document.getElementById('verb-tense-prateritum');
  if (perfektBtn)    perfektBtn.classList.toggle('active',    tense === 'perfekt');
  if (prateritumBtn) prateritumBtn.classList.toggle('active', tense === 'prateritum');
}

// ═══════════════════════════════════════════════════════
// VERB META BADGE  (Regular/Irregular + case requirement)
// Injected into the exercise card by _showNext() for all verb exercises.
// ═══════════════════════════════════════════════════════

const _CASE_LABELS = {
  nominative: 'Nominativ',
  accusative: 'Akkusativ',
  dative:     'Dativ',
  genitive:   'Genitiv',
};

function _verbMetaBadge(wordId) {
  let typeStr = null;
  let cases   = [];

  const root = appData.verbs.find(v => v.id === wordId);
  if (root) {
    typeStr = root.type === 'weak' ? 'Regular' : 'Irregular';
    cases   = root.grammar?.case_requirements || [];
  } else {
    // Prefix variant — inherit type and case from parent root
    for (const v of appData.verbs) {
      if ((v.prefix_variants || []).some(pv => pv.id === wordId)) {
        typeStr = v.type === 'weak' ? 'Regular' : 'Irregular';
        cases   = v.grammar?.case_requirements || [];
        break;
      }
    }
  }

  if (!typeStr) return '';

  const caseText  = cases.filter(c => c !== 'none').map(c => _CASE_LABELS[c] || c).join(' + ');
  const caseBadge = caseText
    ? `<span class="verb-case-badge">${_esc(caseText)}</span>` : '';

  return `<div class="verb-meta-badge">
    <span class="verb-type-pill ${typeStr === 'Regular' ? 'regular' : 'irregular'}">${typeStr}</span>
    ${caseBadge}
  </div>`;
}

// ═══════════════════════════════════════════════════════
// PREPOSITION DIFFICULTY PICKER
// ═══════════════════════════════════════════════════════

// Called by diff-btn buttons in index.html
function setPrepositionDifficulty(level) {
  Progress.setPrepositionsDifficulty(level);
  _updateDifficultyPicker(level);

  // Rebuild queue with new difficulty, preserving session stats
  const exercises = _buildQueue('module_prepositions', 'all');
  session.queue   = _shuffle([...exercises]);
  session.cooldown = [];
  session.current  = null;
  session.answered = false;
  _updateChips();
  _showNext();
}

function _updateDifficultyPicker(level) {
  ['A1', 'A2', 'B1', 'B2'].forEach(l => {
    const btn = document.getElementById('diff-' + l);
    if (btn) btn.classList.toggle('active', l === level);
  });
}

// ═══════════════════════════════════════════════════════
// WORD LIST PRACTICE MODE
// ═══════════════════════════════════════════════════════

// --- Entry point (called from wordpractice.js) ---
function startWordListExercise(words) {
  exerciseMode = 'wordlist';

  wlAllWords = words;
  wlSession  = {
    queue:          _shuffle([...words]),
    passCount:      1,
    passTotal:      words.length,
    correctCount:   0,
    incorrectCount: 0,
    current:        null,
    answered:       false
  };

  // Swap chip row for WL-specific labels
  document.getElementById('chip-cooldown-label').textContent = ' Falsch';
  document.getElementById('chip-cooldown-wrap').className    = 'chip';
  document.getElementById('chip-cooldown-icon').innerHTML =
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

  document.getElementById('exercise-context-label').textContent = 'WORTLISTE · ÜBEN';
  _updateWLChips();

  navigateTo('screen-exercise');
  _showNextWL();
}

// --- Restore module chip row on exit ---
function _restoreModuleChips() {
  document.getElementById('chip-cooldown-label').textContent = ' Cooldown';
  document.getElementById('chip-cooldown-wrap').className    = 'chip cooldown';
  document.getElementById('chip-cooldown-icon').innerHTML =
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>';
}

// --- Show next WL question (loops when pass ends) ---
function _showNextWL() {
  if (wlSession.queue.length === 0) {
    // New pass — reshuffle the full pool
    wlSession.passCount++;
    wlSession.queue     = _shuffle([...wlAllWords]);
    wlSession.passTotal = wlSession.queue.length;
  }

  wlSession.current  = wlSession.queue.shift();
  wlSession.answered = false;

  // Progress bar shows current-pass completion
  const done  = wlSession.passTotal - wlSession.queue.length;
  const total = wlSession.passTotal;
  document.getElementById('exercise-progress-fill').style.width =
    total > 0 ? Math.round(done / total * 100) + '%' : '0%';

  document.getElementById('exercise-card').innerHTML =
    _renderWLQuestion(wlSession.current);

  document.getElementById('next-btn').style.display = 'none';
  _updateWLChips();
}

// --- Render a single WL question ---
function _renderWLQuestion(word) {
  const pool         = wlAllWords.filter(w => w.id !== word.id);
  const wrongAnswers = _getWLWrongAnswers(word, pool);
  const options      = _shuffle([word.translation, ...wrongAnswers]);
  const letters      = ['A', 'B', 'C', 'D'];

  // German word display (prefix-colored for verb variants)
  let wordHtml = _esc(word.german);
  if (word.isVariant && word.prefix) {
    wordHtml = `<span class="prefix">${_esc(word.prefix)}</span>${_esc(word.german.slice(word.prefix.length))}`;
  }

  // Pronunciation target: skip article for nouns
  const speakTarget = word.germanBase || word.german;

  // Type badge
  const typeBadge = word.type === 'VERB' && word.isVariant ? 'VERB · VARIATION' : word.type;

  const passDone = wlSession.passTotal - wlSession.queue.length;

  return `
    <div class="exercise-meta">
      <div class="exercise-counter">PASS ${wlSession.passCount} · ${passDone} / ${wlSession.passTotal}</div>
      <div class="exercise-type-label">${_esc(typeBadge)}</div>
    </div>
    <div class="exercise-word-display">
      <div class="exercise-word">${wordHtml}</div>
      <div>
        <button class="pronounce-btn" onclick="_speak('${_esc(speakTarget)}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          Aussprechen
        </button>
      </div>
      <div class="exercise-word-prompt">WAS BEDEUTET DIESES WORT?</div>
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

// --- Generate 3 plausible wrong answers ---
function _getWLWrongAnswers(word, pool) {
  // Same type first — more plausible distractors
  const sameType  = _shuffle(pool.filter(w => w.type === word.type));
  const otherType = _shuffle(pool.filter(w => w.type !== word.type));
  const candidates = [...sameType, ...otherType];

  const wrong = [];
  const seen  = new Set([word.translation.toLowerCase()]);

  for (const c of candidates) {
    const t = c.translation;
    if (!seen.has(t.toLowerCase())) {
      wrong.push(t);
      seen.add(t.toLowerCase());
      if (wrong.length === 3) break;
    }
  }

  // Pad if pool is very small (edge case)
  while (wrong.length < 3) wrong.push('—');

  return wrong;
}

// --- Handle answer in WL mode ---
function _selectWLAnswer(btn) {
  if (wlSession.answered) return;
  wlSession.answered = true;

  const chosen  = btn.dataset.answer;
  const correct = wlSession.current.translation;
  const isRight = chosen === correct;

  document.querySelectorAll('#opts .option-btn').forEach(b => {
    b.style.pointerEvents = 'none';
  });

  Progress.recordWordPractice(wlSession.current.id, isRight);

  if (isRight) {
    btn.classList.add('state-correct');
    wlSession.correctCount++;
    _flash('green');
    _updateWLChips();
    setTimeout(() => _showNextWL(), 1500); // auto-advance on correct

  } else {
    btn.classList.add('state-wrong');
    // Reveal correct answer
    document.querySelectorAll('#opts .option-btn').forEach(b => {
      if (b.dataset.answer === correct) b.classList.add('state-correct');
    });
    wlSession.incorrectCount++;
    _flash('red');
    _updateWLChips();
    document.getElementById('next-btn').style.display = 'block'; // manual advance on wrong
  }
}

// --- Update chips for WL mode ---
function _updateWLChips() {
  document.getElementById('chip-correct').textContent  = wlSession.correctCount;
  document.getElementById('chip-queue').textContent    = wlSession.queue.length;
  document.getElementById('chip-cooldown').textContent = wlSession.incorrectCount;
}

// ═══════════════════════════════════════════════════════
// FIRST EXPOSURE GUARANTEE
// For any word the user hasn't unlocked yet, ensure its translate_word
// exercise appears before other exercise types in the queue.
// ═══════════════════════════════════════════════════════

function _ensureFirstExposure(queue) {
  const unlocked = new Set(Progress.getUnlockedWords());
  const firstSeen = new Set();   // word_ids already "first-exposed" in scan
  const result    = [...queue];

  for (let i = 0; i < result.length; i++) {
    const ex     = result[i];
    const wordId = ex.word_id;
    if (!wordId || unlocked.has(wordId) || firstSeen.has(wordId)) continue;

    firstSeen.add(wordId);

    // First occurrence of this NEW word — must be translate_word
    if (ex.type !== 'translate_word') {
      // Find a translate_word for this word later in the queue
      const twIdx = result.findIndex((e, j) => j > i && e.word_id === wordId && e.type === 'translate_word');
      if (twIdx > 0) {
        const [tw] = result.splice(twIdx, 1);
        result.splice(i, 0, tw);  // insert at current position
      }
      // If no translate_word found, leave as-is (shouldn't happen with current data)
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════

// Pronunciation (also used inline in exercise HTML)
function _speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
