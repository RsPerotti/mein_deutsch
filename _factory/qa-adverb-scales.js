/**
 * qa-adverb-scales.js — Session 42 suite for the Adverb Scales.
 *
 * Covers what the Python validator cannot see: the screens render from the bundle,
 * and a scale_choice answer actually travels the _recordAnswer funnel into BOTH
 * stores (the recurring "new exercise type forgets to persist" bug).
 * Every negative check is paired with the precondition that lets it fail.
 *
 * Run: NODE_PATH=~/qa/node_modules node _factory/qa-adverb-scales.js
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const APP = require('path').resolve(__dirname, '..');

const dom = new JSDOM(fs.readFileSync(APP + '/index.html', 'utf8'), {
  url: 'https://example.org/', runScripts: 'dangerously', pretendToBeVisual: true
});
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices:()=>[] };
w.navigator.serviceWorker = { register: () => Promise.resolve() };
w.scrollTo = () => {};
const errors = [];
w.addEventListener('error', e => errors.push(e.message));

let failures = [], checks = 0;
const ok = (n, c, m) => { checks++; if (!c) failures.push(n + (m === undefined ? '' : ': ' + m)); };

// Load exactly what index.html loads, in its order — so a missing <script> tag fails here.
const order = [...fs.readFileSync(APP + '/index.html', 'utf8').matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
ok('index.html loads js/scales.js', order.includes('js/scales.js'));
ok('service worker precaches js/scales.js', fs.readFileSync(APP + '/service-worker.js', 'utf8').includes("'./js/scales.js'"));
order.forEach(f => {
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(APP + '/' + f, 'utf8');
  w.document.body.appendChild(el);
});
w.eval('loadData()');
const E = s => w.eval(s);
const reset = () => E("SRS.reset(); localStorage.clear(); exerciseMode = 'module'; if (currentScreen !== 'screen-home') returnHome();");

// ── data in the bundle ───────────────────────────────────────────────────
ok('16 axes bundled', E('appData.adverbScales.axes.length') === 16, E('appData.adverbScales.axes.length'));
ok('213 adverbs bundled', E('appData.adverbs.length') === 213);
const nDrill = E("appData.exercises.module_adverbs.filter(e => e.type === 'scale_choice').length");
ok('drill exercises bundled', nDrill === 88, nDrill);

// ── screens ──────────────────────────────────────────────────────────────
reset();
E("currentModuleId = 'module_adverbs'; navigateTo('screen-module-home')");
ok('module home shows the Skalen card', E("document.getElementById('module-categories').innerHTML").includes('openAdverbScales()'));
E("navigateTo('screen-adverbliste')");
ok('Adverbliste shows the Skalen card (even with nothing unlocked)',
   E("document.getElementById('adverbliste-content').innerHTML").includes('openAdverbScales()'));
E('openAdverbScales()');
ok('list screen active', E('currentScreen') === 'screen-adverb-scales');
ok('list renders one card per axis', E("document.querySelectorAll('#adverb-scales-content .scale-list-card').length") === 16);

const axes = JSON.parse(E('JSON.stringify(appData.adverbScales.axes.map(a => [a.id, a.layout === "grid" ? a.cells.flat(2).length + a.side.reduce((n,s)=>n+s.words.length,0) : a.tiers.reduce((n,t)=>n+t.words.length,0) + a.side.reduce((n,s)=>n+s.words.length,0)]))'));
for (const [id, nChips] of axes) {
  E(`openAdverbScale(${JSON.stringify(id)})`);
  const got = E("document.querySelectorAll('#adverb-scale-content .scale-chip').length");
  ok(`axis ${id} renders all ${nChips} chips`, got === nChips, got);
  E('navigateBack()');
}
E("openAdverbScale('gewissheit')");
const chip = E("document.querySelector('#adverb-scale-content .scale-chip')");
ok('precondition: gloss hidden before tap', E(`document.getElementById(document.querySelector('#adverb-scale-content .scale-chip').dataset.gloss).style.display`) === 'none');
E("toggleScaleGloss(document.querySelector('#adverb-scale-content .scale-chip'))");
ok('tapping a chip shows its English', E(`document.getElementById(document.querySelector('#adverb-scale-content .scale-chip').dataset.gloss).textContent`).includes('definitely'));
ok('unverified word carries a ? badge', (E("openAdverbScale('intensitaet'), document.getElementById('adverb-scale-content').innerHTML").match(/scale-chip-unv/g) || []).length === 1);
ok('grid axis renders as grid', E("openAdverbScale('alle_keine'), document.querySelectorAll('#adverb-scale-content .scale-grid-row').length") === 5);

// ── a scale session ──────────────────────────────────────────────────────
reset();
E("openExercise('module_adverbs','scale:gewissheit')");
ok('scale session: only that axis', E("[session.current, ...session.queue].every(e => e.exercise_id.startsWith('ex_adv_scale_gewissheit_'))"));
ok('scale session: all 8 items', E('session.queue.length + 1') === 8, E('session.queue.length + 1'));
ok('renderer drew scale_choice options', E("document.querySelectorAll('#opts .option-btn').length") === E('1 + Math.min(3, session.current.wrong_answers.length)'));
ok('type label says Skala', E("document.querySelector('.exercise-type-label').textContent").startsWith('Skala'));

// mechanism: spy on both stores
E(`window._calls = [];
   const _rr = Progress.recordResult.bind(Progress), _sg = SRS.grade.bind(SRS);
   Progress.recordResult = (id, r) => { _calls.push(['P', id, r]); return _rr(id, r); };
   SRS.grade = (id, r) => { _calls.push(['S', id, r]); return _sg(id, r); };`);
const ex1 = E('session.current.exercise_id'), w1 = E('session.current.word_id');
ok('precondition: no history yet', E(`Progress.getExerciseHistory(${JSON.stringify(ex1)}).correct`) === 0);
ok('precondition: answer word not unlocked', E(`Progress.isUnlocked(${JSON.stringify(w1)})`) === false);
E(`selectAnswer([...document.querySelectorAll('#opts .option-btn')].find(b => b.dataset.answer === session.current.correct_answer))`);
ok('correct answer → Progress.recordResult(true)', E(`_calls.some(c => c[0]==='P' && c[1]===${JSON.stringify(ex1)} && c[2]===true)`));
ok('correct answer → SRS.grade(true)', E(`_calls.some(c => c[0]==='S' && c[1]===${JSON.stringify(ex1)} && c[2]===true)`));
ok('coverage store written', E(`Progress.getExerciseHistory(${JSON.stringify(ex1)}).correct`) === 1);
ok('retention store written', E(`!!JSON.parse(localStorage.getItem('app_srs')||'{}')[${JSON.stringify(ex1)}]`));
ok('correct answer unlocks the word', E(`Progress.isUnlocked(${JSON.stringify(w1)})`) === true);

E('_showNext()');
const ex2 = E('session.current.exercise_id');
const cd0 = E('session.cooldown.length');
E(`selectAnswer([...document.querySelectorAll('#opts .option-btn')].find(b => b.dataset.answer !== session.current.correct_answer))`);
ok('wrong answer → recordResult(false)', E(`_calls.some(c => c[0]==='P' && c[1]===${JSON.stringify(ex2)} && c[2]===false)`));
ok('wrong answer → cooldown', E('session.cooldown.length') === cd0 + 1);
ok('wrong answer shows the order', E("document.getElementById('feedback').textContent").includes('→'));

// review mode: SRS only (positive twin above shows Progress IS written in module play)
E("session.reviewMode = true; session.answered = false; _calls.length = 0");
E('session.current = session.queue[0]; _showNext()');
E("session.reviewMode = true");
const ex3 = E('session.current.exercise_id');
E(`selectAnswer([...document.querySelectorAll('#opts .option-btn')].find(b => b.dataset.answer === session.current.correct_answer))`);
ok('review answer grades SRS', E(`_calls.some(c => c[0]==='S' && c[1]===${JSON.stringify(ex3)})`));
ok('review answer does not touch coverage', !E(`_calls.some(c => c[0]==='P')`));
E('session.reviewMode = false');

// 'scales' = every ordering exercise; 'all' still serves everything
reset();
E("openExercise('module_adverbs','scales')");
ok("'scales' queue = every drill", E('session.queue.length + 1') === nDrill);
E('exitExerciseEarly && exitExerciseEarly()');
reset();
E("openExercise('module_adverbs','all')");
ok("'all' queue includes word + drill exercises", E('session.queue.length + 1') === E('appData.exercises.module_adverbs.length'));

ok('no uncaught errors', errors.length === 0, errors.join(' | '));
console.log(`${checks - failures.length}/${checks} checks passed`);
if (failures.length) { failures.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
