// الدخول باسم مستخدم وكلمة سر بدل رابط الدعوة (0.67): الأخصائي ينشئهما، والعميل يدخل «حصتي» بهما مباشرة؛ خطأ موحّد لاسم/كلمة خاطئة، وتُحذف عند الانضمام.
const assert = require('assert'), { devices } = require('playwright'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const L = await linked('cred', errs, { cred: { u: 'ahmed-test', pw: 'Strong2Pass9x' } }), { m, d, b, RELAY, credTxt } = L;
  assert.deepStrictEqual(credTxt, { u: 'ahmed-test', pw: 'Strong2Pass9x' });
  const st = await m.evaluate(() => { const S = window.HissatiApp.state(); return { screen: S.screen, plan: !!S.plan }; }); assert.strictEqual(st.plan, true);
  ok('الأخصائي ينشئ اسم مستخدم وكلمة سر، والعميل يدخل «حصتي» بهما فيُسجَّل وتصله الخطة (بلا رابط)');
  const GET = async (u) => (await fetch(RELAY + '/v1/creds/' + u)).json();
  const uh = await m.evaluate(() => window.HXC.userHash('ahmed-test')), un = await m.evaluate(() => window.HXC.userHash('nobody')); const known = await GET(uh), fake = await GET(un);
  assert.strictEqual((await L.env.DB.prepare('SELECT COUNT(*) AS n FROM creds').first()).n, 0, 'حُذف الغلاف عند الانضمام'); assert(known.ok && fake.ok && known.blob && fake.blob && String(fake.blob).length > 40);
  ok('بعد الانضمام تُحذف بيانات الدخول من المحطة (يرجع غلاف وهمي كأي اسم غير موجود)'); // الدخول بنفس الاسم لا يعطي رمز دعوة صالحاً
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); await ctx.addInitScript(() => { try { localStorage.setItem('hissati_onb', '1'); } catch (e) { } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('p2: ' + e));
  await p.goto(RELAY + '/'); await p.waitForSelector('#crU'); await p.fill('#crU', 'nobody'); await p.fill('#crP', 'whatever12345'); await p.click('[data-act="useCred"]'); await p.waitForSelector('.err'); const e1 = await p.textContent('.err');
  await p.fill('#crU', 'ahmed-test'); await p.fill('#crP', 'wrong-pass-123'); await p.click('[data-act="useCred"]'); await p.waitForFunction((x) => document.querySelector('.err') && document.querySelector('.err').textContent !== '', null); const e2 = await p.textContent('.err');
  assert(/غير صحيحة/.test(e1) && e1 === e2, 'رسالة واحدة للاسم الخاطئ وكلمة السر الخاطئة'); assert.strictEqual(await p.locator('.invite').count(), 0);
  ok('اسم مستخدم أو كلمة سر خاطئة: رسالة واحدة لا تكشف أيهما الخطأ، ولا يُفتح شيء');
  const ctr = []; for (let i = 0; i < 17; i++) ctr.push((await fetch(RELAY + '/v1/creds/' + un)).status); assert(ctr.includes(429), JSON.stringify(ctr)); ok('تحديد المحاولات: بعد 15 محاولة لاسم واحد خلال ساعة يُرفض بـ429');
  await ctx.close(); assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1800)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
