// «المتوفر عندي» في المحرك (0.52): ما عند العميل لكل وجبة يُفضَّل، وما يقدر يوفّره أقل، والغائب من مجموعة اختار منها يتأخر؛ وإيقافه يعيد السلوك القديم.
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 600)); process.exitCode = 1; } };
const acts = D.settings.activity.map((a) => a[0]), goals = D.settings.goals.map((g) => g[0]);
const base = { code: 'P1', name: 'ع', sex: 'أنثى', weight: 85, height: 162, age: 33, activity: acts[2], goal: goals[2], meals: 4, conditions: [], allergens: [], love: [], avoid: [], favMeals: [], excludedMeals: [], noBank: { B: 1, L: 1, D: 1, S: 1 }, macroMode: 'auto_pf' };
const uses = (c, t, names) => { let hit = 0, all = 0; E.planWeek(c, D).days.forEach((d) => d.slots.filter((s) => s.type === t).forEach((s) => s.lines.forEach((l) => { if (l.missing) return; all++; if (names.includes(l.name)) hit++; }))); return [hit, all]; };
const by = E.byName(D), pick = (g, k) => D.foods.filter((f) => f.g === g && f.m[k] && !E.fmeta(f).x && E.fmeta(f).cost < 3).slice(3, 6).map((f) => f.n);
const bProt = pick(4, 0).concat(pick(3, 0)), bStarch = pick(0, 0), lProt = pick(3, 1).concat(pick(2, 1)), lStarch = pick(0, 1);
t('الفطور والغداء من قائمة المتوفر: نسبة أصناف المتوفر ترتفع بوضوح عن بدونها', () => {
  const pantry = { at: 1, B: {}, L: {}, D: {}, S: {} }; bProt.concat(bStarch).forEach((x) => { pantry.B[x] = 'h'; }); lProt.concat(lStarch).forEach((x) => { pantry.L[x] = 'h'; });
  const [h0, a0] = uses(base, 'B', bProt.concat(bStarch)), [h1, a1] = uses(Object.assign({}, base, { pantry }), 'B', bProt.concat(bStarch));
  const [l0, b0] = uses(base, 'L', lProt.concat(lStarch)), [l1, b1] = uses(Object.assign({}, base, { pantry }), 'L', lProt.concat(lStarch));
  console.log('    الفطور', h0 + '/' + a0, '←', h1 + '/' + a1, '| الغداء', l0 + '/' + b0, '←', l1 + '/' + b1);
  assert(h1 / a1 > h0 / a0 + 0.2 && h1 / a1 >= 0.3, 'الفطور (من 5 أدوار في الوجبة، اثنان فقط من القائمة)'); assert(l1 / b1 > l0 / b0 + 0.15, 'الغداء');
});
t('«أقدر أوفّره» (◐) يُفضَّل أقل من «متوفر عندي» (✓)، والإيقاف (panUse=false) يعيد الخطة كما بدون القائمة', () => {
  const cx = E.ctx(Object.assign({}, base, { pantry: { B: { [bProt[0]]: 'h', [bProt[1]]: 'c' } } }), D);
  assert(E.panS(cx, by[bProt[0]], 'B') > E.panS(cx, by[bProt[1]], 'B') && E.panS(cx, by[bProt[1]], 'B') > 0);
  const off = Object.assign({}, base, { pantry: { at: 1, B: { [bProt[0]]: 'h' } }, panUse: false }); assert.strictEqual(E.ctx(off, D).pan, null);
  assert.deepStrictEqual(JSON.stringify(E.planWeek(off, D).days.map((d) => d.slots.map((s) => s.lines.map((l) => l.name)))), JSON.stringify(E.planWeek(base, D).days.map((d) => d.slots.map((s) => s.lines.map((l) => l.name)))));
});
t('السلامة: لا مخالفات صارمة جديدة مع قائمة متوفر ضيقة', () => {
  const pantry = { at: 1, B: {}, L: {}, D: {}, S: {} }; bProt.slice(0, 2).forEach((x) => { pantry.B[x] = 'h'; }); lProt.slice(0, 2).forEach((x) => { pantry.L[x] = 'h'; });
  let hard = 0; E.planWeek(Object.assign({}, base, { pantry }), D).days.forEach((d) => d.slots.forEach((s) => { hard += E.slotIssues(s, D, base).filter((x) => x.h).length; })); assert.strictEqual(hard, 0);
});
console.log('\nنجح', n, 'اختبارات قائمة المتوفر');
