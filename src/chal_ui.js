// ================= التحديات الأسبوعية وشهادات التقدير (يُدمج داخل app.js عند /*CHALUI*/)
// قوالب جاهزة لأول 4 أسابيع (الإعدادات ← «🏆 التحديات») يعدّلها الأخصائي، ثم من ملف العميل ← «حصتي»: برنامج 4 أسابيع أو تحدٍّ مخصّص
// يُعدَّل قبل الإرسال. كل هدف = عادة + قيمة يومية + عدد أيام في الأسبوع. «حصتي» تحسب التقدّم من سجل العميل، وتولّد شهادة تقدير
// باسم العميل وشعار الأخصائي واسمه عند إتمام كل أسبوع، وتُبلغ الأخصائي بالإنجاز.
var CH = { ed: null, tplEd: null };
var CH_G = {   // العادة: [الاسم، الوحدة، القيمة الافتراضية، هل لها قيمة، وصف المعيار]
  water: ['شرب الماء', 'كوب', 8, 1, 'أكواب يومياً على الأقل'], plan: ['الالتزام بالخطة', '%', 70, 1, '% من أصناف اليوم على الأقل'], steps: ['المشي', 'خطوة', 6000, 1, 'خطوة يومياً على الأقل'],
  sleep: ['النوم الكافي', 'ساعة', 7, 1, 'ساعات نوم على الأقل'], veg: ['خضار وفاكهة', 'حصة', 5, 1, 'حصص يومياً'], sugar: ['يوم بلا سكر مضاف', '', 1, 0, 'يوم كامل بلا سكر'],
  move: ['النشاط البدني', 'دقيقة', 30, 1, 'دقيقة حركة'], breath: ['تنفّس وهدوء', 'جلسة', 1, 1, 'جلسة تنفّس'], mindful: ['أكل بوعي', 'وجبة', 2, 1, 'وجبات بلا شاشة'],
  kitchen: ['المطبخ مغلق ليلاً', '', 1, 0, 'لا أكل بعد العشاء'], coffee: ['كافيين باعتدال', 'كوب', 3, 1, 'أكواب كحد أقصى'], adhkar: ['أذكار الصباح', '', 1, 0, 'إتمام أذكار الصباح']
};
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
  switch (g.h) { case 'sugar': case 'kitchen': return v === 1; case 'mindful': return (v || []).length >= g.v; case 'coffee': return v <= g.v; case 'adhkar': return ((v && v.c) || []).reduce(function (a, x) { return a + (+x || 0); }, 0) >= 254; default: return +v >= +g.v; } }
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
  var head = '<div class="ucard chcard"><div class="hxtop"><h3>🏆 التحديات' + (ach.length ? ' <small>🏅 ' + ach.length + ' شهادة</small>' : '') + '</h3><p class="two"><button class="sm" data-a="chNew" data-v="prog">ابدأ برنامج 4 أسابيع</button><button class="sec sm" data-a="chNew" data-v="one">تحدٍّ مخصّص</button></p></div>';
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
  chNew: function (v) { var c = cur(); CH.ed = { code: c.code, start: chDay(), weeks: v === 'prog' ? chTpls() : [{ title: 'تحدّي الأسبوع', msg: 'تحدٍّ خاص بك من أخصائيك', goals: [{ h: 'water', v: 8, d: 5 }] }] }; main(); },
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
