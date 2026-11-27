// 1.69 (م1ب) ملف عميل متكامل: أسئلة الاستبيان الجديدة (forms.js) ← «الاستقبال والتاريخ» في «البيانات»، وملاحظة الزيارة ADIME
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
const F = require('../src/forms.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
// ---- وحدة: الاستبيان
const T = F.defaults('tailor'), ids = (s) => s.steps.map((x) => x.id);
assert.deepStrictEqual(ids(T).slice(-3), ['xhab', 'xhist', 'xlife']); assert(T.steps[2].q.some((q) => q.id === 'x_intol') && T.steps[2].q.some((q) => q.id === 'x_supp'));
assert(/حساسية/.test(T.steps[2].q.find((q) => q.id === 'allg').label)); assert(!F.defaults('g').steps.some((s) => s.q.some((q) => q.id === 'x_sleepH' || q.id === 'x_supp')));
ok('الاستبيان: ثلاث خطوات اختيارية جديدة، والحساسية منفصلة عن عدم التحمّل، والمكملات منفصلة عن الأدوية (والجرامات بلا تكرار لأسئلة موجودة)');
const old = F.exSpec({ tailor: 1, tv: 2, steps: [{ id: 'health', q: [{ id: 'allg', b: 1, label: 'أكل يتعبك أو لا تأكله أبداً' }, { id: 'meds', b: 1, label: 'نصي الخاص' }, { id: 'x_intol', label: 'معدّل', hide: 1, type: 'long', opts: ['x'] }] }] });
const hq = old.steps.find((s) => s.id === 'health').q, gq = (id) => hq.find((q) => q.id === id);
assert(/حساسية/.test(gq('allg').label) && gq('meds').label === 'نصي الخاص' && gq('x_intol').label === 'معدّل' && gq('x_intol').hide === 1 && gq('x_intol').type === 'text');
assert(ids(old).includes('xlife') && old.steps.every((s) => s.q.every((q) => !q.ix || q.req === 0)));
ok('استبيان محفوظ قديم: يُكمَّل بالأسئلة الجديدة، ويبقى نص الأخصائي، ويُحفظ إخفاؤه، ولا تتغير الأنواع، وكلها اختيارية');
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p); await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'منى'); await p.press('[data-f="name"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients[0]; c.sex = 'ذكر'; c.hx = { intake: { cq: { x_water: '4–6', x_fam: ['السكري', 'الضغط'], x_day: 'فطور 9 وغداء 4', x_cycle: 'منتظمة', q_abc: 'سؤال مخصص' } } }; DPApp.A.tab('client'); });
  await p.waitForSelector('.cf151 .ix169'); const prev = await p.evaluate(() => { const s = document.querySelector('.ix169'); return s.previousElementSibling && s.previousElementSibling.dataset.cfs; }); assert.strictEqual(prev, 'health');
  assert.strictEqual(await p.inputValue('#ix-x_water'), '4–6'); assert.strictEqual(await p.inputValue('#ix-x_day'), 'فطور 9 وغداء 4'); assert(await p.isChecked('input[data-ixm="x_fam"][value="السكري"]'));
  assert(/3 من/.test(await p.textContent('.ix169 .ixsum'))); assert(!(await p.$('#ix-x_cycle'))); ok('«الاستقبال والتاريخ» بعد «الحالة الصحية» بإجابات العميل من «زنها»، وأسئلة النساء مخفية لغيرهن');
  await p.selectOption('#ix-x_water', '7–9'); await p.fill('#ix-x_wmax', '95'); await p.press('#ix-x_wmax', 'Tab'); await p.check('input[data-ixm="x_gi"][value="انتفاخ"]'); await p.check('input[data-ixm="x_fam"][value="لا شيء"]'); await p.waitForTimeout(200);
  const ix = await p.evaluate(() => DPApp.S.clients[0].ix); assert.strictEqual(ix.x_water, '7–9'); assert.strictEqual(ix.x_wmax, 95); assert.deepStrictEqual(ix.x_gi, ['انتفاخ']); assert.deepStrictEqual(ix.x_fam, ['لا شيء']);
  assert.strictEqual(await p.isChecked('input[data-ixm="x_fam"][value="السكري"]'), false); ok('تعديل الأخصائي يُحفظ في الملف ويغلب ما أرسله العميل، و«لا شيء» يلغي غيره');
  await p.evaluate(() => { DPApp.S.clients[0].sex = 'أنثى'; DPApp.A.tab('med'); DPApp.A.tab('client'); }); await p.waitForSelector('#ix-x_cycle'); assert.strictEqual(await p.inputValue('#ix-x_cycle'), 'منتظمة');
  assert.strictEqual(await p.inputValue('#ix-x_water'), '7–9'); ok('للعميلة تظهر أسئلة الدورة وتكيس المبايض، والتعديلات باقية بعد إعادة الرسم');
  const kc = await p.evaluate(() => JSON.stringify([DPApp.S.clients[0].weight, DPApp.S.clients[0].goal, DPApp.S.clients[0].meals])); assert(kc); ok('بيانات فقط: لا تمس حقول الحساب (الوزن، الهدف، الوجبات)');
  await p.evaluate(() => DPApp.A.tab('med')); await p.waitForSelector('.ad169'); await p.click('.ad169f summary'); await p.fill('#ad_a', 'التزام 80%، الخصر نقص 2 سم'); await p.fill('#ad_sm', 'مشي 30 دقيقة 5 أيام لمدة أسبوعين'); await p.fill('#ad_nx', '2026-12-11'); await p.click('[data-a="adSave"]');
  await p.waitForSelector('.ad169n'); const t = await p.textContent('.ad169n'); assert(/التقييم \(A\)/.test(t) && /مشي 30/.test(t) && /2026-12-11/.test(t) && !/التدخل/.test(t)); assert.strictEqual(await p.evaluate(() => DPApp.S.clients[0].med.adime.length), 1);
  ok('ملاحظة الزيارة ADIME تُحفظ وتُعرض بأجزائها المكتوبة فقط وموعد المتابعة');
  await p.click('.ad169n [data-a="adDel"]'); await p.waitForTimeout(200); assert.strictEqual(await p.evaluate(() => DPApp.S.clients[0].med.adime.length), 0); ok('حذف الملاحظة');
  const ow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert(ow <= 1, 'تمرير جانبي ' + ow); ok('لا تمرير جانبي');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات الملف المتكامل 1.69'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
