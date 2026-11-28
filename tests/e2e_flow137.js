// 1.37 (قرار المالك): المسار الموحد بخمس خطوات (العميل ← النظام ← الفحص ← البناء ← الإرسال) بلا تكرار:
// عميل جديد بالتعبئة اليدوية أو باستبيان «زنها»، بيانات واحدة من ملف العميل، لا «طريقة بناء» قديمة، الإرسال والتصدير في «الإرسال» وحدها،
// لوحة ملخص جودة حية من الخطة الفعلية، إعداد المفضلات لكل عميل، جدول البدائل بالمفضلات أولاً، وإطار البناء نفسه لنظام الجرامات.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const br = await chromium.launch(), p = await (await br.newContext({ viewport: { width: 1366, height: 950 }, reducedMotion: 'reduce' })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur) || DPApp.S.draft)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  // ١ عميل جديد: خياران
  await p.click('aside [data-a="genTab"]'); await p.waitForSelector('.genpage'); assert.strictEqual(await p.locator('.gennew').count(), 0);
  await p.click('.genpage [data-a="genNewAsk"]'); await p.waitForSelector('.gennew'); assert.strictEqual(await p.locator('.gennew .gkind').count(), 2);
  assert.strictEqual(await p.getAttribute('.gennew [data-a="genSurvey"]', 'aria-disabled'), 'true'); await p.click('.gennew [data-a="genSurvey"]', { force: true }); await p.waitForSelector('.toast:has-text("اربط")');
  ok('«＋ عميل جديد»: خياران — «أعبّئها بنفسي» و«يعبّئها العميل باستبيان زنها» (يشرح أن الربط بالمحطة أولاً حين لا يكون مربوطاً)');
  await p.click('.gennew [data-a="genNew"]'); await p.waitForSelector('.genclient');
  assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('.gensteps li')].map((x) => x.textContent.replace(/^[\d✓①②③④]\s*/, '').trim())), ['الاحتياج', 'النظام والشكل', 'الوجبات', 'المراجعة والإرسال']);      // 1.71: الخطوات الأربع
  assert.strictEqual(await p.locator('main .cfhead, main .cftabs, main .cfseg').count(), 0, 'لا رأس ملف ولا تبويبات داخل المسار'); assert.strictEqual(await p.locator('main .genflowh').count(), 1);
  ok('الخطوات الخمس: العميل، النظام، الفحص، البناء، الإرسال؛ والمسار صفحة مستقلة برأس واحد (لا رأس الملف وتبويباته)');
  await p.fill('[data-f="name"]', 'منى أحمد'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '32'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '163'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 2 }); await p.waitForTimeout(150);
  const nameCount = await p.evaluate(() => (document.querySelector('main').innerText.match(/منى أحمد/g) || []).length); assert(nameCount <= 1, 'الاسم يتكرر ' + nameCount);
  await p.click('.genclient [data-a="genStep"][data-v="2"]'); await p.waitForSelector('.gensetup'); assert(/منى أحمد/.test(await p.textContent('.genflowh')));
  assert.strictEqual(await p.locator('[data-gnk="path"]').count(), 0, 'لا «طريقة بناء»'); assert.strictEqual(await p.locator('.gensetup [data-a="genKind"]').count(), 2);
  ok('بيانات العميل مرة واحدة (الاسم لا يتكرر)، وخطوة «النظام» حصص أو جرامات فقط بلا «طريقة البناء» القديمة');
  // ٢ عميل مكتمل: ملخص وتعديل يحفظ في الملف نفسه
  await p.evaluate(() => DPApp.A.genStep(1)); await p.waitForSelector('.gcsum'); assert.strictEqual(await p.locator('.genclient [data-f="weight"]').count(), 0);
  await p.click('[data-a="genEditData"]'); await p.waitForSelector('.genclient [data-f="weight"]'); await p.fill('.genclient [data-f="weight"]', '80'); await p.press('.genclient [data-f="weight"]', 'Tab'); await p.waitForTimeout(150);
  assert.strictEqual(+(await C()).weight, 80); await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('main .cfhead'); assert.strictEqual(await p.inputValue('main [data-f="weight"]'), '80');
  ok('عميل مكتمل: ملخص في «العميل» مع «✎ تعديل البيانات»، والتعديل يُحفظ في ملف العميل نفسه (الوزن 80 في «البيانات»)');
  // ٣ الفحص بلا تكرار الهوية، ثم البناء ولوحة الجودة قبل التوليد
  await p.evaluate(() => DPApp.A.genOpen(3)); await p.waitForSelector('.genrev'); assert(/^الفحص/.test((await p.textContent('.gencl h3')).trim())); assert.strictEqual(await p.locator('.gencl :text("منى أحمد")').count(), 0);
  await p.click('[data-a="genRevOk"]'); await p.waitForSelector('.genqual'); const q0 = await p.textContent('.genqual'); assert(/ملخص جودة الخطة/.test(q0) && /اكتمال/.test(q0));
  assert(+(await p.getAttribute('.gqpct', 'data-pct')) < 100); ok('«الفحص» بلا تكرار الاسم والقياسات؛ و«البناء» يبدأ بلوحة ملخص الجودة (اكتمال أقل من 100% قبل التوليد)');
  // ٤ المفضلات: الإعداد والتوليد واللوحة من الخطة الفعلية
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); const B = DATA.bank.filter((b) => b.on && b.ing.length >= 2), only = (t) => B.filter((b) => b.m[t] && b.m.filter(Boolean).length === 1).map((b) => b.n); c.favMeals = [...only(0).slice(0, 4), ...only(1).slice(0, 4), ...only(2).slice(0, 4), ...only(3).slice(0, 7)]; DPApp.A.genEs(5); });
  await p.waitForSelector('.genfav'); assert.strictEqual(await p.inputValue('#gen_fpct'), '80'); assert.strictEqual(await p.inputValue('#gen_frep'), '2'); assert.strictEqual(await p.getAttribute('#gen_fpct', 'min'), '50'); assert.strictEqual(await p.getAttribute('#gen_fpct', 'max'), '90');
  assert(/الإفطار:/.test(await p.textContent('.genfav')));
  await p.locator('#gen_fpct').fill('50'); await p.locator('#gen_fpct').dispatchEvent('change'); await p.waitForSelector('.toast:has-text("نسبة المفضلات 50%")'); assert.strictEqual((await C()).favPct, 50);
  await p.fill('#gen_frep', '3'); await p.press('#gen_frep', 'Tab'); await p.waitForFunction(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).favRep === 3);
  ok('إعداد المفضلات لكل عميل: 80% افتراضياً (50–90) وحد التكرار 2؛ عُدّلا إلى 50% و3 ويُحفظان في ملف العميل، مع قائمة مفضلاته لكل وجبة');
  await p.click('[data-a="genEqBuild"]'); await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan && c.plan.favInfo; }); await p.evaluate(() => DPApp.A.genOpen(4)); await p.waitForSelector('.genqual');
  const truth = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), E = window.DPEngine, r = E.favReport(c.plan, c, DATA); let k = 0, nd = 0; c.plan.days.forEach((d) => { const x = d.nominal; nd++; k += x[0] * 4 + x[1] * 4 + x[2] * 9; }); return { r, k: Math.round(k / nd) }; });
  const tiles = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.genqual .gq')].map((t) => [t.querySelector('small').textContent.trim(), t.querySelector('b').textContent.trim()])));
  assert.strictEqual(tiles['السعرات (متوسط اليوم)'], String(truth.k)); assert.strictEqual(tiles['المفضلات'], truth.r.pct + '%'); assert.strictEqual(tiles['وجبات مكررة'], String(truth.r.repeated)); assert.strictEqual(tiles['مكمّلة من البنك'], String(truth.r.bank));
  assert(truth.r.pct >= 50, 'النسبة ' + truth.r.pct); for (const k of ['الكربوهيدرات', 'البروتين', 'الدهون', 'تنبيهات غذائية']) assert(tiles[k] && tiles[k] !== '—', k);
  ok('لوحة الجودة من الخطة الفعلية: السعرات ' + truth.k + '، المفضلات ' + truth.r.pct + '% (≥ 50%)، المكررة ' + truth.r.repeated + '، من البنك ' + truth.r.bank + '، والماكروز والتنبيهات');
  // ٥ تتحدث مباشرة: تعديل الجدول بعد التوليد
  await p.evaluate(() => DPApp.A.genEs(3)); await p.waitForSelector('[data-gc="10"]'); await p.click('[data-a="genStp"][data-v="gc|10|1"]'); await p.waitForSelector('.gqstale'); assert(/○ محدّثة بعد آخر تعديل/.test(await p.textContent('.gqchk')));
  await p.click('[data-a="genStp"][data-v="gc|10|-1"]'); await p.waitForFunction(() => !document.querySelector('.gqstale')); ok('اللوحة تتحدث مع كل تعديل: تعديل الجدول التركيبي بعد التوليد يُظهر «أعد التوليد» ويختفي حين يتطابق');
  // ٦ جدول البدائل
  await p.evaluate(() => DPApp.A.genEs(6)); await p.waitForSelector('.galts .galt'); const alt = await p.evaluate(() => [...document.querySelectorAll('.galt')].map((g) => [...g.querySelectorAll('li')].map((l) => l.classList.contains('fav'))));
  assert(alt.some((g) => g[0] === true), 'لا مفضلة أولاً'); assert(alt.every((g) => { const k = g.indexOf(false); return k < 0 || !g.slice(k).includes(true); }), 'المفضلات ليست أولاً'); ok('«جدول البدائل» خطوة فرعية أخيرة: لكل مجموعة البدائل بحصة واحدة والمفضلات (⭐) أولاً');
  // ٧ الإرسال والتصدير في مكان واحد
  await p.click('.geneqv [data-a="genStep"][data-v="5"]'); await p.waitForSelector('.gensend'); assert.strictEqual(await p.locator('.gensend .genout [data-a="genExp"]').count(), 3); assert.strictEqual(await p.locator('.gensend [data-a="hxSendOrInvite"]').count(), 1);
  await p.click('[data-a="genExit"]'); await p.waitForSelector('main .cfhead'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'plan');
  assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('.cfseg button')].map((x) => x.textContent.replace(/\s*\(\d+\)/, '').trim())), ['الخطة', 'الإصدارات']);
  assert.strictEqual(await p.locator('main .cfhead [data-a="hxSendPlan"], main .pbar [data-a="hxSendOrInvite"], main .pbar [data-a="docx"], main .pbar [data-a="wkPick"], main .pbar [data-a="gen"]').count(), 0);
  assert.strictEqual(await p.locator('main .pbar [data-a="genOpen"]').count(), 2); await p.click('main .pbar [data-a="genOpen"][data-v="4"]'); await p.waitForSelector('.genqual'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'gen');
  ok('الإرسال والتصدير في «الإرسال» وحدها؛ ملف العميل «الخطة | الإصدارات» وشريطه «عدّل في مسار الإنشاء» و«الإرسال والتصدير» فقط');
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('main .cfhead'); assert.strictEqual(await p.locator('main [data-a="gen"], main [data-a="genBank"]').count(), 0); ok('لا مداخل توليد مكررة في «البيانات» (مدخل واحد: «أنشئ الخطة»)');
  // ٨ نظام الجرامات: الإطار نفسه
  await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', 'كابتن'); await p.selectOption('[data-f="sex"]', 'ذكر'); await p.fill('[data-f="age"]', '28'); await p.fill('[data-f="weight"]', '85'); await p.fill('[data-f="height"]', '180'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 2 }); await p.waitForTimeout(150); await p.click('.genclient [data-a="genStep"][data-v="2"]'); await p.waitForSelector('.gensetup'); await p.click('[data-a="genKind"][data-v="ath"]'); await p.waitForSelector('.gkind.on[data-v="ath"]');
  await p.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); }); await p.waitForSelector('.genathf'); assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('.genathf .gafs h4')].map((h) => h.textContent.replace(/^\d\s*/, '').trim())), ['الطاقة', 'الماكروز', 'توزيع الوجبات', 'بناء الوجبات بالجرامات', 'التحليل الغذائي']);
  assert(/لا ينطبق/.test(await p.textContent('.genqual'))); await p.evaluate(() => DPApp.A.genBuild()); await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c && c.plan; }); await p.evaluate(() => DPApp.A.genOpen(4)); await p.waitForSelector('.genqual');
  const at = await p.evaluate(() => [...document.querySelectorAll('.genqual .gq b')].slice(0, 4).map((b) => b.textContent.trim())); assert(at.every((x) => x !== '—'), at.join());
  ok('نظام الجرامات: إطار «البناء» نفسه (الطاقة، الماكروز، توزيع الوجبات، بناء الوجبات بالجرامات، التحليل الغذائي) ولوحة الجودة من خطته');
  // ٩ الجوال
  const m = await (await br.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage(); m.on('pageerror', (e) => errs.push(String(e))); await m.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(m);
  await m.evaluate(() => DPApp.A.genNew()); await m.fill('[data-f="name"]', 'ريم'); await m.selectOption('[data-f="sex"]', 'أنثى'); await m.fill('[data-f="age"]', '28'); await m.fill('[data-f="weight"]', '70'); await m.fill('[data-f="height"]', '165'); await m.press('[data-f="height"]', 'Tab');
  await m.selectOption('[data-f="goal"]', { index: 2 }); await m.selectOption('[data-f="activity"]', { index: 2 }); await m.waitForTimeout(150); await m.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); DPApp.A.genEqBuild(); DPApp.A.genOpen(4); }); await m.waitForSelector('.genqual');
  for (const es of [4, 6]) { await m.evaluate((v) => DPApp.A.genEs(v), es); await m.waitForTimeout(150); assert(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'تمرير أفقي ' + es); }
  ok('الجوال: لوحة الجودة وجدول البدائل بلا تمرير أفقي');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات المسار الموحد 1.37');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
