/* محطة «حصة ↔ زنها» على Cloudflare Workers + قاعدة D1 (تعمل على الخطة المجانية).
   - صندوق بريد مشفّر: تنقل رسائل مقفلة بين «حصة» (الأخصائي) و«زنها» (العميل) ولا تستطيع قراءة محتواها؛ التشفير من طرف إلى طرف (src/hx_crypto.js).
   - كل طلب موقَّع بمفتاح صاحبه (ECDSA P-256)؛ المحطة تتحقق من التوقيع ومن العلاقة (العميل يراسل أخصائيه فقط، والأخصائي عملاءه فقط).
   - تقدّم تطبيق «زنها» نفسه على الصفحة الرئيسية (/)، فرابط الدعوة = عنوان هذه المحطة.
   - الجداول تُنشأ تلقائياً أول مرة؛ يكفي ربط قاعدة D1 باسم DB. متغير اختياري REG_KEY: مفتاح تسجيل الأخصائيين (بدونه يقبل أي «حصة»).
   - لا تسجّل أي محتوى (لا console.log). يُبنى منه worker/relay/dist/worker.js بـ py build_web.py (يُضمَّن تطبيق «زنها» وأيقونته). */
const VER = '1.31';
// ---- 1.7: رخصة الأخصائي: كود تفعيل موقَّع بمفتاح المدير (ADMIN_PUB، مفتاح عام) يغني عن مفتاح التسجيل، فيُربط الأخصائي تلقائياً دون سر في الموقع
const b64uBytes = (x) => { x = x.replace(/-/g, '+').replace(/_/g, '/'); while (x.length % 4) x += '='; const b = atob(x), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function licOk(tok, env) {
  const t = String(tok || '').replace(/\s+/g, ''), parts = t.split('.'); if (!env.ADMIN_PUB || parts.length !== 2 || !parts[0] || !parts[1] || t.length > 4000) return false;
  try {
    const key = await crypto.subtle.importKey('jwk', JSON.parse(env.ADMIN_PUB), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uBytes(parts[1]), new TextEncoder().encode(parts[0])))) return false;
    const p = JSON.parse(new TextDecoder().decode(b64uBytes(parts[0]))); return p.v === 1 && !!p.u && (!p.exp || p.exp > Math.floor(Date.now() / 1000));
  } catch { return false; }
}

const APP_HTML = /*HISSATI_HTML*/'<!doctype html><meta charset="utf-8"><title>زنها</title><p>ابنِ الملف بـ py build_web.py</p>'/*END*/;
const ICON_B64 = /*HISSATI_ICON*/''/*END*/;
const SW_JS = /*HISSATI_SW*/''/*END*/;
const QURAN_TXT = /*QURAN_TXT*/''/*END*/;                      // 0.58: نص المصحف (Tanzil، بلا تعديل) وخط Amiri Quran؛ يُطلبان عند فتح القارئ فقط ويُحفظان على الجوال
const QURAN_FONT = /*QURAN_FONT*/''/*END*/;
const ICONS = /*HISSATI_ICONS*/{}/*END*/;                          // أيقونات التثبيت من المتصفح: icon-192 / icon-512 / maskable-512 / apple-180
const LIM = { remind: 24, chunk: 900000, chunks: 40, keep: 7, xfer: 1500000, xferTtl: 900, body: 1600000, box: 450000, cat: 300000, label: 80, invitesActive: 300, perHour: 400, inbox: 100, skew: 300, groups: 60, gbox: 12000, gperHour: 600, gpoll: 100, gimg: 330000, gTtl: 30 * 86400, gimgTtl: 7 * 86400, vchunk: 610000, vparts: 10, vTtl: 7 * 86400, vperHour: 120 };
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
  'CREATE TABLE IF NOT EXISTS creds (uh TEXT PRIMARY KEY, did TEXT NOT NULL, h TEXT NOT NULL, salt TEXT NOT NULL, iter INTEGER NOT NULL, blob TEXT NOT NULL, exp INTEGER, created INTEGER)',
  'CREATE TABLE IF NOT EXISTS credtry (uh TEXT PRIMARY KEY, n INTEGER NOT NULL, t INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS grps (gid TEXT PRIMARY KEY, did TEXT NOT NULL, ah TEXT NOT NULL, created INTEGER)',
  'CREATE TABLE IF NOT EXISTS gmsgs (id INTEGER PRIMARY KEY AUTOINCREMENT, gid TEXT NOT NULL, sender TEXT NOT NULL, body TEXT NOT NULL, ts INTEGER)',
  'CREATE INDEX IF NOT EXISTS gm_idx ON gmsgs (gid, id)',
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

// ---------- 1.28 مساعد الطعام بالذكاء الاصطناعي (Gemini) — المفتاح سرّ على الخادم فقط (env.GEMINI_API_KEY) ولا يصل للمتصفح أبداً
const AI = { model: 'gemini-2.5-flash-lite', fallback: 'gemini-3.5-flash-lite',      // طلب المالك 2.5؛ وغوغل لا تتيحه للحسابات الجديدة (404) فيُستعمل البديل الذي توصي به تلقائياً
  perDay: 40, demoPerDay: 150, demoIpPerDay: 40, img: 1200000, text: 600, timeout: 28000, budget: 45000, cacheDays: 30, cool: {} };
