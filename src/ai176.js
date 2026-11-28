// ================= 1.77 (ر2 = ذ0) واجهة «المساعد الذكي» — docs/ai_meal_assistant_plan.md (البنود 2، 12)
// بلا ذكاء اصطناعي بعد: الأخصائي يصف الوجبات (النوع، الاسم، الموعد، الوصف، طلب وصفة)، ويضيف «توزيع يوم مختلف» لأيام محددة (مثل صيام الاثنين والخميس)،
// ويختار طريقة الكميات وتعليمات عامة. يُحفظ في ملف العميل (c.ai176) ولا يغيّر الخطة ولا أي حساب.
// «✦ ولّد بالمساعد» يعرض الطلب المنظم الذي سيُرسل للمُحلِّل في ر3 (معاينة)، والتوليد الفعلي يأتي في المراحل التالية.
var AI176 = { open: 0, add: null, addV: 0, prev: 0 };
var AI176_Q = ['يتنوع يومياً', 'ثابتة كل يوم', 'بروتين عالٍ', 'بلا خبز', 'خفيفة وسريعة', 'تناسب العمل خارج البيت'];
function ai176Uid(p) { return p + Math.random().toString(36).slice(2, 8); }
function ai176Of(c) {      // النموذج الافتراضي من وجبات العميل الحالية
  if (c.ai176 && c.ai176.groups) return c.ai176;
  var times = (D.times || []), sl = E.slots(+c.meals || 5, D).filter(function (s) { return s.active; });
  var meals = sl.map(function (s) { return { id: ai176Uid('m'), kind: s.type === 'S' ? 'snack' : 'main', name: s.name, time: times[s.i] || '', desc: '', recipe: '' }; });
  c.ai176 = { v: 1, groups: [{ id: 'base', name: 'اليوم الأساسي', days: [0, 1, 2, 3, 4, 5, 6], meals: meals }], units: 'home', notes: '' };
  return c.ai176;
}
function ai176DaysOf(m, gi) { var used = {}; m.groups.forEach(function (g, i) { if (i && i !== gi) g.days.forEach(function (d) { used[d] = 1; }); }); return used; }
function ai176Meal(g, gi, ml, mi) {
  return '<div class="ai176m' + (ml.desc ? '' : ' empty') + '" data-g="' + gi + '" data-m="' + mi + '"><div class="ai176mh"><span class="ai176k ' + ml.kind + '">' + (ml.kind === 'snack' ? '🍎 خفيفة' : '🍽 أساسية') + '</span>'
    + '<input class="ai176n" data-ai176="name" value="' + esc(ml.name) + '" aria-label="اسم الوجبة"><input class="ai176t" type="time" data-ai176="time" value="' + esc(ml.time || '') + '" aria-label="موعد ' + esc(ml.name) + '">'
    + '<button class="r sm" data-a="ai176Del" data-v="' + gi + ',' + mi + '" aria-label="حذف ' + esc(ml.name) + '">✕</button></div>'
    + '<label class="sr" for="ai176d' + gi + '_' + mi + '">وصف ' + esc(ml.name) + '</label><textarea id="ai176d' + gi + '_' + mi + '" data-ai176="desc" rows="2" placeholder="اختياري: مثلاً «أريد أن تتنوع يومياً بين الجبن والبيض والزبادي والحليب واللبن مع الخبز»">' + esc(ml.desc || '') + '</textarea>'
    + '<div class="ai176q">' + AI176_Q.map(function (q) { return '<button class="chip sm" data-a="ai176Chip" data-v="' + gi + ',' + mi + ',' + esc(q) + '">+ ' + esc(q) + '</button>'; }).join('') + '</div>'
    + '<div class="ai176r"><label for="ai176r' + gi + '_' + mi + '">🧑‍🍳 وصفة لهذه الوجبة (اختياري)</label><input id="ai176r' + gi + '_' + mi + '" data-ai176="recipe" value="' + esc(ml.recipe || '') + '" placeholder="مثلاً: فول بالزيت الحار — تُولَّد وتُثبَّت 📌 قبل ملء الباقي"></div></div>';
}
function ai176AddForm(gi) {
  return '<div class="ai176add" role="group" aria-label="إضافة وجبة"><div class="row"><div><label for="ai176ak">النوع</label><select id="ai176ak"><option value="main">أساسية</option><option value="snack">خفيفة</option></select></div>'
    + '<div><label for="ai176an">الاسم</label><input id="ai176an" placeholder="مثلاً: قبل التمرين"></div><div><label for="ai176at">الموعد (اختياري)</label><input id="ai176at" type="time"></div></div>'
    + '<p class="two"><button data-a="ai176AddOk" data-v="' + gi + '">إضافة</button><button class="sec" data-a="ai176AddX">إلغاء</button></p></div>';
}
function ai176Group(m, g, gi) {
  var used = ai176DaysOf(m, gi), days = gi === 0 ? '<small class="dim">كل الأيام' + (m.groups.length > 1 ? ' عدا أيام التوزيع المختلف' : '') + '</small>'
    : '<div class="ai176days" role="group" aria-label="أيام ' + esc(g.name) + '">' + D.days.map(function (dn, d) { var on = g.days.indexOf(d) >= 0, dis = !on && used[d]; return '<label class="ai176day' + (on ? ' on' : '') + '"><input type="checkbox" data-ai176day="' + gi + ',' + d + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '><span>' + dn + '</span></label>'; }).join('') + '</div>';
  return '<section class="ai176g"><div class="ai176gh">' + (gi === 0 ? '<b>' + esc(g.name) + '</b>' : '<input class="ai176gn" data-ai176g="' + gi + '" value="' + esc(g.name) + '" aria-label="اسم التوزيع"><button class="r sm" data-a="ai176DelV" data-v="' + gi + '">حذف التوزيع</button>') + days + '</div>'
    + g.meals.map(function (ml, mi) { return ai176Meal(g, gi, ml, mi); }).join('')
    + (AI176.add === gi ? ai176AddForm(gi) : '<p><button class="sec sm" data-a="ai176Add" data-v="' + gi + '">＋ إضافة وجبة</button></p>') + '</section>';
}
function ai176Req(c) {      // الطلب المنظم الذي سيُرسل للمُحلِّل (مُجهّل: بلا اسم ولا جوال)
  var m = ai176Of(c), T = null; try { T = E.targets(ec(c), D); } catch (e) { }
  return { system: c.kind === 'athlete' ? 'grams' : 'exchanges', diet: c.diet ? c.diet.id : null, target: T ? { kcal: Math.round(T.kcal), cho: Math.round(T.cho), pro: Math.round(T.pro), fat: Math.round(T.fat) } : null,
    units: m.units, notes: m.notes || '', allergens: c.allergens || [], dislikes: (c.avoid || []).slice(0, 40), likes: (c.love || []).slice(0, 40),
    groups: m.groups.map(function (g, i) { return { name: g.name, days: i === 0 ? [0, 1, 2, 3, 4, 5, 6].filter(function (d) { return !m.groups.slice(1).some(function (x) { return x.days.indexOf(d) >= 0; }); }) : g.days.slice(), meals: g.meals.map(function (ml) { return { kind: ml.kind, name: ml.name, time: ml.time || null, desc: ml.desc || null, recipe: ml.recipe || null }; }) }; }) };
}
function ai176Panel(c) {
  var m = ai176Of(c), dn = function (a) { return a.map(function (d) { return D.days[d]; }).join('، '); };
  return '<section class="ucard ai176" aria-labelledby="ai176h"><div class="ai176top"><h3 id="ai176h">✦ المساعد الذكي <em>تجريبي</em></h3><button class="sec sm" data-a="ai176" aria-expanded="true">إغلاق</button></div>'
    + '<p class="small">صف الوجبات كما تريد، والمساعد يوزّع البدائل عليها حسب تعليماتك وتفضيلات العميل. والحساب يبقى للمحرك. يُحفظ هذا في ملف العميل ولا يغيّر الخطة الحالية.</p>'
    + m.groups.map(function (g, gi) { return ai176Group(m, g, gi); }).join('')
    + (AI176.addV ? '<div class="ai176add"><div class="row"><div><label for="ai176vn">اسم التوزيع</label><input id="ai176vn" placeholder="مثلاً: صيام"></div></div><p class="small">ستختار أيامه بعد الإضافة.</p><p class="two"><button data-a="ai176AddVOk">إضافة</button><button class="sec" data-a="ai176AddVX">إلغاء</button></p></div>'
      : '<p><button class="sec sm" data-a="ai176AddV">＋ توزيع يوم مختلف</button> <small class="dim">مثلاً الاثنين والخميس صيام</small></p>')
    + '<div class="ai176opt"><span class="lbl">طريقة الكميات</span><div class="genopts">' + [['home', 'مقاييس منزلية', 'ملعقة، كوب، رغيف، حبة'], ['g', 'جرام', 'وزن كل صنف'], ['mix', 'مختلط', 'جرامات للحوم والنشويات، ومقاييس للباقي']].map(function (u) { return '<label class="genopt' + (m.units === u[0] ? ' on' : '') + '"><input type="radio" name="ai176u" data-ai176u="' + u[0] + '"' + (m.units === u[0] ? ' checked' : '') + '><b>' + u[1] + '</b><small>' + u[2] + '</small></label>'; }).join('') + '</div></div>'
    + '<label for="ai176notes">تعليمات عامة (اختياري)</label><textarea id="ai176notes" data-ai176notes="1" rows="2" placeholder="مثلاً: عشاء خفيف، بلا مقليات">' + esc(m.notes || '') + '</textarea>'
    + '<p class="genfoot"><button data-a="ai176Gen">✦ ولّد بالمساعد</button></p>'
    + (AI176.prev ? '<div class="ai176prev" role="status"><p><b>هذا ما سيصل المساعد (بلا اسم ولا جوال):</b> التوزيعات: ' + m.groups.length + ' • الوجبات: ' + m.groups.reduce(function (a, g) { return a + g.meals.length; }, 0) + (m.groups.length > 1 ? ' • التوزيع المختلف: ' + m.groups.slice(1).map(function (g) { return esc(g.name) + ' (' + (dn(g.days) || 'لا أيام') + ')'; }).join('، ') : '') + '.</p><p class="small">التوليد بالذكاء الاصطناعي يُفعَّل في المرحلة التالية (ر3: المُحلِّل ثم ر4: المحرك الحسابي). الطلب جاهز ومحفوظ.</p><details><summary>الطلب المنظم (JSON)</summary><pre dir="ltr">' + esc(JSON.stringify(ai176Req(c), null, 1)) + '</pre></details></div>' : '')
    + '</section>';
}
if (typeof genPlanStep === 'function') genPlanStep = (function (f) { return function (c, g) {
  var h = f.apply(this, arguments); if (!c) return h;
  return (AI176.open ? ai176Panel(c) : '<div class="ai176bar"><button data-a="ai176">✦ المساعد الذكي <small>(اختياري)</small></button><small class="dim">صف الوجبات بكلامك، ويوزّع المساعد البدائل حسب تعليماتك وتفضيلات العميل.</small></div>') + h;
}; })(genPlanStep);
function ai176Save() { save(); }
A.ai176 = function () { AI176.open = !AI176.open; AI176.prev = 0; main(); };
A.ai176Add = function (v) { AI176.add = +v; main(); var n = $('#ai176an'); if (n) n.focus(); };
A.ai176AddX = function () { AI176.add = null; main(); };
A.ai176AddOk = function (v) { var c = cur(); if (!c) return; var m = ai176Of(c), g = m.groups[+v], nm = (($('#ai176an') || {}).value || '').trim(); if (!g) return; if (!nm) { toast('اكتب اسم الوجبة'); return; }
  g.meals.push({ id: ai176Uid('m'), kind: ($('#ai176ak') || {}).value === 'snack' ? 'snack' : 'main', name: nm.slice(0, 40), time: ($('#ai176at') || {}).value || '', desc: '', recipe: '' });
  g.meals.sort(function (a, b) { return (a.time || '99') < (b.time || '99') ? -1 : 1; }); AI176.add = null; ai176Save(); main(); toast('✓ أُضيفت «' + nm + '»'); };
