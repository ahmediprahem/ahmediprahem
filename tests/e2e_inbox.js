// «الوارد» في رئيسية الأخصائي (0.86): بطاقة بعدد الرسائل والطلبات، بلمسة تفتح تبويب «زنها»
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, close } = await linked('inbox', errs);
  await d.evaluate(() => { DPApp.S.view = 'home'; DPApp.S.cur = null; }); await d.evaluate(() => document.querySelector('[data-a="nav"][data-v="home"]').click());
  assert.strictEqual(await d.locator('.inboxc').count(), 0, 'لا وارد بلا رسائل'); ok('بلا رسائل أو طلبات: لا تظهر بطاقة الوارد');
  await m.click('[data-act="tab"][data-v="today"]'); await m.click('.chatbtn'); await m.fill('#chatIn', 'مرحباً دكتور'); await m.press('#chatIn', 'Enter'); await m.waitForTimeout(2800); await cPoll(); await d.click('.rail [data-a="hxv"]'); await hxCheck();
  await d.evaluate(() => document.querySelector('[data-a="nav"][data-v="home"]').click()); await d.waitForSelector('.inboxc');
  assert(/رسالة/.test(await d.textContent('.inboxc'))); ok('بعد رسالة من العميل: بطاقة «الوارد من زنها» بعدد الرسائل');
  await d.click('.inboxc'); await d.waitForSelector('.hxlinked'); ok('لمسها تفتح تبويب «زنها» وفيه العملاء');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
