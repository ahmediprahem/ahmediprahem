// الاستبيانات ونظام الجرامات في «حصتي» من طرف إلى طرف: محرر الاستبيانات (الحصص والجرامات) ← نسخة ورقية ← دعوة بنظام الجرامات ←
// العميل يملأ الاستبيان المعدّل (جدول التدريب، أسئلة مخصّصة إلزامية) ← طلب في «حصة» بالإجابات ← اعتماد كعميل نظام الجرامات ← خطة بالجرامات في «حصتي» ومتابعتها.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), http = require('http'), login = require('./auth_helper'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const ADMIN = fileUrl(path.resolve(__dirname, '../admin.html'));
(async () => {
  const wf = path.join(TMP, 'relay_worker_forms.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/relay/dist/worker.js'), wf);
  const W = await import(fileUrl(wf)), env = { DB: d1(), REG_KEY: 'k' };
  const srv = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
    const r = await W.default.fetch(new Request('http://127.0.0.1:' + srv.address().port + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : body }), env);
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const RELAY = 'http://127.0.0.1:' + srv.address().port, realFetch = globalThis.fetch;
  globalThis.fetch = (u, o) => /googleapis|mozilla|apple\.com/.test(String(u)) ? Promise.resolve(new Response(null, { status: 201 })) : realFetch(u, o);
  const b = await chromium.launch(), dctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }), d = await dctx.newPage(); d.on('pageerror', (e) => errs.push('حصة: ' + e)); d.on('dialog', (x) => x.accept());
  const mctx = await b.newContext({ ...devices['Pixel 7'] }), m = await mctx.newPage(); m.on('pageerror', (e) => errs.push('حصتي: ' + e)); m.on('dialog', (x) => x.accept());
  const hxCheck = async () => { await d.click('main [data-a="hxCheck"]'); await d.waitForTimeout(900); };
  const cPoll = async () => { await m.evaluate(() => window.HissatiApp.flush()); await m.evaluate(() => window.HissatiApp.poll()); await m.waitForTimeout(250); };
  const spec = (sys) => d.evaluate((s) => HForms.normalize((DPApp.S.settings.forms || {})[s], s), sys);
  await d.goto(ADMIN); await login(d);
  // ---- 1) التسمية الجديدة: نظامان أساسيان
  const rail = await d.textContent('.rail .newc'); assert(rail.includes('عميل جديد — الحصص') && rail.includes('عميل جديد — الجرامات') && !rail.includes('رياضي'));
  const tiles = await d.textContent('.ghome .qgrid'); assert(tiles.includes('نظام الحصص') && tiles.includes('نظام الجرامات'));
  ok('النظامان الأساسيان بالاسم الجديد: «نظام الحصص» و«نظام الجرامات» (بدل «رياضي»)');
  // ---- 2) محرر الاستبيان: الحصص
  await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="forms"]'); await d.waitForSelector('.fmstep');
  const exSteps = await d.locator('.fmstep').count(); assert.strictEqual(exSteps, 5); for (let i = 0; i < 6; i++) assert.strictEqual(await d.locator('.fmstep').first().locator('.fmq').nth(i).locator('input[data-fm$=",show"]').count(), 0, 'الأسئلة الأساسية جداً لا تُخفى'); assert.strictEqual(await d.locator('.fmstep').first().locator('input[data-fm$=",show"]').count(), 2);
  let sp = await spec('ex'); const hSi = sp.steps.findIndex((s) => s.id === 'health'), hbSi = sp.steps.findIndex((s) => s.id === 'habits'), wdQi = sp.steps[hbSi].q.findIndex((q) => q.id === 'wdays'), ntQi = sp.steps[hSi].q.findIndex((q) => q.id === 'notes');
  await d.uncheck(`[data-fm="q,${hbSi},${wdQi},show"]`); await d.fill(`[data-fm="q,${hSi},${ntQi},label"]`, 'هل هناك ظروف خاصة (عمل ليلي، سفر…)؟'); await d.press(`[data-fm="q,${hSi},${ntQi},label"]`, 'Tab');
  await d.locator('.fmstep').nth(hSi).locator('[data-a="fmQAdd"]').click(); await d.selectOption('#fm_t', 'one'); await d.fill('#fm_l', 'كم مرة تأكل خارج البيت أسبوعياً؟'); await d.fill('#fm_o', 'لا آكل خارجاً\n1–2 مرة\n3 مرات أو أكثر'); await d.check('#fm_r'); await d.click('[data-a="fmQSave"]');
  sp = await spec('ex'); const custEx = sp.steps[hSi].q.find((q) => !q.b); assert.deepStrictEqual([custEx.type, custEx.opts.length, custEx.req], ['one', 3, 1]); assert(sp.steps[hbSi].q.find((q) => q.id === 'wdays').hide); assert.strictEqual(sp.steps[hSi].q.find((q) => q.id === 'notes').label, 'هل هناك ظروف خاصة (عمل ليلي، سفر…)؟');
  ok('محرر استبيان الحصص: إخفاء سؤال أساسي، تعديل نص سؤال، وإضافة سؤال «اختيار واحد» إلزامي بخياراته (والأساسي جداً لا يُخفى)');
  // ---- 3) محرر الاستبيان: الجرامات (قسم جديد بأسئلة مختلفة، ترتيب، حذف)
  await d.click('[data-a="fmSys"][data-v="g"]'); assert.strictEqual(await d.locator('.fmstep').count(), 5);
  await d.click('[data-a="fmStepAdd"]'); const last = d.locator('.fmstep').last(); await last.locator('[data-fm$=",t"]').fill('نومك وتعافيك'); await last.locator('[data-fm$=",t"]').press('Tab');
  await d.selectOption('#fm_t', 'scale'); await d.fill('#fm_l', 'قيّم جودة نومك'); await d.check('#fm_r'); await d.click('[data-a="fmQSave"]');
  await d.locator('.fmstep').last().locator('[data-a="fmQAdd"]').click(); await d.selectOption('#fm_t', 'num'); await d.fill('#fm_l', 'كم ساعة تنام؟'); await d.fill('#fm_u', 'ساعة'); await d.click('[data-a="fmQSave"]');
  await d.locator('.fmstep').last().locator('[data-a="fmQAdd"]').click(); await d.selectOption('#fm_t', 'yn'); await d.fill('#fm_l', 'سؤال للحذف'); await d.click('[data-a="fmQSave"]');
  await d.locator('.fmstep').last().locator('[data-a="fmQDel"]').last().click(); await d.locator('.fmstep').last().locator('[data-a="fmQMv"]').nth(2).click();
  sp = await spec('g'); const cs = sp.steps[sp.steps.length - 1]; assert.deepStrictEqual([cs.t, cs.custom, cs.q.map((q) => q.label)], ['نومك وتعافيك', 1, ['كم ساعة تنام؟', 'قيّم جودة نومك']]); assert.strictEqual(cs.q[0].unit, 'ساعة');
  const [dl] = await Promise.all([d.waitForEvent('download'), d.click('[data-a="fmPrint"]')]); const fp = TMP + '/form_g.html'; await dl.saveAs(fp); const ph = fs.readFileSync(fp, 'utf8');
  assert(ph.includes('نظام الجرامات') && ph.includes('قيّم جودة نومك') && ph.includes('تدريب ثقيل') && ph.includes('ساعة') && !ph.includes('سؤال للحذف'));
  ok('محرر استبيان الجرامات: قسم جديد بأسئلة «مقياس» و«رقم بوحدة»، حذف سؤال وترتيب الأسئلة، ونسخة ورقية للطباعة فيها جدول التدريب والأسئلة الجديدة');
  // ---- 4) دعوة بنظام الجرامات
  await d.click('[data-a="setTab"][data-v="hx"]'); await d.fill('#hx_relay', RELAY); await d.fill('#hx_key', 'k'); await d.fill('#hx_name', 'د. أحمد حامد'); await d.click('[data-a="hxReg"]'); await d.waitForSelector('main .ok');
  await d.click('.rail [data-a="hxv"]'); await d.click('main [data-a="hxInvForm"]'); await d.fill('#hxi_l', 'كابتن خالد'); await d.selectOption('#hxi_s', 'g'); await d.click('[data-a="hxInvMake"]'); await d.waitForSelector('.hxinv.made .hxlink');
  assert((await d.textContent('.hxinv.made')).includes('نظام الجرامات')); const link = (await d.textContent('.hxinv.made .hxlink')).trim();
  const cat = JSON.parse(env.DB._raw.prepare('SELECT cat FROM invites').get().cat); assert.strictEqual(cat.sys, 'g'); assert(cat.fcats.includes('نشويات وحبوب') && cat.dayTypes.includes('تدريب ثقيل') && cat.form.steps.some((s) => s.t === 'نومك وتعافيك'));
  ok('دعوة بنظام الجرامات: تحمل استبيان الجرامات المعدّل وأغذية النظام وفئاتها وأنواع أيام التدريب');
  // ---- 5) العميل يملأ استبيان الجرامات
  await m.goto(link); await m.waitForSelector('.invite .dr'); await m.click('[data-act="go"][data-v="pin"]'); for (let i = 0; i < 2; i++) for (const k of '2468') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('.prog');
  assert((await m.textContent('.hd')).includes('الخطوة 1 من 6')); assert(await m.isVisible('#f_bf') && await m.isVisible('#f_sport'));
  await m.fill('#f_phone', '0500000000'); await m.click('#f_age'); await m.keyboard.type('٢٦'); await m.click('#f_weight'); await m.keyboard.type('82'); await m.click('#f_height'); await m.keyboard.type('180'); await m.click('[data-act="set"][data-k="sex"][data-v="ذكر"]');
  await m.click('#f_bf'); await m.keyboard.type('15'); await m.fill('#f_sport', 'كرة قدم'); await m.click('[data-act="set"][data-k="gphase"][data-v="تنشيف"]'); await m.click('.foot .btn');
  assert.strictEqual(await m.locator('.trow').count(), 7); await m.selectOption('[data-sch="0"]', 'تدريب ثقيل'); await m.fill('[data-schm="0"]', '90'); await m.fill('[data-scht="0"]', '18:30'); await m.selectOption('[data-sch="2"]', 'تدريب متوسط');
  await m.click('.foot .btn'); await m.click('.foot .btn');
  assert((await m.textContent('.fgrid')).length > 10 && (await m.textContent('.tabs')).includes('نشويات وحبوب')); const love = (await m.textContent('.food >> nth=0')).trim(); await m.click('.food >> nth=0'); await m.click('.foot .btn');
  await m.click('[data-act="set"][data-k="nmeals"][data-v="6"]'); await m.click('.foot .btn');
  assert((await m.textContent('.hd')).includes('نومك وتعافيك')); assert(await m.isDisabled('.foot .btn'), 'السؤال الإلزامي يمنع المتابعة'); await m.fill('[data-cq]', '٧'); await m.click('[data-act="cq1"][data-v="4"]'); assert(!(await m.isDisabled('.foot .btn'))); await m.click('.foot .btn');
  const rv = await m.textContent('.stack'); for (const s of ['كرة قدم', 'تنشيف', 'تدريب ثقيل 90د 18:30', 'تدريب متوسط 60د', '4 من 5', '7 ساعة', love]) assert(rv.includes(s), 'المراجعة بلا: ' + s);
  await m.check('#consent'); await m.click('[data-act="submit"]'); await m.waitForSelector('text=وصل طلبك إلى أخصائيك'); await cPoll();
  ok('«حصتي» تعرض استبيان الجرامات كما عدّله الأخصائي: 6 أقسام، جدول تدريب لكل يوم، أغذية النظام بفئاتها، وسؤال إلزامي يمنع المتابعة حتى الإجابة، ومراجعة كاملة');
  // ---- 6) الطلب والاعتماد كعميل نظام الجرامات
  await hxCheck(); await d.waitForSelector('.hxreq:not(.wait)'); const card = await d.textContent('.hxreq');
  for (const s of ['نظام الجرامات', 'كرة قدم', 'تنشيف', 'الأحد: تدريب ثقيل 90د 18:30', 'دهون 15%', 'قيّم جودة نومك', '4 من 5', 'كم ساعة تنام؟', '7 ساعة', love]) assert(card.includes(s), 'بطاقة الطلب بلا: ' + s);
  await d.click('[data-a="hxOk"]'); await d.waitForSelector('#atg');
  const c = await d.evaluate(() => { const c = DPApp.S.clients.filter((x) => x.code === DPApp.S.cur)[0]; return { kind: c.kind, w: c.weight, bf: c.bf, sport: c.sport, phase: c.phase, s0: c.schedule[0], s1: c.schedule[1], meals: c.athMeals.filter((m) => m.on).length, love: c.love, notes: c.notes }; });
  assert.deepStrictEqual([c.kind, c.w, c.bf, c.sport, c.phase, c.meals], ['athlete', 82, 15, 'كرة قدم', 'تنشيف', 6]); assert.deepStrictEqual(c.s0, { type: 'تدريب ثقيل', min: 90, time: '18:30' }); assert.strictEqual(c.s1.type, 'راحة'); assert.deepStrictEqual(c.love, [love]); assert(c.notes.includes('قيّم جودة نومك: 4 من 5'));
  await cPoll(); await m.waitForSelector('text=اعتمدك أخصائيك');
  ok('الطلب في «حصة» يعرض إجابات الجرامات والأسئلة المخصّصة، والاعتماد ينشئ عميل نظام الجرامات بجدول تدريبه ومرحلته ونسبة دهونه وعدد وجباته، والإجابات في ملاحظاته');
  // ---- 7) خطة الجرامات إلى «حصتي» ومتابعتها
  await d.click('button:has-text("ولّد الخطة ←")'); await d.waitForSelector('.pnav button'); await d.click('main .tabs [data-v="hx"]'); await d.click('[data-a="hxSendPlan"]'); await d.waitForSelector('text=آخر خطة أُرسلت: v1');
  await cPoll(); await m.waitForSelector('.tabbar'); const tday = await m.textContent('#root');
  const st = await m.evaluate(() => { const S = window.HissatiApp.state(), d0 = S.plan[0], l = d0.slots[0].lines[0]; return { sys: S.pm.sys, type: d0.type, kcal: d0.kcal, k1: S.plan[2].kcal, line: l[2], alts: l[3].length, alt: (l[3][0] || [])[1] || '', meal: d0.slots[0].meal }; });
  assert.strictEqual(st.sys, 'g'); assert(st.type === 'تدريب ثقيل' && st.kcal > st.k1, JSON.stringify(st)); assert(/^\d+ جم /.test(st.line) && /^\d+ جم /.test(st.alt) && st.alts > 0 && /بروتين \d+ • كارب \d+ • دهون \d+/.test(st.meal), JSON.stringify(st));
  await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="day"][data-v="0"]'); assert((await m.textContent('#root')).includes('تدريب ثقيل')); await m.click('[data-act="tab"][data-v="today"]');
  await m.locator('.it .ck').nth(0).click(); await m.locator('.it .sw').first().click(); const alt = (await m.textContent('.sheet button.opt >> nth=0')).trim(); assert(/\d+ جم/.test(alt)); await m.click('.sheet button.opt >> nth=0');
  await m.waitForTimeout(2800); await cPoll(); await d.click('main [data-a="hxCheck"]'); await d.waitForSelector('.hxtab .hxday'); assert((await d.textContent('.hxtab')).includes(alt));
  ok('خطة الجرامات تصل «حصتي»: سعرات كل يوم حسب نوع التدريب، الأصناف بالجرامات، ماكروز كل وجبة، وبدائل بجرامات مكافئة؛ والتبديل والمتابعة تعود إلى «حصة»');
  // ---- 8) استبيان الحصص المعدّل يصل أيضاً
  await d.click('.rail [data-a="hxv"]'); await d.click('main [data-a="hxInvForm"]'); await d.fill('#hxi_l', 'سارة'); await d.click('[data-a="hxInvMake"]'); await d.waitForSelector('.hxinv.made .hxlink');
  const link2 = (await d.textContent('.hxinv.made .hxlink')).trim(), j = await (await b.newContext({ ...devices['Pixel 7'] })).newPage(); j.on('pageerror', (e) => errs.push('حصص: ' + e));
  await j.goto(link2); await j.click('[data-act="go"][data-v="pin"]'); for (let i = 0; i < 2; i++) for (const k of '1357') await j.click(`.pad [data-v="${k}"]`); await j.waitForSelector('.prog');
  assert((await j.textContent('.hd')).includes('من 5')); await j.fill('#f_phone', '0511111111'); await j.fill('#f_age', '30'); await j.fill('#f_weight', '70'); await j.fill('#f_height', '165'); await j.click('.foot .btn');
  const h = await j.textContent('.stack'); assert(h.includes('كم مرة تأكل خارج البيت أسبوعياً؟') && h.includes('هل هناك ظروف خاصة')); assert(await j.isDisabled('.foot .btn')); await j.click('[data-act="cq1"][data-v="1–2 مرة"]'); assert(!(await j.isDisabled('.foot .btn')));
  await j.click('.foot .btn'); await j.click('.foot .btn'); await j.click('.foot .btn'); assert.strictEqual(await j.locator('[data-act="wday"]').count(), 0, 'أيام التمرين مخفية');
  ok('استبيان الحصص المعدّل يصل كما هو: النص الجديد، والسؤال المخصّص الإلزامي، والسؤال المخفي لا يظهر');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات الاستبيانات ونظام الجرامات في «حصتي»'); globalThis.fetch = realFetch; await b.close(); srv.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
