// ================= 1.51 (طلب المالك 2026-11-27): ترتيب «البيانات» في ملف العميل بنمط صفحة المعلومات المرجعية (فيديو المالك)
// أقسام قابلة للطي (أيقونة ملوّنة + عنوان + ملخص سطر + اكتمال) في عمود رئيسي، وعمود جانبي بالإجراء والنظام والمحرك والملاحظات.
// لا حقول جديدة ولا تغيير في الربط: نفس عناصر clientTab تُنقل كما هي داخل الأقسام (المعرّفات #tg #mcond #mstyle #mtailor باقية).
// للمظهر الزجاجي/الفاتح فقط، ولغير الرياضيين (صفحة الجرامات لها تخطيطها).
var CF151 = { k: 'zn_cfsec' };
function cfsOpen(id) { try { var o = JSON.parse(localStorage.getItem(CF151.k) || '{}'); return o[id] !== 0; } catch (e) { return true; } }
function cfsSave(id, on) { try { var o = JSON.parse(localStorage.getItem(CF151.k) || '{}'); o[id] = on ? 1 : 0; localStorage.setItem(CF151.k, JSON.stringify(o)); } catch (e) { } }
function cfsHas(v) { return v !== undefined && v !== null && String(v).trim() !== '' && !(Array.isArray(v) && !v.length); }
function cfsLine(c, id) {
  var j = function (a) { return a.filter(cfsHas).join(' • '); }, L = function (a) { return Array.isArray(a) ? a : []; };
  if (id === 'base') return j([c.sex, c.age ? c.age + ' سنة' : '', c.weight ? c.weight + ' كجم' : '', c.height ? c.height + ' سم' : '']);
  if (id === 'goal') { var t = c.plan && c.plan.target ? Math.round(c.plan.target.kcal || 0) : 0; return j([c.goal, c.meals ? c.meals + ' وجبات' : '', c.kcalManual ? c.kcalManual + ' سعرة (يدوي)' : '']); }
  if (id === 'health') { var cd = L(c.conditions).length, al = L(c.allergens).length; return (cd ? cd + ' حالة صحية' : 'بلا حالات صحية') + ' • ' + (al ? al + ' حساسية/استبعاد' : 'بلا حساسية'); }
  if (id === 'pref') return j([L(c.love).length ? L(c.love).length + ' مفضّل' : '', L(c.avoid).length ? L(c.avoid).length + ' يتجنبه' : '', L(c.favMeals).length ? L(c.favMeals).length + ' وجبة مفضّلة' : '', L(c.excludedMeals).length ? L(c.excludedMeals).length + ' مستبعدة' : '']) || 'لم تُحدد تفضيلات بعد';
  if (id === 'life') { var w = L(c.wdays).length, cu = { eg: 'مصري', sa: 'سعودي' }[c.cuisine] || 'مطبخ مختلط', lf = { home: 'طبخ في البيت', quick: 'وقت ضيق', travel: 'سفر' }[c.life] || ''; return j([w ? w + ' أيام تمرين' : 'بلا أيام تمرين', cu, lf]); }
  return '';
}
function cfsDone(c, id) {
  var f = id === 'base' ? ['name', 'phone', 'sex', 'age', 'weight', 'height'] : id === 'goal' ? ['activity', 'goal', 'meals'] : null;
  if (!f) return ''; var n = f.filter(function (k) { return cfsHas(c[k]); }).length;
  return '<span class="cfsdone' + (n === f.length ? ' full' : '') + '" title="الحقول المكتملة">' + (n === f.length ? IC('checkCircle') : '') + n + '/' + f.length + '</span>';
}
function cfsSec(c, id, ic, tone, title, nodes) {
  var on = cfsOpen(id), s = document.createElement('details'); s.className = 'cfsec t-' + tone; s.dataset.cfs = id; if (on) s.open = true;
  s.innerHTML = '<summary><span class="cfsic">' + IC(ic) + '</span><span class="cfst"><b>' + title + '</b><small>' + esc(cfsLine(c, id)) + '</small></span>' + cfsDone(c, id) + '<span class="cfschev" aria-hidden="true">' + IC('chevron') + '</span></summary><div class="cfsb"></div>';
  var b = s.querySelector('.cfsb'); nodes.forEach(function (n) { if (n) b.appendChild(n); }); return s;
}
function cfsSide(ic, title, nodes, cls) {
  var s = document.createElement('section'); s.className = 'cfside' + (cls ? ' ' + cls : ''); s.innerHTML = '<h3><span>' + IC(ic) + '</span>' + title + '</h3>';
  nodes.forEach(function (n) { if (n) s.appendChild(n); }); return s;
}
function cf151(c, html) {
  var t = document.createElement('div'); t.innerHTML = html;
  var q = function (s) { return t.querySelector(s); }, up = function (el, sel) { while (el && el.parentNode !== t) el = el.parentNode; return el; };
  var nm = q('[data-f="name"]'); if (!nm) return html;
  var r1 = up(nm), tg = q('#tg'), mx = q('details.fold[data-fold="mxOpen"]'), hl = up(q('#mcond')), pf = up(q('#f-love')), wd = q('.wdbox'), st = q('#mstyle');
  var nl = q('label[for="f-notes"]'), nt = q('#f-notes'), gb = nt && nt.nextElementSibling && nt.nextElementSibling.tagName === 'P' ? nt.nextElementSibling : null;
  var dx = q('.dxbox'), tc = q('.tcard'), pan = q('.panbox'), gback = q('.genback'), dl = [].slice.call(t.querySelectorAll('datalist'));
  if (!r1 || !tg || !hl || !pf || !st || !nt) return html;      // شكل غير متوقع: اعرض الصفحة كما هي
  // الصف الأول: الأساسية (6 حقول) | الهدف (النشاط، الهدف، السعرات اليدوية، الوجبات)
  var kids = [].slice.call(r1.children), r1b = r1.cloneNode(false); r1b.className = 'row'; kids.forEach(function (k) { var f = k.querySelector('[data-f]'); if (f && /^(activity|goal|kcalManual|meals)$/.test(f.dataset.f)) r1b.appendChild(k); });
  r1.classList.add('cfsg'); r1b.classList.add('cfsg');
  var main = document.createElement('div'); main.className = 'cfmain';
  main.appendChild(cfsSec(c, 'base', 'user', 'teal', 'البيانات الأساسية', [r1]));
  main.appendChild(cfsSec(c, 'goal', 'activity', 'blue', 'الهدف والسعرات', [r1b, tg, mx]));
  main.appendChild(cfsSec(c, 'health', 'heart', 'rose', 'الحالة الصحية والحساسية', [hl]));
  main.appendChild(cfsSec(c, 'pref', 'apple', 'green', 'التفضيلات الغذائية', [pf]));
  main.appendChild(cfsSec(c, 'life', 'utensils', 'amber', 'نمط الحياة والمطبخ', [wd, st]));
  var side = document.createElement('div'); side.className = 'cfaside'; side.setAttribute('role', 'complementary'); side.setAttribute('aria-label', 'إجراءات وملاحظات العميل');
  if (gb) { gb.className = 'cfgo'; side.appendChild(cfsSide('sparkles', 'الخطة', [gb], 'go')); }
  if (dx) side.appendChild(cfsSide('layers', 'النظام الغذائي', [dx]));
  if (tc) side.appendChild(cfsSide('sliders', 'محرك التوليد', [tc]));
  if (nl) nl.className = 'sr'; nt.rows = 4; nt.setAttribute('placeholder', 'اكتب ملاحظة عن العميل…'); side.appendChild(cfsSide('file', 'ملاحظات', [nl, nt]));
  if (pan) side.appendChild(cfsSide('package', 'المتوفر عند العميل', [pan]));
  var grid = document.createElement('div'); grid.className = 'cfgrid'; grid.appendChild(main); grid.appendChild(side);
  var out = document.createElement('div'); [].slice.call(t.childNodes).forEach(function (n) { if (n.nodeType === 1 && !n.matches('datalist') && n !== gback && !main.contains(n) && !side.contains(n) && n !== r1 && n !== tg && n !== mx && n !== hl && n !== pf && n !== wd && n !== st) out.appendChild(n); });
  dl.forEach(function (d) { out.appendChild(d); }); out.appendChild(grid); if (gback) out.appendChild(gback);
  return '<div class="cf151">' + out.innerHTML + '</div>';
}
clientTab = (function (f) { return function (c) {
  var h = f.apply(this, arguments); if (!c || c.kind === 'athlete' || typeof isGlass !== 'function' || !isGlass()) return h;
  try { return cf151(c, h); } catch (e) { return h; }
}; })(clientTab);
document.addEventListener('toggle', function (e) { var d = e.target; if (d && d.dataset && d.dataset.cfs) cfsSave(d.dataset.cfs, d.open); }, true);
// ملخص القسم واكتماله يتحدثان فور تعديل أي حقل (دون إعادة رسم الصفحة)
document.addEventListener('change', function (e) {
  var s = e.target && e.target.closest ? e.target.closest('.cf151 .cfsec') : null; if (!s) return;
  setTimeout(function () { var c = typeof cur === 'function' ? cur() : null; if (!c) return; var id = s.dataset.cfs, sm = s.querySelector('summary .cfst small'), dn = s.querySelector('summary .cfsdone');
    if (sm) sm.textContent = cfsLine(c, id); if (dn) dn.outerHTML = cfsDone(c, id); }, 0);
}, true);
