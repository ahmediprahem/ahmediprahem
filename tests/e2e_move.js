// تحدي الحركة (0.78): شريحة في «اليوم» مع تحدي العادات، 4 مستويات × 7 أيام، فيديو يوتيوب داخل التطبيق، فتح يوم بيوم، وشهادة عند الإتمام.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('move', errs);
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.chcar'); assert.strictEqual(await m.locator('.chsl').count(), 2); assert(/تحدي الحركة/.test(await m.textContent('.mvc'))); assert.strictEqual(await m.locator('.mvp i').count(), 7);
  await m.click('.chdt button >> nth=1'); assert(/translateX\(100%\)/.test(await m.getAttribute('.chtr', 'style'))); assert(/العادات السبع/.test(await m.textContent('.chsl >> nth=1'))); await m.click('.chdt button >> nth=0');
  ok('«اليوم»: شريحة متحركة فيها تحدي الحركة (بمسار ٧ محطات) وتحدي العادات، ونقاط للتنقل');
  await m.click('[data-act="mvOpen"]'); await m.waitForSelector('.mvlv'); assert.strictEqual(await m.locator('.mvlv button').count(), 4); assert(/المطلوب منك/.test(await m.textContent('.scroll')) && /ما يعود عليك/.test(await m.textContent('.scroll')) && /شهادة إتمام/.test(await m.textContent('.mvcert')) && /استشر طبيبك/.test(await m.textContent('.scroll')));
  await m.click('.mvlv [data-v="0"]'); assert(/15 دقيقة|١٥|15/.test(await m.textContent('.scroll'))); await m.click('[data-act="mvJoin"]'); await m.waitForSelector('.mvd'); assert.strictEqual(await m.locator('.mvdy').count(), 7);
  await m.waitForSelector('.wvf iframe'); assert(/youtube-nocookie\.com\/embed\/tW9IY48x1bc/.test(await m.getAttribute('.wvf iframe', 'src')));
  ok('التفاصيل: المطلوب وما يعود والشهادة والتنبيه، اختيار مستوى والانضمام، وفيديو اليوم الأول يعمل داخل التطبيق');
  await m.click('[data-act="mvDone"]'); await m.waitForSelector('.banner'); assert.strictEqual(await m.locator('.wvf').count(), 0, 'اليوم التالي لا يُفتح في اليوم نفسه'); assert.strictEqual(await m.locator('.mvdy.d').count(), 1);
  await m.click('[data-act="mvX"]'); assert(/1 من ٧|١ من ٧/.test(await m.textContent('.mvc .pill')));
  ok('إتمام اليوم ١ يقفل الباقي حتى الغد، وتتحدث البطاقة على الشاشة الرئيسية');
  await m.evaluate(() => { const S = window.HissatiApp.state(); for (const k of Object.keys(S.mv.dn)) S.mv.dn[k] -= 9 * 864e5; });
  for (let i = 1; i < 7; i++) { await m.click('[data-act="mvOpen"]'); await m.waitForSelector('[data-act="mvDone"]'); await m.click('[data-act="mvDone"]'); if (i < 6) { await m.waitForSelector('.banner'); await m.evaluate(() => { const S = window.HissatiApp.state(); for (const k of Object.keys(S.mv.dn)) S.mv.dn[k] -= 864e5; }); await m.click('[data-act="mvX"]'); } }
  await m.waitForSelector('#cel', { timeout: 5000 }); const a = await m.evaluate(() => window.HissatiApp.state().ach.slice(-1)[0]); assert(/تحدي الحركة/.test(a.title) && /المستوى 1/.test(a.lines[0]));
  ok('إتمام الأيام السبعة: احتفال وشهادة تُحفظ في ملفي بالمستوى والدقائق');
  await cPoll(); await hxCheck(); const c = await C(); assert((c.hx.ach || []).some((x) => /تحدي الحركة/.test(x.title)), 'وصلت الشهادة للأخصائي');
  ok('«حصة»: يصل الأخصائي إنجاز «شهادة إتمام تحدي الحركة»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
