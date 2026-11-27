// ================= خادم موقع الأخصائيين hessanu (0.96): الأصول الثابتة كما هي، ومسار واحد /api/lic
// الموقع خلف Cloudflare Access (تطبيق ثانٍ بنفس الفريق): Access يثبت أن البريد ملك صاحبه، ونحن نتحقق من الرمز (RS256، الجمهور SITE_AUD)،
// ثم نبحث عن البريد في قائمة الأخصائيين في قاعدة الإدارة (D1 zenha_admin مربوطة باسم ADB، للقراءة وتحديث «آخر دخول» فقط)
// ونعيد رخصته الموقّعة بمفتاح المدير. الخادم لا يوقّع شيئاً؛ «زنها Pro» يتحقق من الرخصة بالمفتاح العام.
// بلا Access (أو قبل ضبطه) يرد /api/lic بـ401 فيعمل الدخول القديم (اسم المستخدم وكلمة السر والكود) كما هو.
const json = (o, s = 200, h) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, h || {}) });
const now = () => Math.floor(Date.now() / 1000);
const b64uDec = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
let certs = { at: 0, keys: null }, verifierOverride = null;
async function accessKeys(team) {
  if (certs.keys && Date.now() - certs.at < 3600e3) return certs.keys;
  const r = await fetch('https://' + team + '.cloudflareaccess.com/cdn-cgi/access/certs'); if (!r.ok) throw new Error('certs');
  const j = await r.json(), keys = {}; for (const k of j.keys || []) keys[k.kid] = await crypto.subtle.importKey('jwk', k, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  certs = { at: Date.now(), keys }; return keys;
}
async function verifyAccess(req, env) {
  if (verifierOverride) return verifierOverride(req, env);
  const tok = req.headers.get('cf-access-jwt-assertion'); if (!tok || !env.ACCESS_TEAM || !env.SITE_AUD) return null;
  const p = tok.split('.'); if (p.length !== 3) return null;
  let h, c; try { h = JSON.parse(new TextDecoder().decode(b64uDec(p[0]))); c = JSON.parse(new TextDecoder().decode(b64uDec(p[1]))); } catch (e) { return null; }
  if (h.alg !== 'RS256') return null; const keys = await accessKeys(env.ACCESS_TEAM).catch(() => null), key = keys && keys[h.kid]; if (!key) return null;
  if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64uDec(p[2]), new TextEncoder().encode(p[0] + '.' + p[1])))) return null;
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud]; if (aud.indexOf(env.SITE_AUD) < 0) return null;
  const t = now(); if (!c.exp || c.exp < t - 60 || (c.nbf && c.nbf > t + 60)) return null;
  if (c.iss && c.iss !== 'https://' + env.ACCESS_TEAM + '.cloudflareaccess.com') return null;
  const email = String(c.email || '').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email } : null;
}
async function lic(req, env) {
  const who = (await verifyAccess(req, env)) || (await session(req, env)); if (!who) return json({ ok: false, code: 'access', error: 'سجّل الدخول أولاً', google: !!env.GOOGLE_CID }, 401);
  if (!env.ADB) return json({ ok: false, code: 'db', error: 'قاعدة الأخصائيين غير مربوطة' }, 500);
  const s = await env.ADB.prepare('SELECT name, exp, status, lic, devmax FROM specialists WHERE email = ?').bind(who.email).first().catch(() => null);
  if (!s || !s.lic) return json({ ok: false, code: 'none', email: who.email, error: 'بريدك غير مضاف إلى «زنها Pro» بعد' }, 403);
  if (s.status === 'off') return json({ ok: false, code: 'off', email: who.email, error: 'حسابك موقوف حالياً' }, 403);
  if (s.exp && s.exp < now()) return json({ ok: false, code: 'expired', email: who.email, trial: s.status === 'trial' ? 1 : 0, error: s.status === 'trial' ? 'انتهت تجربتك المجانية (' + TRIAL_DAYS + ' يوماً). اطلب تفعيل اشتراكك من إدارة «زنها»، وبياناتك محفوظة.' : 'انتهى اشتراكك في «زنها Pro». تواصل مع الإدارة للتجديد.' }, 403);
  // حد الأجهزة (يحدده المدير؛ 0 = بلا حد): جهاز جديد بعد بلوغ الحد يُرفض حتى يحرّر المدير جهازاً
  const u = new URL(req.url), dev = String(u.searchParams.get('d') || ''), label = String(u.searchParams.get('l') || '').slice(0, 60);
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(dev)) return json({ ok: false, code: 'dev', error: 'رمز الجهاز غير صالح' }, 400);
  const known = await env.ADB.prepare('SELECT dev FROM spdevices WHERE email = ? AND dev = ?').bind(who.email, dev).first().catch(() => null), max = s.devmax == null ? 2 : +s.devmax;
  if (!known) {
    const c = await env.ADB.prepare('SELECT COUNT(*) AS n FROM spdevices WHERE email = ?').bind(who.email).first().catch(() => ({ n: 0 }));
    if (max > 0 && c && c.n >= max) return json({ ok: false, code: 'devices', email: who.email, max, error: 'بلغت حد الأجهزة المسموح لك (' + max + '). اطلب من الإدارة تحرير جهاز قديم ثم أعد المحاولة.' }, 403);
    await env.ADB.prepare('INSERT INTO spdevices (email, dev, label, first, last) VALUES (?, ?, ?, ?, ?)').bind(who.email, dev, label, now(), now()).run();
  } else await env.ADB.prepare('UPDATE spdevices SET last = ?, label = COALESCE(NULLIF(?, \'\'), label) WHERE email = ? AND dev = ?').bind(now(), label, who.email, dev).run().catch(() => { });
  await env.ADB.prepare('UPDATE specialists SET last_seen = ? WHERE email = ?').bind(now(), who.email).run().catch(() => { });
  return json({ ok: true, email: who.email, name: s.name, lic: s.lic, trial: s.status === 'trial' ? 1 : 0, exp: s.exp || 0 });
}

