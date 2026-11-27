// 1.28 مساعد الطعام في «زنها» (نسخة العرض): زر الكاميرا ← 4 خيارات؛ الوصف، الصورة، الملصق مع التقييم، التخزين؛ حالة التحميل والخطأ؛
// الإضافة إلى «تسجيل اليوم» الموجود (L.off/L.offT/L.ai) والحذف منه؛ الجوال والحاسوب. المحطة مُحاكاة هنا (Gemini الحقيقي يُختبر على المعاينة).
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), http = require('http'), fs = require('fs');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [], SHOT = process.env.SHOT || '';
const IMG = path.resolve(__dirname, '../assets/hissati/apple-180-pulse.png');
const R = {
  text: { mode: 'text', est: true, ok: true, title: 'برجر بالجبنة وكولا دايت', items: [{ name: 'برجر لحم بجبنة شيدر', portion: 'ساندوتش متوسط', grams: 220, kcal: 540, p: 28, c: 38, f: 30 }, { name: 'كولا دايت', portion: 'علبة 330 مل', grams: 330, kcal: 2, p: 0, c: 0, f: 0 }], total: { kcal: 542, p: 28, c: 38, f: 30 }, confidence: 'medium', note: 'الحجم الفعلي للبرجر يغيّر التقدير.' },
  photo: { mode: 'photo', est: true, ok: true, title: 'أرز ودجاج مشوي وسلطة', items: [{ name: 'أرز أبيض', portion: '1 كوب', grams: 160, kcal: 210, p: 4, c: 46, f: 0.5 }, { name: 'صدر دجاج مشوي', portion: 'قطعة متوسطة', grams: 120, kcal: 200, p: 37, c: 0, f: 4.5 }, { name: 'سلطة خضراء', portion: 'طبق صغير', grams: 100, kcal: 25, p: 1, c: 5, f: 0.2 }], total: { kcal: 435, p: 42, c: 51, f: 5.2 }, confidence: 'medium', note: 'التقدير من الصورة تقريبي.' },
  label: { mode: 'label', est: true, ok: true, product: 'تونة قطع بالزيت', serving: '85 جم', servings: 2, per: { kcal: 180, fat: 12, satFat: 2, transFat: 1.5, chol: 30, sodium: 640, carbs: 0, fiber: null, sugars: null, addedSugars: null, protein: 17 }, ingredients: ['تونة', 'زيت نباتي مهدرج جزئياً', 'ملح'], assessment: { rating: 'occasional', summary: 'بروتين جيد لكن فيه دهون متحولة وصوديوم مرتفع.', positives: ['بروتين 17 جم في الحصة'], concerns: ['1.5 جم دهون متحولة', 'صوديوم 640 ملجم (نحو 28% من الحد اليومي)'], reasons: ['الزيت المهدرج جزئياً مصدر الدهون المتحولة'], alternatives: ['تونة بالماء قليلة الملح'], tips: ['صفِّ الزيت قبل الأكل'] } },
  supp: { mode: 'supp', est: true, ok: true, product: 'فيتامين د3 5000 وحدة', kind: 'vitamin', serving: 'كبسولة واحدة', grade: 'A', gradeWhy: 'دليل قوي عند وجود نقص', summary: 'مفيد لمن لديه نقص، والجرعة أعلى من الحد الآمن للاستعمال اليومي بلا إشراف.', items: [{ name: 'فيتامين د3', amount: '5000 وحدة', form: 'كوليكالسيفيرول', usual: '600–800 وحدة', upper: '4000 وحدة', verdict: 'high', note: 'تحتاج إشرافاً طبياً' }], proven: ['صحة العظام عند النقص'], claimed: ['يقي من الاكتئاب'], who: ['من لديه نقص مثبت بالتحليل'], notNeeded: ['مستواك طبيعي'], onset: 'عدة أسابيع حتى يرتفع المستوى', dose: '600–800 وحدة يومياً؛ الجرعات الأعلى بإشراف طبي', timing: ['مع أكبر وجبة فيها دهون'], food: ['يمتص أفضل مع الدهون؛ لا تعارض غذائي مهم'], howTo: ['مع وجبة فيها دهون'], cautions: ['الزيادة ترفع الكالسيوم'], quality: ['لا تظهر شهادة فحص مستقل'], foods: ['السمك الدهني', 'صفار البيض'] },
  herb: { mode: 'herb', est: true, ok: true, name: 'حبة البركة', sci: 'Nigella sativa', confidence: 'medium', fromImg: true, lookalikes: ['بذور البصل'], uses: ['مستعملة تقليدياً للهضم'], proven: [], claimed: ['تعالج كل الأمراض'], grade: 'C', gradeWhy: 'دليل ناشئ', summary: 'دليل ناشئ لتحسن بسيط في الضغط والسكر.', dose: 'نصف إلى ملعقة صغيرة يومياً', timing: ['مع الطعام'], maxDuration: '', food: ['لا تعارض مهم'], drugs: ['قد تزيد خفض السكر مع أدوية السكري'], avoidIf: ['جرعات كبيرة في الحمل'], cautions: [] },
  store: { mode: 'store', est: true, ok: true, food: 'سمك بلطي طازج', category: 'أسماك', place: 'fridge', temp: 'الثلاجة 4°م أو أقل', fridge: 'يوم إلى يومين', freezer: '6–8 أشهر', room: 'لا يزيد عن ساعتين', howTo: ['اغسله وجففه ولفّه بإحكام'], spoilSigns: ['رائحة حامضة أو نشادرية'], unsafeSigns: ['لزوجة أو لون باهت'], handling: ['اطهه حتى 63°م في الداخل'], note: 'لا يمكن التأكد من السلامة من صورة؛ عند الشك تخلّص منه.' }
};
(async () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../hissati_demo.html'));
  let mode = 'ok', calls = [];
  const srv = http.createServer(async (q, r) => {
    if (q.url === '/v1/ai/food' && q.method === 'POST') { let b = ''; for await (const c of q) b += c; const j = JSON.parse(b); calls.push(j); await new Promise((x) => setTimeout(x, 350));
      if (mode === 'err') { r.writeHead(429, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ ok: false, code: 'aibusy', error: 'المساعد مشغول الآن. حاول بعد دقيقة.' })); }
      if (mode === 'unclear') { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ ok: false, reason: 'لم أتعرّف على طعام في الصورة. صوّر الطبق أقرب بإضاءة جيدة.' })); }
      r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify(R[j.mode])); }
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html);
  });
  await new Promise((x) => srv.listen(0, '127.0.0.1', x)); const URL = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOT ? 2 : 1 }), p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(URL); await p.waitForTimeout(1200); for (let i = 0; i < 4; i++) { const s = p.getByText('تخطّي'); if (await s.count()) { await s.first().click().catch(() => { }); await p.waitForTimeout(400); } }
  const pick = async (v) => { await p.click('.aiw[data-v="' + v + '"]'); await p.waitForSelector('.aiw.on[data-v="' + v + '"]'); await p.click('[data-act="aiMode"][data-v="' + v + '"]'); };      // 1.59 الطبق: اختيار القسم ثم «ابدأ»
  const shot = async (nm) => { if (SHOT) await p.screenshot({ path: SHOT + '/ai_' + nm + '.png' }); };
  // م1
  await p.click('.tabbar .aifab'); await p.waitForSelector('.aiw'); assert.strictEqual(await p.locator('.aiw').count(), 6);
  const lbl = await p.$$eval('.aiw', (x) => x.map((e) => e.getAttribute('aria-label').split(' — ')[0])); assert.deepStrictEqual(lbl, ['صف وجبتك', 'صوّر وجبتك', 'امسح الملصق الغذائي', 'التخزين والسلامة', 'قيّم مكمّلاً', 'الأعشاب']); await shot('1menu');
  { await p.click('.aiw[data-v="label"]'); await p.waitForSelector('.aiw.on[data-v="label"]'); assert(/امسح الملصق الغذائي/.test(await p.textContent('.aicard')));
    const top = await p.evaluate(() => { const r = document.querySelector('.aiw.on .aiws').getBoundingClientRect(), s = document.querySelector('.aiplw svg').getBoundingClientRect(); return Math.abs((r.left + r.width / 2) - (s.left + s.width / 2)) < 12 && r.top < s.top + s.height * 0.3; }); assert(top, 'القسم المختار يصعد إلى أعلى الطبق');
    const up = await p.evaluate(() => [...document.querySelectorAll('.aiwt')].every((t) => { const m = t.getScreenCTM(); return Math.abs(m.b) < 0.02 && m.a > 0; })); assert(up, 'النص قائم (غير مائل) بعد الدوران');
    { const bx = await p.locator('.aiplw svg').boundingBox(), cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2, R = bx.width * 0.36; await p.mouse.move(cx + R, cy); await p.mouse.down();
      for (let k = 1; k <= 8; k++) { const a = k * Math.PI / 16; await p.mouse.move(cx + R * Math.cos(a), cy + R * Math.sin(a)); } await p.mouse.up(); await p.waitForTimeout(700);
      const now = await p.getAttribute('.aiw.on', 'data-v'); assert(now && now !== 'label', 'السحب يدير الطبق ويختار قسماً آخر: ' + now); await shot('1wheel'); }
    await p.click('.aiw[data-v="label"]'); await p.waitForSelector('.aiw.on[data-v="label"]'); assert.strictEqual(await p.getAttribute('.aiw[data-v="label"]', 'aria-pressed'), 'true'); await shot('1plate');
    await p.click('.aihub'); assert(/أدِر الطبق/.test(await p.textContent('.aicard'))); await p.focus('.aiw[data-v="herb"]'); await p.keyboard.press('Enter'); await p.waitForSelector('.aiw.on[data-v="herb"]'); assert(/الأعشاب/.test(await p.textContent('.aicard b')));
    await p.focus('.aiw[data-v="herb"]'); await p.keyboard.press('ArrowLeft'); await p.waitForSelector('.aiw.on[data-v="text"]');
    const ov = await p.evaluate(() => { const t = [...document.querySelectorAll('.aiwt')].map((e) => e.getBBox()), s = [...document.querySelectorAll('.aiws')].map((e) => e.getBBox()); return t.every((b) => b.width < 130) && new Set(t.map((b) => Math.round(b.height))).size === 1; }); assert(ov, 'أسماء الأقسام بسطر واحد وبارتفاع واحد');
    ok('1.59 الطبق عجلة: اللمس يدير القسم إلى الأعلى ويُظهر بطاقته (وصف، وسوم، «ابدأ»)، السحب يدير الطبق ويستقر على قسم، النص يبقى قائماً، المركز يعيد النظرة العامة، Enter والأسهم من لوحة المفاتيح'); }
  assert.strictEqual(await p.locator('.hello .aibtn').count(), 0); const tabs = await p.$$eval('.tabbar > button', (x) => x.map((b) => b.classList.contains('aifab') ? 'AI' : b.textContent.trim())); assert.deepStrictEqual(tabs, ['صفحتي', 'خطتي', 'AI', 'تثقيف', 'الإعدادات']); ok('م1: أيقونة المالك زر بارز في منتصف الشريط السفلي (بين خطتي وتثقيف) يفتح 4 خيارات بهوية «زنها»');
  // م2 الوصف + التحميل + الإضافة
  await pick('text'); await p.fill('#aiTxt', 'برجر بجبنة شيدر وكولا دايت'); await p.click('[data-act="aiGo"]');
  await p.waitForSelector('.aiload'); assert(/نحلل وصف وجبتك/.test(await p.textContent('.aiload'))); await shot('2load');
  await p.waitForSelector('.aikc'); assert.strictEqual(calls[calls.length - 1].mode, 'text'); assert.strictEqual(calls[calls.length - 1].demo, 1);
  assert(/542/.test(await p.textContent('.aikc'))); assert.strictEqual(await p.locator('.aiit').count(), 2); assert(/تقديرية/.test(await p.textContent('.aiest'))); assert(/تقديري/.test(await p.textContent('.aihead')));
  await shot('3text'); ok('م2 الوصف: حالة تحميل، ثم الأصناف بحصصها وسعرات كل صنف والمجموع والماكروز، مع وسم «تقديري» وتنبيه واضح');
  await p.click('.aiit >> nth=1 >> [data-act="aiDrop"]'); assert(/540/.test(await p.textContent('.aikc'))); await p.click('[data-act="aiCat"][data-v="out"]');
  await p.click('[data-act="aiAdd"]'); await p.waitForFunction(() => !document.querySelector('.aish'));
  const L = await p.evaluate(() => { const s = window.HissatiApp.state(), k = Object.keys(s.log).sort().pop(); return s.log[k]; });
  assert(L.ai && L.ai.length === 1 && L.ai[0].kcal === 540 && L.off.out === 1 && /برجر/.test(L.offT) && /تقدير المساعد/.test(L.offT), JSON.stringify(L));
  ok('م7: مراجعة الأصناف (استبعاد صنف يعيد الحساب) ثم «أضف إلى تسجيل اليوم» يكتب في السجل الموجود نفسه (أكل من الخارج + النص + الأرقام)');
  // تظهر في «تسجيل اليوم» وتُحذف منه
  await p.evaluate(() => { document.querySelector('[data-act="logOpen"]') ? document.querySelector('[data-act="logOpen"]').click() : 0; }); await p.waitForTimeout(300);
  if (!(await p.locator('.ailog').count())) { await p.evaluate(() => window.HissatiApp && 0); }
  const hasLog = await p.locator('.ailog').count(); if (hasLog) { assert(/540/.test(await p.textContent('.ailog'))); await shot('4daylog'); await p.click('.ailog [data-act="aiDel"]'); const L2 = await p.evaluate(() => { const s = window.HissatiApp.state(), k = Object.keys(s.log).sort().pop(); return s.log[k]; }); assert.strictEqual(L2.ai.length, 0); assert(!/برجر/.test(L2.offT || '')); ok('«تسجيل اليوم»: قائمة «أُضيف بالمساعد اليوم» بمجموعها، والحذف يزيلها من السجل'); await p.click('.sheet .sh [data-act="close"]').catch(() => { }); await p.waitForTimeout(200); }
  else console.log('   (ورقة تسجيل اليوم غير متاحة في نسخة العرض الآن — فُحص السجل مباشرة)');
  // م3 الصورة
  await p.click('.tabbar .aifab'); await pick('photo'); await p.fill('#aiNote', 'مطبوخ بقليل من الزيت');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="aiPick"][data-v="lib"]')]); await fc.setFiles(IMG);
  await p.waitForSelector('.aikc'); const c3 = calls[calls.length - 1]; assert.strictEqual(c3.mode, 'photo'); assert(c3.img && c3.img.length > 100 && c3.mime === 'image/jpeg' && /الزيت/.test(c3.text));
  assert(await p.locator('.aithumb').count() === 1 && await p.locator('.aiit').count() === 3); await shot('5photo'); ok('م3 الصورة: اختيار/التقاط صورة تُصغَّر وتُرسل مع الملاحظة، ثم الأصناف المتعرَّف عليها بقيمها وصورة مصغّرة');
  await p.click('[data-act="aiAdd"]'); await p.waitForFunction(() => !document.querySelector('.aish'));
  // م4–م5 الملصق
  await p.click('.tabbar .aifab'); await pick('label'); const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="aiPick"][data-v="cam"]')]);
  assert((await fc2.element().getAttribute('capture')) === 'environment'); await fc2.setFiles(IMG); await p.waitForSelector('.airate');
  assert(/للمناسبات فقط/.test(await p.textContent('.airate'))); const lt = await p.textContent('.ailbl'); assert(/640/.test(lt) && /1.5/.test(lt) && /غير مذكور/.test(lt));
  assert(/دهون متحولة/.test(await p.textContent('.ails.neg'))); assert(/تونة بالماء/.test(await p.textContent('.ails.alt'))); await shot('6label');
  ok('م4–م5 الملصق: «التقط صورة» يفتح الكاميرا الخلفية، القيم كما على الملصق وما لم يُذكر «غير مذكور»، والتقييم (للمناسبات) بالإيجابيات والمخاوف والأسباب والبدائل');
  await p.click('[data-act="aiAddLbl"]'); await p.waitForFunction(() => !document.querySelector('.aish'));
  // م6 التخزين
  await p.click('.tabbar .aifab'); await pick('store'); assert(/لا يمكن التأكد من سلامة الطعام من صورة/.test(await p.textContent('.aish')));
  const [fc3] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="aiPick"][data-v="lib"]')]); await fc3.setFiles(IMG); await p.waitForSelector('.aidur');
  const st = await p.textContent('.aish'); assert(/يُحفظ في الثلاجة/.test(st) && /6–8 أشهر/.test(st) && /علامات الفساد/.test(st) && /63°م/.test(st) && /عند الشك/.test(st)); await shot('7store');
  ok('م6 التخزين: المكان والحرارة والمدد وعلامات الفساد وما يمنع الأكل والطهي الآمن، وتنبيه أن الصورة لا تؤكد السلامة');
  // الأخطاء
  await p.click('[data-act="aiAgain"]'); mode = 'unclear'; const [fc4] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="aiPick"][data-v="lib"]')]); await fc4.setFiles(IMG);
  await p.waitForSelector('.aierr'); assert(/لم أتعرّف على طعام/.test(await p.textContent('.aierr')));
  mode = 'err'; await p.click('[data-act="aiRetry"]'); await p.waitForSelector('.aierr'); assert(/مشغول/.test(await p.textContent('.aierr'))); await shot('8err');
  mode = 'ok'; await p.click('[data-act="aiRetry"]'); await p.waitForSelector('.aidur'); ok('الأخطاء: الصورة غير الواضحة والمشغول تُعرض برسالة عربية واضحة و«حاول مرة أخرى» يعيد نفس الطلب');
  await p.click('.aish .sh [data-act="aiClose"]'); await p.waitForFunction(() => !document.querySelector('.aish'), null, { timeout: 5000 });
  const L3 = await p.evaluate(() => { const s = window.HissatiApp.state(), k = Object.keys(s.log).sort().pop(); return s.log[k]; }); assert(L3.ai.length >= 2 && L3.ai.some((x) => x.src === 'label') && L3.off.extra === 1);
  ok('السجل اليومي يجمع ما أُضيف من الصورة والملصق في نفس «تسجيل اليوم»');
  // 1.56 المكملات (تظهر في نسخة العرض/المعاينة)
  await p.click('.tabbar .aifab'); await p.waitForSelector('.aiw'); assert.strictEqual(await p.locator('.aiw').count(), 6); await pick('supp');
  await p.fill('#aiTxt', 'فيتامين د 5000 وحدة يومياً'); await p.click('[data-act="aiGoSupp"]'); await p.waitForSelector('.aiben');
  assert.strictEqual(calls[calls.length - 1].mode, 'supp'); assert(/5000/.test(calls[calls.length - 1].text));
  const sp = await p.textContent('.aish'); assert(/فائدة المكمّل/.test(sp) && /فوائد مثبتة علمياً/.test(sp) && /يُروَّج لها بلا دليل/.test(sp) && /من يستفيد منه/.test(sp) && /متى تظهر الفائدة/.test(sp));
  assert(/فوق الحد الآمن/.test(await p.textContent('.aidose'))); const us = await p.textContent('.aiuse'); assert(/الجرعة المناسبة/.test(us) && /600–800/.test(us) && /التوقيت المناسب/.test(us) && /أكبر وجبة/.test(us) && /التعارض مع الطعام/.test(us), us); assert(/دليل قوي/.test(await p.textContent('.airate'))); assert(/لا تبدأ مكمّلاً أو توقفه/.test(sp)); await shot('9supp');
  const m0 = await p.evaluate(() => window.HissatiApp.state().msgs.length); await p.click('[data-act="aiShare"]'); await p.waitForFunction(() => !document.querySelector('.aish'));
  const lm = await p.evaluate(() => { const m = window.HissatiApp.state().msgs; return [m.length, m[m.length - 1].t]; }); assert.strictEqual(lm[0], m0 + 1); assert(/تقييم مكمّل/.test(lm[1]) && /فوق الحد الآمن/.test(lm[1]), lm[1]);
  ok('1.56 المكملات: خيار خامس، الوصف أو الصورة، «كيف تأخذه» (الجرعة المناسبة، التوقيت، التعارض مع الطعام)، «فائدة المكمّل» (مثبتة/مروّجة/من يستفيد/متى/كيف)، درجة الدليل، الجرعة مقارنة بالحد الآمن، تنبيه الاستشارة، و«أرسلها لأخصائيك» يرسلها في الشات');
  // 1.57 الأعشاب (نسخة العرض)
  await p.click('.tabbar .aifab'); await p.waitForSelector('.aiw'); assert.strictEqual(await p.locator('.aiw').count(), 6); await pick('herb');
  assert(/لا تأكل نباتاً برياً/.test(await p.textContent('.aish')));
  const [fh] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="aiPick"][data-v="cam"]')]); await fh.setFiles(IMG); await p.waitForSelector('.aiben');
  assert.strictEqual(calls[calls.length - 1].mode, 'herb'); const ht = await p.textContent('.aish');
  assert(/تأكد من اسم العشب/.test(ht) && /بذور البصل/.test(ht) && /الفائدة المحتملة/.test(ht) && /كيف يُستعمل/.test(ht) && /تداخلات مع الأدوية/.test(ht) && /تجنّبه إذا/.test(ht) && /Nigella sativa/.test(ht)); await shot('11herb');
  await p.click('[data-act="aiHerbName"]'); assert.strictEqual(await p.inputValue('#aiTxt'), 'حبة البركة'); await p.click('[data-act="aiGoHerb"]'); await p.waitForSelector('.aiben'); assert.strictEqual(calls[calls.length - 1].text, 'حبة البركة');
  const k0 = await p.evaluate(() => window.HissatiApp.state().msgs.length); await p.click('[data-act="aiShare"]'); await p.waitForFunction(() => !document.querySelector('.aish'));
  const hm = await p.evaluate(() => { const m = window.HissatiApp.state().msgs; return [m.length, m[m.length - 1].t]; }); assert.strictEqual(hm[0], k0 + 1); assert(/سؤال عن عشب: حبة البركة/.test(hm[1]), hm[1]);
  ok('1.57 الأعشاب: صورة أو اسم، ثقة التعرّف وتحذير التشابه و«اكتب الاسم بدلاً»، الفائدة المحتملة، كيف يُستعمل، التعارض مع الطعام والأدوية، من يتجنّبه، و«أرسلها لأخصائيك»');
  // العرض على الحاسوب
  await p.setViewportSize({ width: 1280, height: 860 }); await p.click('.tabbar .aifab'); await p.waitForSelector('.aiw'); assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); await shot('10desk');
  await p.setViewportSize({ width: 360, height: 740 }); await p.waitForTimeout(150); assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); ok('يعمل على الجوال (360) والحاسوب (1280) بلا تمرير جانبي');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات مساعد الطعام (الواجهة)'); await b.close(); srv.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); process.exit(1); });
