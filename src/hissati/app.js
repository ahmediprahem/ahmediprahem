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
  ident: null, tok: '', fp: '', did: '', cid: '', dEnc: null, dname: '', cat: {}, after: 0, outbox: [], removed: false
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
  const body = obj === undefined ? '' : JSON.stringify(obj), h = { 'content-type': 'application/json' };
  if (!unsigned) h.authorization = await HXC.signReq(S.ident, method, path, body);
  let r; try { r = await fetch(API + path, { method, headers: h, body: method === 'POST' ? body : undefined, cache: 'no-store' }); } catch (e) { const x = new Error('لا اتصال بالإنترنت'); x.net = 1; throw x; }
  const j = await r.json().catch(() => ({})); if (!r.ok) { const x = new Error(j.error || 'خطأ (' + r.status + ')'); x.code = j.code; x.status = r.status; throw x; }
  V.online = true; return j;
}
function send(payload) {                           // صندوق صادر: يُرسل الآن، ويُعاد لاحقاً إن انقطع الإنترنت (المتابعة اليومية تُدمج بآخر نسخة لليوم)
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
let swReg = null;
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  swReg = navigator.serviceWorker.register('/sw.js').catch(() => null);
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.t === 'push') poll(); });
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
function installState() { if (standalone) return 'done'; if (inApp) return 'inapp'; if (bip) return 'prompt'; if (isIOS) return 'ios'; if (isAndroid) return 'android'; return 'desktop'; }
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
    const pl = p.plan; S.pm = { sys: pl.sys || 'ex', kcal: pl.kcal, pro: pl.pro, cho: pl.cho, fat: pl.fat, water: pl.water, dayNames: pl.dayNames, groups: pl.groups };
    S.plan = JSON.parse(JSON.stringify(pl.days)); S.pv = +p.v || 1; mkData(); if (S.req !== 'approved') S.req = 'approved';
    foodsOf('no').forEach((f) => { if (foodInPlan(f)) applyDislike(f); });
    const first = S.screen !== 'app'; S.screen = 'app'; if (first) S.tab = 'today';
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
  if (p.t === 'read') { S.msgs.forEach((m) => { if (m.from === 'c' && m.ts <= p.upTo) m.read = true; }); return true; }
  return false;
}
function readReceipt() { S.unreadC = 0; const last = S.msgs.filter((m) => m.from === 'd').slice(-1)[0]; if (last && !last.rr) { last.rr = 1; send({ t: 'read', upTo: last.ts }); } }
let logT = {}; function queueLog(k) { clearTimeout(logT[k]); logT[k] = setTimeout(() => sendLog(k), 2500); }
function sendLog(k) {
  const L = S.log[k]; if (!L || !S.plan) return; const dow = new Date(k + 'T12:00:00').getDay(), day = S.plan[dow % S.plan.length]; let n = 0, done = 0;
  day.slots.forEach((s, si) => s.lines.forEach((l, li) => { n++; if (L.ck[si + '_' + li]) done++; }));
  send({ t: 'log', d: k, dow, pv: S.pv, ck: L.ck, sw: L.sw, note: L.note, skip: L.skip, water: L.water, done, n });
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
function scrWizard() {
  mkForm(); const N = FS.length; if (S.step > N) S.step = N; const s = S.step, st = FS[s - 1];
  const body = vq(st).map((q) => q.b ? (BQ[q.id] ? BQ[q.id](q) : '') : cqHtml(q)).join('');
  return '<div class="scr">' + head(esc(st.t), 'step', s - 1, 'الخطوة ' + s + ' من ' + N)
    + '<div class="prog"><i style="width:' + Math.round(s / N * 100) + '%"></i></div>'
    + '<div class="scroll"><div class="stack">' + (s === 1 && S.req === 'changes' && S.reqMsg ? '<div class="banner warn">' + I('msg') + '<span><b>' + esc(S.dname) + ':</b> ' + esc(S.reqMsg) + '</span></div>' : '') + body + '</div></div>'
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
  const body = { today: tabToday, plan: tabPlan, prefs: tabPrefs, progress: tabProgress }[S.tab]();
  const tb = [['today', 'today', 'اليوم'], ['plan', 'cal', 'خطتي'], ['prefs', 'heart', 'تفضيلاتي'], ['progress', 'trend', 'تقدّمي']].map((t) => '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + I(t[1]) + '<span>' + t[2] + '</span></button>').join('');
  return '<div class="scr hasTabs"><div class="scroll"><div class="stack">' + (S.removed ? '<div class="banner warn">' + I('alert') + '<span>أوقف أخصائيك ربط حسابك؛ خطتك الحالية تبقى معروضة لكن لا تصله متابعتك.</span></div>' : '') + body + '</div></div><nav class="tabbar" aria-label="التنقل">' + tb + '</nav></div>';
}
function tabToday() {
  const d = TODAY, L = dl(d), [done, n] = itemsOfDay(d), pct = n ? Math.round(done / n * 100) : 0, C = 2 * Math.PI * 40;
  const first = (S.p.name || '').trim().split(/\s+/)[0] || '';
  let out = (installState() === 'done' || installState() === 'desktop' ? notifCard(true) : installCard('today')) + '<div class="hello"><div class="av sm">' + esc(first.charAt(0) || '؟') + '</div><div style="flex:1"><div class="dim">' + esc(DATA.dayNames[d] || '') + '</div><h2>أهلاً ' + esc(first) + '</h2></div>' + chatBtn() + '</div>';
  out += '<section class="card ring"><svg viewBox="0 0 100 100" role="img" aria-label="التزام اليوم ' + pct + '%"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#6fe3a9" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/></svg><div style="flex:1"><div class="num">' + pct + '%</div><div class="mut">' + done + ' من ' + n + ' أصناف اليوم</div>'
    + (pct === 100 ? '<div class="dim" style="color:var(--mint)">يوم كامل، أحسنت!</div>' : '<div class="dim">علّم ما أكلته باللمس.</div>') + '</div></section>';
  const dp = dayPlan(d), kc = dp.kcal || DATA.kcal, pr = dp.p || DATA.pro, wt = +(dp.water || DATA.water), cups = Math.max(4, Math.min(16, Math.round(wt / CUP)));
  if (dp.type) out += '<div class="banner info">' + I('dumbbell') + '<span><b>' + esc(dp.type) + '</b> • كارب ' + dp.c + ' جم • دهون ' + dp.f + ' جم</span></div>';
  out += '<div class="stats3"><div class="st"><b>' + kc + '</b><small>سعرة هدفك' + (dp.type ? ' اليوم' : '') + '</small></div><div class="st"><b>' + pr + ' جم</b><small>بروتين</small></div><div class="st"><b>' + (L.water * CUP).toFixed(2).replace(/\.?0+$/, '') + ' / ' + wt.toFixed(1) + '</b><small>لتر ماء</small></div></div>';
  out += '<section class="card water"><span style="color:var(--sky)">' + I('drop') + '</span><span class="dim">كوب = 250 مل</span><div class="cups">' + Array.from({ length: cups }, (_, i) => '<button class="' + (i < L.water ? 'f' : '') + '" data-act="water" data-v="' + (i + 1) + '" aria-label="' + (i + 1) + ' أكواب"></button>').join('') + '</div></section>';
  out += dayPlan(d).slots.map((s, si) => mealCard(d, si, s, true)).join('');
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
  const meal = s.meal ? '<div class="dim">' + esc(s.meal) + '</div>' : '';
  if (!live) return '<section class="card"><div class="row" style="justify-content:space-between"><h3>' + esc(s.name) + '</h3><span class="dim">' + esc(s.time) + ' • ' + s.kcal + ' سعرة</span></div>' + meal + '<ul class="plist" style="margin-top:8px">' + items + '</ul></section>';
  return '<section class="card meal' + (all ? ' done' : '') + (skip ? ' skip' : '') + '"><div class="mt"><span class="tm">' + esc(s.time) + '</span><div style="flex:1;min-width:0"><h3>' + esc(s.name) + '</h3>' + meal + '</div><span class="pc">' + s.kcal + ' سعرة</span></div><div class="items">' + items + '</div>'
    + (L.note[si] ? '<div class="note">' + I('edit') + ' ' + esc(L.note[si]) + '</div>' : '')
    + '<div class="macts"><button class="btn sm sec" data-act="whole" data-v="' + si + '">' + I('check') + (all ? ' تمّت' : ' أكلتها كاملة') + '</button><button class="btn sm sec" data-act="note" data-v="' + si + '">' + I('edit') + ' أضفت / ملاحظة</button><button class="btn sm sec" data-act="skip" data-v="' + si + '">' + (skip ? 'تراجع' : 'لم آكلها') + '</button><button class="btn sm sec" data-act="ask" data-v="' + si + '">' + I('msg') + ' اسأل عنها</button></div></section>';
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
    + '<section class="card stack"><h3>الحساب</h3><p class="dim">ملفك لدى ' + esc(S.dname) + (S.code ? ' • رقم ' + esc(S.code) : '') + '. بياناتك محفوظة مشفّرة على هذا الجوال فقط.</p>' + installCard('acct') + notifCard(false) + '<div class="row"><button class="btn sm sec" data-act="lock">' + I('lock') + ' قفل التطبيق</button><button class="btn sm sec" data-act="xferNew">' + I('phone') + ' نقل حسابي</button></div><button class="link" data-act="wipe" style="color:var(--coral)">حذف بياناتي من هذا الجوال</button></section>';
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
  if (V.screen === 'boot') scr = scrBoot(); else if (V.screen === 'bad') scr = scrBad(); else if (V.screen === 'start') scr = scrStart(); else if (V.screen === 'moved') scr = scrMoved(); else if (V.screen === 'lock') scr = scrLock(); else if (V.screen === 'pin') scr = scrPin();
  else scr = S.chat ? scrChat() : S.plan && S.screen === 'app' ? scrApp() : { invite: scrInvite, wizard: scrWizard, review: scrReview, sent: scrSent, app: scrSent }[S.screen]();
  $('#root').innerHTML = '<div class="stage"><div class="device">' + (V.online ? '' : '<div class="offline">بلا اتصال — تُرسل بياناتك عند عودة الإنترنت</div>') + scr + (S ? sheetHtml() : '') + (toastMsg ? '<div class="toast" role="status">' + I('check') + '<span>' + esc(toastMsg) + '</span></div>' : '') + '</div></div>';
  const s2 = $('.scroll'); if (s2 && key === lastKey) s2.scrollTop = top; lastKey = key;
  const th = $('#thread'); if (th) th.scrollTop = th.scrollHeight;
  if (focusChat) { const c = $('#chatIn'); if (c) c.focus(); focusChat = false; }
  if (S && K) save();
}
let focusChat = false;
function startLoop() { clearInterval(V.timer); V.timer = setInterval(() => { if (!document.hidden) poll(); }, POLL); poll(); pushSetup(false).then((st) => { if (st === 'on') render(); }); }

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
    V.screen = ''; render();
  } catch (e) { V.err = e.message; V.retry = !!e.retry; V.screen = 'bad'; render(); }
}

