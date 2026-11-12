// ================= ملف العميل (0.94) — يُدمج داخل app.js عند /*CFILEUI*/
// رأس ثابت (الاسم والكود وشارتا الاشتراك و«زنها» وزر «أرسل الخطة إلى زنها» و«افتح المحادثة» وقائمة «…») فوق خمسة تبويبات:
// الملف (البيانات | الملف الطبي | ربط زنها) • الخطة (الخطة | الإصدارات) • المتابعة (الحضور | المتابعة اليومية | صور الوجبات | التحديات) • المواعيد • الاشتراك.
// لا محتوى جديد ولا منطق جديد: كل قسم يستدعي دالة وحدته كما هي (clientTab, medTab, planTab, verTab, ciTab, wkApptTab, subTab, phCard, chCard…).
// S.tab يحمل اسم القسم الداخلي. الأسماء القديمة تبقى صالحة: «hx» يقود إلى «المتابعة اليومية» للمرتبط وإلى «ربط زنها» لغيره (cfNorm).
var CF_G = [
  ['file', 'الملف', 'user', ['client', 'med', 'link']],
  ['plan', 'الخطة', 'utensils', ['plan', 'ver']],
  ['follow', 'المتابعة', 'activity', ['ci', 'day', 'ph', 'chal']],
  ['appt', 'المواعيد', 'calendar', ['appt']],
  ['sub', 'الاشتراك', 'card', ['sub']]
];
var CF_L = { client: 'البيانات', med: 'الملف الطبي', link: 'ربط زنها', plan: 'الخطة', ver: 'الإصدارات', ci: 'الحضور', day: 'المتابعة اليومية', ph: 'صور الوجبات', chal: 'التحديات' };
function cfGroup(t) { for (var i = 0; i < CF_G.length; i++) if (CF_G[i][3].indexOf(t) >= 0) return CF_G[i]; return CF_G[0]; }
function cfNorm(v, c) {                                            // توافق خلفي: أسماء التبويبات القديمة وأسماء المجموعات تقود إلى القسم الصحيح
  if (v === 'hx' || v === 'zenha') return c && c.hx ? 'day' : 'link';
  if (v === 'file') return 'client'; if (v === 'follow') return 'ci';
  return CF_L[v] || v === 'appt' || v === 'sub' ? v : 'client';
}
function cfNb(n) { return n ? ' <em class="hxnb">' + n + '</em>' : ''; }
function cfBadge(c, k) {                                            // عدّاد كل قسم (نفس مصادر الشارات القديمة)
  var x = c.hx || {};
  if (k === 'med') return medAlerts(c).filter(function (a) { return a.lvl > 1; }).length;
  if (k === 'link') return x.health ? 1 : 0;
  if (k === 'ph') return x.phNew || 0;
  if (k === 'appt') return (c.appts || []).filter(function (a) { return !a.st && a.d === wkDay(); }).length;
  if (k === 'sub') { var s = sbState(c)[0]; return s === 'soon' || s === 'last' || s === 'expired' ? '!' : 0; }
  return 0;
}
function cfGBadge(c, g) { var n = 0, mark = ''; g[3].forEach(function (k) { var b = cfBadge(c, k); if (b === '!') mark = '!'; else n += b; }); return n || mark; }
function cfHead(c) {
  var st = sbState(c), x = c.hx, un = x ? x.unread || 0 : 0;
  var zen = x ? 'مرتبط' + (x.planV ? ' • أُرسل v' + x.planV : ' • لم تُرسل خطة') : 'غير مرتبط';
  return '<div class="cfhead"><span class="cav">' + esc(initial(c.name)) + '</span>'
    + '<div class="cfid"><b class="cfname">' + esc(c.name || 'عميل بلا اسم') + '</b><small>' + esc(c.code) + ' • ' + (c.kind === 'athlete' ? 'نظام الجرامات' : 'نظام الحصص') + '</small></div>'
    + '<div class="cfbadges"><button class="cfb cfsub ' + st[2] + '" data-a="tab" data-v="sub" title="الاشتراك">' + IC('card') + '<span>' + esc(st[1]) + '</span></button>'
    + '<button class="cfb cfzen ' + (x ? 'ok' : 'n') + '" data-a="tab" data-v="link" title="إدارة ربط «زنها»">' + IC('phone') + '<span>زنها: ' + zen + '</span>' + (x && x.health ? '<em class="hxnb">!</em>' : '') + '</button></div>'
    + '<div class="cfact">' + (x ? '<button class="sec cfchk" data-a="hxCheck" title="تحقق من «زنها» الآن" aria-label="تحقق من زنها الآن">' + IC('repeat') + '</button>' : '') + (x && hxHasPlan(c) ? '<button class="cfsend" data-a="hxSendPlan">' + IC('send') + '<span>أرسل الخطة إلى زنها</span></button>' : '')
    + (x ? '<button class="sec cfchat" data-a="cfChat" title="افتح محادثة العميل في «شات زنها»">' + IC('message') + '<span>افتح المحادثة</span>' + (un ? '<em class="hxnb">' + un + '</em>' : '') + '</button>' : '')
    + '<details class="tbm cmore"><summary class="sec sm" aria-label="المزيد من إجراءات العميل" title="المزيد">' + IC('more') + '</summary><div class="tbp">'
    + '<button data-a="tab" data-v="link">' + IC('phone') + ' إدارة ربط «زنها»</button><button class="r" data-a="del">' + IC('trash') + ' حذف العميل</button></div></details></div></div>';
}
function cfTabs(c) {
  var g0 = cfGroup(S.tab);
  return '<div class="tabs ctabs cftabs" role="tablist" aria-label="أقسام ملف العميل">' + CF_G.map(function (g) {
    var on = g === g0; return '<button role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '" data-a="tab" data-v="' + g[3][0] + '" data-g="' + g[0] + '">' + IC(g[2]) + '<span>' + g[1] + '</span>' + cfNb(cfGBadge(c, g)) + '</button>';
  }).join('') + '</div>';
}
function cfSeg(c) {
  var g = cfGroup(S.tab); if (g[3].length < 2) return '';
  return '<div class="cfseg" role="tablist" aria-label="أقسام ' + g[1] + '">' + g[3].map(function (k) {
    var on = S.tab === k; return '<button role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '" data-a="tab" data-v="' + k + '">' + CF_L[k] + (k === 'ver' ? ' (' + S.versions.length + ')' : '') + cfNb(cfBadge(c, k)) + '</button>';
  }).join('') + '</div>';
}
function cfNeed(t, d) { return '<div class="ucard cfneed"><h3>' + t + '</h3><p class="small">' + d + ' تظهر هنا بعد ربط العميل بـ«زنها».</p><p><button class="sec" data-a="tab" data-v="link">ربط العميل بـ«زنها»</button></p></div>'; }
function cfBody(c) {
  var t = S.tab, x = c.hx;
  if (t === 'client') return clientTab(c);
  if (t === 'med') return medTab(c);
  if (t === 'link') return x ? '<div class="hxtab cflink">' + hxLinkCard(c) + hxGateCard(c) + '</div>' : hxEmptyTab(c);
  if (t === 'plan') return planTab(c);
  if (t === 'ver') return verTab(c);
  if (t === 'ci') return ciTab(c);
  if (t === 'day') return x ? '<div class="hxtab cfday">' + hxLastLine() + hxDayCards(c) + '</div>' : cfNeed('المتابعة اليومية', 'ما يسجّله العميل كل يوم (الوجبات والماء والعادات والوزن).');
  if (t === 'ph') return x ? '<div class="hxtab cfph">' + hxLastLine() + phCard(c) + '</div>' : cfNeed('صور الوجبات', 'صور الوجبات التي يرسلها العميل لتعلّق عليها.');
  if (t === 'chal') return x ? '<div class="hxtab cfchal">' + chCard(c) + '</div>' : cfNeed('التحديات', 'برامج التحديات الأسبوعية وشهادات التقدير.');
  if (t === 'appt') return wkApptTab(c);
  return subTab(c);
}
function cfPage(c) {
  S.tab = cfNorm(S.tab, c);
  if (S.tab === 'ph' && c.hx && c.hx.phNew) { c.hx.phNew = 0; persist(c); setTimeout(function () { if (typeof hxRail === 'function') hxRail(); }, 0); }   // فُتح قسم الصور: لا جديد بعد الآن
  return cfHead(c) + cfTabs(c) + cfSeg(c) + hxHealthWarn(c) + '<div class="cfbody" data-tab="' + S.tab + '">' + cfBody(c) + '</div>';
}
function cfCenter() {                                               // التبويب المفعّل في منتصف الشريط الأفقي (الجوال)
  [].forEach.call(document.querySelectorAll('main .cftabs, main .cfseg'), function (s) {
    var on = s.querySelector('.on'); if (!on || s.scrollWidth <= s.clientWidth + 1) return; var a = on.getBoundingClientRect(), b = s.getBoundingClientRect(); s.scrollLeft += (a.left + a.width / 2) - (b.left + b.width / 2);
  });
}
// الاستقبال الدوري من «زنها»: أقسام «زنها» تُعاد كاملة، وباقي الأقسام يُحدَّث رأسها وشاراتها فقط حتى لا يضيع ما يُكتب في النماذج
function cfLive() {
  var c = cur(); if (!c || S.view !== 'client') return false; if (S.tab === 'link' || S.tab === 'day' || S.tab === 'ph' || S.tab === 'chal') return true;
  var h = $('main .cfhead'), t = $('main .cftabs'), g = $('main .cfseg'), d = document.createElement('div');
  if (h && !h.querySelector('details[open]')) { d.innerHTML = cfHead(c); h.parentNode.replaceChild(d.firstChild, h); }
  if (t) { var sl = t.scrollLeft; d.innerHTML = cfTabs(c); t.parentNode.replaceChild(d.firstChild, t); $('main .cftabs').scrollLeft = sl; }
  if (g) { d.innerHTML = cfSeg(c); if (d.firstChild) g.parentNode.replaceChild(d.firstChild, g); }
  return false;
}
Object.assign(A, {
  cfChat: function (v) { var c = v ? S.clients.filter(function (x) { return x.code === v; })[0] : cur(); if (!c || !c.hx) return; var code = c.code; A.zchat(); A.czOpen(code); window.scrollTo(0, 0); }
});
(function (f) {
  A.tab = function (v) {
    var c = cur(), g0 = cfGroup(S.tab), r = f.call(this, cfNorm(v, c)), t = $('main .cftabs');
    if (c && t && cfGroup(S.tab) !== g0 && getComputedStyle(t).position === 'sticky') { var top = parseFloat(getComputedStyle(t).top) || 0, y = t.getBoundingClientRect().top; if (y <= top + 1) { var hd = $('main .cfhead'); window.scrollTo(0, Math.max(0, window.scrollY + (hd ? hd.getBoundingClientRect().bottom : 0) - top)); } }
    return r;
  };
})(A.tab);
(function (f) { main0 = function () { var r = f.apply(this, arguments); if (S.view === 'client' && cur()) cfCenter(); return r; }; })(main0);
document.addEventListener('input', function (e) { var t = e.target; if (t && t.dataset && t.dataset.f === 'name') { var n = $('main .cfname'), a = $('main .cfhead .cav'); if (n) n.textContent = t.value.trim() || 'عميل بلا اسم'; if (a) a.textContent = initial(t.value); } });
