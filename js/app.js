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
  particles:    [],
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

  // Push a history entry so Android gesture-back fires popstate instead of closing the app
  history.pushState({ screen: screenId }, '', location.href);

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

// Handle Android gesture back / browser back button via History API
window.addEventListener('popstate', () => {
  if (navStack.length > 0) {
    navigateBack();
    // Re-push so the history stack stays in sync with navStack depth
    history.pushState({ screen: currentScreen }, '', location.href);
  } else {
    // At root — re-push a state so the next back gesture is catchable
    // (lets the OS know there's nothing further to pop without closing the app)
    history.pushState({ screen: currentScreen }, '', location.href);
  }
});

function onScreenEnter(screenId) {
  switch (screenId) {
    case 'screen-home':              renderHome();                            break;
    case 'screen-wordlist':          renderWordList();                        break;
    case 'screen-module-home':       renderModuleHome(currentModuleId);       break;
    case 'screen-exercise':          startExercise(currentExerciseState);     break;
    case 'screen-verbliste':         renderVerbliste();                       break;
    case 'screen-nomenliste':        renderNomenliste();                      break;
    case 'screen-adverbliste':       renderAdverbliste();                     break;
    case 'screen-adjektivliste':     renderAdjektivliste();                   break;
    case 'screen-prapositionsliste': renderPrapositionsliste();               break;
    case 'screen-listening-list':    renderListeningList();                                       break;
    case 'screen-listening-reader':  /* rendered by listening.js on demand */                     break;
    case 'screen-results':           /* rendered by exercises.js */                               break;
    case 'screen-grammar-lesson':
      if (window._currentGrammarModule === 'particles') {
        renderParticleLesson(window._currentGrammarLessonId || '');
      } else {
        renderGrammarLesson(window._currentGrammarLessonId || '');
      }
      break;
    case 'screen-particle-reference': renderPartikelliste(); break;
  }
}

// Convenience: open a module (avoids passing objects through HTML attrs)
function openModule(moduleId) {
  currentModuleId = moduleId;
  navigateTo('screen-module-home');
}

// Convenience: start an exercise session
// tenseContext: 'prasens' | 'vergangenheit' (verbs only; omit for all other modules)
function openExercise(moduleId, category, tenseContext) {
  currentExerciseState = { moduleId, category, tenseContext: tenseContext || null };
  navigateTo('screen-exercise');
}

// ─────────────────────────────────────────
// VERB TENSE TAB STATE
// Persists across module-home re-renders within a session.
// Extensible: add 'futur', 'konjunktiv' etc. without rearchitecting.
// ─────────────────────────────────────────
let _verbTenseTab = 'prasens'; // 'prasens' | 'vergangenheit'

// ─────────────────────────────────────────
// PARTICLES CEFR FILTER STATE
// Persists across module-home re-renders.
// ─────────────────────────────────────────
let _particlesCefr     = localStorage.getItem('app_particles_cefr') || 'A1';
let _particlesGramOpen = false;  // grammatik accordion open state

