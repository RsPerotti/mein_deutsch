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
  modules:   [],
  verbs:     [],
  nouns:     [],
  exercises: {}   // keyed by moduleId e.g. 'module_verbs'
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
    case 'screen-results':     /* rendered by exercises.js */           break;
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
  appData.modules                    = d.modules        || [];
  appData.verbs                      = d.verbs          || [];
  appData.nouns                      = d.nouns          || [];
  appData.exercises['module_verbs']  = d.exercises_verbs || (d.exercises || {}).module_verbs || [];
  appData.exercises['module_nouns']  = d.exercises_nouns || [];
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
  let n = appData.verbs.length + appData.nouns.length;
  for (const v of appData.verbs) n += (v.prefix_variants || []).length;
  return n;
}

function _wordLabel(id) {
  const noun = appData.nouns.find(n => n.id === id);
  if (noun) return `${noun.article} ${noun.word}`;
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
  const total    = appData.nouns.length;
  const unlocked = Progress.getUnlockedNouns().length;
  const pct      = total > 0 ? Math.round(unlocked / total * 100) : 0;

  document.getElementById('module-progress-count').textContent = `${unlocked} / ${total}`;
  document.getElementById('module-progress-fill').style.width  = pct + '%';

  document.getElementById('module-categories').innerHTML = `
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <div class="category-pair">
      <div class="category-card" style="grid-column:1/-1"
           onclick="openExercise('module_nouns','all')">
        <div class="category-card-title">Nomen üben</div>
        <div class="category-card-subtitle">Articles, plurals &amp; vocabulary</div>
        <div class="category-card-count mt-3">${unlocked} / ${total} gelernt</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>
    </div>

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
