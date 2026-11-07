// ---- 0.58: «تحدي الخمس» (شهر): الصلاة في وقتها، الورد بالآيات (ختمة)، الماء، أذكار الصباح والمساء، ساعة تطوير
// القرارات في docs/challenge_khams_AR.md. بيانات العبادة تبقى على الجوال (لا تُرسل للأخصائي)، ولا نقاط عليها.
// نص المصحف من Tanzil بلا أي تعديل: يُطلب من /q/v1/quran.txt عند فتح القارئ فقط ويُحفظ على الجوال. الصوت اختياري ومع الإنترنت فقط.
const QM = /*QMETA*/null;                               // {n: أسماء السور، s: [بداية السورة، عدد آياتها]، hq: 241 حدّ ربع حزب [سورة، آية]}
const KH_LV = {
  b: { n: 'بداية', r: 1, sp: [1], sk: 20, d: 'ربع حزب بعد الفجر • 20 دقيقة تطوير • ختمة في 8 أشهر' },
  s: { n: 'ثابت', r: 4, sp: [1, 1, 1, 1], sk: 40, d: 'نصف جزء على 4 صلوات • 40 دقيقة • ختمة في شهرين' },
  k: { n: 'كامل', r: 8, sp: [2, 2, 2, 1, 1], sk: 60, d: 'جزء على 5 صلوات • ساعة • ختمة في شهر' }
};
const KH_PR = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'], KH_DAYS = 30, KH_RQ = 'https://everyayah.com/data/Alafasy_128kbps/';
const khT = () => new Date();
const khLog = (t) => khDk(t) === dkey(new Date()) ? dl(TODAY) : ((S.log || {})[khDk(t)] || {});
const khFem = () => S.p.sex === 'أنثى';
const khAbs = (s, a) => QM.s[s - 1][0] + a - 1;          // رقم الآية في المصحف كله (0..6235)
function khRel(i) { for (let k = 0; k < QM.s.length; k++) { const x = QM.s[k]; if (i >= x[0] && i < x[0] + x[1]) return [k + 1, i - x[0] + 1]; } return [114, 6]; }
// أوراد اليوم من موضع البداية (ربع حزب): كل ورد {p: رقم الصلاة، a: أول آية، e: آخر آية، n: عدد الآيات، r: عدد الأرباع}
function khPortions(lv, base) {
  const L = KH_LV[lv] || KH_LV.b, out = []; let c = base;
  L.sp.forEach((n, i) => { if (c >= 240) return; const m = Math.min(n, 240 - c), a = khAbs(...QM.hq[c]), e = c + m < 240 ? khAbs(...QM.hq[c + m]) - 1 : 6235; out.push({ p: i, a, e, n: e - a + 1, r: m }); c += m; });
  return out;
}
function khRange(a, e) { const f = khRel(a), t = khRel(e); return f[0] === t[0] ? QM.n[f[0] - 1] + ' ' + f[1] + '–' + t[1] : 'من ' + QM.n[f[0] - 1] + ' ' + f[1] + ' إلى ' + QM.n[t[0] - 1] + ' ' + t[1]; }
const khDk = (t) => dkey(new Date(t));
function khDayNo(t) { const K2 = S.kh; return Math.floor((new Date(khDk(t) + 'T12:00') - new Date(K2.start + 'T12:00')) / 864e5) + 1; }
function khDay(t) {                                    // سجل اليوم، ويُثبَّت موضع ورده عند أول فتح (فيكمل من حيث توقف)
  const K2 = S.kh, k = khDk(t); K2.days = K2.days || {};
  if (!K2.days[k]) { if (K2.pos >= 240) { K2.pos = 0; K2.kc = (K2.kc || 0) + 1; } K2.days[k] = { b: K2.pos, lv: K2.lv, pr: [0, 0, 0, 0, 0], wd: [], am: 0, pm: 0, sk: 0, hard: 0, exc: 0 }; }
  return K2.days[k];
}
function khWaterGoal(t) { if (!S.plan || !S.plan.length) return (S.kh && S.kh.wg) || null; const dp = dayPlan(t.getDay()), wt = +(dp.water || DATA.water) || 0; return wt ? Math.max(4, Math.min(16, Math.round(wt / CUP))) : 8; }
function khState(t) {                                  // [الصلاة، الورد، الماء، الأذكار، التطوير] لليوم
  const D = khDay(t), L = KH_LV[D.lv] || KH_LV.b, P = khPortions(D.lv, D.b), exc = D.exc && khFem(), w = (khLog(t).water || 0);
  return [exc || D.pr.every(Boolean), exc || (D.hard ? P.some((p) => D.wd[p.p]) : P.every((p) => D.wd[p.p])), (D.hard ? w >= 2 : khWaterGoal(t) ? w >= khWaterGoal(t) : false), D.hard ? !!(D.am || D.pm) : !!(D.am && D.pm), D.sk >= (D.hard ? 10 : L.sk)];
}
function khScore(k) { const K2 = S.kh, D = (K2.days || {})[k]; if (!D) return -1; if (D.cmp) return 3; return khState(new Date(k + 'T12:00')).filter(Boolean).length; }
function khAdvance(D) {                                // الموضع = بداية اليوم + أرباع الأوراد المقروءة على التوالي
  const P = khPortions(D.lv, D.b); let r = 0; for (const p of P) { if (!D.wd[p.p]) break; r += p.r; }
  const K2 = S.kh; K2.pos = D.b + r;
  if (K2.pos >= 240 && !K2.done240) { K2.done240 = 1; setTimeout(() => toast('ختمت القرآن. تقبّل الله منك'), 60); }
}
// نقطة التوقف: آخر آية قرأها العميل (رقمها في المصحف كله)، وما بقي من أوراد اليوم بالآيات
function khBm() {                                       // من اليوم، أو من يوم سابق إن كانت داخل أوراد اليوم (توقف في منتصف ورد أمس)
  const b = (S.kh || {}).bm; if (!b) return -1; if (b.d === khDk(khT())) return b.i;
  const D = khDay(khT()), P = khPortions(D.lv, D.b); return P.length && b.i >= P[0].a && b.i < P[P.length - 1].e ? b.i : -1;
}
function khLeft(D, P) { const bm = khBm(); return P.filter((p) => !D.wd[p.p]).reduce((a, p) => a + (bm >= p.a && bm <= p.e ? p.e - bm : p.n), 0); }
function khPos(i) { const r = khRel(i); return QM.n[r[0] - 1] + ' ' + r[1]; }
function khPrNames(t) { const fri = new Date(t).getDay() === 5 && S.p.sex !== 'أنثى'; return ['الفجر', fri ? 'الجمعة' : 'الظهر', 'العصر', 'المغرب', 'العشاء']; }
function khPrTimes() { const P = typeof prNow === 'function' ? prNow() : null; return P ? KH_PR.map((k) => hm12(m2hm(P[k]))) : null; }
// ---- بطاقة الرئيسية: مختصرة، والشاشة الكاملة عند اللمس
function khCard() {
  const K2 = S.kh;
  if (!K2 || !K2.on) return (K2 && K2.offer) || !K2 ? '<section class="card stack khc"><div class="row"><span class="khmk" aria-hidden="true">' + khMark(0) + '</span><div style="flex:1"><h3>تحدي الخمس</h3><div class="dim">شهر: الصلاة في وقتها، ختمة بالآيات، الماء، الأذكار، وساعة تطوير يومياً.</div></div></div><button class="btn full" data-act="khStart">ابدأ التحدي</button></section>' : '';
  const n = khState(khT()).filter(Boolean).length, day = Math.min(KH_DAYS, khDayNo(khT()));
  return '<button class="card khc khmini" data-act="khOpen"><span class="khmk" aria-hidden="true">' + khMark(n) + '</span><span style="flex:1;text-align:right"><b>تحدي الخمس • اليوم ' + day + ' من ' + KH_DAYS + '</b><small class="dim">' + (n === 5 ? 'اكتمل يومك' : n >= 3 ? 'يومك ناجح • باقي ' + (5 - n) : n + ' من 5') + (() => { const D = khDay(khT()), l = khLeft(D, khPortions(D.lv, D.b)), b = khBm(); return l ? ' • باقي ' + l + ' آية' + (b > -1 ? ' (توقفت عند ' + esc(khPos(b)) + ')' : '') : ''; })() + '</small></span>' + I('back') + '</button>';
}
function khMark(n) { return '<svg viewBox="-36 -36 72 72"><path d="' + KH_PC + '" fill="' + (n >= 3 ? 'var(--mint)' : 'rgba(255,255,255,.16)') + '"/><path d="' + KH_PC + '" transform="rotate(180)" fill="' + (n >= 5 ? 'var(--mint)' : 'rgba(255,255,255,.16)') + '"/></svg>'; }
const KH_PC = 'M-30 -19Q-30 -30 -19 -30L28.4 -30Q30 -30 30 -28.4L30 -16.73Q30 -16 29.45 -15.52L14.26 -2.39Q13.81 -2 13.22 -2L-4.89 -2Q-9.19 -2 -5.94 -4.81L5.38 -14.59Q7 -16 4.85 -16L-28.4 -16Q-30 -16 -30 -17.6Z';
// ---- الشاشة الكاملة
function scrKhams() {
  const K2 = S.kh, D = khDay(khT()), L = KH_LV[D.lv] || KH_LV.b, P = khPortions(D.lv, D.b), st = khState(khT()), n = st.filter(Boolean).length, fem = khFem(), exc = D.exc && fem;
  const PN = khPrNames(khT()), PT = khPrTimes(), day = khDayNo(khT()), wg = D.hard ? 2 : khWaterGoal(khT()), w = dl(TODAY).water || 0, skG = D.hard ? 10 : L.sk;
  const tog = (on, act, v, t, s, off) => '<button class="khtog' + (on ? ' on' : '') + '" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + !!on + '"' + (off ? ' disabled' : '') + '>' + t + (s ? '<small>' + s + '</small>' : '') + '</button>';
  const ck = (ok, off) => '<span class="khck' + (off ? ' off' : ok ? ' on' : '') + '" role="img" aria-label="' + (off ? 'خارج الحساب' : ok ? 'تم' : 'لم يكتمل') + '">' + (off ? '' : '<svg viewBox="-32 -32 64 32"><path d="' + KH_PC + '"/></svg>') + '</span>';
  // التالي: فعل واحد
  let nx = ''; const uw = exc ? null : P.find((p) => D.pr[p.p] && !D.wd[p.p]), ni = D.pr.indexOf(0);
  const bm = khBm(), left = khLeft(D, P);
  if (uw) { const inB = bm >= uw.a && bm < uw.e; nx = '<small>التالي</small><b>ورد ' + PN[uw.p] + '</b><span>' + (inB ? 'توقفت عند ' + esc(khPos(bm)) + ' • باقي ' + (uw.e - bm) + ' آية من هذا الورد' : esc(khRange(uw.a, uw.e)) + ' • ' + uw.n + ' آية') + '</span><button class="btn khgo" data-act="khRead" data-v="' + uw.p + '">' + I('book') + (inB ? ' أكمل من ' + esc(khPos(bm + 1)) : ' افتح الورد') + '</button>'; }
  else if (!exc && ni > -1) { const wp = P.find((p) => p.p === ni); nx = '<small>التالي</small><b>صلاة ' + PN[ni] + (PT ? ' • ' + PT[ni] : '') + '</b><span>' + (wp ? (bm >= wp.a && bm < wp.e ? 'وبعدها أكمل ورد ' + PN[ni] + ' من ' + esc(khPos(bm + 1)) : 'وبعدها ورد ' + PN[ni] + ': ' + esc(khRange(wp.a, wp.e))) : 'وكوب ماء') + '</span><button class="btn khgo" data-act="khPr" data-v="' + ni + '">صلّيت ' + PN[ni] + '</button>'; }
  else if (!st[2] && wg) nx = '<small>التالي</small><b>كوب ماء</b><span>' + w + ' من ' + wg + ' أكواب</span><button class="btn khgo" data-act="khW" data-v="1">شربت كوباً</button>';
  else if (!st[3]) nx = '<small>التالي</small><b>' + (D.am ? 'أذكار المساء' : 'أذكار الصباح') + '</b><span>' + (D.am ? 'بعد العصر' : 'بعد الفجر') + '</span><button class="btn khgo" data-act="khAz" data-v="' + (D.am ? 'pm' : 'am') + '">' + I('play') + ' ابدأ ' + (D.am ? 'أذكار المساء' : 'أذكار الصباح') + '</button>';
  else if (!st[4]) nx = '<small>التالي</small><b>ساعة التطوير' + (K2.skill ? ': ' + esc(K2.skill) : '') + '</b><span>' + D.sk + ' من ' + skG + ' دقيقة</span><button class="btn khgo" data-act="khSk" data-v="10">أضف 10 دقائق</button>';
  else nx = '<small>اليوم</small><b>' + (n === 5 ? 'اكتمل يومك كله' : 'لا شيء متبقٍ') + '</b><span>نلقاك غداً بإذن الله.</span>';
  // الأركان
  const prSub = PN.map((p, i) => tog(D.pr[i], 'khPr', i, p, PT ? PT[i] : '', exc)).join('');
  const wdSub = P.map((p) => '<span class="khwd">' + tog(D.wd[p.p], 'khWd', p.p, 'بعد ' + PN[p.p], esc(khRange(p.a, p.e)) + ' • ' + p.n + ' آية', exc) + '<button class="khrd" data-act="khRead" data-v="' + p.p + '" aria-label="اقرأ ورد ' + PN[p.p] + '">' + I('book') + '</button></span>').join('');
  const tot = P.reduce((a, p) => a + p.n, 0);
  const row = (k, t, s, ok, sub, off) => '<div class="khrow"><div><b>' + t + '</b><small>' + s + '</small></div>' + ck(ok, off) + '<div class="khsub">' + sub + '</div></div>';
  // الأسبوع: آخر 7 أيام، و«لا تفوّت يومين» ويوم تعويض في الأسبوع
  const wk = []; for (let i = 6; i >= 0; i--) { const t = new Date(khT().getTime() - i * 864e5), k = khDk(t), sc = k < K2.start ? -2 : khScore(k), lbl = t.toLocaleDateString('ar', { weekday: 'short' }); wk.push([k, sc, lbl, i === 0]); }
  const missed = wk.filter((x) => !x[3] && x[1] >= -1 && x[1] < 3 && x[1] !== -2), wkStart = khDk(new Date(khT().getTime() - ((khT().getDay() + 1) % 7) * 864e5)), cmpUsed = Object.keys(K2.days || {}).some((k) => k >= wkStart && K2.days[k].cmp);
  const lastMiss = missed.filter((x) => x[0] >= wkStart).pop();
  const twice = wk.slice(-3, -1).every((x) => x[1] >= -1 && x[1] < 3 && x[1] !== -2);
  const keep = day >= 25 ? '<section class="card stack"><h3>ماذا تكمل بعد التحدي؟</h3><p class="dim">اختر ركنين تحتفظ بهما بعد الشهر.</p><div class="khsub">' + ['الصلاة', 'الورد', 'الماء', 'الأذكار', 'التطوير'].map((x, i) => tog((K2.keep || []).includes(i), 'khKeep', i, x)).join('') + '</div></section>' : '';
  const fin = day >= KH_DAYS ? (K2.cert ? '<button class="btn full sec" data-act="khCertOpen">' + I('share') + ' شهادتي: شارك أو نزّل</button>' : '<section class="card stack"><h3>أتممت الثلاثين يوماً</h3><p class="dim">شهادتك جاهزة، وفيها ما أنجزته بالأرقام. تستطيع مشاركتها أو تنزيلها.</p><button class="btn full" data-act="khCert">' + I('check') + ' استلم شهادتي</button></section>') : '';
  const hd = S.guest ? '<div class="hd"><div class="t"><div class="stepk">اليوم ' + Math.min(day, KH_DAYS) + ' من ' + KH_DAYS + '</div><h2>تحدي الخمس</h2></div><button class="back" data-act="khGuide" aria-label="عن التحدي">؟</button></div>' + khInstallBox(true) : head('تحدي الخمس', 'khX', '', 'اليوم ' + Math.min(day, KH_DAYS) + ' من ' + KH_DAYS);
  const tab = V.khTab || 'day', T = [['day', 'اليوم'], ['quran', 'القرآن'], ['adhkar', 'الأذكار'], ['prog', 'سجلّي']];
  const tabs = '<div class="segc khtabs" role="tablist">' + T.map((t) => '<button role="tab" class="' + (tab === t[0] ? 'on' : '') + '" aria-selected="' + (tab === t[0]) + '" data-act="khTab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
  let body = '';
  if (tab === 'day') body = '<div class="card khpil">'
    + row('pr', 'الصلاة في وقتها', exc ? 'خارج الحساب في أيام العذر' : D.pr.filter(Boolean).length + ' من 5', st[0], prSub, exc)
    + row('wd', 'الورد', exc ? 'خارج الحساب في أيام العذر' : (P.length ? (left && left < tot ? 'باقي اليوم ' + left + ' من ' + tot + ' آية' : left ? tot + ' آية اليوم' : 'أتممت ورد اليوم') + ' • ' + L.n + ((K2.kc || 0) ? ' • الختمة ' + (K2.kc + 1) : '') : 'أتممت الختمة'), st[1], wdSub, exc)
    + (wg ? row('wa', 'الماء', w + ' من ' + wg + ' أكواب' + (D.hard ? '' : S.plan ? ' • حسب خطتك' : ''), st[2], '<span class="stepper"><button class="btn sm sec" data-act="khW" data-v="-1" aria-label="كوب أقل">−</button><b>' + w + '</b><button class="btn sm sec" data-act="khW" data-v="1" aria-label="كوب أكثر">+</button></span>')
      : row('wa', 'حدّد هدفك من الماء', 'عدد الأكواب في يومك. حدده بنفسك أو مع طبيبك، ويُحسب يومك من الأركان الأخرى حتى تحدده.', false, '<div class="khwg" role="group" aria-label="هدف الماء بالأكواب">' + Array.from({ length: 13 }, (_, j) => '<button class="chip" data-act="khWgSet" data-v="' + (j + 4) + '">' + (j + 4) + '</button>').join('') + '</div>'))
    + row('az', 'أذكار الصباح والمساء', D.hard ? 'واحد منهما يكفي اليوم' : 'الاثنان', st[3], tog(D.am, 'khAm', '', 'الصباح', 'بعد الفجر') + tog(D.pm, 'khPm', '', 'المساء', 'بعد العصر') + '<button class="khrd" data-act="khTab" data-v="adhkar" aria-label="افتح الأذكار">' + I('play') + '</button>')
    + row('sk', 'ساعة التطوير', (K2.skill ? esc(K2.skill) + ' • ' : '') + D.sk + ' من ' + skG + ' دقيقة', st[4], tog(0, 'khSk', 10, '+ 10 دقائق') + tog(0, 'khSk', -D.sk, 'تصفير') + tog(0, 'khSkill', '', K2.skill ? 'غيّر المهارة' : 'اختر المهارة'))
    + '</div>';
  else if (tab === 'quran') { const rubs = (K2.pos || 0), pct = Math.round(Math.min(240, rubs) / 240 * 100), jz = Math.floor(Math.min(240, rubs) / 8);
    body = '<section class="card stack"><div class="row" style="justify-content:space-between"><h3>الختمة' + ((K2.kc || 0) ? ' ' + (K2.kc + 1) : '') + '</h3><b>' + pct + '%</b></div><div class="khbar2"><i style="width:' + pct + '%"></i></div><p class="dim">قرأت ' + jz + ' جزءاً من 30' + (bm > -1 ? ' • توقفت عند ' + esc(khPos(bm)) : '') + '</p></section>'
      + '<section class="card stack"><h3>أوراد اليوم' + (exc ? ' (خارج الحساب)' : '') + '</h3>' + (P.length ? P.map((p) => { const inB = bm >= p.a && bm < p.e; return '<div class="khqr' + (D.wd[p.p] ? ' on' : '') + '"><div><b>بعد ' + PN[p.p] + '</b><small>' + esc(khRange(p.a, p.e)) + ' • ' + p.n + ' آية' + (inB ? ' • توقفت عند ' + esc(khPos(bm)) : '') + '</small></div><button class="btn sm' + (D.wd[p.p] ? ' sec' : '') + '" data-act="khRead" data-v="' + p.p + '">' + I('book') + (D.wd[p.p] ? ' قرأته ✓' : inB ? ' أكمل' : ' اقرأ') + '</button></div>'; }).join('') : '<p class="dim">أتممت الختمة. تقبّل الله منك.</p>') + '</section>'; }
  else if (tab === 'adhkar') { const ap = D.azp || {}, card = (k, t, when, list) => { const done = D[k], at = Math.min(ap[k] || 0, list.length); return '<button class="card khazc' + (done ? ' on' : '') + '" data-act="khAz" data-v="' + k + '"><span class="khazi" aria-hidden="true">' + (k === 'am' ? '☀️' : '🌙') + '</span><span style="flex:1;text-align:right"><b>' + t + '</b><small class="dim">' + when + ' • ' + list.length + ' ذكراً' + (done ? ' • تمت ✓' : at ? ' • وصلت للذكر ' + (at + 1) : '') + '</small></span><span class="btn sm' + (done ? ' sec' : '') + '">' + (done ? 'أعد' : at ? 'أكمل' : 'ابدأ') + '</span></button>'; };
    body = card('am', 'أذكار الصباح', 'بعد الفجر', ADHKAR) + card('pm', 'أذكار المساء', 'بعد العصر', ADHKAR_PM)
      + '<button class="card khazc" data-act="khAz" data-v="tb"><span class="khazi" aria-hidden="true">📿</span><span style="flex:1;text-align:right"><b>التسبيح بعد الصلاة</b><small class="dim">سبحان الله 33 • الحمد لله 33 • الله أكبر 33 • وتمام المائة</small></span><span class="btn sm">ابدأ</span></button>'
      + '<button class="card khazc" data-act="khAz" data-v="free"><span class="khazi" aria-hidden="true">📿</span><span style="flex:1;text-align:right"><b>سبحة حرة</b><small class="dim">' + (D.freeC ? 'المجموع اليوم ' + D.freeC : 'عدّاد مفتوح لأي ذكر') + '</small></span><span class="btn sm sec">افتح</span></button>'
      + '<p class="dim">بطريقة السبحة: المس الحلقة لكل مرة فتضيء حبة، وينتقل للذكر التالي تلقائياً. أذكار الصباح والمساء من «حصن المسلم»، والتلاوة الصوتية اختيارية مع الإنترنت.</p>'; }
  else body = '<section class="card stack"><h3>أسبوعك</h3><div class="khwk">' + wk.map((x) => '<span class="' + (x[1] === -2 ? 'na' : x[1] >= 5 ? 'f' : (K2.days[x[0]] || {}).cmp ? 'c' : x[1] >= 3 ? 'p' : x[3] ? '' : x[1] >= -1 ? 'x' : 'na') + (x[3] ? ' t' : '') + '"><i></i>' + esc(x[2]) + '</span>').join('') + '</div>'
      + (lastMiss && !cmpUsed ? '<button class="btn sm sec" data-act="khCmp" data-v="' + lastMiss[0] + '">عوّض ' + esc(lastMiss[2]) + ' بيوم التعويض</button>' : '')
      + '<p class="dim">لا تفوّت يومين متتاليين. يوم فائت عادي، ولك يوم تعويض واحد كل أسبوع.</p></section>'
      + (() => { const x = khStats(); return '<section class="card stack"><h3>حتى الآن</h3><div class="stats3"><div class="st"><b>' + x.ok + '</b><small>يوماً ناجحاً</small></div><div class="st"><b>' + x.juz + '</b><small>جزءاً</small></div><div class="st"><b>' + x.hrs + '</b><small>ساعة تطوير</small></div></div></section>'; })()
      + keep
      + '<section class="card stack"><h3>الإعدادات</h3><div class="row" style="justify-content:space-between"><span>المستوى</span><button class="chip" data-act="khLv">' + L.n + '</button></div>'
      + (!S.plan ? '<div class="row" style="justify-content:space-between"><span>هدف الماء</span>' + (K2.wg ? '<span class="stepper"><button class="btn sm sec" data-act="khWg" data-v="-1" aria-label="أقل">−</button><b>' + K2.wg + '</b><button class="btn sm sec" data-act="khWg" data-v="1" aria-label="أكثر">+</button></span>' : '<span class="dim">لم يُحدَّد بعد — من ركن الماء</span>') + '</div>' : '')
      + '<button class="btn sec full" data-act="khInvite">' + I('share') + ' ادعُ صديقاً للتحدي</button><button class="btn sm sec" data-act="khEnd" style="justify-self:center">إيقاف التحدي</button></section>';
  return '<div class="scr khs"><div class="scroll"><div class="stack">' + hd + tabs
    + (tab !== 'day' ? '' : '<div class="khday"><span class="khbig" aria-hidden="true">' + khMark(n) + '</span><div class="khpips">' + st.map((x, i) => '<i class="' + (x ? (exc && i < 2 ? 'ex' : 'on') : '') + '"></i>').join('') + '</div><h2>' + (n === 5 ? 'اكتمل يومك' : n >= 3 ? 'يومك ناجح' : n ? 'بدأت يومك' : 'يوم جديد') + '</h2><p class="dim">' + (exc ? 'أيام العذر: الصلاة والورد خارج حساب يومك.' : D.hard ? 'يوم صعب: الحد الأدنى يكفي اليوم.' : n >= 3 && n < 5 ? 'باقي ' + (5 - n) + ' لاكتمال الشكل.' : n < 3 ? 'باقي ' + (3 - n) + ' ويصبح يومك ناجحاً.' : 'التحمت الحصتان.') + ' • المستوى ' + L.n + '</p></div>'
    + '<div class="khnext">' + nx + '</div>'
    + (twice && day > 2 ? '<div class="banner info">' + I('check') + '<span>فاتك يومان. لا بأس، ابدأ اليوم بركن واحد فقط' + (D.hard ? '' : '، أو فعّل «يوم صعب»') + '.</span></div>' : ''))
    + fin + body
    + '<div class="row khbar"><button class="btn sec' + (D.hard ? ' on' : '') + '" data-act="khHard">' + (D.hard ? 'رجوع لليوم العادي' : 'يوم صعب') + '</button>' + (fem ? '<button class="btn sec' + (D.exc ? ' on' : '') + '" data-act="khExc">' + (D.exc ? 'إنهاء أيام العذر' : 'أيام العذر') + '</button>' : '') + '</div>'
    + '<p class="dim" style="text-align:center">بيانات عبادتك على جوالك فقط' + (S.guest ? '' : '، ولا تصل لأخصائيك') + '.</p>'
    + '</div></div></div>';
}
// ---- قارئ المصحف: نص Tanzil كما هو، يُحفظ على الجوال بعد أول تحميل؛ الصوت آية آية عند الطلب ومع الإنترنت فقط
let QT = null, QTp = null;
function khLoadText() {
  if (QT) return Promise.resolve(QT); if (QTp) return QTp;
  const URLQ = '/q/v1/quran.txt', parse = (t) => { const a = []; t.split('\n').forEach((l) => { if (!l || l[0] === '#') return; const i = l.indexOf('|'), j = l.indexOf('|', i + 1); a.push(l.slice(j + 1)); }); if (a.length !== 6236) throw new Error('نص المصحف غير مكتمل'); return a; };
  QTp = (async () => {
    let c = null; try { c = await caches.open('hx-quran-v1'); const m = await c.match(URLQ); if (m) return (QT = parse(await m.text())); } catch (e) { }
    const r = await fetch(URLQ); if (!r.ok) throw new Error('تعذّر تحميل المصحف'); const t = await r.text(), a = parse(t);
    try { if (c) await c.put(URLQ, new Response(t, { headers: { 'content-type': 'text/plain; charset=utf-8' } })); } catch (e) { }
    return (QT = a);
  })().catch((e) => { QTp = null; throw e; });
  return QTp;
}
function scrReader() {
  const R = V.qr, D = khDay(khT()), PN = khPrNames(khT()), bm = khBm(), KH_BSM = QT ? QT[0] + ' ' : '';   // البسملة كما هي في نص Tanzil (آية الفاتحة الأولى)
  let body;
  if (!QT) { if (!R.err) khLoadText().then(() => render()).catch((e) => { R.err = e.message; render(); }); body = R.err ? '<div class="banner warn">' + I('clock') + '<span>' + esc(R.err) + '. يحتاج أول فتح للمصحف اتصالاً بالإنترنت، وبعدها يعمل بلا إنترنت.</span></div><button class="btn sec" data-act="khRetry">حاول مرة أخرى</button>' : '<p class="dim" style="text-align:center">يُحمَّل المصحف أول مرة فقط…</p>'; }
  else {
    let h = '';
    for (let i = R.a; i <= R.e; i++) {
      const [s, a] = khRel(i); let t = QT[i];
      if (a === 1) { h += '<div class="qsura">سورة ' + esc(QM.n[s - 1]) + '</div>'; if (s !== 1 && s !== 9 && t.startsWith(KH_BSM)) { h += '<div class="qbsm">' + esc(KH_BSM.trim()) + '</div>'; t = t.slice(KH_BSM.length); } }
      h += '<span class="qa' + (R.cur === i ? ' cur' : '') + (bm === i ? ' bm' : '') + '" id="qa' + i + '" data-act="khBm" data-v="' + i + '" role="button" tabindex="0" aria-label="توقفت هنا: ' + esc(QM.n[s - 1]) + ' ' + a + '">' + esc(t) + ' <span class="qn">﴿' + a + '﴾</span>' + (bm === i ? '<span class="qbm" aria-hidden="true">توقفت هنا</span>' : '') + '</span> ';
    }
    const pl = R.p != null ? khPortions(D.lv, D.b).find((x) => x.p === R.p) : null, inP = pl && bm >= pl.a && bm <= pl.e, leftP = pl ? (D.wd[R.p] ? 0 : inP ? pl.e - bm : pl.n) : 0, leftD = khLeft(D, khPortions(D.lv, D.b));
    body = '<div class="qstat" role="status">' + (bm > -1 ? '<b>توقفت عند ' + esc(khPos(bm)) + '</b>' : '<b>المس آخر آية قرأتها لتحفظ موضعك</b>') + '<span>' + (pl ? 'باقي في هذا الورد ' + leftP + ' آية • ' : '') + 'باقي اليوم ' + leftD + ' آية</span></div>'
      + '<div class="qtext" style="font-size:' + (S.qfs || 26) + 'px">' + h + '</div>';
    if (R.jump != null) { const j = R.jump; R.jump = null; setTimeout(() => { const el = document.getElementById('qa' + j); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }, 30); }
  }
  const audio = V.online && navigator.onLine !== false ? '<button class="btn sec" data-act="khPlay">' + (R.play ? '⏸ إيقاف الصوت' : '▶ استمع للورد') + '</button>' : '<span class="dim">الاستماع يحتاج اتصالاً بالإنترنت.</span>';
  return '<div class="scr khs"><div class="scroll"><div class="stack">' + head(R.p != null ? 'ورد ' + PN[R.p] : 'المصحف', 'khRX', '', esc(khRange(R.a, R.e)))
    + '<div class="row qtools"><button class="btn sm sec" data-act="khFs" data-v="-2" aria-label="تصغير الخط">أ−</button><button class="btn sm sec" data-act="khFs" data-v="2" aria-label="تكبير الخط">أ+</button>' + audio + '</div>'
    + body
    + (R.p != null && QT ? '<button class="btn full" data-act="khRDone" data-v="' + R.p + '">' + I('check') + (D.wd[R.p] ? ' قرأت الورد ✓' : ' أتممت الورد') + '</button>' : '')
    + '<p class="dim qsrc">نص المصحف من مشروع <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil.net</a> (الرسم العثماني) • الخط Amiri Quran' + (V.online ? ' • التلاوة: مشاري العفاسي من everyayah.com' : '') + '</p>'
    + '</div></div></div>';
}
let QA = null;
function khAudioStop() { if (QA) { QA.pause(); QA.src = ''; QA = null; } if (V.qr) { V.qr.play = 0; V.qr.cur = null; } }
function khAudioPlay(i) {
  const R = V.qr; if (!R || i > R.e) { khAudioStop(); render(); return; }
  const [s, a] = khRel(i); R.cur = i; R.play = 1; if (S.kh && i > R.a) S.kh.bm = { i: i - 1, d: khDk(khT()) };   // الاستماع يحرّك نقطة التوقف
  if (!QA) { QA = new Audio(); QA.addEventListener('ended', () => khAudioPlay((V.qr || {}).cur + 1)); QA.addEventListener('error', () => { khAudioStop(); toast('تعذّر تشغيل الصوت. تأكد من الإنترنت.'); render(); }); }
  QA.src = KH_RQ + String(s).padStart(3, '0') + String(a).padStart(3, '0') + '.mp3'; QA.play().catch(() => { khAudioStop(); render(); });
  render(); const el = document.getElementById('qa' + i); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
// ---- الأحداث (data-act يبدأ بـ kh)
function khAct(a, v) {
  if (a.slice(0, 4) === 'khAz' && a !== 'khAz' && V.az) return khAzAct(a, v);
  const K2 = S.kh, D = K2 && K2.on ? khDay(khT()) : null, i = +v;
  switch (a) {
    case 'khStart': V.khg = { i: 0, guest: false }; return true;
    case 'khGuide': V.khg = { i: 0, guest: false, view: 1 }; return true;
    case 'khInvite': { const t = 'انضم معي إلى «تحدي الخمس» على «زنها»: 30 يوماً للصلاة والورد والماء والأذكار وتطوير النفس. مجاني: ' + KH_LINK(); if (navigator.share) navigator.share({ text: t }).catch(() => { }); else copyText(t, 'نُسخ رابط الدعوة'); return false; }
    case 'khCopyLink': copyText(KH_LINK(), 'نُسخ رابط التحدي — افتحه في Chrome أو Safari'); return false;
    case 'khInstLater': S.instLater = now(); save(); return true;
    case 'khWg': if (K2 && K2.wg) { K2.wg = Math.max(4, Math.min(16, K2.wg + i)); save(); } return true;
    case 'khWgSet': if (K2 && i >= 4 && i <= 16) { K2.wg = i; save(); toast('هدفك من الماء: ' + i + ' أكواب'); } return true;
    case 'khLv': sheet = { t: 'khLv' }; return true;
    case 'khSetLv': { const lv = KH_LV[v] ? v : 'b'; if (!K2 || !K2.on) { S.kh = { on: 1, start: khDk(khT()), lv, pos: 0, kc: 0, days: {}, skill: '' }; V.kh = 1; toast('بدأ التحدي. بالتوفيق'); } else { K2.lv = lv; const d = khDay(khT()); if (!d.wd.some(Boolean)) d.lv = lv; toast('المستوى الآن: ' + KH_LV[lv].n); } sheet = null; save(); return true; }
    case 'khOpen': V.kh = 1; return true;
    case 'khTab': V.khTab = ['day', 'quran', 'adhkar', 'prog'].includes(v) ? v : 'day'; return true;
    case 'khAz': if (D) { const k = ['pm', 'tb', 'free'].includes(v) ? v : 'am'; V.az = { k, i: k === 'free' || D[k] ? 0 : Math.min(((D.azp || {})[k]) || 0, khAzList(k).length - 1), c: k === 'free' ? (D.freeC || 0) : 0 }; } return true;
    case 'khX': V.kh = 0; return true;
    case 'khPr': if (D && !(D.exc && khFem())) { D.pr[i] = D.pr[i] ? 0 : 1; if (D.pr[i]) toast('تقبّل الله'); save(); } return true;
    case 'khWd': if (D) { D.wd[i] = D.wd[i] ? 0 : 1; khAdvance(D); save(); } return true;
    case 'khW': { const L = dl(TODAY); L.water = Math.max(0, Math.min(30, (L.water || 0) + i)); queueLog(dkey(new Date())); save(); return true; }
    case 'khAm': if (D) { D.am = D.am ? 0 : 1; save(); } return true;
    case 'khPm': if (D) { D.pm = D.pm ? 0 : 1; save(); } return true;
    case 'khSk': if (D) { D.sk = Math.max(0, Math.min(240, D.sk + i)); save(); } return true;
    case 'khSkill': sheet = { t: 'khSkill' }; return true;
    case 'khSkillSave': { const t = (($('#khSkIn') || {}).value || '').trim().slice(0, 40); if (K2) K2.skill = t; sheet = null; save(); return true; }
    case 'khKeep': { const k = K2.keep = (K2.keep || []).slice(), j = k.indexOf(i); j > -1 ? k.splice(j, 1) : k.length < 2 ? k.push(i) : toast('اختر ركنين فقط'); save(); return true; }
    case 'khHard': if (D) { D.hard = D.hard ? 0 : 1; toast(D.hard ? 'يوم صعب: الحد الأدنى يكفي اليوم' : 'رجعنا لليوم العادي'); save(); } return true;
    case 'khExc': if (D && khFem()) { D.exc = D.exc ? 0 : 1; save(); } return true;
    case 'khCmp': { const d = (K2.days || {})[v]; if (d) { d.cmp = 1; toast('عوّضتَ هذا اليوم. سلسلتك مستمرة'); save(); } return true; }
    case 'khCert': { const x = khStats(), c = { id: 'k' + now().toString(36), pid: 'khams', w: 97, title: 'تحدي الخمس (30 يوماً)', kh: x, lines: khTiles(x).map((t) => t[0] + ' ' + t[1]), hide: true, at: now(), name: String(S.p.name || '').trim(), sex: S.p.sex, dname: S.dname, clinic: '', phrase: PHRASES[now() % PHRASES.length] }; S.ach = (S.ach || []).concat([c]); K2.cert = c.id; save(); setTimeout(() => celebrateAch(c), 80); return true; }
    case 'khCertOpen': if (K2 && K2.cert) sheet = { t: 'cert', v: K2.cert }; return true;
    case 'khCertPriv': { const c = (S.ach || []).find((q) => q.id === v); if (c) { c.hide = !c.hide; delete CERT[c.id]; save(); } return true; }
    case 'khEnd': sheet = { t: 'khEnd' }; return true;
    case 'khEndOk': S.kh = Object.assign({}, K2, { on: 0 }); V.kh = 0; sheet = null; save(); toast('أوقفنا التحدي. يمكنك البدء من جديد متى شئت'); return true;
    case 'khRead': { const P = khPortions(D.lv, D.b), p = P.find((x) => x.p === i); if (p) { const bm = khBm(); V.qr = { a: p.a, e: p.e, p: p.p, jump: bm >= p.a && bm < p.e ? bm + 1 : null }; } return true; }
    case 'khBm': { if (!V.qr) return false; K2.bm = { i, d: khDk(khT()) }; const pl = V.qr.p != null ? khPortions(D.lv, D.b).find((x) => x.p === V.qr.p) : null;
      if (pl && i === pl.e && !D.wd[pl.p]) { D.wd[pl.p] = 1; khAdvance(D); toast('وصلت لنهاية ورد ' + khPrNames(khT())[pl.p] + '. تقبّل الله منك'); } else toast('حُفظ موضعك: ' + khPos(i)); save(); return true; }
    case 'khRX': khAudioStop(); V.qr = null; return true;
    case 'khRetry': if (V.qr) V.qr.err = ''; return true;
    case 'khFs': S.qfs = Math.max(18, Math.min(40, (S.qfs || 26) + i)); save(); return true;
    case 'khPlay': if (V.qr.play) { khAudioStop(); return true; } khAudioPlay(V.qr.cur != null ? V.qr.cur : V.qr.a); return false;
    case 'khRDone': if (D) { D.wd[i] = 1; khAdvance(D); { const pl = khPortions(D.lv, D.b).find((x) => x.p === i); if (pl) K2.bm = { i: pl.e, d: khDk(khT()) }; } khAudioStop(); V.qr = null; toast('تقبّل الله منك'); save(); } return true;
  }
  return false;
}
function khSheet() {                                   // تُستدعى من sheetHtml
  if (sheet.t === 'khLv') return [sheet.start ? 'اختر مستواك للبداية' : 'اختر مستواك', Object.keys(KH_LV).map((k) => '<button class="khopt' + ((S.kh || {}).lv === k ? ' on' : '') + '" data-act="khSetLv" data-v="' + k + '"><b>' + KH_LV[k].n + '</b><small>' + KH_LV[k].d + '</small></button>').join('') + '<p class="dim">ننصح بـ«بداية» في الأسبوع الأول، وترفع المستوى متى شئت. الورد يكمل دائماً من حيث توقفت.</p>'];
  if (sheet.t === 'khSkill') return ['ماذا تريد أن تطوّر؟', '<input class="inp" id="khSkIn" maxlength="40" placeholder="مثال: اللغة الإنجليزية" value="' + esc((S.kh || {}).skill || '') + '"><button class="btn full" data-act="khSkillSave">حفظ</button>'];
  if (sheet.t === 'khEnd') return ['إيقاف التحدي؟', '<p class="dim">يبقى سجلك وموضع وردك محفوظين على جوالك.</p><button class="btn full" data-act="khEndOk">إيقاف</button><button class="btn full sec" data-act="close">رجوع</button>'];
  return ['', ''];
}
// ---- شهادة إتمام «تحدي الخمس»: إنجاز الشهر مسجلاً بالأرقام، بصيغتين: أفقية للتنزيل والطباعة، وطولية للمشاركة على مواقع التواصل
function khStats() {
  const K2 = S.kh, fem = khFem(), st = new Date(K2.start + 'T12:00'), keys = [];
  for (let i = 0; i < KH_DAYS; i++) keys.push(khDk(new Date(st.getTime() + i * 864e5)));
  let ok = 0, full = 0, pr = 0, az = 0, sk = 0, wa = 0;
  keys.forEach((k) => { const D = (K2.days || {})[k]; if (!D) return; const sc = khScore(k), t = new Date(k + 'T12:00'), s5 = khState(t); if (sc >= 3) ok++; if (sc >= 5) full++; if (!(D.exc && fem)) pr += D.pr.filter(Boolean).length; if (s5[3]) az++; sk += D.sk || 0; wa += khLog(t).water || 0; });
  const rubs = (K2.kc || 0) * 240 + Math.min(240, K2.pos || 0), ayat = (K2.kc || 0) * 6236 + (K2.pos >= 240 ? 6236 : khAbs(...QM.hq[K2.pos || 0]));
  return { ok, full, pr, az, hrs: Math.round(sk / 6) / 10, wa, ayat, juz: Math.floor(rubs / 8), khatma: (K2.kc || 0) + (K2.pos >= 240 ? 1 : 0), skill: K2.skill || '', lv: (KH_LV[K2.lv] || KH_LV.b).n, from: K2.start, to: keys[KH_DAYS - 1] };
}
const khNum = (n) => Number(n).toLocaleString('en-US');
function khTiles(x, hide) {                            // البطاقات المسجلة في الشهادة؛ أرقام العبادة تُخفى إن اختار العميل ذلك عند المشاركة
  const t = [[x.ok + ' / 30', 'الأيام الناجحة'], [x.full + '', 'الأيام الكاملة بالأركان الخمسة']];
  if (!hide) t.push([khNum(x.pr), 'الصلوات في وقتها'], [x.khatma ? (x.khatma > 1 ? x.khatma + ' ختمات' : 'ختمة كاملة') : x.juz + ' / 30', x.khatma ? khNum(x.ayat) + ' آية' : 'الأجزاء المقروءة • ' + khNum(x.ayat) + ' آية'], [x.az + '', 'أيام أذكار الصباح والمساء']);
  t.push([khNum(x.wa), 'أكواب الماء'], [x.hrs + '', x.skill ? 'ساعات التطوير: ' + x.skill : 'ساعات التطوير']);
  return t.filter((q) => q[0] !== '0');                 // لا نطبع إنجازاً بصفر
}
async function khCertCanvas(a, fmt) {
  try { await document.fonts.load('700 40px "Hissa Plex"'); await document.fonts.load('400 30px "Hissa Plex"'); } catch (e) { }
  const L = fmt !== 's', W = L ? 1600 : 1080, H = L ? 1131 : 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), F = (w, s) => w + ' ' + s + 'px "Hissa Plex", "Segoe UI", Tahoma, sans-serif', x = a.kh || {}, fem = a.sex === 'أنثى', NAV = '#1d2c63', MINT = '#6fe3a9', AMB = '#f5a524', MUT = '#5e6478';
  g.fillStyle = '#faf6ef'; g.fillRect(0, 0, W, H);
  g.strokeStyle = NAV; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80); g.strokeStyle = '#d9cba8'; g.lineWidth = 2; g.strokeRect(58, 58, W - 116, H - 116);
  const mk = (cx, cy, s) => { const p = new Path2D(KH_PC); g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = MINT; g.fill(p); g.rotate(Math.PI); g.fillStyle = AMB; g.fill(p); g.restore(); };
  g.save(); g.globalAlpha = .05; mk(W / 2, H / 2 + 40, L ? 9 : 8); g.restore();
  g.direction = 'rtl'; g.textAlign = 'center'; let y = 150; mk(W / 2, y, L ? 1.5 : 1.4); y += L ? 110 : 105;
  g.fillStyle = NAV; g.font = F(700, L ? 72 : 76); g.fillText('شهادة إتمام', W / 2, y);
  g.fillStyle = '#a36100'; g.font = F(700, L ? 32 : 34); g.fillText('تحدي الخمس • 30 يوماً للجسد والروح والعقل', W / 2, y + (L ? 56 : 58)); y += L ? 130 : 132;
  g.fillStyle = MUT; g.font = F(400, L ? 32 : 34); g.fillText('تشهد «زنها» بأن', W / 2, y);
  g.fillStyle = NAV; g.font = F(700, L ? 84 : 88); g.fillText(a.name || (fem ? 'بطلة زنها' : 'بطل زنها'), W / 2, y + (L ? 100 : 108));
  g.fillStyle = MUT; g.font = F(400, L ? 30 : 32); g.fillText((fem ? 'أتمّت' : 'أتمّ') + ' التحدي بمستوى «' + (x.lv || '') + '»، وهذا ما ' + (fem ? 'أنجزته' : 'أنجزه') + ':', W / 2, y + (L ? 160 : 168)); y += L ? 205 : 212;
  let T = khTiles(x, a.hide); if (!L && T.length > 6) T = T.filter((q) => q[1] !== 'أكواب الماء').slice(0, 6);   // الطولية: 6 بطاقات على الأكثر
  const cols = L ? Math.min(T.length, 4) : 2, tw = L ? 300 : 430, th = L ? 120 : 118, gap = L ? 24 : 18, rows = Math.ceil(T.length / cols);
  if (!L && rows < 3) y += (3 - rows) * (th + gap) / 2;     // بطاقات أقل (أرقام العبادة مخفية): نوسّطها
  T.forEach((t, i) => {
    const r = Math.floor(i / cols), inRow = Math.min(cols, T.length - r * cols), c = i % cols, rowW = inRow * tw + (inRow - 1) * gap, x0 = W / 2 + rowW / 2 - tw - c * (tw + gap), y0 = y + r * (th + gap);
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect ? g.roundRect(x0, y0, tw, th, 18) : g.rect(x0, y0, tw, th); g.fill(); g.strokeStyle = '#ece4d6'; g.lineWidth = 2; g.stroke();
    g.fillStyle = NAV; g.font = F(700, L ? 40 : 42); g.fillText(t[0], x0 + tw / 2, y0 + 56); g.fillStyle = MUT; g.font = F(400, L ? 22 : 24); g.fillText(t[1], x0 + tw / 2, y0 + 94);
  });
  y += rows * (th + gap) + (L ? 10 : 6);
  g.fillStyle = '#b8860b'; g.font = F(700, L ? 32 : 34); g.fillText('“ ' + (a.phrase || 'خطوة صغيرة كل يوم تصنع فرقاً كبيراً') + ' ”', W / 2, y + 20);
  const fmtD = (k) => new Date(k + 'T12:00').toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }), by = H - 150;
  g.fillStyle = NAV; g.font = F(700, L ? 28 : 30);
  if (L) { g.fillText(a.dname || 'أخصائي التغذية', W - 360, by); g.fillText(fmtD(x.from || dkey(new Date())) + ' — ' + fmtD(x.to || dkey(new Date())), 380, by); g.strokeStyle = '#9aa6c0'; g.lineWidth = 2; [[W - 540, W - 180], [140, 620]].forEach(([p, q]) => { g.beginPath(); g.moveTo(p, by + 22); g.lineTo(q, by + 22); g.stroke(); }); g.fillStyle = MUT; g.font = F(400, 22); g.fillText('أخصائي التغذية', W - 360, by + 56); g.fillText('مدة التحدي', 380, by + 56); }
  else { g.fillText(fmtD(x.from || dkey(new Date())) + ' — ' + fmtD(x.to || dkey(new Date())), W / 2, by); g.fillStyle = MUT; g.font = F(400, 26); g.fillText('بإشراف ' + (a.dname || 'أخصائي التغذية'), W / 2, by + 44); }
  g.fillStyle = '#9aa6c0'; g.font = F(400, L ? 20 : 24); g.fillText('زنها • #تحدي_الخمس', W / 2, H - (L ? 82 : 72));
  return cv;
}
// ---- الدخول للتحدي بلا اشتراك (رابط /#khams) + الإرشاد قبل البدء (للجميع)
const KH_LINK = () => location.origin + '/#khams';
const KH_GUIDE = [
  ['هدف التحدي', 'ثلاثون يوماً تبني فيها خمس عادات صغيرة للجسد والروح والعقل، حتى تصبح جزءاً من يومك بعد انتهاء الشهر.', ['ليس سباقاً ولا مقارنة بأحد', 'تقيس نفسك بنفسك، يوماً بيوم', 'في النهاية شهادة بما أنجزته']],
  ['الأركان الخمسة', 'كل يوم فيه خمسة أركان، وكلها خطوات صغيرة:', ['الصلاة في وقتها: الصلوات الخمس', 'الورد: آيات بعد كل صلاة حتى تختم القرآن', 'الماء: عدد أكواب تحدده', 'الأذكار: أذكار الصباح والمساء', 'التطوير: وقت يومي لمهارة تختارها، مثل الإنجليزية']],
  ['كيف يمشي يومك', 'تفتح التحدي فتجد فعلاً واحداً تفعله الآن في بطاقة «التالي».', ['3 أركان من 5 = يوم ناجح', 'الخمسة = تكتمل قطعتا الشكل', 'الورد يكمل دائماً من حيث توقفت، والمس آخر آية قرأتها لتحفظ موضعك', 'تستطيع القراءة بلا إنترنت، والاستماع مع الإنترنت']],
  ['مرونة لا تكسرك', 'الهدف الاستمرار لا الكمال:', ['لا تفوّت يومين متتاليين؛ يوم فائت عادي', 'يوم تعويض واحد كل أسبوع', '«يوم صعب»: الحد الأدنى يكفي في السفر أو المرض', 'ثلاثة مستويات: بداية، ثابت، كامل — ابدأ صغيراً']],
  ['خصوصيتك', 'بيانات عبادتك تبقى على جوالك فقط، محمية برمز دخول، ولا تصل لأحد.', ['لا نقاط ولا ترتيب على العبادة', 'الشهادة تشاركها أنت إن أردت، ويمكنك إخفاء أرقام العبادة منها']]
];
function scrKhGuide() {
  const G = V.khg, i = G.i, last = i === KH_GUIDE.length, guest = G.guest;
  if (!last) { const p = KH_GUIDE[i];
    return '<div class="scr khs"><div class="scroll"><div class="stack khg">' + (guest ? '' : head('تحدي الخمس', 'khgX', '', 'قبل أن تبدأ')) + '<span class="khbig" aria-hidden="true">' + khMark(i >= 2 ? 5 : i >= 1 ? 3 : 0) + '</span>'
      + '<div class="khdots" aria-hidden="true">' + KH_GUIDE.concat([0]).map((_, j) => '<i class="' + (j === i ? 'on' : '') + '"></i>').join('') + '</div>'
      + '<h2>' + p[0] + '</h2><p class="mut">' + p[1] + '</p><ul class="khgl">' + p[2].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'
      + '<div class="row khbar">' + (i ? '<button class="btn sec" data-act="khgPrev">السابق</button>' : '') + '<button class="btn" data-act="khgNext">' + (i === KH_GUIDE.length - 1 ? 'جاهز' : 'التالي') + '</button></div>'
      + (i === 0 && guest ? '<p class="dim" style="text-align:center">مجاني، ولا يحتاج اشتراكاً مع أخصائي.</p>' + khInstallBox(false) : '') + '</div></div></div>'; }
  const f = G.f = G.f || { sex: '', lv: 'b', wg: null, city: '' };
  const opt = (k, v, t, s) => '<button class="khopt' + (f[k] === v ? ' on' : '') + '" data-act="khgSet" data-k="' + k + '" data-v="' + esc(v) + '"><b>' + t + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</button>';
  return '<div class="scr khs"><div class="scroll"><div class="stack khg">' + head(guest ? 'ابدأ تحدي الخمس' : 'اختر مستواك', 'khgPrev', '', guest ? 'خطوة أخيرة' : 'تحدي الخمس')
    + (guest ? '<div class="field"><label for="khgN">اسمك (يظهر في شهادتك)</label><input class="inp" id="khgN" maxlength="40" value="' + esc(f.name || '') + '" placeholder="مثال: سارة أحمد"></div>'
      + '<div class="field"><label>أنا</label><div class="segc" role="radiogroup" aria-label="أنا">' + ['أنثى', 'ذكر'].map((x) => '<button class="' + (f.sex === x ? 'on' : '') + '" role="radio" aria-checked="' + (f.sex === x) + '" data-act="khgSet" data-k="sex" data-v="' + x + '">' + x + '</button>').join('') + '</div></div>'
      + '<div class="field"><label for="khgC">مدينتي (لمواقيت الصلاة، اختياري)</label><select class="inp" id="khgC"><option value="">— بدون —</option>' + CITIES.map((c) => '<option' + (f.city === c[0] ? ' selected' : '') + '>' + c[0] + '</option>').join('') + '</select></div>'
      + '<div class="field"><label>هدف الماء اليومي (أكواب)</label><div class="khwg" role="radiogroup" aria-label="هدف الماء اليومي بالأكواب">' + Array.from({ length: 13 }, (_, j) => j + 4).map((x) => '<button class="chip' + (+f.wg === x ? ' on' : '') + '" role="radio" aria-checked="' + (+f.wg === x) + '" data-act="khgSet" data-k="wg" data-v="' + x + '">' + x + '</button>').join('') + '</div><small class="dim">حدده بنفسك أو مع طبيبك، وتستطيع تغييره لاحقاً.</small></div>' : '')
    + '<div class="field"><label>المستوى</label>' + Object.keys(KH_LV).map((k) => opt('lv', k, KH_LV[k].n, KH_LV[k].d)).join('') + '<small class="dim">ننصح بـ«بداية» في الأسبوع الأول.</small></div>'
    + (V.err ? '<p class="err">' + esc(V.err) + '</p>' : '')
    + '<button class="btn full" data-act="khGo">' + (guest ? 'ابدأ وأنشئ رمز الدخول' : 'ابدأ التحدي') + '</button>'
    + (guest ? khInstallBox(false) + '<p class="dim" style="text-align:center">لديك أخصائي تغذية؟ افتح رابط الدعوة الذي أرسله لك بدلاً من هذا.</p>' : '') + '</div></div></div>';
}
function scrKhRestart() { return '<div class="scr khs"><div class="scroll"><div class="stack" style="padding-top:22px">' + khCard() + '</div></div></div>'; }
function khGuideAct(a, v, el) {                      // أحداث الإرشاد (قد تعمل قبل وجود حساب)
  const G = V.khg; if (!G) return false;
  if (G.f && G.i === KH_GUIDE.length) { const n = $('#khgN'), c = $('#khgC'); if (n) G.f.name = n.value; if (c) G.f.city = c.value; }
  switch (a) {
    case 'khgNext': G.i = Math.min(KH_GUIDE.length, G.i + 1); return true;
    case 'khgPrev': if (G.i > 0) G.i--; else if (!G.guest) V.khg = null; return true;
    case 'khgX': V.khg = null; return true;
    case 'khCopyLink': copyText(KH_LINK(), 'نُسخ رابط التحدي — افتحه في Chrome أو Safari'); return false;
    case 'khgSet': G.f[el.dataset.k] = el.dataset.k === 'wg' ? +v : v; return true;
    case 'khGo': {
      const f = G.f, name = String(f.name || '').trim().slice(0, 40);
      if (G.guest && !name) { V.err = 'اكتب اسمك ليظهر في شهادتك'; return true; }
      if (G.guest && !f.sex) { V.err = 'اختر: أنثى / ذكر'; return true; }
      if (G.guest && !f.wg) { V.err = 'اختر هدفك من الماء'; return true; }
      V.err = ''; const kh = { on: 1, start: khDk(khT()), lv: KH_LV[f.lv] ? f.lv : 'b', pos: 0, kc: 0, days: {}, skill: '', wg: +f.wg || null };
      if (G.guest) { S = fresh(); S.guest = 1; S.ui = { today2: true }; S.screen = 'khams'; S.p.name = name; S.p.sex = f.sex; S.kh = kh; if (f.city) S.rem.prCity = f.city; V.khg = null; V.guest = true; V.screen = 'pin'; V.pin = V.pin1 = ''; return true; }
      S.kh = Object.assign(kh, { wg: (S.kh || {}).wg || null }); V.khg = null; V.kh = 1; save(); toast('بدأ التحدي. بالتوفيق'); return true;
    }
  }
  return false;
}

