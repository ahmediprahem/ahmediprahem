// 1.28 (قرار المالك): حُذف «المحرك السابق» من نظام الحصص؛ «بالبدائل» هو الطريقة الوحيدة، و«ولّد خطة جديدة» يبني بها. تبقى: نقل حصة بين وجبتين في الخطة، ومجاميع اليوم الصحيحة، وتحذير اللحوم عالية الدهون
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const c0 = { sex: 'أنثى', age: 30, weight: 80, height: 165, activity: D.settings.activity[1][0], goal: D.settings.goals[1][0], meals: 5 };
  const p0 = E.eqvPlan(c0, D, { seed: 1 }), d0 = p0.days[0], before = JSON.stringify(d0.nominal); assert(p0.days.length === 7 && d0.slots.length); ok('بلا جدول تركيبي محفوظ: «بالبدائل» يقترح الحصص والتوزيع ويبني الأسبوع');
  const from = d0.slots.findIndex((s) => s.lines.some((l) => l.g === 0 && l.e >= 1)), to = d0.slots.findIndex((s, i) => i !== from); assert(E.moveEx(p0, 0, 0, from, to, D)); assert.strictEqual(JSON.stringify(d0.nominal), before); ok('نقل حصة بين وجبتين يبقي مجموع اليوم');
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'منى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '33'); await p.fill('[data-f="weight"]', '78'); await p.fill('[data-f="height"]', '160'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = DATA.settings.goals[1][0]; c.activity = DATA.settings.activity[1][0]; c.conditions = ['أمراض القلب']; c.gen = { step: 3, path: 'manual', rev: 1 }; DPApp.A.tab('gen'); });
  await p.waitForSelector('.gensetup'); assert.strictEqual(await p.locator('.genopt:has(input[value="manual"])').count(), 0); assert.strictEqual(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).gen.path), 'eqv'); ok('لا خيار «المحرك السابق»، والعميل المحفوظ على المسار القديم ينتقل إلى «بالبدائل»');
  await p.evaluate(() => { DPApp.A.genStep(4); DPApp.A.genEs(3); }); await p.waitForSelector('[data-gc="5"]'); await p.fill('[data-gc="5"]', '1'); await p.press('[data-gc="5"]', 'Tab'); await p.waitForSelector('.eqhf.err'); ok('اللحوم عالية الدهون مع أمراض القلب: مانع صريح في الجدول التركيبي');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.baseCounts[5] = 0; DPApp.A.gen(); }); const m = await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.method); assert.strictEqual(m, 'eqv'); ok('«ولّد خطة جديدة» في ملف العميل يبني بطريقة البدائل');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات حذف المحرك السابق');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
