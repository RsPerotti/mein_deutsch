/**
 * qa-verb-prepositions.js — headless QA for Session 44 (Bilder-Intake).
 *
 * Covers the new 'Verben mit Präposition' section and the new words end to end:
 * data reaches appData, the module home splits classic vs. verb-preposition practice,
 * the list screen renders, the 'verben' queue serves only vp items with no level picker,
 * and — the recurring bug of this project — answering WRITES BOTH progress stores
 * (app_exercise_history for coverage, app_srs for Wiederholung).
 *
 * Setup:  npm install jsdom   (to ~/qa, not the project)
 * Run:    NODE_PATH=~/qa/node_modules node _factory/qa-verb-prepositions.js
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const APP = require('path').resolve(__dirname, '..');
const dom = new JSDOM(fs.readFileSync(APP + '/index.html', 'utf8'), { url: 'https://example.org/', runScripts: 'dangerously', pretendToBeVisual: true });
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices:()=>[] };
w.navigator.serviceWorker = { register: () => Promise.resolve() };
w.scrollTo = () => {};
let failures = [], checks = 0;
const ok = (n, c, m) => { checks++; if (!c) failures.push(n + (m ? ': ' + m : '')); };
['js/data.js','js/listening-data.js','js/particles-data.js','js/prefixes-data.js','js/grammar-data.js','js/article-grammar-data.js',
 'js/declension-data.js','js/progress.js','js/srs.js','js/wordlist.js','js/exercises.js','js/review.js','js/scales.js',
 'js/wordpractice.js','js/listening.js','js/grammar.js','js/app.js'].forEach(f => {
  const el = w.document.createElement('script'); el.textContent = fs.readFileSync(APP + '/' + f, 'utf8'); w.document.body.appendChild(el);
});
w.eval('loadData()');
const E = s => w.eval(s);
const clean = () => E("SRS.reset(); localStorage.removeItem('app_exercise_history'); if (currentScreen !== 'screen-home') returnHome();");

// ── data ──
ok('24 verb-preposition pairs loaded', E('appData.verbPrepositions.length') === 24, E('appData.verbPrepositions.length'));
const vpCount = E("appData.exercises['module_prepositions'].filter(e => e.vp_id).length");
ok('82 vp exercises loaded', vpCount === 82, vpCount);
ok('new Stammverb served (dauern)', E("_stammverben().some(v => v.id === 'verb_dauern')"));
ok('standalone variation not a Stammverb (begreifen)', !E("_stammverben().some(v => v.id === 'verb_begreifen')"));
ok('attached variant reachable (vorbeikommen under kommen)', E("appData.verbs.find(v => v.root === 'kommen').prefix_variants.some(p => p.word === 'vorbeikommen')"));
ok('new noun present (Satz)', E("appData.nouns.some(n => n.id === 'noun_satz')"));
ok('new expressions present (12 added → 20)', E('appData.expressions.length') === 20, E('appData.expressions.length'));

// ── module home ──
E("openModule('module_prepositions')");
const home = E("document.getElementById('module-categories').innerHTML");
ok('module home shows the new section', /Verben mit Präposition/.test(home));
ok('module home links the list screen', /screen-verbpraep-liste/.test(home));
ok("module home opens the 'verben' practice", /openExercise\('module_prepositions','verben'\)/.test(home));
const classicTotal = E("appData.exercises['module_prepositions'].filter(e => !e.vp_id).length");
ok('classic card counts only classic exercises', home.includes(`/ ${classicTotal} Übungen`), classicTotal);
ok('vp card counts the vp exercises', home.includes(`0 / ${vpCount} Übungen`));

// ── list screen ──
E("navigateTo('screen-verbpraep-liste')");
const list = () => E("document.getElementById('verbpraep-liste-content')");
ok('list renders 24 cards', list().querySelectorAll('.verb-card').length === 24, list().querySelectorAll('.verb-card').length);
ok('list shows the intro card', /So funktioniert/.test(list().innerHTML));
E("filterVerbPraepListe('vor')");
const nVor = list().querySelectorAll('.verb-card').length;
ok("search 'vor' narrows to the 5 vor-pairs", nVor === 5, nVor);
E("togglePrepCard('vp_angst_vor')");
ok('card expands', E("document.getElementById('pl-det-vp_angst_vor').classList.contains('open')"));
E("navigateBack()");

// ── 'verben' session ──
clean();
E("openModule('module_prepositions'); openExercise('module_prepositions','verben')");
ok('session queue is only vp items', E("[session.current, ...session.queue].every(e => !!e.vp_id)"));
ok('session holds every vp item', E("1 + session.queue.length") === vpCount, E("1 + session.queue.length"));
ok('level picker hidden', E("document.getElementById('prep-difficulty-picker').style.display") === 'none');
ok('context label', /PRÄPOSITIONEN · VERBEN/.test(E("document.getElementById('exercise-context-label').textContent")));
const opts = E("document.querySelectorAll('#opts .option-btn').length");
ok('4 options rendered', opts === 4, opts);
const cur = E("session.current.exercise_id");
E("selectAnswer([...document.querySelectorAll('#opts .option-btn')].find(b => b.dataset.answer === session.current.correct_answer))");
ok('right answer → coverage store', E(`Progress.getExerciseHistory('${cur}').correct`) === 1);
ok('right answer → SRS store', !!JSON.parse(E("localStorage.getItem('app_srs')") || '{}')[cur]);
E("_showNext()");
const cur2 = E("session.current.exercise_id");
E("selectAnswer([...document.querySelectorAll('#opts .option-btn')].find(b => b.dataset.answer !== session.current.correct_answer))");
ok('wrong answer → coverage store', E(`Progress.getExerciseHistory('${cur2}').attempts || Progress.getExerciseHistory('${cur2}').incorrect || 0`) >= 1,
   JSON.stringify(E(`Progress.getExerciseHistory('${cur2}')`)));
ok('wrong answer → SRS store', !!JSON.parse(E("localStorage.getItem('app_srs')") || '{}')[cur2]);
ok('explanation shown on a miss', E("document.getElementById('feedback').textContent").length > 10);

// ── classic practice untouched ──
clean();
E("openModule('module_prepositions'); openExercise('module_prepositions','all')");
ok('classic queue has no vp items', E("[session.current, ...session.queue].filter(Boolean).every(e => !e.vp_id)"));
ok('classic picker visible', E("document.getElementById('prep-difficulty-picker').style.display") === 'block');

// ── a new verb's exercise records to both stores (Main engine) ──
clean();
E("Progress.unlockWord && Progress.unlockWord('verb_dauern')");
E("openModule('module_verbs'); openExercise('module_verbs','roots','prasens')");
E("session.queue.unshift(session.current); session.current = null; session.queue = appData.exercises['module_verbs'].filter(e => e.exercise_id === 'ex_verb_dauern_002'); _showNext()");
ok('new verb fill renders', E("session.current && session.current.exercise_id") === 'ex_verb_dauern_002');
E("selectAnswer([...document.querySelectorAll('#opts .option-btn')].find(b => b.dataset.answer === 'dauert'))");
ok('new verb answer → coverage store', E("Progress.getExerciseHistory('ex_verb_dauern_002').correct") === 1);
ok('new verb answer → SRS store', !!JSON.parse(E("localStorage.getItem('app_srs')") || '{}')['ex_verb_dauern_002']);

// ── Wiederholung can serve the new items ──
ok('review index knows vp items', E("Review.buildIndex(true)['ex_vp_angst_vor_1'] !== undefined"));
ok('review index knows new expressions', E("Review.buildIndex(true)['ex_expr_weder_noch_002'] !== undefined"));

// ── service worker ──
const sw = fs.readFileSync(APP + '/service-worker.js', 'utf8');
ok('SW cache bumped to v26', /mein-deutsch-v26/.test(sw));

console.log(`${checks - failures.length}/${checks} checks passed`);
failures.forEach(f => console.log('  FAIL ' + f));
process.exit(failures.length ? 1 : 0);
