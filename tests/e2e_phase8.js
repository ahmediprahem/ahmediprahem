// 1.23 المرحلة 8: شكل الأسبوع (ثابت، صيام الاثنين والخميس بأنماط المالك وبالسعرات نفسها ونسب قابلة للتعديل)، تعديل الخطة المرسلة كإصدار جديد، وإخفاء «نافذة الأخصائي»
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const kc = (d) => Math.round(d.nominal[0] * 4 + d.nominal[1] * 4 + d.nominal[2] * 9);
(async () => {
  const c0 = { sex: 'أنثى', age: 30, weight: 80, height: 165, activity: D.settings.activity[1][0], goal: D.settings.goals[1][0], meals: 5 };
  const p1 = E.planWeek(c0, D, { seed: 2 }); E.applyWeek(p1, 'fixed', 1, D); const t0 = JSON.stringify(p1.days[0].slots); assert(p1.days.every((d) => JSON.stringify(d.slots) === t0) && p1.days[3].name === D.days[3]); ok('الأسبوع الثابت: اليوم الأول نفسه كل الأيام، بأسماء الأيام');
  const p2 = E.planWeek(c0, D, { seed: 2 }), b = p2.days.map(kc), names = new Set(p2.days[1].slots.flatMap((s) => s.lines.map((l) => l.name))); E.applyWeek(p2, 'fast', 1, D);
  assert.deepStrictEqual(p2.days[1].slots.map((s) => s.name), ['الفطور', 'وجبة خفيفة', 'السحور']); assert.strictEqual(kc(p2.days[1]), b[1]); assert.strictEqual(kc(p2.days[4]), b[4]); assert(p2.days[1].slots.flatMap((s) => s.lines.map((l) => l.name)).every((x) => names.has(x))); assert.strictEqual(p2.days[2].fast, undefined);
  ok('صيام الاثنين والخميس (النمط 1): فطور + وجبة خفيفة + سحور، بالسعرات نفسها وأصناف اليوم نفسها؛ وباقي الأيام كما هي');
  const p3 = E.planWeek(c0, D, { seed: 2 }); E.applyWeek(p3, 'fast', 2, D); assert.deepStrictEqual(p3.days[4].slots.map((s) => s.name), ['وجبة خفيفة', 'الفطور', 'وجبة خفيفة', 'السحور']); ok('النمط 2: وجبة خفيفة + فطور + وجبة خفيفة + سحور');
  const p4 = E.planWeek(c0, D, { seed: 2 }); E.applyWeek(p4, 'fast', 1, D, [0.6, 0.1, 0.3]); const sk = (s) => s.lines.reduce((a, l) => a + l.e * (D.EX[l.g][0] * 4 + D.EX[l.g][1] * 4 + D.EX[l.g][2] * 9), 0), d4 = p4.days[1].slots.map(sk);
  assert(d4[0] > d4[2] && d4[2] > d4[1], d4.join()); ok('النسب قابلة للتعديل (60/10/30): ' + d4.map(Math.round).join(' / ') + ' سعرة');
  // الواجهة
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'أمل'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '40'); await p.fill('[data-f="weight"]', '85'); await p.fill('[data-f="height"]', '158'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[1][0]; c.activity = DATA.settings.activity[1][0]; c.gen = { step: 3, path: 'eqv', week: 'fast', fastPat: 1, rev: 1 }; DPApp.A.tab('gen'); });
  await p.waitForSelector('.genfp input[data-gfp]'); assert.strictEqual(await p.locator('.genfp input').count(), 3); await p.fill('[data-gfp="0"]', '50'); await p.press('[data-gfp="0"]', 'Tab'); await p.waitForSelector('.genfast .warn'); ok('نسب يوم الصيام في الإعداد، وتنبيه حين لا يكون مجموعها 100%');
  await p.fill('[data-gfp="2"]', '30'); await p.press('[data-gfp="2"]', 'Tab'); await p.evaluate(() => DPApp.A.genStep(4)); await p.evaluate(() => DPApp.A.genEqBuild()); await p.waitForSelector('.genedit');
  const st = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return { mon: c.plan.days[1].slots.map((s) => s.name), fast: c.plan.days[1].fast, sun: c.plan.days[0].fast }; }); assert.deepStrictEqual(st.mon, ['الفطور', 'وجبة خفيفة', 'السحور']); assert(st.fast === 'sunnah' && !st.sun); ok('التوليد من التبويب يطبّق صيام الاثنين والخميس على الخطة');
  assert.strictEqual(await p.locator('.cfseg [data-v="pw"]').count(), 0); assert(await p.locator('.cfseg [data-v="gen"]').count()); await p.evaluate(() => DPApp.A.tab('pw')); await p.waitForSelector('.cfseg [data-v="pw"]'); ok('«نافذة الأخصائي» مخفية من الأقسام (دُمجت في «توليد الخطة»)، وتُفتح منه عند الحاجة');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.hx = { planV: 2, sid: 'x' }; c.gen.step = 2; DPApp.A.tab('gen'); }); await p.waitForSelector('.gensent'); assert(/v3/.test(await p.textContent('.gensent'))); await p.click('.gensent [data-a="genStep"]'); await p.waitForSelector('.genplan'); ok('خطة مرسلة: «عدّل الخطة المرسلة» يفتح الخطة لتُرسل إصداراً جديداً');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); delete c.hx; });
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات المرحلة 8');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
