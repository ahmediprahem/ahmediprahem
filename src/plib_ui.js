// ================= نافذة الأخصائي (1.03): تعرّف على العميل ← اختر النظام (30 مربعاً من مكتبة المالك، والمستبعد بالحالة الصحية معلَّم) ← النوع والسعرات ← تعديل الخطة (نقل الأصناف بين الوجبات، حذفها، والاسم الظاهر للعميل) ← إرسال
// يُدمج داخل app.js عند /*PLIBUI*/. البيانات في src/plib (PL في src/plib.js). الخطة المختارة تُحفظ في c.plib و c.planSrc = 'plib'.
var PWS = { blob: null, p: null, err: '', sel: {}, day: {}, cmp: {} };
if (window.PL && window.PLIB_IDX) PL.use(window.PLIB_IDX);
function pwLoad() {
  if (PWS.p) return PWS.p;
  PWS.p = new Promise(function (res) {
    try {
      var bin = atob(window.PLIB_GZ || ''), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text().then(function (t) { PL.plans = JSON.parse(t); res(PL.plans); if (S.tab === 'pw') main(); }).catch(function (e) { PWS.err = 'تعذّر فتح المكتبة: ' + e.message; res(null); main(); });
    } catch (e) { PWS.err = 'المتصفح لا يدعم فك الضغط؛ استعمل Chrome أو Edge أو Safari حديثاً.'; res(null); }
  });
  return PWS.p;
}
function pwKcal(c) { try { var T = E.targets(ec(c), D); return { T: T, k: +c.kcalManual > 0 ? +c.kcalManual : Math.round(T.kcal) }; } catch (e) { return { T: null, k: 1500 }; } }
function pwKnow(c) {                                                  // 1) تعرّف على العميل
  var safeH = typeof safetyBanner === 'function' ? safetyBanner(c.safety || (c.age > 0 && c.age < 18 ? { minor: true } : null)) : '';
  var K = pwKcal(c), T = K.T, it = (c.hx && c.hx.intake) || {}, pan = c.pantry || {}, M = [['B', 'الفطور'], ['L', 'الغداء'], ['D', 'العشاء'], ['S', 'السناك']];
  var likes = M.map(function (m) { var n = Object.keys(pan[m[0]] || {}).filter(function (x) { return pan[m[0]][x] === 'h'; }); return n.length ? '<li><b>' + m[1] + '</b><span>' + esc(n.slice(0, 8).map(function (x) { return (c.alias && c.alias[x]) || x; }).join('، ')) + (n.length > 8 ? ' و' + (n.length - 8) + ' غيرها' : '') + '</span></li>' : ''; }).join('');
  var bmi = c.weight && c.height ? (c.weight / Math.pow(c.height / 100, 2)).toFixed(1) : '—';
  var row = function (k, v) { return v ? '<li><b>' + k + '</b><span>' + v + '</span></li>' : ''; };
  return '<div class="ucard pwcard"><h3>١ تعرّف على العميل</h3>' + safeH + '<ul class="pwkv">'
    + row('الأساسيات', esc([c.sex, c.age ? c.age + ' سنة' : '', c.height ? c.height + ' سم' : '', c.weight ? c.weight + ' كجم' : ''].filter(Boolean).join(' • ')) + ' • مؤشر الكتلة ' + bmi)
    + row('الوزن المستهدف', +it.target ? it.target + ' كجم' : '')
    + row('النشاط والهدف', esc([c.activity, c.goal].filter(Boolean).join(' • ')))
    + row('الحالة الصحية', esc((c.conditions || []).join('، ') || 'لا شيء'))
    + row('الحساسية', esc((c.allergens || []).join('، ') || 'لا شيء'))
    + row('الوجبات', (c.meals || 5) + ' وجبات' + (c.freq ? ' • الغداء: دجاج ' + c.freq.poultry + '، لحم ' + c.freq.red + '، سمك ' + c.freq.fish : ''))
    + row('لا يحب', esc((c.avoid || []).slice(0, 10).join('، ')))
    + '</ul>' + (likes ? '<p class="small"><b>ما يحبه في كل وجبة</b></p><ul class="pwkv">' + likes + '</ul>' : '')
    + (T ? '<div class="pwkc"><div><small>الحرق الأساسي</small><b>' + Math.round(T.bmr) + '</b></div><div><small>الاحتياج اليومي</small><b>' + Math.round(T.tdee) + '</b></div><div><small>بعد العجز</small><b>' + Math.round(T.kcal) + '</b></div><div class="pwk"><small>سعرات الخطة</small><span class="pwstep"><button data-a="pwKc" data-v="-50" aria-label="أنقص 50 سعرة">−</button><b id="pwk">' + K.k + '</b><button data-a="pwKc" data-v="50" aria-label="زد 50 سعرة">+</button></span>' + (+c.kcalManual > 0 ? '<button class="link" data-a="pwKc" data-v="0">رجوع للمحسوب</button>' : '') + '</div></div>' : '')
    + (c.notes ? '<details class="pwnotes"><summary>ملاحظات العميل والاستبيان</summary><pre>' + esc(c.notes) + '</pre></details>' : '') + '</div>';
}
function pwTiles(c) {                                                 // 2) اختر النظام
  var cc = PL.cc(c), K = pwKcal(c), A0 = PL.assess(c, cc, K.k), sel = c.plib ? c.plib.lib : PWS.sel[c.code], eng = c.planSrc !== 'plib' && c.v2 && c.plan;
  var tile = function (x) {
    var on = sel === x.lib && !eng, R = x.R, lab = { ok: 'مناسب', caution: 'بحذر', excluded: 'مستبعد' }[x.st];
    return '<button class="pwt pw-' + x.st + (on ? ' on' : '') + '" data-a="pwPick" data-v="' + x.lib + '"' + (x.st === 'excluded' ? ' disabled aria-disabled="true"' : '') + ' title="' + esc(x.why.join(' • ')) + '"><span class="pwn">' + String(x.lib).padStart(2, '0') + '</span><b>' + esc(x.n) + '</b>'
      + '<small>' + R.lo + '–' + R.hi + ' سعرة • ك' + R.c + '٪ ب' + R.p + '٪ د' + R.f + '٪' + (x.m === 'g' ? ' • بالجرام' : '') + '</small><span class="pwst">' + (x.pref ? '★ ' : '') + lab + '</span>' + (x.why.length ? '<em>' + esc(x.why[0]) + (x.why.length > 1 ? ' (+' + (x.why.length - 1) + ')' : '') + '</em>' : '') + '</button>';
  };
  var nEx = A0.filter(function (x) { return x.st === 'excluded'; }).length;
  return '<div class="ucard pwcard"><h3>٢ اختر النظام <small class="dim">' + (cc === 'SA' ? 'مكتبة السعودية' : 'مكتبة مصر') + ' • ' + A0.length + ' نظاماً' + (nEx ? ' • ' + nEx + ' مستبعد لحالة العميل' : '') + '</small></h3>'
    + '<div class="pwtiles"><button class="pwt eng' + (eng ? ' on' : '') + '" data-a="pwEngine"><span class="pwn">✂</span><b>التفصيل على المقاس</b><small>المحرك الجديد من أكلات العميل • حرية كاملة في الحصص</small><span class="pwst">' + (eng ? 'المختار' : 'المحرك') + '</span></button>' + A0.map(tile).join('') + '</div>'
    + '<p class="small dim">قواعد الاستبعاد مسودة بانتظار مراجعة المالك. المرّ على المربع يعرض كل الأسباب.</p></div>';
}
function pwLevel(c) {                                                 // 3) النوع والسعرات
  var cc = PL.cc(c), lib = c.plib ? c.plib.lib : PWS.sel[c.code]; if (!lib) return '';
  var L = PL.lib(cc, lib), K = pwKcal(c), vs = PL.variants(cc, lib, c, K.k), R = c.plib && c.plib.lib === lib ? c.plib : null, cur = R ? R.variant : (vs.filter(function (v) { return v.ok; })[0] || vs[0]).id, n = R ? R : PL.nearest(cc, lib, cur, K.k);
  return '<div class="ucard pwcard"><h3>٣ ' + esc(L.n) + ': النوع والسعرات</h3><div class="row"><div><label for="pwv">النوع</label><select id="pwv" data-pwv="1">' + vs.map(function (v) { return '<option value="' + esc(v.id) + '"' + (v.id === cur ? ' selected' : '') + (v.ok ? '' : ' disabled') + '>' + esc(v.n) + ' (' + v.lo + '–' + v.hi + ')' + (v.ok ? '' : ' — للجنس الآخر') + '</option>'; }).join('') + '</select></div>'
    + '<div><label>المستوى</label><span class="pwstep"><button data-a="pwLv" data-v="-1" aria-label="مستوى أقل">−</button><b>' + (n ? n.kcal : '—') + ' سعرة</b><button data-a="pwLv" data-v="1" aria-label="مستوى أعلى">+</button></span></div></div>'
    + (n ? '<p class="small">بروتين ' + n.p + ' جم • كارب ' + n.c + ' جم • دهون ' + n.f + ' جم' + (n.meals ? ' • ' + n.meals + ' وجبات' : '') + (n.warn ? ' — <span class="warn">' + esc(n.warn) + '</span>' : '') + '</p>' : '')
    + (R ? '<p class="ok small">✓ مطبّق على العميل. التعديلات أدناه.</p>' : '<button data-a="pwApply">طبّق هذا النظام على العميل</button>') + '</div>';
}
function pwEdit(c) {                                                  // 4) تعديل الخطة: الأيام، نقل الأصناف بين الوجبات، الحذف، والاسم الظاهر
  var R = c.plib; if (!R || !R.doc) return '';
  var d = R.doc, di = Math.min(PWS.day[c.code] || 0, d.days.length - 1), y = d.days[di], nm = R.names || {}, G = PL.dayGroups(y);
  var grp = Object.keys(G).map(function (k) { return '<span>' + (PL.GK[k] ? PL.GK[k][0] : k) + ' ' + (+G[k].toFixed(1)) + '</span>'; }).join('');
  return '<div class="ucard pwcard"><h3>٤ عدّل الخطة <small class="dim">الاسم الظاهر يغيّر ما يراه العميل فقط</small></h3>'
    + '<div class="tabs pwdays">' + d.days.map(function (x, i) { return '<button class="' + (i === di ? 'on' : '') + '" data-a="pwDay" data-v="' + i + '">' + (D.days[i] || ('يوم ' + (i + 1))) + '</button>'; }).join('') + '</div>'
    + '<p class="small">' + esc(y.t) + ' • نحو ' + PL.dayKcal(y) + ' سعرة • الحصص: <span class="pwgrp">' + grp + '</span></p>'
    + y.m.map(function (m, mi) {
      return '<div class="pwmeal"><div class="pwmh"><b>' + esc(m.l) + '</b><small>' + PL.mealKcal(m) + ' سعرة' + (m.g ? ' • ' + Object.keys(m.g).map(function (k) { return (PL.GK[k] ? PL.GK[k][0] : k) + ' ' + m.g[k]; }).join('، ') : '') + '</small></div>'
        + m.it.map(function (t, ii) { return '<div class="pwit"><input aria-label="الاسم الظاهر للعميل" data-pwn="' + esc(t) + '" value="' + esc(PL.show(t, nm)) + '"' + (nm[t] ? ' class="ren"' : '') + '><select aria-label="انقل إلى وجبة" data-pwmv="' + mi + ':' + ii + '"><option value="">نقل…</option>' + y.m.map(function (z, zi) { return zi === mi ? '' : '<option value="' + zi + '">إلى ' + esc(z.l) + '</option>'; }).join('') + '</select><button class="sec sm" data-a="pwDel" data-v="' + mi + ':' + ii + '" aria-label="حذف الصنف">✕</button></div>'; }).join('') + '</div>';
    }).join('')
    + '<div class="row"><button class="sec" data-a="pwReset">استعادة الخطة كما في المكتبة</button>' + (c.hx ? '<button data-a="pwSend">اعتمد وأرسل إلى «زنها»</button>' : '<span class="small dim">اربط العميل بـ«زنها» لإرسال الخطة.</span>') + '</div></div>';
}
function pwEngine(c) {                                                // المحرك: الأسماء الظاهرة وتوزيع الحصص
  if (c.planSrc === 'plib' || !c.plan || !c.v2) return '';
  var names = {}; c.plan.days.forEach(function (d) { d.slots.forEach(function (s) { s.lines.forEach(function (l) { if (!l.missing) names[l.name] = 1; }); }); });
  return '<div class="ucard pwcard"><h3>٤ خطة التفصيل على المقاس</h3><p class="small">' + Math.round(c.plan.targets.kcal) + ' سعرة. توزيع الحصص على الوجبات والأيام من تبويب «الخطة» (عمود لكل مجموعة).</p><p><button class="sec" data-a="tab" data-v="plan">افتح توزيع الحصص في «الخطة»</button> <button class="sec" data-a="gen">أعد التوليد بالسعرات الحالية</button>' + (c.hx ? ' <button data-a="hxSendPlan">اعتمد وأرسل إلى «زنها»</button>' : '') + '</p>'
    + '<details><summary>الأسماء الظاهرة للعميل (' + Object.keys(names).length + ' صنفاً)</summary><div class="pwal">' + Object.keys(names).map(function (n) { return '<label><span>' + esc(n) + '</span><input data-pwal="' + esc(n) + '" value="' + esc((c.alias || {})[n] || '') + '" placeholder="كما هو"></label>'; }).join('') + '</div></details></div>';
}
function pwTab(c) {
  if (c.kind === 'athlete') return '<div class="ucard"><p>نافذة الأخصائي لنظام الحصص. لعملاء الجرامات استعمل تبويب «الخطة».</p></div>';
  if (!window.PL || !PL.idx) return '<div class="ucard warn">المكتبة غير محمّلة.</div>';
  if (!PL.plans) { pwLoad(); return pwKnow(c) + '<div class="ucard"><p>جارٍ فتح المكتبة…</p>' + (PWS.err ? '<p class="warn">' + esc(PWS.err) + '</p>' : '') + '</div>'; }
  return '<div class="pw">' + pwKnow(c) + pwTiles(c) + pwLevel(c) + pwEdit(c) + pwEngine(c) + '</div>';
}
function pwApplyN(c, n, lib) {
  var L = PL.lib(PL.cc(c), lib); c.plib = Object.assign({ lib: lib, name: L.n, cc: PL.cc(c), at: Date.now(), names: (c.plib && c.plib.names) || {} }, n, { doc: PL.doc(n.id) }); c.planSrc = 'plib';
}
function pwRe() { var y = window.scrollY; main(); window.scrollTo(0, y); }
Object.assign(A, {
  pwPick: function (v) { var c = cur(); if (!c) return; PWS.sel[c.code] = +v; if (c.plib && c.plib.lib !== +v) { /* اختيار آخر قبل التطبيق */ } pwRe(); setTimeout(function () { var x = document.querySelector('#pwv'); if (x) x.scrollIntoView({ block: 'center' }); }, 30); },
  pwEngine: function () { var c = cur(); if (!c) return; c.v2 = true; c.planSrc = 'engine'; delete c.plib; c.plan = E.planWeek(ec(c), D); save(); pwRe(); toast('✓ تولدت الخطة بالمحرك الجديد'); },
  pwKc: function (v) { var c = cur(); if (!c) return; if (+v === 0) c.kcalManual = ''; else c.kcalManual = pwKcal(c).k + (+v); if (c.plib) { var n = PL.nearest(c.plib.cc, c.plib.lib, c.plib.variant, pwKcal(c).k); if (n && n.id !== c.plib.id) pwApplyN(c, n, c.plib.lib); } save(); pwRe(); },
  pwLv: function (v) { var c = cur(); if (!c) return; var lib = c.plib ? c.plib.lib : PWS.sel[c.code]; if (!lib) return; var vr = (document.querySelector('#pwv') || {}).value, base = c.plib && c.plib.lib === lib ? c.plib : PL.nearest(PL.cc(c), lib, vr, pwKcal(c).k), n = base && PL.step(PL.cc(c), lib, base.variant, base.id, +v); if (!n) { toast('لا مستوى ' + (+v > 0 ? 'أعلى' : 'أقل') + ' في هذا النوع'); return; } pwApplyN(c, n, lib); save(); pwRe(); },
  pwApply: function () { var c = cur(); if (!c) return; var lib = PWS.sel[c.code]; if (!lib) return; var n = PL.nearest(PL.cc(c), lib, (document.querySelector('#pwv') || {}).value, pwKcal(c).k); if (!n) return; pwApplyN(c, n, lib); save(); pwRe(); toast('✓ طُبّق «' + c.plib.name + '» (' + n.kcal + ' سعرة) — عدّل ثم أرسل'); },
  pwDay: function (v) { var c = cur(); if (!c) return; PWS.day[c.code] = +v; pwRe(); },
  pwDel: function (v) { var c = cur(); if (!c || !c.plib) return; var p = String(v).split(':'), y = c.plib.doc.days[PWS.day[c.code] || 0]; y.m[+p[0]].it.splice(+p[1], 1); c.plib.edited = 1; save(); pwRe(); },
  pwReset: function () { var c = cur(); if (!c || !c.plib || !confirm('استعادة الخطة كما في المكتبة؟ تُلغى النقلات والحذف (وتبقى الأسماء الظاهرة).')) return; c.plib.doc = PL.doc(c.plib.id); c.plib.edited = 0; save(); pwRe(); },
  pwSend: function () { var c = cur(); if (!c || !c.plib) return; A.hxSendPlan(); }
});
document.addEventListener('change', function (e) {
  var t = e.target, c = typeof cur === 'function' ? cur() : null; if (!c || !t || !t.dataset) return;
  if (t.dataset.pwv) { if (c.plib) { var n = PL.nearest(c.plib.cc, c.plib.lib, t.value, pwKcal(c).k); if (n) { pwApplyN(c, n, c.plib.lib); save(); } } pwRe(); return; }
  if (t.dataset.pwn != null && c.plib) { var o = t.dataset.pwn, v = String(t.value || '').trim().slice(0, 120); c.plib.names = c.plib.names || {}; if (!v || v === o) delete c.plib.names[o]; else c.plib.names[o] = v; save(); t.classList.toggle('ren', !!c.plib.names[o]); return; }
  if (t.dataset.pwmv && c.plib && t.value !== '') { var p = t.dataset.pwmv.split(':'), y = c.plib.doc.days[PWS.day[c.code] || 0], it = y.m[+p[0]].it.splice(+p[1], 1)[0]; y.m[+t.value].it.push(it); c.plib.edited = 1; save(); pwRe(); return; }
  if (t.dataset.pwal != null) { var k = t.dataset.pwal, a = String(t.value || '').trim().slice(0, 80); c.alias = c.alias || {}; if (a) c.alias[k] = a; else delete c.alias[k]; if (c.plan && E.applyAlias) { c.plan.client.alias = c.alias; E.applyAlias(c.plan, D); } save(); return; }
});
function pwPlanView(c) {                                              // تبويب «الخطة» لعميل خطته من المكتبة الجديدة: الأسبوع كما سيصل العميل
  var R = c.plib; if (!PL.plans) pwLoad();
  return '<div class="ucard pwcard"><h3>📗 ' + esc(R.name) + ' — ' + esc(R.vname) + ' — ' + R.kcal + ' سعرة</h3><p class="small">من مكتبة الأنظمة' + (R.edited ? ' (معدّلة)' : '') + (R.sentV ? ' • أُرسلت v' + R.sentV : '') + '. التعديل من «نافذة الأخصائي».</p><p><button data-a="tab" data-v="pw">افتح نافذة الأخصائي</button> ' + (c.hx ? '<button class="sec" data-a="pwSend">اعتمد وأرسل إلى «زنها»</button> ' : '') + '<button class="sec" data-a="pwClear">أزل خطة المكتبة</button></p></div>'
    + R.doc.days.map(function (y, i) { return '<div class="ucard pwday"><h4>' + esc(D.days[i] || '') + ' • ' + esc(y.t) + '</h4>' + y.m.map(function (m) { return '<div class="pwmeal"><b>' + esc(m.l) + '</b><ul>' + m.it.map(function (t) { return '<li>' + esc(PL.show(t, R.names)) + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div>'; }).join('');
}
Object.assign(A, { pwClear: function () { var c = cur(); if (!c || !c.plib || !confirm('إزالة خطة المكتبة من العميل؟')) return; delete c.plib; c.planSrc = 'engine'; save(); main(); } });
