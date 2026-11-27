// ================= 1.28 مساعد الطعام بالذكاء الاصطناعي في «زنها» (طلب المالك 2026-11-27)
// زر الكاميرا في رأس «اليوم» وفي بطاقة «تسجيل اليوم» يفتح ورقة بأربعة خيارات: وصف الوجبة، صورة الوجبة، ملصق المعلومات الغذائية (مع تقييم صحي)، التخزين والسلامة.
// التحليل على الخادم فقط (/v1/ai/food → Gemini، المفتاح سرّ على المحطة)، والطلب موقّع بمفتاح العميل. النتائج تقديرية دائماً ويُقال ذلك بوضوح.
// الإضافة إلى «تسجيل اليوم» الموجود نفسه (L.off + L.offT + L.ai) فتصل الأخصائي مع المتابعة اليومية — لا نظام تسجيل ثانٍ.
// الأيقونة: صورة المالك assets/hissati/ai-cam.webp (مقصوصة دائرياً من تصميمه) تُضمَّن عند البناء مكان /*AICAMIMG*/؛ AI_ICON للأيقونات الصغيرة داخل الورقة.
const AI_ICON = '<svg class="ico aiico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5h-5L7 8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="14" r="3.5"/><path d="M19 1.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="currentColor" stroke="none"/></svg>';
const AIV = () => V.ai || (V.ai = { step: 'menu' });
const AI_MODES = [
  ['text', '✍️', 'صف وجبتك', 'اكتب ما أكلت، ونقدّر السعرات والبروتين والكربوهيدرات والدهون'],
  ['photo', '📸', 'صوّر وجبتك', 'التقط صورة طبقك ونتعرّف على الأصناف ونقدّر قيمها'],
  ['label', '🏷️', 'امسح الملصق الغذائي', 'صوّر جدول القيم الغذائية لمنتج، ونقرأه ونقيّمه صحياً'],
  ['store', '🧊', 'التخزين والسلامة', 'صوّر طعاماً، ونخبرك كيف تحفظه ومدة صلاحيته وعلامات فساده'],
  ['supp', '💊', 'قيّم مكمّلاً', 'صوّر ملصق المكمّل أو اكتب اسمه: فائدته، ودليله العلمي، وجرعته مقارنة بالحد الآمن'],
  ['herb', '🌿', 'الأعشاب', 'صوّر عشباً أو اكتب اسمه: نتعرّف عليه، وفائدته المحتملة، وكيف يُستعمل بأمان']
];
// 1.56: «قيّم مكمّلاً» اعتمده المالك 2026-11-27 (الجدول المرجعي في المحطة، والتفعيل بـ AI_SUPP=1 على الخادم)
const aiModes = () => AI_MODES;      // 1.57 الأعشاب: اعتمد المالك جدولها 2026-11-27 (التفعيل بـ AI_HERB=1 على الخادم)
const AI_OFF = [['extra', '🍽 وجبة زيادة'], ['out', '🍔 أكل من الخارج'], ['sweets', '🍰 حلويات'], ['drinks', '🥤 مشروبات محلّاة']];
function aiBtn(cls) { return '<button class="aibtn' + (cls ? ' ' + cls : '') + '" data-act="aiOpen" aria-label="مساعد الطعام بالذكاء الاصطناعي" title="مساعد الطعام"><img class="aiimg" src="' + AI_CAM_IMG + '" alt="" width="28" height="28">' + (cls ? '<span>حلّل طعامك</span>' : '') + '</button>'; }
// 1.55: أيقونة المالك (صورة دائرية من تصميمه) زرّاً بارزاً في منتصف الشريط السفلي بين «خطتي» و«تثقيف» — المدخل الرئيسي الوحيد
const AI_CAM_IMG = '/*AICAMIMG*/';
function aiTabFab(tb) { const a = tb.slice(); a.splice(2, 0, '<button class="aifab" data-act="aiOpen" aria-label="مساعد الطعام: صوّر أو صف طعامك" title="مساعد الطعام"><span class="airays" aria-hidden="true"><i></i><i></i><i></i></span><img src="' + AI_CAM_IMG + '" alt="" width="64" height="64"></button>'); return a; }
// بطاقة «تسجيل اليوم»: مدخل ثانٍ + ما أُضيف بالمساعد اليوم
dayLogCard = ((f) => function (d) {
  const h = f.apply(this, arguments), L = dl(d), a = (L.ai || []);
  const list = a.length ? '<div class="ailog"><b>' + AI_ICON + ' أُضيف بالمساعد اليوم</b>' + a.map((x, i) => '<div class="ailrow"><span>' + esc(x.t) + '</span><small>~' + Math.round(x.kcal) + ' سعرة</small><button class="aix" data-act="aiDel" data-v="' + i + '" aria-label="احذف ' + esc(x.t) + '">×</button></div>').join('')
    + '<div class="ailrow tot"><span>المجموع التقديري</span><small>~' + Math.round(a.reduce((s, x) => s + (+x.kcal || 0), 0)) + ' سعرة</small></div></div>' : '';
  return h.replace(/<\/section>\s*$/, list + aiBtn('wide') + '</section>');
})(dayLogCard);
// الورقة
sheetHtml = ((f) => function () {
  if (!sheet || sheet.t !== 'ai') return f.apply(this, arguments);
  const r = aiSheet();
  return '<div class="sheet-bg" data-act="aiClose"></div><div class="sheet aish" role="dialog" aria-label="' + r[0].replace(/<[^>]+>/g, '') + '"><div class="grab"></div><div class="sh">'
    + (AIV().step !== 'menu' && !AIV().busy ? '<button class="back" data-act="aiBack" aria-label="رجوع">' + I('back') + '</button>' : '') + '<h2>' + r[0] + '</h2><button class="back" data-act="aiClose" aria-label="إغلاق">' + I('x') + '</button></div><div class="sb">' + r[1] + '</div></div>';
})(sheetHtml);
function aiEst() { return '<p class="aiest" role="note">⚠️ القيم تقديرية من الذكاء الاصطناعي وليست قياساً دقيقاً، ولا تغني عن إرشاد أخصائيك.</p>'; }
function aiSheet() {
  const v = AIV(), M = AI_MODES.find((m) => m[0] === v.step);
  if (v.step === 'menu') return ['مساعد الطعام', aiPlate(v)];      // 1.59 الطبق التفاعلي (تصميم المالك)
  const title = M[1] + ' ' + M[2];
  if (v.busy) return [title, (v.thumb ? '<img class="aithumb" src="' + v.thumb + '" alt="">' : '') + '<div class="aiload" role="status"><span class="aispin" aria-hidden="true"></span><b>' + ({ text: 'نحلل وصف وجبتك…', photo: 'نتعرّف على أصناف وجبتك…', label: 'نقرأ الملصق ونقيّمه…', store: 'نجهّز إرشادات الحفظ والسلامة…', supp: 'نقرأ المكمّل ونقارنه بالمراجع العلمية…', herb: 'نتعرّف على العشب ونراجع فائدته وأمانه…' })[v.step] + '</b><small>قد يستغرق ذلك حتى 20 ثانية</small></div>'];
  if (v.err) return [title, '<div class="aierr" role="alert"><b>' + esc(v.err) + '</b></div><div class="row"><button class="btn" data-act="aiRetry">حاول مرة أخرى</button><button class="btn sec" data-act="aiBack">رجوع</button></div>'];
  if (v.res) return [title, (v.thumb ? '<img class="aithumb" src="' + v.thumb + '" alt="صورتك">' : '') + (v.res.backup ? '<p class="aiest aibk" role="note">🔄 تقدير احتياطي: المساعد الأساسي مشغول الآن، فحُلّلت صورتك بنموذج بديل. راجع النتيجة، ويمكنك إعادة المحاولة بعد دقائق.</p>' : '') + aiResult(v)];      // 1.58
  if (v.step === 'text') return [title, '<label class="dim" for="aiTxt">صف وجبتك كما أكلتها (الأصناف والكمية إن عرفتها)</label><textarea class="inp" id="aiTxt" rows="4" maxlength="600" placeholder="مثال: برجر لحم بجبنة شيدر مع بطاطس صغيرة وكولا دايت">' + esc(v.text || '') + '</textarea>'
    + '<button class="btn full" data-act="aiGo">حلّل الوجبة</button>' + aiEst()];
  if (v.step === 'herb') return [title, '<p class="dim">صوّر العشب (أوراقه أو بذوره أو زهوره) قريباً بإضاءة جيدة، أو اكتب اسمه.</p><div class="aipick"><button class="btn" data-act="aiPick" data-v="cam">' + I('camera') + ' صوّر العشب</button><button class="btn sec" data-act="aiPick" data-v="lib">' + I('plusSq') + ' اختر من الصور</button></div>'
    + '<label class="dim" for="aiTxt">أو اكتب اسمه</label><input class="inp" id="aiTxt" maxlength="120" placeholder="مثال: حبة البركة، البابونج، الزنجبيل" value="' + esc(v.text || '') + '"><button class="btn sec full" data-act="aiGoHerb">اعرف عن العشب</button>'
    + '<p class="aiest">⚠️ لا تأكل نباتاً برياً اعتماداً على التعرّف من صورة، فبعض النباتات السامة تشبه الأعشاب المعروفة. والمعلومات عامة لا تغني عن استشارة أخصائيك أو طبيبك، خاصة مع الحمل أو الأدوية أو الأمراض المزمنة.</p>'];
  if (v.step === 'supp') return [title, '<p class="dim">صوّر جدول «Supplement Facts» أو المكونات على العبوة، أو اكتب اسم المكمّل وجرعته.</p><div class="aipick"><button class="btn" data-act="aiPick" data-v="cam">' + I('camera') + ' صوّر الملصق</button><button class="btn sec" data-act="aiPick" data-v="lib">' + I('plusSq') + ' اختر من الصور</button></div>'
    + '<label class="dim" for="aiTxt">أو اكتب اسمه وجرعته</label><textarea class="inp" id="aiTxt" rows="2" maxlength="300" placeholder="مثال: فيتامين د 5000 وحدة يومياً، أو كرياتين 5 جرام">' + esc(v.text || '') + '</textarea><button class="btn sec full" data-act="aiGoSupp">قيّم المكمّل</button>'
    + '<p class="aiest">⚠️ تقييم عام بالذكاء الاصطناعي وليس وصفة؛ لا تبدأ مكمّلاً أو توقفه إلا بعد استشارة أخصائيك أو طبيبك، خاصة مع الحمل أو الأمراض المزمنة أو الأدوية.</p>'];
  const hint = { photo: 'صوّر الطبق كاملاً من الأعلى بإضاءة جيدة. كلما كانت الصورة أوضح كان التقدير أقرب.', label: 'صوّر جدول «المعلومات الغذائية» قريباً ومستقيماً حتى تُقرأ الأرقام، ويفضّل أن تظهر المكونات.', store: 'صوّر الطعام الذي تريد حفظه (سمك، دجاج، أرز مطبوخ، خضار…).' }[v.step];
  return [title, '<p class="dim">' + hint + '</p><div class="aipick"><button class="btn" data-act="aiPick" data-v="cam">' + I('camera') + ' التقط صورة</button><button class="btn sec" data-act="aiPick" data-v="lib">' + I('img') + ' اختر من الصور</button></div>'
    + (v.step === 'photo' ? '<label class="dim" for="aiNote">ملاحظة اختيارية (مثل: مقلي بالزيت، نصف الطبق)</label><input class="inp" id="aiNote" maxlength="200" value="' + esc(v.text || '') + '">' : '') + (v.step === 'store' ? '<p class="aiest">⚠️ لا يمكن التأكد من سلامة الطعام من صورة. عند الشك تخلّص منه.</p>' : aiEst())];
}
const aiN = (x, u) => x === null || x === undefined ? '<i class="dim">غير مذكور</i>' : esc(String(x)) + (u ? ' ' + u : '');
function aiResult(v) {
  const r = v.res, m = v.step;
  if (m === 'text' || m === 'photo') {
    const conf = { high: ['ثقة عالية', 'ok'], medium: ['ثقة متوسطة', 'mid'], low: ['ثقة منخفضة', 'low'] }[r.confidence] || ['تقدير', 'mid'], items = r.items.filter((x, i) => !(v.drop || {})[i]);
    const t = items.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
    return '<div class="aihead"><b>' + esc(r.title) + '</b><span class="aiconf ' + conf[1] + '">' + conf[0] + '</span><span class="aiconf mid">تقديري</span></div>'
      + '<div class="aikc"><b>~' + Math.round(t.kcal) + '</b><span>سعرة تقريباً</span></div>'
      + '<div class="aimac"><span class="c">كربوهيدرات <b>' + Math.round(t.c) + '</b> جم</span><span class="p">بروتين <b>' + Math.round(t.p) + '</b> جم</span><span class="f">دهون <b>' + Math.round(t.f) + '</b> جم</span></div>'
      + '<div class="aitbl" role="table" aria-label="الأصناف">' + r.items.map((x, i) => { const off = (v.drop || {})[i]; return '<div class="aiit' + (off ? ' off' : '') + '" role="row"><div><b>' + esc(x.name) + '</b><small>' + esc(x.portion || '') + (x.grams ? ' • ~' + Math.round(x.grams) + ' جم' : '') + '</small><small class="aim">ك ' + Math.round(x.c) + ' • ب ' + Math.round(x.p) + ' • د ' + Math.round(x.f) + '</small></div><span class="aik">~' + Math.round(x.kcal) + '<small>سعرة</small></span><button class="aix" data-act="aiDrop" data-v="' + i + '" aria-label="' + (off ? 'أرجع ' : 'استبعد ') + esc(x.name) + '">' + (off ? '↺' : '×') + '</button></div>'; }).join('') + '</div>'
      + (r.note ? '<p class="dim">' + esc(r.note) + '</p>' : '') + aiEst()
      + (items.length ? '<div class="aiadd"><b>أضفها إلى «تسجيل اليوم» كـ:</b><div class="chips">' + AI_OFF.map((o, i) => '<button class="chip' + ((v.cat || 'extra') === o[0] ? ' on' : '') + '" data-act="aiCat" data-v="' + o[0] + '" aria-pressed="' + ((v.cat || 'extra') === o[0]) + '">' + o[1] + '</button>').join('') + '</div><button class="btn full" data-act="aiAdd">' + I('check') + ' أضف إلى تسجيل اليوم</button></div>' : '')
      + '<button class="btn sec full" data-act="aiAgain">تحليل جديد</button>';
  }
  if (m === 'label') {
    const P = r.per, A = r.assessment, RT = { healthy: ['خيار صحي', 'ok', '🟢'], moderate: ['خيار معتدل', 'mid', '🟡'], occasional: ['للمناسبات فقط', 'low', '🔴'] }[A.rating];
    const rows = [['السعرات', P.kcal, 'سعرة'], ['الدهون الكلية', P.fat, 'جم'], ['الدهون المشبعة', P.satFat, 'جم'], ['الدهون المتحولة', P.transFat, 'جم'], ['الكوليسترول', P.chol, 'ملجم'], ['الصوديوم', P.sodium, 'ملجم'], ['الكربوهيدرات', P.carbs, 'جم'], ['الألياف', P.fiber, 'جم'], ['السكريات', P.sugars, 'جم'], ['السكر المضاف', P.addedSugars, 'جم'], ['البروتين', P.protein, 'جم']];
    const ls = (t, a, c) => a.length ? '<div class="ails ' + c + '"><b>' + t + '</b><ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
    return '<div class="aihead"><b>' + esc(r.product || 'المنتج') + '</b>' + (r.serving ? '<span class="aiconf mid">الحصة: ' + esc(r.serving) + '</span>' : '') + (r.servings ? '<span class="aiconf mid">' + esc(String(r.servings)) + ' حصص في العبوة</span>' : '') + '</div>'
      + '<div class="airate ' + RT[1] + '"><span>' + RT[2] + '</span><div><b>' + RT[0] + '</b><small>' + esc(A.summary) + '</small></div></div>'
      + '<div class="ailbl" role="table" aria-label="القيم الغذائية لكل حصة"><div class="ailh" role="row"><span>القيمة لكل حصة كما على الملصق</span></div>' + rows.map((x) => '<div role="row"><span>' + x[0] + '</span><b>' + aiN(x[1], x[1] === null ? '' : x[2]) + '</b></div>').join('') + '</div>'
      + ls('👍 الإيجابيات', A.positives, 'pos') + ls('⚠️ ما يدعو للانتباه', A.concerns, 'neg') + ls('لماذا هذا التقييم', A.reasons, '') + ls('🔁 بدائل أصح', A.alternatives, 'alt') + ls('💡 نصائح', A.tips, '')
      + (r.ingredients.length ? '<details class="aiing"><summary>المكونات (' + r.ingredients.length + ')</summary><p>' + r.ingredients.map(esc).join('، ') + '</p></details>' : '')
      + '<p class="aiest">⚠️ التقييم مبني على ما قُرئ من الملصق فقط، وقد يخطئ في قراءة رقم؛ راجع الملصق نفسه، واسأل أخصائيك إن كانت لديك حالة صحية.</p>'
      + (P.kcal ? '<button class="btn sec full" data-act="aiAddLbl">' + I('check') + ' أضف حصة واحدة إلى تسجيل اليوم</button>' : '') + '<button class="btn sec full" data-act="aiAgain">امسح ملصقاً آخر</button>';
  }
  if (m === 'supp') {
    const G = { A: ['دليل قوي', 'ok', '🟢'], B: ['دليل ناشئ', 'mid', '🟡'], C: ['دليل ضعيف', 'mid', '🟠'], D: ['غير مستحسن أو خطِر', 'low', '🔴'] }[r.grade] || ['دليل غير واضح', 'mid', '⚪'];
    const VD = { low: ['أقل من الجرعة الفعّالة', 'mid'], ok: ['ضمن المدى', 'ok'], high: ['فوق الحد الآمن', 'low'], unknown: ['غير محدد', 'mid'] };
    const ls = (t, a, c) => a.length ? '<div class="ails ' + c + '"><b>' + t + '</b><ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
    return '<div class="aihead"><b>' + esc(r.product || 'المكمّل') + '</b>' + (r.serving ? '<span class="aiconf mid">الحصة: ' + esc(r.serving) + '</span>' : '') + '</div>'
      + '<div class="airate ' + G[1] + '"><span>' + G[2] + '</span><div><b>' + G[0] + '</b><small>' + esc(r.summary || r.gradeWhy) + '</small></div></div>'
      + '<div class="aiben"><h3>💡 فائدة المكمّل</h3>' + ls('✅ فوائد مثبتة علمياً', r.proven, 'pos') + ls('🔬 دليل ناشئ أو محدود', r.emerging || [], 'alt') + ls('❔ يُروَّج لها بلا دليل كافٍ', r.claimed, 'neg') + ls('👤 من يستفيد منه فعلاً', r.who, 'alt') + ls('🙅 قد لا تحتاجه إذا', r.notNeeded, '')
      + (r.onset ? '<div class="ails"><b>⏳ متى تظهر الفائدة</b><p>' + esc(r.onset) + '</p></div>' : '') + '</div>'
      + '<div class="aiuse"><h3>📋 كيف تأخذه</h3>' + (r.dose ? '<div class="ails"><b>💊 الجرعة المناسبة</b><p>' + esc(r.dose) + '</p></div>' : '') + ls('⏰ التوقيت المناسب', (r.timing && r.timing.length ? r.timing : r.howTo) || [], '') + ls('🍽️ التعارض مع الطعام والمشروبات', r.food || [], 'neg') + '</div>'
      + (r.items.some((x) => x.verdict !== 'unknown' || /\d/.test(x.amount || '')) ? '<div class="aidose" role="table" aria-label="الجرعة مقارنة بالمدى والحد الآمن">' + r.items.filter((x) => x.verdict !== 'unknown' || /\d/.test(x.amount || '')).map((x) => { const d = VD[x.verdict] || VD.unknown; return '<div class="aidr" role="row"><div><b>' + esc(x.name) + (x.form ? ' <small>(' + esc(x.form) + ')</small>' : '') + '</b><small>في المنتج: <b>' + esc(x.amount || '—') + '</b>' + (x.usual ? ' • المعتاد: ' + esc(x.usual) : '') + (x.upper ? ' • الحد الآمن: ' + esc(x.upper) : '') + '</small>' + (x.note ? '<small>' + esc(x.note) + '</small>' : '') + '</div><span class="aiconf ' + d[1] + '">' + d[0] + '</span></div>'; }).join('') + '</div>' : '')
      + (r.gradeWhy && r.summary ? '<p class="dim">' + esc(r.gradeWhy) + '</p>' : '') + ls('⚠️ تحذيرات وتداخلات', r.cautions, 'neg') + ls('🏅 الجودة', r.quality, '') + ls('🥗 بدائل من الطعام', r.foods, 'alt')
      + '<p class="aiest">⚠️ تقييم عام وليس وصفة؛ لا تبدأ مكمّلاً أو توقفه إلا بعد استشارة أخصائيك أو طبيبك.</p>'
      + '<button class="btn full" data-act="aiShare">' + I('msg') + ' أرسلها لأخصائيك</button><button class="btn sec full" data-act="aiAgain">قيّم مكمّلاً آخر</button>';
  }
  if (m === 'herb') {
    const G = { A: ['دليل قوي', 'ok', '🟢'], B: ['دليل متوسط', 'ok', '🟢'], C: ['دليل محدود أو استعمال تقليدي', 'mid', '🟡'], D: ['غير آمن', 'low', '🔴'] }[r.grade] || ['دليل غير واضح', 'mid', '⚪'];
    const CF = { high: ['تعرّف واضح', 'ok'], medium: ['تعرّف متوسط الثقة', 'mid'], low: ['تعرّف غير مؤكد', 'low'] }[r.confidence] || ['', 'mid'];
    const ls = (t, a, c) => a && a.length ? '<div class="ails ' + c + '"><b>' + t + '</b><ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
    return '<div class="aihead"><b>' + esc(r.name || 'العشب') + '</b>' + (r.sci ? '<span class="aiconf mid" dir="ltr"><i>' + esc(r.sci) + '</i></span>' : '') + (r.fromImg ? '<span class="aiconf ' + CF[1] + '">' + CF[0] + '</span>' : '') + '</div>'
      + (r.fromImg && r.confidence !== 'high' ? '<div class="aierr"><b>تأكد من اسم العشب قبل استعماله.</b> التعرّف من الصورة قد يخطئ' + (r.lookalikes.length ? '، وقد يشبه: ' + r.lookalikes.map(esc).join('، ') : '') + '. لا تأكل نباتاً برياً اعتماداً على الصورة. <button class="btn sm sec" data-act="aiHerbName">اكتب الاسم بدلاً من الصورة</button></div>' : (r.lookalikes.length ? ls('👀 قد يشبهه', r.lookalikes, 'neg') : ''))
      + '<div class="airate ' + G[1] + '"><span>' + G[2] + '</span><div><b>' + G[0] + '</b><small>' + esc(r.summary || r.gradeWhy) + '</small></div></div>'
      + '<div class="aiben"><h3>🌿 الفائدة المحتملة</h3>' + ls('✅ مدعومة علمياً', r.proven, 'pos') + ls('🔬 دليل ناشئ أو محدود', r.emerging || [], 'alt') + ls('📜 استعمالات تقليدية', r.uses, '') + ls('❔ يُروَّج لها بلا دليل كافٍ', r.claimed, 'neg') + '</div>'
      + '<div class="aiuse"><h3>📋 كيف يُستعمل</h3>' + (r.dose ? '<div class="ails"><b>🥄 الطريقة والكمية المعتادة</b><p>' + esc(r.dose) + '</p></div>' : '') + ls('⏰ التوقيت المناسب', r.timing, '') + (r.maxDuration ? '<div class="ails"><b>📅 أقصى مدة</b><p>' + esc(r.maxDuration) + '</p></div>' : '') + ls('🍽️ التعارض مع الطعام والمشروبات', r.food, 'neg') + '</div>'
      + ls('💊 تداخلات مع الأدوية', r.drugs, 'neg') + ls('⛔ تجنّبه إذا', r.avoidIf, 'neg') + ls('⚠️ تحذيرات', r.cautions, 'neg')
      + '<p class="aiest">⚠️ معلومات عامة وليست علاجاً؛ لا تستبدل بها دواءك، واستشر أخصائيك أو طبيبك قبل استعمال الأعشاب بجرعات علاجية.</p>'
      + '<button class="btn full" data-act="aiShare">' + I('msg') + ' أرسلها لأخصائيك</button><button class="btn sec full" data-act="aiAgain">عشب آخر</button>';
  }
  const PL = { fridge: ['🧊', 'في الثلاجة'], freezer: ['❄️', 'في الفريزر'], pantry: ['🗄️', 'خارج الثلاجة'], mixed: ['🧊', 'الثلاجة أو الفريزر'] }[r.place];
  const ls = (t, a, c) => a.length ? '<div class="ails ' + c + '"><b>' + t + '</b><ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
  return '<div class="aihead"><b>' + esc(r.food) + '</b>' + (r.category ? '<span class="aiconf mid">' + esc(r.category) + '</span>' : '') + '</div>'
    + '<div class="airate mid"><span>' + PL[0] + '</span><div><b>يُحفظ ' + PL[1] + '</b><small>' + esc(r.temp) + '</small></div></div>'
    + '<div class="aidur">' + [['🧊 الثلاجة', r.fridge], ['❄️ الفريزر', r.freezer], ['🌡️ خارج التبريد', r.room]].filter((x) => x[1]).map((x) => '<div><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b></div>').join('') + '</div>'
    + ls('طريقة الحفظ', r.howTo, '') + ls('🔍 علامات الفساد', r.spoilSigns, 'neg') + ls('⛔ لا تأكله إذا', r.unsafeSigns, 'neg') + ls('🧼 التعامل والطهي الآمن', r.handling, 'pos')
    + '<p class="aiest">⚠️ ' + esc(r.note || 'لا يمكن التأكد من سلامة الطعام من صورة. عند الشك تخلّص منه.') + '</p><button class="btn sec full" data-act="aiAgain">صوّر طعاماً آخر</button>';
}
// 1.59 قائمة المساعد «طبق من ست وظائف» (تصميم المالك): الكاميرا في المنتصف وكل قسم وظيفة؛ لمسة تختار القسم وتُظهر بطاقته، و«ابدأ» يفتحه
// ترتيب النص: في كل قسم الأيقونة ثم الاسم تحتها مباشرة (عمودياً مهما كان اتجاه القسم)، اسم قصير بسطر واحد بنفس الحجم؛ الاسم الكامل والشرح في البطاقة
const AI_PL = { text: ['صف وجبتك', 'pen', '#ffab4a', '#ffcb85', '#ef8d13', ['سعرات', 'بروتين', 'كربوهيدرات', 'دهون']], photo: ['صوّر وجبتك', 'cam', '#2fcdb4', '#7cebd9', '#17a58e', ['التعرّف بالصورة', 'تقدير القيم']],
  label: ['الملصق', 'tag', '#ff7b7b', '#ffa3a3', '#e94848', ['قراءة الجدول', 'تقييم صحي']], store: ['التخزين', 'flake', '#5eaefc', '#a1d2ff', '#3a8be6', ['الحفظ', 'الصلاحية', 'علامات الفساد']],
  supp: ['المكملات', 'pill', '#ad7cff', '#d6b6ff', '#8b4bf0', ['الفائدة', 'الدليل العلمي', 'الجرعة الآمنة']], herb: ['الأعشاب', 'leaf', '#4fd07c', '#93efb0', '#25ad58', ['التعرّف', 'الفائدة المحتملة', 'الاستعمال الآمن']] };
