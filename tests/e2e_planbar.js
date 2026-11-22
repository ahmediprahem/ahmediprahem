// شريط الخطة وصف الصنف (0.47، ومحدَّث 1.37): «عدّل في مسار الإنشاء» و«الإرسال والتصدير» و«المزيد ▾» (الإرسال والتصدير في خطوة «الإرسال» وحدها)، قائمة «⋯» لكل صنف (قسّم/دمج/عدّل)، الكمية بجانب الاسم،
// اسم العيادة والأخصائي في الإعدادات، وأزرار رفع الملفات بالعربية.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  const vis = (s) => p.evaluate((q) => { const e = document.querySelector(q); return !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, s);
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سلمى'); await p.selectOption('[data-f="sex"]', 'ذكر').catch(() => { }); await p.fill('[data-f="age"]', '30'); await p.fill('[data-f="weight"]', '80'); await p.fill('[data-f="height"]', '175'); await p.press('[data-f="height"]', 'Tab'); await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 3 }); await p.waitForTimeout(150);
  await p.evaluate(() => DPApp.A.gen()); await p.waitForSelector('.pbar');
  assert.strictEqual(await p.locator('.pbar > button, .pbar > details').count(), 3, 'ثلاثة عناصر في الشريط'); assert.strictEqual(await p.locator('main #br_c').count(), 0, 'لا حقول عيادة في شريط الخطة');
  assert(!(await vis('.pbar [data-a="docx"]')) && (await p.locator('.pbar [data-a="hxSendOrInvite"], .pbar [data-a="wkPick"], .pbar [data-a="gen"], .pbar [data-a="genBank"]').count()) === 0, 'لا إرسال ولا تصدير ولا قوالب ولا إعادة توليد في الشريط');
  await p.click('.pbar [data-a="genOpen"][data-v="5"]'); await p.waitForSelector('.gensend .genout'); for (const k of ['docx', 'print', 'html']) assert(await vis('.genout [data-a="genExp"][data-v="' + k + '"]'), k);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.genout [data-a="genExp"][data-v="docx"]')]); assert(/\.docx$/.test(dl.suggestedFilename())); await p.waitForSelector('.pbar');
  await p.click('.pbar .tbmore summary'); assert(await vis('.pbar [data-a="newPhr"]') && await vis('.pbar [data-a="ver"]')); await p.click('.pnav', { position: { x: 5, y: 5 } }); assert(!(await vis('.pbar [data-a="newPhr"]')), 'تُغلق بالنقر خارجها');
  ok('شريط الخطة (1.37): «عدّل في مسار الإنشاء» و«الإرسال والتصدير» و«المزيد ▾»؛ التصدير Word/PDF/HTML من خطوة «الإرسال» وحدها؛ القائمة تُغلق بالنقر خارجها');
  // 0.60 (ب6): شريط خطة البنك هو شريط المحرك نفسه — نفس الأزرار بنفس الترتيب والأسماء، ومعها «صفحة HTML» و«حفظ كقالب»
  const barOf = (root) => p.evaluate((r) => [...document.querySelectorAll(r + ' .pbar > button, ' + r + ' .pbar > details > summary, ' + r + ' .pbar .tbsplit > button, ' + r + ' .pbar .tbsplit summary, ' + r + ' .pbar .tbp button')].map((e) => (e.dataset.a || 'menu') + ':' + e.textContent.replace(/آخر إرسال v\d+|\(ادعُ العميل أولاً\)/g, '').trim()).filter((x) => !/^(newPhr|rdReset):/.test(x)), root);
  const eng = await barOf('main'); assert.deepStrictEqual(eng.map((x) => x.split(':')[0]), ['genOpen', 'genOpen', 'menu', 'wkSaveTpl', 'ver'], JSON.stringify(eng));
  globalThis.PR = 'قالب بنك'; p.on('dialog', (dg) => dg.accept(dg.type() === 'prompt' ? globalThis.PR : undefined));
  const bid = await p.evaluate(() => RL.idx.plans.filter((x) => x.sx !== 'g')[0].i); await p.evaluate((id) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); DPApp.A.rdApprove(id, { getAttribute: () => c.code }); }, bid);
  await p.waitForSelector('.rdplan .pbar', { timeout: 15000 }); const bank = await barOf('.rdplan'); assert.deepStrictEqual(bank, eng, 'شريط البنك يختلف:\n' + bank.join('\n') + '\n---\n' + eng.join('\n'));
  await p.click('.rdplan .pbar [data-a="genOpen"][data-v="5"]'); await p.waitForSelector('.genout'); const [bh] = await Promise.all([p.waitForEvent('download'), p.click('.genout [data-a="genExp"][data-v="html"]')]); assert(/\.html$/.test(bh.suggestedFilename())); const bt = require('fs').readFileSync(await bh.path(), 'utf8'); assert(bt.includes('class="pg"') && !bt.includes('data-a="rdSwap"'), 'صفحة HTML لخطة البنك'); await p.waitForSelector('.rdplan .pbar');
  await p.click('.rdplan .pbar .tbmore summary'); await p.click('.rdplan .pbar [data-a="wkSaveTpl"]'); await p.waitForSelector('.toast:has-text("حُفظ القالب")');
  assert.strictEqual(await p.evaluate(() => DPApp.S.settings.tpls.filter((t) => t.src === 'ready').length), 1);
  ok('شريط خطة البنك = شريط المحرك: نفس ' + eng.length + ' عناصر بالترتيب والأسماء (عدّل في المسار، الإرسال والتصدير، المزيد: حفظ كقالب/إصدار)، و«صفحة HTML» من «الإرسال» و«حفظ كقالب» يعملان للبنك');
  await p.evaluate(() => DPApp.A.gen()); await p.waitForSelector('.pnav button[data-v="0"]');
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
