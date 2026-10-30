// الجوال (0.48): تبويبات العميل الخمسة ظاهرة بلا سحب، جدول اليوم بطاقات وجبات، زر «المساعد» صغير فوق الشريط السفلي، وتذكير النسخة الاحتياطية في الرئيسية.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ ...devices['iPhone 13'], acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p); await p.waitForSelector('#tabbar');
  assert.strictEqual(await p.locator('.bakrem').count(), 0, 'لا تذكير قبل أول عميل');
  await p.evaluate(() => DPApp.A.new('ex')); await p.waitForSelector('[data-f="name"]'); await p.fill('[data-f="name"]', 'منى'); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '160'); await p.fill('[data-f="age"]', '30');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 3 }); await p.waitForTimeout(150);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('main .tabs.ctabs > button')].map((x) => { const r = x.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
  assert(tabs.length === 6 && tabs.every(Boolean), JSON.stringify(tabs)); assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'تمرير أفقي');
  ok('تبويبات العميل الستة (ومنها «الحضور» و«الملف الطبي» و«المواعيد») ظاهرة كلها على شاشة الجوال بلا سحب، ولا تمرير أفقي');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForSelector('.pnav'); await p.click('.pnav button[data-v="0"]'); await p.waitForSelector('table.dt');
  const card = await p.evaluate(() => { const r = document.querySelector('table.dt tr:not(.sum) td.o'), t = document.querySelector('table.dt'); return { block: getComputedStyle(t).display, fits: t.getBoundingClientRect().right <= innerWidth + 1 }; });
  assert(card.block === 'block' && card.fits, JSON.stringify(card));
  ok('جدول اليوم على الجوال بطاقات وجبات داخل عرض الشاشة');
  const fab = await p.evaluate(() => { const f = document.getElementById('dtfab').getBoundingClientRect(), t = document.getElementById('tabbar').getBoundingClientRect(); return { label: document.querySelector('#dtfab span').textContent, w: f.width, h: f.height, above: f.bottom <= t.top + 1 }; });
  assert(fab.label === 'المساعد' && fab.w <= 120 && fab.h <= 44 && fab.above, JSON.stringify(fab));
  ok('زر «المساعد» صغير (≤120×44) بعنوان واضح فوق الشريط السفلي');
  await p.click('#tabbar [data-v="home"]'); await p.waitForSelector('.bakrem'); assert(/لم تأخذ نسخة احتياطية بعد/.test(await p.textContent('.bakrem')));
  await p.click('.bakrem [data-a="bakLater"]'); await p.waitForTimeout(150); assert.strictEqual(await p.locator('.bakrem').count(), 0, 'ذكّرني لاحقاً يخفيه');
  await p.evaluate(() => localStorage.removeItem('hissa_baksnooze')); await p.evaluate(() => DPApp.A.home ? DPApp.A.home() : null); await p.click('#tabbar [data-v="home"]'); await p.waitForSelector('.bakrem');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.bakrem [data-a="export"]')]); assert(/\.json$/.test(dl.suggestedFilename())); await p.waitForTimeout(500); assert.strictEqual(await p.locator('.bakrem').count(), 0, 'يختفي بعد النسخ');
  ok('تذكير النسخة الاحتياطية في الرئيسية بعد أول عميل: «نسخة احتياطية الآن» تنزّلها ويختفي التذكير 7 أيام، و«ذكّرني بعد 3 أيام»');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await b.close(); console.log('\nنجح', n, 'اختبارات الجوال');
})().catch((e) => { console.log('✘', e.message.slice(0, 900)); console.log(errs.join('\n')); process.exit(1); });
