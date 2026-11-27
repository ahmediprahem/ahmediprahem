// 1.65 شاشة الدخول الجديدة من البداية للنهاية: خادم الموقع الحقيقي (index.mjs) + المتصفح. Google مُحاكى (رمز الهوية فقط).
// أول دخول بـ Google ← تجربة 14 يوماً ← «أكمل حسابك» بكلمة سر ← التطبيق؛ ثم جهاز جديد بالبريد وكلمة السر مباشرة؛ ثم انتهاء التجربة.
const assert = require('assert'), path = require('path'), fs = require('fs'), http = require('http'), d1 = require('./d1_shim.js'), { fileUrl, TMP } = require('./_tmp.js'), { chromium } = require('playwright');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const wf = path.join(TMP, 'site_worker_e2e165.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/site/index.mjs'), wf); const W = await import(fileUrl(wf));
  const db = d1(); await db.prepare('CREATE TABLE specialists (email TEXT PRIMARY KEY, name TEXT, exp INTEGER, status TEXT, lic TEXT, created INTEGER, updated INTEGER, updated_by TEXT, last_seen INTEGER, note TEXT, devmax INTEGER DEFAULT 2)').run();
  await db.prepare('CREATE TABLE spdevices (email TEXT NOT NULL, dev TEXT NOT NULL, label TEXT, first INTEGER, last INTEGER, PRIMARY KEY (email, dev))').run();
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']), pub = await crypto.subtle.exportKey('jwk', kp.publicKey), priv = await crypto.subtle.exportKey('jwk', kp.privateKey);
  let html = fs.readFileSync(path.resolve(__dirname, '../worker/site/public/index.html'), 'utf8'); html = html.replace(/window\.TRIAL_PUB=\{[^;]*\};/, 'window.TRIAL_PUB=' + JSON.stringify(pub) + ';'); assert(/window\.GOOGLE_CID="/.test(html));
  const env = { ADB: db, SESSION_KEY: 'e2e-session-key-abcdefghijklmnop', TRIAL_PRIV: JSON.stringify(priv), GOOGLE_CID: 'x', ASSETS: { fetch: async () => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }) } };
  W._test.setVerifier(() => null); W._test.setGoogle((t) => t === 'tok-mona' ? { email: 'mona@x.com', name: 'د. منى' } : null);
  const srv = http.createServer(async (q, r) => { const ch = []; for await (const c of q) ch.push(c); const res = await W.default.fetch(new Request('https://127.0.0.1' + q.url, { method: q.method, headers: q.headers, body: ['GET', 'HEAD'].includes(q.method) ? undefined : Buffer.concat(ch) }), env); const h = {}; res.headers.forEach((v, k) => { h[k] = k === 'set-cookie' ? v.replace('; Secure', '') : v; }); r.writeHead(res.status, h); r.end(Buffer.from(await res.arrayBuffer())); });
  await new Promise((x) => srv.listen(0, '127.0.0.1', x)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch(), mk = async () => { const p = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept()); await p.route('https://accounts.google.com/**', (rt) => rt.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.google={accounts:{id:{initialize:function(o){window.__gopt=o},renderButton:function(el){el.innerHTML="<button id=\\"gfake\\">المتابعة باستخدام Google</button>"}}}}' })); return p; };
  // 1) بلا جلسة: شاشة الدخول الجديدة
  const A = await mk(); await A.goto(URL0); await A.waitForSelector('#gbtn #gfake'); assert(await A.isVisible('#sem') && await A.isVisible('#spw') && await A.isVisible('#sold')); assert(/14 يوماً/.test(await A.textContent('#gcard')));
  assert.strictEqual(await A.evaluate(() => window.__gopt.client_id), await A.evaluate(() => window.GOOGLE_CID)); ok('بلا جلسة: شاشة الدخول الجديدة بزر Google والبريد وكلمة السر و«الدخول القديم»، وذكر التجربة المجانية 14 يوماً');
  // 2) أول دخول بـ Google ← تجربة ← «أكمل حسابك»
  await A.evaluate(() => window.__zgCred({ credential: 'tok-mona' })); await A.waitForSelector('#ep2'); const body = await A.textContent('#gcard');
  assert(/أكمل حسابك يا د. منى/.test(body) && /تجربتك المجانية: باقٍ 14 يوماً/.test(body), body); assert.strictEqual((await db.prepare("SELECT status FROM specialists WHERE email = 'mona@x.com'").first()).status, 'trial');
  await A.fill('#ep', 'Mona#Pass2026'); await A.fill('#ep2', 'Mona#Pass2026'); await A.click('#ebtn'); await A.waitForSelector('aside .sidebtn', { state: 'attached' });
  assert(await db.prepare("SELECT h FROM spauth WHERE email = 'mona@x.com'").first()); ok('أول دخول بـ Google: تجربة 14 يوماً تلقائياً، «أكمل حسابك» بكلمة سر واحدة تُحفظ للحساب (بصمة على الخادم) وتفتح الجهاز، ثم البرنامج');
  await A.evaluate(() => DPApp.A.new('ex')); await A.fill('[data-f="name"]', 'عميلة منى'); await A.press('[data-f="name"]', 'Tab'); await A.waitForTimeout(500);
  // 3) جهاز جديد: البريد وكلمة السر مباشرة (بلا سؤال ثانٍ)
  const B = await mk(); await B.goto(URL0); await B.waitForSelector('#sem'); await B.fill('#sem', 'mona@x.com'); await B.fill('#spw', 'wrong-pass-1'); await B.click('#sgo'); await B.waitForSelector('#serr .gerr'); assert(/غير صحيحة/.test(await B.textContent('#serr')));
  await B.fill('#spw', 'Mona#Pass2026'); await B.click('#sgo'); await B.waitForSelector('aside .sidebtn', { state: 'attached', timeout: 30000 }); ok('جهاز جديد: البريد وكلمة السر الخاطئة تُرفض برسالة، والصحيحة تفتح البرنامج مباشرة (كلمة سر واحدة للحساب والجهاز)');
  // 4) إعادة التحميل على الجهاز الأول: الجلسة باقية، تُطلب كلمة سر الجهاز فقط
  await A.reload(); await A.waitForSelector('#ep'); assert.strictEqual(await A.locator('#ep2').count(), 0); await A.fill('#ep', 'Mona#Pass2026'); await A.click('#ebtn'); await A.waitForSelector('aside .sidebtn', { state: 'attached' }); assert(await A.evaluate(() => DPApp.S.clients.some((c) => c.name === 'عميلة منى')));
  ok('الجلسة تبقى بعد إعادة التحميل (30 يوماً)، وكلمة السر تفتح بيانات الجهاز وعملاؤه موجودون');
  // 5) انتهاء التجربة: تتوقف النسخة برسالة واضحة، والخروج متاح
  await db.prepare("UPDATE specialists SET exp = ? WHERE email = 'mona@x.com'").bind(Math.floor(Date.now() / 1000) - 5).run(); await A.reload(); await A.waitForSelector('#emOut'); assert(/انتهت تجربتك المجانية/.test(await A.textContent('#gcard')));
  await A.click('#emOut'); await A.waitForSelector('#gbtn'); ok('بعد 14 يوماً: «انتهت تجربتك المجانية… بياناتك محفوظة» ولا دخول، و«تسجيل الخروج» يعيد شاشة الدخول');
  // 6) الإدارة تمدّد: رخصة عادية موقّعة من المدير ← يعود الدخول (هنا نمدّد مدة التجربة نفسها للتجربة الآلية)
  await db.prepare("UPDATE specialists SET exp = ? WHERE email = 'mona@x.com'").bind(Math.floor(Date.now() / 1000) + 86400).run(); await A.evaluate(() => window.__zgCred({ credential: 'tok-mona' })); await A.waitForSelector('#ep'); ok('بعد تمديد الإدارة يعود الدخول');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات الدخول الجديد 1.65'); await b.close(); srv.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); process.exit(1); });