// تثبيت «زنها» من رابط التحدي: زر التثبيت (أندرويد/كروم)، وخطوات آيفون، وفتح الرابط في المتصفح من داخل واتساب/إنستجرام
function khInstallBox(started) {
  const st = installState(); if (st === 'done' || st === 'desktop' || (started && S && S.instLater && now() - S.instLater < 7 * 864e5)) return '';
  const t = st === 'prompt' ? '<b>نزّل «زنها» على جوالك</b><br>يفتح من أيقونته في الشاشة الرئيسية كأي تطبيق، ويعمل بلا إنترنت.<br><button class="btn sm" data-act="install" style="margin-top:8px">' + I('plusSq') + ' تثبيت «زنها»</button>'
    : st === 'ios' ? '<b>نزّل «زنها» على آيفون</b><ol class="steps"><li>اضغط زر المشاركة ' + I('share') + ' أسفل Safari</li><li>اختر «إضافة إلى الشاشة الرئيسية» ' + I('plusSq') + '</li><li>افتح «زنها» من أيقونته' + (started ? '' : ' وابدأ التحدي منه') + '</li></ol>' + (started ? '<small class="dim">آيفون يفصل بيانات Safari عن التطبيق المثبّت؛ تحديك الحالي يبقى هنا في Safari.</small>' : '<small class="dim">ثبّته أولاً ثم ابدأ من الأيقونة، حتى يُحفظ تحديك داخل التطبيق.</small>')
    : st === 'android' ? '<b>نزّل «زنها» على جوالك</b><br>من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».'
    : '<b>افتح الرابط في المتصفح لتنزيل «زنها»</b><br>أنت داخل تطبيق آخر (واتساب أو إنستجرام). انسخ الرابط وافتحه في Chrome أو Safari.<br><button class="btn sm sec" data-act="khCopyLink" style="margin-top:6px">' + I('copy') + ' نسخ رابط التحدي</button>';
  return '<div class="banner info inst khinst">' + I('phone') + '<span>' + t + (started ? ' <button class="link" data-act="khInstLater">لاحقاً</button>' : '') + '</span></div>';
}

