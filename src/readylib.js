// ================= مكتبة الأنظمة الجاهزة (0.42): اختيار النظام الأمثل + بديلين + المتوقع من كل نظام
// مشترك بين «حصة» (الأخصائي) و«حصتي» (العميل). البيانات من مكتبة المالك (src/readylib/index.json) — مكتبة المنتجات مستبعدة.
// قواعد الأهلية والمستويات مأخوذة من أدلة الأخصائي في المكتبة؛ والمتوقع تقديري ويُعرض على الأخصائي قبل الاعتماد.
(function (root) {
  'use strict';
  var RL = { idx: null };
  var FLOOR = { f: 1200, m: 1500 };
  var PAL = [1.2, 1.375, 1.55, 1.725, 1.9];
  RL.GOALS = [['lose', 'أنزل وزني', '⬇️'], ['gain', 'أزوّد وزني', '⬆️'], ['bulk', 'أبني عضل', '💪'], ['cut', 'أنشّف وأحافظ على عضلي', '🏋️'], ['maintain', 'خلّصت حميتي وعايز أثبّت وزني', '⚖️'], ['plateau', 'وزني ثابت ومش بينزل', '⏸️']];
  // الأسئلة: سؤال واحد في كل صفحة في «حصتي»، ونفسها مضغوطة في «حصة». when(a, P) يقرر ظهور السؤال
  RL.Q = [
    { id: 'sex', q: 'أنت…', type: 'one', opts: [['f', 'أنثى', '👩'], ['m', 'ذكر', '👨']], when: function (a, P) { return !P.sex; } },
    { id: 'age', q: 'كم عمرك؟', type: 'num', min: 6, max: 90, unit: 'سنة', when: function (a, P) { return !P.age; } },
    { id: 'wt', q: 'كم وزنك الآن؟', type: 'num', min: 15, max: 300, unit: 'كجم', when: function (a, P) { return !P.wt; } },
    { id: 'ht', q: 'كم طولك؟', type: 'num', min: 90, max: 230, unit: 'سم', when: function (a, P) { return !P.ht; } },
    { id: 'goal', q: 'ما هدفك الأساسي؟', type: 'one', opts: RL.GOALS, when: function (a, P) { return adult(P); } },
    { id: 'region', q: 'أي أكل أقرب لبيتك؟', sub: 'نختار لك أكلات مألوفة وسهلة', type: 'one', opts: [['eg', 'مصري', '🇪🇬'], ['sa', 'سعودي وخليجي', '🇸🇦']] },
    { id: 'cond', q: 'هل ينطبق عليك شيء من هذا؟', sub: 'اختر كل ما ينطبق، أو «لا شيء»', type: 'many', opts: [['glp1', 'آخذ إبر تنحيف (أوزمبيك، مونجارو…)', '💉'], ['ir', 'مقاومة إنسولين أو ما قبل السكري أو تكيّس', '🩸'], ['diab', 'سكري وآخذ أنسولين أو أقراص سكر', '💊'], ['ibs', 'قولون عصبي مشخّص من طبيب', '🌀'], ['kidney', 'مرض في الكلى', '🫘'], ['preg', 'حامل أو مرضعة', '🤰'], ['ed', 'عانيت من اضطراب أكل (نهم أو تقيؤ متعمّد)', '🧠']], none: 'لا شيء', when: function (a, P) { return adult(P); } },
    { id: 'concern', q: 'هل يهمك مع النزول؟', type: 'one', opts: [['hair', 'تقوية الشعر وتقليل التساقط', '💇‍♀️'], ['skin', 'صفاء البشرة وحب الشباب', '✨'], ['none', 'لا، المهم النزول', '👍']], when: function (a, P) { return P.sex === 'f' && a.goal === 'lose' && adult(P) && !has(a.cond, 'glp1'); } },
    { id: 'veg', q: 'هل تأكل لحوم ودجاج وسمك؟', type: 'one', opts: [['no', 'نعم، آكلها', '🍗'], ['yes', 'لا، نباتي مع ألبان', '🥗']], when: function (a, P) { return a.goal === 'lose' && adult(P) && !has(a.cond, 'glp1'); } },
    { id: 'style', q: 'أي أسلوب يريحك أكثر؟', type: 'one', opts: [['fixed', 'نظام ثابت كل يوم', '📅'], ['vary', 'أيام أعلى وأيام أقل (مرونة للعزايم)', '🔁'], ['lowcarb', 'نشويات أقل', '🥩'], ['keto', 'كيتو بدون رز ولا خبز', '🥑'], ['med', 'متوسطي (سمك وزيت زيتون)', '🐟'], ['volume', 'آكل كمية كبيرة بسعرات قليلة', '🥗'], ['protein', 'بروتين أعلى يشبعني', '🍳']], when: function (a, P) { return a.goal === 'lose' && adult(P) && a.veg !== 'yes' && !has(a.cond, 'glp1') && !has(a.cond, 'ibs'); } },
    { id: 'cut', q: 'تحب التنشيف يكون إزاي؟', type: 'one', opts: [['cut', 'نزول دهون بعجز واضح', '🔥'], ['recomp', 'إعادة تشكيل: عضل أكثر ودهون أقل ببطء', '🔄'], ['cycle', 'كارب أعلى في أيام التمرين', '🔁']], when: function (a) { return a.goal === 'cut'; } },
    { id: 'train', q: 'إمتى بتتمرن غالباً؟', type: 'one', opts: [['evening', 'مساءً', '🌙'], ['morning', 'صباحاً', '🌅'], ['3days', '3 أيام في الأسبوع فقط', '📆']], when: function (a) { return a.goal === 'bulk' || a.goal === 'cut'; } },
    { id: 'why', q: 'إيه أقرب وصف لحالتك؟', type: 'one', opts: [['tired', 'تعبت وجعت ومليت بعد شهور حمية', '😮‍💨'], ['train', 'بتمرن وعايز أكمل العجز', '🏃'], ['lostmuch', 'نزلت كتير من آخر مرة اتحسبت سعراتي', '📉'], ['water', 'انتفاخ أو تورّم أو قبل الدورة أو أكل مملّح', '💧']], when: function (a) { return a.goal === 'plateau'; } },
    { id: 'prev', q: 'نزلت وزنك إزاي؟', type: 'one', opts: [['regular', 'حمية عادية', '🥗'], ['glp1', 'إبر تنحيف GLP-1', '💉'], ['sleeve', 'عملية تكميم', '🏥'], ['vlc', 'حمية قاسية جداً (أقل من 1000 سعرة)', '⚠️']], when: function (a) { return a.goal === 'maintain'; } },
    { id: 'last', q: 'كانت حميتك الأخيرة كام سعرة تقريباً؟', type: 'one', opts: [['1000', 'حوالي 1000', ''], ['1200', 'حوالي 1200', ''], ['1400', 'حوالي 1400', ''], ['1600', 'حوالي 1600', ''], ['1800', 'حوالي 1800', ''], ['2000', '2000 أو أكثر', ''], ['0', 'مش عارف', '🤷']], when: function (a) { return a.goal === 'maintain' || a.goal === 'plateau'; } },
    { id: 'act', q: 'حركتك اليومية؟', type: 'one', opts: [['0', 'قليلة (مكتب وبيت)', '🪑'], ['1', 'خفيفة: مشي أو رياضة 1–3 أيام', '🚶'], ['2', 'متوسطة: رياضة 3–5 أيام', '🏃'], ['3', 'عالية: رياضة 6–7 أيام', '🏋️']], when: function (a, P) { return P.pal == null; } },
    { id: 'routine', q: 'يومك شكله إيه؟', sub: 'نختار شكل النظام اللي يناسب يومك', type: 'one', opts: function (a, P) { return routineOpts(a, P); } }
  ];
  function has(a, k) { return !!a && a.indexOf(k) >= 0; }
  function adult(P) { return !(P.age && P.age < 18); }
  function routineOpts(a, P) {
    if (P.age < 12) return [['classic', 'أكل البيت', '🏠'], ['lunchbox', 'علبة المدرسة', '🎒'], ['family', 'أكل العائلة والمشويات', '🍢'], ['picky', 'طفل انتقائي في الأكل', '🙅'], ['budget', 'ميزانية محدودة', '💰']];
    if (P.age < 18) return [['classic', 'أكل البيت', '🏠'], ['lunchbox', 'مدرسة وأكل من البيت', '🎒'], ['athletic', 'رياضي ويتمرن', '⚽'], ['outside', 'بياكل برّه كتير', '🍔'], ['budget', 'ميزانية محدودة', '💰']];
    var o = [['classic', 'أكل البيت التقليدي', '🏠'], ['office', 'شغل أو دراسة ووقت قليل', '💼'], ['family', 'أكل عائلي ومشويات', '🍢'], ['budget', 'ميزانية محدودة', '💰']];
    if (a.goal === 'lose' && a.style === 'vary') o.push(['weekend', 'عزايم وخروجات آخر الأسبوع', '🎉']);
    if (a.goal === 'lose' && (a.style === 'med' || a.style === 'fixed' || !a.style)) o.push(['fish', 'بحب السمك والمشويات', '🐟']);
    if (a.goal === 'lose' && !has(a.cond, 'diab') && !has(a.cond, 'ed')) o.push(['twomeals', 'وجبتين في اليوم بس', '2️⃣']);
    if (a.goal === 'gain' || a.goal === 'bulk') o.push(['sixmeals', 'شهيتي ضعيفة (وجبات صغيرة كثيرة)', '🥄']);
    if (a.veg === 'yes') o.push(['eatout', 'بآكل برّه كتير', '🍽']);
    return o;
  }
  RL.optsOf = function (q, a, P) { return typeof q.opts === 'function' ? q.opts(a || {}, P || {}) : q.opts; };
  RL.questions = function (a, P) { a = a || {}; P = norm(P || {}, a); return RL.Q.filter(function (q) { return !q.when || q.when(a, P); }); };
  RL.use = function (idx) { RL.idx = idx; return RL; };
  RL.fam = function (fk) { return RL.idx && RL.idx.fams[fk]; };
  RL.plan = function (id) { var p = RL.idx.plans; for (var i = 0; i < p.length; i++) if (p[i].i === id) return p[i]; return null; };
  RL.label = function (e) {
    var F = RL.fam(e.f) || {}, t = [F.n];
    if (e.sb && F.subs[e.sb]) t.push(F.subs[e.sb]);
    if (e.fo && F.forms[e.fo]) t.push(F.forms[e.fo]);
    if (e.wk) t.push('الأسبوع ' + e.wk);
    if (e.lc) t.push('اقتصادي');
    t.push((e.kr ? 'متوسط ' : '') + e.k + ' سعرة');
    return t.join(' • ');
  };
  RL.regionTxt = function (rg) { return rg === 'eg' ? 'أكلات مصرية' : rg === 'sa' ? 'أكلات سعودية وخليجية' : 'أكلات متوفرة في مصر والسعودية'; };
  // ---- توحيد بيانات العميل: من «حصة» (sex عربي، activity نصي) أو «حصتي» (act رقم) أو إجابات الأسئلة
  function norm(P, a) {
    a = a || {}; var o = {};
    var sx = a.sex || P.sex; o.sex = sx === 'm' || sx === 'ذكر' ? 'm' : sx === 'f' || sx === 'أنثى' ? 'f' : '';
    o.age = +(a.age || P.age) || 0; o.wt = +(a.wt || P.wt || P.weight) || 0; o.ht = +(a.ht || P.ht || P.height) || 0;
    var pal = P.pal != null ? +P.pal : null;
    if (a.act != null && a.act !== '') pal = PAL[+a.act];
    else if (pal == null && P.act != null && P.act !== '') pal = PAL[+P.act];
    o.pal = pal;
    return o;
  }
  RL.norm = norm;
  RL.energy = function (P) {
    var bmr = 10 * P.wt + 6.25 * P.ht - 5 * P.age + (P.sex === 'm' ? 5 : -161), pal = P.pal || 1.375;
    var bmi = P.ht ? P.wt / Math.pow(P.ht / 100, 2) : 0, ibw = P.ht ? 22 * Math.pow(P.ht / 100, 2) : P.wt;
    return { bmr: Math.round(bmr), pal: pal, tdee: Math.round(bmr * pal), bmi: Math.round(bmi * 10) / 10, ibw: Math.round(ibw), adj: Math.round(ibw + 0.25 * Math.max(0, P.wt - ibw)) };
  };
  function nearest(list, k, key) { var b = null; list.forEach(function (e) { var v = key ? key(e) : e.l || e.k; if (!b || Math.abs(v - k) < Math.abs(b.v - k)) b = { e: e, v: v }; }); return b && b.e; }
  function plansOf(fk, f) { return RL.idx.plans.filter(function (e) { return e.f === fk && (!f || f(e)); }); }
  function famKey(base, rg) { var F = RL.idx.fams; return F[base + '_' + rg] ? base + '_' + rg : F[base + '_sa'] ? base + '_sa' : F[base + '_all'] ? base + '_all' : null; }
  var FORM_FALLBACK = ['classic', 'family', 'office', 'fish', 'lunchbox', 'evening'];
  function pickForm(list, want) {
    var forms = {}; list.forEach(function (e) { if (e.fo) forms[e.fo] = 1; });
    if (want && forms[want]) return want;
    for (var i = 0; i < FORM_FALLBACK.length; i++) if (forms[FORM_FALLBACK[i]]) return FORM_FALLBACK[i];
    return Object.keys(forms)[0] || null;
  }
  // يختار ملفاً من العائلة: المستوى الأقرب للسعرات المستهدفة، والشكل الأقرب لنمط اليوم
  function choose(fk, kcal, a, opt) {
    opt = opt || {};
    var L = plansOf(fk, function (e) { return !e.mx && (!opt.sb || e.sb === opt.sb) && (!opt.sx || e.sx === opt.sx) && (!opt.filter || opt.filter(e)); });
    if (!L.length) return null;
    var fo = opt.fo !== undefined ? opt.fo : pickForm(L, a.routine);
    if (fo) L = L.filter(function (e) { return e.fo === fo; });
    var lc = a.routine === 'budget'; var L2 = L.filter(function (e) { return !!e.lc === lc; }); if (L2.length) L = L2;
    if (opt.floor) { var L3 = L.filter(function (e) { return (e.l || e.k) >= opt.floor; }); if (L3.length) L = L3; }
    return nearest(L, kcal);
  }
  // ---- المتوقع (تقديري) من كل نظام
  var KG = 7700;
  function r1(x) { return Math.round(x * 10) / 10; }
  function rng(w) { return w[0] === w[1] ? 'نحو ' + w[0] : w[0] + '–' + w[1]; }
  RL.expect = function (e, P, en, a) {
    var F = RL.fam(e.f), b = F.b, out = { lines: [] }, d = en.tdee - e.k, wk = d * 7 / KG;
    if (F.goal === 'lose' || b === 'acut' || b === 'acc') {
      if (wk <= 0.05) { out.head = 'ثبات تقريبي في الوزن على هذا المستوى'; out.lines.push('السعرات قريبة من احتياجك؛ يحتاج الأخصائي لخفض المستوى أو زيادة النشاط.'); }
      else {
        var lo = r1(Math.max(0.1, wk * 0.75)), hi = r1(wk * 1.1);
        if (b === 'acut' || b === 'acc') { var cap = r1(P.wt * 0.01); if (hi > cap) hi = cap; if (lo > hi) lo = r1(hi * 0.7); }
        out.wk = [lo, hi]; out.head = 'نزول متوقع ' + rng(out.wk) + ' كجم أسبوعياً';
        out.lines.push('خلال 4 أسابيع: نحو ' + r1(lo * 4) + '–' + r1(hi * 4) + ' كجم، وخلال 12 أسبوعاً: نحو ' + r1(lo * 11) + '–' + r1(hi * 11.5) + ' كجم (يتباطأ تدريجياً).');
      }
      if (b === 'keto') out.lines.push('أول أسبوعين نزول أسرع جزء منه ماء، ثم تتقارب النتائج مع الأنظمة الأخرى.');
      if (b === 'zigzag' || b === 'carbcycle' || b === 'acc') out.lines.push('النزول مقارب للنظام الثابت بنفس المتوسط؛ الميزة المرونة والالتزام.');
      if (b === 'glp1') { out.head = 'النزول يقوده الدواء؛ النظام يحمي عضلك'; out.lines = ['بروتين مرتفع ووجبات صغيرة تقلل فقد الكتلة العضلية والأعراض الهضمية.']; }
      if (b === 'fodmap') out.lines.push('تحسّن أعراض القولون عند معظم المرضى خلال 2–6 أسابيع، ثم إعادة إدخال الأطعمة.');
      if (b === 'hair') out.lines.push('حماية الشعر من تساقط الحمية بتغطية البروتين والحديد والزنك؛ التحسن يظهر بعد 2–3 أشهر.');
      if (b === 'skin') out.lines.push('تحسّن تدريجي للبشرة خلال 8–12 أسبوعاً مع كارب بطيء وبلا سكر مضاف.');
      if (b === 'acut' && e.fo === 'recomp') { out.head = 'إعادة تشكيل: نزول بطيء للدهون مع حفظ أو زيادة العضل'; }
    } else if (b === 'gain' || b === 'bulk') {
      var s = e.k - en.tdee, g = Math.max(0, s * 7 / KG);
      if (b === 'bulk') { var c2 = r1(P.wt * 0.005); g = Math.min(g, c2); }
      out.wk = [r1(Math.max(0.1, g * 0.75)), r1(Math.max(g, 0.1))]; out.head = 'زيادة متوقعة ' + rng(out.wk) + ' كجم أسبوعياً';
      out.lines.push(b === 'bulk' ? 'أغلبها عضل مع تمرين مقاومة متدرّج؛ الفائض الأكبر يزيد الدهون لا العضل.' : 'أغلب الزيادة كتلة غير دهنية مع تمارين المقاومة.');
    } else if (b === 'maint') {
      var last = plansOf(e.f, function (x) { return x.sb === e.sb && !x.lc; }).reduce(function (m, x) { return Math.max(m, x.k); }, 0);
      out.head = 'ثبات الوزن (±0.5 كجم) مع رفع السعرات تدريجياً';
      out.lines.push('من نحو ' + e.k + ' إلى ' + last + ' سعرة خلال الأسابيع المتبقية، والأسبوع الأخير نقطة التثبيت.');
      out.lines.push('أول أسبوعين قد يزيد الوزن 0.5–1 كجم ماء' + (e.sb === 'vlc' ? ' (حتى 2 كجم في هذا البروتوكول)' : '') + '.');
    } else if (b === 'plateau') {
      var T = { 'break': ['أسبوعان على سعرات الاحتياج ثم عودة للعجز', 'تقل الجوع والإرهاق؛ قد يزيد الوزن 0.5–1 كجم ماء مؤقتاً.'], refeed: ['يومان أعلى كارباً أسبوعياً مع استمرار العجز', 'تحسين الأداء والالتزام مع نزول قريب من السابق.'], recalc: ['إعادة حساب السعرات وخفض تدريجي', 'عودة النزول بعد أسبوع الضبط عادة.'], water: ['تخفيف احتباس الماء: ملح أقل وخضار وفاكهة أكثر', 'نزول الماء المحتبس خلال 1–2 أسبوع.'] }[e.sb] || ['', ''];
      out.head = T[0]; out.lines.push(T[1]); out.lines.push('مدة البروتوكول 4 أسابيع ويُقيَّم بمتوسط الوزن والخصر.');
    } else if (b === 'kids') { out.head = 'تثبيت الوزن أو نزول بطيء مع نمو طبيعي في الطول'; out.lines.push('النظام للأسرة كلها، والمتابعة بمنحنى النمو مع طبيب الأطفال.'); }
    else if (b === 'teen') { out.head = 'نزول تدريجي نحو 0.25–0.5 كجم أسبوعياً (بحد أقصى 1 كجم)'; out.lines.push('مع نمو طبيعي؛ التركيز على العادات والنوم والنشاط.'); }
    out.lines.push('تقدير حسابي للاسترشاد؛ يعتمده ويعدّله أخصائيك.');
    return out;
  };
  // ---- الترشيح: الأمثل + بديلان
  RL.recommend = function (a, base) {
    a = a || {}; var P = norm(base || {}, a), en = RL.energy(P), out = { P: P, en: en, top: [], refer: [], warn: [] }, rg = a.region || 'eg';
    var cond = a.cond || [], goal = a.goal || 'lose';
    if (!RL.idx) { out.refer.push('المكتبة غير محمّلة'); return out; }
    if (!P.wt || !P.ht || !P.age || !P.sex) { out.refer.push('نحتاج الوزن والطول والعمر والجنس لاختيار المستوى.'); return out; }
    var cands = [];
    var add = function (fk, e, score, why, caut) { if (!fk || !e) return; cands.push({ fk: fk, e: e, score: score, why: why || [], caut: caut || [] }); };
    if (P.age < 6) { out.refer.push('أقل من 6 سنوات: يحتاج تقييم طبيب الأطفال، ولا توجد أنظمة جاهزة لهذا العمر.'); return out; }
    if (P.age < 18) {                                   // الأطفال والمراهقون: العائلة حسب العمر، والمستوى من الملف نفسه
      var kid = P.age < 12, fk0 = famKey(kid ? 'kids' : 'teen', rg), sx = P.sex;
      var band = function (e) { return e.ag && P.age >= e.ag[0] && (kid ? P.age <= e.ag[1] : P.age < e.ag[1]); };
      var act = (P.pal || 1.375) >= 1.55 ? 'active' : 'low';
      var L = plansOf(fk0, function (e) { return e.sx === sx && band(e) && (kid || e.ac === act); });
      if (!L.length) L = plansOf(fk0, function (e) { return e.sx === sx && band(e); });
      var forms = []; L.forEach(function (e) { if (forms.indexOf(e.fo) < 0) forms.push(e.fo); });
      var first = pickForm(L, a.routine); forms.sort(function (x, y) { return (x === first ? -1 : 0) - (y === first ? -1 : 0); });
      forms.slice(0, 7).forEach(function (fo, i) { var e = L.filter(function (x) { return x.fo === fo; })[0]; add(fk0, e, 100 - i, [i === 0 ? 'يناسب العمر والجنس' + (kid ? '' : ' ومستوى النشاط') + ' ونمط اليوم' : 'شكل آخر بنفس السعرات']); });
      if (a.goal && a.goal !== 'lose') out.warn.push('أنظمة الأطفال والمراهقين في المكتبة لنزول الوزن فقط؛ الأهداف الأخرى يحددها الأخصائي.');
      return finish(out, cands, P, en, a);
    }
    if (has(cond, 'preg')) { out.refer.push('الحمل والرضاعة: لا يبدأ نظام تنحيف أو زيادة إلا بإشراف الطبيب والأخصائي مباشرة.'); return out; }
    if (has(cond, 'ed')) out.warn.push('تاريخ اضطراب أكل: استبعدنا الأنظمة القاسية والمتقلبة، ويُنصح بمتابعة نفسية مع الأخصائي.');
    if (has(cond, 'diab')) out.warn.push('أدوية السكري (أنسولين أو أقراص): أي تقليل كبير للكارب يحتاج تنسيقاً مع الطبيب لتجنب الهبوط.');
    if (has(cond, 'kidney')) out.warn.push('مرض الكلى: البروتين يُضبط مع الطبيب؛ استبعدنا الكيتو والأنظمة عالية البروتين.');
    var floor = FLOOR[P.sex], deficit = Math.min(600, en.tdee * 0.25), tgt = Math.max(floor, en.tdee - deficit);
    out.target = Math.round(tgt);
    if (goal === 'lose') {
      if (en.bmi && en.bmi < 18.5) { out.refer.push('مؤشر كتلة جسمك أقل من 18.5: نزول الوزن غير مناسب؛ ناقش مع أخصائيك زيادة الوزن الصحية.'); return out; }
      if (en.bmi && en.bmi < 20) out.warn.push('وزنك في الحد الأدنى للطبيعي؛ ناقش الهدف مع أخصائيك.');
      var veg = a.veg === 'yes', st = a.style || 'fixed', ir = has(cond, 'ir'), dm = has(cond, 'diab'), ed = has(cond, 'ed'), kd = has(cond, 'kidney');
      if (has(cond, 'glp1')) {
        var fg = famKey('glp1', rg), lv = en.adj < 63 ? 1000 : en.adj < 67 ? 1200 : en.adj < 76 ? 1400 : 1600;
        if (P.sex === 'm' && lv < 1200) lv = 1200;
        add(fg, choose(fg, lv, a), 300, ['مصمّم لمرحلة الجرعة الثابتة من أدوية GLP-1', 'المستوى حسب الوزن المعدّل (' + en.adj + ' كجم) لهدف بروتين 1.2–1.5 جم/كجم']);
        var f2 = famKey('glp1', rg), alt = plansOf(f2, function (e) { return e.l === lv && e.fo !== (cands[0] && cands[0].e.fo) && !e.mx; });
        if (alt[0]) add(f2, alt[0], 150, ['شكل آخر من نظام GLP-1 بنفس المستوى']);
        alt.slice(1, 6).forEach(function (e, i) { add(f2, e, 140 - i, ['شكل آخر من نظام GLP-1 بنفس المستوى']); });
        return finish(out, cands, P, en, a);
      }
      if (veg) { var fv = famKey('veg', rg); add(fv, choose(fv, tgt, a), 300, ['بدون لحوم ولا دواجن ولا أسماك ولا بيض، مع الألبان والبقوليات']); var vs = plansOf(fv, function (e) { return cands[0] && e.l === cands[0].e.l && e.fo !== cands[0].e.fo; }); if (vs[0]) add(fv, vs[0], 120, ['شكل آخر نباتي بنفس المستوى']); vs.slice(1, 6).forEach(function (e, i) { add(fv, e, 110 - i, ['شكل نباتي آخر']); }); return finish(out, cands, P, en, a); }
      if (has(cond, 'ibs')) { var ff = famKey('fodmap', rg); add(ff, choose(ff, tgt, a), 250, ['منخفض الفودماب لمرحلة الحذف (2–6 أسابيع) مع عجز معتدل', 'للقولون العصبي المشخّص من طبيب']); var fgi = plansOf(ff, function (e) { return e.fo === 'gi' && cands[0] && e.l === cands[0].e.l; })[0]; if (fgi && cands[0] && cands[0].e !== fgi) add(ff, fgi, 140, ['شكل بألياف ذائبة أكثر للإمساك أو الإسهال']); }
      if (P.sex === 'f') { var fh = famKey('hair', rg); add(fh, choose(fh, Math.min(tgt, 1700), a, { floor: 1200 }), a.concern === 'hair' ? 200 : 12, ['نزول وزن مع تغطية الحديد والبروتين والزنك المرتبطة بالشعر']); }
      if (P.sex === 'f') { var fs = famKey('skin', rg); add(fs, choose(fs, Math.min(tgt, 1700), a, { floor: 1200 }), a.concern === 'skin' ? 200 : 10, ['كارب بطيء الامتصاص وبلا سكر مضاف لدعم البشرة']); }
      // العجز المحسوب (سعودي فقط): الشكل حسب الأسلوب
      var dsb = { protein: 'protein', volume: 'volume', med: 'med' }[st] || 'balanced';
      var fd = famKey('deficit', rg), DW = { balanced: 'سعرات ثابتة بعجز محسوب، وكل المجموعات الغذائية', protein: 'بروتين أعلى للشبع وحفظ العضل', volume: 'كميات كبيرة بسعرات قليلة (خضار وشوربة)', med: 'نمط متوسطي: سمك وبقوليات وزيت زيتون' };
      ['balanced', 'protein', 'volume', 'med'].forEach(function (sb) { if (kd && sb === 'protein') return; add(fd, choose(fd, tgt, a, { sb: sb, fo: null }), (sb === dsb ? 60 + (st === dsb || (st === 'fixed' && dsb === 'balanced') ? 35 : 0) : 22) - (rg === 'eg' ? 12 : 0), [DW[sb]].concat(rg === 'eg' ? ['أكلاته سعودية وخليجية (متوفرة غالباً في مصر)'] : [])); });
      if (!ed) {
        var fz = famKey('zigzag', rg); add(fz, choose(fz, tgt, a, { filter: function (e) { return !(dm && e.fo === 'twomeals'); } }), 30 + (st === 'vary' ? 45 : 0) - (dm ? 25 : 0), ['أيام منخفضة وأيام مرتفعة بنفس المتوسط الأسبوعي'], dm ? ['السكري على الأدوية: الأفضل نظام ثابت الكارب'] : []);
        var fc = famKey('carbcycle', rg); add(fc, choose(fc, tgt, a), 30 + (st === 'vary' ? 40 : 0) + (a.routine === 'weekend' ? 15 : 0) - (dm ? 30 : 0), ['البروتين ثابت والكارب يتغير حسب اليوم'], dm ? ['تغير الكارب بين الأيام يغيّر السكر؛ تنسيق مع الطبيب'] : []);
      }
      var fl = famKey('lowcarb', rg), lsb = (st === 'lowcarb' && (ir || !dm)) ? (ir ? 'strict' : 'moderate') : 'moderate';
      if (st === 'lowcarb' && !ir && !dm) lsb = 'moderate';
      add(fl, choose(fl, tgt, a, { sb: lsb, fo: ir ? 'ir' : undefined }), 35 + (ir ? 55 : 0) + (st === 'lowcarb' ? 45 : 0), ['كارب أقل ' + (lsb === 'strict' ? '(قوي)' : '(معتدل 25–35%)')].concat(ir ? ['شكل خاص لمقاومة الأنسولين وما قبل السكري'] : []), dm ? ['أدوية السكر: تنسيق مع الطبيب قبل البدء'] : []);
      var lsb2 = lsb === 'strict' ? 'moderate' : 'strict'; if (!(dm && lsb2 === 'strict') && !ed) add(fl, choose(fl, tgt, a, { sb: lsb2, fo: ir ? 'ir' : undefined }), 20 + (ir ? 20 : 0), ['كارب أقل ' + (lsb2 === 'strict' ? '(قوي) لفترة 3–6 أشهر' : '(معتدل 25–35%)')]);
      if (!dm && !kd && !ed) { var fk = famKey('keto', rg); add(fk, choose(fk, tgt, a, { fo: null }), 5 + (st === 'keto' ? 80 : 0) - (rg === 'eg' ? 8 : 0), ['كارب 20–30 جم يومياً ودهون عالية لمدة 8–12 أسبوعاً'], ['افحص دهون الدم قبل البدء وبعد 3 أشهر', 'لا يناسب الحمل وأمراض الكلى والكبد والمرارة']); }
      return finish(out, cands, P, en, a);
    }
    if (goal === 'gain') {
      if (en.bmi >= 25) out.warn.push('مؤشر كتلة الجسم ' + en.bmi + ': زيادة الوزن غير مناسبة غالباً؛ راجع الهدف مع أخصائيك.');
      var fgn = famKey('gain', rg), gt = en.tdee + 400, e0 = choose(fgn, gt, a, { floor: en.tdee + (a.routine === 'sixmeals' ? 200 : 300) });
      add(fgn, e0, 100, ['فائض نحو 300–500 سعرة بأطعمة مركزة وحجم صغير']);
      plansOf(fgn, function (e) { return e0 && e.l === e0.l && e.fo !== e0.fo; }).slice(0, 6).forEach(function (e, i) { add(fgn, e, 60 - i, ['شكل آخر بنفس المستوى']); });
      out.target = gt; out.warn.push('قبل البدء: استبعاد الأسباب الطبية للنحافة (الغدة، السكري، القولون…).');
      return finish(out, cands, P, en, a);
    }
    if (goal === 'bulk') {
      var fb = famKey('bulk', rg), bt = en.tdee * 1.1, want = a.routine === 'sixmeals' ? 'sixmeals' : a.routine === 'office' ? 'office' : a.train === 'morning' ? 'morning' : 'evening', b0 = choose(fb, bt, a, { fo: want });
      add(fb, b0, 100, ['فائض صغير نحو 10% وبروتين 1.6–2.2 جم/كجم', 'النظام بالجرام: يوم تمرين ويوم راحة']);
      plansOf(fb, function (e) { return b0 && e.l === b0.l && e.fo !== b0.fo; }).slice(0, 6).forEach(function (e, i) { add(fb, e, 60 - i, ['شكل آخر بنفس المستوى']); });
      out.target = Math.round(bt); return finish(out, cands, P, en, a);
    }
    if (goal === 'cut') {
      var fa = famKey('acut', rg), fcc = famKey('acc', rg), md = a.cut || 'cut', ct = Math.max(FLOOR[P.sex], en.tdee * (md === 'recomp' ? 0.92 : 0.8));
      var tf = a.train === '3days' ? null : a.train === 'morning' ? 'morning' : a.routine === 'office' ? 'office' : 'evening';
      var c1 = choose(fa, ct, a, { fo: md === 'recomp' ? 'recomp' : (tf || 'evening') }), c2x = choose(fcc, ct, a, { fo: a.train === '3days' ? '3days' : (tf || 'evening') });
      var c3 = choose(fa, en.tdee * (md === 'recomp' ? 0.8 : 0.92), a, { fo: md === 'recomp' ? (tf || 'evening') : 'recomp' });
      add(fa, c1, md === 'cycle' ? 70 : 100, [md === 'recomp' ? 'إعادة تشكيل بعجز صغير وبروتين عالٍ' : 'تنشيف بعجز يحفظ العضل (0.5–1% من الوزن أسبوعياً)']);
      add(fcc, c2x, md === 'cycle' ? 100 : 75, ['الكارب يتبع حجم التمرين: يوم عالٍ ومتوسط ومنخفض']);
      add(fa, c3, 60, [md === 'recomp' ? 'تنشيف أسرع إن كان الهدف نزول الدهون' : 'إعادة تشكيل بعجز أصغر']);
      [fa, fcc].forEach(function (fk2, j) { plansOf(fk2, function (e) { return c1 && e.l === (j ? c2x : c1).l && e.fo !== 'recomp'; }).forEach(function (e) { add(fk2, e, 30 - j * 5, ['شكل آخر بنفس المستوى']); }); });
      out.target = Math.round(ct); return finish(out, cands, P, en, a);
    }
    if (goal === 'maintain') {
      var fm = famKey('maint', rg), pv = a.prev || 'regular', last = +a.last || Math.max(floor, en.tdee - 600);
      var W = plansOf(fm, function (e) { return e.sb === pv && !!e.lc === (a.routine === 'budget'); }); if (!W.length) W = plansOf(fm, function (e) { return e.sb === pv && !e.lc; });
      W.sort(function (x, y) { return x.wk - y.wk; });
      var st0 = W.filter(function (e) { return e.k >= last && e.k <= last + 150; })[0] || nearest(W, last + 50, function (e) { return e.k; });
      add(fm, st0, 100, ['بروتوكول ' + RL.fam(fm).subs[pv] + ': ابدأ من الأسبوع الأقرب لسعرات حميتك الأخيرة', 'رفع تدريجي للسعرات حتى نقطة التثبيت']);
      ['regular', 'glp1', 'sleeve', 'vlc'].filter(function (k) { return k !== pv; }).forEach(function (k, i) { var Wk = plansOf(fm, function (e) { return e.sb === k && !e.lc; }); var s = Wk.filter(function (e) { return e.k >= last; }).sort(function (x, y) { return x.wk - y.wk; })[0] || nearest(Wk, last); add(fm, s, 40 - i, ['بروتوكول بديل: ' + RL.fam(fm).subs[k]]); });
      return finish(out, cands, P, en, a);
    }
    if (goal === 'plateau') {
      var fp = famKey('plateau', rg), cur = +a.last || Math.max(floor, en.tdee - 600), map = { tired: 'break', train: 'refeed', lostmuch: 'recalc', water: 'water' }, pk = map[a.why] || 'recalc';
      var lvl = function (k) { var Wp = plansOf(fp, function (e) { return e.sb === k && e.wk === 1 && !!e.lc === (a.routine === 'budget'); }); if (!Wp.length) Wp = plansOf(fp, function (e) { return e.sb === k && e.wk === 1; }); return nearest(Wp, cur); };
      add(fp, lvl(pk), 100, ['البروتوكول المناسب لسبب الثبات', 'المستوى حسب سعرات حميتك الحالية (' + cur + ')']);
      ['break', 'refeed', 'recalc', 'water'].filter(function (k) { return k !== pk; }).forEach(function (k, i) { add(fp, lvl(k), 40 - i * 5, ['بروتوكول بديل حسب السبب']); });
      out.warn.push('تأكد أولاً أنه ثبات حقيقي: 3–4 أسابيع بلا تغير في متوسط الوزن والخصر مع التزام.');
      return finish(out, cands, P, en, a);
    }
    return finish(out, cands, P, en, a);
  };
  function finish(out, cands, P, en, a) {
    var lim = a.limit || 3, F0 = RL.idx.fams;
    if (a.sys) {                                               // نظام العميل في «حصة»: حصص أو جرامات
      var same = cands.filter(function (c) { return F0[c.fk].sys === a.sys; });
      if (same.length) cands = same; else if (cands.length) out.warn.push('لا خطط ' + (a.sys === 'g' ? 'بالجرامات' : 'بالحصص') + ' لهذا الهدف في المكتبة؛ المعروض بالنظام الآخر.');
    }
    cands.sort(function (x, y) { return y.score - x.score; });
    var seen = {}, kinds = {}, top = [];
    var take = function (c) { var F = RL.fam(c.fk); seen[c.e.i] = 1; kinds[F.b + (c.e.sb || '')] = 1; top.push({ id: c.e.i, e: c.e, fam: F.b + (c.e.sb || ''), fk: c.fk, name: F.n, label: RL.label(c.e), region: RL.regionTxt(F.rg), sys: F.sys, who: F.who, note: F.note, when: RL.bestWhen(c.e), why: c.why, caut: c.caut, expect: RL.expect(c.e, P, en, a), score: c.score }); };
    cands.forEach(function (c) { if (top.length < lim && !seen[c.e.i] && !kinds[RL.fam(c.fk).b + (c.e.sb || '')]) take(c); });       // أولاً: أنواع مختلفة
    cands.forEach(function (c) { if (top.length < lim && !seen[c.e.i] && !top.some(function (t) { return t.fk === c.fk && t.e.fo === c.e.fo && t.e.sb === c.e.sb; })) take(c); });
    top.sort(function (x, y) { return y.score - x.score; });
    out.top = top; return out;
  }
  // «الأنسب إذا…»: جملة للأخصائي لكل خيار (العائلة/النوع + شكل اليوم) — مسودة من أدلة المكتبة
  var WHEN = { deficit: 'يبدأ أول مرة أو يريد نظاماً ثابتاً كل يوم بكل المجموعات الغذائية', zigzag: 'ملّ النظام الثابت أو ثبت وزنه 3 أسابيع مع التزام موثّق', carbcycle: 'يحب التنوع ولديه عزائم أو أيام نشاط ثابتة', keto: 'يريد شبعاً أكبر بلا رز ولا خبز لفترة محدودة (8–12 أسبوعاً) وليس على أدوية سكر', glp1: 'يأخذ إبر GLP-1 بجرعة ثابتة وشهيته منخفضة', hair: 'تعاني تساقط الشعر مع الحمية أو بعدها', skin: 'تعاني حب شباب خفيفاً إلى متوسط', fodmap: 'لديه قولون عصبي مشخّص مع انتفاخ أو ألم', veg: 'نباتياً لا يأكل اللحوم ولا البيض ويأكل الألبان', gain: 'نحيفاً أو ضعيف الشهية ويريد زيادة وزن صحية', bulk: 'يتمرن مقاومة بانتظام ويريد زيادة عضلية بأقل دهون', acut: 'رياضياً يريد نزول الدهون مع حفظ العضل', acc: 'رياضياً تختلف شدة تمرينه بين الأيام', kids: 'طفلاً 6–12 سنة بوزن زائد (النظام للأسرة كلها)', teen: 'مراهقاً 12–18 سنة بوزن زائد', maint: 'أنهى التنحيف ويريد تثبيت وزنه', plateau: 'ثبت وزنه رغم الالتزام' };
  var WHEN_SB = { balanced: 'يبدأ أول مرة أو يريد نظاماً متوازناً ثابتاً بلا حرمان من الرز والخبز', protein: 'يجوع كثيراً أو يتمرن ويحتاج حفظ العضل', volume: 'يحب الكميات الكبيرة ويجوع بسرعة', med: 'يحب السمك والبقوليات وزيت الزيتون', moderate: 'يفضّل نشويات أقل باعتدال (الخيار الافتراضي للو كارب)', strict: 'لديه مقاومة أنسولين واضحة أو يفضّل كارباً أقل ويستطيع الالتزام 3–6 أشهر', regular: 'أنهى حمية عادية', glp1: 'أوقف إبر GLP-1 أو خفّض جرعتها', sleeve: 'بعد عملية تكميم وانتهاء مرحلة النزول السريع', vlc: 'خرج من حمية قاسية جداً (أقل من 1000 سعرة)', 'break': 'متعباً وجائعاً وملّ بعد 8–12 أسبوع حمية', refeed: 'يتمرن ويريد استمرار العجز', recalc: 'نزل وزناً كبيراً منذ آخر حساب أو زادت كمياته', water: 'ثباته مع انتفاخ أو تورّم أو قبل الدورة أو أكل مملّح' };
  var WHEN_FO = { classic: 'ويأكل أكل البيت التقليدي', office: 'ويعمل ووقته ضيق ويحتاج أكلاً سريعاً', family: 'ويأكل مع الأسرة ويحب المشويات', fish: 'ويحب السمك والمشويات', budget: 'وميزانيته محدودة', twomeals: 'ولا يحب الفطور أو السناك (وجبتان فقط)', weekend: 'وعزائمه وخروجاته في نهاية الأسبوع', ir: 'ولديه مقاومة أنسولين أو ما قبل السكري', gi: 'ويعاني إمساكاً أو إسهالاً', eatout: 'ويأكل خارج البيت كثيراً', sixmeals: 'وشهيته ضعيفة فيأكل وجبات صغيرة كثيرة', lunchbox: 'ويأخذ علبة أكل للمدرسة', picky: 'وانتقائي في الأكل', athletic: 'ويمارس رياضة', outside: 'ويأكل خارج البيت كثيراً', evening: 'ويتمرن مساءً', morning: 'ويتمرن صباحاً', '3days': 'ويتمرن 3 أيام فقط أسبوعياً', recomp: 'ووزنه قريب من الطبيعي ويريد عضلاً أكثر ودهوناً أقل ببطء' };
  RL.bestWhen = function (e) {
    var F = RL.fam(e.f), b = F.b, t = (e.sb && WHEN_SB[e.sb] && b !== 'deficit' || b === 'deficit') && WHEN_SB[e.sb] ? WHEN_SB[e.sb] : WHEN[b] || '';
    if (b === 'lowcarb') t = WHEN_SB[e.sb] || t; var fo = e.fo && WHEN_FO[e.fo];
    if (e.lc) fo = (fo ? fo + ' ' : '') + 'وميزانيته محدودة';
    var fem = b === 'hair' || b === 'skin'; if (fem && fo) fo = fo.replace('ويأكل', 'وتأكل').replace('ويعمل ووقته ضيق ويحتاج', 'وتعمل ووقتها ضيق وتحتاج').replace('وميزانيته', 'وميزانيتها');
    return (fem ? 'الأنسب إذا كانت العميلة ' : 'الأنسب إذا كان العميل ') + t + (fo ? ' ' + fo : '') + '.';
  };
  // ---- تحويل خطة المكتبة إلى شكل خطة «حصتي» (أيام ← وجبات ← أسطر [مجموعة، صنف، نص، بدائل])
  var GR = ['نشويات', 'بقوليات', 'لحوم وبروتين', 'ألبان', 'خضار', 'فاكهة', 'دهون', 'أخرى'];
  var KW = [[2, 'دجاج|فراخ|صدر|لحم|كفتة|سمك|تونة|سلمون|جمبري|بيض|بياض|عجة|كبدة|ديك رومي|سردين|بلطي|بوري|جبن|جبنة|قريش|لبنة|واي بروتين|بروتين|شاورما|برجر|كباب|حبار|كاليماري|روبيان|مرق'], [3, 'حليب|لبن|زبادي|رايب|كفير'], [1, 'فول|حمص|عدس|لوبيا|فاصوليا بيضاء|فاصوليا حمراء|فاصوليا|بليلة|ترمس|فلافل|طعمية|بيصارة'], [6, 'زيت|زبدة|سمن|سوداني|طحينة|أفوكادو|زيتون|لوز|جوز|عين جمل|فستق|كاجو|مكسرات|بذور|شيا|كتان|مايونيز|قشطة|كريمة'], [5, 'تفاح|برتقال|موز|جوافة|كمثرى|خوخ|عنب|بطيخ|شمام|فراولة|تمر|بلح|مانجو|مانجة|كيوي|يوسفي|رمان|فاكهة|ثمرة تين|حبات تين|مشمش|أناناس|توت|زبيب|برقوق|كنتالوب'], [4, 'خس|خيار|طماطم|جرجير|سلطة|خضار|كوسة|بروكلي|فلفل|جزر|سبانخ|كرنب|ملوخية|بامية|باذنجان|كرفس|قرنبيط|فطر|مشروم|بنجر|لفت|بصل|فاصوليا خضراء|بسلة خضراء'], [0, 'خبز|عيش|رغيف|توست|رز|أرز|مكرونة|معكرونة|شوفان|بطاطس|بطاطا|فريك|برغل|كينوا|ذرة|فشار|صاج|شابورة|بقسماط|كورن|جريش|مرقوق|قرصان|كشري|بسكويت|كعك|عسل|سكر|شوكولاتة|حلاوة|مهلبية|أرز باللبن|بسبوسة|كيك']];
  KW.forEach(function (k) { k[1] = new RegExp(k[1], 'g'); });
  RL.groupOf = function (t) {                // أول كلمة دالّة في النص تحدد المجموعة (الاسم يسبق الإضافات: «زبدة فول سوداني» دهون، «عجة بدون زيت» بروتين)
    t = String(t || '').replace(/\(.*?\)/g, ' '); var best = 7, at = 1e9;
    KW.forEach(function (k) { k[1].lastIndex = 0; var m = k[1].exec(t); if (m && m.index < at) { at = m.index; best = k[0]; } });
    return best;
  };
  RL.toHissati = function (doc, e) {
    var F = RL.fam(e.f), subs = doc.subsArr || (Array.isArray(doc.subs) ? doc.subs : []), byG = {};
    subs.forEach(function (s) { var g = RL.groupOf(s[0]); if (/نشويات/.test(s[0])) g = 0; else if (/بقوليات/.test(s[0])) g = 1; else if (/لحوم|بروتين/.test(s[0])) g = 2; else if (/حليب|ألبان/.test(s[0])) g = 3; else if (/خضار/.test(s[0])) g = 4; else if (/فاكهة/.test(s[0])) g = 5; else if (/دهون/.test(s[0])) g = 6; (byG[g] = byG[g] || []).push.apply(byG[g], s[1] || []); });
    var days = doc.days.map(function (d) {
      return { type: d.t.replace(/^[^-–]*[-–]\s*/, '').replace(/\s*\(.*$/, ''), kcal: d.k, tips: d.tp || [], slots: d.m.map(function (m) {
        var mac = m[2] && m[2].k ? m[2] : null;
        return { name: m[0], type: m[0], time: '', kcal: mac ? Math.round(mac.k) : 0, meal: mac ? 'بروتين ' + Math.round(mac.p) + ' • كارب ' + Math.round(mac.c) + ' • دهون ' + Math.round(mac.f) + ' جم' : '', lines: m[1].map(function (t) {
          var p = t.split(' ◂ '), name = p[0], g = RL.groupOf(name), alts = (byG[g] || []).filter(function (x) { return x !== name; }).slice(0, 6).map(function (x) { return [x, x + ' (بديل بنفس الحصة)']; });
          return [g, name, name + (p[1] ? ' — ' + p[1] : ''), F.sys === 'g' ? [] : alts];
        }) };
      }) };
    });
    return { sys: 'ready', ready: { id: e.i, name: F.n, label: RL.label(e) }, kcal: e.k, pro: e.mac ? e.mac[0] : 0, cho: e.mac ? e.mac[1] : 0, fat: e.mac ? e.mac[2] : 0, water: 2.5, groups: GR, dayNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].slice(0, doc.days.length), days: days };   // اليوم 1 = الأحد (أيام الدراسة والعمل 1–5 ثم الجمعة والسبت في ملفات الأطفال والمراهقين)
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = RL; else root.RL = RL;
})(typeof window !== 'undefined' ? window : this);