const AI_PLI = { pen: '<path d="M4 20l1.2-4.2L15.5 5.5a2.1 2.1 0 0 1 3 3L8.2 18.8 4 20z"/><path d="M13.5 7.5l3 3"/>',
  cam: '<rect x="3" y="7.5" width="18" height="12.5" rx="3"/><path d="M8.5 7.5L10 4.5h4l1.5 3"/><circle cx="12" cy="13.5" r="3.6"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
  flake: '<path d="M12 3v18"/><path d="M12 3l-2.4 2.4M12 3l2.4 2.4M12 21l-2.4-2.4M12 21l2.4-2.4"/><path d="M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
  pill: '<g transform="rotate(45 12 12)"><rect x="4.5" y="8.75" width="15" height="6.5" rx="3.25"/><path d="M12 8.75v6.5"/></g>',
  leaf: '<path d="M19.5 4.5C10.5 5 5.5 9.5 5 19c9.5-.5 14.5-5.5 14.5-14.5z"/><path d="M5 19C8.5 13.5 12 10 17 7"/>' };
const aiStepOf = () => 360 / aiModes().length, aiAmOf = (m) => { const i = aiModes().findIndex((x) => x[0] === m); return i < 0 ? 0 : i * aiStepOf() + aiStepOf() / 2; };
const aiNear = (rot, t) => t + 360 * Math.round((rot - t) / 360);      // أقرب دوران يوصل القسم للأعلى (بلا لفّة كاملة زائدة)
function aiPlate(v) {
  const M = aiModes(), n = M.length, C = 220, P = (r, a) => (C + r * Math.sin(a * Math.PI / 180)).toFixed(1) + ',' + (C - r * Math.cos(a * Math.PI / 180)).toFixed(1);
  const sec = (r0, r1, a0, a1) => 'M' + P(r0, a0) + 'L' + P(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 0 1 ' + P(r1, a1) + 'L' + P(r0, a1) + 'A' + r0 + ' ' + r0 + ' 0 0 0 ' + P(r0, a0) + 'Z';
  const xy = (r, a) => P(r, a).split(',').map(Number), sel = v.sel || '', step = 360 / n;
  if (v.rot == null) v.rot = sel ? -aiAmOf(sel) : 0;
  let defs = '', parts = '';
  M.forEach((m, i) => {
    const d = AI_PL[m[0]] || ['', 'cam', '#7c8aff', '#a9b2ff', '#5866e0', []], a0 = i * step + 2.5, a1 = (i + 1) * step - 2.5, am = i * step + step / 2, c = xy(124, am), on = sel === m[0];
    const off = on ? xy(8, am).map((z) => (z - C).toFixed(1)) : [0, 0];
    defs += '<radialGradient id="aiw' + i + '" gradientUnits="userSpaceOnUse" cx="220" cy="220" r="178"><stop offset="0" stop-color="' + d[3] + '"/><stop offset=".55" stop-color="' + d[2] + '"/><stop offset="1" stop-color="' + d[4] + '"/></radialGradient>';
    // الأيقونة والاسم مجموعة واحدة حول مركز القسم، تدور عكس العجلة فيبقى النص قائماً ومقروءاً في أي وضع
    parts += '<g class="aiw' + (on ? ' on' : sel ? ' dim' : '') + '" data-act="aiSel" data-v="' + m[0] + '" role="button" tabindex="0" aria-pressed="' + on + '" aria-label="' + esc(m[2] + ' — ' + m[3]) + '" style="--i:' + i + ';--gl:' + d[2] + '80;transform:translate(' + off[0] + 'px,' + off[1] + 'px)">'
      + '<path class="aiws" d="' + sec(76, 178, a0, a1) + '" fill="url(#aiw' + i + ')"/>'
      + '<g transform="translate(' + c[0] + ' ' + c[1] + ')"><g class="aiup"><circle cy="-15" r="22" class="aiwc"/><g transform="translate(-15 -30) scale(1.25)" class="aiwi">' + AI_PLI[d[1]] + '</g>'
      + '<text y="24" class="aiwt">' + esc(d[0]) + '</text></g></g></g>';
  });
  const cur = M.find((m) => m[0] === sel), d = cur && AI_PL[cur[0]];
  const card = cur ? '<div class="aicard" style="--ac:' + d[2] + '" aria-live="polite"><div class="aict"><span class="aicic" style="background:' + d[2] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + AI_PLI[d[1]] + '</svg></span><div><small>وظيفة من وظائف المساعد</small><b>' + esc(cur[2]) + '</b></div></div><p>' + esc(cur[3]) + '</p>'
      + '<div class="aitags">' + d[5].map((t) => '<span>' + esc(t) + '</span>').join('') + '</div><button class="btn full aistart" data-act="aiMode" data-v="' + cur[0] + '">ابدأ: ' + esc(cur[2]) + '</button></div>'
    : '<div class="aicard" style="--ac:#7c8aff" aria-live="polite"><div class="aict"><span class="aicic" style="background:#4a56b8"><svg viewBox="0 0 24 24" aria-hidden="true">' + AI_PLI.cam + '</svg></span><div><small>مساعد الطعام</small><b>كاميرا واحدة، ' + n + ' وظائف</b></div></div><p>أدِر الطبق أو المس قسماً ليصعد إلى الأعلى ويظهر شرحه هنا، ثم اضغط «ابدأ».</p></div>';
  const anim = !v.seen; v.seen = 1;
  return '<div class="aipl' + (anim ? ' in' : '') + '"><div class="aiplw"><svg viewBox="0 0 440 440" role="group" aria-label="طبق وظائف مساعد الطعام، يدور بالسحب أو بالأسهم" style="--rot:' + v.rot.toFixed(1) + 'deg"><defs>' + defs + '</defs>'
    + '<circle cx="220" cy="220" r="206" class="aipr"/><circle cx="220" cy="220" r="184" class="aipd"/><g class="aiwheel">' + parts + '</g>'
    + '<circle cx="220" cy="220" r="196" class="aipdot"/><circle cx="220" cy="220" r="76" class="aipd"/>'
    + '<path d="M209 4h22l-11 15z" class="aipin"/>'
    + '<g class="aihub" data-act="aiSel" data-v="" role="button" tabindex="0" aria-label="النظرة العامة"><circle cx="220" cy="220" r="62" class="aihubc"/><g transform="translate(199 186) scale(1.75)" class="aihubi">' + AI_PLI.cam + '</g><text x="220" y="246" class="aihubt">مساعد الطعام</text></g>'
    + '</svg></div>' + card + '</div>';
}
// تدوير العجلة إلى قسم: حركة على الطبق الحالي، ثم إعادة الرسم بالقسم المختار وبطاقته
function aiSpinTo(m, rot) {
  const s = AIV(), sv = $('.aiplw svg'), t = aiNear(rot != null ? rot : s.rot || 0, -aiAmOf(m));
  s.sel = m; s.rot = t; s.seen = 1;
  if (!sv || matchMedia('(prefers-reduced-motion: reduce)').matches) { render(); return; }
  sv.closest('.aipl').classList.remove('drag'); sv.style.setProperty('--rot', t + 'deg'); clearTimeout(aiSpinTo.t); aiSpinTo.t = setTimeout(() => { if (V.ai === s && s.step === 'menu') render(); }, 430);
}
// السحب بالإصبع أو الفأرة يدير الطبق كعجلة، مع اندفاع خفيف ثم يستقر على أقرب قسم (يصير هو المختار)
let aiDrag = null, aiNoClick = 0;
const aiAng = (e, D) => Math.atan2(e.clientX - D.cx, -(e.clientY - D.cy)) * 180 / Math.PI;
document.addEventListener('pointerdown', (e) => {
  const sv = e.target.closest && e.target.closest('.aiplw svg'); if (!sv || e.button > 0) return;
  const r = sv.getBoundingClientRect(), D = { sv, cx: r.left + r.width / 2, cy: r.top + r.height / 2, moved: 0, vel: 0 };
  if (Math.hypot(e.clientX - D.cx, e.clientY - D.cy) < r.width * 70 / 440) return;      // المركز زر النظرة العامة
  D.last = aiAng(e, D); D.t = performance.now(); D.rot = AIV().rot || 0; D.x = e.clientX; D.y = e.clientY; aiDrag = D;
});
document.addEventListener('pointermove', (e) => {
  const D = aiDrag; if (!D) return; const a = aiAng(e, D); let d = a - D.last; d = ((d + 540) % 360) - 180;
  if (!D.moved && Math.hypot(e.clientX - D.x, e.clientY - D.y) < 8) return;
  if (!D.moved) { D.moved = 1; D.sv.closest('.aipl').classList.add('drag'); }
  const now = performance.now(); D.vel = 0.7 * D.vel + 0.3 * (d / Math.max(8, now - D.t)); D.t = now; D.last = a; D.rot += d;
  D.sv.style.setProperty('--rot', D.rot.toFixed(1) + 'deg'); e.preventDefault();
}, { passive: false });
const aiDragEnd = () => {
  const D = aiDrag; aiDrag = null; if (!D || !D.moved) return; aiNoClick = 1; setTimeout(() => { aiNoClick = 0; }, 80);
  const step = aiStepOf(), rot = D.rot + Math.max(-240, Math.min(240, D.vel * 260)), i = Math.round((-rot - step / 2) / step), n = aiModes().length;
  aiSpinTo(aiModes()[((i % n) + n) % n][0], rot);
};
document.addEventListener('pointerup', aiDragEnd); document.addEventListener('pointercancel', aiDragEnd);
window.addEventListener('click', (e) => { if (aiNoClick && e.target.closest && e.target.closest('.aiplw')) { e.stopPropagation(); e.preventDefault(); aiNoClick = 0; } }, true);      // السحب لا يُحسب نقرة
// لوحة المفاتيح: Enter/مسافة مثل النقر، والأسهم تدير الطبق قسماً قسماً
document.addEventListener('keydown', (e) => {
  if (!e.target.closest || !e.target.closest('.aipl')) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { const M = aiModes(), s = AIV(), i = Math.max(0, M.findIndex((x) => x[0] === s.sel)), j = (i + (e.key === 'ArrowLeft' ? 1 : -1) + M.length) % M.length; e.preventDefault(); aiSpinTo(M[j][0]); setTimeout(() => { const g = $('.aiw[data-v="' + M[j][0] + '"]'); if (g) g.focus(); }, 480); return; }
  const g = (e.key === 'Enter' || e.key === ' ') && e.target.closest('.aipl [role="button"]'); if (!g) return; e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
// الشبكة: موقّع بمفتاح العميل؛ وفي نسخة العرض (المعاينة) بلا حساب
async function aiCall(o) {
  const path = '/v1/ai/food';
  if (DEMO) { o.demo = 1; let r; try { r = await fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o), cache: 'no-store' }); } catch (e) { throw new Error('لا اتصال بالإنترنت'); } const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'تعذّر التحليل (' + r.status + ')'); return j; }
  try { return await api('POST', path, o); } catch (e) { throw new Error(e.net ? 'لا اتصال بالإنترنت. حاول عند عودة الاتصال.' : e.message); }
}
async function aiRun(o) {
  const v = AIV(); v.busy = 1; v.err = ''; v.res = null; v.drop = {}; v.last = o; render();
  try { const r = await aiCall(o); if (!r.ok) throw new Error(r.reason || r.error || 'تعذّر التحليل'); v.res = r; }
  catch (e) { v.err = e.message || 'تعذّر التحليل'; }
  v.busy = 0; if (sheet && sheet.t === 'ai') render();
}
async function aiImage(file, step) {
  const dims = step === 'label' || step === 'supp' || step === 'herb' ? [[1600, 0.82], [1280, 0.75], [1024, 0.7], [320, 0.6]] : [[1024, 0.75], [800, 0.7], [640, 0.65], [320, 0.6]];
  const out = await shrink(file, dims), big = out.slice(0, 3).find((x) => x.length < 900000) || out[2];
  return { img: big.split(',')[1], mime: 'image/jpeg', thumb: out[3] };
}
function aiPickFile(cam, cb) { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (cam) inp.setAttribute('capture', 'environment'); inp.style.display = 'none'; document.body.appendChild(inp); inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) cb(f); }; inp.click(); }
function aiAddLog(entry, cat, line) {
  const L = dl(TODAY); L.ai = (L.ai || []).concat([entry]).slice(-20); L.off = L.off || {}; L.off[cat] = 1;
  L.offT = ((L.offT ? L.offT + '\n' : '') + line).slice(-500); queueLog(dkey(new Date())); save();
}
function aiAct(a, v, el) {
  const s = AIV();
  switch (a) {
    case 'aiOpen': V.ai = { step: 'menu' }; sheet = { t: 'ai' }; return true;
    case 'aiSel': if (!v) { s.sel = ''; return true; } aiSpinTo(v); return false;      // 1.59 لمس قسم: يدور الطبق ليصعد للأعلى ويُختار (المركز = النظرة العامة)
    case 'aiClose': if (s.busy) return false; sheet = null; V.ai = null; return true;
    case 'aiBack': if (s.busy) return false; V.ai = s.res || s.err ? { step: s.step, text: s.text } : { step: 'menu', sel: s.step, seen: 1, rot: -aiAmOf(s.step) }; return true;
    case 'aiMode': V.ai = { step: v }; if (v === 'text') setTimeout(() => { const t = $('#aiTxt'); if (t) t.focus(); }, 60); return true;
    case 'aiAgain': V.ai = { step: s.step }; return true;
    case 'aiRetry': if (s.last) aiRun(s.last); return false;
    case 'aiGo': { const t = ($('#aiTxt') || {}).value || ''; s.text = t; if (t.trim().length < 3) { toast('اكتب وصفاً لوجبتك أولاً'); return false; } s.thumb = ''; aiRun({ mode: 'text', text: t.trim() }); return false; }
    case 'aiPick': { const step = s.step, note = (($('#aiNote') || $('#aiTxt') || {}).value || '').trim(); s.text = note;
      aiPickFile(v === 'cam', async (f) => { try { const im = await aiImage(f, step); s.thumb = im.thumb; aiRun({ mode: step, img: im.img, mime: im.mime, text: note || undefined }); } catch (e) { s.err = e.message || 'تعذّر فتح الصورة'; render(); } }); return false; }
    case 'aiGoSupp': { const t = (($('#aiTxt') || {}).value || '').trim(); s.text = t; if (t.length < 3) { toast('اكتب اسم المكمّل وجرعته أو صوّر الملصق'); return false; } s.thumb = ''; aiRun({ mode: 'supp', text: t }); return false; }
    case 'aiGoHerb': { const t = (($('#aiTxt') || {}).value || '').trim(); s.text = t; if (t.length < 2) { toast('اكتب اسم العشب أو صوّره'); return false; } s.thumb = ''; aiRun({ mode: 'herb', text: t }); return false; }
    case 'aiHerbName': V.ai = { step: 'herb', text: (s.res && s.res.name) || '' }; setTimeout(() => { const t = $('#aiTxt'); if (t) { t.focus(); t.select(); } }, 60); return true;
    case 'aiShare': if (s.step === 'herb' && s.res) { const r = s.res, G = { A: 'دليل قوي', B: 'دليل متوسط', C: 'دليل محدود', D: 'غير آمن' }[r.grade] || '';
      if (!sendMsg(('🌿 سؤال عن عشب: ' + (r.name || '') + (r.sci ? ' (' + r.sci + ')' : '') + ' — ' + G + '. الفائدة المحتملة: ' + (r.proven.concat(r.uses).slice(0, 3).join('، ') || '—') + '. هل يناسبني وبأي كمية؟').slice(0, 1900))) return false; sheet = null; V.ai = null; toast('أُرسل لأخصائيك ✓'); return true; }
    case 'aiShare': { const r = s.res; if (!r) return false; const G = { A: 'دليل قوي', B: 'دليل ناشئ', C: 'دليل ضعيف', D: 'غير مستحسن' }[r.grade] || '';
      const hi = r.items.filter((x) => x.verdict === 'high').map((x) => x.name), txt = '💊 تقييم مكمّل بالمساعد: ' + (r.product || 'مكمّل') + (r.serving ? ' (حصة ' + r.serving + ')' : '') + ' — ' + G + '. ' + r.items.slice(0, 6).map((x) => x.name + ' ' + (x.amount || '')).join('، ') + (hi.length ? '. ⚠️ فوق الحد الآمن: ' + hi.join('، ') : '') + '. هل يناسبني؟';
      if (!sendMsg(txt.slice(0, 1900))) return false; sheet = null; V.ai = null; toast('أُرسل التقييم لأخصائيك ✓'); return true; }
    case 'aiDrop': { s.drop = s.drop || {}; s.drop[v] = !s.drop[v]; return true; }
    case 'aiCat': s.cat = v; return true;
    case 'aiAdd': { const r = s.res, items = r.items.filter((x, i) => !(s.drop || {})[i]); if (!items.length) return false;
      const t = items.reduce((q, x) => ({ kcal: q.kcal + x.kcal, p: q.p + x.p, c: q.c + x.c, f: q.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 }), cat = s.cat || 'extra';
      const title = items.length === r.items.length ? r.title : items.map((x) => x.name).join(' + ');
      aiAddLog({ t: title.slice(0, 80), src: s.step, kcal: Math.round(t.kcal), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f), it: items.map((x) => x.name + (x.portion ? ' (' + x.portion + ')' : '')).slice(0, 12), at: Date.now(), est: 1 }, cat,
        '🤖 ' + title + ' — ~' + Math.round(t.kcal) + ' سعرة (ك ' + Math.round(t.c) + ' • ب ' + Math.round(t.p) + ' • د ' + Math.round(t.f) + ') تقدير المساعد');
      sheet = null; V.ai = null; toast('أُضيفت «' + title.slice(0, 40) + '» إلى تسجيل اليوم ✓'); return true; }
    case 'aiAddLbl': { const r = s.res, P = r.per, nm = (r.product || 'منتج') + (r.serving ? ' (حصة ' + r.serving + ')' : '');
      aiAddLog({ t: nm.slice(0, 80), src: 'label', kcal: Math.round(P.kcal || 0), p: Math.round(P.protein || 0), c: Math.round(P.carbs || 0), f: Math.round(P.fat || 0), it: [nm], at: Date.now(), est: 0 }, 'extra', '🏷️ ' + nm + ' — ' + Math.round(P.kcal || 0) + ' سعرة من الملصق');
      sheet = null; V.ai = null; toast('أُضيفت حصة إلى تسجيل اليوم ✓'); return true; }
    case 'aiDel': { const L = dl(TODAY), x = (L.ai || [])[+v]; if (!x) return false; L.ai.splice(+v, 1); if (L.offT) L.offT = L.offT.split('\n').filter((ln) => ln.indexOf(x.t) < 0).join('\n'); queueLog(dkey(new Date())); save(); toast('حُذفت من تسجيل اليوم'); return true; }
  }
  return false;
}
// تُستدعى أولاً من موزّع النقرات (قبل switch)
document.addEventListener('click', (e) => {
  const el = e.target.closest && e.target.closest('[data-act^="ai"]'); if (!el || !S) return;
  e.stopImmediatePropagation(); if (aiAct(el.dataset.act, el.dataset.v, el)) render();
}, true);
