// يتطلب LibreOffice (soffice) و pdfinfo: يتأكد أن ملف Word يبقى 9 صفحات لمصفوفة عملاء متنوعة، بشعار وبدونه
const { TMP, fileUrl, PY } = require('./_tmp.js');
const fs = require('fs'), vm = require('vm'), cp = require('child_process'), path = require('path'), E = require('../src/engine.js'), X = require('../src/docx.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/assets.js'), 'utf8'), ctx); const A = ctx.window.ASSETS, out = TMP + '/docx_matrix'; fs.mkdirSync(out, { recursive: true });
let bad = 0, n = 0; const rows = [];
[[48, 'أنثى', 22, 4], [55, 'أنثى', 30, 5], [68, 'أنثى', 34, 6], [82, 'ذكر', 41, 5], [95, 'ذكر', 28, 5], [110, 'ذكر', 30, 5], [135, 'ذكر', 36, 6], [75, 'أنثى', 50, 3]].forEach(([w, sex, age, meals], i) => {
  [['none', null], ['wide', A.light], ['icon', A.icon]].forEach(([lk, logo]) => {
    const c = { code: 'C' + i, name: 'ع' + i, sex, age, weight: w, height: sex === 'ذكر' ? 178 : 163, activity: D.settings.activity[(i + 1) % 5][0], goal: D.settings.goals[i % 5][0], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, meals, conditions: i % 3 === 0 ? ['خمول الغدة'] : [], allergens: [], keywords: [], love: [], avoid: [], favMeals: [] };
    const p = E.planWeek(c, D, { seed: i }), f = path.join(out, `m${i}_${lk}.docx`); fs.writeFileSync(f, X.build(c, p, D, E, { clinic: 'الوزن الذهبي', specialist: 'د. أحمد', logo }));
    cp.execSync(`cd ${out} && timeout 120 soffice --headless --convert-to pdf ${path.basename(f)} >/dev/null 2>&1`); const pages = +cp.execSync(`pdfinfo ${f.replace('.docx', '.pdf')} | grep Pages | awk '{print $2}'`).toString(); n++; if (pages !== 9) { bad++; rows.push(`${w}كجم/${sex}/${meals}وجبات/${lk}: ${pages}`); }
  });
});
console.log(bad ? '✘ ملفات ليست 9 صفحات: ' + rows.join(' | ') : '✔ كل ' + n + ' ملف Word = 9 صفحات'); process.exitCode = bad ? 1 : 0;
