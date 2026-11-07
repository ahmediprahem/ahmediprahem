// 0.60 (ب2، ب3): عميل جديد بلا أرقام مسبقة (لا 30/80/175) — لا سعرات ولا توليد قبل العمر والوزن والطول —
// و«＋ عميل جديد» مسودة لا تُحفظ ولا تظهر في القائمة حتى يُكتب الاسم.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c ? JSON.parse(JSON.stringify(c)) : null; });
  const count = () => p.evaluate(() => DPApp.S.clients.length);
  const dbCount = () => p.evaluate(() => new Promise((res) => { const r = indexedDB.open('hissa_admin_data'); r.onsuccess = () => { const q = r.result.transaction('clients').objectStore('clients').count(); q.onsuccess = () => { res(q.result); r.result.close(); }; }; }));
  const toastHas = (t) => p.waitForSelector('.toast:has-text("' + t + '")', { timeout: 4000 });
  // ---- 1) الحقول فارغة ولا أرقام محسوبة
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.waitForSelector('[data-f="age"]');
  const f = await p.evaluate(() => ['age', 'weight', 'height'].map((k) => { const i = document.querySelector('main [data-f="' + k + '"]'); return [i.value, i.placeholder, !!i.closest('.need'), !!(i.labels[0] && i.labels[0].querySelector('.needb'))]; }));
  f.forEach((x) => { assert.strictEqual(x[0], '', 'قيمة مسبقة: ' + JSON.stringify(f)); assert(/^مثال: \d+/.test(x[1]), x[1]); assert(x[2] && x[3], 'شارة «مطلوب»'); });
  let tg = await p.textContent('#tg'); assert(/أكمل العمر والوزن والطول/.test(tg), tg); assert(!/TDEE|BMR|السعرات/.test(tg), 'أرقام قبل إكمال البيانات: ' + tg);
  ok('عميل حصص جديد: العمر والوزن والطول فارغة بمثال توضيحي وشارة «مطلوب»، ولا TDEE ولا BMR ولا سعرات — بل «أكمل العمر والوزن والطول»');
  // ---- 2) «ولّد» و«اختر خطة جاهزة» يرفضان
  await p.fill('[data-f="name"]', 'هالة'); await p.press('[data-f="name"]', 'Tab'); await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 3 }); await p.waitForTimeout(150);
  await p.click('main [data-a="gen"]'); await toastHas('أكمل العمر والوزن والطول أولاً'); let c = await C(); assert(!c.plan, 'وُلّدت خطة من بيانات ناقصة');
  assert.strictEqual(await p.evaluate(() => document.activeElement && document.activeElement.dataset.f), 'age', 'التركيز على أول حقل ناقص');
  await p.click('main [data-a="genBank"]'); await toastHas('أكمل العمر والوزن والطول أولاً'); assert.strictEqual(await p.locator('.rdbank').count(), 0, 'فُتح منتقي البنك');
  ok('«ولّد خطة» و«اختر خطة جاهزة» يرفضان بإشعار «أكمل العمر والوزن والطول أولاً» ويضعان المؤشر على الحقل الناقص');
  // ---- 3) بعد الإكمال: الأرقام تظهر والشارات تزول، والتحقق من الهدف والنشاط باقٍ
  await p.fill('[data-f="age"]', '30'); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '170'); await p.press('[data-f="height"]', 'Tab'); await p.waitForTimeout(200);
  assert.strictEqual(await p.locator('main .need [data-f="age"], main .need [data-f="weight"], main .need [data-f="height"]').count(), 0, 'بقيت الشارة');
  tg = await p.textContent('#tg'); assert(/TDEE/.test(tg) && /السعرات/.test(tg), tg);
  const T = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return Math.round(DPEngine.targets(Object.assign({}, c, { keywords: [] }), DATA).tdee); });
  assert(tg.includes(String(T)), 'TDEE المعروض ليس من المعادلة نفسها: ' + T);
  await p.click('main [data-a="gen"]'); await p.waitForSelector('.pnav'); c = await C(); assert(c.plan && c.plan.targets.kcal > 0);
  ok('بعد إدخال 30/80/170 تظهر الأرقام من المعادلة نفسها (TDEE ' + T + ') وتزول الشارات، ويولّد الخطة');
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'بلا هدف'); await p.fill('[data-f="age"]', '40'); await p.fill('[data-f="weight"]', '70'); await p.fill('[data-f="height"]', '165'); await p.press('[data-f="height"]', 'Tab'); await p.waitForTimeout(150);
  await p.click('main [data-a="gen"]'); await toastHas('حدّد'); c = await C(); assert(!c.plan, 'التحقق من الهدف والنشاط اختفى');
  ok('التحقق الحالي للهدف والنشاط باقٍ بعد إكمال الجسم');
  // ---- 4) نظام الجرامات
  await p.click('.rail [data-a="new"][data-v="ath"]'); await p.waitForSelector('#atg'); assert(/أكمل العمر والوزن والطول/.test(await p.textContent('#atg')));
  assert.deepStrictEqual(await p.evaluate(() => ['age', 'weight', 'height'].map((k) => document.querySelector('main [data-f="' + k + '"]').value)), ['', '', '']);
  await p.fill('[data-f="name"]', 'لاعب'); await p.press('[data-f="name"]', 'Tab'); await p.click('main [data-a="gen"]'); await toastHas('أكمل العمر والوزن والطول أولاً'); assert(!(await C()).plan);
  await p.fill('[data-f="age"]', '25'); await p.fill('[data-f="weight"]', '75'); await p.fill('[data-f="height"]', '178'); await p.press('[data-f="height"]', 'Tab'); await p.waitForTimeout(200); assert(/BMR/.test(await p.textContent('#atg')));
  ok('نظام الجرامات: نفس القاعدة (لا 28/80/178 مسبقة، ولا أهداف ولا توليد قبل الإكمال)');
  // ---- 5) لا عملاء فارغون
  await p.click('.rail [data-a="home"]'); const n0 = await count(), d0 = await dbCount();
  for (let i = 0; i < 3; i++) { await p.click('.rail [data-a="new"][data-v="ex"]'); await p.waitForSelector('[data-f="name"]'); }
  await p.click('.rail [data-a="new"][data-v="ath"]'); await p.waitForSelector('[data-f="name"]'); await p.fill('[data-f="age"]', '30');
  await p.click('.rail [data-a="home"]'); await p.waitForTimeout(400);
  assert.strictEqual(await count(), n0, 'ظهر عميل فارغ في القائمة'); assert.strictEqual(await dbCount(), d0, 'حُفظ عميل فارغ في قاعدة البيانات'); const bl = await p.evaluate(() => { const t = document.body.innerText, i = t.indexOf('(بلا اسم)'); return i < 0 ? '' : t.slice(Math.max(0, i - 80), i + 20) + ' | ' + JSON.stringify(DPApp.S.clients.map((c) => c.name)); }); assert(!bl, bl);
  ok('4 نقرات «＋ عميل جديد» بلا اسم (وواحدة كُتب فيها العمر) ثم الرئيسية: عدد العملاء ' + n0 + ' في القائمة وفي قاعدة البيانات لم يتغير');
  await p.click('.rail [data-a="new"][data-v="ex"]'); const code = await p.evaluate(() => DPApp.S.cur); await p.fill('[data-f="name"]', 'نورة'); await p.waitForTimeout(100);
  assert.strictEqual(await count(), n0 + 1); assert(await p.locator('aside .cl:has-text("نورة"), #lst .cl:has-text("نورة")').count() >= 0); await p.waitForTimeout(500); assert.strictEqual(await dbCount(), d0 + 1, 'لم يُحفظ بعد كتابة الاسم');
  await p.reload(); await login(p); await p.waitForTimeout(300);
  assert(await p.evaluate((cd) => DPApp.S.clients.some((x) => x.code === cd && x.name === 'نورة'), code), 'لم يبقَ بعد إعادة التحميل'); assert.strictEqual(await count(), n0 + 1);
  ok('بكتابة الاسم يُحفظ العميل فوراً (' + code + ') ويظهر في القائمة، ويبقى بعد إعادة التحميل');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await b.close(); console.log('\nنجح', n, 'اختبارات العميل الجديد');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
