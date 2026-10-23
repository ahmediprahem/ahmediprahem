/* محطة «حصة ↔ حصتي» على Cloudflare Workers + قاعدة D1 (تعمل على الخطة المجانية).
   - صندوق بريد مشفّر: تنقل رسائل مقفلة بين «حصة» (الأخصائي) و«حصتي» (العميل) ولا تستطيع قراءة محتواها؛ التشفير من طرف إلى طرف (src/hx_crypto.js).
   - كل طلب موقَّع بمفتاح صاحبه (ECDSA P-256)؛ المحطة تتحقق من التوقيع ومن العلاقة (العميل يراسل أخصائيه فقط، والأخصائي عملاءه فقط).
   - تقدّم تطبيق «حصتي» نفسه على الصفحة الرئيسية (/)، فرابط الدعوة = عنوان هذه المحطة.
   - الجداول تُنشأ تلقائياً أول مرة؛ يكفي ربط قاعدة D1 باسم DB. متغير اختياري REG_KEY: مفتاح تسجيل الأخصائيين (بدونه يقبل أي «حصة»).
   - لا تسجّل أي محتوى (لا console.log). يُبنى منه worker/relay/dist/worker.js بـ py build_web.py (يُضمَّن تطبيق «حصتي» وأيقونته). */
const VER = '1.5';
const APP_HTML = /*HISSATI_HTML*/'<!doctype html><meta charset="utf-8"><title>حصتي</title><p>ابنِ الملف بـ py build_web.py</p>'/*END*/;
const ICON_B64 = /*HISSATI_ICON*/''/*END*/;
const SW_JS = /*HISSATI_SW*/''/*END*/;
const ICONS = /*HISSATI_ICONS*/{}/*END*/;                          // أيقونات التثبيت من المتصفح: icon-192 / icon-512 / maskable-512 / apple-180
const LIM = { remind: 24, chunk: 900000, chunks: 40, keep: 7, xfer: 1500000, xferTtl: 900, body: 1600000, box: 450000, cat: 300000, label: 80, invitesActive: 300, perHour: 400, inbox: 100, skew: 300 };
const enc = new TextEncoder();
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type', 'access-control-max-age': '86400' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS } });
const err = (status, code, msg) => json({ ok: false, code, error: msg }, status);

// ---------- التحقق من التوقيع (مطابق لـ HXC.signReq)
const b64u = (buf) => { const b = new Uint8Array(buf); let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const sha256 = (s) => crypto.subtle.digest('SHA-256', typeof s === 'string' ? enc.encode(s) : s);
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
const pubOnly = (j) => ({ kty: 'EC', crv: 'P-256', x: String(j && j.x || ''), y: String(j && j.y || '') });
export const idOf = async (j) => b64u(await sha256('P-256.' + pubOnly(j).x + '.' + pubOnly(j).y)).slice(0, 22);
export const tokenHash = async (t) => b64u(await sha256('inv.' + t)).slice(0, 32);
export function parseAuth(h) { const m = /^Hissa id=([A-Za-z0-9_-]{22}),ts=(\d{9,11}),sig=([A-Za-z0-9_-]{40,120})$/.exec(String(h || '').trim()); return m ? { id: m[1], ts: +m[2], sig: m[3] } : null; }
export async function verify(pub, a, method, path, body) {
  try {
    const key = await crypto.subtle.importKey('jwk', pubOnly(pub), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64u(a.sig), enc.encode(method + '\n' + path + '\n' + a.ts + '\n' + hex(await sha256(body || ''))));
  } catch { return false; }
}
const validJwk = (j) => j && typeof j === 'object' && /^[A-Za-z0-9_-]{40,50}$/.test(j.x || '') && /^[A-Za-z0-9_-]{40,50}$/.test(j.y || '');

// ---------- التخزين (D1)
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS dietitians (id TEXT PRIMARY KEY, sig TEXT NOT NULL, enc TEXT NOT NULL, name TEXT, created INTEGER)',
  'CREATE TABLE IF NOT EXISTS invites (h TEXT PRIMARY KEY, did TEXT NOT NULL, label TEXT, exp INTEGER, used INTEGER DEFAULT 0, cat TEXT, created INTEGER)',
  'CREATE INDEX IF NOT EXISTS invites_did ON invites (did)',
  'CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, did TEXT NOT NULL, sig TEXT NOT NULL, enc TEXT NOT NULL, label TEXT, created INTEGER)',
  'CREATE INDEX IF NOT EXISTS clients_did ON clients (did)',
  'CREATE TABLE IF NOT EXISTS msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, rcpt TEXT NOT NULL, sender TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL, ts INTEGER)',
  'CREATE INDEX IF NOT EXISTS msgs_rcpt ON msgs (rcpt, id)',
  'CREATE INDEX IF NOT EXISTS msgs_sender ON msgs (sender, ts)',
  'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)',
  'CREATE TABLE IF NOT EXISTS push_subs (ep TEXT PRIMARY KEY, id TEXT NOT NULL, created INTEGER, last INTEGER DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS push_id ON push_subs (id)',
  'CREATE TABLE IF NOT EXISTS xfer (id TEXT PRIMARY KEY, cid TEXT NOT NULL, blob TEXT NOT NULL, exp INTEGER, claimed INTEGER DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS vaults (vid TEXT PRIMARY KEY, ah TEXT NOT NULL, head INTEGER DEFAULT 0, owner TEXT, created INTEGER)',
  'CREATE TABLE IF NOT EXISTS vault_vers (vid TEXT NOT NULL, ver INTEGER NOT NULL, up TEXT NOT NULL, n INTEGER, size INTEGER, dev TEXT, at INTEGER, PRIMARY KEY (vid, ver))',
  'CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, did TEXT NOT NULL, scope TEXT NOT NULL, status TEXT NOT NULL, kind TEXT, title TEXT, body TEXT, media TEXT, link TEXT, note TEXT, likes INTEGER DEFAULT 0, comments INTEGER DEFAULT 0, created INTEGER)',
  'CREATE INDEX IF NOT EXISTS posts_feed ON posts (status, scope, id)',
  'CREATE INDEX IF NOT EXISTS posts_did ON posts (did, id)',
  'CREATE TABLE IF NOT EXISTS post_likes (pid INTEGER NOT NULL, uid TEXT NOT NULL, PRIMARY KEY (pid, uid))',
  'CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, pid INTEGER NOT NULL, uid TEXT NOT NULL, name TEXT, dr INTEGER DEFAULT 0, body TEXT, created INTEGER)',
  'CREATE INDEX IF NOT EXISTS comments_pid ON comments (pid, id)',
  'CREATE TABLE IF NOT EXISTS media (key TEXT PRIMARY KEY, did TEXT NOT NULL, type TEXT, size INTEGER, store TEXT, data TEXT, created INTEGER)',
  'CREATE TABLE IF NOT EXISTS remind (id TEXT PRIMARY KEY, mins TEXT NOT NULL, upd INTEGER)',
  'CREATE TABLE IF NOT EXISTS vault_chunks (vid TEXT NOT NULL, up TEXT NOT NULL, idx INTEGER NOT NULL, data TEXT NOT NULL, ts INTEGER, PRIMARY KEY (vid, up, idx))'
];
let ready = null;
const MIGRATE = ['ALTER TABLE push_subs ADD COLUMN kind TEXT'];          // جداول قديمة: أعمدة جديدة (يُتجاهل الخطأ إن وُجد العمود)
const init = (db) => ready || (ready = (async () => { for (const q of SCHEMA) await db.prepare(q).run(); for (const q of MIGRATE) { try { await db.prepare(q).run(); } catch { } } })().catch((e) => { ready = null; throw e; }));
const one = (db, q, ...a) => db.prepare(q).bind(...a).first();
const all = async (db, q, ...a) => (await db.prepare(q).bind(...a).all()).results || [];
const run = (db, q, ...a) => db.prepare(q).bind(...a).run();
const now = () => Math.floor(Date.now() / 1000);
async function whoIs(db, id) {
  const d = await one(db, 'SELECT id, sig, enc, name FROM dietitians WHERE id = ?', id); if (d) return { role: 'd', id, sig: JSON.parse(d.sig), enc: JSON.parse(d.enc), name: d.name };
  const c = await one(db, 'SELECT id, did, sig, enc FROM clients WHERE id = ?', id); if (c) return { role: 'c', id, did: c.did, sig: JSON.parse(c.sig), enc: JSON.parse(c.enc) };
  return null;
}
async function authed(req, db, path, body, selfPub) {   // selfPub: للتسجيل والانضمام (المفتاح في الجسم نفسه)
  const a = parseAuth(req.headers.get('authorization')); if (!a) return { e: err(401, 'auth', 'توقيع مفقود') };
  if (Math.abs(now() - a.ts) > LIM.skew) return { e: err(401, 'clock', 'وقت الجهاز غير مضبوط') };
  let who = null, pub = selfPub;
  if (selfPub) { if (a.id !== await idOf(selfPub)) return { e: err(401, 'auth', 'المعرّف لا يطابق المفتاح') }; }
  else { who = await whoIs(db, a.id); if (!who) return { e: err(401, 'unknown', 'غير مسجّل') }; pub = who.sig; }
  if (!await verify(pub, a, req.method, path, body)) return { e: err(401, 'auth', 'توقيع غير صالح') };
  return { id: a.id, who };
}

