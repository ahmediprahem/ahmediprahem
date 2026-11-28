// 1.80 (ر5) الوصفات بالذكاء الاصطناعي والصور في «المساعد الذكي»: ولّد الوصفة ← محرك الوصفة يحسب الحصص ← المقدار على نصيب الوجبة ← صورة توضيحية ← «وصفاتي»
// ردود المحطة مُحاكاة (لا يُستهلك أي حد)؛ والتوقيع والطلب حقيقيان عبر hx_link_helper
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
// صورة PNG حمراء 4×4 حقيقية (تُصغَّر في المتصفح)
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGP4z8CAB+GTG8HSALfKY52fTcuYAAAAAElFTkSuQmCC';
(async () => {
  const { d, C, close } = await linked('rcp180', errs);
  let sent = [], imgSent = null;
  await d.route('**/v1/ai/food', async (route) => { const b = JSON.parse(route.request().postData() || '{}'); sent.push({ b, auth: route.request().headers().authorization || '' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, prov: 'gl', title: 'فول بالزيت الحار', ingredients: ['1 كوب فول مدمس', '1 ملعقة صغيرة زيت زيتون', '1 رغيف خبز عربي صغير', 'ملح وكمون', '2 ملعقة صلصة سحرية'], steps: ['سخّن الفول', 'أضف الزيت والكمون', 'قدّمه مع الخبز'], minutes: 10, img: 'Egyptian fava beans with olive oil in a clay bowl' }) }); });
  await d.route('**/v1/ai/recipe-img', async (route) => { imgSent = JSON.parse(route.request().postData() || '{}'); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, src: 'flux', mime: 'image/png', img: PNG, credit: 'صورة توضيحية مولّدة' }) }); });
  await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur) || DPApp.S.clients[0]; DPApp.S.cur = c.code; DPApp.A.genOpen(4); DPApp.A.ai176(); c.ai176.groups[0].meals[0].recipe = 'فول بالزيت الحار'; DPApp.A.tab('gen'); });
  await d.waitForSelector('.ai176 [data-a="rcpGen"]'); const c0 = await C(); const plan0 = JSON.stringify(c0.plan && c0.plan.days);
  await d.click('.ai176m >> nth=0 >> [data-a="rcpGen"]'); await d.waitForSelector('.rcp');
  assert.strictEqual(sent.length, 1); const b = sent[0].b; assert.strictEqual(b.mode, 'recipe'); assert.strictEqual(b.dish, 'فول بالزيت الحار'); assert(sent[0].auth, 'موقَّع'); assert(Array.isArray(b.foods) && b.foods.some((x) => /فول/.test(x)));
  const js = JSON.stringify(b); assert(!js.includes(c0.name) && !(c0.phone && js.includes(c0.phone))); ok('«✦ ولّد الوصفة» يرسل اسم الطبق ونوع الوجبة وأصناف القاعدة القريبة، موقّعاً من الأخصائي، بلا اسم ولا جوال');
  const t = await d.textContent('.rcp'); assert(/فول بالزيت الحار/.test(t) && /10 دقيقة/.test(t) && /سخّن الفول/.test(t)); ok('بطاقة الوصفة: الاسم والوقت والمكونات وطريقة التحضير');
  assert(await d.$('.rcping .rcp-ok:has-text("فول مدمس")')); assert(/نشويات/.test(await d.textContent('.rcping .rcp-ok:has-text("فول مدمس")')) || /بقوليات/.test(await d.textContent('.rcping .rcp-ok:has-text("فول مدمس")')));
  assert(await d.$('.rcping .rcp-skip:has-text("ملح")')); assert(await d.$('.rcping .rcp-rv:has-text("صلصة سحرية")')); assert(/يحتاج مراجعتك/.test(t)); ok('محرك الوصفة: كل سطر يُطابَق مع القاعدة بحصصه ✓، والتوابل تُتجاهل، وما ليس في القاعدة يُعلَّم ⚠ للمراجعة ولا يُحسب');
  const K = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), ml = c.ai176.groups[0].meals[0], k = RCP180.calc(ml.rcp), sh = RCP180.share(c, ml); return { kcal: k.kcal, sh, sc: RCP180.scale(k, sh) }; });
  assert(K.kcal > 0); if (K.sh) { assert(/المقدار ×/.test(t)); assert(Math.abs(K.kcal * K.sc - K.sh) / K.sh < 0.2, JSON.stringify(K)); } ok('المقدار يُضبط على نصيب الوجبة من الخطة (×' + K.sc + '، ' + Math.round(K.kcal * K.sc) + ' من ' + K.sh + ' سعرة)');
  await d.click('.rcp [data-a="rcpImg"]'); await d.waitForSelector('.rcpimg img'); assert.strictEqual(imgSent.prompt, 'Egyptian fava beans with olive oil in a clay bowl');
  const src = await d.getAttribute('.rcpimg img', 'src'); assert(/^data:image\/(webp|jpeg)/.test(src)); assert(/صورة توضيحية/.test(await d.textContent('.rcpimg figcaption'))); ok('«🖼 صورة توضيحية»: بالوصف الإنجليزي من الوصفة، وتُصغَّر WebP وتُكتب «صورة توضيحية»');
  let c = await C(); assert(c.ai176.groups[0].meals[0].rcp.img); assert.strictEqual(JSON.stringify(c.plan && c.plan.days), plan0); ok('الوصفة تُحفظ في ملف العميل، والخطة لم تتغير');
  await d.click('.rcp [data-a="rcpSave"]'); await d.waitForTimeout(400); await d.click('[data-a="rcpLib"]'); await d.waitForSelector('.rcplib .rcpli'); assert(/فول بالزيت الحار/.test(await d.textContent('.rcplib')));
  await d.selectOption('#rcpto', '0,1'); await d.click('.rcplib [data-a="rcpUse"]'); await d.waitForTimeout(300); c = await C(); assert.strictEqual(c.ai176.groups[0].meals[1].rcp.title, 'فول بالزيت الحار'); assert(c.ai176.groups[0].meals[1].rcp.img);
  ok('«📚 وصفاتي»: الحفظ في المكتبة ثم استعمالها لوجبة أخرى بصورتها');
  await d.click('.ai176m >> nth=1 >> .rcp [data-a="rcpDel"]'); await d.waitForTimeout(200); c = await C(); assert(!c.ai176.groups[0].meals[1].rcp); ok('حذف الوصفة من الوجبة');
  await d.unroute('**/v1/ai/food'); await d.route('**/v1/ai/food', (route) => route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'ailimit', error: 'وصلت للحد اليومي للوصفات (30). حاول غداً.' }) }));
  await d.click('.ai176m >> nth=0 >> [data-a="rcpGen"]'); await d.waitForFunction(() => [...document.querySelectorAll('.toast')].some((x) => /اليومي للوصفات/.test(x.textContent)), null, { polling: 200 }); c = await C(); assert.strictEqual(c.ai176.groups[0].meals[0].rcp.title, 'فول بالزيت الحار'); ok('الحد اليومي: رسالة واضحة، والوصفة السابقة باقية');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء');
  await close(); console.log('\nنجح', n, 'اختبارات الوصفات بالصور 1.80');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
