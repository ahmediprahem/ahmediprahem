// ================= مكتبة الأنظمة الجديدة (1.03): 30 نظاماً × مصر والسعودية × مستويات سعرات (src/plib من مكتبة المالك hessa-plans)
// مشترك بين «زنها Pro» والاختبارات (Node). البيانات: PLIB_IDX (الأنظمة والأنواع والمستويات) + PLIB_GZ (الأيام والوجبات، gzip/base64).
// الاستبعاد بالحالة الصحية مسودة (status: draft) بانتظار مراجعة المالك؛ لا يُخفي نظاماً، بل يعلّمه «مستبعد» أو «بحذر» مع السبب.
(function (root) {
  'use strict';
  var PL = { idx: null, plans: null };
  // ---------- الاستبعاد (مسودة للمراجعة): حالة ← {رقم النظام: [x مستبعد | c بحذر, السبب]}
  var X = 'x', C = 'c';
  PL.EXCL = {
    'سكري النوع الثاني': { 3: [C, 'صيام رمضان مع السكري يحتاج موافقة الطبيب وضبط الأدوية'], 30: [X, 'الصيام المتقطع مع أدوية السكر يرفع خطر الهبوط'], 7: [X, 'الكيتو مع أدوية السكري (خاصة SGLT2) يحتاج إشرافاً طبياً لصيقاً'], 4: [C, 'تغيّر الكارب بين الأيام يصعّب ضبط السكر؛ الأفضل كارب ثابت'], 5: [C, 'تغيّر الكارب بين الأيام يصعّب ضبط السكر؛ الأفضل كارب ثابت'], 8: [C, 'أيام المناسبات ترفع الكارب'], 9: [C, 'منتجات جاهزة قد تحوي سكراً مضافاً'] },
    'مقاومة الإنسولين / ما قبل السكري': { 9: [C, 'منتجات جاهزة قد تحوي سكراً مضافاً'], 8: [C, 'أيام المناسبات ترفع الكارب'] },
    'ضغط الدم المرتفع': { 9: [C, 'المنتجات الجاهزة عالية الصوديوم غالباً'], 8: [C, 'أكلات المناسبات مالحة غالباً'], 7: [C, 'الكيتو قد يرفع الدهون المشبعة والصوديوم'] },
    'ارتفاع الكوليسترول والدهون': { 7: [X, 'الكيتو عالي الدهون المشبعة غالباً'], 6: [C, 'اللو كارب يرفع الدهون؛ يُراقب نوعها'], 29: [C, 'فائق الكثافة غني بالدهون'] },
    'أمراض القلب': { 7: [X, 'الكيتو عالي الدهون المشبعة غالباً'], 6: [C, 'اللو كارب يرفع الدهون؛ يُراقب نوعها'], 3: [C, 'الصيام يحتاج موافقة الطبيب'], 30: [C, 'الصيام المتقطع يحتاج موافقة الطبيب'], 9: [C, 'المنتجات الجاهزة عالية الصوديوم غالباً'] },
    'أمراض الكلى': { 7: [X, 'الكيتو يرفع العبء على الكلى'], 6: [X, 'اللو كارب عالي البروتين'], 25: [X, 'بروتين عالٍ'], 26: [X, 'بروتين عالٍ'], 27: [X, 'بروتين عالٍ'], 3: [X, 'الصيام والجفاف خطر على الكلى'], 30: [C, 'الصيام المتقطع يحتاج موافقة الطبيب'], 29: [C, 'يُضبط البروتين والبوتاسيوم مع الطبيب'] },
    'النقرس': { 7: [X, 'الكيتو يرفع حمض اليوريك'], 6: [C, 'بروتين حيواني أعلى'], 25: [C, 'بروتين عالٍ'], 27: [C, 'بروتين عالٍ'], 3: [C, 'الصيام قد يرفع اليوريك'], 30: [C, 'الصيام قد يرفع اليوريك'] },
    'دهون الكبد (MASLD)': { 29: [X, 'فائق الكثافة يزيد الدهون والسعرات'], 24: [C, 'زيادة الوزن غير مناسبة غالباً لدهون الكبد'], 9: [C, 'منتجات جاهزة قد تحوي سكراً مضافاً'], 8: [C, 'أيام المناسبات ترفع السكر والدهون'] },
    'خمول الغدة': {}
  };
  PL.EXCL_STATUS = 'draft';
  PL.PREFER = { 'سكري النوع الثاني': [28, 1], 'مقاومة الإنسولين / ما قبل السكري': [28, 17], 'النقرس': [13], 'خمول الغدة': [16], 'دهون الكبد (MASLD)': [1, 28] };      // ترجيح (مسودة)
  PL.use = function (idx, plans) { PL.idx = idx; if (plans) PL.plans = plans; return PL; };
  PL.cc = function (c) { return c && c.cuisine === 'sa' ? 'SA' : c && c.cuisine === 'eg' ? 'EG' : 'EG'; };
  PL.libs = function (cc) { var L = PL.idx.libs, out = []; Object.keys(L).sort(function (a, b) { return a - b; }).forEach(function (k) { if (L[k].cc[cc]) out.push({ lib: +k, n: L[k].n, goal: L[k].goal, m: L[k].m, vars: L[k].cc[cc] }); }); return out; };
  PL.lib = function (cc, lib) { var l = PL.idx.libs[String(lib)]; return l && l.cc[cc] ? { lib: +lib, n: l.n, goal: l.goal, m: l.m, vars: l.cc[cc] } : null; };
  PL.range = function (L) { var lo = 1e9, hi = 0, P = 0, C2 = 0, F = 0, n = 0; L.vars.forEach(function (v) { v[2].forEach(function (x) { lo = Math.min(lo, x[1]); hi = Math.max(hi, x[1]); if (x[1]) { P += x[3] * 4 / x[1]; C2 += x[4] * 4 / x[1]; F += x[5] * 9 / x[1]; n++; } }); }); return { lo: lo, hi: hi, p: n ? Math.round(100 * P / n) : 0, c: n ? Math.round(100 * C2 / n) : 0, f: n ? Math.round(100 * F / n) : 0, nPlans: L.vars.reduce(function (a, v) { return a + v[2].length; }, 0) }; };
  // ---------- تقييم الأنظمة لعميل: ok | caution | excluded مع الأسباب، ومرتبة (المفضّل أولاً ثم المناسب للهدف)
  PL.assess = function (c, cc, kcal) {
    var age = +c.age || 30, conds = c.conditions || [], al = c.allergens || [], goalTxt = String(c.goal || ''), gain = /زيادة/.test(goalTxt), keep = /ثبات/.test(goalTxt), veg = al.indexOf('لا آكل اللحوم (نباتي)') >= 0, ath = c.kind === 'athlete';
    var pref = {}; conds.forEach(function (k) { (PL.PREFER[k] || []).forEach(function (n, i) { pref[n] = Math.max(pref[n] || 0, 30 - i * 5); }); });
    return PL.libs(cc).map(function (L) {
      var st = 'ok', why = [], set = function (s, w) { if (s === X) st = 'excluded'; else if (st !== 'excluded') st = 'caution'; why.push(w); };
      if (L.goal === 'kids' && age >= 12) set(X, 'للأطفال 6–12 سنة'); if (L.goal === 'teen' && (age < 12 || age >= 18)) set(X, 'للمراهقين 12–18 سنة');
      if (age < 18 && L.goal !== 'kids' && L.goal !== 'teen') set(X, 'للبالغين؛ العميل أقل من 18 سنة');
      conds.forEach(function (k) { var r = (PL.EXCL[k] || {})[L.lib]; if (r) set(r[0], k + ': ' + r[1]); });
      if (veg && L.lib !== 21) set(C, 'العميل نباتي؛ في النظام لحوم (يُستبدل يدوياً)');
      if (gain && L.goal === 'lose') set(C, 'نظام تنحيف وهدف العميل زيادة'); if (!gain && (L.goal === 'gain') && !keep) set(C, 'نظام زيادة وزن وهدف العميل ليس الزيادة');
      if (!ath && (L.goal === 'cut' || L.goal === 'bulk')) set(C, 'للرياضيين (نظام الجرامات)');
      var R = PL.range(L), fit = kcal ? (kcal >= R.lo - 100 && kcal <= R.hi + 100) : true; if (!fit) set(C, 'سعرات العميل (' + Math.round(kcal) + ') خارج مدى النظام ' + R.lo + '–' + R.hi);
      var score = (st === 'ok' ? 100 : st === 'caution' ? 40 : 0) + (pref[L.lib] || 0) + ((L.goal === 'lose') !== gain ? 10 : 0) - L.lib * 0.01;
      return { lib: L.lib, n: L.n, goal: L.goal, m: L.m, st: st, why: why, R: R, score: score, pref: !!pref[L.lib] };
    }).sort(function (a, b) { return b.score - a.score; });
  };
  // ---------- المستوى الأقرب: أقرب سعرات للمطلوب؛ عند التساوي الأقل (قاعدة المكتبة)، وتنبيه إن زاد الفرق على 8٪
  PL.nearest = function (cc, lib, variant, kcal) {
    var L = PL.lib(cc, lib); if (!L) return null; var v = L.vars.filter(function (x) { return x[0] === variant; })[0] || L.vars[0], best = null; if (kcal && typeof variant === 'object' && variant) { var vs = PL.variants(cc, lib, variant, kcal).filter(function (y) { return y.ok; }); v = L.vars.filter(function (x) { return vs[0] && x[0] === vs[0].id; })[0] || v; }
    v[2].forEach(function (x) { var d = Math.abs(x[1] - kcal); if (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) < 1e-9 && x[1] < best.x[1])) best = { x: x, d: d }; });
    return best ? { variant: v[0], vname: v[1], id: best.x[2], level: best.x[0], kcal: best.x[1], p: best.x[3], c: best.x[4], f: best.x[5], meals: best.x[6], warn: kcal && best.d / kcal > 0.08 ? 'أقرب مستوى يبعد ' + Math.round(100 * best.d / kcal) + '٪ عن السعرات المطلوبة' : '' } : null;
  };
  // ---------- الأنواع لعميل: الجنس (من بيانات المستوى أو الاسم)، عدد الوجبات، الاقتصادي؛ مرتبة بالأنسب
  PL.variants = function (cc, lib, c, kcal) {
    var L = PL.lib(cc, lib); if (!L) return []; c = c || {}; var fem = c.sex === 'أنثى', meals = +c.meals || 5, cheap = +c.budget === 1;
    return L.vars.map(function (v) { var x0 = v[2][0] || [], sx = x0[7] || (/الرجال|رجال/.test(v[1]) ? 'm' : /السيدات|سيدات|تكيس|الحوامل|المرضع/.test(v[1]) ? 'f' : ''), ml = x0[6] || 0, eco = !!x0[10] || /اقتصادي/.test(v[1]);
      var ok = !sx || (sx === 'f') === fem, sc = (ok ? 100 : -100) + (ml && ml === meals ? 12 : ml && Math.abs(ml - meals) === 1 ? 4 : 0) + (cheap === eco ? 6 : 0);
      var lo0 = v[2][0] ? v[2][0][1] : 0, hi0 = v[2].length ? v[2][v[2].length - 1][1] : 0; if (kcal) sc += kcal >= lo0 - 50 && kcal <= hi0 + 50 ? 30 : -Math.min(30, Math.abs(kcal < lo0 ? lo0 - kcal : kcal - hi0) / 20);
      return { id: v[0], n: v[1], sx: sx, meals: ml, eco: eco, ok: ok, sc: sc, lo: v[2][0] ? v[2][0][1] : 0, hi: v[2].length ? v[2][v[2].length - 1][1] : 0 }; }).sort(function (a, b) { return b.sc - a.sc; });
  };
  PL.step = function (cc, lib, variant, id, dir) { var L = PL.lib(cc, lib); if (!L) return null; var v = L.vars.filter(function (x) { return x[0] === variant; })[0]; if (!v) return null; var i = v[2].map(function (x) { return x[2]; }).indexOf(id), j = Math.max(0, Math.min(v[2].length - 1, i + dir)); return j === i ? null : PL.nearest(cc, lib, variant, v[2][j][1]); };
  // ---------- المستند القابل للتعديل: {id, title, days:[{t,k,m:[{l, it:[نص], g:{حصص}, mac, time}]}]}
  PL.doc = function (id) { var p = PL.plans && PL.plans[id]; if (!p) return null; return { id: id, title: p[0], days: p[1].map(function (d) { return { t: d[0], k: d[1], m: d[2].map(function (m) { return { l: m[0], it: m[1].slice(), g: Object.assign({}, m[2]), mac: m[3] && m[3].k ? m[3] : null, time: m[4] || '' }; }) }; }) }; };
  // ---------- الحصص: مفاتيح المكتبة ← اسم عربي وقيم الحصة (كارب، بروتين، دهون، سعرات) من دليل المكتبة
  PL.GK = { S: ['نشويات', 15, 2, 1, 80], Lg: ['بقوليات', 15, 7, 1, 100], Meat: ['لحوم', 0, 7, 3, 55], Mi: ['ألبان', 15, 7, 0, 90], V: ['خضار', 5, 2, 0, 25], F: ['فاكهة', 15, 0, 0, 60], Ft: ['دهون', 0, 0, 5, 45], O: ['أخرى', 15, 0, 0, 60] };
  PL.dayGroups = function (d) { var g = {}; d.m.forEach(function (m) { Object.keys(m.g || {}).forEach(function (k) { g[k] = (g[k] || 0) + (+m.g[k] || 0); }); }); return g; };
  PL.mealKcal = function (m) { if (m.mac && m.mac.k) return Math.round(m.mac.k); var k = 0; Object.keys(m.g || {}).forEach(function (x) { k += (+m.g[x] || 0) * ((PL.GK[x] || [])[4] || 0); }); return Math.round(k); };
  PL.dayKcal = function (d) { return d.m.reduce(function (a, m) { return a + PL.mealKcal(m); }, 0); };
  // ---------- الأسماء الظاهرة للعميل: names = {النص الأصلي: النص الظاهر}
  PL.show = function (t, names) { return names && names[t] ? names[t] : t; };
  // ---------- إلى شكل خطة «زنها» (نفس شكل المكتبة السابقة: sys ready)
  var GKW = [[2, /دجاج|فراخ|صدر|لحم|كفتة|سمك|تونة|سلمون|جمبري|بيض|بياض|عجة|أومليت|كبدة|ديك رومي|سردين|بلطي|بوري|جبن|جبنة|قريش|لبنة|واي|شاورما|برجر|هامور|كنعد|ورك|وراك/], [1, /فول|عدس|حمص|فاصوليا|لوبيا|بيصارة|ترمس/], [0, /عيش|خبز|توست|رغيف|أرز|رز|مكرونة|معكرونة|فريك|برغل|شوفان|بطاطس|بطاطا|ذرة|كسكس|جريش|صامولي|تميس|كورن/], [3, /حليب|زبادي|لبن|رايب/], [4, /خيار|طماطم|جرجير|خس|سلطة|بامية|كوسة|كوسا|ملوخية|سبانخ|فلفل|جزر|بروكلي|قرنبيط|خضار|باذنجان|بصل|فجل|كرفس|شوربة خضار/], [5, /تفاح|موز|برتقال|يوسفي|جوافة|عنب|فراولة|بطيخ|شمام|مانجو|كمثرى|خوخ|رمان|تمر|كيوي|فاكهة/], [6, /زيت|زبدة|سمن|مكسرات|لوز|جوز|فول سوداني|سوداني|لب|طحينة|زيتون|أفوكادو|بذور/]];
  PL.groupOf = function (t) { t = String(t || '').replace(/\(.*?\)/g, ' '); var best = 7, at = 1e9; GKW.forEach(function (k) { var m = k[1].exec(t); if (m && m.index < at) { at = m.index; best = k[0]; } }); return best; };
  PL.toHissati = function (c) {
    var R = c.plib, d = R.doc, nm = R.names || {};
    var days = d.days.map(function (y) { return { type: y.t.replace(/^[^-–]*[-–]\s*/, '').replace(/\s*\(.*$/, ''), kcal: y.k, tips: [], slots: y.m.map(function (m) { var k = PL.mealKcal(m); return { name: m.l, type: m.l, time: m.time || '', kcal: k, meal: m.mac ? 'بروتين ' + Math.round(m.mac.p) + ' • كارب ' + Math.round(m.mac.c) + ' • دهون ' + Math.round(m.mac.f) + ' جم' : '', lines: m.it.map(function (t) { var s = PL.show(t, nm); return [PL.groupOf(s), s, s, []]; }) }; }) }; });
    return { sys: 'ready', ready: { id: R.id, name: R.name, label: R.name + ' — ' + R.vname + ' — ' + R.kcal + ' سعرة' }, kcal: R.kcal, pro: R.p || 0, cho: R.c || 0, fat: R.f || 0, water: 2.5, groups: ['نشويات', 'بقوليات', 'لحوم وبروتين', 'ألبان', 'خضار', 'فاكهة', 'دهون', 'أخرى'], dayNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], days: days };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = PL; else root.PL = PL;
})(typeof window !== 'undefined' ? window : this);
