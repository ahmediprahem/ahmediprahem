// يولّد أيقونات «زن برو» (للأخصائي) من assets/zenha/pro_mark.svg: node assets/zenhapro/make_icons.js
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const D = __dirname, svg = fs.readFileSync(path.join(D, '..', 'zenha', 'pro_mark.svg'), 'utf8'), uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const SZ = [['icon-192', 192, .66], ['icon-512', 512, .66], ['maskable-512', 512, .52], ['apple-180', 180, .66]];
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  for (const [n, s, k] of SZ) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent('<body style="margin:0;width:' + s + 'px;height:' + s + 'px;background:#0E1440;display:flex;align-items:center;justify-content:center"><img src="' + uri + '" style="width:' + Math.round(s * k) + 'px"></body>');
    await p.screenshot({ path: path.join(D, n + '.png') });
  }
  await b.close(); console.log('pro icons ok');
})();
