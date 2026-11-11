// مجموعات «شات زنها» والتحديات (0.93): الأخصائي ينشئ تحدياً ويضيف عميلاً، العميل يسجّل إنجازاً بصورة وماء، الترتيب والجوائز، والمحطة لا ترى شيئاً مقروءاً، وحذف العضو يجدّد المفاتيح
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, env, hxCheck, cPoll, close } = await linked('grp', errs);
  await d.click('.rail [data-a="hxv"]'); await hxCheck(); await d.evaluate(() => DPApp.A.zchat()); await d.waitForSelector('.gpnewb');
  await d.click('.gpnewb'); await d.fill('#gnName', 'تحدي رمضان'); await d.check('[data-gnm]'); await d.click('[data-a="gpCreate"]');
  await d.waitForFunction(() => window.GPX.list().length === 1, null, { timeout: 15000 }); assert(await d.locator('.chrow', { hasText: 'تحدي رمضان' }).count() === 1); ok('الأخصائي ينشئ مجموعة تحدٍّ ويضيف عميلاً، وتظهر في القائمة الجانبية');
  await d.waitForSelector('text=الإعدادات'); assert(await d.locator('[data-gt]:checked').count() >= 3); await d.click('[data-a="gpSaveChal"]'); await d.waitForSelector('.gpbody .ucard'); ok('إعداد التحدي (قالب الوجبات) وحفظه وإرساله');
  await cPoll(); await m.waitForFunction(() => window.ZCX && window.ZCX.list().length === 1, null, { timeout: 10000 }); assert(await m.evaluate(() => window.ZCX.list()[0].chal.tools.length >= 3)); ok('العميل يتلقّى المجموعة والتحدي ومفتاحها من الأخصائي وحده عبر رسالته المشفّرة');
  await m.click('[data-act="tab"][data-v="today"]'); assert(/شات زنها/.test(await m.textContent('.chatbtn'))); await m.click('.chatbtn'); await m.waitForSelector('.zcrow'); assert.strictEqual(await m.locator('.zcrow').count(), 3); await m.click('.zcrow[data-act="zcOpen"]'); await m.waitForSelector('.zcacts');
  ok('زر «شات زنها» عند العميل يفتح قائمة: الأخصائي والمجموعة وملفي');
  const [fc] = await Promise.all([m.waitForEvent('filechooser'), m.click('.zcacts [data-v="meal"]')]); await fc.setFiles({ name: 'meal.jpg', mimeType: 'image/jpeg', buffer: Buffer.from((await m.evaluate(() => { const c = document.createElement('canvas'); c.width = 64; c.height = 48; const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 64, 48); return c.toDataURL('image/jpeg'); })).split(',')[1], 'base64') });
  await m.waitForFunction(() => window.ZCX.board(window.ZCX.cur().gid).some((u) => u.pts >= 10), null, { timeout: 15000 }); ok('العميل يصوّر وجبته فتُشفَّر الصورة وتُرفع ويُحتسب (+10)');
  await m.evaluate(() => { document.querySelector('.zcacts [data-v="water"]').click(); }); await m.waitForFunction(() => window.ZCX.board(window.ZCX.cur().gid).some((u) => u.pts >= 12), null, { timeout: 10000 });
  ok('وتسجيل «ماء» يُضاف (+2)');
  await m.evaluate(() => { window.ZCX.cur(); }); await m.click('.zctabs [data-v="rank"]'); await m.waitForSelector('.zcrows'); assert(/ترتيب اليوم/.test(await m.textContent('.zcbody'))); assert(/🎁/.test(await m.textContent('.zcbody'))); ok('تبويب «الترتيب» عند العميل: اليوم والإجمالي والجوائز');
  await d.evaluate(() => window.GPX.poll()); await d.waitForFunction(() => window.GPX.list()[0].msgs.filter((x) => x.body.t === 'act').length >= 1, null, { timeout: 10000 });
  await d.evaluate(() => window.GPX.post(window.GPX.list()[0], { t: 'act', tool: 'meal', nm: 'سارة' })); await d.evaluate(() => window.GPX.poll());
  const rows = await d.evaluate(() => window.GPX.board(window.GPX.list()[0].gid).map((u) => [u.pts, u.rank])); assert(rows.length === 2 && rows[0][0] >= rows[1][0], JSON.stringify(rows)); ok('الأخصائي يستقبل الإنجازات ويحسب الترتيب بنفسه (مرسلان)');
  await d.evaluate(() => { DPApp.A.gpOpen(window.GPX.list()[0].gid); DPApp.A.gpTab('rank'); }); await d.waitForSelector('.gprows'); assert.strictEqual(await d.locator('.gprows').count() >= 2, true); await d.click('[data-a="gpClose"]'); await d.waitForFunction(() => (DPApp.S.clients[0].rewards || []).length === 1, null, { timeout: 10000 }); const rw = await d.evaluate(() => DPApp.S.clients[0].rewards[0]); assert(rw.st === 'pending' && rw.rank === 1 && /خصم/.test(rw.label), JSON.stringify(rw)); ok('صفحة الترتيب، واعتماد النتيجة يسجّل جائزة الأول في ملف العميل «بانتظار اعتمادك»');
  const raw = env.DB._raw.prepare('SELECT body FROM gmsgs').all().map((x) => x.body).join(''); assert(raw.length > 50 && !/سارة|meal|water|تحدي/.test(raw), 'المحطة ترى نصاً مقروءاً!'); ok('المحطة تخزّن رسائل المجموعة مشفّرة فقط');
  await d.evaluate(() => { DPApp.A.gpTab('set'); }); await d.waitForSelector('[data-gmem]'); const oldGid = await d.evaluate(() => window.GPX.list()[0].gid); await d.uncheck('[data-gmem]'); await d.click('[data-a="gpSaveMem"]');
  await d.waitForFunction((o) => window.GPX.list()[0].gid !== o, oldGid, { timeout: 15000 }); await cPoll(); await m.waitForFunction(() => window.ZCX.list().length === 0, null, { timeout: 10000 }); ok('حذف عضو يجدّد هوية المجموعة، ويُسحب منه الوصول');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(String(e).slice(0, 1500)); process.exit(1); });
