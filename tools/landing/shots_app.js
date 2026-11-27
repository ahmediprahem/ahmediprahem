// لقطات «زنها» الحقيقية لصفحة الاستقبال: نسخة العرض + محطة مُحاكاة ترد بنتائج مطابقة لصور الصفحة
const { chromium } = require('playwright'), path = require('path'), http = require('http'), fs = require('fs');
const OUT = process.argv[2], ROOT = path.resolve(__dirname, '../..'), A = (f) => path.join(ROOT, 'assets/login', f);
const R = {
  photo: { mode: 'photo', est: true, ok: true, title: 'دجاج مشوي مع فريكة وفتوش وحمص', confidence: 'medium', note: 'الزيت المضاف قد يزيد السعرات قليلاً', items: [
    { name: 'صدر دجاج مشوي', portion: 'قطعة متوسطة', grams: 150, kcal: 248, p: 46, c: 0, f: 5 }, { name: 'فريكة مطبوخة', portion: '¾ كوب', grams: 140, kcal: 165, p: 6, c: 33, f: 1.5 },
    { name: 'سلطة فتوش', portion: 'طبق جانبي', grams: 150, kcal: 120, p: 2, c: 14, f: 6 }, { name: 'حمص بالطحينة', portion: '3 ملاعق كبيرة', grams: 50, kcal: 90, p: 4, c: 7, f: 5 }], total: { kcal: 623, p: 58, c: 54, f: 17.5 } },
  supp: { mode: 'supp', est: true, ok: true, product: 'فيتامين د3 5000 وحدة', kind: 'vitamin', serving: 'كبسولة واحدة', grade: 'A', gradeWhy: 'دليل قوي عند وجود نقص', summary: 'مفيد لمن لديه نقص مثبت بالتحليل، والجرعة اليومية أعلى من الحد الآمن للاستعمال الطويل بلا إشراف.',
    items: [{ name: 'فيتامين د3', amount: '5000 وحدة', form: 'كوليكالسيفيرول', usual: '600–800 وحدة', upper: '4000 وحدة', verdict: 'high', note: 'أعلى من الحد الآمن' }], proven: ['صحة العظام عند النقص'], emerging: [], claimed: ['يقي من الاكتئاب'], who: ['من لديه نقص مثبت بالتحليل'], notNeeded: ['مستواك طبيعي'], onset: '8–12 أسبوعاً', dose: '600–800 وحدة يومياً للوقاية', timing: ['مع أكبر وجبة فيها دهون'], food: ['يُمتص أفضل مع الدهون'], howTo: [], cautions: ['لا تتجاوز 4000 وحدة بلا تحليل'], quality: ['اختر منتجاً موثّقاً'], foods: ['السمك الدهني', 'صفار البيض'] },
  store: { mode: 'store', est: true, ok: true, food: 'سلمون طازج', category: 'أسماك', place: 'fridge', temp: 'الثلاجة 4°م أو أقل', fridge: 'يوم إلى يومين', freezer: '2–3 أشهر', room: 'لا يزيد عن ساعتين', howTo: ['في وعاء محكم على الرف السفلي'], spoilSigns: ['رائحة نفاذة'], unsafeSigns: ['لزوجة'], handling: ['اطهه حتى 63°م'], note: 'السلامة لا تُؤكد من صورة' }
};
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'hissati_demo.html'));
  const srv = http.createServer(async (q, r) => { if (q.url === '/v1/ai/food') { let b = ''; for await (const c of q) b += c; const j = JSON.parse(b); r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify(R[j.mode])); } r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
  await new Promise((x) => srv.listen(0, '127.0.0.1', x)); const URL = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce' })).newPage();
  await p.goto(URL); await p.waitForTimeout(1200); for (let i = 0; i < 4; i++) { const s = p.getByText('تخطّي'); if (await s.count()) { await s.first().click().catch(() => { }); await p.waitForTimeout(400); } }
  await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
  const reopen = async () => { await p.reload(); await p.waitForTimeout(1500); for (let i = 0; i < 4; i++) { const s = p.getByText('تخطّي'); if (await s.count()) { await s.first().click().catch(() => { }); await p.waitForTimeout(400); } } await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' }); await p.click('.tabbar .aifab'); await p.waitForSelector('.aiw'); };
  const shot = async (n) => { await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, n + '.png') }); };
  await shot('app_today');
  await p.click('.tabbar .aifab'); await p.waitForSelector('.aiw'); await p.click('.aiw[data-v="photo"]'); await p.waitForSelector('.aiw.on[data-v="photo"]'); await shot('app_plate');
  const run = async (mode, file, name, scroll) => { await p.click('[data-act="aiMode"][data-v="' + mode + '"]'); const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="aiPick"]')]); await fc.setFiles(file); await p.waitForSelector('[data-act="aiAgain"], .aikc, .airate', { timeout: 15000 }); if (scroll) await p.evaluate((y) => { const s = document.querySelector('.aish .sb') || document.querySelector('.sheet .sb'); if (s) s.scrollTop = y; }, scroll); await shot(name); await reopen(); };
  await run('photo', A('crop_plate.jpg'), 'app_ai_meal', 0);
  await p.click('.aiw[data-v="supp"]'); await p.waitForSelector('.aiw.on[data-v="supp"]'); await p.click('[data-act="aiMode"][data-v="supp"]'); await p.waitForSelector('#aiTxt'); await p.fill('#aiTxt', 'فيتامين د3 5000 وحدة يومياً'); await p.click('[data-act="aiGoSupp"]');
  await p.waitForSelector('.aidose, .aiben', { timeout: 15000 }); await shot('app_ai_supp'); await reopen();
  await p.click('.aiw[data-v="store"]'); await p.waitForSelector('.aiw.on[data-v="store"]'); await run('store', A('crop_salmon.jpg'), 'app_ai_store', 0);
  await b.close(); srv.close(); console.log('ok');
})().catch((e) => { console.error(e); process.exit(1); });
