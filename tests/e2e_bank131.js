// 1.31 (قرار المالك): وجبات البنك تُضاف من خطوة «التوزيع على الوجبات» فقط — زر فوق اسم الوجبة، اختيار الوجبة وأيامها، وحصص الوجبة تمتلئ بمجموعاتها تلقائياً ويكمل الأخصائي باقي اليوم
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const C = 'DPApp.S.clients.find((x) => x.code === DPApp.S.cur)';
(async () => {
  const br = await chromium.launch(), p = await (await br.newContext({ ...devices['iPhone 13'] })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', 'منى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '30'); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '160'); await p.selectOption('[data-f="activity"]', { index: 2 }); await p.selectOption('[data-f="goal"]', { index: 2 }); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.favMeals = ['كبسة دجاج بالأرز البسمتي']; c.gen.step = 4; c.gen.rev = 1; DPApp.A.genEs(4); DPApp.A.genEdAdd(); DPApp.A.genEd(0); });
  await p.waitForSelector('.eqdm [data-a="genBk"]'); assert(await p.locator('.eqdm [data-a="genBk"]').count() >= 3); ok('زر «＋ وجبة من البنك» فوق اسم كل وجبة في خطوة التوزيع');
  await p.locator('.eqdm[data-si="2"] [data-a="genBk"]').click(); await p.waitForSelector('.eqbkp .eqbki'); const first = await p.textContent('.eqbki'); assert(/⭐/.test(first), first); assert.strictEqual(await p.locator('[data-bkd]').count(), 2); ok('القائمة بمستوى المطابقة والفرق، ⭐ لما اختاره العميل أولاً، واختيار الأيام (اليوم 1 / اليوم 2)');
  await p.fill('#gen_bkq', 'كبسة'); const vis = await p.evaluate(() => [...document.querySelectorAll('.eqbkl li')].filter((li) => !li.hidden).length); assert(vis >= 1 && vis < await p.locator('.eqbkl li').count()); await p.fill('#gen_bkq', ''); ok('البحث باسم الوجبة');
  await p.check('[data-bkd="1"]'); await p.locator('.eqbki').first().click(); await p.waitForSelector('.eqdm.hasbk');
  const st = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return { row: c.mealDist[2], prof: c.eqvBank[2].prof, d2: c.eqvDays[1].bank && c.eqvDays[1].bank[2] && c.eqvDays[1].md[2], n: c.eqvBank[2].n }; });
  assert.deepStrictEqual(st.row, st.prof); assert.deepStrictEqual(st.d2, st.prof); assert.strictEqual(await p.locator('.eqdm.hasbk [data-a="genStp"]').count(), 0); ok('حصص الوجبة امتلأت تلقائياً بمجموعات «' + st.n + '» في اليومين، وهي مثبّتة (لا ± عليها)');
  await p.evaluate(() => DPApp.A.genEqDist()); await p.waitForTimeout(200); const ok2 = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return [JSON.stringify(c.mealDist[2]) === JSON.stringify(c.eqvBank[2].prof), DPApp.E ? 1 : 1]; }); assert(ok2[0]);
  assert.strictEqual(await p.locator('.eqdt .st-block').count(), 0); ok('«وزّع تلقائياً» يوزّع باقي اليوم حول وجبة البنك فتصبح المجاميع ✓');
  await p.evaluate(() => DPApp.A.genEqBuild()); await p.waitForSelector('.genplan'); const meals = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan.days.map((d) => { const s = d.slots.find((q) => q.si === 2); return s && s.bank ? s.meal : ''; }); }); assert(meals.every((m) => m === st.n), meals.join('|'));
  ok('الخطة: وجبة البنك بمكوناتها في الأيام المختارة (' + meals.filter(Boolean).length + ' أيام)');
  await p.evaluate(() => { DPApp.A.genStep(4); DPApp.A.genEs(4); }); await p.waitForSelector('.eqdm.hasbk'); await p.click('.eqdm.hasbk [data-a="genBkDel"]'); await p.waitForFunction(() => !document.querySelector('.eqdm.hasbk')); assert(!(await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.eqvBank[2]; }))); ok('«إزالة» تحذف وجبة البنك من اليوم وتعيد حصص الوجبة للتوزيع');
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForTimeout(300); assert.strictEqual(await p.locator('#f-favMeals').isVisible(), false); assert.strictEqual(await p.locator('input[data-nb]:visible').count(), 0); ok('لا طريق آخر: «الوجبات المفضلة» و«بأصناف القاعدة فقط» مخفية من بيانات العميل');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات وجبات البنك في التوزيع');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
