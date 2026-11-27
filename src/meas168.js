// ================= 1.68 (م1) القياسات مكان واحد — خطة العمل docs/work_plan_168.md
// كل القياسات تُحفظ أصلاً في c.med.visits (زيارات «القياسات والتحاليل»، و«سجّل الحضور»، وإضافة قراءة من «نظرة عامة»)، وأوزان «زنها» في c.hx.weights،
// وc.weight نسخة «آخر وزن» يحدّثها كل مصدر منها. هنا نوحّد الواجهة:
//  1) «البيانات»: بعد أول قياس (زيارة أو «زنها») يصبح حقل الوزن «آخر وزن» للقراءة بمصدره وتاريخه مع «سجّل قياساً»؛ قبل ذلك يبقى حقل وزن البداية كما هو.
//  2) الوزن المستهدف وتاريخ الوصول في «الهدف والسعرات» (c.targetW، c.targetBy) — بيانات فقط، لا يغيّر أي حساب بعد (القاعدة السريرية تُعتمد لاحقاً).
//  3) تبويب «الملف الطبي» = «القياسات والتحاليل»، ونسبة الخصر إلى الطول تُحسب من آخر محيط خصر.
CF_L.med = 'القياسات والتحاليل';
CF_G.forEach(function (g) { if (g[0] === 'medical') g[1] = 'القياسات والتحاليل'; });
function m168Today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function m168Last(c) {      // آخر وزن من الزيارات أو «زنها» (الأحدث يغلب)
  var a = typeof ciWeights === 'function' ? ciWeights(c) : []; if (!a.length) return null; var x = a[a.length - 1];
  return { w: x.w, t: x.t, s: x.s };
}
function m168Fmt(t) { try { return new Date(t).toLocaleDateString('ar', { day: 'numeric', month: 'long' }); } catch (e) { return ''; } }
function m168Whtr(c) { var v = ((c.med || {}).visits || []).filter(function (x) { return x.waist != null; }).sort(function (p, q) { return p.d < q.d ? -1 : 1; }).pop(), h = +c.height; return v && h ? Math.round(v.waist / h * 100) / 100 : null; }
function m168Enhance(root) {
  var c = cur(); if (!c || root.getAttribute('data-m168') === c.code) return; root.setAttribute('data-m168', c.code);
  var wi = root.querySelector('input[data-f="weight"]'), last = m168Last(c);
  if (wi && last) {      // للقراءة: آخر وزن ومصدره، والتسجيل في مكانه الوحيد
    var box = document.createElement('div'); box.className = 'm168w'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'آخر وزن');
    box.innerHTML = '<b><bdi>' + num(last.w) + '</bdi> <small>كجم</small></b><small class="m168src">' + esc(last.s === 'زنها' ? 'سجّله العميل في «زنها»' : 'قياس زيارة') + ' • ' + esc(m168Fmt(last.t)) + '</small>' + (m168Whtr(c) != null ? '<small class="m168src">الخصر ÷ الطول: <bdi>' + num(m168Whtr(c)) + '</bdi></small>' : '') + '<button class="sec sm" data-a="mxOpen" data-v="w" data-add="1">＋ سجّل قياساً</button>';
    wi.style.display = 'none'; wi.setAttribute('aria-hidden', 'true'); wi.tabIndex = -1; wi.parentNode.insertBefore(box, wi.nextSibling);
    var lb = root.querySelector('label[for="' + wi.id + '"]'); if (lb && !/آخر/.test(lb.textContent)) lb.firstChild.nodeValue = 'آخر وزن (كجم) ';
  }      // بلا أي قياس: الحقل كما هو (وزن البداية)، ويصبح للقراءة فقط بعد أول قياس
  var g = root.querySelector('.cfsec[data-cfs="goal"] .cfsg'); if (g && !root.querySelector('.m168t')) {      // الوزن المستهدف وتاريخ الوصول
    var d = document.createElement('div'); d.className = 'row m168t';
    d.innerHTML = '<div><label for="f-targetW">الوزن المستهدف (كجم)</label><input id="f-targetW" type="number" min="25" max="300" step="0.5" data-f="targetW" value="' + esc(c.targetW == null ? '' : c.targetW) + '" placeholder="اختياري"></div>'
      + '<div><label for="f-targetBy">الوصول إليه بحلول</label><input id="f-targetBy" type="date" data-f="targetBy" value="' + esc(c.targetBy || '') + '"></div>'
      + '<div class="m168tg" aria-live="polite">' + m168Gap(c, last) + '</div>';
    g.parentNode.insertBefore(d, g.nextSibling);
  }
}
function m168Gap(c, last) {      // عرض حسابي فقط (الفرق والأسابيع)، بلا توصية سريرية
  var w = last ? last.w : +c.weight, t = +c.targetW; if (!w || !t) return '<small class="dim">اكتب الوزن المستهدف ليظهر الفرق والمدة.</small>';
  var diff = Math.round((t - w) * 10) / 10, wk = c.targetBy ? Math.max(0, Math.round((Date.parse(c.targetBy) - Date.now()) / (7 * 864e5))) : null;
  return '<small>الفرق: <b><bdi>' + (diff > 0 ? '+' : '') + num(diff) + '</bdi> كجم</b>' + (wk ? ' خلال <b>' + wk + '</b> أسبوعاً (<bdi>' + num(Math.round(Math.abs(diff) / wk * 100) / 100) + '</bdi> كجم/أسبوع)' : '') + '</small>';
}
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || !t.dataset) return; var c = cur(); if (!c) return;
  if (t.dataset.f === 'targetW' || t.dataset.f === 'targetBy') { var gp = document.querySelector('.m168tg'); if (gp) gp.innerHTML = m168Gap(c, m168Last(c)); }
});
(function () { if (window.MutationObserver) new MutationObserver(function () { var r = document.querySelector('main .cf151'); if (r) m168Enhance(r); }).observe(document.documentElement, { childList: true, subtree: true }); })();
