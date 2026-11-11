// ================= المجموعات والتحديات في «شات زنها» عند الأخصائي (0.93) — يُدمج داخل app.js عند /*GRPUI*/
// المجموعة = مفتاح مشترك (AES) + سر تحقق للمحطة، يصل الأعضاءَ عبر الرسالة الفردية المشفّرة {t:'grp'}. الأخصائي وحده يضيف الأعضاء ويحذفهم.
// عند حذف عضو تُجدَّد هوية المجموعة (gid/مفتاح/سر) فلا يبقى له أي وصول، ويُحوَّل الباقون إليها تلقائياً.
var GP = { tab: 'chat', open: '', busy: false, seen: {}, edit: null };
var GP_EMOJI = ['👥', '🏆', '🔥', '🌿', '💪', '🥗', '🌙', '⭐'];
function gpAll() { HX.st.groups = HX.st.groups || {}; return HX.st.groups; }
function gpList() { var a = gpAll(); return Object.keys(a).map(function (k) { return a[k]; }).sort(function (x, y) { return gpLastTs(y) - gpLastTs(x); }); }
function gpGet(id) { return gpAll()[id] || null; }
function gpCur() { return String(CHT.sel).indexOf('g:') === 0 ? gpGet(CHT.sel.slice(2)) : null; }
function gpLastTs(g) { var m = g.msgs && g.msgs[g.msgs.length - 1]; return m ? m.ts * 1000 : g.created || 0; }
function gpMe() { return HX.st.ident.id; }
function gpName() { return String(HX.st.name || 'الأخصائي').slice(0, 30); }
function gpUnread() { return gpList().reduce(function (a, g) { return a + (g.unread || 0); }, 0); }
function gpMeta(g) { return { gid: g.gid, key: g.key, ga: g.ga, name: g.name, emoji: g.emoji, kind: g.kind, members: g.members, chal: g.chal || null, v: g.v || 1, did: gpMe(), old: g.old || '' }; }
function gpPushMeta(g, only) {
  return Promise.all(g.members.filter(function (m) { return !only || m.id === only; }).map(function (m) { var c = hxClientOf(m.id); return c ? hxSend(c, { t: 'grp', g: gpMeta(g) }).catch(function () { }) : 0; }));
}
function gpPost(g, obj) {
  obj.nm = obj.nm || gpName(); obj.ts = Date.now();
  return HXC0.gSeal(g.key, obj).then(function (box) { return hxFetch('POST', '/v1/g/send', { gid: g.gid, ga: g.ga, box: box }, true); });
}
function gpLabel(g, id, b) {
  var p = g.prof && g.prof[id], m = g.members.filter(function (x) { return x.id === id; })[0];
  return id === gpMe() ? gpName() : (m && m.nm) || (p && p.nm) || (b && b.nm) || 'عضو';
}
function gpAv(g, id, nm) { var p = g.prof && g.prof[id]; return p && p.ph ? '<span class="cav"><img src="' + esc(p.ph) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"></span>' : '<span class="cav">' + esc(initial(nm)) + '</span>'; }
// ---------- القائمة الجانبية
function gpRows() {
  var gs = gpList(), out = '<button class="sec sm gpnewb" data-a="gpNew" style="margin:8px 12px;width:calc(100% - 24px)">＋ مجموعة أو تحدٍّ جديد</button>';
  gs.forEach(function (g) {
    var m = g.msgs && g.msgs[g.msgs.length - 1], b = m && m.body, prev = !b ? 'ابدأ المحادثة' : b.t === 'img' ? '📷 صورة' : b.t === 'act' ? (GRP.byId(b.tool) ? GRP.byId(b.tool).ico + ' ' + GRP.byId(b.tool).say : 'إنجاز') : b.t === 'rank' ? '🏁 ترتيب' : String(b.x || '').slice(0, 40);
    out += '<button class="chrow' + (CHT.sel === 'g:' + g.gid ? ' on' : '') + '" data-a="gpOpen" data-v="' + esc(g.gid) + '"><span class="cav">' + esc(g.emoji || '👥') + '</span><span class="cht2"><b>' + esc(g.name) + (g.chal ? ' 🏆' : '') + '</b><small>' + esc(prev) + '</small></span>' + (g.unread ? '<span class="chun">' + g.unread + '</span>' : '') + '</button>';
  });
  return out;
}
// ---------- الصفحة الرئيسية للمجموعة
function gpMain() {
  var id = CHT.sel.slice(2); if (id === 'new') return gpNewForm(); var g = gpGet(id); if (!g) return '<section class="chm chnone"><div class="empty"><p class="small">المجموعة غير موجودة</p></div></section>';
  var tabs = [['chat', '💬 الدردشة'], ['rank', '🏆 الترتيب'], ['set', '⚙ الإعدادات']].map(function (t) { return '<button class="chip' + (GP.tab === t[0] ? ' on' : '') + '" data-a="gpTab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('');
  var head = '<header class="chh"><button class="sec sm chback" data-a="czBack" aria-label="رجوع إلى المحادثات">›</button><span class="cav">' + esc(g.emoji || '👥') + '</span><div><b>' + esc(g.name) + '</b><small>' + g.members.length + ' عضو' + (g.chal ? ' • ' + esc(g.chal.name) : '') + '</small></div></header><div class="chquick gptabs">' + tabs + '</div>';
  if (GP.tab === 'rank') return '<section class="chm">' + head + '<div class="chbody gpbody">' + gpRank(g) + '</div></section>';
  if (GP.tab === 'set') return '<section class="chm">' + head + '<div class="chbody gpbody">' + gpSettings(g) + '</div></section>';
  return '<section class="chm">' + head + '<div class="chbody" id="chBody">' + gpThread(g) + '</div><div class="chcomp"><input type="file" id="gpImg" accept="image/*" capture="environment" hidden><button data-a="gpPhoto" aria-label="إرفاق صورة">📷</button><textarea id="chIn" rows="1" maxlength="1500" placeholder="اكتب للمجموعة…" aria-label="رسالة للمجموعة"></textarea><button data-a="czSend" aria-label="إرسال">➤</button></div></section>';
}
function gpBubble(g, m, cont) {
  var b = m.body || {}, me = m.from === gpMe(), nm = gpLabel(g, m.from, b), tm = chTime(m.ts * 1000), who = me ? '' : '<small class="gpwho">' + esc(nm) + '</small>';
  if (b.t === 'sys') return '<div class="chsep"><span>' + esc(b.x) + '</span></div>';
  if (b.t === 'rank') return '<div class="gprank"><pre>' + esc(b.x || '') + '</pre><small class="chtm">' + tm + '</small></div>';
  if (b.t === 'act') { var t = GRP.byId(b.tool) || { ico: '⭐', say: 'أنجز' }; return '<div class="gpact"><span>' + t.ico + '</span><div><b>' + esc(nm) + '</b> ' + esc(t.say) + (b.note ? ' — ' + esc(b.note) : '') + (b.k ? '<img data-gk="' + esc(b.k) + '" alt="صورة" class="gpim">' : '') + '</div><small class="chtm">' + tm + '</small></div>'; }
  if (b.t === 'prof') return '';
  var inner = b.t === 'img' ? '<img data-gk="' + esc(b.k) + '" alt="صورة" class="gpim">' + (b.cap ? '<span class="cht3">' + esc(b.cap) + '</span>' : '') : '<span class="cht3">' + esc(b.x || '').replace(/\n/g, '<br>') + '</span>';
  return '<div class="chb' + (me ? ' me' : '') + (cont ? ' cont' : '') + '">' + (cont ? '' : who) + inner + '<small class="chtm">' + tm + '</small></div>';
}
function gpThread(g) {
  var out = '', last = '', prev = null; GRP.visible(g.msgs || []).forEach(function (m) {
    var d = ctDay(m.ts * 1000); if (d !== last) { out += '<div class="chsep"><span>' + esc(d) + '</span></div>'; last = d; prev = null; }
    var cont = prev && prev.from === m.from && m.ts - prev.ts < 120 && (m.body || {}).t === 'm' && (prev.body || {}).t === 'm'; prev = m; out += gpBubble(g, m, cont);
  });
  return out || '<div class="empty chempty"><p class="small">لا رسائل بعد. اكتب أول رسالة للمجموعة' + (g.chal ? '، وسيظهر هنا كل إنجاز يسجّله الأعضاء.' : '.') + '</p></div>';
}
// ---------- الترتيب
function gpRowsHtml(rows, g, me) {
  if (!rows.length) return '<p class="small">لا نشاط بعد.</p>';
  return '<ol class="gprows">' + rows.map(function (u) { return '<li class="' + (u.id === me ? 'me' : '') + '"><span class="gpr">' + (['🥇', '🥈', '🥉'][u.rank - 1] || u.rank) + '</span>' + gpAv(g, u.id, gpLabel(g, u.id, u)) + '<b>' + esc(gpLabel(g, u.id, u)) + '</b><span class="gpp">' + u.pts + ' نقطة</span></li>'; }).join('') + '</ol>';
}
function gpRank(g) {
  if (!g.chal) return '<div class="ucard"><h3>🏆 لا يوجد تحدٍّ في هذه المجموعة</h3><p class="small">حوّلها إلى تحدٍّ ليكسب الأعضاء نقاطاً من أدوات «زنها» ويظهر الترتيب اليومي.</p><button data-a="gpTab" data-v="set">إعداد تحدٍّ</button></div>';
  var ch = g.chal, st = GRP.state(ch), msgs = g.msgs || [], all = GRP.board(msgs, ch), today = GRP.board(msgs, ch, { day: GRP.dayKey(Date.now()) }), rw = GRP.rewards(all, ch.reward);
  var stT = st === 'live' ? 'جارٍ — باقي ' + GRP.daysLeft(ch) + ' يوماً' : st === 'soon' ? 'يبدأ ' + ch.start : 'انتهى';
  return '<div class="ucard"><div class="hxtop"><h3>' + esc(ch.ico || '🏆') + ' ' + esc(ch.name) + '</h3><span class="sbchip ' + (st === 'live' ? 'ok' : 'n') + '">' + stT + '</span></div>'
    + '<p class="small">الأدوات: ' + ch.tools.map(function (t) { var d = GRP.byId(t.id); return d ? d.ico + ' ' + d.name + ' (' + t.pts + ')' : ''; }).join(' • ') + '</p></div>'
    + '<div class="ucard"><h3>ترتيب اليوم</h3>' + gpRowsHtml(today, g, '') + '<button class="sec sm" data-a="gpPostRank" data-v="d">📣 انشر ترتيب اليوم في المجموعة</button></div>'
    + '<div class="ucard"><h3>الترتيب الإجمالي</h3>' + gpRowsHtml(all, g, '') + '</div>'
    + '<div class="ucard"><h3>🎁 الجوائز المستحقة (' + esc(gpModeName(ch.reward)) + ')</h3>' + (rw.length ? '<ul class="gprw">' + rw.map(function (r) { return '<li>' + (['🥇', '🥈', '🥉'][r.rank - 1] || r.rank + '.') + ' <b>' + esc(r.nm) + '</b> — ' + esc(r.label) + '</li>'; }).join('') + '</ul>' : '<p class="small">لا مستحقين بعد.</p>')
    + (g.closed && g.closed[ch.start] ? '<p class="small">✅ سُجّلت جوائز هذا التحدي في اشتراكات العملاء.</p>' : '<button data-a="gpClose">🏁 اعتماد النتيجة وتسجيل الجوائز</button><p class="small">تُسجَّل الجوائز في «الاشتراكات» عند كل عميل بحالة «بانتظار اعتمادك»، ولا يُطبَّق خصم قبل موافقتك.</p>') + '</div>';
}
function gpModeName(rw) { var m = rw && rw.mode; return m === 'first' ? 'الأول فقط' : m === 'top2' ? 'الأول والثاني' : m === 'all' ? 'كل المراتب' : m === 'pts' ? 'حسب النقاط' : 'بلا جوائز'; }
// ---------- الإعدادات: الاسم والأعضاء والتحدي والجوائز
function gpEd(g) { if (!GP.edit || GP.edit.gid !== g.gid) GP.edit = { gid: g.gid, chal: g.chal ? GRP.copy(g.chal) : null }; return GP.edit; }
function gpRewardRows(rw) {
  var items = rw.items || [], pts = rw.mode === 'pts', max = rw.mode === 'first' ? 1 : rw.mode === 'top2' ? 2 : 8;
  return items.slice(0, max).map(function (it, i) {
    return '<div class="gprwr"><b>' + (pts ? '≥ <input type="number" min="0" data-gk2="min" data-i="' + i + '" value="' + (+it.min || 0) + '" style="width:70px"> نقطة' : (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' المرتبة ' + (i + 1)) + '</b>'
      + '<select data-gk2="kind" data-i="' + i + '"><option value="disc"' + (it.kind === 'disc' ? ' selected' : '') + '>خصم ٪</option><option value="days"' + (it.kind === 'days' ? ' selected' : '') + '>أيام هدية</option><option value="text"' + (it.kind === 'text' ? ' selected' : '') + '>جائزة نصية</option></select>'
      + (it.kind === 'text' ? '<input data-gk2="label" data-i="' + i + '" value="' + esc(it.label || '') + '" maxlength="60" placeholder="مثال: وجبة مجانية" style="flex:1">' : '<input type="number" min="1" data-gk2="val" data-i="' + i + '" value="' + (+it.val || 0) + '" style="width:80px">') + '</div>';
  }).join('') + ((rw.mode === 'all' || rw.mode === 'pts') && items.length < 8 ? '<button class="sec sm" data-a="gpRwAdd">＋ مرتبة</button>' : '');
}
function gpChalForm(g) {
  var e = gpEd(g), ch = e.chal;
  var pre = '<div class="chquick">' + GRP.PRESETS.map(function (p) { return '<button class="chip" data-a="gpPreset" data-v="' + p.id + '">' + p.ico + ' ' + esc(p.name) + '</button>'; }).join('') + '</div>';
  if (!ch) return '<div class="ucard"><h3>🏆 تحويل المجموعة إلى تحدٍّ</h3><p class="small">اختر قالباً جاهزاً (تقدر تعدّل كل شيء بعده):</p>' + pre + '</div>';
  var tools = GRP.TOOLS.map(function (t) {
    var x = GRP.tool(ch, t.id); return '<tr><td><label><input type="checkbox" data-gt="' + t.id + '"' + (x ? ' checked' : '') + '> ' + t.ico + ' ' + esc(t.name) + '</label></td><td><input type="number" min="0" max="100" data-gp="' + t.id + '" value="' + (x ? x.pts : t.pts) + '" style="width:64px"></td><td><input type="number" min="1" max="12" data-gm="' + t.id + '" value="' + (x ? x.max : t.max) + '" style="width:56px"></td></tr>';
  }).join('');
  var rm = GRP.REWARDS.map(function (r) { return '<button class="chip' + (ch.reward && ch.reward.mode === r.mode ? ' on' : '') + '" data-a="gpRwMode" data-v="' + r.id + '">' + r.ico + ' ' + esc(r.name) + '</button>'; }).join('');
  return '<div class="ucard"><h3>🏆 إعداد التحدي</h3>' + pre
    + '<div class="gpfld"><label>اسم التحدي <input id="gcName" maxlength="40" value="' + esc(ch.name) + '"></label><label>يبدأ <input id="gcStart" type="date" value="' + esc(ch.start) + '"></label><label>المدة <select id="gcDays">' + [[1, 'يوم واحد'], [7, 'أسبوع'], [14, 'أسبوعان'], [30, 'شهر']].map(function (d) { return '<option value="' + d[0] + '"' + (+ch.days === d[0] ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></label></div>'
    + '<table class="gptools"><thead><tr><th>الأداة</th><th>نقاط المرة</th><th>أقصى مرات يومياً</th></tr></thead><tbody>' + tools + '</tbody></table>'
    + '<h3>🎁 الجوائز</h3><p class="small">اختر نمط التوزيع ثم عدّل القيم:</p><div class="chquick">' + rm + '</div>' + gpRewardRows(ch.reward || { mode: 'first', items: [] })
    + '<div class="gpbtns"><button data-a="gpSaveChal">💾 حفظ التحدي وإرساله للأعضاء</button><button class="sec" data-a="gpDropChal">إلغاء التحدي</button></div></div>';
}
function gpSettings(g) {
  var mem = S.clients.filter(function (c) { return c.hx; }).map(function (c) { var on = g.members.some(function (m) { return m.id === c.hx.cid; }); return '<label class="gpm"><input type="checkbox" data-gmem="' + esc(c.hx.cid) + '"' + (on ? ' checked' : '') + '> ' + esc(c.name || c.code) + '</label>'; }).join('') || '<p class="small">لا عملاء مرتبطون بـ«زنها» بعد.</p>';
  return '<div class="ucard"><h3>⚙ المجموعة</h3><div class="gpfld"><label>الاسم <input id="gsName" maxlength="40" value="' + esc(g.name) + '"></label><label>الرمز <select id="gsEmoji">' + GP_EMOJI.map(function (x) { return '<option' + (x === g.emoji ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label></div><button data-a="gpSaveInfo">حفظ</button></div>'
    + '<div class="ucard"><h3>👥 الأعضاء (الأخصائي وحده يضيف ويحذف)</h3><div class="gpmem">' + mem + '</div><button data-a="gpSaveMem">تحديث الأعضاء</button><p class="small">عند حذف عضو تُجدَّد مفاتيح المجموعة تلقائياً فلا يعود يرى رسائلها.</p></div>'
    + gpChalForm(g) + '<div class="ucard"><button class="sec dng" data-a="gpDelete">🗑 حذف المجموعة</button></div>';
}
function gpNewForm() {
  var mem = S.clients.filter(function (c) { return c.hx; }).map(function (c) { return '<label class="gpm"><input type="checkbox" data-gnm="' + esc(c.hx.cid) + '"> ' + esc(c.name || c.code) + '</label>'; }).join('') || '<p class="small">اربط عملاء بـ«زنها» أولاً.</p>';
  return '<section class="chm"><header class="chh"><button class="sec sm chback" data-a="czBack" aria-label="رجوع">›</button><b>مجموعة جديدة</b></header><div class="chbody gpbody"><div class="ucard"><div class="gpfld"><label>اسم المجموعة <input id="gnName" maxlength="40" placeholder="مثال: تحدي رمضان"></label><label>النوع <select id="gnKind"><option value="chal">تحدٍّ بنقاط وجوائز</option><option value="chat">دردشة فقط</option></select></label></div><h3>الأعضاء</h3><div class="gpmem">' + mem + '</div><button data-a="gpCreate">إنشاء المجموعة</button></div></div></section>';
}
// ---------- الاستقبال
function gpHandle(g, m) {
  var b = m.body, mine = m.from === gpMe(); if (b.t === 'prof') { g.prof = g.prof || {}; g.prof[m.from] = { nm: String(b.nm || '').slice(0, 30), ph: typeof b.ph === 'string' && /^data:image\/jpeg;base64,/.test(b.ph) && b.ph.length < 20000 ? b.ph : '' }; return; }
  if (mine) return;
  var fresh = Date.now() - m.ts * 1000 < 90000 && !GP.seen[g.gid + ':' + m.id]; GP.seen[g.gid + ':' + m.id] = 1;
  if (!(CHT.sel === 'g:' + g.gid && S.view === 'chat' && !document.hidden)) g.unread = (g.unread || 0) + 1;
  if (!fresh) return; var nm = gpLabel(g, m.from, b);
  if (b.t === 'act') { var t = GRP.byId(b.tool); if (t) GRP.fx(t.fx, nm + ' ' + t.say + ' ' + t.ico, g.name); }
  else if (b.t === 'rank' && b.fin) GRP.fx('rank', '🏆 النتيجة النهائية — ' + g.name);
}
function gpPollOne(g) {
  return hxFetch('POST', '/v1/g/poll', { gid: g.gid, ga: g.ga, after: g.after || 0 }, true).then(function (j) {
    return (j.msgs || []).reduce(function (p, m) {
      return p.then(function () { g.after = Math.max(g.after || 0, m.id); return HXC0.gOpen(g.key, m.body).then(function (b) { var x = { id: m.id, from: m.from, body: b, ts: m.ts }; g.msgs = (g.msgs || []).concat([x]).slice(-400); gpHandle(g, x); }).catch(function () { }); });
    }, Promise.resolve()).then(function () { return j.more ? gpPollOne(g) : 0; });
  });
}
function gpPoll() {
  if (!hxOn() || GP.busy) return Promise.resolve(0); GP.busy = true; var got = 0;
  return gpList().reduce(function (p, g) { return p.then(function () { var b = (g.msgs || []).length, a = g.after; return gpPollOne(g).catch(function () { }).then(function () { got += (g.msgs || []).length - b; if (a !== g.after) HX.dirty = 1; }); }); }, Promise.resolve())
    .then(function () { gpAutoRank(); if (HX.dirty) { HX.dirty = 0; return hxSave(); } }).catch(function () { }).then(function () { GP.busy = false; if (got) { if (S.view === 'chat' && (CHT.sel + '').indexOf('g:') === 0) { var g = gpCur(); if (g && !document.hidden) g.unread = 0; chRe(true); } chRail(); } return got; });
}
// الترتيب اليومي التلقائي بعد التاسعة مساءً (يُنشر مرة واحدة لليوم؛ ولو نشره جهاز آخر تُعرض الأولى فقط)
function gpAutoRank() {
  var now = new Date(), day = GRP.dayKey(now.getTime()); if (now.getHours() < 21) return;
  gpList().forEach(function (g) {
    if (!g.chal || GRP.state(g.chal) !== 'live' || g.rankDay === day) return; g.rankDay = day;
    if ((g.msgs || []).some(function (m) { return m.body && m.body.t === 'rank' && m.body.day === day; })) return;
    var rows = GRP.board(g.msgs || [], g.chal, { day: day }); if (!rows.length) return;
    rows.forEach(function (u) { u.nm = gpLabel(g, u.id, u); }); gpPost(g, { t: 'rank', day: day, x: GRP.rankText(rows, 'اليوم', 5) }).catch(function () { });
  });
}
// ---------- الإجراءات
function gpSel(id) { CHT.sel = 'g:' + id; GP.tab = 'chat'; GP.edit = null; var g = gpGet(id); if (g) g.unread = 0; chRail(); }
function gpRead(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function gpSaveAll() { return hxSave(); }
Object.assign(A, {
  gpNew: function () { CHT.sel = 'g:new'; chRe(); },
  gpOpen: function (v) { gpSel(v); chRe(true); gpHydrate(); },
  gpTab: function (v) { GP.tab = v; chRe(); gpHydrate(); },
  gpCreate: function () {
    var name = ($('#gnName').value || '').trim(); if (!name) return toast('اكتب اسم المجموعة'); var kind = $('#gnKind').value, ids = gpRead('[data-gnm]:checked').map(function (x) { return x.getAttribute('data-gnm'); });
    var gx = HXC0.gNew(); HXC0.gah(gx.ga).then(function (ah) { return hxFetch('POST', '/v1/g/new', { gid: gx.gid, ah: ah }, true); }).then(function () {
      var g = { gid: gx.gid, key: gx.key, ga: gx.ga, name: name, emoji: kind === 'chal' ? '🏆' : '👥', kind: kind, members: ids.map(function (id) { var c = hxClientOf(id); return { id: id, nm: c ? c.name || c.code : 'عضو' }; }), chal: kind === 'chal' ? GRP.makeChal('meals') : null, v: 1, after: 0, msgs: [], unread: 0, created: Date.now() };
      gpAll()[g.gid] = g; return gpSaveAll().then(function () { return gpPushMeta(g); }).then(function () { return gpPost(g, { t: 'sys', x: 'أُنشئت المجموعة «' + name + '»' + (g.chal ? ' — بدأ التحدي 🏆' : '') }); }).then(function () { gpSel(g.gid); if (kind === 'chal') GP.tab = 'set'; chRe(); return gpPoll(); });
    }).catch(hxErr);
  },
  gpPhoto: function () { var f = $('#gpImg'); if (f) f.click(); },
  gpSaveInfo: function () { var g = gpCur(); if (!g) return; g.name = ($('#gsName').value || '').trim() || g.name; g.emoji = $('#gsEmoji').value; g.v++; gpSaveAll().then(function () { return gpPushMeta(g); }).then(function () { toast('تم الحفظ'); chRe(); }); },
  gpSaveMem: function () {
    var g = gpCur(); if (!g) return; var want = gpRead('[data-gmem]:checked').map(function (x) { return x.getAttribute('data-gmem'); }), have = g.members.map(function (m) { return m.id; });
    var added = want.filter(function (id) { return have.indexOf(id) < 0; }), removed = have.filter(function (id) { return want.indexOf(id) < 0; });
    if (!added.length && !removed.length) return toast('لا تغيير');
    g.members = want.map(function (id) { var c = hxClientOf(id); return { id: id, nm: c ? c.name || c.code : 'عضو' }; }); g.v++;
    var rekey = removed.length ? (function () { var gx = HXC0.gNew(); return HXC0.gah(gx.ga).then(function (ah) { return hxFetch('POST', '/v1/g/new', { gid: gx.gid, ah: ah }, true); }).then(function () { delete gpAll()[g.gid]; g.old = g.gid; g.gid = gx.gid; g.key = gx.key; g.ga = gx.ga; g.after = 0; gpAll()[g.gid] = g; CHT.sel = 'g:' + g.gid; }); })() : Promise.resolve();
    rekey.then(function () { removed.forEach(function (id) { var c = hxClientOf(id); if (c) hxSend(c, { t: 'grpx', gid: g.old || g.gid }).catch(function () { }); }); return gpSaveAll(); }).then(function () { return gpPushMeta(g); }).then(function () { g.old = ''; return gpPost(g, { t: 'sys', x: removed.length ? 'تغيّر أعضاء المجموعة' : 'انضمّ أعضاء جدد' }); }).then(function () { toast('تم تحديث الأعضاء'); chRe(); }).catch(hxErr);
  },
  gpPreset: function (v) { var g = gpCur(); if (!g) return; var e = gpEd(g), old = e.chal; e.chal = GRP.makeChal(v); if (old) e.chal.reward = old.reward; chRe(); },
  gpRwMode: function (v) { var g = gpCur(); if (!g) return; gpReadChal(g); var e = gpEd(g), r = GRP.REWARDS.filter(function (x) { return x.id === v; })[0]; e.chal.reward = { mode: r.mode, items: GRP.copy(r.items) }; chRe(); },
  gpRwAdd: function () { var g = gpCur(); if (!g) return; gpReadChal(g); var rw = gpEd(g).chal.reward; rw.items.push(rw.mode === 'pts' ? { min: 20, kind: 'text', label: 'شهادة تقدير' } : { kind: 'text', label: 'جائزة تشجيعية' }); chRe(); },
  gpDropChal: function () { var g = gpCur(); if (!g || !confirm('إلغاء التحدي؟ تبقى المجموعة للدردشة.')) return; g.chal = null; GP.edit = null; g.v++; gpSaveAll().then(function () { return gpPushMeta(g); }).then(function () { chRe(); }); },
  gpSaveChal: function () {
    var g = gpCur(); if (!g) return; gpReadChal(g); var ch = gpEd(g).chal; if (!ch.tools.length) return toast('اختر أداة واحدة على الأقل');
    g.chal = GRP.copy(ch); g.kind = 'chal'; g.v++; gpSaveAll().then(function () { return gpPushMeta(g); }).then(function () { return gpPost(g, { t: 'sys', x: '🏆 تحدي «' + ch.name + '» — يبدأ ' + ch.start + ' ولمدة ' + ch.days + ' يوم' }); }).then(function () { toast('أُرسل التحدي للأعضاء'); GP.tab = 'rank'; chRe(); return gpPoll(); }).catch(hxErr);
  },
  gpDelete: function () { var g = gpCur(); if (!g || !confirm('حذف المجموعة من جهازك ومن أجهزة أعضائها؟')) return; g.members.forEach(function (m) { var c = hxClientOf(m.id); if (c) hxSend(c, { t: 'grpx', gid: g.gid }).catch(function () { }); }); delete gpAll()[g.gid]; CHT.sel = ''; gpSaveAll().then(function () { chRe(); chRail(); }); },
  gpPostRank: function () {
    var g = gpCur(); if (!g || !g.chal) return; var day = GRP.dayKey(Date.now()), rows = GRP.board(g.msgs || [], g.chal, { day: day }); if (!rows.length) return toast('لا نشاط اليوم بعد');
    rows.forEach(function (u) { u.nm = gpLabel(g, u.id, u); }); gpPost(g, { t: 'rank', day: day, x: GRP.rankText(rows, 'اليوم', 5) }).then(function () { toast('نُشر الترتيب'); return gpPoll(); }).catch(hxErr);
  },
  gpClose: function () {
    var g = gpCur(); if (!g || !g.chal) return; var ch = g.chal, st = GRP.state(ch); if (st !== 'ended' && !confirm('التحدي لم ينتهِ بعد. تسجيل الجوائز الآن؟')) return;
    var rows = GRP.board(g.msgs || [], ch); rows.forEach(function (u) { u.nm = gpLabel(g, u.id, u); }); var rw = GRP.rewards(rows, ch.reward), n = 0;
    rw.forEach(function (r) { var c = hxClientOf(r.id); if (!c) return; c.rewards = c.rewards || []; c.rewards.push({ id: 'r' + Date.now().toString(36) + n, gid: g.gid, ch: ch.name, rank: r.rank, pts: r.pts, kind: r.kind, val: r.val, label: r.label, ts: Date.now(), st: 'pending' }); persist(c); n++; hxSend(c, { t: 'msg', text: '🎉 فزت في «' + ch.name + '» بالمركز ' + r.rank + ' (' + r.pts + ' نقطة). جائزتك: ' + r.label + ' — سنتواصل معك لتفعيلها.' }).catch(function () { }); });
    g.closed = g.closed || {}; g.closed[ch.start] = 1; gpSaveAll();
    gpPost(g, { t: 'rank', fin: 1, day: ch.start, x: GRP.rankText(rows, 'تحدي «' + ch.name + '» (النهائي)', 5) + (rw.length ? '\n\n🎁 الجوائز:\n' + rw.map(function (r) { return r.nm + ': ' + r.label; }).join('\n') : '') }).then(function () { toast('سُجّلت ' + n + ' جائزة في اشتراكات العملاء بانتظار اعتمادك'); chRe(); return gpPoll(); }).catch(hxErr);
  },
  gpRw: function (v) {                                                   // اعتماد جائزة أو رفضها من ملف العميل
    var p = String(v).split('|'), c = S.clients.filter(function (x) { return x.code === p[0]; })[0], r = c && (c.rewards || []).filter(function (x) { return x.id === p[1]; })[0]; if (!r) return;
    if (p[2] === 'ok') { r.st = 'ok'; if (r.kind === 'days' && typeof sbHas === 'function' && sbHas(c)) { sbExtend(c, r.val, 'جائزة تحدي «' + r.ch + '»'); r.st = 'done'; } } else r.st = 'no'; persist(c); main();
  }
});
function gpReadChal(g) {
  var e = gpEd(g), ch = e.chal; if (!ch || !$('#gcName')) return; ch.name = ($('#gcName').value || '').trim() || ch.name; ch.start = $('#gcStart').value || ch.start; ch.days = +$('#gcDays').value || ch.days;
  ch.tools = gpRead('[data-gt]:checked').map(function (x) { var id = x.getAttribute('data-gt'); return { id: id, pts: Math.max(0, Math.min(100, +($('[data-gp="' + id + '"]').value) || 0)), max: Math.max(1, Math.min(12, +($('[data-gm="' + id + '"]').value) || 1)) }; });
  var rw = ch.reward; if (rw) gpRead('[data-gk2]').forEach(function (x) { var it = rw.items[+x.getAttribute('data-i')]; if (!it) return; var k = x.getAttribute('data-gk2'); it[k] = (k === 'label' || k === 'kind') ? x.value : +x.value || 0; if (k === 'kind' && x.value !== 'text') { it.val = it.val || 10; } });
}
function gpHydrate() { var bd = $('#chBody'), g = gpCur(); if (bd && g) GRP.hydrate(bd, hxRelay(), g.key); }
document.addEventListener('change', function (e) { var t = e.target; if (t && t.getAttribute && t.getAttribute('data-gk2') === 'kind') { var g = gpCur(); if (g) { gpReadChal(g); var it = gpEd(g).chal.reward.items[+t.getAttribute('data-i')]; if (it.kind === 'text' && !it.label) it.label = 'جائزة تشجيعية'; if (it.kind !== 'text' && !it.val) it.val = 10; chRe(true); } } });
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || t.id !== 'gpImg' || !t.files || !t.files[0]) return; var g = gpCur(), f = t.files[0]; t.value = ''; if (!g) return; toast('جارٍ ضغط الصورة وتشفيرها…');
  GRP.shrink(f, 240000).then(function (u8) { return HXC0.gSealBytes(g.key, u8); }).then(function (c) { return hxFetch('POST', '/v1/g/media', { gid: g.gid, ga: g.ga, c: c }, true); }).then(function (r) { return gpPost(g, { t: 'img', k: r.key }); }).then(function () { return gpPoll(); }).catch(function (er) { toast('⚠ ' + er.message); });
});
// ---------- تكامل
(function (f) { var c0 = A.czSend; A.czSend = function () {
  var g = gpCur(); if (!g) return c0.apply(this, arguments); var ta = $('#chIn'), t = ta && ta.value.trim(); if (!t) return; ta.disabled = true;
  gpPost(g, { t: 'm', x: t.slice(0, 1500) }).then(function () { return gpPoll(); }).then(function () { var n = $('#chIn'); if (n) { n.disabled = false; n.value = ''; n.focus(); } }).catch(function (e) { var n = $('#chIn'); if (n) n.disabled = false; hxErr(e); });
}; })();
(function (f) { chUnread = function () { return f.apply(this, arguments) + gpUnread(); }; })(chUnread);
(function (f) { hxPoll = function () { var p = f.apply(this, arguments); return p.then(function (n) { return gpPoll().then(function (m) { return n + m; }); }); }; })(hxPoll);
(function (f) { var czo = A.czOpen; A.czOpen = function (v) { GP.edit = null; return czo.apply(this, arguments); }; })();
(function (f) { chPaint = function () { f.apply(this, arguments); gpHydrate(); }; })(chPaint);
(function (f) { HX_PUSH.push('grp'); })();
// جوائز التحديات داخل تبويب الاشتراك
(function (f) { subTab = function (c) { var h = f.apply(this, arguments), rs = c.rewards || []; if (!rs.length) return h; return h + '<div class="ucard"><h3>🎁 جوائز التحديات</h3>' + rs.map(function (r) { var stt = r.st === 'pending' ? '<span class="sbchip w">بانتظار اعتمادك</span> <button class="sm" data-a="gpRw" data-v="' + esc(c.code + '|' + r.id + '|ok') + '">اعتماد</button> <button class="sec sm" data-a="gpRw" data-v="' + esc(c.code + '|' + r.id + '|no') + '">رفض</button>' : r.st === 'done' ? '<span class="sbchip ok">طُبّقت</span>' : r.st === 'ok' ? '<span class="sbchip ok">معتمدة — طبّقها عند التجديد</span>' : '<span class="sbchip n">مرفوضة</span>'; return '<p><b>' + esc(r.label) + '</b> — المركز ' + r.rank + ' في «' + esc(r.ch) + '» (' + r.pts + ' نقطة) ' + stt + '</p>'; }).join('') + '</div>'; }; })(subTab);
window.GPX = { post: gpPost, list: gpList, poll: gpPoll, board: function (id) { var g = gpGet(id); return GRP.board(g.msgs, g.chal); }, get: gpGet };    // للاختبارات
