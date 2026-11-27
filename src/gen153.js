// ================= 1.53 (طلب المالك 2026-11-27): «قائمة الطعام» كل الوجبات في صفحة واحدة كما في فيديو المالك
// • كل وجبة بطاقة تُطوى (تُحفظ على الجهاز)، وسطر كل مجموعة يُسحب بمقبضه إلى وجبة أخرى (أو «انقل إلى…» للجوال ولوحة المفاتيح).
// • النقل يحرّك حصص تلك المجموعة في «توزيع الحصص» (c.mealDist) من الوجبة إلى الأخرى؛ مجموع اليوم لكل مجموعة ثابت، فيتحدث تركيب اليوم تلقائياً، مع «تراجع».
// • نفس عناصر الاختيار (select[data-gp] والتبادل المرن)، ووجبات بنك الوجبات لا تُنقل منها ولا إليها (تُعدّل في خطوة التوزيع).
// • نظام الجرامات: صفحة اليوم في «الخطة» (تعديل) بنفس الأسلوب — طيّ الوجبة وسحب الصنف بين وجبات اليوم ويُعاد حساب المجاميع (athPgDay).
var G153 = { fk: 'zn_g5fold', u: null, drag: null };
function g153Fold() { try { return JSON.parse(localStorage.getItem(G153.fk) || '{}'); } catch (e) { return {}; } }
function g153SetFold(k, on) { try { var o = g153Fold(); if (on) o[k] = 1; else delete o[k]; localStorage.setItem(G153.fk, JSON.stringify(o)); } catch (e) { } }
function g153Grip() { return '<span class="g5grip" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>'; }
function g153Lines(c, q, row, picks, cx) {
  var out = [], mt = 0, gm = -1; [2, 3, 4, 5].forEach(function (g) { var v = +row[g] || 0; mt += v; if (v > 0 && (gm < 0 || v > (+row[gm] || 0))) gm = g; });
  E.EQV_ORDER.forEach(function (gi) {
    var e = row[gi]; if (gi >= 2 && gi <= 5) { if (gi !== gm) return; e = mt; } if (!e) return;
    var cands = E.eqvCands(ec(c), gi, q.type, D, cx, e), key = q.i + '_' + gi, cur5 = picks[key] || '', f0 = cands.filter(function (f) { return f.n === cur5; })[0] || cands[0];
    out.push({ gi: gi, e: e, key: key, html: '<span class="eqgi">' + genGi(gi) + '</span><div class="eqlt"><b>' + (f0 ? esc(E.lineText(f0, e, c.alias)) : 'لا صنف مناسب') + '</b><small>' + e + ' ' + esc(gi >= 2 && gi <= 5 ? 'لحوم' : D.groups[gi]) + '</small></div><select data-gp="' + key + '" aria-label="صنف ' + esc(D.groups[gi]) + '"><option value="">تلقائي (يتنوّع يومياً)</option>' + cands.slice(0, 40).map(function (f) { return '<option' + (f.n === cur5 ? ' selected' : '') + '>' + esc(f.n) + '</option>'; }).join('') + (typeof flxBuilderOpts === 'function' ? flxBuilderOpts(c, q.i, gi, e) : '') + '</select>' });
  });
  return out;
}
function g153Meals(c, g) {
  var md = genDist(c), sl = E.slots(+c.meals || 5, D).filter(function (q) { return q.active; }), picks = c.eqvPicks || {}, cx = E.ctx(ec(c), D), fold = g153Fold(), bank = c.eqvBank || {};
  var nonEmpty = sl.filter(function (q) { return md[q.i].some(function (v) { return v > 0; }); });
  return sl.map(function (q) {
    var row = md[q.i], v = E.countsVals(row, D), L = g153Lines(c, q, row, picks, cx), bk = !!bank[q.i], fk = 's' + q.i, shut = !!fold[fk], ei = nonEmpty.indexOf(q);
    var others = sl.filter(function (o) { return o !== q && !bank[o.i]; });
    var mv = function (ln) { return bk || !others.length ? '' : '<select class="g5mv" data-g5mv="' + q.i + ',' + ln.gi + '" aria-label="انقل ' + esc(D.groups[ln.gi]) + ' إلى وجبة أخرى"><option value="">↔ انقل إلى…</option>' + others.map(function (o) { return '<option value="' + o.i + '">' + esc(o.name) + '</option>'; }).join('') + '</select>'; };
    return '<section class="g5meal' + (shut ? ' shut' : '') + (bk ? ' bank' : '') + '" data-g5slot="' + q.i + '" aria-label="' + esc(q.name) + '">'
      + '<div class="g5mh"><span class="g5mi">' + IC('utensils') + '</span><div class="g5mt"><b>' + esc(q.name) + '</b><small>' + (L.length ? L.length + ' مجموعات • ' + Math.round(v.k) + ' سعرة' : 'فارغة') + (bk ? ' • من بنك الوجبات' : '') + '</small></div>'
      + '<span class="g5acts">' + (L.length && ei >= 0 && !bk ? '<button class="g5ib" data-a="g153Auto" data-v="' + ei + '" title="ولّد هذه الوجبة تلقائياً" aria-label="ولّد ' + esc(q.name) + ' تلقائياً">' + IC('sparkles') + '</button>' : '')
      + '<button class="g5ib g5fold" data-a="g153Fold" data-v="' + fk + '" aria-expanded="' + !shut + '" aria-label="' + (shut ? 'افتح ' : 'اطوِ ') + esc(q.name) + '">' + IC('chevron') + '</button></span></div>'
      + '<div class="g5body"><div class="eqlines">' + L.map(function (ln) { return '<div class="eqli' + (bk ? '' : ' g5dr') + '"' + (bk ? '' : ' draggable="true"') + ' data-g5ln="' + q.i + ',' + ln.gi + '">' + (bk ? '' : g153Grip()) + ln.html + mv(ln) + '</div>'; }).join('') + '</div>'
      + (bk ? '' : '<div class="g5drop">' + IC('plus') + ' اسحب صنفاً من وجبة أخرى إلى هنا</div>') + '</div>'
      + '<div class="mf g5mf"><span class="mc kc" data-l="الطاقة">' + Math.round(v.k) + ' سعرة</span><span class="mc cb" data-l="كربوهيدرات">' + v.c + ' جم</span><span class="mc pr" data-l="بروتين">' + v.p + ' جم</span><span class="mc ft" data-l="دهون">' + v.f + ' جم</span></div></section>';
  }).join('');
}
// يحل محل تحويل 1.52 (بطاقة وجبة واحدة + تبويبات) — يبقى «تحليل اليوم»
if (typeof g152 === 'function') g152 = function (c, html) {
  var t = document.createElement('div'); t.innerHTML = html;
  var box = t.querySelector('.geneqv'), dish = t.querySelector('.eqdish'), meals = t.querySelector('.eqmeals'); if (!box || !meals) return html;
  var h3 = meals.previousElementSibling, auto = h3 && h3.querySelector('.eqauto'), help = dish && dish.nextElementSibling && dish.nextElementSibling.matches('p.small') ? dish.nextElementSibling : null;
  if (auto) { var one = auto.querySelector('[data-a="genAutoMeal"]'); if (one) one.remove(); auto.className = 'g5auto'; }
  var main = document.createElement('div'); main.className = 'g5main'; main.innerHTML = '<div class="g5list">' + g153Meals(c, genOf(c)) + '</div>';
  if (help) { help.classList.add('g5help'); help.textContent = '«تلقائي» يختار من الأصناف المناسبة للوجبة والعميل ويتنوّع كل يوم؛ اختيار صنف يثبّته كل الأيام. اسحب أي سطر بمقبضه إلى وجبة أخرى (أو «انقل إلى…») فتنتقل حصصه ويتحدث توزيع الحصص تلقائياً.'; main.appendChild(help); }
  meals.remove(); if (dish) dish.remove();
  var grid = document.createElement('div'); grid.className = 'g5grid'; grid.appendChild(main); grid.insertAdjacentHTML('beforeend', g152Side(c));
  if (h3) { h3.after(grid); h3.classList.add('g5h'); } else box.prepend(grid);
  box.classList.add('g152', 'g153'); return t.innerHTML;
};
// النقل: حصص المجموعة (اللحوم كلها كسطر واحد) من وجبة إلى أخرى
A.g153Move = function (from, gi, to) {
  var c = cur(); from = +from; gi = +gi; to = +to; if (!c || from === to || isNaN(to)) return; var bank = c.eqvBank || {};
  if (bank[from] || bank[to]) { toast('وجبات بنك الوجبات تُعدَّل من خطوة «التوزيع وبنك الوجبات»'); return; }
  var md = genDist(c), grp = gi >= 2 && gi <= 5 ? [2, 3, 4, 5] : [gi], moved = 0, pk = Object.assign({}, c.eqvPicks || {});
  G153.u = { code: c.code, md: c.mealDist ? JSON.stringify(c.mealDist) : null, pk: JSON.stringify(c.eqvPicks || {}) };
  grp.forEach(function (q) { var v = +md[from][q] || 0; if (!v) return; md[to][q] = Math.round(((+md[to][q] || 0) + v) * 2) / 2; md[from][q] = 0; moved += v; });
  if (!moved) { G153.u = null; return; }
  var k0 = from + '_' + gi, pick = pk[k0]; delete pk[k0]; if (pick && !grp.some(function (q) { return pk[to + '_' + q]; })) pk[to + '_' + gi] = pick;
  c.mealDist = md; c.eqvPicks = pk; save(); main();
  var sl = E.slots(+c.meals || 5, D), nm = function (i) { return (sl.filter(function (q) { return q.i === i; })[0] || {}).name || ''; };
  flxBar('نُقلت ' + moved + ' حصة ' + (grp.length > 1 ? 'لحوم' : D.groups[gi]) + ' من ' + nm(from) + ' إلى ' + nm(to) + '، وتحدّث توزيع الحصص', 'g153Undo');
};
A.g153Undo = function () { var u = G153.u, c = cur(); if (!u || !c || c.code !== u.code) return; if (u.md) c.mealDist = JSON.parse(u.md); else delete c.mealDist; c.eqvPicks = JSON.parse(u.pk); G153.u = null; save(); main(); var b = document.getElementById('flxbar'); if (b) b.className = ''; toast('تراجعنا عن النقل'); };
A.g153Fold = function (v) { var s = document.querySelector('[data-g5slot="' + String(v).slice(1) + '"]') || document.querySelector('.athed .mcard[data-afk="' + v + '"]'), shut = !(s && s.classList.contains('shut')); g153SetFold(v, shut); if (s) { s.classList.toggle('shut', shut); var b = s.querySelector('.g5fold'); if (b) b.setAttribute('aria-expanded', String(!shut)); } };
A.g153Auto = function (v) { var c = cur(); if (!c) return; genOf(c).em = +v; A.genAutoMeal(); };
// السحب والإفلات (حصص وجرامات)
document.addEventListener('dragstart', function (e) {
  var r = e.target.closest && e.target.closest('[data-g5ln],[data-afmv]'); if (!r) return;
  G153.drag = r.dataset.g5ln ? { k: 'eq', v: r.dataset.g5ln } : { k: 'ath', v: r.dataset.afmv };
  try { e.dataTransfer.setData('text/plain', G153.drag.v); e.dataTransfer.effectAllowed = 'move'; } catch (x) { }
  r.classList.add('g5drag'); document.documentElement.classList.add('g5dragging');
});
document.addEventListener('dragend', function () { G153.drag = null; document.documentElement.classList.remove('g5dragging'); [].forEach.call(document.querySelectorAll('.g5drag,.g5over'), function (x) { x.classList.remove('g5drag', 'g5over'); }); });
function g153Target(e) { var d = G153.drag; if (!d || !e.target.closest) return null; var m = d.k === 'eq' ? e.target.closest('.g153 .g5meal:not(.bank)') : e.target.closest('.athed .mcard[data-am]'); return m; }
document.addEventListener('dragover', function (e) { var m = g153Target(e); if (!m) return; e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch (x) { } [].forEach.call(document.querySelectorAll('.g5over'), function (x) { if (x !== m) x.classList.remove('g5over'); }); m.classList.add('g5over'); });
document.addEventListener('drop', function (e) {
  var m = g153Target(e), d = G153.drag; if (!m || !d) return; e.preventDefault(); var q = d.v.split(',');
  if (d.k === 'eq') A.g153Move(q[0], q[1], m.dataset.g5slot); else A.athMove(q[0], q[1], q[2], m.dataset.am);
});
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.g5mv && t.value !== '') { var q = t.dataset.g5mv.split(','); A.g153Move(q[0], q[1], t.value); }
  else if (t.dataset.afmvs && t.value !== '') { var a = t.dataset.afmvs.split(','); A.athMove(a[0], a[1], a[2], t.value); }
});
// ---- نظام الجرامات: صفحة اليوم في «الخطة» (وضع التعديل)
A.athMove = function (d, m, i, to) {
  var c = cur(); d = +d; m = +m; i = +i; to = +to; if (!c || !c.plan || m === to) return; var day = c.plan.days[d], it = day && day.meals[m] && day.meals[m].items[i]; if (!it || !day.meals[to]) return;
  G153.u = { code: c.code, ath: d, day: JSON.stringify(day) };
  day.meals[m].items.splice(i, 1); day.meals[to].items.push(it); day.meals[m].edited = true; day.meals[to].edited = true; Ath.dayStats(day); save(); main();
  flxBar('نُقل «' + (it.label || it.n) + '» (' + it.g + ' جم) من ' + mealNm(c.plan, { si: day.meals[m].si, name: day.meals[m].name }) + ' إلى ' + mealNm(c.plan, { si: day.meals[to].si, name: day.meals[to].name }) + '، وأُعيد حساب المجاميع', 'athMoveUndo');
};
A.athMoveUndo = function () { var u = G153.u, c = cur(); if (!u || !c || c.code !== u.code || u.ath == null) return; c.plan.days[u.ath] = JSON.parse(u.day); G153.u = null; save(); main(); var b = document.getElementById('flxbar'); if (b) b.className = ''; toast('تراجعنا عن النقل'); };
athPgDay = (function (f) { return function (c, p, di, edit) {
  var h = f.apply(this, arguments); if (!edit || typeof isGlass !== 'function' || !isGlass()) return h;
  try {
    var t = document.createElement('div'); t.innerHTML = h; var fold = g153Fold(), day = p.days[di], pg = t.querySelector('.pg'); if (pg) pg.classList.add('athed');
    [].forEach.call(t.querySelectorAll('.mcard'), function (mc, mi) {
      var fk = 'a' + day.meals[mi].si, shut = !!fold[fk], mh = mc.querySelector('.mh'), s = Ath.sum(day.meals[mi].items); mc.dataset.am = mi; mc.dataset.afk = fk; if (shut) mc.classList.add('shut');
      if (mh) { mh.insertAdjacentHTML('afterbegin', '<span class="g5mi">' + IC('utensils') + '</span>'); mh.insertAdjacentHTML('beforeend', '<span class="g5mk">' + day.meals[mi].items.length + ' أصناف • ' + Math.round(s.k) + ' سعرة</span><button class="g5ib g5fold" data-a="g153Fold" data-v="' + fk + '" aria-expanded="' + !shut + '" aria-label="' + (shut ? 'افتح' : 'اطوِ') + ' الوجبة">' + IC('chevron') + '</button>'); }
      var others = day.meals.map(function (m2, j) { return j === mi ? '' : '<option value="' + j + '">' + esc(mealNm(p, { si: m2.si, name: m2.name })) + '</option>'; }).join('');
      [].forEach.call(mc.querySelectorAll('tr'), function (tr) {
        var del = tr.querySelector('[data-a="athDel"]'); if (!del) return; var ii = del.dataset.i; tr.setAttribute('draggable', 'true'); tr.dataset.afmv = di + ',' + mi + ',' + ii; tr.classList.add('g5dr');
        var td = tr.querySelector('td.in'); if (td) { td.insertAdjacentHTML('afterbegin', g153Grip()); if (others) td.insertAdjacentHTML('beforeend', ' <select class="g5mv noprint" data-afmvs="' + di + ',' + mi + ',' + ii + '" aria-label="انقل الصنف إلى وجبة أخرى"><option value="">↔ انقل إلى…</option>' + others + '</select>'); }
      });
      var tb = mc.querySelector('table.at'); if (tb) tb.insertAdjacentHTML('afterend', '<div class="g5drop noprint">' + IC('plus') + ' اسحب صنفاً من وجبة أخرى إلى هنا</div>');
    });
    return t.innerHTML;
  } catch (e) { return h; }
}; })(athPgDay);
window.ZN_dist = function () { var c = cur(); return c ? genDist(c) : null; };      // للقراءة في الاختبارات
