// ================= استبيانات التسجيل في «زنها» (مشترك بين «زنها Pro» و«زنها» والاختبارات)
// لكل نظام استبيان: الحصص (ex) والجرامات (g). الاستبيان = أقسام (خطوات) فيها أسئلة:
//   - أسئلة أساسية (b:1) لها مكان ثابت في ملف العميل (الاسم، الوزن، جدول التدريب…): يغيّر الأخصائي نصها أو يخفيها، والأساسية جداً (lock) لا تُخفى.
//   - أسئلة مخصّصة يضيفها الأخصائي بأنواع: نص قصير، نص طويل، رقم (بوحدة)، اختيار واحد، اختيار متعدد، نعم/لا، مقياس 1–5. إجاباتها تصل «زنها Pro» كما هي.
//   - أقسام مخصّصة يضيفها ويحذفها، والأقسام الأساسية تُعاد تسميتها أو تُخفى (عدا «بياناتك»).
// الاستبيان المعتمد يُرسل مع رابط الدعوة، فتعرضه «زنها» كما هو.
(function (root, factory) { var api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.HForms = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var TYPES = [['text', 'نص قصير'], ['long', 'نص طويل'], ['num', 'رقم'], ['one', 'اختيار واحد'], ['many', 'اختيار متعدد'], ['yn', 'نعم / لا'], ['scale', 'مقياس 1–5']];
  var B = function (id, label, x) { var q = { id: id, b: 1, label: label }; for (var k in x || {}) q[k] = x[k]; return q; }, L = { lock: 1 };
  var BASIC = function () { return [B('name', 'الاسم الكامل', L), B('phone', 'رقم الجوال', L), B('sex', 'الجنس', L), B('age', 'العمر', L), B('weight', 'الوزن (كجم)', L), B('height', 'الطول (سم)', L)]; };
  // 1.69 (م1ب) أسئلة «الملف المتكامل»: ثابتة المعرّف (x_…) وبأنواع الأسئلة المخصّصة نفسها، فتعرضها حتى نسخ «زنها» القديمة،
  // وتنتقل إجاباتها إلى ملف العميل في «زنها Pro» (c.ix). كلها اختيارية. النصوص معتمدة من المالك 2026-11-27.
  var FQ = ['يومياً', 'أسبوعياً', 'نادراً'];
  var X = function (id, type, label, x) { var q = { id: id, ix: 1, type: type, label: label, req: 0 }; for (var k in x || {}) q[k] = x[k]; return q; };
  var IXQ = {
    x_intol: X('x_intol', 'text', 'أكل يتعبك لكن ليس حساسية (انتفاخ، حرقة…)'),
    x_supp: X('x_supp', 'text', 'مكملات أو فيتامينات تأخذها'),
    x_water: X('x_water', 'one', 'كم كوب ماء تشرب في اليوم تقريباً؟', { opts: ['أقل من 4', '4–6', '7–9', '10 أو أكثر'] }),
    x_out: X('x_out', 'one', 'كم مرة تأكل من خارج البيت في الأسبوع؟', { opts: ['نادراً', '1–2', '3–5', 'يومياً'] }),
    x_f_dairy: X('x_f_dairy', 'one', 'الألبان (حليب، زبادي، جبن)', { opts: FQ, help: 'كم مرة تأكل هذه الأصناف؟' }),
    x_f_veg: X('x_f_veg', 'one', 'الخضار', { opts: FQ }), x_f_fruit: X('x_f_fruit', 'one', 'الفاكهة', { opts: FQ }), x_f_sweet: X('x_f_sweet', 'one', 'الحلويات', { opts: FQ }),
    x_f_sdrink: X('x_f_sdrink', 'one', 'المشروبات المحلّاة (عصائر، غازية)', { opts: FQ }), x_f_fast: X('x_f_fast', 'one', 'الأكل السريع', { opts: FQ }), x_f_caf: X('x_f_caf', 'one', 'القهوة والشاي', { opts: FQ }),
    x_day: X('x_day', 'long', 'صف يوم أكل عادي لك: ماذا تأكل ومتى؟'),
    x_diets: X('x_diets', 'long', 'جرّبت أنظمة غذائية قبل ذلك؟ ماذا حدث؟'),
    x_wmax: X('x_wmax', 'num', 'أعلى وزن وصلت له', { unit: 'كجم' }), x_wmin: X('x_wmin', 'num', 'أقل وزن وصلت له', { unit: 'كجم' }),
    x_wchg: X('x_wchg', 'one', 'هل تغيّر وزنك في آخر 6 أشهر؟', { opts: ['زاد', 'نقص', 'ثابت'] }),
    x_surg: X('x_surg', 'text', 'عمليات جراحية سابقة (منها عمليات السمنة)'),
    x_fam: X('x_fam', 'many', 'أمراض في العائلة؟', { opts: ['السكري', 'الضغط', 'القلب', 'السمنة', 'الغدة', 'لا شيء'] }),
    x_gi: X('x_gi', 'many', 'هل يتكرر معك؟', { opts: ['انتفاخ', 'إمساك', 'إسهال', 'حرقة', 'لا شيء'] }),
    x_cycle: X('x_cycle', 'one', 'للنساء: الدورة الشهرية', { opts: ['منتظمة', 'غير منتظمة', 'انقطعت'], fem: 1 }),
    x_pcos: X('x_pcos', 'one', 'للنساء: تكيس المبايض؟', { opts: ['نعم', 'لا', 'لا أعرف'], fem: 1 }),
    x_sleepH: X('x_sleepH', 'num', 'ساعات نومك عادة', { unit: 'ساعة' }),
    x_sleepQ: X('x_sleepQ', 'one', 'جودة نومك', { opts: ['جيدة', 'متوسطة', 'سيئة'] }),
    x_stress: X('x_stress', 'one', 'مستوى التوتر عندك', { opts: ['قليل', 'متوسط', 'عالٍ'] }),
    x_work: X('x_work', 'one', 'نظام عملك', { opts: ['صباحي', 'مسائي', 'ورديات', 'لا أعمل'] }),
    x_cook: X('x_cook', 'one', 'من يطبخ في البيت؟', { opts: ['أنا', 'أحد أفراد الأسرة', 'أشتري جاهزاً'] }),
    x_skill: X('x_skill', 'one', 'مهارتك في الطبخ', { opts: ['مبتدئ', 'متوسط', 'جيد'] }),
    x_smoke: X('x_smoke', 'one', 'تدخّن؟', { opts: ['نعم', 'لا', 'أقلعت'] }),
    x_ready: X('x_ready', 'scale', 'كم أنت مستعد للتغيير الآن؟', { help: '1 غير مستعد، و5 مستعد تماماً' }),
    x_barrier: X('x_barrier', 'text', 'ما أكثر شيء قد يعيقك؟')
  };
  var IXS = [['xhab', 'عاداتك', ['x_water', 'x_out', 'x_f_dairy', 'x_f_veg', 'x_f_fruit', 'x_f_sweet', 'x_f_sdrink', 'x_f_fast', 'x_f_caf', 'x_day', 'x_diets']],
    ['xhist', 'تاريخك الصحي', ['x_wmax', 'x_wmin', 'x_wchg', 'x_surg', 'x_fam', 'x_gi', 'x_cycle', 'x_pcos']],
    ['xlife', 'نمط حياتك', ['x_sleepH', 'x_sleepQ', 'x_stress', 'x_work', 'x_cook', 'x_skill', 'x_smoke', 'x_ready', 'x_barrier']]];
  var IXQ_ = function (id) { return clone(IXQ[id]); };
  var IXSTEPS = function (skip) { return IXS.map(function (s) { return { id: s[0], t: s[1], q: s[2].filter(function (id) { return !skip || skip.indexOf(id) < 0; }).map(IXQ_) }; }); };
  var OLDL = { allg: ['الحساسية وما تتجنبه', 'أكل يتعبك أو لا تأكله أبداً'], meds: ['أدوية أو مكملات تتناولها', 'أدوية أو مكملات تأخذها بانتظام (اختياري)', 'أدوية تتناولها'] };   // نص افتراضي قديم محفوظ ← النص الجديد
  var DEF = {
    ex: function () {
      return { sys: 'ex', steps: [
        { id: 'basic', t: 'بياناتك', q: BASIC().concat([B('act', 'نشاطك اليومي'), B('goal', 'هدفك')]) },
        { id: 'health', t: 'صحتك', q: [B('cond', 'هل لديك أي من هذه الحالات؟'), B('allg', 'عندك حساسية من أكل؟ (تسبب طفحاً أو تورماً أو ضيق نفس)'), IXQ_('x_intol'), B('meds', 'أدوية تأخذها بانتظام: الاسم والجرعة إن عرفتها'), IXQ_('x_supp'), B('notes', 'أي شيء آخر يحتاج أخصائيك معرفته')] },
        { id: 'meals', t: 'وجباتك المفضلة', q: [B('meals', 'اختر ما تحب أن يتكرر في خطتك وما لا تريده')] },
        { id: 'foods', t: 'أكلاتك', q: [B('foods', 'المس الصنف مرة إن كنت تحبه ومرتين إن كنت لا تحبه')] },
        { id: 'habits', t: 'يومك', q: [B('wake', 'أستيقظ عادة'), B('sleep', 'أنام عادة'), B('nmeals', 'كم وجبة تفضّل في اليوم؟'), B('wdays', 'أيام التمرين')] }
      ].concat(IXSTEPS(['x_sleepH'])) };
    },
    tailor: function () {                                              // 1.16 الاستبيان المختصر (قرار المالك): 5 أقسام بلغة يوم العميل؛ الوزن المستهدف وشكل الأسبوع والواقع والتكرار والميزان قيم افتراضية تُعدَّل لاحقاً
      return { sys: 'ex', tailor: 1, steps: [
        { id: 'basic', t: 'عنك', q: BASIC() },
        { id: 'goal', t: 'هدفك ويومك', q: [B('goal', 'ماذا تريد أن تحقق؟'), B('act', 'أي وصف أقرب ليومك العادي؟')] },
        { id: 'health', t: 'صحتك', q: [B('cond', 'هل عندك شيء من هذه؟'), B('safe', 'سؤالان مهمان لسلامتك'), B('allg', 'عندك حساسية من أكل؟ (تسبب طفحاً أو تورماً أو ضيق نفس)'), IXQ_('x_intol'), B('meds', 'أدوية تأخذها بانتظام: الاسم والجرعة إن عرفتها'), IXQ_('x_supp')] },
        { id: 'day', t: 'وجباتك', q: [B('nmeals', 'كم مرة تأكل في يومك عادة؟')] },
        { id: 'mfoods', t: 'أكلاتك', q: [B('mfoods', 'اختر ما تحبه في كل وجبة')] }
      ].concat(IXSTEPS()) };
    },
    g: function () {
      return { sys: 'g', steps: [
        { id: 'basic', t: 'بياناتك', q: BASIC().concat([B('bf', 'نسبة الدهون % (إن كنت تعرفها)'), B('sport', 'رياضتك'), B('gphase', 'هدفك الحالي')]) },
        { id: 'train', t: 'تدريبك', q: [B('train', 'جدول تدريبك الأسبوعي: نوع كل يوم ومدته ووقته')] },
        { id: 'health', t: 'صحتك', q: [B('cond', 'هل لديك أي من هذه الحالات؟'), B('allg', 'عندك حساسية من أكل؟ (تسبب طفحاً أو تورماً أو ضيق نفس)'), IXQ_('x_intol'), B('meds', 'أدوية تأخذها بانتظام: الاسم والجرعة إن عرفتها'), B('supp', 'المكملات الرياضية التي تستعملها'), B('notes', 'أي شيء آخر يحتاج أخصائيك معرفته')] },
        { id: 'foods', t: 'أكلاتك', q: [B('foods', 'المس الصنف مرة إن كنت تحبه ومرتين إن كنت لا تحبه')] },
        { id: 'habits', t: 'يومك', q: [B('wake', 'أستيقظ عادة'), B('sleep', 'أنام عادة'), B('nmeals', 'كم وجبة تفضّل في اليوم؟')] }
      ].concat(IXSTEPS(['x_sleepH'])) };
    }
  };
  // 1.45 الأسئلة الأساسية ذات الخيارات (يعدّل الأخصائي تسميتها أو يخفيها؛ القيمة الحسابية ثابتة). القوائم الطويلة (الحالات والحساسية) تأتي من البيانات
  var OPT = { act: ['أغلب يومي جالس: مكتب أو بيت أو سيارة', 'أمشي قليلاً، أو رياضة خفيفة من يوم إلى 3 أيام في الأسبوع', 'أتحرك كثيراً في شغلي، أو أتمرن من 3 إلى 5 أيام', 'شغلي فيه مجهود، أو أتمرن من 6 إلى 7 أيام', 'مجهود بدني شاق كل يوم، أو تمرين مرتين في اليوم'],
    goal: ['أنزل وزني بهدوء', 'أنزل وزني بوتيرة أسرع', 'أحافظ على وزني', 'أزيد وزني بهدوء', 'أزيد وزني بوتيرة أسرع'], nmeals: ['3', '4', '5', '6'], cond: 1, allg: 1, safe: [['preg', 'هل أنتِ حامل أو ترضعين؟'], ['dmed', 'هل تأخذ إنسولين أو أدوية لخفض السكر؟']] };
  // يكمّل استبياناً محفوظاً بما أُضيف للافتراضي لاحقاً، ويحذف الأساسي المجهول، ويمنع إخفاء الأساسي جداً
  function normalize(spec, sys) {
    if (spec && spec.tailor) {                                           // 1.04 الاستبيان الموحّد: أسئلة التفصيل ثابتة، وأسئلة الأخصائي المضافة في قسم أخير
      var T = DEF.tailor(), extra = [], seenX = {};
      (spec.steps || []).forEach(function (s) { if (!s || s.hide) return; (s.q || []).forEach(function (q) { if (!q || q.b || q.hide || !q.id || seenX[q.id] || IXQ[q.id]) return; var t = TYPES.some(function (x) { return x[0] === q.type; }) ? q.type : 'text', c = { id: String(q.id).slice(0, 24), type: t, label: String(q.label || '').slice(0, 160) || 'سؤال', req: q.req ? 1 : 0 };
        if (q.help) c.help = String(q.help).slice(0, 200); if (t === 'num' && q.unit) c.unit = String(q.unit).slice(0, 20); if (t === 'one' || t === 'many') { c.opts = (q.opts || []).map(function (o) { return String(o).trim().slice(0, 80); }).filter(Boolean).slice(0, 20); if (!c.opts.length) c.opts = ['نعم', 'لا']; } seenX[c.id] = 1; extra.push(c); }); });
      if (extra.length) T.steps.push({ id: 'custom_x', t: String(spec.xt || 'أسئلة أخصائيك').slice(0, 60), custom: 1, q: extra });
      if (spec.tv !== 2) return T;
      var V2 = merge(DEF.tailor(), spec, 'ex'); V2.tailor = 1; V2.tv = 2; return V2;           // 1.45: الاستبيان الموحّد قابل للتعديل (نص، إخفاء، ترتيب، خيارات، أسئلة في أي قسم)
    }
    sys = sys === 'g' ? 'g' : 'ex'; var d = DEF[sys](); if (!spec || !spec.steps) return d;
    return merge(d, spec, sys);
  }
  function optsOv(b, q) {                                               // 1.45 خيارات السؤال الأساسي: تسمية (ol) وإخفاء (oh)، والقيمة المحفوظة لا تتغير
    if (q.ol && typeof q.ol === 'object') { var ol = {}, k = 0; for (var v in q.ol) { if (k++ >= 40) break; var x = String(q.ol[v] == null ? '' : q.ol[v]).trim().slice(0, 80); if (x) ol[String(v).slice(0, 80)] = x; } if (Object.keys(ol).length) b.ol = ol; }
    if (Array.isArray(q.oh)) { var oh = q.oh.map(function (x) { return String(x).slice(0, 80); }).slice(0, 40); if (oh.length) b.oh = oh; }
  }
  function merge(d, spec, sys) {
    var dq = {}, dstep = {}; d.steps.forEach(function (s) { s.q.forEach(function (q) { dq[q.id] = q; dstep[q.id] = s.id; }); });
    var out = { sys: sys, steps: [] }, seen = {};
    spec.steps.forEach(function (s) {
      if (!s || !s.id) return; var ds = d.steps.filter(function (x) { return x.id === s.id; })[0]; if (!ds && !s.custom) return;
      var st = { id: s.id, t: String(s.t || (ds && ds.t) || 'قسم').slice(0, 60), q: [] }; if (s.custom) st.custom = 1; if (s.hide && s.id !== 'basic') st.hide = 1;
      (s.q || []).forEach(function (q) {
        if (!q || !q.id || seen[q.id]) return;
        if (IXQ[q.id]) { if (!dq[q.id]) return; var x = clone(dq[q.id]); x.label = String(q.label || x.label).slice(0, 160); if (q.hide) x.hide = 1; seen[q.id] = 1; st.q.push(x); return; }      // 1.69 أسئلة الملف المتكامل: النص والإخفاء فقط، والنوع والخيارات ثابتة
        if (q.b) { if (!dq[q.id]) return; var b = clone(dq[q.id]); b.label = String(q.label && (OLDL[q.id] || []).indexOf(q.label) < 0 ? q.label : b.label).slice(0, 160); if (q.hide && !b.lock) b.hide = 1; if (OPT[q.id]) optsOv(b, q); seen[q.id] = 1; st.q.push(b); return; }
        var t = TYPES.some(function (x) { return x[0] === q.type; }) ? q.type : 'text', c = { id: String(q.id).slice(0, 24), type: t, label: String(q.label || '').slice(0, 160) || 'سؤال', req: q.req ? 1 : 0 };
        if (q.help) c.help = String(q.help).slice(0, 200); if (t === 'num' && q.unit) c.unit = String(q.unit).slice(0, 20);
        if (t === 'one' || t === 'many') { c.opts = (q.opts || []).map(function (o) { return String(o).trim().slice(0, 80); }).filter(Boolean).slice(0, 20); if (!c.opts.length) c.opts = ['نعم', 'لا']; }
        seen[c.id] = 1; st.q.push(c);
      });
      out.steps.push(st);
    });
    d.steps.forEach(function (s) {                                       // أساسي غير موجود (استبيان قديم): يعود لقسمه الافتراضي
      s.q.forEach(function (q) { if (seen[q.id]) return; var st = out.steps.filter(function (x) { return x.id === dstep[q.id]; })[0]; if (!st) { st = { id: s.id, t: s.t, q: [] };      // 1.69 القسم الافتراضي الغائب يعود بعد آخر قسم يسبقه في الترتيب الافتراضي (لا في الآخر)
          var di = d.steps.indexOf(s), at = -1; out.steps.forEach(function (x, j) { for (var k = 0; k < di; k++) if (d.steps[k].id === x.id) at = j; }); out.steps.splice(at + 1, 0, st); } st.q.push(clone(q)); seen[q.id] = 1; });
    });
    var bi = out.steps.map(function (x) { return x.id; }).indexOf('basic'); if (bi > 0) out.steps.unshift(out.steps.splice(bi, 1)[0]);   // «بياناتك» أولاً دائماً
    return out;
  }
  function visibleSteps(spec) { return spec.steps.filter(function (s) { return !s.hide && s.q.some(function (q) { return !q.hide; }); }); }
  function uid(p) { return p + Math.random().toString(36).slice(2, 9); }
  // نص الإجابة المخصّصة للعرض (في «زنها Pro» وفي المراجعة)
  function answerText(q, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    if (q.type === 'many') return [].concat(v).join('، '); if (q.type === 'yn') return v === 'y' ? 'نعم' : v === 'n' ? 'لا' : ''; if (q.type === 'scale') return v + ' من 5';
    if (q.type === 'num') return v + (q.unit ? ' ' + q.unit : ''); return String(v);
  }
  function answered(q, v) { return !(v == null || v === '' || (Array.isArray(v) && !v.length)); }
  // استبيان نظام الحصص بصيغة 1.45 (من أي صيغة محفوظة قديمة: تُنقل أسئلة الأخصائي المضافة فقط)
  function exSpec(spec) { if (spec && spec.tailor && spec.tv === 2) return normalize(spec, 'ex'); var t = normalize({ tailor: 1, xt: spec && spec.xt, steps: (spec && spec.steps) || [] }, 'ex'); t.tv = 2; return normalize(t, 'ex'); }
  function optList(id, ctx) {                                          // [[القيمة، النص الافتراضي]]
    ctx = ctx || {}; var o = OPT[id]; if (!o) return [];
    if (id === 'cond' || id === 'allg') return ((id === 'cond' ? ctx.conditions : ctx.allergens) || []).map(function (x) { return [String(x), String(x)]; });
    if (id === 'safe') return o.map(function (x) { return x.slice(); });
    if (id === 'nmeals') return o.map(function (x) { return [x, x + ' وجبات']; });
    var base = (id === 'act' ? ctx.activity : ctx.goals) || o; return base.map(function (x, i) { return [String(i), o[i] || String(x)]; }).filter(function (x, i) { return id !== 'goal' || i < o.length; });
  }
  function optLabel(q, v, def) { return (q && q.ol && q.ol[String(v)]) || def; }
  function optOn(q, v) { return !(q && q.oh && q.oh.indexOf(String(v)) >= 0); }
  return { IXQ: IXQ, IXS: IXS, OPT: OPT, exSpec: exSpec, optList: optList, optLabel: optLabel, optOn: optOn, TYPES: TYPES, defaults: function (sys) { return DEF[sys === 'g' ? 'g' : sys === 'tailor' ? 'tailor' : 'ex'](); }, normalize: normalize, visibleSteps: visibleSteps, uid: uid, answerText: answerText, answered: answered };
});
