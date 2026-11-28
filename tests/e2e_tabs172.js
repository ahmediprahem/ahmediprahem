// 1.72 (م4) تبويبات ملف العميل الستة + شريط المحطات ①②③④
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'نور'); await p.press('[data-f="name"]', 'Tab'); await p.evaluate(() => DPApp.A.tab('ov'));
  await p.waitForSelector('main .cftabs');
  const tabs = await p.$$eval('main .cftabs > button', (x) => x.map((b) => b.textContent.trim())); assert.deepStrictEqual(tabs.map((t) => t.replace(/\d+$/, '').trim()), ['نظرة عامة', 'البيانات', 'القياسات والتحاليل', 'الخطة', 'المتابعة', 'الإدارة']);
  ok('ستة تبويبات: نظرة عامة، البيانات، القياسات والتحاليل، الخطة، المتابعة، الإدارة');
  await p.click('main .cftabs [data-g="admin"]'); const seg = await p.$$eval('main .cfseg > button', (x) => x.map((b) => b.dataset.v)); assert.deepStrictEqual(seg, ['appt', 'sub', 'link']); ok('«الإدارة» تجمع المواعيد والاشتراك وربط «زنها»');
  await p.click('main .cftabs [data-g="data"]'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'client'); await p.click('main .cftabs [data-g="file"]'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'ov'); ok('«البيانات» تفتح البيانات، و«نظرة عامة» كما كانت');
  await p.waitForSelector('main .st172'); assert.strictEqual(await p.locator('main .st172 .stn').count(), 4); assert(/التالي/.test(await p.textContent('main .st172 .stn.next'))); assert(/الاستقبال/.test(await p.textContent('main .st172 .stn.next')));
  ok('شريط المحطات ① الاستقبال ② القياسات ③ الخطة ④ المتابعة، وأول محطة ناقصة «التالي»');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); Object.assign(c, { sex: 'أنثى', age: 30, weight: 70, height: 165, goal: DATA.settings.goals[1][0], activity: DATA.settings.activity[1][0], meals: 4 }); c.med = { visits: [{ id: 'v1', d: '2026-11-25', w: 70 }], labs: [] }; DPApp.A.tab('ov'); });
  await p.waitForFunction(() => document.querySelectorAll('main .st172 .stn.done').length === 2); assert(/الخطة/.test(await p.textContent('main .st172 .stn.next'))); assert(/70 كجم/.test(await p.textContent('main .st172 .stn.done >> nth=1')));
  await p.click('main .st172 .stn.next'); await p.waitForSelector('.st170'); await p.click('[data-a="st170x"]'); ok('الحالة تتحدث (✓ الاستقبال والقياسات بآخر وزن)، و«③ الخطة» بلا خطة يفتح «كيف تبدأ؟»');
  await p.click('main .st172 .stn >> nth=1'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'med'); await p.click('main .st172 .stn >> nth=3'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'link'); ok('كل محطة تفتح مكانها الوحيد (القياسات، ربط «زنها»)');
  const ow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert(ow <= 1, 'تمرير جانبي ' + ow);
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => DPApp.A.tab('ov')); await p.waitForTimeout(300); const ow2 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert(ow2 <= 1, 'تمرير جانبي على الجوال ' + ow2); ok('لا تمرير جانبي (مكتب وجوال)');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات التبويبات والمحطات 1.72'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
