// ================= 1.19 المرحلة 4: تبويب «توليد الخطة» — يُدمج داخل app.js عند /*GENUI*/
// بند جانبي «توليد الخطة» يفتح قائمة العملاء مع «＋ عميل جديد»، واختيار العميل يفتح ملفه على قسم «توليد» (مجموعة «الخطة»).
// الخطوات: 1 العميل • 2 المراجعة والاستبعاد (سبب كل استبعاد، ويعتمده الأخصائي) • 3 الإعداد (النظام، الوجبات، جاهز أو يدوي، شكل الأسبوع) • 4 الخطة • 5 المراجعة والإرسال.
// لا نظام موازٍ: الحقول هي الحقول الحالية (excludedFoods وavoid وmeals وdiet)، والجديد c.gen = { step, rev, path, week, fastPat }.
// قرار المالك: الاستبعاد الصحي «بحذر» تنبيه فقط بلا استبعاد تلقائي حتى يعتمد قائمة مايكل (قواعد «تجنّب» القائمة كما كانت).
// 1.29 (قرار المالك): بيانات العميل أولاً ← اختيار النظام (حصص أو جرامات) ← المراجعة والاستبعاد ← الخطة ← الإرسال؛ ولا يُطلب حقل مرتين
var GEN_STEPS = [['client', 'العميل'], ['setup', 'النظام'], ['rev', 'الفحص'], ['plan', 'البناء'], ['send', 'الإرسال']];      // 1.37: المسار الموحد (قرار المالك)
var GEN_WEEK = [['fixed', 'ثابت', 'اليوم نفسه كل أيام الأسبوع'], ['var', 'متغير', 'أيام مختلفة بالسعرات نفسها'], ['fast', 'صيام الاثنين والخميس', 'صيام سنّة يومي الاثنين والخميس، بالسعرات نفسها']];
// أنماط يوم الصيام (قرار المالك): بالسعرات نفسها، والنسب الافتراضية قابلة للتعديل
var GEN_FAST = [[1, 'فطور + وجبة خفيفة + سحور', [['الفطور', 0.45], ['وجبة خفيفة', 0.2], ['السحور', 0.35]]], [2, 'وجبة خفيفة + فطور + وجبة خفيفة + سحور', [['وجبة خفيفة', 0.1], ['الفطور', 0.4], ['وجبة خفيفة', 0.15], ['السحور', 0.35]]], [3, 'يحددها الأخصائي يدوياً', null]];
// 1.23 المرحلة 8: شكل الأسبوع يُطبَّق على الخطة بعد التوليد أو التحويل (ثابت، أو صيام الاثنين والخميس بنمط المالك؛ النمط 3 يبدأ من النمط 1 ويوزّعه الأخصائي بشبكة النقل)
function genFastPct(g) { var p = g.fastPat === 2 ? 2 : 1; return (g.fastPct && g.fastPct[p]) || E.FASTP[p].map(function (x) { return x[2]; }); }
function genWeek(c) { var g = genOf(c); if (!c.plan || !c.plan.days || g.week === 'var') return; E.applyWeek(c.plan, g.week, g.fastPat === 2 ? 2 : 1, D, genFastPct(g)); if (g.week === 'fast') c.plan.fastPat = g.fastPat; }
function genBodyOk(c) { return !!(c.name && c.sex && +c.age > 0 && +c.weight > 0 && +c.height > 0 && (c.kind === 'athlete' || (c.activity && c.goal))); }
// 1.29: ترتيب الخطوات الجديد (الإعداد قبل المراجعة)؛ g.v=2 يحوّل الخطوات المحفوظة بالترتيب القديم
function genOf(c) { var g = c.gen || (c.gen = {}); if (!g.v) { if (g.step === 2) g.step = 3; else if (g.step === 3) g.step = 2; g.v = 2; } if (!g.step) g.step = genBodyOk(c) ? 2 : 1; if (!g.path || g.path === 'manual' || g.path === 'ready') g.path = 'eqv';      // 1.37: مسار الحصص الجديد فقط (الخطط الجاهزة القديمة تبقى للعرض في «الخطة»)      // 1.28: حُذف «المحرك السابق» بقرار المالك      // 1.26: طريقة البدائل هي الافتراضية (قرار المالك)
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
  var cs = GEN_STEPS[g.step - 1], mob = '<nav class="genstepm" aria-label="خطوات توليد الخطة"><button class="sec" data-a="genStep" data-v="' + (g.step - 1) + '"' + (g.step <= 1 ? ' disabled' : '') + ' aria-label="الخطوة السابقة">›</button><span><b>' + g.step + ' من ' + GEN_STEPS.length + '</b> • ' + cs[1] + '</span><button class="sec" data-a="genStep" data-v="' + (g.step + 1) + '"' + (g.step >= 5 ? ' disabled' : '') + ' aria-label="الخطوة التالية">‹</button></nav>';      // 1.25: شريط خطوات مضغوط للجوال
  return mob + '<ol class="gensteps" aria-label="خطوات توليد الخطة">' + GEN_STEPS.map(function (s, i) {
    var n = i + 1, st = n < g.step ? 'done' : n === g.step ? 'on' : 'next';
    return '<li class="gs-' + st + '"><button class="sec sm" data-a="genStep" data-v="' + n + '"' + (n === g.step ? ' aria-current="step"' : '') + '><i>' + (st === 'done' ? '✓' : n) + '</i> ' + s[1] + '</button></li>';
  }).join('') + '</ol>';
}
function genCard(c) {
  var T = null; try { T = c.kind === 'athlete' ? null : E.targets(ec(c), D); } catch (e) { }
  var mf = c.hx && c.hx.intake && c.hx.intake.mfood, love = (c.love || []).slice(0, 12);
  return '<div class="ucard gencl"><h3>الفحص: السلامة والحالة الصحية</h3>'      // 1.37: بلا تكرار الاسم والقياسات (في رأس المسار وخطوة «العميل»)
    + (typeof safetyBanner === 'function' ? safetyBanner(c.safety || (c.age > 0 && c.age < 18 ? { minor: true } : null)) : '')
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
    + '<p class="genfoot">' + (g.rev ? '<span class="ok">✔ اعتمدتَ الفحص</span> ' : '') + '<button data-a="genRevOk">اعتمد الفحص والتالي ›</button></p></div>';
}
function genSetup(c, g) {
  var opt = function (k, v, t, d) { return '<label class="genopt' + (g[k] === v ? ' on' : '') + '"><input type="radio" name="gen_' + k + '" data-gnk="' + k + '" value="' + v + '"' + (g[k] === v ? ' checked' : '') + '><b>' + t + '</b>' + (d ? '<small>' + d + '</small>' : '') + '</label>'; };
  var qz = c.hx && c.hx.quiz && window.RL && typeof rdQuizNote === 'function' ? rdQuizNote(c) + (c.hx.quiz.pick ? '<p><button class="sec" data-a="genBank">📗 اعرض اختيار العميل من الخطط الجاهزة</button></p>' : '') : '';      // 1.37: اختيار العميل في «زنها» لخطة جاهزة يبقى ظاهراً هنا (لا يضيع بحذف المدخل القديم)
  return '<div class="ucard gensetup">' + qz + genKindCards(c) + '<h3>نوع النظام الغذائي</h3>' + dxClientBox(c)
    + (c.kind === 'athlete' ? '' : '<div class="row">' + sel('meals', 'عدد الوجبات', [3, 4, 5, 6]) + '</div>')
   
    + '<h3>شكل الأسبوع</h3><div class="genopts">' + GEN_WEEK.map(function (w) { return opt('week', w[0], w[1], w[2]); }).join('') + '</div>'
    + (g.week === 'fast' ? '<div class="genfast"><h4>يوم الصيام</h4><div class="genopts">' + GEN_FAST.map(function (f) { return opt('fastPat', f[0], f[1], f[2] ? f[2].map(function (q) { return q[0] + ' ' + Math.round(q[1] * 100) + '%'; }).join(' • ') : 'توزيع تكتبه أنت'); }).join('') + '</div>' + (g.fastPat !== 3 ? '<div class="row genfp">' + E.FASTP[g.fastPat === 2 ? 2 : 1].map(function (x, i) { return '<div><label for="gen_fp' + i + '">' + x[0] + ' %</label><input id="gen_fp' + i + '" type="number" min="0" max="100" step="5" data-gfp="' + i + '" value="' + Math.round(genFastPct(g)[i] * 100) + '"></div>'; }).join('') + '</div>' + (Math.abs(genFastPct(g).reduce(function (a, v) { return a + v; }, 0) - 1) > 0.001 ? '<p class="warn small">⚠ مجموع النسب ' + Math.round(genFastPct(g).reduce(function (a, v) { return a + v; }, 0) * 100) + '% (يُعاد تطبيعه إلى 100%).</p>' : '') : '<p class="small">يبدأ يوم الصيام بتوزيع النمط الأول، ثم توزّعه أنت بشبكة «انقل حصة».</p>') + '<p class="small">بالسعرات نفسها لباقي الأيام. النسب قابلة للتعديل.</p></div>' : '')
    + '<p class="genfoot"><button data-a="genStep" data-v="3">التالي: الفحص ›</button></p></div>';
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
// 1.32: حُذف «محرر اليوم» من خطوة الخطة (قرار المالك: لا يضيف معنى)؛ التعديل من «الخطة» نفسها
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
var EQ_STEPS = ['الطاقة', 'الماكروز', 'الجدول التركيبي', 'التوزيع وبنك الوجبات', 'قائمة الطعام', 'جدول البدائل'];      // 1.37: جدول البدائل خطوة فرعية أخيرة
function genAdq(v, t) { var a = E.adequacy(v, t); return '<span class="ad st-' + a.st + '">' + Math.round(a.pct) + '%</span>'; }
function genDist(c) { var meals = +c.meals || 5, cn = genCounts(c).cn, md = c.mealDist, n = E.slots(meals, D).length; if (!md || md.length !== n || md.some(function (r) { return !r || r.length !== 13; })) return E.suggestDist(cn, meals, D); return md.map(function (r) { return r.map(Number); }); }      // الجدول كما عدّله الأخصائي، ويُتحقق من تطابقه عند البناء
// 1.27: أيام متعددة — c.eqvDays[i] = {n, cn, md, picks}؛ اليوم النشط نسخته العاملة في baseCounts/mealDist/eqvPicks
function eqStore(c) { var g = genOf(c); if (!c.eqvDays || !c.eqvDays.length) c.eqvDays = [{ n: 'اليوم 1' }]; var k = Math.min(g.ed || 0, c.eqvDays.length - 1), x = c.eqvDays[k]; x.cn = genCounts(c).cn.slice(); x.md = genDist(c).map(function (r) { return r.slice(); }); x.picks = Object.assign({}, c.eqvPicks || {}); x.bank = JSON.parse(JSON.stringify(c.eqvBank || {})); }
function eqLoad(c, k) { var x = c.eqvDays[k]; genOf(c).ed = k; c.baseCounts = x.cn.slice(); c.mealDist = x.md.map(function (r) { return r.slice(); }); c.eqvPicks = Object.assign({}, x.picks || {}); c.eqvBank = JSON.parse(JSON.stringify(x.bank || {})); }
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
function genExportBar(c) {      // 1.37: الإرسال والتصدير في خطوة «الإرسال» وحدها
  if (!c.plan || c.plan.method !== 'eqv') return '';
  return '<div class="eqexp"><b>✔ خطة الأسبوع جاهزة.</b> <button data-a="genStep" data-v="5">التالي: الإرسال والتصدير ›</button> <button class="sec" data-a="tab" data-v="plan">افتح الخطة</button></div>';
}
function genEqv(c, g, T) {
  if ((g.es || 1) >= 3) eqStore(c);
  var es = g.es || 1, x = ec(c), BM = E.bmrOf(x), sl = E.slots(+c.meals || 5, D), h = '<div class="ucard geneqv"><div class="eqsteps" style="--p:' + ((es - 1) / 5) + '">' + EQ_STEPS.map(function (t, i) { var n = i + 1; return '<button class="sec sm' + (n === es ? ' on' : n < es ? ' done' : '') + '" data-a="genEs" data-v="' + n + '"><i>' + (n < es ? '✓' : n) + '</i> ' + t + '</button>'; }).join('') + '</div>';
  if (es === 1) {
    var cur0 = E.BMRF.filter(function (q) { return q[0] === BM.f; })[0];
    h += '<h3>1. الطاقة</h3>' + genImportBtn(c) + '<div class="row"><div><label for="geq_f">المعادلة</label><select id="geq_f" data-f="bmrF">' + E.BMRF.map(function (q) { return '<option value="' + q[0] + '"' + ((c.bmrF || 'mifflin') === q[0] ? ' selected' : '') + '>' + q[1] + '</option>'; }).join('') + '</select><small class="eqwhen">' + esc(cur0[2]) + ' <i>(' + esc(cur0[3]) + ')</i></small></div>'
      + '<div class="eqfrom"><label>من بيانات العميل</label><span class="gchip">🏃 ' + esc(c.activity || '—') + '</span><span class="gchip">🎯 ' + esc(c.goal || '—') + '</span> <button class="link" data-a="genStep" data-v="1">✎ تعديل</button></div>'
      + '<div><label><input type="checkbox" data-bf="eta"' + (c.eta ? ' checked' : '') + '> تأثير الهضم 10%</label><small class="eqwhen">معطّل افتراضياً: معاملات النشاط تشمله، فلا يُحسب مرتين.</small></div></div>'
      + (BM.note ? '<p class="warn small">⚠ ' + esc(BM.note) + '</p>' : '') + '<p class="eqbig"><b class="cnt" data-to="' + Math.round(T.kcal) + '">' + Math.round(T.kcal) + '</b> سعرة <small>يومياً</small></p><div class="tgx small">ℹ ' + esc(E.explain(T, c)) + (c.eta ? ' (مع تأثير الهضم 10%)' : '') + '</div>' + (typeof genDietBox === 'function' ? genDietBox(c) : '');      // 1.43ب: نوع النظام بعد حساب الطاقة
  } else if (es === 2) {
    var pc = function (k, d0) { return Math.round((c[k] == null ? d0 : +c[k]) * 100); }, cp = pc('choPct', 0.45), pp = pc('proPct', 0.25), fp = pc('fatPct', 0.3);
    var row = function (k, l, p, div) { return '<tr><td><b>' + l + '</b></td><td><input type="range" class="gsl gsl-' + k + '" min="0" max="80" step="1" data-gm="' + k + '" value="' + p + '" aria-label="' + l + ' %"><input type="number" class="n" min="0" max="100" step="1" data-gm="' + k + '" value="' + p + '"> %</td><td>' + Math.round(T.kcal * p / 100) + '</td><td><b>' + Math.round(T.kcal * p / 100 / div) + '</b> جم</td><td>' + (c.weight ? (T.kcal * p / 100 / div / c.weight).toFixed(1) : '—') + '</td></tr>'; };
    h += '<h3>2. توزيع الماكروز <small>(' + Math.round(T.kcal) + ' سعرة)</small></h3>' + genRing(cp, pp, fp, T.kcal) + '<table class="st gentbl"><tr><th>الماكرو</th><th>النسبة</th><th>سعرات</th><th>جرامات</th><th>جم/كجم</th></tr>' + row('choPct', '● الكربوهيدرات', cp, 4) + row('proPct', '◆ البروتين', pp, 4) + row('fatPct', '✦ الدهون', fp, 9)
      + '<tr><td>المجموع</td><td colspan="4">' + (cp + pp + fp === 100 ? '<span class="ad st-ok">✓ 100%</span>' : '<span class="ad st-block">' + (cp + pp + fp) + '%: يجب أن يكون 100%</span>') + '</td></tr></table>';
  } else if (es === 3) {
    h += eqDayBar(c, g);
    var G = genCounts(c), cn = G.cn, v = E.countsVals(cn, D);
    h += '<h3>3. الجدول التركيبي: كم حصة من كل مجموعة؟ <button class="sec sm" data-a="genEqSug">✦ اقترح الحصص</button></h3>' + genGauges(v, T) + '<table class="st gentbl eqtbl"><tr><th>المجموعة</th><th>الحصص</th><th>سعرات</th><th>كربوهيدرات</th><th>بروتين</th><th>دهون</th></tr>'
      + D.groups.map(function (gn, i) { return '<tr data-g="' + i + '"><td>' + genGi(i) + esc(gn) + '</td><td>' + genStp('gc', i, cn[i]) + '</td><td>' + Math.round(cn[i] * D.EX[i][3]) + '</td><td>' + cn[i] * D.EX[i][0] + '</td><td>' + cn[i] * D.EX[i][1] + '</td><td>' + cn[i] * D.EX[i][2] + '</td></tr>'; }).join('')
      + '<tr class="eqsum"><td>المجموع</td><td>' + cn.reduce(function (a, b) { return a + b; }, 0) + '</td><td>' + Math.round(v.k) + '</td><td>' + Math.round(v.c) + '</td><td>' + Math.round(v.p) + '</td><td>' + Math.round(v.f) + '</td></tr>'
      + '<tr><td>الهدف</td><td></td><td>' + Math.round(T.kcal) + '</td><td>' + Math.round(T.cho) + '</td><td>' + Math.round(T.pro) + '</td><td>' + Math.round(T.fat) + '</td></tr>'
      + '<tr class="eqsum eqadq"><td>نسبة الملاءمة</td><td></td><td>' + genAdq(v.k, T.kcal) + '</td><td>' + genAdq(v.c, T.cho) + '</td><td>' + genAdq(v.p, T.pro) + '</td><td>' + genAdq(v.f, T.fat) + '</td></tr></table>'
      + (function () { var heart = (c.conditions || []).some(function (q) { return q === 'أمراض القلب' || q === 'ارتفاع الكوليسترول والدهون'; }); return cn[5] > 0 && heart ? '<p class="err small eqhf">⛔ لحوم عالية الدهون مع ' + esc((c.conditions || []).join('، ')) + ': لا تُستعمل (قرار المالك).</p>' : cn[5] > 1 ? '<p class="warn small eqhf">⚠ لحوم عالية الدهون: الحد الأقصى المقترح حصة واحدة يومياً.</p>' : ''; })()
      + '<p class="small">الملاءمة = المحسوب ÷ الهدف. أخضر 95–105% (قرار المالك)، كهرماني 90–110%، أحمر خارجها. حصص صحيحة فقط.</p>';
  } else if (es === 4) {
    h += eqDayBar(c, g);
    var cn4 = genCounts(c).cn, md = genDist(c), act = sl.filter(function (q) { return q.active; });
    var over4 = D.groups.map(function (gn, gi) { var t = act.reduce(function (a, q) { return a + ((c.eqvBank || {})[q.i] ? md[q.i][gi] : 0); }, 0); return t > cn4[gi] ? gn + ' (' + t + ' من ' + cn4[gi] + ')' : ''; }).filter(Boolean);
    h += '<h3>4. توزيع الحصص على الوجبات <button class="sec sm" data-a="genEqDist">↻ وزّع تلقائياً</button></h3>' + (over4.length ? '<p class="err small eqbkover">⛔ وجبات البنك تأخذ أكثر من حصص اليوم في: ' + esc(over4.join('، ')) + '. عدّل الجدول التركيبي أو اختر وجبة أخرى.</p>' : '') + (genNarrow() ? genDistCards(c, cn4, md, act) : '<table class="st gentbl eqdist"><tr><th>المجموعة</th>' + act.map(function (q) { return '<th>' + genBkHead(c, q) + esc(q.name) + '</th>'; }).join('') + '<th>المجموع</th><th>اليومي</th></tr>'
      + D.groups.map(function (gn, gi) { if (!cn4[gi] && !act.some(function (q) { return md[q.i][gi] > 0; })) return ''; var t = 0; return '<tr><td>' + genGi(gi) + esc(gn) + '</td>' + act.map(function (q) { t += md[q.i][gi]; return (c.eqvBank || {})[q.i] ? '<td class="eqbkc"><b>' + md[q.i][gi] + '</b></td>' : '<td><input type="number" class="n" min="0" step="0.5" data-gd="' + q.i + ',' + gi + '" value="' + md[q.i][gi] + '"></td>'; }).join('') + '<td><b>' + t + '</b></td><td>' + (t === cn4[gi] ? '<span class="ad st-ok">✓ ' + cn4[gi] + '</span>' : '<span class="ad st-block">' + cn4[gi] + '</span>') + '</td></tr>'; }).join('')
      + '<tr class="eqsum"><td>سعرات الوجبة</td>' + act.map(function (q) { return '<td>' + Math.round(E.countsVals(md[q.i], D).k) + '</td>'; }).join('') + '<td>' + Math.round(E.countsVals(cn4, D).k) + '</td><td></td></tr></table>' + (GENX.bk != null && act.some(function (q) { return q.i === GENX.bk; }) ? genBkPanel(c, act.filter(function (q) { return q.i === GENX.bk; })[0], md) : '') + (GENX.bkEd != null && act.some(function (q) { return q.i === GENX.bkEd; }) ? genBkEdit(c, act.filter(function (q) { return q.i === GENX.bkEd; })[0]) : ''));
  } else if (es === 6) {
    h += genAltStep(c);
  } else {
    h += eqDayBar(c, g);
    var md5 = genDist(c), act5 = sl.filter(function (q) { return q.active && md5[q.i].some(function (v0) { return v0 > 0; }); }), mi = Math.min(g.em || 0, act5.length - 1), q5 = act5[mi], picks = c.eqvPicks || {}, cx = E.ctx(ec(c), D);
    h += '<h3>5. قائمة الطعام <span class="eqauto"><button class="sec sm" data-a="genAutoMeal">✦ ولّد هذه الوجبة تلقائياً</button> <button class="sec sm" data-a="genAutoAll">✦ ولّد كل الوجبات</button></span></h3><div class="eqmeals">' + act5.map(function (q, i) { return '<button class="sec sm' + (i === mi ? ' on' : '') + '" data-a="genEm" data-v="' + i + '">' + esc(q.name) + '</button>'; }).join('') + '</div>';
    if (q5) {
      var row5 = md5[q5.i], lines = '', mv = E.countsVals(row5, D);
      var mt5 = 0, gm5 = -1; [2, 3, 4, 5].forEach(function (q) { var v = +row5[q] || 0; mt5 += v; if (v > 0 && (gm5 < 0 || v > (+row5[gm5] || 0))) gm5 = q; });
      E.EQV_ORDER.forEach(function (gi) { var e = row5[gi]; if (gi >= 2 && gi <= 5) { if (gi !== gm5) return; e = mt5; } if (!e) return; var cands = E.eqvCands(ec(c), gi, q5.type, D, cx, e), key = q5.i + '_' + gi, cur5 = picks[key] || ''; var f0 = cands.filter(function (f) { return f.n === cur5; })[0] || cands[0];
        lines += '<div class="eqli"><span class="eqgi">' + genGi(gi) + '</span><div class="eqlt"><b>' + (f0 ? esc(E.lineText(f0, e, c.alias)) : 'لا صنف مناسب') + '</b><small>' + e + ' ' + esc(D.groups[gi]) + '</small></div><select data-gp="' + key + '" aria-label="صنف ' + esc(D.groups[gi]) + '"><option value="">تلقائي (يتنوّع يومياً)</option>' + cands.slice(0, 40).map(function (f) { return '<option' + (f.n === cur5 ? ' selected' : '') + '>' + esc(f.n) + '</option>'; }).join('') + (typeof flxBuilderOpts === 'function' ? flxBuilderOpts(c, q5.i, gi, e) : '') + '</select></div>'; });      // 1.49ب: تبادل بروتين مرن من مجموعات أخرى
      h += '<div class="eqdish"><div class="eqlines">' + lines + '</div><div class="mf"><span class="mc kc">🔥 ' + Math.round(mv.k) + ' سعرة</span><span class="mc cb">● ' + mv.c + ' جم</span><span class="mc pr">◆ ' + mv.p + ' جم</span><span class="mc ft">✦ ' + mv.f + ' جم</span></div></div>'
        + '<p class="small">«تلقائي» يختار من الأصناف المناسبة للوجبة والعميل (بلا المستبعد والحساسية) ويتنوّع كل يوم؛ اختيار صنف يثبّته كل الأيام.</p>';
    }
    h += eqWeekRow(c) + genFavBox(c) + '<p><button data-a="genEqBuild">⚙ ولّد خطة الأسبوع بالبدائل</button></p>' + genExportBar(c);
  }
  return h + '<p class="genfoot eqfoot">' + (es > 1 ? '<button class="sec" data-a="genEs" data-v="' + (es - 1) + '" aria-label="السابق">›</button>' : '') + (es < EQ_STEPS.length ? '<button data-a="genEs" data-v="' + (es + 1) + '">التالي: ' + EQ_STEPS[es] + ' ‹</button>' : '<button data-a="genStep" data-v="5">التالي: الإرسال ‹</button>') + '</p></div>';
}
function genPlanStep(c, g) {
  var po = planOf(c), ck = null; if (c.plan && c.plan.days && c.plan.targets && c.kind !== 'athlete' && po.src === 'engine') try { ck = E.checkPlan(c.plan, D); } catch (e) { }
  var T = null; try { T = c.kind === 'athlete' ? null : E.targets(ec(c), D); } catch (e) { }
  var man = '';
  if (T) man = genQual(c) + genEqv(c, g, T);      // 1.37: لوحة الجودة أعلى خطوة «البناء»، ومسار الحصص الجديد وحده
  if (!po.has && man) return man;      // 1.29: لا بطاقة «خطة يدوية» قبل التوليد (حُذف المسار اليدوي)
  return man + '<div class="ucard genplan gen-' + (ck ? 'st-' + ck.st : 'none') + '" data-st="' + (ck ? ck.st : '') + '"><h3>' + 'الخطة' + '</h3>'
    + (po.has && ck && genZz() ? '<div class="zzrow zzproline"><span class="zzmini">' + genZz(ck.st === 'ok' ? { prop: 'board', mouth: 'smile', anim: 'nod' } : { prop: 'magnifier', mouth: 'calm', brow: 1 }) + '</span><span class="zzs">' + (ck.st === 'ok' ? 'تمام يا دكتور: ' + ck.ok + ' من ' + (ck.ok + ck.warn + ck.block) + ' أيام مطابقة ✓' : 'لحظة… في ' + (ck.warn + ck.block) + (ck.warn + ck.block > 1 ? ' أيام تحتاج' : ' يوم يحتاج') + ' نظرك قبل الإرسال') + '</span></div>' : '')
    + (po.has ? genBento(c, ck, T, po) : '<p class="small">لا خطة بعد.</p>')
    + (ck ? '<p class="genst">' + { ok: '✔ مطابقة', warn: '⚠ تحتاج نظرك', block: '⛔ غير مطابقة' }[ck.st] + ': ' + ck.ok + ' أيام مطابقة، ' + ck.warn + ' تنبيه، ' + ck.block + ' مانع</p>' : '')
    + '<p>' + (man ? '' : '<button data-a="genBuild">' + (po.has ? '↻ أعد التوليد' : '⚙ ولّد الخطة') + '</button> ') + (po.has ? '<button class="sec" data-a="tab" data-v="plan">افتح الخطة للتعديل</button> ' : '') + '<button class="sec" data-a="genStep" data-v="5">التالي: الإرسال ›</button></p></div>' ;
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
    + (!po.has ? '<p class="small">ولّد الخطة أولاً.</p>' : c.hx ? '<p><button data-a="hxSendPlan"' + (T && T.lowBlock ? ' disabled' : '') + '>' + IC('send') + ' أرسل الخطة إلى «زنها»</button></p>' : '<p><button class="sec" data-a="hxSendOrInvite">ادعُ العميل إلى «زنها» لإرسال الخطة</button></p>')
    + genOut(c) + '</div>';
}
// ---- 1.24 المرحلة 9: قسم الجرامات — الخطوات نفسها بمحرك الرياضيين (Ath)، والفحص بالحدود نفسها على كل يوم (السعرات مقابل سعرات الماكروز المستهدفة)
function genAthT(c) { try { return Ath.targets(ec(c), AD); } catch (e) { return null; } }
function genAthCheck(d) { var t = d.t || {}, g0 = d.got || {}; return E.checkVals({ k: g0.k, c: g0.c, p: g0.p, f: g0.f }, { k: t.macroKcal || t.kcal, c: t.c, p: t.p, f: t.f }); }
function genAthPlanCk(c) { var p = c.plan; if (!p || p.kind !== 'athlete' && !(p.days && p.days[0] && p.days[0].meals)) return null; var days = p.days.map(genAthCheck), st = days.reduce(function (a, d) { return { ok: 0, warn: 1, block: 2 }[d.st] > { ok: 0, warn: 1, block: 2 }[a] ? d.st : a; }, 'ok'); return { st: st, days: days, ok: days.filter(function (d) { return d.st === 'ok'; }).length, warn: days.filter(function (d) { return d.st === 'warn'; }).length, block: days.filter(function (d) { return d.st === 'block'; }).length }; }
function genAthRev(c, g) {
  var T = genAthT(c), L = (c.avoid || []).map(function (n) { return { n: n, k: 'avoid' }; }).concat(String(c.keywords || '').split(/[,،\n]/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (n) { return { n: n, k: 'kw' }; }));
  return '<div class="ucard gencl"><h3>الفحص: السلامة والحالة الصحية</h3>' + (typeof safetyBanner === 'function' ? safetyBanner(c.safety || null) : '')
    + (T ? '<div class="tgx small">ℹ الحرق الأساسي ' + Math.round(T.bmr) + ' (' + esc(T.method) + (T.ffm ? '، كتلة خالية ' + T.ffm.toFixed(1) + ' كجم' : '') + ')؛ ' + esc(T.info || '') + '</div>' : '') + '</div>'
    + '<div class="ucard genrev"><h3>المستبعد (' + L.length + ')</h3>' + (L.length ? '<ul class="gxl">' + L.map(function (x) { return '<li class="gx gx-' + (x.k === 'kw' ? 'kw' : 'avoid') + '"><b>' + esc(x.n) + '</b> <span class="gxk">' + (x.k === 'kw' ? 'كلمة مستبعدة' : 'لا يحبه') + '</span>' + (x.k === 'avoid' ? ' <button class="link" data-a="genUnex" data-v="' + esc(x.n) + '">إرجاع</button>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="small">لا أصناف مستبعدة.</p>')
    + '<p class="small">الحساسية والكلمات المستبعدة تُعدَّل من «البيانات».</p><p class="genfoot">' + (g.rev ? '<span class="ok">✔ اعتمدتَ الفحص</span> ' : '') + '<button data-a="genRevOk">اعتمد الفحص والتالي ›</button></p></div>';
}
function genAthSetup(c, g) {
  return '<div class="ucard gensetup">' + genKindCards(c) + '<h3>إعداد نظام الجرامات</h3><div class="row">' + fld('bf', 'نسبة الدهون % (اختياري)', 'number', 'step="0.1"') + fld('sport', 'الرياضة') + sel('phase', 'المرحلة', AD.phases.map(function (p) { return p.n; })) + sel('bmrF', 'صيغة الحرق الأساسي (مع نسبة الدهون)', ['katch', 'cunningham', 'mifflin'], function (o) { return [o, o === 'katch' ? 'Katch-McArdle' : o === 'cunningham' ? 'Cunningham' : 'Mifflin-St Jeor']; }) + '</div>'
    + '<p class="small">جدول التدريب والماكروز التفصيلية في «البيانات». شكل الأسبوع يتبع جدول التدريب (أيام تدريب وراحة).</p><p class="genfoot"><button data-a="genStep" data-v="3">التالي: الفحص ›</button></p></div>';
}
function genAthPlan(c, g) {
  var ck = genAthPlanCk(c), po = planOf(c);
  return genQual(c) + genAthFrame(c) + '<div class="ucard genplan gen-' + (ck ? 'st-' + ck.st : 'none') + '" data-st="' + (ck ? ck.st : '') + '"><h3>خطة الجرامات</h3>' + (po.has ? '<p>الخطة الحالية: <b>' + esc(po.label) + '</b></p>' : '<p class="small">لا خطة بعد.</p>')
    + (ck ? '<ul class="small">' + c.plan.days.map(function (d, i) { var r = ck.days[i]; return '<li class="st-' + r.st + '">' + esc(d.name) + ' (' + esc(d.type || '') + '): ' + { ok: '✔', warn: '⚠', block: '⛔' }[r.st] + ' ' + E.ST_AR[r.st] + ' — ' + Math.round(d.got.k) + ' سعرة مقابل ' + Math.round(d.t.macroKcal || d.t.kcal) + (r.reasons.length ? ' • ' + esc(r.reasons[0]) : '') + '</li>'; }).join('') + '</ul>' : '')
    + '<p><button data-a="genBuild">' + (po.has ? '↻ أعد التوليد' : '⚙ ولّد الخطة') + '</button> ' + (po.has ? '<button class="sec" data-a="tab" data-v="plan">افتح الخطة للتعديل بالجرامات</button> ' : '') + '<button class="sec" data-a="genStep" data-v="5">التالي: الإرسال ›</button></p></div>';
}
function genAthSend(c, g) {
  var ck = genAthPlanCk(c), po = planOf(c), st = ck ? ck.st : 'ok';
  return '<div class="ucard gensend gen-st-' + st + '" data-st="' + st + '"><h3>' + { ok: '✔', warn: '⚠', block: '⛔' }[st] + ' ' + E.ST_AR[st] + '</h3>' + (ck ? '<ul>' + c.plan.days.map(function (d, i) { var r = ck.days[i]; return '<li class="st-' + r.st + '">' + esc(d.name) + ': ' + { ok: '✔', warn: '⚠', block: '⛔' }[r.st] + ' ' + E.ST_AR[r.st] + (r.reasons.length ? ' — ' + esc(r.reasons[0]) : '') + '</li>'; }).join('') + '</ul>' : '')
    + (!po.has ? '<p class="small">ولّد الخطة أولاً.</p>' : c.hx ? '<p><button data-a="hxSendPlan">' + IC('send') + ' أرسل الخطة إلى «زنها»</button></p>' : '<p><button class="sec" data-a="hxSendOrInvite">ادعُ العميل إلى «زنها» لإرسال الخطة</button></p>') + genOut(c) + '</div>';
}
// ---- 1.29 مسار بلا تكرار وواجهة حيوية: بطاقة العميل، بطاقتا النظام، حلقة الماكروز، مقاييس الملاءمة، أيقونات المجموعات، بطاقات الوجبات على الجوال، وانتقال ناعم بين الخطوات
var GEN_GI = ['🍞', '🫘', '🍗', '🐟', '🥚', '🥩', '🥛', '🥛', '🥛', '🥦', '🍎', '🫒', '🍯'], GEN_GC = ['st', 'le', 'm1', 'm2', 'm3', 'm4', 'd1', 'd2', 'd3', 've', 'fr', 'fa', 'su'];
function genGi(i) { return '<i class="ggi ggi-' + GEN_GC[i] + '" aria-hidden="true">' + GEN_GI[i] + '</i>'; }
function genNarrow() { return typeof window !== 'undefined' && window.innerWidth <= 760; }
function genRM() { try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function genVT(fn) { if (document.startViewTransition && !genRM()) { try { var vt = document.startViewTransition(fn), no = function () { }; ['ready', 'finished', 'updateCallbackDone'].forEach(function (k) { if (vt[k] && vt[k].catch) vt[k].catch(no); }); return; } catch (e) { } } fn(); }      // الحالة تتغير فوراً، والرسم وحده داخل الانتقال      // انتقال ناعم بين الخطوات حيث يدعمه المتصفح، ويُلغى مع «تقليل الحركة»
function genStp(k, idx, val) { return '<span class="gstp"><button type="button" class="sec gsb" data-a="genStp" data-v="' + k + '|' + idx + '|-1" aria-label="أنقص">−</button><input type="number" class="n" min="0" step="1" data-' + k + '="' + idx + '" value="' + val + '"><button type="button" class="sec gsb" data-a="genStp" data-v="' + k + '|' + idx + '|1" aria-label="زد">＋</button></span>'; }
// 1.34 «زيزو» بالبالطو الأبيض في «زنها Pro» (قرار المالك): في بطاقة العميل وبعد التوليد بحسب حالة الخطة
function genZz(o) { return window.Zizo && S.settings && S.settings.zzOn ? Zizo.svg(Object.assign({ coat: 1 }, o || {})) : ''; }
function genBmi(c) { var h = +c.height / 100, w = +c.weight; return h > 0 && w > 0 ? Math.round(w / h / h * 10) / 10 : 0; }
function genHero(c, mini) {
  var b = genBmi(c), tile = function (l, v, u) { return '<div class="ght"><small>' + l + '</small><b>' + (v ? esc(v) : '—') + '</b>' + (v && u ? '<i>' + u + '</i>' : '') + '</div>'; };
  return '<div class="genhero' + (mini ? ' mini' : '') + '"><span class="ghav">' + esc(initial(c.name || '؟')) + '</span><div class="ghn"><b>' + esc(c.name || 'عميل جديد') + '</b><small>' + esc(c.code) + ' • ' + (c.kind === 'athlete' ? 'نظام الجرامات' : 'نظام الحصص') + (c.sex ? ' • ' + esc(c.sex) : '') + '</small></div>'
    + '<div class="ghts">' + tile('العمر', c.age, 'سنة') + tile('الوزن', c.weight, 'كجم') + tile('الطول', c.height, 'سم') + tile('مؤشر الكتلة', b, '') + '</div>' + (genZz() ? '<span class="zzpro" aria-hidden="true">' + genZz(mini ? { mouth: 'smile' } : { wave: 1, mouth: 'smile' }) + '</span>' : '') + '</div>';
}
function genClient(c, g) {      // 1.37: بيانات العميل واحدة: ملخص مع «تعديل» للعميل المكتمل، والنموذج نفسه يحفظ في ملف العميل
  var ath = c.kind === 'athlete', edit = !genBodyOk(c) || g.miss || GENX.edit === c.code;
  if (!edit) return genHero(c) + '<div class="ucard genclient gcsum"><div class="gcchips">' + [c.activity && '🏃 ' + c.activity, c.goal && '🎯 ' + c.goal, (c.conditions || []).length && '🩺 ' + c.conditions.join('، '), (c.allergens || []).length && '⚠ ' + c.allergens.join('، '), c.hx ? '📲 مرتبط بـ«زنها»' : ''].filter(Boolean).map(function (x) { return '<span class="gchip">' + esc(x) + '</span>'; }).join('') + '</div>'
    + '<p class="small">البيانات من ملف العميل نفسه؛ أي تعديل هنا يُحفظ فيه.</p><p class="genfoot"><button class="sec" data-a="genEditData">✎ تعديل البيانات</button> <button data-a="genStep" data-v="2">التالي: النظام ‹</button></p></div>';
  return genHero(c) + '<div class="ucard genclient' + (g.miss ? ' miss' : '') + '"><h3>بيانات العميل</h3><p class="small">تُكتب مرة واحدة وتُحفظ في ملف العميل، وتستعملها كل الخطوات التالية.</p>' + genImportBtn(c)
    + '<div class="row">' + fld('name', 'الاسم') + fld('phone', 'الجوال') + sel('sex', 'الجنس', ['ذكر', 'أنثى']) + fld('age', 'العمر', 'number', 'placeholder="مثال: 30"') + fld('weight', 'الوزن (كجم)', 'number', 'step="0.1" placeholder="مثال: 80"') + fld('height', 'الطول (سم)', 'number', 'placeholder="مثال: 165"')
    + (ath ? '' : sel('activity', 'معامل النشاط', D.settings.activity.map(function (a) { return a[0]; })) + sel('goal', 'الهدف', D.settings.goals.map(function (a) { return a[0]; }))) + '</div>'
    + (ath ? '' : '<div class="row">' + condDd(c) + ddChecks('allergens', 'الحساسية والاستبعاد', D.allergens.map(function (a) { return a.label; }), c.allergens) + '</div>')
    + '<p class="genfoot"><button data-a="genStep" data-v="2">التالي: اختيار النظام ‹</button></p></div>';
}
function genKindCards(c) {
  var ath = c.kind === 'athlete', k = function (v, on, ic, t, d) { return '<button class="gkind' + (on ? ' on' : '') + '" data-a="genKind" data-v="' + v + '" aria-pressed="' + on + '"><span class="gki" aria-hidden="true">' + ic + '</span><b>' + t + '</b><small>' + d + '</small></button>'; };
  return '<h3>2. اختر النظام</h3><div class="gkinds">' + k('ex', !ath, '🥗', 'نظام الحصص', 'بالبدائل: الطاقة ← الماكروز ← الجدول التركيبي ← التوزيع ← قائمة الطعام') + k('ath', ath, '🏋️', 'نظام الجرامات', 'للرياضيين: جرامات دقيقة لأيام التدريب والراحة') + '</div>';
}
function genRing(cp, pp, fp, kcal) {
  return '<div class="gring"><div class="gring-d" style="--c:' + cp + ';--p:' + pp + ';--f:' + fp + '"><span><b class="cnt" data-to="' + Math.round(kcal) + '">' + Math.round(kcal) + '</b><small>سعرة</small></span></div>'
    + '<ul class="gring-l"><li class="cb"><i></i>كربوهيدرات <b>' + cp + '%</b></li><li class="pr"><i></i>بروتين <b>' + pp + '%</b></li><li class="ft"><i></i>دهون <b>' + fp + '%</b></li></ul></div>';
}
function genGauges(v, T) {
  return '<div class="ggs">' + [['السعرات', v.k, T.kcal, ''], ['كربوهيدرات', v.c, T.cho, ' جم'], ['بروتين', v.p, T.pro, ' جم'], ['دهون', v.f, T.fat, ' جم']].map(function (x) {
    var a = E.adequacy(x[1], x[2]); return '<div class="gg st-' + a.st + '"><small>' + x[0] + '</small><b><span class="cnt" data-to="' + Math.round(a.pct) + '">' + Math.round(a.pct) + '</span>%</b><span class="ggb"><i style="width:' + Math.min(100, a.pct / 1.2) + '%"></i></span><em>' + Math.round(x[1]) + ' من ' + Math.round(x[2]) + x[3] + '</em></div>';
  }).join('') + '</div>';
}
function genDistCards(c, cn, md, act) {
  return '<div class="eqdc">' + act.map(function (q) {
    var k = Math.round(E.countsVals(md[q.i], D).k), bk = (c.eqvBank || {})[q.i]; var row = function (gn, gi) { return '<div class="eqdr">' + genGi(gi) + '<span>' + esc(gn) + '</span>' + (bk ? '<b class="eqbkv">' + md[q.i][gi] + '</b>' : genStp('gd', q.i + ',' + gi, md[q.i][gi])) + '</div>'; }, on = '', off = '';
    D.groups.forEach(function (gn, gi) { if (!cn[gi] && !(md[q.i][gi] > 0)) return; if (md[q.i][gi] > 0) on += row(gn, gi); else if (!bk) off += row(gn, gi); });
    return '<div class="eqdm' + (bk ? ' hasbk' : '') + '" data-si="' + q.i + '">' + genBkHead(c, q) + '<h4>' + esc(q.name) + ' <small>' + k + ' سعرة</small></h4>' + on + (off ? '<details class="eqdmore"><summary>＋ مجموعات أخرى</summary>' + off + '</details>' : '') + (GENX.bk === q.i ? genBkPanel(c, q, md) : '') + (GENX.bkEd === q.i ? genBkEdit(c, q) : '') + '</div>';
  }).join('') + '<div class="eqdm eqdt"><h4>المجموع اليومي</h4>' + D.groups.map(function (gn, gi) { if (!cn[gi] && !act.some(function (q) { return md[q.i][gi] > 0; })) return ''; var t = act.reduce(function (a, q) { return a + md[q.i][gi]; }, 0); return '<div class="eqdr">' + genGi(gi) + '<span>' + esc(gn) + '</span>' + (t === cn[gi] ? '<span class="ad st-ok">✓ ' + cn[gi] + '</span>' : '<span class="ad st-block">' + t + ' من ' + cn[gi] + '</span>') + '</div>'; }).join('') + '</div></div>';
}
function genBento(c, ck, T, po) {
  var d0 = c.plan && c.plan.days && c.plan.days[0], n = d0 && d0.nominal, k = n ? n[0] * 4 + n[1] * 4 + n[2] * 9 : po.kcal || 0;
  var t = function (cls, l, v, s) { return '<div class="gbt ' + cls + '"><small>' + l + '</small><b>' + v + '</b>' + (s ? '<i>' + s + '</i>' : '') + '</div>'; };
  return '<div class="gbento">' + t('gbk', 'سعرات اليوم', '<span class="cnt" data-to="' + Math.round(k) + '">' + Math.round(k) + '</span>', T ? 'الهدف ' + Math.round(T.kcal) : '')
    + (n ? t('cb', 'كربوهيدرات', Math.round(n[0]) + ' جم', '') + t('pr', 'بروتين', Math.round(n[1]) + ' جم', '') + t('ft', 'دهون', Math.round(n[2]) + ' جم', '') : '')
    + (ck ? t('gbs st-' + ck.st, 'أيام مطابقة', ck.ok + ' / ' + (ck.ok + ck.warn + ck.block), { ok: '✔ مطابقة', warn: '⚠ تحتاج نظرك', block: '⛔ غير مطابقة' }[ck.st]) : '') + t('gbm', 'الوجبات', d0 && d0.slots ? d0.slots.length : (+c.meals || 5), esc(po.label || '')) + '</div>';
}
// عدّاد الأرقام (يصعد إلى قيمته) بعد كل رسم — يُلغى مع «تقليل الحركة»
(function () {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return; var seen = {};
  var run = function () { if (genRM()) return; document.querySelectorAll('.cnt[data-to]:not([data-run])').forEach(function (el) { el.setAttribute('data-run', '1'); var to = +el.getAttribute('data-to'), key = (el.closest('[class]') || {}).className + '|' + (el.parentNode && el.parentNode.className), from = seen[key] != null ? seen[key] : Math.round(to * 0.6); seen[key] = to; if (from === to || !isFinite(to)) return; var t0 = 0, dur = 650; var step = function (ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); };
  var start = function () { var m = document.querySelector('main'); if (!m) return; new MutationObserver(run).observe(m, { childList: true, subtree: true }); run(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  document.addEventListener('input', function (e) { var t = e.target; if (!t.classList || !t.classList.contains('gsl')) return; var k = t.dataset.gm, n = t.parentNode.querySelector('input.n[data-gm="' + k + '"]'); if (n) n.value = t.value; var r = document.querySelector('.gring-d'); if (r) r.style.setProperty({ choPct: '--c', proPct: '--p', fatPct: '--f' }[k], t.value); });
})();
// ---- 1.31 وجبات البنك في خطوة التوزيع فقط (قرار المالك): زر فوق اسم الوجبة ← اختيار وجبة البنك وأيامها ← حصص الوجبة تمتلئ بمجموعاتها تلقائياً، ويكمل الأخصائي توزيع باقي اليوم
// c.eqvBank[si] = { n, ings:[{n,g,e}], prof:[13] } لليوم النشط، وc.eqvDays[k].bank لكل يوم. لا تدخل وجبات البنك الخطة من أي مكان آخر
function genBkHead(c, q) {
  var bk = (c.eqvBank || {})[q.i];
  return bk ? '<span class="eqbk on">🍲 <b>' + esc(bk.n) + '</b>' + (bk.edited ? ' <small>(معدّلة)</small>' : '') + ' <span class="eqbka"><button class="link" data-a="genBkEd" data-v="' + q.i + '">✎ المكونات</button><button class="link" data-a="genBk" data-v="' + q.i + '">⇄ استبدال</button><button class="link" data-a="genBkDel" data-v="' + q.i + '" aria-label="أزل وجبة البنك">✕ إزالة</button></span></span>' : '<button class="sec sm eqbk" data-a="genBk" data-v="' + q.i + '">🍲 ＋ وجبة من البنك</button>';
}
// 1.33: باقي اليوم يُوزَّع تلقائياً حول وجبات البنك، وتعديل مكونات وجبة البنك للعميل وحده (لا يمس مكتبة البنك)
function genBkObj(n, ings) { var prof = new Array(13).fill(0); ings.forEach(function (x) { prof[x.g] += x.e; }); return { n: n, ings: ings.map(function (x) { return { n: x.n, g: x.g, e: x.e }; }), prof: prof.map(function (x) { return Math.round(x * 2) / 2; }) }; }
function genBkOver(cn, bank) { var used = new Array(13).fill(0); Object.keys(bank || {}).forEach(function (si) { (bank[si].prof || []).forEach(function (v, g) { used[g] += v; }); }); return D.groups.map(function (gn, g) { return used[g] > (+cn[g] || 0) ? gn + ' (' + used[g] + ' من ' + (+cn[g] || 0) + ')' : ''; }).filter(Boolean); }
function genDistAround(c, cn0, bk) {
  var ks = Object.keys(bk || {}), cn = cn0.map(Number), meals = +c.meals || 5; ks.forEach(function (si) { bk[si].prof.forEach(function (v, gi) { cn[gi] = Math.max(0, cn[gi] - v); }); });
  var whole = cn.map(function (x) { return Math.floor(Math.round(x * 2) / 2 + 1e-9); }), half = cn.map(function (x, g) { return Math.round(x * 2) / 2 - whole[g]; });      // التوزيع بحصص صحيحة، ثم نصف الحصة المتبقي لأكبر وجبة من المجموعة
  var md = E.suggestDist(whole, meals, D), sl = E.slots(meals, D).filter(function (q) { return q.active && !bk[q.i]; }), best = function (gi) { return sl.slice().sort(function (a, b) { return (md[b.i][gi] || 0) - (md[a.i][gi] || 0) || b.pct - a.pct; })[0]; };      // وجبات البنك ثابتة؛ يُوزَّع الباقي على غيرها
  ks.forEach(function (si) { md[si].forEach(function (v, gi) { if (!(v > 0)) return; var t = best(gi); if (t) md[t.i][gi] += v; }); md[si] = bk[si].prof.slice(); });
  half.forEach(function (h, gi) { if (h > 0) { var t = best(gi); if (t) md[t.i][gi] += h; } });
  return md;
}
function genBkSet(c, si, ings) {
  var bk = (c.eqvBank || {})[si]; if (!ings.length) { A.genBkDel(si); return; } var obj = genBkObj(bk.n, ings), nb = Object.assign({}, c.eqvBank); obj.edited = true; nb[si] = obj; var ov = genBkOver(genCounts(c).cn, nb);
  if (ov.length) { toast('⛔ لا يمكن: وجبات البنك تأخذ أكثر من حصص اليوم في ' + ov.join('، ')); return; }
  c.eqvBank = nb; c.mealDist = genDistAround(c, genCounts(c).cn, nb); eqStore(c); save(); main(); }
function genBkEdit(c, q) {
  var bk = (c.eqvBank || {})[q.i]; if (!bk) return ''; var by = {}; D.foods.forEach(function (f) { by[f.n] = f; }); var cx = E.ctx(ec(c), D);
  return '<div class="eqbkp eqbke"><div class="eqbkh"><b>✎ مكونات «' + esc(bk.n) + '»</b><button class="link" data-a="genBkEd" data-v="' + q.i + '">تم</button></div>'
    + '<div class="rows">' + bk.ings.map(function (x, k) { var f = by[x.n]; return '<div class="eqdr">' + genGi(x.g) + '<span>' + esc(f ? E.lineText(f, x.e, c.alias) : x.n) + '<small> · ' + x.e + ' ' + esc(D.groups[x.g]) + '</small></span><span class="gstp"><button type="button" class="sec gsb" data-a="genBkIng" data-v="' + q.i + '|' + k + '|-0.5" aria-label="أنقص">−</button><b class="eqbkv">' + x.e + '</b><button type="button" class="sec gsb" data-a="genBkIng" data-v="' + q.i + '|' + k + '|0.5" aria-label="زد">＋</button><button type="button" class="link" data-a="genBkIng" data-v="' + q.i + '|' + k + '|0" aria-label="احذف الصنف">✕</button></span></div>'; }).join('') + '</div>'
    + '<div class="row"><div><label for="gen_bkadd">أضف صنفاً</label><input id="gen_bkadd" list="dl_bkf" placeholder="اكتب اسم الصنف"></div><div><label>&nbsp;</label><button class="sec" data-a="genBkAdd" data-v="' + q.i + '">＋ أضف</button></div></div><datalist id="dl_bkf">' + D.foods.filter(function (f) { return f.on && cx.ok(f) && !cx.avoid[f.n]; }).map(function (f) { return '<option value="' + esc(f.n) + '">'; }).join('') + '</datalist>'
    + '<p class="small">كل تعديل يغيّر حصص الوجبة ويُعاد توزيع باقي اليوم تلقائياً. التعديل لهذا العميل وهذا اليوم فقط، ولا يغيّر مكتبة «بنك الوجبات».</p></div>';
}
function genBkList(c, q, md) { var tp = E.slots(+c.meals || 5, D).filter(function (x) { return x.i === q.i; })[0]; return E.mealMatch(ec(c), md[q.i], tp ? tp.type : null, D, 60); }
function genBkPanel(c, q, md) {
  var L = genBkList(c, q, md), fav = {}, ds = c.eqvDays && c.eqvDays.length ? c.eqvDays : [{ n: 'اليوم 1' }], ed = Math.min(genOf(c).ed || 0, ds.length - 1), wk = c.eqvWeek || [];
  (c.favMeals || []).forEach(function (n) { fav[n] = 1; }); L.sort(function (a, b) { return (fav[b.n] ? 1 : 0) - (fav[a.n] ? 1 : 0); }); GENX.bkList = L;
  var wd = function (k) { return D.days.filter(function (_, d) { return (wk[d] != null && ds[wk[d]] ? wk[d] : d % ds.length) === k; }).join('، '); };
  return '<div class="eqbkp" role="dialog" aria-label="وجبة من البنك لـ' + esc(q.name) + '"><div class="eqbkh"><b>🍲 وجبة من البنك لـ«' + esc(q.name) + '»</b><button class="link" data-a="genBk" data-v="' + q.i + '">إغلاق</button></div>'
    + '<div class="eqbkd"><span class="small">أضفها في:</span>' + ds.map(function (x, k) { return '<label class="chk"><input type="checkbox" data-bkd="' + k + '"' + (k === ed ? ' checked' : '') + '> ' + esc(x.n || 'اليوم ' + (k + 1)) + (ds.length > 1 || wk.length ? ' <small>(' + esc(wd(k)) + ')</small>' : ' <small>(كل أيام الأسبوع)</small>') + '</label>'; }).join('') + '</div>'
    + '<input id="gen_bkq" class="eqbkq" placeholder="ابحث باسم الوجبة" aria-label="ابحث في وجبات البنك">'
    + (L.length ? '<ul class="eqbkl">' + L.map(function (m, k) { return '<li data-bkn="' + esc(m.n) + '"><button class="sec eqbki" data-a="genBkPick" data-v="' + k + '"><span><b>' + (fav[m.n] ? '⭐ ' : '') + esc(m.n) + '</b><small>' + m.ings.map(function (x) { return esc(x.n); }).join('، ') + '</small></span><span class="gxk lv-' + m.lvl + '">' + E.MATCH_AR[m.lvl] + '</span>' + genDv(m.dv) + '</button></li>'; }).join('') + '</ul>' : '<p class="small">لا وجبات في البنك تناسب هذه الوجبة والعميل (بلا المستبعد والحساسية).</p>')
    + '<p class="small">تمتلئ حصص الوجبة بمجموعات وجبة البنك، ويُوزَّع باقي اليوم على الوجبات الأخرى تلقائياً. ⭐ = اختارها العميل في استبيان «زنها».</p></div>';
}
function genTab(c) {
  var g = genOf(c), ath = c.kind === 'athlete', body = g.step <= 1 ? genClient(c, g) : g.step === 2 ? (ath ? genAthSetup : genSetup)(c, g) : g.step === 3 ? (ath ? genAthRev : genRev)(c, g) : g.step === 4 ? (ath ? genAthPlan : genPlanStep)(c, g) : (ath ? genAthSend : genSend)(c, g);
  var sent = c.hx && c.hx.planV ? '<div class="chkb st-ok gensent">📤 أُرسلت الخطة إلى «زنها» (v' + c.hx.planV + '). عدّلها في أي وقت ثم أرسلها إصداراً جديداً v' + (c.hx.planV + 1) + '؛ علامات «أكلت/بدّلت» عند العميل تبقى مع أصنافها. ' + (g.step < 4 ? '<button class="sm" data-a="genStep" data-v="4">عدّل الخطة المرسلة</button>' : '') + '</div>' : '';
  return '<div class="gentab">' + sent + genStepper(c, g) + body + '</div>';
}
function genReqList() {                                       // 1.27: طلبات «زنها» الجديدة تُستورد من هنا مباشرة وتفتح التوليد
  var r = (window.HX && HX.st && HX.st.reqs) ? Object.keys(HX.st.reqs).map(function (k) { return [k, HX.st.reqs[k]]; }).filter(function (x) { return x[1].intake && x[1].st === 'new'; }) : [];
  return r.length ? '<div class="ucard genreqs"><h3>📲 طلبات جديدة من «زنها» (' + r.length + ')</h3>' + r.map(function (x) { var it = x[1].intake; return '<div class="genreq"><b>' + esc(it.name || x[1].label || 'عميل') + '</b> <small>' + [it.sex, it.age && it.age + ' سنة', it.weight && it.weight + ' كجم'].filter(Boolean).map(esc).join(' • ') + '</small> <button class="sm" data-a="genReqImp" data-v="' + esc(x[0]) + '">استورد وابدأ التوليد</button></div>'; }).join('') + '</div>' : '';
}
function genPage() {
  return '<div class="clpage genpage"><div class="hxtop"><h2>توليد الخطة</h2><button data-a="genNewAsk" aria-expanded="' + !!GENX.ask + '">＋ عميل جديد</button></div>'
    + '<p class="small">اختر العميل أو أضف عميلاً: العميل ← النظام (حصص أو جرامات) ← الفحص ← البناء ← الإرسال.</p>' + genNewChoice()
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
  if (t.dataset.bkd != null) return;
  if ((t.dataset.f || t.dataset.bf) && t.closest && t.closest('.geneqv')) { setTimeout(main, 0); return; }
  if (t.dataset.f && t.closest && t.closest('.genclient')) { setTimeout(function () { var h = document.querySelector('.gentab > .genhero'), c2 = cur(); if (h && c2) h.outerHTML = genHero(c2); }, 0); return; }      // بطاقة العميل تتحدث مع الكتابة دون إعادة رسم النموذج      
  if (t.dataset.gfp != null) { var gq = genOf(c), pp = gq.fastPat === 2 ? 2 : 1, arr = genFastPct(gq).slice(); arr[+t.dataset.gfp] = Math.max(0, Math.min(100, +t.value || 0)) / 100; gq.fastPct = gq.fastPct || {}; gq.fastPct[pp] = arr; save(); main(); return; }
  if (t.dataset.gm) { c[t.dataset.gm] = Math.max(0, Math.min(100, Math.round(+t.value || 0))) / 100; c.macroMode = 'manual'; save(); main(); return; }
  if (t.dataset.gd) { var q7 = t.dataset.gd.split(',').map(Number), md7 = genDist(c); md7[q7[0]][q7[1]] = Math.max(0, Math.round((+t.value || 0) * 2) / 2); c.mealDist = md7; save(); main(); return; }
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
  genNew: function () { GENX.ask = false; A.new('ex'); var c = cur(); if (c) { c.gen = { step: 1, v: 2 }; } S.tab = 'gen'; render(); window.scrollTo(0, 0); },      // 1.29: عميل جديد يبدأ ببياناته داخل «توليد الخطة»، والنظام يُختار بعدها
  genGo: function () { var c = cur(); if (!c) return; if (!c.name || !c.sex) { toast('اكتب الاسم وحدّد الجنس أولاً'); return; } S.genBack = null; S.tab = 'gen'; save(); render(); window.scrollTo(0, 0); },
  genStep: function (v) { var c = cur(); if (!c) return; var g = genOf(c), to = Math.max(1, Math.min(5, +v)); if (to > 1 && g.step === 1 && !genBodyOk(c)) { genOf(c).miss = 1; main(); toast('أكمل بيانات العميل المطلوبة أولاً'); return; } g.step = to; g.miss = 0; if (to > 1) GENX.edit = null; save(); genVT(main); window.scrollTo(0, 0); },
  genStp: function (v) { var c = cur(); if (!c) return; var q = String(v).split('|'), d = +q[2]; if (q[0] === 'gc') { var cn = genCounts(c).cn.slice(), i = +q[1]; cn[i] = Math.max(0, cn[i] + d); c.baseCounts = cn; } else if (q[0] === 'gd') { var ij = q[1].split(',').map(Number), md = genDist(c); md[ij[0]][ij[1]] = Math.max(0, md[ij[0]][ij[1]] + d); c.mealDist = md; } save(); main(); },
  genBk: function (v) { var c = cur(); if (!c) return; GENX.bk = GENX.bk === +v ? null : +v; main(); setTimeout(function () { var el = document.querySelector('.eqbkp'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30); },
  genBkPick: function (v) { var c = cur(); if (!c || GENX.bk == null) return; var m = (GENX.bkList || [])[+v]; if (!m) return; var si = GENX.bk, g = genOf(c), ed = g.ed || 0, ks = [].slice.call(document.querySelectorAll('[data-bkd]:checked')).map(function (x) { return +x.dataset.bkd; }); if (!ks.length) ks = [ed];
    eqStore(c); var obj = genBkObj(m.n, m.ings), bad = [];
    ks.forEach(function (k) { var x = c.eqvDays[k]; if (!x) return; var bk = Object.assign({}, x.bank || {}); bk[si] = obj; var ov = genBkOver(x.cn || genCounts(c).cn, bk); if (ov.length) bad.push((x.n || 'اليوم ' + (k + 1)) + ': ' + ov.join('، ')); });
    if (bad.length) { toast('⛔ لم تُضف: وجبة البنك تأخذ أكثر من حصص اليوم في ' + bad.join(' • ')); return; }
    ks.forEach(function (k) { var x = c.eqvDays[k]; x.bank = Object.assign({}, x.bank || {}); x.bank[si] = JSON.parse(JSON.stringify(obj)); x.md = genDistAround(c, x.cn || genCounts(c).cn, x.bank); });
    eqLoad(c, Math.min(ed, c.eqvDays.length - 1)); GENX.bk = null; GENX.bkEd = null; save(); main(); toast('أُضيفت «' + m.n + '» ووُزّع باقي اليوم تلقائياً (' + ks.length + (ks.length > 1 ? ' أيام' : ' يوم') + ')'); },
  genBkDel: function (v) { var c = cur(); if (!c) return; var si = +v; c.eqvBank = Object.assign({}, c.eqvBank || {}); delete c.eqvBank[si]; GENX.bkEd = null; c.mealDist = genDistAround(c, genCounts(c).cn, c.eqvBank); eqStore(c); save(); main(); toast('أُزيلت وجبة البنك ووُزّعت حصص اليوم من جديد'); },
  genBkEd: function (v) { var c = cur(); if (!c) return; GENX.bkEd = GENX.bkEd === +v ? null : +v; GENX.bk = null; main(); },
  genBkIng: function (v) { var c = cur(); if (!c) return; var q = String(v).split('|'), si = +q[0], k = +q[1], d = +q[2], bk = (c.eqvBank || {})[si]; if (!bk || !bk.ings[k]) return; var ings = JSON.parse(JSON.stringify(bk.ings)); if (d === 0) ings.splice(k, 1); else ings[k].e = Math.max(0.5, Math.round((ings[k].e + d) * 2) / 2); genBkSet(c, si, ings); },
  genBkAdd: function (v) { var c = cur(); if (!c) return; var si = +v, bk = (c.eqvBank || {})[si], inp = $('#gen_bkadd'), n = inp && inp.value.trim(), f = n && D.foods.filter(function (x) { return x.n === n && x.on; })[0]; if (!bk) return; if (!f) { toast('اختر صنفاً من القائمة'); return; } if (!E.ctx(ec(c), D).ok(f)) { toast('هذا الصنف مستبعد لهذا العميل'); return; } var ings = JSON.parse(JSON.stringify(bk.ings)), ex = ings.filter(function (x) { return x.n === f.n; })[0]; if (ex) ex.e += 1; else ings.push({ n: f.n, g: f.g, e: 1 }); genBkSet(c, si, ings); },
  genKind: function (v) { var c = cur(); if (!c) return; var ath = v === 'ath'; if (ath === (c.kind === 'athlete')) return; if (c.plan) { toast('للعميل خطة محفوظة: لتغيير النظام أنشئ عميلاً جديداً أو احذف الخطة أولاً'); return; }
    if (ath) { var keep = { sex: c.sex || 'ذكر', age: c.age, weight: c.weight, height: c.height, bf: c.bf }; Object.assign(c, Ath.newAthlete(AD), keep, { activity: c.activity || D.settings.activity[2][0], goal: c.goal || D.settings.goals[2][0] }); } else { delete c.kind; if (!c.meals) c.meals = 5; }
    save(); main(); toast(ath ? 'نظام الجرامات (الرياضيين)' : 'نظام الحصص بالبدائل'); },
  genRevOk: function () { var c = cur(); if (!c) return; var g = genOf(c); g.rev = Date.now(); g.step = 4; save(); genVT(main); toast('اعتُمدت المراجعة'); },
  genUnex: function (v) { var c = cur(); if (!c) return; c.excludedFoods = (c.excludedFoods || []).filter(function (n) { return n !== v; }); c.avoid = (c.avoid || []).filter(function (n) { return n !== v; }); genOf(c).rev = null; save(); main(); toast('أُرجع «' + v + '»'); },
  genEx: function (v) { var c = cur(); if (!c || !v) return; c.excludedFoods = c.excludedFoods || []; if (c.excludedFoods.indexOf(v) < 0) c.excludedFoods.push(v); genOf(c).rev = null; save(); main(); toast('استُبعد «' + v + '»'); },
  genAdd: function () { var i = $('#gen_add'), v = i && i.value.trim(); if (!v) return; if (!D.foods.some(function (f) { return f.n === v; })) { toast('اختر صنفاً من القائمة'); return; } A.genEx(v); },
  genConv: function () { var c = cur(); if (!c || !c.plib || !c.plib.doc) return; c.plan = E.fromDoc(Object.assign({ id: c.plib.id }, c.plib.doc), ec(c), D, genTmap()); c.planSrc = ''; genWeek(c); save(); main(); toast('حُوّلت الخطة' + (c.plan.replaced.length ? '، واستُبدل ' + c.plan.replaced.length + ' صنفاً لا يناسب العميل' : '')); },
  genEs: function (v) { var c = cur(); if (!c) return; var g = genOf(c); if (+v === 2 && c.macroMode !== 'manual') { var T0 = E.targets(ec(c), D); c.macroMode = 'manual'; c.choPct = Math.round(T0.cho * 4 / T0.kcal * 100) / 100; c.proPct = Math.round(T0.pro * 4 / T0.kcal * 100) / 100; c.fatPct = Math.round((1 - c.choPct - c.proPct) * 100) / 100; } if (+v >= 4 && !c.baseCounts) c.baseCounts = genCounts(c).cn; if (+v >= 4 && !c.mealDist) c.mealDist = genDist(c); g.es = Math.max(1, Math.min(EQ_STEPS.length, +v)); save(); genVT(main); },
  genEd: function (v) { var c = cur(); if (!c) return; eqStore(c); eqLoad(c, Math.min(+v, c.eqvDays.length - 1)); save(); main(); },
  genEdAdd: function () { var c = cur(); if (!c) return; eqStore(c); var src = c.eqvDays[genOf(c).ed || 0]; c.eqvDays.push({ n: 'اليوم ' + (c.eqvDays.length + 1), cn: src.cn.slice(), md: src.md.map(function (r) { return r.slice(); }), picks: {}, bank: JSON.parse(JSON.stringify(src.bank || {})) }); delete c.eqvWeek; eqLoad(c, c.eqvDays.length - 1); save(); main(); toast('أُضيف يوم جديد (نسخة من اليوم الحالي بأصناف تلقائية): عدّل حصصه أو توزيعه أو أصنافه'); },
  genEdDel: function () { var c = cur(); if (!c || !c.eqvDays || c.eqvDays.length < 2) return; var k = genOf(c).ed || 0; c.eqvDays.splice(k, 1); delete c.eqvWeek; eqLoad(c, Math.max(0, k - 1)); save(); main(); toast('حُذف اليوم'); },
  genAutoMeal: function () { var c = cur(); if (!c) return; var g = genOf(c), md = genDist(c), sl = E.slots(+c.meals || 5, D).filter(function (q) { return q.active && md[q.i].some(function (v) { return v > 0; }); }), q = sl[Math.min(g.em || 0, sl.length - 1)]; if (!q) return; g.salt = (g.salt || 0) + 1; c.eqvPicks = Object.assign({}, c.eqvPicks || {}, E.eqvAutoMeal(ec(c), D, q.i, md[q.i], q.type, g.salt)); save(); main(); toast('وُلّدت ' + q.name + ' تلقائياً'); },
  genAutoAll: function () { var c = cur(); if (!c) return; var g = genOf(c), md = genDist(c), used = {}, p = {}; g.salt = (g.salt || 0) + 1; E.slots(+c.meals || 5, D).forEach(function (q) { if (q.active && md[q.i].some(function (v) { return v > 0; })) Object.assign(p, E.eqvAutoMeal(ec(c), D, q.i, md[q.i], q.type, g.salt, used)); }); c.eqvPicks = p; save(); main(); toast('وُلّدت وجبات اليوم كلها تلقائياً'); },
  genImp: function () { var c = cur(); if (!c || !c.hx || !c.hx.intake) return; var m = hxMap(c.hx.intake); ['sex', 'age', 'weight', 'height', 'activity', 'goal'].forEach(function (k) { if (m[k] != null && m[k] !== '') c[k] = m[k]; }); save(); main(); toast('استُوردت البيانات من استبيان «زنها»'); },
  genExp: function (v) { var c = cur(); if (!c || !planOf(c).has) return; S.tab = 'plan'; render(); setTimeout(function () { if (A[v]) A[v](); }, 50); },
  genReqImp: function (v) { if (typeof hxApprove !== 'function') return; hxApprove(v).then(function () { var c = S.clients.filter(function (q) { return q.hx && q.hx.cid === v; })[0]; if (c) { c.gen = { step: genBodyOk(c) ? 2 : 1, v: 2 }; save(); A.genPick(c.code); toast('استُورد طلب «زنها»: بياناته جاهزة، اختر النظام'); } }); },
  genEm: function (v) { var c = cur(); if (!c) return; genOf(c).em = +v; main(); },
  genEqSug: function () { var c = cur(); if (!c) return; delete c.baseCounts; c.baseCounts = genCounts(c).cn; delete c.mealDist; save(); main(); toast('اقترح النظام الحصص من الأهداف'); },
  genEqDist: function () { var c = cur(); if (!c) return; c.mealDist = genDistAround(c, genCounts(c).cn, c.eqvBank || {}); save(); main(); toast(Object.keys(c.eqvBank || {}).length ? 'وُزّع باقي اليوم حول وجبات البنك' : 'وُزّعت الحصص على الوجبات'); },
  genEqBuild: function () { var c = cur(); if (!c) return; if (!c.name || !c.sex) { toast('اكتب الاسم وحدّد الجنس أولاً'); return; } c.baseCounts = genCounts(c).cn; c.mealDist = genDist(c); eqStore(c); if (!E.mealDistOk(c, +c.meals || 5, D)) { genOf(c).es = 4; main(); toast('⛔ جدول التوزيع لا يطابق الجدول التركيبي: صحّح الخانات الحمراء أو «وزّع تلقائياً»'); return; } c.plan = E.eqvPlan(ec(c), D, { seed: (c.gen && c.gen.seed) || 0 }); c.planSrc = ''; genWeek(c); save(); main(); toast('وُلّدت خطة الأسبوع بالبدائل'); },
  genSubs: function (v) { GENX.subs = GENX.subs === v ? null : v; GENX.meals = null; main(); },
  genMeals: function (v) { GENX.meals = GENX.meals === +v ? null : +v; GENX.subs = null; main(); },
  genSubPick: function (v) { var c = cur(); if (!c || !c.plan) return; var q = v.split(',').map(Number), d = genOf(c).day || 0, s = c.plan.days[d].slots[q[0]], l = s.lines[q[1]], x = E.subs(l, s.type, c.plan, D, 12)[q[2]]; if (!x) return; E.applySub(c.plan, d, q[0], q[1], x, D); GENX.subs = null; save(); main(); toast('استُبدل: ' + x.text); },
  genMealPick: function (v) { var c = cur(); if (!c || !c.plan) return; var q = v.split(',').map(Number), d = genOf(c).day || 0, s = c.plan.days[d].slots[q[0]], m = E.mealMatch(ec(c), E.slotReq(s), s.type, D, 8)[q[1]]; if (!m) return; var r = E.placeMeal(c.plan, d, q[0], m, D); GENX.meals = null; save(); main(); toast('«' + m.n + '» (' + E.MATCH_AR[m.lvl] + ')' + (r.done ? '، وعُوّض ' + r.done + ' حصة في باقي اليوم' : '') + (r.left ? '؛ بقي ' + r.left + ' حصة بلا تعويض' : '')); },
  genReset: function () { var c = cur(); if (!c) return; delete c.baseCounts; save(); main(); toast('رجعت الحصص لاقتراح النظام'); },
  genMove: function () { var c = cur(); if (!c || !c.plan) return; var g = genOf(c), gi = +$('#gen_mg').value, f = +$('#gen_mf').value, t = +$('#gen_mt').value; if (f === t) { toast('اختر وجبتين مختلفتين'); return; } if (!E.moveEx(c.plan, g.day || 0, gi, f, t, D)) { toast('لا توجد حصة من هذه المجموعة في الوجبة المختارة'); return; } save(); main(); toast('نُقلت حصة'); },
  genBuild: function () { var c = cur(); if (!c) return; var g = genOf(c); if (g.path === 'ready' && c.kind !== 'athlete') { S.tab = 'pw'; render(); return; } A.gen(); if (c.plan && c.kind !== 'athlete') genWeek(c); S.tab = 'gen'; g.step = 4; save(); render(); }
});
document.addEventListener('input', function (e) { var t = e.target; if (t.id !== 'gen_bkq') return; var q = t.value.trim(); document.querySelectorAll('.eqbkl li').forEach(function (li) { li.hidden = !!q && (li.getAttribute('data-bkn') || '').indexOf(q) < 0; }); });      // 1.31: بحث في وجبات البنك

// ================= 1.37 المسار الموحد (قرار المالك): مدخل واحد وخمس خطوات، عميل جديد بالتعبئة اليدوية أو باستبيان «زنها»، لوحة جودة حية، المفضلات وجدول البدائل
function genFlowHead(c) {
  var g = genOf(c), cs = GEN_STEPS[Math.max(0, Math.min(4, g.step - 1))];
  return '<div class="genflowh"><button class="sec sm" data-a="genExit">› ملف العميل</button><div class="gfhn"><b>توليد الخطة</b><small>' + (g.step > 1 ? esc(c.name || 'عميل جديد') + ' • ' : '') + esc(c.code) + ' • ' + (c.kind === 'athlete' ? 'جرامات' : 'حصص') + ' • ' + cs[1] + '</small></div></div>' + (typeof hxHealthWarn === 'function' ? hxHealthWarn(c) : '');
}
function genNewChoice() {
  if (!GENX.ask) return '';
  var on = typeof hxOn === 'function' && hxOn(), made = window.HX && HX.made && HX.st && HX.st.inv && HX.st.inv[HX.made];
  return '<div class="ucard gennew"><h3>كيف تصل بيانات العميل الجديد؟</h3><div class="gkinds">'
    + '<button class="gkind" data-a="genNew" data-v="ex"><span class="gki" aria-hidden="true">✍️</span><b>أعبّئها بنفسي</b><small>تكتب البيانات الآن ثم تكمل الخطوات مباشرة.</small></button>'
    + '<button class="gkind" data-a="genSurvey"' + (on ? '' : ' aria-disabled="true"') + '><span class="gki" aria-hidden="true">📲</span><b>يعبّئها العميل باستبيان «زنها»</b><small>' + (on ? 'رابط على واتساب؛ حين يرسل الاستبيان يظهر طلبه هنا فتكمل من خطوة «النظام».' : 'يحتاج ربط «زنها Pro» بالمحطة من «الإعدادات» أولاً.') + '</small></button></div>'
    + (on && HX.form ? hxInvForm() : '') + (made ? hxInvCard(HX.made, HX.st.inv[HX.made]).replace('hxinv', 'hxinv made') + '<p class="small">✓ أُنشئ الرابط. حين يكمل العميل الاستبيان يظهر في «طلبات جديدة من زنها» أعلى هذه الصفحة.</p>' : '') + '</div>';
}
function genAvg(p) { var n = 0, a = [0, 0, 0, 0]; (p.days || []).forEach(function (d) { var x = d.nominal; if (!x) return; n++; a[0] += x[0] * 4 + x[1] * 4 + x[2] * 9; a[1] += x[0]; a[2] += x[1]; a[3] += x[2]; }); return n ? a.map(function (v) { return v / n; }) : null; }
function genStale(c) {      // الخطة أقدم من الجدول التركيبي أو التوزيع الحاليين
  var p = c.plan; if (!p || p.method !== 'eqv' || !p.eqv) return false; try { return JSON.stringify(p.eqv.counts) !== JSON.stringify(genCounts(c).cn) || JSON.stringify(p.eqv.dist) !== JSON.stringify(genDist(c)); } catch (e) { return false; }
}
function genQual(c) {      // لوحة ملخص جودة الخطة: كل رقم من الخطة الفعلية، وتُعاد مع كل رسم بعد أي تعديل
  var ath = c.kind === 'athlete', p = c.plan, po = planOf(c), has = po.has && p && p.days && p.days.length, g = genOf(c), tile = function (cls, l, v, sub) { return '<div class="gq ' + cls + '"><small>' + l + '</small><b>' + v + '</b>' + (sub ? '<i>' + sub + '</i>' : '') + '</div>'; };
  var A0 = null, T0 = null, fav = null, ck = null, alerts = 0, miss = 0, reasons = [];
  try {
    if (ath) { var ak = genAthPlanCk(c); if (ak && has) { var sm = [0, 0, 0, 0, 0, 0, 0, 0]; p.days.forEach(function (d) { var t = d.t || {}, o = d.got || {}; sm[0] += o.k || 0; sm[1] += o.c || 0; sm[2] += o.p || 0; sm[3] += o.f || 0; sm[4] += t.macroKcal || t.kcal || 0; sm[5] += t.c || 0; sm[6] += t.p || 0; sm[7] += t.f || 0; }); var n = p.days.length; A0 = [sm[0] / n, sm[1] / n, sm[2] / n, sm[3] / n]; T0 = [sm[4] / n, sm[5] / n, sm[6] / n, sm[7] / n]; alerts = ak.warn + ak.block; ak.days.forEach(function (d) { reasons = reasons.concat(d.reasons || []); }); } }
    else { var T = E.targets(ec(c), D); T0 = [T.kcal, T.cho, T.pro, T.fat]; if (has && p.targets) { A0 = genAvg(p); if (po.src === 'engine') { ck = E.checkPlan(p, D); alerts = ck.warn + ck.block; ck.days.forEach(function (d) { reasons = reasons.concat(d.reasons || []); }); } fav = E.favReport(p, ec(c), D); p.days.forEach(function (d) { (d.slots || []).forEach(function (s) { (s.lines || []).forEach(function (l) { if (l.missing) miss++; }); }); }); } }
  } catch (e) { }
  var pf = []; try { if (has && !ath) pf = E.prefScan(ec(c), [JSON.stringify(po.snap())], D); } catch (e) { }
  var stale = !ath && genStale(c), chk = [['بيانات العميل', genBodyOk(c)], ['الفحص', !!g.rev], ['الخطة مولّدة', !!has], ['بلا خانات ناقصة', has && !miss], ['مطابقة للأهداف', has && !alerts], ['محدّثة بعد آخر تعديل', has && !stale]];
  var done = chk.filter(function (x) { return x[1]; }).length, pct = Math.round(done / chk.length * 100);
  var mac = function (i, l, u) { if (!T0) return tile('', l, '—', ''); var v = A0 ? A0[i] : null, a = v != null ? E.adequacy(v, T0[i]) : null; return tile(a ? 'st-' + a.st : '', l, v != null ? Math.round(v) + u : '—', 'الهدف ' + Math.round(T0[i]) + u); };
  return '<div class="ucard genqual" aria-live="polite"><div class="gqh"><h3>ملخص جودة الخطة</h3><span class="gqpct" data-pct="' + pct + '"><b>' + pct + '%</b> اكتمال</span></div><div class="gqs">'
    + mac(0, 'السعرات (متوسط اليوم)', '') + mac(1, 'الكربوهيدرات', ' جم') + mac(2, 'البروتين', ' جم') + mac(3, 'الدهون', ' جم')
    + tile(fav && fav.src !== 'none' ? (fav.pct >= fav.want ? 'st-ok' : 'st-warn') : '', 'المفضلات', fav ? (fav.src === 'none' ? 'لا مفضلات' : fav.pct + '%') : ath ? 'لا ينطبق' : '—', fav && fav.src !== 'none' ? 'المطلوب ' + fav.want + '%' : '')
    + tile(fav && fav.repeated ? 'st-warn' : '', 'وجبات مكررة', fav ? fav.repeated : '—', fav ? 'حد التكرار ' + fav.rep + ' أسبوعياً' : '')
    + tile('', 'مكمّلة من البنك', fav ? fav.bank : '—', fav ? 'من ' + fav.total + ' وجبة' : '')
    + (function () { if (!c.diet || !has || !E.dietCheck) return ''; try { return E.dietCheck(c.diet, p, D, typeof AD !== 'undefined' ? AD : null).map(function (r) { return tile(r[2] === 'ok' ? 'st-ok' : 'st-warn', r[0], esc(r[1]), ''); }).join(''); } catch (e) { return ''; } })()
    + tile(alerts || pf.length ? 'st-warn' : has ? 'st-ok' : '', 'تنبيهات غذائية', has ? alerts + pf.length : '—', has ? (alerts ? alerts + ' أيام تحتاج نظرك' : '') + (pf.length ? (alerts ? ' • ' : '') + pf.length + ' تفضيل' : '') : '') + '</div>'
    + '<ul class="gqchk">' + chk.map(function (x) { return '<li class="' + (x[1] ? 'gqy' : 'gqn') + '">' + (x[1] ? '✓' : '○') + ' ' + x[0] + '</li>'; }).join('') + '</ul>'
    + (stale ? '<p class="warn small gqstale">⚠ عدّلت الجدول التركيبي أو التوزيع بعد آخر توليد: أعد «ولّد خطة الأسبوع» لتتطابق الخطة.</p>' : '')
    + (fav && fav.notes.length ? '<p class="small gqnote">' + fav.notes.map(esc).join('<br>') + '</p>' : '')
    + (reasons.length ? '<details class="fold"><summary>التنبيهات (' + reasons.length + ')</summary><ul class="small">' + reasons.slice(0, 12).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></details>' : '') + '</div>';
}
function genAthFrame(c) {      // إطار البناء الموحد لنظام الجرامات: عرض لما يحسبه المحرك الحالي كما هو (بلا تغيير منطقه)
  var T = genAthT(c), p = c.plan, has = planOf(c).has && p && p.days, ms = (c.athMeals || (window.AD && AD.meals) || []).filter(function (m) { return m.on; }), d0 = T && T.days && T.days[0];
  var sec = function (n, t, b) { return '<div class="gafs"><h4><i>' + n + '</i> ' + t + '</h4>' + b + '</div>'; };
  return '<div class="ucard genathf"><h3>البناء: نظام الجرامات</h3>'
    + sec(1, 'الطاقة', T ? '<p class="small">الحرق الأساسي ' + Math.round(T.bmr) + ' سعرة (' + esc(T.method) + ')؛ أيام الأسبوع: ' + T.days.map(function (d) { return esc(d.name) + ' ' + Math.round(d.kcal); }).join(' • ') + '</p>' : '<p class="small">أكمل بيانات العميل.</p>')
    + (typeof genDietBox === 'function' ? '<div class="gafs">' + genDietBox(c) + '</div>' : '')      // 1.43 المرحلة الثانية: نوع النظام بعد الطاقة
    + sec(2, 'الماكروز', d0 ? '<p class="small">' + T.days.map(function (d) { return esc(d.name) + ': ب ' + Math.round(d.p) + ' • ك ' + Math.round(d.c) + ' • د ' + Math.round(d.f) + ' جم'; }).join('<br>') + '</p>' : '')
    + sec(3, 'توزيع الوجبات', '<p class="small">' + (ms.length ? ms.length + ' وجبات: ' + ms.map(function (m) { return esc(m.n || m.name || ''); }).filter(Boolean).join('، ') : '—') + ' <button class="link" data-a="tab" data-v="client">تعديل من البيانات</button></p>')
    + sec(4, 'بناء الوجبات بالجرامات', '<p class="small">' + (has ? 'الخطة مولّدة؛ عدّل الكميات بالجرام من «افتح الخطة للتعديل».' : 'ولّد الخطة من الزر أدناه.') + '</p>')
    + sec(5, 'التحليل الغذائي', '<p class="small">في لوحة الجودة أعلاه وفي قائمة الأيام أدناه.</p>') + '</div>';
}
function genFavBox(c) {      // إعداد المفضلات لكل عميل (قرار المالك: 80% افتراضياً بين 50 و90، وحد التكرار مرتان أسبوعياً قابل للتعديل)
  var cfg = E.favCfg(c), fm = c.favMeals || [], TY = [['B', 0, 'الإفطار'], ['L', 1, 'الغداء'], ['D', 2, 'العشاء'], ['S', 3, 'السناك']], by = {}; (D.bank || []).forEach(function (b) { by[b.n] = b; });
  var list = TY.map(function (t) { var L = fm.filter(function (n) { return by[n] && by[n].m && by[n].m[t[1]]; }); return L.length ? '<li><b>' + t[2] + ':</b> ' + L.map(esc).join('، ') + '</li>' : ''; }).join('');
  return '<div class="genfav"><h4>⭐ مفضلات العميل في الخطة</h4>' + (list ? '<ul class="small">' + list + '</ul>' : '<p class="small">' + ((c.pantry && Object.keys(c.pantry).some(function (k) { return Object.keys(c.pantry[k] || {}).length; })) ? 'مفضلات العميل أصناف (من مسار التفصيل) وتُفضَّل تلقائياً في كل وجبة.' : 'لا وجبات مفضلة مسجّلة (تأتي من استبيان «زنها» أو من «البيانات»).') + '</p>')
    + '<div class="row"><div><label for="gen_fpct">نسبة الوجبات المفضلة أسبوعياً: <b>' + cfg.pct + '%</b></label><input id="gen_fpct" type="range" min="' + E.FAV.min + '" max="' + E.FAV.max + '" step="5" data-fv="favPct" value="' + cfg.pct + '"></div>'
    + '<div><label for="gen_frep">حد تكرار الوجبة أسبوعياً</label><input id="gen_frep" type="number" min="1" max="7" step="1" data-fv="favRep" value="' + cfg.rep + '"></div></div>'
    + '<p class="small">تُحسب الوجبة المفضلة فقط إذا ناسبت حصص الوجبة واجتازت الاستبعاد والحالة الصحية؛ وما لا تكفيه المفضلات يُكمَل من بنك الوجبات حتى النسبة.</p></div>';
}
function genAltStep(c) {      // جدول البدائل: كل بديل = حصة واحدة، والمفضلات أولاً (أصناف الوجبات المفضلة و«يحبها» العميل)
  var x = ec(c), P = { client: x }, cn = genCounts(c).cn, lab = { starch: 'نشويات', milk: 'ألبان', meat: 'لحوم', veg: 'خضار', fruit: 'فاكهة', fat: 'دهون' }, idx = { starch: [0, 1], milk: [6, 7, 8], meat: [2, 3, 4, 5], veg: [9], fruit: [10], fat: [11] };
  var rows = Object.keys(lab).filter(function (k) { return idx[k].some(function (g) { return +cn[g] > 0; }); }).map(function (k) {
    var L = E.alternatives({ g: E.ALT_REP[k], name: '', e: 1 }, 'L', P, D, 10);
    return '<div class="galt"><h4>' + lab[k] + '</h4><ul>' + L.map(function (a) { return '<li class="' + (a.fav ? 'fav' : '') + '">' + (a.fav ? '⭐ ' : '') + esc(a.text) + '</li>'; }).join('') + '</ul></div>';
  }).join('');
  return '<h3>6. جدول البدائل <small>كل بديل يساوي حصة واحدة</small></h3><p class="small">⭐ = من الوجبات المفضلة أو ما يحبه العميل، ويأتي أولاً. ويُستبعد ما لا يناسبه (الحساسية والحالة الصحية وما لا يحبه). الجدول نفسه يظهر في صفحات الخطة.</p><div class="galts">' + rows + '</div>';
}
function genOut(c) {      // التصدير في خطوة «الإرسال» وحدها (نُقل من شريط الخطة)
  if (!planOf(c).has) return '';
  return '<div class="genout"><h4>معاينة وتصدير</h4><p><button class="sec" data-a="tab" data-v="plan">👁 معاينة الصفحات</button> <button class="sec" data-a="genExp" data-v="print">📄 PDF</button> <button class="sec" data-a="genExp" data-v="docx">📝 Word</button> <button class="sec" data-a="genExp" data-v="html">🌐 صفحة HTML</button></p><p class="small">اسم العيادة والأخصائي من «الإعدادات ← الحصص والبدائل».</p></div>';
}
document.addEventListener('change', function (e) {
  var t = e.target, c = cur(); if (!c || !t.dataset || !t.dataset.fv) return;
  var k = t.dataset.fv, v = Math.round(+t.value || 0); if (k === 'favPct') c.favPct = Math.max(E.FAV.min, Math.min(E.FAV.max, v)); else c.favRep = Math.max(1, Math.min(7, v));
  save(); main(); toast(k === 'favPct' ? 'نسبة المفضلات ' + c.favPct + '% — أعد توليد الأسبوع لتطبيقها' : 'حد التكرار ' + c.favRep + ' مرات أسبوعياً — أعد توليد الأسبوع لتطبيقه');
});
Object.assign(A, {
  genNewAsk: function () { GENX.ask = !GENX.ask; if (window.HX) { HX.made = null; HX.form = false; } main(); },
  genSurvey: function () { if (!(typeof hxOn === 'function' && hxOn())) { toast('اربط «زنها Pro» بمحطة «زنها» من «الإعدادات» أولاً'); return; } HX.form = true; HX.pre = null; HX.made = null; main(); var i = $('#hxi_l'); if (i) i.focus(); },
  genEditData: function () { var c = cur(); if (!c) return; GENX.edit = GENX.edit === c.code ? null : c.code; main(); },
  genExit: function () { var c = cur(); if (!c) return; GENX.edit = null; A.tab(planOf(c).has ? 'plan' : 'client'); },
  genOpen: function (v) { var c = cur(); if (!c) return; var g = genOf(c), n = +v || 1; if (n > 1 && !genBodyOk(c)) n = 1; g.step = n; S.tab = 'gen'; save(); render(); window.scrollTo(0, 0); }
});
