// 1.63 صفحة «اليوم» بنظام زنها البصري: نفس العناصر والأزرار والأرقام، التزيين يعمل ويُطفأ، بلا تمرير جانبي
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سارة'); await p.press('[data-f="name"]', 'Tab');
  const acts = async () => p.$$eval('.home.zh [data-a]', (x) => x.map((e) => e.dataset.a + ':' + e.textContent.replace(/\s+/g, ' ').trim()).join('|'));
  await p.evaluate(() => window.ZN_home162.classic(true)); await p.evaluate(() => DPApp.A.home()); await p.waitForSelector('.home.zh'); const before = await acts();
  await p.evaluate(() => window.ZN_home162.classic(false)); await p.evaluate(() => DPApp.A.home()); await p.waitForSelector('.home.zh[data-z162]'); await p.waitForTimeout(200); const after = await acts();
  assert.strictEqual(after, before); ok('نفس الأزرار والإجراءات والنصوص قبل وبعد (شكل فقط)');
  assert(await p.$('html.zt162') && await p.$('.zhw .z162dz svg') && await p.$('.zhins .z162dz svg')); assert.strictEqual(await p.$eval('.zhw h2 .z162hl', (e) => e.textContent.trim()).catch(() => ''), await p.evaluate(() => { const t = document.querySelector('.zhw h2').textContent; return t.split('،').pop().trim(); })); ok('رسومات المطبخ في الترحيب وملخص اليوم، والاسم مميز بالنعناعي');
  assert.strictEqual(await p.$eval('.zhw h2', (e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '')), 'Zenha Head'); assert.strictEqual(await p.$$eval('.home.zh *', (x) => x.filter((e) => /[؀-ۿ]/.test(e.textContent) && parseFloat(getComputedStyle(e).letterSpacing) < 0).length), 0); ok('خط العناوين Alexandria، ولا تباعد سالب على العربي');
  await p.click('.home.zh [data-a="clients"]'); await p.waitForTimeout(300); assert(!(await p.$('.home.zh'))); await p.evaluate(() => DPApp.A.home()); ok('الأزرار تعمل كما كانت (إجمالي العملاء ينقل لقائمة العملاء)');
  for (const w of [390, 1100, 1440]) { await p.setViewportSize({ width: w, height: 850 }); await p.evaluate(() => DPApp.A.home()); await p.waitForTimeout(250); assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), w, 'w' + w); } ok('بلا تمرير جانبي على 390 و1100 و1440');
  await p.evaluate(() => window.ZN_home162.classic(true)); assert(!(await p.$('html.zt162'))); assert.strictEqual(await p.evaluate(() => localStorage.getItem('zn_classic')), '1'); await p.evaluate(() => window.ZN_home162.classic(false)); ok('المظهر السابق متاح (zn_classic) ويُحفظ');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات صفحة اليوم 1.63'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
