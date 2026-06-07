/**
 * WORDPRACTICE.JS — Word List Practice: Class Picker
 * Handles the class-selection screen before the practice starts.
 * The exercise itself runs inside screen-exercise via exercises.js.
 */

// Classes available for selection (extend this as new modules are added)
const WLP_CLASSES = [
  { id: 'verbs',   label: 'Verben',    sublabel: 'Stammverben & Variationen', emoji: '🔤' },
  { id: 'nouns',   label: 'Nomen',     sublabel: 'Mit Artikel',               emoji: '📦' },
  { id: 'adverbs', label: 'Adverbien', sublabel: 'Zeitlich, modal, lokal…',   emoji: '📍' },
];

let _wlpSelected = new Set();

// --- Entry point ---
function openWLPicker() {
  const unlocked = Progress.getUnlockedWords();

  // Default: select all classes that have at least one unlocked word
  _wlpSelected = new Set();
  for (const cls of WLP_CLASSES) {
    if (_wlpWordsForClass(cls.id, unlocked).length > 0) {
      _wlpSelected.add(cls.id);
    }
  }

  _renderWLPicker();
  navigateTo('screen-wl-picker');
}

// --- Render picker chips ---
function _renderWLPicker() {
  const unlocked = Progress.getUnlockedWords();
  const container = document.getElementById('wlp-classes');

  container.innerHTML = WLP_CLASSES.map(cls => {
    const words = _wlpWordsForClass(cls.id, unlocked);
    if (words.length === 0) return ''; // hide classes with nothing unlocked

    const isSelected = _wlpSelected.has(cls.id);
    return `
      <div class="wlp-class-chip${isSelected ? ' selected' : ''}"
           onclick="toggleWLClass('${cls.id}')">
        <span class="wlp-chip-emoji">${cls.emoji}</span>
        <div class="wlp-chip-info">
          <div class="wlp-chip-label">${cls.label}</div>
          <div class="wlp-chip-sublabel">${words.length} Wörter · ${cls.sublabel}</div>
        </div>
        <div class="wlp-chip-check${isSelected ? ' visible' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>`;
  }).join('');

  _updateWLPCount();
}

// --- Toggle a class on/off ---
function toggleWLClass(cls) {
  if (_wlpSelected.has(cls)) {
    _wlpSelected.delete(cls);
  } else {
    _wlpSelected.add(cls);
  }
  _renderWLPicker();
}

// --- Update the count label and start button state ---
function _updateWLPCount() {
  const unlocked = Progress.getUnlockedWords();
  let total = 0;
  for (const cls of _wlpSelected) {
    total += _wlpWordsForClass(cls, unlocked).length;
  }

  document.getElementById('wlp-count').textContent =
    total > 0 ? `${total} Wörter ausgewählt` : 'Keine Wörter ausgewählt';

  const btn = document.getElementById('wlp-start-btn');
  btn.disabled = total === 0;
  btn.style.opacity = total === 0 ? '0.4' : '1';
}

// --- Build word pool for a given class ---
function _wlpWordsForClass(cls, unlocked) {
  const words = [];

  if (cls === 'verbs') {
    for (const verb of (appData.verbs || [])) {
      if (unlocked.includes(verb.id)) {
        words.push({
          id:          verb.id,
          german:      verb.root,
          translation: verb.english,
          type:        'VERB',
          isVariant:   false
        });
      }
      for (const pv of (verb.prefix_variants || [])) {
        if (unlocked.includes(pv.id)) {
          words.push({
            id:          pv.id,
            german:      pv.word,
            translation: pv.english,
            type:        'VERB',
            isVariant:   true,
            prefix:      pv.prefix
          });
        }
      }
    }

  } else if (cls === 'nouns') {
    for (const noun of (appData.nouns || [])) {
      if (unlocked.includes(noun.id)) {
        words.push({
          id:          noun.id,
          german:      noun.article + ' ' + noun.word,
          germanBase:  noun.word,
          translation: noun.english,
          type:        'NOMEN',
          isVariant:   false
        });
      }
    }

  } else if (cls === 'adverbs') {
    for (const adv of (appData.adverbs || [])) {
      if (unlocked.includes(adv.id)) {
        words.push({
          id:          adv.id,
          german:      adv.word,
          translation: adv.english,
          type:        'ADVERB',
          isVariant:   false
        });
      }
    }
  }

  return words;
}

// --- Launch the exercise (hands off to exercises.js) ---
function startWLPractice() {
  if (_wlpSelected.size === 0) return;

  const unlocked = Progress.getUnlockedWords();
  const allWords = [];
  for (const cls of _wlpSelected) {
    allWords.push(..._wlpWordsForClass(cls, unlocked));
  }

  if (allWords.length === 0) return;

  startWordListExercise(allWords);
}
