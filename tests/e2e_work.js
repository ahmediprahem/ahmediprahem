// أدوات توفير الوقت: قالب من خطة ← تطبيقه «كما هو» و«بسعرات العميل» ← نسخ خطة بين عميلين (والجرامات) ← المواعيد (إضافة، تذكير قبل الموعد، واتساب، ملف تقويم، حضور/غياب، الأجندة)
// ← «من يحتاج اهتمامي اليوم» في الرئيسية (مواعيد اليوم والفائتة، بلا خطة، متابعة مستحقة) مع إخفاء حتى الغد.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  let answer = 'قالب إنقاص الوزن'; p.on('dialog', (d) => d.accept(d.type() === 'prompt' ? answer : undefined));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const mk = async (kind, name, w) => { await p.click('.rail [data-a="new"][data-v="' + kind + '"]'); await p.fill('[data-f="name"]', name); if (w) await p.fill('[data-f="weight"]', String(w)); await p.press('[data-f="name"]', 'Tab'); await p.waitForTimeout(250); };
  const planTab = async () => { await p.click('main .tabs [data-v="plan"]'); };
  const kcal = (c) => Math.round(c.plan.targets ? c.plan.targets.kcal : c.plan.T.days.reduce((a, d) => a + d.kcal, 0) / 7);
  // ---- 1) القالب
  await mk('ex', 'سارة', 95); await planTab(); assert(await p.isVisible('[data-a="wkPick"]')); await p.click('[data-a="gen"]'); await p.waitForSelector('[data-a="wkSaveTpl"]');
  const sara = await C(); await p.click('[data-a="wkSaveTpl"]'); await p.waitForSelector('.toast:has-text("حُفظ القالب")');
  const tpl = await p.evaluate(() => DPApp.S.settings.tpls[0]); assert.strictEqual(tpl.name, 'قالب إنقاص الوزن'); assert.strictEqual(tpl.kind, 'ex'); assert.strictEqual(tpl.kcal, kcal(sara)); assert(!tpl.plan.client && tpl.rx.meals === sara.meals);
  ok('حفظ الخطة قالباً باسم: يُحفظ في الإعدادات (يدخل النسخ والمزامنة) بسعراته وإعداداته وبلا بيانات العميل الشخصية');
  // ---- 2) «كما هو» و«بسعرات العميل»
  const food = sara.plan.days[0].slots[0].lines.find((l) => !l.missing).name;
  await mk('ex', 'منى', 58); await p.evaluate((f) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.avoid = [f]; }, food); await planTab();
  await p.click('[data-a="wkPick"]'); await p.waitForSelector('.wkpick'); assert((await p.textContent('.wkpick')).includes('قالب إنقاص الوزن') && (await p.textContent('.wkpick')).includes('سارة'));
  await p.click('.wkpick [data-a="wkApply"][data-v="t:' + tpl.id + '"][data-m="asis"]'); await p.waitForSelector('.toast:has-text("نُسخت الخطة كما هي")');
  await p.waitForSelector('.toast:has-text("يتجنبه: ' + food + '")', { timeout: 3000 }); let mona = await C();
  assert.strictEqual(kcal(mona), tpl.kcal); assert.strictEqual(+mona.kcalManual, tpl.kcal); assert.strictEqual(mona.plan.client.name, 'منى'); assert(await p.isVisible('.pnav'));
  await mk('ex', 'هند', 58); await planTab(); await p.click('[data-a="wkPick"]'); await p.click('.wkpick [data-a="wkApply"][data-v="t:' + tpl.id + '"][data-m="fit"]'); await p.waitForSelector('.toast:has-text("على بيانات العميل")');
  const hind = await C(); assert(kcal(hind) < tpl.kcal - 100, kcal(hind) + ' vs ' + tpl.kcal); assert.strictEqual(hind.meals, sara.meals); assert.strictEqual(hind.kcalManual, '');
  await p.click('[data-a="wkPick"]'); await p.click('.wkpick [data-a="wkApply"][data-v="c:' + sara.code + '"][data-m="asis"]'); await p.waitForSelector('.toast:has-text("نُسخت")');
  await p.click('main .tabs [data-v="ver"]'); assert((await p.textContent('main')).includes('قبل تطبيق خطة سارة'));
  ok('التطبيق: «كما هو» ينسخ نفس السعرات والأصناف ويثبّت السعرات للعميل وينبّه لما يتجنبه، و«بسعرات العميل» يولّد على بياناته (58 كجم ← سعرات أقل) بنفس عدد الوجبات، والنسخ من عميل آخر، والخطة السابقة تُحفظ إصداراً');
  // ---- 3) نظام الجرامات
  answer = 'جرامات تضخيم'; await mk('ath', 'كابتن', 85); await planTab(); await p.click('[data-a="gen"]'); await p.waitForSelector('[data-a="wkSaveTpl"]'); await p.click('[data-a="wkSaveTpl"]'); await p.waitForSelector('.toast:has-text("حُفظ القالب")');
  const cap = await C(); await mk('ath', 'لاعب', 70); await planTab(); await p.click('[data-a="wkPick"]'); assert(!(await p.textContent('.wkpick')).includes('قالب إنقاص الوزن'), 'قوالب الحصص لا تظهر في الجرامات');
  await p.click('.wkpick [data-a="wkApply"][data-v="c:' + cap.code + '"][data-m="fit"]'); await p.waitForSelector('.toast:has-text("على بيانات العميل")'); const lab = await C();
  assert.strictEqual(lab.plan.kind, 'athlete'); assert.strictEqual(lab.phase, cap.phase); assert(kcal(lab) < kcal(cap), 'وزن أقل ← سعرات أقل');
  ok('نظام الجرامات: قوالب منفصلة لكل نظام، ونسخ المرحلة وجدول التدريب والوجبات ثم توليد على وزن اللاعب');
  // ---- 4) المواعيد
  await p.click('aside .cl:has-text("منى"), .rail [data-a="clToggle"]').catch(() => { }); await p.evaluate(() => DPApp.A.pick(DPApp.S.clients.find((c) => c.name === 'منى').code)); await p.waitForSelector('main .tabs');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.name === 'منى'); c.phone = '0554079404'; });
  await p.click('main .tabs [data-v="appt"]'); await p.waitForSelector('.wktab'); await p.click('[data-a="wkIn"][data-v="14"]'); await p.fill('#wk_t', '10:30'); await p.fill('#wk_note', 'إحضار التحاليل'); await p.click('[data-a="wkAdd"]'); await p.waitForSelector('.toast:has-text("أُضيف الموعد")');
  const soon = new Date(Date.now() + 20 * 60000), pad = (x) => String(x).padStart(2, '0'), dS = soon.getFullYear() + '-' + pad(soon.getMonth() + 1) + '-' + pad(soon.getDate()), tS = pad(soon.getHours()) + ':' + pad(soon.getMinutes());
  await p.fill('#wk_d', dS); await p.fill('#wk_t', tS); await p.selectOption('#wk_type', 'قياس وتحاليل'); await p.click('[data-a="wkAdd"]'); await p.waitForSelector('.wktab .wkappt >> nth=1');
  mona = await C(); assert.strictEqual(mona.appts.length, 2); assert.strictEqual(mona.appts[0].note, 'إحضار التحاليل');
  const wa = await p.getAttribute('.wkappt a[data-wkwa]', 'href'); assert(wa.startsWith('https://wa.me/966554079404?text=') && decodeURIComponent(wa).includes('تذكير بموعدك'), wa);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('[data-a="wkIcs"]').first().click()]); const f = TMP + '/appt.ics'; await dl.saveAs(f); const ics = fs.readFileSync(f, 'utf8');
  assert(ics.includes('BEGIN:VEVENT') && ics.includes('SUMMARY:') && ics.includes('منى') && ics.includes('TRIGGER:-PT30M'));
  await p.evaluate(() => DPApp.wk.tick()); await p.waitForSelector('.toast:has-text("دقيقة: قياس وتحاليل — منى")');
  ok('المواعيد: «بعد أسبوعين» وملاحظة، وتذكير داخل «حصة» قبل الموعد بنصف ساعة، ورابط تذكير واتساب برقم العميل الدولي ونص الموعد، وملف تقويم .ics بتنبيه');
  await p.click('.rail [data-a="appts"]'); await p.waitForSelector('.wkpage'); if (process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, 'w2_agenda.png') }); const ag = await p.textContent('.wkpage'); assert(ag.includes('منى') && ag.includes('قياس وتحاليل'), ag.slice(0, 300));
  assert.strictEqual(await p.textContent('.rail [data-a="appts"] em'), soon.getDate() === new Date().getDate() ? '1' : '', 'شارة مواعيد اليوم');
  await p.selectOption('#wk_c', { label: 'سارة (' + sara.code + ')' }); await p.fill('#wk_d', '2026-01-05'); await p.fill('#wk_t', '09:00'); await p.click('[data-a="wkAdd"]'); await p.waitForSelector('.wklate .wkappt');
  assert((await p.textContent('.wklate')).includes('سارة')); await p.click('.wklate [data-a="wkSt"][data-s="done"]'); await p.waitForSelector('.toast:has-text("سُجّل الحضور")'); assert.strictEqual(await p.locator('.wklate').count(), 0);
  assert.strictEqual((await p.evaluate(() => DPApp.S.clients.find((c) => c.name === 'سارة').appts[0].st)), 'done');
  ok('الأجندة العامة: إضافة موعد لأي عميل، ومجموعات (فائتة/اليوم/غداً/الأسبوع/لاحقاً)، وشارة مواعيد اليوم، وتسجيل الحضور ينقل الموعد من «الفائتة»');
  // ---- 5) من يحتاج اهتمامي اليوم
  await p.evaluate(() => { const S = DPApp.S, old = Date.now() - 50 * 86400000; const h = S.clients.find((c) => c.name === 'هند'); h.plan.generated = new Date(old).toISOString(); h.created = old; const z = S.clients.find((c) => c.name === 'هند'); z.appts = []; S.clients.push(Object.assign({}, S.clients.find((c) => c.name === 'سارة'), { code: 'C0099', name: 'بلا خطة', plan: null, appts: [], created: Date.now() - 3 * 86400000 })); });
  await p.click('.rail [data-a="home"]'); await p.waitForSelector('.wktodo'); const td = await p.textContent('.wktodo');
  for (const s of ['منى', 'موعد اليوم', 'هند', 'متابعة مستحقة', 'بلا خطة']) assert(td.includes(s), 'القائمة بلا: ' + s + ' — ' + td.slice(0, 400));
  assert(!td.includes('سارة'), 'خطة سارة وُلّدت اليوم فلا متابعة مستحقة');
  await p.selectOption('[data-wkset="follow"]', '60'); await p.waitForFunction(() => !document.querySelector('.wktodo').textContent.includes('متابعة مستحقة')); assert.strictEqual(await p.evaluate(() => DPApp.S.settings.work.follow), 60);
  if (process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, 'w1_home.png') });
  await p.click('.wkit:has-text("بلا خطة") [data-a="wkHide"]'); await p.waitForFunction(() => !document.querySelector('.wktodo').textContent.includes('بلا خطة بعد'));
  await p.click('.wkit:has-text("منى") .wkgo'); await p.waitForSelector('.wktab'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'appt');
  ok('«من يحتاج اهتمامي اليوم»: موعد اليوم، ومتابعة مستحقة (آخر تواصل > المدة ولا موعد قادم، والمدة قابلة للتغيير)، وعميل بلا خطة، وإخفاء عنصر حتى الغد، والضغط يفتح التبويب المناسب في ملف العميل');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم'); console.log('\nنجح', n, 'اختبارات أدوات توفير الوقت'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 400)); process.exit(1); });
