// ================= 1.48 (طلب المالك): الرئيسية بأرقام الاشتراكات و«آخر نشاطات العملاء»، اختصارات الترويسة (الرسائل، الإشعارات العاجلة،
// البحث في كل النظام، إنشاء)، وصفحة «ملفي» للأخصائي بتخطيط صفحة شخصية اجتماعية (غلاف، صورة، نبذة، منشورات، فيديوهات تدريب).
// يُدمج داخل app.js بعد cf_wb.js. لا تغيير في البيانات: النشاطات تُقرأ مما يصل من «زنها» ومن الاشتراكات، والمنشورات من التثقيف (feed_ui).

// ---------- أرقام الاشتراكات
function zsCounts() {
  var r = { act: 0, soon: 0, exp: 0, none: 0 };
  if (typeof sbState !== 'function') return r;
  S.clients.forEach(function (c) { var k = sbState(c)[0]; if (k === 'ok') r.act++; else if (k === 'soon' || k === 'last') { r.act++; r.soon++; } else if (k === 'expired') r.exp++; else r.none++; });
  return r;
}
function zsCard() {
  var z = zsCounts(), cell = function (n, label, sub, tone) { return '<button class="zscell t-' + tone + (n ? '' : ' zero') + '" data-a="subs"><b>' + n + '</b><span>' + label + '</span><small>' + sub + '</small></button>'; };
  return '<section class="zhcard zscard" aria-label="الاشتراكات"><div class="zhh"><h3>' + IC('card') + ' الاشتراكات</h3><button class="link" data-a="subs">إدارة الاشتراكات</button></div>'
    + '<div class="zsgrid">' + cell(z.act, 'سارية', 'عميل اشتراكه فعّال', 'ok') + cell(z.soon, 'قاربت الانتهاء', 'خلال 5 أيام', 'warn') + cell(z.exp, 'منتهية', 'تحتاج تجديداً', 'bad') + '</div>'
    + (z.none ? '<p class="small zsnone">' + z.none + ' عميل بلا اشتراك مسجّل</p>' : '') + '</section>';
}

// ---------- آخر نشاطات العملاء (من بيانات «زنها» والاشتراكات المحفوظة)
function zaAgo(ts) {
  var s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'الآن'; if (s < 3600) return 'منذ ' + Math.floor(s / 60) + ' د'; if (s < 86400) return 'منذ ' + Math.floor(s / 3600) + ' س';
  var d = Math.floor(s / 86400); return d === 1 ? 'أمس' : d < 30 ? 'منذ ' + d + ' أيام' : new Date(ts).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}
