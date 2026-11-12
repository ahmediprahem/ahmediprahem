// الإدارة على الإنترنت (0.95): نسخة الإدارة تُقدَّم من خادم zenha-admin؛ الإعداد على جهاز، والاسترجاع التلقائي على جهاز آخر،
// والخادم لا يرى إلا بيانات مشفّرة، وصفحة الأعضاء للمالك، ودمج تعديلات جهازين معاً دون ضياع
const assert = require('assert'), path = require('path'), fs = require('fs'), http = require('http'), { chromium } = require('playwright'), login = require('./auth_helper'), d1 = require('./d1_shim.js'), { fileUrl, TMP } = require('./_tmp.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const wf = path.join(TMP, 'admin_worker_e2e.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/admin/index.mjs'), wf);
  const W = await import(fileUrl(wf)), env = { DB: d1(), OWNER_EMAIL: 'ah6171317@gmail.com' };
  W._test.setVerifier((req) => { const m = /(?:^|;\s*)testemail=([^;]+)/.exec(req.headers.get('cookie') || ''); return m ? { email: decodeURIComponent(m[1]) } : null; });   // بديل Access في الاختبار: البريد من كوكي
  const html = fs.readFileSync(path.resolve(__dirname, '../admin.html'));
  const srv = http.createServer(async (req, res) => {
    if (!req.url.startsWith('/api/')) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(html); }
    const ch = []; for await (const c of req) ch.push(c); const body = Buffer.concat(ch);
    const r = await W.default.fetch(new Request('http://127.0.0.1' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'DELETE'].includes(req.method) ? undefined : body }), env);
    res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(Buffer.from(await r.arrayBuffer()));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch();
  const device = async (email) => { const ctx = await b.newContext({ viewport: { width: 1400, height: 950 } }); await ctx.addCookies([{ name: 'testemail', value: encodeURIComponent(email), url: URL0 }]); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept()); await p.goto(URL0); return p; };
  const store = () => env.DB.prepare('SELECT k, v, ver FROM store ORDER BY k').all().then((r) => r.results);
  const users = (p) => p.evaluate(() => DPApp.A.setTools()).then(() => p.click('.tools [data-a="users"]')).then(() => p.waitForSelector('#ua_user'));
  const addUser = async (p, u) => { await p.fill('#ua_user', u); await p.fill('#ua_name', u); await p.fill('#ua_pw', 'Pass#' + u + '2026'); await p.click('[data-ha="uadd"]'); await p.waitForFunction((x) => window.HAD && HAD.users.some((y) => y.username === x), u); };
  const synced = (p) => p.waitForFunction(() => { const e = document.getElementById('cloudSt'); return e && /محفوظة في النظام/.test(e.textContent); }, null, { timeout: 15000 }).catch(() => { });
  // 1) الجهاز الأول: إعداد المدير ثم إضافة أخصائية
  const A = await device('ah6171317@gmail.com'); await login(A); await users(A); await addUser(A, 'sara'); await A.waitForTimeout(2500); await users(A); await synced(A);
  let st = await store(); assert.deepStrictEqual(st.map((x) => x.k), ['keys:auth', 'users:admin'], JSON.stringify(st.map((x) => x.k)));
  const rawAll = JSON.stringify(st); assert(!rawAll.includes('sara') && !rawAll.includes('Pass#'), 'الخادم يرى بيانات مقروءة!'); assert(/محفوظة في النظام/.test(await A.textContent('#cloudSt')));
  ok('الجهاز الأول: إعداد المدير وإضافة أخصائية يُرفعان تلقائياً، والخادم لا يرى اسم الأخصائية ولا كلمة سرها');
  // 2) جهاز جديد: يُسترجع حساب المدير تلقائياً، وبعد كلمة السر تظهر الأخصائية
  const B = await device('ah6171317@gmail.com'); await B.waitForSelector('#aBtn'); assert.strictEqual(await B.locator('#sBtn').count(), 0, 'طلب إعداداً جديداً بدل الاسترجاع'); assert(/استُرجع حساب المدير/.test(await B.textContent('body')));
  await login(B); await B.waitForFunction(() => window.HAD && HAD.users.some((y) => y.username === 'sara'), null, { timeout: 15000 });
  assert.deepStrictEqual(await B.evaluate(() => HAD_PUB), await A.evaluate(() => HAD_PUB), 'نفس مفتاح المدير'); ok('جهاز جديد: يُسترجع حساب المدير تلقائياً (لا إعداد جديد)، وبنفس المفتاح وكلمة السر تظهر الأخصائية');
  // 3) جهازان يعدّلان معاً: لا يضيع تعديل أحدهما
  await users(B); await addUser(B, 'nour'); await B.waitForTimeout(2500); await synced(B);
  await addUser(A, 'lina'); await A.waitForTimeout(3500); await users(A); await synced(A);
  await A.waitForFunction(() => ['sara', 'nour', 'lina'].every((u) => HAD.users.some((y) => y.username === u)), null, { timeout: 15000 });
  await B.reload(); await login(B); await B.waitForFunction(() => window.HAD && ['sara', 'nour', 'lina'].every((u) => HAD.users.some((y) => y.username === u)), null, { timeout: 15000 });
  ok('جهازان يضيفان أخصائيين في الوقت نفسه: يُدمجان (سارة ونور ولينا) ولا يضيع شيء');
  // 4) صفحة الأعضاء للمالك
  await users(A); await A.waitForSelector('.cmt'); assert(/ah6171317@gmail.com/.test(await A.textContent('.cmt')));
  await A.fill('#cm_email', 'boss@gmail.com'); await A.selectOption('#cm_role', 'admin'); await A.click('[data-ha="cmAdd"]'); await A.waitForFunction(() => /boss@gmail.com/.test((document.querySelector('.cmt') || {}).textContent || ''), null, { timeout: 10000 });
  const mem = (await env.DB.prepare('SELECT email, role FROM members ORDER BY created').all()).results; assert.deepStrictEqual(mem.map((m) => m.email + ':' + m.role), ['ah6171317@gmail.com:owner', 'boss@gmail.com:admin']);
  const C = await device('stranger@gmail.com'); await C.waitForTimeout(1500); assert.strictEqual(await C.evaluate(() => (window.HAD ? 1 : 0)), 0); assert.strictEqual((await store()).length, 2);
  ok('المالك يرى أعضاء النظام ويضيف «مديراً كاملاً» ببريده؛ وبريد غريب لا يصل لبيانات النظام');
  // 5) الأخصائيون بالبريد: إضافة برخصة موقّعة في المتصفح، تمديد، إيقاف، حذف
  await users(A); await A.waitForSelector('#spBox'); await A.fill('#sp_email', 'Dr.Mona@Gmail.com'); await A.fill('#sp_name', 'د. منى'); await A.selectOption('#sp_days', '30'); await A.click('[data-ha="spAdd"]');
  await A.waitForFunction(() => /dr.mona@gmail.com/.test((document.querySelector('.spt') || {}).textContent || ''), null, { timeout: 10000 });
  let sp = await env.DB.prepare('SELECT * FROM specialists').first(); assert.strictEqual(sp.email, 'dr.mona@gmail.com'); assert.strictEqual(sp.status, 'active'); assert(Math.abs(sp.exp - (Date.now() / 1000 + 30 * 86400)) < 120);
  const lic = await A.evaluate((t) => HSec.verify(HAD_PUB, t), sp.lic); assert.strictEqual(lic.u, 'em:dr.mona@gmail.com'); assert.strictEqual(lic.v, 1); assert.strictEqual(lic.exp, sp.exp);
  ok('إضافة أخصائي بالبريد والاسم والمدة فقط: رخصة موقّعة بمفتاح المدير لهذا البريد (يتحقق منها المفتاح العام)، والبريد بلا حساسية للأحرف');
  const exp0 = sp.exp; await A.click('.spt [data-ha="spExt"]'); await A.waitForFunction(async (e0) => true, exp0); await A.waitForTimeout(1500);
  sp = await env.DB.prepare('SELECT * FROM specialists').first(); assert(sp.exp >= exp0 + 30 * 86400 - 5, 'التمديد'); assert.strictEqual((await A.evaluate((t) => HSec.verify(HAD_PUB, t), sp.lic)).exp, sp.exp, 'الرخصة أُعيد توقيعها بالمدة الجديدة');
  await A.click('.spt [data-ha="spToggle"]'); await A.waitForTimeout(1200); assert.strictEqual((await env.DB.prepare('SELECT status FROM specialists').first()).status, 'off'); await A.waitForFunction(() => /موقوف/.test(document.querySelector('.spt').textContent));
  await A.click('.spt [data-ha="spDel"]'); await A.waitForTimeout(1200); assert.strictEqual((await env.DB.prepare('SELECT COUNT(*) AS n FROM specialists').first()).n, 0);
  const au = (await env.DB.prepare("SELECT action FROM audit WHERE action LIKE 'spec.%'").all()).results.map((r) => r.action); assert.deepStrictEqual(au, ['spec.add', 'spec.update', 'spec.update', 'spec.del']);
  ok('تمديد شهر يعيد توقيع الرخصة بالمدة الجديدة، والإيقاف والحذف فوريان، وكل ذلك في سجل التدقيق');
  assert.deepStrictEqual(errs, []); await b.close(); srv.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1200)); console.error(errs.join('\n')); process.exit(1); });
