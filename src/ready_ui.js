// ================= مكتبة الأنظمة الجاهزة (0.42): قسم في «حصة» (يُدمج داخل app.js عند /*READYUI*/)
// ثلاث طرق: اختيار تلقائي من بيانات العميل (الأمثل + بديلان + المتوقع) • تصفّح المكتبة واختيار يدوي • إنشاء نظام جديد بمحرك «حصة».
// المنطق في src/readylib.js (RL)؛ محتوى الخطط مضغوط داخل الصفحة ويُفك عند أول معاينة. مكتبة المنتجات مستبعدة.
var RDS = { tab: 'auto', client: '', ans: {}, open: '', fam: '', rg: '', lvl: '', guide: '', blob: null, loading: false, err: '', bank: {}, page: {}, alt: '' };
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
  if (RDS.ans[c.code]) return rdRegion(c, RDS.ans[c.code]);
  var q = c.hx && c.hx.quiz && c.hx.quiz.ans, a = q ? JSON.parse(JSON.stringify(q)) : {}, cond = c.conditions || [];
  if (!q) {
    var g = String(c.goal || ''), bmi = c.weight && c.height ? c.weight / Math.pow(c.height / 100, 2) : 25;   // «ثبات» هو الافتراضي في ملف العميل فلا يعني «ما بعد التنحيف»
    a.goal = /خسارة/.test(g) ? 'lose' : /زيادة/.test(g) ? 'gain' : c.kind === 'athlete' ? 'cut' : bmi < 18.5 ? 'gain' : 'lose';
    a.region = c.cuisine === 'sa' ? 'sa' : 'eg'; a.cond = []; if (cond.some(function (x) { return /مقاومة/.test(x); })) a.cond.push('ir'); if (cond.some(function (x) { return /^سكري/.test(x); })) a.cond.push('diab');      // «ما قبل السكري» ليس سكرياً على دواء
    a.routine = String(c.budget) === '1' ? 'budget' : c.life === 'quick' || c.life === 'travel' ? 'office' : 'classic';     // من «نمط الوجبات» في بيانات العميل
    if (c.kind === 'athlete' && /زيادة/.test(g)) a.goal = 'bulk';
  }
  a.sys = c.kind === 'athlete' ? 'g' : 'ex'; a.limit = 7;
  RDS.ans[c.code] = a; return rdRegion(c, a);
}
function rdRegion(c, a) {                                              // «المطبخ» في بيانات العميل يرجّح النتائج تلقائياً (مختلط = مصري وسعودي معاً)
  a.region = c.cuisine === 'eg' || c.cuisine === 'sa' ? c.cuisine : (c.hx && c.hx.quiz && c.hx.quiz.ans && c.hx.quiz.ans.region) || 'mix'; return a;
}
function rdQField(q, a, P) {
  var v = a[q.id], opts = RL.optsOf(q, a, P); if (q.id === 'region') opts = [['mix', 'مختلط (مصري وسعودي)', '']].concat(opts);
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
  var h = '<div class="dxl rdl"><h2>📗 الخطط الجاهزة</h2><p class="small">' + RL.idx.plans.length + ' نظاماً أسبوعياً جاهزاً من مكتبتك (أكلات مصرية وسعودية، بالحصص والجرامات). السيستم يختار للعميل الأمثل + بديلين مع المتوقع من كل نظام، وأنت تعتمد أو تختار غيره أو تنشئ نظاماً جديداً. (أنظمة المنتجات غير مستخدمة.)</p>'
    + '<div class="tabs"><button class="' + (RDS.tab === 'auto' ? 'on' : '') + '" data-a="rdTab" data-v="auto">اختيار تلقائي للعميل</button><button class="' + (RDS.tab === 'browse' ? 'on' : '') + '" data-a="rdTab" data-v="browse">تصفّح المكتبة</button><button class="' + (RDS.tab === 'guide' ? 'on' : '') + '" data-a="rdTab" data-v="guide">دليل العائلات</button>' + (window.DX ? '<button class="' + (RDS.tab === 'lib' ? 'on' : '') + '" data-a="rdTab" data-v="lib">📚 مكتبة الأخصائي</button>' : '') + '</div>'
    + '<div class="dxcl"><label>العميل</label><select data-rdcl><option value="">— اختر عميلاً —</option>' + cl.map(function (x) { return '<option value="' + esc(x.code) + '"' + (c && c.code === x.code ? ' selected' : '') + '>' + esc(x.name || '(بلا اسم)') + ' — ' + x.code + (x.hx && x.hx.quiz ? ' 📲' : '') + '</option>'; }).join('') + '</select>'
    + (c && c.ready ? '<small>النظام المعتمد: ' + esc(c.ready.label) + '</small>' : '') + '</div>';
  if (RDS.tab === 'lib' && window.DX) return h.replace(/<div class="dxcl">[\s\S]*$/, '') + dxLibPage().replace(/<h2>[^<]*<\/h2>/, '<h3>📚 مكتبة الأخصائي — الأنظمة العلمية ومشاكل الأخصائي</h3>') + '</div>';   // 0.46: مكتبة الأخصائي تبويب داخل «الخطط الجاهزة»
  h += RDS.tab === 'auto' ? rdAutoTab(c) : RDS.tab === 'browse' ? rdBrowseTab(c) : rdGuideTab();
  return h + '</div>';
}
// ---- خطة من البنك: يعتمدها الأخصائي فتصير خطة العميل في تبويب «الخطة» والطباعة و«حصتي»
function rdUse(c, id, quiet) {
  var e = RL.plan(id); if (!c || !e) { toast('اختر عميلاً أولاً'); return; }
  if (!quiet && c.plan && c.planSrc !== 'ready' && !confirm('سيُستبدل عرض الخطة الحالية بخطة البنك «' + RL.label(e) + '» (تبقى خطة المحرك محفوظة ويمكنك العودة لها بـ«ولّد خطة جديدة»). المتابعة؟')) return;
  toast('جارٍ التجهيز…');
  rdLoad().then(function (B) {
    var d = B && rdDoc(id); if (!d) { toast(RDS.err || 'تعذّر فتح المكتبة'); return; }
    c.ready = { id: e.i, label: RL.label(e), name: RL.fam(e.f).n, when: RL.bestWhen(e), at: Date.now(), ans: RDS.ans[c.code] || (c.hx && c.hx.quiz && c.hx.quiz.ans) || null };
    c.readyDoc = { days: d.days, subs: d.subsArr, ex: d.ex || [], guide: d.secsArr.filter(function (x) { return x.p.length && x.t && !/^(اليوم|يوم)/.test(x.t); }).map(function (x) { return { t: x.t, p: x.p }; }) };
    c.planSrc = 'ready'; RDS.bank[c.code] = false; RDS.open = ''; RDS.page[c.code] = 'sum'; S.view = 'client'; S.cur = c.code; S.tab = 'plan';
    return persist(c).then(function () { render(); window.scrollTo(0, 0); toast('✓ طُبّقت خطة البنك «' + c.ready.label + '» على ' + (c.name || c.code)); });
  });
}
function rdQuizNote(c) {                                                // ما اختاره العميل في «حصتي» قبل الاعتماد
  var q = c.hx && c.hx.quiz, pk = q && q.pick && RL.plan(q.pick);
  if (!q) return '';
  return '<div class="ok rdqn">📲 أجاب العميل على أسئلة الاختيار في «حصتي»' + (pk ? ' واختار: <b>' + esc(RL.label(pk)) + '</b>' : ' وترك الاختيار لك') + (c.planSrc === 'ready' && c.ready && pk && c.ready.id === q.pick ? ' — مطبَّقة ✓' : ' — افتح «📗 اختر خطة جاهزة» لترى اختياره مع الخيارات الأنسب') + '</div>';
}
function rdGenBtns(c) {                                                 // أسفل «بيانات العميل»: من البنك أو جديدة بالمحرك
  if (!window.RL || !RL.idx) return '<button class="o" data-a="gen">ولّد خطة جديدة ←</button>';
  return rdQuizNote(c) + '<span class="rdgen"><button class="o" data-a="genBank">📗 اختر خطة جاهزة</button> <button class="sec" data-a="gen">⚙ ولّد خطة جديدة</button></span>';
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
// ---- خطة البنك بنفس صفحات خطة المحرك: الملخص • تقسيم الحصص • 7 أيام بجدول المجموعات • البدائل (تبديل وتعديل) • Word
var RGK = [['st', 'starch', 'نشويات'], ['le', 'legumes', 'بقوليات'], ['me', 'meat', 'لحوم'], ['da', 'milk', 'ألبان'], ['ve', 'veg', 'خضار'], ['fr', 'fruit', 'فاكهة'], ['ot', 'other', 'أخرى'], ['fa', 'fat', 'دهون']];
var RD_EXROW = [['نشويات'], ['بقوليات'], ['لحوم', 'شديدة الانخفاض بالدهون'], ['لحوم', 'قليلة الدهون'], ['لحوم', 'متوسطة الدهون'], ['لحوم', 'عالية الدهون'], ['ألبان', 'قليل الدسم'], ['ألبان', 'متوسط الدسم'], ['ألبان', 'كامل الدسم'], ['خضروات غير نشوية'], ['فواكه'], ['دهون'], ['أخرى']];
var RD_EXKEY = ['starch', 'legumes', 'meat', 'meat', 'meat', 'meat', 'milk', 'milk', 'milk', 'veg', 'fruit', 'fat', 'other'];
function rdSubKey(t) { t = String(t || ''); return /نشويات/.test(t) ? 'starch' : /بقوليات/.test(t) ? 'legumes' : /لحوم|بروتين/.test(t) ? 'meat' : /حليب|ألبان/.test(t) ? 'milk' : /خضار/.test(t) ? 'veg' : /فاكهة/.test(t) ? 'fruit' : /دهون/.test(t) ? 'fat' : 'other'; }
function rdExTitle(t, i) {
  var m = String(t || ''), T = [[/LOW day/i, 'اليوم المنخفض'], [/HIGH day/i, 'اليوم المرتفع'], [/MEDIUM day/i, 'اليوم المتوسط'], [/SOFT days/i, 'أيام الحقنة (1–3)'], [/GOOD APPETITE/i, 'أيام الشهية الأفضل (4–7)'], [/FRIDAY/i, 'الجمعة (وجبة مرحة)'], [/REFEED/i, 'يوم الريفيد'], [/TRAIN/i, 'يوم التمرين'], [/REST/i, 'يوم الراحة']], w = m.match(/WEEK\s*(\d+)/i);
  for (var k = 0; k < T.length; k++) if (T[k][0].test(m)) return T[k][1];
  return w ? 'الأسبوع ' + w[1] : 'جدول الحصص' + (i ? ' ' + (i + 1) : '');
}
var RD_IK = ['starch', 'legumes', 'meat', 'milk', 'veg', 'fruit', 'fat', 'other'];
function rdItemKey(t) { return RD_IK[RL.groupOf(String(t).split(' ◂ ')[0])]; }
function rdDayGroups(y) { var g = {}; y.m.forEach(function (m) { Object.keys(m[2] || {}).forEach(function (k) { if (/^(st|le|me|da|ve|fr|ot|fa)$/.test(k)) g[k] = (g[k] || 0) + (+m[2][k] || 0); }); }); return g; }
function rdIsG(d) { return d.days[0].m.some(function (m) { return m[2] && m[2].k; }); }
function rdByGroup(d) { var by = {}; (d.subs || []).forEach(function (s, gi) { var k = rdSubKey(s[0]); (by[k] = by[k] || []).push(gi); }); return by; }
function rdPgSum(c, R, d) {
  var bmi = c.weight && c.height ? (c.weight / Math.pow(c.height / 100, 2)).toFixed(1) : '—', G = rdIsG(d), dn = D.days || [];
  var rows = [['الاسم', c.name, 'الكود', c.code], ['العمر', c.age, 'الجنس', c.sex], ['الوزن (كجم)', c.weight, 'الطول (سم)', c.height], ['مؤشر كتلة الجسم', bmi, 'مستوى النشاط', c.activity], ['الهدف', c.goal, 'الحالة الصحية', (c.conditions || []).join('، ') || 'جيدة']];
  var h = '<div class="pg">' + hdr('نظامك الغذائي', R.label, R.when || '') + '<h3>بيانات العميل</h3><table class="st">' + rows.map(function (r) { return '<tr><td class="g" style="width:15%">' + r[0] + '</td><td class="v" style="width:35%">' + esc(r[1] == null ? '' : r[1]) + '</td><td class="g" style="width:15%">' + r[2] + '</td><td class="v" style="width:35%">' + esc(r[3] == null ? '' : r[3]) + '</td></tr>'; }).join('') + '</table>';
  var mac = [];
  if (G) { var t = [0, 0, 0, 0]; d.days.forEach(function (y) { y.m.forEach(function (m) { var x = m[2] || {}; t[0] += +x.c || 0; t[1] += +x.p || 0; t[2] += +x.f || 0; t[3] += +x.k || 0; }); }); var n = d.days.length || 1; mac.push(['متوسط الأسبوع', t[3] / n, t[0] / n, t[1] / n, t[2] / n]); }
  else (d.ex || []).forEach(function (e, i) { var T = e.r[e.r.length - 1] || []; if (/Total/i.test(T[0])) mac.push([rdExTitle(e.t, i), +T[5], +T[2], +T[3], +T[4]]); });
  if (mac.length === 1) { var M = mac[0]; h += '<h3>الماكروز اليومية — ' + Math.round(M[1]) + ' سعرة</h3><div class="kp"><div><div class="a">كربوهيدرات</div><div class="b">' + Math.round(M[2] * 4 / M[1] * 100) + '% • ' + Math.round(M[2]) + ' جم</div></div><div><div class="a">بروتين</div><div class="b">' + Math.round(M[3] * 4 / M[1] * 100) + '% • ' + Math.round(M[3]) + ' جم</div></div><div><div class="a">دهون</div><div class="b">' + Math.round(M[4] * 9 / M[1] * 100) + '% • ' + Math.round(M[4]) + ' جم</div></div></div>'; }
  else if (mac.length) h += '<h3>الماكروز اليومية</h3><table class="st"><tr><th class="th-o">نوع اليوم</th><th class="th-n">السعرات</th><th class="th-y">كربوهيدرات</th><th class="th-y">بروتين</th><th class="th-y">دهون</th></tr>' + mac.map(function (M) { return '<tr><td class="o">' + esc(M[0]) + '</td><td class="v">' + Math.round(M[1]) + '</td><td class="v">' + Math.round(M[2]) + ' جم</td><td class="v">' + Math.round(M[3]) + ' جم</td><td class="v">' + Math.round(M[4]) + ' جم</td></tr>'; }).join('') + '</table>';
  h += '<h3>' + (G ? 'السعرات والماكروز على أيام الأسبوع' : 'تقسيم الحصص على أيام الأسبوع') + '</h3><table class="st"><tr><th class="th-o">اليوم</th><th class="th-n">نوع اليوم</th><th class="th-n">السعرات</th>' + (G ? '<th class="th-y">بروتين</th><th class="th-y">كارب</th><th class="th-y">دهون</th>' : RGK.map(function (q) { return '<th class="th-y">' + q[2] + '</th>'; }).join('')) + '</tr>'
    + d.days.map(function (y, i) { var g = rdDayGroups(y), sm = { p: 0, c: 0, f: 0 }; if (G) y.m.forEach(function (m) { sm.p += +(m[2] || {}).p || 0; sm.c += +(m[2] || {}).c || 0; sm.f += +(m[2] || {}).f || 0; }); return '<tr><td class="g">' + esc(dn[i] || '') + '</td><td class="v">' + esc(rdDayType(y)) + '</td><td class="v">' + (y.k || '') + '</td>' + (G ? '<td class="v">' + Math.round(sm.p) + '</td><td class="v">' + Math.round(sm.c) + '</td><td class="v">' + Math.round(sm.f) + '</td>' : RGK.map(function (q) { return '<td class="v">' + (g[q[0]] ? num(g[q[0]]) : '') + '</td>'; }).join('')) + '</tr>'; }).join('') + '</table>';
  return h + ob(false, mac.length ? mac[0][1] : 0) + (R.ex && R.ex.head ? '<div class="tipb">المتوقع: ' + esc(R.ex.head) + '</div>' : '') + '</div>';
}
function rdDayType(y) { return String(y.t || '').replace(/^اليوم [^-–]*[-–]\s*/, '').replace(/\s*\(.*$/, ''); }
function rdPgGrp(c, R, d) {
  return (d.ex || []).map(function (e, ei) {
    var rows = e.r.slice(0, 13), tot = e.r[13] || [];
    var h = '<div class="pg">' + hdr('تقسيم الحصص', rdExTitle(e.t, ei) + (tot[5] ? ' • ' + tot[5] + ' سعرة حرارية يومياً' : ''), '') + '<table class="st"><tr><th class="th-n" colspan="2">المجموعات الغذائية</th><th class="th-y">عدد الحصص</th><th class="th-g">كربوهيدرات</th><th class="th-g">بروتين</th><th class="th-g">دهون</th><th class="th-n">السعرات</th></tr>';
    rows.forEach(function (r, i) {
      var L = RD_EXROW[i], col = colors()[RD_EXKEY[i]], first = L[1] && (i === 2 || i === 6), span = i === 2 ? 4 : 3, inGrp = i >= 2 && i <= 8;
      h += '<tr>' + (L[1] ? (first ? '<td class="o" rowspan="' + span + '" style="background:' + col + '">' + L[0] + '</td>' : '') + '<td class="g">' + L[1] + '</td>' : '<td class="o" colspan="2" style="background:' + col + '">' + L[0] + '</td>')
        + '<td class="y">' + (r[1] || '') + '</td>' + (inGrp ? (first ? '<td class="v" rowspan="' + span + '">' + (r[2] || '') + '</td><td class="v" rowspan="' + span + '">' + (r[3] || '') + '</td>' : '') : '<td class="v">' + (r[1] ? r[2] : '') + '</td><td class="v">' + (r[1] ? r[3] : '') + '</td>') + '<td class="v">' + (r[1] ? r[4] : '') + '</td><td class="v">' + (r[5] || '') + '</td></tr>';
    });
    return h + '<tr class="sum"><td class="s0" colspan="2">الإجمالي</td><td>' + (tot[1] || '') + '</td><td>' + (tot[2] || '') + '</td><td>' + (tot[3] || '') + '</td><td>' + (tot[4] || '') + '</td><td>' + (tot[5] || '') + '</td></tr></table>' + ob(false, +tot[5] || 0) + '</div>';
  }).join('');
}
function rdItem(t, ed, ds, w) { var p = String(t).split(' ◂ '); return (w ? '<b class="rdw" title="صنف من مجموعة أخرى — راجع الحصص">⚠</b> ' : '') + esc(p[0]) + (p[1] ? ' <small class="rdnote">◂ ' + esc(p[1]) + '</small>' : '') + (ed ? ' <button class="sec sm noprint" data-a="rdAlt" data-v="' + ds + '">بدّل</button> <button class="sec sm noprint" data-a="rdEdIt" data-v="' + ds + '">✎</button>' : ''); }
function rdPgDay(c, R, d, di, edit) {
  var y = d.days[di], G = rdIsG(d), dn = D.days || [], by = rdByGroup(d), g = rdDayGroups(y), mk = function (m) { var x = m[2] || {}; return RGK.map(function (q) { return x[q[0]] ? num(x[q[0]]) : ''; }); };
  var h = '<div class="pg">' + hdr(dn[di] || ('اليوم ' + (di + 1)), 'اليوم ' + (di + 1) + ' من ' + d.days.length + ' • ' + rdDayType(y) + (y.k ? ' • ' + y.k + ' سعرة حرارية' : ''), '');
  if (G) {
    h += '<table class="dt"><tr><th class="th-n">الوجبة</th><th class="th-n" style="width:58%">مكونات الوجبة</th><th style="background:' + colors().meat + '">بروتين</th><th style="background:' + colors().starch + '">كارب</th><th style="background:' + colors().fat + '">دهون</th><th class="th-n">سعرات</th></tr>';
    var sm = [0, 0, 0, 0]; y.m.forEach(function (m) { var x = m[2] || {}; sm[0] += +x.p || 0; sm[1] += +x.c || 0; sm[2] += +x.f || 0; sm[3] += +x.k || 0; });
    h += '<tr class="sum"><td class="s0">الإجمالي</td><td class="s0">مجموع اليوم</td><td>' + Math.round(sm[0]) + '</td><td>' + Math.round(sm[1]) + '</td><td>' + Math.round(sm[2]) + '</td><td>' + Math.round(sm[3]) + '</td></tr>';
    y.m.forEach(function (m, mi) { var x = m[2] || {}; h += '<tr><td class="o">' + esc(m[0]) + '</td><td class="f">' + m[1].map(function (t, li) { return '• ' + rdItem(t, edit, di + ',' + mi + ',' + li, (d.warn || {})[di + ',' + mi + ',' + li]) + rdAltBox(d, di, mi, li, by); }).join('<br>') + '</td><td class="v">' + Math.round(x.p || 0) + '</td><td class="v">' + Math.round(x.c || 0) + '</td><td class="v">' + Math.round(x.f || 0) + '</td><td class="v">' + Math.round(x.k || 0) + '</td></tr>'; });
  } else {
    h += '<table class="dt"><tr><th class="th-n" rowspan="2">الوجبة</th><th class="th-n" colspan="8">المجموعات الغذائية</th><th class="th-n" rowspan="2" style="width:40%">مكونات الوجبة</th></tr><tr>' + RGK.map(function (q) { return '<th style="background:' + colors()[q[1]] + ';font-size:11px">' + q[2] + '</th>'; }).join('') + '</tr>';
    h += '<tr class="sum"><td class="s0">الإجمالي</td>' + RGK.map(function (q) { return '<td>' + (g[q[0]] ? num(g[q[0]]) : '') + '</td>'; }).join('') + '<td class="s0">مجموع اليوم: ' + (y.k || '—') + ' سعرة</td></tr>';
    y.m.forEach(function (m, mi) { h += '<tr><td class="o">' + esc(m[0]) + '</td>' + mk(m).map(function (v) { return '<td class="v">' + v + '</td>'; }).join('') + '<td class="f">' + m[1].map(function (t, li) { return '• <i class="dot" style="background:' + colors()[rdItemKey(t)] + '"></i>' + rdItem(t, edit, di + ',' + mi + ',' + li, (d.warn || {})[di + ',' + mi + ',' + li]) + rdAltBox(d, di, mi, li, by); }).join('<br>') + '</td></tr>'; });
  }
  h += '</table>' + ((y.tp || []).length ? '<div class="tipb">' + y.tp.map(esc).join(' • ') + '</div>' : '');
  return h + rdSubsGrid(d, edit) + '</div>';
}
function rdAltBox(d, di, mi, li, by) {                                  // قائمة البدائل للتبديل (من جدول بدائل الخطة لنفس المجموعة)
  if (RDS.alt !== di + ',' + mi + ',' + li) return '';
  var key = rdItemKey(d.days[di].m[mi][1][li]), opts = [];
  (by[key] || []).forEach(function (gi) { (d.subs[gi][1] || []).forEach(function (x, ii) { opts.push([gi, ii, x]); }); });
  return '<div class="rdalt noprint">' + (opts.length ? opts.slice(0, 30).map(function (o) { return '<button class="sm sec" data-a="rdSwap" data-v="' + di + ',' + mi + ',' + li + ',' + o[0] + ',' + o[1] + '">' + esc(o[2]) + '</button>'; }).join(' ') : '<small>لا بدائل لهذه المجموعة في جدول الخطة — أضفها من «جدول البدائل» أو عدّل الصنف بـ✎</small>') + ' <button class="sm sec" data-a="rdAlt" data-v="">إغلاق</button></div>';
}
function rdSubsGrid(d, edit) {
  if (!(d.subs || []).length) return '';
  return '<h3>جدول البدائل — كل بديل يساوي حصة واحدة' + (edit ? ' <small class="noprint">(✎ تعديل • × حذف • + إضافة)</small>' : '') + '</h3><div class="gbox">' + d.subs.map(function (s, gi) {
    return '<div><h4 style="background:' + colors()[rdSubKey(s[0])] + ';color:#fff">' + esc(s[0]) + '</h4>' + (s[1] || []).map(function (x, ii) { return '<p>' + esc(x) + (edit ? ' <span class="noprint"><button class="sec sm" data-a="rdSubEd" data-v="' + gi + ',' + ii + '">✎</button><button class="sec sm" data-a="rdSubDel" data-v="' + gi + ',' + ii + '">×</button></span>' : '') + '</p>'; }).join('') + (edit ? '<p class="noprint"><button class="sec sm" data-a="rdSubAdd" data-v="' + gi + '">+ بديل</button></p>' : '') + '</div>';
  }).join('') + '</div>';
}
function rdPlanView(c) {                                                // خطة البنك المطبَّقة: نفس صفحات خطة المحرك وأدواتها
  var R = c.ready, d = c.readyDoc, e = RL.plan(R.id), a = R.ans || {}, P = RL.norm(rdBase(c), a), G = rdIsG(d);
  R.ex = e ? RL.expect(e, P, RL.energy(P), a) : null;
  var pg = RDS.page[c.code] == null ? 'sum' : RDS.page[c.code], pages = [['sum', 'الملخص']].concat(!G && (d.ex || []).length ? [['grp', 'تقسيم الحصص']] : [], d.days.map(function (y, i) { return [String(i), (D.days || [])[i] || 'اليوم ' + (i + 1)]; }), [['all', 'كل الصفحات']]);
  var h = '<div class="rdplan"><div class="noprint mxrow"><button class="sm sec" data-a="genBank">📗 اختر خطة أخرى من البنك</button> <button class="sm sec" data-a="gen">⚙ ولّد خطة جديدة</button> <button class="sm" data-a="rdDocx">تصدير Word (.docx)</button> <button class="sm" onclick="window.print()">تصدير PDF / طباعة</button>' + (c.hx ? ' <button class="sm" data-a="hxSendPlan">📲 أرسل إلى «حصتي»' + (R.sentV ? ' (أُرسل v' + R.sentV + ')' : '') + '</button>' : '') + (d.edited ? ' <button class="sm sec" data-a="rdReset">↺ استعادة الأصل من المكتبة</button>' : '') + '</div>'
    + '<div class="dxbox noprint rdph"><b>📗 ' + esc(R.name) + '</b> <span class="dxb">من البنك' + (d.edited ? ' • معدّلة' : '') + '</span> <small>' + esc(R.label) + '</small>' + (R.when ? '<div class="small">💡 ' + esc(R.when) + '</div>' : '') + (R.ex ? '<div class="small"><b>المتوقع:</b> ' + esc(R.ex.head || '') + '</div>' : '') + '</div>'
    + '<div class="pnav noprint">' + pages.map(function (x) { return '<button class="' + (pg === x[0] ? 'on' : 'sec') + '" data-a="rdPage" data-v="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>';
  if (pg === 'sum') h += rdPgSum(c, R, d); else if (pg === 'grp') h += rdPgGrp(c, R, d); else if (pg === 'all') h += rdPgSum(c, R, d) + (G ? '' : rdPgGrp(c, R, d)) + d.days.map(function (y, i) { return rdPgDay(c, R, d, i, false); }).join('');
  else h += rdPgDay(c, R, d, +pg, true);
  if (pg === 'sum' && (d.guide || []).length) h += '<details class="rdday noprint"><summary><b>شرح النظام وإرشاداته (من ملف المكتبة)</b></summary>' + d.guide.map(function (x) { return '<h4>' + esc(x.t) + '</h4><ul>' + x.p.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>'; }).join('') + '</details>';
  return h + '</div>';
}
function rdPlanTab(c) {                                                 // يسبق تبويب الخطة: المنتقي ← خطة البنك ← (لا خطة) زرّان
  if (!window.RL || !RL.idx || !c) return '';
  if (RDS.bank[c.code]) return rdBankPanel(c);
  if (c.planSrc === 'ready' && c.ready && c.readyDoc) return rdPlanView(c);
  if (!c.plan) return '<p>لم تُولَّد خطة بعد.</p>' + rdQuizNote(c) + '<p class="rdgen"><button class="o" data-a="genBank">📗 اختر خطة جاهزة</button> <button class="sec" data-a="gen">⚙ ولّد خطة جديدة</button></p>';
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
  rdSend: function () { if (A.hxSendPlan) A.hxSendPlan(); },
  rdPage: function (v) { var c = cur(); if (!c) return; RDS.page[c.code] = v; RDS.alt = ''; main(); },
  rdAlt: function (v) { RDS.alt = RDS.alt === v ? '' : v; main(); },
  rdSwap: function (v) { var c = cur(), d = c && c.readyDoc, k = v.split(',').map(Number); if (!d) return; var arr = d.days[k[0]].m[k[1]][1], old = arr[k[2]], nw = d.subs[k[3]][1][k[4]]; arr[k[2]] = nw; d.edited = true; if (d.warn) delete d.warn[k.slice(0, 3).join(',')]; RDS.alt = ''; persist(c).then(main); toast('بُدّل «' + old.split(' ◂ ')[0] + '» بـ«' + nw + '»'); },
  rdEdIt: function (v) { var c = cur(), d = c && c.readyDoc, k = v.split(',').map(Number); if (!d) return; var arr = d.days[k[0]].m[k[1]][1], t = prompt('عدّل الصنف (الاسم والكمية):', arr[k[2]].split(' ◂ ')[0]); if (t == null || !t.trim()) return; var note = arr[k[2]].split(' ◂ ')[1], g0 = RL.groupOf(arr[k[2]].split(' ◂ ')[0]), g1 = RL.groupOf(t.trim()); arr[k[2]] = t.trim() + (note ? ' ◂ ' + note : ''); d.edited = true; d.warn = d.warn || {}; if (g1 !== g0 && g1 !== 7) { d.warn[v] = 1; toast('⚠ الصنف الجديد من مجموعة أخرى — راجع عدد الحصص في الوجبة'); } else delete d.warn[v]; persist(c).then(main); },
  rdSubEd: function (v) { var c = cur(), d = c && c.readyDoc, k = v.split(',').map(Number); if (!d) return; var t = prompt('عدّل البديل:', d.subs[k[0]][1][k[1]]); if (t == null || !t.trim()) return; d.subs[k[0]][1][k[1]] = t.trim(); d.edited = true; persist(c).then(main); },
  rdSubDel: function (v) { var c = cur(), d = c && c.readyDoc, k = v.split(',').map(Number); if (!d || !confirm('حذف البديل «' + d.subs[k[0]][1][k[1]] + '»؟')) return; d.subs[k[0]][1].splice(k[1], 1); d.edited = true; persist(c).then(main); },
  rdSubAdd: function (v) { var c = cur(), d = c && c.readyDoc; if (!d) return; var t = prompt('بديل جديد في «' + d.subs[+v][0] + '» (يساوي حصة واحدة):', ''); if (t == null || !t.trim()) return; d.subs[+v][1].push(t.trim()); d.edited = true; persist(c).then(main); },
  rdReset: function () { var c = cur(); if (!c || !c.ready || !confirm('استعادة الخطة كما في المكتبة؟ تُلغى كل التبديلات والتعديلات.')) return; rdUse(c, c.ready.id, true); },
  rdDocx: function () {
    var c = cur(); if (!c || !c.readyDoc) return; try {
      var brx = Object.assign({}, BR(), { colors: colors(), logo: logoSrc() }), R = c.ready, P = RL.norm(rdBase(c), R.ans || {}), e = RL.plan(R.id); R.ex = e ? RL.expect(e, P, RL.energy(P), R.ans || {}) : null;
      toast('جارٍ إنشاء ملف Word…');
      DPDocx.buildReadyAsync(c, R, c.readyDoc, E, brx, { days: D.days, gk: RGK, exRow: RD_EXROW, exKey: RD_EXKEY, exTitle: rdExTitle, dayType: rdDayType, subKey: rdSubKey, groupOf: RL.groupOf }).then(function (u) { dlFile(new Blob([u], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), fileBase(c) + '.docx'); toast('تم تصدير ملف Word'); }).catch(function (e) { toast('تعذّر التصدير: ' + e.message); });
    } catch (e) { toast('تعذّر التصدير: ' + e.message); }
  }
});
(function (g0) {                                                       // «ولّد خطة جديدة» = محرك «حصة»؛ تبقى خطة البنك محفوظة للرجوع إليها
  A.gen = function () { var c = cur(), prev = c && c.planSrc; if (c) { c.planSrc = 'engine'; RDS.bank[c.code] = false; } var r = g0.apply(this, arguments); if (c && !c.plan) c.planSrc = prev; return r; };
})(A.gen);
document.addEventListener('change', function (e) {
  var t = e.target; if (!t || !t.dataset || (S.view !== 'ready' && !(t.closest && t.closest('.rdbank')))) return;
  if (t.hasAttribute('data-rdcl')) { RDS.client = t.value; RDS.open = ''; main(); return; }
  if (t.dataset.rdf) { RDS[t.dataset.rdf] = t.value; RDS.open = ''; main(); return; }
  var c = S.view === 'ready' ? rdClient() : cur(); if (!c) return; var a = rdAnswers(c);
  if (t.dataset.rdq === 'region') { c.cuisine = t.value === 'mix' ? '' : t.value; save(); }
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
// ---- سلامة الخطة (0.45): لا توليد لعميل حصص قبل تحديد الهدف ومستوى النشاط (كانا يُعبّآن تلقائياً بـ«ثبات» و«متوسط»)
function needGA(c) { return !!c && c.kind !== 'athlete' && (!c.goal || !c.activity); }
function gaStop(c) {
  if (!needGA(c)) return false;
  var miss = [!c.goal ? 'الهدف' : '', !c.activity ? 'مستوى النشاط' : ''].filter(Boolean).join(' و');
  toast('حدّد ' + miss + ' أولاً — الخطة تُحسب منهما'); S.view = 'client'; S.tab = 'client'; render();
  var f = document.querySelector('[data-f="' + (!c.goal ? 'goal' : 'activity') + '"]'); if (f) { f.focus(); f.scrollIntoView({ block: 'center' }); }
  return true;
}
['gen', 'genBank', 'dxApply', 'probApply'].forEach(function (k) { var f = A[k]; if (f) A[k] = function () { var c = k === 'gen' || k === 'genBank' ? cur() : (typeof dxClient === 'function' ? dxClient() : cur()); if (gaStop(c)) return; return f.apply(this, arguments); }; });
(function (tb) { targetsBox = function (c) { return (needGA(c) ? '<div class="warn needw">⚠ لم يُحدَّد ' + [!c.goal ? 'الهدف' : '', !c.activity ? 'مستوى النشاط' : ''].filter(Boolean).join(' و') + ' — الأرقام أدناه مبدئية ولن تُولَّد خطة قبل تحديدهما.</div>' : '') + tb(c); }; })(targetsBox);
// ---- إصدارات خطة البنك (0.45): «حفظ إصدار» يحفظ الخطة المعروضة (بنك أو محرك)، والاسترجاع يعيدها كما كانت
(function (ver0, vopen0, vt0) {
  A.ver = function () {
    var c = cur(); if (!c || c.planSrc !== 'ready' || !c.readyDoc) return ver0.apply(this, arguments);
    var note = prompt('ملاحظة الإصدار (اختياري):', '') || '';
    dbPut('versions', { code: c.code, at: Date.now(), note: note, src: 'ready', ready: JSON.parse(JSON.stringify(c.ready)), readyDoc: JSON.parse(JSON.stringify(c.readyDoc)), plan: c.plan || null, client: ec(c) }).then(loadVersions).then(function () { toast('تم حفظ إصدار من خطة البنك'); main(); });
  };
  A.vopen = function (v) {
    var x = S.versions.filter(function (q) { return q.id == v; })[0], c = cur(); if (!x || !c || x.src !== 'ready') return vopen0.apply(this, arguments);
    c.ready = x.ready; c.readyDoc = x.readyDoc; c.planSrc = 'ready'; RDS.bank[c.code] = false; save(); S.tab = 'plan'; render(); toast('تم استرجاع إصدار خطة البنك');
  };
  verTab = function (c) {
    var h = vt0(c); if (!S.versions.some(function (v) { return v.src === 'ready'; }) && c.planSrc !== 'ready') return h;
    S.versions.forEach(function (v) { h = h.replace('data-a="vopen" data-v="' + v.id + '"', 'data-a="vopen" data-v="' + v.id + '" title="' + (v.src === 'ready' ? 'خطة بنك' : 'خطة محرك') + '"').replace('<td>' + esc(v.note) + '</td><td><button class="sec sm" data-a="vopen" data-v="' + v.id + '"', '<td>' + (v.src === 'ready' ? '<span class="dxb">📗 ' + esc(v.ready.label) + '</span> ' : '<span class="dxb">⚙ المحرك</span> ') + esc(v.note) + '</td><td><button class="sec sm" data-a="vopen" data-v="' + v.id + '"'); });
    return (c.planSrc === 'ready' ? '<p class="small">الخطة المعروضة الآن من البنك: «حفظ إصدار» يحفظها بتعديلاتها.</p>' : '') + h;
  };
})(A.ver, A.vopen, verTab);
// ---- 0.46: «مكتبة الأخصائي» صارت تبويباً في «الخطط الجاهزة» (زر «lib» القديم يفتح التبويب)
A.lib = function () { var on = S.view === 'ready' && RDS.tab === 'lib'; S.view = on ? 'client' : 'ready'; RDS.tab = 'lib'; render(); window.scrollTo(0, 0); };
A.dxFor = function (v) { DXS.client = v; DXS.tab = 'diets'; RDS.tab = 'lib'; S.view = 'ready'; render(); window.scrollTo(0, 0); };
