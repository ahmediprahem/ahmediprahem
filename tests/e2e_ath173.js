// 1.73 (م5) نظام الجرامات على المحطات نفسها: الخطوات الأربع، والعدّاد، و«كيف تبدأ؟»، وشريط المحطات، والأرشيف، وتنبيهات الأدوية
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ath')); await p.fill('[data-f="name"]', 'كابتن سامي'); await p.press('[data-f="name"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); Object.assign(c, { sex: 'ذكر', age: 26, weight: 82, height: 180, sport: 'كرة قدم', meds: 'ليفوثيروكسين 50' }); DPApp.A.tab('ov'); });
  await p.waitForSelector('main .st172'); assert.strictEqual(await p.locator('main .st172 .stn').count(), 4); assert(/كرة قدم/.test(await p.textContent('main .st172 .stn >> nth=0')));
  ok('شريط المحطات لعميل الجرامات (① الاستقبال بالرياضة والمرحلة)');
  await p.evaluate(() => DPApp.A.newPlan()); await p.waitForSelector('.st170'); assert(await p.isDisabled('.st170 [data-v="lib"]') && await p.isDisabled('.st170 [data-v="ready"]') && !(await p.isDisabled('.st170 [data-v="auto"]')));
  await p.click('.st170 [data-v="auto"]'); await p.waitForSelector('.gensteps.g171'); assert.strictEqual(await p.locator('.gensteps.g171 li').count(), 4); ok('«كيف تبدأ؟» للجرامات (المكتبة والجاهزة للحصص فقط) ثم الخطوات الأربع نفسها');
  assert(/ليفوثيروكسين/.test(await p.textContent('.g171drug'))); ok('تنبيهات الأدوية في ① لعميل الجرامات');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan && c.plan.days && c.plan.days.length; }, null, { timeout: 15000 });
  await p.evaluate(() => DPApp.A.genOpen(4)); await p.waitForSelector('.g171cnt'); assert.strictEqual(await p.locator('.g171cnt .g171c').count(), 4); ok('العدّاد اللحظي في خطوة الوجبات (متوسط الأيام مقابل هدف كل يوم)');
  await p.evaluate(() => DPApp.A.genOpen(5)); await p.waitForSelector('.g171drug'); ok('④ المراجعة والإرسال: العدّاد وتنبيهات الأدوية');
  await p.evaluate(() => DPApp.A.tab('ver')); await p.waitForSelector('.ar170'); await p.click('[data-a="arSnap"]'); await p.waitForSelector('.ar170r'); ok('أرشيف الخطط يعمل لعميل الجرامات');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات نظام الجرامات على المحطات 1.73'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
