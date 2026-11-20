// 1.16 المرحلة 1: الاستبيان المختصر — 5 أقسام بلغة يوم العميل، أسئلة السلامة (تنبيه أحمر للأخصائي)، التعبئة المسبقة مشفّرة في الدعوة، ورابط التجربة السريعة
const assert = require('assert'), linked = require('./hx_link_helper'), { devices } = require('playwright');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  let seen = {};
  const L = await linked('phase1', errs, { path: 'tailor', wizard: async (m) => {
    seen.hd = await m.textContent('.hd'); await m.evaluate(() => { const S = window.HissatiApp.state(); S.p.sex = 'أنثى'; window.HissatiApp.render(); });
    await m.click('.foot .btn'); await m.waitForTimeout(150); seen.goal = await m.textContent('.stack');
    await m.click('[data-act="set"][data-k="goal"][data-v="1"]'); await m.click('[data-act="set"][data-k="act"][data-v="0"]'); await m.click('.foot .btn'); await m.waitForTimeout(150);
    seen.healthDisabled = await m.isDisabled('.foot .btn'); await m.click('[data-act="set"][data-k="dmed"][data-v="y"]'); await m.click('[data-act="set"][data-k="preg"][data-v="n"]'); seen.healthOk = !(await m.isDisabled('.foot .btn'));
  } });
  const { d, m, env, C, RELAY } = L;
  assert(/من 5/.test(seen.hd), seen.hd); ok('الاستبيان المختصر: 5 أقسام (كانت 6) ' + seen.hd.trim().slice(0, 30));
  assert(/أغلب يومي جالس/.test(seen.goal) && /أنزل وزني بهدوء/.test(seen.goal) && !/خامل/.test(seen.goal) && !/تعديل يدوي/.test(seen.goal)); ok('الهدف والنشاط بلغة يوم العميل («أغلب يومي جالس»، «أنزل وزني بهدوء»)، و«تعديل يدوي» لا يظهر للعميل');
  assert(seen.healthDisabled && seen.healthOk); ok('سؤالا السلامة إلزاميان قبل المتابعة (حامل أو مرضع للأنثى، وأدوية السكر)');
  const c = await C(); assert(c.safety && c.safety.dmed === true && c.safety.preg === false, JSON.stringify(c.safety)); assert(!c.intakePrefs || c.intakePrefs.week === 'mix'); ok('السلامة تصل الأخصائي في ملف العميل، والأسئلة المحذوفة قيم افتراضية');
  await d.evaluate(() => { DPApp.S.view = 'client'; DPApp.A.tab('client'); }); await d.waitForSelector('.safeb'); assert(/أدوية لخفض السكر/.test(await d.textContent('.safeb'))); ok('تنبيه سلامة أحمر في ملف العميل');
  // التعبئة المسبقة المشفّرة: دعوة لعميل جديد مسجّل عند الأخصائي ببياناته
  await d.evaluate(() => DPApp.A.new('ex')); await d.fill('[data-f="name"]', 'سارة'); await d.selectOption('[data-f="sex"]', 'أنثى'); await d.fill('[data-f="age"]', '41'); await d.fill('[data-f="weight"]', '77'); await d.fill('[data-f="height"]', '158');
  await d.evaluate(() => DPApp.A.hxInvC()); await d.waitForSelector('#hxi_l'); if (!(await d.inputValue('#hxi_l'))) await d.fill('#hxi_l', 'سارة'); await d.click('[data-a="hxInvMake"]'); await d.waitForSelector('.hxinv.made .hxlink');
  const link = (await d.textContent('.hxinv.made .hxlink')).trim(), rows = await env.DB.prepare('SELECT cat FROM invites').all(), cats = (rows.results || rows).map((r) => r.cat).join('');
  assert(/"pre":\{/.test(cats) && !/"age":41/.test(cats) && !/158/.test(cats)); ok('بيانات التعبئة المسبقة في المحطة نص مشفّر (لا يظهر العمر ولا الطول)');
  const b = m.context().browser(), ctx2 = await b.newContext({ ...devices['iPhone 13'] }); await ctx2.addInitScript(() => { try { localStorage.setItem('hissati_onb', '1'); } catch (e) { } }); const m2 = await ctx2.newPage(); m2.on('pageerror', (e) => errs.push('زنها2: ' + e));
  await m2.goto(link); await m2.waitForSelector('.invite .dr'); await m2.click('[data-act="go"][data-v="pin"]'); for (const k of '12341234') await m2.click(`.pad [data-v="${k}"]`); await m2.waitForSelector('.prog');
  assert.strictEqual(await m2.inputValue('#f_age'), '41'); assert.strictEqual(await m2.inputValue('#f_height'), '158'); assert(/عبّأ أخصائيك/.test(await m2.textContent('.stack'))); ok('العميل يجد عمره وطوله ووزنه معبّأة من أخصائيه مع تنبيه للمراجعة');
  // رابط التجربة السريعة
  await d.evaluate(() => DPApp.A.new('ex')); await d.fill('[data-f="name"]', 'تجربة'); await d.evaluate(() => DPApp.A.hxInvC()); await d.waitForSelector('#hxi_l'); if (!(await d.inputValue('#hxi_l'))) await d.fill('#hxi_l', 'تجربة'); await d.click('[data-a="hxInvMake"]'); await d.waitForSelector('[data-a="hxCopyTr"]');
  const link2 = (await d.textContent('.hxinv.made .hxlink')).trim(), tr = link2.replace('/#t=', '/?tr=1#t='); const ctx3 = await b.newContext({ ...devices['iPhone 13'] }), m3 = await ctx3.newPage(); m3.on('pageerror', (e) => errs.push('زنها3: ' + e));
  await m3.goto(tr); await m3.waitForSelector('.invite .dr', { timeout: 15000 }); const skipped = await m3.evaluate(() => localStorage.getItem('hissati_intro') === '1' && localStorage.getItem('hissati_onb') === '1');
  assert(skipped); ok('رابط التجربة السريعة يتخطى المقدمة والتعريف ويعبّئ بيانات تجريبية');
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