const AI_BASE = 'أنت مساعد تغذية داخل تطبيق «زنها» العربي. اكتب بالعربية الفصحى البسيطة القصيرة التي يفهمها أي شخص، وكل نقطة في القوائم جملة قصيرة واحدة (نحو 15 كلمة أو أقل). القيم الغذائية تقديرية دائماً؛ لا تدّعِ الدقة. لا تشخّص أمراضاً ولا تصف علاجاً. أعد JSON فقط بالمفاتيح المطلوبة.';
// 1.56 تقييم المكملات — الجدول المرجعي (اعتمده المالك 2026-11-27؛ يعمل حيث env.AI_SUPP='1': hissati وhissati-preview).
// [المكمّل، المدى المعتاد للبالغين، الحد الأعلى الآمن، درجة الدليل وفق AIS (أ قوي/ب ناشئ/ج ضعيف/د خطِر)، الفوائد المثبتة، تحذيرات، المصدر، التوقيت والتعارض مع الطعام]
export const SUPP_REF = [
  ['فيتامين د (D3 أفضل من D2)', '600–800 وحدة يومياً (15–20 ميكروجرام)؛ جرعات العلاج من النقص بإشراف طبي', '4000 وحدة يومياً (100 ميكروجرام)', 'أ عند النقص', 'صحة العظام وامتصاص الكالسيوم عند من لديه نقص؛ لم يثبت أنه يمنع أمراض القلب أو السرطان عند غير الناقصين', 'الزيادة تسبب ارتفاع الكالسيوم؛ حذر مع حصوات الكلى وبعض مدرات البول؛ يُفضّل قياس المستوى بالتحليل', 'NIH ODS؛ IOM 2011', 'مع أكبر وجبة فيها دهون (أي وقت من اليوم) لأنه يذوب في الدهون؛ لا تعارض غذائي مهم'],
  ['أوميجا 3 (EPA+DHA)', '250–500 ملجم EPA+DHA يومياً للصحة العامة؛ 1–4 جرام لارتفاع الدهون الثلاثية بإشراف طبي', 'حتى 5 جرام EPA+DHA يومياً آمن (EFSA)', 'أ لخفض الدهون الثلاثية، ج للوقاية العامة من أمراض القلب', 'خفض الدهون الثلاثية؛ الأكل الغني بالسمك مرتبط بصحة القلب، ونتائج الكبسولات للوقاية متباينة', 'حذر مع مميعات الدم (الوارفارين)؛ الجرعات العالية قد ترفع خطر الرجفان الأذيني؛ حساسية الأسماك؛ المهم كمية EPA+DHA لا وزن زيت السمك', 'NIH ODS؛ EFSA 2012', 'مع وجبة فيها دهون لتحسين الامتصاص وتقليل الطعم والارتجاع؛ يمكن تقسيم الجرعة؛ لا تعارض غذائي مهم'],
  ['الكرياتين مونوهيدرات', '3–5 جرام يومياً؛ أو تحميل 0.3 جم/كجم يومياً لـ5–7 أيام ثم 3–5 جرام', 'آمن حتى 30 جرام يومياً لسنوات قصيرة عند الأصحاء (ISSN)؛ لا حاجة لأكثر من 5 جرام', 'أ', 'زيادة القوة والأداء في المجهود القصير العالي، وزيادة الكتلة العضلية مع تمارين المقاومة؛ تظهر الفائدة خلال 3–4 أسابيع بلا تحميل', 'زيادة وزن 1–2 كجم ماء؛ تجنّبه مع أمراض الكلى إلا بإذن الطبيب؛ لا داعي لأنواع أغلى من المونوهيدرات', 'ISSN 2017 (Kreider)؛ AIS', 'أي وقت يومياً بانتظام (الاستمرار أهم من التوقيت)، ويمكن بعد التمرين مع وجبة فيها كربوهيدرات وبروتين؛ اشرب ماءً كافياً'],
  ['بروتين الواي / مساحيق البروتين', '20–40 جرام في الوجبة (0.25–0.4 جم/كجم)؛ إجمالي اليوم 1.4–2 جم/كجم للرياضيين من الأكل والمكمل معاً', 'لا حد محدد؛ الزيادة فوق الحاجة لا تفيد', 'أ (غذاء رياضي)', 'وسيلة سهلة لإكمال احتياج البروتين وبناء العضل مع التمرين؛ لا تفوق الأكل إن كان البروتين كافياً', 'أمراض الكلى؛ حساسية الحليب أو اللاكتوز؛ اختر منتجاً بشهادة فحص مستقل', 'ISSN 2017 (Jäger)؛ AIS', 'بعد التمرين أو بين الوجبات لإكمال الاحتياج؛ لا تعارض غذائي مهم؛ تجنّبه مع حساسية الحليب'],
  ['الكافيين', '3–6 ملجم/كجم قبل التمرين بنحو 60 دقيقة', '400 ملجم يومياً للبالغين الأصحاء؛ 200 ملجم للحامل', 'أ', 'تحسين الأداء في التحمل والمجهود العالي وتقليل الإحساس بالتعب', 'أرق وقلق وخفقان وارتفاع ضغط؛ احسب القهوة والشاي ومشروبات الطاقة معاً', 'ISSN 2021؛ EFSA 2015', 'قبل التمرين بـ30–60 دقيقة، وتجنّبه قبل النوم بنحو 6 ساعات؛ يقلل امتصاص الحديد إذا أُخذ معه'],
  ['المغنيسيوم', '310–420 ملجم يومياً من الأكل والمكمل', '350 ملجم يومياً من المكملات وحدها', 'أ عند النقص، ج للنوم والتشنجات', 'تصحيح النقص؛ الدليل على تحسين النوم أو منع التشنجات ضعيف', 'إسهال مع الجرعات العالية؛ حذر مع أمراض الكلى', 'NIH ODS؛ IOM', 'مع الطعام أو مساءً لتقليل اضطراب المعدة؛ افصله نحو ساعتين عن جرعات الكالسيوم والزنك العالية'],
  ['الحديد', '8 ملجم للرجال، 18 ملجم للنساء 19–50، 27 ملجم للحامل (من الأكل والمكمل)', '45 ملجم يومياً حديد عنصري', 'أ عند النقص المثبت', 'علاج نقص الحديد والأنيميا الناتجة عنه بعد التحليل (الفيريتين)', 'لا تأخذه بلا تحليل؛ بعيداً عن الشاي والقهوة والكالسيوم ومع فيتامين ج؛ إمساك؛ خطِر على الأطفال إن ابتلعوه', 'NIH ODS؛ AIS', 'على معدة فارغة أو مع قليل من الطعام إن سبب اضطراباً، مع فيتامين ج أو عصير برتقال؛ افصله ساعتين على الأقل عن الشاي والقهوة والحليب ومنتجات الألبان ومكملات الكالسيوم والنخالة'],
  ['الزنك', '8 ملجم للنساء، 11 ملجم للرجال', '40 ملجم يومياً', 'أ عند النقص، ب لتقصير نزلات البرد', 'تصحيح النقص؛ أقراص الاستحلاب قد تقصّر مدة البرد قليلاً', 'الاستعمال الطويل فوق الحد يسبب نقص النحاس', 'NIH ODS', 'قبل الأكل بساعة أو بعده بساعتين (مع الأكل إن سبب غثياناً)؛ الحبوب الكاملة والبقول (الفيتات) تقلل امتصاصه؛ افصله عن الحديد والكالسيوم'],
  ['فيتامين ب12', '2.4 ميكروجرام يومياً؛ جرعات أعلى آمنة عادةً للنباتيين وكبار السن ومستخدمي الميتفورمين', 'لا حد محدد', 'أ عند النقص', 'ضروري للنباتيين وضعاف الامتصاص؛ يصحح الأنيميا الناتجة عن نقصه', 'آمن غالباً؛ الأفضل التحليل عند الشك في النقص', 'NIH ODS', 'أي وقت ويُفضّل صباحاً؛ لا تعارض غذائي مهم'],
  ['الكالسيوم', '1000–1200 ملجم يومياً من الأكل والمكمل؛ لا تزيد الجرعة الواحدة عن 500 ملجم', '2500 ملجم (19–50 سنة)، 2000 ملجم (51 فأكثر)', 'أ عند قلة الألبان', 'صحة العظام عند من لا يأخذ كفايته من الأكل', 'حصوات الكلى، إمساك؛ يقلل امتصاص الحديد', 'NIH ODS', 'كربونات الكالسيوم مع الطعام، والسترات في أي وقت؛ لا تزد عن 500 ملجم في المرة؛ افصله عن الحديد والزنك؛ السبانخ والنخالة تقلل امتصاصه'],
  ['فيتامين ج', '75 ملجم للنساء، 90 ملجم للرجال', '2000 ملجم يومياً', 'ج للوقاية من البرد', 'تصحيح النقص؛ قد يقصّر مدة البرد قليلاً مع الاستعمال المنتظم، ولا يمنعه', 'الجرعات العالية تسبب إسهالاً وحصوات عند المعرّضين', 'NIH ODS', 'أي وقت، ومع الطعام إن سبب حموضة؛ يزيد امتصاص الحديد من الأكل النباتي'],
  ['الفيتامينات المتعددة', 'جرعات قريبة من الاحتياج اليومي (نحو 100% من القيمة اليومية)', 'انتبه لأي مكوّن فوق حده الأعلى', 'ب', 'مفيدة لمن يأكل قليلاً أو بأنظمة مقيدة؛ لا فائدة مثبتة لمن غذاؤه متوازن', 'الجرعات الضخمة غير مفيدة وقد تضر (فيتامين أ، الحديد)', 'NIH ODS؛ AIS', 'مع وجبة (الإفطار أو الغداء) لتحسين امتصاص الفيتامينات الذائبة في الدهون؛ افصلها عن الشاي والقهوة إن احتوت حديداً'],
  ['بيتا ألانين', '3.2–6.4 جرام يومياً مقسمة (نحو 65 ملجم/كجم) لمدة 2–4 أسابيع على الأقل', 'لا حد محدد؛ التنميل يزيد مع الجرعة الكبيرة', 'أ', 'تحسين الأداء في المجهود العالي الذي يستمر 1–4 دقائق', 'تنميل في الجلد مؤقت وغير ضار؛ قسّم الجرعة', 'ISSN 2015؛ AIS', 'جرعات مقسمة مع الوجبات على مدار اليوم لتقليل التنميل؛ التوقيت حول التمرين غير ضروري'],
  ['عصير الشمندر / النترات', '6–8 مليمول نترات (نحو 350–500 ملجم) قبل التمرين بـ2–3 ساعات', 'لا حد محدد للعصير الطبيعي', 'أ', 'تحسين التحمل وكفاءة استهلاك الأكسجين', 'قد يغيّر لون البول؛ لا تستعمل غسول الفم المطهّر معه', 'AIS', 'قبل التمرين بـ2–3 ساعات'],
  ['الكولاجين', '10–15 جرام مع فيتامين ج قبل النشاط بـ30–60 دقيقة', 'لا حد محدد', 'ب', 'دليل ناشئ لصحة الأوتار والمفاصل؛ ليس مصدراً جيداً لبناء العضل', 'بروتين غير كامل؛ لا يغني عن البروتين العادي', 'AIS', 'قبل النشاط بـ30–60 دقيقة مع مصدر لفيتامين ج'],
  ['الأحماض الأمينية المتفرعة BCAA', '—', '—', 'ج', 'لا فائدة إضافية إن كان البروتين اليومي كافياً', 'الأفضل إنفاق ثمنها على بروتين كامل', 'ISSN؛ AIS', '—'],
  ['البيوتين', '30 ميكروجرام يومياً', 'لا حد محدد', 'ج للشعر والأظافر', 'لا دليل كافٍ على تقوية الشعر عند غير الناقصين', 'الجرعات العالية تُفسد نتائج تحاليل (الغدة الدرقية، إنزيمات القلب): أخبر الطبيب قبل التحليل', 'FDA 2019؛ NIH ODS', 'مع الطعام؛ أخبر الطبيب والمختبر قبل أي تحليل دم وقد يُطلب إيقافه قبلها بأيام'],
  ['حارقات الدهون ومنشطات الهرمونات', '—', '—', 'د', 'لا فائدة مثبتة تُذكر', 'خطر تلوث بمواد محظورة أو ضارة بالقلب والكبد؛ تجنّبها', 'AIS (المجموعة د)؛ FDA', '—']
];
const SUPP_TXT = SUPP_REF.map((r) => '- ' + r[0] + ': المدى ' + r[1] + '؛ الحد الأعلى ' + r[2] + '؛ الدليل ' + r[3] + '؛ الفوائد ' + r[4] + '؛ تحذيرات ' + r[5] + '؛ التوقيت والطعام ' + r[7] + ' (' + r[6] + ')').join('\n');
// 1.57 قسم الأعشاب — الجدول المرجعي (اعتمده المالك 2026-11-27؛ يعمل حيث env.AI_HERB='1': hissati وhissati-preview).
// [العشب، الاسم العلمي، الاستعمال والكمية المعتادة، درجة الدليل (أ قوي/ب متوسط/ج محدود أو تقليدي)، الفائدة المحتملة، تحذيرات وتداخلات، تجنّبه إذا، المصدر]
export { aiSchema };
export const HERB_REF = [
  ['النعناع', 'Mentha × piperita', 'شاي: 1–2 ملعقة صغيرة أوراق مجففة لكوب ماء مغلي، حتى 3 مرات يومياً؛ كبسولات زيت النعناع المغلفة للقولون بإشراف', 'ب لزيت النعناع في القولون العصبي، ج للشاي', 'زيت النعناع المغلف يخفف أعراض القولون العصبي (ألم وانتفاخ)؛ الشاي مستعمل تقليدياً لعسر الهضم', 'قد يزيد الحرقة والارتجاع', 'ارتجاع المريء الشديد؛ الزيت العطري للرضع والأطفال الصغار', 'NCCIH؛ EMA'],
  ['البابونج', 'Matricaria chamomilla', 'شاي: 1–3 جرام زهور مجففة لكوب، 3–4 مرات يومياً', 'ج', 'مستعمل تقليدياً للاسترخاء والهضم؛ دليل محدود على تحسين النوم والقلق الخفيف', 'حساسية لمن يتحسس من نباتات الفصيلة النجمية (الأقحوان)؛ قد يتداخل مع مميعات الدم (الوارفارين)', 'حساسية الأقحوان؛ مع الوارفارين إلا بإذن الطبيب', 'NCCIH؛ EMA'],
  ['الينسون (اليانسون)', 'Pimpinella anisum', 'شاي: 1–3.5 جرام بذور مهروسة لكوب، حتى 3 مرات يومياً', 'ج', 'مستعمل تقليدياً للانتفاخ والتقلصات الهضمية الخفيفة', 'حساسية؛ الزيت العطري المركز لا يُشرب', 'جرعات علاجية في الحمل والرضاعة بلا استشارة', 'EMA'],
  ['الشمر', 'Foeniculum vulgare', 'شاي: 1.5–2.5 جرام بذور مهروسة لكوب، حتى 3 مرات يومياً', 'ج', 'مستعمل تقليدياً للانتفاخ والمغص الهضمي الخفيف', 'يحتوي الإستراجول: لا يُنصح بالاستعمال الطويل', 'الحمل والرضاعة والرضّع إلا باستشارة', 'EMA (HMPC)'],
  ['الزنجبيل', 'Zingiber officinale', '1–2 جرام يومياً (طازجاً أو مجففاً) للغثيان؛ كتوابل في الطعام', 'ب للغثيان', 'يخفف الغثيان، ومنه غثيان الحمل الخفيف ودوار الحركة', 'حرقة واضطراب معدة؛ الجرعات الكبيرة قد تزيد النزيف مع مميعات الدم', 'مكملات الزنجبيل في الحمل بلا استشارة؛ قبل الجراحة', 'NCCIH'],
  ['القرفة', 'Cinnamomum (كاسيا وسيلاني)', 'كتوابل في الطعام (نحو نصف إلى ملعقة صغيرة يومياً)', 'ج', 'نتائج متباينة وصغيرة على سكر الدم؛ لا تغني عن علاج السكري', 'القرفة الكاسيا غنية بالكومارين وقد تضر الكبد بكميات كبيرة ومستمرة؛ مع أدوية السكر قد ينخفض السكر', 'أمراض الكبد؛ الإكثار اليومي من الكاسيا', 'NCCIH؛ EFSA (الكومارين)'],
  ['الكركم', 'Curcuma longa', 'كتوابل في الطعام؛ مكملات الكركمين بجرعات الدراسات بإشراف', 'ج', 'دليل محدود على تخفيف آلام المفاصل', 'مكملات الكركم المركزة ارتبطت بحالات أذى للكبد؛ مع مميعات الدم', 'حصوات المرارة؛ أمراض الكبد؛ مع الوارفارين؛ المكملات في الحمل', 'NCCIH'],
  ['الحلبة', 'Trigonella foenum-graecum', 'منقوع البذور أو في الطعام؛ الدراسات استعملت 5–25 جرام بذور يومياً', 'ج', 'دليل محدود على خفض سكر الدم وزيادة إدرار الحليب', 'قد تخفض السكر مع أدوية السكري؛ حساسية لمن يتحسس من الفول السوداني والحمص؛ رائحة العرق والبول', 'الحمل (قد تحفّز الانقباضات)؛ مع أدوية السكر بلا متابعة', 'NCCIH'],
  ['حبة البركة', 'Nigella sativa', 'نصف إلى ملعقة صغيرة بذور يومياً؛ الدراسات استعملت 1–3 جرام', 'ج', 'دليل ناشئ لتحسن بسيط في الضغط والدهون وسكر الدم', 'قد تخفض الضغط والسكر مع الأدوية؛ تقارير قليلة عن أذى الكلى بجرعات كبيرة', 'جرعات كبيرة في الحمل؛ أمراض الكلى', 'مراجعات منهجية؛ NIH'],
  ['الميرمية', 'Salvia officinalis', 'شاي خفيف: 1–2 جرام أوراق لكوب، لفترات قصيرة', 'ج', 'دليل محدود لتخفيف هبات الحرارة؛ مستعملة تقليدياً للهضم والتهاب الحلق (غرغرة)', 'تحتوي الثوجون: لا للاستعمال الطويل بجرعات كبيرة ولا للزيت العطري', 'الحمل؛ الرضاعة (قد تقلل الحليب)؛ الصرع', 'EMA'],
  ['الزعتر', 'Thymus vulgaris', 'شاي: 1–2 جرام لكوب، حتى 3 مرات يومياً؛ كتوابل', 'ج', 'مستعمل تقليدياً لتخفيف السعال المصاحب للبرد', 'الزيت العطري غير المخفف خطِر عند شربه؛ حساسية', 'حساسية للفصيلة الشفوية (النعناع والمردقوش)', 'EMA'],
  ['الكركديه', 'Hibiscus sabdariffa', '1–3 أكواب يومياً من المنقوع', 'ب لخفض بسيط في الضغط', 'خفض بسيط في ضغط الدم عند من لديه ارتفاع خفيف', 'قد يزيد خفض الضغط مع أدوية الضغط؛ يتداخل مع بعض الأدوية (مثل الهيدروكلوروثيازيد)', 'الحمل؛ ضغط منخفض؛ مع أدوية الضغط بلا متابعة', 'مراجعات منهجية'],
  ['العرقسوس', 'Glycyrrhiza glabra', 'كمشروب بكميات معتدلة ولفترات قصيرة', 'ج', 'مستعمل تقليدياً للهضم والسعال؛ دليل محدود', 'الإكثار يرفع الضغط ويخفض البوتاسيوم؛ يتداخل مع أدوية الضغط والمدرات والديجوكسين', 'ارتفاع الضغط؛ أمراض القلب والكلى؛ الحمل', 'NCCIH؛ EMA'],
  ['الجنكة', 'Ginkgo biloba', 'مكملات مقننة فقط (لا تؤكل البذور)', 'ج', 'لم يثبت أنها تحسّن الذاكرة أو تمنع الخرف', 'تزيد خطر النزيف مع مميعات الدم والأسبرين؛ البذور النيئة سامة', 'مع المميعات؛ قبل الجراحة؛ الصرع؛ الحمل', 'NCCIH'],
  ['الجنسنج', 'Panax ginseng', 'مكملات مقننة لفترات قصيرة', 'ج', 'دليل محدود على تحسين الطاقة والتركيز', 'أرق وصداع وارتفاع ضغط؛ يتداخل مع الوارفارين وأدوية السكر', 'الحمل والرضاعة؛ ارتفاع الضغط غير المنضبط', 'NCCIH'],
  ['الشاي الأخضر', 'Camellia sinensis', '3–5 أكواب يومياً من المشروب آمنة للبالغين', 'ج', 'أثر ضئيل على الوزن؛ مصدر لمضادات الأكسدة', 'مستخلص الشاي الأخضر المركز ارتبط بأذى الكبد؛ فيه كافيين؛ يقلل امتصاص الحديد', 'أمراض الكبد (للمستخلص)؛ الحمل (احسب الكافيين)؛ فقر الدم (افصله عن الأكل)', 'NCCIH؛ EFSA 2018'],
  ['المورينجا', 'Moringa oleifera', 'الأوراق كغذاء أو مسحوقها بكميات معتدلة', 'ج', 'الأوراق مغذية؛ أدلة محدودة على سكر الدم', 'قد تخفض السكر والضغط مع الأدوية؛ الجذور واللحاء لا تؤكل', 'الحمل (الجذر واللحاء)؛ مع أدوية السكر بلا متابعة', 'مراجعات منهجية'],
  ['السنامكي', 'Senna alexandrina', 'ملين قصير المدى لا يزيد عن أسبوع وبالجرعة المذكورة على العبوة', 'أ كملين قصير المدى', 'ملين منبّه فعّال للإمساك العارض', 'الاستعمال الطويل يسبب الاعتماد ونقص البوتاسيوم؛ مغص وإسهال', 'الأطفال دون 12 سنة؛ الحمل والرضاعة بلا استشارة؛ انسداد أو التهاب الأمعاء', 'EMA؛ FDA'],
  ['الثوم', 'Allium sativum', 'في الطعام؛ المكملات بإشراف', 'ج', 'أثر بسيط على الضغط والكوليسترول', 'مكملات الثوم تزيد النزيف مع المميعات؛ تقلل فاعلية بعض أدوية فيروس نقص المناعة', 'قبل الجراحة؛ مع المميعات (للمكملات)', 'NCCIH'],
  ['إكليل الجبل (الروزماري)', 'Salvia rosmarinus', 'كتوابل أو شاي خفيف', 'ج', 'مستعمل تقليدياً للهضم؛ أدلة محدودة', 'الزيت العطري بجرعات كبيرة خطِر', 'الصرع؛ جرعات علاجية في الحمل', 'EMA'],
  ['الكمون', 'Cuminum cyminum', 'كتوابل في الطعام', 'ج', 'دليل محدود على تخفيف الانتفاخ والقولون العصبي', 'آمن بكميات الطعام؛ قد يخفض السكر مع الأدوية بجرعات كبيرة', '—', 'مراجعات منهجية']
];
const HERB_TXT = HERB_REF.map((r) => '- ' + r[0] + ' (' + r[1] + '): الاستعمال ' + r[2] + '؛ الدليل ' + r[3] + '؛ الفائدة المحتملة ' + r[4] + '؛ تحذيرات وتداخلات ' + r[5] + '؛ تجنّبه إذا ' + r[6] + ' (' + r[7] + ')').join('\n');
const AI_P = {
  text: 'حلّل وصف الوجبة التالي. قسّمه إلى أصناف، وقدّر الحصة لكل صنف بوحدة منزلية مألوفة وبالجرام، وسعراته وبروتينه وكربوهيدراته ودهونه بالجرام، ثم المجموع. كل القيم أرقام فقط بلا وحدات. إن لم يكن الوصف طعاماً أو كان غير مفهوم فاجعل ok=false واذكر السبب في reason. أعد: {"ok":bool,"reason":"","title":"اسم قصير للوجبة","items":[{"name":"","portion":"","grams":0,"kcal":0,"p":0,"c":0,"f":0}],"total":{"kcal":0,"p":0,"c":0,"f":0},"confidence":"high|medium|low","note":"ملاحظة قصيرة عن دقة التقدير"}',
  photo: 'في الصورة وجبة. تعرّف على الأطعمة الظاهرة، وقدّر حجم كل حصة بوحدة منزلية وبالجرام، وسعراتها وبروتينها وكربوهيدراتها ودهونها، ثم المجموع. التقدير من الصورة تقريبي: الزيت والصلصات المخفية والحجم الحقيقي قد تختلف، فاجعل confidence منخفضة أو متوسطة واذكر ذلك في note. إن لم تكن في الصورة أطعمة أو كانت غير واضحة فاجعل ok=false واذكر السبب في reason. أعد: {"ok":bool,"reason":"","title":"","items":[{"name":"","portion":"","grams":0,"kcal":0,"p":0,"c":0,"f":0}],"total":{"kcal":0,"p":0,"c":0,"f":0},"confidence":"high|medium|low","note":""}',
  label: 'الصورة لملصق المعلومات الغذائية لمنتج. اقرأ فقط ما هو مكتوب فعلاً على الملصق؛ ما لا يظهر اجعله null ولا تخمّنه. القيم لكل حصة كما على الملصق، أرقاماً فقط بلا وحدات (الجرام للدهون والكربوهيدرات والسكر والبروتين والألياف، والملليجرام للصوديوم والكوليسترول). ثم قيّم المنتج بناءً على الملصق وحده: rating = "healthy" (خيار صحي) أو "moderate" (معتدل) أو "occasional" (للمناسبات فقط)، مع إيجابيات ومخاوف وأسباب مرتبطة بأرقام الملصق ومكوناته (مثل الدهون المتحولة، الصوديوم المرتفع، السكر المضاف، الدهون المشبعة، المواد المضافة)، وبدائل أصح من نفس النوع، ونصائح عملية. لا تذكر ادعاءً صحياً لا يدعمه الملصق. إن لم تكن الصورة ملصقاً غذائياً مقروءاً فاجعل ok=false واذكر السبب. أعد: {"ok":bool,"reason":"","product":"","serving":"","servings":null,"per":{"kcal":null,"fat":null,"satFat":null,"transFat":null,"chol":null,"sodium":null,"carbs":null,"fiber":null,"sugars":null,"addedSugars":null,"protein":null},"ingredients":[""],"assessment":{"rating":"healthy|moderate|occasional","summary":"","positives":[""],"concerns":[""],"reasons":[""],"alternatives":[""],"tips":[""]}}',
  store: 'الصورة لطعام. تعرّف عليه وأعط إرشادات تخزين وسلامة عملية وفق إرشادات سلامة الغذاء المعتمدة (مثل USDA وFDA): أين يُحفظ (ثلاجة 4°م أو أقل، فريزر -18°م، أو خارجها)، ودرجة الحرارة، والمدة الآمنة في الثلاجة والفريزر وخارج التبريد، وطريقة التخزين، وعلامات الفساد، وعلامات أنه لم يعد آمناً، ونصائح التعامل والطهي الآمن (مثل درجة حرارة الطهي الداخلية). لا تحكم بأن الطعام في الصورة آمن أو فاسد من الشكل وحده، واذكر في note أن السلامة لا تُؤكد من صورة، وأن الشك يعني التخلص منه. إن لم تكن في الصورة أطعمة فاجعل ok=false. أعد: {"ok":bool,"reason":"","food":"","category":"","place":"fridge|freezer|pantry|mixed","temp":"","fridge":"","freezer":"","room":"","howTo":[""],"spoilSigns":[""],"unsafeSigns":[""],"handling":[""],"note":""}',
  supp: 'المطلوب تقييم مكمّل غذائي (من صورة ملصق «Supplement Facts» أو من وصف المستخدم). اقرأ المكونات وكمياتها وأشكالها كما هي (مثل D3، EPA وDHA، كرياتين مونوهيدرات). قارن كل مكوّن بالجدول المرجعي التالي وحده عند وجوده؛ وإن لم يكن في الجدول فاذكر أن تقديرك عام. اكتب: ما هو المكمّل، فوائده المثبتة علمياً، والفوائد التي يُروَّج لها بلا دليل كافٍ، ومن يستفيد منه فعلاً ومن لا يحتاجه، ومتى تظهر الفائدة، والجرعة المناسبة المعتادة للبالغين (dose، من الجدول عند وجوده، مع ذكر أن الجرعات العلاجية الأعلى بإشراف طبي)، والتوقيت المناسب لأخذه (timing: صباحاً أو مساءً، قبل الأكل أو معه أو بعده، وقبل التمرين أو بعده إن لزم)، والتعارض مع الطعام والمشروبات والمكملات الأخرى (food: ما يقلل امتصاصه وما يحسّنه وما يجب فصله عنه وبكم ساعة)، ودرجة الدليل (A قوي، B ناشئ، C ضعيف، D خطِر أو محظور)، وحكم الجرعة لكل مكوّن مقارنة بالمدى والحد الأعلى (low أقل من الفعّال، ok ضمن المدى، high فوق الحد الآمن، unknown)، والتحذيرات والتداخلات، وعلامات الجودة الظاهرة على العبوة (مثل NSF أو Informed Sport) أو غيابها، وبدائل من الطعام. في proven ضع فقط ما وُصف في الجدول المرجعي بأنه مثبت لهذا المكمّل؛ وما وُصف بأنه متباين أو ضعيف أو غير مثبت ضعه في claimed. لا تنصح بجرعة أعلى من الحد الأعلى، ولا تَعِد بعلاج. إن كتب المستخدم الاسم فقط بلا جرعة فاذكر الجرعة المعتادة في dose ولا تحكم على جرعة منتج لم تره (verdict = unknown). إن لم يكن مكمّلاً غذائياً فاجعل ok=false.\nالجدول المرجعي:\n' + SUPP_TXT + '\nأعد: {"ok":bool,"reason":"","product":"","kind":"vitamin|mineral|omega3|sports|protein|herbal|multi|other","serving":"","items":[{"name":"","amount":"","form":"","usual":"","upper":"","verdict":"low|ok|high|unknown","note":""}],"grade":"A|B|C|D","gradeWhy":"","summary":"","proven":[""],"claimed":[""],"who":[""],"notNeeded":[""],"onset":"","dose":"","timing":[""],"food":[""],"howTo":[""],"cautions":[""],"quality":[""],"foods":[""]}',
  herb: 'المطلوب التعرف على عشب أو نبات طبي (من صورة أو من اسم كتبه المستخدم) وشرح فائدته المحتملة واستعماله الآمن. إن كانت صورة: تعرّف على العشب واذكر ثقتك (confidence: high فقط إن كان واضحاً جداً، وإلا medium أو low)، واذكر النباتات التي قد تشبهه (lookalikes) خاصة السامة منها. قارن بالجدول المرجعي التالي وحده عند وجود العشب فيه؛ وإن لم يكن فيه فاذكر أن المعلومات عامة. اكتب: الاسم العربي والعلمي، والاستعمالات التقليدية، والفائدة المحتملة المدعومة علمياً (proven: فقط ما في الجدول بدليل أ أو ب، أو ما يُذكر أنه مثبت)، وما يُروَّج له بلا دليل كافٍ (claimed)، ودرجة الدليل (A قوي، B متوسط، C محدود أو تقليدي، D غير آمن)، وطريقة الاستعمال والكمية المعتادة (dose)، والتوقيت المناسب (timing)، وأقصى مدة استعمال إن وُجدت (maxDuration)، والتعارض مع الطعام والمشروبات (food)، والتداخل مع الأدوية (drugs)، ومن يجب أن يتجنّبه (avoidIf، مثل الحمل والرضاعة والأطفال والأمراض المزمنة)، وتحذيرات أخرى (cautions). لا تَعِد بعلاج مرض، ولا تنصح بالزيوت العطرية للشرب. إن لم يكن في الصورة نبات أو عشب فاجعل ok=false.\nالجدول المرجعي:\n' + HERB_TXT + '\nأعد: {"ok":bool,"reason":"","name":"","sci":"","confidence":"high|medium|low","lookalikes":[""],"uses":[""],"proven":[""],"claimed":[""],"grade":"A|B|C|D","gradeWhy":"","summary":"","dose":"","timing":[""],"maxDuration":"","food":[""],"drugs":[""],"avoidIf":[""],"cautions":[""]}'
};
const aiF = (v) => { if (typeof v === 'number') return v; const m = String(v == null ? '' : v).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace('٫', '.').replace(',', '.').match(/\d+(\.\d+)?/); return m ? +m[0] : NaN; };      // «12g» أو «640 ملجم» أو «<1» → رقم
const aiNum = (v, mx) => { const f = aiF(v), n = Math.round((isNaN(f) ? 0 : f) * 10) / 10; return n > 0 ? Math.min(n, mx) : 0; };
const aiStr = (v, mx) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, mx || 200);
const aiArr = (v, n, mx) => (Array.isArray(v) ? v : []).map((x) => aiStr(x, mx || 220)).filter(Boolean).slice(0, n || 8);
const aiNul = (v, mx) => { if (v === null || v === undefined || v === '') return null; const f = aiF(v); return isNaN(f) ? null : Math.min(Math.max(0, Math.round(f * 10) / 10), mx); };
function aiClean(mode, o, J) {                                        // لا يُعاد للتطبيق إلا ما نعرفه بحدود معقولة
  if (!o || typeof o !== 'object') return { ok: false, reason: 'تعذّر فهم الرد. حاول مرة أخرى.' };
  if (!o.ok) return { ok: false, reason: aiStr(o.reason, 240) || 'لم أتعرّف على طعام واضح. جرّب وصفاً أوضح أو صورة أقرب بإضاءة جيدة.' };
  if (mode === 'text' || mode === 'photo') {
    const items = (Array.isArray(o.items) ? o.items : []).slice(0, 15).map((x) => ({ name: aiStr(x.name, 80), portion: aiStr(x.portion, 60), grams: aiNum(x.grams, 3000), kcal: aiNum(x.kcal, 4000), p: aiNum(x.p, 300), c: aiNum(x.c, 600), f: aiNum(x.f, 300) })).filter((x) => x.name);
    if (!items.length) return { ok: false, reason: 'لم أتعرّف على أصناف طعام. جرّب مرة أخرى.' };
    const t = items.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
    Object.keys(t).forEach((k) => { t[k] = Math.round(t[k] * 10) / 10; });      // المجموع يُحسب هنا من الأصناف (لا يُؤخذ من النموذج) فيتطابق دائماً
    return { ok: true, title: aiStr(o.title, 80) || items.map((x) => x.name).join(' + ').slice(0, 80), items, total: t, confidence: ['high', 'medium', 'low'].includes(o.confidence) ? (mode === 'photo' && o.confidence === 'high' ? 'medium' : o.confidence) : 'medium', note: aiStr(o.note, 260) };
  }
  if (mode === 'label') {
    const P = o.per || {}, A = o.assessment || {};
    return { ok: true, product: aiStr(o.product, 80), serving: aiStr(o.serving, 60), servings: aiNul(o.servings, 200),
      per: { kcal: aiNul(P.kcal, 3000), fat: aiNul(P.fat, 300), satFat: aiNul(P.satFat, 300), transFat: aiNul(P.transFat, 100), chol: aiNul(P.chol, 3000), sodium: aiNul(P.sodium, 20000), carbs: aiNul(P.carbs, 600), fiber: aiNul(P.fiber, 200), sugars: aiNul(P.sugars, 600), addedSugars: aiNul(P.addedSugars, 600), protein: aiNul(P.protein, 300) },
      ingredients: aiArr(o.ingredients, 40, 80),
      assessment: { rating: ['healthy', 'moderate', 'occasional'].includes(A.rating) ? A.rating : 'moderate', summary: aiStr(A.summary, 300), positives: aiArr(A.positives, 6), concerns: aiArr(A.concerns, 6), reasons: aiArr(A.reasons, 6), alternatives: aiArr(A.alternatives, 5), tips: aiArr(A.tips, 5) } };
  }
  if (mode === 'supp') {
    const V = ['low', 'ok', 'high', 'unknown'];
    return { ok: true, product: aiStr(o.product, 80), kind: aiStr(o.kind, 20), serving: aiStr(o.serving, 60), grade: ['A', 'B', 'C', 'D'].includes(o.grade) ? o.grade : 'C', gradeWhy: aiStr(o.gradeWhy, 260), summary: aiStr(o.summary, 300),
      items: (Array.isArray(o.items) ? o.items : []).slice(0, 25).map((x) => ({ name: aiStr(x.name, 60), amount: aiStr(x.amount, 40), form: aiStr(x.form, 60), usual: aiStr(x.usual, 120), upper: aiStr(x.upper, 80), verdict: V.includes(x.verdict) ? x.verdict : 'unknown', note: aiStr(x.note, 200) })).filter((x) => x.name),
      ...(() => { const weak = /متباين|ناشئ|ضعيف|غير مثبت|محدود|غير كاف|غير مؤكد/, pv = aiArr(o.proven, 6); return { proven: pv.filter((x) => !weak.test(x)), emerging: pv.filter((x) => weak.test(x)), claimed: aiArr(o.claimed, 6) }; })(), /* ما يصف نفسه بأنه غير مثبت لا يُعرض «مثبتاً» */ who: aiArr(o.who, 6), notNeeded: aiArr(o.notNeeded, 5), onset: aiStr(o.onset, 160), dose: aiStr(o.dose, 300), timing: aiArr(o.timing, 6), food: aiArr(o.food, 8), howTo: aiArr(o.howTo, 6), cautions: aiArr(o.cautions, 8), quality: aiArr(o.quality, 4), foods: aiArr(o.foods, 5) };
  }
  if (mode === 'herb') {
    const weak = /متباين|ناشئ|ضعيف|غير مثبت|محدود|غير كاف|غير مؤكد|تقليدي/, pv = aiArr(o.proven, 6);
    return { ok: true, name: aiStr(o.name, 60), sci: aiStr(o.sci, 80), confidence: J.img ? (['high', 'medium', 'low'].includes(o.confidence) ? o.confidence : 'low') : 'high', fromImg: !!J.img, lookalikes: aiArr(o.lookalikes, 5),
      uses: aiArr(o.uses, 6), proven: pv.filter((x) => !weak.test(x)), emerging: pv.filter((x) => weak.test(x)).concat(aiArr(o.claimed, 6).filter((x) => /دليل (ناشئ|محدود)/.test(x))), claimed: aiArr(o.claimed, 6).filter((x) => !/دليل (ناشئ|محدود)/.test(x)), grade: ['A', 'B', 'C', 'D'].includes(o.grade) ? o.grade : 'C', gradeWhy: aiStr(o.gradeWhy, 260), summary: aiStr(o.summary, 300),
      dose: aiStr(o.dose, 300), timing: aiArr(o.timing, 5), maxDuration: aiStr(o.maxDuration, 160), food: aiArr(o.food, 6), drugs: aiArr(o.drugs, 8), avoidIf: aiArr(o.avoidIf, 8), cautions: aiArr(o.cautions, 8) };
  }
  return { ok: true, food: aiStr(o.food, 80), category: aiStr(o.category, 60), place: ['fridge', 'freezer', 'pantry', 'mixed'].includes(o.place) ? o.place : 'fridge', temp: aiStr(o.temp, 120), fridge: aiStr(o.fridge, 120), freezer: aiStr(o.freezer, 120), room: aiStr(o.room, 120),
    howTo: aiArr(o.howTo, 8), spoilSigns: aiArr(o.spoilSigns, 8), unsafeSigns: aiArr(o.unsafeSigns, 8), handling: aiArr(o.handling, 8), note: aiStr(o.note, 300) };
}
async function aiGc(env) { const db = env.DB; if (!db) return 0; const d = new Date(), t = d.toISOString().slice(0, 10), y = new Date(d - 864e5).toISOString().slice(0, 10); await run(db, "DELETE FROM kv WHERE k LIKE 'aic.%' AND CAST(substr(v, 1, 13) AS INTEGER) < ?", Date.now() - AI.cacheDays * 864e5); return run(db, "DELETE FROM kv WHERE k LIKE 'ai.%' AND k NOT LIKE ? AND k NOT LIKE ?", '%' + t + '%', '%' + y + '%'); }      // عدّادات الأيام السابقة تُحذف
const AI_SCH = {};
function aiSchema(mode) {                                            // 1.57: مخطط مُلزِم للرد (responseSchema) يُستخرج من قالب «أعد: {...}» في التعليمات — يمنع JSON المكسور
  if (AI_SCH[mode]) return AI_SCH[mode];
  const p = AI_P[mode], i = p.lastIndexOf('أعد: '); let ex; try { ex = JSON.parse(p.slice(i + 5).replace(/:bool/g, ':true')); } catch { return null; }
  const conv = (v) => v === null ? { type: 'NUMBER', nullable: true } : Array.isArray(v) ? { type: 'ARRAY', items: conv(v[0] === undefined ? '' : v[0]) } : typeof v === 'object' ? { type: 'OBJECT', properties: Object.fromEntries(Object.keys(v).map((k) => [k, conv(v[k])])), required: Object.keys(v) }      /* 1.58: كل المفاتيح مطلوبة (null مسموح) — وإلا كان Flash-Lite يحذف أرقام الملصق ويكتفي بالسعرات */ : typeof v === 'number' ? { type: 'NUMBER' } : typeof v === 'boolean' ? { type: 'BOOLEAN' } : /\|/.test(v) ? { type: 'STRING', enum: v.split('|') } : { type: 'STRING' };
  return (AI_SCH[mode] = conv(ex));
}
async function aiCount(db, k, lim) { const r = await one(db, 'SELECT v FROM kv WHERE k = ?', k), n = r ? +r.v || 0 : 0; if (n >= lim) return false; await run(db, 'INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, String(n + 1)); return true; }
async function aiFood(req, env, db, path, body, J) {
  const mode = String(J.mode || ''); if (!AI_P[mode]) return err(400, 'mode', 'نوع تحليل غير معروف');
  if (mode === 'supp' && env.AI_SUPP !== '1') return err(503, 'nosupp', 'تقييم المكملات قريباً');
  if (mode === 'herb' && env.AI_HERB !== '1') return err(503, 'noherb', 'قسم الأعشاب قريباً');      // 1.57: يُفعَّل بعد اعتماد المالك      // يُفعَّل بعد اعتماد المالك للجدول المرجعي
  const day = new Date().toISOString().slice(0, 10), demo = env.AI_DEMO === '1' && J.demo === 1, bench = demo && !!env.AI_BENCH && J.bench === env.AI_BENCH;      // bench: قياس الدقة على المعاينة فقط (سرّ AI_BENCH)
  if (demo && !bench) {                                           // بيئة المعاينة فقط: بلا حساب، بحد يومي عام وحد لكل عنوان
    const ip = req.headers.get('cf-connecting-ip') || 'x', ih = b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + day)))).slice(0, 16);
    if (!await aiCount(db, 'ai.demo.' + day, AI.demoPerDay) || !await aiCount(db, 'ai.ip.' + day + '.' + ih, AI.demoIpPerDay)) return err(429, 'ailimit', 'وصلت للحد اليومي للتجربة. حاول غداً.');
  } else if (!demo) {
    const a = await authed(req, db, path, body); if (a.e) return a.e; if (!a.who || a.who.role !== 'c') return err(403, 'role', 'متاح لحسابات العملاء فقط');
    if (!await aiCount(db, 'ai.' + a.id + '.' + day, AI.perDay)) return err(429, 'ailimit', 'وصلت للحد اليومي للمساعد (' + AI.perDay + ' تحليلاً). حاول غداً.');
  }
  let ut = '', img = '', mime = '', note = '';
  if (mode === 'text' || ((mode === 'supp' || mode === 'herb') && !J.img)) { const t = aiStr(J.text, AI.text); if (t.length < 2) return err(400, 'empty', mode === 'supp' ? 'اكتب اسم المكمّل وجرعته' : mode === 'herb' ? 'اكتب اسم العشب' : 'اكتب وصف وجبتك'); ut = (mode === 'supp' ? 'المكمّل كما وصفه المستخدم: ' : mode === 'herb' ? 'اسم العشب كما كتبه المستخدم: ' : 'الوصف: ') + t; }
  else {
    img = String(J.img || ''); mime = String(J.mime || 'image/jpeg');
    if (!/^image\/(jpeg|png|webp)$/.test(mime) || !img || img.length > AI.img || !/^[A-Za-z0-9+/=]+$/.test(img)) return err(400, 'img', 'الصورة غير صالحة أو كبيرة جداً');
    if (J.text) note = 'ملاحظة المستخدم: ' + aiStr(J.text, 200);
  }
  const route = env.AI_ROUTE === '1';
  let order = route ? String(env['AI_ORDER_' + mode.toUpperCase()] || '').split(',').map((x) => x.trim()).filter((x) => AI_PV[x]) : ['gl', 'gl'];      // بلا الموزّع: Gemini وحده بمحاولة ثانية (كما في 1.28)
  if (route && !order.length) order = AI_ORD[mode];
  if (bench && AI_PV[J.prov]) order = [J.prov];
  order = order.filter((p) => AI_PV[p].k === 'cf' ? !!(env.AI && env.AI.run) : !!env[AI_PV[p].key]);
  if (!order.length) return err(503, 'noai', 'المساعد الذكي غير مفعّل بعد');
  const ck = route && !(bench && J.nocache) ? 'aic.' + b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(mode + '|' + ut.replace(/\s+/g, ' ').trim().toLowerCase() + '|' + note + '|' + img)))).slice(0, 32) : '';
  if (ck) {                                                       // طبقة 0: نتيجة طلب مطابق (نفس النص بعد التطبيع أو نفس الصورة) خلال 30 يوماً — بلا أي بيانات عن العميل
    const h = await one(db, 'SELECT v FROM kv WHERE k = ?', ck), i = h ? h.v.indexOf('|') : -1;
    if (i > 0 && +h.v.slice(0, i) > Date.now() - AI.cacheDays * 864e5) { try { const o = JSON.parse(h.v.slice(i + 1)); await aiTick(db, 'cache', day); return json(Object.assign(o, { cached: 1 })); } catch { /* تالفة: تُعاد */ } }
  }
  const t0 = Date.now(); let best = null, busy = 0, cfg = 0, net = 0, why = '';
  for (let i = 0; i < order.length; i++) {
    const p = order[i]; if (route && (AI.cool[p] || 0) > Date.now() && order.slice(i + 1).some((x) => (AI.cool[x] || 0) <= Date.now())) continue;      // مشغول منذ قليل: يُتجاوز ما دام غيره متاحاً
    const left = AI.budget - (Date.now() - t0); if (left < 5000) break;
    let r; try { r = await aiCall(p, env, mode, ut, img, mime, note, Math.min(left, AI.timeout)); } catch { r = { st: 0 }; net = 1; }
    if (r.st === 429) { busy = 1; AI.cool[p] = Date.now() + 60000; if (!route) break; continue; }
    if (r.st === 400 || r.st === 401 || r.st === 403) cfg = 1;
    if (!r.o) continue;
    await aiTick(db, p, day);
    const c = aiClean(mode, r.o, J), g = route ? aiGuard(mode, c) : '';
    const out = Object.assign({ mode, est: true }, c, route ? { prov: p } : {}, img && AI_PV[p].k !== 'gem' ? { backup: 1 } : {});
    if (!g) { if (ck && c.ok) await run(db, 'INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', ck, Date.now() + '|' + JSON.stringify(out)); return json(out); }
    if (!best) best = out; why = g;                               // حارس الجودة رفضها: يُجرَّب المزوّد التالي، وتبقى هذه إن لم يوجد أفضل
  }
  if (best) return json(Object.assign(best, { guard: why }));
  if (busy) return err(429, 'aibusy', 'المساعد مشغول الآن. حاول بعد دقيقة.');
  if ((net || Date.now() - t0 >= AI.timeout) && !cfg) return err(504, 'aitime', 'استغرق التحليل وقتاً طويلاً. حاول مرة أخرى.');
  return err(502, 'aierr', cfg && !route ? 'تعذّر الاتصال بالمساعد (إعداد المفتاح).' : 'تعذّر التحليل الآن. حاول مرة أخرى.');
}
// 1.58 (المحطة 1.29) الموزّع: عدة مزوّدين بالتناوب حين env.AI_ROUTE='1' — المفاتيح أسرار على الخادم فقط
const AI_PV = {
  gl: { k: 'gem', key: 'GEMINI_API_KEY' },                                                  // Gemini Flash-Lite (الأساسي)
  gf: { k: 'gem', key: 'GEMINI_API_KEY', m: 'gemini-3.5-flash' },                          // Gemini Flash: حدّ يومي مستقل
  groq: { k: 'oai', key: 'GROQ_API_KEY', m: 'qwen/qwen3.8-27b', u: 'https://api.groq.com/openai/v1/chat/completions' },
  zai: { k: 'oai', key: 'ZAI_API_KEY', m: 'glm-4.6v-flash', u: 'https://api.z.ai/api/paas/v4/chat/completions' },
  cf: { k: 'cf', m: '@cf/meta/llama-4-scout-17b-16e-instruct' }                           // Workers AI داخل الحساب بلا مفتاح: آخر احتياط
};
// الترتيب لكل نوع من قياس الدقة على 22 حالة عربية (2026-11-27): Gemini أولاً دائماً (الأدق)، ثم الأفضل في كل نوع؛ Groq ثانياً (قارب Gemini)، ثم Cloudflare (Llama 4) ممتاز في الملصقات وصور الوجبات
// ويفشل في المكملات والأعشاب فلا يُستعمل فيها؛ وGemini Flash بطيء (~28 ث) فلا يُستعمل. يُغيَّر بلا كود: AI_ORDER_TEXT / _PHOTO / _LABEL / _STORE / _SUPP / _HERB
const AI_ORD = { text: ['gl', 'groq', 'cf', 'zai'], photo: ['gl', 'groq', 'cf', 'zai'], label: ['gl', 'groq', 'cf', 'zai'], store: ['gl', 'groq', 'cf', 'zai'], supp: ['gl', 'groq', 'zai'], herb: ['gl', 'groq', 'zai'] };      // Groq (Qwen 3.8) قارب Gemini في كل الأنواع؛ Z.ai الأضعف والأكثر انشغالاً فآخراً
export { AI_PV, AI_ORD };
async function aiTick(db, p, day) { const k = 'ai.p.' + day + '.' + p, r = await one(db, 'SELECT v FROM kv WHERE k = ?', k); await run(db, 'INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, String((r ? +r.v || 0 : 0) + 1)); }
export function aiJson(t) {                                          // رد نصي ← كائن: يحذف التفكير والأسوار، ويأخذ أول { إلى آخر }، ويصلح الفواصل الزائدة
  t = String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '').trim(); const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null; t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch { try { return JSON.parse(t.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"')); } catch { return null; } }
}
const AR = /[؀-ۿ]/;
export function aiGuard(mode, c) {                                   // حارس الجودة: '' = مقبول، وإلا سبب الرفض
  if (!c || !c.ok) return '';                                          // «ليس طعاماً / غير واضح» رد مشروع
  const en = (k, p, cb, f) => k > 60 && p + cb + f > 0 && Math.abs(k - (4 * p + 4 * cb + 9 * f)) / k > 0.3;
  if (mode === 'text' || mode === 'photo') { const t = c.total; if (en(t.kcal, t.p, t.c, t.f)) return 'energy'; return AR.test(c.title + c.items.map((x) => x.name).join('')) ? '' : 'lang'; }
  if (mode === 'label') { const p = c.per, A = c.assessment; if (p.satFat != null && p.fat != null && p.satFat > p.fat + 0.5) return 'sat'; if (p.sugars != null && p.carbs != null && p.sugars > p.carbs + 0.5) return 'sugar'; if (p.kcal == null && p.protein == null && p.carbs == null && p.fat == null) return 'empty'; if (p.kcal != null && p.protein != null && p.carbs != null && p.fat != null && en(p.kcal, p.protein, p.carbs, p.fat)) return 'energy'; return AR.test(A.summary + A.positives.join('') + A.concerns.join('')) ? '' : 'lang'; }
  return AR.test(mode === 'store' ? c.food + c.howTo.join('') : mode === 'supp' ? c.summary + c.product + c.items.map((x) => x.note).join('') : c.summary + c.name) ? '' : 'lang';
}
async function aiCall(p, env, mode, ut, img, mime, note, ms) {
  const P = AI_PV[p], prompt = AI_BASE + '\n\n' + AI_P[mode], ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms);
  try {
    if (P.k === 'gem') {
      const parts = [{ text: prompt }]; if (ut) parts.push({ text: ut }); if (img) parts.push({ inline_data: { mime_type: mime, data: img } }); if (note) parts.push({ text: note });
      const sch = aiSchema(mode), mk = (th) => JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: Object.assign({ temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 8192 }, sch ? { responseSchema: sch } : {}, th ? { thinkingConfig: { thinkingLevel: 'low' } } : {}) });
      const go = (m, th) => fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent', { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: mk(th) });
      const m = P.m || (AI.dead && !env.AI_MODEL ? AI.fallback : env.AI_MODEL || AI.model); let r = await go(m, !!P.m);      // Flash: تفكير قليل وإلا تجاوز المهلة
      if (P.m && r.status === 400) r = await go(m, 0);
      if (!P.m && r.status === 404 && AI.fallback && m !== AI.fallback) { AI.dead = 1; r = await go(AI.fallback); }      // 2.5 غير متاح للحسابات الجديدة
      if (!r.ok) return { st: r.status };
      const g = await r.json().catch(() => null), c0 = g && g.candidates && g.candidates[0];
      return { st: 200, o: aiJson(c0 && c0.content ? (c0.content.parts || []).filter((x) => !x.thought).map((x) => x.text || '').join('') : '') };
    }
    const content = [{ type: 'text', text: prompt + (ut ? '\n\n' + ut : '') + (note ? '\n' + note : '') + '\n\nأعد كائن JSON واحداً فقط بنفس المفاتيح والقيم المسموحة، بلا أي شرح خارجه.' }];
    if (img) content.push({ type: 'image_url', image_url: { url: 'data:' + mime + ';base64,' + img } });
    const messages = [{ role: 'user', content }];
    if (P.k === 'cf') { const res = await env.AI.run(P.m, { messages, max_tokens: 4096, temperature: 0.2 }); const t = res && res.response; return { st: 200, o: t && typeof t === 'object' ? t : aiJson(t) }; }
    const go = (rf) => fetch(P.u, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env[P.key], 'user-agent': 'zenha-relay/' + VER },
      body: JSON.stringify(Object.assign({ model: P.m, messages, temperature: 0.2, max_tokens: 6000 }, rf ? { response_format: { type: 'json_object' } } : {}, p === 'zai' ? { thinking: { type: 'disabled' } } : {})) });
    let r = await go(1); if (r.status === 400) r = await go(0);      // مزوّد لا يقبل وضع JSON: بدونه
    if (!r.ok) return { st: r.status };
    const g = await r.json().catch(() => null), m0 = g && g.choices && g.choices[0] && g.choices[0].message;
    return { st: 200, o: aiJson(m0 && m0.content) };
  } finally { clearTimeout(tm); }
}

