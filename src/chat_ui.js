// ================= «شات زنها» في «زنها Pro» (0.91) — يُدمج داخل app.js عند /*CHATUI*/
// صفحة محادثات بتنسيق يشبه واتساب: قائمة جانبية بالعملاء وآخر رسالة وعدد غير المقروء، وخيط الرسائل بفواصل أيام وعلامات ✓/✓✓، ومربع كتابة.
// البيانات هي نفسها (c.hx.msgs) والإرسال والقراءة عبر المسار المشفّر نفسه (hxSend)، فلا شيء جديد على المحطة.
var CHT = { sel: '', q: '', stick: true, sent: 0 };
var CH_QUICK = ['أحسنت، استمر 👏', 'تذكير: اشرب الماء 💧', 'سجّل وجباتك اليوم من فضلك', 'موعدنا القادم قريب، ما موعدك المناسب؟'];
function ctDay(ts) { var d = new Date(ts), t = new Date(), y = new Date(Date.now() - 864e5), k = function (x) { return x.getFullYear() + '-' + x.getMonth() + '-' + x.getDate(); }; return k(d) === k(t) ? 'اليوم' : k(d) === k(y) ? 'أمس' : d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' }); }
function chTime(ts) { return new Date(ts).toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' }); }
function chMsgs(c) { return (c.hx && c.hx.msgs) || []; }
function chLast(c) { var m = chMsgs(c); return m[m.length - 1] || null; }
function chClients() { return S.clients.filter(function (c) { return c.hx; }); }
function chUnread() { return chClients().reduce(function (a, c) { return a + ((c.hx && c.hx.unread) || 0); }, 0); }
function chList() {
  var q = String(CHT.q || '').trim().toLowerCase(), rows = chClients().filter(function (c) { return !q || String(c.name || c.code).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { var x = chLast(a), y = chLast(b); return (y ? y.ts : 0) - (x ? x.ts : 0) || String(a.name).localeCompare(String(b.name), 'ar'); });
  return rows.map(function (c) {
    var m = chLast(c), un = (c.hx && c.hx.unread) || 0;
    return '<button class="chrow' + (CHT.sel === c.code ? ' on' : '') + '" data-a="czOpen" data-v="' + esc(c.code) + '"><span class="cav">' + esc(initial(c.name)) + '</span><span class="cht2"><b>' + esc(c.name || c.code) + '</b><small>' + (m ? (m.from === 'd' ? (m.read ? '✓✓ ' : '✓ ') : '') + esc(String(m.t || '').slice(0, 60)) : 'ابدأ المحادثة') + '</small></span><span class="chmeta">' + (m ? '<small' + (un ? ' class="un"' : '') + '>' + esc(ctDay(m.ts) === 'اليوم' ? chTime(m.ts) : ctDay(m.ts)) + '</small>' : '') + (un ? '<em class="hxnb">' + un + '</em>' : '') + '</span></button>';
  }).join('') || '<p class="small" style="padding:12px">لا عملاء مرتبطون بـ«زنها» بعد. ادعُ عميلاً من تبويب «📲 زنها» في ملفه ليظهر هنا.</p>';
}
function chThread(c) {
  var msgs = chMsgs(c), out = '', last = '';
  msgs.forEach(function (m) {
    var d = ctDay(m.ts); if (d !== last) { out += '<div class="chsep"><span>' + esc(d) + '</span></div>'; last = d; }
    out += '<div class="chb' + (m.from === 'd' ? ' me' : '') + '">' + (m.ctx ? '<small class="chcx">بخصوص: ' + esc(m.ctx) + '</small>' : '') + '<span class="cht3">' + esc(m.t).replace(/\n/g, '<br>') + '</span><small class="chtm">' + chTime(m.ts) + (m.from === 'd' ? ' <i class="' + (m.read ? 'rd' : '') + '">' + (m.read ? '✓✓' : '✓') + '</i>' : '') + '</small></div>';
  });
  return out || '<div class="empty chempty"><p class="small">لا رسائل بعد. ما يكتبه العميل من «راسل الأخصائي» يظهر هنا مع إشعار، وتستطيع أن تبدأ أنت.</p></div>';
}
function chPage() {
  var c = S.clients.filter(function (x) { return x.code === CHT.sel && x.hx; })[0];
  var side = '<div class="chl"><div class="chsearch"><input id="chQ" type="search" placeholder="ابحث عن عميل" value="' + esc(CHT.q) + '" aria-label="بحث في المحادثات"></div><div class="chrows">' + chList() + '</div></div>';
  var main = c ? '<section class="chm"><header class="chh"><button class="sec sm chback" data-a="czBack" aria-label="رجوع إلى المحادثات">›</button><span class="cav">' + esc(initial(c.name)) + '</span><div><b>' + esc(c.name || c.code) + '</b><small>' + (c.hx.sentAt ? 'خطته v' + (c.hx.planV || 1) + ' • ' : '') + 'آخر تحقق ' + hxAgo(HX.last) + '</small></div><button class="sec sm" data-a="czFile" data-v="' + esc(c.code) + '" style="margin-inline-start:auto">فتح ملفه</button></header>'
    + '<div class="chbody" id="chBody">' + chThread(c) + '</div><div class="chquick">' + CH_QUICK.map(function (q, i) { return '<button class="chip" data-a="czQuick" data-v="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div>'
    + '<div class="chcomp"><textarea id="chIn" rows="1" maxlength="2000" placeholder="اكتب رسالة…" aria-label="رسالة للعميل"></textarea><button data-a="czSend" aria-label="إرسال">➤</button></div></section>'
    : '<section class="chm chnone"><div class="empty"><p><b>شات زنها</b></p><p class="small">اختر عميلاً من القائمة لتبدأ المحادثة. كل الرسائل مشفّرة بين جوالك وجواله.</p></div></section>';
  return '<div class="chwrap' + (c ? ' open' : '') + '"><div class="hxtop"><h2>💬 شات زنها</h2><small class="small">محادثات الأخصائي مع عملائه، مشفّرة طرفاً لطرف.</small></div><div class="chgrid">' + side + main + '</div></div>';
}
function chRe(keep) { if (S.view !== 'chat') return; CHT.keep = !!keep; main(); }
function chPaint() {                                                   // رسم الصفحة مع الإبقاء على ما يكتبه الأخصائي وموضع التمرير
  var ta = $('#chIn'), v = ta ? ta.value : '', foc = ta && document.activeElement === ta, q = $('#chQ'), qv = q ? q.value : '', qf = q && document.activeElement === q, bd = $('#chBody'), atEnd = !bd || bd.scrollHeight - bd.scrollTop - bd.clientHeight < 90, top = bd ? bd.scrollTop : 0;
  $('main').innerHTML = chPage(); ta = $('#chIn'); if (ta) { ta.value = v; if (foc) ta.focus(); chGrow(ta); } q = $('#chQ'); if (q && qf) { q.value = qv; q.focus(); try { q.setSelectionRange(qv.length, qv.length); } catch (e) { } }
  bd = $('#chBody'); if (bd) bd.scrollTop = (atEnd || CHT.keep) ? bd.scrollHeight : top; CHT.keep = false;
}
function chGrow(t) { if (!t) return; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }
function chRead(c) {
  if (!c || !c.hx || !c.hx.unread) return; c.hx.unread = 0; persist(c); var last = chMsgs(c).filter(function (m) { return m.from === 'c'; }).slice(-1)[0]; if (last) hxSend(c, { t: 'read', upTo: last.ts }).catch(function () { }); chRail(); if (typeof hxRail === 'function') hxRail();
}
function chRail() { var b = document.querySelector('[data-a="zchat"] em'), n = chUnread(); if (b) { b.textContent = n || ''; b.style.display = n ? '' : 'none'; } }
Object.assign(A, {
  zchat: function () { S.view = 'chat'; S.cur = null; render(); var c = S.clients.filter(function (x) { return x.code === CHT.sel; })[0]; if (c) chRead(c); var bd = $('#chBody'); if (bd) bd.scrollTop = bd.scrollHeight; },
  czOpen: function (v) { CHT.sel = v; var c = S.clients.filter(function (x) { return x.code === v; })[0]; chRead(c); chRe(true); var t = $('#chIn'); if (t && !matchMedia('(max-width:700px)').matches) t.focus(); },
  czBack: function () { CHT.sel = ''; chRe(); },
  czFile: function (v) { A.hxOpen(v); },
  czQuick: function (v) { var t = $('#chIn'); if (t) { t.value = CH_QUICK[+v] || ''; chGrow(t); t.focus(); } },
  czSend: function () {
    var c = S.clients.filter(function (x) { return x.code === CHT.sel && x.hx; })[0], ta = $('#chIn'), t = ta && ta.value.trim(); if (!c || !t) return; var ts = Date.now(); ta.disabled = true;
    hxSend(c, { t: 'msg', text: t.slice(0, 2000), ts: ts }).then(function () { c.hx.msgs = (c.hx.msgs || []).concat([{ from: 'd', t: t, ts: ts }]); c.hx.unread = 0; persist(c); var n = $('#chIn'); if (n) { n.disabled = false; n.value = ''; } chRe(true); var n2 = $('#chIn'); if (n2) n2.focus(); chRail(); })
      .catch(function (e) { var n = $('#chIn'); if (n) n.disabled = false; hxErr(e); });
  }
});
document.addEventListener('input', function (e) {
  var t = e.target; if (t.id === 'chQ') { CHT.q = t.value; var rows = $('.chrows'); if (rows) rows.innerHTML = chList(); } else if (t.id === 'chIn') chGrow(t);
});
document.addEventListener('keydown', function (e) { var t = e.target; if (t && t.id === 'chIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); A.czSend(); } });
// ---------- تكامل: الصفحة، الاستقبال الدوري، شارة الشريط
(function (f) { main0 = function () { if (S.view === 'chat') { chPaint(); return; } return f.apply(this, arguments); }; })(main0);
(function (f) { hxRe = function () { if (S.view === 'chat') { var c = S.clients.filter(function (x) { return x.code === CHT.sel; })[0]; if (c && c.hx && c.hx.unread && !document.hidden) chRead(c); main(); chRail(); return; } return f.apply(this, arguments); }; })(hxRe);
(function (f) { if (typeof hxRail === 'function') hxRail = function () { f.apply(this, arguments); chRail(); }; })(typeof hxRail === 'function' ? hxRail : null);
window.CHX = { unread: chUnread, thread: chThread, day: ctDay };       // للاختبارات
