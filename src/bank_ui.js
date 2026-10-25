// ================= محرر الحصص — بنك الوجبات (يُدمج داخل app.js عند /*BANKUI*/)
// المصدر الحقيقي للوجبات: D.bank (الأصل + التعديلات بعد E.applyMealSettings). التعديلات تُحفظ في S.settings.meals (طبقة المدير أو المستخدم).
// تأثيرها: الخطط التي تُولَّد أو يُعاد توليدها بعد الآن لأي عميل؛ الخطط المحفوظة لا تتغير.
var BK = { open: { B: false, L: false, D: false, S: false }, q: '', edit: null, move: null, b: { open: false, text: '', name: '', note: '', time: '', m: [0, 0, 1, 0], rows: null, err: '' } }, BK_CATS = [['B', 'الفطور', '🌅'], ['L', 'الغداء', '🍽️'], ['D', 'العشاء', '🌙'], ['S', 'السناك', '🍎']], BK_ROLES = ['كربوهيدرات رئيسي', 'بروتين رئيسي', 'خضار', 'دهون', 'اختياري'];
try { var bo0 = JSON.parse(localStorage.getItem('hissa_bank_open') || 'null'); if (bo0) BK.open = Object.assign(BK.open, bo0); } catch (e) { }
function bkNorm(s) { return window.DTHamed ? DTHamed.norm(s) : String(s || '').toLowerCase(); }
function bkSet() { return S.settings.meals = S.settings.meals || { over: {}, deleted: [], custom: [] }; }
function bkOwn(id) { var o = S.settings.meals && S.settings.meals.over && S.settings.meals.over[id]; return o && Object.keys(o).length ? o : null; }
function bkOwnCustom(id) { return ((S.settings.meals && S.settings.meals.custom) || []).filter(function (c) { return c.id === id; })[0] || null; }
function bkFromAdmin(id) { var o = S.mode !== 'admin' && S.base && S.base.meals && S.base.meals.over && S.base.meals.over[id]; return o && Object.keys(o).length ? o : null; }
function bkBase(id) { return E.buildMealBank(D, BASEB, S.base || {}).bank.filter(function (x) { return x.id === id; })[0] || null; }     // الوجبة كما تراها طبقتك بدون تعديلاتك أنت
function bkEff(id) { return D.bank.filter(function (x) { return x.id === id; })[0] || null; }
function bkIng(arr) { return arr.map(function (i) { return { n: i.n, e: +i.e, role: i.role || 'اختياري' }; }); }
function bkApply(id, patch) {                                       // يخزّن الفرق عن الأساس فقط (أو يعدّل وجبتك المضافة مباشرة)
  var M = bkSet(); M.over = M.over || {}; M.custom = M.custom || []; var own = bkOwnCustom(id);
  if (own) Object.keys(patch).forEach(function (k) { own[k] = patch[k]; });
  else { var b0 = bkBase(id), o = M.over[id] = M.over[id] || {}; Object.keys(patch).forEach(function (k) { var a = k === 'ing' ? bkIng(patch[k]) : patch[k], c = b0 && (k === 'ing' ? bkIng(b0[k]) : b0[k]); if (b0 && JSON.stringify(a) === JSON.stringify(c)) delete o[k]; else o[k] = a; }); if (!Object.keys(o).length) delete M.over[id]; }
  saveSettings(); applyS();
}
function bkRow(b, ci) {
  var own = bkOwn(b.id), adm = bkFromAdmin(b.id), custom = !!b.custom, ing = b.ing.slice(0, 4).map(function (i) { return esc(i.n) + ' ×' + num(i.e); }).join('، ') + (b.ing.length > 4 ? ' … (+' + (b.ing.length - 4) + ')' : '');
  var badges = (b.custom ? '<span class="bkb new">مضافة</span>' : '') + (own ? '<span class="bkb own">' + (S.mode === 'admin' ? 'معدّلة' : 'معدّلة منك') + '</span>' : '') + (adm && !own ? '<span class="bkb adm">من المدير</span>' : '');
  var chips = BK_CATS.map(function (c, i) { return '<button class="bkcat ' + (b.m[i] ? 'on' : 'off') + '" data-a="bkCat" data-v="' + esc(b.id) + '|' + i + '" title="' + (b.m[i] ? 'إزالة من ' : 'إضافة إلى ') + c[1] + '" aria-pressed="' + (b.m[i] ? 'true' : 'false') + '">' + c[1] + '</button>'; }).join('');
  var mv = BK.move === b.id ? '<div class="bkmv">نقل إلى (تصبح في هذا القسم وحده): ' + BK_CATS.map(function (c, i) { return '<button class="sec sm" data-a="bkMoveTo" data-v="' + esc(b.id) + '|' + i + '">' + c[1] + '</button>'; }).join('') + '<button class="sec sm" data-a="bkMoveOpen" data-v="">إلغاء</button></div>' : '';
  var row = '<div class="bkr ' + (b.on ? 'on' : 'off') + '" data-s="' + esc(bkNorm(b.n + ' ' + b.ing.map(function (i) { return i.n; }).join(' '))) + '"><label class="bksw" title="تشغيل/إيقاف الوجبة (في كل أقسامها)"><input type="checkbox" data-bk="' + esc(b.id) + '" ' + (b.on ? 'checked' : '') + ' aria-label="تفعيل ' + esc(b.n) + '"><span class="bkknob"></span></label>'
    + '<div class="bkm"><div class="bkn"><b>' + esc(b.n) + '</b>' + badges + (b.on ? '' : '<span class="bkb off">موقوفة</span>') + '</div><div class="bkcats" aria-label="أقسام الوجبة">' + chips + '</div><small>' + ing + '</small>' + (b.note ? '<small class="bknote">' + esc(b.note) + '</small>' : '') + mv + '</div>'
    + '<div class="bkact"><button class="sec sm" data-a="bkEdit" data-v="' + esc(b.id) + '|' + ci + '" title="تحرير الوجبة">✎ تحرير</button><button class="sec sm" data-a="bkMoveOpen" data-v="' + esc(b.id) + '" title="نقل إلى قسم آخر">⇄ نقل</button>' + (own && !custom ? '<button class="sec sm bkrs" data-a="bkReset" data-v="' + esc(b.id) + '" title="استرجاع الحالة الأصلية">↺</button>' : '') + (custom ? '<button class="sec sm bkdel" data-a="bkDel" data-v="' + esc(b.id) + '" title="حذف الوجبة المضافة">🗑</button>' : '') + '</div></div>';
  return row + (BK.edit && BK.edit.id === b.id && BK.edit.cat === ci ? bkEditor() : '');
}
function bkEditor() {
  var d = BK.edit.d, base = bkBase(BK.edit.id), isCustomOwn = !!bkOwnCustom(BK.edit.id), cats = BK_CATS.map(function (c, i) { return '<label class="chk"><input type="checkbox" data-bfc="' + i + '" ' + (d.m[i] ? 'checked' : '') + '> ' + c[1] + '</label>'; }).join('');
  var ings = d.ing.map(function (i, k) { return '<tr><td><input data-bi="' + k + '" data-bf="in" list="bkfoods" value="' + esc(i.n) + '" aria-label="المكوّن"></td><td><input data-bi="' + k + '" data-bf="ie" type="number" step="0.5" min="0.5" max="20" value="' + esc(i.e) + '" aria-label="الحصص"></td><td><select data-bi="' + k + '" data-bf="ir" aria-label="الدور">' + BK_ROLES.map(function (r) { return '<option' + (r === i.role ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></td><td><button class="sec sm" data-a="bkIngDel" data-v="' + k + '" aria-label="حذف المكوّن">✕</button></td></tr>'; }).join('');
  return '<div class="bked" data-id="' + esc(BK.edit.id) + '"><div class="bkfl"><label>الاسم<input data-bf="n" value="' + esc(d.n) + '"></label><label>الوقت<input data-bf="time" dir="ltr" placeholder="14:00" value="' + esc(d.time || '') + '"></label></div><label>الملاحظة<input data-bf="note" value="' + esc(d.note || '') + '"></label>'
    + '<div class="bkcl"><b>تعمل في:</b> ' + cats + '</div><table class="bking"><tr><th>المكوّن (من قاعدة الأصناف فقط)</th><th>الحصص</th><th>الدور</th><th></th></tr>' + ings + '</table><p><button class="sec sm" data-a="bkIngAdd">＋ مكوّن</button></p>'
    + '<details class="bkadv"><summary>إعدادات متقدمة للمولّد</summary><div class="bkfl"><label>الحد الأدنى<input data-bf="min" type="number" step="1" min="0" value="' + esc(d.min) + '"></label><label>الحد الأقصى<input data-bf="max" type="number" step="1" min="0" value="' + esc(d.max) + '"></label><label>معامل التكبير<input data-bf="scal" type="number" step="0.5" min="0" value="' + esc(d.scal) + '"></label></div></details>'
    + '<div class="bkerr" id="bkerr" role="alert">' + esc(BK.edit.err || '') + '</div><div class="bkbtns"><button data-a="bkSave">💾 حفظ</button><button class="sec" data-a="bkCancel">إلغاء</button>' + (base && !isCustomOwn && bkOwn(BK.edit.id) ? '<button class="sec" data-a="bkReset" data-v="' + esc(BK.edit.id) + '">↺ استرجاع الأصل</button>' : '') + '</div></div>';
}
function bkBuilder() {
  var B = BK.b, h = '<div id="bkbuild" class="bkbuild noprint' + (B.open ? ' open' : '') + '"><button class="bkbh" data-a="bkBuildToggle" aria-expanded="' + (B.open ? 'true' : 'false') + '">✨ ابتكر وجبة جديدة <span>' + (B.open ? '–' : '＋') + '</span></button>';
  if (!B.open) return h + '</div>';
  h += '<div class="bkbb"><p class="small">الصق الوصفة (مكوّن في كل سطر: «2 شرائح خبز توست»، «100 جم عدس مطبوخ»). أحسب الحصص من وحدة الصنف في قاعدتك أو من الجرامات فقط؛ ما لا أجده يُعلَّم «يحتاج إضافة» ولا أخترعه.</p>'
    + '<textarea id="bkrt" rows="5" placeholder="مثال:&#10;2 شرائح خبز توست&#10;2 بيضة كاملة&#10;1 كوب خيار&#10;1 ملعقة صغيرة زيت زيتون">' + esc(B.text) + '</textarea><div class="bkfl"><label>اسم الوجبة<input id="bkrn" value="' + esc(B.name) + '"></label><label>الوقت (اختياري)<input id="bkrtime" dir="ltr" placeholder="08:00" value="' + esc(B.time) + '"></label></div>'
    + '<div class="bkcl"><b>تُفعَّل في:</b> ' + BK_CATS.map(function (c, i) { return '<label class="chk"><input type="checkbox" data-bbc="' + i + '" ' + (B.m[i] ? 'checked' : '') + '> ' + c[1] + '</label>'; }).join('') + '</div><p><button data-a="bkAnalyze">🔎 حلّل الوصفة</button></p>';
  if (B.rows) {
    var bl = DPRecipe.blockers(B.rows), tot = {}; DPRecipe.ingredients(B.rows).forEach(function (i) { var f = D.foods.filter(function (x) { return x.n === i.n; })[0]; if (f) tot[D.groups[f.g]] = (tot[D.groups[f.g]] || 0) + i.e; });
    h += '<table class="bkrt"><tr><th></th><th>السطر</th><th>الصنف في قاعدتك</th><th>الحصص</th><th>الدور</th><th>الحالة</th></tr>' + B.rows.map(function (r, k) {
      var st = { ok: ['جاهز', 'ok'], review: ['راجع', 'rv'], missing: ['يحتاج إضافة', 'ms'], ambiguous: ['اختر صنفاً', 'ms'], skip: ['متجاهَل', 'sk'] }[r.status] || ['', ''];
      return '<tr class="bkrr ' + st[1] + (r.include ? '' : ' exc') + '"><td><input type="checkbox" data-br="' + k + '" data-bf="inc" ' + (r.include ? 'checked' : '') + ' aria-label="ضمّ السطر"></td><td dir="rtl"><small>' + esc(r.raw) + '</small></td><td><input data-br="' + k + '" data-bf="food" list="bkfoods" value="' + esc(r.food || '') + '" placeholder="اختر صنفاً من القاعدة"></td><td><input data-br="' + k + '" data-bf="e" type="number" step="0.5" min="0.5" max="20" value="' + (r.eR === null ? '' : r.eR) + '" ' + (r.food ? '' : 'disabled') + '></td>'
        + '<td><select data-br="' + k + '" data-bf="role">' + BK_ROLES.map(function (x) { return '<option' + (x === r.role ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></td><td><span class="bkst ' + st[1] + '">' + st[0] + '</span>' + (r.reason ? '<small class="bkwhy">' + esc(r.reason) + '</small>' : '') + (r.how ? '<small class="bkhow">' + esc(r.how) + '</small>' : '')
        + (r.status === 'review' && r.include ? '<label class="chk"><input type="checkbox" data-br="' + k + '" data-bf="ok" ' + (r.confirmed ? 'checked' : '') + '> راجعتُ وأعتمد</label>' : '') + '</td></tr>';
    }).join('') + '</table><div class="bktot">' + (Object.keys(tot).length ? '<b>مجموع الحصص:</b> ' + Object.keys(tot).map(function (g) { return esc(g) + ' ' + num(tot[g]); }).join(' • ') : '<small>لا مكوّنات جاهزة بعد</small>') + '</div>'
      + '<div class="bkerr" id="bkberr" role="alert">' + (B.err ? esc(B.err) : (bl.length ? 'عوائق قبل الإضافة: ' + bl.length + ' سطراً يحتاج قراراً (اختر صنفاً، أو أدخل الحصص، أو أكّد المراجعة، أو أزل الضمّ).' : '')) + '</div><p><button data-a="bkAdd" ' + (bl.length ? 'disabled' : '') + '>➕ أضِف إلى البنك</button></p>';
  }
  return h + '</div></div>';
}
function bankPage() {
  var bank = D.bank, on = bank.filter(function (b) { return b.on; }).length, h = '<div class="bank"><h2>📖 بنك الوجبات</h2><p class="small">بنك الوجبات الذي يستعمله المولّد عند بناء الخطة. التشغيل والإيقاف والتحرير والنقل بين الأقسام تؤثر على الخطط التي <b>تُولَّد أو يُعاد توليدها بعد الآن</b> لأي عميل، ولا تغيّر خطة محفوظة.'
    + (S.mode === 'admin' ? ' تعديلاتك هنا تنتقل إلى المستخدمين مع «تصدير نسخة المستخدمين».' : ' تعديلاتك تبقى عندك، وتعديلات المدير تصلك مع ملفك، وتقدَّم تعديلاتك على تعديلاته.') + '</p>'
    + '<div class="bkbar"><input id="bq" placeholder="ابحث باسم الوجبة أو أحد مكوّناتها…" value="' + esc(BK.q) + '"><span class="small">' + bank.length + ' وجبة • مفعّلة ' + on + '</span><button class="sec sm" data-a="bkCheck">🔍 فحص جودة التوليد</button><span id="bkres" class="small" role="status"></span></div>';
  if (D._mealIssues && D._mealIssues.length) h += '<div class="warn">⚠ تعديلات وجبات مرفوضة (' + D._mealIssues.length + '): ' + esc(D._mealIssues.slice(0, 3).map(function (i) { return i.msg; }).join('، ')) + '</div>';
  BK_CATS.forEach(function (c, ci) {
    var list = bank.filter(function (b) { return b.m[ci]; }), act = list.filter(function (b) { return b.on; }).length;
    h += '<section class="bk' + (BK.open[c[0]] ? ' open' : '') + '" data-c="' + c[0] + '"><button class="bkh" data-a="bkOpen" data-v="' + c[0] + '" aria-expanded="' + (BK.open[c[0]] ? 'true' : 'false') + '"><span class="bkht">' + c[2] + ' وجبات ' + c[1] + '</span><span class="bkc">' + list.length + ' وجبة • مفعّلة ' + act + '</span><span class="bkarr">▾</span></button>'
      + (act === 0 ? '<div class="bkw">⚠ لا وجبات مفعّلة في هذا القسم: سيُركَّب الطبق من الأصناف مباشرة دون وجبة جاهزة.</div>' : '') + '<div class="bkl">' + (list.length ? list.map(function (b) { return bkRow(b, ci); }).join('') : '<p class="small">— لا وجبات في هذا القسم —</p>') + '</div></section>';
  });
  return h + '<datalist id="bkfoods">' + D.foods.filter(function (f) { return f.on !== 0; }).map(function (f) { return '<option value="' + esc(f.n) + '">'; }).join('') + '</datalist></div>' + bkBuilder();
}
function bkFilter() {
  var q = bkNorm(BK.q.trim()), root = document.querySelector('.bank'); if (!root) return;
  root.querySelectorAll('.bk').forEach(function (sec) { var any = false; sec.querySelectorAll('.bkr').forEach(function (r) { var m = !q || (r.dataset.s || '').indexOf(q) >= 0; r.classList.toggle('hide', !m); if (m) any = true; }); sec.classList.toggle('open', q ? any : !!BK.open[sec.dataset.c]); });
}
function bkAfter() { if (BK.q) bkFilter(); }
function bkBuildRender() { var el = document.getElementById('bkbuild'); if (!el) return; var tmp = document.createElement('div'); tmp.innerHTML = bkBuilder(); el.replaceWith(tmp.firstChild); }
function bkToggle(id, want) { bkApply(id, { on: want ? 1 : 0 }); main(); }
function bkDraft(b) { return { n: b.n, note: b.note || '', time: b.time || '', m: b.m.slice(), ing: bkIng(b.ing), min: b.min, max: b.max, scal: b.scal }; }
function bkSample() { return [0, 1, 2, 3].map(function (i) { return { code: 'S' + i, name: 'عينة', sex: i % 2 ? 'ذكر' : 'أنثى', age: 26 + i * 3, weight: 58 + i * 6, height: 160 + i * 3, activity: D.settings.activity[2][0], goal: D.settings.goals[i % 3], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, meals: 5, conditions: [], allergens: [], keywords: [], love: [], avoid: [], favMeals: [] }; }); }
function bkRate(cl) { var ok = 0, n = 0; cl.forEach(function (c) { for (var s = 0; s < 3; s++) { var p = E.planWeek(c, D, { seed: s }); p.days.forEach(function (d) { n++; if (d.okNominal) ok++; }); } }); return n ? Math.round(100 * ok / n) : 0; }
function bkValidate(id, d) {                                      // يعيد نص الخطأ أو '' (الوجبة المرشحة = الأصل + المسودة)
  var b = bkEff(id) || {}, cand = Object.assign({}, b, { n: String(d.n || '').trim(), note: d.note || '', time: d.time || '', m: d.m.slice(), ing: bkIng(d.ing), min: +d.min, max: +d.max, scal: +d.scal });
  if (!cand.m.some(function (x) { return x; })) return 'اختر قسماً واحداً على الأقل (أو أوقف الوجبة بدلاً من ذلك)';
  if (cand.time && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(cand.time)) return 'الوقت بصيغة 14:00';
  var dup = D.bank.filter(function (x) { return x.id !== id && bkNorm(x.n) === bkNorm(cand.n); })[0]; if (dup) return 'اسم الوجبة مستعمل لوجبة أخرى: «' + dup.n + '»';
  return E.validateMeal(D, cand) || '';
}
Object.assign(A, {
  bank: function () { S.view = S.view === 'bank' ? 'client' : 'bank'; render(); },
  bkOpen: function (v) { BK.open[v] = !BK.open[v]; try { localStorage.setItem('hissa_bank_open', JSON.stringify(BK.open)); } catch (e) { } var sec = document.querySelector('.bk[data-c="' + v + '"]'); if (sec) { sec.classList.toggle('open', BK.open[v]); sec.querySelector('.bkh').setAttribute('aria-expanded', BK.open[v] ? 'true' : 'false'); } },
  bkReset: function (id) { if (S.settings.meals && S.settings.meals.over) delete S.settings.meals.over[id]; BK.edit = null; saveSettings(); applyS(); main(); toast('عادت الوجبة إلى حالتها الأصلية'); },
  bkCat: function (v) { var a = v.split('|'), id = a[0], i = +a[1], b = bkEff(id); if (!b) return; var m = b.m.slice(); m[i] = m[i] ? 0 : 1; if (!m.some(function (x) { return x; })) { toast('لا يمكن إزالة آخر قسم؛ انقل الوجبة إلى قسم آخر أو أوقفها'); return; } bkApply(id, { m: m }); main(); },
  bkMoveOpen: function (v) { BK.move = BK.move === v || !v ? null : v; main(); },
  bkMoveTo: function (v) { var a = v.split('|'), m = [0, 0, 0, 0]; m[+a[1]] = 1; BK.move = null; bkApply(a[0], { m: m }); BK.open[BK_CATS[+a[1]][0]] = true; main(); toast('نُقلت الوجبة إلى ' + BK_CATS[+a[1]][1]); },
  bkEdit: function (v) { var a = v.split('|'), b = bkEff(a[0]); if (!b) return; BK.edit = { id: a[0], cat: +a[1], d: bkDraft(b), err: '' }; BK.move = null; main(); },
  bkCancel: function () { BK.edit = null; main(); },
  bkIngAdd: function () { if (!BK.edit) return; BK.edit.d.ing.push({ n: '', e: 1, role: 'اختياري' }); main(); },
  bkIngDel: function (k) { if (!BK.edit) return; BK.edit.d.ing.splice(+k, 1); main(); },
  bkSave: function () {
    if (!BK.edit) return; var id = BK.edit.id, d = BK.edit.d, er = bkValidate(id, d); if (er) { BK.edit.err = er; var el = document.getElementById('bkerr'); if (el) el.textContent = er; return; }
    bkApply(id, { n: String(d.n).trim(), note: d.note || '', time: d.time || '', m: d.m.slice(), ing: bkIng(d.ing), min: +d.min, max: +d.max, scal: +d.scal }); BK.edit = null; main(); toast('حُفظ تعديل الوجبة');
  },
  bkDel: function (id) { var b = bkEff(id); if (!b || !confirm('حذف الوجبة المضافة «' + b.n + '» نهائياً؟')) return; var M = bkSet(); if (bkOwnCustom(id)) M.custom = M.custom.filter(function (c) { return c.id !== id; }); else { M.deleted = M.deleted || []; if (M.deleted.indexOf(id) < 0) M.deleted.push(id); } saveSettings(); applyS(); main(); toast('حُذفت الوجبة'); },
  bkCheck: function () {
    var el = document.getElementById('bkres'); if (el) el.textContent = '… جارٍ الفحص'; setTimeout(function () {
      try { var cl = bkSample(), cur = bkRate(cl); E.applyMealSettings(D, BASEB, {}); var full = bkRate(cl); applyS();
        var msg = 'عيّنات (4 عملاء × 3 خطط): الأيام ضمن حدود الأهداف ' + cur + '% بالبنك الحالي مقابل ' + full + '% بالبنك الأصلي الكامل.';
        if (el) { el.textContent = (cur < full - 3 ? '⚠ ' + msg + ' إيقاف وجبات خفّض دقة التوليد؛ راجع مؤشر الحصص في صفحات الأيام وعدّل يدوياً.' : '✔ ' + msg + ' لا فرق يُذكر.') + ' (فحص تقريبي لعيّنات لا لعملائك)'; el.style.color = cur < full - 3 ? '#b3261e' : '#1f9d55'; } } catch (e) { applyS(); if (el) el.textContent = 'تعذّر الفحص: ' + (e && e.message || e); }
    }, 30);
  },
  bkBuildToggle: function () { BK.b.open = !BK.b.open; bkBuildRender(); },
  bkAnalyze: function () { var B = BK.b; B.text = (document.getElementById('bkrt') || {}).value || B.text; if (!B.text.trim()) { B.err = 'الصق الوصفة أولاً'; B.rows = null; bkBuildRender(); return; } B.err = ''; B.rows = DPRecipe.parse(D, B.text); if (!B.rows.length) B.err = 'لم أجد مكوّنات في النص'; bkBuildRender(); },
  bkAdd: function () {
    var B = BK.b, bl = DPRecipe.blockers(B.rows || []); B.name = (document.getElementById('bkrn') || {}).value || B.name; if (bl.length) { B.err = 'ما زالت هناك أسطر تحتاج قراراً'; bkBuildRender(); return; }
    var meal = DPRecipe.toMeal(B.rows, { id: 'U-' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), n: B.name, m: B.m, note: B.note || 'من وصفة (حصصها محسوبة من قاعدتك)', time: B.time }), er = !meal.n ? 'اكتب اسم الوجبة' : !meal.m.some(function (x) { return x; }) ? 'اختر قسماً واحداً على الأقل' : !meal.ing.length ? 'لا مكوّنات صالحة' : (D.bank.some(function (x) { return bkNorm(x.n) === bkNorm(meal.n); }) ? 'اسم الوجبة مستعمل لوجبة أخرى' : E.validateMeal(D, meal));
    if (er) { B.err = er; bkBuildRender(); return; } var M = bkSet(); M.custom = M.custom || []; M.custom.push(meal); saveSettings(); applyS();
    // بعد الإضافة يُطوى المربع العائم إلى عنوانه فلا يغطي الوجبة الجديدة في القائمة (يُفتح بنقرة لوجبة أخرى)
    BK.b = { open: false, text: '', name: '', note: '', time: '', m: B.m.slice(), rows: null, err: '' }; meal.m.forEach(function (x, i) { if (x) BK.open[BK_CATS[i][0]] = true; }); main(); toast('أُضيفت «' + meal.n + '» إلى بنك الوجبات');
  }
});
document.addEventListener('change', function (e) {
  var t = e.target, ds = t && t.dataset; if (!ds) return;
  if (ds.bk) { bkToggle(ds.bk, t.checked); return; }
  if (ds.bfc !== undefined && BK.edit) { BK.edit.d.m[+ds.bfc] = t.checked ? 1 : 0; return; }
  if (ds.bbc !== undefined) { BK.b.m[+ds.bbc] = t.checked ? 1 : 0; return; }
  if (BK.edit && ds.bf === 'ir' && ds.bi !== undefined) { var ii = BK.edit.d.ing[+ds.bi]; if (ii) ii.role = t.value; return; }
  if (ds.br !== undefined && BK.b.rows) {                                                       // جدول مراجعة الوصفة
    var r = BK.b.rows[+ds.br], f = ds.bf; if (!r) return;
    if (f === 'inc') { r.include = t.checked; r.confirmed = false; } else if (f === 'ok') { r.confirmed = t.checked; }
    else if (f === 'role') r.role = t.value;
    else if (f === 'food') { var nm = t.value.trim(); if (!nm) { r.food = null; r.status = 'missing'; r.eR = r.e = null; r.reason = 'اختر صنفاً'; } else if (!D.foods.some(function (x) { return x.n === nm; })) { r.reason = '«' + nm + '» ليس صنفاً في قاعدتك: اختر من القائمة'; r.status = 'missing'; r.food = null; r.eR = r.e = null; } else { r.fuzzy = false; r.confirmed = false; DPRecipe.resolve(D, r, nm); if (r.eR === null) r.reason = (r.reason || '') + ' • أدخل الحصص يدوياً'; } }
    else if (f === 'e') { var v = parseFloat(t.value); if (isFinite(v) && v > 0 && r.food) { DPRecipe.manual(r, v); r.status = 'ok'; r.confirmed = true; r.reason = ''; } }
    bkBuildRender();
  }
});
document.addEventListener('input', function (e) {
  var t = e.target, ds = t && t.dataset; if (!ds) return;
  if (t.id === 'bq') { BK.q = t.value; bkFilter(); return; }
  if (t.id === 'bkrt') { BK.b.text = t.value; return; } if (t.id === 'bkrn') { BK.b.name = t.value; return; } if (t.id === 'bkrtime') { BK.b.time = t.value; return; }
  if (BK.edit && ds.bf) { var d = BK.edit.d; if (ds.bi !== undefined) { var i = d.ing[+ds.bi]; if (!i) return; if (ds.bf === 'in') i.n = t.value; else if (ds.bf === 'ie') i.e = t.value; } else if (['n', 'note', 'time', 'min', 'max', 'scal'].indexOf(ds.bf) >= 0) d[ds.bf] = t.value; }
});
