// 1.42 (طلب المالك): أزرار تنقّل عائمة شفافة أسفل الشاشة — السابق، أعلى الصفحة، التالي — بين الصفحات والعملاء والتبويبات وصفحات القياس.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const URL = fileUrl(path.resolve(__dirname, '../admin.html'));
const where = (p) => p.evaluate(() => [DPApp.S.view, DPApp.S.cur, DPApp.S.tab, DPApp.S.mx || ''].join('|'));
(async () => {
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(URL); await login(p);
  await p.waitForSelector('#navfab'); const st = await p.evaluate(() => { const f = getComputedStyle(document.querySelector('#navfab')); return [f.position, /blur/.test(f.backdropFilter || f.webkitBackdropFilter || ''), document.querySelector('#navfab [data-nav="-1"]').disabled]; });
  assert.deepStrictEqual(st, ['fixed', true, true]); ok('الشريط العائم ظاهر أسفل الشاشة، شفاف بتغبيش، و«السابق» معطّل في أول صفحة');
  for (const nm of ['منى أحمد', 'سارة خالد']) { await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', nm); await p.fill('[data-f="weight"]', '80'); await p.press('[data-f="name"]', 'Tab'); }
  const codes = await p.evaluate(() => DPApp.S.clients.map((c) => c.code));
  await p.evaluate((c) => DPApp.A.pick(c), codes[0]); await p.evaluate(() => DPApp.A.mxOpen('w')); await p.evaluate(() => DPApp.A.tab('med')); await p.evaluate((c) => DPApp.A.pick(c), codes[1]);
  const seq = []; seq.push(await where(p));
  for (let i = 0; i < 3; i++) { await p.click('#navfab [data-nav="-1"]'); seq.push(await where(p)); }
  assert.deepStrictEqual(seq, ['client|' + codes[1] + '|ov|', 'client|' + codes[0] + '|med|', 'client|' + codes[0] + '|ov|w', 'client|' + codes[0] + '|ov|']);
  ok('«السابق» يعود خطوة خطوة: عميل آخر ← الملف الطبي ← صفحة الوزن ← نظرة عامة');
  await p.click('#navfab [data-nav="1"]'); assert.strictEqual(await where(p), 'client|' + codes[0] + '|ov|w'); await p.click('#navfab [data-nav="1"]'); assert.strictEqual(await where(p), 'client|' + codes[0] + '|med|');
  await p.evaluate(() => DPApp.A.tab('plan')); assert.strictEqual(await p.evaluate(() => document.querySelector('#navfab [data-nav="1"]').disabled), true, 'فتح صفحة جديدة يلغي «التالي»');
  ok('«التالي» يتقدم، وفتح صفحة جديدة بعد الرجوع يلغي ما بعدها (مثل المتصفح)');
  await p.keyboard.press('Alt+ArrowRight'); assert.strictEqual(await where(p), 'client|' + codes[0] + '|med|'); ok('Alt+→ للسابق وAlt+← للتالي (اتجاه عربي)');
  await p.evaluate(() => { document.querySelector('main').style.minHeight = '3000px'; window.scrollTo(0, 1500); }); await p.click('#navfab [data-nav="0"]'); await p.waitForFunction(() => window.scrollY === 0); ok('«أعلى الصفحة» يعيد التمرير للأعلى');
  const m = await (await br.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage(); m.on('pageerror', (e) => errs.push(String(e))); await m.goto(URL); await login(m); await m.waitForSelector('#navfab');
  const mb = await m.evaluate(() => { const a = document.querySelector('#navfab').getBoundingClientRect(), t = document.querySelector('#tabbar').getBoundingClientRect(); return [a.bottom <= t.top, a.left >= 0 && a.right <= innerWidth, document.documentElement.scrollWidth <= innerWidth + 1]; });
  assert.deepStrictEqual(mb, [true, true, true]); ok('الجوال: الشريط فوق شريط التبويبات السفلي، داخل الشاشة، بلا تمرير أفقي');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات أزرار التنقل العائمة 1.42');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
