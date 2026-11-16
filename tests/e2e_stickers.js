// 1.10 ملصقات المحادثة: ملصقات العميل في «زنها» وملصقات الأخصائي في «شات زنها»، تصل الطرف الآخر صورةً، وتُحذف كأي رسالة
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [], SH = process.env.ST_SHOTS || '';
(async () => {
  const L = await linked('stickers', errs, { path: 'tailor' }), { d, m, hxCheck: hc, cPoll, C } = L, code = (await C()).code;
  { const pk = require('fs').readFileSync(require('path').resolve(__dirname, '../design/stickers/stickers.json'), 'utf8'), db = L.env.DB; await db.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)').run();      // 1.12 الحزمة من D1
    for (let i = 0; i * 700000 < pk.length; i++) await db.prepare('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)').bind('st.' + i, pk.slice(i * 700000, (i + 1) * 700000)).run();
    await db.prepare('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)').bind('st.n', Math.ceil(pk.length / 700000) + '|test').run(); }
  const hxCheck = async () => { await d.evaluate(() => DPApp.A.hxv()); await hc(); await d.evaluate((c) => { DPApp.A.zchat(); DPApp.A.czOpen(c); }, code); };
  await m.evaluate(() => HXSK.load(location.origin)); const all = await m.evaluate(() => Object.values(window.HXST).map((x) => x[0])); assert(all.filter((x) => x === 'c').length >= 25 && all.filter((x) => x === 'd').length >= 45); ok('ملصقات: ' + all.filter((x) => x === 'd').length + ' للأخصائي و' + all.filter((x) => x === 'c').length + ' للعميل');
  await m.click('[data-act="chat"] >> nth=0'); await m.click('[data-act="skp"]'); await m.waitForSelector('.skp img');
  const cs = await m.$$eval('.skp [data-act="sk"]', (b) => b.map((x) => x.dataset.v)); assert(cs.length >= 25); assert(await m.evaluate((ks) => ks.every((k) => HXST[k][0] === 'c' && HXST[k][3] !== 'm'), cs)); assert(await m.evaluate(() => Object.values(HXST).filter((x) => x[3] === 'm').length >= 25)); ok('لوحة العميلة: ملصقات العميل بشخصية امرأة والمحايدة فقط (وملصقات الرجل للعملاء الرجال)');
  if (SH) await m.screenshot({ path: SH + '/client_panel.png' });
  await m.click('.skp [data-act="sk"][data-v="c07"]'); await m.waitForSelector('.bub.stk img.hxsk'); ok('العميل أرسل ملصقاً فظهر صورةً في المحادثة'); await cPoll();
  await d.evaluate((c) => { DPApp.A.zchat(); DPApp.A.czOpen(c); }, code); await hxCheck(); await d.waitForSelector('#chBody .chb.stk img.hxsk'); ok('وصل الملصق للأخصائي صورةً');
  await d.click('[data-a="czSkp"]'); await d.waitForSelector('.chskp img'); const ds = await d.$$eval('.chskp [data-a="czSk"]', (b) => b.map((x) => x.dataset.v)); assert(await d.evaluate((ks) => ks.every((k) => HXST[k][0] === 'd'), ds) && ds.length >= 45); ok('لوحة الأخصائي فيها ملصقاته فقط');
  await d.click('[data-a="czStg"][data-v="f"]'); await d.waitForSelector('.chskp img'); assert(await d.evaluate(() => [...document.querySelectorAll('.chskp [data-a="czSk"]')].every((b) => HXST[b.dataset.v][3] !== 'm') && [...document.querySelectorAll('.chskp [data-a="czSk"]')].some((b) => HXST[b.dataset.v][3] === 'f'))); ok('الأخصائية تختار شخصيتها: تظهر ملصقات الأخصائية والمحايدة فقط');
  if (SH) await d.screenshot({ path: SH + '/pro_panel.png' }); await d.click('[data-a="czStg"][data-v=""]'); await d.waitForSelector('.chskp img');
  await d.click('.chskp [data-a="czSk"][data-v="d21"]'); await d.waitForFunction(() => document.querySelectorAll('#chBody .chb.me.stk').length === 1); await cPoll();
  await m.waitForFunction(() => document.querySelectorAll('.bub:not(.me).stk img').length === 1, null, { timeout: 8000 }); ok('ملصق الأخصائي وصل للعميل');
  await m.click('[data-act="skp"]'); await m.waitForSelector('[data-act="skNew"]');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4AWP4z8DwHwMYGBgYGBgYAAB2Cwz/4mXVKQAAAABJRU5ErkJggg==', 'base64');
  const [fc] = await Promise.all([m.waitForEvent('filechooser'), m.click('[data-act="skNew"]')]); await fc.setFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
  await m.waitForSelector('[data-act="skMine"]'); ok('العميل صنع ملصقاً من صورة فظهر في «ملصقاتي»');
  await m.click('[data-act="skMine"]'); await m.waitForFunction(() => [...document.querySelectorAll('.bub.me.stk img')].some((i) => i.src.startsWith('data:image/'))); await cPoll(); await hxCheck();
  await d.waitForSelector('[data-a="czSkSave"]'); await d.click('[data-a="czSkSave"]'); assert(await d.evaluate(() => JSON.parse(localStorage.getItem('zn_myst') || '[]').length === 1)); ok('ملصق العميل الخاص وصل للأخصائي، وحفظه في ملصقاته');
  if (SH) { await m.screenshot({ path: SH + '/client_chat.png' }); await d.screenshot({ path: SH + '/pro_chat.png' }); }
  assert.deepStrictEqual(errs, []); await L.close(); console.log('\nنجح ' + n + ' اختبارات');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
