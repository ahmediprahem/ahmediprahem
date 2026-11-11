// المتابعة اليومية المفصّلة في «زنها Pro» (0.90): خطة اليوم صنفاً صنفاً (عمله/لم يعمله/بدّله)، والماء بالأكواب، والملاحظات
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('daydetail', errs);
  await m.click('[data-act="tab"][data-v="plan"]'); await m.waitForSelector('.it .ck');
  const first = (await m.locator('.it').nth(0).textContent()).trim();
  await m.locator('.it .ck').nth(0).click(); await m.locator('.it .ck').nth(1).click();
  await m.locator('.cups button').nth(2).click();
  await m.locator('.it .sw').nth(2).click(); const swTo = (await m.textContent('.sheet button.opt >> nth=0')).trim(); await m.click('.sheet button.opt >> nth=0');
  await m.locator('[data-act="note"]').first().click(); await m.fill('#noteIn', 'أضفت ملعقة عسل'); await m.click('[data-act="savenote"]');
  await m.waitForTimeout(2800); await cPoll(); await d.click('.rail [data-a="hxv"]'); await hxCheck(); await d.waitForSelector('.hxlinked .cl'); await d.click('.hxlinked .cl'); await d.waitForSelector('.hxtab .hxday');
  assert(await d.locator('.hxdd').count() >= 1); await d.click('.hxdd >> nth=0 >> summary'); await d.waitForSelector('.hxdd[open] .hxdm');
  const tx = await d.textContent('.hxdd[open]');
  assert(/عمل [23] ولم يعمل \d+/.test(await d.textContent('.hxdd >> nth=0 >> summary')), await d.textContent('.hxdd >> nth=0 >> summary'));
  assert.strictEqual(await d.locator('.hxdd[open] li.ok').count() >= 2, true); assert(await d.locator('.hxdd[open] li.no').count() >= 3, 'ما لم يعمله ظاهر');
  ok('تفاصيل اليوم: كل وجبات الخطة وأصنافها، بعلامة ✓ لما عمله و✗ لما لم يعمله، وعدّاد «عمل كذا ولم يعمل كذا»');
  assert(tx.includes('أضفت ملعقة عسل') && /ملاحظته/.test(tx)); assert(/بدل:/.test(tx) && tx.includes(swTo.split('\n')[0].slice(0, 6)), 'التبديل ظاهر');
  ok('الملاحظة التي كتبها العميل والصنف الذي بدّله يظهران داخل وجبتهما');
  assert(/💧 الماء/.test(tx) && /3 من \d+ كوباً/.test(tx) && /0\.75 لتر/.test(tx)); assert.strictEqual(await d.locator('.hxdd[open] .hxcups i.on').count(), 3);
  ok('الماء: 3 أكواب من الهدف (0.75 لتر) بأكواب مرسومة');
  assert(/لم يرسل تسجيل اليوم بعد|أرسل تسجيل اليوم/.test(tx)); const c = await C(); assert(c.hx.snap && c.hx.snap.days.length >= 7 && c.hx.snap.v === c.hx.planV, 'لقطة الخطة المرسلة محفوظة');
  ok('حالة إرسال تسجيل اليوم ظاهرة، ولقطة الخطة المرسلة محفوظة مع العميل لمطابقة الأصناف');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(String(e).slice(0, 1200)); process.exit(1); });