// ---------- المسارات
async function api(req, env, url, ctx) {
  const bg = (pr) => { pr = pr.catch(() => { }); if (ctx && ctx.waitUntil) ctx.waitUntil(pr); return pr; }, origin = 'https://' + url.host;
  const db = env.DB; if (!db) return err(500, 'nodb', 'لم تُربط قاعدة D1 باسم DB'); await init(db);
  const p = url.pathname, path = p + url.search, method = req.method;
  if (p === '/v1/media' && method === 'POST') return mediaUp(req, env, db, path);
  const body = method === 'POST' ? await req.text() : ''; if (body.length > LIM.body) return err(413, 'big', 'الطلب أكبر من المسموح');
  let J = {}; if (body) { try { J = JSON.parse(body); } catch { return err(400, 'json', 'صيغة غير صالحة'); } }
  if (p === '/v1/health') return json({ ok: true, ver: VER, reg: !!env.REG_KEY, lic: !!env.ADMIN_PUB });
  if (p === '/v1/st' && method === 'GET') {                         // 1.12 حزمة الملصقات (عامة، تُخزَّن في المتصفح)
    const n = await one(db, "SELECT v FROM kv WHERE k = 'st.n'"); if (!n) return json({ ok: true, st: {} });
    const [cnt, ver] = String(n.v).split('|'), rows = await all(db, "SELECT k, v FROM kv WHERE k LIKE 'st.%' AND k != 'st.n'"), parts = [];
    rows.forEach((r) => { parts[+r.k.slice(3)] = r.v; }); if (parts.length !== +cnt) return json({ ok: true, st: {} });
    if (req.headers.get('if-none-match') === '"' + ver + '"') return new Response(null, { status: 304, headers: { etag: '"' + ver + '"', ...CORS } });
    return new Response('{"ok":true,"st":' + parts.join('') + '}', { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600', etag: '"' + ver + '"', ...CORS } });
  }
  if (p === '/v1/register' && method === 'POST') {
    if (!validJwk(J.sigPub) || !validJwk(J.encPub)) return err(400, 'keys', 'مفاتيح غير صالحة');
    if (env.REG_KEY && J.regKey !== env.REG_KEY && !(await licOk(J.lic, env))) return err(403, 'regkey', 'مفتاح التسجيل غير صحيح أو رخصة التفعيل غير صالحة');
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
  const mCr = /^\/v1\/creds\/([A-Za-z0-9_-]{43})$/.exec(p);
  if (mCr && method === 'GET') {                                      // الدخول باسم مستخدم: يُعاد غلاف الدعوة المشفّر بكلمة السر (لا فرق ظاهراً بين اسم موجود وغير موجود)
    const uh = mCr[1], t = now(), tr = await one(db, 'SELECT n, t FROM credtry WHERE uh = ?', uh);
    if (!tr || tr.t < t - 3600) await run(db, 'INSERT INTO credtry (uh, n, t) VALUES (?, 1, ?) ON CONFLICT(uh) DO UPDATE SET n = 1, t = excluded.t', uh, t);
    else { if (tr.n >= 15) return err(429, 'tries', 'محاولات كثيرة لهذا الاسم؛ حاول بعد ساعة'); await run(db, 'UPDATE credtry SET n = n + 1 WHERE uh = ?', uh); }
    const c = await one(db, 'SELECT salt, iter, blob, exp FROM creds WHERE uh = ?', uh);
    if (c && (!c.exp || c.exp > t)) return json({ ok: true, salt: c.salt, iter: c.iter, blob: c.blob });
    let k = await one(db, "SELECT v FROM kv WHERE k = 'decoy'"); if (!k) { await run(db, "INSERT OR IGNORE INTO kv (k, v) VALUES ('decoy', ?)", b64u(crypto.getRandomValues(new Uint8Array(24)))); k = await one(db, "SELECT v FROM kv WHERE k = 'decoy'"); }
    const d1 = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('d1|' + uh + '|' + k.v))), d2 = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('d2|' + uh + '|' + k.v)));
    const fake = new Uint8Array(48); fake.set(d1, 0); fake.set(d2.slice(0, 16), 32);
    return json({ ok: true, salt: b64u(d1.slice(0, 16)), iter: 310000, blob: b64u(fake) });
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
      db.prepare('DELETE FROM creds WHERE h = ?').bind(h),
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
  if (p === '/v1/ai/food' && method === 'POST') return aiFood(req, env, db, path, body, J);      // 1.28: يتحقق من التوقيع بنفسه (أو وضع المعاينة)
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
    await run(db, 'UPDATE invites SET used = 1, cat = NULL WHERE h = ? AND did = ?', String(J.h || ''), me.id); await run(db, 'DELETE FROM creds WHERE h = ? AND did = ?', String(J.h || ''), me.id); return json({ ok: true });
  }
  if (p === '/v1/creds' && method === 'POST') {                    // الأخصائي يسجّل غلاف دعوة بكلمة سر لاسم مستخدم (المحطة لا ترى كلمة السر ولا الرمز)
    if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط');
    const b64 = /^[A-Za-z0-9_-]+$/; if (!/^[A-Za-z0-9_-]{43}$/.test(J.uh || '') || !/^[A-Za-z0-9_-]{32}$/.test(J.h || '') || !b64.test(J.salt || '') || String(J.salt).length > 40 || !b64.test(J.blob || '') || String(J.blob).length > 400 || !(+J.iter >= 100000 && +J.iter <= 1000000)) return err(400, 'cred', 'بيانات غير صالحة');
    const iv = await one(db, 'SELECT exp, used FROM invites WHERE h = ? AND did = ?', J.h, me.id); if (!iv || iv.used) return err(404, 'invite', 'الدعوة غير موجودة أو استُعملت');
    const ex = await one(db, 'SELECT did FROM creds WHERE uh = ?', J.uh); if (ex && ex.did !== me.id) return err(409, 'taken', 'اسم المستخدم مستعمل، اختر غيره');
    const n = await one(db, 'SELECT COUNT(*) AS n FROM creds WHERE did = ?', me.id); if (!ex && n && n.n >= 300) return err(429, 'many', 'حسابات كثيرة بانتظار الدخول');
    await run(db, 'INSERT INTO creds (uh, did, h, salt, iter, blob, exp, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(uh) DO UPDATE SET h = excluded.h, salt = excluded.salt, iter = excluded.iter, blob = excluded.blob, exp = excluded.exp', J.uh, me.id, J.h, J.salt, Math.round(+J.iter), J.blob, iv.exp || 0, now());
    await run(db, 'DELETE FROM credtry WHERE uh = ?', J.uh); return json({ ok: true });
  }
  if (p === '/v1/creds/revoke' && method === 'POST') { if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط'); await run(db, 'DELETE FROM creds WHERE uh = ? AND did = ?', String(J.uh || ''), me.id); return json({ ok: true }); }
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
  // ---- مجموعات التحدي (0.91): المحطة تحفظ نصوصاً مشفّرة بمفتاح المجموعة فقط؛ الأعضاء يتبادلون المفتاح عبر الرسائل المشفّرة الثنائية. التحقق: بصمة السر ga تُخزَّن عند الإنشاء
  if (p === '/v1/g/new' && method === 'POST') {
    if (me.role !== 'd') return err(403, 'role', 'للأخصائي فقط'); const gid = String(J.gid || ''), ah = String(J.ah || '');
    if (!/^[A-Za-z0-9_-]{16,32}$/.test(gid) || !/^[A-Za-z0-9_-]{43}$/.test(ah)) return err(400, 'g', 'بيانات المجموعة غير صالحة');
    if (await one(db, 'SELECT gid FROM grps WHERE gid = ?', gid)) return err(409, 'dup', 'المجموعة موجودة');
    const n = await one(db, 'SELECT COUNT(*) AS n FROM grps WHERE did = ?', me.id); if (n && n.n >= LIM.groups) return err(429, 'many', 'عدد المجموعات كبير');
    await run(db, 'INSERT INTO grps (gid, did, ah, created) VALUES (?, ?, ?, ?)', gid, me.id, ah, now()); return json({ ok: true });
  }
  if (p === '/v1/vm/del' && method === 'POST') {                  // 1.09 حذف رسالة صوتية للجميع: المرسل فقط
    const k = String(J.k || ''); if (!/^[A-Za-z0-9_-]{24}$/.test(k)) return err(400, 'key', 'مفتاح غير صالح');
    for (let i = 0; i < LIM.vparts; i++) await run(db, 'DELETE FROM media WHERE key = ? AND did = ?', 'v.' + k + '.' + i, me.id); return json({ ok: true });
  }
  if (p === '/v1/vm/put' || p === '/v1/vm/get') {                 // 1.08 الرسائل الصوتية: نص مشفّر (المفتاح داخل الرسالة طرفاً لطرف)، يُحذف بعد 7 أيام
    if (method !== 'POST') return err(405, 'method', 'POST فقط'); const k0 = String(J.k || ''), i = parseInt(J.i, 10);
    if (!(i >= 0 && i < LIM.vparts)) return err(400, 'part', 'جزء غير صالح');
    if (p === '/v1/vm/get') {
      if (!/^[A-Za-z0-9_-]{24}$/.test(k0)) return err(400, 'key', 'مفتاح غير صالح');
      const r = await one(db, 'SELECT data, created FROM media WHERE key = ?', 'v.' + k0 + '.' + i); if (!r || r.created < now() - LIM.vTtl) return err(404, 'gone', 'انتهت صلاحية الرسالة الصوتية');
      return json({ ok: true, c: r.data });
    }
    const c = String(J.c || ''); if (!c || !/^[A-Za-z0-9_-]+$/.test(c) || c.length > LIM.vchunk) return err(413, 'big', 'التسجيل أكبر من المسموح');
    let k = k0;
    if (i === 0) { const n = await one(db, "SELECT COUNT(*) AS n FROM media WHERE did = ? AND type = 'audio/enc' AND created > ?", me.id, now() - 3600); if (n && n.n >= LIM.vperHour) return err(429, 'rate', 'رسائل صوتية كثيرة خلال ساعة'); k = b64u(crypto.getRandomValues(new Uint8Array(18))); }
    else { const f = await one(db, 'SELECT did FROM media WHERE key = ?', 'v.' + k + '.0'); if (!/^[A-Za-z0-9_-]{24}$/.test(k) || !f || f.did !== me.id) return err(403, 'key', 'لا صلاحية لهذا التسجيل'); }
    await run(db, 'INSERT OR REPLACE INTO media (key, did, type, size, store, data, created) VALUES (?, ?, ?, ?, ?, ?, ?)', 'v.' + k + '.' + i, me.id, 'audio/enc', Math.floor(c.length * 0.75), 'd1', c, now());
    return json({ ok: true, k });
  }
  if (p === '/v1/g/send' || p === '/v1/g/poll' || p === '/v1/g/media') {
    if (method !== 'POST') return err(405, 'method', 'POST فقط'); const g = await one(db, 'SELECT gid, did, ah FROM grps WHERE gid = ?', String(J.gid || ''));
    if (!g || b64u(await sha256('ga.' + String(J.ga || ''))) !== g.ah) return err(403, 'group', 'لا صلاحية لهذه المجموعة');
    if (p === '/v1/g/poll') {
      const after = Math.max(0, parseInt(J.after || '0', 10) || 0), rows = await all(db, 'SELECT id, sender, body, ts FROM gmsgs WHERE gid = ? AND id > ? ORDER BY id LIMIT ?', g.gid, after, LIM.gpoll);
      return json({ ok: true, msgs: rows.map((r) => ({ id: r.id, from: r.sender, body: JSON.parse(r.body), ts: r.ts })), more: rows.length === LIM.gpoll });
    }
    if (p === '/v1/g/send') {
      const box = J.box; if (!box || typeof box !== 'object') return err(400, 'box', 'رسالة فارغة'); const sb = JSON.stringify(box); if (sb.length > LIM.gbox) return err(413, 'big', 'الرسالة أكبر من المسموح');
      const n = await one(db, 'SELECT COUNT(*) AS n FROM gmsgs WHERE sender = ? AND ts > ?', me.id, now() - 3600); if (n && n.n >= LIM.gperHour) return err(429, 'rate', 'رسائل كثيرة خلال ساعة');
      const r = await run(db, 'INSERT INTO gmsgs (gid, sender, body, ts) VALUES (?, ?, ?, ?)', g.gid, me.id, sb, now()); return json({ ok: true, id: r.meta && r.meta.last_row_id });
    }
    const c = String(J.c || ''); if (!/^[A-Za-z0-9_-]+$/.test(c) || c.length > LIM.gimg) return err(413, 'big', 'الصورة أكبر من المسموح');
    const key = b64u(crypto.getRandomValues(new Uint8Array(18)));
    await run(db, 'INSERT INTO media (key, did, type, size, store, data, created) VALUES (?, ?, ?, ?, ?, ?, ?)', key, g.did, 'application/octet-stream', Math.floor(c.length * 0.75), 'd1', c, now()); return json({ ok: true, key });
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
  const ic = /^\/(icon-192|icon-512|maskable-512|apple-180)(-rose|-pulse|-firoz)?\.png$/.exec(url.pathname);
  if (ic && ICONS[ic[1] + (ic[2] || '')]) return new Response(unb64u(ICONS[ic[1] + (ic[2] || '')]), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800' } });
  if (url.pathname === '/icon.png' && ICON_B64) return new Response(unb64u(ICON_B64), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
  if (url.pathname === '/manifest.webmanifest') {              // البيان يتبع ثيم العميل (?t=rose|pulse): أيقونة وألوان؛ المعرّف id ثابت فيبقى التطبيق نفسه
    const th = url.searchParams.get('t'), sf = th === 'rose' ? '-rose' : th === 'pulse' ? '-pulse' : '', C = { '': ['#0E1440', '#0E1440'], '-rose': ['#FAF6F2', '#FAF6F2'], '-pulse': ['#0A0C0F', '#0A0C0F'] }[th === 'sun' ? 'sun' : sf] || ['#FFFFFF', '#FFFFFF'];
    return new Response(JSON.stringify({
      id: '/', name: 'زنها — عافيتك اليومية', short_name: 'زنها', description: 'خطتك من أخصائي التغذية، ومتابعة يومك، والمحادثة معه — مشفّرة على جوالك.', start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait', dir: 'rtl', lang: 'ar',
      background_color: C[0], theme_color: C[1], categories: ['health', 'food', 'lifestyle'], prefer_related_applications: false,
      shortcuts: [['الوجبة القادمة', 'الوجبة', 'meal'], ['سجّل كوب ماء', 'ماء', 'water'], ['راسل الأخصائي', 'المحادثة', 'chat'], ['رسالة اليوم', 'رسالة اليوم', 'wheel']].map((x) => ({ name: x[0], short_name: x[1], url: '/?a=' + x[2], icons: [{ src: '/icon-192' + sf + '.png', sizes: '192x192', type: 'image/png?v=z1' }] })),
      icons: ICONS['icon-192'] ? [{ src: '/icon-192' + sf + '.png?v=z1', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icon-512' + sf + '.png?v=z1', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/maskable-512' + sf + '.png?v=z1', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] : ICON_B64 ? [{ src: '/icon.png', sizes: '256x256', type: 'image/png' }] : []
    }), { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'no-cache' } });
  }
  // إذاعة القرآن الكريم (بث مباشر): الرابط الأصلي يحوّل إلى خادم برمز قصير العمر وعنوان http، فتُحوِّله المحطة إلى https بلا تخزين ولا تسجيل
  if (url.pathname === '/radio/quran') {
    return fetch('https://n08.radiojar.com/8s5u5tpdtwzuv', { redirect: 'manual' }).then((r) => { const l = r.headers.get('location') || ''; if (/^https?:\/\/[a-z0-9.-]+\.radiojar\.com\//i.test(l)) return new Response(null, { status: 302, headers: { location: l.replace(/^http:/i, 'https:'), 'cache-control': 'no-store' } }); throw 0; }).catch(() => new Response('unavailable', { status: 503, headers: { 'cache-control': 'no-store' } }));
  }
  if (url.pathname === '/' || url.pathname === '/index.html') return new Response(APP_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob: 'self'; media-src 'self' blob: https://everyayah.com https://www.hisnmuslim.com https://*.radiojar.com; frame-src https://www.youtube-nocookie.com; font-src data: 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" } });
  if (url.pathname === '/q/v1/quran.txt' && QURAN_TXT) return new Response(QURAN_TXT, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
  if (url.pathname === '/q/v1/font.ttf' && QURAN_FONT) return new Response(Uint8Array.from(atob(QURAN_FONT), (c) => c.charCodeAt(0)), { headers: { 'content-type': 'font/ttf', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
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
  async scheduled(event, env, ctx) { const p = Promise.all([remindTick(env, event && event.scheduledTime).catch(() => 0), gcGroups(env).catch(() => 0), aiGc(env).catch(() => 0)]).then((r) => r[0]); if (ctx && ctx.waitUntil) ctx.waitUntil(p); return p; },
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
async function gcGroups(env) {                                    // مجموعات التحدي: الرسائل 30 يوماً والصور 7 أيام
  const db = env.DB; if (!db) return 0; await init(db); const t = now();
  await run(db, 'DELETE FROM gmsgs WHERE ts < ?', t - LIM.gTtl); await run(db, "DELETE FROM media WHERE type = 'application/octet-stream' AND created < ?", t - LIM.gimgTtl); await run(db, "DELETE FROM media WHERE type = 'audio/enc' AND created < ?", t - LIM.vTtl); return 1;
}
export const _test = { reset: () => { ready = null; vapidC = null; jwtC.clear(); } };
