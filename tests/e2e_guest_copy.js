// نصوص الزائر والتسجيل (0.60 أ10، أ9): زائر التحدي لا يرى «أخصائي» ولا «خطة» في شاشة الرمز ولا «نسيت الرمز»، والجنس والماء غير مختارين و«ابدأ» يرفض،
// وبلا خطة لا افتراض 8 أكواب؛ وعميل التسجيل: الجنس غير مختار و«التالي» يطلبه، وعناوين الهدف بلا تكرار (القيمة المحفوظة رقم الترتيب).
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const BAD = /أخصائي|خطة|خطتك/;
(async () => {
  let wz = null;
  const { b, m, RELAY, close } = await linked('guestcopy', errs, { wizard: async (p) => {
    const s0 = await p.evaluate(() => ({ on: document.querySelectorAll('[data-act="set"][data-k="sex"].on').length, need: (document.querySelector('.need') || {}).textContent || '', dis: document.querySelector('.foot .btn').disabled, sex: window.HissatiApp.state().p.sex }));
    await p.click('[data-act="set"][data-k="sex"][data-v="ذكر"]'); const en = await p.isEnabled('.foot .btn');
    for (let i = 0; i < 12 && !(await p.locator('[data-act="set"][data-k="goal"]').count()) && !(await p.isVisible('#consent')); i++) { if (await p.isDisabled('.foot .btn')) break; await p.click('.foot .btn'); await p.waitForTimeout(120); }
    const goals = await p.$$eval('[data-act="set"][data-k="goal"]', (x) => x.map((e) => [e.dataset.v, e.textContent.trim()]));
    wz = { s0, en, goals };
  } });
  assert(wz && wz.s0.on === 0 && wz.s0.sex === '' && wz.s0.dis && /اختر: أنثى أو ذكر/.test(wz.s0.need) && wz.en, JSON.stringify(wz && wz.s0));
  const labels = wz.goals.map((g) => g[1]); assert(labels.length >= 5 && new Set(labels).size === labels.length, JSON.stringify(labels));
  assert(labels.includes('زيادة خفيفة (+250)') && labels.includes('زيادة (+500)'), JSON.stringify(labels)); assert(wz.goals.every((g, i) => +g[0] === i), 'القيمة رقم الترتيب');
  const sx = await m.evaluate(() => window.HissatiApp.state().p.sex); assert.strictEqual(sx, 'ذكر');
  ok('عميل التسجيل: الجنس غير مختار، و«التالي» معطّل مع «اختر: أنثى أو ذكر» حتى يختار؛ وعناوين الهدف بلا تكرار: ' + labels.join(' • '));
  // الزائر
  const g = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); g.on('pageerror', (e) => errs.push('زائر: ' + e));
  await g.goto(RELAY + '/#khams'); await g.waitForSelector('.khg'); for (let i = 0; i < 5; i++) await g.click('[data-act="khgNext"]');
  assert.strictEqual(await g.locator('[data-act="khgSet"][data-k="sex"].on, [data-act="khgSet"][data-k="wg"].on').count(), 0, 'لا جنس ولا ماء مختار مسبقاً');
  await g.fill('#khgN', 'منى'); await g.click('[data-act="khGo"]'); assert(/اختر: أنثى \/ ذكر/.test(await g.textContent('.khg .err')));
  await g.click('[data-act="khgSet"][data-k="sex"][data-v="أنثى"]'); await g.click('[data-act="khGo"]'); assert(/اختر هدفك من الماء/.test(await g.textContent('.khg .err')));
  assert.deepStrictEqual(await g.$$eval('[data-act="khgSet"][data-k="wg"]', (x) => x.map((e) => +e.dataset.v)), [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  await g.click('[data-act="khgSet"][data-k="wg"][data-v="9"]'); await g.click('[data-act="khGo"]'); await g.waitForSelector('[data-act="pin"]');
  let tx = await g.textContent('.scr'); assert(!BAD.test(tx) && /الرمز يحمي تقدّمك في التحدي على هذا الجوال/.test(tx), tx);
  for (const k of '24682468') await g.click('[data-act="pin"][data-v="' + k + '"]'); await g.waitForSelector('.khs .khnext', { timeout: 15000 });
  ok('الزائر: الجنس والماء (4–16 كوباً) بلا اختيار مسبق و«ابدأ» يرفض بـ«اختر: أنثى / ذكر» ثم «اختر هدفك من الماء»، وشاشة الرمز بلا «أخصائي» ولا «خطة»');
  // بلا خطة ولا هدف: لا 8 أكواب افتراضية
  await g.evaluate(() => { const A = window.HissatiApp; A.state().kh.wg = null; A.render(); }); await g.waitForSelector('.khwg');
  assert.strictEqual(await g.locator('.khwg .on').count(), 0); assert(/حدّد هدفك من الماء/.test(await g.textContent('.khpil'))); assert.strictEqual((await g.evaluate(() => window.HissatiApp.khams.state(new Date())))[2], false);
  await g.click('.khwg [data-v="11"]'); assert.strictEqual(await g.evaluate(() => window.HissatiApp.state().kh.wg), 11); assert(/من 11 أكواب/.test(await g.textContent('.khpil')));
  ok('بلا خطة: ركن الماء «حدّد هدفك من الماء» بأزرار 4–16 بلا اختيار مسبق، واليوم يُحسب من الأركان الأخرى حتى يُحدَّد، ثم يُحفظ الهدف');
  await g.waitForTimeout(400); await g.reload(); await g.waitForSelector('[data-act="pin"]'); tx = await g.textContent('.scr'); assert(!BAD.test(tx), tx);
  await g.click('[data-act="forgot"]'); await g.waitForSelector('.sheet'); tx = await g.textContent('.sheet');
  assert(!BAD.test(tx) && /لا يمكن استرجاع الرمز، فهو لا يُحفظ عندنا ولا عند أحد/.test(tx) && /ابدأ من جديد/.test(tx) && /رجوع/.test(tx), tx);
  await g.click('.sheet [data-act="close"]:not(.sheet-bg)'); assert.strictEqual(await g.locator('.sheet:not([class*="hx-exit"])').count(), 0);
  await g.click('[data-act="forgot"]'); await g.click('.sheet [data-act="wipe"]'); await g.waitForSelector('#wipeIn'); assert(!BAD.test(await g.textContent('.sheet')));
  ok('«نسيت الرمز؟» للزائر: «لا يمكن استرجاع الرمز…» مع [ابدأ من جديد] و[رجوع]، بلا «أخصائي» ولا «خطة» (ونص العميل المرتبط لم يتغير)');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات نصوص الزائر والتسجيل');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 2000)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
