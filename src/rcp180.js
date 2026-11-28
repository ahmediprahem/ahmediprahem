// ================= 1.80 (ر5) الوصفات بالذكاء الاصطناعي والصور — docs/ai_meal_assistant_plan.md البنود 9 و12 و13 (طلب المالك 2026-11-28: «ابدأ في مرحلة توليد الوصفات بالصور»)
// في بطاقة الوجبة في «المساعد الذكي»: «✦ ولّد الوصفة» ← المحطة تكتب الوصفة (مكونات بوحداتنا، وخطوات، ووقت) ← محرك الوصفة (src/recipe.js) يطابق كل سطر
// مع قاعدة الأصناف ويحسب الحصص (وما لا يعرفه يُعلَّم للمراجعة ولا يُحسب) ← يُضبط المقدار على نصيب الوجبة من الخطة الحالية.
// «🖼 صورة توضيحية»: FLUX على Cloudflare، وPixabay احتياطاً، وتُصغَّر WebP قبل الحفظ. «📚 وصفاتي»: مكتبة الأخصائي (مخزن meta المشفّر).
// المراجعة: الوصفة نص غذائي يراجعه الأخصائي. لا تُرسل إلى «زنها» ولا تُثبَّت في الخطة في هذه المرحلة (ر5ب بعد مراجعة الربط).
var RCP = { busy: {}, lib: null, libOpen: 0 };
function rcpOf(c, v) { var a = String(v).split(','), m = ai176Of(c), g = m.groups[+a[0]]; return g && g.meals[+a[1]] ? { g: g, ml: g.meals[+a[1]], gi: +a[0], mi: +a[1] } : null; }
var RCP_STAPLE = ['زيت زيتون', 'بصل', 'طماطم', 'خيار', 'خس', 'جزر', 'كوسا', 'فلفل رومي', 'بطاطس', 'خبز عربي صغير', 'خبز توست', 'أرز أبيض', 'مكرونة', 'شوفان', 'حليب قليل الدسم', 'زبادي', 'لبن', 'جبنة قريش', 'جبن', 'بيضة كاملة', 'صدر دجاج', 'لحم مفروم', 'تونة معلبة بالماء', 'سمك', 'فول مدمس', 'حمص', 'عدس', 'موز', 'تفاح', 'تمر', 'عسل', 'زبدة', 'طحينة', 'مكسرات'];
function rcpFoods(dish) {      // أسماء أصناف القاعدة ووحداتها (ليختار منها النموذج): القريبة من كلمات الطبق، ثم أساسيات المطبخ
  var out = [], by = E.byName(D), add = function (n) { if (out.indexOf(n) < 0 && by[n] && by[n].on !== false) out.push(n); };
  String(dish || '').split(/[\s،,]+/).map(function (w) { return w.replace(/^(وال|ال|و|ب)(?=..)/, ''); }).filter(function (w) { return w.length > 1; }).forEach(function (w) { ai176Match(w).slice(0, 6).forEach(add); });
  RCP_STAPLE.forEach(function (w) { var m = ai176Match(w); if (m.length) add(m.filter(function (n) { return n.length <= 34; })[0] || m[0]); });
  return out.slice(0, 80).map(function (n) { var f = by[n]; return f.us ? n + ' — ' + f.us : n; });
}
function rcpCalc(r) {      // محرك الوصفة على قاعدة الأصناف: الحصص لكل مجموعة، والسعرات الاسمية
  var R = window.DPRecipe, by = E.byName(D), rows = [], SP = /^(ملح|فلفل|كمون|بهارات|توابل|كركم|قرفة|زعتر|بقدونس|كزبرة|ثوم|ماء|ليمون|خل|شطة|بابريكا|ورق غار|هيل|قرنفل)(\s|$|،|و)/;
  (r.ingredients || []).forEach(function (ln, i) {
    var t = String(ln || '').trim(); if (!t) return;
    var t0 = t.replace(/^([\d.,/½¼]+|نصف|ربع|ثلث|رشة|قليل من|حسب الرغبة)\s*(ملعقة صغيرة|ملعقة كبيرة|ملعقة|ملاعق|رشة|فص|فصوص|كوب)?\s*/, '');
    t0 = t0.replace(/^ال/, ''); if (SP.test(t0) || /^توابل/.test(t)) { rows.push({ id: i, raw: t, include: false, status: 'skip', reason: 'توابل: لا حصص' }); return; }      // توابل بلا كمية: تُتجاهل
    var P = function (line) { try { return R.parse(D, line)[0] || null; } catch (e) { return null; } }, x = P(t.replace(/\s+—\s+[^—]+$/, '')); if (!x) return;
    if (!x.food && x.status !== 'ambiguous' && /\(/.test(t)) { var x0 = P(t.replace(/\([^)]*\)/g, ' ')); if (x0 && x0.food) x = x0; }
    if (!x.food && x.status !== 'ambiguous' && x.nameRaw) {      // أوصاف زائدة («طماطم متوسطة مقطعة»): تُحذف كلمة من الآخر حتى ثلاث كلمات
      var ws = String(x.nameRaw).split(/\s+/), pre = t.slice(0, Math.max(0, t.indexOf(ws[0])));
      for (var k = 1; k <= 3 && ws.length - k >= 1; k++) { var x1 = P(pre + ws.slice(0, ws.length - k).join(' ')); if (x1 && x1.food) { x = x1; break; } }
    }
    var f = x.food && by[x.food], VOL = { 'كوب': 48, 'ملعقة كبيرة': 3, 'ملعقة صغيرة': 1 }, CNT = /^(حبة|حبه|قطعة|قطعه|ثمرة|ثمره)$/, uw = String(x.unitRaw || '').replace(/^ال/, '').replace(/ه$/, 'ة').replace(/(أكواب|اكواب)/, 'كوب').replace(/ملاعق/, 'ملعقة');
    if (f && x.status === 'review' && x.qty > 0 && uw) {
      var q = 0, ok1 = function (y) { return y && y.status === 'ok' && y.food === f.n; };
      if (f.us && f.us.indexOf(uw) >= 0) q = x.qty;      // «رغيف» ووحدة الصنف «رغيف صغير»
      else if (VOL[uw] && VOL[f.us]) q = Math.round(x.qty * VOL[uw] / VOL[f.us] * 100) / 100;      // تحويل أحجام قياسي: كوب = 16 ملعقة كبيرة = 48 ملعقة صغيرة
      else if (CNT.test(uw) && !VOL[f.us] && f.us !== 'جم') q = x.qty;      // «1 حبة موز» ووحدة الصنف «موزة»
      if (q > 0) { var y = P(q + ' ' + f.us + ' ' + f.n); if (ok1(y)) { y.how = (y.how ? y.how + ' • ' : '') + 'حُوّلت ' + x.qty + ' ' + uw + ' إلى ' + q + ' ' + f.us; x = y; } }
    }
    x.raw = t; rows.push(x);
  });
  var tot = new Array(13).fill(0), mac = [0, 0, 0];
  rows.forEach(function (x) { if (!x.include || !x.food || !(x.eR > 0)) return; var f = by[x.food]; if (!f) return; tot[f.g] += x.eR; for (var k = 0; k < 3; k++) mac[k] += x.eR * D.EX[f.g][k]; });
  return { rows: rows, tot: tot, mac: mac, kcal: Math.round(mac[0] * 4 + mac[1] * 4 + mac[2] * 9), review: rows.filter(function (x) { return x.include && x.status !== 'ok'; }).length };
}
function rcpShare(c, ml) {      // نصيب الوجبة من الخطة الحالية (متوسط الأيام) بالسعرات
  if (!c.plan || !c.plan.days) return 0; var s = 0, n = 0, nm = s179Norm(ml.name);
  c.plan.days.forEach(function (d) { d.slots.forEach(function (sl) { if (s179Norm(sl.name) !== nm) return; var k = 0; (sl.lines || []).forEach(function (l) { if (!l.missing) k += l.e * D.EX[l.g][3]; }); s += k; n++; }); });
  return n ? Math.round(s / n) : 0;
}
function rcpScale(calc, share) { if (!share || !(calc.kcal > 0)) return 1; return Math.max(0.25, Math.min(4, Math.round(share / calc.kcal * 4) / 4)); }
function rcpCard(c, v, ml) {
  var r = ml.rcp; if (!r) return '';
  var K = rcpCalc(r), sh = rcpShare(c, ml), k = rcpScale(K, sh), by = E.byName(D);
  var ing = K.rows.map(function (x) {
    var f = x.food && by[x.food], st = !x.include ? 'skip' : x.status === 'ok' ? 'ok' : 'rv';
    return '<li class="rcp-' + st + '"><span>' + esc(x.raw) + '</span>' + (f && x.eR > 0 ? ' <small>' + (st === 'ok' ? '✓ ' : '⚠ ') + esc(S179_GL[f.g] || '') + ' ' + Math.round(x.eR * k * 2) / 2 + ' حصة</small>' : '') + (st === 'rv' && x.reason ? '<small class="rcpwhy">' + esc(x.reason) + '</small>' : '') + '</li>';
  }).join('');
  var g13 = K.tot.map(function (e, g) { return e > 0 ? '<span class="a175g">' + A175_G[g] + ' <b>' + Math.round(e * k * 2) / 2 + '</b></span>' : ''; }).join('');
  return '<article class="rcp" aria-label="وصفة ' + esc(r.title) + '">'
    + (r.img ? '<figure class="rcpimg"><img src="' + r.img + '" alt="' + esc(r.title) + '" loading="lazy"><figcaption>' + esc(r.credit || 'صورة توضيحية') + '</figcaption></figure>' : '')
    + '<div class="rcpb"><h5>🧑‍🍳 ' + esc(r.title) + (r.minutes ? ' <small>⏱ ' + r.minutes + ' دقيقة</small>' : '') + '</h5>'
    + '<p class="small rcpk">' + (sh ? 'المقدار ×' + k + ' ليطابق نصيب «' + esc(ml.name) + '» (≈ ' + sh + ' سعرة)، فتصبح ≈ ' + Math.round(K.kcal * k) + ' سعرة.' : 'الوصفة ≈ ' + K.kcal + ' سعرة. ولّد الخطة ليُضبط المقدار على نصيب الوجبة.') + '</p>'
    + '<div class="a175gs">' + g13 + '</div>'
    + '<h6>المكونات' + (k !== 1 ? ' <small>(الكميات المكتوبة لحصة واحدة من الوصفة)</small>' : '') + '</h6><ul class="rcping">' + ing + '</ul>'
    + (K.review ? '<p class="warn small">⚠ ' + K.review + ' سطر يحتاج مراجعتك (غير موجود في القاعدة أو وحدته غير واضحة) ولا يُحسب حتى تراجعه.</p>' : '')
    + (r.steps && r.steps.length ? '<h6>طريقة التحضير</h6><ol class="rcpst">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '')
    + '<p class="small dim">وصفة مقترحة بالذكاء الاصطناعي' + (r.prov ? ' (' + esc(r.prov === 'gl' ? 'Gemini' : r.prov === 'zai' ? 'GLM' : r.prov === 'groq' ? 'Groq' : r.prov) + ')' : '') + ': راجعها قبل اعتمادها.</p>'
    + '<p class="genfoot rcpbtn">' + (r.img ? '' : '<button class="sec sm" data-a="rcpImg" data-v="' + v + '"' + (RCP.busy['i' + v] ? ' disabled' : '') + '>' + (RCP.busy['i' + v] ? '… جارٍ' : '🖼 صورة توضيحية') + '</button>')
    + '<button class="sec sm" data-a="rcpSave" data-v="' + v + '">📚 احفظ في وصفاتي</button><button class="sec sm" data-a="rcpGen" data-v="' + v + '">↻ وصفة أخرى</button><button class="r sm" data-a="rcpDel" data-v="' + v + '" aria-label="حذف الوصفة">✕</button></p></div></article>';
}
ai176Meal = (function (f) { return function (g, gi, ml, mi) {
  var h = f.apply(this, arguments), v = gi + ',' + mi, c = cur(), b = RCP.busy['r' + v];
  var btn = '<button class="sec sm rcpgo" data-a="rcpGen" data-v="' + v + '"' + (b ? ' disabled' : '') + '>' + (b ? '… جارٍ كتابة الوصفة' : '✦ ولّد الوصفة') + '</button>';
  if (h.slice(-12) !== '</div></div>') return h;
  return h.slice(0, -12) + btn + '</div>' + (c ? rcpCard(c, v, ml) : '') + '</div>';
}; })(ai176Meal);
function rcpLinked() { return typeof HX !== 'undefined' && HX.st && HX.st.ident && typeof hxFetch === 'function'; }
A.rcpGen = function (v) {
  var c = cur(), o = c && rcpOf(c, v); if (!o) return; var dish = String(o.ml.recipe || '').trim() || o.ml.name;
  if (!rcpLinked()) { toast('اربط «زنها Pro» بالمحطة أولاً (الإعدادات ← زنها)'); return; }
  RCP.busy['r' + v] = 1; main();
  hxFetch('POST', '/v1/ai/food', { mode: 'recipe', dish: dish, meal: o.ml.name, foods: rcpFoods(dish) }, true)
    .then(function (j) { if (!j || !j.ok) throw new Error((j && (j.reason || j.error)) || 'تعذّرت كتابة الوصفة الآن'); o.ml.rcp = { title: j.title, ingredients: j.ingredients, steps: j.steps || [], minutes: j.minutes || 0, imgP: j.img || '', img: '', prov: j.prov || '', at: Date.now(), dish: dish }; if (!o.ml.recipe) o.ml.recipe = dish; save(); })
    .catch(function (e) { toast('⚠ ' + (e.message || 'تعذّر الاتصال بالمساعد')); })
    .then(function () { delete RCP.busy['r' + v]; main(); });
};
function rcpShrink(b64, mime) {      // صورة صغيرة (≤ 512 بكسل، WebP) قبل الحفظ في ملف العميل/المكتبة
  return new Promise(function (res) {
    var src = 'data:' + (mime || 'image/jpeg') + ';base64,' + b64, im = new Image();
    im.onload = function () { try { var s = Math.min(1, 512 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); var u = cv.toDataURL('image/webp', 0.8); res(/^data:image\/webp/.test(u) ? u : cv.toDataURL('image/jpeg', 0.82)); } catch (e) { res(src); } };
    im.onerror = function () { res(''); }; im.src = src;
  });
}
A.rcpImg = function (v) {
  var c = cur(), o = c && rcpOf(c, v); if (!o || !o.ml.rcp) return; if (!rcpLinked()) { toast('اربط «زنها Pro» بالمحطة أولاً'); return; }
  RCP.busy['i' + v] = 1; main();
  hxFetch('POST', '/v1/ai/recipe-img', { prompt: o.ml.rcp.imgP || o.ml.rcp.title }, true)
    .then(function (j) { if (!j || !j.ok) throw new Error((j && (j.reason || j.error)) || 'لا صورة الآن'); return rcpShrink(j.img, j.mime).then(function (u) { if (!u) throw new Error('تعذّرت قراءة الصورة'); o.ml.rcp.img = u; o.ml.rcp.src = j.src; o.ml.rcp.credit = j.src === 'flux' ? 'صورة توضيحية مولّدة (Cloudflare)' : (j.credit || 'Pixabay'); save(); }); })
    .catch(function (e) { toast('⚠ ' + (e.message || 'تعذّر جلب الصورة')); })
    .then(function () { delete RCP.busy['i' + v]; main(); });
};
A.rcpDel = function (v) { var c = cur(), o = c && rcpOf(c, v); if (!o) return; delete o.ml.rcp; save(); main(); };
// ---------- «📚 وصفاتي»
function rcpLoad() { if (RCP.lib) return Promise.resolve(RCP.lib); return dbAll('meta').then(function (m) { RCP.lib = m.filter(function (x) { return String(x.key).indexOf('rcp.') === 0; }).sort(function (a, b) { return b.at - a.at; }); return RCP.lib; }).catch(function () { RCP.lib = []; return RCP.lib; }); }
A.rcpSave = function (v) {
  var c = cur(), o = c && rcpOf(c, v); if (!o || !o.ml.rcp) return; var r = o.ml.rcp, key = 'rcp.' + (r.id || (r.id = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36)));
  var rec = { key: key, at: Date.now(), title: r.title, ingredients: r.ingredients, steps: r.steps, minutes: r.minutes, imgP: r.imgP, img: r.img, credit: r.credit || '', src: r.src || '', prov: r.prov || '', dish: r.dish || '' };
  dbPut('meta', rec).then(function () { return rcpLoad(); }).then(function (L) { var i = L.map(function (x) { return x.key; }).indexOf(key); if (i >= 0) L[i] = rec; else L.unshift(rec); save(); main(); toast('✓ حُفظت «' + r.title + '» في وصفاتي'); }).catch(function () { toast('⚠ تعذّر الحفظ'); });
};
A.rcpLib = function () { RCP.libOpen = !RCP.libOpen; rcpLoad().then(function () { main(); }); };
A.rcpUse = function (key) {
  var c = cur(), sel = document.getElementById('rcpto'), o = c && sel && rcpOf(c, sel.value), r = (RCP.lib || []).filter(function (x) { return x.key === key; })[0]; if (!o || !r) return;
  o.ml.rcp = { id: key.slice(4), title: r.title, ingredients: r.ingredients, steps: r.steps, minutes: r.minutes, imgP: r.imgP, img: r.img, credit: r.credit, src: r.src, prov: r.prov, at: Date.now(), dish: r.dish }; o.ml.recipe = r.title; RCP.libOpen = 0; save(); main(); toast('✓ «' + r.title + '» لوجبة «' + o.ml.name + '»');
};
A.rcpLibDel = function (key) { if (!confirm('حذف الوصفة من «وصفاتي»؟')) return; dbDel('meta', key).then(function () { RCP.lib = (RCP.lib || []).filter(function (x) { return x.key !== key; }); main(); }); };
function rcpLibView(c) {
  var L = RCP.lib || [], m = ai176Of(c), opts = []; m.groups.forEach(function (g, gi) { g.meals.forEach(function (ml, mi) { opts.push('<option value="' + gi + ',' + mi + '">' + esc(ml.name) + (gi ? ' — ' + esc(g.name) : '') + '</option>'); }); });
  return '<section class="rcplib" aria-labelledby="rcplh"><h4 id="rcplh">📚 وصفاتي <small class="dim">(' + L.length + ')</small></h4>'
    + (L.length ? '<p class="small"><label for="rcpto">استعمل الوصفة لوجبة:</label> <select id="rcpto">' + opts.join('') + '</select></p><div class="rcpgrid">' + L.map(function (r) {
      return '<div class="rcpli">' + (r.img ? '<img src="' + r.img + '" alt="">' : '<div class="rcpnoimg">🧑‍🍳</div>') + '<b>' + esc(r.title) + '</b>' + (r.minutes ? '<small>⏱ ' + r.minutes + ' دقيقة</small>' : '') + '<p class="genfoot"><button class="sm" data-a="rcpUse" data-v="' + esc(r.key) + '">استعمل</button><button class="r sm" data-a="rcpLibDel" data-v="' + esc(r.key) + '" aria-label="حذف ' + esc(r.title) + '">✕</button></p></div>';
    }).join('') + '</div>' : '<p class="small dim">لا وصفات محفوظة بعد. ولّد وصفة لوجبة ثم «📚 احفظ في وصفاتي».</p>') + '</section>';
}
ai176Panel = (function (f) { return function (c) {
  var h = f.apply(this, arguments), x = /<button[^>]*data-a="s179Loc"/.exec(h); if (!x || h.indexOf('data-a="rcpLib"') >= 0) return h;
  h = h.slice(0, x.index) + '<button class="sec" data-a="rcpLib" aria-expanded="' + !!RCP.libOpen + '">📚 وصفاتي</button> ' + h.slice(x.index);
  if (!RCP.libOpen) return h; var y = /<p class="genfoot"><button class="sec" data-a="rcpLib"/.exec(h), i = y ? y.index : h.indexOf('<button class="sec" data-a="rcpLib"');
  return h.slice(0, i) + rcpLibView(c) + h.slice(i);
}; })(ai176Panel);
if (typeof window !== 'undefined') window.RCP180 = { calc: rcpCalc, share: rcpShare, scale: rcpScale, foods: rcpFoods };      // للاختبار
