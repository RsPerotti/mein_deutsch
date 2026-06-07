/**
 * WORDLIST.JS — Word list display, search, and word detail sheet
 * Handles: alphabetical grouping, search, bottom sheet, pronunciation
 */

let _wlWords = [];       // cached word objects for current render
let _sheetWord = null;   // currently open word in the detail sheet
let _vlSortMode = 'alpha'; // 'alpha' | 'frequency'

// --- Build word objects from appData + progress ---
function buildWordObjects() {
  const unlocked = Progress.getUnlockedWords();
  const words = [];

  // Nouns
  for (const noun of (appData.nouns || [])) {
    if (unlocked.includes(noun.id)) {
      words.push({
        id:          noun.id,
        german:      noun.word,
        prefix:      null,
        type:        'NOMEN',
        article:     noun.article,
        translation: noun.english,
        level:       _extractLevel(noun.tags),
        examples:    noun.example_sentences || [],
        grammar:     null,
        plural:      noun.plural
      });
    }
  }

  // Adverbs
  for (const adv of (appData.adverbs || [])) {
    if (unlocked.includes(adv.id)) {
      words.push({
        id:          adv.id,
        german:      adv.word,
        prefix:      null,
        type:        'ADVERB',
        article:     null,
        translation: adv.english,
        level:       adv.cefr || null,
        examples:    adv.example_sentences || [],
        grammar:     null
      });
    }
  }

  // Adjectives
  for (const adj of (appData.adjectives || [])) {
    if (unlocked.includes(adj.id)) {
      words.push({
        id:          adj.id,
        german:      adj.word,
        prefix:      null,
        type:        'ADJEKTIV',
        article:     null,
        translation: adj.english,
        level:       adj.cefr || null,
        examples:    adj.example_sentences || [],
        grammar:     null
      });
    }
  }

  // Verbs
  for (const verb of appData.verbs) {
    if (unlocked.includes(verb.id)) {
      words.push({
        id:          verb.id,
        german:      verb.root,
        prefix:      null,
        type:        'VERB',
        article:     null,
        translation: verb.english,
        level:       _extractLevel(verb.tags),
        examples:    verb.example_sentences || [],
        grammar:     verb.grammar || null
      });
    }

    for (const pv of (verb.prefix_variants || [])) {
      if (unlocked.includes(pv.id)) {
        words.push({
          id:          pv.id,
          german:      pv.word,
          prefix:      pv.prefix,
          type:        'VERB · VARIATION',
          article:     null,
          translation: pv.english,
          level:       _extractLevel(verb.tags),
          examples:    [],
          grammar:     null
        });
      }
    }
  }

  return words.sort((a, b) => a.german.localeCompare(b.german, 'de'));
}

function _extractLevel(tags) {
  if (!tags) return null;
  return tags.find(t => /^[ab][12]$/i.test(t) || t === 'c1') || null;
}

// --- Render word list screen ---
function renderWordList() {
  _wlWords = buildWordObjects();

  const totalWords = _countTotalWords();
  document.getElementById('wl-count').textContent  = _wlWords.length;
  document.getElementById('wl-total').textContent  = totalWords;
  document.getElementById('wl-search-count').textContent = _wlWords.length + ' WÖRTER';
  document.getElementById('wl-search').value = '';

  _renderWordListContent(_wlWords);
}

function _countTotalWords() {
  let n = appData.verbs.length + (appData.nouns || []).length + (appData.adverbs || []).length + (appData.adjectives || []).length;
  for (const v of appData.verbs) n += (v.prefix_variants || []).length;
  return n;
}

