'use strict';
// تباين الزجاج في ثيمي «وردة» و«نبض»: الأسطح شبه الشفافة تُركَّب فوق أسوأ نقاط الخلفية (الأساس + كل توهّج)، ويُقاس تباين النص (WCAG 2.2) عليها.
const assert = require('assert'), fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '../src/hissati'), T = fs.readFileSync(path.join(dir, 'themes.css'), 'utf8'), G = fs.readFileSync(path.join(dir, 'themes_glass.css'), 'utf8');
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 400)); process.exitCode = 1; } };
const block = (css, theme) => { const m = new RegExp('(?:^|\\n)\\[data-theme="' + theme + '"\\]\\{([^}]*)\\}', 'g'); let out = '', x; while ((x = m.exec(css))) out += x[1] + ';'; return out; };
const v = (blk, name) => { const m = new RegExp('--' + name + ':\\s*([^;]+?)\\s*(?:;|$)', 'm').exec(blk); if (!m) throw new Error('متغير مفقود: ' + name); return m[1].trim(); };
const col = (s) => { s = s.trim(); let m = /^#([0-9a-f]{6})$/i.exec(s); if (m) { const h = m[1]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]; } m = /^rgba?\(([^)]+)\)$/.exec(s); if (m) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; } throw new Error('لون غير مفهوم: ' + s); };
const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat([1]); };
const lum = (c) => { const f = (x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
const cr = (a, b) => { const A = lum(a), B = lum(b), hi = Math.max(A, B), lo = Math.min(A, B); return (hi + .05) / (lo + .05); };
const CFG = { rose: { base: ['#FBF7F3', '#F5ECE6'], dark: false }, pulse: { base: ['#0B0E12', '#08090B'], dark: true } };
for (const th of Object.keys(CFG)) {
  const tb = block(T, th), gb = block(G, th), g = (k) => col(v(gb, 'hx-g-' + k)), c = (k) => col(v(tb, 'hx-' + k));
  // نقاط الخلفية: لونا الأساس + كل توهّج فوق كل أساس، وتوهّجان فوق بعضهما (أسوأ تراكم عند التقاء التوهّجات)
  const glows = ['glow1', 'glow2', 'glow3'].map((k) => g(k)), samples = [];
  CFG[th].base.forEach((b) => { const B = col(b); samples.push(B); glows.forEach((gl) => samples.push(over(gl, B))); glows.forEach((g1) => glows.forEach((g2) => { if (g1 !== g2) samples.push(over(g1, over(g2, B))); })); });
  const worst = (surf, fg, min, label) => { let w = 99, at = ''; samples.forEach((s) => { const bg = over(surf, s), r = cr(over(fg, bg), bg); if (r < w) { w = r; at = bg.slice(0, 3).map(Math.round).join(','); } }); assert(w >= min, th + ' ' + label + ' ' + w.toFixed(2) + ' < ' + min + ' على ' + at); return w; };
  t(th + ': النص الأساسي والثانوي والتسميات والرابط على البطاقة الزجاجية (فوق أسوأ خلفية) ≥ المطلوب', () => {
    const r = [worst(g('card'), c('text'), 7, 'text'), worst(g('card'), c('text-2'), 4.5, 'text-2'), worst(g('card'), c('text-3'), 4.5, 'text-3'), worst(g('card'), c('accent-text'), 4.5, 'accent-text'), worst(g('card'), c('ok-text'), 4.5, 'ok-text'), worst(g('card'), c('err-text'), 4.5, 'err-text')];
    console.log('   ', r.map((x) => x.toFixed(1)).join(' | '));
  });
  t(th + ': شريط التبويب والورقة والاحتفال والمفاتيح الزجاجية: النص مقروء', () => {
    worst(g('bar'), c('text'), 7, 'tabbar text'); worst(g('bar'), c('text-2'), 4.5, 'tabbar text-2'); worst(g('sheet'), c('text'), 7, 'sheet text'); worst(g('sheet'), c('text-2'), 4.5, 'sheet text-2'); worst(g('sheet'), c('text-3'), 4.5, 'sheet text-3');
    worst(g('card2'), c('text'), 7, 'cel text'); worst(g('key'), c('text'), 7, 'key text');
  });
  t(th + ': الإشعار الزجاجي: نصه وأيقونته مقروءان', () => { const toast = col(v(tb, 'hx-toast-text')); worst(g('pop'), toast, 7, 'toast text'); worst(g('pop'), col(v(tb, 'hx-toast-icon')), 3, 'toast icon'); });
  t(th + ': زجاج فوق محتوى يمرّ تحته (أسوأ حالة: بطاقة داكنة/فاتحة تحت الشريط)', () => {
    const under = over(g('card'), samples[0]);               // محتوى البطاقة تحت الشريط
    const bg = over(g('bar'), under); assert(cr(c('text'), bg) >= 7 && cr(c('text-2'), bg) >= 4.5, th + ' ' + cr(c('text-2'), bg).toFixed(2));
    const hot = CFG[th].dark ? [255, 255, 255, 1] : [0, 0, 0, 1]; const bg2 = over(g('bar'), hot);       // أقسى مفاجأة: صورة بيضاء/سوداء تحت الشريط
    console.log('    نص الشريط فوق الأقسى:', cr(c('text-2'), bg2).toFixed(2), '(معلومة، لا شرط: التمويه 22px يخفّف التباين الموضعي)');
  });
}
t('بلا دعم الشفافية أو مع «تقليل الشفافية» تعود الأسطح صلبة (قاعدة موجودة)', () => { assert(/prefers-reduced-transparency:reduce/.test(G) && /@supports \(\(-webkit-backdrop-filter:blur\(1px\)\) or \(backdrop-filter:blur\(1px\)\)\)/.test(G)); });
console.log('\nنجح', n, 'اختبارات تباين الزجاج');
