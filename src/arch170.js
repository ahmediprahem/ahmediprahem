// ================= 1.70 (م2) «خطة جديدة» مدخل واحد + أرشيف الخطط — docs/work_plan_168.md (ب)، docs/flow_plan_167.md (③)
// 1) الأرشيف بلا تغيير في قاعدة البيانات: في مخزن versions نفسه (مشفّر بمفتاح الجهاز، وفي نسخة «حماية البيانات»):
//    - سجل صغير kind:'arch' (التاريخ، السعرات، السبب) برمز العميل c.code فيظهر في «سجل الخطط».
//    - صفحة الخطة مضغوطة gzip في سجل منفصل kind:'archp' برمز 'pg:'+c.code فلا تُقرأ إلا عند «فتح» (تُربط بالتاريخ at لا بالمعرّف، فتصمد بعد الاسترجاع).
//    يُحفظ تلقائياً عند الإرسال إلى «زنها» وعند PDF/Word/HTML (والخطة نفسها لا تُكرَّر: يُضاف السبب للسجل الأخير).
// 2) فتح العميل يقرأ سجلاته فقط عبر الفهرس code (كان يفك تشفير إصدارات كل العملاء).
// 3) «كيف تبدأ؟»: كل مداخل «أنشئ الخطة» و«نافذة الأخصائي» تفتح شاشة اختيار واحدة، وكل خيار يستدعي الوظيفة الموجودة كما هي (لا يتغير أي حساب).
var AR170 = { busy: 0 };
loadVersions = function () {
  var c = cur(); if (!c || !c.code) { S.versions = []; return Promise.resolve(); }
  return tx('versions', 'readonly', function (s) { return s.index('code').getAll(c.code); })
    .then(function (rs) { return Promise.all((rs || []).map(function (r) { return decRec('versions', r).catch(function () { return null; }); })); })
    .then(function (v) { S.versions = v.filter(Boolean).sort(function (a, b) { return b.at - a.at; }); })
    .catch(function () { return dbAll('versions').then(function (v) { S.versions = v.filter(function (x) { return x.code === c.code; }).sort(function (a, b) { return b.at - a.at; }); }); });
};
function arB64(u8) { var s = '', i, n = 0x8000; for (i = 0; i < u8.length; i += n) s += String.fromCharCode.apply(null, u8.subarray(i, i + n)); return btoa(s); }
function arU8(b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function arZip(str) {
  if (!window.CompressionStream) return Promise.resolve({ raw: str });
  return new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer().then(function (b) { return { gz: arB64(new Uint8Array(b)) }; });
}
function arUnzip(o) {
  if (o.raw != null) return Promise.resolve(o.raw); if (!window.DecompressionStream) return Promise.reject(new Error('المتصفح لا يدعم فك الضغط'));
  return new Response(new Blob([arU8(o.gz)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
function arKcal(p) { try { var t = p && (p.targets || p.target); return Math.round((t && (t.kcal || t.energy)) || 0); } catch (e) { return 0; } }
function arHash(p) { var s = JSON.stringify(p || {}), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; }
var AR_WHY = { send: 'أُرسلت إلى «زنها»', print: 'PDF', docx: 'Word', html: 'صفحة HTML', manual: 'حفظ يدوي' };
function arSave(c, why) {      // يحفظ نسخة مؤرخة من الخطة الحالية (لا يغيّر الخطة)
  if (!c || !c.plan || !c.plan.days || AR170.busy) return Promise.resolve(null);
  var h = arHash(c.plan), last = (S.versions || []).filter(function (v) { return v.kind === 'arch' && v.code === c.code; })[0];
  if (last && last.h === h) { if (last.why.indexOf(why) < 0) { last.why.push(why); return dbPut('versions', last).then(function () { return last; }); } return Promise.resolve(last); }
  var body; try { body = c.kind === 'athlete' ? athAll(c, c.plan, false) : allPages(c, c.plan, false); } catch (e) { return Promise.resolve(null); }
  var at = Date.now(), meta = { code: c.code, at: at, kind: 'arch', why: [why], h: h, kcal: arKcal(c.plan), w: +c.weight || 0, name: c.name || '', days: c.plan.days.length, note: '' };
  AR170.busy = 1;
  return arZip(JSON.stringify({ html: body, plan: c.plan, client: typeof ec === 'function' ? ec(c) : null })).then(function (z) {
    return dbPut('versions', Object.assign({ code: 'pg:' + c.code, at: at, kind: 'archp' }, z));
  }).then(function () { return dbPut('versions', meta); }).then(function () { AR170.busy = 0; return S.cur === c.code ? loadVersions() : null; }).then(function () { return meta; })
    .catch(function (e) { AR170.busy = 0; return null; });
}
function arPage(code, at) {
  return tx('versions', 'readonly', function (s) { return s.index('code').getAll('pg:' + code); })
    .then(function (rs) { return Promise.all((rs || []).map(function (r) { return decRec('versions', r).catch(function () { return null; }); })); })
    .then(function (a) { var p = a.filter(function (x) { return x && x.at === at; })[0]; if (!p) throw new Error('لم تُوجد صفحة هذه الخطة'); return arUnzip(p); })
    .then(function (s) { return JSON.parse(s); });
}
function arDate(t) { try { return new Date(t).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
function arDoc(m, d) {
  var css = (document.querySelector('style') || {}).textContent || '';
  return '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>خطة ' + esc(m.name) + ' — ' + esc(arDate(m.at)) + '</title><style>' + css
    + '.arbar{position:sticky;top:0;z-index:9;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;background:#E6F6F1;border-bottom:1px solid #BFE5D8;padding:10px 16px;font:15px/1.6 inherit}.arbar b{color:#0E5F55}@media print{.arbar{display:none}}</style>'
    + '<body><div class="arbar" role="banner"><span><b>أرشيف الخطط</b> • ' + esc(m.name) + ' • ' + esc(arDate(m.at)) + (m.kcal ? ' • ' + m.kcal + ' سعرة' : '') + ' • ' + esc((m.why || []).map(function (k) { return AR_WHY[k] || k; }).join('، ')) + '</span><button onclick="print()">طباعة / PDF</button></div><main style="max-width:980px;margin:auto">' + d.html + '</main></body></html>';
}
function arList(c) {
  var L = (S.versions || []).filter(function (v) { return v.kind === 'arch'; });
  var rows = L.map(function (m, i) {
    return '<li class="ar170r"><span class="ardot" aria-hidden="true"></span><div class="arm"><b>' + esc(arDate(m.at)) + ' <small class="artm">' + esc(new Date(m.at).toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' })) + '</small>' + (i === 0 ? ' <em class="arnow">الأحدث</em>' : '') + '</b><small>' + [m.kcal ? m.kcal + ' سعرة' : '', m.days ? m.days + ' أيام' : '', m.w ? 'وزن ' + num(m.w) + ' كجم' : '', (m.why || []).map(function (k) { return AR_WHY[k] || k; }).join('، ')].filter(Boolean).join(' • ') + '</small></div>'
      + '<div class="ara"><button class="sec sm" data-a="arOpen" data-v="' + m.at + '">فتح</button><button class="sec sm" data-a="arUse" data-v="' + m.at + '">ابدأ من هذه الخطة</button><button class="r sm" data-a="arDel" data-v="' + m.at + '" aria-label="حذف خطة ' + esc(arDate(m.at)) + '">×</button></div></li>';
  }).join('');
  return '<section class="ar170"><div class="arhd"><h3>سجل الخطط</h3>' + (c.plan ? '<button class="sm" data-a="arSnap">حفظ نسخة الآن</button>' : '') + '</div>'
    + (rows ? '<ol class="ar170l">' + rows + '</ol>' : '<p class="small">تُحفظ هنا نسخة مؤرخة من الخطة تلقائياً عند إرسالها إلى «زنها» أو تصديرها PDF أو Word، وتفتح صفحةً مستقلة للقراءة والطباعة.</p>') + '</section>';
}
verTab = (function (f) { return function (c) {
  var all = S.versions || [], ar = all.filter(function (v) { return v.kind === 'arch'; }); S.versions = all.filter(function (v) { return v.kind !== 'arch'; });
  var h; try { h = f.apply(this, arguments); } finally { S.versions = all; }
  return arList(c) + (all.length > ar.length ? '<h3 class="arold">الإصدارات المحفوظة سابقاً</h3>' + h : '');      // «حفظ نسخة الآن» يغني عن «حفظ إصدار»؛ الإصدارات القديمة تبقى ظاهرة كما هي
}; })(verTab);
A.arSnap = function () { var c = cur(); arSave(c, 'manual').then(function (m) { toast(m ? '✓ حُفظت نسخة مؤرخة في سجل الخطط' : 'تعذّر حفظ النسخة'); main(); }); };
A.arOpen = function (v) {
  var c = cur(), m = (S.versions || []).filter(function (x) { return x.kind === 'arch' && x.at === +v; })[0]; if (!c || !m) return;
  var w = window.open('', '_blank');
  arPage(c.code, m.at).then(function (d) { var doc = arDoc(m, d); if (w) { w.document.open(); w.document.write(doc); w.document.close(); } else dlFile(new Blob([doc], { type: 'text/html' }), 'خطة_' + fileBase(c) + '_' + new Date(m.at).toISOString().slice(0, 10) + '.html'); })
    .catch(function (e) { if (w) w.close(); toast('تعذّر فتح الخطة: ' + e.message); });
};
A.arUse = function (v) {
  var c = cur(), m = (S.versions || []).filter(function (x) { return x.kind === 'arch' && x.at === +v; })[0]; if (!c || !m) return;
  if (!confirm('تبدأ من خطة ' + arDate(m.at) + '؟ تُحفظ الخطة الحالية في السجل أولاً.')) return;
  arSave(c, 'manual').then(function () { return arPage(c.code, m.at); }).then(function (d) { c.plan = d.plan; save(); S.tab = 'gen'; var g = genOf(c); g.step = 4; save(); render(); toast('✓ بدأت من خطة ' + arDate(m.at) + '، عدّلها ثم أرسلها'); })
    .catch(function (e) { toast('تعذّر: ' + e.message); });
};
A.arDel = function (v) {
  var c = cur(), at = +v, m = (S.versions || []).filter(function (x) { return x.kind === 'arch' && x.at === at; })[0]; if (!c || !m || !confirm('حذف خطة ' + arDate(at) + ' من السجل؟')) return;
  tx('versions', 'readonly', function (s) { return s.index('code').getAllKeys('pg:' + c.code); }).then(function (ks) {
    return Promise.all((ks || []).map(function (k) { return tx('versions', 'readonly', function (s) { return s.get(k); }).then(function (r) { return decRec('versions', r); }).then(function (p) { return p && p.at === at ? dbDel('versions', k) : null; }); }));
  }).then(function () { return dbDel('versions', m.id); }).then(loadVersions).then(main);
};
// الحفظ التلقائي: الإرسال إلى «زنها» وPDF وWord وHTML (لا يغيّر سلوكها؛ النسخة تُحفظ بعدها)
['print', 'docx', 'html', 'hxSendPlan'].forEach(function (k) { var f = A[k]; if (typeof f !== 'function') return; A[k] = function () { var c = cur(), r = f.apply(this, arguments); try { if (c && c.plan) setTimeout(function () { arSave(c, k === 'hxSendPlan' ? 'send' : k); }, 300); } catch (e) { } return r; }; });
// حذف العميل يحذف صفحات أرشيفه أيضاً
A.del = (function (f) { return function () { var c = cur(), r = f.apply(this, arguments); if (c && S.clients.indexOf(c) < 0) tx('versions', 'readonly', function (s) { return s.index('code').getAllKeys('pg:' + c.code); }).then(function (ks) { (ks || []).forEach(function (k) { dbDel('versions', k); }); }).catch(function () { }); return r; }; })(A.del);
// ---------- «كيف تبدأ؟»
function st170(c) {
  var ath = !!(c && c.kind === 'athlete'), has = !!(c && c.plan && c.plan.days), last = (S.versions || []).filter(function (v) { return v.kind === 'arch'; })[0];
  var o = [['auto', 'sparkles', 'تلقائي بالمحرك', 'من احتياج العميل وتفضيلاته — الأنسب لأغلب العملاء', 1],
    ['lib', 'layers', 'من نظام في المكتبة', ath ? 'لنظام الحصص فقط' : 'اختر من الأنظمة الثلاثين وعدّل السعرات والحصص', !ath],
    ['ready', 'book', 'من خطة جاهزة', ath ? 'لنظام الحصص فقط' : 'خطط البنك وقوالبك' + (c && c.hx && c.hx.quiz ? '، واختيار العميل في «زنها»' : ''), !ath],
    ['copy', 'repeat', 'انسخ الخطة السابقة وعدّلها', has ? 'للأسبوع الجديد: تبدأ من خطته الحالية' + (last ? ' (المحفوظة ' + arDate(last.at) + ')' : '') : 'لا توجد خطة سابقة لهذا العميل', has]];
  return '<div class="st170" role="dialog" aria-modal="true" aria-labelledby="st170h"><div class="stcard"><div class="sthd"><h3 id="st170h">خطة جديدة — كيف تبدأ؟</h3><button class="sec sm" data-a="st170x" aria-label="إغلاق">✕</button></div>'
    + '<p class="small">كل الطرق تكمل في الخطوات نفسها: الاحتياج، ثم النظام، ثم الوجبات، ثم المراجعة والإرسال.</p><div class="stgrid">'
    + o.map(function (x, i) { return '<button class="stopt' + (i === 0 ? ' def' : '') + '" data-a="st170go" data-v="' + x[0] + '"' + (x[4] ? '' : ' disabled') + '><span class="stic">' + IC(x[1]) + '</span><b>' + x[2] + '</b><small>' + esc(x[3]) + '</small></button>'; }).join('')
    + '</div></div></div>';
}
A.newPlan = function () { var c = cur(); if (!c) return; if (!c.name) { toast('اكتب اسم العميل أولاً'); return; } var d = document.querySelector('.st170'); if (d) d.remove(); document.body.insertAdjacentHTML('beforeend', st170(c)); var b = document.querySelector('.st170 .stopt.def'); if (b) b.focus(); };
A.st170x = function () { var d = document.querySelector('.st170'); if (d) d.remove(); };
A.st170go = function (v) {
  A.st170x(); var c = cur(); if (!c) return;
  if (v === 'auto') return A.genOpen(1);
  if (v === 'lib') return A.tab('pw');
  if (v === 'ready') return A.genBank ? A.genBank() : A.genOpen(1);
  if (v === 'copy') { if (!c.plan) return; arSave(c, 'manual').then(function () { genOf(c).step = 4; S.tab = 'gen'; save(); render(); window.scrollTo(0, 0); toast('✓ حُفظت الخطة السابقة في السجل — عدّل نسختها للأسبوع الجديد'); }); }
};
// كل مداخل «أنشئ الخطة» و«نافذة الأخصائي» (الأزرار) تمر بـ«كيف تبدأ؟»
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('[data-a="genOpen"][data-v="1"],[data-a="tab"][data-v="pw"]') : null; if (!b || b.closest('.st170')) return;
  var c = typeof cur === 'function' ? cur() : null; if (!c) return;
  e.preventDefault(); e.stopPropagation(); A.newPlan();
}, true);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.querySelector('.st170')) A.st170x(); });
// زر «خطة جديدة» ظاهر في رأس ملف العميل
(function () { if (window.MutationObserver) new MutationObserver(function () { var h = document.querySelector('main .cfhead'), c = typeof cur === 'function' ? cur() : null; if (!h || !c || h.querySelector('.np170')) return; var b = document.createElement('button'); b.className = 'np170'; b.setAttribute('data-a', 'newPlan'); b.innerHTML = IC('plus') + ' خطة جديدة'; h.appendChild(b); }).observe(document.documentElement, { childList: true, subtree: true }); })();
