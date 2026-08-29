/**
 * qa-srs.js — headless integration QA for the spaced-repetition layer (Session 40)
 *
 * validate-srs.py proves the ALGORITHM is right, in isolation. This file proves
 * the WIRING is right: that answering an exercise through the app's real
 * handlers actually reaches the store, that reviewMode suppresses the progress
 * bars without suppressing scheduling, and that Artikel — which recorded
 * nothing before this session — now participates.
 *
 * Setup:  npm install jsdom   (to ~/qa, not the project — see SOURCE_OF_TRUTH)
 * Run:    NODE_PATH=~/qa/node_modules node _factory/qa-srs.js
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
 'js/progress.js','js/srs.js','js/wordlist.js','js/exercises.js','js/wordpractice.js',
 'js/listening.js','js/grammar.js','js/app.js'].forEach(load);

w.eval('loadData()');

// ── the module is present and wired ────────────────────────────────────────
ok('SRS global exists', w.eval('typeof SRS') === 'object');
ok('srs.js is in index.html',
   /js\/srs\.js/.test(fs.readFileSync(APP + '/index.html', 'utf8')));
ok('srs.js loads before exercises.js',
   fs.readFileSync(APP + '/index.html','utf8').indexOf('js/srs.js') <
   fs.readFileSync(APP + '/index.html','utf8').indexOf('js/exercises.js'));
ok('srs.js is precached by the service worker',
   /js\/srs\.js/.test(fs.readFileSync(APP + '/service-worker.js', 'utf8')));
ok('_recordAnswer exists', w.eval('typeof _recordAnswer') === 'function');
ok('no bare recordResult left in exercises.js',
   !/Progress\.recordResult\(/.test(
     fs.readFileSync(APP + '/js/exercises.js','utf8').split('function _recordAnswer')[0]));

// ── grading reaches the store ──────────────────────────────────────────────
w.eval('SRS.reset(); localStorage.removeItem("app_exercise_history");');
w.eval('_recordAnswer("qa_item_a", true, null)');
ok('a graded item is stored', w.eval('!!SRS.get("qa_item_a")'));
ok('first correct answer gives a 1-day interval', w.eval('SRS.get("qa_item_a").i') === 1);
ok('module play still writes exercise history',
   w.eval('Progress.getExerciseHistory("qa_item_a").correct') === 1);

// ── reviewMode: SRS yes, progress bars no (PRD Q3) ─────────────────────────
w.eval('_recordAnswer("qa_item_b", true, { reviewMode: true })');
ok('review answer is scheduled', w.eval('SRS.get("qa_item_b").i') === 1);
ok('review answer does NOT touch exercise history',
   w.eval('Progress.getExerciseHistory("qa_item_b").correct') === 0,
   w.eval('Progress.getExerciseHistory("qa_item_b").correct'));
w.eval('_recordAnswer("qa_item_a", true, { reviewMode: true })');
ok('reviewing an item advances its schedule', w.eval('SRS.get("qa_item_a").i') === 6);
ok('reviewing an item leaves its history count alone',
   w.eval('Progress.getExerciseHistory("qa_item_a").correct') === 1);

// ── a miss resets and is due today ─────────────────────────────────────────
w.eval('_recordAnswer("qa_item_a", false, null)');
ok('a miss resets the interval', w.eval('SRS.get("qa_item_a").i') === 0);
ok('a miss resets the rep count', w.eval('SRS.get("qa_item_a").r') === 0);
ok('a missed item is due today', w.eval('SRS.get("qa_item_a").d') === w.eval('SRS.today()'));
ok('a missed item appears in the due queue', w.eval('SRS.getDue().includes("qa_item_a")'));
ok('a future item does not', !w.eval('SRS.getDue().includes("qa_item_b")'));
ok('null item id is ignored', w.eval('_recordAnswer(undefined, true, null), true') === true);

// ── due queue ordering: most overdue first (PRD §5.7) ──────────────────────
w.eval(`SRS.reset();
  const all = {};
  all.old  = { e:2.5, i:1, r:1, d:'2020-01-01', l:null, x:0 };
  all.mid  = { e:2.5, i:1, r:1, d:'2024-01-01', l:null, x:0 };
  all.now  = { e:2.5, i:1, r:1, d:SRS.today(),  l:null, x:0 };
  localStorage.setItem('app_srs', JSON.stringify(all));`);
ok('due queue is most-overdue first',
   w.eval('JSON.stringify(SRS.getDue())') === '["old","mid","now"]',
   w.eval('JSON.stringify(SRS.getDue())'));
ok('countDue agrees with getDue', w.eval('SRS.countDue()') === 3);

// ── backfill (PRD §5.6) ────────────────────────────────────────────────────
w.eval(`SRS.reset();
  localStorage.setItem('app_exercise_history', JSON.stringify({
    seen_ok:    { correct: 3, incorrect: 0 },
    seen_bad:   { correct: 1, incorrect: 4 },
    seen_never: { correct: 0, incorrect: 0 }
  }));`);
const seeded = w.eval('SRS.backfill()');
ok('backfill seeds answered items', seeded === 2, seeded);
ok('backfill skips never-answered items', !w.eval('!!SRS.get("seen_never")'));
ok('a clean item is seeded as learned once', w.eval('SRS.get("seen_ok").r') === 1);
ok('a missed item is seeded unlearned', w.eval('SRS.get("seen_bad").r') === 0);
ok('a missed item carries a reduced ease', w.eval('SRS.get("seen_bad").e') < 2.5);
ok('ease is never seeded below the floor', w.eval('SRS.get("seen_bad").e') >= 1.3);
ok('backfill is one-shot', w.eval('SRS.backfill()') === 0);
ok('backfill spreads due dates over 14 days, not all today',
   w.eval('SRS.getDue().length') < 2 || w.eval('SRS.get("seen_ok").d') !== w.eval('SRS.get("seen_bad").d'),
   w.eval('SRS.get("seen_ok").d + " / " + SRS.get("seen_bad").d'));
ok('spread is deterministic',
   w.eval('SRS._spread("abc")') === w.eval('SRS._spread("abc")'));
ok('spread stays in range',
   w.eval('[...Array(200)].every((_,i)=>{const v=SRS._spread("id"+i);return v>=0&&v<14;})'));
w.eval(`SRS.reset();
  localStorage.setItem('app_srs', JSON.stringify({ real: { e:1.9, i:42, r:5, d:'2030-01-01', l:null, x:1 } }));
  localStorage.setItem('app_exercise_history', JSON.stringify({ real: { correct: 9, incorrect: 0 } }));`);
w.eval('SRS.backfill(true)');
ok('backfill never clobbers existing scheduling state', w.eval('SRS.get("real").i') === 42);

// ── Artikel now participates (PRD §5.3) ────────────────────────────────────
// startArtikelExercise() advances to the first item itself, so with N nouns
// unlocked the queue holds N-1 and `current` holds the first.
w.eval(`SRS.reset();
  appData.nouns.filter(n=>n.section==='roots').slice(0,5)
    .forEach(n=>Progress.unlockRootNoun(n.id));
  exerciseMode='artikel'; startArtikelExercise();`);
ok('Artikel builds a queue', w.eval('_artikelSession.queue.length + (_artikelSession.current?1:0)') === 5,
   w.eval('_artikelSession.queue.length'));
ok('Artikel items have namespaced ids',
   /^ex_artikel_/.test(w.eval('_artikelSession.current.id') || ''),
   w.eval('_artikelSession.current.id'));
ok('an Artikel id maps back to its noun',
   w.eval('_artikelSession.current.id') === 'ex_artikel_' + w.eval('_artikelSession.current.word_id'));
const artId = w.eval('_artikelSession.current && _artikelSession.current.id');
w.eval(`selectArticleAnswer(_artikelSession.current.correct_article)`);
ok('answering in Artikel schedules the item', w.eval(`!!SRS.get(${JSON.stringify(artId)})`), artId);
ok('answering in Artikel records history too',
   w.eval(`Progress.getExerciseHistory(${JSON.stringify(artId)}).correct`) === 1);

// ── prune ──────────────────────────────────────────────────────────────────
w.eval(`SRS.reset();
  localStorage.setItem('app_srs', JSON.stringify({ keep:{e:2.5,i:1,r:1,d:'2020-01-01',l:null,x:0},
                                                   gone:{e:2.5,i:1,r:1,d:'2020-01-01',l:null,x:0} }));`);
ok('prune drops unknown ids', w.eval('SRS.prune(["keep"])') === 1);
ok('prune keeps known ids', w.eval('!!SRS.get("keep")'));

// ── date handling ──────────────────────────────────────────────────────────
ok('addDays crosses a month boundary', w.eval("SRS.addDays('2026-01-31', 1)") === '2026-02-01');
ok('addDays crosses a year boundary',  w.eval("SRS.addDays('2026-12-31', 1)") === '2027-01-01');
ok('addDays handles a leap day',       w.eval("SRS.addDays('2028-02-28', 1)") === '2028-02-29');
ok('addDays survives the spring DST change (Europe/Berlin, 2026-03-29)',
   w.eval("SRS.addDays('2026-03-28', 1)") === '2026-03-29',
   w.eval("SRS.addDays('2026-03-28', 1)"));
ok('addDays survives the autumn DST change (Europe/Berlin, 2026-10-25)',
   w.eval("SRS.addDays('2026-10-24', 2)") === '2026-10-26',
   w.eval("SRS.addDays('2026-10-24', 2)"));
ok('today() is a local date, not UTC',
   w.eval('SRS.today()') === w.eval('SRS.toDayString(new Date())'));

// ── corrupted store must not throw ─────────────────────────────────────────
w.eval("localStorage.setItem('app_srs', '{not json')");
ok('a corrupt store reads as empty rather than throwing', w.eval('SRS.countDue()') === 0);
w.eval("localStorage.setItem('app_srs', '{not json'); _recordAnswer('after_corrupt', true, null)");
ok('grading recovers after a corrupt store', w.eval('!!SRS.get("after_corrupt")'));

// ── report ─────────────────────────────────────────────────────────────────
console.log('\nchecks run: ' + checks);
if (failures.length) {
  console.log('❌ ' + failures.length + ' failed:');
  failures.forEach(f => console.log('   - ' + f));
  process.exit(1);
}
console.log('✅ all checks passed');
