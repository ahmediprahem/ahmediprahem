// «استيراد عميل جاهز» من ملف فيه account: ينشئ عميلاً ودخول اسم مستخدم وكلمة سر مربوطاً به تلقائياً، ثم يدخل العميل ويجد خطته فور اعتماده.
const assert = require('assert'), fs = require('fs'), path = require('path'), { TMP } = require('./_tmp.js'), linked = require('./hx_link_helper');
const PK = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/client_pkg_sample.json'), 'utf8')); PK.account = { u: 'sample-user', pw: 'Sample2Pass99' };
const F = path.join(TMP, 'pkg_account.json'); fs.writeFileSync(F, JSON.stringify(PK));
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const L = await linked('impacc', errs, { preImport: { file: F, auto: true }, cred: true }), { d, m } = L;
  assert.deepStrictEqual(L.credTxt, { u: 'sample-user', pw: 'Sample2Pass99' }); assert.strictEqual(await d.evaluate(() => DPApp.S.clients.length), 1);
  ok('ملف فيه account: يُنشأ دخول مربوط بالعميل تلقائياً بعد الاستيراد (ثم يعمل مسار الدخول والاعتماد كما هو)');
  assert.deepStrictEqual(await m.evaluate(() => { const S = window.HissatiApp.state(); return [S.screen, S.plan.length, S.work.days.length]; }), ['app', 7, 7]);
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1800)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
