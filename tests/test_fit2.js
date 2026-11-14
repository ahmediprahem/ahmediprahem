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
t('عميل بحساسية السمك: لا سمك ولا قشريات (احتياطاً في v2)، والجدول يتحول للدجاج واللحم', () => { let n2 = 0; plans.forEach((p, i) => { if (!clients[i].allergens.length) return; n2++; slots(p).forEach(s => s.lines.forEach(l => { const k = E.protClass(byName[l.name]); assert(k !== 'fish' && k !== 'shell', 'سمك أو قشريات عند حساسية السمك: ' + l.name); })); }); assert(n2 >= 10, n2); });
t('v1 لا يتغير: القشريات تبقى مسموحة عند حساسية السمك في المحرك الحالي (سلوك قديم محفوظ)', () => { const c = Object.assign(mk(false), { allergens: ['حساسية السمك'], v2: false }), cx = E.ctx(c, D), cx2 = E.ctx(Object.assign({}, c, { v2: true }), D); const shrimp = byName['روبيان (جمبري)']; assert(shrimp && cx.ok(shrimp) && !cx2.ok(shrimp)); });
t('ج2: الغداء لا يقل بروتينه عن min(2، ثلث بروتين اليوم) حصة، ومجموع كل مجموعة في اليوم ثابت', () => {
  let ch = 0, low = 0, days = 0, moved = 0;
  clients.slice(0, 100).forEach(c => { const st = E.state(c, D, {}), cap = E.capScale(st.T.kcal, st.T); for (let d = 0; d < 7; d += 3) { const cap2 = E.capTotals(d, st.meals, D, cap), sol = E.solveDay(st.T, { cap: cap2, sweets: st.sweets, share: E.PREF.share }, D), a = E.allocateDay(sol.counts, d, st.meals, D, cap), b = E.allocateDay(sol.counts, d, st.meals, D, cap, true);
    for (let g = 0; g < 13; g++) { const s1 = a.perSlot.reduce((x, r) => x + r[g], 0), s2 = b.perSlot.reduce((x, r) => x + r[g], 0); if (Math.abs(s1 - s2) > 1e-9) ch++; }
    const L = b.slots.findIndex(s => s.type === 'L'); if (L < 0) continue; const tp = r => r[2] + r[3] + r[4] + r[5], P = b.perSlot.reduce((x, r) => x + tp(r), 0), want = Math.min(2, Math.floor(P / 3)); days++; if (tp(b.perSlot[L]) < want && tp(b.perSlot[L]) < tp(a.perSlot[L]) + 1) low++; if (tp(b.perSlot[L]) > tp(a.perSlot[L])) moved++;
    b.slots.forEach((s, i) => { if ((s.type === 'B' || s.type === 'D') && tp(a.perSlot[i]) >= 1) assert(tp(b.perSlot[i]) >= 1, 'فطور/عشاء بلا بروتين'); }); } });
  console.log('   أيام', days, 'نُقلت حصص للغداء في', moved, 'ومجاميع المجموعات تغيّرت', ch); assert.strictEqual(ch, 0); assert(moved > 0); assert.strictEqual(low, 0); });
t('ج2 نهاية لنهاية: غداء ببروتين أقل من 45 جم ينخفض من نحو 8٪ إلى أقل من 2٪', () => { const sm = ps => { let n3 = 0, k = 0; ps.forEach(p => p.days.forEach(d => { const s = d.slots.find(x => x.type === 'L'); if (!s) return; const e = s.lines.filter(l => l.g >= 2 && l.g <= 5 && !l.bank).reduce((a, l) => a + l.e, 0); n3++; if (e < 1.5 - 1e-9) k++; })); return k / n3; }; const a = sm(base), b = sm(plans); console.log('   غداء < 45 جم: v1 ' + (100 * a).toFixed(1) + '% → v2 ' + (100 * b).toFixed(1) + '%'); assert(a >= 0.05 && b <= 0.02, a + ' ' + b); });
t('حدود الكمية بحسب الدور والوجبة: فوق الحد ≤ 1٪ ولا سطر فوق 1.5× (م1: تجاوز صغير أهون من صنف إضافي في وجبة ممتلئة)', () => { let lines = 0, over = 0, v1 = 0, v1l = 0; const cnt = (ps, ov) => ps.forEach(p => slots(p).forEach(s => s.lines.forEach(l => { const f = byName[l.name]; if (!f || l.bank) return; const lm = E.lim(f, s.type, D); ov.l++; if (l.e > lm.max + 1e-9) ov.o++; if (l.e > lm.max * 1.5 + 1e-9) ov.big = (ov.big || 0) + 1; })));
  const a = { l: 0, o: 0 }, b = { l: 0, o: 0 }; cnt(plans, a); cnt(base, b); console.log('   فوق الحد: v1 ' + (100 * b.o / b.l).toFixed(2) + '% → v2 ' + (100 * a.o / a.l).toFixed(2) + '%'); assert(a.o / a.l <= 0.01, a.o / a.l); assert(!a.big, 'فوق 1.5×: ' + a.big); });
