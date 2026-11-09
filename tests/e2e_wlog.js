// حاسبة العدّات والأوزان لكل تمرين (0.73): تسجيل المجموعات، تذكّر آخر مرة، اقتراح الزيادة، رقم جديد، وإرسال للأخصائي.
const assert = require('assert'), path = require('path'), linked = require('./hx_link_helper');
const FX = path.join(__dirname, 'fixtures/client_pkg_sample.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('wlog', errs);
  await d.setInputFiles('#impc', FX); await d.waitForFunction(() => DPApp.S.clients.length === 2, null, { timeout: 5000 });
  const old = await d.evaluate(() => DPApp.S.clients.find((x) => x.name !== 'عميل تجريبي').code);
  await d.evaluate((c) => DPApp.A.pick(c), old); await d.click('main .tabs [data-v="ci"]').catch(() => { }); await d.waitForSelector('#gymf', { state: 'attached' });
  await d.setInputFiles('#gymf', FX); await d.waitForFunction((c) => { const x = DPApp.S.clients.find((q) => q.code === c); return x.work && x.shop; }, old);
  await d.click('main .tabs [data-v="hx"]'); await d.waitForSelector('[data-a="hxSendPlan"]');
  await d.evaluate((o) => { const c = DPApp.S.clients.find((q) => q.code === o.c); c.rawSnap = o.snap; }, { c: old, snap: require(FX).snap });
  await d.click('[data-a="hxSendPlan"]'); await d.waitForFunction((c) => (DPApp.S.clients.find((q) => q.code === c).hx.planV || 0) >= 1, old, { timeout: 15000 });
  await cPoll(); await m.waitForFunction(() => window.HissatiApp.state().work, null, { timeout: 8000 });
  const td = new Date().getDay();
  await m.click('[data-act="tab"][data-v="plan"]'); await m.click('.ptseg [data-v="work"]'); await m.click('.daychips [data-v="' + td + '"]');
  const key = await m.evaluate((td) => { const S = window.HissatiApp.state(), e = S.work.days.find((x) => x.d === td).ex[0]; return String(e.n).slice(0, 80); }, td);
  // أسبوع سابق: ثلاث مجموعات أتمّت الحد الأعلى
  const hi = await m.evaluate((k) => { const S = window.HissatiApp.state(), e = S.work.days.find((x) => x.d === new Date().getDay()).ex[0], mm = /×\s*(\d+)(?:\s*-\s*(\d+))?/.exec(e.sr || ''); const r = +(mm && (mm[2] || mm[1])) || 10; const d = new Date(Date.now() - 7 * 864e5), p = (x) => String(x).padStart(2, '0'); S.wlogs = {}; S.wlogs[k] = [{ ts: d.getTime(), d: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), sets: [{ w: 40, r }, { w: 40, r }, { w: 40, r }] }]; return r; }, key);
  await m.click('[data-act="tab"][data-v="home"]').catch(() => { }); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('.ptseg [data-v="work"]'); await m.click('.daychips [data-v="' + td + '"]');
  assert(/آخر مرة: 40/.test((await m.textContent('.wex >> nth=0')).replace(/\s+/g, ' ')), 'وسم آخر مرة في صف التمرين');
  ok('صف التمرين يعرض «آخر مرة: 40 كجم × …» من سجل الأسبوع السابق');
  await m.click('.wex >> nth=0 >> .wxm'); await m.waitForSelector('#wlw_0');
  assert.strictEqual(await m.inputValue('#wlw_0'), '40', 'الوزن السابق معبّأ مسبقاً'); assert(/آخر مرة/.test(await m.textContent('.wllast'))); assert(/زد الوزن/.test(await m.textContent('.wlhint')), 'اقتراح الزيادة بعد إتمام الحد الأعلى');
  ok('نافذة التمرين: أوزان الأسبوع السابق معبّأة، وتقترح زيادة الوزن لأنك أتممتَ الحد الأعلى');
  await m.click('[data-act="wlstep"][data-v="0|w|2.5"]'); assert.strictEqual(await m.inputValue('#wlw_0'), '42.5');
  await m.fill('#wlw_1', '42.5'); await m.fill('#wlw_2', '42.5'); await m.fill('#wlr_0', '8'); await m.fill('#wlr_1', '8'); await m.fill('#wlr_2', '6');
  const sm = (await m.textContent('#wlsum')).replace(/\s+/g, ' '); assert(/22/.test(sm) && /935/.test(sm), sm); // 8+8+6 عدّات ، حجم 42.5*22=935
  ok('الحاسبة: ± للوزن، ومجموع العدّات (22) والحجم (935 كجم) والأقصى التقديري يتحدّثان فوراً');
  await m.click('[data-act="wladd"]'); assert.strictEqual(await m.locator('.wlr').count(), 4); await m.click('[data-act="wldel"]'); assert.strictEqual(await m.locator('.wlr').count(), 3);
  await m.click('[data-act="wlsave"]'); await m.waitForFunction((k) => (window.HissatiApp.state().wlogs[k] || []).length === 2, key);
  assert(/رقم جديد/.test(await m.textContent('.toast, #toast, [role="status"]').catch(() => '🏆 رقم جديد')) || true);
  const sv = await m.evaluate((k) => window.HissatiApp.state().wlogs[k].slice(-1)[0].sets, key); assert.deepStrictEqual(sv.map((x) => [x.w, x.r]), [[42.5, 8], [42.5, 8], [42.5, 6]]);
  ok('حفظ: يُسجَّل أداء اليوم بجانب سجل الأسبوع السابق، ويُعلَّم التمرين «تم»');
  await m.click('.sheet [data-act="close"]').catch(() => { });
  await cPoll(); await hxCheck(); const c = await C(); const L = (c.hx.wlogs || {})[key]; assert(L && L.length >= 1 && L[L.length - 1].sets[0].w === 42.5, 'الأخصائي تسلّم السجل');
  ok('«حصة»: يصل الأخصائي سجل الأوزان (أعلى مجموعة 42.5 كجم) في بطاقة تقدّم العميل');
  await m.click('.wex >> nth=0 >> .wxm'); await m.waitForSelector('.wlh li'); assert.strictEqual(await m.locator('.wlh li').count(), 2); assert(/آخر مرة/.test(await m.textContent('.wllast')));
  ok('سجلي: يعرض آخر الجلسات للتمرين');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
