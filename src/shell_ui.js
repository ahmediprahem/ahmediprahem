// ================= هيكل الواجهة في الثيم الزجاجي (يُدمج داخل app.js عند /*SHELLUI*/)
// 0.94: التنقل خمسة أقسام: اليوم | العملاء | شات زنها (ومعها طلبات زنها) | المكتبة (بنك الوجبات، الخطط الجاهزة، التثقيف) | الإدارة (المواعيد، الاشتراكات، الإعدادات).
// شريط جانبي على الويب، وشريط سفلي على الجوال (اليوم، العملاء، شات زنها، المكتبة، المزيد). «العملاء» صفحة (قائمة + بحث + زر واحد «عميل جديد»)، وأدوات الإدارة والنسخ داخل الإعدادات.
// لا يتغير أي منطق: نفس الإجراءات (data-a) ونفس المعرّفات (#q #lst #imp #impc)؛ تتغير الأماكن والتسميات والترتيب فقط.
var IC = function (n) { return window.HIcon ? HIcon.svg(n) : ''; };
function railBtn(a, icon, label, on, badge) { return '<button class="sec sidebtn' + (on ? ' on' : '') + '" data-a="' + a + '" title="' + label + '"' + (on ? ' aria-current="page"' : '') + '>' + IC(icon) + '<span>' + label + '</span>' + (badge ? '<em class="hxnb"></em>' : '') + '</button>'; }
function navIs() {                                               // أي قسم من الخمسة نشط الآن
  var v = S.view, c = v === 'client';
  return { today: c && !S.cur, clients: v === 'clients' || (c && !!S.cur), chat: v === 'chat' || v === 'hx', lib: v === 'bank' || v === 'ready' || v === 'lib' || v === 'feed', admin: v === 'appts' || v === 'subs' || v === 'settings' || v === 'users' || v === 'more' };
}
function navCounts() {                                           // أعداد ما ينتظر الأخصائي (للشارات ولملخص «اليوم»)
  var st = (typeof HX !== 'undefined' && HX && HX.st) || null, rq = st && st.reqs ? Object.keys(st.reqs).map(function (k) { return st.reqs[k]; }) : [];
  var req = rq.filter(function (q) { return q.st === 'new'; }).length, rmsg = rq.reduce(function (a, q) { return a + (q.unread || 0); }, 0);
  return { appt: typeof wkTodayCount === 'function' ? wkTodayCount() : 0, req: req, reqAll: req + rmsg, chat: typeof chUnread === 'function' ? chUnread() : 0,
    subs: typeof sbState === 'function' ? S.clients.filter(function (c) { var k = sbState(c)[0]; return k === 'soon' || k === 'last' || k === 'expired'; }).length : 0 };
}
function navBadge() {                                            // شارة «شات زنها» = الرسائل غير المقروءة + طلبات التسجيل الجديدة (الطلبات صارت داخل القسم)
  var n = navCounts(), set = function (sel, v) { [].forEach.call(document.querySelectorAll(sel), function (b) { b.textContent = v || ''; b.style.display = v ? '' : 'none'; }); };
  set('.rail [data-a="zchat"] em, #tabbar [data-v="zchat"] em', n.chat + n.reqAll); set('.secnav [data-v="zchat"] em', n.chat); set('.secnav [data-v="hxv"] em', n.reqAll);
}
function glassSide() {
  var n = navIs(); document.body.classList.remove('clx', 'menu'); if (n.lib) S.libTab = S.view === 'lib' ? 'ready' : S.view;
  $('aside').innerHTML = '<nav class="rail" aria-label="التنقل">'
    + railBtn('home', 'sunrise', 'اليوم', n.today)
    + railBtn('clients', 'users', 'العملاء', n.clients).replace('</span></button>', '</span><i class="rcnt">' + S.clients.length + '</i></button>')
    + railBtn('zchat', 'message', 'شات زنها', n.chat, 1)
    + '<div class="rgrp" role="group" aria-label="المكتبة"><small class="rgl">المكتبة</small>' + railBtn('bank', 'utensils', 'بنك الوجبات', S.view === 'bank') + railBtn('ready', 'layers', 'الخطط الجاهزة', S.view === 'ready' || S.view === 'lib') + railBtn('feed', 'megaphone', 'التثقيف', S.view === 'feed', 1) + '</div>'
    + '<div class="rgrp" role="group" aria-label="الإدارة"><small class="rgl">الإدارة</small>' + railBtn('appts', 'calendar', 'المواعيد', S.view === 'appts', 1) + railBtn('subs', 'card', 'الاشتراكات', S.view === 'subs', 1) + railBtn('settings', 'settings', 'الإعدادات', S.view === 'settings' || S.view === 'users') + '</div>'
    + '<input type="file" id="impc" accept=".json" class="hide"><input type="file" id="imp" accept=".json" class="hide"></nav>';
  tabbar(); navBadge();
}
function tabbar() {                                                // شريط سفلي للجوال (يظهر بالـ CSS على الشاشات الصغيرة في الثيم الزجاجي فقط)
  var t = $('#tabbar'); if (!t) { t = document.createElement('nav'); t.id = 'tabbar'; t.setAttribute('aria-label', 'التنقل السريع'); document.body.appendChild(t); }
  var n = navIs(), it = function (a, icon, label, on, badge) { return '<button data-a="nav" data-v="' + a + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + IC(icon) + '<span>' + label + '</span>' + (badge ? '<em class="hxnb"></em>' : '') + '</button>'; };
  t.innerHTML = it('home', 'sunrise', 'اليوم', n.today) + it('clients', 'users', 'العملاء', n.clients) + it('zchat', 'message', 'شات زنها', n.chat, 1) + it('library', 'book', 'المكتبة', n.lib) + it('more', 'more', 'المزيد', n.admin);
}
function firstName() { return String(CFG.userLabel || '').replace(/^المدير:\s*/, '').trim(); }
function initial(n) { n = String(n || '').trim(); return n ? n.charAt(0) : '؟'; }
// ---- زر «عميل جديد» الواحد: يسأل بعد الضغط عن النظام (الإجراءان نفسهما: new/ex و new/ath)
function newMenu() {
  return '<details class="tbm newm"><summary class="newb">' + IC('plus') + '<span>عميل جديد</span></summary><div class="tbp"><p class="small">اختر نظام الخطة لهذا العميل</p>'
    + '<button data-a="new" data-v="ex"><b>نظام الحصص</b><small>خطة بالحصص والبدائل</small></button><button class="o" data-a="new" data-v="ath"><b>نظام الجرامات</b><small>خطة بالجرام والماكروز</small></button></div></details>';
}
// ---- «اليوم»: ما يحتاج الأخصائي فعله الآن أولاً؛ الترحيب سطر واحد، ولا بلاطات تكرر التنقل
function tdStat(a, icon, n, label) { return '<button class="tdk' + (n ? ' has' : '') + '" data-a="' + a + '">' + IC(icon) + '<b>' + n + '</b><small>' + label + '</small></button>'; }
function homeGlass() {
  var cs = S.clients.slice().sort(function (a, b) { return (b.updated || b.created) - (a.updated || a.created); }), withPlan = cs.filter(function (c) { return c.plan || c.planSrc === 'ready'; }).length, ath = cs.filter(function (c) { return c.kind === 'athlete'; }).length;
  var n = navCounts(), fol = wkItems().filter(function (i) { return /:follow$/.test(i.key); }).length;
  var recent = cs.slice(0, 6).map(function (c) { return '<div class="cl" data-a="pick" data-v="' + c.code + '"><span class="cav">' + esc(initial(c.name)) + '</span><b>' + esc(c.name || '(بلا اسم)') + '</b><small>' + c.code + (c.phone ? ' • ' + esc(c.phone) : '') + (c.plan ? ' • له خطة' : '') + '</small></div>'; }).join('');
  return '<div class="home ghome today">'
    + '<div class="tdh"><h2>اليوم</h2><p class="tdhi">أهلاً' + (firstName() ? '، ' + esc(firstName()) : '') + ' • ' + esc(wkDate(wkDay())) + '</p></div>'
    + bakCard()
    + (cs.length || n.req ? '<div class="tdks" role="group" aria-label="ملخص اليوم">' + tdStat('appts', 'calendar', n.appt, 'مواعيد اليوم') + tdStat('hxv', 'inbox', n.req, 'طلبات تسجيل جديدة') + tdStat('zchat', 'message', n.chat, 'رسائل غير مقروءة') + tdStat('subs', 'card', n.subs, 'اشتراكات للتجديد') + tdStat('tdFollow', 'repeat', fol, 'متابعات مستحقة') + '</div>' : '')
    + wkToday()
    + (recent ? '<div class="hxtop tdrh"><h3>آخر العملاء</h3><button class="sec sm" data-a="clients">كل العملاء (' + cs.length + ')</button></div><div class="recent">' + recent + '</div><p class="small tdsum">' + cs.length + ' عميل • ' + withPlan + ' له خطة • ' + ath + ' بنظام الجرامات</p>'
      : '<div class="ucard tdempty"><h3>ابدأ بأول عميل</h3><p class="small">أضف عميلاً لتبني خطته، وستظهر هنا مواعيده ورسائله ومتابعاته.</p>' + newMenu() + '</div>')
    + vtHomeCard() + proInstCard() + appCard() + '</div>';
}
// ---- «العملاء»: القائمة والبحث وزر واحد «عميل جديد» (على الويب البحث في الترويسة، وعلى الجوال حقل الصفحة نفسه)
function clPage() {
  var q = ($('#hq') || {}).value || '';
  return '<div class="clpage"><div class="hxtop"><h2>العملاء <span class="cnt">' + S.clients.length + '</span></h2>' + newMenu() + '</div>'
    + '<label class="srch clq">' + IC('search') + '<input id="q" type="search" placeholder="بحث بالاسم أو الكود أو الجوال" value="' + esc(q) + '" aria-label="بحث في العملاء"></label>'
    + '<div id="lst">' + list() + '</div></div>';
}
// ---- «المزيد» (الجوال): ما لا مكان له في الشريط السفلي
function navRow(a, v, icon, t, d, badge) { return '<button class="mrow" data-a="' + a + '"' + (v ? ' data-v="' + v + '"' : '') + '><span class="mri">' + IC(icon) + '</span><span class="mrt"><b>' + t + '</b><small>' + d + '</small></span>' + (badge ? '<b class="hxnb">' + badge + '</b>' : '') + '</button>'; }
function morePage() {
  var n = navCounts(), left = CFG.exp ? Math.ceil((CFG.exp * 1000 - Date.now()) / 86400000) : null;
  return '<div class="morepage"><h2>المزيد</h2><p class="small">' + esc(CFG.userLabel || '') + (left !== null ? ' • ينتهي التفعيل بعد ' + left + ' يوم' : '') + '</p>'
    + '<div class="mrows">' + navRow('appts', '', 'calendar', 'المواعيد', 'مواعيد اليوم والأسبوع والمتابعات', n.appt) + navRow('subs', '', 'card', 'الاشتراكات', 'المتبقي لكل عميل والمدفوعات والتمديد', n.subs) + navRow('nav', 'settings', 'settings', 'الإعدادات', 'البيانات الغذائية وزنها والمظهر والاستبيانات')
    + navRow('setTools', '', 'tool', 'النسخ الاحتياطي والأدوات', 'نسخة احتياطية واسترجاع واستيراد عميل' + (S.mode === 'admin' ? ' وأدوات الإدارة' : '')) + navRow('dtToggle', '', 'bot', 'المساعد', 'اطلب تعديل الخطة بالعربية واعتمد قبل التنفيذ') + '</div></div>';
}
// ---- «النسخ الاحتياطي والأدوات» داخل الإعدادات: ما كان أسفل القائمة الجانبية، بنفس الإجراءات ونفس شروط الظهور (أدوات الإدارة للمدير فقط)
function toolsPage() {
  var on = typeof VT !== 'undefined' && VT.st && VT.st.on;
  return '<h3>النسخ الاحتياطي والأدوات</h3><div class="ucard tools"><h3>النسخ الاحتياطي</h3><p class="small">البيانات محفوظة داخل هذا المتصفح فقط. خذ نسخة احتياطية دورياً.</p>'
    + '<div class="' + (on ? 'ok' : 'warn') + ' vtline">' + (on ? 'النسخ التلقائي مفعّل. آخر نسخة: ' + vtAgo(VT.st.last) : 'النسخ الاحتياطي التلقائي غير مفعّل.') + ' <button class="sec sm" data-a="vtOpen">' + (on ? 'إدارة النسخ التلقائي' : 'فعّل النسخ التلقائي') + '</button></div>'
    + '<div class="mrows">' + navRow('export', '', 'download', 'نسخة احتياطية', 'تنزيل ملف فيه كل العملاء وإصدارات خططهم') + navRow('import', '', 'upload', 'استرجاع', 'استرجاع من ملف نسخة احتياطية') + navRow('importClient', '', 'user', 'استيراد عميل جاهز', 'إضافة عميل من ملف عميل جاهز (JSON)') + '</div></div>'
    + (S.mode === 'admin' ? '<div class="ucard tools"><h3>أدوات الإدارة</h3><div class="mrows">' + navRow('users', '', 'users', 'المستخدمون والأجهزة', 'حسابات الأخصائيين وأجهزتهم') + navRow('exportUsers', '', 'package', 'تصدير نسخة المستخدمين', 'ملف نسخة الأخصائيين بإعداداتك الحالية') + navRow('exportSite', '', 'globe', 'تصدير موقع للنشر (ZIP)', 'موقع الأخصائيين جاهزاً للرفع') + '</div></div>' : '');
}
// ---- تبويبات داخل القسم: «شات زنها» (المحادثات | طلبات زنها) دائماً، و«المكتبة» على الجوال (لا شريط جانبي هناك)
function secNav() {
  var n = navIs(), v = S.view, t = function (to, label, on, badge) { return '<button class="' + (on ? 'on' : '') + '" data-a="nav" data-v="' + to + '"' + (on ? ' aria-current="page"' : '') + '>' + label + (badge ? ' <em class="hxnb"></em>' : '') + '</button>'; };
  if (n.chat) return '<nav class="tabs secnav" aria-label="شات زنها">' + t('zchat', 'المحادثات', v === 'chat', 1) + t('hxv', 'طلبات زنها', v === 'hx', 1) + '</nav>';
  if (n.lib) return '<nav class="tabs secnav seclib" aria-label="المكتبة">' + t('bank', 'بنك الوجبات', v === 'bank') + t('ready', 'الخطط الجاهزة', v === 'ready' || v === 'lib') + t('feed', 'التثقيف', v === 'feed') + '</nav>';
  if (v === 'users') return '<nav class="secnav secback" aria-label="رجوع"><button class="sec sm" data-a="setTools">› رجوع إلى الإعدادات</button></nav>';
  return '';
}
function secInject() {
  if (!isGlass()) return; var m = $('main'), h = secNav(); if (!m || !h || m.querySelector('.secnav')) return;
  var w = m.querySelector('.chwrap'), bar = w && w.querySelector('.chlbar'); if (bar) bar.insertAdjacentHTML('afterend', h); else m.insertAdjacentHTML('afterbegin', h);
  navBadge();
}
(function (f) {
  main0 = function () {
    if ((S.view === 'clients' || S.view === 'more') && !isGlass()) S.view = 'client';
    if (S.view === 'clients') { $('main').innerHTML = clPage(); return; }
    if (S.view === 'more') { $('main').innerHTML = morePage(); return; }
    return f.apply(this, arguments);
  };
})(main0);
(function (f) { main = function () { var r = f.apply(this, arguments); try { secInject(); } catch (e) { } return r; }; })(main);
Object.assign(A, {
  home: function () { S.view = 'client'; S.cur = null; document.body.classList.remove('menu'); render(); window.scrollTo(0, 0); },
  clients: function (v) {
    if (!isGlass()) return A.home(); S.view = 'clients'; S.cur = null; render(); window.scrollTo(0, 0);
    if (v === 'q') { var q = matchMedia('(max-width:900px)').matches ? $('#q') : $('#hq'); if (q) q.focus(); }
  },
  more: function () { if (!isGlass()) return A.home(); S.view = 'more'; S.cur = null; render(); window.scrollTo(0, 0); },
  setTools: function () { S.view = 'settings'; S.setTab = 'tools'; render(); window.scrollTo(0, 0); },
  tdFollow: function () { WK.all = true; main(); var w = $('.wktodo'); if (w && w.scrollIntoView) w.scrollIntoView({ block: 'start' }); },
  nav: function (v) {
    document.body.classList.remove('menu');
    if (v === 'home') return A.home();
    if (v === 'library') v = S.libTab || 'bank';
    if (v === 'settings' || v === 'bank' || v === 'ready' || v === 'lib') { S.view = v; render(); }
    else if (/^(clients|more|zchat|hxv|feed|appts|subs)$/.test(v) && A[v]) A[v]();
    window.scrollTo(0, 0);
  }
});
document.addEventListener('input', function (e) {                // بحث واحد: حقل الترويسة (الويب) وحقل صفحة «العملاء» (الجوال) قيمة واحدة، والكتابة من أي شاشة تفتح «العملاء»
  var t = e.target; if (!t || (t.id !== 'hq' && t.id !== 'q') || !isGlass()) return;
  var o = $(t.id === 'hq' ? '#q' : '#hq'); if (o) o.value = t.value;
  if (S.view !== 'clients') { S.view = 'clients'; S.cur = null; render(); } else DPApp.relist();
});
(function (f) { A.menu = function () { if (isGlass()) return A.more(); return f.apply(this, arguments); }; })(A.menu);
['pick', 'new', 'users'].forEach(function (k) {                // اختيار عميل أو صفحة يبدأ من أعلى الصفحة
  var f = A[k]; if (f) A[k] = function () { if (isGlass()) { document.body.classList.remove('menu'); window.scrollTo(0, 0); } return f.apply(this, arguments); };
});
(function (f) { hxRail = function () { var r = f.apply(this, arguments); navBadge(); return r; }; })(hxRail);   // بعد كل تحديث لشارات «زنها» و«الشات» تُحسب شارة القسم الموحّدة
(function (f) { chRail = function () { var r = f.apply(this, arguments); navBadge(); return r; }; })(chRail);
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
