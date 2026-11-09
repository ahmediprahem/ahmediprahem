// إذاعة القرآن الكريم (0.85): بطاقة في «اليوم» للمسلم فقط، والمحطة تحوّل البث إلى https، والزر يشغّل ويوقف
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, RELAY, close } = await linked('radio', errs);
  const realFetch = globalThis.fetch; globalThis.fetch = (u, o) => /^https:\/\/n08\.radiojar\.com\//.test(String(u)) ? Promise.resolve(new Response(null, { status: 302, headers: { location: 'http://n02.radiojar.com/8s5u5tpdtwzuv?rj-ttl=5&rj-tok=TEST' } })) : realFetch(u, o);   // المحاكاة: خادم الإذاعة الحقيقي يحوّل إلى http برمز قصير
  const r = await fetch(RELAY + '/radio/quran', { redirect: 'manual' }); const loc = r.headers.get('location') || '';
  assert.strictEqual(r.status, 302, 'تحويل'); assert(/^https:\/\/[a-z0-9.-]+\.radiojar\.com\//.test(loc), loc); assert(/no-store/.test(r.headers.get('cache-control'))); assert(/rj-tok=TEST/.test(loc));
  ok('المحطة /radio/quran تحوّل إلى بث https برمز جديد بلا تخزين');
  const csp = (await fetch(RELAY + '/')).headers.get('content-security-policy'); assert(/media-src[^;]*radiojar\.com/.test(csp), csp);
  ok('سياسة الأمان تسمح بالصوت من radiojar.com');
  await m.evaluate(() => { const A = window.HissatiApp, S = A.state(); S.p.rel = 'م'; S.tab = 'today'; A.render(); });
  await m.click('.tabbar [data-v="today"]'); await m.waitForSelector('.radc'); assert(/إذاعة القرآن الكريم/.test(await m.textContent('.radc')) && /بث مباشر/.test(await m.textContent('.radc')));
  assert.strictEqual(await m.getAttribute('.radbtn', 'aria-pressed'), 'false');
  ok('المسلم يرى بطاقة «إذاعة القرآن الكريم» في الرئيسية');
  await m.evaluate(() => { HTMLMediaElement.prototype.play = function () { window.__radSrc = this.getAttribute('src'); this.dispatchEvent(new Event('playing')); return Promise.resolve(); }; HTMLMediaElement.prototype.pause = function () { window.__radPaused = 1; }; });
  await m.click('.radbtn'); await m.waitForSelector('.radbtn.on'); assert.strictEqual(await m.evaluate(() => window.__radSrc), '/radio/quran'); assert(/بث مباشر الآن/.test(await m.textContent('.radc')));
  await m.click('.radbtn'); await m.waitForSelector('.radbtn:not(.on)'); assert.strictEqual(await m.evaluate(() => window.__radPaused), 1);
  ok('الزر يشغّل من /radio/quran ثم يوقف');
  await m.evaluate(() => { const A = window.HissatiApp; A.state().p.rel = 'ك'; A.render(); }); assert.strictEqual(await m.locator('.radc').count(), 0);
  ok('غير المسلم لا يرى الإذاعة');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(e); process.exit(1); });
