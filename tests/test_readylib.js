'use strict';
// مكتبة الأنظمة الجاهزة (0.42): الفهرس مكتمل ومنظّم، والترشيح يعطي الأمثل + بديلين مناسبين للهدف والحالة، والموانع تُحترم، والتحويل لـ«زنها» سليم.
const assert = require('assert'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const RL = require('../src/readylib.js'), IDX = require('../src/readylib/index.json'); RL.use(IDX);
const B = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, '../src/readylib/plans.json.gz'))));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 700)); process.exitCode = 1; } };
const W = (sex, age, weight, height, act) => ({ sex, age, weight, height, act });
const rec = (a, P) => RL.recommend(Object.assign({ region: 'eg', cond: [], routine: 'classic' }, a), P);
const base = (r) => r.top.map((x) => RL.fam(x.fk).b);

t('الفهرس: 34 عائلة (مصري/سعودي) و1170 خطة، بلا مكتبة المنتجات، وكل خطة لها محتوى 7 أيام', () => {
  assert.strictEqual(Object.keys(IDX.fams).length, 34); assert.strictEqual(IDX.plans.length, 1170);
  assert(!IDX.plans.some((e) => /Products|Golden|Magic|Slim-Black|Ananas|Block/i.test(e.i)), 'تسرّبت خطة منتجات');
  IDX.plans.forEach((e) => { const d = B.plans[e.i]; assert(d, 'لا محتوى: ' + e.i); assert.strictEqual(d.days.length, 7, e.i); assert(d.days.every((y) => y.m.length >= 2 && y.m.every((m) => m[1].length)), 'وجبة فارغة: ' + e.i); assert(e.k > 900 && e.k < 4200, 'سعرات شاذة ' + e.i + ' ' + e.k); assert(B.shared[d.subs] && B.shared[d.subs].length, 'بدائل مفقودة ' + e.i); });
  Object.values(IDX.fams).forEach((f) => assert(f.n && f.who && f.goal && f.sys, f.dir));
});
t('العجز الحراري المصري قليل المؤشر الجلايسيمي: 42 نظاماً (3 فئات × 11 مستوى + القولون 9 مستويات) بخمس وجبات وأدلة', () => {
  const L = IDX.plans.filter((e) => e.f === 'lowgi_eg'); assert.strictEqual(L.length, 42);
  ['tier_eco', 'tier_mid', 'tier_pre'].forEach((fo) => assert.deepStrictEqual(L.filter((e) => e.fo === fo).map((e) => e.l), [1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200]));
  assert.deepStrictEqual(L.filter((e) => e.fo === 'ibs').map((e) => e.l), [1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000]);
  L.forEach((e) => { const d = B.plans[e.i]; assert.strictEqual(d.days.length, 7); assert(d.days.every((y) => y.m.length === 5), e.i); assert(Math.abs(e.k - e.l) <= 25, e.i + ' ' + e.k); });
  assert(IDX.fams.lowgi_eg.goal === 'lose' && IDX.fams.lowgi_eg.sys === 'ex' && IDX.fams.lowgi_eg.rg === 'eg'); assert(B.guides.lowgi_eg.spec.length >= 4 && B.guides.lowgi_eg.spec[0].tb[0].length === 12);
  const txt = JSON.stringify(B.plans[L.find((e) => e.fo === 'ibs' && e.l === 1600).i].days); assert(!/(^|[\s"،(])(فول|عدس|حمص|بيصارة|طعمية)([\s"،)]|$)/.test(txt.replace(/فول سوداني/g, '')), 'نسخة القولون بلا بقول');
});
t('الاقتراح: مقاومة الأنسولين في مصر يضع العجز الحراري قليل المؤشر الجلايسيمي ضمن الثلاثة بعد اللو كارب، والقولون يضيف نسخته، والميزانية تختار الفئة', () => {
  const P = W('أنثى', 32, 82, 162, 1);
  const r = rec({ goal: 'lose', cond: ['ir'] }, P); assert(base(r).includes('lowgi'), base(r).join()); assert.strictEqual(RL.fam(r.top[0].fk).b, 'lowcarb', 'قرار المالك: لو كارب أولاً لمقاومة الأنسولين'); assert(r.top.slice(0, 3).some((x) => RL.fam(x.fk).b === 'lowgi'), 'والعجز قليل المؤشر ضمن الثلاثة');
  const r2 = rec({ goal: 'lose', cond: ['ibs'] }, P); assert(r2.top.some((x) => RL.fam(x.fk).b === 'lowgi' && x.e.fo === 'ibs') || r2.top.some((x) => RL.fam(x.fk).b === 'fodmap'), base(r2).join());
  const r3 = rec({ goal: 'lose', cond: ['ir'], routine: 'budget' }, P); assert.strictEqual(r3.top.find((x) => RL.fam(x.fk).b === 'lowgi').e.fo, 'tier_eco');
  const sa = RL.recommend({ goal: 'lose', cond: ['ir'], region: 'sa', routine: 'classic' }, P); assert(!sa.top.some((x) => RL.fam(x.fk).b === 'lowgi'), 'مصري فقط');
});
t('الأسئلة ديناميكية: البيانات الناقصة فقط، وأسئلة الهدف تظهر حسبه', () => {
  const P = W('أنثى', 30, 80, 160, 1);
  const ids = (a) => RL.questions(a, P).map((q) => q.id);
  assert.deepStrictEqual(ids({ goal: 'lose' }).slice(0, 2), ['goal', 'region']); assert(!ids({ goal: 'lose' }).includes('wt') && !ids({ goal: 'lose' }).includes('act'));
  assert(ids({ goal: 'lose' }).includes('concern') && ids({ goal: 'lose' }).includes('style'));
  assert(ids({ goal: 'cut' }).includes('train') && ids({ goal: 'plateau' }).includes('why') && ids({ goal: 'maintain' }).includes('prev'));
  assert(!ids({ goal: 'lose', cond: ['glp1'] }).includes('style'), 'GLP-1 لا يسأل عن الأسلوب');
  assert(!RL.questions({}, W('ذكر', 30, 80, 175, 1)).some((q) => q.id === 'concern'), 'سؤال الشعر/البشرة للسيدات فقط');
  assert(RL.questions({}, {}).map((q) => q.id).slice(0, 4).join() === 'sex,age,wt,ht');
  assert(RL.questions({ age: 9 }, {}).every((q) => q.id !== 'goal' && q.id !== 'cond'), 'الطفل لا يُسأل عن الهدف والأمراض');
});
t('تنحيف عام: 3 ترشيحات من عائلات مختلفة، والمستوى قريب من الاحتياج − العجز ولا ينزل عن الحد الأدنى', () => {
  [[W('أنثى', 32, 88, 162, 1), 1200], [W('ذكر', 40, 110, 175, 0), 1500], [W('أنثى', 55, 70, 155, 0), 1200]].forEach(([P, floor]) => {
    const r = rec({ goal: 'lose', style: 'fixed', veg: 'no', concern: 'none' }, P);
    assert.strictEqual(r.top.length, 3); assert.strictEqual(new Set(base(r)).size, 3, base(r).join());
    r.top.forEach((x) => { assert(x.e.k >= floor - 60, 'تحت الحد الأدنى ' + x.label); assert(Math.abs(x.e.k - r.target) <= 260, x.label + ' بعيد عن الهدف ' + r.target); assert(x.expect.head && x.why.length); });
  });
});
t('الأسلوب والحالة يحددان الأمثل: مقاومة أنسولين ← لو كارب، تنوع ← زجزاج/تدوير، شعر ← شعر، قولون ← فودماب، نباتي ← نباتي فقط، GLP-1 ← GLP-1', () => {
  const P = W('أنثى', 35, 85, 162, 1);
  assert.strictEqual(base(rec({ goal: 'lose', cond: ['ir'], style: 'lowcarb', veg: 'no' }, P))[0], 'lowcarb');
  assert.strictEqual(rec({ goal: 'lose', cond: ['ir'], style: 'fixed', veg: 'no' }, P).top.find((x) => RL.fam(x.fk).b === 'lowcarb').e.fo, 'ir');
  assert(['zigzag', 'carbcycle'].includes(base(rec({ goal: 'lose', style: 'vary', veg: 'no' }, P))[0]));
  assert.strictEqual(base(rec({ goal: 'lose', concern: 'hair', style: 'fixed', veg: 'no' }, P))[0], 'hair');
  assert.strictEqual(base(rec({ goal: 'lose', concern: 'skin', style: 'fixed', veg: 'no' }, P))[0], 'skin');
  assert.strictEqual(base(rec({ goal: 'lose', cond: ['ibs'], veg: 'no' }, P))[0], 'fodmap');
  assert.deepStrictEqual(Array.from(new Set(base(rec({ goal: 'lose', veg: 'yes' }, P)))), ['veg']);
  assert.deepStrictEqual(Array.from(new Set(base(rec({ goal: 'lose', cond: ['glp1'] }, P)))), ['glp1']);
  assert.strictEqual(base(rec({ goal: 'lose', style: 'keto', veg: 'no' }, P))[0], 'keto');
});
t('الموانع: الكيتو لا يُرشَّح مع أدوية السكري أو الكلى أو اضطراب الأكل، والحمل والنحافة يُحالان، والتقلب يُستبعد مع اضطراب الأكل', () => {
  const P = W('ذكر', 50, 100, 172, 0);
  ['diab', 'kidney', 'ed'].forEach((c) => assert(!base(rec({ goal: 'lose', cond: [c], style: 'keto', veg: 'no' }, P)).includes('keto'), c));
  assert(!base(rec({ goal: 'lose', cond: ['ed'], style: 'vary', veg: 'no' }, P)).some((b) => b === 'zigzag' || b === 'carbcycle'));
  const pr = rec({ goal: 'lose', cond: ['preg'] }, W('أنثى', 30, 80, 160, 1)); assert(!pr.top.length && pr.refer.length);
  const th = rec({ goal: 'lose' }, W('أنثى', 22, 45, 165, 1)); assert(!th.top.length && /18.5/.test(th.refer[0]));
  assert(rec({ goal: 'lose', cond: ['diab'], style: 'fixed', veg: 'no' }, P).warn.some((w) => /الطبيب/.test(w)));
});
t('المنطقة: مصري ← ملفات EG، سعودي ← الملفات السعودية؛ ونمط اليوم يختار الشكل (اقتصادي، موظف، علبة المدرسة)', () => {
  const P = W('أنثى', 30, 78, 160, 1);
  rec({ goal: 'lose', style: 'vary', veg: 'no', region: 'eg' }, P).top.forEach((x) => { if (RL.fam(x.fk).b !== 'deficit' && RL.fam(x.fk).b !== 'keto') assert.strictEqual(RL.fam(x.fk).rg, 'eg', x.label); });
  rec({ goal: 'lose', style: 'vary', veg: 'no', region: 'sa' }, P).top.forEach((x) => assert.strictEqual(RL.fam(x.fk).rg, 'sa', x.label));
  assert.strictEqual(rec({ goal: 'lose', style: 'vary', veg: 'no', routine: 'budget' }, P).top[0].e.fo, 'budget');
  assert.strictEqual(rec({ goal: 'lose', style: 'vary', veg: 'no', routine: 'office' }, P).top[0].e.fo, 'office');
  assert.strictEqual(rec({ routine: 'lunchbox' }, W('أنثى', 9, 40, 135, 1)).top[0].e.fo, 'lunchbox');
});
t('الأطفال والمراهقون حسب العمر والجنس والنشاط', () => {
  const k = rec({}, W('أنثى', 9, 40, 135, 1)); assert.strictEqual(RL.fam(k.top[0].fk).b, 'kids'); assert.deepStrictEqual(k.top[0].e.ag, [8, 9]); assert.strictEqual(k.top[0].e.sx, 'f');
  const b = rec({}, W('ذكر', 6, 30, 120, 1)); assert.deepStrictEqual(b.top[0].e.ag, [6, 7]); assert.strictEqual(b.top[0].e.sx, 'm');
  const ta = rec({ region: 'sa' }, W('ذكر', 15, 80, 170, 2)); assert.strictEqual(RL.fam(ta.top[0].fk).b, 'teen'); assert.deepStrictEqual(ta.top[0].e.ag, [14, 16]); assert.strictEqual(ta.top[0].e.ac, 'active');
  const tl = rec({}, W('أنثى', 17, 75, 160, 0)); assert.strictEqual(tl.top[0].e.ac, 'low'); assert.deepStrictEqual(tl.top[0].e.ag, [16, 18]);
  assert(rec({}, W('أنثى', 4, 20, 100, 1)).refer.length);
});
t('زيادة وتضخيم وتنشيف: فائض/عجز في الاتجاه الصحيح ونظام الجرامات للرياضيين', () => {
  const g = rec({ goal: 'gain' }, W('ذكر', 22, 55, 178, 1)); assert(g.top[0].e.k > g.en.tdee, 'الزيادة بلا فائض'); assert(g.top.every((x) => RL.fam(x.fk).b === 'gain'));
  const bu = rec({ goal: 'bulk', train: 'morning' }, W('ذكر', 25, 75, 178, 2)); assert.strictEqual(bu.top[0].e.fo, 'morning'); assert(bu.top[0].e.k > bu.en.tdee); assert.strictEqual(bu.top[0].sys, 'g');
  const cu = rec({ goal: 'cut', cut: 'cut', train: 'evening' }, W('ذكر', 28, 85, 180, 2)); assert(cu.top[0].e.k < cu.en.tdee); assert(cu.top[0].expect.wk[1] <= 0.85 + 1e-9, 'التنشيف أسرع من 1% أسبوعياً');
  assert.strictEqual(RL.fam(rec({ goal: 'cut', cut: 'cycle', train: '3days' }, W('ذكر', 28, 85, 180, 2)).top[0].fk).b, 'acc');
  assert.strictEqual(rec({ goal: 'cut', cut: 'recomp' }, W('أنثى', 28, 65, 165, 2)).top[0].e.fo, 'recomp');
});
t('التثبيت والثبات: البروتوكول حسب الطريقة/السبب، ونقطة البداية قريبة من سعرات الحمية الأخيرة', () => {
  const m = rec({ goal: 'maintain', prev: 'sleeve', last: '1200' }, W('أنثى', 38, 70, 160, 1)); assert.strictEqual(m.top[0].e.sb, 'sleeve'); assert(m.top[0].e.k >= 1150 && m.top[0].e.k <= 1400, m.top[0].label);
  const g = rec({ goal: 'maintain', prev: 'glp1', last: '1600' }, W('أنثى', 38, 70, 160, 1)); assert.strictEqual(g.top[0].e.sb, 'glp1');
  ({ tired: 'break', train: 'refeed', lostmuch: 'recalc', water: 'water' }).constructor;
  Object.entries({ tired: 'break', train: 'refeed', lostmuch: 'recalc', water: 'water' }).forEach(([why, sb]) => { const p = rec({ goal: 'plateau', why, last: '1400' }, W('أنثى', 30, 78, 158, 1)); assert.strictEqual(p.top[0].e.sb, sb, why); assert.strictEqual(p.top[0].e.wk, 1); assert.strictEqual(p.top.length, 3); });
});
t('المتوقع: نزول بين 0.1 و1.2 كجم أسبوعياً للتنحيف، مع ملاحظة أنه تقديري', () => {
  [W('أنثى', 30, 95, 160, 1), W('ذكر', 45, 130, 178, 0), W('أنثى', 25, 68, 165, 2)].forEach((P) => rec({ goal: 'lose', style: 'fixed', veg: 'no' }, P).top.forEach((x) => { if (x.expect.wk) assert(x.expect.wk[0] >= 0.1 && x.expect.wk[1] <= 1.2, x.label + ' ' + x.expect.wk); assert(x.expect.lines.some((l) => /تقدير/.test(l))); }));
});
t('التحويل لخطة «زنها»: 7 أيام بوجبات وأسطر مصنّفة ببدائل من نفس المجموعة، ونظام الجرامات بماكروز الوجبة', () => {
  ['Deficit_Balanced_1400kcal', 'ZigZag_EG_1400kcal_Form1_Egyptian-Classic', 'AthleteCut_EG_1800kcal_Form1_Evening-Training', 'Kids_EG_Girls_Age8-9_1402kcal_Form2_School-Lunchbox'].forEach((id) => {
    const d = Object.assign({}, B.plans[id], { subsArr: B.shared[B.plans[id].subs] }), e = RL.plan(id), h = RL.toHissati(d, e);
    assert.strictEqual(h.days.length, 7); assert.strictEqual(h.sys, 'ready'); assert.strictEqual(h.ready.id, id);
    h.days.forEach((y) => { assert(y.kcal > 0 && y.slots.length >= 3); y.slots.forEach((s) => s.lines.forEach((l) => { assert(l[0] >= 0 && l[0] < h.groups.length && l[1] && l[2]); })); });
    if (RL.fam(e.f).sys === 'g') assert(/بروتين \d+/.test(h.days[0].slots[0].meal)); else assert(h.days[0].slots.some((s) => s.lines.some((l) => l[3].length)), 'لا بدائل');
  });
  assert.strictEqual(RL.groupOf('زبدة فول سوداني 8 جم'), 6); assert.strictEqual(RL.groupOf('عجة بيضة واحدة (بدون زيت زائد)'), 2); assert.strictEqual(RL.groupOf('شريحتين توست أسمر'), 0); assert.strictEqual(RL.groupOf('كوب لبن قليل الدسم'), 3);
});
console.log('\nنجح ' + n + ' اختباراً');
