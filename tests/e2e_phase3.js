// 1.18 المرحلة 3: نواة الفحص (سليم/تنبيه/مانع)، شرح الهدف، صيغ الحرق الأساسي باختيار الأخصائي، شارة مصدر القيم، والسعرات اليدوية تحت الحد الآمن مانعة إلا بتأكيد
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json'), A = require('../src/athlete.js'), AD = require('../src/athlete.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  // ---- وحدات المحرك
  const T = { kcal: 2000, cho: 250, pro: 100, fat: 66 };
  assert.strictEqual(E.checkVals({ k: 2090, c: 260, p: 105, f: 70 }, { k: 2000, c: 250, p: 100, f: 66 }).st, 'ok');
  const w = E.checkVals({ k: 2150, c: 250, p: 100, f: 66 }, T.kcal ? { k: 2000, c: 250, p: 100, f: 66 } : 0); assert.strictEqual(w.st, 'warn'); assert(/السعرات أعلى من الهدف بـ150/.test(w.reasons[0]), w.reasons[0]);
  const b = E.checkVals({ k: 2000, c: 250, p: 75, f: 66 }, { k: 2000, c: 250, p: 100, f: 66 }); assert.strictEqual(b.st, 'block'); assert(/البروتين أقل/.test(b.reasons[0]));
  ok('الحدود المعتمدة: ±5% سعرات و±10% لكل ماكرو = مطابق؛ حتى الضعف = تنبيه؛ بعده = مانع، مع سبب مكتوب');
  const c0 = { sex: 'ذكر', age: 30, weight: 80, height: 178, activity: D.settings.activity[1][0], goal: D.settings.goals[2][0] };
  const m = E.targets(c0, D), k = E.targets(Object.assign({}, c0, { bmrF: 'katch', bf: 15 }), D), cu = E.targets(Object.assign({}, c0, { bmrF: 'cunningham', bf: 15 }), D), nb = E.targets(Object.assign({}, c0, { bmrF: 'katch' }), D);
  assert(Math.abs(m.bmr - (800 + 1112.5 - 150 + 5)) < 1e-6); assert(Math.abs(k.bmr - (370 + 21.6 * 68)) < 1e-6 && k.bmrLabel === 'Katch-McArdle'); assert(Math.abs(cu.bmr - (500 + 22 * 68)) < 1e-6); assert(nb.bmrF === 'mifflin' && nb.warnings.some((x) => /تحتاج نسبة الدهون/.test(x)));
  const ak = A.bmr({ weight: 80, bf: 15 }), ac = A.bmr({ weight: 80, bf: 15, bmrF: 'cunningham' }); assert(ak.method === 'Katch-McArdle' && Math.abs(ac.v - 1996) < 1e-6);
  ok('صيغ الحرق الأساسي: Mifflin وKatch-McArdle (370+21.6×الكتلة الخالية) وCunningham (500+22×)، وبلا نسبة دهون تُستعمل Mifflin بملاحظة؛ وتصحيح اسم صيغة الرياضيين');
  assert(/Mifflin-St Jeor/.test(E.explain(m)) && /معامل النشاط/.test(E.explain(m)) && /الحد الأدنى الآمن 1500/.test(E.explain(m))); ok('سطر الشرح: ' + E.explain(m).slice(0, 80) + '…');
  const lo = E.targets(Object.assign({}, c0, { kcalManual: 1100 }), D), loOk = E.targets(Object.assign({}, c0, { kcalManual: 1100, kcalLowOk: true }), D);
  assert(lo.lowBlock && !loOk.lowBlock && loOk.lowManual && lo.kcal === 1100); const pl = E.planWeek(Object.assign({}, c0, { kcalManual: 1100, conditions: [], allergens: [], love: [], avoid: [], favMeals: [], excludedMeals: [], noBank: {}, meals: 5 }), D, { seed: 1 });
  assert.strictEqual(E.checkPlan(pl, D).st, 'block'); ok('السعرات اليدوية تحت الحد الآمن: الخطة «مانع» حتى يؤكد الأخصائي صراحة');
  assert.strictEqual(E.srcOf(D.foods.find((f) => f.n === 'أرز أبيض'), D), 'avg'); assert.strictEqual(E.srcOf(Object.assign({}, D.foods[0], { src: 'usda' }), D), 'usda'); assert(D.foods.some((f) => E.srcOf(f, D) === 'item')); ok('شارة المصدر: «متوسط مجموعة» لقيم الحصة، و«قيمة الصنف»، و«USDA» حين يُوسم الصنف');
  // الخطط القديمة لا تتغيّر: الأهداف بلا اختيار صيغة = Mifflin كما كانت
  assert.strictEqual(Math.round(E.targets(c0, D).kcal), Math.round((10 * 80 + 6.25 * 178 - 5 * 30 + 5) * D.settings.activity[1][1] + D.settings.goals[2][1])); ok('العملاء الحاليون بلا اختيار صيغة: الأرقام كما كانت (Mifflin)');
  // ---- الواجهة
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'فحص'); await p.selectOption('[data-f="sex"]', 'ذكر'); await p.fill('[data-f="age"]', '30'); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '178'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[2][0]; c.activity = DATA.settings.activity[1][0]; DPApp.A.tab('client'); });
  await p.waitForSelector('#tg .tgx'); assert(/الحرق الأساسي/.test(await p.textContent('#tg .tgx'))); ok('شرح الهدف ظاهر تحت الأرقام في ملف العميل');
  await p.fill('[data-f="kcalManual"]', '1100'); await p.press('[data-f="kcalManual"]', 'Tab'); await p.waitForSelector('#tg .chkb.st-block'); await p.click('[data-a="kcalLowOk"]'); await p.waitForSelector('#tg .chkb.st-warn');
  assert(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).kcalLowOk === true)); await p.fill('[data-f="kcalManual"]', '1050'); await p.press('[data-f="kcalManual"]', 'Tab'); await p.waitForSelector('#tg .chkb.st-block');
  ok('تحت الحد الآمن: حافة حمراء وزر «أؤكد»؛ بعد التأكيد كهرماني، وتغيير الرقم يلغي التأكيد');
  await p.fill('[data-f="kcalManual"]', ''); await p.press('[data-f="kcalManual"]', 'Tab'); await p.evaluate(() => DPApp.A.gen()); await p.waitForSelector('.pnav button'); await p.click('.pnav button[data-v="0"]'); await p.waitForSelector('.pchk[data-st]');
  const st = await p.getAttribute('.pchk', 'data-st'), txt = await p.textContent('.pchk'); assert(['ok', 'warn', 'block'].includes(st)); assert(/الهدف/.test(txt) && /±5%/.test(txt)); assert(await p.locator('.pchk .srcb').count() >= 1);
  const col = await p.evaluate(() => getComputedStyle(document.querySelector('.pchk')).borderTopColor); assert(col !== 'rgba(0, 0, 0, 0)');
  ok('صفحة اليوم: سطر الفحص بحالة «' + st + '» وحافة ملوّنة وشارات مصدر القيم (لا يُطبع)');
  assert.strictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.pchk')).display !== 'none'), true); await p.emulateMedia({ media: 'print' }); assert.strictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.pchk')).display), 'none'); await p.emulateMedia({ media: 'screen' }); ok('سطر الفحص مخفي في الطباعة');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات المرحلة 3');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
