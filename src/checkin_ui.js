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
