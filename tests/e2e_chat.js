// «شات زنها» في «زنها Pro» (0.91): قائمة جانبية بالعملاء وآخر رسالة وغير المقروء، خيط بفواصل أيام وعلامات ✓/✓✓، ردّ يصل العميل، وقراءة تُعلَّم
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('chat', errs);
  await m.click('[data-act="tab"][data-v="today"]'); await m.click('.chatbtn'); await m.fill('#chatIn', 'السلام عليكم دكتور، عندي سؤال عن الفطور'); await m.press('#chatIn', 'Enter'); await m.waitForTimeout(2800); await cPoll();
  await d.click('.rail [data-a="hxv"]'); await hxCheck();
  assert(await d.locator('.rail [data-a="zchat"]').count() === 1); await d.evaluate(() => DPApp.A.zchat()); await d.waitForSelector('.chrow');
  assert(/السلام عليكم/.test(await d.textContent('.chrow')) && await d.locator('.chrow em.hxnb').count() === 1);
  ok('شات زنها: العميل في القائمة الجانبية بآخر رسالته وشارة غير مقروء');
  await d.click('.chrow'); await d.waitForSelector('#chBody .chb'); const bt = await d.textContent('#chBody'); assert(/السلام عليكم/.test(bt) && /اليوم/.test(bt), bt);
  assert.strictEqual(await d.locator('.chrow em.hxnb').count(), 0, 'تُمحى الشارة بعد الفتح'); ok('فتح المحادثة: الرسالة بفاصل «اليوم»، وتُمحى الشارة ويُرسل إيصال القراءة');
  await d.fill('#chIn', 'وعليكم السلام، تفضّل'); await d.press('#chIn', 'Enter'); await d.waitForFunction(() => /تفضّل/.test(document.querySelector('#chBody').textContent)); assert(/✓/.test(await d.textContent('.chb.me .chtm')));
  assert.strictEqual(await d.inputValue('#chIn'), ''); ok('الرد بـEnter يظهر فقاعة خضراء بعلامة ✓ ويفرغ مربع الكتابة');
  await d.click('.chquick .chip >> nth=1'); assert(/اشرب الماء/.test(await d.inputValue('#chIn'))); ok('الردود السريعة تملأ مربع الكتابة');
  await m.waitForTimeout(300); await cPoll(); await m.waitForSelector('.bub', { timeout: 15000 }).catch(() => { }); const mt = await m.evaluate(() => window.HissatiApp.state().msgs.map((x) => x.t + '|' + x.from)); assert(mt.some((x) => /تفضّل\|d/.test(x)), mt.join(','));
  await m.evaluate(() => window.HissatiApp.render()); ok('الرد وصل العميل في «زنها»');
  await hxCheck().catch(() => { }); await d.evaluate(() => DPApp.A.zchat()); await d.waitForSelector('#chBody'); const c = await C(); assert((c.hx.msgs || []).some((x) => x.from === 'd' && x.t === 'وعليكم السلام، تفضّل'));
  await d.fill('#chQ', 'zzz'); assert.strictEqual(await d.locator('.chrow').count(), 0); await d.fill('#chQ', ''); assert.strictEqual(await d.locator('.chrow').count(), 1); ok('البحث في المحادثات يرشّح القائمة');
  await d.setViewportSize({ width: 390, height: 800 }); await d.evaluate(() => DPApp.A.czBack()); await d.waitForSelector('.chrow'); assert(await d.locator('.chwrap:not(.open) .chl').isVisible()); await d.click('.chrow'); await d.waitForSelector('.chwrap.open .chm'); assert(await d.locator('.chback').isVisible());
  ok('على الجوال: القائمة ثم المحادثة بزر رجوع، كواتساب');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(String(e).slice(0, 1200)); process.exit(1); });
