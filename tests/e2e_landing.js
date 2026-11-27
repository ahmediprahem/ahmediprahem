// 1.61 صفحة استقبال «زنها Pro» (worker/landing/public): الأقسام، الدخول، الصور، الحركة، الجوال والحاسوب، بلا أخطاء
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), http = require('http'), fs = require('fs');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [], SHOT = process.env.SHOT || '';
const DIR = path.resolve(__dirname, '../worker/landing/public'), T = { html: 'text/html; charset=utf-8', webp: 'image/webp', svg: 'image/svg+xml', woff2: 'font/woff2' };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(DIR, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(DIR) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
  await new Promise((x) => srv.listen(0, '127.0.0.1', x)); const URL = 'http://127.0.0.1:' + srv.address().port + '/', bad = [];
  const b = await chromium.launch();
  for (const [w, h, nm] of [[1440, 900, 'desk'], [390, 844, 'mob']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: SHOT ? 2 : 1 })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('response', (r) => { if (r.status() >= 400) bad.push(r.url()); });
    await p.goto(URL); await p.waitForLoadState('networkidle');
    if (nm === 'desk') {
      assert.strictEqual(await p.getAttribute('html', 'dir'), 'rtl'); assert(/زنها Pro/.test(await p.title()));
      const sec = await p.$$eval('main > section', (x) => x.length); assert(sec >= 8, sec); ok('ثمانية أقسام: الواجهة، لأن كل عميل مختلف، للأخصائي، لعميلك، المساعد الذكي، المميزات، رحلة العميل، المتابعة');
      const hrefs = await p.$$eval('a.btn', (x) => x.map((a) => a.href)); assert(hrefs.length >= 3 && hrefs.every((u) => u === 'https://hessanu.ah6171317.workers.dev/'), hrefs.join()); assert(await p.isVisible('#login .btn')); ok('الدخول: بطاقة في الواجهة الأولى وكل الأزرار إلى زنها Pro نفسه (طريقة الدخول الحالية)');
      const ls = await p.$$eval('*', (x) => x.filter((e) => /[؀-ۿ]/.test(e.textContent) && parseFloat(getComputedStyle(e).letterSpacing) < 0).length); assert.strictEqual(ls, 0); ok('لا تباعد سالب بين الحروف على أي نص عربي');
      for (let y = 0; y < 9000; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(120); }
      const imgs = await p.$$eval('img', (x) => x.map((i) => [i.getAttribute('src'), i.naturalWidth, !!i.alt])); assert(imgs.length >= 10 && imgs.every((i) => i[1] > 0 && i[2]), JSON.stringify(imgs.filter((i) => !i[1] || !i[2]))); ok('كل الصور (' + imgs.length + ') تُحمَّل ولها نص بديل');
      assert(await p.$$eval('.doodles svg', (x) => x.length) >= 15); assert(await p.$$eval('.doodles.on', (x) => x.length) >= 3); ok('رسومات المطبخ الخطية المتحركة في الخلفية وتُرسم عند الظهور');
      await p.click('#acc .item:nth-child(3) button'); await p.waitForTimeout(400); assert.strictEqual(await p.getAttribute('#acc .item:nth-child(3) button', 'aria-expanded'), 'true'); assert(/hand_ai_meal/.test(await p.getAttribute('#accImg img', 'src'))); ok('رحلة العميل: الخطوة تفتح وتتبدل شاشتها');
      await p.click('#deskShow + .dots button:nth-child(2)'); assert.strictEqual(await p.getAttribute('#deskShow img:nth-child(2)', 'class'), 'show'); ok('شاشات زنها Pro تتبدل');
      assert(await p.$eval('#nav', (n) => n.classList.contains('solid'))); ok('الشريط العلوي يصير ثابتاً بخلفية عند النزول');
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    } else { assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), 390); assert(await p.isVisible('#login .btn')); for (let y = 0; y < 12000; y += 700) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(100); } assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), 390); ok('الجوال: عمود واحد بلا تمرير جانبي، وزر الدخول ظاهر'); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); }
    if (SHOT) { await p.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}' }); await p.screenshot({ path: SHOT + '/landing_' + nm + '_top.png' }); await p.screenshot({ path: SHOT + '/landing_' + nm + '_full.png', fullPage: true }); }
  }
  assert.deepStrictEqual(bad, [], bad.join(' | ')); assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا روابط مكسورة ولا أخطاء في وحدة التحكم');
  await b.close(); srv.close(); console.log('\nنجح', n, 'اختبارات صفحة الاستقبال');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); process.exit(1); });
