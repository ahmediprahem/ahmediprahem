// الماكروز اليدوية للرياضي: السعرات (من المرحلة / نسبة تعديل / ثابتة)، والبروتين بالجرام لكل كجم (وزن الجسم أو الكتلة الخالية) أو بالنسبة، والدهون كذلك.
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), A = require('../src/athlete.js'), AD = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/athlete.json'), 'utf8'));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 500)); process.exitCode = 1; } };
const near = (a, b, tol = 0.01) => assert(Math.abs(a - b) <= tol, a + ' ≠ ' + b);
const base = (x) => Object.assign(A.newAthlete(AD), { code: 'A1', name: 'ر', sex: 'ذكر', age: 28, weight: 80, height: 178, phase: 'تنشيف', keywords: [], love: [], avoid: [] }, x || {});
t('الافتراضي «حسب المرحلة» لم يتغير، وبيانات قديمة بلا الحقول الجديدة تعطي نفس الأرقام', () => {
  const T = A.targets(base(), AD), d = T.days[2]; near(d.kcal, d.tdee * 0.8); near(d.p, 2.4 * 80); near(d.f, 0.8 * 80); assert.strictEqual(T.manual, false); assert(/حسب المرحلة/.test(T.info));
  const T2 = A.targets(base({ macroMode: 'phase', pMode: 'pct', pVal: 40 }), AD); near(T2.days[2].p, 192);
});
t('يدوي — البروتين جم/كجم على وزن الجسم، والدهون جم/كجم، والسعرات من المرحلة', () => {
  const T = A.targets(base({ macroMode: 'manual', kcalMode: 'phase', pMode: 'gkg', pBase: 'bw', pVal: 2.0, fMode: 'gkg', fVal: 1.0 }), AD), d = T.days[2];
  near(d.kcal, d.tdee * 0.8); near(d.p, 160); near(d.f, 80); assert(T.manual && /يدوي/.test(T.info) && /وزن/.test(T.info));
});
t('يدوي — البروتين على الكتلة الخالية من الدهون (مع نسبة الدهون)، والرجوع لوزن الجسم بتحذير إن غابت', () => {
  const T = A.targets(base({ bf: 20, macroMode: 'manual', pMode: 'gkg', pBase: 'ffm', pVal: 2.5, fMode: 'gkg', fVal: 0.8 }), AD); near(T.ffm, 64); near(T.days[0].p, 160); assert(/كتلة خالية/.test(T.info));
  const T2 = A.targets(base({ macroMode: 'manual', pMode: 'gkg', pBase: 'ffm', pVal: 2.5, fMode: 'gkg', fVal: 0.8 }), AD); near(T2.days[0].p, 200); assert(T2.days[0].warns.some(w => /الكتلة الخالية/.test(w)));
});
t('يدوي — البروتين والدهون بالنسب من سعرات كل يوم (التدريب والراحة يختلفان)', () => {
  const T = A.targets(base({ macroMode: 'manual', pMode: 'pct', pVal: 30, fMode: 'pct', fVal: 25, carbMethod: 'remainder' }), AD);
  T.days.forEach(d => { near(d.p * 4 / d.kcal, 0.30, 1e-6); near(d.f * 9 / d.kcal, 0.25, 1e-6); near(d.c * 4 / d.kcal, 0.45, 1e-6); near(d.macroKcal, d.kcal, 1e-6); });
  assert(T.days[0].p !== T.days[2].p, 'الجرامات يجب أن تختلف بين أيام بسعرات مختلفة');
  assert(A.targets(base({ macroMode: 'manual', pMode: 'pct', pVal: 60, fMode: 'pct', fVal: 45 }), AD).days[0].warns.some(w => /مجموع نسبتي/.test(w)));
});
t('يدوي — السعرات بنسبة تعديل، أو ثابتة لأيام التدريب والراحة (الفارغ = مثل التدريب)', () => {
  const a = A.targets(base({ macroMode: 'manual', kcalMode: 'adj', kcalAdj: -15, pMode: 'gkg', pVal: 2, fMode: 'gkg', fVal: 1 }), AD); a.days.forEach(d => near(d.kcal, d.tdee * 0.85, 1e-6)); assert(/-15%/.test(a.info));
  const f = A.targets(base({ macroMode: 'manual', kcalMode: 'fixed', kcalTrain: 2600, kcalRest: 2200, pMode: 'gkg', pVal: 2, fMode: 'gkg', fVal: 1 }), AD);
  f.days.forEach(d => near(d.kcal, d.train ? 2600 : 2200)); assert(/2600 تدريب \/ 2200 راحة/.test(f.info));
  const g = A.targets(base({ macroMode: 'manual', kcalMode: 'fixed', kcalTrain: 2500, kcalRest: '', pMode: 'gkg', pVal: 2, fMode: 'gkg', fVal: 1 }), AD); g.days.forEach(d => near(d.kcal, 2500));
});
t('التحذيرات تعمل في اليدوي (بروتين أقل من الحد الأدنى بالجرام لكل كجم وزن)', () => {
  const T = A.targets(base({ macroMode: 'manual', pMode: 'gkg', pVal: 1.2, fMode: 'gkg', fVal: 0.4 }), AD); const w = T.days[0].warns.join(' ');
  assert(/البروتين أقل/.test(w) && /الدهون أقل/.test(w), w);
});
t('الخطة تُولَّد بأهداف اليدوي (الأهداف المخزنة في الخطة هي اليدوية)', () => {
  const c = base({ macroMode: 'manual', kcalMode: 'fixed', kcalTrain: 2700, kcalRest: 2300, pMode: 'gkg', pVal: 2.2, fMode: 'pct', fVal: 25, carbMethod: 'remainder' });
  const p = A.planWeek(c, AD); assert(p.T.manual); p.T.days.forEach(d => near(d.kcal, d.train ? 2700 : 2300)); near(p.T.days[0].p, 176);
});
console.log('\nنجح', n, 'اختبارات الماكروز اليدوية للرياضي');
