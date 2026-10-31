// ================= «حصتي» — تطبيق العميل الحقيقي (تقدّمه المحطة الوسيطة نفسها على «/»)
// الرابط من الأخصائي: https://<المحطة>/#t=<رمز الدعوة>.<بصمة مفتاح الأخصائي>  — الجزء بعد # لا يصل أي خادم.
// 1) يقرأ الدعوة من المحطة ويتحقق أن مفتاح الأخصائي يطابق البصمة في الرابط  2) رمز دخول من 4 أرقام يقفل كل بيانات الجهاز (PBKDF2 + AES-GCM)
// 3) ينضم (هوية موقّعة جديدة) ويُرسل بيانات التسجيل مشفّرة لمفتاح الأخصائي  4) يستقبل الاعتماد والخطة والرسائل، ويرسل المتابعة والوزن والتفضيلات.
// كل رسالة تحمل رمز الدعوة (سر مشترك لا تعرفه المحطة) فلا يستطيع أحد غير الأخصائي مراسلة العميل باسمه، والعكس.
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const HXC = window.HXC, API = location.origin, LOGO = window.HX_LOGO || '';
// ---------- أيقونات خطية (نفس مكتبة حصة)
const P = {
  today:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  swap:'<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',
  edit:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  up:'<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  down:'<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
  back:'<path d="m9 18 6-6-6-6"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pulse:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  cup:'<path d="M5 11h10v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM15 12h1.5a2 2 0 0 1 0 4H15M8 4v3M11 4v3"/>',
  moonbowl:'<path d="M4 12h16a8 8 0 0 1-16 0zM9 4c-1 1.2 1 2 0 3.2M14 4c-1 1.2 1 2 0 3.2"/>',
  flame:'<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 2.5 2 2.5C11 9 11 6 12 3z"/>',
  utensils:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  apple:'<path d="M12 7c-1-1.2-2.6-1.8-4-1.5C5 6.1 3.5 9.1 4 12.5c.6 4.2 3.3 8.3 6 8.5.8.1 1.4-.4 2-.4s1.2.5 2 .4c2.7-.2 5.4-4.3 6-8.5.5-3.4-1-6.4-4-7-1.4-.3-3 .3-4 1.5Z"/><path d="M12 7c0-2 1-3.8 3-4.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  sparkle:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  scale:'<path d="M16 16.5 19 9l3 7.5a3.5 3.5 0 0 1-6 0zM2 16.5 5 9l3 7.5a3.5 3.5 0 0 1-6 0z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  drop:'<path d="M12 2.7s6 6.4 6 11.3a6 6 0 0 1-12 0c0-4.9 6-11.3 6-11.3z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  dumbbell:'<path d="M6.5 6.5 17.5 17.5"/><path d="m21 21-1-1M3 3l1 1"/><path d="m18 22 4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
  msg:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>',
  reset:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  share:'<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  plusSq:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  news:'<path d="M4 22h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  play:'<path d="M6 3l14 9-14 9z"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/>',
  book:'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'
};
const I = (n, c) => '<svg class="ico' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>';
const MEALS = [['B', 'الفطور', 'sun'], ['L', 'الغداء', 'utensils'], ['D', 'العشاء', 'moon'], ['S', 'السناك', 'apple']];
const CATS = [['نشويات', [0]], ['بقوليات', [1]], ['لحوم ودواجن وأسماك', [2, 3, 4, 5]], ['ألبان', [6, 7, 8]], ['خضار', [9]], ['فاكهة', [10]], ['دهون ومكسرات', [11]], ['أخرى', [12]]];
const CUP = 0.25, KEY = 'hissati_v1', TKEY = 'hissati_inv', POLL = 30000;
const now = () => Date.now();
let TODAY = new Date().getDay();                  // 0 = الأحد، مثل ترتيب أيام حصة
const dkey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dateFor = (dow) => { const d = new Date(); d.setDate(d.getDate() - (TODAY - dow)); return dkey(d); };   // يوم من الأسبوع الحالي
const latin = (s) => String(s).replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x6F0).replace(/٫/g, '.').replace(/٬/g, '');
const numOnly = (s) => latin(s).replace(/[,،]/g, '.').replace(/[^\d.]/g, '');

// ---------- الحالة: S تُحفظ مشفّرة برمز الدخول، وV مؤقتة للعرض فقط
const fresh = () => ({
  v: 1, screen: 'invite', step: 1, tab: 'today', day: TODAY, foodCat: 0, foodQ: '', prefCat: 0, prefQ: '',
  p: { name: '', phone: '', sex: 'أنثى', age: '', weight: '', height: '', act: 2, goal: 1, cond: [], allg: [], meds: '', notes: '',
       like: { B: [], L: [], D: [], S: [] }, nope: { B: [], L: [], D: [], S: [] }, food: {}, wake: '07:00', sleep: '23:00', nmeals: 5, wdays: [], bf: '', sport: '', gphase: '', supp: '', sched: null, cq: {} },
  consent: false, req: 'none', reqMsg: '', code: '', plan: null, pm: null, pv: 0, log: {}, weights: [], prefLog: [], pending: [], msgs: [], unreadC: 0, chat: false, ctx: '',
  photos: [], wh: null, chal: null, chLogo: {}, ach: [], rem: { water: false, meals: false }, remSig: '', ident: null, tok: '', fp: '', did: '', cid: '', dEnc: null, dname: '', cat: {}, after: 0, outbox: [], removed: false
});
let S = null, K = null, SALT = null, DATA = {}, CUPS = 10;
const V = { screen: 'boot', err: '', pin: '', pin1: '', busy: false, tries: 0, until: 0, online: true, polling: false, timer: 0 };
let sheet = null, toastT = 0, toastMsg = '';
function mkData() {
  const c = S.cat || {}, m = S.pm || {};
  DATA = { groups: m.groups || c.groups || [], dayNames: m.dayNames || c.days || ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], bank: c.bank || [], foods: c.foods || [], conditions: c.conditions || [], allergens: c.allergens || [], activity: c.activity || [], goals: c.goals || [], kcal: m.kcal || 0, pro: m.pro || 0, water: m.water || 2 };
  CUPS = Math.max(4, Math.min(16, Math.round(DATA.water / CUP)));
}
// ---------- التخزين المشفّر على الجهاز
const enc = new TextEncoder(), dec = new TextDecoder();
async function pinKey(pin, salt) { const k = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200000 }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }
async function persist() {
  const st = S, key = K, salt = SALT; if (!st || !key || st.__tmp) return; const iv = crypto.getRandomValues(new Uint8Array(12));
  const cut = dkey(new Date(now() - 70 * 86400000)); Object.keys(st.log).forEach((k) => { if (k < cut) delete st.log[k]; });
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(st)));
  try { localStorage.setItem(KEY, JSON.stringify({ v: 1, s: HXC.b64u(salt), iv: HXC.b64u(iv), c: HXC.b64u(c), dn: st.dname })); } catch (e) { toast('تعذّر الحفظ على الجهاز — المساحة ممتلئة؟'); }
}
let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(persist, 200); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(saveT); persist(); } else if (K) { TODAY = new Date().getDay(); poll(); almCheck(); almTick(); } });
async function unlock(pin) {
  const r = JSON.parse(localStorage.getItem(KEY)), salt = HXC.unb64u(r.s), key = await pinKey(pin, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: HXC.unb64u(r.iv) }, key, HXC.unb64u(r.c));
  S = Object.assign(fresh(), JSON.parse(dec.decode(pt))); K = key; SALT = salt; S.chat = false; S.day = TODAY; mkData();
}
// ---------- الشبكة
async function api(method, path, obj, unsigned) {
  if (DEMO) return method === 'GET' && /^\/v1\/feed/.test(path) ? { posts: DEMO.posts || [], more: false } : {};
  const body = obj === undefined ? '' : JSON.stringify(obj), h = { 'content-type': 'application/json' };
  if (!unsigned) h.authorization = await HXC.signReq(S.ident, method, path, body);
  let r; try { r = await fetch(API + path, { method, headers: h, body: method === 'POST' ? body : undefined, cache: 'no-store' }); } catch (e) { const x = new Error('لا اتصال بالإنترنت'); x.net = 1; throw x; }
  const j = await r.json().catch(() => ({})); if (!r.ok) { const x = new Error(j.error || 'خطأ (' + r.status + ')'); x.code = j.code; x.status = r.status; throw x; }
  V.online = true; return j;
}
function send(payload) {                           // صندوق صادر: يُرسل الآن، ويُعاد لاحقاً إن انقطع الإنترنت (المتابعة اليومية تُدمج بآخر نسخة لليوم)
  if (DEMO) return Promise.resolve();
  payload.a = S.tok; payload.ts = payload.ts || now();
  if (payload.t === 'log') S.outbox = S.outbox.filter((q) => !(q.t === 'log' && q.d === payload.d));
  if (payload.t === 'prefs') S.outbox = S.outbox.filter((q) => q.t !== 'prefs' || (payload.changes = (q.changes || []).concat(payload.changes || []), false));
  S.outbox.push(payload); save(); return flush();
}
let flushing = null; const PUSHT = ['intake', 'msg', 'health'];     // ما يستحق إشعاراً للأخصائي (المتابعة اليومية تصل بصمت)
function flush() {
  if (flushing) return flushing;
  flushing = (async () => {
    while (S && S.outbox.length) {
      const q = S.outbox[0];
      try { const box = await HXC.seal(S.dEnc, q); await api('POST', '/v1/send', { to: S.did, box, push: PUSHT.indexOf(q.t) >= 0 }); S.outbox.shift(); save(); }
      catch (e) {
        if (e.status === 413 || e.status === 400) { S.outbox.shift(); continue; }        // رسالة مرفوضة نهائياً: تُسقط ويستمر الباقي
        if (e.net) { V.online = false; render(); } else if (e.code === 'unknown') { S.removed = true; S.outbox = []; render(); }
        break;
      }
    }
  })().finally(() => { flushing = null; });
  return flushing;
}
async function poll() {
  if (!S || !K || !S.cid || V.polling || S.removed) return; V.polling = true;
  try {
    await flush();
    const j = await api('GET', '/v1/inbox?after=' + (S.after || 0)); let mx = S.after || 0, ch = 0;
    for (const m of j.msgs) {
      mx = Math.max(mx, m.id); if (m.kind !== 'e' || m.from !== S.did) continue;
      let p = null; try { p = await HXC.open(S.ident, m.body); } catch (e) { continue; }
      if (p && p.a === S.tok) ch += handle(p) ? 1 : 0;
    }
    if (j.msgs.length) { S.after = mx; await persist(); api('POST', '/v1/ack', { upTo: mx }).catch(() => { }); }
    if (ch || !V.online) { V.online = true; render(); }
    if (j.more) setTimeout(poll, 300);
  } catch (e) { if (e.net) { if (V.online) { V.online = false; render(); } } else if (e.code === 'unknown') { S.removed = true; persist(); render(); } }
  finally { V.polling = false; }
}
// ---------- الإشعارات والتطبيق مغلق (Web Push بلا محتوى عبر عامل الخدمة /sw.js)
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const pushOk = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const DEMO = window.HX_DEMO || null;                  // نسخة تجريبية للعرض (hissati_demo.html): حساب وهمي بلا شبكة ولا حفظ ولا عامل خدمة
let swReg = null;
if (!DEMO && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  swReg = navigator.serviceWorker.register('/sw.js').catch(() => null);
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.t === 'rem') { if (S && e.data.items && e.data.items.length && V.screen === '') almFire(e.data.items); else if (S) toast(e.data.text); return; } if (e.data && e.data.t === 'push') { poll(); fdLoad().then(() => { if (S) render(); }); } });
}
function pushState() {
  if (!pushOk()) return isIOS && !standalone ? 'ios' : 'na';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.permission === 'granted' && S && S.pushEp ? 'on' : 'off';
}
async function pushSetup(ask) {
  if (!S || !S.cid || !pushOk() || !swReg) return pushState();
  let perm = Notification.permission; if (perm === 'default' && ask) perm = await Notification.requestPermission();
  if (perm !== 'granted') return pushState();
  try {
    const reg = await Promise.race([swReg, new Promise((r) => setTimeout(() => r(null), 8000))]); if (!reg) throw new Error('sw');
    await Promise.race([navigator.serviceWorker.ready, new Promise((r, j) => setTimeout(() => j(new Error('sw')), 8000))]);
    let sub = await reg.pushManager.getSubscription();
    if (!sub) { const k = await (await fetch(API + '/v1/push/key', { cache: 'no-store' })).json(); sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: HXC.unb64u(k.key) }); }
    if (sub.endpoint !== S.pushEp || !S.pushAt || now() - S.pushAt > 7 * 86400000) { await api('POST', '/v1/push/sub', { ep: sub.endpoint }); S.pushEp = sub.endpoint; S.pushAt = now(); save(); }
  } catch (e) { V.pushErr = 1; }
  return pushState();
}
function notifCard(compact) {                       // بطاقة حالة الإشعارات (شاشة الانتظار، اليوم، الحساب)
  const st = pushState();
  if (st === 'on') return compact ? '' : '<p class="dim">' + I('check') + ' الإشعارات مفعّلة: يصلك خبر الخطة ورسائل أخصائيك والتطبيق مغلق.</p>';
  if (st === 'na') return '';
  if (compact && S.notifLater && now() - S.notifLater < 3 * 86400000) return '';
  const body = st === 'ios' ? 'على آيفون: افتح «حصتي» في Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»، ثم افتحه من الأيقونة وفعّل الإشعارات.'
    : st === 'denied' ? 'الإشعارات محظورة لهذا الموقع. فعّلها من إعدادات المتصفح ← الإشعارات ← السماح لـ«حصتي».'
    : 'ليصلك خبر خطتك ورد أخصائيك حتى والتطبيق مغلق.' + (V.pushErr ? ' (تعذّر التفعيل الآن؛ أعد المحاولة)' : '');
  return '<div class="banner info notif">' + I('alert') + '<span>' + body + (st === 'off' ? '<br><button class="btn sm" data-act="notif" style="margin-top:8px">تفعيل الإشعارات</button>' + (compact ? ' <button class="link" data-act="notifLater">لاحقاً</button>' : '') : '') + '</span></div>';
}
// ---------- التثبيت من المتصفح (بلا متجر): زر التثبيت في Chrome/أندرويد، وخطوات «إضافة إلى الشاشة الرئيسية» على آيفون
let bip = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); bip = e; if (S) render(); });
window.addEventListener('appinstalled', () => { bip = null; if (S) toast('ثُبّت «حصتي» على جهازك ✓ افتحه من أيقونته'); });
const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|WhatsApp/i.test(navigator.userAgent), isAndroid = /Android/i.test(navigator.userAgent);
function installState() { if (DEMO) return 'desktop'; if (standalone) return 'done'; if (inApp) return 'inapp'; if (bip) return 'prompt'; if (isIOS) return 'ios'; if (isAndroid) return 'android'; return 'desktop'; }
function installCard(where) {                       // where: invite | today | sent | acct
  const st = installState(), reg = !!(S && S.cid);
  if (st === 'done') return where === 'acct' ? '<p class="dim">' + I('check') + ' «حصتي» مثبّت على هذا الجهاز.</p>' : '';
  if ((where === 'today' || where === 'sent') && (st === 'desktop' || (S.instLater && now() - S.instLater < 7 * 86400000))) return '';
  const later = where === 'today' || where === 'sent' ? ' <button class="link" data-act="instLater">لاحقاً</button>' : '';
  let b;
  if (st === 'prompt') b = '<b>ثبّت «حصتي» على جوالك</b><br>يفتح بلمسة من الشاشة الرئيسية كأي تطبيق، وتصلك الإشعارات.<br><button class="btn sm" data-act="install" style="margin-top:8px">' + I('plusSq') + ' تثبيت «حصتي»</button>' + later;
  else if (st === 'ios') b = '<b>ثبّت «حصتي» على آيفون</b><ol class="steps"><li>اضغط زر المشاركة ' + I('share') + ' في Safari</li><li>اختر «إضافة إلى الشاشة الرئيسية» ' + I('plusSq') + '</li><li>افتح «حصتي» من أيقونته</li></ol>'
    + (where === 'invite' ? 'ثم اضغط «لديّ رابط دعوة» وألصق رمز دعوتك:<br><button class="btn sm sec" data-act="copyInv" style="margin-top:6px">' + I('copy') + ' نسخ رمز الدعوة</button>'
      : reg ? 'آيفون يفصل بيانات التطبيق المثبّت عن Safari، فانقل حسابك إليه برمز:<br><button class="btn sm sec" data-act="xferNew" style="margin-top:6px">' + I('phone') + ' إنشاء رمز النقل</button>' : '') + later;
  else if (st === 'android') b = '<b>ثبّت «حصتي» على جوالك</b><br>من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».' + later;
  else if (st === 'inapp') b = '<b>افتح «حصتي» في المتصفح</b><br>أنت داخل متصفح تطبيق آخر. افتح الرابط في Chrome أو Safari لتتمكن من التثبيت والإشعارات.' + (where === 'invite' ? '<br><button class="btn sm sec" data-act="copyLink" style="margin-top:6px">' + I('copy') + ' نسخ الرابط</button>' : '') + later;
  else b = 'يمكنك تثبيت «حصتي» على الكمبيوتر من زر التثبيت في شريط العنوان.';
  return '<div class="banner info inst">' + I('phone') + '<span>' + b + '</span></div>';
}
function copyText(t, ok) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(ok)).catch(() => { window.prompt('انسخ:', t); }); }
// ---------- نقل الحساب إلى تطبيق مثبّت أو جوال آخر: حزمة مشفّرة بمفتاح عشوائي داخل الرمز، تُرفع للمحطة 15 دقيقة وتُستعمل مرة واحدة
const XPRE = 'HX1-', xferParse = (c) => { const m = /HX1-([A-Za-z0-9_-]{16})([A-Za-z0-9_-]{22})/.exec(String(c || '').replace(/\s+/g, '')); return m ? { id: m[1], key: m[2] } : null; };
async function xferNew() {
  const id = HXC.b64u(crypto.getRandomValues(new Uint8Array(12))), raw = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const st = JSON.parse(JSON.stringify(S)); delete st.pushEp; delete st.pushAt; delete st.xferId; st.chat = false;
  const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']), c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(st)));
  const j = await api('POST', '/v1/xfer', { id, blob: { iv: HXC.b64u(iv), c: HXC.b64u(c) } });
  S.xferId = id; save(); return { code: XPRE + id + HXC.b64u(raw), exp: j.exp * 1000 };
}
async function xferImport(code) {
  const x = xferParse(code); if (!x) throw new Error('رمز النقل غير صحيح. انسخه كاملاً كما ظهر.');
  let r; try { r = await fetch(API + '/v1/xfer/' + x.id, { cache: 'no-store' }); } catch (e) { throw new Error('لا اتصال بالإنترنت.'); }
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'تعذّر النقل');
  const k = await crypto.subtle.importKey('raw', HXC.unb64u(x.key), 'AES-GCM', false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: HXC.unb64u(j.blob.iv) }, k, HXC.unb64u(j.blob.c)).catch(() => { throw new Error('رمز النقل غير صحيح.'); });
  S = Object.assign(fresh(), JSON.parse(dec.decode(pt))); S.chat = false; S.day = TODAY; mkData();
}
async function xferDone() {                         // الحساب انتقل: يُمسح من هنا (بلا فصله من المحطة) ويتوقف الإشعار لهذا المتصفح
  clearInterval(V.timer); clearInterval(V.xt);
  try { const reg = swReg && await swReg, sub = reg && await reg.pushManager.getSubscription(); if (sub) { if (S && S.ident) await api('POST', '/v1/push/unsub', { ep: sub.endpoint }).catch(() => { }); await sub.unsubscribe(); } } catch (e) { }
  try { localStorage.removeItem(KEY); } catch (e) { }
  S = null; K = null; sheet = null; V.screen = 'moved'; render();
}
function notify(t, b) { toast(t); try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification(t, { body: b || '', icon: '/icon.png', lang: 'ar', dir: 'rtl' }); } catch (e) { } }
function handle(p) {
  if (p.t === 'status') {
    if (p.st === 'approved') { S.req = 'approved'; S.code = String(p.code || ''); if (p.dname) S.dname = p.dname; notify('اعتمدك ' + S.dname, 'خطتك قيد الإعداد'); }
    else if (p.st === 'changes') { S.req = 'changes'; S.reqMsg = String(p.msg || ''); notify(S.dname + ' طلب تعديلاً', S.reqMsg); }
    else if (p.st === 'rejected') { S.req = 'rejected'; }
    return true;
  }
  if (p.t === 'plan' && p.plan && Array.isArray(p.plan.days) && p.plan.days.length) {
    const pl = p.plan; S.pm = { sys: pl.sys || 'ex', kcal: pl.kcal, pro: pl.pro, cho: pl.cho, fat: pl.fat, water: pl.water, dayNames: pl.dayNames, groups: pl.groups, recipes: pl.recipes && typeof pl.recipes === 'object' ? pl.recipes : {}, ready: pl.ready && typeof pl.ready === 'object' ? { id: String(pl.ready.id || ''), name: String(pl.ready.name || '').slice(0, 80) } : null };
    S.plan = JSON.parse(JSON.stringify(pl.days)); S.pv = +p.v || 1; mkData(); S.wm = String(pl.wm || '').slice(0, 80); setGate(pl.gate); if (S.req !== 'approved') S.req = 'approved';
    foodsOf('no').forEach((f) => { if (foodInPlan(f)) applyDislike(f); });
    const first = S.screen !== 'app'; S.screen = 'app'; if (first) S.tab = 'today'; if (!S.planAt) S.planAt = now(); remSync();
    notify(first ? 'وصلت خطتك من ' + S.dname : 'وصلت خطتك المحدَّثة (الإصدار ' + S.pv + ')', 'افتح «حصتي» لترى يومك'); return true;
  }
  if (p.t === 'msg' && p.text) {
    S.msgs.push({ from: 'd', t: String(p.text).slice(0, 2000), ts: p.ts || now() }); S.msgs = S.msgs.slice(-300);
    if (S.chat && !document.hidden) readReceipt(); else { S.unreadC++; notify('رسالة من ' + S.dname, String(p.text).slice(0, 80)); }
    return true;
  }
  if (p.t === 'health') {
    if (p.ok) { S.p.cond = (p.cond || []).slice(); S.p.allg = (p.allg || []).slice(); toast('اعتمد أخصائيك تعديل حالتك الصحية.'); } else toast('لم يعتمد أخصائيك تعديل الحالة الصحية — راسله للتفاصيل.');
    S.pending = []; return true;
  }
  if (p.t === 'chal' && p.prog && Array.isArray(p.prog.weeks) && p.prog.weeks.length) {
    const pr = JSON.parse(JSON.stringify(p.prog)); S.chLogo = S.chLogo || {}; if (typeof pr.logo === 'string' && pr.logo.length < 400000 && /^data:image\/(png|jpeg);base64,/.test(pr.logo)) S.chLogo[pr.id] = pr.logo; delete pr.logo; S.chal = pr;
    const ls = hList(); pr.weeks.forEach((w) => w.goals.forEach((g) => { if (g.h !== 'plan' && HB(g.h) && ls.indexOf(g.h) < 0) ls.push(g.h); })); S.habits = ls;
    notify('🏆 تحدٍّ جديد من ' + (pr.dname || S.dname), pr.weeks[0].title); return true;
  }
  if (p.t === 'chalx') { S.chal = null; return true; }
  if (p.t === 'pcm' && p.id) { const ph = (S.photos || []).find((x) => x.id === p.id); if (ph) { ph.cm = String(p.text || '').slice(0, 300); notify('علّق أخصائيك على صورة وجبتك', ph.cm); return true; } return false; }
  if (p.t === 'appt' && Array.isArray(p.list)) { S.appts = p.list.slice(0, 8).filter((a) => a && /^\d{4}-\d{2}-\d{2}$/.test(a.d)).map((a) => ({ id: String(a.id).slice(0, 30), d: a.d, t: String(a.t || '').slice(0, 5), type: String(a.type || 'متابعة').slice(0, 40), mode: String(a.mode || '').slice(0, 20), conf: a.conf || '' })); S.replyAt = /^\d{2}:\d{2}$/.test(p.reply || '') ? p.reply : ''; remSync(true); return true; }
  if (p.t === 'pts') { S.pts = { on: !!p.on, total: +p.total || 0, per: p.per === 'm' ? 'm' : 'w', r: p.r || {}, cap: +p.cap || 0, rewards: Array.isArray(p.rewards) ? p.rewards.slice(0, 8) : [], ref: String(p.ref || '').slice(0, 12), refs: Array.isArray(p.refs) ? p.refs.slice(0, 50).map(String) : [], refTxt: String(p.refTxt || '').slice(0, 160), refDays: +p.refDays || 90 }; return true; }
  if (p.t === 'rwd' && p.n) { const n = String(p.n).slice(0, 60), cert = /شهادة/.test(n); S.rwds = (S.rwds || []).concat([{ n, p: +p.p || 0, at: now() }]).slice(-20);
    if (cert) { const c = { id: 'r' + now().toString(36), pid: 'pts', w: 98, title: 'جمع ' + (+p.p || 0) + ' نقطة التزام ' + (p.per === 'm' ? 'هذا الشهر' : 'هذا الأسبوع'), lines: [], at: now(), name: String(S.p.name || '').trim(), sex: S.p.sex, dname: S.dname, clinic: '', phrase: PHRASES[now() % PHRASES.length] }; S.ach = (S.ach || []).concat([c]); setTimeout(() => celebrateAch(c), 80); }
    notify('🏅 مكافأة جديدة من أخصائيك', n); return true; }
  if (p.t === 'supp' && Array.isArray(p.list)) { S.supps = p.list.slice(0, 20).map((x) => ({ n: String(x.n || '').slice(0, 60), k: x.k === 'h' ? 'h' : 's', dose: String(x.dose || '').slice(0, 120), note: String(x.note || '').slice(0, 120), warn: String(x.warn || '').slice(0, 160) })); notify('💊 رشّح لك أخصائيك مكملات', S.supps.map((x) => x.n).join('، ')); return true; }
  if (p.t === 'gate') { setGate(p.on ? { on: 1, hour: p.hour } : null); return true; }
  if (p.t === 'read') { S.msgs.forEach((m) => { if (m.from === 'c' && m.ts <= p.upTo) m.read = true; }); return true; }
  return false;
}
function readReceipt() { S.unreadC = 0; const last = S.msgs.filter((m) => m.from === 'd').slice(-1)[0]; if (last && !last.rr) { last.rr = 1; send({ t: 'read', upTo: last.ts }); } }
let logT = {}; function queueLog(k) { clearTimeout(logT[k]); logT[k] = setTimeout(() => sendLog(k), 2500); }
function sendLog(k) {
  const L = S.log[k]; if (!L || !S.plan) return; const dow = new Date(k + 'T12:00:00').getDay(), day = S.plan[dow % S.plan.length]; let n = 0, done = 0;
  day.slots.forEach((s, si) => s.lines.forEach((l, li) => { n++; if (L.ck[si + '_' + li]) done++; }));
  send({ t: 'log', d: k, dow, pv: S.pv, ck: L.ck, sw: L.sw, note: L.note, skip: L.skip, water: L.water, done, n, h: L.h || {}, hs: hList(), off: L.off || {}, offT: L.offT || '', sub: L.sub || 0 });
}

// ---- 0.49: «تسجيل اليوم» في 30 ثانية: زر الالتزام الكامل، الماء، المشي، وما خرج عن النظام، ثم «أرسل تسجيل اليوم»
const OFF = [['sweets', '🍰 حلويات'], ['out', '🍔 أكل من الخارج'], ['extra', '🍽 وجبة زيادة'], ['drinks', '🥤 مشروبات محلّاة'], ['sym', '🤒 تعب أو أعراض'], ['change', '✏️ أريد تعديل النظام']];
const WALK_MIN = [15, 30, 45, 60], WALK_STEPS = [3000, 5000, 8000, 10000];
function dayLogCard(d) {
  const L = dl(d), H = L.h || {}, off = L.off || {}, [done, n] = itemsOfDay(d), pct = n ? Math.round(done / n * 100) : 0, chip = (act, v, on, t) => '<button class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + !!on + '">' + t + '</button>';
  return '<section class="card stack daylog" id="daylog"><div class="row" style="justify-content:space-between"><h3>' + I('check') + ' تسجيل اليوم</h3><span class="dim">التزامك ' + pct + '%</span></div>'
    + '<button class="btn full' + (pct === 100 ? ' sec' : '') + '" data-act="allDay">' + I('check') + (pct === 100 ? ' التزمت باليوم كله ✓' : ' التزمت باليوم كله') + '</button><p class="dim">أو علّم الوجبات واحدة واحدة أعلاه، واكتب الاستثناءات فقط.</p>'
    + '<div class="lrow"><b>💧 الماء</b><span class="stepper"><button class="btn sm sec" data-act="wAdd" data-v="-1" aria-label="كوب أقل">−</button><b id="wv">' + (L.water || 0) + '</b><button class="btn sm sec" data-act="wAdd" data-v="1" aria-label="كوب أكثر">+</button></span><small class="dim">كوب (' + ((L.water || 0) * CUP).toFixed(2).replace(/\.?0+$/, '') + ' لتر)</small></div>'
    + '<div class="lblk"><b>🚶 المشي أو الرياضة</b><div class="chips">' + WALK_MIN.map((m) => chip('walkMin', m, +H.walkMin === m, m + ' دقيقة')).join('') + '</div><div class="chips">' + WALK_STEPS.map((m) => chip('walkSteps', m, +H.steps === m, (m / 1000) + ' آلاف خطوة')).join('') + '</div>'
    + '<div class="row lin"><label>دقائق<input class="inp" type="text" inputmode="numeric" data-numf="1" data-wk="walkMin" value="' + (H.walkMin || '') + '"></label><label>خطوات<input class="inp" type="text" inputmode="numeric" data-numf="1" data-wk="steps" value="' + (H.steps || '') + '"></label><label>متر<input class="inp" type="text" inputmode="numeric" data-numf="1" data-wk="walkM" value="' + (H.walkM || '') + '"></label></div></div>'
    + '<div class="lblk"><b>📝 خارج النظام اليوم (اختياري)</b><div class="chips">' + OFF.map((o) => chip('off', o[0], off[o[0]], o[1])).join('') + '</div>'
    + (Object.keys(off).length || L.offT ? '<textarea class="inp" id="offT" rows="2" maxlength="500" placeholder="ماذا أكلت؟ أو ما الأعراض؟ أو ما التعديل الذي تريده؟">' + esc(L.offT || '') + '</textarea>' : '') + '</div>'
    + '<button class="btn full' + (L.sub ? ' sec' : '') + '" data-act="subDay">' + I('send') + (L.sub ? ' أُرسل تسجيل اليوم ✓ (أرسل التحديث)' : ' أرسل تسجيل اليوم لأخصائيك') + '</button></section>';
}
// ---- 0.51: «يوم واحد في كل مرة» (يفعّله الأخصائي لكل عميل): جدول اليوم يُفتح بعد إرسال تسجيل أمس، أو تلقائياً في ساعة محددة
function setGate(g) { const on = g && g.on; S.gate = on ? { on: 1, h: Math.min(20, Math.max(6, +g.hour || 12)), from: (S.gate && S.gate.from) || dkey(new Date()) } : null; }
function yKey() { return dkey(new Date(now() - 864e5)); }
function gateOpen() {
  const g = S.gate; if (!g || !S.plan) return true; const y = yKey(), L = S.log[y];
  return y < g.from || !!(L && L.sub) || new Date(now()).getHours() >= g.h;
}
function gateCard() {
  return '<section class="card stack gatec"><div class="gl">🔒</div><h2>جدول اليوم ينتظر تسجيل أمس</h2><p class="mut">أرسل لأخصائيك كيف كان يومك أمس ليُفتح جدول اليوم. ثوانٍ فقط.</p>'
    + '<button class="btn full" data-act="yAll">' + I('check') + ' التزمت بأمس كله</button><button class="btn sec full" data-act="ySub">' + I('send') + ' أرسل أمس كما سجّلته</button>'
    + '<p class="dim">إن نسيت، يُفتح جدول اليوم تلقائياً الساعة ' + S.gate.h + ':00.</p></section>';
}
function logNow(d) { const k = dateFor(d); clearTimeout(logT[k]); sendLog(k); save(); }

