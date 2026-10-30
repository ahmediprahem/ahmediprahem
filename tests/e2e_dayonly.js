// «يوم واحد في كل مرة» والعلامة المائية (0.51): يفعّله الأخصائي لكل عميل ← «حصتي» تعرض يومها فقط (بقية الأيام 🔒)،
// وجدول اليوم ينتظر تسجيل أمس (زر «التزمت بأمس كله») أو يُفتح تلقائياً في الساعة المحددة، واسم العميل وكوده على الجدول وفي Word والطباعة.
const assert = require('assert'), path = require('path'), { execFileSync } = require('child_process'), linked = require('./hx_link_helper'), { TMP } = require('./_tmp.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('dayonly', errs);
  assert(await m.locator('.wmk span').count() > 3); assert(/منى علي • C\d+/.test(await m.textContent('.wmk span')));
  ok('«حصتي»: علامة مائية خفيفة باسم العميل وكوده على شاشة الجدول (الخطة لا تصلح لغيره)');
  await d.click('main .tabs [data-v="hx"]'); await d.check('[data-hxgate]'); await d.waitForSelector('.toast:has-text("يوم واحد في كل مرة")'); await d.selectOption('[data-hxgateh]', '14'); await d.waitForTimeout(400);
  assert.strictEqual((await C()).hx.gate, true); await cPoll();
  let g = await m.evaluate(() => window.HissatiApp.state().gate); assert(g && g.on && g.h === 14, JSON.stringify(g));
  assert(await m.isVisible('#daylog'), 'أول يوم بعد التفعيل مفتوح');
  ok('الأخصائي يفعّل «يوم واحد في كل مرة» (وساعة الفتح التلقائي 14:00) لهذا العميل فقط، ويصل «حصتي» فوراً، وأول يوم مفتوح');
  await m.evaluate(() => { const S = window.HissatiApp.state(); S.gate.from = '2000-01-01'; const t = new Date(); t.setHours(7, 0, 0, 0); const T = t.getTime(); window.__dn = window.__dn || Date.now; Date.now = () => T; window.HissatiApp.render ? window.HissatiApp.render() : null; });
  await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.gatec');
  assert(/جدول اليوم ينتظر تسجيل أمس/.test(await m.textContent('.gatec')) && /14:00/.test(await m.textContent('.gatec'))); assert.strictEqual(await m.locator('.card.meal').count(), 0, 'الوجبات مخفية');
  await m.click('[data-act="tab"][data-v="plan"]'); const chips = await m.textContent('.daychips'); assert((chips.match(/🔒/g) || []).length === 6, chips); assert(await m.isVisible('.gatec'));
  const other = await m.getAttribute('.daychips button:not(.today)', 'data-v'); await m.click('.daychips button[data-v="' + other + '"]'); assert(/يوماً بيوم/.test(await m.textContent('.gatec'))); assert.strictEqual(await m.locator('.plist').count(), 0);
  ok('قبل تسجيل أمس: «اليوم» يعرض «🔒 جدول اليوم ينتظر تسجيل أمس» بلا وجبات، و«خطتي» تُظهر اليوم وحده وباقي الأيام 🔒');
  await m.click('[data-act="tab"][data-v="today"]'); await m.click('.gatec [data-act="yAll"]'); await m.waitForSelector('#daylog'); assert(await m.locator('.card.meal').count() >= 3);
  await m.evaluate(() => { Date.now = window.__dn; }); await cPoll(); await hxCheck(); const c = await C(), ys = Object.keys(c.hx.logs).sort(), yl = c.hx.logs[ys[0]]; assert(yl.sub > 0 && yl.done === yl.n, JSON.stringify(yl));
  ok('«التزمت بأمس كله» يرسل تسجيل أمس (100% ✓) إلى «حصة» ويفتح جدول اليوم فوراً');
  await m.evaluate(() => { const S = window.HissatiApp.state(); Object.keys(S.log).forEach((k) => { delete S.log[k].sub; }); const t = new Date(); t.setHours(15, 0, 0, 0); const T = t.getTime(); window.__dn = window.__dn || Date.now; Date.now = () => T; });
  await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]'); assert(await m.isVisible('#daylog'), 'بعد ساعة الفتح يُفتح تلقائياً');
  ok('إن نسي العميل، يُفتح جدول اليوم تلقائياً بعد الساعة المحددة فلا يبقى بلا جدول');
  await d.click('main .tabs [data-v="plan"]'); const pwm = await d.textContent('.pg .pwm'); assert(/خاصة بـ منى علي • C\d+/.test(pwm), pwm);
  const [dl] = await Promise.all([d.waitForEvent('download'), d.evaluate(() => document.querySelectorAll('details.tbm').forEach((x) => { x.open = true; })).then(() => d.click('.pbar [data-a="docx"]'))]); const fp = path.join(TMP, 'dayonly.docx'); await dl.saveAs(fp);
  const xml = execFileSync('python3', ['-I', '-c', 'import sys,zipfile;print(zipfile.ZipFile(sys.argv[1]).read("word/document.xml").decode().count("خاصة بـ منى علي"))', fp]).toString();
  assert(+xml.trim() >= 9, 'العلامة على كل صفحة في Word: ' + xml);
  ok('صفحات الخطة (الطباعة وPDF) وكل صفحات Word تحمل «خاصة بـ اسم العميل • كوده»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات «يوم واحد في كل مرة»');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
