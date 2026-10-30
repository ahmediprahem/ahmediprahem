// المكملات والأعشاب (0.56): قائمة مرجعية «مسودة» بمراجعها (NIH ODS، NCCIH، ISSN، FDA) لا يُرشَّح منها إلا ما يعتمده الأخصائي، ويضيف أصنافه؛
// الترشيح من «الحضور» بجرعة وملاحظة، ويصل «حصتي» في «مكملاتي من أخصائيك» مع التنبيهات.
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, m, cPoll, close } = await linked('supps', errs);
  await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="supp"]'); await d.waitForSelector('.supt');
  const rows = await d.locator('.supt tr').count(), drafts = await d.locator('.supt .dxb.draft').count(), txt = await d.textContent('main');
  assert(rows >= 20 && drafts === 18, rows + '/' + drafts); for (const w of ['NIH Office of Dietary Supplements', 'NCCIH', 'ISSN', 'لا يُرشَّح صنف للعميل قبل أن تعتمده أنت', 'العرقسوس', 'ترفع ضغط الدم']) assert(txt.includes(w), w);
  ok('«الإعدادات ← 💊 المكملات والأعشاب»: 10 مكملات و8 أعشاب «مسودة» لكل منها متى يُنظر فيه والجرعة المرجعية والتنبيهات والمرجع');
  await d.click('[data-a="suppOk"][data-v="vitd"]'); await d.fill('#sp_n', 'خل التفاح'); await d.selectOption('#sp_k', 'h'); await d.fill('#sp_w', 'يُخفف بالماء'); await d.click('[data-a="suppAdd"]');
  assert.strictEqual(await d.locator('.supt .dxb.draft').count(), 17);
  await d.evaluate(() => DPApp.A.pick(DPApp.S.clients[0].code)); await d.waitForSelector('main .tabs [data-v="ci"]'); await d.click('main .tabs [data-v="ci"]'); await d.waitForSelector('#cs_s');
  const opts = await d.$$eval('#cs_s option', (o) => o.map((x) => x.textContent)); assert.deepStrictEqual(opts, ['💊 فيتامين د', '🌿 خل التفاح'], JSON.stringify(opts));
  ok('الترشيح يقتصر على المعتمد (فيتامين د) وما أضافه الأخصائي (خل التفاح)؛ المسودات لا تظهر');
  await d.fill('#cs_d', '1000 وحدة يومياً لمدة 3 أشهر'); await d.fill('#cs_n', 'بعد تحليل 25-OH'); await d.click('[data-a="suppPick"]'); await d.click('[data-a="suppSend"]'); await d.waitForSelector('.toast:has-text("وصلت المكملات")');
  await cPoll(); await m.click('[data-act="tab"][data-v="progress"]'); const sc = await m.textContent('.supi'); assert(/فيتامين د/.test(sc) && /1000 وحدة يومياً/.test(sc) && /بعد تحليل/.test(sc) && /الكالسيوم/.test(sc), sc);
  ok('«أرسل إلى حصتي»: يظهر في «💊 مكملاتي من أخصائيك» بالجرعة والملاحظة والتنبيه');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختبارات المكملات والأعشاب');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1500)); console.log('أخطاء:', JSON.stringify(errs).slice(0, 600)); process.exit(1); });
