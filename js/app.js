/**
 * APP.JS — Core: navigation router, data loading, screen renderers
 * Stack-based router: each screen is a div toggled .active.
 * Global state held in simple variables (no framework needed).
 */

// --- Navigation state ---
const navStack     = [];
let   currentScreen = 'screen-home';
let   currentModuleId = null;        // set before navigating to module-home
let   currentExerciseState = null;   // set before navigating to exercise

// --- App data (populated on load) ---
const appData = {
  modules:      [],
  verbs:        [],
  nouns:        [],
  adverbs:      [],
  adjectives:   [],
  prepositions: [],
  exercises:    {}   // keyed by moduleId e.g. 'module_verbs'
};

// ─────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────

function navigateTo(screenId) {
  if (screenId === currentScreen) return;
  const from = document.getElementById(currentScreen);
  const to   = document.getElementById(screenId);
  if (!from || !to) { console.warn('Unknown screen:', screenId); return; }

  from.classList.remove('active');
  to.classList.add('active');
  navStack.push(currentScreen);
  currentScreen = screenId;

  window.scrollTo(0, 0);
  onScreenEnter(screenId);
}

function navigateBack() {
  if (navStack.length === 0) return;
  const prev  = navStack.pop();
  const from  = document.getElementById(currentScreen);
  const to    = document.getElementById(prev);
  from.classList.remove('active');
  to.classList.add('active');
  currentScreen = prev;

  window.scrollTo(0, 0);
  onScreenEnter(prev);
}

function onScreenEnter(screenId) {
  switch (screenId) {
    case 'screen-home':        renderHome();                            break;
    case 'screen-wordlist':    renderWordList();                        break;
    case 'screen-module-home': renderModuleHome(currentModuleId);       break;
    case 'screen-exercise':    startExercise(currentExerciseState);     break;
    case 'screen-verbliste':   renderVerbliste();                       break;
    case 'screen-nomenliste':  renderNomenliste();                      break;
    case 'screen-adverbliste':     renderAdverbliste();                  break;
    case 'screen-adjektivliste':       renderAdjektivliste();             break;
    case 'screen-prapositionsliste':   renderPrapositionsliste();         break;
    case 'screen-results':             /* rendered by exercises.js */     break;
  }
}

// Convenience: open a module (avoids passing objects through HTML attrs)
function openModule(moduleId) {
  currentModuleId = moduleId;
  navigateTo('screen-module-home');
}

// Convenience: start an exercise session
function openExercise(moduleId, category) {
  currentExerciseState = { moduleId, category };
  navigateTo('screen-exercise');
}

// ─────────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────────

async function loadData() {
  // Data is embedded via js/data.js (window.APP_DATA) — no fetch needed.
  // This works with file://, localhost, and GitHub Pages equally.
  const d = window.APP_DATA || {};
  appData.modules                           = d.modules               || [];
  appData.verbs                             = d.verbs                 || [];
  appData.nouns                             = d.nouns                 || [];
  appData.adverbs                           = d.adverbs               || [];
  appData.adjectives                        = d.adjectives            || [];
  appData.exercises['module_verbs']         = d.exercises_verbs       || (d.exercises || {}).module_verbs || [];
  appData.exercises['module_nouns']         = d.exercises_nouns       || [];
  appData.exercises['module_adverbs']       = d.exercises_adverbs     || [];
  appData.exercises['module_adjectives']    = d.exercises_adjectives   || [];
  appData.prepositions                      = d.prepositions            || [];
  appData.exercises['module_prepositions']  = d.exercises_prepositions  || [];
}

// ─────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────

function renderHome() {
  const unlocked   = Progress.getUnlockedWords();
  const totalWords = _totalWordCount();
  const pct        = totalWords > 0 ? Math.round(unlocked.length / totalWords * 100) : 0;

  // Hero card stats
  document.getElementById('home-unlocked-count').textContent = unlocked.length;
  document.getElementById('home-total-count').textContent    = totalWords;
  document.getElementById('home-progress-fill').style.width  = pct + '%';

  // Recent words
  const recentEl = document.getElementById('home-recent-words');
  if (unlocked.length > 0) {
    const labels = unlocked.slice(-3).map(_wordLabel).filter(Boolean);
    recentEl.innerHTML = `<span style="opacity:.7">Zuletzt: </span><strong>${labels.join(', ')}</strong>`;
  } else {
    recentEl.textContent = '';
  }

  // Streak
  document.getElementById('home-streak').textContent = Progress.getStreak();

  // Module cards
  _renderModuleCards();
}

