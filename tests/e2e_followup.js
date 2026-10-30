// المتابعة (0.54): «🔁 متابعة أسبوعية ثابتة» تُنشئ مواعيد 4 أسابيع وتصل «حصتي» ← قبل الموعد بيوم بطاقة «غداً موعد متابعتك» بزرّي «أؤكد» و«أحتاج تغيير» وتذكير مسائي بتاريخه،
// التأكيد أو طلب التغيير يصل «حصة» (شارة في الموعد + الفرز)؛ «وقت الرد اليومي» يظهر في محادثة العميل؛ وساعات الهدوء والحد الأقصى للتذكيرات (الدواء والمواعيد لا تُحذف).
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('followup', errs);
  const tmrDow = new Date(Date.now() + 864e5).getDay();
  await d.click('main .tabs [data-v="appt"]'); await d.waitForSelector('.wkweekly'); await d.selectOption('#ww_d', String(tmrDow)); await d.fill('#ww_t', '18:30'); await d.selectOption('#ww_m', 'فيديو'); await d.click('[data-a="wkWeekly"]');
  await d.waitForSelector('.toast:has-text("مواعيد المتابعة الأسبوعية")'); let c = await C(); const wk = c.appts.filter((a) => a.type === 'متابعة أسبوعية'); assert.strictEqual(wk.length, 4); assert(wk.every((a) => a.t === '18:30' && a.mode === 'فيديو')); assert.deepStrictEqual(c.weekly, { dow: tmrDow, t: '18:30', mode: 'فيديو' });
  ok('«🔁 متابعة أسبوعية ثابتة»: يوم وساعة وطريقة ← 4 مواعيد للأسابيع القادمة');
  await cPoll(); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.apc'); const ap = await m.textContent('.apc');
  assert(/غداً موعد متابعتك/.test(ap) && /6:30 م/.test(ap) && /فيديو/.test(ap), ap); assert(await m.isVisible('[data-act="apOk"]'));
  const it = await m.evaluate(() => window.HissatiApp.remItems()), tk = await m.evaluate(() => { const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); });
  assert(it.some((x) => x.t === 'appt' && x.d === tk && x.m === 1200), JSON.stringify(it));
  ok('«حصتي»: «غداً موعد متابعتك • 6:30 م • فيديو» بزرّي التأكيد والتغيير، وتذكير الساعة 8 مساءً بتاريخ اليوم السابق للموعد فقط');
  await m.click('[data-act="apChg"]'); await m.waitForSelector('.apc .banner.warn'); await cPoll(); await d.click('main .tabs [data-v="hx"]'); await hxCheck(); c = await C();
  assert.strictEqual(c.appts.find((a) => a.d === wk[0].d).conf, 'chg'); await d.click('.rail [data-a="home"]'); assert(/يطلب تغيير موعد/.test(await d.textContent('.wktodo')));
  await m.evaluate(() => { const S = window.HissatiApp.state(); S.apConf = {}; }); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]'); await m.click('[data-act="apOk"]'); await m.waitForSelector('.apc .banner.ok');
  await cPoll(); await d.click('.ghome .recent .cl'); await d.click('main .tabs [data-v="hx"]'); await hxCheck(); await d.click('main .tabs [data-v="appt"]'); assert(/أكّد العميل/.test(await d.textContent('.wktab')));
  ok('«أحتاج تغيير» يصل «حصة» ويظهر في «من يحتاج اهتمامك»، و«أؤكد الموعد» يُظهر «✓ أكّد العميل» على الموعد');
  await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="hx"]'); await d.fill('#hx_reply', '20:30'); await d.press('#hx_reply', 'Tab'); await d.waitForSelector('.toast:has-text("ترد يومياً")'); await d.waitForTimeout(600);
  await cPoll(); await m.click('.chatbtn'); await m.waitForSelector('.replyb'); assert(/يومياً الساعة 8:30 م/.test(await m.textContent('.replyb'))); await m.click('[data-act="chatClose"]');
  ok('«وقت الرد اليومي» من إعدادات «حصتي» في «حصة» يظهر في محادثة العميل: «يرد أخصائيك على الرسائل يومياً الساعة 8:30 م»');
  const lim = await m.evaluate(() => { const S = window.HissatiApp.state(); S.rem = { water: true, meals: true, med: true, meds: [{ n: 'دواء', t: '12:00' }], quiet: true, qFrom: '10:00', qTo: '16:00', cap: 0 }; const a = window.HissatiApp.remItems(); S.rem.cap = 3; S.rem.quiet = false; const b = window.HissatiApp.remItems(); return { a: a.map((x) => x.t + x.m), b: b.filter((x) => !x.d).map((x) => x.t) }; });
  assert(!lim.a.some((x) => /^water(6[0-9]{2}|7|8|9)/.test(x) && +x.replace('water', '') >= 600 && +x.replace('water', '') < 960), JSON.stringify(lim.a)); assert(lim.a.includes('med720'), 'الدواء لا يُحذف في الهدوء');
  assert(lim.b.length <= 3 && lim.b.includes('med'), JSON.stringify(lim.b));
  ok('ساعات الهدوء تحذف تذكيرات الماء والوجبات في نطاقها (لا الدواء)، والحد الأقصى اليومي يحذف الماء أولاً ويُبقي الدواء والمواعيد');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات المتابعة والمواعيد');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
