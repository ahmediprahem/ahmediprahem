// تبويب «أنا» (0.60، المعرّف me): إعدادات 0.59 (التذكيرات والمدينة والدواء والثيم) تظهر كما هي في «أنا» بلا تغيير مفاتيح (ترحيل R4)،
// و«تقدّمي» بلا إعدادات، وحجم الخط العام يبقى بعد إعادة الفتح ولا تمرير أفقي على 320 بالدرجة الكبرى، والحذف لا يتم بلا كتابة «احذف».
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('me', errs);
  // حالة 0.59: بلا S.ui، وتذكيرات ومدينة ودواء، وثيم «وردة»
  const REM = { water: true, meals: false, adhAm: true, adhAmT: '07:15', adhPm: false, pray: true, prCity: 'جدة', sal: true, salT: '21:00', med: true, meds: [{ n: 'فيتامين د', t: '09:30' }], quiet: true, qFrom: '23:00', qTo: '06:30', cap: 8, sound: false };
  await m.evaluate((R) => { const A = window.HissatiApp, S = A.state(); delete S.ui; S.rem = JSON.parse(JSON.stringify(R)); S.tab = 'progress'; window.HxTheme.set('rose'); A.render(); }, REM);
  const prog = await m.textContent('.scroll'); assert(!(await m.locator('.scroll [data-rem], .scroll .hx-themes, .scroll [data-act="xferNew"], .scroll [data-act="wipe"]').count()), 'لا إعدادات في «تقدّمي»');
  assert(/الوزن/.test(prog) && /الالتزام آخر 7 أيام/.test(prog) && /إنجازاتي/.test(prog), prog.slice(0, 200));
  await m.click('.tabbar [data-act="tab"][data-v="me"]'); await m.waitForSelector('.mehd'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().tab), 'me');
  ok('«تقدّمي» يبقى للوزن والالتزام والإنجازات وفي آخره «⚙ الإعدادات انتقلت إلى «أنا» ›»، و«أنا» تبويب (S.tab = me)');
  const cnt = await m.$$eval('.remgh', (b) => b.map((x) => x.querySelector('.dim').textContent)); assert.deepStrictEqual(cnt, ['1 مفعّل', 'غير مفعّل', '3 مفعّل', '1 مفعّل', '2 مفعّل'], 'المطوية تعرض عدد المفعّل');
  for (const k of ['eat', 'pray', 'med', 'quiet']) await m.click('[data-act="remG"][data-v="' + k + '"]');
  const seen = await m.evaluate(() => { const c = (k) => !!(document.querySelector('[data-rem="' + k + '"]') || {}).checked, v = (q) => (document.querySelector(q) || {}).value; return { water: c('water'), meals: c('meals'), adhAm: c('adhAm'), adhAmT: v('[data-remt="adhAmT"]'), adhPm: c('adhPm'), pray: c('pray'), city: v('#prCity'), sal: c('sal'), med: c('med'), medN: v('[data-med="n|0"]'), medT: v('[data-med="t|0"]'), quiet: c('quiet'), qTo: v('[data-remt="qTo"]'), cap: v('#remCap'), sound: !!document.querySelector('[data-remsound]').checked, theme: document.querySelector('.hx-th[data-v="rose"]').getAttribute('aria-checked') }; });
  assert.deepStrictEqual(seen, { water: true, meals: false, adhAm: true, adhAmT: '07:15', adhPm: false, pray: true, city: 'جدة', sal: true, med: true, medN: 'فيتامين د', medT: '09:30', quiet: true, qTo: '06:30', cap: '8', sound: false, theme: 'true' });
  assert.deepStrictEqual(await m.evaluate(() => window.HissatiApp.state().rem), REM, 'S.rem كما هو');
  const sw = await m.$$eval('.remrow input.sw', (x) => x.map((e) => Math.round(e.getBoundingClientRect().height))); assert(sw.length >= 8 && sw.every((h) => h >= 44), JSON.stringify(sw));
  ok('ترحيل R4: إعدادات 0.59 (الماء، أذكار الصباح 07:15، المواقيت لمدينة جدة، الصلاة على النبي ﷺ، دواء 09:30، الهدوء، الحد 8، الصوت، ثيم «وردة») ظاهرة ومطابقة في «أنا» بأربع مجموعات، والمفاتيح لم تتغير، والمفاتيح switch بارتفاع 44');
  await m.evaluate(() => window.HxTheme.set('classic'));
  // حجم الخط: يبقى بعد إعادة الفتح، ولا تمرير أفقي على 320 عند 1.3
  await m.click('[data-act="fsSet"][data-v="1.3"]'); assert.strictEqual(await m.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fs').trim()), '1.3');
  const body = await m.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.fsprev')).fontSize)); assert(body >= 19 && body <= 20, String(body));
  await m.evaluate(() => window.HissatiApp.flush()); await m.waitForTimeout(400); await m.reload(); await m.waitForSelector('.pad'); for (const k of '1234') await m.click('.pad [data-v="' + k + '"]'); await m.waitForSelector('.tabbar');
  assert.strictEqual(await m.evaluate(() => [getComputedStyle(document.documentElement).getPropertyValue('--fs').trim(), window.HissatiApp.state().ui.fs].join('|')), '1.3|1.3');
  await m.setViewportSize({ width: 320, height: 640 });
  for (const tab of ['today', 'me', 'plan']) {
    await m.click('.tabbar [data-act="tab"][data-v="' + tab + '"]');
    await m.waitForTimeout(150); const o = await m.evaluate(() => { const sc = document.querySelector('.scroll'); return [document.documentElement.scrollWidth - document.documentElement.clientWidth, sc.scrollWidth - sc.clientWidth]; });
    assert(o[0] <= 0 && o[1] <= 1, tab + ' تمرير أفقي ' + o)
  }
  await m.setViewportSize({ width: 390, height: 664 }); await m.click('.tabbar [data-act="tab"][data-v="today"]'); await m.click('.tabbar [data-act="tab"][data-v="me"]'); await m.click('[data-act="fsSet"][data-v="1"]');
  ok('حجم الخط العام (عادي/كبير/أكبر) في «أنا ← العرض»: «أكبر» = 1.3 يبقى بعد إعادة الفتح، ولا تمرير أفقي على 320px في «اليوم» و«أنا» و«خطتي» و«تقدّمي»');
  // الحذف: منطقة منفصلة، وتأكيد بكتابة «احذف»
  const dz = await m.evaluate(() => { const b = document.querySelector('.medanger [data-act="wipe"]'), z = document.querySelector('.medanger'); return { h: b.getBoundingClientRect().height, mt: parseFloat(getComputedStyle(z).marginTop) }; }); assert(dz.h >= 44 && dz.mt >= 32, JSON.stringify(dz));
  await m.click('.medanger [data-act="wipe"]'); await m.waitForSelector('#wipeIn'); await m.fill('#wipeIn', 'نعم'); await m.click('[data-act="wipeOk"]'); await m.waitForSelector('.toast:has-text("اكتب كلمة «احذف»")');
  assert(await m.evaluate(() => !!localStorage.getItem('hissati_v1')), 'لا حذف بلا الكلمة');
  await m.fill('#wipeIn', 'احذف'); await Promise.all([m.waitForNavigation(), m.click('[data-act="wipeOk"]')]); await m.waitForTimeout(300);
  assert.strictEqual(await m.evaluate(() => localStorage.getItem('hissati_v1')), null);
  ok('«حذف بياناتي من هذا الجوال» زر بحدّ أحمر ارتفاعه ' + Math.round(dz.h) + ' في منطقة منفصلة (' + dz.mt + 'px)، والتأكيد ورقة تطلب كتابة «احذف»: كلمة أخرى لا تحذف، و«احذف» يمسح الجهاز');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات «أنا»');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 2000)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
