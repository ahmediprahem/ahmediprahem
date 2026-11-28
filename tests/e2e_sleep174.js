// 1.74 (م6) النوم: يُسجَّل في «زنها» لكل العملاء تلقائياً (الساعات والجودة) ← يصل «زنها Pro»: بطاقة «متوسط النوم» بمدة كل يوم، وتنبيه «نوم قليل» إذا متوسط آخر 3 أيام < 6
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('sleep174', errs);
  await m.click('[data-act="tab"][data-v="today"]').catch(() => { }); await m.waitForSelector('[data-hb="sleep"]');
  assert(await m.evaluate(() => window.HissatiApp.state().habits.includes('sleep'))); ok('«زنها»: بطاقة النوم ظاهرة لكل عميل تلقائياً (دون أن يفعّلها الأخصائي)');
  await m.click('[data-hb="sleep"] [data-act="hb"][data-v="sleep"][data-k="5"]'); await m.waitForSelector('[data-hb="sleep"] [data-v="sleepQ"]'); await m.click('[data-hb="sleep"] [data-v="sleepQ"][data-k="b"]');
  if (process.env.SHOTS) await m.locator('[data-hb="sleep"]').screenshot({ path: process.env.SHOTS + '/m6_zenha_sleep.png' });
  const h = await m.evaluate(() => { const S = window.HissatiApp.state(), k = Object.keys(S.log).sort().pop(); return S.log[k].h; }); assert.strictEqual(h.sleep, 5); assert.strictEqual(h.sleepQ, 'b'); ok('تسجيل الساعات (5) ثم جودة النوم (سيئ)');
  await m.click('[data-act="tab"][data-v="plan"]'); await m.waitForSelector('#daylog'); await m.click('#daylog [data-act="subDay"]'); await m.waitForSelector('#daylog:has-text("أُرسل تسجيل اليوم ✓")'); await cPoll();
  await d.evaluate(() => DPApp.A.tab('hx')); await hxCheck();
  const c = await C(), k = Object.keys(c.hx.logs).sort().pop(); assert.strictEqual(c.hx.logs[k].h.sleep, 5); assert.strictEqual(c.hx.logs[k].h.sleepQ, 'b'); ok('النوم وجودته يصلان «زنها Pro» مع سجل اليوم (مشفّراً)');
  await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.hx); const key = (n) => { const t = new Date(Date.now() - n * 864e5); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
    [[1, 5.5], [2, 6], [4, 8]].forEach((x) => { const l = c.hx.logs[key(x[0])] = c.hx.logs[key(x[0])] || {}; l.h = Object.assign({}, l.h, { sleep: x[1] }); }); DPApp.S.cur = c.code; DPApp.A.tab('ov'); });
  await d.waitForSelector('main .sl174'); const t = await d.textContent('main .sl174'); assert(/متوسط النوم/.test(t) && /آخر ليلة 5 ساعات \(سيئ\)/.test(t)); assert.strictEqual(await d.locator('main .sl174 .slb').count(), 7);
  assert(await d.$('main .sl174.low')); assert(/أقل من 6/.test(await d.textContent('main .sl174 .warn'))); if (process.env.SHOTS) { await d.waitForTimeout(800); await d.locator('main .sl174').screenshot({ path: process.env.SHOTS + '/m6_pro_sleep.png' }); } ok('«نظرة عامة»: بطاقة «متوسط النوم» بمدة كل يوم (7 أعمدة) وآخر ليلة وجودتها، وتنبيه عند متوسط 3 أيام < 6');
  await d.evaluate(() => DPApp.A.home ? DPApp.A.home() : null); await d.waitForSelector('.wktodo'); assert(/نوم قليل: متوسط 5.5 ساعات/.test(await d.textContent('.wktodo'))); if (process.env.SHOTS) await d.locator('.wktodo').screenshot({ path: process.env.SHOTS + '/m6_pro_alert.png' }); ok('«من يحتاج اهتمامك اليوم؟»: «نوم قليل» بمتوسط آخر 3 أيام');
  await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.hx); const t = new Date(Date.now() - 864e5), k = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); c.hx.logs[k].h.sleep = 8; DPApp.A.home(); });
  await d.waitForSelector('.wktodo'); assert(!/نوم قليل/.test(await d.textContent('.wktodo'))); ok('متوسط 3 أيام ≥ 6 (5، 8، 6): لا تنبيه');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء');
  await close(); console.log('\nنجح', n, 'اختبارات النوم 1.74');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
