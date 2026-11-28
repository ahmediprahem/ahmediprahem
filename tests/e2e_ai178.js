// 1.78 (ر3) «ولّد بالمساعد» ← المحطة (mode: meal، موقَّع من الأخصائي) ← «فهمتُ منك» بمطابقة الأصناف — رد المُحلِّل مُحاكى (لا يُستهلك أي حد)
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, C, close } = await linked('ai178', errs);
  let sent = null;
  await d.route('**/v1/ai/food', async (route) => { const req = route.request(); sent = { body: JSON.parse(req.postData() || '{}'), auth: req.headers().authorization || '' };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, prov: 'gl', meals: [{ key: 'g0m0', pattern: 'rotate', rotation: ['جبن', 'بيض', 'زبادي', 'حليب', 'لبن', 'كينوا مخترعة'], always: ['خبز'], avoid: [], notTogether: [['حليب', 'لبن']], tags: ['high_protein'], understood: 'الفطور يتناوب يومياً على الجبن والبيض والزبادي والحليب واللبن مع الخبز، ولا يجتمع الحليب واللبن' }], avoid: ['مقليات'], prefer: [], understood: ['عشاء خفيف بلا مقليات'] }) }); });
  await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur) || DPApp.S.clients[0]; DPApp.S.cur = c.code; DPApp.A.genOpen(4); DPApp.A.ai176(); c.ai176.groups[0].meals[0].desc = 'أريد أن تتنوع يومياً بين الجبن والبيض والزبادي والحليب واللبن مع الخبز'; c.ai176.notes = 'عشاء خفيف بلا مقليات'; DPApp.A.tab('gen'); });
  await d.waitForSelector('.ai176'); await d.click('[data-a="ai176Gen"]'); await d.waitForTimeout(1500); await d.waitForSelector('.ai176parsed');
  assert(sent && sent.body.mode === 'meal' && sent.auth, 'طلب موقَّع بوضع meal'); const js = JSON.stringify(sent.body); const c0 = await C();
  assert(!js.includes(c0.name) && !(c0.phone && js.includes(c0.phone)), 'بلا اسم ولا جوال'); assert(/الجبن والبيض/.test(js)); assert.strictEqual(sent.body.meals[0].key, 'g0m0');
  ok('«ولّد بالمساعد» يرسل وصف الوجبات موقّعاً من الأخصائي إلى المحطة (mode: meal) بلا اسم ولا جوال');
  const t = await d.textContent('.ai176parsed'); assert(/فهمتُ منك/.test(t) && /Gemini/.test(t) && /عشاء خفيف بلا مقليات/.test(t) && /تتناوب يومياً/.test(t) && /حليب ✕ لبن/.test(t) && /بروتين عالٍ/.test(t));
  ok('«فهمتُ منك»: جملة الفهم والتناوب و«كل يوم» و«لا يجتمعان» والطابع، ومصدر الفهم');
  assert(await d.$('.ai176c:has-text("جبن") small')); assert(/✓ \d+/.test(await d.textContent('.ai176c:has-text("جبن")'))); assert(await d.$('.ai176c.miss:has-text("كينوا مخترعة")')); assert(/غير موجودة في قاعدة الأصناف/.test(t));
  ok('كل كلمة تُطابَق مع قاعدة الأصناف: ✓ بعدد المطابقات، و⚠ لما ليس فيها مع تنبيه');
  await d.click('.ai176c.miss:has-text("كينوا مخترعة") [data-a="ai176Rm"]'); await d.waitForFunction(() => !document.querySelector('.ai176c.miss'));
  let c = await C(); assert.deepStrictEqual(c.ai176.parsed.res.meals[0].rotation, ['جبن', 'بيض', 'زبادي', 'حليب', 'لبن']); ok('حذف كلمة من الفهم بلمسة');
  await d.click('[data-a="ai176Ok"]'); c = await C(); assert.strictEqual(c.ai176.parsed.ok, 1); assert(/اعتمدتَ الفهم/.test(await d.textContent('.ai176parsed'))); ok('«✓ الفهم صحيح» يعتمد الفهم ويُحفظ في ملف العميل');
  await d.unroute('**/v1/ai/food'); await d.route('**/v1/ai/food', (route) => route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'aibusy', error: 'المساعد مشغول الآن. حاول بعد دقيقة.' }) }));
  await d.click('[data-a="ai176Gen"]'); await d.waitForSelector('.toast:has-text("مشغول")'); assert((await C()).ai176.parsed.ok === 1, 'الفهم السابق باقٍ'); ok('المساعد مشغول: رسالة واضحة، والفهم السابق باقٍ');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء');
  await close(); console.log('\nنجح', n, 'اختبارات المُحلِّل في زنها Pro 1.78');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
