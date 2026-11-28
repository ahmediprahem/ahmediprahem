// ================= 1.81 (ر5ب) تثبيت الوصفة 📌 في الخطة وعرضها للعميل في «زنها» — docs/ai_meal_assistant_plan.md البند 12 (الحجز المسبق)، طلب المالك 2026-11-28 («انشر وابدأ التالي»)
// «📌 ثبّت في الخطة»: في كل أيام التوزيع (الأساسي أو المختلف) تحل الوصفة محل أصناف تلك الوجبة، بمقدار يُضبط على نصيب الوجبة في ذلك اليوم،
// ثم يُوازن باقي اليوم (نشويات ودهون وبروتين بأنصاف حصص) ولا يُقبل يوم يخرج عن حدود الفحص (يبقى كما كان مع ذكر السبب). الخطة السابقة تُحفظ في الأرشيف أولاً.
// إعادة التوليد من «الخطوات الأربع» تعيد تثبيت الوصفات تلقائياً. وإن تغيّرت الخطة بطريق آخر يظهر «أعد التثبيت».
// «زنها»: بلا تغيير في التطبيق ولا في شكل الرسالة — اسم الوصفة يصل كاسم الوجبة، وخطواتها ووقتها وصورتها عبر recipes الموجود (rich_ui)؛
// والصورة تُرفع للمحطة كمحتوى عام (مثل صور وصفات البنك) عند «أرسل الخطة»، فلا تثقل الرسالة المشفّرة.
function rcpById(c, id) { var o = null; ai176Of(c).groups.forEach(function (g, gi) { g.meals.forEach(function (ml, mi) { if (ml.rcp && ml.rcp.id === id) o = { ml: ml, gi: gi, mi: mi }; }); }); return o; }
function rcpPinnedDays(c, id) { var n = []; (c.plan && c.plan.days || []).forEach(function (d, i) { if (d.slots.some(function (s) { return s.rcp181 && s.rcp181.id === id; })) n.push(i); }); return n; }
function rcpBalP(day, slot, dp, cl, units) {      // موازنة البروتين على لحوم الوجبات الأخرى (7 جم للحصة)
  var steps = Math.round(dp / 7 * 2) / 2; if (!steps) return;
  day.slots.forEach(function (s) { if (s === slot) return; s.lines.forEach(function (l) { if (!steps || l.missing || l.g < 2 || l.g > 5) return; var f = E.byName(D)[l.name]; if (!f) return; var ne = Math.max(0.5, l.e - steps), dd = l.e - ne; if (!dd) return; steps -= dd; l.e = ne; l.text = s179Txt(f, ne, cl, units); }); });
}
function rcpPinDay(c, day, slot, r, cl, units) {      // يعيد '' أو سبب التعذّر
  var K = rcpCalc(r), by = E.byName(D), T = c.plan.targets, cx = E.ctx(cl, D), sh = 0;
  slot.lines.forEach(function (l) { if (!l.missing) sh += l.e * D.EX[l.g][3]; });
  var k = rcpScale(K, Math.round(sh)), m = {}, lines = [];
  K.rows.forEach(function (x) { if (!x.include || x.status !== 'ok' || !x.food || !(x.eR > 0)) return; var f = by[x.food]; if (!f) return; if (cx.ok && !cx.ok(f)) { m.__bad = (m.__bad || []).concat(f.n); return; } m[f.n] = (m[f.n] || 0) + x.eR * k; });
  if (m.__bad) return 'فيها «' + m.__bad.join('، ') + '» وهو مستبعد لهذا العميل (حساسية أو عدم تحمّل)';
  Object.keys(m).forEach(function (n) { var f = by[n], e = Math.max(0.5, Math.round(m[n] * 2) / 2); lines.push({ g: f.g, name: f.n, e: e, text: s179Txt(f, e, cl, units), tier: cx.tierOf(f.n), bank: false, manual: true, w179: 1 }); });
  if (!lines.length) return 'لا مكونات محسوبة في الوصفة';
  var snap = day.slots.map(function (s) { return JSON.stringify(s); }), c0 = s179Chk(day, T, D), n0 = (E.dayStats(day, T, D).nominal || [0, 0, 0]).slice();
  slot.lines = lines; E.dayStats(day, T, D); var n1 = day.nominal, dlt = [n1[0] - n0[0], n1[1] - n0[1], n1[2] - n0[2]];
  for (var it = 0; it < 4; it++) {      // موازنة متكررة: بعد كل خطوة يُعاد حساب الفرق (النشويات فيها بروتين، واللحوم فيها دهون)
    var nc = E.dayStats(day, T, D).nominal, dd = [nc[0] - n0[0], nc[1] - n0[1], nc[2] - n0[2]]; if (Math.abs(dd[0]) < 7.5 && Math.abs(dd[1]) < 3.5 && Math.abs(dd[2]) < 2.5) break;
    s179Bal(day, slot, [dd[0], 0, 0], D, cl, units); nc = E.dayStats(day, T, D).nominal; rcpBalP(day, slot, nc[1] - n0[1], cl, units); nc = E.dayStats(day, T, D).nominal; s179Bal(day, slot, [0, 0, nc[2] - n0[2]], D, cl, units);
  }
  E.dayStats(day, T, D);
  slot.lines.forEach(function (l) { delete l.w179; });
  var c1 = s179Chk(day, T, D);
  if (!s179Ok(c0, c1)) { var nm = ['الكارب', 'البروتين', 'الدهون'].filter(function (x, i) { return c1.m[i] > Math.max(0, c0.m[i]) + 1e-9; }), why0 = 'تُخرج اليوم عن حدود الفحص' + (nm.length ? ' (' + nm.join(' و') + ')' : ' (السعرات)') + ': جرّب وجبة أخرى أو وصفة أقرب لأصنافها'; day.slots.forEach(function (s, i) { var o = JSON.parse(snap[i]); Object.keys(s).forEach(function (q) { delete s[q]; }); Object.assign(s, o); }); E.dayStats(day, T, D); return why0; }
  slot.mealLabel = r.title; slot.meal = ''; slot.edited = true; day.edited = true; slot.rcp181 = { id: r.id, t: r.title, k: k };
  return '';
}
function rcpPin(c, o) {      // كل أيام توزيع الوجبة؛ يعيد {ok: [أيام], bad: [[يوم، سبب]]}
  var m = ai176Of(c), r = o.ml.rcp, cl = ec(c), units = m.units || 'home', days = s179DaysOf(m, o.gi), g = m.groups[o.gi], out = { ok: [], bad: [] };
  if (!r.id) r.id = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  days.forEach(function (d) {
    var day = c.plan.days[d]; if (!day) return; var slot = s179Slot(day, o.ml, o.mi, g.meals.length);
    if (!slot) { out.bad.push([d, 'الوجبة ليست في خطة هذا اليوم']); return; }
    var why = rcpPinDay(c, day, slot, r, cl, units); if (why) out.bad.push([d, why]); else out.ok.push(d);
  });
  try { c.plan.quality = E.planQuality(c.plan, D); } catch (e) { }
  r.pinned = { at: Date.now(), n: out.ok.length }; return out;
}
function rcpDayN(d) { var DN = D.days || []; return DN[d] || ('اليوم ' + (d + 1)); }
A.rcpPin = function (v) {
  var c = cur(), o = c && rcpOf(c, v); if (!o || !o.ml.rcp) return; if (!c.plan || !c.plan.days) { toast('ولّد الخطة أولاً'); return; }
  (typeof arSave === 'function' ? arSave(c, 'rcp181') : Promise.resolve()).catch(function () { }).then(function () {
    var R = rcpPin(c, o); save(); main();
    toast(R.ok.length ? '📌 ثُبّتت «' + o.ml.rcp.title + '» في ' + R.ok.length + ' يوم' + (R.bad.length ? '، وتعذّر ' + R.bad.length + ' (السبب في البطاقة)' : '') + ' — الخطة السابقة في الأرشيف' : '⚠ لم تُثبَّت: ' + (R.bad[0] ? R.bad[0][1] : 'لا أيام'));
    o.ml.rcp.pinBad = R.bad.map(function (b) { return rcpDayN(b[0]) + ': ' + b[1]; }); save();
  });
};
A.rcpUnpin = function (v) {      // يعيد أصناف الوجبة من المحرك لأيام الوصفة (regenSlot بنفس الحصص) ويُبقي باقي اليوم كما هو
  var c = cur(), o = c && rcpOf(c, v); if (!o || !o.ml.rcp || !c.plan) return; var id = o.ml.rcp.id, n = 0;
  (typeof arSave === 'function' ? arSave(c, 'rcp181-off') : Promise.resolve()).catch(function () { }).then(function () {
    c.plan.days.forEach(function (d, di) { d.slots.forEach(function (s, k) { if (!s.rcp181 || s.rcp181.id !== id) return; delete s.rcp181; delete s.mealLabel; try { var tg = E.actualGroups(s); s.lines = []; E.regenSlotG(c.plan, di, k, tg, D); } catch (e) { } n++; }); });
    delete o.ml.rcp.pinned; delete o.ml.rcp.pinBad; save(); main(); toast('أُزيلت الوصفة من ' + n + ' يوم، وعادت أصناف المحرك بالحصص نفسها');
  });
};
// بطاقة الوصفة: زر التثبيت وحالته
rcpCard = (function (f) { return function (c, v, ml) {
  var h = f.apply(this, arguments); if (!h || !ml.rcp) return h; var r = ml.rcp, pd = r.id ? rcpPinnedDays(c, r.id) : [], st = '';
  if (pd.length) st = '<p class="rcppin on">📌 مثبّتة في الخطة: ' + pd.map(rcpDayN).join('، ') + '. تصل للعميل في «زنها» بصورتها وخطواتها مع «أرسل الخطة».</p>';
  else if (r.pinned) st = '<p class="rcppin warn">📌 كانت مثبّتة ثم تغيّرت الخطة. <button class="sm" data-a="rcpPin" data-v="' + v + '">أعد التثبيت</button></p>';
  if (r.pinBad && r.pinBad.length && pd.length) st += '<p class="small warn">تعذّر في: ' + r.pinBad.map(esc).join('، ') + '</p>';
  var btn = !c.plan ? '' : pd.length ? '<button class="sec sm" data-a="rcpUnpin" data-v="' + v + '">↩ أزل من الخطة</button>' : '<button class="sm" data-a="rcpPin" data-v="' + v + '">📌 ثبّت في الخطة</button>';
  return h.replace('<p class="genfoot rcpbtn">', st + '<p class="genfoot rcpbtn">' + btn);
}; })(rcpCard);
// إعادة التوليد من «الخطوات الأربع»: تُعاد الوصفات المثبّتة تلقائياً
if (typeof genWeek === 'function') genWeek = (function (f) { return function (c) {
  var r = f.apply(this, arguments);
  try { if (c && c.plan && c.plan.days && c.ai176 && c.kind !== 'athlete') { var n = 0; ai176Of(c).groups.forEach(function (g, gi) { g.meals.forEach(function (ml, mi) { if (ml.rcp && ml.rcp.pinned && !rcpPinnedDays(c, ml.rcp.id).length) { rcpPin(c, { g: g, ml: ml, gi: gi, mi: mi }); n++; } }); }); if (n) setTimeout(function () { toast('📌 أُعيد تثبيت ' + n + ' وصفة في الخطة الجديدة'); }, 50); } } catch (e) { }
  return r;
}; })(genWeek);
// ---------- إلى «زنها»: الوصفات المثبّتة ضمن recipes (الشكل الموجود)، والصورة مفتاح في المحطة
function rcpPinnedList(c) { var seen = {}, out = []; if (!c.plan || !c.plan.days || !c.ai176) return out; c.plan.days.forEach(function (d) { d.slots.forEach(function (s) { if (!s.rcp181 || seen[s.rcp181.id]) return; seen[s.rcp181.id] = 1; var o = rcpById(c, s.rcp181.id); if (o) out.push({ name: s.mealLabel || s.rcp181.t, r: o.ml.rcp }); }); }); return out; }
hxSnap = (function (f) { return function (c) {
  var s = f.apply(this, arguments); try { var L = rcpPinnedList(c); if (L.length) { s.recipes = s.recipes || {}; L.forEach(function (x) { s.recipes[x.name] = { steps: (x.r.steps || []).slice(0, 8), mins: x.r.minutes || 0, tip: 'وصفة صحية اختارها لك أخصائيك، بمقادير محسوبة على نصيب وجبتك.', img: x.r.key || '', yt: '' }; }); } } catch (e) { }
  return s;
}; })(hxSnap);
function rcpUpImgs(c) {
  var todo = rcpPinnedList(c).filter(function (x) { return x.r.img && !x.r.key; }); if (!todo.length || typeof fdUpload !== 'function') return Promise.resolve(0);
  return todo.reduce(function (p, x) { return p.then(function () { return fetch(x.r.img).then(function (r) { return r.blob(); }).then(function (bl) { return fdUpload({ blob: bl, type: bl.type || 'image/webp', w: 0, h: 0 }); }).then(function (m) { x.r.key = m.key; }); }); }, Promise.resolve()).then(function () { save(); return todo.length; });
}
if (A.hxSendPlan) A.hxSendPlan = (function (f) { return function () {
  var c = cur(), self = this, args = arguments; if (!c || !c.hx || !c.plan || !rcpPinnedList(c).some(function (x) { return x.r.img && !x.r.key; })) return f.apply(self, args);
  toast('جارٍ رفع صور الوصفات…'); return rcpUpImgs(c).catch(function (e) { toast('⚠ لم تُرفع صور الوصفات (' + e.message + ') — تُرسل الخطة بدونها'); }).then(function () { return f.apply(self, args); });
}; })(A.hxSendPlan);
if (typeof window !== 'undefined') window.RCP181 = { pin: rcpPin, pinned: rcpPinnedList, days: rcpPinnedDays, rewk: function (c) { return genWeek(c); } };
