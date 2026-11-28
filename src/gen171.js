// ================= 1.71 (م3) الخطوات الأربع — docs/flow_plan_167.md (③)؛ موافقة المالك 2026-11-28 على إعادة الترتيب والبنود السريرية الثلاثة كما عُرضت
// لا يتغير أي حساب ولا أرقام الخطط: الخطوات الداخلية الخمس كما هي (genOpen(5) وغيره)، ويُعرض المسار أربع خطوات:
//   ① الاحتياج (1) ← ② النظام والشكل (2 ثم الفحص 3) ← ③ الوجبات (4) ← ④ المراجعة والإرسال (5)
// - السعرات اليدوية وطريقة الماكروز تُعدَّل في ① فقط (في «البيانات» ملخص للقراءة وزر إليها).
// - اقتراح العجز/الزيادة من الوزن المستهدف (م1) — قاعدة سريرية معتمدة (ACC/AHA/TOS 2013، NHLBI؛ الزيادة ISSN): عرض واقتراح، والأخصائي يقرر.
// - تنبيهات تداخل الدواء مع الغذاء (نص الأدوية والمكملات) — تنبيه فقط بمراجعه.
// - عدّاد لحظي (المخطط مقابل الهدف) في ②–④، ومنع الإرسال إن وُجد في الخطة صنف من حساسية العميل، وقائمة المشتريات، وصلاحية الخطة وموعد المتابعة.
var G171 = { V: [[1, 'الاحتياج', [1]], [2, 'النظام والشكل', [2, 3]], [4, 'الوجبات', [4]], [5, 'المراجعة والإرسال', [5]]] };
function g171Names() { if (G171.n || typeof GEN_STEPS === 'undefined') return; G171.n = 1; GEN_STEPS[0][1] = 'الاحتياج'; GEN_STEPS[1][1] = 'النظام والشكل'; GEN_STEPS[2][1] = 'الاستبعاد والسلامة'; GEN_STEPS[3][1] = 'الوجبات'; GEN_STEPS[4][1] = 'المراجعة والإرسال'; }      // GEN_STEPS يُعرَّف بعد هذه الوحدة في البناء
function g171Vis(step) { for (var i = 0; i < G171.V.length; i++) if (G171.V[i][2].indexOf(step) >= 0) return i; return 0; }
genStepper = (function (f) { return function (c, g) {
  g171Names(); if (!c) return f.apply(this, arguments);      // 1.73 (م5): نظام الجرامات على الخطوات الأربع نفسها
  var vi = g171Vis(g.step), V = G171.V, sub = g.step === 3 ? ' — الاستبعاد والسلامة' : '';
  var mob = '<nav class="genstepm" aria-label="خطوات الخطة"><button class="sec" data-a="genStep" data-v="' + (vi > 0 ? V[vi - 1][0] : 1) + '"' + (vi <= 0 ? ' disabled' : '') + ' aria-label="الخطوة السابقة">›</button><span><b>' + (vi + 1) + ' من 4</b> • ' + V[vi][1] + sub + '</span><button class="sec" data-a="genStep" data-v="' + (vi < 3 ? V[vi + 1][0] : 5) + '"' + (vi >= 3 ? ' disabled' : '') + ' aria-label="الخطوة التالية">‹</button></nav>';
  return mob + '<ol class="gensteps g171" aria-label="خطوات الخطة">' + V.map(function (s, i) { var st = i < vi ? 'done' : i === vi ? 'on' : 'next';
    return '<li class="gs-' + st + '"><button class="sec sm" data-a="genStep" data-v="' + s[0] + '"' + (i === vi ? ' aria-current="step"' : '') + '><i>' + (st === 'done' ? '✓' : ['①', '②', '③', '④'][i]) + '</i> ' + s[1] + (i === vi && sub ? '<small>' + sub + '</small>' : '') + '</button></li>'; }).join('') + '</ol>';
}; })(genStepper);
// ---------- ① الاحتياج
function g171T(c) { try { return E.targets(ec(c), D); } catch (e) { return null; } }
function g171Rate(c, T) {      // اقتراح العجز/الزيادة من الوزن المستهدف (قاعدة 7700 سعرة/كجم تقريبية)
  var w = +c.weight, t = +c.targetW, by = c.targetBy ? Date.parse(c.targetBy) : 0; if (!(w > 0) || !(t > 0) || Math.abs(t - w) < 0.5) return '';
  var loss = t < w, days = by ? Math.round((by - Date.now()) / 864e5) : 0, kg = Math.abs(w - t);
  var head = '<p><b>الوزن المستهدف ' + num(t) + ' كجم</b> (' + (loss ? 'خسارة ' : 'زيادة ') + num(Math.round(kg * 10) / 10) + ' كجم' + (days > 0 ? ' خلال ' + Math.round(days / 7) + ' أسبوعاً' : '') + ')</p>';
  var need = days > 0 ? Math.round(kg * 7700 / days) : 0, wk = days > 0 ? kg / (days / 7) : 0, lim = loss ? Math.min(1, w * 0.01) : 0.5;
  var warn = days > 0 && wk > lim + 1e-9 ? '<div class="warn">⚠ المطلوب ' + num(Math.round(wk * 100) / 100) + ' كجم/أسبوع — ' + (loss ? 'أسرع من الحد الآمن (1 كجم أو 1% من الوزن أسبوعياً)' : 'أسرع من المقترح للزيادة (0.25–0.5 كجم/أسبوع)') + '. مدّد التاريخ أو عدّل الهدف.</div>' : '';
  var line = days > 0 ? '<p class="small">للوصول في الموعد: ' + (loss ? 'عجز ' : 'زيادة ') + '<b>' + need + '</b> سعرة/يوم تقريباً (' + num(Math.round(wk * 100) / 100) + ' كجم/أسبوع). التقدير بقاعدة 7700 سعرة/كجم ويبالغ على المدى الطويل.</p>' : '<p class="small">أضف «الوصول إليه بحلول» في «البيانات» ليُحسب المطلوب يومياً.</p>';
  var sug = loss ? '<p>المقترح: <b>عجز 500–750 سعرة/يوم</b> (≈0.5–0.75 كجم/أسبوع).</p><p class="two"><button class="sec sm" data-a="g171Goal" data-v="-500">طبّق −500 (هدف جاهز)</button>' + (T && T.tdee ? '<button class="sec sm" data-a="g171Man" data-v="750">طبّق −750 (سعرات يدوية ' + Math.round(T.tdee - 750) + ')</button>' : '') + '</p>'
    : '<p>المقترح: <b>زيادة 250–500 سعرة/يوم</b> (≈0.25–0.5 كجم/أسبوع).</p><p class="two"><button class="sec sm" data-a="g171Goal" data-v="250">طبّق +250</button><button class="sec sm" data-a="g171Goal" data-v="500">طبّق +500</button></p>';
  return '<div class="g171rate">' + head + line + warn + sug + '<p class="small dim">المرجع: ' + (loss ? 'إرشادات ACC/AHA/TOS 2013 للسمنة، وNHLBI' : 'توصيات ISSN لزيادة الوزن') + '. القرار للأخصائي.</p></div>';
}
var G171_DRUG = [      // [نمط الاسم، الدواء، التنبيه، المرجع] — تنبيه فقط
  [/وارفارين|warfarin|coumadin|ماريفان|marevan/i, 'وارفارين', 'حافظ على كمية ثابتة من فيتامين K (الخضار الورقية) يومياً، ولا تمنعها.', 'NIH ODS'],
  [/ليفوثيروكسين|levothyrox|eltroxin|التروكسين|ثيروكسين|euthyrox|يوثيروكس|synthroid/i, 'ليفوثيروكسين', 'على معدة فارغة، والفصل 4 ساعات عن الكالسيوم والحديد؛ القهوة والصويا تقلل امتصاصه.', 'ATA 2014'],
  [/phenelzine|tranylcypromine|isocarboxazid|selegiline|moclobemide|مثبط.{0,6}(MAO|أكسيداز)|فينيلزين|سيليجيلين/i, 'مثبطات MAO', 'تجنّب التيرامين: الأجبان المعتّقة واللحوم المصنّعة والمخللات.', 'نشرة FDA'],
  [/simvastatin|atorvastatin|lovastatin|سيمفاستاتين|أتورفاستاتين|اتورفاستاتين|لوفاستاتين|ليبيتور|lipitor|zocor/i, 'ستاتين (سيمفا/أتورفا/لوفا)', 'تجنّب الجريب فروت وعصيره.', 'FDA 2021'],
  [/pril\b|ليزينوبريل|كابتوبريل|إنالابريل|اينالابريل|راميبريل|lisinopril|captopril|enalapril|ramipril|spironolactone|سبيرونولاكتون|ألداكتون|aldactone/i, 'مثبطات ACE / سبيرونولاكتون', 'انتبه للبوتاسيوم وبدائل الملح (كلوريد البوتاسيوم).', 'نشرة FDA'],
  [/metformin|ميتفورمين|جلوكوفاج|glucophage|سيدوفاج|cidophage/i, 'ميتفورمين', 'نقص B12 وارد مع الاستعمال الطويل: افحصه دورياً.', 'ADA Standards 2025'],
  [/tetracycl|doxycycl|ciproflox|levoflox|تتراسيكلين|دوكسيسيكلين|سيبروفلوكساسين|ليفوفلوكساسين|سيبروباي|ciprobay/i, 'تتراسيكلين / فلوروكينولون', 'الفصل ساعتين عن الألبان والكالسيوم والحديد.', 'نشرة FDA'],
  [/insulin|إنسولين|انسولين|gliclazide|glimepiride|glibenclamide|جليكلازيد|جليميبريد|أماريل|amaryl|دياميكرون|diamicron/i, 'إنسولين / سلفونيل يوريا', 'خطر هبوط السكر مع العجز في السعرات: راجع توزيع الكارب والوجبات.', 'ADA']];
