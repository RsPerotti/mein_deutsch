/**
 * qa-review.js — headless QA for the Wiederholung module (Session 40, Phase 2)
 *
 * The risk this suite exists to cover (PRD §5.4): review renders nothing itself,
 * it hands each item to whichever of the four engines can draw it. So the failure
 * mode is not a wrong answer — it is an engine reaching for module state that a
 * cross-module session does not have, or an engine advancing into its own empty
 * queue instead of handing control back. Most checks below are about that.
 *
 * Phase 3: all four engines participate, and Review owns the queue, the
 * counters, the requeue-on-miss and the HUD. The engines own none of it.
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
// Reset between blocks. Returning home matters: navigateTo() early-returns when
// already on the target screen, so a block that ends mid-session would leave the
// next Review.open() continuing the old one instead of starting fresh.
const clean = () => w.eval(
  "SRS.reset(); localStorage.removeItem('app_exercise_history');" +
  // Unlock stores too: a check that review unlocks nothing is vacuous if the
  // word was already unlocked by an earlier block, because _unlockWord returns
  // early either way. Found by the mutation test — the check passed on code
  // with the reviewMode guard removed.
  "['app_unlocked_words','app_verbs_root_unlocked','app_verbs_variant_unlocked'," +
  " 'app_nouns_root_unlocked','app_nouns_variant_unlocked','app_adverbs_unlocked'," +
  " 'app_adjectives_unlocked'].forEach(k => localStorage.removeItem(k));" +
  "if (currentScreen !== 'screen-home') returnHome();");

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
ok('every engine is servable now', w.eval('Review.dueBreakdown().servable.length') === 7,
   w.eval('Review.dueBreakdown().servable.length'));
ok('Vorsilben items are served by their own engine',
   w.eval("Review.dueBreakdown().servable.filter(e=>e.engine==='prefix').length") === 3);
ok('scheduling state for deleted content is dropped, not served',
   w.eval('Review.dueBreakdown().unknown') === 1);
ok('dueCount matches what can be served', w.eval('Review.dueCount()') === 7);
ok('the home card reports the true due count',
   (() => { w.eval("renderHome()");
            const t = w.document.getElementById('home-review-card').textContent;
            return /7 fällig/.test(t); })(),
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
ok('queue entries carry their engine', w.eval("Review.buildQueue().every(e => !!e.engine)"));
ok('most overdue is served first',
   w.eval('Review.buildQueue()[0].ex.exercise_id') === w.eval('window._qIds[0]'));
ok('a future item is never queued',
   w.eval('Review.buildQueue().every(e => e.ex.exercise_id !== window._qIds[4])'));

// ── a genuinely mixed queue ────────────────────────────────────────────────
clean();
w.eval(`
  const store = {};
  ['module_verbs','module_nouns','module_adverbs','module_particles','module_prepositions']
    .forEach(m => (appData.exercises[m]||[]).slice(0,6).forEach(e =>
      store[e.exercise_id || e.id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0}));
  localStorage.setItem('app_srs', JSON.stringify(store));`);
const mods = w.eval('JSON.stringify([...new Set(Review.buildQueue().map(e=>e.ex._srcModule))].sort())');
ok('the queue spans several modules at once', JSON.parse(mods).length >= 4, mods);

// ── the session: the Main engine driving a mixed queue ─────────────────────
w.eval("Review.open()");
ok('opening review switches the exercise mode', w.eval('exerciseMode') === 'review');
ok('review reaches the exercise screen', w.eval('currentScreen') === 'screen-exercise');
ok('the session is flagged as review', w.eval('session.reviewMode') === true);
ok('the session has no module', w.eval('session.moduleId') === null);
ok('the session queue was populated', w.eval('Review._total') > 0);
ok('review reports itself active', w.eval('Review.isActive()') === true);
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
const unlockedBefore = w.eval('Progress.getUnlockedWords().length');
ok('the item under review is not already unlocked (so the next check can fail)',
   !w.eval('Progress.isUnlocked(session.current.word_id)'),
   w.eval('session.current.word_id'));
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
ok('review unlocks nothing', w.eval('Progress.getUnlockedWords().length') === unlockedBefore
   && w.eval('session.newlyUnlocked.length') === 0,
   w.eval('Progress.getUnlockedWords().length') + ' vs ' + unlockedBefore);
ok('a correct review answer counts', w.eval('Review._correct') === 1);

// ── review never unlocks (deterministic: verbs only) ───────────────────────
// Seeded with verb items specifically. Particles and prepositions skip the
// unlock path anyway, so a shuffled mixed queue made this check pass or fail by
// luck — it read as covered while the rule was unenforced.
clean();
w.eval(`
  const store = {};
  appData.exercises.module_verbs.filter(e => e.word_id).slice(0,4)
    .forEach(e => store[e.exercise_id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  localStorage.setItem('app_srs', JSON.stringify(store));
  Review.open();`);
ok('the unlock check has a verb item to work with',
   !!w.eval('session.current.word_id') && w.eval('_srcModule()') === 'module_verbs',
   w.eval('_srcModule()'));
ok('that word is genuinely locked beforehand',
   !w.eval('Progress.isUnlocked(session.current.word_id)'));
const lockedWord = w.eval('session.current.word_id');
const nUnlocked  = w.eval('Progress.getUnlockedWords().length');
w.eval(`(function(){
  const ex = session.current;
  const correct = ex.correct_answer ?? ex.correct;
  document.getElementById('exercise-card').innerHTML =
    '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
  selectAnswer(document.querySelector('#opts .option-btn'));
})()`);
ok('a correct review answer does not unlock the word',
   !w.eval(`Progress.isUnlocked(${JSON.stringify(lockedWord)})`), lockedWord);
ok('a correct review answer does not grow the unlocked list',
   w.eval('Progress.getUnlockedWords().length') === nUnlocked,
   w.eval('Progress.getUnlockedWords().length') + ' vs ' + nUnlocked);
ok('nothing is reported as newly unlocked', w.eval('session.newlyUnlocked.length') === 0);

// The same answer in module play MUST unlock — otherwise the check above would
// pass on code that simply never unlocks anything.
clean();
w.eval("exerciseMode='module'; openExercise('module_verbs','roots','prasens');");
const mWord = w.eval('session.current.word_id');
w.eval(`(function(){
  const ex = session.current;
  const correct = ex.correct_answer ?? ex.correct;
  document.getElementById('exercise-card').innerHTML =
    '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
  selectAnswer(document.querySelector('#opts .option-btn'));
})()`);
ok('module play does unlock, so the review check means something',
   w.eval(`Progress.isUnlocked(${JSON.stringify(mWord)})`), mWord);

// ── a wrong answer in review ───────────────────────────────────────────────
// Sets up its own session rather than inheriting one — the blocks above end in
// module play, and an inherited session made this silently test nothing.
clean();
w.eval(`
  const store = {};
  appData.exercises.module_verbs.slice(0,4).forEach(e => store[e.exercise_id] =
    {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  localStorage.setItem('app_srs', JSON.stringify(store));
  Review.open();`);
ok('the wrong-answer block has a review session', w.eval('Review.isActive()') === true);
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
ok('a missed item returns later in the same session', w.eval('Review._cooldown.length') === 1);
ok('the engine does not keep a cooldown of its own', w.eval('session.cooldown.length') === 0);
ok('wrong answers are counted for the hit rate', w.eval('Review._incorrect') === 1);
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
ok('a one-item review session starts', w.eval('Review._total') === 1);
w.eval(`(function(){
  const ex = session.current;
  const correct = ex.correct_answer ?? ex.correct;
  document.getElementById('exercise-card').innerHTML =
    '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
  selectAnswer(document.querySelector('#opts .option-btn'));
  Review.advance();
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

// ══ PHASE 3: the other three engines ══════════════════════════════════════
// Each is handed exactly one item, must draw it, grade it into the scheduler,
// and hand control back rather than advancing into its own empty queue.

const ENGINES = [
  { name: 'dekl',    sess: '_deklSession',    advance: '_deklShowNext',
    seed: "DECLENSION_DATA.exercises.slice(0,3).map(e=>e.id)",
    answer: `(function(right){
       const ex = _deklSession.current;
       document.getElementById('exercise-card').innerHTML =
         '<input id="dekl-ending-input">';
       document.getElementById('dekl-ending-input').value = right ? ex.correct : 'zzz';
       submitDeklinationAnswer();
     })` },
  { name: 'prefix',  sess: '_prefixSession',  advance: '_prefixShowNext',
    seed: "PREFIXES_DATA.exercises.slice(0,3).map(e=>e.id)",
    answer: `(function(right){
       const ex = _prefixSession.current;
       document.getElementById('exercise-card').innerHTML =
         '<div id="opts"><button class="option-btn" data-answer="' +
         (right ? ex.correct : '__wrong__') + '"></button>' +
         '<button class="option-btn" data-answer="' + ex.correct + '"></button></div>';
       selectPrefixAnswer(document.querySelector('#opts .option-btn'));
     })` },
  { name: 'artikel', sess: '_artikelSession', advance: '_artikelShowNext',
    seed: "appData.nouns.slice(0,3).map(n=>'ex_artikel_'+n.id)",
    answer: `(function(right){
       const ex = _artikelSession.current;
       const wrong = ['der','die','das'].find(a => a !== ex.correct_article);
       selectArticleAnswer(right ? ex.correct_article : wrong);
     })` }
];

for (const eng of ENGINES) {
  clean();
  w.eval(`
    const store = {};
    (${eng.seed}).forEach(id => store[id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
    localStorage.setItem('app_srs', JSON.stringify(store));
    Review.open();`);

  ok(`[${eng.name}] a session starts`, w.eval('Review._total') === 3, w.eval('Review._total'));
  ok(`[${eng.name}] the right engine is dispatched to`, w.eval('Review._engine') === eng.name,
     w.eval('Review._engine'));
  ok(`[${eng.name}] its session is flagged as review`, w.eval(`${eng.sess}.reviewMode`) === true);
  ok(`[${eng.name}] it is handed exactly one item`,
     w.eval(`${eng.sess}.queue.length`) === 0 && w.eval(`!!${eng.sess}.current`),
     w.eval(`${eng.sess}.queue.length`));
  ok(`[${eng.name}] it draws the card`,
     w.eval("document.getElementById('exercise-card').innerHTML.length") > 40);

  // A correct answer must reach the scheduler but not the progress bars.
  const id1 = w.eval(`${eng.sess}.current.id`);
  w.eval(`window._answer = ${eng.answer}; window._answer(true);`);
  // Seeded at r:1,i:1, so a correct answer is the second consecutive rep: 6 days.
  ok(`[${eng.name}] answering advances the schedule`,
     w.eval(`SRS.get(${JSON.stringify(id1)}).i`) === 6, w.eval(`SRS.get(${JSON.stringify(id1)}).i`));
  ok(`[${eng.name}] answering does not touch the progress bars`,
     w.eval(`Progress.getExerciseHistory(${JSON.stringify(id1)}).correct`) === 0);
  ok(`[${eng.name}] Review counted it, not the engine`, w.eval('Review._correct') === 1);

  // Advancing must come back to Review, not run the engine's own results screen.
  w.eval('advanceExercise()');
  ok(`[${eng.name}] advancing hands control back to Review`,
     w.eval('currentScreen') === 'screen-exercise' && w.eval('Review._queue.length') === 1,
     w.eval('currentScreen') + ' q=' + w.eval('Review._queue.length'));

  // A miss requeues into Review's cooldown, not the engine's.
  const id2 = w.eval(`${eng.sess}.current.id`);
  w.eval('window._answer(false);');
  ok(`[${eng.name}] a miss resets the interval`, w.eval(`SRS.get(${JSON.stringify(id2)}).i`) === 0);
  ok(`[${eng.name}] the miss requeues into Review`, w.eval('Review._cooldown.length') === 1);
  ok(`[${eng.name}] the engine keeps no cooldown`, w.eval(`${eng.sess}.cooldown.length`) === 0);
  ok(`[${eng.name}] Review counted the miss`, w.eval('Review._incorrect') === 1);

  // The HUD reflects the session, not the one-item shell.
  ok(`[${eng.name}] the queue chip counts the session, not the card`,
     w.eval("+document.getElementById('chip-queue').textContent") >= 1,
     w.eval("document.getElementById('chip-queue').textContent"));

  // Drain: must reach results, never the engine's own results screen.
  let guard = 0;
  while (w.eval('Review.isActive()') && guard++ < 40) {
    if (w.eval(`!!${eng.sess}.current && !${eng.sess}.answered`)) w.eval('window._answer(true);');
    w.eval('advanceExercise()');
  }
  ok(`[${eng.name}] the session drains and ends at the shared results screen`,
     w.eval('currentScreen') === 'screen-results', w.eval('currentScreen') + ' after ' + guard);
  ok(`[${eng.name}] draining did not run away`, guard < 40, guard);
}

// ── the "FRAGE n" counter tracks the session, not the one-item shell ───────
// Each engine is handed a shell whose correctCount is always 0, so a naive
// counter reads "FRAGE 1" on every card of a 40-item session.
clean();
w.eval(`
  const store = {};
  appData.exercises.module_verbs.slice(0,3).forEach(e => store[e.exercise_id] =
    {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  DECLENSION_DATA.exercises.slice(0,3).forEach(e => store[e.id] =
    {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  localStorage.setItem('app_srs', JSON.stringify(store));
  Review.open();`);
const counterOf = () => {
  const el = w.document.querySelector('.exercise-counter');
  const m = el && el.textContent.match(/(\d+)/);
  return m ? +m[1] : null;
};
ok('the first review card is question 1', counterOf() === 1, counterOf());
const answerCurrent = () => w.eval(`(function(){
  const eng = Review._engine;
  if (eng === 'dekl') {
    const ex = _deklSession.current;
    document.getElementById('dekl-ending-input').value = ex.correct;
    submitDeklinationAnswer();
  } else {
    const ex = session.current;
    const correct = ex.correct_answer ?? ex.correct;
    document.getElementById('exercise-card').innerHTML =
      '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
    selectAnswer(document.querySelector('#opts .option-btn'));
  }
  advanceExercise();
})()`);
answerCurrent();
ok('the counter advances to question 2', counterOf() === 2, counterOf());
answerCurrent();
ok('the counter keeps advancing across engines', counterOf() === 3, counterOf());
ok('the counter advanced across at least two different engines',
   w.eval('Review.answeredCount()') === 2, w.eval('Review.answeredCount()'));

// Module play keeps its own semantics.
clean();
w.eval("exerciseMode='module'; openExercise('module_verbs','roots','prasens');");
ok('module play still numbers from its own session', counterOf() === 1, counterOf());

// ── the Weiter button dispatches to the engine that drew the card ──────────
// Not "does advancing work" — advancing can appear to work by accident, because
// a spent Main-engine shell also falls through to Review.next(). This asserts
// the actual dispatch target, which is what breaks when a review session opens
// on a non-Main item and `session` is still a real module session.
for (const eng of ENGINES) {
  clean();
  ok(`[${eng.name}] the harness starts from a clean screen`,
     w.eval('currentScreen') === 'screen-home', w.eval('currentScreen'));
  w.eval(`
    const store = {};
    (${eng.seed}).slice(0,2).forEach(id => store[id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
    localStorage.setItem('app_srs', JSON.stringify(store));
    // A real module session left behind, as it would be after playing a module.
    session = { moduleId:'module_verbs', category:'roots', queue:[], cooldown:[],
                retries:{}, correctCount:0, newlyUnlocked:[], current:null, answered:false };
    Review.open();
    window.__spy = 0;
    window.__orig = ${eng.advance};
    ${eng.advance} = function(){ window.__spy++; return window.__orig.apply(this, arguments); };`);
  w.eval(`window._answer = ${eng.answer}; window._answer(true);`);
  w.eval('advanceExercise()');
  ok(`[${eng.name}] Weiter dispatches to its own engine`, w.eval('window.__spy') > 0,
     w.eval('window.__spy'));
  ok(`[${eng.name}] a stale module session does not hijack the advance`,
     w.eval('currentScreen') === 'screen-exercise', w.eval('currentScreen'));
  w.eval(`${eng.advance} = window.__orig;`);
}

ok('opening review from the exercise screen restarts rather than continues',
   (() => { clean();
     w.eval(`const store = {};
       appData.exercises.module_verbs.slice(0,4).forEach(e => store[e.exercise_id] =
         {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
       localStorage.setItem('app_srs', JSON.stringify(store));
       Review.open();`);
     const first = w.eval('Review._total');
     w.eval('Review.open()');   // still on screen-exercise
     return first === 4 && w.eval('Review._total') === 4 && w.eval('Review._queue.length') === 3;
   })(),
   w.eval('Review._total') + '/' + w.eval('Review._queue.length'));

// ── a queue mixing all four engines ────────────────────────────────────────
clean();
w.eval(`
  const store = {};
  appData.exercises.module_verbs.slice(0,3).forEach(e => store[e.exercise_id] =
    {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  DECLENSION_DATA.exercises.slice(0,3).forEach(e => store[e.id] =
    {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  PREFIXES_DATA.exercises.slice(0,3).forEach(e => store[e.id] =
    {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  appData.nouns.slice(0,3).forEach(n => store['ex_artikel_'+n.id] =
    {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  localStorage.setItem('app_srs', JSON.stringify(store));`);
const engines = w.eval("JSON.stringify([...new Set(Review.buildQueue().map(e=>e.engine))].sort())");
ok('a queue can span all four engines', JSON.parse(engines).length === 4, engines);
w.eval('Review.open()');
const seen = new Set();
let guard2 = 0;
while (w.eval('Review.isActive()') && guard2++ < 60) {
  seen.add(w.eval('Review._engine'));
  w.eval(`(function(){
    const eng = Review._engine;
    if (eng === 'dekl') {
      const ex = _deklSession.current;
      document.getElementById('exercise-card').innerHTML = '<input id="dekl-ending-input">';
      document.getElementById('dekl-ending-input').value = ex.correct;
      submitDeklinationAnswer();
    } else if (eng === 'artikel') {
      selectArticleAnswer(_artikelSession.current.correct_article);
    } else {
      const s = (eng === 'prefix') ? _prefixSession : session;
      const ex = s.current;
      const correct = ex.correct_answer ?? ex.correct;
      document.getElementById('exercise-card').innerHTML =
        '<div id="opts"><button class="option-btn" data-answer="' + correct + '"></button></div>';
      if (eng === 'prefix') selectPrefixAnswer(document.querySelector('#opts .option-btn'));
      else selectAnswer(document.querySelector('#opts .option-btn'));
    }
  })()`);
  w.eval('advanceExercise()');
}
ok('a single session really drives all four engines', seen.size === 4, [...seen].join(','));
ok('the mixed session completes', w.eval('currentScreen') === 'screen-results', w.eval('currentScreen'));
ok('every item in the mixed session was graded', w.eval('Review._correct') === 12,
   w.eval('Review._correct'));
ok('the mixed session left review mode', w.eval('exerciseMode') === 'module');

// ── the three engines still work in their own modules ──────────────────────
clean();
w.eval("exerciseMode='deklination'; startDeklinationExercise();");
ok('Deklination module play still builds a full queue', w.eval('_deklSession.queue.length') > 10);
ok('Deklination module play is not review mode', !w.eval('_deklSession.reviewMode'));
w.eval(`(function(){
  const ex = _deklSession.current;
  document.getElementById('exercise-card').innerHTML = '<input id="dekl-ending-input">';
  document.getElementById('dekl-ending-input').value = 'zzz';
  submitDeklinationAnswer();
})()`);
ok('Deklination module play still keeps its own cooldown', w.eval('_deklSession.cooldown.length') === 1);
ok('Deklination module play still writes the progress bars',
   w.eval('Object.keys(JSON.parse(localStorage.getItem("app_exercise_history")||"{}")).length') === 1);

clean();
w.eval("exerciseMode='prefix'; startPrefixExercise();");
ok('Vorsilben module play still builds a full queue', w.eval('_prefixSession.queue.length') > 10);
ok('Vorsilben module play is not review mode', !w.eval('_prefixSession.reviewMode'));

clean();
w.eval(`appData.nouns.filter(n=>n.section==='roots').slice(0,5)
          .forEach(n=>Progress.unlockRootNoun(n.id));
        exerciseMode='artikel'; startArtikelExercise();`);
ok('Artikel module play still builds a full queue', w.eval('_artikelSession.queue.length') === 4);
ok('Artikel module play is not review mode', !w.eval('_artikelSession.reviewMode'));

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
ok('the card counts every engine', /5 fällig/.test(cardText), cardText.trim());
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
