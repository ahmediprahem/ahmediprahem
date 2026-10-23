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
  photos: [], chal: null, chLogo: {}, ach: [], rem: { water: false, meals: false }, remSig: '', ident: null, tok: '', fp: '', did: '', cid: '', dEnc: null, dname: '', cat: {}, after: 0, outbox: [], removed: false
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
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(saveT); persist(); } else if (K) { TODAY = new Date().getDay(); poll(); } });
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
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.t === 'rem') { if (S) toast(e.data.text); return; } if (e.data && e.data.t === 'push') { poll(); fdLoad().then(() => { if (S) render(); }); } });
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
    const pl = p.plan; S.pm = { sys: pl.sys || 'ex', kcal: pl.kcal, pro: pl.pro, cho: pl.cho, fat: pl.fat, water: pl.water, dayNames: pl.dayNames, groups: pl.groups, recipes: pl.recipes && typeof pl.recipes === 'object' ? pl.recipes : {} };
    S.plan = JSON.parse(JSON.stringify(pl.days)); S.pv = +p.v || 1; mkData(); if (S.req !== 'approved') S.req = 'approved';
    foodsOf('no').forEach((f) => { if (foodInPlan(f)) applyDislike(f); });
    const first = S.screen !== 'app'; S.screen = 'app'; if (first) S.tab = 'today'; remSync();
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
  if (p.t === 'read') { S.msgs.forEach((m) => { if (m.from === 'c' && m.ts <= p.upTo) m.read = true; }); return true; }
  return false;
}
function readReceipt() { S.unreadC = 0; const last = S.msgs.filter((m) => m.from === 'd').slice(-1)[0]; if (last && !last.rr) { last.rr = 1; send({ t: 'read', upTo: last.ts }); } }
let logT = {}; function queueLog(k) { clearTimeout(logT[k]); logT[k] = setTimeout(() => sendLog(k), 2500); }
function sendLog(k) {
  const L = S.log[k]; if (!L || !S.plan) return; const dow = new Date(k + 'T12:00:00').getDay(), day = S.plan[dow % S.plan.length]; let n = 0, done = 0;
  day.slots.forEach((s, si) => s.lines.forEach((l, li) => { n++; if (L.ck[si + '_' + li]) done++; }));
  send({ t: 'log', d: k, dow, pv: S.pv, ck: L.ck, sw: L.sw, note: L.note, skip: L.skip, water: L.water, done, n, h: L.h || {}, hs: hList() });
}

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
  const cur = window.HxTheme ? HxTheme.get() : 'classic', T = [['classic', 'الحالي'], ['rose', 'وردة'], ['pulse', 'نبض']];
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
    + installCard('sent') + notifCard(false) + '<p class="sync">' + (S.outbox.length ? 'بانتظار الإنترنت لإرسال ' + S.outbox.length + ' عنصر…' : 'يُتحقق من الجديد تلقائياً كل نصف دقيقة') + '</p>'
    + '<button class="btn sec full" data-act="chat" style="position:relative">' + I('msg') + ' راسل أخصائيك' + (S.unreadC ? '<span class="nb" style="position:absolute;top:-6px;left:-6px;min-width:20px;height:20px;border-radius:10px;background:var(--coral);color:#3a0d05;font-size:11px;display:grid;place-items:center">' + S.unreadC + '</span>' : '') + '</button>'
    + '<button class="btn sec full" data-act="refresh">' + I('reset') + ' تحقق الآن</button>'
    + '</div></div></div>';
}