A.ai176Del = function (v) { var c = cur(); if (!c) return; var a = v.split(',').map(Number), g = ai176Of(c).groups[a[0]]; if (!g || !g.meals[a[1]]) return; if (g.meals.length <= 1) { toast('يبقى في التوزيع وجبة واحدة على الأقل'); return; } g.meals.splice(a[1], 1); ai176Save(); main(); };
A.ai176Chip = function (v) { var c = cur(); if (!c) return; var p = v.split(','), g = ai176Of(c).groups[+p[0]], ml = g && g.meals[+p[1]], q = p.slice(2).join(','); if (!ml) return; ml.desc = (ml.desc ? ml.desc.replace(/[\s،.]+$/, '') + '، ' : '') + q; ai176Save(); main(); };
A.ai176AddV = function () { AI176.addV = 1; main(); var n = $('#ai176vn'); if (n) n.focus(); };
A.ai176AddVX = function () { AI176.addV = 0; main(); };
A.ai176AddVOk = function () { var c = cur(); if (!c) return; var m = ai176Of(c), nm = (($('#ai176vn') || {}).value || '').trim() || 'توزيع مختلف';
  var base = m.groups[0].meals.map(function (x) { return Object.assign({}, x, { id: ai176Uid('m'), desc: '', recipe: '' }); }); m.groups.push({ id: ai176Uid('g'), name: nm.slice(0, 30), days: [], meals: base }); AI176.addV = 0; ai176Save(); main(); toast('✓ أُضيف «' + nm + '» — اختر أيامه'); };
