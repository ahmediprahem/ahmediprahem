// 1.22 المرحلة 7: المسار الجاهز — خريطة نص الخطط الجاهزة إلى أصناف (يراجعها الأخصائي وتُحفظ)، استبدال المستبعد تلقائياً بعدد الحصص نفسه، والتحويل إلى صيغة المحرك ليُعدَّل ويُفحص
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), zlib = require('zlib'), fs = require('fs'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const P = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, '../src/plib/plans.json.gz')))), ids = Object.keys(P); const texts = new Set(); ids.forEach((k) => P[k][1].forEach((d) => d[2].forEach((m) => m[1].forEach((t) => texts.add(t)))));
  const unk = [...texts].filter((t) => !E.mapText(t, D, {})); assert(unk.length / texts.size < 0.08, unk.length + '/' + texts.size); ok('الخريطة تربط ' + (texts.size - unk.length) + ' من ' + texts.size + ' نصاً مختلفاً في مكتبة الأنظمة بأصناف (والباقي يُعلَّم للمراجعة)');
  assert.strictEqual(E.mapText('ربع رغيف عيش بلدي', D, {}).n, 'خبز عربي صغير'); assert.strictEqual(E.mapText('ربع رغيف عيش بلدي', D, { 'ربع رغيف عيش بلدي': 'خبز توست' }).n, 'خبز توست'); ok('تصحيح الأخصائي يتقدّم على القواعد');
  const id = ids[0], p = P[id], doc = { id, title: p[0], days: p[1].map((d) => ({ t: d[0], k: d[1], m: d[2].map((m) => ({ l: m[0], it: m[1], g: m[2], time: m[4] })) })) };
  const c0 = { sex: 'أنثى', age: 30, weight: 80, height: 165, activity: D.settings.activity[1][0], goal: D.settings.goals[1][0], meals: 5, allergens: ['حساسية البيض'] };
  const pl = E.fromDoc(doc, c0, D, {}), cx = E.ctx(c0, D), bad = pl.days.flatMap((d) => d.slots.flatMap((s) => s.lines.filter((l) => l.name && l.e > 0 && !cx.ok(D.foods.find((f) => f.n === l.name)))));
  assert.strictEqual(bad.length, 0, bad.map((l) => l.name).join()); assert(pl.replaced.length > 0 && pl.replaced.every((r) => /بيض|أومليت|عجة/.test(r.was))); ok('حساسية البيض: صفر أصناف محظورة بعد التحويل، واستُبدل ' + pl.replaced.length + ' سطراً');
  const pl0 = E.fromDoc(doc, Object.assign({}, c0, { allergens: [] }), D, {}); pl.days.forEach((d, i) => { assert.deepStrictEqual(d.counts.map((x, g) => [2, 3, 4, 5].includes(g) ? 0 : x), pl0.days[i].counts.map((x, g) => [2, 3, 4, 5].includes(g) ? 0 : x)); const m = (a) => [2, 3, 4, 5].reduce((s, g) => s + a[g], 0); assert.strictEqual(m(d.counts), m(pl0.days[i].counts)); });
  ok('عدد الحصص ثابت بعد الاستبدال (اللحوم مجموعة واحدة)');
  assert(pl.days.length === 7 && pl.phr && pl.base && pl.days.every((d) => d.nominal && d.slots.length)); assert(['ok', 'warn', 'block'].includes(E.checkPlan(pl, D).st)); ok('الخطة المحوّلة بصيغة المحرك: 7 أيام، تُفحص (حالة ' + E.checkPlan(pl, D).st + ')');
  // الواجهة
  const br = await chromium.launch(), pg = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); pg.on('pageerror', (e) => errs.push(String(e))); pg.on('dialog', (d) => d.accept());
  await pg.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(pg);
  await pg.evaluate(() => DPApp.A.new('ex')); await pg.fill('[data-f="name"]', 'رنا'); await pg.selectOption('[data-f="sex"]', 'أنثى'); await pg.fill('[data-f="age"]', '29'); await pg.fill('[data-f="weight"]', '70'); await pg.fill('[data-f="height"]', '160'); await pg.press('[data-f="height"]', 'Tab');
  await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[1][0]; c.activity = DATA.settings.activity[1][0]; c.allergens = ['حساسية البيض']; c.gen = { step: 4, path: 'ready', week: 'var', fastPat: 1, rev: 1 }; DPApp.A.tab('gen'); });
  await pg.waitForSelector('.geneqv'); assert.strictEqual(await pg.locator('.genready, [data-gnk="path"]').count(), 0); ok('1.37 (قرار المالك): «الجاهز» لم يعد طريقة بناء في مسار التوليد — مسار الحصص الجديد وحده، والمسار المحفوظ «ready» يفتح «البناء» بالبدائل');
  await pg.evaluate(() => DPApp.A.tab('pw')); await pg.waitForSelector('[data-a="pwPick"]:not([disabled])'); await pg.locator('[data-a="pwPick"]:not([disabled])').first().click(); await pg.waitForSelector('[data-a="pwApply"]'); await pg.click('[data-a="pwApply"]');
  await pg.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plib && c.plib.doc; }); await pg.evaluate(() => DPApp.A.tab('plan')); await pg.waitForFunction(() => DPApp.S.tab === 'plan' && document.querySelector('main .cfbody').textContent.length > 200);
  const sn = await pg.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return JSON.stringify(planOf(c).snap()); }); assert(sn.length > 500); ok('دعم الخطط القديمة: خطة من مكتبة الأنظمة تبقى معروضة في «الخطة» وقابلة للإرسال');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات المرحلة 7');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
