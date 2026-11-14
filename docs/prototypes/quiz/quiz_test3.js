const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 1 }), errs = [], res = {};
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + process.argv[2]); const out = process.argv[3], shots = [];
  const shot = async n => { await p.waitForTimeout(500); await p.screenshot({ path: out + '/w' + String(shots.length).padStart(2, '0') + '_' + n + '.png' }); shots.push(n); };
  const next = async () => { await p.click('#cta'); };
  const satisfy = async () => { for (let k = 0; k < 14; k++) { const s = await p.$('.sugg:not([hidden])'); if (!s) break; await s.click(); await p.waitForTimeout(150); } };
  res.countryDisabled = await p.$eval('#cta', e => e.disabled); await p.click('.cc[data-v="eg"]'); res.countryEnabled = !(await p.$eval('#cta', e => e.disabled)); await shot('country'); await next();
  await p.waitForTimeout(1600); res.story1 = await p.$eval('.intro', e => e.innerText.replace(/\s+/g, ' ').slice(0, 120)); res.typing = !(await p.$eval('.intro', e => e.classList.contains('fin'))); await shot('story1');
  for (let k = 0; k < 4; k++) { const fin = await p.$eval('.intro', e => e.classList.contains('fin')); if (!fin) await next(); if (k === 2) await shot('story3'); await next(); }
  res.welcome = await p.$eval('.body h1', e => e.innerText); await next(); // welcome
  await next(); await next(); await next(); await next(); await next(); await next(); await next(); await next(); // who body health target act meals week bintro(+)
  // أول شاشة بروتين الفطور: الزر معطّل حتى الحد الأدنى
  res.proDisabled = await p.$eval('#cta', e => e.disabled);
  const cards = await p.$$('.fl .food'); await cards[0].click(); await cards[1].click(); res.proStill = await p.$eval('#cta', e => e.disabled); await shot('b_pro_partial'); await cards[2].click(); res.proEnabled = !(await p.$eval('#cta', e => e.disabled));
  res.egName = await p.evaluate(() => [...document.querySelectorAll('.food .n')].map(x => x.textContent).join('|').slice(0, 200)); await next();
  // بقية فطور: استعمل «اقترح لي» حيث لا يكتمل الحد
  for (let g = 0; g < 4; g++) { await satisfy(); res['b' + g] = !(await p.$eval('#cta', e => e.disabled)); await next(); }
  for (let i = 0; i < 4; i++) { await satisfy(); res['m' + i] = !(await p.$eval('#cta', e => e.disabled)); if (i === 0) await shot('meal_req'); await next(); }
  await next(); await shot('freq'); await p.click('[data-a="fq"][data-k="red"][data-v="1"]'); await p.click('[data-a="fq"][data-k="red"][data-v="1"]'); await p.click('[data-a="fq"][data-k="red"][data-v="1"]'); res.freqMsg = await p.$eval('#fqm', e => e.innerText); await p.click('[data-a="fq"][data-k="red"][data-v="-1"]'); await p.click('[data-a="fq"][data-k="red"][data-v="-1"]'); await p.click('[data-a="fq"][data-k="red"][data-v="-1"]'); await p.click('[data-a="fq"][data-k="poultry"][data-v="-1"]'); await next(); await next(); // real(done above) freq, scale
  await p.waitForSelector('.scene', { timeout: 15000 }); await shot('wait'); await p.waitForTimeout(2500); await shot('wait2');
  res.waitText = await p.$eval('.body h1', e => e.innerText); res.noPlan = (await p.$$('.mealc')).length === 0;
  await p.click('[data-a="spec"]'); await p.waitForSelector('.stepper'); await shot('spec');
  res.specTag = await p.$eval('.tag', e => e.innerText); const k0 = await p.$eval('.stepper b', e => +e.innerText); await p.click('[data-a="kcal"][data-v="50"]'); await p.waitForTimeout(200); const k1 = await p.$eval('.stepper b', e => +e.innerText); res.kcal = [k0, k1];
  await p.fill('.ta', 'ابدأ بالفطور وتابع معي بعد أسبوع'); res.capTxt = await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => c.innerText).filter(t => /منطقية الكميات/.test(t))[0]);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
  await p.click('#cta'); await p.waitForSelector('.msg'); await shot('client_plan');
  res.approvedText = await p.$eval('.msg', e => e.innerText); res.noTools = (await p.$$('[data-a="bank"]')).length === 0; res.plan = await p.evaluate(() => document.querySelector('.mealc').innerText.slice(0, 260));
  res.lunch = await p.evaluate(() => window.__lunch().join(' ')); res.freqShown = await p.evaluate(() => /غداؤك/.test(document.body.innerText)); res.bread = await p.evaluate(() => /عيش/.test(document.querySelector('.body').innerText)); res.khobz = await p.evaluate(() => /خبز/.test(document.querySelector('.body').innerText));
  console.log(JSON.stringify(res, null, 1)); console.log('ERRS', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.error(String(e).slice(0, 700)); process.exit(1); });
