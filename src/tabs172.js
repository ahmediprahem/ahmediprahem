// ================= 1.72 (م4) تبويبات ملف العميل الستة + شريط المحطات ①②③④ — docs/flow_plan_167.md (3، 4)
// التبويبات: نظرة عامة | البيانات | القياسات والتحاليل | الخطة | المتابعة | الإدارة (المواعيد، الاشتراك، ربط «زنها»).
// نفس الصفحات ونفس الأقسام (S.tab كما هو)؛ يتغير التجميع فقط. ومعرّف مجموعة «نظرة عامة» يبقى 'file'.
// شريط المحطات في رأس الملف: ① الاستقبال ② القياسات ③ الخطة ④ المتابعة، لكل محطة حالتها (✓ / التالي) وسطر ملخص، والضغط يفتح مكانها الوحيد.
(function () {
  var by = {}; CF_G.forEach(function (g) { by[g[0]] = g; });
  var med = by.medical || ['medical', 'القياسات والتحاليل', 'ruler', ['med']];
  var T = [['file', 'نظرة عامة', 'grid', ['ov']], ['data', 'البيانات', 'user', ['client']], med, by.plan, by.follow, ['admin', 'الإدارة', 'settings', ['appt', 'sub', 'link']]].filter(Boolean);
  CF_G.length = 0; T.forEach(function (g) { CF_G.push(g); });
  CF_L.appt = CF_L.appt || 'المواعيد'; CF_L.sub = CF_L.sub || 'الاشتراك'; CF_L.link = CF_L.link || 'ربط زنها';
})();
function st172(c) {
  var ok1 = !!(c.name && c.sex && +c.age > 0 && +c.height > 0 && c.activity && c.goal), last = typeof m168Last === 'function' ? m168Last(c) : null, ok2 = !!last;
  var ok3 = !!(c.plan && c.plan.days && c.plan.days.length), ok4 = !!c.hx, v = c.planValid || {};
  var fmt = function (t) { try { return new Date(t).toLocaleDateString('ar', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } };
  var kc = ok3 && c.plan.targets ? Math.round(c.plan.targets.kcal) + ' سعرة' : '';
  return [
    ['client', '①', 'الاستقبال', ok1, ok1 ? [c.goal, (c.conditions || []).length ? c.conditions.length + ' حالة' : ''].filter(Boolean).join(' • ') : 'أكمل البيانات الأساسية'],
    ['med', '②', 'القياسات', ok2, ok2 ? num(last.w) + ' كجم • ' + fmt(last.t) : 'سجّل أول قياس'],
    [ok3 ? 'plan' : 'newPlan', '③', 'الخطة', ok3, ok3 ? [kc, v.to ? 'حتى ' + fmt(v.to) : ''].filter(Boolean).join(' • ') : 'أنشئ أول خطة'],
    [ok4 ? 'day' : 'link', '④', 'المتابعة', ok4, ok4 ? 'مرتبط بـ«زنها»' + (v.next ? ' • متابعة ' + fmt(v.next) : '') : 'اربط العميل بـ«زنها»']];
}
function st172Html(c) {
  var L = st172(c), nx = -1; L.forEach(function (s, i) { if (nx < 0 && !s[3]) nx = i; });
  return '<nav class="st172" aria-label="محطات العميل">' + L.map(function (s, i) {
    var cls = s[3] ? 'done' : i === nx ? 'next' : 'todo', a = s[0] === 'newPlan' ? 'data-a="newPlan"' : 'data-a="tab" data-v="' + s[0] + '"';
    return '<button class="stn ' + cls + '" ' + a + '><span class="stb" aria-hidden="true">' + (s[3] ? '✓' : s[1]) + '</span><span class="stt"><b>' + s[2] + '</b><small>' + esc(s[4]) + '</small></span>' + (i === nx ? '<em>التالي</em>' : '') + '</button>' + (i < 3 ? '<span class="stl" aria-hidden="true"></span>' : '');
  }).join('') + '</nav>';
}
(function () { if (window.MutationObserver) new MutationObserver(function () {
  var h = document.querySelector('main .cftabs'), c = typeof cur === 'function' ? cur() : null; if (!h || !c || c.kind === 'athlete') return;      // فوق شريط التبويبات (في عموده) لا داخل رأس «نظرة عامة» الضيق
  var sig = [c.code, S.tab, !!c.plan, !!c.hx, c.goal, c.weight, (c.planValid || {}).to, ((c.med || {}).visits || []).length].join('|'), ex = document.querySelector('main .st172');
  if (ex && ex.dataset.sig === sig && ex.nextElementSibling === h) return; var w = document.createElement('div'); w.innerHTML = st172Html(c); var n = w.firstChild; n.dataset.sig = sig;
  if (ex) ex.remove(); h.parentNode.insertBefore(n, h);
}).observe(document.documentElement, { childList: true, subtree: true }); })();
