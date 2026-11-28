// ================= 1.74 (م6) النوم — قرار المالك 2026-11-28: يُسجَّل في «زنها» لكل العملاء تلقائياً (الساعات والجودة)،
// وفي «زنها Pro»: بطاقة «متوسط النوم» في «نظرة عامة» بمدة نوم كل يوم (آخر 7 أيام)، وتنبيه في «من يحتاج اهتمامك اليوم؟»
// إذا كان متوسط النوم أقل من 6 ساعات في آخر 3 أيام (مسجّلة كلها). البيانات من سجل اليوم نفسه (c.hx.logs[يوم].h.sleep / sleepQ).
var SL174 = { Q: { g: 'جيد', m: 'متوسط', b: 'سيئ' }, MIN: 6, DAYS: 3 };
if (typeof HX_HB === 'object') HX_HB.sleepQ = ['🛏', function (v) { return 'نوم ' + (SL174.Q[v] || ''); }, function (v) { return v === 'g'; }];
function sl174Key(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function sl174Days(c, n) {      // آخر n أيام (الأقدم أولاً): [{k, d, h, q}]
  var L = (c && c.hx && c.hx.logs) || {}, out = [], t = new Date(); t.setHours(12, 0, 0, 0);
  for (var i = n - 1; i >= 0; i--) { var d = new Date(t.getTime() - i * 864e5), k = sl174Key(d), l = L[k], h = l && l.h ? +l.h.sleep : 0; out.push({ k: k, d: d, h: h > 0 && h < 24 ? h : 0, q: l && l.h ? l.h.sleepQ || '' : '' }); }
  return out;
}
function sl174Avg(a) { var x = a.filter(function (d) { return d.h > 0; }); return x.length ? Math.round(x.reduce(function (s, d) { return s + d.h; }, 0) / x.length * 10) / 10 : 0; }
function sl174Low(c) { var a = sl174Days(c, SL174.DAYS); return a.every(function (d) { return d.h > 0; }) && sl174Avg(a) < SL174.MIN ? sl174Avg(a) : 0; }
function sl174Card(c) {
  if (!c || !c.hx) return '';
  var a = sl174Days(c, 7), av = sl174Avg(a), n = a.filter(function (d) { return d.h > 0; }).length, short = a.filter(function (d) { return d.h > 0 && d.h < SL174.MIN; }).length, last = a.slice().reverse().filter(function (d) { return d.h > 0; })[0];
  var low = sl174Low(c), ix = (c.ix && c.ix.x_sleepH) || (c.hx.intake && c.hx.intake.cq && c.hx.intake.cq.x_sleepH);
  var day = function (d) { try { return d.toLocaleDateString('ar', { weekday: 'short' }); } catch (e) { return ''; } };
  var bars = a.map(function (d) { var tone = !d.h ? 'none' : d.h < SL174.MIN ? 'bad' : d.h < 7 ? 'warn' : d.h <= 9 ? 'ok' : 'warn';
    return '<li class="slb t-' + tone + '" title="' + esc(day(d.d) + ' ' + d.k) + '"><span class="slv"><i style="--h:' + Math.min(100, Math.round((d.h || 0) / 10 * 100)) + '%"></i></span><b>' + (d.h ? num(d.h) : '—') + '</b><small>' + esc(day(d.d)) + '</small>' + (d.q ? '<em>' + esc(SL174.Q[d.q] || '') + '</em>' : '') + '</li>'; }).join('');
  return '<section class="mxcard sl174' + (low ? ' low' : '') + '" aria-labelledby="sl174h"><div class="mxhd"><h3 id="sl174h">😴 متوسط النوم</h3><span class="slavg"><b>' + (av ? num(av) : '—') + '</b> ساعة</span></div>'
    + (low ? '<p class="warn" role="alert">⚠ متوسط آخر 3 أيام ' + num(low) + ' ساعات — أقل من ' + SL174.MIN + '.</p>' : '')
    + '<p class="small">' + (n ? 'آخر 7 أيام: ' + n + ' ليالٍ مسجّلة' + (short ? '، منها ' + short + ' أقل من ' + SL174.MIN + ' ساعات' : '') + (last ? ' • آخر ليلة ' + num(last.h) + ' ساعات' + (last.q ? ' (' + SL174.Q[last.q] + ')' : '') : '') : 'لم يسجّل العميل نومه بعد في «زنها».') + (ix ? ' • في الاستبيان: ' + num(ix) + ' ساعات' : '') + '</p>'
    + '<ol class="slbars" aria-label="مدة النوم يومياً">' + bars + '</ol></section>';
}
if (typeof mxGrid === 'function') mxGrid = (function (f) { return function (c) { var h = f.apply(this, arguments); try { return h + sl174Card(c); } catch (e) { return h; } }; })(mxGrid);
if (typeof wkItems === 'function') wkItems = (function (f) { return function () {
  var out = f.apply(this, arguments), hid = typeof wkHidden === 'function' ? wkHidden() : {};
  (S.clients || []).forEach(function (c) { if (!c.hx) return; var v = sl174Low(c), key = c.code + ':sleep'; if (v && !hid[key]) out.push({ c: c, pri: 1, ic: '😴', txt: 'نوم قليل: متوسط ' + num(v) + ' ساعات في آخر 3 أيام', tab: 'ov', key: key }); });
  return out.sort(function (a, b) { return a.pri - b.pri || String(a.c ? a.c.name : '').localeCompare(String(b.c ? b.c.name : ''), 'ar'); });
}; })(wkItems);
if (typeof WK_KIND !== 'undefined') WK_KIND.push([/^sleep$/, 'moon', 'النوم']);
