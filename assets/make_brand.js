// يبني كل صور الهوية من الشعار المتجهي (assets/hissa_logo.svg و assets/hissa_mark.svg) ويعيد كتابة src/assets.js:
//   node assets/make_brand.js        (يحتاج Playwright/Chromium — المثبَّت للاختبارات)
// المخرجات: logo_light.png (كحلي لصفحات الخطة وWord) | logo_dark.png (أبيض للخلفيات الداكنة) | logo_icon.png (أيقونة التبويب)
//           native/assets/* (أيقونة التطبيق وشاشة البداية) | src/assets.js (PNG للتصدير + SVG خام للواجهة يتلوّن بـ currentColor)
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const H = path.join(__dirname, '..'), A = (p) => path.join(__dirname, p), NAVY = '#1d2c63', NAVY_D = '#101a40';
const logo = fs.readFileSync(A('hissa_logo.svg'), 'utf8').trim(), mark = fs.readFileSync(A('hissa_mark.svg'), 'utf8').trim();
const tint = (svg, c) => svg.replace(/currentColor/g, c), uri = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const bg = `radial-gradient(70% 60% at 30% 25%,#2d4a9a 0%,transparent 70%),radial-gradient(60% 55% at 75% 85%,#1f6f6a 0%,transparent 70%),linear-gradient(160deg,${NAVY},${NAVY_D})`;
const jobs = [                                                      // [ملف, عرض, ارتفاع, HTML, شفاف؟]
  ['assets/logo_light.png', 1200, 472, `<img src="${uri(tint(logo, NAVY))}" style="width:100%">`, true],
  ['assets/logo_dark.png', 1200, 472, `<img src="${uri(tint(logo, '#fff'))}" style="width:100%">`, true],
  ['assets/logo_icon.png', 256, 256, `<div style="width:256px;height:256px;border-radius:58px;background:${bg};display:grid;place-items:center"><img src="${uri(tint(mark, '#fff'))}" style="width:72%"></div>`, true],
  ['native/assets/icon-only.png', 1024, 1024, `<div style="width:1024px;height:1024px;background:${bg};display:grid;place-items:center"><img src="${uri(tint(mark, '#fff'))}" style="width:66%"></div>`, false],
  ['native/assets/icon-foreground.png', 1024, 1024, `<div style="width:1024px;height:1024px;display:grid;place-items:center"><img src="${uri(tint(mark, '#fff'))}" style="width:52%"></div>`, true],
  ['native/assets/icon-background.png', 1024, 1024, `<div style="width:1024px;height:1024px;background:${bg}"></div>`, false],
  ['native/assets/splash.png', 2732, 2732, `<div style="width:2732px;height:2732px;background:${bg};display:grid;place-items:center"><img src="${uri(tint(logo, '#fff'))}" style="width:1100px"></div>`, false],
  ['native/assets/splash-dark.png', 2732, 2732, `<div style="width:2732px;height:2732px;background:${bg};display:grid;place-items:center"><img src="${uri(tint(logo, '#fff'))}" style="width:1100px"></div>`, false],
];
(async () => {
  const b = await chromium.launch();
  for (const [f, w, h, html, transparent] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${html}</body></html>`); await p.waitForTimeout(50);
    await p.screenshot({ path: path.join(H, f), omitBackground: transparent }); await p.close(); console.log('✔', f);
  }
  await b.close();
  const png = (f) => 'data:image/png;base64,' + fs.readFileSync(A(f)).toString('base64');
  const js = '// يُولَّد بـ node assets/make_brand.js — لا تعدّله يدوياً\n' +
    'window.ASSETS={light:' + JSON.stringify(png('logo_light.png')) + ',dark:' + JSON.stringify(png('logo_dark.png')) + ',icon:' + JSON.stringify(png('logo_icon.png')) +
    ',logoSvg:' + JSON.stringify(logo) + ',markSvg:' + JSON.stringify(mark) + ',splashBg:' + JSON.stringify(`radial-gradient(900px 600px at 50% 30%,rgba(66,104,201,.35),transparent 65%),radial-gradient(700px 500px at 80% 100%,rgba(45,150,130,.22),transparent 65%),linear-gradient(170deg,#152257,#0b1433)`) + '};\n';
  fs.writeFileSync(path.join(H, 'src/assets.js'), js); console.log('✔ src/assets.js', Math.round(js.length / 1024), 'KB');
})();
