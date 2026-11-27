// 1.50: «اليوم» والهيكل بنمط اللوحة المرجعية: تحية في الترويسة، زر طي القائمة، الموعد التالي، إحصاءاتي 2×2، تبويبات، بلا تجاوز عرض على الجوال.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سارة'); await p.evaluate(() => DPApp.A.home()); await p.waitForSelector('.ntr');
  const g = await p.textContent('#hd .ntrg'); assert(/صباح الخير|مساء الخير/.test(g), g); ok('التحية في الترويسة: «' + g + '»');
  assert.strictEqual(await p.$$eval('.ntr .ntrstat', (x) => x.length), 4); const tot = await p.textContent('.ntr .ntrstat:first-child b'); assert(/^1/.test(tot.trim()), tot); ok('«إحصاءاتي» أربع بطاقات من بيانات حقيقية (العملاء = 1)');
  assert(await p.$('.ntr .ntrappt, .ntr .ntrempty')); ok('بطاقة «الموعد التالي/التالي الآن» أو حالة فارغة');
  await p.click('.ntr [data-a="ntrTab"][data-v="sub"]'); assert(await p.$('.ntr .ntrtl button.on[data-v="sub"]')); await p.click('.ntr [data-a="ntrTab"][data-v="act"]'); assert(await p.$('.ntr .ntrtl button.on[data-v="act"]')); ok('التبويبات تتبدل (يحتاج اهتمامك/النشاطات/الاشتراكات)');
  await p.click('#hd [data-a="navMini"]'); const w = await p.$eval('aside', (a) => a.getBoundingClientRect().width); assert(w < 100, w); assert.strictEqual(await p.evaluate(() => localStorage.getItem('zn_navmini')), '1');
  await p.click('#hd [data-a="navMini"]'); const w2 = await p.$eval('aside', (a) => a.getBoundingClientRect().width); assert(w2 > 180, w2); ok('زر الطي: القائمة أيقونات فقط (' + Math.round(w) + 'px) ثم تعود (' + Math.round(w2) + 'px) ويُحفظ الاختيار');
  assert(!(await p.isVisible('#hd [data-a="hqSearch"]'))); ok('إزالة التكرار: أيقونة البحث مخفية على الشاشة الواسعة (حقل البحث وCtrl+K يكفيان)');
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => DPApp.A.home()); await p.waitForTimeout(300);
  assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), 390); assert(await p.isVisible('#hd [data-a="hqSearch"]')); ok('الجوال: بلا تجاوز عرض، وأيقونة البحث ظاهرة');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات 1.50'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