t('مجموع حصص كل مجموعة في كل يوم لا يتغير بتمريرة التفصيل (م1: الفائض قد ينتقل لوجبة أخرى في اليوم نفسه)', () => { const tot = p => { const o = {}; p.days.forEach((d, di) => d.slots.forEach((s, si) => s.lines.forEach(l => { const k = di + '|' + l.g; o[k] = (o[k] || 0) + l.e; }))); return o; };
  let ch = 0, cmp = 0; for (let i = 0; i < 40; i++) { const p = base[i], before = tot(p); const pl = { client: Object.assign({}, p.client, { v2: true }), days: JSON.parse(JSON.stringify(p.days)) }; E.fitPass(pl, D); const after = tot(pl); Object.keys(before).forEach(k => { cmp++; if (Math.abs((after[k] || 0) - before[k]) > 1e-9) ch++; }); } console.log('   مقارنات', cmp, 'تغيّر', ch); assert.strictEqual(ch, 0); });
t('سمك مع ألبان (تفضيل ثقافي): ينخفض عن المحرك الحالي', () => { const cnt = ps => { let c = 0; ps.forEach(p => slots(p).forEach(s => { if (E.mealConflicts(s.lines, D, { fishDairy: true }).some(x => x.id === 'S1')) c++; })); return c; }; const a = cnt(base), b = cnt(plans); console.log('   وجبات سمك مع ألبان: v1', a, '→ v2', b); assert(b <= a); });
t('البدائل: لا بديل يتجاوز سقف السطر ولا يخلق تعارضاً صلباً', () => { let chk = 0; plans.slice(0, 30).forEach(p => p.days.slice(0, 2).forEach(d => d.slots.forEach(s => s.lines.forEach(l => { if (l.bank) return; E.alternatives(l, s.type, p, D, 8, s.lines).forEach(a => { chk++; const f = byName[a.name]; assert(l.e <= E.lim(f, s.type, D).max + 1e-9, a.name); const rest = s.lines.filter(x => x !== l).concat([{ name: a.name }]); assert(!E.mealConflicts(rest, D).some(x => x.sev === 'hard'), a.name + ' يخلق تعارضاً'); }); })))); console.log('   بدائل مفحوصة', chk); assert(chk > 100); });
t('تكرار الغداء المطلوب (freqCheck): المجموع 7، لحم أحمر ≤ 3 مع تحذير مصدره، سمك صفر مع تحذير، وحساسية السمك تحوّل المرات للدجاج', () => {
  const b = { sex: 'أنثى', age: 30, weight: 70, height: 165, activity: D.settings.activity[1][0], goal: D.settings.goals[0][0], meals: 5, conditions: [], allergens: [], keywords: [], love: [], avoid: [] }, chk = (x, extra) => E.freqCheck(Object.assign({}, b, extra || {}, { freq: x }), D), sum = r => r.freq.poultry + r.freq.red + r.freq.fish;
  let r = chk({ poultry: 3, red: 2, fish: 2 }); assert.strictEqual(sum(r), 7); assert.strictEqual(r.warns.length, 0);
  r = chk({ poultry: 1, red: 5, fish: 1 }); assert.strictEqual(r.freq.red, 3); assert.strictEqual(sum(r), 7); assert(r.warns.some(w => w.src === 'WCRF'));
  r = chk({ poultry: 7, red: 0, fish: 0 }); assert(r.warns.some(w => /DGA/.test(w.src || '')));
  r = chk({ poultry: 2, red: 2, fish: 1 }); assert.strictEqual(sum(r), 7); assert(r.warns.some(w => /المجموع 5/.test(w.msg)));
  r = chk({ poultry: 3, red: 2, fish: 2 }, { allergens: ['حساسية السمك'] }); assert.strictEqual(r.freq.fish, 0); assert.strictEqual(sum(r), 7); assert(r.warns.some(w => /غير متاح/.test(w.msg)));
  const sch = E.weekSchedule(Object.assign({}, b, { v2: true, freq: { poultry: 3, red: 2, fish: 2 } }), D); assert.deepStrictEqual(r.sched.length, 7); assert.strictEqual(sch.length, 7);
});
t('مع السماح بوجبات البنك: v2 يحترم جدول الغداء والتعارض الصلب أيضاً (وجبات البنك تُصفّى)', () => {
  let m = 0, bad = 0, bankMeals = 0, off = 0, days = 0;
  for (let i = 0; i < 80; i++) { const c = mk(true, { noBank: {}, freq: { poultry: 3, red: 2, fish: 2 }, allergens: [] }), p = E.planWeek(c, D), sch = E.weekSchedule(c, D);
    p.days.forEach((d, di) => { d.slots.forEach(s => { m++; if (s.meal) bankMeals++; if (E.mealConflicts(s.lines, D).some(x => x.sev === 'hard')) bad++; }); const L = d.slots.find(x => x.type === 'L'), l = L && L.lines.filter(q => q.g >= 2 && q.g <= 5).map(q => E.protClass(byName[q.name])).map(k => k === 'shell' ? 'fish' : k)[0]; if (l && sch) { days++; if (l !== sch[di]) off++; } }); }
  console.log('   وجبات', m, 'منها من البنك', bankMeals, '| تعارض صلب', bad, '| غداء يخالف الجدول', off + '/' + days); assert(bankMeals > 50, 'يجب أن تظهر وجبات بنك لهذا الاختبار'); assert.strictEqual(bad, 0); assert(off / days <= 0.03, off / days);
});
console.log('\nنجح', n, 'اختبارات');
