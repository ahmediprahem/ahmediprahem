// 1.75 (ر1أ) جداول حصص بديلة + الفعلي مقابل الاسمي
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
// وحدة: كل الجداول داخل حدود الفحص، والمتوازن = الاقتراح الحالي، ولا يتغير baseSuggestion
const C0 = { sex: 'أنثى', age: 32, weight: 84, height: 164, goal: D.settings.goals[1][0], activity: D.settings.activity[1][0], meals: 4, conditions: [], allergens: [] };
const before = JSON.stringify(E.baseSuggestion(C0, D).counts), A = E.altSuggestions(C0, D), T = E.targets(C0, D);
assert(A.length >= 3 && A.length <= 5, 'عدد الجداول ' + A.length); assert.strictEqual(A[0].id, 'bal'); assert.strictEqual(JSON.stringify(A[0].counts), before); assert.strictEqual(JSON.stringify(E.baseSuggestion(C0, D).counts), before);
A.forEach((a) => { const r = E.checkVals({ k: a.kcal, c: a.ach[0], p: a.ach[1], f: a.ach[2] }, { k: T.kcal, c: T.cho, p: T.pro, f: T.fat }); assert.strictEqual(r.st, 'ok', a.id + ' خارج الحدود'); });
assert(A.some((a) => a.id === 'cho' && a.ach[0] > A[0].ach[0] && a.ach[2] < A[0].ach[2]), 'نشويات أكثر ودهون أقل'); const nm = A.find((a) => a.id === 'nomilk'); if (nm) assert.deepStrictEqual(nm.counts.slice(6, 9), [0, 0, 0]);
ok('وحدة: 3–5 جداول كلها داخل حدود الفحص، و«متوازن» = الاقتراح الحالي، و«بلا ألبان» بلا حليب، والاقتراح الأصلي لم يتغير');
const D2 = { sex: 'ذكر', age: 40, weight: 110, height: 178, goal: D.settings.goals[1][0], activity: D.settings.activity[2][0], meals: 5, conditions: ['سكري النوع الثاني'], allergens: [] };
E.altSuggestions(D2, D).forEach((a) => assert(a.counts[12] <= E.baseSuggestion(D2, D).counts[12], 'لا سكريات فوق الاقتراح للسكري')); ok('السكري: لا تزيد الكربوهيدرات الأخرى عن الاقتراح');
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'رنا'); await p.press('[data-f="name"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); Object.assign(c, { sex: 'أنثى', age: 32, weight: 84, height: 164, goal: DATA.settings.goals[1][0], activity: DATA.settings.activity[1][0], meals: 4 }); DPApp.A.gen(); });
  await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan && c.plan.days; });
  const cur = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const t0 = JSON.stringify((await cur()).plan.targets);
  await p.evaluate(() => { DPApp.A.genOpen(4); DPApp.A.genEs(3); }); await p.waitForSelector('[data-a="alt175"]'); assert(!(await p.$('.a175'))); assert.strictEqual((await cur()).baseCounts, undefined);
  await p.click('[data-a="alt175"]'); await p.waitForSelector('.a175c'); const k = await p.locator('.a175c').count(); assert(k >= 3 && k <= 5); assert(/المختار/.test(await p.textContent('.a175c.on')));
  ok('«⇄ جداول بديلة» بجانب «اقترح الحصص» يعرض ' + k + ' جداول، و«متوازن» هو المختار، ولا يتغير شيء بلا اختيار');
  await p.click('[data-a="alt175Pick"][data-v="cho"]'); await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.baseCounts && c.baseCounts.length === 13; });
  const c1 = await cur(); assert.strictEqual(JSON.stringify(c1.baseCounts), JSON.stringify(E.altSuggestions(Object.assign({}, c1, { baseCounts: undefined }), D).find((a) => a.id === 'cho').counts)); assert.strictEqual(JSON.stringify(c1.plan.targets), t0);
  assert(/المختار/.test(await p.textContent('.a175c.on')) && /كارب أكثر/.test(await p.textContent('.a175c.on'))); ok('اختيار «كارب أكثر، دهون أقل» يضبط الحصص (والهدف لم يتغير)');
  await p.waitForSelector('.g171cnt .a175act'); assert.strictEqual(await p.locator('.g171cnt .a175act').count(), 4); assert(/فعلي \d+/.test(await p.textContent('.g171cnt'))); ok('العدّاد: الاسمي والفعلي معاً');
  await p.evaluate(() => DPApp.A.genOpen(5)); await p.waitForSelector('.g171rev'); assert(!(await p.$('.a175w')), 'لا تنبيه في خطة مطابقة');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), d = c.plan.days[0]; d.actual = d.nominal.map((v) => v * 1.3); DPApp.A.genOpen(5); });
  await p.waitForSelector('.a175w'); assert(/الفعلي يبتعد عن الهدف/.test(await p.textContent('.a175w')) && /\+\d+%/.test(await p.textContent('.a175w'))); ok('④: تنبيه عندما يبتعد الفعلي عن الهدف أكثر من 10%');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء');
  console.log('\nنجح', n, 'اختبارات الجداول البديلة والفعلي 1.75'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
