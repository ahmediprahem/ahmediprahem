// خطة الجودة (م1 + إصلاح تراجع v2): يقيس منطقية التوزيع على عملاء من فئات مختلفة بأداة التدقيق نفسها (docs/prototypes/audit_logic.js)
// العتبات = أهداف المرحلة؛ لا تُرخى إلا بقرار مكتوب في docs/logic_audit_plan_AR.md
const assert = require('assert'), path = require('path'), os = require('os'), fs = require('fs'), { execFileSync } = require('child_process');
const out = path.join(os.tmpdir(), 'zq_' + process.pid + '.json');
execFileSync(process.execPath, [path.join(__dirname, '../docs/prototypes/audit_logic.js'), '25', out], { stdio: 'ignore' });
const A = JSON.parse(fs.readFileSync(out, 'utf8')); fs.unlinkSync(out); const seg = (n) => A.res.find((r) => r.seg === n).pct;
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
const v1 = seg('الحالي: v1 بلا بنك'), v2 = seg('v2 بلا بنك (الاستبيان)');
const show = (k) => k + ' ' + v1[k] + '% → ' + v2[k] + '%';
assert(v2.mealMany <= 8, show('mealMany')); ok('وجبات مزدحمة ≤ 8٪ (' + show('mealMany') + ')');
assert(v2.prot3 <= 2, show('prot3')); ok('3 مصادر بروتين في وجبة ≤ 2٪ (' + show('prot3') + ')');
assert(v2.lunchShare <= 10, show('lunchShare')); ok('الغداء أقل من 30٪ من بروتين اليوم ≤ 10٪ (' + show('lunchShare') + ')');
assert(v2.lunchSmall <= 25, show('lunchSmall')); ok('بروتين الغداء الرئيسي < 90 جم ≤ 25٪، والباقي أيام بروتين لحوم منخفض (' + show('lunchSmall') + ')');
assert(v2.dinnerNoStarch <= 3, show('dinnerNoStarch')); ok('فطور/عشاء بلا نشويات ≤ 3٪ (' + show('dinnerNoStarch') + ')');
assert(v2.dupDay <= 3, show('dupDay')); ok('الصنف نفسه مرتين في اليوم ≤ 3٪ (إصلاح تراجع v2) (' + show('dupDay') + ')');
assert(v2.rep4 <= 30, show('rep4')); ok('م3: مصدر بروتين يتكرر 4 أيام أو أكثر في الوجبة نفسها ≤ 30٪ من العملاء (كان 20٪ قبل حدّ البيضتين: بياض البيض يتكرر في الفطور) (' + show('rep4') + ')');
const milk = seg('v2 + حساسية حليب'); assert(milk.dupDay <= 5, 'milk dupDay ' + milk.dupDay); ok('م3: بدائل الحليب لا تكرر الصنف في اليوم (حساسية الحليب ' + milk.dupDay + '٪)');
assert(v2.garnishOnly <= 1, show('garnishOnly')); ok('م2: خضار الوجبة ليست «تزييناً» فقط (بصل/بقدونس/فجل) ≤ 1٪ (' + show('garnishOnly') + ')');
assert(v2.bigCount <= 0.5, show('bigCount')); ok('م2: العدّ فوق 12 حبة له مقياس يدوي (قبضة/نحو كوب) ≤ 0.5٪ بلا مقياس (' + show('bigCount') + ')');
assert(v2.rawVegBig <= 1, show('rawVegBig')); ok('م2: الخضار النيئة حتى كوب ونصف (الورقية كوبان) (' + show('rawVegBig') + ')');
assert(v2.kcalOff <= 5, show('kcalOff')); ok('م4: أيام سعراتها تبعد أكثر من 7٪ عن الهدف ≤ 5٪ (' + show('kcalOff') + ')');
const lo = seg('v2 + سعرات منخفضة (امرأة قصيرة خاملة)').kcalOff, hi = seg('v2 + سعرات عالية (رجل نشيط زيادة)').kcalOff; assert(lo <= 10 && hi <= 10, lo + ' / ' + hi); ok('م4: وفي أطراف السعرات ≤ 10٪ (منخفضة ' + lo + '٪، عالية ' + hi + '٪)');
// م5 (قرارات المالك)
A.res.filter((r) => /^v2/.test(r.seg)).forEach((r) => assert.strictEqual(r.pct.eggs3, 0, r.seg)); ok('م5: لا يوم فيه أكثر من بيضتين كاملتين في كل فئات v2');
A.res.filter((r) => /^v2/.test(r.seg)).forEach((r) => assert(r.pct.sweetDay <= 43, r.seg + ' ' + r.pct.sweetDay)); ok('م5: الحلويات 3 أيام أسبوعياً على الأكثر (' + v2.sweetDay + '٪ من الأيام)');
assert.strictEqual(seg('v2 + سكري').sweetDay, 0); assert.strictEqual(seg('v2 + نقرس ودهون كبد').sweetDay, 0); ok('م5: لا حلويات عند السكري ودهون الكبد');
assert(seg('v2 + حساسية سمك').consec <= 2); ok('م5: يوم بقول عند حساسية السمك يمنع الغداء المتتالي تقريباً (كان 28٪) (' + seg('v2 + حساسية سمك').consec + '٪)');
{ const E = require('../src/engine.js'), D = require('../src/data.json');
  let bad = 0, n2 = 0; for (let i = 0; i < 20; i++) { const c = { name: 'ض', sex: i % 2 ? 'ذكر' : 'أنثى', age: 35 + i, weight: 70 + i * 2, height: 160 + i, activity: D.settings.activity[1][0], goal: D.settings.goals[0][0], meals: 3 + (i % 4), macroMode: 'auto_pf', cuisine: i % 2 ? 'sa' : 'eg', conditions: ['ضغط الدم المرتفع', 'ارتفاع الكوليسترول والدهون'], allergens: [], keywords: [], love: [], avoid: [], noBank: i % 3 ? { B: true, L: true, D: true, S: true } : {}, v2: true }, p = E.planWeek(c, D), cx = E.ctx(c, D), fam = (n) => /^زيتون/.test(n) ? 'زيتون' : /جبنة (بيضاء|دمياطي)/.test(n) ? 'جبن أبيض' : n.replace(/\s*\(?معلبة?\)?|\s*مطبوخة?$/g, '').trim(), days = {};
    p.days.forEach((d, di) => { const today = {}; d.slots.forEach((s) => s.lines.forEach((l) => { if (cx.tierOf(l.name) !== 2 || l.manual) return; n2++; const k = fam(l.name); if (today[k]) bad++; today[k] = 1; (days[k] = days[k] || {})[di] = 1; })); });
    Object.keys(days).forEach((k) => { if (Object.keys(days[k]).length > 3) bad++; }); }
  assert.strictEqual(bad, 0, 'مخالفات «قلّل»: ' + bad); ok('م5: صنف «قلّل» مرة يومياً و3 أيام أسبوعياً على الأكثر (فحص ' + n2 + ' سطراً، ضغط + كوليسترول، مع البنك وبدونه)'); }
{ const E = require('../src/engine.js'), D = require('../src/data.json'); let a = 0, b = 0;
  for (let i = 0; i < 12; i++) { const c = { name: 'ت', sex: i % 2 ? 'ذكر' : 'أنثى', age: 30 + i * 2, weight: 65 + i * 3, height: 158 + i, activity: D.settings.activity[1][0], goal: D.settings.goals[i % 3][0], meals: 3 + (i % 4), macroMode: 'auto_pf', cuisine: i % 2 ? 'sa' : 'eg', conditions: [], allergens: [], keywords: [], love: [], avoid: [], noBank: { B: true, L: true, D: true, S: true } };
    a += E.planReport(E.planWeek(Object.assign({}, c, { v2: true }), D), D).score; b += E.planReport(E.planWeek(c, D), D).score; }
  assert(a > b, a + ' / ' + b); ok('م8: تقرير جودة الخطة يميّز المحرك الجديد (متوسط ' + Math.round(a / 12) + ' مقابل ' + Math.round(b / 12) + ' للمحرك الحالي)'); }
A.res.forEach((r) => assert.strictEqual(r.err, 0, r.seg)); assert(A.res.every((r) => r.pct.missing === 0)); ok('لا أخطاء ولا أسطر بلا صنف في ' + A.res.length + ' فئة');
console.log('\nنجح ' + n + ' اختبارات');
