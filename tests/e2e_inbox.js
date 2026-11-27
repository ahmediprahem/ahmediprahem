// «اليوم» عند الأخصائي (0.94، حُدّث 1.54): بلا وارد لا مؤشرات نشطة، والرسالة الجديدة تظهر في عدّاد «شات زنها» ولمسه يفتحه
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, close } = await linked('inbox', errs);
  await d.evaluate(() => { DPApp.S.view = 'home'; DPApp.S.cur = null; }); await d.evaluate(() => document.querySelector('[data-a="nav"][data-v="home"]').click());
  assert.strictEqual(await d.locator('.tdk.has').count(), 0, 'لا وارد بلا رسائل'); ok('بلا رسائل أو طلبات: لا مؤشرات نشطة في «اليوم»');
  await m.click('[data-act="tab"][data-v="today"]'); await m.click('.chatbtn'); await m.fill('#chatIn', 'مرحباً دكتور'); await m.press('#chatIn', 'Enter'); await m.waitForTimeout(2800); await cPoll(); await d.evaluate(() => DPApp.A.hxv()); await hxCheck();
  await d.evaluate(() => document.querySelector('[data-a="nav"][data-v="home"]').click()); await d.waitForFunction(() => { const e = document.querySelector('.rail [data-a="zchat"] em'); return e && +e.textContent >= 1; });
  ok('بعد رسالة من العميل: عدّاد «شات زنها» في الشريط الجانبي (1.50: حُذف مؤشر «رسائل غير مقروءة» المكرر من «اليوم»)');
  await d.click('.rail [data-a="zchat"]'); await d.waitForSelector('.chwrap'); ok('لمسه يفتح «شات زنها»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
