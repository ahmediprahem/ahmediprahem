// 1.62 شاشة الدخول بتصميم صفحة الاستقبال: لوحة الصورة على الحاسوب، البطاقة نفسها بحقولها، الجوال عمود واحد، وتخصيص المدير للخلفية يُحترم
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), U = fileUrl(path.resolve(__dirname, '../worker/site/public/index.html'));
  let p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(U); await p.waitForSelector('#gate.g161 #gcard');
  const d = await p.evaluate(() => ({ side: document.querySelector('.g161s').getBoundingClientRect().width, img: document.querySelector('.g161ph img').naturalWidth, bg: getComputedStyle(document.querySelector('#gate')).backgroundColor, card: getComputedStyle(document.querySelector('#gcard')).backgroundColor, logo: getComputedStyle(document.querySelector('#gsp .hx-word') || document.querySelector('#gsp')).color, sw: document.documentElement.scrollWidth }));
  assert(d.side > 500 && d.img > 0, JSON.stringify(d)); assert.strictEqual(d.card, 'rgb(255, 255, 255)'); assert.strictEqual(d.bg, 'rgb(245, 250, 249)'); assert.strictEqual(d.sw, 1440); assert.notStrictEqual(d.logo, 'rgb(255, 255, 255)');
  ok('الحاسوب: لوحة الصورة والعنوان بجانب البطاقة، خلفية فاتحة، بطاقة بيضاء، والشعار داكن مقروء');
  assert(await p.$('#gate.g161 .g161m > #gsp') && await p.$('#gate.g161 .g161m > #gcard')); assert(await p.$('#gcard button')); ok('نفس #gsp و#gcard وأزرارها (المنطق كما هو)');
  const ls = await p.$$eval('#gate *', (x) => x.filter((e) => /[؀-ۿ]/.test(e.textContent) && parseFloat(getComputedStyle(e).letterSpacing) < 0).length); assert.strictEqual(ls, 0); ok('لا تباعد سالب بين الحروف العربية');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  assert.strictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.g161s')).display), 'none'); assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), 390); ok('الجوال: البطاقة وحدها بلا تمرير جانبي');
  await p.evaluate(() => { window.HGateCfg = { bgType: 'color', bgColor: '#333333' }; }); await p.evaluate(() => { const g = document.querySelector('#gate'); window.G161(g, Object.assign({ splash: 'video', video: '' }, window.HGateCfg)); });
  assert.strictEqual(await p.evaluate(() => document.querySelector('#gate').classList.contains('g161')), false); ok('إن خصّص المدير الخلفية يبقى تخصيصه (التصميم الجديد للخلفية الافتراضية فقط)');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات شاشة الدخول 1.62'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
