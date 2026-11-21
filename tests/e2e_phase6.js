// 1.21 المرحلة 6: المطابقة المرنة (A/B/C/D بالقيمة) والبدائل (3 أنواع بفرق السعرات وسبب الترشيح)، وتعديل الكمية يحدّث اليوم، والتعويض في باقي اليوم، وفحص تفضيلات العميل قبل الإرسال
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const c0 = { sex: 'أنثى', age: 30, weight: 80, height: 165, activity: D.settings.activity[1][0], goal: D.settings.goals[1][0], meals: 5, v2: true };
  // A: وجبة البنك تُقارن بالقيمة؛ نصيب الوجبة هو حصص الوجبة نفسها فتكون مطابقة
  const bank = D.bank.filter((b) => b.on)[0], prof = new Array(13).fill(0); bank.ing.forEach((i) => { const f = D.foods.find((x) => x.n === i.n); if (f) prof[f.g] += i.e; });
  const M = E.mealMatch(c0, prof, null, D, 50), me = M.find((m) => m.n === bank.n); assert(me && me.lvl === 'A', JSON.stringify(me && me.lvl)); ok('وجبة حصصها مطابقة لنصيب الوجبة: المستوى A «مطابقة»');
  const lean = prof.slice(); const mi = [2, 3, 4, 5].find((g) => lean[g] > 0); if (mi != null) { const tg = lean.slice(); const to = mi === 4 ? 3 : 4; tg[to] += tg[mi]; tg[mi] = 0; const mm = E.mealMatch(c0, tg, null, D, 200).find((m) => m.n === bank.n); assert(mm && mm.lvl !== 'A' && mm.dv && 'k' in mm.dv); ok('درجة لحم مختلفة: تُقارن بقيمة البروتين والدهون فتكون «' + E.MATCH_AR[mm.lvl] + '» بفرق ' + Math.round(mm.dv.k) + ' سعرة (الكبسة)'); }
  const p0 = E.planWeek(c0, D, { seed: 3 }); let ch = null; p0.days.forEach((d, di) => d.slots.forEach((s, si) => s.lines.forEach((l, li) => { if (!ch && /جبن/.test(l.name)) ch = { di, si, li, l, s }; })));
  const S = E.subs(ch.l, ch.s.type, p0, D, 12); assert(S.some((x) => x.type === 1) && S.every((x) => typeof x.dk === 'number' && x.why)); assert(/جبن|ريكوتا|لبنة/.test(S.filter((x) => x.type === 1)[0].name)); ok('بدائل الجبن: النوع 1 جبن آخر أولاً، وكل بديل بفرق السعرات والماكروز وسبب (الجبن)');
  assert(S.filter((x) => x.type === 2).every((x) => Math.abs(x.dk) <= 0.21 * (E.lineMacros(D.foods.find((f) => f.n === ch.l.name), ch.l.e).reduce((a, v, k) => a + (k < 3 ? v * [4, 4, 9][k] : 0), 0)))); ok('النوع 2 (مجموعة قريبة) لا يتجاوز فرقه 20% من سعرات الصنف');
  const x0 = S[0]; E.applySub(p0, ch.di, ch.si, ch.li, x0, D); assert.strictEqual(p0.days[ch.di].slots[ch.si].lines[ch.li].name, x0.name); ok('اختيار بديل يغيّر الصنف والكمية ويعيد حساب اليوم');
  const cx = Object.assign({}, c0, { avoid: ['أرز أبيض'] }); assert(E.prefScan(cx, ['غداء: ⅓ كوب أرز أبيض مع دجاج'], D).some((h) => h.n === 'أرز أبيض')); ok('فحص التفضيلات على نص أي خطة: يجد «أرز أبيض» الذي لا يحبه العميل');
  // الواجهة
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'هدى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '31'); await p.fill('[data-f="weight"]', '75'); await p.fill('[data-f="height"]', '163'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[1][0]; c.activity = DATA.settings.activity[1][0]; c.gen = { step: 4, path: 'eqv', week: 'var', fastPat: 1, rev: 1 }; DPApp.A.tab('gen'); });
  await p.evaluate(() => DPApp.A.genEqBuild()); await p.waitForSelector('.genedit');
  const k0 = await p.textContent('.genedit .genhud .ghc'); const inp = p.locator('.genedit input[data-ge]').first(), e0 = +(await inp.inputValue()); await inp.fill(String(e0 + 2)); await inp.press('Tab');
  await p.waitForFunction((k) => document.querySelector('.genedit .genhud .ghc').textContent !== k, k0); ok('تعديل كمية صنف يحدّث الوجبة واليوم والمتبقي فوراً (الأرز)');
  await p.locator('.genedit [data-a="genSubs"]').first().click(); await p.waitForSelector('.gsubs li'); assert(/سعرة/.test(await p.textContent('.gsubs'))); await p.locator('.gsubs [data-a="genSubPick"]').first().click(); await p.waitForSelector('.toast:has-text("استُبدل")'); ok('«بدائل» في المحرر بفرق السعرات والسبب، و«اختر» يستبدل');
  await p.locator('.genedit [data-a="genMeals"]').nth(2).click(); await p.waitForSelector('.gml li'); assert(/مطابقة|قريبة|قابلة للتعويض|غير مناسبة|لا وجبات/.test(await p.textContent('.gml'))); ok('«وجبة من البنك» تعرض الوجبات بمستوى المطابقة والفرق');
  const pick = p.locator('.gml [data-a="genMealPick"]').first(); if (await pick.count()) { await pick.click(); await p.waitForSelector('.toast:has-text("«")'); ok('اختيار وجبة مرنة يضعها ويعوّض الفرق في باقي اليوم'); }
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), names = c.plan.days[0].slots.flatMap((s) => s.lines.map((l) => l.name)); c.avoid = [names[0]]; DPApp.A.genStep(5); });
  await p.waitForSelector('.gensend .genpref'); assert.strictEqual(await p.getAttribute('.gensend', 'data-st') !== 'ok', true); ok('قبل الإرسال: تنبيه بالأصناف التي لا تناسب تفضيلات العميل');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات المرحلة 6');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
