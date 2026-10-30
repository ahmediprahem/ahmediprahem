// «الحضور» و«من يحتاج اهتمامك» (0.50): ملخص العميل في تبويب واحد (الحالة الصحية، الوزن واتجاهه، آخر خطة، الالتزام يوماً بيوم وما خرج عنه)،
// «سجّل الحضور» يغلق موعد اليوم ويحفظ وزن الزيارة، «＋ نظام غذائي جديد» ينقل لزرّي التوليد، والفرز: أعراض/طلب تعديل/التزام منخفض يومين/نزول سريع،
// والمؤشر الجانبي يعرض الحالة الصحية.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.click('.rail [data-a="new"][data-v="ex"]'); await p.fill('[data-f="name"]', 'سارة'); await p.fill('[data-f="weight"]', '90'); await p.fill('[data-f="height"]', '165'); await p.fill('[data-f="age"]', '40');
  await p.selectOption('[data-f="goal"]', { index: 2 }); await p.selectOption('[data-f="activity"]', { index: 3 }); await p.waitForTimeout(150);
  await p.evaluate(() => {
    const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), day = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }, now = Date.now();
    c.conditions = ['سكري النوع الثاني']; c.allergens = ['المكسرات'];
    c.hx = { since: now - 20 * 864e5, planV: 1, sentAt: now - 10 * 864e5, weights: [[now - 14 * 864e5, 90], [now - 7 * 864e5, 88.6], [now - 864e5, 87.2]], logs: {} };
    c.hx.logs[day(-2)] = { dow: 1, n: 10, done: 4, ck: {}, sw: {}, note: {}, skip: {}, water: 4, h: {}, off: { sweets: 1 }, offT: '' };
    c.hx.logs[day(-1)] = { dow: 2, n: 10, done: 5, ck: {}, sw: { '0_1': 'خبز توست' }, note: {}, skip: { 2: 1 }, water: 6, h: { walkMin: 30 }, off: { sym: 1 }, offT: 'دوخة بعد الظهر', sub: now };
    c.appts = [{ id: 'a1', d: day(0), t: '23:59', type: 'متابعة أسبوعية' }];
  });
  await p.click('.rail [data-a="home"]'); await p.waitForSelector('.wktodo'); const td = await p.textContent('.wktodo');
  assert(/سجّل أعراضاً/.test(td) && /دوخة/.test(td), td); assert(/التزام منخفض يومين متتاليين: 40% ثم 50%/.test(td), td); assert(/نزول سريع: 2.8 كجم/.test(td), td);
  ok('«من يحتاج اهتمامك»: الأعراض مع نصها، والتزام منخفض يومين متتاليين، والنزول السريع (أكثر من 1% أسبوعياً)');
  await p.click('.wktodo .wkgo:has-text("سجّل أعراضاً")'); await p.waitForSelector('.ci'); assert.strictEqual(await p.getAttribute('main .tabs [data-v="ci"]', 'class'), 'on');
  const ci = await p.textContent('.ci');
  for (const w of ['سارة', 'سكري النوع الثاني', 'حساسية: المكسرات', '87.2', '↓ 2.8', 'لم يسجّل', '40%', '50% ✓', 'بدّل إلى خبز توست', 'لم يأكل وجبة 3', 'دوخة بعد الظهر', '30 دقيقة', 'حلويات', 'موعد اليوم 23:59']) assert(ci.includes(w), 'ينقص: ' + w + '\n' + ci);
  ok('تبويب «✅ الحضور»: البيانات والحالة الصحية، الوزن الآن واتجاهه منذ البداية، الالتزام يوماً بيوم مع التبديل والوجبة المتروكة وما خرج عن النظام، وموعد اليوم');
  if (process.env.SHOTS) await p.screenshot({ path: process.env.SHOTS + '/ci.png', fullPage: true });
  await p.fill('#ci_w', '86.9'); await p.fill('#ci_ws', '96'); await p.click('[data-a="ciIn"]'); await p.waitForSelector('.ci .ok:has-text("سُجّل حضور اليوم")');
  const c = await p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  assert.strictEqual(c.appts[0].st, 'done'); assert.strictEqual(c.weight, 86.9); const v = c.med.visits.pop(); assert.strictEqual(v.w, 86.9); assert.strictEqual(v.waist, 96); assert.strictEqual(c.att.length, 1);
  ok('«سجّل الحضور»: يغلق موعد اليوم، ويحفظ وزن الزيارة والخصر في الملف الطبي ويحدّث الوزن');
  await p.click('[data-a="ciNew"]'); await p.waitForSelector('main .ciflash'); assert.strictEqual(await p.getAttribute('main .tabs [data-v="client"]', 'class'), 'on');
  ok('«＋ نظام غذائي جديد» ينقل مباشرة إلى زرّي «اختر خطة جاهزة / ولّد خطة جديدة»');
  await p.click('main [data-a="gen"]'); await p.waitForSelector('.pnav'); await p.click('.pnav button[data-v="0"]'); await p.waitForSelector('#hud');
  await p.evaluate(() => { if (document.querySelector('#hud.hf-min')) document.querySelector('#hud [data-a="hudToggle"]').click(); }); await p.waitForSelector('#hud .hudhl'); assert(/سكري النوع الثاني/.test(await p.textContent('#hud .hudhl')));
  ok('المؤشر الجانبي في صفحة الخطة يعرض الحالة الصحية والحساسية بجانب الحصص');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await b.close(); console.log('\nنجح', n, 'اختبارات الحضور والفرز');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