// ---------- الإشعارات (Web Push بلا محتوى): المحطة لا ترسل أي بيانات عبر خدمات Google/Apple — فقط «لديك جديد»، والتطبيق يجلب الرسالة المشفّرة بنفسه.
// مفاتيح VAPID تُولَّد تلقائياً أول مرة وتُحفظ في D1 (لا إعداد مطلوب). الاشتراكات من خدمات الدفع المعروفة فقط، وإشعار واحد كل 30 ثانية لكل جهاز.
const PUSH_HOSTS = /^https:\/\/(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)\/[^\s]{8,900}$/;
const PUSH = { gap: 30, perId: 5 }; let vapidC = null; const jwtC = new Map();
async function vapid(db) {
  if (vapidC) return vapidC;
  let r = await one(db, "SELECT v FROM kv WHERE k = 'vapid'");
  if (!r) {
    const k = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const v = JSON.stringify({ pub: b64u(await crypto.subtle.exportKey('raw', k.publicKey)), priv: await crypto.subtle.exportKey('jwk', k.privateKey) });
    await run(db, "INSERT OR IGNORE INTO kv (k, v) VALUES ('vapid', ?)", v); r = await one(db, "SELECT v FROM kv WHERE k = 'vapid'");
  }
  const v = JSON.parse(r.v); v.key = await crypto.subtle.importKey('jwk', v.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']); return (vapidC = v);
}
async function vapidAuth(db, aud, sub) {
  const c = jwtC.get(aud); if (c && c.exp - now() > 600) return c.h;
  const v = await vapid(db), exp = now() + 12 * 3600, part = (o) => b64u(enc.encode(JSON.stringify(o)));
  const unsigned = part({ typ: 'JWT', alg: 'ES256' }) + '.' + part({ aud, exp, sub });
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.key, enc.encode(unsigned));
  const h = 'vapid t=' + unsigned + '.' + b64u(sig) + ', k=' + v.pub; jwtC.set(aud, { h, exp }); return h;
}
async function pushTo(db, id, origin, kind) {
  const rows = await all(db, 'SELECT ep, last FROM push_subs WHERE id = ?', id), t = now();
  await Promise.all(rows.filter((r) => t - (r.last || 0) >= PUSH.gap).map(async (r) => {
    try {
      const res = await fetch(r.ep, { method: 'POST', headers: { TTL: '86400', Urgency: 'high', 'Content-Length': '0', Authorization: await vapidAuth(db, new URL(r.ep).origin, origin) } });
      if (res.status === 404 || res.status === 410) await run(db, 'DELETE FROM push_subs WHERE ep = ?', r.ep); else await run(db, 'UPDATE push_subs SET last = ?, kind = ? WHERE ep = ?', t, kind || 'msg', r.ep);
    } catch { /* خدمة الإشعارات غير متاحة: تُعاد المحاولة مع الرسالة التالية */ }
  }));
}

