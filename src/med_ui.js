// ================= الملف الطبي للعميل (يُدمج داخل app.js عند /*MEDUI*/) — تبويب «🩺 الملف الطبي» في ملف العميل (النظامين)
// الزيارات والقياسات (وزن، خصر، ورك، دهون، عضل، ضغط) ← منحنيات التقدم (ومعها أوزان «حصتي») ← التحاليل بنطاقاتها حسب الجنس وتنبيهاتها،
// وربطها بالحالات الصحية (واقتراح إضافة الحالة) ← تقرير تقدّم شهري مطبوع للعميل، وملخص يُرسل إلى «حصتي».
// البيانات في c.med = { visits: [...], labs: [...] } داخل سجل العميل، فتدخل النسخ الاحتياطية والمزامنة تلقائياً.
var MQ = [['w', 'الوزن', 'كجم'], ['waist', 'الخصر', 'سم'], ['hip', 'الورك', 'سم'], ['bf', 'الدهون', '%'], ['mm', 'الكتلة العضلية', 'كجم'], ['bps', 'الضغط الانقباضي', 'ملم زئبق'], ['bpd', 'الضغط الانبساطي', 'ملم زئبق']];
// التحاليل: [المفتاح، الاسم، الوحدة، دالة التقييم(القيمة، الجنس) ← [مستوى، نص]]  المستوى: 0 طبيعي، 1 حدّي، 2 مرتفع/منخفض
var LAB = [
  ['hba1c', 'السكر التراكمي HbA1c', '%', function (v) { return v >= 6.5 ? [2, 'مرتفع (مستوى السكري)'] : v >= 5.7 ? [1, 'ما قبل السكري'] : [0, 'طبيعي']; }],
  ['fbg', 'سكر صائم', 'ملغ/دل', function (v) { return v >= 126 ? [2, 'مرتفع'] : v >= 100 ? [1, 'حدّي (ما قبل السكري)'] : v < 70 ? [2, 'منخفض'] : [0, 'طبيعي']; }],
  ['tc', 'الكوليسترول الكلي', 'ملغ/دل', function (v) { return v >= 240 ? [2, 'مرتفع'] : v >= 200 ? [1, 'حدّي'] : [0, 'مناسب']; }],
  ['ldl', 'الكوليسترول الضار LDL', 'ملغ/دل', function (v) { return v >= 160 ? [2, 'مرتفع'] : v >= 100 ? [1, 'أعلى من المثالي'] : [0, 'مناسب']; }],
  ['hdl', 'الكوليسترول النافع HDL', 'ملغ/دل', function (v, s) { return v < (s === 'أنثى' ? 50 : 40) ? [2, 'منخفض'] : [0, 'مناسب']; }],
  ['tg', 'الدهون الثلاثية', 'ملغ/دل', function (v) { return v >= 200 ? [2, 'مرتفع'] : v >= 150 ? [1, 'حدّي'] : [0, 'مناسب']; }],
  ['vitd', 'فيتامين د', 'نانوغرام/مل', function (v) { return v < 20 ? [2, 'نقص'] : v < 30 ? [1, 'غير كافٍ'] : v > 100 ? [2, 'مرتفع'] : [0, 'كافٍ']; }],
  ['hb', 'الهيموغلوبين', 'غ/دل', function (v, s) { var lo = s === 'أنثى' ? 12 : 13.5; return v < lo ? [2, 'منخفض (فقر دم)'] : v > (s === 'أنثى' ? 15.5 : 17.5) ? [1, 'مرتفع'] : [0, 'طبيعي']; }],
  ['ferritin', 'مخزون الحديد (فيريتين)', 'نانوغرام/مل', function (v, s) { return v < (s === 'أنثى' ? 15 : 30) ? [2, 'منخفض'] : v < 30 ? [1, 'منخفض الحد'] : [0, 'طبيعي']; }],
  ['b12', 'فيتامين B12', 'بيكوغرام/مل', function (v) { return v < 200 ? [2, 'نقص'] : v < 300 ? [1, 'حدّي'] : [0, 'طبيعي']; }],
  ['tsh', 'هرمون الغدة TSH', 'ميلي وحدة/ل', function (v) { return v > 4.5 ? [2, 'مرتفع (خمول محتمل)'] : v < 0.4 ? [2, 'منخفض (نشاط محتمل)'] : [0, 'طبيعي']; }],
  ['creat', 'الكرياتينين', 'ملغ/دل', function (v, s) { return v > (s === 'أنثى' ? 1.04 : 1.35) ? [2, 'مرتفع'] : [0, 'طبيعي']; }],
  ['egfr', 'معدل ترشيح الكلى eGFR', 'مل/دقيقة', function (v) { return v < 60 ? [2, 'منخفض'] : v < 90 ? [1, 'منخفض قليلاً'] : [0, 'طبيعي']; }],
  ['alt', 'إنزيم الكبد ALT', 'وحدة/ل', function (v) { return v > 40 ? [2, 'مرتفع'] : [0, 'طبيعي']; }],
  ['ast', 'إنزيم الكبد AST', 'وحدة/ل', function (v) { return v > 40 ? [2, 'مرتفع'] : [0, 'طبيعي']; }],
  ['ua', 'حمض اليوريك', 'ملغ/دل', function (v, s) { return v > (s === 'أنثى' ? 6 : 7) ? [2, 'مرتفع'] : [0, 'طبيعي']; }]
];
var LABK = {}; LAB.forEach(function (x) { LABK[x[0]] = x; });
var MED_ADVICE = { hba1c: 'ركّز على الكربوهيدرات منخفضة المؤشر الجلايسيمي وتوزيعها على الوجبات', fbg: 'وزّع الكربوهيدرات وراجع العشاء والسناك الليلي', tc: 'قلّل الدهون المشبعة وزِد الألياف الذائبة', ldl: 'قلّل الدهون المشبعة والمتحولة وزِد الشوفان والبقوليات', hdl: 'زِد النشاط البدني والدهون غير المشبعة (زيت الزيتون، المكسرات، السمك)', tg: 'قلّل السكريات البسيطة والعصائر', vitd: 'أضف مصادر فيتامين د وراجع الحاجة لمكمل مع الطبيب', hb: 'زِد مصادر الحديد مع فيتامين ج وأبعد الشاي عن الوجبات', ferritin: 'زِد مصادر الحديد الهيمي وفيتامين ج', b12: 'تأكد من مصادر B12 (لحوم، بيض، ألبان) وراجع الطبيب', tsh: 'راجع الطبيب لضبط الغدة قبل تعديل السعرات كثيراً', creat: 'راجع كمية البروتين والصوديوم مع الطبيب', egfr: 'راجع كمية البروتين والبوتاسيوم والفوسفور مع الطبيب', alt: 'قلّل السكريات والدهون وراقب الوزن (كبد دهني محتمل)', ast: 'قلّل السكريات والدهون وراقب الوزن', ua: 'قلّل اللحوم الحمراء والأحشاء والمشروبات المحلاة' };
function medOf(c) { c.med = c.med || { visits: [], labs: [] }; c.med.visits = c.med.visits || []; c.med.labs = c.med.labs || []; return c.med; }
function medToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function medNum(v) { v = String(v == null ? '' : v).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x6F0; }).replace('٫', '.').replace(',', '.').trim(); return v === '' || isNaN(+v) ? null : +v; }
// سلسلة قيمة عبر الزمن: من الزيارات، ومعها أوزان «حصتي» للوزن
function medSeries(c, k) {
  var pts = medOf(c).visits.filter(function (v) { return v[k] != null; }).map(function (v) { return { t: Date.parse(v.d), v: v[k], src: 'v' }; });
  if (k === 'w' && c.hx && c.hx.weights) c.hx.weights.forEach(function (x) { if (!pts.some(function (p) { return Math.abs(p.t - x[0]) < 86400000; })) pts.push({ t: x[0], v: x[1], src: 'h' }); });
  return pts.sort(function (a, b) { return a.t - b.t; });
}
function medChart(pts, label, unit, color) {                         // منحنى SVG بسيط بلا مكتبات (يُطبع ويظهر في التقرير)
  if (pts.length < 2) return '';
  var W = 520, H = 170, L = 40, R = 12, T = 14, B = 26, ys = pts.map(function (p) { return p.v; }), mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys), pad = Math.max(0.5, (mx - mn) * 0.15); mn -= pad; mx += pad;
  var t0 = pts[0].t, t1 = pts[pts.length - 1].t || t0 + 1, X = function (t) { return L + (t1 === t0 ? (W - L - R) / 2 : (t - t0) / (t1 - t0) * (W - L - R)); }, Y = function (v) { return T + (mx - v) / (mx - mn) * (H - T - B); };
  var grid = [mn, (mn + mx) / 2, mx].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#99a3c2" stroke-opacity=".3"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#7d88a8">' + v.toFixed(1) + '</text>'; }).join('');
  var dl = function (t) { var d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1); }, lbl = [pts[0], pts[pts.length - 1]].map(function (p, i) { return '<text x="' + X(p.t).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i ? 'end' : 'start') + '" font-size="11" fill="#7d88a8">' + dl(p.t) + '</text>'; }).join('');
  var line = pts.map(function (p) { return X(p.t).toFixed(1) + ',' + Y(p.v).toFixed(1); }).join(' '), dots = pts.map(function (p) { return '<circle cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="' + (p.src === 'h' ? 2.5 : 3.5) + '" fill="' + (p.src === 'h' ? '#9dbbff' : color) + '"/>'; }).join('');
  var dv = ys[ys.length - 1] - ys[0];
  return '<figure class="medch"><figcaption><b>' + label + '</b> <span>' + ys[ys.length - 1] + ' ' + unit + ' (' + (dv > 0 ? '+' : '') + (Math.round(dv * 10) / 10) + ')</span></figcaption><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="منحنى ' + label + '">' + grid + '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round"/>' + dots + lbl + '</svg></figure>';
}
// تقييم التحاليل والتنبيهات (مرتبطة بحالات العميل)
function medLabFlag(c, k, v) { var d = LABK[k]; return d && v != null ? d[3](v, c.sex) : null; }
function medLatestLabs(c) { var out = {}; medOf(c).labs.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).forEach(function (p) { Object.keys(p.v || {}).forEach(function (k) { if (p.v[k] != null) { out[k] = out[k] ? { prev: out[k].v, v: p.v[k], d: p.d } : { v: p.v[k], d: p.d }; } }); }); return out; }
function medAlerts(c) {
  var L = medLatestLabs(c), cond = c.conditions || [], out = [], has = function (n) { return cond.indexOf(n) >= 0; }, DM = 'سكري النوع الثاني', IR = 'مقاومة الإنسولين / ما قبل السكري', HT = 'خمول الغدة';
  Object.keys(L).forEach(function (k) { var f = medLabFlag(c, k, L[k].v); if (f && f[0]) out.push({ lvl: f[0], k: k, t: LABK[k][1] + ': ' + L[k].v + ' ' + LABK[k][2] + ' — ' + f[1] + '. ' + (MED_ADVICE[k] || '') }); });
  var a1 = L.hba1c && L.hba1c.v, fg = L.fbg && L.fbg.v, tsh = L.tsh && L.tsh.v;
  if (has(DM) && a1 >= 7) out.unshift({ lvl: 2, t: 'السكري غير منضبط (التراكمي ' + a1 + '% والهدف أقل من 7%): راجع توزيع الكربوهيدرات وتواصل مع الطبيب المعالج.' });
  if (!has(DM) && (a1 >= 6.5 || fg >= 126)) out.unshift({ lvl: 2, add: DM, t: 'التحاليل في مستوى السكري ولا توجد «' + DM + '» في حالاته.' });
  else if (!has(DM) && !has(IR) && ((a1 >= 5.7 && a1 < 6.5) || (fg >= 100 && fg < 126))) out.unshift({ lvl: 1, add: IR, t: 'التحاليل في مستوى ما قبل السكري ولا توجد «' + IR + '» في حالاته.' });
  if (!has(HT) && tsh > 4.5) out.unshift({ lvl: 1, add: HT, t: 'TSH مرتفع (' + tsh + ') ولا توجد «' + HT + '» في حالاته — يُؤكَّد مع الطبيب.' });
  var vs = medOf(c).visits, lv = vs[vs.length - 1];
  if (lv && lv.bps != null && lv.bpd != null && (lv.bps >= 140 || lv.bpd >= 90)) out.push({ lvl: 2, t: 'ضغط الدم ' + lv.bps + '/' + lv.bpd + ' مرتفع: قلّل الصوديوم (الأطعمة المصنّعة والمخللات) وزِد الخضار والفواكه، ويُراجَع الطبيب.' });
  else if (lv && lv.bps != null && (lv.bps >= 130 || lv.bpd >= 80)) out.push({ lvl: 1, t: 'ضغط الدم ' + lv.bps + '/' + lv.bpd + ' أعلى من المثالي: راقب الصوديوم.' });
  if (lv && lv.waist != null && lv.waist >= (c.sex === 'أنثى' ? 88 : 102)) out.push({ lvl: 1, t: 'محيط الخصر ' + lv.waist + ' سم أعلى من الحد (' + (c.sex === 'أنثى' ? 88 : 102) + ') — مؤشر على دهون البطن.' });
  return out;
}
// ---------- التبويب
function medTab(c) {
  var m = medOf(c), al = medAlerts(c), vs = m.visits.slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; }), first = m.visits.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; })[0], last = vs[0];
  var delta = function (k) { if (!first || !last || first === last || first[k] == null || last[k] == null) return ''; var dv = Math.round((last[k] - first[k]) * 10) / 10; return ' <small class="' + (dv < 0 ? 'dn' : dv > 0 ? 'up' : '') + '">(' + (dv > 0 ? '+' : '') + dv + ')</small>'; };
  var sum = last ? '<div class="t medsum">' + MQ.slice(0, 5).filter(function (q) { return last[q[0]] != null; }).map(function (q) { return '<div><small>' + q[1] + '</small><b>' + last[q[0]] + ' ' + q[2] + delta(q[0]) + '</b></div>'; }).join('') + (last.bps != null ? '<div><small>الضغط</small><b>' + last.bps + '/' + (last.bpd != null ? last.bpd : '—') + '</b></div>' : '') + '</div>' : '';
  var alerts = al.length ? '<div class="medal">' + al.map(function (a) { return '<div class="' + (a.lvl > 1 ? 'warn' : 'medlo') + '">' + (a.lvl > 1 ? '⚠ ' : '• ') + esc(a.t) + (a.add ? ' <button class="sm" data-a="medAddCond" data-v="' + esc(a.add) + '">إضافة الحالة</button>' : '') + '</div>'; }).join('') + '</div>' : '';
  var visitForm = '<div class="ucard"><h3>➕ زيارة جديدة</h3><div class="row"><div><label>التاريخ</label><input type="date" id="mv_d" value="' + medToday() + '"></div>' + MQ.map(function (q) { return '<div><label>' + q[1] + ' (' + q[2] + ')</label><input id="mv_' + q[0] + '" inputmode="decimal" autocomplete="off"' + (q[0] === 'w' ? ' value="' + esc(c.weight || '') + '"' : '') + '></div>'; }).join('') + '</div><label>ملاحظات الزيارة</label><textarea id="mv_note" rows="2" placeholder="الالتزام، الصعوبات، ما تم الاتفاق عليه…"></textarea>'
    + '<p class="two"><label class="chk"><input type="checkbox" id="mv_upd" checked> تحديث وزن العميل في بياناته (لإعادة حساب السعرات)</label><button data-a="medVisit">حفظ الزيارة</button></p></div>';
  var visits = vs.length ? '<div class="tw"><table class="st medt"><tr><th class="th-o">التاريخ</th>' + MQ.map(function (q) { return '<th class="th-n">' + q[1] + '</th>'; }).join('') + '<th class="th-g">ملاحظات</th><th class="th-o"></th></tr>' + vs.map(function (v) { return '<tr><td class="g">' + esc(v.d) + '</td>' + MQ.map(function (q) { return '<td class="v">' + (v[q[0]] == null ? '—' : v[q[0]]) + '</td>'; }).join('') + '<td class="v medn">' + esc(v.note || '') + '</td><td><button class="r sm" data-a="medVisitDel" data-v="' + v.id + '" title="حذف">×</button></td></tr>'; }).join('') + '</table></div>' : '<p class="small">لا زيارات بعد. سجّل أول زيارة بالقياسات؛ وأوزان «حصتي» تُضاف للمنحنى تلقائياً.</p>';
  var charts = [medChart(medSeries(c, 'w'), 'الوزن', 'كجم', '#2e9e5e'), medChart(medSeries(c, 'waist'), 'الخصر', 'سم', '#d07a2c'), medChart(medSeries(c, 'bf'), 'نسبة الدهون', '%', '#c25b9a')].filter(Boolean).join('');
  var L = medLatestLabs(c), labsRows = Object.keys(L).map(function (k) { var d = LABK[k], f = medLabFlag(c, k, L[k].v), tr = L[k].prev != null ? (L[k].v > L[k].prev ? ' ↑' : L[k].v < L[k].prev ? ' ↓' : ' =') + ' من ' + L[k].prev : ''; return '<tr><td class="g">' + esc(d[1]) + '</td><td class="v"><b>' + L[k].v + '</b> ' + esc(d[2]) + '</td><td class="v"><span class="lf l' + f[0] + '">' + esc(f[1]) + '</span></td><td class="v">' + esc(tr) + '</td><td class="v">' + esc(L[k].d) + '</td></tr>'; }).join('');
  var labForm = S.medLab ? '<div class="ucard"><h3>🧪 تحاليل جديدة</h3><div class="row"><div><label>تاريخ التحليل</label><input type="date" id="ml_d" value="' + medToday() + '"></div></div><div class="row medlabs">' + LAB.map(function (d) { return '<div><label>' + esc(d[1]) + ' <small>(' + esc(d[2]) + ')</small></label><input id="ml_' + d[0] + '" inputmode="decimal" autocomplete="off"></div>'; }).join('') + '</div><p class="small">اكتب المتوفر فقط واترك الباقي فارغاً.</p><p class="two"><button data-a="medLabSave">حفظ التحاليل</button><button class="sec" data-a="medLabForm">إلغاء</button></p></div>' : '';
  return '<div class="medtab"><div class="hxtop"><h3>🩺 الملف الطبي</h3><p class="two"><button data-a="medReport">📄 تقرير التقدّم للعميل</button>' + (c.hx ? '<button class="sec" data-a="medToHx">➤ ملخص التقدّم إلى «حصتي»</button>' : '') + '</p></div>'
    + alerts + sum + (charts ? '<div class="medcharts">' + charts + '</div>' : '') + visitForm + '<h3>الزيارات (' + vs.length + ')</h3>' + visits
    + '<div class="hxtop"><h3>🧪 التحاليل</h3>' + (S.medLab ? '' : '<button data-a="medLabForm">+ تحاليل جديدة</button>') + '</div>' + labForm
    + (labsRows ? '<div class="tw"><table class="st medt"><tr><th class="th-o">التحليل</th><th class="th-n">آخر قيمة</th><th class="th-y">التقييم</th><th class="th-g">التغيّر</th><th class="th-o">التاريخ</th></tr>' + labsRows + '</table></div>' + (m.labs.length > 1 ? '<p class="small">' + m.labs.length + ' مجموعات تحاليل محفوظة. <button class="link" data-a="medLabsAll">عرض الكل</button></p>' : '') : '<p class="small">لا تحاليل بعد.</p>')
    + (S.medLabsAll ? medLabsAll(c) : '') + '<p class="small">النطاقات المرجعية إرشادية للبالغين وتختلف قليلاً بين المختبرات؛ القرار الطبي للطبيب المعالج.</p></div>';
}
function medLabsAll(c) { return '<div class="tw"><table class="st medt"><tr><th class="th-o">التاريخ</th><th class="th-n">القيم</th><th class="th-o"></th></tr>' + medOf(c).labs.slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; }).map(function (p) { return '<tr><td class="g">' + esc(p.d) + '</td><td class="v medn">' + Object.keys(p.v).map(function (k) { var f = medLabFlag(c, k, p.v[k]); return esc(LABK[k] ? LABK[k][1] : k) + ': <b class="lf l' + (f ? f[0] : 0) + '">' + p.v[k] + '</b>'; }).join(' • ') + '</td><td><button class="r sm" data-a="medLabDel" data-v="' + p.id + '">×</button></td></tr>'; }).join('') + '</table></div>'; }
// ---------- تقرير التقدّم (HTML مطبوع للعميل)
function medReportHtml(c, note) {
  var b = BR(), m = medOf(c), vs = m.visits.slice().sort(function (a, b2) { return a.d < b2.d ? -1 : 1; }), f = vs[0], l = vs[vs.length - 1], L = medLatestLabs(c);
  var row = function (q) { if (!f || f[q[0]] == null || l[q[0]] == null) return ''; var dv = Math.round((l[q[0]] - f[q[0]]) * 10) / 10; return '<tr><td>' + q[1] + '</td><td>' + f[q[0]] + ' ' + q[2] + '</td><td>' + l[q[0]] + ' ' + q[2] + '</td><td class="' + (dv < 0 ? 'dn' : dv > 0 ? 'up' : '') + '">' + (dv > 0 ? '+' : '') + dv + '</td></tr>'; };
  var adh = ''; if (c.hx && c.hx.logs) { var ks = Object.keys(c.hx.logs).sort().slice(-30), ps = ks.map(function (k) { var x = c.hx.logs[k]; return x.n ? x.done / x.n : null; }).filter(function (x) { return x != null; }); if (ps.length) adh = '<p>متوسط التزامك بالخطة في آخر ' + ps.length + ' يوماً سجّلتها في «حصتي»: <b>' + Math.round(ps.reduce(function (a, x) { return a + x; }, 0) / ps.length * 100) + '%</b></p>'; }
  var labs = Object.keys(L).map(function (k) { var fl = medLabFlag(c, k, L[k].v); return '<tr><td>' + esc(LABK[k][1]) + '</td><td>' + L[k].v + ' ' + esc(LABK[k][2]) + '</td><td class="l' + fl[0] + '">' + esc(fl[1]) + '</td><td>' + (L[k].prev != null ? L[k].prev : '—') + '</td></tr>'; }).join('');
  var charts = [medChart(medSeries(c, 'w'), 'الوزن', 'كجم', '#2e9e5e'), medChart(medSeries(c, 'waist'), 'الخصر', 'سم', '#d07a2c'), medChart(medSeries(c, 'bf'), 'نسبة الدهون', '%', '#c25b9a')].filter(Boolean).join('');
  var span = f && l ? 'من ' + f.d + ' إلى ' + l.d : medToday();
  return '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>تقرير التقدّم — ' + esc(c.name) + '</title><style>body{font:15px/1.7 Tahoma,Arial,sans-serif;color:#1d2c63;max-width:860px;margin:20px auto;padding:0 16px}h1{margin:0;font-size:24px}h2{font-size:17px;background:#1d2c63;color:#fff;padding:6px 12px;border-radius:6px;margin:22px 0 10px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #d9dce6;padding:7px;text-align:center}th{background:#f1f3f8}.dn{color:#1e8c4e;font-weight:700}.up{color:#c0392b;font-weight:700}.l2{color:#c0392b;font-weight:700}.l1{color:#b26a00;font-weight:700}.l0{color:#1e8c4e}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1d2c63;padding-bottom:10px}.medcharts{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.medch{margin:0;border:1px solid #e3e6ef;border-radius:8px;padding:6px}.medch svg{width:100%;height:auto}.note{background:#f4f7ff;border-right:4px solid #2e9e5e;padding:10px 14px;border-radius:6px;white-space:pre-wrap}small{color:#667}@media print{body{margin:0}}</style><body>'
    + '<div class="hd"><div><h1>تقرير التقدّم</h1><div>' + esc(c.name) + ' • ' + esc(c.code) + ' • ' + span + '</div><small>' + esc(b.clinic || '') + (b.specialist ? ' • ' + esc(b.specialist) : '') + '</small></div><img src="' + logoSrc() + '" style="height:64px"></div>'
    + (f && l && f !== l ? '<h2>قياساتك</h2><table><tr><th>القياس</th><th>البداية</th><th>الآن</th><th>التغيّر</th></tr>' + MQ.map(row).join('') + '</table>' : l ? '<h2>قياساتك</h2><p>' + MQ.filter(function (q) { return l[q[0]] != null; }).map(function (q) { return q[1] + ': ' + l[q[0]] + ' ' + q[2]; }).join(' • ') + '</p>' : '')
    + (charts ? '<h2>منحنيات التقدّم</h2><div class="medcharts">' + charts + '</div>' : '') + (adh ? '<h2>التزامك</h2>' + adh : '')
    + (labs ? '<h2>تحاليلك</h2><table><tr><th>التحليل</th><th>آخر قيمة</th><th>التقييم</th><th>السابقة</th></tr>' + labs + '</table><small>النطاقات إرشادية؛ ناقش نتائجك مع طبيبك.</small>' : '')
    + (note ? '<h2>كلمة أخصائيك</h2><div class="note">' + esc(note) + '</div>' : '') + '</body></html>';
}
function medSummaryText(c) {
  var vs = medOf(c).visits.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }), f = vs[0], l = vs[vs.length - 1], s = [];
  if (f && l && f !== l) MQ.slice(0, 4).forEach(function (q) { if (f[q[0]] != null && l[q[0]] != null) { var dv = Math.round((l[q[0]] - f[q[0]]) * 10) / 10; s.push(q[1] + ': ' + f[q[0]] + ' ← ' + l[q[0]] + ' ' + q[2] + ' (' + (dv > 0 ? '+' : '') + dv + ')'); } });
  return 'ملخص تقدّمك' + (f && l ? ' من ' + f.d + ' إلى ' + l.d : '') + ':\n' + (s.join('\n') || 'سُجّلت قياساتك الأولى.') + '\nاستمر، أنت على الطريق الصحيح 👏';
}
Object.assign(A, {
  medVisit: function () {
    var c = cur(), m = medOf(c), v = { id: 'v' + Date.now().toString(36), d: $('#mv_d').value || medToday(), note: ($('#mv_note').value || '').trim() }, any = false;
    MQ.forEach(function (q) { var x = medNum($('#mv_' + q[0]).value); if (x != null) { v[q[0]] = x; any = true; } }); if (!any) { toast('اكتب قياساً واحداً على الأقل'); return; }
    if (v.w != null && (v.w < 20 || v.w > 400)) { toast('الوزن غير منطقي'); return; }
    m.visits.push(v); if ($('#mv_upd').checked && v.w != null && v.d >= (m.visits.map(function (x) { return x.d; }).sort().pop())) c.weight = v.w; if (v.bf != null && c.kind === 'athlete' && $('#mv_upd').checked) c.bf = v.bf;
    persist(c); main(); toast('✓ حُفظت الزيارة' + ($('#mv_upd') && v.w != null ? '' : ''));
  },
  medVisitDel: function (v) { var c = cur(); if (!confirm('حذف هذه الزيارة؟')) return; medOf(c).visits = medOf(c).visits.filter(function (x) { return x.id !== v; }); persist(c); main(); },
  medLabForm: function () { S.medLab = !S.medLab; main(); },
  medLabsAll: function () { S.medLabsAll = !S.medLabsAll; main(); },
  medLabSave: function () {
    var c = cur(), p = { id: 'l' + Date.now().toString(36), d: $('#ml_d').value || medToday(), v: {} };
    LAB.forEach(function (d) { var x = medNum($('#ml_' + d[0]).value); if (x != null) p.v[d[0]] = x; }); if (!Object.keys(p.v).length) { toast('اكتب نتيجة تحليل واحدة على الأقل'); return; }
    medOf(c).labs.push(p); S.medLab = false; persist(c); main(); var n = medAlerts(c).length; toast('✓ حُفظت التحاليل' + (n ? ' — ' + n + ' تنبيه' : ''));
  },
  medLabDel: function (v) { var c = cur(); if (!confirm('حذف مجموعة التحاليل هذه؟')) return; medOf(c).labs = medOf(c).labs.filter(function (x) { return x.id !== v; }); persist(c); main(); },
  medAddCond: function (v) { var c = cur(); c.conditions = c.conditions || []; if (c.conditions.indexOf(v) < 0) c.conditions.push(v); persist(c); main(); toast('أُضيفت «' + v + '» إلى حالاته — أعد توليد الخطة لتطبيقها'); },
  medReport: function () { var c = cur(), note = prompt('كلمة منك للعميل في التقرير (اختياري):', '') || ''; dlFile(new Blob([medReportHtml(c, note)], { type: 'text/html' }), 'تقرير_التقدم_' + fileBase(c) + '.html'); toast('نُزّل تقرير التقدّم — افتحه للطباعة أو أرسله للعميل'); },
  medToHx: function () { var c = cur(); if (!c.hx) return; var t = medSummaryText(c), ts = Date.now(); hxSend(c, { t: 'msg', text: t, ts: ts }).then(function () { c.hx.msgs = (c.hx.msgs || []).concat([{ from: 'd', t: t, ts: ts }]); persist(c); toast('✓ أُرسل ملخص التقدّم إلى «حصتي»'); }).catch(hxErr); }
});
