/* محرك Diet Pro Web — بلا اعتماد على Excel. يعمل في المتصفح وفي Node للاختبار.
   ما فيه: أهداف السعرات والماكروز (Mifflin) • محرك الحصص اليومية بأعداد صحيحة • توزيع الحصص على الوجبات بسقوف • مخطِّط الأسبوع (بنك الوجبات + أصناف القاعدة)
   • استبعاد الحساسية/الكلمات • قواعد سريرية بالكلمات • بدائل لكل سطر. */
(function (root) {
  'use strict';
  var E = {};
  var rnd = function (x) { return Math.floor(x + 0.5 + 1e-9); };               // ROUND في Excel (للموجب)
  var sum = function (a) { return a.reduce(function (p, c) { return p + c; }, 0); };
  E.rnd = rnd;
  // ================================================ الأهداف
  E.MODES = { auto_pf: 'تلقائي: بروتين g/kg + دهون %', auto_pc: 'تلقائي: بروتين g/kg + كربوهيدرات %', manual: 'يدوي (نسب مئوية)' };
  E.targets = function (c, D) {
    var S = D.settings, w = +c.weight, h = +c.height, a = +c.age, f = (D.settings.activity.filter(function (x) { return x[0] === c.activity; })[0] || [0, 1.2])[1];
    var goal = (S.goals.filter(function (x) { return x[0] === c.goal; })[0] || [0, 0])[1];
    var bmi = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0, ibw = (h - S.ibw_off) * (c.sex === 'أنثى' ? S.ibw_f : 1), adj = ibw + S.adj * (w - ibw);
    var bmr = c.sex === 'ذكر' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161, tdee = bmr * f, calc = tdee + goal;
    var kcal = +c.kcalManual > 0 ? +c.kcalManual : calc, mode = c.macroMode || 'auto_pf', pg = +c.proGkg || 1.8, cp = c.choPct == null ? 0.45 : +c.choPct, pp = c.proPct == null ? 0.25 : +c.proPct, fp = c.fatPct == null ? 0.3 : +c.fatPct;
    var cho, pro, fat;
    if (mode === 'manual') { cho = kcal * cp / 4; pro = kcal * pp / 4; fat = kcal * fp / 9; }
    else if (mode === 'auto_pc') { pro = pg * w; cho = kcal * cp / 4; fat = (kcal * (1 - cp) - pro * 4) / 9; }
    else { pro = pg * w; fat = kcal * fp / 9; cho = (kcal - pro * 4 - fat * 9) / 4; }
    var warn = [];
    if (kcal < bmr) warn.push('السعرات المستهدفة أقل من BMR');
    if (kcal < S.min_kcal) warn.push('السعرات أقل من الحد الأدنى المُعد (' + S.min_kcal + ')');
    if (tdee > 0 && (tdee - kcal) / tdee > S.max_def) warn.push('عجز مخطط مفرط');
    if (w > 0 && pro / w < S.min_pro) warn.push('البروتين أقل من الحد الأدنى g/kg'); else if (w > 0 && pro / w > S.max_pro) warn.push('البروتين أعلى من الحد المُعد');
    if (mode === 'manual' && Math.abs(cp + pp + fp - 1) > 0.001) warn.push('مجموع النسب لا يساوي 100%');
    if (cho < 0 || fat < 0) warn.push('قيمة ماكروز سالبة — راجع المدخلات');
    return { bmi: bmi, ibw: ibw, adjbw: adj, bmr: bmr, pal: f, tdee: tdee, goalAdj: goal, calc: calc, kcal: kcal, cho: cho, pro: pro, fat: fat, water: w * S.water / 1000, warnings: warn };
  };
  // ================================================ الوجبات النشطة وتوزيع السعرات
  E.slots = function (meals, D) { var p = D.settings.pct[String(meals)] || D.settings.pct['5']; return p.map(function (x, i) { return { i: i, pct: x, active: x > 0, type: D.settings.types[i], name: D.settings.slotNames[i] }; }); };
  E.capScale = function (kcal) { return Math.max(1, Math.round(kcal / 2300 * 100) / 100); };          // سقوف الوجبات مضبوطة لنحو 2200-2300 سعرة؛ تكبر بنسبة السعرات
  E.capTotals = function (day, meals, D, scale) {
    var sl = E.slots(meals, D), comp = D.comp[day], cap = []; scale = scale || 1;
    for (var g = 0; g < 13; g++) { var t = 0; sl.forEach(function (s) { if (s.active) t += Math.ceil(comp[g][s.i][1] * scale - 1e-9); }); cap.push(t); }
    return cap;
  };
  // ================================================ محرك الحصص اليومي (مرشحون أعداد صحيحة) — نسخة مطابقة لجدول «تركيبة الأسبوع»
  E.solveDay = function (T, o, D) {
    var X = D.EX, tol = o.tol || D.settings.tol, cap = o.cap, sw = Math.min(o.sweets || 0, cap[12]), base = o.base || { v: 3, f: 2, m: 1, e: 2 }, share = o.share == null ? 0.5 : o.share, lg = o.lgmax == null ? 3 : o.lgmax, tmax = o.tmax || 40;
    var best = null;
    for (var dv = 0; dv <= 1; dv++) for (var f = 1; f <= 4; f++) for (var m = 0; m <= 3; m++) for (var e = 0; e <= 3; e++) {
      var v = base.v + dv, rc = T.cho - sw * X[12][0] - v * X[9][0] - f * X[10][0] - m * X[7][0];
      var s = Math.min(cap[0], Math.max(0, rnd(rc / X[0][0])));
      var l = (rc / X[0][0] > cap[0] + 0.5) ? Math.min(lg, cap[1], Math.max(0, rnd((rc - cap[0] * X[0][0]) / X[1][0]))) : 0;
      var rp = T.pro - v * X[9][1] - m * X[7][1] - s * X[0][1] - e * X[4][1] - l * X[1][1], n = Math.max(0, rnd(rp / X[3][1])), a = Math.min(cap[2], rnd(n * share)), b = Math.min(cap[3], n - a);
      var rf = T.fat - (s * X[0][2] + l * X[1][2] + a * X[2][2] + b * X[3][2] + e * X[4][2] + m * X[7][2] + v * X[9][2] + f * X[10][2]), t = Math.min(tmax, cap[11], Math.max(0, rnd(rf / X[11][2])));
      var cnt = [s, l, a, b, e, 0, 0, m, 0, v, f, t, sw], ach = [0, 0, 0];
      for (var g = 0; g < 13; g++) for (var k = 0; k < 3; k++) ach[k] += cnt[g] * X[g][k];
      var err = [ach[0] - T.cho, ach[1] - T.pro, ach[2] - T.fat], ok = Math.abs(err[0]) <= tol[0] && Math.abs(err[1]) <= tol[1] && Math.abs(err[2]) <= tol[2];
      var vio = Math.max(0, Math.abs(err[0]) - tol[0]) / tol[0] + Math.max(0, Math.abs(err[1]) - tol[1]) / tol[1] + Math.max(0, Math.abs(err[2]) - tol[2]) / tol[2];
      var ov = Math.max(0, v - cap[9]) + Math.max(0, f - cap[10]) + Math.max(0, m - cap[7]) + Math.max(0, e - cap[4]);
      var score = ((ok && ov === 0) ? 0 : 100 + vio + 5 * ov) + Math.abs(err[0]) / tol[0] * 2 + Math.abs(err[1]) / tol[1] * 3 + Math.abs(err[2]) / tol[2] + 0.05 * (dv + Math.abs(f - base.f) + Math.abs(m - base.m) + Math.abs(e - base.e)) + 0.2 * l;
      if (!best || score < best.score) best = { counts: cnt, err: err, ok: ok && ov === 0, score: score, kcal: ach[0] * 4 + ach[1] * 4 + ach[2] * 9 };
    }
    return best;
  };
  // ================================================ توزيع حصص مجموعة على الوجبات: ملء متدرج بالأوزان ضمن السقوف ثم أكبر باقي (أعداد صحيحة)
  E.allocate = function (total, w, cap, mn, step) {
    step = step || 1; var n = w.length, base = [], capR = [], i;
    for (i = 0; i < n; i++) { base.push(Math.min(mn[i], cap[i])); capR.push(cap[i] - base[i]); }
    var S = Math.max(0, total - sum(base)), a = new Array(n).fill(0), wt = w.slice();
    for (var it = 0; it < 3; it++) {
      var sw = sum(wt) || 1e-6, rem = S - sum(a);
      a = a.map(function (x, j) { return Math.min(capR[j], x + rem * wt[j] / sw); });
      wt = w.map(function (x, j) { return a[j] < capR[j] - 1e-6 ? x : 0; });
    }
    var fl = a.map(function (x) { return Math.floor(x / step + 1e-6) * step; }), fr = a.map(function (x, j) { return (x - fl[j]) / step; }), room = fl.map(function (x, j) { return x + step <= capR[j] + 1e-6; });
    var k = Math.max(0, rnd((S - sum(fl)) / step)), idx = []; for (i = 0; i < n; i++) if (room[i]) idx.push(i);
    idx.sort(function (p, q) { return fr[q] - fr[p] || p - q; });
    var extra = new Array(n).fill(0); for (i = 0; i < k && i < idx.length; i++) extra[idx[i]] = step;
    return base.map(function (b, j) { return b + fl[j] + extra[j]; });
  };
  E.allocateDay = function (counts, day, meals, D, scale) {
    scale = scale || 1; var sl = E.slots(meals, D), comp = D.comp[day], out = sl.map(function () { return new Array(13).fill(0); }), short = [];
    var domG = -1; [2, 3, 4, 5].forEach(function (gq) { if (domG < 0 && counts[gq] > 0) domG = gq; });          // نوع لحم الغداء: الأقل دهناً المتاح
    for (var g = 0; g < 13; g++) {
      var w = sl.map(function (s) { var x = s.active ? comp[g][s.i][0] : 0; if (s.type === 'S' && x) x = g <= 9 ? x * 0.3 : x * 1.8; if (x && g >= 2 && g <= 5 && domG > 0) { if (s.type === 'L') x *= (g === domG ? 1 + E.PREF.lunchG2Boost : E.PREF.lunchOther); else if ((s.type === 'B' || s.type === 'D') && g === domG && domG === 2) x *= E.PREF.bdG2; } return x; }), c = sl.map(function (s) { return s.active ? Math.ceil(comp[g][s.i][1] * scale - 1e-9) + (g === domG && s.type === 'L' ? Math.round(E.PREF.lunchG2Boost * 3) : 0) + ((s.type === 'B' || s.type === 'D') && (g === 3 || g === 4) && domG === 2 ? E.PREF.bdCapBoost : 0) : 0; }), m = sl.map(function (s) { var mm = s.active ? comp[g][s.i][2] : 0; if (s.type === 'L' && g >= 2 && g <= 5 && domG > 0 && g !== domG) mm = 0; return mm; });
      var r = E.allocate(counts[g], w, c, m, 1); r.forEach(function (x, i) { out[i][g] = x; }); if (sum(r) < counts[g]) short.push([g, counts[g] - sum(r)]);
    }
    var L = -1; sl.forEach(function (s, i) { if (s.type === 'L' && s.active && L < 0) L = i; });
    if (L >= 0 && domG > 0) short.forEach(function (e) {   // ما لم تتسع له الوجبات الأخرى من لحوم غير مهيمنة يعود إلى الغداء (خلط محدود أفضل من فقدان البروتين)
      var gq = e[0]; if (gq >= 2 && gq <= 5 && gq !== domG) { var capL = Math.ceil(comp[gq][sl[L].i][1] * scale - 1e-9), add = Math.min(e[1], Math.max(0, capL - out[L][gq])); out[L][gq] += add; e[1] -= add; }
    }), short = short.filter(function (e) { return e[1] > 1e-9; });
    if (L >= 0) {                                       // قاعدة الغداء: لحم من مجموعة واحدة، والأولوية للأقل دهناً (شديد الانخفاض ثم القليل…)؛ تُبدَّل الحصص مع الوجبات الأخرى فتبقى مجاميع كل نوع ومجموع لحوم كل وجبة كما هي
      var dom = -1; [2, 3, 4, 5].forEach(function (gq) { if (dom < 0 && counts[gq] > 0) dom = gq; });
      if (dom > 0) for (var g3 = 2; g3 <= 5; g3++) {
        if (g3 === dom) continue;
        for (var guard = 0; guard < 30 && out[L][g3] >= 1; guard++) {
          var X = -1; for (var i2 = 0; i2 < sl.length; i2++) if (i2 !== L && sl[i2].active && out[i2][dom] >= 1 && (g3 !== 5 || out[i2][g3] + 1 <= Math.ceil(comp[g3][i2][1] * scale - 1e-9))) { X = i2; break; }          // التبديل لا يغيّر مجموع لحوم أي وجبة؛ نتجاوز سقف النوع إلا للحم عالي الدهن
          if (X < 0) break; out[L][g3] -= 1; out[X][g3] += 1; out[X][dom] -= 1; out[L][dom] += 1;
        }
      }
    }
    return { slots: sl, perSlot: out, short: short };
  };
  // ================================================ قيود العميل: الحساسية/الكلمات والقواعد السريرية
  var TIER = { 'تجنّب': 3, 'قلّل / وقّت': 2, 'داعم': 1 }, FOOD_CAT = [0, 0, 2, 2, 2, 2, 3, 3, 3, 4, 5, 6, 7];            // مجموعة ← فئة مدمجة: نشويات/لحوم/ألبان/خضار/فواكه/دهون/أخرى
  E.CATS = ['starch', null, 'meat', 'milk', 'veg', 'fruit', 'fat', 'other'];
  E.ctx = function (client, D) {
    var kws = [], diab = (client.conditions || []).some(function (c) { return c === 'سكري النوع الثاني' || c === 'مقاومة الإنسولين / ما قبل السكري'; });
    (client.allergens || []).forEach(function (lab) { var a = D.allergens.filter(function (x) { return x.label === lab; })[0]; if (a) kws = kws.concat(a.kw); });
    (client.keywords || []).forEach(function (k) { if (k) kws.push(k); });
    var excl = {}; (client.excludedFoods || []).forEach(function (n) { excl[n] = 1; });
    var love = {}, avoid = {}; (client.love || []).forEach(function (n) { love[n] = 1; }); (client.avoid || []).forEach(function (n) { avoid[n] = 1; });
    var cs = {}; (client.conditions || []).forEach(function (c) { cs[c] = 1; });
    var rules = D.rules.filter(function (r) { return cs[r.cond] || (r.cond === 'سكر (مشترك)' && diab); });
    var byName = {}; D.foods.forEach(function (f) { byName[f.n] = f; });
    var cx = {
      D: D, client: client, diab: diab, byName: byName, love: love, avoid: avoid,
      isExcluded: function (n) { return !!excl[n] || kws.some(function (k) { return n.indexOf(k) >= 0; }); },
      tierOf: function (n) { var t = 0, p = ' ' + n + ' '; rules.forEach(function (r) { if (p.indexOf(r.kw) >= 0) { var v = TIER[r.tier] || 0; if (v > t) t = v; } }); return t; },
      keywordsMatch: function (n) { return kws.some(function (k) { return n.indexOf(k) >= 0; }); }
    };
    cx.cache = {}; cx.ok = function (f) { if (cx.cache[f.n] === undefined) cx.cache[f.n] = !f.on || cx.isExcluded(f.n) || cx.tierOf(f.n) === 3 ? 0 : 1; return cx.cache[f.n]; };
    return cx;
  };
  E.SUB = { 0: [1], 1: [0], 2: [3, 4], 3: [2, 4], 4: [3, 2, 5], 5: [4, 3], 6: [7, 8], 7: [6, 8], 8: [7, 6], 12: [10, 0] };
  E.SPLIT = { 6: [10, 2], 7: [10, 2], 8: [10, 3] };         // حصة حليب ≈ حصة فاكهة + حصة لحم خفيف (15 كارب/7-8 بروتين)
  // ================================================ مساعدات الكميات والنصوص
  var FR = { 0.5: '½' };
  E.fmtQty = function (q, unit) {
    if (unit === 'جم' || unit === 'مل') return String(Math.max(5, Math.round(q / 5) * 5));
    q = Math.max(0.5, Math.round(q * 2) / 2); var w = Math.floor(q), f = q - w; return (w ? String(w) : '') + (f ? '½' : '');
  };
  E.qtyNum = function (q, unit) { if (unit === 'جم' || unit === 'مل') return Math.max(5, Math.round(q / 5) * 5); return Math.max(0.5, Math.round(q * 2) / 2); };
  E.lineText = function (f, e, al) {                      // al: أسماء مستعارة للأصناف (اسم العرض للعميل)
    var q = f.upe * e, txt = E.fmtQty(q, f.us), qn = E.qtyNum(q, f.us), u = qn >= 2 ? (f.up || f.us) : (f.us || f.up);
    return (txt + ' ' + u + ' ' + ((al && al[f.n]) || f.n)).replace(/\s+/g, ' ').trim();
  };
  E.lineMacros = function (f, e) { var qn = E.qtyNum(f.upe * e, f.us), k = f.units ? qn / f.units : 0; return f.mac.map(function (x) { return x * k; }); };
  var hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // ================================================ مخطِّط الأسبوع (حالة مشتركة + تخطيط وجبة واحدة قابل لإعادة الاستخدام عند التعديل اليدوي)
  E.POOLED = [['starch', 'نشويات', [0]], ['legumes', 'بقوليات', [1]], ['meat', 'لحوم', [2, 3, 4, 5]], ['milk', 'ألبان', [6, 7, 8]], ['veg', 'خضار', [9]], ['fruit', 'فاكهة', [10]], ['other', 'أخرى', [12]], ['fat', 'دهون', [11]]];
  E.pooled = function (g13) { return E.POOLED.map(function (p) { return p[2].reduce(function (a, g) { return a + (g13[g] || 0); }, 0); }); };
  E.adjustTargets = function (cur13, new8) {           // يحوّل تعديل عمود مدمج (لحوم/ألبان) إلى مجموعات فرعية: الزيادة للأخف دهوناً، والنقص من الأعلى دهوناً
    var out = cur13.slice();
    E.POOLED.forEach(function (p, i) {
      var delta = new8[i] - p[2].reduce(function (a, g) { return a + out[g]; }, 0); if (Math.abs(delta) < 1e-9) return;
      if (p[2].length === 1) { out[p[2][0]] = Math.max(0, out[p[2][0]] + delta); return; }
      var add = p[0] === 'meat' ? 3 : 7, rem = p[0] === 'meat' ? [5, 4, 3, 2] : [8, 6, 7];
      if (delta > 0) out[add] += delta; else { var need = -delta; rem.forEach(function (g) { var t = Math.min(out[g], need); out[g] -= t; need -= t; }); }
    });
    return out;
  };
  E.COLUMNS = [['starch', 'نشويات', [0]], ['legumes', 'بقوليات', [1]], ['vlean', 'لحوم شديدة الانخفاض بالدهون', [2]], ['lean', 'لحوم قليلة الدهون', [3]], ['medium', 'لحوم متوسطة الدهون', [4]], ['high', 'لحوم عالية الدهون', [5]], ['milk', 'ألبان', [6, 7, 8]], ['veg', 'خضار', [9]], ['fruit', 'فاكهة', [10]], ['other', 'أخرى', [12]], ['fat', 'دهون', [11]]];
  E.colCounts = function (g13) { return E.COLUMNS.map(function (c) { return c[2].reduce(function (a, g) { return a + (g13[g] || 0); }, 0); }); };
  E.adjustCols = function (cur13, new11) {            // كل نوع لحم عمود مستقل: التعديل يمسّ مجموعته فقط (لا خلط بين الأنواع). الألبان: الزيادة للقليل الدسم والنقص من الأعلى دهوناً
    var out = cur13.slice();
    E.COLUMNS.forEach(function (c, i) {
      var delta = new11[i] - c[2].reduce(function (a, g) { return a + out[g]; }, 0); if (Math.abs(delta) < 1e-9) return;
      if (c[2].length === 1) { out[c[2][0]] = Math.max(0, out[c[2][0]] + delta); return; }
      if (delta > 0) out[7] += delta; else { var need = -delta; [8, 6, 7].forEach(function (g) { var t = Math.min(out[g], need); out[g] -= t; need -= t; }); }
    });
    return out;
  };
  E.actualGroups = function (slot) { var g = new Array(13).fill(0); slot.lines.forEach(function (l) { if (!l.missing) g[l.g] += l.e; }); return g; };
  E.dayStats = function (day, T, D) {
    var nom = [0, 0, 0], act = [0, 0, 0], got = new Array(13).fill(0), by = {}; D.foods.forEach(function (f) { by[f.n] = f; });
    day.slots.forEach(function (s) { s.lines.forEach(function (ln) { if (ln.missing) return; got[ln.g] += ln.e; for (var k = 0; k < 3; k++) nom[k] += ln.e * D.EX[ln.g][k]; var f = by[ln.name]; if (f) E.lineMacros(f, ln.e).forEach(function (v, k) { act[k] += v; }); }); });
    day.nominal = nom; day.actual = act; day.got = got; day.okNominal = Math.abs(nom[0] - T.cho) <= D.settings.tol[0] && Math.abs(nom[1] - T.pro) <= D.settings.tol[1] && Math.abs(nom[2] - T.fat) <= D.settings.tol[2]; return day;
  };
  E.state = function (client, D, opt) {
    opt = opt || {}; var T = E.targets(client, D), cx = E.ctx(client, D), meals = +client.meals || 5;
    var bank = D.bank.filter(function (b) { return b.on && cx.isExcluded(b.n) === false && !(client.excludedMeals || []).includes(b.n); }).map(function (b) {
      var prof = new Array(13).fill(0), okk = true, ings = [];
      b.ing.forEach(function (ig) { var f = cx.byName[ig.n]; if (!f || !cx.ok(f) || cx.avoid[f.n]) okk = false; else { prof[f.g] += ig.e; ings.push({ f: f, e: ig.e }); } });
      return okk && ings.length ? { b: b, prof: prof, ings: ings } : null;
    }).filter(Boolean);
    return { client: client, D: D, T: T, cx: cx, meals: meals, bank: bank, useCount: {}, mealCount: {}, sweets: opt.sweets == null ? (cx.diab ? 0 : 1) : opt.sweets };
  };
  // تفضيلات الوجبات: الإفطار والعشاء من أجبان وألبان وبيض، والغداء لحم واحد غير مصنّع، والسناك فواكه مع دهون أو سكريات
  E.PREF = { share: 0.8, lunchG2Boost: 0, bdG2: 1, lunchOther: 0, bdCapBoost: 2, bdBank: 12 };      // تفضيلات المخطط (قابلة للضبط في الاختبارات)
  var R_BD = /بيض|جبن|لبن|زبادي|حليب|ريكوتا|قريش|موزاريلا|شيدر|فيتا/, R_PROC = /نقانق|سجق|مرتديلا|سلامي|بسطرمة|لانشون|هوت ?دوج|برجر|بيبروني|ناجتس|مقدد|لحم مصنّع/, R_MEAT = /دجاج|فراخ|لحم|ستيك|سمك|تونة|روبيان|ديك رومي|كبدة|كفتة|شاورما|غنم|عجل|بقري|فيليه|سلمون|هامور/;
  E.R_BD = R_BD; E.R_PROC = R_PROC;
  E.planSlot = function (st, d, si, sl, tg, used, surplus) {
    var cx = st.cx, D = st.D, client = st.client, T = st.T, tol = D.settings.tol;
        var cover = new Array(13).fill(0), lines = [], mealName = '', tIdx = { B: 0, L: 1, D: 2, S: 3 }[sl.type];
        // --- وجبة بنك مناسبة (تطابق على مستوى المجموعات)
        var bestB = null;
        if (!(client.noBank && client.noBank[sl.type]) && !st.noBank && sum(tg) > 0) st.bank.forEach(function (x) {
          if (!x.b.m[tIdx] || (st.mealCount[x.b.n] || 0) >= x.b.max) return;
          var cov = 0, over = 0, under = 0; for (var g = 0; g < 13; g++) { cov += Math.min(x.prof[g], tg[g]); over += Math.max(0, x.prof[g] - tg[g]); under += Math.max(0, tg[g] - x.prof[g]); }
          if (cov < 2 || over > (st.exact ? 1e-9 : 1)) return;
          var sc = 3 * cov - 7 * over - 0.5 * under + ((client.favMeals || []).includes(x.b.n) ? 3 : 0) - 1.2 * (st.mealCount[x.b.n] || 0) + 1.5 * ((hash(x.b.n) ^ Math.imul(d * 7 + si, 2654435761)) >>> 0) % 1000 / 1000;
          var meats = {}, nMeat = 0, protN = 0, bdN = 0, proc = false, allS = true, anyMain = false;
          x.ings.forEach(function (ig) { var gg = ig.f.g; if (gg >= 2 && gg <= 5 && !meats[ig.f.n]) { meats[ig.f.n] = 1; nMeat++; } if (gg >= 2 && gg <= 8) { protN += ig.e; if (R_BD.test(ig.f.n)) bdN += ig.e; } if (R_PROC.test(ig.f.n)) proc = true; if (gg !== 10 && gg !== 11 && gg !== 12) allS = false; if (gg <= 5) anyMain = true; });
          if (sl.type === 'L' && (nMeat > 1 || proc)) return;                                                   // الغداء: صنف لحم واحد وغير مصنّع
          if (sl.type === 'B' || sl.type === 'D') { var bds = protN ? bdN / protN : 1; sc += E.PREF.bdBank * bds - E.PREF.bdBank * 0.6 * (1 - bds); if (proc) sc -= 6; }                // فطور/عشاء: وجبات بيض وأجبان وألبان أولاً
          if (sl.type === 'S') { if (allS) sc += 2.5; if (anyMain) sc -= 2; }
          x.ings.forEach(function (ig) { if (cx.love[ig.f.n]) sc += 0.4; if (used[ig.f.n]) sc -= 2; });
          if (!bestB || sc > bestB.sc) bestB = { x: x, sc: sc };
        });
        if (bestB) {
          var x = bestB.x; mealName = x.b.n; st.mealCount[x.b.n] = (st.mealCount[x.b.n] || 0) + 1;
          x.ings.forEach(function (ig) { lines.push({ g: ig.f.g, name: ig.f.n, e: ig.e, text: E.lineText(ig.f, ig.e, client.alias), tier: cx.tierOf(ig.f.n), bank: true }); used[ig.f.n] = (used[ig.f.n] || 0) + 1; st.useCount[ig.f.n] = (st.useCount[ig.f.n] || 0) + 1; cover[ig.f.g] += ig.e; });
          for (var gg = 0; gg < 13; gg++) if (cover[gg] > tg[gg]) surplus[gg] += cover[gg] - tg[gg];      // فائض الوجبة يُخصم من الوجبات اللاحقة في اليوم نفسه
        }
        // --- تكميل الباقي بأصناف من القاعدة
        for (var g = 0; g < 13; g++) {
          var rem = Math.max(0, tg[g] - cover[g]); if (rem > 0 && surplus[g] > 0) { var tk = Math.min(surplus[g], rem); rem -= tk; surplus[g] -= tk; } rem = Math.round(rem * 2) / 2; if (!(rem > 0)) continue;
          if (sl.type === 'L' && g >= 2 && g <= 5) { var ex = lines.filter(function (l) { return l.g === g && !l.missing && !l.sub; })[0]; if (ex) { var fx = D.foods.filter(function (f) { return f.n === ex.name; })[0]; ex.e += rem; if (fx) ex.text = E.lineText(fx, ex.e, client.alias); continue; } }          // الغداء: صنف لحم واحد
          var cands = D.foods.filter(function (f) { return f.g === g && f.m[tIdx] && cx.ok(f) && !cx.avoid[f.n] && (st.useCount[f.n] || 0) < 12; });
          if (!cands.length) cands = D.foods.filter(function (f) { return f.g === g && cx.ok(f) && !cx.avoid[f.n]; });          // احتياطي: تجاهل ملاءمة نوع الوجبة
          cands.forEach(function (f) {
            var pref = 0; if (g >= 2 && g <= 8) { if (sl.type === 'B' || sl.type === 'D') { if (R_BD.test(f.n)) pref = 8; else if (g <= 5 && R_MEAT.test(f.n)) pref = -4; if (R_PROC.test(f.n)) pref -= 6; } else if (sl.type === 'L' && g <= 5 && R_PROC.test(f.n)) pref = -12; }
            f._s = pref + (cx.love[f.n] ? 4 : 0) - 0.0005 * f.o - 3 * (used[f.n] || 0) - 0.35 * (st.useCount[f.n] || 0) + 1.5 * ((hash(f.n) ^ Math.imul(d * 7 + si * 3 + g, 2654435761)) >>> 0) % 1000 / 1000;
          });
          cands.sort(function (p, q) { return q._s - p._s; });
          if (!cands.length) {
            var usedSub = false, okf = function (f, gg) { return f.g === gg && f.m[tIdx] && cx.ok(f) && !cx.avoid[f.n]; };
            (E.SUB[g] || []).forEach(function (gg) { if (usedSub) return; var cs = D.foods.filter(function (f) { return okf(f, gg); }); if (cs.length) { cs.sort(function (p, q) { return (cx.love[q.n] ? 4 : 0) - (cx.love[p.n] ? 4 : 0) || p.o - q.o; }); var f0 = cs[0]; lines.push({ g: gg, name: f0.n, e: rem, text: E.lineText(f0, rem, client.alias), tier: cx.tierOf(f0.n), bank: false, sub: true }); used[f0.n] = (used[f0.n] || 0) + 1; usedSub = true; } });
            if (!usedSub && E.SPLIT[g]) { var okAll = true, ls = []; E.SPLIT[g].forEach(function (gg) { var cs = D.foods.filter(function (f) { return okf(f, gg); }).sort(function (p, q) { return p.o - q.o; }); if (cs.length) ls.push({ g: gg, name: cs[0].n, e: rem, text: E.lineText(cs[0], rem, client.alias), tier: cx.tierOf(cs[0].n), bank: false, sub: true }); else okAll = false; }); if (okAll) { ls.forEach(function (l) { lines.push(l); }); usedSub = true; } }
            if (!usedSub) lines.push({ g: g, name: '—', e: rem, text: 'لا يوجد صنف مناسب (راجع الاستبعادات)', tier: 0, missing: true });
            continue;
          }
          var parts = rem >= 4 && cands.length > 1 && !(g >= 2 && g <= 5) ? [Math.ceil(rem / 2), Math.floor(rem / 2)] : [rem];    // اللحم صنف واحد دائماً parts = parts.filter(function (x) { return x > 0; });
          parts.forEach(function (e, pi) { var f = cands[pi]; lines.push({ g: g, name: f.n, e: e, text: E.lineText(f, e, client.alias), tier: cx.tierOf(f.n), bank: false }); used[f.n] = (used[f.n] || 0) + 1; st.useCount[f.n] = (st.useCount[f.n] || 0) + 1; });
        }
        lines.sort(function (p, q) { return FOOD_CAT[p.g] - FOOD_CAT[q.g] || p.g - q.g; });
        lines.sort(function (p, q) { return FOOD_CAT[p.g] - FOOD_CAT[q.g] || p.g - q.g; });
    return { si: sl.i, name: sl.name, type: sl.type, pct: sl.pct, kcal: Math.round(T.kcal * sl.pct), target: tg, meal: mealName, lines: lines, time: D.times ? D.times[sl.i] : '' };
  };
  E.baseSuggestion = function (client, D) {
    var st = E.state(client, D, {}), sc = E.capScale(st.T.kcal), cap = E.capTotals(0, st.meals, D, sc); return E.solveDay(st.T, { cap: cap, sweets: st.sweets, share: E.PREF.share }, D);
  };
  E.planWeek = function (client, D, opt) {
    opt = opt || {}; var st = E.state(client, D, opt), T = st.T, meals = st.meals, days = [], manual = client.baseCounts && client.baseCounts.length === 13 && client.baseCounts.some(function (x) { return +x > 0; });
    for (var d = 0; d < 7; d++) {
      var sc = E.capScale(T.kcal), cap = E.capTotals(d, meals, D, sc), sol;
      var mk = function (cn) { var ach = [0, 0, 0]; for (var g = 0; g < 13; g++) for (var k = 0; k < 3; k++) ach[k] += cn[g] * D.EX[g][k]; return { counts: cn, err: [ach[0] - T.cho, ach[1] - T.pro, ach[2] - T.fat], ok: null, score: 0, kcal: ach[0] * 4 + ach[1] * 4 + ach[2] * 9, manual: true }; },
        dco = client.dayCounts && client.dayCounts[d] && client.dayCounts[d].length === 13 && client.dayCounts[d].some(function (x) { return +x > 0; }) ? client.dayCounts[d].map(Number) : null;      // توزيع خاص بهذا اليوم (يتقدّم على الأساسي)
      if (dco) { sol = mk(dco); sol.day = true; } else if (manual) sol = mk(client.baseCounts.map(Number));
      else sol = E.solveDay(T, { cap: cap, sweets: st.sweets, share: E.PREF.share }, D);
      var al = E.allocateDay(sol.counts, d, meals, D, sc), used = {}, slots = [], surplus = new Array(13).fill(0);
      al.slots.forEach(function (sl, si) { if (!sl.active || !sum(al.perSlot[si])) return; slots.push(E.planSlot(st, d, si, sl, al.perSlot[si].slice(), used, surplus)); });
      days.push(E.dayStats({ day: d, name: D.days[d], solver: sol, counts: sol.counts, short: al.short, slots: slots }, T, D));
    }
    var base = E.baseSuggestion(client, D);
    return { client: client, targets: T, days: days, meals: meals, version: 1, generated: new Date().toISOString(), base: { counts: manual ? client.baseCounts.map(Number) : base.counts, manual: !!manual, auto: base.counts }, phr: opt.phrases || E.pickPhrases(D.phrases || [], D.tips || [], 9, opt.seed) };
  };
  E.regenSlot = function (plan, d, k, new11, D) {        // يغيّر المجموعات التي تغيّر عددها فقط؛ بقية الأصناف تبقى كما هي حرفياً (بما فيها التسميات والتقسيم)
    return E.regenSlotG(plan, d, k, E.adjustCols(E.actualGroups(plan.days[d].slots[k]), new11), D);
  };
  E.regenSlotG = function (plan, d, k, tg, D) {        // نفس المنطق لكن بأعداد المجموعات الثلاث عشرة صريحةً (يستعمله المساعد dt/hamed لتحديد حليب كامل الدسم مثلاً)
    var day = plan.days[d], slot = day.slots[k], st = E.state(plan.client, D, {}), used = {}; st.exact = true; st.noBank = true;
    plan.days.forEach(function (dy, di) { dy.slots.forEach(function (s2, kk) { if (dy === day && kk === k) return; if (s2.meal) st.mealCount[s2.meal] = (st.mealCount[s2.meal] || 0) + 1; s2.lines.forEach(function (l) { if (!l.missing) { st.useCount[l.name] = (st.useCount[l.name] || 0) + 1; if (dy === day) used[l.name] = (used[l.name] || 0) + 1; } }); }); });
    var cur = E.actualGroups(slot), changed = function (g) { return Math.abs(tg[g] - cur[g]) > 1e-9; }, keep = slot.lines.filter(function (l) { return l.missing ? false : !changed(l.g); }), dropped = slot.lines.filter(function (l) { return l.missing || changed(l.g); }), tg2 = tg.map(function (v, g) { return changed(g) ? v : 0; });
    keep.forEach(function (l) { st.useCount[l.name] = (st.useCount[l.name] || 0) + 1; used[l.name] = (used[l.name] || 0) + 1; });
    var sl = { i: slot.si, name: slot.name, type: slot.type, pct: slot.pct, active: true }, ns = sum(tg2) > 0 ? E.planSlot(st, d, slot.si, sl, tg2, used, new Array(13).fill(0)) : { lines: [] };
    var lines = keep.concat(ns.lines); lines.sort(function (p, q) { return FOOD_CAT[p.g] - FOOD_CAT[q.g] || p.g - q.g; });
    var bankLost = dropped.some(function (l) { return l.bank; });
    var out = { si: slot.si, name: slot.name, type: slot.type, pct: slot.pct, kcal: slot.kcal, target: tg, meal: bankLost ? '' : slot.meal, lines: lines, time: slot.time, edited: true }; if (slot.mealLabel && !bankLost) out.mealLabel = slot.mealLabel;
    day.slots[k] = out; day.edited = true; E.dayStats(day, plan.targets, D); return out;
  };
  // إعادة بناء يوم واحد بأعداد حصص صريحة (13 مجموعة) دون المساس ببقية الأيام: يُستعمل لتوزيع الحصص على الأيام. يحفظ أوقات الوجبات ويُبقي أصناف الأيام الأخرى كما هي حرفياً.
  E.regenDay = function (plan, d, counts, D) {
    if (!plan || !plan.days || !plan.days[d]) throw new Error('يوم غير موجود');
    if (!Array.isArray(counts) || counts.length !== 13 || !counts.every(function (x) { return isFinite(+x) && +x >= 0 && Math.abs(+x * 2 - Math.round(+x * 2)) < 1e-9; }) || !(sum(counts.map(Number)) > 0)) throw new Error('أعداد الحصص يجب أن تكون 13 رقماً غير سالب بمضاعفات 0.5 ومجموعها أكبر من صفر');
    var cn = counts.map(Number), st = E.state(plan.client, D, {}), T = plan.targets, meals = st.meals, old = plan.days[d];
    plan.days.forEach(function (dy, di) { if (di === d) return; dy.slots.forEach(function (s2) { if (s2.meal) st.mealCount[s2.meal] = (st.mealCount[s2.meal] || 0) + 1; s2.lines.forEach(function (l) { if (!l.missing) st.useCount[l.name] = (st.useCount[l.name] || 0) + 1; }); }); });
    var sc = E.capScale(T.kcal), al = E.allocateDay(cn.slice(), d, meals, D, sc), used = {}, slots = [], surplus = new Array(13).fill(0), ach = [0, 0, 0];
    al.slots.forEach(function (sl, si) { if (!sl.active || !sum(al.perSlot[si])) return; slots.push(E.planSlot(st, d, si, sl, al.perSlot[si].slice(), used, surplus)); });
    for (var g = 0; g < 13; g++) for (var k = 0; k < 3; k++) ach[k] += cn[g] * D.EX[g][k];
    slots.forEach(function (sl) { var o = old.slots.filter(function (x) { return x.si === sl.si; })[0]; if (o && o.time) sl.time = o.time; });
    var sol = { counts: cn.slice(), err: [ach[0] - T.cho, ach[1] - T.pro, ach[2] - T.fat], ok: null, score: 0, kcal: ach[0] * 4 + ach[1] * 4 + ach[2] * 9, manual: true, day: true };
    var day = E.dayStats({ day: d, name: D.days[d], solver: sol, counts: cn.slice(), short: al.short, slots: slots, custom: true }, T, D); plan.days[d] = day; return day;
  };
  // الحد الأقصى لكل مجموعة في يوم (من سقوف الوجبات): ما زاد عنه لا يُوضَع ويُسجَّل نقصاً في day.short. تقدير مبكّر للواجهة؛ النتيجة الفعلية بعد regenDay.
  E.dayCaps = function (plan, d, D) { var st = E.state(plan.client, D, {}); return E.capTotals(d, st.meals, D, E.capScale(plan.targets.kcal)).slice(); };
  // ---- تقسيم الحصة بين مصدرين، ودمجها، وتعديل حصص سطر، والأسماء المستعارة
  E.byName = function (D) { if (!D._by) { D._by = {}; D.foods.forEach(function (f) { D._by[f.n] = f; }); } return D._by; };
  var reline = function (line, plan, D) { var f = E.byName(D)[line.name]; if (f && !line.label) line.text = E.lineText(f, line.e, plan.client.alias); };
  E.setLineE = function (plan, d, k, li, e, D) {
    var slot = plan.days[d].slots[k], line = slot.lines[li]; e = Math.round(e * 2) / 2;
    if (!(e > 0)) slot.lines.splice(li, 1); else { line.e = e; line.manual = true; reline(line, plan, D); }
    slot.edited = true; E.dayStats(plan.days[d], plan.targets, D); return slot;
  };
  E.splitLine = function (plan, d, k, li, D) {
    var slot = plan.days[d].slots[k], line = slot.lines[li]; if (!line || line.missing || line.e < 1) return null;
    var half = Math.floor(line.e) / 2, inSlot = {}; slot.lines.forEach(function (l) { inSlot[l.name] = 1; });
    var alts = E.alternatives(line, slot.type, plan, D, 12).filter(function (a) { return !inSlot[a.name]; }), f = E.byName(D)[alts.length ? alts[0].name : line.name], cx = E.ctx(plan.client, D);
    line.e = line.e - half; line.manual = true; reline(line, plan, D);
    var nl = { g: f.g, name: f.n, e: half, text: E.lineText(f, half, plan.client.alias), tier: cx.tierOf(f.n), bank: false, split: true, manual: true }; slot.lines.splice(li + 1, 0, nl);
    slot.edited = true; E.dayStats(plan.days[d], plan.targets, D); return nl;
  };
  E.canMerge = function (slot, li) { var l = slot.lines[li]; for (var i = li - 1; i >= 0; i--) if (slot.lines[i].g === l.g && !slot.lines[i].missing) return i; return -1; };
  E.mergeLine = function (plan, d, k, li, D) {
    var slot = plan.days[d].slots[k], pi = E.canMerge(slot, li); if (pi < 0) return false;
    slot.lines[pi].e += slot.lines[li].e; slot.lines[pi].manual = true; reline(slot.lines[pi], plan, D); slot.lines.splice(li, 1); slot.edited = true; E.dayStats(plan.days[d], plan.targets, D); return true;
  };
  E.applyAlias = function (plan, D) { plan.days.forEach(function (d) { d.slots.forEach(function (s) { s.lines.forEach(function (l) { if (!l.missing) reline(l, plan, D); }); }); }); };
  E.pickPhrases = function (pool, tips, n, seed) {      // n أزواج (تحفيز، نصيحة) مختلفة؛ تتغير في كل توليد ولا تتكرر داخل الخطة
    var x = (seed == null ? (Date.now() ^ Math.floor(Math.random() * 4294967296)) : seed) >>> 0, rand = function () { x = (x + 0x6D2B79F5) >>> 0; var t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    var shuf = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var mot = shuf(pool.filter(function (p) { return p[0] === 'تشجيع'; }).map(function (p) { return p[1]; })), cats = ['نصيحة غذائية', 'ماء وترطيب', 'نشاط ونوم'], tp = {}, live = [], used = {}, out = [];
    cats.forEach(function (c) { tp[c] = shuf(pool.filter(function (p) { return p[0] === c; }).map(function (p) { return p[1]; })); if (tp[c].length) { live.push(c); used[c] = 0; } });
    if (!mot.length && !live.length) { var base = shuf((tips || []).filter(function (t) { return t[0] || t[1]; })); if (!base.length) base = [['', '']]; for (var q = 0; q < n; q++) out.push(base[q % base.length]); return out; }
    for (var i = 0; i < n; i++) { var m = mot.length ? mot[i % mot.length] : '', t = ''; if (live.length) { var c = live[i % live.length]; t = tp[c][used[c] % tp[c].length]; used[c]++; } out.push([m, t]); }
    return out;
  };
  E.ALT_REP = { starch: 0, milk: 7, meat: 3, veg: 9, fruit: 10, fat: 11 };
  E.altTable = function (plan, d, D, n) {                // بدائل كل فئة مستعملة في اليوم (كل بديل = حصة واحدة)
    var day = plan.days[d], g8 = E.pooled(day.got), lab = { starch: 'نشويات', milk: 'ألبان', meat: 'لحوم', veg: 'خضار', fruit: 'فاكهة', fat: 'دهون' }, idx = { starch: 0, milk: 3, meat: 2, veg: 4, fruit: 5, fat: 7 }, out = [];
    ['starch', 'milk', 'meat', 'veg', 'fruit', 'fat'].forEach(function (c) { if (g8[idx[c]] > 0 || (c === 'starch' && g8[1] > 0)) out.push([lab[c], E.alternatives({ g: E.ALT_REP[c], name: '', e: 1 }, 'L', plan, D, n || 5).map(function (a) { return { text: a.text, tier: a.tier }; })]); });
    return out;
  };

  // ================================================ إعدادات الحصص والبدائل (إضافة/حذف/تعديل أصناف القاعدة بدون تغيير ملف البيانات الأصلي)
  E.DEFAULT_COLORS = { starch: '#D9962B', legumes: '#8D6E63', meat: '#C0504D', milk: '#4A90D9', veg: '#3A9D5D', fruit: '#E8743B', fat: '#B8960C', other: '#8E5BA8' };
  E.groupKey = function (g) { for (var i = 0; i < E.POOLED.length; i++) if (E.POOLED[i][2].indexOf(g) >= 0) return E.POOLED[i][0]; return 'other'; };
  E.applyFoodSettings = function (D, baseFoods, S) {        // يبني D.foods من الأصل + تعديلات (حذف منطقي، تعديل كمية، أصناف مضافة) — تُطبَّق التعديلات والحذف على المضاف أيضاً
    S = S || {}; var over = S.over || {}, del = S.deleted || [], foods = baseFoods.map(function (f) { var c = Object.assign({}, f); c.mac = f.mac.slice(); c.m = f.m.slice(); return c; });
    (S.custom || []).forEach(function (c, i) {
      var X = D.EX[c.g]; foods.push({ n: c.n, g: c.g, us: c.us, up: c.up || c.us, upe: +c.upe, gpe: +c.gpe || 0, units: +c.upe, exv: 1, mac: [X[0], X[1], X[2], X[3]], cooked: '', m: c.m.slice(), veg: c.veg ? 1 : 0, vegan: c.vegan ? 1 : 0, on: 1, gi: null, o: 1 + i * 0.001, custom: true });
    });
    foods.forEach(function (f) {
      var o = over[f.n]; if (o) { ['upe', 'us', 'up', 'veg', 'vegan', 'gpe'].forEach(function (k) { if (o[k] !== undefined) f[k] = o[k]; }); if (o.m) f.m = o.m.slice(); if (f.custom && o.upe !== undefined) f.units = +o.upe; f.edited = true; }
      if (del.indexOf(f.n) >= 0) { f.on = 0; f.deleted = true; }
    });
    D.foods = foods; D._by = null; return foods;
  };
  // ---- بنك الوجبات: الأصل (data.json) + تعديلات {over:{id:{on,m,n,note,time,min,max,scal,ing}}, deleted:[ids], custom:[وجبات]} — لا يغيّر الأصل ولا خطط العملاء المحفوظة؛ يؤثر على الخطط التي تُولَّد بعده فقط
  E.validateMeal = function (D, b) {
    if (!b || typeof b !== 'object') return 'وجبة غير صالحة';
    if (typeof b.n !== 'string' || !b.n.trim()) return 'اسم الوجبة مطلوب';
    if (!Array.isArray(b.m) || b.m.length !== 4 || !b.m.every(function (x) { return x === 0 || x === 1 || x === true || x === false; })) return 'أقسام الوجبة (فطور/غداء/عشاء/سناك) غير صالحة';
    if (!Array.isArray(b.ing) || !b.ing.length) return 'الوجبة بلا مكوّنات';
    var foods = {}; D.foods.forEach(function (f) { if (f.on !== 0 && !f.deleted) foods[f.n] = 1; });
    for (var k = 0; k < b.ing.length; k++) { var i = b.ing[k]; if (!i || typeof i.n !== 'string' || !foods[i.n]) return 'المكوّن «' + (i && i.n) + '» غير موجود في قاعدة الأصناف'; if (!isFinite(+i.e) || !(+i.e > 0) || +i.e > 20) return 'حصص المكوّن «' + i.n + '» غير صالحة'; }
    var bad = ['min', 'max', 'scal'].filter(function (f) { return b[f] !== undefined && (!isFinite(+b[f]) || +b[f] < 0); }); if (bad.length) return 'قيمة ' + bad[0] + ' غير صالحة';
    return null;
  };
  E.buildMealBank = function (D, baseBank, S) {            // نقية: تُرجع {bank, issues} دون المساس بـD (يستعملها المحرر لمعرفة «الأصل» الذي يقارن به تعديلك)
    var M = (S && S.meals) || {}, over = M.over || {}, del = M.deleted || [], issues = [], ids = {}, cl = function (b) { var c = Object.assign({}, b); c.m = (b.m || []).map(function (x) { return x ? 1 : 0; }); c.ing = (b.ing || []).map(function (i) { return Object.assign({}, i); }); return c; };
    var bank = baseBank.map(cl); bank.forEach(function (b) { ids[b.id] = 1; });
    (M.custom || []).forEach(function (c) {
      var b = c && typeof c === 'object' ? cl(c) : null; if (!b || !b.id || ids[b.id]) { issues.push({ id: b && b.id, msg: 'معرّف وجبة مضافة مكرر أو ناقص' }); return; }
      b.custom = 1; if (b.on === undefined) b.on = 1; b.on = b.on ? 1 : 0; if (b.scal === undefined) b.scal = 1; if (b.min === undefined) b.min = 0; if (b.max === undefined) b.max = 4; if (b.note === undefined) b.note = ''; if (b.time === undefined) b.time = '';
      var er = E.validateMeal(D, b); if (er) { issues.push({ id: b.id, msg: er }); return; } ids[b.id] = 1; bank.push(b);
    });
    bank = bank.map(function (b) {
      var o = over[b.id]; if (!o || typeof o !== 'object') return b; var t = cl(b);
      if (o.on !== undefined) t.on = o.on ? 1 : 0; if (Array.isArray(o.m)) t.m = o.m.map(function (x) { return x ? 1 : 0; });
      ['n', 'note', 'time'].forEach(function (k) { if (typeof o[k] === 'string' && (k !== 'n' || o[k].trim())) t[k] = k === 'n' ? o[k].trim() : o[k]; });
      ['min', 'max', 'scal'].forEach(function (k) { if (o[k] !== undefined) t[k] = +o[k]; }); if (Array.isArray(o.ing)) t.ing = o.ing.map(function (i) { return Object.assign({}, i); });
      var er = E.validateMeal(D, t); if (er) { issues.push({ id: b.id, msg: 'تعديل مرفوض: ' + er }); return b; } t.edited = 1; return t;
    }).filter(function (b) { return del.indexOf(b.id) < 0; });
    return { bank: bank, issues: issues };
  };
  E.applyMealSettings = function (D, baseBank, S) { var r = E.buildMealBank(D, baseBank, S); D.bank = r.bank; D._mealIssues = r.issues; return r.bank; };
  E.mergeSettings = function (base, user) {                  // الأساس (من المدير) + طبقة المستخدم: المستخدم يتقدّم في الألوان والتعديلات، والحذف اتحاد، والمضاف مجموع بلا تكرار
    base = base || {}; user = user || {}; var m = { colors: Object.assign({}, base.colors, user.colors), over: {}, deleted: [], custom: [], logo: user.logo || base.logo || null, app: Object.assign({}, base.app, user.app), ai: Object.assign({}, user.ai, base.ai) }, seen = {};   // إعداد المساعد: ما يحدده المدير (الأساس) يغلب؛ وفي وضع المدير نفسه إعداداته هي المعتمدة
    Object.keys(base.over || {}).forEach(function (k) { m.over[k] = Object.assign({}, base.over[k]); }); Object.keys(user.over || {}).forEach(function (k) { m.over[k] = Object.assign({}, m.over[k] || {}, user.over[k]); });
    m.deleted = Array.from(new Set((base.deleted || []).concat(user.deleted || []))); (base.custom || []).concat(user.custom || []).forEach(function (c) { if (!seen[c.n]) { seen[c.n] = 1; m.custom.push(c); } });
    var ba = base.ath || {}, ua = user.ath || {}, aseen = {}; m.ath = { foods: [], hidden: Array.from(new Set((ba.hidden || []).concat(ua.hidden || []))) }; (ba.foods || []).concat(ua.foods || []).forEach(function (f) { if (!aseen[f.id]) { aseen[f.id] = 1; m.ath.foods.push(f); } }); var bu = base.ui || {}, uu = user.ui || {}; var thOk = function (t) { return t === 'linear' || t === 'legacy' ? t : 'glass'; }; m.ui = { lock: !!bu.lock, adminTheme: thOk(bu.theme), theme: bu.lock ? thOk(bu.theme) : (uu.theme || bu.theme || '') };   // المظهر: قفل المدير يتقدّم، وإلا اختيار المستخدم ثم افتراضي المدير
    var bm = base.meals || {}, um = user.meals || {}, mseen = {}; m.meals = { over: {}, deleted: Array.from(new Set((bm.deleted || []).concat(um.deleted || []))), custom: [] };   // الوجبات: تعديل المدير يصل للمستخدم، وتعديل المستخدم يتقدّم عنده ولا يصل للمدير (طبقتان منفصلتان)
    Object.keys(bm.over || {}).forEach(function (k) { m.meals.over[k] = Object.assign({}, bm.over[k]); }); Object.keys(um.over || {}).forEach(function (k) { m.meals.over[k] = Object.assign({}, m.meals.over[k] || {}, um.over[k]); });
    (bm.custom || []).concat(um.custom || []).forEach(function (c) { if (c && c.id && !mseen[c.id]) { mseen[c.id] = 1; m.meals.custom.push(c); } });
    return m;
  };
  E.validateCustom = function (D, c) {                      // يعيد نصاً بالخطأ أو '' إن كان صالحاً
    var n = String(c.n || '').trim(); if (!n) return 'اكتب اسم البديل';
    if (D.foods.some(function (f) { return f.n === n; })) return 'يوجد صنف بنفس الاسم';
    if (!(c.g >= 0 && c.g <= 12)) return 'اختر المجموعة';
    if (!(+c.upe > 0)) return 'اكتب كمية الحصة الواحدة (رقم أكبر من صفر)';
    if (!String(c.us || '').trim()) return 'اكتب وحدة القياس (كوب، ملعقة، جم…)';
    if (!c.m || !c.m.some(function (x) { return x; })) return 'اختر وجبة واحدة على الأقل';
    return '';
  };
  // ================================================ بدائل سطر (كل بديل = نفس عدد الحصص)
  E.POOLS = { 0: [0], 1: [1], 2: [2, 3, 4], 3: [2, 3, 4], 4: [2, 3, 4], 5: [2, 3, 4], 6: [6, 7, 8], 7: [6, 7, 8], 8: [6, 7, 8], 9: [9], 10: [10], 11: [11], 12: [12] };
  var SWEET = ['كيك', 'دونات', 'براونيز', 'بسكو', 'وافل', 'بانكيك', 'مافن', 'بوظة', 'جرانولا', 'كرواسون', 'عصير'];
  E.alternatives = function (line, slotType, plan, D, n) {
    var cx = E.ctx(plan.client, D), tIdx = { B: 0, L: 1, D: 2, S: 3 }[slotType], pool = E.POOLS[line.g], out = [], seen = {};
    D.foods.filter(function (f) { return pool.indexOf(f.g) >= 0 && f.m[tIdx] && cx.ok(f) && !cx.avoid[f.n] && f.n !== line.name && !(line.g <= 1 || line.g >= 10 && line.g <= 11 ? SWEET.some(function (w) { return f.n.indexOf(w) >= 0; }) : false); })
      .map(function (f) { return { f: f, t: cx.tierOf(f.n), s: (cx.love[f.n] ? 4 : 0) - 0.0005 * f.o }; })
      .sort(function (p, q) { return (p.t === 2) - (q.t === 2) || q.s - p.s; })
      .forEach(function (x) { if (out.length < (n || 8) && !seen[x.f.n]) { seen[x.f.n] = 1; out.push({ name: x.f.n, text: E.lineText(x.f, line.e, plan.client.alias), tier: x.t, g: x.f.g }); } });
    return out;
  };
  E.swap = function (line, alt, D, alias) { var f = D.foods.filter(function (x) { return x.n === alt.name; })[0]; line.name = f.n; line.g = f.g; line.text = E.lineText(f, line.e, alias); line.manual = true; delete line.label; return line; };
  if (typeof module !== 'undefined' && module.exports) module.exports = E; else root.DPEngine = E;
})(typeof window !== 'undefined' ? window : this);
