// 1.37 المفضلات في محرك الحصص (قرار المالك): نسبة افتراضية 80% بين 50 و90 لكل عميل، حد تكرار قابل للتعديل (افتراضي 2)، نوع الوجبة محفوظ،
// لا تُحسب الوجبة إلا إذا ناسبت حصص الخانة واجتازت الاستبعاد والحالة الصحية وnoBank، والنقص يُكمَل من البنك مع ملاحظة بالسبب. وجدول البدائل: المفضلات أولاً.
const assert = require('assert'), E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
const TI = { B: 0, L: 1, D: 2, S: 3 }, multi = D.bank.filter((b) => b.on && b.ing.length >= 2), only = (t) => multi.filter((b) => b.m[t] && b.m.filter(Boolean).length === 1).map((b) => b.n);
const fav = [...only(0).slice(0, 4), ...only(1).slice(0, 4), ...only(2).slice(0, 4), ...only(3).slice(0, 7)];
const base = { sex: 'أنثى', age: 32, weight: 82, height: 163, activity: D.settings.activity[1][0], goal: D.settings.goals[2][0], meals: 5, conditions: [], allergens: [], love: [], avoid: [], excludedMeals: [], noBank: {} };
const run = (c) => { const p = E.eqvPlan(c, D); return { p, r: E.favReport(p, c, D) }; };
const slots = (p) => [].concat(...p.days.map((d) => d.slots)), byN = {}; D.bank.forEach((b) => { byN[b.n] = b; });
const kcalOk = (p) => p.days.every((d) => { const x = d.nominal, k = x[0] * 4 + x[1] * 4 + x[2] * 9; return Math.abs(k / p.targets.kcal - 1) <= 0.05; });