A.ai176DelV = function (v) { var c = cur(); if (!c) return; var m = ai176Of(c); if (+v < 1 || !m.groups[+v] || !confirm('حذف توزيع «' + m.groups[+v].name + '»؟')) return; m.groups.splice(+v, 1); ai176Save(); main(); };
A.ai176Gen = function () { var c = cur(); if (!c) return; ai176Of(c); AI176.prev = 1; main(); };
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || !t.dataset) return; var c = typeof cur === 'function' ? cur() : null; if (!c || !c.ai176) return; var m = c.ai176;
  if (t.dataset.ai176) { var box = t.closest('.ai176m'); if (!box) return; var ml = m.groups[+box.dataset.g] && m.groups[+box.dataset.g].meals[+box.dataset.m]; if (!ml) return; var k = t.dataset.ai176; ml[k] = String(t.value || '').slice(0, k === 'desc' ? 600 : 80).trim(); if (k === 'name' && !ml.name) ml.name = 'وجبة'; ai176Save(); return; }
  if (t.dataset.ai176day) { var p = t.dataset.ai176day.split(',').map(Number), g = m.groups[p[0]]; if (!g) return; var i = g.days.indexOf(p[1]); if (t.checked && i < 0) g.days.push(p[1]); if (!t.checked && i >= 0) g.days.splice(i, 1); g.days.sort(); ai176Save(); main(); return; }
  if (t.dataset.ai176g) { var gg = m.groups[+t.dataset.ai176g]; if (gg) { gg.name = String(t.value || '').trim().slice(0, 30) || 'توزيع مختلف'; ai176Save(); } return; }
  if (t.dataset.ai176u) { m.units = t.dataset.ai176u; ai176Save(); main(); return; }
  if (t.dataset.ai176notes) { m.notes = String(t.value || '').slice(0, 600); ai176Save(); }
});
// ================= 1.78 (ر3) المُحلِّل: «ولّد بالمساعد» يرسل وصف الوجبات (مُجهّلاً) إلى المحطة /v1/ai/food (mode: meal) ويعرض «فهمتُ منك»
// كل كلمة صنف تُطابَق مع قاعدة الأصناف بمحرك الوصفة (DPRecipe.match): ✓ عدد الأصناف المطابقة، أو ⚠ غير موجود في القاعدة. الأخصائي يحذف ما لا يريد، أو يعيد الفهم.
var AI176_TAG = { high_protein: 'بروتين عالٍ', no_bread: 'بلا خبز', light: 'خفيفة', quick: 'سريعة', portable: 'تُحمل للعمل', high_fiber: 'ألياف أعلى', low_carb: 'كارب أقل' };
function ai176Keyed(c) { var m = ai176Of(c), out = []; m.groups.forEach(function (g, gi) { g.meals.forEach(function (ml, mi) { out.push({ key: 'g' + gi + 'm' + mi, name: ml.name, kind: ml.kind, desc: ml.desc || '', gi: gi, mi: mi, gname: g.name }); }); }); return out; }
function ai176Match(w) { try { var R = window.DPRecipe, r = R && R.match ? R.match(D, w) : null; if (!r) return []; return (r.exact.length ? r.exact : r.close.length ? r.close : []).slice(0, 30); } catch (e) { return []; } }
function ai176Chip(w, kind, path) { var L = kind === 'food' ? ai176Match(w) : null, okm = !L || L.length;
  return '<span class="ai176c' + (okm ? '' : ' miss') + '" title="' + esc(L ? (L.length ? L.slice(0, 6).join('، ') + (L.length > 6 ? '…' : '') : 'غير موجود في قاعدة الأصناف') : '') + '">' + esc(w) + (L ? ' <small>' + (L.length ? '✓ ' + L.length : '⚠') + '</small>' : '') + '<button class="link" data-a="ai176Rm" data-v="' + esc(path) + '" aria-label="حذف ' + esc(w) + '">✕</button></span>'; }
