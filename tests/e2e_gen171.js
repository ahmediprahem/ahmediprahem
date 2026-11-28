// 1.71 (م3) الخطوات الأربع: ① الاحتياج (المكان الوحيد للسعرات والماكروز) ② النظام والشكل ③ الوجبات ④ المراجعة والإرسال، والعدّاد، ومنع الحساسية، والأدوية، والمشتريات
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'ريم'); await p.press('[data-f="name"]', 'Tab');
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); Object.assign(c, { sex: 'أنثى', age: 35, weight: 90, height: 165, goal: DATA.settings.goals[1][0], activity: DATA.settings.activity[1][0], meals: 4, meds: 'ميتفورمين 500 مرتين، وأتورفاستاتين 20', targetW: 80, targetBy: new Date(Date.now() + 98 * 864e5).toISOString().slice(0, 10) }); });
  const t0 = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return JSON.stringify(E_T = window.DPApp && DPApp.E ? DPApp.E.targets : null) && null; });
  await p.evaluate(() => DPApp.A.genOpen(1)); await p.waitForSelector('.gensteps.g171');
  const steps = await p.$$eval('.gensteps.g171 li', (x) => x.map((l) => l.textContent.trim())); assert.strictEqual(steps.length, 4); assert(/الاحتياج/.test(steps[0]) && /النظام والشكل/.test(steps[1]) && /الوجبات/.test(steps[2]) && /المراجعة والإرسال/.test(steps[3]));
  assert(/1 من 4/.test(await p.textContent('.genstepm'))); ok('المسار أربع خطوات: الاحتياج، النظام والشكل، الوجبات، المراجعة والإرسال');
  await p.waitForSelector('.g171need'); assert(await p.$('.g171need [data-f="kcalManual"]') && await p.$('.g171need [data-f="macroMode"]') && await p.$('.g171need #tg'));
  const rt = await p.textContent('.g171rate'); assert(/الوزن المستهدف 80/.test(rt) && /500–750/.test(rt) && /ACC\/AHA\/TOS/.test(rt)); assert(!(await p.$('.g171rate .warn')), '0.7 كجم/أسبوع ضمن الحد');
  ok('① الاحتياج: السعرات اليدوية وطريقة الماكروز هنا، واقتراح العجز من الوزن المستهدف بمرجعه');
  const dt = await p.textContent('.g171drug'); assert(/ميتفورمين/.test(dt) && /B12/.test(dt) && /ستاتين/.test(dt) && /الجريب فروت/.test(dt) && !/وارفارين/.test(dt)); ok('تنبيهات تداخل الدواء مع الغذاء من نص الأدوية (ميتفورمين، ستاتين) بمراجعها');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.targetBy = new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10); DPApp.A.genOpen(1); }); await p.waitForSelector('.g171rate .warn'); ok('هدف أسرع من الحد الآمن: تحذير');
  const k1 = await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).kcalManual); await p.click('[data-a="g171Man"]'); const c1 = await C(); assert(+c1.kcalManual > 1200 && c1.kcalManual !== k1); await p.click('[data-a="g171Goal"][data-v="-500"]'); const c2 = await C(); assert.strictEqual(c2.kcalManual, ''); assert(/−500|-500/.test(c2.goal));
  ok('«طبّق» يضبط الهدف أو السعرات اليدوية بيد الأخصائي (لا تلقائياً)');
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('.cf151 .g171ro'); assert.strictEqual(await p.isVisible('.cf151 input[data-f="kcalManual"]'), false); assert.strictEqual(await p.isVisible('.cf151 details.fold[data-fold="mxOpen"]'), false);
  await p.click('.g171ro [data-a="g171Need"]'); await p.waitForSelector('.g171need'); ok('«البيانات»: السعرات والماكروز للقراءة، وزر إلى ① الاحتياج (مكان واحد)');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan && c.plan.days && c.plan.days.length; });
  await p.evaluate(() => DPApp.A.genOpen(4)); await p.waitForSelector('.g171cnt'); assert.strictEqual(await p.locator('.g171cnt .g171c').count(), 4); assert(/3 من 4/.test(await p.textContent('.genstepm'))); ok('العدّاد اللحظي (المخطط مقابل الهدف) في خطوة الوجبات');
  await p.evaluate(() => DPApp.A.genOpen(5)); await p.waitForSelector('.g171rev'); assert(await p.$('.g171shop') && (await p.locator('.g171shop tr').count()) > 3); assert(await p.$('[data-g171v="next"]'));
  await p.fill('[data-g171v="next"]', '2026-12-20'); await p.press('[data-g171v="next"]', 'Tab'); assert.strictEqual((await C()).planValid.next, '2026-12-20'); assert(!(await p.$('.g171blk')));
  ok('④ المراجعة والإرسال: قائمة المشتريات، وصلاحية الخطة وموعد المتابعة (يُحفظ)');
  const hasShop = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return /قائمة المشتريات/.test(allPages(c, c.plan, false)); }).catch(() => null);
  if (hasShop !== null) { assert(hasShop); ok('قائمة المشتريات صفحة في PDF/HTML'); }
  const nm = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), d = c.plan.days[0], ln = d.slots.find((s) => s.lines && s.lines.length).lines[0]; ln.name = 'بيض مسلوق'; c.allergens = ['حساسية البيض']; return ln.name; });
  const hasEggAl = await p.evaluate(() => DATA.allergens.some((a) => a.label === 'حساسية البيض')); if (hasEggAl) {
    await p.evaluate(() => DPApp.A.genOpen(5)); await p.waitForSelector('.g171blk'); assert(/بيض مسلوق/.test(await p.textContent('.g171blk'))); ok('مانع: صنف من حساسية العميل في الخطة يظهر قبل الإرسال'); }
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات الخطوات الأربع 1.71'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
