// 1.73 (قرار المالك): كلمات الحساسية والاستبعاد تطابق بداية الكلمة لا أي جزء منها — بلا فقد لأي استبعاد حقيقي
const assert = require('assert'), E = require('../src/engine.js'), D = require('../src/data.json');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
const cx = (al) => E.ctx({ allergens: al, conditions: [], love: [], avoid: [], excludedFoods: [] }, D), names = D.foods.map((f) => f.n);
const egg = cx(['حساسية البيض']); assert(!egg.isExcluded('أرز أبيض') && !egg.isExcluded('سمك أبيض (هامور)') && !egg.isExcluded('سكر أبيض')); assert(names.filter((x) => /بيض|بيضة/.test(x) && !/أبيض/.test(x)).every((x) => egg.isExcluded(x)));
ok('حساسية البيض: كل أصناف البيض مستبعدة، و«أرز/سمك/سكر أبيض» لا');
const veg = cx(['لا آكل اللحوم (نباتي)']); assert(!veg.isExcluded('بطاطس مسلوقة') && !veg.isExcluded('بطيخ') && !veg.isExcluded('دقيق الحمص')); assert(veg.isExcluded('بط مشوي') || !names.includes('بط مشوي')); assert(names.filter((x) => /^(لحم|دجاج|صدر دجاج)/.test(x)).every((x) => veg.isExcluded(x)));
ok('النباتي: اللحوم والدواجن مستبعدة، و«بطاطس» و«بطيخ» و«دقيق الحمص» لا');
assert(cx(['أريد تجنّب السكريات المضافة']).isExcluded('بانكيك (pancake)')); ok('«بانكيك» يبقى مستبعداً لمن يتجنب السكريات المضافة (كما كان)');
// لا فقد: كل ما كان يُستبعد ويطابق بداية كلمة يبقى مستبعداً، والفروق الوحيدة هي الإيجابيات الكاذبة المعروفة
const allowed = { 'حساسية البيض': ['أرز أبيض', 'سمك أبيض (هامور)', 'سكر أبيض'], 'لا آكل اللحوم (نباتي)': ['بطاطس مسلوقة', 'بطاطا حلوة مسلوقة', 'بطيخ', 'خبز الهامبرجر مجسم كبير', 'بطاطا مهروسة', 'كراكرز (رقائق بطاطا)', 'بطاطا مشوية بقشرها', 'بطاطا مقلية', 'بطاطا يام مطبوخة', 'دقيق الحمص'] };
D.allergens.forEach((a) => { const c = cx([a.label]), lost = names.filter((x) => a.kw.some((k) => x.indexOf(k) >= 0) && !c.isExcluded(x)); assert.deepStrictEqual(lost.filter((x) => !(allowed[a.label] || []).includes(x)), [], a.label + ': ' + lost.join('، ')); });
ok('لكل حساسية في القاعدة: لا يُفقد أي استبعاد عدا الإيجابيات الكاذبة المعروفة');
console.log('\n' + n + ' اختبارات مطابقة الكلمات ناجحة');
