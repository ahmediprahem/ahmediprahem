// قاعدة الأمراض (مسودة، خلف v2): اتحاد الاستبعادات، التجنّب يغلب، الكلى تعطّل دعم البوتاسيوم، بلا v2 لا شيء يتغير، حدّ البيض اليومي
const assert = require('assert'), fs = require('fs'), path = require('path');
const E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
const base = (o) => Object.assign({ name: 'ت', sex: 'أنثى', age: 45, weight: 82, height: 163, activity: D.settings.activity[1][0], goal: D.settings.goals[0][0], meals: 5, macroMode: 'auto_pf', conditions: [], allergens: [], keywords: [], love: [], avoid: [] }, o);
const tier = (c, name) => E.ctx(c, D).tierOf(name);
const HT = 'ضغط الدم المرتفع', CH = 'ارتفاع الكوليسترول والدهون', HD = 'أمراض القلب', KD = 'أمراض الكلى';
assert.strictEqual(tier(base({ conditions: [HT] }), 'نقانق (لحم) عالي الدهون'), 0); ok('بلا v2 قواعد الأمراض الجديدة لا تعمل');
assert.strictEqual(tier(base({ conditions: [HT], v2: true }), 'سجق (5 غم دهون / أونصة)'), 3); ok('ضغط + v2: السجق تجنّب');
assert.strictEqual(tier(base({ conditions: [CH], v2: true }), 'زبدة'), 2); ok('كوليسترول: الزبدة قلّل');
assert.strictEqual(tier(base({ conditions: [HT], v2: true }), 'جبنة بيضاء نعاج'), 2); ok('ضغط: الجبنة المالحة قلّل');
const u = base({ conditions: [HT, CH], v2: true }); assert.strictEqual(tier(u, 'سجق (5 غم دهون / أونصة)'), 3); assert.strictEqual(tier(u, 'زبدة'), 2); assert.strictEqual(tier(u, 'سمك السلمون مدخن'), 3); ok('اتحاد الأمراض: التجنّب يغلب (السلمون المدخن مفيد للدهون لكنه مالح)');
assert.strictEqual(tier(base({ conditions: [HD], v2: true }), 'سمك السلمون مدخن'), 3); ok('قلب = ضغط + كوليسترول');
const rs = (c) => E.ctx(c, D).rules.filter((r) => r.kw === 'سبانخ' && r.cond === HT).length;
assert.strictEqual(rs(base({ conditions: [HT], v2: true })), 1); assert.strictEqual(rs(base({ conditions: [HT, KD], v2: true })), 0); ok('أمراض الكلى تعطّل دعم البوتاسيوم');
assert.strictEqual(tier(base({ conditions: [CH], v2: true }), 'جوز هند محلى'), 2); assert.strictEqual(tier(base({ conditions: [CH], v2: true }), 'جوز'), 1); ok('المطابقة الدقيقة: «جوز» لا يلتقط «جوز هند»');
assert.strictEqual(tier(base({ conditions: [CH], v2: true }), 'زيت زيتون'), 1); ok('زيت الزيتون لا يُصنَّف كزيتون مالح');
// عملاء عشوائيون: لا صنف «تجنّب» يظهر، ولا تعارض صلب
let bad = 0, t0 = Date.now(); const CS = [[HT], [CH], [HD], [HT, CH], [HT, CH, 'سكري النوع الثاني'], [HD, KD]];
for (let i = 0; i < 30; i++) { const c = base({ v2: true, conditions: CS[i % CS.length], age: 25 + i, weight: 60 + i * 1.5, goal: D.settings.goals[i % D.settings.goals.length][0], meals: 3 + (i % 3) }), p = E.planWeek(c, D), cx = E.ctx(c, D);
  p.days.forEach((d) => d.slots.forEach((s) => s.lines.forEach((l) => { if (cx.tierOf(l.name) === 3) bad++; })));
  assert.strictEqual(p.fit.hard, 0); }
assert.strictEqual(bad, 0); ok('30 عميلاً بأمراض متعددة: لا أسطر «تجنّب» ولا تعارض صلب (' + (Date.now() - t0) + 'ms)');
const p2 = E.planWeek(base({ v2: true, conditions: [CH], meals: 4 }), D); assert(Array.isArray(p2.fit.dayLimit)); ok('نتيجة الحدّ اليومي موجودة في plan.fit.dayLimit (' + p2.fit.dayLimit.length + ')');

// الدفعة الثانية: النقرس ودهون الكبد، والكبد والقلوب تجنّب
{ const GT = 'النقرس', LV = 'دهون الكبد (MASLD)';
  assert.strictEqual(tier(base({ conditions: [GT] }), 'سمك الرنجة (الهرينج)'), 0); ok('نقرس بلا v2: لا شيء');
  assert.strictEqual(tier(base({ conditions: [GT], v2: true }), 'سمك الرنجة (الهرينج)'), 3); ok('نقرس: الرنجة تجنّب');
  assert.strictEqual(tier(base({ conditions: [LV], v2: true }), 'سمك السردين معلب'), 1); assert.strictEqual(tier(base({ conditions: [LV, GT], v2: true }), 'سمك السردين معلب'), 3); ok('السردين داعم لدهون الكبد، والتقييد يغلب عند اجتماع النقرس');
  assert.strictEqual(tier(base({ conditions: [CH], v2: true }), 'لحم كبد أو قلوب (مصدر عالٍ بالكوليسترول)'), 3); ok('الكبد والقلوب تجنّب عند الكوليسترول');
  assert(D.condNote[LV] && D.condNote[GT]); ok('تنبيهات الأخصائي للنقرس ودهون الكبد موجودة'); }
console.log('\nنجح ' + n + ' اختباراً');
// حدّ البيض اليومي يُطبَّق (v2 + كوليسترول): لا يوم فوق بيضة
{ const EGGS = ['بيضة كاملة', 'بيض مسلوق']; let viol = 0, swapped = 0, tot = 0;
  for (let i = 0; i < 12; i++) { const c = base({ v2: true, conditions: [[CH], ['سكري النوع الثاني'], [HD]][i % 3], meals: 4 + (i % 2), age: 30 + i, weight: 65 + i * 2 }), p = E.planWeek(c, D); swapped += p.fit.dayCapped || 0; tot++;
    p.days.forEach((d) => { let q = 0; d.slots.forEach((s) => s.lines.forEach((l) => { if (EGGS.includes(l.name)) q += l.e * (D.foods.find((f) => f.n === l.name).upe || 1); })); if (q > 1 + 1e-9) viol++; }); }
  assert.strictEqual(viol, 0, 'أيام فوق الحد: ' + viol); console.log('✔ بيضة كاملة يومياً كحدّ أعلى مطبّق (' + swapped + ' استبدالات في ' + tot + ' عملاء)'); }
