// شاشة دخول المدير الأولي: إظهار كلمة السر، وتلميح الحل عند الفشل، وسيناريو السبب الأرجح: حساب مخزَّن على المتصفح بكلمة سر مختلفة (غُيّرت بعد أول دخول).
const { TMP, fileUrl, PY } = require('./_tmp.js');
const { chromium } = require('playwright'); const fs = require('fs'), assert = require('assert'), path = require('path');
const cp = require('child_process'), OUTD = TMP + '/lh', PW = 'Init#Pass-2026-lh', NEWPW = 'Changed#2026pw';   // يولّد admin_initial.html بنفسه (غير موجود في المستودع عمداً)
const gen = cp.spawnSync(process.execPath, [path.resolve(__dirname, '../make_initial_admin.js'), 'hamed', PW], { env: Object.assign({}, process.env, { HISSA_OUT: OUTD }), encoding: 'utf8' }); if (gen.status !== 0) { console.log('✘ تعذّر توليد admin_initial.html:', gen.stderr); process.exit(1); }
const FILE = fileUrl(path.join(OUTD, 'admin_initial.html'));
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto(FILE); await p.waitForSelector('#aBtn'); assert.strictEqual(await p.inputValue('#au'), 'hamed');
  await p.fill('#ap', 'wrong-pass-123'); assert.strictEqual(await p.getAttribute('#ap', 'type'), 'password'); await p.check('#showpw'); assert.strictEqual(await p.getAttribute('#ap', 'type'), 'text'); assert.strictEqual(await p.inputValue('#ap'), 'wrong-pass-123'); await p.uncheck('#showpw'); assert.strictEqual(await p.getAttribute('#ap', 'type'), 'password'); ok('«إظهار كلمة السر» يكشف ما كُتب (مفيد لاكتشاف لغة لوحة المفاتيح) ويعيد إخفاءه');
  await p.click('#aBtn'); await p.waitForSelector('.gerr'); const h = await p.textContent('#seedhint'); assert(/InPrivate/.test(h) && /نسخة مدير أخرى/.test(h) && /English/.test(h)); ok('عند الفشل في النسخة الأولية يظهر تلميح: قد تكون هناك نسخة مدير أخرى سابقة على المتصفح، وجرّب نافذة خاصة، وتأكد من لغة الكتابة');
  await p.waitForTimeout(2600); await p.fill('#ap', PW); await p.click('#aBtn'); await p.waitForSelector('aside .sidebtn', { state: 'attached' }); assert((await p.textContent('main')).includes('كلمة سر ابتدائية')); ok('كلمة السر الابتدائية الصحيحة تدخل');
  await p.waitForSelector('#cp_old'); await p.waitForTimeout(800); await p.fill('#cp_old', PW); await p.fill('#cp_new', NEWPW); await p.fill('#cp_new2', NEWPW); await p.click('[data-ha="chpw"]'); await p.waitForSelector('.toast:has-text("تم تغيير كلمة السر")', { timeout: 15000 });
  // الآن «المتصفح فيه حساب بكلمة سر غُيّرت» ثم تُفتح نسخة أولية أخرى: هذا هو السيناريو المرجّح لشكواك
  const p2 = await ctx.newPage(); p2.on('dialog', d => d.accept()); await p2.goto(FILE); await p2.waitForSelector('#aBtn'); assert.strictEqual(await p2.inputValue('#au'), ''); await p2.fill('#au', 'hamed'); await p2.fill('#ap', PW); await p2.click('#aBtn'); await p2.waitForSelector('.gerr'); assert((await p2.textContent('.gerr')).includes('غير صحيحة')); assert(await p2.locator('#seedhint').count() === 1); ok('بعد تغيير كلمة السر على المتصفح: الكلمة الابتدائية تُرفض (كما في صورتك) ويظهر التلميح الذي يشرح السبب');
  await p2.waitForTimeout(2600); await p2.fill('#au', 'hamed'); await p2.fill('#ap', NEWPW); await p2.click('#aBtn'); await p2.waitForSelector('aside .sidebtn', { state: 'attached', timeout: 20000 }); ok('والكلمة المغيَّرة هي التي تدخل');
  const fresh = await b.newContext({ viewport: { width: 1200, height: 900 } }), p3 = await fresh.newPage(); await p3.goto(FILE); await p3.waitForSelector('#aBtn'); await p3.fill('#ap', PW); await p3.click('#aBtn'); await p3.waitForSelector('aside .sidebtn', { state: 'attached' }); ok('في «متصفح نظيف» (مثل نافذة InPrivate) تدخل الكلمة الابتدائية');
  assert.deepStrictEqual(errs, []); console.log('\nنجح', n, 'اختبارات مساعدة دخول المدير'); await b.close();
})().catch(e => { console.log('✘', String(e).slice(0, 900)); process.exit(1); });
