/**
 * qa-variants.js — headless QA for the Vorsilben ↔ Verbs reconciliation (v16)
 *
 * Setup:  npm install jsdom
 * Run:    node _factory/qa-variants.js
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const APP = require('path').resolve(__dirname, '..');

const dom = new JSDOM(fs.readFileSync(APP + '/index.html', 'utf8'),
  { url: 'https://example.org/', runScripts: 'dangerously', pretendToBeVisual: true });
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices:()=>[] };
w.navigator.serviceWorker = { register: () => Promise.resolve() };
w.scrollTo = () => {};

let failures = [], checks = 0;
const fail = (n,m)=>failures.push(n+': '+m);
const ok = (n,c,m)=>{checks++; if(!c) fail(n, m===undefined?'assertion failed':String(m));};

['js/data.js','js/listening-data.js','js/particles-data.js','js/prefixes-data.js',
 'js/grammar-data.js','js/article-grammar-data.js','js/declension-data.js',
 'js/progress.js','js/wordlist.js','js/exercises.js','js/wordpractice.js',
 'js/listening.js','js/grammar.js','js/app.js'].forEach(f => {
   const el = w.document.createElement('script');
   el.textContent = fs.readFileSync(APP + '/' + f, 'utf8');
   w.document.body.appendChild(el);
 });

w.eval('loadData()');
w.eval('Grammar.init();ParticleGrammar.init();ArticleGrammar.init();DeclensionGrammar.init();PrefixGrammar.init();');

// ── data ───────────────────────────────────────────────────────────────────
// 287 until Session 41; +19 from the restored Session 13 audit (see
// _factory/stammverben/audit-report.md).
ok('306 prefix variants',
   w.eval("appData.verbs.reduce((a,v)=>a+(v.prefix_variants||[]).length,0)") === 306,
   w.eval("appData.verbs.reduce((a,v)=>a+(v.prefix_variants||[]).length,0)"));
ok('3708 verb exercises',
   w.eval("appData.exercises['module_verbs'].length") === 3708,
   w.eval("appData.exercises['module_verbs'].length"));
ok('10 modules, no duplicate from the prefixes bundle merge',
   w.eval('appData.modules.length') === 10, w.eval('appData.modules.length'));
ok('module_prefixes appears exactly once',
   w.eval("appData.modules.filter(m=>m.id==='module_prefixes').length") === 1);

// every new variant resolves and has 8 exercises
const missing = w.eval(`(() => {
  const seeded = ${JSON.stringify([].concat(
    ...[1,2,3].map(i => JSON.parse(fs.readFileSync(APP+`/_factory/vorsilben/variant-seeds-${i}.json`,'utf8')).map(s=>s.w))))};
  const ex = appData.exercises['module_verbs'];
  const bad = [];
  for (const word of seeded) {
    const pv = appData.verbs.flatMap(v=>v.prefix_variants||[]).find(p=>p.word===word);
    if (!pv) { bad.push(word+':missing'); continue; }
    const n = ex.filter(e=>e.word_id===pv.id).length;
    if (n !== 8) bad.push(word+':'+n);
  }
  return bad;
})()`);
ok('all 133 new variants present with 8 exercises each', missing.length === 0, missing.slice(0,8).join(','));

// ── the verstehen case-badge bug ───────────────────────────────────────────
const vb = w.eval("_verbMetaBadge('verb_verstehen')");
ok('verstehen badge renders', vb.length > 0);
ok('verstehen shows Akkusativ', vb.includes('Akkusativ'), vb);
ok('verstehen still shows Irregular', vb.includes('Irregular'));

ok('zuhören (new variant) shows Dativ',
   w.eval("_verbMetaBadge('verb_zuhören')").includes('Dativ'),
   w.eval("_verbMetaBadge('verb_zuhören')"));
ok('inheritance still works where there is no override',
   w.eval("_verbMetaBadge('verb_absagen')").includes('Akkusativ'),
   w.eval("_verbMetaBadge('verb_absagen')"));
ok('genuinely intransitive variant shows no case badge',
   !w.eval("_verbMetaBadge('verb_aufstehen')").includes('verb-case-badge'),
   w.eval("_verbMetaBadge('verb_aufstehen')"));

// ── exercise rendering for new variants ────────────────────────────────────
w.eval("currentModuleId='module_verbs'; renderModuleHome('module_verbs')");
ok('verbs module home still renders',
   w.document.getElementById('module-categories').innerHTML.length > 500);
w.eval('renderVerbliste()');
const vl = w.document.getElementById('screen-verbliste').innerHTML;
ok('verbliste renders', vl.length > 1000);

// render one exercise of each type belonging to a new variant
const types = ['translate_word','fill_blank','conjugation_choice','partizip_ii',
               'auxiliary_choice','conjugation_table'];
for (const t of types) {
  const found = w.eval(`(() => {
    const ex = appData.exercises['module_verbs'].find(
      e => e.type === '${t}' && e.word_id === 'verb_zurückgeben');
    return ex ? JSON.stringify(ex).length : 0;
  })()`);
  ok('new variant has a ' + t + ' exercise', found > 0);
}

// ── regression: Vorsilben module untouched ─────────────────────────────────
ok('prefix module still has 330 exercises',
   w.eval("appData.exercises['module_prefixes'].length") === 330);
w.eval("currentModuleId='module_prefixes'; renderModuleHome('module_prefixes')");
ok('prefix module home still renders',
   w.document.getElementById('module-categories').innerHTML.includes('Trennbar'));

console.log(`\nchecks run: ${checks}`);
if (failures.length) {
  console.log(`\n❌ ${failures.length} failure(s):`);
  failures.forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('✅ all checks passed');
