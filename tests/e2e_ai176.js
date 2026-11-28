// 1.77 (ر2 = ذ0) واجهة «المساعد الذكي»: الوجبات، والأوصاف، وتوزيع يوم مختلف، وطريقة الكميات، والوصفة، ومعاينة الطلب المُجهّل — بلا تغيير في الخطة
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سلوى'); await p.press('[data-f="name"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); Object.assign(c, { sex: 'أنثى', age: 30, weight: 78, height: 162, phone: '0501234567', goal: DATA.settings.goals[1][0], activity: DATA.settings.activity[1][0], meals: 4 }); DPApp.A.gen(); });
  await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan && c.plan.days; });
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const plan0 = JSON.stringify((await C()).plan.days);
  await p.evaluate(() => DPApp.A.genOpen(4)); await p.waitForSelector('.ai176bar'); await p.click('.ai176bar [data-a="ai176"]'); await p.waitForSelector('.ai176');
  assert.strictEqual(await p.locator('.ai176g').count(), 1); assert.strictEqual(await p.locator('.ai176m').count(), 4); ok('«✦ المساعد الذكي» في خطوة الوجبات: اليوم الأساسي بوجبات العميل الأربع ومواعيدها');
  await p.fill('.ai176m >> nth=0 >> textarea', 'أريد أن تتنوع يومياً بين الجبن والبيض والزبادي والحليب واللبن مع الخبز'); await p.press('.ai176m >> nth=0 >> textarea', 'Tab');
  await p.click('.ai176m >> nth=2 >> [data-a="ai176Chip"] >> nth=2'); assert.strictEqual(await p.locator('.ai176m >> nth=0 >> .ai176q').isVisible(), false, 'الاقتراحات مخفية لوجبة لها وصف'); await p.fill('.ai176m >> nth=1 >> input[data-ai176="recipe"]', 'مكرونة بشاميل صحية'); await p.press('.ai176m >> nth=1 >> input[data-ai176="recipe"]', 'Tab');
  let c = await C(); assert(/الجبن والبيض/.test(c.ai176.groups[0].meals[0].desc) && /بروتين عالٍ/.test(c.ai176.groups[0].meals[2].desc)); assert.strictEqual(c.ai176.groups[0].meals[1].recipe, 'مكرونة بشاميل صحية'); ok('وصف الوجبة واقتراح جاهز بلمسة وطلب وصفة تُحفظ في ملف العميل');
  await p.click('[data-a="ai176Add"]'); if (process.env.DBG) { for (const ms of [0, 100, 400, 1000]) { await p.waitForTimeout(ms); console.log('DBG', ms, await p.evaluate(() => [!!document.querySelector('#ai176ak'), !!document.querySelector('.ai176'), DPApp.S.tab, document.querySelectorAll('.ai176m').length])); } } await p.selectOption('#ai176ak', 'snack'); await p.fill('#ai176an', 'قبل التمرين'); await p.fill('#ai176at', '17:00'); await p.click('[data-a="ai176AddOk"]');
  c = await C(); const added = c.ai176.groups[0].meals.find((m) => m.name === 'قبل التمرين'); assert(added && added.kind === 'snack' && added.time === '17:00'); assert.strictEqual(c.ai176.groups[0].meals.length, 5); ok('«＋ إضافة وجبة»: خفيفة باسم وموعد، وتُرتّب بالموعد');
  await p.click('[data-a="ai176AddV"]'); await p.fill('#ai176vn', 'صيام'); await p.click('[data-a="ai176AddVOk"]'); await p.waitForSelector('[data-ai176day="1,1"]');
  await p.check('[data-ai176day="1,1"]', { force: true }); await p.check('[data-ai176day="1,4"]', { force: true }); await p.waitForTimeout(150);
  c = await C(); assert.strictEqual(c.ai176.groups[1].name, 'صيام'); assert.deepStrictEqual(c.ai176.groups[1].days, [1, 4]); ok('«＋ توزيع يوم مختلف»: «صيام» يوما الاثنين والخميس بوجبات خاصة');
  await p.click('.ai176 .genopt:has([data-ai176u="g"])'); await p.waitForTimeout(150); await p.fill('#ai176notes', 'عشاء خفيف بلا مقليات'); await p.press('#ai176notes', 'Tab'); c = await C(); assert.strictEqual(c.ai176.units, 'g'); assert.strictEqual(c.ai176.notes, 'عشاء خفيف بلا مقليات'); ok('طريقة الكميات (جرام) والتعليمات العامة');
  await p.click('[data-a="ai176Gen"]'); await p.waitForSelector('.ai176prev'); const pre = await p.textContent('.ai176prev pre'), req = JSON.parse(pre);
  assert(!pre.includes('سلوى') && !pre.includes('0501234567'), 'بلا اسم ولا جوال'); assert.deepStrictEqual(req.groups[0].days, [0, 2, 3, 5, 6]); assert.deepStrictEqual(req.groups[1].days, [1, 4]); assert(req.target && req.target.kcal > 1000); assert.strictEqual(req.units, 'g');
  ok('«ولّد بالمساعد» يعرض الطلب المنظم المُجهّل (بلا اسم ولا جوال): الأيام الأساسية بعد استثناء أيام الصيام، والهدف، والكميات');
  assert.strictEqual(JSON.stringify((await C()).plan.days), plan0); ok('الخطة الحالية لم تتغير');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء');
  console.log('\nنجح', n, 'اختبارات واجهة المساعد 1.77'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
