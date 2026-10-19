// ================= محرر استبيانات «حصتي» (يُدمج داخل app.js عند /*FORMSUI*/) — الإعدادات ← 📝 الاستبيانات
// استبيان لكل نظام (الحصص / الجرامات): تسمية الأقسام وترتيبها وإخفاؤها، نص الأسئلة الأساسية وإخفاؤها (عدا الأساسي جداً)،
// وأسئلة وأقسام مخصّصة بأنواع مختلفة. يُحفظ في S.settings.forms (ويصل المستخدمين مع التصدير)، ويُرسل مع كل دعوة جديدة.
var FMT = {}; HForms.TYPES.forEach(function (t) { FMT[t[0]] = t[1]; });
function fmSys() { return S.fsys === 'g' ? 'g' : 'ex'; }
function fmSpec() { var sys = fmSys(); return HForms.normalize(((S.settings.forms || {})[sys]) || ((eff().forms || {})[sys]), sys); }
function fmSave(spec) { var sys = fmSys(); S.settings.forms = S.settings.forms || {}; S.settings.forms[sys] = HForms.normalize(spec, sys); saveSettings(); }
function fmQRow(q, si, qi, n) {
  var mv = '<button class="sec sm" data-a="fmQMv" data-v="' + si + ',' + qi + ',-1"' + (qi ? '' : ' disabled') + ' title="لأعلى">↑</button><button class="sec sm" data-a="fmQMv" data-v="' + si + ',' + qi + ',1"' + (qi < n - 1 ? '' : ' disabled') + ' title="لأسفل">↓</button>';
  var kind = q.b ? '<span class="fmb">أساسي' + (q.lock ? ' 🔒' : '') + '</span>' : '<span class="fmb c">' + esc(FMT[q.type] || q.type) + '</span>';
  var extra = q.b ? '' : (q.type === 'one' || q.type === 'many' ? '<textarea data-fm="q,' + si + ',' + qi + ',opts" rows="2" placeholder="خيار في كل سطر">' + esc((q.opts || []).join('\n')) + '</textarea>' : q.type === 'num' ? '<input data-fm="q,' + si + ',' + qi + ',unit" value="' + esc(q.unit || '') + '" placeholder="الوحدة (اختياري)">' : '');
  var tog = q.b ? (q.lock ? '<small class="small">لا يُخفى</small>' : '<label class="chk"><input type="checkbox" data-fm="q,' + si + ',' + qi + ',show"' + (q.hide ? '' : ' checked') + '> ظاهر</label>') : '<label class="chk"><input type="checkbox" data-fm="q,' + si + ',' + qi + ',req"' + (q.req ? ' checked' : '') + '> إلزامي</label>';
  return '<div class="fmq' + (q.hide ? ' off' : '') + '"><div class="fmql"><input data-fm="q,' + si + ',' + qi + ',label" value="' + esc(q.label) + '" aria-label="نص السؤال">' + extra + '</div><div class="fmqa">' + kind + tog + mv + (q.b ? '' : '<button class="r sm" data-a="fmQDel" data-v="' + si + ',' + qi + '" title="حذف السؤال">×</button>') + '</div></div>';
}
function fmAddForm(si) {
  return '<div class="fmadd"><div class="row"><div><label>نوع السؤال</label><select id="fm_t">' + HForms.TYPES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></div><div style="flex:2"><label>نص السؤال</label><input id="fm_l" maxlength="160" placeholder="مثال: كم ساعة تنام يومياً؟"></div></div>'
    + '<div class="row"><div><label>الخيارات (للاختيار الواحد/المتعدد: خيار في كل سطر)</label><textarea id="fm_o" rows="3" placeholder="صباحاً\nظهراً\nمساءً"></textarea></div><div><label>الوحدة (للرقم)</label><input id="fm_u" placeholder="ساعة، لتر، مرة…"></div><div><label>توضيح يظهر تحت السؤال (اختياري)</label><input id="fm_h" maxlength="200"></div></div>'
    + '<p class="two"><label class="chk"><input type="checkbox" id="fm_r"> إلزامي</label><button data-a="fmQSave" data-v="' + si + '">إضافة السؤال</button><button class="sec" data-a="fmQAdd" data-v="">إلغاء</button></p></div>';
}
function formsPage() {
  var sys = fmSys(), spec = fmSpec(), n = spec.steps.length;
  return '<h3>📝 استبيانات «حصتي»</h3><p class="small">ما يملؤه العميل في «حصتي» عند التسجيل. لكل نظام استبيانه: غيّر نص أي سؤال، أخفِ ما لا تحتاجه، رتّب الأقسام والأسئلة، وأضف أسئلة بأنواع مختلفة أو أقساماً جديدة. يُرسل الاستبيان مع كل دعوة جديدة، وتصلك الإجابات في طلب العميل وفي ملاحظاته.</p>'
    + '<div class="tabs"><button class="' + (sys === 'ex' ? 'on' : '') + '" data-a="fmSys" data-v="ex">نظام الحصص</button><button class="' + (sys === 'g' ? 'on' : '') + '" data-a="fmSys" data-v="g">نظام الجرامات</button></div>'
    + '<p class="two"><button data-a="fmStepAdd">+ قسم جديد</button><button class="sec" data-a="fmPrint">🖨 نسخة ورقية للطباعة</button><button class="sec" data-a="fmReset">استعادة الاستبيان الافتراضي</button></p>'
    + spec.steps.map(function (st, si) {
      return '<div class="ucard fmstep' + (st.hide ? ' off' : '') + '"><div class="fmh"><span class="fmn">' + (si + 1) + '</span><input data-fm="st,' + si + ',t" value="' + esc(st.t) + '" aria-label="اسم القسم"' + '><small class="small">' + (st.custom ? 'قسم مخصّص' : 'قسم أساسي') + ' • ' + st.q.filter(function (q) { return !q.hide; }).length + ' سؤال ظاهر</small>'
        + (st.id === 'basic' ? '' : '<button class="sec sm" data-a="fmStepMv" data-v="' + si + ',-1"' + (si > 1 ? '' : ' disabled') + '>↑</button><button class="sec sm" data-a="fmStepMv" data-v="' + si + ',1"' + (si < n - 1 ? '' : ' disabled') + '>↓</button>')
        + (st.custom ? '<button class="r sm" data-a="fmStepDel" data-v="' + si + '">حذف القسم</button>' : st.id === 'basic' ? '' : '<label class="chk"><input type="checkbox" data-fm="st,' + si + ',show"' + (st.hide ? '' : ' checked') + '> ظاهر</label>') + '</div>'
        + st.q.map(function (q, qi) { return fmQRow(q, si, qi, st.q.length); }).join('')
        + (S.fadd === st.id ? fmAddForm(si) : '<button class="sec sm" data-a="fmQAdd" data-v="' + st.id + '">+ سؤال في هذا القسم</button>') + '</div>';
    }).join('');
}
function fmPrintHtml() {                                             // نسخة ورقية من الاستبيان (للعيادة أو لمن لا يستخدم «حصتي»)
  var sys = fmSys(), spec = fmSpec(), AD = window.ATHLETE, b = BR(), box = function (l) { return l.map(function (x) { return '<span class="o">☐ ' + esc(x) + '</span>'; }).join(''); }, line = '<div class="ln"></div>';
  var B = {
    sex: box(['ذكر', 'أنثى']), act: box(D.settings.activity.map(function (a) { return a[0]; })), goal: box(D.settings.goals.map(function (g) { return g[0].replace(/[−+]\d+/, '').trim(); })), gphase: box(AD.phases.map(function (x) { return x.n; })),
    cond: box(D.conditions), allg: box(D.allergens.map(function (a) { return a.label; })), meds: line + line, supp: line + line, notes: line + line + line, nmeals: box(['3', '4', '5', '6']), wdays: box(D.days),
    meals: '<div>وجبات أحبها: ' + line + '</div><div>وجبات لا أريدها: ' + line + '</div>', foods: '<div>أصناف أحبها: ' + line + line + '</div><div>أصناف لا أحبها: ' + line + line + '</div>',
    train: '<table><tr><th>اليوم</th><th>نوع اليوم (' + esc(AD.dayTypes.map(function (x) { return x.n; }).join(' / ')) + ')</th><th>المدة (دقيقة)</th><th>الوقت</th></tr>' + D.days.map(function (d) { return '<tr><td>' + esc(d) + '</td><td></td><td></td><td></td></tr>'; }).join('') + '</table>'
  };
  var Q = function (q) { if (q.b) return B[q.id] || line; if (q.type === 'one' || q.type === 'many') return box(q.opts); if (q.type === 'yn') return box(['نعم', 'لا']); if (q.type === 'scale') return box(['1', '2', '3', '4', '5']); if (q.type === 'long') return line + line + line; return line + (q.unit ? ' <small>' + esc(q.unit) + '</small>' : ''); };
  var body = HForms.visibleSteps(spec).map(function (st, i) { return '<h2>' + (i + 1) + '. ' + esc(st.t) + '</h2>' + st.q.filter(function (q) { return !q.hide; }).map(function (q) { return '<div class="q"><b>' + esc(q.label) + (q.req ? ' *' : '') + '</b>' + (q.help ? '<small>' + esc(q.help) + '</small>' : '') + '<div class="a">' + Q(q) + '</div></div>'; }).join(''); }).join('');
  return '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>استبيان ' + (sys === 'g' ? 'نظام الجرامات' : 'نظام الحصص') + '</title><style>body{font:14px/1.7 Tahoma,Arial,sans-serif;color:#1d2c63;max-width:820px;margin:20px auto;padding:0 16px}h1{font-size:22px;margin:0}h2{font-size:16px;background:#1d2c63;color:#fff;padding:6px 12px;border-radius:6px;margin:18px 0 8px}.q{padding:6px 0;border-bottom:1px solid #e3e6ef;page-break-inside:avoid}.q small{display:block;color:#667}.a{margin-top:4px}.o{display:inline-block;margin:2px 0 2px 16px}.ln{border-bottom:1px dotted #999;height:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccd;padding:6px;height:22px}th{background:#f1f3f8}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1d2c63;padding-bottom:8px}@media print{body{margin:0}}</style><body><div class="hd"><div><h1>استبيان التسجيل — ' + (sys === 'g' ? 'نظام الجرامات' : 'نظام الحصص') + '</h1><div>' + esc(b.clinic || '') + (b.specialist ? ' • ' + esc(b.specialist) : '') + '</div></div><img src="' + logoSrc() + '" style="height:60px"></div><p>الاسم: ' + line + ' التاريخ: ' + line + '</p>' + body + '</body></html>';
}
Object.assign(A, {
  fmSys: function (v) { S.fsys = v; S.fadd = null; main(); },
  fmReset: function () { if (!confirm('استعادة الاستبيان الافتراضي لنظام ' + (fmSys() === 'g' ? 'الجرامات' : 'الحصص') + '؟ تُحذف أسئلتك المخصّصة فيه.')) return; S.settings.forms = S.settings.forms || {}; S.settings.forms[fmSys()] = HForms.defaults(fmSys()); saveSettings(); main(); toast('عاد الاستبيان الافتراضي'); },
  fmStepAdd: function () { var sp = fmSpec(); sp.steps.push({ id: HForms.uid('s_'), t: 'قسم جديد', custom: 1, q: [] }); fmSave(sp); S.fadd = sp.steps[sp.steps.length - 1].id; main(); },
  fmStepDel: function (v) { var sp = fmSpec(), st = sp.steps[+v]; if (!st || !st.custom || !confirm('حذف القسم «' + st.t + '» وأسئلته؟')) return; sp.steps.splice(+v, 1); fmSave(sp); main(); },
  fmStepMv: function (v) { var a = v.split(',').map(Number), sp = fmSpec(), j = a[0] + a[1]; if (j < 1 || j >= sp.steps.length) return; var t = sp.steps[a[0]]; sp.steps[a[0]] = sp.steps[j]; sp.steps[j] = t; fmSave(sp); main(); },
  fmQAdd: function (v) { S.fadd = v || null; main(); var l = $('#fm_l'); if (l) l.focus(); },
  fmQSave: function (v) {
    var sp = fmSpec(), st = sp.steps[+v], t = $('#fm_t').value, l = ($('#fm_l').value || '').trim(); if (!l) { toast('اكتب نص السؤال'); return; }
    var q = { id: HForms.uid('q_'), type: t, label: l, req: $('#fm_r').checked ? 1 : 0, help: ($('#fm_h').value || '').trim() };
    if (t === 'one' || t === 'many') { q.opts = ($('#fm_o').value || '').split(/\n|،|,/).map(function (x) { return x.trim(); }).filter(Boolean); if (q.opts.length < 2) { toast('اكتب خيارين على الأقل (خيار في كل سطر)'); return; } }
    if (t === 'num') q.unit = ($('#fm_u').value || '').trim();
    st.q.push(q); fmSave(sp); S.fadd = null; main(); toast('أُضيف السؤال إلى «' + st.t + '»');
  },
  fmQDel: function (v) { var a = v.split(',').map(Number), sp = fmSpec(), q = sp.steps[a[0]].q[a[1]]; if (!q || q.b || !confirm('حذف السؤال «' + q.label + '»؟')) return; sp.steps[a[0]].q.splice(a[1], 1); fmSave(sp); main(); },
  fmQMv: function (v) { var a = v.split(',').map(Number), sp = fmSpec(), qs = sp.steps[a[0]].q, j = a[1] + a[2]; if (j < 0 || j >= qs.length) return; var t = qs[a[1]]; qs[a[1]] = qs[j]; qs[j] = t; fmSave(sp); main(); },
  fmPrint: function () { dlFile(new Blob([fmPrintHtml()], { type: 'text/html' }), 'استبيان_' + (fmSys() === 'g' ? 'نظام_الجرامات' : 'نظام_الحصص') + '.html'); toast('نُزّل الاستبيان الورقي — افتحه واطبعه'); }
});
document.addEventListener('change', function (e) {
  var t = e.target; if (!t.dataset || !t.dataset.fm) return; var a = t.dataset.fm.split(','), sp = fmSpec(), st = sp.steps[+a[1]]; if (!st) return;
  if (a[0] === 'st') { if (a[2] === 't') st.t = t.value.trim() || st.t; else if (a[2] === 'show') st.hide = t.checked ? 0 : 1; }
  else { var q = st.q[+a[2]]; if (!q) return; var k = a[3];
    if (k === 'label') q.label = t.value.trim() || q.label; else if (k === 'show') q.hide = t.checked ? 0 : 1; else if (k === 'req') q.req = t.checked ? 1 : 0; else if (k === 'unit') q.unit = t.value.trim();
    else if (k === 'opts') { var o = t.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (o.length >= 2) q.opts = o; else toast('خياران على الأقل'); } }
  fmSave(sp); main();
});
