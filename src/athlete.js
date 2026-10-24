/* نظام الرياضيين (بالجرام): أهداف حسب المرحلة ونوع اليوم، توزيع الماكروز على الوجبات، ومخطّط وجبات يحل جرامات مصادر البروتين/الكارب/الدهون. */
(function (root) {
  'use strict';
  var A = {}, r1 = function (x) { return Math.round(x * 10) / 10; }, num = function (v, d) { v = parseFloat(v); return isNaN(v) ? (d || 0) : v; };
  var hash = function (s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  A.DEFAULT_SCHEDULE = [['تدريب ثقيل', 75, '17:00'], ['تدريب متوسط', 60, '17:00'], ['راحة', 0, ''], ['تدريب ثقيل', 75, '17:00'], ['تدريب متوسط', 60, '17:00'], ['تدريب خفيف', 45, '17:00'], ['راحة', 0, '']].map(function (x) { return { type: x[0], min: x[1], time: x[2] }; });
  A.newAthlete = function (AD) { return { kind: 'athlete', sex: 'ذكر', age: 28, weight: 80, height: 178, bf: '', sport: 'كمال أجسام', phase: AD.phases[2].n, carbMethod: 'load', schedule: JSON.parse(JSON.stringify(A.DEFAULT_SCHEDULE)), athMeals: JSON.parse(JSON.stringify(AD.meals)) }; };
  A.phase = function (AD, n) { return AD.phases.filter(function (p) { return p.n === n; })[0] || AD.phases[2]; };
  A.dayType = function (AD, n) { return AD.dayTypes.filter(function (d) { return d.n === n; })[0] || AD.dayTypes[0]; };
  // ---------------------------------------------------------------- الأهداف (مطابقة لمعادلات ملف Pro في الإكسل)
  A.bmr = function (c) {
    var w = num(c.weight), h = num(c.height), a = num(c.age), bf = (c.bf === '' || c.bf == null || num(c.bf) <= 0) ? null : num(c.bf) / 100;
    if (bf == null) return { v: 10 * w + 6.25 * h - 5 * a + (c.sex === 'ذكر' ? 5 : -161), method: 'Mifflin-St Jeor', ffm: null };
    var ffm = w * (1 - bf); return { v: 370 + 21.6 * ffm, method: 'Cunningham', ffm: ffm };
  };
  A.targets = function (c, AD) {
    var w = num(c.weight), ph = A.phase(AD, c.phase), b = A.bmr(c), F = AD.fac, M = A.manual(c, ph, b, w), days = (c.schedule || A.DEFAULT_SCHEDULE).map(function (s, i) {
      var dt = A.dayType(AD, s.type), min = dt.train ? num(s.min) : 0, tk = min * dt.kpm, tdee = b.v * F.neat + tk, kcal = tdee * (1 + ph.adj), p = ph.p * w, f = ph.f * w;
      if (M) { kcal = M.kcal(tdee, dt.train) || kcal; p = M.p(kcal); f = M.f(kcal); }
      var cho = c.carbMethod === 'remainder' ? Math.max(0, (kcal - 4 * p - 9 * f) / 4) : dt.carb * w, mk = 4 * p + 4 * cho + 9 * f, warns = M ? M.warns.slice() : [];
      if (w > 0 && p / w < F.minP - 1e-9) warns.push('البروتين أقل من الحد الأدنى (' + F.minP + ' جم/كجم)'); if (w > 0 && f / w < F.minF - 1e-9) warns.push('الدهون أقل من الحد الأدنى (' + F.minF + ' جم/كجم)'); if (w > 0 && cho / w < F.minC) warns.push('الكارب أقل من ' + F.minC + ' جم/كجم');
      if (b.ffm && (kcal - tk) / b.ffm < F.minEA) warns.push('الطاقة المتاحة أقل من ' + F.minEA + ' سعرة/كجم كتلة خالية');
      return { i: i, name: AD.days[i], type: s.type, train: dt.train, min: min, time: s.time || '', trainKcal: tk, tdee: tdee, kcal: kcal, p: p, c: cho, f: f, macroKcal: mk, diff: mk - kcal, cPerKg: w > 0 ? cho / w : 0, water: (F.water * w + F.waterHr * min / 60) / 1000, warns: warns };
    });
    return { bmr: b.v, method: b.method, ffm: b.ffm, phase: ph, days: days, weight: w, manual: !!M, info: A.macroInfo(c, ph, b, w) };
  };
  // ماكروز يدوية (c.macroMode === 'manual'): السعرات من المرحلة أو بنسبة تعديل أو ثابتة لأيام التدريب/الراحة،
  // والبروتين والدهون بالجرام لكل كجم (البروتين على وزن الجسم أو الكتلة الخالية من الدهون) أو بنسبة % من السعرات، والكارب بالطريقة المختارة.
  A.manual = function (c, ph, b, w) {
    if (c.macroMode !== 'manual') return null;
    var warns = [], ffmOk = !!b.ffm, base = c.pBase === 'ffm' ? (ffmOk ? b.ffm : (warns.push('أساس البروتين «الكتلة الخالية» يحتاج نسبة الدهون؛ حُسب على وزن الجسم'), w)) : w;
    var pv = num(c.pVal), fv = num(c.fVal), pPct = c.pMode === 'pct', fPct = c.fMode === 'pct';
    if (pPct && fPct && pv + fv >= 100) warns.push('مجموع نسبتي البروتين والدهون ' + (pv + fv) + '% — لا يبقى للكارب شيء');
    return {
      warns: warns,
      kcal: function (tdee, train) { var k = c.kcalMode; if (k === 'adj') return tdee * (1 + num(c.kcalAdj) / 100); if (k === 'fixed') return num(train ? c.kcalTrain : (c.kcalRest === '' || c.kcalRest == null ? c.kcalTrain : c.kcalRest)) || 0; return 0; },
      p: function (kcal) { return pPct ? kcal * pv / 100 / 4 : pv * base; },
      f: function (kcal) { return fPct ? kcal * fv / 100 / 9 : fv * w; }
    };
  };
  A.macroInfo = function (c, ph, b, w) {                     // وصف مختصر للطريقة (للملخص والصفحات)
    if (c.macroMode !== 'manual') return 'حسب المرحلة: بروتين ' + ph.p + ' جم/كجم • دهون ' + ph.f + ' جم/كجم • سعرات ' + (ph.adj > 0 ? '+' : '') + Math.round(ph.adj * 100) + '%';
    var ffm = c.pBase === 'ffm' && b.ffm, k = c.kcalMode === 'adj' ? 'سعرات ' + (num(c.kcalAdj) > 0 ? '+' : '') + num(c.kcalAdj) + '%' : c.kcalMode === 'fixed' ? 'سعرات ثابتة ' + num(c.kcalTrain) + (c.kcalRest !== '' && c.kcalRest != null && num(c.kcalRest) !== num(c.kcalTrain) ? ' تدريب / ' + num(c.kcalRest) + ' راحة' : '') : 'سعرات المرحلة ' + (ph.adj > 0 ? '+' : '') + Math.round(ph.adj * 100) + '%';
    return 'يدوي: بروتين ' + (c.pMode === 'pct' ? num(c.pVal) + '% من السعرات' : num(c.pVal) + ' جم/كجم ' + (ffm ? 'كتلة خالية' : 'وزن')) + ' • دهون ' + (c.fMode === 'pct' ? num(c.fVal) + '% من السعرات' : num(c.fVal) + ' جم/كجم') + ' • ' + k;
  };
  A.mealTargets = function (c, AD, day) {                    // توزيع ماكروز اليوم على الوجبات الفعّالة (يُطبَّع تلقائياً)
    var col = day.train ? 'train' : 'rest', meals = (c.athMeals || AD.meals).map(function (m, i) { return { m: m, i: i }; }).filter(function (x) { return x.m.on; }), sum = [0, 0, 0];
    var nz = meals.filter(function (x) { return num(x.m[col][0]) + num(x.m[col][1]) + num(x.m[col][2]) > 0; }); if (nz.length) meals = nz;       // وجبة وزنها صفر في هذا النوع من الأيام (مثل يوم صيام) تُحذف منه
    meals.forEach(function (x) { for (var k = 0; k < 3; k++) sum[k] += num(x.m[col][k]); });
    return meals.map(function (x) { var sh = [0, 1, 2].map(function (k) { return sum[k] > 0 ? num(x.m[col][k]) / sum[k] : 1 / meals.length; }); return { i: x.i, name: x.m.n, time: x.m.t, type: A.mealType(x.m.n), target: { p: day.p * sh[0], c: day.c * sh[1], f: day.f * sh[2] } }; });
  };
  A.mealType = function (n) { n = String(n || ''); if (/إفطار|فطور/.test(n)) return 'B'; if (/غداء/.test(n)) return 'L'; if (/عشاء/.test(n)) return 'D'; if (/ليلي/.test(n)) return 'N'; if (/بعد/.test(n)) return 'S2'; return 'S1'; };
  // ---------------------------------------------------------------- الأصناف: أدوار وملاءمة الوجبات (بحسب الاسم)
  var TAGS = {
    protMain: ['صدر دجاج', 'فخذ دجاج', 'صدر ديك رومي', 'لحم بقري مفروم 90', 'ستيك بقري', 'لحم غنم', 'سلمون', 'بلطي', 'سمك قد', 'روبيان', 'تونة معلبة بالماء'],
    protB: ['بيض كامل مسلوق', 'بياض بيض', 'زبادي يوناني', 'جبنة قريش', 'بروتين مصل', 'تونة معلبة بالماء', 'زبادي سادة قليل'],
    protS1: ['زبادي يوناني', 'جبنة قريش', 'بروتين مصل', 'حليب خالي', 'لبن رائب'], protS2: ['بروتين مصل', 'زبادي يوناني', 'تونة معلبة بالماء', 'بيض كامل مسلوق', 'حليب خالي'], protN: ['جبنة قريش', 'زبادي يوناني', 'حليب خالي', 'بروتين مصل'],
    carbB: ['شوفان جاف', 'شوفان مطبوخ', 'خبز أبيض (شريحة', 'خبز قمح كامل', 'خبز بيتا', 'موز', 'تمر', 'عسل', 'رقائق الذرة', 'فول (حب)', 'بطاطا حلوة مشوية'],
    carbMain: ['أرز أبيض مطبوخ', 'أرز بني مطبوخ', 'معكرونة مطبوخة', 'معكرونة قمح كامل', 'كسكس', 'برغل مطبوخ', 'كينوا', 'بطاطس مسلوقة', 'بطاطس مشوية', 'بطاطا حلوة', 'عدس مسلوق', 'حمص مسلوق', 'ذرة حلوة', 'لوبيا', 'فاصوليا'],
    carbS1: ['موز', 'تمر', 'خبز أبيض (شريحة', 'خبز بيتا', 'شوفان جاف', 'عسل', 'تفاح', 'عنب', 'رقائق الذرة'], carbS2: ['موز', 'تمر', 'عسل', 'عصير برتقال', 'أرز أبيض مطبوخ', 'خبز أبيض (شريحة', 'عنب', 'مانجو'], carbN: ['شوفان مطبوخ', 'موز', 'تفاح'],
    fatB: ['لوز', 'جوز', 'زبدة الفول السوداني', 'طحينة', 'أفوكادو', 'زيت زيتون'], fatMain: ['زيت زيتون', 'زيت كانولا', 'أفوكادو', 'طحينة', 'لوز'], fatS: ['لوز', 'زبدة الفول السوداني', 'جوز', 'فستق'], fatN: ['لوز', 'جوز', 'زبدة الفول السوداني']
  };
  var KEY = { B: ['protB', 'carbB', 'fatB'], L: ['protMain', 'carbMain', 'fatMain'], D: ['protMain', 'carbMain', 'fatMain'], S1: ['protS1', 'carbS1', 'fatS'], S2: ['protS2', 'carbS2', 'fatS'], N: ['protN', 'carbN', 'fatN'] };
  var match = function (f, list) { for (var i = 0; i < list.length; i++) { var k = list[i]; if (f.n.indexOf(k) === 0) { var nx = f.n.charAt(k.length); if (nx === '' || nx === ' ' || nx === '(' || /[\(\s]$/.test(k)) return true; } } return false; };   // مطابقة بحدود الكلمة: «موز» لا تطابق «موزاريلا»
  // ---- قاعدة الأغذية الفعلية = الأساسية (122) + المعتمدة من المدير (مستوردة) − المخفية. المخفي يبقى بـ on=0 ليبقى مرجعاً للخطط القديمة
  var GROLE = { 'نشويات وحبوب': 'c', 'بقوليات': 'c', 'بروتين': 'p', 'ألبان': 'p', 'دهون ومكسرات': 'f', 'فواكه وسكريات': 'c', 'خضروات': 'v', 'مشروبات': 'x' };
  A.prepare = function (AD, I) { AD.foods.forEach(function (f) { if (f.hm === undefined) f.hm = f.ms ? I.pickMeasure(I.parseCoreMeasures(f.ms), GROLE[f.g] || 'c') : null; }); AD._by = null; return AD; };
  A.applyFoods = function (AD, base, ath) {
    ath = ath || {}; var hs = {}, have = {}; (ath.hidden || []).forEach(function (id) { hs[id] = 1; }); var foods = base.map(function (f) { return Object.assign({}, f, { on: hs[f.id] ? 0 : 1 }); }); foods.forEach(function (f) { have[f.id] = 1; });
    (ath.foods || []).forEach(function (f) { if (!have[f.id]) { have[f.id] = 1; foods.push(Object.assign({}, f, { imported: true, on: hs[f.id] ? 0 : 1 })); } }); AD.foods = foods; AD._by = null; return foods;
  };
  A.fromItem = function (i) { var x = i.g > 0 ? 100 / i.g : 0; return { id: i.id, n: i.n, st: i.st || '', g: '', k: i.k * x, p: i.p * x, c: i.c * x, f: i.f * x, fi: (i.fi || 0) * x, na: (i.na || 0) * x, hm: i.hm || null }; };
  A.index = function (AD) { if (!AD._by) { AD._by = {}; AD.foods.forEach(function (f) { AD._by[f.id] = f; }); } return AD._by; };
  A.excluded = function (c, f) { var en = String(f.en || '').toLowerCase(), kw = String(c.keywords || '').split ? (Array.isArray(c.keywords) ? c.keywords : String(c.keywords || '').split(/[,،\n]/)) : []; kw = kw.map(function (s) { return s.trim(); }).filter(Boolean); if ((c.avoid || []).indexOf(f.n) >= 0) return true; return kw.some(function (k) { return f.n.indexOf(k) >= 0 || (en && en.indexOf(k.toLowerCase()) >= 0); }); };
  A.candidates = function (AD, c, type, role) {            // role: p | c | f | v
    var k = KEY[type] || KEY.S1, foods = AD.foods.filter(function (f) { return f.on !== 0 && !A.excluded(c, f) && !(f.draft && !(c && c.diet)); });      // الأصناف المحلية المسودة (draft) لا تدخل إلا مع نظام غذائي
    if (role === 'v') return foods.filter(function (f) { return (f.g === 'خضروات' || f.role === 'v') && !(c && c.diet && A.dietAllow && A.dietAllow(c.diet, f) === false); });
    var dt = c && c.diet && A.dietTags ? A.dietTags(c.diet) : null, tk = k[role === 'p' ? 0 : role === 'c' ? 1 : 2], list = (dt && dt[tk]) || TAGS[tk]; return foods.filter(function (f) { if (f.role) return f.role === role && f.meals && f.meals.indexOf(type) >= 0 && !(c && c.diet && A.dietAllow && A.dietAllow(c.diet, f) === false); return match(f, list); });   // المستورد: بالدور والوجبات المحفوظة؛ الأساسي: بقوائم الأسماء
  };
  A.perG = function (f) { return { p: f.p / 100, c: f.c / 100, f: f.f / 100, k: f.k / 100 }; };
  // ---------------------------------------------------------------- حل الجرامات: أقل مربعات موزونة غير سالبة لمصادر ≤ 3
  function gauss(M, v) { var n = v.length, a = M.map(function (r, i) { return r.concat([v[i]]); }); for (var i = 0; i < n; i++) { var p = i; for (var r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[p][i])) p = r; var t = a[i]; a[i] = a[p]; a[p] = t; if (Math.abs(a[i][i]) < 1e-12) return null; for (var r2 = i + 1; r2 < n; r2++) { var q = a[r2][i] / a[i][i]; for (var c = i; c <= n; c++) a[r2][c] -= q * a[i][c]; } } var x = new Array(n); for (var i2 = n - 1; i2 >= 0; i2--) { var s = a[i2][n]; for (var c2 = i2 + 1; c2 < n; c2++) s -= a[i2][c2] * x[c2]; x[i2] = s / a[i2][i2]; } return x; }
  A.solve = function (srcs, target, w) {                    // srcs: [{p,c,f}] لكل جرام؛ target {p,c,f}؛ يعيد جرامات غير سالبة تقلل الخطأ الموزون
    w = w || [3, 1.2, 2.4]; var n = srcs.length, best = { g: new Array(n).fill(0), err: Infinity }, t = [target.p, target.c, target.f], keys = ['p', 'c', 'f'];
    for (var mask = 0; mask < (1 << n); mask++) {
      var idx = []; for (var i = 0; i < n; i++) if (mask & (1 << i)) idx.push(i); var g = new Array(n).fill(0);
      if (idx.length) {
        var M = idx.map(function (a) { return idx.map(function (b) { var s = 0; for (var k = 0; k < 3; k++) s += w[k] * srcs[a][keys[k]] * srcs[b][keys[k]]; return s + (a === b ? 1e-9 : 0); }); }), v = idx.map(function (a) { var s = 0; for (var k = 0; k < 3; k++) s += w[k] * srcs[a][keys[k]] * t[k]; return s; }), x = gauss(M, v);
        if (!x || x.some(function (q) { return q < -1e-9; })) continue; idx.forEach(function (a, j) { g[a] = Math.max(0, x[j]); });
      }
      var err = 0; for (var k = 0; k < 3; k++) { var got = 0; for (var i2 = 0; i2 < n; i2++) got += g[i2] * srcs[i2][keys[k]]; err += w[k] * Math.pow(got - t[k], 2); } err += idx.length * 1e-6;
      if (err < best.err - 1e-9) best = { g: g, err: err };
    }
    return best.g;
  };
  var roundG = function (f, g, AD) { if (/بيض كامل/.test(f.n)) { var e = (AD.prefs && AD.prefs.egg) || 50; return Math.max(e, Math.round(g / e) * e); } return Math.max(5, Math.round(g / 5) * 5); };
  var mk = function (f, g, role, fixed) { var x = g / 100; return { id: f.id, n: f.n, st: /^(غير محدد|غير معروف|غير مصنّف)$/.test(String(f.st || '').trim()) ? '' : f.st, hm: f.hm || null, g: g, role: role, fixed: !!fixed, k: f.k * x, p: f.p * x, c: f.c * x, f: f.f * x, fi: f.fi * x, na: f.na * x }; };
  A.sum = function (items) { var s = { k: 0, p: 0, c: 0, f: 0, fi: 0, na: 0, g: 0 }; items.forEach(function (i) { for (var k in s) s[k] += i[k] || 0; }); return s; };
  var err = function (items, t) { var s = A.sum(items); return 3 * Math.abs(s.p - t.p) + 1.2 * Math.abs(s.c - t.c) + 2.4 * Math.abs(s.f - t.f); };
  A.refit = function (AD, items, target) {                  // يعيد ضبط جرامات الأصناف غير الثابتة لبلوغ هدف الوجبة
    var by = A.index(AD), fixed = items.filter(function (i) { return i.fixed; }), free = items.filter(function (i) { return !i.fixed; }), fs = A.sum(fixed), t = { p: Math.max(0, target.p - fs.p), c: Math.max(0, target.c - fs.c), f: Math.max(0, target.f - fs.f) };
    if (!free.length) return items; var g = A.solve(free.map(function (i) { return A.perG(by[i.id] || A.fromItem(i)); }), t);
    var out = free.map(function (i, j) { var f = by[i.id] || A.fromItem(i); return g[j] >= 2.5 ? mk(f, roundG(f, g[j], AD), i.role) : null; }).filter(Boolean);
    for (var pass = 0; pass < 3; pass++) out.forEach(function (it, j) { var f = by[it.id] || A.fromItem(it), step = /بيض كامل/.test(f.n) ? ((AD.prefs && AD.prefs.egg) || 50) : 5; [step, -step].forEach(function (d) { if (it.g + d < step) return; var trial = out.slice(); trial[j] = mk(f, it.g + d, it.role); if (err(fixed.concat(trial), target) < err(fixed.concat(out), target) - 1e-9) { out[j] = trial[j]; it = out[j]; } }); });
    var res = []; free.forEach(function (i) { var o = out.filter(function (x) { return x.id === i.id && x.role === i.role; })[0]; if (o) res.push(o); }); var keep = ['p', 'c', 'f', 'v', 'x']; return fixed.concat(res).sort(function (a, b) { return keep.indexOf(a.role) - keep.indexOf(b.role); });
  };
  // ---------------------------------------------------------------- واقعية الوجبات (0.41): حدود دنيا/عليا وخطوات لكل فئة صنف
  // تُفعَّل فقط مع النظام الغذائي (c.diet)؛ بدونها يبقى سلوك المخطّط كما كان (للرياضيين). [نمط الاسم، {min, max, step, maxB (الفطور)}] بالجرام المطبوخ/الجاهز
  var REAL = [
    [/^(بيض كامل)/, { egg: 1, min: 1, max: 4 }], [/^بياض بيض/, { min: 35, max: 175, step: 35 }],
    [/^(زيت|سمن|زبدة \(|كريمة)/, { min: 5, max: 25, step: 5, maxB: 20 }], [/^(زبدة الفول|طحينة)/, { min: 10, max: 30, step: 5 }],
    [/^(لوز|جوز|كاجو|فستق|فول سوداني|بذور)/, { min: 10, max: 35, step: 5 }], [/^أفوكادو/, { min: 40, max: 200, step: 10 }], [/^زيتون/, { min: 20, max: 60, step: 10 }],
    [/بروتين مصل/, { min: 20, max: 40, step: 10 }], [/^تونة/, { min: 60, max: 160, step: 20 }], [/^سردين/, { min: 60, max: 130, step: 10 }],
    [/^(صدر|فخذ|لحم|ستيك|سلمون|بلطي|سمك|روبيان|دجاج|كفتة)/, { min: 70, max: 220, step: 10 }],
    [/^(جبنة (موزاريلا|شيدر|بيضاء)|جبنة رومي)/, { min: 20, max: 70, step: 10 }], [/^(جبنة قريش|لبنة)/, { min: 50, max: 250, step: 25 }],
    [/^(زبادي|حليب|لبن)/, { min: 100, max: 300, step: 50 }],
    [/^(عسل|سكر|مربى|زبيب|شوكولاتة)/, { min: 10, max: 25, step: 5 }], [/^تمر/, { min: 20, max: 60, step: 10 }],
    [/^خبز بلدي/, { min: 40, max: 160, step: 40 }], [/^(خبز|تورتيلا)/, { min: 30, max: 120, step: 10 }],
    [/^(شوفان جاف|رقائق)/, { min: 20, max: 80, step: 10 }], [/^حمص بالطحينة/, { min: 40, max: 120, step: 10 }], [/^(فلافل|طعمية)/, { min: 30, max: 120, step: 30 }],
    [/(مطبوخ|مسلوق|مشوية?)$|^(عدس|حمص|فول|فاصوليا|لوبيا)|^(أرز|كشري|جريش|فريك|شوربة)/, { min: 50, max: 250, step: 10 }]
  ];
  A.realOf = function (f, type, AD) {
    var n = f.n || '', d = { min: 30, max: 300, step: 10 };
    for (var i = 0; i < REAL.length; i++) if (REAL[i][0].test(n)) { d = Object.assign({}, d, REAL[i][1]); break; }
    if (f.g === 'فواكه وسكريات' && !/^(عسل|سكر|مربى|زبيب|شوكولاتة|تمر)/.test(n)) d = { min: 80, max: 300, step: 10 };
    if (f.g === 'خضروات' || f.role === 'v') d = { min: 80, max: 400, step: 10 };
    if (d.egg) { var e = (AD && AD.prefs && AD.prefs.egg) || 50; d = { min: e, max: 4 * e, step: e }; }
    if (type === 'B' && d.maxB) d.max = d.maxB;
    if (type && type.charAt(0) === 'S' && d.max > 150 && !/^(زبادي|حليب|لبن|جبنة قريش|لبنة)/.test(n) && f.g !== 'فواكه وسكريات') d.max = Math.min(d.max, 150);
    return d;
  };
  A.coherence = function (items, type) {                    // انسجام الوجبة (0.41): دهنان للطبخ معاً أو طحينة مع كريمة/جبن أو مكسرات مع لحم تُعاقَب
    var cook = 0, tah = 0, cream = 0, cheese = 0, nuts = 0, big = type === 'L' || type === 'D', cost = 0;
    items.forEach(function (i) { var n = i.n; if (/^(زيت|سمن|زبدة \(|كريمة)/.test(n)) cook++; if (/^كريمة/.test(n)) cream++; if (/^طحينة/.test(n)) tah++; if (/^جبنة/.test(n)) cheese++; if (/^(لوز|جوز|كاجو|فستق|فول سوداني|زبدة الفول)/.test(n)) nuts++; });
    if (cook > 1) cost += 14 * (cook - 1); if (tah && (cream || cheese)) cost += 12; if (tah && cook) cost += 6; if (big && nuts) cost += 5; if (cream && cheese) cost += 8; return cost;
  };
  A.realOn = function (c) { return !!(c && c.diet && c.diet.id); };
  A.refitReal = function (AD, items, target, type) {         // نفس refit لكن بحدود دنيا/عليا وخطوات؛ ما يقل عن نصف الحد الأدنى يُحذف، وما بينهما يُرفع للحد الأدنى
    var by = A.index(AD), fixed = items.filter(function (i) { return i.fixed; }), free = items.filter(function (i) { return !i.fixed; }), fs = A.sum(fixed);
    var t = { p: Math.max(0, target.p - fs.p), c: Math.max(0, target.c - fs.c), f: Math.max(0, target.f - fs.f) };
    if (!free.length) return items;
    var defs = free.map(function (i) { var f = by[i.id] || A.fromItem(i); return { i: i, f: f, b: A.realOf(f, type, AD), g: 0 }; }), lock = [], active = defs.slice();
    for (var pass = 0; pass < 5 && active.length; pass++) {
      var tt = { p: t.p, c: t.c, f: t.f }; lock.forEach(function (l) { tt.p -= l.d.f.p / 100 * l.g; tt.c -= l.d.f.c / 100 * l.g; tt.f -= l.d.f.f / 100 * l.g; }); tt.p = Math.max(0, tt.p); tt.c = Math.max(0, tt.c); tt.f = Math.max(0, tt.f);
      var g = A.solve(active.map(function (d) { return A.perG(d.f); }), tt), changed = false, next = [];
      active.forEach(function (d, j) { var v = g[j]; d.g = v; if (v < d.b.min * 0.5) changed = true; else if (v < d.b.min) { lock.push({ d: d, g: d.b.min }); changed = true; } else if (v > d.b.max) { lock.push({ d: d, g: d.b.max }); changed = true; } else next.push(d); });
      if (!changed) break; active = next;
    }
    var out = [], put = function (d, g) { var st = d.b.step; g = Math.round(g / st) * st; g = Math.max(d.b.min, Math.min(d.b.max, g)); out.push(mk(d.f, g, d.i.role)); };
    active.forEach(function (d) { if (d.g >= d.b.min * 0.5) put(d, d.g); }); lock.forEach(function (l) { put(l.d, l.g); });
    for (var pass2 = 0; pass2 < 2; pass2++) out.forEach(function (it, j) { var d = defs.filter(function (x) { return x.f.id === it.id; })[0]; if (!d) return; [d.b.step, -d.b.step].forEach(function (dg) { var ng = it.g + dg; if (ng < d.b.min || ng > d.b.max) return; var trial = out.slice(); trial[j] = mk(d.f, ng, it.role); if (err(fixed.concat(trial), target) < err(fixed.concat(out), target) - 1e-9) { out[j] = trial[j]; it = out[j]; } }); });
    var keep = ['p', 'c', 'f', 'v', 'x']; return fixed.concat(out).sort(function (a, b) { return keep.indexOf(a.role) - keep.indexOf(b.role); });
  };
  A.mealIssues = function (meal, AD) {                       // مخالفات واقعية الوجبة (للمدقّق والاختبارات)
    var by = A.index(AD), out = [], n = meal.items.length, big = meal.type === 'L' || meal.type === 'D';
    meal.items.forEach(function (it) { var f = by[it.id]; if (!f) return; var b = A.realOf(f, meal.type, AD); if (it.fixed) return; if (it.g < b.min - 1e-6) out.push('كمية صغيرة جداً: ' + it.n + ' ' + it.g + ' جم'); if (it.g > b.max + 1e-6) out.push('كمية كبيرة جداً: ' + it.n + ' ' + it.g + ' جم'); });
    if (n > (big ? 5 : 4)) out.push('وجبة بأصناف كثيرة (' + n + ')'); if (!n) out.push('وجبة فارغة');
    return out;
  };
  // ---------------------------------------------------------------- تخطيط وجبة
  var CAP = function (f) { if (f.role) { var en = String(f.en || ''); if (f.role === 'p') return /egg/i.test(en) ? 300 : /whey|powder|isolate/i.test(en) ? 60 : (f.g === 'ألبان وبيض' ? 300 : 350); if (f.role === 'f') return /oil|butter|lard|ghee|shortening|margarine/i.test(en) ? 30 : 70; if (f.role === 'c') return /juice|honey|sugar|syrup|jam|date|raisin/i.test(en) ? 150 : (/فواك/.test(f.g) ? 420 : 520); return 400; } if (f.g === 'ألبان') return 300; if (/مصل/.test(f.n)) return 60; if (f.g === 'فواكه وسكريات') return /عسل|سكر|مربى|تمر|زبيب|شوكولاتة/.test(f.n) ? 150 : 420; if (f.g === 'دهون ومكسرات') return /زيت|سمن|زبدة \(/.test(f.n) ? 30 : 70; if (f.g === 'نشويات وحبوب' || f.g === 'بقوليات') return 520; if (f.g === 'بروتين') return /بيض كامل/.test(f.n) ? 300 : 350; return 400; };
  A.planMeal = function (st, c, AD, day, mt, d) {
    var type = mt.type, by = A.index(AD), P = AD.prefs || {}, love = c.love || [];
    var rank = function (role) {
      var cands = A.candidates(AD, c, type, role), maxU = role === 'p' ? (P.maxProt || 5) : (P.maxAny || 8);
      var tg0 = mt.target, fit = function (f) {            // ملاءمة الصنف وحده لهدف الوجبة: ما يزيد عن حاجتها من الماكروز الأخرى يُعاقَب (يمنع اختيار لحوم دهنية لوجبة قليلة الدهون)
        var dens = role === 'p' ? f.p : role === 'c' ? f.c : f.f, need = role === 'p' ? tg0.p : role === 'c' ? tg0.c : tg0.f, g = need / Math.max(dens / 100, 0.01), over = 0;
        if (role === 'p') over = Math.max(0, g * f.f / 100 - tg0.f * 0.8) * 2.4 + Math.max(0, g * f.c / 100 - tg0.c * 0.5) * 1.2; else if (role === 'c') over = Math.max(0, g * f.p / 100 - tg0.p * 0.6) * 3 + Math.max(0, g * f.f / 100 - tg0.f * 0.6) * 2.4; else over = Math.max(0, g * f.p / 100 - 0.3 * tg0.p) * 3 + Math.max(0, g * f.c / 100 - 0.3 * tg0.c) * 1.2;
        return over + Math.max(0, g - CAP(f)) * 0.5;
      };
      return cands.map(function (f) { var u = st.use[f.id] || 0, dayU = st.dayUse[f.id] || 0; return { f: f, s: (love.indexOf(f.n) >= 0 ? 3 : 0) - 1.4 * u / maxU - (u >= maxU ? 3 : 0) - 1.6 * dayU + 1.3 * hash(c.code + '|' + d + '|' + mt.i + '|' + f.id + '|' + role), fit: fit(f), ov: u >= maxU }; }).sort(function (a, b) { return b.s - a.s; });
    }, fixed = [];
    var real = A.realOn(c), vegG = real && c.diet && (c.diet.id === 'keto' || c.diet.id === 'lowcarb') ? 200 : (P.veg || 150);
    if (type === 'L' || type === 'D') { var vr = rank('v')[0]; if (vr) fixed.push(mk(vr.f, vegG, 'v', true)); }
    var pool = function (list, k1, k2) {
      if (list.some(function (x) { return !x.ov; })) list = list.filter(function (x) { return !x.ov; });          // لا يتجاوز مصدر الحد الأسبوعي ما دامت هناك بدائل                      // أفضل المرشحين بالنقاط (تنويع/مفضّلات) + أفضلهم ملاءمةً لهدف الوجبة (دقة)
      var top = list.slice(0, k1), seen = {}; top.forEach(function (x) { seen[x.f.id] = 1; }); list.slice().sort(function (a, b) { return a.fit - b.fit; }).slice(0, k2 + 4).forEach(function (x) { if (!seen[x.f.id] && k2-- > 0) { seen[x.f.id] = 1; top.push(x); } }); return top;
    };
    var Pp = pool(rank('p'), 4, 2), Cc = pool(rank('c'), 3, 2), Ff = pool(rank('f'), 3, 1); if (!Pp.length) Pp = [null]; if (!Cc.length) Cc = [null]; if (!Ff.length) Ff = [null];
    var best = null, tg = mt.target;
    if (real) { if (tg.c < 10) Cc = [null]; if (tg.f < 4) Ff = [null]; }
    var Ff2 = real && tg.f > 28 && (type === 'L' || type === 'D' || type === 'B') ? pool(rank('f'), 3, 1) : [null];
    Pp.forEach(function (p) { Cc.forEach(function (cc) { Ff.forEach(function (ff) { Ff2.forEach(function (f2) {
      if (f2 && ff && f2.f.id === ff.f.id) return;
      var base = [p && { r: 'p', x: p }, cc && { r: 'c', x: cc }, ff && { r: 'f', x: ff }, f2 && { r: 'f', x: f2 }].filter(Boolean); if (!base.length) return;
      var seed = fixed.concat(base.map(function (b) { return mk(b.x.f, 100, b.r, false); })), items = real ? A.refitReal(AD, seed, tg, type) : A.refit(AD, seed, tg), cost = err(items, tg);
      if (real) { cost += 30 * (items.filter(function (it) { return !it.fixed; }).length < base.length ? 1 : 0) + A.coherence(items, type); }
      items.forEach(function (it) { var cap = CAP(by[it.id]); if (!it.fixed && it.g > cap) cost += 3 * (it.g - cap); }); base.forEach(function (b) { cost -= 6 * b.x.s; });
      if (!best || cost < best.cost) best = { cost: cost, items: items };
    }); }); }); });
    var items = best ? best.items : fixed; items.forEach(function (it) { st.use[it.id] = (st.use[it.id] || 0) + 1; st.dayUse[it.id] = (st.dayUse[it.id] || 0) + 1; });
    return { si: mt.i, name: mt.name, time: mt.time, type: type, target: tg, items: items };
  };
  A.dayStats = function (day) { var all = []; day.meals.forEach(function (m) { m.items.forEach(function (i) { all.push(i); }); }); day.got = A.sum(all); day.dev = { p: day.got.p - day.t.p, c: day.got.c - day.t.c, f: day.got.f - day.t.f, k: day.got.k - day.t.kcal }; return day; };
  A.planWeek = function (client, AD, opt) {
    opt = opt || {}; var T = A.targets(client, AD), st = { use: {} }, days = [];
    T.days.forEach(function (t, d) {
      st.dayUse = {}; var meals = A.mealTargets(client, AD, t).map(function (mt) { var m = A.planMeal(st, client, AD, t, mt, d); m.time = m.time || ''; return m; });
      var day = { day: d, name: t.name, type: t.type, t: t, meals: meals }; days.push(A.dayStats(day));
    });
    var g = A.pickGuides(AD, client.phase, opt.seed); return { kind: 'athlete', client: client, T: T, days: days, version: 1, generated: new Date().toISOString(), phr: g.phr, expect: g.expect, warn: g.warn };
  };
  // ---------------------------------------------------------------- تعديلات يدوية
  A.setGrams = function (plan, AD, d, m, i, g) { var it = plan.days[d].meals[m].items[i], f = A.index(AD)[it.id] || A.fromItem(it), role = it.role, fx = it.fixed; plan.days[d].meals[m].items[i] = mk(f, Math.max(0, num(g)), role, fx); plan.days[d].meals[m].edited = true; A.dayStats(plan.days[d]); };
  A.alts = function (AD, c, item, type) { var role = item.role; return A.candidates(AD, c, type, role).filter(function (f) { return f.id !== item.id; }); };
  A.swapItem = function (plan, AD, d, m, i, newId) {
    var by = A.index(AD), meal = plan.days[d].meals[m], old = meal.items[i], nf = by[newId], key = old.role === 'p' ? 'p' : old.role === 'c' ? 'c' : old.role === 'f' ? 'f' : null, g = old.g;
    if (key && nf[key] > 0) g = roundG(nf, old[key] / (nf[key] / 100), AD); meal.items[i] = mk(nf, g, old.role, old.fixed); meal.edited = true; A.dayStats(plan.days[d]);
  };
  A.swapGrams = function (AD, old, nf) { var key = old.role === 'p' ? 'p' : old.role === 'c' ? 'c' : old.role === 'f' ? 'f' : null; return key && nf[key] > 0 ? roundG(nf, old[key] / (nf[key] / 100), AD) : old.g; };   // جرامات البديل التي تعادل الماكرو الرئيسي (مثل swapItem)
  A.addItem = function (plan, AD, d, m, id, g) { var f = A.index(AD)[id], meal = plan.days[d].meals[m]; meal.items.push(mk(f, g || 100, 'x', false)); meal.edited = true; A.dayStats(plan.days[d]); };
  A.delItem = function (plan, AD, d, m, i) { var meal = plan.days[d].meals[m]; meal.items.splice(i, 1); meal.edited = true; A.dayStats(plan.days[d]); };
  A.refitMeal = function (plan, AD, d, m) { var meal = plan.days[d].meals[m]; meal.items = A.refit(AD, meal.items.map(function (i) { return i.role === 'x' ? Object.assign({}, i, { fixed: true }) : i; }), meal.target); meal.edited = false; A.dayStats(plan.days[d]); };
  // ---------------------------------------------------------------- إرشادات المرحلة (عبارة دعم + إرشاد لكل صفحة؛ توقعات وتنبيهات للملخص)
  A.pickGuides = function (AD, phase, seed) {
    var x = (seed == null ? (Date.now() ^ Math.floor(Math.random() * 4294967296)) : seed) >>> 0, rand = function () { x = (x + 0x6D2B79F5) >>> 0; var t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    var shuf = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var own = function (type) { var l = AD.guides.filter(function (g) { return g[0] === phase && g[1] === type; }).map(function (g) { return g[2]; }); if (!l.length) l = AD.guides.filter(function (g) { return g[1] === type; }).map(function (g) { return g[2]; }); return shuf(l); };
    var more = function (type) { var o = own(type), rest = AD.guides.filter(function (g) { return g[0] !== phase && g[1] === type && o.indexOf(g[2]) < 0; }).map(function (g) { return g[2]; }); return o.concat(shuf(rest)); };      // عبارات المرحلة أولاً ثم من بقية المراحل حتى لا تتكرر عبارة داخل الخطة
    var sup = more('دعم'), gd = more('إرشاد'), phr = []; for (var i = 0; i < 8; i++) phr.push([sup.length ? sup[i % sup.length] : '', gd.length ? gd[i % gd.length] : '']);
    return { phr: phr, expect: own('توقع').slice(0, 3), warn: own('تنبيه').slice(0, 2) };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = A; else root.Ath = A;
})(typeof window !== 'undefined' ? window : globalThis);
