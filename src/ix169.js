// ================= 1.69 (م1ب) ملف عميل متكامل — خطة العمل docs/work_plan_168.md (النصوص معتمدة من المالك 2026-11-27)
// 1) «الاستقبال والتاريخ» في «البيانات»: إجابات أسئلة الملف المتكامل في استبيان «زنها» (HForms.IXQ، معرّفات x_…) تظهر هنا تلقائياً
//    من c.hx.intake.cq، ويكمّلها الأخصائي أو يعدّلها في المكان نفسه (c.ix يغلب ما أرسله العميل). بيانات فقط: لا تغيّر أي حساب.
// 2) «ملاحظة زيارة منظمة» (ADIME) في «القياسات والتحاليل»: التقييم، والتشخيص الغذائي، والتدخل، وأهداف SMART، والمتابعة (c.med.adime).
var IX169 = { G: [['xhealth', 'من الصحة', ['x_intol', 'x_supp']]] };
function ixDefs() { return (window.HForms && HForms.IXQ) || {}; }
function ixGroups() { return IX169.G.concat(((window.HForms && HForms.IXS) || []).map(function (s) { return [s[0], s[1], s[2]]; })); }
function ixVals(c) {      // ما أرسله العميل ثم تعديلات الأخصائي
  var cq = (c.hx && c.hx.intake && c.hx.intake.cq) || {}, d = ixDefs(), o = {};
  Object.keys(d).forEach(function (k) { if (cq[k] != null && cq[k] !== '') o[k] = cq[k]; });
  var ix = c.ix || {}; Object.keys(ix).forEach(function (k) { if (d[k]) o[k] = ix[k]; });
  return o;
}
function ixShown(c, q) { return !(q.fem && c.sex !== 'أنثى'); }
function ixHas(v) { return !(v == null || v === '' || (Array.isArray(v) && !v.length)); }
function ixCount(c) { var d = ixDefs(), v = ixVals(c), n = 0, t = 0; ixGroups().forEach(function (g) { g[2].forEach(function (k) { var q = d[k]; if (!q || !ixShown(c, q)) return; t++; if (ixHas(v[k])) n++; }); }); return [n, t]; }
function ixField(c, q, v) {
  var id = 'ix-' + q.id, L = '<label for="' + id + '">' + esc(q.label) + (q.unit ? ' <small>(' + esc(q.unit) + ')</small>' : '') + '</label>';
  if (q.type === 'one' || q.type === 'scale') {
    var op = q.type === 'scale' ? ['1', '2', '3', '4', '5'] : q.opts;
    return '<div class="ixf">' + L + '<select id="' + id + '" data-ix="' + q.id + '"><option value="">—</option>' + op.map(function (o) { return '<option' + (String(v) === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' + (q.help && q.type === 'scale' ? '<small class="dim">' + esc(q.help) + '</small>' : '') + '</div>';
  }
  if (q.type === 'many') { var a = Array.isArray(v) ? v : []; return '<div class="ixf ixw"><span class="ixl" id="' + id + '">' + esc(q.label) + '</span><div class="ixchips" role="group" aria-labelledby="' + id + '">' + q.opts.map(function (o) { return '<label class="ixchip"><input type="checkbox" data-ixm="' + q.id + '" value="' + esc(o) + '"' + (a.indexOf(o) >= 0 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>'; }).join('') + '</div></div>'; }
  if (q.type === 'long') return '<div class="ixf ixw">' + L + '<textarea id="' + id + '" data-ix="' + q.id + '" rows="2">' + esc(v || '') + '</textarea></div>';
  if (q.type === 'num') return '<div class="ixf">' + L + '<input id="' + id + '" type="number" inputmode="decimal" step="0.5" data-ix="' + q.id + '" value="' + esc(v == null ? '' : v) + '"></div>';
  return '<div class="ixf">' + L + '<input id="' + id + '" data-ix="' + q.id + '" value="' + esc(v || '') + '"></div>';
}
function ixLine(c) { var n = ixCount(c); return n[0] ? n[0] + ' من ' + n[1] + ' مُجاب' + (c.hx && c.hx.intake && c.hx.intake.cq ? ' • من استبيان «زنها» ومن تعديلك' : '') : 'لم تُسجّل بعد — تصل من استبيان «زنها» أو اكتبها هنا'; }
function ixSection(c) {
  var d = ixDefs(), v = ixVals(c), s = document.createElement('details'), on = typeof cfsOpen === 'function' ? cfsOpen('intake') : true;
  s.className = 'cfsec t-violet ix169'; s.dataset.cfs = 'intake'; if (on) s.open = true;
  s.innerHTML = '<summary><span class="cfsic">' + IC('book') + '</span><span class="cfst"><b>الاستقبال والتاريخ</b><small class="ixsum">' + esc(ixLine(c)) + '</small></span><span class="cfschev" aria-hidden="true">' + IC('chevron') + '</span></summary><div class="cfsb">'
    + ixGroups().map(function (g) { var qs = g[2].map(function (k) { return d[k]; }).filter(function (q) { return q && ixShown(c, q); }); return qs.length ? '<fieldset class="ixg"><legend>' + esc(g[1]) + '</legend><div class="ixgrid">' + qs.map(function (q) { return ixField(c, q, v[q.id]); }).join('') + '</div></fieldset>' : ''; }).join('')
    + '<p class="small dim">بيانات للتقييم فقط، ولا تغيّر حساب السعرات أو الخطة.</p></div>';
  return s;
}
function ixEnhance(root) {
  var c = cur(); if (!c || c.kind === 'athlete' || !Object.keys(ixDefs()).length) return; if (root.querySelector('.ix169')) return;
  var h = root.querySelector('.cfsec[data-cfs="health"]'); if (!h) return; h.parentNode.insertBefore(ixSection(c), h.nextSibling);
}
function ixSave(c) { c.updated = Date.now(); persist(c); var sm = document.querySelector('.ix169 .ixsum'); if (sm) sm.textContent = ixLine(c); }
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || !t.dataset || (!t.dataset.ix && !t.dataset.ixm)) return; var c = cur(); if (!c) return; var d = ixDefs(); c.ix = c.ix || {};
  if (t.dataset.ixm) { var k = t.dataset.ixm, a = [].map.call(document.querySelectorAll('input[data-ixm="' + k + '"]:checked'), function (x) { return x.value; });
    if (t.checked && t.value === 'لا شيء') { a = ['لا شيء']; [].forEach.call(document.querySelectorAll('input[data-ixm="' + k + '"]'), function (x) { x.checked = x.value === 'لا شيء'; }); }
    else if (t.checked) { a = a.filter(function (x) { return x !== 'لا شيء'; }); var n = document.querySelector('input[data-ixm="' + k + '"][value="لا شيء"]'); if (n) n.checked = false; }
    c.ix[k] = a; return ixSave(c); }
  var q = d[t.dataset.ix]; if (!q) return; var v = t.value;
  if (q.type === 'num') { v = v === '' ? '' : +v; if (v !== '' && !(v > 0 && v < 500)) { toast('رقم غير مقبول'); return; } } else v = String(v).trim().slice(0, q.type === 'long' ? 1000 : 200);
  c.ix[q.id] = v; ixSave(c);
});
// ألا تتكرر إجابات الملف المتكامل في «الملاحظات» عند اعتماد عميل الحصص (لها قسمها)؛ وتبقى في الملاحظات لعميل الجرامات
if (typeof hxQA === 'function') hxQA = (function (f) { return function (q) { var r = f.apply(this, arguments); if (!q || q.sys === 'g') return r; var L = {}, d = ixDefs(); Object.keys(d).forEach(function (k) { L[d[k].label] = 1; }); return r.filter(function (x) { return !L[x[0]]; }); }; })(hxQA);
// ---------- 2) ملاحظة الزيارة المنظمة ADIME
var AD169 = [['a', 'التقييم (A)', 'ما لاحظته: القياسات، والالتزام، والأكل، والأعراض'], ['dx', 'التشخيص الغذائي (D)', 'المشكلة، وسببها، والدليل عليها'], ['i', 'التدخل (I)', 'ما اتفقتما عليه: تعديل الخطة، والتثقيف، والإحالة'], ['sm', 'أهداف SMART', 'هدف محدد وقابل للقياس ومؤقت'], ['me', 'المتابعة والتقييم (M/E)', 'ما ستقيسه في الزيارة القادمة']];
function adOf(c) { var m = medOf(c); m.adime = m.adime || []; return m.adime; }
function adHtml(c) {
  var L = adOf(c).slice().sort(function (p, q) { return p.d < q.d ? 1 : p.d > q.d ? -1 : (q.id > p.id ? 1 : -1); });
  var form = '<details class="ucard ad169f"' + (S.ad169 ? ' open' : '') + '><summary><b>＋ ملاحظة زيارة منظمة (ADIME)</b></summary><div class="row"><div><label for="ad_d">تاريخ الزيارة</label><input type="date" id="ad_d" value="' + medToday() + '"></div><div><label for="ad_nx">موعد المتابعة</label><input type="date" id="ad_nx"></div></div>'
    + AD169.map(function (f) { return '<label for="ad_' + f[0] + '">' + f[1] + '</label><textarea id="ad_' + f[0] + '" rows="2" placeholder="' + esc(f[2]) + '"></textarea>'; }).join('')
    + '<p class="two"><button data-a="adSave">حفظ الملاحظة</button></p></details>';
  var list = L.map(function (n) { return '<article class="ad169n"><header><b>' + esc(n.d) + '</b>' + (n.nx ? '<small>المتابعة: ' + esc(n.nx) + '</small>' : '') + '<button class="r sm" data-a="adDel" data-v="' + esc(n.id) + '" title="حذف الملاحظة" aria-label="حذف ملاحظة ' + esc(n.d) + '">×</button></header><dl>'
    + AD169.map(function (f) { return n[f[0]] ? '<dt>' + f[1] + '</dt><dd>' + esc(n[f[0]]) + '</dd>' : ''; }).join('') + '</dl></article>'; }).join('');
  return '<section class="ad169"><div class="hxtop"><h3>📝 ملاحظات الزيارات (' + L.length + ')</h3></div>' + form + (list || '<p class="small">لا ملاحظات بعد. سجّل ملاحظة لكل زيارة لتوثيق التقييم والخطة والمتابعة.</p>') + '</section>';
}
if (typeof medTab === 'function') medTab = (function (f) { return function (c) { var h = f.apply(this, arguments); try { return h + adHtml(c); } catch (e) { return h; } }; })(medTab);
A.adSave = function () {
  var c = cur(); if (!c) return; var n = { id: 'n' + Date.now().toString(36), d: ($('#ad_d') || {}).value || medToday(), nx: ($('#ad_nx') || {}).value || '' }, any = false;
  AD169.forEach(function (f) { var v = (($('#ad_' + f[0]) || {}).value || '').trim().slice(0, 2000); if (v) { n[f[0]] = v; any = true; } });
  if (!any) { toast('اكتب جزءاً واحداً على الأقل من الملاحظة'); return; }
  adOf(c).push(n); S.ad169 = false; persist(c); main(); toast('✓ حُفظت ملاحظة الزيارة');
};
A.adDel = function (id) { var c = cur(); if (!c || !confirm('حذف ملاحظة الزيارة؟')) return; var m = medOf(c); m.adime = adOf(c).filter(function (x) { return x.id !== id; }); persist(c); main(); };
(function () { if (window.MutationObserver) new MutationObserver(function () { var r = document.querySelector('main .cf151'); if (r) ixEnhance(r); }).observe(document.documentElement, { childList: true, subtree: true }); })();
