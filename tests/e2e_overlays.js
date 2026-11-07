// الطبقات (0.60 أ3–أ4): الإشعار القصير فوق الأشرطة السفلية أو تحت الرأس ولا يتقاطع مع أي زر ظاهر في 5 شاشات
// («اليوم»، ويوم التحدي، والسبحة، والأذكار، والمحادثة)، وشريط «بلا اتصال» في التخطيط لا يغطي عنوان المحادثة والتثقيف، ورسالة انقطاع واحدة في «تثقيف».
const assert = require('assert'), linked = require('./hx_link_helper'), scan = require('./zenha_scan');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('overlays', errs, { today2: true });
  const toastAt = async (where, scrolls) => {
    for (const f of scrolls || [0]) {
      await m.evaluate((f) => { const sc = document.querySelector('.scroll'); if (sc) sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * f; window.HissatiApp.toast('إشعار تجريبي للفحص'); }, f); await m.waitForSelector('.toast'); await m.waitForTimeout(80);
      const h = await scan.hits(m, '.toast'); assert.deepStrictEqual(h, [], where + ' (تمرير ' + f + ')');
      const r = await m.evaluate(() => { const t = document.querySelector('.toast').getBoundingClientRect(), b = [...document.querySelectorAll('.tabbar, .logbar, .foot, .khbar, .composer')].map((x) => x.getBoundingClientRect()).filter((x) => x.height); return { role: document.querySelector('.toast').getAttribute('role'), n: document.querySelectorAll('.toast:not(.hx-exit-toast)').length, under: b.some((x) => x.top < t.bottom && x.bottom > t.top) }; });
      assert(r.role === 'status' && r.n === 1 && !r.under, where + JSON.stringify(r));
    }
  };
  await toastAt('«اليوم»', [0, 0.5, 1]);
  const mb = await m.evaluate(() => { const t = document.querySelector('.toast').getBoundingClientRect(), l = document.querySelector('.logbar').getBoundingClientRect(); return l.top - t.bottom; }); assert(mb >= 8 && mb <= 20, 'فوق «سجّل يومك» مباشرة: ' + mb);
  await m.click('.toast .tx'); assert.strictEqual(await m.locator('.toast:not(.hx-exit-toast)').count(), 0, 'يُغلق بلمسة');
  ok('«اليوم»: الإشعار فوق «سجّل يومك» وشريط التبويب (role=status، واحد فقط، يُغلق بلمسة ✕) ولا يتقاطع مع أي زر في أعلى الصفحة ووسطها وآخرها');
  await m.click('.waitc [data-act="khStart"], [data-act="khStart"]').catch(async () => { await m.click('[data-act="waitAll"]'); await m.click('.sheet [data-act="khStart"]'); });
  await m.waitForSelector('.khg'); for (let i = 0; i < 5; i++) await m.click('[data-act="khgNext"]'); await m.click('[data-act="khGo"]'); await m.waitForSelector('.khs .khnext');
  await toastAt('يوم التحدي', [0, 1]);
  await m.click('[data-act="khTab"][data-v="adhkar"]'); await m.click('.khazc[data-v="tb"]'); await m.waitForSelector('.sebha'); await toastAt('السبحة', [0, 1]);
  await m.click('[data-act="khAzX"]'); await m.click('[data-act="khTab"][data-v="adhkar"]'); await m.click('.khazc[data-v="am"]'); await m.waitForSelector('.khazt'); await toastAt('الأذكار', [0, 1]);
  await m.click('[data-act="khAzX"]'); await m.click('[data-act="khTab"][data-v="day"]'); await m.click('[data-act="khX"]');
  await m.click('.chatbtn'); await m.waitForSelector('.composer'); await m.fill('#chatIn', 'سؤال'); await m.press('#chatIn', 'Enter'); await toastAt('المحادثة');
  ok('الإشعار لا يغطي زراً في يوم التحدي والسبحة والأذكار (يظهر أعلى الشاشة في التدفق) ولا في المحادثة (فوق مربع الكتابة)');
  // بلا اتصال: الشريط في التخطيط، لا يغطي عنوان المحادثة ولا التثقيف، ورسالة واحدة
  await m.context().setOffline(true); await m.evaluate(() => { window.dispatchEvent(new Event('offline')); }); await m.waitForSelector('.offline');
  assert.deepStrictEqual(await scan.hits(m, '.offline'), [], 'المحادثة'); assert.strictEqual(await m.evaluate(() => getComputedStyle(document.querySelector('.offline')).position), 'static');
  await m.click('[data-act="chatClose"]'); assert(/◷ ستُرسل عند عودة الإنترنت/.test(await m.textContent('.sync')), 'سطر المزامنة يتبع الاتصال');
  await m.click('[data-act="tab"][data-v="feed"]'); await m.click('[data-act="fdRefresh"]'); await m.waitForTimeout(600);
  assert.deepStrictEqual(await scan.hits(m, '.offline'), [], 'التثقيف'); const msgs = await m.evaluate(() => (document.querySelector('.device').textContent.match(/لا اتصال|بلا اتصال/g) || []).length); assert.strictEqual(msgs, 1, 'رسالة انقطاع واحدة');
  await m.context().setOffline(false); await m.evaluate(() => { window.dispatchEvent(new Event('online')); });
  ok('«بلا اتصال» جزء من التخطيط (static) لا يتقاطع مع عنوان المحادثة ولا «تثقيف»، ورسالة انقطاع واحدة في «تثقيف»، وسطر المزامنة «◷ ستُرسل عند عودة الإنترنت»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات الطبقات');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 2000)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
