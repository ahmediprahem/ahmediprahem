// ================= 0.66: برنامج التمرين وقائمة التسوق للعميل + استيراد عميل جاهز (يُدمج داخل app.js عند /*GYMUI*/)
// c.work = برنامج التمرين (أيام، تمارين، فيديو لكل تمرين: يوتيوب أو رابط أو فيديو مرفوع على المحطة)، c.shop = قائمة التسوق، c.rawSnap = خطة غذائية جاهزة (لقطة «حصتي»).
// كلها تُرسَل مع الخطة إلى «حصتي»: تمريني (بالأيام والأوقات، والفيديو بلمسة) وقائمة التسوق (مع تعليم ما اشتراه العميل).
function gyVid(s) {
  s = String(s || '').trim(); if (!s) return null;
  var m = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&#].*)?$/.exec(s); if (m) return { yt: m[1] };
  return /^https:\/\//.test(s) ? { url: s.slice(0, 400) } : false;
}
function gyShow(v) { return !v ? '' : v.yt ? 'https://youtu.be/' + v.yt : v.m ? '(فيديو مرفوع على المحطة)' : v.url || ''; }
function gyEmbed(id) {                                   // oEmbed ليوتيوب: 200 = يسمح بالتضمين، 401/403 = يمنعه، 404 = محذوف أو خاص
  return fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id), { cache: 'no-store' }).then(function (r) { return r.ok ? 1 : (r.status === 401 || r.status === 403 || r.status === 404 ? 0 : -1); }).catch(function () { return -1; });
}
function gyShopText(sh) { return sh ? (sh.groups || []).map(function (g) { return '# ' + g.g + '\n' + (g.items || []).map(function (i) { return i.n + (i.q ? ' | ' + i.q : ''); }).join('\n'); }).join('\n') : ''; }
function gyShopParse(t, old) {
  var groups = [], g = null; String(t || '').split('\n').forEach(function (ln) {
    ln = ln.trim(); if (!ln) return; if (ln.charAt(0) === '#') { g = { g: ln.replace(/^#+\s*/, '').slice(0, 40), items: [] }; groups.push(g); return; }
    if (!g) { g = { g: 'أخرى', items: [] }; groups.push(g); } var p = ln.split('|'); if (g.items.length < 40) g.items.push({ n: p[0].trim().slice(0, 80), q: (p[1] || '').trim().slice(0, 60) });
  });
  return { title: old && old.title || 'قائمة المشتريات الأسبوعية', prep: old && old.prep || [], groups: groups.slice(0, 12) };
}

// ---- 0.74: مكتبة التمارين: عامة لكل العملاء، تُرسَل مع كل خطة وتظهر في «حصتي ← خطتي ← المكتبة» (بحث ومجموعات وفيديو وسجل أوزان)
function exlib() { S.settings = S.settings || {}; if (!Array.isArray(S.settings.exlib)) S.settings.exlib = []; return S.settings.exlib; }
function lbGuess(t) {
  var m = [['صدر', /صدر|بنش|ضغط|فلاي|ديبس|chest|bench|fly|dip/i], ['ظهر', /ظهر|سحب|رو |لات|back|row|pull|lat/i], ['أرجل', /رجل|أرجل|سكوات|ثبات|لانج|ليج|squat|leg|lunge|calf|سمانة/i], ['أكتاف', /كتف|أكتاف|جانبي|shoulder|lateral|press/i], ['ذراعين', /باي|ترا|ذراع|مطرقة|curl|triceps|biceps|hammer/i], ['بطن', /بطن|بلانك|كرنش|abs|plank|crunch/i], ['كارديو', /كارديو|مشي|جري|cardio|walk|run/i]];
  for (var i = 0; i < m.length; i++) if (m[i][1].test(t)) return m[i][0]; return 'عام';
}
function libMerge(w) {
  var L = exlib(), n = 0; if (!w || !Array.isArray(w.days)) return 0;
  w.days.forEach(function (d) { (d.ex || []).forEach(function (e) {
    var k = String(e.n || '').trim(); if (!k || L.length >= 300) return; var o = L.filter(function (x) { return x.n === k; })[0];
    if (o) { if (!o.v && e.v) { o.v = e.v; n++; } return; }
    L.push({ n: k.slice(0, 80), en: String(e.en || '').slice(0, 60), g: lbGuess(k + ' ' + (e.en || '') + ' ' + (d.name || '')), cues: (e.cues || []).slice(0, 10), v: e.v || null }); n++;
  }); });
  if (n) saveSettings(); return n;
}
function libCard() {
  var L = exlib(), h = '<div class="ucard"><details><summary><b>📚 مكتبة التمارين (' + L.length + ')</b> <small>تصل كل عملائك في «حصتي ← خطتي ← المكتبة»</small></summary>';
  h += '<p class="small">أي تمرين هنا يفتحه أي عميل لديه «حصتي» بفيديوه وطريقة أدائه، ويسجّل أوزانه عليه. تُرسَل مع «أرسل الخطة».</p><p class="two"><button class="sec sm" data-a="libAdd">➕ تمرين جديد</button><button class="sec sm" data-a="libFromWork">⬇ أضف تمارين برنامج هذا العميل</button></p>';
  h += L.map(function (e, i) { return '<div class="gye"><input class="gyv" data-lf="' + i + '|n" value="' + esc(e.n) + '" placeholder="الاسم" aria-label="اسم التمرين"><input class="gyv" data-lf="' + i + '|en" value="' + esc(e.en) + '" placeholder="English" dir="ltr"><input class="gyv" data-lf="' + i + '|g" value="' + esc(e.g) + '" placeholder="المجموعة العضلية"><input class="gyv" data-lf="' + i + '|v" value="' + esc(gyShow(e.v)) + '" placeholder="رابط فيديو" dir="ltr"><button class="sec sm" data-a="libDel" data-v="' + i + '" aria-label="حذف">🗑</button></div>'; }).join('');
  return h + '</details></div>';
}
function gymCard(c) {
  var w = c.work, nEx = 0, nVid = 0, x = c.hx;
  if (w) w.days.forEach(function (d) { (d.ex || []).forEach(function (e) { nEx++; if (e.v) nVid++; }); });
  var h = '<div class="ucard gym"><h3>🏋 التمرين وقائمة التسوق <small>في «حصتي»: تمريني • قائمة التسوق</small></h3>';
  if (!w) h += '<p class="small">لا برنامج تمرين لهذا العميل بعد. حمّل ملف برنامج (JSON) فيصل العميل في «حصتي ← خطتي ← تمريني» بالأيام والأوقات، وفي كل تمرين فيديو بلمسة.</p>';
  else {
    h += '<p>' + esc(w.title || 'برنامج التمرين') + ' • ' + w.days.filter(function (d) { return d.kind !== 'rest'; }).length + ' أيام تمرين • ' + nEx + ' تمريناً • فيديو مباشر في ' + nVid + ' منها</p>';
    h += w.days.slice().sort(function (a, b) { return (a.d + 6) % 7 - (b.d + 6) % 7; }).filter(function (d) { return d.kind !== 'rest'; }).map(function (d) {
      var di = w.days.indexOf(d); return '<details class="gyd"><summary><b>' + esc(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d.d]) + ' — ' + esc(d.name) + '</b> <small>' + esc(d.time || '') + '</small></summary>' + (d.ex || []).map(function (e, ei) {
        return '<div class="gye"><span><b>' + esc(e.n) + '</b> <small>' + esc(e.sr || '') + '</small></span><input class="gyv" data-gv="' + di + '|' + ei + '" placeholder="رابط فيديو (يوتيوب أو غيره)" value="' + esc(gyShow(e.v)) + '" aria-label="فيديو ' + esc(e.n) + '"><label class="sec sm gyup">رفع فيديو<input type="file" accept="video/mp4,video/webm,video/quicktime" data-gup="' + di + '|' + ei + '" hidden></label>' + (e.v ? (e.v.yt && e.v.x ? '<span class="gyno" title="يمنع التضمين: سيُفتح في يوتيوب">⚠</span>' : '<span class="gyok" title="فيديو مضبوط">✓</span>') : '') + '</div>';
      }).join('') + '</details>';
    }).join('');
    h += '<p class="small">الروابط التي تفتح نتائج بحث يوتيوب تعمل، لكن الأفضل رابط فيديو محدد فيُشغَّل داخل «حصتي» مباشرة. يمكنك رفع فيديو على المحطة (حتى 60 م.ب) فيُفتح من «حصتي» دون يوتيوب.</p>';
  }
  if (w && nVid) h += '<p class="two"><button class="sec sm" data-a="gymCheck">🔎 افحص أن فيديوهات يوتيوب تعمل داخل «حصتي»</button></p><p class="small" id="gycheck"></p>';
  h += '<p class="two"><button class="sec sm" data-a="gymLoad">📂 ' + (w ? 'استبدال البرنامج من ملف' : 'تحميل برنامج من ملف') + '</button>' + (w ? '<button class="sec sm" data-a="gymClear">🗑 إزالة البرنامج</button>' : '') + '<input type="file" id="gymf" accept=".json" hidden></p>';
  h += '<h4>🛒 قائمة التسوق</h4><p class="small">سطر «# اسم المجموعة» ثم الأصناف: «الصنف | الكمية». إن تركتها فارغة تُولَّد تلقائياً من الخطة (مجموع الجرامات الأسبوعي).</p><textarea class="gys" rows="7" data-gshop placeholder="# البروتين&#10;دجاج | 2.5 كجم">' + esc(gyShopText(c.shop)) + '</textarea>';
  if (c.rawSnap) h += '<p class="small">🍽 الخطة الغذائية لهذا العميل مستوردة جاهزة (' + c.rawSnap.days.length + ' أيام).</p>';
  if (!x) h += '<p class="two"><button data-a="gymAccount">🔑 إنشاء دخول «حصتي» لهذا العميل (اسم مستخدم وكلمة سر)</button></p><p class="small">يُفتح نموذج الدعوة مربوطاً بهذا العميل؛ بعد أن يدخل العميل ويسجّل بياناته تضغط «اعتماد» فتصله خطته وبرنامجه وقائمة تسوقه تلقائياً.</p>';
  if (x) h += '<p class="small">أرسل الخطة بعد التعديل من «حصتي ← ➤ أرسل الخطة المحدَّثة».</p>';
  return h + '</div>';
}
(function (f) { ciTab = function (c) { var h = f.apply(this, arguments); return libCard() + gymCard(c) + h; }; })(ciTab);
Object.assign(A, {
  libAdd: function () { var n = (prompt('اسم التمرين (بالعربية)') || '').trim().slice(0, 80); if (!n) return; var L = exlib(); if (L.some(function (x) { return x.n === n; })) { toast('موجود في المكتبة'); return; } L.unshift({ n: n, en: '', g: lbGuess(n), cues: [], v: null }); saveSettings().then(main); },
  libFromWork: function () { var c = cur(); if (!c || !c.work) { toast('لا برنامج تمرين لهذا العميل'); return; } var n = libMerge(c.work); toast(n ? '✓ أُضيف/حُدّث ' + n + ' تمريناً في المكتبة' : 'كلها موجودة في المكتبة'); main(); },
  libDel: function (v) { var L = exlib(), e = L[+v]; if (!e || !confirm('حذف «' + e.n + '» من المكتبة؟')) return; L.splice(+v, 1); saveSettings().then(main); },
  gymCheck: function () {
    var c = cur(); if (!c || !c.work) return; var all = []; c.work.days.forEach(function (d) { (d.ex || []).forEach(function (e) { if (e.v && e.v.yt) all.push(e); }); }); var box = document.getElementById('gycheck'), done = 0, bad = [], unk = 0;
    if (!all.length) { toast('لا فيديوهات يوتيوب للفحص'); return; } var next = 0;
    function one() { if (next >= all.length) return Promise.resolve(); var e = all[next++]; return gyEmbed(e.v.yt).then(function (k) { done++; if (k === 0) { e.v.x = 1; bad.push(e.n); } else if (k === 1) delete e.v.x; else unk++; if (box) box.textContent = 'جارٍ الفحص… ' + done + ' من ' + all.length; return one(); }); }
    Promise.all([one(), one(), one(), one()]).then(function () { return persist(c); }).then(function () { toast(unk === all.length ? 'تعذّر الفحص الآن (لا اتصال بيوتيوب)' : '✓ تعمل ' + (all.length - bad.length - unk) + ' من ' + all.length + (bad.length ? ' • تمنع التضمين: ' + bad.length : '')); main(); setTimeout(function () { var b = document.getElementById('gycheck'); if (b) b.textContent = bad.length ? 'تمنع التضمين (ستُفتح في يوتيوب): ' + bad.join('، ') : (unk ? 'تعذّر فحص ' + unk + ' منها' : 'كلها تعمل داخل «حصتي».'); }, 50); });
  },
  gymAccount: function () { var c = cur(); if (!c) return; HX.pre = { l: c.name || '', p: c.phone || '', cl: c.code, m: 'cred', u: '' }; HX.form = true; A.hxv(); },
  gymLoad: function () { var i = document.getElementById('gymf'); if (i) i.click(); },
  gymClear: function () { var c = cur(); if (!c || !confirm('إزالة برنامج التمرين من ملف هذا العميل؟ (ما أُرسل لـ«حصتي» يبقى حتى ترسل خطة جديدة)')) return; c.work = null; persist(c).then(main); },
  importClient: function () { var i = document.getElementById('impc'); if (i) i.click(); }
});
function gyReadFile(file, cb) { var r = new FileReader(); r.onload = function () { try { cb(JSON.parse(r.result)); } catch (e) { toast('الملف ليس JSON صالحاً'); } }; r.readAsText(file); }
document.addEventListener('change', function (e) {
  var t = e.target, c;
  if (t.id === 'gymf' && t.files && t.files[0] && (c = cur())) { gyReadFile(t.files[0], function (j) { var w = j.work || (j.days ? j : null); if (!w || !Array.isArray(w.days) || !w.days.length) { toast('لا برنامج تمرين في هذا الملف'); return; } c.work = w; libMerge(w); if (j.shop) c.shop = j.shop; persist(c).then(function () { toast('✓ حُمِّل برنامج التمرين'); main(); }); }); t.value = ''; return; }
  if (t.id === 'impc' && t.files && t.files[0]) { gyReadFile(t.files[0], function (j) {
    if (!j || j.hissaClient !== 1 || !j.client || !j.client.name) { toast('هذا ليس ملف عميل جاهز من «حصة»'); return; }
    var c = newClient('ath'); Object.assign(c, { name: String(j.client.name).slice(0, 80), sex: j.client.sex === 'أنثى' ? 'أنثى' : 'ذكر', age: +j.client.age || c.age, weight: +j.client.weight || c.weight, height: +j.client.height || c.height, notes: String(j.client.notes || '').slice(0, 1000) });
    if (j.snap && Array.isArray(j.snap.days) && j.snap.days.length) c.rawSnap = j.snap; if (j.work && Array.isArray(j.work.days)) { c.work = j.work; libMerge(j.work); } if (j.shop) c.shop = j.shop;
    S.clients.push(c); S.view = 'client'; S.cur = c.code; S.tab = 'client'; S.page = 'sum'; persist(c); S.versions = []; render(); toast('✓ أُضيف العميل «' + c.name + '» بخطته وبرنامجه وقائمة تسوقه');
    var ac = j.account;             // الملف يحمل اسم مستخدم وكلمة سر: يُنشأ دخول العميل تلقائياً (مربوطاً بهذا العميل) فيدخل «حصتي» مباشرة
    if (ac && /^[a-z0-9._-]{3,30}$/.test(String(ac.u || '')) && String(ac.pw || '').length >= 10 && /[A-Za-z]/.test(ac.pw) && /\d/.test(ac.pw)) {
      if (!hxOn()) { toast('أُضيف العميل. اربط المحطة من «الإعدادات ← حصتي» ثم أنشئ دخوله من ملفه (🔑).'); return; }
      hxInvite(c.name, c.phone || '', 14, c.kind === 'athlete' ? 'g' : 'ex').then(function (inv) { var h = Object.keys(HX.st.inv).filter(function (q) { return HX.st.inv[q] === inv; })[0]; inv.cl = c.code; return hxCredMake(h, inv, String(ac.u).toLowerCase(), ac.pw).then(function () { HX.made = h; HX.form = false; A.hxv(); toast('✓ أُنشئ دخول «' + c.name + '»: اسم المستخدم وكلمة السر جاهزان للإرسال'); }); }).catch(function (er) { toast('أُضيف العميل، وتعذّر إنشاء الدخول تلقائياً: ' + ((er && er.message) || '') + ' — أنشئه من ملفه (🔑)'); });
    } }); t.value = ''; return; }
  if (t.hasAttribute && t.hasAttribute('data-lf')) { var q0 = t.getAttribute('data-lf').split('|'), e0 = exlib()[+q0[0]]; if (!e0) return; if (q0[1] === 'v') { var v0 = gyVid(t.value); if (v0 === false) { toast('اكتب رابطاً يبدأ بـ https://'); return; } e0.v = v0 || null; } else if (q0[1] === 'n') { if (!t.value.trim()) { t.value = e0.n; return; } e0.n = t.value.trim().slice(0, 80); } else e0[q0[1]] = t.value.trim().slice(0, 60); saveSettings().then(function () { toast('✓ حُفظ'); }); return; }
  if (t.hasAttribute && t.hasAttribute('data-gv') && (c = cur()) && c.work) {
    var p = t.getAttribute('data-gv').split('|').map(Number), ex = c.work.days[p[0]] && c.work.days[p[0]].ex[p[1]]; if (!ex) return; var v = gyVid(t.value);
    if (v === false) { toast('اكتب رابطاً يبدأ بـ https://'); return; } if (v) ex.v = v; else delete ex.v; persist(c).then(function () { toast(v ? (v.yt ? '✓ فيديو يوتيوب سيُشغَّل داخل «حصتي»' : '✓ حُفظ الرابط') : 'أُزيل الفيديو'); main(); }); return;
  }
  if (t.hasAttribute && t.hasAttribute('data-gup') && t.files && t.files[0] && (c = cur()) && c.work) {
    var q = t.getAttribute('data-gup').split('|').map(Number), ex2 = c.work.days[q[0]] && c.work.days[q[0]].ex[q[1]], f = t.files[0]; if (!ex2) return;
    if (f.size > 60000000) { toast('الفيديو أكبر من 60 م.ب'); return; } if (typeof fdUpload !== 'function' || !window.HX || !HX.st || !HX.st.ident) { toast('اربط المحطة أولاً من «الإعدادات ← حصتي»'); return; }
    toast('جارٍ رفع الفيديو…'); fdUpload({ blob: f, type: f.type || 'video/mp4' }).then(function (r) { ex2.v = { m: r.key }; return persist(c); }).then(function () { toast('✓ رُفع الفيديو على المحطة'); main(); }).catch(function (er) { toast(er.message || 'تعذّر الرفع'); }); return;
  }
  if (t.hasAttribute && t.hasAttribute('data-gshop') && (c = cur())) { var sh = gyShopParse(t.value, c.shop); c.shop = sh.groups.length ? sh : null; persist(c).then(function () { toast(c.shop ? '✓ حُفظت قائمة التسوق' : 'ستُولَّد القائمة من الخطة'); }); }
});
