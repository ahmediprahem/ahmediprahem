// 1.35 واجهة الدخول الجديدة في «زنها» (تصميم المالك): البداية الكحلية بزيزو، الترحيب «غيّر أسلوب حياتك» ثم «ابدأ الآن» إلى الدخول، ورمز الدخول بالهوية نفسها
const { chromium, devices } = require('playwright'); const assert = require('assert'), fs = require('fs'), path = require('path'), { TMP } = require('./_tmp.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../hissati.html'), 'utf8'), a = 'function render() {'; assert(src.includes(a));
  const f = path.join(TMP, 'hx_login135.html'); fs.writeFileSync(f, src.replace(a, a + ' window.__V = V; window.__R = render;'));
  const br = await chromium.launch(), p = await (await br.newContext({ ...devices['iPhone 13'] })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.addInitScript(() => { try { localStorage.setItem('hissati_intro', '1'); localStorage.setItem('hissati_onb', '1'); } catch (e) { } });
  await p.goto('file://' + f); await p.waitForSelector('.zstart');
  assert(await p.locator('.zs-hero .zs-walk svg.zz').count() === 1); assert(/غيّر أسلوب حياتك/.test(await p.textContent('.zs-sheet h1'))); ok('الترحيب: زيزو يمشي بالتفاحة والماء، و«غيّر أسلوب حياتك» على ورقة بيضاء');
  await p.click('[data-act="zsGo"]'); await p.waitForFunction(() => { const r = document.getElementById('zsLogin').getBoundingClientRect(); return r.top < 120; }); ok('«ابدأ الآن» ينقل إلى «تسجيل الدخول»');
  for (const id of ['invIn', 'crU', 'crP', 'xferIn']) assert(await p.locator('#' + id).isVisible(), id); assert(await p.locator('[data-act="useInv"]').count() && await p.locator('[data-act="useCred"]').count() && await p.locator('[data-act="useXfer"]').count() && await p.locator('[data-act="khgStartG"]').count());
  ok('طرق الدخول كلها كما هي: رابط الدعوة، اسم المستخدم وكلمة السر، نقل الحساب، وتحدي الخمس');
  let w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); assert(w[0] <= w[1], w);
  await p.evaluate(() => { __V.screen = 'onb'; __V.onb = { i: 0, in: -1 }; __R(); }); await p.waitForSelector('.zs-splash'); assert(await p.locator('.zs-splash .zs-zz svg.zz').count() === 1 && /صحتك، رشاقتك/.test(await p.textContent('.zs-splash .onb-tag'))); ok('البداية: سماء كحلية بنجوم وغيوم، زيزو يلوّح على الكثبان، و«زِنها Zenha»');
  for (const k of ['pin', 'lock']) { await p.evaluate((k) => { __V.screen = k; __V.pin = '12'; __V.pin1 = ''; __V.err = ''; __R(); }, k); await p.waitForSelector('.zpin .pad');
    const r = await p.evaluate(() => { const b = [...document.querySelectorAll('.zpin .pad button')].pop().getBoundingClientRect(); return [b.bottom, innerHeight, document.querySelectorAll('.zpin .pin span.f').length, !!document.querySelector('.zp-zz svg.zz')]; });
    assert(r[0] <= r[1] && r[2] === 2 && r[3], k + ' ' + r); }
  ok('رمز الدخول (الإنشاء والقفل): زيزو في الأعلى، والنقاط تمتلئ، ولوحة الأرقام كاملة داخل الشاشة');
  await p.click('.zpin .pad button[data-v="3"]'); w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); assert(w[0] <= w[1], w); ok('بلا تمرير أفقي');
  assert.deepStrictEqual(errs, []); await br.close(); console.log('\nنجح ' + n + ' اختبارات واجهة الدخول');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
