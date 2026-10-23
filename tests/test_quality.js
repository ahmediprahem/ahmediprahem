'use strict';
// بوابة جودة نظام الحصص (0.38): 56 عميل سمنة/زيادة وزن (3 و5 وجبات، سكري وبدونه، مطابخ وميزانيات وأنماط حياة مختلفة)
// بلا مخالفة صارمة واحدة والبنك موقوف، وبحد أقصى 1% مع البنك؛ ووسوم الأصناف كاملة؛ والكميات بخطوات واقعية.
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 500)); process.exitCode = 1; } };
const acts = D.settings.activity.map((a) => a[0]), goals = D.settings.goals.map((g) => g[0]);
const clients = (noBank) => { const out = []; let id = 0; for (const sex of ['أنثى', 'ذكر']) for (const [w, h, a] of [[78, 160, 28], [92, 165, 35], [110, 170, 42], [135, 168, 50], [88, 178, 30], [120, 182, 38], [150, 175, 45]]) for (const meals of [3, 5]) for (const cond of [[], ['سكري النوع الثاني']]) {
  id++; out.push({ code: 'Q' + id, name: 'ع', sex, weight: w, height: sex === 'أنثى' ? h - 8 : h, age: a, activity: acts[1], goal: goals[0], meals, conditions: cond, allergens: [], love: [], avoid: [], favMeals: [], excludedMeals: [], noBank: noBank ? { B: 1, L: 1, D: 1, S: 1 } : {}, macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, kcalManual: '', cuisine: ['', 'eg', 'sa'][id % 3], budget: 1 + id % 3, life: ['home', 'quick', 'travel'][id % 3] }); } return out; };
const audit = (cl) => { let slots = 0, hard = 0; const codes = {}; cl.forEach((c) => { const p = E.planWeek(c, D); p.days.forEach((d) => d.slots.forEach((s) => { slots++; E.slotIssues(s, D, c).forEach((x) => { if (x.h) { hard++; codes[x.code] = (codes[x.code] || 0) + 1; } }); })); }); return { slots, hard, codes }; };
t('بلا بنك: صفر مخالفات صارمة عبر 56 عميلاً (1568 وجبة): لا جبنان، لا بروتين ثالث، لا كميات خيالية، لا كسور لما يُعدّ، لا وجبات طويلة', () => { const r = audit(clients(true)); console.log('   وجبات', r.slots, '| مخالفات', r.hard, JSON.stringify(r.codes)); assert.strictEqual(r.hard, 0); });
t('مع البنك: المخالفات الصارمة ≤ 1% من الوجبات', () => { const r = audit(clients(false)); console.log('   وجبات', r.slots, '| مخالفات', r.hard, JSON.stringify(r.codes)); assert(r.hard / r.slots <= 0.01, r.hard + '/' + r.slots); });
t('كل صنف موسوم: الدور والسقف والخطوة والمطبخ والتكلفة والتحضير (والمضاف يدوياً يُستنتج له)', () => {
  D.foods.forEach((f) => { assert(f.r && f.mx > 0 && f.st > 0 && f.cz && f.cost >= 1 && f.cost <= 3 && f.prep >= 0 && f.prep <= 2, 'وسم ناقص: ' + f.n); });
  const m = E.fmeta({ n: 'جبنة قريش منزلية', g: 3, us: 'ملعقة كبيرة', upe: 4 }); assert.strictEqual(m.r, 'cheese'); assert(m.mx > 0 && m.st > 0);
  assert.strictEqual(E.fmeta({ n: 'بيضة بلدي', g: 4, us: 'بيضة', upe: 1.1 }).r, 'egg'); assert.strictEqual(E.fmeta({ n: 'خبز شعير', g: 0, us: 'شريحة', upe: 1 }).r, 'bread');
});
t('الكميات: البيض أعداد صحيحة، الملاعق الكثيرة أكواب، الأكواب بأرباع أو أثلاث', () => {
  const by = E.byName(D); assert.strictEqual(E.lineText(by['بيضة كاملة'], 2), '2 بيضات بيضة كاملة'); assert.strictEqual(E.lineText(by['جبنة قريش'], 2), '½ كوب جبنة قريش');
  assert.strictEqual(E.lineText(by['أرز أبيض'], 2), '6 ملاعق كبيرة أرز أبيض'); assert.strictEqual(E.lineText(by['عصير التوت البري'], 1), '⅓ كوب عصير التوت البري'); assert.strictEqual(E.lineText(by['عيش بلدي (خبز بلدي مصري)'], 3), '¾ رغيف عيش بلدي (خبز بلدي مصري)');
});
t('خيارات العميل: الميزانية المحدودة بلا أصناف مرتفعة التكلفة، والسفر بلا طبخ خارج الغداء، وغير الشائع مخفي إلا بطلب', () => {
  const base = clients(true)[4], by = E.byName(D);
  const lines = (c) => E.planWeek(c, D).days.flatMap((d) => d.slots.flatMap((s) => s.lines.filter((l) => !l.missing).map((l) => [s.type, by[l.name]])));
  assert(lines(Object.assign({}, base, { budget: 1 })).every(([, f]) => f.cost < 3)); assert(lines(Object.assign({}, base, { life: 'travel' })).every(([ty, f]) => ty === 'L' || f.prep < 2));
  assert(lines(Object.assign({}, base, { exotic: false })).every(([, f]) => !f.x)); assert(lines(Object.assign({}, base, { exotic: true, love: ['كينوا مطبوخة'] })).length > 0);
});
t('نقاط الجودة تُحسب مع الخطة وتنخفض مع المخالفة', () => { const p = E.planWeek(clients(true)[0], D); assert(p.quality && p.quality.score === 100 && p.quality.hard === 0); const s = p.days[0].slots[0], cheese = D.foods.filter((f) => f.r === 'cheese' && !f.x).slice(0, 2); cheese.forEach((f) => s.lines.push({ g: f.g, name: f.n, e: 1, text: f.n })); const q = E.planQuality(p, D); assert(q.hard >= 1 && q.score < 100 && q.items.some((x) => x.code === 'CHEESE2')); });
console.log('\nنجح', n, 'اختبارات بوابة جودة نظام الحصص');
