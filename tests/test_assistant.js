'use strict';
// نواة المساعد dt/hamed: السيناريوهات الاثنا عشر المطلوبة + المخطط المسموح + المحلل المحلي + الخصوصية. كلها على المحرك الحقيقي وبيانات التطبيق.
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), A = require('../src/assistant.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
A.bind(E, D); let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', String(e.message).slice(0, 700)); process.exitCode = 1; } };
const mkClient = (i, over) => Object.assign({ code: 'C000' + i, name: 'سارة محمد', phone: '0501234567', sex: i % 2 ? 'ذكر' : 'أنثى', age: 26 + i * 3, weight: 58 + i * 6, height: 160 + i * 3, activity: D.settings.activity[2][0], goal: D.settings.goals[i % 3], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, meals: 5, conditions: [], allergens: [], keywords: [], love: [], avoid: [], favMeals: [] }, over || {});
const ses = (c, plan) => ({ client: c, plan }), approve = (p) => A.mintApproval(p), J = (x) => JSON.stringify(x), clone = (x) => JSON.parse(J(x));
const hasRiceAt = (plan, type) => plan.days.some(d => d.slots.some(s => s.type === type && s.lines.some(l => /^أرز/.test(l.name))));
function find(pred) { for (let i = 0; i < 6; i++) for (let s = 0; s < 40; s++) { const c = mkClient(i), p = E.planWeek(c, D, { seed: s }); if (pred(p)) return { c, p }; } throw new Error('لم أجد خطة مناسبة'); }
const slotType = (plan, ch) => plan.days[ch.day].slots[ch.slot].type;
(async () => {
  // ================= المخطط المسموح (لا يُنفَّذ إلا ما في القائمة)
  await t('المخطط: أنواع مجهولة وحقول خطرة وقيم خارج النطاق تُرفض، والحقول الزائدة تُحذف', () => {
    for (const bad of [null, 'x', [], {}, { type: 'run_js', code: 'alert(1)' }, { type: 'delete_all' }, { type: 'replace_food' }, { type: 'replace_food', from: 'x'.repeat(200) }, { type: 'replace_food', from: 'رز', meal: 'Z' }, { type: 'replace_food', from: 'رز', days: [9] }, { type: 'assign_foods', meal: 'D', days: [0], assignments: [{ group: 'hack', foods: ['a'] }] }, { type: 'set_group_total', group: 'milk', perDay: 99 }, { type: 'set_group_total', group: 'milk', perDay: 1.3 }, { type: 'set_group_total', group: 'starch', perDay: 1 }, { type: 'move_exchanges', group: 'milk', to: 'D' }, { type: 'move_exchanges', group: 'starch', to: 'D', amount: 7 }, { type: 'adapt_for_condition' }])
      assert.strictEqual(A.validateAction(bad).ok, false, J(bad));
    const v = A.validateAction({ type: 'replace_food', from: 'الرز', meal: 'D', days: [2, 0, 2], __proto__: { x: 1 }, sql: "DROP TABLE x", to: 'auto' }); assert(v.ok); assert.deepStrictEqual(Object.keys(v.action).sort(), ['days', 'from', 'meal', 'to', 'type']); assert.deepStrictEqual(v.action.days, [0, 2]);
    assert(A.validateAction({ type: 'move_exchanges', group: 'starch', to: 'D', days: [1] }).ok); assert(A.validateAction({ type: 'set_group_total', group: 'milk', perDay: 1, subgroup: 'full' }).ok);
  });
  // ================= 1) استبدال الأرز بصنف معتمد من المجموعة نفسها
  await t('1) استبدال الأرز في الغداء: أصناف من المجموعة نفسها وبعدد الحصص نفسه، لا أرز آخر ولا «حليب الأرز»، وبقية الوجبات حرفياً كما هي', () => {
    const { c, p: plan } = find(pl => hasRiceAt(pl, 'L')), before = clone(plan), prop = A.propose({ type: 'replace_food', from: 'الرز', meal: 'L' }, ses(c, plan));
    assert(prop.ok && prop.kind === 'change' && prop.canApply, J(prop).slice(0, 300)); assert(prop.changes.length >= 1);
    prop.changes.forEach(ch => { assert.strictEqual(slotType(plan, ch), 'L'); assert(/^أرز/.test(ch.before.name)); assert(!/^أرز|^حليب/.test(ch.after.name), ch.after.name); assert.strictEqual(ch.after.e, ch.before.e); assert(E.POOLS[ch.before.g].includes(ch.after.g)); });
    assert.strictEqual(J(plan), J(before), 'الاقتراح غيّر الخطة الأصلية'); const ap = A.apply(prop, ses(c, plan), approve(prop)); assert(ap.ok, J(ap));
    const touched = new Set(prop.touched); ap.plan.days.forEach((d, di) => d.slots.forEach((s, k) => { if (!touched.has(di + ':' + k)) assert.strictEqual(J(s), J(before.days[di].slots[k]), 'تغيّرت وجبة غير معتمدة ' + di + ':' + k); })); touched.forEach(x => assert.strictEqual(plan.days[+x.split(':')[0]].slots[+x.split(':')[1]].type, 'L'));
  });
  await t('1ب) خاصية: عبر 36 خطة لا يُقترح أبداً صنف مشروب بدل الأرز ولا أرز بدل أرز', () => {
    let cnt = 0; for (let i = 0; i < 6; i++) for (let s = 0; s < 6; s++) { const c = mkClient(i), plan = E.planWeek(c, D, { seed: s }), p = A.propose({ type: 'replace_food', from: 'رز' }, ses(c, plan)); if (!p.changes || !p.changes.length) continue; cnt += p.changes.length; p.changes.forEach(ch => { assert(!/^حليب|^عصير/.test(ch.after.name), ch.after.name); assert(!/^أرز/.test(ch.after.name)); assert.strictEqual(A.kindOf(D.foods.find(f => f.n === ch.after.name)), 'solid'); }); }
    assert(cnt > 30, 'عدد الاستبدالات المفحوصة ' + cnt);
  });
  // ================= 2) تعديل العشاء في أيام محددة دون المساس بغيره (+ سلسلة نقل الحصص)
  await t('2) عشاء بتوست أيام محددة: حين لا توجد نشويات في العشاء يقترح نقل حصة بدل الطريق المسدود، وبعد اعتماد النقل ينجح الإسناد ولا تتغير الوجبات الأخرى', () => {
    const { c, p: plan0 } = find(pl => [2, 4].every(d => !pl.days[d].slots.some(s => s.type === 'D' && s.lines.some(l => l.g === 0))) && pl.days[0].slots.some(s => s.type === 'D' && s.lines.some(l => l.g === 0))); let plan = plan0;
    const act = { type: 'assign_foods', meal: 'D', days: [0, 2, 4], assignments: [{ group: 'starch', foods: ['توست'] }] }; let p = A.propose(act, ses(c, plan));
    assert(p.issues.some(i => i.code === 'NO_LINES'), 'لم يُبلَّغ عن غياب النشويات'); assert(p.suggestions.length === 1 && p.suggestions[0].action.type === 'move_exchanges' && p.suggestions[0].action.to === 'D', J(p.suggestions));
    const mv = A.propose(p.suggestions[0].action, ses(c, plan)); assert(mv.canApply, J(mv.issues));
    mv.days.forEach(dd => { assert.deepStrictEqual(dd.after.nominal, dd.before.nominal, 'نقل الحصص غيّر المجاميع الاسمية'); }); const sums0 = A.groupSums(plan); let ap = A.apply(mv, ses(c, plan), approve(mv)); assert(ap.ok); plan = ap.plan; const sums1 = A.groupSums(plan); [2, 4].forEach(d => assert.strictEqual(sum(sums1[d]), sum(sums0[d]), 'تغيّر مجموع حصص اليوم')); function sum(a) { return a.reduce((x, y) => x + y, 0); }
    const before = clone(plan); p = A.propose(act, ses(c, plan)); assert(!p.issues.some(i => i.severity === 'blocking'), J(p.issues)); assert(p.canApply && p.changes.length === 3); p.changes.forEach(ch => { assert.strictEqual(slotType(plan, ch), 'D'); assert.strictEqual(ch.after.name, 'خبز توست'); });
    ap = A.apply(p, ses(c, plan), approve(p)); assert(ap.ok); ap.plan.days.forEach((d, di) => d.slots.forEach((s, k) => { if (!(p.touched.includes(di + ':' + k))) assert.strictEqual(J(s), J(before.days[di].slots[k])); }));
    [1, 3, 5, 6].forEach(d => assert.strictEqual(J(ap.plan.days[d]), J(before.days[d]), 'تغيّر يوم لم يُطلب: ' + d));
    [0, 2, 4].forEach(d => assert.strictEqual(sum(A.groupSums(ap.plan)[d].slice(0, 1)), sum(A.groupSums(before)[d].slice(0, 1)), 'تغيّر عدد حصص النشويات'));
  });
  await t('2ب) بيض وسلطة وجبن في العشاء: ما يخالف قواعد الوجبة يُرفض بسبب صريح، والإسناد المسموح يُنفَّذ ويُنبَّه إلى تغيّر مستويات الدهون', () => {
    const { c, p: plan } = find(pl => [1, 3].every(d => pl.days[d].slots.some(s => s.type === 'D' && s.lines.some(l => l.g >= 2 && l.g <= 5) && s.lines.some(l => l.g === 9)))), p = A.propose({ type: 'assign_foods', meal: 'D', days: [1, 3], assignments: [{ group: 'meat', foods: ['بيض', 'جبنة قريش'] }, { group: 'veg', foods: ['سلطة'] }] }, ses(c, plan));
    assert(p.canApply); assert(p.changes.some(ch => ch.after.name === 'بيضة كاملة')); assert(p.issues.some(i => i.code === 'NOT_EQUIVALENT' && /غير مسموح به في وجبة العشاء/.test(i.message_ar)), 'جبنة قريش غير مسموحة في العشاء بحسب القاعدة ويجب تعليل ذلك'); assert(p.issues.some(i => i.code === 'GROUP_COUNTS_SHIFTED'));
  });
  // ================= 3) خفض الحليب وإعادة التوزيع
  await t('3) حليب كامل الدسم حصة واحدة يومياً: الحليب نفسه، مجموع الألبان 1 كل يوم، والمجاميع ضمن الحدود أو يُحذَّر لكل يوم يخرج، وزمن معقول', () => {
    const t0 = Date.now(); let days = 0, ok = 0; for (const i of [0, 1, 2, 3]) {
      const c = mkClient(i), plan = E.planWeek(c, D, { seed: i }), p = A.propose({ type: 'set_group_total', group: 'milk', perDay: 1, subgroup: 'full' }, ses(c, plan)); assert(p.canApply, J(p.issues)); const ap = A.apply(p, ses(c, plan), approve(p)); assert(ap.ok, J(ap));
      ap.plan.days.forEach((d, di) => { assert.strictEqual(d.got[6] + d.got[7] + d.got[8], 1, 'مجموع الألبان ' + d.got.slice(6, 9)); assert.strictEqual(d.got[8], 1); const names = d.slots.flatMap(s => s.lines.filter(l => l.g === 8).map(l => l.name)); assert.deepStrictEqual(names, ['حليب كامل الدسم']); days++; if (d.okNominal) ok++; else assert(p.issues.some(x => x.severity === 'warn' && x.message_ar.includes(D.days[di])), 'يوم خارج الحدود بلا تحذير: ' + D.days[di]); });
    }
    console.log('   أيام ضمن الحدود:', ok + '/' + days, '| زمن 4 عملاء:', Date.now() - t0, 'ms'); assert(ok / days >= 0.85, 'نسبة الأيام ضمن الحدود ' + ok / days); assert(Date.now() - t0 < 15000);
  });
  // ================= 4) خطة أسبوعية تحترم التوزيع الموصوف
  await t('4) خطة أسبوعية جديدة: 7 أيام، حصص كل يوم مطابقة لما حسبه المحرك، لا تُطبَّق قبل الاعتماد', () => {
    const c = mkClient(1), plan = E.planWeek(c, D, { seed: 1 }), before = J(plan), p = A.propose({ type: 'generate_week', seed: 77 }, ses(c, plan)); assert(p.canApply && p.plan2.days.length === 7); assert.strictEqual(J(plan), before);
    p.plan2.days.forEach((d, i) => { assert.deepStrictEqual(A.groupSums(p.plan2)[i], d.counts.map(x => x), 'حصص اليوم ≠ المحسوبة ' + i); assert(d.okNominal, 'يوم خارج الحدود'); }); assert.strictEqual(A.apply(p, ses(c, plan), null).code, 'APPROVAL_INVALID');
  });
  // ================= 5) قيمة حصة مجهولة
  await t('5) صنف بقيمة حصة ناقصة أو مجهولة يُرفض كبديل برسالة تطلب المراجعة (لا تخمين)', () => {
    const D2 = clone(D); D2.foods.push({ n: 'صنف تجريبي ناقص', g: 0, us: 'حبة', up: 'حبات', upe: 0, gpe: 0, units: 0, exv: 0, mac: [15, 3, 0], cooked: '', m: [1, 1, 1, 1], veg: 1, vegan: 1, on: 1, gi: null, o: 99 }); D2._by = null; A.bind(E, D2);
    try { const { c, p: plan } = find(pl => hasRiceAt(pl, 'L')), p = A.propose({ type: 'replace_food', from: 'الرز', to: 'صنف تجريبي ناقص', meal: 'L' }, ses(c, plan)); assert.strictEqual(p.kind, 'info'); assert(p.noChange); assert(p.issues.some(i => i.code === 'NOT_EQUIVALENT' && /غير معروفة|ناقصة/.test(i.message_ar)), J(p.issues)); assert(!A.validExchange(D2.foods[D2.foods.length - 1]));
      const p2 = A.propose({ type: 'replace_food', from: 'الرز', to: 'شيء لا وجود له', meal: 'L' }, ses(c, plan)); assert.strictEqual(p2.code, 'FOOD_NOT_FOUND'); } finally { A.bind(E, D); }
  });
  // ================= 6) التعارض يُسأل عنه
  await t('6) طلبات متعارضة: تُكتشف ويُطرح سؤال توضيح بدل التنفيذ، والطلبات المتوافقة تمر', () => {
    const r = (to) => ({ type: 'replace_food', from: 'رز', to, meal: 'D' }), cf = A.checkConflicts;
    assert(cf([r('توست'), r('برغل')]).conflict); assert(!cf([r('توست'), r('توست')]).conflict); assert(cf([{ type: 'set_group_total', group: 'milk', perDay: 1 }, { type: 'set_group_total', group: 'milk', perDay: 2 }]).conflict);
    assert(cf([{ type: 'assign_foods', meal: 'D', days: [0], assignments: [{ group: 'starch', foods: ['توست'] }] }, { type: 'assign_foods', meal: 'D', days: [0, 1], assignments: [{ group: 'starch', foods: ['برغل'] }] }]).conflict);
    const g = cf([{ type: 'generate_week' }, r('توست')]); assert(g.conflict && /الخطة الجديدة ستلغي/.test(g.clarify_ar)); assert(!cf([{ type: 'assign_foods', meal: 'D', days: [0], assignments: [{ group: 'starch', foods: ['توست'] }] }, { type: 'assign_foods', meal: 'D', days: [1], assignments: [{ group: 'meat', foods: ['بيض'] }] }]).conflict);
  });
  // ================= 7) الرفض يحفظ الخطة، والاعتماد لا يصدر إلا من الواجهة
  await t('7) الرفض/عدم الاعتماد لا يغيّر الخطة؛ وبلا اعتماد صالح أو بعد انتهائه أو تغيّر الخطة أو العبث بالمقترح لا يُنفَّذ شيء', () => {
    const { c, p: plan } = find(pl => hasRiceAt(pl, 'L')), h0 = A.hash(plan), p = A.propose({ type: 'replace_food', from: 'الرز', meal: 'L' }, ses(c, plan)); assert.strictEqual(A.hash(plan), h0);
    assert.strictEqual(A.apply(p, ses(c, plan), null).code, 'APPROVAL_INVALID'); assert.strictEqual(A.apply(p, ses(c, plan), { pid: 'x', hash: p.hash, exp: Date.now() + 1e5 }).code, 'APPROVAL_INVALID'); assert.strictEqual(A.apply(p, ses(c, plan), { pid: p.id, hash: 'bad', exp: Date.now() + 1e5 }).code, 'APPROVAL_INVALID');
    assert.strictEqual(A.apply(p, ses(c, plan), A.mintApproval(p, -1000)).code, 'PROPOSAL_EXPIRED'); const moved = clone(plan); moved.days[3].slots[0].lines[0].e += 1; assert.strictEqual(A.apply(p, ses(c, moved), approve(p)).code, 'PLAN_CHANGED');
    const t2 = Object.assign({}, p, { plan2: clone(p.plan2) }); t2.plan2.days[5].slots[0].lines[0].name = 'عبث'; assert.strictEqual(A.apply(t2, ses(c, plan), approve(p)).code, 'PROPOSAL_TAMPERED'); assert.strictEqual(A.hash(plan), h0);
    const t3 = Object.assign({}, p, { touched: [] }); assert.strictEqual(A.apply(t3, ses(c, plan), approve(t3)).code, 'SCOPE_VIOLATION');
  });
  // ================= 8) المجاميع تُحدَّث بعد الاعتماد
  await t('8) بعد الاعتماد: مجاميع الأيام المتأثرة تساوي إعادة الحساب من الصفر وما عُرض في المعاينة', () => {
    const { c, p: plan } = find(pl => hasRiceAt(pl, 'L')), p = A.propose({ type: 'replace_food', from: 'الرز', meal: 'L' }, ses(c, plan)), ap = A.apply(p, ses(c, plan), approve(p)); assert(ap.ok);
    p.days.forEach(dd => { const fresh = clone(ap.plan.days[dd.day]); E.dayStats(fresh, ap.plan.targets, D); assert.deepStrictEqual(fresh.nominal, ap.plan.days[dd.day].nominal); assert.deepStrictEqual(fresh.actual.slice(0, 3), ap.plan.days[dd.day].actual.slice(0, 3)); assert.deepStrictEqual(dd.after.nominal, ap.plan.days[dd.day].nominal.map(x => Math.round(x * 10) / 10)); });
    assert.deepStrictEqual(A.groupSums(ap.plan).map(r => r.reduce((a, b) => a + b, 0)), A.groupSums(plan).map(r => r.reduce((a, b) => a + b, 0)), 'استبدال الصنف غيّر مجموع الحصص');
  });
  // ================= 9) فشل الاتصال/الحصة لا يعطّل التطبيق
  await t('9) الذكاء الاصطناعي: نفاد الحصة وانقطاع الشبكة والمهلة والرد غير الصالح أو الخارج عن القائمة تعود جميعها إلى الفهم المحلي، والمحرك يعمل', async () => {
    const c = mkClient(1), plan = E.planWeek(c, D, { seed: 1 }), S = ses(c, plan), cfg = (o) => Object.assign({ url: 'https://x.workers.dev', token: 't', consent: true, timeoutMs: 40 }, o), res = (status, body) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => { if (body === 'BAD') throw new Error('bad'); return body; } });
    const cases = [['AI_QUOTA', res(429, {})], ['AI_QUOTA', res(503, {})], ['AI_AUTH', res(401, {})], ['AI_HTTP', res(500, {})], ['AI_INVALID', res(200, 'BAD')], ['AI_INVALID', res(200, { actions: [{ type: 'run_js', code: 'x' }] })], ['AI_INVALID', res(200, { actions: [] })], ['AI_OFFLINE', async () => { throw new TypeError('Failed to fetch'); }], ['AI_TIMEOUT', (u, o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))))]];
    for (const [code, f] of cases) { const r = await A.remote.call(cfg(), 'نوّع الأصناف', S, f); assert.strictEqual(r.code, code, code + ' ← ' + J(r)); const it = await A.interpret('نوّع الأصناف', S, { ai: cfg(), fetch: f }); assert.strictEqual(it.source, 'local'); assert.deepStrictEqual(it.actions, [{ type: 'improve_variety' }]); assert(it.notice_ar && it.notice_ar.length > 10); const p = A.propose(it.actions[0], S); assert(p.ok, 'المحرك تعطّل بعد فشل الذكاء الاصطناعي'); }
    const good = await A.interpret('خلّ الحليب حصة', S, { ai: cfg(), fetch: res(200, { actions: [{ type: 'set_group_total', group: 'milk', perDay: 1, subgroup: 'full', evil: 'x' }], clarify: '' }) }); assert.strictEqual(good.source, 'ai'); assert.deepStrictEqual(Object.keys(good.actions[0]).sort(), ['days', 'group', 'perDay', 'subgroup', 'type']);
    const noConsent = await A.interpret('نوّع الأصناف', S, { ai: cfg({ consent: false }), fetch: async () => { throw new Error('يجب ألا يُستدعى'); } }); assert.strictEqual(noConsent.source, 'local'); const off = await A.interpret('نوّع الأصناف', S, { ai: cfg(), online: false, fetch: async () => { throw new Error('يجب ألا يُستدعى'); } }); assert.strictEqual(off.source, 'local');
  });
  // ================= 10) المفاتيح والخصوصية
  await t('10) الخصوصية: الاسم والجوال والرمز والبريد تُزال، والحمولة لا تحوي بيانات عميل ولا خطة، ولا مفاتيح في ملفات التطبيق والوسيط', () => {
    const c = mkClient(1), plan = E.planWeek(c, D, { seed: 1 }), pl = A.remote.payload('بدّل الرز في عشاء سارة محمد (C0001) جوالها 0501234567 وبريدها sara@mail.com', ses(c, plan)), s = J(pl);
    for (const leak of ['سارة', 'محمد', '0501234567', 'C0001', 'sara@mail.com']) assert(!s.includes(leak), 'تسرّب: ' + leak); assert.deepStrictEqual(Object.keys(pl).sort(), ['lang', 'text', 'v', 'vocab']); assert(!/plan|client|weight|age|conditions|allergens/i.test(Object.keys(pl.vocab).join(',')));
    assert(!s.includes('"days":[{') && s.length < 1500, 'الحمولة كبيرة: ' + s.length); const pat = /(sk-[A-Za-z0-9]{20,}|api[_-]?key\s*[:=]\s*['"][^'"]{8,}|AIza[0-9A-Za-z_-]{30,}|Bearer\s+[A-Za-z0-9._-]{30,}|-----BEGIN [A-Z ]*PRIVATE)/;
    for (const f of ['../admin.html', '../index.html', '../worker/index.mjs', '../src/assistant.js']) assert(!pat.test(fs.readFileSync(path.join(__dirname, f), 'utf8')), 'نمط مفتاح في ' + f);
  });
  // ================= 11) السريري: قواعد معتمدة بمصدرها فقط
  await t('11) سريرياً: القواعد المعتمدة تُطبَّق وتُعرض بمصدرها؛ الضغط والإمساك بلا قواعد معتمدة لا تُخترع لهما قيود؛ التستوستيرون بلا ادعاءات', () => {
    const { c, p: plan } = find(pl => pl.days.some(d => d.slots.some(s => s.lines.some(l => D.rules.some(r => r.cond === 'خمول الغدة' && A.norm(l.name).includes(A.norm(r.kw))))))); let p = A.propose({ type: 'adapt_for_condition', condition: 'الغدة الدرقية' }, ses(c, plan)); assert(p.issues.length || p.changes.length, 'لم تُطبَّق أي قاعدة');
    const avoidKws = D.rules.filter(r => r.cond === 'خمول الغدة' && r.tier === 'تجنّب').map(r => A.norm(r.kw)); (p.changes || []).forEach(ch => { assert(ch.rule && ch.rule.src, 'تغيير بلا مصدر'); assert(!avoidKws.some(k => A.norm(ch.after.name).includes(k)), 'بديل يخالف قاعدة: ' + ch.after.name); });
    p.issues.filter(i => i.code === 'RULE_REDUCE').forEach(i => assert(/المصدر:/.test(i.message_ar))); assert(p.kind === 'info' || /ليست قراراً علاجياً|لا تغيّر الأدوية/.test(p.summary_ar) || p.noChange, p.summary_ar.slice(0, 80));
    for (const cond of ['ارتفاع ضغط الدم', 'الإمساك المزمن', 'فرط نشاط الغدة']) { const q = A.propose({ type: 'adapt_for_condition', condition: cond }, ses(c, plan)); assert.strictEqual(q.kind, 'info'); assert.strictEqual(q.status, 'NO_APPROVED_RULES'); assert(!q.plan2 && !q.changes.length); assert(/لا توجد في قاعدة البيانات/.test(q.summary_ar) && /ولن أضع قيوداً/.test(q.summary_ar)); }
    const tst = A.propose({ type: 'clinical_info', topic: 'أطعمة ترفع التستوستيرون' }, ses(c, plan)); assert.strictEqual(tst.status, 'NO_UNSUPPORTED_CLAIMS'); assert(/لا أستطيع الادعاء/.test(tst.summary_ar) && !/(أفضل|يرفع بشكل|اكل)/.test(tst.summary_ar.replace('لا أستطيع الادعاء بأن صنفاً بعينه يرفع', '')));
    const other = A.propose({ type: 'clinical_info', topic: 'هل الكركم يعالج السرطان' }, ses(c, plan)); assert.strictEqual(other.status, 'NO_APPROVED_RULES');
  });
  // ================= 12) التتبع والتراجع
  await t('12) سجل التدقيق والفروق والتراجع: الإدخال يربط الطلب بالإجراء والاعتماد والنتيجة، والفرق يطابق التغييرات، والتراجع يعيد الخطة السابقة حرفياً', () => {
    const { c, p: plan } = find(pl => hasRiceAt(pl, 'L')), p = A.propose({ type: 'replace_food', from: 'الرز', meal: 'L' }, ses(c, plan)), ap = approve(p), res = A.apply(p, ses(c, plan), ap), au = A.auditEntry(p, 'استبدل الرز في الغداء', ap, plan, res.plan);
    assert(au.id && au.by === 'dt/hamed' && au.request.action.type === 'replace_food' && au.baseHash === A.hash(plan) && au.resultHash === A.hash(res.plan) && au.approval.nonce === ap.nonce && au.changes === p.changes.length && au.undone === false); assert(!J(au).includes('"plan"'), 'السجل يحمل خطة كاملة');
    const df = A.diffPlans(plan, res.plan); assert.strictEqual(df.lines.length, new Set(p.changes.map(x => x.day + ':' + x.slot)).size); df.lines.forEach(l => { assert(l.removed.length && l.added.length); assert(l.removed.every(x => /^أرز/.test(x.name))); });
    const restored = clone(plan); assert.strictEqual(J(restored), J(plan)); assert.strictEqual(A.hash(restored), au.baseHash); assert.notStrictEqual(A.hash(res.plan), au.baseHash); assert.strictEqual(A.diffPlans(plan, restored).lines.length, 0);
  });
  // ================= المحلل المحلي (بلا اتصال)
  await t('المحلل المحلي: الصيغ العربية الشائعة تُترجم إلى الإجراءات الصحيحة، والصيغ غير المفهومة تُرفض بوضوح', () => {
    const P = (x) => A.parseLocal(x).actions[0] || {}, tbl = [
      ['شيل الرز من العشاء وحط بدله صنف معتمد من نفس المجموعة', { type: 'replace_food', meal: 'D', to: 'auto' }], ['استبدل الأرز في الغداء بالبرغل', { type: 'replace_food', meal: 'L', to: 'برغل' }], ['غيّر البطاطس في العشاء يوم السبت إلى الأرز', { type: 'replace_food', meal: 'D', days: [6] }], ['احذف التوست من الفطور', { type: 'replace_food', meal: 'B', to: 'auto' }],
      ['قلل الحليب إلى حصة واحدة كاملة الدسم يومياً', { type: 'set_group_total', perDay: 1, subgroup: 'full' }], ['اجعل الألبان حصتين قليلة الدسم', { type: 'set_group_total', perDay: 2, subgroup: 'low' }], ['خفض الحليب الى 1 حصة', { type: 'set_group_total', perDay: 1 }],
      ['أنشئ خطة أسبوعية', { type: 'generate_week' }], ['اعمل لي جدول لمدة 7 ايام', { type: 'generate_week' }], ['نوّع الأصناف', { type: 'improve_variety' }], ['كيّف الخطة لمريض السكري', { type: 'adapt_for_condition' }], ['كيف أعدل الخطة لحالة ضغط الدم', { type: 'adapt_for_condition' }],
      ['تراجع', { type: 'undo' }], ['ما الذي تغير', { type: 'show_diff' }], ['قارن بين الخطتين', { type: 'show_diff' }], ['انقل حصة نشويات من الغداء إلى العشاء', { type: 'move_exchanges', group: 'starch', from: 'L', to: 'D' }], ['انقل حصة فاكهة الى السناك', { type: 'move_exchanges', group: 'fruit', to: 'S' }], ['ما الأطعمة التي ترفع التستوستيرون', { type: 'clinical_info' }]];
    tbl.forEach(([txt, exp]) => { const a = P(txt); Object.keys(exp).forEach(k => assert.strictEqual(J(a[k]), J(exp[k]), txt + ' → ' + k + ' = ' + J(a[k]))); assert(A.validateAction(a).ok, 'إجراء غير صالح من المحلل: ' + txt); });
    for (const junk of ['اكتب لي قصيدة', 'مرحبا', 'كم الساعة', '']) { const r = A.parseLocal(junk); assert.strictEqual(r.actions.length, 0, junk); assert(r.message_ar || r.unsupported); }
    assert.strictEqual(A.parseLocal('قلل الحليب').actions.length, 0); assert(A.parseLocal('قلل الحليب').clarify_ar);
  });
  await t('المحرك: regenSlotG يعيد تخطيط وجبة بأعداد صريحة دون المساس بالوجبات الأخرى، ويطابق regenSlot', () => {
    const c = mkClient(2), plan = E.planWeek(c, D, { seed: 3 }), p1 = clone(plan), p2 = clone(plan), cur = E.actualGroups(p1.days[2].slots[0]), n11 = E.colCounts(cur); n11[0] += 1;
    E.regenSlot(p1, 2, 0, n11, D); E.regenSlotG(p2, 2, 0, E.adjustCols(E.actualGroups(p2.days[2].slots[0]), n11), D); assert.strictEqual(J(p1), J(p2)); p2.days.forEach((d, i) => d.slots.forEach((s, k) => { if (!(i === 2 && k === 0)) assert.strictEqual(J(s), J(plan.days[i].slots[k])); }));
  });
  console.log('\nنجح', n, 'اختبارات المساعد dt/hamed (النواة)');
})();
