// منظر كاميرا «زنها» أفقي (للجوال المحمول أفقياً في الصور): صورة الطبق + إطار مسح + بطاقة النتيجة الحقيقية
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const [OUT, W, H] = [process.argv[2], +process.argv[3] || 1800, +process.argv[4] || 830], ROOT = path.resolve(__dirname, '../..');
const bg = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'assets/login/crop_plate.jpg')).toString('base64');
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W / 2, height: H / 2 }, deviceScaleFactor: 2 });
  await p.setContent(`<html dir="rtl"><body style="margin:0;font-family:'Noto Kufi Arabic','Cairo',sans-serif;overflow:hidden">
  <div style="position:fixed;inset:0;background:url(${bg}) center/cover;filter:saturate(1.08)"></div>
  <div style="position:fixed;inset:0;background:linear-gradient(90deg,rgba(10,20,40,.0) 40%,rgba(10,20,40,.45))"></div>
  <svg style="position:fixed;left:8%;top:12%;width:44%;height:76%" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="#5FD3B0" stroke-width="1.6" stroke-linecap="round"><path d="M0 18V0h18M82 0h18v18M100 82v18H82M18 100H0V82" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>
  <div style="position:fixed;right:5%;top:50%;transform:translateY(-50%);width:36%;background:rgba(255,255,255,.94);border-radius:18px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.3);color:#16324A">
    <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#237C8A;font-weight:700">● مساعد زنها</div>
    <div style="font-size:14px;font-weight:800;margin-top:4px;line-height:1.4">دجاج مشوي مع فريكة وفتوش وحمص</div>
    <div style="font-size:30px;font-weight:900;margin-top:6px;line-height:1">623 <span style="font-size:13px;font-weight:600;color:#5b6b7d">سعرة تقريباً</span></div>
    <div style="display:flex;gap:5px;margin-top:9px;font-size:10.5px;font-weight:700"><span style="padding:3px 7px;border-radius:9px;background:#e8f7f2">بروتين 58 جم</span><span style="padding:3px 7px;border-radius:9px;background:#fff4dd">كربوهيدرات 54</span><span style="padding:3px 7px;border-radius:9px;background:#ffe9e4">دهون 18</span></div></div>
  <div style="position:fixed;left:50%;bottom:6%;transform:translateX(-50%);width:44px;height:44px;border-radius:50%;border:4px solid #fff;box-shadow:0 0 0 3px rgba(95,211,176,.8)"></div>
  </body></html>`); await p.waitForTimeout(400); await p.screenshot({ path: OUT }); await b.close(); })();
