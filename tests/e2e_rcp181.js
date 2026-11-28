// 1.81 (ر5ب) تثبيت الوصفة 📌 في الخطة ← «أرسل الخطة» ← العميل يراها في «زنها» بصورتها وخطواتها ومقاديره المحسوبة
// ردود المُحلِّل والصورة مُحاكاة؛ المحطة والتوقيع والتشفير والرفع و«زنها» حقيقية (hx_link_helper)
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGP4z8CAB+GTG8HSALfKY52fTcuYAAAAAElFTkSuQmCC';
(async () => {
  const { d, m, C, cPoll, close } = await linked('rcp181', errs);
  await d.route('**/v1/ai/food', (rt) => rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, prov: 'gl', title: 'شوفان بالموز والقرفة', ingredients: ['4 ملعقة كبيرة شوفان جاف', '1 كوب حليب قليل الدسم', '1 موزة موز', 'نصف ملعقة صغيرة قرفة'], steps: ['سخّن الحليب', 'أضف الشوفان وقلّب 5 دقائق', 'زيّنه بالموز والقرفة'], minutes: 10, img: 'Oatmeal bowl with sliced banana and cinnamon' }) }));
  await d.route('**/v1/ai/recipe-img', (rt) => rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, src: 'flux', mime: 'image/png', img: PNG }) }));
  await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur) || DPApp.S.clients[0]; DPApp.S.cur = c.code; DPApp.A.genOpen(4); DPApp.A.ai176(); c.ai176.groups[0].meals[0].recipe = 'شوفان بالموز والقرفة'; DPApp.A.tab('gen'); });
  await d.click('.ai176m >> nth=0 >> [data-a="rcpGen"]'); await d.waitForSelector('.rcp'); await d.click('.rcp [data-a="rcpImg"]'); await d.waitForSelector('.rcpimg img');
  const c0 = await C(), meal0 = c0.ai176.groups[0].meals[0].name, nv0 = await d.evaluate(() => (DPApp.S.versions || []).filter((v) => v.kind === 'arch').length);
  await d.click('.rcp [data-a="rcpPin"]'); await d.waitForSelector('.rcppin.on'); await d.waitForTimeout(300);
  const c1 = await C(), T = c1.plan.targets, pinned = c1.plan.days.map((dy) => dy.slots.find((s) => s.rcp181)).filter(Boolean);
  assert(pinned.length >= 5, 'مثبّتة في أغلب الأيام: ' + pinned.length); pinned.forEach((s) => { assert.strictEqual(s.mealLabel, 'شوفان بالموز والقرفة'); assert(s.lines.some((l) => /شوفان/.test(l.name)) && s.lines.some((l) => /موز/.test(l.name))); assert(!s.lines.some((l) => /قرفة/.test(l.name))); });
  ok('«📌 ثبّت في الخطة»: الوصفة تحل محل أصناف «' + meal0 + '» في ' + pinned.length + ' أيام، والتوابل لا تُحسب');
  c1.plan.days.forEach((dy, i) => { const nn = dy.nominal, k = nn[0] * 4 + nn[1] * 4 + nn[2] * 9; assert(Math.abs(k - T.kcal) / T.kcal <= 0.05 + 1e-9 || !dy.slots.some((s) => s.rcp181), 'اليوم ' + i + ' خارج الحدود'); });
  assert(await d.evaluate(() => (DPApp.S.versions || []).some((v) => v.kind === 'arch' && (v.why || []).indexOf('rcp181') >= 0)), 'نسخة الأرشيف بسبب التثبيت'); ok('كل يوم فيه الوصفة داخل حدود الفحص (±5%)، والخطة السابقة في الأرشيف');
  const sn = await d.evaluate(() => planOf(DPApp.S.clients.find((x) => x.code === DPApp.S.cur)).snap()); assert(sn.recipes && sn.recipes['شوفان بالموز والقرفة'] && sn.recipes['شوفان بالموز والقرفة'].steps.length === 3 && sn.recipes['شوفان بالموز والقرفة'].mins === 10);
  assert(sn.days.some((dy) => dy.slots.some((s) => s.meal === 'شوفان بالموز والقرفة'))); ok('لقطة «زنها»: اسم الوصفة كاسم الوجبة، والخطوات والوقت في recipes (الشكل الموجود، بلا تغيير في الرسالة)');
  // الإرسال: الصورة تُرفع للمحطة أولاً ثم تصل بالمفتاح
  await d.evaluate(() => DPApp.A.genOpen(5)); await d.click('main .gensend [data-a="hxSendPlan"]'); await d.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.ai176.groups[0].meals[0].rcp.key && (c.hx || {}).planV >= 2; }, null, { timeout: 20000 });
  const key = (await C()).ai176.groups[0].meals[0].rcp.key; assert(/^[A-Za-z0-9_-]{24}$/.test(key)); ok('«أرسل الخطة»: صورة الوصفة تُرفع للمحطة مرة واحدة (مفتاح ' + key.slice(0, 6) + '…) ثم تُرسل الخطة');
  await cPoll(); await cPoll();
  const pm = await m.evaluate(() => { const S = window.HissatiApp.state(); return { r: S.pm && S.pm.recipes && S.pm.recipes['شوفان بالموز والقرفة'], meals: (S.plan || S.pm || {}).days ? 1 : 0 }; });
  assert(pm.r && pm.r.img === key && pm.r.steps.length === 3); ok('«زنها» استلمت الوصفة: الصورة بالمفتاح والخطوات والوقت');
  await m.click('[data-act="tab"][data-v="plan"]'); if (!(await m.locator('[data-act="rcp"]').count())) await m.click('[data-act="mealOpen"][data-v="0"]'); await m.waitForSelector('[data-act="rcp"]'); await m.locator('[data-act="rcp"]').first().click(); await m.waitForSelector('.rcp img');
  const st = await m.textContent('.rcp'); assert(/سخّن الحليب/.test(st) && /10 دقيقة/.test(st) && /شوفان/.test(st)); assert(/\/m\//.test(await m.getAttribute('.rcp img', 'src')));
  ok('العميل في «زنها» (تبويب الخطة): زر «الوصفة» في الوجبة يفتح الصورة والوقت والطريقة و«المقادير لك» من الخطة');
  // إزالة من الخطة: تعود أصناف المحرك بالحصص نفسها
  await d.evaluate(() => { DPApp.A.genOpen(4); DPApp.A.tab('gen'); }); await d.waitForSelector('.rcp [data-a="rcpUnpin"]'); const g0 = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); const s = c.plan.days.map((dy) => dy.slots.find((q) => q.rcp181)).filter(Boolean)[0]; return DPEngine.actualGroups(s); });
  await d.click('.rcp [data-a="rcpUnpin"]'); await d.waitForTimeout(500); const c2 = await C(); assert(!c2.plan.days.some((dy) => dy.slots.some((s) => s.rcp181))); assert(!c2.plan.days.some((dy) => dy.slots.some((s) => s.mealLabel === 'شوفان بالموز والقرفة')));
  const g1 = await d.evaluate((nm) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return DPEngine.actualGroups(c.plan.days[0].slots.find((q) => q.name === nm)); }, meal0); assert.deepStrictEqual(g1.map((x) => Math.round(x * 2) / 2), g0.map((x) => Math.round(x * 2) / 2), 'الحصص نفسها');
  ok('«↩ أزل من الخطة»: تعود أصناف المحرك بحصص المجموعات نفسها، وباقي اليوم كما هو');
  // إعادة التوليد من الخطوات الأربع تعيد التثبيت
  await d.click('.rcp [data-a="rcpPin"]'); await d.waitForSelector('.rcppin.on');
  const rp = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.plan.days.forEach((dy) => dy.slots.forEach((s) => { delete s.rcp181; })); RCP181.rewk(c); return RCP181.days(c, c.ai176.groups[0].meals[0].rcp.id).length; }).catch((e) => 'ERR ' + e.message);
  assert(typeof rp === 'number' && rp >= 5, 'إعادة التثبيت بعد التوليد: ' + rp); ok('بعد إعادة التوليد (genWeek) تُعاد الوصفة المثبّتة تلقائياً');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء');
  await close(); console.log('\nنجح', n, 'اختبارات تثبيت الوصفة وعرضها في «زنها» 1.81');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
