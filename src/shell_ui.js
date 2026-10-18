// ================= هيكل الواجهة في الثيم الزجاجي (يُدمج داخل app.js عند /*SHELLUI*/)
// شريط تنقل بأيقونات (يمين) + عمود العملاء + المحتوى، وصفحة رئيسية ترحيبية، وشريط سفلي على الجوال.
// نفس أزرار data-a ونفس المعرّفات (#q #lst #imp) كالقالبين الآخرين، فلا يتغير أي سلوك؛ يتغير الترتيب والشكل فقط.
var IC = function (n) { return window.HIcon ? HIcon.svg(n) : ''; };
function railBtn(a, icon, label, on, v) { return '<button class="sec sidebtn' + (on ? ' on' : '') + '" data-a="' + a + '"' + (v ? ' data-v="' + v + '"' : '') + (on ? ' aria-current="page"' : '') + '>' + IC(icon) + '<span>' + label + '</span></button>'; }
function glassSide() {
  var home = S.view === 'client' && !S.cur, admin = S.mode === 'admin';
  var clx = !home && !S.clOpen; document.body.classList.toggle('clx', clx);        // عمود العملاء يُطوى تلقائياً خارج الرئيسية ليتسع المحتوى (الخطة والجداول)، ويُفتح من «العملاء»
  var rail = '<nav class="rail" aria-label="التنقل"><p class="two newc"><button data-a="new" data-v="ex" title="عميل جديد">+ عميل جديد</button><button class="o" data-a="new" data-v="ath" title="عميل رياضي">+ عميل رياضي</button></p>'
    + railBtn('home', 'home', 'الرئيسية', home) + (home ? '' : '<button class="sec sidebtn cltog' + (clx ? '' : ' on') + '" data-a="clToggle" aria-expanded="' + (!clx) + '">' + IC('users') + '<span>العملاء</span><em>' + S.clients.length + '</em></button>') + railBtn('bank', 'book', 'محرر الحصص', S.view === 'bank') + railBtn('hxv', 'phone', 'طلبات حصتي', S.view === 'hx').replace('</span></button>', '</span><em class="hxnb"></em></button>') + railBtn('settings', 'settings', 'إعدادات النظام', S.view === 'settings')
    + (admin ? '<div class="sbg' + sbc('tools') + '" data-g="tools"><button class="sbh" data-a="sbg" data-v="tools" aria-expanded="' + (SBG.tools === 0 ? 'false' : 'true') + '">أدوات الإدارة <i>' + IC('chevron') + '</i></button><div class="sbb">'
      + railBtn('users', 'users', 'المستخدمون والأجهزة', S.view === 'users') + railBtn('exportUsers', 'package', 'تصدير نسخة المستخدمين') + railBtn('exportSite', 'globe', 'تصدير موقع للنشر (ZIP)') + '</div></div>' : '')
    + '<div class="sbg' + sbc('bak') + '" data-g="bak"><button class="sbh" data-a="sbg" data-v="bak" aria-expanded="' + (SBG.bak === 0 ? 'false' : 'true') + '">النسخ الاحتياطي <i>' + IC('chevron') + '</i></button><div class="sbb">'
    + railBtn('export', 'download', 'نسخة احتياطية') + railBtn('import', 'upload', 'استرجاع') + '<input type="file" id="imp" accept=".json" class="hide"><p class="small">البيانات محفوظة داخل هذا المتصفح فقط. خذ نسخة احتياطية دورياً.</p></div></div>'
    + '</nav>';
  var cls = '<section class="clients" aria-label="العملاء"><div class="clh"><b>العملاء</b><span class="cnt">' + S.clients.length + '</span></div>'
    + '<label class="srch">' + IC('search') + '<input id="q" placeholder="بحث بالاسم أو الكود أو الجوال" oninput="DPApp.relist()" aria-label="بحث في العملاء"></label>'
    + '<div id="lst">' + list() + '</div></section>';
  $('aside').innerHTML = rail + cls; tabbar();
}
function tabbar() {                                                // شريط سفلي للجوال (يظهر بالـ CSS على الشاشات الصغيرة في الثيم الزجاجي فقط)
  var t = $('#tabbar'); if (!t) { t = document.createElement('nav'); t.id = 'tabbar'; t.setAttribute('aria-label', 'التنقل السريع'); document.body.appendChild(t); }
  var menu = document.body.classList.contains('menu'), v = S.view, home = v === 'client' && !S.cur && !menu;
  var it = function (a, icon, label, on) { return '<button data-a="nav" data-v="' + a + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + IC(icon) + '<span>' + label + '</span></button>'; };
  t.innerHTML = it('home', 'home', 'الرئيسية', home) + it('menu', 'users', 'العملاء', menu || (v === 'client' && !!S.cur)) + it('bank', 'book', 'محرر الحصص', v === 'bank' && !menu) + it('settings', 'settings', 'الإعدادات', v === 'settings' && !menu);
}
function firstName() { return String(CFG.userLabel || '').replace(/^المدير:\s*/, '').trim(); }
function homeGlass() {
  var cs = S.clients.slice().sort(function (a, b) { return (b.updated || b.created) - (a.updated || a.created); }), withPlan = cs.filter(function (c) { return c.plan; }).length, ath = cs.filter(function (c) { return c.kind === 'athlete'; }).length;
  var tile = function (a, v, icon, t, d) { return '<button class="qa" data-a="' + a + '"' + (v ? ' data-v="' + v + '"' : '') + '><span class="qai">' + IC(icon) + '</span><b>' + t + '</b><small>' + d + '</small></button>'; };
  var recent = cs.slice(0, 6).map(function (c) { return '<div class="cl" data-a="pick" data-v="' + c.code + '"><span class="cav">' + esc(initial(c.name)) + '</span><b>' + esc(c.name || '(بلا اسم)') + '</b><small>' + c.code + (c.phone ? ' • ' + esc(c.phone) : '') + (c.plan ? ' • له خطة' : '') + '</small></div>'; }).join('');
  return '<div class="home ghome">'
    + '<section class="hero"><div class="herot"><h2>أهلاً بك' + (firstName() ? '، ' + esc(firstName()) : '') + '</h2><p>اختر عميلاً أو ابدأ خطة جديدة. كل بياناتك محفوظة ومشفّرة على هذا الجهاز.</p></div>' + (window.HK ? HK.splashHtml(HK.gateCfg(), 'splash') : '') + '</section>'
    + '<div class="stats"><div><b>' + cs.length + '</b><small>عميل</small></div><div><b>' + withPlan + '</b><small>له خطة</small></div><div><b>' + ath + '</b><small>رياضي</small></div></div>'
    + '<div class="qgrid">' + tile('new', 'ex', 'userPlus', 'عميل جديد', 'خطة بنظام الحصص والبدائل') + tile('new', 'ath', 'dumbbell', 'عميل رياضي', 'خطة بالجرام حسب التدريب') + tile('bank', '', 'book', 'محرر الحصص', 'بنك الوجبات وابتكار وجبة') + tile('hxv', '', 'phone', 'حصتي', 'ادعُ عميلاً برابط واتساب واستقبل طلباته') + tile('settings', '', 'settings', 'إعدادات النظام', 'الألوان والبدائل والشعار والمظهر') + '</div>'
    + (recent ? '<h3>آخر العملاء</h3><div class="recent">' + recent + '</div>' : '<p class="small">لا عملاء بعد — ابدأ بـ«عميل جديد».</p>')
    + '<p class="two mobonly"><button data-a="new" data-v="ex">+ إنشاء عميل حصص</button><button class="o" data-a="new" data-v="ath">+ عميل رياضي</button></p>'
    + appCard() + '</div>';
}
function initial(n) { n = String(n || '').trim(); return n ? n.charAt(0) : '؟'; }
Object.assign(A, {
  clToggle: function () { S.clOpen = !S.clOpen; sidebar(); var q = S.clOpen && $('#q'); if (q && !matchMedia('(max-width:900px)').matches) q.focus(); },
  home: function () { S.view = 'client'; S.cur = null; document.body.classList.remove('menu'); render(); window.scrollTo(0, 0); },
  nav: function (v) {
    if (v === 'menu') { A.menu(); return; }
    document.body.classList.remove('menu');
    if (v === 'home') return A.home();
    if (v === 'settings') { S.view = 'settings'; render(); }
    else if (v === 'bank') A.bank();
    window.scrollTo(0, 0);
  }
});
document.addEventListener('input', function (e) {                // بحث الترويسة = بحث العملاء نفسه
  if (e.target && e.target.id === 'hq') { var q = $('#q'); if (q) { q.value = e.target.value; DPApp.relist(); } if (matchMedia('(max-width:900px)').matches && !document.body.classList.contains('menu')) A.menu(); }
});
(function (f) { A.menu = function () { var r = f.apply(this, arguments); if (isGlass()) tabbar(); return r; }; })(A.menu);
['pick', 'new', 'users'].forEach(function (k) {                // على الجوال: اختيار عميل أو صفحة يغلق درج القائمة فيظهر المحتوى مباشرة
  var f = A[k]; if (f) A[k] = function () { if (isGlass()) { document.body.classList.remove('menu'); window.scrollTo(0, 0); } return f.apply(this, arguments); };
});
