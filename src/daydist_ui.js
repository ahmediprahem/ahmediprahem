// ================= توزيع الحصص على الأيام (يُدمج داخل app.js عند /*DAYSUI*/)
// الأساس: p.days[d].counts هو المطلوب لليوم d. التعديل لكل يوم يُحفظ في العميل (c.dayCounts[d]) فيبقى عند إعادة التوليد.
// التطبيق يُعيد بناء وجبات الأيام المعدَّلة فقط (E.regenDay) ويترك بقية الأيام حرفياً، وتُحفظ نسخة كاملة قبل التنفيذ.
var GD = { code: null, gen: null, draft: {} };
function gdArr(p, d) { return GD.draft[d] || p.days[d].counts.map(Number); }
function gdChanged(p, d) { return !!GD.draft[d] && JSON.stringify(GD.draft[d]) !== JSON.stringify(p.days[d].counts.map(Number)); }
function gdValid(arr) { return arr.length === 13 && arr.every(function (x) { return isFinite(x) && x >= 0 && Math.abs(x * 2 - Math.round(x * 2)) < 1e-9; }) && arr.reduce(function (a, b) { return a + b; }, 0) > 0; }
function gdTot(arr) { var t = [0, 0, 0]; for (var g = 0; g < 13; g++) for (var k = 0; k < 3; k++) t[k] += (+arr[g] || 0) * D.EX[g][k]; return t; }
function gdHasManual(day) { return !!(day.edited || day.slots.some(function (s) { return s.edited || s.lines.some(function (l) { return l.manual; }); })); }
function gdStatus(tot, T) { var tol = D.settings.tol, d = [tot[0] - T.cho, tot[1] - T.pro, tot[2] - T.fat]; return { d: d, ok: Math.abs(d[0]) <= tol[0] && Math.abs(d[1]) <= tol[1] && Math.abs(d[2]) <= tol[2] }; }
function dayDistHtml(c, p) {
  if (GD.code !== c.code || GD.gen !== p.generated) { GD.code = c.code; GD.gen = p.generated; GD.draft = {}; }
  var T = p.targets, days = p.days, caps = days.map(function (_, d) { try { return E.dayCaps(p, d, D); } catch (e) { return []; } }), nCh = days.filter(function (_, d) { return gdChanged(p, d); }).length;
  var head = '<tr><th class="gdn">المجموعة</th>' + days.map(function (dy, i) { var custom = dy.custom || (c.dayCounts && c.dayCounts[i]); return '<th class="gdh' + (gdChanged(p, i) ? ' chg' : '') + '" id="gdh-' + i + '">' + esc(D.days[i]) + (custom ? '<small class="gdc">⭐ مخصّص</small>' : '') + '<small class="gdc gdm">' + (gdChanged(p, i) ? '• معدَّل' : '') + '</small><button class="sec sm gdr" data-a="dgReset" data-v="' + i + '" title="إرجاع هذا اليوم إلى التوزيع الأساسي (مسودة حتى تضغط تطبيق)">↺</button></th>'; }).join('') + '</tr>', rows = '';
  GR.forEach(function (r) { r[2].forEach(function (g, i) { rows += '<tr><td class="gdn"><i class="gdd" style="background:' + gcol(g) + '"></i>' + esc(r[1] ? r[0] + ' — ' + r[1][i] : r[0]) + '</td>' + days.map(function (dy, di) { var v = gdArr(p, di)[g], over = caps[di][g] !== undefined && v > caps[di][g]; return '<td><input class="n gdi' + (over ? ' over' : '') + '" type="number" step="0.5" min="0" data-dg="' + di + ',' + g + '" value="' + num(v) + '" aria-label="' + esc(D.days[di] + ' — ' + (r[1] ? r[1][i] : r[0])) + '"' + (over ? ' title="أعلى من الحد المتاح لهذا اليوم (' + num(caps[di][g]) + '): قد لا يتسع كله"' : '') + '></td>'; }).join('') + '</tr>'; }); });
  var foot = [['كربوهيدرات', 0, T.cho], ['بروتين', 1, T.pro], ['دهون', 2, T.fat]].map(function (m) { return '<tr class="gdf"><td class="gdn"><b>' + m[0] + ' (جم)</b> — الهدف ' + Math.round(m[2]) + '</td>' + days.map(function (_, di) { var t = gdTot(gdArr(p, di)); return '<td id="gdt-' + di + '-' + m[1] + '">' + Math.round(t[m[1]]) + '</td>'; }).join('') + '</tr>'; }).join('') + '<tr class="gdf"><td class="gdn"><b>الحالة</b></td>' + days.map(function (_, di) { var st = gdStatus(gdTot(gdArr(p, di)), T); return '<td id="gds-' + di + '" class="' + (st.ok ? 'gd-ok' : 'gd-bad') + '">' + (st.ok ? '✔ ضمن الحدود' : '⚠ خارج الحدود') + '</td>'; }).join('') + '</tr>';
  var short = days.map(function (dy, i) { return (dy.short && dy.short.length) ? D.days[i] + ': ' + dy.short.map(function (x) { return num(x[1]) + ' من «' + D.groups[x[0]] + '»'; }).join('، ') : ''; }).filter(Boolean);
  return '<div class="gdw noprint" id="gdm"><h3>🗓 توزيع الحصص على الأيام</h3><p class="small">عدّل عدد حصص أي مجموعة في أي يوم (مثلاً كربوهيدرات أكثر في أيام التدريب). الأرقام الموضوعة هنا مسودة حتى تضغط «تطبيق»؛ يُعاد بناء وجبات <b>الأيام المعدَّلة فقط</b>، وتبقى بقية الأيام كما هي، وتُحفظ نسخة قبل التنفيذ. تبقى هذه التوزيعات عند «إعادة توليد» الخطة، وتُلغى بـ«طبّق هذا التوزيع على الأيام السبعة» أو «عودة للاقتراح التلقائي». عدد الحصص الأعلى من الحد المتاح لليوم (يظهر بالبرتقالي) لا يُوضَع كله في الوجبات.</p>'
    + '<div class="gdscroll"><table class="gdt">' + head + rows + foot + '</table></div>' + (short.length ? '<div class="gdwarn" role="status">⚠ حصص لم تتسع في سقوف الوجبات: ' + esc(short.join(' • ')) + '</div>' : '')
    + '<p class="gdbtns"><button class="o" data-a="dgApply" id="gdapply" ' + (nCh ? '' : 'disabled') + '>✅ طبّق على الأيام المعدَّلة (<span id="gdn">' + nCh + '</span>)</button> <button class="sec" data-a="dgCancel" ' + (nCh ? '' : 'disabled') + ' id="gdcancel">إلغاء المسودة</button> <button class="sec" data-a="dgBaseAll">↺ كل الأيام إلى الأساسي (مسودة)</button></p>'
    + '<p class="gdbtns small">نسخ توزيع يوم إلى بقية الأيام (مسودة): <select id="gdsrc">' + days.map(function (_, i) { return '<option value="' + i + '">' + esc(D.days[i]) + '</option>'; }).join('') + '</select> <button class="sec sm" data-a="dgCopy">انسخه إلى كل الأيام</button></p></div>';
}
function gdRefresh(d) {                                           // تحديث لحظي لعمود يوم واحد أثناء الكتابة (بلا إعادة رسم، فلا يضيع المؤشر)
  var c = cur(), p = c && c.plan; if (!p) return; var arr = gdArr(p, d), tot = gdTot(arr), st = gdStatus(tot, p.targets), ch = gdChanged(p, d), caps; try { caps = E.dayCaps(p, d, D); } catch (e) { caps = []; }
  for (var k = 0; k < 3; k++) { var el = document.getElementById('gdt-' + d + '-' + k); if (el) el.textContent = Math.round(tot[k]); }
  var s = document.getElementById('gds-' + d); if (s) { s.textContent = st.ok ? '✔ ضمن الحدود' : '⚠ خارج الحدود'; s.className = st.ok ? 'gd-ok' : 'gd-bad'; }
  var h = document.getElementById('gdh-' + d); if (h) { h.classList.toggle('chg', ch); var m = h.querySelector('.gdm'); if (m) m.textContent = ch ? '• معدَّل' : ''; }
  document.querySelectorAll('input[data-dg^="' + d + ',"]').forEach(function (i) { var g = +i.dataset.dg.split(',')[1], v = parseFloat(i.value), bad = !isFinite(v) || v < 0 || Math.abs(v * 2 - Math.round(v * 2)) > 1e-9; var ov = !bad && caps[g] !== undefined && v > caps[g]; i.classList.toggle('over', ov); i.classList.toggle('bad', bad); if (ov) i.title = 'أعلى من الحد المتاح لهذا اليوم (' + num(caps[g]) + '): قد لا يتسع كله'; else if (bad) i.title = 'اكتب رقماً بمضاعفات 0.5'; else i.removeAttribute('title'); });
  var n = p.days.filter(function (_, i) { return gdChanged(p, i); }).length, nn = document.getElementById('gdn'); if (nn) nn.textContent = n; var ab = document.getElementById('gdapply'), cb = document.getElementById('gdcancel'); if (ab) ab.disabled = !n; if (cb) cb.disabled = !n;
}
Object.assign(A, {
  dgReset: function (d) { var c = cur(), p = c.plan; GD.draft[+d] = p.base.counts.map(Number); main(); },
  dgBaseAll: function () { var c = cur(), p = c.plan; p.days.forEach(function (_, d) { GD.draft[d] = p.base.counts.map(Number); }); main(); },
  dgCancel: function () { GD.draft = {}; main(); },
  dgCopy: function () { var c = cur(), p = c.plan, s = +(document.getElementById('gdsrc') || {}).value || 0, src = gdArr(p, s).slice(); p.days.forEach(function (_, d) { if (d !== s) GD.draft[d] = src.slice(); }); main(); toast('نُسخ توزيع ' + D.days[s] + ' كمسودة لبقية الأيام (لم يُطبَّق بعد)'); },
  dgApply: function () {
    var c = cur(), p = c.plan, ch = []; p.days.forEach(function (_, d) { if (gdChanged(p, d)) ch.push(d); }); if (!ch.length) { toast('لا تعديلات غير مطبّقة'); return; }
    for (var i = 0; i < ch.length; i++) if (!gdValid(GD.draft[ch[i]])) { toast(D.days[ch[i]] + ': أعداد الحصص يجب أن تكون بمضاعفات 0.5 وغير سالبة ومجموعها أكبر من صفر'); return; }
    var nm = function (d) { return D.days[d]; }, man = ch.filter(function (d) { return gdHasManual(p.days[d]); });
    if (man.length && !confirm('سيُعاد بناء وجبات: ' + ch.map(nm).join('، ') + '.\nتعديلاتك اليدوية على وجبات (' + man.map(nm).join('، ') + ') ستُستبدل بوجبات جديدة. تُحفظ نسخة كاملة قبل التنفيذ ويمكنك استرجاعها من «الإصدارات».\nمتابعة؟')) return;
    var old = JSON.parse(JSON.stringify(c.plan)), oldDC = c.dayCounts ? JSON.parse(JSON.stringify(c.dayCounts)) : null;
    dbPut('versions', { code: c.code, at: Date.now(), note: 'قبل تعديل توزيع الحصص على الأيام: ' + ch.map(nm).join('، '), plan: old, client: ec(c) }).then(function () {
      try { ch.forEach(function (d) { E.regenDay(c.plan, d, GD.draft[d], D); }); c.dayCounts = c.dayCounts || {}; ch.forEach(function (d) { var a = GD.draft[d].map(Number); if (JSON.stringify(a) === JSON.stringify(c.plan.base.counts.map(Number))) delete c.dayCounts[d]; else c.dayCounts[d] = a; }); if (!Object.keys(c.dayCounts).length) delete c.dayCounts; }
      catch (e) { c.plan = old; if (oldDC) c.dayCounts = oldDC; else delete c.dayCounts; GD.draft = {}; main(); toast('تعذّر تطبيق التوزيع ولم يتغير شيء: ' + (e && e.message || e)); return; }
      var sh = ch.filter(function (d) { return c.plan.days[d].short && c.plan.days[d].short.length; }); GD.draft = {}; save(); if (typeof loadVersions === 'function') try { loadVersions(); } catch (e) { } main();
      toast('طُبِّق توزيع الحصص على: ' + ch.map(nm).join('، ') + (sh.length ? ' — ⚠ لم تتسع بعض الحصص في ' + sh.map(nm).join('، ') : ''));
    }).catch(function (e) { toast('تعذّر حفظ النسخة الاحتياطية فلم يُنفَّذ شيء: ' + (e && e.message || e)); });
  }
});
document.addEventListener('input', function (e) {
  var t = e.target; if (!t || !t.dataset || t.dataset.dg === undefined) return; var a = t.dataset.dg.split(',').map(Number), d = a[0], g = a[1], c = cur(); if (!c || !c.plan) return;
  var arr = GD.draft[d] = (GD.draft[d] || c.plan.days[d].counts.map(Number).slice()); var v = parseFloat(t.value); arr[g] = isFinite(v) ? v : NaN; gdRefresh(d);
});
