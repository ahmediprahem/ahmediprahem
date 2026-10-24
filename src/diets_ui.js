// ================= مكتبة الأخصائي (0.41): تبويب «الأنظمة» (10 أنظمة لنزول الوزن) وتبويب «مشاكل الأخصائي» (10 مشاكل) + تطبيق تلقائي على العميل (يُدمج داخل app.js عند /*DIETSUI*/)
// المنطق كله في src/diets.js (DX)؛ هنا العرض والإجراءات فقط. كل الأرقام قيم افتراضية قابلة للتعديل، والأخصائي هو من يعتمد.
var DXS = { tab: 'diets', open: '', prob: '', client: '', P: {}, ok: {} };
if (window.DPApp) window.DPApp.DXS = DXS;
function dxClient() { var code = DXS.client || S.cur; return S.clients.filter(function (c) { return c.code === code; })[0] || null; }
function dxSysTxt(d) { return d.sys === 'both' ? 'حصص وجرامات' : d.sys === 'ath' ? 'جرامات' : 'حصص'; }
function dxParamsOf(id) { DXS.P[id] = DX.pnorm(id, DXS.P[id] || DX.defaults(id)); return DXS.P[id]; }
function dxField(d, p, v) {
  var id = 'dxp_' + d.id + '_' + p.k;
  if (p.type === 'sel') return '<div><label>' + esc(p.l) + '</label><select data-dxp="' + p.k + '">' + p.opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
  if (p.type === 'time') return '<div><label>' + esc(p.l) + '</label><input type="time" data-dxp="' + p.k + '" value="' + esc(v) + '"></div>';
  return '<div><label>' + esc(p.l) + '</label><input type="number" data-dxp="' + p.k + '" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '" value="' + v + '"></div>';
}
function dxPreview(id, P, extra) {
  var c = dxClient(), d = DX.get(id); if (!c) return '<p class="small">اختر عميلاً لعرض الحساب والموانع.</p>';
  var ecl = ec(c), res = DX.apply(id, ecl, P, D, AD, E, Ath), h = '';
  if (res.blocks.length) h += res.blocks.map(function (b) { return '<div class="warn dxstop">⛔ ' + esc(b) + '</div>'; }).join('');
  (res.warns || []).forEach(function (w) { h += '<div class="warn">⚠ ' + esc(w) + '</div>'; });
  if (res.ok) {
    var en = res.energy, pt = res.patch;
    h += '<div class="t dxcalc"><div><small>احتياج الطاقة</small><b>' + Math.round(en.tdee) + '</b></div><div><small>السعرات المقترحة</small><b>' + Math.round(res.patch.diet.kcal) + '</b></div><div><small>العجز الفعلي</small><b>' + en.deficit + '</b></div>'
      + (pt.choPct != null ? '<div><small>كارب</small><b>' + Math.round(pt.choPct * 100) + '%</b></div><div><small>بروتين</small><b>' + Math.round(pt.proPct * 100) + '%</b></div><div><small>دهون</small><b>' + Math.round(pt.fatPct * 100) + '%</b></div>' : '<div><small>بروتين</small><b>' + pt.pVal + ' جم/كجم</b></div><div><small>دهون</small><b>' + pt.fVal + (pt.fMode === 'pct' ? '%' : ' جم/كجم') + '</b></div>') + '</div>';
    (res.notes || []).forEach(function (n) { h += '<div class="ok">' + esc(n) + '</div>'; });
    (extra || []).forEach(function (n) { h += '<div class="ok">' + esc(n) + '</div>'; });
  }
  if (res.confirm && res.confirm.length) h += '<div class="dxconf"><b>أكّد الموانع (قرارك السريري):</b>' + res.confirm.map(function (t, i) { return '<label class="chk"><input type="checkbox" data-dxk="' + i + '"' + (DXS.ok[i] ? ' checked' : '') + '>' + esc(t) + '</label>'; }).join('') + '</div>';
  var ready = res.ok && (!res.confirm || !res.confirm.length || res.confirm.every(function (t, i) { return DXS.ok[i]; }));
  h += '<p><button class="o" data-a="dxApply" data-v="' + id + '"' + (ready ? '' : ' disabled') + '>طبّق على ' + esc(c.name || c.code) + ' وولّد الخطة</button></p>';
  h += '<p class="small">يُستبدل التوزيع اليدوي للمجموعات ويُولَّد أسبوع كامل؛ وبعده كل شيء قابل للتعديل (الصنف، الكمية، السعرات، الماكروز).</p>';
  return h;
}
function dxDietCard(d) {
  var open = DXS.open === d.id, P = dxParamsOf(d.id), li = function (a) { return '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
  var h = '<section class="dxc' + (open ? ' open' : '') + '"><button class="dxh" data-a="dxOpen" data-v="' + d.id + '" aria-expanded="' + open + '"><span class="dxn">' + esc(d.n) + '</span><span class="dxb g' + d.grade + '">دليل ' + DX.GRADE[d.grade] + '</span><span class="dxb">' + dxSysTxt(d) + '</span></button><p class="dxs">' + esc(d.sum) + '</p>';
  if (open) {
    h += '<div class="dxd"><div class="dxcols"><div><h4>متى يُفضَّل</h4>' + li(d.when) + '<h4>مميزاته</h4>' + li(d.pros) + '</div><div><h4>متى لا يُناسب (موانع/تحفّظات)</h4>' + li(d.notFor) + '<h4>عيوبه</h4>' + li(d.cons) + '</div></div>'
      + '<h4>في مصر</h4><p class="small">' + esc(d.eg) + '</p><h4>في السعودية</h4><p class="small">' + esc(d.sa) + '</p>'
      + '<details><summary>المراجع (' + d.refs.length + ')</summary>' + li(d.refs.map(function (r) { return DX.SRC[r] || r; })) + '<p class="small">المحتوى مسودة بحثية حتى اعتماد المالك (docs/diets_research_AR.md).</p></details>'
      + '<h4>الإعدادات (قابلة للتعديل)</h4><div class="row">' + d.par.map(function (p) { return dxField(d, p, P[p.k]); }).join('') + '</div>' + dxPreview(d.id, P) + '</div>';
  }
  return h + '</section>';
}
function dxProblemCard(p) {
  var open = DXS.prob === p.id, c = dxClient(), li = function (a) { return '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
  var h = '<section class="dxc' + (open ? ' open' : '') + '"><button class="dxh" data-a="probOpen" data-v="' + p.id + '" aria-expanded="' + open + '"><span class="dxn">' + esc(p.n) + '</span><span class="dxb">' + p.rec.map(function (r) { return esc(DX.get(r).n); }).join(' • ') + '</span></button>';
  if (open) {
    var f = c ? DX.solve(p.id, ec(c), D, AD, E, Ath) : null, d = f ? DX.get(f.dietId) : null, P = f ? DX.pnorm(f.dietId, Object.assign(DX.defaults(f.dietId), f.P)) : null;
    h += '<div class="dxd"><p>' + esc(p.why) + '</p><h4>اسأل العميل / راجع</h4>' + li(p.ask) + '<h4>خطوات الحل</h4>' + li(p.steps);
    if (f) {
      h += '<div class="dxfix"><h4>الحل المقترح تلقائياً لـ«' + esc(c.name || c.code) + '»</h4><p><b>' + esc(d.n) + '</b> — عجز ' + P.deficit + (P.pro ? ' • بروتين ' + P.pro + ' جم/كجم' : '') + (P.cho ? ' • كارب ' + P.cho + '%' : '') + '</p>'
        + (f.extra || []).map(function (x) { return '<div class="ok">' + esc(x) + '</div>'; }).join('') + (f.warn ? '<div class="warn">⚠ ' + esc(f.warn) + '</div>' : '') + dxPreview(f.dietId, P, null).replace('data-a="dxApply" data-v="' + f.dietId + '"', 'data-a="probApply" data-v="' + p.id + '"') + '</div>';
    } else h += '<p class="small">اختر عميلاً لعرض الحل المقترح وتطبيقه.</p>';
    h += '</div>';
  }
  return h + '</section>';
}
function dxLibPage() {
  var cl = S.clients.slice().sort(function (a, b) { return (b.updated || b.created || 0) - (a.updated || a.created || 0); }), cur0 = dxClient();
  var h = '<div class="dxl"><h2>📚 مكتبة الأخصائي</h2><p class="small">مرجعك العملي: نبذة عن كل نظام ومتى تستعمله وعيوبه ومراجعه، مع تطبيق تلقائي على العميل (حصص أو جرامات) يمكنك تعديل كل ما ينتج عنه. الأرقام قيم افتراضية مبنية على مراجع مذكورة وتبقى قرارك السريري.</p>'
    + '<div class="tabs"><button class="' + (DXS.tab === 'diets' ? 'on' : '') + '" data-a="dxTab" data-v="diets">الأنظمة (10)</button><button class="' + (DXS.tab === 'problems' ? 'on' : '') + '" data-a="dxTab" data-v="problems">مشاكل الأخصائي (10)</button></div>'
    + '<div class="dxcl"><label>العميل المطبَّق عليه</label><select data-dxcl><option value="">— اختر عميلاً —</option>' + cl.map(function (c) { return '<option value="' + esc(c.code) + '"' + (cur0 && cur0.code === c.code ? ' selected' : '') + '>' + esc(c.name || '(بلا اسم)') + ' — ' + esc(c.code) + (c.kind === 'athlete' ? ' • جرامات' : ' • حصص') + '</option>'; }).join('') + '</select>'
    + (cur0 && cur0.diet ? '<small>النظام الحالي: ' + esc((DX.get(cur0.diet.id) || {}).n || cur0.diet.id) + '</small>' : '') + '</div>';
  h += DXS.tab === 'diets' ? DX.LIST.map(dxDietCard).join('') : DX.PROBLEMS.map(dxProblemCard).join('');
  return h + '</div>';
}
function dxClientBox(c) {
  if (!window.DX) return '';
  var d = c.diet ? DX.get(c.diet.id) : null;
  return '<div class="dxbox noprint"><b>🥗 النظام الغذائي لنزول الوزن</b> ' + (d ? '<span class="dxb">' + esc(d.n) + '</span> <small>(' + (c.diet.sys === 'ath' ? 'جرامات' : 'حصص') + ' • ' + c.diet.kcal + ' سعرة)</small>' : '<small>لم يُختر نظام — الإعدادات أدناه يدوية.</small>')
    + ' <button class="sm" data-a="dxFor" data-v="' + esc(c.code) + '">' + (d ? 'غيّر النظام' : 'اختر نظاماً') + '</button>' + (d ? ' <button class="sm sec" data-a="dxClear">إزالة النظام</button>' : '') + '</div>';
}
function dxPlanBox(c) {
  if (!window.DX || !c.diet || !c.plan) return '';
  var d = DX.get(c.diet.id), chk = [];
  try { chk = DX.check(c.plan, ec(c), D, AD, E, Ath); } catch (e) { chk = []; }
  var P = c.diet.P || {}, extra = c.diet.window ? ' • نافذة الأكل ' + c.diet.window.start + '–' + c.diet.window.end : (c.diet.fastDays ? ' • يوما الصيام: ' + c.diet.fastDays.map(function (i) { return (D.days || AD.days)[i]; }).join(' و') : '');
  var bad = chk.filter(function (x) { return x.lvl === 'bad'; }), warn = chk.filter(function (x) { return x.lvl === 'warn'; }), info = chk.filter(function (x) { return x.lvl === 'info'; });
  return '<div class="dxbox noprint"><b>🥗 ' + esc(d ? d.n : c.diet.id) + '</b> <small>' + c.diet.kcal + ' سعرة' + extra + '</small> <button class="sm" data-a="dxFor" data-v="' + esc(c.code) + '">غيّر</button> <button class="sm sec" data-a="dxClear">إزالة</button>'
    + (bad.length || warn.length ? '' : '<div class="ok">✔ الخطة تحترم قيود النظام (السعرات والماكروز والكميات الواقعية).</div>')
    + bad.concat(warn).slice(0, 6).map(function (x) { return '<div class="warn">' + (x.lvl === 'bad' ? '⛔ ' : '⚠ ') + esc(x.msg) + '</div>'; }).join('') + info.slice(0, 2).map(function (x) { return '<div class="small">ℹ ' + esc(x.msg) + '</div>'; }).join('') + '</div>';
}
function dxCommit(id, P, extra) {
  var c = dxClient(); if (!c) { toast('اختر عميلاً أولاً'); return; }
  var res = DX.apply(id, ec(c), P, D, AD, E, Ath); if (!res.ok) { toast(res.blocks[0] || 'تعذّر التطبيق'); return; }
  if (res.confirm && res.confirm.length && !res.confirm.every(function (t, i) { return DXS.ok[i]; })) { toast('أكّد الموانع أولاً'); return; }
  if (c.plan && !confirm('سيُستبدل التوزيع الحالي ويُولَّد أسبوع جديد لـ' + (c.name || c.code) + '. المتابعة؟')) return;
  DX.commit(c, res); if (extra) Object.keys(extra).forEach(function (k) { c[k] = extra[k]; });
  DXS.ok = {};
  S.view = 'client'; S.cur = c.code;
  try { c.plan = DX.generate(ec(c), D, AD, E, Ath); } catch (e) { toast('تعذّر توليد الخطة: ' + e.message); return; }
  S.tab = 'plan'; S.page = 'sum'; c.updated = Date.now(); save();
  (A.pick ? A.pick(c.code) : Promise.resolve()).then(function () { S.tab = 'plan'; S.page = 'sum'; render(); toast('طُبِّق «' + DX.get(id).n + '» وولِّدت الخطة — راجعها وعدّل ما تشاء'); });
}
Object.assign(A, {
  lib: function () { S.view = S.view === 'lib' ? 'client' : 'lib'; render(); window.scrollTo(0, 0); },
  dxTab: function (v) { DXS.tab = v; DXS.ok = {}; main(); },
  dxOpen: function (v) { DXS.open = DXS.open === v ? '' : v; DXS.ok = {}; main(); },
  probOpen: function (v) { DXS.prob = DXS.prob === v ? '' : v; DXS.ok = {}; main(); },
  dxFor: function (v) { DXS.client = v; DXS.tab = 'diets'; S.view = 'lib'; render(); window.scrollTo(0, 0); },
  dxClear: function () { var c = cur(); if (!c || !c.diet) return; if (!confirm('إزالة النظام الغذائي من العميل؟ تبقى الخطة الحالية كما هي ويمكنك تعديلها.')) return; DX.clear(c); save(); main(); toast('أُزيل النظام'); },
  dxApply: function (v) { dxCommit(v, dxParamsOf(v)); },
  probApply: function (v) { var c = dxClient(); if (!c) return; var f = DX.solve(v, ec(c), D, AD, E, Ath); if (!f) return; var extra = {}; ['meals', 'life', 'budget'].forEach(function (k) { if (f[k] != null) extra[k] = f[k]; }); dxCommit(f.dietId, DX.pnorm(f.dietId, Object.assign(DX.defaults(f.dietId), f.P)), extra); }
});
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || !t.dataset) return;
  if (t.hasAttribute('data-dxcl')) { DXS.client = t.value; DXS.ok = {}; main(); return; }
  if (t.dataset.dxk !== undefined) { DXS.ok[t.dataset.dxk] = t.checked; main(); return; }
  if (t.dataset.dxp !== undefined && DXS.open) { var P = dxParamsOf(DXS.open); P[t.dataset.dxp] = t.type === 'number' ? parseFloat(t.value) : t.value; DXS.P[DXS.open] = DX.pnorm(DXS.open, P); DXS.ok = {}; main(); }
});
