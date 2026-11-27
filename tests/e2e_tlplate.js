// 1.05 اختيار الأكلات كما في النموذج: مقدمة الفطور بالطبق ← شاشة لكل قسم في الفطور ← شاشة لكل وجبة بعده، والطبق يمتلئ مع الاختيار؛
// والاستبيان الموحّد يظهر حتى لو وصلت الدعوة بلا علامة التفصيل (دعوة قديمة)، والدعوة تحمل الحساسيات والمجموعات
const assert = require('assert'), linked = require('./hx_link_helper'), path = require('path'), fs = require('fs');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [], SH = process.env.TL_SHOTS || '';
(async () => {
  const L = await linked('tlplate', errs, { path: 'tailor', wizard: async (m) => {
    const st = () => m.evaluate(() => window.HissatiApp.state());
    const cat = (await st()).cat; assert(cat.allergens && cat.allergens.length && cat.groups && cat.groups.length && cat.days, 'الدعوة كاملة'); ok('الدعوة تحمل الحساسيات والمجموعات والأيام (كان تعليق قد ابتلعها)');
    await m.evaluate(() => { const S = window.HissatiApp.state(); delete S.cat.form.tailor; S.cat.form.steps = S.cat.form.steps.filter((s) => !/^(goal|health|day|mfoods|lunch)$/.test(s.id)); window.HissatiApp.render(); });
    assert(/من 8/.test(await m.textContent('.hd')), 'الدعوة القديمة تفتح الاستبيان الموحّد: ' + await m.textContent('.hd')); ok('دعوة قديمة بلا علامة التفصيل: يظهر الاستبيان الموحّد كاملاً');
    const shot = async (f) => { if (SH) await m.screenshot({ path: path.join(SH, f) }); };
    for (let i = 0; i < 12 && !(await m.$('.tlh')); i++) { if (await m.locator('[data-act="set"][data-k="sex"]').count() && !(await m.locator('[data-act="set"][data-k="sex"].on').count())) await m.click('[data-act="set"][data-k="sex"][data-v="أنثى"]'); for (const sk of ['dmed', 'preg']) { if (await m.locator('[data-act="set"][data-k="' + sk + '"][data-v="n"]').count() && !(await m.locator('[data-act="set"][data-k="' + sk + '"].on').count())) await m.click('[data-act="set"][data-k="' + sk + '"][data-v="n"]'); } await m.click('.foot .btn'); await m.waitForTimeout(120); }
    assert(/نبدأ بالفطور/.test(await m.textContent('.tlh'))); assert(await m.$('svg.tlplate.anim')); assert.strictEqual(await m.locator('svg.tlplate .wf').count(), 6); assert(/لنبدأ/.test(await m.textContent('.foot .btn'))); await m.waitForTimeout(1600); await shot('p1_intro.png');
    ok('مقدمة «لنبنِ وجباتك، نبدأ بالفطور» بطبق من ستة أقسام ودليل الألوان');
    await m.click('.foot .btn'); await m.waitForSelector('.tlsec'); assert(/أضف مصادر البروتين التي تحبها في الفطور/.test(await m.textContent('.tlh'))); assert(await m.isDisabled('.foot .btn')); assert(/اخترت 0 من 2/.test(await m.textContent('.tlreq')));
    ok('شاشة بروتين الفطور: الزر معطّل حتى الحد الأدنى «اخترت 0 من 2 على الأقل»');
    const s0 = await m.$eval('svg.tlplate .wf', (e) => +getComputedStyle(e).getPropertyValue('--s')); await m.click('.tlsec .food >> nth=0'); const s1 = await m.$eval('svg.tlplate .wf', (e) => +getComputedStyle(e).getPropertyValue('--s'));
    assert(s1 > s0, s0 + ' → ' + s1); assert(/اخترت 1 من 2/.test(await m.textContent('.tlreq'))); ok('الطبق يمتلئ مع الاختيار (' + s0 + ' ← ' + s1.toFixed(2) + ')');
    await m.click('.tlsec .food >> nth=0'); assert(/no/.test(await m.getAttribute('.tlsec .food >> nth=0', 'class'))); ok('لمستان: «لا آكله»');
    if (await m.$('.tlq')) { await m.fill('.tlq', 'بيض'); const vis = await m.$$eval('.tlsec .food', (b) => b.filter((x) => !x.hidden).map((x) => x.textContent)); assert(vis.length && vis.every((t) => t.includes('بيض'))); await m.fill('.tlq', ''); ok('البحث داخل القسم'); }
    await m.click('[data-act="mfsug"]'); assert(!(await m.isDisabled('.foot .btn'))); assert(/اكتمل/.test(await m.textContent('.tlreq'))); await shot('p2_protein.png'); ok('«اقترح لي الأشهر» يكمل الحد الأدنى ويفعّل «التالي»');
    await m.click('.foot .btn'); assert(/النشويات/.test(await m.textContent('.tlh'))); await m.click('.hd .back'); assert(/البروتين/.test(await m.textContent('.tlh'))); ok('زر الرجوع ينتقل بين الشاشات الفرعية');
    const titles = []; for (let i = 0; i < 10 && await m.$('.tlh'); i++) { const t = await m.textContent('.tlh'); titles.push(t); if (/ماذا تحب في الغداء/.test(t)) { assert(await m.locator('.tlsec').count() >= 3); await shot('p3_lunch.png'); }
      for (let k = 0; k < 8 && await m.isDisabled('.foot .btn'); k++) { const sg = await m.$('[data-act="mfsug"]'); if (!sg) break; await sg.click(); } await m.click('.foot .btn'); await m.waitForTimeout(100); }
    assert(titles.some((t) => /الخضار والدهون/.test(t)) && titles.some((t) => /ماذا تحب في الغداء/.test(t)) && titles.some((t) => /ماذا تحب في العشاء/.test(t)), titles.join(' | ')); ok('الفطور بأقسامه ثم شاشة لكل وجبة (الغداء، العشاء، السناك): ' + titles.length + ' شاشات');
    const mf = (await st()).p.mfood; assert(Object.values(mf.L).filter((x) => x === 'love').length >= 5); ok('الاختيارات محفوظة لكل وجبة');
    if (process.env.DBG) console.log('DBG', (await m.textContent('body')).replace(/\s+/g,' ').slice(0, 400)); for (let i = 0; i < 4 && !(await m.$('#cq_x_day')); i++) { await m.click('.foot .btn'); await m.waitForTimeout(100); }
    assert(await m.$('#cq_x_day'), 'خطوة «عاداتك»'); assert(/عاداتك/.test(await m.textContent('body'))); assert(!(await m.isDisabled('.foot .btn')), 'الخطوة اختيارية'); await m.click('[data-act="cq1"][data-k="x_water"][data-v="7–9"]'); await m.fill('#cq_x_day', 'فطور 9 وغداء 4'); await shot('p9_habits169.png'); await m.click('.foot .btn');
    assert(/تاريخك الصحي/.test(await m.textContent('body'))); assert(await m.$('[data-k="x_cycle"]'), 'سؤال الدورة يظهر للعميلة'); await m.click('[data-act="cqm"][data-k="x_gi"][data-v="انتفاخ"]'); await shot('p10_history169.png');
    ok('1.69 خطوات الملف المتكامل الاختيارية في «زنها»: «عاداتك» ثم «تاريخك الصحي» (وسؤال الدورة للعميلة)');
  } });
  const c = await L.C(); assert(c.hx && c.path === 'tailor'); ok('الطلب وصل واعتُمد بمسار التفصيل');
  const cq = c.hx.intake.cq || {}; assert.strictEqual(cq.x_water, '7–9'); assert.deepStrictEqual(cq.x_gi, ['انتفاخ']); assert(!/كم كوب ماء/.test(c.notes || ''), 'لا تتكرر في الملاحظات');
  await L.d.evaluate(() => DPApp.A.tab('client')); await L.d.waitForSelector('.cf151 .ix169'); assert.strictEqual(await L.d.inputValue('#ix-x_water'), '7–9'); assert.strictEqual(await L.d.inputValue('#ix-x_day'), 'فطور 9 وغداء 4'); assert(await L.d.isChecked('input[data-ixm="x_gi"][value="انتفاخ"]'));
  ok('إجابات العميل تصل «الاستقبال والتاريخ» في ملفه عند الأخصائي تلقائياً، ولا تتكرر في الملاحظات');
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