// ---- مشغّل الأذكار: الذكر بنصه وعدد مراته، عدّاد باللمس ينتقل للتالي، وتلاوة صوتية اختيارية مع الإنترنت (hisnmuslim.com)
const KH_AZA = 'https://www.hisnmuslim.com/audio/ar/', KH_AZM = [75, 76, 0, 0, 77, 79, 78, 90, 82, 86, 87, 88, 83, 94, 92, 98, 91, 96];   // رقم تسجيل كل ذكر صباحي (0 = لا تسجيل مستقل؛ المعوذتان ضمن تسجيل الإخلاص)
const KH_TB = [['سبحان الله', 33], ['الحمد لله', 33], ['الله أكبر', 33], ['لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', 1, 'تمام المائة (صحيح مسلم)']];   // التسبيح بعد الصلاة
const KH_FREE = [['اذكر الله بما تحب، والسبحة تعدّ معك', 0]];
function khAzList(k) { return k === 'pm' ? ADHKAR_PM : k === 'tb' ? KH_TB : k === 'free' ? KH_FREE : ADHKAR; }
const KH_AZN = { am: 'أذكار الصباح', pm: 'أذكار المساء', tb: 'التسبيح بعد الصلاة', free: 'سبحة حرة' };
function khSebha(need, c) {                             // السبحة: حلقة حبّات تضيء حبة حبة، 33 حبة للدورة، والعدد الكبير دورات
  const B = need && need <= 33 ? need : 33, done = need && c >= need, lit = done ? B : c % B === 0 && c ? B : c % B, R0 = 112, beads = [];
  const rb = Math.max(5, Math.min(13, 300 / B));
  for (let i = 0; i < B; i++) { const t = -Math.PI / 2 + (i + .5) * 2 * Math.PI / B, x = 140 + R0 * Math.cos(t), y = 140 + R0 * Math.sin(t); beads.push('<circle class="sb' + (i < lit ? ' on' : '') + (i === lit - 1 && !done ? ' nw' : '') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rb.toFixed(1) + '"/>'); }
  const rounds = need > 33 ? '<text x="140" y="196" class="sbr">الدورة ' + Math.min(Math.ceil(need / 33), Math.floor(c / 33) + (c % 33 || !c ? 1 : 0)) + ' من ' + Math.ceil(need / 33) + '</text>' : '';
  return '<svg viewBox="0 0 280 300" class="sebha" aria-hidden="true"><circle cx="140" cy="140" r="' + R0 + '" class="sbs"/>' + beads.join('') + '<path d="M140 252 v18" class="sbt"/><circle cx="140" cy="' + (140 + R0) + '" r="' + (rb + 4) + '" class="sbi"/><path d="M134 270 l6 22 l6 -22 z" class="sbt2"/>'
    + '<text x="140" y="' + (need ? 150 : 152) + '" class="sbn">' + (need ? (done ? '✓' : need - c) : c) + '</text><text x="140" y="178" class="sbl">' + (need ? (done ? 'تم' : need > 1 ? 'باقي من ' + need : 'المس عند الانتهاء') : 'مرة') + '</text>' + rounds + '</svg>';
}
function khAzAudio(x) { const j = ADHKAR.indexOf(x); if (j > -1) return KH_AZM[j] || 0; return /^أعوذ بكلمات الله التامات/.test(x[0]) ? 97 : 0; }   // أذكار المساء الخاصة بلفظها لا تسجيل مطابقاً لها
function scrAdhkar() {
  const A = V.az, list = khAzList(A.k), i = Math.min(A.i, list.length - 1), x = list[i], need = A.k === 'free' ? 0 : (+x[1] || 1), left = Math.max(0, need - A.c), au = A.k === 'am' || A.k === 'pm' ? khAzAudio(x) : 0, on = V.online && navigator.onLine !== false;
  return '<div class="scr khs"><div class="scroll"><div class="stack">' + head(KH_AZN[A.k], 'khAzX', '', A.k === 'free' ? 'المجموع ' + A.c : 'الذكر ' + (i + 1) + ' من ' + list.length)
    + '<div class="khbar2"><i style="width:' + Math.round(i / list.length * 100) + '%"></i></div>'
    + '<section class="card khazt"><p>' + esc(x[0]) + '</p>' + (x[2] ? '<small class="dim">' + esc(x[2]) + '</small>' : '') + '</section>'
    + '<button class="khcount' + (need && !left ? ' done' : '') + '" data-act="khAzTap" aria-label="' + (need ? 'عدّ مرة: باقي ' + left : 'عدّ مرة: المجموع ' + A.c) + '">' + khSebha(need, A.c) + '</button>'
    + (A.k === 'free' ? '<button class="btn sm sec" data-act="khAzReset" style="justify-self:center">تصفير السبحة</button>' : '')
    + (A.k === 'free' ? '' : '<div class="row khbar"><button class="btn sec" data-act="khAzGo" data-v="-1"' + (i ? '' : ' disabled') + '>السابق</button>' + (au && on ? '<button class="btn sec" data-act="khAzPlay">' + (A.play ? '⏸ إيقاف' : '▶ استمع') + '</button>' : '') + '<button class="btn sec" data-act="khAzGo" data-v="1">' + (i === list.length - 1 ? 'إنهاء' : 'التالي') + '</button></div>')
    + (A.k !== 'am' && A.k !== 'pm' ? '' : !on ? '<p class="dim" style="text-align:center">الاستماع يحتاج اتصالاً بالإنترنت.</p>' : au ? '' : '<p class="dim" style="text-align:center">لا تسجيل صوتي مستقل لهذا الذكر.</p>')
    + '<p class="dim qsrc">النصوص من «حصن المسلم»' + (on ? ' • التسجيلات من hisnmuslim.com' : '') + '</p></div></div></div>';
}
let QZ = null;
function khAzStop() { if (QZ) { QZ.pause(); QZ.src = ''; QZ = null; } if (V.az) V.az.play = 0; }
function khAzAct(a, v) {
  const A = V.az, D = khDay(khT()); if (!A) return false; const list = khAzList(A.k), x = list[A.i], need = A.k === 'free' ? 0 : (+x[1] || 1);
  const go = (d) => { khAzStop(); A.i += d; A.c = 0; if (A.i < 0) A.i = 0; D.azp = Object.assign({}, D.azp, { [A.k]: A.i });
    if (A.i >= list.length) { if (A.k === 'am' || A.k === 'pm') D[A.k] = 1; D.azp[A.k] = 0; V.az = null; save(); toast(KH_AZN[A.k] + ' تمت. تقبّل الله منك'); return; } save(); };
  switch (a) {
    case 'khAzTap': if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { }
      if (!need) { A.c++; D.freeC = A.c; save(); return true; }
      if (A.c < need) A.c++; if (A.c >= need) setTimeout(() => { if (V.az === A && A.c >= need) { go(1); render(); } }, 550); return true;
    case 'khAzReset': A.c = 0; D.freeC = 0; save(); return true;
    case 'khAzGo': go(+v); return true;
    case 'khAzX': khAzStop(); V.az = null; return true;
    case 'khAzPlay': { if (A.play) { khAzStop(); return true; } const id = khAzAudio(x); if (!id) return false; QZ = new Audio(KH_AZA + id + '.mp3'); A.play = 1; QZ.addEventListener('ended', () => { khAzStop(); render(); }); QZ.addEventListener('error', () => { khAzStop(); toast('تعذّر تشغيل الصوت. تأكد من الإنترنت.'); render(); }); QZ.play().catch(() => { khAzStop(); render(); }); return true; }
  }
  return false;
}