// ---------- الأحداث
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el || el.tagName === 'SELECT' || el.dataset.act === 'consent' || el.disabled) return;
  const a = el.dataset.act, v = el.dataset.v, k = el.dataset.k;
  switch (a) {
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
    case 'tab': S.tab = v; break;
    case 'day': S.day = +v; break;
    case 'ck': { const L = dl(TODAY); L.ck[v] = !L.ck[v]; if (!L.ck[v]) delete L.ck[v]; queueLog(dkey(new Date())); break; }
    case 'whole': { const L = dl(TODAY), s = dayPlan(TODAY).slots[+v], all = s.lines.every((l, li) => L.ck[v + '_' + li]); s.lines.forEach((l, li) => { if (all) delete L.ck[v + '_' + li]; else L.ck[v + '_' + li] = 1; }); delete L.skip[v]; queueLog(dkey(new Date())); break; }
    case 'skip': { const L = dl(TODAY); L.skip[v] = !L.skip[v]; if (L.skip[v]) dayPlan(TODAY).slots[+v].lines.forEach((l, li) => delete L.ck[v + '_' + li]); else delete L.skip[v]; queueLog(dkey(new Date())); break; }
    case 'water': { const L = dl(TODAY); L.water = L.water === +v ? +v - 1 : +v; queueLog(dkey(new Date())); break; }
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
window.HissatiApp = { state: () => S, poll, flush };     // للاختبارات
boot();
})();
