// 1.34 «زيزو» في تطبيق «زنها» (الاجتماع 10، م1): تحية الرأس، الحالات الفارغة، تسجيل الوجبة والماء، اليوم الكامل، اللمس، الإخفاء من «أنا»، وشاشة الانتظار
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('zizo', errs);
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.scn');
  assert.strictEqual(await m.locator('.scn .zzmini svg.zz').count(), 1); ok('زيزو صغير في رأس «اليوم» بحسب وقت اليوم');
  await m.click('.msn [data-act="whole"]'); await m.waitForSelector('#zzf .zzt'); assert(/أحسنت/.test(await m.textContent('#zzf .zzt'))); ok('أكلت الوجبة كاملة: زيزو يظهر ويقول «أحسنت»');
  await m.evaluate(() => { const f = document.getElementById('zzf'); if (f) f.remove(); });
  const slots = await m.evaluate(() => { const S = window.HissatiApp.state(); return S.plan[new Date().getDay() % S.plan.length].slots.length; });
  for (let i = 0; i < slots + 2 && /^سجّل /.test((await m.textContent('.msn h3')).trim()); i++) { const was = (await m.textContent('.msn h3')).trim(); await m.click('.msn [data-act="whole"]'); await m.waitForFunction((w) => document.querySelector('.msn h3').textContent.trim() !== w, was); }
  await m.waitForFunction(() => /يوم كامل/.test((document.querySelector('#zzf .zzt') || {}).textContent || '') || window.HissatiApp.state().zzDay); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().zzDay), await m.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }));
  ok('اكتمال أصناف اليوم: احتفال زيزو «يوم كامل!» مرة واحدة في اليوم');
  if (/اشرب كوباً/.test(await m.textContent('.msn h3'))) { await m.evaluate(() => { const f = document.getElementById('zzf'); if (f) f.remove(); }); await m.click('.msn [data-act="water"]'); await m.waitForSelector('#zzf .zzt'); assert(/كوب|يوم كامل/.test(await m.textContent('#zzf .zzt'))); ok('كوب ماء: زيزو يعدّ الأكواب'); }
  await m.evaluate(() => { const f = document.getElementById('zzf'); if (f) f.remove(); });
  await m.click('.scn .zzmini'); await m.waitForSelector('#zzf .zzt'); assert(/ههه|سامعك|نكمّل|تشجيع/.test(await m.textContent('#zzf .zzt'))); ok('لمسة على زيزو تضحكه بجملة');
  for (let i = 0; i < 3; i++) await m.click('#zzf .zzb'); await m.waitForFunction(() => /نايم/.test((document.querySelector('#zzf .zzt') || {}).textContent || '')); ok('بعد أربع لمسات ينام قليلاً (لا إزعاج)');
  await m.click('[data-act="tab"][data-v="feed"]'); await m.waitForSelector('.empty .ea .zzart svg.zz'); ok('الحالة الفارغة (المنشورات) برسم زيزو');
  await m.click('[data-act="tab"][data-v="me"]'); await m.waitForSelector('[data-act="zzTog"]'); await m.click('[data-act="zzTog"]'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().zzOff), true);
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.scn'); assert.strictEqual(await m.locator('.zzmini').count(), 0); await m.click('[data-act="tab"][data-v="feed"]'); await m.waitForSelector('.empty .ea svg'); assert.strictEqual(await m.locator('.zzart').count(), 0);
  ok('«أنا» ← إخفاء زيزو: يختفي من الرأس والحالات الفارغة، وتعود الرسوم السابقة');
  await m.click('[data-act="tab"][data-v="me"]'); await m.click('[data-act="zzTog"]'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().zzOff), false); ok('وإظهاره من جديد');
  const w = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); assert(w[0] <= w[1], w); ok('بلا تمرير أفقي على الجوال');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات زيزو');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
