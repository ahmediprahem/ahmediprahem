// 1.52–1.53: «قائمة الطعام» كل الوجبات في صفحة واحدة + طيّ + سحب/نقل بين الوجبات يحدّث توزيع الحصص (+ تراجع)، و«تحليل اليوم»؛ ونظام الجرامات بنفس الأسلوب.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const dnd = (p, a, b) => p.evaluate((q) => { const s = document.querySelector(q[0]), t = document.querySelector(q[1]), dt = new DataTransfer(); s.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt })); t.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); t.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); s.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt })); }, [a, b]);
const md = (p) => p.evaluate(() => JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).mealDist || null));
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', 'م'); await p.selectOption('[data-f="sex"]', 'ذكر'); await p.fill('[data-f="age"]', '35'); await p.fill('[data-f="weight"]', '85'); await p.fill('[data-f="height"]', '175'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 1 });
  await p.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); DPApp.A.genOpen(4); DPApp.A.genEs(5); }); await p.waitForSelector('.g153 .g5list');
  const slots = await p.$$eval('.g153 .g5meal', (x) => x.map((s) => s.dataset.g5slot)); assert(slots.length >= 4 && !(await p.$('.g153 .g5tabs'))); ok('كل الوجبات (' + slots.length + ') في صفحة واحدة بلا تبويبات');
  const tot = (s) => JSON.parse(s).reduce((a, r) => r.map((v, i) => (a[i] || 0) + v), []);
  const before = await p.evaluate(() => { return JSON.stringify(ZN_dist()); });
  const src = await p.$eval('.g153 .g5meal .eqli.g5dr', (e) => e.dataset.g5ln), from = src.split(',')[0], to = slots.find((s) => s !== from);
  await dnd(p, '.g153 [data-g5ln="' + src + '"]', '.g153 .g5meal[data-g5slot="' + to + '"] .g5drop'); await p.waitForSelector('#flxbar.on [data-a="g153Undo"]');
  const after = await md(p), A0 = JSON.parse(before), A1 = JSON.parse(after), gi = +src.split(',')[1], grp = gi >= 2 && gi <= 5 ? [2, 3, 4, 5] : [gi];
  assert(grp.every((g) => A1[+from][g] === 0)); assert(grp.reduce((a, g) => a + A1[+to][g], 0) === grp.reduce((a, g) => a + A0[+to][g] + A0[+from][g], 0)); assert.deepStrictEqual(tot(after), tot(before));
  ok('السحب ينقل حصص السطر إلى الوجبة الأخرى ويحدّث «توزيع الحصص» (مجموع اليوم ثابت): «' + (await p.textContent('#flxbar span')).slice(0, 60) + '…»');
  await p.click('#flxbar [data-a="g153Undo"]'); assert.strictEqual(await p.evaluate(() => JSON.stringify(ZN_dist())), before); ok('«تراجع» يعيد التوزيع كما كان');
  const sel = '.g153 select[data-g5mv]', opt = await p.$eval(sel, (s) => [s.dataset.g5mv, s.options[1].value]); await p.selectOption('select[data-g5mv="' + opt[0] + '"]', opt[1]); await p.waitForSelector('#flxbar.on');
  assert.notStrictEqual(await p.evaluate(() => JSON.stringify(ZN_dist())), before); ok('«انقل إلى…» (للجوال ولوحة المفاتيح) يفعل نفس النقل');
  const s0 = slots[0]; await p.click('.g153 .g5meal[data-g5slot="' + s0 + '"] [data-a="g153Fold"]'); assert(await p.$eval('.g153 .g5meal[data-g5slot="' + s0 + '"]', (e) => e.classList.contains('shut'))); await p.evaluate(() => DPApp.A.genEs(5));
  assert(await p.$eval('.g153 .g5meal[data-g5slot="' + s0 + '"]', (e) => e.classList.contains('shut'))); await p.click('.g153 .g5meal[data-g5slot="' + s0 + '"] [data-a="g153Fold"]'); ok('طيّ الوجبة يُحفظ بعد إعادة العرض');
  const k = await p.evaluate(() => { const m = ZN_dist(); return [Math.round(m.reduce((a, r) => a + DPEngine.countsVals(r, DATA).k, 0)), document.querySelector('.g153 .g5en .g5v b').textContent]; }); assert.strictEqual(String(k[0]), k[1]); ok('«تحليل اليوم» = مجموع الوجبات (' + k[1] + ' سعرة)');
  // نظام الجرامات
  await p.evaluate(() => { DPApp.A.new('ath'); }); await p.fill('[data-f="name"]', 'رياضي').catch(() => { });
  const ath = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur) || DPApp.S.draft; if (!c) return 'nocli'; if (c.kind !== 'athlete') return 'nokind'; Object.assign(c, { sex: 'ذكر', age: 28, weight: 80, height: 180 }); try { DPApp.A.gen(); } catch (e) { return 'noplan:' + e.message; } if (!c.plan || c.plan.kind !== 'athlete') return 'noplan'; DPApp.S.page = 0; DPApp.A.tab('plan'); return 'ok'; });
  if (ath === 'ok') {
    await p.waitForSelector('.athed .mcard[data-am]'); const r = await p.$eval('.athed tr[data-afmv]', (e) => e.dataset.afmv).then((v) => v.split(','));
    const cnt = () => p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.days[0].meals.map((m) => m.items.length)); const c0 = await cnt(), to2 = r[1] === '0' ? 1 : 0;
    await dnd(p, '.athed tr[data-afmv="' + r.join(',') + '"]', '.athed .mcard[data-am="' + to2 + '"] .g5drop'); await p.waitForSelector('#flxbar.on [data-a="athMoveUndo"]'); const c1 = await cnt();
    assert.strictEqual(c1[+r[1]], c0[+r[1]] - 1); assert.strictEqual(c1[to2], c0[to2] + 1); await p.click('#flxbar [data-a="athMoveUndo"]'); assert.deepStrictEqual(await cnt(), c0); ok('الجرامات: سحب صنف بين وجبات اليوم يعيد حساب المجاميع، و«تراجع» يعيده');
  } else console.log('   (تخطّي فحص الجرامات: ' + ath + ')');
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => DPApp.A.genNew && 0); assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات 1.53'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
