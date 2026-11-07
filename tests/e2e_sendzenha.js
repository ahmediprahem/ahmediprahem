// 0.60 (ب4، ب5): «أرسل إلى زنها» أول بند في «تصدير وإرسال ▾» لكل أنواع الخطط، وتبويب «زنها» ظاهر لكل عميل.
// غير المرتبط: حالة فارغة بثلاث معاينات وزر «ادعُ [الاسم] إلى زنها»، والبند يفتح الدعوة مملوءة. المرتبط: البند يرسل وتصل الخطة.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  // ---- 0) جهاز غير مربوط بالمحطة: التبويب ظاهر والزر يشرح الخطوة الناقصة
  const b0 = await chromium.launch(), p0 = await (await b0.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p0.on('pageerror', (e) => errs.push(String(e)));
  await p0.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p0);
  await p0.click('.rail [data-a="new"][data-v="ex"]'); await p0.fill('[data-f="name"]', 'ريم'); await p0.press('[data-f="name"]', 'Tab'); await p0.waitForTimeout(150);
  await p0.click('main .tabs [data-v="hx"]'); await p0.waitForSelector('.hxempty'); await p0.click('.hxempty [data-a="hxInvC"]'); await p0.waitForSelector('.hxempty .warn [data-a="hxv"]');
  ok('جهاز غير مربوط: تبويب «زنها» ظاهر، و«ادعُ» يشرح أن الربط بالمحطة أولاً مع زر إليها');
  await b0.close();
  // ---- 1) أخصائي مربوط وعميل مرتبط (منى علي) عبر المساعد المشترك
  const L = await linked('sendzenha', errs), d = L.d, m = L.m;
  const C = () => d.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const tabs = () => d.evaluate(() => [...document.querySelectorAll('main .tabs.ctabs > button')].map((x) => x.dataset.v));
  // ---- 2) عميل غير مرتبط: التبويب ظاهر بمعايناته وزر الدعوة
  await d.click('.rail [data-a="new"][data-v="ex"]'); await d.fill('[data-f="name"]', 'سلمى حسن'); await d.fill('[data-f="phone"]', '0509876543'); await d.fill('[data-f="age"]', '31'); await d.fill('[data-f="weight"]', '72'); await d.fill('[data-f="height"]', '165');
  await d.selectOption('[data-f="goal"]', { index: 2 }); await d.selectOption('[data-f="activity"]', { index: 3 }); await d.press('[data-f="height"]', 'Tab'); await d.waitForTimeout(200);
  assert((await tabs()).includes('hx'), 'لا تبويب «زنها» لغير المرتبط'); await d.click('main .tabs [data-v="hx"]'); await d.waitForSelector('.hxempty');
  const em = await d.textContent('.hxempty'); for (const w of ['عميلك لم يتصل بـ«زنها» بعد', 'يرى خطته على جواله ويبدّل الأصناف', 'يسجّل يومه في 30 ثانية ويصلك الالتزام', 'تراسله وتتابع وزنه', 'ادعُ سلمى حسن إلى زنها']) assert(em.includes(w), w + '\n' + em);
  assert.strictEqual(await d.locator('.hxempty li').count(), 3); assert.strictEqual(await d.locator('.hxempty button:not(.sec)').count(), 1, 'زر أساسي واحد');
  ok('عميل غير مرتبط: تبويب «📲 زنها» ظاهر، وفيه «عميلك لم يتصل بـ«زنها» بعد» و3 معاينات وزر واحد «ادعُ سلمى حسن إلى زنها»');
  // ---- 3) «تصدير وإرسال ← أرسل إلى زنها» يفتح الدعوة مملوءة
  await d.click('main .tabs [data-v="client"]'); await d.click('main [data-a="gen"]'); await d.waitForSelector('.pbar');
  await d.click('.pbar summary.o'); const first = await d.evaluate(() => document.querySelector('.pbar .tbx .tbp button').dataset.a); assert.strictEqual(first, 'hxSendOrInvite', 'ليس أول بند');
  await d.click('.pbar [data-a="hxSendOrInvite"]'); await d.waitForSelector('.hxempty .hxform');
  assert.strictEqual(await d.inputValue('#hxi_l'), 'سلمى حسن'); assert.strictEqual(await d.inputValue('#hxi_p'), '0509876543'); assert.strictEqual(await d.inputValue('#hxi_s'), 'ex');
  await d.click('[data-a="hxInvMake"]'); await d.waitForSelector('.hxempty .hxinv.made .hxlink'); assert(/#t=/.test(await d.textContent('.hxempty .hxinv.made .hxlink')));
  assert.strictEqual(await d.locator('.hxempty [data-a="hxInvC"]').count(), 0, 'زر الدعوة لا يتكرر بعد إنشاء الرابط');
  ok('«تصدير وإرسال ▾» أول بنوده «أرسل إلى زنها»: لغير المرتبط يفتح تبويب «زنها» على الدعوة بالاسم والجوال والنظام من ملفه، و«إنشاء الرابط» يعرض رابط واتساب في التبويب نفسه');
  // ---- 4) عميل مرتبط: البند يرسل وتصل الخطة
  await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.hx); return DPApp.A.pick(c.code); }); await d.waitForTimeout(200);
  let c = await C(); const v0 = c.hx.planV; assert(v0 >= 1); await d.click('main .tabs [data-v="plan"]'); await d.waitForSelector('.pbar');
  await d.click('.pbar summary.o'); assert(/آخر إرسال v/.test(await d.textContent('.pbar [data-a="hxSendOrInvite"]')));
  await d.click('.pbar [data-a="hxSendOrInvite"]'); await d.waitForSelector('.toast:has-text("✓ وصلت الخطة v' + (v0 + 1) + '")', { timeout: 15000 });
  c = await C(); assert.strictEqual(c.hx.planV, v0 + 1); await L.cPoll(); await m.waitForFunction((v) => window.HissatiApp.state().pv === v, v0 + 1, { timeout: 10000 });
  ok('عميل مرتبط: «أرسل إلى زنها» من الشريط يرسل الخطة (v' + (v0 + 1) + ') بتأكيد «✓ وصلت الخطة»، وتصل إلى جوال العميل');
  // ---- 5) خطة البنك: البند نفسه في المكان نفسه
  const bid = await d.evaluate(() => RL.idx.plans.filter((p) => p.sx !== 'g')[0].i); await d.evaluate((id) => { const cc = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); DPApp.A.rdApprove(id, { getAttribute: () => cc.code }); }, bid);
  await d.waitForSelector('.rdplan .pbar', { timeout: 15000 }); await d.click('.rdplan .pbar summary.o'); assert.strictEqual(await d.evaluate(() => document.querySelector('.rdplan .pbar .tbx .tbp button').dataset.a), 'hxSendOrInvite');
  await d.click('.rdplan .pbar [data-a="hxSendOrInvite"]'); await d.waitForSelector('.toast:has-text("✓ وصلت الخطة v' + (v0 + 2) + '")', { timeout: 15000 });
  ok('خطة البنك: «أرسل إلى زنها» أول بند في القائمة نفسها ويرسلها (v' + (v0 + 2) + ')');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await L.close(); console.log('\nنجح', n, 'اختبارات «أرسل إلى زنها»');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
