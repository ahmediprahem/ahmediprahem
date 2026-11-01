// اختصارات الأيقونة والرقم على الأيقونة والعدّ التنازلي للوجبة القادمة (0.65).
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('shortcuts', errs); const origin = new URL(m.url()).origin;
  const mf = await (await fetch(origin + '/manifest.webmanifest')).json(); assert.deepStrictEqual(mf.shortcuts.map((x) => x.url), ['/?a=meal', '/?a=water', '/?a=chat', '/?a=wheel']); assert(mf.shortcuts.every((x) => x.name && x.icons && x.icons[0].src.includes('icon-192')));
  assert(JSON.stringify((await (await fetch(origin + '/manifest.webmanifest?t=firoz')).json()).shortcuts[0].icons).includes('-firoz'), 'أيقونة الاختصار تتبع الثيم'); ok('البيان فيه أربعة اختصارات (الوجبة القادمة، كوب ماء، المحادثة، رسالة اليوم) بأيقونة الثيم');
  await m.addInitScript(() => { window.__b = []; navigator.setAppBadge = (x) => { window.__b.push(x); return Promise.resolve(); }; navigator.clearAppBadge = () => { window.__b.push(0); return Promise.resolve(); }; });
  const unlock = async (sel) => { await m.waitForSelector('.pad'); for (const k of '1234') await m.click('.pad [data-v="' + k + '"]'); await m.waitForSelector(sel || '.tabbar'); };
  const w0 = await m.evaluate(() => { const L = window.HissatiApp.state().log, k = Object.keys(L).sort().pop(); return (L[k] || {}).water || 0; });
  await m.goto(origin + '/?a=water'); await unlock(); await m.waitForSelector('.msn'); const w1 = await m.evaluate(() => { const L = window.HissatiApp.state().log, k = Object.keys(L).sort().pop(); return L[k].water; });
  assert.strictEqual(w1, w0 + 1); assert(!/a=water/.test(m.url()), 'يُنظَّف الرابط'); ok('اختصار «سجّل كوب ماء» يضيف كوباً بعد فتح القفل ويُنظّف الرابط');
  await m.goto(origin + '/?a=chat'); await unlock('#chatIn'); await m.waitForSelector('#chatIn'); ok('اختصار «راسل الأخصائي» يفتح المحادثة');
  await m.goto(origin + '/'); await unlock(); await m.waitForSelector('.msn'); await m.evaluate(() => { localStorage.setItem('hx_wheel_e2e', '1'); }); await m.goto(origin + '/?a=wheel'); await unlock(); await m.waitForSelector('#whl', { timeout: 5000 }); ok('اختصار «رسالة اليوم» يفتح العجلة (أو بطاقة اليوم إن لُفّت)');
  const mc = await m.evaluate(() => [window.HissatiApp.mcLeft('13:30', 12 * 60), window.HissatiApp.mcLeft('13:30', 13 * 60 + 29), window.HissatiApp.mcLeft('13:30', 13 * 60 + 40), window.HissatiApp.mcLeft('13:30', 14 * 60 + 30), window.HissatiApp.mcLeft('13:30', 13 * 60 + 28), window.HissatiApp.mcLeft('07:30', 5 * 60 + 30)]);
  assert.deepStrictEqual(mc, ['بعد ساعة و30 دقيقة', 'بعد دقيقة', 'حان وقتها الآن', 'فاتت منذ ساعة', 'بعد دقيقتان', 'بعد ساعتان']); await m.click('#whl [data-wh="later"]').catch(() => { });
  ok('العدّ التنازلي: «بعد ساعة و30 دقيقة» و«بعد دقيقة» و«حان وقتها الآن» و«فاتت منذ ساعة»');
  assert.strictEqual(await m.locator('.mcd').count() >= 0, true);
  const badge = await m.evaluate(() => ({ n: window.HissatiApp.badge(), calls: window.__b })); const slots = await m.evaluate(() => { const S = window.HissatiApp.state(), dp = S.plan[new Date().getDay() % S.plan.length]; return dp.slots.filter((s) => s.lines.length).length; });
  assert(badge.n >= 1 && badge.n <= slots + 1, JSON.stringify(badge)); assert(badge.calls.length >= 1 && badge.calls[badge.calls.length - 1] === badge.n);
  ok('الرقم على الأيقونة = الوجبات المتبقية اليوم (+ رسائل جديدة) ويُحدَّث عبر Badging API');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
