// ================= الأرقام العربية في حقول الأرقام (يعمل في كل القوالب، قبل الدخول وبعده)
// المتصفحات ترفض الأرقام العربية (٠١٢…) والفارسية (۰۱۲…) في حقول type="number" فيفرغ الحقل بصمت، وهذه لوحة الأرقام الافتراضية لكثير من الجوالات.
// لذلك يتحول كل حقل أرقام عند ظهوره إلى حقل نص بلوحة مفاتيح رقمية (inputmode) ويحمل data-num، ويُحوَّل ما يُكتب فوراً إلى أرقام لاتينية
// قبل أن تقرأه بقية الشيفرة (مستمع في مرحلة الالتقاط)، فتبقى كل الحسابات كما هي. السهمان ↑↓ يزيدان ويُنقصان بالخطوة كما في حقل الأرقام.
(function () {
  var AR = /[٠-٬۰-۹]/;
  function latin(s) {
    return String(s).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x6F0; })
      .replace(/٫/g, '.').replace(/٬/g, '');                       // ٫ فاصلة عشرية عربية، ٬ فاصل آلاف
  }
  function num(s) { return latin(s).replace(/[,،]/g, '.').replace(/[^\d.\-]/g, ''); }
  function conv(el) {
    var st = el.getAttribute('step') || '1';
    el.type = 'text'; el.dataset.num = '1'; el.setAttribute('autocomplete', 'off');
    if (!el.hasAttribute('inputmode')) el.setAttribute('inputmode', st === 'any' || st.indexOf('.') >= 0 ? 'decimal' : 'numeric');
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.tagName === 'INPUT' && root.type === 'number') conv(root);
    if (root.querySelectorAll) [].forEach.call(root.querySelectorAll('input[type="number"]'), conv);
  }
  function isTel(t) { return t.type === 'tel' || (t.dataset && t.dataset.f === 'phone'); }
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || t.tagName !== 'INPUT') return;
    var isNum = t.dataset && t.dataset.num; if (!isNum && !(isTel(t) && AR.test(t.value))) return;
    var v = t.value, n = isNum ? num(v) : latin(v); if (n === v) return;
    var p = t.selectionStart == null ? n.length : Math.max(0, t.selectionStart - (v.length - n.length));
    t.value = n; try { t.setSelectionRange(p, p); } catch (x) { }
  }, true);
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (!t || !t.dataset || !t.dataset.num || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    var st = parseFloat(t.getAttribute('step')) || 1, mn = t.getAttribute('min'), mx = t.getAttribute('max'), dec = (String(st).split('.')[1] || '').length;
    var v = (parseFloat(t.value) || 0) + (e.key === 'ArrowUp' ? st : -st);
    if (mn !== null && mn !== '' && v < +mn) v = +mn; if (mx !== null && mx !== '' && v > +mx) v = +mx;
    e.preventDefault(); t.value = v.toFixed(dec); t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true }));
  });
  function start() { scan(document.body); new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, scan); }); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.HDigits = { latin: latin, num: num };
})();
