// ================= خادم إدارة «زنها» (zenha-admin) — المرحلة 1 (0.95)
// الحماية طبقتان:
//   1) Cloudflare Access أمام العنوان كله: لا يصل الطلب إلا ومعه Cf-Access-Jwt-Assertion موقَّع من فريقك. نتحقق من التوقيع (RS256)
//      والجمهور (ACCESS_AUD) والانتهاء بأنفسنا، فلو أُوقف Access خطأً لا يُفتح شيء.
//   2) قائمة الأعضاء هنا: البريد وحده لا يكفي، يجب أن يكون عضواً مفعّلاً، والصلاحيات تُفرض على الخادم لا في الواجهة فقط.
// البيانات: الواجهة تشفّر كل شيء قبل الإرسال (مفتاح التوقيع والأخصائيون والعملاء)، فالخادم يخزّن صناديق مشفّرة مع رقم إصدار لكل مفتاح
// (تحكّم تفاؤلي بالتزامن: الكتابة على إصدار قديم تُرفض 409 بدل أن تمحو تعديل غيرك). كل كتابة في سجل التدقيق، ونسخة احتياطية يومية.
// الإعداد (متغيرات Worker): ACCESS_TEAM = اسم الفريق (xxx في xxx.cloudflareaccess.com)، ACCESS_AUD = رمز الجمهور لتطبيق Access،
// OWNER_EMAIL = بريد المالك الأول (يُضاف تلقائياً مالكاً ولا يمكن حذفه أو تخفيضه). D1 باسم DB.
const VER = '0.1';
export const PERMS = ['users', 'lic', 'settings', 'publish', 'clients', 'audit'];   // الأخصائيون والأجهزة | إصدار الرخص والأكواد | الإعدادات الرئيسية | النشر | العملاء والخطط | سجل التدقيق
const KEY_PERM = { users: 'users', keys: 'lic', lic: 'lic', settings: 'settings', site: 'publish', clients: 'clients' };   // بادئة المفتاح ← الصلاحية المطلوبة
const LIM = { box: 4 * 1024 * 1024, keyLen: 80, members: 50, auditPage: 100, backups: 30, skew: 60 };
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS members (email TEXT PRIMARY KEY, role TEXT NOT NULL, perms TEXT NOT NULL, added_by TEXT, created INTEGER, disabled INTEGER DEFAULT 0, last_seen INTEGER)',
  'CREATE TABLE IF NOT EXISTS store (k TEXT PRIMARY KEY, v TEXT NOT NULL, ver INTEGER NOT NULL, updated INTEGER, updated_by TEXT)',
  'CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, email TEXT, action TEXT, detail TEXT)',
  'CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, data TEXT)',
  'CREATE INDEX IF NOT EXISTS audit_ts ON audit (ts)'
];
const now = () => Math.floor(Date.now() / 1000);
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const err = (s, code, msg) => json({ ok: false, code, error: msg }, s);
const one = (db, q, ...a) => db.prepare(q).bind(...a).first();
const all = async (db, q, ...a) => (await db.prepare(q).bind(...a).all()).results || [];
const run = (db, q, ...a) => db.prepare(q).bind(...a).run();
const normEmail = (e) => String(e || '').trim().toLowerCase();
const emailOk = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/.test(e);
let ready = null;
async function init(db, env) {
  if (!ready) ready = (async () => { for (const q of SCHEMA) await run(db, q); })().catch((e) => { ready = null; throw e; });
  await ready;
  const owner = normEmail(env.OWNER_EMAIL);
  if (owner && emailOk(owner)) { const m = await one(db, 'SELECT email, role, disabled FROM members WHERE email = ?', owner); if (!m) await run(db, 'INSERT INTO members (email, role, perms, added_by, created) VALUES (?, ?, ?, ?, ?)', owner, 'owner', JSON.stringify(PERMS), 'system', now()); else if (m.role !== 'owner' || m.disabled) await run(db, "UPDATE members SET role = 'owner', disabled = 0 WHERE email = ?", owner); }
}
// ---------- التحقق من رمز Cloudflare Access (JWT RS256 من https://<team>.cloudflareaccess.com/cdn-cgi/access/certs)
const b64uDec = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
let certs = { at: 0, keys: null }, verifierOverride = null;
async function accessKeys(team) {
  if (certs.keys && Date.now() - certs.at < 3600e3) return certs.keys;
  const r = await fetch('https://' + team + '.cloudflareaccess.com/cdn-cgi/access/certs'); if (!r.ok) throw new Error('certs');
  const j = await r.json(), keys = {};
  for (const k of j.keys || []) keys[k.kid] = await crypto.subtle.importKey('jwk', k, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  certs = { at: Date.now(), keys }; return keys;
}
async function verifyAccess(req, env) {
  if (verifierOverride) return verifierOverride(req, env);
  const tok = req.headers.get('cf-access-jwt-assertion'); if (!tok || !env.ACCESS_TEAM || !env.ACCESS_AUD) return null;
  const p = tok.split('.'); if (p.length !== 3) return null;
  let h, c; try { h = JSON.parse(new TextDecoder().decode(b64uDec(p[0]))); c = JSON.parse(new TextDecoder().decode(b64uDec(p[1]))); } catch (e) { return null; }
  if (h.alg !== 'RS256') return null; const keys = await accessKeys(env.ACCESS_TEAM).catch(() => null); const key = keys && keys[h.kid]; if (!key) return null;
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64uDec(p[2]), new TextEncoder().encode(p[0] + '.' + p[1])); if (!ok) return null;
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud]; if (aud.indexOf(env.ACCESS_AUD) < 0) return null;
  const t = now(); if (!c.exp || c.exp < t - LIM.skew || (c.nbf && c.nbf > t + LIM.skew)) return null;
  if (c.iss && c.iss !== 'https://' + env.ACCESS_TEAM + '.cloudflareaccess.com') return null;
  const email = normEmail(c.email); return emailOk(email) ? { email } : null;
}
// ---------- الصلاحيات
const memberOut = (m) => ({ email: m.email, role: m.role, perms: JSON.parse(m.perms || '[]'), added_by: m.added_by, created: m.created, disabled: !!m.disabled, last_seen: m.last_seen });
const can = (m, perm) => m.role === 'owner' || m.role === 'admin' || JSON.parse(m.perms || '[]').indexOf(perm) >= 0;
const permOfKey = (k) => KEY_PERM[String(k).split(':')[0]] || null;
async function audit(db, email, action, detail) { await run(db, 'INSERT INTO audit (ts, email, action, detail) VALUES (?, ?, ?, ?)', now(), email, action, String(detail || '').slice(0, 500)); }
async function api(req, env, url) {
  const db = env.DB; await init(db, env);
  const who = await verifyAccess(req, env); if (!who) return err(401, 'access', 'الدخول عبر Cloudflare Access مطلوب');
  const me = await one(db, 'SELECT * FROM members WHERE email = ?', who.email);
  if (!me || me.disabled) return err(403, 'member', 'هذا البريد ليس عضواً مفعّلاً في إدارة «زنها». اطلب من المالك إضافتك.');
  await run(db, 'UPDATE members SET last_seen = ? WHERE email = ?', now(), me.email);
  const p = url.pathname, method = req.method;
  let J = {}; if (method === 'POST' || method === 'PUT') { const t = await req.text(); if (t.length > LIM.box + 4096) return err(413, 'big', 'الطلب أكبر من المسموح'); try { J = t ? JSON.parse(t) : {}; } catch (e) { return err(400, 'json', 'صيغة غير صالحة'); } }
  if (p === '/api/me') return json({ ok: true, me: memberOut(me), perms: PERMS, ver: VER });
  // ---- التخزين المشفّر: /api/store/<key>
  const sm = /^\/api\/store\/([A-Za-z0-9:_-]{1,80})$/.exec(p);
  if (p === '/api/store' && method === 'GET') {
    const rows = await all(db, 'SELECT k, ver, updated, updated_by FROM store ORDER BY k');
    return json({ ok: true, keys: rows.filter((r) => { const pm = permOfKey(r.k); return pm && can(me, pm); }) });
  }
  if (sm) {
    const k = sm[1], pm = permOfKey(k); if (!pm) return err(400, 'key', 'مفتاح غير معروف'); if (!can(me, pm)) return err(403, 'perm', 'لا تملك صلاحية «' + pm + '»');
    if (method === 'GET') { const r = await one(db, 'SELECT v, ver, updated, updated_by FROM store WHERE k = ?', k); return r ? json({ ok: true, k, v: JSON.parse(r.v), ver: r.ver, updated: r.updated, updated_by: r.updated_by }) : json({ ok: true, k, v: null, ver: 0 }); }
    if (method === 'PUT') {
      const v = J.v; if (!v || typeof v !== 'object' || v._e !== 1 || typeof v.ct !== 'string' || typeof v.iv !== 'string') return err(400, 'enc', 'يُقبل محتوى مشفّر فقط');
      const sv = JSON.stringify(v); if (sv.length > LIM.box) return err(413, 'big', 'البيانات أكبر من المسموح');
      const cur = await one(db, 'SELECT ver FROM store WHERE k = ?', k), base = +J.ver || 0;
      if ((cur ? cur.ver : 0) !== base) return err(409, 'stale', 'عدّل شخص آخر هذه البيانات قبلك. حدّث الصفحة ثم أعد المحاولة.');
      const nv = base + 1;
      if (cur) await run(db, 'UPDATE store SET v = ?, ver = ?, updated = ?, updated_by = ? WHERE k = ? AND ver = ?', sv, nv, now(), me.email, k, base);
      else await run(db, 'INSERT INTO store (k, v, ver, updated, updated_by) VALUES (?, ?, ?, ?, ?)', k, sv, nv, now(), me.email);
      await audit(db, me.email, 'store.put', k + ' v' + nv); return json({ ok: true, ver: nv });
    }
    if (method === 'DELETE') { if (me.role !== 'owner') return err(403, 'perm', 'الحذف للمالك فقط'); await run(db, 'DELETE FROM store WHERE k = ?', k); await audit(db, me.email, 'store.del', k); return json({ ok: true }); }
    return err(405, 'method', 'طريقة غير مدعومة');
  }
  // ---- الأعضاء (المالك يضيف ويعدّل ويحذف؛ المدير يرى فقط)
  if (p === '/api/members' && method === 'GET') { if (me.role === 'member') return err(403, 'perm', 'للمالك والمدير فقط'); return json({ ok: true, members: (await all(db, 'SELECT * FROM members ORDER BY created')).map(memberOut) }); }
  if (p === '/api/members' && method === 'POST') {
    if (me.role !== 'owner') return err(403, 'perm', 'إضافة الأعضاء للمالك فقط');
    const email = normEmail(J.email); if (!emailOk(email)) return err(400, 'email', 'بريد غير صالح');
    const role = J.role === 'admin' ? 'admin' : 'member', perms = (Array.isArray(J.perms) ? J.perms : []).filter((x) => PERMS.indexOf(x) >= 0);
    if (email === normEmail(env.OWNER_EMAIL)) return err(400, 'owner', 'المالك الأول لا يُعدَّل من هنا');
    const n = await one(db, 'SELECT COUNT(*) AS n FROM members'); const ex = await one(db, 'SELECT email, role FROM members WHERE email = ?', email);
    if (!ex && n && n.n >= LIM.members) return err(429, 'many', 'عدد الأعضاء كبير');
    if (ex && ex.role === 'owner') return err(400, 'owner', 'لا يُعدَّل مالك من هنا');
    if (ex) await run(db, 'UPDATE members SET role = ?, perms = ?, disabled = ? WHERE email = ?', role, JSON.stringify(perms), J.disabled ? 1 : 0, email);
    else await run(db, 'INSERT INTO members (email, role, perms, added_by, created, disabled) VALUES (?, ?, ?, ?, ?, ?)', email, role, JSON.stringify(perms), me.email, now(), J.disabled ? 1 : 0);
    await audit(db, me.email, ex ? 'member.update' : 'member.add', email + ' ' + role + ' [' + perms.join(',') + ']' + (J.disabled ? ' disabled' : ''));
    return json({ ok: true, member: memberOut(await one(db, 'SELECT * FROM members WHERE email = ?', email)) });
  }
  const mm = /^\/api\/members\/(.+)$/.exec(p);
  if (mm && method === 'DELETE') {
    if (me.role !== 'owner') return err(403, 'perm', 'حذف الأعضاء للمالك فقط'); const email = normEmail(decodeURIComponent(mm[1]));
    const ex = await one(db, 'SELECT role FROM members WHERE email = ?', email); if (!ex) return err(404, 'none', 'عضو غير موجود'); if (ex.role === 'owner') return err(400, 'owner', 'لا يُحذف مالك');
    await run(db, 'DELETE FROM members WHERE email = ?', email); await audit(db, me.email, 'member.del', email); return json({ ok: true });
  }
  // ---- سجل التدقيق والنسخ الاحتياطية
  if (p === '/api/audit' && method === 'GET') {
    if (!can(me, 'audit')) return err(403, 'perm', 'لا تملك صلاحية سجل التدقيق'); const before = parseInt(url.searchParams.get('before') || '0', 10) || 2e9;
    return json({ ok: true, rows: await all(db, 'SELECT id, ts, email, action, detail FROM audit WHERE id < ? ORDER BY id DESC LIMIT ?', before, LIM.auditPage) });
  }
  if (p === '/api/backups' && method === 'GET') { if (me.role !== 'owner') return err(403, 'perm', 'للمالك فقط'); return json({ ok: true, backups: await all(db, 'SELECT id, ts, LENGTH(data) AS size FROM backups ORDER BY id DESC') }); }
  if (p === '/api/backup' && method === 'POST') { if (me.role !== 'owner') return err(403, 'perm', 'للمالك فقط'); const id = await backup(db); await audit(db, me.email, 'backup', 'manual #' + id); return json({ ok: true, id }); }
  return err(404, 'route', 'مسار غير معروف');
}
// نسخة احتياطية: لقطة كاملة لجدول التخزين (صناديق مشفّرة أصلاً) والأعضاء، ويُحتفظ بآخر 30
async function backup(db) {
  const store = await all(db, 'SELECT k, v, ver, updated, updated_by FROM store'), members = await all(db, 'SELECT * FROM members');
  const r = await run(db, 'INSERT INTO backups (ts, data) VALUES (?, ?)', now(), JSON.stringify({ v: 1, store, members }));
  await run(db, 'DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY id DESC LIMIT ?)', LIM.backups);
  return r.meta && r.meta.last_row_id;
}
const SETUP_HTML = '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إدارة زنها</title><style>body{font-family:system-ui,Tahoma,sans-serif;background:#0d1636;color:#f5f7ff;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}main{max-width:560px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:24px;line-height:1.8}h1{margin:0 0 8px}code{background:rgba(255,255,255,.12);padding:2px 6px;border-radius:6px}</style><main><h1>إدارة «زنها»</h1><p id="s">جارٍ التحقق من الدخول…</p></main><script>fetch("/api/me").then(r=>r.json()).then(j=>{document.getElementById("s").textContent=j.ok?("مرحباً "+j.me.email+" — دورك: "+j.me.role+". واجهة الإدارة تصل في المرحلة 2."):j.error}).catch(()=>{document.getElementById("s").textContent="تعذّر الاتصال"})</script></html>';
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (!env.DB) return err(500, 'db', 'قاعدة البيانات غير مربوطة (DB)');
    if (url.pathname === '/health') return json({ ok: true, ver: VER, access: !!(env.ACCESS_TEAM && env.ACCESS_AUD), owner: !!env.OWNER_EMAIL });
    if (url.pathname.startsWith('/api/')) { try { return await api(req, env, url); } catch (e) { return err(500, 'server', 'خطأ في الخادم'); } }
    if (env.ASSETS) return env.ASSETS.fetch(req);     // واجهة الإدارة (admin.html) كأصل ثابت خلف Access
    return new Response(SETUP_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'" } });
  },
  async scheduled(event, env, ctx) { if (!env.DB) return 0; await init(env.DB, env); const id = await backup(env.DB); await audit(env.DB, 'system', 'backup', 'daily #' + id); return id; }
};
export const _test = { reset: () => { ready = null; certs = { at: 0, keys: null }; }, setVerifier: (f) => { verifierOverride = f; } };
