/**
 * qa-prefixes.js — headless QA for the Vorsilben module (Session 37)
 *
 * Loads index.html into jsdom, injects every app script into the real global
 * scope, and exercises the module end to end. Also carries regressions for
 * Verbs / Partikeln / Deklinationen, since Session 37 changed shared code in
 * grammar.js (advanceGrammarQuiz dispatch).
 *
 * Setup:  npm install jsdom
 * Run:    node _factory/qa-prefixes.js
 * Expect: 49 checks, all passed.
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

// Inject each app script into the real global scope so top-level
// `const`/`function` declarations become globals, as they do in a browser.
const load = f => {
  try {
    const el = w.document.createElement('script');
    el.textContent = fs.readFileSync(APP + '/' + f, 'utf8');
    w.document.body.appendChild(el);
  } catch (e) { fail('load ' + f, e.message); }
};

let failures = [], checks = 0;
const fail = (n, m) => failures.push(n + ': ' + m);
const ok   = (n, c, m) => { checks++; if (!c) fail(n, m || 'assertion failed'); };

['js/data.js','js/listening-data.js','js/particles-data.js','js/prefixes-data.js',
 'js/grammar-data.js','js/article-grammar-data.js','js/declension-data.js',
 'js/progress.js','js/wordlist.js','js/exercises.js','js/wordpractice.js',
 'js/listening.js','js/grammar.js','js/app.js'].forEach(load);

// ── bootstrap ──────────────────────────────────────────────────────────────
w.eval('loadData()');
w.eval('Grammar.init();ParticleGrammar.init();ArticleGrammar.init();DeclensionGrammar.init();PrefixGrammar.init();');

// ── data wiring ────────────────────────────────────────────────────────────
ok('PREFIXES_DATA present', w.eval('typeof PREFIXES_DATA') === 'object');
ok('35 prefixes', w.eval('appData.prefixes.length') === 35, w.eval('appData.prefixes.length'));
ok('330 exercises', w.eval("appData.exercises['module_prefixes'].length") === 330);
ok('module registered', w.eval("!!appData.modules.find(m=>m.id==='module_prefixes')"));
ok('10 modules', w.eval('appData.modules.length') === 10, w.eval('appData.modules.length'));
ok('5 lessons', w.eval('PREFIXES_DATA.lessons.length') === 5);

// ── home + module home ─────────────────────────────────────────────────────
w.eval('renderHome()');
ok('home lists Prefixes', /Prefixes/.test(w.document.getElementById('home-modules-list').innerHTML));

w.eval("currentModuleId='module_prefixes'; renderModuleHome('module_prefixes')");
const mh = w.document.getElementById('module-categories').innerHTML;
ok('module home rendered', mh.length > 500);
['Trennbar','Untrennbar','Beide','Alle','Grammatik'].forEach(t =>
  ok('module home has ' + t, mh.includes(t)));

// ── reference screen ───────────────────────────────────────────────────────
w.eval('renderVorsilbenliste()');
const list = w.document.getElementById('prefix-ref-list').innerHTML;
ok('ref list rendered', list.length > 1000);
ok('ref shows ver-', list.includes('ver-'));
ok('ref has 3 group headers',
   (list.match(/alpha-header/g) || []).length === 3,
   (list.match(/alpha-header/g)||[]).length);

w.eval("setPrefixGroup('untrennbar')");
const insepOnly = w.document.getElementById('prefix-ref-list').innerHTML;
ok('filter untrennbar excludes mit-', !insepOnly.includes('>mit-<'));
ok('filter untrennbar keeps ver-', insepOnly.includes('ver-'));

w.eval("setPrefixGroup('alle'); filterPrefixSearch('verkaufen')");
const searched = w.document.getElementById('prefix-ref-list').innerHTML;
ok('search by example verb finds ver-', searched.includes('ver-'));
ok('search narrows to one row', (searched.match(/showPrefixDetail\(/g)||[]).length === 1,
   (searched.match(/showPrefixDetail\(/g)||[]).length);
w.eval("filterPrefixSearch('')");

// ── detail sheet ───────────────────────────────────────────────────────────
w.eval("showPrefixDetail('ver')");
const det = w.document.getElementById('prefix-detail-content').innerHTML;
ok('detail has feeling', det.includes('four branches'));
ok('detail has mnemonic', det.includes('prefix-mnemonic'));
ok('detail has 10 examples', (det.match(/prefix-example-verb/g)||[]).length === 10,
   (det.match(/prefix-example-verb/g)||[]).length);
ok('detail flags in-app verbs', det.includes('im Verbmodul'));
ok('detail sheet opens', w.document.getElementById('prefix-detail-sheet').classList.contains('open'));
w.eval('closePrefixDetail()');
ok('detail sheet closes', !w.document.getElementById('prefix-detail-sheet').classList.contains('open'));

w.eval("showPrefixDetail('emp')");
ok('emp- shows closed-set notice',
   w.document.getElementById('prefix-detail-content').innerHTML.includes('Geschlossene Gruppe'));
w.eval('closePrefixDetail()');

// ── lessons + quiz ─────────────────────────────────────────────────────────
w.eval("openPrefixLesson('prefixes-dual')");
const les = w.document.getElementById('grammar-lesson-content').innerHTML;
ok('lesson renders', les.includes('Wechselpräfixe') || les.includes('umfáhren'));
ok('lesson has key rules', les.includes('Schlüsselregeln'));
ok('lesson has quiz CTA', les.includes('startPrefixQuiz'));

w.eval("startPrefixQuiz('prefixes-dual')");
ok('quiz state module', w.eval('window._grammarQuizState.module') === 'prefixes');
ok('quiz has 5 questions', w.eval('window._grammarQuizState.questions.length') === 5);
// answer all correctly
for (let i = 0; i < 5; i++) {
  const idx = w.eval(`window._grammarQuizState.questions[${i}].correct`);
  w.eval(`submitGrammarAnswer(${idx}); advanceGrammarQuiz();`);
}
ok('quiz passes and records',
   w.eval("PrefixGrammar.isComplete('prefixes-dual')"));

// quiz recording must not leak into the Verbs Grammar store
ok('prefix quiz did not pollute Grammar store',
   w.eval("JSON.parse(localStorage.getItem('app_grammar_lessons')||'{}')['prefixes-dual']") === undefined);

// regression: particle quiz now records against ParticleGrammar
w.eval("startParticleQuiz('particles-intro')");
for (let i = 0; i < w.eval('window._grammarQuizState.questions.length'); i++) {
  const idx = w.eval(`window._grammarQuizState.questions[${i}].correct`);
  w.eval(`submitGrammarAnswer(${idx}); advanceGrammarQuiz();`);
}
ok('particle quiz records against ParticleGrammar',
   w.eval("ParticleGrammar.isComplete('particles-intro')"));

// ── exercise engine ────────────────────────────────────────────────────────
w.eval("openPrefixExercise('alle')");
ok('exerciseMode set', w.eval('exerciseMode') === 'prefix');
w.eval('startPrefixExercise()');
ok('queue built (330)', w.eval('_prefixSession.totalCount') === 330,
   w.eval('_prefixSession.totalCount'));
ok('card rendered', w.document.getElementById('exercise-card').innerHTML.length > 200);

// answer 40 questions: alternate right / wrong, cover both types
let sawPrefix = false, sawFeeling = false, fbSeen = 0;
for (let i = 0; i < 40; i++) {
  const type = w.eval('_prefixSession.current.type');
  if (type === 'select_prefix')  sawPrefix  = true;
  if (type === 'select_feeling') sawFeeling = true;

  const btns = [...w.document.querySelectorAll('#opts .option-btn')];
  if (btns.length !== 4) { fail('options', `q${i} rendered ${btns.length} options`); break; }
  const correct = w.eval('_prefixSession.current.correct');
  const target  = (i % 2 === 0) ? btns.find(b => b.dataset.answer === correct)
                                : btns.find(b => b.dataset.answer !== correct);
  if (!target) { fail('option match', `q${i} could not find target button`); break; }
  w.eval(`selectPrefixAnswer(document.querySelectorAll('#opts .option-btn')[${btns.indexOf(target)}])`);

  const card = w.document.getElementById('prefix-feedback-card');
  if (card && card.style.display === 'block' && card.innerHTML.length > 50) fbSeen++;
  w.eval('advanceExercise()');
}
ok('both exercise types appear', sawPrefix && sawFeeling, `prefix=${sawPrefix} feeling=${sawFeeling}`);
ok('feedback card shown every answer', fbSeen === 40, fbSeen + '/40');
ok('correct count == 20', w.eval('_prefixSession.correctCount') === 20,
   w.eval('_prefixSession.correctCount'));
ok('wrong answers went to cooldown', w.eval('_prefixSession.cooldown.length') === 20,
   w.eval('_prefixSession.cooldown.length'));

// group filter narrows the session
w.eval("openPrefixExercise('untrennbar'); startPrefixExercise();");
const insepCount = w.eval('_prefixSession.totalCount');
ok('untrennbar session smaller', insepCount > 0 && insepCount < 330, insepCount);
ok('untrennbar session excludes emp-',
   w.eval("_prefixSession.queue.every(e=>e.prefix_id!=='emp')"));

// results screen
w.eval('_prefixSession.queue=[];_prefixSession.cooldown=[];_prefixShowNext()');
ok('results rendered', w.document.getElementById('results-summary').textContent.includes('Vorsilben'));
ok('exerciseMode reset', w.eval('exerciseMode') === 'module');

// ── regression: other modules still work ───────────────────────────────────
w.eval("currentModuleId='module_particles'; renderModuleHome('module_particles')");
ok('particles module still renders',
   w.document.getElementById('module-categories').innerHTML.includes('Particles'));
w.eval("currentModuleId='module_verbs'; renderModuleHome('module_verbs')");
ok('verbs module still renders',
   w.document.getElementById('module-categories').innerHTML.length > 500);
w.eval('renderDeklinationenHome()');
ok('deklinationen still renders',
   w.document.getElementById('deklinationen-content').innerHTML.includes('Schwach'));

// ── report ─────────────────────────────────────────────────────────────────
console.log(`\nchecks run: ${checks}`);
if (failures.length) {
  console.log(`\n❌ ${failures.length} failure(s):`);
  failures.forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('✅ all checks passed');
