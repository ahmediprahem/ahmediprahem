// قياس الأسبوع وصور التقدم و«صفحتي الصحية» (0.53): بعد 7 أيام بطاقة «⚖ قياس الأسبوع» (تعليمات ثابتة، الوزن والخصر بأرقام عربية، صورة إنبودي/تحاليل)،
// وقبله بيوم «غداً موعد قياسك»؛ كل أسبوعين «📸 صورة التقدم» بموافقة منفصلة للنشر؛ «صفحتي الصحية» في «تقدّمي»؛ وكلها تصل «حصة» مشفّرة وتظهر في «الحضور» (قبل وبعد) والفرز.
const assert = require('assert'), path = require('path'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('weekly', errs);
  assert.strictEqual(await m.locator('.wkc').count(), 1, 'في البداية: صورة البداية فقط'); assert(/صورة البداية/.test(await m.textContent('.wkc'))); await m.click('[data-act="bdLater"]'); assert.strictEqual(await m.locator('.wkc').count(), 0, '«ليس الآن» يؤجلها');
  await m.evaluate(() => { window.HissatiApp.state().planAt = Date.now() - 6.2 * 864e5; }); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]');
  assert(/غداً موعد قياسك الأسبوعي/.test(await m.textContent('.wkc'))); await m.evaluate(() => { delete window.HissatiApp.state().bdSnooze; });
  await m.evaluate(() => { window.HissatiApp.state().planAt = Date.now() - 15 * 864e5; }); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]');
  assert.strictEqual(await m.locator('.wkc').count(), 2, 'القياس + صورة التقدم');
  ok('«حصتي»: «📸 صورة البداية» من أول يوم (و«ليس الآن» يؤجلها)، وقبل الموعد بيوم «⏰ غداً موعد قياسك»، وبعد 7 أيام «⚖ قياس الأسبوع»، وكل أسبوعين «📸 صورة التقدم»');
  await m.click('[data-act="wkGo"]'); await m.waitForSelector('#wkW'); assert(/على الريق بعد دخول الحمام/.test(await m.textContent('.scr')));
  await m.click('[data-act="wkSend"]'); await m.waitForSelector('.toast:has-text("اكتب وزنك")');
  await m.fill('#wkW', '٨٤٫٥'); await m.fill('#wkWs', '93');
  const [fc] = await Promise.all([m.waitForEvent('filechooser'), m.click('[data-act="wkPic"][data-v="inb"]')]); await fc.setFiles(path.join(__dirname, 'fixtures/inbody.jpg')); await m.waitForSelector('.wkth');
  assert.strictEqual(await m.inputValue('#wkW'), '84.5', 'القيم تبقى بعد اختيار الصورة'); await m.click('[data-act="wkSend"]'); await m.waitForSelector('.toast:has-text("وصل قياس الأسبوع")');
  ok('قياس الأسبوع: تعليمات ثابتة للقياس، الوزن إجباري (أرقام عربية ٨٤٫٥)، الخصر وصورة الإنبودي اختيارية، ويُرسل');
  await m.click('[data-act="bdGo"]'); assert(await m.isDisabled('[data-act="bdSend"]'));
  const [fc2] = await Promise.all([m.waitForEvent('filechooser'), m.click('[data-act="bdPic"]')]); await fc2.setFiles(path.join(__dirname, 'fixtures/body.jpg')); await m.waitForSelector('.bdpv');
  assert(/بعد إخفاء الوجه/.test(await m.textContent('.consent'))); assert(!(await m.isChecked('#bdPub')), 'الموافقة على النشر غير مفعّلة افتراضياً'); await m.check('#bdPub'); await m.click('[data-act="bdSend"]'); await m.waitForSelector('.toast:has-text("صورة التقدم")');
  assert.strictEqual(await m.locator('.wkc').count(), 0, 'البطاقتان تختفيان');
  ok('صورة التقدم: تعليمات ثابتة، موافقة النشر منفصلة وغير مفعّلة افتراضياً وتذكر إخفاء الوجه، والبطاقتان تختفيان بعد الإرسال');
  await m.click('[data-act="tab"][data-v="progress"]'); const hp = await m.textContent('.hp'); assert(/صفحتي الصحية/.test(hp) && /84.5 كجم/.test(hp) && /خصر 93/.test(hp) && /موعد القياس القادم/.test(hp), hp); assert(await m.locator('.hpb img').count() === 1);
  ok('«صفحتي الصحية» في «تقدّمي»: بياناتي، القياسات الأسبوعية بالأسهم، موعد القياس القادم، وصور التقدم');
  await cPoll(); await d.click('main .tabs [data-v="hx"]'); await hxCheck(); let c = await C();
  assert.strictEqual(c.weight, 84.5); assert.strictEqual(c.hx.checks[0].waist, 93); assert.strictEqual(c.hx.wkimgs[0].kind, 'inb'); assert(c.hx.bodies[0].pub); assert(c.med.visits.some((v) => v.w === 84.5 && v.waist === 93));
  await d.click('.rail [data-a="home"]'); const td = await d.textContent('.wktodo'); assert(/قياس أسبوعي جديد/.test(td) && /صورة تقدم جديدة/.test(td), td);
  await d.click('.wktodo .wkgo:has-text("قياس أسبوعي جديد")'); await d.waitForSelector('.ci .ciimgs img'); const ci = await d.textContent('.ci'); assert(/قياسات «حصتي» الأسبوعية/.test(ci) && /إنبودي/.test(ci) && /قبل وبعد/.test(ci) && /يوافق على نشر/.test(ci), ci);
  await d.click('.ci .ciimgs img'); await d.waitForSelector('.cizoom img'); await d.click('.cizoom');
  ok('«حصة»: القياس يحدّث الوزن ويُضاف زيارة في الملف الطبي، والصور تظهر في «الحضور» (إنبودي، قبل وبعد، حالة الموافقة) مع تكبير، والفرز ينبّه للجديد');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات القياس الأسبوعي');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
