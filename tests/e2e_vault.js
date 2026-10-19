// النسخ الاحتياطي التلقائي المشفّر والمزامنة بين جهازين عبر المحطة الحقيقية: التفعيل ← نسخة مشفّرة ← استرجاع على جهاز جديد (وكلمة سر خاطئة تُرفض)
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
  const newClient = async (p, name) => { await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', name); await p.press('[data-f="name"]', 'Tab'); await p.waitForTimeout(400); };
  const pick = async (p, name) => { if (!(await p.isVisible('aside .clients'))) await p.click('.rail [data-a="clToggle"], .rail [data-a="home"]'); await p.click(`aside .cl:has-text("${name}")`); await p.waitForSelector('[data-f="name"]'); };
  const vault = async (p) => { await openSet(p); await p.click('[data-a="setTab"][data-v="vault"]'); };
  const enable = async (p, devName) => { await vault(p); await p.fill('#vt_i', 'clinic-hamed'); await p.fill('#vt_d', devName); await p.fill('#vt_p', PW); await p.fill('#vt_p2', PW); await p.click('[data-a="vtOn"]'); await p.waitForSelector('main .ok:has-text("النسخ التلقائي مفعّل")', { timeout: 20000 }); };
  const names = (p) => p.evaluate(() => DPApp.S.clients.map((c) => c.name).sort());
  const toastWait = async (p, re) => p.waitForFunction((s) => [...document.querySelectorAll('.toast')].some((t) => new RegExp(s).test(t.textContent)), re.source, { timeout: 20000 });
  // ---- 1) الجهاز A: عملاء ثم تفعيل النسخ التلقائي
  const A = await dev('A'); await connect(A); await newClient(A, 'سارة'); await newClient(A, 'خالد');
  await vault(A); assert(await A.isVisible('#vt_p')); await A.fill('#vt_i', 'clinic-hamed'); await A.fill('#vt_d', 'حاسوب العيادة'); await A.fill('#vt_p', 'short'); await A.fill('#vt_p2', 'short'); await A.click('[data-a="vtOn"]'); await toastWait(A, /8 أحرف/);
  await enable(A, 'حاسوب العيادة'); const head = env.DB._raw.prepare('SELECT head FROM vaults').get().head; assert.strictEqual(head, 1);
  const raw = env.DB._raw.prepare('SELECT data FROM vault_chunks').all().map((r) => r.data).join(''); assert(raw.length > 100 && !raw.includes('سارة') && !/"clients"/.test(raw), 'الخزنة يجب أن تكون مشفّرة');
  assert((await A.textContent('.sbg[data-g="bak"]')).includes('النسخ التلقائي'));
  ok('التفعيل: كلمة سر قصيرة تُرفض، ثم أول نسخة مشفّرة (المحطة لا ترى الأسماء ولا البنية)، وحالة النسخ في القائمة الجانبية');
  // ---- 2) الجهاز B: جهاز جديد يسترجع
  const B = await dev('B'); await B.waitForSelector('.vthome'); await B.click('.vthome [data-a="vtOpen"]');
  await B.fill('#vt_r', RELAY); await B.fill('#vt_ri', 'clinic-hamed'); await B.fill('#vt_rp', 'wrong-password-1'); await B.click('[data-a="vtList"]'); await B.waitForSelector('main .warn:has-text("لا توجد نسخة")');
  await B.fill('#vt_rp', PW); await B.click('[data-a="vtList"]'); await B.waitForSelector('.vtv'); assert((await B.textContent('.vtv')).includes('حاسوب العيادة'));
  await B.uncheck('#vt_hx'); await B.click('.vtv [data-a="vtRestore"]'); await toastWait(B, /استُرجع/); assert.deepStrictEqual(await names(B), ['خالد', 'سارة']);
  ok('جهاز جديد: بطاقة «جهاز جديد؟» في الرئيسية، كلمة السر الخاطئة لا تجد شيئاً، والصحيحة تعرض النسخ وتسترجع العملاء');
  // ---- 3) B يفعّل النسخ بنفس المعرّف ثم تعديلات على الجهازين
  await connect(B); await enable(B, 'جوال المساء');
  await pick(B, 'سارة'); await B.fill('[data-f="name"]', 'سارة أحمد'); await B.press('[data-f="name"]', 'Tab'); await B.waitForTimeout(400); await newClient(B, 'منى'); await vault(B); await B.click('[data-a="vtNow"]'); await toastWait(B, /أُخذت نسخة/);
  await newClient(A, 'هند'); await pick(A, 'خالد'); await A.click('[data-a="del"]'); await A.waitForTimeout(300);
  await vault(A); await A.click('[data-a="vtSyncNow"]'); await toastWait(A, /مزامنة من «جوال المساء»/); assert.deepStrictEqual(await names(A), ['سارة أحمد', 'منى', 'هند']);
  const codesA = await A.evaluate(() => DPApp.S.clients.map((c) => c.code)); assert.strictEqual(new Set(codesA).size, 3, 'أكواد مكررة: ' + codesA);
  await A.click('[data-a="vtNow"]'); await toastWait(A, /أُخذت نسخة/);
  await B.click('[data-a="vtSyncNow"]'); await toastWait(B, /مزامنة من «حاسوب العيادة»/); assert.deepStrictEqual(await names(B), ['سارة أحمد', 'منى', 'هند']);
  ok('المزامنة: التعديل والعميل الجديد من B يصلان A، وحذف «خالد» على A يصل B (ولا يعود)، وتصادم الكود C0003 بين عميلين مختلفين يُحل بكود جديد');
  // ---- 4) تعارض: نفس العميل على الجهازين
  await pick(A, 'سارة أحمد'); await A.fill('[data-f="weight"]', '70'); await A.press('[data-f="weight"]', 'Tab'); await A.waitForTimeout(500);
  await pick(B, 'سارة أحمد'); await B.fill('[data-f="age"]', '41'); await B.press('[data-f="age"]', 'Tab'); await B.waitForTimeout(500); await vault(B); await B.click('[data-a="vtNow"]'); await toastWait(B, /أُخذت نسخة/);
  await vault(A); await A.click('[data-a="vtSyncNow"]'); await toastWait(A, /تعارض حُفظ كإصدار/);
  const sa = await A.evaluate(() => DPApp.S.clients.find((c) => c.name === 'سارة أحمد')); assert.strictEqual(sa.age, 41);
  await pick(A, 'سارة أحمد'); await A.click('main .tabs [data-v="ver"]'); assert((await A.textContent('main')).includes('قبل المزامنة'));
  ok('التعارض: عُدّل نفس العميل على الجهازين ← الأحدث يغلب، ونسخة الجهاز الأخرى تُحفظ «إصداراً» فلا يضيع شيء');
  // ---- 5) استقرار: لا رفع متكرر بلا تعديل
  await A.click('main .tabs [data-v="client"]'); await vault(A); await A.click('[data-a="vtNow"]'); await toastWait(A, /أُخذت نسخة/); const h1 = env.DB._raw.prepare('SELECT head FROM vaults').get().head;
  await B.click('[data-a="vtSyncNow"]'); await B.waitForTimeout(1500); await vault(B); assert(!(await B.textContent('main .ok')).includes('بانتظار الرفع'), 'B لا يجب أن يعيد الرفع بعد دمج نسخة لا جديد فيها منه');
  await A.click('[data-a="vtSyncNow"]'); await toastWait(A, /لا جديد/); assert.strictEqual(env.DB._raw.prepare('SELECT head FROM vaults').get().head, h1);
  ok('الاستقرار: الجهاز الذي دمج نسخة لا تنقصها تعديلاته لا يعيد الرفع، فلا تتبادل الأجهزة النسخ بلا نهاية');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات النسخ الاحتياطي والمزامنة'); await b.close(); srv.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
