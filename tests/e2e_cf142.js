// 1.42 (قرار المالك): ملف العميل بنمط Wellbeing — عمود المعلومات وقائمة العملاء، «نظرة عامة» ببطاقات القياسات (الأحمر خارج المرجع)،
// صفحة القياس (+ قراءة، منحنى، سجل بالتاريخ)، علامة ؟ للأهمية، و48 تحليلاً من الدليل المرجعي للمالك في نفس مخزن «الملف الطبي».
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const URL = fileUrl(path.resolve(__dirname, '../admin.html'));
const D = (k) => new Date(Date.now() - k * 864e5).toISOString().slice(0, 10);
const seed = async (p) => {
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'منى أحمد'); await p.selectOption('[data-f="sex"]', 'أنثى'); await p.fill('[data-f="age"]', '32'); await p.fill('[data-f="weight"]', '82'); await p.fill('[data-f="height"]', '163'); await p.press('[data-f="height"]', 'Tab');
  await p.evaluate((d) => { const S = DPApp.S, c = S.clients.find((x) => x.code === S.cur); c.med = { visits: [{ id: 'v1', d: d[0], w: 85, waist: 95, bps: 128, bpd: 82 }, { id: 'v2', d: d[1], w: 83.5 }], labs: [{ id: 'l1', d: d[1], v: { ldl: 168, hdl: 55, fbg: 92, ins: 10 } }] }; S.clients.push(Object.assign({}, c, { code: 'C0777', name: 'سارة خالد', med: { visits: [], labs: [] } })); DPApp.A.pick(c.code); }, [D(21), D(5)]);
  await p.waitForSelector('main .mxgrid');
};
const audit = (p) => p.evaluate(() => {
  const P = (c) => { const m = c.match(/[\d.]+/g).map(Number); return /^color\(/.test(c) ? m.slice(0, 3).map((x) => x * 255).concat(m.slice(3)) : m; };
  const L = (c) => { const m = P(c); const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const bg = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor, q = P(c), a = q.length > 3 ? q[3] : 1; if (a >= 0.5) return c; e = e.parentElement; } return 'rgb(255, 255, 255)'; };
  return [...document.querySelectorAll('main .mxov b, main .mxov small, main .mxov .mxs, main .mxov h3, main .mxtd span, main .mxbl span, main .cfside .mxkv b, main .cfside .mxacc summary span, main .mxpage h2, main .mxpage td, main .mxref')].filter((e) => e.getClientRects().length && e.textContent.trim())
    .map((e) => { const a = L(getComputedStyle(e).color), c = L(bg(e)); return [e.textContent.trim().slice(0, 16), Math.round((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05) * 100) / 100]; }).filter((x) => x[1] < 4.5);
});
(async () => {
  const br = await chromium.launch();
  // ١ دليل التحاليل
  let p = await (await br.newContext({ viewport: { width: 1680, height: 900 }, reducedMotion: 'reduce' })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(URL); await login(p);
  const L = await p.evaluate(() => {
    const X = DPApp.MX, LAB = X.LAB, LAB_CAT = X.LAB_CAT, c0 = { sex: 'أنثى' }, m0 = { sex: 'ذكر' }, ath = { sex: 'أنثى', kind: 'athlete' }, f = (c, k, v) => X.flag(c, k, v);
    return { n: LAB.length, bad: LAB.filter((x) => x.length !== 7 || !x[4] || !x[6]).map((x) => x[0]), cats: LAB_CAT.length, tsh: f(c0, 'tsh', 4.2)[0], altF: f(c0, 'alt', 38)[0], altM: f(m0, 'alt', 38)[0], fer: f(ath, 'ferritin', 30), ferN: f(c0, 'ferritin', 28)[0], hscrp: [f(c0, 'hscrp', 0.5)[0], f(c0, 'hscrp', 2)[0], f(c0, 'hscrp', 3.5)[0]], b1: f(c0, 'b1', 50), egfr: f(c0, 'egfr', 50)[1], uacr: f(c0, 'uacr', 45)[1], fbg: f(c0, 'fbg', 110)[0] };
  }).catch(() => null);
  if (L === null) { assert.fail('DPApp.MX غير متاح'); }
  assert.strictEqual(L.n, 48); assert.deepStrictEqual(L.bad, []); assert.strictEqual(L.cats, 11);
  assert.deepStrictEqual([L.tsh, L.altF, L.altM, L.ferN, L.fbg], [2, 2, 0, 1, 1]); assert.deepStrictEqual(L.fer, [1, 'دون هدف الرياضيين (35)']); assert.deepStrictEqual(L.hscrp, [0, 1, 2]); assert.strictEqual(L.b1[2], 1); assert.strictEqual(L.egfr, 'G3a'); assert.strictEqual(L.uacr, 'A2');
  ok('48 تحليلاً في 11 فئة بنطاقات الدليل المرجعي وأهمية كل تحليل: TSH > 4.0 أحمر، ALT للنساء > 35، فيريتين الرياضيين < 35 برتقالي، hs-CRP بثلاثة مستويات، eGFR وuACR بمراحل KDIGO، والثيامين بلا لون');
  // ٢ الحاسوب 1440: ثلاثة أعمدة و«نظرة عامة» افتراضية
  await seed(p);
  let s = await p.evaluate(() => ({ tab: DPApp.S.tab, list: !!document.querySelector('main .cfwb > .cflist') && getComputedStyle(document.querySelector('main .cflist')).display !== 'none', side: !!document.querySelector('main .cfside .cfhead .cfname'), heads: document.querySelectorAll('main .cfhead').length, cards: [...document.querySelectorAll('main .mxgrid .mxc:not(.mxadd)')].map((e) => [e.dataset.v, e.className.match(/lv-(\w+)/)[1]]), rows: document.querySelectorAll('main .cflr').length, over: document.documentElement.scrollWidth > innerWidth + 1 }));
  assert.strictEqual(s.tab, 'ov'); assert(s.list && s.side); assert.strictEqual(await p.locator('main .mxshort .mxsc').count(), 6, 'الاختصارات'); assert.strictEqual(await p.locator('main .mxgrid .mxc').count(), 9, 'تسع بطاقات (3 أساسية + آخر 5 + أضف)');
  assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('main .cftabs > button')].map((b) => b.dataset.g)), ['file', 'data', 'medical', 'plan', 'follow', 'admin'], 'الملف الطبي مجموعة مستقلة (1.72: + البيانات، والإدارة تجمع المواعيد والاشتراك)');
  assert.strictEqual(await p.locator('main .cfseg [data-v="med"]').count(), 0, 'الملف الطبي خارج الملف العام'); assert.strictEqual(s.heads, 1); assert.strictEqual(s.rows, 2); assert(!s.over);
  const lv = Object.fromEntries(s.cards); assert.strictEqual(lv.ldl, 'hi'); assert.strictEqual(lv.bmi, 'hi'); assert.strictEqual(lv.waist, 'hi'); assert.strictEqual(lv.bp, 'mid'); assert.strictEqual(await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), h = DPApp.MX.series(c, 'homa'); return h.length + ':' + h[0].v; }), '1:2.27');
  assert(s.cards.findIndex((x) => x[0] === 'ldl') >= 3, 'LDL ضمن آخر القياسات');
  ok('1680: قائمة العملاء | المحتوى | عمود المعلومات، و6 اختصارات و9 بطاقات، و«الملف الطبي» تبويب مستقل عن الملف العام (رأس الملف نفسه مرة واحدة)، و«نظرة عامة» تفتح أولاً، والبطاقات: LDL وBMI والخصر بالأحمر، والضغط برتقالي، وHOMA-IR يُحسب من السكر والأنسولين (2.27)');
  const todo = await p.evaluate(() => [...document.querySelectorAll('main .mxtd')].map((b) => [b.querySelector('span').textContent, b.classList.contains('done')]));
  assert(todo.some((t) => /الوزن الأسبوعي/.test(t[0]) && t[1])); assert(todo.some((t) => /تحليل خارج المرجع/.test(t[0]) && !t[1]));
  await p.click('main .mxtd:has-text("خارج المرجع")'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'med'); await p.click('main .cftabs [data-g="file"]'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'ov');
  ok('«الحالة العامة» و«قائمة المهام» من حالة العميل الفعلية، وكل مهمة تفتح إجراءها؛ وزر «الملف» يعود إلى «نظرة عامة»');
  // ٣ صفحة الوزن: + ثم الحفظ ثم المنحنى والسجل
  await p.click('main .mxc[data-v="w"]'); await p.waitForSelector('main .mxpage[data-k="w"]');
  assert.strictEqual(await p.isVisible('#mx_v'), false); await p.click('main .mxplus'); await p.fill('#mx_v', '81.2'); await p.fill('#mx_d', D(0)); await p.click('main [data-a="mxSave"]');
  s = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return { w: c.weight, n: c.med.visits.filter((v) => v.w != null).length, pts: document.querySelectorAll('main .mxpage .mxsvg circle').length, first: document.querySelector('main .mxtbl tbody tr td.mxv').textContent, hero: document.querySelector('main .mxbig b').textContent }; });
  assert.deepStrictEqual([s.w, s.n, s.pts, s.first, s.hero], [81.2, 3, 3, '81.2', '81.2']);
  ok('صفحة الوزن: «+» يفتح قراءة جديدة، والحفظ في زيارات «الملف الطبي» ويحدّث وزن العميل، والمنحنى 3 نقاط، والسجل بالأحدث أولاً');
  await p.click('main .mxpage .mxq summary'); assert(/أسبوعياً/.test(await p.textContent('main .mxpage .mxqp'))); ok('علامة ؟ تُظهر أهمية القياس ونطاقه');
  await p.click('main .mxtbl tbody tr:first-child [data-a="mxDel"]'); assert.strictEqual(await p.evaluate(() => DPApp.S.clients.find((x) => x.code === DPApp.S.cur).med.visits.filter((v) => v.w != null).length), 2); ok('حذف قراءة من السجل');
  // ٤ الإضافة من القائمة: بحث ثم تحليل جديد يظهر بالأحمر وفي «الملف الطبي»
  await p.click('main [data-a="mxBack"]'); await p.click('main .mxadd'); await p.waitForSelector('main .mxpick'); await p.fill('#mx_q', 'فيريتين');
  const vis = await p.evaluate(() => [...document.querySelectorAll('main .mxopt')].filter((o) => o.getClientRects().length).map((o) => o.querySelector('span').textContent)); assert.deepStrictEqual(vis, ['الفيريتين']);
  await p.click('main .mxopt:not([hidden]) button'); assert(await p.isVisible('#mx_v'), 'الإضافة من القائمة تفتح النموذج مباشرة'); await p.fill('#mx_v', '12'); await p.click('main [data-a="mxSave"]');
  s = await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return { lab: c.med.labs.some((l) => l.v.ferritin === 12), chip: document.querySelector('main .mxhero .mxst').textContent }; });
  assert(s.lab); assert.strictEqual(s.chip, 'منخفض'); await p.click('main [data-a="mxBack"]'); assert(/2 خارج المرجع/.test(await p.textContent('main .mxgh .link')), await p.textContent('main .mxgh .link'));
  assert.strictEqual(await p.locator('main .mxgrid .mxc[data-v="ferritin"]').count(), 1, 'التحليل الجديد لا يظهر في «نظرة عامة»');
  await p.evaluate(() => DPApp.A.mxOpen('hip')); await p.click('main .mxplus'); await p.fill('#mx_v', '104'); await p.click('main [data-a="mxSave"]'); await p.click('main [data-a="mxBack"]');
  await p.evaluate(() => DPApp.A.mxOpen('vitd', { dataset: { add: '1' } })); await p.fill('#mx_v', '35'); await p.click('main [data-a="mxSave"]'); await p.click('main [data-a="mxBack"]');
  const g = await p.evaluate(() => [...document.querySelectorAll('main .mxgrid .mxc:not(.mxadd)')].map((e) => e.dataset.v)); assert.deepStrictEqual(g.slice(0, 5), ['w', 'bmi', 'bp', 'vitd', 'hip'], JSON.stringify(g));
  ok('كل قياس جديد يظهر في «نظرة عامة» (آخر ما أُضيف أولاً): فيتامين د ضمن المرجع، ومحيط الورك، والفيريتين');
  await p.evaluate(() => DPApp.A.tab('med')); assert(/الفيريتين/.test(await p.textContent('main .cfbody')));
  ok('«أضف قياساً»: بحث بالاسم، والتحليل يُحفظ في تحاليل «الملف الطبي» نفسها، ويُحسب في «خارج المرجع» في «نظرة عامة»');
  assert.deepStrictEqual(await (await p.evaluate(() => DPApp.A.tab('ov')), audit(p)), []);
  // ٥ الليلي
  await p.click('#hd .dwbtn'); await p.waitForFunction(() => document.documentElement.dataset.dw === 'dark'); await p.evaluate(() => DPApp.A.tab('ov')); let low = await audit(p); assert.deepStrictEqual(low, [], JSON.stringify(low));
  await p.evaluate(() => DPApp.A.mxOpen('ldl')); low = await audit(p); assert.deepStrictEqual(low, [], JSON.stringify(low)); await p.click('#hd .dwbtn');
  ok('النهاري والليلي: نصوص «نظرة عامة» وصفحة القياس وعمود المعلومات ≥ 4.5:1');
  // ٦ 1280: بلا قائمة العملاء، وعمود المعلومات باقٍ
  await p.setViewportSize({ width: 1280, height: 860 }); await p.evaluate(() => DPApp.A.tab('ov')); await p.waitForTimeout(100);
  s = await p.evaluate(() => ({ list: getComputedStyle(document.querySelector('main .cflist')).display, side: !!document.querySelector('main .cfside .mxfs'), over: document.documentElement.scrollWidth > innerWidth + 1, h: document.documentElement.scrollHeight })); assert.deepStrictEqual([s.list, s.side, s.over], ['flex', true, false]); assert(s.h < 1300, 'الصفحة طويلة ' + s.h);
  const lr = await p.evaluate(() => [document.querySelector('main .cflist').getBoundingClientRect().left < document.querySelector('main .cfmain').getBoundingClientRect().left, document.querySelector('main .cfside').getBoundingClientRect().left > document.querySelector('main .cfmain').getBoundingClientRect().left]); assert.deepStrictEqual(lr, [true, true], 'القائمة يساراً والمعلومات يميناً');
  assert.strictEqual(await p.isVisible('#mx_lq'), false); await p.click('main .mxlsb'); assert(await p.isVisible('#mx_lq')); await p.fill('#mx_lq', 'سارة'); assert.deepStrictEqual(await p.evaluate(() => [...document.querySelectorAll('main .cflr')].filter((b) => b.getClientRects().length).map((b) => b.querySelector('b').textContent)), ['سارة خالد']);
  await p.click('main .cflr:not([hidden])'); assert.strictEqual(await p.evaluate(() => DPApp.S.cur), 'C0777'); assert.strictEqual(await p.evaluate(() => DPApp.S.tab), 'ov');
  ok('1280: قائمة العملاء على اليسار وعمود المعلومات على اليمين، وزر البحث يفتح خانة تصفّي القائمة، والنقر ينقل إلى «نظرة عامة» للعميل الآخر، وبلا تمرير أفقي (' + s.h + ')');
  // ٧ الجوال
  for (const W of [390, 360]) {
    const m = await (await br.newContext({ ...devices['iPhone 13'], viewport: { width: W, height: 844 }, reducedMotion: 'reduce' })).newPage(); m.on('pageerror', (e) => errs.push(String(e))); m.on('dialog', (d) => d.accept()); await m.goto(URL); await login(m); await seed(m);
    s = await m.evaluate(() => ({ wb: !!document.querySelector('main .cfwb'), head: !!document.querySelector('main > * .cfhead, main .cfhead'), cols: getComputedStyle(document.querySelector('main .mxgrid')).gridTemplateColumns.split(' ').length, over: document.documentElement.scrollWidth > innerWidth + 1 }));
    assert.deepStrictEqual(s, { wb: false, head: true, cols: 2, over: false }, W + JSON.stringify(s));
    await m.click('main .mxc[data-v="ldl"]'); await m.click('main .mxpage .mxq summary'); const r = await m.evaluate(() => { const b = document.querySelector('main .mxqp').getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth; }); assert(r, 'نافذة الأهمية خارج الشاشة');
    assert.strictEqual(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  }
  ok('الجوال (390 و360): الرأس أعلى الصفحة، والبطاقات عمودان، ونافذة ؟ داخل الشاشة، وبلا تمرير أفقي');
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات ملف العميل 1.42');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
