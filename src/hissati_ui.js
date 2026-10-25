// ================= «حصتي»: ربط «حصة» بتطبيق العميل عبر المحطة الوسيطة (يُدمج داخل app.js عند /*HXUI*/)
// الأخصائي يدعو العميل برابط (واتساب) ← العميل يسجّل بياناته في «حصتي» ← تصل هنا «طلب عميل» فيعتمده الأخصائي كعميل جديد
// ← تُرسل الخطة إلى جوال العميل ← تعود المتابعة اليومية والوزن والتفضيلات والمحادثة إلى ملف العميل هنا.
// كل ما يمر بالمحطة مشفّر من طرف إلى طرف (HXC: ECDH + AES-GCM) وكل طلب موقَّع؛ ورمز الدعوة سرّ مشترك داخل كل رسالة فلا تستطيع المحطة انتحال أي طرف.
// التخزين: meta.hx (هوية هذا الجهاز ومفاتيحه الخاصة، الدعوات، الطلبات) مشفّر مثل باقي البيانات؛ وبيانات «حصتي» لكل عميل في c.hx (تدخل النسخة الاحتياطية).
var HX = { st: null, loaded: false, busy: false, err: '', form: false, last: null, timer: 0, every: 60000 }, HXC0 = window.HXC;
var HX_DAYS = [[1, 'يوم واحد'], [3, '3 أيام'], [7, 'أسبوع'], [14, 'أسبوعان'], [30, 'شهر']];
function hxDef() { return eff().hx || {}; }
function hxOn() { return !!(HX.st && HX.st.reg && HX.st.ident); }
function hxRelay() { return String((HX.st && HX.st.relay) || hxDef().relay || '').trim().replace(/\/+$/, ''); }
function hxUrlOk(u) { return /^https:\/\/[^\s/?#]+(\/[^\s?#]*)?$/i.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s?#]*)?$/i.test(u); }
function hxLoad() {
  return tx('meta', 'readonly', function (s) { return s.get('hx'); }).then(function (r) { return r ? decRec('meta', r) : null; }).then(function (r) {
    HX.st = Object.assign({ key: 'hx', relay: '', name: '', cc: '966', after: 0, inv: {}, reqs: {} }, r || {}); HX.loaded = true; hxTimer();
  }).catch(function () { HX.st = { key: 'hx', relay: '', name: '', cc: '966', after: 0, inv: {}, reqs: {} }; HX.loaded = true; });
}
function hxSave() { saveQ = saveQ.then(function () { return dbPut('meta', HX.st); }).catch(function () { }); return saveQ; }
function hxTimer() { clearInterval(HX.timer); if (hxOn()) { HX.timer = setInterval(function () { if (document.visibilityState !== 'hidden') hxPoll(); }, HX.every); setTimeout(hxPoll, 400); hxPushSetup(false); } }
// ---------- إشعارات المتصفح للأخصائي (موقع «حصة» على الإنترنت فقط؛ عامل الخدمة sw.js يأتي مع «تصدير موقع للنشر»)
var HXP = { reg: null, err: 0 };
function hxPushOk() { return (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !(window.HNative && HNative.isNative()); }
function hxPushState() { if (!hxPushOk()) return 'na'; if (Notification.permission === 'denied') return 'denied'; return Notification.permission === 'granted' && HX.st && HX.st.pushEp ? 'on' : 'off'; }
function hxSw() {
  if (!HXP.reg) { HXP.reg = navigator.serviceWorker.register('sw.js').catch(function () { return null; }); navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.t === 'hxpush') hxPoll(); }); }
  return HXP.reg;
}
function hxPushSetup(ask) {
  if (!hxOn() || !hxPushOk()) return Promise.resolve(hxPushState());
  var reg; HXP.err = 0;
  return (Notification.permission === 'default' && ask ? Notification.requestPermission() : Promise.resolve(Notification.permission)).then(function (perm) {
    if (perm !== 'granted') return null;
    return hxSw().then(function (r) { if (!r) throw new Error('sw'); reg = r; return navigator.serviceWorker.ready; }).then(function () { return reg.pushManager.getSubscription(); }).then(function (sub) {
      return sub || hxFetch('GET', '/v1/push/key').then(function (k) { return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: HXC0.unb64u(k.key) }); });
    }).then(function (sub) {
      if (sub.endpoint === HX.st.pushEp && HX.st.pushAt && Date.now() - HX.st.pushAt < 7 * 86400000) return;
      return hxFetch('POST', '/v1/push/sub', { ep: sub.endpoint }, true).then(function () { HX.st.pushEp = sub.endpoint; HX.st.pushAt = Date.now(); return hxSave(); });
    });
  }).catch(function () { HXP.err = 1; }).then(function () { return hxPushState(); });
}
function hxNotifRow(compact) {
  var st = hxPushState();
  if (st === 'on') return compact ? '' : '<p class="small">🔔 إشعارات المتصفح مفعّلة: يصلك طلب العميل الجديد ورسائله حتى وموقع «حصة» مغلق.</p>';
  if (st === 'na') return compact ? '' : '<p class="small">🔔 إشعارات المتصفح تعمل من موقع «حصة» على الإنترنت (https) فقط، لا من ملف على الجهاز.</p>';
  if (st === 'denied') return '<div class="warn">🔕 إشعارات «حصة» محظورة في هذا المتصفح. فعّلها من إعدادات الموقع ← الإشعارات ← السماح.</div>';
  return '<div class="warn hxnotif">🔔 فعّل إشعارات المتصفح ليصلك طلب العميل الجديد ورسائله حتى والموقع مغلق.' + (HXP.err ? ' (تعذّر التفعيل؛ تأكد أن الموقع صُدّر من الإصدار 0.27 أو أحدث)' : '') + ' <button class="sm" data-a="hxNotif">تفعيل الإشعارات</button></div>';
}
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && hxOn() && (!HX.last || Date.now() - HX.last > 20000)) hxPoll(); });
function hxFetch(method, path, obj, signed) {
  var base = hxRelay(); if (!hxUrlOk(base)) return Promise.reject(new Error('اكتب عنوان المحطة (https://…) في الإعدادات ← حصتي'));
  var body = obj === undefined ? '' : JSON.stringify(obj), h = { 'content-type': 'application/json' };
  return (signed ? HXC0.signReq(HX.st.ident, method, path, body).then(function (a) { h.authorization = a; }) : Promise.resolve()).then(function () {
    return fetch(base + path, { method: method, headers: h, body: method === 'POST' ? body : undefined, cache: 'no-store' });
  }).catch(function () { throw new Error('تعذّر الاتصال بالمحطة — تحقق من الإنترنت والعنوان'); }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error((j.error || ('خطأ من المحطة (' + r.status + ')')) + (j.code === 'clock' ? ' — اضبط تاريخ ووقت الجهاز تلقائياً' : '')); e.code = j.code; e.status = r.status; throw e; } return j; });
  });
}
// ---------- الهوية والتسجيل
function hxRegister(relay, regKey, name) {
  HX.st.relay = relay; HX.st.name = name;
  return (HX.st.ident ? Promise.resolve(HX.st.ident) : HXC0.genIdentity()).then(function (id) {
    HX.st.ident = id; return hxFetch('POST', '/v1/register', { sigPub: id.sigPub, encPub: id.encPub, name: name, regKey: regKey || '' }, true);
  }).then(function (j) { HX.st.reg = 1; HX.st.did = j.id; return hxSave(); }).then(hxTimer);
}
// ---------- قوائم النظام التي يختار منها العميل (تُرفق بالدعوة؛ بيانات عامة لا بيانات شخصية)
function hxForm(sys) { return HForms.normalize(((eff().forms || {})[sys]), sys); }   // الاستبيان المعتمد (إعدادات «الاستبيانات»)
function hxCat(sys) {
  var b = BR();
  if (sys === 'g') {                                                 // نظام الجرامات: أغذيته وفئاتها، والمراحل وأنواع الأيام
    var AD = window.ATHLETE, fc = [], fi = {}; AD.foods.forEach(function (f) { if (fi[f.g] === undefined) { fi[f.g] = fc.length; fc.push(f.g); } });
    return { v: 1, sys: 'g', dname: HX.st.name, clinic: b.clinic || '', days: D.days, form: hxForm('g'), fcats: fc, foods: AD.foods.filter(function (f) { return !f.hidden; }).map(function (f) { return [f.n, fi[f.g]]; }),
      phases: AD.phases.map(function (x) { return x.n; }), dayTypes: AD.dayTypes.map(function (x) { return x.n; }), conditions: D.conditions.slice(), allergens: D.allergens.map(function (a) { return a.label; }) };
  }
  return {
    v: 1, sys: 'ex', form: hxForm('ex'), dname: HX.st.name, clinic: b.clinic || '', groups: D.groups, days: D.days,
    bank: D.bank.filter(function (x) { return x.on; }).map(function (x) { return [x.n, x.m, ((x.ing || [])[0] || {}).n || '']; }),
    foods: D.foods.filter(function (f) { return f.on !== 0; }).map(function (f) { return [f.n, f.g]; }),
    conditions: D.conditions.slice(), allergens: D.allergens.map(function (a) { return a.label; }),
    activity: D.settings.activity.map(function (a) { return a[0]; }), goals: D.settings.goals.map(function (g) { return g[0]; })
  };
}
function hxPhone(p) { p = String(p || '').replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x6F0; }).replace(/[^\d+]/g, ''); if (!p) return ''; if (p.charAt(0) === '+') return p.slice(1); if (p.slice(0, 2) === '00') return p.slice(2); var cc = String(HX.st.cc || '966').replace(/\D/g, ''); return p.charAt(0) === '0' ? cc + p.slice(1) : (p.indexOf(cc) === 0 ? p : cc + p); }
function hxLink(inv) { return hxRelay() + '/#t=' + inv.tok + '.' + inv.fp; }
function hxWaText(inv) { return 'مرحباً ' + inv.label + '،\nأرسل لك ' + (HX.st.name || 'أخصائي التغذية') + ' رابط تطبيق «حصتي» لتسجيل بياناتك واستلام خطتك الغذائية على جوالك:\n' + hxLink(inv) + '\n\nالرابط شخصي ويُستعمل مرة واحدة، وصالح حتى ' + new Date(inv.exp * 1000).toLocaleDateString('ar') + '.'; }
function hxWa(inv) { var p = hxPhone(inv.phone); return 'https://wa.me/' + (p || '') + '?text=' + encodeURIComponent(hxWaText(inv)); }
function hxInvite(label, phone, days, sys) {
  var tok = HXC0.token(), exp = Math.floor(Date.now() / 1000) + days * 86400, h;
  return Promise.all([HXC0.tokenHash(tok), HXC0.fpOf(HX.st.ident.encPub)]).then(function (r) {
    h = r[0]; HX.st.inv[h] = { tok: tok, fp: r[1], label: label, phone: phone, exp: exp, at: Date.now(), sys: sys === 'g' ? 'g' : 'ex' };
    return hxFetch('POST', '/v1/invites', { h: h, label: label, exp: exp, cat: hxCat(sys) }, true);
  }).then(function () { return hxSave(); }).then(function () { return HX.st.inv[h]; }).catch(function (e) { delete HX.st.inv[h]; throw e; });
}
// ---------- الإرسال للعميل (مشفّر لمفتاحه، ومعه السر المشترك)
var HX_PUSH = ['plan', 'msg', 'status', 'health'];             // ما يصل العميلَ إشعاراً على جواله (علامات القراءة تصل بصمت)
function hxSendTo(cid, enc, tok, payload) {
  payload.a = tok; payload.ts = payload.ts || Date.now();
  return HXC0.seal(enc, payload).then(function (box) { return hxFetch('POST', '/v1/send', { to: cid, box: box, push: HX_PUSH.indexOf(payload.t) >= 0 }, true); });
}
function hxSend(c, payload) { return hxSendTo(c.hx.cid, c.hx.enc, c.hx.tok, payload); }
function hxClientOf(cid) { return S.clients.filter(function (c) { return c.hx && c.hx.cid === cid; })[0]; }
// ---------- الاستقبال
function hxPoll() {
  if (!hxOn() || HX.busy) return Promise.resolve(0);
  HX.busy = true; var got = 0, touched = {}, maxId = HX.st.after || 0;
  return hxFetch('GET', '/v1/inbox?after=' + (HX.st.after || 0), undefined, true).then(function (j) {
    return j.msgs.reduce(function (p, m) {
      return p.then(function () { maxId = Math.max(maxId, m.id); return hxHandle(m, touched); }).then(function (n) { got += n || 0; }).catch(function () { });
    }, Promise.resolve()).then(function () { return j.msgs.length; });
  }).then(function (n) {
    HX.err = ''; HX.last = Date.now(); HX.st.after = maxId;
    Object.keys(touched).forEach(function (k) { var c = S.clients.filter(function (x) { return x.code === k; })[0]; if (c) persist(c); });
    return hxSave().then(function () { return n ? hxFetch('POST', '/v1/ack', { upTo: maxId }, true).catch(function () { }) : 0; });
  }).catch(function (e) { HX.err = e.message; HX.last = Date.now(); }).then(function () {
    HX.busy = false; if (got) { var c = cur(); if (S.view === 'hx' || (c && S.tab === 'hx')) hxRe(); hxRail(); }
    return got;
  });
}
function hxHandle(m, touched) {
  var st = HX.st;
  if (m.kind === 'join') {                                       // رسالة نظام من المحطة: انضمّ عميل عبر دعوة (بلا بيانات شخصية)
    var b = m.body || {}, inv = st.inv[b.inv]; if (!inv || st.reqs[b.cid]) return 0;
    inv.used = b.cid; st.reqs[b.cid] = { cid: b.cid, sigPub: b.sigPub, encPub: b.encPub, label: inv.label || b.label, phone: inv.phone, h: b.inv, at: m.ts * 1000, st: 'join', msgs: [] };
    return 0;
  }
  if (m.kind !== 'e') return 0;
  var req = st.reqs[m.from], c = req ? null : hxClientOf(m.from), tok = req ? (st.inv[req.h] || {}).tok : c && c.hx.tok, enc = req ? req.encPub : c && c.hx.enc;
  if (!tok) return 0;
  return HXC0.open(st.ident, m.body).then(function (p) {
    if (!p || p.a !== tok) return 0;                              // ليست من صاحب الدعوة: تُهمل
    if (req) return hxReq(req, p, enc);
    touched[c.code] = 1; return hxIn(c, p);
  });
}
function hxReq(req, p, enc) {                                     // قبل الاعتماد: بيانات التسجيل والمحادثة فقط
  if (p.t === 'intake') {
    return HXC0.fpOf(enc).then(function (fp) {
      if (p.fp !== fp || !p.p || !String(p.p.name || '').trim()) return 0;
      req.intake = p.p; req.st = 'new'; req.at = p.ts || Date.now(); toast('📲 طلب جديد من «حصتي»: ' + p.p.name); return 1;
    });
  }
  if (p.t === 'msg' && p.text) { req.msgs = (req.msgs || []).concat([{ from: 'c', t: String(p.text).slice(0, 2000), ts: p.ts, ctx: p.ctx || '' }]).slice(-200); req.unread = (req.unread || 0) + 1; toast('💬 ' + (req.intake ? req.intake.name : req.label) + ': ' + String(p.text).slice(0, 60)); return 1; }
  if (p.t === 'rq') { var q0 = hxQuiz(p); if (!q0) return 0; req.quiz = q0; toast('🧭 ' + ((req.intake || {}).name || req.label) + ' أجاب على أسئلة اختيار النظام'); return 1; }
  return 0;
}
// إجابات «اختيار النظام» من «حصتي»: تُنقّى المفاتيح، ويُقبل الاختيار فقط إن كان نظاماً موجوداً في المكتبة
function hxQuiz(p) {
  if (!p.ans || typeof p.ans !== 'object') return null; var a = {}, keys = ['goal', 'region', 'cond', 'concern', 'veg', 'style', 'cut', 'train', 'why', 'prev', 'last', 'act', 'routine', 'sex', 'age', 'wt', 'ht'];
  keys.forEach(function (k) { var v = p.ans[k]; if (v == null) return; a[k] = Array.isArray(v) ? v.map(String).slice(0, 10) : typeof v === 'number' ? v : String(v).slice(0, 20); });
  var ok = function (id) { return id && (!window.RL || !RL.idx || RL.plan(id)); };
  return { ans: a, pick: ok(p.pick) ? String(p.pick) : '', top: (p.top || []).filter(ok).slice(0, 3), at: p.ts || Date.now() };
}
function hxIn(c, p) {                                              // بعد الاعتماد: المتابعة اليومية، الوزن، التفضيلات، الصحة، المحادثة
  var x = c.hx, nm = c.name || x.label || '';
  if (p.t === 'log' && /^\d{4}-\d{2}-\d{2}$/.test(p.d)) {
    x.logs = x.logs || {}; x.logs[p.d] = { dow: p.dow, pv: p.pv, ck: p.ck || {}, sw: p.sw || {}, note: p.note || {}, skip: p.skip || {}, water: +p.water || 0, done: +p.done || 0, n: +p.n || 0, ts: p.ts, h: p.h && typeof p.h === 'object' && JSON.stringify(p.h).length < 2000 ? p.h : {}, hs: Array.isArray(p.hs) ? p.hs.slice(0, 12).map(String) : [] };
    var ks = Object.keys(x.logs).sort(); if (ks.length > 90) ks.slice(0, ks.length - 90).forEach(function (k) { delete x.logs[k]; });
    return 0;                                                       // المتابعة تُحدَّث بصمت (بلا إشعار لكل لمسة)
  }
  if (p.t === 'weight' && +p.w > 20 && +p.w < 400) { x.weights = (x.weights || []).concat([[p.ts || Date.now(), Math.round(+p.w * 10) / 10]]).slice(-200); c.weight = Math.round(+p.w * 10) / 10; toast('⚖ ' + nm + ' سجّل وزنه: ' + c.weight + ' كجم'); return 1; }
  if (p.t === 'prefs' && p.food) {                                  // ما لا يحبه العميل يُضاف تلقائياً إلى «يتجنبها»، وما يحبه إلى «المفضلة»
    var no = [], lv = []; Object.keys(p.food).forEach(function (f) { if (p.food[f] === 'no') no.push(f); else if (p.food[f] === 'love') lv.push(f); });
    var was = (x.prefs && x.prefs.food) || {}, add = no.filter(function (f) { return (c.avoid || []).indexOf(f) < 0; });
    c.avoid = (c.avoid || []).filter(function (f) { return !(was[f] === 'no' && p.food[f] !== 'no'); }).concat(add);
    c.love = (c.love || []).filter(function (f) { return !(was[f] === 'love' && p.food[f] !== 'love') && no.indexOf(f) < 0; }).concat(lv.filter(function (f) { return (c.love || []).indexOf(f) < 0; }));
    x.prefs = { food: p.food, like: p.like || {}, nope: p.nope || {} }; x.prefLog = (x.prefLog || []).concat((p.changes || []).map(function (q) { return { t: q.t, f: q.f, n: q.n, ts: p.ts }; })).slice(-100);
    if (add.length) toast('🚫 ' + nm + ': أُضيف إلى «يتجنبها» — ' + add.slice(0, 3).join('، ')); return 1;
  }
  if (p.t === 'health') { x.health = { cond: (p.cond || []).filter(function (k) { return D.conditions.indexOf(k) >= 0; }), allg: p.allg || [], note: String(p.note || '').slice(0, 500), at: p.ts }; toast('🩺 ' + nm + ' يطلب تعديل حالته الصحية'); return 1; }
  if (p.t === 'msg' && p.text) { x.msgs = (x.msgs || []).concat([{ from: 'c', t: String(p.text).slice(0, 2000), ts: p.ts, ctx: String(p.ctx || '').slice(0, 120) }]).slice(-300); x.unread = (x.unread || 0) + 1; toast('💬 ' + nm + ': ' + String(p.text).slice(0, 60)); return 1; }
  if (p.t === 'read') { (x.msgs || []).forEach(function (q) { if (q.from === 'd' && q.ts <= p.upTo) q.read = 1; }); return 0; }
  if (p.t === 'rq') { var q = hxQuiz(p); if (!q) return 0; x.quiz = q; if (RDS && RDS.ans) delete RDS.ans[c.code]; toast('🧭 ' + nm + (q.pick && window.RL ? ' اختار من المكتبة: ' + RL.label(RL.plan(q.pick)) : ' أجاب على أسئلة اختيار النظام')); return 1; }
  return 0;
}
// عادات العميل من «حصتي» (ملخص اليوم في المتابعة): ✓ ما أنجزه من العادات التي يتابعها
var HX_NEW = function (ic, nm, fmt, ok) { return [ic, function (v) { return fmt(v); }, ok]; };
var HX_HB = { adhkarPm: ['🌙', function (v) { var n = ((v && v.c) || []).reduce(function (a, x) { return a + (+x || 0); }, 0); return n >= 259 ? 'أذكار المساء' : 'أذكار المساء ' + Math.round(n / 259 * 100) + '%'; }, function (v) { return ((v && v.c) || []).reduce(function (a, x) { return a + (+x || 0); }, 0) >= 259; }],
  social: HX_NEW('📵', '', function (v) { return v ? 'يوم بلا سوشيال ميديا' : 'تصفّح'; }, function (v) { return v === 1; }), sunset: HX_NEW('📴', '', function (v) { return v ? 'شاشات مطفأة قبل النوم' : 'سهر مع الشاشة'; }, function (v) { return v === 1; }),
  gratitude: HX_NEW('🌸', '', function (v) { return v + '/3 نعم'; }, function (v) { return v >= 3; }), sunlight: HX_NEW('☀️', '', function (v) { return v + ' د شمس'; }, function (v) { return v >= 15; }), breaks: HX_NEW('⏱', '', function (v) { return v + ' فواصل حركة'; }, function (v) { return v >= 5; }),
  reading: HX_NEW('📖', '', function (v) { return v + ' د قراءة'; }, function (v) { return v >= 10; }), meds: HX_NEW('💊', '', function (v) { return v ? 'الدواء في موعده' : 'تأخر عن دوائه'; }, function (v) { return v === 1; }), stretch: HX_NEW('🧘', '', function (v) { return v + ' د تمدّد'; }, function (v) { return v >= 5; }), postwalk: HX_NEW('🚶', '', function (v) { return v + ' مشي بعد الوجبة'; }, function (v) { return v >= 1; }),
  adhkar: ['📿', function (v) { var n = ((v && v.c) || []).reduce(function (a, x) { return a + (+x || 0); }, 0); return n >= 254 ? 'أذكار الصباح' : 'أذكار الصباح ' + Math.round(n / 254 * 100) + '%'; }, function (v) { return ((v && v.c) || []).reduce(function (a, x) { return a + (+x || 0); }, 0) >= 254; }], steps: ['🚶', function (v) { return v + ' خطوة'; }, function (v) { return v >= 8000; }], sleep: ['😴', function (v) { return v + ' س نوم'; }, function (v) { return v >= 7 && v <= 9; }], veg: ['🥗', function (v) { return v + '/5 خضار وفاكهة'; }, function (v) { return v >= 5; }],
  sugar: ['🍬', function (v) { return v ? 'بلا سكر' : 'تناول سكراً'; }, function (v) { return v === 1; }], move: ['⚡', function (v) { return v + ' د نشاط'; }, function (v) { return v >= 30; }], breath: ['🫧', function (v) { return v + ' جلسة تنفّس'; }, function (v) { return v >= 1; }],
  mindful: ['🍽', function (v) { return (v || []).length + ' وجبات بوعي'; }, function (v) { return (v || []).length >= 2; }], kitchen: ['🌙', function (v) { return v ? 'المطبخ مغلق ليلاً' : 'أكل بعد العشاء'; }, function (v) { return v === 1; }], coffee: ['☕', function (v) { return v + ' كوب قهوة'; }, function (v) { return v <= 3; }] };
