// «تمريني» و«قائمة التسوق» (0.66): برنامج تمرين بالأيام والأوقات وفيديو لكل تمرين، وتسوق بتعليم ما اشتري، واستيراد عميل جاهز في «حصة» وإرسال الخطة الغذائية الجاهزة.
const assert = require('assert'), path = require('path'), linked = require('./hx_link_helper');
const FX = path.join(__dirname, 'fixtures/client_pkg_sample.json'), PK = require(FX);
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('gym', errs);
  const old = await d.evaluate(() => DPApp.S.cur);
  // ---- «حصة»: استيراد عميل جاهز بخطته وبرنامجه وقائمة تسوقه
  await d.setInputFiles('#impc', FX); await d.waitForFunction(() => DPApp.S.clients.length === 2, null, { timeout: 5000 });
  const imp = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.name === 'عميل تجريبي'); return { name: c.name, code: c.code, days: c.rawSnap.days.length, w: c.work.days.length, s: c.shop.groups.length, cur: DPApp.S.cur === c.code, kind: c.kind }; });
  assert.deepStrictEqual([imp.name, imp.days, imp.w, imp.s, imp.cur, imp.kind], ['عميل تجريبي', 7, 7, 2, true, 'athlete']);
  ok('«حصة» ← «استيراد عميل جاهز»: عميل جديد بخطته الغذائية (7 أيام) وبرنامج تمرينه (7 أيام) وقائمة تسوقه');
  await d.click('main .tabs [data-v="ci"]'); await d.waitForSelector('.gym'); assert(/فيديو مباشر في 7 منها/.test(await d.textContent('.gym p')) || /فيديو مباشر في/.test(await d.textContent('.gym')));
  await d.locator('.gym details').evaluateAll((es) => es.forEach((e) => { e.open = true; }));
  await d.fill('.gym [data-gv="0|2"]', 'https://youtu.be/abcdefghijk'); await d.press('.gym [data-gv="0|2"]', 'Tab'); await d.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.name === 'عميل تجريبي'); return c.work.days[0].ex[2].v && c.work.days[0].ex[2].v.yt === 'abcdefghijk'; });
  ok('بطاقة «التمرين وقائمة التسوق» في ملف العميل: رابط يوتيوب لتمرين يُحفظ فيديو مضمَّناً (yt)');
  await d.click('.gym [data-a="gymAccount"]'); await d.waitForSelector('#hxi_l'); assert.strictEqual(await d.inputValue('#hxi_l'), 'عميل تجريبي'); assert.strictEqual(await d.inputValue('#hxi_m'), 'cred'); assert.strictEqual(await d.inputValue('#hxi_c'), imp.code);
  ok('زر «🔑 إنشاء دخول «حصتي» لهذا العميل» يفتح نموذج الدعوة مربوطاً بالعميل وبطريقة اسم المستخدم وكلمة السر'); await d.click('[data-a="hxInvForm"]');
  // ---- العميل المرتبط: تحميل برنامج من ملف ثم إرسال الخطة الجاهزة
  await d.evaluate((c) => DPApp.A.pick(c), old); await d.click('main .tabs [data-v="ci"]').catch(() => { }); await d.waitForSelector('#gymf', { state: 'attached' });
  await d.setInputFiles('#gymf', FX); await d.waitForFunction((c) => { const x = DPApp.S.clients.find((q) => q.code === c); return x.work && x.shop; }, old);
  await d.route('https://www.youtube.com/oembed**', (r) => { const u = decodeURIComponent(r.request().url()); r.fulfill({ status: /dQw4w9WgXcQ/.test(u) ? 200 : 401, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"title":"x"}' }); });
  const nd = (new Date().getDay() + 1) % 7; await d.evaluate((o) => { const x = DPApp.S.clients.find((q) => q.code === o.c); x.work.days.find((q) => q.d === o.nd).ex[0].v = { yt: 'blockedvid1' }; }, { c: old, nd });
  await d.click('[data-a="gymCheck"]'); await d.waitForFunction((o) => { const x = DPApp.S.clients.find((q) => q.code === o.c); return x.work.days.find((q) => q.d === o.nd).ex[0].v.x === 1; }, { c: old, nd }, { timeout: 8000 });
  assert.strictEqual(await d.evaluate((o) => { const x = DPApp.S.clients.find((q) => q.code === o.c); return x.work.days.find((q) => q.d !== o.nd).ex[0].v.x || 0; }, { c: old, nd }), 0, 'الفيديو الذي يسمح بالتضمين يبقى مضمَّناً'); ok('«افحص أن فيديوهات يوتيوب تعمل»: oEmbed يكشف ما يمنع التضمين فيُعلَّم x ويُفتح في يوتيوب');
  await d.evaluate((o) => { const c = DPApp.S.clients.find((q) => q.code === o.c); c.rawSnap = o.snap; }, { c: old, snap: PK.snap }); await d.click('main .tabs [data-v="hx"]'); await d.waitForSelector('[data-a="hxSendPlan"]'); await d.click('[data-a="hxSendPlan"]'); await d.waitForFunction((c) => (DPApp.S.clients.find((q) => q.code === c).hx.planV || 0) >= 2, old, { timeout: 15000 });
  await cPoll(); await m.waitForFunction(() => window.HissatiApp.state().work, null, { timeout: 8000 });
  const st = await m.evaluate(() => { const S = window.HissatiApp.state(); return { w: S.work.days.length, ex: S.work.days[0].ex.map((e) => e.v), shop: S.shop.groups.length, t0: S.plan[0].type }; });
  assert.strictEqual(st.w, 7); assert.deepStrictEqual(st.ex[0], { yt: 'dQw4w9WgXcQ' }); assert.strictEqual(st.ex[2], null, 'رابط javascript: يُسقَط'); assert.strictEqual(st.shop, 2); assert.strictEqual(st.t0, 'يوم تجريبي 0', 'الخطة الجاهزة: الأحد أولاً');
  ok('«حصتي» تتسلّم الخطة الجاهزة (الأحد أولاً) + البرنامج (7 أيام) + قائمة التسوق، وتُسقط رابط javascript: الخبيث');
  // ---- «حصتي»: تمريني
  await m.click('[data-act="tab"][data-v="plan"]'); await m.waitForSelector('.ptseg'); assert.deepStrictEqual(await m.locator('.ptseg button').allTextContents(), ['وجباتي', 'تمريني', 'قائمة التسوق']);
  await m.click('.ptseg [data-v="work"]'); await m.waitForSelector('.wex'); assert.strictEqual(await m.locator('.wex').count(), 3); assert(/الإحماء/.test(await m.textContent('.wwm summary')));
  await m.click('.daychips [data-v="2"]'); assert(/الثلاثاء/.test(await m.textContent('.card.stack h3'))); await m.click('.daychips [data-v="' + new Date().getDay() + '"]');
  const csp = []; m.on('console', (g) => { if (/Content Security Policy|Refused to (frame|load)/i.test(g.text())) csp.push(g.text()); });
  await m.click('.wex >> nth=0 >> .wxm'); await m.waitForSelector('.sheet iframe'); assert((await m.getAttribute('.sheet iframe', 'src')).startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')); assert(/أول نقطة/.test(await m.textContent('.sheet'))); assert(/autoplay=1/.test(await m.getAttribute('.sheet iframe', 'src')) && /autoplay/.test(await m.getAttribute('.sheet iframe', 'allow')), 'يبدأ التشغيل فور فتح التمرين'); assert.deepStrictEqual(csp, [], 'لا مخالفة CSP عند تضمين المشغّل'); assert(/enablejsapi=1/.test(await m.getAttribute('.sheet iframe', 'src')) && /youtube\.com\/watch\?v=dQw4w9WgXcQ/.test(await m.getAttribute('.sheet a[target="_blank"]', 'href')), 'رابط احتياطي تحت المشغّل');
  await m.evaluate(() => window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ event: 'onError', info: 101 }), origin: 'https://www.youtube-nocookie.com' }))); await m.waitForFunction(() => !document.querySelector('.sheet iframe')); assert(/تعذّر تشغيل الفيديو/.test(await m.textContent('.sheet')));
  await m.click('.sheet [data-act="close"]'); await m.click('.daychips [data-v="' + nd + '"]'); await m.click('.wex >> nth=0 >> .wxm'); await m.waitForSelector('.sheet a[target="_blank"]'); assert.strictEqual(await m.locator('.sheet iframe').count(), 0); assert(/blockedvid1/.test(await m.getAttribute('.sheet a[target="_blank"]', 'href')) && /لا يسمح بتشغيله/.test(await m.textContent('.sheet'))); ok('فيديو يمنع التضمين يُفتح برابط يوتيوب بدل شاشة سوداء، وخطأ المشغّل (101) يستبدل المشغّل بالرابط');
  await m.click('.sheet [data-act="close"]'); await m.click('.daychips [data-v="' + new Date().getDay() + '"]');
  await m.click('.wex >> nth=1 >> .wxm'); await m.waitForSelector('.sheet a[target="_blank"]'); assert(/youtube\.com\/results/.test(await m.getAttribute('.sheet a[target="_blank"]', 'href')) && /noopener/.test(await m.getAttribute('.sheet a[target="_blank"]', 'rel'))); await m.click('.sheet [data-act="close"]');
  await m.click('.wex >> nth=2 >> .wxm'); assert(/لا فيديو/.test(await m.textContent('.sheet'))); await m.click('.sheet [data-act="close"]');
  await m.click('.wex >> nth=0 >> .wxc'); assert.strictEqual(await m.getAttribute('.wex >> nth=0 >> .wxc', 'aria-pressed'), 'true'); assert(/1 من 3/.test(await m.textContent('.scroll')));
  ok('تمريني: الأيام والأوقات، إحماء، تمارين بتفاصيلها، فيديو يوتيوب يُشغَّل داخل «حصتي» (nocookie) أو رابط خارجي آمن، وتعليم «تم» لتمارين اليوم');
  // ---- قائمة التسوق
  await m.click('.ptseg [data-v="shop"]'); await m.waitForSelector('.shi'); assert.strictEqual(await m.locator('.shi').count(), 3); assert(/اشتريتَ 0 من 3/.test(await m.textContent('.scroll')));
  await m.click('.shi >> nth=0 >> .shb'); assert(/اشتريتَ 1 من 3/.test(await m.textContent('.scroll'))); assert.strictEqual(await m.getAttribute('.shi >> nth=0 >> .shb', 'aria-pressed'), 'true'); assert.strictEqual(await m.evaluate(() => Object.keys(window.HissatiApp.state().shopOk).length), 1);
  await m.click('[data-act="shreset"]'); assert(/اشتريتَ 0 من 3/.test(await m.textContent('.scroll'))); ok('قائمة التسوق: بنود مجمّعة بكمياتها، تعليم ما اشتريت وشريط تقدم، و«من جديد»');
  assert(/0 <span>|0\s*ر\.س/.test((await m.textContent('.shtot')).replace(/\s+/g, ' ')) || /تكلفة الخطة/.test(await m.textContent('.shtot')));
  await m.fill('.px >> nth=0', '٢٥٫٥'.replace('٫', '.')); await m.fill('.px >> nth=1', '10'); await m.fill('.px >> nth=2', '14.5');
  assert.strictEqual((await m.textContent('.shtot b')).replace(/\s+/g, ' ').trim(), '50 ر.س'); assert(/لليوم/.test(await m.textContent('.shgrid')) && /7\.14/.test(await m.textContent('.shgrid')) && /214\.29/.test(await m.textContent('.shgrid')));
  await m.click('.shi >> nth=0 >> .shb'); assert(/25\.5/.test(await m.textContent('.shgrid > div:nth-child(1)')) && /24\.5/.test(await m.textContent('.shgrid > div:nth-child(2)')));
  await m.fill('#shBud', '40'); assert(/تتجاوز ميزانيتك بـ 10/.test(await m.textContent('#shsum'))); await m.fill('#shBud', '80'); assert(/تبقى من ميزانيتك 30/.test(await m.textContent('#shsum')));
  await m.selectOption('#shCur', 'ج.م'); assert(/ج\.م/.test(await m.textContent('.shtot b'))); await m.click('[data-act="shreset"]'); assert.strictEqual((await m.textContent('.shtot b')).replace(/\s+/g, ' ').trim(), '50 ج.م', 'الأسعار تبقى بعد «من جديد»');
  const px = await m.evaluate(() => window.HissatiApp.state().shopPx); assert.deepStrictEqual([px['دجاج'], px['بيض'], px['زيت زيتون']], [25.5, 10, 14.5]);
  ok('حاسبة التكلفة: سعر لكل بند فتجمع التكلفة، وما اشتُري والمتبقي، ولليوم وللشهر، ومقارنة بميزانية، وعملة بحسب البلد، والأسعار تبقى على الجوال');
  // ---- قائمة تلقائية من الخطة إن لم يُرسل الأخصائي قائمة
  await m.evaluate(() => { const S = window.HissatiApp.state(); S.shop = null; }); await m.click('.ptseg [data-v="meals"]'); await m.click('.ptseg [data-v="shop"]');
  const t = await m.textContent('.scroll'); assert(/بيض كامل/.test(t) && /جم في الأسبوع/.test(t), 'تُولَّد من الخطة بمجموع الجرامات الأسبوعي');
  ok('بلا قائمة مرسلة: تُولَّد من الخطة بمجموع الجرامات الأسبوعي لكل صنف');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1800)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