function _renderWordListContent(words) {
  const container = document.getElementById('wordlist-content');

  if (words.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Noch keine Wörter freigeschaltet.<br>Starte ein Modul, um anzufangen.</p>
      </div>`;
    return;
  }

  // Group by first letter
  const groups = {};
  for (const w of words) {
    const letter = w.german[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(w);
  }

  container.innerHTML = Object.keys(groups).sort().map(letter => `
    <div class="alpha-section">
      <div class="alpha-header">${letter}</div>
      <div class="word-list-group">
        ${groups[letter].map(_renderWordItem).join('')}
      </div>
    </div>
  `).join('');
}

function _renderWordItem(word) {
  const germanHtml = word.prefix
    ? `<span class="word-german"><span class="prefix">${word.prefix}</span>${word.german.slice(word.prefix.length)}</span>`
    : `<span class="word-german">${word.german}</span>`;

  const articleHtml = word.article ? `<span class="word-article">${word.article}</span>` : '';

  return `
    <div class="word-item" onclick="openWordSheet('${word.id}')">
      <div class="word-item-main">
        ${articleHtml}
        ${germanHtml}
      </div>
      <span class="word-translation">${word.translation}</span>
      <span class="word-item-arrow">›</span>
    </div>`;
}

// --- Search ---
function filterWordList(query) {
  const q = query.toLowerCase().trim();
  const filtered = q
    ? _wlWords.filter(w =>
        w.german.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q))
    : _wlWords;

  document.getElementById('wl-search-count').textContent = filtered.length + ' WÖRTER';
  _renderWordListContent(filtered);
}

// --- Word detail sheet ---
function openWordSheet(wordId) {
  _sheetWord = _wlWords.find(w => w.id === wordId);
  if (!_sheetWord) return;

  const w = _sheetWord;

  // Word display (prefix-colored for variants)
  const wordHtml = w.prefix
    ? `<span class="prefix">${w.prefix}</span>${w.german.slice(w.prefix.length)}`
    : w.german;

  document.getElementById('sheet-word').innerHTML  = wordHtml;
  let metaText = w.type + (w.level ? ` · ${w.level.toUpperCase()}` : '');
  if (w.type === 'NOMEN' && w.plural) metaText += ` · Pl: ${w.plural}`;
  document.getElementById('sheet-meta').textContent = metaText;
  document.getElementById('sheet-translation').textContent = w.translation;

  // Examples
  const exEl = document.getElementById('sheet-examples');
  if (w.examples.length > 0) {
    exEl.innerHTML = w.examples.map(ex => `
      <div class="example-card">
        <div class="example-de">${ex.de}</div>
        <div class="example-en">${ex.en}</div>
      </div>`).join('');
  } else {
    exEl.innerHTML = `<div style="color:var(--color-text-muted);font-size:var(--font-size-sm)">
      Keine Beispiele verfügbar.</div>`;
  }

  document.getElementById('sheet-overlay').classList.add('visible');
  document.getElementById('word-sheet').classList.add('open');
}

function closeWordSheet() {
  document.getElementById('sheet-overlay').classList.remove('visible');
  document.getElementById('word-sheet').classList.remove('open');
  _sheetWord = null;
}

function pronounceSheetWord() {
  if (!_sheetWord) return;
  _speak(_sheetWord.german);
}

// --- Verbliste (Verb Reference, Section 11.5) ---
function renderVerbliste() {
  const unlockedRoots = Progress.getUnlockedRootVerbs();
  let verbs = appData.verbs.filter(v => unlockedRoots.includes(v.id));

  _vlSortMode === 'alpha'
    ? verbs.sort((a, b) => a.root.localeCompare(b.root, 'de'))
    : verbs.sort((a, b) => (a.frequency_rank || 999) - (b.frequency_rank || 999));

  document.getElementById('vl-sort-btn').textContent = _vlSortMode === 'alpha' ? 'A–Z' : '#';
  _renderVerblisteContent(verbs);
}

function filterVerbList(query) {
  const q = query.toLowerCase().trim();
  const unlockedRoots = Progress.getUnlockedRootVerbs();
  let verbs = appData.verbs.filter(v => unlockedRoots.includes(v.id));

  if (q) {
    verbs = verbs.filter(v => {
      if (v.root.toLowerCase().includes(q) || v.english.toLowerCase().includes(q)) return true;
      return (v.prefix_variants || []).some(pv =>
        pv.word.toLowerCase().includes(q) || pv.english.toLowerCase().includes(q));
    });
  }

  _renderVerblisteContent(verbs);
}

function toggleVerbSort() {
  _vlSortMode = _vlSortMode === 'alpha' ? 'frequency' : 'alpha';
  renderVerbliste();
}

function _renderVerblisteContent(verbs) {
  const container = document.getElementById('verbliste-content');

  if (verbs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <p>Noch keine Verben freigeschaltet.</p>
      </div>`;
    return;
  }

  container.innerHTML = verbs.map(verb => {
    const unlockedVariants = Progress.getUnlockedVariants();
    const variants = (verb.prefix_variants || []).filter(pv => unlockedVariants.includes(pv.id));
    const c = verb.conjugation;

    return `
      <div class="card verb-card">
        <div class="verb-card-header" onclick="toggleVerbCard('${verb.id}')">
          <div>
            <span class="verb-card-title">${verb.root}</span>
            <span class="verb-card-en"> — ${verb.english}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);
                         text-transform:uppercase;letter-spacing:0.04em">${verb.type || ''}</span>
            <svg id="vl-arr-${verb.id}" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                 stroke-linejoin="round" style="color:var(--color-text-muted);transition:transform 0.2s">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        <div class="verb-detail" id="vl-det-${verb.id}">
          ${c ? `
            <div class="label mt-3" style="margin-bottom:var(--sp-2)">Konjugation (Präsens)</div>
            <div class="conj-grid">
              <div><span class="pronoun">ich</span> <strong>${c.present?.ich || '—'}</strong></div>
              <div><span class="pronoun">wir</span> <strong>${c.present?.wir || '—'}</strong></div>
              <div><span class="pronoun">du</span> <strong>${c.present?.du || '—'}</strong></div>
              <div><span class="pronoun">ihr</span> <strong>${c.present?.ihr || '—'}</strong></div>
              <div><span class="pronoun">er/sie/es</span> <strong>${c.present?.er_sie_es || '—'}</strong></div>
              <div><span class="pronoun">sie/Sie</span> <strong>${c.present?.sie_Sie || '—'}</strong></div>
            </div>
            <div style="margin-top:var(--sp-3);font-size:var(--font-size-sm);
                        background:var(--color-surface-2);padding:10px 12px;
                        border-radius:var(--r-md)">
              Perfekt: <strong>${c.auxiliary === 'sein' ? 'ist' : 'hat'} ${c.past_participle || '—'}</strong>
              <span style="color:var(--color-text-muted);margin-left:8px">(${c.auxiliary || '?'})</span>
            </div>` : ''}

          ${verb.grammar ? `
            <div class="grammar-box mt-3">
              <div class="label" style="margin-bottom:4px">Kasus</div>
              ${verb.grammar.notes_en || ''}
            </div>` : ''}

          ${variants.length > 0 ? `
            <div class="label mt-4" style="margin-bottom:var(--sp-2)">Freigeschaltete Variationen</div>
            ${variants.map(pv => `
              <div class="variant-row">
                <span>• <span class="variant-word">${pv.word}</span></span>
                <span style="color:var(--color-text-secondary)">${pv.english}</span>
                <span class="tag">${pv.separable ? 'TRENNBAR' : 'UNTRENNBAR'}</span>
              </div>`).join('')}` : ''}
        </div>
      </div>`;
  }).join('');
}

function toggleVerbCard(verbId) {
  const det = document.getElementById(`vl-det-${verbId}`);
  const arr = document.getElementById(`vl-arr-${verbId}`);
  const isOpen = det.classList.contains('open');
  det.classList.toggle('open', !isOpen);
  arr.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// --- Shared pronunciation helper ---
function _speak(text) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'de-DE';
  utter.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}
