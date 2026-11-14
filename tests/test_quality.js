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
assert(v2.rep4 <= 20, show('rep4')); ok('م3: مصدر بروتين يتكرر 4 أيام أو أكثر في الوجبة نفسها ≤ 20٪ من العملاء (' + show('rep4') + ')');
const milk = seg('v2 + حساسية حليب'); assert(milk.dupDay <= 5, 'milk dupDay ' + milk.dupDay); ok('م3: بدائل الحليب لا تكرر الصنف في اليوم (حساسية الحليب ' + milk.dupDay + '٪)');
assert(v2.garnishOnly <= 1, show('garnishOnly')); ok('م2: خضار الوجبة ليست «تزييناً» فقط (بصل/بقدونس/فجل) ≤ 1٪ (' + show('garnishOnly') + ')');
assert(v2.bigCount <= 0.5, show('bigCount')); ok('م2: العدّ فوق 12 حبة له مقياس يدوي (قبضة/نحو كوب) ≤ 0.5٪ بلا مقياس (' + show('bigCount') + ')');
assert(v2.rawVegBig <= 1, show('rawVegBig')); ok('م2: الخضار النيئة حتى كوب ونصف (الورقية كوبان) (' + show('rawVegBig') + ')');
A.res.forEach((r) => assert.strictEqual(r.err, 0, r.seg)); assert(A.res.every((r) => r.pct.missing === 0)); ok('لا أخطاء ولا أسطر بلا صنف في ' + A.res.length + ' فئة');
console.log('\nنجح ' + n + ' اختبارات');
