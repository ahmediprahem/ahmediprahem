// الاشتراكات في «زنها Pro» (0.89): المتبقي لكل عميل، سجل الاشتراكات والمبالغ، التمديد بلا دفع/بعد الدفع، الإيقاف المؤقت وإيقاف البرنامج، وتنبيه «من يحتاج اهتمامك»
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'سفر طويل' : undefined));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const mk = async (name) => { await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', name); await p.selectOption('[data-f="sex"]', 'أنثى').catch(() => { }); await p.fill('[data-f="age"]', '30'); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '165'); };
  await mk('منى أحمد'); await p.click('[data-a="tab"][data-v="sub"]'); await p.waitForSelector('.subtab');
  assert(/لم يُسجَّل اشتراك/.test(await p.textContent('.subtab')) && /بلا اشتراك/.test(await p.textContent('.sbchip')));
  ok('تبويب «💳 الاشتراك» في ملف العميل: بلا اشتراك قبل التسجيل');
  await p.fill('#sb_am', '150'); await p.selectOption('#sb_mo', '1'); await p.fill('#sb_nm', 'شهري'); await p.click('[data-a="sbPay"]'); await p.waitForSelector('.sbhero.ok');
  let c = await C(); assert.strictEqual(c.sub.status, 'active'); assert.strictEqual(c.sub.pkg, 'شهري'); assert.strictEqual(c.sub.history.length, 1); assert.strictEqual(c.sub.history[0].type, 'start'); assert.strictEqual(c.sub.history[0].amount, 150);
  const left = () => p.evaluate(() => SBX.left(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))); assert.strictEqual(await left(), 30);
  assert(/30/.test(await p.textContent('.sbhero')) || /٣٠/.test(await p.textContent('.sbhero')));
  ok('تسجيل اشتراك شهري بـ150 جنيه: المتبقي 30 يوماً، والحدث «بدء اشتراك» في السجل بالمبلغ والطريقة');
  await p.fill('#sb_am', '250'); await p.selectOption('#sb_mo', '2'); await p.fill('#sb_nm', 'شهران'); await p.selectOption('#sb_me', 'نقداً'); await p.click('[data-a="sbPay"]'); await p.waitForFunction(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).sub.history.length === 2);
  c = await C(); assert.strictEqual(await left(), 90, 'التجديد يُضاف إلى المتبقي'); assert.strictEqual(c.sub.history[1].type, 'renew'); assert.strictEqual(c.sub.history[1].method, 'نقداً');
  const tot = await p.evaluate(() => SBX.paid(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))); assert.strictEqual(tot, 400); assert(/400/.test(await p.textContent('.sbhero')) || /٤٠٠/.test(await p.textContent('.sbhero')));
  ok('التجديد بعد الدفع يُضاف إلى المتبقي (90 يوماً) ومجموع المدفوع 400 جنيه');
  await p.selectOption('#sb_ex', '7'); await p.click('[data-a="sbExt"]'); await p.waitForFunction(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).sub.history.length === 3); c = await C();
  assert.strictEqual(await left(), 97); assert.strictEqual(c.sub.history[2].type, 'extend'); assert.strictEqual(c.sub.history[2].amount, 0); assert.strictEqual(await p.evaluate(() => SBX.paid(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))), 400, 'التمديد لا يغيّر المدفوع');
  ok('التمديد 7 أيام بلا دفع: المتبقي 97، منحة بمبلغ صفر، والمدفوع كما هو');
  await p.click('[data-a="sbPause"]'); await p.waitForSelector('.sbhero.w'); c = await C(); assert.strictEqual(c.sub.status, 'paused'); assert.strictEqual(c.sub.left, 97); assert.strictEqual(await left(), 97);
  ok('الإيقاف المؤقت يجمّد المتبقي (97) ويظهر «موقوف مؤقتاً»');
  await p.click('[data-a="sbResume"]'); await p.waitForSelector('.sbhero.ok'); c = await C(); assert.strictEqual(c.sub.status, 'active'); assert.strictEqual(await left(), 97);
  await p.click('[data-a="sbStop"]'); await p.waitForSelector('.sbhero.no'); c = await C(); assert.strictEqual(c.sub.status, 'stopped'); assert.strictEqual(c.sub.history.pop().note, 'سفر طويل'); assert(/البرنامج متوقف/.test(await p.textContent('.sbchip')));
  ok('الاستئناف يعيد العدّ، وإيقاف البرنامج يسجّل السبب ويُظهر «البرنامج متوقف»');
  await p.fill('#sb_am', '150'); await p.fill('#sb_nm', 'شهري'); await p.click('[data-a="sbPay"]'); await p.waitForSelector('.sbhero.ok'); assert.strictEqual(await left(), 30);
  assert.strictEqual((await p.locator('.sbt tbody tr').count()), 7, 'سجل بكل الأحداث'); ok('دفع جديد بعد الإيقاف يعيد التفعيل من اليوم، والسجل يضم كل الأحداث (7)');
  // عميل ثانٍ ينتهي اشتراكه قريباً + صفحة الاشتراكات العامة + «من يحتاج اهتمامك»
  await mk('سارة علي'); await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); const d = new Date(); d.setDate(d.getDate() + 3); SBX.renew(c, 3, 100, 'فودافون كاش', 'تجريبي', ''); c.sub.end = SBX.day(d); });
  await p.evaluate(() => DPApp.A.subs()); await p.waitForSelector('.subpage'); const rows = await p.locator('.sbrow').allTextContents(); assert(rows.length === 2 && /سارة/.test(rows[0]) && /متبقي 3|٣/.test(rows[0]), rows.join('|'));
  assert(/هذا الشهر/.test(await p.textContent('.sbstats'))); ok('صفحة «الاشتراكات»: الأقرب انتهاءً أولاً (سارة قبل منى) ومؤشرات الفعّال والتجديد والمدفوع');
  await p.evaluate(() => DPApp.A.home()); await p.waitForSelector('.wktodo'); assert(/اشتراكه ينتهي بعد/.test(await p.textContent('.wktodo')), await p.textContent('.wktodo').then((t) => t.slice(0, 200))); ok('«من يحتاج اهتمامك اليوم» ينبّه إلى اشتراك ينتهي خلال 5 أيام');
  await p.evaluate(() => { document.querySelector('.wkgo').click(); }); await p.waitForSelector('.subtab'); ok('اللمس على التنبيه يفتح تبويب الاشتراك للعميل');
  assert.deepStrictEqual(errs, []); await b.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e).slice(0, 1100)); process.exit(1); });
