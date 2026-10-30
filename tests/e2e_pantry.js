// «المتوفر عندي» و«أكمل ملفك» والكارب سايكل مع أيام التمرين (0.52) من طرف إلى طرف:
// العميل يختار لكل وجبة ما عنده (✓) أو يقدر يوفّره (◐) مع حد أدنى (بروتين ونشوية) و«لا أريد سناك» ← يصل «حصة» ويظهر في صفحته ويستعمله المحرك؛
// بعد 3 أيام «أكمل ملفك» سؤال في كل صفحة ← يصل ملفه (الخصر، العمل، التمرين وأيامه، المتابعة)؛ وخطة كارب سايكل من البنك تضع الكارب العالي على أيام تمرينه.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('pantry', errs);
  await m.waitForSelector('.pancard [data-act="panGo"]'); await m.click('.pancard [data-act="panGo"]'); await m.waitForSelector('.scr.pan');
  assert(/الفطور/.test(await m.textContent('.scr.pan h2'))); assert(await m.isDisabled('.foot .btn:not(.sec)'), 'التالي معطّل قبل اختيار بروتين');
  const tap = async (i) => { await m.click('.scr.pan .fgrid .food >> nth=' + i); };
  await tap(0); await tap(1); await tap(1); assert(/اختر نشوية/.test(await m.textContent('.scr.pan')));
  await m.click('.scr.pan .tabs button >> nth=1'); await tap(0); await tap(2); assert(!(await m.isDisabled('.foot .btn:not(.sec)')));
  if (process.env.SHOTS) await m.screenshot({ path: process.env.SHOTS + '/pan.png' });
  await m.click('.foot .btn:not(.sec)'); assert(/الغداء/.test(await m.textContent('.scr.pan h2'))); await tap(0); await tap(3); await m.click('.scr.pan .tabs button >> nth=1'); await tap(1);
  await m.click('.foot .btn:not(.sec)'); assert(/العشاء/.test(await m.textContent('.scr.pan h2'))); await tap(4); await m.click('.foot .btn:not(.sec)');
  assert(/السناك/.test(await m.textContent('.scr.pan h2'))); assert(await m.isDisabled('.foot .btn:not(.sec)')); await m.click('[data-act="panNoS"]'); assert(/لن تُضاف وجبة سناك/.test(await m.textContent('.scr.pan')));
  await m.click('.foot .btn:not(.sec)'); await m.waitForSelector('.tabbar'); assert.strictEqual(await m.locator('.pancard').count(), 0, 'البطاقة تختفي حتى الأسبوع القادم');
  const P = await m.evaluate(() => window.HissatiApp.state().pantry); assert(Object.values(P.B).includes('h') && Object.values(P.B).includes('c') && P.noS);
  ok('«ما المتوفر عندك؟»: وجبة في كل صفحة، لمسة = ✓ متوفر ولمستان = ◐ أقدر أوفّره، و«التالي» يشترط بروتين ونشوية، والسناك «لا أريد سناك»');
  await cPoll(); await hxCheck(); let c = await C(); assert(c.pantry && Object.keys(c.pantry.B).length === 4 && Object.keys(c.pantry.L).length === 3 && c.pantry.noS && c.panUse === true, JSON.stringify(c.pantry));
  await d.click('main .tabs [data-v="client"]'); await d.waitForSelector('.panbox'); await d.click('.panbox summary'); const pb = await d.textContent('.panbox');
  assert(/الفطور \(4\)/.test(pb) && /◐/.test(pb) && /لا يريد سناك/.test(pb) && /يُستعمل في التوليد/.test(pb), pb);
  const before = c.meals; await d.click('[data-a="panNoSnack"]'); c = await C(); assert(before > 3 && c.meals === 3);
  await d.evaluate(() => { document.activeElement && document.activeElement.blur(); }); await d.click('main [data-a="gen"]'); await d.waitForSelector('.pnav'); c = await C();
  const bNames = Object.keys(c.pantry.B), hit = c.plan.days.filter((dd) => dd.slots.some((s) => s.type === 'B' && s.lines.some((l) => bNames.includes(l.name)))).length;
  assert(hit >= 5, 'أيام فطور من المتوفر: ' + hit); assert(!c.plan.days.some((dd) => dd.slots.some((s) => s.type === 'S')), 'بلا سناك');
  ok('«حصة»: القائمة تصل مشفّرة وتظهر في صفحة العميل («🛒 المتوفر عند العميل»)، «اجعل الوجبات 3» لمن لا يريد سناك، والمحرك يبني الفطور من المتوفر عنده');
  await m.evaluate(() => { const S = window.HissatiApp.state(); S.planAt = Date.now() - 4 * 864e5; }); await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="tab"][data-v="today"]');
  await m.waitForSelector('[data-act="pfGo"]'); await m.click('[data-act="pfGo"]'); await m.waitForSelector('.rq h2'); assert(/محيط خصرك/.test(await m.textContent('.rq h2')));
  await m.fill('#pfNum', '٩٤'); await m.click('.foot .btn:not(.sec)'); await m.click('.rqo:has-text("عمل مكتبي")'); await m.click('.rqo:has-text("مصري")'); await m.click('.foot .btn:not(.sec)');
  await m.click('.rqo:has-text("متزوج")'); await m.click('.rqo:has-text("نقص فيتامين د")'); await m.click('.rqo:has-text("أنيميا")'); await m.click('.foot .btn:not(.sec)');
  await m.click('.rqo:has-text("نعم")'); assert(/نوع تمرينك/.test(await m.textContent('.rq h2'))); await m.click('.rqo:has-text("حديد")'); await m.click('.foot .btn:not(.sec)');
  assert(/أيام التمرين/.test(await m.textContent('.rq h2'))); for (const i of [0, 2, 4]) await m.click('[data-act="pfDay"][data-v="' + i + '"]'); await m.click('.foot .btn:not(.sec)');
  await m.click('.rqo:has-text("60 دقيقة")'); await m.click('.rqo:has-text("أونلاين")'); assert(/عن طريق/.test(await m.textContent('.rq h2'))); await m.click('.rqo:has-text("فيديو")'); await m.click('.foot .btn:not(.sec)');
  await m.waitForSelector('.tabbar'); assert.strictEqual(await m.locator('[data-act="pfGo"]').count(), 0);
  ok('«أكمل ملفك» بعد 3 أيام: سؤال في كل صفحة (الخصر بأرقام عربية، العمل، الجنسية، الحالة الاجتماعية، الفيتامينات، التمرين ونوعه وأيامه ومدته، المتابعة وطريقتها)، والأسئلة التابعة تظهر حسب الإجابة');
  await cPoll(); await d.click('main .tabs [data-v="hx"]'); await hxCheck(); c = await C(); assert.strictEqual(c.prof.waist, 94); assert.deepStrictEqual(c.prof.trD, [0, 2, 4]); assert.deepStrictEqual(c.wdays, [0, 2, 4]); assert.deepStrictEqual(c.prof.ch, ['فيديو']);
  await d.click('main .tabs [data-v="ci"]'); const ci = await d.textContent('.ci'); for (const w of ['ملفه من «حصتي»', '94 سم', 'عمل مكتبي', 'نقص فيتامين د، أنيميا / نقص حديد', 'الأحد، الثلاثاء، الخميس', 'أونلاين (فيديو)']) assert(ci.includes(w), w + '\n' + ci);
  ok('الملف يصل «حصة» ويظهر في «الحضور»، وأيام التمرين تُحفظ للعميل');
  const id = await d.evaluate(() => RL.idx.plans.filter((p) => /^carbcycle_eg|^acc_eg/.test(p.f) && p.sx !== 'g')[0].i);
  await d.evaluate((pid) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return new Promise((r) => { DPApp.A.rdApprove(pid, { getAttribute: () => c.code }); setTimeout(r, 1500); }); }, id);
  await d.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.readyDoc && c.readyDoc.aligned; }, null, { timeout: 15000 });
  c = await C(); const lv = c.readyDoc.days.map((y) => (/كارب (عالي|مرتفع)/.test(y.t) ? 3 : /متوسط/.test(y.t) ? 2 : /منخفض/.test(y.t) ? 1 : 0)), top = lv.slice().sort((a, b) => b - a).slice(0, 3);
  assert.deepStrictEqual([lv[0], lv[2], lv[4]].sort((a, b) => b - a), top, 'أيام التمرين أعلى كارب: ' + lv.join(','));
  ok('خطة كارب سايكل من البنك: أيام الكارب العالي تقع تلقائياً على أيام تمرين العميل (الأحد والثلاثاء والخميس)');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات المتوفر والملف');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
