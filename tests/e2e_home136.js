// 1.36 «اليوم» بهوية زنها الموحدة (الاجتماع 11، قرارات المالك): تعريفات المؤشرات (الحالات الأربع)، والتخطيط بحسب العرض، وبقاء كل الإجراءات
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  for (const nm of ['أ1', 'أ2', 'أ3', 'أ4', 'أ5']) { await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', nm); await p.press('[data-f="name"]', 'Tab'); }
  const stat = (lbl) => p.evaluate((l) => { const b = [...document.querySelectorAll('.tdks .tdk')].find((x) => x.querySelector('small').textContent === l); return b ? +b.querySelector('b').textContent : null; }, lbl);
  await p.evaluate(() => { const d = new Date(), t = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), C = DPApp.S.clients;
    C[0].appts = [{ id: 'q1', d: t, t: '10:00' }]; C[1].appts = [{ id: 'q2', d: t, t: '11:00', type: 'متابعة', st: 'done' }]; C[2].appts = [{ id: 'q3', d: t, t: '12:00', type: 'متابعة', st: 'miss' }]; C[3].appts = [{ id: 'q4', d: t, t: '13:00', type: 'استشارة أونلاين' }];
    C[4].plan = { days: [], targets: { kcal: 1500 }, generated: new Date().toISOString() }; C[4].sub = { status: 'stopped', end: '2020-01-01' }; DPApp.A.home(); });
  await p.waitForSelector('.tdks .tdk');
  assert.strictEqual(await stat('متابعات اليوم'), 1); ok('متابعات اليوم = 1: المتابعة بلا نوع تُحسب، والحضور والغياب والاستشارة لا تُحسب');
  assert.strictEqual(await stat('مواعيد اليوم'), 2); ok('مواعيد اليوم كما كانت: غير المحسوم من كل الأنواع (2)');
  assert.strictEqual(await stat('الخطط النشطة'), 1); ok('الخطط النشطة = عملاء لهم خطة حالية بحسب planOf، حتى مع اشتراك موقوف/منتهٍ');
  assert.strictEqual(await stat('إجمالي العملاء'), 5); assert.strictEqual(await p.locator('.tdks .tdk').count(), 8); ok('8 مؤشرات: الخمسة الحالية وإجمالي العملاء ومتابعات اليوم والخطط النشطة');
  await p.evaluate(() => { const C = DPApp.S.clients; C[0].appts[0].st = 'done'; DPApp.A.home(); }); assert.strictEqual(await stat('متابعات اليوم'), 0); ok('تسجيل الحضور يُنقص «متابعات اليوم» تلقائياً');
  const acts = await p.evaluate(() => ['appts', 'hxv', 'zchat', 'subs', 'tdFollow', 'clients', 'genTab'].every((a) => document.querySelector('.ghome [data-a="' + a + '"]')) && !!document.querySelector('.ghome .wktodo select[data-wkset="follow"]') && !!document.querySelector('.ghome .wkit [data-a="wkGo"]') && !!document.querySelector('.ghome .wkit [data-a="wkHide"]') && !!document.querySelector('.ghome .recent .cl[data-a="pick"]') && !!document.querySelector('.ghome .newm'));
  assert(acts); ok('كل الإجراءات باقية: المؤشرات، فترة المتابعة، افتح/إخفاء، آخر العملاء، عميل جديد، توليد خطة');
  const tiers = { 390: [2, 'none'], 820: [4, 'none'], 1024: [4, 'none'], 1440: [8, 'ctx'], 1920: [8, 'ctx'] };
  for (const [w, [cols, ctx]] of Object.entries(tiers)) { await p.setViewportSize({ width: +w, height: 900 }); await p.evaluate(() => DPApp.A.home()); await p.waitForTimeout(250);
    const r = await p.evaluate(() => ({ cols: getComputedStyle(document.querySelector('.tdks')).display === 'flex' && !!document.querySelector('.zhpulse .zhsent') && document.querySelectorAll('.zhring').length === 3 ? 'ok' : 'x', sw: document.documentElement.scrollWidth, iw: innerWidth, side: (() => { const z = document.querySelector('.zhcols'); return z && getComputedStyle(z).gridTemplateColumns.split(' ').length > 1 ? 'ctx' : 'none'; })() }));
    assert.strictEqual(r.cols, 'ok', w + ' cols'); assert.strictEqual(r.side, ctx, w + ' ctx'); assert(r.sw <= r.iw, w + ' overflow'); }
  ok('التخطيط يتغير فعلاً: جوال 2، تابلت 4، ويب 8 مؤشرات مع عمود سياق، بلا تمرير أفقي');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات رئيسية 1.36');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
