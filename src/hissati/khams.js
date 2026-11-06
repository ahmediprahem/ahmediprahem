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
function khWaterGoal(t) { const dp = dayPlan(t.getDay()), wt = +(dp.water || DATA.water) || 0; return wt ? Math.max(4, Math.min(16, Math.round(wt / CUP))) : 8; }
function khState(t) {                                  // [الصلاة، الورد، الماء، الأذكار، التطوير] لليوم
  const D = khDay(t), L = KH_LV[D.lv] || KH_LV.b, P = khPortions(D.lv, D.b), exc = D.exc && khFem(), w = (khLog(t).water || 0);
  return [exc || D.pr.every(Boolean), exc || (D.hard ? P.some((p) => D.wd[p.p]) : P.every((p) => D.wd[p.p])), w >= (D.hard ? 2 : khWaterGoal(t)), D.hard ? !!(D.am || D.pm) : !!(D.am && D.pm), D.sk >= (D.hard ? 10 : L.sk)];
}
function khScore(k) { const K2 = S.kh, D = (K2.days || {})[k]; if (!D) return -1; if (D.cmp) return 3; return khState(new Date(k + 'T12:00')).filter(Boolean).length; }
function khAdvance(D) {                                // الموضع = بداية اليوم + أرباع الأوراد المقروءة على التوالي
  const P = khPortions(D.lv, D.b); let r = 0; for (const p of P) { if (!D.wd[p.p]) break; r += p.r; }
  const K2 = S.kh; K2.pos = D.b + r;
  if (K2.pos >= 240 && !K2.done240) { K2.done240 = 1; setTimeout(() => toast('ختمت القرآن. تقبّل الله منك'), 60); }
}
function khPrNames(t) { const fri = new Date(t).getDay() === 5 && S.p.sex !== 'أنثى'; return ['الفجر', fri ? 'الجمعة' : 'الظهر', 'العصر', 'المغرب', 'العشاء']; }
function khPrTimes() { const P = typeof prNow === 'function' ? prNow() : null; return P ? KH_PR.map((k) => hm12(m2hm(P[k]))) : null; }
// ---- بطاقة الرئيسية: مختصرة، والشاشة الكاملة عند اللمس
function khCard() {
  const K2 = S.kh;
  if (!K2 || !K2.on) return (K2 && K2.offer) || !K2 ? '<section class="card stack khc"><div class="row"><span class="khmk" aria-hidden="true">' + khMark(0) + '</span><div style="flex:1"><h3>تحدي الخمس</h3><div class="dim">شهر: الصلاة في وقتها، ختمة بالآيات، الماء، الأذكار، وساعة تطوير يومياً.</div></div></div><button class="btn full" data-act="khStart">ابدأ التحدي</button></section>' : '';
  const n = khState(khT()).filter(Boolean).length, day = Math.min(KH_DAYS, khDayNo(khT()));
  return '<button class="card khc khmini" data-act="khOpen"><span class="khmk" aria-hidden="true">' + khMark(n) + '</span><span style="flex:1;text-align:right"><b>تحدي الخمس • اليوم ' + day + ' من ' + KH_DAYS + '</b><small class="dim">' + (n === 5 ? 'اكتمل يومك' : n >= 3 ? 'يومك ناجح • باقي ' + (5 - n) : n + ' من 5') + '</small></span>' + I('back') + '</button>';
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
  if (uw) nx = '<small>التالي</small><b>ورد ' + PN[uw.p] + '</b><span>' + esc(khRange(uw.a, uw.e)) + ' • ' + uw.n + ' آية</span><button class="btn khgo" data-act="khRead" data-v="' + uw.p + '">' + I('book') + ' افتح الورد</button>';
  else if (!exc && ni > -1) { const wp = P.find((p) => p.p === ni); nx = '<small>التالي</small><b>صلاة ' + PN[ni] + (PT ? ' • ' + PT[ni] : '') + '</b><span>' + (wp ? 'وبعدها ورد ' + PN[ni] + ': ' + esc(khRange(wp.a, wp.e)) : 'وكوب ماء') + '</span><button class="btn khgo" data-act="khPr" data-v="' + ni + '">صلّيت ' + PN[ni] + '</button>'; }
  else if (!st[2]) nx = '<small>التالي</small><b>كوب ماء</b><span>' + w + ' من ' + wg + ' أكواب</span><button class="btn khgo" data-act="khW" data-v="1">شربت كوباً</button>';
  else if (!st[3]) nx = '<small>التالي</small><b>' + (D.am ? 'أذكار المساء' : 'أذكار الصباح') + '</b><span>' + (D.am ? 'بعد العصر' : 'بعد الفجر') + '</span><button class="btn khgo" data-act="' + (D.am ? 'khPm' : 'khAm') + '">قرأتها</button>';
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
  const fin = day >= KH_DAYS && !K2.cert ? '<button class="btn full" data-act="khCert">' + I('check') + ' أتممت الشهر — شهادتي</button>' : '';
  return '<div class="scr khs"><div class="scroll"><div class="stack">' + head('تحدي الخمس', 'khX', '', 'اليوم ' + Math.min(day, KH_DAYS) + ' من ' + KH_DAYS)
    + '<div class="row" style="justify-content:space-between"><span class="dim">' + esc(DATA.dayNames && DATA.dayNames[TODAY] || '') + '</span><button class="chip" data-act="khLv">المستوى: ' + L.n + '</button></div>'
    + '<div class="khday"><span class="khbig" aria-hidden="true">' + khMark(n) + '</span><div class="khpips">' + st.map((x, i) => '<i class="' + (x ? (exc && i < 2 ? 'ex' : 'on') : '') + '"></i>').join('') + '</div><h2>' + (n === 5 ? 'اكتمل يومك' : n >= 3 ? 'يومك ناجح' : n ? 'بدأت يومك' : 'يوم جديد') + '</h2><p class="dim">' + (exc ? 'أيام العذر: الصلاة والورد خارج حساب يومك.' : D.hard ? 'يوم صعب: الحد الأدنى يكفي اليوم.' : n >= 3 && n < 5 ? 'باقي ' + (5 - n) + ' لاكتمال الشكل.' : n < 3 ? 'باقي ' + (3 - n) + ' ويصبح يومك ناجحاً.' : 'التحمت الحصتان.') + '</p></div>'
    + '<div class="khnext">' + nx + '</div>'
    + (twice && day > 2 ? '<div class="banner info">' + I('check') + '<span>فاتك يومان. لا بأس، ابدأ اليوم بركن واحد فقط' + (D.hard ? '' : '، أو فعّل «يوم صعب»') + '.</span></div>' : '')
    + '<div class="card khpil">'
    + row('pr', 'الصلاة في وقتها', exc ? 'خارج الحساب في أيام العذر' : D.pr.filter(Boolean).length + ' من 5', st[0], prSub, exc)
    + row('wd', 'الورد', exc ? 'خارج الحساب في أيام العذر' : (P.length ? tot + ' آية اليوم • ' + L.n + ((K2.kc || 0) ? ' • الختمة ' + (K2.kc + 1) : '') : 'أتممت الختمة'), st[1], wdSub, exc)
    + row('wa', 'الماء', w + ' من ' + wg + ' أكواب' + (D.hard ? '' : ' • حسب خطتك'), st[2], '<span class="stepper"><button class="btn sm sec" data-act="khW" data-v="-1" aria-label="كوب أقل">−</button><b>' + w + '</b><button class="btn sm sec" data-act="khW" data-v="1" aria-label="كوب أكثر">+</button></span>')
    + row('az', 'أذكار الصباح والمساء', D.hard ? 'واحد منهما يكفي اليوم' : 'الاثنان', st[3], tog(D.am, 'khAm', '', 'الصباح', 'بعد الفجر') + tog(D.pm, 'khPm', '', 'المساء', 'بعد العصر'))
    + row('sk', 'ساعة التطوير', (K2.skill ? esc(K2.skill) + ' • ' : '') + D.sk + ' من ' + skG + ' دقيقة', st[4], tog(0, 'khSk', 10, '+ 10 دقائق') + tog(0, 'khSk', -D.sk, 'تصفير') + tog(0, 'khSkill', '', K2.skill ? 'غيّر المهارة' : 'اختر المهارة'))
    + '</div>'
    + '<section class="card stack"><h3>أسبوعك</h3><div class="khwk">' + wk.map((x) => '<span class="' + (x[1] === -2 ? 'na' : x[1] >= 5 ? 'f' : (K2.days[x[0]] || {}).cmp ? 'c' : x[1] >= 3 ? 'p' : x[3] ? '' : x[1] >= -1 ? 'x' : 'na') + (x[3] ? ' t' : '') + '"><i></i>' + esc(x[2]) + '</span>').join('') + '</div>'
    + (lastMiss && !cmpUsed ? '<button class="btn sm sec" data-act="khCmp" data-v="' + lastMiss[0] + '">عوّض ' + esc(lastMiss[2]) + ' بيوم التعويض</button>' : '')
    + '<p class="dim">لا تفوّت يومين متتاليين. يوم فائت عادي، ولك يوم تعويض واحد كل أسبوع.</p></section>'
    + keep + fin
    + '<div class="row khbar"><button class="btn sec' + (D.hard ? ' on' : '') + '" data-act="khHard">' + (D.hard ? 'رجوع لليوم العادي' : 'يوم صعب') + '</button>' + (fem ? '<button class="btn sec' + (D.exc ? ' on' : '') + '" data-act="khExc">' + (D.exc ? 'إنهاء أيام العذر' : 'أيام العذر') + '</button>' : '') + '</div>'
    + '<p class="dim" style="text-align:center">بيانات عبادتك على جوالك فقط، ولا تصل لأخصائيك.</p>'
    + '<button class="btn sm sec" data-act="khEnd" style="justify-self:center">إيقاف التحدي</button>'
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
  const R = V.qr, D = khDay(khT()), PN = khPrNames(khT()), KH_BSM = QT ? QT[0] + ' ' : '';   // البسملة كما هي في نص Tanzil (آية الفاتحة الأولى)
  let body;
  if (!QT) { if (!R.err) khLoadText().then(() => render()).catch((e) => { R.err = e.message; render(); }); body = R.err ? '<div class="banner warn">' + I('clock') + '<span>' + esc(R.err) + '. يحتاج أول فتح للمصحف اتصالاً بالإنترنت، وبعدها يعمل بلا إنترنت.</span></div><button class="btn sec" data-act="khRetry">حاول مرة أخرى</button>' : '<p class="dim" style="text-align:center">يُحمَّل المصحف أول مرة فقط…</p>'; }
  else {
    let h = '';
    for (let i = R.a; i <= R.e; i++) {
      const [s, a] = khRel(i); let t = QT[i];
      if (a === 1) { h += '<div class="qsura">سورة ' + esc(QM.n[s - 1]) + '</div>'; if (s !== 1 && s !== 9 && t.startsWith(KH_BSM)) { h += '<div class="qbsm">' + esc(KH_BSM.trim()) + '</div>'; t = t.slice(KH_BSM.length); } }
      h += '<span class="qa' + (R.cur === i ? ' cur' : '') + '" id="qa' + i + '">' + esc(t) + ' <span class="qn">﴿' + a + '﴾</span></span> ';
    }
    body = '<div class="qtext" style="font-size:' + (S.qfs || 26) + 'px">' + h + '</div>';
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
  const [s, a] = khRel(i); R.cur = i; R.play = 1;
  if (!QA) { QA = new Audio(); QA.addEventListener('ended', () => khAudioPlay((V.qr || {}).cur + 1)); QA.addEventListener('error', () => { khAudioStop(); toast('تعذّر تشغيل الصوت. تأكد من الإنترنت.'); render(); }); }
  QA.src = KH_RQ + String(s).padStart(3, '0') + String(a).padStart(3, '0') + '.mp3'; QA.play().catch(() => { khAudioStop(); render(); });
  render(); const el = document.getElementById('qa' + i); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
// ---- الأحداث (data-act يبدأ بـ kh)
function khAct(a, v) {
  const K2 = S.kh, D = K2 && K2.on ? khDay(khT()) : null, i = +v;
  switch (a) {
    case 'khStart': sheet = { t: 'khLv', start: 1 }; return true;
    case 'khLv': sheet = { t: 'khLv' }; return true;
    case 'khSetLv': { const lv = KH_LV[v] ? v : 'b'; if (!K2 || !K2.on) { S.kh = { on: 1, start: khDk(khT()), lv, pos: 0, kc: 0, days: {}, skill: '' }; V.kh = 1; toast('بدأ التحدي. بالتوفيق'); } else { K2.lv = lv; const d = khDay(khT()); if (!d.wd.some(Boolean)) d.lv = lv; toast('المستوى الآن: ' + KH_LV[lv].n); } sheet = null; save(); return true; }
    case 'khOpen': V.kh = 1; return true;
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
    case 'khCert': { const c = { id: 'k' + now().toString(36), pid: 'khams', w: 97, title: 'تحدي الخمس (30 يوماً)', lines: [], at: now(), name: String(S.p.name || '').trim(), sex: S.p.sex, dname: S.dname, clinic: '', phrase: PHRASES[now() % PHRASES.length] }; S.ach = (S.ach || []).concat([c]); K2.cert = 1; save(); setTimeout(() => celebrateAch(c), 80); return true; }
    case 'khEnd': sheet = { t: 'khEnd' }; return true;
    case 'khEndOk': S.kh = Object.assign({}, K2, { on: 0 }); V.kh = 0; sheet = null; save(); toast('أوقفنا التحدي. يمكنك البدء من جديد متى شئت'); return true;
    case 'khRead': { const P = khPortions(D.lv, D.b), p = P.find((x) => x.p === i); if (p) V.qr = { a: p.a, e: p.e, p: p.p }; return true; }
    case 'khRX': khAudioStop(); V.qr = null; return true;
    case 'khRetry': if (V.qr) V.qr.err = ''; return true;
    case 'khFs': S.qfs = Math.max(18, Math.min(40, (S.qfs || 26) + i)); save(); return true;
    case 'khPlay': if (V.qr.play) { khAudioStop(); return true; } khAudioPlay(V.qr.cur != null ? V.qr.cur : V.qr.a); return false;
    case 'khRDone': if (D) { D.wd[i] = 1; khAdvance(D); khAudioStop(); V.qr = null; toast('تقبّل الله منك'); save(); } return true;
  }
  return false;
}
function khSheet() {                                   // تُستدعى من sheetHtml
  if (sheet.t === 'khLv') return [sheet.start ? 'اختر مستواك للبداية' : 'اختر مستواك', Object.keys(KH_LV).map((k) => '<button class="khopt' + ((S.kh || {}).lv === k ? ' on' : '') + '" data-act="khSetLv" data-v="' + k + '"><b>' + KH_LV[k].n + '</b><small>' + KH_LV[k].d + '</small></button>').join('') + '<p class="dim">ننصح بـ«بداية» في الأسبوع الأول، وترفع المستوى متى شئت. الورد يكمل دائماً من حيث توقفت.</p>'];
  if (sheet.t === 'khSkill') return ['ماذا تريد أن تطوّر؟', '<input class="inp" id="khSkIn" maxlength="40" placeholder="مثال: اللغة الإنجليزية" value="' + esc((S.kh || {}).skill || '') + '"><button class="btn full" data-act="khSkillSave">حفظ</button>'];
  if (sheet.t === 'khEnd') return ['إيقاف التحدي؟', '<p class="dim">يبقى سجلك وموضع وردك محفوظين على جوالك.</p><button class="btn full" data-act="khEndOk">إيقاف</button><button class="btn full sec" data-act="close">رجوع</button>'];
  return ['', ''];
}
