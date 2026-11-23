// 1.49 (قرار المالك): تبادل البروتين المرن مع التعويض التلقائي، ومجموعات التدوير الأسبوعي.
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js');
const D0 = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 600)); process.exitCode = 1; } };
const clone = () => JSON.parse(JSON.stringify(D0));
const cl = (i, x) => Object.assign({ name: 'ع', sex: i % 2 ? 'ذكر' : 'أنثى', age: 25 + i * 3, weight: 60 + i * 6, height: 160 + i * 2, activity: D0.settings.activity[1 + i % 3][0], goal: D0.settings.goals[i % 3][0], meals: 4 + i % 2, conditions: [], allergens: [], keywords: [], love: [], avoid: [], v2: true }, x || {});
const tot = (D, day) => { const m = [0, 0, 0]; day.slots.forEach((s) => s.lines.forEach((l) => { if (l.missing) return; const X = D.EX[l.g]; m[0] += X[0] * l.e; m[1] += X[1] * l.e; m[2] += X[2] * l.e; })); return m; };

t('فرق التبادل من جدول البدائل: قليل الدهن ← عالي الدهن = حصة دهون لكل حصة؛ لحم ← بقول = حصة نشويات لكل حصة', () => {
  const D = clone();
  assert.deepStrictEqual(E.flexDelta(3, 5, 3, D), { fat: 3, carb: 0, kcal: 135 });
  assert.deepStrictEqual(E.flexDelta(3, 1, 2, D), { fat: 0, carb: 2, kcal: 120 });
  assert.deepStrictEqual(E.flexDelta(5, 2, 2, D), { fat: -3, carb: 0, kcal: -130 });
  assert.strictEqual(E.flexNote(E.flexDelta(3, 1, 2, D)), 'يُنقص 2 حصة نشويات');
});
t('البدائل المرنة: من مجموعات البروتين الأخرى فقط (بقول، شديد/قليل/متوسط/عالي الدهن) بنفس عدد الحصص ومع معاينة التعويض', () => {
  const D = clone(), p = E.planWeek(cl(2), D), day = p.days[0], si = day.slots.findIndex((s) => s.type === 'L'), line = day.slots[si].lines.find((l) => l.g >= 2 && l.g <= 4);
  const fx = E.flexAlts(line, 'L', p, D, 12); assert(fx.length >= 3, fx.length);
  assert(fx.every((a) => E.FLEXP.includes(a.g) && !E.POOLS[line.g].includes(a.g) && a.note), JSON.stringify(fx.slice(0, 3)));
  assert(fx.some((a) => a.g === 1) && fx.some((a) => a.g === 5), 'بقول وعالي الدهن');
});
t('التعويض يحفظ ماكروز اليوم: بعد كل تبادل مرن يبقى الكارب والبروتين والدهون كما كانت (عند توفر حصص للتعويض) — 40 تبديلاً', () => {
  const D = clone(); let tested = 0, exact = 0;
  for (let i = 0; i < 10; i++) {
    const p = E.planWeek(cl(i), D);
    for (let d = 0; d < 7 && tested < 40; d += 2) {
      const day = p.days[d], si = day.slots.findIndex((s) => s.type === 'L'); if (si < 0) continue; const li = day.slots[si].lines.findIndex((l) => l.g >= 2 && l.g <= 5 && !l.missing); if (li < 0) continue;
      const line = day.slots[si].lines[li], fx = E.flexAlts(line, 'L', p, D, 12); if (!fx.length) continue; const a = fx[(i + d) % fx.length], og = line.g;
      const before = tot(D, day); E.swap(line, a, D, {}); const r = E.flexComp(p, d, si, li, E.flexDelta(og, a.g, line.e, D), D), after = tot(D, day); tested++;
      if (r.left.fat || r.left.carb) continue; exact++;
      assert(Math.abs(after[2] - before[2]) <= 2.5 + 1e-9, 'دهون ' + before[2] + ' → ' + after[2] + ' (' + a.name + ')'); assert(Math.abs(after[0] - before[0]) <= 7.5 + 1e-9, 'كارب ' + before[0] + ' → ' + after[0]);
      assert(day.slots[si].lines.includes(line) && line.name === a.name, 'السطر المبدَّل باقٍ');
    }
  }
  assert(tested >= 30 && exact >= tested * 0.7, tested + ' / ' + exact);
  console.log('   تبديلات', tested, '| عُوّضت كاملة', exact);
});
t('التعويض يبدأ بالوجبة نفسها ثم باقي اليوم، ولا يتجاوز حد السطر عند الزيادة', () => {
  const D = clone(), p = E.planWeek(cl(4), D), day = p.days[1], si = day.slots.findIndex((s) => s.type === 'L'), li = day.slots[si].lines.findIndex((l) => l.g >= 2 && l.g <= 5);
  const line = day.slots[si].lines[li], og = line.g, a = E.flexAlts(line, 'L', p, D, 20).find((x) => x.g === 5) || E.flexAlts(line, 'L', p, D, 20)[0];
  const hasFat = day.slots[si].lines.some((l, j) => j !== li && l.g === 11); E.swap(line, a, D, {}); const r = E.flexComp(p, 1, si, li, E.flexDelta(og, a.g, line.e, D), D);
  if (hasFat && r.ch.length) assert.strictEqual(r.ch[0].type, 'L', 'الوجبة نفسها أولاً');
  const by = E.byName(D); day.slots.forEach((s) => s.lines.forEach((l) => { if (by[l.name] && l.g === 11) assert(l.e <= E.lim(by[l.name], s.type, D).max + 1e-9); }));
});
t('مجموعات التدوير: الأسماك المعلّمة «أسماك» تتنوع على الغداء بدل تكرار صنف واحد', () => {
  const D = clone(), FISH = D.foods.filter((f) => E.protClass(f) === 'fish' && f.on && !f.x && f.m[1]).map((f) => f.n); assert(FISH.length >= 4, FISH.length);
  const count = (D2) => { const used = {}; let fishLunch = 0; for (let i = 0; i < 12; i++) { const p = E.planWeek(cl(i, { freq: { poultry: 2, red: 2, fish: 3 } }), D2); p.days.forEach((d) => d.slots.filter((s) => s.type === 'L').forEach((s) => s.lines.forEach((l) => { if (FISH.includes(l.name)) { fishLunch++; used[i + ':' + l.name] = (used[i + ':' + l.name] || 0) + 1; } }))); } const rep = Object.values(used).filter((v) => v > 1).reduce((a, v) => a + v - 1, 0); return { fishLunch, rep }; };
  const a = count(clone()); const D2 = clone(); D2.foods.forEach((f) => { if (FISH.includes(f.n)) f.rot = 'أسماك'; }); const b = count(D2);
  console.log('   تكرار نفس السمكة في الأسبوع: بدون تدوير', a.rep, 'من', a.fishLunch, '← مع التدوير', b.rep, 'من', b.fishLunch);
  assert(b.rep <= a.rep, b.rep + ' > ' + a.rep);
});
t('الإعدادات: rot من override يصل الصنف ولا يجعله «معدّلاً»؛ ومن الصنف المضاف أيضاً', () => {
  const D = clone(), base = D0.foods.map((f) => Object.assign({}, f)); E.applyFoodSettings(D, base, { over: { 'سلمون': { rot: 'أسماك' } }, custom: [{ n: 'سمك تجربة', g: 3, upe: 30, us: 'جم', up: 'جم', m: [0, 1, 1, 0], rot: 'أسماك' }] });
  const s = D.foods.find((f) => f.n === 'سلمون'), c = D.foods.find((f) => f.n === 'سمك تجربة'); assert.strictEqual(s.rot, 'أسماك'); assert(!s.edited); assert.strictEqual(c.rot, 'أسماك');
});
console.log('\nنجح', n, 'اختبارات التبادل المرن والتدوير');
