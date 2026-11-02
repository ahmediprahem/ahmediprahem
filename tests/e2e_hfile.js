// «ملفي الصحي» (0.63): تبويب يجمع الوزن والقياسات وInBody والفحوصات وصور التحول؛ يُحفظ مشفّراً ويصل «حصة» إن فعّل العميل الإرسال.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('hfile', errs);
  assert.strictEqual(await m.locator('.tabbar button').count(), 6); await m.click('[data-act="tab"][data-v="file"]'); await m.waitForSelector('.hfs');
  assert((await m.textContent('h2')).includes('ملفي الصحي')); assert.strictEqual(await m.locator('.hfs').count(), 5, 'خمسة أقسام: الوزن والقياسات وInBody والفحوصات وصور التحول');
  const tiles = await m.textContent('.card.stack .stats3'); assert(/88/.test(tiles) && /مؤشر الكتلة/.test(tiles), 'ملخص: الوزن ومؤشر الكتلة'); assert(/33\.5|33.5/.test(await m.textContent('.card.stack .stats3')) , 'مؤشر الكتلة 88 كجم و162 سم');
  ok('تبويب «ملفي» (٦ تبويبات): ملخص بالوزن ومؤشر الكتلة وخمسة أقسام');
  await m.click('[data-act="hfNew"][data-v="meas"]'); await m.waitForSelector('#hf_waist'); await m.click('[data-act="hfSave"]'); assert(await m.locator('#hf_waist').count() === 1, 'لا حفظ بلا قياس');
  await m.fill('#hf_waist', '٩٢'); await m.fill('#hf_chest', '104.5'); await m.fill('#hf_hips', '110'); await m.click('[data-act="hfSave"]'); await m.waitForSelector('.hfs');
  assert(/92/.test(await m.textContent('.hfs:nth-of-type(2)')) || /92/.test(await m.textContent('main, .stack')));
  await m.click('[data-act="hfNew"][data-v="inb"]'); await m.fill('#hf_fat', '28.5'); await m.fill('#hf_mus', '31'); await m.fill('#hf_visc', '9'); await m.click('[data-act="hfSave"]'); await m.waitForSelector('.hfs');
  await m.click('[data-act="hfNew"][data-v="lab"]'); await m.selectOption('#hf_n', 'فيتامين د'); assert.strictEqual(await m.inputValue('#hf_u'), 'ng/mL'); await m.fill('#hf_v', '22'); await m.click('[data-act="hfSave"]'); await m.waitForSelector('.hfs');
  await m.click('[data-act="hfNew"][data-v="lab"]'); await m.selectOption('#hf_n', 'فيتامين د'); await m.fill('#hf_v', '31'); await m.click('[data-act="hfSave"]'); await m.waitForSelector('.hfs');
  const body = await m.textContent('.stack'); assert(/فيتامين د/.test(body) && /31/.test(body) && /↑ 9/.test(body), 'آخر فحص مع فرق عن السابق'); assert(/28\.5/.test(body) && /31/.test(body));
  const st = await m.evaluate(() => { const S = window.HissatiApp.state(); return { meas: S.meas.length, inb: S.inb.length, labs: S.labs.length, m0: S.meas[0], sent: [S.meas[0].s, S.inb[0].s, S.labs[1].s] }; });
  assert.deepStrictEqual([st.meas, st.inb, st.labs], [1, 1, 2]); assert.strictEqual(st.m0.waist, 92); assert.deepStrictEqual(st.sent, [1, 1, 1]);
  ok('تسجيل قياسات الجسم وInBody وفحصين (فيتامين د مرتين: يظهر الفرق ↑) بأرقام عربية وإنجليزية، ولا حفظ بلا قيمة');
  await cPoll(); await hxCheck(); const c = await C(); const x = c.hx;
  assert.strictEqual((x.meas || []).length, 1); assert.strictEqual(x.meas[0].waist, 92); assert.strictEqual(x.meas[0].chest, 104.5); assert.strictEqual((x.inb || []).length, 1); assert.strictEqual(x.inb[0].fat, 28.5); assert.strictEqual((x.labs || []).length, 2); assert.strictEqual(x.labs[1].v, 31);
  ok('تصل «حصة» مشفّرةً: قياسات الجسم وInBody والفحوصات بقيمها');
  await m.click('[data-act="hfTog"]'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().hfSend), 0);
  await m.click('[data-act="hfNew"][data-v="meas"]'); await m.fill('#hf_waist', '90'); await m.click('[data-act="hfSave"]'); await m.waitForSelector('.hfs'); assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().meas[1].s), 0, 'محفوظ على الجوال فقط');
  await cPoll(); await hxCheck(); assert.strictEqual(((await C()).hx.meas || []).length, 1, 'لم يُرسل');
  await m.click('[data-act="hfSendAll"]'); await cPoll(); await hxCheck(); assert.strictEqual(((await C()).hx.meas || []).length, 2); assert.strictEqual(((await C()).hx.meas[1] || {}).waist, 90);
  ok('إيقاف الإرسال التلقائي يبقي القياس على الجوال وحده، و«أرسل المحفوظة» ترسله لاحقاً');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
