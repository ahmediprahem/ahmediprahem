// 0.60 (ب8، T1): «أيام التمرين» بكاتب واحد هو الأخصائي. ما يرسله العميل من «أكمل ملفك» اقتراح (c.wdaysProp) لا يغيّر c.wdays ولا الخطة
// قبل «اعتمد»، و«تجاهل» يحذفه، والأخصائي يعدّل الحقل بنفسه في «بيانات العميل» فيُحفظ.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const L = await linked('wdays', errs), d = L.d, m = L.m;
  const C = () => d.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  let c = await C(); const w0 = JSON.stringify(c.wdays || []), plan0 = JSON.stringify(c.plan);
  // ---- 1) العميل يجيب «أكمل ملفك» وفيه أيام التمرين: الأحد والثلاثاء والخميس
  await m.evaluate(() => { const S = window.HissatiApp.state(); S.planAt = Date.now() - 4 * 864e5; }); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]');
  await m.waitForSelector('[data-act="pfGo"]'); await m.click('[data-act="pfGo"]'); await m.waitForSelector('.rq h2');
  await m.fill('#pfNum', '90'); await m.click('.foot .btn:not(.sec)'); await m.click('.rqo:has-text("عمل مكتبي")'); await m.click('.rqo:has-text("مصري")'); await m.click('.foot .btn:not(.sec)');
  await m.click('.rqo:has-text("متزوج")'); await m.click('.rqo:has-text("نقص فيتامين د")'); await m.click('.foot .btn:not(.sec)');
  await m.click('.rqo:has-text("نعم")'); await m.click('.rqo:has-text("حديد")'); await m.click('.foot .btn:not(.sec)');
  for (const i of [0, 2, 4]) await m.click('[data-act="pfDay"][data-v="' + i + '"]'); await m.click('.foot .btn:not(.sec)');
  await m.click('.rqo:has-text("60 دقيقة")'); await m.click('.rqo:has-text("أونلاين")'); await m.click('.rqo:has-text("فيديو")'); await m.click('.foot .btn:not(.sec)'); await m.waitForSelector('.tabbar');
  await L.cPoll(); await d.click('main .tabs [data-v="hx"]'); await L.hxCheck(); c = await C();
  assert.deepStrictEqual(c.prof.trD, [0, 2, 4], 'لم يصل الملف'); assert.strictEqual(JSON.stringify(c.wdays || []), w0, 'إجابة العميل كتبت فوق أيام التمرين'); assert.strictEqual(JSON.stringify(c.plan), plan0, 'تغيّرت الخطة');
  assert.deepStrictEqual(c.wdaysProp.v, [0, 2, 4]); assert(c.wdaysProp.at > 0);
  ok('إجابة العميل تصل اقتراحاً (wdaysProp = الأحد، الثلاثاء، الخميس) ولا تغيّر c.wdays ولا الخطة');
  // ---- 2) الاقتراح يظهر تحت الحقل، و«تجاهل» يحذفه
  await d.click('main .tabs [data-v="client"]'); await d.waitForSelector('.wdbox .wdprop'); const pt = await d.textContent('.wdbox .wdprop'); assert(/اقترح منى: الأحد، الثلاثاء، الخميس/.test(pt), pt);
  await d.click('.wdprop [data-a="wdNo"]'); await d.waitForTimeout(250); c = await C(); assert(!c.wdaysProp, 'بقي الاقتراح'); assert.strictEqual(JSON.stringify(c.wdays || []), w0); assert.strictEqual(await d.locator('.wdprop').count(), 0);
  ok('«اقترح منى: الأحد، الثلاثاء، الخميس» تحت «أيام التمرين» بزرّي «اعتمد» و«تجاهل»؛ «تجاهل» يحذفه ولا يمس الحقل');
  // ---- 3) اقتراح آخر (نفس الحقل الذي يكتبه الاستقبال) و«اعتمد» يكتبه
  await d.evaluate(() => { const cc = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); cc.wdaysProp = { v: [1, 3], at: Date.now() }; DPApp.A.tab('client'); });
  await d.waitForSelector('.wdprop [data-a="wdOk"]'); assert(/الاثنين، الأربعاء/.test(await d.textContent('.wdprop')));
  await d.click('.wdprop [data-a="wdOk"]'); await d.waitForSelector('.toast:has-text("اعتُمدت أيام التمرين")'); c = await C(); assert.deepStrictEqual(c.wdays, [1, 3]); assert(!c.wdaysProp);
  assert.deepStrictEqual(await d.evaluate(() => [...document.querySelectorAll('.wdays .wdc.on')].map((b) => +b.dataset.v)), [1, 3]); assert.strictEqual(JSON.stringify(c.plan), plan0, '«اعتمد» لا يعيد توليد الخطة وحده');
  ok('«اعتمد» يكتب c.wdays (الاثنين والأربعاء) ويحذف الاقتراح، والشرائح تعكس القيمة');
  // ---- 4) الأخصائي يعدّل الحقل يدوياً فيُحفظ، والاقتراح المطابق لا يظهر
  await d.click('.wdays [data-a="wday"][data-v="5"]'); await d.click('.wdays [data-a="wday"][data-v="1"]'); await d.waitForTimeout(500);
  c = await C(); assert.deepStrictEqual(c.wdays, [3, 5]); assert.strictEqual(await d.getAttribute('.wdays [data-v="5"]', 'aria-pressed'), 'true');
  const saved = await d.evaluate((code) => new Promise((res) => { const r = indexedDB.open('hissa_admin_data'); r.onsuccess = () => { const q = r.result.transaction('clients').objectStore('clients').get(code); q.onsuccess = () => { res(!!q.result); r.result.close(); }; }; }), c.code); assert(saved);
  await d.evaluate(() => { const cc = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); cc.wdaysProp = { v: [5, 3], at: Date.now() }; DPApp.A.tab('client'); }); await d.waitForTimeout(150); assert.strictEqual(await d.locator('.wdprop').count(), 0, 'اقتراح مطابق للحقل لا يُعرض');
  ok('الأخصائي يضغط شرائح الأيام فيُحفظ c.wdays ([3، 5]) بنفس الصيغة (أرقام 0–6)، واقتراح مطابق لا يُعرض');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await L.close(); console.log('\nنجح', n, 'اختبارات أيام التمرين');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
