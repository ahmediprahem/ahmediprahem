// ================= التثقيف: مساحة الأخصائي لنشر التثقيف الغذائي لمراجعيه على «حصتي» (يُدمج داخل app.js عند /*FEEDUI*/)
// منشور «لمراجعيّ» يظهر لعملائك على «حصتي» فوراً (مع إشعار)، و«عام» يظهر لكل مراجعي «حصة» بعد موافقة الإدارة.
// الأنواع: موضوع، نصيحة، صور (تُضغط هنا قبل الرفع)، فيديو أو ريلز (ملف يحتاج R2 في المحطة، أو رابط يوتيوب).
// الإدارة = نسخة المدير (admin) المتصلة بالمحطة: تطالب بالإشراف تلقائياً أول مرة، وتراجع المنشورات العامة. الوسائط تُجلب من المحطة كـ blob (سياسة أمان الموقع).
var FD = { me: null, posts: [], more: false, busy: false, err: '', at: 0, pending: 0, open: {}, cm: {}, blobs: {}, f: { kind: 'text', scope: 'mine', title: '', body: '', link: '' }, files: [], up: '', filter: 'all' };
var FD_KINDS = [['text', '📝 موضوع'], ['tip', '💡 نصيحة'], ['image', '🖼 صور'], ['video', '🎬 فيديو'], ['reel', '📱 ريلز'], ['link', '▶ يوتيوب']];
function fdApi(method, path, obj) { return hxFetch(method, path, obj, true); }
function fdAgo(t) { var s = Math.max(0, Math.floor(Date.now() / 1000 - t)); return s < 60 ? 'الآن' : s < 3600 ? 'منذ ' + Math.floor(s / 60) + ' د' : s < 86400 ? 'منذ ' + Math.floor(s / 3600) + ' س' : s < 7 * 86400 ? 'منذ ' + Math.floor(s / 86400) + ' يوم' : new Date(t * 1000).toLocaleDateString('ar'); }
function fdYt(u) { var m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/.exec(String(u || '')); return m ? m[1] : ''; }
function fdLoad(more) {
  if (!hxOn() || FD.busy) return Promise.resolve();
  FD.busy = true; var last = FD.posts.length ? FD.posts[FD.posts.length - 1].id : 0;
  return (FD.me ? Promise.resolve(FD.me) : fdApi('GET', '/v1/me').then(function (m) { FD.me = m; return S.mode === 'admin' && !m.modSet ? fdApi('POST', '/v1/mod/claim', {}).then(function (r) { FD.me.mod = r.mod; FD.me.modSet = true; }).catch(function () { }) : 0; }))
    .then(function () { return fdApi('GET', '/v1/feed' + (more && last ? '?before=' + last : '')); })
    .then(function (j) { FD.posts = more ? FD.posts.concat(j.posts) : j.posts; FD.more = j.more; FD.pending = j.pending || 0; FD.err = ''; FD.at = Date.now(); })
    .catch(function (e) { FD.err = e.message; }).then(function () { FD.busy = false; fdRail(); if (S.view === 'feed') fdRe(); });
}
function fdRail() { var b = document.querySelector('[data-a="feed"] em'); if (b) { b.textContent = FD.pending || ''; b.style.display = FD.pending ? '' : 'none'; } }
// ---------- الوسائط: ضغط الصورة قبل الرفع (أقصى بعد 1280، JPEG)، والرفع موقَّع على بايتات الملف نفسه
function fdShrink(file) {
  return new Promise(function (res, rej) {
    var u = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var k = Math.min(1, 1280 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); URL.revokeObjectURL(u);
      cv.toBlob(function (b) { b ? res({ blob: b, type: 'image/jpeg', w: w, h: h }) : rej(new Error('تعذّر تجهيز الصورة')); }, 'image/jpeg', 0.82);
    };
    im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('ملف صورة غير صالح')); }; im.src = u;
  });
}
function fdUpload(it) {
  var base = hxRelay();
  return it.blob.arrayBuffer().then(function (buf) {
    return HXC0.signReq(HX.st.ident, 'POST', '/v1/media', buf).then(function (a) { return fetch(base + '/v1/media', { method: 'POST', headers: { 'content-type': it.type, authorization: a }, body: buf, cache: 'no-store' }); });
  }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ('تعذّر رفع الملف (' + r.status + ')')); return { key: j.key, w: it.w || 0, h: it.h || 0 }; }); });
}
function fdBlob(key) {                                              // صور ومقاطع المحطة تُعرض من blob (يقبله الموقع وملف الجهاز)
  if (!FD.blobs[key]) FD.blobs[key] = fetch(hxRelay() + '/m/' + key).then(function (r) { if (!r.ok) throw new Error(); return r.blob(); }).then(function (b) { return URL.createObjectURL(b); }).catch(function () { delete FD.blobs[key]; return ''; });
  return FD.blobs[key];
}
function fdHydrate() { [].forEach.call(document.querySelectorAll('main [data-fdm]'), function (n) { var k = n.getAttribute('data-fdm'); n.removeAttribute('data-fdm'); fdBlob(k).then(function (u) { if (u) n.src = u; }); }); }
// ---------- العرض
function fdComposer() {
  var f = FD.f, me = FD.me || {}, vid = f.kind === 'video' || f.kind === 'reel', img = f.kind === 'image';
  var chips = FD_KINDS.map(function (k) { return '<button class="' + (f.kind === k[0] ? 'on' : 'sec') + ' sm" data-a="fdKind" data-v="' + k[0] + '">' + k[1] + '</button>'; }).join(' ');
  var files = FD.files.map(function (x, i) { return '<span class="fdth">' + (x.type.indexOf('image') === 0 ? '<img src="' + x.url + '" alt="">' : '<span>🎬 ' + esc(x.name) + '<small>' + (x.size / 1048576).toFixed(1) + ' م.ب</small></span>') + '<button class="sec sm" data-a="fdUnfile" data-v="' + i + '" aria-label="إزالة">✕</button></span>'; }).join('');
  return '<div class="ucard fdcomp"><h3>منشور جديد</h3><p class="fdkinds">' + chips + '</p>'
    + '<input id="fd_title" data-fdf="title" maxlength="120" placeholder="العنوان (مثال: 5 بدائل صحية للسكر)" value="' + esc(f.title) + '">'
    + '<textarea id="fd_body" data-fdf="body" rows="5" maxlength="5000" placeholder="' + (f.kind === 'tip' ? 'النصيحة باختصار ووضوح…' : 'اكتب الموضوع: المعلومة، لماذا تهم، وكيف يطبّقها المراجع…') + '">' + esc(f.body) + '</textarea>'
    + (img ? '<p><label class="sec sm fdfile">📷 اختر صوراً (حتى 4)<input type="file" id="fd_files" accept="image/*" multiple hidden></label> <small class="small">تُضغط تلقائياً قبل الرفع</small></p>' : '')
    + (vid ? (me.r2 ? '<p><label class="sec sm fdfile">🎬 اختر ملف ' + (f.kind === 'reel' ? 'ريلز (عمودي)' : 'فيديو') + '<input type="file" id="fd_files" accept="video/mp4,video/webm,video/quicktime" hidden></label> <small class="small">MP4 حتى 60 ميغابايت — أو ضع رابط يوتيوب بالأسفل</small></p>' : '<p class="small">رفع ملف فيديو يحتاج تفعيل التخزين (R2) في المحطة — انظر دليل النشر. الآن: ضع رابط يوتيوب' + (f.kind === 'reel' ? ' (Shorts)' : '') + '.</p>') : '')
    + (files ? '<div class="fdfiles">' + files + '</div>' : '')
    + (vid || f.kind === 'link' ? '<input id="fd_link" data-fdf="link" dir="ltr" placeholder="https://www.youtube.com/watch?v=… أو youtube.com/shorts/…" value="' + esc(f.link) + '">' : '')
    + '<div class="fdfoot"><label>الجمهور <select id="fd_scope" data-fdf="scope"><option value="mine"' + (f.scope === 'mine' ? ' selected' : '') + '>مراجعيّ فقط — يظهر فوراً</option><option value="public"' + (f.scope === 'public' ? ' selected' : '') + '>عام لكل مراجعي «حصة»' + (me.mod ? '' : ' — بعد موافقة الإدارة') + '</option></select></label>'
    + '<button data-a="fdPost"' + (FD.up ? ' disabled' : '') + '>' + (FD.up ? esc(FD.up) : '📣 نشر') + '</button></div>'
    + '<p class="small">المحتوى التثقيفي يُحفظ في المحطة غير مشفّر (يراه جمهوره)، فلا تضع فيه بيانات أي عميل.' + (f.scope === 'public' && !me.mod ? ' المنشور العام يُراجع قبل ظهوره: معلومة علمية، بلا إعلانات أو أرقام تواصل.' : '') + '</p></div>';
}
function fdMediaHtml(x) {
  var im = x.media.filter(function (m) { return m.t === 'i'; }), vd = x.media.filter(function (m) { return m.t === 'v'; }), reel = x.kind === 'reel' || /\/shorts\//.test(x.link || ''), y = fdYt(x.link);
  return (im.length ? '<div class="fdimgs n' + Math.min(im.length, 4) + '">' + im.slice(0, 4).map(function (m) { return '<img data-fdm="' + m.key + '" alt="">'; }).join('') + '</div>' : '')
    + vd.map(function (m) { return '<video class="fdvid' + (reel ? ' reel' : '') + '" data-fdm="' + m.key + '" controls playsinline preload="metadata"></video>'; }).join('')
    + (y ? '<a class="fdyt' + (reel ? ' reel' : '') + '" href="https://www.youtube.com/watch?v=' + y + '" target="_blank" rel="noopener noreferrer">▶ ' + (reel ? 'ريلز' : 'فيديو') + ' على يوتيوب <small dir="ltr">' + y + '</small></a>' : '');
}
function fdCard(x) {
  var st = x.status === 'pending' ? '<span class="fdst wait">⏳ بانتظار موافقة الإدارة</span>' : x.status === 'rejected' ? '<span class="fdst no">✕ لم يُعتمد' + (x.note ? ': ' + esc(x.note) : '') + '</span>' : '';
  var mod = FD.me && FD.me.mod, cm = FD.open[x.id], c = FD.cm[x.id];
  return '<article class="ucard fdpost" data-pid="' + x.id + '"><div class="fdhd"><span class="cav">' + esc(initial(x.author)) + '</span><div><b>' + esc(x.author || '') + (x.own ? ' <small>(أنت)</small>' : '') + '</b><small>' + fdAgo(x.at) + ' • ' + (x.scope === 'public' ? '🌐 عام' : '👥 لمراجعيه') + ' • ' + (FD_KINDS.filter(function (k) { return k[0] === x.kind; })[0] || ['', ''])[1] + '</small></div>' + st + '</div>'
    + (x.title ? '<h3>' + esc(x.title) + '</h3>' : '') + (x.body ? '<p class="fdbody">' + esc(x.body) + '</p>' : '') + fdMediaHtml(x)
    + (mod && x.status === 'pending' ? '<p class="two fdmod"><button class="sm" data-a="fdReview" data-v="' + x.id + '" data-ok="1">✓ اعتماد ونشر للجميع</button><button class="sec sm" data-a="fdReview" data-v="' + x.id + '" data-ok="0">✕ رفض مع ملاحظة</button></p>' : '')
    + '<div class="fdft"><button class="sec sm' + (x.liked ? ' on' : '') + '" data-a="fdLike" data-v="' + x.id + '"' + (x.status !== 'live' ? ' disabled' : '') + '>❤ ' + (x.likes || 0) + '</button><button class="sec sm' + (cm ? ' on' : '') + '" data-a="fdCm" data-v="' + x.id + '"' + (x.status !== 'live' ? ' disabled' : '') + '>💬 ' + (x.comments || 0) + ' تعليق</button>'
    + (x.own || mod ? '<button class="sec sm fddel" data-a="fdDel" data-v="' + x.id + '">🗑 حذف</button>' : '') + '</div>'
    + (cm ? '<div class="fdcms">' + (!c ? '<p class="small">جارٍ التحميل…</p>' : (c.length ? c.map(function (m) { return '<div class="fdcm' + (m.dr ? ' dr' : '') + '"><b>' + esc(m.name) + (m.dr ? ' <small>أخصائي</small>' : '') + '</b><p>' + esc(m.body) + '</p><small>' + fdAgo(m.at) + (m.del ? ' • <button class="lnk" data-a="fdCmDel" data-v="' + m.id + '" data-p="' + x.id + '">حذف</button>' : '') + '</small></div>'; }).join('') : '<p class="small">لا تعليقات بعد.</p>'))
      + '<div class="hxcomp"><textarea data-fdr="' + x.id + '" rows="1" maxlength="1000" placeholder="ردّ على المراجعين…"></textarea><button class="sm" data-a="fdReply" data-v="' + x.id + '">ردّ</button></div></div>' : '')
    + '</article>';
}
function fdPage() {
  if (HX.loaded !== true) return '<p class="small">جارٍ التحميل…</p>';
  if (!hxOn()) return '<div class="fdpage"><h2>📣 التثقيف</h2><div class="warn">اربط «حصة» بالمحطة أولاً من الإعدادات ← «حصتي»، ثم انشر لمراجعيك نصائح ومواضيع وصوراً وفيديوهات يتصفحونها في تبويب «تثقيف» على «حصتي» ويعلّقون عليها.</div><p><button data-a="fdSetup">ربط «حصتي»</button></p></div>';
  var me = FD.me || {}, list = FD.posts.filter(function (x) { return FD.filter === 'all' || (FD.filter === 'mine' ? x.own : FD.filter === 'pending' ? x.status === 'pending' : x.scope === 'public' && !x.own); });
  var tab = function (v, t) { return '<button class="' + (FD.filter === v ? '' : 'sec ') + 'sm" data-a="fdFilter" data-v="' + v + '">' + t + '</button>'; };
  return '<div class="fdpage"><div class="hxtop"><h2>📣 التثقيف <small>مساحة مراجعيك على «حصتي»</small></h2><button class="sec" data-a="fdRefresh">↻ تحديث</button></div>'
    + (me.mod ? '<div class="ok">🛡 أنت إدارة المحطة: المنشورات العامة من الأخصائيين تنتظر موافقتك' + (FD.pending ? ' — <b>' + FD.pending + ' بانتظار المراجعة</b>' : '') + '. منشوراتك العامة تظهر مباشرة.</div>' : '')
    + (FD.err ? '<div class="warn">⚠ ' + esc(FD.err) + '</div>' : '')
    + '<div class="fdgrid"><div>' + fdComposer() + '</div><div><p class="fdfilters">' + tab('all', 'الكل') + tab('mine', 'منشوراتي') + tab('public', 'العامة من غيري') + (me.mod ? tab('pending', '⏳ المراجعة' + (FD.pending ? ' (' + FD.pending + ')' : '')) : '') + '</p>'
    + (list.length ? list.map(fdCard).join('') : '<p class="small">' + (FD.at ? 'لا منشورات هنا بعد. ابدأ بنصيحة قصيرة — تصل مراجعيك على «حصتي» مع إشعار.' : 'جارٍ التحميل…') + '</p>')
    + (FD.more ? '<p><button class="sec" data-a="fdMore">المزيد</button></p>' : '') + '</div></div>'
    + '<p class="small">معرّفك في المحطة: <code dir="ltr">' + esc(HX.st.did || '') + '</code>' + (me.modSet || me.mod ? '' : ' — الإشراف يُفعَّل تلقائياً من نسخة المدير، أو بمتغير MOD_ID في المحطة') + '</p></div>';
}
function fdRe() {                                                    // إعادة الرسم مع الإبقاء على ما يُكتب في المنشور والردود
  if (S.view !== 'feed') return;
  var keep = [].map.call(document.querySelectorAll('[data-fdr]'), function (t) { return [t.dataset.fdr, t.value, document.activeElement === t]; });
  main(); keep.forEach(function (k) { var n = document.querySelector('[data-fdr="' + k[0] + '"]'); if (n) { n.value = k[1]; if (k[2]) n.focus(); } });
}
function fdComments(pid) { return fdApi('GET', '/v1/posts/' + pid + '/comments').then(function (j) { FD.cm[pid] = j.comments; }).catch(function (e) { FD.cm[pid] = []; toast('⚠ ' + e.message); }).then(fdRe); }
function fdPost(id) { return FD.posts.filter(function (x) { return x.id === +id; })[0]; }
// ---------- الإجراءات
Object.assign(A, {
  feed: function () { S.view = 'feed'; S.cur = null; render(); if (hxOn() && (!FD.at || Date.now() - FD.at > 30000)) fdLoad(); },
  fdSetup: function () { S.view = 'settings'; S.setTab = 'hx'; render(); },
  fdRefresh: function () { FD.me = null; fdLoad(); },
  fdMore: function () { fdLoad(true); },
  fdFilter: function (v) { FD.filter = v; main(); },
  fdKind: function (v) { if (FD.f.kind !== v) { FD.files.forEach(function (x) { if (x.url) URL.revokeObjectURL(x.url); }); FD.files = []; } FD.f.kind = v; main(); },
  fdUnfile: function (v) { var x = FD.files.splice(+v, 1)[0]; if (x && x.url) URL.revokeObjectURL(x.url); main(); },
  fdPost: function () {
    var f = FD.f, title = f.title.trim(), body = f.body.trim(), link = f.link.trim(), yt = f.kind === 'video' || f.kind === 'reel' || f.kind === 'link';
    if (!title && !body && !FD.files.length && !link) return toast('اكتب عنواناً أو نصاً أو أضف صورة أو فيديو');
    if (link && !fdYt(link)) return toast('رابط يوتيوب غير صحيح');
    if (f.kind === 'link' && !link) return toast('ضع رابط فيديو يوتيوب');
    if (f.kind === 'image' && !FD.files.length) return toast('اختر صورة واحدة على الأقل');
    var media = [], i = 0;
    var next = function () {
      if (i >= FD.files.length) return Promise.resolve();
      FD.up = 'جارٍ رفع ' + (i + 1) + ' من ' + FD.files.length + '…'; main();
      return fdUpload(FD.files[i]).then(function (m) { media.push(m); i++; return next(); });
    };
    FD.up = 'جارٍ النشر…'; main();
    next().then(function () { return fdApi('POST', '/v1/posts', { kind: f.kind, title: title, body: body, link: yt ? link : '', media: media, scope: f.scope }); }).then(function (j) {
      FD.files.forEach(function (x) { if (x.url) URL.revokeObjectURL(x.url); }); FD.files = []; FD.f = { kind: f.kind, scope: f.scope, title: '', body: '', link: '' }; FD.up = '';
      toast(j.status === 'pending' ? '⏳ أُرسل المنشور العام للإدارة — يظهر لمراجعي «حصة» بعد الموافقة' : '✓ نُشر — يصل مراجعيك على «حصتي» الآن'); return fdLoad();
    }).catch(function (e) { FD.up = ''; main(); toast('⚠ ' + e.message); });
  },
  fdLike: function (v) { var x = fdPost(v); if (!x) return; fdApi('POST', '/v1/posts/' + x.id + '/like', { on: x.liked ? 0 : 1 }).then(function (j) { x.liked = j.liked; x.likes = j.likes; fdRe(); }).catch(function (e) { toast('⚠ ' + e.message); }); },
  fdCm: function (v) { if (FD.open[v]) { delete FD.open[v]; main(); return; } FD.open[v] = 1; delete FD.cm[v]; main(); fdComments(+v); },
  fdReply: function (v) {
    var t = document.querySelector('[data-fdr="' + v + '"]'), txt = t && t.value.trim(); if (!txt) return;
    fdApi('POST', '/v1/posts/' + v + '/comments', { body: txt }).then(function () { t.value = ''; var x = fdPost(v); if (x) x.comments++; return fdComments(+v); }).catch(function (e) { toast('⚠ ' + e.message); });
  },
  fdCmDel: function (v, el) { var pid = +el.dataset.p; if (!confirm('حذف هذا التعليق؟')) return; fdApi('POST', '/v1/comments/' + v + '/delete', {}).then(function () { var x = fdPost(pid); if (x) x.comments = Math.max(0, x.comments - 1); return fdComments(pid); }).catch(function (e) { toast('⚠ ' + e.message); }); },
  fdDel: function (v) { if (!confirm('حذف المنشور وتعليقاته وصوره نهائياً؟')) return; fdApi('POST', '/v1/posts/' + v + '/delete', {}).then(function () { FD.posts = FD.posts.filter(function (x) { return x.id !== +v; }); main(); toast('حُذف المنشور'); }).catch(function (e) { toast('⚠ ' + e.message); }); },
  fdReview: function (v, el) {
    var ok = el.dataset.ok === '1', note = ok ? '' : prompt('سبب عدم الاعتماد (يراه كاتب المنشور فقط):', 'معلومة تحتاج مصدراً علمياً');
    if (note === null) return;
    fdApi('POST', '/v1/mod/review', { id: +v, ok: ok ? 1 : 0, note: note }).then(function () { toast(ok ? '✓ اعتُمد ونُشر لكل مراجعي «حصة»' : 'رُفض المنشور وأُبلغ كاتبه'); return fdLoad(); }).catch(function (e) { toast('⚠ ' + e.message); });
  }
});
document.addEventListener('input', function (e) { var t = e.target; if (t.dataset && t.dataset.fdf) FD.f[t.dataset.fdf] = t.value; });
document.addEventListener('change', function (e) {
  var t = e.target; if (!t) return;
  if (t.dataset && t.dataset.fdf === 'scope') { FD.f.scope = t.value; main(); return; }
  if (t.id !== 'fd_files' || !t.files || !t.files.length) return;
  var fs = [].slice.call(t.files);
  if (FD.f.kind === 'image') {
    fs = fs.slice(0, 4 - FD.files.length); if (!fs.length) return toast('حتى 4 صور في المنشور');
    FD.up = 'جارٍ تجهيز الصور…'; main();
    fs.reduce(function (p, f) { return p.then(function () { return fdShrink(f).then(function (x) { x.url = URL.createObjectURL(x.blob); x.name = f.name; x.size = x.blob.size; FD.files.push(x); }); }); }, Promise.resolve())
      .catch(function (er) { toast('⚠ ' + er.message); }).then(function () { FD.up = ''; main(); });
  } else {
    var f = fs[0]; if (f.size > 60 * 1048576) return toast('الفيديو أكبر من 60 ميغابايت — قصّه أو استعمل رابط يوتيوب');
    FD.files = [{ blob: f, type: f.type || 'video/mp4', name: f.name, size: f.size }]; main();
  }
});
document.addEventListener('keydown', function (e) { var t = e.target; if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && t && t.dataset && t.dataset.fdr) { e.preventDefault(); A.fdReply(t.dataset.fdr); } });
(function (f) { main0 = function () { if (S.view === 'feed') { $('main').innerHTML = fdPage(); fdHydrate(); return; } return f.apply(this, arguments); }; })(main0);
(function (f) { render = function () { var r = f.apply(this, arguments); fdRail(); return r; }; })(render);
(function (f) { hxTimer = function () { var r = f.apply(this, arguments); if (hxOn() && !FD.at) setTimeout(function () { if (!FD.at) fdLoad(); }, 1500); return r; }; })(hxTimer);
