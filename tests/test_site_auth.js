// 1.65 دخول Google + كلمة سر الحساب + التجربة المجانية 14 يوماً على خادم موقع الأخصائيين (رموز Google مُحاكاة)
const assert = require('assert'), path = require('path'), fs = require('fs'), d1 = require('./d1_shim.js'), { fileUrl, TMP } = require('./_tmp.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
const b64u = (u) => Buffer.from(u).toString('base64url');
(async () => {
  const wf = path.join(TMP, 'site_worker_auth.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/site/index.mjs'), wf); const W = await import(fileUrl(wf));
  const db = d1(); await db.prepare('CREATE TABLE specialists (email TEXT PRIMARY KEY, name TEXT, exp INTEGER, status TEXT, lic TEXT, created INTEGER, updated INTEGER, updated_by TEXT, last_seen INTEGER, note TEXT, devmax INTEGER DEFAULT 2)').run();
  await db.prepare('CREATE TABLE spdevices (email TEXT NOT NULL, dev TEXT NOT NULL, label TEXT, first INTEGER, last INTEGER, PRIMARY KEY (email, dev))').run();
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']), pub = await crypto.subtle.exportKey('jwk', kp.publicKey), priv = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const env = { ADB: db, SESSION_KEY: 'test-session-key-0123456789', TRIAL_PRIV: JSON.stringify(priv), GOOGLE_CID: 'cid.apps.googleusercontent.com', ASSETS: { fetch: async () => new Response('site') } };
  W._test.setGoogle((t) => t.startsWith('good:') ? { email: t.slice(5), name: 'د. ' + t.slice(5, 8) } : null);
  let ip = '1.1.1.1';
  const post = async (p, body, cookie, e) => { const r = await W.default.fetch(new Request('https://hessanu.example' + p, { method: 'POST', headers: Object.assign({ 'content-type': 'application/json', 'cf-connecting-ip': ip }, cookie ? { cookie } : {}), body: JSON.stringify(body || {}) }), e || env); return { s: r.status, j: await r.json(), c: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  const lic = async (cookie) => { const r = await W.default.fetch(new Request('https://hessanu.example/api/lic?d=dev-aaaaaa&l=PC', { headers: cookie ? { cookie } : {} }), env); return { s: r.status, j: await r.json() }; };
  const verify = async (tok) => { const [p, s] = tok.split('.'), k = await crypto.subtle.importKey('jwk', pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']); return (await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, Buffer.from(s, 'base64url'), new TextEncoder().encode(p))) ? JSON.parse(Buffer.from(p, 'base64url').toString()) : null; };
  W._test.setVerifier(() => null);
  // 1) أول دخول بـ Google لبريد جديد = تجربة 14 يوماً
  const g = await post('/api/auth/google', { cred: 'good:new@x.com' }); assert.strictEqual(g.s, 200); assert.strictEqual(g.j.trial, 1); assert.strictEqual(g.j.hasPw, false); assert(/^zs=[\w-]+\.[\w-]+$/.test(g.c), g.c);
  const row = await db.prepare("SELECT * FROM specialists WHERE email = 'new@x.com'").first(); assert.strictEqual(row.status, 'trial'); const days = (row.exp - Math.floor(Date.now() / 1000)) / 86400; assert(days > 13.9 && days <= 14, days);
  const l1 = await lic(g.c); assert.strictEqual(l1.s, 200); assert.strictEqual(l1.j.trial, 1); const pl = await verify(l1.j.lic); assert(pl && pl.trial === 1 && pl.em === 'new@x.com' && pl.t === 'em' && pl.exp - pl.iat === 14 * 86400, JSON.stringify(pl));
  ok('أول دخول بـ Google لبريد جديد: جلسة آمنة (ملف ارتباط موقّع) وتجربة 14 يوماً برخصة موقّعة بمفتاح التجارب (trial:1، em، مدتها 14 يوماً)');
  const g2 = await post('/api/auth/google', { cred: 'good:new@x.com' }); assert.strictEqual(g2.j.trial, 0); assert.strictEqual((await db.prepare("SELECT COUNT(*) AS n FROM specialists WHERE email = 'new@x.com'").first()).n, 1); ok('تجربة واحدة لكل بريد: الدخول الثاني لا يجدّدها');
  assert.strictEqual((await post('/api/auth/google', { cred: 'bad' })).s, 401); assert.strictEqual((await lic()).s, 401); assert.strictEqual((await lic('zs=abc.def')).s, 401); assert.strictEqual((await lic(g.c.replace(/.$/, (x) => x === 'A' ? 'B' : 'A'))).s, 401); ok('رمز Google غير صالح يُرفض، وبلا جلسة أو بجلسة مزوّرة: 401');
  // 2) كلمة سر الحساب
  const H = b64u(Buffer.alloc(32, 7)), Hw = b64u(Buffer.alloc(32, 9));
  assert.strictEqual((await post('/api/auth/setpw', { h: H })).s, 401); assert.strictEqual((await post('/api/auth/setpw', { h: H }, g.c)).s, 200);
  const st = await db.prepare("SELECT h, salt FROM spauth WHERE email = 'new@x.com'").first(); assert(st.h !== H && st.salt.length > 10); ok('«أكمل حسابك»: كلمة السر تُحفظ بصمةً مملّحة (لا تصل كلمة السر نفسها ولا تُحفظ مشتقتها كما هي)');
  const p1 = await post('/api/auth/password', { email: 'NEW@x.com ', h: H }); assert.strictEqual(p1.s, 200); assert(p1.c.startsWith('zs=')); assert.strictEqual((await lic(p1.c)).s, 200);
  assert.strictEqual((await post('/api/auth/password', { email: 'new@x.com', h: Hw })).s, 401); assert.strictEqual((await post('/api/auth/password', { email: 'who@x.com', h: H })).s, 401);
  for (let i = 0; i < 4; i++) await post('/api/auth/password', { email: 'new@x.com', h: Hw }); assert.strictEqual((await post('/api/auth/password', { email: 'new@x.com', h: H })).s, 429);
  ok('الدخول بالبريد وكلمة السر يعمل، والخاطئة وغير الموجود 401 بنفس الرسالة، و5 محاولات خاطئة توقف البريد ربع ساعة');
  assert.strictEqual((await post('/api/auth/setpw', { h: Hw }, p1.c)).s, 403); assert.strictEqual((await post('/api/auth/setpw', { h: Hw, old: Hw }, p1.c)).s, 403); assert.strictEqual((await post('/api/auth/setpw', { h: Hw, old: H }, p1.c)).s, 200);
  assert.strictEqual((await post('/api/auth/setpw', { h: H }, g.c)).s, 200); ok('تغيير كلمة السر: بجلسة كلمة السر يلزم إثبات الحالية (الخاطئة 403)، وبجلسة Google يكفي الدخول («نسيت كلمة السر»)');
  // 3) انتهاء التجربة والتمديد
  await db.prepare("UPDATE specialists SET exp = ? WHERE email = 'new@x.com'").bind(Math.floor(Date.now() / 1000) - 10).run(); const e1 = await lic(g.c); assert.strictEqual(e1.s, 403); assert.strictEqual(e1.j.code, 'expired'); assert.strictEqual(e1.j.trial, 1); assert(/انتهت تجربتك المجانية/.test(e1.j.error));
  await db.prepare("UPDATE specialists SET exp = ?, status = 'active', lic = 'admin.sig' WHERE email = 'new@x.com'").bind(Math.floor(Date.now() / 1000) + 86400 * 30).run(); const e2 = await lic(g.c); assert.strictEqual(e2.s, 200); assert.strictEqual(e2.j.lic, 'admin.sig'); assert.strictEqual(e2.j.trial, 0);
  ok('بعد 14 يوماً تتوقف النسخة برسالة «انتهت تجربتك المجانية» (البيانات محفوظة)، وإذا مدّدت الإدارة (رخصة عادية) يعود الدخول');
  // 4) حدود إساءة الاستخدام
  ip = '9.9.9.9'; for (const e of ['a1@x.com', 'a2@x.com', 'a3@x.com']) assert.strictEqual((await post('/api/auth/google', { cred: 'good:' + e })).j.trial, 1); const g4 = await post('/api/auth/google', { cred: 'good:a4@x.com' }); assert.strictEqual(g4.s, 429);
  ok('3 تجارب جديدة كحد أقصى لكل عنوان يومياً (والعنوان يُحفظ بصمة لا نصاً)');
  const off = await post('/api/auth/google', { cred: 'good:z@x.com' }, null, Object.assign({}, env, { TRIAL_PRIV: undefined })); assert.strictEqual(off.s, 403); assert.strictEqual(off.j.code, 'none');
  assert.strictEqual((await post('/api/auth/google', { cred: 'good:z@x.com' }, null, Object.assign({}, env, { SESSION_KEY: undefined }))).s, 503); ok('بلا مفتاح التجارب لا تجربة (رسالة «اطلب الإضافة»)، وبلا مفتاح الجلسة الميزة كلها مطفأة');
  const lo = await post('/api/auth/logout', {}, g.c); assert(/Max-Age=0/.test((await W.default.fetch(new Request('https://hessanu.example/api/auth/logout', { method: 'POST', headers: { cookie: g.c } }), env)).headers.get('set-cookie'))); ok('تسجيل الخروج يمسح الجلسة');
  console.log('\nنجح ' + n + ' اختبارات دخول Google والتجربة');
})().catch((e) => { console.error('✘', e); process.exit(1); });
