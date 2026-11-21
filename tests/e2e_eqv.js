// 1.26 طريقة الحمية بالبدائل (قرار المالك، الاجتماع 07): المعادلات الثماني بتعليق الاستعمال، تأثير الهضم اختياري، الجدول التركيبي بنسبة الملاءمة 95–105%،
// جدول التوزيع على الوجبات، قائمة الطعام من أطعمة «زنها»، وبناء الأسبوع مطابقاً للشبكة حرفياً، والمسار الجديد هو الافتراضي
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  // ---- وحدات
  const c0 = { sex: 'أنثى', age: 35, weight: 82, height: 162 };
  const ref = { mifflin: 10 * 82 + 6.25 * 162 - 5 * 35 - 161, hb84: 447.593 + 9.247 * 82 + 3.098 * 162 - 4.330 * 35, hb19: 655.0955 + 9.5634 * 82 + 1.8496 * 162 - 4.6756 * 35, fao: 8.7 * 82 + 829, schofield: 8.126 * 82 + 845.6, owen: 795 + 7.18 * 82 };
  Object.keys(ref).forEach((k) => assert(Math.abs(E.bmrOf(Object.assign({ bmrF: k }, c0)).v - ref[k]) < 1e-6, k));
  assert.strictEqual(E.BMRF.length, 8); assert(E.BMRF.every((x) => x[2] && x[3])); assert(/18/.test(E.bmrOf(Object.assign({ bmrF: 'schofield' }, c0, { age: 70 })).note));
  ok('8 معادلات بمعاملاتها المرجعية، ولكل منها تعليق «متى تُستعمل» ومرجع؛ Schofield خارج 18–60 ترجع إلى Mifflin بملاحظة');
  { const hard = {}; for (const sex of ['ذكر', 'أنثى']) for (const w of [55, 95, 130]) for (const gi of [0, 1, 2, 3]) for (const meals of [3, 5, 6]) for (const v2 of [true, false]) { const c = { sex, age: 35, weight: w, height: 165, activity: D.settings.activity[1][0], goal: D.settings.goals[gi][0], meals, v2 }; E.eqvPlan(c, D, {}).days.forEach((d) => d.slots.forEach((s) => E.slotIssues(s, D, c).filter((x) => x.h).forEach((x) => { hard[x.code] = (hard[x.code] || 0) + 1; }))); }
    assert(!hard.MAX && !hard.STARCH2 && !hard.CHEESE2 && !hard.PROT3, JSON.stringify(hard)); ok('لا كميات فوق المعقول ولا نشويان من النوع نفسه ولا ثلاثة بروتينات في وجبة (' + JSON.stringify(hard) + ')'); }
  assert(/أقل من 18/.test(E.bmrOf(Object.assign({}, c0, { age: 15 })).note)); ok('تنبيه: المعادلات للبالغين (العمر أقل من 18)');
  const cl = Object.assign({}, c0, { activity: D.settings.activity[1][0], goal: D.settings.goals[2][0] }), t0 = E.targets(cl, D), t1 = E.targets(Object.assign({}, cl, { eta: true }), D);
  assert(Math.abs(t1.tdee / t0.tdee - 1.1) < 1e-9); ok('تأثير الهضم 10% اختياري (معطّل افتراضياً)');
  assert.deepStrictEqual([E.adequacy(95, 100).st, E.adequacy(105, 100).st, E.adequacy(108, 100).st, E.adequacy(120, 100).st], ['ok', 'ok', 'warn', 'block']); ok('نسبة الملاءمة: أخضر 95–105% (قرار المالك)، كهرماني 90–110%، أحمر خارجها');
  const cx = Object.assign({}, cl, { meals: 5, conditions: [], allergens: ['حساسية البيض'], love: [], avoid: [], favMeals: [], excludedMeals: [], noBank: {}, baseCounts: [7, 0, 3, 5, 0, 0, 0, 2, 0, 3, 2, 5, 0] });
  cx.mealDist = E.suggestDist(cx.baseCounts, 5, D); cx.mealDist[0][0] += 1; cx.mealDist[2][0] -= 1; assert(E.mealDistOk(cx, 5, D));
  const p = E.eqvPlan(cx, D, {}); let bad = 0; p.days.forEach((d) => d.slots.forEach((s) => { const r = E.slotReq(s), md = cx.mealDist[s.si], pool = (a) => a[2] + a[3] + a[4] + a[5]; for (let g = 0; g < 13; g++) if ((g < 2 || g > 5) && Math.abs(r[g] - md[g]) > 0.01) bad++; if (Math.abs(pool(r) - pool(md)) > 0.01) bad++; }));
  assert.strictEqual(bad, 0); assert.strictEqual(p.method, 'eqv'); assert.strictEqual(p.days.length, 7); ok('خطة الأسبوع مطابقة لجدول التوزيع في كل وجبة من الأيام السبعة (اللحوم بصنف بروتين واحد في الوجبة)');
  const ctx = E.ctx(cx, D), names = p.days.flatMap((d) => d.slots.flatMap((s) => s.lines.filter((l) => l.name).map((l) => l.name)));
  assert(names.every((nm) => ctx.ok(D.foods.find((f) => f.n === nm)))); assert(new Set(p.days.map((d) => d.slots[0].lines.map((l) => l.name).join())).size > 1); ok('الأصناف من أطعمة «زنها» بلا محظور (حساسية البيض)، وتتنوّع بين الأيام');
  assert(['ok', 'warn', 'block'].includes(E.checkPlan(p, D).st) && p.phr && p.base); ok('الخطة بصيغة المحرك نفسها: تُفحص وتُطبع وتُرسل');
  // ---- الواجهة
  const br = await chromium.launch(), pg = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); pg.on('pageerror', (e) => errs.push(String(e))); pg.on('dialog', (d) => d.accept());
  await pg.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(pg);
  await pg.evaluate(() => DPApp.A.new('ex')); await pg.fill('[data-f="name"]', 'ليلى'); await pg.selectOption('[data-f="sex"]', 'أنثى'); await pg.fill('[data-f="age"]', '35'); await pg.fill('[data-f="weight"]', '82'); await pg.fill('[data-f="height"]', '162'); await pg.press('[data-f="height"]', 'Tab');
  await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[1][0]; c.activity = DATA.settings.activity[1][0]; c.gen = { step: 4, rev: 1 }; DPApp.A.tab('gen'); });
  await pg.waitForSelector('.geneqv'); assert.strictEqual(await pg.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).gen.path), 'eqv'); assert.strictEqual(await pg.locator('.eqsteps button').count(), 5); ok('«بالبدائل» هو المسار الافتراضي، بخمس خطوات فرعية');
  await pg.selectOption('#geq_f', 'hb84'); await pg.waitForFunction(() => /Roza/.test((document.querySelector('.eqwhen') || {}).textContent || '')); ok('تغيير المعادلة يُظهر تعليق «متى تُستعمل» ومرجعها');
  await pg.click('[data-a="genEs"][data-v="2"]'); await pg.waitForSelector('[data-gm="choPct"]'); await pg.fill('[data-gm="proPct"]', '30'); await pg.press('[data-gm="proPct"]', 'Tab'); await pg.waitForSelector('.geneqv .ad.st-block'); ok('الماكروز بالنسب: المجموع غير 100% يُعلَّم بالأحمر');
  await pg.fill('[data-gm="choPct"]', '40'); await pg.press('[data-gm="choPct"]', 'Tab'); await pg.fill('[data-gm="fatPct"]', '30'); await pg.press('[data-gm="fatPct"]', 'Tab'); await pg.waitForSelector('.geneqv .ad.st-ok');
  await pg.click('.genfoot [data-a="genEs"][data-v="3"]'); await pg.waitForSelector('.eqtbl'); await pg.click('[data-a="genEqSug"]'); await pg.waitForSelector('.eqadq .ad');
  const adq = await pg.locator('.eqadq .ad').allTextContents(); assert.strictEqual(adq.length, 4); ok('الجدول التركيبي: «اقترح» ثم نسبة الملاءمة للطاقة والماكروز (' + adq.join(' ') + ')');
  await pg.click('.genfoot [data-a="genEs"][data-v="4"]'); await pg.waitForSelector('.eqdist'); const inp = pg.locator('[data-gd]').first(), v0 = +(await inp.inputValue()); await inp.fill(String(v0 + 1)); await inp.press('Tab'); await pg.waitForSelector('.eqdist .ad.st-block');
  await pg.click('[data-a="genEqDist"]'); await pg.waitForFunction(() => !document.querySelector('.eqdist .ad.st-block')); ok('جدول التوزيع: تعديل خانة يُظهر عدم التطابق بالأحمر، و«وزّع تلقائياً» يعيد التوازن');
  await pg.click('.genfoot [data-a="genEs"][data-v="5"]'); await pg.waitForSelector('.eqdish select[data-gp]'); const sel = pg.locator('.eqdish select[data-gp]').first(), opt = await sel.locator('option').nth(2).textContent(); await sel.selectOption({ label: opt }); await pg.waitForFunction((o) => [...document.querySelectorAll('.eqdish select[data-gp]')].some((s) => s.value === o), opt);
  await pg.click('[data-a="genEqBuild"]'); await pg.waitForSelector('.genedit');
  const r = await pg.evaluate((o) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return { m: c.plan.method, all: c.plan.days.every((d) => d.slots.some((s) => s.lines.some((l) => l.name === o))) }; }, opt); assert(r.m === 'eqv' && r.all); ok('قائمة الطعام: تثبيت صنف يظهر في كل الأيام، و«ولّد خطة الأسبوع» يبني الخطة ويفتح المحرر والفحص');
  // 1.27: التصدير بعد الانتهاء، الأيام المتعددة، توليد الوجبة تلقائياً، الاستيراد من «زنها»
  await pg.evaluate(() => DPApp.A.tab('gen')); await pg.waitForSelector('.eqexp'); assert(await pg.locator('.eqexp [data-a="hxSendOrInvite"]').count() && await pg.locator('.eqexp [data-v="print"]').count() && await pg.locator('.eqexp [data-v="docx"]').count()); ok('بعد التوليد: شريط تصدير إلى «زنها» وPDF وWord');
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 30000 }), pg.click('.eqexp [data-v="docx"]')]); assert(/\.docx$/.test(dl.suggestedFilename())); ok('تصدير Word من شريط التصدير: ' + dl.suggestedFilename());
  await pg.evaluate(() => { DPApp.A.tab('gen'); DPApp.A.genEs(3); }); await pg.waitForSelector('.eqdays'); await pg.click('[data-a="genEdAdd"]'); await pg.waitForSelector('.eqdays button.on:has-text("اليوم 2")');
  await pg.fill('[data-gc="0"]', String(+(await pg.inputValue('[data-gc="0"]')) - 1)); await pg.press('[data-gc="0"]', 'Tab'); await pg.waitForTimeout(200);
  await pg.click('[data-a="genEd"][data-v="0"]'); await pg.waitForSelector('.eqdays button.on:has-text("اليوم 1")');
  const cnt = await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return [c.eqvDays.length, c.eqvDays[0].cn[0], c.eqvDays[1].cn[0]]; }); assert(cnt[0] === 2 && cnt[2] === cnt[1] - 1, JSON.stringify(cnt)); ok('«＋ يوم جديد»: يومان بجدولين مختلفين، والتنقل بينهما يحفظ كل يوم');
  await pg.evaluate(() => DPApp.A.genEs(5)); await pg.waitForSelector('.eqweek select'); await pg.click('[data-a="genAutoAll"]'); await pg.waitForSelector('.toast:has-text("تلقائياً")'); const pk = await pg.evaluate(() => Object.keys(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).eqvPicks || {}).length); assert(pk > 5); ok('«ولّد كل الوجبات تلقائياً» يختار صنفاً لكل خانة (' + pk + ')');
  await pg.click('[data-a="genEqDist"]').catch(() => { }); await pg.evaluate(() => DPApp.A.genEs(5)); await pg.click('[data-a="genEqBuild"]'); await pg.waitForTimeout(300);
  const wk = await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan.days.map((d) => d.eqvDay); }); assert.deepStrictEqual(wk, [0, 1, 0, 1, 0, 1, 0]); ok('الأسبوع يتناوب بين اليومين افتراضياً، ويُعدَّل من «أيام الأسبوع»');
  await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.hx = { intake: { sex: 'ذكر', age: 41, weight: 95, height: 180, act: 3, goal: 1 } }; c.gen.es = 1; DPApp.A.tab('gen'); }); await pg.waitForSelector('[data-a="genImp"]'); await pg.click('[data-a="genImp"]');
  const im = await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return [c.sex, c.age, c.weight, c.height, c.activity === DATA.settings.activity[3][0]]; }); assert.deepStrictEqual(im, ['ذكر', 41, 95, 180, true]); ok('«استيراد من استبيان زنها» يملأ الجنس والعمر والوزن والطول والنشاط والهدف');
  await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); delete c.hx; });
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات طريقة البدائل');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
