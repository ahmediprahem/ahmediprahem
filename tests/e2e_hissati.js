// «حصة ↔ حصتي» من طرف إلى طرف: المحطة الحقيقية (worker/relay/dist/worker.js فوق خادم محلي + D1 بديل)، و«حصة» (admin.html)، و«حصتي» على جوال.
// الدعوة برابط واتساب ← تسجيل العميل برمز دخول وأرقام عربية ← طلب في «حصة» ← اعتماد كعميل جديد ← إرسال الخطة ← المتابعة اليومية والوزن والمحادثة والتفضيلات في الاتجاهين.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), http = require('http'), login = require('./auth_helper'), d1 = require('./d1_shim.js');
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
  const b = await chromium.launch(), dctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), d = await dctx.newPage(); d.on('pageerror', (e) => errs.push('حصة: ' + e)); d.on('dialog', (x) => x.accept(x.type() === 'prompt' ? 'أرجو كتابة جرعة الدواء' : undefined));
  const mctx = await b.newContext({ ...devices['iPhone 13'] }), m = await mctx.newPage(); m.on('pageerror', (e) => errs.push('حصتي: ' + e)); m.on('dialog', (x) => x.accept());
  const hxCheck = async () => { await d.click('main [data-a="hxCheck"]'); await d.waitForFunction(() => !window.DPApp || ![...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('جارٍ التحقق')), null, { timeout: 8000 }); await d.waitForTimeout(300); };
  const shot = async (pg, name) => { if (process.env.SHOTS) await pg.screenshot({ path: path.join(process.env.SHOTS, name + '.png') }); };
  const cPoll = async () => { await m.evaluate(() => window.HissatiApp.flush()); await m.evaluate(() => window.HissatiApp.poll()); await m.waitForTimeout(200); };
  // ---- 1) ربط «حصة» بالمحطة
  await d.goto(ADMIN); await login(d); await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="hx"]');
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
  await shot(m, 'c5_today'); const today = await m.evaluate(() => { const S = window.HissatiApp.state(); return { kcal: S.pm.kcal, days: S.plan.length, alts: S.plan[0].slots[0].lines[0][3].length }; }); assert(today.kcal > 1000 && today.days === 7 && today.alts > 0, JSON.stringify(today));
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
  await m.click('[data-act="tab"][data-v="progress"]'); await shot(m, 'c7_progress'); await m.reload(); await m.waitForSelector('.pad'); for (const k of '0000') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('text=الرمز غير صحيح'); await shot(m, 'c8_lock');
  for (const k of '1234') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('.tabbar'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().pv), 1);
  const left = env.DB._raw.prepare('SELECT COUNT(*) AS n FROM msgs').get().n; assert(left <= 2, 'رسائل باقية في المحطة: ' + left);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert(sw <= 1, 'تمرير أفقي ' + sw);
  ok('إعادة فتح «حصتي» تطلب رمز الدخول (الخطأ يُرفض) وتعود الخطة كما هي، والمحطة تحذف ما استُلم، ولا تمرير أفقي على الجوال');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات «حصة ↔ حصتي» من طرف إلى طرف'); await b.close(); srv.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
