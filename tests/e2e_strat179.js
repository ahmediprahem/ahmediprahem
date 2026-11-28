// 1.79 (ر4) المحرك الحسابي للاستراتيجية: الفهم المعتمد ← أسبوع (تناوب عادل، «كل يوم»، «لا يجتمعان»، الحساسية، حدود الفحص، التوزيع المختلف، الجرامات) — بلا ذكاء اصطناعي
const { fileUrl } = require('./_tmp.js'); const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'سلوى'); await p.press('[data-f="name"]', 'Tab');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); Object.assign(c, { sex: 'أنثى', age: 30, weight: 78, height: 162, goal: DATA.settings.goals[1][0], activity: DATA.settings.activity[1][0], meals: 4 }); DPApp.A.gen(); });
  await p.waitForFunction(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan && c.plan.days; });
  const C = () => p.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur))));
  const setParsed = (res, extra) => p.evaluate(([res, extra]) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); DPApp.A.genOpen(4); DPApp.A.ai176(); if (extra) extra(c); c.ai176.parsed = { at: Date.now(), prov: 'gl', ok: 1, res }; DPApp.A.tab('gen'); }, [res, extra]);
  const run = () => p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), v = S179.apply(c); return { rep: v.rep, T: v.T, days: v.plan.days.map((d) => d.slots.map((s) => ({ n: s.name, t: s.type, l: s.lines.filter((l) => !l.missing).map((l) => ({ n: l.name, g: l.g, e: l.e, ai: !!l.ai, text: l.text })) }))) }; });
  const has = (s, w) => p.evaluate(([s, w]) => s.l.some((l) => DPEngine.kwHit(l.n.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه'), w)), [s, w]);
  const ROT = ['جبن', 'بيض', 'زبادي', 'حليب', 'لبن'], RES = { meals: [{ key: 'g0m0', pattern: 'rotate', rotation: ROT, always: ['خبز'], avoid: [], notTogether: [['حليب', 'لبن']], tags: [], understood: '' }], avoid: [], prefer: [], understood: [] };
  await setParsed(RES); const plan0 = JSON.stringify((await C()).plan.days);
  let V = await run();
  // 1) حدود الفحص لكل يوم
  V.rep.forEach((o) => assert(o.errK <= 5, 'اليوم ' + o.d + ' خارج ±5%: ' + o.errK)); ok('كل الأيام السبعة داخل حدود الفحص (±5% سعرات) بعد التطبيق: أقصى انحراف ' + Math.max(...V.rep.map((o) => o.errK)) + '%');
  // 2) التناوب العادل وبلا تكرار متتالٍ
  const words = []; for (let d = 0; d < 7; d++) { const s = V.days[d].find((x) => x.n === 'الإفطار'); let hit = null; for (const w of ROT) { if (s.l.some((l) => l.ai) && await has({ l: s.l.filter((l) => l.ai) }, w)) { hit = w; break; } } words.push(hit); }
  assert.deepStrictEqual(words, ['جبن', 'بيض', 'زبادي', 'حليب', 'لبن', 'جبن', 'بيض']); for (let d = 1; d < 7; d++) assert.notStrictEqual(words[d], words[d - 1]);
  ok('التناوب العادل على الأيام: ' + words.join(' ← ') + ' (بلا تكرار في يومين متتاليين)');
  // 3) «كل يوم» + «لا يجتمعان» + بروتين رئيسي واحد
  for (let d = 0; d < 7; d++) { const s = V.days[d].find((x) => x.n === 'الإفطار'); assert(s.l.some((l) => l.ai && l.g === 0), 'خبز يوم ' + d); assert(!((await has(s, 'حليب')) && (await has(s, 'لبن'))), 'حليب ولبن معاً يوم ' + d); }
  ok('«مع الخبز» ثابت كل يوم، و«لا يجتمع حليب ولبن» في وجبة');
  const meatsB = V.days.map((d) => d.find((x) => x.n === 'الإفطار').l.filter((l) => l.g >= 2 && l.g <= 5 && !l.ai).length), warnD = V.rep.filter((o) => o.meals[0].st === 'warn').map((o) => o.d);
  meatsB.forEach((m, d) => assert(m === 0 || warnD.includes(d), 'لحم من المحرك بقي بلا تنبيه يوم ' + d)); ok('مصدر بروتين رئيسي واحد: لحم المحرك يُنقل إلى الغداء/العشاء، وما لم يتسع يُذكر بتنبيه (' + warnD.length + ' يوم)');
  assert.strictEqual(JSON.stringify((await C()).plan.days), plan0); ok('المعاينة لا تغيّر الخطة الحالية');
  // 4) الحساسية تغلب: حساسية البيض ← لا بيض، والسبب مذكور
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.allergens = ['حساسية البيض']; }); V = await run();
  for (let d = 0; d < 7; d++) assert(!(await has(V.days[d].find((x) => x.n === 'الإفطار'), 'بيض')), 'بيض مع الحساسية يوم ' + d);
  assert(V.rep[0].meals[0].notes.some((x) => /«بيض» مستبعد لهذا العميل/.test(x))); V.rep.forEach((o) => assert(o.errK <= 5));
  ok('حساسية البيض تغلب: لا بيض في أي يوم، والسبب مذكور، والتناوب على الباقي');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.allergens = []; });
  // 5) توزيع مختلف (صيام الاثنين والخميس) بوصفه الخاص، والجرامات
  await setParsed({ meals: [RES.meals[0], { key: 'g1m0', pattern: 'fixed', rotation: ['فول'], always: [], avoid: [], notTogether: [], tags: [], understood: '' }], avoid: [], prefer: [], understood: [] }, null);
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.ai176.groups.push({ id: 'v1', name: 'صيام', days: [2, 5], meals: [{ id: 'x', kind: 'main', name: 'الإفطار', time: '', desc: 'فول', recipe: '' }] }); c.ai176.units = 'g'; });
  V = await run(); if (process.env.DBG) console.log("DBG", JSON.stringify([V.rep[2].meals, V.rep[5].meals, V.days[5][0]])); for (const d of [2, 5]) { assert.strictEqual(V.rep[d].g, 'صيام'); assert(await has({ l: V.days[d].find((x) => x.n === 'الإفطار').l.filter((l) => l.ai) }, 'فول'), 'فول يوم ' + d); }
  assert(!(await has({ l: V.days[0].find((x) => x.n === 'الإفطار').l.filter((l) => l.ai) }, 'فول'))); assert(V.days[0][0].l.every((l) => /جم/.test(l.text) && !/جم.*جم/.test(l.text)), 'الجرامات مرة واحدة');
  ok('التوزيع المختلف (يوما الاثنين والخميس) بوصف وجباته الخاص، والتناوب الأساسي على الأيام الباقية، و«جرام» تُكتب بجانب كل كمية');
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.ai176.groups.length = 1; c.ai176.units = 'home'; });
  // 6) الواجهة: «طبّق» ← معاينة الأسبوع ← «اعتمد» (أرشيف ثم استبدال)
  await setParsed(RES); await p.waitForSelector('[data-a="s179Go"]'); await p.click('[data-a="s179Go"]'); await p.waitForSelector('.s179 table');
  assert.strictEqual(await p.locator('.s179 tbody tr').count(), 7); assert(await p.locator('.s179 .s179b.st-ok').count() >= 5); assert(await p.locator('.s179 li.ai').count() >= 14); ok('«⚙ طبّق على الخطة» يعرض معاينة الأسبوع: 7 أيام، وشارات ✓/⚠، والأصناف المأخوذة من الوصف مظللة');
  const nv0 = await p.evaluate(() => (DPApp.S.versions || []).filter((v) => v.kind === 'arch').length);
  await p.click('[data-a="s179Ok"]'); await p.waitForFunction(() => !document.querySelector('.s179 table')); await p.waitForTimeout(400);
  const c1 = await C(); assert.notStrictEqual(JSON.stringify(c1.plan.days), plan0); assert(c1.plan.ai179 && c1.plan.days[0].slots.some((s) => s.lines.some((l) => l.ai)));
  const nv1 = await p.evaluate(() => (DPApp.S.versions || []).filter((v) => v.kind === 'arch').length); assert(nv1 >= nv0 + 1, 'نسخة في الأرشيف قبل الاستبدال');
  ok('«✓ اعتمد الخطة»: الخطة السابقة تُحفظ في الأرشيف، والجديدة تحل محلها بنفس الشكل');
  // 7) الفهم المحلي بلا ذكاء اصطناعي
  await p.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); delete c.ai176.parsed; c.ai176.groups[0].meals[0].desc = 'أريد أن تتنوع يومياً بين الجبن والبيض والزبادي مع الخبز'; DPApp.A.tab('gen'); });
  await p.waitForSelector('[data-a="s179Loc"]'); await p.click('[data-a="s179Loc"]'); await p.waitForSelector('.ai176parsed');
  const pl = (await C()).ai176.parsed; assert.strictEqual(pl.prov, 'local'); assert.strictEqual(pl.res.meals[0].pattern, 'rotate'); assert.deepStrictEqual(pl.res.meals[0].rotation, ['جبن', 'بيض', 'زبادي']); assert.deepStrictEqual(pl.res.meals[0].always, ['خبز']);
  ok('«⚡ افهم محلياً» بلا ذكاء اصطناعي: تناوب جبن/بيض/زبادي و«كل يوم» خبز');
  assert.deepStrictEqual(errs, [], errs.join(' | ')); ok('لا أخطاء');
  console.log('\nنجح', n, 'اختبارات المحرك الحسابي للاستراتيجية 1.79'); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