// ---------- التطبيق بعد وصول الخطة
function scrApp() {
  const body = { today: tabToday, plan: tabPlan, prefs: tabPrefs, progress: tabProgress, feed: tabFeed }[S.tab]();
  const tb = [['today', 'today', 'اليوم'], ['plan', 'cal', 'خطتي'], ['prefs', 'heart', 'تفضيلاتي'], ['feed', 'news', 'تثقيف'], ['progress', 'trend', 'تقدّمي']].map((t) => '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + I(t[1]) + '<span>' + t[2] + '</span>' + (t[0] === 'feed' && fdNew() ? '<span class="nb" aria-label="' + fdNew() + ' جديد">' + fdNew() + '</span>' : '') + '</button>').join('');
  return '<div class="scr hasTabs"><div class="scroll"><div class="stack">' + (S.removed ? '<div class="banner warn">' + I('alert') + '<span>أوقف أخصائيك ربط حسابك؛ خطتك الحالية تبقى معروضة لكن لا تصله متابعتك.</span></div>' : '') + body + '</div></div><nav class="tabbar" aria-label="التنقل">' + tb + '</nav></div>';
}
function tabToday() {
  const d = TODAY, L = dl(d), [done, n] = itemsOfDay(d), pct = n ? Math.round(done / n * 100) : 0, C = 2 * Math.PI * 40;
  const first = (S.p.name || '').trim().split(/\s+/)[0] || '';
  let out = (S.fw === 'pending' ? firstWinCard() : installState() === 'done' || installState() === 'desktop' ? notifCard(true) : installCard('today')) + '<div class="hello"><div class="av sm">' + esc(first.charAt(0) || '؟') + '</div><div style="flex:1"><div class="dim">' + esc(DATA.dayNames[d] || '') + '</div><h2>أهلاً ' + esc(first) + '</h2></div>' + chatBtn() + '</div>' + chalCard();
  out += '<section class="card ring"><svg viewBox="0 0 100 100" role="img" aria-label="التزام اليوم ' + pct + '%"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#6fe3a9" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/></svg><div style="flex:1"><div class="num">' + pct + '%</div><div class="mut">' + done + ' من ' + n + ' أصناف اليوم</div>'
    + (pct === 100 ? '<div class="dim" style="color:var(--mint)">يوم كامل، أحسنت!</div>' : '<div class="dim">علّم ما أكلته باللمس.</div>') + '</div></section>';
  const dp = dayPlan(d), kc = dp.kcal || DATA.kcal, pr = dp.p || DATA.pro, wt = +(dp.water || DATA.water), cups = Math.max(4, Math.min(16, Math.round(wt / CUP)));
  if (dp.type) out += '<div class="banner info">' + I('dumbbell') + '<span><b>' + esc(dp.type) + '</b> • كارب ' + dp.c + ' جم • دهون ' + dp.f + ' جم</span></div>';
  out += '<div class="stats3"><div class="st"><b>' + kc + '</b><small>سعرة هدفك' + (dp.type ? ' اليوم' : '') + '</small></div><div class="st"><b>' + pr + ' جم</b><small>بروتين</small></div><div class="st"><b>' + (L.water * CUP).toFixed(2).replace(/\.?0+$/, '') + ' / ' + wt.toFixed(1) + '</b><small>لتر ماء</small></div></div>';
  out += habitsHome() + '<h2 class="mealsh">وجباتي</h2>' + dayPlan(d).slots.map((s, si) => mealCard(d, si, s, true)).join('');
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
  if (!live) return '<section class="card"><div class="row" style="justify-content:space-between"><h3>' + esc(s.name) + '</h3><span class="dim">' + esc(s.time) + ' • ' + s.kcal + ' سعرة</span></div>' + meal + '<ul class="plist" style="margin-top:8px">' + items + '</ul>' + (rbtn ? '<div class="macts">' + rbtn + '</div>' : '') + '</section>';
  return '<section class="card meal' + (all ? ' done' : '') + (skip ? ' skip' : '') + '"><div class="mt"><span class="tm">' + esc(s.time) + '</span><div style="flex:1;min-width:0"><h3>' + esc(s.name) + '</h3>' + meal + '</div><span class="pc">' + s.kcal + ' سعرة</span></div><div class="items">' + items + '</div>'
    + (L.note[si] ? '<div class="note">' + I('edit') + ' ' + esc(L.note[si]) + '</div>' : '') + phStrip(si)
    + '<div class="macts"><button class="btn sm sec" data-act="whole" data-v="' + si + '">' + I('check') + (all ? ' تمّت' : ' أكلتها كاملة') + '</button><button class="btn sm sec" data-act="note" data-v="' + si + '">' + I('edit') + ' أضفت / ملاحظة</button><button class="btn sm sec" data-act="skip" data-v="' + si + '">' + (skip ? 'تراجع' : 'لم آكلها') + '</button><button class="btn sm sec" data-act="ask" data-v="' + si + '">' + I('msg') + ' اسأل عنها</button><button class="btn sm sec" data-act="photo" data-v="' + si + '">' + I('camera') + ' صوّر وجبتك</button>' + rbtn + '</div></section>';
}
function tabPlan() {
  const chips = DATA.dayNames.map((n, i) => { const [a, b] = itemsOfDay(i); return '<button class="' + (S.day === i ? 'on' : '') + (i === TODAY ? ' today' : '') + '" data-act="day" data-v="' + i + '"><b>' + esc(String(n).replace('ال', '')) + '</b><span>' + (b && i <= TODAY ? Math.round(a / b * 100) + '%' : '—') + '</span></button>'; }).join('');
  return '<div class="row" style="justify-content:space-between"><h2>خطتي</h2><button class="btn sm sec" data-act="shop">' + I('cart') + ' قائمة التسوّق</button></div>'
    + '<div class="dim">من ' + esc(S.dname) + ' • ' + (S.pm && S.pm.sys === 'g' ? 'نظام الجرامات: السعرات حسب نوع كل يوم' : DATA.kcal + ' سعرة يومياً') + ' • الإصدار ' + S.pv + '</div>'
    + '<div class="daychips">' + chips + '</div>' + (dayPlan(S.day).type ? '<div class="banner info">' + I('dumbbell') + '<span><b>' + esc(dayPlan(S.day).type) + '</b> • ' + dayPlan(S.day).kcal + ' سعرة • بروتين ' + dayPlan(S.day).p + ' • كارب ' + dayPlan(S.day).c + ' • دهون ' + dayPlan(S.day).f + ' جم</span></div>' : '') + dayPlan(S.day).slots.map((s, si) => mealCard(S.day, si, s, false)).join('');
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
  const sf = t === 'rose' || t === 'pulse' ? '-' + t : '', set = (sel, h) => { const e = document.querySelector(sel); if (e) e.setAttribute('href', h); };
  set('link[rel=manifest]', '/manifest.webmanifest' + (sf ? '?t=' + t : '')); set('link[rel=apple-touch-icon]', '/apple-180' + sf + '.png'); set('link[rel=icon]', '/icon-192' + sf + '.png');
}
function themeCard() {
  const cur = window.HxTheme ? HxTheme.get() : 'classic', T = [['classic', 'الحالي'], ['rose', 'وردة'], ['pulse', 'نبض']];
  return '<section class="card stack"><h3>' + I('sparkle') + ' مظهر التطبيق</h3><div class="hx-themes" role="radiogroup" aria-label="مظهر التطبيق">'
    + T.map((t) => '<button class="hx-th" role="radio" aria-checked="' + (cur === t[0]) + '" data-act="theme" data-v="' + t[0] + '"><span class="hx-pv" data-theme="' + t[0] + '" aria-hidden="true"><i class="h"></i><i class="k"><b></b></i><i class="k s"></i><i class="c"></i></span><span class="hx-tl">' + t[1] + (cur === t[0] ? ' ✓' : '') + '</span></button>').join('')
    + '</div><p class="dim">خطتك وبياناتك لا تتغير، يتغير الشكل فقط. يُحفظ على هذا الجوال. أيقونة التطبيق تتبع الثيم أيضاً: عند التثبيت تُؤخذ أيقونة ثيمك الحالي (أندرويد يحدّثها لاحقاً من تلقاء نفسه، وآيفون يحتاج حذف الأيقونة وإعادة إضافتها).</p></section>';
}
function tabProgress() {
  const W = S.weights.slice().sort((a, b) => a[0] - b[0]).slice(-10);
  let chart = '<p class="dim">سجّل وزنك أسبوعياً ليظهر منحناك هنا.</p>', diff = 0;
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
  return '<h2>تقدّمي</h2><section class="card stack"><div class="row" style="justify-content:space-between"><h3>الوزن</h3><span class="dim">' + (W.length > 1 ? (diff <= 0 ? diff + ' كجم منذ البداية' : '+' + diff + ' كجم') : '') + '</span></div>' + chart
    + '<div class="row"><input class="inp" id="wIn" type="text" data-numf="1" autocomplete="off" inputmode="decimal" placeholder="وزن اليوم (كجم)" style="flex:1"><button class="btn sm" data-act="weigh">' + I('scale') + ' سجّل</button></div></section>'
    + '<section class="card stack"><div class="row" style="justify-content:space-between"><h3>الالتزام آخر 7 أيام</h3><span class="dim">% من الأصناف</span></div><div class="wk">' + bars + '</div></section>'
    + '<section class="card achcard"><div class="row" style="justify-content:space-between"><h3>🏅 إنجازاتي</h3><span class="dim">' + (S.ach || []).length + ' شهادة</span></div><button class="btn sm" data-act="achs">' + I('sparkle') + ' عرض إنجازاتي وشهاداتي</button></section>' + habitsProgress() + themeCard() + remCard() + '<section class="card stack"><h3>الحساب</h3><p class="dim">ملفك لدى ' + esc(S.dname) + (S.code ? ' • رقم ' + esc(S.code) : '') + '. بياناتك محفوظة مشفّرة على هذا الجوال فقط.</p>' + installCard('acct') + notifCard(false) + '<div class="row"><button class="btn sm sec" data-act="lock">' + I('lock') + ' قفل التطبيق</button><button class="btn sm sec" data-act="xferNew">' + I('phone') + ' نقل حسابي</button></div><button class="link" data-act="wipe" style="color:var(--coral)">حذف بياناتي من هذا الجوال</button></section>';
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
      : '<div class="empty"><div class="ei">' + I('news') + '</div><h3>' + (FD.at ? 'لا منشورات بعد' : 'جارٍ التحميل…') + '</h3><p class="dim">' + (FD.at ? 'ما ينشره أخصائيك من نصائح ومواضيع وفيديوهات يظهر هنا، وتستطيع الإعجاب به والتعليق عليه.' : '') + '</p></div>');
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
  return '<div class="rcp">' + (r.img ? '<img src="/m/' + esc(r.img) + '" alt="' + esc(s.meal) + '">' : '') + (r.mins ? '<p class="dim">' + I('clock') + ' التحضير حوالي ' + (+r.mins) + ' دقيقة</p>' : '')
    + '<h3>المقادير لك</h3><ul class="plist">' + s.lines.map((l) => '<li>' + esc(lineT(l)) + '</li>').join('') + '</ul>' + ((r.steps || []).length ? '<h3>الطريقة</h3><ol class="steps">' + r.steps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' : '') + (r.tip ? '<div class="banner ok">' + I('sparkle') + '<span>' + esc(r.tip) + '</span></div>' : '') + '</div>';
}
// ---------- التذكيرات: الماء كل ساعتين والوجبات في أوقات خطتك — تصل والتطبيق مغلق (المحطة تعرف الأوقات فقط)
const WATER = [600, 720, 840, 960, 1080, 1200];
const MEDMAX = 4, hm2m = (x) => { const m = /^(\d{1,2}):(\d{2})/.exec(x || ''); return m ? (Math.round((+m[1] * 60 + +m[2]) / 15) * 15) % 1440 : null; };
function remItems() {                              // أوقات اليوم المحلية (دقائق من منتصف الليل، مقرّبة لربع ساعة): ماء • وجبات • أذكار الصباح والمساء • مواعيد الدواء (اسم الدواء يبقى على الجوال ولا يصل المحطة)
  const R = S.rem || {}, it = []; if (R.water) WATER.forEach((m) => it.push({ m, t: 'water' }));
  if (R.meals && S.plan) dayPlan(TODAY).slots.forEach((s) => { const m = hm2m(s.time); if (m != null) it.push({ m, t: 'meal', label: s.name }); });
  if (R.adhAm) { const m = hm2m(R.adhAmT || '06:00'); if (m != null) it.push({ m, t: 'adhAm' }); }
  if (R.adhPm) { const m = hm2m(R.adhPmT || '17:30'); if (m != null) it.push({ m, t: 'adhPm' }); }
  if (R.med) (R.meds || []).slice(0, MEDMAX).forEach((x) => { const m = hm2m(x.t); if (m != null) it.push({ m, t: 'med', label: String(x.n || '').slice(0, 40) }); });
  return it;
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
    + tg('adhAm', 'أذكار الصباح', 'تذكير يومي بوقتك المفضّل') + (R.adhAm ? tm('adhAmT', '06:00', 'وقت أذكار الصباح') : '')
    + tg('adhPm', 'أذكار المساء', 'تذكير يومي بوقتك المفضّل') + (R.adhPm ? tm('adhPmT', '17:30', 'وقت أذكار المساء') : '')
    + tg('med', 'موعد الدواء', 'تذكير بأوقات أدويتك أو مكمّلاتك') + meds
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
function hList() { if (!Array.isArray(S.habits)) S.habits = ['water']; return S.habits.filter((id) => HB(id)); }
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
  return '<p class="dim">اختر العادات التي تريد تنميتها؛ تظهر في «اليوم» بتصميمها، ويرى أخصائيك تقدّمك فيها. ابدأ بعادتين أو ثلاث.</p><div class="hlib">' + HABITS.map((h) => { const on = ls.indexOf(h.id) >= 0;
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
function adhOpen(hid) {
  hid = hid || 'adhkar'; const LST = adhList(hid), TOT = adhTotal(hid), pm = hid === 'adhkarPm';
  if (document.getElementById('adx')) return; const el = document.createElement('div'); el.id = 'adx'; el.className = 'adx'; document.body.appendChild(el);
  const draw = (pulse) => {
    const v = hVal(hid) || { c: [] }, done = adhDone(v, hid), p = done / TOT, nx = LST.findIndex((a, i) => (v.c[i] || 0) < a[1]);
    el.innerHTML = '<div class="adh"><button class="btn sm sec" id="adclose">' + I('x') + ' إغلاق</button><div class="adheart' + (pulse ? ' pulse' : '') + '">' + heartSvg(p, 1, pm) + '<b>' + Math.round(p * 100) + '%</b></div><small>' + done + ' من ' + TOT + '</small></div>'
      + '<div class="adlist">' + LST.map((a, i) => { const n = v.c[i] || 0, left = a[1] - n, fin = left <= 0;
        return '<button class="adk' + (fin ? ' fin' : '') + (i === nx ? ' cur' : '') + '" data-i="' + i + '"' + (fin ? ' aria-disabled="true"' : '') + '>' + (fin ? '<span class="adone">' + (a[2] || a[0].split(/[،,:.]/)[0]) + '</span><span class="adc">✓ تمّ</span>' : (a[2] ? '<span class="adt">' + a[2] + '</span>' : '') + '<span class="adtx">' + a[0] + '</span><span class="adc">' + left + (a[1] > 1 ? ' من ' + a[1] : '') + '</span>') + '</button>'; }).join('') + '</div>';
    el.querySelector('#adclose').onclick = () => { el.remove(); render(); };
    const cur = el.querySelector('.adk.cur'); if (cur && (pulse === 'next' || pulse === 0)) cur.scrollIntoView({ block: 'center', behavior: pulse ? 'smooth' : 'auto' });
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.adk'); if (!b || b.classList.contains('fin')) return; const i = +b.dataset.i, v = JSON.parse(JSON.stringify(hVal(hid) || { c: [] })), was = hOkDay(hid);
    v.c[i] = Math.min(LST[i][1], (v.c[i] || 0) + 1); hSet(hid, v); if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) { }
    const fin = v.c[i] >= LST[i][1]; draw(fin ? 'next' : 1);
    if (!was && hOkDay(hid)) { el.remove(); render(); celebrate(hid); }
  });
  draw(0);
}
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
      : '<div class="empty"><div class="ei">🏅</div><p class="dim">' + (S.chal ? 'أتمّ أهداف تحدي هذا الأسبوع لتحصل على أول شهادة تقدير باسمك.' : 'حين يرسل لك أخصائيك تحدياً أسبوعياً، تظهر هنا شهاداتك عند إتمامه.') + '</p></div>');
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
  g.fillStyle = '#12305e'; g.font = F(400, 36); g.fillText((a.sex === 'أنثى' ? 'لإتمامها ' : 'لإتمامه ') + (a.w === 99 ? a.title + ' بنجاح' : 'تحدي الأسبوع ' + a.w + ': «' + a.title + '»'), W / 2, y + 275);
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
  const empty = S.msgs.length ? '' : '<div class="empty" style="padding:20px 6px"><div class="ei" style="background:rgba(111,227,169,.15);color:var(--mint)">' + I('msg') + '</div><p class="mut">اكتب لأخصائيك أي سؤال عن خطتك أو يومك. يصله إشعار.</p></div>';
  return '<div class="scr"><div class="chat"><div class="who"><button class="back" data-act="chatClose" aria-label="رجوع" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--glass);border:1px solid var(--line)">' + I('back') + '</button><div class="av sm">' + esc(drInit()) + '</div><div style="flex:1;min-width:0"><b>' + esc(S.dname) + '</b><div class="dim">يرد عادة خلال ساعات العمل</div></div></div>'
    + '<div class="thread" id="thread">' + empty + bubbles() + '</div>'
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
  else scr = S.chat ? scrChat() : S.plan && S.screen === 'app' ? scrApp() : { invite: scrInvite, wizard: scrWizard, review: scrReview, sent: scrSent, app: scrSent }[S.screen]();
  const keep = {}; document.querySelectorAll('video[data-keep]').forEach((n) => { keep[n.dataset.keep] = n; });
  const cmI = $('#cmIn'), cmV = cmI ? [cmI.value, document.activeElement === cmI] : null;          // مسودة التعليق تبقى عند إعادة الرسم (وصول التعليقات مثلاً)
  $('#root').innerHTML = '<div class="stage"><div class="device">' + (V.online ? '' : '<div class="offline">بلا اتصال — تُرسل بياناتك عند عودة الإنترنت</div>') + scr + (S ? sheetHtml() : '') + (toastMsg ? '<div class="toast" role="status">' + I('check') + '<span>' + esc(toastMsg) + '</span></div>' : '') + '</div></div>';
  document.querySelectorAll('video[data-keep]').forEach((n) => { const o = keep[n.dataset.keep]; if (o && o !== n) n.replaceWith(o); });   // فيديو يعمل لا يتوقف عند إعادة الرسم
  if (cmV) { const n = $('#cmIn'); if (n) { n.value = cmV[0]; if (cmV[1]) n.focus(); } }
  const s2 = $('.scroll'); if (s2 && key === lastKey) s2.scrollTop = top; lastKey = key;
  const th = $('#thread'); if (th) th.scrollTop = th.scrollHeight;
  onbSplashTimer(); fillCerts(); if (window.HxMotion) HxMotion.after(); if (S && S.chal && S.screen === 'app' && V.screen === '') chalCheck();
  if (focusChat) { const c = $('#chatIn'); if (c) c.focus(); focusChat = false; }
  if (S && K) save();
}
let focusChat = false;
function startLoop() { clearInterval(V.timer); V.timer = setInterval(() => { if (!document.hidden) { poll(); if (now() - FD.at > 5 * 60000) fdLoad().then(render); } }, POLL); poll(); fdLoad().then(render); pushSetup(false).then((st) => { if (st === 'on') render(); remSync(); }); }

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
      S.screen = 'wizard'; S.step = 1; await persist(); try { sessionStorage.removeItem(TKEY); } catch (e) { }
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
    const MSG = { water: 'سيصلك تذكير الماء كل ساعتين 💧', meals: 'سيصلك تذكير مواعيد وجباتك 🍽', adhAm: 'سيصلك تذكير أذكار الصباح 📿', adhPm: 'سيصلك تذكير أذكار المساء 🌙', med: 'سيصلك تذكير موعد الدواء 💊' };
    (t.checked && pushState() !== 'on' ? pushSetup(true) : Promise.resolve(pushState())).then((st) => { if (t.checked && st !== 'on') toast(st === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح — فعّلها ليصلك التذكير' : 'فعّل الإشعارات ليصلك التذكير والتطبيق مغلق'); return remSync(true); }).then(() => { if (t.checked && pushState() === 'on') toast(MSG[t.dataset.rem] || 'فُعّل التذكير'); render(); });
  }
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
  if (t.dataset.q) { S[t.dataset.q] = t.value; const pos = t.selectionStart; render(); const n = document.getElementById(t.id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { } } }
});
window.addEventListener('online', () => { V.online = true; poll(); });
window.addEventListener('offline', () => { V.online = false; render(); });
window.HissatiApp = { state: () => S, poll, flush, feed: () => FD, feedLoad: fdLoad, celebrateTest: (id) => celebrate(id) };     // للاختبارات
boot();
})();
