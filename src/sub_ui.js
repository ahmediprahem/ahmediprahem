// ================= الاشتراكات في «زنها Pro» (0.89) — يُدمج داخل app.js عند /*SUBUI*/
// لكل عميل c.sub = { end:'YYYY-MM-DD', status:'active'|'paused'|'stopped', pkg, price, left (الأيام المتبقية وقت الإيقاف المؤقت), history:[{id,ts,type,days,amount,method,note,end,pkg}] }
// السجل يضم: start (بداية اشتراك)، renew (تجديد بدفع)، extend (تمديد بلا دفع)، pause/resume (إيقاف مؤقت واستئناف)، stop (إيقاف البرنامج).
// ملاحظة: هذه المرحلة للأخصائي فقط (تسجيل ومتابعة)، ولا يُرسَل الاشتراك إلى «زنها» بعد.
var SUBS = { form: null, open: null };
var SUB_METHODS = ['فودافون كاش', 'نقداً', 'تحويل بنكي', 'إنستاباي', 'أخرى'];
function sbDay(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function sbDiff(a, b) { return Math.round((new Date(a + 'T12:00') - new Date(b + 'T12:00')) / 86400000); }
function sbAdd(day, n) { var d = new Date(day + 'T12:00'); d.setDate(d.getDate() + n); return sbDay(d); }
function sbNum(v) { return Number(String(v == null ? '' : v).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; }).replace(/[^\d.]/g, '')) || 0; }
function sbFmt(n) { return Number(n || 0).toLocaleString('ar-EG'); }
function sbDate(d) { return d ? new Date(d + 'T12:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'; }
function sbHas(c) { return !!(c && c.sub && c.sub.end); }
function sbLeft(c) {                                                   // الأيام المتبقية (سالب = بعد الانتهاء)
  if (!sbHas(c)) return null; var s = c.sub;
  if (s.status === 'paused') return s.left || 0; if (s.status === 'stopped') return null;
  return sbDiff(s.end, sbDay());
}
function sbState(c) {                                                  // [مفتاح، نص، صنف الشارة]
  if (!sbHas(c)) return ['none', 'بلا اشتراك', 'n']; var s = c.sub, d = sbLeft(c);
  if (s.status === 'stopped') return ['stopped', 'البرنامج متوقف', 'no'];
  if (s.status === 'paused') return ['paused', 'موقوف مؤقتاً', 'w'];
  if (d < 0) return ['expired', 'منتهٍ منذ ' + sbFmt(-d) + (d === -1 ? ' يوم' : ' أيام'), 'no'];
  if (d === 0) return ['last', 'ينتهي اليوم', 'w']; if (d <= 5) return ['soon', 'متبقي ' + sbFmt(d) + (d === 1 ? ' يوم' : d === 2 ? ' يومان' : ' أيام'), 'w'];
  return ['ok', 'متبقي ' + sbFmt(d) + ' يوماً', 'ok'];
}
function sbPaid(c) { return ((c.sub && c.sub.history) || []).reduce(function (a, h) { return a + (+h.amount || 0); }, 0); }
function sbLog(c, h) {
  c.sub = c.sub || { end: '', status: 'active', pkg: '', price: 0, history: [] }; c.sub.history = c.sub.history || [];
  h.id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); h.ts = Date.now(); c.sub.history.push(h); return h;
}
// تجديد/بدء بدفع: يُضاف إلى المتبقي إن كان فعّالاً، ويبدأ من اليوم إن انتهى أو كان موقوفاً/جديداً
function sbRenew(c, days, amount, method, pkg, note) {
  var s = c.sub || {}, t = sbDay(), from = (sbHas(c) && s.status === 'active' && s.end > t) ? s.end : t, type = sbHas(c) ? 'renew' : 'start';
  sbLog(c, { type: type, days: days, amount: amount, method: method, pkg: pkg, note: note });
  c.sub.end = sbAdd(from, days); c.sub.status = 'active'; c.sub.pkg = pkg || c.sub.pkg || ''; c.sub.price = amount || c.sub.price || 0; delete c.sub.left; c.sub.history[c.sub.history.length - 1].end = c.sub.end;
}
function sbExtend(c, days, note) {                                     // تمديد بلا دفع (منحة)
  var s = c.sub, t = sbDay(), from = (s.status === 'active' && s.end > t) ? s.end : t;
  sbLog(c, { type: 'extend', days: days, amount: 0, method: '', pkg: s.pkg || '', note: note });
  s.end = sbAdd(from, days); if (s.status !== 'paused') s.status = 'active'; s.history[s.history.length - 1].end = s.end;
  if (s.status === 'paused') s.left = (s.left || 0) + days;
}
function sbPause(c, note) { var s = c.sub; s.left = Math.max(0, sbDiff(s.end, sbDay())); s.status = 'paused'; sbLog(c, { type: 'pause', days: 0, amount: 0, note: note, end: s.end }); }
function sbResume(c) { var s = c.sub; s.end = sbAdd(sbDay(), s.left || 0); s.status = 'active'; sbLog(c, { type: 'resume', days: s.left || 0, amount: 0, note: '', end: s.end }); delete s.left; }
function sbStop(c, note) { var s = c.sub; s.status = 'stopped'; sbLog(c, { type: 'stop', days: 0, amount: 0, note: note, end: s.end }); }
var SB_TYPES = { start: ['🟢', 'بدء اشتراك'], renew: ['💳', 'تجديد بدفع'], extend: ['🎁', 'تمديد بلا دفع'], pause: ['⏸', 'إيقاف مؤقت'], resume: ['▶', 'استئناف'], stop: ['⛔', 'إيقاف البرنامج'] };
function sbHistoryHtml(c) {
  var H = ((c.sub && c.sub.history) || []).slice().reverse();
  if (!H.length) return '<p class="small">لا سجل بعد. سجّل أول اشتراك للعميل من الأعلى.</p>';
  return '<div class="tw"><table class="sbt"><thead><tr><th>التاريخ</th><th>الحدث</th><th>المدة</th><th>المبلغ</th><th>الطريقة</th><th>ينتهي في</th><th>ملاحظة</th></tr></thead><tbody>' + H.map(function (h) {
    var t = SB_TYPES[h.type] || ['•', h.type];
    return '<tr><td>' + esc(sbDate(sbDay(h.ts))) + '</td><td>' + t[0] + ' ' + t[1] + '</td><td>' + (h.days ? sbFmt(h.days) + ' يوماً' : '—') + '</td><td>' + (h.amount ? '<b>' + sbFmt(h.amount) + '</b> جنيه' : h.type === 'extend' ? 'منحة' : '—') + '</td><td>' + esc(h.method || '—') + '</td><td>' + esc(h.end ? sbDate(h.end) : '—') + '</td><td>' + esc(h.note || '') + '</td></tr>';
  }).join('') + '</tbody></table></div>';
}
function sbForm(c) {
  var f = SUBS.form || (SUBS.form = { pkg: '', months: '1', days: '', amount: '', method: SUB_METHODS[0], note: '', ext: '7', extNote: '' });
  var s = c.sub || {}, st = sbState(c), act = sbHas(c) && s.status === 'active', paused = s.status === 'paused', stopped = s.status === 'stopped';
  var pk = (S.settings.sbPkgs || []);
  return '<div class="ucard"><h3>💳 ' + (sbHas(c) ? 'تجديد الاشتراك بدفع' : 'تسجيل اشتراك جديد') + '</h3><div class="sbf">'
    + (pk.length ? '<label>الباقة<select id="sb_pk" data-sbf="pk"><option value="">— مخصّصة —</option>' + pk.map(function (p, i) { return '<option value="' + i + '"' + (f.pk === String(i) ? ' selected' : '') + '>' + esc(p.n) + ' — ' + sbFmt(p.a) + ' جنيه (' + sbFmt(p.d) + ' يوماً)</option>'; }).join('') + '</select></label>' : '')
    + '<label>اسم الباقة<input id="sb_nm" data-sbf="name" value="' + esc(f.name != null ? f.name : (s.pkg || '')) + '" placeholder="مثال: شهري"></label>'
    + '<label>المدة<select id="sb_mo" data-sbf="months">' + [['1', 'شهر (30 يوماً)'], ['2', 'شهران (60)'], ['3', '3 أشهر (90)'], ['6', '6 أشهر (180)'], ['0', 'عدد أيام مخصّص']].map(function (o) { return '<option value="' + o[0] + '"' + (f.months === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'
    + (f.months === '0' ? '<label>عدد الأيام<input id="sb_dy" data-sbf="days" inputmode="numeric" value="' + esc(f.days) + '" placeholder="مثال: 45"></label>' : '')
    + '<label>المبلغ المدفوع (جنيه)<input id="sb_am" data-sbf="amount" inputmode="decimal" value="' + esc(f.amount) + '" placeholder="مثال: 150"></label>'
    + '<label>طريقة الدفع<select id="sb_me" data-sbf="method">' + SUB_METHODS.map(function (m) { return '<option' + (f.method === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>'
    + '<label class="wide">ملاحظة (اختياري)<input id="sb_nt" data-sbf="note" value="' + esc(f.note) + '" placeholder="مثال: وصل الإيصال على واتساب"></label>'
    + '</div><p><button data-a="sbPay">' + (sbHas(c) ? '✓ تسجيل الدفع وتجديد الاشتراك' : '✓ تسجيل الاشتراك') + '</button></p>'
    + (act ? '<p class="small">يُضاف إلى المتبقي (' + esc(st[1]) + ') فينتهي بعد انقضاء المتبقي والمدة الجديدة.</p>' : sbHas(c) ? '<p class="small">يبدأ العدّ من اليوم.</p>' : '') + '</div>'
    + (sbHas(c) ? '<div class="ucard"><h3>🎁 تمديد بلا دفع</h3><div class="sbf"><label>مدة التمديد<select id="sb_ex" data-sbf="ext">' + [['3', '3 أيام'], ['7', '7 أيام'], ['14', '14 يوماً'], ['30', '30 يوماً']].map(function (o) { return '<option value="' + o[0] + '"' + (f.ext === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'
      + '<label class="wide">السبب (اختياري)<input id="sb_en" data-sbf="extNote" value="' + esc(f.extNote) + '" placeholder="مثال: ظرف طارئ أو مكافأة التزام"></label></div><p><button class="sec" data-a="sbExt">تمديد المدة بلا شرط دفع</button> <small class="small">يُسجَّل كمنحة مبلغها صفر.</small></p></div>'
      + '<div class="ucard"><h3>⏯ إيقاف الاشتراك</h3><p class="small">الإيقاف المؤقت يجمّد الأيام المتبقية ولا تُحتسب حتى تستأنف. إيقاف البرنامج يعني انتهاء المتابعة مع بقاء بيانات العميل.</p><p>'
      + (paused ? '<button data-a="sbResume">▶ استئناف الاشتراك (' + sbFmt(s.left || 0) + ' يوماً متبقياً)</button> ' : act ? '<button class="sec" data-a="sbPause">⏸ إيقاف مؤقت</button> ' : '')
      + (stopped ? '' : '<button class="sec" data-a="sbStop">⛔ إيقاف البرنامج</button>') + (stopped ? '<span class="small">البرنامج متوقف. سجّل دفعاً جديداً من الأعلى لإعادة التفعيل.</span>' : '') + '</p></div>' : '');
}
function subTab(c) {
  var st = sbState(c), s = c.sub || {}, d = sbLeft(c), total = sbPaid(c), n = ((s.history || []).filter(function (h) { return h.amount > 0; })).length;
  return '<div class="subtab"><div class="ucard sbhero ' + st[2] + '"><div class="hxtop"><h3>💳 اشتراك ' + esc(c.name || c.code) + '</h3><span class="sbchip ' + st[2] + '">' + esc(st[1]) + '</span></div>'
    + (sbHas(c) ? '<div class="stats"><div><b>' + (d == null ? '—' : sbFmt(Math.max(d, 0))) + '</b><small>يوماً متبقياً</small></div><div><b>' + esc(s.status === 'active' ? sbDate(s.end) : s.status === 'paused' ? 'مجمّد' : '—') + '</b><small>ينتهي في</small></div><div><b>' + sbFmt(total) + '</b><small>جنيه مدفوعة (' + sbFmt(n) + ' دفعة)</small></div></div>' + (s.pkg ? '<p class="small">الباقة الحالية: <b>' + esc(s.pkg) + '</b>' + (s.price ? ' • ' + sbFmt(s.price) + ' جنيه' : '') + '</p>' : '')
      : '<p class="small">لم يُسجَّل اشتراك لهذا العميل بعد. سجّل أول اشتراك ليظهر المتبقي ويتم تنبيهك قبل انتهائه.</p>') + '</div>'
    + sbForm(c) + '<div class="ucard"><h3>سجل الاشتراكات والمدفوعات</h3>' + sbHistoryHtml(c) + '</div></div>';
}
function sbRows() {
  var order = { expired: 0, last: 1, soon: 2, paused: 3, ok: 4, stopped: 5, none: 6 };
  return S.clients.map(function (c) { return [c, sbState(c), sbLeft(c)]; }).sort(function (a, b) { return (order[a[1][0]] - order[b[1][0]]) || ((a[2] == null ? 9e9 : a[2]) - (b[2] == null ? 9e9 : b[2])); });
}
function sbOverview() {
  var rows = sbRows(), cnt = function (k) { return rows.filter(function (r) { return k.indexOf(r[1][0]) >= 0; }).length; }, month = sbDay().slice(0, 7), mt = 0, all = 0;
  S.clients.forEach(function (c) { ((c.sub && c.sub.history) || []).forEach(function (h) { all += +h.amount || 0; if (sbDay(h.ts).slice(0, 7) === month) mt += +h.amount || 0; }); });
  return '<div class="subpage"><div class="hxtop"><h2>💳 الاشتراكات</h2><small class="small">المتبقي لكل عميل، وتاريخ الاشتراكات والمدفوعات. اضغط على عميل لتجديده أو تمديده أو إيقافه.</small></div>'
    + '<div class="stats sbstats"><div><b>' + sbFmt(cnt(['ok', 'soon', 'last'])) + '</b><small>فعّال</small></div><div><b>' + sbFmt(cnt(['soon', 'last', 'expired'])) + '</b><small>يحتاج تجديداً</small></div><div><b>' + sbFmt(mt) + '</b><small>جنيه هذا الشهر (إجمالي ' + sbFmt(all) + ')</small></div></div>'
    + '<div class="ucard">' + (rows.length ? rows.map(function (r) {
      var c = r[0], st = r[1], s = c.sub || {};
      return '<button class="sbrow" data-a="sbOpen" data-v="' + esc(c.code) + '"><span class="cav">' + esc(initial(c.name)) + '</span><span class="sbn"><b>' + esc(c.name || c.code) + '</b><small>' + (s.pkg ? esc(s.pkg) + ' • ' : '') + (sbHas(c) && s.status !== 'stopped' ? 'ينتهي ' + esc(sbDate(s.status === 'paused' ? '' : s.end)) : sbHas(c) ? 'آخر دفعة: ' + sbFmt(((s.history || []).filter(function (h) { return h.amount; }).pop() || {}).amount || 0) + ' جنيه' : 'لا اشتراك مسجّل') + '</small></span><span class="sbchip ' + st[2] + '">' + esc(st[1]) + '</span></button>';
    }).join('') : '<p class="small">لا عملاء بعد.</p>') + '</div></div>';
}
function sbRe() { if (S.view === 'subs' || (cur() && S.tab === 'sub')) main(); }
Object.assign(A, {
  subs: function () { S.view = 'subs'; S.cur = null; render(); },
  sbOpen: function (v) { var c = S.clients.filter(function (x) { return x.code === v; })[0]; if (!c) return; S.cur = c.code; S.view = 'client'; S.tab = 'sub'; render(); window.scrollTo(0, 0); },
  sbPay: function () {
    var c = cur(), f = SUBS.form || {}; if (!c) return; var pk = (S.settings.sbPkgs || [])[+f.pk], mo = +f.months, days = f.months === '0' ? sbNum(f.days) : mo * 30, amount = sbNum(f.amount), name = String(f.name != null ? f.name : (pk ? pk.n : '')).trim() || (mo ? ['', 'شهري', 'شهران', '3 أشهر', '', '', '6 أشهر'][mo] || mo + ' أشهر' : 'مخصّصة');
    if (!(days > 0)) { toast('حدّد مدة الاشتراك بالأيام'); return; } if (!(amount > 0)) { toast('اكتب المبلغ المدفوع (للتمديد بلا دفع استعمل «تمديد بلا دفع»)'); return; }
    sbRenew(c, days, amount, f.method || SUB_METHODS[0], name, String(f.note || '').trim().slice(0, 200)); persist(c); SUBS.form = null; toast('✓ سُجّل الدفع وتجدّد الاشتراك حتى ' + sbDate(c.sub.end)); sbRe(); sbRail();
  },
  sbExt: function () {
    var c = cur(), f = SUBS.form || {}; if (!c || !sbHas(c)) return; var n = +(f.ext || 7);
    sbExtend(c, n, String(f.extNote || '').trim().slice(0, 200)); persist(c); SUBS.form = null; toast('✓ مُدّد الاشتراك ' + sbFmt(n) + ' يوماً بلا دفع'); sbRe(); sbRail();
  },
  sbPause: function () { var c = cur(); if (!c || !sbHas(c) || !confirm('إيقاف اشتراك «' + (c.name || c.code) + '» مؤقتاً؟ تتجمّد الأيام المتبقية حتى تستأنف.')) return; sbPause(c, ''); persist(c); toast('⏸ أُوقف الاشتراك مؤقتاً'); sbRe(); sbRail(); },
  sbResume: function () { var c = cur(); if (!c || !sbHas(c)) return; sbResume(c); persist(c); toast('▶ استؤنف الاشتراك حتى ' + sbDate(c.sub.end)); sbRe(); sbRail(); },
  sbStop: function () { var c = cur(); if (!c || !sbHas(c)) return; var r = prompt('إيقاف برنامج «' + (c.name || c.code) + '». اكتب السبب (اختياري):', ''); if (r === null) return; sbStop(c, String(r).trim().slice(0, 200)); persist(c); toast('⛔ أُوقف البرنامج'); sbRe(); sbRail(); }
});
document.addEventListener('change', function (e) {
  var t = e.target, k = t && t.dataset && t.dataset.sbf; if (!k) return; var f = SUBS.form || (SUBS.form = {}), c = cur(); if (!c) return;
  if (k === 'pk') { f.pk = t.value; var p = (S.settings.sbPkgs || [])[+t.value]; if (p) { f.name = p.n; f.amount = String(p.a); f.months = ({ 30: '1', 60: '2', 90: '3', 180: '6' })[p.d] || '0'; f.days = f.months === '0' ? String(p.d) : ''; } }
  else if (k === 'ext') f.ext = t.value; else f[k] = t.value;
  if (k === 'months' || k === 'pk') sbRe();
});
document.addEventListener('input', function (e) { var t = e.target, k = t && t.dataset && t.dataset.sbf; if (!k || t.tagName === 'SELECT') return; (SUBS.form || (SUBS.form = {}))[k] = t.value; });
// ---------- تكامل: تبويب العميل، الصفحة العامة، «من يحتاج اهتمامك»، شارة الشريط
function sbRail() { var b = document.querySelector('[data-a="subs"] em'), n = S.clients.filter(function (c) { var k = sbState(c)[0]; return k === 'soon' || k === 'last' || k === 'expired'; }).length; if (b) { b.textContent = n || ''; b.style.display = n ? '' : 'none'; } }
(function (f) { main0 = function () { if (S.view === 'subs') { $('main').innerHTML = sbOverview(); return; } return f.apply(this, arguments); }; })(main0);
(function (f) {
  wkItems = function () {
    var out = f.apply(this, arguments);
    S.clients.forEach(function (c) {
      var st = sbState(c), d = sbLeft(c); if (st[0] === 'expired') out.push({ c: c, pri: 1, ic: '💳', txt: 'اشتراكه ' + st[1] + ' — جدّد أو مدّد أو أوقف', tab: 'sub', key: c.code + ':subx' });
      else if (st[0] === 'last' || st[0] === 'soon') out.push({ c: c, pri: 2, ic: '💳', txt: 'اشتراكه ' + (d === 0 ? 'ينتهي اليوم' : 'ينتهي بعد ' + sbFmt(d) + (d === 1 ? ' يوم' : d === 2 ? ' يومين' : ' أيام')), tab: 'sub', key: c.code + ':subs' });
    });
    return out.sort(function (a, b) { return a.pri - b.pri; });
  };
})(wkItems);
window.SBX = { left: sbLeft, paid: sbPaid, renew: sbRenew, extend: sbExtend, day: sbDay, state: sbState };       // للاختبارات
(function (f) { wkRail = function () { f.apply(this, arguments); sbRail(); }; })(wkRail);
