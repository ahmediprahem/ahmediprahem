// ================= 1.19 المرحلة 4: تبويب «توليد الخطة» — يُدمج داخل app.js عند /*GENUI*/
// بند جانبي «توليد الخطة» يفتح قائمة العملاء مع «＋ عميل جديد»، واختيار العميل يفتح ملفه على قسم «توليد» (مجموعة «الخطة»).
// الخطوات: 1 العميل • 2 المراجعة والاستبعاد (سبب كل استبعاد، ويعتمده الأخصائي) • 3 الإعداد (النظام، الوجبات، جاهز أو يدوي، شكل الأسبوع) • 4 الخطة • 5 المراجعة والإرسال.
// لا نظام موازٍ: الحقول هي الحقول الحالية (excludedFoods وavoid وmeals وdiet)، والجديد c.gen = { step, rev, path, week, fastPat }.
// قرار المالك: الاستبعاد الصحي «بحذر» تنبيه فقط بلا استبعاد تلقائي حتى يعتمد قائمة مايكل (قواعد «تجنّب» القائمة كما كانت).
var GEN_STEPS = [['client', 'العميل'], ['rev', 'المراجعة والاستبعاد'], ['setup', 'الإعداد'], ['plan', 'الخطة'], ['send', 'المراجعة والإرسال']];
var GEN_WEEK = [['fixed', 'ثابت', 'اليوم نفسه كل أيام الأسبوع'], ['var', 'متغير', 'أيام مختلفة بالسعرات نفسها'], ['fast', 'صيام الاثنين والخميس', 'صيام سنّة يومي الاثنين والخميس، بالسعرات نفسها']];
// أنماط يوم الصيام (قرار المالك): بالسعرات نفسها، والنسب الافتراضية قابلة للتعديل
var GEN_FAST = [[1, 'فطور + وجبة خفيفة + سحور', [['الفطور', 0.45], ['وجبة خفيفة', 0.2], ['السحور', 0.35]]], [2, 'وجبة خفيفة + فطور + وجبة خفيفة + سحور', [['وجبة خفيفة', 0.1], ['الفطور', 0.4], ['وجبة خفيفة', 0.15], ['السحور', 0.35]]], [3, 'يحددها الأخصائي يدوياً', null]];
function genOf(c) { var g = c.gen || (c.gen = {}); if (!g.step) g.step = 2; if (!g.path) g.path = 'manual'; if (!g.week) g.week = 'var'; if (!g.fastPat) g.fastPat = 1; return g; }
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
  return '<ol class="gensteps" aria-label="خطوات توليد الخطة">' + GEN_STEPS.map(function (s, i) {
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
  var opt = function (k, v, t, d) { return '<label class="genopt' + (g[k] === v ? ' on' : '') + '"><input type="radio" name="gen_' + k + '" data-gk="' + k + '" value="' + v + '"' + (g[k] === v ? ' checked' : '') + '><b>' + t + '</b>' + (d ? '<small>' + d + '</small>' : '') + '</label>'; };
  return '<div class="ucard gensetup"><h3>نوع النظام</h3>' + (c.kind === 'athlete' ? '<p class="small">نظام الجرامات (محرك الرياضيين).</p>' : dxClientBox(c))
    + (c.kind === 'athlete' ? '' : '<div class="row">' + sel('meals', 'عدد الوجبات', [3, 4, 5, 6]) + '</div>')
    + '<h3>طريقة البناء</h3><div class="genopts">' + opt('path', 'manual', 'يدوي جديد', 'النظام يحسب الحصص وتوزيعها، وتعدّل أنت') + opt('path', 'ready', 'جاهز من البنك', 'خطة جاهزة تناسب السعرات، ويُستبدل المستبعد تلقائياً') + '</div>'
    + '<h3>شكل الأسبوع</h3><div class="genopts">' + GEN_WEEK.map(function (w) { return opt('week', w[0], w[1], w[2]); }).join('') + '</div>'
    + (g.week === 'fast' ? '<div class="genfast"><h4>يوم الصيام</h4><div class="genopts">' + GEN_FAST.map(function (f) { return opt('fastPat', f[0], f[1], f[2] ? f[2].map(function (q) { return q[0] + ' ' + Math.round(q[1] * 100) + '%'; }).join(' • ') : 'توزيع تكتبه أنت'); }).join('') + '</div><p class="small">بالسعرات نفسها لباقي الأيام. النسب قابلة للتعديل.</p></div>' : '')
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
function genManual(c, g, T) {
  var G = genCounts(c), cn = G.cn, sg = G.sug.counts, v = E.countsVals(cn, D), sv = E.countsVals(sg, D), sk = E.checkVals(sv, { k: T.kcal, c: T.cho, p: T.pro, f: T.fat });
  var heart = (c.conditions || []).some(function (x) { return x === 'أمراض القلب' || x === 'ارتفاع الكوليسترول والدهون'; });
  var row = function (gi) { var d = cn[gi] - sg[gi], st = d === 0 ? '<span class="ok">✓ مكتمل</span>' : d < 0 ? '<span class="warn">ناقص ' + (-d) + '</span>' : '<span class="warn">زائد ' + d + '</span>';
    return '<tr data-g="' + gi + '"><td>' + esc(D.groups[gi]) + '</td><td><input type="number" class="n" min="0" step="1" data-gc="' + gi + '" value="' + cn[gi] + '" aria-label="حصص ' + esc(D.groups[gi]) + '"></td><td>' + sg[gi] + '</td><td>' + st + '</td></tr>'; };
  var main = [0, 1, 2, 3, 4, 7, 9, 10, 11, 12], warnHF = cn[5] > 0 && heart ? '<p class="err small">⛔ لحوم عالية الدهون مع ' + esc((c.conditions || []).join('، ')) + ': لا تُستعمل (قرار المالك).</p>' : cn[5] > 1 ? '<p class="warn small">⚠ لحوم عالية الدهون: الحد الأقصى المقترح حصة واحدة يومياً.</p>' : '';
  return '<div class="ucard genman"><h3>الحصص اليومية</h3>' + genHud(v, T)
    + (sk.st !== 'ok' ? '<p class="small genf">ℹ اقتراح النظام هو <b>أقرب حل ممكن بحصص صحيحة</b> وليس مطابقاً تماماً: ' + esc(sk.reasons.join('؛ ')) + '.</p>' : '<p class="small">ℹ اقتراح النظام مطابق للهدف بحصص صحيحة.</p>')
    + '<div class="genman2"><table class="st gentbl"><tr><th>المجموعة</th><th>حصصك</th><th>اقتراح النظام</th><th>الحالة</th></tr>' + main.map(row).join('') + '</table>'
    + '<details class="fold"' + (GEN_PREF_G.some(function (q) { return cn[q] > 0; }) ? ' open' : '') + '><summary>مجموعات حسب تفضيل العميل (لحوم عالية الدهون، حليب خالٍ، حليب كامل)</summary><table class="st gentbl">' + GEN_PREF_G.map(row).join('') + '</table></details></div>' + warnHF
    + '<p class="small">حصص صحيحة فقط (قرار المالك).</p><p><button data-a="genBuild">⚙ ولّد الخطة بهذه الحصص</button> ' + (c.baseCounts ? '<button class="sec" data-a="genReset">↺ عُد لاقتراح النظام</button>' : '') + '</p></div>';
}
function genGrid(c, g) {
  var p = c.plan; if (!p || !p.days || !p.days.length || c.kind === 'athlete') return ''; var di = Math.min(g.day || 0, p.days.length - 1), d = p.days[di], req = d.slots.map(E.slotReq), gs = [];
  for (var gi = 0; gi < 13; gi++) if (req.some(function (a) { return a[gi] > 0; })) gs.push(gi);
  var nm = function (s) { return esc(mealNm(p, s)); }, opts = d.slots.map(function (s, k) { return '<option value="' + k + '">' + nm(s) + '</option>'; }).join('');
  return '<div class="ucard gengrid"><h3>توزيع الحصص على الوجبات</h3><p><label for="gen_day">اليوم</label> <select id="gen_day" data-gk="day">' + p.days.map(function (x, i) { return '<option value="' + i + '"' + (i === di ? ' selected' : '') + '>' + esc(dayName(p, i)) + '</option>'; }).join('') + '</select></p>'
    + '<table class="st gentbl"><tr><th>المجموعة</th>' + d.slots.map(function (s) { return '<th>' + nm(s) + '</th>'; }).join('') + '<th>اليوم</th></tr>' + gs.map(function (gi) { var t = 0; return '<tr><td>' + esc(D.groups[gi]) + '</td>' + req.map(function (a) { t += a[gi]; return '<td>' + (a[gi] ? num(a[gi]) : '') + '</td>'; }).join('') + '<td><b>' + num(t) + '</b></td></tr>'; }).join('') + '</table>'
    + '<div class="row genmv"><div><label for="gen_mg">انقل حصة من</label><select id="gen_mg">' + gs.map(function (gi) { return '<option value="' + gi + '">' + esc(D.groups[gi]) + '</option>'; }).join('') + '</select></div><div><label for="gen_mf">من وجبة</label><select id="gen_mf">' + opts + '</select></div><div><label for="gen_mt">إلى وجبة</label><select id="gen_mt">' + opts + '</select></div><div><label>&nbsp;</label><button class="sec" data-a="genMove">⇄ انقل</button></div></div>'
    + '<p class="small">النقل يحفظ الأصناف المختارة: الصنف نفسه يُنقص من وجبة ويُضاف إلى الأخرى، ومجموع اليوم لا يتغيّر.</p></div>';
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
function genPlanStep(c, g) {
  var po = planOf(c), ck = null; if (c.plan && c.plan.days && c.plan.targets && c.kind !== 'athlete' && po.src === 'engine') try { ck = E.checkPlan(c.plan, D); } catch (e) { }
  var T = null; try { T = c.kind === 'athlete' ? null : E.targets(ec(c), D); } catch (e) { }
  var man = g.path === 'manual' && T ? genManual(c, g, T) : '';
  return man + '<div class="ucard genplan gen-' + (ck ? 'st-' + ck.st : 'none') + '" data-st="' + (ck ? ck.st : '') + '"><h3>' + (g.path === 'ready' ? 'خطة جاهزة' : 'خطة يدوية') + '</h3>'
    + (po.has ? '<p>الخطة الحالية: <b>' + esc(po.label) + '</b>' + (po.kcal ? ' • ' + Math.round(po.kcal) + ' سعرة' : '') + '</p>' : '<p class="small">لا خطة بعد.</p>')
    + (ck ? '<p class="genst">' + { ok: '✔ مطابقة', warn: '⚠ تحتاج نظرك', block: '⛔ غير مطابقة' }[ck.st] + ': ' + ck.ok + ' أيام مطابقة، ' + ck.warn + ' تنبيه، ' + ck.block + ' مانع</p>' : '')
    + '<p>' + (man ? '' : '<button data-a="genBuild">' + (po.has ? '↻ أعد التوليد' : '⚙ ولّد الخطة') + '</button> ') + (po.has ? '<button class="sec" data-a="tab" data-v="plan">افتح الخطة للتعديل</button> ' : '') + '<button class="sec" data-a="genStep" data-v="5">التالي: المراجعة والإرسال ›</button></p></div>' + (g.path === 'manual' ? genGrid(c, g) : '') + (T && po.src === 'engine' ? genEditor(c, g, T) : '');
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
function genTab(c) {
  var g = genOf(c), body = g.step <= 2 ? genRev(c, g) : g.step === 3 ? genSetup(c, g) : g.step === 4 ? genPlanStep(c, g) : genSend(c, g);
  return '<div class="gentab">' + genStepper(c, g) + body + '</div>';
}
function genPage() {
  return '<div class="clpage genpage"><div class="hxtop"><h2>توليد الخطة</h2><span class="two"><button data-a="genNew" data-v="ex">＋ عميل جديد — الحصص</button> <button class="sec" data-a="genNew" data-v="ath">＋ عميل جديد — الجرامات</button></span></div>'
    + '<p class="small">اختر العميل لتبدأ: مراجعة بياناته والاستبعاد، ثم الإعداد، ثم الخطة.</p>'
    + '<div class="genlist">' + S.clients.slice().sort(function (a, b) { return (b.updated || b.created) - (a.updated || a.created); }).map(function (c) {
      return '<button class="cl" data-a="genPick" data-v="' + esc(c.code) + '"><span class="cav">' + esc(initial(c.name)) + '</span><b>' + esc(c.name || '(بلا اسم)') + '</b><small>' + esc(c.code) + (c.kind === 'athlete' ? ' • جرامات' : '') + (planOf(c).has ? ' • لديه خطة' : '') + '</small></button>';
    }).join('') + '</div></div>';
}
(function (f) { main0 = function () { if (S.view === 'gen') { $('main').innerHTML = genPage(); return; } return f.apply(this, arguments); }; })(main0);
document.addEventListener('change', function (e) {
  var t = e.target, c = cur(); if (!c || !t.dataset) return;
  if (t.dataset.ge && c.plan) { var q = t.dataset.ge.split(',').map(Number); E.setLineE(c.plan, genOf(c).day || 0, q[0], q[1], Math.max(0, +t.value || 0), D); GENX.subs = null; save(); main(); return; }
  if (t.dataset.gc != null) { var G = genCounts(c), cn = G.cn.slice(); cn[+t.dataset.gc] = Math.max(0, Math.round(+t.value || 0)); c.baseCounts = cn; save(); main(); return; }
  if (!t.dataset.gk) return; var g = genOf(c); g[t.dataset.gk] = t.dataset.gk === 'fastPat' || t.dataset.gk === 'day' ? +t.value : t.value; save(); main();
});
Object.assign(A, {
  genTab: function () { document.body.classList.remove('menu'); S.view = 'gen'; S.cur = null; render(); window.scrollTo(0, 0); },
  genPick: function (v) { return A.pick(v).then(function () { S.tab = 'gen'; render(); }); },
  genNew: function (v) { A.new(v === 'ath' ? 'ath' : 'ex'); S.tab = 'client'; render(); toast('أكمل بيانات العميل، ثم افتح «توليد» من مجموعة «الخطة»'); },
  genStep: function (v) { var c = cur(); if (!c) return; genOf(c).step = Math.max(2, Math.min(5, +v)); save(); main(); window.scrollTo(0, 0); },
  genRevOk: function () { var c = cur(); if (!c) return; var g = genOf(c); g.rev = Date.now(); g.step = 3; save(); main(); toast('اعتُمدت المراجعة'); },
  genUnex: function (v) { var c = cur(); if (!c) return; c.excludedFoods = (c.excludedFoods || []).filter(function (n) { return n !== v; }); c.avoid = (c.avoid || []).filter(function (n) { return n !== v; }); genOf(c).rev = null; save(); main(); toast('أُرجع «' + v + '»'); },
  genEx: function (v) { var c = cur(); if (!c || !v) return; c.excludedFoods = c.excludedFoods || []; if (c.excludedFoods.indexOf(v) < 0) c.excludedFoods.push(v); genOf(c).rev = null; save(); main(); toast('استُبعد «' + v + '»'); },
  genAdd: function () { var i = $('#gen_add'), v = i && i.value.trim(); if (!v) return; if (!D.foods.some(function (f) { return f.n === v; })) { toast('اختر صنفاً من القائمة'); return; } A.genEx(v); },
  genSubs: function (v) { GENX.subs = GENX.subs === v ? null : v; GENX.meals = null; main(); },
  genMeals: function (v) { GENX.meals = GENX.meals === +v ? null : +v; GENX.subs = null; main(); },
  genSubPick: function (v) { var c = cur(); if (!c || !c.plan) return; var q = v.split(',').map(Number), d = genOf(c).day || 0, s = c.plan.days[d].slots[q[0]], l = s.lines[q[1]], x = E.subs(l, s.type, c.plan, D, 12)[q[2]]; if (!x) return; E.applySub(c.plan, d, q[0], q[1], x, D); GENX.subs = null; save(); main(); toast('استُبدل: ' + x.text); },
  genMealPick: function (v) { var c = cur(); if (!c || !c.plan) return; var q = v.split(',').map(Number), d = genOf(c).day || 0, s = c.plan.days[d].slots[q[0]], m = E.mealMatch(ec(c), E.slotReq(s), s.type, D, 8)[q[1]]; if (!m) return; var r = E.placeMeal(c.plan, d, q[0], m, D); GENX.meals = null; save(); main(); toast('«' + m.n + '» (' + E.MATCH_AR[m.lvl] + ')' + (r.done ? '، وعُوّض ' + r.done + ' حصة في باقي اليوم' : '') + (r.left ? '؛ بقي ' + r.left + ' حصة بلا تعويض' : '')); },
  genReset: function () { var c = cur(); if (!c) return; delete c.baseCounts; save(); main(); toast('رجعت الحصص لاقتراح النظام'); },
  genMove: function () { var c = cur(); if (!c || !c.plan) return; var g = genOf(c), gi = +$('#gen_mg').value, f = +$('#gen_mf').value, t = +$('#gen_mt').value; if (f === t) { toast('اختر وجبتين مختلفتين'); return; } if (!E.moveEx(c.plan, g.day || 0, gi, f, t, D)) { toast('لا توجد حصة من هذه المجموعة في الوجبة المختارة'); return; } save(); main(); toast('نُقلت حصة'); },
  genBuild: function () { var c = cur(); if (!c) return; var g = genOf(c); if (g.path === 'ready' && c.kind !== 'athlete') { S.tab = 'pw'; render(); return; } A.gen(); S.tab = 'gen'; g.step = 4; save(); render(); }
});