function zaActs(limit) {
  var out = [], add = function (c, ts, ic, tone, verb, rest, a, v) { if (ts && ts > 0) out.push({ c: c, ts: +ts, ic: ic, tone: tone, verb: verb, rest: rest || '', a: a, v: v }); };
  S.clients.forEach(function (c) {
    var f = c.sex === 'أنثى', V = function (m, w) { return f ? w : m; }, x = c.hx || {};
    (x.msgs || []).filter(function (m) { return m.from === 'c'; }).slice(-2).forEach(function (m) { add(c, m.ts, 'message', 'sky', V('أرسل إليك رسالة', 'أرسلت إليك رسالة'), String(m.t || '').slice(0, 70), 'pick', c.code); });
    var lg = x.logs || {}; Object.keys(lg).sort().slice(-3).forEach(function (d) { var l = lg[d], sw = Object.keys(l.sw || {}).length;
      if (sw) add(c, l.ts, 'swap', 'mint', V('قام بتبديل ', 'قامت بتبديل ') + (sw === 1 ? 'وجبة' : sw + ' وجبات'), '', 'pick', c.code);
      else if (l.done) add(c, l.ts, 'apple', 'mint', V('سجّل متابعة يومه', 'سجّلت متابعة يومها'), l.n ? l.done + ' من ' + l.n + ' وجبات' : '', 'pick', c.code); });
    var w = (x.weights || []).slice(-1)[0]; if (w) add(c, w[0], 'scale', 'sky', V('سجّل وزنه', 'سجّلت وزنها'), w[1] + ' كجم', 'pick', c.code);
    var pl = (x.prefLog || []).slice(-1)[0]; if (pl) add(c, pl.ts, 'heart', 'rose', V('عدّل تفضيلاته الغذائية', 'عدّلت تفضيلاتها الغذائية'), '', 'pick', c.code);
    if (x.health && x.health.at) add(c, x.health.at, 'steth', 'bad', V('طلب تعديل حالته الصحية', 'طلبت تعديل حالتها الصحية'), '', 'pick', c.code);
    if (c.pantry && c.pantry.at) add(c, c.pantry.at, 'salad', 'mint', V('أرسل قائمة المتوفر عنده', 'أرسلت قائمة المتوفر عندها'), '', 'pick', c.code);
    if (c.prof && c.prof.at) add(c, c.prof.at, 'user', 'sky', V('أكمل ملفه', 'أكملت ملفها'), '', 'pick', c.code);
    if (x.quiz && x.quiz.at) add(c, x.quiz.at, 'target', 'sky', V('أجاب على أسئلة اختيار النظام', 'أجابت على أسئلة اختيار النظام'), '', 'pick', c.code);
    ((c.sub && c.sub.history) || []).slice(-2).forEach(function (h) {
      var t = h.type === 'renew' ? V('جدّد الاشتراك', 'جدّدت الاشتراك') : h.type === 'start' ? V('بدأ اشتراكه', 'بدأت اشتراكها') : h.type === 'extend' ? 'مُدّد اشتراك' + (f ? 'ها' : 'ه') : '';
      if (t) add(c, h.ts, 'card', 'warn', t, (h.pkg ? h.pkg + ' • ' : '') + (h.days ? h.days + ' يوماً' : ''), 'subs', '');
    });
  });
  var st = (typeof HX !== 'undefined' && HX && HX.st) || null;
  if (st && st.reqs) Object.keys(st.reqs).forEach(function (k) { var q = st.reqs[k]; if (q.intake && q.st === 'new') add({ name: q.intake.name || q.label || 'عميل جديد', sex: q.intake.sex }, q.at, 'inbox', 'warn', q.intake.sex === 'أنثى' ? 'أرسلت طلب تسجيل' : 'أرسل طلب تسجيل', 'من «زنها»', 'hxv', ''); });
  return out.sort(function (a, b) { return b.ts - a.ts; }).slice(0, limit || 8);
}
function zaCard() {
  var L = zaActs(8);
  return '<section class="zhcard zhrec zacard"><div class="hxtop tdrh zhh"><h3>' + IC('history') + ' آخر نشاطات العملاء</h3><button class="link" data-a="clients">كل العملاء (' + S.clients.length + ')</button></div>'
    + (L.length ? '<ul class="zalist">' + L.map(function (e) {
      return '<li><button data-a="' + e.a + '"' + (e.v ? ' data-v="' + esc(e.v) + '"' : '') + '><span class="zaic t-' + e.tone + '">' + IC(e.ic) + '</span><span class="zatx"><span><b>' + esc(e.c.name || e.c.code || '') + '</b> ' + e.verb + '</span>' + (e.rest ? '<small>' + esc(e.rest) + '</small>' : '') + '</span><time>' + zaAgo(e.ts) + '</time></button></li>';
    }).join('') + '</ul>' : '<p class="small zaempty">لا نشاطات بعد. حين يبدّل عملاؤك وجبة أو يرسلون رسالة أو يسجلون وزنهم في «زنها»، أو تجدّد اشتراكاً، يظهر ذلك هنا.</p>')
    + '</section>';
}