function g171MedsText(c) { var it = (c.hx && c.hx.intake) || {}, cq = it.cq || {}, ix = c.ix || {}; return [c.meds, it.meds, ix.x_supp, cq.x_supp, c.notes].filter(Boolean).join(' \n '); }
function g171Drugs(c) { var t = g171MedsText(c); if (!t) return []; return G171_DRUG.filter(function (r) { return r[0].test(t); }); }
function g171DrugHtml(c) { var L = g171Drugs(c); if (!L.length) return ''; return '<div class="g171drug" role="note"><h4>💊 تداخل الأدوية مع الغذاء</h4><ul>' + L.map(function (r) { return '<li><b>' + esc(r[1]) + ':</b> ' + esc(r[2]) + ' <small class="dim">(' + esc(r[3]) + ')</small></li>'; }).join('') + '</ul><p class="small dim">من نص الأدوية والمكملات في ملف العميل. تنبيه فقط، والقرار للأخصائي والطبيب المعالج.</p></div>'; }
function g171Need(c) {
  var T = g171T(c); if (!T || !(+c.weight > 0)) return '<div class="ucard g171need"><h3>الاحتياج</h3><p class="small">أكمل الوزن والطول والعمر والجنس ليُحسب الاحتياج.</p></div>';
  var mm = '<div class="row">' + sel('macroMode', 'طريقة الماكروز', ['auto_pf', 'auto_pc', 'manual'], function (o) { return [o, E.MODES[o]]; }) + fld('proGkg', 'بروتين g/kg', 'number', 'step="0.1"') + fld('proGkgOb', 'بروتين السمنة g/kg معدّل', 'number', 'step="0.1" placeholder="1.3"') + fld('fatPct', 'دهون %', 'number', 'step="0.01"') + fld('choPct', 'كربوهيدرات %', 'number', 'step="0.01"') + fld('proPct', 'بروتين % (يدوي)', 'number', 'step="0.01"')
    + sel('bmrF', 'صيغة الحرق الأساسي', E.BMRF.map(function (x) { return x[0]; }), function (o) { return [o, E.BMRF.filter(function (x) { return x[0] === o; })[0][1] + (o === 'mifflin' ? ' (الافتراضية)' : ' (تحتاج نسبة الدهون)')]; }) + fld('bf', 'نسبة الدهون % (اختياري)', 'number', 'step="0.1"') + '</div>';
  return '<div class="ucard g171need"><h3>① الاحتياج</h3><p class="small">هذا المكان الوحيد لتعديل السعرات والماكروز؛ ويُستعمل في كل الخطوات التالية.</p>'
    + '<div id="tg">' + targetsBox(c) + '</div>' + (T ? '<div class="tgx small">ℹ ' + esc(E.explain(T, c)) + '</div>' : '')
    + g171Rate(c, T) + g171DrugHtml(c)
    + '<div class="row">' + sel('goal', 'الهدف', D.settings.goals.map(function (a) { return a[0]; })) + fld('kcalManual', 'سعرات يدوية (اختياري)', 'number') + '</div>'
    + '<details class="fold g171mm"' + (S.mxOpen ? ' open' : '') + ' data-fold="mxOpen"><summary>⚙ طريقة الماكروز ونسبها — ' + esc(E.MODES[c.macroMode] || '') + '</summary>' + mm + '</details>'
    + '<p class="genfoot"><button data-a="genStep" data-v="2">التالي: النظام والشكل ‹</button></p></div>';
}
genClient = (function (f) { return function (c, g) { var h = f.apply(this, arguments); if (c && c.kind === 'athlete') return h + g171DrugHtml(c); if (!c || !genBodyOk(c) || h.indexOf('data-a="genEditData"') < 0) return h; try { return h.replace(/<p class="genfoot"><button class="sec" data-a="genEditData">([^<]*)<\/button> <button data-a="genStep" data-v="2">[^<]*<\/button><\/p>/, '<p class="genfoot"><button class="sec" data-a="genEditData">$1</button></p>') + g171Need(c); } catch (e) { return h; } }; })(genClient);
A.g171Goal = function (v) { var c = cur(); if (!c) return; var g = D.settings.goals.filter(function (x) { return x[1] === +v; })[0]; if (!g) return; c.goal = g[0]; c.kcalManual = ''; save(); main(); toast('✓ الهدف: ' + g[0]); };
A.g171Man = function (v) { var c = cur(), T = c && g171T(c); if (!T || !T.tdee) return; c.kcalManual = Math.round(T.tdee - +v); save(); main(); toast('✓ سعرات يدوية ' + c.kcalManual + ' (عجز ' + v + ')'); };
A.g171Need = function () { var c = cur(); if (!c) return; genOf(c).step = 1; S.tab = 'gen'; save(); render(); window.scrollTo(0, 0); };
// ---------- العدّاد اللحظي (②–④)
function g171Counter(c) {
  var p = c.plan; if (!p || !p.days || !p.days.length || !p.targets) return '';
  var T = p.targets, s = [0, 0, 0], n = 0; try { p.days.forEach(function (d) { if (!d.nominal) E.dayStats(d, T, D); var x = d.nominal || [0, 0, 0]; s[0] += x[0]; s[1] += x[1]; s[2] += x[2]; n++; }); } catch (e) { return ''; }
  if (!n) return ''; var c0 = s[0] / n, p0 = s[1] / n, f0 = s[2] / n, k0 = c0 * 4 + p0 * 4 + f0 * 9;
  var cell = function (lab, got, tgt, u) { var r = tgt > 0 ? got / tgt : 0, st = Math.abs(r - 1) <= 0.05 ? 'ok' : Math.abs(r - 1) <= 0.1 ? 'warn' : 'bad'; return '<div class="g171c st-' + st + '"><small>' + lab + '</small><b>' + Math.round(got) + '<span> / ' + Math.round(tgt) + ' ' + u + '</span></b><i style="--w:' + Math.min(100, Math.round(r * 100)) + '%"></i></div>'; };
  return '<div class="g171cnt" role="status" aria-label="المخطط مقابل الهدف (متوسط الأيام)">' + cell('السعرات', k0, T.kcal, '') + cell('كربوهيدرات', c0, T.cho, 'جم') + cell('بروتين', p0, T.pro, 'جم') + cell('دهون', f0, T.fat, 'جم') + '</div>';
}
function g171CounterAth(c) {      // 1.73: عدّاد الجرامات (متوسط الأيام: المخطط مقابل هدف كل يوم حسب نوعه)
  var p = c.plan; if (!p || !p.days || !p.days.length || typeof genAthCheck !== 'function') return ''; var sg = { k: 0, c: 0, p: 0, f: 0 }, st = { k: 0, c: 0, p: 0, f: 0 }, n = 0;
  try { p.days.forEach(function (d) { var r = genAthCheck(d), m = r && r.dims; if (!m) return; ['k', 'c', 'p', 'f'].forEach(function (k) { if (m[k]) { sg[k] += m[k].got; st[k] += m[k].tgt; } }); n++; }); } catch (e) { return ''; }
  if (!n || !(st.k > 0)) return ''; var cell = function (lab, k, u) { var got = sg[k] / n, tgt = st[k] / n, r = tgt > 0 ? got / tgt : 0, s0 = Math.abs(r - 1) <= 0.05 ? 'ok' : Math.abs(r - 1) <= 0.1 ? 'warn' : 'bad'; return '<div class="g171c st-' + s0 + '"><small>' + lab + '</small><b>' + Math.round(got) + '<span> / ' + Math.round(tgt) + ' ' + u + '</span></b><i style="--w:' + Math.min(100, Math.round(r * 100)) + '%"></i></div>'; };
  return '<div class="g171cnt" role="status" aria-label="المخطط مقابل الهدف (متوسط الأيام)">' + cell('السعرات', 'k', '') + cell('كربوهيدرات', 'c', 'جم') + cell('بروتين', 'p', 'جم') + cell('دهون', 'f', 'جم') + '</div>';
}
function g171WithCnt(f) { return function (c) { var h = f.apply(this, arguments); return c && c.kind !== 'athlete' ? g171Counter(c) + h : h; }; }
genSetup = g171WithCnt(genSetup); genRev = g171WithCnt(genRev); genPlanStep = g171WithCnt(genPlanStep);
function g171WithCntAth(f, drug) { return function (c) { var h = f.apply(this, arguments); return c && c.kind === 'athlete' ? g171CounterAth(c) + (drug ? g171DrugHtml(c) : '') + h : h; }; }
genAthSetup = g171WithCntAth(genAthSetup); genAthRev = g171WithCntAth(genAthRev); genAthPlan = g171WithCntAth(genAthPlan); genAthSend = g171WithCntAth(genAthSend, 1);
// ---------- ④ المراجعة والإرسال: الحساسية (مانع)، والأدوية، والصلاحية، والمشتريات
function g171Word(n, k) {      // بداية كلمة (مع «ال/و/بال/ب»): «بيض» تطابق «بيضة» و«البيض» لا «أرز أبيض»؛ والكلمة القصيرة (≤2) كاملة فقط («بط» لا تطابق «بطاطس»)
  var e = String(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), end = String(k).length <= 2 ? '($|[\\s،,()\\-/])' : '';
  return new RegExp('(^|[\\s،,()\\-/])(ال|و|وال|بال|ب)?' + e + end).test(String(n));
}
function g171Allergy(c) {      // أصناف في الخطة تطابق كلمات حساسية العميل
  var p = c.plan, al = c.allergens || []; if (!p || !p.days || !al.length) return [];
  var kws = []; al.forEach(function (lab) { var a = D.allergens.filter(function (x) { return x.label === lab; })[0]; if (a && a.kw) kws = kws.concat(a.kw.map(function (k) { return [k, lab]; })); });
  var hit = {}; p.days.forEach(function (d) { (d.slots || []).forEach(function (s) { (s.lines || []).forEach(function (ln) { if (!ln || ln.missing || !ln.name) return; kws.forEach(function (k) { if ((E.kwHit || g171Word)(ln.name, k[0])) hit[ln.name] = k[1]; }); }); }); });
  return Object.keys(hit).map(function (n) { return [n, hit[n]]; });
}
function g171Shop(c) {      // مجموع كل صنف في الأسبوع بالجرام والمقياس المنزلي
  var p = c.plan; if (!p || !p.days) return []; var by = {}, out = {}; D.foods.forEach(function (f) { by[f.n] = f; });
  p.days.forEach(function (d) { (d.slots || []).forEach(function (s) { (s.lines || []).forEach(function (ln) { if (!ln || ln.missing || !ln.name || !(ln.e > 0)) return; out[ln.name] = (out[ln.name] || 0) + ln.e; }); }); });
  return Object.keys(out).map(function (n) { var f = by[n] || {}, e = out[n], gm = f.gpe ? Math.round(e * f.gpe / 10) * 10 : 0, un = f.upe ? Math.round(e * f.upe * 2) / 2 : 0; return { n: n, g: f.g, gm: gm, un: un, u: un === 1 ? f.us : f.up || f.us || '' }; })
    .sort(function (a, b) { return (a.g - b.g) || (a.n < b.n ? -1 : 1); });
}
function g171ShopHtml(c, print) {
  var L = g171Shop(c); if (!L.length) return '';
  var rows = L.map(function (x) { return '<tr><td>' + esc(x.n) + '</td><td>' + (x.gm ? num(x.gm) + ' جم' : '—') + '</td><td>' + (x.un && x.u ? num(x.un) + ' ' + esc(x.u) : '—') + '</td></tr>'; }).join('');
  return (print ? '<section class="page g171shop"><h2>قائمة المشتريات للأسبوع</h2>' : '<details class="fold g171shop"><summary>🛒 قائمة المشتريات للأسبوع (' + L.length + ' صنفاً)</summary>')
    + '<div class="tw"><table class="st"><tr><th>الصنف</th><th>الكمية التقريبية</th><th>بالمقياس المنزلي</th></tr>' + rows + '</table></div><p class="small">مجموع الكميات في أيام الخطة تقريباً؛ الأوزان قبل الطهي حسب قاعدة الأصناف.</p>' + (print ? '</section>' : '</details>');
}
function g171Valid(c) { var v = c.planValid || {}, d0 = v.from || (typeof medToday === 'function' ? medToday() : ''), add = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  return '<div class="g171val"><h4>صلاحية الخطة والمتابعة</h4><div class="row"><div><label for="g171f">تبدأ</label><input type="date" id="g171f" data-g171v="from" value="' + esc(d0) + '"></div><div><label for="g171t">تنتهي</label><input type="date" id="g171t" data-g171v="to" value="' + esc(v.to || (d0 ? add(d0, 6) : '')) + '"></div><div><label for="g171n">موعد المتابعة المقترح</label><input type="date" id="g171n" data-g171v="next" value="' + esc(v.next || (d0 ? add(d0, 7) : '')) + '"></div></div></div>'; }
document.addEventListener('change', function (e) { var t = e.target; if (!t || !t.dataset || !t.dataset.g171v) return; var c = cur(); if (!c) return; c.planValid = c.planValid || {}; ['from', 'to', 'next'].forEach(function (k) { var i = document.querySelector('[data-g171v="' + k + '"]'); if (i) c.planValid[k] = i.value; }); save(); });
genSend = (function (f) { return function (c) {
  var h = f.apply(this, arguments); if (!c || c.kind === 'athlete') return h;
  var al = g171Allergy(c), blk = al.length ? '<div class="warn g171blk" role="alert">⛔ <b>مانع:</b> في الخطة ' + al.map(function (x) { return '«' + esc(x[0]) + '» (' + esc(x[1]) + ')'; }).join('، ') + '. استبدلها في «الوجبات» قبل الإرسال.</div>' : '';
  return g171Counter(c) + blk + g171DrugHtml(c) + h + '<div class="ucard g171rev">' + g171Valid(c) + g171ShopHtml(c) + '</div>';
}; })(genSend);
A.hxSendPlan = (function (f) { return function () { var c = cur(); if (c && c.kind !== 'athlete') { var al = g171Allergy(c); if (al.length) { toast('⛔ لا تُرسل: في الخطة صنف من حساسية العميل (' + al.map(function (x) { return x[0]; }).join('، ') + ')'); return; } } return f.apply(this, arguments); }; })(A.hxSendPlan);
allPages = (function (f) { return function (c, p, edit) { var h = f.apply(this, arguments); try { if (c && c.kind !== 'athlete' && !edit && p === c.plan && c.shop171 !== false) h += g171ShopHtml(c, 1); } catch (e) { } return h; }; })(allPages);
// ---------- «البيانات»: السعرات والماكروز للقراءة هنا، والتعديل في ① الاحتياج
(function () { if (window.MutationObserver) new MutationObserver(function () {
  var r = document.querySelector('main .cf151'), c = typeof cur === 'function' ? cur() : null; if (!r || !c || c.kind === 'athlete' || r.querySelector('.g171ro')) return;
  var k = r.querySelector('input[data-f="kcalManual"]'), mx = r.querySelector('details.fold[data-fold="mxOpen"]'); if (!k && !mx) return;
  var wrap = k ? k.closest('.row > div') || k.parentNode : null; if (wrap) wrap.style.display = 'none'; if (mx) mx.style.display = 'none';
  var b = document.createElement('p'); b.className = 'g171ro small'; b.innerHTML = 'السعرات اليدوية وطريقة الماكروز تُعدَّل في مكان واحد: <button class="sec sm" data-a="g171Need">① الاحتياج ‹</button>' + (+c.kcalManual > 0 ? ' <b>سعرات يدوية: ' + esc(c.kcalManual) + '</b>' : '');
  var tg = r.querySelector('#tg'); (tg || mx || wrap).parentNode.insertBefore(b, (tg || mx || wrap).nextSibling);
}).observe(document.documentElement, { childList: true, subtree: true }); })();
