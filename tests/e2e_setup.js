// أول تسجيل (0.61): الديانة والتذكيرات المختارة من البداية، مواقيت مدن المملكة كلها، وإخفاء المحتوى الديني لغير المسلم.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  // ---- مسلم من الرياض: يُفعَّل الأذان والأذكار والصلاة على النبي تلقائياً
  const A = await linked('setup_m', errs, { setup: async (m) => {
    assert(/نجهّز تطبيقك/.test(await m.textContent('.setup h1'))); assert(await m.isDisabled('[data-act="setupGo"]'), 'لا متابعة قبل اختيار الديانة');
    await m.click('[data-act="setupRel"][data-v="م"]'); await m.waitForSelector('#setupCity'); assert(await m.locator('#setupCity optgroup[label="المملكة العربية السعودية"] option').count() >= 30, 'مدن المملكة كاملة');
    for (const c of ['الأحساء', 'حائل', 'عرعر', 'سكاكا', 'جازان', 'نجران', 'الباحة', 'تبوك', 'بريدة', 'ينبع']) assert(await m.locator('#setupCity option', { hasText: c }).count() === 1, 'مدينة ' + c);
    await m.selectOption('#setupCity', 'الرياض'); await m.click('[data-act="setupTog"][data-v="med"]'); await m.click('[data-act="setupGo"]'); } });
  let R = await A.m.evaluate(() => { const S = window.HissatiApp.state(); return { rel: S.p.rel, rem: S.rem }; });
  assert.strictEqual(R.rel, 'م'); assert(R.rem.pray && R.rem.prCity === 'الرياض' && R.rem.adhAm && R.rem.adhPm && R.rem.sal && R.rem.water && R.rem.meals && R.rem.med, JSON.stringify(R.rem));
  ok('مسلم من الرياض: ديانة + مدينة + تذكيرات (ماء، وجبات، دواء، الصلاة، أذكار الصباح والمساء، الصلاة على النبي) تُفعَّل من أول تسجيل');
  await A.close();
  // ---- مسيحي: لا أذان ولا أذكار ولا قرآن ولا صلاة على النبي
  const B = await linked('setup_c', errs, { setup: async (m) => {
    await m.click('[data-act="setupRel"][data-v="ك"]'); assert.strictEqual(await m.locator('#setupCity').count(), 0); assert.strictEqual(await m.locator('[data-v="pray"],[data-v="adhAm"],[data-v="adhPm"],[data-v="sal"]').count(), 0, 'لا خيارات دينية');
    await m.click('[data-act="setupGo"]'); } });
  R = await B.m.evaluate(() => { const S = window.HissatiApp.state(); return { rel: S.p.rel, rem: S.rem }; });
  assert.strictEqual(R.rel, 'ك'); assert(!R.rem.pray && !R.rem.adhAm && !R.rem.adhPm && !R.rem.sal && R.rem.water && R.rem.meals, JSON.stringify(R.rem));
  await B.m.evaluate(() => { localStorage.setItem('hx_wheel_e2e', '1'); }); const cats = await B.m.evaluate(() => window.HissatiApp.wheel.cats()); assert(!cats.includes('quran'), 'لا قرآن في العجلة');
  await B.m.click('[data-act="tab"][data-v="today"]'); assert.strictEqual(await B.m.locator('.prc').count(), 0, 'لا بطاقة مواقيت'); assert.strictEqual(await B.m.locator('[data-hb="adhkar"],[data-hb="adhkarPm"]').count(), 0);
  await B.m.click('[data-act="habits"]'); await B.m.waitForSelector('.hlib'); assert.strictEqual(await B.m.locator('.hlib .hli', { hasText: 'أذكار' }).count(), 0, 'لا أذكار في مكتبة العادات'); await B.m.keyboard.press('Escape');
  ok('مسيحي: لا مواقيت ولا أذكار ولا صلاة على النبي ولا قرآن (العجلة ولا مكتبة العادات ولا البطاقة)، وتبقى تذكيرات الماء والوجبات');
  await B.close();
  assert.deepStrictEqual(errs, []); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