// ---------- اختصارات الترويسة: إنشاء، بحث، رسائل، إشعارات عاجلة
var HQ = { open: '', q: '' };
function hqUrgent() { var L = typeof wkItems === 'function' ? wkItems() : []; return L.filter(function (i) { return i.pri === 0; }).concat(L.filter(function (i) { return i.pri !== 0; })); }
function hqBtns() {
  var n = navCounts(), msg = n.chat + n.reqAll, urg = hqUrgent().length;
  var b = function (a, ic, lbl, cnt) { return '<button class="hqb" data-a="' + a + '" aria-label="' + lbl + (cnt ? ' (' + cnt + ')' : '') + '" title="' + lbl + '">' + IC(ic) + (cnt ? '<em>' + (cnt > 99 ? '99+' : cnt) + '</em>' : '') + '</button>'; };
  return '<span class="hqbar gonly">' + b('hqNew', 'plus', 'إنشاء', 0) + b('hqSearch', 'search', 'ابحث في كل شيء', 0) + b('hqMsg', 'message', 'الرسائل', msg) + b('hqBell', 'bell', 'الإشعارات العاجلة', urg) + '</span>';
}
function hqPanel() {
  if (!HQ.open) return '';
  if (HQ.open === 'new') return '<div class="hqpop" role="menu" aria-label="إنشاء">' + [['new', 'ex', 'user', 'عميل جديد — الحصص'], ['new', 'ath', 'dumbbell', 'عميل جديد — الجرامات'], ['genTab', '', 'sparkles', 'توليد خطة'], ['appts', '', 'calendar', 'موعد'], ['meOpen', 'post', 'megaphone', 'منشور لعملائك'], ['meOpen', 'video', 'film', 'فيديو تدريب']].map(function (x) { return '<button role="menuitem" data-a="' + x[0] + '"' + (x[1] ? ' data-v="' + x[1] + '"' : '') + '>' + IC(x[2]) + '<span>' + x[3] + '</span></button>'; }).join('') + '</div>';
  if (HQ.open === 'bell') {
    var L = hqUrgent().slice(0, 12);
    return '<div class="hqpop wide" aria-label="الإشعارات"><div class="hqph"><b>الإشعارات</b><button class="link" data-a="home">كل ما يحتاج اهتمامك</button></div>' + (L.length ? L.map(function (i) {
      return '<button class="hqit' + (i.pri === 0 ? ' urg' : '') + '" data-a="' + (i.c ? 'wkOpen' : i.tab) + '"' + (i.c ? ' data-v="' + esc(i.c.code) + '"' : '') + '><span class="hqe">' + i.ic + '</span><span><b>' + esc(i.c ? i.c.name || i.c.code : 'زنها') + '</b><small>' + esc(i.txt) + '</small></span></button>';
    }).join('') : '<p class="small hqempty">لا شيء عاجل الآن 🎉</p>') + '</div>';
  }
  if (HQ.open === 'search') return '<div class="hqsearch" role="dialog" aria-label="بحث في النظام"><div class="hqsbox">' + IC('search') + '<input id="hqq" type="search" placeholder="ابحث: عميل، صنف، وجبة، صفحة أو إعداد…" value="' + esc(HQ.q) + '" autocomplete="off"><button class="sec sm" data-a="hqClose">إغلاق</button></div><div id="hqres">' + hqResults(HQ.q) + '</div></div>';
  return '';
}
var HQ_PAGES = [['اليوم', 'home', ''], ['العملاء', 'clients', ''], ['توليد الخطة', 'genTab', ''], ['شات زنها', 'zchat', ''], ['بنك الوجبات', 'nav', 'bank'], ['الخطط الجاهزة', 'nav', 'ready'], ['التثقيف', 'feed', ''], ['المواعيد', 'appts', ''], ['الاشتراكات', 'subs', ''], ['ملفي الشخصي', 'meOpen', ''],
  ['الإعدادات: الحصص والبدائل', 'setGo', 'portions'], ['الإعدادات: أغذية نظام الجرامات', 'setGo', 'ath'], ['الإعدادات: الاستبيانات', 'setGo', 'forms'], ['الإعدادات: زنها', 'setGo', 'hx'], ['الإعدادات: المظهر', 'setGo', 'theme'], ['الإعدادات: النسخ الاحتياطي والأدوات', 'setGo', 'tools'], ['الإعدادات: المكملات والأعشاب', 'setGo', 'supp'], ['الإعدادات: التحديات', 'setGo', 'chal']];