function ai176Parsed(c) {
  var P = c.ai176 && c.ai176.parsed; if (!P || !P.res) return ''; var res = P.res, K = {}; ai176Keyed(c).forEach(function (k) { K[k.key] = k; });
  var rows = res.meals.filter(function (m) { return K[m.key]; }).map(function (m, i) { var k = K[m.key], idx = res.meals.indexOf(m), row = function (lab, arr, kind, f) { return arr && arr.length ? '<div class="ai176pr"><span class="lbl">' + lab + '</span>' + arr.map(function (w, j) { return ai176Chip(w, kind, idx + '.' + f + '.' + j); }).join('') + '</div>' : ''; };
    return '<article class="ai176pm"><div class="ai176pmh"><b>' + esc(k.name) + '</b>' + (k.gi ? ' <small class="dim">(' + esc(k.gname) + ')</small>' : '') + ' <span class="ai176pt ' + m.pattern + '">' + ({ rotate: 'تتناوب يومياً', fixed: 'ثابتة', free: 'حرة: من تفضيلات العميل' }[m.pattern] || '') + '</span></div>'
      + (m.understood ? '<p>' + esc(m.understood) + '</p>' : '') + row('تتناوب:', m.rotation, 'food', 'rotation') + row('كل يوم:', m.always, 'food', 'always') + row('بلا:', m.avoid, 'word', 'avoid')
      + (m.notTogether.length ? '<div class="ai176pr"><span class="lbl">لا يجتمعان:</span>' + m.notTogether.map(function (pr, j) { return '<span class="ai176c">' + esc(pr.join(' ✕ ')) + '<button class="link" data-a="ai176Rm" data-v="' + idx + '.notTogether.' + j + '" aria-label="حذف القاعدة">✕</button></span>'; }).join('') + '</div>' : '')
      + (m.tags.length ? '<div class="ai176pr"><span class="lbl">طابع:</span>' + m.tags.map(function (t, j) { return '<span class="ai176c tag">' + esc(AI176_TAG[t] || t) + '<button class="link" data-a="ai176Rm" data-v="' + idx + '.tags.' + j + '" aria-label="حذف">✕</button></span>'; }).join('') + '</div>' : '') + '</article>'; }).join('');
  var miss = res.meals.some(function (m) { return m.rotation.concat(m.always).some(function (w) { return !ai176Match(w).length; }); });
  return '<section class="ai176parsed" aria-labelledby="ai176ph"><h4 id="ai176ph">🧠 فهمتُ منك' + (P.prov ? ' <small class="dim">(' + esc(P.prov === 'gl' ? 'Gemini' : P.prov === 'zai' ? 'GLM' : P.prov === 'groq' ? 'Groq' : P.prov) + (P.cached ? '، من الذاكرة' : '') + ')</small>' : '') + '</h4>'
    + (res.understood && res.understood.length ? '<ul class="ai176gu">' + res.understood.map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul>' : '') + rows
    + (miss ? '<p class="warn small">⚠ كلمات غير موجودة في قاعدة الأصناف لن تُستعمل. احذفها أو عدّل الوصف.</p>' : '')
    + '<p class="genfoot"><button class="sec" data-a="ai176Gen">↻ أعد الفهم</button> <button data-a="ai176Ok"' + (P.ok ? ' disabled' : '') + '>' + (P.ok ? '✓ اعتمدتَ الفهم' : '✓ الفهم صحيح') + '</button></p>'
    + (P.ok ? '<p class="small dim">التوزيع الحسابي من هذا الفهم يأتي في المرحلة التالية (ر4: المحرك الحسابي).</p>' : '') + '</section>';
}
ai176Panel = (function (f) { return function (c) { var h = f.apply(this, arguments), p = ai176Parsed(c), i = h.lastIndexOf('</section>'); return p && i > 0 ? h.slice(0, i) + p + h.slice(i) : h; }; })(ai176Panel);
A.ai176Gen = function () {
  var c = cur(); if (!c) return; ai176Of(c); var ks = ai176Keyed(c), notes = (c.ai176.notes || '').trim();
  if (!ks.some(function (k) { return k.desc.trim(); }) && !notes) { AI176.prev = 1; main(); toast('اكتب وصفاً لوجبة واحدة على الأقل، أو اترك التوزيع للمحرك من تفضيلات العميل'); return; }
  if (!(typeof HX !== 'undefined' && HX.st && HX.st.ident && typeof hxFetch === 'function')) { AI176.prev = 1; main(); toast('اربط «زنها» من الإعدادات ← زنها لاستعمال المساعد الذكي'); return; }
  var btn = document.querySelector('[data-a="ai176Gen"]'); if (btn) { btn.disabled = true; btn.textContent = '… المساعد يقرأ وصفك'; }
  hxFetch('POST', '/v1/ai/food', { mode: 'meal', meals: ks.map(function (k) { return { key: k.key, name: k.name, kind: k.kind, desc: k.desc }; }), notes: notes }, true)
    .then(function (j) { if (!j || !j.ok) throw new Error((j && (j.reason || j.msg || j.error)) || 'تعذّر الفهم الآن'); return j; })      // hxFetch يعيد الكائن، ويرمي خطأ المحطة برسالتها
    .then(function (j) { c.ai176.parsed = { at: Date.now(), prov: j.prov || '', cached: j.cached ? 1 : 0, ok: 0, res: { meals: j.meals || [], avoid: j.avoid || [], prefer: j.prefer || [], understood: j.understood || [] } }; AI176.prev = 0; save(); main(); })
    .catch(function (e) { toast('⚠ ' + (e.message || 'تعذّر الاتصال بالمساعد')); main(); });
};
A.ai176Ok = function () { var c = cur(); if (!c || !c.ai176 || !c.ai176.parsed) return; c.ai176.parsed.ok = 1; save(); main(); toast('✓ اعتمدتَ فهم المساعد'); };
A.ai176Rm = function (v) { var c = cur(); if (!c || !c.ai176 || !c.ai176.parsed) return; var a = String(v).split('.'), m = c.ai176.parsed.res.meals[+a[0]], arr = m && m[a[1]]; if (!arr) return; arr.splice(+a[2], 1); if (a[1] === 'rotation' && !m.rotation.length && m.pattern === 'rotate') m.pattern = 'free'; c.ai176.parsed.ok = 0; save(); main(); };
