// الملف الطبي: الزيارات والقياسات (بأرقام عربية) وتحديث الوزن ← منحنيات التقدم ← التحاليل بنطاقاتها حسب الجنس وتنبيهاتها واقتراح الحالة ← تقرير التقدم للعميل.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'أحسنتِ، استمري على نفس الطريقة' : undefined));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const visit = async (d, vals, note) => { await p.fill('#mv_d', d); for (const k of ['w', 'waist', 'hip', 'bf', 'mm', 'bps', 'bpd']) await p.fill('#mv_' + k, vals[k] == null ? '' : String(vals[k])); await p.fill('#mv_note', note || ''); await p.click('[data-a="medVisit"]'); await p.waitForTimeout(200); };
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'سارة'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="weight"]', '80'); await p.press('[data-f="weight"]', 'Tab');
  await p.click('main .tabs [data-v="med"]'); await p.waitForSelector('.medtab'); assert.strictEqual(await p.inputValue('#mv_w'), '80');
  await p.fill('#mv_w', ''); await p.click('[data-a="medVisit"]'); await p.waitForSelector('.toast:has-text("قياساً واحداً")');
  // ---- 1) الزيارات
  await visit('2026-08-01', { w: 80, waist: 95, hip: 110, bf: 38, bps: 135, bpd: 85 }, 'بداية البرنامج');
  let t = await p.textContent('.medtab'); assert(t.includes('بداية البرنامج') && t.includes('محيط الخصر 95') && t.includes('135/85'));
  await visit('2026-10-01', { w: '٧٦٫٥', waist: '٩٠', bf: 35, mm: 24 }, 'التزام ممتاز'); let c = await C();
  assert.strictEqual(c.weight, 76.5); assert.strictEqual(c.med.visits.length, 2); assert.deepStrictEqual([c.med.visits[1].w, c.med.visits[1].waist], [76.5, 90]);
  t = await p.textContent('.medsum'); assert(t.includes('76.5') && t.includes('(-3.5)') && t.includes('(-5)'), t);
  assert.strictEqual(await p.locator('.medcharts .medch').count(), 3); assert((await p.textContent('.medcharts')).includes('(-3.5)'));
  ok('الزيارات: قياس واحد على الأقل، أرقام عربية تُقبل، الوزن الجديد يحدّث بيانات العميل، ملخص التغيّر منذ البداية، ومنحنيات الوزن والخصر والدهون، وتنبيه الخصر والضغط');
  // ---- 2) التحاليل
  await p.click('[data-a="medLabForm"]'); await p.fill('#ml_d', '2026-08-02'); await p.click('[data-a="medLabSave"]'); await p.waitForSelector('.toast:has-text("نتيجة تحليل واحدة")');
  for (const [k, v] of [['hba1c', '6.1'], ['fbg', '108'], ['ldl', '165'], ['hdl', '45'], ['vitd', '١٥'], ['tsh', '5.2'], ['hb', '12.5']]) await p.fill('#ml_' + k, v); await p.click('[data-a="medLabSave"]');
  t = await p.textContent('.medtab'); for (const s of ['ما قبل السكري', 'مقاومة الإنسولين / ما قبل السكري', 'خمول الغدة', 'الكوليسترول الضار LDL: 165', 'الكوليسترول النافع HDL: 45', 'نقص']) assert(t.includes(s), 'بلا: ' + s);
  assert(!t.includes('الهيموغلوبين: 12.5'), 'Hb 12.5 طبيعي للأنثى ولا تنبيه له');
  assert.strictEqual(await p.locator('[data-a="medAddCond"]').count(), 2); const badge = Number(await p.textContent('main .tabs [data-v="med"] em')); assert(badge >= 3, String(badge));
  await p.click('[data-a="medAddCond"][data-v="مقاومة الإنسولين / ما قبل السكري"]'); c = await C(); assert.deepStrictEqual(c.conditions, ['مقاومة الإنسولين / ما قبل السكري']); assert.strictEqual(await p.locator('[data-a="medAddCond"]').count(), 1);
  ok('التحاليل: نطاقات حسب الجنس (HDL 45 منخفض للأنثى، Hb 12.5 طبيعي)، تنبيهات بنصيحة غذائية، واقتراح إضافة «ما قبل السكري» و«خمول الغدة» بضغطة، وشارة التنبيهات على التبويب');
  await p.click('[data-a="medLabForm"]'); await p.fill('#ml_d', '2026-10-02'); await p.fill('#ml_hba1c', '5.6'); await p.fill('#ml_vitd', '32'); await p.click('[data-a="medLabSave"]');
  t = await p.textContent('.medtab'); assert(t.includes('↓ من 6.1') && t.includes('↑ من 15')); assert(!t.includes('فيتامين د: 32'));
  await p.click('[data-a="medLabsAll"]'); assert.strictEqual(await p.locator('[data-a="medLabDel"]').count(), 2);
  ok('التحاليل اللاحقة: آخر قيمة لكل تحليل مع اتجاه التغيّر عن السابقة، وتختفي التنبيهات التي تحسّنت، وسجل كل المجموعات');
  // ---- 3) تقرير التقدّم
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-a="medReport"]')]); const f = TMP + '/med_report.html'; await dl.saveAs(f); const h = fs.readFileSync(f, 'utf8');
  for (const s of ['تقرير التقدّم', 'سارة', 'من 2026-08-01 إلى 2026-10-01', '>80 كجم<', '>76.5 كجم<', '-3.5', '<svg', 'تحاليلك', 'أحسنتِ، استمري']) assert(h.includes(s), 'التقرير بلا: ' + s);
  ok('تقرير التقدّم للعميل: القياسات من البداية إلى الآن بالتغيّر، المنحنيات، التحاليل وتقييمها، وكلمة الأخصائي — صفحة جاهزة للطباعة');
  // ---- 4) الحذف ونظام الجرامات
  await p.locator('[data-a="medVisitDel"]').last().click(); c = await C(); assert.strictEqual(c.med.visits.length, 1);
  await p.click('.rail [data-a="new"][data-v="ath"]'); await p.fill('[data-f="name"]', 'كابتن'); await p.press('[data-f="name"]', 'Tab'); await p.click('main .tabs [data-v="med"]'); await p.fill('#mv_w', '90'); await p.fill('#mv_bf', '18'); await p.click('[data-a="medVisit"]');
  c = await C(); assert.deepStrictEqual([c.kind, c.weight, c.bf], ['athlete', 90, 18]);
  ok('حذف زيارة، والملف الطبي في نظام الجرامات أيضاً (ونسبة الدهون من الزيارة تُحدّث بيانات العميل لمعادلة كانينغهام)');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم'); console.log('\nنجح', n, 'اختبارات الملف الطبي'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 400)); process.exit(1); });