function setVerbTenseTab(tab) {
  _verbTenseTab = tab;
  _renderVerbModuleCategories();
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
  appData.exercises['module_verbs']         = (d.exercises || {}).module_verbs || d.exercises_verbs       || [];
  appData.exercises['module_nouns']         = d.exercises_nouns       || [];
  appData.exercises['module_adverbs']       = d.exercises_adverbs     || [];
  appData.exercises['module_adjectives']    = d.exercises_adjectives   || [];
  appData.prepositions                      = d.prepositions            || [];
  appData.exercises['module_prepositions']  = d.exercises_prepositions  || [];

  // Listening module — metadata + articles bundled in js/listening-data.js
  const ld = window.LISTENING_DATA || {};
  if (ld.module) {
    // Merge listening module into modules list (keeps data.js untouched)
    const already = appData.modules.find(m => m.id === 'module_listening');
    if (!already) appData.modules.push(ld.module);
  }

  // Particles module — definitions + exercises bundled in js/particles-data.js
  const pd = window.PARTICLES_DATA || {};
  appData.particles                        = pd.particles || [];
  appData.exercises['module_particles']    = pd.exercises || [];
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

function _moduleIcon(moduleId) {
  const sw = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    module_verbs:
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    module_nouns:
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" stroke-width="3"/></svg>`,
    module_adverbs:
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    module_adjectives:
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    module_prepositions:
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    module_listening:
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
    module_particles:
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg>`,
  };
  return icons[moduleId] ||
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${sw}><circle cx="12" cy="12" r="10"/></svg>`;
}

function _renderModuleCards() {
  const container = document.getElementById('home-modules-list');

  container.innerHTML = appData.modules.map(mod => {
    const locked    = mod.status !== 'active';
    const isReading = mod.type === 'reading';
    const clickFn   = locked ? '' : isReading
      ? `navigateTo('screen-listening-list')`
      : `openModule('${mod.id}')`;

    // Reading module: show article read count
    const readCount = isReading ? Progress.getReadArticles().length : 0;
    const totalArts = isReading ? ((window.LISTENING_DATA || {}).articles || []).length : 0;
    const readSub   = isReading
      ? `<div class="module-grid-sub">${readCount} / ${totalArts} gelesen</div>`
      : '';

    const lockIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
           style="color:var(--color-text-muted)">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>`;

    const arrowIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
           style="color:var(--color-text-muted)">
        <polyline points="9 18 15 12 9 6"/>
      </svg>`;

    return `
      <button class="module-card-grid ${locked ? 'locked' : ''}"
              onclick="${clickFn}"
              ${locked ? 'disabled' : ''}>
        <div class="module-grid-title">${mod.title_en}</div>
        ${readSub}
        <div class="module-grid-bottom">${locked ? lockIcon : arrowIcon}</div>
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

  document.getElementById('module-nav-context').textContent = mod.title_en.toUpperCase();

  // Show "Alle Partikeln →" nav button only for particles module
  const alleBtn = document.getElementById('particles-alle-nav-btn');
  if (alleBtn) alleBtn.style.display = moduleId === 'module_particles' ? '' : 'none';

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
  } else if (moduleId === 'module_particles') {
    _renderParticleModuleCategories();
  }
}

function _renderVerbModuleCategories() {
  const rootUnlocked = Progress.getUnlockedRootVerbs().length;
  const varUnlocked  = Progress.getUnlockedVariants().length;
  const rootTotal    = appData.verbs.length;
  const varTotal     = appData.verbs.reduce((n, v) => n + (v.prefix_variants || []).length, 0);
  const totalUnlocked = rootUnlocked + varUnlocked;
  const totalAll      = rootTotal + varTotal;
  const pct = totalAll > 0 ? Math.round(totalUnlocked / totalAll * 100) : 0;
  const varLocked = rootUnlocked === 0;

  const allVerbEx  = appData.exercises['module_verbs'] || [];
  const rootIds    = new Set(appData.verbs.map(v => v.id));
  const variantIds = new Set();
  for (const v of appData.verbs) (v.prefix_variants || []).forEach(pv => variantIds.add(pv.id));

  // Tense filter — Präsens: no tense field or 'prasens'; Vergangenheit: 'perfekt' or 'prateritum'
  const isTenseMatch = (ex) => _verbTenseTab === 'prasens'
    ? (!ex.tense || ex.tense === 'prasens')
    : (ex.tense === 'perfekt' || ex.tense === 'prateritum');

  const rootExs     = allVerbEx.filter(ex => rootIds.has(ex.word_id) && isTenseMatch(ex));
  const rootExDone  = rootExs.filter(ex => Progress.getExerciseHistory(ex.exercise_id).correct > 0).length;
  const rootExTotal = rootExs.length;
  const rootExPct   = rootExTotal > 0 ? Math.round(rootExDone / rootExTotal * 100) : 0;

  const varExs     = allVerbEx.filter(ex => variantIds.has(ex.word_id) && isTenseMatch(ex));
  const varExDone  = varExs.filter(ex => Progress.getExerciseHistory(ex.exercise_id).correct > 0).length;
  const varExTotal = varExs.length;
  const varExPct   = varExTotal > 0 ? Math.round(varExDone / varExTotal * 100) : 0;

  const tc = _verbTenseTab; // tenseContext passed to openExercise

  document.getElementById('module-categories').innerHTML = `
    <!-- Unlocked Verbs summary card -->
    <div class="card" style="cursor:pointer" onclick="navigateTo('screen-verbliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-size-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--color-text-secondary);margin-bottom:4px">Unlocked Verbs</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span style="font-size:var(--font-size-2xl);font-weight:var(--fw-bold)">${totalUnlocked}</span>
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">/ ${totalAll}</span>
          </div>
          <div class="progress-bar mt-2"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted);flex-shrink:0;margin-left:var(--sp-3)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <!-- Grammatik accordion -->
    ${renderGrammatikStrip()}

    <!-- Section label -->
    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <!-- Tense tab toggle: Präsens | Vergangenheit (extensible for Futur, Konjunktiv etc.) -->
    <div class="tense-tab-row">
      <button class="tense-tab ${_verbTenseTab === 'prasens'       ? 'active' : ''}"
              onclick="setVerbTenseTab('prasens')">Präsens</button>
      <button class="tense-tab ${_verbTenseTab === 'vergangenheit' ? 'active' : ''}"
              onclick="setVerbTenseTab('vergangenheit')">Vergangenheit</button>
    </div>

    <!-- Category cards — Stammverben + Variationen -->
    <div class="category-pair">
      <div class="category-card" onclick="openExercise('module_verbs','roots','${tc}')">
        <div class="category-card-title">Stammverben</div>
        <div class="category-card-subtitle">Root verbs</div>
        <div class="category-card-count mt-3">${rootExDone} / ${rootExTotal} Übungen</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${rootExPct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>

      <div class="category-card ${varLocked ? 'locked' : ''}"
           onclick="${varLocked ? '' : `openExercise('module_verbs','variants','${tc}')`}">
        <div class="category-card-title"
             style="${varLocked ? 'color:var(--color-text-muted)' : ''}">Variationen</div>
        <div class="category-card-subtitle">Prefix verbs</div>
        ${varLocked
          ? `<div style="margin-top:var(--sp-3);font-size:20px">🔒</div>
             <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:var(--sp-2);line-height:1.4">
               Unlock by practising Stammverben first</div>`
          : `<div class="category-card-count mt-3">${varExDone} / ${varExTotal} Übungen</div>
             <div class="progress-bar mt-2">
               <div class="progress-fill" style="width:${varExPct}%"></div>
             </div>
             <div class="category-card-cta">Üben →</div>`}
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

  const varLocked = rootUnlocked === 0;
  const rootPct   = rootTotal > 0 ? Math.round(rootUnlocked / rootTotal * 100) : 0;
  const varPct    = varTotal  > 0 ? Math.round(varUnlocked  / varTotal  * 100) : 0;

  // Exercise completion counts
  const allNounEx       = appData.exercises['module_nouns'] || [];
  const rootNounIds     = new Set(appData.nouns.filter(n => n.section === 'roots').map(n => n.id));
  const rootNounExs     = allNounEx.filter(ex => rootNounIds.has(ex.word_id));
  const rootNounExDone  = rootNounExs.filter(ex => Progress.getExerciseHistory(ex.exercise_id).correct > 0).length;
  const rootNounExTotal = rootNounExs.length;
  const rootNounExPct   = rootNounExTotal > 0 ? Math.round(rootNounExDone / rootNounExTotal * 100) : 0;

  const varNounIds      = new Set(appData.nouns.filter(n => n.section === 'variations').map(n => n.id));
  const varNounExs      = allNounEx.filter(ex => varNounIds.has(ex.word_id));
  const varNounExDone   = varNounExs.filter(ex => Progress.getExerciseHistory(ex.exercise_id).correct > 0).length;
  const varNounExTotal  = varNounExs.length;
  const varNounExPct    = varNounExTotal > 0 ? Math.round(varNounExDone / varNounExTotal * 100) : 0;

  document.getElementById('module-categories').innerHTML = `
    <!-- Merged: Unlocked Nouns + list link -->
    <div class="card" style="cursor:pointer" onclick="navigateTo('screen-nomenliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-size-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--color-text-secondary);margin-bottom:4px">Unlocked Nouns</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span style="font-size:var(--font-size-2xl);font-weight:var(--fw-bold)">${totalUnlocked}</span>
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">/ ${totalAll}</span>
          </div>
          <div class="progress-bar mt-2"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted);flex-shrink:0;margin-left:var(--sp-3)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <!-- Category pair: Stammnomen + Variationen -->
    <div class="category-pair">
      <div class="category-card" onclick="openExercise('module_nouns','roots')">
        <div class="category-card-title">Stammnomen</div>
        <div class="category-card-subtitle">Root nouns</div>
        <div class="category-card-count mt-3">${rootNounExDone} / ${rootNounExTotal} Übungen</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${rootNounExPct}%"></div>
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
          : `<div class="category-card-count mt-3">${varNounExDone} / ${varNounExTotal} Übungen</div>
             <div class="progress-bar mt-2">
               <div class="progress-fill" style="width:${varNounExPct}%"></div>
             </div>
             <div class="category-card-cta">Üben →</div>`}
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

  // Exercise completion counts
  const allAdvEx    = appData.exercises['module_adverbs'] || [];
  const advExDone   = allAdvEx.filter(ex => Progress.getExerciseHistory(ex.exercise_id).correct > 0).length;
  const advExTotal  = allAdvEx.length;
  const advExPct    = advExTotal > 0 ? Math.round(advExDone / advExTotal * 100) : 0;

  document.getElementById('module-categories').innerHTML = `
    <!-- Merged: Unlocked Adverbs + list link -->
    <div class="card" style="cursor:pointer" onclick="navigateTo('screen-adverbliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-size-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--color-text-secondary);margin-bottom:4px">Unlocked Adverbs</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span style="font-size:var(--font-size-2xl);font-weight:var(--fw-bold)">${unlocked}</span>
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">/ ${total}</span>
          </div>
          <div class="progress-bar mt-2"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted);flex-shrink:0;margin-left:var(--sp-3)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <div class="category-pair">
      <div class="category-card" style="grid-column:1/-1"
           onclick="openExercise('module_adverbs','all')">
        <div class="category-card-title">Adverbien üben</div>
        <div class="category-card-subtitle">Frequency, time, certainty &amp; more</div>
        <div class="category-card-count mt-3">${advExDone} / ${advExTotal} Übungen</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${advExPct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
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

  // Exercise completion counts
  const allAdjEx    = appData.exercises['module_adjectives'] || [];
  const adjExDone   = allAdjEx.filter(ex => Progress.getExerciseHistory(ex.exercise_id).correct > 0).length;
  const adjExTotal  = allAdjEx.length;
  const adjExPct    = adjExTotal > 0 ? Math.round(adjExDone / adjExTotal * 100) : 0;

  document.getElementById('module-categories').innerHTML = `
    <!-- Merged: Unlocked Adjectives + list link -->
    <div class="card" style="cursor:pointer" onclick="navigateTo('screen-adjektivliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-size-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--color-text-secondary);margin-bottom:4px">Unlocked Adjectives</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span style="font-size:var(--font-size-2xl);font-weight:var(--fw-bold)">${unlocked}</span>
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">/ ${total}</span>
          </div>
          <div class="progress-bar mt-2"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted);flex-shrink:0;margin-left:var(--sp-3)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <!-- Two category cards: Grundformen (active) + Deklinationen (placeholder) -->
    <div class="category-pair">
      <div class="category-card" onclick="openExercise('module_adjectives','all')">
        <div class="category-card-title">Grundformen</div>
        <div class="category-card-subtitle">Meanings &amp; vocabulary</div>
        <div class="category-card-count mt-3">${adjExDone} / ${adjExTotal} Übungen</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${adjExPct}%"></div>
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

  // Progress: count unique exercises with at least 1 correct answer
  const history    = allEx.filter(ex => {
    const h = Progress.getExerciseHistory(ex.exercise_id);
    return h.correct > 0;
  });
  const seen       = history.length;
  const pct        = allEx.length > 0 ? Math.round(seen / allEx.length * 100) : 0;

  document.getElementById('module-categories').innerHTML = `
    <!-- Merged: Prepositions list + progress -->
    <div class="card" style="cursor:pointer" onclick="navigateTo('screen-prapositionsliste')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-size-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--color-text-secondary);margin-bottom:4px">Prepositions</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span style="font-size:var(--font-size-2xl);font-weight:var(--fw-bold)">${total}</span>
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">total</span>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="color:var(--color-text-muted);flex-shrink:0;margin-left:var(--sp-3)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <div class="label mt-4" style="color:var(--color-text-primary);margin-bottom:var(--sp-3)">
      Übungen
    </div>

    <div class="category-pair">
      <div class="category-card" style="grid-column:1/-1"
           onclick="openExercise('module_prepositions','all')">
        <div class="category-card-title">Präpositionen üben</div>
        <div class="category-card-subtitle">Gap-fill &amp; case selection</div>
        <div class="category-card-count mt-3">${seen} / ${allEx.length} Übungen gemacht</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// PARTIKELN MODULE HOME
// Core (A1–B2) + Advanced (B2–C2) sections
// CEFR filter: UI only — exercise wiring in Phase 3
// ─────────────────────────────────────────

function setParticlesCefr(level) {
  _particlesCefr = level;
  localStorage.setItem('app_particles_cefr', level);
  _renderParticleModuleCategories();
}

function toggleParticlesGrammatikAccordion() {
  _particlesGramOpen = !_particlesGramOpen;
  const body    = document.getElementById('particles-gram-body');
  const chevron = document.getElementById('particles-gram-chevron');
  if (body)    body.classList.toggle('open', _particlesGramOpen);
  if (chevron) chevron.style.transform = _particlesGramOpen ? 'rotate(180deg)' : '';
}

function _renderParticlesGrammatikStrip(lessons) {
  const total        = lessons.length;
  const done         = lessons.filter(l => ParticleGrammar.isComplete(l.id)).length;
  const chevronStyle = _particlesGramOpen
    ? 'style="color:var(--color-text-muted);transition:transform 0.2s;flex-shrink:0;transform:rotate(180deg)"'
    : 'style="color:var(--color-text-muted);transition:transform 0.2s;flex-shrink:0"';
  const bodyClass    = _particlesGramOpen ? 'grammatik-accordion-body open' : 'grammatik-accordion-body';

  const dotColor = {
    locked:      'var(--color-text-muted)',
    in_progress: '#D97706',
    complete:    'var(--color-green-accent)'
  };

  const rows = lessons.map(l => {
    const state  = ParticleGrammar.getLessonState(l.id);
    const status = state.status || 'locked';
    const color  = dotColor[status] || dotColor.locked;
    return `
    <div class="grammatik-row" onclick="openParticleLesson('${l.id}')">
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
      <div class="grammatik-accordion-header" onclick="toggleParticlesGrammatikAccordion()">
        <div class="grammatik-accordion-left">
          <span class="grammatik-accordion-label">Grammatik</span>
          <span class="grammatik-accordion-count">${done} / ${total}</span>
        </div>
        <svg id="particles-gram-chevron" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             ${chevronStyle}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="${bodyClass}" id="particles-gram-body">
        ${rows}
      </div>
    </div>`;
}

function _renderParticleModuleCategories() {
  const allEx = appData.exercises['module_particles'] || [];
  const total = appData.particles.length;

  // Per-category exercise counts + done (Phase 3 will filter by CEFR)
  const catCount = (cat) => allEx.filter(ex => ex.category === cat).length;
  const catDone  = (cat) => allEx.filter(ex =>
    ex.category === cat && Progress.getExerciseHistory(ex.id).correct > 0
  ).length;

  // CEFR filter pills
  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const cefrPills  = `
    <div class="particles-cefr-picker">
      ${cefrLevels.map(l => `
        <button class="diff-btn${l === _particlesCefr ? ' active' : ''}"
                onclick="setParticlesCefr('${l}')">${l}</button>
      `).join('')}
    </div>`;

  // Grammatik strip — all 8 lessons
  const allLessons = (window.PARTICLES_DATA || {}).lessons || [];
  const gramStrip  = _renderParticlesGrammatikStrip(allLessons);

  // CEFR ranges per category (from actual exercise data)
  const catCefrRange = {
    'modal-softening':    'A1 – B1',
    'modal-attitude':     'A1 – B1',
    'modal-probability':  'A2 – B1',
    'gradation-focus':    'A1 – B1',
    'nuanced-connectors': 'B2 – C1',
    'emphasis-register':  'B2 – C2'
  };

  // Category card builder
  // Shows CEFR range so user knows which filter levels apply before tapping
  const mkCard = (cat, title, subtitle) => {
    const n    = catCount(cat);
    const done = catDone(cat);
    const pct  = n > 0 ? Math.round(done / n * 100) : 0;
    const range = catCefrRange[cat] || '';
    return `
      <div class="category-card" onclick="openParticleExercise('${cat}')">
        <div class="category-card-title">${title}</div>
        <div class="category-card-subtitle">${subtitle}</div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.05em;color:var(--color-green-accent);
                    text-transform:uppercase;margin-top:4px">${range}</div>
        <div class="category-card-count mt-3">${done} / ${n}</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="category-card-cta">Üben →</div>
      </div>`;
  };

  // Particle count summary card
  const seenTotal = allEx.filter(ex => Progress.getExerciseHistory(ex.id).correct > 0).length;
  const pctTotal  = allEx.length > 0 ? Math.round(seenTotal / allEx.length * 100) : 0;

  document.getElementById('module-categories').innerHTML = `
    <!-- Summary card -->
    <div class="card" style="cursor:default">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-size-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--color-text-secondary);margin-bottom:4px">Particles</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span style="font-size:var(--font-size-2xl);font-weight:var(--fw-bold)">${total}</span>
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">total · ${allEx.length} exercises</span>
          </div>
          <div class="progress-bar mt-2"><div class="progress-fill" style="width:${pctTotal}%"></div></div>
        </div>
      </div>
    </div>

    <!-- CEFR filter (UI only — Phase 3 wires to exercises) -->
    ${cefrPills}

    <!-- Grammatik accordion (all 8 lessons — Phase 4 wires progress) -->
    ${gramStrip}

    <!-- ── CORE ── -->
    <div class="particles-tier-header">
      <span class="particles-tier-label">Core</span>
      <span class="particles-tier-badge">A1 – B2</span>
    </div>

    <div class="category-pair">
      ${mkCard('modal-softening',   'Softening & Requests', 'mal · ruhig · einfach · bloß · nur')}
      ${mkCard('modal-attitude',    'Attitude & Knowledge', 'ja · doch · auch · denn · etwa')}
      ${mkCard('modal-probability', 'Probability',          'wohl · schon · eigentlich · eben · halt')}
      ${mkCard('gradation-focus',   'Gradation & Focus',    'gar · wirklich · sogar · erst · noch')}
    </div>

    <!-- ── ADVANCED ── -->
    <div class="particles-tier-header">
      <span class="particles-tier-label">Advanced</span>
      <span class="particles-tier-badge">B2 – C2</span>
    </div>

    <div class="category-pair">
      ${mkCard('nuanced-connectors', 'Nuanced Connectors', 'nämlich · allerdings · zwar · immerhin')}
      ${mkCard('emphasis-register',  'Emphasis & Register', 'ausgerechnet · überhaupt · bereits')}
    </div>`;
}

// ─── Soft gate ───────────────────────────────────────────────────────────────

// Category → lesson that soft-gates it
const _PARTICLE_GATE_MAP = {
  'modal-softening':    { lessonId: 'particles-softening',    title: 'Softening & Requesting' },
  'modal-attitude':     { lessonId: 'particles-attitude',     title: 'Shared Knowledge & Attitude' },
  'modal-probability':  { lessonId: 'particles-probability',  title: 'Probability & Concession' },
  'gradation-focus':    { lessonId: 'particles-gradation',    title: 'Gradation & Focus' },
  'nuanced-connectors': { lessonId: 'particles-connectors',   title: 'Nuanced Connectors (C1)' },
  'emphasis-register':  { lessonId: 'particles-emphasis',     title: 'Emphasis & Register (C2)' }
};

// Pending category while gate is shown
let _pendingParticleCat = null;

/**
 * Called from category card tap. Shows soft gate if lesson not yet started,
 * otherwise goes straight to exercises.
 */
function openParticleExercise(cat) {
  const gate = _PARTICLE_GATE_MAP[cat];
  if (gate && ParticleGrammar.getLessonState(gate.lessonId).status === 'locked') {
    _pendingParticleCat = cat;
    document.getElementById('particle-gate-lesson-name').textContent = gate.title;
    document.getElementById('particle-gate-overlay').classList.add('visible');
    document.getElementById('particle-gate-sheet').classList.add('visible');
  } else {
    openExercise('module_particles', cat);
  }
}

function closeParticleGate() {
  document.getElementById('particle-gate-overlay').classList.remove('visible');
  document.getElementById('particle-gate-sheet').classList.remove('visible');
  _pendingParticleCat = null;
}

function particleGateGoToLesson() {
  const gate = _pendingParticleCat ? _PARTICLE_GATE_MAP[_pendingParticleCat] : null;
  closeParticleGate();
  if (gate) openParticleLesson(gate.lessonId);
}

function particleGateGoAnyway() {
  const cat = _pendingParticleCat;
  closeParticleGate();
  if (cat) openExercise('module_particles', cat);
}

// ─── Alle Partikeln — reference screen ───────────────────────────────────────

let _particleSort   = 'category'; // 'alpha' | 'category'
let _particleSearch = '';
let _particleDetailId = null;

function openPartikelliste() {
  navigateTo('screen-particle-reference');
}

function renderPartikelliste() {
  _particleSearch = '';
  const searchEl = document.getElementById('particle-ref-search');
  if (searchEl) searchEl.value = '';
  // Reflect current sort on buttons
  document.querySelectorAll('.particle-sort-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === _particleSort);
  });
  _renderParticleList();
}

function setParticleSort(mode) {
  _particleSort = mode;
  document.querySelectorAll('.particle-sort-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === mode);
  });
  _renderParticleList();
}

function filterParticlesSearch(val) {
  _particleSearch = val.trim().toLowerCase();
  _renderParticleList();
}

function _renderParticleList() {
  const pd        = (typeof PARTICLES_DATA !== 'undefined') ? PARTICLES_DATA : {};
  let particles   = pd.particles || [];
  const container = document.getElementById('particle-ref-list');
  if (!container) return;

  // Search filter
  if (_particleSearch) {
    particles = particles.filter(p =>
      p.particle.toLowerCase().includes(_particleSearch) ||
      (p.signals || '').toLowerCase().includes(_particleSearch)
    );
  }

  if (particles.length === 0) {
    container.innerHTML = `<div class="particle-ref-empty">Keine Partikeln gefunden.</div>`;
    return;
  }

  if (_particleSort === 'alpha') {
    const sorted = [...particles].sort((a, b) => a.particle.localeCompare(b.particle));
    container.innerHTML = sorted.map(_particleRowHtml).join('');
  } else {
    // Group by category in defined order
    const catOrder = [
      'modal-softening', 'modal-attitude', 'modal-probability',
      'gradation-focus', 'nuanced-connectors', 'emphasis-register'
    ];
    const catLabel = {
      'modal-softening':    'Softening & Requesting',
      'modal-attitude':     'Attitude & Knowledge',
      'modal-probability':  'Probability & Concession',
      'gradation-focus':    'Gradation & Focus',
      'nuanced-connectors': 'Nuanced Connectors',
      'emphasis-register':  'Emphasis & Register'
    };
    let html = '';
    for (const cat of catOrder) {
      const group = particles.filter(p => p.category === cat);
      if (!group.length) continue;
      html += `<div class="particle-ref-category-header">${catLabel[cat]}</div>`;
      html += group.map(_particleRowHtml).join('');
    }
    container.innerHTML = html;
  }
}

function _particleRowHtml(p) {
  const cefrBadge = `<span class="particle-ref-cefr">${p.cefr}</span>`;
  return `
    <div class="particle-ref-row" onclick="showParticleDetail('${p.id}')">
      <div class="particle-ref-row-left">
        <span class="particle-ref-word">${p.particle}</span>
        <span class="particle-ref-signal">${p.signals || ''}</span>
      </div>
      ${cefrBadge}
    </div>`;
}

// ─── Particle detail bottom sheet ────────────────────────────────────────────

function showParticleDetail(particleId) {
  const pd       = (typeof PARTICLES_DATA !== 'undefined') ? PARTICLES_DATA : {};
  const particle = (pd.particles || []).find(p => p.id === particleId);
  if (!particle) return;

  _particleDetailId = particleId;

  const catLabel = {
    'modal-softening':    'Modal · Softening & Requesting',
    'modal-attitude':     'Modal · Attitude & Knowledge',
    'modal-probability':  'Modal · Probability & Concession',
    'gradation-focus':    'Gradation & Focus',
    'nuanced-connectors': 'Nuanced Connectors',
    'emphasis-register':  'Emphasis & Register'
  };

  const examplesHtml = (particle.examples || []).map(ex => `
    <div class="particle-detail-example">
      <div class="particle-detail-example-de">${ex.de}</div>
      <div class="particle-detail-example-en">${ex.en}</div>
    </div>`).join('');

  const relatedHtml = (particle.related || []).length > 0 ? `
    <div class="particle-detail-section">
      <div class="particle-detail-label">Verwandte Partikeln</div>
      <div class="particle-ref-chips">
        ${particle.related.map(r => `<span class="particle-ref-chip" onclick="showParticleDetail('${r}')">${r}</span>`).join('')}
      </div>
    </div>` : '';

  const contrastHtml = particle.contrast_note ? `
    <div class="particle-detail-section">
      <div class="particle-detail-label">Hinweis</div>
      <div class="particle-detail-body">${particle.contrast_note}</div>
    </div>` : '';

  document.getElementById('particle-detail-content').innerHTML = `
    <div class="particle-detail-header">
      <span class="particle-detail-word">${particle.particle}</span>
      <span class="particle-detail-cefr">${particle.cefr}</span>
    </div>
    <div class="particle-detail-category">${catLabel[particle.category] || particle.category}</div>

    <div class="particle-detail-section">
      <div class="particle-detail-label">Bedeutung</div>
      <div class="particle-detail-body">${particle.signals}</div>
    </div>

    <div class="particle-detail-section">
      <div class="particle-detail-label">Position im Satz</div>
      <div class="particle-detail-body">${particle.position || '—'}</div>
    </div>

    <div class="particle-detail-section">
      <div class="particle-detail-label">Beispiele</div>
      ${examplesHtml}
    </div>

    ${contrastHtml}
    ${relatedHtml}`;

  document.getElementById('particle-detail-overlay').classList.add('visible');
  document.getElementById('particle-detail-sheet').classList.add('visible');
  document.getElementById('particle-detail-content').scrollTop = 0;
}

function closeParticleDetail() {
  document.getElementById('particle-detail-overlay').classList.remove('visible');
  document.getElementById('particle-detail-sheet').classList.remove('visible');
  _particleDetailId = null;
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
          ${caseDots}
          <span class="verb-card-title">${p.preposition}</span>
          <span class="verb-card-en"> — ${p.english}</span>
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
  Grammar.init();         // run migration before any rendering (idempotent after first run)
  ParticleGrammar.init(); // initialise particle lesson state (no migration — new module)
  Progress.updateStreak();
  Progress.recordSession();
  renderHome();
  // Seed the history stack so the first gesture-back is caught by popstate
  // rather than closing the PWA.
  history.replaceState({ screen: 'screen-home' }, '', location.href);
}

document.addEventListener('DOMContentLoaded', init);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .catch(err => console.log('SW registration failed:', err));
  });
}
