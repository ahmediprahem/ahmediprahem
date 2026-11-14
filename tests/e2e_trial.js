// م8: أدوات التجربة الحقيقية في ملف العميل (خلف v2): درجة جودة الخطة، مقارنة بالمحرك الحالي، تقييم الأخصائي، وتصدير بلا أسماء
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'ريم'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '41'); await p.fill('[data-f="weight"]', '86'); await p.fill('[data-f="height"]', '160');
  await p.selectOption('[data-f="activity"]', { index: 1 }); await p.selectOption('[data-f="goal"]', { index: 1 }); await p.waitForSelector('#mtailor');
  assert.strictEqual(await p.$('#trial'), null); ok('بلا v2 لا أدوات تجربة');
  await p.click('#mtailor summary').catch(() => { }); await p.check('[data-bf="v2"]'); await p.evaluate(() => DPApp.A.gen()); await p.waitForTimeout(800);
  await p.evaluate(() => DPApp.A.tab('file')).catch(() => { }); await p.waitForSelector('#trial');
  const sc = await p.textContent('#trial'); assert(/جودة الخطة: \d+\/100/.test(sc), sc); ok('درجة جودة الخطة تظهر بعد التوليد');
  await p.click('[data-a="tCompare"]'); await p.waitForSelector('.tcmp'); const t = await p.textContent('.tcmp'); assert(/المحرك الحالي/.test(t) && /وجبات مزدحمة/.test(t)); ok('المقارنة بالمحرك الحالي تعرض المقاييس للعميل نفسه');
  const before = await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.generated); assert(before); 
  await p.selectOption('#tr-score', '4'); await p.selectOption('#tr-ok', 'edit'); await p.check('[data-tri="qty"]'); await p.fill('#tr-note', 'قللت الزيتون'); await p.click('[data-a="tSave"]'); await p.waitForSelector('#trlast');
  const c = await p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  assert.strictEqual(c.trial.length, 1); assert.strictEqual(c.trial[0].score, 4); assert.deepStrictEqual(c.trial[0].issues, ['qty']); assert(c.trial[0].auto && typeof c.trial[0].auto.score === 'number'); assert.strictEqual(c.plan.generated, before); ok('التقييم يُحفظ مع تقرير الجودة التلقائي، ولا يغيّر الخطة');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-a="tExport"]')]); const fs = require('fs'), fp = await dl.path(), J = JSON.parse(fs.readFileSync(fp, 'utf8'));
  assert.strictEqual(J.rows.length, 1); assert(!JSON.stringify(J).includes('ريم'), 'لا أسماء في التصدير'); assert.strictEqual(J.rows[0].score, 4); ok('التصدير JSON بلا أسماء (كود العميل فقط)');
  assert.deepStrictEqual(errs, []); await b.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
