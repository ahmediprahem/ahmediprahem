// 0.99: المقدمة القصصية: يختار العميل دولته فنخاطبه بلهجته، ثم أربع شاشات تُكتب حرفاً حرفاً مع اهتزاز لكل حرف، ثم التعريف المعتاد. تظهر مرة واحدة
const assert = require('assert'), { devices } = require('playwright'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { b, d, close } = await linked('intro', errs), shot = process.env.IN_SHOT;
  await d.evaluate(() => DPApp.A.hxv()); await d.click('main [data-a="hxInvForm"]'); await d.fill('#hxi_l', 'سارة'); await d.click('[data-a="hxInvMake"]'); await d.waitForSelector('.hxinv.made .hxlink'); const LINK = (await d.textContent('.hxinv.made .hxlink')).trim();
  const open = async () => { const c = await b.newContext({ ...devices['Pixel 7'] }); await c.addInitScript(() => { window.__vib = 0; navigator.vibrate = () => { window.__vib++; return true; }; }); const p = await c.newPage(); p.on('pageerror', (e) => errs.push(String(e))); await p.goto(LINK); return p; };
  const p = await open(); await p.waitForSelector('.intro.in-cc'); assert.strictEqual(await p.locator('.in-c').count(), 19); assert(/من أي بلد أنت/.test(await p.innerText('.in-top')));
  if (shot) await p.screenshot({ path: shot + '0.png' }); ok('أول فتح: شاشة «من أي بلد أنت؟» بتسع عشرة دولة قبل أي شيء');
  await p.click('.in-c[data-v="eg"]'); await p.waitForSelector('.intro.in-s1'); assert.strictEqual(await p.evaluate(() => localStorage.getItem('hissati_cc')), 'eg'); assert.strictEqual((await p.innerText('.in-body h1')).trim(), 'من السبت');
  await p.waitForFunction(() => { const t = document.getElementById('inl0').textContent; return t.length > 2 && t.length < 'هبدأ الدايت من السبت'.length; }); assert.strictEqual(await p.locator('.intro.fin').count(), 0, 'الزر لا يظهر قبل اكتمال الكتابة'); if (shot) await p.screenshot({ path: shot + '1a.png' });
  await p.waitForSelector('.intro.in-s1.fin', { timeout: 20000 }); const v1 = await p.evaluate(() => window.__vib); assert(v1 >= 30, 'اهتزاز لكل حرف: ' + v1);
  assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('.in-l')].map((x) => x.textContent)), ['هبدأ الدايت من السبت', 'بعد العزومة دي بس', 'الأسبوع الجاي إن شاء الله']); assert.strictEqual((await p.innerText('[data-act="introNext"]')).trim(), 'أيوه، ده أنا!');
  await p.waitForTimeout(900); if (shot) await p.screenshot({ path: shot + '1.png' }); ok('مصر: السطور تُكتب حرفاً حرفاً باللهجة المصرية مع اهتزاز لكل حرف (' + v1 + ')، ثم يظهر زر «أيوه، ده أنا!»');
  await p.click('[data-act="introNext"]'); await p.waitForSelector('.intro.in-s2'); await p.waitForTimeout(400); await p.click('.in-body h1'); await p.waitForSelector('.intro.in-s2.fin'); assert(/عقاب/.test(await p.innerText('.in-punch'))); assert(await p.locator('.in-art svg').count() === 1);
  await p.waitForTimeout(1100); if (shot) await p.screenshot({ path: shot + '2.png' }); ok('لمسة على الشاشة تُكمل الكتابة فوراً، وتظهر الجملة الملوّنة والرسمة');
  await p.click('[data-act="introNext"]'); await p.waitForSelector('.intro.in-s3.fin'); assert.strictEqual(await p.locator('.in-card').count(), 3); await p.waitForTimeout(2200); if (shot) await p.screenshot({ path: shot + '3.png' });
  await p.click('[data-act="introNext"]'); await p.waitForSelector('.intro.in-s4'); await p.waitForSelector('.intro.in-s4.fin', { timeout: 20000 }); await p.waitForTimeout(1100); if (shot) await p.screenshot({ path: shot + '4.png' });
  await p.click('[data-act="introNext"]'); await p.waitForSelector('.onb-story.s1'); assert.strictEqual(await p.evaluate(() => localStorage.getItem('hissati_intro')), '1'); ok('بعد الشاشات الأربع («زنها مختلفة» ثم «خطوة واحدة النهارده») يدخل التعريف المعتاد');
  await p.reload(); await p.waitForSelector('.onb'); await p.waitForTimeout(600); assert.strictEqual(await p.locator('.intro').count(), 0); ok('المقدمة تظهر مرة واحدة فقط');
  for (const [cc, t, btn] of [['sa', 'من الأحد', 'إيه، هذا أنا!'], ['kw', 'من الأحد', 'إي، هذا أنا!'], ['jo', 'من الاثنين', 'إي، هاد أنا!'], ['ma', 'غداً', 'نعم، هذا أنا!']]) { const q = await open(); await q.click('.in-c[data-v="' + cc + '"]'); await q.waitForSelector('.intro.in-s1'); assert.strictEqual((await q.innerText('.in-body h1')).trim(), t); await q.click('.in-body h1'); await q.waitForSelector('.fin'); assert.strictEqual((await q.innerText('[data-act="introNext"]')).trim(), btn); await q.context().close(); }
  ok('لكل دولة لهجتها: السعودية، الخليج، الشام، وفصحى مبسطة لبقية الدول');
  const s = await open(); await s.click('.onb-skip'); await s.waitForFunction(() => !document.querySelector('.onb')); assert.strictEqual(await s.evaluate(() => localStorage.getItem('hissati_intro') + localStorage.getItem('hissati_onb')), '11'); ok('«تخطّي» يتجاوز المقدمة والتعريف معاً');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