{ const { p, r } = run({ ...base, favMeals: [] }); assert.strictEqual(r.src, 'none'); assert(!slots(p).some((s) => s.fav)); assert(/لا مفضلات/.test(r.notes[0])); ok('بلا مفضلات: لا وجبات مفضلة ولا إكمال من البنك (السلوك السابق كما هو) مع ملاحظة'); }
{ const c = { ...base, favMeals: fav }; assert.deepStrictEqual(E.favCfg(c), { pct: 80, rep: 2 }); assert.strictEqual(E.favCfg({ favPct: 95 }).pct, 90); assert.strictEqual(E.favCfg({ favPct: 30 }).pct, 50); assert.strictEqual(E.favCfg({ favPct: 70, favRep: 4 }).rep, 4); ok('الإعداد: 80% افتراضياً، يُقصّ إلى 50–90، وحد التكرار افتراضياً 2 وقابل للتعديل'); }
{ const c = { ...base, favMeals: fav, favPct: 50 }, { p, r } = run(c); assert(r.pct >= 50, r.pct); assert.strictEqual(r.notes.length, 0, r.notes.join());
  const fs = slots(p).filter((s) => s.fav === 'fav'); assert(fs.length >= 18); fs.forEach((s) => { const b = byN[s.meal]; assert(b && b.m[TI[s.type]], s.meal + ' في ' + s.type); assert(fav.includes(s.meal)); });
  fs.forEach((s) => { for (let g = 0; g < 13; g++) { if ((g >= 2 && g <= 5) || g === 11) continue; const got = s.lines.filter((l) => l.g === g && !l.missing).reduce((a, l) => a + l.e, 0); assert(Math.abs(got - (s.target[g] || 0)) < 1e-9, s.meal + ' g' + g + ' ' + got + '≠' + s.target[g]); } });
  assert(kcalOk(p)); ok('مفضلات كافية بنسبة 50%: تحققت ' + r.pct + '%، كل وجبة مفضلة في نوعها، وحصص كل خانة كما هي بالضبط، وسعرات كل يوم ±5%'); }
{ const c = { ...base, favMeals: fav, favPct: 90, favRep: 4 }, { p, r } = run(c); assert(r.pct >= 90, r.pct); const u = {}; slots(p).forEach((s) => { if (s.fav) u[s.meal] = (u[s.meal] || 0) + 1; }); assert(Object.values(u).every((v) => v <= 4)); assert(kcalOk(p)); ok('90% بحد تكرار 4: تحققت ' + r.pct + '% ولا وجبة أكثر من 4 مرات'); }
{ const c = { ...base, favMeals: fav, favRep: 1 }, { p, r } = run(c); const u = {}; slots(p).forEach((s) => { if (s.fav) u[s.meal] = (u[s.meal] || 0) + 1; }); assert(Object.values(u).every((v) => v <= 1)); assert(r.pct < 80 && /حد التكرار 1/.test(r.notes.join()), r.notes.join()); assert(r.bank > 0); ok('حد التكرار 1 يُحترم؛ لم تبلغ 80% فظهر السبب (حد التكرار) وأُكمل من البنك (' + r.bank + ')'); }
{ const c = { ...base, favMeals: only(1).slice(0, 1) }, { p, r } = run(c); assert(r.pct < 80); const t = r.notes.join(); assert(/لا مفضلات مسموحة لـالإفطار/.test(t) && /لا مفضلات مسموحة لـالسناك/.test(t), t); assert(r.bank > 0 && p.favInfo.target > 0); assert(kcalOk(p)); ok('مفضلات غير كافية: ملاحظة بالأسباب لكل نوع، والإكمال من بنك الوجبات (' + r.bank + ')'); }
{ const al = D.allergens.find((a) => multi.some((b) => b.m[1] && b.ing.some((i) => a.kw.some((k) => i.n.includes(k))))), bad = multi.filter((b) => b.m[1] && b.ing.some((i) => al.kw.some((k) => i.n.includes(k)))).map((b) => b.n).slice(0, 3);
  const c = { ...base, allergens: [al.label], favMeals: bad.concat(only(1).filter((n) => !bad.includes(n)).slice(0, 2)) }, { p, r } = run(c);
  assert(!slots(p).some((s) => bad.includes(s.meal)), 'وجبة مستبعدة وُضعت'); assert(/مستبعدة/.test(r.notes.join()), r.notes.join()); ok('تعارض مع الاستبعاد (' + al.label + '): لا تدخل المفضلة المستبعدة، وتظهر في الملاحظة'); }
{ const c = { ...base, favMeals: fav, noBank: { L: true } }, { p, r } = run(c); assert(!slots(p).some((s) => s.type === 'L' && s.fav)); assert(/معطّلة/.test(r.notes.join())); ok('noBank للغداء يُحترم: لا وجبة مفضلة أو من البنك في الغداء، مع ملاحظة'); }
{ const c = { ...base, favMeals: fav, favPct: 50 }, p0 = E.eqvPlan(c, D), s0 = p0.days[0].slots.find((s) => s.fav), si = p0.days[0].slots.indexOf(s0); const key = s0.si + '_9';
  const c2 = { ...c, eqvPicks: { [key]: 'خيار' } }, p2 = E.eqvPlan(c2, D); assert(!p2.days[0].slots.find((s) => s.si === s0.si).fav); ok('اختيار الأخصائي اليدوي لصنف في الوجبة له الأولوية على المفضلات'); }
{ const tailor = { ...base, v2: true, favMeals: [], noBank: { B: true, L: true, D: true, S: true }, pantry: { B: { 'فول مدمس': 'h' }, L: {}, D: {}, S: {} } }, { r } = run(tailor); assert.strictEqual(r.src, 'pantry'); ok('مستورد مسار التفصيل (noBank للكل وfavMeals فارغة): مفضلاته أصناف تُقاس نسبتها ولا تُفرض وجبات بنك'); }
{ const c = { ...base, favMeals: fav }, P = { client: c }, L = E.alternatives({ g: E.ALT_REP.starch, name: '', e: 1 }, 'L', P, D, 12), L0 = E.alternatives({ g: E.ALT_REP.starch, name: '', e: 1 }, 'L', { client: { ...base, favMeals: [] } }, D, 12);
  const FF = E.favFoods(c, D); const k = L.findIndex((a) => !a.fav); assert(L.some((a) => a.fav)); assert(L.slice(k).every((a) => !a.fav || a.tier === 2)); assert(L.filter((a) => a.fav).every((a) => FF[a.name] || c.love.includes(a.name))); assert(!L0.some((a) => a.fav));
  ok('جدول البدائل: أصناف المفضلات أولاً (⭐)، وبلا مفضلات يبقى الترتيب السابق'); }
console.log('\n' + n + ' اختبارات ناجحة');
