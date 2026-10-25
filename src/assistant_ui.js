// ================= dt/hamed — واجهة المساعد (تُدمج داخل app.js عند /*ASSISTUI*/ لتشارك الحالة والتخزين)
// الاعتماد (mintApproval) يصدر من نقرة «اعتماد» هنا فقط، ولا يمرّ أبداً عبر النموذج. التنفيذ يمرّ بالتحقق ثم بنسخة «قبل التعديل» ثم الحفظ.
var A_ = window.DTHamed;
var DT = { open: false, msgs: [], queue: [], prop: null, busy: false, code: undefined, draft: '', reqText: '', asked: false };
var DT_CHIPS = [['🔁 استبدال صنف', 'استبدل الأرز في الغداء'], ['🥛 خفض الحليب', 'قلل الحليب إلى حصة واحدة كاملة الدسم'], ['🎲 تنويع الخطة', 'نوّع الأصناف', 1], ['🗓 خطة أسبوعية', 'أنشئ خطة أسبوعية', 1], ['↩ تراجع', 'تراجع', 1], ['🔍 ما الذي تغيّر؟', 'ما الذي تغير', 1], ['📜 السجل', '@history', 1]];
function dtAI() { var a = eff().ai || {}; return { enabled: !!(a.enabled && /^https:\/\//i.test(a.url || '')), url: a.url || '', consent: !!S.aiConsent }; }
function dtSes() { var c = cur(); return c ? { client: ec(c), plan: c.plan } : null; }
function dtEsc(s) { return esc(String(s == null ? '' : s)); }
function dtShort(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function dtEnsure() {
  var c = cur(); if (!document.getElementById('dtfab')) { var b = document.createElement('button'); b.id = 'dtfab'; b.className = 'dtfab noprint'; b.setAttribute('data-a', 'dtToggle'); b.setAttribute('aria-label', 'فتح المساعد dt/hamed'); b.title = 'المساعد dt/hamed'; b.innerHTML = '<img class="dtav" src="' + window.DT_ICON + '" alt=""><span>المساعد</span>'; document.body.appendChild(b); var p = document.createElement('div'); p.id = 'dtp'; p.className = 'dtp noprint'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'المساعد dt/hamed'); document.body.appendChild(p); }
  var code = c ? c.code : null; if (DT.code !== code) { DT.code = code; DT.prop = null; DT.queue = []; DT.msgs = []; DT.msgs.push({ r: 'b', t: 'أنا dt/hamed، مساعدك داخل «حصة». اكتب طلبك بالعربية أو اختر زراً. أقترح وأعرض الفروق قبل أي تنفيذ، ولا أغيّر الخطة إلا بعد أن تعتمد أنت.' + (c ? '' : ' افتح عميلاً لأبدأ.') }); } dtRender();
}
function dtMsg(r, t, cls) { DT.msgs.push({ r: r, t: t, cls: cls || '' }); if (DT.msgs.length > 80) DT.msgs.shift(); dtRender(); var m = document.getElementById('dtmsgs'); if (m) m.scrollTop = m.scrollHeight; }
function dtIssues(list) {
  var by = { blocking: [], warn: [], info: [] }; (list || []).forEach(function (i) { (by[i.severity] || by.info).push(i); }); var out = '';
  [['blocking', 'dt-bl', '⛔ يحتاج قراراً أو مراجعة'], ['warn', 'dt-wn', '⚠ تنبيهات'], ['info', 'dt-in', 'ℹ معلومات (قواعد معتمدة بمصادرها)']].forEach(function (k) { var a = by[k[0]]; if (!a.length) return; out += '<div class="dtiss ' + k[1] + '"><b>' + k[2] + '</b><ul>' + a.slice(0, 8).map(function (i) { return '<li>' + dtEsc(i.message_ar) + '</li>'; }).join('') + (a.length > 8 ? '<li>… و' + (a.length - 8) + ' أخرى</li>' : '') + '</ul></div>'; }); return out;
}
function dtDaysTable(days) {
  if (!days || !days.length) return ''; var f = function (b, a) { return b == null ? '<b>' + a + '</b>' : (b === a ? a : b + ' ← <b>' + a + '</b>'); };
  return '<table class="dtdays"><tr><th>اليوم</th><th>كارب</th><th>بروتين</th><th>دهون</th><th>الأهداف</th></tr>' + days.map(function (d) { var b = d.before; return '<tr><td>' + dtEsc(d.name) + '</td><td>' + f(b && b.nominal[0], d.after.nominal[0]) + '</td><td>' + f(b && b.nominal[1], d.after.nominal[1]) + '</td><td>' + f(b && b.nominal[2], d.after.nominal[2]) + '</td><td>' + (d.after.okNominal ? '✔ ضمن الحدود' : '⚠ خارج الحدود') + '</td></tr>'; }).join('') + '</table><div class="small">المجاميع حسب الحصص (نظام البدائل)؛ الفعلي حسب الأصناف قد يختلف قليلاً.</div>';
}
function dtChanges(ch) {
  if (!ch || !ch.length) return ''; var byDay = {}, order = []; ch.forEach(function (x) { if (!byDay[x.dayName]) { byDay[x.dayName] = []; order.push(x.dayName); } byDay[x.dayName].push(x); }); var shown = 0, html = '<div class="dtchg">';
  order.forEach(function (dn) { if (shown >= 24) return; html += '<div class="dtday"><b>' + dtEsc(dn) + '</b>'; byDay[dn].forEach(function (x) { if (shown >= 24) return; shown++; html += '<div class="dtrow"><span class="dtslot">' + dtEsc(x.slotName) + '</span><span class="dtb">' + dtEsc(dtShort(x.before.text, 150)) + '</span><span class="dtarr">←</span><span class="dta">' + dtEsc(dtShort(x.after.text, 150)) + '</span>' + (x.rule ? '<div class="small dtrule">قاعدة معتمدة: ' + dtEsc(x.rule.src) + '</div>' : '') + '</div>'; }); html += '</div>'; });
  if (ch.length > shown) html += '<div class="small">… و' + (ch.length - shown) + ' تغييراً آخر لم يُعرض هنا.</div>'; return html + '</div>';
}
function dtCard(p) {
  var h = '<div class="dtcard"><h4>' + dtEsc(p.title_ar) + '</h4>';
  if (p.kind === 'undo') return h + '<p>' + dtEsc(p.summary_ar) + '</p><div class="dtbtns"><button data-a="dtApprove">↩ تأكيد التراجع</button><button class="sec" data-a="dtReject">إلغاء</button></div></div>';
  h += '<p>' + dtEsc(p.summary_ar) + '</p>'; if (p.partial) h += '<div class="dtiss dt-wn"><b>تنفيذ جزئي:</b> ستُنفَّذ التغييرات الممكنة فقط؛ المعوّقات المذكورة أدناه لن تُنفَّذ إلا بعد قرارك.</div>';
  h += dtIssues(p.issues) + dtChanges(p.changes) + dtDaysTable(p.days);
  if (p.suggestions && p.suggestions.length) h += '<div class="dtsug"><b>اقتراح لحل المعوّق:</b>' + p.suggestions.map(function (s, i) { return '<button class="sec sm" data-a="dtSuggest" data-v="' + i + '">' + dtEsc(s.label_ar) + '</button>'; }).join('') + '</div>';
  return h + '<div class="dtbtns">' + (p.canApply ? '<button data-a="dtApprove">✅ ' + (p.partial ? 'اعتماد الجزء الممكن' : 'اعتماد وتنفيذ') + '</button>' : '') + '<button class="sec" data-a="dtReject">❌ ' + (p.canApply ? 'رفض' : 'إغلاق') + '</button></div><div class="small">لن يتغير شيء قبل «اعتماد». تُحفظ نسخة قبل التعديل ويمكنك التراجع.</div></div>';
}
function dtRender() {
  var p = document.getElementById('dtp'); if (!p) return; var ta = document.getElementById('dtin'); if (ta) DT.draft = ta.value; var focus = ta && document.activeElement === ta; p.className = 'dtp noprint' + (DT.open ? ' open' : ''); document.getElementById('dtfab').style.display = DT.open ? 'none' : '';
  if (!DT.open) { p.innerHTML = ''; return; } var ai = dtAI(), mode = ai.enabled && ai.consent ? 'متصل بالذكاء الاصطناعي' : 'محلي بلا اتصال';
  p.innerHTML = '<div class="dth"><img class="dtav dtavh" src="' + window.DT_ICON + '" alt=""><b>dt/hamed</b><span class="dtmode" title="' + (ai.enabled ? (ai.consent ? 'يُرسَل نص طلبك بعد إزالة الهوية' : 'مفعّل من المدير؛ لم توافق بعد') : 'الفهم المحلي فقط') + '">' + mode + '</span><button class="dtx" data-a="dtToggle" aria-label="إغلاق">✕</button></div>'
    + '<div class="dtm" id="dtmsgs">' + DT.msgs.map(function (m) { var body = '<div class="dtb-' + m.r + ' ' + (m.cls || '') + '">' + (m.html ? m.html : dtEsc(m.t).replace(/\n/g, '<br>')) + '</div>'; return m.r === 'b' ? '<div class="dtrb"><img class="dtav dtavs" src="' + window.DT_ICON + '" alt="">' + body + '</div>' : body; }).join('') + (DT.busy ? '<div class="dtrb"><img class="dtav dtavs" src="' + window.DT_ICON + '" alt=""><div class="dtb-b">… أعمل على طلبك</div></div>' : '') + (DT.prop ? dtCard(DT.prop) : '') + '</div>'
    + '<div class="dtchips">' + DT_CHIPS.map(function (c, i) { return '<button class="sec sm" data-a="dtChip" data-v="' + i + '">' + c[0] + '</button>'; }).join('') + '</div>'
    + '<div class="dtin"><textarea id="dtin" rows="2" placeholder="اكتب طلبك… مثال: شيل الرز من العشاء وحط بدله صنف معتمد" ' + (DT.busy ? 'disabled' : '') + '>' + dtEsc(DT.draft) + '</textarea><button data-a="dtSendBtn" ' + (DT.busy ? 'disabled' : '') + '>إرسال</button></div>';
  var m = document.getElementById('dtmsgs'); if (m) m.scrollTop = m.scrollHeight; if (focus) { var t2 = document.getElementById('dtin'); if (t2) { t2.focus(); t2.setSelectionRange(t2.value.length, t2.value.length); } }
}
function dtConsent() {
  var ai = dtAI(); if (!ai.enabled || ai.consent || DT.asked) return Promise.resolve(); DT.asked = true;
  if (!confirm('الذكاء الاصطناعي (اختياري) يساعد على فهم الصيغ الحرة.\n\nما يُرسَل فعلاً: نص طلبك فقط، بعد إزالة اسم العميل ورقمه وبريده، مع قائمة ثابتة بأسماء الإجراءات. لا تُرسَل الخطة ولا ملف العميل ولا أي قياسات.\nالجهة: خدمة Cloudflare Workers AI عبر وسيط يملكه المدير. تقول Cloudflare في وثائقها إنها لا تستخدم محتواك لتدريب النماذج أو تحسين خدماتها.\nيمكنك سحب الموافقة في أي وقت من الإعدادات.\n\nهل توافق؟ (إن رفضت يعمل المساعد بالفهم المحلي فقط)')) return Promise.resolve();
  S.aiConsent = true; return dbPut('meta', { key: 'aiconsent', ok: true, at: Date.now() }).catch(function () { });
}
function dtSend(text) {
  text = String(text || '').trim(); if (!text || DT.busy) return; var c = cur(); DT.draft = ''; dtMsg('u', text); if (!c) { dtMsg('b', 'افتح عميلاً أولاً ثم أعد طلبك.', 'warn'); return; }
  if (c.kind === 'athlete' || (c.plan && c.plan.kind === 'athlete')) { dtMsg('b', 'dt/hamed يدعم حالياً عملاء «نظام الحصص والبدائل» فقط. عملاء الرياضيين (نظام الجرامات) لا يدعمهم بعد، ولن أغيّر شيئاً في خطته.', 'warn'); return; }
  if (text === '@history') { dtHistory(); return; } DT.busy = true; DT.reqText = text; dtRender();
  dtConsent().then(function () { var ai = dtAI(), ses = dtSes(); A_.bind(E, D); return Promise.resolve(ai.enabled && ai.consent && CFG.aiToken ? CFG.aiToken() : null).then(function (tok) { return A_.interpret(text, ses, { ai: ai.enabled ? { url: ai.url, token: tok, consent: ai.consent, timeoutMs: 12000 } : null, online: navigator.onLine !== false }); }); })
    .then(function (r) { DT.busy = false; dtHandle(r); }).catch(function (e) { DT.busy = false; dtMsg('b', 'تعذّر فهم الطلب: ' + (e && e.message || e) + '. لم يتغير شيء.', 'err'); });
}
function dtHandle(r) {
  if (r.notice_ar) dtMsg('b', r.notice_ar, 'warn'); if (r.clarify_ar) { dtMsg('b', r.clarify_ar); return; } if (r.message_ar && !(r.actions && r.actions.length)) { dtMsg('b', r.message_ar, 'warn'); return; }
  var cf = A_.checkConflicts(r.actions); if (cf.conflict) { dtMsg('b', cf.clarify_ar); return; } DT.queue = r.actions.slice(); dtNext();
}
function dtNext() {
  if (!DT.queue.length) { dtRender(); return; } var a = DT.queue.shift(); A_.bind(E, D);
  if (a.type === 'undo') { dtUndoCard(); return; } if (a.type === 'show_diff') { dtDiff(); return; }
  var p = A_.propose(a, dtSes()); if (!p.ok) { dtMsg('b', p.message_ar, 'err'); DT.queue = []; return; }
  if (p.kind === 'info') { var iss = (p.issues || []).filter(function (i) { return i.severity !== 'info' || p.noChange; }).slice(0, 6).map(function (i) { return '• ' + i.message_ar; }).join('\n'); dtMsg('b', p.title_ar + '\n' + p.summary_ar + (iss ? '\n' + iss : ''), p.status === 'NO_APPROVED_RULES' || p.status === 'NO_UNSUPPORTED_CLAIMS' ? 'warn' : ''); if (p.suggestions && p.suggestions.length) { DT.prop = p; dtRender(); return; } dtNext(); return; }
  DT.prop = p; dtRender();
}
function dtAudit(c) { return dbAll('versions').then(function (vs) { return vs.filter(function (v) { return v.code === c.code && v.ast; }).sort(function (a, b) { return b.at - a.at; }); }); }
function dtApprove() {
  var p = DT.prop, c = cur(); if (!p || !c || DT.busy) return;
  if (p.kind === 'undo') { DT.busy = true; dtRender(); var v = p.ver, cp = JSON.parse(JSON.stringify(c.plan)); dbPut('versions', { code: c.code, at: Date.now(), note: 'dt/hamed — قبل التراجع عن: ' + p.title_ar, plan: cp, client: ec(c) }).then(function () { c.plan = JSON.parse(JSON.stringify(v.plan)); c.updated = Date.now(); return dbPut('clients', c); }).then(function () { v.ast.undone = true; v.ast.undoneAt = Date.now(); return dbPut('versions', v); }).then(function () { DT.prop = null; DT.busy = false; render(); dtMsg('b', 'تم التراجع: أُعيدت الخطة إلى ما قبل «' + v.ast.title_ar + '». حُفظت الخطة السابقة كإصدار.', 'ok'); }).catch(function (e) { DT.busy = false; dtMsg('b', 'تعذّر التراجع: ' + (e && e.message || e), 'err'); }); return; }
  var ses = dtSes(), ap = A_.mintApproval(p), res = A_.apply(p, ses, ap); if (!res.ok) { DT.prop = null; dtMsg('b', res.message_ar + ' لم يتغير شيء.', 'err'); return; }
  var before = JSON.parse(JSON.stringify(c.plan)), au = A_.auditEntry(p, DT.reqText, ap, before, res.plan); DT.busy = true; dtRender();
  dbPut('versions', { code: c.code, at: Date.now(), note: 'dt/hamed — قبل: ' + p.title_ar, plan: before, client: ec(c), ast: au })        // 1) نسخة قبل التعديل مع سجل التدقيق
    .then(function () { c.plan = res.plan; c.updated = Date.now(); return dbPut('clients', c); })                                           // 2) الحفظ الفعلي (يُكتشف فشله)
    .then(function () { DT.prop = null; DT.busy = false; render(); dtMsg('b', '✅ نُفِّذ: ' + p.title_ar + '. حفظتُ نسخة قبل التعديل ويمكنك التراجع بزر «↩ تراجع».' + (p.issues.some(function (i) { return i.severity === 'warn'; }) ? '\nراجع التنبيهات التي ظهرت في المعاينة.' : ''), 'ok'); dtNext(); })
    .catch(function (e) { DT.busy = false; c.plan = before; dtMsg('b', 'تعذّر الحفظ فلم تُعتمد أي نتيجة: ' + (e && e.message || e), 'err'); });
}
function dtReject() { var p = DT.prop; DT.prop = null; DT.queue = []; dtMsg('b', p && p.canApply ? 'تم الرفض. لم أغيّر شيئاً في الخطة.' : 'تم الإغلاق.'); }
function dtUndoCard() {
  var c = cur(); if (!c) return; dtAudit(c).then(function (vs) { var v = vs.filter(function (x) { return !x.ast.undone; })[0]; if (!v) { dtMsg('b', 'لا توجد عمليات نفّذها dt/hamed على هذا العميل للتراجع عنها.'); return; } var n = A_.diffPlans(v.plan, c.plan).lines.length; DT.prop = { kind: 'undo', ver: v, title_ar: v.ast.title_ar, summary_ar: 'سأعيد الخطة إلى حالتها قبل «' + v.ast.title_ar + '» (بتاريخ ' + new Date(v.at).toLocaleString('ar') + '). الفروق الحالية بين الخطتين: ' + n + ' وجبة. أي تعديل يدوي لاحق سيُحفظ كإصدار قبل التراجع.' }; dtRender(); });
}
function dtDiff() {
  var c = cur(); if (!c || !c.plan) { dtMsg('b', 'لا توجد خطة.'); return; } dtAudit(c).then(function (vs) { var v = vs[0]; if (!v) { dtMsg('b', 'لم ينفّذ dt/hamed أي تغيير على هذا العميل بعد.'); return; } var d = A_.diffPlans(v.plan, c.plan); if (!d.lines.length) { dtMsg('b', 'لا فرق بين الخطة الحالية وما قبل «' + v.ast.title_ar + '».'); return; }
    var h = '<b>الفروق منذ «' + dtEsc(v.ast.title_ar) + '»</b>' + d.lines.slice(0, 20).map(function (l) { return '<div class="dtrow"><span class="dtslot">' + dtEsc(l.dayName) + ' — ' + dtEsc(l.slotName) + '</span><span class="dtb">' + dtEsc(l.removed.map(function (x) { return x.text; }).join(' + ')) + '</span><span class="dtarr">←</span><span class="dta">' + dtEsc(l.added.map(function (x) { return x.text; }).join(' + ')) + '</span></div>'; }).join('') + (d.lines.length > 20 ? '<div class="small">… و' + (d.lines.length - 20) + ' أخرى</div>' : '') + dtDaysTable(d.days); DT.msgs.push({ r: 'b', html: h }); dtRender(); });
}
function dtHistory() {
  var c = cur(); if (!c) return; dtAudit(c).then(function (vs) { if (!vs.length) { dtMsg('b', 'لا سجل بعد: لم ينفّذ dt/hamed أي تغيير على هذا العميل.'); return; } dtMsg('b', 'آخر العمليات (الأحدث أولاً):\n' + vs.slice(0, 8).map(function (v) { return '• ' + new Date(v.at).toLocaleString('ar') + ' — ' + v.ast.title_ar + (v.ast.undone ? ' (تم التراجع)' : '') + ' — طلبك: «' + dtShort(v.ast.request.text, 50) + '»'; }).join('\n')); });
}
Object.assign(A, {
  dtToggle: function () { DT.open = !DT.open; dtRender(); if (DT.open) setTimeout(function () { var t = document.getElementById('dtin'); if (t) t.focus(); }, 50); },
  dtSendBtn: function () { var t = document.getElementById('dtin'); dtSend(t ? t.value : ''); }, dtApprove: dtApprove, dtReject: dtReject,
  dtChip: function (v) { var c = DT_CHIPS[+v]; if (c[2]) dtSend(c[1]); else { DT.draft = c[1]; dtRender(); var t = document.getElementById('dtin'); if (t) t.focus(); } },
  dtSuggest: function (v) { var p = DT.prop; if (!p || !p.suggestions || !p.suggestions[+v]) return; var a = p.suggestions[+v].action; DT.prop = null; DT.queue = []; DT.reqText = 'اقتراح dt/hamed: ' + p.suggestions[+v].label_ar; A_.bind(E, D); var q = A_.propose(a, dtSes()); if (!q.ok) { dtMsg('b', q.message_ar, 'err'); return; } if (q.kind === 'info') { dtMsg('b', q.title_ar + ': ' + q.summary_ar); return; } DT.prop = q; dtRender(); },
  dtConsentOn: function () { S.aiConsent = true; dbPut('meta', { key: 'aiconsent', ok: true, at: Date.now() }).then(function () { toast('تمت الموافقة على إرسال نص الطلب (بعد إزالة الهوية)'); main(); }); },
  dtConsentOff: function () { S.aiConsent = false; dbPut('meta', { key: 'aiconsent', ok: false, at: Date.now() }).then(function () { toast('سُحبت الموافقة: المساعد محلي فقط'); main(); }); },
  dtCopyPub: function () { var pub = window.HAdminUI && window.HAD && window.HAD.auth && window.HAD.auth.pub; var txt = JSON.stringify(pub || window.ADMIN_PUB || {}); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('نُسخ مفتاح التحقق العام'); }, function () { prompt('انسخ هذا النص:', txt); }); },
  dtTestAI: function () {
    var ai = dtAI(); if (!ai.enabled) { toast('أدخل رابط الوسيط (https) وفعّل الخيار أولاً'); return; } var el = document.getElementById('dtTestOut'); if (el) el.textContent = '… جارٍ الاختبار'; A_.bind(E, D);
    Promise.resolve(CFG.aiToken ? CFG.aiToken() : null).then(function (tok) { return A_.remote.call({ url: ai.url, token: tok, consent: true, timeoutMs: 15000 }, 'نوّع الأصناف', dtSes() || { client: {}, plan: null }); }).then(function (r) { if (el) el.textContent = r.ok ? '✔ الوسيط يعمل: فهم الطلب كإجراء «' + r.actions.map(function (x) { return x.type; }).join('، ') + '».' : '✘ ' + r.message_ar; });
  }
});
document.addEventListener('keydown', function (e) { if (e.target && e.target.id === 'dtin' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); A.dtSendBtn(); } if (e.key === 'Escape' && DT.open) { DT.open = false; dtRender(); } });
// ---- تبويب الإعدادات «🤖 dt/hamed»
function dtSettingsPage() {
  var a = eff().ai || {}, ai = dtAI(), admin = S.mode === 'admin', mine = S.settings.ai || {}, sample = (function () { A_.bind(E, D); return JSON.stringify(A_.remote.payload('مثال: استبدل الرز في العشاء', { client: {} }), null, 1); })();
  return '<p class="small">dt/hamed مساعد داخل التطبيق يفهم طلباتك ويقترح تعديلات على الخطة. <b>يعمل دائماً محلياً</b> بلا إنترنت (صيغ عربية شائعة وأزرار سريعة). الاتصال بالذكاء الاصطناعي اختياري لفهم الصيغ الحرة، ولا يؤثر على بقية وظائف التطبيق إن انقطع.</p>'
    + '<div class="addbox"><b>مبدأ العمل:</b> النموذج يفهم الطلب فقط ويُنتج إجراءً من قائمة محدودة؛ <b>محرك التطبيق</b> يتحقق ويحسب الحصص والمجاميع؛ وأنت تعتمد قبل أي تغيير. لا يخترع أصنافاً ولا قيماً غذائية ولا مراجع، وفي الحالات المرضية لا يطبّق إلا القواعد المعتمدة بمصادرها (' + D.rules.length + ' قاعدة: الغدة الدرقية، السكري/مقاومة الإنسولين، لو فودماب).</div>'
    + (admin ? '<h3>إعداد الاتصال (للمدير)</h3><div class="addbox"><label class="chk"><input type="checkbox" data-ai="enabled" ' + (mine.enabled ? 'checked' : '') + '> تفعيل الاتصال بالذكاء الاصطناعي لهذا النظام (ينتقل للمستخدمين مع «تصدير نسخة المستخدمين»)</label><label>رابط الوسيط (Cloudflare Worker) — يبدأ بـ https://</label><input data-ai="url" dir="ltr" placeholder="https://dt-hamed-proxy.اسم-حسابك.workers.dev" value="' + dtEsc(mine.url || '') + '"><p><button class="sec sm" data-a="dtCopyPub">نسخ مفتاح التحقق العام (يُلصق في إعدادات الوسيط)</button> <button class="sec sm" data-a="dtTestAI">اختبار الاتصال</button> <span id="dtTestOut" class="small"></span></p><p class="small">خطوات التركيب لغير المبرمج في الملف <b>worker/AI_SETUP_AR.md</b>. لا يوجد أي مفتاح سري: الوسيط يتحقق من كود تفعيل المستخدم الموقَّع بمفتاحك.</p></div>' : '')
    + '<h3>الخصوصية وموافقتك</h3><div class="addbox"><p>الحالة: <b>' + (ai.enabled ? (ai.consent ? 'مفعّل وموافق عليه' : 'مفعّل من المدير، ولم توافق بعد') : 'غير مفعّل (المساعد محلي فقط)') + '</b></p>'
    + (ai.enabled ? (ai.consent ? '<button class="r sm" data-a="dtConsentOff">سحب الموافقة</button>' : '<button class="sm" data-a="dtConsentOn">أوافق على إرسال نص الطلب (بعد إزالة الهوية)</button>') : '')
    + '<p class="small"><b>ما يُرسَل فعلاً عند تفعيل الاتصال</b> (هذا هو الشكل الدقيق للرسالة، والنص يُستبدل بطلبك بعد إزالة اسم العميل ورقمه وبريده):</p><pre dir="ltr" class="dtpre">' + dtEsc(sample) + '</pre><ul class="small"><li>لا تُرسَل الخطة ولا ملف العميل ولا القياسات ولا الحالات الصحية.</li><li>المزوّد: Cloudflare Workers AI. تذكر وثائق Cloudflare (أكتوبر 2026) أنها لا تستخدم محتواك لتدريب النماذج أو تحسين خدماتها؛ والنماذج طرف ثالث بتراخيصها.</li><li>لم أستعمل Gemini API: شروطه الرسمية تمنع الاستعمال السريري أو لتقديم نصيحة طبية، وطبقته المجانية قد تُقرأ المحتوى بشرياً.</li><li>الحصة المجانية: 10,000 «نيورون» يومياً (تُجدَّد 00:00 UTC) وتتوقف الطلبات عند النفاد دون فوترة؛ يعود التطبيق للفهم المحلي تلقائياً.</li></ul></div>';
}
document.addEventListener('change', function (e) {
  var t = e.target; if (!(t.dataset && t.dataset.ai) || S.mode !== 'admin') return; var a = S.settings.ai = S.settings.ai || {}, k = t.dataset.ai;
  if (k === 'enabled') { a.enabled = t.checked; if (a.enabled && !/^https:\/\//i.test(a.url || '')) toast('أدخل رابط الوسيط (https) ليعمل الاتصال'); } else if (k === 'url') { var v = t.value.trim(); if (v && !/^https:\/\/[^\s]+$/i.test(v)) { toast('الرابط يجب أن يبدأ بـ https:// ولا يحوي مسافات'); t.value = a.url || ''; return; } if (v) a.url = v.replace(/\/+$/, ''); else delete a.url; }
  saveSettings(); main();
});
