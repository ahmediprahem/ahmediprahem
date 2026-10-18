// ================= المظهر: زجاجي (الافتراضي) | Linear داكن | كلاسيكي (يُدمج داخل app.js عند /*THEMEUI*/)
// كل ثيم طبقة تنسيق إضافية فقط (وسم style ثانٍ مقيَّد بـ html[data-theme])؛ لا يحذف ولا يعطّل أي مكوّن قديم. الزجاجي = قواعد Linear + theme_glass.css فوقها، ومعه تخطيط القائمة الجديد (شريط تنقل + عمود العملاء + شريط سفلي للجوال).
// الإعداد: admin → S.settings.ui {theme, lock} (يُصدَّر مع نسخة المستخدمين)؛ المستخدم → S.settings.ui.theme ما لم يقفله المدير. الدمج في E.mergeSettings.
(function () {                                                   // تطبيق مبكر (قبل الدخول): آخر مظهر مخزَّن، وإلا افتراضي المدير في ملف المستخدم
  try { var t = localStorage.getItem('hissa_theme'); if (!t && window.BASE_SETTINGS && window.BASE_SETTINGS.ui) t = window.BASE_SETTINGS.ui.theme; document.documentElement.dataset.theme = themeOk(t); } catch (e) { document.documentElement.dataset.theme = 'glass'; }
})();
var THEMES = [['glass', 'زجاجي', 'الافتراضي: زجاج شفاف بأسلوب آيفون، أيقونات خطية، قائمة تنقل واضحة وشريط سفلي على الجوال'], ['linear', 'Linear داكن', 'داكن نظيف: زجاج خفيف وحواف رفيعة ولمعان أخضر زمردي'], ['legacy', 'كلاسيكي', 'المظهر الفاتح القديم كما هو']];
function themeOk(t) { return t === 'linear' || t === 'legacy' ? t : 'glass'; }
function themeName(t) { return THEMES.filter(function (x) { return x[0] === themeOk(t); })[0][1]; }
function themeCur() { return themeOk((eff().ui || {}).theme); }
function isGlass() { return themeCur() === 'glass'; }
function applyTheme() {
  var t = themeCur(); document.documentElement.dataset.theme = t; try { localStorage.setItem('hissa_theme', t); } catch (e) { }
  var m1 = document.querySelector('meta[name=color-scheme]'), m2 = document.querySelector('meta[name=theme-color]'); if (m1) m1.setAttribute('content', t === 'legacy' ? 'light' : 'dark'); if (m2) m2.setAttribute('content', t === 'linear' ? '#0b1329' : t === 'glass' ? '#121c45' : '#092061');
}
function themeBtn() {                                            // زر تبديل سريع في الترويسة للمستخدم فقط (ما لم يقفله المدير)
  return S.mode !== 'admin' && !((eff().ui || {}).lock) ? '<button class="sec sm" data-a="themeToggle" title="تبديل المظهر (' + themeName(themeCur()) + ')" aria-label="تبديل المظهر">◐</button>' : '';
}
function themePage() {
  var e = eff().ui || {}, admin = S.mode === 'admin', own = (S.settings.ui && S.settings.ui.theme) || '', locked = !admin && e.lock, sel = admin ? themeOk(own) : own;
  var sw = { legacy: '<span class="thsw lg"><i></i><b></b></span>', linear: '<span class="thsw ln"><i></i><b></b></span>', glass: '<span class="thsw gl"><i></i><b></b></span>' };
  var opts = (admin ? [] : [['', 'حسب المدير', 'يتبع القالب الذي يحدده المدير' + ' (حالياً: ' + themeName(e.adminTheme) + ')']]).concat(THEMES);
  return '<h3>🎨 المظهر</h3><p class="small">' + (admin ? 'اختر القالب الافتراضي للواجهة. يُحفظ مع إعداداتك ويصل المستخدمين عند «تصدير نسخة المستخدمين» أو «تصدير موقع للنشر» التالي (لا خادم هنا، فملفات المستخدمين الحالية لا تتغير تلقائياً). القالب القديم محفوظ كاملاً ويمكن الرجوع إليه في أي وقت.' : locked ? '🔒 حدّد المدير القالب لجميع المستخدمين، فلا يمكن تغييره هنا.' : 'اختر مظهر الواجهة على هذا الجهاز. يمكنك دائماً الرجوع إلى «حسب المدير».') + '</p><div class="thgrid">'
    + opts.map(function (o) { return '<label class="thcard' + (sel === o[0] ? ' on' : '') + (locked ? ' dis' : '') + '"><input type="radio" name="thm" data-thm="1" value="' + o[0] + '" ' + (sel === o[0] ? 'checked' : '') + (locked ? ' disabled' : '') + '>' + (sw[o[0]] || '<span class="thsw mx"><i></i><b></b></span>') + '<b>' + o[1] + '</b><small>' + o[2] + '</small></label>'; }).join('') + '</div>'
    + (admin ? '<label class="chk" style="margin-top:12px"><input type="checkbox" data-thl="1" ' + (e.lock || (S.settings.ui && S.settings.ui.lock) ? 'checked' : '') + '> 🔒 قفل القالب: يمنع المستخدمين من تغييره (يُطبَّق مع التصدير التالي)</label>' : '') + '<p class="small">الشعار وكل الميزات واحدة في القوالب الثلاثة. صفحات الخطة (الورقة التي تُطبع وتُصدَّر) تبقى بيضاء في كل القوالب.</p>';
}
var SBG; try { SBG = JSON.parse(localStorage.getItem('hissa_sbg') || '{"tools":1,"bak":1}'); } catch (e) { SBG = { tools: 1, bak: 1 }; }
function sbc(k) { return SBG[k] === 0 ? ' closed' : ''; }
Object.assign(A, {
  themeToggle: function () { S.settings.ui = S.settings.ui || {}; var o = ['glass', 'linear', 'legacy']; S.settings.ui.theme = o[(o.indexOf(themeCur()) + 1) % 3]; saveSettings(); applyTheme(); header(); render(); toast('المظهر: ' + themeName(themeCur())); },
  sbg: function (k) { SBG[k] = SBG[k] === 0 ? 1 : 0; try { localStorage.setItem('hissa_sbg', JSON.stringify(SBG)); } catch (e) { } var g = document.querySelector('.sbg[data-g="' + k + '"]'); if (g) { g.classList.toggle('closed', SBG[k] === 0); g.querySelector('.sbh').setAttribute('aria-expanded', SBG[k] === 0 ? 'false' : 'true'); } },
  mx: function (v, el) { var r = el && el.closest ? el.closest('.mxrow') : document.querySelector('.mxrow'); if (!r) return; var o = r.classList.toggle('mxopen'); var b = r.querySelector('.mxb'); if (b) b.setAttribute('aria-expanded', o ? 'true' : 'false'); }
});
document.addEventListener('change', function (e) {
  var t = e.target, ds = t && t.dataset; if (!ds) return;
  if (ds.thm !== undefined) { S.settings.ui = S.settings.ui || {}; if (t.value === '') delete S.settings.ui.theme; else S.settings.ui.theme = t.value; saveSettings(); applyTheme(); header(); render(); }
  else if (ds.thl !== undefined && S.mode === 'admin') { S.settings.ui = S.settings.ui || {}; S.settings.ui.lock = !!t.checked; saveSettings(); main(); toast(t.checked ? 'سيُقفل القالب على المستخدمين مع التصدير التالي' : 'أُلغي قفل القالب'); }
});
