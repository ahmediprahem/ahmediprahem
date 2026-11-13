// 0.97: «طبق الوجبة» فوق الوجبة التي عليها الدور فقط (قطاع لكل صنف) والباقي مطوي؛ كوبان ماء قبل كل وجبة رئيسية بربع ساعة (من هدف اليوم نفسه)
// وتذكيرهما؛ و«التزامك اليوم» في الرئيسية: الماء والأكل والحركة بنسب وجملة تحفيزية وأضعف جانب
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { m, close } = await linked('plate', errs), shot = process.env.PLATE_SHOT, snap = (f) => shot ? m.screenshot({ path: shot + f + '.png' }) : null;
  await m.click('[data-act="tab"][data-v="plan"]'); await m.waitForSelector('.plc .plsvg');
  const P = await m.evaluate(() => { const A = window.HissatiApp, S = A.state(), sl = S.plan[new Date().getDay() % S.plan.length].slots; return { names: sl.map((s) => s.name), lines: sl.map((s) => s.lines.length) }; });
  assert.strictEqual(await m.locator('.plc').count(), 1, 'طبق واحد فقط'); assert.strictEqual(await m.locator('.card.meal').count(), 1, 'وجبة واحدة مفتوحة');
  assert.strictEqual(await m.locator('.pmlist .pmrow').count(), P.names.length - 1, 'الباقي قائمة مطوية');
  const si = +(await m.getAttribute('.plc', 'data-si')), nl = P.lines[si]; assert.strictEqual(await m.locator('.plc .plf').count(), nl, 'قطاع لكل صنف');
  ok('«خطتي» اليوم: طبق واحد فوق الوجبة التي عليها الدور (قطاع لكل صنف)، وباقي الوجبات قائمة مطوية');
  const sc = () => m.evaluate(() => [...document.querySelectorAll('.plc .plf')].map((p) => +p.style.getPropertyValue('--s')));
  await m.locator('.card.meal [data-act="ck"]').first().click(); await m.waitForFunction(() => +document.querySelector('.plc .plf').style.getPropertyValue('--s') === 1);
  let s = await sc(); assert(s[0] === 1 && s.slice(1).every((x) => x === 0)); assert(/plgrow/.test(await m.evaluate(() => document.querySelector('.plc .plf').style.animation)));
  await m.waitForTimeout(700); await snap('1'); ok('تعليم صنف يملأ قطاعه بحركة نموّ');
  // ماء ما قبل الوجبة
  const wp = await m.evaluate(() => window.HissatiApp.__wp ? 0 : 1); void wp;
  const main = P.names.map((x, i) => /فطور|إفطار|افطار|غداء|غذاء|عشاء/.test(x) ? i : -1).filter((i) => i >= 0);
  if (!main.includes(si) && main.length) { await m.click('.pmrow[data-v="' + main[0] + '"]'); await m.waitForSelector('.pmopen .wpre'); }
  if (main.length) {
    assert(await m.locator('.wpre').count() >= 1); const w0 = await m.evaluate(() => window.HissatiApp.state().log[Object.keys(window.HissatiApp.state().log).sort().pop()].water || 0);
    await m.click('.wpre [data-act="wpre"]'); await m.waitForSelector('.wpre.on'); await snap('w'); const w1 = await m.evaluate(() => { const L = window.HissatiApp.state().log; return L[Object.keys(L).sort().pop()].water; }); assert.strictEqual(w1, w0 + 2, 'كوبان');
    await m.click('.wpre [data-act="wpre"]'); await m.waitForSelector('.wpre:not(.on)'); if (!main.includes(si)) { await m.click('.pmopen .pmfold'); await m.waitForFunction(() => !document.querySelector('.pmopen')); }
  }
  const rem = await m.evaluate(() => { const S = window.HissatiApp.state(); S.rem = Object.assign({}, S.rem, { water: true, meals: true }); return window.HissatiApp.remItems(); });
  if (rem) { const pre = rem.filter((x) => x.t === 'wpre'), meals = rem.filter((x) => x.t === 'meal'); assert.strictEqual(pre.length, main.length, JSON.stringify(rem)); pre.forEach((x) => { const ml = meals.find((y) => y.label.startsWith(x.label)); assert(ml && ml.m - x.m === 15, 'قبل الوجبة بربع ساعة'); });
    const g = await m.evaluate(() => { const S = window.HissatiApp.state(); return Math.max(4, Math.min(16, Math.round(+(S.plan[new Date().getDay() % S.plan.length].water || S.pm.water || 2.5) / 0.25))); });
    assert.strictEqual(rem.filter((x) => x.t === 'water' || x.t === 'wpre').reduce((a, x) => a + x.n, 0), g, 'مجموع أكواب التذكيرات = هدف اليوم'); }
  ok('ماء ما قبل الوجبة: «كوبان قبلها بربع ساعة» فوق كل وجبة رئيسية يضيف كوبين لماء اليوم، والتذكير قبل الوجبة بـ15 دقيقة، وباقي الهدف موزّع على اليوم');
  // فتح وجبة أخرى من القائمة
  await m.click('.pmlist .pmrow >> nth=0'); await m.waitForSelector('.pmopen .card.meal'); assert.strictEqual(await m.locator('.plc').count(), 1, 'الطبق يبقى للحالية فقط');
  await m.click('.pmopen .pmfold'); await m.waitForFunction(() => !document.querySelector('.pmopen')); ok('لمس وجبة في القائمة يفتحها تحت الحالية (بلا طبق إضافي) ويطويها');
  // اكتمال الوجبة
  await m.click('.card.meal [data-act="whole"]'); await m.waitForTimeout(400); await snap('2');
  // الرئيسية
  await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.cmt'); const txt = await m.innerText('.cmt');
  assert(/التزامك اليوم/.test(txt) && /الماء/.test(txt) && /الأكل/.test(txt) && /الحركة/.test(txt)); assert.strictEqual(await m.locator('.cmt .cmr').count(), 3); assert(await m.locator('.cmt .cmmsg').innerText());
  await m.locator('.cmt').screenshot({ path: (shot || '/tmp/x') + '3.png' }).catch(() => { });
  await m.click('.cmt .cmgo'); await m.waitForSelector('.plc'); ok('الرئيسية: «التزامك اليوم» بنسبة عامة وثلاثة أشرطة (ماء، أكل، حركة) وجملة تحفيزية، ولمسها يفتح «خطتي»');
  // مواعيد وجباتي بنظام 12 ساعة: العميل يغيّر موعد الغداء فتتبعه التذكيرات وماء ما قبل الوجبة
  await m.click('[data-act="tab"][data-v="plan"]'); await m.click('[data-act="mtOpen"]'); await m.waitForSelector('.sheet .mtrow');
  const li = P.names.findIndex((x) => /غداء|غذاء/.test(x)); assert(li >= 0);
  const ri = await m.evaluate((nm) => [...document.querySelectorAll('.sheet .mtrow .mtn b')].findIndex((b) => b.textContent.includes(nm)), P.names[li]);
  assert.deepStrictEqual(await m.evaluate(() => [...document.querySelector('.sheet [data-mk="a"]').options].map((o) => o.text)), ['ص', 'م'], 'ص/م');
  assert.strictEqual(await m.locator('.sheet [data-mk="h"] >> nth=0').locator('option').count(), 12, 'ساعات 1–12');
  await m.selectOption('#mth' + ri, '2'); await m.selectOption('#mtm' + ri, '30'); await m.selectOption('#mta' + ri, '1'); if (shot) await m.screenshot({ path: shot + 'mt.png' });
  await m.click('[data-act="mtSave"]'); await m.waitForFunction(() => !document.querySelector('.sheet .mtrow'));
  const r2 = await m.evaluate(() => window.HissatiApp.remItems()), lm = r2.find((x) => x.t === 'meal' && /غداء|غذاء/.test(x.label)), lp = r2.find((x) => x.t === 'wpre' && /غداء|غذاء/.test(x.label));
  assert.strictEqual(lm.m, 14 * 60 + 30, 'تذكير الغداء 2:30 م'); assert.strictEqual(lp.m, 14 * 60 + 15, 'كوبا الماء 2:15 م');
  assert(/2:30 م/.test(await m.innerText('body')), 'الوقت يظهر بنظام 12 ساعة'); assert(await m.evaluate(() => window.HissatiApp.state().rem.meals === true), 'تفعيل تذكير الوجبات');
  await m.click('[data-act="mtOpen"]'); await m.waitForSelector('[data-act="mtReset"]'); await m.click('[data-act="mtReset"]'); await m.waitForFunction(() => !Object.keys(window.HissatiApp.state().mt || {}).length);
  ok('مواعيد وجباتي: يختار العميل الساعة والدقيقة وص/م لكل وجبة، فيصله تذكير الوجبة في موعدها وكوبا الماء قبلها بربع ساعة، ويظهر الوقت بنظام 12 ساعة، ويرجع لمواعيد أخصائيه متى شاء');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
