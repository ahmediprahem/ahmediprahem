/* استيراد قاعدة أغذية الرياضيين من xlsx/csv: اكتشاف الورقة والأعمدة، تصنيف تلقائي (دور + وجبات + تنبيهات)، قياسات منزلية شائعة. */
(function (root) {
  'use strict';
  var I = {}, norm = function (s) { return String(s == null ? '' : s).replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\s_()\-–—:؟?]+/g, ' ').trim().toLowerCase(); };
  I.norm = norm;
  // ---------------------------------------------------------------- اكتشاف الأعمدة (عربي/إنجليزي)
  var ALIASES = {
    id: ['fdc id', 'fdcid', 'id', 'ndb', 'رقم'], en: ['الاسم english', 'english', 'description', 'الوصف usda', 'الوصف english', 'name en'], ar: ['الاسم العربي تقريبي', 'الاسم العربي', 'الاسم', 'name', 'arabic name', 'name ar'],
    g: ['الفئه', 'المجموعه', 'category', 'group'], st: ['الحاله', 'state'], k: ['طاقه kcal', 'kcal', 'energy', 'سعرات', 'السعرات'], p: ['بروتين g', 'بروتين', 'protein'], c: ['كربوهيدرات g', 'كربوهيدرات', 'كارب', 'carbs', 'carbohydrate'], f: ['دهون g', 'دهون', 'fat'],
    fi: ['الياف g', 'الياف', 'fiber'], su: ['سكريات g', 'سكريات', 'sugar'], na: ['صوديوم mg', 'صوديوم', 'sodium'], full: ['ماكروز كامله', 'complete']
  }, MALIAS = { id: ['fdc id', 'fdcid'], q: ['الكميه', 'quantity', 'amount'], u: ['الوحده', 'unit'], d: ['الوصف', 'description', 'desc'], g: ['الوزن بالجرام', 'grams', 'weight g', 'الوزن'] };
  function mapHeaders(hdr, aliases) { var m = {}, nh = hdr.map(norm); Object.keys(aliases).forEach(function (k) { for (var a = 0; a < aliases[k].length; a++) { var al = norm(aliases[k][a]), i = nh.indexOf(al); if (i >= 0) { m[k] = i; return; } } for (var a2 = 0; a2 < aliases[k].length; a2++) { var al2 = norm(aliases[k][a2]); if (al2.length < 4) continue; var j = nh.findIndex(function (h, ix) { return h.indexOf(al2) === 0 && !Object.keys(m).some(function (kk) { return m[kk] === ix; }); }); if (j >= 0) { m[k] = j; return; } } }); return m; }
  I.detect = async function (wb) {                           // يختار ورقة الأغذية وورقة القياسات (إن وُجدت)
    var best = null, meas = null;
    for (var i = 0; i < wb.names.length; i++) {
      var rows = await wb.sheet(wb.names[i]); if (!rows.length) continue; var hi = -1; for (var r = 0; r < Math.min(6, rows.length); r++) if ((rows[r] || []).filter(function (v) { return v !== null && v !== ''; }).length >= 5) { hi = r; break; } if (hi < 0) continue;
      var m = mapHeaders(rows[hi], ALIASES), ok = (m.ar != null || m.en != null) && m.k != null && m.p != null && m.c != null && m.f != null; if (ok && (!best || rows.length > best.rows.length)) best = { name: wb.names[i], rows: rows, hi: hi, map: m };
      var mm = mapHeaders(rows[hi], MALIAS); if (mm.id != null && mm.g != null && (mm.d != null || mm.u != null) && !ok) meas = { name: wb.names[i], rows: rows, hi: hi, map: mm };
    }
    if (!best) { var miss = ['الاسم (عربي أو إنجليزي)', 'طاقة kcal', 'بروتين g', 'كربوهيدرات g', 'دهون g']; throw new Error('لم أجد ورقة أغذية بالأعمدة المطلوبة: ' + miss.join('، ') + '. تأكد من أن الصف الأول يحوي أسماء الأعمدة.'); }
    return { food: best, measures: meas };
  };
  // ---------------------------------------------------------------- التصنيف
  var CAT_UNFIT = { 'لحم خنزير': 'خنزير', 'أغذية أطفال': 'أغذية أطفال', 'وجبات سريعة': 'وجبات سريعة', 'أطعمة مطاعم': 'مطاعم', 'أغذية السكان الأصليين (أمريكا)': 'غير مألوف', 'توابل وأعشاب': 'توابل' };
  var CAT_PROC = { 'نقانق ولحوم مصنّعة': 1, 'حلويات': 1, 'سناكات': 1, 'شوربات وصلصات': 1, 'وجبات وأطباق جانبية': 1 };
  var R_PORK = /\b(pork|ham|bacon|lard|pig|prosciutto|pepperoni|salami|chorizo)\b/i, R_ALC = /\b(beer|wine|liquor|alcohol|rum|vodka|whisk(e)?y|gin|brandy|cocktail|sake|cider)\b/i;
  I.classify = function (f) {                               // f: {g,n,en,st,k,p,c,f,fi,full} → {role, meals, fl:[تنبيهات], hide}
    var cat = f.g || '', e = f.en || '', fl = [], role = 'x', meals = [], p = f.p, c = f.c, fa = f.f, k = f.k;
    if (CAT_UNFIT[cat]) fl.push(CAT_UNFIT[cat]); if (R_PORK.test(e) && fl.indexOf('خنزير') < 0) fl.push('خنزير'); if (R_ALC.test(e) || /alcohol/i.test(cat)) fl.push('كحول');
    if (/restaurant|fast food|mcdonald|burger king|kfc|wendy|taco bell|pizza hut/i.test(e) && fl.indexOf('مطاعم') < 0 && fl.indexOf('وجبات سريعة') < 0) fl.push('مطاعم'); if (/\b(baby|infant|toddler)\b/i.test(e) && fl.indexOf('أغذية أطفال') < 0) fl.push('أغذية أطفال');
    if (f.full === false) fl.push('ماكروز ناقصة'); else { var calc = 4 * p + 4 * c + 9 * fa; if (k > 0 && (p + c + fa > 108 || (Math.abs(k - calc) > 70 && Math.abs(k - calc) / k > 0.3))) fl.push('قيم غير متسقة'); }
    var proc = !!CAT_PROC[cat], isMeatCat = /^(لحم بقري|ضأن وعجل وصيد|دواجن|أسماك ومأكولات بحرية|نقانق ولحوم مصنّعة|لحم خنزير)$/.test(cat);
    var veg = cat === 'خضروات' || (/veg/i.test(cat)) || (k < 60 && c < 12 && p < 4 && fa < 2 && f.fi > 0.8 && !/فواك|عصير|مشروب|حلويات/.test(cat));
    var fruit = /فواك|fruit/i.test(cat) || /juice|dates?\b|honey|raisin/i.test(e);
    if (veg) { role = 'v'; meals = ['L', 'D']; }
    else if (fa >= 30 && p < 30 || /^(دهون وزيوت|مكسرات وبذور)$/.test(cat) && fa >= 25) { role = 'f'; meals = /زيوت|oil|butter|lard|shortening|margarine/i.test(cat + ' ' + e) ? ['B', 'L', 'D'] : ['B', 'S1', 'S2', 'N']; }
    else if (p >= 14 && p * 4 >= 0.28 * k && c <= 14 || isMeatCat && p >= 12) { role = 'p'; if (/^(ألبان وبيض)$/.test(cat) || /egg|yogurt|cheese|milk|whey|casein|cottage/i.test(e)) meals = ['B', 'S1', 'S2', 'N']; else if (/تونة|tuna|sardine|canned/i.test(e + ' ' + (f.st || '')) || /معلّب/.test(f.st || '')) meals = ['B', 'L', 'D', 'S1', 'S2']; else meals = ['L', 'D']; if (/whey|protein powder|isolate/i.test(e)) meals = ['B', 'S1', 'S2', 'N']; }
    else if (/^(ألبان وبيض)$/.test(cat) && p >= 6) { role = 'p'; meals = ['B', 'S1', 'S2', 'N']; }
    else if (c >= 12 && fa <= 18) { role = 'c'; if (fruit) meals = ['B', 'S1', 'S2', 'N']; else if (/^(حبوب الفطور)$/.test(cat) || /cereal|oat|granola|muesli|bread|toast|bagel|pita|tortilla|muffin|pancake|waffle/i.test(e)) meals = ['B', 'S1', 'S2']; else if (/^مخبوزات$/.test(cat)) meals = ['B', 'S1', 'S2']; else if (/^(حلويات|سناكات)$/.test(cat)) meals = ['S1', 'S2']; else meals = ['L', 'D']; if (/^بقوليات$/.test(cat) && /fava|ful|foul/i.test(e)) meals.push('B'); }
    if (role === 'x' && !meals.length) meals = [];
    return { role: role, meals: meals, fl: fl, hide: fl.some(function (x) { return x === 'خنزير' || x === 'كحول' || x === 'أغذية أطفال' || x === 'مطاعم' || x === 'وجبات سريعة' || x === 'غير مألوف' || x === 'توابل' || x === 'ماكروز ناقصة' || x === 'قيم غير متسقة'; }), proc: proc };
  };
  // ---------------------------------------------------------------- أسماء العرض والقراءة
  var num = function (v) { if (typeof v === 'number') return v; if (v == null || v === '') return NaN; var x = parseFloat(String(v).replace(',', '.')); return isNaN(x) ? NaN : x; };
  var cleanSt = function (s) { var x = String(s || '').replace(/\(.*?\)/g, '').replace(/[—-].*$/, '').trim(); return /^(غير محدد|غير معروف|غير مصنّف|n\/a|unspecified)$/i.test(x) ? '' : x; };
  I.stClean = function (s) { var x = String(s == null ? '' : s).trim(); return /^(غير محدد|غير معروف|غير مصنّف|n\/a|unspecified)$/i.test(x) ? '' : x; };
  I.rows = function (sheet) {
    var m = sheet.map, rows = sheet.rows.slice(sheet.hi + 1), cats = {}, out = [], seen = {}; rows.forEach(function (r) { if (m.g != null && r[m.g]) cats[String(r[m.g]).trim()] = 1; });
    rows.forEach(function (r, i) {
      var k = num(r[m.k]), p = num(r[m.p]), c = num(r[m.c]), f = num(r[m.f]), en = m.en != null ? String(r[m.en] || '').trim() : '', ar = m.ar != null ? String(r[m.ar] || '').trim() : '', full = m.full != null ? String(r[m.full] || '').trim() !== 'لا' : (isNaN(k) || isNaN(p) || isNaN(c) || isNaN(f) ? false : true);
      if (!ar && !en) return; if (isNaN(p) || isNaN(c) || isNaN(f)) return; if (isNaN(k)) k = 4 * p + 4 * c + 9 * f;
      var cat = m.g != null ? String(r[m.g] || '').trim() : '', arOk = ar && !cats[ar], id = m.id != null && r[m.id] != null && r[m.id] !== '' ? 'U' + String(r[m.id]).trim() : 'U' + (sheet.hi + 2 + i), st = cleanSt(m.st != null ? r[m.st] : '');
      if (seen[id]) return; seen[id] = 1;
      var food = { id: id, g: cat || 'غير مصنّف', n: arOk ? ar : en || ar, en: en, st: st, k: Math.round(k * 10) / 10, p: p, c: c, f: f, fi: num(m.fi != null ? r[m.fi] : 0) || 0, su: num(m.su != null ? r[m.su] : 0) || 0, na: num(m.na != null ? r[m.na] : 0) || 0, full: full, _ar: arOk ? ar : '' };
      var cl = I.classify(food); food.role = cl.role; food.meals = cl.meals; food.fl = cl.fl; food.hide = cl.hide; food.proc = cl.proc; out.push(food);
    });
    // أسماء فريدة: عند التكرار يُضاف وصف USDA الإنجليزي بتوسّع تدريجي (مقطعان، 3، 5، الكل) ثم رقم المعرّف
    var levels = [2, 3, 5, 99], nameOf = function (f, lv) { var e = f.en.split(',').slice(0, lv).join(',').trim(); return f._ar ? (e ? f._ar + ' — ' + e : f._ar) : (e || f.n); };
    for (var li = 0; li < levels.length; li++) { var cnt = {}; out.forEach(function (f) { cnt[f.n] = (cnt[f.n] || 0) + 1; }); var any = false; out.forEach(function (f) { if (cnt[f.n] > 1 && f.en) { var nn = nameOf(f, levels[li]); if (nn !== f.n) { f.n = nn; any = true; } } }); if (!any) break; }
    var cnt2 = {}; out.forEach(function (f) { cnt2[f.n] = (cnt2[f.n] || 0) + 1; }); out.forEach(function (f) { if (cnt2[f.n] > 1) f.n += ' [' + f.id.slice(1) + ']'; delete f._ar; });
    return out;
  };
  // ---------------------------------------------------------------- القياسات المنزلية الشائعة
  var UNITS = [['medium', 'حبة متوسطة', 1], ['large', 'حبة كبيرة', 1], ['small', 'حبة صغيرة', 1], ['each', 'حبة', 1], ['unit', 'حبة', 1], ['egg', 'بيضة', 1], ['slice', 'شريحة', 1], ['piece', 'قطعة', 1], ['pieces', 'قطعة', 1], ['fillet', 'فيليه', 1], ['breast', 'صدر', 1], ['thigh', 'فخذ', 1], ['drumstick', 'ساق', 1], ['wing', 'جناح', 1], ['patty', 'قرص', 1], ['scoop', 'مغرفة', 1], ['cup', 'كوب', 0], ['tablespoon', 'ملعقة كبيرة', 0], ['tbsp', 'ملعقة كبيرة', 0], ['teaspoon', 'ملعقة صغيرة', 0], ['tsp', 'ملعقة صغيرة', 0], ['can', 'علبة', 1], ['bar', 'لوح', 1], ['serving', 'حصة', 1]];
  I.unitOf = function (text) { var t = String(text || '').toLowerCase().trim(); for (var i = 0; i < UNITS.length; i++) { var u = UNITS[i][0]; if (t === u || t.indexOf(u + ' ') === 0 || t.indexOf(u + ',') === 0 || t.indexOf(u + '(') === 0) return { key: u, ar: UNITS[i][1], whole: UNITS[i][2], rank: i }; } return null; };
  var PRI = {
    f: ['tbsp', 'tablespoon', 'tsp', 'teaspoon', 'piece', 'slice', 'cup', 'scoop', 'each', 'unit', 'medium', 'large', 'small', 'serving', 'bar', 'can'],
    p: ['fillet', 'breast', 'thigh', 'drumstick', 'wing', 'patty', 'egg', 'medium', 'large', 'small', 'each', 'unit', 'slice', 'piece', 'pieces', 'scoop', 'cup', 'tbsp', 'tablespoon', 'tsp', 'teaspoon', 'can', 'bar', 'serving'],
    c: ['medium', 'large', 'small', 'each', 'unit', 'slice', 'piece', 'pieces', 'cup', 'tbsp', 'tablespoon', 'tsp', 'teaspoon', 'scoop', 'bar', 'can', 'serving'],
    v: ['cup', 'medium', 'large', 'small', 'each', 'unit', 'slice', 'piece', 'pieces', 'tbsp', 'tablespoon', 'tsp', 'teaspoon', 'can', 'serving']
  };
  I.pickMeasure = function (list, role) {                    // list: [{q,text,g}] → أفضل قياس شائع للدور {q,u,g,w} أو null
    var order = PRI[role] || PRI.c, best = null, all = []; (list || []).forEach(function (m) { var q = +m.q, g = +m.g; if (!(q > 0) || !(g >= 4 && g <= 450)) return; var u = I.unitOf(m.text); if (!u) return; var ri = order.indexOf(u.key); if (ri < 0) return; var cand = { q: q, u: u.ar, g: g, w: u.whole, rank: ri }; all.push(cand); if (!best || cand.rank < best.rank || (cand.rank === best.rank && cand.q === 1 && best.q !== 1)) best = cand; });
    if (best && best.u === 'كوب' && best.g / best.q > 230) { var sp = all.filter(function (c) { return c.u === 'ملعقة كبيرة' || c.u === 'ملعقة صغيرة'; }).sort(function (a, b) { return b.g / b.q - a.g / a.q; })[0]; if (sp) best = sp; }   // كوب عسل/دبس/زبدة فول (> 230 جم) غير واقعي: تُفضَّل الملعقة
    return best ? { q: best.q, u: best.u, g: best.g, w: best.w } : null;
  };
  I.measuresById = function (sheet) {                        // Map: id → قائمة قياسات من ورقة القياسات
    var m = sheet.map, by = {}; sheet.rows.slice(sheet.hi + 1).forEach(function (r) { var id = r[m.id]; if (id == null || id === '') return; var text = (m.d != null && r[m.d]) || (m.u != null && r[m.u]) || ''; (by['U' + String(id).trim()] = by['U' + String(id).trim()] || []).push({ q: num(m.q != null ? r[m.q] : 1) || 1, text: String(text), g: num(r[m.g]) }); });
    return by;
  };
  I.parseCoreMeasures = function (s) {                      // '1 cup = 158 جم | 1 tbsp = 8.4 جم' → [{q,text,g}]
    return String(s || '').split('|').map(function (x) { var m = /^\s*([\d.\/]+)\s+(.+?)\s*=\s*([\d.]+)\s*جم/.exec(x); if (!m) return null; var q = m[1].indexOf('/') > 0 ? (+m[1].split('/')[0]) / (+m[1].split('/')[1]) : +m[1]; return { q: q, text: m[2], g: +m[3] }; }).filter(Boolean);
  };
  var FR = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  I.hmText = function (hm, grams) {                         // «≈ 1½ كوب» أو ''
    if (!hm || !(hm.g > 0) || !(grams > 0)) return ''; var n = grams / hm.g * hm.q, step = hm.w ? 0.5 : 0.25; n = Math.round(n / step) * step; if (n < 0.25 || n > 20) return ''; var whole = Math.floor(n + 1e-9), frac = Math.round((n - whole) * 100) / 100, s = (whole ? whole : '') + (frac ? FR[frac] : ''); return '≈ ' + s + ' ' + hm.u;
  };
  var fq = function (q) { var w = Math.floor(q + 1e-9), f = Math.round((q - w) * 100) / 100, fr = { 0.25: '¼', 0.33: '⅓', 0.5: '½', 0.67: '⅔', 0.75: '¾' }[f]; return (w || !fr ? w : '') + (fr || (f ? String(f).slice(1) : '')) || '0'; };
  I.hmDef = function (hm, name) {                           // «(1 كوب = 158 جم)» أو «(1 بيضة كبيرة = 50 جم)» — مقدار الحصة المنزلية للصنف
    if (!hm || !(hm.g > 0) || !(hm.q > 0)) return ''; var u = hm.u; if (/بيض/.test(name || '') && /^حبة/.test(u)) u = u.replace(/^حبة/, 'بيضة'); return '(' + fq(hm.q) + ' ' + u + ' = ' + (Math.round(hm.g * 10) / 10) + ' جم)';
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = I; else root.AthImport = I;
})(typeof window !== 'undefined' ? window : globalThis);
