// 1.25 واجهة «زنها Pro» على الجوال (الاجتماع 04 وقرارات المالك): لا تمرير أفقي مقارنةً بعرض الشاشة، «التالي» يُنقر بلا قوة في كل خطوة،
// جدول يوم الخطة في الشاشة الأولى، «توليد الخطة» في الشريط السفلي و«المكتبة» في «المزيد»، والطريق من «اليوم» إلى الإرسال بعدد نقرات محدود
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const br = await chromium.launch();
  for (const W of [390, 360]) {
    const p = await (await br.newContext({ ...devices['iPhone 13'], viewport: { width: W, height: 844 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
    await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p); let clicks = 0; const tap = async (sel) => { await p.locator(sel).filter({ visible: true }).first().click({ timeout: 5000 }); clicks++; await p.waitForTimeout(150); };
    const noX = async (where) => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, screen.width]); assert(w[0] <= w[1], where + ' أعرض من الشاشة: ' + w); };
    assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('#tabbar button')].map((b) => b.dataset.v)), ['home', 'clients', 'genTab', 'zchat', 'more']);
    await tap('#tabbar [data-v="genTab"]'); await p.waitForSelector('.genpage'); await noX('قائمة التوليد'); assert(await p.locator('#tabbar button.on[data-v="genTab"]').count());
    await tap('.genpage [data-a="genNew"][data-v="ex"]');
    await p.fill('[data-f="name"]', 'منى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '30'); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '160'); await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 2 }); await p.press('[data-f="height"]', 'Tab');
    await noX('بيانات العميل'); await tap('[data-a="genGo"]'); await p.waitForSelector('.gentab'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'gen'); assert(await p.locator('#tabbar button.on[data-v="genTab"]').count());
    for (const st of [2, 3, 4]) { await noX('الخطوة ' + st); assert(await p.locator('.genstepm').isVisible()); assert(!(await p.locator('.gentab .gensteps').isVisible())); if (st === 2) await tap('[data-a="genRevOk"]'); else if (st === 3) await tap('.genfoot [data-a="genStep"]'); else { await tap('.genman [data-a="genBuild"]'); await p.waitForSelector('.genedit'); await noX('بعد التوليد'); await tap('.genplan [data-a="genStep"][data-v="5"]'); } }
    await p.waitForSelector('.gensend'); assert(clicks <= 8, 'نقرات: ' + clicks); ok(W + 'px: من الشريط السفلي إلى «المراجعة والإرسال» بـ' + clicks + ' نقرات (كانت 12)، و«التالي» يُنقر بلا قوة في كل خطوة، بلا تمرير أفقي');
    const one = await p.evaluate(() => ({ seg: document.querySelectorAll('main .cfseg').length, flat: document.querySelectorAll('main .cftabs.cfflat').length })); assert.deepStrictEqual(one, { seg: 0, flat: 1 }); ok(W + 'px: طبقة تبويب واحدة في ملف العميل وشريط خطوات مضغوط');
    await p.evaluate(() => DPApp.A.tab('plan')); await tap('.pnav button[data-v="0"]'); await p.waitForSelector('main .pg table.dt'); const y = await p.evaluate(() => document.querySelector('main .pg table.dt').getBoundingClientRect().top + scrollY);
    if (y >= 844) { await p.screenshot({ path: '/tmp/claude-0/mob2/fail.png', fullPage: true }); console.log(await p.evaluate(() => [...document.querySelector('main').querySelectorAll(':scope > *, .cfbody > *, .pg > *')].map(e => e.tagName + '.' + String(e.className).slice(0, 25) + ':' + Math.round(e.getBoundingClientRect().top + scrollY) + '+' + Math.round(e.getBoundingClientRect().height)).join(' / '))); }
    assert(y < 844, 'الجدول يبدأ عند ' + y); await noX('يوم الخطة'); ok(W + 'px: جدول يوم الخطة يبدأ داخل الشاشة الأولى (y=' + Math.round(y) + ')');
    const small = await p.evaluate(() => [...document.querySelectorAll('main button, main summary, #tabbar button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); }).length); assert.strictEqual(small, 0); ok(W + 'px: كل الأزرار ≥ 44px في يوم الخطة');
    await p.evaluate(() => DPApp.A.tab('plan')); await p.evaluate(() => DPApp.A.genStep ? DPApp.A.genRevOk() : 0); await p.waitForSelector('.toast'); const t = await p.evaluate(() => { const a = [...document.querySelectorAll('.toast')].pop().getBoundingClientRect(); return a.top; }); assert(t < 140, 'التنبيه عند ' + t); ok(W + 'px: التنبيه المنبثق أعلى الشاشة لا يغطي أزرار الأسفل');
    await tap('#tabbar [data-v="more"]'); assert(await p.locator('.morepage [data-v="library"]').isVisible()); ok(W + 'px: «المكتبة» في «المزيد» (قرار المالك)');
    await p.context().close();
  }
  // الحاسوب لا يتغير
  const d = await (await br.newContext({ viewport: { width: 1300, height: 900 } })).newPage(); await d.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(d);
  await d.evaluate(() => DPApp.A.new('ex')); await d.fill('[data-f="name"]', 'حاسوب'); await d.press('[data-f="name"]', 'Tab'); assert(await d.locator('main .cfseg').count()); assert.strictEqual(await d.locator('main .cfflat').count(), 0); assert.strictEqual(await d.locator('.genstepm:visible').count(), 0); ok('الحاسوب كما هو: تبويبات المجموعات والأقسام بلا تغيير');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات واجهة الجوال');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
