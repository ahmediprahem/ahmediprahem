// ================= التحديات الأسبوعية وشهادات التقدير (يُدمج داخل app.js عند /*CHALUI*/)
// قوالب جاهزة لأول 4 أسابيع (الإعدادات ← «🏆 التحديات») يعدّلها الأخصائي، ثم من ملف العميل ← «حصتي»: برنامج 4 أسابيع أو تحدٍّ مخصّص
// يُعدَّل قبل الإرسال. كل هدف = عادة + قيمة يومية + عدد أيام في الأسبوع. «حصتي» تحسب التقدّم من سجل العميل، وتولّد شهادة تقدير
// باسم العميل وشعار الأخصائي واسمه عند إتمام كل أسبوع، وتُبلغ الأخصائي بالإنجاز.
var CH = { ed: null, tplEd: null };
var CH_G = {   // العادة: [الاسم، الوحدة، القيمة الافتراضية، هل لها قيمة، وصف المعيار]
  water: ['شرب الماء', 'كوب', 8, 1, 'أكواب يومياً على الأقل'], plan: ['الالتزام بالخطة', '%', 70, 1, '% من أصناف اليوم على الأقل'], steps: ['المشي', 'خطوة', 6000, 1, 'خطوة يومياً على الأقل'],
  sleep: ['النوم الكافي', 'ساعة', 7, 1, 'ساعات نوم على الأقل'], veg: ['خضار وفاكهة', 'حصة', 5, 1, 'حصص يومياً'], sugar: ['يوم بلا سكر مضاف', '', 1, 0, 'يوم كامل بلا سكر'],
  move: ['النشاط البدني', 'دقيقة', 30, 1, 'دقيقة حركة'], breath: ['تنفّس وهدوء', 'جلسة', 1, 1, 'جلسة تنفّس'], mindful: ['أكل بوعي', 'وجبة', 2, 1, 'وجبات بلا شاشة'],
  kitchen: ['المطبخ مغلق ليلاً', '', 1, 0, 'لا أكل بعد العشاء'], coffee: ['كافيين باعتدال', 'كوب', 3, 1, 'أكواب كحد أقصى'], adhkar: ['أذكار الصباح', '', 1, 0, 'إتمام أذكار الصباح'],
  adhkarPm: ['أذكار المساء', '', 1, 0, 'إتمام أذكار المساء'], social: ['استراحة من السوشيال ميديا', '', 1, 0, 'يوم بلا تصفّح'], sunset: ['شاشات مطفأة قبل النوم', '', 1, 0, 'ساعة قبل النوم بلا شاشة'],
  gratitude: ['امتنان', 'نعمة', 3, 1, 'نعم يذكرها يومياً'], sunlight: ['شمس الصباح', 'دقيقة', 15, 1, 'دقيقة ضوء نهار'], breaks: ['حركة كل ساعة', 'مرة', 5, 1, 'فواصل حركة يومية'],
  reading: ['قراءة أو وِرد', 'دقيقة', 10, 1, 'دقيقة قراءة'], meds: ['الدواء في موعده', '', 1, 0, 'أخذ الدواء في موعده'], stretch: ['تمدّد وإطالة', 'دقيقة', 5, 1, 'دقيقة تمدّد'], postwalk: ['مشي بعد الوجبة', 'مرة', 1, 1, 'مرات مشي بعد الوجبات']
};
var CH_ADH_PM = 259;                                            // مجموع تكرارات أذكار المساء في «حصتي» (يفحص tests/test_habits_sync.js تطابقه)
// مكتبة 10 تحديات جاهزة (أسبوع إلى 4 أسابيع) يختار منها الأخصائي ثم يعدّل قبل الإرسال
var CH_LIB = [
  { id: 'social7', n: '7 أيام بلا سوشيال ميديا', d: 'أسبوع استراحة رقمية: وقت وتركيز أكثر وسهر أقل.', weeks: [{ title: 'أسبوع الاستراحة الرقمية', msg: 'سبعة أيام نبتعد فيها عن التصفّح العشوائي ونملأ الوقت بما ينفعنا.', goals: [{ h: 'social', v: 1, d: 6 }, { h: 'sunset', v: 1, d: 5 }, { h: 'water', v: 8, d: 5 }] }] },
  { id: 'adhkar7', n: '7 أيام أذكار الصباح والمساء', d: 'أسبوع مداومة على أذكار اليوم: تبدأه بذكر وتختمه بذكر.', weeks: [{ title: 'أسبوع الأذكار', msg: 'أذكار الصباح والمساء سبعة أيام متتالية — طمأنينة تبدأ بها يومك وتختمه.', goals: [{ h: 'adhkar', v: 1, d: 7 }, { h: 'adhkarPm', v: 1, d: 7 }] }] },
  { id: 'sleep7', n: 'أسبوع النوم الهانئ', d: 'شاشات مطفأة، مطبخ مغلق، ونوم 7 ساعات.', weeks: [{ title: 'نوم هانئ', msg: 'النوم الجيد يضبط الجوع والمزاج. هذا الأسبوع نهيّئ مساءً هادئاً.', goals: [{ h: 'sunset', v: 1, d: 6 }, { h: 'sleep', v: 7, d: 6 }, { h: 'kitchen', v: 1, d: 5 }, { h: 'coffee', v: 3, d: 5 }] }] },
  { id: 'sun7', n: 'أسبوع ضوء الصباح والحركة', d: 'شمس 15 دقيقة مع مشي وحركة كل ساعة.', weeks: [{ title: 'صباح مشرق', msg: 'ضوء الصباح والحركة الخفيفة يوقظان طاقتك ويضبطان ساعتك الداخلية.', goals: [{ h: 'sunlight', v: 15, d: 6 }, { h: 'steps', v: 6000, d: 6 }, { h: 'breaks', v: 5, d: 5 }] }] },
  { id: 'calm7', n: 'أسبوع الامتنان والهدوء', d: 'ثلاث نعم يومياً مع تنفّس وأكل بوعي.', weeks: [{ title: 'امتنان وهدوء', msg: 'ثلاث نعم كل يوم، ودقائق تنفّس، ولقمة بوعي. هدوء يُرى أثره على الأكل.', goals: [{ h: 'gratitude', v: 3, d: 7 }, { h: 'breath', v: 1, d: 6 }, { h: 'mindful', v: 2, d: 5 }] }] },
  { id: 'nosugar30', n: '30 يوماً نحو أقل سكر مضاف', d: '4 أسابيع تتدرّج من 4 إلى 7 أيام بلا سكر مضاف.', weeks: [
    { title: 'نبدأ بهدوء', msg: 'أربعة أيام بلا سكر مضاف. لا حرمان: نبدّل ولا نمنع.', goals: [{ h: 'sugar', v: 1, d: 4 }, { h: 'water', v: 8, d: 5 }] },
    { title: 'نقترب', msg: 'خمسة أيام بلا سكر، مع خضار أكثر يُشبعك.', goals: [{ h: 'sugar', v: 1, d: 5 }, { h: 'water', v: 8, d: 5 }, { h: 'veg', v: 4, d: 5 }] },
    { title: 'نثبت', msg: 'ستة أيام، وذائقتك بدأت تتغير.', goals: [{ h: 'sugar', v: 1, d: 6 }, { h: 'veg', v: 5, d: 5 }, { h: 'sleep', v: 7, d: 5 }] },
    { title: 'عادة جديدة', msg: 'أسبوع كامل بلا سكر مضاف — أنت أقوى من الرغبة.', goals: [{ h: 'sugar', v: 1, d: 7 }, { h: 'veg', v: 5, d: 6 }, { h: 'plan', v: 80, d: 5 }] }] },
  { id: 'walk14', n: 'تحدي المشي بعد الوجبات (أسبوعان)', d: 'مشي هادئ بعد الوجبات ثم زيادة الخطوات. (لمرضى السكري: استشر أخصائيك.)', weeks: [
    { title: 'خطوات بعد الأكل', msg: 'عشر دقائق مشي هادئ بعد وجبة واحدة على الأقل.', goals: [{ h: 'postwalk', v: 1, d: 5 }, { h: 'steps', v: 5000, d: 5 }] },
    { title: 'نزيد', msg: 'مرتان بعد الوجبات، وخطواتك ترتفع.', goals: [{ h: 'postwalk', v: 2, d: 5 }, { h: 'steps', v: 7000, d: 5 }, { h: 'water', v: 8, d: 5 }] }] },
  { id: 'read14', n: 'تحدي القراءة أو الورد (أسبوعان)', d: '10 دقائق يومياً بدل التصفّح، مع شاشات مطفأة قبل النوم.', weeks: [
    { title: 'عشر دقائق', msg: 'عشر دقائق قراءة أو وِرد قبل النوم بدل التصفّح.', goals: [{ h: 'reading', v: 10, d: 5 }, { h: 'sunset', v: 1, d: 4 }] },
    { title: 'نثبّت العادة', msg: 'كل يوم تقريباً — وستلاحظ أثرها على نومك.', goals: [{ h: 'reading', v: 10, d: 7 }, { h: 'sunset', v: 1, d: 6 }, { h: 'sleep', v: 7, d: 5 }] }] },
  { id: 'meds14', n: 'الالتزام بالدواء والمكمّلات (أسبوعان)', d: 'لمن يتناول دواءً أو مكمّلاً: موعد ثابت وتذكير يومي.', weeks: [
    { title: 'موعد ثابت', msg: 'نثبّت موعد الدواء ونفعّل التذكير من «تقدّمي».', goals: [{ h: 'meds', v: 1, d: 6 }, { h: 'water', v: 8, d: 5 }] },
    { title: 'التزام كامل', msg: 'كل يوم في موعده — بإذن الله أنت في أمان.', goals: [{ h: 'meds', v: 1, d: 7 }, { h: 'plan', v: 70, d: 5 }] }] },
  { id: 'move7', n: 'أسبوع تمدّد وحركة', d: 'تمدّد 5 دقائق مع حركة كل ساعة لمن يجلس كثيراً.', weeks: [{ title: 'جسم مرن', msg: 'تمدّد قصير وحركة كل ساعة تخفّف الشدّ وتنعش جسمك.', goals: [{ h: 'stretch', v: 5, d: 6 }, { h: 'breaks', v: 5, d: 6 }, { h: 'water', v: 8, d: 5 }] }] }
];
function chLibList() {
  return '<div class="chlib"><p class="small">اختر تحدياً جاهزاً — تعدّله قبل الإرسال كأي تحدٍّ.</p>' + CH_LIB.map(function (t) { return '<div class="chlib-i"><div><b>' + esc(t.n) + '</b><span class="small">' + esc(t.d) + ' • ' + t.weeks.length + (t.weeks.length === 1 ? ' أسبوع' : ' أسابيع') + '</span></div><button class="sm" data-a="chNew" data-v="lib:' + t.id + '">اختر</button></div>'; }).join('') + '</div>';
}
var CH_DEF = [
  { title: 'البداية: الماء والوعي', msg: 'أسبوعك الأول: نبني الأساس بهدوء — الماء، والالتزام بالخطة، والأكل بانتباه.', goals: [{ h: 'water', v: 6, d: 5 }, { h: 'plan', v: 60, d: 4 }, { h: 'mindful', v: 1, d: 4 }] },
  { title: 'تحرّك أكثر', msg: 'جسمك اعتاد الماء، والآن نضيف الحركة ونقلّل السكر تدريجياً.', goals: [{ h: 'water', v: 8, d: 5 }, { h: 'steps', v: 5000, d: 5 }, { h: 'plan', v: 70, d: 5 }, { h: 'sugar', v: 1, d: 3 }] },
  { title: 'نوم وطاقة', msg: 'النوم الجيد يضبط الجوع والطاقة، والخضار تُشبعك أكثر بسعرات أقل.', goals: [{ h: 'water', v: 8, d: 6 }, { h: 'steps', v: 7000, d: 5 }, { h: 'sleep', v: 7, d: 5 }, { h: 'veg', v: 4, d: 5 }, { h: 'kitchen', v: 1, d: 4 }] },
  { title: 'أسلوب حياة', msg: 'الأسبوع الذي تصبح فيه العادات جزءاً منك. أنت أقرب لهدفك من أي وقت مضى!', goals: [{ h: 'water', v: 8, d: 6 }, { h: 'steps', v: 8000, d: 5 }, { h: 'veg', v: 5, d: 5 }, { h: 'sugar', v: 1, d: 5 }, { h: 'move', v: 30, d: 4 }, { h: 'plan', v: 80, d: 5 }] }
];
function chClone(o) { return JSON.parse(JSON.stringify(o)); }
function chTpls() { var t = S.settings.chal && S.settings.chal.weeks; return chClone(t && t.length === 4 ? t : CH_DEF); }
function chDay(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function chAdd(k, n) { var d = new Date(k + 'T12:00'); d.setDate(d.getDate() + n); return chDay(d.getTime()); }
function chGoalTxt(g) { var m = CH_G[g.h]; if (!m) return ''; return m[0] + (m[3] ? ' ' + (g.h === 'coffee' ? '≤ ' : '') + Number(g.v).toLocaleString('en') + ' ' + m[1] : '') + ' • ' + g.d + ' أيام'; }
// نفس معيار «حصتي»: قيمة اليوم من سجل المتابعة
function chOk(g, l) { if (!l) return false; var h = l.h || {}, v = g.h === 'water' ? l.water : g.h === 'plan' ? (l.n ? l.done / l.n * 100 : null) : h[g.h]; if (v == null) return false;
  switch (g.h) { case 'sugar': case 'kitchen': case 'social': case 'sunset': case 'meds': return v === 1; case 'mindful': return (v || []).length >= g.v; case 'coffee': return v <= g.v; case 'adhkar': return ((v && v.c) || []).reduce(function (a, x) { return a + (+x || 0); }, 0) >= 254; case 'adhkarPm': return ((v && v.c) || []).reduce(function (a, x) { return a + (+x || 0); }, 0) >= CH_ADH_PM; default: return +v >= +g.v; } }
function chWeekProg(c, w, wi) { var logs = (c.hx && c.hx.logs) || {}, s = chAdd(c.hx.chal.start, wi * 7); return w.goals.map(function (g) { var n = 0; for (var i = 0; i < 7; i++) if (chOk(g, logs[chAdd(s, i)])) n++; return n; }); }
// ---------- محرر الأسبوع (للقوالب ولتحدي العميل)
function chWeekEd(w, p, wi) {
  var opts = function (sel) { return Object.keys(CH_G).map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + CH_G[k][0] + '</option>'; }).join(''); };
  return '<div class="chwk"><div class="bkfl"><label>عنوان الأسبوع ' + (wi + 1) + '<input data-chf="' + p + '|title" value="' + esc(w.title) + '" maxlength="60"></label></div><label class="small">رسالة الأسبوع للعميل<input data-chf="' + p + '|msg" value="' + esc(w.msg || '') + '" maxlength="200"></label>'
    + '<table class="chg"><tr><th>العادة</th><th>الهدف اليومي</th><th>عدد الأيام من 7</th><th></th></tr>' + w.goals.map(function (g, gi) { var m = CH_G[g.h] || CH_G.water;
      return '<tr><td><select data-chf="' + p + '|h|' + gi + '">' + opts(g.h) + '</select></td><td>' + (m[3] ? '<input data-chf="' + p + '|v|' + gi + '" inputmode="numeric" value="' + esc(g.v) + '"> <small>' + m[1] + '</small>' : '<small>' + m[4] + '</small>') + '</td><td><input data-chf="' + p + '|d|' + gi + '" type="number" min="1" max="7" value="' + esc(g.d) + '"></td><td><button class="sec sm" data-a="chGoalDel" data-v="' + p + '|' + gi + '" aria-label="حذف الهدف">✕</button></td></tr>'; }).join('')
    + '</table><p><button class="sec sm" data-a="chGoalAdd" data-v="' + p + '">＋ هدف</button></p></div>';
}
function chRef(p) { var a = p.split('.'); return a[0] === 'tpl' ? CH.tplEd[+a[1]] : CH.ed.weeks[+a[1]]; }
function chTplPage() {
  CH.tplEd = CH.tplEd || chTpls();
  return '<div class="ucard"><h3>🏆 قوالب تحديات أول 4 أسابيع</h3><p class="small">جاهزة ومتدرّجة؛ عدّلها كما تحب، وتُستعمل عند «ابدأ برنامج 4 أسابيع» من ملف أي عميل مرتبط بـ«حصتي» (ويمكن تعديلها لكل عميل قبل الإرسال). كل هدف: عادة + قيمة يومية + عدد الأيام المطلوبة في الأسبوع.</p>'
    + CH.tplEd.map(function (w, i) { return chWeekEd(w, 'tpl.' + i, i); }).join('') + '<p class="two"><button data-a="chTplSave">💾 حفظ القوالب</button><button class="sec" data-a="chTplReset">↺ القوالب الافتراضية</button></p></div>';
}
function chCard(c) {
  var x = c.hx, ch = x.chal, ach = x.ach || [];
  if (CH.ed && CH.ed.code === c.code) return '<div class="ucard chcard"><h3>🏆 ' + (CH.ed.weeks.length > 1 ? 'برنامج تحديات 4 أسابيع' : 'تحدٍّ مخصّص') + ' لـ' + esc(c.name) + '</h3><p class="small">عدّل ما تريد قبل الإرسال. تُضاف العادات المطلوبة إلى صفحة العميل تلقائياً، وتولَّد له شهادة تقدير باسمه وشعارك عند إتمام كل أسبوع.</p>'
    + '<label class="small">يبدأ في <input type="date" data-chf="start" value="' + esc(CH.ed.start) + '"></label>' + CH.ed.weeks.map(function (w, i) { return chWeekEd(w, 'ed.' + i, i); }).join('')
    + '<p class="two"><button data-a="chSend">➤ أرسل إلى «حصتي»</button><button class="sec" data-a="chCancelEd">إلغاء</button></p></div>';
  var head = '<div class="ucard chcard"><div class="hxtop"><h3>🏆 التحديات' + (ach.length ? ' <small>🏅 ' + ach.length + ' شهادة</small>' : '') + '</h3><p class="two"><button class="sm" data-a="chNew" data-v="prog">ابدأ برنامج 4 أسابيع</button><button class="sec sm" data-a="chNew" data-v="one">تحدٍّ مخصّص</button><button class="sec sm" data-a="chLib">📚 مكتبة التحديات (10)</button></p></div>' + (CH.lib ? chLibList() : '');
  if (!ch) return head + '<p class="small">قوالب جاهزة متدرّجة (الماء ← الحركة ← النوم ← أسلوب الحياة) تعدّلها قبل الإرسال. يتابعها العميل في «اليوم» ويحصل على شهادة تقدير عند إتمام كل أسبوع.</p></div>';
  var today = chDay(), cur = Math.floor((new Date(today + 'T12:00') - new Date(ch.start + 'T12:00')) / 864e5 / 7);
  return head + '<p class="small">بدأ ' + esc(ch.start) + (cur >= 0 && cur < ch.weeks.length ? ' • الأسبوع الحالي: ' + (cur + 1) : cur < 0 ? ' • لم يبدأ بعد' : ' • انتهى البرنامج') + ' <button class="sec sm" data-a="chStop">إيقاف</button></p>' + ch.weeks.map(function (w, i) {
    var pr = chWeekProg(c, w, i), done = ach.some(function (a) { return a.w === i + 1 && a.id === ch.id; });
    return '<div class="chrow' + (done ? ' done' : i === cur ? ' cur' : '') + '"><b>' + (done ? '🏅' : i === cur ? '▶' : i < cur ? '✕' : '○') + ' الأسبوع ' + (i + 1) + ': ' + esc(w.title) + '</b><span>' + w.goals.map(function (g, gi) { return '<em class="' + (pr[gi] >= g.d ? 'ok' : '') + '">' + esc(chGoalTxt(g).split(' • ')[0]) + ' ' + pr[gi] + '/' + g.d + '</em>'; }).join('') + '</span></div>';
  }).join('') + '</div>';
}
function chLogo() {                                                 // شعار الأخصائي مصغّراً للشهادة (يصل مشفّراً مع التحدي)
  return new Promise(function (res) { var im = new Image(); im.onload = function () { var k = Math.min(1, 360 / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); try { res(cv.toDataURL('image/png')); } catch (e) { res(''); } }; im.onerror = function () { res(''); }; im.src = logoSrc(); });
}
Object.assign(A, {
  chLib: function () { CH.lib = !CH.lib; main(); },
  chNew: function (v) { var c = cur(), lib = /^lib:/.test(v) ? CH_LIB.filter(function (t) { return t.id === v.slice(4); })[0] : null; CH.lib = false; CH.ed = { code: c.code, start: chDay(), weeks: lib ? chClone(lib.weeks) : v === 'prog' ? chTpls() : [{ title: 'تحدّي الأسبوع', msg: 'تحدٍّ خاص بك من أخصائيك', goals: [{ h: 'water', v: 8, d: 5 }] }] }; main(); },
  chCancelEd: function () { CH.ed = null; main(); },
  chGoalAdd: function (p) { chRef(p).goals.push({ h: 'water', v: 8, d: 5 }); main(); },
  chGoalDel: function (v) { var a = v.split('|'), w = chRef(a[0]); w.goals.splice(+a[1], 1); main(); },
  chTplSave: function () { S.settings.chal = { weeks: chClone(CH.tplEd) }; saveSettings(); toast('✓ حُفظت قوالب التحديات'); },
  chTplReset: function () { if (!confirm('العودة إلى القوالب الافتراضية؟')) return; delete S.settings.chal; CH.tplEd = null; saveSettings(); main(); },
  chStop: function () { var c = cur(); if (!confirm('إيقاف برنامج التحديات لهذا العميل؟ تبقى شهاداته.')) return; hxSend(c, { t: 'chalx' }).then(function () { delete c.hx.chal; persist(c); main(); }).catch(hxErr); },
  chSend: function () {
    var c = cur(), e = CH.ed; if (!e.weeks.length || e.weeks.some(function (w) { return !w.goals.length || !String(w.title).trim(); })) return toast('لكل أسبوع عنوان وهدف واحد على الأقل');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.start)) return toast('اختر تاريخ البداية');
    toast('جارٍ الإرسال…');
    chLogo().then(function (logo) {
      var b = BR(), prog = { id: 'ch' + Date.now().toString(36), start: e.start, weeks: e.weeks.map(function (w) { return { title: String(w.title).trim().slice(0, 60), msg: String(w.msg || '').slice(0, 200), goals: w.goals.filter(function (g) { return CH_G[g.h]; }).map(function (g) { return { h: g.h, v: CH_G[g.h][3] ? Math.max(0, +String(g.v).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; }) || 0) : 1, d: Math.max(1, Math.min(7, +g.d || 5)) }; }) }; }), dname: b.specialist || HX.st.name || '', clinic: b.clinic || '', logo: logo };
      return hxSend(c, { t: 'chal', prog: prog }).then(function () { var p2 = chClone(prog); delete p2.logo; c.hx.chal = p2; CH.ed = null; persist(c); main(); toast('🏆 وصل التحدي إلى «حصتي» مع إشعار'); });
    }).catch(hxErr);
  }
});
document.addEventListener('input', function (e) {
  var t = e.target, f = t.dataset && t.dataset.chf; if (!f) return; if (f === 'start') { CH.ed.start = t.value; return; }
  var a = f.split('|'), w = chRef(a[0]); if (!w) return; if (a.length === 2) w[a[1]] = t.value; else w.goals[+a[2]][a[1]] = a[1] === 'h' ? t.value : t.value;
});
document.addEventListener('change', function (e) { var t = e.target, f = t.dataset && t.dataset.chf; if (f && /\|h\|/.test(f)) { var a = f.split('|'), g = chRef(a[0]).goals[+a[2]]; g.h = t.value; g.v = CH_G[t.value][2]; main(); } });
(function (f) { hxIn = function (c, p) { if (p.t === 'ach' && +p.w > 0) { var x = c.hx; x.ach = (x.ach || []).filter(function (a) { return !(a.id === p.id && a.w === +p.w); }).concat([{ id: String(p.id || ''), w: +p.w, title: String(p.title || '').slice(0, 80), at: p.ts || Date.now() }]); toast('🏅 ' + (c.name || '') + ' أتمّ ' + (+p.w === 99 ? 'برنامج التحديات كاملاً' : 'تحدي الأسبوع ' + p.w) + ' وحصل على شهادة تقدير'); return 1; } return f.apply(this, arguments); }; })(hxIn);
(function (f) { hxTab = function (c) { var h = f.apply(this, arguments); return h.replace('<div class="hxgrid">', chCard(c) + '<div class="hxgrid">'); }; })(hxTab);
