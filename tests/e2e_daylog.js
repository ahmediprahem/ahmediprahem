// «تسجيل اليوم» (0.49): زر «التزمت باليوم كله»، الماء ±، المشي بالدقائق/الخطوات/الأمتار، «خارج النظام» باختيارات جاهزة ونص،
// «أرسل تسجيل اليوم» ← يصل مشفّراً إلى «حصة» ويظهر في يوم العميل، والأعراض أو طلب التعديل يُنبّه الأخصائي.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('daylog', errs);
  await m.waitForSelector('#daylog'); assert(/تسجيل اليوم/.test(await m.textContent('#daylog')));
  await m.click('#daylog [data-act="allDay"]'); await m.waitForSelector('#daylog:has-text("التزامك 100%")');
  const st = await m.evaluate(() => { const S = window.HissatiApp.state(), k = Object.keys(S.log).sort().pop(); return S.log[k]; }); assert(Object.keys(st.ck).length > 3);
  ok('«التزمت باليوم كله» يعلّم كل أصناف اليوم بلمسة (100%)');
  for (let i = 0; i < 3; i++) await m.click('#daylog [data-act="wAdd"][data-v="1"]'); await m.click('#daylog [data-act="wAdd"][data-v="-1"]'); assert.strictEqual((await m.textContent('#wv')).trim(), '2');
  await m.click('#daylog [data-act="walkMin"][data-v="30"]'); await m.click('#daylog [data-act="walkSteps"][data-v="5000"]'); await m.fill('#daylog [data-wk="walkM"]', '٣٢٠٠'); await m.press('#daylog [data-wk="walkM"]', 'Tab');
  await m.click('#daylog [data-act="off"][data-v="sweets"]'); await m.click('#daylog [data-act="off"][data-v="sym"]'); await m.waitForSelector('#offT'); await m.fill('#offT', 'قطعة كيك في عزومة وصداع بعد الظهر');
  const L = await m.evaluate(() => { const S = window.HissatiApp.state(), k = Object.keys(S.log).sort().pop(); return S.log[k]; });
  assert.strictEqual(L.water, 2); assert.strictEqual(L.h.walkMin, 30); assert.strictEqual(L.h.steps, 5000); assert.strictEqual(L.h.walkM, 3200); assert(L.off.sweets && L.off.sym);
  ok('الماء بـ ± أكواب، المشي باختيار سريع (30 دقيقة، 5 آلاف خطوة) أو رقم (٣٢٠٠ متر بأرقام عربية)، و«خارج النظام» باختيارات + نص');
  if (process.env.SHOTS) { await m.locator('#daylog').screenshot({ path: process.env.SHOTS + '/daylog.png' }); }
  await m.click('#daylog [data-act="subDay"]'); await m.waitForSelector('#daylog:has-text("أُرسل تسجيل اليوم ✓")'); await cPoll();
  await d.click('main .tabs [data-v="hx"]'); await hxCheck();
  const c = await C(), k = Object.keys(c.hx.logs).sort().pop(), lg = c.hx.logs[k];
  assert.strictEqual(lg.done, lg.n); assert(lg.sub > 0); assert.deepStrictEqual(Object.keys(lg.off).sort(), ['sweets', 'sym']); assert(/كيك/.test(lg.offT)); assert.strictEqual(lg.h.walkM, 3200);
  const day = await d.textContent('.hxday'); assert(/100%/.test(day) && /✓/.test(day) && /30 دقيقة/.test(day) && /3200 متر/.test(day) && /خارج النظام: حلويات، تعب أو أعراض/.test(day) && /كيك/.test(day), day);
  assert(c.hx.flags && c.hx.flags[k], 'الأعراض تُعلَّم للأخصائي');
  ok('«حصة»: يصل التسجيل مشفّراً، ويظهر في يوم العميل: 100% ✓ أُرسل، المشي، وما خرج عن النظام مع النص، والأعراض تُنبّه الأخصائي');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات تسجيل اليوم');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
