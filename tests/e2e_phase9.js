// 1.24 المرحلة 9: قسم الجرامات في «توليد الخطة» — الخطوات نفسها بمحرك الرياضيين: المراجعة والصيغة، الإعداد (المرحلة وصيغة الحرق)، التوليد، والفحص لكل يوم بالحدود نفسها
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.home()); await p.click('aside [data-a="genTab"]'); await p.waitForSelector('.genpage'); await p.click('[data-a="genNew"][data-v="ath"]');
  await p.fill('[data-f="name"]', 'خالد'); await p.selectOption('[data-f="sex"]', 'ذكر'); await p.fill('[data-f="age"]', '26'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '181'); await p.fill('[data-f="bf"]', '15'); await p.press('[data-f="bf"]', 'Tab');
  assert.strictEqual(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).kind), 'athlete'); ok('«＋ عميل جديد — الجرامات» من صفحة «توليد الخطة»');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.avoid = ['تونة معلبة بالماء', 'تونة معلبة بالزيت']; DPApp.A.tab('gen'); }); await p.waitForSelector('.genrev');
  const t = await p.textContent('.gentab'); assert(/نظام الجرامات/.test(t) && /Katch-McArdle/.test(t) && /تونة/.test(t)); ok('المراجعة: بيانات الرياضي، والصيغة Katch-McArdle مع الكتلة الخالية، والمستبعد بسببه');
  await p.click('[data-a="genRevOk"]'); await p.waitForSelector('.gensetup [data-f="bmrF"]'); await p.selectOption('.gensetup [data-f="bmrF"]', 'cunningham'); await p.waitForFunction(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).bmrF === 'cunningham');
  await p.evaluate(() => DPApp.A.genStep(2)); await p.waitForSelector('.genrev'); assert(/Cunningham/.test(await p.textContent('.gencl .tgx'))); await p.evaluate(() => DPApp.A.genStep(3)); ok('الإعداد: المرحلة وصيغة الحرق الأساسي (Cunningham = 500 + 22×الكتلة الخالية)');
  await p.click('.gensetup [data-a="genStep"][data-v="4"]'); await p.waitForSelector('.genplan'); await p.click('.genplan [data-a="genBuild"]'); await p.waitForSelector('.genplan[data-st]:not([data-st=""])');
  assert.strictEqual(await p.locator('.genplan li').count(), 7); assert(/سعرة مقابل/.test(await p.textContent('.genplan'))); ok('التوليد بمحرك الرياضيين، وفحص كل يوم بحالة وسبب (' + await p.getAttribute('.genplan', 'data-st') + ')');
  const pj = await p.evaluate(() => JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.days)); assert(!pj.includes('تونة معلبة')); ok('المستبعد لا يظهر في الخطة');
  await p.click('.genplan [data-a="genStep"][data-v="5"]'); await p.waitForSelector('.gensend'); assert.strictEqual(await p.locator('.gensend li').count(), 7); ok('المراجعة والإرسال بالأيقونة والنص لكل يوم');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات المرحلة 9');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
