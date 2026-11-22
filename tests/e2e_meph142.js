// 1.42 (موافقة المالك): صورة الأخصائي تظهر للعميل في «زنها» — رسالة مشفّرة «prof» بصورة مصغّرة 128px عند الرفع والإزالة، وتُرفض غير صور JPEG.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const L = await linked('meph142', errs), d = L.d, m = L.m;
  const data = await d.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#287E91'; g.fillRect(0, 0, 300, 300); g.fillStyle = '#fff'; g.beginPath(); g.arc(150, 120, 50, 0, 7); g.fill(); return c.toDataURL('image/png'); });
  await d.setInputFiles('#hd .uchip .mefile', { name: 'me.png', mimeType: 'image/png', buffer: Buffer.from(data.split(',')[1], 'base64') }); await d.waitForSelector('#hd .uchip .meav img'); await d.waitForTimeout(800);
  const th = await d.evaluate(() => { const t = DPApp.S.settings.me.thumb; return [t.slice(0, 23), t.length < 60000]; }); assert.deepStrictEqual(th, ['data:image/jpeg;base64,', true]);
  await L.cPoll(); await L.cPoll();
  let s = await m.evaluate(() => { const S = window.HissatiApp.state(); return { ph: (S.dph || '').slice(0, 23), card: !!document.querySelector('.card.dr .av img') }; });
  assert.strictEqual(s.ph, 'data:image/jpeg;base64,'); ok('رفع الصورة في زنها Pro يرسلها مشفّرة (128px) إلى العميل المرتبط، فتُحفظ في «زنها»');
  await m.evaluate(() => { const b = document.querySelector('[data-act="chat"]'); if (b) b.click(); }); await m.waitForTimeout(300);
  const chatImg = await m.evaluate(() => !!document.querySelector('.chat .who .av img')); const cardImg = await m.evaluate(() => !!document.querySelector('.card.dr .av img'));
  assert(chatImg || cardImg, 'لا صورة في واجهة العميل'); ok('«زنها»: صورة الأخصائي مكان الحرف' + (chatImg ? ' في رأس المحادثة' : ' في بطاقة الأخصائي'));
  await d.evaluate(() => DPApp.A.meDel()); await d.waitForTimeout(600); await L.cPoll(); await L.cPoll();
  assert.strictEqual(await m.evaluate(() => window.HissatiApp.state().dph), ''); ok('إزالة الصورة تصل العميل فيعود الحرف');
  const bad = await m.evaluate(() => { const S = window.HissatiApp.state(); return S.dph; }); assert.strictEqual(bad, '');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await L.close(); console.log('\nنجح ' + n + ' اختبارات صورة الأخصائي في «زنها» 1.42');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
