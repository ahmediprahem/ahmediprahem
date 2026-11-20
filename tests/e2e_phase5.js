// 1.20 المرحلة 5: المسار اليدوي — حصص صحيحة مع شرح «أقرب حل ممكن»، مؤشر علوي بالجرامات والنسب، لوحة المكتمل والناقص، «عُد لاقتراح النظام»، ونقل حصة بين الوجبات مع حفظ الأصناف
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  // وحدة: النقل يحفظ مجموع اليوم والأصناف
  const c0 = { sex: 'أنثى', age: 30, weight: 80, height: 165, activity: D.settings.activity[1][0], goal: D.settings.goals[1][0], meals: 5, v2: true };
  const p0 = E.planWeek(c0, D, { seed: 1 }), d0 = p0.days[0], before = JSON.stringify(d0.nominal), names = new Set(d0.slots.flatMap((s) => s.lines.map((l) => l.name)));
  const fresh = JSON.parse(JSON.stringify(d0)); E.dayStats(fresh, p0.targets, D); assert.strictEqual(JSON.stringify(fresh.nominal), before); ok('مجاميع اليوم المخزّنة تطابق أسطر الخطة بعد تمريرة الضبط (كانت قديمة)');
  const from = d0.slots.findIndex((s) => s.lines.some((l) => l.g === 0 && l.e >= 1)), to = d0.slots.findIndex((s, i) => i !== from);
  const a0 = E.slotReq(d0.slots[from])[0], b0 = E.slotReq(d0.slots[to])[0]; assert(E.moveEx(p0, 0, 0, from, to, D));
  assert.strictEqual(E.slotReq(d0.slots[from])[0], a0 - 1); assert.strictEqual(E.slotReq(d0.slots[to])[0], b0 + 1); assert.strictEqual(JSON.stringify(d0.nominal), before); assert(d0.slots.flatMap((s) => s.lines.map((l) => l.name)).every((x) => names.has(x)));
  ok('نقل حصة نشويات بين وجبتين: −1 و+1، ومجموع اليوم كما هو، ولا صنف جديد');
  const v = E.countsVals([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], D); assert(v.c === D.EX[0][0] && v.k === D.EX[0][0] * 4 + D.EX[0][1] * 4 + D.EX[0][2] * 9); ok('قيم الحصص من مرجع EX');
  // الواجهة
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'منى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '33'); await p.fill('[data-f="weight"]', '78'); await p.fill('[data-f="height"]', '160'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[1][0]; c.activity = DATA.settings.activity[1][0]; c.conditions = ['أمراض القلب']; c.gen = { step: 4, path: 'manual', week: 'var', fastPat: 1, rev: 1 }; DPApp.S.tab = 'gen'; DPApp.A.tab('gen'); });
  await p.waitForSelector('.genman .genhud'); const hud = await p.textContent('.genhud'); assert(/السعرات/.test(hud) && /جم/.test(hud) && /%/.test(hud) && /الهدف/.test(hud)); ok('المؤشر العلوي: السعرات والكربوهيدرات والبروتين والدهون بالجرامات والنسب مقابل الهدف');
  assert(/أقرب حل ممكن بحصص صحيحة|مطابق للهدف بحصص صحيحة/.test(await p.textContent('.genman'))); ok('شرح صريح: اقتراح النظام مطابق أو «أقرب حل ممكن» مع الفرق (لا يُقال مطابق عن غير مطابق)');
  assert.strictEqual(await p.getAttribute('[data-gc="0"]', 'step'), '1'); const s0 = +(await p.inputValue('[data-gc="0"]')); await p.fill('[data-gc="0"]', String(s0 + 3)); await p.press('[data-gc="0"]', 'Tab');
  await p.waitForSelector('tr[data-g="0"] .warn'); assert(/زائد 3/.test(await p.textContent('tr[data-g="0"]'))); assert(['warn', 'block'].includes(await p.getAttribute('.genhud', 'data-st'))); ok('تعديل الحصص بأعداد صحيحة: اللوحة تقول «زائد 3» والمؤشر يتحوّل من الأخضر');
  await p.fill('[data-gc="5"]', '1').catch(async () => { await p.click('.genman details summary'); await p.fill('[data-gc="5"]', '1'); }); await p.press('[data-gc="5"]', 'Tab'); await p.waitForSelector('.genman .err'); assert(/لحوم عالية الدهون/.test(await p.textContent('.genman .err'))); ok('لحوم عالية الدهون مع أمراض القلب: مانع صريح (قرار المالك)');
  await p.fill('[data-gc="5"]', '0'); await p.press('[data-gc="5"]', 'Tab'); await p.click('[data-a="genReset"]'); await p.waitForFunction(() => !DPApp.S.clients.find((x) => x.code === DPApp.S.cur).baseCounts); assert.strictEqual(+(await p.inputValue('[data-gc="0"]')), s0); ok('«عُد لاقتراح النظام» يعيد الحصص المقترحة');
  await p.click('.genman [data-a="genBuild"]'); await p.waitForSelector('.gengrid'); const cells = await p.locator('.gengrid table tr').count(); assert(cells > 3);
  const pre = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), d = c.plan.days[0]; return { req: d.slots.map((s) => s.lines.filter((l) => l.g === 0).reduce((a, l) => a + l.e, 0)), nom: JSON.stringify(d.nominal) }; });
  const fi = pre.req.findIndex((x) => x >= 1), ti = pre.req.findIndex((x, i) => i !== fi); await p.selectOption('#gen_mg', '0'); await p.selectOption('#gen_mf', String(fi)); await p.selectOption('#gen_mt', String(ti)); await p.click('[data-a="genMove"]'); await p.waitForSelector('.toast:has-text("نُقلت")');
  const post = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), d = c.plan.days[0]; return { req: d.slots.map((s) => s.lines.filter((l) => l.g === 0).reduce((a, l) => a + l.e, 0)), nom: JSON.stringify(d.nominal) }; });
  assert.strictEqual(post.req[fi], pre.req[fi] - 1); assert.strictEqual(post.req[ti], pre.req[ti] + 1); assert.strictEqual(post.nom, pre.nom); ok('شبكة التوزيع على الوجبات و«انقل» حصة: الجدول والخطة يتحدثان ومجموع اليوم ثابت');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات المرحلة 5');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
