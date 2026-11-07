// «اليوم» الجديد (0.60، خلف المفتاح S.ui.today2): افتراضي للحساب الجديد، و«جرّب» للحالة المحفوظة من 0.59 والرجوع من «أنا»،
// الوجبة التالية فوق الطيّة على 390×664، و«ينتظرك» (اثنتان ثم «+N»)، وزر «سجّل يومك» الثابت بساعة محقونة، ومسح أهداف اللمس والخط.
const assert = require('assert'), linked = require('./hx_link_helper'), scan = require('./zenha_scan');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, hxCheck, cPoll, C, close } = await linked('today2', errs, { keepUi: true });
  const st = () => m.evaluate(() => window.HissatiApp.state().ui);
  assert.strictEqual((await st()).today2, true); await m.waitForSelector('.t2ring'); assert.strictEqual(await m.locator('#daylog').count(), 0, 'لا بطاقة «تسجيل اليوم» مضمّنة في الشكل الجديد');
  assert.strictEqual(await m.locator('.tabbar [data-v="me"]').count(), 1);
  ok('حساب جديد على 0.60 ← «اليوم» الجديد افتراضياً (S.ui.today2)، وشريط التبويب فيه «أنا»، والبطاقة المضمّنة أُزيلت');
  // حالة محفوظة من 0.59 (بلا S.ui) ← الشكل الحالي مع بطاقة «جرّب»
  await m.evaluate(() => { const A = window.HissatiApp; delete A.state().ui; A.render(); }); await m.waitForSelector('.t2c');
  assert(await m.isVisible('#daylog') && await m.locator('.tabbar button').count() === 5, 'الشكل الحالي بخمسة تبويبات');
  await m.click('.t2c [data-act="t2Later"]'); assert.strictEqual(await m.locator('.t2c').count(), 0, '«لاحقاً» تخفيها');
  await m.evaluate(() => { const A = window.HissatiApp; A.state().ui.t2Later = Date.now() - 8 * 864e5; A.render(); }); await m.waitForSelector('.t2c');
  await m.click('.t2c [data-act="t2Try"]'); await m.waitForSelector('.t2ring'); assert.strictEqual((await st()).today2, true);
  await m.click('.tabbar [data-act="tab"][data-v="me"]'); await m.uncheck('[data-t2]'); await m.click('[data-act="tab"][data-v="today"]');
  assert(await m.isVisible('#daylog') && !(await m.locator('.t2ring').count()) && !(await m.locator('.t2c').count()), 'الرجوع من «أنا» يعيد الشكل الحالي بلا بطاقة «جرّب»');
  assert.deepStrictEqual([(await st()).today2, (await st()).t2Off], [false, 1]);
  ok('حالة 0.59 بلا S.ui ← الشكل الحالي مع «✨ جرّب»، و«لاحقاً» تخفيها 7 أيام، و«جرّب» يحوّل، والرجوع من «أنا» يعيد الشكل الحالي');
  await m.click('[data-act="tab"][data-v="me"]'); await m.check('[data-t2]'); await m.click('[data-act="tab"][data-v="today"]'); await m.waitForSelector('.t2ring');
  await m.evaluate(() => { const t = document.querySelector('.toast .tx'); if (t) t.click(); document.querySelector('.scroll').scrollTop = 0; }); await m.waitForTimeout(500);
  // الطول والطيّة على 390×664
  const g = await m.evaluate(() => { const sc = document.querySelector('.scroll'), r = (q) => document.querySelector(q).getBoundingClientRect(); return { vw: innerWidth, vh: innerHeight, sh: sc.scrollHeight, ch: sc.clientHeight, meal: r('.t2meal').top, bar: r('.logbar').top, kids: [...document.querySelector('.device').children].map((e) => e.className).join('|') + ' / ' + [...document.querySelector('.scr').children].map((e) => e.className).join('|'), fl: [...document.querySelectorAll('.scr > *')].filter((e) => getComputedStyle(e).position === 'absolute' && !e.matches('.tabbar, .wmk')).length }; });
  assert.deepStrictEqual([g.vw, g.vh], [390, 664]); assert(g.meal + 60 < g.bar, 'الوجبة التالية فوق الطيّة: ' + JSON.stringify(g)); assert(g.sh <= 2.5 * g.ch, 'الطول ' + (g.sh / g.ch).toFixed(2) + ' شاشة'); assert.strictEqual(g.fl, 1, 'عنصر عائم واحد (زر «سجّل يومك»)');
  ok('على 390×664: الوجبة التالية تبدأ عند ' + Math.round(g.meal) + 'px فوق الطيّة، وطول «اليوم» ' + (g.sh / g.ch).toFixed(2) + ' شاشة (≤ 2.5)، وعنصر عائم واحد');
  // الوجبة التالية: زرّان ظاهران و«⋯ المزيد»؛ والوجبات الأخرى سطور تُفتح في مكانها
  const acts = await m.$$eval('.t2meal .t2acts [data-act]', (b) => b.map((x) => x.dataset.act)); assert.deepStrictEqual(acts, ['whole', 'skip', 'mealMore']);
  await m.click('.t2meal [data-act="mealMore"]'); assert.deepStrictEqual(await m.$$eval('.t2meal .t2more [data-act]', (b) => b.map((x) => x.dataset.act)).then((a) => a.slice(0, 3)), ['note', 'ask', 'photo']);
  const other = await m.getAttribute('.t2row >> nth=0', 'data-v'); await m.click('.t2row >> nth=0'); await m.waitForSelector('#meal' + other + '.t2meal'); await m.click('#meal' + other + ' [data-act="mealOpen"]'); assert.strictEqual(await m.locator('#meal' + other).count(), 0);
  ok('الوجبة التالية مفتوحة بأصنافها مع «أكلتها كاملة» و«لم آكلها» ظاهرين، و«⋯ المزيد» (ملاحظة، اسأل، صوّر)، والوجبات الأخرى سطور تُفتح وتُطوى في مكانها');
  // «ينتظرك»: اثنتان ظاهرتان ثم «+N» يفتح الباقي بمحتواه
  await m.evaluate(() => { const A = window.HissatiApp, S = A.state(); S.planAt = Date.now() - 8 * 864e5; S.fw = 'pending'; A.render(); });
  const w = await m.evaluate(() => ({ shown: document.querySelectorAll('.waitc .wline').length, more: (document.querySelector('[data-act="waitAll"]') || {}).textContent || '', first: (document.querySelector('.wline') || {}).dataset.w }));
  assert(w.shown === 2 && /\+\d+/.test(w.more) && w.first === 'fw', JSON.stringify(w)); const rest = +w.more.match(/\+(\d+)/)[1];
  await m.click('[data-act="waitAll"]'); await m.waitForSelector('.sheet'); const cards = await m.locator('.sheet .sb > section, .sheet .sb > .banner, .sheet .sb > button.card').count(); assert.strictEqual(cards, rest, 'الباقي كاملاً في الورقة');
  await m.click('.sheet [data-act="close"]'); await m.evaluate(() => { const A = window.HissatiApp; A.state().fw = 'done'; A.render(); });
  ok('«ينتظرك»: شريط واحد يُظهر بطاقتين بالأولوية (الفوز الأول أولاً) ثم «+' + rest + '» يفتح الباقي كاملاً في ورقة');
  // زر «سجّل يومك» بساعة محقونة: ثانوي 10:00، وأساسي 19:00، ويفتح الورقة، والإرسال يصل الأخصائي
  const at = (h) => m.evaluate((h) => { window.__dn = window.__dn || Date.now; const t = new Date(); t.setHours(h, 0, 0, 0); const T = t.getTime(); Date.now = () => T; window.HissatiApp.render(); }, h);
  await at(10); assert(await m.locator('.logbar .btn.sec').count() === 1 && /سجّل يومك/.test(await m.textContent('.logbar')), 'ثانوي صباحاً');
  await at(19); assert(await m.locator('.logbar .btn.prim:not(.sec)').count() === 1, 'أساسي بعد 18:00');
  const prim = await m.evaluate(() => [...document.querySelectorAll('.btn:not(.sec):not(.sm)')].filter((b) => { const r = b.getBoundingClientRect(); return r.height && r.bottom > 0 && r.top < innerHeight && !b.closest('.sheet'); }).length); assert(prim <= 1, 'فعل أساسي واحد ظاهر: ' + prim);
  await m.evaluate(() => { Date.now = window.__dn; window.HissatiApp.render(); });
  await m.click('[data-act="logOpen"]'); await m.waitForSelector('.sheet #daylog'); assert.strictEqual(await m.locator('.sheet #daylog [data-act="wAdd"]').count(), 0, 'الماء للعرض فقط');
  await m.click('.sheet [data-act="allDay"]'); await m.click('.sheet [data-act="subDay"]'); await m.waitForSelector('.logbar:has-text("أُرسل اليوم — عدّل")'); assert.strictEqual(await m.locator('.sheet').count(), 0);
  await cPoll(); await d.click('main .tabs [data-v="hx"]'); await hxCheck(); const c = await C(), lg = c.hx.logs[Object.keys(c.hx.logs).sort().pop()]; assert(lg.sub > 0 && lg.done === lg.n, JSON.stringify(lg));
  ok('«سجّل يومك» ثابت فوق التبويب: ثانوي 10:00 وأساسي 19:00 (فعل أساسي واحد ظاهر)، يفتح «تسجيل اليوم» في ورقة بنفس الحقول، والإرسال يصل «حصة» ويصير «✓ أُرسل اليوم — عدّل»');
  // الماء مصدر واحد: سطر الماء في بطاقة الالتزام، و«+ كوب»
  const w0 = await m.evaluate(() => { const S = window.HissatiApp.state(); return S.log[Object.keys(S.log).sort().pop()].water || 0; }); await m.click('.t2ring [data-act="wAdd"]');
  assert.strictEqual(await m.evaluate(() => { const S = window.HissatiApp.state(); return S.log[Object.keys(S.log).sort().pop()].water; }), w0 + 1); assert.strictEqual(await m.locator('.scroll [data-act="wAdd"], .scroll [data-act="water"]').count(), await m.locator('.t2ring [data-act="wAdd"], .t2ring [data-act="water"]').count(), 'لا مدخل ماء آخر في «اليوم»');
  ok('الماء مصدر إدخال واحد في «اليوم»: أكواب 44 و«+ كوب» في بطاقة الالتزام');
  // المسح: أهداف اللمس ≥ 44 والخط ≥ 13 في «اليوم» و«أنا»
  await m.evaluate(() => { document.querySelector('.scroll').scrollTop = 0; });
  let t = await scan.touch(m), f = await scan.fonts(m); assert.deepStrictEqual([t, f], [[], []], 'اليوم');
  await m.click('[data-act="tab"][data-v="me"]'); for (const k of ['eat', 'pray', 'med', 'quiet']) await m.click('[data-act="remG"][data-v="' + k + '"]');
  t = await scan.touch(m); f = await scan.fonts(m); assert.deepStrictEqual([t, f], [[], []], 'أنا');
  ok('مسح آلي: 0 عنصر تفاعلي أقل من 44×44، و0 نص أقل من 13px، في «اليوم» و«أنا» (والمجموعات مفتوحة)');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات «اليوم» الجديد');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 2000)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
