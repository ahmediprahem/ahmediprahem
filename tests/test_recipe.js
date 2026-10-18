'use strict';
// محرك «من الوصفة إلى الحصص»: يحسب فقط من وحدة الصنف أو الجرام، ولا يخترع صنفاً ولا حصة، ويُعلّم ما لا يستطيع.
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), R = require('../src/recipe.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', String(e.stack || e.message).split('\n').slice(0, 3).join('\n    ').slice(0, 700)); process.exitCode = 1; } };
const one = (line) => R.parse(D, line)[0], names = new Set(D.foods.map(f => f.n)), F = (nm) => D.foods.find(f => f.n === nm);
(async () => {
  await t('التقطيع: أسطر وفواصل عربية ورموز نقطية وترقيم، وتُهمل الأسطر الفارغة', () => {
    const rows = R.splitLines('- 1 كوب خيار\n• 2 شريحة خبز توست\n١) ٣ ملاعق كبيرة أرز أبيض ، 1 بيضة كاملة؛ 2 تفاحة\n\n   \n3. زيت زيتون'); assert.strictEqual(rows.length, 6, JSON.stringify(rows)); assert(rows[0].startsWith('1 كوب') && rows[2].startsWith('٣ ملاعق'));
  });
  await t('الحساب بوحدة الصنف: 3 ملاعق كبيرة أرز أبيض = حصة، وبالأرقام الهندية والكسور (نصف كوب، 1½، 1 1/2)', () => {
    let r = one('3 ملاعق كبيرة أرز أبيض'); assert.strictEqual(r.status, 'ok'); assert.strictEqual(r.food, 'أرز أبيض'); assert(Math.abs(r.e - 1) < 1e-9 && r.eR === 1); r = one('٣ ملاعق كبيرة أرز أبيض'); assert.strictEqual(r.eR, 1);
    r = one('نصف كوب عدس مطبوخ'); assert.strictEqual(r.food, 'عدس مطبوخ'); assert(Math.abs(r.e - 1) < 1e-9); assert.strictEqual(one('1½ شريحة خبز توست').eR, 1.5); assert.strictEqual(one('1 1/2 شريحة خبز توست').eR, 1.5); assert.strictEqual(one('2 شرائح خبز توست').eR, 2);
  });
  await t('الحساب بالجرام: جرام ÷ جرامات الحصة من القاعدة (55 جم أرز أبيض = 1، 100 جم عدس مطبوخ ≈ 1.11 ← 1)', () => {
    let r = one('55 جم أرز أبيض'); assert.strictEqual(r.eR, 1); assert(/55 ?|جرام/.test(r.how)); r = one('100 جرام عدس مطبوخ'); assert(Math.abs(r.e - 100 / F('عدس مطبوخ').gpe) < 1e-9); assert.strictEqual(r.eR, 1); assert.strictEqual(one('36.8421 جم تونة معلبة بالماء').eR, 1);
  });
  await t('التقريب إلى نصف حصة يُعلَن: 2 بيضة = 1.77 حصة ← 2 مع ملاحظة، ولا تقل الحصة عن 0.5', () => {
    const r = one('2 بيضة كاملة'); assert(Math.abs(r.e - 2 / 1.129) < 1e-6 && r.eR === 2); assert(r.notes.some(x => /قُرِّبت/.test(x))); assert.strictEqual(one('1 ملعقة صغيرة زيت زيتون').eR, 1); const tiny = one('2 جم زيت زيتون'); assert.strictEqual(tiny.eR, 0.5);
  });
  await t('الوحدة المثناة تُفكَّك (ملعقتين/شريحتين/بيضتين) والوحدة الغامضة تُعلَّم لا تُحسب', () => {
    assert.strictEqual(one('شريحتين خبز توست').eR, 2); assert.strictEqual(one('بيضتين').food, 'بيضة كاملة'); assert.strictEqual(one('2 بيضة كاملة').food, 'بيضة كاملة'); const r = one('ملعقتين زيت زيتون'); assert.strictEqual(r.status, 'review'); assert.strictEqual(r.eR, null); assert(/غير محددة الحجم/.test(r.reason));
  });
  await t('لا تحويل بين الوحدات من عندي: كوب أرز أبيض (وحدته ملعقة) يُعلَّم للمراجعة بلا رقم', () => {
    const r = one('1 كوب أرز أبيض'); assert.strictEqual(r.status, 'review'); assert.strictEqual(r.eR, null); assert.strictEqual(r.e, null); assert(/لا أحوّل بين الوحدات/.test(r.reason)); assert.strictEqual(R.blockers(R.parse(D, '1 كوب أرز أبيض')).length, 1);
  });
  await t('صنف غير موجود: «يحتاج إضافة» بلا صنف ولا حصة، وأقرب الأسماء المقترحة موجودة فعلاً في القاعدة', () => {
    for (const line of ['2 كوب كافيار بلوغا', '100 جم لحم الغزال الأحمر', '1 ملعقة كبيرة صوص الأنكوفي المدخن']) { const r = one(line); assert.strictEqual(r.status, 'missing', line); assert.strictEqual(r.food, null); assert.strictEqual(r.e, null); assert.strictEqual(r.eR, null); assert(/يحتاج إضافة/.test(r.reason)); r.candidates.forEach(c => assert(names.has(c), 'اقتراح خارج القاعدة: ' + c)); }
    const s = one('1 كوب زبادي يوناني فراولة'); s.candidates.forEach(c => assert(names.has(c)));
  });
  await t('الالتباس: «100 جم أرز» يطابق عدة أصناف فلا يُختار تلقائياً، واختيار المستخدم اليدوي يحسب بقيم القاعدة', () => {
    const r = one('55 جم أرز'); assert.strictEqual(r.status, 'ambiguous'); assert.strictEqual(r.food, null); assert(r.candidates.length > 1 && r.candidates.every(c => names.has(c))); R.resolve(D, r, 'أرز أبيض'); assert.strictEqual(r.status, 'review' === r.status ? r.status : 'ok'); assert.strictEqual(r.eR, 1);
  });
  await t('نيء/مطبوخ: وزن «نيء» لصنف محسوب «مطبوخ» يُعلَّم للمراجعة ولا يُعتمد صامتاً', () => {
    const f = D.foods.find(x => x.cooked === 'مطبوخ' && x.gpe > 0), r = one('50 جم ' + f.n + ' نيء'); assert.strictEqual(r.food, f.n); assert.strictEqual(r.status, 'review'); assert(/نيء/.test(r.reason) && /مطبوخ/.test(r.reason)); assert(r.eR > 0); const ok = one('50 جم ' + f.n + ' مطبوخ'); assert.strictEqual(ok.status, 'ok');
  });
  await t('التوابل والماء تُقترح للتجاهل (لا حصص)، ولا تُحتسب ما لم يضمّها المستخدم', () => {
    const rows = R.parse(D, 'ملح\n1 ملعقة صغيرة كمون\nماء\n2 شرائح خبز توست'); assert.deepStrictEqual(rows.map(r => r.status), ['skip', 'skip', 'skip', 'ok']); assert.deepStrictEqual(R.ingredients(rows).map(i => i.n), ['خبز توست']);
  });
  await t('الاستعمال الصامت ممنوع: كل صف بصنف يحمل اسماً من القاعدة؛ وبلا صنف لا حصة أبداً (400 سطر عشوائي)', () => {
    let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff, units = ['جم', 'كوب', 'ملعقة كبيرة', 'ملعقة صغيرة', 'حبة', 'شريحة', 'قطعة', 'لتر', 'غرزة'], nm = ['أرز أبيض', 'دجاج', 'خيار', 'حليب', 'صنف مجهول تماماً', 'شوفان جاف', 'تونة', 'جبنة', 'بصل مقلي بالعسل الأسود'];
    for (let i = 0; i < 400; i++) { const line = (rnd() < 0.15 ? '' : (Math.floor(rnd() * 8) + 1) + ' ') + units[Math.floor(rnd() * units.length)] + ' ' + nm[Math.floor(rnd() * nm.length)]; R.parse(D, line).forEach(r => { if (r.food) assert(names.has(r.food), 'صنف خارج القاعدة: ' + r.food + ' ← ' + line); else assert(r.e === null && r.eR === null, 'حصة بلا صنف: ' + line); if (r.eR !== null) assert(r.eR >= 0.5 && Math.abs(r.eR * 2 - Math.round(r.eR * 2)) < 1e-9, 'تقريب غير صالح'); if (r.e !== null && r.status !== 'skip') assert(r.food); }); }
  });
  await t('كل أصناف القاعدة (267) بحصة واحدة بوحدتها: الاسم الفريد يُطابَق بدقة مع الحصة الصحيحة، والمشترك الاسم (بعد توحيد ال والأقواس) يُعلَّم التباساً لا يُختار عشوائياً', () => {
    const core = (f) => f.n.replace(/\([^)]*\)/g, '').trim(), key = (f) => core(f).split(/\s+/).map(w => w.replace(/^ال/, '')).join(' '), cnt = {}; D.foods.forEach(f => { cnt[key(f)] = (cnt[key(f)] || 0) + 1; }); let hit = 0, amb = 0, bad = [], uniq = 0;
    for (const f of D.foods) { const half = /^نصف /.test(f.us), nm = core(f).replace(/،/g, ' '), line = half ? (f.upe / 2) + ' ' + f.us.replace(/^نصف /, '') + ' ' + nm : f.upe + ' ' + f.us + ' ' + nm, r = one(line);   // الفاصلة العربية تفصل المكوّنات في الوصفة، فتُكتب أسماء الأصناف التي تحوي «،» بلا فاصلة
      if (cnt[key(f)] === 1) { uniq++; if (r.food === f.n && (r.status === 'ok' || r.status === 'review') && r.eR === 1) hit++; else bad.push(f.n + ' → ' + r.status + ' eR=' + r.eR); } else { amb++; assert(['ambiguous', 'ok', 'review'].includes(r.status), f.n + ' ' + r.status); if (r.food) assert(names.has(r.food)); } }
    console.log('   أسماء فريدة:', uniq, '(مطابقة بحصة 1:', hit + ') | مشتركة الاسم:', amb); assert.deepStrictEqual(bad, [], 'غير مطابق/حصص خاطئة: ' + bad.slice(0, 8).join(' | ')); assert.strictEqual(hit, uniq);
  });
  await t('بناء الوجبة: دمج المكرر، الدور من واقع البنك، وصلاحية E.validateMeal؛ وبوجود عائق لا يُسمح بالحفظ', () => {
    let rows = R.parse(D, '2 شرائح خبز توست\n1 شريحة خبز توست\n1 كوب خيار\n1 ملعقة صغيرة زيت زيتون'); assert.strictEqual(R.blockers(rows).length, 0, JSON.stringify(R.blockers(rows).map(r => [r.raw, r.status])));
    const meal = R.toMeal(rows, { id: 'U-test', n: 'وجبة اختبار', m: [0, 0, 1, 0], note: 'من وصفة' }); assert.strictEqual(meal.ing.length, 3); assert.strictEqual(meal.ing.find(i => i.n === 'خبز توست').e, 3); assert.strictEqual(E.validateMeal(D, meal), null); assert.strictEqual(meal.ing.find(i => i.n === 'خيار').role, 'خضار'); assert.strictEqual(meal.ing.find(i => i.n === 'زيت زيتون').role, 'دهون'); assert.strictEqual(meal.ing.find(i => i.n === 'خبز توست').role, 'كربوهيدرات رئيسي');
    rows = R.parse(D, '2 شرائح خبز توست\n2 كوب كافيار بلوغا'); assert.strictEqual(R.blockers(rows).length, 1); rows[1].include = false; assert.strictEqual(R.blockers(rows).length, 0); const m2 = R.toMeal(rows, { id: 'U-x', n: 'س', m: [1, 0, 0, 0] }); assert.strictEqual(E.validateMeal(D, m2), null);
    const out = E.buildMealBank(D, JSON.parse(JSON.stringify(D.bank)), { meals: { custom: [meal] } }); assert.strictEqual(out.bank.length, D.bank.length + 1); assert.deepStrictEqual(out.issues, []);
  });
  console.log('\nنجح', n, 'اختبارات محرك الوصفة');
})();
