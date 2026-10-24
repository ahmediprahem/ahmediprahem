// ================= أدوات توفير الوقت (المرحلة 4) — يُدمج داخل app.js عند /*WORKUI*/
// 1) قوالب الخطط ونسخ الخطة بين العملاء: «كما هي» (نفس السعرات والأصناف) أو «بسعرات هذا العميل» (إعدادات القالب ثم توليد على بياناته).
// 2) المواعيد والتذكير: تبويب «📅 المواعيد» لكل عميل، وأجندة عامة، وتذكير قبل الموعد، ورسالة تذكير واتساب أو «حصتي»، وملف تقويم (.ics).
// 3) «من يحتاج اهتمامي اليوم» في الرئيسية: مواعيد اليوم، رسائل وطلبات «حصتي»، التزام منخفض، انقطاع، خطة لم تُرسل، متابعة مستحقة، تنبيهات طبية.
// القوالب في الإعدادات (S.settings.tpls) فتدخل النسخ الاحتياطي والمزامنة؛ والمواعيد داخل سجل العميل (c.appts).
var WK = { pick: false, rem: {}, told: '', all: false, form: null };
var WK_TYPES = ['متابعة', 'أول زيارة', 'قياس وتحاليل', 'استشارة أونلاين'];
var WK_RX = { ex: ['kcalManual', 'macroMode', 'proGkg', 'proGkgOb', 'proRef', 'fatPct', 'choPct', 'proPct', 'meals', 'favMeals', 'excludedMeals', 'noBank', 'cuisine', 'budget', 'life', 'exotic', 'baseCounts', 'dayCounts', 'diet'],
  athlete: ['phase', 'carbMethod', 'schedule', 'athMeals', 'macroMode', 'pBase', 'pMode', 'pVal', 'fMode', 'fVal', 'kcalMode', 'kcalAdj', 'kcalTrain', 'kcalRest', 'diet'] };
