// النقاط والمكافآت والدعوة وفيديو الوجبة (0.55): الأخصائي يفعّل النقاط ويحدد القيم والمكافآت ← العميل يجمع نقاطاً على السلوك (تسجيل اليوم، قياس الأسبوع) بسقف يومي
// ← عند بلوغ «شهادة تقدير» تصله شهادة؛ كود دعوة لكل عميل، ومن يشترك به يُحسب له؛ ورابط يوتيوب لطريقة التحضير يظهر في وصفة الوجبة.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { b, d, m, hxCheck, cPoll, C, close } = await linked('points', errs);
  await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="hx"]'); await d.waitForSelector('.ptset');
  await d.check('[data-pt="on"]'); await d.waitForSelector('.toast:has-text("حُفظت إعدادات النقاط")'); await d.fill('[data-pt="rewards"]', '10 شهادة تقدير\n30 وجبة مفتوحة'); await d.press('[data-pt="rewards"]', 'Tab'); await d.fill('[data-pt="cap"]', '15'); await d.press('[data-pt="cap"]', 'Tab'); await d.waitForTimeout(500);
  const st = await d.evaluate(() => DPApp.S.clients.length && window.DPApp && JSON.parse(JSON.stringify(window.HX ? HX.st.pts : null)));
  ok('«حصة»: تفعيل النقاط، والقيم والسقف اليومي والمكافآت (سطر لكل مكافأة) يحددها الأخصائي');
  await d.click('.rail [data-a="hxv"]'); await hxCheck(); await d.waitForTimeout(700); await cPoll(); await m.click('[data-act="tab"][data-v="progress"]'); await m.waitForSelector('.pts');
  let pt = await m.textContent('.pts'); assert(/نقاطي هذا الأسبوع/.test(pt) && /\b0\b/.test(pt) && /باقي 10 نقطة على «شهادة تقدير»/.test(pt), pt); const ref = (await m.textContent('.refc')).trim(); assert(/^[A-Z0-9]{5,8}$/.test(ref), ref);
  ok('«حصتي»: «🏅 نقاطي هذا الأسبوع» وتقدمها نحو المكافأة التالية وكيف تُجمع، و«🤝 كود دعوتي»');
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('#daylog'); await m.click('#daylog [data-act="allDay"]'); await m.click('#daylog [data-act="subDay"]');
  await m.evaluate(() => { window.HissatiApp.state().planAt = Date.now() - 7.5 * 864e5; }); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]'); await m.click('[data-act="wkGo"]'); await m.fill('#wkW', '86'); await m.click('[data-act="wkSend"]');
  await cPoll(); await d.evaluate(() => DPApp.A.pick(DPApp.S.clients[0].code)); await d.waitForSelector('main .tabs [data-v="hx"]'); await d.click('main .tabs [data-v="hx"]'); await hxCheck(); await d.waitForTimeout(900); await cPoll();
  let c = await C(); assert((c.hx.rwLog || []).some((q) => q.n === 'شهادة تقدير'), JSON.stringify(c.hx.rwLog));
  const S = await m.evaluate(() => { const s = window.HissatiApp.state(); return { total: s.pts.total, ach: (s.ach || []).filter((a) => a.w === 98).map((a) => a.title), rw: (s.rwds || []).map((q) => q.n) }; });
  assert.strictEqual(S.total, 15); assert(S.ach.length === 1 && /جمع 10 نقطة/.test(S.ach[0]), JSON.stringify(S)); assert.deepStrictEqual(S.rw, ['شهادة تقدير']);
  ok('تسجيل اليوم (+5) وقياس الأسبوع (+10) = 15 نقطة (السقف اليومي 15)، وعند 10 تصل «شهادة تقدير» شهادةً في «إنجازاتي» مرة واحدة');
  await m.waitForSelector('#cel'); await m.click('#cel'); await m.waitForSelector('#cel', { state: 'detached' });
  await m.click('[data-act="tab"][data-v="progress"]'); pt = await m.textContent('.pts'); assert(/15/.test(pt) && /باقي 15 نقطة على «وجبة مفتوحة»/.test(pt), pt);
  await d.click('main .tabs [data-v="ci"]'); assert(/النقاط والدعوات/.test(await d.textContent('.ci')) && /شهادة تقدير/.test(await d.textContent('.ci')));
  // دعوة بكود العميل: عميل ثانٍ يشترك
  await d.click('.rail [data-a="hxv"]'); await d.click('main [data-a="hxInvForm"]'); await d.fill('#hxi_l', 'هالة'); await d.fill('#hxi_p', '01005556667'); await d.fill('#hxi_r', ref.toLowerCase()); await d.click('[data-a="hxInvMake"]');
  await d.waitForSelector('.hxinv.made .hxlink'); const link2 = (await d.textContent('.hxinv.made .hxlink')).trim();
  const { devices } = require('playwright'); const ctx2 = await b.newContext({ ...devices['iPhone 13'] }); await ctx2.addInitScript(() => { try { localStorage.setItem('hissati_onb', '1'); } catch (e) { } }); const m2 = await ctx2.newPage();
  await m2.goto(link2); await m2.waitForSelector('.invite .dr'); await m2.click('[data-act="go"][data-v="pin"]'); for (const k of '56785678') await m2.click(`.pad [data-v="${k}"]`); await m2.waitForSelector('.prog');
  await m2.fill('#f_phone', '01005556667'); await m2.fill('#f_age', '29'); await m2.fill('#f_weight', '70'); await m2.fill('#f_height', '160');
  for (let i = 0; i < 14 && !(await m2.isVisible('#consent')); i++) { await m2.click('.foot .btn'); await m2.waitForTimeout(150); }
  await m2.check('#consent'); await m2.click('[data-act="submit"]'); await m2.waitForSelector('text=وصل طلبك إلى أخصائيك'); await m2.evaluate(() => window.HissatiApp.flush());
  await hxCheck(); await d.waitForSelector('.hxreq:not(.wait)'); await d.click('[data-a="hxOk"]'); await d.waitForTimeout(800);
  const cs = await d.evaluate(() => DPApp.S.clients.map((x) => ({ name: x.name, ref: x.ref, refBy: x.refBy, refs: (x.refs || []).map((q) => q.name) })));
  assert(cs.some((x) => x.refBy === ref), JSON.stringify(cs)); assert(cs.some((x) => x.ref === ref && x.refs.includes('هالة')), JSON.stringify(cs));
  await d.waitForTimeout(800); await cPoll(); await m.click('[data-act="tab"][data-v="today"]'); await m.click('[data-act="tab"][data-v="progress"]'); assert(/اشترك من طرفك: 1 \(هالة\)/.test(await m.textContent('.ref')));
  ok('كود الدعوة: دعوة عميل جديد بكود العميل تربطه به عند الاعتماد، ويرى العميل «اشترك من طرفك: 1 (هالة)»');
  await d.evaluate(() => { const c = DPApp.S.clients[0], day = c.plan.days[new Date().getDay()], s = day.slots.find((q) => q.meal); window.__meal = s && s.meal; });
  const meal = await d.evaluate(() => window.__meal);
  if (meal) {
    await d.click('.rail [data-a="bank"]'); await d.waitForSelector('.bkr', { state: 'attached' });
    await d.evaluate((nm) => { const el = [...document.querySelectorAll('.bkr')].find((r) => r.querySelector('.bkn b').textContent === nm); el.querySelector('[data-a="rcEdit"]').click(); }, meal); await d.waitForSelector('#rc_yt');
    await d.fill('#rc_steps', 'خطوة'); await d.fill('#rc_yt', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10'); await d.click('[data-a="rcSave"]'); await d.waitForSelector('.toast:has-text("حُفظت الوصفة")');
    assert.strictEqual(await d.evaluate((nm) => { const r = DPApp.S.settings.recipes; const k = Object.keys(r).find((x) => r[x] && r[x].yt); return k && r[k].yt; }, meal), 'dQw4w9WgXcQ');
    await d.evaluate(() => DPApp.A.pick(DPApp.S.clients[0].code)); await d.waitForSelector('main .tabs [data-v="hx"]'); await d.click('main .tabs [data-v="hx"]'); await d.click('main [data-a="hxSendPlan"]'); await d.waitForFunction(() => DPApp.S.clients[0].hx.planV >= 2, null, { timeout: 15000 }); await cPoll();
    await m.click('[data-act="tab"][data-v="today"]'); await m.click('[data-act="rcp"] >> nth=0'); await m.waitForSelector('.rcpyt iframe'); assert(/youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/.test(await m.getAttribute('.rcpyt iframe', 'src')));
    ok('فيديو التحضير: رابط يوتيوب في وصفة الوجبة (بنك الوجبات) يصل مع الخطة ويعمل داخل «حصتي» (youtube-nocookie)');
  }
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات النقاط والدعوة');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
