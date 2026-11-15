// 1.05 اختيار الأكلات كما في النموذج: مقدمة الفطور بالطبق ← شاشة لكل قسم في الفطور ← شاشة لكل وجبة بعده، والطبق يمتلئ مع الاختيار؛
// والاستبيان الموحّد يظهر حتى لو وصلت الدعوة بلا علامة التفصيل (دعوة قديمة)، والدعوة تحمل الحساسيات والمجموعات
const assert = require('assert'), linked = require('./hx_link_helper'), path = require('path'), fs = require('fs');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [], SH = process.env.TL_SHOTS || '';
(async () => {
  const L = await linked('tlplate', errs, { path: 'tailor', wizard: async (m) => {
    const st = () => m.evaluate(() => window.HissatiApp.state());
    const cat = (await st()).cat; assert(cat.allergens && cat.allergens.length && cat.groups && cat.groups.length && cat.days, 'الدعوة كاملة'); ok('الدعوة تحمل الحساسيات والمجموعات والأيام (كان تعليق قد ابتلعها)');
    await m.evaluate(() => { const S = window.HissatiApp.state(); delete S.cat.form.tailor; S.cat.form.steps = S.cat.form.steps.filter((s) => !/^(goal|health|day|mfoods|lunch)$/.test(s.id)); window.HissatiApp.render(); });
    assert(/من 6/.test(await m.textContent('.hd')), 'الدعوة القديمة تفتح الاستبيان الموحّد: ' + await m.textContent('.hd')); ok('دعوة قديمة بلا علامة التفصيل: يظهر الاستبيان الموحّد كاملاً');
    const shot = async (f) => { if (SH) await m.screenshot({ path: path.join(SH, f) }); };
    for (let i = 0; i < 8 && !(await m.$('.tlh')); i++) { if (await m.locator('[data-act="set"][data-k="sex"]').count() && !(await m.locator('[data-act="set"][data-k="sex"].on').count())) await m.click('[data-act="set"][data-k="sex"][data-v="أنثى"]'); await m.click('.foot .btn'); await m.waitForTimeout(120); }
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
  } });
  const c = await L.C(); assert(c.hx && c.path === 'tailor'); ok('الطلب وصل واعتُمد بمسار التفصيل');
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
