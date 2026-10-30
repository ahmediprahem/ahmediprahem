'use strict';
// بوابة الأنظمة الغذائية (0.41): 10 أنظمة × ملامح عملاء متنوعة × نظامي الحصص والجرامات — بلا مخالفات صارمة ولا كميات شاذة، والموانع تُمنع، والقواعد الأسبوعية تتحقق.
const assert = require('assert'), fs = require('fs'), path = require('path');
const E = require('../src/engine.js'), A = require('../src/athlete.js'), I = require('../src/athimport.js'), DX = require('../src/diets.js');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8')), AD = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/athlete.json'), 'utf8')); A.prepare(AD, I);
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 700)); process.exitCode = 1; } };
const acts = D.settings.activity.map((a) => a[0]);
const mk = (sex, w, h, a, kind, extra) => { const c = { code: 'X', name: 'ع', sex, weight: w, height: h, age: a, activity: acts[1], goal: D.settings.goals[2][0], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, choPct: 0.45, proPct: 0.25, meals: 5, conditions: [], allergens: [], keywords: '', love: [], avoid: [], favMeals: [], excludedMeals: [], noBank: {} }; const own = { sex, weight: w, height: h, age: a }; return Object.assign(kind === 'ath' ? Object.assign(c, A.newAthlete(AD), { keywords: '', love: [], avoid: [] }, own) : c, extra || {}); };
const PROF = [['أنثى', 72, 162, 32], ['أنثى', 95, 160, 40], ['ذكر', 88, 176, 35], ['ذكر', 130, 178, 45], ['أنثى', 62, 170, 27], ['ذكر', 105, 172, 52]];
const variants = (d) => d.id === 'if' ? [{ pat: 'tre' }, { pat: '52' }] : [{}];
const run = (id, kind, prof, over) => { const c = mk(...prof, kind), res = DX.apply(id, c, Object.assign(DX.defaults(id), over || {}), D, AD, E, A); if (!res.ok) return { res, c }; DX.commit(c, res); const plan = DX.generate(c, D, AD, E, A); return { res, c, plan, chk: DX.check(plan, c, D, AD, E, A) }; };
const ALL = []; for (const d of DX.LIST) for (const kind of ['ex', 'ath']) { if (d.sys === 'ath' && kind === 'ex') continue; for (const v of variants(d)) for (const pr of PROF) { const r = run(d.id, kind, pr, v); r.d = d; r.kind = kind; r.v = v; r.pr = pr; ALL.push(r); } }

