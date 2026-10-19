/**
 * qa-stuck-mode.js — Session 41 regression suite.
 *
 * Bug: leaving any special-mode session (Wiederholung, Vorsilben, Artikel,
 * Deklination) with the OS/browser back gesture fires popstate -> navigateBack(),
 * which never ran exitExerciseEarly(). exerciseMode stayed e.g. 'review', so the
 * next tap on Stammverben silently started a REVIEW session: mixed queue,
 * reviewMode on, no progress-bar writes.
 *
 * Every "does not happen" check below is paired with the precondition that makes
 * it capable of failing (see vacuous-checks).
 *
 * Run: NODE_PATH=~/qa/node_modules node _factory/qa-stuck-mode.js
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
const ok = (n, c, m) => { checks++; if (!c) failures.push(n + (m === undefined ? '' : ': ' + m)); };
['js/data.js','js/listening-data.js','js/particles-data.js','js/prefixes-data.js',
 'js/grammar-data.js','js/article-grammar-data.js','js/declension-data.js',
 'js/progress.js','js/srs.js','js/wordlist.js','js/exercises.js','js/review.js',
 'js/wordpractice.js','js/listening.js','js/grammar.js','js/app.js'].forEach(f => {
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(APP + '/' + f, 'utf8');
  w.document.body.appendChild(el);
});
w.eval('loadData()');

const reset = () => w.eval(
  "SRS.reset(); localStorage.removeItem('app_exercise_history');" +
  "exerciseMode = 'module'; if (currentScreen !== 'screen-home') returnHome();");
const back = () => w.dispatchEvent(new w.PopStateEvent('popstate', { state: {} }));
const seedDue = () => w.eval(`
  const st = {};
  appData.exercises.module_nouns.slice(0,5).forEach(e =>
    st[e.exercise_id] = {e:2.5,i:1,r:1,d:SRS.today(),l:null,x:0});
  localStorage.setItem('app_srs', JSON.stringify(st));`);
const openStamm = () => w.eval(`
  currentModuleId = 'module_verbs'; navigateTo('screen-module-home');
  openExercise('module_verbs','roots','prasens');`);

// ── positive twin: in-app back from review already worked ────────────────
reset(); seedDue();
w.eval('Review.open()');
ok('precondition: review is active', w.eval('exerciseMode') === 'review' && w.eval('Review.isActive()'));
w.eval('exitExerciseEarly()');
ok('in-app back leaves review mode', w.eval('exerciseMode') === 'module');

// ── the bug: gesture back out of review ───────────────────────────────────
reset(); seedDue();
w.eval('Review.open()');
ok('precondition: in review on exercise screen',
   w.eval('exerciseMode') === 'review' && w.eval('currentScreen') === 'screen-exercise');
back();
ok('gesture back leaves the exercise screen', w.eval('currentScreen') !== 'screen-exercise', w.eval('currentScreen'));
ok('gesture back leaves review mode', w.eval('exerciseMode') === 'module', w.eval('exerciseMode'));
ok('gesture back deactivates the review session', w.eval('Review.isActive()') === false);

w.eval('returnHome()');
openStamm();
ok('Stammverben then starts a module session (not review)', w.eval('session.reviewMode') !== true);
ok('…for the Verbs module', w.eval('session.moduleId') === 'module_verbs', w.eval('session.moduleId'));
ok('…with a non-empty queue', w.eval('session.current') !== null);

// mechanism + outcome: answering correctly writes coverage history
const exId = w.eval('session.current.exercise_id');
w.eval("_recordAnswer(session.current.exercise_id, true, session)");
ok('a Stammverben answer moves the progress store',
   w.eval(`Progress.getExerciseHistory(${JSON.stringify(exId)}).correct`) === 1);

// ── defence in depth: even with a stale mode, openExercise wins ───────────
reset(); seedDue();
w.eval("exerciseMode = 'review'");   // simulate any other stale path
openStamm();
ok('openExercise resets a stale review mode', w.eval('session.reviewMode') !== true && w.eval('exerciseMode') === 'module');

// ── the other special engines ─────────────────────────────────────────────
for (const mode of ['prefix', 'artikel', 'deklination']) {
  reset();
  w.eval(`exerciseMode = '${mode}'; navigateTo('screen-exercise')`);
  ok(`precondition: ${mode} mode set`, w.eval('exerciseMode') === mode);
  back();
  ok(`gesture back leaves ${mode} mode`, w.eval('exerciseMode') === 'module', w.eval('exerciseMode'));
}

// ── Stammverben / Variationen split (data side of Session 41) ─────────────
const clearVerbUnlocks = () => w.eval(
  "['app_unlocked_words','app_verbs_root_unlocked','app_verbs_variant_unlocked']" +
  ".forEach(k => localStorage.removeItem(k))");
reset(); clearVerbUnlocks();
openStamm();
const rootQ = JSON.parse(w.eval(
  "JSON.stringify([session.current, ...session.queue].map(e => e.word_id))"));
const stammIds = new Set(JSON.parse(w.eval("JSON.stringify(_stammverben().map(v=>v.id))")));
ok('precondition: Stammverben queue is non-empty', rootQ.length > 500, rootQ.length);
ok('every Stammverben exercise belongs to a Stammverb', rootQ.every(id => stammIds.has(id)),
   rootQ.filter(id => !stammIds.has(id)).slice(0, 5));
ok('verkaufen is not served as a Stammverb', !rootQ.includes('verb_verkaufen'));
ok('anbieten is not served as a Stammverb', !rootQ.includes('verb_anbieten'));
ok('restored base bieten IS served as a Stammverb', rootQ.includes('verb_bieten'));

w.eval("exitExerciseEarly()"); reset(); clearVerbUnlocks();
const varQ = () => JSON.parse(w.eval(`(() => { currentModuleId='module_verbs';
  openExercise('module_verbs','variants','prasens');
  const q = session.current ? [session.current, ...session.queue].map(e => e.word_id) : [];
  exitExerciseEarly(); return JSON.stringify(q); })()`));
let vq = varQ();
ok('standalone variation served with no root unlocked', vq.includes('verb_abbiegen'));
ok('…but a root-gated variant is not', !vq.includes('verb_verkaufen'));
ok('…and a standalone\'s own variant waits for it', !vq.includes('verb_weiterentwickeln'));
w.eval("Progress.unlockRootVerb('verb_kaufen'); Progress.unlockVariant('verb_entwickeln')");
vq = varQ();
ok('unlocking kaufen opens verkaufen in Variationen', vq.includes('verb_verkaufen'));
ok('unlocking entwickeln opens weiterentwickeln', vq.includes('verb_weiterentwickeln'));

reset(); clearVerbUnlocks();
w.eval("session.reviewMode = false; _unlockWord('verb_abbiegen')");
ok('a standalone unlocks into the variant bucket',
   w.eval("Progress.getUnlockedVariants().includes('verb_abbiegen') && !Progress.getUnlockedRootVerbs().includes('verb_abbiegen')"));

clearVerbUnlocks();
w.eval(`localStorage.setItem('app_verbs_root_unlocked', JSON.stringify(['verb_sein','verb_anbieten','verb_abbiegen']))`);
const moved = w.eval("Progress.rebucketVerbUnlocks(new Set(_stammverben().map(v=>v.id)))");
ok('rebucket moves demoted roots', moved === 2, moved);
ok('…out of the root bucket', w.eval("JSON.stringify(Progress.getUnlockedRootVerbs())") === '["verb_sein"]');
ok('…into the variant bucket', w.eval("['verb_anbieten','verb_abbiegen'].every(i => Progress.getUnlockedVariants().includes(i))"));
ok('rebucket is idempotent', w.eval("Progress.rebucketVerbUnlocks(new Set(_stammverben().map(v=>v.id)))") === 0);

// The Stammverben card's denominator is Stammverben exercises only.
reset();
// Lesson gates are not under test here; open them so the card renders its count.
w.eval("Grammar.isCategoryUnlocked = () => true;" +
       "_verbTenseTab = 'prasens'; currentModuleId='module_verbs'; navigateTo('screen-module-home')");
const expected = w.eval(`(() => { const ids = new Set(_stammverben().map(v=>v.id));
  return appData.exercises.module_verbs.filter(e => ids.has(e.word_id) && (!e.tense || e.tense==='prasens')).length; })()`);
const cardText = w.eval("document.querySelector('#screen-module-home').textContent");
ok('Stammverben card counts only Stammverben exercises', new RegExp('0 / ' + expected + ' Übungen').test(cardText), expected);

console.log(`${checks - failures.length}/${checks} checks passed`);
failures.forEach(f => console.log('  FAIL ' + f));
process.exit(failures.length ? 1 : 0);
