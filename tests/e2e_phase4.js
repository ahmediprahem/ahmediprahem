// 1.19 المرحلة 4: هيكل تبويب «توليد الخطة» — بند جانبي ← قائمة العملاء ← قسم «توليد الخطة» في ملف العميل؛ المراجعة والاستبعاد بالسبب، والإعداد، والخطة بحواف الحالة
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سلمى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '35'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '162'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[1][0]; c.activity = DATA.settings.activity[1][0]; c.allergens = ['حساسية السمك']; c.conditions = ['سكري النوع الثاني']; c.avoid = ['باذنجان']; c.excludedFoods = ['أرز أبيض']; DPApp.A.home(); });
  await p.click('aside [data-a="genTab"]'); await p.waitForSelector('.genpage'); assert(await p.locator('.genpage [data-a="genNew"]').count() === 2); assert(/سلمى/.test(await p.textContent('.genlist'))); ok('البند الجانبي «توليد الخطة» يفتح قائمة العملاء مع «＋ عميل جديد» (حصص وجرامات)');
  await p.click('.genlist [data-a="genPick"]:has-text("سلمى")'); await p.waitForSelector('.gentab'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'gen'); assert(/توليد الخطة/.test(await p.textContent('.cfseg'))); ok('اختيار العميل يفتح ملفه على قسم «توليد الخطة» داخل مجموعة «الخطة»');
  assert.strictEqual(await p.locator('.gensteps li').count(), 5); assert(await p.locator('.gensteps .gs-on:has-text("المراجعة")').count()); ok('شريط خطوات من 5: العميل، المراجعة والاستبعاد، الإعداد، الخطة، المراجعة والإرسال');
  const t = await p.textContent('.genrev'); assert(/حساسية السمك/.test(t) && /استبعده الأخصائي/.test(t) && /لا يحبه/.test(t)); assert(await p.locator('.gx-allergy').count() > 0); ok('كل صنف مستبعد مع سببه: حساسية، استبعده الأخصائي، لا يحبه');
  assert(await p.locator('.genrev details .gx-caution').count() > 0, 'بحذر'); ok('«بحذر» من الحالة الصحية تنبيه فقط في قائمة منفصلة، لا تُستبعد تلقائياً (قرار المالك)');
  await p.click('.gx-manual:has-text("أرز أبيض") [data-a="genUnex"]'); assert(!(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).excludedFoods.includes('أرز أبيض'))));
  await p.fill('#gen_add', 'خيار'); await p.click('[data-a="genAdd"]'); assert(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).excludedFoods.includes('خيار'))); ok('الأخصائي يُرجع صنفاً ويستبعد آخر، في الحقول الحالية (excludedFoods)');
  await p.click('[data-a="genRevOk"]'); await p.waitForSelector('.gensetup'); assert(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).gen.rev > 0)); ok('اعتماد المراجعة ينقل إلى الإعداد');
  assert(await p.locator('.gensetup .dxbox').count()); await p.click('.genopt:has(input[value="fixed"])'); await p.waitForSelector('.genopt.on:has(input[value="fixed"])'); assert.strictEqual(await p.locator('.genfast').count(), 0);
  await p.click('.genopt:has(input[value="fast"])'); await p.waitForSelector('.genfast'); assert.strictEqual(await p.locator('.genfast .genopt').count(), 3); assert(/فطور \+ وجبة خفيفة \+ سحور/.test(await p.textContent('.genfast'))); await p.click('.genfast .genopt:has(input[value="2"])');
  const g = await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).gen); assert(g.week === 'fast' && g.fastPat === 2 && g.path === 'eqv'); ok('الإعداد: نوع النظام، والوجبات، وجاهز أو يدوي، وشكل الأسبوع (ثابت/متغير/صيام الاثنين والخميس بأنماطه الثلاثة)');
  await p.click('.gensetup [data-a="genStep"][data-v="4"]'); await p.waitForSelector('.genplan'); await p.evaluate(() => DPApp.A.genEqBuild()); await p.waitForSelector('.genplan[data-st]:not([data-st=""])');
  const st = await p.getAttribute('.genplan', 'data-st'); assert(['ok', 'warn', 'block'].includes(st)); ok('توليد الخطة من التبويب، وحافة الحالة «' + st + '» من نواة الفحص');
  await p.click('.genplan [data-a="genStep"][data-v="5"]'); await p.waitForSelector('.gensend'); assert.strictEqual(await p.locator('.gensend li').count(), 7); ok('المراجعة والإرسال: حالة كل يوم بأيقونة ونص السبب (لا اللون وحده)');
  await p.click('.gensteps [data-v="2"]'); await p.waitForSelector('.genrev'); ok('الخطوات قابلة للرجوع');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات المرحلة 4');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
