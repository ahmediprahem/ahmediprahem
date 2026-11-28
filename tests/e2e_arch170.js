// 1.70 (م2) «خطة جديدة» مدخل واحد («كيف تبدأ؟») + أرشيف الخطط المؤرخ (مشفّر ومضغوط، يُقرأ عند الفتح فقط)
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const mk = async (nm) => { await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', nm); await p.press('[data-f="name"]', 'Tab');
    await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); Object.assign(c, { sex: 'أنثى', age: 32, weight: 84, height: 164, goal: DATA.settings.goals[1][0], activity: DATA.settings.activity[1][0], meals: 4 }); }); };
  await mk('هدى');
  // «كيف تبدأ؟»: زر «خطة جديدة» في الرأس، و«أنشئ الخطة» و«نافذة الأخصائي» يفتحانها
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('main .np170'); await p.click('main .np170'); await p.waitForSelector('.st170');
  assert.strictEqual(await p.locator('.st170 .stopt').count(), 4); assert(await p.isDisabled('.st170 [data-v="copy"]'), 'لا خطة سابقة: «انسخ» معطّل'); await p.keyboard.press('Escape'); assert(!(await p.$('.st170')));
  const entry = await p.$('main [data-a="genOpen"][data-v="1"]'); if (entry) { await entry.click(); await p.waitForSelector('.st170'); await p.click('[data-a="st170x"]'); }
  const pw = await p.$('[data-a="tab"][data-v="pw"]'); if (pw && await pw.isVisible()) { await pw.click(); await p.waitForSelector('.st170'); await p.click('[data-a="st170x"]'); }
  ok('«خطة جديدة» و«أنشئ الخطة» و«نافذة الأخصائي» تفتح شاشة واحدة «كيف تبدأ؟» بأربع طرق (و«انسخ السابقة» معطّل بلا خطة)');
  await p.click('main .np170'); await p.click('.st170 [data-v="auto"]'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'gen'); ok('«تلقائي» يكمل في معالج الخطة نفسه (الخطوة 1)');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan && c.plan.days && c.plan.days.length; });
  const k0 = await p.evaluate(() => JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.target));
  // الأرشيف
  await p.evaluate(() => DPApp.A.tab('ver')); await p.waitForSelector('.ar170'); await p.click('[data-a="arSnap"]'); await p.waitForSelector('.ar170r');
  const raw = await p.evaluate(async () => { const out = []; for (const d of (await indexedDB.databases())) { const db = await new Promise((r) => { const q = indexedDB.open(d.name); q.onsuccess = () => r(q.result); q.onerror = () => r(null); }); if (!db || !db.objectStoreNames.contains('versions')) { if (db) db.close(); continue; } const all = await new Promise((r) => { const q = db.transaction('versions').objectStore('versions').getAll(); q.onsuccess = () => r(q.result); q.onerror = () => r([]); }); all.forEach((x) => out.push({ code: x.code, e: !!x._e, plain: JSON.stringify(x).includes('هدى') })); db.close(); } return out; });
  if (raw.length) { const pg = raw.filter((x) => /^pg:/.test(x.code)); assert.strictEqual(pg.length, 1, JSON.stringify(raw).slice(0, 300)); assert(raw.every((x) => !x.plain), 'لا نص صريح في القاعدة'); }
  assert.strictEqual(await p.evaluate(() => JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.target)), k0);
  ok('«حفظ نسخة الآن»: سجل صغير في «سجل الخطط» وصفحة مضغوطة منفصلة ومشفّرة (لا نص صريح)، والخطة نفسها لم تتغير');
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-a="arOpen"]')]); await pop.waitForSelector('.arbar'); const pt = await pop.textContent('body');
  assert(/أرشيف الخطط/.test(pt) && /هدى/.test(pt) && (await pop.locator('main .page, main section, main table').count()) > 0); await pop.close(); ok('«فتح» يفك الصفحة في نافذة مستقلة للقراءة والطباعة بالتاريخ والسعرات');
  await p.evaluate(() => DPApp.A.html()); await p.waitForTimeout(700); await p.evaluate(() => DPApp.A.tab('ver'));
  assert.strictEqual(await p.locator('.ar170r').count(), 1); assert(/صفحة HTML/.test(await p.textContent('.ar170r'))); ok('التصدير يحفظ تلقائياً، والخطة نفسها لا تتكرر (يُضاف السبب للسجل)');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.plan.note170 = 'أسبوع 2'; }); await p.click('[data-a="arSnap"]'); await p.waitForFunction(() => document.querySelectorAll('.ar170r').length === 2);
  await p.click('.ar170r >> nth=1 >> [data-a="arUse"]'); await p.waitForFunction(() => DPApp.S.tab === 'gen'); await p.waitForTimeout(400);
  assert.strictEqual(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.note170), undefined); assert.strictEqual(await p.evaluate(() => JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.target)), k0);
  ok('«ابدأ من هذه الخطة» يعيد الخطة القديمة كما هي (بعد حفظ الحالية) ويفتح خطوة البناء');
  await p.evaluate(() => DPApp.A.tab('client')); await p.click('main .np170'); assert(!(await p.isDisabled('.st170 [data-v="copy"]'))); await p.click('.st170 [data-v="copy"]'); await p.waitForFunction(() => DPApp.S.tab === 'gen');
  ok('«انسخ الخطة السابقة وعدّلها» يحفظها في السجل ويكمل من خطوة البناء');
  await p.evaluate(() => DPApp.A.tab('ver')); const before = await p.locator('.ar170r').count(); await p.click('.ar170r >> nth=0 >> [data-a="arDel"]'); await p.waitForFunction((b0) => document.querySelectorAll('.ar170r').length === b0 - 1, before);
  ok('حذف خطة من السجل يحذف صفحتها');
  const mine = await p.evaluate(() => DPApp.S.cur); await mk('سلمى'); await p.evaluate(() => DPApp.A.pick(DPApp.S.cur)); await p.evaluate(() => DPApp.A.tab('ver'));
  assert.strictEqual(await p.locator('.ar170r').count(), 0); await p.evaluate((c) => DPApp.A.pick(c), mine); await p.evaluate(() => DPApp.A.tab('ver')); assert(await p.locator('.ar170r').count() >= 1);
  ok('فتح العميل يقرأ سجلاته فقط (عبر الفهرس)');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات المدخل الواحد والأرشيف 1.70'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
