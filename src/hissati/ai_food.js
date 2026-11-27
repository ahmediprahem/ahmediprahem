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
  ['store', '🧊', 'التخزين والسلامة', 'صوّر طعاماً، ونخبرك كيف تحفظه ومدة صلاحيته وعلامات فساده']
];
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
  if (v.step === 'menu') return ['مساعد الطعام', '<p class="dim">اختر ما تريد، وسيحلله المساعد في ثوانٍ.</p><div class="aimenu">' + AI_MODES.map((m) => '<button class="aiopt" data-act="aiMode" data-v="' + m[0] + '"><span class="aie" aria-hidden="true">' + m[1] + '</span><span><b>' + m[2] + '</b><small>' + m[3] + '</small></span></button>').join('') + '</div>'];
  const title = M[1] + ' ' + M[2];
  if (v.busy) return [title, (v.thumb ? '<img class="aithumb" src="' + v.thumb + '" alt="">' : '') + '<div class="aiload" role="status"><span class="aispin" aria-hidden="true"></span><b>' + ({ text: 'نحلل وصف وجبتك…', photo: 'نتعرّف على أصناف وجبتك…', label: 'نقرأ الملصق ونقيّمه…', store: 'نجهّز إرشادات الحفظ والسلامة…' })[v.step] + '</b><small>قد يستغرق ذلك حتى 20 ثانية</small></div>'];
  if (v.err) return [title, '<div class="aierr" role="alert"><b>' + esc(v.err) + '</b></div><div class="row"><button class="btn" data-act="aiRetry">حاول مرة أخرى</button><button class="btn sec" data-act="aiBack">رجوع</button></div>'];
  if (v.res) return [title, (v.thumb ? '<img class="aithumb" src="' + v.thumb + '" alt="صورتك">' : '') + aiResult(v)];
  if (v.step === 'text') return [title, '<label class="dim" for="aiTxt">صف وجبتك كما أكلتها (الأصناف والكمية إن عرفتها)</label><textarea class="inp" id="aiTxt" rows="4" maxlength="600" placeholder="مثال: برجر لحم بجبنة شيدر مع بطاطس صغيرة وكولا دايت">' + esc(v.text || '') + '</textarea>'
    + '<button class="btn full" data-act="aiGo">حلّل الوجبة</button>' + aiEst()];
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
  const PL = { fridge: ['🧊', 'في الثلاجة'], freezer: ['❄️', 'في الفريزر'], pantry: ['🗄️', 'خارج الثلاجة'], mixed: ['🧊', 'الثلاجة أو الفريزر'] }[r.place];
  const ls = (t, a, c) => a.length ? '<div class="ails ' + c + '"><b>' + t + '</b><ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
  return '<div class="aihead"><b>' + esc(r.food) + '</b>' + (r.category ? '<span class="aiconf mid">' + esc(r.category) + '</span>' : '') + '</div>'
    + '<div class="airate mid"><span>' + PL[0] + '</span><div><b>يُحفظ ' + PL[1] + '</b><small>' + esc(r.temp) + '</small></div></div>'
    + '<div class="aidur">' + [['🧊 الثلاجة', r.fridge], ['❄️ الفريزر', r.freezer], ['🌡️ خارج التبريد', r.room]].filter((x) => x[1]).map((x) => '<div><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b></div>').join('') + '</div>'
    + ls('طريقة الحفظ', r.howTo, '') + ls('🔍 علامات الفساد', r.spoilSigns, 'neg') + ls('⛔ لا تأكله إذا', r.unsafeSigns, 'neg') + ls('🧼 التعامل والطهي الآمن', r.handling, 'pos')
    + '<p class="aiest">⚠️ ' + esc(r.note || 'لا يمكن التأكد من سلامة الطعام من صورة. عند الشك تخلّص منه.') + '</p><button class="btn sec full" data-act="aiAgain">صوّر طعاماً آخر</button>';
}
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
  const dims = step === 'label' ? [[1600, 0.82], [1280, 0.75], [1024, 0.7], [320, 0.6]] : [[1024, 0.75], [800, 0.7], [640, 0.65], [320, 0.6]];
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
    case 'aiClose': if (s.busy) return false; sheet = null; V.ai = null; return true;
    case 'aiBack': if (s.busy) return false; V.ai = s.res || s.err ? { step: s.step, text: s.text } : { step: 'menu' }; return true;
    case 'aiMode': V.ai = { step: v }; if (v === 'text') setTimeout(() => { const t = $('#aiTxt'); if (t) t.focus(); }, 60); return true;
    case 'aiAgain': V.ai = { step: s.step }; return true;
    case 'aiRetry': if (s.last) aiRun(s.last); return false;
    case 'aiGo': { const t = ($('#aiTxt') || {}).value || ''; s.text = t; if (t.trim().length < 3) { toast('اكتب وصفاً لوجبتك أولاً'); return false; } s.thumb = ''; aiRun({ mode: 'text', text: t.trim() }); return false; }
    case 'aiPick': { const step = s.step, note = (($('#aiNote') || {}).value || '').trim(); s.text = note;
      aiPickFile(v === 'cam', async (f) => { try { const im = await aiImage(f, step); s.thumb = im.thumb; aiRun({ mode: step, img: im.img, mime: im.mime, text: note || undefined }); } catch (e) { s.err = e.message || 'تعذّر فتح الصورة'; render(); } }); return false; }
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
