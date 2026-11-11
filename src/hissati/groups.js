// ================= «شات زنها»: المجموعات والتحديات عند العميل (0.93) — يُدمج في app.js عند /*GRPCL*/
// المجموعة تصل من الأخصائي وحده (رسالة فردية مشفّرة فيها مفتاح المجموعة)، فلا يضيف العميل أحداً. الرسائل والصور مشفّرة بمفتاح المجموعة.
// النقاط تُحسب محلياً من تعريف التحدي (GRP.board)، فلا تُصدَّق نقاط يدّعيها أحد.
const ZC = { t: 0, busy: false, seen: {}, pend: null };
function zcI() { S.grp = S.grp || {}; S.zc = S.zc || { list: false, sel: '', tab: 'chat' }; S.prof = S.prof || { nm: '', ph: '' }; S.comp = S.comp || []; return S; }
const zcList = () => Object.values(zcI().grp).sort((a, b) => zcLast(b) - zcLast(a));
const zcLast = (g) => { const m = g.msgs && g.msgs[g.msgs.length - 1]; return m ? m.ts : 0; };
const zcCur = () => (S && S.zc && S.zc.sel && S.grp[S.zc.sel]) || null;
const zcUnread = () => (S && S.grp ? Object.values(S.grp).reduce((a, g) => a + (g.unread || 0), 0) : 0);
const zcMe = () => S.prof.nm || S.p.name || 'أنا';
const zcName = (g, id, b) => id === S.cid ? zcMe() : (g.prof && g.prof[id] && g.prof[id].nm) || (g.members.find((m) => m.id === id) || {}).nm || (id === g.did ? S.dname : '') || (b && b.nm) || 'عضو';
const zcAv = (g, id, nm) => { const p = g.prof && g.prof[id], ph = id === S.cid ? S.prof.ph : p && p.ph; return ph ? '<span class="zcav"><img src="' + esc(ph) + '" alt=""></span>' : '<span class="zcav">' + esc(String(nm || '؟').charAt(0)) + '</span>'; };
function zcPost(g, obj) {
  obj.nm = zcMe(); obj.ts = now();
  return HXC.gSeal(g.key, obj).then((box) => api('POST', '/v1/g/send', { gid: g.gid, ga: g.ga, box }));
}
// ---------- استلام المجموعة من الأخصائي
function zcIn(p) {
  zcI(); const g = p.g; if (p.t === 'grpx') { if (S.grp[p.gid]) { delete S.grp[p.gid]; if (S.zc.sel === p.gid) S.zc.sel = ''; return true; } return false; }
  if (!g || !/^[A-Za-z0-9_-]{16,32}$/.test(String(g.gid)) || !/^[A-Za-z0-9_-]{43}$/.test(String(g.key)) || !/^[A-Za-z0-9_-]{32}$/.test(String(g.ga))) return false;
  const old = g.old && S.grp[g.old], cur = S.grp[g.gid] || old, first = !cur;
  const nx = { gid: g.gid, key: g.key, ga: g.ga, did: S.did, name: String(g.name || 'مجموعة').slice(0, 40), emoji: String(g.emoji || '👥').slice(0, 4), kind: g.kind === 'chal' ? 'chal' : 'chat', members: (Array.isArray(g.members) ? g.members : []).slice(0, 200).map((m) => ({ id: String(m.id), nm: String(m.nm || '').slice(0, 30) })), chal: g.chal && typeof g.chal === 'object' && Array.isArray(g.chal.tools) ? g.chal : null, v: +g.v || 1, after: cur && !old ? cur.after : 0, msgs: cur ? cur.msgs : [], unread: cur ? cur.unread : 0, prof: cur ? cur.prof : {} };
  if (old && old.gid !== g.gid) { delete S.grp[old.gid]; if (S.zc.sel === old.gid) S.zc.sel = g.gid; }
  S.grp[g.gid] = nx; if (first) { notify('انضممت إلى «' + nx.name + '»', 'افتح «شات زنها» لتبدأ'); zcProfile(nx); } else if (nx.chal && (!cur.chal || cur.chal.name !== nx.chal.name)) notify('تحدٍّ جديد في «' + nx.name + '»', nx.chal.name);
  return true;
}
function zcProfile(g) { if (S.prof.nm || S.prof.ph) zcPost(g, { t: 'prof', ph: S.prof.ph || '' }).catch(() => { }); }
// ---------- الاستقبال الدوري
async function zcPollOne(g) {
  let n = 0;
  for (;;) {
    const j = await api('POST', '/v1/g/poll', { gid: g.gid, ga: g.ga, after: g.after || 0 });
    for (const m of j.msgs || []) {
      g.after = Math.max(g.after || 0, m.id); let b; try { b = await HXC.gOpen(g.key, m.body); } catch (e) { continue; }
      const x = { id: m.id, from: m.from, body: b, ts: m.ts * 1000 }; g.msgs = (g.msgs || []).concat([x]).slice(-300); n++; zcHandle(g, x);
    }
    if (!j.more) return n;
  }
}
function zcHandle(g, m) {
  const b = m.body;
  if (b.t === 'prof') { g.prof = g.prof || {}; g.prof[m.from] = { nm: String(b.nm || '').slice(0, 30), ph: typeof b.ph === 'string' && /^data:image\/jpeg;base64,/.test(b.ph) && b.ph.length < 20000 ? b.ph : '' }; return; }
  if (m.from === S.cid) return;
  const k = g.gid + ':' + m.id, fresh = now() - m.ts < 90000 && !ZC.seen[k]; ZC.seen[k] = 1;
  if (!(S.chat && S.zc.sel === g.gid && !document.hidden)) g.unread = (g.unread || 0) + 1;
  if (!fresh) return; const nm = zcName(g, m.from, b);
  if (b.t === 'act') { const t = GRP.byId(b.tool); if (t) { GRP.fx(t.fx, nm + ' ' + t.say + ' ' + t.ico, g.name); if (zcLeader(g, m.from)) setTimeout(() => GRP.fx('lead', '👑 ' + nm + ' يتصدّر الآن!', g.name, { n: 8 }), 3400); } }
  else if (b.t === 'rank' && b.fin) GRP.fx('rank', '🏆 النتيجة النهائية — ' + g.name);
}
const zcLeader = (g, id) => { if (!g.chal) return false; const r = GRP.board(g.msgs, g.chal, { day: GRP.dayKey(now()) }); return r.length > 1 && r[0].id === id && r[0].pts > r[1].pts; };
async function zcPoll() {
  if (!S || ZC.busy) return 0; ZC.busy = true; let n = 0;
  try { for (const g of zcList()) { try { n += await zcPollOne(g); } catch (e) { } } zcAutoRank(); } finally { ZC.busy = false; }
  if (n) { zcList().forEach((g) => { if (S.chat && S.zc.sel === g.gid && !document.hidden) g.unread = 0; }); save(); }
  return n;
}
function zcAutoRank() {                                                  // ترتيب اليوم بعد التاسعة مساءً (أول جهاز يفتح ينشره، والباقي يُخفى تلقائياً)
  const d = new Date(), day = GRP.dayKey(d.getTime()); if (d.getHours() < 21) return;
  zcList().forEach((g) => {
    if (!g.chal || GRP.state(g.chal) !== 'live' || g.rankDay === day) return; g.rankDay = day;
    if (g.msgs.some((m) => m.body.t === 'rank' && m.body.day === day)) return; const rows = GRP.board(g.msgs, g.chal, { day }); if (!rows.length) return;
    rows.forEach((u) => { u.nm = zcName(g, u.id, u); }); zcPost(g, { t: 'rank', day, x: GRP.rankText(rows, 'اليوم', 5) }).catch(() => { });
  });
}
// ---------- العرض
function zcTop(title, sub, back) { return '<div class="who"><button class="back" data-act="' + back + '" aria-label="رجوع" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--glass);border:1px solid var(--line)">' + I('back') + '</button><div style="flex:1;min-width:0"><b>' + title + '</b><div class="dim">' + sub + '</div></div></div>'; }
function zcListView() {
  const last = S.msgs[S.msgs.length - 1], un = +S.unreadC || 0;
  const rows = ['<button class="zcrow" data-act="zcSpec"><span class="zcav">' + esc(drInit()) + '</span><span class="zct"><b>' + esc(S.dname) + '</b><small>' + (last ? esc(String(last.t).slice(0, 40)) : 'أخصائيك') + '</small></span>' + (un ? '<span class="nb">' + un + '</span>' : '') + '</button>']
    .concat(zcList().map((g) => { const m = g.msgs[g.msgs.length - 1], b = m && m.body, pv = !b ? 'ابدأ المحادثة' : b.t === 'img' ? '📷 صورة' : b.t === 'act' ? (GRP.byId(b.tool) || { say: 'إنجاز' }).say : b.t === 'rank' ? '🏁 ترتيب' : String(b.x || '').slice(0, 40); return '<button class="zcrow" data-act="zcOpen" data-v="' + g.gid + '"><span class="zcav">' + esc(g.emoji) + '</span><span class="zct"><b>' + esc(g.name) + (g.chal ? ' 🏆' : '') + '</b><small>' + esc(pv) + '</small></span>' + (g.unread ? '<span class="nb">' + g.unread + '</span>' : '') + '</button>'; }));
  rows.push('<button class="zcrow" data-act="zcMe"><span class="zcav">' + (S.prof.ph ? '<img src="' + esc(S.prof.ph) + '" alt="">' : '👤') + '</span><span class="zct"><b>ملفي ورفقاء الرحلة</b><small>الاسم والصورة والرمز</small></span></button>');
  return '<div class="scr"><div class="chat">' + zcTop('شات زنها', 'محادثاتك ومجموعاتك', 'chatClose') + '<div class="zclist">' + rows.join('') + '</div></div></div>';
}
function zcBubble(g, m, cont) {
  const b = m.body, me = m.from === S.cid, nm = zcName(g, m.from, b), tm = hm(m.ts);
  if (b.t === 'sys') return '<span class="daysep">' + esc(b.x) + '</span>'; if (b.t === 'prof') return '';
  if (b.t === 'rank') return '<div class="zcrank"><pre>' + esc(b.x || '') + '</pre><span class="mt">' + tm + '</span></div>';
  if (b.t === 'act') { const t = GRP.byId(b.tool) || { ico: '⭐', say: 'أنجز' }; return '<div class="zcact"><span>' + t.ico + '</span><div><b>' + esc(nm) + '</b> ' + esc(t.say) + (b.k ? '<img data-gk="' + esc(b.k) + '" alt="صورة" class="zcim">' : '') + '</div><span class="mt">' + tm + '</span></div>'; }
  const inner = b.t === 'img' ? '<img data-gk="' + esc(b.k) + '" alt="صورة" class="zcim">' : esc(b.x || '');
  return '<div class="bub' + (me ? ' me' : '') + (cont ? ' cont' : '') + '">' + (me || cont ? '' : '<b class="zcwho">' + esc(nm) + '</b>') + inner + '<div class="mt"><span>' + tm + '</span></div></div>';
}
function zcThread(g) {
  let last = '', prev = null; const out = GRP.visible(g.msgs).map((m) => {
    const d = new Date(m.ts).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'short' }), sep = d !== last ? '<span class="daysep">' + d + '</span>' : ''; last = d;
    const cont = !sep && prev && prev.from === m.from && m.ts - prev.ts < 120000 && prev.body.t === 'm' && m.body.t === 'm'; prev = m; return sep + zcBubble(g, m, cont);
  }).join('');
  return out || '<div class="empty" style="padding:20px 6px"><p class="mut">لا رسائل بعد — ابدأ الحديث' + (g.chal ? ' أو سجّل إنجازك الأول 💪' : '') + '</p></div>';
}
function zcActs(g) {
  if (!g.chal || GRP.state(g.chal) !== 'live') return g.chal ? '<div class="replyb">' + (GRP.state(g.chal) === 'soon' ? 'يبدأ التحدي ' + esc(g.chal.start) : 'انتهى التحدي — شاهد النتيجة في «الترتيب»') + '</div>' : '';
  const left = GRP.todayLeft(g.msgs, g.chal, S.cid, now());
  return '<div class="zcacts">' + left.map((l) => { const t = GRP.byId(l.id); return t ? '<button data-act="zcAct" data-v="' + t.id + '"' + (l.left ? '' : ' disabled') + '>' + t.ico + ' ' + esc(t.name) + '<small>' + (l.left ? '+' + l.pts : '✓ اكتمل') + '</small></button>' : ''; }).join('') + '</div>';
}
function zcTabs(g) { return '<div class="zctabs">' + [['chat', '💬 الدردشة'], ['rank', '🏆 الترتيب'], ['me', '👤 أنا']].map((t) => '<button data-act="zcTab" data-v="' + t[0] + '"' + (S.zc.tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>').join('') + '</div>'; }
function zcRankView(g) {
  if (!g.chal) return '<div class="empty" style="padding:24px"><p class="mut">لا يوجد تحدٍّ في هذه المجموعة بعد.</p></div>';
  const ch = g.chal, all = GRP.board(g.msgs, ch), tdy = GRP.board(g.msgs, ch, { day: GRP.dayKey(now()) }), st = GRP.state(ch), mine = all.find((u) => u.id === S.cid), rw = GRP.rewards(all, ch.reward), comp = new Set(S.comp.map(GRP.normCode));
  const rows = (rs) => rs.length ? '<ol class="zcrows">' + rs.map((u) => '<li class="' + (u.id === S.cid ? 'me' : '') + '"><span class="zcr">' + (['🥇', '🥈', '🥉'][u.rank - 1] || u.rank) + '</span>' + zcAv(g, u.id, zcName(g, u.id, u)) + '<b>' + esc(zcName(g, u.id, u)) + (comp.has(GRP.codeOf(u.id)) ? ' 🤝' : '') + '</b><span class="zcp">' + u.pts + '</span></li>').join('') + '</ol>' : '<p class="mut">لا نشاط بعد — كن الأول!</p>';
  return '<div class="zcbody"><div class="zcbox"><h3>' + esc(ch.ico || '🏆') + ' ' + esc(ch.name) + '</h3><p class="mut">' + (st === 'live' ? 'باقي ' + GRP.daysLeft(ch) + ' يوماً' : st === 'soon' ? 'يبدأ ' + esc(ch.start) : 'انتهى') + (mine ? ' — مركزك ' + mine.rank + ' بـ' + mine.pts + ' نقطة' : '') + '</p></div>'
    + '<div class="zcbox"><h3>ترتيب اليوم</h3>' + rows(tdy) + '</div><div class="zcbox"><h3>الترتيب الإجمالي</h3>' + rows(all) + '</div>'
    + '<div class="zcbox"><h3>🎁 الجوائز (' + esc(({ first: 'الأول فقط', top2: 'الأول والثاني', all: 'كل المراتب', pts: 'حسب النقاط' })[ch.reward && ch.reward.mode] || '—') + ')</h3>'
    + (ch.reward && ch.reward.items.length ? '<ul class="zcrw">' + ch.reward.items.map((it, i) => '<li>' + (ch.reward.mode === 'pts' ? '≥ ' + (+it.min || 0) + ' نقطة' : (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' المرتبة ' + (i + 1)) + ': <b>' + esc(GRP.rewardLabel(it)) + '</b></li>').join('') + '</ul>' : '<p class="mut">لا جوائز محددة.</p>') + (rw.length ? '<p class="mut">المستحقون حالياً: ' + rw.map((r) => esc(r.nm)).join('، ') + '</p>' : '') + '</div></div>';
}
function zcMeView(g) {
  const comps = S.comp.map((c) => { const hit = zcFind(c); return '<li>🤝 <b>' + esc(hit ? hit.nm : c) + '</b> <span class="mut">' + esc(c) + '</span> <button class="link" data-act="zcCompDel" data-v="' + esc(c) + '">إزالة</button></li>'; }).join('');
  return '<div class="zcbody"><div class="zcbox"><h3>ملفي</h3><div class="zcprof"><button class="zcavbig" data-act="zcPhoto" aria-label="تغيير الصورة">' + (S.prof.ph ? '<img src="' + esc(S.prof.ph) + '" alt="">' : esc(String(zcMe()).charAt(0))) + '</button><input type="file" id="zcPhotoIn" accept="image/*" hidden><div style="flex:1"><input id="zcNm" maxlength="30" value="' + esc(S.prof.nm || S.p.name || '') + '" placeholder="اسمك في المجموعات" aria-label="الاسم"><button class="btn sec" data-act="zcSaveProf" style="margin-top:8px">حفظ</button></div></div></div>'
    + '<div class="zcbox"><h3>رمزي</h3><p class="zccode">' + esc(GRP.codeOf(S.cid)) + '</p><p class="mut">أعطِ هذا الرمز لصديقك ليضيفك «رفيق رحلة» ويتابع نقاطك. (لا يضيف أحد إلى المجموعات إلا الأخصائي.)</p></div>'
    + '<div class="zcbox"><h3>رفقاء الرحلة</h3>' + (comps ? '<ul class="zccomp">' + comps + '</ul>' : '<p class="mut">لم تضف رفقاء بعد.</p>') + '<div class="zcadd"><input id="zcCode" maxlength="12" placeholder="Z-XXXXXX" dir="ltr" aria-label="رمز الرفيق"><button class="btn" data-act="zcCompAdd">إضافة</button></div></div></div>';
}
function zcFind(code) { const c = GRP.normCode(code); for (const g of zcList()) { for (const m of g.members.concat([{ id: g.did, nm: S.dname }])) if (m.id !== S.cid && GRP.codeOf(m.id) === c) return { id: m.id, nm: zcName(g, m.id, m) }; } return null; }
function zcGroupView(g) {
  const tab = S.zc.tab;
  const body = tab === 'rank' ? zcRankView(g) : tab === 'me' ? zcMeView(g) : '<div class="thread" id="thread">' + zcThread(g) + '</div>' + zcActs(g) + '<div class="composer"><input type="file" id="zcImg" accept="image/*" capture="environment" hidden><button class="snd" data-act="zcPick" aria-label="صورة" style="background:var(--glass);color:inherit">📷</button><textarea id="chatIn" rows="1" maxlength="1500" placeholder="اكتب للمجموعة…" aria-label="رسالة"></textarea><button class="snd" data-act="zcSend" aria-label="إرسال">' + I('send') + '</button></div>';
  return '<div class="scr"><div class="chat">' + zcTop(esc(g.emoji) + ' ' + esc(g.name), g.members.length + ' عضو' + (g.chal ? ' • ' + esc(g.chal.name) : ''), 'zcBack') + zcTabs(g) + body + '</div></div>';
}
function zcProfView() {
  const fake = { members: [], did: S.did, chal: null, msgs: [], prof: {}, name: '', emoji: '', gid: '' };
  return '<div class="scr"><div class="chat">' + zcTop('ملفي', 'الاسم والصورة والرمز', 'zcBack') + zcMeView(fake) + '</div></div>';
}
(function () {
  const o = scrChat; scrChat = function () {
    if (!S || !zcI().zc.list && !S.zc.sel) return o();
    if (S.zc.sel === '__me') return zcProfView(); const g = zcCur(); if (S.zc.sel && g) return zcGroupView(g); if (S.zc.list) return zcListView(); return o();
  };
})();
// ---------- الإجراءات
function zcHydrate() { const g = zcCur(), th = $('#thread'); if (g && th) GRP.hydrate(th, API, g.key); }
function zcOpenGroup(id) { S.zc.sel = id; S.zc.list = false; S.zc.tab = 'chat'; const g = S.grp[id]; if (g) g.unread = 0; clearInterval(ZC.t); ZC.t = setInterval(() => { if (!document.hidden && S && S.chat && S.zc.sel) zcPoll().then((n) => { if (n) render(); }); }, 7000); }
function zcImgFile(g, f, tool) {
  toast('جارٍ ضغط الصورة وتشفيرها…');
  return GRP.shrink(f, 240000).then((u8) => HXC.gSealBytes(g.key, u8)).then((c) => api('POST', '/v1/g/media', { gid: g.gid, ga: g.ga, c })).then((r) => zcPost(g, tool ? { t: 'act', tool, k: r.key } : { t: 'img', k: r.key })).then(() => zcPoll()).then(() => { render(); toast(tool ? 'تم تسجيل إنجازك ✓' : 'أُرسلت الصورة'); }).catch((e) => toast('⚠ ' + e.message));
}
function zcActs2(a, v) {
  zcI(); const g = zcCur();
  switch (a) {
    case 'chat': if (!zcList().length) return false; S.chat = true; S.zc.list = true; S.zc.sel = ''; sheet = null; render(); return true;
    case 'chatClose': if (zcList().length && !S.zc.list && !S.zc.sel) { S.zc.list = true; render(); return true; } if (S.zc.list || S.zc.sel) { S.chat = false; S.zc.list = false; S.zc.sel = ''; clearInterval(ZC.t); render(); return true; } return false;
    case 'zcSpec': S.zc.list = false; S.zc.sel = ''; render(); return true;
    case 'zcOpen': zcOpenGroup(v); render(); zcHydrate(); zcPoll().then((n) => { if (n) { render(); } }); return true;
    case 'zcBack': S.zc.sel = ''; S.zc.list = true; clearInterval(ZC.t); render(); return true;
    case 'zcMe': S.zc.sel = '__me'; render(); return true;
    case 'zcTab': S.zc.tab = v; render(); zcHydrate(); return true;
    case 'zcSend': { const t = $('#chatIn'), x = t && t.value.trim(); if (!g || !x) return true; t.disabled = true; zcPost(g, { t: 'm', x: x.slice(0, 1500) }).then(() => zcPoll()).then(() => render()).catch((e) => { toast('⚠ ' + e.message); render(); }); return true; }
    case 'zcPick': { const f = $('#zcImg'); if (f) f.click(); return true; }
    case 'zcAct': {
      if (!g || !g.chal) return true; const t = GRP.byId(v), l = GRP.todayLeft(g.msgs, g.chal, S.cid, now()).find((x) => x.id === v); if (!t || !l || !l.left) return true;
      if (t.photo) { ZC.pend = v; const f = $('#zcImg'); if (f) f.click(); return true; }
      zcPost(g, { t: 'act', tool: v }).then(() => zcPoll()).then(() => { render(); toast('+' + l.pts + ' نقطة ' + t.ico); }).catch((e) => toast('⚠ ' + e.message)); return true;
    }
    case 'zcPhoto': { const f = $('#zcPhotoIn'); if (f) f.click(); return true; }
    case 'zcSaveProf': { const n = ($('#zcNm').value || '').trim().slice(0, 30); S.prof.nm = n; save(); zcList().forEach((x) => zcProfile(x)); toast('تم الحفظ'); render(); return true; }
    case 'zcCompAdd': { const c = GRP.normCode(($('#zcCode').value || '')); if (c === GRP.codeOf(S.cid)) { toast('هذا رمزك أنت'); return true; } if (S.comp.map(GRP.normCode).includes(c)) { toast('مضاف مسبقاً'); return true; } if (!zcFind(c)) { toast('لم نجد هذا الرمز بين أعضاء مجموعاتك — يظهر الرفيق حين يضمّكما الأخصائي في مجموعة واحدة'); return true; } S.comp.push(c); save(); toast('أُضيف رفيق الرحلة 🤝'); render(); return true; }
    case 'zcCompDel': S.comp = S.comp.filter((c) => c !== v); save(); render(); return true;
  }
  return false;
}
document.addEventListener('change', (e) => {
  const t = e.target; if (!t || !S || !t.files || !t.files[0]) return; const f = t.files[0];
  if (t.id === 'zcImg') { const g = zcCur(), tool = ZC.pend; ZC.pend = null; t.value = ''; if (g) zcImgFile(g, f, tool); }
  else if (t.id === 'zcPhotoIn') {                                       // صورة الملف الشخصي: مصغّرة جداً (96px) لتصل الأعضاء داخل رسالة
    const url = URL.createObjectURL(f), im = new Image(); im.onload = () => { URL.revokeObjectURL(url); const s = Math.min(1, 96 / Math.min(im.width, im.height)), cv = document.createElement('canvas'), w = Math.round(im.width * s), h = Math.round(im.height * s), m = Math.min(w, h); cv.width = cv.height = m; cv.getContext('2d').drawImage(im, (w - m) / 2 / s, (h - m) / 2 / s, m / s, m / s, 0, 0, m, m); S.prof.ph = cv.toDataURL('image/jpeg', 0.7); save(); zcList().forEach((x) => zcProfile(x)); render(); }; im.src = url; t.value = '';
  }
});
document.addEventListener('keydown', (e) => { const t = e.target; if (e.key !== 'Enter' || e.shiftKey || e.isComposing || !t || t.id !== 'chatIn' || !S || !S.zc || !S.zc.sel) return; e.preventDefault(); e.stopImmediatePropagation(); const b = t.parentNode.querySelector('[data-act="zcSend"]'); if (b) b.click(); }, true);
window.ZCX = { list: zcList, poll: zcPoll, board: (id) => GRP.board(S.grp[id].msgs, S.grp[id].chal), cur: zcCur, in: zcIn };      // للاختبارات