function hxHabits(l) { var h = l.h || {}; return Object.keys(h).filter(function (k) { return HX_HB[k] && h[k] != null; }).map(function (k) { var d = HX_HB[k]; return (d[2](h[k]) ? '✓' : '✗') + d[0] + ' ' + d[1](h[k]); }).join(' • '); }
// ---------- الاعتماد: الطلب ← عميل جديد في «حصة»
function hxMap(q) {
  var food = q.food || {}, flat = function (o) { return ['B', 'L', 'D', 'S'].reduce(function (a, k) { return a.concat((o || {})[k] || []); }, []); }, act = D.settings.activity[+q.act] || D.settings.activity[2], goal = D.settings.goals[+q.goal] || D.settings.goals[2];
  var nums = function (v, lo, hi, d) { v = +v; return v >= lo && v <= hi ? v : d; }, al = D.allergens.map(function (a) { return a.label; });
  var notes = [q.meds ? 'الأدوية والمكملات: ' + q.meds : '', q.notes ? 'ملاحظات العميل: ' + q.notes : '', 'الاستيقاظ ' + (q.wake || '—') + ' • النوم ' + (q.sleep || '—') + (q.wdays && q.wdays.length ? ' • التمرين: ' + q.wdays.map(function (i) { return D.days[i]; }).join('، ') : ''), 'سُجّل من «حصتي» ' + new Date().toLocaleDateString('ar')].filter(Boolean).join('\n');
  return {
    name: String(q.name || '').trim().slice(0, 80), phone: String(q.phone || '').slice(0, 30), sex: q.sex === 'أنثى' ? 'أنثى' : 'ذكر', age: nums(q.age, 5, 110, 30), weight: nums(q.weight, 20, 400, 80), height: nums(q.height, 80, 250, 170),
    activity: act[0], goal: goal[0], meals: nums(q.nmeals, 3, 6, 5), conditions: (q.cond || []).filter(function (k) { return D.conditions.indexOf(k) >= 0; }), allergens: (q.allg || []).filter(function (k) { return al.indexOf(k) >= 0; }),
    love: Object.keys(food).filter(function (f) { return food[f] === 'love'; }), avoid: Object.keys(food).filter(function (f) { return food[f] === 'no'; }), favMeals: flat(q.like), excludedMeals: flat(q.nope), notes: notes
  };
}
function hxQA(q) { return (q.qa || []).filter(function (x) { return Array.isArray(x) && x[0] && x[1]; }).map(function (x) { return [String(x[0]).slice(0, 160), String(x[1]).slice(0, 600)]; }); }
function hxMapG(q) {                                                // استبيان نظام الجرامات ← عميل نظام الجرامات
  var AD = window.ATHLETE, food = q.food || {}, nums = function (v, lo, hi, d) { v = +v; return v >= lo && v <= hi ? v : d; }, types = AD.dayTypes.map(function (x) { return x.n; }), fn = AD.foods.map(function (f) { return f.n; });
  var sch = Array.isArray(q.sched) && q.sched.length === 7 ? q.sched.map(function (x) { var t = types.indexOf(x && x.type) >= 0 ? x.type : types[0]; return { type: t, min: t === types[0] ? 0 : nums(x.min, 0, 600, 60), time: /^\d{2}:\d{2}$/.test(x.time || '') ? x.time : '' }; }) : null;
  var notes = [(q.cond || []).length || (q.allg || []).length ? 'الحالة الصحية والحساسية: ' + (q.cond || []).concat(q.allg || []).join('، ') : '', q.meds ? 'الأدوية: ' + q.meds : '', q.supp ? 'المكملات: ' + q.supp : '', q.notes ? 'ملاحظات العميل: ' + q.notes : '',
    'الاستيقاظ ' + (q.wake || '—') + ' • النوم ' + (q.sleep || '—'), hxQA(q).length ? 'إجابات الاستبيان:\n' + hxQA(q).map(function (x) { return '• ' + x[0] + ': ' + x[1]; }).join('\n') : '', 'سُجّل من «حصتي» ' + new Date().toLocaleDateString('ar')].filter(Boolean).join('\n');
  var o = { name: String(q.name || '').trim().slice(0, 80), phone: String(q.phone || '').slice(0, 30), sex: q.sex === 'أنثى' ? 'أنثى' : 'ذكر', age: nums(q.age, 5, 110, 28), weight: nums(q.weight, 20, 400, 80), height: nums(q.height, 80, 250, 175), bf: nums(q.bf, 3, 70, '') ,
    sport: String(q.sport || '').slice(0, 60), love: Object.keys(food).filter(function (f) { return food[f] === 'love' && fn.indexOf(f) >= 0; }), avoid: Object.keys(food).filter(function (f) { return food[f] === 'no' && fn.indexOf(f) >= 0; }), notes: notes };
  if (AD.phases.some(function (x) { return x.n === q.gphase; })) o.phase = q.gphase; if (sch) o.schedule = sch;
  return o;
}
function hxApprove(cid) {
  var req = HX.st.reqs[cid]; if (!req || !req.intake) return Promise.resolve();
  var g = req.intake.sys === 'g', c = newClient(g ? 'ath' : ''); Object.assign(c, g ? hxMapG(req.intake) : hxMap(req.intake));
  if (g && +req.intake.nmeals >= 2 && typeof athSetMealCount === 'function') athSetMealCount(c, Math.min(8, +req.intake.nmeals));
  if (!g && hxQA(req.intake).length) c.notes += '\nإجابات الاستبيان:\n' + hxQA(req.intake).map(function (x) { return '• ' + x[0] + ': ' + x[1]; }).join('\n');
  c.hx = { cid: cid, enc: req.encPub, tok: HX.st.inv[req.h].tok, label: req.label, msgs: req.msgs || [], unread: req.unread || 0, logs: {}, weights: [[Date.now(), c.weight]], prefLog: [], prefs: { food: req.intake.food || {}, like: req.intake.like || {}, nope: req.intake.nope || {} }, intake: req.intake, planV: 0, since: Date.now(), quiz: req.quiz || null };
  S.clients.push(c);
  return persist(c).then(function () { return hxSend(c, { t: 'status', st: 'approved', code: c.code, dname: HX.st.name }); }).then(function () {
    delete HX.st.reqs[cid]; delete HX.st.inv[req.h]; return hxSave();
  }).then(function () { S.view = 'client'; S.cur = c.code; S.tab = 'client'; S.versions = []; render(); toast('✓ اعتُمد «' + c.name + '» عميلاً جديداً (' + c.code + ') — راجع بياناته ثم ولّد الخطة وأرسلها إلى «حصتي»'); });
}
// ---------- لقطة الخطة لتطبيق العميل (نفس شكل نموذج «حصتي»: [مجموعة، صنف، نص، بدائل[[صنف، نص]]])
function hxSnap(c) {
  var p = c.plan, T = p.targets || {}, av = c.avoid || [];
  return {
    kcal: Math.round(T.kcal || 0), pro: Math.round(T.pro || 0), cho: Math.round(T.cho || 0), fat: Math.round(T.fat || 0), water: Math.round((T.water || 0) * 100) / 100, groups: D.groups,
    dayNames: p.days.map(function (d, i) { return dayName(p, i); }),
    days: p.days.map(function (d) {
      return { slots: d.slots.map(function (s) {
        return { name: mealNm(p, s), type: s.type, time: s.time || '', kcal: Math.round(s.kcal || 0), meal: s.mealLabel || s.meal || '', lines: s.lines.map(function (l) {
          var alts = []; try { alts = E.alternatives(l, s.type, p, D, 10).filter(function (a) { return av.indexOf(a.name) < 0; }).slice(0, 6).map(function (a) { return [a.name, a.text]; }); } catch (e) { }
          return [l.g, l.name, l.label || l.text, alts];
        }) };
      }) };
    })
  };
}
// لقطة خطة نظام الجرامات: نفس شكل «حصتي» مع أهداف كل يوم، والسطر = [فئة، صنف، «الجرامات + المقياس المنزلي»، بدائل بجرامات تعادل الماكرو الرئيسي]
function hxSnapG(c) {
  var AD = window.ATHLETE, p = c.plan, cats = [], ci = {}, av = c.avoid || [], ex = ec(c), by = Ath.index(AD), r = function (x) { return Math.round(x || 0); };
  var cat = function (n) { var f = AD.foods.filter(function (x) { return x.n === n; })[0], g = (f && f.g) || 'أخرى'; if (ci[g] === undefined) { ci[g] = cats.length; cats.push(g); } return ci[g]; };
  var txt = function (it, g) { var hm = window.AthImport && AthImport.hmText(it.hm, g); return g + ' جم ' + (it.label || it.n) + (hm ? ' (' + hm + ')' : ''); };
  var days = p.days.map(function (d) {
    return { type: d.t.type, kcal: r(d.t.kcal), p: r(d.t.p), c: r(d.t.c), f: r(d.t.f), water: Math.round(d.t.water * 10) / 10, slots: d.meals.map(function (m) {
      var s = Ath.sum(m.items);
      return { name: mealNm(p, { si: m.si, name: m.name }), type: Ath.mealType(m.name), time: m.time || '', kcal: r(s.k), meal: 'بروتين ' + r(s.p) + ' • كارب ' + r(s.c) + ' • دهون ' + r(s.f) + ' جم', lines: m.items.map(function (it) {
        var alts = []; try { alts = Ath.alts(AD, ex, it, m.type).filter(function (f) { return av.indexOf(f.n) < 0; }).slice(0, 6).map(function (f) { var g = Ath.swapGrams(AD, it, by[f.id] || f); return [f.n, txt(f, g)]; }); } catch (e) { }
        return [cat(it.n), it.label || it.n, txt(it, it.g), alts];
      }) };
    }) };
  });
  var T0 = p.days[0].t;
  return { sys: 'g', kcal: r(T0.kcal), pro: r(T0.p), cho: r(T0.c), fat: r(T0.f), water: Math.round(T0.water * 10) / 10, groups: cats, dayNames: p.days.map(function (d, i) { return dayName(p, i); }), days: days };
}
// ---------- الواجهة
function hxCounts() {
  var r = HX.st ? Object.keys(HX.st.reqs).map(function (k) { return HX.st.reqs[k]; }) : [];
  return { req: r.filter(function (q) { return q.st === 'new'; }).length, msg: S.clients.reduce(function (a, c) { return a + ((c.hx && c.hx.unread) || 0) + (c.hx && c.hx.health ? 1 : 0); }, 0) + r.reduce(function (a, q) { return a + (q.unread || 0); }, 0) };
}
function hxBadge() { var n = hxCounts(), t = n.req + n.msg; document.title = (t ? '(' + t + ') ' : '') + 'حصة — Hissa'; return t; }
function hxRail() { var t = hxBadge(), b = document.querySelector('[data-a="hxv"] em'); if (b) { b.textContent = t || ''; b.style.display = t ? '' : 'none'; } }
function hxAgo(ts) { if (!ts) return '—'; var m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'الآن' : m < 60 ? 'قبل ' + m + ' د' : m < 1440 ? 'قبل ' + Math.round(m / 60) + ' س' : new Date(ts).toLocaleDateString('ar'); }
function hxSetPage() {
  var st = HX.st || {}, d = hxDef(), on = hxOn(), relay = hxRelay(), admin = S.mode === 'admin';
  return '<h3>📲 «حصتي» — تطبيق العميل</h3><p class="small">ادعُ عميلك برابط على واتساب: يسجّل بياناته وصحته وما يحب وما لا يحب في «حصتي» على جواله، فتصلك هنا طلباً تعتمده بضغطة، ثم تُرسل له خطته ويتابع يومه بلمسة. كل البيانات مشفّرة من جهازك إلى جواله؛ المحطة الوسيطة ترى نصاً مشفّراً فقط.</p>'
    + (on ? '<div class="ok">✓ متصل بالمحطة <b dir="ltr">' + esc(relay) + '</b> باسم «' + esc(st.name) + '». آخر تحقق: ' + hxAgo(HX.last) + (HX.err ? ' — <span style="color:#c0392b">' + esc(HX.err) + '</span>' : '') + '</div><p class="two"><button data-a="hxCheck">↻ تحقق الآن</button><button class="sec" data-a="hxv">طلبات «حصتي»</button></p>' + hxNotifRow(false)
      + '<div class="row"><div><label>رمز الدولة لروابط واتساب</label><input data-hx="cc" value="' + esc(st.cc || '966') + '" inputmode="numeric" dir="ltr"></div><div><label>اسمك كما يراه العميل</label><input data-hx="name" value="' + esc(st.name) + '"></div></div>'
      + '<p class="small">لتغيير المحطة أو نقل الربط إلى جهاز آخر: افصل هذا الجهاز ثم اربطه من جديد (العملاء المرتبطون يبقون مرتبطين بهذا الجهاز فقط).</p><button class="sec sm" data-a="hxUnlink">فصل هذا الجهاز</button>'
      : '<div class="ucard"><div class="row"><div><label>عنوان المحطة (Cloudflare Worker)</label><input id="hx_relay" dir="ltr" placeholder="https://hissati.example.workers.dev" value="' + esc(relay) + '"></div><div><label>مفتاح التسجيل (REG_KEY)</label><input id="hx_key" dir="ltr" type="password" autocomplete="off" value="' + esc(d.regKey || '') + '"></div><div><label>اسمك كما يراه العميل</label><input id="hx_name" value="' + esc(st.name || BR().specialist || firstName() || '') + '"></div></div>'
      + '<p><button data-a="hxReg">ربط هذا الجهاز بالمحطة</button></p>' + (HX.err ? '<div class="warn">' + esc(HX.err) + '</div>' : '') + '<p class="small">لا محطة بعد؟ اتبع «worker/relay/DEPLOY_AR.md» (حساب Cloudflare مجاني، 10 دقائق) ثم الصق العنوان والمفتاح هنا.' + (admin ? ' عند الربط يُحفظ العنوان والمفتاح في إعداداتك ويصلان المستخدمين مع «تصدير نسخة المستخدمين» التالي فيربطون أجهزتهم بضغطة.' : '') + '</p></div>');
}
function hxInvForm() {
  return '<div class="ucard hxform"><h3>دعوة عميل إلى «حصتي»</h3><div class="row"><div><label>اسم العميل</label><input id="hxi_l" maxlength="80" placeholder="مثال: سارة أحمد"></div><div><label>جوال العميل (للواتساب)</label><input id="hxi_p" type="tel" inputmode="tel" dir="ltr" placeholder="05xxxxxxxx"></div><div><label>نظام الخطة</label><select id="hxi_s"><option value="ex">نظام الحصص</option><option value="g">نظام الجرامات</option></select></div><div><label>صلاحية الرابط</label><select id="hxi_d">' + HX_DAYS.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === 7 ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div></div>'
    + '<p class="two"><button data-a="hxInvMake">إنشاء الرابط</button><button class="sec" data-a="hxInvForm">إلغاء</button></p></div>';
}
function hxInvCard(h, v) {
  var exp = v.exp * 1000 < Date.now();
  return '<div class="ucard hxinv' + (exp ? ' exp' : '') + '"><b>' + esc(v.label) + '</b> <small>' + (v.phone ? '<span dir="ltr">' + esc(v.phone) + '</span> • ' : '') + (exp ? 'انتهت صلاحيته' : 'صالح حتى ' + new Date(v.exp * 1000).toLocaleDateString('ar')) + ' • ' + (v.sys === 'g' ? 'نظام الجرامات' : 'نظام الحصص') + ' • لم يُفتح بعد</small>'
    + (exp ? '' : '<div class="hxlink" dir="ltr">' + esc(hxLink(v)) + '</div><p class="two"><a class="btn" href="' + esc(hxWa(v)) + '" target="_blank" rel="noopener" data-hxwa="1">💬 إرسال على واتساب</a><button class="sec" data-a="hxCopy" data-v="' + h + '">نسخ الرابط</button><button class="sec" data-a="hxInvDel" data-v="' + h + '">إلغاء الدعوة</button></p>')
    + (exp ? '<button class="sec sm" data-a="hxInvDel" data-v="' + h + '">حذف</button>' : '') + '</div>';
}
function hxReqCard(q) {
  var p = q.intake || {}, ml = function (o) { return ['B', 'L', 'D', 'S'].reduce(function (a, k) { return a.concat((o || {})[k] || []); }, []); }, food = p.food || {}, lv = Object.keys(food).filter(function (f) { return food[f] === 'love'; }), no = Object.keys(food).filter(function (f) { return food[f] === 'no'; });
  var act = (D.settings.activity[+p.act] || [''])[0], goal = (D.settings.goals[+p.goal] || [''])[0], bmi = p.weight && p.height ? (p.weight / Math.pow(p.height / 100, 2)).toFixed(1) : '—';
  var qa = hxQA(p), qaH = qa.length ? '<dt>إجابات الاستبيان</dt><dd>' + qa.map(function (x) { return '<div><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</div>'; }).join('') + '</dd>' : '';
  var qz = q.quiz, qpk = qz && qz.pick && window.RL && RL.idx && RL.plan(qz.pick); if (qz) qaH += '<dt>اختيار النظام</dt><dd class="hxqz">📲 ' + (qpk ? 'اختار من البنك: <b>' + esc(RL.label(qpk)) + '</b>' : 'أجاب الأسئلة وترك الاختيار لك') + '<br><small>بعد الاعتماد: «📗 ولّد خطة من البنك» يعرض اختياره مع الخطط الأنسب له</small></dd>';
  if (p.sys === 'g' && q.st !== 'join') {
    var tr = (p.sched || []).map(function (x, i) { return x && x.type && x.type !== 'راحة' ? D.days[i] + ': ' + x.type + (x.min ? ' ' + x.min + 'د' : '') + (x.time ? ' ' + x.time : '') : ''; }).filter(Boolean);
    return '<div class="ucard hxreq' + (q.st === 'changes' ? ' wait' : '') + '"><div class="hxrh"><span class="cav">' + esc(initial(p.name)) + '</span><div><b>' + esc(p.name) + '</b><small>' + (q.st === 'changes' ? 'طلبتَ تعديلاً — بانتظار العميل' : 'طلب جديد ' + hxAgo(q.at)) + ' • نظام الجرامات • دعوة «' + esc(q.label) + '»</small></div></div>'
      + '<dl class="hxkv"><dt>الجوال</dt><dd dir="ltr">' + esc(p.phone) + '</dd><dt>الجنس والعمر</dt><dd>' + esc(p.sex) + ' • ' + esc(p.age) + ' سنة</dd><dt>الوزن والطول</dt><dd>' + esc(p.weight) + ' كجم • ' + esc(p.height) + ' سم • BMI ' + bmi + (p.bf ? ' • دهون ' + esc(p.bf) + '%' : '') + '</dd>'
      + '<dt>الرياضة والهدف</dt><dd>' + (esc(p.sport) || '—') + ' • ' + (esc(p.gphase) || '—') + '</dd><dt>التدريب</dt><dd>' + (esc(tr.join(' • ')) || 'لا تدريب') + '</dd>'
      + '<dt>الحالة الصحية</dt><dd>' + (esc((p.cond || []).concat(p.allg || []).join('، ')) || 'لا حالات ولا حساسية') + '</dd>' + (p.meds ? '<dt>الأدوية</dt><dd>' + esc(p.meds) + '</dd>' : '') + (p.supp ? '<dt>المكملات</dt><dd>' + esc(p.supp) + '</dd>' : '') + (p.notes ? '<dt>ملاحظات</dt><dd>' + esc(p.notes) + '</dd>' : '')
      + '<dt>أصناف يحبها</dt><dd>' + (esc(lv.join('، ')) || '—') + '</dd><dt>لا يحبها</dt><dd>' + (esc(no.join('، ')) || '—') + '</dd><dt>يومه</dt><dd>' + esc(p.nmeals || 5) + ' وجبات • ' + esc(p.wake || '') + '–' + esc(p.sleep || '') + '</dd>' + qaH + '</dl>'
      + (q.st === 'new' ? '<p class="two"><button data-a="hxOk" data-v="' + q.cid + '">✓ اعتماد كعميل جديد (نظام الجرامات)</button><button class="sec" data-a="hxChg" data-v="' + q.cid + '">طلب تعديل</button><button class="sec" data-a="hxRej" data-v="' + q.cid + '">رفض</button></p>' : '') + hxMini(q) + '</div>';
  }
  if (q.st === 'join') return '<div class="ucard hxreq wait"><b>' + esc(q.label) + '</b> <small>فتح الرابط وأنشأ حسابه ' + hxAgo(q.at) + ' — يكمل التسجيل الآن…</small>' + hxMini(q) + '</div>';
  return '<div class="ucard hxreq' + (q.st === 'changes' ? ' wait' : '') + '"><div class="hxrh"><span class="cav">' + esc(initial(p.name)) + '</span><div><b>' + esc(p.name) + '</b><small>' + (q.st === 'changes' ? 'طلبتَ تعديلاً — بانتظار العميل' : 'طلب جديد ' + hxAgo(q.at)) + ' • دعوة «' + esc(q.label) + '»</small></div></div>'
    + '<dl class="hxkv"><dt>الجوال</dt><dd dir="ltr">' + esc(p.phone) + '</dd><dt>الجنس والعمر</dt><dd>' + esc(p.sex) + ' • ' + esc(p.age) + ' سنة</dd><dt>الوزن والطول</dt><dd>' + esc(p.weight) + ' كجم • ' + esc(p.height) + ' سم • BMI ' + bmi + '</dd><dt>النشاط والهدف</dt><dd>' + esc(act) + ' • ' + esc(goal) + '</dd>'
    + '<dt>الحالة الصحية</dt><dd>' + (esc((p.cond || []).concat(p.allg || []).join('، ')) || 'لا حالات ولا حساسية') + '</dd>' + (p.meds ? '<dt>الأدوية</dt><dd>' + esc(p.meds) + '</dd>' : '') + (p.notes ? '<dt>ملاحظات</dt><dd>' + esc(p.notes) + '</dd>' : '')
    + '<dt>وجبات يحبها</dt><dd>' + (esc(ml(p.like).join('، ')) || '—') + '</dd><dt>وجبات لا يريدها</dt><dd>' + (esc(ml(p.nope).join('، ')) || '—') + '</dd><dt>أصناف يحبها</dt><dd>' + (esc(lv.join('، ')) || '—') + '</dd><dt>لا يحبها</dt><dd>' + (esc(no.join('، ')) || '—') + '</dd>'
    + '<dt>يومه</dt><dd>' + esc(p.nmeals || 5) + ' وجبات • ' + esc(p.wake || '') + '–' + esc(p.sleep || '') + '</dd>' + qaH + '</dl>'
    + (q.st === 'new' ? '<p class="two"><button data-a="hxOk" data-v="' + q.cid + '">✓ اعتماد كعميل جديد</button><button class="sec" data-a="hxChg" data-v="' + q.cid + '">طلب تعديل</button><button class="sec" data-a="hxRej" data-v="' + q.cid + '">رفض</button></p>' : '') + hxMini(q) + '</div>';
}
function hxMini(q) {                                                // محادثة قبل الاعتماد
  if (!(q.msgs || []).length) return '';
  return '<details class="hxmini"' + (q.unread ? ' open' : '') + '><summary>💬 رسائل (' + q.msgs.length + ')' + (q.unread ? ' <em class="hxnb">' + q.unread + '</em>' : '') + '</summary>' + hxThread(q.msgs) + '<div class="hxcomp"><textarea data-hxr="' + q.cid + '" rows="1" placeholder="ردّك…"></textarea><button class="sm" data-a="hxReqMsg" data-v="' + q.cid + '">إرسال</button></div></details>';
}
function hxThread(msgs) {
  return '<div class="hxthread">' + (msgs || []).map(function (m) { return '<div class="hxb' + (m.from === 'd' ? ' me' : '') + '">' + (m.ctx ? '<small class="hxcx">بخصوص: ' + esc(m.ctx) + '</small>' : '') + esc(m.t) + '<small>' + new Date(m.ts).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) + (m.from === 'd' ? (m.read ? ' ✓✓' : ' ✓') : '') + '</small></div>'; }).join('') + '</div>';
}
function hxPage() {
  if (HX.loaded !== true) return '<p class="small">جارٍ التحميل…</p>';
  if (!hxOn()) return '<h2>📲 «حصتي»</h2>' + hxSetPage();
  var st = HX.st, reqs = Object.keys(st.reqs).map(function (k) { return st.reqs[k]; }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }), inv = Object.keys(st.inv).filter(function (h) { return !st.inv[h].used; });
  var linked = S.clients.filter(function (c) { return c.hx; }).sort(function (a, b) { return ((b.hx.unread || 0) - (a.hx.unread || 0)) || ((b.updated || 0) - (a.updated || 0)); });
  return '<div class="hxpage"><div class="hxtop"><h2>📲 طلبات «حصتي»</h2><p class="two"><button data-a="hxInvForm">+ دعوة عميل</button><button class="sec" data-a="hxCheck">↻ تحقق الآن</button></p></div>'
    + hxNotifRow(true) + '<p class="small">آخر تحقق: ' + hxAgo(HX.last) + ' • يُتحقق تلقائياً كل دقيقة أثناء فتح «حصة»' + (HX.err ? ' • <span style="color:#c0392b">' + esc(HX.err) + '</span>' : '') + '</p>'
    + (HX.form ? hxInvForm() : '') + (HX.made ? hxInvCard(HX.made, st.inv[HX.made] || {}).replace('hxinv', 'hxinv made') : '')
    + '<h3>طلبات العملاء (' + reqs.length + ')</h3>' + (reqs.map(hxReqCard).join('') || '<p class="small">لا طلبات الآن. ادعُ عميلاً برابط، وحين يكمل تسجيله يظهر طلبه هنا لتعتمده.</p>')
    + (inv.length ? '<h3>دعوات لم تُفتح (' + inv.length + ')</h3>' + inv.filter(function (h) { return h !== HX.made; }).map(function (h) { return hxInvCard(h, st.inv[h]); }).join('') : '')
    + (linked.length ? '<h3>عملاء على «حصتي» (' + linked.length + ')</h3><div class="hxlinked">' + linked.map(function (c) { var t = hxToday(c); return '<div class="cl" data-a="hxOpen" data-v="' + c.code + '"><span class="cav">' + esc(initial(c.name)) + '</span><b>' + esc(c.name) + (c.hx.unread || c.hx.health ? ' <em class="hxnb">' + ((c.hx.unread || 0) + (c.hx.health ? 1 : 0)) + '</em>' : '') + '</b><small>' + c.code + ' • ' + (c.hx.planV ? 'الخطة v' + c.hx.planV : 'لم تُرسل خطة') + (t ? ' • اليوم ' + t + '%' : '') + '</small></div>'; }).join('') + '</div>' : '')
    + '</div>';
}
function hxToday(c) { var d = new Date(), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), l = (c.hx.logs || {})[k]; return l && l.n ? Math.round(l.done / l.n * 100) : 0; }
function hxTab(c) {                                                // تبويب «حصتي» داخل ملف العميل
  var x = c.hx, ath = c.kind === 'athlete', logs = x.logs || {}, days = Object.keys(logs).sort().reverse().slice(0, 7), w = (x.weights || []).slice(-8);
  var adh = days.map(function (k) {
    var l = logs[k], pct = l.n ? Math.round(l.done / l.n * 100) : 0, extra = [];
    Object.keys(l.sw || {}).forEach(function (q) { extra.push('⇄ ' + l.sw[q]); }); Object.keys(l.note || {}).forEach(function (q) { extra.push('✎ ' + l.note[q]); }); Object.keys(l.skip || {}).forEach(function (q) { extra.push('⤼ تخطّى وجبة ' + (+q + 1)); });
    var hb = hxHabits(l); if (hb) extra.unshift(hb);
    return '<div class="hxday"><b>' + esc((D.days[l.dow] || '') + ' ' + k.slice(5)) + '</b><span class="hxbar"><i style="width:' + pct + '%"></i></span><span>' + pct + '%</span><small>💧 ' + (l.water * 0.25).toFixed(2).replace(/\.?0+$/, '') + ' ل</small>' + (extra.length ? '<small class="hxex">' + esc(extra.join(' • ')) + '</small>' : '') + '</div>';
  }).join('');
  return '<div class="hxtab"><div class="ucard"><div class="hxtop"><h3>📲 «حصتي» <small>مرتبط منذ ' + new Date(x.since || Date.now()).toLocaleDateString('ar') + ' • آخر تحقق ' + hxAgo(HX.last) + '</small></h3><button class="sec sm" data-a="hxCheck">↻ تحقق الآن</button></div>'
    + (!c.plan && c.planSrc !== 'ready' ? '<p class="small">ولّد الخطة (من البنك أو جديدة) من «بيانات العميل» ثم أرسلها من هنا.</p>' : '<p>' + (x.planV ? 'آخر خطة أُرسلت: v' + x.planV + ' ' + hxAgo(x.sentAt) + '. ' : '') + '<button data-a="hxSendPlan">' + (x.planV ? '↻ أرسل الخطة المحدَّثة إلى «حصتي»' : '➤ أرسل الخطة إلى «حصتي»') + '</button></p><p class="small">' + (ath ? 'تصل الخطة بالجرامات لكل يوم (حسب نوع التدريب) مع ماكروز كل وجبة وبدائل كل صنف بجرامات تعادل الماكرو الرئيسي.' : 'تصل الخطة بكل أيامها ووجباتها مع بدائل كل صنف من نفس المجموعة.') + ' ما لا يحبه العميل يُستبدل تلقائياً في جواله.</p>')
    + '</div>'
    + (x.health ? '<div class="warn">🩺 يطلب العميل تعديل حالته الصحية إلى: <b>' + (esc(x.health.cond.concat(x.health.allg).join('، ')) || 'لا حالات') + '</b>' + (x.health.note ? ' — ' + esc(x.health.note) : '') + '<p class="two"><button class="sm" data-a="hxHealthOk">اعتماد وتحديث ملفه</button><button class="sec sm" data-a="hxHealthNo">رفض</button></p></div>' : '')
    + '<div class="hxgrid"><div class="ucard"><h3>💬 المحادثة</h3>' + (hxThread(x.msgs).replace('<div class="hxthread"></div>', '<p class="small">لا رسائل بعد. ما يكتبه العميل من «راسل الأخصائي» يظهر هنا مع إشعار.</p>')) + '<div class="hxcomp"><textarea id="hxMsg" rows="2" placeholder="اكتب رسالة للعميل…"></textarea><button data-a="hxSendMsg">إرسال</button></div></div>'
    + '<div class="ucard"><h3>✅ المتابعة اليومية</h3>' + (adh || '<p class="small">لم يسجّل العميل متابعة بعد. يعلّم في «حصتي» ما أكله بلمسة، ويكتب ما أضاف أو حذف.</p>') + '</div>'
    + '<div class="ucard"><h3>⚖ الوزن</h3>' + (w.length ? '<div class="hxw">' + w.map(function (q) { return '<span><b>' + q[1] + '</b><small>' + new Date(q[0]).toLocaleDateString('ar', { day: 'numeric', month: 'short' }) + '</small></span>'; }).join('') + '</div>' : '<p class="small">—</p>') + '</div>'
    + '<div class="ucard"><h3>❤ التفضيلات</h3>' + ((x.prefLog || []).length ? '<ul class="hxpl">' + x.prefLog.slice(-10).reverse().map(function (q) { return '<li>' + (q.t === 'no' ? '🚫 لا يحب' : '❤ يحب') + ' «' + esc(q.f) + '»' + (q.n ? ' — استُبدل في ' + q.n + ' موضعاً' : '') + ' <small>' + hxAgo(q.ts) + '</small></li>'; }).join('') + '</ul>' : '<p class="small">ما يغيّره العميل يُضاف تلقائياً إلى «أصناف يتجنبها / مفضّلة» في بياناته.</p>') + '</div></div></div>';
}
// إعادة الرسم مع الإبقاء على ما يكتبه الأخصائي في صناديق الرد (الاستقبال الدوري لا يمسح رسالة قيد الكتابة)
function hxRe() { var keep = [].map.call(document.querySelectorAll('#hxMsg,[data-hxr]'), function (t) { return [t.id ? '#' + t.id : '[data-hxr="' + t.dataset.hxr + '"]', t.value, document.activeElement === t]; }); main(); keep.forEach(function (k) { var n = $(k[0]); if (n) { n.value = k[1]; if (k[2]) n.focus(); } }); }
// ---------- الإجراءات
function hxErr(e) { HX.err = e.message; toast('⚠ ' + e.message); main(); }
Object.assign(A, {
  hxv: function () { S.view = 'hx'; S.cur = null; render(); if (hxOn()) hxPoll(); },
  hxOpen: function (v) { return A.pick(v).then(function () { S.tab = 'hx'; main(); }).then(function () { A.hxRead(); }); },
  hxReg: function () {
    var relay = ($('#hx_relay').value || '').trim().replace(/\/+$/, ''), key = ($('#hx_key').value || '').trim(), name = ($('#hx_name').value || '').trim();
    if (!hxUrlOk(relay)) { toast('اكتب عنوان المحطة كاملاً ويبدأ بـ https://'); return; } if (!name) { toast('اكتب اسمك كما يراه العميل'); return; }
    HX.err = ''; toast('جارٍ الربط…');
    hxRegister(relay, key, name).then(function () {
      if (S.mode === 'admin') { S.settings.hx = { relay: relay, regKey: key }; saveSettings(); }
      main(); hxRail(); toast('✓ رُبط هذا الجهاز بالمحطة — يمكنك الآن دعوة العملاء إلى «حصتي»');
    }).catch(hxErr);
  },
  hxNotif: function () { hxPushSetup(true).then(function (st) { toast(st === 'on' ? 'فُعّلت إشعارات «حصتي» على هذا المتصفح ✓' : st === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : 'تعذّر تفعيل الإشعارات'); main(); }); },
  hxUnlink: function () { if (!confirm('فصل هذا الجهاز عن «حصتي»؟ لن تصل رسائل العملاء المرتبطين إلى هذا الجهاز بعد الآن.')) return; if (HX.st.pushEp) hxFetch('POST', '/v1/push/unsub', { ep: HX.st.pushEp }, true).catch(function () { }); HX.st = { key: 'hx', relay: HX.st.relay, name: HX.st.name, cc: HX.st.cc, after: 0, inv: {}, reqs: {} }; clearInterval(HX.timer); hxSave(); main(); },
  hxCheck: function () { toast('جارٍ التحقق…'); hxPoll().then(function (n) { toast(HX.err ? '⚠ ' + HX.err : n ? 'وصل ' + n + ' جديد' : 'لا جديد'); main(); }); },
  hxInvForm: function () { HX.form = !HX.form; HX.made = null; main(); var i = $('#hxi_l'); if (i) i.focus(); },
  hxInvMake: function () {
    var l = ($('#hxi_l').value || '').trim(), ph = ($('#hxi_p').value || '').trim(), d = +$('#hxi_d').value || 7, sy = ($('#hxi_s') || {}).value === 'g' ? 'g' : 'ex';
    if (!l) { toast('اكتب اسم العميل'); return; }
    hxInvite(l, ph, d, sy).then(function (inv) { HX.form = false; HX.made = Object.keys(HX.st.inv).filter(function (h) { return HX.st.inv[h] === inv; })[0]; main(); toast('✓ جاهز — أرسل الرابط على واتساب أو انسخه'); }).catch(hxErr);
  },
  hxCopy: function (h) { var v = HX.st.inv[h]; if (!v) return; var t = hxWaText(v); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('نُسخت الرسالة مع الرابط'); }).catch(function () { prompt('انسخ الرابط:', hxLink(v)); }); },
  hxInvDel: function (h) { if (!confirm('إلغاء هذه الدعوة؟ لن يعمل الرابط بعد الآن.')) return; hxFetch('POST', '/v1/invites/revoke', { h: h }, true).catch(function () { }).then(function () { delete HX.st.inv[h]; if (HX.made === h) HX.made = null; return hxSave(); }).then(main); },
  hxOk: function (cid) { hxApprove(cid).catch(hxErr); },
  hxChg: function (cid) {
    var q = HX.st.reqs[cid], m = prompt('ما الذي تريد من العميل تعديله؟ (تصله الرسالة في «حصتي»)', 'أرجو كتابة جرعة الدواء ووقت تناوله'); if (!m) return;
    hxSendTo(cid, q.encPub, HX.st.inv[q.h].tok, { t: 'status', st: 'changes', msg: m.slice(0, 500) }).then(function () { q.st = 'changes'; q.msgs = (q.msgs || []).concat([{ from: 'd', t: m, ts: Date.now() }]); return hxSave(); }).then(function () { main(); toast('أُرسل طلب التعديل'); }).catch(hxErr);
  },
  hxRej: function (cid) {
    var q = HX.st.reqs[cid]; if (!confirm('رفض طلب «' + ((q.intake || {}).name || q.label) + '»؟ يُحذف من المحطة ولا يستطيع المراسلة.')) return;
    hxSendTo(cid, q.encPub, HX.st.inv[q.h].tok, { t: 'status', st: 'rejected' }).catch(function () { }).then(function () { return hxFetch('POST', '/v1/clients/remove', { cid: cid }, true).catch(function () { }); })
      .then(function () { delete HX.st.reqs[cid]; delete HX.st.inv[q.h]; return hxSave(); }).then(main);
  },
  hxReqMsg: function (cid) {
    var q = HX.st.reqs[cid], ta = document.querySelector('[data-hxr="' + cid + '"]'), t = ta && ta.value.trim(); if (!t) return;
    var ts = Date.now(); hxSendTo(cid, q.encPub, HX.st.inv[q.h].tok, { t: 'msg', text: t.slice(0, 2000), ts: ts }).then(function () { q.msgs = (q.msgs || []).concat([{ from: 'd', t: t, ts: ts }]); q.unread = 0; return hxSave(); }).then(main).catch(hxErr);
  },
  hxSendPlan: function () {
    var c = cur(), rd = c && c.planSrc === 'ready' && c.ready && c.readyDoc && window.RL; if (!c || !c.hx || !(c.plan || rd)) return; var snap;
    try { snap = rd ? RL.toHissati(c.readyDoc, RL.plan(c.ready.id)) : c.kind === 'athlete' ? hxSnapG(c) : hxSnap(c); } catch (e) { toast('تعذّر تجهيز الخطة: ' + e.message); return; }
    var v = (c.hx.planV || 0) + 1; toast('جارٍ الإرسال…');
    hxSend(c, { t: 'plan', v: v, plan: snap, note: '' }).then(function () { c.hx.planV = v; c.hx.sentAt = Date.now(); if (rd) c.ready.sentV = v; persist(c); main(); toast('✓ وصلت الخطة v' + v + ' إلى «حصتي» مع إشعار للعميل'); }).catch(hxErr);
  },
  hxSendMsg: function () {
    var c = cur(), ta = $('#hxMsg'), t = ta && ta.value.trim(); if (!c || !t) return;
    var ts = Date.now(); hxSend(c, { t: 'msg', text: t.slice(0, 2000), ts: ts }).then(function () { c.hx.msgs = (c.hx.msgs || []).concat([{ from: 'd', t: t, ts: ts }]); c.hx.unread = 0; persist(c); main(); var n = $('#hxMsg'); if (n) n.focus(); }).catch(hxErr);
  },
  hxRead: function () {
    var c = cur(); if (!c || !c.hx || !c.hx.unread) return; c.hx.unread = 0; persist(c); hxRail();
    var last = (c.hx.msgs || []).filter(function (m) { return m.from === 'c'; }).slice(-1)[0]; if (last) hxSend(c, { t: 'read', upTo: last.ts }).catch(function () { });
  },
  hxHealthOk: function () {
    var c = cur(), h = c.hx.health; c.conditions = h.cond.slice(); c.allergens = h.allg.filter(function (k) { return D.allergens.some(function (a) { return a.label === k; }); });
    hxSend(c, { t: 'health', ok: 1, cond: c.conditions, allg: c.allergens }).then(function () { delete c.hx.health; persist(c); main(); toast('✓ حُدّثت الحالة الصحية — أعد توليد الخطة وأرسلها'); }).catch(hxErr);
  },
  hxHealthNo: function () { var c = cur(); hxSend(c, { t: 'health', ok: 0 }).catch(function () { }).then(function () { delete c.hx.health; persist(c); main(); }); }
});
(function (f) { A.tab = function (v) { var r = f.apply(this, arguments); if (v === 'hx') A.hxRead(); return r; }; })(A.tab);
document.addEventListener('change', function (e) {
  var t = e.target; if (!t.dataset || !t.dataset.hx || !HX.st) return;
  if (t.dataset.hx === 'cc') HX.st.cc = t.value.replace(/\D/g, '') || '966'; else if (t.dataset.hx === 'name' && t.value.trim()) HX.st.name = t.value.trim().slice(0, 80);
  hxSave(); if (t.dataset.hx === 'name' && hxOn()) hxFetch('POST', '/v1/register', { sigPub: HX.st.ident.sigPub, encPub: HX.st.ident.encPub, name: HX.st.name, regKey: hxDef().regKey || '' }, true).catch(function () { });
});
document.addEventListener('keydown', function (e) { var t = e.target; if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && t && (t.id === 'hxMsg' || (t.dataset && t.dataset.hxr))) { e.preventDefault(); if (t.id === 'hxMsg') A.hxSendMsg(); else A.hxReqMsg(t.dataset.hxr); } });
(function (f) { render = function () { var r = f.apply(this, arguments); if (!HX.loaded && DB) { HX.loaded = 'loading'; hxLoad().then(function () { hxRail(); if (S.view === 'hx' || S.view === 'settings') main(); }); } else hxRail(); return r; }; })(render);
(function (f) { main0 = function () { if (S.view === 'hx') { $('main').innerHTML = hxPage(); return; } return f.apply(this, arguments); }; })(main0);
