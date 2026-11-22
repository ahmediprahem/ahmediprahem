// ================= 1.42 ملف العميل بنمط Wellbeing (قرار المالك 2026-11-22) — يُدمج بعد cfile_ui.js
// على الحاسوب (1100 فأكثر): ثلاثة أعمدة — قائمة العملاء (1400 فأكثر) | المحتوى بتبويباته | عمود معلومات العميل (رأس الملف نفسه + أقسام قابلة للطي).
// تبويب جديد «نظرة عامة» (ov): بطاقات القياسات والتحاليل (الأحمر خارج المرجع)، «الحالة العامة»، «قائمة المهام»، ومنحنى الوزن.
// صفحة القياس (S.mx): القيمة الحالية والنطاق المرجعي وعلامة ؟ للأهمية، و«+» لإضافة قراءة، ومنحنى التقدم، وتحته سجل القراءات بتاريخها.
// لا مخزن جديد: القياسات الجسدية في c.med.visits والتحاليل في c.med.labs (نفس «الملف الطبي»)، فتدخل التقرير والتنبيهات والنسخ الاحتياطية.
CF_G[0][3].unshift('ov'); CF_L.ov = 'نظرة عامة';
// فصل «الملف الطبي» عن الملف العام: مجموعة مستقلة بعد «الملف» (طلب المالك)
CF_G[0][3] = CF_G[0][3].filter(function (k) { return k !== 'med'; }); CF_G.splice(1, 0, ['medical', 'الملف الطبي', 'steth', ['med']]);
var MXB = {                                                          // القياسات الجسدية: [الاسم، الوحدة، الأيقونة، لون البلاطة]
  w: ['الوزن', 'كجم', 'scale', 'b'], bmi: ['مؤشر كتلة الجسم', 'كغ/م²', 'gauge', 'v'], bp: ['ضغط الدم', 'ملم زئبق', 'pulse', 'r'], waist: ['محيط الخصر', 'سم', 'ruler', 'g'],
  hip: ['محيط الورك', 'سم', 'ruler', 'g'], bf: ['نسبة الدهون', '%', 'flame', 'o'], mm: ['الكتلة العضلية', 'كجم', 'bicep', 't']
};
var MXB_WHY = {
  w: 'المؤشر الأساسي لمتابعة الخطة. يُسجَّل أسبوعياً في نفس الوقت والظروف (صباحاً قبل الأكل) ليُقرأ الاتجاه لا التذبذب اليومي.',
  bmi: 'يُحسب من الوزن والطول. يصنّف الوزن لكنه لا يميّز الدهون من العضل، فيُقرأ مع الخصر ونسبة الدهون.',
  bp: 'ارتفاعه يوجّه الخطة إلى تقليل الصوديوم (الأطعمة المصنّعة والمخللات) وزيادة الخضار والفواكه، ويُراجَع الطبيب عند الارتفاع.',
  waist: 'مؤشر دهون البطن المرتبطة بمقاومة الأنسولين والخطر القلبي، ويتحسن أحياناً قبل أن يتغير الوزن.',
  hip: 'يُقرأ مع الخصر لمتابعة توزيع الدهون.', bf: 'يميّز خسارة الدهون من خسارة العضل. النطاقات تختلف حسب الجهاز، فيُتابع الاتجاه.', mm: 'يُتابع للحفاظ على العضل أثناء نزول الوزن (البروتين وتمارين المقاومة).'
};
var MX_TONE = { sugar: 'o', lipid: 'r', liver: 'g', thy: 'v', infl: 'o', blood: 'r', vit: 'y', min: 't', kid: 'b', nut: 'g', mus: 't' };
var MX_FULL = ['client', 'plan', 'ver', 'pw', 'gen'];
function mxWide() { try { return isGlass() && matchMedia('(min-width:1100px)').matches; } catch (e) { return false; } }
function mxD(t) { var d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mxIsLab(k) { return !!LABK[k]; }
function mxName(k) { return k === 'homa' ? 'مؤشر HOMA-IR' : mxIsLab(k) ? LABK[k][1] : MXB[k][0]; }
function mxUnit(k) { return k === 'homa' ? '' : mxIsLab(k) ? LABK[k][2] : MXB[k][1]; }
function mxIcon(k) { if (MXB[k]) return MXB[k][2]; var cat = mxIsLab(k) ? LABK[k][5] : 'sugar'; for (var i = 0; i < LAB_CAT.length; i++) if (LAB_CAT[i][0] === cat) return LAB_CAT[i][2]; return 'tube'; }
function mxTone(k) { return MXB[k] ? MXB[k][3] : MX_TONE[mxIsLab(k) ? LABK[k][5] : 'sugar'] || 'b'; }
function mxRef(c, k) {
  if (mxIsLab(k)) return LABK[k][4];
  if (k === 'bmi') return '18.5–24.9 • زيادة وزن 25–29.9 • سمنة 30 فأكثر';
  if (k === 'bp') return 'أقل من 130/80 • أعلى من المثالي 130/80 • مرتفع 140/90 فأكثر';
  if (k === 'waist') return 'الحد ' + (c.sex === 'أنثى' ? 88 : 102) + ' سم (' + (c.sex === 'أنثى' ? 'نساء' : 'رجال') + ')';
  if (k === 'homa') return 'لا حد موحد في الإرشادات — يُتابع اتجاهه';
  return 'يُتابع الاتجاه';
}
function mxWhy(k) { return k === 'homa' ? 'يُحسب من السكر الصائم والأنسولين الصائم في التحليل نفسه: (السكر × الأنسولين) ÷ 405. يرصد مقاومة الأنسولين المبكرة، ولا قيمة قطعية موحدة له، فيُستخدم لمتابعة التحسن مع الحمية ونزول الوزن.' : mxIsLab(k) ? LABK[k][6] : MXB_WHY[k]; }
// السلسلة الزمنية: [{t, v, v2?, id, src}] — v2 للضغط الانبساطي
function mxSeries(c, k) {
  if (k === 'bp') return medOf(c).visits.filter(function (v) { return v.bps != null; }).map(function (v) { return { t: Date.parse(v.d), v: v.bps, v2: v.bpd, id: v.id, src: 'v' }; }).sort(function (a, b) { return a.t - b.t; });
  if (k === 'bmi') { var h = (+c.height || 0) / 100; return h ? mxSeries(c, 'w').map(function (p) { return { t: p.t, v: Math.round(p.v / (h * h) * 10) / 10, src: 'calc' }; }) : []; }
  if (k === 'homa') return medOf(c).labs.filter(function (p) { return p.v && p.v.fbg != null && p.v.ins != null; }).map(function (p) { return { t: Date.parse(p.d), v: Math.round(p.v.fbg * p.v.ins / 405 * 100) / 100, src: 'calc' }; }).sort(function (a, b) { return a.t - b.t; });
  if (mxIsLab(k)) return medOf(c).labs.filter(function (p) { return p.v && p.v[k] != null; }).map(function (p) { return { t: Date.parse(p.d), v: +p.v[k], id: p.id, src: 'l' }; }).sort(function (a, b) { return a.t - b.t; });
  var s = medSeries(c, k).map(function (p) { var v = p.src === 'v' ? medOf(c).visits.filter(function (x) { return Date.parse(x.d) === p.t && x[k] === p.v; })[0] : null; return { t: p.t, v: +p.v, id: v ? v.id : null, src: p.src }; });
  if (k === 'w' && !s.length && +c.weight) s = [{ t: c.created || Date.now(), v: +c.weight, src: 'file' }];
  return s;
}
// التقييم: [مستوى، نص، محايد] — نفس أرقام «الملف الطبي» (الضغط والخصر) ودليل المالك للتحاليل
function mxFlag(c, k, p) {
  if (!p) return null;
  if (mxIsLab(k)) return medLabFlag(c, k, p.v);
  if (k === 'homa') return [0, 'يُتابع الاتجاه', 1];
  if (k === 'bmi') return p.v >= 30 ? [2, 'سمنة'] : p.v >= 25 ? [1, 'زيادة وزن'] : p.v < 18.5 ? [1, 'نحافة'] : [0, 'طبيعي'];
  if (k === 'bp') return p.v >= 140 || p.v2 >= 90 ? [2, 'مرتفع'] : p.v >= 130 || p.v2 >= 80 ? [1, 'أعلى من المثالي'] : [0, 'مثالي'];
  if (k === 'waist') return p.v >= (c.sex === 'أنثى' ? 88 : 102) ? [2, 'أعلى من الحد'] : [0, 'ضمن الحد'];
  return [0, 'يُتابع الاتجاه', 1];
}
function mxVal(k, p) { return p ? (k === 'bp' ? p.v + '/' + (p.v2 != null ? p.v2 : '—') : String(p.v)) : '—'; }
function mxLvl(f) { return !f ? 'n' : f[2] ? 'n' : f[0] === 2 ? 'hi' : f[0] === 1 ? 'mid' : 'ok'; }
function mxHelp(k) { return '<details class="mxq"><summary aria-label="أهمية ' + esc(mxName(k)) + '" title="أهمية التحليل">؟</summary><div class="mxqp" role="note"><b>' + esc(mxName(k)) + '</b><p>' + esc(mxWhy(k)) + '</p><small>المرجع: ' + esc(mxRef(cur() || {}, k)) + '</small></div></details>'; }
function mxRecorded(c) {                                            // التحاليل المسجّلة، الخارجة عن المرجع أولاً
  var L = medLatestLabs(c), ks = Object.keys(L).filter(function (k) { return LABK[k]; });
  if (mxSeries(c, 'homa').length) ks.push('homa');
  var rank = function (k) { var s = mxSeries(c, k), f = mxFlag(c, k, s[s.length - 1]); return f && !f[2] ? -f[0] : 1; };
  return ks.sort(function (a, b) { return rank(a) - rank(b); });
}
function mxDelta(s) { var d = Math.round((s[s.length - 1].v - s[0].v) * 10) / 10; return '<bdi>' + (d > 0 ? '+' : '') + d + '</bdi>'; }
// آخر ما أُضيف أولاً (بوقت الإضافة من معرّف السجل، لا بتاريخ القياس)، ثم الخارج عن المرجع — كي يظهر كل قياس جديد في «نظرة عامة»
function mxAt(id) { var n = parseInt(String(id || '').slice(1), 36); return isFinite(n) ? n : 0; }
function mxRecent(c) {
  var m = medOf(c), T = {}, put = function (k, t) { if (k !== 'w' && (T[k] == null || t > T[k])) T[k] = t; };
  m.labs.forEach(function (p) { Object.keys(p.v || {}).forEach(function (k) { if (LABK[k] && p.v[k] != null) put(k, mxAt(p.id)); }); if (p.v && p.v.fbg != null && p.v.ins != null) put('homa', mxAt(p.id) - 1); });
  m.visits.forEach(function (v) { ['waist', 'hip', 'bf', 'mm'].forEach(function (k) { if (v[k] != null) put(k, mxAt(v.id)); }); });
  var lv = function (k) { var x = mxSeries(c, k), f = mxFlag(c, k, x[x.length - 1]); return f && !f[2] ? f[0] : 0; };
  return Object.keys(T).sort(function (a, b) { return (T[b] - T[a]) || (lv(b) - lv(a)); });
}
// ---------- بطاقة قياس (مثل «Body Temperature» في Wellbeing)
function mxCard(c, k) {
  var s = mxSeries(c, k), p = s[s.length - 1], f = mxFlag(c, k, p), lv = mxLvl(f);
  return '<button class="sec mxc lv-' + lv + '" data-a="mxOpen" data-v="' + k + '" aria-label="' + esc(mxName(k)) + '">'
    + '<span class="mxi t-' + mxTone(k) + '">' + IC(mxIcon(k)) + '</span>'
    + '<span class="mxb"><small>' + esc(mxName(k)) + '</small><b><bdi>' + esc(mxVal(k, p)) + '</bdi> <em>' + esc(mxUnit(k)) + '</em></b>'
    + (k === 'w' && s.length > 1 && s[0].src !== 'file' ? '<i class="mxs">' + mxDelta(s) + ' كجم منذ البداية</i>' : f ? '<i class="mxs">' + esc(f[1]) + '</i>' : '<i class="mxs">لم يُسجَّل بعد</i>') + '</span></button>';
}
function mxGrid(c) {
  var R = mxRecorded(c), ks = ['w', 'bmi', 'bp'].concat(mxRecent(c).slice(0, 5)), hi = R.filter(function (k) { var x = mxSeries(c, k), f = mxFlag(c, k, x[x.length - 1]); return f && f[0] === 2 && !f[2]; }).length;
  return '<div class="mxgh"><h3>القياسات والتحاليل</h3>' + (R.length ? '<button class="link" data-a="tab" data-v="med">كل التحاليل (' + R.length + ')' + (hi ? ' • ' + hi + ' خارج المرجع' : '') + '</button>' : '') + '</div><div class="mxgrid">' + ks.map(function (k) { return mxCard(c, k); }).join('') + '<button class="sec mxc mxadd" data-a="mxPick">' + IC('plus') + '<span>أضف قياساً</span></button></div>';
}
// ---------- «الحالة العامة» (مثل Functional Status): أشرطة من بيانات موجودة فقط
function mxStatus(c) {
  var rows = [], logs = (c.hx || {}).logs || {}, s = 0, n = 0;
  for (var i = -6; i <= 0; i++) { var l = logs[ciDay(i)]; if (l && l.n) { s += l.done / l.n; n++; } }
  if (c.hx) rows.push(['الالتزام (آخر 7 أيام)', n ? Math.round(s / n * 100) : 0, 100, n ? Math.round(s / n * 100) + '%' : 'لم يسجّل', 'g']);
  var past = (c.appts || []).filter(function (a) { return a.d <= wkDay(); }), done = past.filter(function (a) { return a.st === 'done'; }).length;
  if (past.length) rows.push(['حضور المواعيد', done, past.length, done + '/' + past.length, 't']);
  var F = [c.name, c.sex, +c.age, +c.weight, +c.height, c.goal, c.activity, c.phone, (c.love || []).length + (c.favMeals || []).length], fl = F.filter(Boolean).length;
  rows.push(['اكتمال الملف', fl, F.length, fl + '/' + F.length, 'y']);
  var R = mxRecorded(c).filter(function (k) { var x = mxSeries(c, k), f = mxFlag(c, k, x[x.length - 1]); return f && !f[2]; }), ok = R.filter(function (k) { var x = mxSeries(c, k); return !mxFlag(c, k, x[x.length - 1])[0]; }).length;
  if (R.length) rows.push(['التحاليل ضمن المرجع', ok, R.length, ok + '/' + R.length, ok < R.length ? 'o' : 'g']);
  return '<section class="mxcard mxfs"><div class="mxhd"><h3>الحالة العامة</h3></div>' + rows.map(function (r) { var pc = r[2] ? Math.round(r[1] / r[2] * 100) : 0; return '<div class="mxbar"><div class="mxbl"><span>' + r[0] + '</span><b><bdi>' + r[3] + '</bdi></b></div><div class="mxtrk" role="progressbar" aria-label="' + r[0] + '" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100"><i class="t-' + r[4] + '" style="width:' + pc + '%"></i></div></div>'; }).join('') + '</section>';
}
// ---------- «قائمة المهام» (مثل To-do List): من حالة العميل الفعلية، وكل بند يفتح إجراءه الموجود
function mxTodo(c) {
  var t = wkDay(), ap = (c.appts || []).filter(function (a) { return a.d === t; })[0], po = planOf(c), x = c.hx, ws = mxSeries(c, 'w').filter(function (p) { return p.src !== 'file'; }), lw = ws[ws.length - 1];
  var it = [];
  if (ap) it.push([ap.st === 'done', 'تسجيل حضور موعد اليوم ' + (ap.t || ''), 'tab', 'ci']);
  it.push([!!(lw && Date.now() - lw.t < 7 * 864e5), 'قياس الوزن الأسبوعي', 'mxOpen', 'w']);
  it.push([!!po.has, 'إنشاء الخطة الغذائية', po.has ? 'tab' : 'genOpen', po.has ? 'plan' : '1']);
  it.push([!!x, 'ربط العميل بـ«زنها»', 'tab', 'link']);
  if (x && po.has) it.push([!!x.planV, 'إرسال الخطة إلى «زنها»', 'genOpen', '5']);
  var hi = mxRecorded(c).filter(function (k) { var s = mxSeries(c, k), f = mxFlag(c, k, s[s.length - 1]); return f && f[0] === 2 && !f[2]; });
  if (hi.length) it.push([false, 'مراجعة ' + hi.length + ' ' + (hi.length > 2 && hi.length < 11 ? 'تحاليل' : 'تحليل') + ' خارج المرجع', 'tab', 'med']);
  var st = sbState(c)[0]; if (st === 'soon' || st === 'last' || st === 'expired') it.push([false, 'تجديد الاشتراك', 'tab', 'sub']);
  it.sort(function (a, b) { return a[0] - b[0]; }); var nd = it.filter(function (i) { return i[0]; }).length, tot = it.length; it = it.slice(0, 4);
  return '<section class="mxcard mxtodo"><div class="mxhd"><h3>قائمة المهام</h3><small>' + nd + '/' + tot + '</small></div>' + it.map(function (i) {
    return '<button class="sec mxtd' + (i[0] ? ' done' : '') + '" data-a="' + i[2] + '" data-v="' + i[3] + '"><span>' + esc(i[1]) + '</span><i aria-hidden="true">' + IC(i[0] ? 'checkCircle' : 'chevron') + '</i></button>';
  }).join('') + '</section>';
}
// ---------- الرسوم (SVG بلا مكتبات)
function mxBars(c) {                                                  // مثل «Average Sleeping Time»: أعمدة آخر 8 أوزان والأخير مميّز
  var s = mxSeries(c, 'w').slice(-8); if (s.length < 2) return '<section class="mxcard mxch"><div class="mxhd"><h3>تقدّم الوزن</h3></div><p class="mxempty">سجّل وزنين على الأقل ليظهر التقدّم هنا.</p><button class="sec sm" data-a="mxOpen" data-v="w">' + IC('plus') + ' أضف وزناً</button></section>';
  var W = 420, H = 170, L = 34, R = 6, T = 14, B = 26, ys = s.map(function (p) { return p.v; }), mn = Math.floor(Math.min.apply(null, ys) - 2), mx = Math.ceil(Math.max.apply(null, ys) + 1), bw = (W - L - R) / s.length;
  var Y = function (v) { return T + (mx - v) / (mx - mn) * (H - T - B); };
  var tk = [mn, Math.round((mn + mx) / 2), mx].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="mxgl"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" class="mxax">' + v + '</text>'; }).join('');
  var y0 = Y(s[0].v).toFixed(1), base = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y0 + '" y2="' + y0 + '" class="mxbase"/>';
  var bars = s.map(function (p, i) { var x = L + i * bw + bw * 0.22, w = bw * 0.56, y = Y(p.v), last = i === s.length - 1, d = new Date(p.t); return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (H - B - y).toFixed(1) + '" rx="6" class="' + (last ? 'mxbr on' : 'mxbr') + '"><title>' + p.v + ' كجم — ' + mxD(p.t) + '</title></rect><text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" class="mxax">' + d.getDate() + '/' + (d.getMonth() + 1) + '</text>' + (last ? '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle" class="mxlv">' + p.v + '</text>' : ''); }).join('');
  var dv = Math.round((ys[ys.length - 1] - ys[0]) * 10) / 10;
  return '<section class="mxcard mxch"><div class="mxhd"><h3>تقدّم الوزن</h3><button class="sec mxchip" data-a="mxOpen" data-v="w">آخر ' + s.length + ' قياسات</button></div><p class="mxsum"><b><bdi>' + (dv > 0 ? '+' : '') + dv + '</bdi> كجم</b> منذ ' + mxD(s[0].t) + ' <span>(الخط المنقّط = أول قياس)</span></p>'
    + '<svg viewBox="0 0 ' + W + ' ' + H + '" class="mxsvg" role="img" aria-label="أعمدة تقدّم الوزن">' + tk + base + bars + '</svg></section>';
}
function mxLine(c, k) {                                               // صفحة القياس: منحنى بشريط النطاق المرجعي
  var s = mxSeries(c, k); if (!s.length) return '';
  var W = 640, H = 240, L = 44, R = 14, T = 16, B = 30, ys = s.map(function (p) { return p.v; }).concat(s.filter(function (p) { return p.v2 != null; }).map(function (p) { return p.v2; }));
  var band = mxBand(c, k); if (band) ys = ys.concat(band.filter(function (v) { return v != null; }));
  var mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys), pad = Math.max((mx - mn) * 0.12, Math.abs(mx) * 0.02, 0.5); mn -= pad; mx += pad;
  var t0 = s[0].t, t1 = s[s.length - 1].t, X = function (t) { return t1 === t0 ? (L + W - R) / 2 : L + (t - t0) / (t1 - t0) * (W - L - R); }, Y = function (v) { return T + (mx - v) / (mx - mn) * (H - T - B); };
  var fmt = function (v) { return Math.abs(mx - mn) < 10 ? (Math.round(v * 10) / 10) : Math.round(v); };
  var grid = [0, 1, 2, 3].map(function (i) { var v = mn + (mx - mn) * i / 3; return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="mxgl"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" class="mxax">' + fmt(v) + '</text>'; }).join('');
  var bnd = band ? '<rect x="' + L + '" width="' + (W - L - R) + '" y="' + Y(band[1] != null ? band[1] : mx).toFixed(1) + '" height="' + Math.max(0, Y(band[0] != null ? band[0] : mn) - Y(band[1] != null ? band[1] : mx)).toFixed(1) + '" class="mxband"/>' : '';
  var path = function (key) { var pts = s.filter(function (p) { return p[key] != null; }); return pts.length ? (pts.length > 1 ? '<path d="M' + pts.map(function (p) { return X(p.t).toFixed(1) + ' ' + Y(p[key]).toFixed(1); }).join(' L') + '" class="mxln' + (key === 'v2' ? ' l2' : '') + '"/>' : '') + pts.map(function (p, i) { var f = mxFlag(c, k, p), last = i === pts.length - 1; return '<circle cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p[key]).toFixed(1) + '" r="' + (last ? 5.5 : 3.5) + '" class="mxpt lv-' + mxLvl(f) + (last ? ' on' : '') + '"><title>' + p[key] + ' — ' + mxD(p.t) + '</title></circle>'; }).join('') : ''; };
  var area = s.length > 1 && k !== 'bp' ? '<path d="M' + X(s[0].t).toFixed(1) + ' ' + (H - B) + ' L' + s.map(function (p) { return X(p.t).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' L') + ' L' + X(s[s.length - 1].t).toFixed(1) + ' ' + (H - B) + 'Z" class="mxar"/>' : '';
  var lbl = (s.length > 1 ? [s[0], s[s.length - 1]] : [s[0]]).map(function (p, i) { return '<text x="' + X(p.t).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (s.length < 2 ? 'middle' : i ? 'end' : 'start') + '" class="mxax">' + mxD(p.t) + '</text>'; }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="mxsvg" role="img" aria-label="منحنى ' + esc(mxName(k)) + '">' + bnd + grid + area + path('v') + path('v2') + lbl + '</svg>' + (band ? '<p class="mxleg"><i class="mxband-k"></i> النطاق المرجعي</p>' : '');
}
function mxBand(c, k) {                                               // حدود الشريط المرجعي للرسم فقط: [أدنى، أعلى]
  var F = c.sex === 'أنثى', B = { fbg: [70, 99], hba1c: [4, 5.6], ins: [null, 20], tc: [null, 200], ldl: [null, 100], hdl: [F ? 50 : 40, null], tg: [null, 150], alt: [10, F ? 35 : 40], ast: [10, 40], ggt: [F ? 8 : 9, F ? 40 : 50], tsh: [0.4, 4], ft4: [0.8, 1.8], ft3: [2.3, 4.2], cort: [5, 25], hscrp: [null, 1], crp: [null, 8], hb: F ? [12, 16] : [14, 18], mcv: [80, 100], ferritin: [24, F ? 307 : 336], tsat: [20, 50], tibc: [250, 310], vitd: [30, 100], b12: [200, 900], holotc: [25.1, 165], mma: [null, 0.4], fol: [1.8, 9], rbcfol: [150, 450], vita: [20, 80], inr: [null, 1.4], zn: [75, 140], cu: [100, 200], ca: [8.6, 10.2], mg: [1.5, 2], k: [3.5, 5], phos: [3, 4.5], hco3: [22, 28], pth: [10, 65], creat: [null, F ? 1.04 : 1.35], egfr: [90, null], uacr: [null, 30], ua: [F ? 2.4 : 3.4, F ? 6 : 7], alb: [3.5, 5.5], preal: [16, 30], ck: F ? [30, 135] : [55, 170], testo: F ? [18, 54] : [291, 1100], bmi: [18.5, 24.9], waist: [null, F ? 88 : 102], bp: [null, 130] };
  return B[k] || null;
}
// ---------- صفحة القياس
function mxPage(c, k) {
  var s = mxSeries(c, k), p = s[s.length - 1], f = mxFlag(c, k, p), calc = k === 'bmi' || k === 'homa', pr = s[s.length - 2];
  var dv = p && pr ? Math.round((p.v - pr.v) * 100) / 100 : null;
  var add = calc ? '<p class="mxnote">' + (k === 'bmi' ? 'يُحسب تلقائياً من الوزن والطول — أضف وزناً لتحديثه.' : 'يُحسب تلقائياً عند تسجيل السكر الصائم والأنسولين الصائم بالتاريخ نفسه.') + '</p>'
    : '<div class="mxform' + (S.mxAdd ? ' on' : '') + '" id="mxform"><h4>قراءة جديدة</h4><div class="mxrow">'
      + (k === 'bp' ? '<label>الانقباضي<input id="mx_v" inputmode="decimal" placeholder="120"></label><label>الانبساطي<input id="mx_v2" inputmode="decimal" placeholder="80"></label>' : '<label>' + esc(mxName(k)) + (mxUnit(k) ? ' (' + esc(mxUnit(k)) + ')' : '') + '<input id="mx_v" inputmode="decimal"></label>')
      + '<label>التاريخ<input type="date" id="mx_d" value="' + medToday() + '"></label></div><div class="mxrow"><button data-a="mxSave" data-v="' + k + '">' + IC('save') + ' حفظ</button><button class="sec" data-a="mxAdd">إلغاء</button></div></div>';
  var rows = s.slice().reverse().map(function (q, i, a) {
    var fq = mxFlag(c, k, q), nx = a[i + 1], d = nx ? Math.round((q.v - nx.v) * 100) / 100 : null;
    return '<tr><td><bdi>' + mxD(q.t) + '</bdi></td><td class="mxv lv-' + mxLvl(fq) + '"><bdi>' + esc(mxVal(k, q)) + '</bdi></td><td>' + (d == null ? '—' : '<bdi>' + (d > 0 ? '+' : '') + d + '</bdi>') + '</td><td>' + (fq && !fq[2] ? '<span class="mxst lv-' + mxLvl(fq) + '">' + esc(fq[1]) + '</span>' : '') + '</td><td>' + (q.src === 'h' ? '<small>من «زنها»</small>' : q.id && !calc ? '<button class="sec sm" data-a="mxDel" data-v="' + k + '|' + q.id + '" aria-label="حذف قراءة ' + mxD(q.t) + '">' + IC('trash') + '</button>' : '') + '</td></tr>';
  }).join('');
  return '<div class="mxpage" data-k="' + k + '"><nav class="mxcrumb"><button class="link" data-a="mxBack">نظرة عامة</button> ‹ <span>' + esc(mxName(k)) + '</span></nav>'
    + '<section class="mxcard mxhero lv-' + mxLvl(f) + '"><span class="mxi t-' + mxTone(k) + '">' + IC(mxIcon(k)) + '</span><div class="mxht"><div class="mxtt"><h2>' + esc(mxName(k)) + '</h2>' + mxHelp(k) + '</div>'
    + '<p class="mxbig"><b><bdi>' + esc(mxVal(k, p)) + '</bdi></b> <em>' + esc(mxUnit(k)) + '</em>' + (k === 'w' && s.length > 1 ? ' <span class="mxst">' + mxDelta(s) + ' كجم منذ البداية</span>' : f && !f[2] ? ' <span class="mxst lv-' + mxLvl(f) + '">' + esc(f[1]) + '</span>' : '') + (dv != null ? ' <small class="mxdv">' + IC(dv > 0 ? 'trendUp' : 'trendDown') + '<bdi>' + (dv > 0 ? '+' : '') + dv + '</bdi> عن القراءة السابقة</small>' : '') + '</p>'
    + '<p class="mxref">النطاق المرجعي: ' + esc(mxRef(c, k)) + '</p></div>' + (calc ? '' : '<button class="mxplus" data-a="mxAdd" aria-label="أضف قراءة ' + esc(mxName(k)) + '" title="أضف قراءة">' + IC('plus') + '</button>') + '</section>'
    + add + '<section class="mxcard"><div class="mxhd"><h3>التقدّم</h3><small>' + s.length + ' ' + (s.length > 2 && s.length < 11 ? 'قراءات' : 'قراءة') + '</small></div>' + (s.length ? mxLine(c, k) : '<p class="mxempty">لا قراءات بعد — اضغط «+» لإضافة أول قراءة.</p>') + '</section>'
    + (rows ? '<section class="mxcard"><div class="mxhd"><h3>سجل القراءات</h3></div><div class="tw"><table class="mxtbl"><thead><tr><th>التاريخ</th><th>القيمة</th><th>التغيّر</th><th>التقييم</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' : '')
    + (mxIsLab(k) || k === 'homa' ? '<p class="mxfoot">النطاقات إرشادية من الدليل المرجعي المعتمد؛ يُعتمد نطاق المختبر، وتُقرأ المغذيات الدقيقة مع CRP.</p>' : '') + '</div>';
}
// ---------- قائمة الإضافة: مصنّفة مع بحث
function mxPicker(c) {
  var L = medLatestLabs(c), q = (S.mxQ || '').trim();
  var body = [['body', 'الجسم والضغط', 'scale', ['w', 'bp', 'waist', 'hip', 'bf', 'mm']]].concat(LAB_CAT.map(function (g) { return [g[0], g[1], g[2], LAB.filter(function (d) { return d[5] === g[0]; }).map(function (d) { return d[0]; })]; }));
  return '<div class="mxpage mxpick"><nav class="mxcrumb"><button class="link" data-a="mxBack">نظرة عامة</button> ‹ <span>أضف قياساً</span></nav>'
    + '<section class="mxcard"><label class="mxsrch">' + IC('search') + '<input id="mx_q" placeholder="ابحث باسم التحليل أو اختصاره (مثل LDL أو فيريتين)" value="' + esc(q) + '" autocomplete="off"></label>'
    + body.map(function (g) {
      return '<div class="mxgrp" data-g="' + g[0] + '"><h4>' + IC(g[2]) + ' ' + g[1] + '</h4><div class="mxopts">' + g[3].map(function (k) {
        var has = L[k] || (!mxIsLab(k) && mxSeries(c, k).filter(function (p) { return p.src !== 'file'; }).length);
        return '<div class="mxopt" data-n="' + esc((mxName(k) + ' ' + k).toLowerCase()) + '"><button class="sec" data-a="mxOpen" data-v="' + k + '" data-add="1"><span>' + esc(mxName(k)) + '</span><small>' + esc(mxRef(c, k)) + '</small>' + (has ? '<em>مسجّل</em>' : '') + '</button>' + mxHelp(k) + '</div>';
      }).join('') + '</div></div>';
    }).join('') + '</section></div>';
}
// ---------- عمود المعلومات (مثل العمود الأيمن في Wellbeing) وقائمة العملاء
function mxSide(c) {
  var po = planOf(c), aps = (c.appts || []).slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; }), t = wkDay(), nx = aps.filter(function (a) { return a.d >= t && !a.st; }).pop(), lst = aps.filter(function (a) { return a.d < t || a.st; })[0];
  var info = [['الجنس', c.sex], ['العمر', +c.age ? c.age + ' سنة' : ''], ['الطول', +c.height ? c.height + ' سم' : ''], ['الوزن الحالي', +c.weight ? c.weight + ' كجم' : ''], ['الجوال', c.phone], ['النشاط', c.activity], ['الهدف', c.goal], ['النظام', c.kind === 'athlete' ? 'نظام الجرامات' : 'نظام الحصص']].filter(function (r) { return r[1]; });
  var acc = function (id, title, n, body, open) { return '<details class="mxacc" data-k="' + id + '"' + (open ? ' open' : '') + '><summary><span>' + title + (n != null ? ' <em>(' + n + ')</em>' : '') + '</span>' + IC('chevron') + '</summary><div class="mxaccb">' + body + '</div></details>'; };
  var kv = function (r) { return '<div class="mxkv"><small>' + esc(r[0]) + '</small><b>' + esc(String(r[1])) + '</b></div>'; };
  var cond = (c.conditions || []), alg = (c.allergens || []);
  return '<aside class="cfside" aria-label="معلومات العميل">' + cfHead(c) + mxStatus(c) + '<button class="link mxedit" data-a="tab" data-v="client">' + IC('edit') + ' تعديل البيانات</button>'
    + acc('info', 'البيانات الأساسية', info.length, info.map(kv).join(''), true)
    + acc('appt', 'المواعيد', aps.length, (nx ? kv(['القادم', nx.d + (nx.t ? ' • ' + nx.t : '')]) : '') + (lst ? kv(['السابق', lst.d + (lst.st === 'done' ? ' • حضر' : '')]) : '') + (aps.length ? '' : '<p class="mxmut">لا مواعيد</p>') + '<button class="link" data-a="tab" data-v="appt">كل المواعيد</button>', !!nx)
    + acc('cond', 'الحالات الصحية', cond.length, cond.length ? '<div class="mxtags">' + cond.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '<p class="mxmut">لا حالات مسجّلة</p>', cond.length > 0)
    + acc('alg', 'الحساسية', alg.length, alg.length ? '<div class="mxtags al">' + alg.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '<p class="mxmut">لا حساسية مسجّلة</p>', alg.length > 0)
    + acc('plan', 'الخطة', null, kv(['الحالية', po.has ? po.label : 'لا خطة بعد']) + (c.hx ? kv(['«زنها»', c.hx.planV ? 'أُرسلت v' + c.hx.planV : 'لم تُرسل']) : ''), false)
    + acc('sub', 'الاشتراك', null, kv(['الحالة', sbState(c)[1]]) + '<button class="link" data-a="tab" data-v="sub">إدارة الاشتراك</button>', false)
    + '</aside>';
}
function mxList(c) {
  var q = (S.mxLq || '').trim(), L = S.clients.filter(function (x) { return !q || String(x.name || '').indexOf(q) >= 0 || String(x.code).indexOf(q) >= 0 || String(x.phone || '').indexOf(q) >= 0; });
  return '<aside class="cflist" aria-label="قائمة العملاء"><div class="mxhd"><h3>قائمة العملاء <em>(' + S.clients.length + ')</em></h3><button class="sec mxlsb' + (S.mxLs || q ? ' on' : '') + '" data-a="mxLs" aria-label="ابحث في العملاء" aria-expanded="' + !!(S.mxLs || q) + '" title="بحث">' + IC('search') + '</button></div><label class="mxsrch sm"' + (S.mxLs || q ? '' : ' hidden') + '>' + IC('search') + '<input id="mx_lq" placeholder="ابحث بالاسم أو الكود أو الجوال" value="' + esc(q) + '" autocomplete="off"></label><div class="cflrows">'
    + L.slice(0, 60).map(function (x) { var on = x.code === c.code; return '<button class="sec cflr' + (on ? ' on' : '') + '" data-a="pick" data-v="' + esc(x.code) + '"' + (on ? ' aria-current="true"' : '') + '><span class="cav">' + esc(initial(x.name)) + '</span><span class="cfln"><b>' + esc(x.name || 'عميل بلا اسم') + '</b><small>' + esc(x.code) + (+x.weight ? ' • ' + x.weight + ' كجم' : '') + '</small></span>' + IC('chevron') + '</button>'; }).join('')
    + (L.length ? '' : '<p class="mxmut">لا نتائج</p>') + '</div></aside>';
}
function mxShort(c) {                                               // اختصارات (مثل أزرار Osmolax): إجراءات موجودة فقط
  var po = planOf(c), x = c.hx, t = wkDay(), ap = (c.appts || []).filter(function (a) { return a.d === t && !a.st; })[0];
  var L = [['mxOpen', 'w', 'scale', 'أضف وزناً', 1], ['mxPick', '', 'tube', 'أضف تحليلاً'], [ap ? 'tab' : 'tab', ap ? 'ci' : 'appt', 'calendar', ap ? 'سجّل الحضور' : 'موعد جديد'],
    po.has ? ['tab', 'plan', 'utensils', 'الخطة'] : ['genOpen', '1', 'sparkles', 'أنشئ الخطة'], x ? ['cfChat', '', 'message', 'المحادثة'] : ['tab', 'link', 'phone', 'اربط بـ«زنها»'], ['tab', 'med', 'steth', 'الملف الطبي']];
  return '<nav class="mxshort" aria-label="اختصارات">' + L.map(function (b) { return '<button class="sec mxsc" data-a="' + b[0] + '" data-v="' + b[1] + '"' + (b[4] ? ' data-add="1"' : '') + '>' + IC(b[2]) + '<span>' + b[3] + '</span></button>'; }).join('') + '</nav>';
}
function mxOv(c) {
  if (S.mxPick) return mxPicker(c);
  if (S.mx) return mxPage(c, S.mx);
  return '<div class="mxov"><nav class="mxcrumb"><span>العملاء</span> ‹ <span>' + esc(c.name || 'عميل بلا اسم') + '</span></nav>' + mxShort(c) + mxGrid(c) + '<div class="mxduo">' + mxTodo(c) + mxBars(c) + '</div>' + (mxWide() ? '' : mxStatus(c)) + '</div>';
}
// ---------- الربط بملف العميل
cfBody = (function (f) { return function (c) { return S.tab === 'ov' ? mxOv(c) : f(c); }; })(cfBody);
cfNorm = (function (f) { return function (v, c) { return v === 'ov' ? 'ov' : f(v, c); }; })(cfNorm);
cfPage = (function (f) {
  return function (c) {
    if (S.tab !== 'ov') { S.mx = null; S.mxPick = false; }
    if (MX_FULL.indexOf(S.tab) >= 0 || !mxWide()) return f(c);      // البيانات والخطة بعرض كامل (نماذج وجداول عريضة)
    var h = f(c), i = h.indexOf('<div class="cfhead">'), j = h.indexOf('<div class="tabs ctabs cftabs');      // نفس المحتوى، والرأس ينتقل إلى عمود المعلومات
    var mid = i >= 0 && j > i ? h.slice(0, i) + h.slice(j) : h;
    return '<div class="cfwb">' + mxSide(c) + '<div class="cfmain">' + mid + '</div>' + mxList(c) + '</div>';      // يميناً: المعلومات، يساراً: قائمة العملاء (كما في Wellbeing)
  };
})(cfPage);
Object.assign(A, {
  mxOpen: function (v, el) { S.tab = 'ov'; S.mxPick = false; S.mx = v; S.mxAdd = !!(el && el.dataset && el.dataset.add); main(); window.scrollTo(0, 0); if (S.mxAdd) setTimeout(function () { var i = $('#mx_v'); if (i) i.focus(); }, 30); },
  mxLs: function () { S.mxLs = !S.mxLs; var l = $('main .cflist .mxsrch'), b = $('main .mxlsb'); if (l) l.hidden = !S.mxLs; if (b) { b.classList.toggle('on', S.mxLs); b.setAttribute('aria-expanded', S.mxLs); } if (S.mxLs) { var i = $('#mx_lq'); if (i) i.focus(); } else { S.mxLq = ''; var j = $('#mx_lq'); if (j) j.value = ''; [].forEach.call(document.querySelectorAll('main .cflr'), function (x) { x.hidden = false; }); } },
  mxBack: function () { S.mx = null; S.mxPick = false; S.mxAdd = false; main(); },
  mxPick: function () { S.tab = 'ov'; S.mx = null; S.mxPick = true; S.mxQ = ''; main(); window.scrollTo(0, 0); setTimeout(function () { var i = $('#mx_q'); if (i) i.focus(); }, 30); },
  mxAdd: function () { S.mxAdd = !S.mxAdd; var f = $('#mxform'); if (f) f.classList.toggle('on', S.mxAdd); if (S.mxAdd) setTimeout(function () { var i = $('#mx_v'); if (i) i.focus(); }, 30); },
  mxSave: function (k) {
    var c = cur(); if (!c) return; var v = medNum(($('#mx_v') || {}).value), v2 = medNum(($('#mx_v2') || {}).value), d = ($('#mx_d') || {}).value || medToday(), m = medOf(c);
    if (v == null || (k === 'bp' && v2 == null)) { toast(k === 'bp' ? 'اكتب الضغط الانقباضي والانبساطي' : 'اكتب القيمة'); return; }
    if (k === 'w' && (v < 20 || v > 400)) { toast('الوزن غير منطقي'); return; }
    if (k === 'bp' && (v < 50 || v > 260 || v2 < 30 || v2 > 160)) { toast('قراءة الضغط غير منطقية'); return; }
    if (mxIsLab(k)) m.labs.push({ id: 'l' + Date.now().toString(36), d: d, v: (function () { var o = {}; o[k] = v; return o; })() });
    else { var r = { id: 'v' + Date.now().toString(36), d: d, note: '' }; if (k === 'bp') { r.bps = v; r.bpd = v2; } else r[k] = v; m.visits.push(r); if (k === 'w' && d >= m.visits.map(function (x) { return x.d; }).sort().pop()) c.weight = v; }
    S.mxAdd = false; persist(c); main(); var s = mxSeries(c, k), f = mxFlag(c, k, s.filter(function (p) { return mxD(p.t) === d; }).pop()); toast('✓ حُفظت القراءة' + (f && f[0] === 2 && !f[2] ? ' — ' + f[1] : ''));
  },
  mxDel: function (v) {
    var c = cur(), p = String(v).split('|'), k = p[0], id = p[1], m = medOf(c); if (!confirm('حذف هذه القراءة؟')) return;
    if (mxIsLab(k)) m.labs = m.labs.filter(function (x) { if (x.id !== id) return true; delete x.v[k]; return Object.keys(x.v).length > 0; });
    else m.visits = m.visits.filter(function (x) { if (x.id !== id) return true; if (k === 'bp') { delete x.bps; delete x.bpd; } else delete x[k]; return MQ.some(function (q) { return x[q[0]] != null; }) || !!x.note; });
    persist(c); main();
  }
});
A.pick = (function (f) { return function (v) { var r = f.apply(this, arguments); S.tab = 'ov'; S.mx = null; S.mxPick = false; return r; }; })(A.pick);
document.addEventListener('input', function (e) {
  var t = e.target; if (!t) return;
  if (t.id === 'mx_q') { var q = t.value.trim().toLowerCase(); S.mxQ = t.value; [].forEach.call(document.querySelectorAll('main .mxopt'), function (o) { o.hidden = !!q && o.dataset.n.indexOf(q) < 0; }); [].forEach.call(document.querySelectorAll('main .mxgrp'), function (g) { g.hidden = !g.querySelector('.mxopt:not([hidden])'); }); }
  if (t.id === 'mx_lq') { var w = t.value.trim(); S.mxLq = t.value; [].forEach.call(document.querySelectorAll('main .cflr'), function (b) { b.hidden = !!w && b.textContent.indexOf(w) < 0; }); }
  if (t.dataset && t.dataset.f === 'name') [].forEach.call(document.querySelectorAll('main .cfname'), function (n) { n.textContent = t.value.trim() || 'عميل بلا اسم'; });
});
try { matchMedia('(min-width:1100px)').addEventListener('change', function () { if (S.view === 'client' && cur()) main(); }); } catch (e) { }
try { DPApp.MX = { LAB: LAB, LAB_CAT: LAB_CAT, flag: medLabFlag, series: mxSeries }; } catch (e) { }      // للاختبارات
