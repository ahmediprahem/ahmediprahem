// 1.40 (قرار المالك): أيقونات Lucide محلية، ومؤشر زنها «Z-Click»، والدفعة الأولى من نظام التخطيط (الهيكل وشاشة «البناء»).
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const URL = fileUrl(path.resolve(__dirname, '../admin.html'));
const gen = async (p) => { await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', 'منى أحمد'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '32'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '163'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 2 }); await p.waitForTimeout(100); await p.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); DPApp.A.genEqBuild(); DPApp.A.genOpen(4); DPApp.A.genEs(3); }); await p.waitForSelector('.genqual'); };
(async () => {
  // ١ الأيقونات
  const src = fs.readFileSync(path.resolve(__dirname, '../src/icons_lucide.js'), 'utf8'), html = fs.readFileSync(path.resolve(__dirname, '../admin.html'), 'utf8');
  assert(/lucide-static 0\.469\.0، ترخيص ISC/.test(src) && fs.existsSync(path.resolve(__dirname, '../assets/licenses/lucide-LICENSE.txt'))); assert(!/https?:\/\/[^"']*lucide|unpkg|jsdelivr/.test(src), 'روابط خارجية');
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(URL); await login(p);
  const ic = await p.evaluate(() => ({ n: Object.keys(window.ZICO || {}).length, users: document.querySelector('aside .sidebtn .ico-users') && document.querySelector('aside .sidebtn .ico-users').innerHTML, want: (() => { const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); d.innerHTML = window.ZICO.users; return d.innerHTML; })(), png: document.querySelectorAll('aside img[src$=".png"]').length }));
  assert.strictEqual(ic.n, 83); assert.strictEqual(ic.users, ic.want, 'أيقونة العملاء ليست من Lucide'); assert.strictEqual(ic.png, 0);
  ok('أيقونات Lucide (83) محلية من الحزمة الرسمية مع ترخيص ISC، وأيقونات الشريط الجانبي منها، بلا روابط خارجية ولا PNG');
  // ٢ التخطيط: 1280 بشريط كامل، والترويسة 64، والحشوة على شبكة 4
  let L = await p.evaluate(() => ({ aside: document.querySelector('aside').getBoundingClientRect().width, label: getComputedStyle(document.querySelector('aside .sidebtn span')).display, hd: document.querySelector('#hd').getBoundingClientRect().height, pad: getComputedStyle(document.querySelector('main')).paddingTop }));
  assert(L.aside >= 240 && L.label !== 'none', JSON.stringify(L)); assert.strictEqual(L.hd, 64); assert.strictEqual(L.pad, '24px');
  ok('1280px: الشريط الجانبي كامل بأسمائه (كان أيقونات)، والترويسة 64، وحشوة اللوحة 24');
  await gen(p); const g = await p.evaluate(() => { const t = document.querySelector('.gentab'); return { gap: getComputedStyle(t).rowGap, qgap: getComputedStyle(document.querySelector('.gqs')).columnGap }; });
  assert.deepStrictEqual(g, { gap: '24px', qgap: '12px' }); ok('شاشة «البناء»: إيقاع 24 بين الأقسام و12 بين بطاقات المؤشرات');
  // ٣ المؤشر
  const cur = await p.evaluate(() => [document.documentElement.classList.contains('zk-on'), /^url\("data:image\/svg\+xml/.test(getComputedStyle(document.body).cursor), getComputedStyle(document.querySelector('.genqual input, #hq')).cursor]);
  assert.deepStrictEqual(cur, [true, true, 'auto']); ok('المؤشر: سهم زنها في الصفحة، والمؤشر الطبيعي في الحقول');
  const bb = await p.locator('.genqual h3').boundingBox(); await p.mouse.move(bb.x + 20, bb.y + 10); await p.mouse.down();
  assert.strictEqual(await p.locator('.zk-fx .zk-rip').count() > 0, true); await p.mouse.up(); await p.waitForTimeout(60);
  const pop = await p.evaluate(() => [document.querySelectorAll('.zk-fx .zk-z').length, getComputedStyle(document.querySelector('.zk-fx')).pointerEvents]);
  assert.deepStrictEqual(pop, [0, 'none'], 'مع تقليل الحركة لا Z'); await p.waitForTimeout(500); assert.strictEqual(await p.locator('.zk-fx').count(), 0, 'التأثير لا يُحذف');
  ok('النقر: تموّج عند الضغط ثم يُحذف، ومع «تقليل الحركة» بلا انبثاق Z، والتأثير لا يعترض النقر');
  const q = await (await br.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); q.on('pageerror', (e) => errs.push(String(e))); await q.goto(URL); await login(q); await q.waitForFunction(() => !document.querySelector('.zk-fx'), null, { timeout: 3000 });
  await q.mouse.move(700, 600); await q.mouse.down(); await q.mouse.up(); await q.waitForTimeout(80); assert.strictEqual(await q.locator('.zk-fx .zk-z').count(), 1); assert.strictEqual(await q.locator('.zk-fx .zk-p').count(), 7);
  const before = await q.locator('.zk-fx').count(); await q.click('#hq'); await q.waitForTimeout(50); assert.strictEqual(await q.locator('.zk-fx').count(), before, 'تأثير داخل حقل الإدخال'); await q.waitForTimeout(950); assert.strictEqual(await q.locator('.zk-fx').count(), 0);
  ok('النقرة: انبثاق Z مع 7 نقاط ثم تلاشٍ؛ ولا تأثير في حقول الإدخال');
  // ٤ الجوال: لا مؤشر، وترويسة 56، وبلا تمرير أفقي في الشاشات الأساسية
  for (const W of [390, 360]) { const m = await (await br.newContext({ ...devices['iPhone 13'], viewport: { width: W, height: 844 }, reducedMotion: 'reduce' })).newPage(); m.on('pageerror', (e) => errs.push(String(e))); m.on('dialog', (d) => d.accept()); await m.goto(URL); await login(m);
    assert.strictEqual(await m.evaluate(() => document.documentElement.classList.contains('zk-on')), false); assert.strictEqual(await m.evaluate(() => document.querySelector('#hd').getBoundingClientRect().height), 56);
    await gen(m); for (const f of [() => DPApp.A.home(), () => { DPApp.A.pick(DPApp.S.clients[0].code); DPApp.A.genOpen(4); DPApp.A.genEs(6); }, () => { DPApp.A.tab('plan'); }]) { await m.evaluate(f); await m.waitForTimeout(200); assert.strictEqual(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, W + ' تمرير أفقي'); } }
  ok('الجوال (390 و360): بلا مؤشر مخصص، والترويسة 56، وبلا تمرير أفقي في «اليوم» و«البدائل» و«الخطة»');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات الأيقونات والمؤشر والتخطيط 1.40');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
