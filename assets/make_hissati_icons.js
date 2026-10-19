// أيقونات تثبيت «حصتي» من المتصفح (PWA): node assets/make_hissati_icons.js  ← assets/hissati/*.png (تُضمَّن في المحطة عند البناء)
// 192 و512 (عادية بحواف مستديرة)، 512 «maskable» (أندرويد يقصّها دائرة/مربعاً: الشعار داخل المنطقة الآمنة 80%)، و180 لآيفون (مربعة؛ iOS يدوّرها بنفسه).
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const A = (p) => path.join(__dirname, p), mark = fs.readFileSync(A('hissa_mark.svg'), 'utf8').trim().replace(/currentColor/g, '#fff');
const uri = 'data:image/svg+xml;base64,' + Buffer.from(mark).toString('base64');
const bg = 'radial-gradient(70% 60% at 30% 25%,#2d4a9a 0%,transparent 70%),radial-gradient(60% 55% at 75% 85%,#1f6f6a 0%,transparent 70%),linear-gradient(160deg,#1d2c63,#101a40)';
const tile = (s, r, w) => `<div style="width:${s}px;height:${s}px;border-radius:${r}px;background:${bg};display:grid;place-items:center"><img src="${uri}" style="width:${w}%"></div>`;
const jobs = [['icon-192.png', 192, tile(192, 42, 66), true], ['icon-512.png', 512, tile(512, 112, 66), true], ['maskable-512.png', 512, tile(512, 0, 50), false], ['apple-180.png', 180, tile(180, 0, 64), false]];
(async () => {
  const b = await chromium.launch();
  for (const [f, s, html, tr] of jobs) { const p = await b.newPage({ viewport: { width: s, height: s } }); await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`); await p.waitForTimeout(50); await p.screenshot({ path: A('hissati/' + f), omitBackground: tr }); await p.close(); console.log('✔', f); }
  await b.close();
})();
