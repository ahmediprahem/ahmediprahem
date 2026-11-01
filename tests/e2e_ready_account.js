// عميل جاهز بخطته وبرنامجه (مستورد) ← دعوة باسم مستخدم وكلمة سر مربوطة به ← يدخل العميل ويسجّل ← اعتماد بضغطة يربطه ولا ينشئ عميلاً ثانياً ويرسل خطته وبرنامجه وقائمة تسوقه فوراً.
const assert = require('assert'), path = require('path'), linked = require('./hx_link_helper');
const FX = path.join(__dirname, 'fixtures/client_pkg_sample.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const L = await linked('ready', errs, { preImport: { file: FX }, cred: { u: 'ahmed-hamed', pw: 'Strong2Pass9x' } }), { d, m } = L;
  const st = await d.evaluate(() => ({ n: DPApp.S.clients.length, c: DPApp.S.clients.map((c) => [c.name, !!c.hx, !!c.rawSnap, !!c.work, (c.hx || {}).planV]) }));
  assert.strictEqual(st.n, 1, 'لا عميل مكرر: ' + JSON.stringify(st)); assert.deepStrictEqual(st.c[0].slice(0, 4), ['عميل تجريبي', true, true, true]); assert(st.c[0][4] >= 1, 'أُرسلت الخطة تلقائياً بعد الاعتماد');
  ok('الاعتماد يربط الطلب بالعميل المستورد (بلا عميل مكرر) ويرسل خطته وبرنامجه فوراً');
  const c = await m.evaluate(() => { const S = window.HissatiApp.state(); return { t0: S.plan[0].type, w: S.work.days.length, shop: S.shop.groups.length, scr: S.screen }; });
  assert.deepStrictEqual(c, { t0: 'يوم تجريبي 0', w: 7, shop: 2, scr: 'app' });
  await m.click('[data-act="tab"][data-v="plan"]'); await m.waitForSelector('.ptseg'); assert.deepStrictEqual(await m.locator('.ptseg button').allTextContents(), ['وجباتي', 'تمريني', 'المكتبة', 'قائمة التسوق']);
  ok('العميل (دخل باسم مستخدم وكلمة سر) يجد خطته وتمريني وقائمة التسوق أمامه');
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1800)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