// ---------- المسارات
async function api(req, env, url, ctx) {
  const bg = (pr) => { pr = pr.catch(() => { }); if (ctx && ctx.waitUntil) ctx.waitUntil(pr); return pr; }, origin = 'https://' + url.host;
  const db = env.DB; if (!db) return err(500, 'nodb', 'لم تُربط قاعدة D1 باسم DB'); await init(db);
  const p = url.pathname, path = p + url.search, method = req.method;
  if (p === '/v1/media' && method === 'POST') return mediaUp(req, env, db, path);
  const body = method === 'POST' ? await req.text() : ''; if (body.length > LIM.body) return err(413, 'big', 'الطلب أكبر من المسموح');
  let J = {}; if (body) { try { J = JSON.parse(body); } catch { return err(400, 'json', 'صيغة غير صالحة'); } }
  if (p === '/v1/health') return json({ ok: true, ver: VER, reg: !!env.REG_KEY });
  if (p === '/v1/register' && method === 'POST') {
    if (!validJwk(J.sigPub) || !validJwk(J.encPub)) return err(400, 'keys', 'مفاتيح غير صالحة');
    if (env.REG_KEY && J.regKey !== env.REG_KEY) return err(403, 'regkey', 'مفتاح التسجيل غير صحيح');
    const a = await authed(req, db, path, body, J.sigPub); if (a.e) return a.e;
    const c = await one(db, 'SELECT id FROM clients WHERE id = ?', a.id); if (c) return err(409, 'role', 'هذا المفتاح لعميل');
    await run(db, 'INSERT INTO dietitians (id, sig, enc, name, created) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name', a.id, JSON.stringify(pubOnly(J.sigPub)), JSON.stringify(pubOnly(J.encPub)), String(J.name || '').slice(0, LIM.label), now());
    return json({ ok: true, id: a.id });
  }
  const mInv = /^\/v1\/invites\/([A-Za-z0-9_-]{32})$/.exec(p);
  if (mInv && method === 'GET') {                                     // معلومات الدعوة للعميل (بلا توقيع: يعرف الرمز فقط)
    const iv = await one(db, 'SELECT i.did, i.label, i.exp, i.used, i.cat, d.enc, d.name FROM invites i JOIN dietitians d ON d.id = i.did WHERE i.h = ?', mInv[1]);
    if (!iv) return err(404, 'invite', 'الدعوة غير موجودة');
    if (iv.used) return err(410, 'used', 'استُعملت هذه الدعوة من قبل'); if (iv.exp && iv.exp < now()) return err(410, 'expired', 'انتهت صلاحية الدعوة');
    return json({ ok: true, did: iv.did, dname: iv.name, label: iv.label, exp: iv.exp, encPub: JSON.parse(iv.enc), cat: iv.cat ? JSON.parse(iv.cat) : null });
  }
  if (p === '/v1/join' && method === 'POST') {
    if (!validJwk(J.sigPub) || !validJwk(J.encPub) || typeof J.token !== 'string') return err(400, 'keys', 'بيانات ناقصة');
    const a = await authed(req, db, path, body, J.sigPub); if (a.e) return a.e;
    const h = await tokenHash(J.token), iv = await one(db, 'SELECT did, label, exp, used FROM invites WHERE h = ?', h);
    if (!iv) return err(404, 'invite', 'الدعوة غير موجودة'); if (iv.used) return err(410, 'used', 'استُعملت هذه الدعوة من قبل'); if (iv.exp && iv.exp < now()) return err(410, 'expired', 'انتهت صلاحية الدعوة');
    if (await one(db, 'SELECT id FROM dietitians WHERE id = ?', a.id) || await one(db, 'SELECT id FROM clients WHERE id = ?', a.id)) return err(409, 'exists', 'هذا الجهاز منضم من قبل');
    const t = now(), d = await one(db, 'SELECT enc FROM dietitians WHERE id = ?', iv.did);
    await db.batch([
      db.prepare('UPDATE invites SET used = 1, cat = NULL WHERE h = ?').bind(h),
      db.prepare('INSERT INTO clients (id, did, sig, enc, label, created) VALUES (?, ?, ?, ?, ?, ?)').bind(a.id, iv.did, JSON.stringify(pubOnly(J.sigPub)), JSON.stringify(pubOnly(J.encPub)), iv.label || '', t),
      db.prepare('INSERT INTO msgs (rcpt, sender, kind, body, ts) VALUES (?, ?, ?, ?, ?)').bind(iv.did, a.id, 'join', JSON.stringify({ cid: a.id, sigPub: pubOnly(J.sigPub), encPub: pubOnly(J.encPub), label: iv.label || '', inv: h }), t)
    ]);
    bg(pushTo(db, iv.did, origin)); return json({ ok: true, cid: a.id, did: iv.did, dEncPub: JSON.parse(d.enc) });
  }
  const mX = /^\/v1\/xfer\/([A-Za-z0-9_-]{16})$/.exec(p);
  if (mX && method === 'GET') {                                     // نقل الحساب: الجهاز الجديد يأخذ الحزمة المشفّرة مرة واحدة (المفتاح عنده في الرمز لا هنا)
    const x = await one(db, 'SELECT blob, exp, claimed FROM xfer WHERE id = ?', mX[1]);
    if (!x || x.exp < now()) return err(404, 'xfer', 'رمز النقل غير صحيح أو انتهت صلاحيته'); if (x.claimed) return err(410, 'used', 'استُعمل رمز النقل من قبل');
    await run(db, "UPDATE xfer SET claimed = 1, blob = '' WHERE id = ?", mX[1]); return json({ ok: true, blob: JSON.parse(x.blob) });
  }
  // ---------- خزنة النسخ الاحتياطي: نسخ «حصة» مشفّرة بالكامل على جهاز الأخصائي (المفتاح من كلمة سر النسخ ولا يصل المحطة)
  // vid ومفتاح الوصول auth مشتقان من كلمة السر أيضاً؛ المحطة تحفظ بصمة auth فقط. القراءة تحتاج auth، والكتابة تحتاج auth + أخصائياً مسجّلاً.
  const vauth = async (J) => { const vid = String(J.vid || ''), a = String(J.auth || ''); if (!/^[A-Za-z0-9_-]{22}$/.test(vid) || !/^[A-Za-z0-9_-]{22,64}$/.test(a)) return { e: err(400, 'vault', 'بيانات الخزنة ناقصة') }; const v = await one(db, 'SELECT vid, ah, head FROM vaults WHERE vid = ?', vid); if (v && v.ah !== hex(await sha256('vault.' + a))) return { e: err(403, 'vauth', 'كلمة سر النسخ غير صحيحة') }; return { vid, v, ah: hex(await sha256('vault.' + a)) }; };
  if (p === '/v1/vault/head' && method === 'POST') {
    const x = await vauth(J); if (x.e) return x.e; if (!x.v) return err(404, 'novault', 'لا توجد نسخة بهذه البيانات');
    return json({ ok: true, head: x.v.head, vers: await all(db, 'SELECT ver, n, size, dev, at FROM vault_vers WHERE vid = ? ORDER BY ver DESC', x.vid) });
  }
  if (p === '/v1/vault/get' && method === 'POST') {
    const x = await vauth(J); if (x.e) return x.e; if (!x.v) return err(404, 'novault', 'لا توجد نسخة بهذه البيانات');
    const vr = await one(db, 'SELECT up, n FROM vault_vers WHERE vid = ? AND ver = ?', x.vid, +J.ver || 0); if (!vr) return err(404, 'nover', 'النسخة غير موجودة');
    const c = await one(db, 'SELECT data FROM vault_chunks WHERE vid = ? AND up = ? AND idx = ?', x.vid, vr.up, +J.idx || 0); if (!c) return err(404, 'nochunk', 'جزء مفقود');
    return json({ ok: true, n: vr.n, data: c.data });
  }
  if (p === '/v1/push/last' && method === 'GET') {               // عامل الخدمة يسأل: هل آخر إشعار لهذا الجهاز تذكير أم جديد من الأخصائي؟ (يعرف عنوان اشتراكه فقط)
    const r = await one(db, 'SELECT kind, last FROM push_subs WHERE ep = ?', String(url.searchParams.get('ep') || '')); return json({ ok: true, kind: r ? r.kind || 'msg' : 'msg', at: r ? r.last : 0 });
  }
  if (p === '/v1/push/key' && method === 'GET') return json({ ok: true, key: (await vapid(db)).pub });
  // كل ما يلي يحتاج طرفاً مسجّلاً
  const a = await authed(req, db, path, body); if (a.e) return a.e; const me = a.who;
  if (p === '/v1/invites' && method === 'POST') {
    if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط');
    if (!/^[A-Za-z0-9_-]{32}$/.test(J.h || '')) return err(400, 'invite', 'رمز غير صالح');
    const cat = J.cat ? JSON.stringify(J.cat) : null; if (cat && cat.length > LIM.cat) return err(413, 'big', 'قائمة الوجبات كبيرة جداً');
    const n = await one(db, 'SELECT COUNT(*) AS n FROM invites WHERE did = ? AND used = 0 AND exp > ?', me.id, now()); if (n && n.n >= LIM.invitesActive) return err(429, 'many', 'دعوات فعّالة كثيرة؛ انتظر استعمالها أو انتهاءها');
    const exp = Math.min(now() + 60 * 86400, Math.max(now() + 3600, +J.exp || now() + 7 * 86400));
    await run(db, 'INSERT INTO invites (h, did, label, exp, used, cat, created) VALUES (?, ?, ?, ?, 0, ?, ?)', J.h, me.id, String(J.label || '').slice(0, LIM.label), exp, cat, now());
    return json({ ok: true, exp });
  }
  if (p === '/v1/invites/revoke' && method === 'POST') {           // الأخصائي يلغي دعوة لم تُستعمل
    if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط');
    await run(db, 'UPDATE invites SET used = 1, cat = NULL WHERE h = ? AND did = ?', String(J.h || ''), me.id); return json({ ok: true });
  }
  if (p === '/v1/vault/put' && method === 'POST') {                // رفع جزء من نسخة؛ عند اكتمال الأجزاء تصبح النسخة التالية وتُحذف الأقدم من 7
    if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط'); const x = await vauth(J); if (x.e) return x.e;
    const up = String(J.up || ''), idx = +J.idx, n = +J.n, data = String(J.data || '');
    if (!/^[A-Za-z0-9_-]{16}$/.test(up) || !(n >= 1 && n <= LIM.chunks) || !(idx >= 0 && idx < n) || !data) return err(400, 'vault', 'جزء غير صالح'); if (data.length > LIM.chunk) return err(413, 'big', 'الجزء أكبر من المسموح');
    if (!x.v) await run(db, 'INSERT OR IGNORE INTO vaults (vid, ah, head, owner, created) VALUES (?, ?, 0, ?, ?)', x.vid, x.ah, me.id, now());
    await run(db, 'INSERT OR REPLACE INTO vault_chunks (vid, up, idx, data, ts) VALUES (?, ?, ?, ?, ?)', x.vid, up, idx, data, now());
    const cnt = await one(db, 'SELECT COUNT(*) AS c, SUM(LENGTH(data)) AS z FROM vault_chunks WHERE vid = ? AND up = ?', x.vid, up);
    if (cnt.c < n) return json({ ok: true, done: false });
    const v = await one(db, 'SELECT head FROM vaults WHERE vid = ?', x.vid), ver = (v ? v.head : 0) + 1;
    await db.batch([db.prepare('INSERT INTO vault_vers (vid, ver, up, n, size, dev, at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(x.vid, ver, up, n, cnt.z, String(J.dev || '').slice(0, 60), now()), db.prepare('UPDATE vaults SET head = ? WHERE vid = ?').bind(ver, x.vid)]);
    const old = await all(db, 'SELECT up FROM vault_vers WHERE vid = ? AND ver <= ?', x.vid, ver - LIM.keep);
    for (const o of old) await db.batch([db.prepare('DELETE FROM vault_chunks WHERE vid = ? AND up = ?').bind(x.vid, o.up), db.prepare('DELETE FROM vault_vers WHERE vid = ? AND up = ?').bind(x.vid, o.up)]);
    await run(db, 'DELETE FROM vault_chunks WHERE vid = ? AND ts < ? AND up NOT IN (SELECT up FROM vault_vers WHERE vid = ?)', x.vid, now() - 86400, x.vid);   // رفع لم يكتمل منذ يوم
    return json({ ok: true, done: true, ver });
  }
  if (p === '/v1/xfer' && method === 'POST') {                     // العميل يرفع حسابه مشفّراً بمفتاح عشوائي لينقله إلى تطبيق مثبَّت أو جوال جديد (15 دقيقة، مرة واحدة)
    if (me.role !== 'c') return err(403, 'role', 'للعميل فقط'); const id = String(J.id || ''), blob = JSON.stringify(J.blob || null);
    if (!/^[A-Za-z0-9_-]{16}$/.test(id) || !J.blob) return err(400, 'xfer', 'بيانات ناقصة'); if (blob.length > LIM.xfer) return err(413, 'big', 'الحساب أكبر من المسموح للنقل');
    await run(db, 'DELETE FROM xfer WHERE exp < ? OR cid = ?', now(), me.id);
    await run(db, 'INSERT INTO xfer (id, cid, blob, exp, claimed) VALUES (?, ?, ?, ?, 0)', id, me.id, blob, now() + LIM.xferTtl); return json({ ok: true, exp: now() + LIM.xferTtl });
  }
  const mXs = /^\/v1\/xfer\/([A-Za-z0-9_-]{16})\/status$/.exec(p);
  if (mXs && method === 'GET') { const x = await one(db, 'SELECT claimed, exp FROM xfer WHERE id = ? AND cid = ?', mXs[1], me.id); return json({ ok: true, claimed: !!(x && x.claimed), expired: !x || x.exp < now() }); }
  if (p === '/v1/push/sub' && method === 'POST') {                // اشتراك جهاز في الإشعارات (عنوان الخدمة فقط؛ لا مفاتيح ولا محتوى)
    const ep = String(J.ep || ''); if (!PUSH_HOSTS.test(ep)) return err(400, 'push', 'خدمة إشعارات غير معروفة');
    await run(db, 'INSERT INTO push_subs (ep, id, created, last) VALUES (?, ?, ?, 0) ON CONFLICT(ep) DO UPDATE SET id = excluded.id', ep, me.id, now());
    const old = await all(db, 'SELECT ep FROM push_subs WHERE id = ? ORDER BY created DESC LIMIT -1 OFFSET ?', me.id, PUSH.perId); for (const o of old) await run(db, 'DELETE FROM push_subs WHERE ep = ?', o.ep);
    return json({ ok: true });
  }
  if (p === '/v1/remind' && method === 'POST') {                  // تذكيرات العميل (الماء والوجبات): دقائق اليوم بتوقيت UTC مقرّبة لربع ساعة؛ المحطة لا تعرف إلا الأوقات
    if (me.role !== 'c') return err(403, 'role', 'للعميل فقط');
    const mins = [...new Set((Array.isArray(J.mins) ? J.mins : []).map((x) => Math.round(+x)).filter((x) => x >= 0 && x < 1440 && x % 15 === 0))].sort((a, b) => a - b).slice(0, LIM.remind);
    if (mins.length) await run(db, 'INSERT INTO remind (id, mins, upd) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET mins = excluded.mins, upd = excluded.upd', me.id, JSON.stringify(mins), now()); else await run(db, 'DELETE FROM remind WHERE id = ?', me.id);
    await run(db, "INSERT OR REPLACE INTO kv (k, v) VALUES ('origin', ?)", origin); return json({ ok: true, mins });
  }
  if (p === '/v1/push/unsub' && method === 'POST') { await run(db, 'DELETE FROM push_subs WHERE ep = ? AND id = ?', String(J.ep || ''), me.id); return json({ ok: true }); }
  if (p === '/v1/send' && method === 'POST') {
    const to = String(J.to || ''), box = J.box; if (!box || typeof box !== 'object') return err(400, 'box', 'رسالة فارغة');
    const s = JSON.stringify(box); if (s.length > LIM.box) return err(413, 'big', 'الرسالة أكبر من المسموح');
    if (me.role === 'c' ? to !== me.did : !(await one(db, 'SELECT id FROM clients WHERE id = ? AND did = ?', to, me.id))) return err(403, 'pair', 'لا علاقة بين المرسل والمستلم');
    const n = await one(db, 'SELECT COUNT(*) AS n FROM msgs WHERE sender = ? AND ts > ?', me.id, now() - 3600); if (n && n.n >= LIM.perHour) return err(429, 'rate', 'رسائل كثيرة خلال ساعة');
    const r = await run(db, 'INSERT INTO msgs (rcpt, sender, kind, body, ts) VALUES (?, ?, ?, ?, ?)', to, me.id, 'e', s, now());
    if (J.push) bg(pushTo(db, to, origin));                         // المرسل يحدد ما يستحق إشعاراً (خطة، رسالة…) لا المتابعة الصامتة
    return json({ ok: true, id: r.meta && r.meta.last_row_id });
  }
  if (p === '/v1/inbox' && method === 'GET') {
    const after = Math.max(0, parseInt(url.searchParams.get('after') || '0', 10) || 0);
    const rows = await all(db, 'SELECT id, sender, kind, body, ts FROM msgs WHERE rcpt = ? AND id > ? ORDER BY id LIMIT ?', me.id, after, LIM.inbox);
    return json({ ok: true, msgs: rows.map((r) => ({ id: r.id, from: r.sender, kind: r.kind, body: JSON.parse(r.body), ts: r.ts })), more: rows.length === LIM.inbox });
  }
  if (p === '/v1/ack' && method === 'POST') { await run(db, 'DELETE FROM msgs WHERE rcpt = ? AND id <= ?', me.id, Math.max(0, +J.upTo || 0)); return json({ ok: true }); }
  if (p === '/v1/clients/remove' && method === 'POST') {          // الأخصائي يفصل عميلاً (أو العميل يحذف نفسه): تُحذف بياناته ورسائله من المحطة
    const cid = me.role === 'c' ? me.id : String(J.cid || ''), c = await one(db, 'SELECT did FROM clients WHERE id = ?', cid);
    if (!c || (me.role === 'd' && c.did !== me.id)) return err(404, 'client', 'غير موجود');
    await db.batch([db.prepare('DELETE FROM msgs WHERE rcpt = ? OR sender = ?').bind(cid, cid), db.prepare('DELETE FROM push_subs WHERE id = ?').bind(cid), db.prepare('DELETE FROM remind WHERE id = ?').bind(cid), db.prepare('DELETE FROM xfer WHERE cid = ?').bind(cid), db.prepare('UPDATE posts SET likes = MAX(0, likes - (SELECT COUNT(*) FROM post_likes WHERE pid = posts.id AND uid = ?)), comments = MAX(0, comments - (SELECT COUNT(*) FROM comments WHERE pid = posts.id AND uid = ?))').bind(cid, cid), db.prepare('DELETE FROM post_likes WHERE uid = ?').bind(cid), db.prepare('DELETE FROM comments WHERE uid = ?').bind(cid), db.prepare('DELETE FROM clients WHERE id = ?').bind(cid)]);
    return json({ ok: true });
  }
  const fr = await feedApi(p, method, J, me, db, env, url, bg, origin); if (fr) return fr;
  return err(404, 'route', 'مسار غير معروف');
}
// ---------- التثقيف (منشورات الأخصائي لمراجعيه، أو عامة لكل مراجعي «حصة» بعد موافقة الإدارة)
// محتوى تثقيفي عام فيُحفظ مقروءاً (بخلاف البيانات الصحية المشفّرة)، ويراه جمهوره فقط. الإدارة = أول أخصائي يطالب بالإشراف من نسخة المدير (أو MOD_ID).
// الوسائط: الصور في D1 (مضغوطة)، والفيديو في R2 إن رُبط باسم MEDIA.
const FEED = { img: 1200000, vid: 60000000, perDay: 60, cPerHour: 60, page: 20, title: 120, body: 5000, comment: 1000, push: 40 };
const MTYPES = { 'image/jpeg': 'i', 'image/png': 'i', 'image/webp': 'i', 'video/mp4': 'v', 'video/webm': 'v', 'video/quicktime': 'v' };
async function modId(db, env) { if (env.MOD_ID) return env.MOD_ID; const r = await one(db, "SELECT v FROM kv WHERE k = 'mod'"); return r ? r.v : ''; }
async function mediaUp(req, env, db, path) {
  const ct = String(req.headers.get('content-type') || '').split(';')[0].trim(), t = MTYPES[ct]; if (!t) return err(415, 'mtype', 'نوع الملف غير مدعوم (صور JPG/PNG/WebP أو فيديو MP4/WebM/MOV)');
  const buf = await req.arrayBuffer(), max = t === 'i' ? FEED.img : FEED.vid; if (buf.byteLength > max) return err(413, 'big', t === 'i' ? 'الصورة أكبر من 1.2 ميغابايت بعد الضغط' : 'الفيديو أكبر من 60 ميغابايت');
  const a = await authed(req, db, path, buf); if (a.e) return a.e; if (a.who.role !== 'd') return err(403, 'role', 'للأخصائي فقط');
  if (t === 'v' && !env.MEDIA) return err(501, 'nor2', 'رفع الفيديو يحتاج ربط R2 بالمحطة باسم MEDIA — أو استعمل رابط يوتيوب');
  const key = b64u(crypto.getRandomValues(new Uint8Array(18)));
  if (env.MEDIA) { await env.MEDIA.put('m/' + key, buf, { httpMetadata: { contentType: ct, cacheControl: 'public, max-age=31536000, immutable' } }); await run(db, 'INSERT INTO media (key, did, type, size, store, created) VALUES (?, ?, ?, ?, ?, ?)', key, a.id, ct, buf.byteLength, 'r2', now()); }
  else await run(db, 'INSERT INTO media (key, did, type, size, store, data, created) VALUES (?, ?, ?, ?, ?, ?, ?)', key, a.id, ct, buf.byteLength, 'd1', b64u(buf), now());
  return json({ ok: true, key, type: t, url: '/m/' + key });
}
async function mediaGet(req, env, key) {
  const db = env.DB; if (!db) return null; await init(db); const m = await one(db, 'SELECT type, store, data FROM media WHERE key = ?', key); if (!m) return new Response('Not found', { status: 404 });
  const h = { 'content-type': m.type, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' };
  if (m.store === 'd1') return new Response(unb64u(m.data), { headers: h });
  if (!env.MEDIA) return new Response('Not found', { status: 404 });
  const range = req.headers.get('range'), o = await env.MEDIA.get('m/' + key, range ? { range: req.headers } : undefined); if (!o) return new Response('Not found', { status: 404 });
  if (range && o.range) { const st = o.range.offset || 0, ln = o.range.length != null ? o.range.length : o.size - st; h['content-range'] = 'bytes ' + st + '-' + (st + ln - 1) + '/' + o.size; h['content-length'] = String(ln); return new Response(o.body, { status: 206, headers: h }); }
  return new Response(o.body, { headers: h });
}
async function feedApi(p, method, J, me, db, env, url, bg, origin) {
  const mod = await modId(db, env), isMod = me.role === 'd' && mod === me.id, myDid = me.role === 'd' ? me.id : me.did;
  const canSee = (x) => (x.status === 'live' && (x.scope === 'public' || x.did === myDid)) || (me.role === 'd' && x.did === me.id) || (isMod && x.scope === 'public');
  const post = async (id) => one(db, 'SELECT * FROM posts WHERE id = ?', +id || 0);
  const shape = async (rows) => { if (!rows.length) return []; const ids = rows.map((r) => r.id), liked = {}; (await all(db, 'SELECT pid FROM post_likes WHERE uid = ? AND pid IN (' + ids.map(() => '?').join(',') + ')', me.id, ...ids)).forEach((r) => { liked[r.pid] = 1; }); const names = {}; for (const r of rows) if (!names[r.did]) { const d = await one(db, 'SELECT name FROM dietitians WHERE id = ?', r.did); names[r.did] = d ? d.name : ''; }
    return rows.map((r) => ({ id: r.id, author: names[r.did], mine: r.did === myDid, own: me.role === 'd' && r.did === me.id, scope: r.scope, status: r.status, kind: r.kind, title: r.title, body: r.body, media: JSON.parse(r.media || '[]'), link: r.link, note: r.note, likes: r.likes, comments: r.comments, liked: !!liked[r.id], at: r.created })); };
  if (p === '/v1/me' && method === 'GET') return json({ ok: true, id: me.id, role: me.role, mod: isMod, modSet: !!mod, r2: !!env.MEDIA });
  if (p === '/v1/mod/claim' && method === 'POST') {                 // نسخة المدير تطالب بالإشراف مرة واحدة (أول من يطالب)
    if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط'); if (mod && mod !== me.id) return err(409, 'modset', 'للمحطة مشرف بالفعل');
    if (!mod) await run(db, "INSERT OR IGNORE INTO kv (k, v) VALUES ('mod', ?)", me.id); return json({ ok: true, mod: (await modId(db, env)) === me.id });
  }
  if (p === '/v1/feed' && method === 'GET') {
    const before = parseInt(url.searchParams.get('before') || '0', 10) || 2e9, lim = FEED.page;
    const rows = me.role === 'c' ? await all(db, "SELECT * FROM posts WHERE id < ? AND status = 'live' AND (scope = 'public' OR did = ?) ORDER BY id DESC LIMIT ?", before, myDid, lim)
      : await all(db, "SELECT * FROM posts WHERE id < ? AND (did = ? OR (scope = 'public' AND (status = 'live' OR ?))) ORDER BY id DESC LIMIT ?", before, me.id, isMod ? 1 : 0, lim);
    return json({ ok: true, posts: await shape(rows), more: rows.length === lim, mod: isMod, pending: isMod ? (await one(db, "SELECT COUNT(*) AS n FROM posts WHERE status = 'pending'")).n : undefined });
  }
  if (p === '/v1/posts' && method === 'POST') {
    if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط');
    const n = await one(db, 'SELECT COUNT(*) AS n FROM posts WHERE did = ? AND created > ?', me.id, now() - 86400); if (n.n >= FEED.perDay) return err(429, 'rate', 'منشورات كثيرة اليوم');
    const kind = ['text', 'tip', 'image', 'video', 'reel', 'link'].includes(J.kind) ? J.kind : 'text', scope = J.scope === 'public' ? 'public' : 'mine';
    const title = String(J.title || '').trim().slice(0, FEED.title), bodyT = String(J.body || '').trim().slice(0, FEED.body), link = /^https:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\/[^\s]{3,200}$/.test(J.link || '') ? J.link : '';
    const media = []; for (const m of (Array.isArray(J.media) ? J.media.slice(0, 6) : [])) { const r = await one(db, 'SELECT type FROM media WHERE key = ? AND did = ?', String(m.key || ''), me.id); if (r) media.push({ key: m.key, t: MTYPES[r.type], w: +m.w || 0, h: +m.h || 0 }); }
    if (!title && !bodyT && !media.length && !link) return err(400, 'empty', 'المنشور فارغ');
    const status = scope === 'public' && !isMod ? 'pending' : 'live';
    const r = await run(db, 'INSERT INTO posts (did, scope, status, kind, title, body, media, link, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', me.id, scope, status, kind, title, bodyT, JSON.stringify(media), link, now());
    if (status === 'live') bg((async () => { const cs = await all(db, 'SELECT DISTINCT s.id FROM push_subs s JOIN clients c ON c.id = s.id WHERE c.did = ? ORDER BY s.created DESC LIMIT ?', me.id, FEED.push); for (const c of cs) await pushTo(db, c.id, origin, 'feed'); })());
    return json({ ok: true, id: r.meta && r.meta.last_row_id, status });
  }
  const mP = /^\/v1\/posts\/(\d+)\/(like|comments|delete)$/.exec(p);
  if (mP) {
    const x = await post(mP[1]); if (!x || !canSee(x)) return err(404, 'post', 'المنشور غير موجود');
    if (mP[2] === 'like' && method === 'POST') {
      if (x.status !== 'live') return err(409, 'pending', 'المنشور بانتظار الموافقة');
      if (J.on) { const r = await run(db, 'INSERT OR IGNORE INTO post_likes (pid, uid) VALUES (?, ?)', x.id, me.id); if (r.meta && r.meta.changes) await run(db, 'UPDATE posts SET likes = likes + 1 WHERE id = ?', x.id); }
      else { const r = await run(db, 'DELETE FROM post_likes WHERE pid = ? AND uid = ?', x.id, me.id); if (r.meta && r.meta.changes) await run(db, 'UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?', x.id); }
      return json({ ok: true, likes: (await post(x.id)).likes, liked: !!J.on });
    }
    if (mP[2] === 'comments' && method === 'GET') {
      const rows = await all(db, 'SELECT id, uid, name, dr, body, created FROM comments WHERE pid = ? ORDER BY id LIMIT 300', x.id);
      return json({ ok: true, comments: rows.map((c) => ({ id: c.id, name: c.name, dr: !!c.dr, body: c.body, at: c.created, mine: c.uid === me.id, del: c.uid === me.id || (me.role === 'd' && x.did === me.id) || isMod })) });
    }
    if (mP[2] === 'comments' && method === 'POST') {
      if (x.status !== 'live') return err(409, 'pending', 'المنشور بانتظار الموافقة'); const txt = String(J.body || '').trim().slice(0, FEED.comment); if (!txt) return err(400, 'empty', 'التعليق فارغ');
      const n = await one(db, 'SELECT COUNT(*) AS n FROM comments WHERE uid = ? AND created > ?', me.id, now() - 3600); if (n.n >= FEED.cPerHour) return err(429, 'rate', 'تعليقات كثيرة خلال ساعة');
      const name = me.role === 'd' ? (me.name || 'الأخصائي') : String(J.name || 'مراجع').trim().slice(0, 40) || 'مراجع';
      const r = await run(db, 'INSERT INTO comments (pid, uid, name, dr, body, created) VALUES (?, ?, ?, ?, ?, ?)', x.id, me.id, name, me.role === 'd' ? 1 : 0, txt, now()); await run(db, 'UPDATE posts SET comments = comments + 1 WHERE id = ?', x.id);
      return json({ ok: true, id: r.meta && r.meta.last_row_id });
    }
    if (mP[2] === 'delete' && method === 'POST') {
      if (!(me.role === 'd' && (x.did === me.id || isMod))) return err(403, 'own', 'ليس منشورك');
      const ms = JSON.parse(x.media || '[]'); for (const m of ms) { if (env.MEDIA) await env.MEDIA.delete('m/' + m.key).catch(() => { }); await run(db, 'DELETE FROM media WHERE key = ?', m.key); }
      await db.batch([db.prepare('DELETE FROM post_likes WHERE pid = ?').bind(x.id), db.prepare('DELETE FROM comments WHERE pid = ?').bind(x.id), db.prepare('DELETE FROM posts WHERE id = ?').bind(x.id)]); return json({ ok: true });
    }
  }
  const mC = /^\/v1\/comments\/(\d+)\/delete$/.exec(p);
  if (mC && method === 'POST') {
    const c = await one(db, 'SELECT id, pid, uid FROM comments WHERE id = ?', +mC[1]), x = c && await post(c.pid); if (!c || !x || !canSee(x)) return err(404, 'comment', 'غير موجود');
    if (!(c.uid === me.id || (me.role === 'd' && x.did === me.id) || isMod)) return err(403, 'own', 'لا تملك حذفه');
    await run(db, 'DELETE FROM comments WHERE id = ?', c.id); await run(db, 'UPDATE posts SET comments = MAX(0, comments - 1) WHERE id = ?', x.id); return json({ ok: true });
  }
  if (p === '/v1/mod/review' && method === 'POST') {
    if (!isMod) return err(403, 'mod', 'للإدارة فقط'); const x = await post(J.id); if (!x || x.status !== 'pending') return err(404, 'post', 'لا يوجد منشور بانتظار المراجعة');
    await run(db, 'UPDATE posts SET status = ?, note = ? WHERE id = ?', J.ok ? 'live' : 'rejected', String(J.note || '').slice(0, 300), x.id); return json({ ok: true, status: J.ok ? 'live' : 'rejected' });
  }
  return null;
}
function appPage(url) {
  const ic = /^\/(icon-192|icon-512|maskable-512|apple-180)(-rose|-pulse)?\.png$/.exec(url.pathname);
  if (ic && ICONS[ic[1] + (ic[2] || '')]) return new Response(unb64u(ICONS[ic[1] + (ic[2] || '')]), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800' } });
  if (url.pathname === '/icon.png' && ICON_B64) return new Response(unb64u(ICON_B64), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
  if (url.pathname === '/manifest.webmanifest') {              // البيان يتبع ثيم العميل (?t=rose|pulse): أيقونة وألوان؛ المعرّف id ثابت فيبقى التطبيق نفسه
    const th = url.searchParams.get('t'), sf = th === 'rose' ? '-rose' : th === 'pulse' ? '-pulse' : '', C = { '': ['#0c1534', '#121c45'], '-rose': ['#FAF6F2', '#FAF6F2'], '-pulse': ['#0A0C0F', '#0A0C0F'] }[sf];
    return new Response(JSON.stringify({
      id: '/', name: 'حصتي — خطتك الغذائية', short_name: 'حصتي', description: 'خطتك من أخصائي التغذية، ومتابعة يومك، والمحادثة معه — مشفّرة على جوالك.', start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait', dir: 'rtl', lang: 'ar',
      background_color: C[0], theme_color: C[1], categories: ['health', 'food', 'lifestyle'], prefer_related_applications: false,
      icons: ICONS['icon-192'] ? [{ src: '/icon-192' + sf + '.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icon-512' + sf + '.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/maskable-512' + sf + '.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] : ICON_B64 ? [{ src: '/icon.png', sizes: '256x256', type: 'image/png' }] : []
    }), { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'no-cache' } });
  }
  if (url.pathname === '/' || url.pathname === '/index.html') return new Response(APP_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: 'self'; media-src 'self'; frame-src https://www.youtube-nocookie.com; font-src data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" } });
  if (url.pathname === '/sw.js' && SW_JS) return new Response(SW_JS, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' } });
  if (url.pathname === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain' } });
  return null;
}
// ---------- التذكيرات المجدولة: مشغّل Cron كل ربع ساعة (*/15 * * * *) يرسل إشعاراً بلا محتوى لمن حان وقت تذكيره، وعامل الخدمة يعرض «وقت الماء/الوجبة»
export async function remindTick(env, at) {
  const db = env.DB; if (!db) return 0; await init(db);
  const m = Math.floor(((at || Date.now()) / 60000) % 1440 / 15) * 15, o = await one(db, "SELECT v FROM kv WHERE k = 'origin'"), origin = o ? o.v : 'https://hissati.workers.dev';
  const rows = (await all(db, 'SELECT id, mins FROM remind')).filter((r) => JSON.parse(r.mins).includes(m));
  for (const r of rows) await pushTo(db, r.id, origin, 'rem'); return rows.length;
}
export default {
  async scheduled(event, env, ctx) { const p = remindTick(env, event && event.scheduledTime).catch(() => 0); if (ctx && ctx.waitUntil) ctx.waitUntil(p); return p; },
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (url.pathname.startsWith('/v1/')) return await api(req, env, url, ctx);
      const mm = /^\/m\/([A-Za-z0-9_-]{24})$/.exec(url.pathname); if (mm && req.method === 'GET') return (await mediaGet(req, env, mm[1])) || err(500, 'nodb', 'لم تُربط قاعدة D1 باسم DB');
      return appPage(url) || new Response('Not found', { status: 404 });
    } catch (e) { return err(500, 'server', 'خطأ في المحطة'); }
  }
};
export const _test = { reset: () => { ready = null; vapidC = null; jwtC.clear(); } };
