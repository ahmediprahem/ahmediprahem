/* مُصدِّر Word (.docx) داخل المتصفح بلا مكتبات: يبني الصفحات التسع (الملخص، تقسيم الحصص، 7 أيام) بجداول RTL ثم يكتب ملف ZIP (بلا ضغط). */
(function (root) {
  'use strict';
  var C = { o: 'CA562F', g: '3A7F53', y: 'E9CD46', n: '253464', w: 'FFFFFF' }, enc = new TextEncoder(), TIER = { 3: '🔴', 2: '🟠', 1: '🟢', 0: '' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
  var num = function (x) { x = +x || 0; return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(1); };
  // ---------------- عناصر XML (بترتيب عناصر المخطط)
  function run(t, o) { o = o || {}; var sz = Math.round((o.sz || 10) * 2); return '<w:r><w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:eastAsia="Tahoma" w:cs="Tahoma"/>' + (o.b ? '<w:b/><w:bCs/>' : '') + (o.c ? '<w:color w:val="' + o.c + '"/>' : '') + '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/><w:rtl/></w:rPr><w:t xml:space="preserve">' + esc(t) + '</w:t></w:r>'; }
  function par(content, o) { o = o || {}; return '<w:p><w:pPr>' + (o.pb ? '<w:pageBreakBefore/>' : '') + (o.shd ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shd + '"/>' : '') + '<w:bidi/><w:spacing w:before="' + Math.round((o.before || 0) * 20) + '" w:after="' + Math.round((o.after || 0) * 20) + '"' + (o.line ? ' w:line="' + Math.round(o.line * 20) + '" w:lineRule="exact"' : '') + '/>' + (o.al ? '<w:jc w:val="' + o.al + '"/>' : '') + '</w:pPr>' + (content || '') + '</w:p>'; }
  function tc(w, content, o) {
    o = o || {}; var b = o.bsz == null ? 24 : o.bsz, mt = o.mt == null ? 40 : o.mt;
    return '<w:tc><w:tcPr><w:tcW w:w="' + Math.round(w * 567) + '" w:type="dxa"/>' + (o.span ? '<w:gridSpan w:val="' + o.span + '"/>' : '') + (o.vm ? '<w:vMerge' + (o.vm === 'r' ? ' w:val="restart"' : '') + '/>' : '')
      + '<w:tcBorders>' + ['top', 'left', 'bottom', 'right'].map(function (s) { return '<w:' + s + ' w:val="single" w:sz="' + b + '" w:space="0" w:color="' + (o.bc || 'FFFFFF') + '"/>'; }).join('') + '</w:tcBorders>' + (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : '')
      + '<w:tcMar><w:top w:w="' + mt + '" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="' + mt + '" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar><w:vAlign w:val="' + (o.va || 'center') + '"/></w:tcPr>' + (content || par('')) + '</w:tc>';
  }
  var cell = function (w, text, fill, color, sz, bold, o) { o = o || {}; o.fill = fill; return tc(w, par(run(text, { sz: sz || 10, b: bold !== false, c: color || C.w }), { al: o.al || 'center' }), o); };
  function tr(cells, h) { return '<w:tr><w:trPr><w:cantSplit/>' + (h ? '<w:trHeight w:val="' + Math.round(h * 567) + '" w:hRule="atLeast"/>' : '') + '</w:trPr>' + cells.join('') + '</w:tr>'; }
  function tbl(widths, rows) { var tw = widths.reduce(function (a, b) { return a + b; }, 0); return '<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="' + Math.round(tw * 567) + '" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>' + widths.map(function (w) { return '<w:gridCol w:w="' + Math.round(w * 567) + '"/>'; }).join('') + '</w:tblGrid>' + rows.join('') + '</w:tbl>'; }
  var gap = function (pt) { return par('', { line: pt || 4 }); };
  var sect = function (t) { return par(run(t, { sz: 12, b: 1, c: C.g }), { before: 4, after: 2 }); };
  // ---------------- أسماء معدّلة
  var dayName = function (p, i, D) { return (p.names && p.names.day && p.names.day[i]) || D.days[i]; }, mealName = function (p, s) { return (p.names && p.names.meal && p.names.meal[s.si]) || s.name; };
  var picN = 0;
  function logoRun(br) {
    if (!br || !br.logoBytes) return ''; var h = 324000, w = Math.round(h * br.logoW / br.logoH), id = ++picN;
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + w + '" cy="' + h + '"/><wp:docPr id="' + id + '" name="logo' + id + '"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + id + '" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + w + '" cy="' + h + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }
  function header(title, sub, phr, br, first) {
    var right = par(run(title, { sz: 20, b: 1, c: C.g })) + (sub ? par(run(sub, { sz: 10, c: C.n })) : '') + par('', { line: 5, shd: C.y }) + (phr ? par(run(phr, { sz: 9, b: 1, c: C.o }), { before: 1 }) : ''),
      left = (br.logoBytes ? par(logoRun(br), { al: 'right' }) : '') + par(run(br.clinic || '', { sz: 9, b: 1, c: C.n }), { al: 'right' }) + (br.specialist ? par(run('الأخصائي: ' + br.specialist, { sz: 8.5, c: C.n }), { al: 'right' }) : par(''));
    return (first ? '' : par('', { pb: 1, line: 1 })) + tbl([13.2, 5.4], [tr([tc(13.2, right, { bsz: 0, mt: 0 }), tc(5.4, left, { bsz: 0, mt: 0 })])]);
  }
  function orange(day, kcal) {
    var t = day ? ['• لتحصل على نتائج التزامك تناول الحصص المعطاة بدون زيادة ليصبح مجموعها ' + Math.round(kcal) + ' سعرة حرارية في اليوم.', '• يمكنك استبدال الحصص من جدول البدائل مع الحفاظ على عدد الحصص المحسوب لكل وجبة.'] : ['• يمكنك استبدال الحصص من جدول البدائل، واحرص أن يكون عدد الحصص مطابقاً للمحسوب لكل وجبة.', '• البدائل في الجداول محسوبة على عدد الحصص في النظام الغذائي.'];
    return tbl([18.6], [tr([tc(18.6, t.map(function (x) { return par(run(x, { sz: 8.5, b: 1, c: C.w })); }).join(''), { fill: C.o, bsz: 0, mt: 60 })])]);
  }
  var tip = function (t) { return t ? tbl([18.6], [tr([tc(18.6, par(run(t, { sz: 10, b: 1, c: C.n })), { fill: C.y, bsz: 0, mt: 70 })])]) : ''; };
  // ---------------- الصفحات
  function pgSum(c, p, D, E, br) {
    var T = p.targets, f = [['الاسم', c.name, 'الكود', c.code], ['العمر', c.age, 'الجنس', c.sex], ['الوزن (كجم)', c.weight, 'الطول (سم)', c.height], ['مؤشر كتلة الجسم', T.bmi.toFixed(1), 'مستوى النشاط', c.activity], ['الهدف', c.goal, 'الحالة الصحية', (c.conditions || []).join('، ') || 'جيدة']];
    var h = header('نظامك الغذائي', 'الأسبوع الأول', p.phr[0][0], br, true) + gap(4) + sect('بيانات العميل');
    h += tbl([3.5, 5.8, 3.5, 5.8], f.map(function (r) { return tr([cell(3.5, r[0], C.g, C.w, 9.5), cell(5.8, String(r[1]), C.w, C.n, 10, true, { bc: C.g, bsz: 6 }), cell(3.5, r[2], C.g, C.w, 9.5), cell(5.8, String(r[3]), C.w, C.n, 10, true, { bc: C.g, bsz: 6 })], 0.58); }));
    h += gap(3) + sect('الماكروز اليومية — ' + Math.round(T.kcal) + ' سعرة') + tbl([6.2, 6.2, 6.2], [tr([cell(6.2, 'كربوهيدرات', C.y, C.n, 11), cell(6.2, 'بروتين', C.y, C.n, 11), cell(6.2, 'دهون', C.y, C.n, 11)], 0.6), tr([cell(6.2, Math.round(T.cho * 4 / T.kcal * 100) + '% • ' + Math.round(T.cho) + ' جم', C.n), cell(6.2, Math.round(T.pro * 4 / T.kcal * 100) + '% • ' + Math.round(T.pro) + ' جم', C.n), cell(6.2, Math.round(T.fat * 9 / T.kcal * 100) + '% • ' + Math.round(T.fat) + ' جم', C.n)], 0.7)]);
    var sl = E.slots(p.meals, D).filter(function (s) { return s.active; });
    h += gap(3) + sect('تقسيم السعرات على الوجبات') + tbl([4.65, 4.65, 4.65, 4.65], [tr([cell(4.65, 'الوجبة', C.o, C.w, 10), cell(4.65, 'الموعد', C.y, C.n, 10), cell(4.65, 'النسبة', C.g, C.w, 10), cell(4.65, 'السعرات', C.n, C.w, 10)], 0.52)].concat(sl.map(function (s) {
      var tm = (p.days[0].slots.filter(function (x) { return x.si === s.i; })[0] || {}).time || D.times[s.i];
      return tr([cell(4.65, (p.names && p.names.meal && p.names.meal[s.i]) || s.name, C.o, C.w, 10), cell(4.65, tm, C.w, C.n, 10, true, { bc: C.n, bsz: 6 }), cell(4.65, Math.round(s.pct * 100) + '%', C.y, C.n, 10), cell(4.65, Math.round(T.kcal * s.pct) + ' سعرة', C.w, C.n, 10, true, { bc: C.n, bsz: 6 })], 0.52);
    })));
    var w8 = (18.6 - 2.6) / 8;
    h += gap(3) + sect('تقسيم الحصص على أيام الأسبوع') + tbl([2.6].concat(new Array(8).fill(w8)), [tr([cell(2.6, 'اليوم', C.o, C.w, 9.5)].concat(E.POOLED.map(function (q) { return cell(w8, q[1], C.y, C.n, 9); })), 0.5)].concat(p.days.map(function (d, i) {
      return tr([cell(2.6, dayName(p, i, D), C.g, C.w, 9.5)].concat(E.pooled(d.got).map(function (x) { return cell(w8, x ? num(x) : '', C.w, C.n, 10, true, { bc: C.n, bsz: 6 }); })), 0.5);
    })));
    return h + gap(3) + orange(false, T.kcal) + gap(3) + tip(p.phr[0][1]);
  }
  var GR = [['نشويات', null, [0]], ['بقوليات', null, [1]], ['لحوم', ['شديدة الانخفاض بالدهون', 'قليلة الدهون', 'متوسطة الدهون', 'عالية الدهون'], [2, 3, 4, 5]], ['ألبان', ['خالي الدسم', 'قليل الدسم', 'كامل الدسم'], [6, 7, 8]], ['خضروات غير نشوية', null, [9]], ['فواكه', null, [10]], ['دهون', null, [11]], ['أخرى', null, [12]]];
  var colOf = function (E, br, key) { return String(((br && br.colors && br.colors[key]) || E.DEFAULT_COLORS[key] || C.o)).replace('#', ''); };
  function pgGrp(c, p, D, E, br) {
    var T = p.targets, X = D.EX, W = [3.1, 4.3, 2.2, 2.6, 2.0, 2.0, 2.4], tot = [0, 0, 0, 0, 0], rows = [], tol = D.settings.tol;
    rows.push(tr([cell(7.4, 'المجموعات الغذائية', C.n, C.w, 10.5, true, { span: 2 }), cell(2.2, 'عدد الحصص', C.y, C.n, 10), cell(2.6, 'كربوهيدرات', C.g, C.w, 10), cell(2.0, 'بروتين', C.g, C.w, 10), cell(2.0, 'دهون', C.g, C.w, 10), cell(2.4, 'السعرات', C.n, C.w, 10)], 0.6));
    GR.forEach(function (r) {
      r[2].forEach(function (g, i) {
        var n = +p.base.counts[g] || 0, m = [n * X[g][0], n * X[g][1], n * X[g][2], n * X[g][3]]; for (var k = 0; k < 4; k++) tot[k] += m[k]; tot[4] += n; var cs = [];
        if (r[1]) { var gc = colOf(E, br, E.groupKey(r[2][0])); cs.push(i === 0 ? cell(3.1, r[0], gc, C.w, 11, true, { vm: 'r' }) : tc(3.1, par(''), { vm: 'c', fill: gc })); cs.push(cell(4.3, r[1][i], C.g, C.w, 9.5)); } else cs.push(cell(7.4, r[0], colOf(E, br, E.groupKey(r[2][0])), C.w, 11, true, { span: 2 }));
        cs.push(cell(2.2, n ? num(n) : '', C.y, C.n, 11)); [m[0], m[1], m[2]].forEach(function (x, j) { cs.push(cell(W[3 + j], n ? num(x) : '', C.w, C.n, 10, false, { bc: C.n, bsz: 6 })); }); cs.push(cell(2.4, n ? String(Math.round(m[3])) : '', C.w, C.n, 10, false, { bc: C.n, bsz: 6 })); rows.push(tr(cs, r[2].length === 1 ? 0.85 : 0.7));
      });
    });
    rows.push(tr([cell(7.4, 'الإجمالي', C.n, C.w, 11, true, { span: 2 }), cell(2.2, num(tot[4]), C.n, C.w, 11), cell(2.6, String(Math.round(tot[0])), C.n, C.w, 11), cell(2.0, String(Math.round(tot[1])), C.n, C.w, 11), cell(2.0, String(Math.round(tot[2])), C.n, C.w, 11), cell(2.4, String(Math.round(tot[0] * 4 + tot[1] * 4 + tot[2] * 9)), C.n, C.w, 11)], 0.9));
    var d = [tot[0] - T.cho, tot[1] - T.pro, tot[2] - T.fat], bad = Math.abs(d[0]) > tol[0] || Math.abs(d[1]) > tol[1] || Math.abs(d[2]) > tol[2];
    return header('تقسيم الحصص', Math.round(T.kcal) + ' سعرة حرارية يومياً', p.phr[1][0], br) + gap(4) + par(run('التزم بعدد الحصص المحدد لكل مجموعة يومياً لتصل إلى هدفك.', { sz: 10, b: 1, c: C.n }), { after: 4 })
      + tbl(W, rows)  + orange(false, T.kcal) + gap(4) + tip(p.phr[1][1]);
  }
  function pgDay(c, p, di, D, E, br) {
    var T = p.targets, d = p.days[di], ph = p.phr[2 + di], c11 = E.colCounts(d.got), W = [2.0].concat(new Array(11).fill(0.93), [6.37]), rows = [], est = 0, K = function (k) { return colOf(E, br, k); };
    var typ = ['starch', 'legumes', 'meat', 'meat', 'meat', 'meat', 'milk', 'veg', 'fruit', 'other', 'fat'], sub = ['قليلة جداً', 'قليلة', 'متوسطة', 'عالية'], cl = function (w, txt, k, sz, o) { return cell(w, txt, K(k), C.w, sz, true, Object.assign({ mt: 30 }, o || {})); };
    rows.push(tr([cell(2.0, 'الوجبة', C.n, C.w, 10.5, true, { vm: 'r' }), cell(10.23, 'المجموعات الغذائية', C.n, C.w, 10.5, true, { span: 11 }), cell(6.37, 'مكونات الوجبة', C.n, C.w, 10.5, true, { vm: 'r' })], 0.6));
    rows.push(tr([tc(2.0, par(''), { vm: 'c', fill: C.n }), cl(0.93, 'نشويات', 'starch', 7.5, { vm: 'r' }), cl(0.93, 'بقوليات', 'legumes', 7.5, { vm: 'r' }), cl(3.72, 'لحوم (حسب نسبة الدهون)', 'meat', 8, { span: 4 }), cl(0.93, 'ألبان', 'milk', 7.5, { vm: 'r' }), cl(0.93, 'خضار', 'veg', 7.5, { vm: 'r' }), cl(0.93, 'فاكهة', 'fruit', 7.5, { vm: 'r' }), cl(0.93, 'أخرى', 'other', 7.5, { vm: 'r' }), cl(0.93, 'دهون', 'fat', 7.5, { vm: 'r' }), tc(6.37, par(''), { vm: 'c', fill: C.n })], 0.6));
    rows.push(tr([tc(2.0, par(''), { vm: 'c', fill: C.n }), tc(0.93, par(''), { vm: 'c', fill: K('starch') }), tc(0.93, par(''), { vm: 'c', fill: K('legumes') })].concat(sub.map(function (x) { return cl(0.93, x, 'meat', 6.5); }), [tc(0.93, par(''), { vm: 'c', fill: K('milk') }), tc(0.93, par(''), { vm: 'c', fill: K('veg') }), tc(0.93, par(''), { vm: 'c', fill: K('fruit') }), tc(0.93, par(''), { vm: 'c', fill: K('other') }), tc(0.93, par(''), { vm: 'c', fill: K('fat') }), tc(6.37, par(''), { vm: 'c', fill: C.n })]), 0.5));
    rows.push(tr([cell(2.0, 'الإجمالي', C.g, C.w, 9.5)].concat(c11.map(function (x) { return cell(0.93, x ? num(x) : '', C.y, C.n, 10, true, { mt: 30 }); }), [cell(6.37, 'مجموع اليوم: ' + Math.round(d.nominal[0] * 4 + d.nominal[1] * 4 + d.nominal[2] * 9) + ' سعرة', C.g, C.w, 9)]), 0.6));
    var pre = 0; d.slots.forEach(function (s) { pre += Math.max(1.2, 0.42 * (s.lines.length + ((s.mealLabel || s.meal) ? 1 : 0)) + 0.15); });
    var lvl = pre <= 11 ? 0 : (pre <= 14 ? 1 : 2), CF = [8.5, 8, 7.5][lvl], CL = [11, 10, 9][lvl], RF = [0.42, 0.37, 0.33][lvl];          // تكثيف تلقائي للأيام ذات الأسطر الكثيرة
    d.slots.forEach(function (s) {
      var a8 = E.colCounts(E.actualGroups(s)), dish = s.mealLabel || s.meal, comp = (dish ? par(run(dish, { sz: CF, b: 1, c: C.o }), { line: CL }) : '') + s.lines.map(function (l) { return par(run('•  ' + (TIER[l.tier || 0] ? TIER[l.tier || 0] + ' ' : '') + (l.label || l.text), { sz: CF, c: C.n }), { line: CL }); }).join(''), nl = s.lines.length + (dish ? 1 : 0);
      rows.push(tr([tc(2.0, par(run(mealName(p, s), { sz: 10.5, b: 1, c: C.w }), { al: 'center' }) + (s.time ? par(run(s.time, { sz: 8, c: C.w }), { al: 'center' }) : ''), { fill: C.o })].concat(a8.map(function (x) { return cell(0.93, x ? num(x) : '', C.w, C.n, 10, true, { bc: C.n, bsz: 6, mt: 30 }); }), [tc(6.37, comp || par(''), { bc: C.n, bsz: 6, mt: 30 })]), Math.max(1.0, RF * nl + 0.15))); est += Math.max(1.0, RF * nl + 0.15);
    });
    var n = lvl === 0 ? (est <= 9.5 ? 5 : (est <= 11 ? 4 : 3)) : (lvl === 1 ? 3 : 2), alts = E.altTable(p, di, D, n), alt = '';
    if (alts.length) {
      alt += sect('جدول البدائل — كل بديل يساوي حصة واحدة');
      for (var b = 0; b < alts.length; b += 3) {
        var part = alts.slice(b, b + 3), nr = Math.max.apply(null, part.map(function (x) { return x[1].length; })), r2 = [tr([0, 1, 2].map(function (ci) { return part[ci] ? cell(6.2, part[ci][0], colOf(E, br, E.POOLED.filter(function (q) { return q[1] === part[ci][0]; })[0][0]), C.w, 9.5) : tc(6.2, par(''), { bsz: 0 }); }), 0.42)];
        for (var ri = 0; ri < nr; ri++) r2.push(tr([0, 1, 2].map(function (ci) { return part[ci] ? cell(6.2, part[ci][1][ri] ? ((TIER[part[ci][1][ri].tier || 0] ? TIER[part[ci][1][ri].tier || 0] + ' ' : '') + part[ci][1][ri].text) : '', C.w, C.n, 8, false, { bc: C.n, bsz: 6, al: 'start', mt: 10 }) : tc(6.2, par(''), { bsz: 0 }); }), 0.4));
        alt += tbl([6.2, 6.2, 6.2], r2) + gap(3);
      }
    }
    return header(dayName(p, di, D), 'اليوم ' + (di + 1) + ' من 7  •  ' + Math.round(T.kcal) + ' سعرة حرارية', ph[0], br) + gap(3) + '' + tbl(W, rows) + gap(3) + tip(ph[1]) + gap(3) + alt;
  }
  // ---------------- ZIP بلا ضغط
  var CT = (function () { var t = new Uint32Array(256); for (var i = 0; i < 256; i++) { var c = i; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var parts = [], central = [], off = 0, total = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length, body = f.comp || f.data, csz = body.length, mth = f.comp ? 8 : 0, lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, mth, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, csz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, mth, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, csz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      parts.push(new Uint8Array(lh.buffer), nm, body); central.push(new Uint8Array(ch.buffer), nm); off += 30 + nm.length + csz;
    });
    var csz = central.reduce(function (a, b) { return a + b.length; }, 0), end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csz, true); end.setUint32(16, off, true);
    var all = parts.concat(central, [new Uint8Array(end.buffer)]); all.forEach(function (a) { total += a.length; }); var out = new Uint8Array(total), p = 0; all.forEach(function (a) { out.set(a, p); p += a.length; }); return out;
  }
  var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

  // ---------------- صفحات الرياضيين
  function athSum(c, p, AD, br) {
    var T = p.T, info = [['الاسم', c.name, 'الكود', c.code], ['العمر', c.age, 'الجنس', c.sex], ['الوزن (كجم)', c.weight, 'الطول (سم)', c.height], ['الرياضة', c.sport || '—', 'نسبة الدهون', c.bf ? c.bf + '%' : '—'], ['المرحلة', c.phase, 'BMR', Math.round(T.bmr) + ' (' + T.method + ')']];
    var h = header('خطتك الغذائية', c.phase, p.phr[0][0], br, true) + gap(4) + sect('بيانات العميل') + tbl([3.5, 5.8, 3.5, 5.8], info.map(function (r) { return tr([cell(3.5, r[0], C.g, C.w, 9.5), cell(5.8, String(r[1]), C.w, C.n, 10, true, { bc: C.g, bsz: 6 }), cell(3.5, r[2], C.g, C.w, 9.5), cell(5.8, String(r[3]), C.w, C.n, 10, true, { bc: C.g, bsz: 6 })], 0.58); }));
    var W = [2.6, 5.2, 2.2, 2.2, 2.2, 2.2, 2.0];
    h += gap(3) + sect('أهدافك اليومية بالجرام') + tbl(W, [tr([cell(2.6, 'اليوم', C.o, C.w, 9.5), cell(5.2, 'النوع', C.n, C.w, 9.5), cell(2.2, 'سعرات', C.g, C.w, 9.5), cell(2.2, 'بروتين', C.y, C.n, 9.5), cell(2.2, 'كارب', C.y, C.n, 9.5), cell(2.2, 'دهون', C.y, C.n, 9.5), cell(2.0, 'ماء (ل)', C.g, C.w, 9)], 0.52)].concat(T.days.map(function (d, i) {
      return tr([cell(2.6, dayName(p, i, AD), C.g, C.w, 9.5), cell(5.2, d.type + (d.min ? ' • ' + d.min + 'د' + (d.time ? ' (' + d.time + ')' : '') : ''), C.w, C.n, 9.5, true, { bc: C.n, bsz: 6 })].concat([d.kcal, d.p, d.c, d.f].map(function (x, k) { return cell(W[2 + k], String(Math.round(x)), C.w, C.n, 10, true, { bc: C.n, bsz: 6 }); }), [cell(2.0, d.water.toFixed(1), C.w, C.n, 10, true, { bc: C.n, bsz: 6 })]), 0.5);
    })));
    var box = function (title, arr, fill) { return arr && arr.length ? gap(3) + tbl([18.6], [tr([tc(18.6, par(run(title, { sz: 9, b: 1, c: C.w })) + arr.map(function (x) { return par(run('• ' + x, { sz: 8.5, b: 1, c: C.w })); }).join(''), { fill: fill, bsz: 0, mt: 60 })])]) : ''; };
    return h + box('ماذا تتوقع:', p.expect, C.o) + box('تنبيهات:', p.warn, '8A3A1E') + gap(3) + tip(p.phr[0][1]);
  }
  function athDay(c, p, di, AD, br) {
    var d = p.days[di], t = d.t, ph = p.phr[1 + di], g = d.got, nrows = 0, defOf = function (it) { return br.hmDef ? br.hmDef(it.hm, it.n) : ''; }, nameLen = function (it) { return ((it.label || it.n) + (stShow(it.st) ? ' (' + stShow(it.st) + ')' : '') + ' ' + defOf(it)).length; }; d.meals.forEach(function (m) { nrows += m.items.length + 3; m.items.forEach(function (it) { if (nameLen(it) > 58) nrows += 0.7; }); });
    var lvl = nrows <= 36 ? 0 : (nrows <= 44 ? 1 : 2), FS = [9, 8.5, 8][lvl], RH = [0.5, 0.44, 0.4][lvl], W = [9.2, 1.8, 1.8, 1.9, 1.9, 2.0];
    var h = header(dayName(p, di, AD), t.type + (t.min ? ' • ' + t.min + ' دقيقة' : '') + ' • ' + Math.round(t.kcal) + ' سعرة', ph[0], br) + gap(3);
    h += tbl([3.72, 3.72, 3.72, 3.72, 3.72], [tr([['سعرات', g.k, t.kcal], ['بروتين', g.p, t.p], ['كارب', g.c, t.c], ['دهون', g.f, t.f]].map(function (x, k) { return cell(3.72, x[0] + ': ' + Math.round(x[1]) + ' / ' + Math.round(x[2]), [C.n, C.o, C.g, '#B8960C'.replace('#', '')][k], C.w, 9.5, true, { mt: 40 }); }).concat([cell(3.72, 'ماء: ' + t.water.toFixed(1) + ' ل', '4A90D9', C.w, 9.5, true, { mt: 40 })]), 0.6)]);
    d.meals.forEach(function (m) {
      var tot = { k: 0, p: 0, c: 0, f: 0, g: 0 }; m.items.forEach(function (it) { tot.k += it.k; tot.p += it.p; tot.c += it.c; tot.f += it.f; tot.g += it.g; });
      var nm = (p.names && p.names.meal && p.names.meal[m.si]) || m.name;
      var rows = [tr([cell(9.2, nm + (m.time ? '  ' + m.time : ''), C.o, C.w, FS + 1, true, { al: 'start' }), cell(9.4, 'الهدف: بروتين ' + Math.round(m.target.p) + ' • كارب ' + Math.round(m.target.c) + ' • دهون ' + Math.round(m.target.f), C.o, C.w, FS - 0.5, false, { span: 5 })], RH + 0.05),
        tr([cell(9.2, 'الصنف (مقدار الحصة)', C.n, C.w, FS), cell(1.8, 'جرام', C.n, C.w, FS), cell(1.8, 'سعرات', C.n, C.w, FS), cell(1.9, 'بروتين', C.y, C.n, FS), cell(1.9, 'كارب', C.y, C.n, FS), cell(2.0, 'دهون', C.y, C.n, FS)], RH)];
      m.items.forEach(function (it) { var df = defOf(it), nameP = par(run('•  ' + (it.label || it.n) + (stShow(it.st) ? ' (' + stShow(it.st) + ')' : ''), { sz: FS, c: C.n }) + (df ? run('  ' + df, { sz: FS - 1.5, c: '6B7288' }) : '')); rows.push(tr([tc(9.2, nameP, { bc: C.n, bsz: 6 }), cell(1.8, String(it.g), C.w, C.n, FS, true, { bc: C.n, bsz: 6 }), cell(1.8, String(Math.round(it.k)), C.w, C.n, FS, false, { bc: C.n, bsz: 6 }), cell(1.9, it.p.toFixed(1), C.w, C.n, FS, false, { bc: C.n, bsz: 6 }), cell(1.9, it.c.toFixed(1), C.w, C.n, FS, false, { bc: C.n, bsz: 6 }), cell(2.0, it.f.toFixed(1), C.w, C.n, FS, false, { bc: C.n, bsz: 6 })], RH)); });
      rows.push(tr([cell(9.2, 'مجموع الوجبة', C.g, C.w, FS, true), cell(1.8, String(Math.round(tot.g)), C.g, C.w, FS), cell(1.8, String(Math.round(tot.k)), C.g, C.w, FS), cell(1.9, tot.p.toFixed(1), C.g, C.w, FS), cell(1.9, tot.c.toFixed(1), C.g, C.w, FS), cell(2.0, tot.f.toFixed(1), C.g, C.w, FS)], RH));
      h += gap(3) + tbl(W, rows);
    });
    return h + gap(3) + tip(ph[1]);
  }
  function prep(br) {
    br = br || {}; if (br.logo && /^data:image\/png;base64,/.test(br.logo)) { try { var bin = atob(br.logo.split(',')[1]), u8 = new Uint8Array(bin.length); for (var q = 0; q < bin.length; q++) u8[q] = bin.charCodeAt(q); br = Object.assign({}, br, { logoBytes: u8, logoW: ((u8[16] << 24) | (u8[17] << 16) | (u8[18] << 8) | u8[19]) >>> 0, logoH: ((u8[20] << 24) | (u8[21] << 16) | (u8[22] << 8) | u8[23]) >>> 0 }); if (!(br.logoW > 0 && br.logoH > 0)) br.logoBytes = null; } catch (e) { br.logoBytes = null; } }
    return br;
  }
  var stShow = function (s) { s = String(s == null ? '' : s).trim(); return /^(غير محدد|غير معروف|غير مصنّف)$/.test(s) ? '' : s; };
  async function deflate(u8) { var s = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate-raw')); return new Uint8Array(await new Response(s).arrayBuffer()); }
  function assemble(body, br) {
      var sectPr = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="454" w:right="680" w:bottom="624" w:left="680" w:header="284" w:footer="284" w:gutter="0"/><w:bidi/></w:sectPr>';
      var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + body + sectPr + '</w:body></w:document>';
      var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + NS + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:eastAsia="Tahoma" w:cs="Tahoma"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="ar-SA" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
      var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';
      var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
      var drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' + (br.logoBytes ? '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : '') + '</Relationships>';
      return ([{ name: '[Content_Types].xml', data: enc.encode(ct) }, { name: '_rels/.rels', data: enc.encode(rels) }, { name: 'word/document.xml', data: enc.encode(doc) }, { name: 'word/styles.xml', data: enc.encode(styles) }, { name: 'word/_rels/document.xml.rels', data: enc.encode(drels) }].concat(br.logoBytes ? [{ name: 'word/media/logo.png', data: br.logoBytes }] : []));
  }
  var finish = async function (files) { if (typeof CompressionStream !== 'undefined') for (var i = 0; i < files.length; i++) if (!/\.png$/.test(files[i].name)) files[i].comp = await deflate(files[i].data); return zip(files); };
  root.DPDocx = {
    build: function (c, p, D, E, br) {
      br = prep(br || {}); picN = 0; var body = pgSum(c, p, D, E, br) + pgGrp(c, p, D, E, br); for (var i = 0; i < 7; i++) body += pgDay(c, p, i, D, E, br); return zip(assemble(body, br));
    },
    buildAthlete: function (c, p, AD, br) {
      br = prep(br || {}); picN = 0; var body = athSum(c, p, AD, br); for (var i = 0; i < 7; i++) body += athDay(c, p, i, AD, br); return zip(assemble(body, br));
    },
    // نسخ غير متزامنة بضغط deflate (حجم الملف ~12 مرة أصغر: مناسب للمشاركة عبر الجوال)
    zipAsync: function (files) { return finish(files); },   // ZIP عام (مضغوط): يستعمله تصدير «موقع للنشر»
    buildAsync: function (c, p, D, E, br) { br = prep(br || {}); picN = 0; var body = pgSum(c, p, D, E, br) + pgGrp(c, p, D, E, br); for (var i = 0; i < 7; i++) body += pgDay(c, p, i, D, E, br); return finish(assemble(body, br)); },
    buildAthleteAsync: function (c, p, AD, br) { br = prep(br || {}); picN = 0; var body = athSum(c, p, AD, br); for (var i = 0; i < 7; i++) body += athDay(c, p, i, AD, br); return finish(assemble(body, br)); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.DPDocx;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
