// ================= مؤشر الحصص العائم (صفحة اليوم) — يُدمج داخل app.js عند /*HUDUI*/
// المطلوب لليوم = day.req (ما ركّبه المخطِّط تلقائياً) أو day.counts (من المحرك)، والمتحقق = day.got (مجموع أسطر الوجبات). لا حسابات جديدة هنا: عرض فقط.
// أحمر = لم تكتمل، أخضر = اكتملت بالضبط، برتقالي = زادت عن المطلوب. المقترح لكل وجبة معلوماتي (لا يُلوَّن بالأحمر/الأخضر) لأن للأخصائي نقل الحصص بين الوجبات.
var HUD = { slot: null, page: null, min: false };
try { var hs0 = localStorage.getItem('hissa_hud_min'); HUD.min = hs0 === null ? window.innerWidth < 820 : hs0 === '1'; } catch (e) { HUD.min = window.innerWidth < 820; }
function hudData() {
  if (S.view === 'users' || S.view === 'settings' || S.view === 'bank' || S.tab !== 'plan') return null;
  var c = cur(); if (!c || c.kind === 'athlete' || !c.plan || !c.plan.days || typeof S.page !== 'number') return null;
  var d = c.plan.days[S.page]; return d ? { c: c, p: c.plan, d: d, di: S.page } : null;
}
var HUD_COLS = '<div class="hudr hudcols"><span class="hudd" style="background:transparent"></span><span class="hudn">المجموعة</span><b class="hudq">مطلوب</b><span class="huda">مطبَّق</span></div>';
function hudRow(name, color, r, g, st, neutral, fmt) {      // صف ثابت: الاسم | المطلوب (أحمر/أخضر) | المطبَّق مع الفرق
  var d = g - r, diff = st === 'ok' ? '' : '<small>' + (d < 0 ? '−' : '+') + fmt(Math.abs(d)) + '</small>';
  return '<div class="hudr ' + (neutral ? 'hf-neu ' : '') + 'hs-' + st + '"><span class="hudd" style="background:' + color + '"></span><span class="hudn">' + esc(name) + '</span><b class="hudq">' + (st === 'ok' ? '✔ ' : '') + fmt(r) + '</b><span class="huda">' + fmt(g) + diff + '</span></div>';
}
function hudRows(req, got, neutral) {
  var rows = [], done = 0, total = 0;
  for (var ci = 0; ci < req.length; ci++) {
    var r = +req[ci] || 0, g = +got[ci] || 0; if (!r && !g) continue; total++;
    var st = Math.abs(g - r) < 0.01 ? 'ok' : (g > r ? 'over' : 'low'); if (st === 'ok') done++;
    rows.push(hudRow(COLN[ci], gcol(E.COLUMNS[ci][2][0]), r, g, st, neutral, num));
  }
  return { html: rows.length ? (neutral ? HUD_COLS.replace('مطلوب', 'مقترح') : HUD_COLS) + rows.join('') : '', done: done, total: total };
}
function hudGrpData() {
  if (S.view === 'users' || S.view === 'settings' || S.view === 'bank' || S.tab !== 'plan' || S.page !== 'grp') return null;
  var c = cur(); return c && c.kind !== 'athlete' && c.plan && c.plan.base && c.plan.targets ? { c: c, p: c.plan } : null;
}
function hudGrpDraw(el, q, live) {                          // المطلوب = أهداف الماكروز، والحالي = مجموع الحصص المكتوبة (لحظياً أثناء الكتابة إن وُجد live)
  var p = q.p, T = p.targets, X = D.EX, tol = D.settings.tol, cnt = live || p.base.counts, tot = [0, 0, 0];
  for (var g = 0; g < 13; g++) { var n = +cnt[g] || 0; if (n) for (var k = 0; k < 3; k++) tot[k] += n * X[g][k]; }
  var kcal = tot[0] * 4 + tot[1] * 4 + tot[2] * 9, items = [['كربوهيدرات', T.cho, tot[0], tol[0], 0], ['بروتين', T.pro, tot[1], tol[1], 1], ['دهون', T.fat, tot[2], tol[2], 2]], ok = 0, rows = '';
  rows = HUD_COLS;
  items.forEach(function (it) {
    var d = it[2] - it[1], good = Math.abs(d) <= it[3]; if (good) ok++;
    rows += hudRow(it[0] + ' (جم)', ['#CA562F', '#2f6f4f', '#b8860b'][it[4]], it[1], it[2], good ? 'ok' : 'low', false, function (x) { return String(Math.round(x)); }).replace('<small>', '<small title="الحد المسموح ±' + it[3] + ' جم">').replace('<span class="huda">' + Math.round(it[2]) + '</span>', '<span class="huda">' + Math.round(it[2]) + (good && Math.abs(d) >= 0.5 ? '<small>' + (d < 0 ? '−' : '+') + Math.round(Math.abs(d)) + '</small>' : '') + '</span>');
  });
  rows += hudRow('السعرات (للعلم)', '#7a7f99', T.kcal, kcal, 'ok', true, function (x) { return String(Math.round(x)); }).replace('✔ ', '');
  var all = ok === 3;
  el.className = 'hud noprint' + (HUD.min ? ' hf-min' : '') + (all ? ' hf-done' : '');
  el.innerHTML = '<div class="hudh"><span class="hudt" title="اسحب لتحريك المؤشر • نقر مزدوج لإعادته">⠿ هدف التوزيع اليومي</span><span class="huddy">الأيام كلها</span><button class="hudbtn" data-a="hudToggle" aria-label="' + (HUD.min ? 'توسيع' : 'تصغير') + '">' + (HUD.min ? '▢' : '–') + '</button></div>'
    + '<div class="hudsum hs-' + (all ? 'ok' : 'low') + '">' + (all ? '✔ التوزيع يحقق الأهداف' : 'خارج الحد: ' + (3 - ok) + ' من 3 أهداف') + '</div><div class="hudb">' + rows + '</div>';
}
function hudRender(live) {
  try {
    var el = document.getElementById('hud'), q = hudData(), gq = q ? null : hudGrpData();
    if (!q && !gq) { if (el) el.style.display = 'none'; return; }
    if (!el) { el = document.createElement('div'); el.id = 'hud'; el.className = 'hud noprint'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-label', 'مؤشر الحصص المطلوبة لليوم'); document.body.appendChild(el); }
    el.style.display = ''; hudApplyPos(el);
    if (gq) { hudGrpDraw(el, gq, live); return; }
    if (HUD.page !== q.di) { HUD.page = q.di; HUD.slot = null; }
    var d = q.d, p = q.p, day = hudRows(E.colCounts(d.req || d.counts), E.colCounts(d.got), false), k = HUD.slot != null && d.slots[HUD.slot] ? HUD.slot : null, allDone = day.total > 0 && day.done === day.total;
    var chips = d.slots.map(function (s, i) { return '<button class="hudchip' + (i === k ? ' hf-sel' : '') + '" data-a="hudMeal" data-v="' + i + '">' + esc(mealNm(p, s)) + '</button>'; }).join('');
    var meal = '';
    if (k !== null) { var s = d.slots[k], m = hudRows(E.colCounts(s.req || s.target || new Array(13).fill(0)), E.colCounts(E.actualGroups(s)), true); meal = '<div class="hudmt">المقترح لـ«' + esc(mealNm(p, s)) + '»' + (m.total && m.done === m.total ? ' <span class="hudok">✔ مطابق</span>' : '') + '</div>' + (m.html || '<small>— لا حصص مقترحة —</small>'); }
    el.className = 'hud noprint' + (HUD.min ? ' hf-min' : '') + (allDone ? ' hf-done' : '');
    el.innerHTML = '<div class="hudh"><span class="hudt" title="اسحب لتحريك المؤشر • نقر مزدوج لإعادته">⠿ هدف الحصص اليوم</span><span class="huddy">' + esc(dayName(p, q.di)) + '</span><button class="hudbtn" data-a="hudToggle" aria-label="' + (HUD.min ? 'توسيع' : 'تصغير') + '">' + (HUD.min ? '▢' : '–') + '</button></div>'
      + hudHealth() + '<div class="hudsum hs-' + (allDone ? 'ok' : 'low') + '">' + (allDone ? '✔ اكتمل اليوم' : 'اكتملت ' + day.done + ' من ' + day.total + ' مجموعة') + '</div>'
      + '<div class="hudb">' + (day.html || '<small>— لا حصص مطلوبة —</small>') + (d.short && d.short.length ? '<div class="hudwarn">⚠ لم تتسع ' + d.short.map(function (x) { return num(x[1]) + ' من ' + esc(D.groups[x[0]]); }).join('، ') + ' في سقوف الوجبات</div>' : '') + '</div>'
      + '<div class="hudc"><div class="hudcl">الوجبة (اضغط لعرض المقترح):</div><div class="hudchips">' + chips + '</div>' + meal + '</div>';
  } catch (e) { var x = document.getElementById('hud'); if (x) x.style.display = 'none'; }
}

(function () {                                           // سحب المؤشر بعيداً عن الجدول (حاسوب فقط): يُحفظ الموضع، والنقر المزدوج على الترويسة يعيده
  var st = null, key = 'hissa_hud_pos';
  function clamp(el, x, y) { return [Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, x)), Math.max(4, Math.min(window.innerHeight - 60, y))]; }
  window.hudApplyPos = function (el) { if (window.innerWidth < 820) { el.style.left = el.style.top = ''; return; } try { var s = localStorage.getItem(key); if (!s) { el.style.left = el.style.top = ''; return; } var a = s.split(','), c = clamp(el, +a[0], +a[1]); el.style.left = c[0] + 'px'; el.style.top = c[1] + 'px'; } catch (e) { } };
  document.addEventListener('pointerdown', function (e) { var h = e.target.closest && e.target.closest('#hud .hudh'); if (!h || e.target.closest('.hudbtn') || window.innerWidth < 820) return; var el = document.getElementById('hud'), r = el.getBoundingClientRect(); st = { dx: e.clientX - r.left, dy: e.clientY - r.top }; h.setPointerCapture && h.setPointerCapture(e.pointerId); e.preventDefault(); });
  document.addEventListener('pointermove', function (e) { if (!st) return; var el = document.getElementById('hud'), c = clamp(el, e.clientX - st.dx, e.clientY - st.dy); el.style.left = c[0] + 'px'; el.style.top = c[1] + 'px'; });
  document.addEventListener('pointerup', function () { if (!st) return; st = null; var el = document.getElementById('hud'); try { localStorage.setItem(key, parseInt(el.style.left, 10) + ',' + parseInt(el.style.top, 10)); } catch (e) { } });
  document.addEventListener('dblclick', function (e) { if (e.target.closest && e.target.closest('#hud .hudh') && !e.target.closest('.hudbtn')) { try { localStorage.removeItem(key); } catch (x) { } var el = document.getElementById('hud'); if (el) hudApplyPos(el); } });
})();
Object.assign(A, {
  hudToggle: function () { HUD.min = !HUD.min; try { localStorage.setItem('hissa_hud_min', HUD.min ? '1' : '0'); } catch (e) { } hudRender(); },
  hudMeal: function (v) { HUD.slot = HUD.slot === +v ? null : +v; HUD.min = false; hudRender(); }
});
document.addEventListener('input', function (e) {         // صفحة تقسيم الحصص: المؤشر يتحدّث مع كل رقم تكتبه قبل أن يُعتمد
  var t = e.target; if (S.page !== 'grp' || !t || !t.dataset || t.dataset.g === undefined || !t.classList.contains('n')) return;
  var cnt = new Array(13).fill(0); document.querySelectorAll('table.gt input.n[data-g]').forEach(function (i) { cnt[+i.dataset.g] = +i.value || 0; }); hudRender(cnt);
});
document.addEventListener('focusin', function (e) {                // المؤشر يتبع الوجبة التي تعدّلها
  var t = e.target, ds = t && t.dataset; if (!ds) return; var v = ds.cell || ds.le || ''; if (!v) return; var a = v.split(','); if (+a[0] === HUD.page && +a[1] !== HUD.slot) { HUD.slot = +a[1]; hudRender(); }
});

// ---- 0.50: الحالة الصحية للعميل في المؤشر الجانبي (يتذكرها الأخصائي وهو يعدّل الخطة)
function hudHealth() { var c = cur(); if (!c) return ''; var a = (c.conditions || []).concat((c.allergens || []).map(function (x) { return 'حساسية: ' + x; })); return a.length ? '<div class="hudhl" title="الحالة الصحية للعميل">🩺 ' + esc(a.join(' • ')) + '</div>' : ''; }