function hqNorm(s) { return String(s || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْ]/g, '').toLowerCase(); }
function hqResults(q) {
  q = hqNorm(q).trim(); if (!q) return '<p class="small hqempty">اكتب حرفين أو أكثر للبحث في العملاء والأصناف والوجبات والصفحات.</p>';
  var hit = function (s) { return hqNorm(s).indexOf(q) >= 0; }, grp = function (t, rows) { return rows.length ? '<div class="hqg"><h4>' + t + '</h4>' + rows.join('') + '</div>' : ''; };
  var row = function (a, v, ic, t, d) { return '<button class="hqit" data-a="' + a + '"' + (v ? ' data-v="' + esc(v) + '"' : '') + '><span class="hqe">' + IC(ic) + '</span><span><b>' + esc(t) + '</b>' + (d ? '<small>' + esc(d) + '</small>' : '') + '</span></button>'; };
  var cl = S.clients.filter(function (c) { return hit(c.name) || hit(c.code) || hit(c.phone); }).slice(0, 6).map(function (c) { return row('pick', c.code, 'user', c.name || c.code, c.code + (c.phone ? ' • ' + c.phone : '')); });
  var fd = D.foods.filter(function (f) { return !f.deleted && hit(f.n); }).slice(0, 6).map(function (f) { return row('hqFood', f.n, 'apple', f.n, D.groups[f.g] + ' • الحصة ' + E.lineText(f, 1)); });
  var bk = (D.bank || []).filter(function (b) { return hit(b.n); }).slice(0, 5).map(function (b) { return row('nav', 'bank', 'utensils', b.n, 'بنك الوجبات'); });
  var pg = HQ_PAGES.filter(function (p) { return hit(p[0]); }).slice(0, 6).map(function (p) { return row(p[1], p[2], 'grid', p[0], ''); });
  var all = grp('العملاء', cl) + grp('الصفحات والإعدادات', pg) + grp('الأصناف', fd) + grp('وجبات البنك', bk);
  return all || '<p class="small hqempty">لا نتائج لـ «' + esc(q) + '».</p>';
}
function hqRender() { var o = document.getElementById('hqlayer'); if (!o) { o = document.createElement('div'); o.id = 'hqlayer'; document.body.appendChild(o); } o.innerHTML = hqPanel(); o.className = HQ.open ? 'on k-' + HQ.open : ''; if (HQ.open === 'search') { var i = document.getElementById('hqq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } }
function hqToggle(k) { HQ.open = HQ.open === k ? '' : k; hqRender(); }
header = (function (f) { return function () { f.apply(this, arguments); var h = document.getElementById('hd'), u = h && h.querySelector('.uchip'); if (u && !h.querySelector('.hqbar')) { u.insertAdjacentHTML('beforebegin', hqBtns()); var nm = u.querySelector('span'); if (nm && !nm.dataset.a) { nm.setAttribute('data-a', 'meOpen'); nm.setAttribute('role', 'button'); nm.setAttribute('tabindex', '0'); nm.title = 'ملفي الشخصي'; } } }; })(header);
function hqBadges() { var h = document.getElementById('hd'), bar = h && h.querySelector('.hqbar'); if (bar) bar.outerHTML = hqBtns(); }
document.addEventListener('input', function (e) { if (e.target && e.target.id === 'hqq') { HQ.q = e.target.value; var r = document.getElementById('hqres'); if (r) r.innerHTML = hqResults(HQ.q); } });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && HQ.open) { HQ.open = ''; hqRender(); return; }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K') && isGlass()) { e.preventDefault(); HQ.open = 'search'; hqRender(); }
});
document.addEventListener('click', function (e) { if (!HQ.open) return; var t = e.target; if (t.closest && (t.closest('#hqlayer .hqpop') || t.closest('#hqlayer .hqsbox') || t.closest('.hqbar'))) return; if (t.closest && t.closest('#hqlayer [data-a]')) { HQ.open = ''; setTimeout(hqRender, 0); return; } if (t.id === 'hqlayer' || !t.closest('#hqlayer')) { HQ.open = ''; hqRender(); } }, true);

