// ================= 1.52 (طلب المالك 2026-11-27): «قائمة الطعام» (توليد الخطة، الخطوة 5) بنمط محرر الخطة المرجعي (فيديو المالك)
// عمود رئيسي: بطاقة الوجبة (رأس بالاسم والسعرات وأزرار التوليد، أسطر الأصناف، تذييل ماكروز ملوّن)
// عمود جانبي ثابت «تحليل اليوم»: الطاقة مقابل الهدف، دائرة الماكروز، أشرطة الكارب/البروتين/الدهون مقابل الهدف، ودوائر صغيرة لكل وجبة (تفتحها).
// لا تغيير في المنطق: نفس عناصر الخطوة تُنقل كما هي (select[data-gp] وأزرار genAutoMeal/genAutoAll/genEm)، والأرقام من نفس الدوال (genDist/E.countsVals/E.targets).
var G152 = { col: { c: '#E9A23B', p: '#4F86E8', f: '#E0705A' } };
function g152Donut(v, r, w, center) {
  var C = 2 * Math.PI * r, tot = v.c * 4 + v.p * 4 + v.f * 9, off = 0, seg = '';
  if (tot > 0) [['c', v.c * 4], ['p', v.p * 4], ['f', v.f * 9]].forEach(function (s) { var L = C * s[1] / tot; if (L <= 0) return; seg += '<circle r="' + r + '" cx="0" cy="0" fill="none" stroke="' + G152.col[s[0]] + '" stroke-width="' + w + '" stroke-dasharray="' + L.toFixed(2) + ' ' + (C - L).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>'; off += L; });
  var s = r * 2 + w + 2;
  return '<svg viewBox="' + (-s / 2) + ' ' + (-s / 2) + ' ' + s + ' ' + s + '" width="' + s + '" height="' + s + '" aria-hidden="true"><g transform="rotate(-90)"><circle r="' + r + '" fill="none" stroke="var(--g5-track)" stroke-width="' + w + '"/>' + seg + '</g>' + (center || '') + '</svg>';
}
function g152Bar(lbl, cls, val, tg, unit) {
  var pc = tg > 0 ? Math.min(100, Math.round(val / tg * 100)) : 0, d = tg > 0 ? Math.round(val - tg) : 0, st = !tg ? '' : Math.abs(d) <= Math.max(5, tg * 0.05) ? 'ok' : d > 0 ? 'hi' : 'lo';
  return '<div class="g5row ' + cls + '"><div class="g5rl"><span class="g5dot"></span><b>' + lbl + '</b><span class="g5v"><b>' + Math.round(val) + '</b> / ' + Math.round(tg) + ' ' + unit + '</span>' + (st && st !== 'ok' ? '<em class="' + st + '">' + (d > 0 ? '+' : '') + d + '</em>' : '') + '</div><div class="g5bar"><i style="width:' + pc + '%"></i></div></div>';
}
function g152Side(c) {
  var g = genOf(c), md = genDist(c), sl = E.slots(+c.meals || 5, D), act = sl.filter(function (q) { return q.active && md[q.i].some(function (v) { return v > 0; }); }), mi = Math.min(g.em || 0, act.length - 1), T = null;
  try { T = E.targets(ec(c), D); } catch (e) { }
  var day = { c: 0, p: 0, f: 0, k: 0 }, per = act.map(function (q) { var v = E.countsVals(md[q.i], D); day.c += v.c; day.p += v.p; day.f += v.f; day.k += v.k; return v; });
  var tk = T ? T.kcal : 0, kp = tk ? Math.min(100, Math.round(day.k / tk * 100)) : 0;
  var center = '<text x="0" y="-4" text-anchor="middle" class="g5ck">' + Math.round(day.k) + '</text><text x="0" y="16" text-anchor="middle" class="g5cu">سعرة</text>';
  return '<div class="g5side" role="complementary" aria-label="تحليل اليوم">'
    + '<section class="g5card"><h4>تحليل اليوم</h4>'
    + '<div class="g5en"><div class="g5rl"><b>الطاقة</b><span class="g5v"><b>' + Math.round(day.k) + '</b> / ' + Math.round(tk) + ' سعرة</span></div><div class="g5bar en"><i style="width:' + kp + '%"></i></div></div>'
    + '<div class="g5mx">' + g152Donut(day, 46, 16, center) + '<div class="g5rows">'
    + g152Bar('كربوهيدرات', 'c', day.c, T ? T.cho : 0, 'جم') + g152Bar('بروتين', 'p', day.p, T ? T.pro : 0, 'جم') + g152Bar('دهون', 'f', day.f, T ? T.fat : 0, 'جم') + '</div></div>'
    + '<p class="g5note">من توزيع الحصص على الوجبات؛ الهدف من «الطاقة» و«الماكروز».</p></section>'
    + '<section class="g5card"><h4>الوجبات</h4><div class="g5meals">' + act.map(function (q, i) {
      var v = per[i]; return '<div class="g5m' + (i === mi ? ' on' : '') + '"' + (i === mi ? ' aria-current="true"' : '') + '>' + g152Donut(v, 17, 7, '') + '<b>' + esc(q.name) + '</b><small>' + Math.round(v.k) + ' سعرة</small></div>';      // للعرض فقط: التبديل من تبويبات الوجبات (بلا تكرار)
    }).join('') + '</div></section>'
    + '<div class="g5leg"><span class="c">كربوهيدرات</span><span class="p">بروتين</span><span class="f">دهون</span></div></div>';
}
function g152(c, html) {
  var t = document.createElement('div'); t.innerHTML = html;
  var box = t.querySelector('.geneqv'), dish = t.querySelector('.eqdish'), meals = t.querySelector('.eqmeals'); if (!box || !dish || !meals) return html;
  var h3 = meals.previousElementSibling, auto = h3 && h3.querySelector('.eqauto'), help = dish.nextElementSibling && dish.nextElementSibling.matches('p.small') ? dish.nextElementSibling : null;
  var on = meals.querySelector('.on'), mf = dish.querySelector('.mf');
  var card = document.createElement('section'); card.className = 'g5meal';
  card.innerHTML = '<div class="g5mh"><span class="g5mi">' + IC('utensils') + '</span><div class="g5mt"><b>' + (on ? on.textContent : '') + '</b><small>' + (dish.querySelectorAll('.eqli').length) + ' أصناف</small></div></div>';
  if (auto) { auto.className = 'g5auto'; card.querySelector('.g5mh').appendChild(auto); }
  dish.classList.add('g5dish'); card.appendChild(dish);
  if (mf) { mf.classList.add('g5mf'); [['kc', 'الطاقة'], ['cb', 'كربوهيدرات'], ['pr', 'بروتين'], ['ft', 'دهون']].forEach(function (x) { var s = mf.querySelector('.mc.' + x[0]); if (s) { s.setAttribute('data-l', x[1]); s.textContent = s.textContent.replace(/^[^\d\u0660-\u0669]+/, ''); } }); card.appendChild(mf); }
  if (help) { help.classList.add('g5help'); card.appendChild(help); }
  meals.classList.add('g5tabs'); meals.setAttribute('role', 'tablist');
  var main = document.createElement('div'); main.className = 'g5main'; main.appendChild(meals); main.appendChild(card);
  var grid = document.createElement('div'); grid.className = 'g5grid'; grid.appendChild(main); grid.insertAdjacentHTML('beforeend', g152Side(c));
  if (h3) { h3.after(grid); h3.classList.add('g5h'); } else box.prepend(grid);
  box.classList.add('g152');
  return t.innerHTML;
}
genEqv = (function (f) { return function (c, g) {
  var h = f.apply(this, arguments); if ((g && g.es) !== 5 || typeof isGlass !== 'function' || !isGlass()) return h;
  try { return g152(c, h); } catch (e) { return h; }
}; })(genEqv);
