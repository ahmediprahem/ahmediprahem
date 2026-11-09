// العجز الحراري المصري قليل المؤشر الجلايسيمي في «زنها Pro»: يظهر في مكتبة الأنظمة (تصفّح ودليل)، ويُطبَّق على العميل، ويُرشَّح لمقاومة الأنسولين
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'هدى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="weight"]', '88'); await p.fill('[data-f="height"]', '162'); await p.fill('[data-f="age"]', '34');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 3 }); await p.waitForTimeout(150);
  await p.click('.rail [data-a="ready"]'); await p.click('[data-a="rdTab"][data-v="browse"]'); await p.selectOption('[data-rdf="fam"]', 'lowgi'); await p.selectOption('[data-rdf="rg"]', 'eg'); await p.waitForTimeout(150);
  assert(/42 نظاماً مطابقاً/.test(await p.textContent('.rdl')), await p.textContent('.rdl').then((t) => t.slice(0, 120)));
  ok('مكتبة الأنظمة ← تصفّح: «العجز الحراري المصري قليل المؤشر الجلايسيمي» فيه 42 نظاماً مطابقاً');
  await p.click('.rdrow >> nth=0 >> [data-a="rdOpen"]'); await p.waitForSelector('.rdfull .rdprev'); assert(await p.locator('.rdfull .rdprev > details').count() >= 7);
  await p.click('.rdrow >> nth=0 >> [data-a="rdApprove"]'); await p.waitForSelector('.rdplan'); const c = await C(); assert(/قليل المؤشر/.test(c.ready.label), c.ready.label); assert.strictEqual(c.planSrc, 'ready');
  const pn = await p.locator('.rdplan .pnav button').allTextContents(); assert(pn.includes('الأحد') && pn.includes('السبت'), pn.join('|')); await p.click('[data-a="rdPage"][data-v="all"]'); assert(await p.locator('.rdplan .pg').count() >= 8);
  ok('اعتماد نظام منها يطبّق الخطة على العميل (7 أيام بخمس وجبات)');
  await p.click('.rail [data-a="ready"]'); await p.click('[data-a="rdTab"][data-v="guide"]'); await p.click('[data-a="rdGuide"][data-v="lowgi"]'); await p.waitForSelector('.dxc.open .dxd'); const g = await p.textContent('.dxc.open .dxd'); assert(/الفئات الثلاث/.test(g) && /القولون العصبي/.test(g) && /مسودة/.test(g), g.slice(0, 200));
  ok('دليل الأخصائي للعائلة: المستويات والماكروز والفئات والتكلفة والقولون، ومعلّم «مسودة» لحين اعتماد المالك');
  assert.deepStrictEqual(errs, []); await b.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e).slice(0, 900)); process.exit(1); });
