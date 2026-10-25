// شريط الخطة وصف الصنف (0.47): «تصدير وإرسال ▾» و«إعادة توليد» و«المزيد ▾»، قائمة «⋯» لكل صنف (قسّم/دمج/عدّل)، الكمية بجانب الاسم،
// اسم العيادة والأخصائي في الإعدادات، وأزرار رفع الملفات بالعربية.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  const vis = (s) => p.evaluate((q) => { const e = document.querySelector(q); return !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, s);
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'سلمى'); await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 3 }); await p.waitForTimeout(150);
  await p.click('main [data-a="gen"]'); await p.waitForSelector('.pbar');
  assert.strictEqual(await p.locator('.pbar > button, .pbar > details').count(), 3, 'ثلاثة عناصر في الشريط'); assert.strictEqual(await p.locator('main #br_c').count(), 0, 'لا حقول عيادة في شريط الخطة');
  assert(!(await vis('.pbar [data-a="docx"]'))); await p.click('.pbar summary.o'); for (const k of ['docx', 'print', 'html']) assert(await vis('.pbar [data-a="' + k + '"]'), k);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.pbar [data-a="docx"]')]); assert(/\.docx$/.test(dl.suggestedFilename())); await p.waitForTimeout(100); assert(!(await vis('.pbar [data-a="docx"]')), 'القائمة تُغلق بعد الاختيار');
  await p.click('.pbar summary:not(.o)'); assert(await vis('.pbar [data-a="newPhr"]') && await vis('.pbar [data-a="ver"]')); await p.click('.pnav', { position: { x: 5, y: 5 } }); assert(!(await vis('.pbar [data-a="newPhr"]')), 'تُغلق بالنقر خارجها');
  ok('شريط الخطة: «تصدير وإرسال ▾» (Word/PDF/HTML) و«إعادة توليد» و«المزيد ▾»؛ القائمة تُغلق بعد الاختيار أو بالنقر خارجها');
  await p.click('.pnav button[data-v="0"]'); await p.waitForSelector('table.dt details.im');
  const row = await p.evaluate(() => { const l = document.querySelector('table.dt td.f .iln'); const t = l.textContent; return { qAfterName: t.indexOf('×') > t.indexOf('•') + 3, alt: !!l.querySelector(':scope > [data-a="alt"]'), menuBtns: [...l.querySelectorAll('details.im .imx button')].map((b) => b.dataset.a) }; });
  assert(row.qAfterName && row.alt && row.menuBtns.includes('ren'), JSON.stringify(row)); assert(!(await vis('table.dt details.im .imx')));
  await p.click('table.dt details.im >> nth=0 >> summary'); assert(await vis('table.dt details.im[open] .imx'));
  const lc0 = await p.locator('input[data-le]').count(); const split = p.locator('table.dt details.im[open] [data-a="split"]'); if (await split.count()) { await split.click(); await p.waitForSelector('.toast:has-text("قُسِّمت")'); assert.strictEqual(await p.locator('input[data-le]').count(), lc0 + 1); }
  const w = await p.evaluate(() => { const f = document.querySelector('table.dt td.f').getBoundingClientRect().width, t = document.querySelector('table.dt').getBoundingClientRect(), pg = document.querySelector('.pg').getBoundingClientRect(); return { f, fits: t.left >= pg.left - 1 && t.right <= pg.right + 1 }; });
  assert(w.f >= 175 && w.fits, JSON.stringify(w));
  ok('صف الصنف: «بدّل» ظاهر و«⋯» يجمع قسّم/دمج/عدّل الاسم، الكمية (× حصة) بعد الاسم، وعمود المكونات أعرض والجدول داخل الصفحة');
  await p.click('.rail [data-a="settings"]'); await p.waitForSelector('#br_c'); await p.fill('#br_c', 'عيادة النور'); await p.press('#br_c', 'Tab'); await p.fill('#br_s', 'د. منى'); await p.press('#br_s', 'Tab');
  assert.deepStrictEqual(await p.evaluate(() => { const b = JSON.parse(localStorage.getItem('dpw_brand') || '{}'); return [b.clinic, b.specialist]; }), ['عيادة النور', 'د. منى']);
  ok('اسم العيادة والأخصائي في «الإعدادات ← الحصص والبدائل» بجانب الشعار ويُحفظان');
  assert.strictEqual(await p.evaluate(() => getComputedStyle(document.getElementById('logoFile')).opacity), '0', 'الحقل الأصلي مخفي'); assert.strictEqual((await p.textContent('#logoFile + .fpk')).replace(/\s+/g, ' ').trim(), '🖼 اختر صورة لم يُختر ملف');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#logoFile + .fpk button')]); assert(fc.element());
  await p.click('.stg [data-a="setTab"][data-v="ath"]'); await p.waitForSelector('#athFile + .fpk'); assert(/اختر ملفاً/.test(await p.textContent('#athFile + .fpk')));
  await p.setInputFiles('#athFile2', { name: 'قياسات.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2') }); await p.waitForTimeout(150); const nm = await p.textContent('#athFile2 + .fpk .fpkn'); assert(/قياسات\.csv/.test(nm), nm);
  ok('أزرار رفع الملفات بالعربية («🖼 اختر صورة» / «📎 اختر ملفاً» و«لم يُختر ملف» ثم اسم الملف) بدل Choose File، وتفتح نافذة اختيار الملف');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await b.close(); console.log('\nنجح', n, 'اختبارات شريط الخطة وصف الصنف');
})().catch((e) => { console.log('✘', e.message.slice(0, 900)); console.log(errs.join('\n')); process.exit(1); });
