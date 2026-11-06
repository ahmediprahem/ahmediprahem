// يولّد أيقونات «زنها» من mark.svg: node assets/zenha/make_icons.js
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const D = __dirname, OUT = path.join(D, '..', 'hissati'), svg = fs.readFileSync(path.join(D, 'mark.svg'), 'utf8'), uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const TH = { '': '#0E1440', '-rose': '#FAF6F2', '-pulse': '#0A0C0F' };
const SZ = [['icon-192', 192, .66], ['icon-512', 512, .66], ['maskable-512', 512, .52], ['apple-180', 180, .66]];
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  for (const [t, bg] of Object.entries(TH)) for (const [n, s, k] of SZ) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent('<body style="margin:0;width:' + s + 'px;height:' + s + 'px;background:' + bg + ';display:flex;align-items:center;justify-content:center"><img src="' + uri + '" style="width:' + Math.round(s * k) + 'px;margin-left:' + Math.round(s * .02) + 'px"></body>');
    await p.screenshot({ path: path.join(OUT, n + t + '.png') });
  }
  await p.setViewportSize({ width: 256, height: 256 }); await p.setContent('<body style="margin:0;width:256px;height:256px;background:#0E1440;display:flex;align-items:center;justify-content:center"><img src="' + uri + '" style="width:170px"></body>'); await p.screenshot({ path: path.join(D, 'icon-256.png') });
  await b.close(); console.log('icons ok');
})();