// ---- 0.52: «المتوفر عندي هذا الأسبوع» لكل وجبة (الأخصائي يولّد منه)، و«أكمل ملفك» بعد 3 أيام (الاستمارة على مرحلتين)
const PCATS = [['بروتين', [1, 2, 3, 4, 5, 6, 7, 8]], ['نشويات', [0]], ['خضار', [9]], ['فاكهة', [10]], ['دهون', [11]]];
const panCats = () => (S.cat && S.cat.fcats ? foodCats() : PCATS);
const panMeals = () => MEALS.filter((m) => ['B', 'L', 'D', 'S'].includes(m[0]));
function panDue() { const P = S.pantry; return !P || !P.at || now() - P.at > 7 * 864e5; }
function panCard(waiting) {
  if (!S.cat || !(DATA.foods || []).length || (!waiting && !S.plan) || !panDue()) return '';
  return '<section class="card stack pancard"><h3>🛒 ' + (S.pantry && S.pantry.at ? 'حدّث قائمة المتوفر لهذا الأسبوع' : 'ما المتوفر عندك من الأكل؟') + '</h3><p class="mut">اختر لكل وجبة ما عندك أو تقدر توفّره، فيبني أخصائيك جدولك منه. دقيقتان' + (S.pantry && S.pantry.at ? '، وقائمة الأسبوع الماضي محفوظة: غيّر الفرق فقط.' : '.') + '</p><button class="btn full" data-act="panGo">ابدأ</button></section>';
}
function scrPantry() {
  const ms = panMeals(), i = Math.min(V.pan, ms.length - 1), m = ms[i], P = V.panD, sel = P[m[0]] = P[m[0]] || {}, cats = panCats(), ci = Math.min(V.panC || 0, cats.length - 1), q = (V.panQ || '').trim();
  const list = DATA.foods.filter((f) => (q ? f[0].includes(q) : cats[ci][1].includes(f[1])));
  const snackOff = m[0] === 'S' && P.noS, need = panNeed(m[0]);
  const grid = snackOff ? '<div class="banner info">' + I('check') + '<span>لن تُضاف وجبة سناك إلى جدولك.</span></div>' : '<div class="tabs" role="tablist">' + cats.map((c, j) => '<button class="' + (j === ci && !q ? 'on' : '') + '" data-act="panC" data-v="' + j + '">' + esc(c[0]) + '</button>').join('') + '</div>'
    + '<label class="srch">' + I('sparkle') + '<input id="panQ" data-panq="1" placeholder="ابحث عن صنف…" value="' + esc(V.panQ || '') + '"></label>'
    + '<div class="fgrid">' + list.slice(0, 80).map((f) => { const st = sel[f[0]]; return '<button class="food ' + (st === 'h' ? 'love' : st === 'c' ? 'can' : '') + '" data-act="panF" data-v="' + esc(f[0]) + '" aria-pressed="' + !!st + '">' + (st === 'h' ? I('check') + ' ' : st === 'c' ? '◐ ' : '') + esc(f[0]) + '</button>'; }).join('') + '</div>';
  const n = Object.keys(sel).length;
  return '<div class="scr pan"><div class="scroll"><div class="stack"><div class="row" style="justify-content:space-between"><span class="dim">' + (i + 1) + ' من ' + ms.length + '</span><button class="btn sm sec" data-act="panX">إغلاق</button></div><div class="prog"><i style="width:' + Math.round((i + 1) / ms.length * 100) + '%"></i></div>'
    + '<h2>' + I(m[2]) + ' ' + m[1] + ': ما المتوفر عندك؟</h2><p class="mut">المس الصنف مرة = ✓ متوفر عندي، مرتين = ◐ أقدر أوفّره، ثالثة = إلغاء.</p>'
    + (m[0] === 'S' ? '<button class="chip' + (P.noS ? ' on' : '') + '" data-act="panNoS" aria-pressed="' + !!P.noS + '">🚫 لا أريد سناك</button>' : '')
    + grid + '<p class="dim">اخترت ' + n + ' صنفاً' + (need ? ' • ' + need : '') + '</p></div></div>'
    + '<div class="foot"><button class="btn sec" data-act="panB"' + (i ? '' : ' disabled') + '>السابق</button><button class="btn" data-act="panN"' + (need ? ' disabled' : '') + '>' + (i === ms.length - 1 ? 'أرسل لأخصائيك' : 'التالي') + '</button></div></div>';
}
function panNeed(t) {                                 // حد أدنى حتى لا يكرر الجدول نفس الصنف: مصدر بروتين (ونشوية للفطور والغداء)
  const P = V.panD, sel = P[t] || {}; if (t === 'S') return P.noS || Object.keys(sel).length ? '' : 'اختر صنفاً واحداً على الأقل أو «لا أريد سناك»';
  if (S.cat && S.cat.fcats) return Object.keys(sel).length >= 2 ? '' : 'اختر صنفين على الأقل';
  const g = (n) => (DATA.foods.find((f) => f[0] === n) || [])[1], ks = Object.keys(sel), pr = ks.filter((n) => g(n) >= 1 && g(n) <= 8).length, st = ks.filter((n) => g(n) === 0).length;
  return pr < 1 ? 'اختر مصدر بروتين واحداً على الأقل' : st < 1 && t !== 'D' ? 'اختر نشوية واحدة على الأقل' : '';
}
const PF = [
  { k: 'waist', t: 'محيط خصرك (سم)', h: 'بشريط القياس عند مستوى السُّرة، واقفاً ومسترخياً، بعد الزفير. اختياري.', type: 'num' },
  { k: 'job', t: 'طبيعة عملك', one: ['عمل مكتبي (جلوس طويل)', 'حركة متوسطة (تدريس، مبيعات…)', 'عمل بدني شاق', 'طالب/ة', 'ربة منزل', 'لا أعمل حالياً', 'ورديات ليلية'] },
  { k: 'nat', t: 'جنسيتك', one: ['مصري/ة', 'سعودي/ة', 'أخرى'], other: 'natT' },
  { k: 'mar', t: 'الحالة الاجتماعية', one: ['أعزب/عزباء', 'متزوج/ة', 'مطلق/ة', 'أرمل/ة'] },
  { k: 'vit', t: 'هل عندك نقص في فيتامين أو أنيميا؟', many: ['نقص فيتامين د', 'نقص فيتامين ب12', 'أنيميا / نقص حديد', 'لا أعرف', 'لا يوجد'], other: 'vitT' },
  { k: 'tr', t: 'هل تتمرن؟', one: ['نعم', 'لا'] },
  { k: 'trT', t: 'نوع تمرينك', many: ['مشي سريع', 'جري', 'حديد / جيم', 'سباحة', 'كرة', 'يوجا / بيلاتس', 'دراجة', 'أخرى'], when: (a) => a.tr === 'نعم' },
  { k: 'trD', t: 'أيام التمرين', days: 1, when: (a) => a.tr === 'نعم' },
  { k: 'trM', t: 'مدة التمرين', one: ['20 دقيقة', '30 دقيقة', '45 دقيقة', '60 دقيقة', '90 دقيقة'], when: (a) => a.tr === 'نعم' },
  { k: 'fol', t: 'كيف تحب المتابعة؟', one: ['أونلاين', 'في العيادة'] },
  { k: 'ch', t: 'المتابعة الأونلاين عن طريق', many: ['مكالمة', 'فيديو', 'شات'], when: (a) => a.fol === 'أونلاين' }
];
function pfDue() { return S.plan && !(S.prof && S.prof.at) && S.planAt && now() - S.planAt >= 3 * 864e5; }
function pfCard() { return pfDue() ? '<section class="card stack pancard"><h3>📋 أكمل ملفك (دقيقتان)</h3><p class="mut">أسئلة قليلة تساعد أخصائيك يضبط خطتك أكثر: الخصر، طبيعة عملك، التمرين، وطريقة المتابعة.</p><button class="btn full" data-act="pfGo">ابدأ</button></section>' : ''; }
const pfQs = (a) => PF.filter((q) => !q.when || q.when(a));
function scrProf() {
  const a = V.pfA, qs = pfQs(a), i = Math.min(V.pf, qs.length - 1), q = qs[i], v = a[q.k];
  let body = '';
  if (q.type === 'num') body = '<input class="inp" id="pfNum" inputmode="decimal" data-numf="1" placeholder="مثال: 92" value="' + esc(v || '') + '">';
  else if (q.days) body = '<div class="chips">' + DATA.dayNames.map((d, j) => '<button class="chip' + ((v || []).includes(j) ? ' on' : '') + '" data-act="pfDay" data-v="' + j + '">' + esc(d) + '</button>').join('') + '</div>';
  else body = '<div class="rqopts">' + (q.one || q.many).map((o) => { const on = q.many ? (v || []).includes(o) : v === o; return '<button class="rqo' + (on ? ' on' : '') + '" role="' + (q.many ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-act="pfO" data-v="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>' + (q.other ? '<input class="inp" id="pfOther" placeholder="اكتب إن كان غير ذلك (اختياري)" value="' + esc(a[q.other] || '') + '">' : '');
  return '<div class="scr rq"><div class="scroll"><div class="stack"><div class="row" style="justify-content:space-between"><span class="dim stepk">سؤال ' + (i + 1) + ' من ' + qs.length + '</span><button class="btn sm sec" data-act="pfX">لاحقاً</button></div><div class="prog"><i style="width:' + Math.round((i + 1) / qs.length * 100) + '%"></i></div>'
    + '<h2>' + esc(q.t) + '</h2>' + (q.h ? '<p class="mut">' + esc(q.h) + '</p>' : '') + body + '</div></div><div class="foot"><button class="btn sec" data-act="pfB"' + (i ? '' : ' disabled') + '>السابق</button><button class="btn" data-act="pfN">' + (i === qs.length - 1 ? 'أرسل لأخصائيك' : 'التالي') + '</button></div></div>';
}
function pfKeep() { const a = V.pfA, n = $('#pfNum'), o = $('#pfOther'), qs = pfQs(a), q = qs[Math.min(V.pf, qs.length - 1)]; if (n) { const x = parseFloat(numOnly(n.value)); if (x > 30 && x < 300) a[q.k] = Math.round(x * 2) / 2; else delete a[q.k]; } if (o && q.other) a[q.other] = o.value.trim().slice(0, 80); }

// ---- 0.53: قياس الأسبوع (الوزن والخصر وصورة الإنبودي والتحاليل)، وصورة التقدم كل أسبوعين بموافقة منفصلة للنشر، و«صفحتي الصحية»
const WKD = 7 * 864e5, BDD = 14 * 864e5;
const lastOf = (a) => (a && a.length ? a[a.length - 1].ts : 0);
function wkBase() { return lastOf(S.checks) || S.planAt || 0; }
function wkCard() {
  if (!S.plan || !S.planAt) return ''; const due = now() - wkBase() >= WKD - 12 * 36e5, soon = !due && now() - wkBase() >= WKD - 36 * 36e5;
  if (soon) return '<section class="card stack wkc"><h3>⏰ غداً موعد قياسك الأسبوعي</h3><p class="mut">قِس على الريق بعد دخول الحمام، بنفس الميزان، وجهّز شريط القياس للخصر.</p></section>';
  return due ? '<section class="card stack wkc"><h3>⚖ قياس الأسبوع</h3><p class="mut">الوزن والخصر، وصورة الإنبودي أو التحاليل إن وُجدت. دقيقة واحدة.</p><button class="btn full" data-act="wkGo">سجّل قياس الأسبوع</button></section>' : '';
}
function bdCard() {
  if (!S.plan || !S.planAt || now() - (lastOf(S.bodies) || S.planAt - BDD) < BDD || (S.bdSnooze && now() - S.bdSnooze < 3 * 864e5)) return '';
  const first = !(S.bodies || []).length;
  return '<section class="card stack wkc"><h3>📸 ' + (first ? 'صورة البداية' : 'صورة التقدم') + '</h3><p class="mut">' + (first ? 'صورة «قبل» الآن تقارنها بعد أسابيع بالفرق الذي لا يظهر في الميزان.' : 'صورة كل أسبوعين تريك الفرق الذي لا يظهر في الميزان.') + ' اختيارية، وتصل أخصائيك وحده مشفّرة.</p><div class="row"><button class="btn sec" data-act="bdGo">التقط صورة</button><button class="btn sm sec" data-act="bdLater">ليس الآن</button></div></section>';
}
function scrWk() {
  const x = V.wkD;
  return '<div class="scr"><div class="scroll"><div class="stack"><div class="row" style="justify-content:space-between"><h2>⚖ قياس الأسبوع</h2><button class="btn sm sec" data-act="wkX">إغلاق</button></div>'
    + '<div class="banner info">' + I('check') + '<span>لقراءة صادقة: نفس اليوم والساعة كل أسبوع، على الريق بعد دخول الحمام، وبملابس خفيفة. الخصر عند مستوى السُّرة بعد الزفير.</span></div>'
    + '<div class="field"><label for="wkW">الوزن (كجم) <span class="req">*</span></label><input class="inp" id="wkW" inputmode="decimal" data-numf="1" placeholder="مثال: 84.5" value="' + esc(x.w || '') + '"></div>'
    + '<div class="field"><label for="wkWs">الخصر (سم) — اختياري</label><input class="inp" id="wkWs" inputmode="decimal" data-numf="1" placeholder="مثال: 92" value="' + esc(x.waist || '') + '"></div>'
    + '<div class="row wkph"><button class="btn sec" data-act="wkPic" data-v="inb">' + I('camera') + (x.inb ? ' ✓ صورة الإنبودي' : ' صورة الإنبودي') + '</button><button class="btn sec" data-act="wkPic" data-v="lab">' + I('camera') + (x.lab ? ' ✓ صورة التحاليل' : ' صورة التحاليل') + '</button></div>'
    + (x.inb || x.lab ? '<div class="row">' + ['inb', 'lab'].filter((k) => x[k]).map((k) => '<img class="wkth" alt="" src="' + x[k].th + '">').join('') + '</div>' : '') + '</div></div>'
    + '<div class="foot"><button class="btn" data-act="wkSend">أرسل لأخصائيك</button></div></div>';
}
function scrBody() {
  const x = V.bdD;
  return '<div class="scr"><div class="scroll"><div class="stack"><div class="row" style="justify-content:space-between"><h2>📸 صورة التقدم</h2><button class="btn sm sec" data-act="bdX">إغلاق</button></div>'
    + '<div class="banner info">' + I('lock') + '<span>نفس المكان والإضاءة والملابس في كل مرة، من الأمام. تُشفَّر على جوالك وتصل أخصائيك وحده.</span></div>'
    + '<button class="btn sec full" data-act="bdPic">' + I('camera') + (x.img ? ' غيّر الصورة' : ' التقط أو اختر صورة') + '</button>' + (x.img ? '<img class="bdpv" alt="" src="' + x.th + '">' : '')
    + '<label class="consent"><input type="checkbox" id="bdPub"' + (x.pub ? ' checked' : '') + '><span>أوافق أن ينشرها أخصائيي كقصة نجاح <b>بعد إخفاء الوجه وأي بيانات تدل عليّ</b> (اختياري، ويمكنني سحب الموافقة لاحقاً).</span></label></div></div>'
    + '<div class="foot"><button class="btn" data-act="bdSend"' + (x.img ? '' : ' disabled') + '>أرسل لأخصائيك</button></div></div>';
}
function hpTop() {                                   // «صفحتي الصحية»: صورتي، بياناتي، آخر القياسات وصور التقدم
  const p = S.p, ch = (S.checks || []).slice(-6), bd = (S.bodies || []).slice(-6), a = (S.prof || {}).a || {};
  const facts = [p.age ? p.age + ' سنة' : '', p.height ? p.height + ' سم' : '', (p.cond || []).join('، '), (p.allg || []).length ? 'حساسية: ' + p.allg.join('، ') : '', a.job || '', a.tr === 'نعم' ? 'أتمرن ' + (a.trD || []).length + ' أيام' : ''].filter(Boolean);
  const rows = ch.map((c, i) => { const prev = i ? ch[i - 1].w : null, d = prev != null ? Math.round((c.w - prev) * 10) / 10 : null; return '<div class="hpr"><span>' + new Date(c.ts).toLocaleDateString('ar', { day: 'numeric', month: 'short' }) + '</span><b>' + c.w + ' كجم</b>' + (d != null ? '<span class="' + (d <= 0 ? 'dn' : 'up') + '">' + (d <= 0 ? '↓ ' : '↑ ') + Math.abs(d) + '</span>' : '<span></span>') + '<span class="dim">' + (c.waist ? 'خصر ' + c.waist : '') + '</span></div>'; }).join('');
  const nxt = S.planAt ? new Date(wkBase() + WKD).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'short' }) : '';
  return '<section class="card stack hp"><div class="row"><button class="hpav" data-act="avPic" aria-label="صورتي">' + (S.avatar ? '<img alt="" src="' + S.avatar + '">' : I('user')) + '</button><div style="flex:1"><h2>صفحتي الصحية</h2><div class="dim">' + esc(facts.join(' • ') || 'بياناتي') + '</div></div></div>'
    + (rows ? '<h3>قياساتي الأسبوعية</h3>' + rows : '<p class="dim">قياسك الأسبوعي يظهر هنا.</p>') + (nxt ? '<p class="dim">موعد القياس القادم: ' + esc(nxt) + '</p>' : '')
    + (bd.length ? '<h3>صور التقدم</h3><div class="row hpb">' + bd.map((b) => '<img alt="" src="' + b.th + '">').join('') + '</div>' : '') + '</section>';
}
function picFile(cb) { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none'; document.body.appendChild(inp); inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) cb(f); }; inp.click(); }
async function picPrep(file) { const [a, b, c, th] = await shrink(file, [[1280, 0.72], [1024, 0.62], [800, 0.55], [240, 0.6]]); return { img: [a, b, c].find((x) => x.length < 165000) || c, th }; }
const pid = () => 'p' + now().toString(36) + Math.random().toString(36).slice(2, 5);

// ---- 0.54: موعد المتابعة (الأسبوعي الثابت وغيره) مع تأكيد قبله بيوم، ووقت رد الأخصائي اليومي
function hm12(t) { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); if (!m) return t || ''; const h = +m[1]; return (h % 12 || 12) + ':' + m[2] + (h < 12 ? ' ص' : ' م'); }
function apNext() { const t = dkey(new Date()); return (S.appts || []).filter((a) => a.d >= t).sort((a, b) => (a.d + a.t).localeCompare(b.d + b.t))[0]; }
function apCard() {
  const a = apNext(); if (!a) return ''; const tmr = dkey(new Date(now() + 864e5)), tdy = dkey(new Date()), soon = a.d === tmr || a.d === tdy, c = (S.apConf || {})[a.id] || a.conf;
  const when = new Date(a.d + 'T12:00').toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' }) + ' • ' + hm12(a.t) + (a.mode ? ' • ' + a.mode : '');
  return '<section class="card stack apc' + (soon && !c ? ' soon' : '') + '"><div class="row"><span style="font-size:22px">📅</span><div style="flex:1"><h3>' + (a.d === tdy ? 'موعد متابعتك اليوم' : a.d === tmr ? 'غداً موعد متابعتك' : 'موعد متابعتك القادم') + '</h3><div class="dim">' + esc(a.type) + ' • ' + esc(when) + '</div></div></div>'
    + (soon ? (c === 'ok' ? '<div class="banner ok">' + I('check') + '<span>أكّدت الموعد ✓</span></div>' : c === 'chg' ? '<div class="banner warn">' + I('clock') + '<span>طلبت تغيير الموعد؛ سيتواصل معك أخصائيك.</span></div>' : '<div class="row"><button class="btn" data-act="apOk" data-v="' + esc(a.id) + '">' + I('check') + ' أؤكد الموعد</button><button class="btn sec" data-act="apChg" data-v="' + esc(a.id) + '">أحتاج تغيير</button></div>') : '') + '</section>';
}

// ---- 0.55: نقاطي ومكافآتي (يحددها أخصائيك)، وكود دعوتي
function ptsCard() {
  const P = S.pts; if (!P) return ''; const per = P.per === 'm' ? 'الشهر' : 'الأسبوع', rw = (P.rewards || []).filter((q) => +q.p > 0).sort((a, b) => a.p - b.p), nx = rw.find((q) => q.p > P.total), R = P.r || {};
  const how = [['day', 'كل يوم ترسل فيه «تسجيل اليوم»'], ['photo', 'صورة وجبة'], ['wk', 'قياس الأسبوع'], ['body', 'صورة التقدم'], ['att', 'حضور المتابعة']].filter((q) => +R[q[0]] > 0).map((q) => '<li>' + q[1] + ' <b>+' + (+R[q[0]]) + '</b></li>').join('');
  return (P.on ? '<section class="card stack pts"><div class="row" style="justify-content:space-between"><h3>🏅 نقاطي هذا ' + per + '</h3><b class="ptn">' + P.total + '</b></div>'
    + (nx ? '<div class="prog"><i style="width:' + Math.min(100, Math.round(P.total / nx.p * 100)) + '%"></i></div><p class="dim">باقي ' + (nx.p - P.total) + ' نقطة على «' + esc(nx.n) + '»</p>' : rw.length ? '<p class="dim">وصلت لكل مكافآت ' + per + ' 🎉</p>' : '')
    + (rw.length ? '<p class="mut">المكافآت: ' + rw.map((q) => q.p + ' ← ' + esc(q.n)).join(' • ') + '</p>' : '') + (how ? '<details><summary class="dim">كيف أجمع النقاط؟</summary><ul class="plist">' + how + '</ul><p class="dim">بحد أقصى ' + (P.cap || 0) + ' نقطة في اليوم.</p></details>' : '')
    + ((S.rwds || []).length ? '<p class="dim">حصلت على: ' + S.rwds.slice(-3).map((q) => esc(q.n)).join('، ') + '</p>' : '') + '</section>' : '')
    + (P.ref ? '<section class="card stack ref"><h3>🤝 كود دعوتي</h3><div class="row"><b class="refc" dir="ltr">' + esc(P.ref) + '</b><button class="btn sm sec" data-act="refShare">' + I('share') + ' شارك</button></div><p class="mut">من يشترك عند أخصائيك بهذا الكود خلال ' + P.refDays + ' يوماً يُحسب لك.' + (P.refTxt ? ' ' + esc(P.refTxt) : '') + '</p><p class="dim">اشترك من طرفك: ' + P.refs.length + (P.refs.length ? ' (' + P.refs.map(esc).join('، ') + ')' : '') + '</p></section>' : '');
}

// ---- 0.56: ما رشّحه الأخصائي من مكملات وأعشاب (مع الجرعة والتنبيه)
function suppCard() { const L = S.supps || []; return L.length ? '<section class="card stack"><h3>💊 مكملاتي من أخصائيك</h3>' + L.map((x) => '<div class="supi"><b>' + (x.k === 'h' ? '🌿 ' : '💊 ') + esc(x.n) + '</b>' + (x.dose ? '<div>' + esc(x.dose) + '</div>' : '') + (x.note ? '<div class="dim">' + esc(x.note) + '</div>' : '') + (x.warn ? '<div class="dim">⚠ ' + esc(x.warn) + '</div>' : '') + '</div>').join('') + '<p class="dim">لا تبدأ أو تغيّر جرعة دواء أو مكمل دون الرجوع لطبيبك وأخصائيك. يمكنك ضبط تذكير له من «التذكيرات».</p></section>' : ''; }

// ---- 0.57: أوقات الصلاة تُحسب على الجهاز بلا إنترنت (الهيئة المصرية لمدن مصر، وأم القرى لمدن السعودية)، والصلاة على النبي ﷺ، وخطواتي
const CITIES = [['القاهرة', 30.0444, 31.2357, 'eg'], ['الجيزة', 30.0131, 31.2089, 'eg'], ['الإسكندرية', 31.2001, 29.9187, 'eg'], ['المنصورة', 31.0409, 31.3785, 'eg'], ['طنطا', 30.7865, 31.0004, 'eg'], ['الزقازيق', 30.5877, 31.502, 'eg'], ['أسيوط', 27.1809, 31.1837, 'eg'], ['الأقصر', 25.6872, 32.6396, 'eg'], ['أسوان', 24.0889, 32.8998, 'eg'],
  ['الرياض', 24.7136, 46.6753, 'sa'], ['جدة', 21.4858, 39.1925, 'sa'], ['مكة المكرمة', 21.3891, 39.8579, 'sa'], ['المدينة المنورة', 24.5247, 39.5692, 'sa'], ['الدمام', 26.4207, 50.0888, 'sa'], ['الخبر', 26.2172, 50.1971, 'sa'], ['الطائف', 21.2854, 40.4183, 'sa'], ['أبها', 18.2164, 42.5053, 'sa'], ['تبوك', 28.3835, 36.5662, 'sa'], ['بريدة', 26.326, 43.975, 'sa'], ['الأحساء', 25.3648, 49.5878, 'sa'], ['القطيف', 26.5565, 50.0089, 'sa'], ['الظهران', 26.2361, 50.0393, 'sa'], ['الجبيل', 27.0046, 49.6225, 'sa'], ['حفر الباطن', 28.4328, 45.9708, 'sa'], ['حائل', 27.5114, 41.7208, 'sa'], ['عرعر', 30.9753, 41.0381, 'sa'], ['سكاكا', 29.9697, 40.2064, 'sa'], ['جازان', 16.8892, 42.5511, 'sa'], ['نجران', 17.4917, 44.1322, 'sa'], ['الباحة', 20.0129, 41.4677, 'sa'], ['ينبع', 24.0895, 38.0618, 'sa'], ['الخرج', 24.1554, 47.3346, 'sa'], ['عنيزة', 26.084, 43.994, 'sa'], ['الرس', 25.8695, 43.4973, 'sa'], ['خميس مشيط', 18.3093, 42.7292, 'sa'], ['بيشة', 19.9906, 42.6049, 'sa'], ['العلا', 26.6085, 37.9232, 'sa'], ['المجمعة', 25.9039, 45.3467, 'sa'], ['وادي الدواسر', 20.4731, 44.7894, 'sa']];
const PRN = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
function prayTimes(date, lat, lng, tz, method) {        // خوارزمية موقع الشمس القياسية (PrayTimes)؛ النتيجة بالدقائق من منتصف الليل بتوقيت tz
  const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI, fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  const y = date.getFullYear(), mo = date.getMonth() + 1, dd = date.getDate(), Y = mo <= 2 ? y - 1 : y, M = mo <= 2 ? mo + 12 : mo, A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + dd + B - 1524.5 - lng / 360, D = jd - 2451545;
  const g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360), L = fix(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)), 360), e = 23.439 - 0.00000036 * D;
  const RA = fix(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15, 24), decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt = q / 15 - RA;
  const noon = 12 + tz - lng / 15 - (eqt > 12 ? eqt - 24 : eqt < -12 ? eqt + 24 : eqt);
  const T = (alt) => deg(Math.acos((Math.sin(rad(alt)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat))))) / 15;
  const asrAlt = deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl))))));
  const fa = method === 'sa' ? 18.5 : method === 'eg' ? 19.5 : 18, ia = method === 'eg' ? 17.5 : 17, mg = noon + T(-0.833);
  const m = (h) => Math.round(h * 60), mgm = m(mg) + 1;
  return { fajr: m(noon - T(-fa)), sunrise: m(noon - T(-0.833)), dhuhr: m(noon) + 1, asr: m(noon + T(asrAlt)), maghrib: mgm, isha: method === 'sa' ? mgm + 90 : m(noon + T(-ia)) };
}
const isMus = () => !(S && S.p && (S.p.rel === 'ك' || S.p.rel === 'ن'));                 // 0.61: المسلم (أو من لم يحدّد بعد من العملاء القدامى) فقط يرى الأذان والأذكار والقرآن والصلاة على النبي
function cityOpts(sel) {                                  // مدن مجمّعة بالبلد؛ السعودية أولاً
  const g = (k, t) => '<optgroup label="' + t + '">' + CITIES.filter((c) => c[3] === k).map((c) => '<option' + (sel === c[0] ? ' selected' : '') + '>' + c[0] + '</option>').join('') + '</optgroup>';
  return '<option value="">— اختر —</option>' + g('sa', 'المملكة العربية السعودية') + g('eg', 'مصر');
}
function prNow() { if (!isMus()) return null; const R = S.rem || {}, c = CITIES.find((x) => x[0] === R.prCity); if (!c) return null; const d = new Date(), tz = -d.getTimezoneOffset() / 60; return prayTimes(d, c[1], c[2], tz, c[3]); }
const m2hm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
function prCard() { const P = prNow(); if (!P) return ''; const n = new Date(), cm = n.getHours() * 60 + n.getMinutes(), nx = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].find((k) => P[k] > cm);
  return '<section class="card prc"><div class="row" style="justify-content:space-between"><h3>🕌 مواقيت الصلاة • ' + esc(S.rem.prCity) + '</h3>' + (nx ? '<span class="dim">التالية: ' + PRN[nx] + ' ' + hm12(m2hm(P[nx])) + '</span>' : '') + '</div><div class="prrow">' + ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => '<div class="' + (k === nx ? 'on' : '') + '"><small>' + PRN[k] + '</small><b>' + hm12(m2hm(P[k])) + '</b></div>').join('') + '</div></section>'; }
function stepsWeek() { let tot = 0, nd = 0; for (let i = 0; i < 7; i++) { const L = S.log[dkey(new Date(now() - i * 864e5))], v = L && L.h && +L.h.steps; if (v) { tot += v; nd++; } } return { tot, nd, avg: nd ? Math.round(tot / nd) : 0 }; }

// ---------- مساعدات
function toast(m) { toastMsg = m; clearTimeout(toastT); toastT = setTimeout(() => { toastMsg = ''; render(); }, 3400); render(); }
function bmi() { const w = +S.p.weight, h = +S.p.height / 100; return w && h ? (w / (h * h)).toFixed(1) : '—'; }
function foodsOf(state) { return Object.keys(S.p.food).filter((k) => S.p.food[k] === state); }
function mealsBy(t) { const i = MEALS.findIndex((m) => m[0] === t); return DATA.bank.filter((b) => b[1][i]); }
const dayPlan = (dow) => S.plan[dow % S.plan.length];
const dl = (dow) => { const k = dateFor(dow); return (S.log[k] = S.log[k] || { ck: {}, sw: {}, note: {}, skip: {}, water: 0 }); };
const lineT = (l) => l[2];
function itemsOfDay(d) { let n = 0, done = 0; const L = S.log[dateFor(d)] || { ck: {} }; dayPlan(d).slots.forEach((s, si) => s.lines.forEach((l, li) => { n++; if (L.ck[si + '_' + li]) done++; })); return [done, n]; }
function adhBack(back) { const dt = new Date(now() - back * 86400000), L = S.log[dkey(dt)]; if (!L || !S.plan) return null; let n = 0, done = 0; dayPlan(dt.getDay()).slots.forEach((s, si) => s.lines.forEach((l, li) => { n++; if (L.ck[si + '_' + li]) done++; })); return n ? done / n : null; }
const drInit = () => String(S.dname || 'أ').replace(/^(د\.?|دكتور[ة]?|أ\.)\s*/, '').trim().charAt(0) || 'أ';

