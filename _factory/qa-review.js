/**
 * qa-review.js — headless QA for the Wiederholung module (Session 40, Phase 2)
 *
 * The risk this suite exists to cover (PRD §5.4): review does not render
 * anything itself, it hands a mixed queue to the Main engine. So the failure
 * mode is not a wrong answer — it is the engine reaching for module state that a
 * cross-module session does not have. Most checks below are about exactly that.
 *
 * Setup:  npm install jsdom   (to ~/qa, not the project)
 * Run:    NODE_PATH=~/qa/node_modules node _factory/qa-review.js
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

let failures = [], checks = 0;
const fail = (n, m) => failures.push(n + ': ' + m);
const ok   = (n, c, m) => { checks++; if (!c) fail(n, m === undefined ? 'assertion failed' : String(m)); };

const load = f => {
  try {
    const el = w.document.createElement('script');
    el.textContent = fs.readFileSync(APP + '/' + f, 'utf8');
    w.document.body.appendChild(el);
  } catch (e) { fail('load ' + f, e.message); }
};

['js/data.js','js/listening-data.js','js/particles-data.js','js/prefixes-data.js',
 'js/grammar-data.js','js/article-grammar-data.js','js/declension-data.js',
 'js/progress.js','js/srs.js','js/wordlist.js','js/exercises.js','js/review.js',
 'js/wordpractice.js','js/listening.js','js/grammar.js','js/app.js'].forEach(load);

w.eval('loadData()');
const clean = () => w.eval("SRS.reset(); localStorage.removeItem('app_exercise_history');");

// ── wiring ─────────────────────────────────────────────────────────────────
ok('Review global exists', w.eval('typeof Review') === 'object');
const html = fs.readFileSync(APP + '/index.html', 'utf8');
ok('review.js is in index.html', /js\/review\.js/.test(html));
ok('review.js loads after exercises.js',
   html.indexOf('js/review.js') > html.indexOf('js/exercises.js'));
ok('review.js is precached',
   /js\/review\.js/.test(fs.readFileSync(APP + '/service-worker.js','utf8')));
ok('home has a slot for the card', !!w.document.getElementById('home-review-card'));
ok('results screen has an addressable module button',
   !!w.document.getElementById('results-module-btn'));

// ── index ──────────────────────────────────────────────────────────────────
const idx = w.eval('Object.keys(Review.buildIndex()).length');
ok('index covers a realistic number of exercises', idx > 5000, idx);
ok('index is cached', w.eval('Review.buildIndex() === Review.buildIndex()'));
ok('index tags Main-engine items',
   w.eval("Review.buildIndex()[appData.exercises.module_verbs[0].exercise_id].engine") === 'main');
ok('index tags Vorsilben as a later phase',
   w.eval("Review.buildIndex()[PREFIXES_DATA.exercises[0].id].engine") === 'prefix');
ok('index tags Deklination as a later phase',
   w.eval("Review.buildIndex()[DECLENSION_DATA.exercises[0].id].engine") === 'dekl');
ok('index derives Artikel items',
   w.eval("Review.buildIndex()['ex_artikel_' + appData.nouns[0].id].engine") === 'artikel');
ok('every indexed exercise carries its source module',
   w.eval('Object.values(Review.buildIndex()).every(e => !!e.ex._srcModule)'));
ok('indexing does not mutate appData',
   w.eval('appData.exercises.module_verbs[0]._srcModule') === undefined);

// ── due breakdown is honest about what it can serve ────────────────────────
clean();
w.eval(`
  const vIds = appData.exercises.module_verbs.slice(0,4).map(e=>e.exercise_id);
  const pIds = PREFIXES_DATA.exercises.slice(0,3).map(e=>e.id);
  const store = {};
  [...vIds, ...pIds].forEach(id => store[id] = {e:2.5,i:1,r:1,d:'2020-01-01',l:null,x:0});
  store['ex_deleted_content_001'] = {e:2.5,i:1,r:1,d:'2020-01-01',l:null,x:0};
  localStorage.setItem('app_srs', JSON.stringify(store));`);
ok('only Main-engine items are servable', w.eval('Review.dueBreakdown().servable.length') === 4,
   w.eval('Review.dueBreakdown().servable.length'));
ok('Phase 3 items are counted separately', w.eval('Review.dueBreakdown().later') === 3);
ok('scheduling state for deleted content is dropped, not served',
   w.eval('Review.dueBreakdown().unknown') === 1);
ok('dueCount matches what can be served', w.eval('Review.dueCount()') === 4);
ok('the home card promises only what it can serve',
   (() => { w.eval("renderHome()");
            const t = w.document.getElementById('home-review-card').textContent;
            return /4 fällig/.test(t); })(),
   w.document.getElementById('home-review-card').textContent.trim());

// ── queue ordering: most overdue first (PRD §5.7) ──────────────────────────
clean();
w.eval(`
  const ids = appData.exercises.module_verbs.slice(0,6).map(e=>e.exercise_id);
  const store = {};
  store[ids[0]] = {e:2.5,i:1,r:1,d:'2020-01-01',l:null,x:0};
  store[ids[1]] = {e:2.5,i:1,r:1,d:'2024-06-01',l:null,x:0};
  store[ids[2]] = {e:2.5,i:1,r:1,d:'2024-06-01',l:null,x:0};
  store[ids[3]] = {e:2.5,i:1,r:1,d:SRS.today(),  l:null,x:0};
  store[ids[4]] = {e:2.5,i:1,r:1,d:'2099-01-01',l:null,x:0};
  localStorage.setItem('app_srs', JSON.stringify(store));
  window._qIds = ids;`);
ok('queue holds only due items', w.eval('Review.buildQueue().length') === 4);
ok('most overdue is served first',
   w.eval('Review.buildQueue()[0].exercise_id') === w.eval('window._qIds[0]'));
ok('a future item is never queued',
   w.eval('Review.buildQueue().every(e => e.exercise_id !== window._qIds[4])'));

// ── a genuinely mixed queue ────────────────────────────────────────────────
clean();
w.eval(`
  const store = {};
  ['module_verbs','module_nouns','module_adverbs','module_particles','module_prepositions']
    .forEach(m => (appData.exercises[m]||[]).slice(0,6).forEach(e =>
      store[e.exercise_id || e.id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0}));
  localStorage.setItem('app_srs', JSON.stringify(store));`);
const mods = w.eval('JSON.stringify([...new Set(Review.buildQueue().map(e=>e._srcModule))].sort())');
ok('the queue spans several modules at once', JSON.parse(mods).length >= 4, mods);

// ── the session: the Main engine driving a mixed queue ─────────────────────
w.eval("Review.open()");
ok('opening review switches the exercise mode', w.eval('exerciseMode') === 'review');
ok('review reaches the exercise screen', w.eval('currentScreen') === 'screen-exercise');
ok('the session is flagged as review', w.eval('session.reviewMode') === true);
ok('the session has no module', w.eval('session.moduleId') === null);
ok('the session queue was populated', w.eval('session.reviewTotal') > 0);
ok('the context pill names the module and the count',
   /WIEDERHOLUNG · \d+ FÄLLIG/.test(w.eval("document.getElementById('exercise-context-label').textContent")),
   w.eval("document.getElementById('exercise-context-label').textContent"));
ok('module pickers are hidden in a mixed queue',
   ['prep-difficulty-picker','verb-tense-picker','dekl-cefr-picker'].every(
     id => w.eval(`(document.getElementById('${id}')||{style:{display:'none'}}).style.display`) === 'none'));
ok('an exercise is actually rendered',
   w.eval("document.getElementById('exercise-card').innerHTML.length") > 50);
ok('_srcModule falls back to the item in a mixed queue',
   w.eval('_srcModule()') === w.eval('session.current._srcModule'));
ok('_srcModule prefers the session in module play',
   w.eval("(function(){const k=session.moduleId;session.moduleId='module_verbs';const r=_srcModule();session.moduleId=k;return r;})()") === 'module_verbs');

// ── grading through the engine reaches the scheduler, not the bars ─────────
const curId = w.eval('session.current.exercise_id || session.current.id');
const before = w.eval(`JSON.stringify(SRS.get(${JSON.stringify(curId)}))`);
w.eval(`(function(){
  const ex = session.current;
  const correct = ex.correct_answer ?? ex.correct;
  document.getElementById('exercise-card').innerHTML =
    '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
  selectAnswer(document.querySelector('#opts .option-btn'));
})()`);
ok('answering in review advances the schedule',
   w.eval(`JSON.stringify(SRS.get(${JSON.stringify(curId)}))`) !== before);
ok('answering in review does NOT touch the progress bars',
   w.eval(`Progress.getExerciseHistory(${JSON.stringify(curId)}).correct`) === 0,
   w.eval(`Progress.getExerciseHistory(${JSON.stringify(curId)}).correct`));
ok('review unlocks nothing', w.eval('session.newlyUnlocked.length') === 0);
ok('a correct review answer counts', w.eval('session.correctCount') === 1);

// ── a wrong answer in review ───────────────────────────────────────────────
w.eval('_showNext()');
const wrongId = w.eval('session.current.exercise_id || session.current.id');
w.eval(`(function(){
  const ex = session.current;
  const correct = ex.correct_answer ?? ex.correct;
  document.getElementById('exercise-card').innerHTML =
    '<div id="opts"><button class="option-btn" data-answer="__wrong__"></button>' +
    '<button class="option-btn" data-answer="' + correct + '"></button></div>';
  selectAnswer(document.querySelector('#opts .option-btn'));
})()`);
ok('a missed review item resets its interval', w.eval(`SRS.get(${JSON.stringify(wrongId)}).i`) === 0);
ok('a missed review item is due again today',
   w.eval(`SRS.get(${JSON.stringify(wrongId)}).d`) === w.eval('SRS.today()'));
ok('a missed item returns later in the same session', w.eval('session.cooldown.length') === 1);
ok('wrong answers are counted for the hit rate', w.eval('session.incorrectCount') === 1);
ok('a miss in review still does not touch the progress bars',
   w.eval(`Progress.getExerciseHistory(${JSON.stringify(wrongId)}).incorrect`) === 0);

// ── finishing ──────────────────────────────────────────────────────────────
w.eval('Review.finish()');
ok('finishing leaves review mode', w.eval('exerciseMode') === 'module');
ok('finishing shows the results screen', w.eval('currentScreen') === 'screen-results');
ok('results report the hit rate',
   /Trefferquote/.test(w.eval("document.getElementById('results-stats').textContent")));
ok('results count what is still due',
   /Noch fällig/.test(w.eval("document.getElementById('results-stats').textContent")));
ok('the stale "back to module" button is hidden after review',
   w.eval("document.getElementById('results-module-btn').style.display") === 'none');
w.eval("session.newlyUnlocked=[];session.correctCount=0;_showResults()");
ok('module play restores that button',
   w.eval("document.getElementById('results-module-btn').style.display") !== 'none');

// ── emptying the queue ends the session rather than falling to a module ────
clean();
w.eval(`
  const id = appData.exercises.module_verbs[0].exercise_id;
  localStorage.setItem('app_srs', JSON.stringify({ [id]: {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0} }));
  Review.open();`);
ok('a one-item review session starts', w.eval('session.reviewTotal') === 1);
w.eval(`(function(){
  const ex = session.current;
  const correct = ex.correct_answer ?? ex.correct;
  document.getElementById('exercise-card').innerHTML =
    '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
  selectAnswer(document.querySelector('#opts .option-btn'));
  _showNext();
})()`);
ok('emptying the queue ends at the results screen, not a module home',
   w.eval('currentScreen') === 'screen-results', w.eval('currentScreen'));

// ── leaving early ──────────────────────────────────────────────────────────
clean();
w.eval(`
  const store = {};
  appData.exercises.module_verbs.slice(0,5).forEach(e =>
    store[e.exercise_id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  localStorage.setItem('app_srs', JSON.stringify(store));
  Review.open(); exitExerciseEarly();`);
ok('leaving a review session early shows results', w.eval('currentScreen') === 'screen-results');
ok('leaving early clears review mode', w.eval('exerciseMode') === 'module');
ok('leaving early reports what is still due',
   /Noch fällig/.test(w.eval("document.getElementById('results-stats').textContent")));

// ── nothing due ────────────────────────────────────────────────────────────
clean();
w.eval('renderHome()');
const emptyCard = w.document.getElementById('home-review-card').textContent;
ok('the card still shows when nothing is due', /Wiederholung/.test(emptyCard), emptyCard.trim());
ok('the card says nothing is due', /Nichts fällig/.test(emptyCard), emptyCard.trim());
ok('opening review with nothing due does nothing',
   (() => { const s = w.eval('currentScreen'); w.eval('Review.open()');
            return w.eval('currentScreen') === s && w.eval('exerciseMode') !== 'review'; })());

// ── no internal jargon on a learner-facing screen ──────────────────────────
clean();
w.eval(`
  const store = {};
  appData.exercises.module_verbs.slice(0,3).forEach(e =>
    store[e.exercise_id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  PREFIXES_DATA.exercises.slice(0,2).forEach(e =>
    store[e.id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  localStorage.setItem('app_srs', JSON.stringify(store));
  renderHome();`);
const cardText = w.document.getElementById('home-review-card').textContent;
ok('the card names what is not yet servable', /noch nicht verfügbar/.test(cardText), cardText.trim());
ok('the card leaks no build-phase jargon', !/Phase\s*\d|engine|main/i.test(cardText), cardText.trim());

// ── module play is untouched ───────────────────────────────────────────────
clean();
w.eval("exerciseMode='module'; openExercise('module_verbs','roots','prasens');");
ok('module play still builds a session', w.eval('session.queue.length') > 0);
ok('module play is not review mode', !w.eval('session.reviewMode'));
ok('module play still knows its module', w.eval('session.moduleId') === 'module_verbs');
ok('module play still shows its context pill',
   /VERBEN/.test(w.eval("document.getElementById('exercise-context-label').textContent")));
const mId = w.eval('session.current.exercise_id');
w.eval(`(function(){
  const ex = session.current;
  const correct = ex.correct_answer ?? ex.correct;
  document.getElementById('exercise-card').innerHTML =
    '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
  selectAnswer(document.querySelector('#opts .option-btn'));
})()`);
ok('module play still writes the progress bars',
   w.eval(`Progress.getExerciseHistory(${JSON.stringify(mId)}).correct`) === 1);
ok('module play still schedules', w.eval(`!!SRS.get(${JSON.stringify(mId)})`));
ok('module play still unlocks words', w.eval('session.newlyUnlocked.length') > 0);

// ── report ─────────────────────────────────────────────────────────────────
console.log('\nchecks run: ' + checks);
if (failures.length) {
  console.log('❌ ' + failures.length + ' failed:');
  failures.forEach(f => console.log('   - ' + f));
  process.exit(1);
}
console.log('✅ all checks passed');