// ---------- «ملفي»: صفحة شخصية للأخصائي (غلاف، صورة، اسم، «N عميل حالي»، نبذة، منشورات وفيديوهات تدريب)
var MEP = { tab: 'posts', edit: false };
function meData() { return S.settings.me || {}; }
function meCurrent() { var z = zsCounts(), withSub = z.act + z.exp; return withSub ? z.act + z.none : S.clients.length; }      // الحاليون: سارٍ اشتراكهم أو بلا نظام اشتراك
function meCoverSet(file) {
  if (!file || !/^image\//.test(file.type)) { toast('اختر ملف صورة'); return; }
  var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () {
    var W = 1250, H = 463, c = document.createElement('canvas'), sc = Math.max(W / im.width, H / im.height), w = im.width * sc, h = im.height * sc; c.width = W; c.height = H;
    c.getContext('2d').drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
    S.settings.me = Object.assign({}, S.settings.me, { cover: c.toDataURL('image/jpeg', 0.78) }); saveSettings(); main(); toast('✓ حُفظت صورة الغلاف');
  }; im.onerror = function () { toast('تعذّر قراءة الصورة'); }; im.src = r.result; }; r.readAsDataURL(file);
}
function mePosts() { return (typeof FD !== 'undefined' ? FD.posts : []).filter(function (x) { return x.own; }); }
function meProfile() {
  var me = meData(), name = zhName() || firstName() || 'الأخصائي', ph = mePhoto(), cur = meCurrent(), posts = mePosts(), vids = posts.filter(function (x) { return x.kind === 'video' || x.kind === 'reel'; }), on = typeof hxOn === 'function' && hxOn();
  var faces = S.clients.slice(0, 8).map(function (c) { return '<span class="cav" title="' + esc(c.name || c.code) + '">' + esc(initial(c.name)) + '</span>'; }).join('');
  var tab = function (k, t, n) { return '<button class="' + (MEP.tab === k ? 'on' : '') + '" data-a="meTab" data-v="' + k + '"' + (MEP.tab === k ? ' aria-current="page"' : '') + '>' + t + (n != null ? ' <small>' + n + '</small>' : '') + '</button>'; };
  var intro = '<section class="fbbox"><h3>نبذة</h3>' + (MEP.edit
    ? '<label class="fbl">المسمّى المهني<input id="me_role" maxlength="80" value="' + esc(me.role || '') + '" placeholder="مثال: أخصائية تغذية علاجية"></label><label class="fbl">نبذة مختصرة<textarea id="me_bio" rows="5" maxlength="400" placeholder="عرّف عملاءك بخبرتك وأسلوبك في المتابعة…">' + esc(me.bio || '') + '</textarea></label><p class="two"><button data-a="meSave">حفظ</button><button class="sec" data-a="meEdit">إلغاء</button></p>'
    : (me.bio ? '<p class="fbbio">' + esc(me.bio) + '</p>' : '<p class="small">أضف نبذة مختصرة عنك تعرّف عملاءك بخبرتك.</p>') + '<button class="sec fbwide" data-a="meEdit">' + IC('edit') + ' ' + (me.bio ? 'تعديل النبذة' : 'إضافة نبذة') + '</button>')
    + '<ul class="fbfacts">' + (me.role ? '<li>' + IC('steth') + '<span>' + esc(me.role) + '</span></li>' : '') + '<li>' + IC('users') + '<span><b>' + cur + '</b> عميل حالي</span></li><li>' + IC('megaphone') + '<span><b>' + posts.length + '</b> منشور</span></li>' + (S.settings.clinic ? '<li>' + IC('home') + '<span>' + esc(S.settings.clinic) + '</span></li>' : '') + '</ul></section>';
  var vidBox = '<section class="fbbox"><div class="fbbh"><h3>فيديوهات التدريب</h3><button class="link" data-a="meTab" data-v="videos">عرض الكل</button></div>' + (vids.length ? '<div class="fbvgrid">' + vids.slice(0, 6).map(function (x) { return '<button data-a="meTab" data-v="videos" class="fbvt">' + IC('film') + '<span>' + esc(x.title || 'فيديو') + '</span></button>'; }).join('') + '</div>' : '<p class="small">لا فيديوهات بعد.</p>') + '<button class="sec fbwide" data-a="meOpen" data-v="video">' + IC('plus') + ' فيديو تدريب جديد</button></section>';
  var compose = on ? (typeof fdComposer === 'function' ? fdComposer() : '') : '<div class="ucard fbbox"><h3>انشر لعملائك</h3><p class="small">اربط «زنها Pro» بالمحطة لتنشر منشورات وفيديوهات تدريب تصل عملاءك في «زنها» مع إشعار.</p><button data-a="fdSetup">ربط «زنها»</button></div>';
  var list = MEP.tab === 'videos' ? vids : posts, feed = (FD.err ? '<div class="warn">⚠ ' + esc(FD.err) + '</div>' : '') + (list.length ? list.map(fdCard).join('') : '<div class="ucard fbbox"><p class="small">' + (on && !FD.at ? 'جارٍ تحميل منشوراتك…' : MEP.tab === 'videos' ? 'لم تنشر فيديوهات تدريب بعد.' : 'لم تنشر بعد. منشوراتك السابقة تظهر هنا.') + '</p></div>');
  var body = MEP.tab === 'about' ? '<div class="fbabout">' + intro + '</div>' : '<div class="fbcols"><aside>' + intro + vidBox + '</aside><div class="fbmain">' + (MEP.tab === 'posts' ? '<div id="mecomp">' + compose + '</div>' : '') + feed + '</div></div>';
  return '<div class="fbp"><div class="fbtop"><div class="fbcover' + (me.cover ? ' has' : '') + '"' + (me.cover ? ' style="background-image:url(' + me.cover + ')"' : '') + '><label class="fbcvbtn">' + IC('image') + '<span>' + (me.cover ? 'تعديل صورة الغلاف' : 'إضافة صورة غلاف') + '</span><input type="file" accept="image/*" class="mecover" hidden></label></div>'
    + '<div class="fbhead"><div class="fbav">' + (ph ? '<img src="' + ph + '" alt="صورة ' + esc(name) + '">' : '<span>' + esc(initial(name)) + '</span>') + '<label class="fbavbtn" title="تغيير الصورة" aria-label="تغيير الصورة الشخصية">' + IC('image') + '<input type="file" accept="image/*" class="mefile" hidden></label></div>'
    + '<div class="fbname"><h1>' + esc(name) + '</h1><button class="fbcnt" data-a="clients"><b>' + cur + '</b> عميل حالي</button><div class="fbfaces">' + faces + '</div></div>'
    + '<div class="fbact"><button data-a="meOpen" data-v="post">' + IC('plus') + ' إضافة منشور</button><button class="sec" data-a="meEdit">' + IC('edit') + ' تعديل الملف الشخصي</button></div></div>'
    + '<nav class="fbtabs" aria-label="أقسام الملف">' + tab('posts', 'المنشورات', posts.length) + tab('about', 'حول') + tab('videos', 'الفيديوهات', vids.length) + '</nav></div>' + body + '</div>';
}
Object.assign(A, {
  hqNew: function () { hqToggle('new'); }, hqSearch: function () { hqToggle('search'); }, hqBell: function () { hqToggle('bell'); }, hqClose: function () { HQ.open = ''; hqRender(); },
  hqMsg: function () { HQ.open = ''; hqRender(); A.zchat ? A.zchat() : A.nav('zchat'); },
  hqFood: function (v) { S.fq = v; S.view = 'settings'; S.setTab = 'portions'; render(); window.scrollTo(0, 0); },
  setGo: function (v) { S.view = 'settings'; S.setTab = v; render(); window.scrollTo(0, 0); },
  meOpen: function (v) {
    S.view = 'me'; S.cur = null; HQ.open = ''; hqRender(); if (v === 'video' && typeof FD !== 'undefined') { MEP.tab = 'posts'; FD.f.kind = 'video'; if (!FD.f.title) FD.f.title = 'تمرين: '; } else if (v === 'post') MEP.tab = 'posts';
    render(); window.scrollTo(0, 0); if (typeof hxOn === 'function' && hxOn() && (!FD.at || Date.now() - FD.at > 30000)) fdLoad();
    if (v) setTimeout(function () { var n = document.getElementById('mecomp'); if (n) { n.scrollIntoView({ block: 'center' }); var i = document.getElementById('fd_body'); if (i) i.focus(); } }, 60);
  },
  meTab: function (v) { MEP.tab = v; MEP.edit = false; main(); },
  meEdit: function () { MEP.edit = !MEP.edit; if (MEP.edit && MEP.tab === 'videos') MEP.tab = 'posts'; main(); var b = document.getElementById('me_bio'); if (b) b.focus(); },
  meSave: function () { var r = (document.getElementById('me_role') || {}).value, b = (document.getElementById('me_bio') || {}).value; S.settings.me = Object.assign({}, S.settings.me, { role: String(r || '').trim().slice(0, 80), bio: String(b || '').trim().slice(0, 400) }); saveSettings(); MEP.edit = false; main(); toast('✓ حُفظ ملفك'); }
});
document.addEventListener('change', function (e) { var t = e.target; if (t && t.classList && t.classList.contains('mecover')) { meCoverSet(t.files && t.files[0]); t.value = ''; } });
fdRe = (function (f) { return function () { if (S.view === 'me') { main(); return; } return f.apply(this, arguments); }; })(fdRe);
fdLoad = (function (f) { return function () { return f.apply(this, arguments).then(function () { if (S.view === 'me') main(); }); }; })(fdLoad);
main0 = (function (f) { return function () { if (S.view === 'me') { $('main').innerHTML = meProfile(); if (typeof fdHydrate === 'function') fdHydrate(); return; } return f.apply(this, arguments); }; })(main0);
render = (function (f) { return function () { var r = f.apply(this, arguments); hqBadges(); if (HQ.open) { HQ.open = ''; hqRender(); } return r; }; })(render);      // أي تنقّل يغلق القوائم المنبثقة
