// 1.51: «البيانات» في ملف العميل أقسام قابلة للطي + عمود جانبي، بنفس الحقول والربط.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سارة'); await p.selectOption('[data-f="sex"]', 'أنثى').catch(() => { }); await p.fill('[data-f="age"]', '32'); await p.fill('[data-f="weight"]', '72'); await p.fill('[data-f="height"]', '163'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('.cf151');
  const secs = await p.$$eval('.cf151 .cfsec', (x) => x.map((s) => s.dataset.cfs)); assert.deepStrictEqual(secs, ['base', 'goal', 'health', 'pref', 'life']); ok('خمسة أقسام: الأساسية، الهدف، الصحة، التفضيلات، نمط الحياة');
  for (const s of ['name', 'phone', 'sex', 'age', 'weight', 'height', 'activity', 'goal', 'kcalManual', 'meals', 'keywords', 'notes', 'cuisine', 'budget', 'life']) assert.strictEqual(await p.$$eval('.cf151 [data-f="' + s + '"]', (x) => x.length), 1, s);
  for (const s of ['#tg', '#mcond', '#mstyle', '#mtailor', '#f-love', '#f-avoid', '#f-favMeals', '#f-excludedMeals', '.wdbox', '.dxbox', '[data-a="genOpen"]']) assert(await p.$('.cf151 ' + s), s); ok('كل الحقول والمعرّفات موجودة مرة واحدة');
  assert(await p.$('.cf151 .cfaside .cfside.go [data-a="genOpen"]') && await p.$('.cf151 .cfaside #f-notes')); ok('العمود الجانبي: «أنشئ الخطة» والنظام والمحرك والملاحظات');
  await p.fill('.cf151 [data-f="weight"]', '80'); await p.press('.cf151 [data-f="weight"]', 'Tab'); await p.waitForTimeout(200);
  assert.strictEqual(String(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).weight)), '80'); assert(/80/.test(await p.textContent('.cf151 .cfsec[data-cfs="base"] summary small'))); ok('التعديل يُحفظ كما كان (الوزن 80) ويظهر في ملخص القسم');
  await p.fill('.cf151 #f-notes', 'ملاحظة تجربة'); await p.press('.cf151 #f-notes', 'Tab'); await p.waitForTimeout(150); assert.strictEqual(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).notes), 'ملاحظة تجربة'); ok('الملاحظات في العمود الجانبي تُحفظ');
  await p.click('.cf151 .cfsec[data-cfs="health"] > summary'); assert.strictEqual(await p.$eval('.cf151 .cfsec[data-cfs="health"]', (d) => d.open), false);
  await p.evaluate(() => DPApp.A.tab('client')); assert.strictEqual(await p.$eval('.cf151 .cfsec[data-cfs="health"]', (d) => d.open), false); await p.click('.cf151 .cfsec[data-cfs="health"] > summary'); ok('طيّ القسم يُحفظ بعد إعادة العرض');
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => DPApp.A.tab('client')); await p.waitForTimeout(300); assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), 390); ok('الجوال: عمود واحد بلا تجاوز عرض');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات 1.51'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
