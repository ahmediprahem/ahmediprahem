// ================= هيكل الواجهة في الثيم الزجاجي (يُدمج داخل app.js عند /*SHELLUI*/)
// شريط تنقل بأيقونات (يمين) + عمود العملاء + المحتوى، وصفحة رئيسية ترحيبية، وشريط سفلي على الجوال.
// نفس أزرار data-a ونفس المعرّفات (#q #lst #imp) كالقالبين الآخرين، فلا يتغير أي سلوك؛ يتغير الترتيب والشكل فقط.
var IC = function (n) { return window.HIcon ? HIcon.svg(n) : ''; };
function railBtn(a, icon, label, on, v) { return '<button class="sec sidebtn' + (on ? ' on' : '') + '" data-a="' + a + '"' + (v ? ' data-v="' + v + '"' : '') + (on ? ' aria-current="page"' : '') + '>' + IC(icon) + '<span>' + label + '</span></button>'; }
function glassSide() {
  var home = S.view === 'client' && !S.cur, admin = S.mode === 'admin';
  var clx = (!home && !S.clOpen) || !S.clients.length; document.body.classList.toggle('clx', clx);        // 0.46: لا عمود عملاء فارغ قبل أول عميل؛ عمود العملاء يُطوى تلقائياً خارج الرئيسية ليتسع المحتوى (الخطة والجداول)، ويُفتح من «العملاء»
  var rail = '<nav class="rail" aria-label="التنقل"><p class="two newc"><button data-a="new" data-v="ex" title="عميل جديد بنظام الحصص">+ عميل جديد — الحصص</button><button class="o" data-a="new" data-v="ath" title="عميل جديد بنظام الجرامات">+ عميل جديد — الجرامات</button></p>'
    + railBtn('home', 'home', 'الرئيسية', home) + (home ? '' : '<button class="sec sidebtn cltog' + (clx ? '' : ' on') + '" data-a="clToggle" aria-expanded="' + (!clx) + '">' + IC('users') + '<span>العملاء</span><em>' + S.clients.length + '</em></button>') + railBtn('bank', 'book', 'بنك الوجبات', S.view === 'bank') + railBtn('ready', 'package', 'الخطط الجاهزة', S.view === 'ready' || S.view === 'lib') + railBtn('hxv', 'phone', 'طلبات حصتي', S.view === 'hx').replace('</span></button>', '</span><em class="hxnb"></em></button>') + railBtn('appts', 'calendar', 'المواعيد', S.view === 'appts').replace('</span></button>', '</span><em class="hxnb"></em></button>') + railBtn('feed', 'megaphone', 'التثقيف', S.view === 'feed').replace('</span></button>', '</span><em class="hxnb"></em></button>') + railBtn('settings', 'settings', 'إعدادات النظام', S.view === 'settings')
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
  t.innerHTML = it('home', 'home', 'الرئيسية', home) + it('menu', 'users', 'العملاء', menu || (v === 'client' && !!S.cur)) + it('bank', 'book', 'بنك الوجبات', v === 'bank' && !menu) + it('settings', 'settings', 'الإعدادات', v === 'settings' && !menu);
}
function firstName() { return String(CFG.userLabel || '').replace(/^المدير:\s*/, '').trim(); }
function homeGlass() {
  var cs = S.clients.slice().sort(function (a, b) { return (b.updated || b.created) - (a.updated || a.created); }), withPlan = cs.filter(function (c) { return c.plan || c.planSrc === 'ready'; }).length, ath = cs.filter(function (c) { return c.kind === 'athlete'; }).length;
  var tile = function (a, v, icon, t, d) { return '<button class="qa" data-a="' + a + '"' + (v ? ' data-v="' + v + '"' : '') + '><span class="qai">' + IC(icon) + '</span><b>' + t + '</b><small>' + d + '</small></button>'; };
  var recent = cs.slice(0, 6).map(function (c) { return '<div class="cl" data-a="pick" data-v="' + c.code + '"><span class="cav">' + esc(initial(c.name)) + '</span><b>' + esc(c.name || '(بلا اسم)') + '</b><small>' + c.code + (c.phone ? ' • ' + esc(c.phone) : '') + (c.plan ? ' • له خطة' : '') + '</small></div>'; }).join('');
  return '<div class="home ghome">'
    + '<section class="hero"><div class="herot"><h2>أهلاً بك' + (firstName() ? '، ' + esc(firstName()) : '') + '</h2><p>اختر عميلاً أو ابدأ خطة جديدة. كل بياناتك محفوظة ومشفّرة على هذا الجهاز.</p></div>' + (window.HK ? HK.splashHtml(HK.gateCfg(), 'splash') : '') + '</section>'
    + wkToday() + '<div class="stats"><div><b>' + cs.length + '</b><small>عميل</small></div><div><b>' + withPlan + '</b><small>له خطة</small></div><div><b>' + ath + '</b><small>بالجرامات</small></div></div>'
    + '<div class="qgrid">' + tile('new', 'ex', 'userPlus', 'نظام الحصص', 'عميل جديد: خطة بالحصص والبدائل') + tile('new', 'ath', 'dumbbell', 'نظام الجرامات', 'عميل جديد: خطة بالجرام والماكروز') + tile('bank', '', 'book', 'بنك الوجبات', 'وجبات المولّد وابتكار وجبة') + tile('ready', '', 'package', 'الخطط الجاهزة', 'خطط أسبوعية من مكتبتك + مكتبة الأخصائي') + tile('appts', '', 'calendar', 'المواعيد', 'مواعيد اليوم والأسبوع والمتابعات') + tile('hxv', '', 'phone', 'حصتي', 'ادعُ عميلاً برابط واتساب واستقبل طلباته') + tile('feed', '', 'megaphone', 'التثقيف', 'انشر نصائح وفيديوهات لمراجعيك') + tile('settings', '', 'settings', 'إعدادات النظام', 'الألوان والبدائل والشعار والمظهر') + '</div>'
    + (recent ? '<h3>آخر العملاء</h3><div class="recent">' + recent + '</div>' : '<p class="small">لا عملاء بعد — ابدأ بـ«عميل جديد».</p>')
    + '<p class="two mobonly"><button data-a="new" data-v="ex">+ عميل جديد — الحصص</button><button class="o" data-a="new" data-v="ath">+ عميل جديد — الجرامات</button></p>'
    + bakCard() + vtHomeCard() + appCard() + '</div>';
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
    else if (v === 'lib') A.lib();
    else if (v === 'ready') A.ready();
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
// ---- 0.47: قوائم شريط الخطة وقائمة «⋯» للصنف: تُغلق بعد الاختيار أو بالنقر خارجها
document.addEventListener('click', function (e) {
  var t = e.target, own = t.closest ? t.closest('details.tbm, details.im') : null;
  [].forEach.call(document.querySelectorAll('details.tbm[open], details.im[open]'), function (d) { if (d !== own) d.open = false; });
  if (own && t.closest('.tbp, .imx') && t.closest('button')) setTimeout(function () { own.open = false; }, 0);
}, true);
// ---- 0.47: أزرار رفع ملفات بالعربية بدل «Choose File / No file chosen» (الحقل الأصلي يبقى ويُخفى)
function fpkLabel(i) { var a = i.getAttribute('accept') || ''; return /^image/.test(a) ? '🖼 اختر صورة' : /^video/.test(a) ? '🎬 اختر فيديو' : '📎 اختر ملفاً'; }
function fpkWrap() {
  [].forEach.call(document.querySelectorAll('input[type=file]:not([hidden]):not(.hide):not([data-fpk])'), function (i) {
    var s = document.createElement('span'); i.setAttribute('data-fpk', '1'); i.classList.add('fpki'); s.className = 'fpk';
    s.innerHTML = '<button type="button" class="sec sm" data-fpkb>' + fpkLabel(i) + '</button> <small class="fpkn">لم يُختر ملف</small>';
    i.parentNode.insertBefore(s, i.nextSibling);
  });
}
if (window.MutationObserver && document.body) new MutationObserver(fpkWrap).observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-fpkb]'), i = b && b.parentNode.previousSibling; if (i && i.click) i.click(); });
document.addEventListener('change', function (e) {
  var i = e.target, n = i.getAttribute && i.getAttribute('data-fpk') && i.nextSibling && i.nextSibling.querySelector && i.nextSibling.querySelector('.fpkn');
  if (n) n.textContent = i.files && i.files.length ? (i.files.length > 1 ? i.files.length + ' ملفات' : i.files[0].name) : 'لم يُختر ملف';
}, true);
// ---- 0.48: تذكير النسخة الاحتياطية في الرئيسية (للبيانات المحفوظة في المتصفح فقط، ويختفي مع النسخ التلقائي المفعّل)
function bakAge() { var t = 0; try { t = +localStorage.getItem('hissa_lastbak') || 0; } catch (e) { } return t ? Math.floor((Date.now() - t) / 864e5) : -1; }
function bakCard() {
  var d = bakAge(), snz = 0; try { snz = +localStorage.getItem('hissa_baksnooze') || 0; } catch (e) { }
  if (!S.clients.length || (typeof VT !== 'undefined' && VT.st && VT.st.on) || (d >= 0 && d < 7) || snz > Date.now()) return '';
  return '<div class="ucard bakrem"><b>💾 ' + (d < 0 ? 'لم تأخذ نسخة احتياطية بعد' : 'آخر نسخة احتياطية منذ ' + d + ' يوماً') + '</b><p class="small">بيانات ' + S.clients.length + ' عميل محفوظة في هذا المتصفح فقط؛ مسح بيانات المتصفح يضيّعها.</p><p><button class="sm" data-a="export">نسخة احتياطية الآن</button> <button class="sec sm" data-a="bakLater">ذكّرني بعد 3 أيام</button></p></div>';
}
A.bakLater = function () { try { localStorage.setItem('hissa_baksnooze', String(Date.now() + 3 * 864e5)); } catch (e) { } main(); };
(function (f) { A.export = function () { var r = f.apply(this, arguments); setTimeout(function () { if (S.view === 'client' && !S.cur) main(); }, 300); return r; }; })(A.export);
