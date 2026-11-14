'use strict';
// 0.99 «التفصيل على المقاس»: توافق وتعارض الوجبة، حدود الكميات بحسب الدور والوجبة، وجدولة بروتين الغداء أسبوعياً. كله خلف client.v2
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 500)); process.exitCode = 1; } };
const byName = {}; D.foods.forEach(f => byName[f.n] = f);
let seed = 4242; const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, pick = a => a[Math.floor(rand() * a.length)];
const food = re => D.foods.find(f => f.on && re.test(f.n)), L = (...names) => names.map(x => ({ name: x.n || x }));
const mk = (v2, extra) => Object.assign({ name: 'x', sex: pick(['ذكر', 'أنثى']), age: 22 + Math.floor(rand() * 40), weight: 55 + Math.floor(rand() * 60), height: 150 + Math.floor(rand() * 40), activity: D.settings.activity[Math.floor(rand() * 3)][0], goal: D.settings.goals[0][0], meals: pick([3, 4, 5, 6]), macroMode: 'auto_pf', conditions: [], allergens: [], keywords: [], love: D.foods.filter(() => rand() < 0.1).map(f => f.n), avoid: [], noBank: { B: true, L: true, D: true, S: true }, v2: v2 }, extra || {});

t('أدوار البروتين: دجاج، لحم أحمر، سمك، قشريات، مصنّع', () => {
  assert.strictEqual(E.protClass(food(/^صدر دجاج/)), 'poultry'); assert.strictEqual(E.protClass(food(/^لحم بقري/)), 'red'); assert.strictEqual(E.protClass(food(/^سمك أبيض/)), 'fish');
  assert.strictEqual(E.protClass(food(/^روبيان/)), 'shell'); assert.strictEqual(E.protClass(food(/^بسطرما/)), 'proc'); assert.strictEqual(E.protClass(food(/^بيضة كاملة/)), 'egg');
});
t('كاشف التعارض: لحم مع سمك، دجاج مع قشريات، مصنّع مع لحم، نشويتان، بطاطسان؛ والوجبة السليمة بلا تعارض', () => {
  const ch = food(/^صدر دجاج/), fs2 = food(/^سمك أبيض/), sh = food(/^روبيان/), pr = food(/^نقانق قليلة|^بسطرما/), red = food(/^لحم بقري/), rice = food(/^أرز أبيض/), pasta = food(/^معكرونة/), pot = food(/^بطاطس مسلوقة/), pot2 = food(/^ذرة حلوة/);
  const ids = ls => E.mealConflicts(L(...ls), D, { fishDairy: true }).map(x => x.id).sort().join(',');
  assert.strictEqual(ids([ch, fs2]), 'H1'); assert.strictEqual(ids([red, sh]), 'H1'); assert.strictEqual(ids([pr, ch]), 'H2'); assert.strictEqual(ids([rice, pasta]), 'H3'); assert.strictEqual(ids([pot, pot2]), 'H4');
  assert.strictEqual(ids([rice, ch, food(/^خيار/), food(/^زيت زيتون/)]), ''); assert.strictEqual(ids([food(/^بيضة كاملة/), food(/^جبنة قريش/), food(/^خبز عربي صغير$/)]), '');
  assert.strictEqual(ids([fs2, food(/^حليب قليل الدسم/)]), 'S1', 'سمك مع حليب: تفضيل ثقافي ناعم');
  assert.strictEqual(E.mealConflicts(L(fs2, food(/^حليب قليل الدسم/)), D, { fishDairy: false }).length, 0, 'يُعطَّل بيد الأخصائي');
});
t('بلا v2 لا يتغير شيء: نفس الخطة مع وجود D.limits وبدونه', () => {
  const D2 = JSON.parse(JSON.stringify(D)); delete D2.limits;
  for (let i = 0; i < 12; i++) { const c = mk(false); assert.deepStrictEqual(JSON.parse(JSON.stringify(E.planWeek(c, D).days)), JSON.parse(JSON.stringify(E.planWeek(c, D2).days))); }
});
const clients = []; for (let i = 0; i < 160; i++) clients.push(mk(true, i % 10 === 0 ? { allergens: ['حساسية السمك'] } : {}));
const t0 = Date.now(), plans = clients.map(c => E.planWeek(c, D)), ms = (Date.now() - t0) / clients.length, base = clients.map(c => E.planWeek(Object.assign({}, c, { v2: false }), D));
const slots = p => p.days.reduce((a, d) => a.concat(d.slots), []);
t('أداء: توليد أسبوع v2 (' + ms.toFixed(1) + ' مللي ث للعميل)', () => assert(ms < 120, ms));
t('صفر تعارض صلب في كل وجبات v2 (يُعاد حسابه باستقلال)', () => { let m = 0, bad = 0; plans.forEach(p => slots(p).forEach(s => { m++; if (E.mealConflicts(s.lines, D).some(x => x.sev === 'hard')) bad++; })); console.log('   وجبات', m, 'تعارض صلب', bad); assert.strictEqual(bad, 0); });
const lunchClass = (d) => { const s = d.slots.find(x => x.type === 'L'); const l = s && s.lines.filter(q => q.g >= 2 && q.g <= 5).map(q => E.protClass(byName[q.name]))[0]; return l === 'shell' ? 'fish' : l; };
t('جدول الغداء الأسبوعي: لحم أحمر ≤ 3، ولا تكرار متتالٍ لنفس النوع، وسمك مرتان لمن لا يستبعده', () => {
  let red = 0, w = 0, fishOk = 0, fishW = 0, cons = 0, pairs = 0, dist = {};
  plans.forEach((p, i) => { const cls = p.days.map(lunchClass); const cnt = {}; cls.forEach(k => { cnt[k] = (cnt[k] || 0) + 1; dist[k] = (dist[k] || 0) + 1; }); assert((cnt.red || 0) <= 3, 'لحم أحمر ' + cnt.red); w++; red += cnt.red || 0;
    for (let d = 1; d < 7; d++) { pairs++; if (cls[d] && cls[d] === cls[d - 1]) cons++; }
    if (!clients[i].allergens.length) { fishW++; if ((cnt.fish || 0) >= 2) fishOk++; } });
  console.log('   توزيع غداء v2', JSON.stringify(dist), '| تكرار متتالٍ', (100 * cons / pairs).toFixed(1) + '%', '| أسابيع بسمك ≥2:', fishOk + '/' + fishW);
  assert(fishOk / fishW >= 0.9, 'السمك ' + fishOk / fishW); assert(cons / pairs <= 0.1, 'تكرار متتالٍ ' + cons / pairs);
});
t('لحم أحمر حقيقي في الغداء (كان 0.2٪ في المحرك الحالي)', () => { const c = { v2: 0, v1: 0 }; let ln = 0; plans.forEach((p, i) => { p.days.forEach(d => { ln++; if (lunchClass(d) === 'red') c.v2++; }); base[i].days.forEach(d => { if (lunchClass(d) === 'red') c.v1++; }); }); console.log('   لحم أحمر: v1 ' + (100 * c.v1 / ln).toFixed(1) + '% → v2 ' + (100 * c.v2 / ln).toFixed(1) + '%'); assert(c.v2 / ln >= 0.2 && c.v2 / ln <= 0.35); });
t('عميل بحساسية السمك: لا سمك (القشريات حساسية منفصلة)، والجدول يتحول للدجاج واللحم والقشريات', () => plans.forEach((p, i) => { if (!clients[i].allergens.length) return; slots(p).forEach(s => s.lines.forEach(l => { const k = E.protClass(byName[l.name]); assert(k !== 'fish', 'سمك عند حساسية: ' + l.name); })); }));
t('حدود الكمية بحسب الدور والوجبة: لا سطر فوق الحد الأقصى إلا ≤ 0.5٪', () => { let lines = 0, over = 0, v1 = 0, v1l = 0; const cnt = (ps, ov) => ps.forEach(p => slots(p).forEach(s => s.lines.forEach(l => { const f = byName[l.name]; if (!f || l.bank) return; const lm = E.lim(f, s.type, D); ov.l++; if (l.e > lm.max + 1e-9) ov.o++; })));
  const a = { l: 0, o: 0 }, b = { l: 0, o: 0 }; cnt(plans, a); cnt(base, b); console.log('   فوق الحد: v1 ' + (100 * b.o / b.l).toFixed(2) + '% → v2 ' + (100 * a.o / a.l).toFixed(2) + '%'); assert(a.o / a.l <= 0.005, a.o / a.l); });
