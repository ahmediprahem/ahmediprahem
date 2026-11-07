// 0.60: ماسحات «زنها» المشتركة (تعمل داخل الصفحة): أهداف اللمس 44×44، والخط ≥ 13px، وتقاطع المستطيلات
// كل ما يُلمس ظاهراً (button, a, input, select, [data-act]) أبعاده ≥ 44؛ يُستثنى ما داخل SVG، والعلامة المائية، والرابط داخل فقرة نص
const TOUCH = (root) => {
  const out = [], R = document.querySelector(root) || document.body;
  R.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [data-act]').forEach((el) => {
    if (el.closest('svg, .wmk') || el.tagName === 'svg' || (el.tagName === 'A' && el.closest('p'))) return;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
    if (r.width < 43.5 || r.height < 43.5) out.push((el.className || el.tagName) + '[' + (el.dataset.act || '') + '] ' + Math.round(r.width) + '×' + Math.round(r.height) + ' «' + String(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24) + '»');
  });
  return out;
};
// كل عنصر فيه نص مباشر ظاهر: حجم الخط المحسوب ≥ 13 (تُستثنى نصوص SVG لأنها تتقلص مع الرسم)
const FONTS = (root) => {
  const out = [], R = document.querySelector(root) || document.body;
  R.querySelectorAll('*').forEach((el) => {
    if (el.closest('svg, .wmk, script, style, option')) return;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!own) return;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const px = parseFloat(cs.fontSize); if (px < 12.9) out.push(el.tagName.toLowerCase() + '.' + el.className + ' ' + px + 'px «' + el.textContent.trim().slice(0, 20) + '»');
  });
  return out;
};
// الأزرار الظاهرة التي يتقاطع معها مستطيل (مقصوصة بحاوي التمرير وبالشاشة)
const HITS = (sel) => {
  const t = document.querySelector(sel); if (!t) return ['لا ' + sel]; const a = t.getBoundingClientRect(), out = [];
  const clip = (el) => { let r = el.getBoundingClientRect(), x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    for (let p = el.parentElement; p; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(cs.overflowY + cs.overflowX)) { const q = p.getBoundingClientRect(); x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom); } }
    x0 = Math.max(x0, 0); y0 = Math.max(y0, 0); x1 = Math.min(x1, innerWidth); y1 = Math.min(y1, innerHeight); return x1 > x0 && y1 > y0 ? [x0, y0, x1, y1] : null; };
  document.querySelectorAll('button, a[href], input, select, textarea, [data-act], h1, h2, .who b').forEach((el) => {
    if (t.contains(el) || el.contains(t)) return; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const c = clip(el); if (!c) return; if (c[0] < a.right - 1 && c[2] > a.left + 1 && c[1] < a.bottom - 1 && c[3] > a.top + 1) out.push((el.className || el.tagName) + ' «' + String(el.textContent || '').trim().slice(0, 20) + '»');
  });
  return out;
};
module.exports = { touch: (p, root) => p.evaluate(TOUCH, root || '#root'), fonts: (p, root) => p.evaluate(FONTS, root || '#root'), hits: (p, sel) => p.evaluate(HITS, sel) };