function _totalWordCount() {
  let n = appData.verbs.length + appData.nouns.length + appData.adverbs.length + appData.adjectives.length;
  for (const v of appData.verbs) n += (v.prefix_variants || []).length;
  return n;
}

function _wordLabel(id) {
  const noun = appData.nouns.find(n => n.id === id);
  if (noun) return `${noun.article} ${noun.word}`;
  const adv = appData.adverbs.find(a => a.id === id);
  if (adv) return adv.word;
  const adj = appData.adjectives.find(a => a.id === id);
  if (adj) return adj.word;
  const root = appData.verbs.find(v => v.id === id);
  if (root) return root.root;
  for (const v of appData.verbs) {
    const pv = (v.prefix_variants || []).find(p => p.id === id);
    if (pv) return pv.word;
  }
  return null;
}

function _renderModuleCards() {
  const container = document.getElementById('home-modules-list');
  const activeCount = appData.modules.filter(m => m.status === 'active').length;

  document.getElementById('home-modules-label').textContent =
    `${activeCount} von ${appData.modules.length} verfügbar`;

  container.innerHTML = appData.modules.map((mod, idx) => {
    const num    = String(idx + 1).padStart(2, '0');
    const locked = mod.status !== 'active';

    return `
      <button class="module-card ${locked ? 'locked' : ''}"
              onclick="${locked ? '' : `openModule('${mod.id}')`}"
              ${locked ? 'disabled' : ''}>
        <div class="module-number-badge">${num}</div>
        <div class="module-card-content">
          <div class="module-card-eyebrow">Modul ${num}</div>
          <div class="module-card-title">${mod.title_en}</div>
          <div class="module-card-desc">${mod.description_en || ''}</div>
        </div>
        ${locked
          ? `<span style="color:var(--color-text-muted);font-size:18px">🔒</span>`
          : `<div class="module-card-arrow">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                 <polyline points="9 18 15 12 9 6"/>
               </svg>
             </div>`}
      </button>`;
  }).join('');
}

// ─────────────────────────────────────────
// MODULE HOME (Section 11.1)
// ─────────────────────────────────────────

function renderModuleHome(moduleId) {
  if (!moduleId) return;
  const mod = appData.modules.find(m => m.id === moduleId);
  if (!mod) return;

  const idx = appData.modules.indexOf(mod);
  document.getElementById('module-nav-context').textContent =
    'Modul ' + String(idx + 1).padStart(2, '0');
  document.getElementById('module-title').textContent       = mod.title_en;
  document.getElementById('module-description').textContent = mod.description_en || '';

  if (moduleId === 'module_verbs') {
    _renderVerbModuleCategories();
  } else if (moduleId === 'module_nouns') {
    _renderNounModuleCategories();
  } else if (moduleId === 'module_adverbs') {
    _renderAdverbModuleCategories();
  } else if (moduleId === 'module_adjectives') {
    _renderAdjectiveModuleCategories();
  } else if (moduleId === 'module_prepositions') {
    _renderPrepositionModuleCategories();
  }
}