function wkKind(c) { return c.kind === 'athlete' ? 'athlete' : 'ex'; }
function wkClone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
function wkKcal(p) { if (!p) return 0; if (p.targets) return Math.round(p.targets.kcal || 0); var d = p.T && p.T.days || []; return d.length ? Math.round(d.reduce(function (a, x) { return a + (x.kcal || 0); }, 0) / d.length) : 0; }
function wkRx(c) { var o = {}; WK_RX[wkKind(c)].forEach(function (k) { if (c[k] !== undefined) o[k] = wkClone(c[k]); }); return o; }
function wkFoods(p) { var out = {}; (function walk(x) { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.keys(x).forEach(function (k) { if (k === 'client') return; if ((k === 'name' || k === 'n') && typeof x[k] === 'string') out[x[k]] = 1; else walk(x[k]); }); })(p && p.days); return out; }
function wkTpls() { return (S.settings.tpls || []); }
function wkDay(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function wkAddDays(n) { return wkDay(Date.now() + n * 86400000); }
function wkAt(a) { return new Date(a.d + 'T' + (a.t || '09:00')).getTime(); }
function wkDate(d) { var x = new Date(d + 'T12:00'); return D.days[x.getDay()] + ' ' + x.toLocaleDateString('ar', { day: 'numeric', month: 'long' }); }
function wkNum(v) { return String(v || '').replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; }); }
// ---------- 1) القوالب ونسخ الخطة
function wkBar(c) {
  var kind = wkKind(c), tp = wkTpls().filter(function (t) { return t.kind === kind; }), others = S.clients.filter(function (x) { return x !== c && x.plan && wkKind(x) === kind; });
  var bar = '<div class="noprint wkbar">' + (c.plan ? '<button class="sec sm" data-a="wkSaveTpl">💾 حفظ كقالب</button> ' : '') + '<button class="sec sm" data-a="wkPick">📋 ' + (c.plan ? 'استبدال من' : 'ابدأ من') + ' قالب أو عميل آخر' + (tp.length ? ' (' + tp.length + ' قالب)' : '') + '</button></div>';
  if (!WK.pick) return bar;
  var row = function (src, label, sub, del) { return '<div class="wkrow"><div><b>' + label + '</b><small>' + sub + '</small></div><p class="two"><button class="sm" data-a="wkApply" data-v="' + src + '" data-m="asis" title="نفس السعرات ونفس الأصناف">كما هي</button><button class="o sm" data-a="wkApply" data-v="' + src + '" data-m="fit" title="إعدادات القالب (عدد الوجبات والوجبات المفضلة والماكروز) ثم توليد على بيانات هذا العميل">بسعرات هذا العميل</button>' + (del ? '<button class="sec sm" data-a="wkDelTpl" data-v="' + del + '" aria-label="حذف القالب">🗑</button>' : '') + '</p></div>'; };
  return bar + '<div class="ucard wkpick noprint"><div class="hxtop"><h3>📋 ابدأ من قالب أو انسخ خطة عميل</h3><button class="sec sm" data-a="wkPick">إغلاق</button></div>'
    + '<p class="small">«كما هي»: نفس السعرات والأصناف (للعائلة أو العملاء المتشابهين) مع تثبيت سعرات القالب لهذا العميل. «بسعرات هذا العميل»: تُنقل الإعدادات (الوجبات والمفضلة والماكروز' + (kind === 'athlete' ? ' والمرحلة وجدول التدريب' : '') + ') ثم تُولَّد خطة جديدة على وزنه وطوله ونشاطه. أصناف «يتجنبها» عنده يُنبَّه إليها. الخطة الحالية تُحفظ إصداراً قبل الاستبدال.</p>'
    + '<h4>القوالب' + (kind === 'athlete' ? ' — نظام الجرامات' : ' — نظام الحصص') + '</h4>' + (tp.map(function (t) { return row('t:' + t.id, '⭐ ' + esc(t.name), t.kcal + ' سعرة' + (t.meals ? ' • ' + t.meals + ' وجبات' : '') + ' • حُفظ ' + new Date(t.at).toLocaleDateString('ar'), t.id); }).join('') || '<p class="small">لا قوالب بعد. افتح خطة جيدة واضغط «💾 حفظ كقالب».</p>')
    + '<h4>خطط عملائك</h4>' + (others.sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); }).slice(0, 30).map(function (x) { return row('c:' + x.code, esc(x.name || x.code), x.code + ' • ' + wkKcal(x.plan) + ' سعرة'); }).join('') || '<p class="small">لا عملاء آخرون لديهم خطة في هذا النظام.</p>') + '</div>';
}
function wkApply(c, src, mode) {
  var s = src.charAt(0) === 't' ? wkTpls().filter(function (t) { return t.id === src.slice(2); })[0] : null, from = s ? null : S.clients.filter(function (x) { return x.code === src.slice(2); })[0];
  var plan = s ? s.plan : from && from.plan, rx = s ? s.rx : from && wkRx(from), kcal = s ? s.kcal : from && wkKcal(from.plan); if (!plan) return Promise.reject(new Error('المصدر غير موجود'));
  var keep = c.plan ? dbPut('versions', { code: c.code, at: Date.now(), note: 'قبل تطبيق ' + (s ? 'القالب «' + s.name + '»' : 'خطة ' + (from.name || from.code)), plan: c.plan, client: ec(c) }) : Promise.resolve();
  return keep.then(function () {
    var r = wkClone(rx || {}); if (mode === 'fit') { delete r.baseCounts; delete r.dayCounts; delete r.kcalManual; if (r.kcalMode === 'fixed') delete r.kcalMode; }
    Object.assign(c, r);
    if (mode === 'asis') { if (wkKind(c) === 'ex' && kcal) c.kcalManual = kcal; c.plan = wkClone(plan); c.plan.client = ec(c); c.plan.generated = new Date().toISOString(); }
    else c.plan = c.kind === 'athlete' ? Ath.planWeek(ec(c), AD) : E.planWeek(ec(c), D);
    var fd = wkFoods(c.plan), bad = (c.avoid || []).filter(function (f) { return fd[f]; });
    S.tab = 'plan'; S.page = 'sum'; WK.pick = false; persist(c); return loadVersions().then(function () { render(); toast((mode === 'asis' ? '✓ نُسخت الخطة كما هي (' + wkKcal(c.plan) + ' سعرة)' : '✓ وُلّدت خطة بإعدادات ' + (s ? 'القالب' : 'الخطة المنسوخة') + ' على بيانات العميل (' + wkKcal(c.plan) + ' سعرة)') + (bad.length ? ' — ⚠ فيها ما يتجنبه: ' + bad.slice(0, 4).join('، ') + ' (بدّلها أو أعد التوليد)' : '')); });
  });
}
// ---------- 2) المواعيد
function wkAppts(c) { return (c.appts || []).slice().sort(function (a, b) { return wkAt(a) - wkAt(b); }); }
function wkWaText(c, a) { var b = BR(); return 'مرحباً ' + (String(c.name || '').trim().split(/\s+/)[0] || '') + '،\nتذكير بموعدك' + (a.type && a.type !== 'متابعة' ? ' (' + a.type + ')' : ' للمتابعة') + ' مع ' + (b.specialist || (HX.st && HX.st.name) || 'أخصائي التغذية') + (b.clinic ? ' — ' + b.clinic : '') + '\n' + wkDate(a.d) + ' الساعة ' + (a.t || '') + '\nفي حال عدم التمكن من الحضور أرجو إبلاغنا مسبقاً.'; }
function wkWa(c, a) { var p = String(c.phone || '').replace(/[^\d+]/g, ''); if (p && HX.st && typeof hxPhone === 'function') p = hxPhone(p); else p = p.replace(/^\+/, '').replace(/^00/, '').replace(/^0/, '966'); return 'https://wa.me/' + p + '?text=' + encodeURIComponent(wkWaText(c, a)); }
function wkRowHtml(c, a, withName) {
  var past = wkAt(a) < Date.now() - 3600000, st = a.st === 'done' ? '<span class="wkst ok">✓ حضر</span>' : a.st === 'miss' ? '<span class="wkst no">✕ لم يحضر</span>' : past ? '<span class="wkst late">لم يُسجَّل</span>' : '';
  var act = a.st ? '<button class="sec sm" data-a="wkSt" data-v="' + a.id + '" data-c="' + c.code + '" data-s="">↺</button>'
    : '<button class="sm" data-a="wkSt" data-v="' + a.id + '" data-c="' + c.code + '" data-s="done">✓ حضر</button><button class="sec sm" data-a="wkSt" data-v="' + a.id + '" data-c="' + c.code + '" data-s="miss">✕ لم يحضر</button>'
      + (past ? '' : (c.phone ? '<a class="btn sec sm" target="_blank" rel="noopener" data-wkwa="' + a.id + '" href="' + esc(wkWa(c, a)) + '">💬 واتساب</a>' : '') + (c.hx ? '<button class="sec sm" data-a="wkHx" data-v="' + a.id + '" data-c="' + c.code + '">📲 تذكير «حصتي»' + (a.hxAt ? ' ✓' : '') + '</button>' : '') + '<button class="sec sm" data-a="wkIcs" data-v="' + a.id + '" data-c="' + c.code + '" title="ملف تقويم">📆</button>');
  return '<div class="wkappt' + (a.d === wkDay() && !a.st ? ' today' : '') + '"><span class="wkt"><b>' + esc(a.t || '—') + '</b><small>' + (withName ? esc(wkDate(a.d)) : esc(wkDate(a.d))) + '</small></span><span class="wki">' + (withName ? '<a href="#" data-a="wkOpen" data-v="' + c.code + '">' + esc(c.name || c.code) + '</a> • ' : '') + esc(a.type || 'متابعة') + (a.note ? ' — ' + esc(a.note) : '') + ' ' + st + '</span><span class="wka">' + act + '<button class="sec sm" data-a="wkDel" data-v="' + a.id + '" data-c="' + c.code + '" aria-label="حذف">🗑</button></span></div>';
}
function wkForm(clientSel) {
  var f = WK.form || (WK.form = { d: wkAddDays(7), t: '17:00', type: 'متابعة', note: '', c: '' });
  return '<div class="wkform">' + (clientSel ? '<label>العميل<select id="wk_c" data-wkf="c"><option value="">— اختر —</option>' + S.clients.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ar'); }).map(function (c) { return '<option value="' + c.code + '"' + (f.c === c.code ? ' selected' : '') + '>' + esc(c.name || c.code) + ' (' + c.code + ')</option>'; }).join('') + '</select></label>' : '')
    + '<label>التاريخ<input type="date" id="wk_d" data-wkf="d" value="' + esc(f.d) + '"></label><label>الوقت<input type="time" id="wk_t" data-wkf="t" value="' + esc(f.t) + '"></label>'
    + '<label>النوع<select id="wk_type" data-wkf="type">' + WK_TYPES.map(function (t) { return '<option' + (f.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label><label class="wide">ملاحظة<input id="wk_note" data-wkf="note" maxlength="200" value="' + esc(f.note) + '" placeholder="اختياري: قياس الدهون، إحضار التحاليل…"></label>'
    + '<p class="wkq">' + [[7, 'بعد أسبوع'], [14, 'بعد أسبوعين'], [30, 'بعد شهر']].map(function (q) { return '<button class="sec sm" data-a="wkIn" data-v="' + q[0] + '">' + q[1] + '</button>'; }).join(' ') + ' <button data-a="wkAdd">+ إضافة الموعد</button></p></div>';
}
function wkApptTab(c) {
  var all = wkAppts(c), up = all.filter(function (a) { return !a.st && wkAt(a) >= Date.now() - 3600000; }), past = all.filter(function (a) { return up.indexOf(a) < 0; }).reverse();
  return '<div class="wktab"><div class="ucard"><h3>📅 موعد جديد لـ' + esc(c.name || c.code) + '</h3>' + wkForm(false) + '</div>'
    + '<div class="ucard"><h3>القادمة (' + up.length + ')</h3>' + (up.map(function (a) { return wkRowHtml(c, a); }).join('') || '<p class="small">لا مواعيد قادمة. أضف موعد المتابعة التالي ليظهر في الأجندة ويصلك تذكير قبله.</p>') + '</div>'
    + (past.length ? '<div class="ucard"><h3>السابقة</h3>' + past.slice(0, 20).map(function (a) { return wkRowHtml(c, a); }).join('') + '</div>' : '') + '</div>';
}
function wkAgenda() {
  var today = wkDay(), tmr = wkAddDays(1), wk = wkAddDays(7), rows = [];
  S.clients.forEach(function (c) { (c.appts || []).forEach(function (a) { rows.push([c, a]); }); });
  rows.sort(function (x, y) { return wkAt(x[1]) - wkAt(y[1]); });
  var grp = function (t, list, cls) { return list.length ? '<div class="ucard' + (cls ? ' ' + cls : '') + '"><h3>' + t + ' (' + list.length + ')</h3>' + list.map(function (r) { return wkRowHtml(r[0], r[1], true); }).join('') + '</div>' : ''; };
  var open = rows.filter(function (r) { return !r[1].st; }), late = open.filter(function (r) { return r[1].d < today || (r[1].d === today && wkAt(r[1]) < Date.now() - 3600000); });
  var tday = open.filter(function (r) { return r[1].d === today && late.indexOf(r) < 0; }), tm = open.filter(function (r) { return r[1].d === tmr; }), week = open.filter(function (r) { return r[1].d > tmr && r[1].d <= wk; }), later = open.filter(function (r) { return r[1].d > wk; });
  return '<div class="wkpage"><div class="hxtop"><h2>📅 المواعيد</h2><small class="small">تذكير داخل «حصة» قبل كل موعد بنصف ساعة، ورسالة تذكير للعميل بواتساب أو «حصتي» بضغطة</small></div>'
    + '<div class="ucard"><h3>+ موعد جديد</h3>' + wkForm(true) + '</div>'
    + grp('⏰ فائتة لم يُسجَّل حضورها', late, 'wklate') + grp('اليوم — ' + wkDate(today), tday, 'wktoday') + grp('غداً', tm) + grp('خلال الأسبوع', week) + grp('لاحقاً', later.slice(0, 60))
    + (open.length ? '' : '<p class="small">لا مواعيد قادمة. أضف موعداً من هنا أو من تبويب «📅 المواعيد» في ملف العميل.</p>') + '</div>';
}
function wkIcs(c, a) {
  var p = function (n) { return String(n).padStart(2, '0'); }, s = new Date(wkAt(a)), e = new Date(wkAt(a) + 30 * 60000), f = function (d) { return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00'; };
  var t = function (x) { return String(x || '').replace(/[\\;,]/g, function (m) { return '\\' + m; }).replace(/\n/g, '\\n'); };
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hissa//AR', 'BEGIN:VEVENT', 'UID:' + a.id + '@hissa', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(s), 'DTEND:' + f(e), 'SUMMARY:' + t((a.type || 'متابعة') + ' — ' + (c.name || c.code)), 'DESCRIPTION:' + t((c.phone ? 'جوال: ' + c.phone + '\n' : '') + (a.note || '')), 'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + t('موعد ' + (c.name || '')), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function wkTodayCount() { var t = wkDay(), n = 0; S.clients.forEach(function (c) { (c.appts || []).forEach(function (a) { if (a.d === t && !a.st) n++; }); }); return n; }
function wkRail() { var b = document.querySelector('[data-a="appts"] em'), n = wkTodayCount(); if (b) { b.textContent = n || ''; b.style.display = n ? '' : 'none'; } }
function wkTick() {                                                // تذكير قبل الموعد بنصف ساعة (مرة واحدة لكل موعد)، وتنبيه أول فتح بعدد مواعيد اليوم
  if (!S || !S.clients) return; var now = Date.now(), t = wkDay();
  S.clients.forEach(function (c) { (c.appts || []).forEach(function (a) { var at = wkAt(a); if (a.st || WK.rem[a.id] || at < now || at - now > 30 * 60000) return; WK.rem[a.id] = 1; var m = Math.max(1, Math.round((at - now) / 60000)), msg = '⏰ بعد ' + m + ' دقيقة: ' + (a.type || 'موعد') + ' — ' + (c.name || c.code); toast(msg); try { if ('Notification' in window && Notification.permission === 'granted') new Notification('موعد بعد ' + m + ' دقيقة', { body: (c.name || c.code) + ' • ' + (a.type || ''), lang: 'ar', dir: 'rtl' }); } catch (e) { } }); });
  if (WK.told !== t && S.clients.length) { WK.told = t; var n = wkTodayCount(); if (n) setTimeout(function () { toast('📅 لديك ' + n + (n === 1 ? ' موعد' : ' مواعيد') + ' اليوم'); }, 1200); }
  wkRail();
}
// ---------- 3) من يحتاج اهتمامي اليوم
function wkFollowDays() { return +((S.settings.work || {}).follow) || 30; }
function wkLastTouch(c) {
  var t = c.created || 0, f = function (v) { if (v > t) t = v; };
  (c.appts || []).forEach(function (a) { if (a.st === 'done') f(wkAt(a)); }); ((c.med || {}).visits || []).forEach(function (v) { f(new Date(v.d + 'T12:00').getTime() || 0); });
  if (c.hx) Object.keys(c.hx.logs || {}).forEach(function (k) { f(new Date(k + 'T12:00').getTime()); });
  if (c.plan && c.plan.generated) f(new Date(c.plan.generated).getTime() || 0); return t;
}
function wkItems() {
  var out = [], today = wkDay(), now = Date.now(), fd = wkFollowDays(), add = function (c, pri, ic, txt, tab, key) { out.push({ c: c, pri: pri, ic: ic, txt: txt, tab: tab, key: (c ? c.code : '') + ':' + key }); };
  if (HX.st && HX.st.reqs) { var nr = Object.keys(HX.st.reqs).filter(function (k) { return HX.st.reqs[k].st === 'new'; }).length; if (nr) add(null, 0, '📲', nr + (nr === 1 ? ' طلب جديد' : ' طلبات جديدة') + ' من «حصتي» بانتظار الاعتماد', 'hxv', 'req'); }
  S.clients.forEach(function (c) {
    var ap = c.appts || [], future = ap.some(function (a) { return !a.st && wkAt(a) >= now - 3600000; });
    ap.forEach(function (a) { if (a.st) return; if (a.d === today && wkAt(a) >= now - 3600000) add(c, 0, '📅', 'موعد اليوم ' + (a.t || '') + ' — ' + (a.type || 'متابعة'), 'appt', 'a' + a.id); else if (wkAt(a) < now - 3600000) add(c, 1, '⏰', 'موعد ' + wkDate(a.d) + ' لم يُسجَّل حضوره', 'appt', 'l' + a.id); });
    var x = c.hx;
    if (x) {
      if (x.unread) add(c, 0, '💬', x.unread + (x.unread === 1 ? ' رسالة جديدة' : ' رسائل جديدة') + ' في «حصتي»', 'hx', 'msg');
      if (x.health) add(c, 0, '🩺', 'يطلب تعديل حالته الصحية من «حصتي»', 'hx', 'health');
      if (c.plan && !x.planV) add(c, 1, '📤', 'لديه خطة لم تُرسل إلى «حصتي»', 'hx', 'send');
      var ks = Object.keys(x.logs || {}).sort(), last = ks.length ? new Date(ks[ks.length - 1] + 'T12:00').getTime() : 0, recent = ks.filter(function (k) { return k >= wkAddDays(-3) && k < today; }).map(function (k) { var l = x.logs[k]; return l.n ? l.done / l.n : 0; });
      if (recent.length >= 2) { var avg = recent.reduce(function (s, v) { return s + v; }, 0) / recent.length; if (avg < 0.5) add(c, 1, '📉', 'التزام منخفض في «حصتي»: ' + Math.round(avg * 100) + '% آخر ' + recent.length + ' أيام', 'hx', 'low'); }
      if (x.planV && (x.sentAt || 0) < now - 4 * 86400000 && (!last || last < now - 4 * 86400000)) add(c, 2, '😶', 'لم يسجّل متابعة في «حصتي» منذ ' + (last ? Math.floor((now - last) / 86400000) + ' أيام' : 'استلام الخطة'), 'hx', 'quiet');
    }
    if (!c.plan && c.name && (c.created || 0) < now - 86400000 && (c.created || 0) > now - 60 * 86400000) add(c, 2, '📝', 'بلا خطة بعد', 'plan', 'noplan');
    if (c.plan && !future) { var lt = wkLastTouch(c), days = Math.floor((now - lt) / 86400000); if (days >= fd) add(c, 2, '🔁', 'متابعة مستحقة — آخر تواصل قبل ' + days + ' يوماً ولا موعد قادم', 'appt', 'follow'); }
    if (typeof medAlerts === 'function') { var ma = medAlerts(c).filter(function (a) { return a.lvl > 1; }).length; if (ma && ((c.med || {}).labs || []).some(function (l) { return l.d >= wkAddDays(-60); })) add(c, 2, '🧪', ma + (ma === 1 ? ' تنبيه' : ' تنبيهات') + ' في تحاليل حديثة', 'med', 'lab'); }
  });
  var hid = wkHidden(); return out.filter(function (i) { return !hid[i.key]; }).sort(function (a, b) { return a.pri - b.pri || String(a.c ? a.c.name : '').localeCompare(String(b.c ? b.c.name : ''), 'ar'); });
}
function wkHidden() { try { var o = JSON.parse(localStorage.getItem('wk_hide') || '{}'); return o.d === wkDay() ? o.k || {} : {}; } catch (e) { return {}; } }
function wkHide(k) { try { var o = { d: wkDay(), k: wkHidden() }; o.k[k] = 1; localStorage.setItem('wk_hide', JSON.stringify(o)); } catch (e) { } }
function wkToday() {
  var it = wkItems(), n = it.length, show = WK.all ? it : it.slice(0, 8), fd = wkFollowDays();
  return '<section class="ucard wktodo"><div class="hxtop"><h3>☀ من يحتاج اهتمامك اليوم' + (n ? ' <em class="hxnb">' + n + '</em>' : '') + '</h3><label class="small">المتابعة كل <select data-wkset="follow">' + [14, 21, 30, 45, 60, 90].map(function (d) { return '<option value="' + d + '"' + (d === fd ? ' selected' : '') + '>' + d + ' يوماً</option>'; }).join('') + '</select></label></div>'
    + (n ? show.map(function (i) { return '<div class="wkit p' + i.pri + '"><span class="wkic">' + i.ic + '</span><button class="wkgo" data-a="wkGo" data-v="' + (i.c ? i.c.code : '') + '" data-t="' + i.tab + '"><b>' + esc(i.c ? i.c.name || i.c.code : 'حصتي') + '</b><small>' + esc(i.txt) + '</small></button><button class="sec sm wkx" data-a="wkHide" data-v="' + esc(i.key) + '" title="إخفاء حتى الغد" aria-label="إخفاء حتى الغد">✕</button></div>'; }).join('') + (n > 8 ? '<p><button class="sec sm" data-a="wkAll">' + (WK.all ? 'عرض أقل' : 'عرض الكل (' + n + ')') + '</button></p>' : '')
      : '<p class="small">لا شيء عاجل اليوم 🎉 — المواعيد والرسائل والالتزام المنخفض والمتابعات المستحقة تظهر هنا تلقائياً.</p>') + '</section>';
}
// ---------- الإجراءات
function wkFind(code, id) { var c = S.clients.filter(function (x) { return x.code === code; })[0], a = c && (c.appts || []).filter(function (q) { return q.id === id; })[0]; return [c, a]; }
function wkRe() { if (S.view === 'appts' || (cur() && S.tab === 'appt') || (!cur() && S.view === 'client')) main(); wkRail(); }
Object.assign(A, {
  wkPick: function () { WK.pick = !WK.pick; main(); },
  wkSaveTpl: function () {
    var c = cur(); if (!c || !c.plan) return; var kc = wkKcal(c.plan), name = prompt('اسم القالب:', (c.kind === 'athlete' ? 'جرامات ' : '') + kc + ' سعرة' + (c.goal ? ' — ' + c.goal : ''));
    if (!name || !name.trim()) return; var p = wkClone(c.plan); delete p.client;
    S.settings.tpls = wkTpls().concat([{ id: 't' + Date.now().toString(36), name: name.trim().slice(0, 80), kind: wkKind(c), kcal: kc, meals: c.kind === 'athlete' ? (c.athMeals || []).length : c.meals, at: Date.now(), rx: wkRx(c), plan: p }]);
    saveSettings(); main(); toast('⭐ حُفظ القالب «' + name.trim() + '» — يظهر في «📋 ابدأ من قالب» لأي عميل');
  },
  wkDelTpl: function (v) { var t = wkTpls().filter(function (x) { return x.id === v; })[0]; if (!t || !confirm('حذف القالب «' + t.name + '»؟')) return; S.settings.tpls = wkTpls().filter(function (x) { return x.id !== v; }); saveSettings(); main(); },
  wkApply: function (v, el) { var c = cur(); if (!c) return; if (c.plan && !confirm('استبدال الخطة الحالية؟ تُحفظ إصداراً يمكنك استرجاعه.')) return; wkApply(c, v, el.dataset.m).catch(function (e) { toast('⚠ ' + e.message); }); },
  appts: function () { S.view = 'appts'; S.cur = null; render(); },
  wkOpen: function (v) { A.pick(v).then(function () { S.tab = 'appt'; main(); }); },
  wkGo: function (v, el) { var t = el.dataset.t; if (!v) { A[t](); return; } A.pick(v).then(function () { S.tab = t; main(); if (t === 'hx' && A.hxRead) A.hxRead(); }); },
  wkHide: function (v) { wkHide(v); main(); },
  wkAll: function () { WK.all = !WK.all; main(); },
  wkIn: function (v) { WK.form = WK.form || {}; WK.form.d = wkAddDays(+v); main(); },
  wkAdd: function () {
    var f = WK.form || {}, c = S.view === 'appts' ? S.clients.filter(function (x) { return x.code === f.c; })[0] : cur(); f.d = wkNum(f.d); f.t = wkNum(f.t);
    if (!c) return toast('اختر العميل'); if (!/^\d{4}-\d{2}-\d{2}$/.test(f.d || '')) return toast('اختر تاريخ الموعد'); if (!/^\d{2}:\d{2}$/.test(f.t || '')) return toast('اختر وقت الموعد');
    var clash = S.clients.some(function (x) { return (x.appts || []).some(function (a) { return !a.st && a.d === f.d && a.t === f.t; }); });
    c.appts = (c.appts || []).concat([{ id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), d: f.d, t: f.t, type: f.type || 'متابعة', note: String(f.note || '').trim().slice(0, 200), at: Date.now() }]);
    persist(c); WK.form = { d: wkAddDays(7), t: f.t, type: 'متابعة', note: '', c: '' }; wkRe(); toast('✓ أُضيف الموعد: ' + wkDate(f.d) + ' ' + f.t + (clash ? ' — ⚠ لديك موعد آخر في نفس الوقت' : ''));
  },
  wkSt: function (v, el) { var r = wkFind(el.dataset.c, v); if (!r[1]) return; r[1].st = el.dataset.s; persist(r[0]); wkRe(); if (el.dataset.s === 'done') toast('✓ سُجّل الحضور — سجّل القياسات من «🩺 الملف الطبي» وحدّد الموعد التالي'); },
  wkDel: function (v, el) { var r = wkFind(el.dataset.c, v); if (!r[1] || !confirm('حذف الموعد؟')) return; r[0].appts = r[0].appts.filter(function (a) { return a.id !== v; }); persist(r[0]); wkRe(); },
  wkHx: function (v, el) { var r = wkFind(el.dataset.c, v), c = r[0], a = r[1]; if (!a || !c.hx) return; var ts = Date.now(), t = wkWaText(c, a); hxSend(c, { t: 'msg', text: t, ts: ts }).then(function () { c.hx.msgs = (c.hx.msgs || []).concat([{ from: 'd', t: t, ts: ts }]); a.hxAt = ts; persist(c); wkRe(); toast('📲 وصل التذكير إلى «حصتي» مع إشعار'); }).catch(function (e) { toast('⚠ ' + e.message); }); },
  wkIcs: function (v, el) { var r = wkFind(el.dataset.c, v); if (r[1]) dlFile(new Blob([wkIcs(r[0], r[1])], { type: 'text/calendar' }), 'موعد_' + fileBase(r[0]) + '_' + r[1].d + '.ics'); }
});
document.addEventListener('input', function (e) { var t = e.target; if (t.dataset && t.dataset.wkf) { WK.form = WK.form || {}; WK.form[t.dataset.wkf] = t.value; } });
document.addEventListener('change', function (e) {
  var t = e.target; if (!t.dataset) return;
  if (t.dataset.wkf) { WK.form = WK.form || {}; WK.form[t.dataset.wkf] = t.value; }
  if (t.dataset.wkset === 'follow') { S.settings.work = Object.assign({}, S.settings.work, { follow: +t.value }); saveSettings(); main(); }
});
document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-wkwa]'); if (!a) return; var id = a.getAttribute('data-wkwa'); S.clients.forEach(function (c) { (c.appts || []).forEach(function (q) { if (q.id === id) { q.waAt = Date.now(); persist(c); } }); }); });
(function (f) { planTab = function (c) { return wkBar(c) + f.apply(this, arguments); }; })(planTab);
(function (f) { main0 = function () { if (S.view === 'appts') { $('main').innerHTML = wkAgenda(); return; } return f.apply(this, arguments); }; })(main0);
(function (f) { render = function () { var r = f.apply(this, arguments); wkRail(); return r; }; })(render);
setInterval(function () { if (document.visibilityState !== 'hidden') wkTick(); }, 60000); setTimeout(wkTick, 2500);
window.DPApp.wk = { tick: wkTick, items: wkItems };                // للاختبارات
