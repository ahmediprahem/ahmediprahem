// 1.09 حذف الرسالة للجميع: العميل يحذف رسالته فتختفي عند الأخصائي، والأخصائي يحذف رسالته فتختفي عند العميل
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const L = await linked('msgdel', errs, { path: 'tailor' }), { d, m, hxCheck: hc, cPoll, C } = L, code = (await C()).code, hxCheck = async () => { await d.evaluate(() => DPApp.A.hxv()); await hc(); await d.evaluate((c) => { DPApp.A.zchat(); DPApp.A.czOpen(c); }, code); };
  await m.click('[data-act="chat"] >> nth=0'); await m.fill('#chatIn', 'رسالة من العميل للحذف'); await m.click('.composer .snd'); await m.waitForFunction(() => document.querySelectorAll('.bub.me').length === 1); await m.waitForTimeout(300); await m.fill('#chatIn', 'رسالة باقية'); await m.click('.composer .snd'); await m.waitForFunction(() => document.querySelectorAll('.bub.me').length === 2); await cPoll();
  await d.evaluate((c) => { DPApp.A.zchat(); DPApp.A.czOpen(c); }, code); await hxCheck(); await d.evaluate((c) => DPApp.A.czOpen(c), code);
  const t0 = await d.textContent('#chBody'); assert(t0.includes('رسالة من العميل للحذف') && t0.includes('رسالة باقية'), t0); ok('وصلت رسالتا العميل للأخصائي');
  await m.click('.bub.me >> nth=0'); await m.click('[data-act="mdel"]'); assert(/حذفت هذه الرسالة/.test(await m.textContent('#thread'))); await cPoll(); await hxCheck(); await d.evaluate((c) => DPApp.A.czOpen(c), code);
  const t1 = await d.textContent('#chBody'); assert(!t1.includes('رسالة من العميل للحذف') && t1.includes('حُذفت هذه الرسالة') && t1.includes('رسالة باقية'), t1); ok('العميل حذف رسالته: تختفي عند الأخصائي وتبقى الأخرى');
  await d.fill('#chIn', 'رد الأخصائي للحذف'); await d.click('[data-a="czSend"]'); await d.waitForFunction(() => document.querySelector('#chBody').textContent.includes('رد الأخصائي للحذف')); await cPoll();
  await m.waitForFunction(() => document.querySelector('#thread').textContent.includes('رد الأخصائي للحذف'), null, { timeout: 8000 }); ok('رد الأخصائي وصل للعميل');
  await d.click('.chb.me:not(.chdel) >> nth=-1'); await d.click('[data-a="czDel"]'); await d.waitForFunction(() => document.querySelector('#chBody').textContent.includes('حذفت هذه الرسالة')); await cPoll();
  await m.waitForFunction(() => !document.querySelector('#thread').textContent.includes('رد الأخصائي للحذف'), null, { timeout: 8000 }); ok('الأخصائي حذف رسالته: تختفي عند العميل');
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