function _renderVerbModuleCategories() {
  const rootUnlocked = Progress.getUnlockedRootVerbs().length;
  const rootTotal    = appData.verbs.length;
  const varUnlocked  = Progress.getUnlockedVariants().length;
  const varTotal     = appData.verbs.reduce((n, v) => n + (v.prefix_variants || []).length, 0);

  const totalUnlocked = rootUnlocked + varUnlocked;
  const totalAll      = rootTotal + varTotal;
  const pct = totalAll > 0 ? Math.round(totalUnlocked / totalAll * 100) : 0;

  document.getElementById('module-progress-count').textContent = `${totalUnlocked} / ${totalAll}`;
  document.getElementById('module-progress-fill').style.width  = pct + '%';

  const varLocked  = rootUnlocked === 0;
  const rootPct    = rootTotal  > 0 ? Math.round(rootUnlocked  / rootTotal  * 100) : 0;
  const varPct     = varTotal   > 0 ? Math.round(varUnlocked   / varTotal   * 100) : 0;

  document.getElementById('module-categories').innerHTML = `
    <!-- Section label -->
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <!-- Category pair: Stammverben + Variationen -->
    <div class="category-pair">
      <div class="category-card" onclick="openExercise('module_verbs','roots')">
        <div class="category-card-title">Stammverben</div>
        <div class="category-card-subtitle">Root verbs</div>
        <div class="category-card-count mt-3">${rootUnlocked} / ${rootTotal} gelernt</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${rootPct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>

      <div class="category-card ${varLocked ? 'locked' : ''}"
           onclick="${varLocked ? '' : "openExercise('module_verbs','variants')"}">
        <div class="category-card-title"
             style="${varLocked ? 'color:var(--color-text-muted)' : ''}">Variationen</div>
        <div class="category-card-subtitle">Prefix verbs</div>
        ${varLocked
          ? `<div style="margin-top:var(--sp-3);font-size:20px">🔒</div>
             <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:var(--sp-2);line-height:1.4">
               Unlock by practising Stammverben first</div>`
          : `<div class="category-card-count mt-3">${varUnlocked} / ${varTotal} gelernt</div>
             <div class="progress-bar mt-2">
               <div class="progress-fill" style="width:${varPct}%"></div>
             </div>
             <div class="category-card-cta">Üben →</div>`}
      </div>
    </div>

    <!-- Verbliste link -->
    <div class="card mt-3" style="cursor:pointer" onclick="navigateTo('screen-verbliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:var(--fw-bold)">Verbliste</div>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:2px">
            Freigeschaltete Verben nachschlagen</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// MODULE HOME — NOUNS
// ─────────────────────────────────────────

function _renderNounModuleCategories() {
  const rootTotal    = appData.nouns.filter(n => n.section === 'roots').length;
  const varTotal     = appData.nouns.filter(n => n.section === 'variations').length;
  const rootUnlocked = Progress.getUnlockedRootNouns().length;
  const varUnlocked  = Progress.getUnlockedVariantNouns().length;

  const totalUnlocked = rootUnlocked + varUnlocked;
  const totalAll      = rootTotal + varTotal;
  const pct = totalAll > 0 ? Math.round(totalUnlocked / totalAll * 100) : 0;

  document.getElementById('module-progress-count').textContent = `${totalUnlocked} / ${totalAll}`;
  document.getElementById('module-progress-fill').style.width  = pct + '%';

  const varLocked = rootUnlocked === 0;
  const rootPct   = rootTotal > 0 ? Math.round(rootUnlocked / rootTotal * 100) : 0;
  const varPct    = varTotal  > 0 ? Math.round(varUnlocked  / varTotal  * 100) : 0;

  document.getElementById('module-categories').innerHTML = `
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <!-- Category pair: Stammnomen + Variationen -->
    <div class="category-pair">
      <div class="category-card" onclick="openExercise('module_nouns','roots')">
        <div class="category-card-title">Stammnomen</div>
        <div class="category-card-subtitle">Root nouns</div>
        <div class="category-card-count mt-3">${rootUnlocked} / ${rootTotal} gelernt</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${rootPct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>

      <div class="category-card ${varLocked ? 'locked' : ''}"
           onclick="${varLocked ? '' : "openExercise('module_nouns','variants')"}">
        <div class="category-card-title"
             style="${varLocked ? 'color:var(--color-text-muted)' : ''}">Variationen</div>
        <div class="category-card-subtitle">Compound &amp; derived nouns</div>
        ${varLocked
          ? `<div style="margin-top:var(--sp-3);font-size:20px">🔒</div>
             <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:var(--sp-2);line-height:1.4">
               Unlock by practising Stammnomen first</div>`
          : `<div class="category-card-count mt-3">${varUnlocked} / ${varTotal} gelernt</div>
             <div class="progress-bar mt-2">
               <div class="progress-fill" style="width:${varPct}%"></div>
             </div>
             <div class="category-card-cta">Üben →</div>`}
      </div>
    </div>

    <!-- Nomenliste link -->
    <div class="card mt-3" style="cursor:pointer" onclick="navigateTo('screen-nomenliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:var(--fw-bold)">Nomenliste</div>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:2px">
            Freigeschaltete Nomen nachschlagen</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// NOMENLISTE (Noun Reference)
// ─────────────────────────────────────────

function renderNomenliste() {
  const unlockedIds = new Set(Progress.getUnlockedNouns());
  let nouns = appData.nouns.filter(n => unlockedIds.has(n.id));
  nouns.sort((a, b) => a.word.localeCompare(b.word, 'de'));

  const container = document.getElementById('nomenliste-content');

  if (nouns.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <p>Noch keine Nomen freigeschaltet.</p>
      </div>`;
    return;
  }

  container.innerHTML = nouns.map(noun => `
    <div class="card verb-card">
      <div class="verb-card-header" onclick="toggleNounCard('${noun.id}')">
        <div>
          <span class="tag" style="margin-right:6px;background:${_articleColor(noun.article)};color:#fff">
            ${noun.article}</span>
          <span class="verb-card-title">${noun.word}</span>
          <span class="verb-card-en"> — ${noun.english}</span>
        </div>
        <svg id="nl-arr-${noun.id}" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
             stroke-linejoin="round" style="color:var(--color-text-muted);transition:transform 0.2s">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="verb-detail" id="nl-det-${noun.id}">
        ${noun.section === 'variations' && noun.formation ? `
          <div style="margin-top:var(--sp-3);font-size:var(--font-size-sm);color:var(--color-text-secondary)">
            <span style="font-weight:var(--fw-medium)">Bildung:</span>
            <span style="font-family:monospace;background:var(--color-bg-secondary);padding:2px 6px;border-radius:4px;margin-left:4px">${noun.formation}</span>
          </div>` : ''}
        <div class="conj-grid mt-3" style="grid-template-columns:1fr 1fr">
          <div><span class="pronoun">Singular</span> <strong>${noun.article} ${noun.word}</strong></div>
          <div><span class="pronoun">Plural</span> <strong>${noun.plural_article || 'die'} ${noun.plural}</strong></div>
          <div><span class="pronoun">Genitiv</span> <strong>${noun.genitive || '—'}</strong></div>
        </div>
        ${noun.example_sentences && noun.example_sentences.length > 0 ? `
          <div class="label mt-3" style="margin-bottom:var(--sp-2)">Beispiele</div>
          ${noun.example_sentences.map(ex => `
            <div class="example-card">
              <div class="example-de">${ex.de}</div>
              <div class="example-en">${ex.en}</div>
            </div>`).join('')}` : ''}
      </div>
    </div>`).join('');
}

function toggleNounCard(nounId) {
  const det = document.getElementById(`nl-det-${nounId}`);
  const arr = document.getElementById(`nl-arr-${nounId}`);
  const isOpen = det.classList.contains('open');
  det.classList.toggle('open', !isOpen);
  arr.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function filterNounList(query) {
  const q = query.toLowerCase().trim();
  const unlockedIds = new Set(Progress.getUnlockedNouns());
  let nouns = appData.nouns.filter(n => unlockedIds.has(n.id));
  if (q) {
    nouns = nouns.filter(n =>
      n.word.toLowerCase().includes(q) || n.english.toLowerCase().includes(q));
  }
  nouns.sort((a, b) => a.word.localeCompare(b.word, 'de'));

  const container = document.getElementById('nomenliste-content');
  if (nouns.length === 0) {
    container.innerHTML = `<div style="color:var(--color-text-muted);padding:var(--sp-4)">
      Keine Ergebnisse.</div>`;
    return;
  }
  // Re-render (reuse renderNomenliste logic via temp override)
  const saved = Progress.getUnlockedNouns;
  container.innerHTML = nouns.map(noun => `
    <div class="card verb-card">
      <div class="verb-card-header" onclick="toggleNounCard('${noun.id}')">
        <div>
          <span class="tag" style="margin-right:6px;background:${_articleColor(noun.article)};color:#fff">
            ${noun.article}</span>
          <span class="verb-card-title">${noun.word}</span>
          <span class="verb-card-en"> — ${noun.english}</span>
        </div>
        <svg id="nl-arr-${noun.id}" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
             stroke-linejoin="round" style="color:var(--color-text-muted);transition:transform 0.2s">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="verb-detail" id="nl-det-${noun.id}">
        ${noun.section === 'variations' && noun.formation ? `
          <div style="margin-top:var(--sp-3);font-size:var(--font-size-sm);color:var(--color-text-secondary)">
            <span style="font-weight:var(--fw-medium)">Bildung:</span>
            <span style="font-family:monospace;background:var(--color-bg-secondary);padding:2px 6px;border-radius:4px;margin-left:4px">${noun.formation}</span>
          </div>` : ''}
        <div class="conj-grid mt-3" style="grid-template-columns:1fr 1fr">
          <div><span class="pronoun">Singular</span> <strong>${noun.article} ${noun.word}</strong></div>
          <div><span class="pronoun">Plural</span> <strong>${noun.plural_article || 'die'} ${noun.plural}</strong></div>
          <div><span class="pronoun">Genitiv</span> <strong>${noun.genitive || '—'}</strong></div>
        </div>
        ${noun.example_sentences && noun.example_sentences.length > 0 ? `
          <div class="label mt-3" style="margin-bottom:var(--sp-2)">Beispiele</div>
          ${noun.example_sentences.map(ex => `
            <div class="example-card">
              <div class="example-de">${ex.de}</div>
              <div class="example-en">${ex.en}</div>
            </div>`).join('')}` : ''}
      </div>
    </div>`).join('');
}

// Article badge colours (gender-coded: der=blue, die=red, das=green)
function _articleColor(article) {
  if (article === 'der') return '#4A7FC1';
  if (article === 'die') return '#C14A4A';
  if (article === 'das') return '#4A8C4A';
  return '#888';
}

// ─────────────────────────────────────────
// MODULE HOME — ADVERBS
// ─────────────────────────────────────────

function _renderAdverbModuleCategories() {
  const total    = appData.adverbs.length;
  const unlocked = Progress.getUnlockedAdverbs().length;
  const pct      = total > 0 ? Math.round(unlocked / total * 100) : 0;

  document.getElementById('module-progress-count').textContent = `${unlocked} / ${total}`;
  document.getElementById('module-progress-fill').style.width  = pct + '%';

  document.getElementById('module-categories').innerHTML = `
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <div class="category-pair">
      <div class="category-card" style="grid-column:1/-1"
           onclick="openExercise('module_adverbs','all')">
        <div class="category-card-title">Adverbien üben</div>
        <div class="category-card-subtitle">Frequency, time, certainty &amp; more</div>
        <div class="category-card-count mt-3">${unlocked} / ${total} gelernt</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>
    </div>

    <div class="card mt-3" style="cursor:pointer" onclick="navigateTo('screen-adverbliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:var(--fw-bold)">Adverbliste</div>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:2px">
            Freigeschaltete Adverbien nachschlagen</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// ADVERBLISTE (Adverb Reference)
// ─────────────────────────────────────────

function renderAdverbliste() {
  const unlockedIds = new Set(Progress.getUnlockedAdverbs());
  let adverbs = appData.adverbs.filter(a => unlockedIds.has(a.id));
  adverbs.sort((a, b) => a.word.localeCompare(b.word, 'de'));

  const container = document.getElementById('adverbliste-content');

  if (adverbs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <p>Noch keine Adverbien freigeschaltet.</p>
      </div>`;
    return;
  }

  container.innerHTML = _renderAdverbCards(adverbs);
}

function _renderAdverbCards(adverbs) {
  return adverbs.map(adv => `
    <div class="card verb-card">
      <div class="verb-card-header" onclick="toggleAdverbCard('${adv.id}')">
        <div>
          <span class="tag" style="margin-right:6px;background:var(--color-green-dark);color:#fff;font-size:var(--font-size-xs);padding:2px 7px;border-radius:4px">
            ${adv.cefr}</span>
          <span class="verb-card-title">${adv.word}</span>
          <span class="verb-card-en"> — ${adv.english}</span>
        </div>
        <svg id="al-arr-${adv.id}" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
             stroke-linejoin="round" style="color:var(--color-text-muted);transition:transform 0.2s">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="verb-detail" id="al-det-${adv.id}">
        <div style="margin-top:var(--sp-3);font-size:var(--font-size-sm);color:var(--color-text-muted)">
          ${adv.category}${adv.register && adv.register !== 'Neutral' ? ' · ' + adv.register : ''}
        </div>
        ${adv.example_sentences && adv.example_sentences.length > 0 ? `
          <div class="label mt-3" style="margin-bottom:var(--sp-2)">Beispiele</div>
          ${adv.example_sentences.map(ex => `
            <div class="example-card">
              <div class="example-de">${ex.de}</div>
              <div class="example-en">${ex.en}</div>
            </div>`).join('')}` : ''}
      </div>
    </div>`).join('');
}

function toggleAdverbCard(advId) {
  const det = document.getElementById(`al-det-${advId}`);
  const arr = document.getElementById(`al-arr-${advId}`);
  const isOpen = det.classList.contains('open');
  det.classList.toggle('open', !isOpen);
  arr.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function filterAdverbList(query) {
  const q = query.toLowerCase().trim();
  const unlockedIds = new Set(Progress.getUnlockedAdverbs());
  let adverbs = appData.adverbs.filter(a => unlockedIds.has(a.id));
  if (q) {
    adverbs = adverbs.filter(a =>
      a.word.toLowerCase().includes(q) ||
      a.english.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q));
  }
  adverbs.sort((a, b) => a.word.localeCompare(b.word, 'de'));

  const container = document.getElementById('adverbliste-content');
  if (adverbs.length === 0) {
    container.innerHTML = `<div style="color:var(--color-text-muted);padding:var(--sp-4)">
      Keine Ergebnisse.</div>`;
    return;
  }
  container.innerHTML = _renderAdverbCards(adverbs);
}

// ─────────────────────────────────────────
// MODULE HOME — ADJECTIVES
// ─────────────────────────────────────────

function _renderAdjectiveModuleCategories() {
  const total    = appData.adjectives.length;
  const unlocked = Progress.getUnlockedAdjectives().length;
  const pct      = total > 0 ? Math.round(unlocked / total * 100) : 0;

  document.getElementById('module-progress-count').textContent = `${unlocked} / ${total}`;
  document.getElementById('module-progress-fill').style.width  = pct + '%';

  document.getElementById('module-categories').innerHTML = `
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <!-- Two category cards: Grundformen (active) + Deklinationen (placeholder) -->
    <div class="category-pair">
      <div class="category-card" onclick="openExercise('module_adjectives','all')">
        <div class="category-card-title">Grundformen</div>
        <div class="category-card-subtitle">Meanings &amp; vocabulary</div>
        <div class="category-card-count mt-3">${unlocked} / ${total} gelernt</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>

      <div class="category-card locked">
        <div class="category-card-title" style="color:var(--color-text-muted)">Deklinationen</div>
        <div class="category-card-subtitle">Gender &amp; case forms</div>
        <div style="margin-top:var(--sp-3);font-size:20px">🔒</div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:var(--sp-2);line-height:1.4">
          Coming soon</div>
      </div>
    </div>

    <!-- Adjektivliste link -->
    <div class="card mt-3" style="cursor:pointer" onclick="navigateTo('screen-adjektivliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:var(--fw-bold)">Adjektivliste</div>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:2px">
            Freigeschaltete Adjektive nachschlagen</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// ADJEKTIVLISTE (Adjective Reference)
// ─────────────────────────────────────────

function renderAdjektivliste() {
  const unlockedIds = new Set(Progress.getUnlockedAdjectives());
  let adjs = appData.adjectives.filter(a => unlockedIds.has(a.id));
  adjs.sort((a, b) => a.word.localeCompare(b.word, 'de'));

  const container = document.getElementById('adjektivliste-content');

  if (adjs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <p>Noch keine Adjektive freigeschaltet.</p>
      </div>`;
    return;
  }

  container.innerHTML = _renderAdjektivCards(adjs);
}

function _renderAdjektivCards(adjs) {
  return adjs.map(adj => `
    <div class="card verb-card">
      <div class="verb-card-header" onclick="toggleAdjektivCard('${adj.id}')">
        <div>
          <span class="tag" style="margin-right:6px;background:var(--color-green-dark);color:#fff;font-size:var(--font-size-xs);padding:2px 7px;border-radius:4px">
            ${adj.cefr || ''}</span>
          <span class="verb-card-title">${adj.word}</span>
          <span class="verb-card-en"> — ${adj.english}</span>
        </div>
        <svg id="ajl-arr-${adj.id}" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
             stroke-linejoin="round" style="color:var(--color-text-muted);transition:transform 0.2s">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="verb-detail" id="ajl-det-${adj.id}">
        <div class="conj-grid mt-3" style="grid-template-columns:1fr 1fr">
          <div><span class="pronoun">Komparativ</span> <strong>${adj.comparative || '—'}</strong></div>
          <div><span class="pronoun">Superlativ</span> <strong>${adj.superlative || '—'}</strong></div>
          ${adj.antonym ? `<div style="grid-column:1/-1"><span class="pronoun">Gegenteil</span> <strong>${adj.antonym}</strong></div>` : ''}
        </div>
        ${adj.example_sentences && adj.example_sentences.length > 0 ? `
          <div class="label mt-3" style="margin-bottom:var(--sp-2)">Beispiele</div>
          ${adj.example_sentences.map(ex => `
            <div class="example-card">
              <div class="example-de">${ex.de}</div>
              <div class="example-en">${ex.en}</div>
            </div>`).join('')}` : ''}
      </div>
    </div>`).join('');
}

function toggleAdjektivCard(adjId) {
  const det = document.getElementById(`ajl-det-${adjId}`);
  const arr = document.getElementById(`ajl-arr-${adjId}`);
  const isOpen = det.classList.contains('open');
  det.classList.toggle('open', !isOpen);
  arr.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function filterAdjektivList(query) {
  const q = query.toLowerCase().trim();
  const unlockedIds = new Set(Progress.getUnlockedAdjectives());
  let adjs = appData.adjectives.filter(a => unlockedIds.has(a.id));
  if (q) {
    adjs = adjs.filter(a =>
      a.word.toLowerCase().includes(q) ||
      a.english.toLowerCase().includes(q));
  }
  adjs.sort((a, b) => a.word.localeCompare(b.word, 'de'));

  const container = document.getElementById('adjektivliste-content');
  if (adjs.length === 0) {
    container.innerHTML = `<div style="color:var(--color-text-muted);padding:var(--sp-4)">
      Keine Ergebnisse.</div>`;
    return;
  }
  container.innerHTML = _renderAdjektivCards(adjs);
}

// ─────────────────────────────────────────
// MODULE HOME — PREPOSITIONS
// ─────────────────────────────────────────

function _renderPrepositionModuleCategories() {
  const total      = appData.prepositions.length;
  const allEx      = appData.exercises['module_prepositions'] || [];
  const difficulty = Progress.getPrepositionsDifficulty();

  // Progress: count unique exercises with at least 1 correct answer
  const history    = allEx.filter(ex => {
    const h = Progress.getExerciseHistory(ex.exercise_id);
    return h.correct > 0;
  });
  const seen       = history.length;
  const pct        = allEx.length > 0 ? Math.round(seen / allEx.length * 100) : 0;

  document.getElementById('module-progress-count').textContent =
    `${total} Präpositionen · ${seen} / ${allEx.length} Übungen`;
  document.getElementById('module-progress-fill').style.width = pct + '%';

  document.getElementById('module-categories').innerHTML = `
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <div class="category-pair">
      <div class="category-card" style="grid-column:1/-1"
           onclick="openExercise('module_prepositions','all')">
        <div class="category-card-title">Präpositionen üben</div>
        <div class="category-card-subtitle">
          Gap-fill &amp; case selection · Niveau <strong>${difficulty}</strong>
        </div>
        <div class="category-card-count mt-3">${seen} / ${allEx.length} Übungen gemacht</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>
    </div>

    <!-- Präpositionsliste link -->
    <div class="card mt-3" style="cursor:pointer" onclick="navigateTo('screen-prapositionsliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:var(--fw-bold)">Präpositionsliste</div>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:2px">
            Alle ${total} Präpositionen nachschlagen</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// PRÄPOSITIONSLISTE (Preposition Reference)
// Shows ALL prepositions — no unlock gate
// ─────────────────────────────────────────

function renderPrapositionsliste() {
  const container = document.getElementById('prapositionsliste-content');
  const query     = document.getElementById('pl-search').value || '';
  _renderPrapositionslisteFiltered(appData.prepositions, container, query);
}

function filterPrapositionsliste(query) {
  const q         = query.toLowerCase().trim();
  const container = document.getElementById('prapositionsliste-content');
  const filtered  = q
    ? appData.prepositions.filter(p =>
        p.preposition.toLowerCase().includes(q) ||
        p.english.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q))
    : appData.prepositions;

  const count = document.getElementById('pl-search-count');
  if (count) count.textContent = q ? `${filtered.length} / ${appData.prepositions.length}` : '';

  _renderPrapositionslisteFiltered(filtered, container, q);
}

function _renderPrapositionslisteFiltered(preps, container, query) {
  if (preps.length === 0) {
    container.innerHTML = `<div style="color:var(--color-text-muted);padding:var(--sp-4)">Keine Ergebnisse.</div>`;
    return;
  }
  container.innerHTML = preps.map(p => _renderPrepCard(p)).join('');
}

function _renderPrepCard(p) {
  const caseDots    = _renderCaseDots(p.cases || []);
  const categoryMap = { 'two-way': 'Wechselpräp.', 'akkusativ': 'Akkusativ', 'dativ': 'Dativ', 'genitiv': 'Genitiv' };
  const catLabel    = categoryMap[p.category] || p.category;

  return `
    <div class="card verb-card">
      <div class="verb-card-header" onclick="togglePrepCard('${p.id}')">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="tag" style="margin-right:2px;background:var(--color-green-dark);color:#fff;
                font-size:var(--font-size-xs);padding:2px 7px;border-radius:4px">${p.cefr}</span>
          <span class="verb-card-title">${p.preposition}</span>
          <span class="verb-card-en"> — ${p.english}</span>
          ${caseDots}
        </div>
        <svg id="pl-arr-${p.id}" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
             stroke-linejoin="round" style="color:var(--color-text-muted);transition:transform 0.2s;flex-shrink:0">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="verb-detail" id="pl-det-${p.id}">
        <div style="margin-top:var(--sp-3);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span class="tag" style="background:var(--color-surface);border:1.5px solid var(--color-border);
                color:var(--color-text-secondary);font-size:var(--font-size-xs);padding:3px 8px;border-radius:4px">
            ${catLabel}</span>
        </div>
        ${p.case_notes ? `
          <div style="margin-top:var(--sp-3);font-size:var(--font-size-sm);
                color:var(--color-text-secondary);line-height:1.5">${p.case_notes}</div>` : ''}
        ${p.example_sentences && p.example_sentences.length > 0 ? `
          <div class="label mt-3" style="margin-bottom:var(--sp-2)">Beispiele</div>
          ${p.example_sentences.map(ex => {
            const exDots = ex.case ? _renderCaseDots([ex.case]) : '';
            return `
            <div class="example-card">
              <div class="example-de" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span>${ex.de}</span>
                ${exDots}
              </div>
              <div class="example-en">${ex.en}</div>
            </div>`;
          }).join('')}` : ''}
      </div>
    </div>`;
}

function togglePrepCard(prepId) {
  const det = document.getElementById(`pl-det-${prepId}`);
  const arr = document.getElementById(`pl-arr-${prepId}`);
  const isOpen = det.classList.contains('open');
  det.classList.toggle('open', !isOpen);
  arr.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// ─────────────────────────────────────────
// APP INIT
// ─────────────────────────────────────────

async function init() {
  await loadData();
  Progress.updateStreak();
  Progress.recordSession();
  renderHome();
}

document.addEventListener('DOMContentLoaded', init);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .catch(err => console.log('SW registration failed:', err));
  });
}
