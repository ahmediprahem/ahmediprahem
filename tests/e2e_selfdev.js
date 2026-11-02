// «تحدي العادات السبع» (0.64): ٧ أيام لتطوير الذات، عادة كل يوم بمهام وسؤال تأمل؛ تُفتح يوماً بيوم، وشهادة عند الإتمام تصل الأخصائي.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('selfdev', errs);
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.sdc'); assert(/تحدي العادات السبع/.test(await m.textContent('.sdc h3')) && await m.locator('[data-act="sdStart"]').count() === 1);
  assert(!/غذاء|وجبة|سعرة/.test(await m.textContent('.sdc')), 'ليس مرتبطاً بالغذاء'); await m.click('[data-act="sdStart"]'); await m.waitForSelector('.sdday');
  assert(/كن مبادراً/.test(await m.textContent('.sdday h3'))); assert.strictEqual(await m.locator('.sdday .sdtk').count(), 3); assert.strictEqual(await m.locator('.sdday svg.sdcv').count(), 1); assert(await m.isDisabled('[data-act="sdDone"]'), 'لا إتمام قبل المهام');
  ok('الاقتراح على «اليوم»: بطاقة تطوير ذات (لا غذاء)، تبدأ باليوم ١ «كن مبادراً» بغلاف وثلاث مهام وزر إتمام مقفل');
  for (let j = 0; j < 3; j++) await m.click('.sdtk >> nth=' + j); assert(!(await m.isDisabled('[data-act="sdDone"]'))); await m.fill('#sdNote', 'بادرتُ بترتيب مكتبي'); await m.click('[data-act="sdDone"]'); await m.waitForSelector('.sdday .banner');
  assert.strictEqual(await m.locator('.sdnd.d').count(), 1); assert.strictEqual(await m.locator('.sdnd.l').count(), 6, 'بقية الأيام تُفتح يوماً بيوم'); await m.click('.sdnd >> nth=1', { force: true }); assert(/كن مبادراً/.test(await m.textContent('.sdday h3')), 'اليوم ٢ مقفل'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().sd.dn[0].n), 'بادرتُ بترتيب مكتبي');
  ok('إتمام اليوم ١: المهام ثم «أتممتُ اليوم»، والتأمل يُحفظ على الجوال، واليوم ٢ يُفتح في موعده فقط');
  await m.evaluate(() => { const S = window.HissatiApp.state(), t = new Date(); t.setDate(t.getDate() - 7); S.sd.st = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); });
  for (let i = 1; i < 7; i++) { await m.click('.sdnd >> nth=' + i); await m.waitForFunction((k) => document.querySelector('.sdno') && document.querySelector('.sdno').textContent.includes('العادة ' + (k + 1) + ' من'), i); for (let j = 0; j < 3; j++) await m.click('.sdtk >> nth=' + j); await m.click('[data-act="sdDone"]'); }
  await m.waitForSelector('#cel'); const st = await m.evaluate(() => { const S = window.HissatiApp.state(); return { fin: !!S.sd.fin, ach: S.ach.filter((a) => a.pid === 'sd7').map((a) => [a.w, a.title]) }; });
  assert(st.fin); assert.deepStrictEqual(st.ach, [[99, 'تحدي العادات السبع']]); ok('إتمام الأيام السبع يُنهي التحدي ويُصدر شهادة «تحدي العادات السبع» مع احتفال');
  await m.click('#cel'); await cPoll(); await hxCheck(); const c = await C(); assert((c.hx.ach || []).some((a) => a.id === 'sd7' && a.w === 99), JSON.stringify(c.hx.ach)); await m.click('[data-act="tab"][data-v="today"]'); assert.strictEqual(await m.locator('.sdc').count(), 0, 'تختفي البطاقة بعد الإتمام');
  ok('الشهادة تصل «حصة» (إنجاز العميل)، وتختفي بطاقة التحدي من «اليوم»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
