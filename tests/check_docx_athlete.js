// يتطلب LibreOffice (soffice) و pdfinfo: يتأكد أن Word الرياضيين يبقى 8 صفحات (ملخص + 7 أيام) لمصفوفة عملاء، بشعار وبدونه
const { TMP, fileUrl, PY } = require('./_tmp.js');
const fs = require('fs'), vm = require('vm'), cp = require('child_process'), path = require('path'), A = require('../src/athlete.js'), I = require('../src/athimport.js'), X = require('../src/docx.js'), AD = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/athlete.json'), 'utf8')); A.prepare(AD, I);
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/assets.js'), 'utf8'), ctx); const L = ctx.window.ASSETS, out = TMP + '/docx_ath'; fs.mkdirSync(out, { recursive: true });
let bad = 0, n = 0; const rows = [];
[[55, 'أنثى', 24, 'تنشيف', 14], [68, 'أنثى', 30, 'تثبيت / صيانة', ''], [80, 'ذكر', 28, 'بناء عضلي (فائض)', ''], [92, 'ذكر', 33, 'تنشيف', 12], [105, 'ذكر', 26, 'بناء عضلي (فائض)', ''], [120, 'ذكر', 31, 'إعادة تركيب الجسم', 18], [135, 'ذكر', 35, 'بناء نظيف (فائض صغير)', '']].forEach(([w, sex, age, phase, bf], i) => {
  [['none', null], ['wide', L.light], ['icon', L.icon]].forEach(([lk, logo]) => {
    const c = Object.assign(A.newAthlete(AD), { code: 'A' + i, name: 'رياضي ' + i, sex, age, weight: w, height: sex === 'ذكر' ? 180 : 166, phase, bf, carbMethod: i % 2 ? 'remainder' : 'load', keywords: [], love: [], avoid: [], sport: 'كمال أجسام' }), p = A.planWeek(c, AD, { seed: i });
    const f = path.join(out, `a${i}_${lk}.docx`); fs.writeFileSync(f, X.buildAthlete(c, p, AD, { clinic: 'الوزن الذهبي', specialist: 'د. أحمد', logo, hmText: I.hmText, hmDef: I.hmDef })); cp.execSync(`cd ${out} && timeout 120 soffice --headless --convert-to pdf ${path.basename(f)} >/dev/null 2>&1`);
    const pages = +cp.execSync(`pdfinfo ${f.replace('.docx', '.pdf')} | grep Pages | awk '{print $2}'`).toString(); n++; if (pages !== 8) { bad++; rows.push(`${w}كجم/${phase}/${lk}: ${pages}`); }
  });
});
console.log(bad ? '✘ ملفات ليست 8 صفحات: ' + rows.join(' | ') : '✔ كل ' + n + ' ملف Word للرياضيين = 8 صفحات'); process.exitCode = bad ? 1 : 0;
