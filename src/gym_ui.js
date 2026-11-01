// ================= 0.66: برنامج التمرين وقائمة التسوق للعميل + استيراد عميل جاهز (يُدمج داخل app.js عند /*GYMUI*/)
// c.work = برنامج التمرين (أيام، تمارين، فيديو لكل تمرين: يوتيوب أو رابط أو فيديو مرفوع على المحطة)، c.shop = قائمة التسوق، c.rawSnap = خطة غذائية جاهزة (لقطة «حصتي»).
// كلها تُرسَل مع الخطة إلى «حصتي»: تمريني (بالأيام والأوقات، والفيديو بلمسة) وقائمة التسوق (مع تعليم ما اشتراه العميل).
function gyVid(s) {
  s = String(s || '').trim(); if (!s) return null;
  var m = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&#].*)?$/.exec(s); if (m) return { yt: m[1] };
  return /^https:\/\//.test(s) ? { url: s.slice(0, 400) } : false;
}
function gyShow(v) { return !v ? '' : v.yt ? 'https://youtu.be/' + v.yt : v.m ? '(فيديو مرفوع على المحطة)' : v.url || ''; }
function gyShopText(sh) { return sh ? (sh.groups || []).map(function (g) { return '# ' + g.g + '\n' + (g.items || []).map(function (i) { return i.n + (i.q ? ' | ' + i.q : ''); }).join('\n'); }).join('\n') : ''; }
function gyShopParse(t, old) {
  var groups = [], g = null; String(t || '').split('\n').forEach(function (ln) {
    ln = ln.trim(); if (!ln) return; if (ln.charAt(0) === '#') { g = { g: ln.replace(/^#+\s*/, '').slice(0, 40), items: [] }; groups.push(g); return; }
    if (!g) { g = { g: 'أخرى', items: [] }; groups.push(g); } var p = ln.split('|'); if (g.items.length < 40) g.items.push({ n: p[0].trim().slice(0, 80), q: (p[1] || '').trim().slice(0, 60) });
  });
  return { title: old && old.title || 'قائمة المشتريات الأسبوعية', prep: old && old.prep || [], groups: groups.slice(0, 12) };
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
        return '<div class="gye"><span><b>' + esc(e.n) + '</b> <small>' + esc(e.sr || '') + '</small></span><input class="gyv" data-gv="' + di + '|' + ei + '" placeholder="رابط فيديو (يوتيوب أو غيره)" value="' + esc(gyShow(e.v)) + '" aria-label="فيديو ' + esc(e.n) + '"><label class="sec sm gyup">رفع فيديو<input type="file" accept="video/mp4,video/webm,video/quicktime" data-gup="' + di + '|' + ei + '" hidden></label>' + (e.v ? '<span class="gyok" title="فيديو مضبوط">✓</span>' : '') + '</div>';
      }).join('') + '</details>';
    }).join('');
    h += '<p class="small">الروابط التي تفتح نتائج بحث يوتيوب تعمل، لكن الأفضل رابط فيديو محدد فيُشغَّل داخل «حصتي» مباشرة. يمكنك رفع فيديو على المحطة (حتى 60 م.ب) فيُفتح من «حصتي» دون يوتيوب.</p>';
  }
  h += '<p class="two"><button class="sec sm" data-a="gymLoad">📂 ' + (w ? 'استبدال البرنامج من ملف' : 'تحميل برنامج من ملف') + '</button>' + (w ? '<button class="sec sm" data-a="gymClear">🗑 إزالة البرنامج</button>' : '') + '<input type="file" id="gymf" accept=".json" hidden></p>';
  h += '<h4>🛒 قائمة التسوق</h4><p class="small">سطر «# اسم المجموعة» ثم الأصناف: «الصنف | الكمية». إن تركتها فارغة تُولَّد تلقائياً من الخطة (مجموع الجرامات الأسبوعي).</p><textarea class="gys" rows="7" data-gshop placeholder="# البروتين&#10;دجاج | 2.5 كجم">' + esc(gyShopText(c.shop)) + '</textarea>';
  if (c.rawSnap) h += '<p class="small">🍽 الخطة الغذائية لهذا العميل مستوردة جاهزة (' + c.rawSnap.days.length + ' أيام).</p>';
  if (x) h += '<p class="small">أرسل الخطة بعد التعديل من «حصتي ← ➤ أرسل الخطة المحدَّثة».</p>';
  return h + '</div>';
}
(function (f) { ciTab = function (c) { var h = f.apply(this, arguments); return gymCard(c) + h; }; })(ciTab);
Object.assign(A, {
  gymLoad: function () { var i = document.getElementById('gymf'); if (i) i.click(); },
  gymClear: function () { var c = cur(); if (!c || !confirm('إزالة برنامج التمرين من ملف هذا العميل؟ (ما أُرسل لـ«حصتي» يبقى حتى ترسل خطة جديدة)')) return; c.work = null; persist(c).then(main); },
  importClient: function () { var i = document.getElementById('impc'); if (i) i.click(); }
});
function gyReadFile(file, cb) { var r = new FileReader(); r.onload = function () { try { cb(JSON.parse(r.result)); } catch (e) { toast('الملف ليس JSON صالحاً'); } }; r.readAsText(file); }
document.addEventListener('change', function (e) {
  var t = e.target, c;
  if (t.id === 'gymf' && t.files && t.files[0] && (c = cur())) { gyReadFile(t.files[0], function (j) { var w = j.work || (j.days ? j : null); if (!w || !Array.isArray(w.days) || !w.days.length) { toast('لا برنامج تمرين في هذا الملف'); return; } c.work = w; if (j.shop) c.shop = j.shop; persist(c).then(function () { toast('✓ حُمِّل برنامج التمرين'); main(); }); }); t.value = ''; return; }
  if (t.id === 'impc' && t.files && t.files[0]) { gyReadFile(t.files[0], function (j) {
    if (!j || j.hissaClient !== 1 || !j.client || !j.client.name) { toast('هذا ليس ملف عميل جاهز من «حصة»'); return; }
    var c = newClient('ath'); Object.assign(c, { name: String(j.client.name).slice(0, 80), sex: j.client.sex === 'أنثى' ? 'أنثى' : 'ذكر', age: +j.client.age || c.age, weight: +j.client.weight || c.weight, height: +j.client.height || c.height, notes: String(j.client.notes || '').slice(0, 1000) });
    if (j.snap && Array.isArray(j.snap.days) && j.snap.days.length) c.rawSnap = j.snap; if (j.work && Array.isArray(j.work.days)) c.work = j.work; if (j.shop) c.shop = j.shop;
    S.clients.push(c); S.view = 'client'; S.cur = c.code; S.tab = 'client'; S.page = 'sum'; persist(c); S.versions = []; render(); toast('✓ أُضيف العميل «' + c.name + '» بخطته وبرنامجه وقائمة تسوقه'); }); t.value = ''; return; }
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