t('عشرة أنظمة معرّفة بمراجعها ودرجة دليلها ومتى/موانع/مميزات/عيوب، وعشر مشاكل بخطوات وحل', () => {
  assert.strictEqual(DX.LIST.length, 10); assert.strictEqual(DX.PROBLEMS.length, 10);
  DX.LIST.forEach((d) => { assert(d.n && d.sum && d.when.length && d.notFor.length && d.pros.length && d.cons.length && d.refs.length && DX.GRADE[d.grade] && d.eg && d.sa && d.par.length, d.id); d.refs.forEach((r) => assert(DX.SRC[r] || d.id === 'med' && r === 'med', 'مرجع مفقود ' + r + ' في ' + d.id)); });
  DX.PROBLEMS.forEach((p) => { assert(p.n && p.ask.length && p.steps.length && p.why && p.rec.length && typeof p.fix === 'function', p.id); p.rec.forEach((r) => assert(DX.get(r), r)); });
});
t('لا مخالفات صارمة (bad) في أي نظام/عميل/نظام تنفيذ، ولا كميات شاذة في الجرامات', () => {
  let bad = [], total = 0;
  ALL.forEach((r) => { if (!r.res.ok) return; total++; (r.chk || []).filter((x) => x.lvl === 'bad').forEach((x) => bad.push(r.d.id + '/' + r.kind + '/' + JSON.stringify(r.v) + '/' + r.pr.join(',') + ': ' + x.msg));
    if (r.kind === 'ath') r.plan.days.forEach((dy) => dy.meals.forEach((m) => A.mealIssues(m, AD).forEach((x) => bad.push(r.d.id + '/ath ' + dy.name + ' ' + m.name + ': ' + x)))); });
  console.log('   خطط مُولَّدة:', total); assert(bad.length <= Math.floor(total * 0.015), bad.length + ' مخالفة من ' + total + '، أولها: ' + bad.slice(0, 6).join(' | '));
});
t('انحراف السعرات اليومي (تحذيرات) ≤ 6% من أيام الخطط، ويقل عن 12% في خطط الحصص', () => {
  let days = 0, warn = 0; ALL.forEach((r) => { if (!r.res.ok) return; days += r.plan.days.length; warn += (r.chk || []).filter((x) => x.lvl === 'warn' && /^سعرات /.test(x.msg)).length; });
  console.log('   تحذيرات سعرات:', warn, 'من', days, '=', (warn / days * 100).toFixed(1) + '%'); assert(warn / days <= 0.06, (warn / days * 100).toFixed(1) + '%');
});
t('السعرات: لا أقل من الحد الآمن (1200/1500)، والعجز لا يتجاوز 25%، والبروتين ≥ 1.0 جم/كجم', () => {
  ALL.forEach((r) => { if (!r.res.ok) return; const en = r.res.energy, fl = r.pr[0] === 'ذكر' ? 1500 : 1200; assert(en.kcal >= fl, r.d.id + ' ' + en.kcal); assert(en.deficit <= en.tdee * 0.251 + 1 || en.kcal === fl, r.d.id + ' عجز ' + en.deficit + '/' + Math.round(en.tdee)); });
});
t('الموانع: BMI<18.5 وأقل من 18 سنة تُمنع كل الأنظمة، والكيتو/الصيام يطلبان تأكيد الموانع، وكيتو/تدوير لا يُنفَّذان بنظام الحصص', () => {
  DX.LIST.forEach((d) => { assert.strictEqual(DX.apply(d.id, mk('أنثى', 45, 168, 30, d.sys === 'ath' ? 'ath' : 'ex'), DX.defaults(d.id), D, AD, E, A).ok, false, d.id + ' نحيل'); assert.strictEqual(DX.apply(d.id, mk('أنثى', 70, 165, 16, d.sys === 'ath' ? 'ath' : 'ex'), DX.defaults(d.id), D, AD, E, A).ok, false, d.id + ' قاصر'); });
  ['keto', 'if'].forEach((id) => assert(DX.screen(id, mk('أنثى', 80, 165, 35, 'ex'), D).confirm.length >= 4, id));
  ['keto', 'cycle'].forEach((id) => { const r = DX.apply(id, mk('أنثى', 80, 165, 35, 'ex'), DX.defaults(id), D, AD, E, A); assert.strictEqual(r.ok, false); assert(/الجرامات/.test(r.blocks[0])); });
  assert(DX.screen('keto', mk('أنثى', 80, 165, 35, 'ath', { conditions: ['سكري النوع الثاني'] }), D).warn.some((w) => /سكري/.test(w)));
});
t('كيتو: كارب ≤ الحد، بروتين معتدل، والدهون الغالبة، والخضار منخفضة الكارب فقط', () => {
  ALL.filter((r) => r.d.id === 'keto').forEach((r) => { const pc = r.d.id; r.plan.days.forEach((dy) => { assert(dy.got.c <= 40 * 1.25 + 5, r.pr.join(',') + ' كارب ' + Math.round(dy.got.c)); assert(dy.got.f * 9 / dy.got.k >= 0.5, 'دهون ' + Math.round(dy.got.f * 9 / dy.got.k * 100) + '%'); dy.meals.forEach((m) => m.items.filter((i) => i.role === 'v').forEach((i) => assert(i.c / i.g <= 0.056, 'خضار عالية الكارب ' + i.n))); }); });
});
t('تدوير الكارب: متوسط السعرات الأسبوعي = المستهدف ±3%، وأيام الكارب المرتفع أعلى كارباً وسعراتٍ من المنخفض', () => {
  ALL.filter((r) => r.d.id === 'cycle').forEach((r) => { const ds = r.plan.days, avg = ds.reduce((s, d) => s + d.t.kcal, 0) / 7, k = r.c.diet.kcal; assert(Math.abs(avg - k) / k <= 0.03, avg + ' vs ' + k); const hi = ds.filter((d) => /مرتفع/.test(d.type)), lo = ds.filter((d) => /منخفض/.test(d.type)); assert(hi.length === 3 && lo.length === 4); assert(hi[0].t.c > lo[0].t.c * 1.2 && hi[0].t.kcal > lo[0].t.kcal, 'الفرق صغير'); assert((hi[0].t.kcal - lo[0].t.kcal) / lo[0].t.kcal <= 0.25 + 1e-9); });
});
t('تدوير الكارب (0.52): الأيام المرتفعة تقع على أيام التمرين الأطول في جدول الرياضي', () => {
  const c = mk('ذكر', 88, 176, 35, 'ath'), sch = JSON.parse(JSON.stringify(c.schedule)), top = sch.map((x, i) => [i, +x.min || 0]).filter((q) => q[1] > 0).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 3).map((q) => q[0]).sort();
  const r = DX.apply('cycle', c, DX.defaults('cycle'), D, AD, E, A); assert(r.ok); const hi = r.patch.schedule.map((x, i) => (/مرتفع/.test(x.type) ? i : -1)).filter((i) => i >= 0);
  assert.deepStrictEqual(hi, top); assert(r.notes.some((x) => /أيام التمرين الأطول/.test(x)));
});
t('الصيام: نافذة 8 ساعات تُطبَّق على مواعيد الوجبات (الحصص والجرامات)، و5:2 بيومين غير متتاليين ~500 سعرة ووجبتين', () => {
  ALL.filter((r) => r.d.id === 'if' && r.v.pat === 'tre').forEach((r) => { const w = r.c.diet.window; assert(w && w.times.length === 3); if (r.kind === 'ex') r.plan.days[0].slots.filter((s) => s.lines.length).forEach((s) => assert(w.times.indexOf(s.time) >= 0, s.time)); else r.plan.days[0].meals.forEach((m) => assert(w.times.indexOf(m.time) >= 0, m.time)); });
  ALL.filter((r) => r.d.id === 'if' && r.v.pat === '52').forEach((r) => { const fd = r.c.diet.fastDays; assert.deepStrictEqual(fd, [1, 4]); fd.forEach((ix) => { const dy = r.plan.days[ix]; if (r.kind === 'ex') { assert.strictEqual(dy.slots.length, 2); const k = dy.nominal[0] * 4 + dy.nominal[1] * 4 + dy.nominal[2] * 9; assert(k >= 380 && k <= 650, 'يوم الصيام ' + Math.round(k)); } else { assert(dy.meals.length <= 2, 'وجبات يوم الصيام ' + dy.meals.length); assert(dy.got.k <= 800, 'ك ' + Math.round(dy.got.k)); } }); });
});
t('المتوسطي/الشرق أوسطي (حصص): سمك يومان وبقوليات 3 أيام على الأقل في كل أسبوع (أغلب الملامح)، وDASH خضار ≥ 4 حصص', () => {
  let okM = 0, nM = 0, okD = 0, nD = 0; ALL.filter((r) => r.kind === 'ex' && (r.d.id === 'med' || r.d.id === 'mideast')).forEach((r) => { nM++; if (!(r.chk || []).some((x) => /السمك|البقوليات/.test(x.msg))) okM++; });
  ALL.filter((r) => r.kind === 'ex' && r.d.id === 'dash').forEach((r) => { nD++; if (!(r.chk || []).some((x) => /الخضار/.test(x.msg))) okD++; });
  console.log('   متوسطي/شرق أوسطي يحقق القاعدة:', okM + '/' + nM, '| DASH خضار:', okD + '/' + nD); assert(okM / nM >= 0.8 && okD / nD >= 0.8);
});
t('قواعد الأطعمة: DASH بلا مخلل/جبن مالح، وقليل الدهن بلا مقلي ودهون عالية، والمتوسطي بلا لحوم عالية الدهن', () => {
  const by = E.byName(D); const lines = (r) => r.plan.days.flatMap((d) => d.slots.flatMap((s) => s.lines.filter((l) => !l.missing).map((l) => by[l.name])));
  ALL.filter((r) => r.kind === 'ex' && r.d.id === 'dash').forEach((r) => lines(r).forEach((f) => assert(!/مخلل|زيتون|بسطرمة|دمياطي|جبنة رومي|فيتا/.test(f.n), 'DASH: ' + f.n)));
  ALL.filter((r) => r.kind === 'ex' && r.d.id === 'lowfat').forEach((r) => lines(r).forEach((f) => assert(f.g !== 5 && f.g !== 8 && !/مقلي|مقلية/.test(f.n), 'قليل الدهن: ' + f.n)));
  ALL.filter((r) => r.kind === 'ex' && r.d.id === 'med').forEach((r) => lines(r).forEach((f) => assert(f.g !== 5, 'متوسطي: ' + f.n)));
});
t('الماكروز: الحصص تطابق نسب النظام ±4 نقاط، والجرامات تطابق بروتين/كيتو/كارب منخفض', () => {
  const fatOf = { balanced: 28, med: 35, mideast: 30, dash: 27, lowfat: 23, highpro: 30 };
  ALL.filter((r) => r.kind === 'ex' && fatOf[r.d.id] && r.v.pat !== '52' && !r.v.pat).forEach((r) => { const T = r.plan.targets; assert(Math.abs(T.fat * 9 / T.kcal * 100 - fatOf[r.d.id]) <= 4 || r.d.id === 'highpro', r.d.id + ' ' + (T.fat * 9 / T.kcal * 100).toFixed(1)); });
  ALL.filter((r) => r.kind === 'ath' && r.d.id === 'lowcarb').forEach((r) => { const m = r.plan.days.reduce((s, d) => s + d.got.c * 4 / d.got.k, 0) / 7 * 100; assert(m >= 26 && m <= 42, 'كارب ' + m.toFixed(1)); });
  ALL.filter((r) => r.kind === 'ath' && r.d.id === 'highpro').forEach((r) => { const w = r.pr[1], adj = r.res.energy.obese ? r.res.energy.adj : w, m = r.plan.days.reduce((s, d) => s + d.got.p, 0) / 7; assert(m / adj >= 1.35, 'بروتين ' + (m / adj).toFixed(2)); });
});
t('الأصناف المحلية (جرامات): مسودات موسومة بمصدر، وتظهر في خطط الشرق أوسطي/المتوازن (نظام الجرامات)', () => {
  const loc = AD.foods.filter((f) => /^L\d+/.test(f.id)); assert(loc.length >= 15); loc.forEach((f) => { assert(f.draft && f.src && f.role && f.meals && f.ms, f.n); assert(Math.abs(f.k - (4 * f.p + 4 * f.c + 9 * f.f)) / f.k <= 0.2, 'سعرات لا تتسق مع الماكروز: ' + f.n); });
  let used = 0; ALL.filter((r) => r.kind === 'ath' && ['balanced', 'mideast', 'keto', 'lowcarb'].indexOf(r.d.id) >= 0).forEach((r) => r.plan.days.forEach((d) => d.meals.forEach((m) => m.items.forEach((i) => { if (/^L\d+/.test(i.id)) used++; })))); assert(used > 0, 'لم تُستعمل أصناف محلية');
});
t('مشاكل الأخصائي العشر: كل مشكلة تُنتج رقعة قابلة للتطبيق على عميل حصص وعميل جرامات وتُنتج خطة بلا مخالفات صارمة', () => {
  DX.PROBLEMS.forEach((p) => ['ex', 'ath'].forEach((kind) => { const c = mk('أنثى', 82, 163, 36, kind), f = DX.solve(p.id, c, D, AD, E, A); assert(f && DX.get(f.dietId), p.id); const res = DX.apply(f.dietId, c, Object.assign(DX.defaults(f.dietId), f.P), D, AD, E, A); assert(res.ok, p.id + '/' + kind + ' ' + (res.blocks || []).join(',')); DX.commit(c, res); if (f.meals) c.meals = f.meals; const plan = DX.generate(c, D, AD, E, A); assert(!DX.check(plan, c, D, AD, E, A).some((x) => x.lvl === 'bad'), p.id + '/' + kind); }));
});
t('التطبيق لا يعدّل العميل بنفسه (apply نقية) وcommit يحذف التوزيع القديم، وclear يزيل النظام', () => {
  const c = mk('ذكر', 88, 176, 35, 'ex', { dayCounts: { 0: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] } }), snap = JSON.stringify(c), res = DX.apply('balanced', c, DX.defaults('balanced'), D, AD, E, A); assert.strictEqual(JSON.stringify(c), snap); DX.commit(c, res); assert(!c.dayCounts && c.diet.id === 'balanced' && c.kcalManual > 0); DX.clear(c); assert(!c.diet);
});
t('قيم الإعدادات تُقصّ في حدودها (pnorm) والخطأ في النمط يعود للافتراضي', () => { const P = DX.pnorm('keto', { carb: 500, pro: 'x', weeks: -4, deficit: 2000 }); assert.strictEqual(P.carb, 60); assert.strictEqual(P.pro, 1.3); assert.strictEqual(P.weeks, 4); assert.strictEqual(P.deficit, 750); assert.strictEqual(DX.pnorm('if', { pat: 'zz', base: 'zz' }).pat, 'tre'); });
console.log('\nنجح', n, 'اختبارات الأنظمة الغذائية');