// ---------- الشاشات قبل الحساب
function scrBoot() { return '<div class="scr"><div class="boot"><div><div class="logo">' + LOGO + '</div><div class="spin"></div><p>جارٍ فتح دعوتك…</p></div></div></div>'; }
function scrBad() {
  const has = !!localStorage.getItem(KEY);
  return '<div class="scr"><div class="boot"><div class="stack" style="max-width:320px"><div class="logo">' + LOGO + '</div><div class="empty"><div class="ei" style="color:var(--coral)">' + I('alert') + '</div><p class="err">' + esc(V.err) + '</p></div>'
    + (V.retry ? '<button class="btn full" data-act="retry">إعادة المحاولة</button>' : '') + (has ? '<button class="btn sec full" data-act="toLock">لدي حساب على هذا الجوال</button>' : '') + '</div></div></div>';
}
// ---------- شاشات المستخدم الجديد (0.39): بداية حيّة ← 3 قصص تفاعلية ← اختيار الشكل ← (التسجيل) ← أول إنجاز. تظهر مرة واحدة على الجهاز ولها تخطٍّ دائماً.
const ONB_KEY = 'hissati_onb', ONB_IMG = window.HX_ONB || [], RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const onbSeen = () => { if (DEMO) return false; try { return localStorage.getItem(ONB_KEY) === '1'; } catch (e) { return true; } };
function onbDone() { try { localStorage.setItem(ONB_KEY, '1'); } catch (e) { } if (S) S.fw = S.fw || 'pending'; V.onb = null; V.screen = ''; render(); }
const onbPhoto = (i) => ONB_IMG[i] ? '<i class="onb-photo" style="background-image:url(' + ONB_IMG[i] + ')"></i>' : '';
const ONB_PLATE = '<svg viewBox="0 0 200 140" aria-hidden="true"><ellipse cx="100" cy="82" rx="86" ry="46" fill="rgba(255,255,255,.1)" stroke="currentColor" stroke-opacity=".5" stroke-width="2"/><ellipse cx="100" cy="82" rx="62" ry="32" fill="none" stroke="currentColor" stroke-opacity=".25"/><circle cx="78" cy="76" r="17" fill="#ffe9a8"/><circle cx="78" cy="76" r="8" fill="#ffb931"/><circle cx="116" cy="70" r="15" fill="#ffe9a8"/><circle cx="116" cy="70" r="7" fill="#ffb931"/><path d="M62 98c14 8 44 10 76 0" fill="none" stroke="#6fe3a9" stroke-width="7" stroke-linecap="round"/><circle cx="140" cy="94" r="10" fill="#e85d75"/><path d="M140 84c2-6 6-8 9-8" stroke="#6fe3a9" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M58 52c8-14 22-18 30-10" stroke="currentColor" stroke-opacity=".5" fill="none" stroke-width="3" stroke-linecap="round"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M58 52c8-14 22-18 30-10;M58 50c8-16 24-14 30-12;M58 52c8-14 22-18 30-10"/></path></svg>';
const ONB_ALT = ['½ كوب جبن قريش', '30 جم جبنة بيضاء', '3 بيضات مسلوقة'], ONB_ALT2 = ['1 كوب حليب قليل الدسم', '170 جم زبادي سادة', '⅔ كوب لبن رائب'];
function onbBars(i) { return '<div class="onb-bars" aria-hidden="true">' + [1, 2, 3].map((n) => '<i class="' + (n < i ? 'done' : n === i ? 'cur' : '') + '"><b' + (n === i && !RM ? ' class="fill"' : '') + '></b></i>').join('') + '</div>'; }
function scrOnb() {
  const o = V.onb || (V.onb = { i: 0 }), i = o.i;
  if (i === 0) return '<div class="scr onb onb-splash" data-act="onbNext" role="button" aria-label="متابعة"><div class="onb-mesh"><i></i><i></i><i></i></div>' + onbPhoto(0) + '<div class="onb-logo" role="img" aria-label="حصتي">' + LOGO + '</div><p class="onb-tag">مع أخصائيك… خطوة بخطوة</p><button class="onb-skip" data-act="onbSkip">تخطّي</button></div>';
  if (i <= 3) {
    const T = [['خطتك من أخصائيك', 'وجباتك بكمياتها، بدّل ما لا يناسبك بلمسة، وتبقى خطتك متوازنة.'], ['يومك بلمسة', 'الماء والعادات والأذكار… المس وشاهد تقدّمك يمتلئ أمامك.'], ['لست وحدك', 'أخصائيك يتابعك ويراسلك، وتحديات أسبوعية وشهادات تقدير تشجّعك.']][i - 1];
    let art = '';
    if (i === 1) art = '<div class="onb-demo plate" data-onb="plate" role="button" tabindex="0" aria-label="المس الصورة لترى الأصناف">' + ONB_PLATE + '<div class="onb-meal"><b>الإفطار</b><span>2 شريحة توست</span><span class="swp">' + ONB_ALT[0] + '</span><span>' + ONB_ALT2[0] + '</span><button class="btn sm sec" data-onb="swap" aria-label="بدّل الصنف">' + I('swap') + ' بدّل</button></div><em class="onb-hint">المس الصحن</em></div>';
    else if (i === 2) art = '<div class="onb-demo cups"><div class="onb-cup" data-onb="cup" role="button" tabindex="0" aria-label="المس لتملأ الكوب"><svg viewBox="0 0 80 110" aria-hidden="true"><defs><clipPath id="ocp"><path d="M12 8h56l-6 90a8 8 0 0 1-8 7H26a8 8 0 0 1-8-7z"/></clipPath></defs><g clip-path="url(#ocp)"><rect class="ow" x="0" y="100" width="80" height="110" fill="#6aa0ff"/></g><path d="M12 8h56l-6 90a8 8 0 0 1-8 7H26a8 8 0 0 1-8-7z" fill="none" stroke="currentColor" stroke-width="3"/></svg><b class="oc">0 / 4</b></div><div class="onb-heart" data-onb="heart" role="button" tabindex="0" aria-label="المس ليمتلئ القلب">' + heartSvg(0, 1) + '<b class="oh">0%</b></div><em class="onb-hint">المس الكوب والقلب</em></div>';
    else art = '<div class="onb-demo chat"><div class="cb a">أهلاً سارة! أرسلت لك خطة هذا الأسبوع 👋</div><div class="cb typing" aria-hidden="true"><i></i><i></i><i></i></div><div class="cb b">شكراً دكتور! بدأت اليوم 💪</div><div class="cch"><span>تحدي الأسبوع: الماء 8 أكواب</span><div class="bar"><i></i></div></div><div class="cert">🏅<b>شهادة تقدير</b><span>باسمك</span></div></div>';
    return '<div class="scr onb onb-story s' + i + '" data-i="' + i + '"><div class="onb-mesh"><i></i><i></i><i></i></div>' + onbPhoto(i) + onbBars(i) + '<button class="onb-skip" data-act="onbSkip">تخطّي</button><button class="onb-edge l" data-act="onbNext" aria-label="التالي"></button><button class="onb-edge r" data-act="onbPrev" aria-label="السابق"></button>'
      + '<div class="onb-art">' + art + '</div><div class="onb-txt"><h1>' + T[0] + '</h1><p>' + T[1] + '</p>' + (i === 3 ? '<p class="onb-lock">' + I('lock') + ' بياناتك مشفّرة: لا يقرؤها إلا أخصائيك</p>' : '') + '</div><div class="onb-foot"><button class="btn full" data-act="onbNext">' + (i === 3 ? 'لنبدأ' : 'التالي') + '</button><span class="dim" aria-live="polite">الشاشة ' + i + ' من 3</span></div></div>';
  }
  const cur = window.HxTheme ? HxTheme.get() : 'classic', T = [['classic', 'الحالي'], ['rose', 'وردة'], ['pulse', 'نبض'], ['firoz', 'فيروز']];
  return '<div class="scr onb onb-theme"><div class="onb-mesh"><i></i><i></i><i></i></div><button class="onb-skip" data-act="onbFinish">تخطّي</button><div class="onb-txt" style="margin-top:56px"><h1>اختر الشكل الذي يريحك</h1><p>تقدر تغيّره لاحقاً من «تقدّمي». خطتك وبياناتك لا تتغير.</p></div><div class="hx-themes" role="radiogroup" aria-label="مظهر التطبيق">'
    + T.map((t) => '<button class="hx-th" role="radio" aria-checked="' + (cur === t[0]) + '" data-act="theme" data-v="' + t[0] + '"><span class="hx-pv" data-theme="' + t[0] + '" aria-hidden="true"><i class="h"></i><i class="k"><b></b></i><i class="k s"></i><i class="c"></i></span><span class="hx-tl">' + t[1] + (cur === t[0] ? ' ✓' : '') + '</span></button>').join('') + '</div><div class="onb-foot"><button class="btn full" data-act="onbFinish">ابدأ</button></div></div>';
}
function onbNextStage(d) { const o = V.onb || (V.onb = { i: 0 }); o.i = Math.max(1, Math.min(4, o.i + d)); render(); }
// أحداث العروض التفاعلية (تعدّل العناصر مباشرة بلا إعادة رسم فلا تتوقف حركتها)
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-onb]'); if (!el) return; const k = el.dataset.onb, root = el.closest('.onb-demo') || el;
  if (k === 'plate') { if (e.target.closest('[data-onb="swap"]')) return; root.classList.toggle('open'); }
  else if (k === 'swap') { const a = root.querySelector('.swp'), b = a.nextElementSibling, n = ((+root.dataset.n || 0) + 1) % 3; root.dataset.n = n; a.textContent = ONB_ALT[n]; b.textContent = ONB_ALT2[n]; a.classList.remove('flash'); void a.offsetWidth; a.classList.add('flash'); }
  else if (k === 'cup') { const n = Math.min(4, (+el.dataset.n || 0) + 1); el.dataset.n = n; el.querySelector('.ow').setAttribute('y', String(100 - 88 * n / 4)); el.querySelector('.oc').textContent = n + ' / 4'; el.classList.toggle('full', n >= 4); if (n >= 4 && navigator.vibrate) try { navigator.vibrate([12, 40, 18]); } catch (x) { } }
  else if (k === 'heart') { const p = Math.min(1, (+el.dataset.p || 0) + 0.25); el.dataset.p = p; el.querySelector('.heart').outerHTML = heartSvg(p, 1); el.querySelector('.oh').textContent = Math.round(p * 100) + '%'; el.classList.toggle('full', p >= 1); }
});
// القصص: تقدّم تلقائي بانتهاء حركة الشريط، إيقاف بالضغط المطوّل، سحب أفقي للتنقل
document.addEventListener('animationend', (e) => { if (e.target.matches && e.target.matches('.onb-bars .fill') && V.screen === 'onb') onbNextStage(1); });
let onbP = null;
document.addEventListener('pointerdown', (e) => { const st = e.target.closest && e.target.closest('.onb-story'); if (!st || e.target.closest('button,[data-onb]')) return; onbP = { x: e.clientX, t: setTimeout(() => { st.classList.add('hold'); onbP && (onbP.held = 1); }, 220) }; }, { passive: true });
const onbUp = (e) => { if (!onbP) return; clearTimeout(onbP.t); const st = document.querySelector('.onb-story'); if (st) st.classList.remove('hold'); const dx = e.clientX - onbP.x; onbP = null; if (Math.abs(dx) > 48 && V.screen === 'onb') onbNextStage(dx > 0 ? 1 : -1); };
document.addEventListener('pointerup', onbUp, { passive: true }); document.addEventListener('pointercancel', () => { if (onbP) { clearTimeout(onbP.t); onbP = null; const st = document.querySelector('.onb-story'); if (st) st.classList.remove('hold'); } }, { passive: true });
let onbT = 0; function onbSplashTimer() { if (V.screen === 'onb' && V.onb && V.onb.i === 0) { if (!onbT) onbT = setTimeout(() => { onbT = 0; if (V.screen === 'onb' && V.onb && V.onb.i === 0) onbNextStage(1); }, RM ? 1400 : 2600); } else { clearTimeout(onbT); onbT = 0; } }
// أول إنجاز بعد التسجيل: كوب ماء واحد ← احتفال وسلسلة اليوم الأول ← بعدها فقط يُعرض التثبيت والإشعارات
function firstWinCard() {
  return '<section class="card firstwin"><div class="fw-cup" aria-hidden="true">' + I('drop') + '</div><div><h2>ابدأ يومك: اشرب أول كوب ماء</h2><p class="dim">خطوة صغيرة تبدأ بها سلسلتك. المس الزر بعد أن تشرب.</p></div><button class="btn full" data-act="firstWin">' + I('drop') + ' شربت أول كوب</button></section>';
}
function scrStart() {                               // بلا حساب ولا رابط (مثل فتح التطبيق المثبّت أول مرة): رمز الدعوة أو رمز النقل
  return '<div class="scr"><div class="scroll"><div class="stack" style="padding-top:22px"><div class="logo" style="width:180px;margin:0 auto;color:#fff">' + LOGO + '</div>'
    + '<section class="card stack"><h3>لديّ رابط دعوة من أخصائيي</h3><p class="dim">ألصق الرابط أو رمز الدعوة كما وصلك على واتساب.</p><input class="inp" id="invIn" dir="ltr" autocomplete="off" placeholder="https://… أو رمز الدعوة"><button class="btn" data-act="useInv">متابعة</button></section>'
    + '<section class="card stack"><h3>لديّ حساب في متصفح أو جوال آخر</h3><p class="dim">من «حصتي» القديم: تقدّمي ← «نقل حسابي» ← انسخ الرمز وألصقه هنا.</p><input class="inp" id="xferIn" dir="ltr" autocomplete="off" placeholder="HX1-…"><button class="btn sec" data-act="useXfer"' + (V.busy ? ' disabled' : '') + '>' + (V.busy ? 'جارٍ النقل…' : 'نقل حسابي إلى هنا') + '</button></section>'
    + (V.err ? '<p class="err">' + esc(V.err) + '</p>' : '') + '</div></div></div>';
}
function scrMoved() { return '<div class="scr"><div class="boot"><div class="stack" style="max-width:320px"><div class="empty"><div class="ei" style="background:rgba(111,227,169,.15);color:var(--mint)">' + I('check') + '</div><h1>انتقل حسابك ✓</h1><p class="mut">صار «حصتي» يعمل من التطبيق المثبّت أو الجوال الجديد، ومُسح من هنا. افتح «حصتي» من أيقونته.</p></div></div></div></div>'; }
// ---- 0.61: أول تسجيل: الديانة ثم التذكيرات التي يريدها العميل (لئلا يبحث عنها في الإعدادات)
function scrSetup() {
  const U = V.setup = V.setup || { rel: '', city: '', on: { water: 1, meals: 1, pray: 1, adhAm: 1, adhPm: 1, sal: 1, med: 0 } }, mus = U.rel === 'م';
  const row = (k, t, d) => '<label class="remrow"><span><b>' + t + '</b><span class="dim">' + d + '</span></span><input type="checkbox" class="sw" data-act="setupTog" data-v="' + k + '"' + (U.on[k] ? ' checked' : '') + '></label>';
  const rel = (v, t) => '<button class="chip' + (U.rel === v ? ' on' : '') + '" data-act="setupRel" data-v="' + v + '">' + t + '</button>';
  return '<div class="scr setup"><div class="scroll"><div class="stack"><div style="padding-top:18px"><h1>نجهّز تطبيقك</h1><p class="mut">اختر ما يناسبك فتصلك التذكيرات التي تريدها دون أن تبحث عنها. تغيّر كل شيء لاحقاً من «تقدّمي».</p></div>'
    + '<section class="card stack"><h3>' + I('user') + ' ديانتك</h3><div class="chips">' + rel('م', 'مسلم') + rel('ك', 'مسيحي') + rel('ن', 'أفضّل عدم التحديد') + '</div>'
    + (mus ? '<div class="banner info">' + I('check') + '<span>سنفعّل لك تلقائياً: مواقيت الصلاة وتذكيرها، وأذكار الصباح والمساء، ورسائل القرآن.</span></div>' : U.rel ? '<p class="dim">لن تظهر لك مواقيت الصلاة ولا الأذكار ولا القرآن.</p>' : '') + '</section>'
    + (mus ? '<section class="card stack"><h3>🕌 مدينتك للأذان</h3><select class="inp" id="setupCity" aria-label="مدينتك">' + cityOpts(U.city) + '</select><p class="dim">المواقيت تُحسب على جوالك بلا إنترنت (أم القرى للسعودية، والهيئة المصرية لمصر).</p></section>' : '')
    + '<section class="card stack"><h3>' + I('bell') + ' التذكيرات</h3>' + row('water', 'شرب الماء', 'كل ساعتين نهاراً') + row('meals', 'مواعيد الوجبات', 'في أوقات وجبات خطتك') + row('med', 'موعد الدواء', 'تضيف أوقات أدويتك لاحقاً من «تقدّمي»')
    + (mus ? row('pray', '🕌 مواقيت الصلاة', U.city ? 'تذكير عند كل صلاة في ' + esc(U.city) : 'اختر مدينتك أولاً') + row('adhAm', 'أذكار الصباح', 'كل يوم 6:00 صباحاً') + row('adhPm', 'أذكار المساء', 'كل يوم 5:30 مساءً') + row('sal', 'ﷺ الصلاة على النبي', 'مساءً، والجمعة ثلاث مرات') : '') + '<p class="dim">تحتاج تفعيل الإشعارات ليصلك التذكير والتطبيق مغلق؛ نطلب الإذن عند التشغيل.</p></section>'
    + '<button class="btn full" data-act="setupGo"' + (U.rel ? '' : ' disabled') + '>متابعة</button><button class="btn ghost full" data-act="setupSkip">تخطّي</button></div></div></div>';
}
function setupApply(skip) {
  const U = V.setup || {}; if (!skip && U.rel) {
    const mus = U.rel === 'م'; S.p.rel = U.rel; S.rem = Object.assign({ water: false, meals: false }, S.rem, { water: !!U.on.water, meals: !!U.on.meals, med: !!U.on.med });
    Object.assign(S.rem, mus ? { prCity: U.city || '', pray: !!U.on.pray && !!U.city, adhAm: !!U.on.adhAm, adhPm: !!U.on.adhPm, sal: !!U.on.sal } : { pray: false, adhAm: false, adhPm: false, sal: false });
    if (mus && U.city) { const c = CITIES.find((x) => x[0] === U.city); if (c && S.rem.prCity === U.city) S.rem.prCity = U.city; }
  }
  S.screen = 'wizard'; S.step = 1; V.setup = null; save(); remSync(true);
}
function scrInvite() {
  const c = S.cat || {};
  return '<div class="scr"><div class="scroll"><div class="invite">'
    + '<div class="logo">' + LOGO + '</div>'
    + '<div class="card dr"><div class="av">' + esc(drInit()) + '</div><div><b>' + esc(S.dname) + '</b>' + (c.clinic ? '<div class="dim">' + esc(c.clinic) + '</div>' : '') + '<div class="mut" style="font-size:14px;margin-top:4px">يدعوك لبدء خطتك الغذائية على «حصتي»</div></div></div>' + (['ios', 'inapp'].indexOf(installState()) >= 0 ? installCard('invite') : '')
    + '<div class="feats">'
    + feat('user', 'سجّل بياناتك مرة واحدة', 'خمس خطوات قصيرة، ويُحفظ ما تكتبه تلقائياً.')
    + feat('heart', 'اختر ما تحب وما لا تحب', 'ما لا تحبه لا يظهر في خطتك.')
    + feat('cal', 'خطتك في جوالك', 'يرسلها أخصائيك هنا يوماً بيوم.')
    + feat('check', 'تابع يومك بلمسة', 'علّم ما أكلته، وبدّل بما يناسبك من نفس المجموعة.')
    + feat('lock', 'بياناتك مشفّرة', 'لا يقرؤها إلا أخصائيك، وتُقفل على جوالك برمز دخول.')
    + '</div></div></div>'
    + '<div class="foot"><button class="btn full" data-act="go" data-v="pin">' + (installState() === 'ios' ? 'التسجيل هنا في Safari' : 'ابدأ التسجيل') + '</button></div></div>';
}
function feat(i, t, d) { return '<div class="feat"><span class="fi">' + I(i) + '</span><div><b>' + t + '</b><div class="dim">' + d + '</div></div></div>'; }
function pad(cur) {
  const dots = [0, 1, 2, 3].map((i) => '<span class="' + (cur.length > i ? 'f' : '') + '">' + (cur.length > i ? '•' : '') + '</span>').join('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => k ? '<button data-act="pin" data-v="' + k + '" aria-label="' + (k === '⌫' ? 'حذف' : k) + '"' + (V.busy ? ' disabled' : '') + '>' + k + '</button>' : '<span></span>').join('');
  return '<div class="pin" aria-label="الرمز">' + dots + '</div><div class="pad">' + keys + '</div>';
}
function scrPin() {
  const conf = !!V.pin1;
  return '<div class="scr">' + head(conf ? 'أعد كتابة الرمز' : V.xfer ? 'رمز الدخول لهذا الجهاز' : 'أنشئ رمز الدخول', 'pinBack', '') + '<div class="scroll"><div class="stack" style="text-align:center;padding-top:20px;gap:22px">'
    + '<p class="mut">' + (conf ? 'للتأكيد، اكتب الرمز نفسه مرة ثانية.' : 'رمز من 4 أرقام تفتح به «حصتي» على هذا الجوال. بلا بريد ولا كلمة سر طويلة.') + '</p>'
    + pad(V.pin) + (V.err ? '<p class="err">' + esc(V.err) + '</p>' : '') + (V.busy ? '<div class="spin"></div><p class="dim">جارٍ إنشاء حسابك المشفّر…</p>' : '<p class="dim">إن غيّرت جوالك يرسل لك أخصائيك رابطاً جديداً.</p>') + '</div></div></div>';
}
function scrLock() {
  const r = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })(), wait = V.until > now() ? Math.ceil((V.until - now()) / 1000) : 0;
  return '<div class="scr"><div class="scroll"><div class="stack" style="text-align:center;padding-top:34px;gap:22px"><div class="logo" style="width:170px;margin:0 auto;color:#fff">' + LOGO + '</div>'
    + '<p class="mut">اكتب رمز الدخول' + (r.dn ? ' — خطتك مع ' + esc(r.dn) : '') + '</p>' + pad(V.pin)
    + (wait ? '<p class="err">محاولات كثيرة. انتظر ' + wait + ' ثانية.</p>' : V.err ? '<p class="err">' + esc(V.err) + '</p>' : '') + (V.busy ? '<div class="spin"></div>' : '')
    + '<button class="link" data-act="forgot">نسيت الرمز؟</button></div></div></div>';
}
function head(t, act, v, sub) { return '<div class="hd"><button class="back" data-act="' + act + '" data-v="' + v + '" aria-label="رجوع">' + I('back') + '</button><div class="t">' + (sub ? '<div class="stepk">' + sub + '</div>' : '') + '<h2>' + t + '</h2></div></div>'; }
// ---------- الاستبيان: يُعرض كما أعدّه الأخصائي (يصل مع الدعوة؛ HForms يكمّل ما ينقصه). نظامان: الحصص (ex) والجرامات (g)
let FS = [], SYS = 'ex';
function mkForm() { const f = HForms.normalize(S.cat && S.cat.form, S.cat && S.cat.form && S.cat.form.sys); SYS = f.sys; FS = HForms.visibleSteps(f); }
const vq = (st) => st.q.filter((q) => !q.hide);
const lab = (q, forId) => (forId ? '<label for="' + forId + '">' : '<span class="lbl">') + esc(q.label) + (q.req ? ' <span class="req">*</span>' : '') + (forId ? '</label>' : '</span>') + (q.help ? '<div class="dim">' + esc(q.help) + '</div>' : '');
function inp(k, label, type, extra) { const nm = type === 'number', ph = type === 'tel'; return '<div class="field"><label for="f_' + k + '">' + label + '</label><input class="inp" id="f_' + k + '" data-bind="' + k + '" type="' + (nm ? 'text' : type || 'text') + '"' + (nm ? ' data-numf="1" autocomplete="off"' : ph ? ' data-tel="1"' : '') + ' value="' + esc(S.p[k]) + '" ' + (extra || '') + '></div>'; }
function toggles(key, list, sel) { sel = sel || S.p[key]; return '<div class="chips">' + list.map((x) => '<button class="chip' + (sel.includes(x) ? ' on' : '') + '" data-act="tog" data-k="' + key + '" data-v="' + esc(x) + '">' + (sel.includes(x) ? I('check') : '') + esc(x) + '</button>').join('') + '</div>'; }
const seg = (k, vals, cur, labels) => '<div class="segc">' + vals.map((x, i) => '<button class="' + (String(cur) === String(x) ? 'on' : '') + '" data-act="set" data-k="' + k + '" data-v="' + esc(x) + '">' + esc(labels ? labels[i] : x) + '</button>').join('') + '</div>';
const dayTypes = () => (S.cat && S.cat.dayTypes) || ['راحة', 'تدريب خفيف', 'تدريب متوسط', 'تدريب ثقيل'];
function sched() { if (!Array.isArray(S.p.sched) || S.p.sched.length !== 7) S.p.sched = Array.from({ length: 7 }, () => ({ type: dayTypes()[0], min: 0, time: '' })); return S.p.sched; }
const BQ = {                                       // الأسئلة الأساسية: عرض بنص الأخصائي، وحفظ في حقل ثابت يفهمه «حصة»
  name: (q) => inp('name', esc(q.label), 'text', 'autocomplete="name"'),
  phone: (q) => inp('phone', esc(q.label), 'tel', 'inputmode="tel" dir="ltr"'),
  sex: (q) => '<div class="field">' + lab(q) + seg('sex', ['أنثى', 'ذكر'], S.p.sex) + '</div>',
  age: (q) => inp('age', esc(q.label), 'number', 'inputmode="numeric"'),
  weight: (q) => inp('weight', esc(q.label), 'number', 'inputmode="decimal"'),
  height: (q) => inp('height', esc(q.label), 'number', 'inputmode="numeric"'),
  bf: (q) => inp('bf', esc(q.label), 'number', 'inputmode="decimal" placeholder="اختياري"'),
  sport: (q) => inp('sport', esc(q.label), 'text', 'placeholder="مثال: كمال أجسام، كرة قدم، جري"'),
  act: (q) => '<div class="field">' + lab(q) + '<div class="acts">' + DATA.activity.map((a, i) => '<button class="act' + (S.p.act === i ? ' on' : '') + '" data-act="set" data-k="act" data-v="' + i + '"><span class="bars">' + [0, 1, 2, 3, 4].map((j) => '<i class="' + (j <= i ? 'f' : '') + '" style="height:' + (6 + j * 4) + 'px"></i>').join('') + '</span><span>' + esc(a) + '</span></button>').join('') + '</div></div>',
  goal: (q) => '<div class="field">' + lab(q) + '<div class="chips">' + DATA.goals.map((g, i) => '<button class="chip' + (S.p.goal === i ? ' on' : '') + '" data-act="set" data-k="goal" data-v="' + i + '">' + esc(g.replace(/[−+]\d+/, '').trim()) + '</button>').join('') + '</div></div>',
  gphase: (q) => '<div class="field">' + lab(q) + '<div class="chips">' + ((S.cat && S.cat.phases) || []).map((g) => '<button class="chip' + (S.p.gphase === g ? ' on' : '') + '" data-act="set" data-k="gphase" data-v="' + esc(g) + '">' + esc(g) + '</button>').join('') + '</div></div>',
  cond: (q) => '<div class="banner info">' + I('lock') + '<span>بياناتك الصحية تُشفَّر على جوالك ولا يقرؤها إلا أخصائيك.</span></div><div class="field">' + lab(q) + toggles('cond', DATA.conditions) + '</div>',
  allg: (q) => '<div class="field">' + lab(q) + toggles('allg', DATA.allergens) + '</div>',
  meds: (q) => '<div class="field">' + lab(q, 'f_meds') + '<textarea class="inp" id="f_meds" data-bind="meds" placeholder="مثال: ميتفورمين 500 ملغ مرتين يومياً">' + esc(S.p.meds) + '</textarea></div>',
  supp: (q) => '<div class="field">' + lab(q, 'f_supp') + '<textarea class="inp" id="f_supp" data-bind="supp" placeholder="مثال: واي بروتين بعد التمرين، كرياتين 5 جم">' + esc(S.p.supp) + '</textarea></div>',
  notes: (q) => '<div class="field">' + lab(q, 'f_notes') + '<textarea class="inp" id="f_notes" data-bind="notes" placeholder="مثال: أعمل بنظام مناوبات ليلية">' + esc(S.p.notes) + '</textarea></div>',
  meals: (q) => '<p class="mut">' + esc(q.label) + '</p>' + MEALS.map((m) => {
    const opts = mealsBy(m[0]), used = S.p.like[m[0]].concat(S.p.nope[m[0]]);
    const sel = (kind, label) => '<select class="inp" data-act="pickmeal" data-k="' + kind + '" data-v="' + m[0] + '" aria-label="' + label + ' ' + m[1] + '"><option value="">' + label + '</option>' + opts.filter((o) => !used.includes(o[0])).map((o) => '<option>' + esc(o[0]) + '</option>').join('') + '</select>';
    const card = (n, kind) => { const b = DATA.bank.find((x) => x[0] === n) || [n, [], '']; return '<div class="pk ' + kind + '">' + I(kind === 'like' ? 'up' : 'down') + '<div class="tx"><b>' + esc(n) + '</b><small>' + esc(b[2]) + '</small></div><button class="x" data-act="unmeal" data-k="' + (kind === 'like' ? 'like' : 'nope') + '" data-m="' + m[0] + '" data-v="' + esc(n) + '" aria-label="إزالة">' + I('x') + '</button></div>'; };
    return '<section class="card msec"><div class="mhd"><span class="mi">' + I(m[2]) + '</span><h3>' + m[1] + '</h3><span class="dim">' + opts.length + ' وجبة</span></div>'
      + sel('like', '＋ وجبة أحبها') + '<div class="pick">' + S.p.like[m[0]].map((n) => card(n, 'like')).join('') + '</div>'
      + sel('nope', '－ وجبة لا أريدها') + '<div class="pick">' + S.p.nope[m[0]].map((n) => card(n, 'nope')).join('') + '</div></section>';
  }).join(''),
  foods: (q) => '<p class="mut">' + esc(q.label) + ': <b style="color:var(--mint)">أحب</b> ثم <b style="color:var(--coral)">لا أحب</b> ثم رجوع.</p>'
    + '<div class="legend"><span><i class="dot" style="background:var(--mint)"></i>أحب ' + foodsOf('love').length + '</span><span><i class="dot" style="background:var(--coral)"></i>لا أحب ' + foodsOf('no').length + '</span></div>' + foodGrid('foodCat', 'foodQ'),
  wake: (q) => '<div class="field">' + lab(q, 'f_wake') + '<input class="inp" id="f_wake" type="time" data-bind="wake" value="' + esc(S.p.wake) + '"></div>',
  sleep: (q) => '<div class="field">' + lab(q, 'f_sleep') + '<input class="inp" id="f_sleep" type="time" data-bind="sleep" value="' + esc(S.p.sleep) + '"></div>',
  nmeals: (q) => '<div class="field">' + lab(q) + seg('nmeals', SYS === 'g' ? [3, 4, 5, 6, 7] : [3, 4, 5, 6], S.p.nmeals) + '</div>',
  wdays: (q) => '<div class="field">' + lab(q) + '<div class="chips">' + DATA.dayNames.map((d, i) => '<button class="chip' + (S.p.wdays.includes(i) ? ' on' : '') + '" data-act="wday" data-v="' + i + '">' + esc(d) + '</button>').join('') + '</div></div>',
  train: (q) => '<p class="mut">' + esc(q.label) + '</p><div class="trows">' + sched().map((x, i) => {
    const rest = x.type === dayTypes()[0];
    return '<div class="trow' + (rest ? ' rest' : '') + '"><b>' + esc(DATA.dayNames[i]) + '</b><select class="inp" data-sch="' + i + '" aria-label="نوع يوم ' + esc(DATA.dayNames[i]) + '">' + dayTypes().map((t) => '<option' + (t === x.type ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>'
      + (rest ? '' : '<input class="inp" data-schm="' + i + '" data-numf="1" inputmode="numeric" placeholder="دقائق" value="' + esc(x.min || '') + '" aria-label="مدة التدريب بالدقائق"><input class="inp" type="time" data-scht="' + i + '" value="' + esc(x.time || '') + '" aria-label="وقت التدريب">') + '</div>';
  }).join('') + '</div><div class="banner info">' + I('clock') + '<span>يحسب أخصائيك سعرات كل يوم وكربوهيدراته حسب نوع التدريب ومدته.</span></div>'
};
function cqHtml(q) {                               // الأسئلة المخصّصة (يضيفها الأخصائي)
  const v = (S.p.cq || {})[q.id], id = 'cq_' + q.id;
  if (q.type === 'text') return '<div class="field">' + lab(q, id) + '<input class="inp" id="' + id + '" data-cq="' + q.id + '" value="' + esc(v || '') + '"></div>';
  if (q.type === 'long') return '<div class="field">' + lab(q, id) + '<textarea class="inp" id="' + id + '" data-cq="' + q.id + '">' + esc(v || '') + '</textarea></div>';
  if (q.type === 'num') return '<div class="field">' + lab(q, id) + '<div class="row"><input class="inp" id="' + id + '" data-cq="' + q.id + '" data-numf="1" inputmode="decimal" value="' + esc(v || '') + '" style="flex:1">' + (q.unit ? '<span class="dim">' + esc(q.unit) + '</span>' : '') + '</div></div>';
  const btn = (val, text, on, act) => '<button class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-k="' + q.id + '" data-v="' + esc(val) + '">' + (on ? I('check') : '') + esc(text) + '</button>';
  if (q.type === 'one') return '<div class="field">' + lab(q) + '<div class="chips">' + q.opts.map((o) => btn(o, o, v === o, 'cq1')).join('') + '</div></div>';
  if (q.type === 'many') return '<div class="field">' + lab(q) + '<div class="chips">' + q.opts.map((o) => btn(o, o, (v || []).includes(o), 'cqm')).join('') + '</div></div>';
  if (q.type === 'yn') return '<div class="field">' + lab(q) + '<div class="segc">' + [['y', 'نعم'], ['n', 'لا']].map((o) => '<button class="' + (v === o[0] ? 'on' : '') + '" data-act="cq1" data-k="' + q.id + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div></div>';
  if (q.type === 'scale') return '<div class="field">' + lab(q) + '<div class="segc">' + [1, 2, 3, 4, 5].map((n) => '<button class="' + (String(v) === String(n) ? 'on' : '') + '" data-act="cq1" data-k="' + q.id + '" data-v="' + n + '">' + n + '</button>').join('') + '</div></div>';
  return '';
}
function stepOk(st) {
  return vq(st).every((q) => {
    if (q.b) { if (q.id === 'name' || q.id === 'phone') return !!String(S.p[q.id] || '').trim(); if (q.id === 'age' || q.id === 'weight' || q.id === 'height') return +S.p[q.id] > 0; return true; }
    return !q.req || HForms.answered(q, (S.p.cq || {})[q.id]);
  });
}
const WHY = { weight: 'وزنك وطولك يضبطان كمياتك بدقة', height: 'وزنك وطولك يضبطان كمياتك بدقة', act: 'نشاطك يحدّد سعراتك اليومية', goal: 'هدفك يرسم شكل خطتك', cond: 'حالتك الصحية تجعل الخطة آمنة لك', allg: 'حتى لا يظهر في خطتك ما يضرّك', meds: 'بعض الأدوية تؤثر على الأكل', foods: 'ما لا تحبه لا يظهر في خطتك', sleep: 'نومك ووقتك يساعدان في توقيت وجباتك', wake: 'نومك ووقتك يساعدان في توقيت وجباتك' };
function scrWizard() {
  mkForm(); const N = FS.length; if (S.step > N) S.step = N; const s = S.step, st = FS[s - 1];
  const body = vq(st).map((q) => q.b ? (BQ[q.id] ? BQ[q.id](q) : '') : cqHtml(q)).join('');
  return '<div class="scr">' + head(esc(st.t), 'step', s - 1, 'الخطوة ' + s + ' من ' + N)
    + '<div class="prog"><i style="width:' + Math.round(s / N * 100) + '%"></i></div>'
    + '<div class="scroll"><div class="stack">' + (() => { const w = [...new Set(vq(st).filter((q) => q.b && WHY[q.id]).map((q) => WHY[q.id]))]; return w.length ? '<p class="why" role="note">' + I('lock') + ' لماذا نسأل؟ ' + w.join(' • ') + '</p>' : ''; })() + (s === 1 && S.req === 'changes' && S.reqMsg ? '<div class="banner warn">' + I('msg') + '<span><b>' + esc(S.dname) + ':</b> ' + esc(S.reqMsg) + '</span></div>' : '') + body + '</div></div>'
    + '<div class="foot"><button class="btn full" data-act="step" data-v="' + (s + 1) + '" ' + (stepOk(st) ? '' : 'disabled') + '>' + (s === N ? 'مراجعة' : 'التالي') + '</button></div></div>';
}
function foodGrid(catKey, qKey) {
  const cats = foodCats(), cat = Math.min(S[catKey] || 0, cats.length - 1), q = (S[qKey] || '').trim();
  const list = DATA.foods.filter((f) => (q ? f[0].includes(q) : cats[cat][1].includes(f[1])));
  const tabs = '<div class="tabs" role="tablist">' + cats.map((c, i) => '<button class="' + (i === cat && !q ? 'on' : '') + '" data-act="cat" data-k="' + catKey + '" data-v="' + i + '">' + esc(c[0]) + '</button>').join('') + '</div>';
  const grid = '<div class="fgrid">' + list.slice(0, 80).map((f) => { const st = S.p.food[f[0]]; return '<button class="food ' + (st || '') + '" data-act="food" data-v="' + esc(f[0]) + '" aria-pressed="' + (st ? 'true' : 'false') + '">' + (st === 'love' ? I('up') : st === 'no' ? I('down') : '') + esc(f[0]) + '</button>'; }).join('') + (list.length ? '' : '<p class="dim">لا صنف بهذا الاسم.</p>') + '</div>';
  return '<label class="srch">' + I('sparkle') + '<input id="fq_' + catKey + '" data-q="' + qKey + '" placeholder="ابحث عن صنف…" value="' + esc(S[qKey]) + '"></label>' + tabs + grid;
}
function foodCats() { return S.cat && S.cat.fcats ? S.cat.fcats.map((n, i) => [n, [i]]) : CATS; }   // نظام الجرامات: فئات أغذيته
function bqText(q) {                               // نص الإجابة الأساسية في شاشة المراجعة
  const p = S.p, lk = foodsOf('love'), no = foodsOf('no');
  switch (q.id) {
    case 'weight': return p.weight ? p.weight + ' كجم (مؤشر الكتلة ' + bmi() + ')' : ''; case 'height': return p.height ? p.height + ' سم' : ''; case 'age': return p.age ? p.age + ' سنة' : '';
    case 'bf': return p.bf ? p.bf + '%' : ''; case 'act': return DATA.activity[p.act] || ''; case 'goal': return (DATA.goals[p.goal] || '').replace(/[−+]\d+/, '').trim();
    case 'cond': return p.cond.join('، ') || 'لا'; case 'allg': return p.allg.join('، ') || 'لا';
    case 'meals': { const ml = MEALS.reduce((a, m) => a + p.like[m[0]].length, 0), mn = MEALS.reduce((a, m) => a + p.nope[m[0]].length, 0); return ml + ' وجبة تحبها • ' + mn + ' لا تريدها'; }
    case 'foods': return 'تحب: ' + (lk.slice(0, 6).join('، ') || '—') + (lk.length > 6 ? ' و' + (lk.length - 6) + ' غيرها' : '') + ' • لا تحب: ' + (no.slice(0, 6).join('، ') || '—');
    case 'nmeals': return p.nmeals + ' وجبات'; case 'wdays': return p.wdays.map((i) => DATA.dayNames[i]).join('، ') || 'لا تمرين';
    case 'train': { const t = sched().map((x, i) => x.type === dayTypes()[0] ? '' : DATA.dayNames[i] + ': ' + x.type + (x.min ? ' ' + x.min + 'د' : '') + (x.time ? ' ' + x.time : '')).filter(Boolean); return t.length ? t.join(' • ') : 'لا تدريب'; }
    default: return String(p[q.id] == null ? '' : p[q.id]);
  }
}
function scrReview() {
  mkForm(); const N = FS.length;
  const sec = (st, i) => '<section class="card rv"><div class="rh"><h3>' + esc(st.t) + '</h3><button class="link" data-act="step" data-v="' + (i + 1) + '">تعديل</button></div><dl class="kv">'
    + vq(st).map((q) => { const t = q.b ? bqText(q) : HForms.answerText(q, (S.p.cq || {})[q.id]); return t ? '<dt>' + esc(q.label) + '</dt><dd' + (q.id === 'phone' ? ' dir="ltr" style="text-align:right"' : '') + '>' + esc(t) + '</dd>' : ''; }).join('') + '</dl></section>';
  return '<div class="scr">' + head('راجع بياناتك', 'step', N) + '<div class="scroll"><div class="stack">' + FS.map(sec).join('')
    + '<label class="consent"><input type="checkbox" id="consent" data-act="consent" ' + (S.consent ? 'checked' : '') + '><span>أوافق على حفظ بياناتي الصحية مشفّرة ومشاركتها مع ' + esc(S.dname) + ' فقط لإعداد خطتي ومتابعتي.</span></label>'
    + '</div></div><div class="foot"><button class="btn full" data-act="submit" ' + (S.consent && !V.busy ? '' : 'disabled') + '>' + I('send') + (V.busy ? ' جارٍ الإرسال…' : ' أرسل إلى أخصائيك') + '</button></div></div>';
}
function intakeQA() { mkForm(); const out = []; FS.forEach((st) => vq(st).forEach((q) => { if (q.b) return; const t = HForms.answerText(q, (S.p.cq || {})[q.id]); if (t) out.push([q.label, t]); })); return out; }
// ---------- «اختيار نظامي» (0.42): أسئلة قصيرة — سؤال واحد في كل صفحة — ثم الأمثل + بديلان من مكتبة أخصائيك مع المتوقع
if (window.RL && window.READYLIB_INDEX) RL.use(window.READYLIB_INDEX);
const rqBase = () => ({ sex: S.p.sex, age: +numOnly(String(S.p.age || '')) || 0, weight: +numOnly(String(S.p.weight || '')) || 0, height: +numOnly(String(S.p.height || '')) || 0, act: S.p.act != null && S.p.act !== '' ? +S.p.act : null });
const rqQs = () => RL.questions(S.rq.a, rqBase());
function rqCard(compact) {
  if (!window.RL || !RL.idx) return '';
  const rq = S.rq, pk = rq && rq.pick && RL.plan(rq.pick);
  if (rq && rq.sentAt) return '<section class="card rqcard"><b>' + I('check') + ' أرسلت اختياراتك لأخصائيك</b><p class="dim">' + (pk ? 'اخترت: ' + esc(RL.label(pk)) : 'سيختار لك أخصائيك النظام الأنسب') + '</p><button class="link" data-act="rqStart">تعديل الإجابات</button></section>';
  return '<section class="card rqcard"><b>🧭 ساعد أخصائيك يختار نظامك</b><p class="dim">' + (compact ? 'أسئلة قصيرة (دقيقة واحدة) نقترح بعدها النظام الأنسب لك من مكتبة أخصائيك.' : 'أجب أسئلة قصيرة — سؤال في كل صفحة — ونقترح لك الأمثل وبديلين مع النتيجة المتوقعة، ثم يعتمد أخصائيك.') + '</p><button class="btn sm" data-act="rqStart">ابدأ (دقيقة واحدة)</button></section>';
}
function scrQuiz() {
  const rq = S.rq, qs = rqQs();
  if (rq.i >= qs.length) return scrQuizRes();
  const q = qs[rq.i], P = RL.norm(rqBase(), rq.a), v = rq.a[q.id], opts = q.type === 'num' ? [] : RL.optsOf(q, rq.a, rqBase());
  const pct = Math.round(rq.i / qs.length * 100);
  let body;
  if (q.type === 'num') body = '<div class="rqnum"><input class="inp" id="rqIn" type="number" inputmode="decimal" min="' + q.min + '" max="' + q.max + '" value="' + esc(v || '') + '" aria-label="' + esc(q.q) + '"><span>' + esc(q.unit || '') + '</span></div>';
  else body = '<div class="rqopts" role="' + (q.type === 'many' ? 'group' : 'radiogroup') + '">' + opts.map((o) => { const on = q.type === 'many' ? (v || []).includes(o[0]) : String(v) === o[0]; return '<button class="rqo' + (on ? ' on' : '') + '" role="' + (q.type === 'many' ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-act="rqOpt" data-v="' + esc(o[0]) + '">' + (o[2] ? '<span class="rqi" aria-hidden="true">' + o[2] + '</span>' : '') + '<span>' + esc(o[1]) + '</span>' + (on ? I('check') : '') + '</button>'; }).join('')
    + (q.type === 'many' ? '<button class="rqo none' + (v && !v.length ? ' on' : '') + '" role="checkbox" aria-checked="' + !!(v && !v.length) + '" data-act="rqOpt" data-v="__none"><span>' + esc(q.none || 'لا شيء') + '</span></button>' : '') + '</div>';
  const can = q.type === 'num' ? +v >= q.min && +v <= q.max : q.type === 'many' ? Array.isArray(v) : v != null && v !== '';
  return '<div class="scr rq">' + head(esc(q.q), 'rqBack', '', 'سؤال ' + (rq.i + 1) + ' من ' + qs.length) + '<div class="rqbar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>'
    + '<div class="scroll"><div class="stack">' + (q.sub ? '<p class="mut">' + esc(q.sub) + '</p>' : '') + body + '</div></div>'
    + (q.type === 'one' ? '' : '<div class="foot"><button class="btn full" data-act="rqNext" ' + (can ? '' : 'disabled') + '>التالي</button></div>') + '</div>';
}
function scrQuizRes() {
  const r = RL.recommend(S.rq.a, rqBase()), li = (a) => a.map((t) => '<li>' + esc(t) + '</li>').join('');
  const cards = r.top.map((x, i) => '<section class="card rqres' + (i === 0 ? ' best' : '') + '"><div class="rqh"><span class="tag">' + (i === 0 ? '⭐ الأنسب لك' : 'بديل ' + i) + '</span><b>' + esc(x.name) + '</b></div><p class="dim">' + esc(x.label) + ' • ' + esc(x.region) + '</p>'
    + '<div class="banner ok">' + I('trend') + '<span><b>المتوقع:</b> ' + esc(x.expect.head || '') + '</span></div><ul class="rqli">' + li(x.expect.lines.slice(0, -1)) + li(x.why) + '</ul>' + (x.caut.length ? '<div class="banner warn">' + I('alert') + '<span>' + x.caut.map(esc).join(' • ') + '</span></div>' : '')
    + '<button class="btn ' + (i === 0 ? '' : 'sec ') + 'full" data-act="rqPick" data-v="' + esc(x.id) + '">' + (S.rq.pick === x.id ? I('check') + ' اخترته' : 'أختار هذا النظام') + '</button></section>').join('');
  return '<div class="scr rq">' + head('نظامك المقترح', 'rqBack', '', 'من مكتبة أخصائيك') + '<div class="scroll"><div class="stack">'
    + r.refer.map((t) => '<div class="banner warn">' + I('alert') + '<span>' + esc(t) + '</span></div>').join('') + r.warn.map((t) => '<div class="banner info">' + I('alert') + '<span>' + esc(t) + '</span></div>').join('')
    + cards + '<p class="dim small">الأرقام تقديرية للاسترشاد؛ أخصائيك يراجع اختيارك ويعتمده أو يعدّله، ثم تصلك خطتك هنا.</p>'
    + '<button class="btn sec full" data-act="rqPick" data-v="">لا أعرف — خلّي أخصائيي يختار</button><button class="link" data-act="rqRestart">إعادة الأسئلة</button></div></div></div>';
}
function rqSend(pick) {
  const r = RL.recommend(S.rq.a, rqBase()); S.rq.pick = pick; S.rq.sentAt = now(); S.rqOpen = false;
  send({ t: 'rq', ans: S.rq.a, pick: pick || '', top: r.top.map((x) => x.id), ts: now() });
  toast(pick ? 'أُرسل اختيارك لأخصائيك ليعتمده' : 'أُرسلت إجاباتك لأخصائيك');
}
function rqOpt(v) {
  const qs = rqQs(), q = qs[S.rq.i]; if (!q) return;
  if (q.type === 'many') { const cur = Array.isArray(S.rq.a[q.id]) ? S.rq.a[q.id] : []; S.rq.a[q.id] = v === '__none' ? [] : cur.includes(v) ? cur.filter((x) => x !== v) : cur.concat([v]); render(); return; }
  S.rq.a[q.id] = v; render(); setTimeout(() => { if (S.rqOpen && rqQs()[S.rq.i] && rqQs()[S.rq.i].id === q.id) { S.rq.i++; render(); } }, RM ? 0 : 220);
}
function scrSent() {
  const st = S.req, ch = st === 'changes', ok = st === 'approved';
  if (st === 'rejected' || S.removed) return '<div class="scr"><div class="scroll"><div class="stack" style="padding-top:26px"><div class="empty"><div class="ei" style="color:var(--coral)">' + I('alert') + '</div><h1>توقف الربط مع أخصائيك</h1><p class="mut">لا يمكن إرسال بيانات جديدة من هذا الحساب. تواصل مع أخصائيك إن كان ذلك خطأ، وسيرسل لك رابطاً جديداً.</p></div><button class="btn sec full" data-act="wipe">حذف بياناتي من هذا الجوال</button></div></div></div>';
  const step = (cls, t, d) => '<div><i class="' + cls + '">' + (cls === 'ok' ? I('check') : '') + '</i><div><b>' + t + '</b><div class="dim">' + d + '</div></div></div>';
  return '<div class="scr"><div class="scroll"><div class="stack" style="padding-top:26px">'
    + '<div class="empty"><div class="ei" style="background:rgba(111,227,169,.15);color:var(--mint)">' + I(ch ? 'msg' : ok ? 'check' : 'send') + '</div><h1>' + (ch ? 'أخصائيك طلب تعديلاً' : ok ? 'اعتمدك أخصائيك' : 'وصل طلبك إلى أخصائيك') + '</h1><p class="mut">' + (ch ? 'اقرأ الملاحظة ثم عدّل بياناتك وأعد الإرسال.' : ok ? 'يجهّز خطتك الآن، وتصلك هنا فور إرسالها.' : 'سيراجع بياناتك ويجهّز خطتك. ستصلك هنا مع إشعار.') + '</p></div>'
    + (ch ? '<div class="banner warn">' + I('msg') + '<span><b>' + esc(S.dname) + ':</b> ' + esc(S.reqMsg) + '</span></div><button class="btn full" data-act="step" data-v="1">تعديل بياناتي</button>' : '')
    + '<div class="card tl">' + step('ok', 'أُرسلت بياناتك', 'مشفّرة إلى ' + esc(S.dname))
    + step(ok ? 'ok' : 'now', ok ? 'اعتمدك أخصائيك' : 'قيد المراجعة', ok ? 'رقم ملفك ' + esc(S.code) : 'عادة خلال يوم عمل')
    + step(ok ? 'now' : '', 'خطتك الأولى', 'تظهر هنا يوماً بيوم') + '</div>'
    + rqCard(true) + panCard(true) + installCard('sent') + notifCard(false) + '<p class="sync">' + (S.outbox.length ? 'بانتظار الإنترنت لإرسال ' + S.outbox.length + ' عنصر…' : 'يُتحقق من الجديد تلقائياً كل نصف دقيقة') + '</p>'
    + '<button class="btn sec full" data-act="chat" style="position:relative">' + I('msg') + ' راسل أخصائيك' + (S.unreadC ? '<span class="nb" style="position:absolute;top:-6px;left:-6px;min-width:20px;height:20px;border-radius:10px;background:var(--coral);color:#3a0d05;font-size:11px;display:grid;place-items:center">' + S.unreadC + '</span>' : '') + '</button>'
    + '<button class="btn sec full" data-act="refresh">' + I('reset') + ' تحقق الآن</button>'
    + '</div></div></div>';
}

// ---------- التطبيق بعد وصول الخطة
function scrApp() {
  const body = { today: tabToday, plan: tabPlan, prefs: tabPrefs, progress: tabProgress, feed: tabFeed }[S.tab]();
  const tb = [['today', 'today', 'اليوم'], ['plan', 'cal', 'خطتي'], ['prefs', 'heart', 'تفضيلاتي'], ['feed', 'news', 'تثقيف'], ['progress', 'trend', 'تقدّمي']].map((t) => '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + I(t[1]) + '<span>' + t[2] + '</span>' + (t[0] === 'feed' && fdNew() ? '<span class="nb" aria-label="' + fdNew() + ' جديد">' + fdNew() + '</span>' : '') + '</button>').join('');
  const wm = S.wm && (S.tab === 'today' || S.tab === 'plan') ? '<div class="wmk" aria-hidden="true">' + Array(18).fill('<span>' + esc(S.wm) + '</span>').join('') + '</div>' : '';   // 0.51: علامة مائية باسم العميل على الجدول
  return '<div class="scr hasTabs">' + wm + '<div class="scroll"><div class="stack">' + (S.removed ? '<div class="banner warn">' + I('alert') + '<span>أوقف أخصائيك ربط حسابك؛ خطتك الحالية تبقى معروضة لكن لا تصله متابعتك.</span></div>' : '') + body + '</div></div><nav class="tabbar" aria-label="التنقل">' + tb + '</nav></div>';
}

// ---------- 0.58: ترويسة «اليوم» الحيّة (مشهد يتبع وقت اليوم والثيم) وبطاقة «مهمتك الآن»
const TOD = {
  morning: { g: 'صباح الخير', sky: ['#4f73c9', '#f1a98b', '#ffd9a0'], sun: [84, 118], sc: '#fff1c0', moon: 0 },
  noon: { g: 'نهارك سعيد', sky: ['#2b8fd6', '#55c3e6', '#bdf0f0'], sun: [170, 46], sc: '#fff7d6', moon: 0 },
  evening: { g: 'مساء النور', sky: ['#4a3c8f', '#d9607a', '#ffb36b'], sun: [262, 122], sc: '#ffd27a', moon: 0 },
  night: { g: 'ليلة هادئة', sky: ['#070f2e', '#101b4d', '#22347f'], sun: [250, 50], sc: '#f4f1e0', moon: 1 }
};
const todOf = (h) => h >= 4 && h < 11 ? 'morning' : h < 16 ? 'noon' : h < 20 ? 'evening' : 'night';
function dayStreak() {                                    // أيام متتالية سجّل فيها صنفاً واحداً على الأقل (اليوم يُحتسب إن سُجّل فيه، وإلا نبدأ من أمس)
  let n = 0; const d = new Date(), has = (x) => { const L = S.log[dkey(x)]; return !!(L && L.ck && Object.keys(L.ck).length); };
  if (!has(d)) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400 && has(d); i++) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function sceneSvg(tod, egy) {
  const T = TOD[tod], x = T.sun[0], y = T.sun[1]; let s = '<svg viewBox="0 0 340 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="scsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + T.sky[0] + '"/><stop offset=".62" stop-color="' + T.sky[1] + '"/><stop offset="1" stop-color="' + T.sky[2] + '"/></linearGradient></defs><rect width="340" height="170" fill="url(#scsk)"/>';
  if (T.moon) { [[40, 26], [96, 54], [150, 20], [204, 62], [300, 34], [322, 84], [124, 90], [58, 82]].forEach((p, i) => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 1 : 1.6) + '" fill="#fff" opacity="' + (i % 2 ? .6 : .9) + '"/>'; }); s += '<circle cx="' + x + '" cy="' + y + '" r="32" fill="#fff" opacity=".08"/><path transform="translate(' + (x - 12) + ' ' + (y - 16) + ')" d="M14 0a16 16 0 1 0 12 26 13 13 0 0 1-12-26z" fill="' + T.sc + '"/>'; }
  else { s += '<circle cx="' + x + '" cy="' + y + '" r="44" fill="' + T.sc + '" opacity=".18"/><circle cx="' + x + '" cy="' + y + '" r="25" fill="' + T.sc + '" opacity=".35"/><circle cx="' + x + '" cy="' + y + '" r="14" fill="' + T.sc + '"/>'; }
  if (egy) s += '<path d="M0 170V138Q80 130 170 136T340 132V170z" class="sc2"/><path d="M150 152 215 84 280 152zM232 152 282 104 332 152zM96 152 128 120 160 152z" class="sc1"/><path d="M52 152V100l7-14 7 14v52z" class="sc1"/><path d="M0 170V152Q90 144 170 150T340 148V170z" class="sc1"/><path d="M20 162q8-4 16 0t16 0M120 164q8-4 16 0t16 0M250 162q8-4 16 0t16 0" fill="none" stroke="#3fe0cf" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/>';
  else s += '<path d="M0 170V118Q70 92 140 114T270 106T340 118V170z" class="sc2"/><path d="M0 170V144Q90 120 170 140T340 134V170z" class="sc1"/><path d="M160 140c0-22 2-32 4-44M164 98c-12-10-22-8-28-2M164 98c10-12 22-10 30-4M164 98c-6-14-4-24 0-30" fill="none" stroke="var(--bg)" stroke-width="3" stroke-linecap="round"/>';
  return s + '</svg>';
}
function sceneHeader(first, d) {
  const tod = todOf(new Date().getHours()), egy = window.HxTheme && HxTheme.get() === 'firoz', st = dayStreak();
  return '<section class="scn" data-tod="' + tod + '">' + sceneSvg(tod, egy) + '<div class="hello"><div class="av sm">' + esc(first.charAt(0) || '؟') + '</div><div style="flex:1;min-width:0"><div class="dim">' + esc(DATA.dayNames[d] || '') + '</div><h2>' + TOD[tod].g + ' ' + esc(first) + '</h2></div>'
    + (st ? '<span class="stk" aria-label="' + st + (st === 1 ? ' يوم متتالٍ' : ' أيام متتالية') + '">' + I('flame') + '<b>' + st + '</b></span>' : '') + chatBtn() + '</div></section>';
}
function missionCard(d) {                                  // أول وجبة لم تُسجَّل، ثم الماء؛ وبعدهما رسالة إنجاز
  if (!gateOpen()) return '';
  const L = dl(d), dp = dayPlan(d), slots = dp.slots; let si = -1;
  for (let i = 0; i < slots.length; i++) { if (!L.skip[i] && slots[i].lines.length && !slots[i].lines.every((l, li) => L.ck[i + '_' + li])) { si = i; break; } }
  if (si >= 0) { const s = slots[si], first = s.lines[0] ? lineT(s.lines[0]) : '';
    return '<section class="card msn"><div class="mis"><span class="mic">' + I('check') + '</span><div style="flex:1;min-width:0"><small>مهمتك الآن</small><h3>سجّل ' + esc(s.name) + '</h3><p class="dim">' + esc(s.time || '') + (s.kcal ? ' • ' + s.kcal + ' سعرة' : '') + (first ? ' • ' + esc(first) : '') + '</p></div></div><button class="btn full" data-act="whole" data-v="' + si + '">' + I('check') + ' أكلتها كاملة</button></section>'; }
  const g = hWaterGoal(), w = L.water || 0;
  if (w < g) return '<section class="card msn"><div class="mis"><span class="mic">' + I('drop') + '</span><div style="flex:1;min-width:0"><small>مهمتك الآن</small><h3>اشرب كوباً من الماء</h3><p class="dim">' + w + ' من ' + g + ' أكواب</p></div></div><button class="btn full" data-act="water" data-v="' + (w + 1) + '">' + I('drop') + ' شربت كوباً</button></section>';
  return '<section class="card msn done"><div class="mis"><span class="mic">' + I('check') + '</span><div style="flex:1;min-width:0"><small>مهمتك الآن</small><h3>أحسنت، أنجزت مهام اليوم</h3><p class="dim">وجباتك وماؤك كاملة. استرح، وغداً نكمل.</p></div></div></section>';
}

// ---------- 0.59: رسوم الحالات الفارغة (تتبع ألوان الثيم) وأيقونات الوجبات
function emptyArt(k) {
  const A = {
    weight: '<rect x="30" y="20" width="60" height="52" rx="14" fill="var(--mint)" fill-opacity=".16" stroke="var(--mint)" stroke-width="2"/><path d="M44 44a16 16 0 0 1 32 0" fill="none" stroke="var(--mint)" stroke-width="2.4" stroke-linecap="round"/><path d="M60 44l6-9" stroke="var(--amber)" stroke-width="2.4" stroke-linecap="round"/><path d="M8 80c20 0 24-10 44-10s28 8 60 0" fill="none" stroke="var(--line2)" stroke-width="2" stroke-dasharray="4 5"/><circle cx="112" cy="72" r="4" fill="var(--amber)"/>',
    news: '<rect x="26" y="18" width="62" height="58" rx="6" fill="var(--sky)" fill-opacity=".14" stroke="var(--sky)" stroke-width="2"/><path d="M88 28v44a8 8 0 0 0 16 0V34" fill="none" stroke="var(--sky)" stroke-width="2.2" stroke-linecap="round"/><path d="M36 32h30M36 42h40M36 52h26" stroke="var(--mut)" stroke-width="2.4" stroke-linecap="round"/><path d="M72 64c2-3 4-3 6 0-2 3-4 3-6 0z" fill="var(--amber)"/>',
    chat: '<rect x="14" y="16" width="62" height="34" rx="14" fill="var(--mint)" fill-opacity=".16" stroke="var(--mint)" stroke-width="2"/><path d="M26 50l-4 12 14-12" fill="var(--mint)" fill-opacity=".16" stroke="var(--mint)" stroke-width="2" stroke-linejoin="round"/><rect x="48" y="42" width="58" height="30" rx="14" fill="var(--amber)" fill-opacity=".18" stroke="var(--amber)" stroke-width="2"/><circle cx="64" cy="57" r="2.6" fill="var(--amber)"/><circle cx="77" cy="57" r="2.6" fill="var(--amber)"/><circle cx="90" cy="57" r="2.6" fill="var(--amber)"/>',
    ach: '<path d="M60 14l10 20 22 3-16 16 4 22-20-11-20 11 4-22-16-16 22-3z" fill="var(--amber)" fill-opacity=".2" stroke="var(--amber)" stroke-width="2.2" stroke-linejoin="round"/><path d="M34 80h52" stroke="var(--line2)" stroke-width="2.4" stroke-linecap="round"/><circle cx="60" cy="40" r="4" fill="var(--mint)"/>'
  };
  return '<div class="ea"><svg viewBox="0 0 120 90" aria-hidden="true">' + A[k] + '</svg></div>';
}
function mealIc(name) { const n = String(name || ''), k = /فطور|إفطار|افطار|صباح/.test(n) ? 'cup' : /سناك|تصبيرة|وجبة خفيفة/.test(n) ? 'apple' : /عشاء/.test(n) ? 'moonbowl' : /غداء|غذاء/.test(n) ? 'utensils' : ''; return k ? '<span class="mti">' + I(k) + '</span>' : ''; }

// ================= 0.60: عجلة الرسالة اليومية (مرة واحدة يومياً عند أول فتح) — الرسائل في wheel_msgs.js (المعتمد فقط)
const WHL = { shown: false, spin: false, rot: 0 };
const whx = () => window.HX_WHEEL || null;
function whs() { if (!S.wh) S.wh = { on: true, nat: '', day: '', cat: -1, idx: -1, seen: {}, fav: [], noQ: false, last: -1 }; return S.wh; }
const whDia = () => { const w = whx(); return (w && w.dia[whs().nat]) || 'msa'; };
const whDay = () => Math.floor(Date.now() / 864e5);
function whCond(c) {
  const L = S.log[dkey(new Date())] || { ck: {}, water: 0 };
  return c === 'meal' ? Object.keys(L.ck || {}).length > 0 : c === 'st3' ? dayStreak() >= 3 : c === 'water' ? (L.water || 0) >= hWaterGoal() : c === 'wt' ? (S.weights || []).length >= 2 : true;
}
function whList(ci) { const w = whx(), id = w.cats[ci].id, m = w.msgs[id]; return Array.isArray(m) ? m : (m[whDia()] || m.msa || []); }
const whOkM = (m) => m.a === 1 && (!m.c || whCond(m.c));
function whCats() { const w = whx(), q = whs().noQ || !isMus(); return w ? w.cats.map((c, i) => i).filter((i) => !(q && w.cats[i].id === 'quran') && whList(i).filter((m) => m.a === 1).length >= w.min) : []; }
function whText(ci, mi) {
  const m = whList(ci)[mi]; if (!m) return null; const id = whx().cats[ci].id;
  if (id === 'hero') return { t: (S.p.sex === 'ذكر' ? m.m : m.f).replace('{n}', dayStreak()) };
  return { t: m.t, s: m.s || '', ref: m.ref || '', tf: m.tf || '', x: m.x || '', w: m.w || '' };
}
function whPick() {
  const w = whs(), cs = whCats(); if (!cs.length) return null; const day = whDay();
  const pool = cs.filter((c) => c !== w.last), cs2 = pool.length ? pool : cs, ci = cs2[Math.floor(Math.random() * cs2.length)], L = whList(ci);
  let ok = L.map((m, i) => i).filter((i) => whOkM(L[i])), fresh = ok.filter((i) => !(w.seen[ci + '_' + i] && day - w.seen[ci + '_' + i] < 30));
  if (!fresh.length) fresh = ok; if (!fresh.length) return null;
  // «عاش يا بطل»: ما انطبق شرطه على العميل اليوم يتقدّم على العام
  if (whx().cats[ci].id === 'hero') { const cond = fresh.filter((i) => L[i].c); if (cond.length) fresh = cond; }
  return { ci, mi: fresh[Math.floor(Math.random() * fresh.length)] };
}
function whIc(k) { const w = whx(); return k === 'star8' ? '<path d="M5 5h14v14H5z"/><path d="M12 1.5 22.5 12 12 22.5 1.5 12z"/>' : k === 'lamp' ? '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>' : k === 'peak' ? '<path d="M3 20 9 9l4 6 3-4 5 9z"/><path d="M9 9V4l4 1.5L9 7"/>' : k === 'star' ? '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>' : k === 'shield' ? '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/>' : '<path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/>'; }
const whSvg = (k) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + whIc(k) + '</svg>';
const WH_BRK = '<svg class="brk" viewBox="0 0 18 56" aria-hidden="true"><path d="M5 2C14 13 14 43 5 54 9.5 43 9.5 13 5 2Z" fill="currentColor"/><circle cx="12.5" cy="28" r="1.9" fill="currentColor"/></svg>';
const WH_ORN = '<div class="orn" aria-hidden="true">' + '<svg viewBox="0 0 24 12"><path d="M4 6c0-3.6 3.6-3.6 6 0s6 3.6 6 0-3.6-3.6-6 0-6 3.6-6 0z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'.repeat(5) + '</div>';
function whCardHtml(ci, mi, actions) {
  const c = whx().cats[ci], d = whText(ci, mi); if (!d) return ''; const w = whs(), fav = w.fav.includes(ci + '_' + mi);
  const head = '<div class="whc-h"><span class="whc-i">' + whSvg(c.ic) + '</span><div><b>' + esc(c.name) + '</b><small>رسالة اليوم</small></div></div>';
  let body = '';
  if (c.id === 'arab') body = '<div class="whc-b ct"><p class="whc-t serif">' + esc(d.t) + '</p><p class="whc-n">— ' + esc(d.s) + '</p>' + (d.w ? '<p class="whc-w"><b>ماذا أفعل؟</b>' + esc(d.w) + '</p>' : '') + '</div>';
  else if (c.id === 'book') body = '<div class="whc-b"><div class="whc-q" aria-hidden="true">”</div><p class="whc-t">' + esc(d.t) + '</p><p class="whc-a">' + whSvg('book') + esc(d.s) + '</p>' + (d.w ? '<p class="whc-w"><b>ماذا أفعل؟</b>' + esc(d.w) + '</p>' : '') + '</div>';
  else if (c.id === 'quran') body = '<div class="whc-b ct"><div class="whc-v">' + WH_BRK + '<p class="whc-ay">' + esc(d.t).replace(/۝/g, '<span class="ayn" aria-hidden="true"></span>') + '</p>' + WH_BRK + '</div><p class="whc-rf">' + esc(d.ref) + '</p>' + WH_ORN + '<p class="whc-tf"><b>رسالتك</b>' + esc(d.tf) + '</p>' + (d.w ? '<p class="whc-w"><b>ماذا أفعل؟</b>' + esc(d.w) + '</p>' : '') + WH_ORN + '</div>';
  else if (c.id === 'self') body = '<div class="whc-b rel"><span class="whc-no" aria-hidden="true">لا</span><p class="whc-t b">' + esc(d.t) + '</p>' + (d.x ? '<p class="whc-x">' + esc(d.x) + '</p>' : '') + '</div>';
  else if (c.id === 'chal') body = '<div class="whc-b"><span class="whc-tag">تحدّي اليوم</span><p class="whc-t b">' + esc(d.t) + '</p></div>';
  else body = '<div class="whc-b"><p class="whc-t b">' + esc(d.t) + '</p></div>';
  const foot = actions ? '<div class="whc-f"><button class="btn" data-wh="close">' + (c.id === 'chal' ? 'قبلت التحدي' : 'شكراً') + '</button><button class="btn sec" data-wh="fav" aria-pressed="' + fav + '" aria-label="' + (fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة') + '">' + (fav ? '★' : '☆') + '</button><button class="btn sec" data-wh="share" aria-label="مشاركة كصورة">' + I('send') + '</button></div>' : '';
  return '<article class="whc whc-' + c.id + '" style="--deep:' + c.deep + ';--acc:' + c.acc + '" aria-label="' + esc(c.name) + '">' + head + body + foot + '</article>';
}
function whWheelSvg(cs) {
  const w = whx(), n = cs.length, st = 360 / n, pt = (a, r) => { const t = a * Math.PI / 180; return [150 + r * Math.sin(t), 150 - r * Math.cos(t)]; };
  let s = '<defs><radialGradient id="whrim" cx="50%" cy="50%" r="50%"><stop offset="92%" stop-color="#16265f"/><stop offset="100%" stop-color="#0c1740"/></radialGradient></defs><circle cx="150" cy="150" r="149" fill="url(#whrim)" stroke="#ffd27a" stroke-opacity=".7" stroke-width="2"/><g id="whrot">';
  cs.forEach((ci, i) => {
    const c = w.cats[ci], p0 = pt(i * st - st / 2, 132), p1 = pt(i * st + st / 2, 132);
    s += '<g class="seg" data-i="' + i + '"><path d="M150 150 L' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A132 132 0 0 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + 'Z" fill="' + c.deep + '" stroke="' + c.acc + '" stroke-opacity=".55" stroke-width="1.5"/>'
      + '<g transform="rotate(' + (i * st) + ' 150 150)"><g transform="translate(138 28)" fill="none" stroke="' + c.acc + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + whIc(c.ic) + '</g><text x="150" y="68" text-anchor="middle" font-size="13.5" font-weight="700" fill="#fff">' + c.l1 + '</text><text x="150" y="85" text-anchor="middle" font-size="13.5" font-weight="700" fill="#fff">' + c.l2 + '</text></g></g>';
  });
  for (let k = 0; k < 18; k++) { const q = pt(k * 20, 141); s += '<circle class="lamp" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2.6" fill="#ffd27a" style="animation-delay:' + (k % 6 * .35) + 's"/>'; }
  return s + '</g><circle cx="150" cy="150" r="27" fill="#0b1330" stroke="#ffd27a" stroke-opacity=".8" stroke-width="2"/><g transform="translate(138 138)" fill="none" stroke="#ffd27a" stroke-width="1.6" stroke-linejoin="round">' + whIc('star8') + '</g>';
}
function whOpen(mode) {              // mode: 'wheel' | 'card'
  const old = document.getElementById('whl'); if (old) old.remove(); const w = whs(), el = document.createElement('div'); el.id = 'whl'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'رسالة اليوم');
  WHL.cs = whCats(); WHL.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (mode === 'card' && w.cat >= 0) el.innerHTML = '<div class="whs wcard show">' + whCardHtml(w.cat, w.idx, true) + '</div>';
  else if (!w.nat) el.innerHTML = '<div class="whs"><div class="eyebrow">رسالة اليوم</div><h2 class="ask">من أي بلد أنت؟</h2><p class="dim" style="max-width:19em">لنختار لك لهجة الرسائل. تغيّرها لاحقاً من «تقدّمي».</p><div class="chips whnat">' + whx().countries.map((x) => '<button class="chip" data-wh="nat" data-v="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div><button class="btn ghost" data-wh="later">لاحقاً</button></div>';
  else el.innerHTML = '<div class="whs wheel"><div class="eyebrow">رسالة اليوم</div><h2 class="ask" id="whask">لفّ العجلة لتلقي رسالتك</h2><div class="whbox"><svg class="whptr" viewBox="0 0 30 36" id="whptr" aria-hidden="true"><path d="M15 34 4 12a12 12 0 1 1 22 0z" fill="#ffd27a" stroke="#7a5a1c" stroke-width="2"/><circle cx="15" cy="11" r="4" fill="#0b1330"/></svg><svg viewBox="0 0 300 300" id="whsvg" aria-hidden="true">' + whWheelSvg(WHL.cs) + '</svg></div><div class="whbtns"><button class="btn" id="whspin" data-wh="spin">' + (WHL.rm ? 'اكشف رسالتك' : 'لفّ العجلة') + '</button><button class="btn ghost" data-wh="later">لاحقاً</button></div></div><div class="whs wcard" id="whcard"></div>';
  document.body.appendChild(el); WHL.spin = false; const b = el.querySelector('.btn'); if (b && !('ontouchstart' in window)) try { b.focus({ preventScroll: true }); } catch (e) { }
  el.className = WHL.rm ? 'rm' : '';
}
function whMaybe() {
  try { if (navigator.webdriver && !localStorage.getItem('hx_wheel_e2e')) return; } catch (e) { }          // الاختبارات الآلية لا تُحجب بالعجلة إلا إن طلبتها
  if (WHL.shown || !S || !K || V.screen !== '' || S.screen !== 'app' || S.tab !== 'today' || S.chat || document.getElementById('whl') || document.getElementById('alm')) return;
  const w = whs(), x = whx(); if (!x || !w.on || w.day === dkey(new Date()) || !whCats().length) return;
  WHL.shown = true; setTimeout(() => { if (S && V.screen === '' && !document.getElementById('whl')) whOpen('wheel'); }, 450);
}
function whSpin() {
  if (WHL.spin) return; const el = document.getElementById('whl'), w = whs(); if (!el) return; const pk = whPick(); if (!pk) return; WHL.spin = true;
  const ix = WHL.cs.indexOf(pk.ci), n = WHL.cs.length, st = 360 / n; $('#whspin').disabled = true; el.querySelectorAll('[data-wh="later"]').forEach((b) => { b.hidden = true; });
  const finish = () => { w.day = dkey(new Date()); w.cat = pk.ci; w.idx = pk.mi; w.last = pk.ci; w.seen[pk.ci + '_' + pk.mi] = whDay(); save(); send({ t: 'whl', c: whx().cats[pk.ci].id }); whReveal(pk); };
  if (WHL.rm) { $('#whask').textContent = 'رسالتك جاهزة'; setTimeout(finish, 250); return; }
  $('#whask').textContent = '…'; const jitter = Math.random() * st * .6 - st * .3, cur = ((WHL.rot % 360) + 360) % 360, delta = (((360 - ix * st + jitter) - cur) % 360 + 360) % 360, total = 360 * 5 + delta, start = WHL.rot, dur = 4600;
  const under = (a) => Math.floor((((-a % 360) + 360) % 360 + st / 2) / st) % n; let t0 = null, last = under(start), g = document.getElementById('whrot');
  const frame = (ts) => {
    if (!document.getElementById('whl')) return; if (t0 === null) t0 = ts; const p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); WHL.rot = start + total * e; g.setAttribute('transform', 'rotate(' + WHL.rot + ' 150 150)');
    const u = under(WHL.rot); if (u !== last) { last = u; const pt = document.getElementById('whptr'); if (pt && pt.animate) pt.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-24deg)' }, { transform: 'rotate(0)' }], { duration: 150, easing: 'ease-out' }); if (navigator.vibrate) try { navigator.vibrate(6); } catch (e2) { } }
    if (p < 1) requestAnimationFrame(frame); else { const box = el.querySelector('.whbox'); box.classList.add('win'); box.querySelector('.seg[data-i="' + ix + '"]').classList.add('won'); $('#whask').textContent = whx().cats[pk.ci].name; setTimeout(finish, 900); }
  };
  requestAnimationFrame(frame);
}
function whReveal(pk) {
  const el = document.getElementById('whl'); if (!el) return; const c = el.querySelector('#whcard'); c.innerHTML = whCardHtml(pk.ci, pk.mi, true); el.querySelector('.whs.wheel').classList.add('gone'); requestAnimationFrame(() => c.classList.add('show'));
  const b = c.querySelector('[data-wh="close"]'); if (b) try { b.focus({ preventScroll: true }); } catch (e) { } render();
}
function whClose() { const el = document.getElementById('whl'); if (!el) return; el.classList.add('out'); setTimeout(() => { el.remove(); render(); }, WHL.rm ? 20 : 330); }
function whShare() {
  const w = whs(); if (w.cat < 0) return; const c = whx().cats[w.cat], d = whText(w.cat, w.idx); if (!d) return; const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 1350); gr.addColorStop(0, c.deep); gr.addColorStop(1, '#0b1330'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1350);
  g.strokeStyle = c.acc; g.globalAlpha = .5; g.lineWidth = 3; g.strokeRect(36, 36, 1008, 1278); g.globalAlpha = 1; g.direction = 'rtl'; g.textAlign = 'center';
  const wrap = (txt, x, y, mw, lh) => { const ws = String(txt).split(' '); let line = ''; ws.forEach((wd) => { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > mw && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = t; }); g.fillText(line, x, y); return y + lh; };
  g.fillStyle = c.acc; g.font = '700 46px sans-serif'; g.fillText(c.name, 540, 150); g.fillStyle = '#fff'; d.t = String(d.t).replace(/۝/g, '  •  '); g.font = '700 ' + (c.id === 'quran' ? 64 : 58) + 'px "Hissa Quran","Amiri Quran","Hissa Amiri",serif'; let y = wrap(d.t, 540, 380, 880, c.id === 'quran' ? 120 : 100);
  g.font = '500 40px sans-serif'; g.fillStyle = 'rgba(255,255,255,.88)'; if (d.tf) y = wrap(d.tf, 540, y + 40, 860, 70); if (d.w) { g.fillStyle = c.acc; y = wrap('ماذا أفعل؟ ' + d.w, 540, y + 30, 860, 64); g.fillStyle = 'rgba(255,255,255,.88)'; } if (d.s || d.ref) { g.fillStyle = c.acc; g.font = '600 36px sans-serif'; g.fillText(d.s || d.ref, 540, y + 40); }
  g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '600 38px sans-serif'; g.fillText('حصتي', 540, 1260);
  cv.toBlob((bl) => { if (!bl) return; const f = new File([bl], 'hissati-message.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).catch(() => { }); else { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'hissati-message.png'; document.body.appendChild(a); a.click(); a.remove(); } }, 'image/png');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('#whl [data-wh]'); if (!b || !S) return; const k = b.dataset.wh, w = whs();
  if (k === 'spin') whSpin(); else if (k === 'later') { WHL.shown = true; whClose(); } else if (k === 'close') whClose(); else if (k === 'share') whShare();
  else if (k === 'nat') { w.nat = b.dataset.v; S.p.nat = w.nat; save(); whOpen('wheel'); }
  else if (k === 'fav') { const id = w.cat + '_' + w.idx, i = w.fav.indexOf(id); if (i >= 0) w.fav.splice(i, 1); else w.fav.push(id); save(); const on = w.fav.includes(id); b.setAttribute('aria-pressed', on); b.textContent = on ? '★' : '☆'; }
});
function whChip() {
  const w = whs(), x = whx(); if (!x || w.day !== dkey(new Date()) || w.cat < 0 || !whText(w.cat, w.idx)) return '';
  return '<button class="whchip" data-act="whOpen" style="--acc:' + x.cats[w.cat].acc + '">' + whSvg(x.cats[w.cat].ic) + '<span>رسالة اليوم · ' + esc(x.cats[w.cat].name) + '</span></button>';
}
function whCard() {
  const w = whs(), x = whx(); if (!x) return ''; const fav = w.fav.filter((id) => { const [c, m] = id.split('_'); return whText(+c, +m); });
  return '<section class="card stack"><h3>' + I('sparkle') + ' عجلة رسالة اليوم</h3><label class="whrow"><span>أفتح العجلة عند أول دخول كل يوم</span><input type="checkbox" data-act="whTog" ' + (w.on ? 'checked' : '') + '></label>'
    + '<div><div class="dim" style="margin-bottom:6px">الديانة (تحدّد ظهور الأذان والأذكار والقرآن)</div><div class="chips">' + [['م', 'مسلم'], ['ك', 'مسيحي'], ['ن', 'لا أحدد']].map((r) => '<button class="chip' + ((S.p.rel || 'م') === r[0] ? ' on' : '') + '" data-act="relSet" data-v="' + r[0] + '">' + r[1] + '</button>').join('') + '</div></div>'
    + '<label class="whrow"><span>أخفِ رسائل القرآن</span><input type="checkbox" data-act="whQ" ' + (w.noQ ? 'checked' : '') + '></label>'
    + '<div><div class="dim" style="margin-bottom:6px">بلدك (يحدّد لهجة «عاش يا بطل»)</div><div class="chips">' + x.countries.map((c) => '<button class="chip' + (w.nat === c ? ' on' : '') + '" data-act="whNat" data-v="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div></div>'
    + (fav.length ? '<div><div class="dim" style="margin-bottom:6px">رسائلي المفضلة</div>' + fav.map((id) => { const [c, m] = id.split('_').map(Number), d = whText(c, m); return '<button class="whfav" data-act="whFavOpen" data-v="' + id + '"><b style="color:' + x.cats[c].acc + '">★</b> ' + esc(d.t.length > 60 ? d.t.slice(0, 58) + '…' : d.t) + '</button>'; }).join('') + '</div>' : '') + '</section>';
}
function tabToday() {
  const d = TODAY, L = dl(d), [done, n] = itemsOfDay(d), pct = n ? Math.round(done / n * 100) : 0, C = 2 * Math.PI * 40;
  const first = (S.p.name || '').trim().split(/\s+/)[0] || '';
  let out = sceneHeader(first, d) + missionCard(d) + whChip() + (S.fw === 'pending' ? firstWinCard() : installState() === 'done' || installState() === 'desktop' ? notifCard(true) : installCard('today')) + chalCard() + prCard() + apCard() + wkCard() + bdCard() + panCard() + pfCard();
  out += '<section class="card ring"><svg viewBox="0 0 100 100" role="img" aria-label="التزام اليوم ' + pct + '%"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#6fe3a9" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/></svg><div style="flex:1"><div class="num">' + pct + '%</div><div class="mut">' + done + ' من ' + n + ' أصناف اليوم</div>'
    + (pct === 100 ? '<div class="dim" style="color:var(--mint)">يوم كامل، أحسنت!</div>' : '<div class="dim">علّم ما أكلته باللمس.</div>') + '</div></section>';
  const dp = dayPlan(d), kc = dp.kcal || DATA.kcal, pr = dp.p || DATA.pro, wt = +(dp.water || DATA.water), cups = Math.max(4, Math.min(16, Math.round(wt / CUP)));
  if (dp.type) out += '<div class="banner info">' + I('dumbbell') + '<span><b>' + esc(dp.type) + '</b> • كارب ' + dp.c + ' جم • دهون ' + dp.f + ' جم</span></div>';
  out += '<div class="stats3"><div class="st"><b>' + kc + '</b><small>سعرة هدفك' + (dp.type ? ' اليوم' : '') + '</small></div><div class="st"><b>' + pr + ' جم</b><small>بروتين</small></div><div class="st"><b>' + (L.water * CUP).toFixed(2).replace(/\.?0+$/, '') + ' / ' + wt.toFixed(1) + '</b><small>لتر ماء</small></div></div>';
  out += habitsHome() + (gateOpen() ? '<h2 class="mealsh">وجباتي</h2>' + dayPlan(d).slots.map((s, si) => mealCard(d, si, s, true)).join('') + dayLogCard(d) : gateCard());
  return out + syncLine();
}
function syncLine() { return '<p class="sync">' + (S.outbox.length ? 'بانتظار الإنترنت لإرسال ' + S.outbox.length + ' تحديث إلى أخصائيك' : 'متابعتك تصل أخصائيك تلقائياً') + ' • الخطة الإصدار ' + S.pv + '</p>'; }
function mealCard(d, si, s, live) {
  const L = dl(d), all = s.lines.every((l, li) => L.ck[si + '_' + li]), skip = L.skip[si];
  const items = s.lines.map((l, li) => {
    const k = si + '_' + li, on = !!L.ck[k], sw = L.sw[k];
    const txt = sw ? sw : lineT(l), tag = l[4] ? '<span class="tag auto">استُبدل تلقائياً: ' + esc(l[4]) + '</span>' : sw ? '<span class="tag">بدّلتَه بنفسك</span>' : '';
    if (!live) return '<li><span>' + esc(txt) + (tag ? '<br>' + tag : '') + '</span></li>';
    return '<div class="it' + (on ? ' on' : '') + '"><button class="ck" data-act="ck" data-v="' + k + '" aria-pressed="' + on + '" aria-label="' + (on ? 'إلغاء' : 'أكلت') + ' ' + esc(txt) + '">' + I('check') + '</button><button class="tx" data-act="ck" data-v="' + k + '" style="text-align:right">' + esc(txt) + (tag ? '<br>' + tag : '') + '</button>' + ((l[3] || []).length ? '<button class="sw" data-act="swap" data-v="' + k + '" aria-label="بدّل">' + I('swap') + '</button>' : '') + '</div>';
  }).join('');
  const meal = s.meal ? '<div class="dim">' + esc(s.meal) + '</div>' : '', rec = s.meal && S.pm && S.pm.recipes && S.pm.recipes[s.meal];
  const rbtn = rec ? '<button class="btn sm sec" data-act="rcp" data-v="' + d + '_' + si + '">' + I('book') + ' الوصفة</button>' : '';
  if (!live) return '<section class="card"><div class="row" style="justify-content:space-between"><h3>' + esc(s.name) + '</h3><span class="dim">' + esc(s.time) + (s.kcal ? ' • ' + s.kcal + ' سعرة' : '') + '</span></div>' + meal + '<ul class="plist" style="margin-top:8px">' + items + '</ul>' + (rbtn ? '<div class="macts">' + rbtn + '</div>' : '') + '</section>';
  return '<section class="card meal' + (all ? ' done' : '') + (skip ? ' skip' : '') + '"><div class="mt"><span class="tm">' + esc(s.time) + '</span><div style="flex:1;min-width:0"><h3>' + mealIc(s.name) + esc(s.name) + '</h3>' + meal + '</div>' + (s.kcal ? '<span class="pc">' + s.kcal + ' سعرة</span>' : '') + '</div><div class="items">' + items + '</div>'
    + (L.note[si] ? '<div class="note">' + I('edit') + ' ' + esc(L.note[si]) + '</div>' : '') + phStrip(si)
    + '<div class="macts"><button class="btn sm sec" data-act="whole" data-v="' + si + '">' + I('check') + (all ? ' تمّت' : ' أكلتها كاملة') + '</button><button class="btn sm sec" data-act="note" data-v="' + si + '">' + I('edit') + ' أضفت / ملاحظة</button><button class="btn sm sec" data-act="skip" data-v="' + si + '">' + (skip ? 'تراجع' : 'لم آكلها') + '</button><button class="btn sm sec" data-act="ask" data-v="' + si + '">' + I('msg') + ' اسأل عنها</button><button class="btn sm sec" data-act="photo" data-v="' + si + '">' + I('camera') + ' صوّر وجبتك</button>' + rbtn + '</div></section>';
}
function tabPlan() {
  const hid = S.gate && (S.day !== TODAY || !gateOpen());
  const chips = DATA.dayNames.map((n, i) => { const [a, b] = itemsOfDay(i); return '<button class="' + (S.day === i ? 'on' : '') + (i === TODAY ? ' today' : '') + '" data-act="day" data-v="' + i + '"><b>' + esc(String(n).replace('ال', '')) + '</b><span>' + (S.gate && i !== TODAY ? '🔒' : b && i <= TODAY ? Math.round(a / b * 100) + '%' : '—') + '</span></button>'; }).join('');
  return '<div class="row" style="justify-content:space-between"><h2>خطتي</h2><button class="btn sm sec" data-act="shop">' + I('cart') + ' قائمة التسوّق</button></div>'
    + '<div class="dim">من ' + esc(S.dname) + ' • ' + (S.pm && S.pm.sys === 'g' ? 'نظام الجرامات: السعرات حسب نوع كل يوم' : S.pm && S.pm.ready ? esc(S.pm.ready.name) + ' • متوسط ' + DATA.kcal + ' سعرة' : DATA.kcal + ' سعرة يومياً') + ' • الإصدار ' + S.pv + '</div>'
    + '<div class="daychips">' + chips + '</div>' + (hid ? '<section class="card stack gatec"><div class="gl">🔒</div><p class="mut">' + (S.day !== TODAY ? 'خطتك تظهر يوماً بيوم: يُفتح كل يوم في وقته بعد إرسال تسجيل اليوم السابق.' : 'أرسل تسجيل أمس من «اليوم» ليُفتح جدول اليوم.') + '</p></section>' : '') + (hid ? '' : (dayPlan(S.day).type ? '<div class="banner info">' + I('dumbbell') + '<span><b>' + esc(dayPlan(S.day).type) + '</b> • ' + dayPlan(S.day).kcal + ' سعرة' + (dayPlan(S.day).p != null ? ' • بروتين ' + dayPlan(S.day).p + ' • كارب ' + dayPlan(S.day).c + ' • دهون ' + dayPlan(S.day).f + ' جم' : '') + '</span></div>' : '') + dayPlan(S.day).slots.map((s, si) => mealCard(S.day, si, s, false)).join('') + ((dayPlan(S.day).tips || []).length ? '<div class="banner info">' + I('sparkle') + '<span>' + dayPlan(S.day).tips.map(esc).join(' • ') + '</span></div>' : '')) + rqCard(false);
}
function tabPrefs() {
  const lv = foodsOf('love').length, no = foodsOf('no').length;
  return '<h2>تفضيلاتي</h2><div class="banner ok">' + I('sparkle') + '<span>ما تعلّمه «لا أحب» يُحذف من خطتك فوراً ويحل محله بديل من نفس المجموعة وبنفس الحصص، ويصل أخصائيك. وما تحبه يُفضَّل في خطتك القادمة.</span></div>'
    + '<div class="legend"><span><i class="dot" style="background:var(--mint)"></i>أحب ' + lv + '</span><span><i class="dot" style="background:var(--coral)"></i>لا أحب ' + no + '</span></div>'
    + foodGrid('prefCat', 'prefQ')
    + '<section class="card stack"><h3>صحتي</h3><p class="mut" style="font-size:14px">' + (S.p.cond.concat(S.p.allg).map(esc).join('، ') || 'لا حالات ولا حساسية') + '</p><button class="btn sm sec" data-act="healthReq">طلب تعديل الحالة الصحية</button><p class="dim">تغيير الحالة الصحية أو الحساسية يحتاج اعتماد أخصائيك قبل أن يغيّر خطتك.</p>'
    + (S.pending.length ? '<div class="banner warn">' + I('clock') + '<span>بانتظار الأخصائي: ' + S.pending.map(esc).join('، ') + '</span></div>' : '') + '</section>';
}
function applyThemeIcons(t) {                         // أيقونة التطبيق وبيانه تتبع الثيم: التثبيت التالي (وتحديث أندرويد لاحقاً) يأخذ أيقونة ثيمك
  const sf = t === 'rose' || t === 'pulse' || t === 'firoz' ? '-' + t : '', set = (sel, h) => { const e = document.querySelector(sel); if (e) e.setAttribute('href', h); };
  set('link[rel=manifest]', '/manifest.webmanifest' + (sf ? '?t=' + t : '')); set('link[rel=apple-touch-icon]', '/apple-180' + sf + '.png'); set('link[rel=icon]', '/icon-192' + sf + '.png');
}
function themeCard() {
  const cur = window.HxTheme ? HxTheme.get() : 'classic', T = [['classic', 'الحالي'], ['rose', 'وردة'], ['pulse', 'نبض'], ['firoz', 'فيروز']];
  return '<section class="card stack"><h3>' + I('sparkle') + ' مظهر التطبيق</h3><div class="hx-themes" role="radiogroup" aria-label="مظهر التطبيق">'
    + T.map((t) => '<button class="hx-th" role="radio" aria-checked="' + (cur === t[0]) + '" data-act="theme" data-v="' + t[0] + '"><span class="hx-pv" data-theme="' + t[0] + '" aria-hidden="true"><i class="h"></i><i class="k"><b></b></i><i class="k s"></i><i class="c"></i></span><span class="hx-tl">' + t[1] + (cur === t[0] ? ' ✓' : '') + '</span></button>').join('')
    + '</div><p class="dim">خطتك وبياناتك لا تتغير، يتغير الشكل فقط. يُحفظ على هذا الجوال. أيقونة التطبيق تتبع الثيم أيضاً: عند التثبيت تُؤخذ أيقونة ثيمك الحالي (أندرويد يحدّثها لاحقاً من تلقاء نفسه، وآيفون يحتاج حذف الأيقونة وإعادة إضافتها).</p></section>';
}
function tabProgress() {
  const W = S.weights.slice().sort((a, b) => a[0] - b[0]).slice(-10);
  let chart = '<div class="empty sm">' + emptyArt('weight') + '<h3>ابدأ منحنى وزنك</h3><p class="dim">سجّل وزنك أسبوعياً ليظهر منحناك هنا.</p></div>', diff = 0;
  if (W.length) {
    const ys = W.map((w) => w[1]), mn = Math.floor(Math.min(...ys) - .5), mx = Math.ceil(Math.max(...ys) + .5);
    const X = (i) => W.length === 1 ? 165 : 34 + i * (300 - 44) / (W.length - 1), Y = (v) => 10 + (mx - v) / (mx - mn) * 120;
    const ticks = [mn, (mn + mx) / 2, mx].map((v) => '<text x="0" y="' + (Y(v) + 4) + '">' + v.toFixed(1) + '</text><line x1="30" x2="300" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="rgba(255,255,255,.08)"/>').join('');
    const lbl = W.map((w, i) => (W.length > 6 && i % 2 && i !== W.length - 1) ? '' : '<text x="' + X(i) + '" y="150" text-anchor="middle">' + new Date(w[0]).toLocaleDateString('ar', { day: 'numeric', month: 'short' }) + '</text>').join('');
    const dots = W.map((w, i) => '<circle cx="' + X(i) + '" cy="' + Y(w[1]) + '" r="' + (i === W.length - 1 ? 5 : 3.5) + '" fill="' + (i === W.length - 1 ? '#6fe3a9' : '#9dbbff') + '"/>').join('');
    diff = +(ys[ys.length - 1] - ys[0]).toFixed(1);
    chart = '<svg class="chart" viewBox="0 0 310 160" role="img" aria-label="منحنى الوزن">' + ticks + '<polyline points="' + W.map((w, i) => X(i) + ',' + Y(w[1])).join(' ') + '" fill="none" stroke="#9dbbff" stroke-width="2.5" stroke-linejoin="round"/>' + dots + lbl + '</svg>';
  }
  const bars = [6, 5, 4, 3, 2, 1, 0].map((back) => { const dt = new Date(now() - back * 86400000), n = DATA.dayNames[dt.getDay()] || '', v = adhBack(back); return '<div><b>' + (v == null ? '' : Math.round(v * 100)) + '</b><i class="' + (v == null ? 'na' : v < .6 ? 'lo' : '') + '" style="height:' + (v == null ? 6 : Math.max(6, v * 80)) + 'px"></i><small>' + esc(String(n).replace('ال', '').slice(0, 3)) + '</small></div>'; }).join('');
  const sw = stepsWeek();
  return hpTop() + (sw.nd ? '<section class="card stack"><h3>👣 خطواتي آخر 7 أيام</h3><div class="stats3"><div class="st"><b>' + sw.tot.toLocaleString('ar') + '</b><small>خطوة</small></div><div class="st"><b>' + sw.avg.toLocaleString('ar') + '</b><small>متوسط يومي</small></div><div class="st"><b>' + sw.nd + '</b><small>أيام مسجّلة</small></div></div><p class="dim">سجّلها من «تسجيل اليوم» كما يعرضها عدّاد جوالك أو ساعتك.</p></section>' : '') + suppCard() + ptsCard() + '<h2>تقدّمي</h2><section class="card stack"><div class="row" style="justify-content:space-between"><h3>الوزن</h3><span class="dim">' + (W.length > 1 ? (diff <= 0 ? diff + ' كجم منذ البداية' : '+' + diff + ' كجم') : '') + '</span></div>' + chart
    + '<div class="row"><input class="inp" id="wIn" type="text" data-numf="1" autocomplete="off" inputmode="decimal" placeholder="وزن اليوم (كجم)" style="flex:1"><button class="btn sm" data-act="weigh">' + I('scale') + ' سجّل</button></div></section>'
    + '<section class="card stack"><div class="row" style="justify-content:space-between"><h3>الالتزام آخر 7 أيام</h3><span class="dim">% من الأصناف</span></div><div class="wk">' + bars + '</div></section>'
    + '<section class="card achcard"><div class="row" style="justify-content:space-between"><h3>🏅 إنجازاتي</h3><span class="dim">' + (S.ach || []).length + ' شهادة</span></div><button class="btn sm" data-act="achs">' + I('sparkle') + ' عرض إنجازاتي وشهاداتي</button></section>' + habitsProgress() + themeCard() + whCard() + remCard() + '<section class="card stack"><h3>الحساب</h3><p class="dim">ملفك لدى ' + esc(S.dname) + (S.code ? ' • رقم ' + esc(S.code) : '') + '. بياناتك محفوظة مشفّرة على هذا الجوال فقط.</p>' + installCard('acct') + notifCard(false) + '<div class="row"><button class="btn sm sec" data-act="lock">' + I('lock') + ' قفل التطبيق</button><button class="btn sm sec" data-act="xferNew">' + I('phone') + ' نقل حسابي</button></div><button class="link" data-act="wipe" style="color:var(--coral)">حذف بياناتي من هذا الجوال</button></section>';
}

// ---------- التثقيف: منشورات أخصائيك (ومنشورات عامة لمراجعي «حصة» توافق عليها الإدارة) — إعجاب وتعليق
// محتوى عام يُجلب من المحطة بلا تشفير؛ لا يُحفظ على الجوال إلا رقم آخر منشور رأيته (لشارة «جديد»).
const FD = { posts: [], more: false, busy: false, err: '', at: 0, top: 0, play: {}, cm: {} };
const fdNew = () => Math.max(0, FD.posts.filter((x) => x.id > (S.feedSeen || 0)).length);
async function fdLoad(more) {
  if (!S || !S.cid || FD.busy) return; FD.busy = true;
  try {
    const last = FD.posts.length ? FD.posts[FD.posts.length - 1].id : 0, j = await api('GET', '/v1/feed' + (more && last ? '?before=' + last : ''));
    FD.posts = more ? FD.posts.concat(j.posts) : j.posts; FD.more = j.more; FD.err = ''; FD.at = now();
    if (S.feedSeen == null) S.feedSeen = FD.posts.length ? FD.posts[0].id : 0;       // أول مرة: لا شارة لما نُشر قبل انضمامك
  } catch (e) { FD.err = e.net ? 'لا اتصال بالإنترنت' : e.message; }
  finally { FD.busy = false; }
}
function fdSeen() { if (S.tab === 'feed' && FD.posts.length && FD.posts[0].id > (S.feedSeen || 0)) { S.feedSeen = FD.posts[0].id; save(); } }
const ago = (t) => { const s = Math.max(0, Math.floor(now() / 1000 - t)); return s < 60 ? 'الآن' : s < 3600 ? 'منذ ' + Math.floor(s / 60) + ' د' : s < 86400 ? 'منذ ' + Math.floor(s / 3600) + ' س' : s < 7 * 86400 ? 'منذ ' + Math.floor(s / 86400) + ' يوم' : new Date(t * 1000).toLocaleDateString('ar', { day: 'numeric', month: 'short' }); };
function ytId(u) { const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/.exec(String(u || '')); return m ? m[1] : ''; }
function fdMedia(x) {
  const im = x.media.filter((m) => m.t === 'i'), vd = x.media.filter((m) => m.t === 'v'), reel = x.kind === 'reel' || /\/shorts\//.test(x.link || '');
  let h = im.length ? '<div class="pimgs n' + Math.min(im.length, 4) + '">' + im.slice(0, 4).map((m) => '<img src="/m/' + m.key + '" alt="" loading="lazy"' + (m.w && m.h ? ' width="' + m.w + '" height="' + m.h + '"' : '') + '>').join('') + '</div>' : '';
  h += vd.map((m) => '<video class="pvid' + (reel ? ' reel' : '') + '" data-keep="v' + m.key + '" src="/m/' + m.key + '" controls playsinline preload="metadata"></video>').join('');
  const y = ytId(x.link);
  if (y) h += FD.play[x.id] ? '<div class="pyt' + (reel ? ' reel' : '') + '"><iframe src="https://www.youtube-nocookie.com/embed/' + y + '?autoplay=1&playsinline=1&rel=0" title="فيديو" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'
    : '<button class="pyt ph' + (reel ? ' reel' : '') + '" data-act="fdPlay" data-v="' + x.id + '"><span>' + I('play') + '</span><b>تشغيل الفيديو</b></button>';
  return h;
}
function fdCard(x) {
  return '<article class="card post" data-pid="' + x.id + '"><div class="phd"><span class="pav">' + esc(String(x.author || 'أ').trim().charAt(0)) + '</span><div><b>' + esc(x.author || 'أخصائي التغذية') + '</b><small>' + ago(x.at) + ' • ' + (x.mine ? 'من أخصائيك' : 'منشور عام') + '</small></div>' + (x.kind === 'tip' ? '<span class="ptag">💡 نصيحة</span>' : '') + '</div>'
    + (x.title ? '<h3 class="pt">' + esc(x.title) + '</h3>' : '') + (x.body ? '<p class="pb">' + esc(x.body) + '</p>' : '') + fdMedia(x)
    + '<div class="pf"><button class="' + (x.liked ? 'on' : '') + '" data-act="fdLike" data-v="' + x.id + '" aria-pressed="' + x.liked + '">' + I('heart') + '<span>' + (x.likes || '') + '</span> أعجبني</button><button data-act="fdCm" data-v="' + x.id + '">' + I('msg') + '<span>' + (x.comments || '') + '</span> تعليق</button></div></article>';
}
function tabFeed() {
  fdSeen();
  return '<div class="row" style="justify-content:space-between"><h2>تثقيف</h2><button class="btn sm sec" data-act="fdRefresh">' + I('reset') + ' تحديث</button></div><div class="dim">نصائح ومواضيع وفيديوهات من ' + esc(S.dname) + ' ومن أخصائيي «حصة»</div>'
    + (FD.err ? '<div class="banner warn">' + I('alert') + '<span>' + esc(FD.err) + '</span></div>' : '')
    + (FD.posts.length ? FD.posts.map(fdCard).join('') + (FD.more ? '<button class="btn sec" data-act="fdMore">' + (FD.busy ? 'جارٍ التحميل…' : 'المزيد') + '</button>' : '')
      : '<div class="empty">' + emptyArt('news') + '<h3>' + (FD.at ? 'لا منشورات بعد' : 'جارٍ التحميل…') + '</h3><p class="dim">' + (FD.at ? 'ما ينشره أخصائيك من نصائح ومواضيع وفيديوهات يظهر هنا، وتستطيع الإعجاب به والتعليق عليه.' : '') + '</p></div>');
}
function cmSheet() {
  const c = FD.cm[sheet.pid], x = FD.posts.find((p) => p.id === sheet.pid) || {}, me = String(S.p.name || '').trim().split(/\s+/)[0] || 'مراجع';
  return '<p class="dim">' + esc(x.title || String(x.body || '').slice(0, 80)) + '</p>' + (!c ? '<div class="spin"></div>' : c.err ? '<p class="err">' + esc(c.err) + '</p>'
    : (c.list.length ? '<div class="cms">' + c.list.map((m) => '<div class="cm' + (m.dr ? ' dr' : '') + '"><b>' + esc(m.name) + (m.dr ? ' <span class="ptag">أخصائي</span>' : '') + '</b><p>' + esc(m.body) + '</p><small>' + ago(m.at) + (m.del ? ' • <button class="lnk" data-act="fdCmDel" data-v="' + m.id + '">حذف</button>' : '') + '</small></div>').join('') + '</div>' : '<p class="dim">لا تعليقات بعد. كن أول من يعلّق.</p>'))
    + '<textarea class="inp" id="cmIn" maxlength="1000" placeholder="اكتب تعليقاً أو سؤالاً…"></textarea><label class="chk"><input type="checkbox" id="cmAnon"' + (S.fdAnon ? ' checked' : '') + '> علّق باسم «مراجع» بدل اسمك</label><button class="btn" data-act="fdCmSend">' + I('send') + ' نشر التعليق</button>'
    + '<p class="dim">التعليق يراه من يرى المنشور' + (x.mine ? ' (مراجعو أخصائيك)' : ' (مراجعو «حصة»)') + ' باسم «' + esc(S.fdAnon ? 'مراجع' : me) + '». لا تكتب بيانات صحية خاصة؛ اسأل أخصائيك عنها في «راسل الأخصائي».</p>';
}
async function fdComments(pid) { try { const j = await api('GET', '/v1/posts/' + pid + '/comments'); FD.cm[pid] = { list: j.comments }; } catch (e) { FD.cm[pid] = { list: [], err: e.net ? 'لا اتصال بالإنترنت' : e.message }; } if (sheet && sheet.t === 'cm' && sheet.pid === pid) render(); }
// ---------- صور الوجبات: تُضغط على الجوال (حوالي 100 كيلوبايت) وتُشفَّر لأخصائيك فقط؛ يبقى هنا مصغّر صغير، ويصل تعليقه عليها
function shrink(file, dims) {
  return new Promise((res, rej) => {
    const im = new Image(), fr = new FileReader();           // data: لا blob: (سياسة أمان الصفحة تسمح بـ data: للصور فقط)
    im.onload = () => { const out = dims.map(([mx, q]) => { const k = Math.min(1, mx / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(im, 0, 0, cv.width, cv.height); return cv.toDataURL('image/jpeg', q); }); res(out); };
    im.onerror = () => rej(new Error('تعذّر فتح الصورة')); fr.onload = () => { im.src = fr.result; }; fr.onerror = () => rej(new Error('تعذّر قراءة الصورة')); fr.readAsDataURL(file);
  });
}
async function phTake(file, si) {
  if (!file) return; toast('جارٍ تجهيز الصورة…');
  try {
    const [a, b, c, th] = await shrink(file, [[1024, 0.72], [860, 0.6], [700, 0.5], [240, 0.6]]), img = [a, b, c].find((x) => x.length < 165000) || c;
    const id = 'p' + now().toString(36) + Math.random().toString(36).slice(2, 5), sl = dayPlan(TODAY).slots[si] || {}, d = dkey(new Date());
    S.photos = (S.photos || []).concat([{ id, d, si, th, ts: now() }]).slice(-30);
    send({ t: 'photo', id, d, si, slot: sl.name || '', img: img.split(',')[1] }); toast('أُرسلت صورة ' + (sl.name || 'وجبتك') + ' لأخصائيك');
  } catch (e) { toast(e.message); }
}
function phStrip(si) {
  const ps = (S.photos || []).filter((p) => p.d === dkey(new Date()) && p.si === si); if (!ps.length) return '';
  return '<div class="phs">' + ps.map((p) => '<figure><img src="' + p.th + '" alt="صورة الوجبة"><figcaption>' + (p.cm ? '<b>' + esc(S.dname) + ':</b> ' + esc(p.cm) : S.outbox.some((q) => q.id === p.id) ? 'بانتظار الإرسال…' : 'وصلت أخصائيك ✓') + '</figcaption></figure>').join('') + '</div>';
}
// ---------- الوصفات: يكتبها الأخصائي لوجبات البنك (خطوات ووقت وصورة) وتصل مع الخطة
function rcpSheet() {
  const [d, si] = sheet.k.split('_').map(Number), s = dayPlan(d).slots[si], r = S.pm.recipes[s.meal] || {};
  return '<div class="rcp">' + (r.img ? '<img src="/m/' + esc(r.img) + '" alt="' + esc(s.meal) + '">' : '') + (r.mins ? '<p class="dim">' + I('clock') + ' التحضير حوالي ' + (+r.mins) + ' دقيقة</p>' : '') + (/^[A-Za-z0-9_-]{11}$/.test(r.yt || '') ? '<div class="pyt rcpyt"><iframe src="https://www.youtube-nocookie.com/embed/' + r.yt + '?playsinline=1&rel=0" title="فيديو التحضير" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' : '')
    + '<h3>المقادير لك</h3><ul class="plist">' + s.lines.map((l) => '<li>' + esc(lineT(l)) + '</li>').join('') + '</ul>' + ((r.steps || []).length ? '<h3>الطريقة</h3><ol class="steps">' + r.steps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' : '') + (r.tip ? '<div class="banner ok">' + I('sparkle') + '<span>' + esc(r.tip) + '</span></div>' : '') + '</div>';
}
// ---------- التذكيرات: الماء كل ساعتين والوجبات في أوقات خطتك — تصل والتطبيق مغلق (المحطة تعرف الأوقات فقط)
const WATER = [600, 720, 840, 960, 1080, 1200];
const MEDMAX = 4, hm2m = (x) => { const m = /^(\d{1,2}):(\d{2})/.exec(x || ''); return m ? (Math.round((+m[1] * 60 + +m[2]) / 15) * 15) % 1440 : null; };
function remLimit(it) {                              // 0.54: ساعات الهدوء وحد أقصى يومي (الدواء والمواعيد لا تُحذف أبداً)
  const R = S.rem || {}, q = R.quiet ? [hm2m(R.qFrom || '23:00'), hm2m(R.qTo || '07:00')] : null, keep = (x) => x.t === 'med' || x.t === 'appt' || x.t === 'pr';
  const inQ = (m) => q && (q[0] <= q[1] ? m >= q[0] && m < q[1] : m >= q[0] || m < q[1]);
  let out = it.filter((x) => keep(x) || !inQ(x.m)); const cap = +R.cap || 0;
  if (cap) { const order = ['water', 'meal', 'wk', 'adhPm', 'adhAm']; while (out.filter((x) => !x.d).length > cap) { const t = order.find((k) => out.some((x) => x.t === k)); if (!t) break; const i = out.map((x) => x.t).lastIndexOf(t); out.splice(i, 1); } }
  return out;
}
function remItems() {                              // أوقات اليوم المحلية (دقائق من منتصف الليل، مقرّبة لربع ساعة): ماء • وجبات • أذكار الصباح والمساء • مواعيد الدواء (اسم الدواء يبقى على الجوال ولا يصل المحطة)
  const R = S.rem || {}, it = []; if (R.water) WATER.forEach((m) => it.push({ m, t: 'water' }));
  if (R.meals && S.plan) dayPlan(TODAY).slots.forEach((s) => { const m = hm2m(s.time); if (m != null) it.push({ m, t: 'meal', label: s.name }); });
  if (R.adhAm && isMus()) { const m = hm2m(R.adhAmT || '06:00'); if (m != null) it.push({ m, t: 'adhAm' }); }
  if (R.adhPm && isMus()) { const m = hm2m(R.adhPmT || '17:30'); if (m != null) it.push({ m, t: 'adhPm' }); }
  if (R.med) (R.meds || []).slice(0, MEDMAX).forEach((x) => { const m = hm2m(x.t); if (m != null) it.push({ m, t: 'med', label: String(x.n || '').slice(0, 40) }); });
  const P = R.pray ? prNow() : null, q15 = (m) => Math.min(1425, Math.ceil(m / 15) * 15);   // الأذان ثم أقرب ربع ساعة بعده (لا قبله)
  if (P) ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((k) => it.push({ m: q15(P[k]), t: 'pr', label: PRN[k] + ' ' + hm12(m2hm(P[k])) }));
  if (R.sal && isMus()) { const m = hm2m(R.salT || '21:00'); if (m != null) it.push({ m, t: 'sal' }); if (new Date().getDay() === 5) [10 * 60, 13 * 60 + 30, 17 * 60].forEach((x) => it.push({ m: x, t: 'sal', d: dkey(new Date()) })); }
  const eve = 20 * 60, dk = (t) => dkey(new Date(t));                       // 0.54: تذكير قبل الموعد بيوم (والقياس الأسبوعي) بتاريخ محدد
  (S.appts || []).forEach((a) => { const t = new Date(a.d + 'T12:00').getTime() - 864e5; if (t > now() - 864e5) it.push({ m: eve, t: 'appt', d: dk(t), label: hm12(a.t) + (a.mode ? ' • ' + a.mode : '') }); });
  if (S.plan && S.planAt) it.push({ m: eve, t: 'wk', d: dk(wkBase() + WKD - 864e5) });
  return remLimit(it);
}
async function remSync(force) {
  if (!S || !S.cid) return; const it = remItems(), off = new Date().getTimezoneOffset(), sig = JSON.stringify(it) + off; if (!force && sig === S.remSig) return;
  try { if ('caches' in window) await (await caches.open('hissati-rem')).put('/rem', new Response(JSON.stringify({ items: it }), { headers: { 'content-type': 'application/json' } })); } catch (e) { }
  try { await api('POST', '/v1/remind', { mins: it.map((x) => ((x.m + off) % 1440 + 1440) % 1440) }); S.remSig = sig; save(); } catch (e) { }
}
function remCard() {
  const R = S.rem || {}, tg = (k, t, d) => '<label class="remrow"><span><b>' + t + '</b><span class="dim">' + d + '</span></span><input type="checkbox" class="sw" data-rem="' + k + '"' + (R[k] ? ' checked' : '') + '></label>';
  const tm = (k, def, lbl) => '<div class="remsub"><label class="dim" for="rt_' + k + '">' + lbl + '</label><input id="rt_' + k + '" class="inp tm" type="time" step="900" data-remt="' + k + '" value="' + esc(R[k] || def) + '"></div>';
  const meds = R.med ? '<div class="remsub meds">' + (R.meds || []).map((x, i) => '<div class="medrow"><input class="inp" type="text" maxlength="40" placeholder="اسم الدواء (اختياري)" aria-label="اسم الدواء ' + (i + 1) + '" data-med="n|' + i + '" value="' + esc(x.n || '') + '"><input class="inp tm" type="time" step="900" aria-label="وقت الدواء ' + (i + 1) + '" data-med="t|' + i + '" value="' + esc(x.t || '08:00') + '"><button class="btn sm sec" data-act="medDel" data-v="' + i + '" aria-label="حذف الموعد ' + (i + 1) + '">' + I('x') + '</button></div>').join('')
    + ((R.meds || []).length < MEDMAX ? '<button class="btn sm sec" data-act="medAdd">' + I('plus') + ' أضف موعد دواء</button>' : '<span class="dim">وصلت للحد الأقصى (' + MEDMAX + ' مواعيد)</span>') + '<span class="dim">اسم الدواء يبقى على جوالك فقط؛ المحطة تعرف الوقت وحده.</span></div>' : '';
  return '<section class="card stack"><h3>' + I('bell') + ' التذكيرات</h3>' + tg('water', 'شرب الماء', 'كل ساعتين من 10 صباحاً إلى 8 مساءً') + tg('meals', 'مواعيد الوجبات', 'في أوقات وجبات خطتك')
    + (isMus() ? tg('adhAm', 'أذكار الصباح', 'تذكير يومي بوقتك المفضّل') + (R.adhAm ? tm('adhAmT', '06:00', 'وقت أذكار الصباح') : '') + tg('adhPm', 'أذكار المساء', 'تذكير يومي بوقتك المفضّل') + (R.adhPm ? tm('adhPmT', '17:30', 'وقت أذكار المساء') : '') : '')
    + tg('med', 'موعد الدواء', 'تذكير بأوقات أدويتك أو مكمّلاتك') + meds
    + '<label class="remrow"><span><b>صوت المنبّه</b><span class="dim">رنّة هادئة عندما يظهر التذكير على الشاشة</span></span><input type="checkbox" class="sw" data-remsound="1"' + (R.sound === false ? '' : ' checked') + '></label>'
    + (isMus() ? tg('pray', '🕌 مواقيت الصلاة', 'تذكير عند كل صلاة حسب مدينتك (الهيئة المصرية لمصر، وأم القرى للسعودية)') + (R.pray ? '<div class="remsub"><label class="dim" for="prCity">مدينتي</label><select class="inp" id="prCity" data-prcity>' + cityOpts(R.prCity) + '</select></div>' : '')
    + tg('sal', 'ﷺ الصلاة على النبي', 'تذكير يومي بوقتك، ويوم الجمعة ثلاث مرات') + (R.sal ? tm('salT', '21:00', 'وقت التذكير اليومي') : '') : '')
    + '<label class="remrow"><span><b>ساعات الهدوء</b><span class="dim">لا تذكيرات (إلا الدواء والمواعيد) في هذه الساعات</span></span><input type="checkbox" class="sw" data-rem="quiet"' + (R.quiet ? ' checked' : '') + '></label>' + (R.quiet ? '<div class="remsub"><label class="dim" for="rt_qFrom">من</label><input id="rt_qFrom" class="inp tm" type="time" step="900" data-remt="qFrom" value="' + esc(R.qFrom || '23:00') + '"><label class="dim" for="rt_qTo">إلى</label><input id="rt_qTo" class="inp tm" type="time" step="900" data-remt="qTo" value="' + esc(R.qTo || '07:00') + '"></div>' : '')
    + '<div class="remsub"><label class="dim" for="remCap">الحد الأقصى للتذكيرات في اليوم</label><select class="inp" id="remCap" data-remcap>' + [[0, 'بلا حد'], [5, '5'], [8, '8'], [12, '12']].map((o) => '<option value="' + o[0] + '"' + ((+R.cap || 0) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>'
    + (pushState() === 'on' ? '<p class="dim">تصلك والتطبيق مغلق. تُقرَّب الأوقات لأقرب ربع ساعة.</p>' : '<p class="dim">تحتاج تفعيل الإشعارات؛ يُطلب الإذن عند التشغيل.</p>') + '</section>';
}
// ---------- العادات: مكتبة عادات صحية يختار منها العميل ما يتابعه في «اليوم»، لكل عادة تصميم خاص، وسلسلة أيام 🔥 وأسبوع ملوّن
// القيم في سجل اليوم (S.log[يوم].h) فتصل الأخصائي مع المتابعة اليومية؛ والماء هو كاسات اليوم نفسها.
const HABITS = [
  { id: 'adhkar', n: 'أذكار الصباح', ic: '📿', c: '#6fe3a9', why: 'للمسلم: أذكار الصباح من حصن المسلم، تلمس الذكر لكل مرة ويمتلئ القلب بالأخضر حتى يكتمل — طمأنينة تبدأ بها يومك.', ok: (v) => adhDone(v) >= ADH_TOTAL },
  { id: 'adhkarPm', n: 'أذكار المساء', ic: '🌙', c: '#b9b2ff', why: 'أذكار المساء من حصن المسلم: تلمس الذكر لكل مرة ويمتلئ القلب بالبنفسجي حتى يكتمل — تختم به يومك بسكينة.', ok: (v) => adhDone(v, 'adhkarPm') >= ADH_PM_TOTAL },
  { id: 'water', n: 'شرب الماء', ic: '💧', c: '#7fa8ff', why: 'الماء يقلل الجوع الكاذب ويحسّن الطاقة والتركيز وعمل الكلى. هدفك من خطتك.', ok: (v) => v >= hWaterGoal() },
  { id: 'steps', n: 'المشي اليومي', ic: '🚶', c: '#6fe3a9', why: '8 آلاف خطوة يومياً مرتبطة بصحة القلب وحرق أفضل وتحكم في الشهية — دون نادٍ رياضي.', goal: 8000, ok: (v) => v >= 8000 },
  { id: 'sleep', n: 'النوم الكافي', ic: '😴', c: '#b39dff', why: 'النوم أقل من 7 ساعات يرفع هرمون الجوع ويزيد الرغبة في السكريات. الهدف 7–9 ساعات.', ok: (v) => v >= 7 && v <= 9 },
  { id: 'veg', n: 'خضار وفاكهة', ic: '🥗', c: '#8fd16a', why: '5 حصص يومياً من الخضار والفاكهة: ألياف تُشبع وفيتامينات تحمي — املأ صحنك الملوّن.', ok: (v) => v >= 5 },
  { id: 'sugar', n: 'يوم بلا سكر مضاف', ic: '🍬', c: '#ff9d88', why: 'بلا حلويات ولا مشروبات غازية أو عصائر محلّاة. كل يوم تكسبه يقوّي سلسلتك.', ok: (v) => v === 1 },
  { id: 'move', n: 'النشاط البدني', ic: '⚡', c: '#ffd27a', why: '30 دقيقة حركة يومياً (مشي سريع، رياضة، درج) — اشحن بطاريتك 10 دقائق في كل مرة.', ok: (v) => v >= 30 },
  { id: 'breath', n: 'تنفّس وهدوء', ic: '🫧', c: '#7fe3e0', why: 'التوتر يدفع للأكل العاطفي. دقيقتان من التنفّس الهادئ تخفضه — جلسة موجّهة داخل التطبيق.', ok: (v) => v >= 1 },
  { id: 'mindful', n: 'أكل بوعي بلا شاشة', ic: '🍽', c: '#f6a6d1', why: 'الأكل ببطء ودون جوال أو تلفاز يمنح الشبع وقته (20 دقيقة) فتأكل أقل وتستمتع أكثر.', ok: (v) => (v || []).length >= 2 },
  { id: 'kitchen', n: 'المطبخ مغلق ليلاً', ic: '🌙', c: '#9dbbff', why: 'لا أكل بعد العشاء حتى النوم: نوم أعمق وهضم أريح وسعرات أقل دون حرمان.', ok: (v) => v === 1 },
  { id: 'coffee', n: 'كافيين باعتدال', ic: '☕', c: '#d9a77a', why: 'حتى 3 أكواب يومياً، وآخرها قبل العصر، حتى لا يسرق نومك.', ok: (v) => v != null && v <= 3 },
  // ---- مكتبة العصر (0.39): عادات رقمية ونفسية وحركية صغيرة لكل منها تصميم خاص
  { id: 'social', n: 'استراحة من السوشيال ميديا', ic: '📵', c: '#ff8fb1', why: 'يوم بلا تصفّح التطبيقات الاجتماعية: وقت وتركيز يعودان إليك، وأكل أقل أمام الشاشة. ابدأ بيوم واحد وابنِ سلسلتك.', ok: (v) => v === 1 },
  { id: 'sunset', n: 'شاشات مطفأة قبل النوم', ic: '📴', c: '#9aa7ff', why: 'أطفئ الجوال والتلفاز قبل نومك بساعة: ضوء الشاشة يؤخّر النعاس، وغيابه يساعد على نوم أسرع وأهدأ.', ok: (v) => v === 1 },
  { id: 'gratitude', n: 'امتنان: ثلاث نعم', ic: '🌸', c: '#ffb86b', why: 'تذكّر أو اكتب ثلاثة أشياء تشكر عليها اليوم. الممارسة اليومية للامتنان ترتبط بتحسّن المزاج وهدوء البال.', ok: (v) => v >= 3 },
  { id: 'sunlight', n: 'شمس الصباح', ic: '☀️', c: '#ffd166', why: '15 دقيقة من ضوء النهار صباحاً تضبط ساعتك الداخلية فتنعكس على نومك وطاقتك ومزاجك.', ok: (v) => v >= 15 },
  { id: 'breaks', n: 'حركة كل ساعة', ic: '⏱', c: '#7be0c3', why: 'الجلوس الطويل يُبطئ الجسم: قم وتحرّك دقيقتين كل ساعة (تمشَّ، تمدّد، اشرب ماء). الهدف 5 مرات في يومك.', ok: (v) => v >= 5 },
  { id: 'reading', n: 'قراءة أو وِرد هادئ', ic: '📖', c: '#c4a8ff', why: '10 دقائق من القراءة أو وِردك اليومي بدل التصفّح: هدوء يختم يومك ويبني عادة تدوم.', ok: (v) => v >= 10 },
  { id: 'meds', n: 'الدواء والمكمّلات في موعدها', ic: '💊', c: '#7fc8ff', why: 'التزامك بدوائك أو مكمّلاتك كما وصفها طبيبك أو أخصائيك أهم من كل عادة. فعّل تذكير الدواء من «تقدّمي».', ok: (v) => v === 1 },
  { id: 'stretch', n: 'تمدّد وإطالة', ic: '🧘', c: '#8de0a0', why: '5 دقائق من التمدّد تخفّف شدّ الظهر والرقبة وتحسّن مرونتك — مناسب لمن يجلس كثيراً.', ok: (v) => v >= 5 },
  { id: 'postwalk', n: 'مشي بعد الوجبة', ic: '🚶‍♀️', c: '#f0a36b', why: 'مشي هادئ 10 دقائق بعد الوجبة يساعد على ضبط سكر الدم بعدها ويخفّف الثقل. (لمرضى السكري: استشر أخصائيك.)', ok: (v) => v >= 1 }
];
const HB = (id) => HABITS.find((h) => h.id === id);
function hWaterGoal() { const dp = S.plan ? dayPlan(TODAY) : {}, wt = +(dp.water || DATA.water || 2.5); return Math.max(4, Math.min(16, Math.round(wt / CUP))); }
const RELH = ['adhkar', 'adhkarPm'];
function hList() { if (!Array.isArray(S.habits)) S.habits = ['water']; return S.habits.filter((id) => HB(id) && (isMus() || !RELH.includes(id))); }
function hVal(id, k) { const L = S.log[k || dkey(new Date())]; if (!L) return null; if (id === 'water') return L.water || 0; return L.h ? L.h[id] : null; }
function hSet(id, v) { const L = dl(TODAY); if (id === 'water') L.water = v; else { L.h = L.h || {}; if (v == null) delete L.h[id]; else L.h[id] = v; } queueLog(dkey(new Date())); }
function hOkDay(id, k) { const v = hVal(id, k); return v != null && HB(id).ok(v); }
function hStreak(id) { let n = 0, d = new Date(); if (!hOkDay(id, dkey(d))) d.setDate(d.getDate() - 1); while (n < 400 && hOkDay(id, dkey(d))) { n++; d.setDate(d.getDate() - 1); } return n; }
function hWeek(id) { return [6, 5, 4, 3, 2, 1, 0].map((b) => { const d = new Date(now() - b * 86400000), k = dkey(d), v = hVal(id, k); return '<i class="' + (v == null ? '' : HB(id).ok(v) ? 'ok' : 'no') + (b === 0 ? ' td' : '') + '" title="' + esc(DATA.dayNames[d.getDay()] || '') + '"></i>'; }).join(''); }
function hArc(p, r, w, col) { const C = Math.PI * r; return '<path d="M' + (60 - r) + ' 60 A' + r + ' ' + r + ' 0 0 1 ' + (60 + r) + ' 60" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="' + w + '" stroke-linecap="round"/><path d="M' + (60 - r) + ' 60 A' + r + ' ' + r + ' 0 0 1 ' + (60 + r) + ' 60" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - Math.min(1, p))) + '"/>'; }
function hWidget(h) {
  const v = hVal(h.id), b = (k, lbl, cls) => '<button class="' + (cls || '') + '" data-act="hb" data-v="' + h.id + '" data-k="' + k + '">' + lbl + '</button>';
  switch (h.id) {
    case 'water': { const g = hWaterGoal(), n = v || 0, pct = Math.min(1, n / g);
      return '<div class="hw-water"><svg viewBox="0 0 60 100" class="bottle" aria-hidden="true"><defs><clipPath id="bt"><path d="M22 4h16v12l8 10v66a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V26l8-10z"/></clipPath></defs><g clip-path="url(#bt)"><rect x="0" y="0" width="60" height="100" fill="rgba(255,255,255,.07)"/><rect class="wv" x="0" y="' + (100 - 88 * pct) + '" width="60" height="100" fill="url(#wg)"/></g><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c4ff"/><stop offset="1" stop-color="#5d86f0"/></linearGradient><path d="M22 4h16v12l8 10v66a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V26l8-10z" fill="none" stroke="rgba(169,196,255,.7)" stroke-width="2"/></svg>'
        + '<div class="hwr"><b class="big">' + (n * CUP).toFixed(2).replace(/\.?0+$/, '') + ' <small>من ' + (g * CUP).toFixed(1) + ' لتر</small></b><div class="cups">' + Array.from({ length: g }, (_, i) => '<button class="' + (i < n ? 'f' : '') + '" data-act="water" data-v="' + (i + 1) + '" aria-label="' + (i + 1) + ' أكواب"></button>').join('') + '</div><span class="dim">كوب = 250 مل • المس الكوب</span></div></div>'; }
    case 'steps': { const n = v || 0;
      return '<div class="hw-gauge"><svg viewBox="0 0 120 70">' + hArc(n / 8000, 48, 10, h.c) + '<text x="60" y="52" text-anchor="middle" class="gv">' + n.toLocaleString('en') + '</text><text x="60" y="66" text-anchor="middle" class="gl">من 8,000 خطوة</text></svg><div class="row hbtns">' + b('-1000', '−1000', 'btn sm sec') + b('set', 'اكتب العدد', 'btn sm sec') + b('+1000', '+1000', 'btn sm') + '</div></div>'; }
    case 'sleep': { const n = v || 0;
      return '<div class="hw-sleep"><div class="sky"><span class="moon"></span>' + [12, 30, 55, 72, 88].map((x, i) => '<i class="star" style="left:' + x + '%;top:' + (14 + (i * 23) % 50) + '%"></i>').join('') + '<b>' + (n ? n + ' ساعات' : 'كم نمت؟') + '</b>' + (n ? '<small>' + (h.ok(n) ? 'نوم مثالي ✨' : n < 7 ? 'أقل من حاجتك' : 'أكثر من المعتاد') + '</small>' : '') + '</div><div class="chips">' + [5, 6, 7, 8, 9, 10].map((x) => b(x, x + 'س', 'chip' + (n === x ? ' on' : '') + (x >= 7 && x <= 9 ? ' good' : ''))).join('') + '</div></div>'; }
    case 'veg': { const n = v || 0, cols = ['#8fd16a', '#ff9d6b', '#e85d75', '#ffd27a', '#6fe3a9'];
      const sl = cols.map((c, i) => { const a0 = (i / 5) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / 5) * 2 * Math.PI - Math.PI / 2, x0 = 50 + 40 * Math.cos(a0), y0 = 50 + 40 * Math.sin(a0), x1 = 50 + 40 * Math.cos(a1), y1 = 50 + 40 * Math.sin(a1);
        return '<path data-act="hb" data-v="veg" data-k="' + i + '" d="M50 50 L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A40 40 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Z" fill="' + (i < n ? c : 'rgba(255,255,255,.08)') + '" stroke="#16224f" stroke-width="2.5" style="cursor:pointer"><title>' + (i + 1) + ' حصص</title></path>'; }).join('');
      return '<div class="hw-plate"><svg viewBox="0 0 100 100" role="img" aria-label="' + n + ' من 5 حصص"><circle cx="50" cy="50" r="47" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.25)" stroke-width="2"/>' + sl + '<circle cx="50" cy="50" r="13" fill="#16224f"/><text x="50" y="55" text-anchor="middle" class="gv">' + n + '/5</text></svg><span class="dim">المس قطعة لكل حصة: كوب خضار، أو ثمرة فاكهة</span></div>'; }
    case 'sugar': case 'kitchen': { const st = hStreak(h.id), yes = h.id === 'sugar' ? 'اليوم بلا سكر ✓' : 'أغلقتُ المطبخ ✓', no = h.id === 'sugar' ? 'تناولت سكراً' : 'أكلت بعد العشاء';
      return '<div class="hw-streak"><div class="flame' + (v === 1 ? ' lit' : '') + '"><span>' + (h.id === 'sugar' ? '🔥' : '🌙') + '</span><b>' + st + '</b><small>' + (st === 1 ? 'يوم' : 'أيام') + ' متتالية</small></div><div class="col">' + b(1, yes, 'btn sm' + (v === 1 ? '' : ' sec')) + b(0, no, 'btn sm sec' + (v === 0 ? ' bad' : '')) + '</div></div>'; }
    case 'move': { const n = v || 0;
      return '<div class="hw-battery"><div class="bat">' + [0, 1, 2].map((i) => b(i, '', 'cell' + (n >= (i + 1) * 10 ? ' on' : ''))).join('') + '<span class="tip"></span></div><b>' + n + ' / 30 دقيقة</b><span class="dim">' + (n >= 30 ? '⚡ مشحون بالكامل!' : 'كل خانة = 10 دقائق حركة') + '</span></div>'; }
    case 'breath': { const n = v || 0;
      return '<div class="hw-breath"><button class="orb" data-act="breathe" aria-label="ابدأ جلسة التنفس"><span>ابدأ</span></button><div><b>' + (n ? n + (n === 1 ? ' جلسة' : ' جلسات') + ' اليوم' : 'دقيقتان فقط') + '</b><span class="dim">شهيق 4 • احبس 4 • زفير 6 ثوانٍ</span></div></div>'; }
    case 'mindful': { const sel = v || [], sl = S.plan ? dayPlan(TODAY).slots : [];
      return '<div class="hw-mind"><div class="chips">' + sl.map((s, i) => b(i, (sel.indexOf(i) >= 0 ? '✓ ' : '') + esc(s.name), 'chip' + (sel.indexOf(i) >= 0 ? ' on' : ''))).join('') + '</div><span class="dim">علّم الوجبة التي أكلتها ببطء ودون شاشة</span></div>'; }
    case 'adhkarPm': { const dn = adhDone(v, 'adhkarPm'), p = dn / ADH_PM_TOTAL;
      return '<div class="hw-adhkar pm"><div class="adheart">' + heartSvg(p, 0, 1) + '</div><div class="col"><b class="big">' + (p >= 1 ? 'اكتملت 🌙' : Math.round(p * 100) + '%') + '</b><span class="dim">' + dn + ' من ' + ADH_PM_TOTAL + ' • ' + ADHKAR_PM.length + ' ذكراً</span><button class="btn sm" data-act="adhkar" data-v="adhkarPm">' + (p >= 1 ? 'عرض الأذكار' : dn ? 'أكمل الأذكار' : 'ابدأ أذكار المساء') + '</button></div></div>'; }
    case 'adhkar': { const dn = adhDone(v), p = dn / ADH_TOTAL;
      return '<div class="hw-adhkar"><div class="adheart">' + heartSvg(p) + '</div><div class="col"><b class="big">' + (p >= 1 ? 'اكتملت 🤍' : Math.round(p * 100) + '%') + '</b><span class="dim">' + dn + ' من ' + ADH_TOTAL + ' • ' + ADHKAR.length + ' ذكراً</span><button class="btn sm" data-act="adhkar">' + (p >= 1 ? 'عرض الأذكار' : dn ? 'أكمل الأذكار' : 'ابدأ أذكار الصباح') + '</button></div></div>'; }
    case 'social': case 'sunset': case 'meds': { const on = v === 1, T = { social: ['أغلقت التطبيقات اليوم ✓', 'تصفّحت'], sunset: ['أطفأت الشاشات ✓', 'سهرت مع الشاشة'], meds: ['أخذتها في موعدها ✓', 'نسيت أو تأخرت'] }[h.id], st = hStreak(h.id);
      const ico = h.id === 'meds' ? '<svg viewBox="0 0 64 64" class="pill' + (on ? ' on' : '') + '" aria-hidden="true"><g transform="rotate(-35 32 32)"><rect x="6" y="20" width="52" height="24" rx="12" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 20h14a12 12 0 0 1 0 24H32z" fill="currentColor" opacity="' + (on ? '.85' : '.18') + '"/><path d="M32 20v24" stroke="currentColor" stroke-width="3"/></g></svg>'
        : h.id === 'sunset' ? '<svg viewBox="0 0 64 64" class="scr' + (on ? ' on' : '') + '" aria-hidden="true"><rect x="16" y="6" width="32" height="52" rx="7" fill="none" stroke="currentColor" stroke-width="3"/><rect x="21" y="13" width="22" height="34" rx="2" fill="currentColor" opacity="' + (on ? '.06' : '.5') + '"/><path d="M38 24a8 8 0 1 1-9 11 6.5 6.5 0 0 0 9-11z" fill="currentColor" opacity="' + (on ? '1' : '0') + '"/><circle cx="32" cy="52" r="2" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 64 64" class="ph' + (on ? ' on' : '') + '" aria-hidden="true"><rect x="18" y="5" width="28" height="54" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><rect x="23" y="12" width="18" height="30" rx="2" fill="currentColor" opacity="' + (on ? '.1' : '.45') + '"/><g opacity="' + (on ? '1' : '0') + '"><rect x="26" y="24" width="12" height="9" rx="2" fill="currentColor"/><path d="M28 24v-3a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.5"/></g></svg>';
      return '<div class="hw-tog ' + h.id + (on ? ' lit' : '') + '"><div class="togi">' + ico + '<b>' + st + '</b><small>' + (st === 1 ? 'يوم' : 'أيام') + ' متتالية</small></div><div class="col">' + b(1, T[0], 'btn sm' + (on ? '' : ' sec')) + b(0, T[1], 'btn sm sec' + (v === 0 ? ' bad' : '')) + '</div></div>'; }
    case 'sunlight': case 'reading': case 'stretch': { const n = v || 0, goal = h.id === 'sunlight' ? 15 : h.id === 'reading' ? 10 : 5, opts = h.id === 'stretch' ? [2, 5, 10, 15] : [5, 10, 15, 20, 30], pct = Math.min(1, n / goal);
      const art = h.id === 'sunlight' ? '<svg viewBox="0 0 120 60" class="sunart" aria-hidden="true"><path d="M10 54h100" stroke="currentColor" stroke-width="2" opacity=".4"/><g style="transform:translateY(' + ((1 - pct) * 22).toFixed(0) + 'px)"><circle cx="60" cy="44" r="14" fill="currentColor" opacity="' + (.35 + .65 * pct).toFixed(2) + '"/>' + Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i + 0.5) / 9 * Math.PI, x1 = 60 + Math.cos(a) * 20, y1 = 44 + Math.sin(a) * 20, x2 = 60 + Math.cos(a) * 28, y2 = 44 + Math.sin(a) * 28; return '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="' + (pct * 9 > i ? 1 : .15) + '"/>'; }).join('') + '</g></svg>'
        : h.id === 'reading' ? '<svg viewBox="0 0 120 60" class="bookart" aria-hidden="true"><path d="M60 14C48 8 28 8 14 12v38c14-4 34-4 46 2 12-6 32-6 46-2V12C92 8 72 8 60 14z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M60 14v38" stroke="currentColor" stroke-width="2.5"/>' + [0, 1, 2, 3].map((i) => '<path d="M22 ' + (22 + i * 8) + 'h26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="' + (pct * 4 > i ? .9 : .15) + '"/>').join('') + '</svg>'
        : '<svg viewBox="0 0 120 60" class="stretchart" aria-hidden="true"><path d="M20 55h80" stroke="currentColor" stroke-width="2" opacity=".35"/><circle cx="' + (40 + 36 * pct).toFixed(0) + '" cy="14" r="7" fill="currentColor"/><path d="M' + (40 + 36 * pct).toFixed(0) + ' 22 L' + (58 + 16 * pct).toFixed(0) + ' ' + (44 - 10 * pct).toFixed(0) + ' L' + (84 + 6 * pct).toFixed(0) + ' 55 M' + (58 + 16 * pct).toFixed(0) + ' ' + (44 - 10 * pct).toFixed(0) + ' L44 55 M' + (50 + 8 * pct).toFixed(0) + ' 30 L' + (30 - 8 * pct).toFixed(0) + ' ' + (14 - 2 * pct).toFixed(0) + '" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      return '<div class="hw-mins ' + h.id + '"><div class="minart">' + art + '</div><div class="hwr"><b class="big">' + n + ' <small>من ' + goal + ' دقيقة</small></b><div class="bar"><i style="width:' + (pct * 100).toFixed(0) + '%"></i></div><div class="chips">' + opts.map((x) => b(x, x + 'د', 'chip' + (n === x ? ' on' : '') + (x >= goal ? ' good' : ''))).join('') + '</div></div></div>'; }
    case 'gratitude': { const n = v || 0;
      const petal = (i) => { const on = n > i; return '<button class="petal' + (on ? ' on' : '') + '" data-act="hb" data-v="gratitude" data-k="' + i + '" aria-label="نعمة ' + (i + 1) + '" aria-pressed="' + on + '"><svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 4C32 14 34 30 20 46 6 30 8 14 20 4z" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' + (on ? '<path d="M20 14v26" stroke="rgba(255,255,255,.45)" stroke-width="2" stroke-linecap="round"/>' : '') + '</svg><span>' + (i + 1) + '</span></button>'; };
      return '<div class="hw-grat"><div class="petals">' + [0, 1, 2].map(petal).join('') + '</div><span class="dim">' + (n >= 3 ? 'ثلاث نعم… الحمد لله 🌸' : 'المس بتلة لكل نعمة تذكرها أو تكتبها') + '</span></div>'; }
    case 'breaks': { const n = v || 0;
      return '<div class="hw-clock"><svg viewBox="0 0 110 110" class="clk" aria-hidden="true"><circle cx="55" cy="55" r="48" fill="none" stroke="currentColor" stroke-width="3" opacity=".3"/>' + Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * 2 * Math.PI - Math.PI / 2, x = 55 + 38 * Math.cos(a), y = 55 + 38 * Math.sin(a); return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5.5" fill="' + (i < n ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2.2"/>'; }).join('') + '<text x="55" y="63" text-anchor="middle" class="gv">' + n + '</text></svg><div class="col"><div class="dots">' + Array.from({ length: 8 }, (_, i) => b(i, '', 'dt' + (i < n ? ' on' : ''))).join('') + '</div><span class="dim">' + (n >= 5 ? 'جسمك يشكرك ✨' : 'المس نقطة كلما قمت وتحرّكت دقيقتين') + '</span></div></div>'; }
    case 'postwalk': { const n = v || 0, sl = S.plan ? dayPlan(TODAY).slots.slice(0, 3) : [];
      return '<div class="hw-walk"><div class="steps3">' + [0, 1, 2].map((i) => b(i, '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 32c4-2 5-9 5-14 0-3 2-5 4-5s3 2 3 5c0 6-1 12 4 15 3 2 8 1 8 1" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg><span>' + (sl[i] ? esc(sl[i].name) : 'وجبة ' + (i + 1)) + '</span>', 'wk' + (i < n ? ' on' : ''))).join('') + '</div><span class="dim">' + (n >= 1 ? 'مشيت ' + n + (n === 1 ? ' مرة' : ' مرات') + ' بعد الأكل 🚶' : 'علّم الوجبة التي مشيت 10 دقائق بعدها') + '</span></div>'; }

    case 'coffee': { const n = v == null ? -1 : v;
      return '<div class="hw-coffee"><div class="mugs">' + [0, 1, 2, 3, 4, 5].map((i) => b(i, '☕', 'mug' + (i < n ? ' on' : '') + (i >= 3 ? ' over' : ''))).join('') + '</div><div class="row">' + b('z', 'لا كافيين اليوم', 'btn sm sec' + (n === 0 ? ' on' : '')) + '<b class="' + (n > 3 ? 'warn' : '') + '">' + (n < 0 ? 'كم كوباً؟' : n + (n === 1 ? ' كوب' : ' أكواب') + ' • الحد 3') + '</b></div></div>'; }
  }
  return '';
}
function hCard(id) {
  const h = HB(id), st = hStreak(id), ok = hOkDay(id);
  return '<section class="card hb' + (ok ? ' done' : '') + '" style="--hc:' + h.c + '" data-hb="' + id + '"><div class="hbh"><span class="hbi">' + h.ic + '</span><h3>' + h.n + '</h3>' + (st ? '<span class="hbs" title="أيام متتالية">🔥 ' + st + '</span>' : '') + (ok ? '<span class="hbok">' + I('check') + '</span>' : '') + '</div>' + hWidget(h) + '<div class="hbw" aria-label="آخر 7 أيام">' + hWeek(id) + '</div></section>';
}
function habitsHome() { const ls = hList(); return '<div class="row hbhead"><h2>عاداتي</h2><button class="btn sm sec" data-act="habits">' + I('plus') + ' العادات</button></div>' + (ls.length ? ls.map(hCard).join('') : '<div class="card dim">لا عادات في صفحتك. اختر من «العادات» ما تريد تنميته.</div>'); }
function habitsSheet() {
  const ls = hList();
  return '<p class="dim">اختر العادات التي تريد تنميتها؛ تظهر في «اليوم» بتصميمها، ويرى أخصائيك تقدّمك فيها. ابدأ بعادتين أو ثلاث.</p><div class="hlib">' + HABITS.filter((h) => isMus() || !RELH.includes(h.id)).map((h) => { const on = ls.indexOf(h.id) >= 0;
    return '<div class="hli' + (on ? ' on' : '') + '" style="--hc:' + h.c + '"><span class="hbi">' + h.ic + '</span><div><b>' + h.n + '</b><span class="dim">' + h.why + '</span></div><button class="btn sm' + (on ? ' sec' : '') + '" data-act="htoggle" data-v="' + h.id + '">' + (on ? 'إزالة' : I('plus') + ' أضف') + '</button></div>'; }).join('') + '</div>';
}
function habitsProgress() {
  const ls = hList(); if (!ls.length) return '';
  return '<section class="card stack"><div class="row" style="justify-content:space-between"><h3>عاداتي هذا الأسبوع</h3><button class="btn sm sec" data-act="habits">تعديل</button></div><div class="hgrid">' + ls.map((id) => { const h = HB(id), n = [0, 1, 2, 3, 4, 5, 6].filter((b) => hOkDay(id, dkey(new Date(now() - b * 86400000)))).length;
    return '<div class="hrow" style="--hc:' + h.c + '"><span>' + h.ic + ' ' + h.n + '</span><div class="hbw">' + hWeek(id) + '</div><b>' + n + '/7</b></div>'; }).join('') + '</div></section>';
}
// جلسة تنفّس موجّهة: طبقة مستقلة خارج #root فلا تقطعها إعادة الرسم
function breathe() {
  if (document.getElementById('brx')) return; const ph = [['شهيق', 4000, 'in'], ['احبس', 4000, 'hold'], ['زفير', 6000, 'out']], total = 120000, t0 = now();
  const el = document.createElement('div'); el.id = 'brx'; el.className = 'brx'; el.innerHTML = '<div class="brc"><div class="brring"></div><b id="brt">استعد</b><small id="brs">دقيقتان</small></div><button class="btn sec" id="brstop">إنهاء</button>'; document.body.appendChild(el);
  let i = 0, tm = 0; const step = () => { const left = total - (now() - t0); if (left <= 0) return done(true); const p = ph[i % 3]; el.querySelector('.brring').className = 'brring ' + p[2]; el.querySelector('#brt').textContent = p[0]; el.querySelector('#brs').textContent = Math.ceil(left / 1000) + ' ث'; i++; tm = setTimeout(step, p[1]); };
  const done = (full) => { clearTimeout(tm); el.remove(); if (full || now() - t0 > 60000) { const was = hOkDay('breath'); hSet('breath', (hVal('breath') || 0) + 1); render(); if (!was) celebrate('breath'); else toast('أحسنت 🫧 جلسة هدوء مكتملة'); } };
  el.querySelector('#brstop').onclick = () => done(false); tm = setTimeout(step, 800);
}
// ---------- أذكار الصباح (من حصن المسلم): المس الذكر لكل مرة، ويمتلئ القلب بالأخضر حتى يكتمل
const ADHKAR = [
  ['أعوذ بالله من الشيطان الرجيم: الله لا إله إلا هو الحي القيوم لا تأخذه سنة ولا نوم له ما في السماوات وما في الأرض من ذا الذي يشفع عنده إلا بإذنه يعلم ما بين أيديهم وما خلفهم ولا يحيطون بشيء من علمه إلا بما شاء وسع كرسيه السماوات والأرض ولا يئوده حفظهما وهو العلي العظيم', 1, 'آية الكرسي'],
  ['بسم الله الرحمن الرحيم: قل هو الله أحد، الله الصمد، لم يلد ولم يولد، ولم يكن له كفوا أحد', 3, 'سورة الإخلاص'],
  ['بسم الله الرحمن الرحيم: قل أعوذ برب الفلق، من شر ما خلق، ومن شر غاسق إذا وقب، ومن شر النفاثات في العقد، ومن شر حاسد إذا حسد', 3, 'سورة الفلق'],
  ['بسم الله الرحمن الرحيم: قل أعوذ برب الناس، ملك الناس، إله الناس، من شر الوسواس الخناس، الذي يوسوس في صدور الناس، من الجنة والناس', 3, 'سورة الناس'],
  ['أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، رب أسألك خير ما في هذا اليوم وخير ما بعده، وأعوذ بك من شر ما في هذا اليوم وشر ما بعده، رب أعوذ بك من الكسل وسوء الكبر، رب أعوذ بك من عذاب في النار وعذاب في القبر', 1],
  ['اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت', 1, 'سيد الاستغفار'],
  ['اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور', 1],
  ['أصبحنا على فطرة الإسلام، وعلى كلمة الإخلاص، وعلى دين نبينا محمد صلى الله عليه وسلم، وعلى ملة أبينا إبراهيم حنيفا مسلما وما كان من المشركين', 1],
  ['اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت. اللهم إني أعوذ بك من الكفر والفقر، وأعوذ بك من عذاب القبر، لا إله إلا أنت', 3],
  ['بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم', 3],
  ['رضيت بالله ربا، وبالإسلام دينا، وبمحمد صلى الله عليه وسلم نبيا', 3],
  ['يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله، ولا تكلني إلى نفسي طرفة عين', 1],
  ['حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم', 7],
  ['سبحان الله وبحمده عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته', 3],
  ['لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', 10],
  ['اللهم صل وسلم على نبينا محمد', 10],
  ['سبحان الله وبحمده', 100],
  ['أستغفر الله وأتوب إليه', 100]
];
const ADHKAR_PM = [          // أذكار المساء من «حصن المسلم» (مسودة تحتاج مراجعة المالك): المشتركة مع الصباح تعاد استعمالها حرفياً
  ADHKAR[0], ADHKAR[1], ADHKAR[2], ADHKAR[3],
  ['أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، رب أسألك خير ما في هذه الليلة وخير ما بعدها، وأعوذ بك من شر ما في هذه الليلة وشر ما بعدها، رب أعوذ بك من الكسل وسوء الكبر، رب أعوذ بك من عذاب في النار وعذاب في القبر', 1],
  ADHKAR[5],
  ['اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير', 1],
  ['أمسينا على فطرة الإسلام، وعلى كلمة الإخلاص، وعلى دين نبينا محمد صلى الله عليه وسلم، وعلى ملة أبينا إبراهيم حنيفا مسلما وما كان من المشركين', 1],
  ADHKAR[8], ADHKAR[9], ADHKAR[10],
  ['اللهم إني أمسيت أشهدك، وأشهد حملة عرشك، وملائكتك، وجميع خلقك، أنك أنت الله لا إله إلا أنت وحدك لا شريك لك، وأن محمدا عبدك ورسولك', 4],
  ['اللهم ما أمسى بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر', 1],
  ['أعوذ بكلمات الله التامات من شر ما خلق', 3],
  ADHKAR[11], ADHKAR[12], ADHKAR[14], ADHKAR[15], ADHKAR[16], ADHKAR[17]
];
const ADH_TOTAL = ADHKAR.reduce((a, x) => a + x[1], 0), ADH_PM_TOTAL = ADHKAR_PM.reduce((a, x) => a + x[1], 0);
const adhList = (id) => id === 'adhkarPm' ? ADHKAR_PM : ADHKAR, adhTotal = (id) => id === 'adhkarPm' ? ADH_PM_TOTAL : ADH_TOTAL;
function adhDone(v, id) { const L = adhList(id); return (v && v.c || []).reduce((a, n, i) => a + Math.min(n || 0, L[i] ? L[i][1] : 0), 0); }
function heartSvg(p, big, pm) {
  const id = 'hc' + Math.round(p * 1000) + (big ? 'b' : '') + (pm ? 'p' : ''), y = 6 + 88 * (1 - Math.min(1, p)), d = 'M50 88 C20 66 4 50 4 30 C4 15 16 5 29 5 C39 5 46 11 50 18 C54 11 61 5 71 5 C84 5 96 15 96 30 C96 50 80 66 50 88Z';
  return '<svg viewBox="0 0 100 94" class="heart' + (p >= 1 ? ' full' : '') + '" aria-hidden="true"><defs><clipPath id="' + id + '"><path d="' + d + '"/></clipPath><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (pm ? '#b9b2ff' : '#8ff0b8') + '"/><stop offset="1" stop-color="' + (pm ? '#6a5fd6' : '#1fa463') + '"/></linearGradient></defs>'
    + '<path d="' + d + '" fill="rgba(255,255,255,.07)"/><g clip-path="url(#' + id + ')"><rect class="hf" x="0" y="' + y.toFixed(1) + '" width="100" height="100" fill="url(#' + id + 'g)"/>' + (p > 0 && p < 1 ? '<path class="hwave" d="M-10 ' + y.toFixed(1) + ' q15 -5 30 0 t30 0 t30 0 t30 0 v6 h-120z" fill="' + (pm ? '#b9b2ff' : '#8ff0b8') + '" opacity=".6"/>' : '') + '</g><path d="' + d + '" fill="none" stroke="' + (p >= 1 ? '#6fe3a9' : 'rgba(111,227,169,.6)') + '" stroke-width="3"/></svg>';
}
function adhOpen(hid) {                       // 0.62: شاشة الأذكار على شكل سبحة: ذكر واحد، وحلقة حبات تُضيء بكل لمسة
  hid = hid || 'adhkar'; const LST = adhList(hid), TOT = adhTotal(hid), pm = hid === 'adhkarPm';
  if (document.getElementById('adx')) return; const el = document.createElement('div'); el.id = 'adx'; el.className = 'adx tsb'; document.body.appendChild(el);
  const v0 = hVal(hid) || { c: [] }; let cur = Math.max(0, LST.findIndex((a, i) => (v0.c[i] || 0) < a[1])), flash = '';
  const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const ring = (n, c) => {
    const B = Math.min(n, 33), items = [{ k: 'i' }]; for (let b = 0; b < B; b++) { if (B === 33 && (b === 11 || b === 22)) items.push({ k: 's' }); items.push({ k: 'b', i: b }); }
    const N = items.length, cx = 168, cy = 156, R = 124, lit = c <= 0 ? 0 : c >= n ? B : ((c - 1) % B) + 1, sz = Math.max(5.5, Math.min(9.5, (2 * Math.PI * R / N) * .36)), P = (a, r) => { const t = a * Math.PI / 180; return [cx + r * Math.sin(t), cy - r * Math.cos(t)]; };
    let g = '<defs><radialGradient id="tbl" cx="35%" cy="30%" r="75%"><stop offset="0" style="stop-color:var(--tb1)"/><stop offset=".45" style="stop-color:var(--tb2)"/><stop offset="1" style="stop-color:var(--tb3)"/></radialGradient><radialGradient id="tbd" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="rgba(255,255,255,.22)"/><stop offset=".6" stop-color="rgba(255,255,255,.07)"/><stop offset="1" stop-color="rgba(255,255,255,.02)"/></radialGradient><radialGradient id="tbi" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6d8"/><stop offset=".5" stop-color="#e6b84f"/><stop offset="1" stop-color="#7a5a1c"/></radialGradient></defs><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" style="stroke:var(--tbs)" stroke-width="2"/>';
    items.forEach((it, idx) => { const a = 180 + idx * 360 / N, q = P(a, R);
      if (it.k === 'i') { const ty = cy + R + 14; g += '<ellipse cx="' + cx + '" cy="' + (cy + R) + '" rx="12" ry="15" fill="url(#tbi)"/><ellipse cx="' + (cx - 4) + '" cy="' + (cy + R - 5) + '" rx="3.4" ry="5" fill="#fff" opacity=".45"/><path d="M' + cx + ' ' + ty + 'c-9 0-11 10-8 17h16c3-7 1-17-8-17z" fill="url(#tbi)"/><path d="M' + (cx - 8) + ' ' + (ty + 17) + 'l-3 38M' + (cx - 4) + ' ' + (ty + 17) + 'l-1.5 42M' + cx + ' ' + (ty + 17) + 'v44M' + (cx + 4) + ' ' + (ty + 17) + 'l1.5 42M' + (cx + 8) + ' ' + (ty + 17) + 'l3 38" stroke="#e6b84f" stroke-width="2.2" stroke-linecap="round" fill="none"/>'; }
      else if (it.k === 's') g += '<g transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ') rotate(' + a + ')"><rect x="-3.2" y="-8" width="6.4" height="16" rx="2" fill="url(#tbi)"/></g>';
      else g += '<circle class="bd' + (it.i < lit ? ' lit' : '') + (it.i === lit - 1 && flash === 'pop' ? ' pop' : '') + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + sz.toFixed(1) + '" fill="' + (it.i < lit ? 'url(#tbl)' : 'url(#tbd)') + '" stroke="rgba(255,255,255,.2)" stroke-width=".8"/>'; });
    return '<svg viewBox="0 0 336 384" aria-hidden="true">' + g + '</svg>';
  };
  const draw = () => {
    const v = hVal(hid) || { c: [] }, done = adhDone(v, hid), a = LST[cur], n = a[1], c = Math.min(n, v.c[cur] || 0), B = Math.min(n, 33), rounds = Math.ceil(n / B), rd = c <= 0 ? 1 : Math.min(rounds, Math.floor((c - 1) / B) + 1);
    el.innerHTML = '<div class="adh"><button class="btn sm sec" id="adclose">' + I('x') + ' إغلاق</button><b class="tsb-h">' + (pm ? 'أذكار المساء' : 'أذكار الصباح') + '</b><small>' + done + ' من ' + TOT + '</small></div>'
      + '<div class="tsb-dots" aria-hidden="true">' + LST.map((x, i) => '<i class="' + ((v.c[i] || 0) >= x[1] ? 'd' : i === cur ? 'on' : '') + '"></i>').join('') + '</div>'
      + '<div class="tsb-t" aria-live="polite">' + (a[2] ? '<span class="adt">' + a[2] + '</span>' : '') + '<span class="adtx">' + a[0] + '</span></div>'
      + '<button class="tsb-tap" id="tsbtap" data-c="' + c + '" data-of="' + n + '" aria-label="سبّح: ' + c + ' من ' + n + '">' + ring(n, c) + '<span class="tsb-cnt"><b' + (c ? '' : ' class="z"') + '>' + (c ? ar(c) : 'ابدأ') + '</b><small>من ' + ar(n) + (rounds > 1 ? ' · الدورة ' + ar(rd) + ' من ' + ar(rounds) : '') + '</small></span>' + (flash === 'done' ? '<span class="tsb-ok">✓ تمّ</span>' : '') + '</button>'
      + '<div class="tsb-nav"><button class="btn sm sec" data-ts="next" aria-label="الذكر السابق">' + I('back') + '</button><button class="btn sm sec" data-ts="undo">تراجع</button><button class="btn sm sec" data-ts="prev" aria-label="الذكر التالي">' + I('back') + '</button></div>';
    el.querySelector('#adclose').onclick = () => { el.remove(); render(); };
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('#tsbtap,[data-ts]'); if (!b) return; const v = JSON.parse(JSON.stringify(hVal(hid) || { c: [] })), was = hOkDay(hid), k = b.dataset.ts;
    if (k === 'next') { cur = Math.max(0, cur - 1); flash = ''; draw(); return; } if (k === 'prev') { cur = Math.min(LST.length - 1, cur + 1); flash = ''; draw(); return; }
    if (k === 'undo') { if ((v.c[cur] || 0) > 0) { v.c[cur]--; hSet(hid, v); } flash = ''; draw(); return; }
    if ((v.c[cur] || 0) >= LST[cur][1]) { const nx = LST.findIndex((a, i) => (v.c[i] || 0) < a[1]); if (nx >= 0) { cur = nx; flash = ''; draw(); } return; }
    v.c[cur] = Math.min(LST[cur][1], (v.c[cur] || 0) + 1); hSet(hid, v); if (navigator.vibrate) try { navigator.vibrate(v.c[cur] >= LST[cur][1] ? [20, 40, 30] : 8); } catch (x) { }
    const fin = v.c[cur] >= LST[cur][1]; flash = 'pop';
    if (!was && hOkDay(hid)) { el.remove(); render(); celebrate(hid); return; }
    if (fin) { const nx = LST.findIndex((a, i) => i > cur && (v.c[i] || 0) < a[1]), nx2 = nx >= 0 ? nx : LST.findIndex((a, i) => (v.c[i] || 0) < a[1]); if (nx2 >= 0) { cur = nx2; flash = 'done'; } }
    draw(); if (flash === 'done') setTimeout(() => { flash = ''; const f = el.querySelector('.tsb-ok'); if (f) f.remove(); }, 650);
  });
  draw();
}
// ---------- المنبّه (0.40): التذكير يظهر على الشاشة كمنبّه بتصميم الثيم، لا إشعاراً فقط — رنّة هادئة واهتزاز و«تم» و«غفوة 10 دقائق».
// يظهر: عند حلول الوقت والتطبيق مفتوح، أو عند لمس إشعار التذكير. (التطبيق المغلق والجوال مقفل: إشعار ثابت يهتز فقط — الرنين فوق القفل يحتاج تطبيقاً أصلياً.)
const ALM_T = {
  water: ['drop', 'وقت كوب ماء', 'اشرب كوباً الآن ثم سجّله بلمسة.', 'تم، شربت'], meal: ['utensils', 'حان وقت وجبتك', 'افتح خطتك وعلّم ما تأكله.', 'افتح خطتي'],
  adhAm: ['sun', 'أذكار الصباح', 'ابدأ يومك بذكر الله.', 'ابدأ الأذكار'], adhPm: ['moon', 'أذكار المساء', 'حصّن مساءك بذكر الله.', 'ابدأ الأذكار'], med: ['pill', 'موعد دوائك', 'خذ دواءك أو مكمّلك في موعده.', 'أخذته']
};
const ALM = { fired: {}, snz: 0, snd: 0, ctx: null };
const almIcon = (t) => t === 'pill' ? '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-35 12 12)"><rect x="2" y="7.5" width="20" height="9" rx="4.5"/><path d="M12 7.5v9"/></g></svg>' : I(t);
const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
function almStop() { clearInterval(ALM.snd); ALM.snd = 0; }
function almChime() {                                  // رنّة من ثلاث نغمات هادئة (WebAudio بلا ملفات)، تتكرر كل 6 ثوانٍ حتى 5 مرات
  if (S && S.rem && S.rem.sound === false) return; let n = 0;
  const once = () => { try { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; const c = ALM.ctx || (ALM.ctx = new A()); if (c.state === 'suspended') c.resume(); [659.25, 783.99, 987.77].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.2; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.75); }); } catch (e) { } if (++n >= 5) almStop(); };
  almStop(); once(); ALM.snd = setInterval(once, 6000);
}
function almShow(items) {
  items = (items || []).filter((x) => ALM_T[x.t]); if (!items.length || !S) return; const old = document.getElementById('alm'); if (old) old.remove(); almStop(); clearTimeout(ALM.snz);
  const lead = items[0], T = ALM_T[lead.t], m = lead.m != null ? lead.m : new Date().getHours() * 60 + new Date().getMinutes(), more = items.slice(1).map((x) => ALM_T[x.t][1] + (x.label ? ' — ' + x.label : '')).join(' • ');
  const el = document.createElement('div'); el.id = 'alm'; el.className = 'alm alm-' + lead.t; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', T[1]);
  el._items = items;
  el.innerHTML = '<div class="alm-rings" aria-hidden="true"><i></i><i></i><i></i></div><div class="alm-card"><div class="alm-ic" aria-hidden="true">' + almIcon(T[0]) + '</div><div class="alm-time" aria-hidden="true">' + hhmm(m) + '</div><h1>' + T[1] + (lead.label ? ' — ' + esc(lead.label) : '') + '</h1><p>' + T[2] + '</p>' + (more ? '<p class="alm-more">ومعها: ' + esc(more) + '</p>' : '')
    + '<div class="alm-act"><button class="btn full" data-alm="done">' + T[3] + '</button><div class="alm-two"><button class="btn sec" data-alm="snooze">غفوة 10 دقائق</button><button class="btn sec" data-alm="close">لاحقاً</button></div></div></div>';
  document.body.appendChild(el); if (navigator.vibrate) try { navigator.vibrate([300, 120, 300, 120, 500]); } catch (e) { } almChime();
  const b = el.querySelector('[data-alm="done"]'); if (b && !('ontouchstart' in window)) try { b.focus({ preventScroll: true }); } catch (e) { }
}
function almDone(items) {                              // «تم»: ينفّذ فعل التذكير الأول: ماء ← كوب جديد، دواء ← عادة الدواء، أذكار ← فتحها، وجبة ← الخطة
  const x = items[0]; if (!x || !S) return;
  if (x.t === 'water') { const L = dl(TODAY); L.water = Math.min(24, (L.water || 0) + 1); queueLog(dkey(new Date())); save(); toast('💧 سُجّل كوب ماء'); }
  else if (x.t === 'med') { if (!Array.isArray(S.habits)) S.habits = ['water']; if (S.habits.indexOf('meds') < 0) S.habits.push('meds'); hSet('meds', 1); save(); toast('💊 سُجّل التزامك بالدواء'); }
  else if (x.t === 'meal') { S.tab = 'plan'; S.day = TODAY; }
  render(); if (x.t === 'adhAm') adhOpen('adhkar'); else if (x.t === 'adhPm') adhOpen('adhkarPm');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-alm]'); if (!b) return; const el = document.getElementById('alm'); if (!el) return; const items = el._items || [], k = b.dataset.alm;
  almStop(); el.classList.add('alm-out'); setTimeout(() => el.remove(), 260);
  if (k === 'done') almDone(items); else if (k === 'snooze') { clearTimeout(ALM.snz); ALM.snz = setTimeout(() => almShow(items), 10 * 60000); toast('سنذكّرك بعد 10 دقائق'); }
});
function almFire(items) { const fresh = items.filter((x) => { const k = x.t + '|' + x.m, last = ALM.fired[k]; if (last && now() - last < 20 * 60000) return false; ALM.fired[k] = now(); return true; }); if (fresh.length) almShow(fresh); }
function almTick() {                                   // التطبيق مفتوح: يتحقق كل 20 ثانية من حلول وقت تذكير (لا يعتمد على وصول الإشعار)
  if (!S || !S.cid || V.screen !== '' || document.getElementById('alm')) return; const d = new Date(), m = d.getHours() * 60 + d.getMinutes(); const hit = remItems().filter((x) => x.m === m); if (hit.length) almFire(hit.map((x) => Object.assign({ m: x.m }, x)));
}
async function almCheck() {                            // لُمس إشعار تذكير والتطبيق مغلق: عامل الخدمة حفظ البنود هنا، فتظهر بعد فتح الرمز
  try { if (!('caches' in window)) return; const c = await caches.open('hissati-rem'), r = await c.match('/alarm'); if (!r) return; const j = await r.json(); await c.delete('/alarm'); if (j && j.items && now() - (j.at || 0) < 30 * 60000) almShow(j.items.map((x) => Object.assign({}, x))); } catch (e) { }
}
setInterval(almTick, 20000);
// ---------- احتفال مختلف عند إنجاز كل عادة (طبقة مستقلة تُغلق باللمس أو بعد ثوانٍ)
const CHEER = {
  adhkar: { fx: '🤍', t: 'اكتملت أذكار الصباح', m: 'كل ذكرٍ يجعلك في مقربة من ربك، وخطوةٌ تخطوها نحو الجنة. حفظك الله في يومك.' },
  water: { fx: '💧', t: 'ارتويت اليوم!', m: 'جسمك ممتنّ لك: الماء ينعش خلاياك ويصفّي ذهنك ويُبعد الجوع الكاذب.' },
  steps: { fx: '👣', t: '8 آلاف خطوة!', m: 'كل خطوة تقوّي قلبك. أنت اليوم أنشط من أمس.' },
  sleep: { fx: '✨', t: 'نوم هانئ', m: 'نومك الكافي يوازن هرمونات الجوع ويمنحك طاقة يومك.' },
  veg: { fx: '🍎', t: 'صحنك قوس قزح!', m: 'خمس حصص ملوّنة = ألياف تُشبعك وفيتامينات تحميك.' },
  sugar: { fx: '🔥', t: 'يوم بلا سكر!', m: 'إرادتك أقوى من الرغبة. حافظ على سلسلتك.' },
  move: { fx: '⚡', t: 'بطاريتك مشحونة!', m: '30 دقيقة حركة اليوم — جسمك يحرق أفضل ومزاجك أجمل.' },
  breath: { fx: '🫧', t: 'هدوءك قوّتك', m: 'دقيقتان من الهدوء تخفضان التوتر والأكل العاطفي.' },
  mindful: { fx: '🍽', t: 'أكلت بوعي', m: 'أعطيت الشبع وقته واستمتعت بطعامك — هذا سرّ الأكل الأقل.' },
  kitchen: { fx: '🌙', t: 'المطبخ مغلق', m: 'هضم أريح ونوم أعمق الليلة. أحسنت!' },
  first: { fx: '💧', t: 'بدأت سلسلتك: يوم 1 🔥', m: 'أول كوب… وأول خطوة. كل يوم تكمله يقوّي سلسلتك، وأخصائيك معك.' },
  adhkarPm: { fx: '💜', t: 'اكتملت أذكار المساء', m: 'ختمتَ يومك بذكر الله، فبِتْ مطمئناً. حفظك الله وتولّاك.' },
  social: { fx: '📵', t: 'يوم بلا تشتّت', m: 'استعدتَ وقتك وتركيزك. كل يوم تكسبه يقوّي سلسلتك.' },
  sunset: { fx: '🌙', t: 'مساء هادئ', m: 'أطفأتَ الشاشات فمهّدتَ لنوم أعمق. تصبح على خير.' },
  gratitude: { fx: '🌸', t: 'قلب ممتنّ', m: 'ثلاث نعم تذكّرتها اليوم… ومن شكر زاده الله.' },
  sunlight: { fx: '☀️', t: 'صباح مُشرق', m: 'ضوء الصباح يضبط ساعتك الداخلية — نومك وطاقتك يشكرانك.' },
  breaks: { fx: '⏱', t: 'جسم نشيط', m: 'حرّكتَ جسمك على مدار يومك. الحركة القليلة المتكررة تصنع فرقاً.' },
  reading: { fx: '📖', t: 'ختمتَ يومك بهدوء', m: 'دقائق من القراءة تغذّي عقلك وروحك. استمر.' },
  meds: { fx: '💊', t: 'التزام ممتاز', m: 'دواؤك في موعده هو أساس خطتك. بارك الله في صحتك.' },
  stretch: { fx: '🧘', t: 'جسم مرن', m: 'تمدّدتَ فارتاح ظهرك ورقبتك. استمر على هذه العادة.' },
  postwalk: { fx: '🚶', t: 'خطوات بعد الأكل', m: 'مشيتَ بعد وجبتك فهضمتَ أريح وسكّرك أهدأ. أحسنت!' }
};
function celebrate(id) {
  const c = CHEER[id]; if (!c) return; const old = document.getElementById('cel'); if (old) old.remove();
  const el = document.createElement('div'); el.id = 'cel'; el.className = 'cel cel-' + id; const st = HB(id) ? hStreak(id) : 0;
  el.innerHTML = '<div class="fx">' + Array.from({ length: 18 }, (_, i) => '<i style="--y:' + ((i * 53) % 90) + ';left:' + ((i * 37) % 100) + '%;animation-delay:' + ((i % 6) * 0.18).toFixed(2) + 's;font-size:' + (18 + (i * 7) % 18) + 'px">' + c.fx + '</i>').join('') + '</div>'
    + '<div class="celc">' + (id === 'adhkar' || id === 'adhkarPm' ? '<div class="adheart pulse">' + heartSvg(1, 1, id === 'adhkarPm') + '</div>' : '<div class="celi">' + (HB(id) ? HB(id).ic : c.fx) + '</div>') + '<h2>' + c.t + '</h2><p>' + c.m + '</p>' + (st > 1 ? '<span class="hbs">🔥 ' + st + ' أيام متتالية</span>' : '') + '<small>المس للمتابعة</small></div>';
  el.onclick = () => el.remove(); document.body.appendChild(el); if (navigator.vibrate) try { navigator.vibrate([30, 60, 30]); } catch (x) { } setTimeout(() => el.remove(), 6000);
}
// ---------- التحديات الأسبوعية من أخصائيك وشهادات التقدير («إنجازاتي»)
const CHG = { water: ['💧', 'شرب الماء', 'أكواب'], plan: ['✅', 'الالتزام بالخطة', '%'], steps: ['🚶', 'المشي', 'خطوة'], sleep: ['😴', 'النوم', 'ساعات'], veg: ['🥗', 'خضار وفاكهة', 'حصص'], sugar: ['🍬', 'بلا سكر مضاف', ''], move: ['⚡', 'النشاط البدني', 'دقيقة'], breath: ['🫧', 'التنفّس', 'جلسة'], mindful: ['🍽', 'أكل بوعي', 'وجبة'], kitchen: ['🌙', 'المطبخ مغلق ليلاً', ''], coffee: ['☕', 'الكافيين', 'أكواب كحد أقصى'], adhkar: ['📿', 'أذكار الصباح', ''], adhkarPm: ['🌙', 'أذكار المساء', ''], social: ['📵', 'استراحة من السوشيال ميديا', ''], sunset: ['📴', 'شاشات مطفأة قبل النوم', ''], gratitude: ['🌸', 'امتنان', 'نعم'], sunlight: ['☀️', 'شمس الصباح', 'دقيقة'], breaks: ['⏱', 'حركة كل ساعة', 'مرات'], reading: ['📖', 'قراءة أو وِرد', 'دقيقة'], meds: ['💊', 'الدواء في موعده', ''], stretch: ['🧘', 'تمدّد وإطالة', 'دقيقة'], postwalk: ['🚶‍♀️', 'مشي بعد الوجبة', 'مرة'] };
const PHRASES = ['الإنجاز العظيم يبدأ بخطوة صغيرة، وأنت خطوت خطوات ثابتة.', 'التزامك اليوم هو صحتك غداً — فخورون بك!', 'العادات الصغيرة المتكررة تصنع نتائج كبيرة.', 'أثبتَّ أن الإرادة أقوى من الأعذار.', 'جسمك يشكرك على كل اختيار صحي اتخذته.', 'استمر… فأفضل نسخة منك في الطريق.'];
const nDays = (n) => n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n + (n <= 10 ? ' أيام' : ' يوماً');
const addD = (k, n) => { const d = new Date(k + 'T12:00'); d.setDate(d.getDate() + n); return dkey(d); };
function planPct(k) { const L = S.log[k]; if (!L || !S.plan) return null; const day = S.plan[new Date(k + 'T12:00').getDay() % S.plan.length]; let n = 0, done = 0; day.slots.forEach((s, si) => s.lines.forEach((l, li) => { n++; if (L.ck[si + '_' + li]) done++; })); return n ? done / n * 100 : null; }
function gOk(g, k) {
  const L = S.log[k]; if (!L) return false; const v = g.h === 'water' ? L.water : g.h === 'plan' ? planPct(k) : (L.h || {})[g.h]; if (v == null) return false;
  if (g.h === 'sugar' || g.h === 'kitchen' || g.h === 'social' || g.h === 'sunset' || g.h === 'meds') return v === 1; if (g.h === 'mindful') return (v || []).length >= g.v; if (g.h === 'coffee') return v <= g.v; if (g.h === 'adhkar') return adhDone(v) >= ADH_TOTAL; if (g.h === 'adhkarPm') return adhDone(v, 'adhkarPm') >= ADH_PM_TOTAL; return +v >= +g.v;
}
function gTxt(g) { const m = CHG[g.h] || ['', g.h, '']; return m[0] + ' ' + m[1] + (m[2] ? ' ' + Number(g.v).toLocaleString('en') + ' ' + m[2] : ''); }
function chIdx() { if (!S.chal) return -1; return Math.floor((new Date(dkey(new Date()) + 'T12:00') - new Date(S.chal.start + 'T12:00')) / 864e5 / 7); }
function chProg(wi) { const w = S.chal.weeks[wi], s = addD(S.chal.start, wi * 7), today = dkey(new Date()); return w.goals.map((g) => { let n = 0; for (let i = 0; i < 7; i++) { const k = addD(s, i); if (k <= today && gOk(g, k)) n++; } return n; }); }
function chHas(w) { return (S.ach || []).some((a) => a.pid === S.chal.id && a.w === w); }
function chalCheck() {
  if (!S || !S.chal || !S.plan) return; const ix = Math.min(chIdx(), S.chal.weeks.length - 1); let got = null;
  for (let wi = 0; wi <= ix; wi++) { if (chHas(wi + 1)) continue; const w = S.chal.weeks[wi], p = chProg(wi); if (w.goals.length && w.goals.every((g, gi) => p[gi] >= g.d)) got = achieve(wi + 1, w.title, w.goals.map((g, gi) => gTxt(g) + ' • ' + nDays(p[gi]))); }
  if (S.chal.weeks.length > 1 && !chHas(99) && S.chal.weeks.every((w, i) => chHas(i + 1))) got = achieve(99, 'برنامج التحديات الصحية (' + S.chal.weeks.length + ' أسابيع)', S.chal.weeks.map((w, i) => '🏅 الأسبوع ' + (i + 1) + ': ' + w.title));
  if (got) setTimeout(() => celebrateAch(got), 80);
}
function achieve(w, title, lines) {
  const id = 'a' + now().toString(36) + w, c = { id, pid: S.chal.id, w, title, lines, at: now(), name: String(S.p.name || '').trim(), sex: S.p.sex, dname: S.chal.dname || S.dname, clinic: S.chal.clinic || '', phrase: PHRASES[(now() + w) % PHRASES.length] };
  S.ach = (S.ach || []).concat([c]); send({ t: 'ach', id: S.chal.id, w, title }); save(); return c;
}
function chalCard() {
  if (!S.chal) return ''; const ix = chIdx(), W = S.chal.weeks;
  if (ix < 0) return '<section class="card chal"><div class="chh"><span class="trophy">🏆</span><div><small>تحدٍّ من ' + esc(S.chal.dname || S.dname) + '</small><h3>يبدأ ' + esc(S.chal.start) + '</h3></div></div><p class="dim">' + esc(W[0].title) + ' — استعد!</p></section>';
  if (ix >= W.length) return '<section class="card chal fin"><div class="chh"><span class="trophy">🏆</span><div><small>انتهى البرنامج</small><h3>' + (S.ach || []).filter((a) => a.pid === S.chal.id && a.w < 99).length + ' من ' + W.length + ' أسابيع منجزة</h3></div></div><button class="btn sm" data-act="achs">' + I('sparkle') + ' إنجازاتي وشهاداتي</button></section>';
  const w = W[ix], p = chProg(ix), left = 7 - ((Math.floor((new Date(dkey(new Date()) + 'T12:00') - new Date(S.chal.start + 'T12:00')) / 864e5)) % 7), won = chHas(ix + 1);
  return '<section class="card chal' + (won ? ' won' : '') + '"><div class="chh"><span class="trophy">' + (won ? '🏅' : '🏆') + '</span><div><small>تحدي الأسبوع ' + (ix + 1) + (W.length > 1 ? ' من ' + W.length : '') + '</small><h3>' + esc(w.title) + '</h3></div><span class="dleft">' + (won ? 'أنجزته ✓' : 'باقي ' + left + (left === 1 ? ' يوم' : ' أيام')) + '</span></div>' + (w.msg ? '<p class="dim">' + esc(w.msg) + '</p>' : '')
    + w.goals.map((g, gi) => '<div class="chg' + (p[gi] >= g.d ? ' ok' : '') + '"><span>' + esc(gTxt(g)) + '</span><span class="dots">' + Array.from({ length: g.d }, (_, i) => '<i class="' + (i < p[gi] ? 'on' : '') + '"></i>').join('') + '</span><b>' + Math.min(p[gi], g.d) + '/' + g.d + '</b></div>').join('')
    + (won ? '<button class="btn sm" data-act="cert" data-v="' + esc(((S.ach || []).find((a) => a.pid === S.chal.id && a.w === ix + 1) || {}).id || '') + '">' + I('sparkle') + ' شهادتي</button>' : '') + '</section>';
}
function achStats() {
  let days = 0, water = 0, steps = 0, best = 0; Object.keys(S.log).forEach((k) => { const L = S.log[k]; water += (L.water || 0) * CUP; steps += +((L.h || {}).steps || 0); if (Object.keys(L.h || {}).length || L.water) days++; });
  HABITS.forEach((h) => { if (hList().indexOf(h.id) >= 0) best = Math.max(best, hStreak(h.id)); });
  return [['🏅', (S.ach || []).length, 'شهادة'], ['📅', days, 'يوماً تابعت فيه'], ['💧', Math.round(water), 'لتر ماء'], ['🚶', steps >= 1000 ? Math.round(steps / 1000) + ' ألف' : steps, 'خطوة'], ['🔥', best, 'أطول سلسلة الآن']];
}
function achSheet() {
  const L = (S.ach || []).slice().reverse();
  return '<div class="astats">' + achStats().map((s) => '<div><span>' + s[0] + '</span><b>' + s[1] + '</b><small>' + s[2] + '</small></div>').join('') + '</div>'
    + (L.length ? '<div class="clist">' + L.map((a) => '<button class="cthumb" data-act="cert" data-v="' + a.id + '"><img data-cert="' + a.id + '" alt="شهادة"><span><b>' + (a.w === 99 ? '🏆 البرنامج كاملاً' : 'الأسبوع ' + a.w) + '</b><small>' + esc(a.title) + ' • ' + new Date(a.at).toLocaleDateString('ar') + '</small></span></button>').join('') + '</div>'
      : '<div class="empty">' + emptyArt('ach') + '<p class="dim">' + (S.chal ? 'أتمّ أهداف تحدي هذا الأسبوع لتحصل على أول شهادة تقدير باسمك.' : 'حين يرسل لك أخصائيك تحدياً أسبوعياً، تظهر هنا شهاداتك عند إتمامه.') + '</p></div>');
}
function certSheet() { const a = (S.ach || []).find((x) => x.id === sheet.v); if (!a) return ''; return '<img class="certbig" data-cert="' + a.id + '" alt="شهادة التقدير"><div class="row">' + '<button class="btn sm" data-act="certdl" data-v="png">' + I('share') + ' صورة</button><button class="btn sm sec" data-act="certdl" data-v="pdf">PDF</button>' + (navigator.share ? '<button class="btn sm sec" data-act="certdl" data-v="share">مشاركة</button>' : '') + '</div><p class="dim">' + esc(a.phrase) + '</p>'; }
const CERT = {};
async function certCanvas(a) {
  try { await document.fonts.load('700 40px "Hissa Plex"'); await document.fonts.load('400 30px "Hissa Plex"'); } catch (e) { }
  const W = 1600, H = 1131, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), F = (w, s) => w + ' ' + s + 'px "Hissa Plex", "Segoe UI", Tahoma, sans-serif';
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#1f8a5b'); gr.addColorStop(.5, '#d4a72c'); gr.addColorStop(1, '#1f5fae'); g.strokeStyle = gr; g.lineWidth = 26; g.strokeRect(30, 30, W - 60, H - 60); g.lineWidth = 3; g.strokeStyle = '#d4a72c'; g.strokeRect(62, 62, W - 124, H - 124);
  [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 18, 0, 7); g.fillStyle = '#d4a72c'; g.fill(); g.beginPath(); g.arc(x, y, 8, 0, 7); g.fillStyle = '#fffdf6'; g.fill(); });
  g.globalAlpha = .06; g.font = F(700, 520); g.textAlign = 'center'; g.fillStyle = '#1f8a5b'; g.fillText(a.w === 99 ? '🏆' : '🏅', W / 2, H / 2 + 180); g.globalAlpha = 1;
  const logo = S.chLogo && S.chLogo[a.pid]; let y = 120;
  if (logo) { const im = new Image(); await new Promise((r) => { im.onload = r; im.onerror = r; im.src = logo; }); if (im.naturalWidth) { const k = Math.min(240 / im.naturalWidth, 120 / im.naturalHeight); g.drawImage(im, W / 2 - im.naturalWidth * k / 2, y, im.naturalWidth * k, im.naturalHeight * k); y += im.naturalHeight * k + 20; } }
  g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = '#12305e'; g.font = F(700, 78); g.fillText('شهادة تقدير', W / 2, y + 70); y += 70;
  g.strokeStyle = '#d4a72c'; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2 - 170, y + 24); g.lineTo(W / 2 + 170, y + 24); g.stroke();
  g.fillStyle = '#44506b'; g.font = F(400, 34); g.fillText('تُمنح هذه الشهادة ' + (a.sex === 'أنثى' ? 'للمتميّزة' : 'للمتميّز'), W / 2, y + 90);
  g.fillStyle = '#1f8a5b'; g.font = F(700, 92); g.fillText(a.name || 'بطل حصتي', W / 2, y + 200);
  g.fillStyle = '#12305e'; g.font = F(400, 36); g.fillText((a.sex === 'أنثى' ? 'لإتمامها ' : 'لإتمامه ') + (a.w === 99 ? a.title + ' بنجاح' : a.w === 98 ? a.title : 'تحدي الأسبوع ' + a.w + ': «' + a.title + '»'), W / 2, y + 275);
  g.fillStyle = '#5b6680'; g.font = F(400, 26); const ln = a.lines.slice(0, 6), rows = [ln.slice(0, 3).join('    '), ln.slice(3).join('    ')].filter(Boolean); rows.forEach((r, i) => g.fillText(r, W / 2, y + 335 + i * 42));
  g.fillStyle = '#b8860b'; g.font = F(700, 38); g.fillText('“ ' + a.phrase + ' ”', W / 2, y + 335 + rows.length * 42 + 60);
  const by = H - 150; g.fillStyle = '#12305e'; g.font = F(700, 32); g.fillText(a.dname || 'أخصائي التغذية', W - 360, by); g.strokeStyle = '#9aa6c0'; g.lineWidth = 2; g.beginPath(); g.moveTo(W - 540, by + 22); g.lineTo(W - 180, by + 22); g.stroke();
  g.fillStyle = '#5b6680'; g.font = F(400, 24); g.fillText('أخصائي التغذية' + (a.clinic ? ' — ' + a.clinic : ''), W - 360, by + 60);
  g.fillStyle = '#12305e'; g.font = F(700, 30); g.fillText(new Date(a.at).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }), 360, by); g.beginPath(); g.moveTo(180, by + 22); g.lineTo(540, by + 22); g.stroke(); g.fillStyle = '#5b6680'; g.font = F(400, 24); g.fillText('التاريخ', 360, by + 60);
  g.fillStyle = '#9aa6c0'; g.font = F(400, 20); g.fillText('حصتي • ' + (a.w === 99 ? 'برنامج التحديات الصحية' : 'تحديات العادات الصحية'), W / 2, H - 88);
  return cv;
}
function certUrl(a) { return CERT[a.id] || (CERT[a.id] = certCanvas(a).then((cv) => cv.toDataURL('image/jpeg', 0.9))); }
function fillCerts() { document.querySelectorAll('img[data-cert]').forEach((im) => { const a = (S.ach || []).find((x) => x.id === im.dataset.cert); if (a) certUrl(a).then((u) => { im.src = u; }); }); }
function pdfFromJpeg(bytes, w, h) {                                // PDF بصفحة A4 أفقية فيها صورة الشهادة (بلا مكتبات)
  const te = new TextEncoder(), parts = [], offs = []; let len = 0; const add = (x) => { const b = typeof x === 'string' ? te.encode(x) : x; parts.push(b); len += b.length; }, obj = (n, s) => { offs[n] = len; add(n + ' 0 obj\n' + s + '\nendobj\n'); };
  add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'); obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offs[4] = len; add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bytes.length + ' >>\nstream\n'); add(bytes); add('\nendstream\nendobj\n');
  const cs = 'q 842 0 0 595 0 0 cm /Im0 Do Q'; obj(5, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
  const xo = len; add('xref\n0 6\n0000000000 65535 f \n' + [1, 2, 3, 4, 5].map((n) => String(offs[n]).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xo + '\n%%EOF');
  return new Blob(parts, { type: 'application/pdf' });
}
async function certDownload(kind) {
  const a = (S.ach || []).find((x) => x.id === sheet.v); if (!a) return; const url = await certUrl(a), bin = atob(url.split(',')[1]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const base = 'Hissati-Certificate-' + (a.w === 99 ? 'Program' : 'Week' + a.w) + '-' + dkey(new Date(a.at)),        // اسم لاتيني: بعض المتصفحات تُسقط الأسماء العربية للملفات المنزّلة
    blob = kind === 'pdf' ? pdfFromJpeg(u8, 1600, 1131) : new Blob([u8], { type: 'image/jpeg' }), name = base + (kind === 'pdf' ? '.pdf' : '.jpg');
  if (kind === 'share') { try { await navigator.share({ files: [new File([u8], base + '.jpg', { type: 'image/jpeg' })], title: 'شهادة تقدير' }); } catch (e) { } return; }
  const l = document.createElement('a'), ou = URL.createObjectURL(blob); l.href = ou; l.download = name; l.style.display = 'none'; document.body.appendChild(l); l.click(); setTimeout(() => { l.remove(); URL.revokeObjectURL(ou); }, 4000); toast('نُزّلت الشهادة');
}
function celebrateAch(a) {
  const old = document.getElementById('cel'); if (old) old.remove(); const el = document.createElement('div'); el.id = 'cel'; el.className = 'cel cel-ach';
  el.innerHTML = '<div class="fx">' + Array.from({ length: 22 }, (_, i) => '<i style="left:' + ((i * 37) % 100) + '%;animation-delay:' + ((i % 7) * 0.2).toFixed(2) + 's;font-size:' + (18 + (i * 7) % 20) + 'px">' + ['🎉', '⭐', '🏅', '✨'][i % 4] + '</i>').join('') + '</div><div class="celc"><div class="celi">' + (a.w === 99 ? '🏆' : '🏅') + '</div><h2>' + (a.w === 99 ? 'أتممت البرنامج كاملاً!' : 'أتممت تحدي الأسبوع ' + a.w + '!') + '</h2><p>' + esc(a.phrase) + '</p><button class="btn" id="celcert">' + I('sparkle') + ' استلم شهادتك</button><small>المس خارج الزر للإغلاق</small></div>';
  el.onclick = (e) => { el.remove(); if (e.target.closest('#celcert')) { sheet = { t: 'cert', v: a.id }; render(); } }; document.body.appendChild(el);
}
// ---------- الأوراق السفلية
function sheetHtml() {
  if (!sheet) return '';
  let h = '', b = '';
  if (sheet.t === 'swap') {
    const [si, li] = sheet.k.split('_').map(Number), l = dayPlan(TODAY).slots[si].lines[li], no = foodsOf('no');
    const alts = (l[3] || []).filter((a) => !no.includes(a[0]));
    h = 'بدّل الصنف'; b = '<p class="dim">بدائل من نفس المجموعة ونفس الحصص، فتبقى خطتك متوازنة.</p><div class="opt" style="opacity:.7">' + I('utensils') + '<span>' + esc(lineT(l)) + ' <span class="dim">(الحالي)</span></span></div>'
      + alts.map((a) => '<button class="opt" data-act="doswap" data-v="' + esc(a[1]) + '">' + I('swap') + '<span>' + esc(a[1]) + '</span></button>').join('') + (dl(TODAY).sw[sheet.k] ? '<button class="btn sec" data-act="doswap" data-v="">رجوع إلى الأصلي</button>' : '');
  } else if (sheet.t === 'note') {
    const s = dayPlan(TODAY).slots[sheet.si];
    h = 'ملاحظة على ' + esc(s.name); b = '<div class="chips">' + ['أضفت شيئاً', 'أكلت كمية أقل', 'أكلت كمية أكثر', 'أكلت خارج البيت'].map((x) => '<button class="chip" data-act="qnote" data-v="' + x + '">' + x + '</button>').join('') + '</div>'
      + '<textarea class="inp" id="noteIn" placeholder="مثال: أضفت ملعقة عسل للشوفان">' + esc(dl(TODAY).note[sheet.si] || '') + '</textarea><button class="btn" data-act="savenote">حفظ الملاحظة</button><p class="dim">تصل ملاحظتك لأخصائيك مع متابعة اليوم.</p>';
  } else if (sheet.t === 'shop') {
    const byG = {}; S.plan.forEach((d) => d.slots.forEach((s) => s.lines.forEach((l) => { const g = DATA.groups[l[0]] || 'أخرى'; (byG[g] = byG[g] || {}); byG[g][l[1]] = (byG[g][l[1]] || 0) + 1; })));
    h = 'قائمة تسوّق الأسبوع'; b = Object.keys(byG).map((g) => '<section class="card"><h3 style="margin-bottom:6px">' + esc(g) + '</h3><ul class="plist">' + Object.keys(byG[g]).map((n) => '<li>' + esc(n) + ' <span class="dim">× ' + byG[g][n] + '</span></li>').join('') + '</ul></section>').join('');
  } else if (sheet.t === 'health') {
    h = 'طلب تعديل الحالة الصحية'; b = '<p class="dim">يصل طلبك للأخصائي ليعتمده قبل أن يغيّر خطتك.</p><span class="lbl">الحالات</span>' + toggles('cond', DATA.conditions, sheet.cond).replace(/data-act="tog"/g, 'data-act="htog"') + '<span class="lbl">الحساسية</span>' + toggles('allg', DATA.allergens, sheet.allg).replace(/data-act="tog"/g, 'data-act="htog"') + '<button class="btn" data-act="sendhealth">أرسل للأخصائي</button>';
  } else if (sheet.t === 'xfer') {
    h = 'نقل حسابي'; b = sheet.busy ? '<div class="spin"></div><p class="dim" style="text-align:center">جارٍ تجهيز حسابك مشفّراً…</p>' : sheet.err ? '<p class="err">' + esc(sheet.err) + '</p>'
      : '<p class="mut">لنقل «حصتي» إلى التطبيق المثبّت على الشاشة الرئيسية، أو إلى جوال جديد:</p><ol class="steps"><li>انسخ هذا الرمز</li><li>افتح «حصتي» هناك واختر «لديّ حساب في متصفح أو جوال آخر»</li><li>ألصق الرمز واختر رمز دخول</li></ol>'
      + '<div class="xcode" dir="ltr">' + esc(sheet.code) + '</div><button class="btn" data-act="copyXfer">' + I('copy') + ' نسخ الرمز</button>'
      + '<p class="dim">الرمز صالح 15 دقيقة ولمرة واحدة، ويحمل مفتاح فك التشفير فلا ترسله لأحد. بعد النقل يُمسح الحساب من هنا تلقائياً.</p>';
  } else if (sheet.t === 'rcp') {
    const [d0, s0] = sheet.k.split('_').map(Number); h = esc(dayPlan(d0).slots[s0].meal); b = rcpSheet();
  } else if (sheet.t === 'achs') {
    h = 'إنجازاتي'; b = achSheet();
  } else if (sheet.t === 'cert') {
    h = 'شهادة التقدير'; b = certSheet();
  } else if (sheet.t === 'habits') {
    h = 'العادات'; b = habitsSheet();
  } else if (sheet.t === 'cm') {
    h = 'التعليقات'; b = cmSheet();
  } else if (sheet.t === 'forgot') {
    h = 'نسيت رمز الدخول؟'; b = '<p class="mut">لا يمكن استرجاع الرمز: بياناتك مشفّرة به على هذا الجوال ولا نسخة منها في أي مكان آخر.</p><p class="mut">اطلب من أخصائيك رابط دعوة جديداً، ثم احذف الحساب القديم من هنا وابدأ بالرابط الجديد. خطتك تبقى محفوظة لدى أخصائيك.</p><button class="btn sec" data-act="wipe" style="color:var(--coral)">حذف الحساب من هذا الجوال</button>';
  }
  return '<div class="sheet-bg" data-act="close"></div><div class="sheet" role="dialog" aria-label="' + h.replace(/<[^>]+>/g, '') + '"><div class="grab"></div><div class="sh"><h2>' + h + '</h2><button class="back" data-act="close" aria-label="إغلاق">' + I('x') + '</button></div><div class="sb">' + b + '</div></div>';
}

// ---------- المحادثة مع الأخصائي
const CLIENT_Q = ['عندي سؤال عن خطتي', 'لم أستطع الالتزام اليوم', 'أريد تبديل وجبة', 'أشعر بالجوع بين الوجبات'];
const hm = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function chatBtn() { return '<button class="chatbtn" data-act="chat">' + I('msg') + 'راسل الأخصائي' + (S.unreadC ? '<span class="nb" aria-label="' + S.unreadC + ' رسائل جديدة">' + S.unreadC + '</span>' : '') + '</button>'; }
function bubbles() {
  let last = '';
  return S.msgs.map((m) => {
    const mine = m.from === 'c', d = new Date(m.ts).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'short' }), sep = d !== last ? '<span class="daysep">' + d + '</span>' : ''; last = d;
    return sep + '<div class="bub' + (mine ? ' me' : '') + '">' + (m.ctx ? '<span class="cx">بخصوص: ' + esc(m.ctx) + '</span><br>' : '') + esc(m.t)
      + '<div class="mt"><span>' + hm(m.ts) + '</span>' + (mine ? '<span class="' + (m.read ? 'rd' : '') + '">' + (m.read ? '✓✓ قُرئت' : S.outbox.some((q) => q.t === 'msg' && q.ts === m.ts) ? '◷ بانتظار الإنترنت' : '✓ أُرسلت') + '</span>' : '') + '</div></div>';
  }).join('');
}
function scrChat() {
  const empty = S.msgs.length ? '' : '<div class="empty" style="padding:20px 6px">' + emptyArt('chat') + '<h3>ابدأ الحديث</h3><p class="mut">اكتب لأخصائيك أي سؤال عن خطتك أو يومك. يصله إشعار.</p></div>';
  return '<div class="scr"><div class="chat"><div class="who"><button class="back" data-act="chatClose" aria-label="رجوع" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--glass);border:1px solid var(--line)">' + I('back') + '</button><div class="av sm">' + esc(drInit()) + '</div><div style="flex:1;min-width:0"><b>' + esc(S.dname) + '</b><div class="dim">يرد عادة خلال ساعات العمل</div></div></div>'
    + (S.replyAt ? '<div class="replyb">' + I('clock') + ' يرد أخصائيك على الرسائل يومياً الساعة ' + esc(hm12(S.replyAt)) + ' — اكتب متى شئت.</div>' : '') + '<div class="thread" id="thread">' + empty + bubbles() + '</div>'
    + (S.msgs.length ? '' : '<div class="qr">' + CLIENT_Q.map((q) => '<button data-act="qmsg" data-v="' + esc(q) + '">' + esc(q) + '</button>').join('') + '</div>')
    + (S.ctx ? '<div class="ctxbar">' + I('utensils') + '<span>بخصوص: ' + esc(S.ctx) + '</span><button class="link" data-act="ctxClear" aria-label="إزالة">' + I('x') + '</button></div>' : '')
    + '<div class="composer"><textarea id="chatIn" rows="1" maxlength="2000" placeholder="اكتب رسالتك…" aria-label="رسالتك"></textarea><button class="snd" data-act="sendc" aria-label="إرسال">' + I('send') + '</button></div></div></div>';
}
function sendMsg(text) {
  text = String(text || '').trim().slice(0, 2000); if (!text || S.removed) return false;
  const m = { from: 'c', t: text, ts: now(), ctx: S.ctx }; S.msgs.push(m); S.ctx = ''; send({ t: 'msg', text: m.t, ctx: m.ctx, ts: m.ts }).then(render); return true;
}
document.addEventListener('keydown', (e) => {     // Enter يرسل، وShift+Enter سطر جديد
  const t = e.target; if (e.key !== 'Enter' || e.shiftKey || e.isComposing || !t || t.id !== 'chatIn') return;
  e.preventDefault(); const b = t.parentNode.querySelector('.snd'); if (b) b.click();
});
function applyDislike(f) {
  if (!S.plan) return 0; let c = 0; const no = foodsOf('no');
  S.plan.forEach((d) => d.slots.forEach((s) => s.lines.forEach((l) => {
    if (l[1] !== f) return; const alt = (l[3] || []).find((a) => !no.includes(a[0])); if (!alt) return;
    l[3] = l[3].filter((a) => a !== alt).concat([[l[1], l[2]]]); l[1] = alt[0]; l[2] = alt[1]; l[4] = 'لأنك لا تحب «' + f + '»'; c++;
  })));
  return c;
}
function foodInPlan(f) { return S.plan && S.plan.some((d) => d.slots.some((s) => s.lines.some((l) => l[1] === f))); }

// ---------- العرض
let lastKey = '';
function render() {
  if (S && S.chat && (S.unreadC || S.msgs.some((m) => m.from === 'd' && !m.rr))) readReceipt();
  const sc = $('.scroll'), key = (S ? S.screen + S.step + S.tab + (S.chat ? 'c' : '') : '') + V.screen, top = sc ? sc.scrollTop : 0;
  let scr;
  if (V.screen === 'boot') scr = scrBoot(); else if (V.screen === 'bad') scr = scrBad(); else if (V.screen === 'start') scr = scrStart(); else if (V.screen === 'moved') scr = scrMoved(); else if (V.screen === 'lock') scr = scrLock(); else if (V.screen === 'pin') scr = scrPin(); else if (V.screen === 'onb') scr = scrOnb();
  else scr = V.wk ? scrWk() : V.bd ? scrBody() : V.pan != null ? scrPantry() : V.pf != null ? scrProf() : S.rqOpen && window.RL && RL.idx ? scrQuiz() : S.chat ? scrChat() : S.plan && S.screen === 'app' ? scrApp() : { invite: scrInvite, setup: scrSetup, wizard: scrWizard, review: scrReview, sent: scrSent, app: scrSent }[S.screen]();
  const keep = {}; document.querySelectorAll('video[data-keep]').forEach((n) => { keep[n.dataset.keep] = n; });
  const cmI = $('#cmIn'), cmV = cmI ? [cmI.value, document.activeElement === cmI] : null;          // مسودة التعليق تبقى عند إعادة الرسم (وصول التعليقات مثلاً)
  $('#root').innerHTML = '<div class="stage"><div class="device">' + (V.online ? '' : '<div class="offline">بلا اتصال — تُرسل بياناتك عند عودة الإنترنت</div>') + scr + (S ? sheetHtml() : '') + (toastMsg ? '<div class="toast" role="status">' + I('check') + '<span>' + esc(toastMsg) + '</span></div>' : '') + '</div></div>';
  document.querySelectorAll('video[data-keep]').forEach((n) => { const o = keep[n.dataset.keep]; if (o && o !== n) n.replaceWith(o); });   // فيديو يعمل لا يتوقف عند إعادة الرسم
  if (cmV) { const n = $('#cmIn'); if (n) { n.value = cmV[0]; if (cmV[1]) n.focus(); } }
  const s2 = $('.scroll'); if (s2 && key === lastKey) s2.scrollTop = top; lastKey = key;
  const th = $('#thread'); if (th) th.scrollTop = th.scrollHeight;
  onbSplashTimer(); fillCerts(); if (window.HxMotion) HxMotion.after(); if (S && S.chal && S.screen === 'app' && V.screen === '') chalCheck(); whMaybe();
  if (focusChat) { const c = $('#chatIn'); if (c) c.focus(); focusChat = false; }
  if (S && K) save();
}
let focusChat = false;
function startLoop() { clearInterval(V.timer); V.timer = setInterval(() => { if (!document.hidden) { poll(); if (now() - FD.at > 5 * 60000) fdLoad().then(render); } }, POLL); poll(); fdLoad().then(render); pushSetup(false).then((st) => { if (st === 'on') render(); remSync(); }); almCheck(); }

// ---------- رمز الدخول: الإنشاء والفتح
async function onPin() {
  if (V.screen === 'pin') {
    if (!V.pin1) { V.pin1 = V.pin; V.pin = ''; V.err = ''; return render(); }
    if (V.pin !== V.pin1) { V.pin = ''; V.pin1 = ''; V.err = 'الرمزان غير متطابقين، ابدأ من جديد.'; return render(); }
    if (V.xfer) {                                    // حساب منقول: لا انضمام جديد، فقط قفل نسخة هذا الجهاز برمزه
      SALT = crypto.getRandomValues(new Uint8Array(16)); K = await pinKey(V.pin, SALT); await persist();
      V.xfer = false; V.screen = ''; V.pin = V.pin1 = ''; startLoop(); toast('وصل حسابك ✓ وخطتك كما هي'); return render();
    }
    V.busy = true; V.err = ''; render();
    try {
      S.ident = await HXC.genIdentity();
      const j = await api('POST', '/v1/join', { token: S.tok, sigPub: S.ident.sigPub, encPub: S.ident.encPub });
      if (j.did !== S.did || await HXC.fpOf(j.dEncPub) !== S.fp) throw new Error('تعذّر التحقق من هوية الأخصائي. لا تكمل، واطلب رابطاً جديداً.');
      S.cid = j.cid; SALT = crypto.getRandomValues(new Uint8Array(16)); K = await pinKey(V.pin, SALT);
      S.screen = (navigator.webdriver && !localStorage.getItem('hx_setup_e2e')) ? 'wizard' : 'setup'; S.step = 1; await persist(); try { sessionStorage.removeItem(TKEY); } catch (e) { }
      V.screen = ''; V.pin = V.pin1 = ''; V.busy = false; startLoop(); render();
    } catch (e) {
      V.busy = false; V.pin = V.pin1 = ''; S.ident = null;
      if (e.code === 'used' || e.code === 'expired' || e.code === 'invite') { V.err = e.message + ' — اطلب رابطاً جديداً من أخصائيك.'; V.screen = 'bad'; } else V.err = e.net ? 'لا اتصال بالإنترنت. تأكد من الاتصال ثم أعد المحاولة.' : e.message;
      render();
    }
    return;
  }
  if (V.screen === 'lock') {
    if (V.until > now()) { V.pin = ''; return render(); }
    V.busy = true; render();
    try {
      await unlock(V.pin); V.screen = ''; V.pin = ''; V.err = ''; V.tries = 0; V.busy = false;
      if (S.xferId) { const x = await api('GET', '/v1/xfer/' + S.xferId + '/status').catch(() => null); if (x && x.claimed) return xferDone(); if (x && x.expired) { delete S.xferId; save(); } }
      startLoop(); render();
    }
    catch (e) { V.busy = false; V.pin = ''; V.tries++; V.err = 'الرمز غير صحيح'; if (V.tries >= 5) { V.until = now() + 30000 * Math.pow(2, V.tries - 5); setTimeout(render, V.until - now() + 50); } render(); }
  }
}
// ---------- البداية
async function boot() {
  if (DEMO) { S = Object.assign(fresh(), JSON.parse(JSON.stringify(DEMO.state))); S.chat = false; S.day = TODAY; S.screen = 'app'; S.cid = 'demo'; mkData(); V.screen = onbSeen() ? '' : 'onb'; V.onb = { i: 0 }; return render(); }
  const m = /#t=([A-Za-z0-9_-]{16,40})\.([A-Za-z0-9_-]{11})\b/.exec(location.hash);
  if (m) { try { sessionStorage.setItem(TKEY, m[1] + '.' + m[2]); } catch (e) { } history.replaceState(null, '', location.pathname); }
  if (localStorage.getItem(KEY)) { V.screen = 'lock'; return render(); }
  let t = m ? m[1] + '.' + m[2] : null; try { t = t || sessionStorage.getItem(TKEY); } catch (e) { }
  if (!t) { V.err = ''; V.screen = 'start'; return render(); }
  const [tok, fp] = t.split('.'); V.screen = 'boot'; V.retry = false; render();
  try {
    const h = await HXC.tokenHash(tok); let r;
    try { r = await fetch(API + '/v1/invites/' + h, { cache: 'no-store' }); } catch (e) { const x = new Error('لا اتصال بالإنترنت. تأكد من الاتصال ثم أعد المحاولة.'); x.retry = 1; throw x; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.code === 'used' ? 'استُعمل هذا الرابط من قبل. إن كنت أنت من سجّل فافتح «حصتي» من نفس الجوال والمتصفح، وإلا فاطلب رابطاً جديداً من أخصائيك.' : j.code === 'expired' ? 'انتهت صلاحية هذا الرابط. اطلب رابطاً جديداً من أخصائيك.' : r.status >= 500 ? 'المحطة غير متاحة الآن. حاول بعد قليل.' : 'الرابط غير صحيح. افتحه كاملاً من رسالة أخصائيك.');
    if (await HXC.fpOf(j.encPub) !== fp) throw new Error('تعذّر التحقق من هوية الأخصائي في هذا الرابط. لا تكمل، واطلب رابطاً جديداً.');
    S = fresh(); Object.assign(S, { tok, fp, did: j.did, dEnc: j.encPub, dname: j.dname || 'أخصائي التغذية', cat: j.cat || {} }); S.p.name = j.label || ''; mkData();
    V.screen = onbSeen() ? '' : 'onb'; V.onb = { i: 0 }; render();
  } catch (e) { V.err = e.message; V.retry = !!e.retry; V.screen = 'bad'; render(); }
}

// ---------- الأحداث
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el || el.tagName === 'SELECT' || el.dataset.act === 'consent' || el.disabled) return;
  const a = el.dataset.act, v = el.dataset.v, k = el.dataset.k;
  switch (a) {
    case 'onbNext': onbNextStage(1); return;
    case 'onbPrev': onbNextStage(-1); return;
    case 'onbSkip': case 'onbFinish': onbDone(); return;
    case 'firstWin': { const L = dl(TODAY); L.water = Math.max(1, L.water || 0); queueLog(dkey(new Date())); S.fw = 'done'; save(); celebrate('first'); break; }
    case 'retry': boot(); return;
    case 'toLock': V.screen = 'lock'; V.err = ''; break;
    case 'install': if (bip) { bip.prompt(); bip.userChoice.then((c) => { if (c && c.outcome === 'accepted') toast('جارٍ التثبيت…'); bip = null; render(); }).catch(() => { }); } return;
    case 'instLater': S.instLater = now(); break;
    case 'copyInv': copyText(S.tok + '.' + S.fp, 'نُسخ رمز الدعوة — ألصقه في «حصتي» بعد فتحه من الشاشة الرئيسية'); return;
    case 'copyLink': copyText(API + '/#t=' + S.tok + '.' + S.fp, 'نُسخ الرابط — افتحه في Chrome أو Safari'); return;
    case 'useInv': {
      const v = ($('#invIn') || {}).value || '', m = /(?:#t=)?([A-Za-z0-9_-]{16,40})\.([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/.exec(v.trim());
      if (!m) { V.err = 'الرابط أو الرمز غير صحيح. انسخه كاملاً من رسالة أخصائيك.'; break; }
      try { sessionStorage.setItem(TKEY, m[1] + '.' + m[2]); } catch (x) { } V.err = ''; boot(); return;
    }
    case 'useXfer': {
      const v = ($('#xferIn') || {}).value || ''; V.busy = true; V.err = ''; render();
      xferImport(v).then(() => { V.busy = false; V.xfer = true; V.screen = 'pin'; V.pin = V.pin1 = ''; render(); }).catch((x) => { V.busy = false; V.err = x.message; render(); }); return;
    }
    case 'xferNew': {
      sheet = { t: 'xfer', busy: 1 }; render();
      xferNew().then((x) => {
        sheet = { t: 'xfer', code: x.code, exp: x.exp }; render(); clearInterval(V.xt);
        V.xt = setInterval(() => { if (!sheet || sheet.t !== 'xfer' || now() > x.exp) { clearInterval(V.xt); return; } api('GET', '/v1/xfer/' + S.xferId + '/status').then((r) => { if (r.claimed) xferDone(); }).catch(() => { }); }, 3000);
      }).catch((x) => { sheet = { t: 'xfer', err: x.net ? 'لا اتصال بالإنترنت.' : x.message }; render(); }); return;
    }
    case 'copyXfer': copyText(sheet.code, 'نُسخ رمز النقل'); return;
    case 'pin': if (V.busy) return; if (v === '⌫') V.pin = V.pin.slice(0, -1); else if (V.pin.length < 4) { V.pin += v; if (V.pin.length === 4) { render(); onPin(); return; } } break;
    case 'pinBack': if (V.pin1) { V.pin1 = ''; V.pin = ''; } else if (V.xfer) { V.xfer = false; S = null; V.screen = 'start'; V.pin = ''; } else { V.screen = ''; V.pin = ''; } V.err = ''; break;
    case 'forgot': sheet = { t: 'forgot' }; if (!S) { S = fresh(); S.__tmp = 1; } break;
    case 'lock': clearInterval(V.timer); persist(); S = null; K = null; sheet = null; V.screen = 'lock'; V.pin = ''; V.err = ''; break;
    case 'notif': V.pushErr = 0; pushSetup(true).then((st) => { toast(st === 'on' ? 'فُعّلت الإشعارات ✓' : st === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : 'تعذّر تفعيل الإشعارات الآن'); render(); }); return;
    case 'notifLater': S.notifLater = now(); break;
    case 'wipe': {
      if (!confirm('حذف كل بيانات «حصتي» من هذا الجوال؟ لا يمكن التراجع، وستحتاج رابطاً جديداً من أخصائيك.')) return;
      const done = () => { try { localStorage.removeItem(KEY); sessionStorage.removeItem(TKEY); } catch (x) { } location.replace(location.pathname); };
      const unsub = swReg ? swReg.then((r) => r && r.pushManager.getSubscription()).then((x) => x && x.unsubscribe()).catch(() => { }) : Promise.resolve();
      if (S && S.ident && S.cid && !S.__tmp) unsub.then(() => api('POST', '/v1/clients/remove', {})).catch(() => { }).then(done); else unsub.then(done); return;
    }
    case 'chat': S.chat = true; sheet = null; focusChat = true; break;
    case 'rqStart': S.rq = S.rq && !S.rq.sentAt ? S.rq : { a: S.rq ? S.rq.a : {}, i: 0 }; S.rq.i = 0; delete S.rq.sentAt; S.rqOpen = true; sheet = null; break;
    case 'rqOpt': rqOpt(v); return;
    case 'rqNext': { const q = rqQs()[S.rq.i]; if (q && q.type === 'num') { const n = +numOnly(($('#rqIn') || {}).value || ''); if (!(n >= q.min && n <= q.max)) { toast('اكتب رقماً بين ' + q.min + ' و' + q.max); return; } S.rq.a[q.id] = n; } S.rq.i++; break; }
    case 'rqBack': if (S.rq.i > 0) S.rq.i--; else S.rqOpen = false; break;
    case 'rqRestart': S.rq = { a: {}, i: 0 }; break;
    case 'rqPick': rqSend(v); break;
    case 'chatClose': S.chat = false; break;
    case 'ask': { const sl = dayPlan(TODAY).slots[+v]; S.ctx = sl.name + (sl.meal ? ' (' + sl.meal + ')' : ''); S.chat = true; focusChat = true; break; }
    case 'ctxClear': S.ctx = ''; break;
    case 'qmsg': sendMsg(v); break;
    case 'sendc': { const t = $('#chatIn'); if (!sendMsg(t && t.value)) return; focusChat = true; break; }
    case 'refresh': toast('جارٍ التحقق…'); poll().then(() => toast(S.req === 'approved' ? 'اعتمدك أخصائيك — خطتك قيد الإعداد' : 'لا جديد بعد')); return;
    case 'go': if (v === 'pin') { V.screen = 'pin'; V.pin = V.pin1 = ''; V.err = ''; } break;
    case 'step': { mkForm(); const n = +v; if (n < 1) return; if (n > FS.length) S.screen = 'review'; else { S.screen = 'wizard'; S.step = n; } break; }
    case 'cq1': { S.p.cq = S.p.cq || {}; S.p.cq[k] = S.p.cq[k] === v ? '' : v; break; }
    case 'cqm': { S.p.cq = S.p.cq || {}; const a = S.p.cq[k] = Array.isArray(S.p.cq[k]) ? S.p.cq[k] : [], i = a.indexOf(v); i < 0 ? a.push(v) : a.splice(i, 1); break; }
    case 'set': S.p[k] = isNaN(+v) || k === 'sex' || k === 'gphase' ? v : +v; break;
    case 'tog': { const arr = S.p[k], i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); break; }
    case 'wday': { const i = S.p.wdays.indexOf(+v); i < 0 ? S.p.wdays.push(+v) : S.p.wdays.splice(i, 1); break; }
    case 'unmeal': { const arr = S.p[k][el.dataset.m]; arr.splice(arr.indexOf(v), 1); break; }
    case 'cat': S[k] = +v; S[k === 'foodCat' ? 'foodQ' : 'prefQ'] = ''; break;
    case 'food': {
      const cur = S.p.food[v], nx = cur === 'love' ? 'no' : cur === 'no' ? undefined : 'love';
      if (nx) S.p.food[v] = nx; else delete S.p.food[v];
      if (S.req !== 'none' && S.screen !== 'wizard') {               // بعد التسجيل: التفضيل يطبَّق على الخطة فوراً ويصل للأخصائي
        let ch = { t: nx || 'clear', f: v, n: 0 };
        if (nx === 'no') { const c = S.plan ? applyDislike(v) : 0; ch.n = c; toast(c ? 'حُذف «' + v + '» من ' + c + ' موضعاً في خطتك، وحلّ محله بديل من نفس المجموعة.' : 'سُجّل أنك لا تحب «' + v + '»، ولن يظهر في خطتك.'); }
        else if (nx === 'love') toast('سيُفضَّل «' + v + '» في خطتك القادمة.');
        if (nx) S.prefLog.push({ t: nx, f: v, n: ch.n, ts: now() });
        send({ t: 'prefs', food: S.p.food, like: S.p.like, nope: S.p.nope, changes: [ch] });
      }
      break;
    }
    case 'submit': {
      if (V.busy) return; V.busy = true; render();
      HXC.fpOf(S.ident.encPub).then((fp) => {
        const p = JSON.parse(JSON.stringify(S.p)); ['age', 'weight', 'height', 'bf'].forEach((x) => { p[x] = +numOnly(p[x]) || 0; }); p.phone = latin(p.phone); mkForm(); p.sys = SYS; p.qa = intakeQA(); if (SYS === 'g') p.sched = sched();
        if (!S.weights.length && p.weight) S.weights.push([now(), p.weight]);
        S.req = 'sent'; S.reqMsg = ''; S.screen = 'sent';
        return send({ t: 'intake', p, fp });
      }).then(() => { V.busy = false; render(); return pushSetup(true); }).then(render).catch(() => { });
      return;
    }
    case 'photo': { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('capture', 'environment'); inp.style.display = 'none'; document.body.appendChild(inp); inp.onchange = () => { phTake(inp.files && inp.files[0], +v); inp.remove(); }; inp.click(); return; }
    case 'rcp': sheet = { t: 'rcp', k: v }; break;
    case 'fdRefresh': FD.at = 0; render(); fdLoad().then(render); return;
    case 'fdMore': fdLoad(true).then(render); render(); return;
    case 'fdPlay': FD.play[+v] = 1; break;
    case 'fdLike': {
      const x = FD.posts.find((p) => p.id === +v); if (!x) return; x.liked = !x.liked; x.likes = Math.max(0, (x.likes || 0) + (x.liked ? 1 : -1));
      el.classList.toggle('on', x.liked); el.setAttribute('aria-pressed', x.liked); el.querySelector('span').textContent = x.likes || '';         // بلا إعادة رسم: لا يتوقف فيديو يعمل
      api('POST', '/v1/posts/' + x.id + '/like', { on: x.liked ? 1 : 0 }).then((j) => { x.likes = j.likes; el.querySelector('span').textContent = j.likes || ''; }).catch((er) => { x.liked = !x.liked; x.likes = Math.max(0, x.likes + (x.liked ? 1 : -1)); toast(er.net ? 'لا اتصال بالإنترنت' : er.message); });
      return;
    }
    case 'fdCm': sheet = { t: 'cm', pid: +v }; delete FD.cm[+v]; fdComments(+v); break;
    case 'fdCmSend': {
      const t = $('#cmIn'), txt = (t && t.value || '').trim(), pid = sheet.pid; if (!txt) { toast('اكتب تعليقاً أولاً'); return; } if (V.busy) return;
      S.fdAnon = !!($('#cmAnon') || {}).checked; const name = S.fdAnon ? 'مراجع' : String(S.p.name || '').trim().split(/\s+/)[0] || 'مراجع';
      V.busy = true; el.disabled = true;
      api('POST', '/v1/posts/' + pid + '/comments', { body: txt, name }).then(() => { if ($('#cmIn')) $('#cmIn').value = ''; const x = FD.posts.find((p) => p.id === pid); if (x) x.comments = (x.comments || 0) + 1; return fdComments(pid); }).then(() => { V.busy = false; toast('نُشر تعليقك'); })
        .catch((er) => { V.busy = false; el.disabled = false; toast(er.net ? 'لا اتصال بالإنترنت' : er.message); });
      return;
    }
    case 'fdCmDel': { if (!confirm('حذف تعليقك؟')) return; const pid = sheet.pid; api('POST', '/v1/comments/' + v + '/delete', {}).then(() => { const x = FD.posts.find((p) => p.id === pid); if (x) x.comments = Math.max(0, (x.comments || 0) - 1); return fdComments(pid); }).catch((er) => toast(er.message)); return; }
    case 'habits': sheet = { t: 'habits' }; break;
    case 'achs': sheet = { t: 'achs' }; break;
    case 'cert': if (!v) return; sheet = { t: 'cert', v }; break;
    case 'certdl': certDownload(v); return;
    case 'htoggle': { const ls = hList(), i = ls.indexOf(v); if (i >= 0) ls.splice(i, 1); else { ls.push(v); toast('أُضيفت «' + HB(v).n + '» إلى صفحتك'); } S.habits = ls; queueLog(dkey(new Date())); break; }
    case 'breathe': breathe(); return;
    case 'adhkar': adhOpen(v === 'adhkarPm' ? 'adhkarPm' : 'adhkar'); return;
    case 'hb': {
      const cv = hVal(v), x = k;
      if (v === 'steps') { if (x === 'set') { const r = prompt('عدد خطواتك اليوم:', cv || ''); if (r == null) return; const n = parseInt(numOnly(r), 10); if (!(n >= 0 && n < 100000)) { toast('اكتب رقماً صحيحاً'); return; } hSet(v, n); } else hSet(v, Math.max(0, (cv || 0) + (+x))); }
      else if (v === 'sleep') hSet(v, cv === +x ? null : +x);
      else if (v === 'veg') hSet(v, cv === +x + 1 ? +x : +x + 1);
      else if (v === 'sugar' || v === 'kitchen') hSet(v, cv === +x ? null : +x);
      else if (v === 'move') hSet(v, (cv || 0) === (+x + 1) * 10 ? +x * 10 : (+x + 1) * 10);
      else if (v === 'mindful') { const a = (cv || []).slice(), i = a.indexOf(+x); i < 0 ? a.push(+x) : a.splice(i, 1); hSet(v, a); }
      else if (v === 'coffee') hSet(v, x === 'z' ? (cv === 0 ? null : 0) : cv === +x + 1 ? +x : +x + 1);
      else if (v === 'social' || v === 'sunset' || v === 'meds' || v === 'sunlight' || v === 'reading' || v === 'stretch') hSet(v, cv === +x ? null : +x);
      else if (v === 'gratitude' || v === 'breaks' || v === 'postwalk') hSet(v, cv === +x + 1 ? +x : +x + 1);
      const hh = HB(v); if (hh && !(cv != null && hh.ok(cv)) && hOkDay(v)) { if (CHEER[v]) setTimeout(() => celebrate(v), 50); else toast(hh.ic + ' أحسنت! أنجزت «' + hh.n + '» اليوم'); }
      break;
    }
    case 'medAdd': S.rem = Object.assign({ water: false, meals: false }, S.rem); S.rem.meds = (S.rem.meds || []).concat([{ n: '', t: '20:00' }]).slice(0, MEDMAX); save(); remSync(true); break;
    case 'medDel': if (S.rem && S.rem.meds) { S.rem.meds.splice(+v, 1); if (!S.rem.meds.length) S.rem.med = false; save(); remSync(true); } break;
    case 'setupRel': { const U = V.setup; U.rel = v; break; }
    case 'setupTog': { V.setup.on[v] = el.checked ? 1 : 0; break; }
    case 'setupGo': setupApply(false); break;
    case 'setupSkip': setupApply(true); break;
    case 'relSet': { S.p.rel = v; if (v !== 'م') { S.rem = Object.assign({ water: false, meals: false }, S.rem, { pray: false, adhAm: false, adhPm: false, sal: false }); } remSync(true); toast(v === 'م' ? 'فعّل مواقيت الصلاة والأذكار من «التذكيرات»' : 'أُخفيت المحتويات الدينية'); break; }
    case 'whOpen': whOpen('card'); break;
    case 'whFavOpen': { const [c, m] = v.split('_').map(Number), w = whs(); w.cat = c; w.idx = m; whOpen('card'); break; }
    case 'whTog': whs().on = el.checked; break;
    case 'whQ': whs().noQ = el.checked; break;
    case 'whNat': { const w = whs(); w.nat = v; S.p.nat = v; break; }
    case 'theme': if (window.HxTheme) { HxTheme.set(v, el.querySelector('.hx-pv')); document.querySelectorAll('.hx-th').forEach((b) => { const on = b.dataset.v === v; b.setAttribute('aria-checked', String(on)); const l = b.querySelector('.hx-tl'); if (l) l.textContent = l.textContent.replace(' ✓', '') + (on ? ' ✓' : ''); }); applyThemeIcons(v); } return;
    case 'tab': S.tab = v; if (v === 'feed' && now() - FD.at > 60000) fdLoad().then(render); break;
    case 'day': S.day = +v; break;
    case 'ck': { const L = dl(TODAY); L.ck[v] = !L.ck[v]; if (!L.ck[v]) delete L.ck[v]; queueLog(dkey(new Date())); break; }
    case 'whole': { const L = dl(TODAY), s = dayPlan(TODAY).slots[+v], all = s.lines.every((l, li) => L.ck[v + '_' + li]); s.lines.forEach((l, li) => { if (all) delete L.ck[v + '_' + li]; else L.ck[v + '_' + li] = 1; }); delete L.skip[v]; queueLog(dkey(new Date())); break; }
    case 'skip': { const L = dl(TODAY); L.skip[v] = !L.skip[v]; if (L.skip[v]) dayPlan(TODAY).slots[+v].lines.forEach((l, li) => delete L.ck[v + '_' + li]); else delete L.skip[v]; queueLog(dkey(new Date())); break; }
    case 'water': { const was = hOkDay('water'), L = dl(TODAY); L.water = L.water === +v ? +v - 1 : +v; queueLog(dkey(new Date())); if (!was && hOkDay('water') && hList().indexOf('water') >= 0) setTimeout(() => celebrate('water'), 50); break; }
    case 'swap': sheet = { t: 'swap', k: v }; break;
    case 'doswap': { const L = dl(TODAY); if (v) { L.sw[sheet.k] = v; L.ck[sheet.k] = 1; toast('تم التبديل، وسيعرف أخصائيك.'); } else delete L.sw[sheet.k]; sheet = null; queueLog(dkey(new Date())); break; }
    case 'note': sheet = { t: 'note', si: +v }; break;
    case 'allDay': { const L = dl(TODAY), dp = dayPlan(TODAY); dp.slots.forEach((sl, si) => { if (L.skip[si]) return; sl.lines.forEach((l, li) => { L.ck[si + '_' + li] = 1; }); }); queueLog(dkey(new Date())); toast('أحسنت! سُجّل التزامك باليوم كله'); break; }
    case 'wAdd': { const L = dl(TODAY); L.water = Math.max(0, Math.min(24, (L.water || 0) + (+v))); queueLog(dkey(new Date())); break; }
    case 'walkMin': case 'walkSteps': { const L = dl(TODAY), f = a === 'walkMin' ? 'walkMin' : 'steps'; L.h = L.h || {}; if (+L.h[f] === +v) delete L.h[f]; else L.h[f] = +v; queueLog(dkey(new Date())); break; }
    case 'off': { const L = dl(TODAY); L.off = L.off || {}; if (L.off[v]) delete L.off[v]; else L.off[v] = 1; queueLog(dkey(new Date())); break; }
    case 'yAll': case 'ySub': { const y = yKey(), yd = new Date(now() - 864e5).getDay(), L = (S.log[y] = S.log[y] || { ck: {}, sw: {}, note: {}, skip: {}, water: 0 }); if (a === 'yAll') dayPlan(yd).slots.forEach((sl, si) => { if (!L.skip[si]) sl.lines.forEach((l, li) => { L.ck[si + '_' + li] = 1; }); }); L.sub = now(); clearTimeout(logT[y]); sendLog(y); save(); toast('وصل تسجيل أمس ✓ — هذا جدول اليوم'); break; }
    case 'panGo': V.panD = JSON.parse(JSON.stringify(S.pantry || {})); delete V.panD.at; V.pan = 0; V.panC = 0; V.panQ = ''; break;
    case 'panX': V.pan = null; break;
    case 'panC': V.panC = +v; V.panQ = ''; break;
    case 'panF': { const t = panMeals()[V.pan][0], m = V.panD[t] = V.panD[t] || {}; m[v] = !m[v] ? 'h' : m[v] === 'h' ? 'c' : null; if (!m[v]) delete m[v]; break; }
    case 'panNoS': V.panD.noS = !V.panD.noS; break;
    case 'panB': V.pan = Math.max(0, V.pan - 1); V.panC = 0; V.panQ = ''; break;
    case 'panN': { if (V.pan < panMeals().length - 1) { V.pan++; V.panC = 0; V.panQ = ''; break; } const P = V.panD; P.at = now(); S.pantry = P; V.pan = null; send({ t: 'pantry', p: { B: P.B || {}, L: P.L || {}, D: P.D || {}, S: P.noS ? {} : P.S || {} }, noS: !!P.noS, at: P.at }); save(); toast('وصلت قائمة المتوفر لأخصائيك ✓'); break; }
    case 'pfGo': V.pfA = {}; V.pf = 0; break;
    case 'pfX': V.pf = null; S.planAt = now(); save(); break;
    case 'pfO': { pfKeep(); const q = pfQs(V.pfA)[V.pf]; if (q.many) { const arr = V.pfA[q.k] = V.pfA[q.k] || [], j = arr.indexOf(v); j < 0 ? arr.push(v) : arr.splice(j, 1); } else { V.pfA[q.k] = v; if (!q.other && V.pf < pfQs(V.pfA).length - 1) V.pf++; } break; }
    case 'pfDay': { const arr = V.pfA.trD = V.pfA.trD || [], j = arr.indexOf(+v); j < 0 ? arr.push(+v) : arr.splice(j, 1); arr.sort(); break; }
    case 'pfB': pfKeep(); V.pf = Math.max(0, V.pf - 1); break;
    case 'pfN': { pfKeep(); if (V.pf < pfQs(V.pfA).length - 1) { V.pf++; break; } const a = V.pfA; S.prof = { at: now(), a }; V.pf = null; send({ t: 'prof', ans: a }); save(); toast('شكراً! وصل ملفك لأخصائيك ✓'); break; }
    case 'wkGo': V.wk = 1; V.wkD = {}; break;
    case 'wkX': V.wk = 0; break;
    case 'wkPic': { const kind = v; V.wkD.w = $('#wkW').value; V.wkD.waist = $('#wkWs').value; picFile(async (f) => { try { V.wkD[kind] = await picPrep(f); render(); } catch (e) { toast(e.message); } }); break; }
    case 'wkSend': {
      const w = parseFloat(numOnly($('#wkW').value)), ws = parseFloat(numOnly($('#wkWs').value)); if (!(w > 20 && w < 400)) { toast('اكتب وزنك بالكيلو'); break; }
      const c = { ts: now(), w: Math.round(w * 10) / 10 }; if (ws > 30 && ws < 300) c.waist = Math.round(ws * 2) / 2; const x = V.wkD;
      S.checks = (S.checks || []).concat([c]).slice(-60); S.weights.push([c.ts, c.w]); send({ t: 'wk', w: c.w, waist: c.waist || 0, ts: c.ts });
      ['inb', 'lab'].forEach((k) => { if (x[k]) send({ t: 'wkimg', id: pid(), kind: k, img: x[k].img.split(',')[1], ts: c.ts }); });
      V.wk = 0; save(); toast('وصل قياس الأسبوع لأخصائيك ✓'); break;
    }
    case 'bdGo': V.bd = 1; V.bdD = {}; break;
    case 'bdX': V.bd = 0; break;
    case 'bdLater': S.bdSnooze = now(); save(); break;
    case 'bdPic': picFile(async (f) => { try { Object.assign(V.bdD, await picPrep(f)); render(); } catch (e) { toast(e.message); } }); break;
    case 'bdSend': { const x = V.bdD; if (!x.img) break; x.pub = !!($('#bdPub') || {}).checked; const id = pid(); S.bodies = (S.bodies || []).concat([{ id, ts: now(), th: x.th, pub: x.pub }]).slice(-24); send({ t: 'body', id, img: x.img.split(',')[1], pub: x.pub, ts: now() }); V.bd = 0; save(); toast('وصلت صورة التقدم لأخصائيك ✓'); break; }
    case 'avPic': picFile(async (f) => { try { const [th] = await shrink(f, [[200, 0.7]]); S.avatar = th; save(); render(); } catch (e) { toast(e.message); } }); break;
    case 'apOk': S.apConf = Object.assign({}, S.apConf, { [v]: 'ok' }); send({ t: 'apc', id: v, ok: 1 }); save(); toast('أكّدت الموعد ✓ — نراك فيه'); break;
    case 'apChg': { const note = (prompt('ما الوقت الأنسب لك؟ (اختياري)') || '').trim().slice(0, 200); S.apConf = Object.assign({}, S.apConf, { [v]: 'chg' }); send({ t: 'apc', id: v, ok: 0, note }); save(); toast('وصل طلب تغيير الموعد لأخصائيك'); break; }
    case 'refShare': { const t = 'أتابع نظامي الغذائي مع ' + S.dname + ' على «حصتي». استعمل كود دعوتي ' + S.pts.ref + ' عند اشتراكك.'; if (navigator.share) navigator.share({ text: t }).catch(() => { }); else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('نُسخت رسالة الدعوة')); break; }
    case 'subDay': { const L = dl(TODAY), t = $('#offT'); if (t) L.offT = t.value.trim().slice(0, 500); L.sub = Date.now(); logNow(TODAY); toast('وصل تسجيل اليوم لأخصائيك ✓'); break; }
    case 'qnote': { const t = $('#noteIn'); t.value = (t.value ? t.value + ' • ' : '') + v; t.focus(); return; }
    case 'savenote': { const t = $('#noteIn').value.trim().slice(0, 500), L = dl(TODAY); if (t) L.note[sheet.si] = t; else delete L.note[sheet.si]; sheet = null; queueLog(dkey(new Date())); toast('حُفظت الملاحظة وتصل أخصائيك.'); break; }
    case 'shop': sheet = { t: 'shop' }; break;
    case 'healthReq': sheet = { t: 'health', cond: S.p.cond.slice(), allg: S.p.allg.slice() }; break;
    case 'htog': { const arr = sheet[k], i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); el.classList.toggle('on'); return; }
    case 'sendhealth': S.pending = sheet.cond.concat(sheet.allg); if (!S.pending.length) S.pending = ['لا حالات']; send({ t: 'health', cond: sheet.cond, allg: sheet.allg }); sheet = null; toast('أُرسل الطلب، ولن تتغير خطتك قبل اعتماد أخصائيك.'); break;
    case 'weigh': { const w = parseFloat(numOnly(($('#wIn') || {}).value || '')); if (!(w > 25 && w < 300)) { toast('اكتب وزناً صحيحاً بالكيلوجرام.'); return; } const r = Math.round(w * 10) / 10, today = dkey(new Date()); S.weights = S.weights.filter((x) => dkey(new Date(x[0])) !== today).concat([[now(), r]]); send({ t: 'weight', w: r }); toast('سُجّل وزنك ' + r + ' كجم ويصل أخصائيك.'); break; }
    case 'close': sheet = null; if (S && S.__tmp) S = null; break;
    default: return;
  }
  render();
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.act === 'pickmeal' && t.value) { const arr = S.p[t.dataset.k][t.dataset.v]; if (!arr.includes(t.value)) arr.push(t.value); render(); }
  if (t.dataset.act === 'consent') { S.consent = t.checked; render(); }
  if (t.dataset.rem) {
    S.rem = Object.assign({ water: false, meals: false }, S.rem); S.rem[t.dataset.rem] = t.checked; if (t.dataset.rem === 'med' && t.checked && !(S.rem.meds || []).length) S.rem.meds = [{ n: '', t: '08:00' }]; save();
    const MSG = { water: 'سيصلك تذكير الماء كل ساعتين 💧', meals: 'سيصلك تذكير مواعيد وجباتك 🍽', adhAm: 'سيصلك تذكير أذكار الصباح 📿', adhPm: 'سيصلك تذكير أذكار المساء 🌙', med: 'سيصلك تذكير موعد الدواء 💊', pray: 'اختر مدينتك لتصلك مواقيت الصلاة 🕌', sal: 'سيصلك تذكير الصلاة على النبي ﷺ', quiet: 'لا تذكيرات في ساعات الهدوء (عدا الدواء والمواعيد) 🌙' };
    (t.checked && pushState() !== 'on' ? pushSetup(true) : Promise.resolve(pushState())).then((st) => { if (t.checked && st !== 'on') toast(st === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح — فعّلها ليصلك التذكير' : 'فعّل الإشعارات ليصلك التذكير والتطبيق مغلق'); return remSync(true); }).then(() => { if (t.checked && pushState() === 'on') toast(MSG[t.dataset.rem] || 'فُعّل التذكير'); render(); });
  }
  if (t.dataset.wk) { const L = dl(TODAY), n = Math.max(0, Math.min(80000, Math.round(+numOnly(t.value) || 0))); L.h = L.h || {}; if (n) L.h[t.dataset.wk] = n; else delete L.h[t.dataset.wk]; queueLog(dkey(new Date())); save(); render(); }
  if (t.id === 'offT') { const L = dl(TODAY); L.offT = t.value.trim().slice(0, 500); queueLog(dkey(new Date())); save(); }
  if (t.id === 'setupCity' && V.setup) { V.setup.city = t.value; if (!t.value) V.setup.on.pray = 0; render(); return; }
  if (t.dataset.prcity != null && t.id === 'prCity') { S.rem = Object.assign({ water: false, meals: false }, S.rem); S.rem.prCity = t.value; save(); remSync(true); render(); toast(t.value ? 'مواقيت ' + t.value + ' ✓' : 'اختر مدينتك'); }
  if (t.dataset.remcap != null && t.id === 'remCap') { S.rem = Object.assign({ water: false, meals: false }, S.rem); S.rem.cap = +t.value || 0; save(); remSync(true); toast('حُفظ الحد الأقصى للتذكيرات'); }
  if (t.dataset.remsound) { S.rem = Object.assign({ water: false, meals: false }, S.rem); S.rem.sound = t.checked; save(); if (t.checked) almChime(); else almStop(); }
  if (t.dataset.remt) { S.rem = Object.assign({ water: false, meals: false }, S.rem); S.rem[t.dataset.remt] = t.value || (t.dataset.remt === 'adhAmT' ? '06:00' : '17:30'); save(); remSync(true).then(() => { toast('حُفظ وقت التذكير'); render(); }); }
  if (t.dataset.med) { const [f, i] = t.dataset.med.split('|'), x = (S.rem && S.rem.meds || [])[+i]; if (x) { x[f] = f === 'n' ? t.value.trim().slice(0, 40) : (t.value || '08:00'); save(); remSync(true).then(() => { if (f === 't') toast('حُفظ موعد الدواء'); }); } }
  if (t.dataset.sch) { const x = sched()[+t.dataset.sch]; x.type = t.value; if (t.value === dayTypes()[0]) { x.min = 0; x.time = ''; } else if (!x.min) { x.min = 60; x.time = x.time || '17:00'; } render(); }
});
document.addEventListener('input', (e) => {               // التقاط أولاً: تحويل الأرقام العربية قبل أي قراءة للقيمة
  const t = e.target; if (!t || t.tagName !== 'INPUT' || !(t.dataset.numf || t.dataset.tel)) return;
  const v = t.value, n = t.dataset.numf ? numOnly(v) : latin(v); if (n === v) return;
  const p = Math.max(0, (t.selectionStart == null ? n.length : t.selectionStart) - (v.length - n.length)); t.value = n; try { t.setSelectionRange(p, p); } catch (x) { }
}, true);
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.bind || t.dataset.cq || t.dataset.schm || t.dataset.scht) {
    if (t.dataset.bind) S.p[t.dataset.bind] = t.value; else if (t.dataset.cq) { S.p.cq = S.p.cq || {}; S.p.cq[t.dataset.cq] = t.value; } else if (t.dataset.schm) sched()[+t.dataset.schm].min = +t.value || 0; else sched()[+t.dataset.scht].time = t.value;
    save(); const btn = $('.foot .btn'); if (btn && S.screen === 'wizard') { mkForm(); btn.disabled = !stepOk(FS[S.step - 1]); }
  }
  if (t.dataset.panq) { V.panQ = t.value; const pos = t.selectionStart; render(); const n = document.getElementById('panQ'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { } } return; }
  if (t.dataset.q) { S[t.dataset.q] = t.value; const pos = t.selectionStart; render(); const n = document.getElementById(t.id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { } } }
});
window.addEventListener('online', () => { V.online = true; poll(); });
window.addEventListener('offline', () => { V.online = false; render(); });
window.HissatiApp = { wheel: { cats: () => whCats().map((i) => whx().cats[i].id), dia: whDia, text: (id, i) => { const ci = whx().cats.findIndex((c) => c.id === id); return whText(ci, i); }, maybe: () => { WHL.shown = false; whMaybe(); }, open: (m) => whOpen(m) }, state: () => S, poll, flush, feed: () => FD, feedLoad: fdLoad, celebrateTest: (id) => celebrate(id), alarm: (items) => almShow(items), alarmTick: almTick, alarmFire: almFire, remItems, render, prayTimes };     // للاختبارات
boot();
})();
