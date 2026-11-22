// 1.42 (طلب المالك): صورة الملف الشخصي للأخصائي — رفع من الترويسة أو من الإعدادات، قص مربع 256، حفظ في الإعدادات المشفّرة، وإزالة.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), zlib = require('zlib'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const URL = fileUrl(path.resolve(__dirname, '../admin.html'));
const png = (w, h) => { const crc = (b) => { let c, t = []; for (let k = 0; k < 256; k++) { c = k; for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[k] = c >>> 0; } c = 0xFFFFFFFF; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const ch = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 40; raw[o + 1] = 126 + (x % 60); raw[o + 2] = 145; }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); };
(async () => {
  const br = await chromium.launch(), ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(URL); await login(p);
  assert.strictEqual(await p.locator('#hd .uchip label.meav img').count(), 0); assert.strictEqual((await p.textContent('#hd .uchip .meav')).trim().length, 1);
  await p.setInputFiles('#hd .uchip .mefile', { name: 'me.png', mimeType: 'image/png', buffer: png(400, 300) });
  await p.waitForSelector('#hd .uchip .meav img');
  const s = await p.evaluate(() => { const i = document.querySelector('#hd .uchip .meav img'); return { src: i.src.slice(0, 23), w: i.naturalWidth, h: i.naturalHeight, kb: Math.round(DPApp.S.settings.me.photo.length / 1024) }; });
  assert.deepStrictEqual([s.src, s.w, s.h], ['data:image/jpeg;base64,', 256, 256]); assert(s.kb < 60, s.kb + 'KB');
  ok('الترويسة: الضغط على الدائرة يرفع صورة، تُقص مربعة 256×256 JPEG (' + s.kb + ' كيلوبايت) وتظهر مكان الحرف');
  await p.waitForTimeout(300); await p.reload(); await login(p); await p.waitForTimeout(500); await p.waitForSelector('#hd .uchip .meav img'); ok('الصورة محفوظة في الإعدادات وتبقى بعد إعادة الفتح');
  await p.evaluate(() => { DPApp.S.setTab = 'theme'; DPApp.A.settings(); }); await p.waitForSelector('main .mecard'); assert(await p.isVisible('main .mecard .meav img'));
  await p.click('main .mecard [data-a="meDel"]'); await p.waitForFunction(() => !document.querySelector('#hd .uchip .meav img')); assert(!(await p.evaluate(() => (DPApp.S.settings.me || {}).photo)));
  await p.setInputFiles('main .mecard .mebtn .mefile', { name: 'me.png', mimeType: 'image/png', buffer: png(120, 200) }); await p.waitForSelector('#hd .uchip .meav img');
  await p.setInputFiles('main .mecard .mebtn .mefile', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('x') }); await p.waitForFunction(() => [...document.querySelectorAll('.toast, #toast')].some((t) => /اختر ملف صورة/.test(t.textContent)), null, { timeout: 3000 });
  ok('الإعدادات ← المظهر: بطاقة «الملف الشخصي» للرفع والإزالة، وترفض غير الصور');
  const m = await (await br.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage(); m.on('pageerror', (e) => errs.push(String(e))); await m.goto(URL); await login(m);
  assert.strictEqual(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false); ok('الجوال: بلا تمرير أفقي في الترويسة');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات صورة الأخصائي 1.42');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
