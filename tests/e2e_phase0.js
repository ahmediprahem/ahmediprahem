// 1.15 م0 الأسس: مصدر واحد لخطة العميل (planOf)، وسجل يوم العميل يبقى مع الصنف عند وصول خطة محدّثة، ولا استيقاظ/نوم وهمي في الملاحظات
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'نوال'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '46'); await p.fill('[data-f="weight"]', '92'); await p.fill('[data-f="height"]', '160');
  await p.selectOption('[data-f="activity"]', { index: 1 }); await p.selectOption('[data-f="goal"]', { index: 1 });
  const C = () => DPApp.S.clients.find((x) => x.code === DPApp.S.cur);
  assert.strictEqual(await p.evaluate((c) => planOf(DPApp.S.clients.find((x) => x.code === DPApp.S.cur)).has, null), false); ok('عميل بلا خطة: planOf.has = false');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForTimeout(500);
  let po = await p.evaluate(() => { const r = planOf(DPApp.S.clients.find((x) => x.code === DPApp.S.cur)); return { src: r.src, label: r.label, has: r.has, snap: !!r.snap() }; });
  assert(po.has && po.src === 'engine' && /خطة المحرك/.test(po.label) && po.snap); ok('خطة المحرك: المصدر engine واللقطة تُبنى');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.conditions = []; c.cuisine = 'eg'; DPApp.A.tab('pw'); });
  await p.waitForSelector('.pwtiles .pwt', { timeout: 20000 }); await p.click('.pwt[data-v="1"]'); await p.waitForSelector('#pwv'); await p.click('[data-a="pwApply"]'); await p.waitForSelector('.pwmeal .pwit');
  po = await p.evaluate(() => { const r = planOf(DPApp.S.clients.find((x) => x.code === DPApp.S.cur)); const s = r.snap(); return { src: r.src, label: r.label, days: s && s.days.length }; });
  assert(po.src === 'plib' && /📗/.test(po.label) && !/المحرك/.test(po.label) && po.days === 7); ok('خطة مكتبة الأنظمة: المصدر plib بعنوانها (كانت تُعرض «خطة المحرك») ولقطة 7 أيام');
  assert.deepStrictEqual(errs, []); await b.close();
  // جهة العميل: إعادة ربط سجل اليوم بالأصناف
  const b2 = await chromium.launch(), m = await b2.newPage(); m.on('pageerror', (e) => errs.push(String(e)));
  await m.goto(fileUrl(path.resolve(__dirname, '../hissati.html'))); await m.waitForFunction(() => window.HissatiApp && HissatiApp.remapLogs);
  const r = await m.evaluate(() => {
    const day = (rows) => ({ slots: rows.map(([name, lines]) => ({ name, lines: lines.map((x) => [0, x, x, []]) })) }), A = HissatiApp;
    const k = new Date(); const key = k.getFullYear() + '-' + String(k.getMonth() + 1).padStart(2, '0') + '-' + String(k.getDate()).padStart(2, '0');
    const oldP = Array.from({ length: 7 }, () => day([['الفطور', ['بيض', 'خبز', 'خيار']], ['الغداء', ['أرز', 'دجاج']]]));
    const newP = Array.from({ length: 7 }, () => day([['الفطور', ['خبز', 'بيض', 'جبن']], ['الغداء', ['دجاج', 'سلطة']]]));
    const log = { [key]: { ck: { '0_0': true, '0_2': true, '1_0': true, '1_1': true }, sw: { '0_0': 'بيض مسلوق' }, note: {}, skip: {} } };
    A.remapLogs(oldP, newP, log); return log[key];
  });
  { assert.deepStrictEqual(r.ck, { '0_1': true, '1_0': true }, JSON.stringify(r.ck)); assert.deepStrictEqual(r.sw, { '0_1': 'بيض مسلوق' }); ok('العميل: «أكلت» يبقى على البيض والدجاج في مواضعهما الجديدة، ويُحذف للخيار والأرز المزالين، والتبديل ينتقل معه'); }
  assert.deepStrictEqual(errs, []); await b2.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
