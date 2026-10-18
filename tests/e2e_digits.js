// الأرقام العربية (٠-٩) والفارسية (۰-۹) والفاصلة العشرية العربية (٫) تُقبل في كل حقول الأرقام وتُحفظ أرقاماً صحيحة تدخل في الحسابات.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 950 } })).newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const cl = () => p.evaluate(() => { const S = HApp.state; return JSON.parse(JSON.stringify(S.clients.find(c => c.code === S.cur))); });
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.waitForSelector('[data-f="weight"]');
  const kinds = await p.evaluate(() => [...document.querySelectorAll('main input')].filter(i => i.dataset.num).map(i => [i.dataset.f, i.type, i.getAttribute('inputmode')]));
  assert.strictEqual(await p.locator('main input[type="number"]').count(), 0); assert(kinds.some(k => k[0] === 'weight' && k[1] === 'text' && k[2] === 'decimal'), JSON.stringify(kinds)); assert(kinds.some(k => k[0] === 'age' && k[2] === 'numeric'));
  ok('حقول الأرقام صارت حقول نص بلوحة أرقام (decimal للكسور، numeric للأعداد الصحيحة)');
  const bmr0 = (await cl()).weight; await p.click('[data-f="weight"]', { clickCount: 3 }); await p.keyboard.type('٨٥٫٥'); assert.strictEqual(await p.inputValue('[data-f="weight"]'), '85.5');
  await p.click('[data-f="age"]', { clickCount: 3 }); await p.keyboard.type('۳۲'); assert.strictEqual(await p.inputValue('[data-f="age"]'), '32');
  await p.fill('[data-f="height"]', '١٦٨'); await p.waitForTimeout(400); const c1 = await cl();
  assert.strictEqual(c1.weight, 85.5); assert.strictEqual(c1.age, 32); assert.strictEqual(c1.height, 168); assert.notStrictEqual(c1.weight, bmr0);
  assert((await p.textContent('#tg')).includes('29.3') || (await p.textContent('#tg')).includes('30.3'), 'لم يُحدَّث مؤشر الكتلة'); ok('كتابة ٨٥٫٥ و۳۲ و١٦٨ تُحفظ 85.5 و32 و168 أرقاماً، ويُعاد حساب الأهداف فوراً');
  await p.fill('[data-f="phone"]', '٠٥٥٤٠٧٩٤٠٤'); await p.waitForTimeout(300); assert.strictEqual((await cl()).phone, '0554079404'); ok('رقم الجوال بالأرقام العربية يُحفظ بأرقام لاتينية (للبحث ومنع التكرار)');
  await p.click('[data-f="age"]', { clickCount: 3 }); await p.keyboard.type('abc٣x'); assert.strictEqual(await p.inputValue('[data-f="age"]'), '3'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); assert.strictEqual(await p.inputValue('[data-f="age"]'), '5');
  await p.fill('[data-f="weight"]', '٨٠'); await p.press('[data-f="weight"]', 'ArrowDown'); assert.strictEqual(await p.inputValue('[data-f="weight"]'), '79.9'); await p.waitForTimeout(300); assert.strictEqual((await cl()).weight, 79.9);
  ok('الحروف تُرفض كما في حقل الأرقام، والسهمان ↑↓ يغيّران بالخطوة (1 للعمر، 0.1 للوزن) ويُحفظان');
  await p.fill('[data-f="name"]', 'عميل ٣'); await p.waitForTimeout(300); assert.strictEqual((await cl()).name, 'عميل ٣'); ok('الحقول النصية (الاسم والملاحظات) تبقى كما كُتبت بلا تحويل');
  // محرر الحصص: حصص المكوّنات
  await p.click('.rail [data-a="bank"]'); await p.waitForSelector('.bank .bk'); await p.click('.bank .bkh[data-v="B"]'); await p.locator('.bank .bk[data-c="B"] [data-a="bkEdit"]').first().click(); await p.waitForSelector('.bked');
  const ie = p.locator('.bked input[data-bf="ie"]').first(); await ie.fill('٢٫٥'); assert.strictEqual(await ie.inputValue(), '2.5'); assert.strictEqual(await ie.getAttribute('inputmode'), 'decimal'); ok('محرر الحصص: حصة المكوّن بالأرقام العربية ٢٫٥ تصير 2.5');
  // الجوال: لوحة الأرقام
  const mp = await (await b.newContext({ ...devices['Pixel 7'] })).newPage(); mp.on('pageerror', e => errs.push('m:' + e)); await mp.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(mp);
  await mp.click('.ghome .qa[data-a="new"][data-v="ex"]'); await mp.fill('[data-f="weight"]', '٧٢'); await mp.waitForTimeout(300); assert.strictEqual(await mp.evaluate(() => { const S = HApp.state; return S.clients.find(c => c.code === S.cur).weight; }), 72); ok('الجوال: الوزن ٧٢ يُقبل ويُحفظ 72');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم'); console.log('\nنجح', n, 'اختبارات الأرقام العربية'); await b.close();
})().catch(e => { console.log('✘', String(e).slice(0, 1200)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 400)); process.exit(1); });
