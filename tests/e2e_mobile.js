// الجوال (0.48): تبويبات العميل الخمسة ظاهرة بلا سحب، جدول اليوم بطاقات وجبات، زر «المساعد» صغير فوق الشريط السفلي، وتذكير النسخة الاحتياطية في الرئيسية.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ ...devices['iPhone 13'], acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p); await p.waitForSelector('#tabbar');
  assert.strictEqual(await p.locator('.bakrem').count(), 0, 'لا تذكير قبل أول عميل');
  await p.evaluate(() => DPApp.A.new('ex')); await p.waitForSelector('[data-f="name"]'); await p.fill('[data-f="name"]', 'منى'); await p.selectOption('[data-f="sex"]', 'ذكر').catch(() => { }); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '160'); await p.fill('[data-f="age"]', '30');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 3 }); await p.waitForTimeout(150);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('main .tabs.ctabs > button')].map((x) => { const r = x.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
  assert(tabs.length === 7 && tabs.every(Boolean), JSON.stringify(tabs)); assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'تمرير أفقي');
  ok('تبويبات العميل السبعة (ومنها «الحضور» و«الملف الطبي» و«المواعيد»، و«زنها» الظاهر دائماً منذ 0.60) ظاهرة كلها على شاشة الجوال بلا سحب، ولا تمرير أفقي');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForSelector('.pnav'); await p.click('.pnav button[data-v="0"]'); await p.waitForSelector('table.dt');
  const card = await p.evaluate(() => { const r = document.querySelector('table.dt tr:not(.sum) td.o'), t = document.querySelector('table.dt'); return { block: getComputedStyle(t).display, fits: t.getBoundingClientRect().right <= innerWidth + 1 }; });
  assert(card.block === 'block' && card.fits, JSON.stringify(card));
  ok('جدول اليوم على الجوال بطاقات وجبات داخل عرض الشاشة');
  // 0.60 (ب9): في صفحة يوم الخطة على 390 لا تتراكب الطبقات العائمة: حبة المساعد مخفية («المساعد» في الرأس)، والمؤشر شريط ثابت تحت الرأس داخل المحتوى
  const ov = await p.evaluate(() => { const R = (e) => { if (!e) return null; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; }; const x = (a, b) => !!(a && b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b);
    const tb = R(document.getElementById('tabbar')), fab = R(document.getElementById('dtfab')), hd = document.getElementById('hud'), hud = R(hd), ha = R(document.querySelector('header .hdast'));
    return { tb: !!tb, fab: !!fab, hud: !!hud, hudPos: hd && getComputedStyle(hd).position, hudInMain: !!(hd && hd.closest('main')), ha: !!ha, x: [x(tb, fab), x(tb, hud), x(fab, hud)] }; });
  assert(ov.tb && !ov.fab && ov.ha && ov.hud && ov.hudPos === 'sticky' && ov.hudInMain && ov.x.every((v) => !v), JSON.stringify(ov));
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(200);
  const cov = await p.evaluate(() => { const t = document.querySelector('table.dt').getBoundingClientRect(), b = document.getElementById('tabbar').getBoundingClientRect(); return { tb: t.bottom, bar: b.top }; }); assert(cov.tb <= cov.bar + 1, 'الشريط السفلي يغطي آخر الجدول: ' + JSON.stringify(cov));
  await p.click('header .hdast'); await p.waitForSelector('#dtp.open'); await p.click('.dtx');
  ok('صفحة يوم الخطة على 390: حبة المساعد مخفية و«المساعد» في الرأس يفتح اللوحة، والمؤشر شريط ثابت تحت الرأس، ولا تقاطع بين شريط التبويب والمساعد والمؤشر، وآخر الجدول فوق الشريط السفلي');
  await p.click('main .tabs [data-v="client"]'); await p.waitForTimeout(150);
  const fab = await p.evaluate(() => { const f = document.getElementById('dtfab').getBoundingClientRect(), t = document.getElementById('tabbar').getBoundingClientRect(); return { label: document.querySelector('#dtfab span').textContent, w: f.width, h: f.height, above: f.bottom <= t.top + 1 }; });
  assert(fab.label === 'المساعد' && fab.w <= 120 && fab.h <= 44 && fab.above, JSON.stringify(fab));
  ok('خارج صفحة الخطة: زر «المساعد» صغير (≤120×44) بعنوان واضح فوق الشريط السفلي');
  await p.click('#tabbar [data-v="home"]'); await p.waitForSelector('.bakrem'); assert(/لم تأخذ نسخة احتياطية بعد/.test(await p.textContent('.bakrem')));
  await p.click('.bakrem [data-a="bakLater"]'); await p.waitForTimeout(150); assert.strictEqual(await p.locator('.bakrem').count(), 0, 'ذكّرني لاحقاً يخفيه');
  await p.evaluate(() => localStorage.removeItem('hissa_baksnooze')); await p.evaluate(() => DPApp.A.home ? DPApp.A.home() : null); await p.click('#tabbar [data-v="home"]'); await p.waitForSelector('.bakrem');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.bakrem [data-a="export"]')]); assert(/\.json$/.test(dl.suggestedFilename())); await p.waitForTimeout(500); assert.strictEqual(await p.locator('.bakrem').count(), 0, 'يختفي بعد النسخ');
  ok('تذكير النسخة الاحتياطية في الرئيسية بعد أول عميل: «نسخة احتياطية الآن» تنزّلها ويختفي التذكير 7 أيام، و«ذكّرني بعد 3 أيام»');
  // 0.60: على 1440 الزر العائم لا يغطي «اختر هذه الخطة» (المحتوى يأخذ مسافة سفلية بقدره)
  const w = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); w.on('pageerror', (e) => errs.push(String(e))); await w.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(w);
  await w.click('.rail [data-a="new"][data-v="ex"]'); await w.fill('[data-f="name"]', 'سارة'); await w.selectOption('[data-f="sex"]', 'ذكر').catch(() => { }); await w.fill('[data-f="age"]', '30'); await w.fill('[data-f="weight"]', '80'); await w.fill('[data-f="height"]', '165'); await w.selectOption('[data-f="goal"]', { index: 2 }); await w.selectOption('[data-f="activity"]', { index: 3 }); await w.press('[data-f="height"]', 'Tab');
  await w.click('main [data-a="genBank"]'); await w.waitForSelector('.rdbank [data-a="rdApprove"]', { timeout: 20000 }); await w.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await w.waitForTimeout(200);
  const hid = await w.evaluate(() => { const f = document.getElementById('dtfab').getBoundingClientRect(); return [...document.querySelectorAll('[data-a="rdApprove"]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.left < f.right && f.left < r.right && r.top < f.bottom && f.top < r.bottom; }).length; });
  assert.strictEqual(hid, 0, 'الزر العائم يغطي «اختر هذه الخطة»'); ok('على 1440 بعد التمرير لآخر «اختر خطة جاهزة»: الزر العائم لا يغطي أي «اختر هذه الخطة»');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await b.close(); console.log('\nنجح', n, 'اختبارات الجوال');
})().catch((e) => { console.log('✘', e.message.slice(0, 900)); console.log(errs.join('\n')); process.exit(1); });
