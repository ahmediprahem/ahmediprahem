// «اليوم» الحيّة (0.58): ترويسة مشهد تتبع وقت اليوم والثيم (فيروز: أهرامات ومسلة)، وبطاقة «مهمتك الآن»: أول وجبة لم تُسجَّل ثم الماء ثم رسالة إنجاز، وسلسلة الأيام.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('today', errs);
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.scn');
  const tod = await m.evaluate(() => { const h = new Date().getHours(); return h >= 4 && h < 11 ? 'morning' : h < 16 ? 'noon' : h < 20 ? 'evening' : 'night'; });
  assert.strictEqual(await m.getAttribute('.scn', 'data-tod'), tod); const g = { morning: 'صباح الخير', noon: 'نهارك سعيد', evening: 'مساء النور', night: 'ليلة هادئة' }[tod];
  assert((await m.textContent('.scn h2')).includes(g) && (await m.textContent('.scn h2')).includes('منى'), 'التحية بحسب الوقت واسم العميل');
  assert.strictEqual(await m.locator('.scn svg path[d^="M150 152"]').count(), 0, 'الثيم الحالي: لا أهرامات'); assert(await m.locator('.scn .chatbtn').count() === 1, 'زر مراسلة الأخصائي ما زال في الترويسة');
  ok('ترويسة «اليوم»: مشهد يتبع وقت اليوم بتحية باسم العميل وفيها زر المراسلة (الثيم الحالي: كثبان)');
  await m.evaluate(() => HxTheme.set('firoz')); await m.waitForTimeout(700); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.scn');
  assert.strictEqual(await m.locator('.scn svg path[d^="M150 152"]').count(), 1, 'فيروز: أهرامات'); assert.strictEqual(await m.evaluate(() => document.documentElement.getAttribute('data-theme')), 'firoz');
  const rgb = (await m.evaluate(() => getComputedStyle(document.body).backgroundColor)).match(/\d+/g).map(Number); assert(rgb[0] + rgb[1] + rgb[2] < 200 && rgb[1] > rgb[0], 'خلفية فيروزية داكنة');
  ok('ثيم «فيروز»: يُطبَّق، وخلفيته فيروزية داكنة، والمشهد أهرامات ومسلة بدل الكثبان');
  const slots = await m.evaluate(() => window.HissatiApp.state().plan[new Date().getDay() % window.HissatiApp.state().plan.length].slots.length);
  assert(await m.locator('.msn h3').count() === 1 && (await m.textContent('.msn small')).includes('مهمتك الآن'));
  let first = (await m.textContent('.msn h3')).trim(); assert(/^سجّل /.test(first), first);
  for (let i = 0; i < slots + 2 && /^سجّل /.test((await m.textContent('.msn h3')).trim()); i++) { const was = (await m.textContent('.msn h3')).trim(); await m.click('.msn [data-act="whole"]'); await m.waitForFunction((w) => document.querySelector('.msn h3').textContent.trim() !== w, was, { timeout: 4000 }); }
  assert(/اشرب كوباً|أحسنت/.test(await m.textContent('.msn h3')), 'بعد كل الوجبات: الماء أو رسالة الإنجاز');
  ok('بطاقة «مهمتك الآن»: تنتقل من وجبة إلى التي بعدها بعد «أكلتها كاملة» حتى تنتهي الوجبات');
  for (let i = 0; i < 30 && /اشرب كوباً/.test(await m.textContent('.msn h3')); i++) { const t = await m.textContent('.msn p'); await m.click('.msn [data-act="water"]'); await m.waitForFunction((x) => document.querySelector('.msn p') ? document.querySelector('.msn p').textContent !== x : true, t, { timeout: 4000 }); }
  assert(/أحسنت، أنجزت مهام اليوم/.test(await m.textContent('.msn h3')) && await m.locator('.msn [data-act]').count() === 0, 'رسالة الإنجاز بلا زر');
  assert(await m.locator('.stk b').count() === 1 && +(await m.textContent('.stk b')) >= 1, 'سلسلة الأيام تظهر بعد تسجيل صنف');
  ok('بعد الوجبات يأتي الماء كوباً كوباً ثم رسالة «أنجزت مهام اليوم» بلا زر، وتظهر سلسلة الأيام');
  await m.click('[data-act="tab"][data-v="feed"]'); await m.waitForSelector('.empty .ea svg'); assert(/لا منشورات بعد|جارٍ التحميل/.test(await m.textContent('.empty h3')), 'حالة التثقيف الفارغة برسم');
  assert(require('fs').readFileSync(require('path').join(__dirname, '../hissati.html'), 'utf8').includes("emptyArt('weight')"), 'رسم منحنى الوزن الفارغ مبنيّ في التطبيق');
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.meal .mti svg'); assert(await m.locator('.meal .mti').count() >= 2, 'أيقونة لكل وجبة معروفة الاسم');
  await m.click('.scn [data-act="chat"]'); await m.waitForSelector('.empty .ea svg'); assert(/ابدأ الحديث/.test(await m.textContent('.empty h3')));
  ok('الحالات الفارغة برسوم وجمل تدعو للفعل (التثقيف، الوزن، المحادثة)، وأيقونة لكل وجبة');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