t('مجموع حصص كل مجموعة في كل وجبة لا يتغير بتمريرة التفصيل', () => { const tot = p => { const o = {}; p.days.forEach((d, di) => d.slots.forEach((s, si) => s.lines.forEach(l => { const k = di + '|' + si + '|' + l.g; o[k] = (o[k] || 0) + l.e; }))); return o; };
  let ch = 0, cmp = 0; for (let i = 0; i < 40; i++) { const p = base[i], before = tot(p); const pl = { client: Object.assign({}, p.client, { v2: true }), days: JSON.parse(JSON.stringify(p.days)) }; E.fitPass(pl, D); const after = tot(pl); Object.keys(before).forEach(k => { cmp++; if (Math.abs((after[k] || 0) - before[k]) > 1e-9) ch++; }); } console.log('   مقارنات', cmp, 'تغيّر', ch); assert.strictEqual(ch, 0); });
t('سمك مع ألبان (تفضيل ثقافي): ينخفض عن المحرك الحالي', () => { const cnt = ps => { let c = 0; ps.forEach(p => slots(p).forEach(s => { if (E.mealConflicts(s.lines, D, { fishDairy: true }).some(x => x.id === 'S1')) c++; })); return c; }; const a = cnt(base), b = cnt(plans); console.log('   وجبات سمك مع ألبان: v1', a, '→ v2', b); assert(b <= a); });
t('البدائل: لا بديل يتجاوز سقف السطر ولا يخلق تعارضاً صلباً', () => { let chk = 0; plans.slice(0, 30).forEach(p => p.days.slice(0, 2).forEach(d => d.slots.forEach(s => s.lines.forEach(l => { if (l.bank) return; E.alternatives(l, s.type, p, D, 8, s.lines).forEach(a => { chk++; const f = byName[a.name]; assert(l.e <= E.lim(f, s.type, D).max + 1e-9, a.name); const rest = s.lines.filter(x => x !== l).concat([{ name: a.name }]); assert(!E.mealConflicts(rest, D).some(x => x.sev === 'hard'), a.name + ' يخلق تعارضاً'); }); })))); console.log('   بدائل مفحوصة', chk); assert(chk > 100); });
console.log('\nنجح', n, 'اختبارات');