// ================= 1.65 دخول Google + كلمة سر الحساب + التجربة المجانية (خطة «زنها السحابي» المرحلة 1)
// - Google: رمز الهوية (ID token) من زر Google يُتحقق منه هنا (RS256، الجمهور GOOGLE_CID، البريد موثّق). أول دخول لبريد غير مسجّل = تجربة 14 يوماً
//   برخصة يوقّعها الخادم بمفتاح التجارب (TRIAL_PRIV، سرّ) لا بمفتاح المدير؛ «زنها Pro» يقبلها فقط إن كانت trial:1 ومدتها ≤ 15 يوماً. تجربة واحدة لكل بريد.
// - كلمة سر الحساب: تُشتق في المتصفح (PBKDF2 310 ألف) فيصل الخادمَ ناتجها فقط، ويحفظ هنا بصمته (SHA-256 مع ملح عشوائي) — بلا كلفة معالجة على الخادم.
// - الجلسة: ملف تعريف ارتباط موقّع (HMAC، SESSION_KEY) HttpOnly وSecure وSameSite=Strict، 30 يوماً.
const TRIAL_DAYS = 14, SES_DAYS = 30;
const AUTH_DDL = ['CREATE TABLE IF NOT EXISTS spauth (email TEXT PRIMARY KEY, h TEXT NOT NULL, salt TEXT NOT NULL, created INTEGER, updated INTEGER)', 'CREATE TABLE IF NOT EXISTS sptry (k TEXT PRIMARY KEY, n INTEGER NOT NULL, t INTEGER NOT NULL)'];
let authInit = null; const initAuth = (db) => authInit || (authInit = Promise.all(AUTH_DDL.map((q) => db.prepare(q).run())).catch((e) => { authInit = null; throw e; }));
const b64uEnc = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tenc = new TextEncoder(), normEm = (e) => String(e || '').trim().toLowerCase(), emOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;
async function hmacKey(env) { return crypto.subtle.importKey('raw', tenc.encode(String(env.SESSION_KEY || '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
async function session(req, env) {
  if (!env.SESSION_KEY) return null; const m = /(?:^|;\s*)zs=([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)/.exec(req.headers.get('cookie') || ''); if (!m) return null;
  if (!(await crypto.subtle.verify('HMAC', await hmacKey(env), b64uDec(m[2]), tenc.encode(m[1])))) return null;
  let p; try { p = JSON.parse(new TextDecoder().decode(b64uDec(m[1]))); } catch (e) { return null; }
  return p && p.exp > now() && emOk(p.em) ? { email: p.em, via: p.via } : null;
}
async function setSession(env, em, via, extra) {
  const p = b64uEnc(tenc.encode(JSON.stringify({ em, via, exp: now() + SES_DAYS * 86400 }))), sig = b64uEnc(await crypto.subtle.sign('HMAC', await hmacKey(env), tenc.encode(p)));
  return json(Object.assign({ ok: true, email: em }, extra || {}), 200, { 'set-cookie': 'zs=' + p + '.' + sig + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + SES_DAYS * 86400 });
}
async function tooMany(db, k, lim, win) { const t = now(), r = await db.prepare('SELECT n, t FROM sptry WHERE k = ?').bind(k).first(); if (r && t - r.t < win && r.n >= lim) return true; await db.prepare('INSERT INTO sptry (k, n, t) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = CASE WHEN ? - sptry.t >= ? THEN 1 ELSE sptry.n + 1 END, t = CASE WHEN ? - sptry.t >= ? THEN ? ELSE sptry.t END').bind(k, t, t, win, t, win, t).run(); return false; }
const ipOf = (req) => req.headers.get('cf-connecting-ip') || 'x';
let gcerts = { at: 0, keys: null }, gOverride = null;
async function googleKeys() {
  if (gcerts.keys && Date.now() - gcerts.at < 3600e3) return gcerts.keys;
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs'); if (!r.ok) throw new Error('gcerts'); const j = await r.json(), keys = {};
  for (const k of j.keys || []) keys[k.kid] = await crypto.subtle.importKey('jwk', k, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']); gcerts = { at: Date.now(), keys }; return keys;
}
async function verifyGoogle(tok, env) {
  if (gOverride) return gOverride(tok); if (!env.GOOGLE_CID) return null; const p = String(tok || '').split('.'); if (p.length !== 3) return null;
  let h, c; try { h = JSON.parse(new TextDecoder().decode(b64uDec(p[0]))); c = JSON.parse(new TextDecoder().decode(b64uDec(p[1]))); } catch (e) { return null; }
  if (h.alg !== 'RS256') return null; const keys = await googleKeys().catch(() => null), key = keys && keys[h.kid]; if (!key) return null;
  if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64uDec(p[2]), tenc.encode(p[0] + '.' + p[1])))) return null;
  const t = now(); if (c.aud !== env.GOOGLE_CID || !['accounts.google.com', 'https://accounts.google.com'].includes(c.iss) || !c.exp || c.exp < t - 60 || c.email_verified !== true) return null;
  const em = normEm(c.email); return emOk(em) ? { email: em, name: String(c.name || c.given_name || em.split('@')[0]).slice(0, 60) } : null;
}
async function trialLic(env, em, name) {      // نفس شكل رخصة البريد (t:'em') مع trial:1، موقّعة بمفتاح التجارب ECDSA P-256 كما يوقّع المدير
  const jwk = JSON.parse(env.TRIAL_PRIV), k = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']), t = now();
  const pl = { v: 1, t: 'em', u: 'em:' + em, em, n: name, iat: t, exp: t + TRIAL_DAYS * 86400, trial: 1 }, p = b64uEnc(tenc.encode(JSON.stringify(pl)));
  return { lic: p + '.' + b64uEnc(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, tenc.encode(p))), exp: pl.exp };
}
async function authApi(req, env, path) {
  if (req.method !== 'POST') return json({ ok: false, code: 'method' }, 405); if (!env.ADB) return json({ ok: false, code: 'db', error: 'قاعدة الأخصائيين غير مربوطة' }, 500);
  if (!env.SESSION_KEY) return json({ ok: false, code: 'off', error: 'الدخول بـ Google غير مفعّل بعد' }, 503); await initAuth(env.ADB);
  const db = env.ADB; let J = {}; try { J = JSON.parse((await req.text()).slice(0, 8000) || '{}'); } catch (e) { return json({ ok: false, code: 'json' }, 400); }
  const ipk = b64uEnc(await crypto.subtle.digest('SHA-256', tenc.encode('ip|' + ipOf(req)))).slice(0, 16);      // العنوان لا يُحفظ نصاً
  if (path === '/api/auth/google') {
    if (await tooMany(db, 'g:' + ipk, 30, 3600)) return json({ ok: false, code: 'slow', error: 'محاولات كثيرة. حاول بعد قليل.' }, 429);
    const g = await verifyGoogle(J.cred, env); if (!g) return json({ ok: false, code: 'google', error: 'تعذّر التحقق من حساب Google. حاول مرة أخرى.' }, 401);
    let s = await db.prepare('SELECT status, exp FROM specialists WHERE email = ?').bind(g.email).first(), trial = 0;
    if (!s) {      // أول دخول: تجربة مجانية بلا إذن الإدارة — مرة واحدة لكل بريد، وحد للتسجيلات الجديدة لكل عنوان وللخادم كله يومياً
      if (!env.TRIAL_PRIV) return json({ ok: false, code: 'none', email: g.email, error: 'بريدك غير مضاف إلى «زنها Pro» بعد. اطلب من الإدارة إضافته.' }, 403);
      if (await tooMany(db, 'tip:' + ipk, 3, 86400) || await tooMany(db, 'tday', 200, 86400)) return json({ ok: false, code: 'slow', error: 'تعذّر بدء تجربة جديدة الآن. حاول غداً أو تواصل مع الإدارة.' }, 429);
      const tl = await trialLic(env, g.email, g.name);
      await db.prepare('INSERT INTO specialists (email, name, exp, status, lic, created, updated, updated_by, note, devmax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(g.email, g.name, tl.exp, 'trial', tl.lic, now(), now(), 'google-trial', 'تجربة مجانية ' + TRIAL_DAYS + ' يوماً (دخول Google)', 2).run(); trial = 1;
    }
    const pw = await db.prepare('SELECT email FROM spauth WHERE email = ?').bind(g.email).first();
    return setSession(env, g.email, 'g', { trial, hasPw: !!pw, name: g.name });
  }
  if (path === '/api/auth/password') {
    const em = normEm(J.email), h = String(J.h || ''); if (!emOk(em) || !/^[A-Za-z0-9_-]{40,90}$/.test(h)) return json({ ok: false, code: 'bad', error: 'اكتب البريد وكلمة السر' }, 400);
    if (await tooMany(db, 'pe:' + em, 5, 900) || await tooMany(db, 'pi:' + ipk, 30, 900)) return json({ ok: false, code: 'slow', error: 'محاولات كثيرة. انتظر ربع ساعة ثم حاول.' }, 429);
    const a = await db.prepare('SELECT h, salt FROM spauth WHERE email = ?').bind(em).first(), d = b64uEnc(await crypto.subtle.digest('SHA-256', tenc.encode((a ? a.salt : 'x') + '|' + h)));
    let same = !!a && d.length === a.h.length; if (same) { const x = tenc.encode(d), y = tenc.encode(a.h); let r = 0; for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i]; same = r === 0; }      // مقارنة بزمن ثابت
    if (!same) return json({ ok: false, code: 'wrong', error: 'البريد أو كلمة السر غير صحيحة' }, 401);
    await db.prepare('DELETE FROM sptry WHERE k = ?').bind('pe:' + em).run(); return setSession(env, em, 'p', { hasPw: true });
  }
  const me = await session(req, env); if (!me) return json({ ok: false, code: 'auth', error: 'سجّل الدخول أولاً' }, 401);
  if (path === '/api/auth/setpw') {
    const h = String(J.h || ''); if (!/^[A-Za-z0-9_-]{40,90}$/.test(h)) return json({ ok: false, code: 'bad' }, 400);
    const ex = await db.prepare('SELECT email FROM spauth WHERE email = ?').bind(me.email).first(); if (ex && me.via !== 'g' && !J.force) return json({ ok: false, code: 'exists', error: 'لتغيير كلمة السر ادخل بـ Google أولاً' }, 403);
    const salt = b64uEnc(crypto.getRandomValues(new Uint8Array(16))), d = b64uEnc(await crypto.subtle.digest('SHA-256', tenc.encode(salt + '|' + h)));
    await db.prepare('INSERT INTO spauth (email, h, salt, created, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET h = excluded.h, salt = excluded.salt, updated = excluded.updated').bind(me.email, d, salt, now(), now()).run();
    return json({ ok: true });
  }
  if (path === '/api/auth/logout') return json({ ok: true }, 200, { 'set-cookie': 'zs=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' });
  return json({ ok: false, code: 'path' }, 404);
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/lic') { try { return await lic(req, env); } catch (e) { return json({ ok: false, code: 'server', error: 'خطأ في الخادم' }, 500); } }
    if (url.pathname.startsWith('/api/auth/')) { try { return await authApi(req, env, url.pathname); } catch (e) { return json({ ok: false, code: 'server', error: 'خطأ في الخادم' }, 500); } }
    return env.ASSETS.fetch(req);
  }
};
export const _test = { reset: () => { certs = { at: 0, keys: null }; gcerts = { at: 0, keys: null }; authInit = null; }, setVerifier: (f) => { verifierOverride = f; }, setGoogle: (f) => { gOverride = f; } };
