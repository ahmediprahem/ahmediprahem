// جودة نظام الحصص (0.38): خيارات نمط الوجبات للعميل (المطبخ/الميزانية/نمط الحياة/الأصناف غير الشائعة) + خانة «السناك بأصناف القاعدة»
// + بروتين السمنة على الوزن المعدّل مع ملاحظة واضحة + صندوق «جودة الخطة» بعد التوليد بلا مخالفات صارمة.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'هالة'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="weight"]', '112'); await p.fill('[data-f="height"]', '160'); await p.press('[data-f="height"]', 'Tab'); await p.waitForTimeout(200);
  await p.waitForSelector('#tg .obn'); const note = await p.textContent('#tg .obn'); assert(/الوزن المعدّل/.test(note) && /BMI ≥ 30/.test(note), note);
  let c = await C(); const T = await p.evaluate((x) => DPEngine.targets(x, DATA), c); assert(T.obese && Math.abs(T.pro / T.adjbw - 1.3) < 0.21 && T.pro < 112 * 1.2, JSON.stringify([T.pro, T.adjbw]));
  ok('السمنة: البروتين على الوزن المعدّل (~1.3 جم/كجم) وملاحظة تشرح ذلك ونسب الماكروز');
  await p.click('details.rddd:has([data-bf]) > summary'); await p.check('[data-bf="proActual"]'); await p.waitForTimeout(150); assert(!(await p.isVisible('#tg .obn')), 'الوزن الفعلي يلغي الملاحظة'); c = await C(); assert.strictEqual(c.proRef, 'actual');
  if (!(await p.isVisible('[data-bf="proActual"]'))) await p.click('details.rddd:has([data-bf]) > summary'); await p.uncheck('[data-bf="proActual"]'); await p.waitForSelector('#tg .obn'); c = await C(); assert(!c.proRef);
  ok('خيار «البروتين على الوزن الفعلي» يعمل ذهاباً وإياباً');
  await p.selectOption('[data-f="cuisine"]', 'eg'); await p.selectOption('[data-f="budget"]', '1'); await p.selectOption('[data-f="life"]', 'quick'); if (!(await p.isVisible('[data-nb="S"]'))) await p.click('details.rddd:has([data-bf]) > summary'); await p.check('[data-nb="S"]'); await p.check('[data-nb="B"]'); await p.check('[data-nb="L"]'); await p.check('[data-nb="D"]');
  c = await C(); assert.strictEqual(c.cuisine, 'eg'); assert.strictEqual(String(c.budget), '1'); assert.strictEqual(c.life, 'quick'); assert(c.noBank.S && c.noBank.B && c.noBank.L && c.noBank.D); assert(!c.exotic);
  ok('خيارات نمط الوجبات تُحفظ للعميل: مصري، ميزانية محدودة، تحضير سريع، والسناك بأصناف القاعدة فقط');
  await p.click('[data-a="gen"]'); await p.waitForSelector('#qbox'); c = await C();
  const sum = await p.textContent('#qbox summary'); assert(/جودة الخطة/.test(sum), sum);
  assert(c.plan.days.every((d) => d.slots.every((s) => !s.meal)), 'لا وجبات بنك مع الإيقاف الكامل');
  const by = await p.evaluate(() => { const m = {}; DATA.foods.forEach((f) => { m[f.n] = { r: f.r, cost: f.cost, prep: f.prep, x: f.x, cz: f.cz }; }); return m; });
  const lines = c.plan.days.flatMap((d) => d.slots.flatMap((s) => s.lines.filter((l) => !l.missing).map((l) => Object.assign({ t: s.type }, l))));
  assert(lines.every((l) => !by[l.name] || by[l.name].cost < 3 || (c.love || []).includes(l.name)), 'ميزانية محدودة: لا أصناف مرتفعة التكلفة');
  assert(lines.every((l) => !by[l.name] || !by[l.name].x), 'لا أصناف غير شائعة');
  assert(lines.filter((l) => l.t !== 'L').every((l) => !by[l.name] || by[l.name].prep < 2), 'تحضير سريع: لا طبخ في الفطور والعشاء والسناك');
  const q = await p.evaluate(() => DPEngine.planQuality(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan, DATA)); assert.strictEqual(q.hard, 0, JSON.stringify(q.items.slice(0, 3)));
  assert(sum.includes(q.score + '/100'));
  ok('الخطة تحترم الميزانية والتحضير السريع وتخفي غير الشائع، وصندوق «جودة الخطة» يعرض ' + q.score + '/100 بلا مخالفات صارمة');
  const eg = lines.filter((l) => by[l.name] && by[l.name].cz === 'eg').length, sa = lines.filter((l) => by[l.name] && by[l.name].cz === 'sa').length; assert(eg > sa, 'المطبخ المصري يغلب: ' + eg + ' مقابل ' + sa);
  ok('المطبخ المصري يغلب على الأصناف السعودية (' + eg + ' مقابل ' + sa + ')');
  await b.close(); if (errs.length) { console.log(errs); process.exitCode = 1; }
  console.log('\nنجح', n, 'اختبارات جودة نظام الحصص (الواجهة)');
})().catch((e) => { console.error(e); process.exit(1); });
