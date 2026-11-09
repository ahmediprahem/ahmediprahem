// ربط تلقائي بالمحطة (0.79): إن حملت الإعدادات عنوان المحطة فقط يُربط الجهاز برخصته الموقَّعة (كود التفعيل) بلا مفتاح تسجيل ولا نموذج.
const assert = require('assert'), linked = require('./hx_link_helper');
(async () => {
  const errs = [];
  const { d, close } = await linked('autolink', errs, { auto: true });
  assert(await d.evaluate(() => DPApp.HXA.on() && /^https?:/.test(DPApp.HXA.st().st.relay)), 'رُبط تلقائياً');
  assert.deepStrictEqual(errs, []); await close(); console.log('✔ الربط التلقائي بالمحطة يعمل من الإعدادات الأساسية بلا نموذج\n\nنجح 1 اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
