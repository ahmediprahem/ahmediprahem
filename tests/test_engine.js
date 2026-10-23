'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8')), R = JSON.parse(fs.readFileSync(path.join(__dirname, 'ref_cases.json'), 'utf8'));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message); process.exitCode = 1; } };
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));
t('الأهداف مطابقة لقيم الإكسل للعميل الافتراضي', () => { const T = E.targets({ sex: 'ذكر', age: 30, weight: 80, height: 178, activity: 'نشاط متوسط (3-5 أيام)', goal: 'خسارة متوسطة −500', macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3 }, D);
  [[T.bmr, 1767.5], [T.tdee, 2739.625], [T.kcal, 2239.625], [T.cho, 247.934375], [T.pro, 144], [T.fat, 74.6541666666667], [T.ibw, 78], [T.adjbw, 78.8], [T.bmi, 25.2493372048984]].forEach(([a, b]) => assert(close(a, b, 1e-9), a + ' != ' + b)); });
t('الأهداف مطابقة للمرجع على ' + R.targets.length + ' حالة', () => { R.targets.forEach(({ c, T }) => { const j = E.targets(Object.assign({ proRef: 'actual', kcalFloor: false }, c), D); ['bmr', 'tdee', 'kcal', 'cho', 'pro', 'fat', 'ibw'].forEach(k => assert(close(j[k], T[k], 1e-9), k + ' ' + j[k] + ' vs ' + T[k])); }); });
t('محرك الحصص اليومي مطابق للمرجع على ' + R.solve.length + ' حالة (التوزيع والدرجة)', () => { R.solve.forEach(({ T, cap, sweets, exp }) => { const j = E.solveDay(T, { cap, sweets }, D); assert.deepStrictEqual(j.counts, exp.counts); assert.strictEqual(j.ok, exp.ok); assert(close(j.score, exp.score, 1e-9)); }); });
t('توزيع الحصص على الوجبات مطابق للمرجع على ' + R.alloc.length + ' حالة', () => { R.alloc.forEach(({ total, w, cap, mn, exp }) => assert.deepStrictEqual(E.allocate(total, w, cap, mn, 1), exp)); });
t('التوزيع: السقوف والحد الأدنى والمجموع محفوظة', () => { R.alloc.forEach(({ total, w, cap, mn }) => { const r = E.allocate(total, w, cap, mn, 1), capSum = cap.reduce((a, b) => a + b, 0);
  r.forEach((x, i) => { assert(x <= cap[i] || x === Math.min(mn[i], cap[i]), 'سقف'); assert(Number.isInteger(x) && x >= 0); }); assert(r.reduce((a, b) => a + b, 0) <= Math.max(total, mn.reduce((a, b, i) => a + Math.min(b, cap[i]), 0))); if (capSum >= total && w.some(x => x > 0)) assert(r.reduce((a, b) => a + b, 0) >= Math.min(total, w.reduce((a, b, i) => a + (b > 0 ? cap[i] : 0), 0)) - 0, 'المجموع'); }); });
t('السمنة: البروتين على الوزن المعدّل 1.3 جم/كجم وحد 30% من السعرات، والنسب اليدوية كما هي', () => {
  const c = { sex: 'أنثى', age: 40, weight: 110, height: 162, activity: 'نشاط خفيف (1-3 أيام)', goal: 'خسارة متوسطة −500', macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3 }, T = E.targets(c, D);
  assert(T.obese); assert(T.pro >= 1.3 * T.adjbw - 1e-6 && T.pro <= Math.max(1.5 * T.adjbw, 1.3 * T.adjbw) + 1e-6 && T.pro * 4 <= T.kcal * 0.3 + 1e-6, 'بروتين ' + T.pro); assert(T.cho * 4 <= T.kcal * 0.45 + 1e-6 && T.fat * 9 <= T.kcal * 0.35 + 1e-6); assert(T.pro < 110 * 1.2, 'ليس على الوزن الفعلي');
  const A = E.targets(Object.assign({ proRef: 'actual' }, c), D); assert(close(A.pro, 1.8 * 110, 1e-9));
  const M = E.targets(Object.assign({}, c, { macroMode: 'manual', choPct: 0.45, proPct: 0.25, fatPct: 0.3 }), D); assert(close(M.pro, M.kcal * 0.25 / 4, 1e-9));
  const N = E.targets(Object.assign({}, c, { weight: 60 }), D); assert(!N.obese && close(N.pro, 1.8 * 60, 1e-9)); });
t('حد أدنى للسعرات 1200 للنساء و1500 للرجال في الحساب التلقائي', () => {
  const c = { sex: 'أنثى', age: 60, weight: 55, height: 150, activity: 'خامل (قليل الحركة)', goal: 'خسارة متوسطة −500', macroMode: 'auto_pf', proGkg: 1.2, fatPct: 0.3 };
  assert.strictEqual(E.targets(c, D).kcal, 1200); assert.strictEqual(E.targets(Object.assign({}, c, { sex: 'ذكر', weight: 60 }), D).kcal, 1500); assert.strictEqual(E.targets(Object.assign({}, c, { kcalManual: 1000 }), D).kcal, 1000); });
console.log('\nنجح', n, 'اختبارات');
