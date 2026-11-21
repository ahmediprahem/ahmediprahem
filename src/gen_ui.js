// ================= 1.19 المرحلة 4: تبويب «توليد الخطة» — يُدمج داخل app.js عند /*GENUI*/
// بند جانبي «توليد الخطة» يفتح قائمة العملاء مع «＋ عميل جديد»، واختيار العميل يفتح ملفه على قسم «توليد» (مجموعة «الخطة»).
// الخطوات: 1 العميل • 2 المراجعة والاستبعاد (سبب كل استبعاد، ويعتمده الأخصائي) • 3 الإعداد (النظام، الوجبات، جاهز أو يدوي، شكل الأسبوع) • 4 الخطة • 5 المراجعة والإرسال.
// لا نظام موازٍ: الحقول هي الحقول الحالية (excludedFoods وavoid وmeals وdiet)، والجديد c.gen = { step, rev, path, week, fastPat }.
// قرار المالك: الاستبعاد الصحي «بحذر» تنبيه فقط بلا استبعاد تلقائي حتى يعتمد قائمة مايكل (قواعد «تجنّب» القائمة كما كانت).
var GEN_STEPS = [['client', 'العميل'], ['rev', 'المراجعة والاستبعاد'], ['setup', 'الإعداد'], ['plan', 'الخطة'], ['send', 'المراجعة والإرسال']];
var GEN_WEEK = [['fixed', 'ثابت', 'اليوم نفسه كل أيام الأسبوع'], ['var', 'متغير', 'أيام مختلفة بالسعرات نفسها'], ['fast', 'صيام الاثنين والخميس', 'صيام سنّة يومي الاثنين والخميس، بالسعرات نفسها']];
// أنماط يوم الصيام (قرار المالك): بالسعرات نفسها، والنسب الافتراضية قابلة للتعديل
var GEN_FAST = [[1, 'فطور + وجبة خفيفة + سحور', [['الفطور', 0.45], ['وجبة خفيفة', 0.2], ['السحور', 0.35]]], [2, 'وجبة خفيفة + فطور + وجبة خفيفة + سحور', [['وجبة خفيفة', 0.1], ['الفطور', 0.4], ['وجبة خفيفة', 0.15], ['السحور', 0.35]]], [3, 'يحددها الأخصائي يدوياً', null]];
// 1.23 المرحلة 8: شكل الأسبوع يُطبَّق على الخطة بعد التوليد أو التحويل (ثابت، أو صيام الاثنين والخميس بنمط المالك؛ النمط 3 يبدأ من النمط 1 ويوزّعه الأخصائي بشبكة النقل)
function genFastPct(g) { var p = g.fastPat === 2 ? 2 : 1; return (g.fastPct && g.fastPct[p]) || E.FASTP[p].map(function (x) { return x[2]; }); }
function genWeek(c) { var g = genOf(c); if (!c.plan || !c.plan.days || g.week === 'var') return; E.applyWeek(c.plan, g.week, g.fastPat === 2 ? 2 : 1, D, genFastPct(g)); if (g.week === 'fast') c.plan.fastPat = g.fastPat; }
function genOf(c) { var g = c.gen || (c.gen = {}); if (!g.step) g.step = 2; if (!g.path || g.path === 'manual') g.path = 'eqv';      // 1.28: حُذف «المحرك السابق» بقرار المالك      // 1.26: طريقة البدائل هي الافتراضية (قرار المالك)
  if (!g.es) g.es = 1; if (!g.week) g.week = 'var'; if (!g.fastPat) g.fastPat = 1; return g; }
