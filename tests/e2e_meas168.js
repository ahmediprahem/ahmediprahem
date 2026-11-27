// 1.68 (م1) القياسات مكان واحد: أول وزن في «البيانات» يُحفظ قياساً، ثم «آخر وزن» للقراءة بمصدره، ووزن «زنها» الأحدث يغلب، والوزن المستهدف
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p); await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سارة'); await p.press('[data-f="name"]', 'Tab');
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('.cf151 input[data-f="weight"]'); assert.strictEqual(await p.isVisible('.cf151 input[data-f="weight"]'), true); assert(!(await p.$('.m168w')));
  await p.fill('.cf151 input[data-f="weight"]', '80'); await p.press('.cf151 input[data-f="weight"]', 'Tab'); await p.waitForTimeout(300); assert.strictEqual(await p.evaluate(() => (DPApp.S.clients[0].med || {}).visits || []).then((v) => v.length), 0);
  ok('بلا قياسات: حقل وزن البداية كما هو، ولا يُنشأ قياس تلقائي (لا يتغير سجل الزيارات ولا ملخص التغير)');
  await p.evaluate(() => { const c = DPApp.S.clients[0]; c.med = { visits: [{ id: 'v1', d: '2026-11-20', w: 80, waist: 85 }], labs: [] }; c.height = 170; });
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('.cf151 .m168w'); assert(/80/.test(await p.textContent('.m168w')) && /قياس زيارة/.test(await p.textContent('.m168w'))); assert.strictEqual(await p.isVisible('.cf151 input[data-f="weight"]'), false);
  assert(await p.$('.m168w [data-a="mxOpen"][data-v="w"]')); assert(/الخصر ÷ الطول: 0.5/.test(await p.textContent('.m168w'))); ok('بعدها «آخر وزن» للقراءة بمصدره وتاريخه، و«سجّل قياساً» يفتح مكانه الوحيد');
  await p.evaluate(() => { const c = DPApp.S.clients[0]; c.hx = c.hx || {}; c.hx.weights = [[Date.now() + 1000, 78.5]]; c.weight = 78.5; DPApp.A.tab('client'); }); await p.waitForSelector('.m168w'); assert(/78.5|٧٨/.test(await p.textContent('.m168w')) && /زنها/.test(await p.textContent('.m168w'))); ok('وزن سجّله العميل في «زنها» وهو الأحدث يظهر بمصدره');
  await p.fill('#f-targetW', '70'); await p.press('#f-targetW', 'Tab'); await p.fill('#f-targetBy', new Date(Date.now() + 70 * 864e5).toISOString().slice(0, 10)); await p.press('#f-targetBy', 'Tab'); await p.waitForTimeout(200);
  assert.strictEqual(await p.evaluate(() => +DPApp.S.clients[0].targetW), 70); assert(/-8.5|8.5/.test(await p.textContent('.m168tg')) && /أسبوعاً/.test(await p.textContent('.m168tg'))); ok('الوزن المستهدف وتاريخه يُحفظان، ويظهر الفرق والأسابيع وكجم/أسبوع (عرض حسابي فقط)');
  assert(await p.$('main [data-a="tab"][data-v="med"]')); assert(/القياسات والتحاليل/.test(await p.textContent('main .cftabs'))); ok('تبويب «القياسات والتحاليل» بدل «الملف الطبي»');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات القياسات 1.68'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
