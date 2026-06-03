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
  appData.modules                   = d.modules   || [];
  appData.verbs                     = d.verbs     || [];
  appData.exercises['module_verbs'] = d.exercises_verbs || (d.exercises || {}).module_verbs || [];
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
  let n = appData.verbs.length;
  for (const v of appData.verbs) n += (v.prefix_variants || []).length;
  return n;
}

function _wordLabel(id) {
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