// قائمة الاستبعاد مع السبب: ما يستبعده المحرك فعلاً، وما عليه «بحذر» (تنبيه فقط)
function genExcl(c) {
  var x = ec(c), cx = E.ctx(x, D), kinds = { allergy: 'حساسية', kw: 'كلمة مستبعدة', manual: 'استبعده الأخصائي', avoid: 'لا يحبه', health: 'منع صحي', caution: 'بحذر' }, out = [], ex = {}, al = [];
  (x.allergens || []).forEach(function (lab) { var a = D.allergens.filter(function (q) { return q.label === lab; })[0]; if (a) a.kw.forEach(function (k) { al.push([k, lab]); }); });
  (x.excludedFoods || []).forEach(function (n) { ex[n] = 1; });
  D.foods.forEach(function (f) {
    if (!f.on) return; var n = f.n, why = [], k = '', p = ' ' + n + ' ';
    var a = al.filter(function (q) { return n.indexOf(q[0]) >= 0; })[0]; if (a) { k = 'allergy'; why.push(a[1]); }
    else if (ex[n]) { k = 'manual'; }
    else if ((x.keywords || []).some(function (q) { return q && n.indexOf(q) >= 0; })) { k = 'kw'; why.push((x.keywords || []).filter(function (q) { return q && n.indexOf(q) >= 0; })[0]); }
    else if (cx.avoid[n]) { k = 'avoid'; if (c.diet && !(c.avoid || []).includes(n)) why.push('النظام الغذائي'); }
    var rs = cx.rules.filter(function (r) { return r.exact ? n === r.kw : p.indexOf(r.kw) >= 0; });
    var hard = rs.filter(function (r) { return r.tier === 'تجنّب'; })[0], soft = rs.filter(function (r) { return r.tier === 'قلّل / وقّت'; })[0];
    if (!k && hard) { k = 'health'; why.push(hard.cond + ': ' + hard.why); }
    if (!k && soft) { k = 'caution'; why.push(soft.cond + ': ' + soft.why); }
    if (k) out.push({ n: n, g: f.g, k: k, kl: kinds[k], why: why.join(' • ') });
  });
  return out;
}
function genStepper(c, g) {
  var cs = GEN_STEPS[g.step - 1], mob = '<nav class="genstepm" aria-label="خطوات توليد الخطة"><button class="sec" data-a="genStep" data-v="' + (g.step - 1) + '"' + (g.step <= 2 ? ' disabled' : '') + ' aria-label="الخطوة السابقة">›</button><span><b>' + g.step + ' من ' + GEN_STEPS.length + '</b> • ' + cs[1] + '</span><button class="sec" data-a="genStep" data-v="' + (g.step + 1) + '"' + (g.step >= 5 ? ' disabled' : '') + ' aria-label="الخطوة التالية">‹</button></nav>';      // 1.25: شريط خطوات مضغوط للجوال
  return mob + '<ol class="gensteps" aria-label="خطوات توليد الخطة">' + GEN_STEPS.map(function (s, i) {
    var n = i + 1, st = n < g.step ? 'done' : n === g.step ? 'on' : 'next';
    return '<li class="gs-' + st + '"><button class="sec sm" data-a="genStep" data-v="' + n + '"' + (n === 1 ? ' disabled' : '') + (n === g.step ? ' aria-current="step"' : '') + '><i>' + (st === 'done' ? '✓' : n) + '</i> ' + s[1] + '</button></li>';
  }).join('') + '</ol>';
}
function genCard(c) {
  var T = null; try { T = c.kind === 'athlete' ? null : E.targets(ec(c), D); } catch (e) { }
  var mf = c.hx && c.hx.intake && c.hx.intake.mfood, love = (c.love || []).slice(0, 12);
  return '<div class="ucard gencl"><h3>' + esc(c.name || 'عميل بلا اسم') + ' <small>' + esc(c.code) + '</small></h3>'
    + (typeof safetyBanner === 'function' ? safetyBanner(c.safety || (c.age > 0 && c.age < 18 ? { minor: true } : null)) : '')
    + '<p class="small">' + [c.sex, c.age && c.age + ' سنة', c.weight && c.weight + ' كجم', c.height && c.height + ' سم', c.goal, c.activity].filter(Boolean).map(esc).join(' • ') + '</p>'
    + ((c.conditions || []).length ? '<p><b>الحالة الصحية:</b> ' + c.conditions.map(esc).join('، ') + '</p>' : '') + ((c.allergens || []).length ? '<p><b>الحساسية:</b> ' + c.allergens.map(esc).join('، ') + '</p>' : '')
    + (love.length ? '<p><b>يحب:</b> ' + love.map(esc).join('، ') + '</p>' : '') + (mf ? '<p class="small">اختيارات الأكلات لكل وجبة من استبيان «زنها» محفوظة وتُراعى في الخطة.</p>' : '')
    + (T ? '<div class="tgx small">ℹ ' + esc(E.explain(T, c)) + '</div>' : '') + '</div>';
}
function genRev(c, g) {
  var L = genExcl(c), hard = L.filter(function (x) { return x.k !== 'caution'; }), soft = L.filter(function (x) { return x.k === 'caution'; });
  var row = function (x) { var can = x.k === 'manual' || (x.k === 'avoid' && (c.avoid || []).indexOf(x.n) >= 0); return '<li class="gx gx-' + x.k + '"><b>' + esc(x.n) + '</b> <span class="gxk">' + x.kl + '</span>' + (x.why ? ' <small>' + esc(x.why) + '</small>' : '') + (can ? ' <button class="link" data-a="genUnex" data-v="' + esc(x.n) + '">إرجاع</button>' : x.k === 'caution' ? ' <button class="link" data-a="genEx" data-v="' + esc(x.n) + '">استبعده</button>' : '') + '</li>'; };
  return genCard(c) + '<div class="ucard genrev"><h3>الأصناف المستبعدة (' + hard.length + ')</h3><p class="small">كل صنف مع سبب استبعاده. «إرجاع» لما استبعدته أنت أو لا يحبه العميل؛ والحساسية تُعدَّل من بيانات العميل.</p>'
    + (hard.length ? '<ul class="gxl">' + hard.map(row).join('') + '</ul>' : '<p class="small">لا أصناف مستبعدة.</p>')
    + '<div class="row"><div><label for="gen_add">استبعد صنفاً</label><input id="gen_add" list="dl_gf" placeholder="اكتب اسم الصنف"></div><div><label>&nbsp;</label><button class="sec" data-a="genAdd">＋ استبعد</button></div></div><datalist id="dl_gf">' + D.foods.filter(function (f) { return f.on; }).map(function (f) { return '<option value="' + esc(f.n) + '">'; }).join('') + '</datalist>'
    + (soft.length ? '<details class="fold"><summary>⚠ بحذر (' + soft.length + '): تنبيه فقط ولا تُستبعد تلقائياً</summary><ul class="gxl">' + soft.map(row).join('') + '</ul></details>' : '')
    + '<p class="genfoot">' + (g.rev ? '<span class="ok">✔ اعتمدتَ المراجعة</span> ' : '') + '<button data-a="genRevOk">اعتمد المراجعة والتالي ›</button></p></div>';
}
function genSetup(c, g) {
  var opt = function (k, v, t, d) { return '<label class="genopt' + (g[k] === v ? ' on' : '') + '"><input type="radio" name="gen_' + k + '" data-gnk="' + k + '" value="' + v + '"' + (g[k] === v ? ' checked' : '') + '><b>' + t + '</b>' + (d ? '<small>' + d + '</small>' : '') + '</label>'; };
  return '<div class="ucard gensetup"><h3>نوع النظام</h3>' + (c.kind === 'athlete' ? '<p class="small">نظام الجرامات (محرك الرياضيين).</p>' : dxClientBox(c))
    + (c.kind === 'athlete' ? '' : '<div class="row">' + sel('meals', 'عدد الوجبات', [3, 4, 5, 6]) + '</div>')
    + '<h3>طريقة البناء</h3><div class="genopts">' + opt('path', 'eqv', 'بالبدائل (الطريقة الجديدة)', 'الطاقة ← الماكروز ← الجدول التركيبي ← التوزيع على الوجبات ← قائمة الطعام') + opt('path', 'ready', 'جاهز من البنك', 'خطة جاهزة تناسب السعرات، ويُستبدل المستبعد تلقائياً') + '</div>'
    + '<h3>شكل الأسبوع</h3><div class="genopts">' + GEN_WEEK.map(function (w) { return opt('week', w[0], w[1], w[2]); }).join('') + '</div>'
    + (g.week === 'fast' ? '<div class="genfast"><h4>يوم الصيام</h4><div class="genopts">' + GEN_FAST.map(function (f) { return opt('fastPat', f[0], f[1], f[2] ? f[2].map(function (q) { return q[0] + ' ' + Math.round(q[1] * 100) + '%'; }).join(' • ') : 'توزيع تكتبه أنت'); }).join('') + '</div>' + (g.fastPat !== 3 ? '<div class="row genfp">' + E.FASTP[g.fastPat === 2 ? 2 : 1].map(function (x, i) { return '<div><label for="gen_fp' + i + '">' + x[0] + ' %</label><input id="gen_fp' + i + '" type="number" min="0" max="100" step="5" data-gfp="' + i + '" value="' + Math.round(genFastPct(g)[i] * 100) + '"></div>'; }).join('') + '</div>' + (Math.abs(genFastPct(g).reduce(function (a, v) { return a + v; }, 0) - 1) > 0.001 ? '<p class="warn small">⚠ مجموع النسب ' + Math.round(genFastPct(g).reduce(function (a, v) { return a + v; }, 0) * 100) + '% (يُعاد تطبيعه إلى 100%).</p>' : '') : '<p class="small">يبدأ يوم الصيام بتوزيع النمط الأول، ثم توزّعه أنت بشبكة «انقل حصة».</p>') + '<p class="small">بالسعرات نفسها لباقي الأيام. النسب قابلة للتعديل.</p></div>' : '')
    + '<p class="genfoot"><button data-a="genStep" data-v="4">التالي: الخطة ›</button></p></div>';
}
// ---- 1.20 المرحلة 5: المسار اليدوي — حصص صحيحة قابلة للشرح، مؤشر علوي، لوحة المكتمل والناقص، وشبكة نقل الحصص بين الوجبات
var GEN_PREF_G = [5, 6, 8];                                   // لحوم عالية الدهون وحليب خالٍ وحليب كامل: حسب تفضيل العميل (قرار المالك)
function genCounts(c) { var sug = E.baseSuggestion(ec(c), D), cn = c.baseCounts && c.baseCounts.length === 13 && c.baseCounts.some(function (x) { return +x > 0; }) ? c.baseCounts.map(Number) : sug.counts.slice(); return { cn: cn, sug: sug, manual: cn !== sug.counts && !!c.baseCounts }; }
function genHud(v, T) {
  var r = E.checkVals(v, { k: T.kcal, c: T.cho, p: T.pro, f: T.fat }), pc = function (x, m) { return v.k ? Math.round(x * m / v.k * 100) : 0; }, d = r.dims, cell = function (k, l, x, u, m) { var s = d[k] ? d[k].st : 'ok'; return '<div class="ghc st-' + s + '"><small>' + l + '</small><b>' + Math.round(x) + u + '</b>' + (m ? '<em>' + pc(x, m) + '%</em>' : '') + '<i>الهدف ' + Math.round(d[k] ? d[k].tgt : 0) + '</i></div>'; };
  return '<div class="genhud st-' + r.st + '" data-st="' + r.st + '">' + cell('k', 'السعرات', v.k, '', 0) + cell('c', 'كربوهيدرات', v.c, ' جم', 4) + cell('p', 'بروتين', v.p, ' جم', 4) + cell('f', 'دهون', v.f, ' جم', 9) + '</div>'
    + (r.st === 'ok' ? '<p class="ok small">✔ مطابق: ضمن ±' + Math.round(E.CHECK.kcal * 100) + '% سعرات و±' + Math.round(E.CHECK.mac * 100) + '% لكل ماكرو.</p>' : '<ul class="small genwhy">' + r.reasons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
}
// ---- 1.21 المرحلة 6: محرر اليوم — كمية كل صنف (تحدّث الوجبة واليوم والمتبقي)، والبدائل بأنواعها بفرق السعرات وسبب الترشيح، ووجبة من البنك بالمطابقة المرنة
var GENX = { subs: null, meals: null };
function genDv(x) { var r = function (v) { return (v > 0 ? '+' : '') + Math.round(v); }; return '<span class="gdv">' + r(x.dk != null ? x.dk : x.k) + ' سعرة • ك ' + r(x.dc != null ? x.dc : x.c) + ' • ب ' + r(x.dp != null ? x.dp : x.p) + ' • د ' + r(x.df != null ? x.df : x.f) + '</span>'; }
function genEditor(c, g, T) {
  var p = c.plan; if (!p || !p.days || !p.days.length || c.kind === 'athlete') return ''; var di = Math.min(g.day || 0, p.days.length - 1), d = p.days[di], n = d.nominal || [0, 0, 0];
  return '<div class="ucard genedit"><h3>محرر ' + esc(dayName(p, di)) + '</h3>' + genHud({ c: n[0], p: n[1], f: n[2], k: n[0] * 4 + n[1] * 4 + n[2] * 9 }, T)
    + d.slots.map(function (s, si) {
      var mv = GENX.meals === si ? E.mealMatch(ec(c), E.slotReq(s), s.type, D, 8) : null;
      return '<div class="gslot"><h4>' + esc(mealNm(p, s)) + (s.meal ? ' <small>' + esc(s.meal) + '</small>' : '') + (s.flex ? ' <span class="gxk">' + E.MATCH_AR[s.flex] + '</span>' : '') + ' <button class="link" data-a="genMeals" data-v="' + si + '">وجبة من البنك</button></h4>'
        + (mv ? '<ul class="gml">' + (mv.length ? mv.map(function (m, k) { return '<li class="lv-' + m.lvl + '"><b>' + esc(m.n) + '</b> <span class="gxk">' + m.lvl + ' ' + E.MATCH_AR[m.lvl] + '</span> ' + genDv(m.dv) + (m.lvl !== 'D' ? ' <button class="sm" data-a="genMealPick" data-v="' + si + ',' + k + '">اختر</button>' : '') + '</li>'; }).join('') : '<li class="small">لا وجبات في البنك تناسب هذه الوجبة.</li>') + '</ul>' : '')
        + '<ul class="glines">' + s.lines.map(function (l, li) {
          if (l.missing) return '<li class="small warn">' + esc(l.text || '') + '</li>'; var key = si + ',' + li, sb = GENX.subs === key ? E.subs(l, s.type, p, D, 12) : null;
          return '<li><span class="gln">' + esc(l.text) + '</span> <input type="number" class="n" min="0" step="0.5" value="' + l.e + '" data-ge="' + key + '" aria-label="حصص ' + esc(l.name) + '"> <button class="link" data-a="genSubs" data-v="' + key + '">بدائل</button>'
            + (sb ? '<ul class="gsubs">' + (sb.length ? sb.map(function (x, k) { return '<li><span class="gxk">' + x.type + ' ' + E.SUBT_AR[x.type] + '</span> <b>' + esc(x.text) + '</b> ' + genDv(x) + ' <small>' + esc(x.why) + '</small> <button class="sm" data-a="genSubPick" data-v="' + key + ',' + k + '">اختر</button></li>'; }).join('') : '<li class="small">لا بدائل مناسبة.</li>') + '</ul>' : '') + '</li>';
        }).join('') + '</ul></div>';
    }).join('') + '</div>';
}
// ---- 1.22 المرحلة 7: المسار الجاهز — مراجعة خريطة النص إلى الأصناف (تُحفظ للجميع)، والتحويل إلى خطة بصيغة المحرك مع استبدال المستبعد تلقائياً
function genTmap() { return S.settings.tmap || (S.settings.tmap = {}); }
function genReady(c, g) {
  if (c.kind === 'athlete') return '';
  var doc = c.plib && c.plib.doc; if (!doc) return '<div class="ucard genready"><h3>خطة جاهزة</h3><p class="small">اختر النظام الجاهز من «نافذة الأخصائي» (مكتبة الأنظمة)، ثم ارجع هنا لمراجعة الأصناف وتحويلها إلى خطة قابلة للتعديل.</p><p><button data-a="tab" data-v="pw">اختر نظاماً جاهزاً</button></p></div>';
  var seen = {}, rows = [], cnt = { name: 0, rule: 0, manual: 0, none: 0 }, over = genTmap();
  doc.days.forEach(function (d) { d.m.forEach(function (m) { m.it.forEach(function (t) { if (seen[t]) return; seen[t] = 1; var mp = E.mapText(t, D, over), k = mp ? mp.conf : 'none'; cnt[k]++; rows.push([t, mp, k]); }); }); });
  var lbl = { name: 'بالاسم', rule: 'بقاعدة', manual: 'صحّحه أخصائي', none: 'غير معروف' }, rv = rows.filter(function (r) { return r[2] !== 'name'; });
  var conv = c.plan && c.plan.fromReady && c.plan.fromReady.id === doc.id && c.planSrc !== 'plib';
  return '<div class="ucard genready"><h3>خطة جاهزة: ' + esc(c.plib.name || doc.title) + (c.plib.vname ? ' — ' + esc(c.plib.vname) : '') + '</h3>'
    + '<p class="small">ربط نصوص الخطة بالأصناف: ' + cnt.name + ' بالاسم، ' + cnt.rule + ' بقاعدة، ' + cnt.manual + ' صحّحها أخصائي، ' + cnt.none + ' غير معروفة. الخريطة تُبنى مرة وتُحفظ لكل العملاء.</p>'
    + (rv.length ? '<details class="fold"' + (cnt.none ? ' open' : '') + '><summary>راجع الربط (' + rv.length + ')</summary><ul class="gtm">' + rv.map(function (r, i) { return '<li class="gtm-' + r[2] + '"><span>' + esc(r[0]) + '</span> ← <input list="dl_gf2" data-tm="' + esc(r[0]) + '" value="' + esc(r[1] ? r[1].n : '') + '" placeholder="اختر الصنف"> <small>' + lbl[r[2]] + '</small></li>'; }).join('') + '</ul><datalist id="dl_gf2">' + D.foods.filter(function (f) { return f.on; }).map(function (f) { return '<option value="' + esc(f.n) + '">'; }).join('') + '</datalist></details>' : '')
    + (conv && c.plan.replaced && c.plan.replaced.length ? '<div class="chkb st-warn">استُبدل تلقائياً ما لا يناسب العميل:<ul>' + c.plan.replaced.slice(0, 12).map(function (x) { return '<li>' + esc(dayName(c.plan, x.d)) + ': ' + esc(x.was) + ' ← <b>' + esc(x.now) + '</b> (' + x.why + ')</li>'; }).join('') + '</ul></div>' : '')
    + '<p><button data-a="genConv">' + (conv ? '↻ أعد التحويل' : '⇄ حوّل إلى خطة قابلة للتعديل والفحص') + '</button> <button class="sec" data-a="tab" data-v="pw">غيّر النظام</button></p>'
    + (conv ? '<p class="small ok">✔ الخطة الآن بصيغة المحرك: تُعدَّل كمياتها وبدائلها وتُفحص مثل اليدوية. «وجبة من البنك» تعطي بديل الوجبة الكاملة (النوع 4).</p>' : '') + '</div>';
}
// ---- 1.26 طريقة الحمية بالبدائل (قرار المالك): 5 خطوات فرعية — الطاقة، الماكروز، الجدول التركيبي، التوزيع على الوجبات، قائمة الطعام
var EQ_STEPS = ['الطاقة', 'الماكروز', 'الجدول التركيبي', 'التوزيع على الوجبات', 'قائمة الطعام'];
function genAdq(v, t) { var a = E.adequacy(v, t); return '<span class="ad st-' + a.st + '">' + Math.round(a.pct) + '%</span>'; }
function genDist(c) { var meals = +c.meals || 5, cn = genCounts(c).cn, md = c.mealDist, n = E.slots(meals, D).length; if (!md || md.length !== n || md.some(function (r) { return !r || r.length !== 13; })) return E.suggestDist(cn, meals, D); return md.map(function (r) { return r.map(Number); }); }      // الجدول كما عدّله الأخصائي، ويُتحقق من تطابقه عند البناء
// 1.27: أيام متعددة — c.eqvDays[i] = {n, cn, md, picks}؛ اليوم النشط نسخته العاملة في baseCounts/mealDist/eqvPicks
function eqStore(c) { var g = genOf(c); if (!c.eqvDays || !c.eqvDays.length) c.eqvDays = [{ n: 'اليوم 1' }]; var k = Math.min(g.ed || 0, c.eqvDays.length - 1), x = c.eqvDays[k]; x.cn = genCounts(c).cn.slice(); x.md = genDist(c).map(function (r) { return r.slice(); }); x.picks = Object.assign({}, c.eqvPicks || {}); }
function eqLoad(c, k) { var x = c.eqvDays[k]; genOf(c).ed = k; c.baseCounts = x.cn.slice(); c.mealDist = x.md.map(function (r) { return r.slice(); }); c.eqvPicks = Object.assign({}, x.picks || {}); }
function eqDayBar(c, g) {
  var ds = c.eqvDays || [{ n: 'اليوم 1' }], k = Math.min(g.ed || 0, ds.length - 1);
  return '<div class="eqdays"><span class="small">الأيام:</span>' + ds.map(function (x, i) { return '<button class="sec sm' + (i === k ? ' on' : '') + '" data-a="genEd" data-v="' + i + '">' + esc(x.n || 'اليوم ' + (i + 1)) + '</button>'; }).join('')
    + '<button class="sec sm" data-a="genEdAdd">＋ يوم جديد</button>' + (ds.length > 1 ? '<button class="link" data-a="genEdDel">حذف هذا اليوم</button>' : '') + '</div>';
}
function eqWeekRow(c) {
  var ds = c.eqvDays || [{ n: 'اليوم 1' }], wk = c.eqvWeek || []; if (ds.length < 2) return '';
  return '<div class="eqweek"><b>أيام الأسبوع:</b> ' + D.days.map(function (dn, d) { var v = wk[d] != null && ds[wk[d]] ? wk[d] : d % ds.length; return '<label>' + esc(dn) + ' <select data-gw="' + d + '">' + ds.map(function (x, i) { return '<option value="' + i + '"' + (i === v ? ' selected' : '') + '>' + esc(x.n || 'اليوم ' + (i + 1)) + '</option>'; }).join('') + '</select></label>'; }).join(' ') + '</div>';
}
function genImportBtn(c) { return c.hx && c.hx.intake ? '<p><button class="sec" data-a="genImp">📲 استيراد البيانات من استبيان «زنها»</button> <small>الجنس والعمر والوزن والطول والنشاط والهدف</small></p>' : ''; }
function genExportBar(c) {
  if (!c.plan || c.plan.method !== 'eqv') return '';
  return '<div class="eqexp"><b>✔ خطة الأسبوع جاهزة. التصدير:</b> <button data-a="hxSendOrInvite">📲 أرسل إلى «زنها»</button> <button class="sec" data-a="genExp" data-v="print">📄 PDF</button> <button class="sec" data-a="genExp" data-v="docx">📝 Word</button> <button class="sec" data-a="tab" data-v="plan">افتح الخطة</button></div>';
}
function genEqv(c, g, T) {
  if ((g.es || 1) >= 3) eqStore(c);
  var es = g.es || 1, x = ec(c), BM = E.bmrOf(x), sl = E.slots(+c.meals || 5, D), h = '<div class="ucard geneqv"><div class="eqsteps">' + EQ_STEPS.map(function (t, i) { var n = i + 1; return '<button class="sec sm' + (n === es ? ' on' : n < es ? ' done' : '') + '" data-a="genEs" data-v="' + n + '"><i>' + (n < es ? '✓' : n) + '</i> ' + t + '</button>'; }).join('') + '</div>';
  if (es === 1) {
    var cur0 = E.BMRF.filter(function (q) { return q[0] === BM.f; })[0];
    h += '<h3>1. الطاقة</h3>' + genImportBtn(c) + '<div class="row"><div><label for="geq_f">المعادلة</label><select id="geq_f" data-f="bmrF">' + E.BMRF.map(function (q) { return '<option value="' + q[0] + '"' + ((c.bmrF || 'mifflin') === q[0] ? ' selected' : '') + '>' + q[1] + '</option>'; }).join('') + '</select><small class="eqwhen">' + esc(cur0[2]) + ' <i>(' + esc(cur0[3]) + ')</i></small></div>'
      + sel('activity', 'معامل النشاط', D.settings.activity.map(function (a) { return a[0]; })) + sel('goal', 'الهدف', D.settings.goals.map(function (a) { return a[0]; }))
      + '<div><label><input type="checkbox" data-bf="eta"' + (c.eta ? ' checked' : '') + '> تأثير الهضم 10%</label><small class="eqwhen">معطّل افتراضياً: معاملات النشاط تشمله، فلا يُحسب مرتين.</small></div></div>'
      + (BM.note ? '<p class="warn small">⚠ ' + esc(BM.note) + '</p>' : '') + '<p class="eqbig"><b>' + Math.round(T.kcal) + '</b> سعرة</p><div class="tgx small">ℹ ' + esc(E.explain(T, c)) + (c.eta ? ' (مع تأثير الهضم 10%)' : '') + '</div>';
  } else if (es === 2) {
    var pc = function (k, d0) { return Math.round((c[k] == null ? d0 : +c[k]) * 100); }, cp = pc('choPct', 0.45), pp = pc('proPct', 0.25), fp = pc('fatPct', 0.3);
    var row = function (k, l, p, div) { return '<tr><td><b>' + l + '</b></td><td><input type="number" class="n" min="0" max="100" step="1" data-gm="' + k + '" value="' + p + '"> %</td><td>' + Math.round(T.kcal * p / 100) + '</td><td><b>' + Math.round(T.kcal * p / 100 / div) + '</b> جم</td><td>' + (c.weight ? (T.kcal * p / 100 / div / c.weight).toFixed(1) : '—') + '</td></tr>'; };
    h += '<h3>2. توزيع الماكروز <small>(' + Math.round(T.kcal) + ' سعرة)</small></h3><table class="st gentbl"><tr><th>الماكرو</th><th>النسبة</th><th>سعرات</th><th>جرامات</th><th>جم/كجم</th></tr>' + row('choPct', '● الكربوهيدرات', cp, 4) + row('proPct', '◆ البروتين', pp, 4) + row('fatPct', '✦ الدهون', fp, 9)
      + '<tr><td>المجموع</td><td colspan="4">' + (cp + pp + fp === 100 ? '<span class="ad st-ok">✓ 100%</span>' : '<span class="ad st-block">' + (cp + pp + fp) + '%: يجب أن يكون 100%</span>') + '</td></tr></table>';
  } else if (es === 3) {
    h += eqDayBar(c, g);
    var G = genCounts(c), cn = G.cn, v = E.countsVals(cn, D);
    h += '<h3>3. الجدول التركيبي: كم حصة من كل مجموعة؟ <button class="sec sm" data-a="genEqSug">✦ اقترح الحصص</button></h3><table class="st gentbl eqtbl"><tr><th>المجموعة</th><th>الحصص</th><th>سعرات</th><th>كربوهيدرات</th><th>بروتين</th><th>دهون</th></tr>'
      + D.groups.map(function (gn, i) { return '<tr data-g="' + i + '"><td>' + esc(gn) + '</td><td><input type="number" class="n" min="0" step="1" data-gc="' + i + '" value="' + cn[i] + '"></td><td>' + Math.round(cn[i] * D.EX[i][3]) + '</td><td>' + cn[i] * D.EX[i][0] + '</td><td>' + cn[i] * D.EX[i][1] + '</td><td>' + cn[i] * D.EX[i][2] + '</td></tr>'; }).join('')
      + '<tr class="eqsum"><td>المجموع</td><td>' + cn.reduce(function (a, b) { return a + b; }, 0) + '</td><td>' + Math.round(v.k) + '</td><td>' + Math.round(v.c) + '</td><td>' + Math.round(v.p) + '</td><td>' + Math.round(v.f) + '</td></tr>'
      + '<tr><td>الهدف</td><td></td><td>' + Math.round(T.kcal) + '</td><td>' + Math.round(T.cho) + '</td><td>' + Math.round(T.pro) + '</td><td>' + Math.round(T.fat) + '</td></tr>'
      + '<tr class="eqsum eqadq"><td>نسبة الملاءمة</td><td></td><td>' + genAdq(v.k, T.kcal) + '</td><td>' + genAdq(v.c, T.cho) + '</td><td>' + genAdq(v.p, T.pro) + '</td><td>' + genAdq(v.f, T.fat) + '</td></tr></table>'
      + (function () { var heart = (c.conditions || []).some(function (q) { return q === 'أمراض القلب' || q === 'ارتفاع الكوليسترول والدهون'; }); return cn[5] > 0 && heart ? '<p class="err small eqhf">⛔ لحوم عالية الدهون مع ' + esc((c.conditions || []).join('، ')) + ': لا تُستعمل (قرار المالك).</p>' : cn[5] > 1 ? '<p class="warn small eqhf">⚠ لحوم عالية الدهون: الحد الأقصى المقترح حصة واحدة يومياً.</p>' : ''; })()
      + '<p class="small">الملاءمة = المحسوب ÷ الهدف. أخضر 95–105% (قرار المالك)، كهرماني 90–110%، أحمر خارجها. حصص صحيحة فقط.</p>';
  } else if (es === 4) {
    h += eqDayBar(c, g);
    var cn4 = genCounts(c).cn, md = genDist(c), act = sl.filter(function (q) { return q.active; });
    h += '<h3>4. توزيع الحصص على الوجبات <button class="sec sm" data-a="genEqDist">↻ وزّع تلقائياً</button></h3><table class="st gentbl eqdist"><tr><th>المجموعة</th>' + act.map(function (q) { return '<th>' + esc(q.name) + '</th>'; }).join('') + '<th>المجموع</th><th>اليومي</th></tr>'
      + D.groups.map(function (gn, gi) { if (!cn4[gi]) return ''; var t = 0; return '<tr><td>' + esc(gn) + '</td>' + act.map(function (q) { t += md[q.i][gi]; return '<td><input type="number" class="n" min="0" step="1" data-gd="' + q.i + ',' + gi + '" value="' + md[q.i][gi] + '"></td>'; }).join('') + '<td><b>' + t + '</b></td><td>' + (t === cn4[gi] ? '<span class="ad st-ok">✓ ' + cn4[gi] + '</span>' : '<span class="ad st-block">' + cn4[gi] + '</span>') + '</td></tr>'; }).join('')
      + '<tr class="eqsum"><td>سعرات الوجبة</td>' + act.map(function (q) { return '<td>' + Math.round(E.countsVals(md[q.i], D).k) + '</td>'; }).join('') + '<td>' + Math.round(E.countsVals(cn4, D).k) + '</td><td></td></tr></table>';
  } else {
    h += eqDayBar(c, g);
    var md5 = genDist(c), act5 = sl.filter(function (q) { return q.active && md5[q.i].some(function (v0) { return v0 > 0; }); }), mi = Math.min(g.em || 0, act5.length - 1), q5 = act5[mi], picks = c.eqvPicks || {}, cx = E.ctx(ec(c), D);
    h += '<h3>5. قائمة الطعام <span class="eqauto"><button class="sec sm" data-a="genAutoMeal">✦ ولّد هذه الوجبة تلقائياً</button> <button class="sec sm" data-a="genAutoAll">✦ ولّد كل الوجبات</button></span></h3><div class="eqmeals">' + act5.map(function (q, i) { return '<button class="sec sm' + (i === mi ? ' on' : '') + '" data-a="genEm" data-v="' + i + '">' + esc(q.name) + '</button>'; }).join('') + '</div>';
    if (q5) {
      var row5 = md5[q5.i], lines = '', mv = E.countsVals(row5, D);
      var mt5 = 0, gm5 = -1; [2, 3, 4, 5].forEach(function (q) { var v = +row5[q] || 0; mt5 += v; if (v > 0 && (gm5 < 0 || v > (+row5[gm5] || 0))) gm5 = q; });
      E.EQV_ORDER.forEach(function (gi) { var e = row5[gi]; if (gi >= 2 && gi <= 5) { if (gi !== gm5) return; e = mt5; } if (!e) return; var cands = E.eqvCands(ec(c), gi, q5.type, D, cx, e), key = q5.i + '_' + gi, cur5 = picks[key] || ''; var f0 = cands.filter(function (f) { return f.n === cur5; })[0] || cands[0];
        lines += '<tr><td><select data-gp="' + key + '" aria-label="صنف ' + esc(D.groups[gi]) + '"><option value="">تلقائي (يتنوّع يومياً)</option>' + cands.slice(0, 40).map(function (f) { return '<option' + (f.n === cur5 ? ' selected' : '') + '>' + esc(f.n) + '</option>'; }).join('') + '</select></td><td><b>' + (f0 ? esc(E.lineText(f0, e, c.alias)) : 'لا صنف مناسب') + '</b></td><td class="small">' + e + ' ' + esc(D.groups[gi]) + '</td></tr>'; });
      h += '<div class="eqdish"><table class="st gentbl"><tr><th>الصنف (من أطعمة «زنها»)</th><th>الكمية</th><th>يغطي</th></tr>' + lines + '</table><div class="mf"><span class="mc kc">🔥 ' + Math.round(mv.k) + ' سعرة</span><span class="mc cb">● ' + mv.c + ' جم</span><span class="mc pr">◆ ' + mv.p + ' جم</span><span class="mc ft">✦ ' + mv.f + ' جم</span></div></div>'
        + '<p class="small">«تلقائي» يختار من الأصناف المناسبة للوجبة والعميل (بلا المستبعد والحساسية) ويتنوّع كل يوم؛ اختيار صنف يثبّته كل الأيام.</p>';
    }
    h += eqWeekRow(c) + '<p><button data-a="genEqBuild">⚙ ولّد خطة الأسبوع بالبدائل</button></p>' + genExportBar(c);
  }
  return h + '<p class="genfoot">' + (es > 1 ? '<button class="sec" data-a="genEs" data-v="' + (es - 1) + '">› السابق</button> ' : '') + (es < 5 ? '<button data-a="genEs" data-v="' + (es + 1) + '">التالي: ' + EQ_STEPS[es] + ' ‹</button>' : '') + '</p></div>';
}
function genPlanStep(c, g) {
  var po = planOf(c), ck = null; if (c.plan && c.plan.days && c.plan.targets && c.kind !== 'athlete' && po.src === 'engine') try { ck = E.checkPlan(c.plan, D); } catch (e) { }
  var T = null; try { T = c.kind === 'athlete' ? null : E.targets(ec(c), D); } catch (e) { }
  var man = '';
  if (g.path === 'ready') man = genReady(c, g);
  if (g.path === 'eqv' && T) man = genEqv(c, g, T);
  return man + '<div class="ucard genplan gen-' + (ck ? 'st-' + ck.st : 'none') + '" data-st="' + (ck ? ck.st : '') + '"><h3>' + (g.path === 'ready' ? 'خطة جاهزة' : 'خطة يدوية') + '</h3>'
    + (po.has ? '<p>الخطة الحالية: <b>' + esc(po.label) + '</b>' + (po.kcal ? ' • ' + Math.round(po.kcal) + ' سعرة' : '') + '</p>' : '<p class="small">لا خطة بعد.</p>')
    + (ck ? '<p class="genst">' + { ok: '✔ مطابقة', warn: '⚠ تحتاج نظرك', block: '⛔ غير مطابقة' }[ck.st] + ': ' + ck.ok + ' أيام مطابقة، ' + ck.warn + ' تنبيه، ' + ck.block + ' مانع</p>' : '')
    + '<p>' + (man ? '' : '<button data-a="genBuild">' + (po.has ? '↻ أعد التوليد' : '⚙ ولّد الخطة') + '</button> ') + (po.has ? '<button class="sec" data-a="tab" data-v="plan">افتح الخطة للتعديل</button> ' : '') + '<button class="sec" data-a="genStep" data-v="5">التالي: المراجعة والإرسال ›</button></p></div>' + '' + (T && po.src === 'engine' ? genEditor(c, g, T) : '');
}
function genSend(c, g) {
  var po = planOf(c), ck = null, T = null; try { T = c.kind === 'athlete' ? null : E.targets(ec(c), D); if (po.src === 'engine' && c.plan && c.plan.days && c.kind !== 'athlete') ck = E.checkPlan(c.plan, D); } catch (e) { }
  var st = ck ? ck.st : T && T.lowBlock ? 'block' : 'ok', ic = { ok: '✔', warn: '⚠', block: '⛔' }[st];
  var pf = []; try { if (po.has && c.kind !== 'athlete') pf = E.prefScan(ec(c), [JSON.stringify(po.snap())], D); } catch (e) { }
  if (pf.length && st === 'ok') { st = 'warn'; ic = '⚠'; }
  return '<div class="ucard gensend gen-st-' + st + '" data-st="' + st + '"><h3>' + ic + ' ' + E.ST_AR[st] + '</h3>'
    + (pf.length ? '<div class="chkb st-warn genpref">⚠ في الخطة أصناف لا تناسب تفضيلات العميل: ' + pf.map(function (x) { return '<b>' + esc(x.n) + '</b> (' + x.why + ')'; }).join('، ') + '. راجعها قبل الإرسال.</div>' : '')
    + (ck ? '<ul>' + ck.days.map(function (d, i) { return '<li class="st-' + d.st + '">' + esc(dayName(c.plan, i)) + ': ' + { ok: '✔', warn: '⚠', block: '⛔' }[d.st] + ' ' + E.ST_AR[d.st] + (d.reasons.length ? ' — ' + esc(d.reasons[0]) : '') + '</li>'; }).join('') + '</ul>' : '')
    + (T && T.lowBlock ? '<p class="err">السعرات اليدوية تحت الحد الآمن بلا تأكيد: أكّدها من «البيانات».</p>' : '')
    + (!po.has ? '<p class="small">ولّد الخطة أولاً.</p>' : c.hx ? '<p><button data-a="hxSendPlan"' + (T && T.lowBlock ? ' disabled' : '') + '>' + IC('send') + ' أرسل الخطة إلى «زنها»</button></p>' : '<p><button class="sec" data-a="tab" data-v="link">اربط العميل بـ«زنها» لإرسال الخطة</button></p>')
    + '</div>';
}
// ---- 1.24 المرحلة 9: قسم الجرامات — الخطوات نفسها بمحرك الرياضيين (Ath)، والفحص بالحدود نفسها على كل يوم (السعرات مقابل سعرات الماكروز المستهدفة)
function genAthT(c) { try { return Ath.targets(ec(c), AD); } catch (e) { return null; } }
function genAthCheck(d) { var t = d.t || {}, g0 = d.got || {}; return E.checkVals({ k: g0.k, c: g0.c, p: g0.p, f: g0.f }, { k: t.macroKcal || t.kcal, c: t.c, p: t.p, f: t.f }); }
function genAthPlanCk(c) { var p = c.plan; if (!p || p.kind !== 'athlete' && !(p.days && p.days[0] && p.days[0].meals)) return null; var days = p.days.map(genAthCheck), st = days.reduce(function (a, d) { return { ok: 0, warn: 1, block: 2 }[d.st] > { ok: 0, warn: 1, block: 2 }[a] ? d.st : a; }, 'ok'); return { st: st, days: days, ok: days.filter(function (d) { return d.st === 'ok'; }).length, warn: days.filter(function (d) { return d.st === 'warn'; }).length, block: days.filter(function (d) { return d.st === 'block'; }).length }; }
function genAthRev(c, g) {
  var T = genAthT(c), L = (c.avoid || []).map(function (n) { return { n: n, k: 'avoid' }; }).concat(String(c.keywords || '').split(/[,،\n]/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (n) { return { n: n, k: 'kw' }; }));
  return '<div class="ucard gencl"><h3>' + esc(c.name || 'عميل بلا اسم') + ' <small>' + esc(c.code) + ' • نظام الجرامات</small></h3>' + (typeof safetyBanner === 'function' ? safetyBanner(c.safety || null) : '')
    + '<p class="small">' + [c.sex, c.age && c.age + ' سنة', c.weight && c.weight + ' كجم', c.height && c.height + ' سم', c.bf && 'دهون ' + c.bf + '%', c.sport, c.phase].filter(Boolean).map(esc).join(' • ') + '</p>'
    + (T ? '<div class="tgx small">ℹ الحرق الأساسي ' + Math.round(T.bmr) + ' (' + esc(T.method) + (T.ffm ? '، كتلة خالية ' + T.ffm.toFixed(1) + ' كجم' : '') + ')؛ ' + esc(T.info || '') + '</div>' : '') + '</div>'
    + '<div class="ucard genrev"><h3>المستبعد (' + L.length + ')</h3>' + (L.length ? '<ul class="gxl">' + L.map(function (x) { return '<li class="gx gx-' + (x.k === 'kw' ? 'kw' : 'avoid') + '"><b>' + esc(x.n) + '</b> <span class="gxk">' + (x.k === 'kw' ? 'كلمة مستبعدة' : 'لا يحبه') + '</span>' + (x.k === 'avoid' ? ' <button class="link" data-a="genUnex" data-v="' + esc(x.n) + '">إرجاع</button>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="small">لا أصناف مستبعدة.</p>')
    + '<p class="small">الحساسية والكلمات المستبعدة تُعدَّل من «البيانات».</p><p class="genfoot">' + (g.rev ? '<span class="ok">✔ اعتمدتَ المراجعة</span> ' : '') + '<button data-a="genRevOk">اعتمد المراجعة والتالي ›</button></p></div>';
}
function genAthSetup(c, g) {
  return '<div class="ucard gensetup"><h3>إعداد نظام الجرامات</h3><div class="row">' + sel('phase', 'المرحلة', AD.phases.map(function (p) { return p.n; })) + sel('bmrF', 'صيغة الحرق الأساسي (مع نسبة الدهون)', ['katch', 'cunningham', 'mifflin'], function (o) { return [o, o === 'katch' ? 'Katch-McArdle' : o === 'cunningham' ? 'Cunningham' : 'Mifflin-St Jeor']; }) + '</div>'
    + '<p class="small">جدول التدريب والماكروز التفصيلية في «البيانات». شكل الأسبوع يتبع جدول التدريب (أيام تدريب وراحة).</p><p class="genfoot"><button data-a="genStep" data-v="4">التالي: الخطة ›</button></p></div>';
}
function genAthPlan(c, g) {
  var ck = genAthPlanCk(c), po = planOf(c);
  return '<div class="ucard genplan gen-' + (ck ? 'st-' + ck.st : 'none') + '" data-st="' + (ck ? ck.st : '') + '"><h3>خطة الجرامات</h3>' + (po.has ? '<p>الخطة الحالية: <b>' + esc(po.label) + '</b></p>' : '<p class="small">لا خطة بعد.</p>')
    + (ck ? '<ul class="small">' + c.plan.days.map(function (d, i) { var r = ck.days[i]; return '<li class="st-' + r.st + '">' + esc(d.name) + ' (' + esc(d.type || '') + '): ' + { ok: '✔', warn: '⚠', block: '⛔' }[r.st] + ' ' + E.ST_AR[r.st] + ' — ' + Math.round(d.got.k) + ' سعرة مقابل ' + Math.round(d.t.macroKcal || d.t.kcal) + (r.reasons.length ? ' • ' + esc(r.reasons[0]) : '') + '</li>'; }).join('') + '</ul>' : '')
    + '<p><button data-a="genBuild">' + (po.has ? '↻ أعد التوليد' : '⚙ ولّد الخطة') + '</button> ' + (po.has ? '<button class="sec" data-a="tab" data-v="plan">افتح الخطة للتعديل بالجرامات</button> ' : '') + '<button class="sec" data-a="genStep" data-v="5">التالي: المراجعة والإرسال ›</button></p></div>';
}
function genAthSend(c, g) {
  var ck = genAthPlanCk(c), po = planOf(c), st = ck ? ck.st : 'ok';
  return '<div class="ucard gensend gen-st-' + st + '" data-st="' + st + '"><h3>' + { ok: '✔', warn: '⚠', block: '⛔' }[st] + ' ' + E.ST_AR[st] + '</h3>' + (ck ? '<ul>' + c.plan.days.map(function (d, i) { var r = ck.days[i]; return '<li class="st-' + r.st + '">' + esc(d.name) + ': ' + { ok: '✔', warn: '⚠', block: '⛔' }[r.st] + ' ' + E.ST_AR[r.st] + (r.reasons.length ? ' — ' + esc(r.reasons[0]) : '') + '</li>'; }).join('') + '</ul>' : '')
    + (!po.has ? '<p class="small">ولّد الخطة أولاً.</p>' : c.hx ? '<p><button data-a="hxSendPlan">' + IC('send') + ' أرسل الخطة إلى «زنها»</button></p>' : '<p><button class="sec" data-a="tab" data-v="link">اربط العميل بـ«زنها» لإرسال الخطة</button></p>') + '</div>';
}
function genTab(c) {
  var g = genOf(c), ath = c.kind === 'athlete', body = g.step <= 2 ? (ath ? genAthRev : genRev)(c, g) : g.step === 3 ? (ath ? genAthSetup : genSetup)(c, g) : g.step === 4 ? (ath ? genAthPlan : genPlanStep)(c, g) : (ath ? genAthSend : genSend)(c, g);
  var sent = c.hx && c.hx.planV ? '<div class="chkb st-ok gensent">📤 أُرسلت الخطة إلى «زنها» (v' + c.hx.planV + '). عدّلها في أي وقت ثم أرسلها إصداراً جديداً v' + (c.hx.planV + 1) + '؛ علامات «أكلت/بدّلت» عند العميل تبقى مع أصنافها. ' + (g.step < 4 ? '<button class="sm" data-a="genStep" data-v="4">عدّل الخطة المرسلة</button>' : '') + '</div>' : '';
  return '<div class="gentab">' + sent + genStepper(c, g) + body + '</div>';
}
function genReqList() {                                       // 1.27: طلبات «زنها» الجديدة تُستورد من هنا مباشرة وتفتح التوليد
  var r = (window.HX && HX.st && HX.st.reqs) ? Object.keys(HX.st.reqs).map(function (k) { return [k, HX.st.reqs[k]]; }).filter(function (x) { return x[1].intake && x[1].st === 'new'; }) : [];
  return r.length ? '<div class="ucard genreqs"><h3>📲 طلبات جديدة من «زنها» (' + r.length + ')</h3>' + r.map(function (x) { var it = x[1].intake; return '<div class="genreq"><b>' + esc(it.name || x[1].label || 'عميل') + '</b> <small>' + [it.sex, it.age && it.age + ' سنة', it.weight && it.weight + ' كجم'].filter(Boolean).map(esc).join(' • ') + '</small> <button class="sm" data-a="genReqImp" data-v="' + esc(x[0]) + '">استورد وابدأ التوليد</button></div>'; }).join('') + '</div>' : '';
}
function genPage() {
  return '<div class="clpage genpage"><div class="hxtop"><h2>توليد الخطة</h2><span class="two"><button data-a="genNew" data-v="ex">＋ عميل جديد — الحصص</button> <button class="sec" data-a="genNew" data-v="ath">＋ عميل جديد — الجرامات</button></span></div>'
    + '<p class="small">اختر العميل لتبدأ: مراجعة بياناته والاستبعاد، ثم الإعداد، ثم الخطة.</p>'
    + genReqList()
    + '<div class="genlist">' + S.clients.slice().sort(function (a, b) { return (b.updated || b.created) - (a.updated || a.created); }).map(function (c) {
      return '<button class="cl" data-a="genPick" data-v="' + esc(c.code) + '"><span class="cav">' + esc(initial(c.name)) + '</span><b>' + esc(c.name || '(بلا اسم)') + '</b><small>' + esc(c.code) + (c.kind === 'athlete' ? ' • جرامات' : '') + (planOf(c).has ? ' • لديه خطة' : '') + '</small></button>';
    }).join('') + '</div></div>';
}
// 1.25: عميل جديد من «توليد الخطة» — زر ثابت يعيده إلى التوليد بعد إدخال بياناته (الاجتماع 04)
(function (f) { clientTab = function (c) { return f.apply(this, arguments) + (S.genBack && S.genBack === c.code ? '<div class="genback"><button data-a="genGo">تابع إلى توليد الخطة ›</button></div>' : ''); }; })(clientTab);
(function (f) { main0 = function () { if (S.view === 'gen') { $('main').innerHTML = genPage(); return; } return f.apply(this, arguments); }; })(main0);
document.addEventListener('change', function (e) {
  var t = e.target, c = cur(); if (!c || !t.dataset) return;
  if ((t.dataset.f || t.dataset.bf) && t.closest && t.closest('.geneqv')) { setTimeout(main, 0); return; }      
  if (t.dataset.gfp != null) { var gq = genOf(c), pp = gq.fastPat === 2 ? 2 : 1, arr = genFastPct(gq).slice(); arr[+t.dataset.gfp] = Math.max(0, Math.min(100, +t.value || 0)) / 100; gq.fastPct = gq.fastPct || {}; gq.fastPct[pp] = arr; save(); main(); return; }
  if (t.dataset.gm) { c[t.dataset.gm] = Math.max(0, Math.min(100, Math.round(+t.value || 0))) / 100; c.macroMode = 'manual'; save(); main(); return; }
  if (t.dataset.gd) { var q7 = t.dataset.gd.split(',').map(Number), md7 = genDist(c); md7[q7[0]][q7[1]] = Math.max(0, Math.round(+t.value || 0)); c.mealDist = md7; save(); main(); return; }
  if (t.dataset.gw != null) { c.eqvWeek = c.eqvWeek || D.days.map(function (_, d) { return d % (c.eqvDays || [1]).length; }); c.eqvWeek[+t.dataset.gw] = +t.value; save(); main(); return; }
  if (t.dataset.gp) { c.eqvPicks = c.eqvPicks || {}; if (t.value) c.eqvPicks[t.dataset.gp] = t.value; else delete c.eqvPicks[t.dataset.gp]; save(); main(); return; }
  if (t.dataset.tm != null) { var tm = genTmap(), v0 = t.value.trim(); if (v0 && !D.foods.some(function (f) { return f.n === v0; })) { toast('اختر صنفاً من القائمة'); return; } if (v0) tm[t.dataset.tm] = v0; else delete tm[t.dataset.tm]; saveSettings(); main(); toast('حُفظ الربط'); return; }
  if (t.dataset.ge && c.plan) { var q = t.dataset.ge.split(',').map(Number); E.setLineE(c.plan, genOf(c).day || 0, q[0], q[1], Math.max(0, +t.value || 0), D); GENX.subs = null; save(); main(); return; }
  if (t.dataset.gc != null) { var G = genCounts(c), cn = G.cn.slice(); cn[+t.dataset.gc] = Math.max(0, Math.round(+t.value || 0)); c.baseCounts = cn; save(); main(); return; }
  if (!t.dataset.gnk) return; var g = genOf(c); g[t.dataset.gnk] = t.dataset.gnk === 'fastPat' || t.dataset.gnk === 'day' ? +t.value : t.value; save(); main();
});
Object.assign(A, {
  genTab: function () { document.body.classList.remove('menu'); S.view = 'gen'; S.cur = null; render(); window.scrollTo(0, 0); },
  genPick: function (v) { return A.pick(v).then(function () { S.tab = 'gen'; render(); }); },
  genNew: function (v) { A.new(v === 'ath' ? 'ath' : 'ex'); S.genBack = S.cur; S.tab = 'client'; render(); toast('أكمل بيانات العميل، ثم «تابع إلى توليد الخطة»'); },
  genGo: function () { var c = cur(); if (!c) return; if (!c.name || !c.sex) { toast('اكتب الاسم وحدّد الجنس أولاً'); return; } S.genBack = null; S.tab = 'gen'; save(); render(); window.scrollTo(0, 0); },
  genStep: function (v) { var c = cur(); if (!c) return; genOf(c).step = Math.max(2, Math.min(5, +v)); save(); main(); window.scrollTo(0, 0); },
  genRevOk: function () { var c = cur(); if (!c) return; var g = genOf(c); g.rev = Date.now(); g.step = 3; save(); main(); toast('اعتُمدت المراجعة'); },
  genUnex: function (v) { var c = cur(); if (!c) return; c.excludedFoods = (c.excludedFoods || []).filter(function (n) { return n !== v; }); c.avoid = (c.avoid || []).filter(function (n) { return n !== v; }); genOf(c).rev = null; save(); main(); toast('أُرجع «' + v + '»'); },
  genEx: function (v) { var c = cur(); if (!c || !v) return; c.excludedFoods = c.excludedFoods || []; if (c.excludedFoods.indexOf(v) < 0) c.excludedFoods.push(v); genOf(c).rev = null; save(); main(); toast('استُبعد «' + v + '»'); },
  genAdd: function () { var i = $('#gen_add'), v = i && i.value.trim(); if (!v) return; if (!D.foods.some(function (f) { return f.n === v; })) { toast('اختر صنفاً من القائمة'); return; } A.genEx(v); },
  genConv: function () { var c = cur(); if (!c || !c.plib || !c.plib.doc) return; c.plan = E.fromDoc(Object.assign({ id: c.plib.id }, c.plib.doc), ec(c), D, genTmap()); c.planSrc = ''; genWeek(c); save(); main(); toast('حُوّلت الخطة' + (c.plan.replaced.length ? '، واستُبدل ' + c.plan.replaced.length + ' صنفاً لا يناسب العميل' : '')); },
  genEs: function (v) { var c = cur(); if (!c) return; var g = genOf(c); if (+v === 2 && c.macroMode !== 'manual') { var T0 = E.targets(ec(c), D); c.macroMode = 'manual'; c.choPct = Math.round(T0.cho * 4 / T0.kcal * 100) / 100; c.proPct = Math.round(T0.pro * 4 / T0.kcal * 100) / 100; c.fatPct = Math.round((1 - c.choPct - c.proPct) * 100) / 100; } if (+v >= 4 && !c.baseCounts) c.baseCounts = genCounts(c).cn; if (+v >= 4 && !c.mealDist) c.mealDist = genDist(c); g.es = Math.max(1, Math.min(5, +v)); save(); main(); },
  genEd: function (v) { var c = cur(); if (!c) return; eqStore(c); eqLoad(c, Math.min(+v, c.eqvDays.length - 1)); save(); main(); },
  genEdAdd: function () { var c = cur(); if (!c) return; eqStore(c); var src = c.eqvDays[genOf(c).ed || 0]; c.eqvDays.push({ n: 'اليوم ' + (c.eqvDays.length + 1), cn: src.cn.slice(), md: src.md.map(function (r) { return r.slice(); }), picks: {} }); delete c.eqvWeek; eqLoad(c, c.eqvDays.length - 1); save(); main(); toast('أُضيف يوم جديد (نسخة من اليوم الحالي بأصناف تلقائية): عدّل حصصه أو توزيعه أو أصنافه'); },
  genEdDel: function () { var c = cur(); if (!c || !c.eqvDays || c.eqvDays.length < 2) return; var k = genOf(c).ed || 0; c.eqvDays.splice(k, 1); delete c.eqvWeek; eqLoad(c, Math.max(0, k - 1)); save(); main(); toast('حُذف اليوم'); },
  genAutoMeal: function () { var c = cur(); if (!c) return; var g = genOf(c), md = genDist(c), sl = E.slots(+c.meals || 5, D).filter(function (q) { return q.active && md[q.i].some(function (v) { return v > 0; }); }), q = sl[Math.min(g.em || 0, sl.length - 1)]; if (!q) return; g.salt = (g.salt || 0) + 1; c.eqvPicks = Object.assign({}, c.eqvPicks || {}, E.eqvAutoMeal(ec(c), D, q.i, md[q.i], q.type, g.salt)); save(); main(); toast('وُلّدت ' + q.name + ' تلقائياً'); },
  genAutoAll: function () { var c = cur(); if (!c) return; var g = genOf(c), md = genDist(c), used = {}, p = {}; g.salt = (g.salt || 0) + 1; E.slots(+c.meals || 5, D).forEach(function (q) { if (q.active && md[q.i].some(function (v) { return v > 0; })) Object.assign(p, E.eqvAutoMeal(ec(c), D, q.i, md[q.i], q.type, g.salt, used)); }); c.eqvPicks = p; save(); main(); toast('وُلّدت وجبات اليوم كلها تلقائياً'); },
  genImp: function () { var c = cur(); if (!c || !c.hx || !c.hx.intake) return; var m = hxMap(c.hx.intake); ['sex', 'age', 'weight', 'height', 'activity', 'goal'].forEach(function (k) { if (m[k] != null && m[k] !== '') c[k] = m[k]; }); save(); main(); toast('استُوردت البيانات من استبيان «زنها»'); },
  genExp: function (v) { var c = cur(); if (!c || !c.plan) return; S.tab = 'plan'; render(); setTimeout(function () { if (A[v]) A[v](); }, 50); },
  genReqImp: function (v) { if (typeof hxApprove !== 'function') return; hxApprove(v).then(function () { var c = S.clients.filter(function (q) { return q.hx && q.hx.cid === v; })[0]; if (c) { A.genPick(c.code); toast('استُورد طلب «زنها»: ابدأ التوليد'); } }); },
  genEm: function (v) { var c = cur(); if (!c) return; genOf(c).em = +v; main(); },
  genEqSug: function () { var c = cur(); if (!c) return; delete c.baseCounts; c.baseCounts = genCounts(c).cn; delete c.mealDist; save(); main(); toast('اقترح النظام الحصص من الأهداف'); },
  genEqDist: function () { var c = cur(); if (!c) return; c.mealDist = E.suggestDist(genCounts(c).cn, +c.meals || 5, D); save(); main(); toast('وُزّعت الحصص على الوجبات'); },
  genEqBuild: function () { var c = cur(); if (!c) return; if (!c.name || !c.sex) { toast('اكتب الاسم وحدّد الجنس أولاً'); return; } c.baseCounts = genCounts(c).cn; c.mealDist = genDist(c); eqStore(c); if (!E.mealDistOk(c, +c.meals || 5, D)) { genOf(c).es = 4; main(); toast('⛔ جدول التوزيع لا يطابق الجدول التركيبي: صحّح الخانات الحمراء أو «وزّع تلقائياً»'); return; } c.plan = E.eqvPlan(ec(c), D, { seed: (c.gen && c.gen.seed) || 0 }); c.planSrc = ''; genWeek(c); save(); main(); toast('وُلّدت خطة الأسبوع بالبدائل'); },
  genSubs: function (v) { GENX.subs = GENX.subs === v ? null : v; GENX.meals = null; main(); },
  genMeals: function (v) { GENX.meals = GENX.meals === +v ? null : +v; GENX.subs = null; main(); },
  genSubPick: function (v) { var c = cur(); if (!c || !c.plan) return; var q = v.split(',').map(Number), d = genOf(c).day || 0, s = c.plan.days[d].slots[q[0]], l = s.lines[q[1]], x = E.subs(l, s.type, c.plan, D, 12)[q[2]]; if (!x) return; E.applySub(c.plan, d, q[0], q[1], x, D); GENX.subs = null; save(); main(); toast('استُبدل: ' + x.text); },
  genMealPick: function (v) { var c = cur(); if (!c || !c.plan) return; var q = v.split(',').map(Number), d = genOf(c).day || 0, s = c.plan.days[d].slots[q[0]], m = E.mealMatch(ec(c), E.slotReq(s), s.type, D, 8)[q[1]]; if (!m) return; var r = E.placeMeal(c.plan, d, q[0], m, D); GENX.meals = null; save(); main(); toast('«' + m.n + '» (' + E.MATCH_AR[m.lvl] + ')' + (r.done ? '، وعُوّض ' + r.done + ' حصة في باقي اليوم' : '') + (r.left ? '؛ بقي ' + r.left + ' حصة بلا تعويض' : '')); },
  genReset: function () { var c = cur(); if (!c) return; delete c.baseCounts; save(); main(); toast('رجعت الحصص لاقتراح النظام'); },
  genMove: function () { var c = cur(); if (!c || !c.plan) return; var g = genOf(c), gi = +$('#gen_mg').value, f = +$('#gen_mf').value, t = +$('#gen_mt').value; if (f === t) { toast('اختر وجبتين مختلفتين'); return; } if (!E.moveEx(c.plan, g.day || 0, gi, f, t, D)) { toast('لا توجد حصة من هذه المجموعة في الوجبة المختارة'); return; } save(); main(); toast('نُقلت حصة'); },
  genBuild: function () { var c = cur(); if (!c) return; var g = genOf(c); if (g.path === 'ready' && c.kind !== 'athlete') { S.tab = 'pw'; render(); return; } A.gen(); if (c.plan && c.kind !== 'athlete') genWeek(c); S.tab = 'gen'; g.step = 4; save(); render(); }
});
