// خلفية صوتية بشرية اختيارية (0.81): مغلقة افتراضياً، دعوة لطيفة، تشغيل وإيقاف وحفظ المستوى، وتتوقف مع الفيديو.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('sound', errs);
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.sndi'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.sound.playing()), false, 'مغلقة افتراضياً'); assert(await m.locator('.sndb').count() === 1);
  ok('الخلفية الصوتية مغلقة افتراضياً مع دعوة لطيفة وزر صوت في ترويسة «اليوم»');
  await m.click('[data-act="sndask"][data-v="1"]'); await m.waitForFunction(() => window.HissatiApp.sound.playing()); assert.strictEqual(await m.locator('.sndi').count(), 0); assert.strictEqual(await m.getAttribute('.sndb', 'aria-pressed'), 'true');
  assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().snd.on), 1); await m.waitForTimeout(1800); const lv = await m.evaluate(() => window.HissatiApp.sound.level()); assert(lv.rms > 0.002 && lv.peak < 0.9, 'يخرج صوت فعلي دون تشويه: ' + JSON.stringify(lv));
  ok('«شغّلها»: يبدأ الصوت، وتختفي الدعوة، ويُحفظ الاختيار');
  await m.click('.sndb'); await m.waitForFunction(() => !window.HissatiApp.sound.playing()); assert.strictEqual(await m.getAttribute('.sndb', 'aria-pressed'), 'false');
  ok('زر الصوت يوقفه فوراً (خيار الإيقاف أمام العميل)');
  await m.click('.sndb'); await m.waitForFunction(() => window.HissatiApp.sound.playing());
  await m.click('[data-act="tab"][data-v="today"]'); await m.click('[data-act="sub"][data-v="prefs"]'); await m.waitForSelector('#sndV'); await m.fill('#sndV', '20'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.sound.vol()), 0.2);
  await m.click('[data-act="sndt"][type="checkbox"]'); await m.waitForFunction(() => !window.HissatiApp.sound.playing());
  ok('«أنا»: مفتاح ومستوى صوت يُحفظان، والمفتاح يوقف الصوت');
  const q = await m.evaluate(() => { const S = window.HissatiApp.state(); S.rem = S.rem || {}; S.rem.prCity = 'القاهرة'; S.p.rel = 'م'; const P = window.HissatiApp.sound.times(); const f = (k) => [window.HissatiApp.sound.quiet(P[k] - 8), window.HissatiApp.sound.quiet(P[k] + 10), window.HissatiApp.sound.quiet(P[k] + 40), window.HissatiApp.sound.quiet(P[k] - 30)]; S.p.rel = 'ك'; const nm = window.HissatiApp.sound.quiet(P.dhuhr + 3); S.p.rel = 'م'; return { f: f('dhuhr'), isha: f('isha'), nm }; });
  assert.deepStrictEqual(q.f, [true, true, false, false]); assert.deepStrictEqual(q.isha, [true, true, false, false]); assert.strictEqual(q.nm, false);
  ok('صمت تام للمسلم من 10 دقائق قبل الأذان إلى 15 دقيقة بعده في كل صلاة، ولا ينطبق على غير المسلم');
  await m.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await m.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); });
  assert.strictEqual(await m.evaluate(() => window.HissatiApp.sound.playing()), false);
  ok('لا يعيد التشغيل وحده بعد إيقاف العميل له');
  assert.strictEqual(await m.evaluate(() => { Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => false }); return window.HissatiApp.sound.avail(); }), false, 'بلا تسجيل معتمد لا يظهر الخيار للعملاء');
  ok('بلا تسجيل بشري معتمد (وخارج بيئة الاختبار) لا يظهر خيار الصوت إطلاقاً للعميل');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
