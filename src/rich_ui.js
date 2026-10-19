// ================= تجربة عميل أغنى (المرحلة 5) — يُدمج داخل app.js عند /*RICHUI*/
// 1) الوصفات: لكل وجبة في محرر الحصص وصفة (خطوات، وقت التحضير، نصيحة، صورة) تُحفظ في S.settings.recipes وتصل مع الخطة إلى «حصتي».
//    الصورة تُضغط هنا، وتُرفع إلى المحطة عند إرسال الخطة (محتوى عام كالتثقيف)، فلا تثقل رسالة الخطة المشفّرة.
// 2) صور الوجبات: يصوّر العميل وجبته في «حصتي» (مشفّرة لك وحدك) فتظهر في تبويب «حصتي» بملفه، وتردّ بتعليق سريع يصله مع إشعار.
var RC = { edit: null, d: null }, PH_QUICK = ['👏 ممتاز، استمر', '🥗 أضف خضاراً أكثر', '⚖ قلّل الكمية قليلاً', '🍗 زِد البروتين', '💧 لا تنسَ الماء'];
function rcAll() { return S.settings.recipes || (S.settings.recipes = {}); }
function rcByMeal(name) { var b = D.bank.filter(function (x) { return x.n === name; })[0]; return b ? { id: b.id, r: rcAll()[b.id] } : null; }
function rcShrink(file) {
  return new Promise(function (res, rej) {
    var u = URL.createObjectURL(file), im = new Image();
    im.onload = function () { var k = Math.min(1, 800 / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); var g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); res({ url: cv.toDataURL('image/jpeg', 0.75), w: cv.width, h: cv.height }); };
    im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('ملف صورة غير صالح')); }; im.src = u;
  });
}
function rcEditor(id) {
  var d = RC.d, b = bkEff(id);
  return '<div class="ucard rced"><h3>📖 وصفة «' + esc(b ? b.n : '') + '»</h3><p class="small">تظهر للعميل في «حصتي» عند لمس الوجبة، مع مقاديره هو من خطته. اكتب كل خطوة في سطر.</p>'
    + '<div class="rcgrid"><div><label>خطوات التحضير<textarea id="rc_steps" data-rcf="steps" rows="6" placeholder="اغسل الأرز ونقّعه 20 دقيقة&#10;اطبخه بماء مغلي مع رشة ملح…">' + esc(d.steps) + '</textarea></label>'
    + '<div class="bkfl"><label>وقت التحضير (دقيقة)<input id="rc_mins" data-rcf="mins" inputmode="numeric" value="' + esc(d.mins) + '"></label><label>نصيحة<input id="rc_tip" data-rcf="tip" maxlength="200" value="' + esc(d.tip) + '" placeholder="اختياري: بدّل الزيت ببخاخ زيت"></label></div></div>'
    + '<div class="rcimg">' + (d.img ? '<img src="' + d.img + '" alt=""><button class="sec sm" data-a="rcNoImg">إزالة الصورة</button>' : '<span class="small">بلا صورة</span>') + '<label class="sec sm fdfile">📷 ' + (d.img ? 'تغيير' : 'إضافة') + ' صورة<input type="file" id="rc_file" accept="image/*" hidden></label></div></div>'
    + '<div class="bkbtns"><button data-a="rcSave">💾 حفظ الوصفة</button><button class="sec" data-a="rcEdit" data-v="">إلغاء</button>' + (rcAll()[id] ? '<button class="sec" data-a="rcDel">🗑 حذف الوصفة</button>' : '') + '</div></div>';
}
function rcUpload(rs) {                                             // صور الوصفات المستعملة في الخطة تُرفع للمحطة مرة واحدة (يُحفظ مفتاحها)
  var todo = rs.filter(function (x) { return x.r.img && !x.r.key; }); if (!todo.length) return Promise.resolve();
  return todo.reduce(function (p, x) {
    return p.then(function () { return fetch(x.r.img).then(function (r) { return r.blob(); }).then(function (bl) { return fdUpload({ blob: bl, type: 'image/jpeg', w: x.r.w || 0, h: x.r.h || 0 }); }).then(function (m) { x.r.key = m.key; }); });
  }, Promise.resolve()).then(function () { saveSettings(); });
}
function rcOfPlan(c) { var seen = {}, out = []; if (!c.plan || !c.plan.days || c.kind === 'athlete') return out; c.plan.days.forEach(function (d) { d.slots.forEach(function (s) { var n = s.mealLabel || s.meal; if (n && !seen[n]) { seen[n] = 1; var m = rcByMeal(s.meal) || rcByMeal(n); if (m && m.r) out.push({ name: n, r: m.r }); } }); }); return out; }
// ---------- صور الوجبات في ملف العميل
function phCard(c) {
  var ps = (c.hx.photos || []).slice().reverse(); if (!ps.length) return '<div class="ucard"><h3>📷 صور الوجبات</h3><p class="small">يصوّر العميل وجبته من «حصتي» («صوّر وجبتك» في بطاقة الوجبة) فتظهر هنا مشفّرة، وتردّ بتعليق سريع.</p></div>';
  return '<div class="ucard phcard"><h3>📷 صور الوجبات (' + ps.length + ')</h3><div class="phgrid">' + ps.slice(0, 24).map(function (p) {
    return '<figure class="' + (p.cm ? '' : 'new') + '"><img src="' + p.img + '" alt="صورة ' + esc(p.slot) + '" loading="lazy"><figcaption><b>' + esc(p.slot || 'وجبة') + '</b><small>' + esc(new Date(p.ts).toLocaleString('ar', { weekday: 'short', hour: '2-digit', minute: '2-digit' })) + '</small>'
      + (p.cm ? '<p class="phcm">✓ ' + esc(p.cm) + '</p>' : '<p class="phq">' + PH_QUICK.map(function (q) { return '<button class="sec sm" data-a="phCm" data-v="' + p.id + '" data-t="' + esc(q) + '">' + q + '</button>'; }).join('') + '<button class="sec sm" data-a="phCm" data-v="' + p.id + '" data-t="">✎ تعليق</button></p>') + '</figcaption></figure>';
  }).join('') + '</div></div>';
}
// ---------- الإجراءات والربط
Object.assign(A, {
  rcEdit: function (v) { if (!v || RC.edit === v) { RC.edit = null; main(); return; } var r = rcAll()[v] || {}, b = bkEff(v); RC.edit = v; if (b) BK_CATS.forEach(function (c, i) { if (b.m[i]) BK.open[c[0]] = true; });     // القسم المطوي يُفتح ليظهر المحرر
    RC.d = { steps: (r.steps || []).join('\n'), mins: r.mins || '', tip: r.tip || '', img: r.img || '', w: r.w, h: r.h }; main(); var n = $('#rc_steps'); if (n) n.focus(); },
  rcNoImg: function () { RC.d.img = ''; main(); },
  rcSave: function () {
    var d = RC.d, steps = String(d.steps || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 30), mins = +String(d.mins || '').replace(/[٠-٩]/g, function (x) { return x.charCodeAt(0) - 0x660; }) || 0, old = rcAll()[RC.edit] || {};
    if (!steps.length && !d.img) return toast('اكتب خطوة واحدة على الأقل أو أضف صورة');
    rcAll()[RC.edit] = { steps: steps.map(function (x) { return x.slice(0, 400); }), mins: Math.min(600, mins), tip: String(d.tip || '').trim().slice(0, 200), img: d.img || '', w: d.w || 0, h: d.h || 0, key: d.img && d.img === old.img ? old.key || '' : '', at: Date.now() };
    saveSettings(); RC.edit = null; main(); toast('📖 حُفظت الوصفة — تصل مع الخطة التالية التي ترسلها إلى «حصتي»');
  },
  rcDel: function () { if (!confirm('حذف الوصفة؟')) return; delete rcAll()[RC.edit]; saveSettings(); RC.edit = null; main(); },
  phCm: function (v, el) {
    var c = cur(), p = c && (c.hx.photos || []).filter(function (x) { return x.id === v; })[0], t = el.dataset.t || prompt('تعليقك على صورة الوجبة:', ''); if (!p || !t || !t.trim()) return;
    hxSend(c, { t: 'pcm', id: v, text: t.trim().slice(0, 300) }).then(function () { p.cm = t.trim().slice(0, 300); persist(c); main(); toast('✓ وصل تعليقك إلى «حصتي»'); }).catch(hxErr);
  }
});
document.addEventListener('input', function (e) { var t = e.target; if (t.dataset && t.dataset.rcf && RC.d) RC.d[t.dataset.rcf] = t.value; });
document.addEventListener('change', function (e) { var t = e.target; if (t.id !== 'rc_file' || !t.files || !t.files[0]) return; rcShrink(t.files[0]).then(function (x) { RC.d.img = x.url; RC.d.w = x.w; RC.d.h = x.h; main(); }).catch(function (er) { toast('⚠ ' + er.message); }); });
(function (f) { bkRow = function (b) { var h = f.apply(this, arguments), has = !!rcAll()[b.id]; h = h.replace('<div class="bkact">', '<div class="bkact"><button class="sec sm' + (has ? ' rcon' : '') + '" data-a="rcEdit" data-v="' + esc(b.id) + '" title="وصفة الوجبة لتطبيق العميل">📖 ' + (has ? 'الوصفة ✓' : 'وصفة') + '</button>'); return RC.edit === b.id && h.indexOf('class="rced"') < 0 ? h + rcEditor(b.id) : h; }; })(bkRow);
(function (f) { hxSnap = function (c) { var s = f.apply(this, arguments), rec = {}; rcOfPlan(c).forEach(function (x) { rec[x.name] = { steps: x.r.steps || [], mins: x.r.mins || 0, tip: x.r.tip || '', img: x.r.key || '' }; }); if (Object.keys(rec).length) s.recipes = rec; return s; }; })(hxSnap);
(function (f) { A.hxSendPlan = function () { var c = cur(), self = this, args = arguments; if (!c || !c.hx || !c.plan) return f.apply(self, args); var rs = rcOfPlan(c); if (!rs.some(function (x) { return x.r.img && !x.r.key; })) return f.apply(self, args); toast('جارٍ رفع صور الوصفات…'); return rcUpload(rs).catch(function (e) { toast('⚠ لم تُرفع صور الوصفات (' + e.message + ') — تُرسل الخطة بدونها'); }).then(function () { return f.apply(self, args); }); }; })(A.hxSendPlan);
(function (f) { hxIn = function (c, p) {
  if (p.t === 'photo' && typeof p.img === 'string' && p.img.length < 300000 && /^[A-Za-z0-9+/=]+$/.test(p.img) && p.id) {
    var x = c.hx; if ((x.photos || []).some(function (q) { return q.id === p.id; })) return 0;
    x.photos = (x.photos || []).concat([{ id: String(p.id).slice(0, 24), d: String(p.d || '').slice(0, 10), si: +p.si || 0, slot: String(p.slot || '').slice(0, 60), img: 'data:image/jpeg;base64,' + p.img, ts: p.ts || Date.now() }]).slice(-60);
    x.phNew = (x.phNew || 0) + 1; toast('📷 ' + (c.name || x.label || '') + ' أرسل صورة ' + (p.slot || 'وجبته')); return 1;
  }
  return f.apply(this, arguments); }; })(hxIn);
(function (f) { hxTab = function (c) { var h = f.apply(this, arguments); return h.replace('<div class="hxgrid">', phCard(c) + '<div class="hxgrid">'); }; })(hxTab);
(function (f) { A.hxRead = function () { var c = cur(); if (c && c.hx && c.hx.phNew) { c.hx.phNew = 0; persist(c); } return f.apply(this, arguments); }; })(A.hxRead);
(function (f) { wkItems = function () { var out = f.apply(this, arguments), hid = wkHidden(); S.clients.forEach(function (c) { var n = c.hx && c.hx.phNew; if (n && !hid[c.code + ':ph']) out.push({ c: c, pri: 1, ic: '📷', txt: n + (n === 1 ? ' صورة وجبة جديدة' : ' صور وجبات جديدة') + ' بانتظار تعليقك', tab: 'hx', key: c.code + ':ph' }); }); return out.sort(function (a, b) { return a.pri - b.pri; }); }; })(wkItems);
