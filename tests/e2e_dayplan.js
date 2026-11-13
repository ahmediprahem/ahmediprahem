// 0.98: «تخطيط اليوم» في «خطتي»: أهداف تلقائية من الخطة تُشطب وحدها، وأهداف يكتبها العميل يشطبها بقلم رصاص، وأفكار سريعة،
// وغير المنجز ينتقل للغد «من أمس»، والأخصائي يرى نسبة الإنجاز فقط، والمفكرة تأخذ ألوان كل ثيم
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, d, close, cPoll, hxCheck } = await linked('dayplan', errs), shot = process.env.DP_SHOT, snap = (f) => shot ? m.screenshot({ path: shot + f + '.png' }) : null;
  await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="pt"][data-v="day"]'); await m.waitForSelector('.nbk');
  const autos = await m.locator('.plr.auto').count(); assert(autos >= 3, 'وجبات وماء وحركة'); assert(/آكل وجباتي في مواعيدها/.test(await m.innerText('.nbk')) && /أشرب ماء اليوم/.test(await m.innerText('.nbk')) && /أتحرك 30 دقيقة/.test(await m.innerText('.nbk')));
  assert.strictEqual(await m.locator('.plr.auto.done').count(), 0); ok('«خطتي» ← «تخطيط اليوم»: صفحة مفكرة فيها أهداف تلقائية من الخطة (الوجبات، الماء، الحركة)');
  // الماء يُشطب تلقائياً
  await m.click('.plr.auto:has-text("أشرب ماء") [data-act="plGo"]'); await m.waitForSelector('#wrow'); const g = await m.locator('.cups button').count(); await m.locator('.cups button').nth(g - 1).click(); await m.waitForTimeout(200);
  await m.click('[data-act="pt"][data-v="day"]'); await m.waitForSelector('.plr.auto.done:has-text("أشرب ماء") .plk'); ok('بلوغ هدف الماء يشطب «أشرب ماء اليوم» وحده بخط القلم، ولمس الهدف يأخذ إلى مكانه');
  // هدف مكتوب + فكرة سريعة
  await m.fill('#plIn', 'أتصل بأمي'); await m.press('#plIn', 'Enter'); await m.waitForSelector('.plr:not(.auto):has-text("أتصل بأمي")');
  await m.click('.nbid .chip >> nth=0'); await m.waitForFunction(() => document.querySelectorAll('.plr:not(.auto)').length === 2);
  await m.click('.plr:has-text("أتصل بأمي") [data-act="plTog"]'); await m.waitForSelector('.plr.done:has-text("أتصل بأمي") .plk.anim'); await m.waitForTimeout(700); await snap('1');
  ok('يكتب العميل هدفه (Enter يضيفه) أو يضيف فكرة سريعة بلمسة، والتعليم يرسم خط رصاص متحركاً فوق النص');
  // إخفاء هدف تلقائي وإظهاره، وحذف هدف
  await m.click('.plr.auto:has-text("أتحرك") [data-act="plHide"]'); await m.waitForSelector('.nbre'); assert(!/أتحرك 30 دقيقة/.test(await m.innerText('.pll')));
  await m.click('.nbre'); await m.waitForFunction(() => /أتحرك 30 دقيقة/.test(document.querySelector('.nbk').innerText));
  const idea = await m.locator('.plr:not(.auto):not(.done) .plx').first().innerText(); await m.click('.plr:not(.auto):not(.done) [data-act="plDel"]'); await m.waitForFunction((t) => ![...document.querySelectorAll('.plr .plx')].some((x) => x.innerText === t), idea);
  ok('يخفي العميل هدفاً تلقائياً لا يريده ويُظهره، ويحذف هدفاً كتبه');
  // الأخصائي يرى النسبة فقط
  const st = await m.evaluate(() => { const S = window.HissatiApp.state(), k = Object.keys(S.pl).sort().pop(); return S.pl[k]; });
  await m.evaluate(() => { const b = document.querySelector('[data-act="plTog"]:not([disabled])'); }); await m.waitForTimeout(2800); await cPoll(); await hxCheck();
  const lg = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.hx && x.hx.logs), ks = Object.keys(c.hx.logs).sort(); return c.hx.logs[ks[ks.length - 1]]; });
  assert(lg.pl && lg.pl.n >= 4 && lg.pl.d >= 2, JSON.stringify(lg.pl)); assert(!JSON.stringify(lg).includes('أتصل بأمي'), 'النص لا يصل للأخصائي');
  ok('الأخصائي يرى «تخطيط اليوم: ' + lg.pl.d + ' من ' + lg.pl.n + ' أهداف» في المتابعة اليومية، ولا يصله نص أي هدف');
  await m.fill('#plIn', 'أرتّب المطبخ'); await m.click('[data-act="plAdd"]'); await m.waitForSelector('.plr:has-text("أرتّب المطبخ")');
  // الانتقال للغد
  await m.evaluate(() => { const T = Date.now() + 864e5; window.__dn0 = Date.now; Date.now = () => T; }); await m.click('[data-act="pt"][data-v="meals"]'); await m.click('[data-act="pt"][data-v="day"]'); await m.waitForSelector('.nbk');
  const carried = await m.locator('.plr:not(.auto) .plsub.from').count(); assert.strictEqual(carried, 1, 'غير المنجز ينتقل'); assert(/أرتّب المطبخ/.test(await m.innerText('.nbk'))); assert.strictEqual(await m.locator('.plr:has-text("أتصل بأمي")').count(), 0, 'المنجز لا ينتقل');
  await m.click('[data-act="plOff"][data-v="-1"]'); await m.waitForSelector('.plr.done:has-text("أتصل بأمي")'); assert.strictEqual(await m.locator('#plIn').count(), 0, 'الأمس للقراءة');
  await m.click('[data-act="plOff"][data-v="1"]'); await m.evaluate(() => { Date.now = window.__dn0; }); ok('في اليوم التالي: غير المنجز من أهدافي ينتقل موسوماً «من أمس» والمنجز لا ينتقل، وصفحة الأمس للقراءة بسهم «اليوم السابق»');
  // الثيمات
  const cols = {}; for (const th of ['classic', 'rose', 'pulse', 'firoz']) { await m.evaluate((t) => HxTheme.set(t), th); await m.waitForTimeout(500); await m.click('[data-act="pt"][data-v="meals"]'); await m.click('[data-act="pt"][data-v="day"]'); await m.waitForSelector('.nbk');
    cols[th] = await m.evaluate(() => { const x = document.querySelector('.plx'), k = document.querySelector('.plk path'); return [getComputedStyle(x).color, k ? getComputedStyle(k).stroke : '']; }); if (shot) await m.locator('.nbk').screenshot({ path: shot + 'th_' + th + '.png' }); }
  assert(new Set(Object.values(cols).map((x) => x[0])).size >= 2, JSON.stringify(cols)); Object.values(cols).forEach((x) => assert.strictEqual(x[0], x[1], 'لون القلم من نص الثيم'));
  await m.evaluate(() => HxTheme.set('classic')); ok('المفكرة تأخذ ألوان كل ثيم (الحالي، وردة، نبض، فيروز): الورقة والسطور والقلم من ألوان الثيم');
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.plhm'); assert(/تخطيط اليوم/.test(await m.innerText('.plhm'))); await m.click('.plhm'); await m.waitForSelector('.nbk'); ok('بطاقة «تخطيط اليوم» في الرئيسية بعدد الأهداف المنجزة، ولمسها يفتح المفكرة');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
