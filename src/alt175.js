// ================= 1.75 (ر1أ — قرار المالك 2026-11-28، مستوحى من مراجعة Nutrimind) docs/ai_meal_assistant_plan.md البند 11
// 1) «جداول حصص بديلة»: بجانب «✦ اقترح الحصص» زر «⇄ جداول بديلة» يعرض 3–5 جداول لنفس الهدف (E.altSuggestions)، كلها داخل حدود الفحص؛
//    الاختيار يضبط c.baseCounts كما يفعل «اقترح الحصص». بلا اختيار لا يتغير شيء.
// 2) «الفعلي مقابل الاسمي»: العدّاد يعرض بجانب الاسمي (من الحصص) الفعلي (من الأصناف المختارة، day.actual)،
//    وخطوة ④ تنبّه إذا ابتعد الفعلي عن الهدف أكثر من 10% في يوم، مع الصنف الأكثر تسبباً. للأخصائي فقط.
var A175 = { open: 0, cache: null, key: '' };
var A175_G = ['نشويات', 'بقوليات', 'لحم قليل جداً', 'لحم قليل', 'لحم متوسط', 'لحم عالٍ', 'حليب خالٍ', 'حليب قليل', 'حليب كامل', 'خضار', 'فاكهة', 'دهون', 'سكريات'];
function a175List(c) {
  var k = JSON.stringify([c.weight, c.height, c.age, c.sex, c.goal, c.activity, c.kcalManual, c.macroMode, c.proGkg, c.fatPct, c.choPct, c.proPct, c.meals, c.conditions, c.allergens, c.diet && c.diet.id]);
  if (A175.key !== k) { try { A175.cache = E.altSuggestions(ec(c), D); } catch (e) { A175.cache = []; } A175.key = k; }
  return A175.cache || [];
}
function a175Panel(c, T) {
  var L = a175List(c), cur = (c.baseCounts && c.baseCounts.length === 13 ? c.baseCounts : null), curKey = cur ? cur.map(Number).join(',') : '';
  if (!L.length) return '<div class="a175 empty small">لا توجد جداول بديلة داخل حدود الفحص لهذا العميل.</div>';
  var row = function (a) {
    var on = curKey ? a.counts.join(',') === curKey : a.id === 'bal', dk = Math.round(a.kcal - T.kcal);
    var chips = a.counts.map(function (n, g) { return n ? '<span class="a175g">' + A175_G[g] + ' <b>' + n + '</b></span>' : ''; }).join('');
    return '<article class="a175c' + (on ? ' on' : '') + '"><div class="a175h"><b>' + esc(a.label) + '</b>' + (on ? '<em>المختار</em>' : '') + '</div><p class="small">' + esc(a.desc) + '</p>'
      + '<div class="a175m"><span>' + a.kcal + ' سعرة <small>(' + (dk > 0 ? '+' : '') + dk + ')</small></span><span>كارب ' + Math.round(a.ach[0]) + '</span><span>بروتين ' + Math.round(a.ach[1]) + '</span><span>دهون ' + Math.round(a.ach[2]) + ' جم</span></div>'
      + '<div class="a175gs">' + chips + '</div>' + (on ? '' : '<p class="genfoot"><button class="sm" data-a="alt175Pick" data-v="' + a.id + '">اختر هذا الجدول</button></p>') + '</article>';
  };
  return '<div class="a175" role="region" aria-label="جداول حصص بديلة"><p class="small">كلها تطابق الهدف (' + Math.round(T.kcal) + ' سعرة) ضمن حدود الفحص. الاختيار يغيّر الحصص فقط، والأصناف تُختار بعدها كالمعتاد.</p><div class="a175grid">' + L.map(row).join('') + '</div></div>';
}
if (typeof genEqv === 'function') genEqv = (function (f) { return function (c, g, T) {
  var h = f.apply(this, arguments); if (!c || c.kind === 'athlete') return h;
  var btn = '<button class="sec sm" data-a="genEqSug">✦ اقترح الحصص</button>';
  if (h.indexOf(btn + '</h3>') < 0) return h;
  var T0 = T || (function () { try { return E.targets(ec(c), D); } catch (e) { return null; } })(); if (!T0) return h;
  return h.replace(btn + '</h3>', btn + ' <button class="sec sm" data-a="alt175" aria-expanded="' + !!A175.open + '">⇄ جداول بديلة</button></h3>' + (A175.open ? a175Panel(c, T0) : ''));
}; })(genEqv);
A.alt175 = function () { A175.open = !A175.open; main(); };
A.alt175Pick = function (id) {
  var c = cur(); if (!c) return; var a = a175List(c).filter(function (x) { return x.id === id; })[0]; if (!a) return;
  c.baseCounts = a.counts.slice(); delete c.mealDist; save(); main(); toast('✓ اخترت جدول «' + a.label + '» — الأصناف تُختار بعده كالمعتاد');
};
// ---------- 2) الفعلي مقابل الاسمي
function a175Day(d, T) { if (!d.nominal || !d.actual) { try { E.dayStats(d, T, D); } catch (e) { } } var n = d.nominal || [0, 0, 0], a = d.actual || [0, 0, 0]; return { n: n, a: a, nk: n[0] * 4 + n[1] * 4 + n[2] * 9, ak: a[0] * 4 + a[1] * 4 + a[2] * 9 }; }
function a175Top(d) {      // الصنف الأكثر تسبباً في الفرق (فعلي − اسمي بالسعرات)
  var by = {}; D.foods.forEach(function (f) { by[f.n] = f; }); var best = null;
  (d.slots || []).forEach(function (s) { (s.lines || []).forEach(function (ln) { if (!ln || ln.missing || !(ln.e > 0)) return; var f = by[ln.name]; if (!f || !E.lineMacros) return; var am = E.lineMacros(f, ln.e), ex = D.EX[ln.g] || [0, 0, 0];
    var dk = (am[0] - ln.e * ex[0]) * 4 + (am[1] - ln.e * ex[1]) * 4 + (am[2] - ln.e * ex[2]) * 9; if (!best || Math.abs(dk) > Math.abs(best.dk)) best = { n: ln.name, dk: Math.round(dk) }; }); });
  return best;
}
if (typeof g171Counter === 'function') g171Counter = (function (f) { return function (c) {
  var h = f.apply(this, arguments); if (!h || !c || !c.plan || !c.plan.days || !c.plan.targets) return h;
  var T = c.plan.targets, s = [0, 0, 0], n = 0; c.plan.days.forEach(function (d) { var x = a175Day(d, T); s[0] += x.a[0]; s[1] += x.a[1]; s[2] += x.a[2]; n++; }); if (!n) return h;
  var a = [s[0] / n, s[1] / n, s[2] / n], ak = a[0] * 4 + a[1] * 4 + a[2] * 9, vals = [ak, a[0], a[1], a[2]], tg = [T.kcal, T.cho, T.pro, T.fat], i = 0;
  return h.replace(/<i style="--w:/g, function (m) { var v = vals[i], t = tg[i++], r = t > 0 ? Math.abs(v - t) / t : 0; return '<small class="a175act ' + (r <= 0.05 ? 'ok' : r <= 0.1 ? 'warn' : 'bad') + '" title="الفعلي من الأصناف المختارة (متوسط الأيام)">فعلي ' + Math.round(v) + '</small>' + m; })
    .replace('aria-label="المخطط مقابل الهدف (متوسط الأيام)"', 'aria-label="المخطط مقابل الهدف (متوسط الأيام): الاسمي من الحصص، والفعلي من الأصناف"');
}; })(g171Counter);
function a175Warn(c) {
  var p = c.plan; if (!p || !p.days || !p.targets) return ''; var T = p.targets, out = [];
  p.days.forEach(function (d, i) { var x = a175Day(d, T), r = T.kcal > 0 ? (x.ak - T.kcal) / T.kcal : 0; if (Math.abs(r) > 0.1) { var t = a175Top(d); out.push('<li><b>' + esc((D.days && D.days[i]) || ('اليوم ' + (i + 1))) + ':</b> الفعلي ' + Math.round(x.ak) + ' سعرة (' + (r > 0 ? '+' : '') + Math.round(r * 100) + '% عن الهدف)' + (t && t.dk ? ' — أكثر سبب: «' + esc(t.n) + '» (' + (t.dk > 0 ? '+' : '') + t.dk + ' سعرة)' : '') + '</li>'); } });
  return out.length ? '<div class="warn a175w" role="note"><b>⚠ الفعلي يبتعد عن الهدف أكثر من 10%:</b><ul>' + out.join('') + '</ul><small>الحساب بالبدائل «اسمي» (متوسط المجموعة)، والفعلي من الأصناف نفسها. للأخصائي فقط.</small></div>' : '';
}
if (typeof genSend === 'function') genSend = (function (f) { return function (c) { var h = f.apply(this, arguments); if (!c || c.kind === 'athlete') return h; try { return a175Warn(c) + h; } catch (e) { return h; } }; })(genSend);
