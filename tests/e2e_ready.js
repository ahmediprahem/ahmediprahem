// خطط البنك (0.42–0.43) في «حصة»: زرّا «ولّد خطة من البنك» و«ولّد خطة جديدة» أسفل «بيانات العميل» (الصفحة مضغوطة بقوائم منسدلة)،
// منتقي حتى 7 خطط بأنواع مختلفة ولكل منها «الأنسب إذا…» والمتوقع، الاختيار يطبّق الخطة على تبويب «الخطة» والطباعة، والرجوع للمحرك، وقسم المكتبة (تصفّح/دليل).
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept(d.type() === 'prompt' ? (globalThis.PR || '') : undefined));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'منى'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="weight"]', '88'); await p.fill('[data-f="height"]', '162'); await p.fill('[data-f="age"]', '34'); await p.press('[data-f="age"]', 'Tab'); await p.waitForTimeout(200);
  // ---- صفحة بيانات العميل المضغوطة
  assert(await p.isVisible('main [data-a="genBank"]') && await p.isVisible('main [data-a="gen"]:has-text("ولّد خطة جديدة")')); assert.strictEqual(await p.locator('main :text("ولّد الخطة ←")').count(), 0);
  assert.strictEqual(await p.locator('main .rdbox').count(), 0, 'لا صندوق أعلى الصفحة');
  const h = await p.evaluate(() => document.querySelector('main').scrollHeight); assert(h < 1000, 'ارتفاع الصفحة ' + h);
  assert(!(await p.isVisible('[data-f="proGkg"]')), 'الماكروز مطوية'); await p.click('details.fold > summary'); assert(await p.isVisible('[data-f="proGkg"]'));
  await p.click('details.rddd >> nth=0 >> summary'); await p.check('[data-ck="conditions"] >> nth=2'); await p.click('main h3, main .t', { force: true }).catch(() => { });
  assert(/مقاومة/.test(await p.textContent('details.rddd >> nth=0 >> summary'))); assert((await C()).conditions.some((x) => /مقاومة/.test(x)));
  ok('«بيانات العميل» أقصر بالثلث: الحالة الصحية والحساسية وخيارات الأصناف قوائم منسدلة (الملخص يتحدث ويُحفظ)، والماكروز مطوية، وزرّا «ولّد خطة من البنك» و«ولّد خطة جديدة»');
  // ---- منتقي البنك
  await p.click('main [data-a="genBank"]'); await p.waitForSelector('.rdbank'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'plan');
  assert.strictEqual(await p.locator('.rdopt').count(), 7, 'سبع خطط'); assert(/الأنسب/.test(await p.textContent('.rdopt.best')));
  const whens = await p.locator('.rdwhen').allTextContents(); assert(whens.every((w) => /الأنسب إذا كان/.test(w)), whens.join('|')); assert(/المتوقع/.test(await p.textContent('.rdopt.best .rdexp1')));
  const names = await p.locator('.rdopt .rdot b').allTextContents(); assert(new Set(names).size >= 5, 'أنواع مختلفة: ' + names.join('،'));
  assert(/اللو كارب/.test(await p.textContent('.rdopt.best')), 'مقاومة الإنسولين من ملف العميل ← لو كارب أولاً');
  ok('«ولّد خطة من البنك»: 7 خطط بأنواع مختلفة (≥5 عائلات)، لكل منها «الأنسب إذا كان العميل…» والمتوقع، والترتيب يأخذ حالة العميل من ملفه');
  await p.selectOption('[data-rdq="style"]', 'vary'); await p.waitForTimeout(150); const t2 = await p.textContent('.rdopt.best .rdot b'); assert(/الزجزاج|تدوير|اللو كارب/.test(t2), t2);
  await p.selectOption('[data-rdq="region"]', 'sa'); await p.waitForTimeout(150); assert(/سعودية/.test(await p.textContent('.rdopt.best')));
  assert.strictEqual((await C()).cuisine, 'sa', 'اختيار الأكلات في المنتقي يُحفظ في «المطبخ»');
  await p.click('.rdopt.best [data-a="rdOpen"]'); await p.waitForSelector('.rdopt.best .rdprev', { timeout: 20000 }); assert(await p.locator('.rdopt.best .rdprev > details').count() >= 8);
  ok('الإجابات في المنتقي (قوائم منسدلة) تعيد الترتيب فوراً، والمعاينة تعرض الأسبوع كاملاً من ملف المكتبة');
  const pickTxt = await p.textContent('.rdopt >> nth=1 >> .rdot small'); await p.click('.rdopt >> nth=1 >> [data-a="rdApprove"]'); await p.waitForSelector('.rdplan');
  let c = await C(); assert.strictEqual(c.planSrc, 'ready'); assert.strictEqual(c.readyDoc.days.length, 7); assert(pickTxt.includes(c.ready.label.split(' • ')[0]));
  assert(await p.isVisible('.rdplan [onclick="window.print()"]')); await p.click('[data-a="rdPage"][data-v="all"]'); assert(await p.locator('.rdplan .pg').count() >= 8); assert(/الأحد/.test(await p.textContent('.rdplan')));
  assert(/الأنسب إذا/.test(await p.textContent('.rdph')));
  ok('اختيار الخطة يطبّقها على العميل: تبويب «الخطة» يعرضها 7 أيام (الأحد…السبت) بالبدائل والشرح، مع الطباعة و«الأنسب إذا…»');
  const pn = await p.locator('.rdplan .pnav button').allTextContents(); assert.deepStrictEqual([pn[0], pn[pn.length - 1]], ['الملخص', 'كل الصفحات']); assert(pn.includes('الأحد') && pn.includes('السبت'));
  const sum = await p.textContent('.rdplan .pg'); for (const w of ['بيانات العميل', 'الماكروز اليومية', 'على أيام الأسبوع']) assert(sum.includes(w), w);
  if (pn.includes('تقسيم الحصص')) { await p.click('[data-a="rdPage"][data-v="grp"]'); assert(/الإجمالي/.test(await p.textContent('.rdplan .pg'))); assert(/لحوم/.test(await p.textContent('.rdplan .pg'))); }
  await p.click('[data-a="rdPage"][data-v="0"]'); assert(await p.locator('.rdplan table.dt').count() === 1); assert(/مجموع اليوم/.test(await p.textContent('.rdplan table.dt')));
  ok('صفحات خطة البنك مثل خطة المحرك: الملخص (بيانات العميل، الماكروز، الحصص على الأيام) • تقسيم الحصص • كل يوم بجدول المجموعات الغذائية ومكونات الوجبة • كل الصفحات');
  const it0 = (await p.locator('.rdplan table.dt td.f >> nth=0').textContent()); await p.click('.rdplan [data-a="rdAlt"] >> nth=0'); await p.waitForSelector('.rdalt'); const nAlt = await p.locator('.rdalt [data-a="rdSwap"]').count(); assert(nAlt >= 2, 'بدائل ' + nAlt);
  const pickAlt = (await p.locator('.rdalt [data-a="rdSwap"] >> nth=1').textContent()).trim(); await p.click('.rdalt [data-a="rdSwap"] >> nth=1'); await p.waitForTimeout(200);
  c = await C(); assert.strictEqual(c.readyDoc.days[0].m[0][1][0], pickAlt); assert(c.readyDoc.edited); assert(/معدّلة/.test(await p.textContent('.rdph')));
  globalThis.PR = '2 بيضة مسلوقة'; await p.click('.rdplan [data-a="rdEdIt"] >> nth=1'); await p.waitForTimeout(200); c = await C(); assert.strictEqual(c.readyDoc.days[0].m[0][1][1].split(' ◂ ')[0], '2 بيضة مسلوقة');
  ok('تبديل صنف من البدائل (نفس المجموعة) وتعديل الصنف بـ✎، وتُحفظ الخطة «معدّلة»');
  const g0 = c.readyDoc.subs[0][1].length; globalThis.PR = 'بديل تجريبي'; await p.click('.rdplan [data-a="rdSubAdd"] >> nth=0'); await p.waitForTimeout(150); c = await C(); assert.strictEqual(c.readyDoc.subs[0][1].length, g0 + 1); assert.strictEqual(c.readyDoc.subs[0][1][g0], 'بديل تجريبي');
  globalThis.PR = 'بديل معدّل'; await p.click('.rdplan [data-a="rdSubEd"][data-v="0,' + g0 + '"]'); await p.waitForTimeout(150); c = await C(); assert.strictEqual(c.readyDoc.subs[0][1][g0], 'بديل معدّل');
  await p.click('.rdplan [data-a="rdSubDel"][data-v="0,' + g0 + '"]'); await p.waitForTimeout(150); c = await C(); assert.strictEqual(c.readyDoc.subs[0][1].length, g0);
  ok('تعديل جدول البدائل: إضافة بديل وتعديله وحذفه');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.rdplan [data-a="rdDocx"]')]); const fp = path.join(require('./_tmp.js').TMP, 'ready.docx'); await dl.saveAs(fp);
  const raw = await require('../src/docx.js') && require('fs').readFileSync(fp); assert(raw.length > 20000 && raw.slice(0, 2).toString() === 'PK', 'ملف Word');
  const xml = await p.evaluate(async (b64) => { const u = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)); const v = new DataView(u.buffer); let i = 0, out = ''; while (i < u.length - 30 && v.getUint32(i, true) === 0x04034b50) { const m = v.getUint16(i + 8, true), cs = v.getUint32(i + 18, true), nl = v.getUint16(i + 26, true), xl = v.getUint16(i + 28, true), nm = new TextDecoder().decode(u.slice(i + 30, i + 30 + nl)), st = i + 30 + nl + xl, data = u.slice(st, st + cs); if (nm === 'word/document.xml') out = m === 8 ? await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text() : new TextDecoder().decode(data); i = st + cs; } return out; }, raw.toString('base64'));
  for (const w of ['نظامك الغذائي', 'بيانات العميل', 'مكونات الوجبة', 'جدول البدائل', 'الأحد', 'السبت', pickAlt, '2 بيضة مسلوقة']) assert(xml.includes(w), 'Word بلا: ' + w);
  ok('تصدير Word لخطة البنك: الملخص والأيام السبعة وجداول البدائل، ويشمل التبديلات والتعديلات');
  await p.click('.rdplan [data-a="rdReset"]'); await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.readyDoc && !c.readyDoc.edited; }); ok('«استعادة الأصل من المكتبة» يلغي التعديلات');
  await p.click('.rdplan [data-a="gen"]'); await p.waitForSelector('.pnav button', { timeout: 20000 }); c = await C(); assert.strictEqual(c.planSrc, 'engine'); assert(c.plan && c.readyDoc, 'خطة البنك تبقى محفوظة');
  await p.click('[data-a="tab"][data-v="client"]'); await p.click('main [data-a="genBank"]'); await p.waitForSelector('.rdbank'); await p.click('.rdopt.best [data-a="rdApprove"]'); await p.waitForSelector('.rdplan'); c = await C(); assert.strictEqual(c.planSrc, 'ready');
  ok('«ولّد خطة جديدة» يعود لمحرك «حصة» (وتبقى خطة البنك محفوظة)، والرجوع للبنك يستبدلها بعد التأكيد');
  // ---- قسم المكتبة: تصفّح ودليل
  await p.click('.rail [data-a="ready"]'); await p.click('[data-a="rdTab"][data-v="browse"]'); await p.selectOption('[data-rdf="fam"]', 'kids'); await p.selectOption('[data-rdf="rg"]', 'eg'); await p.waitForTimeout(100);
  assert(/30 نظاماً مطابقاً/.test(await p.textContent('.rdl'))); await p.click('.rdrow >> nth=0 >> [data-a="rdOpen"]'); await p.waitForSelector('.rdfull .rdprev');
  await p.click('.rdrow >> nth=1 >> [data-a="rdApprove"]'); await p.waitForSelector('.rdplan'); c = await C(); assert(/الأطفال/.test(c.ready.label)); assert.strictEqual(await p.evaluate(() => DPApp.S.view), 'client');
  ok('قسم «مكتبة الأنظمة الجاهزة»: تصفّح بالعائلة والأكلات (30 نظام أطفال مصري)، والاعتماد منه يطبّق الخطة على العميل');
  await p.click('.rail [data-a="ready"]'); await p.click('[data-a="rdTab"][data-v="guide"]'); assert(await p.locator('.rdl .dxc').count() >= 18); await p.click('[data-a="rdGuide"][data-v="plateau"]'); await p.waitForSelector('.dxc.open .dxd h4'); assert(/التشخيص/.test(await p.textContent('.dxc.open .dxd')));
  ok('دليل العائلات: 18 عائلة، ودليل الأخصائي من الملفات');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.age = 6; c.weight = 30; c.height = 120; delete DPApp.RDS.ans[c.code]; });
  await p.click('.rail [data-a="ready"]'); await p.click('[data-a="tab"][data-v="client"]'); await p.click('main [data-a="genBank"]'); await p.waitForSelector('.rdbank');
  assert(/الأطفال/.test(await p.textContent('.rdopt.best'))); assert(!(await p.isVisible('[data-rdq="goal"]'))); assert(/طفلاً/.test(await p.textContent('.rdopt.best .rdwhen')));
  ok('طفل 6 سنوات: البنك يعرض أشكال أنظمة الأطفال لعمره بلا سؤال الهدف');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.age = 34; c.weight = 88; c.height = 162; delete DPApp.RDS.ans[c.code]; }); await p.click('.rdbank [data-a="rdBankClose"]').catch(() => { }); await p.click('[data-a="tab"][data-v="client"]'); await p.selectOption('[data-f="cuisine"]', 'eg'); await p.waitForTimeout(150); await p.click('main [data-a="genBank"]'); await p.waitForSelector('.rdbank');
  const egn = await p.locator('.rdopt .rdot small').allTextContents(); assert(egn.every((t) => /مصرية/.test(t) || /^(العجز المحسوب|الكيتو)/.test(t)), egn.join('|')); assert(egn.filter((t) => /مصرية/.test(t)).length >= 5, 'الأغلب مصري');   // العجز المحسوب والكيتو بلا نسخة مصرية: يظهران بترجيح أقل
  await p.click('[data-a="tab"][data-v="client"]'); await p.selectOption('[data-f="cuisine"]', 'sa'); await p.waitForTimeout(150); await p.click('main [data-a="genBank"]'); await p.waitForSelector('.rdbank');
  const san = await p.locator('.rdopt .rdot small').allTextContents(); assert(san.every((t) => /سعودية/.test(t)), san.join('|'));
  ok('«المطبخ» في بيانات العميل يرجّح خطط البنك تلقائياً: مصري ← الملفات المصرية أولاً، سعودي ← السعودية (ومختلط يجمعهما)');
  await p.click('.rail [data-a="new"][data-v="ath"]'); await p.fill('[data-f="name"]', 'سامر'); await p.fill('[data-f="weight"]', '85'); await p.fill('[data-f="height"]', '180'); await p.fill('[data-f="age"]', '28'); await p.press('[data-f="age"]', 'Tab'); await p.waitForTimeout(200);
  const ha = await p.evaluate(() => document.querySelector('main').scrollHeight); assert(ha < 1300, 'ارتفاع صفحة الجرامات ' + ha);
  await p.click('main [data-a="genBank"]'); await p.waitForSelector('.rdbank'); const sys = await p.locator('.rdopt .rdot small').allTextContents(); assert(sys.length >= 5 && sys.every((s) => /بالجرامات/.test(s)), sys.join('|'));
  ok('عميل الجرامات: صفحته أقصر بالثلث، والبنك يعرض خطط الجرامات فقط (تنشيف/كارب سايكل للرياضيين)');
  assert.deepStrictEqual(errs, []); await b.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.log('✘', e.message.slice(0, 900)); console.log(errs.join('\n')); process.exit(1); });
