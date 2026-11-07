// «وردي من القرآن» في «عاداتي» (0.61): ختمة بمدة يختارها العميل يقسّمها التطبيق على الأيام بحدود الأرباع، ويعيد التوزيع من حيث وصل،
// مع تذكير يومي، وقارئ المصحف بنقطة توقف، والقراءة الحرة لأي سورة من قائمة الـ114.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('quran', errs);
  await m.waitForSelector('.qkc'); assert(/وردي من القرآن/.test(await m.textContent('.qkc')));
  await m.click('.qkc [data-act="qkSetup"]'); await m.waitForSelector('[data-act="qkSet"][data-v="30"]'); await m.click('[data-act="qkSet"][data-v="30"]');
  assert(/≈ 208 آية في اليوم/.test(await m.textContent('.sheet'))); await m.fill('#qkRt', '21:00'); await m.click('[data-act="qkSave"]'); await m.waitForTimeout(200);
  let t = await m.textContent('.qkc'); assert(/ختمة في 30 يوماً • اليوم 1 من 30/.test(t) && /من الفاتحة 1 إلى البقرة 141/.test(t) && /148 آية/.test(t), t);
  ok('ختمة في شهر: اليوم الأول جزء كامل (الفاتحة 1 إلى البقرة 141، 148 آية)، ويظهر في «عاداتي» بنسبة الختمة');
  const rem = await m.evaluate(() => window.HissatiApp.remItems().filter((x) => x.t === 'qk')); assert(rem.length === 1 && rem[0].m === 1260 && /الفاتحة/.test(rem[0].label), JSON.stringify(rem));
  ok('تذكير يومي 9 مساءً بورد اليوم (يختفي بعد إتمامه)');
  await m.click('.qkc [data-act="qkRead"]'); await m.waitForSelector('.qtext .qa', { timeout: 15000 }); assert.strictEqual(await m.locator('.qtext .qa').count(), 148);
  assert(/وردي من القرآن/.test(await m.textContent('.hd'))); await m.click('#qa30'); await m.waitForTimeout(150); assert(/توقفت عند البقرة 24/.test(await m.textContent('.qstat')));
  await m.click('[data-act="khRX"]'); await m.waitForSelector('.qkc'); assert(/أكمل من البقرة 25/.test(await m.textContent('.qkc')));
  ok('القارئ يعرض ورد اليوم (148 آية) ونقطة التوقف، والبطاقة تقول «أكمل من البقرة 25»');
  await m.click('.qkc [data-act="qkRead"]'); await m.waitForSelector('[data-act="qkDone"]'); await m.click('[data-act="qkDone"]'); await m.waitForSelector('.qkc');
  t = await m.textContent('.qkc'); assert(/أتممت ورد اليوم ✓/.test(t) && /3% من الختمة/.test(t), t);
  assert.strictEqual((await m.evaluate(() => window.HissatiApp.remItems().filter((x) => x.t === 'qk'))).length, 0);
  ok('«أتممت ورد اليوم» يقدّم الختمة جزءاً (3%) ويلغي تذكير اليوم');
  await m.evaluate(() => { const Q = window.HissatiApp.state().qk, d = new Date(Date.now() - 10 * 864e5); Q.start = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); Q.today = null; window.HissatiApp.render(); });
  t = await m.textContent('.qkc'); assert(/اليوم 11 من 30/.test(t) && /البقرة 142/.test(t), t);
  const T = await m.evaluate(() => window.HissatiApp.state().qk.today); assert.deepStrictEqual([T.b, T.n], [8, 12], 'تأخّر 10 أيام: الباقي 232 ربعاً على 20 يوماً = 12 ربعاً اليوم');
  ok('إعادة التوزيع: بعد تأخّر 10 أيام يُقسَّم الباقي على الأيام الباقية (12 ربعاً اليوم) بلا تراكم');
  await m.click('.qkc [data-act="qkFree"]'); await m.waitForSelector('.qksr'); assert.strictEqual(await m.locator('.qksr').count(), 114);
  await m.fill('#qkq', 'يس'); await m.waitForTimeout(100); assert.strictEqual(await m.locator('.qksr:not([hidden])').count(), 1);
  await m.click('.qksr[data-v="36"]'); await m.waitForSelector('.qtext .qa'); assert.strictEqual(await m.locator('.qtext .qa').count(), 83); assert(/سورة يس/.test(await m.textContent('.qtext')));
  await m.click('#qa' + (await m.evaluate(() => window.HissatiApp.khams.meta().s[35][0] + 9))); await m.click('[data-act="khRX"]'); await m.waitForSelector('[data-act="qkFreeGo"]'); assert(/أكمل من يس 10/.test(await m.textContent('[data-act="qkFreeGo"]')));
  ok('المصحف للقراءة الحرة: قائمة 114 سورة مع بحث، ويس 83 آية، ونقطة توقف منفصلة «أكمل من يس 10»');
  await m.click('[data-act="khRX"]').catch(() => { }); await m.evaluate(() => { const A = window.HissatiApp; A.state().ui = Object.assign({}, A.state().ui, { today2: true }); A.state().tab = 'today'; A.render(); });
  await m.click('[data-act="qkFreeX"]').catch(() => { }); await m.waitForSelector('[data-act="hbSheet"]'); await m.click('[data-act="hbSheet"]'); await m.waitForSelector('.sheet .qkc'); assert(/وردي من القرآن/.test(await m.textContent('.sheet .qkc')));
  ok('«اليوم» الجديد: بطاقة «وردي من القرآن» داخل ورقة «عاداتي»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات وردي من القرآن');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
