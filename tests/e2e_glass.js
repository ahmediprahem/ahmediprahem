// الثيم الزجاجي (الافتراضي) — التخطيط الجديد: شاشة الدخول بالشعار المتجهي، الأيقونات الخطية بدل الإيموجي، شريط التنقل وعمود العملاء القابل للطي،
// الصفحة الرئيسية، مساحة مؤشر الحصص، والجوال (الشريط السفلي ودرج القائمة) بلا تمرير أفقي.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const ADMIN = fileUrl(path.resolve(__dirname, '../admin.html'));
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  const vis = (sel, pg = p) => pg.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, sel);
  // ---- 1) شاشة الدخول
  await p.goto(ADMIN); await p.waitForSelector('#gate .gcard'); assert.strictEqual(await p.evaluate(() => document.documentElement.dataset.theme), 'glass');
  assert(await vis('#gsp .hxlogo svg .hx-mark')); assert.strictEqual(await p.locator('#gate video').count(), 0); assert.strictEqual(await vis('header'), false);
  assert(/حصة/.test(await p.getAttribute('#gsp .hxlogo svg', 'aria-label'))); ok('شاشة الدخول: شعار «حصة» الجديد متجهي متحرك (بلا فيديو)، بطاقة زجاجية، والترويسة الفارغة مخفية');
  await login(p);
  // ---- 2) الأيقونات الخطية
  const ic = await p.evaluate(() => { const w = [...document.querySelectorAll('.ico-w')]; return { n: w.length, glyphKept: w.every(x => x.querySelector('svg.ico') && x.querySelector('.ico-g').textContent.length > 0), lockText: document.querySelector('header [data-a="lock"]').textContent }; });
  assert(ic.n > 0 && ic.glyphKept, JSON.stringify(ic)); assert(ic.lockText.includes('🔒') && ic.lockText.includes('قفل')); assert(await vis('header [data-a="lock"] svg.ico'));
  assert.strictEqual(await p.locator('.rail .sidebtn svg.ico').count() >= 6, true); ok('الإيموجي في الواجهة يُستبدل بأيقونات SVG خطية، ويبقى الرمز الأصلي مخفياً في النص (البحث والنسخ لا يتأثران)');
  // ---- 3) الرئيسية وعمود العملاء
  assert(await vis('.ghome .hero')); if (await p.evaluate(() => DPApp.S.clients.length)) { assert(await vis('aside .clients #q')); assert.strictEqual(await p.evaluate(() => document.body.classList.contains('clx')), false); } else { assert(!(await vis('aside .clients #q'))); assert.strictEqual(await p.evaluate(() => document.body.classList.contains('clx')), true, '0.46: لا عمود عملاء فارغ'); }
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'سارة الزجاجية'); await p.press('[data-f="name"]', 'Tab');
  assert.strictEqual(await p.evaluate(() => document.body.classList.contains('clx')), true); assert.strictEqual(await vis('aside .clients'), false); assert(await vis('.rail [data-a="clToggle"]'));
  await p.click('.rail [data-a="clToggle"]'); assert(await vis('aside .clients .cl.on')); assert((await p.textContent('aside .clients .cl.on')).includes('سارة')); assert.strictEqual(await p.textContent('aside .clients .cl.on .cav'), 'س');
  await p.click('.rail [data-a="clToggle"]'); assert.strictEqual(await vis('aside .clients'), false);
  await p.click('.rail [data-a="home"]'); assert(await vis('aside .clients')); assert(await vis('.ghome .recent .cl')); assert.strictEqual(await p.textContent('.ghome .stats b'), '1');
  ok('عمود العملاء ظاهر في الرئيسية ويُطوى تلقائياً عند فتح عميل ليتسع المحتوى، ويُفتح ويُغلق من «العملاء»؛ الرئيسية تعرض الإحصاءات وآخر العملاء');
  // ---- 4) بحث الترويسة = بحث العملاء
  await p.fill('#hq', 'زجاج'); assert.strictEqual(await p.inputValue('#q'), 'زجاج'); assert.strictEqual(await p.locator('#lst .cl').count(), 1); await p.fill('#hq', 'لا يوجد'); assert.strictEqual(await p.locator('#lst .cl').count(), 0); await p.fill('#hq', ''); ok('بحث الترويسة يصفّي قائمة العملاء مباشرة');
  // ---- 5) مؤشر الحصص لا يغطي جدول اليوم
  await p.click('.ghome .recent .cl'); await p.click('.tabs button[data-v="plan"]'); await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); if (c && c.kind !== 'athlete') { c.goal = c.goal || DATA.settings.goals[2][0]; c.activity = c.activity || DATA.settings.activity[2][0]; } if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }).then(() => p.click('button:has-text("ولّد خطة جديدة")')); await p.waitForSelector('.pnav button'); await p.click('.pnav button[data-v="0"]'); await p.waitForSelector('#hud .hudr');
  const geo = await p.evaluate(() => { const h = document.getElementById('hud').getBoundingClientRect(), m = document.querySelector('main').getBoundingClientRect(); return { hr: h.right, ml: m.left }; });
  assert(geo.hr <= geo.ml, JSON.stringify(geo)); assert(await vis('.pbar summary.o')); assert.strictEqual(await vis('.pbar [data-a="html"]'), false); await p.click('.pbar summary.o'); assert(await vis('.pbar [data-a="html"]')); await p.click('main h1, main .pnav', { force: true }).catch(() => { }); assert.strictEqual(await vis('.pbar [data-a="html"]'), false, 'القائمة تُغلق بالنقر خارجها');
  const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number), f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const pgStyle = () => p.evaluate(() => { const g = getComputedStyle(document.querySelector('.pg')), f = document.querySelector('.pg table.dt td.f'); return { bg: g.backgroundImage, col: g.color, fcol: f ? getComputedStyle(f).color : '' }; });
  const scr = await pgStyle(); assert(scr.bg.includes('gradient') && lum(scr.col) > 0.8 && lum(scr.fcol) > 0.6, JSON.stringify(scr));
  await p.emulateMedia({ media: 'print' }); const pr = await p.evaluate(() => { const g = getComputedStyle(document.querySelector('.pg')); return { bg: g.backgroundColor, img: g.backgroundImage, col: g.color }; }); await p.emulateMedia({ media: 'screen' });
  assert(pr.bg === 'rgb(255, 255, 255)' && pr.img === 'none' && lum(pr.col) < 0.1, JSON.stringify(pr));
  const [dh] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.querySelectorAll('details.tbm').forEach((d) => { d.open = true; })).then(() => p.click('.pbar [data-a="html"]'))]); const hp = require('./_tmp.js').TMP + '/glass_client.html'; await dh.saveAs(hp); const hh = require('fs').readFileSync(hp, 'utf8');
  assert(!hh.includes('data-theme') && !hh.includes('Hissa Plex') && !hh.includes('saturate(170%)') && !hh.includes('rgba(255,255,255,.085)') && hh.includes('class="pg"'), 'تسرّب الثيم إلى ملف العميل');
  ok('صفحات الخطة على الشاشة بشكل النظام الداكن ونص فاتح واضح، وفي الطباعة وملف HTML للعميل تبقى بيضاء كما هي');
  assert.strictEqual(await p.locator('.pg .ico-w').count(), 0); ok('صفحة اليوم: مؤشر الحصص في مساحة محجوزة لا تغطي الجدول، وكل إجراءات الخطة ظاهرة على الحاسوب، وصفحات الخطة بلا تحويل أيقونات');
  // ---- 6) الجوال
  const m = await b.newContext({ ...devices['Pixel 7'] }), mp = await m.newPage(); mp.on('pageerror', e => errs.push('mobile:' + e)); mp.on('dialog', d => d.accept());
  await mp.goto(ADMIN); await login(mp); await mp.waitForSelector('#tabbar');
  const sw = () => mp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(await vis('#tabbar', mp)); assert.strictEqual(await mp.locator('#tabbar button').count(), 4); assert(await vis('#tabbar button.on[data-v="home"]', mp)); assert.strictEqual(await vis('aside', mp), false); assert(await sw() <= 1);
  const tb = await mp.evaluate(() => { const t = document.getElementById('tabbar').getBoundingClientRect(), f = document.getElementById('dtfab').getBoundingClientRect(); return { tTop: t.top, fBottom: f.bottom, tb: t.bottom, vh: innerHeight }; }); assert(tb.fBottom <= tb.tTop && tb.tb <= tb.vh, JSON.stringify(tb));
  const hts = await mp.evaluate(() => [...document.querySelectorAll('#tabbar button')].map(e => Math.round(e.getBoundingClientRect().height))); assert(hts.every(h => h >= 44), String(hts));
  ok('الجوال: شريط سفلي عائم بأربعة أزرار (≥ 44 بكسل) فوق زر المساعد دون تداخل، والقائمة مطويّة، ولا تمرير أفقي');
  await mp.click('#tabbar [data-v="menu"]'); assert(await vis('aside .clients', mp)); assert(await vis('aside .rail', mp)); assert.strictEqual(await vis('main', mp), false); assert(await vis('#tabbar button.on[data-v="menu"]', mp));
  await mp.click('aside .rail [data-a="new"][data-v="ex"]'); assert.strictEqual(await mp.evaluate(() => document.body.classList.contains('menu')), false); assert(await vis('[data-f="name"]', mp)); assert(await sw() <= 1);
  await mp.click('#tabbar [data-v="settings"]'); await mp.waitForSelector('.tabs [data-a="setTab"]'); assert(await vis('#tabbar button.on[data-v="settings"]', mp)); assert(await sw() <= 1);
  await mp.click('#tabbar [data-v="bank"]'); await mp.waitForSelector('.bank'); assert(await sw() <= 1); await mp.click('#tabbar [data-v="home"]'); assert(await vis('.ghome', mp));
  ok('الجوال: «العملاء» يفتح درجاً بالعملاء والتنقل، واختيار عميل/عميل جديد يغلقه، والإعدادات ومحرر الحصص والرئيسية من الشريط السفلي بلا تمرير أفقي');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم'); console.log('\nنجح', n, 'اختبارات الثيم الزجاجي والتخطيط الجديد'); await b.close();
})().catch(e => { console.log('✘', String(e).slice(0, 1200)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 400)); process.exit(1); });
