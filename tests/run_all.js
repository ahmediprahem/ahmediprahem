// مشغّل كل الاختبارات: node tests/run_all.js [--node] [--e2e] [--word] [--only=نمط_اسم_الملف]
// بلا خيارات = Node + المتصفح. يطبع نتيجة كل ملف والمجموع الفعلي، ويرجع رمز خروج ≠ 0 عند أي إخفاق.
const cp = require('child_process'), fs = require('fs'), path = require('path'), arg = (a) => process.argv.includes(a);
const only = ((process.argv.find(a => a.startsWith('--only=')) || '').slice(7)), keep = (f) => !only || new RegExp(only).test(f);
const all = !arg('--node') && !arg('--e2e') && !arg('--word'), files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));
const groups = [['Node', arg('--node') || all, files.filter(f => /^test_/.test(f))], ['المتصفح (Playwright)', arg('--e2e') || all, files.filter(f => /^e2e_?.*\.js$/.test(f) && f !== 'e2e_helper.js')], ['Word (LibreOffice)', arg('--word'), files.filter(f => /^check_docx/.test(f))]];
let total = 0, failed = 0; const rows = [];
for (const [name, on, list] of groups) {
  if (!on) continue; console.log('\n== ' + name);
  for (const f of list.filter(keep).sort()) {
    const r = cp.spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 600000, cwd: path.join(__dirname, '..') }), out = (r.stdout || '') + (r.stderr || ''), m = /نجح\s+(\d+)/.exec(out) || /كل\s+(\d+)\s+ملف/.exec(out), bad = r.status !== 0 || /✘/.test(out);
    const n = m ? +m[1] : 0; total += bad ? 0 : n; if (bad) failed++; rows.push([f, bad ? 'فشل' : 'نجح', n]); console.log((bad ? '✘ ' : '✔ ') + f + ' — ' + (bad ? 'فشل (شغّله وحده لترى السبب)' : n));
  }
}
console.log('\nالمجموع الناجح:', total, '| ملفات فاشلة:', failed); process.exit(failed ? 1 : 0);
