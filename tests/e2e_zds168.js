// 1.68 (ه0) نظام زنها البصري الموحّد على ملف العميل: خط العناوين، التبويب النشط، الحقول، الرسومات الخطية، بلا تمرير جانبي، والمظهر السابق متاح
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p); await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سارة'); await p.press('[data-f="name"]', 'Tab');
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('main .cfhead[data-z162] .z162dz svg');
  const st = await p.evaluate(() => { const g = (s) => getComputedStyle(document.querySelector(s)); return { f: g('main .cfname').fontFamily.split(',')[0].replace(/["']/g, ''), tab: g('main .cftabs > button.on').backgroundImage, r: g('main .cf151 .cfsec').borderTopLeftRadius, inp: g('main .cfbody input[data-f="name"]').borderTopLeftRadius }; });
  assert.strictEqual(st.f, 'Zenha Head'); assert(/gradient/.test(st.tab), st.tab); assert.strictEqual(st.r, '22px'); assert.strictEqual(st.inp, '14px'); ok('ملف العميل بهوية زنها: اسم العميل بخط العناوين، التبويب النشط بتدرّج زنها، أقسام 22px وحقول 14px، ورسومات خطية في الرأس');
  assert.strictEqual(await p.$$eval('main *', (x) => x.filter((e) => /[؀-ۿ]/.test(e.textContent) && parseFloat(getComputedStyle(e).letterSpacing) < 0).length), 0); ok('لا تباعد سالب على العربي');
  for (const w of [390, 1100, 1440]) { await p.setViewportSize({ width: w, height: 850 }); await p.evaluate(() => DPApp.A.tab('client')); await p.waitForTimeout(250); assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth), w, 'w' + w); } ok('بلا تمرير جانبي على 390 و1100 و1440');
  await p.evaluate(() => window.ZN_home162.classic(true)); await p.evaluate(() => DPApp.A.tab('client')); assert.notStrictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('main .cf151 .cfsec')).borderTopLeftRadius), '22px'); await p.evaluate(() => window.ZN_home162.classic(false)); ok('المظهر السابق يلغيه كله');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات الهوية الموحّدة 1.68'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
