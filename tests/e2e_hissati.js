// «حصة ↔ حصتي» من طرف إلى طرف: المحطة الحقيقية (worker/relay/dist/worker.js فوق خادم محلي + D1 بديل)، و«حصة» (admin.html)، و«حصتي» على جوال.
// الدعوة برابط واتساب ← تسجيل العميل برمز دخول وأرقام عربية ← طلب في «حصة» ← اعتماد كعميل جديد ← إرسال الخطة ← المتابعة اليومية والوزن والمحادثة والتفضيلات في الاتجاهين.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), http = require('http'), login = require('./auth_helper'), d1 = require('./d1_shim.js'), HXC = require('../src/hx_crypto.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const ADMIN = fileUrl(path.resolve(__dirname, '../admin.html'));
(async () => {
  // ---- المحطة: نفس الملف الذي يُلصق في Cloudflare
  const wf = path.join(TMP, 'relay_worker.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/relay/dist/worker.js'), wf);
  const W = await import(fileUrl(wf)), env = { DB: d1(), REG_KEY: 'clinic-key' };
  const srv = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
    const r = await W.default.fetch(new Request('http://127.0.0.1:' + srv.address().port + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : body }), env);
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const RELAY = 'http://127.0.0.1:' + srv.address().port;
  // اعتراض ما ترسله المحطة إلى خدمة إشعارات Google (الاشتراكات في الاختبار بديلة)
  const pushes = [], realFetch = globalThis.fetch; globalThis.fetch = (u, o) => /fcm\.googleapis\.com/.test(String(u)) ? (pushes.push({ u: String(u), o }), Promise.resolve(new Response(null, { status: 201 }))) : realFetch(u, o);
  const b = await chromium.launch({ channel: 'chromium' }), dctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), d = await dctx.newPage(); d.on('pageerror', (e) => errs.push('حصة: ' + e)); d.on('dialog', (x) => x.accept(x.type() === 'prompt' ? 'أرجو كتابة جرعة الدواء' : undefined));
  const mctx = await b.newContext({ ...devices['iPhone 13'] }), m = await mctx.newPage(); m.on('pageerror', (e) => errs.push('حصتي: ' + e)); m.on('dialog', (x) => x.accept());
  const hxCheck = async () => { await d.click('main [data-a="hxCheck"]'); await d.waitForFunction(() => !window.DPApp || ![...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('جارٍ التحقق')), null, { timeout: 8000 }); await d.waitForTimeout(300); };
  const shot = async (pg, name) => { if (process.env.SHOTS) await pg.screenshot({ path: path.join(process.env.SHOTS, name + '.png') }); };
  const cPoll = async () => { await m.evaluate(() => window.HissatiApp.flush()); await m.evaluate(() => window.HissatiApp.poll()); await m.waitForTimeout(200); };
  // ---- 1) ربط «حصة» بالمحطة
  // «حصة» تُخدم عبر HTTP كموقع الأخصائيين الحقيقي (عامل الخدمة sw.js لا يعمل من ملف على الجهاز)
  const site = http.createServer((q, r) => { const f = { '/': '../admin.html', '/sw.js': '../src/hissa_sw.js' }[q.url.split('?')[0]]; if (!f) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' }); r.end(fs.readFileSync(path.resolve(__dirname, f))); });
  await new Promise((r) => site.listen(0, '127.0.0.1', r)); const SITE = 'http://127.0.0.1:' + site.address().port;
  await dctx.grantPermissions(['notifications'], { origin: SITE });
  await dctx.addInitScript(() => { if (window.PushManager) PushManager.prototype.subscribe = async function () { return { endpoint: 'https://fcm.googleapis.com/fcm/send/e2e-dietitian-0001', unsubscribe: async () => true }; }; });
  await d.goto(SITE + '/'); await login(d); await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="hx"]');
  await d.fill('#hx_relay', RELAY); await d.fill('#hx_key', 'wrong'); await d.fill('#hx_name', 'د. أحمد حامد'); await d.click('[data-a="hxReg"]');
  await d.waitForSelector('main .warn'); assert((await d.textContent('main .warn')).includes('مفتاح التسجيل'));
  await d.fill('#hx_key', 'clinic-key'); await d.click('[data-a="hxReg"]'); await d.waitForSelector('main .ok'); assert((await d.textContent('main .ok')).includes('د. أحمد حامد'));
  assert.deepStrictEqual(await d.evaluate(() => DPApp.S.settings.hx), { relay: RELAY, regKey: 'clinic-key' });
  ok('«حصة» تُربط بالمحطة بمفتاح التسجيل (الخطأ يُرفض برسالة واضحة)، ويُحفظ العنوان للمستخدمين');
  // ---- 2) الدعوة
  await d.click('.rail [data-a="hxv"]'); await d.click('main [data-a="hxInvForm"]'); await shot(d, 'd0_invite_form'); await d.fill('#hxi_l', 'سارة أحمد'); await d.fill('#hxi_p', '0554079404'); await d.click('[data-a="hxInvMake"]');
  await d.waitForSelector('.hxinv.made .hxlink'); const link = (await d.textContent('.hxinv.made .hxlink')).trim(), wa = await d.getAttribute('.hxinv.made a[data-hxwa]', 'href');
  assert(link.startsWith(RELAY + '/#t=') && /#t=[\w-]{24}\.[\w-]{11}$/.test(link), link); assert(wa.startsWith('https://wa.me/966554079404?text=') && decodeURIComponent(wa).includes(link), wa);
  const relayInv = env.DB._raw.prepare('SELECT h, label, cat FROM invites').get(); assert.strictEqual(relayInv.label, 'سارة أحمد'); assert(!relayInv.cat.includes('0554079404') && JSON.parse(relayInv.cat).bank.length > 50);
  ok('دعوة العميل: رابط شخصي (الرمز وبصمة مفتاح الأخصائي بعد #) وزر واتساب برقمه الدولي، والمحطة لا تعرف الرمز ولا الجوال');
  // ---- 3) العميل يفتح الرابط وينشئ حسابه
  await m.goto(link); await m.waitForSelector('.invite .dr'); await shot(m, 'c1_invite'); assert((await m.textContent('.invite .dr')).includes('د. أحمد حامد')); assert.strictEqual(new URL(m.url()).hash, '');
  await m.click('[data-act="go"][data-v="pin"]'); for (const k of '1234') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('text=أعد كتابة الرمز');
  for (const k of '1234') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('.prog');
  assert.strictEqual(await m.inputValue('#f_name'), 'سارة أحمد'); const stored = await m.evaluate(() => localStorage.getItem('hissati_v1')); assert(stored && !stored.includes('سارة') && !stored.includes('"d"'));
  ok('«حصتي»: يتحقق من الأخصائي ويُخفي الرمز من شريط العنوان، ورمز دخول مؤكد مرتين، والبيانات على الجوال مشفّرة (لا اسم مقروء)');
  // ---- 4) التسجيل بأرقام عربية + الصحة + الوجبات + الأكلات
  await m.click('#f_phone'); await m.keyboard.type('٠٥٥٤٠٧٩٤٠٤'); await m.click('#f_age'); await m.keyboard.type('٢٩'); await m.click('#f_weight'); await m.keyboard.type('٧٢٫٥'); await m.click('#f_height'); await m.keyboard.type('١٦٢');
  await shot(m, 'c2_basic'); await m.click('.foot .btn'); const cond = await m.textContent('.chip >> nth=1'); await m.click('.chip >> nth=1'); await m.click('.foot .btn');
  await m.selectOption('select[data-k=like][data-v=B]', { index: 1 }); const likeB = await m.textContent('.pk.like b'); await m.selectOption('select[data-k=nope][data-v=L]', { index: 1 }); await m.click('.foot .btn');
  const love = (await m.textContent('.food >> nth=0')).trim(); await m.click('.food >> nth=0'); await m.click('.tabs button >> nth=2');
  const hate = (await m.textContent('.food >> nth=0')).trim(); await m.click('.food >> nth=0'); await m.click('.food >> nth=0'); await m.click('.foot .btn'); await m.click('.foot .btn');
  await shot(m, 'c3_foods_habits'); await m.check('#consent'); await m.click('[data-act="submit"]'); await m.waitForSelector('text=وصل طلبك إلى أخصائيك'); await cPoll();
  const raw = env.DB._raw.prepare("SELECT body FROM msgs WHERE kind = 'e'").all(); assert(raw.length >= 1 && raw.every((r) => !r.body.includes('سارة') && !r.body.includes(hate)));
  ok('التسجيل: أرقام عربية تُقبل، وحالة صحية ووجبات من قوائم «حصة» وأكلات محبوبة ومكروهة، ويصل الطلب مشفّراً (المحطة لا ترى الاسم ولا الأكلات)');
  // ---- 5) الطلب في «حصة» والاعتماد
  await hxCheck(); await d.waitForSelector('.hxreq:not(.wait)'); const card = await d.textContent('.hxreq'); await shot(d, 'd1_requests'); await shot(m, 'c4_sent');
  for (const s of ['سارة أحمد', '0554079404', '72.5', '162', cond, likeB, love, hate]) assert(card.includes(s), 'بطاقة الطلب بلا: ' + s);
  assert.strictEqual(await d.textContent('.rail [data-a="hxv"] em'), '1');
  await d.click('[data-a="hxOk"]'); await d.waitForSelector('[data-f="name"]');
  const c = await d.evaluate(() => { const c = DPApp.S.clients.filter((x) => x.code === DPApp.S.cur)[0]; return { name: c.name, phone: c.phone, w: c.weight, h: c.height, age: c.age, sex: c.sex, cond: c.conditions, avoid: c.avoid, love: c.love, fav: c.favMeals, ex: c.excludedMeals.length, hx: !!c.hx, code: c.code }; });
  assert.deepStrictEqual([c.name, c.phone, c.w, c.h, c.age, c.sex], ['سارة أحمد', '0554079404', 72.5, 162, 29, 'أنثى']); assert.deepStrictEqual(c.cond, [cond]); assert.deepStrictEqual(c.avoid, [hate]); assert.deepStrictEqual(c.love, [love]); assert.deepStrictEqual(c.fav, [likeB.trim()]); assert.strictEqual(c.ex, 1); assert(c.hx);
  assert(await d.isVisible('main .tabs [data-v="hx"]')); assert.strictEqual(await d.textContent('.rail [data-a="hxv"] em'), '');
  await cPoll(); await m.waitForSelector('text=اعتمدك أخصائيك'); assert((await m.textContent('.tl')).includes(c.code));
  ok('«حصة»: طلب العميل يظهر بكل بياناته مع شارة، والاعتماد ينشئ عميلاً جديداً مملوءاً (الأكلات المكروهة في «يتجنبها»)، ويصل الاعتماد ورقم الملف إلى «حصتي»');
  // ---- 6) الخطة ← «حصتي»
  await d.click('main .tabs [data-v="plan"]'); await d.click('button:has-text("ولّد الخطة")'); await d.waitForSelector('.pnav button');
  const planHas = await d.evaluate((f) => { const c = DPApp.S.clients.filter((x) => x.code === DPApp.S.cur)[0]; return c.plan.days.some((d) => d.slots.some((s) => s.lines.some((l) => l.name === f))); }, hate); assert.strictEqual(planHas, false, 'المحرك تجاهل «يتجنبها»');
  await d.click('main .tabs [data-v="hx"]'); await d.click('[data-a="hxSendPlan"]'); await d.waitForSelector('text=آخر خطة أُرسلت: v1');
  await cPoll(); await m.waitForSelector('.tabbar'); const meals = await m.locator('.card.meal').count(); assert(meals >= 3, String(meals));
  const inst = await m.textContent('.inst'); assert(inst.includes('إضافة إلى الشاشة الرئيسية') && inst.includes('إنشاء رمز النقل'), inst); await shot(m, 'c5_today'); const today = await m.evaluate(() => { const S = window.HissatiApp.state(); return { kcal: S.pm.kcal, days: S.plan.length, alts: S.plan[0].slots[0].lines[0][3].length }; }); assert(today.kcal > 1000 && today.days === 7 && today.alts > 0, JSON.stringify(today));
  ok('الخطة تُرسل من تبويب «حصتي» في ملف العميل وتصل كاملة (7 أيام ووجبات وبدائل لكل صنف) فتفتح «حصتي» على شاشة «اليوم»');
  // ---- 7) المتابعة اليومية والملاحظة والماء والوزن والمحادثة ← «حصة»
  await m.locator('.it .ck').nth(0).click(); await m.locator('.it .ck').nth(1).click(); await m.locator('.cups button').nth(2).click();
  await m.locator('[data-act="note"]').first().click(); await m.click('.sheet .chip >> nth=0'); await m.click('[data-act="savenote"]');
  await m.locator('.it .sw').first().click(); const swTo = (await m.textContent('.sheet button.opt >> nth=0')).trim(); await m.click('.sheet button.opt >> nth=0');
  await m.click('.chatbtn'); await m.fill('#chatIn', 'هل أقدر أبدّل الأرز بالبطاطس؟'); await m.press('#chatIn', 'Enter'); await m.click('[data-act="chatClose"]');
  await m.click('[data-act="tab"][data-v="progress"]'); await m.click('#wIn'); await m.keyboard.type('٧١٫٨'); await m.click('[data-act="weigh"]');
  await m.waitForTimeout(2800); await cPoll();
  await d.click('main .tabs [data-v="client"]'); await hxCheck().catch(() => { }); await d.click('.rail [data-a="hxv"]'); await hxCheck(); await d.waitForSelector('.hxlinked .hxnb');
  await d.click('.hxlinked .cl'); await d.waitForSelector('.hxtab .hxday');
  const tab = await d.textContent('.hxtab'); await shot(d, 'd2_client_tab'); for (const s of ['هل أقدر أبدّل الأرز بالبطاطس؟', 'أضفت شيئاً', '71.8', swTo]) assert(tab.includes(s), 'تبويب حصتي بلا: ' + s);
  assert(/\d+%/.test(await d.textContent('.hxday')) && (await d.textContent('.hxday')).includes('0.75'));
  assert.strictEqual(await d.evaluate(() => DPApp.S.clients.filter((x) => x.code === DPApp.S.cur)[0].weight), 71.8);
  ok('المتابعة: ما علّمه العميل والماء والملاحظة والتبديل والوزن ورسالته تصل ملف العميل في «حصة» (والوزن يُحدَّث في بياناته)');
  // ---- 8) رد الأخصائي ← إشعار في «حصتي» وعلامة القراءة
  await d.fill('#hxMsg', 'نعم، بدّلي من زر ⇄ بنفس الحصة'); await d.press('#hxMsg', 'Enter'); await d.waitForSelector('.hxb.me');
  await m.click('[data-act="tab"][data-v="today"]'); await cPoll(); await m.waitForSelector('.chatbtn .nb'); assert.strictEqual(await m.textContent('.chatbtn .nb'), '1');
  await m.click('.chatbtn'); await shot(m, 'c6_chat'); assert((await m.textContent('#thread')).includes('بدّلي من زر')); await m.waitForTimeout(200); await cPoll(); await m.click('[data-act="chatClose"]');
  await hxCheck(); assert((await d.textContent('.hxb.me small')).includes('✓✓'));
  ok('رد الأخصائي يصل «حصتي» بشارة على «راسل الأخصائي»، وفتح المحادثة يرسل علامة القراءة (✓✓) إلى «حصة»');
  // ---- 9) «لا أحب» بعد الخطة: يُستبدل في الجوال فوراً ويُضاف في «حصة» إلى «يتجنبها»
  const inPlan = await m.evaluate(() => { const S = window.HissatiApp.state(); return S.plan[0].slots[0].lines.find((l) => l[3].length)[1]; });
  await m.click('[data-act="tab"][data-v="prefs"]'); await m.fill('#fq_prefCat', inPlan); await m.waitForTimeout(100); await m.locator('.food', { hasText: inPlan }).first().click(); await m.locator('.food', { hasText: inPlan }).first().click();
  assert((await m.textContent('.toast')).includes('موضعاً')); assert.strictEqual(await m.evaluate((f) => window.HissatiApp.state().plan.some((d) => d.slots.some((s) => s.lines.some((l) => l[1] === f))), inPlan), false);
  await cPoll(); await hxCheck(); assert(await d.evaluate((f) => DPApp.S.clients.filter((x) => x.code === DPApp.S.cur)[0].avoid.includes(f), inPlan)); assert((await d.textContent('.hxpl')).includes(inPlan));
  ok('«لا أحب» في «حصتي» يحذف الصنف من الخطة فوراً ببديل من نفس المجموعة، ويصل «حصة» فيُضاف إلى «أصناف يتجنبها»');
  // ---- 10) القفل وإعادة الفتح، والمحطة لا تحتفظ بما استُلم
  await m.click('[data-act="tab"][data-v="progress"]'); await shot(m, 'c7_progress');
  // تجهيز الإشعارات قبل إعادة الفتح: السماح بالإشعارات، واشتراك بديل (Chromium بلا واجهة لا يتصل بخدمة Google)، واعتراض إرسال المحطة إلى خدمة الإشعارات
  await mctx.grantPermissions(['notifications'], { origin: RELAY });
  await mctx.addInitScript(() => { if (window.PushManager) { PushManager.prototype.subscribe = async function () { return { endpoint: 'https://fcm.googleapis.com/fcm/send/e2e-device-0001', unsubscribe: async () => true }; }; } });
  await m.reload(); await m.waitForSelector('.pad'); for (const k of '0000') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('text=الرمز غير صحيح'); await shot(m, 'c8_lock');
  for (const k of '1234') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('.tabbar'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().pv), 1);
  const left = env.DB._raw.prepare('SELECT COUNT(*) AS n FROM msgs').get().n; assert(left <= 2, 'رسائل باقية في المحطة: ' + left);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert(sw <= 1, 'تمرير أفقي ' + sw);
  ok('إعادة فتح «حصتي» تطلب رمز الدخول (الخطأ يُرفض) وتعود الخطة كما هي، والمحطة تحذف ما استُلم، ولا تمرير أفقي على الجوال');
  // ---- 11) الإشعارات والتطبيق مغلق
  await m.waitForFunction(() => window.HissatiApp.state() && window.HissatiApp.state().pushEp, null, { timeout: 15000 });
  assert.strictEqual(env.DB._raw.prepare('SELECT ep FROM push_subs').get().ep, 'https://fcm.googleapis.com/fcm/send/e2e-device-0001');
  await m.click('[data-act="tab"][data-v="progress"]'); assert((await m.textContent('main, #root')).includes('الإشعارات مفعّلة'));
  const swi = await m.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, active: !!r.active, ctl: !!navigator.serviceWorker.controller }; }); assert(swi.active && swi.scope === RELAY + '/', JSON.stringify(swi));
  ok('بعد السماح: «حصتي» تسجّل عامل الخدمة وتشترك في الإشعارات تلقائياً، وتختفي دعوة التفعيل ويظهر «الإشعارات مفعّلة»');
  await d.fill('#hxMsg', 'تذكير: قِيسي وزنك صباح الغد'); await d.press('#hxMsg', 'Enter'); await d.waitForTimeout(800);
  const toC = pushes.filter((x) => /e2e-device/.test(x.u)); assert.strictEqual(toC.length, 1, 'رسالة الأخصائي يجب أن تُرسل إشعاراً'); assert(/^vapid t=.+, k=.+/.test(toC[0].o.headers.Authorization) && !toC[0].o.body);
  ok('رسالة الأخصائي ← المحطة ترسل إشعاراً موقّعاً بلا محتوى إلى خدمة إشعارات جوال العميل');
  const cdp = await mctx.newCDPSession(m); const regs = []; cdp.on('ServiceWorker.workerRegistrationUpdated', (e) => regs.push(...e.registrations)); await cdp.send('ServiceWorker.enable'); await m.waitForTimeout(300);
  const reg = regs.find((r) => r.scopeURL === RELAY + '/'); assert(reg, JSON.stringify(regs));
  await m.click('[data-act="tab"][data-v="today"]'); assert.strictEqual(await m.locator('.chatbtn .nb').count(), 0);
  await cdp.send('ServiceWorker.deliverPushMessage', { origin: RELAY, registrationId: reg.registrationId, data: '' }); await m.waitForSelector('.chatbtn .nb', { timeout: 8000 });
  ok('وصول إشعار والتطبيق مفتوح: عامل الخدمة يوقظ التطبيق فيجلب الرسالة فوراً وتظهر الشارة (بلا انتظار الدورة الدورية)');
  const other = await mctx.newPage(); await other.goto('about:blank'); const cdp2 = await mctx.newCDPSession(other); await m.close(); await other.waitForTimeout(300);
  await cdp2.send('ServiceWorker.enable'); await cdp2.send('ServiceWorker.deliverPushMessage', { origin: RELAY, registrationId: reg.registrationId, data: '' }); await other.waitForTimeout(1200);
  const m2 = await mctx.newPage(); m2.on('pageerror', (e) => errs.push('حصتي2: ' + e)); await m2.goto(RELAY + '/'); await m2.waitForSelector('.pad');
  const notes = await m2.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((x) => [x.title, x.body, x.tag]));
  assert.deepStrictEqual(notes, [['حصتي', 'لديك جديد من أخصائيك — افتح «حصتي»', 'hissati']], JSON.stringify(notes));
  ok('وصول إشعار والتطبيق مغلق: يظهر إشعار «حصتي» على الجوال بنص عام (لا بيانات صحية في الإشعار)');
  await mctx.setOffline(true); await m2.reload(); await m2.waitForSelector('.pad'); for (const k of '1234') await m2.click(`.pad [data-v="${k}"]`); await m2.waitForSelector('.tabbar'); await m2.waitForSelector('.offline');
  await mctx.setOffline(false); ok('بلا إنترنت: «حصتي» تفتح من نسخة عامل الخدمة، وتعرض الخطة مع شارة «بلا اتصال»');
  // ---- 12) إشعارات الأخصائي على موقع «حصة»
  const dsub = env.DB._raw.prepare("SELECT id FROM push_subs WHERE ep LIKE '%e2e-dietitian%'").get(); assert(dsub, 'الأخصائي لم يشترك في الإشعارات');
  await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="hx"]'); assert((await d.textContent('main')).includes('إشعارات المتصفح مفعّلة'));
  await d.click('.rail [data-a="hxv"]'); assert.strictEqual(await d.locator('.hxnotif').count(), 0);
  ok('«حصة» على الموقع: بعد ربط المحطة تشترك في إشعارات المتصفح تلقائياً (مع السماح)، وتعرض «إشعارات المتصفح مفعّلة»');
  const before = pushes.length; await m2.click('.chatbtn'); await m2.fill('#chatIn', 'وزني اليوم 71.5 الحمد لله'); await m2.press('#chatIn', 'Enter'); await m2.waitForTimeout(800);
  const toD = pushes.slice(before).filter((x) => /e2e-dietitian/.test(x.u)); assert.strictEqual(toD.length, 1, 'رسالة العميل يجب أن ترسل إشعاراً للأخصائي'); assert(!toD[0].o.body);
  const dcdp = await dctx.newCDPSession(d), dregs = []; dcdp.on('ServiceWorker.workerRegistrationUpdated', (e) => dregs.push(...e.registrations)); await dcdp.send('ServiceWorker.enable'); await d.waitForTimeout(300);
  const dreg = dregs.find((r) => r.scopeURL === SITE + '/'); assert(dreg, JSON.stringify(dregs)); assert.strictEqual(await d.textContent('.rail [data-a="hxv"] em'), '');
  await dcdp.send('ServiceWorker.deliverPushMessage', { origin: SITE, registrationId: dreg.registrationId, data: '' });
  await d.waitForFunction(() => document.querySelector('.rail [data-a="hxv"] em').textContent === '1', null, { timeout: 8000 }); assert((await d.textContent('main')).includes('سارة أحمد'));
  ok('رسالة العميل ← إشعار للأخصائي بلا محتوى، ووصوله يوقظ «حصة» المفتوحة فتجلب الرسالة فوراً وتظهر الشارة');
  // ---- 13) التثبيت من المتصفح: الأيقونات والبيان، ونقل الحساب إلى «التطبيق المثبّت» (تخزين منفصل كآيفون)، ورمز الدعوة داخل التطبيق
  const man = await (await realFetch(RELAY + '/manifest.webmanifest')).json(); assert.strictEqual(man.display, 'standalone'); assert.strictEqual(man.start_url, '/');
  const sizes = {}; for (const ic of man.icons) { const buf = Buffer.from(await (await realFetch(RELAY + ic.src)).arrayBuffer()); sizes[ic.src] = [buf.readUInt32BE(16), buf.readUInt32BE(20), ic.purpose]; }
  assert.deepStrictEqual(sizes, { '/icon-192.png': [192, 192, 'any'], '/icon-512.png': [512, 512, 'any'], '/maskable-512.png': [512, 512, 'maskable'] }); assert.strictEqual((await realFetch(RELAY + '/apple-180.png')).status, 200);
  ok('قابل للتثبيت: البيان كامل (standalone) بأيقونات 192 و512 وأيقونة قابلة للقص لأندرويد، وأيقونة آيفون 180');
  await m2.click('[data-act="chatClose"]').catch(() => { }); await m2.click('[data-act="tab"][data-v="progress"]'); await m2.click('[data-act="xferNew"]'); await m2.waitForSelector('.xcode'); await shot(m2, 'c10_xfer');
  const code = (await m2.textContent('.xcode')).trim(); assert(/^HX1-[\w-]{38}$/.test(code), code);
  const ictx = await b.newContext({ ...devices['iPhone 13'] }), ip = await ictx.newPage(); ip.on('pageerror', (e) => errs.push('مثبّت: ' + e)); ip.on('dialog', (x) => x.accept());
  await ip.goto(RELAY + '/'); await ip.waitForSelector('#xferIn'); await shot(ip, 'c9_start'); assert((await ip.textContent('#root')).includes('لديّ رابط دعوة'));
  await ip.fill('#xferIn', 'HX1-wrong'); await ip.click('[data-act="useXfer"]'); await ip.waitForSelector('text=رمز النقل غير صحيح');
  await ip.fill('#xferIn', code); await ip.click('[data-act="useXfer"]'); await ip.waitForSelector('text=رمز الدخول لهذا الجهاز');
  for (const k of '5678') await ip.click(`.pad [data-v="${k}"]`); for (const k of '5678') await ip.click(`.pad [data-v="${k}"]`); await ip.waitForSelector('.tabbar');
  assert.strictEqual(await ip.evaluate(() => window.HissatiApp.state().pv), 1); assert(await ip.evaluate(() => window.HissatiApp.state().msgs.some((x) => x.t.includes('71.5'))));
  await m2.waitForSelector('text=انتقل حسابك', { timeout: 10000 }); assert.strictEqual(await m2.evaluate(() => localStorage.getItem('hissati_v1')), null);
  await d.fill('#hxMsg', 'وصلتني رسالتك على الجهاز الجديد؟').catch(async () => { await d.click('.hxlinked .cl'); await d.fill('#hxMsg', 'وصلتني رسالتك على الجهاز الجديد؟'); }); await d.press('#hxMsg', 'Enter'); await d.waitForTimeout(500);
  await ip.click('[data-act="tab"][data-v="today"]'); await ip.evaluate(() => window.HissatiApp.poll()); await ip.waitForSelector('.chatbtn .nb');
  ok('نقل الحساب برمز (كمن سجّل في Safari ثم ثبّت التطبيق): الرمز الخطأ يُرفض، والصحيح ينقل الخطة والمحادثة برمز دخول جديد، ويُمسح الحساب من المتصفح القديم، وتصل الرسائل للجهاز الجديد');
  await d.click('.rail [data-a="hxv"]'); await d.click('main [data-a="hxInvForm"]'); await d.fill('#hxi_l', 'خالد'); await d.click('[data-a="hxInvMake"]'); await d.waitForSelector('.hxinv.made .hxlink');
  const link2 = (await d.textContent('.hxinv.made .hxlink')).trim(), jctx = await b.newContext({ ...devices['iPhone 13'] }), jp = await jctx.newPage(); jp.on('pageerror', (e) => errs.push('دعوة: ' + e));
  await jp.goto(RELAY + '/'); await jp.fill('#invIn', 'مرحباً خالد، رابطك: ' + link2); await jp.click('[data-act="useInv"]'); await jp.waitForSelector('.invite .dr'); await shot(jp, 'c11_invite_ios'); assert((await jp.textContent('.invite')).includes('د. أحمد حامد'));
  assert((await jp.textContent('.inst')).includes('نسخ رمز الدعوة')); assert.strictEqual(await jp.textContent('.foot .btn'), 'التسجيل هنا في Safari');
  ok('فتح التطبيق المثبّت أول مرة: يقبل لصق رسالة الدعوة أو رمزها فيبدأ التسجيل داخله؛ وعلى آيفون تشرح شاشة الدعوة «ثبّت أولاً» مع نسخ رمز الدعوة');
  await ip.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__prompted = 1; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  await ip.click('[data-act="tab"][data-v="progress"]'); await ip.click('.inst [data-act="install"]'); assert.strictEqual(await ip.evaluate(() => window.__prompted), 1); await ip.waitForSelector('text=جارٍ التثبيت');
  ok('حين يتيح المتصفح التثبيت (Chrome/أندرويد) يظهر زر «تثبيت «حصتي»» ويفتح نافذة التثبيت الأصلية');
  // ---- التثقيف: الأخصائي ينشر من «حصة» (نصيحة، صور تُضغط وتُرفع، ريلز يوتيوب) ← تبويب «تثقيف» في «حصتي» بشارة «جديد» ← إعجاب وتعليق ← رد الأخصائي ← منشور عام من أخصائي آخر ينتظر الإدارة
  {
    await d.click('.rail [data-a="feed"]'); await d.waitForSelector('.fdcomp'); await d.waitForSelector('.fdpage .ok:has-text("إدارة المحطة")', { timeout: 8000 });
    await d.click('[data-a="fdKind"][data-v="tip"]'); await d.fill('#fd_title', 'اشرب الماء قبل الوجبة'); await d.fill('#fd_body', 'كوب ماء قبل الوجبة بربع ساعة يساعد على الشبع.'); await d.click('[data-a="fdPost"]'); await d.waitForSelector('.toast:has-text("نُشر")');
    await d.click('[data-a="fdKind"][data-v="image"]'); await d.setInputFiles('#fd_files', [path.resolve(__dirname, '../assets/hissati/icon-512.png'), path.resolve(__dirname, '../assets/hissati/icon-192.png')]); await d.waitForSelector('.fdth img >> nth=1');
    await d.fill('#fd_title', 'طبق متوازن'); await d.click('[data-a="fdPost"]'); await d.waitForSelector('.fdpost h3:has-text("طبق متوازن")');
    const med = env.DB._raw.prepare('SELECT type, size FROM media').all(); assert.deepStrictEqual(med.map((x) => x.type), ['image/jpeg', 'image/jpeg']); assert(med.every((x) => x.size < 200000), 'الصور تُضغط');
    await d.click('[data-a="fdKind"][data-v="reel"]'); assert((await d.textContent('.fdcomp')).includes('R2')); await d.fill('#fd_link', 'https://evil.example/x'); await d.click('[data-a="fdPost"]'); await d.waitForSelector('.toast:has-text("رابط يوتيوب غير صحيح")');
    await d.fill('#fd_link', 'https://youtube.com/shorts/abcDEF12345'); await d.fill('#fd_title', 'وجبة خفيفة في دقيقة'); await d.click('[data-a="fdPost"]'); await d.waitForSelector('.fdpost h3:has-text("وجبة خفيفة")');
    await d.waitForSelector('.fdimgs img[src^="blob:"]'); assert.strictEqual(await d.locator('.fdpost').count(), 3); await shot(d, 'd5_feed');
    ok('التثقيف في «حصة»: نسخة المدير تصبح الإدارة تلقائياً، ونشر نصيحة وصور (تُضغط JPEG قبل الرفع وتُعرض من المحطة) وريلز يوتيوب (الرابط غير يوتيوب يُرفض، وملف الفيديو يحتاج R2)');
    await ip.evaluate(() => window.HissatiApp.feedLoad()); await ip.click('[data-act="tab"][data-v="today"]'); assert.strictEqual(await ip.textContent('.tabbar [data-v="feed"] .nb'), '3');
    await ip.click('[data-act="tab"][data-v="feed"]'); await ip.waitForSelector('.post >> nth=2'); assert.strictEqual(await ip.locator('.tabbar [data-v="feed"] .nb').count(), 0, 'الشارة تختفي بعد المشاهدة');
    const t = await ip.textContent('.scroll'); assert(t.includes('اشرب الماء قبل الوجبة') && t.includes('د. أحمد حامد') && t.includes('من أخصائيك') && t.includes('نصيحة'));
    await ip.waitForFunction(() => [...document.querySelectorAll('.pimgs img')].length === 2 && [...document.querySelectorAll('.pimgs img')].every((i) => i.complete && i.naturalWidth > 100));
    await ip.click('.pyt.ph.reel'); assert((await ip.getAttribute('.pyt.reel iframe', 'src')).startsWith('https://www.youtube-nocookie.com/embed/abcDEF12345')); await shot(ip, 'c12_feed');
    const tip = '.post:has(h3:has-text("اشرب الماء"))'; await ip.click(tip + ' [data-act="fdLike"]'); await ip.waitForFunction(() => document.querySelector('.post [data-act="fdLike"].on'));
    await ip.waitForTimeout(300); assert.strictEqual(env.DB._raw.prepare("SELECT likes FROM posts WHERE title = 'اشرب الماء قبل الوجبة'").get().likes, 1);
    await ip.click(tip + ' [data-act="fdCm"]'); await ip.waitForSelector('#cmIn'); assert((await ip.textContent('.sheet')).includes('«سارة»')); await ip.fill('#cmIn', 'كم كوب يكفي؟'); await ip.click('[data-act="fdCmSend"]'); await ip.waitForSelector('.cms .cm:has-text("كم كوب يكفي؟")'); assert.strictEqual(await ip.inputValue('#cmIn'), '', 'المسودة تُفرَّغ بعد النشر');
    assert((await ip.textContent('.cms .cm')).includes('سارة')); await ip.click('.sheet [data-act="close"]');
    ok('«حصتي»: تبويب «تثقيف» بشارة المنشورات الجديدة، الصور من المحطة، ريلز يوتيوب يُشغَّل داخل التطبيق (youtube-nocookie)، والإعجاب والتعليق باسم العميل الأول');
    await d.click('[data-a="fdRefresh"]'); await d.waitForSelector('.fdpost:has-text("اشرب الماء") [data-a="fdCm"]:has-text("1 تعليق")'); assert((await d.textContent('.fdpost:has-text("اشرب الماء") [data-a="fdLike"]')).includes('1'));
    await d.click('.fdpost:has-text("اشرب الماء") [data-a="fdCm"]'); await d.waitForSelector('.fdcm:has-text("كم كوب يكفي؟")'); await d.fill('[data-fdr]', 'من 6 إلى 8 أكواب يومياً'); await d.press('[data-fdr]', 'Enter'); await d.waitForSelector('.fdcm.dr:has-text("6 إلى 8")');
    await ip.click(tip + ' [data-act="fdCm"]'); await ip.waitForSelector('.cm.dr:has-text("6 إلى 8")'); assert((await ip.textContent('.cm.dr')).includes('أخصائي')); await ip.click('.sheet [data-act="close"]');
    ok('الأخصائي يرى الإعجاب والتعليق ويرد من «حصة»، ويظهر رده مميزاً «أخصائي» في «حصتي»');
    const B = await HXC.genIdentity(), callB = async (method, p, obj) => { const body = obj === undefined ? '' : JSON.stringify(obj); const r = await realFetch(RELAY + p, { method, headers: { 'content-type': 'application/json', authorization: await HXC.signReq(B, method, p, body) }, body: method === 'POST' ? body : undefined }); return r.json(); };
    await callB('POST', '/v1/register', { sigPub: B.sigPub, encPub: B.encPub, name: 'د. منى', regKey: 'clinic-key' }); assert.strictEqual((await callB('POST', '/v1/posts', { kind: 'text', title: 'الألياف وصحة الأمعاء', body: 'نص', scope: 'public' })).status, 'pending');
    await ip.evaluate(() => window.HissatiApp.feedLoad()); assert(!(await ip.evaluate(() => window.HissatiApp.feed().posts.some((x) => x.title === 'الألياف وصحة الأمعاء'))), 'المعلّق لا يظهر للمراجعين');
    await d.click('[data-a="fdRefresh"]'); await d.waitForFunction(() => (document.querySelector('.rail [data-a="feed"] em') || {}).textContent === '1'); await d.click('[data-a="fdFilter"][data-v="pending"]');
    await d.waitForSelector('.fdpost:has-text("الألياف") .fdst.wait'); await d.click('.fdpost:has-text("الألياف") [data-a="fdReview"][data-ok="1"]'); await d.waitForSelector('.toast:has-text("اعتُمد")');
    await ip.click('[data-act="fdRefresh"]'); await ip.waitForSelector('.post:has-text("الألياف وصحة الأمعاء")'); assert((await ip.textContent('.post:has-text("الألياف")')).includes('منشور عام'));
    await d.click('[data-a="fdFilter"][data-v="all"]'); await d.click('.fdpost:has-text("طبق متوازن") [data-a="fdDel"]'); await d.waitForSelector('.toast:has-text("حُذف المنشور")');
    assert.strictEqual(env.DB._raw.prepare('SELECT COUNT(*) AS n FROM media').get().n, 0, 'حذف المنشور يحذف صوره'); await ip.click('[data-act="fdRefresh"]'); await ip.waitForFunction(() => !document.body.textContent.includes('طبق متوازن'));
    ok('المنشور العام من أخصائي آخر لا يظهر للمراجعين قبل موافقة الإدارة؛ يظهر للإدارة في «المراجعة» بشارة، وبعد الاعتماد يصل مراجعي «حصة» «منشوراً عاماً»؛ وحذف المنشور يحذفه وصوره');
  }
  // ---- المرحلة 5: وصفة بصورة من محرر الحصص ← تصل مع الخطة وتُفتح بلمس الوجبة؛ صورة وجبة مشفّرة من «حصتي» ← تعليق سريع من «حصة»؛ تذكير الماء
  {
    const tgt = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.name === 'سارة أحمد'), day = c.plan.days[new Date().getDay()], s = day.slots.find((q) => q.meal); return { meal: s && s.meal, code: c.code }; });
    assert(tgt.meal, 'وجبة من البنك في خطة اليوم');
    await d.click('.rail [data-a="bank"]'); await d.waitForSelector('.bkr', { state: 'attached' });
    await d.evaluate((n) => { const el = [...document.querySelectorAll('.bkr')].find((r) => r.querySelector('.bkn b').textContent === n); el.querySelector('[data-a="rcEdit"]').click(); }, tgt.meal); await d.waitForSelector('.rced');
    await d.fill('#rc_steps', 'سخّن المقلاة\nأضف المكونات وقلّب 5 دقائق'); await d.fill('#rc_mins', '١٥'); await d.setInputFiles('#rc_file', path.resolve(__dirname, '../assets/hissati/icon-512.png')); await d.waitForSelector('.rcimg img');
    await d.click('[data-a="rcSave"]'); await d.waitForSelector('.toast:has-text("حُفظت الوصفة")'); assert(await d.isVisible('.bkr:has-text("' + tgt.meal + '") .rcon'));
    await d.evaluate((code) => DPApp.A.pick(code), tgt.code); await d.click('main .tabs [data-v="hx"]'); const m0 = env.DB._raw.prepare('SELECT COUNT(*) AS n FROM media').get().n;
    await d.click('[data-a="hxSendPlan"]'); await d.waitForSelector('text=آخر خطة أُرسلت: v2'); assert.strictEqual(env.DB._raw.prepare('SELECT COUNT(*) AS n FROM media').get().n, m0 + 1, 'صورة الوصفة رُفعت مرة');
    assert(await d.evaluate(() => Object.values(DPApp.S.settings.recipes)[0].key.length === 24));
    await ip.evaluate(() => window.HissatiApp.poll()); await ip.click('[data-act="tab"][data-v="today"]'); await ip.waitForSelector('[data-act="rcp"]');
    await ip.locator('[data-act="rcp"]').first().click(); await ip.waitForSelector('.rcp'); const rt = await ip.textContent('.rcp'); assert(rt.includes('أضف المكونات وقلّب') && rt.includes('15 دقيقة') && rt.includes('المقادير لك'), rt);
    await ip.waitForFunction(() => { const i = document.querySelector('.rcp img'); return i && i.complete && i.naturalWidth > 100; }); await shot(ip, 'c13_recipe'); await ip.click('.sheet [data-act="close"]');
    ok('الوصفات: تُكتب لوجبة البنك بخطوات ووقت (أرقام عربية) وصورة تُضغط، وتُرفع صورتها مرة عند إرسال الخطة، وتظهر في «حصتي» بلمس «الوصفة» مع مقادير العميل من خطته');
    const [fc] = await Promise.all([ip.waitForEvent('filechooser'), ip.locator('[data-act="photo"]').first().click()]); await fc.setFiles(path.resolve(__dirname, '../assets/hissati/icon-512.png'));
    await ip.waitForSelector('.toast:has-text("أُرسلت صورة")'); await ip.evaluate(() => window.HissatiApp.flush()); await ip.waitForSelector('.phs figure img');
    const raw = env.DB._raw.prepare("SELECT body FROM msgs WHERE kind = 'e' ORDER BY id DESC LIMIT 1").get().body; assert(raw.length > 5000 && !raw.includes('/9j/'), 'الصورة مشفّرة');
    await hxCheck(); await d.waitForSelector('.phgrid figure.new img'); assert(await d.evaluate(() => document.querySelector('.phgrid img').src.startsWith('data:image/jpeg;base64,')));
    await d.click('.phgrid [data-a="phCm"] >> nth=0'); await d.waitForSelector('.phcm:has-text("ممتاز")');
    await ip.evaluate(() => window.HissatiApp.poll()); await ip.waitForSelector('.phs figcaption:has-text("ممتاز")'); await shot(ip, 'c14_photo');
    ok('صور الوجبات: «صوّر وجبتك» تُضغط وتُرسل مشفّرة (المحطة لا ترى JPEG)، وتظهر في ملف العميل بـ«حصة»، والتعليق السريع يصل تحت الصورة في «حصتي»');
    await ip.click('[data-act="tab"][data-v="progress"]'); await ip.check('[data-rem="water"]'); const remRow = async (n) => { for (let i = 0; i < 80; i++) { const r = env.DB._raw.prepare('SELECT mins FROM remind').get(); if (r && JSON.parse(r.mins).length >= n) return r; await new Promise((z) => setTimeout(z, 100)); } return null; }; await remRow(6);
    const rr = env.DB._raw.prepare('SELECT mins FROM remind').get(); assert.strictEqual(JSON.parse(rr.mins).length, 6);
    const cache = await ip.evaluate(async () => (await (await caches.open('hissati-rem')).match('/rem')).json()); assert.strictEqual(cache.items.filter((x) => x.t === 'water').length, 6);
    await ip.check('[data-rem="meals"]'); assert(await remRow(7), 'أوقات الوجبات أُضيفت');
    ok('التذكيرات: الماء كل ساعتين والوجبات في أوقات الخطة — تُحفظ أوقاتها بتوقيت UTC في المحطة، ونصوصها في عامل الخدمة');
  }
  // ---- العادات: مكتبة العادات ← إضافتها لـ«اليوم» بتصاميمها ← الإنجاز والسلسلة والأسبوع ← تصل الأخصائي مع المتابعة
  {
    await ip.click('[data-act="tab"][data-v="today"]'); await ip.waitForSelector('.hb[data-hb="water"] .bottle'); assert.strictEqual(await ip.locator('.hb').count(), 1, 'الماء افتراضياً');
    await ip.click('[data-act="habits"]'); await ip.waitForSelector('.hlib'); assert.strictEqual(await ip.locator('.hli').count(), 10);
    for (const id of ['steps', 'sleep', 'veg', 'sugar', 'move', 'breath', 'mindful', 'kitchen', 'coffee']) await ip.click('[data-act="htoggle"][data-v="' + id + '"]');
    await ip.click('.sheet [data-act="close"]'); assert.strictEqual(await ip.locator('.hb').count(), 10);
    for (let i = 0; i < 9; i++) await ip.click('[data-hb="steps"] [data-k="+1000"]');
    await ip.click('[data-hb="sleep"] [data-k="8"]'); for (let i = 0; i < 5; i++) await ip.click('[data-hb="veg"] path[data-k="' + i + '"]');
    await ip.click('[data-hb="sugar"] [data-k="1"]'); await ip.click('[data-hb="move"] [data-k="2"]'); await ip.click('[data-hb="mindful"] [data-k="0"]'); await ip.click('[data-hb="mindful"] [data-k="1"]');
    await ip.click('[data-hb="kitchen"] [data-k="1"]'); await ip.click('[data-hb="coffee"] [data-k="3"]');
    for (const id of ['steps', 'sleep', 'veg', 'sugar', 'move', 'mindful', 'kitchen']) assert(await ip.isVisible('[data-hb="' + id + '"].done'), 'لم تكتمل: ' + id);
    assert(!(await ip.isVisible('[data-hb="coffee"].done')), '4 أكواب أكثر من 3'); assert((await ip.textContent('[data-hb="coffee"]')).includes('4 أكواب • الحد 3'));
    assert((await ip.textContent('[data-hb="steps"]')).includes('9,000')); assert(await ip.isVisible('[data-hb="sugar"] .flame.lit'));
    await ip.click('[data-hb="breath"] [data-act="breathe"]'); await ip.waitForSelector('#brx .ring.in', { timeout: 3000 }); await ip.click('#brstop'); assert.strictEqual(await ip.locator('#brx').count(), 0);
    if (process.env.SHOTS) for (const id of ['water', 'steps', 'sleep', 'veg', 'sugar', 'move', 'breath', 'mindful', 'kitchen', 'coffee']) await ip.locator('[data-hb="' + id + '"]').screenshot({ path: path.join(process.env.SHOTS, 'h_' + id + '.png') }); await ip.evaluate(() => { const S = window.HissatiApp.state(), d = new Date(Date.now() - 86400000), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); S.log[k] = Object.assign(S.log[k] || { ck: {}, sw: {}, note: {}, skip: {}, water: 0 }, { h: { sugar: 1 } }); });
    await ip.click('[data-hb="sleep"] [data-k="8"]'); await ip.click('[data-hb="sleep"] [data-k="8"]'); assert((await ip.textContent('[data-hb="sugar"] .hbs')).includes('2'), 'سلسلة يومين');
    await ip.click('[data-act="tab"][data-v="progress"]'); assert((await ip.textContent('.hgrid')).includes('المشي اليومي'));
    await ip.waitForTimeout(2800); await ip.evaluate(() => window.HissatiApp.flush()); await hxCheck(); await d.click('main .tabs [data-v="hx"]').catch(() => { });
    const tx = await d.textContent('.hxday'); assert(tx.includes('✓🚶 9000 خطوة') && tx.includes('✓😴 8 س نوم') && tx.includes('✗☕ 4 كوب قهوة'), tx.slice(0, 400));
    ok('العادات: مكتبة من 10 عادات صحية تُضاف لـ«اليوم» بتصميم لكل عادة (قارورة الماء، عدّاد الخطوات، سماء النوم، صحن الخضار، شعلة السلسلة، بطارية النشاط، جلسة تنفّس، أكواب القهوة)، والإنجاز والسلسلة والأسبوع، وتصل الأخصائي في المتابعة اليومية');
  }
  await ictx.close(); await jctx.close();
  site.close(); globalThis.fetch = realFetch;
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات «حصة ↔ حصتي» من طرف إلى طرف'); await b.close(); srv.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
