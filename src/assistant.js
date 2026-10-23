/* dt/hamed — مساعد التغذية العلاجية داخل «حصة».
   المبدأ: النموذج (إن وُجد) يفهم الطلب ويُنتج «إجراءً» من قائمة محدودة فقط؛ كل الحسابات والتحقق والتنفيذ يقوم بها محرك التطبيق.
   لا يُنفَّذ شيء على الخطة المحفوظة إلا بعد معاينة واعتماد صريح من الأخصائي. هذه الوحدة نقية (بلا DOM/IndexedDB) وتعمل في المتصفح وNode. */
(function (root) {
  'use strict';
  var A = {}, E = null, D = null;
  A.VERSION = 1;
  A.bind = function (E_, D_) { E = E_ || root.DPEngine; D = D_ || root.DATA; };
  // ------------------------------------------------------------------ أدوات عامة
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  var r1 = function (x) { return Math.round(x * 10) / 10; };
  A.norm = function (s) { return String(s == null ? '' : s).replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\s_]+/g, ' ').trim().toLowerCase(); };
  var norm = A.norm;
  A.hash = function (o) { var s = typeof o === 'string' ? o : JSON.stringify(o), h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  var uid = function () { return Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); };
  var GROUPS = {
    starch: { g: [0], ar: 'النشويات' }, legumes: { g: [1], ar: 'البقوليات' }, meat: { g: [2, 3, 4, 5], ar: 'اللحوم والبروتين' }, vlean: { g: [2], ar: 'اللحوم شديدة الانخفاض بالدهون' }, lean: { g: [3], ar: 'اللحوم قليلة الدهون' }, medium: { g: [4], ar: 'اللحوم متوسطة الدهون' }, high: { g: [5], ar: 'اللحوم عالية الدهون' },
    milk: { g: [6, 7, 8], ar: 'الألبان' }, milkfull: { g: [8], ar: 'الحليب كامل الدسم' }, milklow: { g: [7], ar: 'الحليب قليل الدسم' }, milkskim: { g: [6], ar: 'الحليب خالي الدسم' }, veg: { g: [9], ar: 'الخضار' }, fruit: { g: [10], ar: 'الفاكهة' }, fat: { g: [11], ar: 'الدهون' }, sweets: { g: [12], ar: 'السكريات وغيرها' }
  };
  A.GROUPS = GROUPS;
  var MOVEKEYS = { starch: 0, legumes: 1, vlean: 2, lean: 3, medium: 4, high: 5, milkskim: 6, milklow: 7, milkfull: 8, veg: 9, fruit: 10, fat: 11 };
  var G2KEY = ['starch', 'legumes', 'vlean', 'lean', 'medium', 'high', 'milkskim', 'milklow', 'milkfull', 'veg', 'fruit', 'fat', 'sweets'];
  var plural = function (n, one, two, few, many) { return n === 1 ? one : n === 2 ? two : n <= 10 ? n + ' ' + few : n + ' ' + many; };
  var MEAL_AR = { B: 'الإفطار', L: 'الغداء', D: 'العشاء', S: 'السناك' }, TIDX = { B: 0, L: 1, D: 2, S: 3 };
  var DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var dayName = function (i) { return (D && D.days && D.days[i]) || DAY_NAMES[i]; };
  // ------------------------------------------------------------------ مخطط الإجراءات (قائمة مسموحة فقط) والتحقق منها
  var TYPES = ['replace_food', 'assign_foods', 'move_exchanges', 'set_group_total', 'generate_week', 'improve_variety', 'adapt_for_condition', 'show_diff', 'undo', 'clinical_info'];
  A.ACTION_TYPES = TYPES;
  var bad = function (m) { return { ok: false, message_ar: m }; };
  var str = function (v, max) { return typeof v === 'string' && v.trim().length > 0 && v.length <= (max || 80); };
  var okDays = function (d) { return d === 'all' || (Array.isArray(d) && d.length >= 1 && d.length <= 7 && d.every(function (x) { return Number.isInteger(x) && x >= 0 && x <= 6; })); };
  A.validateAction = function (a) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return bad('الإجراء ليس كائناً صالحاً');
    if (TYPES.indexOf(a.type) < 0) return bad('نوع الإجراء غير مسموح: ' + String(a.type).slice(0, 40));
    var o = { type: a.type };
    var days = function () { if (a.days === undefined || a.days === null) { o.days = 'all'; return true; } if (!okDays(a.days)) return false; o.days = a.days === 'all' ? 'all' : Array.from(new Set(a.days)).sort(); return true; };
    var meal = function (req) { if (a.meal === undefined || a.meal === null || a.meal === '') return !req; if (['B', 'L', 'D', 'S'].indexOf(a.meal) < 0) return false; o.meal = a.meal; return true; };
    switch (a.type) {
      case 'replace_food':
        if (!str(a.from)) return bad('حدّد الصنف المراد استبداله'); o.from = a.from.trim(); if (a.to !== undefined && a.to !== null && a.to !== '') { if (!str(a.to)) return bad('اسم البديل غير صالح'); o.to = a.to.trim(); } else o.to = 'auto';
        if (!meal(false)) return bad('الوجبة يجب أن تكون B أو L أو D أو S'); if (!days()) return bad('الأيام يجب أن تكون 0–6 أو all'); break;
      case 'assign_foods':
        if (!meal(true)) return bad('حدّد الوجبة (B/L/D/S)'); if (!days()) return bad('الأيام غير صالحة');
        if (!Array.isArray(a.assignments) || a.assignments.length < 1 || a.assignments.length > 6) return bad('حدّد من 1 إلى 6 مجموعات للإسناد');
        o.assignments = []; for (var i = 0; i < a.assignments.length; i++) { var s = a.assignments[i]; if (!s || !GROUPS[s.group]) return bad('مجموعة غير معروفة: ' + String(s && s.group).slice(0, 30)); if (!Array.isArray(s.foods) || s.foods.length < 1 || s.foods.length > 4 || !s.foods.every(function (f) { return str(f); })) return bad('أصناف الإسناد غير صالحة'); o.assignments.push({ group: s.group, foods: s.foods.map(function (f) { return f.trim(); }) }); } break;
      case 'move_exchanges':
        if (!(a.group in MOVEKEYS)) return bad('حدّد مجموعة واحدة بعينها للنقل (مثل النشويات أو الفاكهة أو اللحوم قليلة الدهون)'); o.group = a.group; if (['B', 'L', 'D', 'S'].indexOf(a.to) < 0) return bad('حدّد الوجبة الهدف (B/L/D/S)'); o.to = a.to; if (a.from !== undefined && a.from !== null && a.from !== '') { if (['B', 'L', 'D', 'S'].indexOf(a.from) < 0) return bad('الوجبة المصدر غير صالحة'); o.from = a.from; }
        o.amount = a.amount === undefined || a.amount === null ? 1 : a.amount; if (typeof o.amount !== 'number' || !(o.amount >= 0.5 && o.amount <= 4) || Math.round(o.amount * 2) !== o.amount * 2) return bad('الكمية بين 0.5 و4 حصص بمضاعفات 0.5'); if (o.from && o.from === o.to) return bad('المصدر والهدف الوجبة نفسها'); if (!days()) return bad('الأيام غير صالحة'); break;
      case 'set_group_total':
        if (a.group !== 'milk') return bad('تعديل مجموع الحصص مدعوم حالياً للألبان فقط'); o.group = 'milk'; if (typeof a.perDay !== 'number' || !isFinite(a.perDay) || a.perDay < 0 || a.perDay > 6 || Math.round(a.perDay * 2) !== a.perDay * 2) return bad('عدد الحصص اليومي يجب أن يكون بين 0 و6 بمضاعفات 0.5'); o.perDay = a.perDay;
        if (a.subgroup !== undefined && a.subgroup !== null) { if (['full', 'low', 'skim'].indexOf(a.subgroup) < 0) return bad('نوع الحليب: full أو low أو skim'); o.subgroup = a.subgroup; } if (!days()) return bad('الأيام غير صالحة'); break;
      case 'generate_week': if (a.seed !== undefined && a.seed !== null) { if (!Number.isInteger(a.seed) || a.seed < 0 || a.seed > 1e9) return bad('بذرة غير صالحة'); o.seed = a.seed; } break;
      case 'improve_variety': case 'show_diff': case 'undo': break;
      case 'adapt_for_condition': if (!str(a.condition, 60)) return bad('حدّد الحالة الصحية'); o.condition = a.condition.trim(); break;
      case 'clinical_info': if (!str(a.topic, 120)) return bad('حدّد موضوع السؤال'); o.topic = a.topic.trim(); break;
    }
    return { ok: true, action: o };
  };
  // ------------------------------------------------------------------ الأصناف: البحث، النوع، صلاحية قيم الحصة
  var FOOD_ALIAS = { 'رز': 'ارز', 'ارز': 'ارز', 'توست': 'خبز توست', 'بيض': 'بيضه كامله', 'بيضه': 'بيضه كامله', 'فراخ': 'دجاج', 'بطاطس': 'بطاطا', 'طماطم': 'طماطم' };
  var SALAD = ['خيار', 'خس', 'طماطم', 'جرجير', 'فلفل'];
  var stripAl = function (w) { return w.replace(/^ال/, ''); };
  A.kindOf = function (f) { var n = norm(f.n); return /^(حليب|عصير|مشروب|شاي|قهوه|مياه|ماء)/.test(n) ? 'beverage' : 'solid'; };
  A.validExchange = function (f) { return !!(f && +f.upe > 0 && +f.units > 0 && Array.isArray(f.mac) && f.mac.length === 4 && f.mac.every(function (x) { return typeof x === 'number' && isFinite(x); }) && Number.isInteger(f.g) && f.g >= 0 && f.g <= 12 && D.EX[f.g] && Array.isArray(f.m) && f.m.some(function (x) { return x; })); };
  A.statusOf = function (f) { return f && f.custom ? 'unreviewed' : 'baseline'; };      // baseline = من قاعدة البيانات المعتمدة لدى المالك؛ unreviewed = صنف مضاف يدوياً
  var liveFoods = function () { return D.foods.filter(function (f) { return f.on !== 0 && !f.deleted; }); };
  A.resolveFood = function (q) {
    var n = norm(q).split(' ').map(stripAl).filter(Boolean).join(' '); if (!n) return []; if (/^سلط/.test(n)) return SALAD.map(function (w) { return liveFoods().filter(function (f) { return norm(f.n) === w; })[0]; }).filter(Boolean);
    n = FOOD_ALIAS[n] ? norm(FOOD_ALIAS[n]) : n; var wantBev = /حليب|عصير|مشروب|شاي|قهوه/.test(n), out = [];
    liveFoods().forEach(function (f) { var fn = norm(f.n), fnc = fn.replace(/\([^)]*\)/g, '').trim(), sc = -1; if (fnc === n || fn === n) sc = 0; else if (new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)').test(fnc)) sc = 1; else if (fnc.split(' ').map(stripAl).indexOf(n) >= 0) sc = 2; if (sc < 0) return; if (A.kindOf(f) === 'beverage' && !wantBev) return; out.push({ f: f, sc: sc }); });
    return out.sort(function (a, b) { return a.sc - b.sc || a.f.o - b.f.o; }).map(function (x) { return x.f; });
  };
  var byName = function (n) { return E.byName(D)[n]; };
  // ------------------------------------------------------------------ سياق الجلسة: {plan, client}
  var viewDay = function (day) { return { nominal: day.nominal.map(r1), actual: day.actual.slice(0, 3).map(r1), got: day.got.slice(), okNominal: !!day.okNominal }; };
  var touch = function (plan, d) { E.dayStats(plan.days[d], plan.targets, D); };
  var dayList = function (days) { return days === 'all' || !days ? [0, 1, 2, 3, 4, 5, 6] : days; };
  var slotsOfMeal = function (plan, d, meal) { var out = []; plan.days[d].slots.forEach(function (s, k) { if (!meal || s.type === meal) out.push(k); }); return out; };
  A.groupSums = function (plan) { return plan.days.map(function (d) { var g = new Array(13).fill(0); d.slots.forEach(function (sl) { E.actualGroups(sl).forEach(function (v, i) { g[i] += v; }); }); return g; }); };
  var lineView = function (l) { return { name: l.name, g: l.g, e: l.e, text: l.text }; };
  var change = function (plan, d, k, li, before) { var s = plan.days[d].slots[k]; return { day: d, dayName: dayName(d), slot: k, slotName: s.name, line: li, before: before, after: lineView(s.lines[li]) }; };
  var finish = function (action, ses, plan2, changes, issues, title, summary, extra) {
    var touchedDays = Array.from(new Set(changes.map(function (c) { return c.day; }))).sort(), days = touchedDays.map(function (d) { return { day: d, name: dayName(d), before: viewDay(ses.plan.days[d]), after: viewDay(plan2.days[d]) }; });
    days.forEach(function (x) { if (!x.after.okNominal) issues.push({ severity: 'warn', code: 'MACRO_OUT_OF_TOLERANCE', message_ar: x.before.okNominal ? 'بعد التعديل خرجت مجاميع ' + x.name + ' عن الحدود المسموحة للأهداف (كارب/بروتين/دهون).' : 'مجاميع ' + x.name + ' ما زالت خارج الحدود المسموحة للأهداف (كارب/بروتين/دهون) بعد التعديل.' }); });
    if (!changes.length) return info(title, summary + ' — لم أجد ما يمكن تنفيذه، فلن يتغير شيء.', { issues: issues, suggestions: (extra && extra.suggestions) || [], noChange: true });
    var touched = Array.from(new Set(changes.map(function (c) { return c.day + ':' + c.slot; }).concat((extra && extra.touched) || []))); var p = { ok: true, id: uid(), kind: 'change', action: action, title_ar: title, summary_ar: summary, changes: changes, days: days, issues: issues, plan2: plan2, baseHash: A.hash(ses.plan), canApply: changes.length > 0, touched: touched, createdAt: Date.now() };
    if (issues.some(function (i) { return i.severity === 'blocking'; })) p.partial = true; p.hash = A.hash([action, A.hash(plan2)]); if (extra) Object.assign(p, extra); return p;
  };
  var info = function (title, text, extra) { return Object.assign({ ok: true, kind: 'info', id: uid(), title_ar: title, summary_ar: text, changes: [], days: [], issues: [], canApply: false }, extra || {}); };
  var fail = function (code, msg) { return { ok: false, code: code, message_ar: msg }; };
  // لماذا لا يصلح هذا الصنف بديلاً؟ (رسالة محددة بدل «لا يوجد»)
  var whyNot = function (food, line, slotType, cx, fromFood) {
    if (!food) return 'الصنف غير موجود في قاعدة الأصناف المعتمدة';
    if (!A.validExchange(food)) return 'قيمة الحصة لهذا الصنف غير معروفة أو ناقصة في قاعدة البيانات، فلا أستطيع إثبات التكافؤ (يحتاج مراجعة)';
    if (E.POOLS[line.g].indexOf(food.g) < 0) return 'ليس من مجموعة البدائل نفسها (' + D.groups[food.g] + ' مقابل ' + D.groups[line.g] + ')، والاستبدال بين المجموعات يغيّر توزيع الحصص';
    if (A.kindOf(food) !== A.kindOf(fromFood)) return 'نوعه مختلف (' + (A.kindOf(food) === 'beverage' ? 'مشروب' : 'صنف صلب') + ') رغم أنه في المجموعة نفسها';
    if (!food.m[TIDX[slotType]]) return 'غير مسموح به في وجبة ' + MEAL_AR[slotType] + ' بحسب قاعدة الأصناف';
    if (!cx.ok(food) || cx.avoid[food.n]) return 'لا يناسب قيود هذا العميل (حساسية أو استبعاد أو قاعدة سريرية)';
    if (food.n === line.name) return 'هو نفس الصنف الحالي';
    return 'غير متاح كبديل';
  };
  var guardAlts = function (alts, fromFood) { return alts.filter(function (a) { var f = byName(a.name); return f && A.validExchange(f) && A.kindOf(f) === A.kindOf(fromFood); }); };
  // ------------------------------------------------------------------ 1) استبدال صنف
  function proposeReplace(a, ses) {
    var plan2 = clone(ses.plan), cx = E.ctx(plan2.client, D), cands = A.resolveFood(a.from);
    if (!cands.length) return fail('FOOD_NOT_FOUND', 'لم أجد صنفاً باسم «' + a.from + '» في قاعدة الأصناف.');
    var set = {}; cands.forEach(function (f) { set[f.n] = 1; }); var toCands = a.to === 'auto' ? null : A.resolveFood(a.to);
    if (a.to !== 'auto' && !toCands.length) return fail('FOOD_NOT_FOUND', 'لم أجد البديل «' + a.to + '» في قاعدة الأصناف المعتمدة؛ لن أخمّن قيمته.');
    var changes = [], issues = [], matches = [];
    dayList(a.days).forEach(function (d) { slotsOfMeal(plan2, d, a.meal).forEach(function (k) { plan2.days[d].slots[k].lines.forEach(function (l, li) { if (!l.missing && set[l.name]) matches.push({ d: d, k: k, li: li }); }); }); });
    if (!matches.length) return fail('LINE_NOT_FOUND', 'لا يوجد «' + a.from + '» ' + (a.meal ? 'في ' + MEAL_AR[a.meal] : 'في الخطة') + (a.days && a.days !== 'all' ? ' في الأيام المحددة' : '') + ' — لن يتغير شيء.');
    var usedDay = {};
    matches.forEach(function (m) {
      var slot = plan2.days[m.d].slots[m.k], line = slot.lines[m.li], from = byName(line.name), alts = guardAlts(E.alternatives(line, slot.type, plan2, D, 80), from).filter(function (x) { return !set[x.name]; }), pick = null;
      if (a.to === 'auto') { var dayNames = {}; plan2.days[m.d].slots.forEach(function (s) { s.lines.forEach(function (l) { dayNames[l.name] = 1; }); }); pick = alts.filter(function (x) { return x.g === line.g && !dayNames[x.name]; })[0] || alts.filter(function (x) { return !dayNames[x.name]; })[0] || alts[0]; if (!pick) { issues.push({ severity: 'blocking', code: 'NO_VERIFIED_ALTERNATIVE', message_ar: 'لا يوجد بديل معتمد مناسب لـ«' + line.name + '» في ' + dayName(m.d) + ' (' + slot.name + ') — يحتاج مراجعة بشرية.' }); return; } }
      else { pick = alts.filter(function (x) { return toCands.some(function (f) { return f.n === x.name; }); })[0]; if (!pick) { var f0 = toCands[0]; issues.push({ severity: 'blocking', code: 'NOT_EQUIVALENT', message_ar: 'تعذّر استبدال «' + line.name + '» بـ«' + f0.n + '» في ' + dayName(m.d) + ' (' + slot.name + '): ' + whyNot(f0, line, slot.type, cx, from) + '.' }); return; } }
      var food = byName(pick.name); if (A.statusOf(food) === 'unreviewed') issues.push({ severity: 'warn', code: 'UNREVIEWED_FOOD', message_ar: '«' + food.n + '» صنف مضاف يدوياً وغير مراجَع ضمن قاعدة المالك.' });
      var before = lineView(line); E.swap(line, pick, D, plan2.client.alias); changes.push(change(plan2, m.d, m.k, m.li, before)); usedDay[m.d] = 1;
    });
    Object.keys(usedDay).forEach(function (d) { touch(plan2, +d); });
    var uniq = Array.from(new Set(changes.map(function (c) { return c.before.name + ' ← ' + c.after.name; })));
    return finish(a, ses, plan2, changes, issues, 'استبدال «' + a.from + '»' + (a.meal ? ' في ' + MEAL_AR[a.meal] : ''), 'سأستبدل ' + plural(changes.length, 'سطراً واحداً', 'سطرين', 'أسطر', 'سطراً') + ' (' + uniq.slice(0, 3).join('، ') + (uniq.length > 3 ? '…' : '') + ') بأصناف من المجموعة نفسها وبعدد الحصص نفسه. بقية الوجبات دون تغيير.');
  }
  var suggestMove = function (plan, d, meal, gset) {          // أي وجبة أخرى في اليوم فيها أكبر عدد حصص من هذه المجموعة؟ → اقتراح نقل (يحتاج اعتماداً منفصلاً)
    var best = null; plan.days[d].slots.forEach(function (s) { if (s.type === meal) return; var g = E.actualGroups(s); gset.forEach(function (x) { if (g[x] >= 1 && (!best || g[x] > best.n)) best = { n: g[x], g: x, type: s.type }; }); });
    return best ? { action: { type: 'move_exchanges', group: G2KEY[best.g], from: best.type, to: meal, amount: 1, days: [d] }, day: d } : null;
  };
  var mergeSuggestions = function (list) { var m = {}; list.forEach(function (x) { if (!x) return; var k = [x.action.group, x.action.from, x.action.to].join('|'); if (!m[k]) m[k] = { action: Object.assign({}, x.action, { days: [] }) }; m[k].action.days.push(x.day); }); return Object.keys(m).map(function (k) { var a = m[k].action; a.days.sort(); return { action: a, label_ar: 'نقل حصة «' + GROUPS[a.group].ar + '» من ' + MEAL_AR[a.from] + ' إلى ' + MEAL_AR[a.to] + ' (' + a.days.map(dayName).join('، ') + ') ثم أعد الطلب' }; }); };
  // ------------------------------------------------------------------ 2) إسناد أصناف لمجموعات داخل وجبة في أيام محددة
  function proposeAssign(a, ses) {
    var plan2 = clone(ses.plan), cx = E.ctx(plan2.client, D), changes = [], issues = [], touched = {}, touchedSlots = {}, sugg = [];
    dayList(a.days).forEach(function (d) {
      slotsOfMeal(plan2, d, a.meal).forEach(function (k) {
        a.assignments.forEach(function (as) {
          touchedSlots[d + ':' + k] = 1; var gset = GROUPS[as.group].g, slot = plan2.days[d].slots[k], lines = slot.lines.filter(function (l) { return !l.missing && gset.indexOf(l.g) >= 0; });
          if (!lines.length) { issues.push({ severity: 'blocking', code: 'NO_LINES', message_ar: 'لا توجد حصص «' + GROUPS[as.group].ar + '» في ' + MEAL_AR[a.meal] + ' يوم ' + dayName(d) + '؛ لا أستطيع إسناد أصناف إليها دون تغيير توزيع الحصص.' }); sugg.push(suggestMove(plan2, d, a.meal, gset)); return; }
          var wanted = []; as.foods.forEach(function (fn) { var c = A.resolveFood(fn); if (!c.length) issues.push({ severity: 'blocking', code: 'FOOD_NOT_FOUND', message_ar: 'لم أجد «' + fn + '» في قاعدة الأصناف المعتمدة.' }); else wanted.push({ q: fn, cands: c }); });
          if (!wanted.length) return;
          // نقسم السطر إذا كانت الأصناف أكثر من الأسطر وتكفي الحصص
          var guard = 0; while (lines.length < wanted.length && guard++ < 4) { var idx = slot.lines.indexOf(lines[0]), nl = E.splitLine(plan2, d, k, idx, D); if (!nl) break; lines.push(nl); }
          if (lines.length < wanted.length) issues.push({ severity: 'warn', code: 'NOT_ENOUGH_EXCHANGES', message_ar: 'لا تكفي حصص «' + GROUPS[as.group].ar + '» في ' + dayName(d) + ' لإدخال كل الأصناف المطلوبة؛ أُدخل ما أمكن.' });
          lines.forEach(function (line, i) {
            var w = wanted[i % wanted.length], from = byName(line.name), alts = guardAlts(E.alternatives(line, slot.type, plan2, D, 120), from), pick = alts.filter(function (x) { return w.cands.some(function (f) { return f.n === x.name; }); })[0];
            if (line.name === w.cands[0].n || w.cands.some(function (f) { return f.n === line.name; })) return;
            if (!pick) { issues.push({ severity: 'blocking', code: 'NOT_EQUIVALENT', message_ar: 'تعذّر إسناد «' + w.q + '» في ' + dayName(d) + ' (' + slot.name + '): ' + whyNot(w.cands[0], line, slot.type, cx, from) + '.' }); return; }
            var before = lineView(line); E.swap(line, pick, D, plan2.client.alias); changes.push(change(plan2, d, k, slot.lines.indexOf(line), before)); touched[d] = 1;
          });
          slot.edited = true;
        });
      });
    });
    Object.keys(touched).forEach(function (d) { touch(plan2, +d); });
    var gs0 = A.groupSums(ses.plan), gs1 = A.groupSums(plan2); Object.keys(touched).forEach(function (d) { var diff = []; for (var g = 0; g < 13; g++) if (Math.abs(gs0[d][g] - gs1[d][g]) > 1e-9) diff.push(D.groups[g] + ' (' + gs0[d][g] + '←' + gs1[d][g] + ')'); if (diff.length) issues.push({ severity: 'warn', code: 'GROUP_COUNTS_SHIFTED', message_ar: dayName(+d) + ': تغيّر توزيع الحصص بين مستويات الدهون داخل المجموعة المتبادلة: ' + diff.join('، ') + '.' }); });
    return finish(a, ses, plan2, changes, issues, 'تغيير مكوّنات ' + MEAL_AR[a.meal], 'سأعدّل ' + MEAL_AR[a.meal] + ' في ' + Array.from(new Set(changes.map(function (c) { return c.dayName; }))).join('، ') + ' مع الحفاظ على عدد حصص كل مجموعة قدر الإمكان؛ بقية الوجبات والأيام لا تُمسّ.', { suggestions: mergeSuggestions(sugg), touched: Object.keys(touchedSlots).filter(function (x) { var d = +x.split(':')[0], k = +x.split(':')[1]; return JSON.stringify(plan2.days[d].slots[k]) !== JSON.stringify(ses.plan.days[d].slots[k]); }) });
  }
  // ------------------------------------------------------------------ 3) تحديد حصص الحليب اليومية وإعادة توزيع الباقي
  var COMP = [0, 10, 2, 3, 11];                                       // مجموعات التعويض: نشويات، فاكهة، لحوم شديدة الانخفاض، قليلة الدهون، دهون
  function compensate(T, want13, cur13) {                          // بحث صغير شامل: كم نغيّر في مجموعات التعويض لتبقى المجاميع قريبة من الأهداف؟
    var X = D.EX, tol = D.settings.tol, target = [T.cho, T.pro, T.fat], steps = [];
    for (var q = -4; q <= 8; q++) steps.push(q * 0.5);
    var macro = function (c) { var m = [0, 0, 0]; for (var g = 0; g < 13; g++) for (var k = 0; k < 3; k++) m[k] += c[g] * X[g][k]; return m; }, best = null, work = want13.slice();
    (function rec(i, moves) {
      if (i === COMP.length) { var m = macro(work), e = [m[0] - target[0], m[1] - target[1], m[2] - target[2]], score = Math.abs(e[0]) / tol[0] + Math.abs(e[1]) / tol[1] + Math.abs(e[2]) / tol[2] + 0.04 * moves; if (!best || score < best.score) best = { score: score, c: work.slice(), e: e }; return; }
      var g = COMP[i], b0 = want13[g]; for (var j = 0; j < steps.length; j++) { var v = b0 + steps[j]; if (v < 0 || v > cur13[g] + 4) continue; work[g] = v; rec(i + 1, moves + Math.abs(steps[j])); } work[g] = b0;
    })(0, 0);
    return best ? { counts: best.c, err: best.e, ok: Math.abs(best.e[0]) <= tol[0] && Math.abs(best.e[1]) <= tol[1] && Math.abs(best.e[2]) <= tol[2] } : null;
  }
  var PREF_SLOT = { 6: ['B', 'S', 'D', 'L'], 7: ['B', 'S', 'D', 'L'], 8: ['B', 'S', 'D', 'L'], 0: ['L', 'D', 'B', 'S'], 10: ['S', 'B', 'D', 'L'], 2: ['L', 'D', 'B', 'S'], 3: ['L', 'D', 'B', 'S'], 11: ['L', 'D', 'B', 'S'] };
  function allocateDelta(plan2, d, deltas) {                          // يوزّع فرق كل مجموعة على وجبات اليوم ثم يعيد تخطيط الوجبات المتأثرة فقط
    var day = plan2.days[d], tgs = day.slots.map(function (s) { return E.actualGroups(s); }), changed = {};
    Object.keys(deltas).forEach(function (gk) {
      var g = +gk, dl = deltas[g]; if (Math.abs(dl) < 1e-9) return;
      if (dl < 0) { var need = -dl; day.slots.map(function (s, k) { return k; }).sort(function (x, y) { return tgs[y][g] - tgs[x][g]; }).forEach(function (k) { if (need <= 1e-9) return; var t = Math.min(tgs[k][g], need); if (t > 0) { tgs[k][g] -= t; need -= t; changed[k] = 1; } }); }
      else { var order = []; (PREF_SLOT[g] || ['L', 'D', 'B', 'S']).forEach(function (tp) { day.slots.forEach(function (s, k) { if (s.type === tp && order.indexOf(k) < 0) order.push(k); }); }); var has = order.filter(function (k) { return tgs[k][g] > 0; }); var k0 = (has[0] != null ? has[0] : order[0]); tgs[k0][g] += dl; changed[k0] = 1; }
    });
    Object.keys(changed).forEach(function (k) { E.regenSlotG(plan2, d, +k, tgs[k], D); });
    return Object.keys(changed).map(Number);
  }
  var PLAIN = { full: 'حليب كامل الدسم', low: 'حليب قليل الدسم', skim: 'حليب خالي الدسم' };
  function preferPlainMilk(plan2, d, sub) {                       // الطلب «حليب» يعني الحليب نفسه إن كان مسموحاً في الوجبة؛ وإلا يبقى البديل الذي اختاره المخطط من المجموعة
    var want = PLAIN[sub], gOf = { full: 8, low: 7, skim: 6 }[sub], food = byName(want); if (!food) return;
    plan2.days[d].slots.forEach(function (slot) { slot.lines.forEach(function (line) { if (line.missing || line.g !== gOf || line.name === want || !food.m[TIDX[slot.type]]) return; var al = E.alternatives(line, slot.type, plan2, D, 120).filter(function (x) { return x.name === want; })[0]; if (al) E.swap(line, al, D, plan2.client.alias); }); });
  }
  function proposeMilk(a, ses) {
    var plan2 = clone(ses.plan), changes = [], issues = [], T = plan2.targets, sub = a.subgroup || 'full', tgt = { 6: 0, 7: 0, 8: 0 }; tgt[sub === 'full' ? 8 : sub === 'low' ? 7 : 6] = a.perDay;
    dayList(a.days).forEach(function (d) {
      var day = plan2.days[d], cur = new Array(13).fill(0); day.slots.forEach(function (s) { E.actualGroups(s).forEach(function (v, g) { cur[g] += v; }); });
      var want = cur.slice(); want[6] = tgt[6]; want[7] = tgt[7]; want[8] = tgt[8]; if (cur[6] === want[6] && cur[7] === want[7] && cur[8] === want[8]) return;
      var comp = compensate(T, want, cur); if (!comp) { issues.push({ severity: 'blocking', code: 'NO_REDISTRIBUTION', message_ar: 'تعذّر إيجاد إعادة توزيع مناسبة ليوم ' + dayName(d) + '.' }); return; }
      if (!comp.ok) issues.push({ severity: 'warn', code: 'REDISTRIBUTION_APPROX', message_ar: dayName(d) + ': أفضل إعادة توزيع ممكنة تترك فرقاً عن الأهداف (كارب ' + r1(comp.err[0]) + '، بروتين ' + r1(comp.err[1]) + '، دهون ' + r1(comp.err[2]) + ' جم).' });
      var deltas = {}; for (var g = 0; g < 13; g++) { var dl = comp.counts[g] - cur[g]; if (Math.abs(dl) > 1e-9) deltas[g] = dl; }
      var before = day.slots.map(function (s) { return s.lines.map(lineView); }), ks = allocateDelta(plan2, d, deltas); preferPlainMilk(plan2, d, sub); touch(plan2, d);
      ks.forEach(function (k) { var s = plan2.days[d].slots[k], b = before[k]; changes.push({ day: d, dayName: dayName(d), slot: k, slotName: s.name, line: -1, before: { name: b.map(function (l) { return l.text; }).join(' + '), g: -1, e: sum(b.map(function (l) { return l.e; })), text: b.map(function (l) { return l.text; }).join(' + ') }, after: { name: s.lines.map(function (l) { return l.text; }).join(' + '), g: -1, e: sum(s.lines.map(function (l) { return l.e; })), text: s.lines.map(function (l) { return l.text; }).join(' + ') } }); });
    });
    var label = sub === 'full' ? 'كامل الدسم' : sub === 'low' ? 'قليل الدسم' : 'خالي الدسم';
    return finish(a, ses, plan2, changes, issues, 'حليب ' + label + ': ' + a.perDay + ' حصة يومياً', 'سأجعل الألبان ' + a.perDay + ' حصة ' + label + ' يومياً، وأعيد توزيع الفرق على النشويات/الفاكهة/اللحوم قليلة الدهون/الدهون بحيث تبقى مجاميع الكارب والبروتين والدهون قريبة من أهداف العميل. أعرض لك المجاميع قبل وبعد لكل يوم.');
  }
  // ------------------------------------------------------------------ 3ب) نقل حصص مجموعة من وجبة إلى أخرى (مجاميع اليوم ثابتة)
  function proposeMove(a, ses) {
    var plan2 = clone(ses.plan), changes = [], issues = [], gk = MOVEKEYS[a.group];
    dayList(a.days).forEach(function (d) {
      var day = plan2.days[d], dst = null, src = null; day.slots.forEach(function (s, k) { if (dst === null && s.type === a.to) dst = k; });
      if (dst === null) { issues.push({ severity: 'blocking', code: 'NO_TARGET_MEAL', message_ar: 'لا توجد وجبة «' + MEAL_AR[a.to] + '» يوم ' + dayName(d) + '.' }); return; }
      day.slots.forEach(function (s, k) { if (k === dst || (a.from && s.type !== a.from)) return; var n = E.actualGroups(s)[gk]; if (n > 0 && (src === null || n > E.actualGroups(day.slots[src])[gk])) src = k; });
      if (src === null) { issues.push({ severity: 'blocking', code: 'NO_SOURCE', message_ar: 'لا توجد حصص «' + GROUPS[a.group].ar + '» ' + (a.from ? 'في ' + MEAL_AR[a.from] : 'في وجبة أخرى') + ' يوم ' + dayName(d) + ' لنقلها.' }); return; }
      var have = E.actualGroups(day.slots[src])[gk], amt = Math.min(a.amount, have); if (amt < a.amount) issues.push({ severity: 'warn', code: 'MOVE_PARTIAL', message_ar: dayName(d) + ': المتاح للنقل ' + have + ' حصة فقط، سأنقل ذلك.' });
      var backup = clone(day), b0 = day.slots[src].lines.map(lineView), b1 = day.slots[dst].lines.map(lineView), t0 = E.actualGroups(day.slots[src]), t1 = E.actualGroups(day.slots[dst]); t0[gk] -= amt; t1[gk] += amt;
      E.regenSlotG(plan2, d, src, t0, D); E.regenSlotG(plan2, d, dst, t1, D);
      if (day.slots[src].lines.concat(day.slots[dst].lines).some(function (l) { return l.missing; })) { plan2.days[d] = backup; issues.push({ severity: 'blocking', code: 'NO_FOOD_FOR_MEAL', message_ar: 'لا يوجد صنف معتمد من «' + GROUPS[a.group].ar + '» مسموح في ' + MEAL_AR[a.to] + ' (' + dayName(d) + ') — يحتاج مراجعة.' }); return; }
      touch(plan2, d); var tx = function (ls) { return ls.map(function (l) { return l.text; }).join(' + '); };
      [[src, b0], [dst, b1]].forEach(function (x) { var s = plan2.days[d].slots[x[0]]; changes.push({ day: d, dayName: dayName(d), slot: x[0], slotName: s.name, line: -1, before: { name: tx(x[1]), g: -1, e: sum(x[1].map(function (l) { return l.e; })), text: tx(x[1]) }, after: { name: tx(s.lines), g: -1, e: sum(s.lines.map(function (l) { return l.e; })), text: tx(s.lines) } }); });
    });
    return finish(a, ses, plan2, changes, issues, 'نقل ' + a.amount + ' حصة «' + GROUPS[a.group].ar + '» إلى ' + MEAL_AR[a.to], 'سأنقل ' + a.amount + ' حصة من «' + GROUPS[a.group].ar + '» ' + (a.from ? 'من ' + MEAL_AR[a.from] + ' ' : 'من وجبة أخرى ') + 'إلى ' + MEAL_AR[a.to] + '؛ مجموع حصص اليوم والمجاميع الاسمية (حسب الحصص) لا تتغير، وإنما يتغير توزيعها على الوجبات، وقد يتغير الحساب الفعلي قليلاً بحسب الأصناف المختارة في الوجبة الجديدة.');
  }
  // ------------------------------------------------------------------ 4) خطة أسبوعية جديدة
  function proposeGenerate(a, ses) {
    var client = clone(ses.client), plan2 = E.planWeek(client, D, { seed: a.seed == null ? Math.floor(Math.random() * 1e6) : a.seed, phrases: ses.plan && ses.plan.phr }), issues = [];
    plan2.days.forEach(function (d, i) { if (!d.okNominal) issues.push({ severity: 'warn', code: 'DAY_OUT_OF_TOLERANCE', message_ar: dayName(i) + ' خارج حدود الأهداف.' }); });
    var changes = plan2.days.map(function (d, i) { return { day: i, dayName: dayName(i), slot: -1, slotName: 'اليوم كاملاً', line: -1, before: { name: '', g: -1, e: 0, text: 'الخطة الحالية' }, after: { name: '', g: -1, e: 0, text: d.slots.length + ' وجبات' } }; });
    var p = finish(a, ses, plan2, changes, issues, 'خطة أسبوعية جديدة', 'سأولّد خطة لسبعة أيام وفق الحصص المحسوبة لهذا العميل (نفس المحرك والقواعد) وأستبدل بها الخطة الحالية بعد اعتمادك؛ تُحفظ الخطة الحالية كإصدار للتراجع.'); p.days = plan2.days.map(function (d, i) { return { day: i, name: dayName(i), before: ses.plan ? viewDay(ses.plan.days[i]) : null, after: viewDay(d) }; }); return p;
  }
  // ------------------------------------------------------------------ 5) تحسين التنويع مع بقاء توزيع الحصص كما هو
  function proposeVariety(a, ses) {
    var plan2 = clone(ses.plan), cx = E.ctx(plan2.client, D), changes = [], issues = [], use = {}, touched = {}, LIMIT = 14;
    var count = function () { use = {}; plan2.days.forEach(function (d) { d.slots.forEach(function (s) { s.lines.forEach(function (l) { if (!l.missing) use[l.name] = (use[l.name] || 0) + 1; }); }); }); }; count();
    plan2.days.forEach(function (day, d) { day.slots.forEach(function (slot, k) { slot.lines.forEach(function (line, li) {
      if (changes.length >= LIMIT || line.missing || !(use[line.name] >= 4)) return; var from = byName(line.name), inDay = {}; day.slots.forEach(function (s) { s.lines.forEach(function (l) { inDay[l.name] = 1; }); });
      var alts = guardAlts(E.alternatives(line, slot.type, plan2, D, 80), from).filter(function (x) { return x.g === line.g && !inDay[x.name] && (use[x.name] || 0) < use[line.name] - 1; }).sort(function (x, y) { return (use[x.name] || 0) - (use[y.name] || 0); });
      if (!alts.length) return; var before = lineView(line); E.swap(line, alts[0], D, plan2.client.alias); changes.push(change(plan2, d, k, li, before)); touched[d] = 1; count();
    }); }); });
    Object.keys(touched).forEach(function (d) { touch(plan2, +d); }); var same = A.groupSums(plan2).every(function (row, i) { return JSON.stringify(row) === JSON.stringify(A.groupSums(ses.plan)[i]); });
    if (!changes.length) return info('تنويع الخطة', 'الخطة متنوعة بما يكفي: لا يتكرر صنف أربع مرات أو أكثر مع وجود بديل أقل استعمالاً من المجموعة نفسها.');
    return finish(a, ses, plan2, changes, issues, 'تحسين التنويع', 'سأبدّل ' + changes.length + ' سطراً متكرراً بأصناف أقل تكراراً من المجموعة نفسها (نفس عدد الحصص ونفس المجموعة، فيبقى توزيع الحصص اليومي كما هو' + (same ? ' — وقد تحققتُ فعلاً من تطابق مجاميع المجموعات قبل وبعد' : ' — تنبيه: تغيّرت مجاميع بعض المجموعات') + ').');
  }
  // ------------------------------------------------------------------ 6) الحالات الصحية: قواعد معتمدة فقط
  var CONDITIONS = [
    { re: /فرط|جريفز|graves|hyperthyroid/i, label: null, rules: [], ar: 'فرط نشاط الغدة الدرقية' },
    { re: /سكر|diabet/i, label: 'سكري النوع الثاني', rules: ['سكر (مشترك)', 'سكري النوع الثاني'], ar: 'السكري' },
    { re: /مقاومه الانسولين|مقاومة الإنسولين|ما قبل السكري|insulin/i, label: 'مقاومة الإنسولين / ما قبل السكري', rules: ['سكر (مشترك)'], ar: 'مقاومة الإنسولين' },
    { re: /غده|هاشيموتو|خمول|hypothyroid|thyroid|hashimoto/i, label: 'خمول الغدة', rules: ['خمول الغدة'], ar: 'خمول الغدة الدرقية' },
    { re: /فودماب|fodmap/i, label: 'لو فودماب', rules: ['لو فودماب'], ar: 'حمية لو فودماب' },
    { re: /ضغط|hypertens/i, label: null, rules: [], ar: 'ارتفاع ضغط الدم' }, { re: /امساك|إمساك|constip/i, label: null, rules: [], ar: 'الإمساك المزمن' }
  ];
  A.conditionInfo = function (text) { var t = norm(text); for (var i = 0; i < CONDITIONS.length; i++) if (CONDITIONS[i].re.test(t) || CONDITIONS[i].re.test(text)) return CONDITIONS[i]; return null; };
  A.rulesFor = function (c) { return D.rules.filter(function (r) { return c.rules.indexOf(r.cond) >= 0; }); };
  function proposeCondition(a, ses) {
    var c = A.conditionInfo(a.condition);
    if (!c || !c.rules.length) return info('تكييف الخطة: ' + (c ? c.ar : a.condition), 'لا توجد في قاعدة البيانات الحالية قواعد غذائية معتمدة (بمصادر) لحالة «' + (c ? c.ar : a.condition) + '»، ولن أضع قيوداً أو أصنافاً «ممنوعة» من عندي. لإضافة هذه الحالة: أضف قواعدها بمصادرها المعتمدة إلى قاعدة القواعد السريرية، أو أرسل لي المرجع المعتمد لديك فأحوّله إلى قواعد قابلة للمراجعة قبل استعمالها. حتى ذلك الحين تبقى الخطة كما هي.', { status: 'NO_APPROVED_RULES', condition: c ? c.ar : a.condition });
    var client = clone(ses.client); client.conditions = Array.from(new Set((client.conditions || []).concat([c.label]))); var plan2 = clone(ses.plan), pt = { client: client, days: plan2.days, targets: plan2.targets }, rules = A.rulesFor(c), changes = [], issues = [], touched = {}, flagged = [];
    var match = function (name) { var n = norm(name); return rules.filter(function (r) { return n.indexOf(norm(r.kw)) >= 0; }); };
    plan2.days.forEach(function (day, d) { day.slots.forEach(function (slot, k) { slot.lines.forEach(function (line, li) {
      if (line.missing) return; var ms = match(line.name); if (!ms.length) return; var avoid = ms.filter(function (r) { return r.tier === 'تجنّب'; });
      if (!avoid.length) { ms.forEach(function (r) { flagged.push({ day: d, slot: k, name: line.name, tier: r.tier, why: r.why, src: r.src }); }); return; }
      var from = byName(line.name), alts = guardAlts(E.alternatives(line, slot.type, pt, D, 80), from).filter(function (x) { return !match(x.name).some(function (r) { return r.tier === 'تجنّب'; }); }), pick = alts.filter(function (x) { return x.g === line.g; })[0] || alts[0];
      if (!pick) { issues.push({ severity: 'blocking', code: 'NO_VERIFIED_ALTERNATIVE', message_ar: '«' + line.name + '» مخالف لقاعدة معتمدة (' + avoid[0].src + ') ولا يوجد بديل معتمد مناسب في ' + dayName(d) + ' — يحتاج مراجعة.' }); return; }
      var before = lineView(line); E.swap(line, pick, D, plan2.client.alias); changes.push(Object.assign(change(plan2, d, k, li, before), { rule: { tier: avoid[0].tier, why: avoid[0].why, src: avoid[0].src } })); touched[d] = 1;
    }); }); });
    Object.keys(touched).forEach(function (d) { touch(plan2, +d); });
    flagged.slice(0, 12).forEach(function (f) { issues.push({ severity: 'info', code: 'RULE_REDUCE', message_ar: 'قاعدة معتمدة (' + f.tier + '): «' + f.name + '» في ' + dayName(f.day) + ' — ' + f.why + ' [المصدر: ' + f.src + ']. لم أغيّره تلقائياً.' }); });
    if (!changes.length && !issues.length) return info('تكييف الخطة: ' + c.ar, 'راجعتُ الخطة مقابل ' + rules.length + ' قاعدة معتمدة لـ«' + c.ar + '» فلم أجد أصنافاً مخالفة. لا تغيير مقترح.', { status: 'OK' });
    var p = finish(a, ses, plan2, changes, issues, 'تكييف الخطة: ' + c.ar, 'طبّقتُ فقط القواعد المعتمدة (' + rules.length + ' قاعدة بمصادرها) على الخطة: أستبدل الأصناف ذات التصنيف «تجنّب» بأصناف من المجموعة نفسها، وأعرض أصناف «قلّل/وقّت» للتنبيه دون تغيير. هذه إرشادات عامة للتغذية وليست قراراً علاجياً فردياً ولا تغيّر الأدوية.'); p.verifiedRules = rules.length; return p;
  }
  // ------------------------------------------------------------------ 7) معلومات سريرية: بلا ادعاءات غير موثقة
  function proposeClinicalInfo(a) {
    var t = norm(a.topic);
    if (/تستوستيرون|testosterone|هرمون|رجوله/.test(t + ' ' + a.topic)) return info('دعم الهرمونات عبر الغذاء', 'لا أستطيع الادعاء بأن صنفاً بعينه يرفع التستوستيرون. ما يمكنني فعله: تنظيم خطة الرياضي لتغطية الطاقة والبروتين والدهون الكافية وتنويع المصادر ضمن الحصص المحسوبة. قاعدة الأصناف الحالية تحوي الماكروز فقط (لا زنك أو فيتامين د أو غيرهما)، فلا أرجّح بين الأصناف بدعوى المغذيات الدقيقة. أي توصية سريرية فردية (فحوص، مكملات) قرار الأخصائي/الطبيب.', { status: 'NO_UNSUPPORTED_CLAIMS' });
    return info('سؤال سريري', 'أجيب فقط من القواعد المعتمدة في قاعدة البيانات (' + D.rules.length + ' قاعدة بمصادرها لحالات: الغدة الدرقية، السكري/مقاومة الإنسولين، لو فودماب). لا توجد قاعدة معتمدة لموضوع «' + a.topic.slice(0, 60) + '»، ولن أخترع توصية أو مرجعاً. يمكنك إضافة المرجع المعتمد لديك لتحويله إلى قاعدة قابلة للمراجعة.', { status: 'NO_APPROVED_RULES' });
  }
  // ------------------------------------------------------------------ مقارنة خطتين
  A.diffPlans = function (a, b) {
    var out = { lines: [], days: [] };
    for (var d = 0; d < Math.min(a.days.length, b.days.length); d++) {
      var changed = false;
      for (var k = 0; k < Math.max(a.days[d].slots.length, b.days[d].slots.length); k++) {
        var sa = a.days[d].slots[k], sb = b.days[d].slots[k]; if (!sa || !sb) continue; var key = function (l) { return l.name + '|' + l.e; }, ma = {}, mb = {};
        sa.lines.forEach(function (l) { ma[key(l)] = l; }); sb.lines.forEach(function (l) { mb[key(l)] = l; });
        var rem = sa.lines.filter(function (l) { return !mb[key(l)]; }), add = sb.lines.filter(function (l) { return !ma[key(l)]; });
        if (rem.length || add.length) { changed = true; out.lines.push({ day: d, dayName: dayName(d), slot: k, slotName: sb.name, removed: rem.map(lineView), added: add.map(lineView) }); }
      }
      if (changed) out.days.push({ day: d, name: dayName(d), before: viewDay(a.days[d]), after: viewDay(b.days[d]) });
    }
    return out;
  };
  // ------------------------------------------------------------------ تعارض الإجراءات المتعددة في طلب واحد → سؤال توضيح بدل التخمين
  A.checkConflicts = function (actions) {
    var seen = {}, out = null, key = function (a) { return [a.type, a.meal || a.to || '', JSON.stringify(a.days || 'all')].join('|'); };
    var hasGen = actions.some(function (a) { return a.type === 'generate_week'; }), others = actions.filter(function (a) { return a.type !== 'generate_week' && a.type !== 'show_diff' && a.type !== 'clinical_info'; });
    if (hasGen && others.length) return { conflict: true, clarify_ar: 'طلبت خطة أسبوعية جديدة وتعديلات على الخطة الحالية في الوقت نفسه؛ الخطة الجديدة ستلغي التعديلات. هل أولّد الخطة الجديدة أولاً ثم نطبّق التعديلات عليها؟' };
    actions.forEach(function (a) {
      if (out) return;
      if (a.type === 'replace_food') { var k = 'r|' + norm(a.from) + '|' + (a.meal || '') + '|' + JSON.stringify(a.days); if (seen[k] && seen[k] !== norm(a.to)) out = { conflict: true, clarify_ar: 'طلبان متعارضان لاستبدال «' + a.from + '» (' + seen[k] + ' مقابل ' + norm(a.to) + '). أيهما تريد؟' }; seen[k] = norm(a.to); }
      if (a.type === 'set_group_total') { var k2 = 'm|' + JSON.stringify(a.days || 'all'); if (seen[k2] !== undefined && seen[k2] !== a.perDay + (a.subgroup || '')) out = { conflict: true, clarify_ar: 'طلبان متعارضان لحصص الحليب (' + seen[k2] + ' و' + (a.perDay + (a.subgroup || '')) + '). كم حصة تريد بالضبط؟' }; seen[k2] = a.perDay + (a.subgroup || ''); }
      if (a.type === 'assign_foods') { var days = a.days === 'all' ? [0, 1, 2, 3, 4, 5, 6] : a.days; a.assignments.forEach(function (as) { days.forEach(function (d) { var k3 = 'a|' + a.meal + '|' + d + '|' + as.group, v = as.foods.map(norm).join(','); if (seen[k3] && seen[k3] !== v) out = { conflict: true, clarify_ar: 'تعارض: ' + DAY_NAMES[d] + ' (' + MEAL_AR[a.meal] + ') طُلب فيه أكثر من صنف مختلف لمجموعة «' + GROUPS[as.group].ar + '». ما الذي تريده لذلك اليوم؟' }; seen[k3] = v; }); }); }
    });
    return out || { conflict: false };
  };
  // سجل التدقيق: يُحفظ مع نسخة «قبل التنفيذ» ويربط الطلب بالإجراء والاعتماد والنتيجة
  A.auditEntry = function (p, requestText, approval, planBefore, planAfter) { return { id: uid(), ts: Date.now(), by: 'dt/hamed', request: { text: String(requestText || '').slice(0, 500), action: p.action }, title_ar: p.title_ar, summary_ar: p.summary_ar, changes: p.changes.length, touched: p.touched, issues: p.issues.map(function (i) { return { severity: i.severity, code: i.code }; }), proposalId: p.id, proposalHash: p.hash, approval: { at: Date.now(), nonce: approval && approval.nonce }, baseHash: A.hash(planBefore), resultHash: A.hash(planAfter), undone: false }; };
  // ------------------------------------------------------------------ نقطة الدخول: اقتراح إجراء (لا يُغيّر الخطة)
  A.propose = function (action, ses) {
    var v = A.validateAction(action); if (!v.ok) return fail('INVALID_ACTION', v.message_ar); var a = v.action;
    if (!ses || !ses.client) return fail('NO_ACTIVE_CLIENT', 'افتح عميلاً أولاً.');
    var needsPlan = ['replace_food', 'assign_foods', 'move_exchanges', 'set_group_total', 'improve_variety', 'adapt_for_condition'].indexOf(a.type) >= 0; if (needsPlan && !(ses.plan && ses.plan.days)) return fail('NO_PLAN', 'لا توجد خطة لهذا العميل بعد؛ ولّد خطة أولاً أو اطلب «أنشئ خطة أسبوعية».');
    try {
      switch (a.type) {
        case 'replace_food': return proposeReplace(a, ses); case 'assign_foods': return proposeAssign(a, ses); case 'move_exchanges': return proposeMove(a, ses); case 'set_group_total': return proposeMilk(a, ses); case 'generate_week': return proposeGenerate(a, ses);
        case 'improve_variety': return proposeVariety(a, ses); case 'adapt_for_condition': return proposeCondition(a, ses); case 'clinical_info': return proposeClinicalInfo(a, ses);
        case 'show_diff': case 'undo': return info(a.type === 'undo' ? 'التراجع' : 'الفروق', 'يُنفَّذ من سجل التغييرات.', { action: a, special: a.type });
      }
    } catch (e) { return fail('INTERNAL', 'حدث خطأ أثناء إعداد المقترح، ولم يتغير شيء: ' + (e && e.message || e)); }
  };
  // ------------------------------------------------------------------ الاعتماد والتنفيذ (الاعتماد لا يصدر إلا من الواجهة)
  A.mintApproval = function (p, ttlMs) { return { pid: p.id, hash: p.hash, exp: Date.now() + (ttlMs || 10 * 60 * 1000), nonce: uid() }; };
  A.apply = function (p, ses, approval) {
    if (!p || p.kind !== 'change' || !p.canApply) return fail('NOT_APPLICABLE', 'لا يوجد ما يُنفَّذ.');
    if (!approval || approval.pid !== p.id || approval.hash !== p.hash) return fail('APPROVAL_INVALID', 'لا يوجد اعتماد صالح لهذا المقترح.');
    if (Date.now() > approval.exp) return fail('PROPOSAL_EXPIRED', 'انتهت صلاحية الاعتماد؛ راجع المقترح مجدداً.');
    if (A.hash(ses.plan) !== p.baseHash) return fail('PLAN_CHANGED', 'تغيّرت الخطة بعد إعداد المقترح؛ لم أطبّق شيئاً. أعد الطلب.');
    if (A.hash([p.action, A.hash(p.plan2)]) !== p.hash) return fail('PROPOSAL_TAMPERED', 'المقترح تغيّر بعد الإعداد؛ لم أطبّق شيئاً.');
    // حارس النطاق: كل سطر خارج التغييرات المعتمدة يجب أن يبقى كما هو حرفياً (إلا في الإجراءات الشاملة)
    if (['generate_week', 'set_group_total'].indexOf(p.action.type) < 0) { var okSet = {}; (p.touched || []).forEach(function (x) { okSet[x] = 1; }); for (var d = 0; d < ses.plan.days.length; d++) for (var k = 0; k < ses.plan.days[d].slots.length; k++) if (!okSet[d + ':' + k] && JSON.stringify(ses.plan.days[d].slots[k]) !== JSON.stringify(p.plan2.days[d].slots[k])) return fail('SCOPE_VIOLATION', 'المقترح يمس وجبة غير معتمدة؛ أُلغي التنفيذ.'); }
    return { ok: true, plan: clone(p.plan2) };
  };
  // ------------------------------------------------------------------ المحلل المحلي (بلا اتصال): عبارات عربية شائعة → إجراءات
  var NUMW = { 'واحد': 1, 'واحده': 1, 'حصه': 1, 'حصتين': 2, 'اثنين': 2, 'ثلاث': 3, 'ثلاثه': 3, 'نصف': 0.5 };
  var mealOf = function (t) { if (/(^| )(ال)?(افطار|فطور|فطار)/.test(t)) return 'B'; if (/(^| )(ال)?(غداء|غدا)( |$)/.test(t)) return 'L'; if (/(^| )(ال)?(عشاء|عشا)( |$)/.test(t)) return 'D'; if (/(^| )(ال)?(سناك|تصبيره|وجبه خفيفه|وجبات خفيفه)/.test(t)) return 'S'; return null; };
  var daysOf = function (t) { if (/كل الايام|طوال الاسبوع|جميع الايام|كل يوم/.test(t)) return 'all'; var m = { 'الاحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الاربعاء': 3, 'الخميس': 4, 'الجمعه': 5, 'السبت': 6 }, out = []; Object.keys(m).forEach(function (k) { if (t.indexOf(k) >= 0 || t.indexOf(k.replace(/^ال/, '')) >= 0 && k !== 'الاحد') if (out.indexOf(m[k]) < 0) out.push(m[k]); }); return out.length ? out.sort() : 'all'; };
  var restore = function (text, phrase) {                       // يُرجع العبارة بكتابتها الأصلية (مع الهمزات) بعد أن طابقناها بصيغتها الموحَّدة
    var ow = String(text).split(/\s+/), nw = ow.map(function (w) { return stripAl(norm(w)); }), pw = String(phrase).split(' ').map(stripAl), i, j; for (i = 0; i + pw.length <= nw.length; i++) { for (j = 0; j < pw.length && nw[i + j] === pw[j]; j++); if (j === pw.length) return ow.slice(i, i + pw.length).join(' ').replace(/^ال/, ''); } return phrase;
  };
  A.parseLocal = function (text) {
    var t = norm(text); if (!t) return { actions: [], message_ar: 'اكتب طلبك أولاً.' };
    if (/(^|\s)(تراجع|الغ|الغي|ارجع|undo)(\s|$)/.test(t)) return { actions: [{ type: 'undo' }] };
    if (/(الفروق|قارن|ما الذي تغير|اظهر التغييرات|اشرح التغييرات|لماذا غيرت)/.test(t)) return { actions: [{ type: 'show_diff' }] };
    if (/(تستوستيرون|testosterone)/.test(t)) return { actions: [{ type: 'clinical_info', topic: 'التستوستيرون' }] };
    if (/(انشئ|اعمل|ولد|صمم|ابن|سوي)\s.*(خطه|جدول)\s.*(اسبوع|7 ايام|سبعه ايام)|^خطه اسبوعيه/.test(t)) return { actions: [{ type: 'generate_week' }] };
    if (/(^|\s)(تنويع|نوع|نوعي|زد التنويع|حسن التنويع)(\s|$)/.test(t)) return { actions: [{ type: 'improve_variety' }] };
    var ci = A.conditionInfo(text); if (ci && /(كيف|عدل|اضبط|طبق|لمريض|لعميل|خطه|حاله|ملائم|تناسب|وفق)/.test(t)) return { actions: [{ type: 'adapt_for_condition', condition: ci.ar }] };
    if (/(حليب|الالبان)/.test(t) && /(قلل|خفض|انقص|اجعل|خلي|حصه واحده|حصتين|الي \d|الى \d)/.test(t)) {
      var n = (t.match(/(\d+(?:\.\d+)?)\s*(?:حصه|حصص)?/) || [])[1], per = n != null ? +n : null; if (per == null) Object.keys(NUMW).forEach(function (w) { if (per == null && new RegExp('(^| )' + w + '( |$)').test(t)) per = NUMW[w]; }); if (per == null) return { actions: [], clarify_ar: 'كم حصة حليب في اليوم تريد؟ (مثال: حصة واحدة كاملة الدسم)' };
      var act = { type: 'set_group_total', group: 'milk', perDay: per }; if (/كامل/.test(t)) act.subgroup = 'full'; else if (/قليل[ه]? الدسم/.test(t)) act.subgroup = 'low'; else if (/خالي/.test(t)) act.subgroup = 'skim'; var d0 = daysOf(t); if (d0 !== 'all') act.days = d0; return { actions: [act] };
    }
    var mv = t.match(/انقل\s+(?:حصه|حصتين|حصه واحده)?\s*(?:من\s+)?(?:ال)?(نشويات|نشا|خبز|فاكهه|فواكه|خضار|دهون|بقوليات)(?:\s+(?:من\s+)?(.+?))?\s+(?:الي|الى)\s+(.+)/);
    if (mv) { var KEY = { نشويات: 'starch', نشا: 'starch', خبز: 'starch', فاكهه: 'fruit', فواكه: 'fruit', خضار: 'veg', دهون: 'fat', بقوليات: 'legumes' }, fm = mv[2] ? mealOf(mv[2]) : null, tm2 = mealOf(mv[3]); if (tm2) { var mvA = { type: 'move_exchanges', group: KEY[mv[1]], to: tm2, amount: /حصتين/.test(t) ? 2 : 1 }; if (fm) mvA.from = fm; var dm = daysOf(mv[3]); if (dm !== 'all') mvA.days = dm; return { actions: [mvA] }; } }
    var rv = t.match(/(?:استبدل|ابدل|بدل|غير|شيل|احذف|ازل|امسح)\s+(?:صنف\s+)?(.+?)\s+(?:في|من)\s+(.+)/);
    if (rv) { var m2 = mealOf(rv[2]) || mealOf(t), from = rv[1].replace(/^(ال)/, '').trim(), rest = rv[2], to = 'auto'; var tm = rest.match(/(?:^|\s)(?:بـ?|الي|الى|بصنف)\s*(\S.*?)(?:\s+(?:في|من|وخلي|وابق|مع)\s|$)/); if (tm && !/(معتمد|نفس المجموعه|مناسب)/.test(tm[1]) && !/^دل/.test(tm[1])) to = tm[1].replace(/^(ال)/, '').trim(); if (/(بدله|بدلها)/.test(rest) && /(معتمد|نفس المجموعه|مناسب)/.test(rest)) to = 'auto'; if (from && from.length <= 40) { var ac = { type: 'replace_food', from: restore(text, from), to: to === 'auto' ? to : restore(text, to) }; if (m2) ac.meal = m2; var dd = daysOf(rest); if (dd !== 'all') ac.days = dd; return { actions: [ac] }; } }
    return { actions: [], unsupported: true, message_ar: 'لم أفهم الطلب بصيغته الحالية دون اتصال. جرّب أحد الأزرار السريعة (استبدال صنف، خفض الحليب، تنويع الخطة، خطة أسبوعية)، أو فعّل الاتصال بالذكاء الاصطناعي (اختياري) لفهم صيغ أحرّ.' };
  };
  // ------------------------------------------------------------------ الاتصال الاختياري بنموذج لغوي عبر وسيط: إزالة الهوية، وإرسال الحد الأدنى، والتحقق من الرد
  var R = A.remote = {};
  R.scrub = function (text, ses) {
    var s = String(text || ''), n = 0, cl = (ses && ses.client) || {}, rep = function (re, ph) { s = s.replace(re, function () { n++; return ph; }); };
    [cl.name, cl.phone, cl.code].forEach(function (v) { v = String(v || '').trim(); if (v.length >= 2) rep(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[العميل]'); });
    (String(cl.name || '').split(/\s+/)).filter(function (w) { return w.length >= 3; }).forEach(function (w) { rep(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[العميل]'); });
    rep(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[بريد]'); rep(/(?:\+?\d[\s-]?){7,}/g, '[رقم]'); return { text: s.slice(0, 500), removed: n };
  };
  R.payload = function (text, ses) {          // هذا بالضبط ما يغادر الجهاز: نص الطلب بعد إزالة الهوية + أسماء ثابتة لقاموس الإجراءات. لا خطة ولا بيانات عميل.
    var sc = R.scrub(text, ses); return { v: 1, text: sc.text, lang: 'ar', vocab: { actions: TYPES, groups: Object.keys(GROUPS), meals: ['B', 'L', 'D', 'S'], days: DAY_NAMES } };
  };
  R.validateResponse = function (r) {
    if (!r || typeof r !== 'object') return bad('رد غير صالح'); var acts = Array.isArray(r.actions) ? r.actions : []; if (acts.length > 4) return bad('عدد إجراءات كبير');
    var out = []; for (var i = 0; i < acts.length; i++) { var v = A.validateAction(acts[i]); if (!v.ok) return bad('إجراء مرفوض من التحقق: ' + v.message_ar); out.push(v.action); }
    var clarify = typeof r.clarify === 'string' ? r.clarify.slice(0, 300) : ''; if (!out.length && !clarify) return bad('لم يرجع النموذج إجراءً ولا سؤالاً'); return { ok: true, actions: out, clarify: clarify };
  };
  R.call = async function (cfg, text, ses, fetchImpl) {   // cfg: {url, token}
    var f = fetchImpl || (root.fetch && root.fetch.bind(root)); if (!cfg || !cfg.url || !f) return fail('AI_NOT_CONFIGURED', 'الاتصال بالذكاء الاصطناعي غير مفعّل.');
    var ac = typeof AbortController !== 'undefined' ? new AbortController() : null, to = ac ? setTimeout(function () { ac.abort(); }, cfg.timeoutMs || 12000) : null, res;
    try { res = await f(cfg.url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (cfg.token || '') }, body: JSON.stringify(R.payload(text, ses)), signal: ac ? ac.signal : undefined }); }
    catch (e) { if (to) clearTimeout(to); return fail(e && e.name === 'AbortError' ? 'AI_TIMEOUT' : 'AI_OFFLINE', e && e.name === 'AbortError' ? 'تأخّر رد الذكاء الاصطناعي؛ سأستعمل الفهم المحلي.' : 'لا يوجد اتصال بخدمة الذكاء الاصطناعي؛ سأستعمل الفهم المحلي.'); }
    if (to) clearTimeout(to);
    if (res.status === 429 || res.status === 402 || res.status === 503) return fail('AI_QUOTA', 'نفدت الحصة المجانية اليومية للذكاء الاصطناعي (تتجدد 00:00 بتوقيت UTC)؛ سأستعمل الفهم المحلي.');
    if (res.status === 401 || res.status === 403) return fail('AI_AUTH', 'رُفض الاتصال: كود التفعيل غير صالح أو منتهٍ لدى الوسيط.');
    if (!res.ok) return fail('AI_HTTP', 'خدمة الذكاء الاصطناعي أعادت خطأً (' + res.status + ')؛ سأستعمل الفهم المحلي.');
    var j; try { j = await res.json(); } catch (e) { return fail('AI_INVALID', 'رد غير مفهوم من الخدمة؛ سأستعمل الفهم المحلي.'); }
    var v = R.validateResponse(j); if (!v.ok) return fail('AI_INVALID', 'رفضتُ رد النموذج لأنه لا يطابق الإجراءات المسموحة (' + v.message_ar + ')؛ سأستعمل الفهم المحلي.'); return v;
  };
  // المنسّق: الذكاء الاصطناعي إن كان مفعّلاً وموافقاً عليه، وإلا المحلل المحلي. أي فشل يرجع للمحلي دون تعطيل التطبيق.
  A.interpret = async function (text, ses, opts) {
    opts = opts || {}; var notice = '';
    if (opts.ai && opts.ai.url && opts.ai.consent && opts.online !== false) { var r = await R.call(opts.ai, text, ses, opts.fetch); if (r.ok) return { source: 'ai', actions: r.actions, clarify_ar: r.clarify }; notice = r.message_ar; }
    var l = A.parseLocal(text); l.source = 'local'; if (notice) l.notice_ar = notice; return l;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = A; else root.DTHamed = A;
})(typeof window !== 'undefined' ? window : globalThis);
