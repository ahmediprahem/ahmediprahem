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
  await m.click('[data-act="tab"][data-v="prefs"]'); await m.waitForSelector('#sndV'); await m.fill('#sndV', '20'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.sound.vol()), 0.2);
  await m.click('[data-act="sndt"][type="checkbox"]'); await m.waitForFunction(() => !window.HissatiApp.sound.playing());
  ok('«أنا»: مفتاح ومستوى صوت يُحفظان، والمفتاح يوقف الصوت');
  await m.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await m.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); });
  assert.strictEqual(await m.evaluate(() => window.HissatiApp.sound.playing()), false);
  ok('لا يعيد التشغيل وحده بعد إيقاف العميل له');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
