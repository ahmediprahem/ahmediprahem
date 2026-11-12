// ================= خادم موقع الأخصائيين hessanu (0.96): الأصول الثابتة كما هي، ومسار واحد /api/lic
// الموقع خلف Cloudflare Access (تطبيق ثانٍ بنفس الفريق): Access يثبت أن البريد ملك صاحبه، ونحن نتحقق من الرمز (RS256، الجمهور SITE_AUD)،
// ثم نبحث عن البريد في قائمة الأخصائيين في قاعدة الإدارة (D1 zenha_admin مربوطة باسم ADB، للقراءة وتحديث «آخر دخول» فقط)
// ونعيد رخصته الموقّعة بمفتاح المدير. الخادم لا يوقّع شيئاً؛ «زنها Pro» يتحقق من الرخصة بالمفتاح العام.
// بلا Access (أو قبل ضبطه) يرد /api/lic بـ401 فيعمل الدخول القديم (اسم المستخدم وكلمة السر والكود) كما هو.
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
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
  const who = await verifyAccess(req, env); if (!who) return json({ ok: false, code: 'access', error: 'الدخول عبر Cloudflare Access غير مفعّل' }, 401);
  if (!env.ADB) return json({ ok: false, code: 'db', error: 'قاعدة الأخصائيين غير مربوطة' }, 500);
  const s = await env.ADB.prepare('SELECT name, exp, status, lic FROM specialists WHERE email = ?').bind(who.email).first().catch(() => null);
  if (!s || !s.lic) return json({ ok: false, code: 'none', email: who.email, error: 'بريدك غير مضاف إلى «زنها Pro» بعد' }, 403);
  if (s.status === 'off') return json({ ok: false, code: 'off', email: who.email, error: 'حسابك موقوف حالياً' }, 403);
  if (s.exp && s.exp < now()) return json({ ok: false, code: 'expired', email: who.email, error: 'انتهى اشتراكك في «زنها Pro». تواصل مع الإدارة للتجديد.' }, 403);
  await env.ADB.prepare('UPDATE specialists SET last_seen = ? WHERE email = ?').bind(now(), who.email).run().catch(() => { });
  return json({ ok: true, email: who.email, name: s.name, lic: s.lic });
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/lic') { try { return await lic(req, env); } catch (e) { return json({ ok: false, code: 'server', error: 'خطأ في الخادم' }, 500); } }
    return env.ASSETS.fetch(req);
  }
};
export const _test = { reset: () => { certs = { at: 0, keys: null }; }, setVerifier: (f) => { verifierOverride = f; } };
