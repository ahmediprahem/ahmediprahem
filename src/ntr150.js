// ================= 1.50 (طلب المالك 2026-11-27): نفس شكل 1.49 (الزجاجي) مع:
// 1) طيّ/فرد الشريط الجانبي (أيقونات فقط) بزر بجانب الشعار، ويُحفظ الاختيار على الجهاز.
// 2) طيّ/فرد قائمة المحادثات في «شات زنها» على الشاشة الواسعة.
// 3) حذف ما يكرر نفس الغرض (انظر ntr150.css وhomeGlass في shell_ui.js). وأُزيل «زيزو» من زنها Pro (شرط zzOn غير مفعّل).
function ntrOn(k) { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } }
function ntrSet(k, on) { try { localStorage.setItem(k, on ? '1' : '0'); } catch (e) { } }
(function () { var r = document.documentElement; if (ntrOn('zn_navmini')) r.classList.add('ntrmini'); if (ntrOn('zn_chmini')) r.classList.add('chmini'); })();
header = (function (f) { return function () {
  f.apply(this, arguments); var h = document.getElementById('hd'); if (!h || h.querySelector('.ntrcol')) return;
  var on = ntrOn('zn_navmini'), l = on ? 'افرد القائمة' : 'اطوِ القائمة', g = '<button class="ntrcol" data-a="navMini" aria-label="' + l + '" aria-expanded="' + !on + '" title="' + l + '">' + IC('chevron') + '</button>';
  var lg = h.querySelector('.hlogo'); if (lg) lg.insertAdjacentHTML('afterend', g); else h.insertAdjacentHTML('afterbegin', g);
}; })(header);
A.navMini = function () { var on = !ntrOn('zn_navmini'); ntrSet('zn_navmini', on); document.documentElement.classList.toggle('ntrmini', on); var b = document.querySelector('#hd .ntrcol'); if (b) { b.remove(); header(); } };
// قائمة المحادثات: زر في رأس «شات زنها»
chPage = (function (f) { return function () {
  var s = f.apply(this, arguments), on = ntrOn('zn_chmini'), l = on ? 'أظهر قائمة المحادثات' : 'اطوِ قائمة المحادثات';
  return s.replace('<div class="hxtop"><h2>', '<div class="hxtop"><button class="sec sm chcol" data-a="chMini" aria-label="' + l + '" aria-expanded="' + !on + '" title="' + l + '">' + IC('chevron') + '<span>' + (on ? 'المحادثات' : 'اطوِ') + '</span></button><h2>');
}; })(chPage);
A.chMini = function () { var on = !ntrOn('zn_chmini'); ntrSet('zn_chmini', on); document.documentElement.classList.toggle('chmini', on); main(); };
