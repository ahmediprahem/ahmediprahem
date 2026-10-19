// ================= استبيانات التسجيل في «حصتي» (مشترك بين «حصة» و«حصتي» والاختبارات)
// لكل نظام استبيان: الحصص (ex) والجرامات (g). الاستبيان = أقسام (خطوات) فيها أسئلة:
//   - أسئلة أساسية (b:1) لها مكان ثابت في ملف العميل (الاسم، الوزن، جدول التدريب…): يغيّر الأخصائي نصها أو يخفيها، والأساسية جداً (lock) لا تُخفى.
//   - أسئلة مخصّصة يضيفها الأخصائي بأنواع: نص قصير، نص طويل، رقم (بوحدة)، اختيار واحد، اختيار متعدد، نعم/لا، مقياس 1–5. إجاباتها تصل «حصة» كما هي.
//   - أقسام مخصّصة يضيفها ويحذفها، والأقسام الأساسية تُعاد تسميتها أو تُخفى (عدا «بياناتك»).
// الاستبيان المعتمد يُرسل مع رابط الدعوة، فتعرضه «حصتي» كما هو.
(function (root, factory) { var api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.HForms = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var TYPES = [['text', 'نص قصير'], ['long', 'نص طويل'], ['num', 'رقم'], ['one', 'اختيار واحد'], ['many', 'اختيار متعدد'], ['yn', 'نعم / لا'], ['scale', 'مقياس 1–5']];
  var B = function (id, label, x) { var q = { id: id, b: 1, label: label }; for (var k in x || {}) q[k] = x[k]; return q; }, L = { lock: 1 };
  var BASIC = function () { return [B('name', 'الاسم الكامل', L), B('phone', 'رقم الجوال', L), B('sex', 'الجنس', L), B('age', 'العمر', L), B('weight', 'الوزن (كجم)', L), B('height', 'الطول (سم)', L)]; };
  var DEF = {
    ex: function () {
      return { sys: 'ex', steps: [
        { id: 'basic', t: 'بياناتك', q: BASIC().concat([B('act', 'نشاطك اليومي'), B('goal', 'هدفك')]) },
        { id: 'health', t: 'صحتك', q: [B('cond', 'هل لديك أي من هذه الحالات؟'), B('allg', 'الحساسية وما تتجنبه'), B('meds', 'أدوية أو مكملات تتناولها'), B('notes', 'أي شيء آخر يحتاج أخصائيك معرفته')] },
        { id: 'meals', t: 'وجباتك المفضلة', q: [B('meals', 'اختر ما تحب أن يتكرر في خطتك وما لا تريده')] },
        { id: 'foods', t: 'أكلاتك', q: [B('foods', 'المس الصنف مرة إن كنت تحبه ومرتين إن كنت لا تحبه')] },
        { id: 'habits', t: 'يومك', q: [B('wake', 'أستيقظ عادة'), B('sleep', 'أنام عادة'), B('nmeals', 'كم وجبة تفضّل في اليوم؟'), B('wdays', 'أيام التمرين')] }
      ] };
    },
    g: function () {
      return { sys: 'g', steps: [
        { id: 'basic', t: 'بياناتك', q: BASIC().concat([B('bf', 'نسبة الدهون % (إن كنت تعرفها)'), B('sport', 'رياضتك'), B('gphase', 'هدفك الحالي')]) },
        { id: 'train', t: 'تدريبك', q: [B('train', 'جدول تدريبك الأسبوعي: نوع كل يوم ومدته ووقته')] },
        { id: 'health', t: 'صحتك', q: [B('cond', 'هل لديك أي من هذه الحالات؟'), B('allg', 'الحساسية وما تتجنبه'), B('meds', 'أدوية تتناولها'), B('supp', 'المكملات الرياضية التي تستعملها'), B('notes', 'أي شيء آخر يحتاج أخصائيك معرفته')] },
        { id: 'foods', t: 'أكلاتك', q: [B('foods', 'المس الصنف مرة إن كنت تحبه ومرتين إن كنت لا تحبه')] },
        { id: 'habits', t: 'يومك', q: [B('wake', 'أستيقظ عادة'), B('sleep', 'أنام عادة'), B('nmeals', 'كم وجبة تفضّل في اليوم؟')] }
      ] };
    }
  };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  // يكمّل استبياناً محفوظاً بما أُضيف للافتراضي لاحقاً، ويحذف الأساسي المجهول، ويمنع إخفاء الأساسي جداً
  function normalize(spec, sys) {
    sys = sys === 'g' ? 'g' : 'ex'; var d = DEF[sys](); if (!spec || !spec.steps) return d;
    var dq = {}, dstep = {}; d.steps.forEach(function (s) { s.q.forEach(function (q) { dq[q.id] = q; dstep[q.id] = s.id; }); });
    var out = { sys: sys, steps: [] }, seen = {};
    spec.steps.forEach(function (s) {
      if (!s || !s.id) return; var ds = d.steps.filter(function (x) { return x.id === s.id; })[0]; if (!ds && !s.custom) return;
      var st = { id: s.id, t: String(s.t || (ds && ds.t) || 'قسم').slice(0, 60), q: [] }; if (s.custom) st.custom = 1; if (s.hide && s.id !== 'basic') st.hide = 1;
      (s.q || []).forEach(function (q) {
        if (!q || !q.id || seen[q.id]) return;
        if (q.b) { if (!dq[q.id]) return; var b = clone(dq[q.id]); b.label = String(q.label || b.label).slice(0, 160); if (q.hide && !b.lock) b.hide = 1; seen[q.id] = 1; st.q.push(b); return; }
        var t = TYPES.some(function (x) { return x[0] === q.type; }) ? q.type : 'text', c = { id: String(q.id).slice(0, 24), type: t, label: String(q.label || '').slice(0, 160) || 'سؤال', req: q.req ? 1 : 0 };
        if (q.help) c.help = String(q.help).slice(0, 200); if (t === 'num' && q.unit) c.unit = String(q.unit).slice(0, 20);
        if (t === 'one' || t === 'many') { c.opts = (q.opts || []).map(function (o) { return String(o).trim().slice(0, 80); }).filter(Boolean).slice(0, 20); if (!c.opts.length) c.opts = ['نعم', 'لا']; }
        seen[c.id] = 1; st.q.push(c);
      });
      out.steps.push(st);
    });
    d.steps.forEach(function (s) {                                       // أساسي غير موجود (استبيان قديم): يعود لقسمه الافتراضي
      s.q.forEach(function (q) { if (seen[q.id]) return; var st = out.steps.filter(function (x) { return x.id === dstep[q.id]; })[0]; if (!st) { st = { id: s.id, t: s.t, q: [] }; out.steps.push(st); } st.q.push(clone(q)); seen[q.id] = 1; });
    });
    var bi = out.steps.map(function (x) { return x.id; }).indexOf('basic'); if (bi > 0) out.steps.unshift(out.steps.splice(bi, 1)[0]);   // «بياناتك» أولاً دائماً
    return out;
  }
  function visibleSteps(spec) { return spec.steps.filter(function (s) { return !s.hide && s.q.some(function (q) { return !q.hide; }); }); }
  function uid(p) { return p + Math.random().toString(36).slice(2, 9); }
  // نص الإجابة المخصّصة للعرض (في «حصة» وفي المراجعة)
  function answerText(q, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    if (q.type === 'many') return [].concat(v).join('، '); if (q.type === 'yn') return v === 'y' ? 'نعم' : v === 'n' ? 'لا' : ''; if (q.type === 'scale') return v + ' من 5';
    if (q.type === 'num') return v + (q.unit ? ' ' + q.unit : ''); return String(v);
  }
  function answered(q, v) { return !(v == null || v === '' || (Array.isArray(v) && !v.length)); }
  return { TYPES: TYPES, defaults: function (sys) { return DEF[sys === 'g' ? 'g' : 'ex'](); }, normalize: normalize, visibleSteps: visibleSteps, uid: uid, answerText: answerText, answered: answered };
});
