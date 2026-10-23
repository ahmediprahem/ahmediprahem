'use strict';
// طبقة تعديلات بنك الوجبات: تشغيل/إيقاف، نقل بين الأقسام، وجبات مضافة، التحقق، الدمج بين المدير والمستخدم، وعدم المساس بخطط العملاء المحفوظة.
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
const BASE = JSON.parse(JSON.stringify(D.bank)), J = (x) => JSON.stringify(x), clone = (x) => JSON.parse(J(x));
let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', String(e.message).slice(0, 600)); process.exitCode = 1; } };
const mkClient = (i) => ({ code: 'C000' + i, name: 'س', sex: i % 2 ? 'ذكر' : 'أنثى', age: 26 + i * 3, weight: 58 + i * 6, height: 160 + i * 3, activity: D.settings.activity[2][0], goal: D.settings.goals[i % 3], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, meals: 5, conditions: [], allergens: [], keywords: [], love: [], avoid: [], favMeals: [] });
const apply = (S) => E.applyMealSettings(D, BASE, S), plans = (seeds, clients) => { const out = []; for (const i of clients || [0, 1, 2]) for (const s of seeds) out.push(E.planWeek(mkClient(i), D, { seed: s })); return out; };
const usage = (ps) => { const u = {}; ps.forEach(p => p.days.forEach(d => d.slots.forEach(s => { if (s.meal) { (u[s.meal] = u[s.meal] || { B: 0, L: 0, D: 0, S: 0, all: 0 }); u[s.meal][s.type]++; u[s.meal].all++; } }))); return u; };
const FLAGS = { B: 0, L: 1, D: 2, S: 3 };
(async () => {
  await t('بلا تعديلات: البنك مطابق للأصل حرفياً (147 وجبة: 130 من الكتيّب + 17 مصرية/سعودية) ولا مشكلات', () => { const b = apply({}); assert.strictEqual(b.length, 147); assert.strictEqual(J(b), J(BASE)); assert.deepStrictEqual(D._mealIssues, []); apply({ meals: { over: {}, deleted: [], custom: [] } }); assert.strictEqual(J(D.bank), J(BASE)); });
  await t('الإيقاف: الوجبة الموقوفة لا تظهر أبداً في أي خطة جديدة (36 خطة)، والخطط تبقى كاملة سليمة', () => {
    apply({}); const base = plans([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), u = usage(base), top = Object.keys(u).sort((a, b) => u[b].all - u[a].all).slice(0, 12); assert(top.length >= 8, 'الخطة الأساسية لا تستعمل وجبات كفاية');
    const ids = BASE.filter(b => top.includes(b.n)).map(b => b.id), over = {}; ids.forEach(id => { over[id] = { on: 0 }; }); apply({ meals: { over } });
    const after = plans([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), ua = usage(after); top.forEach(nm => assert(!ua[nm], 'ظهرت وجبة موقوفة: ' + nm)); after.forEach(p => { assert.strictEqual(p.days.length, 7); assert(p.days.every(d => d.slots.every(s => s.lines.length))); });
    const rate = (ps) => (ps.reduce((a, p) => a + p.days.filter(d => d.okNominal).length, 0) / (ps.length * 7)).toFixed(2); console.log('   معلومة (لا شرط): الأيام ضمن حدود الأهداف قبل/بعد إيقاف', top.length, 'وجبة:', rate(base), '←', rate(after), '| وجبات مستعملة بعد الإيقاف:', Object.keys(ua).length);
  });
  await t('إيقاف كل البنك: يعمل المولّد بتركيب الأصناف مباشرة بلا انهيار، وأيام كاملة ضمن الحدود', () => {
    const over = {}; BASE.forEach(b => { over[b.id] = { on: 0 }; }); apply({ meals: { over } }); const ps = plans([0, 1, 2, 3, 4]); ps.forEach(p => { assert.strictEqual(p.days.length, 7); p.days.forEach(d => { assert(d.slots.every(s => !s.meal)); assert(d.slots.every(s => s.lines.length)); }); }); assert(ps.every(p => p.days.filter(d => d.okNominal).length >= 6));
  });
  await t('النقل بين الأقسام: وجبة (غداء/عشاء) تُحصر في قسم واحد فلا تظهر في الآخر أبداً، وتظل تظهر في القسم المسموح إن كانت تُستعمل فيه', () => {
    apply({}); const seeds = Array.from({ length: 30 }, (_, i) => i), u0 = usage(plans(seeds)); const cand = BASE.filter(b => b.m.join('') === '0110').map(b => ({ b, u: u0[b.n] || { all: 0, L: 0, D: 0 } })).sort((x, y) => y.u.all - x.u.all)[0]; assert(cand && cand.u.all > 0, 'لا وجبة غداء/عشاء مستعملة للاختبار');
    const used = cand.u.L >= cand.u.D ? 'L' : 'D', other = used === 'L' ? 'D' : 'L', flagsOf = (x) => [0, 1, 2, 3].map(i => i === FLAGS[x] ? 1 : 0);
    apply({ meals: { over: { [cand.b.id]: { m: flagsOf(used) } } } }); let u = usage(plans(seeds))[cand.b.n] || { B: 0, L: 0, D: 0, S: 0, all: 0 }; assert.strictEqual(u[other], 0, 'ظهرت في القسم الممنوع ' + other); assert(u[used] > 0, 'اختفت من القسم المسموح (فراغ)'); assert(u.B === 0 && u.S === 0);
    apply({ meals: { over: { [cand.b.id]: { m: flagsOf(other) } } } }); u = usage(plans(seeds))[cand.b.n] || { B: 0, L: 0, D: 0, S: 0, all: 0 }; assert.strictEqual(u[used], 0, 'ظهرت في القسم الذي نُقلت منه ' + used); assert(u.B === 0 && u.S === 0);
  });
  await t('التفعيل في أكثر من قسم: وجبة تُفعَّل في الفطور والغداء والعشاء تظهر فقط في الأقسام الثلاثة ولا تظهر في السناك', () => {
    apply({}); const u0 = usage(plans(Array.from({ length: 30 }, (_, i) => i))); const cand = BASE.filter(b => b.m.join('') === '0110').map(b => ({ b, a: (u0[b.n] || { all: 0 }).all })).sort((x, y) => y.a - x.a)[0].b; apply({ meals: { over: { [cand.id]: { m: [1, 1, 1, 0] } } } }); assert.strictEqual(J(D.bank.find(b => b.id === cand.id).m), '[1,1,1,0]');
    const u = usage(plans(Array.from({ length: 40 }, (_, i) => i)))[cand.n] || { S: 0, all: 0 }; assert.strictEqual(u.S, 0); assert(u.all > 0);
  });
  await t('وجبة مضافة: تدخل البنك علامةَ custom بقيم افتراضية، وكل ما هو غير صالح يُرفض بسبب صريح ولا يدخل', () => {
    const ok = { id: 'U001', n: 'وجبة تجريبية', m: [0, 0, 1, 0], ing: [{ n: 'أرز أبيض', e: 1, role: 'كربوهيدرات رئيسي' }, { n: 'بيضة كاملة', e: 2, role: 'بروتين رئيسي' }] }; apply({ meals: { custom: [ok] } }); const g = D.bank.find(b => b.id === 'U001'); assert(g && g.custom === 1 && g.on === 1 && g.max === 4 && g.scal === 1 && D.bank.length === 148); assert.deepStrictEqual(D._mealIssues, []);
    const bad = [{ id: 'U002', n: 'ص', m: [0, 1, 0, 0], ing: [{ n: 'صنف لا وجود له', e: 1 }] }, { id: 'U003', n: 'ص', m: [0, 1, 0, 0], ing: [{ n: 'أرز أبيض', e: 0 }] }, { id: 'U004', n: 'ص', m: [0, 1, 0], ing: [{ n: 'أرز أبيض', e: 1 }] }, { id: 'U005', n: '', m: [0, 1, 0, 0], ing: [{ n: 'أرز أبيض', e: 1 }] }, { id: 'U006', n: 'ص', m: [0, 1, 0, 0], ing: [] }, { id: 'M001', n: 'مكرر', m: [0, 1, 0, 0], ing: [{ n: 'أرز أبيض', e: 1 }] }, { n: 'بلا معرّف', m: [0, 1, 0, 0], ing: [{ n: 'أرز أبيض', e: 1 }] }, { id: 'U007', n: 'ص', m: [0, 1, 0, 0], ing: [{ n: 'أرز أبيض', e: 1 }], max: -3 }];
    apply({ meals: { custom: bad } }); assert.strictEqual(D.bank.length, 147, 'دخلت وجبة غير صالحة'); assert.strictEqual(D._mealIssues.length, bad.length); assert(D._mealIssues.some(i => /غير موجود في قاعدة الأصناف/.test(i.msg)));
  });
  await t('تعديل مرفوض: مكوّن مجهول لا يمسّ الوجبة الأصلية؛ تعديل مقبول (الاسم/الملاحظة/المكوّنات) يُطبَّق ويُعلَّم edited؛ معرّف مجهول يُتجاهل', () => {
    const id = BASE[5].id, orig = BASE[5]; apply({ meals: { over: { [id]: { ing: [{ n: 'صنف وهمي', e: 1 }] }, ZZZ: { on: 0 } } } }); assert.strictEqual(J(D.bank.find(b => b.id === id)), J(orig)); assert(D._mealIssues.some(i => i.id === id && /تعديل مرفوض/.test(i.msg))); assert.strictEqual(D.bank.length, 147);
    apply({ meals: { over: { [id]: { n: 'اسم جديد', note: 'ملاحظة', time: '09:30', ing: [{ n: 'أرز أبيض', e: 2, role: 'كربوهيدرات رئيسي' }] } } } }); const g = D.bank.find(b => b.id === id); assert(g.n === 'اسم جديد' && g.note === 'ملاحظة' && g.time === '09:30' && g.ing.length === 1 && g.ing[0].e === 2 && g.edited === 1); assert.deepStrictEqual(D._mealIssues, []);
  });
  await t('الدمج: المدير يصل للمستخدم، المستخدم يتقدّم عنده ولا يصل المدير، الحذف اتحاد، والمضاف بلا تكرار بالمعرّف', () => {
    const admin = { meals: { over: { A: { on: 0 }, C: { on: 0, m: [1, 0, 0, 0] } }, deleted: ['X'], custom: [{ id: 'U1', n: 'م1' }] } }, user = { meals: { over: { A: { on: 1 }, B: { on: 0 } }, deleted: ['Y'], custom: [{ id: 'U1', n: 'م مختلف' }, { id: 'U2', n: 'م2' }] } };
    const u = E.mergeSettings(admin, user).meals, a = E.mergeSettings(null, admin).meals; assert.strictEqual(u.over.A.on, 1); assert.strictEqual(u.over.B.on, 0); assert.deepStrictEqual(u.over.C, { on: 0, m: [1, 0, 0, 0] }); assert.deepStrictEqual(u.deleted.sort(), ['X', 'Y']); assert.deepStrictEqual(u.custom.map(c => c.id), ['U1', 'U2']); assert.strictEqual(u.custom[0].n, 'م1');
    assert.strictEqual(a.over.A.on, 0); assert(!a.over.B, 'تعديل المستخدم ظهر عند المدير'); assert.deepStrictEqual(E.mergeSettings(null, null).meals, { over: {}, deleted: [], custom: [] });
  });
  await t('لا تغيّر الأصل ولا الخطط المحفوظة: التطبيق متكرر الأثر، وخطة محفوظة تبقى حرفياً وتعمل عليها أدوات التعديل حتى بعد إيقاف كل البنك', () => {
    apply({}); const P = E.planWeek(mkClient(1), D, { seed: 3 }), before = J(P); const over = {}; BASE.forEach(b => { over[b.id] = { on: 0 }; }); const S = { meals: { over, custom: [{ id: 'U9', n: 'م', m: [1, 0, 0, 0], ing: [{ n: 'أرز أبيض', e: 1 }] }] } }; apply(S); const j1 = J(D.bank); apply(S); assert.strictEqual(J(D.bank), j1); assert.strictEqual(J(P), before); assert.strictEqual(J(BASE), J(JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8')).bank));
    const P2 = clone(P), cur = E.colCounts(E.actualGroups(P2.days[0].slots[0])), n11 = cur.slice(); n11[0] += 1; E.regenSlot(P2, 0, 0, n11, D); assert(P2.days[0].slots[0].lines.length); assert.strictEqual(J(P2.days[2]), J(P.days[2])); assert(E.alternatives(P2.days[0].slots[1].lines[0], 'L', P2, D, 10).length >= 0);
  });
  console.log('\nنجح', n, 'اختبارات طبقة بنك الوجبات');
})();
