// ================= 1.79 (ر4 = ذ2) المحرك الحسابي للاستراتيجية — docs/ai_meal_assistant_plan.md (البندان 5 و6)، اعتماد المالك 2026-11-28 («ابدأ ر4»)
// يطبّق «الفهم المعتمد» (c.ai176.parsed، من ر3 أو من الفهم المحلي) على الخطة الحالية بلا ذكاء اصطناعي:
//  - التناوب العادل على أيام كل توزيع، بلا تكرار في يومين متتاليين (القاعدتان 3 و4)، و«كل يوم» يثبت (5)، و«لا يجتمعان» (1)، و«بلا» يُستبدل.
//  - الطريقة: تبديل بالبدائل داخل الخانة نفسها؛ المجموعة نفسها = نفس الحصص حرفياً. وتبديل البروتين/النشويات بين مجموعتين يُحوَّل بالمكافئ
//    ثم يُوازن اليوم (نشويات/دهون بأنصاف الحصص) ولا يُقبل إلا إذا بقي اليوم داخل حدود الفحص (±5% سعرات وتفاوت الماكروز) أو لم يسؤ عمّا كان.
//  - الحساسية وعدم التحمل و«لا يحب» تغلب دائماً (القاعدة 10)، ولا صنف خارج القاعدة (12). المحرك المشترك (engine.js) لم يتغير.
//  - القاعدتان 8 (الصيام) و9 (الكارب سايكل) مؤجلتان بقرار المالك: تبقى حصص الصيام والأيام الحالية كما هي.
var S179 = { prev: null };
var S179_PRO = [2, 3, 4, 5, 6, 7, 8], S179_ST = [0, 1];
var S179_GL = { 0: 'نشويات', 1: 'بقوليات', 2: 'بروتين', 3: 'بروتين', 4: 'بروتين', 5: 'بروتين', 6: 'ألبان', 7: 'ألبان', 8: 'ألبان', 9: 'خضار', 10: 'فاكهة', 11: 'دهون', 12: 'سكريات' };
function s179Norm(s) { return String(s || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim(); }
function s179Hit(name, w, set) { if (set && set[name]) return true; return E.kwHit(s179Norm(name), s179Norm(w)); }
function s179Set(w) { var s = {}; ai176Match(w).forEach(function (n) { s[n] = 1; }); return s; }
// يوم ← التوزيع الذي يخصه (المختلف أولاً، وإلا الأساسي)
function s179GroupOf(m, d) { for (var i = 1; i < m.groups.length; i++) if (m.groups[i].days.indexOf(d) >= 0) return i; return 0; }
function s179DaysOf(m, gi) { if (gi) return m.groups[gi].days.slice().sort(); var o = {}; m.groups.forEach(function (g, i) { if (i) g.days.forEach(function (d) { o[d] = 1; }); }); return [0, 1, 2, 3, 4, 5, 6].filter(function (d) { return !o[d]; }); }
function s179Slot(day, ml, mi, nMeals) {      // خانة الخطة لوجبة المساعد: بالاسم، ثم بالترتيب إن تساوى العدد
  var n = s179Norm(ml.name), s = day.slots.filter(function (x) { return s179Norm(x.name) === n; })[0]; if (s) return s;
  return day.slots.length === nMeals ? day.slots[mi] : null;
}
function s179Chk(day, T, D0) {
  var n = day.nominal || [0, 0, 0], k = n[0] * 4 + n[1] * 4 + n[2] * 9, tol = D0.settings.tol || [10, 5, 5];
  return { k: T.kcal > 0 ? Math.abs(k - T.kcal) / T.kcal : 0, m: [Math.abs(n[0] - T.cho) - tol[0], Math.abs(n[1] - T.pro) - tol[1], Math.abs(n[2] - T.fat) - tol[2]] };
}
function s179Ok(c0, c1) { if (c1.k > Math.max(0.05, c0.k) + 1e-9) return false; for (var i = 0; i < 3; i++) if (c1.m[i] > Math.max(0, c0.m[i]) + 1e-9) return false; return true; }
function s179Txt(f, e, cl, units) { var t = E.lineText(f, e, cl.alias); return units === 'g' && f.gpe > 0 && !/\d\s*جم/.test(t) ? t + ' (' + Math.round(e * f.gpe / 5) * 5 + ' جم)' : t; }
// اختيار صنف لكلمة في خانة: المسموح للعميل فقط، ويناسب نوع الوجبة، والمحبوب أولاً، ويتنوع بين المرات
function s179Pick(w, tIdx, cx, bad, nth) {
  var L = ai176Match(w).map(function (n) { return cx.byName[n]; }).filter(function (f) { return f && cx.ok(f) && !cx.avoid[f.n] && !bad(f.n); });
  if (!L.length) return null;
  var mt = function (f) { try { return E.fmeta(f) || {}; } catch (e) { return {}; } }, cl = cx.client || {};
  var com = L.filter(function (f) { var t = mt(f); return cx.love[f.n] || !(t.x && !cl.exotic) && !((+cl.budget || 2) === 1 && t.cost >= 3); }); if (com.length) L = com;      // الشائع أولاً: لا أصناف غير مألوفة أو غالية إلا إن أحبها العميل
  L.sort(function (p, q) { return (+q.m[tIdx] || 0) - (+p.m[tIdx] || 0) || (cx.love[q.n] ? 1 : 0) - (cx.love[p.n] ? 1 : 0) || (mt(p).cost || 2) - (mt(q).cost || 2) || p.o - q.o; });
  var top = L.filter(function (f) { return +f.m[tIdx]; }); if (!top.length) top = L; var g0 = top[0].g; top = top.filter(function (f) { return f.g === g0; }).slice(0, 3); return top[(nth || 0) % top.length];      // التنوع داخل مجموعة الصنف الأول فقط
}
function s179Alt(g, tIdx, cx, bad, slot, d) {      // بديل من المجموعة نفسها لا يطابق كلمات الاستبعاد ولا يتكرر في الخانة
  var inS = {}; slot.lines.forEach(function (l) { inS[l.name] = 1; });
  var L = D.foods.filter(function (f) { return f.g === g && f.on !== false && cx.ok(f) && !cx.avoid[f.n] && !bad(f.n) && !inS[f.n] && +f.m[tIdx]; }).sort(function (p, q) { return (cx.love[q.n] ? 1 : 0) - (cx.love[p.n] ? 1 : 0) || p.o - q.o; });
  return L.length ? L[d % Math.min(3, L.length)] : null;
}
function s179Bal(day, slot, d0, D0, cl, units) {      // موازنة الفرق (كارب ثم دهون) بأنصاف حصص: الخانة نفسها أولاً ثم باقي اليوم. الدهون قد تصل صفراً (يُحذف سطر الزيت)، والنشويات لا تقل عن نصف حصة
  var adj = function (gs, delta, per, min) {
    var steps = Math.round(delta / per * 2) / 2; if (!steps) return;
    var all = [slot].concat(day.slots.filter(function (s) { return s !== slot; }));
    all.forEach(function (s) { s.lines.filter(function (l) { return !l.missing && !l.w179 && gs.indexOf(l.g) >= 0; }).forEach(function (l) {
      if (!steps) return; var f = E.byName(D0)[l.name]; if (!f) return; var ne = Math.max(min, l.e - steps), dd = l.e - ne; if (!dd) return; steps -= dd; l.e = ne; if (ne > 0) l.text = s179Txt(f, ne, cl, units); else l.drop179 = 1;
    }); s.lines = s.lines.filter(function (l) { return !l.drop179; }); });
  };
  adj([0], d0[0], 15, 0.5); adj([11], d0[2], 5, 0);
}
function s179Cap(f) { var mt = null; try { mt = E.fmeta(f); } catch (e) { } return mt && mt.mx > 0 && f.upe > 0 ? Math.max(0.5, Math.floor(mt.mx * 1.25 / f.upe * 2) / 2) : 99; }      // أقصى حصص واقعية للصنف (سقف المحرك نفسه في settleFat)
function s179Cat(g) { return g >= 2 && g <= 5 ? 'meat' : g >= 6 && g <= 8 ? 'milk' : g <= 1 ? 'st' : 'g' + g; }
// نقل بروتين سطرٍ (لحوم 2–5) إلى سطور لحوم في الوجبات الأخرى (الغداء ثم العشاء ثم غيرها) ضمن الكميات الواقعية؛ يعيد ما بقي (جم بروتين)
function s179Move(day, slot, ln, st) {
  var X = D.EX, pro = ln.e * X[ln.g][1], order = { L: 0, D: 1, B: 2, S: 3 };
  var tg = day.slots.filter(function (s) { return s !== slot && s.type !== 'S'; }).sort(function (p, q) { return order[p.type] - order[q.type]; });
  tg.forEach(function (s) { s.lines.forEach(function (t) {
    if (pro < 3.5 || t.missing || t.w179 || t.g < 2 || t.g > 5) return; var f = st.cx.byName[t.name]; if (!f) return;
    var add = Math.min(Math.floor((s179Cap(f) - t.e) * 2) / 2, Math.floor(pro / X[t.g][1] * 2) / 2); if (!(add >= 0.5)) return;
    t.e += add; t.text = s179Txt(f, t.e, st.cl, st.units); t.mv179 = 1; pro -= add * X[t.g][1];
  }); });
  return pro;
}
// لا حصة من هذا النوع في الوجبة: تُنقل حصة (أو نصف) من وجبة أخرى في اليوم نفسه، فيبقى مجموع اليوم كما هو (نشويات وفاكهة وخضار وألبان)
function s179Pull(st, day, slot, f, w) {
  var X = D.EX, k = S179_ST.indexOf(f.g) >= 0 || f.g === 10 ? 0 : f.g === 9 ? 0 : 1, cat = s179Cat(f.g), donor = null;
  day.slots.forEach(function (s) { if (s === slot) return; s.lines.forEach(function (l) { if (l.missing || l.w179 || s179Cat(l.g) !== cat || !(l.e >= 0.5)) return; if (!donor || l.e > donor.l.e) donor = { s: s, l: l }; }); });
  if (!donor) return 'لا حصة ' + (S179_GL[f.g] || '') + ' في هذه الوجبة ولا في باقي اليوم لـ«' + w + '»';
  var snap = day.slots.map(function (s) { return JSON.stringify(s.lines); }), c0 = s179Chk(day, st.T, D), n0 = (day.nominal || [0, 0, 0]).slice();
  var mv = Math.min(1, donor.l.e), fd = st.cx.byName[donor.l.name], ne = X[f.g][k] > 0 ? Math.max(0.5, Math.round(mv * X[donor.l.g][k] / X[f.g][k] * 2) / 2) : mv;
  donor.l.e -= mv; if (donor.l.e < 0.5) donor.s.lines.splice(donor.s.lines.indexOf(donor.l), 1); else if (fd) donor.l.text = s179Txt(fd, donor.l.e, st.cl, st.units);
  slot.lines.push({ g: f.g, name: f.n, e: ne, text: s179Txt(f, ne, st.cl, st.units), tier: st.cx.tierOf(f.n), bank: false, w179: 1 });
  E.dayStats(day, st.T, D); var n1 = day.nominal; s179Bal(day, slot, [n1[0] - n0[0], n1[1] - n0[1], n1[2] - n0[2]], D, st.cl, st.units); E.dayStats(day, st.T, D);
  if (s179Ok(c0, s179Chk(day, st.T, D))) { st.r.notes.push('ℹ نُقلت حصة ' + (S179_GL[f.g] || '') + ' من «' + donor.s.name + '» لـ«' + w + '»'); return ''; }
  day.slots.forEach(function (s, i) { s.lines = JSON.parse(snap[i]); }); E.dayStats(day, st.T, D);
  return '«' + w + '» يُخرج اليوم عن حدود الفحص، فبقي ما اختاره المحرك';
}
function s179Put(st, day, slot, f, w, primary) {      // يضع الصنف في الخانة؛ يعيد '' أو سبب التعذّر
  var cl = st.cl, T = st.T, X = D.EX, live = function (l) { return !l.missing && !l.w179; };
  var same = slot.lines.filter(function (l) { return live(l) && l.g === f.g; })[0];
  var cat = same ? null : slot.lines.filter(function (l) { return live(l) && s179Cat(l.g) === s179Cat(f.g); })[0];
  var role = same || cat ? null : (S179_PRO.indexOf(f.g) >= 0 ? S179_PRO : S179_ST.indexOf(f.g) >= 0 ? S179_ST : null);
  var ln = same || cat || (role && slot.lines.filter(function (l) { return live(l) && role.indexOf(l.g) >= 0; })[0]);
  if (!ln) return s179Pull(st, day, slot, f, w);
  var snap = day.slots.map(function (s) { return JSON.stringify(s.lines); }), c0 = s179Chk(day, T, D), n0 = (day.nominal || [0, 0, 0]).slice(), notes = [];
  if (same) { same.name = f.n; same.text = s179Txt(f, same.e, cl, st.units); same.tier = st.cx.tierOf(f.n); same.w179 = 1; delete same.bank; }
  else {
    // المكافئ بالبروتين (أو الكارب للنشويات)، بسقف الكمية الواقعية للصنف؛ ما زاد يبقى على الصنف الأصلي ثم يُنقل إن كان لحماً
    var k = S179_ST.indexOf(f.g) >= 0 ? 0 : 1, eq = ln.e * X[ln.g][k] / X[f.g][k], ne = Math.max(0.5, Math.min(Math.round(eq * 2) / 2, s179Cap(f))), rem = ne < eq - 0.25 ? Math.round(ln.e * (1 - ne / eq) * 2) / 2 : 0;
    if (rem >= 0.5) { var f0 = st.cx.byName[ln.name]; ln.e = rem; if (f0) ln.text = s179Txt(f0, rem, cl, st.units); slot.lines.push({ g: f.g, name: f.n, e: ne, text: s179Txt(f, ne, cl, st.units), tier: st.cx.tierOf(f.n), bank: false, w179: 1 }); }
    else { ln.g = f.g; ln.name = f.n; ln.e = ne; ln.text = s179Txt(f, ne, cl, st.units); ln.tier = st.cx.tierOf(f.n); ln.w179 = 1; delete ln.bank; }
  }
  // القاعدة 2: مصدر بروتين رئيسي واحد — لحوم أخرى بقيت في الوجبة تُنقل إلى الغداء/العشاء
  if (primary && S179_PRO.indexOf(f.g) >= 0) slot.lines.filter(function (l) { return live(l) && l.g >= 2 && l.g <= 5 && !s179Hit(l.name, w); }).forEach(function (l) {      // ما كان من النوع المطلوب نفسه (جبنة قريش مع «جبن») يبقى
    var left = s179Move(day, slot, l, st), f1 = st.cx.byName[l.name];
    if (left < 3.5) l.drop179 = 1; else { var e1 = Math.round(left / X[l.g][1] * 2) / 2; if (e1 < l.e) { l.e = e1; if (f1) l.text = s179Txt(f1, e1, cl, st.units); } notes.push('بقي «' + l.name + '» مع «' + w + '» لأن باقي الوجبات لا تتسع لبروتينه'); }
  });
  slot.lines = slot.lines.filter(function (l) { return !l.drop179; });
  E.dayStats(day, T, D); var n1 = day.nominal, dlt = [n1[0] - n0[0], n1[1] - n0[1], n1[2] - n0[2]];
  s179Bal(day, slot, dlt, D, cl, st.units); E.dayStats(day, T, D);
  var c1 = s179Chk(day, T, D); if (s179Ok(c0, c1)) { notes.forEach(function (x) { st.r.notes.push(x); }); return ''; }
  day.slots.forEach(function (s, i) { s.lines = JSON.parse(snap[i]); }); E.dayStats(day, T, D);      // تراجع في المكان نفسه (تبقى مراجع الخانات صالحة)
  return '«' + w + '» يُخرج اليوم عن حدود الفحص، فبقي ما اختاره المحرك';
}
// النواة: لا تلمس c.plan؛ تعيد خطة جديدة وتقريراً لكل يوم ووجبة
function s179Apply(c) {
  var m = c.ai176, P = m && m.parsed; if (!c.plan || !c.plan.days || !P || !P.res) return null;
  var plan = JSON.parse(JSON.stringify(c.plan)), T = plan.targets, cl = ec(c), cx = E.ctx(cl, D), res = P.res, byKey = {}, units = m.units || 'home';
  res.meals.forEach(function (x) { byKey[x.key] = x; });
  var gAvoid = (res.avoid || []).map(function (w) { return { w: w, s: s179Set(w) }; }), rep = [], nth = {};
  plan.days.forEach(function (day, d) {
    var gi = s179GroupOf(m, d), g = m.groups[gi], days = s179DaysOf(m, gi), pos = Math.max(0, days.indexOf(d)), out = { d: d, g: g.name, gi: gi, meals: [] };
    g.meals.forEach(function (ml, mi) {
      var M = byKey['g' + gi + 'm' + mi], r = { name: ml.name, st: 'none', items: [], notes: [] }; out.meals.push(r);
      if (!M || M.pattern === 'free' && !(M.always || []).length && !(M.avoid || []).length) { r.notes.push('ℹ بلا وصف: كما اختار المحرك'); return; }
      var slot = s179Slot(day, ml, mi, g.meals.length); if (!slot) { r.st = 'warn'; r.notes.push('الوجبة ليست في الخطة الحالية (غيّر عدد الوجبات ثم ولّد الخطة)'); return; }
      var tIdx = { B: 0, L: 1, D: 2, S: 3 }[slot.type] || 0, av = (M.avoid || []).map(function (w) { return { w: w, s: s179Set(w) }; }).concat(gAvoid);
      var bad = function (n) { return av.some(function (a) { return s179Hit(n, a.w, a.s); }); }, st = { tIdx: tIdx, cl: cl, cx: cx, T: T, units: units, r: r };
      var put = function (w, kind) {
        var key = gi + '|' + mi + '|' + w, f = s179Pick(w, tIdx, cx, bad, nth[key] || 0); nth[key] = (nth[key] || 0) + 1;
        if (!f) { r.notes.push(ai176Match(w).length ? '«' + w + '» مستبعد لهذا العميل (حساسية أو عدم تحمّل أو لا يحب)' : '«' + w + '» غير موجود في قاعدة الأصناف'); return; }
        var why = s179Put(st, day, slot, f, w, kind !== 'all'); if (why) r.notes.push(why); else r.items.push(f.n);
      };
      // التناوب العادل: الكلمات الصالحة فقط، والمؤشر = ترتيب اليوم بين أيام التوزيع، فلا يتكرر خيار في يومين متتاليين ما دام هناك خياران أو أكثر
      var rot = (M.rotation || []).filter(function (w) { return s179Pick(w, tIdx, cx, bad, 0); });
      (M.rotation || []).forEach(function (w) { if (rot.indexOf(w) < 0 && pos === 0) put(w, 'rot'); });      // سبب التعذّر يُذكر مرة في أول يوم
      if (M.pattern === 'fixed') rot.forEach(function (w) { put(w, 'fix'); }); else if (rot.length) put(rot[pos % rot.length], 'rot');
      (M.always || []).forEach(function (w) { put(w, 'all'); });
      // «بلا» و«لا يجتمعان»: ما بقي في الخانة ويخالف يُستبدل ببديل من مجموعته
      var swap = function (l, why) { var f = s179Alt(l.g, tIdx, cx, function (n) { return bad(n) || (M.notTogether || []).some(function (pr) { return pr.some(function (w) { return s179Hit(n, w); }); }); }, slot, d); if (!f) { r.notes.push(why + ': لا بديل مناسب'); return; } r.notes.push('ℹ ' + why + ': «' + l.name + '» ← «' + f.n + '»'); l.name = f.n; l.text = s179Txt(f, l.e, cl, units); l.tier = cx.tierOf(f.n); l.w179 = 1; delete l.bank; };
      slot.lines.forEach(function (l) { if (!l.missing && !l.w179 && bad(l.name)) swap(l, 'بلا'); });
      (M.notTogether || []).forEach(function (pr) {
        if (pr.length < 2) return; var a = slot.lines.filter(function (l) { return !l.missing && s179Hit(l.name, pr[0]); })[0], b = slot.lines.filter(function (l) { return !l.missing && l !== a && s179Hit(l.name, pr[1]); })[0];
        if (a && b) swap(b.w179 && !a.w179 ? a : b, 'لا يجتمع ' + pr[0] + ' و' + pr[1]);
      });
      slot.edited = true; if (slot.meal && slot.lines.some(function (l) { return l.w179; })) slot.meal = '';
      r.st = r.notes.some(function (x) { return x.charAt(0) !== 'ℹ'; }) ? 'warn' : 'ok';      // ℹ = معلومة (نقل/استبدال تم)، وغيرها = تعذّر
    });
    E.dayStats(day, T, D); var ck = s179Chk(day, T, D); out.kcal = Math.round(day.nominal[0] * 4 + day.nominal[1] * 4 + day.nominal[2] * 9); out.errK = Math.round(ck.k * 1000) / 10; rep.push(out);
  });
  if (units === 'g') plan.days.forEach(function (day) { day.slots.forEach(function (s) { s.lines.forEach(function (l) { var f = !l.missing && !l.w179 && E.byName(D)[l.name]; if (f) l.text = s179Txt(f, l.e, cl, 'g'); }); }); });
  plan.days.forEach(function (day) { day.slots.forEach(function (s) { s.lines.forEach(function (l) { if (l.w179) { l.manual = true; delete l.w179; l.ai = 1; } if (l.mv179) { l.manual = true; delete l.mv179; } }); }); });
  try { plan.quality = E.planQuality(plan, D); } catch (e) { }
  plan.ai179 = { at: Date.now(), prov: P.prov || 'local' }; return { plan: plan, rep: rep, T: T };
}
// فهم محلي بلا ذكاء اصطناعي (احتياطي): الكلمات الموجودة في القاعدة من الوصف، و«يتنوع/بين» = تناوب، و«مع» = كل يوم، و«بلا/بدون» = استبعاد
function s179Local(c) {
  var m = ai176Of(c), meals = [];
  ai176Keyed(c).forEach(function (k) {
    var t = String(k.desc || ''); if (!t.trim()) return;
    var seg = function (re) { var x = t.match(re); return x ? x[1] : ''; }, words = function (s) { return s.split(/[\s،,]+/).map(function (w) { return w.replace(/^(وال|ال|و|ب)(?=..)/, ''); }).filter(function (w) { return w.length > 1 && ai176Match(w).length; }).filter(function (w, i, a) { return a.indexOf(w) === i; }); };
    var withS = seg(/مع\s+([^.،]+)/), noS = seg(/(?:بلا|بدون)\s+([^.،]+)/), main = t.replace(/مع\s+[^.،]+/, '').replace(/(?:بلا|بدون)\s+[^.،]+/, '');
    var rot = words(main), alw = words(withS), avd = noS ? noS.split(/[\s،,]+/).filter(function (w) { return w.length > 1; }).map(function (w) { return w.replace(/^(ال|و)(?=..)/, ''); }) : [];
    var pat = /يتنوع|تتنوع|يتناوب|تتناوب|بين|يوم.*يوم/.test(t) && rot.length > 1 ? 'rotate' : rot.length ? 'fixed' : 'free';
    meals.push({ key: k.key, pattern: pat, rotation: rot, always: alw, avoid: avd, notTogether: [], tags: [], understood: '' });
  });
  m.parsed = { at: Date.now(), prov: 'local', cached: 0, ok: 0, res: { meals: meals, avoid: [], prefer: [], understood: ['فهم محلي بلا ذكاء اصطناعي: الأصناف الموجودة في القاعدة من الوصف فقط'] } };
  return m.parsed;
}
// ---------- الواجهة
function s179View(c) {
  var V = S179.prev; if (!V) return '';
  var DN = D.days || ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  var rows = V.rep.map(function (o) {
    var day = V.plan.days[o.d];
    return '<tr><th scope="row">' + esc(DN[o.d] || ('اليوم ' + (o.d + 1))) + (o.gi ? '<br><small class="dim">' + esc(o.g) + '</small>' : '') + '<br><small class="s179k ' + (o.errK <= 5 ? 'k-ok' : 'k-bad') + '">' + o.kcal + ' سعرة</small></th>'
      + o.meals.map(function (r) {
        var slot = day.slots.filter(function (s) { return s179Norm(s.name) === s179Norm(r.name); })[0];
        return '<td class="s179c st-' + r.st + '"><b>' + esc(r.name) + '</b> <span class="s179b st-' + r.st + '">' + (r.st === 'ok' ? '✓ مطابقة' : r.st === 'warn' ? '⚠ تعذّر جزئياً' : 'كما هي') + '</span>'
          + (slot ? '<ul>' + slot.lines.filter(function (l) { return !l.missing; }).map(function (l) { return '<li' + (l.ai ? ' class="ai"' : '') + '>' + esc(l.text || l.name) + '</li>'; }).join('') + '</ul>' : '')
          + (r.notes.length ? '<small class="s179n">' + r.notes.map(function (x) { return x.charAt(0) === 'ℹ' ? '<span class="i">' + esc(x) + '</span>' : esc(x); }).join('<br>') + '</small>' : '') + '</td>';
      }).join('') + '</tr>';
  }).join('');
  var nWarn = 0, nOk = 0; V.rep.forEach(function (o) { o.meals.forEach(function (r) { if (r.st === 'warn') nWarn++; if (r.st === 'ok') nOk++; }); });
  return '<section class="s179" aria-labelledby="s179h"><h4 id="s179h">📅 معاينة الأسبوع من فهمك</h4>'
    + '<p class="small">✓ ' + nOk + ' وجبة مطابقة' + (nWarn ? '، و⚠ ' + nWarn + ' تعذّر فيها جزء (السبب تحتها)' : '') + '. الحصص والسعرات من المحرك كما هي، والأصناف المظللة من وصفك. هدف اليوم ' + Math.round(V.T.kcal) + ' سعرة.</p>'
    + '<div class="s179w"><table class="s179t"><tbody>' + rows + '</tbody></table></div>'
    + '<p class="genfoot"><button class="sec" data-a="s179X">إلغاء</button> <button data-a="s179Ok">✓ اعتمد الخطة</button></p><p class="small dim">الاعتماد يحفظ الخطة الحالية في الأرشيف أولاً، ثم تحل الجديدة محلها.</p></section>';
}
ai176Parsed = (function (f) { return function (c) {
  var h = f.apply(this, arguments); if (!h) return h;
  var P = c.ai176.parsed, btn = P.ok ? (c.plan && c.plan.days ? '<p class="genfoot"><button data-a="s179Go">⚙ طبّق على الخطة</button></p>' : '<p class="small warn">ولّد الخطة أولاً، ثم طبّق الفهم عليها.</p>') : '';
  return h.replace('<p class="small dim">التوزيع الحسابي من هذا الفهم يأتي في المرحلة التالية (ر4: المحرك الحسابي).</p>', '') .replace(/<\/section>$/, btn + s179View(c) + '</section>');
}; })(ai176Parsed);
// زر «افهم بلا ذكاء اصطناعي» بجانب «ولّد بالمساعد»
ai176Panel = (function (f) { return function (c) { var h = f.apply(this, arguments), x = /<button[^>]*data-a="ai176Gen"[^>]*>[^<]*ولّد/.exec(h); return !x || h.indexOf('data-a="s179Loc"') >= 0 ? h : h.slice(0, x.index) + '<button class="sec" data-a="s179Loc" title="بلا ذكاء اصطناعي: الأصناف المذكورة في الوصف فقط">⚡ افهم محلياً</button> ' + h.slice(x.index); }; })(ai176Panel);
A.s179Loc = function () { var c = cur(); if (!c) return; var p = s179Local(c); S179.prev = null; save(); main(); toast(p.res.meals.length ? '✓ فهمتُ ' + p.res.meals.length + ' وجبة محلياً — راجع ثم اعتمد' : 'لا أوصاف فيها أصناف من القاعدة'); };
A.s179Go = function () { var c = cur(); if (!c) return; var V = null; try { V = s179Apply(c); } catch (e) { toast('⚠ تعذّر التطبيق: ' + e.message); return; } if (!V) { toast('ولّد الخطة واعتمد الفهم أولاً'); return; } S179.prev = V; main(); };
A.s179X = function () { S179.prev = null; main(); };
A.s179Ok = function () {
  var c = cur(), V = S179.prev; if (!c || !V) return;
  (typeof arSave === 'function' ? arSave(c, 'ai179') : Promise.resolve()).catch(function () { }).then(function () {
    V.plan.client = c.plan.client; c.plan = V.plan; S179.prev = null; save(); main(); toast('✓ اعتُمدت الخطة من وصفك — الخطة السابقة في الأرشيف');
  });
};
S179.apply = s179Apply; S179.local = s179Local; if (typeof window !== 'undefined') window.S179 = S179;      // للاختبار والفحص
