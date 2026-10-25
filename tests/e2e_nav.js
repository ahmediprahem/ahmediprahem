// المسميات والتنقل (0.46): «بنك الوجبات» و«الخطط الجاهزة» (مكتبة الأخصائي تبويب فيها)، الرئيسية بلا عمود عملاء فارغ وببلاطات الخطط والمواعيد، والإعدادات في أربعة أقسام و«المساعد».
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p); await p.waitForSelector('.qgrid');
assert(await p.evaluate(() => document.body.classList.contains('clx')), 'عمود العملاء مطوي قبل أول عميل');
  const tiles = await p.textContent('.qgrid'); for (const w of ['بنك الوجبات', 'الخطط الجاهزة', 'المواعيد']) assert(tiles.includes(w), 'بلاطة ' + w); assert(!tiles.includes('محرر الحصص'));
  ok('الرئيسية: لا عمود عملاء فارغ قبل أول عميل، وبلاطات «بنك الوجبات» و«الخطط الجاهزة» و«المواعيد»');
  const rail = await p.textContent('.rail'); assert(rail.includes('بنك الوجبات') && rail.includes('الخطط الجاهزة')); assert(!/محرر الحصص|مكتبة الأخصائي|مكتبة الأنظمة الجاهزة/.test(rail)); assert.strictEqual(await p.locator('.rail [data-a="lib"]').count(), 0);
  await p.click('.rail [data-a="bank"]'); await p.waitForSelector('.bank h2'); assert(/بنك الوجبات/.test(await p.textContent('.bank h2')));
  await p.click('.rail [data-a="ready"]'); await p.waitForSelector('.rdl'); assert(/الخطط الجاهزة/.test(await p.textContent('.rdl h2'))); await p.click('[data-a="rdTab"][data-v="lib"]'); await p.waitForSelector('.dxc'); assert.strictEqual(await p.locator('.dxc').count(), 10);
  ok('التنقل: «بنك الوجبات» و«الخطط الجاهزة» (بداخلها «مكتبة الأخصائي» تبويباً) بدل ثلاثة أقسام متشابهة الأسماء');
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'ريم'); await p.press('[data-f="name"]', 'Tab'); await p.waitForTimeout(150);
  assert(/اختر خطة جاهزة/.test(await p.textContent('main [data-a="genBank"]'))); assert(/من بنك الوجبات/.test(await p.textContent('main')));
  await p.click('.rail [data-a="home"]'); await p.waitForSelector('.qgrid'); assert(!(await p.evaluate(() => document.body.classList.contains('clx'))), 'عمود العملاء يظهر بعد أول عميل');
  ok('بيانات العميل: «📗 اختر خطة جاهزة» و«من بنك الوجبات»، وعمود العملاء يظهر بعد أول عميل');
  await p.click('.rail [data-a="settings"]'); await p.waitForSelector('.stgs'); assert.strictEqual(await p.locator('.stg').count(), 4); assert.strictEqual(await p.locator('.stg [data-a="setTab"]').count(), 10);
  assert(/المساعد/.test(await p.textContent('[data-a="setTab"][data-v="dt"]'))); assert(!/dt\/hamed/.test(await p.textContent('.stgs')));
  await p.click('[data-a="setTab"][data-v="vault"]'); assert.strictEqual(await p.getAttribute('[data-a="setTab"][data-v="vault"]', 'class'), 'on');
  ok('الإعدادات: عشرة تبويبات في أربعة أقسام (البيانات الغذائية، حصتي والعملاء، المظهر والمساعد، النسخ)، و«🤖 المساعد» بدل dt/hamed');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await b.close(); console.log('\nنجح', n, 'اختبارات التنقل والمسميات');
})().catch((e) => { console.log('✘', e.message.slice(0, 900)); console.log(errs.join('\n')); process.exit(1); });
