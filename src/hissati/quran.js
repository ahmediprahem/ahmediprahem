// ---- 0.61: «وردي من القرآن» في «عاداتي» — ختمة بمدة يختارها العميل، يقسّمها التطبيق على الأيام (بحدود أرباع الأحزاب)،
// ويعيد التوزيع كل يوم من حيث وصل (لا تراكم)، مع تذكير يومي وقراءة حرة لأي سورة. يستعمل نص Tanzil والقارئ نفسه (scrReader).
const QK_DAYS = [7, 10, 15, 20, 30, 40, 60, 90, 120, 180, 240];
const qkT = () => dkey(new Date());
function qkDayNo(k) { const Q = S.qk; return Math.max(0, Math.round((new Date((k || qkT()) + 'T12:00') - new Date(Q.start + 'T12:00')) / 864e5)); }
function qkToday() {                                   // ورد اليوم يُثبَّت عند أول فتح: من الموضع الحالي، والباقي ÷ الأيام الباقية
  const Q = S.qk, k = qkT();
  if (!Q.today || Q.today.d !== k) { if (Q.pos >= 240) { Q.done = (Q.done || 0) + 1; Q.pos = 0; Q.start = k; Q.bm = -1; }
    const left = Math.max(1, Q.days - qkDayNo(k)), n = Math.max(1, Math.min(240 - Q.pos, Math.ceil((240 - Q.pos) / left))); Q.today = { d: k, b: Q.pos, n }; }
  return Q.today;
}
function qkRange(T) { const a = khAbs(...QM.hq[T.b]), e = T.b + T.n < 240 ? khAbs(...QM.hq[T.b + T.n]) - 1 : 6235; return { a, e, n: e - a + 1 }; }
function qkDoneToday() { const Q = S.qk, T = qkToday(); return Q.pos >= T.b + T.n; }
function qkSurahStartRub(s) { const a = khAbs(s, 1); let r = 0; for (let i = 0; i < 240; i++) if (khAbs(...QM.hq[i]) <= a) r = i; return r; }
function qkCard() {
  const Q = S.qk;
  if (!Q || !Q.on) return '<section class="card stack qkc"><div class="row" style="gap:12px;align-items:center"><span class="qkic" aria-hidden="true">📖</span><div style="flex:1"><h3>وردي من القرآن</h3><p class="dim">حدّد مدة ختمتك، ويقسّمها «زنها» على الأيام ويذكّرك بوردك.</p></div></div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-act="qkSetup">ابدأ ختمة</button><button class="btn sec" data-act="qkFree">' + I('book') + ' المصحف</button></div></section>';
  const T = qkToday(), r = qkRange(T), done = qkDoneToday(), pct = Math.round(Math.min(240, Q.pos) / 240 * 100), day = Math.min(Q.days, qkDayNo() + 1), bm = Q.bm != null && Q.bm >= r.a && Q.bm < r.e ? Q.bm : -1;
  return '<section class="card stack qkc"><div class="row" style="justify-content:space-between;align-items:center"><h3>📖 وردي من القرآن</h3><button class="btn sm sec" data-act="qkSetup" aria-label="إعداد الختمة">' + I('settings') + '</button></div>'
    + '<div class="dim">ختمة في ' + Q.days + ' يوماً • اليوم ' + day + ' من ' + Q.days + ((Q.done || 0) ? ' • الختمة ' + (Q.done + 1) : '') + '</div>'
    + '<div class="khbar2" role="img" aria-label="أنجزت ' + pct + '% من الختمة"><i style="width:' + pct + '%"></i></div>'
    + (done ? '<p><b>أتممت ورد اليوم ✓</b> <span class="dim">' + pct + '% من الختمة</span></p>' : '<p><b>' + esc(khRange(r.a, r.e)) + '</b> <span class="dim">• ' + r.n + ' آية' + (bm > -1 ? ' • توقفت عند ' + esc(khPos(bm)) : '') + '</span></p>')
    + '<div class="row" style="gap:8px;flex-wrap:wrap">' + (done ? '<button class="btn sec" data-act="qkMore">اقرأ المزيد</button>' : '<button class="btn" data-act="qkRead">' + I('book') + (bm > -1 ? ' أكمل من ' + esc(khPos(bm + 1)) : ' اقرأ وردي') + '</button>') + '<button class="btn sec" data-act="qkFree">المصحف</button></div>'
    + (Q.rt ? '<small class="dim">' + I('clock') + ' تذكير يومي ' + esc(hm12(Q.rt)) + (S.cid ? '' : ' (التذكير يصل لحسابات أخصائي التغذية فقط حالياً)') + '</small>' : '') + '</section>';
}
function qkSetupSheet() {
  const Q = S.qk || {}, f = sheet.f = sheet.f || { days: Q.days || 30, from: 0, rt: Q.rt || '' };
  return ['ختمة القرآن', '<p class="dim">في كم يوماً تريد أن تختم؟ يقسّمها التطبيق على الأيام، ويعيد التوزيع إن تأخرت أو تقدّمت.</p><div class="chips">' + QK_DAYS.map((d) => '<button class="chip' + (+f.days === d ? ' on' : '') + '" data-act="qkSet" data-k="days" data-v="' + d + '">' + (d === 30 ? 'شهر' : d === 60 ? 'شهران' : d === 90 ? '3 أشهر' : d === 180 ? '6 أشهر' : d === 240 ? '8 أشهر' : d + ' أيام') + '</button>').join('') + '</div>'
    + '<p class="dim">≈ ' + Math.round(6236 / f.days) + ' آية في اليوم (الجهد متقارب بحدود الأرباع)</p>'
    + '<div class="field"><label for="qkFrom">أبدأ من</label><select class="inp" id="qkFrom"><option value="0">أول المصحف (الفاتحة)</option>' + QM.n.map((n, i) => i ? '<option value="' + (i + 1) + '"' + (+f.from === i + 1 ? ' selected' : '') + '>سورة ' + esc(n) + '</option>' : '').join('') + '</select></div>'
    + '<div class="field"><label for="qkRt">تذكير يومي (اختياري)</label><input class="inp tm" id="qkRt" type="time" step="900" value="' + esc(f.rt) + '"></div>'
    + '<button class="btn full" data-act="qkSave">' + (Q.on ? 'احفظ وأعد التقسيم من موضعي' : 'ابدأ الختمة') + '</button>'
    + (Q.on ? '<button class="btn full sec" data-act="qkStop">إيقاف الختمة</button>' : '')];
}
function scrQuranFree() {                              // المصحف: قائمة السور مع بحث، وأكمل من آخر موضع
  const q = (V.qfree.q || '').trim(), bm = S.qfreeBm;
  const list = QM.n.map((n, i) => [i + 1, n, QM.s[i][1]]).filter((x) => !q || x[1].includes(q) || String(x[0]) === q);
  return '<div class="scr khs"><div class="scroll"><div class="stack">' + head('المصحف', 'qkFreeX', '', '114 سورة')
    + (bm != null && bm > -1 ? '<button class="btn full" data-act="qkFreeGo" data-v="' + bm + '">' + I('book') + ' أكمل من ' + esc(khPos(bm)) + '</button>' : '')
    + '<label class="srch">' + I('sparkle') + '<input id="qkq" data-qkq="1" placeholder="ابحث عن سورة…" value="' + esc(q) + '"></label>'
    + '<div class="qklist">' + list.map((x) => '<button class="qksr" data-act="qkSurah" data-v="' + x[0] + '"><span class="qkn">' + x[0] + '</span><b>' + esc(x[1]) + '</b><small class="dim">' + x[2] + ' آية</small></button>').join('') + '</div>'
    + '</div></div></div>';
}
function qkAct(a, v, el) {
  const Q = S.qk;
  switch (a) {
    case 'qkSetup': sheet = { t: 'qkSetup' }; return true;
    case 'qkSet': sheet.f[el.dataset.k] = +v; return true;
    case 'qkSave': { const f = sheet.f, from = +(($('#qkFrom') || {}).value || 0), rt = (($('#qkRt') || {}).value || '').slice(0, 5);
      if (Q && Q.on) { Q.days = Math.max(qkDayNo() + 1, +f.days); Q.rt = rt; Q.today = null; if (from) { Q.pos = qkSurahStartRub(from); Q.bm = -1; } }
      else S.qk = { on: 1, days: +f.days, start: qkT(), pos: from ? qkSurahStartRub(from) : 0, bm: -1, rt, done: 0 };
      sheet = null; save(); if (typeof remSync === 'function') remSync(true); toast('بدأت الختمة. وردك اليوم جاهز'); return true; }
    case 'qkStop': if (Q) Q.on = 0; sheet = null; save(); if (typeof remSync === 'function') remSync(true); return true;
    case 'qkRead': case 'qkMore': { if (!Q) return false; const T = a === 'qkMore' ? { b: Math.min(239, Q.pos), n: 1 } : qkToday(), r = qkRange(T), bm = Q.bm != null && Q.bm >= r.a && Q.bm < r.e ? Q.bm : -1; V.qr = { a: r.a, e: r.e, src: 'qk', rubEnd: T.b + T.n, jump: bm > -1 ? bm + 1 : null }; return true; }
    case 'qkDone': { if (!Q || !V.qr) return false; Q.pos = Math.max(Q.pos, V.qr.rubEnd || 0); Q.bm = V.qr.e;
      if (Q.pos >= 240) toast('ختمت القرآن. تقبّل الله منك'); else toast('أتممت ورد اليوم. تقبّل الله منك'); khAudioStop(); V.qr = null; save(); return true; }
    case 'qkFree': V.qfree = { q: '' }; return true;
    case 'qkFreeX': V.qfree = null; return true;
    case 'qkSurah': { const s = +v, a0 = khAbs(s, 1); V.qr = { a: a0, e: a0 + QM.s[s - 1][1] - 1, src: 'free' }; return true; }
    case 'qkFreeGo': { const i = +v, [s] = khRel(i), a0 = khAbs(s, 1); V.qr = { a: a0, e: a0 + QM.s[s - 1][1] - 1, src: 'free', jump: i }; return true; }
  }
  return false;
}
function qkBmSet(i, src) {                             // نقطة التوقف في الختمة أو في القراءة الحرة
  if (src === 'qk' && S.qk) { S.qk.bm = i; const T = qkToday(), r = qkRange(T); if (i >= r.e && S.qk.pos < T.b + T.n) { S.qk.pos = T.b + T.n; toast('وصلت لنهاية ورد اليوم. تقبّل الله منك'); return; } }
  else S.qfreeBm = i;
  toast('حُفظ موضعك: ' + khPos(i));
}
