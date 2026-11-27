// 1.50 (طلب المالك): شكل 1.49 الزجاجي كما هو + طيّ الشريط الجانبي وقائمة المحادثات + حذف المكرر + إزالة زيزو من زنها Pro.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سارة'); await p.evaluate(() => DPApp.A.home()); await p.waitForSelector('.home.zh');
  assert(await p.$('.zhpulse, .zhw'), 'الرئيسية الزجاجية 1.49'); assert(!(await p.$('.ntr'))); ok('الرئيسية كما في 1.49 (الزجاجي)');
  assert.strictEqual(await p.$$eval('.zhzz, .zhw svg.zizo', (x) => x.length), 0); ok('زيزو (الثعلب) أُزيل من زنها Pro');
  assert(!(await p.$('.zhqa'))); const ch = await p.$$eval('.zhchips [data-a]', (x) => x.map((e) => e.textContent)); assert(!ch.some((t) => /رسائل غير مقروءة|مواعيد اليوم|اشتراكات للتجديد/.test(t)), ch.join('|')); ok('حُذفت الأزرار والمؤشرات المكررة (عميل جديد/توليد/موعد، رسائل، مواعيد، تجديد)');
  assert(!(await p.isVisible('#hd [data-a="hqSearch"]')) && !(await p.isVisible('#hd [data-a="hqMsg"]'))); assert(await p.isVisible('#hd [data-a="hqNew"]')); ok('الترويسة: بلا أيقونة بحث ورسائل مكررة على الشاشة الواسعة');
  await p.click('#hd [data-a="navMini"]'); const w = await p.$eval('aside', (a) => a.getBoundingClientRect().width); assert(w < 100, w); assert.strictEqual(await p.evaluate(() => localStorage.getItem('zn_navmini')), '1');
  await p.click('#hd [data-a="navMini"]'); const w2 = await p.$eval('aside', (a) => a.getBoundingClientRect().width); assert(w2 > 180, w2); ok('الشريط الجانبي يُطوى (' + Math.round(w) + 'px) ويُفرد (' + Math.round(w2) + 'px) ويُحفظ الاختيار');
  { await p.setViewportSize({ width: 1280, height: 800 }); await p.click('#hd [data-a="navMini"]'); await p.waitForTimeout(250);      // 1.60 فيديو المالك: بين 1200 و1280px كانت الأسماء تظهر والشريط 240px فوق المحتوى رغم الطي
    const m = await p.evaluate(() => ({ rail: document.querySelector('aside .rail').getBoundingClientRect().width, lbl: [...document.querySelectorAll('aside .rail .sidebtn span')].some((x) => x.offsetWidth > 0), ov: document.querySelector('aside .rail').getBoundingClientRect().left >= document.querySelector('#app > main, #app main, main').getBoundingClientRect().right - 2 }));
    assert(m.rail < 100 && !m.lbl && m.ov, JSON.stringify(m)); await p.click('#hd [data-a="navMini"]'); await p.waitForTimeout(250); assert(await p.$eval('aside .rail', (r) => r.getBoundingClientRect().width) > 180);
    await p.setViewportSize({ width: 1440, height: 900 }); ok('1.60 الطي على 1280px: أيقونات فقط بلا أسماء ولا تداخل مع المحتوى، والفرد يعيد الأسماء'); }
  await p.evaluate(() => DPApp.A.zchat()); await p.waitForSelector('.chwrap .chl'); assert(await p.isVisible('.chwrap .chl'));
  await p.click('.chwrap [data-a="chMini"]'); assert(!(await p.isVisible('.chwrap .chl'))); await p.click('.chwrap [data-a="chMini"]'); assert(await p.isVisible('.chwrap .chl')); ok('«شات زنها»: قائمة المحادثات تُطوى وتُفرد');
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => DPApp.A.home()); await p.waitForTimeout(300);
  assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), 390); assert(await p.isVisible('#hd [data-a="hqSearch"]')); ok('الجوال: بلا تجاوز عرض، وأيقونة البحث ظاهرة (لا حقل بحث هناك)');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات 1.50'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
