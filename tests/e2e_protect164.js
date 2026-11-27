// 1.64 «حماية البيانات» بلمسة وكود استرداد — مبني على إعداد e2e_vault: النسخ الاحتياطي التلقائي المشفّر والمزامنة بين جهازين عبر المحطة الحقيقية: التفعيل ← نسخة مشفّرة ← استرجاع على جهاز جديد (وكلمة سر خاطئة تُرفض)
// ← تعديلات على الجهازين ← مزامنة تدمج الجديد والمعدّل وتنقل الحذف وتحل تصادم الأكواد ← تعارض نفس العميل يُحفظ كإصدار ← لا رفع متكرر بلا تعديل.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), fs = require('fs'), http = require('http'), login = require('./auth_helper'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const ADMIN = fileUrl(path.resolve(__dirname, '../admin.html')), PW = 'نسخ-آمنة-2026';
(async () => {
  const wf = path.join(TMP, 'relay_worker_vault.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/relay/dist/worker.js'), wf);
  const W = await import(fileUrl(wf)), env = { DB: d1(), REG_KEY: 'k' };
  const srv = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
    const r = await W.default.fetch(new Request('http://127.0.0.1:' + srv.address().port + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : body }), env);
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const RELAY = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch();
  const dev = async (tag) => { const c = await b.newContext({ viewport: { width: 1400, height: 900 } }), p = await c.newPage(); p.on('pageerror', (e) => errs.push(tag + ': ' + e)); p.on('dialog', (x) => x.accept()); await p.goto(ADMIN); await login(p); return p; };
  const openSet = async (p) => { if (!(await p.isVisible('[data-a="setTab"][data-v="vault"]'))) await p.click('.rail [data-a="settings"]'); };
  const connect = async (p) => { await openSet(p); await p.click('[data-a="setTab"][data-v="hx"]'); await p.fill('#hx_relay', RELAY); await p.fill('#hx_key', 'k'); await p.fill('#hx_name', 'د. أحمد'); await p.click('[data-a="hxReg"]'); await p.waitForSelector('main .ok'); };
  const newClient = async (p, name) => { await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', name); await p.press('[data-f="name"]', 'Tab'); await p.waitForTimeout(400); };
  const pick = async (p, name) => { if (!(await p.isVisible('#lst'))) await p.click('.rail [data-a="clients"]'); await p.click(`#lst .cl:has-text("${name}")`); await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('[data-f="name"]'); };
  const vault = async (p) => { await openSet(p); await p.click('[data-a="setTab"][data-v="vault"]'); };
  const enable = async (p, devName) => { await vault(p); await p.fill('#vt_i', 'clinic-hamed'); await p.fill('#vt_d', devName); await p.fill('#vt_p', PW); await p.fill('#vt_p2', PW); await p.click('[data-a="vtOn"]'); await p.waitForSelector('main .ok:has-text("النسخ التلقائي مفعّل")', { timeout: 20000 }); };
  const names = (p) => p.evaluate(() => DPApp.S.clients.map((c) => c.name).sort());
  const toastWait = async (p, re) => p.waitForFunction((s) => [...document.querySelectorAll('.toast')].some((t) => new RegExp(s).test(t.textContent)), re.source, { timeout: 20000 });
  // ---- 1) الجهاز A: عملاء بلا حماية ← بطاقة «احمِ بيانات عملائك» في «اليوم»
  const A = await dev('A'); await connect(A); await newClient(A, 'سارة'); await newClient(A, 'خالد');
  await A.evaluate(() => DPApp.A.home()); await A.waitForSelector('.home .zp164'); assert(/2/.test(await A.textContent('.zp164'))); if (process.env.SHOT) await A.screenshot({ path: process.env.SHOT + '/zp_card.png' }); ok('عملاء بلا حماية: بطاقة «احمِ بيانات عملائك الآن» أعلى «اليوم»');
  await A.click('.zp164 [data-a="zpOn"]'); await A.waitForSelector('.zp164m #zpcode', { timeout: 30000 });
  const code = (await A.textContent('#zpcode')).trim(), id = (await A.textContent('.zp164m .zpkv b')).trim();
  assert(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/.test(code), code); if (process.env.SHOT) await A.screenshot({ path: process.env.SHOT + '/zp_code.png' }); assert(id.length > 0);
  assert.strictEqual(await A.isDisabled('#zpDone'), true); await A.check('#zpOk'); assert.strictEqual(await A.isDisabled('#zpDone'), false); await A.click('#zpDone');
  assert(!(await A.$('.zp164m'))); await A.evaluate(() => DPApp.A.home()); await A.waitForTimeout(400); assert(!(await A.$('.home .zp164')));
  assert.strictEqual(env.DB._raw.prepare('SELECT head FROM vaults').get().head, 1); const raw = env.DB._raw.prepare('SELECT data FROM vault_chunks').all().map((r) => r.data).join(''); assert(!raw.includes('سارة'));
  ok('لمسة واحدة: كود استرداد عشوائي (XXXXX-XXXXX-XXXXX-XXXXX) يُعرض مرة واحدة، «تم» لا يعمل قبل تأكيد الحفظ، وأول نسخة مشفّرة على المحطة، والبطاقة تختفي');
  // ---- 2) جهاز جديد (أو بعد «نسيت كلمة السر»): الاسترجاع بمعرّف النسخة وكود الاسترداد
  const B = await dev('B'); await B.waitForSelector('.vthome'); assert(!(await B.$('.home .zp164'))); await B.click('.vthome [data-a="vtOpen"]');
  await B.fill('#vt_r', RELAY); await B.fill('#vt_ri', id); await B.fill('#vt_rp', code); await B.click('[data-a="vtList"]'); await B.waitForSelector('.vtv');
  await B.uncheck('#vt_hx'); await B.click('.vtv [data-a="vtRestore"]'); await toastWait(B, /استُرجع/); assert.deepStrictEqual(await names(B), ['خالد', 'سارة']);
  ok('جهاز جديد: معرّف النسخة + كود الاسترداد يعيدان كل العملاء');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات حماية البيانات 1.64'); await b.close(); srv.close(); process.exit(0);
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); process.exit(1); });
