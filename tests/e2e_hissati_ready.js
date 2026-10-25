// «اختيار نظامي» من طرف إلى طرف (0.42): العميل في «حصتي» يجيب أسئلة قصيرة (سؤال في كل صفحة) ← الأمثل + بديلان مع المتوقع ← يختار
// ← يصل الاختيار مشفّراً إلى «حصة» ← الأخصائي يعتمد اختياره ← يُرسل النظام الجاهز من المكتبة ← يصل «حصتي» خطة أسبوع كاملة.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), http = require('http'), login = require('./auth_helper'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const wf = path.join(TMP, 'relay_worker_rq.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/relay/dist/worker.js'), wf);
  const W = await import(fileUrl(wf)), env = { DB: d1(), REG_KEY: 'clinic-key' };
  const srv = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
    const r = await W.default.fetch(new Request('http://127.0.0.1:' + srv.address().port + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : body }), env);
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const RELAY = 'http://127.0.0.1:' + srv.address().port;
  const site = http.createServer((q, r) => { const f = { '/': '../admin.html', '/sw.js': '../src/hissa_sw.js' }[q.url.split('?')[0]]; if (!f) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' }); r.end(fs.readFileSync(path.resolve(__dirname, f))); });
  await new Promise((r) => site.listen(0, '127.0.0.1', r)); const SITE = 'http://127.0.0.1:' + site.address().port;
  const b = await chromium.launch(), dctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), d = await dctx.newPage(); d.on('pageerror', (e) => errs.push('حصة: ' + e)); d.on('dialog', (x) => x.accept());
  const mctx = await b.newContext({ ...devices['iPhone 13'] }); await mctx.addInitScript(() => { try { localStorage.setItem('hissati_onb', '1'); } catch (e) { } }); const m = await mctx.newPage(); m.on('pageerror', (e) => errs.push('حصتي: ' + e)); m.on('dialog', (x) => x.accept());
  const hxCheck = async () => { await d.click('main [data-a="hxCheck"]'); await d.waitForFunction(() => ![...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('جارٍ التحقق')), null, { timeout: 8000 }); await d.waitForTimeout(300); };
  const cPoll = async () => { await m.evaluate(() => window.HissatiApp.flush()); await m.evaluate(() => window.HissatiApp.poll()); await m.waitForTimeout(250); };
  const shot = async (pg, name) => { if (process.env.SHOTS) await pg.screenshot({ path: path.join(process.env.SHOTS, name + '.png') }); };
  // ---- الربط والدعوة والتسجيل
  await d.goto(SITE + '/'); await login(d); await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="hx"]');
  await d.fill('#hx_relay', RELAY); await d.fill('#hx_key', 'clinic-key'); await d.fill('#hx_name', 'د. أحمد حامد'); await d.click('[data-a="hxReg"]'); await d.waitForSelector('main .ok');
  await d.click('.rail [data-a="hxv"]'); await d.click('main [data-a="hxInvForm"]'); await d.fill('#hxi_l', 'منى علي'); await d.fill('#hxi_p', '01001234567'); await d.click('[data-a="hxInvMake"]');
  await d.waitForSelector('.hxinv.made .hxlink'); const link = (await d.textContent('.hxinv.made .hxlink')).trim();
  await m.goto(link); await m.waitForSelector('.invite .dr'); await m.click('[data-act="go"][data-v="pin"]'); for (const k of '12341234') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('.prog');
  await m.fill('#f_phone', '01001234567'); await m.fill('#f_age', '34'); await m.fill('#f_weight', '88'); await m.fill('#f_height', '162');
  for (let i = 0; i < 10 && !(await m.isVisible('#consent')); i++) { if (await m.isDisabled('.foot .btn')) { const t = await m.textContent('.scr h2'); throw new Error('خطوة لا تكتمل: ' + t); } await m.click('.foot .btn'); await m.waitForTimeout(150); }
  await m.check('#consent'); await m.click('[data-act="submit"]'); await m.waitForSelector('text=وصل طلبك إلى أخصائيك'); await cPoll();
  // ---- 1) الأسئلة في «حصتي»: سؤال واحد في كل صفحة
  await m.waitForSelector('.rqcard'); assert(/ساعد أخصائيك يختار نظامك/.test(await m.textContent('.rqcard'))); await m.click('.rqcard [data-act="rqStart"]');
  await m.waitForSelector('.rq .rqopts'); assert(/سؤال 1 من/.test(await m.textContent('.rq .stepk'))); assert(/ما هدفك/.test(await m.textContent('.rq h2'))); await shot(m, 'rq1_goal');
  const pick = async (label) => { const h0 = await m.textContent('.rq h2'); await m.click(`.rqo:has-text("${label}")`); await m.waitForFunction((h) => document.querySelector('.rq h2') && document.querySelector('.rq h2').textContent !== h, h0, { timeout: 4000 }); };
  assert.strictEqual(await m.locator('.foot .btn').count(), 0, 'الاختيار الواحد ينتقل تلقائياً بلا زر');
  await pick('أنزل وزني'); assert(/أي أكل أقرب/.test(await m.textContent('.rq h2'))); await pick('مصري');
  assert(/هل ينطبق عليك/.test(await m.textContent('.rq h2'))); assert(await m.isDisabled('.foot .btn'), '«التالي» معطّل قبل الاختيار'); await m.click('.rqo:has-text("مقاومة إنسولين")'); await shot(m, 'rq2_many');
  assert.strictEqual(await m.getAttribute('.rqo:has-text("مقاومة إنسولين")', 'aria-checked'), 'true'); await m.click('.foot .btn');
  await pick('لا، المهم النزول'); await pick('نعم، آكلها'); assert(/أي أسلوب/.test(await m.textContent('.rq h2'))); await pick('نشويات أقل');
  assert(/يومك شكله/.test(await m.textContent('.rq h2'))); await m.click('[data-act="rqBack"]'); assert(/أي أسلوب/.test(await m.textContent('.rq h2'))); assert.strictEqual(await m.getAttribute('.rqo:has-text("نشويات أقل")', 'aria-checked'), 'true');
  await pick('نشويات أقل'); await m.click('.rqo:has-text("شغل أو دراسة")'); await m.waitForSelector('.rqres');
  ok('«حصتي»: بطاقة «ساعد أخصائيك يختار نظامك» ← أسئلة قصيرة، سؤال في كل صفحة بشريط تقدم، الاختيار الواحد ينتقل تلقائياً، والمتعدد بـ«التالي»، والرجوع يحفظ الإجابة');
  assert.strictEqual(await m.locator('.rqres').count(), 3); const best = await m.textContent('.rqres.best'); assert(/الأنسب لك/.test(best) && /اللو كارب/.test(best) && /مقاومة الأنسولين/.test(best), best);
  assert(/المتوقع/.test(best) && /كجم/.test(best)); assert(/تقديرية/.test(await m.textContent('.rq .stack'))); await shot(m, 'rq3_results');
  const sw = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert(sw <= 1, 'تمرير أفقي ' + sw);
  ok('النتيجة: الأنسب لك (لو كارب بشكل مقاومة الأنسولين ونمط الموظف) + بديلان، لكل منها المتوقع بالكيلو وسبب الاختيار، بلا تمرير أفقي');
  const pickId = await m.getAttribute('.rqres.best [data-act="rqPick"]', 'data-v'); await m.click('.rqres.best [data-act="rqPick"]'); await m.waitForSelector('.rqcard:has-text("أرسلت اختياراتك")');
  await cPoll(); const raw = env.DB._raw.prepare("SELECT body FROM msgs WHERE kind = 'e'").all(); assert(raw.every((r) => !r.body.includes('lowcarb') && !r.body.includes(pickId)), 'الاختيار يجب أن يصل مشفّراً');
  ok('اختيار النظام يُرسل مشفّراً إلى الأخصائي (المحطة لا ترى الإجابات ولا الاختيار)، وتتحول البطاقة إلى «أرسلت اختياراتك» مع إمكانية التعديل');
  // ---- 2) «حصة»: الاعتماد ثم اختيار العميل ثم الإرسال
  await hxCheck(); await d.waitForSelector('.hxreq:not(.wait)'); await d.click('[data-a="hxOk"]'); await d.waitForSelector('.rdbox');
  const box = await d.textContent('.rdbox'); assert(/العميل اختار من «حصتي»/.test(box) && /اللو كارب/.test(box), box);
  const q = await d.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).hx.quiz); assert.strictEqual(q.pick, pickId); assert.deepStrictEqual(q.ans.cond, ['ir']); assert.strictEqual(q.ans.style, 'lowcarb'); assert.strictEqual(q.top.length, 3);
  ok('«حصة»: إجابات العميل واختياره تصل مع طلبه وتنتقل لملفه عند الاعتماد، وصندوق المكتبة يعرض «العميل اختار من «حصتي»»');
  await d.click('.rdbox [data-a="rdFor"] >> nth=-1'); await d.waitForSelector('.rdl .rdcard'); assert(/أجاب العميل على أسئلة الاختيار/.test(await d.textContent('.rdl'))); assert.strictEqual(await d.inputValue('[data-rdq="style"]'), 'lowcarb');
  assert(/اللو كارب/.test(await d.textContent('.rdcard.best .rdh')));
  ok('مراجعة البدائل في «حصة» تبدأ من إجابات العميل نفسها (نفس الأمثل)');
  await d.click('.rail [data-a="ready"]'); await d.click('main .tabs [data-v="client"]'); await d.waitForSelector('.rdbox [data-a="rdApprove"]'); await d.click('.rdbox [data-a="rdApprove"]'); await d.waitForSelector('.rdbox [data-a="rdSend"]');
  let c = await d.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients[0]))); assert.strictEqual(c.ready.id, pickId);
  await d.click('.rdbox [data-a="rdSend"]'); await d.waitForFunction(() => DPApp.S.clients[0].ready.sentV === 1, null, { timeout: 15000 });
  ok('الأخصائي يعتمد اختيار العميل بضغطة، ثم «أرسل إلى «حصتي»» يرسل النظام الجاهز من المكتبة');
  // ---- 3) «حصتي» تستقبل الخطة الجاهزة
  await cPoll(); await m.waitForSelector('.tabbar', { timeout: 10000 }); const st = await m.evaluate(() => { const S = window.HissatiApp.state(); return { days: S.plan.length, ready: S.pm.ready, slots: S.plan[0].slots.length, lines: S.plan[0].slots[0].lines.length, alts: S.plan.some((d) => d.slots.some((s) => s.lines.some((l) => l[3].length))) }; });
  assert.strictEqual(st.days, 7); assert.strictEqual(st.ready.id, pickId); assert(st.slots >= 3 && st.lines >= 1 && st.alts, JSON.stringify(st));
  await m.click('[data-act="tab"][data-v="plan"]'); const hdr = await m.textContent('.stack'); assert(/اللو كارب/.test(hdr), 'اسم النظام في رأس «خطتي»'); assert(!/undefined/.test(hdr)); await shot(m, 'rq4_plan');
  ok('«حصتي»: يصل النظام الجاهز خطة 7 أيام بوجباتها وبدائل من نفس المجموعة، واسم النظام في «خطتي» (بلا قيم ناقصة)');
  assert.deepStrictEqual(errs, []); await b.close(); srv.close(); site.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
