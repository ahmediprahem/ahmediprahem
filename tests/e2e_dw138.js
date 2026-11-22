// 1.38 (قرار المالك): نظام ألوان Digital Wellness — النهاري أساسي، والليلي خيار يحدده الأخصائي من الترويسة ويُحفظ على الجهاز.
// ألوان فقط: الرموز الدلالية، الأزرار الأساسية Teal بنص أبيض (نهاري) وMint بنص كحلي (ليلي)، ثلاث طبقات في الليلي، الشعار المناسب، وتباين AA للنصوص.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const URL = fileUrl(path.resolve(__dirname, '../admin.html'));
const probe = (p) => p.evaluate(() => {
  const L = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const bgOf = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor, a = /rgba/.test(c) ? +c.match(/[\d.]+/g)[3] : 1; if (c && a >= 0.5) return c; e = e.parentElement; } return 'rgb(255, 255, 255)'; };      // الخلفيات شبه الشفافة (< 50%) تُتجاوز إلى ما تحتها
  const cr = (e) => { const a = L(getComputedStyle(e).color), b = L(bgOf(e)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const q = (s) => document.querySelector(s), cs = (s, k) => q(s) ? getComputedStyle(q(s))[k] : null;
  const texts = [...document.querySelectorAll('main h1, main h2, main h3, main .tdk small, main .tdk b, main .zhrow b, main .zhrow small, main .cl b, main .gq small, main .gq b, main td, aside .sidebtn span')].filter((e) => e.getClientRects().length && e.textContent.trim());
  const low = texts.map((e) => [e.textContent.trim().slice(0, 20), Math.round(cr(e) * 100) / 100]).filter((x) => x[1] < 4.5);
  const pb = [...document.querySelectorAll('main summary.newb, main .gennew .gkind, main button:not(.sec):not(.link)')].find((e) => e.matches('summary.newb'));
  return { dw: document.documentElement.dataset.dw, body: cs('body', 'backgroundColor'), main: cs('main', 'backgroundColor'), card: cs('main .tdk', 'backgroundColor'), logo: (q('#hd img.hlogo') || {}).src === (window.ASSETS && window.ASSETS.dark) ? 'dark' : 'light',
    btn: q('#hd .dwbtn') ? [q('#hd .dwbtn').textContent, q('#hd .dwbtn').getAttribute('aria-pressed')] : null, prim: pb ? [getComputedStyle(pb).backgroundColor, getComputedStyle(pb).color, getComputedStyle(pb.querySelector('span') || pb).color] : null, meta: (q('meta[name=theme-color]') || {}).content, low, n: texts.length,
    over: document.documentElement.scrollWidth > innerWidth + 1 };
});
(async () => {
  const br = await chromium.launch(), ctx = await br.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(URL); await login(p);
  for (const [nm, sx] of [['خالد عمر', 'ذكر'], ['ريم حسن', 'أنثى']]) { await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', nm); await p.selectOption('[data-f="sex"]', sx); await p.press('[data-f="name"]', 'Tab'); }
  await p.evaluate(() => DPApp.A.home()); await p.waitForSelector('main .tdk');
  let s = await probe(p);
  assert.strictEqual(s.dw, 'light'); assert.strictEqual(s.body, 'rgb(244, 247, 250)'); assert.deepStrictEqual(s.btn, ['☾', 'false']); assert.strictEqual(s.logo, 'light');
  assert.deepStrictEqual(s.prim, ['rgb(40, 126, 145)', 'rgb(255, 255, 255)', 'rgb(255, 255, 255)']); assert.deepStrictEqual(s.low, [], JSON.stringify(s.low)); assert(s.n > 10);
  ok('النهاري أساسي: خلفية Ice ‏#F4F7FA، والزر الأساسي Teal ‏#287E91 بنص أبيض، والشعار الفاتح، وكل نصوص «اليوم» (' + s.n + ') ≥ 4.5:1، وزر «☾ الوضع الليلي» في الترويسة');
  await p.click('#hd .dwbtn'); await p.waitForFunction(() => document.documentElement.dataset.dw === 'dark'); await p.waitForTimeout(150); s = await probe(p);
  assert.strictEqual(s.body, 'rgb(14, 28, 43)'); assert.strictEqual(s.main, 'rgb(23, 45, 67)'); assert.strictEqual(s.card, 'rgb(31, 58, 84)'); assert.strictEqual(s.logo, 'dark'); assert.deepStrictEqual(s.btn, ['☀', 'true']); assert.strictEqual(s.meta, '#0E1C2B');
  assert.deepStrictEqual(s.prim, ['rgb(87, 201, 179)', 'rgb(14, 28, 43)', 'rgb(14, 28, 43)']); assert.deepStrictEqual(s.low, [], JSON.stringify(s.low));
  ok('الليلي بضغطة: ثلاث طبقات (خلفية #0E1C2B، سطح #172D43، بطاقة #1F3A54)، والزر الأساسي Mint بنص كحلي، والشعار الداكن، وكل النصوص ≥ 4.5:1');
  await p.reload(); await login(p); await p.waitForSelector('#hd .dwbtn'); s = await probe(p); assert.strictEqual(s.dw, 'dark'); assert.deepStrictEqual(s.btn, ['☀', 'true']); ok('اختيار الأخصائي يُحفظ على الجهاز ويبقى بعد إعادة الفتح');
  // شاشة البناء في الليلي: لوحة الجودة والجدول والحقول
  await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', 'منى أحمد'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '32'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '163'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 2 }); await p.waitForTimeout(150);
  await p.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); DPApp.A.genEqBuild(); DPApp.A.genOpen(4); DPApp.A.genEs(3); }); await p.waitForSelector('.genqual'); s = await probe(p);
  assert.deepStrictEqual(s.low, [], JSON.stringify(s.low)); const inp = await p.evaluate(() => { const e = document.querySelector('.eqtbl input'); const c = getComputedStyle(e); return [c.backgroundColor, c.color]; }); assert.deepStrictEqual(inp, ['rgb(19, 38, 58)', 'rgb(234, 241, 245)']);
  ok('الليلي في «البناء»: لوحة الجودة والجدول التركيبي بنصوص مقروءة، والحقول بسطح #13263A ونص فاتح');
  await p.click('#hd .dwbtn'); await p.waitForFunction(() => document.documentElement.dataset.dw === 'light'); s = await probe(p); assert.strictEqual(s.logo, 'light'); assert.deepStrictEqual(s.low, [], JSON.stringify(s.low)); ok('العودة إلى النهاري بالزر نفسه («☀ الوضع النهاري»)');
  // المظاهر الأخرى: لا زر ولا ألوان ليلية
  await p.evaluate(() => { localStorage.setItem('hissa_dw', 'dark'); DPApp.S.settings.ui = Object.assign({}, DPApp.S.settings.ui, { theme: 'zenha' }); DPApp.A.themeToggle(); }); await p.waitForFunction(() => document.documentElement.dataset.theme === 'glass' && document.documentElement.dataset.tone === '');
  assert.strictEqual(await p.locator('#hd .dwbtn').count(), 0); assert.strictEqual(await p.evaluate(() => document.documentElement.dataset.dw), 'light');
  await p.evaluate(() => { localStorage.removeItem('hissa_dw'); DPApp.S.settings.ui.theme = 'legacy'; DPApp.A.themeToggle(); }); await p.waitForSelector('#hd .dwbtn');
  ok('المظاهر القديمة (الزجاجي وغيره) بلا زر الليلي ولا يتأثر لونها');
  // الجوال
  const m = await (await br.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage(); m.on('pageerror', (e) => errs.push(String(e))); await m.goto(URL); await login(m);
  assert(await m.isVisible('#hd .dwbtn')); s = await probe(m); assert(!s.over); await m.click('#hd .dwbtn'); await m.waitForFunction(() => document.documentElement.dataset.dw === 'dark'); s = await probe(m); assert(!s.over); assert.deepStrictEqual(s.low, [], JSON.stringify(s.low));
  ok('الجوال: الزر ظاهر في الترويسة، وبلا تمرير أفقي في الوضعين');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات الوضعين النهاري والليلي 1.38');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
