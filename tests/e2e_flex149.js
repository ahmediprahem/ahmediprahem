// 1.49: قائمة «بديل» في جدول الخطة تضيف «تبادل بروتين مرن» بمعاينة التعويض، والاختيار يعوّض ويعرض شريط تراجع؛ وحقل 🔁 لمجموعة التدوير في «الحصص والبدائل».
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [], SHOT = process.env.SHOT || '';
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SHOT ? 2 : 1 })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'عميل التبادل'); await p.selectOption('[data-f="sex"]', 'ذكر').catch(() => { }); await p.fill('[data-f="age"]', '35'); await p.fill('[data-f="weight"]', '85'); await p.fill('[data-f="height"]', '175'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = c.goal || DATA.settings.goals[2][0]; c.activity = c.activity || DATA.settings.activity[1][0]; c.plan = DPEngine.planWeek(Object.assign({ v2: true }, c), DATA); DPApp.S.tab = 'plan'; DPApp.A.tab ? DPApp.A.tab('plan') : null; });
  const pos = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), d = c.plan.days[0]; for (let s = 0; s < d.slots.length; s++) { if (d.slots[s].type !== 'L') continue; const l = d.slots[s].lines.findIndex((x) => x.g >= 2 && x.g <= 5); if (l >= 0) return [0, s, l]; } return null; });
  assert(pos, 'سطر لحم في الغداء');
  const before = await p.evaluate((q) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), day = c.plan.days[q[0]], m = [0, 0, 0]; day.slots.forEach((s) => s.lines.forEach((l) => { const X = DATA.EX[l.g]; m[0] += X[0] * l.e; m[1] += X[1] * l.e; m[2] += X[2] * l.e; })); return { m, name: day.slots[q[1]].lines[q[2]].name, json: JSON.stringify(day) }; }, pos);
  await p.evaluate((q) => { const el = document.createElement('button'); el.dataset.d = q[0]; el.dataset.s = q[1]; el.dataset.l = q[2]; if (!document.getElementById('alt_' + q.join('_'))) { const box = document.createElement('span'); box.id = 'alt_' + q.join('_'); document.querySelector('main').appendChild(box); } DPApp.A.alt('', el); }, pos);
  const sel = '#alt_' + pos.join('_') + ' select'; await p.waitForSelector(sel);
  const opts = await p.$$eval(sel + ' optgroup option', (x) => x.map((o) => [o.value, o.textContent]));
  assert(opts.length >= 3 && opts.every((o) => /^f\d+/.test(o[0]) && /حصة|بلا تعويض/.test(o[1])), JSON.stringify(opts.slice(0, 3)));
  ok('«بديل» يضيف قسم «تبادل بروتين مرن (يعوّض باقي اليوم)» بمعاينة: «يُنقص N حصة دهون/نشويات»');
  const pick = opts.find((o) => /دهون/.test(o[1])) || opts[0]; await p.selectOption(sel, pick[0]); await p.waitForSelector('#flxbar.on');
  const after = await p.evaluate((q) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), day = c.plan.days[q[0]], m = [0, 0, 0]; day.slots.forEach((s) => s.lines.forEach((l) => { const X = DATA.EX[l.g]; m[0] += X[0] * l.e; m[1] += X[1] * l.e; m[2] += X[2] * l.e; })); return { m, bar: document.getElementById('flxbar').textContent }; }, pos);
  assert(/تم التبديل إلى/.test(after.bar), after.bar); assert(Math.abs(after.m[2] - before.m[2]) <= 2.5 || /تعذّر/.test(after.bar), before.m + ' → ' + after.m + ' | ' + after.bar);
  if (SHOT) { await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: SHOT + '/flex_bar.png' }); }
  ok('الاختيار يبدّل ويعوّض (دهون اليوم ثابتة ±½ حصة) ويعرض شريطاً بما تغيّر: «' + after.bar.slice(0, 70) + '…»');
  await p.click('#flxbar [data-a="flexUndo"]'); const back = await p.evaluate((q) => JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur).plan.days[q[0]]), pos); assert.strictEqual(back, before.json);
  ok('«تراجع» يعيد اليوم كما كان حرفياً');
  await p.click('.rail [data-a="settings"]'); await p.click('[data-a="setTab"][data-v="portions"]'); await p.waitForSelector('.rotinfo'); await p.evaluate(() => { document.querySelectorAll('details.fg').forEach((x) => { x.open = true; }); });
  const rf = 'input[data-fe="' + encodeURIComponent('سلمون') + '|rot"]'; await p.waitForSelector(rf, { state: 'attached' }); await p.fill(rf, 'أسماك'); await p.press(rf, 'Tab'); await p.waitForTimeout(150);
  const rot = await p.evaluate(() => [DPApp.S.settings.over['سلمون'] && DPApp.S.settings.over['سلمون'].rot, DATA.foods.find((f) => f.n === 'سلمون').rot]); assert.deepStrictEqual(rot, ['أسماك', 'أسماك']);
  if (SHOT) { await p.evaluate(() => { const el = document.querySelector('[data-fe="' + encodeURIComponent('سلمون') + '|rot"]'); el.scrollIntoView({ block: 'center' }); }); await p.screenshot({ path: SHOT + '/rot_field.png' }); await p.evaluate(() => window.scrollTo(0, 0)); await p.evaluate(() => DPApp.A.settings()); await p.click('[data-a="setTab"][data-v="portions"]'); await p.screenshot({ path: SHOT + '/rot_info.png' }); }
  ok('«الحصص والبدائل»: حقل 🔁 مجموعة التدوير لكل صنف يُحفظ في الإعدادات ويصل للمحرك، وبطاقة تشرح المجموعات');
  // 1.49ب: «قائمة الطعام» في توليد الخطة (الخطوة 5)
  await p.evaluate(() => DPApp.A.genNew()); await p.fill('[data-f="name"]', 'م'); await p.selectOption('[data-f="sex"]', 'ذكر'); await p.fill('[data-f="age"]', '35'); await p.fill('[data-f="weight"]', '85'); await p.fill('[data-f="height"]', '175'); await p.press('[data-f="height"]', 'Tab');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 1 });
  await p.evaluate(() => { DPApp.A.genStep(3); DPApp.A.genRevOk(); DPApp.A.genOpen(4); DPApp.A.genEs(5); }); await p.waitForSelector('select[data-gp]');
  const ems = await p.$$eval('[data-a="genEm"]', (x) => x.map((e) => e.textContent)), lu = ems.findIndex((t) => /غداء/.test(t)); if (lu >= 0) await p.click('[data-a="genEm"][data-v="' + lu + '"]');
  const gp = await p.$$eval('select[data-gp]', (x) => x.map((s) => [s.dataset.gp, [...s.querySelectorAll('optgroup option')].map((o) => o.textContent)])).then((L) => L.find((x) => x[1].length));
  assert(gp && gp[1].some((t) => /بقوليات/.test(t)) && gp[1].some((t) => /(متوسطة|عالية|قليلة) الدهون/.test(t)), JSON.stringify(gp));
  const c0 = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return JSON.stringify([c.mealDist || null, c.baseCounts || null, c.eqvPicks || {}]); });
  const v0 = await p.$eval('select[data-gp="' + gp[0] + '"] optgroup option', (o) => o.value); await p.selectOption('select[data-gp="' + gp[0] + '"]', v0); await p.waitForSelector('#flxbar.on [data-a="flexUndoB"]');
  const c1 = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return { pk: c.eqvPicks, bc: c.baseCounts }; }); assert(Object.values(c1.pk).length && c1.bc, JSON.stringify(c1));
  await p.click('#flxbar [data-a="flexUndoB"]'); const c2 = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return JSON.stringify([c.mealDist || null, c.baseCounts || null, c.eqvPicks || {}]); }); assert.strictEqual(c2, c0);
  ok('«قائمة الطعام»: خيارات بروتين من البقول وكل درجات اللحوم، والاختيار ينقل الحصص ويعوّض في التوزيع ومجموع اليوم، و«تراجع» يعيده');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء في وحدة التحكم');
  console.log('\nنجح', n, 'اختبارات 1.49'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
