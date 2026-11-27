// 1.54: الرسائل تظهر دون تحديث الصفحة في الطرفين (الشات المفتوح يتحقق كل 5 ثوانٍ ويُعاد رسمه مع إبقاء المسودة)، وشارة الجرس تختفي عند فتحه.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('msg154', errs);
  // أول رسالة لفتح المحادثة عند الأخصائي
  await m.click('[data-act="tab"][data-v="today"]'); await m.click('.chatbtn'); await m.fill('#chatIn', 'مرحباً'); await m.press('#chatIn', 'Enter'); await m.waitForTimeout(1500);
  await d.evaluate(() => DPApp.A.hxv()); await hxCheck(); await d.evaluate(() => DPApp.A.zchat()); await d.waitForSelector('.chrow'); await d.click('.chrow'); await d.waitForSelector('#chBody .chb');
  // الأخصائي يكتب مسودة، والعميل يرسل رسالة جديدة: تظهر عند الأخصائي وحدها خلال ثوانٍ والمسودة باقية
  await d.fill('#chIn', 'مسودة الأخصائي'); await d.focus('#chIn');
  await m.fill('#chatIn', 'رسالة جديدة من العميل'); await m.press('#chatIn', 'Enter');
  await d.waitForFunction(() => /رسالة جديدة من العميل/.test(document.querySelector('#chBody').textContent), null, { timeout: 15000 });
  assert.strictEqual(await d.inputValue('#chIn'), 'مسودة الأخصائي'); assert.strictEqual(await d.locator('.chrow em.hxnb').count(), 0);
  ok('«شات زنها»: رسالة العميل تظهر وحدها خلال ثوانٍ دون تحديث، والمسودة باقية، والمحادثة المفتوحة مقروءة');
  // العميل يكتب مسودة، والأخصائي يرد: يظهر الرد عند العميل وحده والمسودة باقية
  await m.fill('#chatIn', 'مسودة العميل'); await d.fill('#chIn', 'رد الأخصائي الآن'); await d.press('#chIn', 'Enter');
  await m.waitForFunction(() => window.HissatiApp.state().msgs.some((x) => x.t === 'رد الأخصائي الآن'), null, { timeout: 15000 }); await m.waitForTimeout(300);
  assert(/رد الأخصائي الآن/.test(await m.textContent('#thread'))); assert.strictEqual(await m.inputValue('#chatIn'), 'مسودة العميل');
  ok('«زنها»: رد الأخصائي يظهر وحده خلال ثوانٍ في الشات المفتوح، ومسودة العميل باقية');
  await m.fill('#chatIn', 'أرسلها'); await m.press('#chatIn', 'Enter'); await m.waitForTimeout(400); assert.strictEqual(await m.inputValue('#chatIn'), ''); ok('بعد الإرسال يفرغ مربع الكتابة (لا تعود الرسالة المرسلة)');
  // الجرس
  await d.evaluate(() => { const c = DPApp.S.clients[0]; c.sub = { end: new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10), status: 'active', history: [] }; DPApp.A.home(); });
  const badge = () => d.locator('#hd [data-a="hqBell"] em').count(); assert((await badge()) === 1, 'شارة قبل الفتح');
  await d.click('#hd [data-a="hqBell"]'); assert.strictEqual(await badge(), 0); await d.keyboard.press('Escape'); await d.evaluate(() => DPApp.A.home()); assert.strictEqual(await badge(), 0);
  ok('الجرس: الشارة تختفي عند فتحه ولا تعود بعد إعادة العرض (القائمة كما هي)');
  await d.evaluate(() => { const c = DPApp.S.clients[0]; c.hx = c.hx || {}; DPApp.S.clients.push(Object.assign({}, c, { code: 'C0999', name: 'عميل آخر', sub: { end: new Date(Date.now() - 864e5).toISOString().slice(0, 10), status: 'active', history: [] } })); DPApp.A.home(); });
  assert.strictEqual(await badge(), 1); ok('إشعار عاجل جديد بعد الفتح يُظهر الشارة من جديد');
  assert.deepStrictEqual(errs.filter((e) => !/favicon|net::/.test(e)), [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات 1.54'); await close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
