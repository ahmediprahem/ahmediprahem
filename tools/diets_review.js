'use strict';
// يولّد ملف مراجعة (HTML عربي) بخطة أسبوع لكل نظام غذائي من الأنظمة العشرة باستخدام نواة «حصة» نفسها: node tools/diets_review.js [out.html]
const fs = require('fs'), path = require('path'), R = path.join(__dirname, '..');
const E = require(R + '/src/engine.js'), A = require(R + '/src/athlete.js'), I = require(R + '/src/athimport.js'), DX = require(R + '/src/diets.js');
const D = JSON.parse(fs.readFileSync(R + '/src/data.json', 'utf8')), AD = JSON.parse(fs.readFileSync(R + '/src/athlete.json', 'utf8')); A.prepare(AD, I);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const acts = D.settings.activity.map((a) => a[0]);
const mk = (kind, o) => { const c = Object.assign({ code: 'R', name: o.name, sex: o.sex, weight: o.w, height: o.h, age: o.a, activity: acts[1], goal: D.settings.goals[2][0], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, choPct: 0.45, proPct: 0.25, meals: 5, cuisine: o.cz || '', conditions: [], allergens: [], keywords: '', love: [], avoid: [], favMeals: [], excludedMeals: [], noBank: {} }, o.extra || {}); return kind === 'ath' ? Object.assign(c, A.newAthlete(AD), { keywords: '', love: [], avoid: [] }, { sex: o.sex, weight: o.w, height: o.h, age: o.a }) : c; };
const WOMAN = { name: 'عميلة تجريبية (امرأة)', sex: 'أنثى', w: 88, h: 162, a: 34, cz: 'eg' }, MAN = { name: 'عميل تجريبي (رجل)', sex: 'ذكر', w: 98, h: 178, a: 38, cz: 'sa' };
const JOBS = [['balanced', 'ex', WOMAN, {}], ['highpro', 'ath', MAN, {}], ['med', 'ex', WOMAN, {}], ['mideast', 'ex', WOMAN, {}], ['mideast', 'ex', MAN, {}, 'سعودي'], ['if', 'ex', WOMAN, { pat: 'tre' }], ['if', 'ath', MAN, { pat: '52' }], ['cycle', 'ath', MAN, {}], ['keto', 'ath', MAN, {}], ['lowcarb', 'ath', WOMAN, {}], ['dash', 'ex', MAN, {}], ['lowfat', 'ex', WOMAN, {}]];
const tbl = (head, rows) => '<table><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>';
let body = '', toc = '';
JOBS.forEach(([id, kind, prof, over, tag], ix) => {
  const d = DX.get(id), c = mk(kind, prof), P = Object.assign(DX.defaults(id), over), res = DX.apply(id, c, P, D, AD, E, A);
  const sid = 'd' + ix, title = d.n + (id === 'if' ? (P.pat === 'tre' ? ' — نافذة 8 ساعات (16:8)' : ' — 5:2') : '') + (tag ? ' — ' + tag : '') + ' • ' + (kind === 'ath' ? 'نظام الجرامات' : 'نظام الحصص');
  toc += '<li><a href="#' + sid + '">' + esc(title) + '</a></li>';
  let h = '<section id="' + sid + '"><h2>' + (ix + 1) + '. ' + esc(title) + '</h2>';
  if (!res.ok) { body += h + '<p class="bad">لم يُطبَّق: ' + esc(res.blocks.join(' | ')) + '</p></section>'; return; }
  DX.commit(c, res); const plan = DX.generate(c, D, AD, E, A), chk = DX.check(plan, c, D, AD, E, A), en = res.energy;
  h += '<p class="meta">الملف: ' + esc(prof.name) + ' — ' + prof.sex + '، ' + prof.a + ' سنة، ' + prof.w + ' كجم، ' + prof.h + ' سم' + (prof.cz ? '، مطبخ ' + (prof.cz === 'eg' ? 'مصري' : 'سعودي') : '') + ' • دليل ' + DX.GRADE[d.grade] + '</p>';
  h += '<p>' + esc(d.sum) + '</p>';
  h += '<div class="box"><b>الحساب:</b> احتياج الطاقة ' + Math.round(en.tdee) + ' سعرة، المستهدف ' + c.diet.kcal + '، العجز ' + en.deficit + (res.patch.choPct != null ? ' • كارب ' + Math.round(res.patch.choPct * 100) + '% بروتين ' + Math.round(res.patch.proPct * 100) + '% دهون ' + Math.round(res.patch.fatPct * 100) + '%' : ' • بروتين ' + P.pro + ' جم/كجم' + (en.obese ? ' (على الوزن المعدّل لأن BMI ≥ 30)' : '') + ' ≈ ' + res.patch.pVal + ' جم/كجم من الوزن الفعلي') + '<ul>' + res.notes.concat(res.warns).map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul></div>';
  const issues = chk.filter((x) => x.lvl !== 'info');
  h += '<div class="box ' + (issues.some((x) => x.lvl === 'bad') ? 'bad' : issues.length ? 'warn' : 'ok') + '"><b>مدقّق النظام:</b> ' + (issues.length ? '<ul>' + issues.map((x) => '<li>' + (x.lvl === 'bad' ? '⛔ ' : '⚠ ') + esc(x.msg) + '</li>').join('') + '</ul>' : 'لا مخالفات ✔') + (plan.quality ? ' • جودة الوجبات ' + plan.quality.score + '/100' : '') + '</div>';
  if (kind === 'ex') {
    const names = Array.from(new Set(plan.days.flatMap((dy) => dy.slots.map((s) => s.name)))), slotsOf = (dy, nm) => dy.slots.filter((s) => s.name === nm)[0];
    h += tbl(['اليوم'].concat(names).concat(['كارب/بروتين/دهون (حصص)']), plan.days.map((dy) => [esc(dy.name) + (dy.fast ? ' <b>(صيام)</b>' : '')].concat(names.map((nm) => { const s = slotsOf(dy, nm); return s ? (s.time ? '<small>' + esc(s.time) + '</small><br>' : '') + s.lines.filter((l) => !l.missing).map((l) => esc(l.text)).join('<br>') : '—'; })).concat([dy.nominal.map(Math.round).join(' / ') + '<br><small>' + Math.round(dy.nominal[0] * 4 + dy.nominal[1] * 4 + dy.nominal[2] * 9) + ' سعرة</small>'])));
  } else {
    const names = Array.from(new Set(plan.days.flatMap((dy) => dy.meals.map((m) => m.name))));
    h += tbl(['اليوم'].concat(names).concat(['الإجمالي']), plan.days.map((dy) => [esc(dy.name) + '<br><small>' + esc(dy.type) + ' • هدف ' + Math.round(dy.t.kcal) + '</small>'].concat(names.map((nm) => { const m = dy.meals.filter((x) => x.name === nm)[0]; return m ? '<small>' + esc(m.time || '') + '</small><br>' + m.items.map((it) => esc(it.n) + ' <b>' + it.g + ' جم</b>' + (I.hmText(it.hm, it.g) ? ' <small>' + esc(I.hmText(it.hm, it.g)) + '</small>' : '')).join('<br>') : '—'; })).concat([Math.round(dy.got.k) + ' سعرة<br><small>ب ' + Math.round(dy.got.p) + ' • ك ' + Math.round(dy.got.c) + ' • د ' + Math.round(dy.got.f) + '</small>'])));
  }
  body += h + '</section>';
});
const css = 'body{font-family:Tahoma,Arial,sans-serif;direction:rtl;margin:0;padding:18px;background:#f5f6fa;color:#1f2430;line-height:1.6}h1{margin:0 0 6px}section{background:#fff;border:1px solid #d9dbe3;border-radius:12px;padding:14px 16px;margin:18px 0;overflow-x:auto}h2{margin:0 0 6px;color:#253464}.meta{color:#556;font-size:13px}.box{border-right:4px solid #3A7F53;background:#eef7f0;padding:6px 12px;margin:8px 0;border-radius:6px;font-size:13px}.box.warn{border-color:#CA562F;background:#fff3e0}.box.bad,.bad{border-color:#b3261e;background:#fdecea}ul{margin:4px 0;padding-right:20px}table{border-collapse:collapse;width:100%;font-size:12.5px;min-width:900px}th,td{border:1px solid #d9dbe3;padding:6px 8px;vertical-align:top;text-align:right}th{background:#253464;color:#fff}small{color:#667}.note{background:#fff9e8;border:1px solid #e6c46e;padding:8px 12px;border-radius:8px}';
const out = process.argv[2] || path.join(R, 'review/diets_review.html');
fs.writeFileSync(out, '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مراجعة الأنظمة الغذائية — حصة 0.41</title><style>' + css + '</style></head><body><h1>مراجعة الأنظمة الغذائية (مولَّدة بنظام «حصة»)</h1><p class="note">خطط أسبوع كاملة لكل نظام من الأنظمة العشرة على عميلين تجريبيين (امرأة وخطّة مصرية، رجل وخطة سعودية) بالقيم الافتراضية. كلها <b>مسودة للمراجعة</b>: الأرقام العلاجية والأصناف المحلية (قيم تقديرية) لا تُعتمد قبل موافقتك. لا بيانات عملاء حقيقيين هنا.</p><ol>' + toc + '</ol>' + body + '</body></html>');
console.log('كُتب', out, Math.round(fs.statSync(out).size / 1024) + ' KB');
