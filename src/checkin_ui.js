// ================= «الحضور» (0.50): ملخص العميل عند الزيارة أو المتابعة (يُدمج داخل app.js عند /*CHECKUI*/)
// كل ما يحتاجه الأخصائي في شاشة واحدة: البيانات والحالة الصحية، الوزن واتجاهه، آخر خطة، الالتزام يوماً بيوم وما زاده أو خرج عنه،
// تنبيهات التحاليل، ثم «سجّل الحضور» (يُغلق موعد اليوم ويحفظ وزن الزيارة) و«＋ نظام غذائي جديد».
function ciDay(d) { var x = new Date(); x.setDate(x.getDate() + (d || 0)); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function ciWeights(c) {                                             // أوزان الزيارات و«حصتي» مرتبة زمنياً
  var a = [];
  ((c.med || {}).visits || []).forEach(function (v) { if (v.w != null) a.push({ t: new Date(v.d + 'T12:00').getTime(), w: +v.w, s: 'زيارة' }); });
  ((c.hx || {}).weights || []).forEach(function (w) { a.push({ t: +w[0], w: +w[1], s: 'حصتي' }); });
  a.sort(function (p, q) { return p.t - q.t; }); return a;
}
function ciArrow(d) { return d < -0.05 ? '<span class="ciup good">↓ ' + num(Math.abs(d)) + '</span>' : d > 0.05 ? '<span class="ciup bad">↑ ' + num(d) + '</span>' : '<span class="ciup">= 0</span>'; }
function ciTab(c) {
  var W = ciWeights(c), w0 = W.length ? W[0].w : +c.weight, wl = W.length ? W[W.length - 1].w : +c.weight, today = ciDay(0);
  var ap = (c.appts || []).filter(function (a) { return a.d === today && !a.st; })[0], seen = (c.att || []).indexOf(today) >= 0;
  var health = (c.conditions || []).concat((c.allergens || []).map(function (x) { return 'حساسية: ' + x; }));
  var plan = c.planSrc === 'ready' && c.ready ? '📗 ' + esc(c.ready.label) + ' • ' + new Date(c.ready.at).toLocaleDateString('ar') : c.plan ? '⚙ خطة المحرك ' + (c.plan.targets ? c.plan.targets.kcal + ' سعرة' : '') + (c.plan.generated ? ' • ' + new Date(c.plan.generated).toLocaleDateString('ar') : '') : 'لا خطة بعد';
  var logs = (c.hx || {}).logs || {}, days = [], s = 0, n = 0;
  for (var i = -6; i <= 0; i++) { var k = ciDay(i), l = logs[k]; days.push([k, l]); if (l && l.n) { s += l.done / l.n; n++; } }
  var rows = days.slice().reverse().map(function (q) {
    var k = q[0], l = q[1], dn = D.days[new Date(k + 'T12:00').getDay()] || '';
    if (!l) return '<div class="cid none"><b>' + esc(dn) + ' ' + k.slice(5) + '</b><span class="small">لم يسجّل</span></div>';
    var pct = l.n ? Math.round(l.done / l.n * 100) : 0, ex = [];
    Object.keys(l.sw || {}).forEach(function (z) { ex.push('⇄ بدّل إلى ' + l.sw[z]); }); Object.keys(l.note || {}).forEach(function (z) { ex.push('✎ ' + l.note[z]); }); Object.keys(l.skip || {}).forEach(function (z) { ex.push('⤼ لم يأكل وجبة ' + (+z + 1)); });
    var of = Object.keys(l.off || {}).map(function (z) { return (typeof HX_OFF !== 'undefined' && HX_OFF[z]) || z; });
    if (of.length || l.offT) ex.push('⚠ ' + of.join('، ') + (l.offT ? ' — ' + l.offT : ''));
    var wk = typeof hxWalk === 'function' ? hxWalk(l.h) : ''; if (wk) ex.unshift(wk);
    return '<div class="cid' + (pct < 60 ? ' low' : '') + (of.length ? ' off' : '') + '"><b>' + esc(dn) + ' ' + k.slice(5) + '</b><span class="hxbar"><i style="width:' + pct + '%"></i></span><span>' + pct + '%' + (l.sub ? ' ✓' : '') + '</span><small>💧 ' + num((l.water || 0) * 0.25) + ' ل</small>' + (ex.length ? '<small class="ciex">' + esc(ex.join(' • ')) + '</small>' : '') + '</div>';
  }).join('');
  var wt = W.slice(-6).map(function (x, j, a) { return '<span class="ciw">' + new Date(x.t).toLocaleDateString('ar', { day: 'numeric', month: 'short' }) + ' <b>' + num(x.w) + '</b>' + (j ? ' ' + ciArrow(x.w - a[j - 1].w) : '') + '</span>'; }).join('');
  var al = typeof medAlerts === 'function' ? medAlerts(c).filter(function (a) { return a.lvl > 1; }) : [];
  return '<div class="ci"><section class="ucard cihead"><div><h2>' + esc(c.name || c.code) + '</h2><p class="small">' + esc([c.code, c.sex, c.age ? c.age + ' سنة' : '', c.height ? c.height + ' سم' : '', c.goal, c.activity].filter(Boolean).join(' • ')) + '</p></div>'
    + '<div class="cikpi"><div><b>' + (wl ? num(wl) : '—') + '</b><small>الوزن الآن (كجم)</small></div><div><b>' + (W.length > 1 ? ciArrow(wl - w0) : '—') + '</b><small>منذ البداية</small></div><div><b>' + (n ? Math.round(s / n * 100) + '%' : '—') + '</b><small>الالتزام آخر 7 أيام</small></div></div></section>'
    + '<section class="ucard ciact"><h3>✅ الحضور</h3>' + (seen ? '<p class="ok">سُجّل حضور اليوم ✓</p>' : '<p class="small">' + (ap ? 'موعد اليوم ' + esc(ap.t || '') + ' — ' + esc(ap.type || 'متابعة') : 'لا موعد مسجّل اليوم') + '</p><div class="row"><div><label>وزن الزيارة (اختياري)</label><input id="ci_w" type="number" step="0.1" placeholder="كجم"></div><div><label>الخصر (اختياري)</label><input id="ci_ws" type="number" step="0.5" placeholder="سم"></div></div><p><button data-a="ciIn">✅ سجّل الحضور</button></p>')
    + '<p><button class="o" data-a="ciNew">＋ نظام غذائي جديد</button></p></section>'
    + profHtml(c) + '<section class="ucard"><h3>🩺 الحالة الصحية</h3>' + (health.length ? '<p class="cihl">' + esc(health.join(' • ')) + '</p>' : '<p class="small">لا حالات ولا حساسية مسجّلة.</p>') + (c.notes ? '<p class="small">ملاحظات: ' + esc(c.notes) + '</p>' : '') + (al.length ? '<p class="warn">🧪 ' + al.map(function (a) { return esc(a.msg || a.t || ''); }).join(' • ') + '</p>' : '') + '</section>'
    + '<section class="ucard"><h3>📋 آخر خطة</h3><p>' + plan + ((c.hx || {}).planV ? ' • أُرسلت إلى «حصتي» (v' + c.hx.planV + ')' : '') + '</p></section>'
    + '<section class="ucard"><h3>⚖ الوزن</h3>' + (wt ? '<div class="ciws">' + wt + '</div>' : '<p class="small">لا أوزان مسجّلة بعد.</p>') + '</section>'
    + '<section class="ucard"><h3>📅 الالتزام يوماً بيوم (آخر 7 أيام)</h3>' + (c.hx ? rows : '<p class="small">العميل غير مرتبط بـ«حصتي» — الالتزام اليومي يظهر هنا بعد ربطه.</p>') + '</section>'
    + '</div>';
}
Object.assign(A, {
  ciIn: function () {
    var c = cur(); if (!c) return; var t = ciDay(0), w = parseFloat(($('#ci_w') || {}).value), ws = parseFloat(($('#ci_ws') || {}).value);
    c.att = (c.att || []).concat([t]).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(-200);
    (c.appts || []).forEach(function (a) { if (a.d === t && !a.st) a.st = 'done'; });
    if (w > 20 && w < 400 || ws > 30 && ws < 300) { var m = c.med = c.med || {}; m.visits = m.visits || []; var v = { id: 'v' + Date.now(), d: t }; if (w > 20 && w < 400) { v.w = Math.round(w * 10) / 10; c.weight = v.w; } if (ws > 30 && ws < 300) v.waist = ws; m.visits.push(v); }
    persist(c).then(function () { toast('سُجّل حضور ' + (c.name || '') + ' ✓'); main(); if (typeof wkRail === 'function') wkRail(); });
  },
  ciNew: function () { S.tab = 'client'; main(); setTimeout(function () { var g = document.querySelector('main .rdgen') || document.querySelector('main [data-a="gen"]'); if (g) { g.scrollIntoView({ block: 'center' }); g.classList.add('ciflash'); } toast('اختر: خطة جاهزة أو خطة جديدة'); }, 50); }
});

// ---- 0.52: «المتوفر عند العميل» و«ملفه» من «حصتي» في صفحته، وضبط الكارب سايكل على أيام تمرينه
function panBox(c) {
  var P = c.pantry; if (!P) return '';
  var MN = { B: 'الفطور', L: 'الغداء', D: 'العشاء', S: 'السناك' }, row = function (k) { var m = P[k] || {}, ks = Object.keys(m); if (k === 'S' && P.noS) return '<li><b>السناك:</b> 🚫 لا يريد سناك</li>'; return '<li><b>' + MN[k] + ' (' + ks.length + '):</b> ' + esc(ks.map(function (n) { return n + (m[n] === 'c' ? ' ◐' : ''); }).join('، ') || '—') + '</li>'; };
  return '<details class="ucard panbox"><summary>🛒 المتوفر عند العميل (من «حصتي») — ' + new Date(P.at).toLocaleDateString('ar') + (c.panUse === false ? ' • غير مستعمل' : ' • يُستعمل في التوليد') + '</summary><ul>' + ['B', 'L', 'D', 'S'].map(row).join('') + '</ul><p class="small">◐ = يقدر يوفّره. المحرك يفضّل المتوفر عنده لكل وجبة ويؤخر ما لم يختره من نفس المجموعة.</p>'
    + '<p><label class="chk"><input type="checkbox" data-panuse ' + (c.panUse === false ? '' : 'checked') + '> استعمل قائمة المتوفر عند توليد الخطة</label>' + (P.noS && +c.meals > 3 ? ' <button class="sec sm" data-a="panNoSnack">لا يريد سناك: اجعل الوجبات 3</button>' : '') + '</p></details>';
}
function profHtml(c) {
  var a = c.prof; if (!a) return ''; var D7 = D.days, L = [['waist', 'الخصر', function (v) { return v + ' سم'; }], ['job', 'طبيعة العمل'], ['nat', 'الجنسية', function (v) { return v + (a.natT ? ' (' + a.natT + ')' : ''); }], ['mar', 'الحالة الاجتماعية'], ['vit', 'الفيتامينات والأنيميا', function (v) { return v.join('، ') + (a.vitT ? ' — ' + a.vitT : ''); }], ['tr', 'يتمرن'], ['trT', 'نوع التمرين', function (v) { return v.join('، '); }], ['trD', 'أيام التمرين', function (v) { return v.map(function (i) { return D7[i]; }).join('، '); }], ['trM', 'المدة'], ['fol', 'المتابعة', function (v) { return v + (a.ch && a.ch.length ? ' (' + a.ch.join('، ') + ')' : ''); }]];
  return '<section class="ucard"><h3>📋 ملفه من «حصتي» <small>' + new Date(a.at).toLocaleDateString('ar') + '</small></h3><dl class="cidl">' + L.filter(function (q) { return a[q[0]] != null && a[q[0]] !== '' && !(Array.isArray(a[q[0]]) && !a[q[0]].length); }).map(function (q) { return '<dt>' + q[1] + '</dt><dd>' + esc(q[2] ? q[2](a[q[0]]) : a[q[0]]) + '</dd>'; }).join('') + '</dl></section>';
}
function trainDays(c) {                                             // أيام التمرين: جدول الرياضي، أو ما اختاره في «حصتي»
  if (c.kind === 'athlete' && Array.isArray(c.schedule)) { var t = []; c.schedule.forEach(function (s, i) { if (s && +s.min > 0) t.push(i); }); if (t.length) return t; }
  return Array.isArray(c.wdays) ? c.wdays.slice() : [];
}
function carbLvl(t) { t = String(t || ''); return /كارب (عالي|مرتفع)/.test(t) ? 3 : /كارب متوسط/.test(t) ? 2 : /كارب منخفض/.test(t) ? 1 : 0; }
function alignCarb(days, td) {                                      // أيام الكارب الأعلى تقع على أيام التمرين، مع بقاء الترتيب النسبي
  if (!td || !td.length || days.length !== 7 || !days.some(function (d) { return carbLvl(d.t); })) return null;
  var idx = days.map(function (d, i) { return i; }).sort(function (a, b) { return carbLvl(days[b].t) - carbLvl(days[a].t) || a - b; }), hi = idx.slice(0, td.length).sort(function (a, b) { return a - b; }), lo = idx.slice(td.length).sort(function (a, b) { return a - b; }), out = new Array(7);
  td.slice().sort(function (a, b) { return a - b; }).forEach(function (w, j) { out[w] = days[hi[j]]; }); var k = 0; for (var w = 0; w < 7; w++) if (!out[w]) out[w] = days[lo[k++]];
  return out;
}
Object.assign(A, { panNoSnack: function () { var c = cur(); if (!c) return; c.meals = 3; persist(c).then(function () { toast('صارت الوجبات 3 بلا سناك — أعد التوليد'); main(); }); } });
document.addEventListener('change', function (e) { var t = e.target, c; if (!t.hasAttribute || !t.hasAttribute('data-panuse') || !(c = cur())) return; c.panUse = t.checked; persist(c).then(main); });

// ---- 0.53: قياس الأسبوع وصور الإنبودي والتحاليل وصور التقدم من «حصتي»
(function (f) { hxIn = function (c, p) {
  var x = c.hx, nm = c.name || x.label || '', okImg = function (s) { return typeof s === 'string' && s.length < 300000 && /^[A-Za-z0-9+/=]+$/.test(s); };
  if (p.t === 'wk' && +p.w > 20 && +p.w < 400) {
    var w = Math.round(+p.w * 10) / 10, ws = +p.waist > 30 && +p.waist < 300 ? +p.waist : null, ts = +p.ts || Date.now(), d = new Date(ts), dk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    x.weights = (x.weights || []).concat([[ts, w]]).slice(-200); x.checks = (x.checks || []).concat([{ ts: ts, w: w, waist: ws }]).slice(-60); c.weight = w;
    var m = c.med = c.med || {}; m.visits = m.visits || []; var v = { id: 'h' + ts, d: dk, w: w, note: 'قياس أسبوعي من «حصتي»' }; if (ws) v.waist = ws; m.visits.push(v);
    x.wkNew = (x.wkNew || 0) + 1; toast('⚖ ' + nm + ' سجّل قياس الأسبوع: ' + w + ' كجم' + (ws ? ' • خصر ' + ws : '')); return 1;
  }
  if (p.t === 'wkimg' && okImg(p.img) && p.id && (p.kind === 'inb' || p.kind === 'lab')) {
    if ((x.wkimgs || []).some(function (q) { return q.id === p.id; })) return 0;
    x.wkimgs = (x.wkimgs || []).concat([{ id: String(p.id).slice(0, 24), kind: p.kind, ts: +p.ts || Date.now(), img: 'data:image/jpeg;base64,' + p.img }]).slice(-40); return 1;
  }
  if (p.t === 'body' && okImg(p.img) && p.id) {
    if ((x.bodies || []).some(function (q) { return q.id === p.id; })) return 0;
    x.bodies = (x.bodies || []).concat([{ id: String(p.id).slice(0, 24), ts: +p.ts || Date.now(), pub: !!p.pub, img: 'data:image/jpeg;base64,' + p.img }]).slice(-30); x.bdNew = (x.bdNew || 0) + 1;
    toast('📸 ' + nm + ' أرسل صورة تقدم' + (p.pub ? ' (يوافق على النشر بلا وجه)' : '')); return 1;
  }
  return f.apply(this, arguments);
}; })(hxIn);
function ciProgress(c) {
  var x = c.hx || {}, ch = (x.checks || []).slice(-6), im = (x.wkimgs || []).slice(-6).reverse(), bd = x.bodies || [], h = '';
  if (ch.length) h += '<section class="ucard"><h3>⚖ قياسات «حصتي» الأسبوعية</h3><div class="ciws">' + ch.map(function (q, i) { var dd = i ? q.w - ch[i - 1].w : 0; return '<span class="ciw">' + new Date(q.ts).toLocaleDateString('ar', { day: 'numeric', month: 'short' }) + ' <b>' + num(q.w) + '</b>' + (i ? ' ' + ciArrow(dd) : '') + (q.waist ? ' • خصر ' + num(q.waist) : '') + '</span>'; }).join('') + '</div>'
    + (im.length ? '<div class="ciimgs">' + im.map(function (q) { return '<figure><img alt="" src="' + q.img + '" data-a="ciZoom"><figcaption>' + (q.kind === 'inb' ? 'إنبودي' : 'تحاليل') + ' • ' + new Date(q.ts).toLocaleDateString('ar') + '</figcaption></figure>'; }).join('') + '</div>' : '') + '</section>';
  if (bd.length) { var a = bd[0], b = bd[bd.length - 1]; h += '<section class="ucard"><h3>📸 قبل وبعد</h3><div class="cibd"><figure><img alt="" src="' + a.img + '" data-a="ciZoom"><figcaption>البداية • ' + new Date(a.ts).toLocaleDateString('ar') + '</figcaption></figure>' + (bd.length > 1 ? '<figure><img alt="" src="' + b.img + '" data-a="ciZoom"><figcaption>الآن • ' + new Date(b.ts).toLocaleDateString('ar') + '</figcaption></figure>' : '') + '</div><p class="small">' + bd.length + ' صور • ' + (b.pub ? '✓ يوافق على نشر الأخيرة بعد إخفاء الوجه وأي بيانات' : 'لا يوافق على النشر — للمتابعة فقط') + '</p></section>'; }
  return h;
}
(function (f) { ciTab = function (c) { var h = f.apply(this, arguments); if (c.hx) { c.hx.wkNew = 0; c.hx.bdNew = 0; } return h.replace("<section class=\"ucard\"><h3>⚖ الوزن</h3>", ciProgress(c) + "<section class=\"ucard\"><h3>⚖ الوزن</h3>"); }; })(ciTab);
(function (f) { wkItems = function () { var out = f.apply(this, arguments), hid = wkHidden(); S.clients.forEach(function (c) { var x = c.hx; if (!x) return; if (x.wkNew && !hid[c.code + ':wk']) out.push({ c: c, pri: 1, ic: '⚖', txt: 'قياس أسبوعي جديد من «حصتي»', tab: 'ci', key: c.code + ':wk' }); if (x.bdNew && !hid[c.code + ':bd']) out.push({ c: c, pri: 2, ic: '📸', txt: 'صورة تقدم جديدة', tab: 'ci', key: c.code + ':bd' }); }); return out.sort(function (a, b) { return a.pri - b.pri; }); }; })(wkItems);
Object.assign(A, { ciZoom: function (v, el) { var o = document.createElement('div'); o.className = 'cizoom'; o.innerHTML = '<img alt="" src="' + el.getAttribute('src') + '">'; o.onclick = function () { o.remove(); }; document.body.appendChild(o); } });

// ---- 0.54: متابعة أسبوعية ثابتة (تُنشئ مواعيد 4 أسابيع)، ووقت الرد اليومي، وتأكيد العميل قبل الموعد بيوم — كلها تصل «حصتي»
var AP_MODES = ['في العيادة', 'مكالمة', 'فيديو', 'شات'];
function apUp(c) { var now = Date.now(); return (c.appts || []).filter(function (a) { return !a.st && wkAt(a) >= now - 3600000; }).sort(function (a, b) { return wkAt(a) - wkAt(b); }).slice(0, 8); }
function hxApptSync(c, force) {
  if (!c || !c.hx || typeof hxSend !== 'function') return Promise.resolve();
  var list = apUp(c).map(function (a) { return { id: a.id, d: a.d, t: a.t, type: a.type || 'متابعة', mode: a.mode || '', conf: a.conf || '' }; }), reply = (HX.st && HX.st.replyAt) || '', sig = JSON.stringify(list) + reply;
  if (!force && c.hx.apSig === sig) return Promise.resolve(); c.hx.apSig = sig; persist(c);
  return hxSend(c, { t: 'appt', list: list, reply: reply }).catch(function () { c.hx.apSig = ''; });
}
function hxApptSyncAll(force) { S.clients.forEach(function (c) { if (c.hx && c.hx.planV) hxApptSync(c, force); }); }
['wkAdd', 'wkDel', 'wkSt'].forEach(function (k) { var f = A[k]; if (f) A[k] = function () { var r = f.apply(this, arguments); setTimeout(function () { hxApptSyncAll(); }, 50); return r; }; });
(function (f) { wkApptTab = function (c) {
  var w = c.weekly || {}, h = f.apply(this, arguments);
  var card = '<div class="ucard wkweekly"><h3>🔁 متابعة أسبوعية ثابتة</h3><p class="small">موعد إلزامي كل أسبوع تتفقان عليه؛ يُنشئ مواعيد الأسابيع الأربعة القادمة، ويصل العميل في «حصتي» مع تذكير وتأكيد قبله بيوم.</p><div class="row"><div><label>اليوم</label><select id="ww_d">' + D.days.map(function (n, i) { return '<option value="' + i + '"' + (+w.dow === i ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div><div><label>الساعة</label><input id="ww_t" type="time" value="' + esc(w.t || '18:00') + '"></div><div><label>الطريقة</label><select id="ww_m">' + AP_MODES.map(function (m) { return '<option' + (w.mode === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div></div><p><button data-a="wkWeekly">' + (c.weekly ? 'تحديث وإنشاء مواعيد 4 أسابيع' : 'حفظ وإنشاء مواعيد 4 أسابيع') + '</button>' + (c.weekly ? ' <span class="small">الحالي: كل ' + esc(D.days[w.dow]) + ' ' + esc(w.t) + ' • ' + esc(w.mode) + '</span>' : '') + '</p></div>';
  return h.replace('<div class="wktab">', '<div class="wktab">' + card);
}; })(wkApptTab);
(function (f) { wkRowHtml = function (c, a) { var h = f.apply(this, arguments); if (!a.conf) return h; var b = a.conf === 'ok' ? '<span class="apconf ok">✓ أكّد العميل</span>' : '<span class="apconf chg">✏️ يطلب تغيير' + (a.confNote ? ': ' + esc(a.confNote) : '') + '</span>'; return h.replace('</span><span class="wka">', b + '</span><span class="wka">'); }; })(wkRowHtml);
(function (f) { hxIn = function (c, p) {
  if (p.t === 'apc' && p.id) {
    var a = (c.appts || []).filter(function (q) { return q.id === p.id; })[0]; if (!a) return 0;
    a.conf = p.ok ? 'ok' : 'chg'; a.confNote = String(p.note || '').slice(0, 200); c.hx.apSig = '';
    toast((p.ok ? '✓ ' : '✏️ ') + (c.name || '') + (p.ok ? ' أكّد موعد ' : ' يطلب تغيير موعد ') + wkDate(a.d) + ' ' + a.t); return 1;
  }
  return f.apply(this, arguments);
}; })(hxIn);
(function (f) { wkItems = function () { var out = f.apply(this, arguments), hid = wkHidden(); S.clients.forEach(function (c) { apUp(c).forEach(function (a) { if (a.conf === 'chg' && !hid[c.code + ':chg' + a.id]) out.push({ c: c, pri: 0, ic: '📅', txt: 'يطلب تغيير موعد ' + wkDate(a.d) + ' ' + a.t + (a.confNote ? ': ' + a.confNote : ''), tab: 'appt', key: c.code + ':chg' + a.id }); }); }); return out.sort(function (a, b) { return a.pri - b.pri; }); }; })(wkItems);
(function (f) { hxSetPage = function () { var h = f.apply(this, arguments); return h + '<div class="ucard"><h3>⏰ وقت الرد اليومي</h3><p class="small">يرى عملاؤك في «حصتي»: «يرد أخصائيك على الرسائل يومياً الساعة …». يرسلون متى شاؤوا، وتردّ أنت مرة واحدة في وقتك.</p><label>أرد على الرسائل يومياً الساعة <input type="time" id="hx_reply" data-hxreply value="' + esc((HX.st && HX.st.replyAt) || '') + '"></label></div>'; }; })(hxSetPage);
Object.assign(A, {
  wkWeekly: function () {
    var c = cur(); if (!c) return; var dow = +$('#ww_d').value, t = $('#ww_t').value || '18:00', mode = $('#ww_m').value; c.weekly = { dow: dow, t: t, mode: mode }; c.appts = c.appts || [];
    var n = 0; for (var i = 1; n < 4 && i <= 35; i++) { var x = new Date(); x.setDate(x.getDate() + i); if (x.getDay() !== dow) continue; var d = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); n++;
      var ex = c.appts.filter(function (a) { return a.d === d && !a.st; })[0]; if (ex) { ex.t = t; ex.mode = mode; ex.type = 'متابعة أسبوعية'; continue; }
      c.appts.push({ id: 'w' + Date.now().toString(36) + i, d: d, t: t, type: 'متابعة أسبوعية', mode: mode, note: mode, at: Date.now() }); }
    persist(c).then(function () { return hxApptSync(c, true); }).then(function () { toast('🔁 مواعيد المتابعة الأسبوعية: كل ' + D.days[dow] + ' ' + t + (c.hx ? ' — وصلت «حصتي»' : '')); main(); if (typeof wkRail === 'function') wkRail(); });
  }
});
document.addEventListener('change', function (e) { var t = e.target; if (!t.hasAttribute || !t.hasAttribute('data-hxreply') || !HX.st) return; HX.st.replyAt = t.value || ''; hxSave().then(function () { hxApptSyncAll(true); toast(t.value ? '⏰ يرى عملاؤك أنك ترد يومياً الساعة ' + t.value : 'أُلغي وقت الرد اليومي'); }); });

// ---- 0.55: النقاط والمكافآت (يحددها الأخصائي)، وكود الإحالة لكل عميل، تُحسب هنا من متابعة «حصتي» وتصل العميل
function ptsCfg() { var p = (HX.st && HX.st.pts) || {}; return { on: !!p.on, per: p.per === 'm' ? 'm' : 'w', cap: +p.cap || 15, r: Object.assign({ day: 5, photo: 2, wk: 10, body: 5, att: 10 }, p.r || {}), rewards: Array.isArray(p.rewards) ? p.rewards : [{ p: 100, n: 'شهادة تقدير' }], refTxt: String(p.refTxt || ''), refDays: +p.refDays || 90 }; }
function ptsStart(per) { var x = new Date(); x.setHours(0, 0, 0, 0); if (per === 'm') x.setDate(1); else x.setDate(x.getDate() - x.getDay()); return x.getTime(); }
function dkOf(t) { var x = new Date(t); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function ptsOf(c) {                                                  // نقاط الفترة الحالية لكل يوم بسقف يومي: السلوك فقط (تسجيل، صور، قياس، حضور)، لا مقدار النزول
  var P = ptsCfg(), x = c.hx || {}, t0 = ptsStart(P.per), day = {}, add = function (k, v, why) { if (!k || new Date(k + 'T12:00').getTime() < t0) return; var d = day[k] = day[k] || { v: 0, w: [] }; d.v += v; d.w.push(why); };
  Object.keys(x.logs || {}).forEach(function (k) { if (x.logs[k].sub) add(k, P.r.day, 'تسجيل اليوم'); });
  (x.photos || []).forEach(function (q) { add(q.d || dkOf(q.ts), P.r.photo, 'صورة وجبة'); });
  (x.checks || []).forEach(function (q) { add(dkOf(q.ts), P.r.wk, 'قياس الأسبوع'); });
  (x.bodies || []).forEach(function (q) { add(dkOf(q.ts), P.r.body, 'صورة التقدم'); });
  (c.att || []).forEach(function (k) { add(k, P.r.att, 'حضور المتابعة'); });
  var tot = 0; Object.keys(day).forEach(function (k) { tot += Math.min(P.cap, day[k].v); }); return tot;
}
function ptsSync(c) {
  var P = ptsCfg(); if (!c || !c.hx || !c.hx.planV || typeof hxSend !== 'function') return; if (!c.ref) { c.ref = (c.code || 'C').replace(/\W/g, '').slice(-3) + Math.random().toString(36).slice(2, 6).toUpperCase(); persist(c); }
  var tot = P.on ? ptsOf(c) : 0, pk = P.per + ptsStart(P.per), got = (c.hx.rw = c.hx.rw || {})[pk] = c.hx.rw[pk] || [], earned = [];
  if (P.on) P.rewards.forEach(function (rw, i) { if (rw && +rw.p > 0 && tot >= +rw.p && got.indexOf(i) < 0) { got.push(i); earned.push(rw); } });
  var refs = (c.refs || []).filter(function (q) { return q.at >= Date.now() - P.refDays * 864e5; }), msg = { t: 'pts', on: P.on, total: tot, per: P.per, r: P.r, cap: P.cap, rewards: P.rewards, ref: c.ref, refs: refs.map(function (q) { return String(q.name || '').split(/\s+/)[0]; }), refTxt: P.refTxt, refDays: P.refDays }, sig = JSON.stringify(msg);
  var go = function () { return c.hx.ptSig === sig ? Promise.resolve() : hxSend(c, msg).then(function () { c.hx.ptSig = sig; persist(c); }); };
  go().then(function () { return earned.reduce(function (p, rw) { return p.then(function () { return hxSend(c, { t: 'rwd', n: String(rw.n).slice(0, 60), p: +rw.p, per: P.per }); }).then(function () { toast('🏅 ' + (c.name || '') + ' حصل على «' + rw.n + '» (' + rw.p + ' نقطة)'); c.hx.rwLog = (c.hx.rwLog || []).concat([{ n: rw.n, p: rw.p, at: Date.now() }]).slice(-30); persist(c); }); }, Promise.resolve()); }).catch(function () { });
}
var PT_T = 0; function ptsSyncAll() { clearTimeout(PT_T); PT_T = setTimeout(function () { S.clients.forEach(function (c) { if (c.hx && c.hx.planV) ptsSync(c); }); }, 400); }
(function (f) { hxIn = function () { var r = f.apply(this, arguments); ptsSyncAll(); return r; }; })(hxIn);
(function (f) { A.ciIn = function () { var r = f.apply(this, arguments); ptsSyncAll(); return r; }; })(A.ciIn);
(function (f) { hxSetPage = function () {
  var h = f.apply(this, arguments), P = ptsCfg(), R = [['day', 'كل يوم يرسل فيه «تسجيل اليوم»'], ['photo', 'كل صورة وجبة'], ['wk', 'قياس الأسبوع'], ['body', 'صورة التقدم'], ['att', 'حضور المتابعة']];
  return h + '<div class="ucard ptset"><h3>🏅 النقاط والمكافآت</h3><p class="small">على السلوك فقط (التزام وتسجيل وحضور) — لا على مقدار النزول — وبسقف يومي حتى لا تُجمع بالتكرار. القيم والمكافآت تحددها أنت.</p>'
    + '<label class="chk"><input type="checkbox" data-pt="on"' + (P.on ? ' checked' : '') + '> تفعيل النقاط لعملاء «حصتي»</label>'
    + '<div class="row"><div><label>الفترة</label><select data-pt="per"><option value="w"' + (P.per === 'w' ? ' selected' : '') + '>أسبوعية</option><option value="m"' + (P.per === 'm' ? ' selected' : '') + '>شهرية</option></select></div><div><label>السقف اليومي</label><input type="number" data-pt="cap" value="' + P.cap + '"></div>' + R.map(function (q) { return '<div><label>' + q[1] + '</label><input type="number" data-ptr="' + q[0] + '" value="' + P.r[q[0]] + '"></div>'; }).join('') + '</div>'
    + '<label>المكافآت (سطر لكل مكافأة: النقاط ثم الاسم، مثل «100 شهادة تقدير»)</label><textarea data-pt="rewards" rows="3">' + esc(P.rewards.map(function (q) { return q.p + ' ' + q.n; }).join('\n')) + '</textarea>'
    + '<div class="row"><div><label>مكافأة الدعوة (نص يراه العميل، اختياري)</label><input data-pt="refTxt" maxlength="160" value="' + esc(P.refTxt) + '" placeholder="مثال تحدده أنت"></div><div><label>صلاحية الدعوة (يوماً)</label><input type="number" data-pt="refDays" value="' + P.refDays + '"></div></div></div>';
}; })(hxSetPage);
document.addEventListener('change', function (e) {
  var t = e.target, k = t.getAttribute && (t.getAttribute('data-pt') || t.getAttribute('data-ptr')); if (!k || !HX.st) return; var P = HX.st.pts = HX.st.pts || {};
  if (t.hasAttribute('data-ptr')) { P.r = P.r || {}; P.r[k] = Math.max(0, Math.min(100, +t.value || 0)); }
  else if (k === 'on') P.on = t.checked; else if (k === 'per') P.per = t.value; else if (k === 'cap') P.cap = Math.max(1, Math.min(200, +t.value || 15)); else if (k === 'refDays') P.refDays = Math.max(7, Math.min(730, +t.value || 90)); else if (k === 'refTxt') P.refTxt = t.value.trim().slice(0, 160);
  else if (k === 'rewards') P.rewards = t.value.split('\n').map(function (l) { var m = /^\s*([\d٠-٩]+)\s+(.+)$/.exec(l); return m ? { p: +m[1].replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }), n: m[2].trim().slice(0, 60) } : null; }).filter(Boolean).slice(0, 8);
  hxSave().then(function () { ptsSyncAll(); toast('حُفظت إعدادات النقاط'); });
});
(function (f) { hxInvForm = function () { return f.apply(this, arguments).replace('placeholder="05xxxxxxxx"></div>', 'placeholder="05xxxxxxxx"></div><div><label>كود دعوة من عميل (اختياري)</label><input id="hxi_r" maxlength="12" dir="ltr" placeholder="مثال: 01AB2C"></div>'); }; })(hxInvForm);
(function (f) { hxInvite = function () { var r = (($('#hxi_r') || {}).value || '').trim().toUpperCase(); return f.apply(this, arguments).then(function (inv) { if (r && inv) { inv.ref = r.slice(0, 12); hxSave(); } return inv; }); }; })(hxInvite);
(function (f) { hxApprove = function (cid) {
  var q = HX.st.reqs[cid], inv = q && HX.st.inv[q.h], ref = inv && inv.ref, n0 = S.clients.length;
  return f.apply(this, arguments).then(function (r) {
    if (ref && S.clients.length > n0) { var nc = S.clients[S.clients.length - 1], src = S.clients.filter(function (x) { return x.ref === ref && x !== nc; })[0]; nc.refBy = ref; persist(nc); if (src) { src.refs = (src.refs || []).concat([{ code: nc.code, name: nc.name, at: Date.now() }]); persist(src).then(function () { ptsSync(src); }); toast('🤝 ' + (nc.name || '') + ' اشترك بدعوة من ' + (src.name || '')); } }
    return r;
  });
}; })(hxApprove);
function ciPts(c) {
  var P = ptsCfg(); if (!c.hx) return ''; var refs = c.refs || [];
  return '<section class="ucard"><h3>🏅 النقاط والدعوات</h3>' + (P.on ? '<p>نقاط ' + (P.per === 'm' ? 'الشهر' : 'الأسبوع') + ': <b>' + ptsOf(c) + '</b>' + ((c.hx.rwLog || []).length ? ' • مكافآت: ' + c.hx.rwLog.slice(-3).map(function (q) { return esc(q.n); }).join('، ') : '') + '</p>' : '<p class="small">النقاط غير مفعّلة (من إعدادات «حصتي»).</p>')
    + '<p class="small">كود دعوته: <b dir="ltr">' + esc(c.ref || '—') + '</b>' + (c.refBy ? ' • دخل بدعوة: ' + esc(c.refBy) : '') + ' • اشترك من طرفه: ' + refs.length + (refs.length ? ' (' + esc(refs.map(function (q) { return q.name; }).join('، ')) + ')' : '') + '</p></section>';
}
(function (f) { ciTab = function (c) { return f.apply(this, arguments).replace("<section class=\"ucard\"><h3>📋 آخر خطة</h3>", ciPts(c) + "<section class=\"ucard\"><h3>📋 آخر خطة</h3>"); }; })(ciTab);
