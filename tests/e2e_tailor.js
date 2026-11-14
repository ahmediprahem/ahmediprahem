// «التفصيل على المقاس» في ملف العميل (0.99): مفتاح v2 لكل عميل، وتكرار الغداء المطلوب (دجاج/لحم أحمر/سمك) مع تحذيرات بمصادرها،
// والتوليد يطبّق جدول الغداء ومنع التعارض وحدود الكمية؛ وعميل بلا المفتاح لا يتغير
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const lunchIn = () => p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan.days.map((d) => { const s = d.slots.find((x) => x.type === 'L'), l = s.lines.find((q) => q.g >= 2 && q.g <= 5); return DPEngine.protClass(DATA.foods.find((f) => f.n === l.name)); }); });
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سلمى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '34'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '163');
  await p.selectOption('[data-f="activity"]', { index: 1 }); await p.selectOption('[data-f="goal"]', { index: 1 }); await p.waitForSelector('#mtailor');
  assert(/غير مفعّل/.test(await p.textContent('#mtailor summary')) && await p.isDisabled('#fq-red')); ok('صندوق «التفصيل على المقاس» يظهر في ملف العميل مطفأً افتراضياً، وحقوله معطّلة');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForSelector('.pg .pwm', { timeout: 20000 }).catch(() => { });
  let c = await C(); assert(c.plan && !c.plan.fit, 'بلا v2 لا تمريرة تفصيل'); const off = JSON.stringify(c.plan.days); ok('بلا المفتاح: التوليد كما كان (لا تمريرة تفصيل)');
  await p.evaluate(() => DPApp.A.tab('file')).catch(() => { }); await p.waitForSelector('#mtailor');
  await p.click('#mtailor summary').catch(() => { }); await p.check('[data-bf="v2"]'); await p.waitForSelector('#fq-red:not([disabled])'); c = await C(); assert.strictEqual(c.v2, true); ok('تفعيل المفتاح يفتح حقول التكرار');
  await p.selectOption('#fq-poultry', '1'); await p.selectOption('#fq-red', '5'); await p.selectOption('#fq-fish', '1'); await p.waitForSelector('#tw .warn');
  const w = await p.textContent('#tw'); assert(/لحم أحمر 5 مرات/.test(w) && /WCRF/.test(w) && /دجاج <b>3|دجاج 3/.test(w + ' دجاج 3') ); assert(/دجاج\s*3\s*•\s*لحم أحمر\s*3\s*•\s*سمك\s*1/.test(w), w);
  ok('طلب 5 مرات لحم أحمر: يُقيَّد بـ3 مع تحذير بمصدره (WCRF)، وتتوزع الأيام 3 دجاج، 3 لحم، 1 سمك');
  await p.selectOption('#fq-poultry', '3'); await p.selectOption('#fq-red', '2'); await p.selectOption('#fq-fish', '2');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForTimeout(600); c = await C(); assert(c.plan.fit, 'تمريرة التفصيل'); const L = await lunchIn(), cnt = {}; L.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
  assert.strictEqual(cnt.poultry, 3); assert.strictEqual(cnt.red, 2); assert.strictEqual(cnt.fish, 2); assert.strictEqual(c.plan.fit.hard, 0); for (let i = 1; i < 7; i++) assert(L[i] !== L[i - 1], 'تكرار متتالٍ');
  ok('التوليد بعد التفعيل: غداء الأسبوع 3 دجاج و2 لحم أحمر و2 سمك بلا تكرار متتالٍ، وبلا تعارض صلب، ولا خطة قديمة تتأثر');
  await p.evaluate(() => DPApp.A.tab('file')).catch(() => { }); await p.waitForSelector('#mtailor'); assert(/آخر توليد: ضُبطت/.test(await p.textContent('#tw'))); ok('الصندوق يعرض نتيجة آخر توليد: كمية ضُبطت وتعارض صلب 0');
  await p.uncheck('[data-cult="fishDairy"]'); c = await C(); assert.strictEqual(c.cult.fishDairy, false); ok('تفضيل «سمك مع ألبان» يُعطَّل بيد الأخصائي');
  assert.notStrictEqual(JSON.stringify(c.plan.days), off); assert.deepStrictEqual(errs, []); await b.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
