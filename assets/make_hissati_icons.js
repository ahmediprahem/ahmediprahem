// أيقونات تثبيت «حصتي» من المتصفح (PWA) لكل ثيم: node assets/make_hissati_icons.js  ← assets/hissati/*.png (تُضمَّن في المحطة عند البناء)
// لكل ثيم (الحالي، وردة، نبض): 192 و512 (عادية بحواف مستديرة)، 512 «maskable» (أندرويد يقصّها دائرة/مربعاً: الشعار داخل المنطقة الآمنة 80%)، و180 لآيفون (مربعة؛ iOS يدوّرها بنفسه).
// الحالي: icon-192.png … • وردة: icon-192-rose.png … • نبض: icon-192-pulse.png …
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const A = (p) => path.join(__dirname, p), raw = fs.readFileSync(A('hissa_mark.svg'), 'utf8').trim();
const THEMES = {
  '': { mark: '#ffffff', bg: 'radial-gradient(70% 60% at 30% 25%,#2d4a9a 0%,transparent 70%),radial-gradient(60% 55% at 75% 85%,#1f6f6a 0%,transparent 70%),linear-gradient(160deg,#1d2c63,#101a40)', fx: '' },
  '-rose': { mark: '#A3456A', bg: 'radial-gradient(60% 50% at 82% 12%,#F3C7D4 0%,transparent 70%),radial-gradient(55% 45% at 10% 95%,#CFE0D3 0%,transparent 72%),linear-gradient(165deg,#FFF9F5,#F4E4E3)', fx: 'drop-shadow(0 3px 6px rgba(122,40,72,.28))' },
  '-pulse': { mark: '#D2FF3A', bg: 'radial-gradient(60% 50% at 85% 8%,rgba(210,255,58,.22) 0%,transparent 70%),linear-gradient(165deg,#161B21,#0A0C0F)', fx: 'drop-shadow(0 0 10px rgba(210,255,58,.45))' }
};
const sizes = [['icon-192', 192, 42, 66, true], ['icon-512', 512, 112, 66, true], ['maskable-512', 512, 0, 50, false], ['apple-180', 180, 0, 64, false]];
(async () => {
  const b = await chromium.launch();
  for (const [suf, th] of Object.entries(THEMES)) {
    const uri = 'data:image/svg+xml;base64,' + Buffer.from(raw.replace(/currentColor/g, th.mark)).toString('base64');
    for (const [name, s, r, w, tr] of sizes) {
      const html = `<div style="width:${s}px;height:${s}px;border-radius:${r}px;background:${th.bg};display:grid;place-items:center;position:relative;overflow:hidden"><i style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,${suf === '-pulse' ? .06 : suf === '-rose' ? .5 : .1}),transparent 45%)"></i><img src="${uri}" style="position:relative;width:${w}%;filter:${th.fx || 'none'}"></div>`;
      const p = await b.newPage({ viewport: { width: s, height: s } }); await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`); await p.waitForTimeout(60);
      await p.screenshot({ path: A('hissati/' + name + suf + '.png'), omitBackground: tr }); await p.close(); console.log('✔', name + suf + '.png');
    }
  }
  await b.close();
})();
