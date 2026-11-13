// «طبق اليوم» (0.97): قطاع لكل وجبة يمتلئ بنسبة ما عُلِّم منها؛ يظهر في «خطتي» فوق الوجبات وفي الرئيسية، ويكتمل مع اكتمال اليوم
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('plate', errs), shot = process.env.PLATE_SHOT;
  await m.click('[data-act="tab"][data-v="plan"]'); await m.waitForSelector('.plc .plsvg');
  const slots = await m.evaluate(() => { const s = window.HissatiApp.state(); return s.plan[new Date().getDay() % s.plan.length].slots.map((x) => x.lines.length); });
  const sc = () => m.evaluate(() => [...document.querySelectorAll('.plc .plf')].map((p) => +p.style.getPropertyValue('--s')));
  assert.strictEqual(await m.locator('.plc .plf').count(), slots.length); assert.deepStrictEqual(await sc(), slots.map(() => 0)); assert(/0%/.test(await m.textContent('.plc .num')));
  assert.strictEqual(await m.locator('.plleg span').count(), slots.length); ok('طبق اليوم في «خطتي»: قطاع لكل وجبة، فارغ في البداية، ومفتاح بأسماء الوجبات');
  await m.click('.meal >> nth=0 >> [data-act="ck"] >> nth=0'); await m.waitForFunction(() => +document.querySelector('.plc .plf').style.getPropertyValue('--s') > 0);
  let s = await sc(); assert(Math.abs(s[0] - Math.sqrt(1 / slots[0])) < 0.01, 'المساحة = نسبة الأصناف: ' + s[0]); assert(s.slice(1).every((x) => x === 0));
  assert(/plgrow/.test(await m.evaluate(() => document.querySelector('.plc .plf').style.animation)), 'يمتلئ بحركة'); if (shot) { await m.waitForTimeout(700); await m.locator('.plc').screenshot({ path: shot + '1.png' }); }
  ok('تعليم صنف واحد: يمتلئ قطاع وجبته فقط بمساحة تساوي نسبته، بحركة نموّ');
  await m.click('.meal >> nth=1 >> [data-act="whole"]'); await m.waitForSelector('.plc .plf.full'); s = await sc(); assert.strictEqual(s[1], 1); assert(/check|svg/.test(await m.innerHTML('.plleg span.full b')));
  if (slots.length > 2) { await m.click('.meal >> nth=2 >> [data-act="skip"]'); await m.waitForSelector('.plc .plb.skip'); assert(/لم آكلها/.test(await m.textContent('.plleg span.skip'))); await m.click('.meal >> nth=2 >> [data-act="skip"]'); await m.waitForFunction(() => !document.querySelector('.plc .plb.skip')); }
  if (shot) { await m.waitForTimeout(700); await m.locator('.plc').screenshot({ path: shot + '4.png' }); }
  ok('«أكلتها كاملة» تملأ القطاع كله وتعلّمه في المفتاح، و«لم آكلها» ترسمه منقّطاً');
  for (let i = 0; i < slots.length; i++) { const done = await m.evaluate((i) => document.querySelectorAll('.plc .plf')[i].classList.contains('full'), i); if (!done) { await m.click('.meal >> nth=' + i + ' >> [data-act="whole"]'); await m.waitForFunction((i) => document.querySelectorAll('.plc .plf')[i].classList.contains('full'), i); if ((await sc())[i] !== 1) { await m.click('.meal >> nth=' + i + ' >> [data-act="whole"]'); } } }
  await m.waitForSelector('.plc.all .plsvg.all'); assert(/100%/.test(await m.textContent('.plc .num')) && /طبق كامل/.test(await m.textContent('.plc'))); if (shot) { await m.waitForTimeout(700); await m.locator('.plc').screenshot({ path: shot + '2.png' }); }
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('button.plc.all'); assert.strictEqual(await m.locator('.card.ring').count(), 0); if (shot) await m.locator('.plc').screenshot({ path: shot + '3.png' });
  await m.click('button.plc'); await m.waitForSelector('section.plc'); ok('اكتمال كل الوجبات: «طبق كامل» ١٠٠٪ بحافة مضيئة؛ والطبق في الرئيسية بدل الحلقة ولمسه يفتح «خطتي»');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
