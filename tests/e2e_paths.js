// مسارات العميل الثلاثة في الدعوة (1.01): «التفصيل» (الأساسي) يولّد الخطة تلقائياً بالمحرك الجديد عند الاعتماد ولا تصل العميل قبل الإرسال؛
// «حدّد بنفسك» كما كان (لا خطة تلقائية ولا v2)؛ وحالات القواعد الجديدة تُسأل في مسار التفصيل فقط
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  let snap = null;
  const L = await linked('paths', errs, { path: 'tailor', afterApprove: async (d, m) => { snap = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return { path: c.path, v2: c.v2, plan: !!c.plan, fit: !!(c.plan && c.plan.fit), days: c.plan ? c.plan.days.length : 0, noBank: c.noBank, tab: DPApp.S.tab, planV: (c.hx || {}).planV, bankMeals: c.plan ? c.plan.days.reduce((a, dy) => a + dy.slots.filter((s) => s.meal).length, 0) : -1 }; }); snap.appPlan = await m.evaluate(() => { const S = window.HissatiApp.state(); return !!(S.plan && S.plan.length); }); } });
  const { d, m, C } = L;
  assert.strictEqual(snap.path, 'tailor'); assert.strictEqual(snap.v2, true); assert(snap.plan && snap.fit && snap.days === 7); assert.strictEqual(snap.tab, 'plan'); ok('مسار التفصيل: عند الاعتماد يُفعَّل المحرك الجديد وتتولد خطة أسبوع تلقائياً وتُفتح للمراجعة');
  assert.strictEqual(snap.bankMeals, 0); assert(snap.noBank && snap.noBank.L); ok('خطة التفصيل بلا وجبات البنك');
  assert.strictEqual(snap.planV, 0); assert.strictEqual(snap.appPlan, false); ok('الخطة لا تصل العميل قبل أن يرسلها الأخصائي');
  const c = await C(); assert(c.hx.planV >= 1); assert(await m.evaluate(() => window.HissatiApp.state().plan.length === 7)); ok('بعد الإرسال تظهر الخطة في تطبيق العميل');
  const cat = await m.evaluate(() => (window.HissatiApp.state().cat || {}).conditions || []); assert(cat.includes('ضغط الدم المرتفع') && cat.includes('سكري النوع الثاني'), JSON.stringify(cat)); ok('استبيان مسار التفصيل يسأل عن حالات القواعد الجديدة (ضغط، كوليسترول…)');
  await d.evaluate(() => DPApp.A.hxv()); await d.click('main [data-a="hxInvForm"]'); const opts = await d.$$eval('#hxi_s option', (o) => o.map((x) => x.value)); assert.deepStrictEqual(opts, ['tailor', 'g', 'ex']); assert.strictEqual(await d.inputValue('#hxi_s'), 'tailor'); ok('نموذج الدعوة: ثلاثة مسارات والتفصيل هو الافتراضي');
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
