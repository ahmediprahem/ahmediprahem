// 1.43 (قرار المالك): «نوع النظام الغذائي» قبل توزيع الحصص — المرحلة الأولى (نظام الحصص).
// الاختيار في «النظام والماكروز»، ثم الجدول التركيبي يقترح الحصص حسب النظام، والأصناف تُرشَّح، ولوحة الجودة تقيس الالتزام.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const URL = fileUrl(path.resolve(__dirname, '../admin.html'));
const client = async (p, nm, extra) => {
  await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', nm); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '34'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '163'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 2 }); await p.waitForTimeout(100);
  if (extra) await p.evaluate(extra);
  await p.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); DPApp.A.genOpen(4); DPApp.A.genEs(2); }); await p.waitForSelector('.dxsx');
};
const C = (p) => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
const counts = (p) => p.evaluate(() => { DPApp.A.genEs(3); return [...document.querySelectorAll('.eqtbl tr[data-g]')].map((r) => +(r.querySelector('input') || {}).value || 0); });
(async () => {
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(URL); await login(p);
  await client(p, 'منى أحمد');
  const cards = await p.evaluate(() => [...document.querySelectorAll('.dxsc')].map((b) => [b.dataset.v, b.querySelector('small').textContent]));
  assert(cards.length >= 15, cards.length); for (const id of ['keto', 'dash', 'med', 'mind', 'veg', 'vegan', 'flex', 'gf', 'if', 'lowcarb', 'highpro']) assert(cards.some((c) => c[0] === id), id);
  assert.deepStrictEqual(cards.find((c) => c[0] === 'mind')[1], 'MIND'); assert.deepStrictEqual(cards.find((c) => c[0] === 'vegan')[1], 'Vegan');
  assert(/الماكروز/.test(await p.textContent('.eqsteps')) && /النظام/.test(await p.textContent('.eqsteps')));
  ok('خطوة «النظام والماكروز»: ' + cards.length + ' بطاقة بالاسمين العربي والإنجليزي، ومنها الجديدة (MIND، النباتي، النباتي الصرف، المرن، الخالي من الجلوتين) والكيتو في نظام الحصص');
  // الكيتو: تأكيد الموانع ثم الجدول بلا نشويات
  const k0 = (await C(p)).kcalManual;
  await p.click('.dxsc[data-v="keto"]'); await p.waitForSelector('.dxscf'); assert.strictEqual((await C(p)).diet, undefined, 'طُبّق قبل التأكيد');
  await p.click('.dxscf [data-a="genDietOk"]'); assert.strictEqual((await C(p)).diet, undefined);
  for (const lb of await p.$$('.dxscf label')) await lb.click(); await p.click('.dxscf [data-a="genDietOk"]');
  let c = await C(p); assert.strictEqual(c.diet.id, 'keto'); assert.strictEqual(c.kcalManual, k0, 'النظام غيّر السعرات ' + k0 + ' → ' + c.kcalManual); assert(c.choPct <= 0.12, c.choPct);
  let cn = await counts(p); assert.deepStrictEqual([cn[0], cn[1], cn[12]], [0, 0, 0], 'نشويات/بقوليات/حلويات في الكيتو ' + cn); assert(cn[10] <= 1 && cn[7] <= 1, cn);
  ok('الكيتو: لا يُطبَّق قبل تأكيد الموانع الأربعة، ثم كارب ≤ 12% والسعرات من خطوة الطاقة كما هي، والجدول بلا نشويات ولا بقوليات ولا حلويات وفاكهة وحليب حصة على الأكثر');
  await p.evaluate(() => { DPApp.A.genEqBuild(); DPApp.A.genEs(3); }); await p.waitForSelector('.genqual');
  const q = await p.evaluate(() => [...document.querySelectorAll('.genqual .gq')].map((t) => t.querySelector('small').textContent + '=' + t.querySelector('b').textContent));
  assert(q.some((t) => /الكارب \(متوسط اليوم\)=\d+ جم من 40/.test(t)), q.join(' | ')); assert(q.some((t) => /أصناف مخالفة للنظام=لا شيء/.test(t)), q.join(' | '));
  c = await C(p); assert.strictEqual(c.plan.diet.id, 'keto'); assert.strictEqual(c.plan.diet.en, 'Ketogenic');
  ok('بعد التوليد: لوحة الجودة تعرض «الكارب (متوسط اليوم) … من 40» و«أصناف مخالفة للنظام: لا شيء»، واسم النظام محفوظ في الخطة');
  // النباتي الصرف: حصص اللحوم إلى بقوليات، والأصناف بلا منتج حيواني
  await client(p, 'سارة نباتية'); await p.click('.dxsc[data-v="vegan"]'); c = await C(p); assert.strictEqual(c.diet.id, 'vegan');
  cn = await counts(p); assert.deepStrictEqual([cn[2], cn[3], cn[5], cn[8]], [0, 0, 0, 0], 'لحوم في النباتي الصرف ' + cn); assert(cn[1] >= 2, cn);
  await p.evaluate(() => { DPApp.A.genEqBuild(); DPApp.A.genEs(3); }); await p.waitForSelector('.genqual');
  const bad = (await p.evaluate(() => [...document.querySelectorAll('.genqual .gq')].map((t) => t.querySelector('small').textContent + '=' + t.querySelector('b').textContent).join(' | ')));
  assert(/أصناف مخالفة للنظام=لا شيء/.test(bad), bad); assert(/فيتامين B12/.test(bad), bad);
  ok('النباتي الصرف: حصص اللحوم والحليب كامل الدسم صفر وتحولت إلى بقوليات، وبلا أصناف مخالفة، وتنبيه B12 في لوحة الجودة');
  // المحظور بالحالة: العمر أقل من 18
  await client(p, 'مراهقة', () => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.age = 16; });
  const off = await p.evaluate(() => [...document.querySelectorAll('.dxsc.off')].map((b) => b.dataset.v)); assert(off.includes('keto'), off);
  await p.click('.dxsc[data-v="keto"]', { force: true }); assert.strictEqual((await C(p)).diet, undefined); ok('الموانع: لعميلة أقل من 18 تظهر الأنظمة معطّلة بالسبب ولا تُطبَّق');
  // بلا نظام: يعود المتوازن
  await client(p, 'عادية'); await p.click('.dxsc[data-v="dash"]'); assert.strictEqual((await C(p)).diet.id, 'dash'); await p.click('.dxsc[data-v=""]'); assert.strictEqual((await C(p)).diet, undefined); ok('«بدون نظام خاص» يزيل النظام ويعود للتوزيع المتوازن');
  // الجوال
  const m = await (await br.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage(); m.on('pageerror', (e) => errs.push(String(e))); m.on('dialog', (d) => d.accept()); await m.goto(URL); await login(m); await client(m, 'جوال');
  assert.strictEqual(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true); ok('الجوال: البطاقات عمودان بلا تمرير أفقي');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات نوع النظام الغذائي 1.43');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
