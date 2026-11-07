// «حصتي» صار «زنها» (0.60): العملاء الذين ثبّتوا التطبيق سابقاً — بطاقة مرة واحدة: آيفون (نقل الحساب برمز النقل إلى الأيقونة الجديدة) وأندرويد (تحديث تلقائي)،
// والبيان بالاسم الجديد وأيقونات بعنوان جديد (?v=z1) فيكتشف Chrome التغيير ويحدّث الأيقونة المثبّتة.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, RELAY, close } = await linked('rename', errs);
  const man = await m.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
  assert.strictEqual(man.short_name, 'زنها'); assert(man.icons.every((i) => /\?v=z1$/.test(i.src)), JSON.stringify(man.icons)); assert.strictEqual(man.id, '/', 'المعرّف ثابت فيبقى التطبيق المثبّت نفسه');
  const ic = await m.evaluate(async () => { const r = await fetch('/icon-192.png?v=z1'); return [r.status, r.headers.get('content-type')]; }); assert.deepStrictEqual(ic, [200, 'image/png']);
  assert(/v=z1/.test(await m.getAttribute('link[rel="apple-touch-icon"]', 'href')));
  ok('البيان: الاسم «زنها» ومعرّف ثابت، والأيقونات بعنوان جديد ?v=z1 (أندرويد يحدّث المثبّت تلقائياً)، وأيقونة آيفون الجديدة');
  assert.strictEqual(await m.$('.zren'), null, 'لا بطاقة في المتصفح العادي');
  await m.context().addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
  await m.reload(); await m.waitForSelector('.pad'); for (const k of '1234') await m.click('.pad [data-v="' + k + '"]');
  await m.waitForSelector('.zren', { timeout: 15000 }); const t = await m.textContent('.zren');
  assert(/«حصتي» صار «زِنها»/.test(t) && /آيفون لا يغيّر أيقونة التطبيق المثبّت/.test(t) && /رمز النقل/.test(t), t); assert(await m.$('.zren [data-act="xferNew"]'));
  await m.click('[data-act="zRenOk"]'); await m.waitForTimeout(200); assert.strictEqual(await m.$('.zren'), null);
  await m.reload(); await m.waitForSelector('.pad'); for (const k of '1234') await m.click('.pad [data-v="' + k + '"]'); await m.waitForTimeout(1500); assert.strictEqual(await m.$('.zren'), null, 'مرة واحدة فقط');
  ok('آيفون (التطبيق المثبّت): بطاقة «حصتي صار زِنها» مرة واحدة بخطوات الأيقونة الجديدة ورمز النقل، و«أبقيت القديمة» تخفيها نهائياً');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات الاسم الجديد');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
