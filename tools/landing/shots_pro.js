// لقطات «زنها Pro» الحقيقية لصفحة الاستقبال (بيانات تجريبية محلية)
const { fileUrl } = require('../../tests/_tmp.js'); const { chromium } = require('playwright'), path = require('path'), login = require('../../tests/auth_helper');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' })).newPage(); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../../admin.html'))); await login(p);
  for (const [n, a, w, h] of [['منى أحمد', '41', '88', '160'], ['خالد يوسف', '35', '97', '178'], ['سارة محمود', '29', '72', '163']]) {
    await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', n); await p.selectOption('[data-f="sex"]', n.startsWith('خالد') ? 'ذكر' : 'أنثى').catch(() => { }); await p.fill('[data-f="age"]', a); await p.fill('[data-f="weight"]', w); await p.fill('[data-f="height"]', h); await p.press('[data-f="height"]', 'Tab'); await p.waitForTimeout(200);
  }
  await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
  const shot = async (n) => { await p.waitForTimeout(500); await p.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { if (/hamed/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/hamed/g, 'د. أحمد'); if (t.nodeValue.trim() === 'h') t.nodeValue = 'أ'; } document.querySelectorAll('body *').forEach((e) => { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /المساعد/.test(e.textContent) && e.textContent.length < 40) e.style.display = 'none'; }); }); await p.screenshot({ path: OUT + '/' + n + '.png' }); };
  await p.evaluate(() => DPApp.A.tab('client')); await p.waitForSelector('.cf151'); await shot('pro_client');
  await p.evaluate(() => DPApp.A.home()); await p.waitForSelector('.home'); await shot('pro_home');
  await b.close(); console.log('ok');
})().catch((e) => { console.error(e); process.exit(1); });
