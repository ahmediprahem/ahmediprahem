// مواقيت الصلاة والصلاة على النبي ﷺ والخطوات (0.57): حساب على الجهاز بلا إنترنت (الهيئة المصرية لمصر، أم القرى للسعودية)، بطاقة المواقيت في «اليوم»،
// تذكير عند كل صلاة (بعد الأذان لا قبله، ولا تحذفه ساعات الهدوء)، والصلاة على النبي يومياً وثلاث مرات يوم الجمعة، وخطواتي آخر 7 أيام.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('prayer', errs);
  const t = await m.evaluate(() => { const P = window.HissatiApp.prayTimes; return { mecca: P(new Date(2024, 2, 20), 21.3891, 39.8579, 3, 'sa'), cairo: P(new Date(2024, 5, 21), 30.0444, 31.2357, 3, 'eg'), riyadhW: P(new Date(2024, 11, 21), 24.7136, 46.6753, 3, 'sa') }; });
  const hm = (x) => Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'), near = (x, h, mm, tol) => Math.abs(x - (h * 60 + mm)) <= (tol || 4);
  console.log('    مكة 20 مارس', Object.entries(t.mecca).map(([k, v]) => k + ' ' + hm(v)).join(' | '));
  console.log('    القاهرة 21 يونيو', Object.entries(t.cairo).map(([k, v]) => k + ' ' + hm(v)).join(' | '));
  assert(near(t.mecca.dhuhr, 12, 29) && near(t.mecca.maghrib, 18, 32) && t.mecca.isha - t.mecca.maghrib === 90 && near(t.mecca.fajr, 5, 12, 6), JSON.stringify(t.mecca));
  assert(near(t.cairo.dhuhr, 12, 57) && near(t.cairo.maghrib, 20, 0, 5) && near(t.cairo.fajr, 4, 9, 6), JSON.stringify(t.cairo));
  const order = (x) => x.fajr < x.sunrise && x.sunrise < x.dhuhr && x.dhuhr < x.asr && x.asr < x.maghrib && x.maghrib < x.isha; assert(order(t.mecca) && order(t.cairo) && order(t.riyadhW));
  ok('حساب المواقيت على الجهاز: مكة (أم القرى: العشاء بعد المغرب بـ90 دقيقة) والقاهرة (الهيئة المصرية) قريبة من الجداول الرسمية (±4–6 دقائق) ومرتّبة');
  await m.click('[data-act="tab"][data-v="progress"]'); await m.waitForSelector('[data-rem="pray"]'); await m.check('[data-rem="pray"]'); await m.waitForSelector('#prCity'); await m.selectOption('#prCity', 'القاهرة');
  await m.check('[data-rem="sal"]'); await m.waitForTimeout(200);
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.prc'); const pc = await m.textContent('.prc'); assert(/مواقيت الصلاة • القاهرة/.test(pc) && ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'].every((w) => pc.includes(w)), pc);
  ok('«التذكيرات ← 🕌 مواقيت الصلاة» باختيار المدينة، وبطاقة المواقيت في «اليوم» مع الصلاة التالية');
  const it = await m.evaluate(() => { const S = window.HissatiApp.state(); S.rem.quiet = true; S.rem.qFrom = '23:00'; S.rem.qTo = '07:00'; return window.HissatiApp.remItems(); });
  const pr = it.filter((x) => x.t === 'pr'); assert.strictEqual(pr.length, 5, JSON.stringify(it)); assert(pr.every((x) => x.m % 15 === 0)); assert(pr.some((x) => /الفجر/.test(x.label)), 'الفجر لا تحذفه ساعات الهدوء');
  const P = await m.evaluate(() => { const d = new Date(); return window.HissatiApp.prayTimes(d, 30.0444, 31.2357, -d.getTimezoneOffset() / 60, 'eg'); });
  assert(pr.every((x) => { const k = { 'الفجر': 'fajr', 'الظهر': 'dhuhr', 'العصر': 'asr', 'المغرب': 'maghrib', 'العشاء': 'isha' }[x.label.split(' ')[0]]; return x.m >= P[k] && x.m - P[k] < 15; }), 'التذكير بعد الأذان بأقل من ربع ساعة');
  assert(it.some((x) => x.t === 'sal' && !x.d && x.m === 1260));
  ok('تذكير عند كل صلاة بعد الأذان مباشرة (أقرب ربع ساعة بعده) ولا تحذفه ساعات الهدوء، والصلاة على النبي ﷺ يومياً الساعة 9 مساءً (وثلاث مرات يوم الجمعة)');
  await m.evaluate(() => { const S = window.HissatiApp.state(), k = (i) => { const d = new Date(Date.now() - i * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }; [6000, 8000, 7000].forEach((v, i) => { const L = S.log[k(i)] = S.log[k(i)] || { ck: {}, sw: {}, note: {}, skip: {}, water: 0 }; L.h = Object.assign({}, L.h, { steps: v }); }); });
  await m.click('[data-act="tab"][data-v="progress"]'); const sw = await m.textContent('.scroll'); assert(/خطواتي آخر 7 أيام/.test(sw) && /٢١٬٠٠٠|21,000|21٬000/.test(sw) && /٧٬٠٠٠|7,000|7٬000/.test(sw), sw.slice(0, 400));
  ok('«👣 خطواتي آخر 7 أيام»: المجموع والمتوسط وعدد الأيام من «تسجيل اليوم»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات الصلاة والخطوات');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
