/* محرك «من الوصفة إلى الحصص» — نقي (بلا واجهة)، يعمل في المتصفح وNode.
   المبدأ: لا يخترع. الصنف يُطابَق مع قاعدتك فقط، والحصة تُحسب فقط من وحدة الصنف نفسها (qty ÷ upe) أو من الجرامات (g ÷ gpe)،
   وأي وحدة أخرى أو صنف غير موجود أو التباس يُعلَّم للمراجعة ولا يُحسب. التقريب إلى 0.5 حصة يُعلَن إن غيّر القيمة. */
(function (root) {
  'use strict';
  var R = {};
  var norm = function (s) { return String(s == null ? '' : s).replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\s_]+/g, ' ').trim().toLowerCase(); };
  var strip = function (w) { return w.replace(/^ال/, ''); };
  var toks = function (s) { return norm(s).replace(/\([^)]*\)/g, ' ').split(/[\s\-\/,،:;]+/).map(strip).filter(Boolean); };
  var DIG = '٠١٢٣٤٥٦٧٨٩', FRAC = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
  var ascii = function (s) { return String(s).replace(/[٠-٩]/g, function (c) { return DIG.indexOf(c); }).replace(/٫/g, '.'); };
  var NUMW = { 'نصف': 0.5, 'ربع': 0.25, 'ثلث': 1 / 3, 'ثلثين': 2 / 3, 'واحد': 1, 'واحده': 1, 'اثنين': 2, 'اثنان': 2, 'ثلاث': 3, 'ثلاثه': 3, 'اربع': 4, 'اربعه': 4, 'خمس': 5, 'خمسه': 5, 'ست': 6, 'سته': 6, 'سبع': 7, 'سبعه': 7, 'ثمان': 8, 'ثمانيه': 8, 'تسع': 9, 'تسعه': 9, 'عشر': 10, 'عشره': 10 };
  // وحدات: كل صيغة تُعيَّن إلى معرّف موحّد. المثنى (ملعقتين) يُفكَّك إلى كمية 2 + وحدة المفرد.
  var UNIT = { 'ملعقه كبيره': 'tbsp', 'ملاعق كبيره': 'tbsp', 'م ك': 'tbsp', 'ملعقه طعام': 'tbsp', 'ملاعق طعام': 'tbsp', 'tbsp': 'tbsp', 'ملعقه صغيره': 'tsp', 'ملاعق صغيره': 'tsp', 'م ص': 'tsp', 'ملعقه شاي': 'tsp', 'ملاعق شاي': 'tsp', 'tsp': 'tsp', 'كوب': 'cup', 'اكواب': 'cup', 'كاس': 'cup', 'cup': 'cup', 'cups': 'cup', 'جم': 'g', 'جرام': 'g', 'غرام': 'g', 'غم': 'g', 'g': 'g', 'gm': 'g', 'gram': 'g', 'grams': 'g', 'حبه': 'حبه', 'حبات': 'حبه', 'قطعه': 'قطعه', 'قطع': 'قطعه', 'شريحه': 'شريحه', 'شرائح': 'شريحه', 'رغيف': 'رغيف', 'ارغفه': 'رغيف', 'بيضه': 'بيضه', 'بيضات': 'بيضه', 'بيض': 'بيضه', 'موزه': 'موزه', 'عرنوس': 'عرنوس', 'ملعقه': 'ملعقه', 'ملاعق': 'ملعقه' };
  var DUAL = { 'ملعقتين': [2, 'ملعقه', 'ملعقة'], 'كوبين': [2, 'cup', 'كوب'], 'حبتين': [2, 'حبه', 'حبة'], 'شريحتين': [2, 'شريحه', 'شريحة'], 'بيضتين': [2, 'بيضه', 'بيضة'], 'قطعتين': [2, 'قطعه', 'قطعة'], 'رغيفين': [2, 'رغيف', 'رغيف'] };
  var unitId = function (s) { var n = norm(s); return UNIT[n] || n; };
  var MEASURE = { tbsp: 1, tsp: 1, cup: 1, g: 1 };
  var COOKED_W = /(^|\s)(مطبوخ|مطبوخه|مسلوق|مسلوقه|مطهو|مطهوه|مسلوقين)(\s|$)/, RAW_W = /(^|\s)(نيء|نئ|ني|خام|جاف|جافه)(\s|$)/;
  var PREP = ['مقطع', 'مقطعه', 'مفروم', 'مفرومه', 'مبشور', 'مبشوره', 'مهروس', 'مهروسه', 'طازج', 'طازجه', 'مقطعين', 'مقشر', 'مقشره', 'مفتت', 'مطحون', 'مطحونه', 'مسلوق', 'مسلوقه', 'مطبوخ', 'مطبوخه', 'نيء', 'نئ', 'خام', 'جاف', 'جافه', 'مطهو'];   // تُحذف فقط في المحاولة الثانية للمطابقة (قد تكون جزءاً من اسم صنف مشروع)
  var SIZEW = ['صغيره', 'كبيره', 'متوسطه', 'صغير', 'كبير', 'متوسط'];
  var FREE = ['ملح', 'فلفل اسود', 'فلفل', 'بهارات', 'كمون', 'كزبره', 'هيل', 'قرفه', 'ماء', 'ماء ورد', 'خل', 'كركم', 'زعتر', 'بقدونس'];   // لا حصص عادةً: تُقترح للتجاهل وتبقى بيدك
  var ALIAS = { 'رز': 'ارز', 'فراخ': 'دجاج', 'بطاطس': 'بطاطا', 'توست': 'خبز توست', 'بيض': 'بيضه كامله' };   // يُطبَّق فقط حين يكون الاسم كلمة واحدة
  var isAr = function (s) { return /[\u0600-\u06FF]/.test(s); };
  // ---- تقطيع النص إلى أسطر مكوّنات
  R.splitLines = function (text) {
    return String(text || '').split(/\r?\n|[؛;]|،(?!\d)/).map(function (l) { return l.replace(/^\s*[-•*·●▪►✓✔]+\s*/, '').replace(/^\s*[\d٠-٩]+[.)]\s+/, '').trim(); }).filter(function (l) { return l.length > 0 && isAr(l) || /\d/.test(l) && l.length > 1; });
  };
  // ---- الكمية والوحدة والاسم
  function parseQty(tokens) {
    var qty = null, i = 0, t;
    while (i < tokens.length) {
      t = ascii(tokens[i]);
      var m = /^(\d+(?:[.,]\d+)?)$/.exec(t), fr = /^(\d+)\/(\d+)$/.exec(t), uf = /^(\d*)([½¼¾⅓⅔])$/.exec(t);
      if (m) { qty = (qty || 0) + parseFloat(m[1].replace(',', '.')); i++; if (i < tokens.length && FRAC[tokens[i]] !== undefined) { qty += FRAC[tokens[i]]; i++; } continue; }
      if (fr) { qty = (qty || 0) + (+fr[1]) / (+fr[2]); i++; continue; }
      if (uf) { qty = (qty || 0) + (uf[1] ? +uf[1] : 0) + FRAC[uf[2]]; i++; continue; }
      if (FRAC[t] !== undefined) { qty = (qty || 0) + FRAC[t]; i++; continue; }
      var w = strip(norm(t)); if (NUMW[w] !== undefined && qty === null) { qty = NUMW[w]; i++; continue; }
      break;
    }
    return { qty: qty, i: i };
  }
  R.units = function (D) {
    if (D._rcpUnits) return D._rcpUnits; var m = {}; D.foods.forEach(function (f) { var a = norm(f.us), b = norm(f.up); if (a && !UNIT[a]) m[a] = a; if (b && !UNIT[b]) m[b] = a; });
    try { Object.defineProperty(D, '_rcpUnits', { value: m, writable: true, configurable: true, enumerable: false }); } catch (e) { } return m;
  };
  R.parseLine = function (raw, D) {
    var X = D ? R.units(D) : {}, U = function (k) { return UNIT[k] || X[k]; };
    var line = ascii(raw), n = norm(line), state = COOKED_W.test(n) ? 'مطبوخ' : RAW_W.test(n) ? 'نيء' : '';
    var tk = line.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean), q = parseQty(tk), qty = q.qty, i = q.i, unit = '', unitRaw = '', rest;
    var t0 = tk[i] ? norm(tk[i]) : '';
    if (DUAL[t0] && qty === null) { qty = DUAL[t0][0]; unit = DUAL[t0][1]; unitRaw = DUAL[t0][2]; i++; }
    else {
      var two = tk[i] && tk[i + 1] ? norm(tk[i] + ' ' + tk[i + 1]) : '', one = t0;
      if (two && U(two)) { unit = U(two); unitRaw = tk[i] + ' ' + tk[i + 1]; i += 2; } else if (one && U(one)) { unit = U(one); unitRaw = tk[i]; i++; }
      if (unit && tk[i] && /^(و?نصف|و?ربع)$/.test(norm(tk[i]))) { qty = (qty === null ? 1 : qty) + (/نصف/.test(tk[i]) ? 0.5 : 0.25); i++; }
    }
    if (unit && !MEASURE[unit] && tk[i] && SIZEW.indexOf(norm(tk[i])) >= 0) { unitRaw += ' ' + tk[i]; unit = norm(unitRaw); i++; }      // «حبة صغيرة» وحدة واحدة
    if (tk[i] && norm(tk[i]) === 'من') i++;
    rest = tk.slice(i); var name = rest.join(' ').trim(), nameFromUnit = false, clean = rest.filter(function (w) { return PREP.indexOf(strip(norm(w))) < 0 && PREP.indexOf(norm(w)) < 0; }).join(' ').trim();
    if (!name && unitRaw && !MEASURE[unit]) { name = unitRaw; clean = unitRaw; nameFromUnit = true; }
    return { raw: raw, qty: qty, unit: unit, unitRaw: unitRaw, name: name, clean: clean, state: state, nameFromUnit: nameFromUnit };
  };
  // ---- مطابقة الصنف: لا اختيار تلقائي إلا بتطابق وحيد؛ وإلا قائمة مرشحين للمستخدم
  function foodIndex(D) {
    if (D._rcpIdx && D._rcpIdx.n === D.foods.length) return D._rcpIdx;
    var idx = { n: D.foods.length, list: D.foods.filter(function (f) { return f.on !== 0 && !f.deleted; }).map(function (f) { return { f: f, core: norm(f.n).replace(/\([^)]*\)/g, '').trim(), t: toks(f.n) }; }) };
    try { Object.defineProperty(D, '_rcpIdx', { value: idx, writable: true, configurable: true, enumerable: false }); } catch (e) { }
    return idx;
  }
  R.match = function (D, nameRaw) {
    var name = norm(nameRaw), words = name.split(' ').map(strip).filter(Boolean); if (!words.length) return { exact: [], close: [], sugg: [] };
    var joined = (words.length === 1 && ALIAS[words[0]] ? ALIAS[words[0]] : words.join(' ')), idx = foodIndex(D), nt = toks(joined), core = joined;
    var exact = idx.list.filter(function (x) { return x.t.join(' ') === nt.join(' '); }).map(function (x) { return x.f.n; });
    var close = exact.length ? [] : idx.list.filter(function (x) { return x.t.length && (x.t.slice(0, nt.length).join(' ') === nt.join(' ') || nt.every(function (w) { return x.t.indexOf(w) >= 0; })); }).map(function (x) { return x.f.n; });
    var sugg = (exact.length || close.length) ? [] : idx.list.map(function (x) { var k = nt.filter(function (w) { return x.t.indexOf(w) >= 0; }).length; return { n: x.f.n, k: k }; }).filter(function (x) { return x.k > 0; }).sort(function (a, b) { return b.k - a.k; }).slice(0, 4).map(function (x) { return x.n; });
    return { exact: exact, close: close, sugg: sugg };
  };
  // ---- الحساب: وحدة الصنف نفسها أو الجرام فقط
  R.calc = function (food, qty, unit, state) {
    if (!food) return { ok: false, reason: 'لا صنف' };
    if (qty === null || !(qty > 0)) return { ok: false, reason: 'الكمية غير مفهومة أو غير مذكورة' };
    var ownU = unitId(food.us), ownP = unitId(food.up), cooked = null;
    if (state && (food.cooked === 'نيء' || food.cooked === 'مطبوخ') && state !== food.cooked) cooked = 'الوصفة تقول «' + state + '» بينما الصنف في قاعدتك محسوب «' + food.cooked + '»؛ تحقق قبل الاعتماد';
    var e = null, how = '';
    if (unit === 'g') { e = qty / food.gpe; how = 'جرام ÷ ' + Math.round(food.gpe * 10) / 10 + ' جم للحصة'; }
    else if (unit && (unit === ownU || unit === ownP)) { e = qty / food.upe; how = qty + ' ' + food.us + ' ÷ ' + Math.round(food.upe * 1000) / 1000 + ' للحصة'; }
    else if (unit && /^نصف /.test(ownU) && unit === ownU.replace(/^نصف /, '')) { e = (qty * 2) / food.upe; how = qty + ' ' + food.us.replace(/^نصف /, '') + ' = ' + qty * 2 + ' «' + food.us + '» ÷ ' + Math.round(food.upe * 1000) / 1000 + ' للحصة'; }
    else if (!unit && !MEASURE[ownU]) { e = qty / food.upe; how = 'افتُرضت وحدة الصنف «' + food.us + '»'; return finish(e, how, 'الوحدة غير مذكورة؛ افترضتُ «' + food.us + '» حسب قاعدتك', cooked); }
    else if (unit === 'ملعقه' || (unit === 'حبه' && /^حبه /.test(ownU)) || (unit === 'قطعه' && /^قطعه /.test(ownU))) return { ok: false, reason: 'الوحدة «' + (unit === 'ملعقه' ? 'ملعقة' : unit) + '» غير محددة الحجم؛ وحدة الصنف في قاعدتك «' + food.us + '». حدّد الحجم أو استعمل الجرام' };
    else return { ok: false, reason: 'الوحدة لا تطابق وحدة الصنف («' + food.us + '») ولا الجرام؛ لا أحوّل بين الوحدات من عندي. أدخل الحصص يدوياً أو بالجرام' };
    return finish(e, how, null, cooked);
    function finish(e, how, note, cookedMsg) { var r = Math.max(0.5, Math.round(e * 2) / 2); return { ok: true, e: e, eR: r, how: how, notes: [note, cookedMsg, Math.abs(r - e) > 0.15 ? 'قُرِّبت الحصص من ' + Math.round(e * 100) / 100 + ' إلى ' + r : null].filter(Boolean), cooked: !!cookedMsg }; }
  };
  // ---- الدور (كربوهيدرات/بروتين/خضار/دهون/اختياري) من واقع بنك الوجبات نفسه
  R.roleFor = function (D, food) {
    if (!D._roleByG) { var c = {}; var fbn = {}; D.foods.forEach(function (f) { fbn[f.n] = f; }); (D.bank || []).forEach(function (b) { b.ing.forEach(function (i) { var f = fbn[i.n]; if (!f) return; (c[f.g] = c[f.g] || {})[i.role] = ((c[f.g] || {})[i.role] || 0) + 1; }); }); var m = {}; Object.keys(c).forEach(function (g) { m[g] = Object.keys(c[g]).sort(function (a, b) { return c[g][b] - c[g][a]; })[0]; }); try { Object.defineProperty(D, '_roleByG', { value: m, writable: true, configurable: true, enumerable: false }); } catch (e) { } }
    return (D._roleByG && D._roleByG[food.g]) || 'اختياري';
  };
  // ---- التحليل الكامل
  R.parse = function (D, text) {
    var fbn = {}; D.foods.forEach(function (f) { fbn[f.n] = f; });
    return R.splitLines(text).map(function (raw, k) {
      var p = R.parseLine(raw, D), row = { id: k, raw: raw, qty: p.qty, unit: p.unit, unitRaw: p.unitRaw, nameRaw: p.name, state: p.state, food: null, candidates: [], status: 'missing', reason: '', e: null, eR: null, how: '', notes: [], role: 'اختياري', include: true };
      if (!p.name) { row.reason = 'لم أفهم اسم المكوّن'; return row; }
      var nn = norm(p.name), m = R.match(D, p.name);
      if (p.unitRaw && !MEASURE[p.unit] && !p.nameFromUnit && m.exact.length !== 1) { var m1 = R.match(D, p.unitRaw + ' ' + p.name); if (m1.exact.length || (!m.exact.length && m1.close.length)) m = m1; }          // «2 بيضة كاملة»: وحدة العدّ جزء من اسم الصنف
      if (!m.exact.length && !m.close.length && (FREE.indexOf(nn) >= 0 || FREE.indexOf(strip(nn)) >= 0)) { row.status = 'skip'; row.reason = 'توابل/ماء: لا حصص عادةً (تُتجاهل ما لم تُدخلها أنت)'; row.include = false; return row; }
      if (!m.exact.length && !m.close.length && p.clean && p.clean !== p.name) { var m2 = R.match(D, p.clean); if (m2.exact.length || m2.close.length) m = m2; }
      if (m.exact.length === 1) row.food = m.exact[0];
      else if (m.exact.length > 1) { row.candidates = m.exact; row.status = 'ambiguous'; row.reason = 'أكثر من صنف بالاسم نفسه'; return row; }
      else if (m.close.length === 1) { row.food = m.close[0]; row.fuzzy = true; }
      else if (m.close.length > 1) { row.candidates = m.close.slice(0, 8); row.status = 'ambiguous'; row.reason = 'عدة أصناف تطابق «' + p.name + '»: اختر واحداً'; return row; }
      else { row.candidates = m.sugg; row.status = 'missing'; row.reason = 'يحتاج إضافة: لا صنف بهذا الاسم في قاعدتك' + (m.sugg.length ? ' (أقرب الأسماء: ' + m.sugg.join('، ') + ')' : ''); return row; }
      return R.resolve(D, row, row.food, fbn);
    });
  };
  // يُستدعى أيضاً عند اختيار المستخدم صنفاً يدوياً
  R.resolve = function (D, row, foodName, fbn) {
    fbn = fbn || (function () { var m = {}; D.foods.forEach(function (f) { m[f.n] = f; }); return m; })(); var f = fbn[foodName];
    if (!f) { row.food = null; row.status = 'missing'; row.e = row.eR = null; row.reason = 'الصنف غير موجود في القاعدة'; return row; }
    row.food = f.n; row.role = R.roleFor(D, f); var c = R.calc(f, row.qty, row.unit, row.state);
    if (!c.ok) { row.status = 'review'; row.reason = c.reason; row.e = row.eR = null; row.how = ''; row.notes = []; return row; }
    row.e = c.e; row.eR = c.eR; row.how = c.how; row.notes = c.notes; row.reason = c.notes.join(' • ');
    row.status = (c.cooked || row.fuzzy || c.notes.some(function (x) { return /افترضتُ/.test(x); })) ? 'review' : 'ok'; if (row.fuzzy && !row.reason) row.reason = 'تطابق جزئي مع «' + f.n + '»: تأكد'; return row;
  };
  R.manual = function (row, eR) { row.eR = Math.max(0.5, Math.round(eR * 2) / 2); row.e = row.eR; row.how = 'أدخلتَها يدوياً'; row.status = row.food ? 'ok' : row.status; row.reason = ''; return row; };
  // ---- تجميع المكوّنات (دمج المكرر) وبناء وجبة
  R.ingredients = function (rows) { var m = {}, order = []; rows.forEach(function (r) { if (!r.include || !r.food || !(r.eR > 0)) return; if (!m[r.food]) { m[r.food] = { n: r.food, e: 0, role: r.role }; order.push(r.food); } m[r.food].e += r.eR; }); return order.map(function (k) { m[k].e = Math.max(0.5, Math.round(m[k].e * 2) / 2); return m[k]; }); };
  R.blockers = function (rows) { return rows.filter(function (r) { return r.include && (r.status === 'missing' || r.status === 'ambiguous' || (r.status === 'review' && !r.confirmed) || !(r.eR > 0) && r.status !== 'skip'); }); };
  R.toMeal = function (rows, meta) { return { id: meta.id, n: String(meta.n || '').trim(), m: meta.m.map(function (x) { return x ? 1 : 0; }), scal: 1, max: 4, min: 0, on: 1, ing: R.ingredients(rows), note: meta.note || '', time: meta.time || '', custom: 1 }; };
  if (typeof module !== 'undefined' && module.exports) module.exports = R; else root.DPRecipe = R;
})(typeof window !== 'undefined' ? window : globalThis);
