// ================= مكتبة الأنظمة الجاهزة (0.42): قسم في «حصة» (يُدمج داخل app.js عند /*READYUI*/)
// ثلاث طرق: اختيار تلقائي من بيانات العميل (الأمثل + بديلان + المتوقع) • تصفّح المكتبة واختيار يدوي • إنشاء نظام جديد بمحرك «حصة».
// المنطق في src/readylib.js (RL)؛ محتوى الخطط مضغوط داخل الصفحة ويُفك عند أول معاينة. مكتبة المنتجات مستبعدة.
var RDS = { tab: 'auto', client: '', ans: {}, open: '', fam: '', rg: '', lvl: '', guide: '', blob: null, loading: false, err: '', bank: {} };
if (window.DPApp) window.DPApp.RDS = RDS;
if (window.RL && window.READYLIB_INDEX) RL.use(window.READYLIB_INDEX);
function rdClient() { var code = RDS.client || S.cur; return S.clients.filter(function (c) { return c.code === code; })[0] || null; }
function rdLoad() {                                                     // فك ضغط محتوى المكتبة مرة واحدة (gzip ← JSON)؛ يعيد وعداً يُحل عند الجاهزية
  if (RDS.p) return RDS.p; RDS.loading = true;
  RDS.p = new Promise(function (res) {
    try {
      var bin = atob(window.READYLIB_GZ || ''), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text().then(function (t) { RDS.blob = JSON.parse(t); RDS.loading = false; res(RDS.blob); if (S.view === 'ready' || RDS.open) main(); })
        .catch(function (e) { RDS.loading = false; RDS.err = 'تعذّر فتح محتوى المكتبة: ' + e.message; res(null); main(); });
    } catch (e) { RDS.loading = false; RDS.err = 'المتصفح لا يدعم فك الضغط؛ استعمل Chrome أو Edge أو Safari حديثاً.'; res(null); }
  });
  return RDS.p;
}
function rdDoc(id) { var B = RDS.blob, d = B && B.plans[id]; if (!d) return null; return Object.assign({}, d, { subsArr: B.shared[d.subs] || [], secsArr: B.shared[d.secs] || [] }); }
// بيانات العميل الأساسية + إجاباته (من «حصتي» أو تعديل الأخصائي)
function rdBase(c) { var pal = (D.settings.activity.filter(function (a) { return a[0] === c.activity; })[0] || [0, null])[1]; return { sex: c.sex, age: +c.age || 0, weight: +c.weight || 0, height: +c.height || 0, pal: pal }; }
function rdAnswers(c) {
  if (RDS.ans[c.code]) return RDS.ans[c.code];
  var q = c.hx && c.hx.quiz && c.hx.quiz.ans, a = q ? JSON.parse(JSON.stringify(q)) : {}, cond = c.conditions || [];
  if (!q) {
    var g = String(c.goal || ''), bmi = c.weight && c.height ? c.weight / Math.pow(c.height / 100, 2) : 25;   // «ثبات» هو الافتراضي في ملف العميل فلا يعني «ما بعد التنحيف»
    a.goal = /خسارة/.test(g) ? 'lose' : /زيادة/.test(g) ? 'gain' : c.kind === 'athlete' ? 'cut' : bmi < 18.5 ? 'gain' : 'lose';
    a.region = c.cuisine === 'sa' ? 'sa' : 'eg'; a.cond = []; if (cond.some(function (x) { return /مقاومة/.test(x); })) a.cond.push('ir'); if (cond.some(function (x) { return /^سكري/.test(x); })) a.cond.push('diab');      // «ما قبل السكري» ليس سكرياً على دواء
    a.routine = String(c.budget) === '1' ? 'budget' : c.life === 'quick' || c.life === 'travel' ? 'office' : 'classic';     // من «نمط الوجبات» في بيانات العميل
    if (c.kind === 'athlete' && /زيادة/.test(g)) a.goal = 'bulk';
  }
  a.sys = c.kind === 'athlete' ? 'g' : 'ex'; a.limit = 7;
  RDS.ans[c.code] = a; return a;
}
function rdQField(q, a, P) {
  var v = a[q.id], opts = RL.optsOf(q, a, P);
  if (q.type === 'num') return '<div><label>' + esc(q.q) + '</label><input type="number" data-rdq="' + q.id + '" min="' + q.min + '" max="' + q.max + '" value="' + esc(v || '') + '"></div>';
  if (q.type === 'many') return '<div class="rdmany"><label>' + esc(q.q) + '</label><div class="rdchips">' + opts.map(function (o) { var on = (v || []).indexOf(o[0]) >= 0; return '<label class="chk"><input type="checkbox" data-rdm="' + q.id + '" value="' + o[0] + '"' + (on ? ' checked' : '') + '>' + esc(o[1]) + '</label>'; }).join('') + '</div></div>';
  return '<div><label>' + esc(q.q) + '</label><select data-rdq="' + q.id + '"><option value="">—</option>' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
}
function rdCard(x, i, c) {
  var cur = c && c.ready && c.ready.id === x.id, li = function (a) { return a.length ? '<ul>' + a.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : ''; };
  return '<section class="dxc rdcard' + (i === 0 ? ' best' : '') + '"><div class="rdh"><span class="dxb">' + (i === 0 ? '⭐ الأمثل' : 'بديل ' + i) + '</span> <b>' + esc(x.name) + '</b>' + (cur ? ' <span class="dxb gstrong">معتمد للعميل</span>' : '') + '</div>'
    + '<div class="dxd"><p class="small">' + esc(x.label) + ' • ' + esc(x.region) + ' • ' + (x.sys === 'g' ? 'بالجرامات' : 'بالحصص') + '</p>'
    + '<div class="dxfix rdexp"><b>المتوقع:</b> ' + esc(x.expect.head || '') + li(x.expect.lines) + '</div>'
    + '<h4>لماذا هذا النظام</h4>' + li(x.why) + (x.caut.length ? '<div class="warn">⚠ ' + x.caut.map(esc).join(' • ') + '</div>' : '')
    + '<p class="small">' + esc(x.who) + '</p>'
    + '<p><button class="sm sec" data-a="rdOpen" data-v="' + esc(x.id) + '">' + (RDS.open === x.id ? 'إخفاء المعاينة' : 'معاينة الأسبوع') + '</button> ' + (c ? '<button class="sm" data-a="rdApprove" data-v="' + esc(x.id) + '">' + (cur ? 'معتمد ✓' : 'اعتمد لـ' + esc(c.name || c.code)) + '</button>' : '') + '</p>'
    + (RDS.open === x.id ? rdPreview(x.id) : '') + '</div></section>';
}
function rdPreview(id) {
  rdLoad(); if (RDS.err) return '<div class="warn">' + esc(RDS.err) + '</div>'; if (!RDS.blob) return '<p class="small">⏳ جارٍ فتح محتوى المكتبة…</p>';
  var d = rdDoc(id), e = RL.plan(id); if (!d || !e) return '<p class="small">لا محتوى لهذا النظام.</p>';
  var h = '<div class="rdprev">' + d.days.map(function (y, di) {
    return '<details' + (di === 0 ? ' open' : '') + '><summary><b>' + esc(y.t) + '</b></summary><table class="rdtbl"><tbody>' + y.m.map(function (m) {
      var mac = m[2] && m[2].k ? '<br><small>بروتين ' + Math.round(m[2].p) + ' • كارب ' + Math.round(m[2].c) + ' • دهون ' + Math.round(m[2].f) + ' • ' + Math.round(m[2].k) + ' سعرة</small>' : '';
      return '<tr><th>' + esc(m[0]) + mac + '</th><td>' + m[1].map(function (t) { var p = t.split(' ◂ '); return esc(p[0]) + (p[1] ? ' <small class="rdnote">◂ ' + esc(p[1]) + '</small>' : ''); }).join('<br>') + '</td></tr>';
    }).join('') + '</tbody></table>' + (y.tp.length ? '<p class="small">💡 ' + y.tp.map(esc).join(' • ') + '</p>' : '') + '</details>';
  }).join('');
  if (d.subsArr.length) h += '<details><summary><b>البدائل</b></summary><table class="rdtbl"><tbody>' + d.subsArr.map(function (s) { return '<tr><th>' + esc(s[0]) + '</th><td>' + s[1].map(esc).join(' • ') + '</td></tr>'; }).join('') + '</tbody></table></details>';
  var guide = d.secsArr.filter(function (s) { return s.p.length && s.t && !/^(اليوم|يوم)/.test(s.t); });
  if (guide.length) h += '<details><summary><b>شرح النظام وإرشاداته (من ملف المكتبة)</b></summary>' + guide.map(function (s) { return '<h4>' + esc(s.t) + '</h4><ul>' + s.p.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>'; }).join('') + '</details>';
  return h + '</div>';
}
function rdAutoTab(c) {
  if (!c) return '<p class="small">اختر عميلاً ليختار السيستم النظام الأنسب له من المكتبة تلقائياً.</p>';
  var a = rdAnswers(c), P = RL.norm(rdBase(c), a), qs = RL.questions(a, rdBase(c)), r = RL.recommend(a, rdBase(c));
  var src = c.hx && c.hx.quiz ? '<div class="ok">📲 أجاب العميل على أسئلة الاختيار في «حصتي» (' + new Date(c.hx.quiz.at).toLocaleDateString('ar-EG') + ')' + (c.hx.quiz.pick ? ' واختار: <b>' + esc((RL.plan(c.hx.quiz.pick) && RL.label(RL.plan(c.hx.quiz.pick))) || c.hx.quiz.pick) + '</b>' : '') + '</div>' : '<p class="small">الإجابات مبدئية من ملف العميل؛ عدّلها أو أرسل الأسئلة له من «حصتي».</p>';
  var h = src + '<div class="rdq"><div class="row">' + qs.map(function (q) { return rdQField(q, a, P); }).join('') + '</div>'
    + '<p class="small">الاحتياج التقديري ' + r.en.tdee + ' سعرة • مؤشر الكتلة ' + (r.en.bmi || '—') + (r.target ? ' • السعرات المستهدفة نحو ' + r.target : '') + '</p></div>';
  r.refer.forEach(function (t) { h += '<div class="warn dxstop">⛔ ' + esc(t) + '</div>'; });
  r.warn.forEach(function (t) { h += '<div class="warn">⚠ ' + esc(t) + '</div>'; });
  h += '<div class="rdcards">' + r.top.map(function (x, i) { return rdCard(x, i, c); }).join('') + '</div>';
  h += '<div class="dxbox rdother"><b>لا يناسبك أيٌّ منها؟</b> <button class="sm sec" data-a="rdTab" data-v="browse">اختر من المكتبة بنفسك</button> <button class="sm sec" data-a="rdNew">أنشئ نظاماً جديداً بمحرك «حصة»</button></div>';
  return h;
}
function rdBrowseTab(c) {
  var F = RL.idx.fams, bases = {}; Object.keys(F).forEach(function (k) { bases[F[k].b] = F[k].n; });
  var L = RL.idx.plans.filter(function (e) { var f = F[e.f]; return (!RDS.fam || f.b === RDS.fam) && (!RDS.rg || f.rg === RDS.rg || f.rg === 'all') && (!RDS.lvl || Math.abs(e.k - +RDS.lvl) <= 150); });
  var h = '<div class="row"><div><label>العائلة</label><select data-rdf="fam"><option value="">كل العائلات (' + Object.keys(bases).length + ')</option>' + Object.keys(bases).map(function (b) { return '<option value="' + b + '"' + (RDS.fam === b ? ' selected' : '') + '>' + esc(bases[b]) + '</option>'; }).join('') + '</select></div>'
    + '<div><label>الأكلات</label><select data-rdf="rg"><option value="">مصري وسعودي</option><option value="eg"' + (RDS.rg === 'eg' ? ' selected' : '') + '>مصري</option><option value="sa"' + (RDS.rg === 'sa' ? ' selected' : '') + '>سعودي وخليجي</option></select></div>'
    + '<div><label>السعرات (±150)</label><input type="number" data-rdf="lvl" min="900" max="4200" step="100" value="' + esc(RDS.lvl) + '" placeholder="مثال 1400"></div></div>'
    + '<p class="small">' + L.length + ' نظاماً مطابقاً' + (L.length > 80 ? ' (يظهر أول 80 — ضيّق البحث)' : '') + '</p>';
  h += '<div class="rdlist">' + L.slice(0, 80).map(function (e) {
    var cur = c && c.ready && c.ready.id === e.i;
    return '<div class="rdrow"><div><b>' + esc(RL.label(e)) + '</b><small>' + esc(RL.regionTxt(F[e.f].rg)) + (e.sx ? ' • ' + (e.sx === 'f' ? 'بنات' : 'أولاد') : '') + (e.ag ? ' • ' + e.ag[0] + '–' + e.ag[1] + ' سنة' : '') + (e.ac ? ' • ' + (e.ac === 'active' ? 'نشيط' : 'قليل النشاط') : '') + '</small></div><div><button class="sm sec" data-a="rdOpen" data-v="' + esc(e.i) + '">' + (RDS.open === e.i ? 'إخفاء' : 'معاينة') + '</button>' + (c ? ' <button class="sm" data-a="rdApprove" data-v="' + esc(e.i) + '">' + (cur ? 'معتمد ✓' : 'اعتمد') + '</button>' : '') + '</div>' + (RDS.open === e.i ? '<div class="rdfull">' + rdPreview(e.i) + '</div>' : '') + '</div>';
  }).join('') + '</div>';
  return h;
}
function rdGuideTab() {
  var F = RL.idx.fams, seen = {}, h = '<p class="small">نبذة كل عائلة في مكتبتك ولمن تناسب، ودليل الأخصائي الكامل من ملفاتك.</p>';
  Object.keys(F).sort().forEach(function (k) {
    var f = F[k]; if (seen[f.b]) return; seen[f.b] = 1;
    var regs = Object.keys(F).filter(function (x) { return F[x].b === f.b; }), n = RL.idx.plans.filter(function (e) { return F[e.f].b === f.b; }).length, open = RDS.guide === f.b;
    h += '<section class="dxc' + (open ? ' open' : '') + '"><button class="dxh" data-a="rdGuide" data-v="' + f.b + '" aria-expanded="' + open + '"><span class="dxn">' + esc(f.n) + '</span><span class="dxb">' + n + ' نظاماً</span><span class="dxb">' + regs.map(function (x) { return F[x].rg === 'eg' ? 'مصري' : F[x].rg === 'sa' ? 'سعودي' : 'مشترك'; }).join(' + ') + '</span><span class="dxb">' + (f.sys === 'g' ? 'جرامات' : 'حصص') + '</span></button><p class="dxs">' + esc(f.who) + ' ' + esc(f.note) + '</p>';
    if (open) {
      rdLoad(); var g = RDS.blob && (RDS.blob.guides[regs[0]] || RDS.blob.guides[regs[1]]);
      h += '<div class="dxd">' + (RDS.err ? '<div class="warn">' + esc(RDS.err) + '</div>' : !RDS.blob ? '<p class="small">⏳ جارٍ الفتح…</p>' : g && g.spec.length ? g.spec.map(function (s) { return (s.t ? '<h4>' + esc(s.t) + '</h4>' : '') + (s.p.length ? '<ul>' + s.p.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '') + (s.tb || []).map(function (tb) { return '<table class="rdtbl"><tbody>' + tb.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + esc(x).replace(/\n/g, '<br>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; }).join(''); }).join('') : '<p class="small">لا يوجد دليل أخصائي منفصل لهذه العائلة؛ الشرح داخل كل نظام (معاينة).</p>') + '</div>';
    }
    h += '</section>';
  });
  return h;
}
function rdPage() {
  if (!window.RL || !RL.idx) return '<p>مكتبة الأنظمة غير متاحة في هذه النسخة.</p>';
  var cl = S.clients.slice().sort(function (a, b) { return (b.updated || b.created || 0) - (a.updated || a.created || 0); }), c = rdClient();
  var h = '<div class="dxl rdl"><h2>📗 مكتبة الأنظمة الجاهزة</h2><p class="small">' + RL.idx.plans.length + ' نظاماً أسبوعياً جاهزاً من مكتبتك (أكلات مصرية وسعودية، بالحصص والجرامات). السيستم يختار للعميل الأمثل + بديلين مع المتوقع من كل نظام، وأنت تعتمد أو تختار غيره أو تنشئ نظاماً جديداً. (أنظمة المنتجات غير مستخدمة.)</p>'
    + '<div class="tabs"><button class="' + (RDS.tab === 'auto' ? 'on' : '') + '" data-a="rdTab" data-v="auto">اختيار تلقائي للعميل</button><button class="' + (RDS.tab === 'browse' ? 'on' : '') + '" data-a="rdTab" data-v="browse">تصفّح المكتبة</button><button class="' + (RDS.tab === 'guide' ? 'on' : '') + '" data-a="rdTab" data-v="guide">دليل العائلات</button></div>'
    + '<div class="dxcl"><label>العميل</label><select data-rdcl><option value="">— اختر عميلاً —</option>' + cl.map(function (x) { return '<option value="' + esc(x.code) + '"' + (c && c.code === x.code ? ' selected' : '') + '>' + esc(x.name || '(بلا اسم)') + ' — ' + x.code + (x.hx && x.hx.quiz ? ' 📲' : '') + '</option>'; }).join('') + '</select>'
    + (c && c.ready ? '<small>النظام المعتمد: ' + esc(c.ready.label) + '</small>' : '') + '</div>';
  h += RDS.tab === 'auto' ? rdAutoTab(c) : RDS.tab === 'browse' ? rdBrowseTab(c) : rdGuideTab();
  return h + '</div>';
}
// ---- خطة من البنك: يعتمدها الأخصائي فتصير خطة العميل في تبويب «الخطة» والطباعة و«حصتي»
function rdUse(c, id) {
  var e = RL.plan(id); if (!c || !e) { toast('اختر عميلاً أولاً'); return; }
  if (c.plan && c.planSrc !== 'ready' && !confirm('سيُستبدل عرض الخطة الحالية بخطة البنك «' + RL.label(e) + '» (تبقى خطة المحرك محفوظة ويمكنك العودة لها بـ«ولّد خطة جديدة»). المتابعة؟')) return;
  toast('جارٍ التجهيز…');
  rdLoad().then(function (B) {
    var d = B && rdDoc(id); if (!d) { toast(RDS.err || 'تعذّر فتح المكتبة'); return; }
    c.ready = { id: e.i, label: RL.label(e), name: RL.fam(e.f).n, when: RL.bestWhen(e), at: Date.now(), ans: RDS.ans[c.code] || (c.hx && c.hx.quiz && c.hx.quiz.ans) || null };
    c.readyDoc = { days: d.days, subs: d.subsArr, guide: d.secsArr.filter(function (x) { return x.p.length && x.t && !/^(اليوم|يوم)/.test(x.t); }).map(function (x) { return { t: x.t, p: x.p }; }) };
    c.planSrc = 'ready'; RDS.bank[c.code] = false; RDS.open = ''; S.view = 'client'; S.cur = c.code; S.tab = 'plan';
    return persist(c).then(function () { render(); window.scrollTo(0, 0); toast('✓ طُبّقت خطة البنك «' + c.ready.label + '» على ' + (c.name || c.code)); });
  });
}
function rdQuizNote(c) {                                                // ما اختاره العميل في «حصتي» قبل الاعتماد
  var q = c.hx && c.hx.quiz, pk = q && q.pick && RL.plan(q.pick);
  if (!q) return '';
  return '<div class="ok rdqn">📲 أجاب العميل على أسئلة الاختيار في «حصتي»' + (pk ? ' واختار: <b>' + esc(RL.label(pk)) + '</b>' : ' وترك الاختيار لك') + (c.planSrc === 'ready' && c.ready && pk && c.ready.id === q.pick ? ' — مطبَّقة ✓' : ' — افتح «ولّد خطة من البنك» لترى اختياره مع الخيارات الأنسب') + '</div>';
}
function rdGenBtns(c) {                                                 // أسفل «بيانات العميل»: من البنك أو جديدة بالمحرك
  if (!window.RL || !RL.idx) return '<button class="o" data-a="gen">ولّد خطة جديدة ←</button>';
  return rdQuizNote(c) + '<span class="rdgen"><button class="o" data-a="genBank">📗 ولّد خطة من البنك</button> <button class="sec" data-a="gen">⚙ ولّد خطة جديدة</button></span>';
}
function rdMany(q, a, P) {                                              // اختيار متعدد في قائمة منسدلة مضغوطة
  var v = a[q.id] || [], opts = RL.optsOf(q, a, P), n = v.length;
  return '<div class="rdmany"><label>' + esc(q.q) + '</label><details class="rddd"><summary>' + (n ? opts.filter(function (o) { return v.indexOf(o[0]) >= 0; }).map(function (o) { return esc(o[1]); }).join('، ') : 'لا شيء') + '</summary><div class="rdddb">' + opts.map(function (o) { return '<label class="chk"><input type="checkbox" data-rdm="' + q.id + '" value="' + o[0] + '"' + (v.indexOf(o[0]) >= 0 ? ' checked' : '') + '>' + esc(o[1]) + '</label>'; }).join('') + '</div></details></div>';
}
function rdOpt(x, i, c, pick) {                                         // بطاقة خيار في منتقي البنك
  var isPick = pick === x.id;
  return '<section class="rdopt' + (i === 0 ? ' best' : '') + '"><div class="rdoh"><span class="rdn">' + (i + 1) + '</span><div class="rdot"><b>' + esc(x.name) + '</b>' + (i === 0 ? ' <span class="dxb gstrong">⭐ الأنسب</span>' : '') + (isPick ? ' <span class="dxb">📲 اختيار العميل</span>' : '') + '<small>' + esc(x.label) + ' • ' + esc(x.region) + ' • ' + (x.sys === 'g' ? 'بالجرامات' : 'بالحصص') + '</small></div>'
    + '<div class="rdob"><button class="sm sec" data-a="rdOpen" data-v="' + esc(x.id) + '">' + (RDS.open === x.id ? 'إخفاء' : 'معاينة') + '</button> <button class="sm" data-a="rdApprove" data-v="' + esc(x.id) + '" data-c="' + esc(c.code) + '">اختر هذه الخطة</button></div></div>'
    + '<p class="rdwhen">💡 ' + esc(x.when) + '</p><p class="rdexp1"><b>المتوقع:</b> ' + esc(x.expect.head || '') + (x.caut.length ? ' <span class="rdcaut">⚠ ' + x.caut.map(esc).join(' • ') + '</span>' : '') + '</p>'
    + (RDS.open === x.id ? rdPreview(x.id) : '') + '</section>';
}
function rdBankPanel(c) {
  var a = rdAnswers(c), base = rdBase(c), P = RL.norm(base, a), qs = RL.questions(a, base).filter(function (q) { return q.type !== 'num' && q.id !== 'sex'; }), r = RL.recommend(a, base), q = c.hx && c.hx.quiz;
  var pick = q && q.pick; if (pick && RL.plan(pick) && !r.top.some(function (x) { return x.id === pick; })) { var e = RL.plan(pick), F = RL.fam(e.f); r.top = r.top.slice(0, 6).concat([{ id: e.i, e: e, fk: e.f, name: F.n, label: RL.label(e), region: RL.regionTxt(F.rg), sys: F.sys, when: RL.bestWhen(e), why: [], caut: [], expect: RL.expect(e, P, r.en, a) }]); }
  var h = '<div class="rdbank"><div class="rdbh"><h3>📗 خطط البنك الأنسب لـ' + esc(c.name || c.code) + '</h3><button class="sm sec noprint" data-a="rdBankClose">إغلاق</button></div>'
    + rdQuizNote(c) + '<div class="row rdq">' + qs.map(function (x) { return x.type === 'many' ? rdMany(x, a, P) : rdQField(x, a, P); }).join('') + '</div>'
    + '<p class="small">الاحتياج التقديري ' + r.en.tdee + ' سعرة • مؤشر الكتلة ' + (r.en.bmi || '—') + (r.target ? ' • المستهدف نحو ' + r.target + ' سعرة' : '') + ' • ' + r.top.length + ' ' + (r.top.length > 2 ? 'خطط' : 'خطة') + ' بأنواع مختلفة (حتى 7)</p>';
  r.refer.forEach(function (t) { h += '<div class="warn dxstop">⛔ ' + esc(t) + '</div>'; });
  r.warn.forEach(function (t) { h += '<div class="warn">⚠ ' + esc(t) + '</div>'; });
  h += r.top.map(function (x, i) { return rdOpt(x, i, c, pick); }).join('');
  h += '<p class="rdfoot"><button class="sec" data-a="gen">⚙ لا يناسب؟ ولّد خطة جديدة بالمحرك</button> <button class="sec" data-a="rdFor" data-v="' + esc(c.code) + '">📚 تصفّح المكتبة كاملة</button></p><p class="small">«الأنسب إذا…» والمتوقع مسودة من أدلة المكتبة؛ قرار الاختيار للأخصائي.</p>';
  return h + '</div>';
}
function rdPlanView(c) {                                                // خطة البنك المطبَّقة: تبويب «الخطة» + الطباعة
  var R = c.ready, d = c.readyDoc, e = RL.plan(R.id), ex = e ? RL.expect(e, RL.norm(rdBase(c), R.ans || {}), RL.energy(RL.norm(rdBase(c), R.ans || {})), R.ans || {}) : null;
  var h = '<div class="rdplan"><div class="dxbox rdph"><div><b>📗 ' + esc(R.name) + '</b> <span class="dxb">من البنك</span><br><small>' + esc(R.label) + '</small>' + (R.when ? '<p class="small">💡 ' + esc(R.when) + '</p>' : '') + (ex ? '<p class="small"><b>المتوقع:</b> ' + esc(ex.head || '') + '</p>' : '') + '</div>'
    + '<p class="noprint"><button class="sm" onclick="window.print()">🖨 طباعة</button> ' + (c.hx ? '<button class="sm" data-a="hxSendPlan">📲 أرسل إلى «حصتي»' + (R.sentV ? ' (أُرسل v' + R.sentV + ')' : '') + '</button> ' : '') + '<button class="sm sec" data-a="genBank">📗 اختر خطة أخرى من البنك</button> <button class="sm sec" data-a="gen">⚙ ولّد خطة جديدة</button></p></div>';
  h += '<h2 class="printonly">' + esc(c.name || '') + ' — ' + esc(R.label) + '</h2>';
  h += d.days.map(function (y, di) {
    return '<section class="rdday"><h3>' + esc((D.days || [])[di] || '') + ' — ' + esc(y.t.replace(/^اليوم [^-–]*[-–]\s*/, '')) + '</h3><table class="rdtbl"><tbody>' + y.m.map(function (m) {
      var mac = m[2] && m[2].k ? '<br><small>بروتين ' + Math.round(m[2].p) + ' • كارب ' + Math.round(m[2].c) + ' • دهون ' + Math.round(m[2].f) + ' • ' + Math.round(m[2].k) + ' سعرة</small>' : '';
      return '<tr><th>' + esc(m[0]) + mac + '</th><td>' + m[1].map(function (t) { var p = t.split(' ◂ '); return esc(p[0]) + (p[1] ? ' <small class="rdnote">◂ ' + esc(p[1]) + '</small>' : ''); }).join('<br>') + '</td></tr>';
    }).join('') + '</tbody></table>' + ((y.tp || []).length ? '<p class="small">💡 ' + y.tp.map(esc).join(' • ') + '</p>' : '') + '</section>';
  }).join('');
  if ((d.subs || []).length) h += '<section class="rdday"><h3>البدائل</h3><table class="rdtbl"><tbody>' + d.subs.map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + x[1].map(esc).join(' • ') + '</td></tr>'; }).join('') + '</tbody></table></section>';
  if ((d.guide || []).length) h += '<details class="rdday"><summary><b>شرح النظام وإرشاداته</b></summary>' + d.guide.map(function (x) { return '<h4>' + esc(x.t) + '</h4><ul>' + x.p.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>'; }).join('') + '</details>';
  return h + '</div>';
}
function rdPlanTab(c) {                                                 // يسبق تبويب الخطة: المنتقي ← خطة البنك ← (لا خطة) زرّان
  if (!window.RL || !RL.idx || !c) return '';
  if (RDS.bank[c.code]) return rdBankPanel(c);
  if (c.planSrc === 'ready' && c.ready && c.readyDoc) return rdPlanView(c);
  if (!c.plan) return '<p>لم تُولَّد خطة بعد.</p>' + rdQuizNote(c) + '<p class="rdgen"><button class="o" data-a="genBank">📗 ولّد خطة من البنك</button> <button class="sec" data-a="gen">⚙ ولّد خطة جديدة</button></p>';
  return '';
}
Object.assign(A, {
  ready: function () { S.view = S.view === 'ready' ? 'client' : 'ready'; render(); window.scrollTo(0, 0); },
  rdTab: function (v) { RDS.tab = v; RDS.open = ''; main(); },
  rdOpen: function (v) { RDS.open = RDS.open === v ? '' : v; main(); },
  rdGuide: function (v) { RDS.guide = RDS.guide === v ? '' : v; main(); },
  rdFor: function (v) { RDS.client = v; RDS.tab = 'auto'; S.view = 'ready'; render(); window.scrollTo(0, 0); },
  rdApprove: function (v, el) { var code = el && el.getAttribute && el.getAttribute('data-c'), c = code ? S.clients.filter(function (x) { return x.code === code; })[0] : rdClient(); rdUse(c, v); },
  rdClear: function () { var c = cur(); if (!c || !c.ready) return; if (!confirm('إزالة خطة البنك من العميل؟')) return; delete c.ready; delete c.readyDoc; c.planSrc = 'engine'; persist(c).then(main); },
  genBank: function () { var c = cur(); if (!c) return; if (!c.name) { toast('اكتب اسم العميل أولاً'); return; } RDS.bank[c.code] = true; RDS.open = ''; S.tab = 'plan'; rdLoad(); render(); window.scrollTo(0, 0); },
  rdBankClose: function () { var c = cur(); if (c) RDS.bank[c.code] = false; RDS.open = ''; main(); },
  rdNew: function () { var c = rdClient(); if (!c) return; S.view = 'client'; S.cur = c.code; (A.pick ? A.pick(c.code) : Promise.resolve()).then(function () { S.tab = 'plan'; S.page = 'sum'; render(); toast('أنشئ النظام الجديد من تبويب الخطة («ولّد الخطة») أو من «مكتبة الأخصائي»'); }); },
  rdSend: function () { if (A.hxSendPlan) A.hxSendPlan(); }
});
(function (g0) {                                                       // «ولّد خطة جديدة» = محرك «حصة»؛ تبقى خطة البنك محفوظة للرجوع إليها
  A.gen = function () { var c = cur(), prev = c && c.planSrc; if (c) { c.planSrc = 'engine'; RDS.bank[c.code] = false; } var r = g0.apply(this, arguments); if (c && !c.plan) c.planSrc = prev; return r; };
})(A.gen);
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || !t.dataset || (S.view !== 'ready' && !(t.closest && t.closest('.rdbank')))) return;
  if (t.hasAttribute('data-rdcl')) { RDS.client = t.value; RDS.open = ''; main(); return; }
  if (t.dataset.rdf) { RDS[t.dataset.rdf] = t.value; RDS.open = ''; main(); return; }
  var c = S.view === 'ready' ? rdClient() : cur(); if (!c) return; var a = rdAnswers(c);
  if (t.dataset.rdq) { a[t.dataset.rdq] = t.type === 'number' ? (+t.value || '') : t.value; RDS.open = ''; main(); return; }
  if (t.dataset.rdm) { var k = t.dataset.rdm, arr = (a[k] || []).filter(function (x) { return x !== t.value; }); if (t.checked) arr.push(t.value); a[k] = arr; RDS.open = ''; main(); }
});
// ---- قوائم منسدلة مضغوطة لصفحة «بيانات العميل» (اختيار متعدد بنفس مفاتيح data-ck/data-bf/data-nb فلا يتغير الحفظ)
function ddChecks(k, label, all, vals) {
  vals = vals || []; var on = all.filter(function (a) { return vals.indexOf(a) >= 0; });
  return '<div><label>' + esc(label) + '</label><details class="rddd"><summary data-none="لا شيء">' + (on.length ? esc(on.join('، ')) : 'لا شيء') + '</summary><div class="rdddb">' + checks(k, all, vals) + '</div></details></div>';
}
function ddBox(label, inner) { return '<div><label>' + esc(label) + '</label><details class="rddd"><summary data-none="الافتراضي">' + 'الافتراضي' + '</summary><div class="rdddb">' + inner + '</div></details></div>'; }
function ddSum(d) {                                                     // نص الملخص = ما اختير
  var sm = d.querySelector('summary'), on = [].slice.call(d.querySelectorAll('input:checked')).map(function (i) { return i.parentNode.textContent.trim(); });
  if (sm && !d.closest('.rdbank')) sm.textContent = on.length ? on.join('، ') : sm.getAttribute('data-none') || 'لا شيء';
}
document.addEventListener('change', function (e) { var d = e.target && e.target.closest && e.target.closest('.rddd'); if (d) ddSum(d); });
document.addEventListener('toggle', function (e) {                       // تذكّر الطيّ، وقائمة واحدة مفتوحة
  var d = e.target; if (!d || !d.matches) return;
  if (d.matches('details.fold') && d.dataset.fold) S[d.dataset.fold] = d.open;
  if (d.matches('details.rddd') && d.open) document.querySelectorAll('details.rddd[open]').forEach(function (x) { if (x !== d) x.open = false; });
}, true);
document.addEventListener('click', function (e) { if (!e.target.closest || e.target.closest('details.rddd')) return; document.querySelectorAll('details.rddd[open]').forEach(function (x) { x.open = false; }); });
setTimeout(function () { document.querySelectorAll('details.rddd').forEach(ddSum); }, 0);
