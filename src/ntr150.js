// ================= 1.50 (طلب المالك): «اليوم» والهيكل بنمط لوحة Nutrium المرجعية (فيديو المالك) مكيّفة لزنها Pro عربياً RTL.
// الهيكل: شريط جانبي مسطّح على خلفية الصفحة بزر طيّ (أيقونات فقط)، ترويسة بلا شريط فيها التحية، ولوحة محتوى بيضاء بزاوية مستديرة عند الشريط.
// الرئيسية: شريط تنبيه (النسخ الاحتياطي)، عمود «الموعد التالي» + «مواعيد اليوم»، وعمود «إحصاءاتي» 2×2 + تبويبات (يحتاج اهتمامك / النشاطات / الاشتراكات).
// بيانات زنها الحقيقية فقط (نفس الدوال)، بلا أرقام مختلقة. يُدمج داخل app.js بعد pro148.js.
var NTR = { tab: 'att' };
function ntrGreet() { var h = new Date().getHours(); return h < 12 ? 'صباح الخير' : 'مساء الخير'; }
function ntrMini() { try { return localStorage.getItem('zn_navmini') === '1'; } catch (e) { return false; } }
(function () { if (ntrMini()) document.documentElement.classList.add('ntrmini'); })();
function ntrApptCard(cs, n) {
  var ap = zhTodayAppts(), now = new Date(), hm = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2), nx = ap.filter(function (x) { return !x.a.t || x.a.t >= hm; })[0] || ap[0];
  if (nx) {
    var c = nx.c, d = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
    return '<section class="ntrsec"><h2 class="ntrh">' + (nx.a.t && nx.a.t <= hm ? 'الموعد الجاري' : 'الموعد التالي') + '</h2><div class="ntrappt"><div class="ntrwho"><span class="ntrav">' + esc(initial(c.name)) + '</span><div><b>' + esc(c.name || c.code) + '</b><span>' + esc(d) + (nx.a.t ? ' | ' + esc(nx.a.t) : '') + ' — ' + esc(nx.a.type || 'متابعة') + '</span></div></div>'
      + '<button class="ntrbtn pri" data-a="wkOpen" data-v="' + esc(c.code) + '">افتح ملف العميل</button><button class="ntrbtn ghost" data-a="appts">كل المواعيد</button></div></section>';
  }
  var x = zhNext(cs, n);
  if (x) return '<section class="ntrsec"><h2 class="ntrh">التالي الآن</h2><div class="ntrappt"><div class="ntrwho"><span class="ntrav ic">' + IC(x.k) + '</span><div><b>' + esc(x.t) + '</b><span>' + esc(x.d) + '</span></div></div><button class="ntrbtn pri" data-a="' + x.a + '"' + (x.v ? ' data-v="' + esc(x.v) + '"' : '') + '>' + esc(x.b) + '</button><button class="ntrbtn ghost" data-a="appts">المواعيد</button></div></section>';
  return '<section class="ntrsec"><h2 class="ntrh">الموعد التالي</h2><div class="ntrempty">' + IC('calendar') + '<span>لا مواعيد اليوم</span><button class="ntrbtn ghost sm" data-a="appts">أضف موعداً</button></div></section>';
}
function ntrTodayList() {
  var ap = zhTodayAppts();
  return '<section class="ntrsec"><div class="ntrhrow"><h2 class="ntrh">مواعيد اليوم</h2><button class="ntrlink" data-a="appts">افتح التقويم ' + IC('chevron') + '</button></div>'
    + (ap.length ? '<ul class="ntrlist">' + ap.slice(0, 6).map(function (x) { return '<li><button data-a="wkOpen" data-v="' + esc(x.c.code) + '"><span class="ntrdot"></span><span class="ntrav sm">' + esc(initial(x.c.name)) + '</span><span class="ntrli"><b>' + esc(x.c.name || x.c.code) + '</b><small>' + esc(x.a.type || 'متابعة') + '</small></span><time>' + esc(x.a.t || '—') + '</time></button></li>'; }).join('') + '</ul>'
      : '<div class="ntrempty">' + IC('calendar') + '<span>القائمة فارغة</span></div>') + '</section>';
}
function ntrStats(cs, withPlan, n, fu) {
  var since = Date.now() - 30 * 864e5, nw = cs.filter(function (c) { return (c.created || 0) >= since; }).length, z = typeof zsCounts === 'function' ? zsCounts() : { act: 0 };
  var st = function (a, ic, tone, v, label, pill) { return '<button class="ntrstat" data-a="' + a + '"><span class="ntrti t-' + tone + '">' + IC(ic) + '</span><span class="ntrsv"><b>' + v + (pill ? ' <em>' + pill + '</em>' : '') + '</b><small>' + label + '</small></span></button>'; };
  var d = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  return '<section class="ntrsec"><div class="ntrhrow"><div><h2 class="ntrh">إحصاءاتي</h2><small class="ntrsub">' + esc(d) + '</small></div></div><div class="ntrstats">'
    + st('clients', 'users', 'violet', cs.length, 'إجمالي العملاء', nw ? '+' + nw + ' هذا الشهر' : '')
    + st('clients', 'file', 'blue', withPlan, 'الخطط النشطة', '')
    + st('subs', 'card', 'green', z.act, 'اشتراكات سارية', '')
    + st('zchat', 'message', 'amber', n.chat + n.reqAll, 'رسائل وطلبات جديدة', '') + '</div></section>';
}
function ntrTabs() {
  var t = NTR.tab, tb = function (k, ic, l) { return '<button role="tab" aria-selected="' + (t === k) + '" class="' + (t === k ? 'on' : '') + '" data-a="ntrTab" data-v="' + k + '">' + IC(ic) + l + '</button>'; };
  var body = t === 'act' ? (typeof zaCard === 'function' ? zaCard() : '') : t === 'sub' ? (typeof zsCard === 'function' ? zsCard() : '') : wkToday();
  return '<section class="ntrsec ntrtabs"><div class="ntrtl" role="tablist">' + tb('att', 'sunrise', 'يحتاج اهتمامك') + tb('act', 'history', 'آخر النشاطات') + tb('sub', 'card', 'الاشتراكات') + '</div><div class="ntrtp" role="tabpanel">' + body + '</div></section>';
}
function ntrHome() {
  var cs = S.clients.slice(), n = navCounts(), withPlan = zhActivePlans(), fu = zhFollowToday(), bk = typeof bakCard === 'function' ? bakCard() : '';
  var banner = bk ? '<div class="ntrbanner" role="status">' + IC('alert') + '<span>' + (bakAge() < 0 ? 'لم تأخذ نسخة احتياطية بعد' : 'آخر نسخة احتياطية منذ ' + bakAge() + ' يوماً') + ': بيانات ' + cs.length + ' عميل محفوظة في هذا المتصفح فقط.</span><button class="ntrbtn pri sm" data-a="export">نسخة احتياطية الآن</button><button class="ntrbtn ghost sm" data-a="bakLater">ذكّرني بعد 3 أيام</button></div>' : '';
  if (!cs.length) return '<div class="home ghome ntr">' + '<div class="ntrcols one"><section class="ntrsec"><h2 class="ntrh">ابدأ بأول عميل</h2><div class="ntrempty big">' + IC('users') + '<span>أضف عميلاً لتبني خطته، وستظهر هنا مواعيده ورسائله ومتابعاته.</span>' + newMenu() + '</div></section></div>' + vtHomeCard() + proInstCard() + appCard() + '</div>';
  return '<div class="home ghome ntr">' + banner + '<div class="ntrcols"><div class="ntrc">' + ntrApptCard(cs, n) + ntrTodayList() + '</div><div class="ntrc">' + ntrStats(cs, withPlan, n, fu) + ntrTabs() + '</div></div>' + vtHomeCard() + proInstCard() + appCard() + '</div>';
}
homeGlass = (function (f) { return function () { return document.documentElement.dataset.theme === 'glass' ? ntrHome() : f.apply(this, arguments); }; })(homeGlass);
header = (function (f) { return function () {
  f.apply(this, arguments); var h = document.getElementById('hd'); if (!h || h.querySelector('.ntrg')) return;
  var nm = zhName(), g = '<button class="ntrcol" data-a="navMini" aria-label="' + (ntrMini() ? 'وسّع القائمة' : 'اطوِ القائمة') + '" title="' + (ntrMini() ? 'وسّع القائمة' : 'اطوِ القائمة') + '">' + IC('chevron') + '</button><span class="ntrg">' + ntrGreet() + (nm ? '، ' + esc(nm) : '') + '</span>';
  var lg = h.querySelector('.hlogo'); if (lg) lg.insertAdjacentHTML('afterend', g); else h.insertAdjacentHTML('afterbegin', g);
}; })(header);
A.navMini = function () { var on = !ntrMini(); try { localStorage.setItem('zn_navmini', on ? '1' : '0'); } catch (e) { } document.documentElement.classList.toggle('ntrmini', on); header(); };
A.ntrTab = function (v) { NTR.tab = v; main(); };
