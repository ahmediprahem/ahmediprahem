// 1.10 ملصقات المحادثة: ملصقات العميل في «زنها» وملصقات الأخصائي في «شات زنها»، تصل الطرف الآخر صورةً، وتُحذف كأي رسالة
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [], SH = process.env.ST_SHOTS || '';
(async () => {
  const L = await linked('stickers', errs, { path: 'tailor' }), { d, m, hxCheck: hc, cPoll, C } = L, code = (await C()).code;
  const hxCheck = async () => { await d.evaluate(() => DPApp.A.hxv()); await hc(); await d.evaluate((c) => { DPApp.A.zchat(); DPApp.A.czOpen(c); }, code); };
  const all = await m.evaluate(() => Object.values(window.HXST).map((x) => x[0])); assert(all.filter((x) => x === 'c').length >= 25 && all.filter((x) => x === 'd').length >= 45); ok('ملصقات: ' + all.filter((x) => x === 'd').length + ' للأخصائي و' + all.filter((x) => x === 'c').length + ' للعميل');
  await m.click('[data-act="chat"] >> nth=0'); await m.click('[data-act="skp"]'); await m.waitForSelector('.skp img');
  const cs = await m.$$eval('.skp [data-act="sk"]', (b) => b.map((x) => x.dataset.v)); assert(cs.length >= 25); assert(await m.evaluate((ks) => ks.every((k) => HXST[k][0] === 'c'), cs)); ok('لوحة العميل فيها ملصقات العميل فقط');
  if (SH) await m.screenshot({ path: SH + '/client_panel.png' });
  await m.click('.skp [data-act="sk"][data-v="c07"]'); await m.waitForSelector('.bub.stk img.hxsk'); ok('العميل أرسل ملصقاً فظهر صورةً في المحادثة'); await cPoll();
  await d.evaluate((c) => { DPApp.A.zchat(); DPApp.A.czOpen(c); }, code); await hxCheck(); await d.waitForSelector('#chBody .chb.stk img.hxsk'); ok('وصل الملصق للأخصائي صورةً');
  await d.click('[data-a="czSkp"]'); await d.waitForSelector('.chskp img'); const ds = await d.$$eval('.chskp [data-a="czSk"]', (b) => b.map((x) => x.dataset.v)); assert(await d.evaluate((ks) => ks.every((k) => HXST[k][0] === 'd'), ds) && ds.length >= 45); ok('لوحة الأخصائي فيها ملصقاته فقط');
  if (SH) await d.screenshot({ path: SH + '/pro_panel.png' });
  await d.click('.chskp [data-a="czSk"][data-v="d21"]'); await d.waitForFunction(() => document.querySelectorAll('#chBody .chb.me.stk').length === 1); await cPoll();
  await m.waitForFunction(() => document.querySelectorAll('.bub:not(.me).stk img').length === 1, null, { timeout: 8000 }); ok('ملصق الأخصائي وصل للعميل');
  if (SH) { await m.screenshot({ path: SH + '/client_chat.png' }); await d.screenshot({ path: SH + '/pro_chat.png' }); }
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
