// 1.52: «قائمة الطعام» (الخطوة 5) بطاقة وجبة + «تحليل اليوم» الثابت، بنفس المنطق.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', 'م'); await p.selectOption('[data-f="sex"]', 'ذكر'); await p.fill('[data-f="age"]', '35'); await p.fill('[data-f="weight"]', '85'); await p.fill('[data-f="height"]', '175'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 1 });
  await p.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); DPApp.A.genOpen(4); DPApp.A.genEs(5); }); await p.waitForSelector('.g152 .g5grid');
  assert(await p.$('.g152 .g5meal .g5mh .g5auto [data-a="genAutoMeal"]') && await p.$('.g152 .g5meal select[data-gp]') && await p.$('.g152 .g5tabs [data-a="genEm"]')); ok('بطاقة الوجبة: الرأس وأزرار التوليد وأسطر الأصناف وتبويبات الوجبات');
  const sum = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), md = c.mealDist || [], k = md.reduce((a, r) => a + DPEngine.countsVals(r, DATA).k, 0); return [Math.round(k), document.querySelector('.g152 .g5en .g5v b').textContent]; });
  assert.strictEqual(String(sum[0]), sum[1]); ok('«تحليل اليوم»: الطاقة = مجموع سعرات الوجبات من التوزيع (' + sum[1] + ')');
  const mc = await p.$$eval('.g152 .g5meals .g5m', (x) => x.length), tb = await p.$$eval('.g152 .g5tabs [data-a="genEm"]', (x) => x.length); assert.strictEqual(mc, tb); assert.strictEqual(await p.$$eval('.g152 .g5side [data-a]', (x) => x.length), 0); ok('دائرة لكل وجبة (' + mc + ') للعرض فقط — التبديل من التبويبات (بلا تكرار)');
  await p.click('.g152 .g5tabs [data-a="genEm"][data-v="1"]'); await p.waitForSelector('.g152 .g5m.on'); assert.strictEqual(await p.$$eval('.g152 .g5m', (x) => x.findIndex((e) => e.classList.contains('on'))), 1); ok('تبديل الوجبة يحدّث البطاقة والدائرة المميزة');
  const lbl = await p.$$eval('.g152 .g5mf .mc', (x) => x.map((e) => e.dataset.l + ':' + e.textContent)); assert(lbl.length === 4 && lbl.every((t) => /^[^:]+:\d/.test(t)), lbl.join('|')); ok('تذييل الوجبة: وسوم ملوّنة (الطاقة/كربوهيدرات/بروتين/دهون) بالأرقام');
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => DPApp.A.genEs(5)); await p.waitForTimeout(300); assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), 390); ok('الجوال: عمود واحد بلا تجاوز عرض');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات 1.52'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
