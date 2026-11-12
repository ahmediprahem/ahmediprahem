/* شيفرة المدير فقط (لا تدخل نسخة المستخدمين): الإعداد والدخول ولوحة المستخدمين والأجهزة وإصدار الأكواد وتصدير نسخة المستخدمين. */
(function () {
  'use strict';
  var K = window.HK, H = window.HSec, MODE = window.APP_MODE, MAXDEV = 2, gate = K.gate, openGate = K.openGate, copy = K.copy, openKV = K.openKV, kvGet = K.kvGet, kvAll = K.kvAll, kvPut = K.kvPut, kvDel = K.kvDel, throttleLeft = K.throttleLeft, failed = K.failed, esc = K.esc, $ = K.$;
  // ======================================================= 0.95: الإدارة على الإنترنت (zenha-admin خلف Cloudflare Access)
  // حين تُفتح النسخة من خادم الإدارة (يرد /api/me): يُسترجع حساب المدير على جهاز جديد، وتُرفع بيانات الإدارة بعد كل تعديل.
  // ما يُرفع: (1) سجل المدير = المفتاح العام + المفتاح الخاص مغلَّفاً بكلمة السر (مشفّر أصلاً، لا يُفتح بدونها) + إعداد بوابة الدخول؛
  // (2) الأخصائيون والأجهزة مشفّرين AES-GCM بمفتاح مشتق من كلمة سر المدير. الخادم وCloudflare لا يريان كلمة السر ولا المفتاح ولا القائمة.
  var CLOUD = null, CK = null, CV = { auth: 0, users: 0 }, cT = 0, cBusy = null, CS = { st: '', msg: '', at: 0 }, CM = { list: null, audit: null };
  var kvPut0 = kvPut, kvDel0 = kvDel;
  kvPut = function (db) { var r = kvPut0.apply(null, arguments); if (HAD && db === HAD.db) r.then(cloudDirty, function () { }); return r; };
  kvDel = function (db) { var r = kvDel0.apply(null, arguments); if (HAD && db === HAD.db) r.then(cloudDirty, function () { }); return r; };
  async function cloudApi(method, p, body) {
    var r = await fetch(p, { method: method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin', cache: 'no-store' });
    var j = await r.json().catch(function () { return {}; }); if (!r.ok) { var e = new Error(j.error || ('خطأ من خادم الإدارة (' + r.status + ')')); e.status = r.status; throw e; } return j;
  }
  async function cloudDetect() { if (location.protocol === 'file:') return null; try { return (await cloudApi('GET', '/api/me')).me; } catch (e) { return null; } }
  function authBox(auth, gc) { return { _e: 1, iv: 'wrapped', ct: btoa(unescape(encodeURIComponent(JSON.stringify({ auth: auth, gatecfg: gc || null })))) }; }
  function authUnbox(v) { return JSON.parse(decodeURIComponent(escape(atob(v.ct)))); }
  function cloudState(st, msg) { CS = { st: st, msg: msg || '', at: Date.now() }; var b = document.getElementById('cloudSt'); if (b) b.outerHTML = cloudStHtml(); }
  function cloudStHtml() { return '<span id="cloudSt" class="' + (CS.st === 'err' ? 'warn' : 'ok') + ' vtline">' + (CS.st === 'err' ? '⚠ لم تُرفع آخر التعديلات: ' + esc(CS.msg) + ' — ستُعاد المحاولة تلقائياً' : CS.st === 'ok' ? '☁ بيانات الإدارة محفوظة في النظام' + (CS.at ? ' (' + new Date(CS.at).toLocaleTimeString('ar-EG') + ')' : '') : '☁ جارٍ المزامنة…') + '</span>'; }
  async function cloudRestoreAuth(db) {                       // جهاز جديد بلا حساب محلي: يُجلب سجل المدير من النظام ثم يُطلب كلمة السر كالمعتاد
    var ra = await cloudApi('GET', '/api/store/keys:auth'); if (!ra.v) return null;
    var x = authUnbox(ra.v), auth = Object.assign({}, x.auth, { key: 'auth' }); await kvPut0(db, 'kv', auth); if (x.gatecfg) { await kvPut0(db, 'kv', { key: 'gatecfg', cfg: x.gatecfg }); window.HGateCfg = x.gatecfg; }
    CV.auth = ra.ver; return auth;
  }
  function mergeUsers(theirs, mine) { var by = {}; (theirs || []).forEach(function (u) { by[u.username] = u; }); (mine || []).forEach(function (u) { by[u.username] = u; }); return Object.keys(by).sort().map(function (k) { return by[k]; }); }
  async function replaceLocalUsers(list) { var loc = await kvAll(HAD.db, 'users'); for (var i = 0; i < loc.length; i++) await kvDel0(HAD.db, 'users', loc[i].username); for (var j = 0; j < list.length; j++) await kvPut0(HAD.db, 'users', list[j]); HAD.users = list; }
  async function cloudAfterLogin(key) {
    CK = key; cloudState('');
    try {
      var lv = (await kvGet(HAD.db, 'kv', 'cloudver')) || {}, ru = await cloudApi('GET', '/api/store/users:admin');
      var chg = false; if (ru.v && ru.ver !== lv.users) { var theirs = await H.decJSON(CK, ru.v); await replaceLocalUsers(lv.dirty ? mergeUsers(theirs, HAD.users) : theirs); chg = true; }
      CV.users = ru.ver || 0; var ra = await cloudApi('GET', '/api/store/keys:auth'); CV.auth = ra.ver || 0;
      if (chg && window.HApp && window.HApp.refresh && window.HApp.state.view === 'users') window.HApp.refresh();
    } catch (e) { cloudState('err', e.message); }
    return cloudPush();
  }
  function cloudDirty() { if (!CLOUD || !CK) return; clearTimeout(cT); kvPut0(HAD.db, 'kv', { key: 'cloudver', users: CV.users, auth: CV.auth, dirty: 1 }); cT = setTimeout(cloudPush, 1200); }
  function cloudPush() {
    if (!CLOUD || !CK) return Promise.resolve(); if (cBusy) { clearTimeout(cT); cT = setTimeout(cloudPush, 1500); return cBusy; }
    cBusy = (async function () {
      try {
        var gc = await kvGet(HAD.db, 'kv', 'gatecfg'), ab = authBox(HAD.auth, gc && gc.cfg), cur = await cloudApi('GET', '/api/store/keys:auth');
        if (!cur.v || cur.v.ct !== ab.ct) CV.auth = (await cloudApi('PUT', '/api/store/keys:auth', { v: ab, ver: cur.ver || 0 })).ver; else CV.auth = cur.ver;
        var put = async function (list, ver) { var b = await H.encJSON(CK, list); b._e = 1; return (await cloudApi('PUT', '/api/store/users:admin', { v: b, ver: ver })).ver; };
        try { CV.users = await put(HAD.users, CV.users); }
        catch (e) { if (e.status !== 409) throw e; var s2 = await cloudApi('GET', '/api/store/users:admin'), merged = mergeUsers(s2.v ? await H.decJSON(CK, s2.v) : [], HAD.users); await replaceLocalUsers(merged); CV.users = await put(merged, s2.ver); }
        await kvPut0(HAD.db, 'kv', { key: 'cloudver', users: CV.users, auth: CV.auth, dirty: 0 }); cloudState('ok');
      } catch (e) { cloudState('err', e.message); clearTimeout(cT); cT = setTimeout(cloudPush, 30000); }
      finally { cBusy = null; }
    })();
    return cBusy;
  }
  // ---- 0.96: الأخصائيون بالبريد — يضيف المدير البريد والاسم والمدة، ويوقّع متصفحه رخصة لهذا البريد بمفتاح المدير (لا أكواد ولا رموز أجهزة)
  var SP = { list: null, err: '', loading: 0 }, SP_DAYS = [[30, 'شهر'], [90, '3 أشهر'], [180, '6 أشهر'], [365, 'سنة'], [0, 'بلا انتهاء']];
  async function spLicense(email, name, exp) { var t = Math.floor(Date.now() / 1000); return H.sign(HAD.priv, { v: 1, t: 'em', u: 'em:' + email, em: email, n: name, iat: t, exp: exp || 0 }); }
  async function spLoad() { try { SP.list = (await cloudApi('GET', '/api/specialists')).specialists; SP.err = ''; } catch (e) { SP.err = e.message; } var el = document.getElementById('spBox'); if (el) el.outerHTML = spBoxHtml(); }
  function spState(x) { var t = Date.now() / 1000; return x.status === 'off' ? ['موقوف', 'warn'] : x.exp && x.exp < t ? ['منتهٍ', 'warn'] : ['فعّال', 'ok']; }
  function spBoxHtml() {
    var fmt = function (ts) { return ts ? new Date(ts * 1000).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; };
    return '<div class="addbox cloudbox" id="spBox"><h3>🩺 الأخصائيون — الدخول بالبريد</h3><p class="small">أضف بريد الأخصائي واسمه ومدة اشتراكه فقط. يدخل «زنها Pro» برمز يصله على بريده، بلا اسم مستخدم ولا كود تفعيل ولا رمز جهاز. الرخصة تُوقَّع هنا في متصفحك بمفتاح المدير.</p>'
      + '<div class="row"><div><label for="sp_email">بريد الأخصائي</label><input id="sp_email" type="email" dir="ltr" placeholder="doctor@gmail.com"></div><div><label for="sp_name">الاسم</label><input id="sp_name" placeholder="د. سارة"></div><div><label for="sp_days">المدة</label><select id="sp_days">' + SP_DAYS.map(function (d) { return '<option value="' + d[0] + '"' + (d[0] === 365 ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></div></div><p><button data-ha="spAdd">+ إضافة الأخصائي</button></p>'
      + (SP.err ? '<div class="gerr">' + esc(SP.err) + '</div>' : '')
      + (!SP.list ? '<p class="small">جارٍ التحميل…</p>' : SP.list.length ? '<table class="dt spt"><tr><th>الأخصائي</th><th>البريد</th><th>الحالة</th><th>ينتهي</th><th>آخر دخول</th><th></th></tr>' + SP.list.map(function (x) { var st = spState(x);
        return '<tr><td>' + esc(x.name) + '</td><td dir="ltr">' + esc(x.email) + '</td><td><span class="' + st[1] + '">' + st[0] + '</span></td><td>' + (x.exp ? fmt(x.exp) : 'بلا انتهاء') + '</td><td>' + fmt(x.last_seen) + '</td><td><button class="sec sm" data-ha="spExt" data-e="' + esc(x.email) + '">تمديد شهر</button> <button class="sec sm" data-ha="spToggle" data-e="' + esc(x.email) + '">' + (x.status === 'off' ? 'تفعيل' : 'إيقاف') + '</button> <button class="sec sm r" data-ha="spDel" data-e="' + esc(x.email) + '">حذف</button></td></tr>'; }).join('') + '</table>' : '<p class="small">لم تُضف أخصائيين بالبريد بعد.</p>') + '</div>';
  }
  function spCard() { if (!CLOUD) return ''; if (!SP.list && !SP.loading) { SP.loading = 1; spLoad().then(function () { SP.loading = 0; }); } return spBoxHtml(); }
  async function spSave(x, resign) {
    var body = { email: x.email, name: x.name, exp: x.exp || 0, status: x.status || 'active', note: x.note || '' }; if (resign) body.lic = await spLicense(x.email, x.name, x.exp);
    await cloudApi('POST', '/api/specialists', body);
  }
  // ---- أعضاء نظام الإدارة (المالك فقط): من يدخل عبر Access ويصل لأي قسم
  var PERM_L = { users: 'الأخصائيون والأجهزة', lic: 'إصدار الرخص والأكواد', settings: 'الإعدادات الرئيسية', publish: 'النشر', clients: 'العملاء والخطط', audit: 'سجل التدقيق' }, ROLE_L = { owner: 'مالك', admin: 'مدير كامل', member: 'صلاحيات محددة' };
  async function cmLoad() { try { CM.list = (await cloudApi('GET', '/api/members')).members; CM.audit = (await cloudApi('GET', '/api/audit')).rows.slice(0, 15); CM.err = ''; } catch (e) { CM.err = e.message; } var el = document.getElementById('cmBox'); if (el) el.outerHTML = cmBoxHtml(); }   // يحدّث صندوقه فقط، فلا يضيع ما يُكتب في الصفحة
  function cloudCard() {
    if (!CLOUD) return '';
    var h = '<div class="addbox cloudbox"><h3>☁ النظام على الإنترنت</h3><p class="small">أنت داخل بـ <b dir="ltr">' + esc(CLOUD.email) + '</b> (' + esc(ROLE_L[CLOUD.role] || CLOUD.role) + '). بيانات الإدارة تُحفظ مشفّرة تلقائياً بعد كل تعديل، وتفتحها من أي جهاز بعد الدخول وكتابة كلمة سر المدير.</p>' + cloudStHtml() + '</div>';
    if (CLOUD.role !== 'owner') return h;
    if (!CM.list && !CM.loading) { CM.loading = 1; cmLoad().then(function () { CM.loading = 0; }); }
    return h + cmBoxHtml();
  }
  function cmBoxHtml() {
    var h = '<div class="addbox cloudbox" id="cmBox"><h3>👤 أعضاء نظام الإدارة</h3><p class="small">من تضيفه هنا يدخل بعنوان النظام بالرمز الذي يصله على بريده. «مدير كامل» يحتاج أيضاً كلمة سر المدير ليفتح البيانات المشفّرة. الصلاحيات المحددة تُفرض على الخادم الآن، وتعمل كاملة بعد المرحلة التالية (مفاتيح لكل قسم).</p>'
      + (CM.err ? '<div class="gerr">' + esc(CM.err) + '</div>' : '')
      + (CM.list ? '<table class="dt cmt"><tr><th>البريد</th><th>الدور</th><th>الصلاحيات</th><th>آخر دخول</th><th></th></tr>' + CM.list.map(function (m) {
        return '<tr><td dir="ltr">' + esc(m.email) + '</td><td>' + esc(ROLE_L[m.role] || m.role) + (m.disabled ? ' <span class="small">(معطّل)</span>' : '') + '</td><td class="small">' + (m.role === 'member' ? esc(m.perms.map(function (x) { return PERM_L[x] || x; }).join('، ') || '—') : 'الكل') + '</td><td class="small">' + (m.last_seen ? new Date(m.last_seen * 1000).toLocaleString('ar-EG') : '—') + '</td><td>'
          + (m.role === 'owner' ? '' : '<button class="sec sm" data-ha="cmToggle" data-e="' + esc(m.email) + '">' + (m.disabled ? 'تفعيل' : 'تعطيل') + '</button> <button class="sec sm r" data-ha="cmDel" data-e="' + esc(m.email) + '">حذف</button>') + '</td></tr>';
      }).join('') + '</table>' : '<p class="small">جارٍ التحميل…</p>')
      + '<div class="row"><div><label for="cm_email">بريد العضو</label><input id="cm_email" dir="ltr" type="email" placeholder="name@gmail.com"></div><div><label for="cm_role">الدور</label><select id="cm_role"><option value="admin">مدير كامل</option><option value="member">صلاحيات محددة</option></select></div></div>'
      + '<p class="small">الصلاحيات (للدور «صلاحيات محددة»):</p><p>' + Object.keys(PERM_L).map(function (k) { return '<label class="chk"><input type="checkbox" data-cmp="' + k + '"> ' + PERM_L[k] + '</label>'; }).join(' ') + '</p>'
      + '<p><button data-ha="cmAdd">+ إضافة العضو</button></p>'
      + (CM.audit && CM.audit.length ? '<h3>آخر العمليات</h3><ul class="small cma">' + CM.audit.map(function (r) { return '<li>' + new Date(r.ts * 1000).toLocaleString('ar-EG') + ' — <span dir="ltr">' + esc(r.email) + '</span>: ' + esc(r.action) + ' ' + esc(r.detail || '') + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    return h;
  }
  // ======================================================= بوابة المدير + لوحة الإدارة
  var HAD = null;
  var seededNote = '';
  async function adminGate() {
    if (!(window.crypto && window.crypto.subtle)) { K.showFatal('هذا المتصفح أو هذا السياق لا يوفّر التشفير (WebCrypto).'); return; }
    var db = await openKV('hissa_admin_auth', true), auth = await kvGet(db, 'kv', 'auth'), gc = await kvGet(db, 'kv', 'gatecfg'); if (gc && gc.cfg) window.HGateCfg = gc.cfg;
    CLOUD = await cloudDetect(); if (CLOUD && !auth) { try { auth = await cloudRestoreAuth(db); if (auth) seededNote = 'استُرجع حساب المدير من النظام على الإنترنت. أدخل كلمة السر.'; } catch (e) { } }
    if (!auth && window.ADMIN_SEED) { auth = Object.assign({}, window.ADMIN_SEED, { key: 'auth', seeded: true }); await kvPut(db, 'kv', auth); seededNote = 'هذا حساب المدير الأولي (اسم المستخدم: ' + auth.user + '). كلمة السر الابتدائية في ملف «بيانات الدخول الأولية» المرافق. غيّرها فور الدخول من «👥 المستخدمون والأجهزة».'; }
    var REM = K.makeRem(db), st = auth && await REM.staying();
    if (st) { var pw0 = await REM.pw(st); if (pw0 && st.u.toLowerCase() === auth.user.toLowerCase() && await doLogin(db, auth, pw0, true)) { await REM.save(auth.user, pw0, { stay: true, fill: st.fill }); return; } await REM.clear(st.u); if (auth) return login(db, auth, 'انتهت جلسة «البقاء مسجلاً». أدخل كلمة السر.'); }
    if (!auth) setup(db); else login(db, auth, seededNote);
  }
  async function doLogin(db, auth, pw, stay) {                    // يفتح مفتاح التوقيع بكلمة السر ويشغّل التطبيق؛ يعيد false إن كانت الكلمة خاطئة
    var priv; try { priv = await H.unwrapPriv(auth.wrap, pw); } catch (e) { return false; }
    K.resetFails(); var users = await kvAll(db, 'users'), key = await H.dataKey(pw, auth.saltD, auth.wrap.iter), REM = K.makeRem(db); HAD = { db: db, auth: auth, priv: priv, users: users, last: null, REM: REM }; try { window.HAD_PUB = HAD.auth.pub; } catch (e) { } window.HAD = HAD; if (CLOUD) setTimeout(function () { cloudAfterLogin(key); }, 0);
    window.HGate = { save: function (cfg) { window.HGateCfg = cfg; return kvPut(db, 'kv', { key: 'gatecfg', cfg: cfg }); } }; openGate();
    window.HApp.start({ mode: 'admin', dbName: 'hissa_admin_data', key: key, base: null, userLabel: 'المدير: ' + auth.user, lockMin: 30, stay: !!stay, signOut: function () { return REM.signOut(auth.user); },
      aiToken: async function () { var now = Math.floor(Date.now() / 1000); return H.sign(HAD.priv, { v: 1, u: 'admin:' + auth.user, n: auth.user, role: 'admin', iat: now, exp: now + 300 }); } });
    if (auth.seeded) { window.HApp.state.view = 'users'; window.HApp.refresh(); }
    return true;
  }
  function setup(db, msg) {
    gate('<h2>إعداد المدير (أول مرة)</h2>' + (msg ? '<div class="gerr">' + esc(msg) + '</div>' : '') + '<p class="small">أنشئ اسم مستخدم وكلمة سر للمدير. تُنشأ هنا مفاتيح التوقيع، وتُحفظ مشفّرة بكلمة سرك — <b>احتفظ بنسخة احتياطية للإدارة بعد الدخول</b>، فضياع الكلمة أو المفتاح يعني إعادة إصدار كل الأكواد.</p><label>اسم مستخدم المدير</label><input id="su"><label>كلمة السر (8 أحرف على الأقل)</label><input id="sp" type="password"><label>تأكيد كلمة السر</label><input id="sp2" type="password"><p><button id="sBtn">إنشاء حساب المدير</button></p><hr><label>أو استرجاع نسخة احتياطية للإدارة</label><input type="file" id="restoreF" accept=".json">');
    $('#sBtn').onclick = async function () {
      var u = $('#su').value.trim(), p = $('#sp').value;
      if (u.length < 3) return setup(db, 'اسم المستخدم 3 أحرف على الأقل'); if (p.length < 8) return setup(db, 'كلمة السر 8 أحرف على الأقل'); if (p !== $('#sp2').value) return setup(db, 'كلمتا السر غير متطابقتين');
      var k = await H.genKeys(), wrap = await H.wrapPriv(k.priv, p); await kvPut(db, 'kv', { key: 'auth', user: u, wrap: wrap, pub: k.pub, saltD: H.b64(H.rand(16)) }); login(db, await kvGet(db, 'kv', 'auth'), 'تم إنشاء حساب المدير. سجّل الدخول.');
    };
    $('#restoreF').onchange = function (e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = async function () { try { var j = JSON.parse(r.result); if (j.app !== 'hissa-admin' || !j.auth || !j.auth.wrap) throw 0; await kvPut(db, 'kv', Object.assign({}, j.auth, { key: 'auth' })); for (var i = 0; i < (j.users || []).length; i++) await kvPut(db, 'users', j.users[i]); login(db, await kvGet(db, 'kv', 'auth'), 'تم استرجاع النسخة. سجّل الدخول.'); } catch (x) { setup(db, 'ملف النسخة الاحتياطية غير صالح'); } }; r.readAsText(f); };
  }
  async function login(db, auth, note) {
    var REM = K.makeRem(db), pr = await REM.prefs(), sr = await REM.get(auth.user);
    gate('<h2>دخول المدير</h2>' + (note ? '<div class="gok">' + esc(note) + '</div>' : '') + '<label>اسم المستخدم</label><input id="au" autocomplete="username" value="' + esc((sr && (sr.fill || sr.stay)) || (auth.seeded && !auth.pwChanged) ? auth.user : '') + '"><label>كلمة السر</label><input id="ap" type="password" autocomplete="current-password"><label class="chk"><input type="checkbox" id="showpw"> إظهار كلمة السر (للتأكد مما كتبته ولغة لوحة المفاتيح)</label><div id="aerr"></div>' + K.remBox(pr, !!(sr && sr.fill)) + '<p><button id="aBtn">دخول</button></p>');
    var forgot = false, fillSaved = async function () { var r = await REM.get($('#au').value.trim()); if (r && r.fill && !$('#ap').value && !forgot) { var pw = await REM.pw(r); if (pw && !forgot) $('#ap').value = pw; } }; fillSaved(); $('#au').addEventListener('change', fillSaved);
    var fg = $('#rmForget'); if (fg) fg.onclick = async function (e) { e.preventDefault(); forgot = true; await REM.clear(auth.user); await REM.setPrefs(false, false); $('#ap').value = ''; $('#rmFill').checked = false; $('#rmStay').checked = false; fg.remove(); };
    $('#showpw').onchange = function () { $('#ap').type = this.checked ? 'text' : 'password'; };
    var seedHint = window.ADMIN_SEED ? '<div class="small" id="seedhint">نسخة المدير الأولية: إن كنتَ فتحتَ على هذا المتصفح نسخة مدير أخرى من قبل، أو غيّرتَ كلمة السر، فالتي تنطبق هي كلمة تلك النسخة لا الابتدائية (يُحفظ حساب المدير في المتصفح ولا تستبدله نسخة أخرى). للتأكد من الكلمة الابتدائية افتح الملف في نافذة خاصة (InPrivate: Ctrl+Shift+N) وتأكد أن لغة الكتابة English أو استعمل «إظهار كلمة السر».</div>' : '';
    function fail(m) { failed(); $('#aerr').innerHTML = '<div class="gerr">' + esc(m) + '</div>' + seedHint; }
    var go = async function () {
      var left = throttleLeft(); if (left > 0) { $('#aerr').innerHTML = '<div class="gerr">انتظر ' + left + ' ثانية</div>'; return; }
      var u = $('#au').value.trim(), pw = $('#ap').value; if (u.toLowerCase() !== auth.user.toLowerCase()) { fail('اسم المستخدم أو كلمة السر غير صحيحة'); return; }
      var stay = $('#rmStay').checked, fl = $('#rmFill').checked; if (!(await doLogin(db, auth, pw, stay))) { fail('اسم المستخدم أو كلمة السر غير صحيحة'); return; }
      if (stay || fl) await REM.save(auth.user, pw, { stay: stay, fill: fl }); else { await REM.clear(auth.user); await REM.setPrefs(false, false); }
    };
    $('#aBtn').onclick = go; $('#ap').onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }

  var fmt = function (ts) { return ts ? new Date(ts * 1000).toLocaleDateString('ar-SA') : 'بلا انتهاء'; };
  function card(u) {
    var devs = u.devices || [], q = 'ui_' + u.username;
    return '<div class="ucard"><h3>' + esc(u.name) + ' <small>(' + esc(u.username) + ')</small> <span class="badge ' + (u.status === 'active' ? '' : 'off') + '">' + (u.status === 'active' ? 'فعّال' : 'معطّل') + '</span> <small>الأجهزة: ' + devs.length + '/' + MAXDEV + '</small></h3>'
      + (devs.length ? '<table style="width:100%;font-size:13px">' + devs.map(function (d) { return '<tr><td><code dir="ltr">' + esc(d.id) + '</code></td><td>' + esc(d.label || '') + '</td><td>أُصدر: ' + fmt(d.issued) + '</td><td>ينتهي: ' + fmt(d.exp) + '</td><td><button class="sec sm" data-ha="udev" data-u="' + esc(u.username) + '" data-d="' + esc(d.id) + '">تحرير الجهاز</button></td></tr>'; }).join('') + '</table>' : '<p class="small">لا أجهزة مفعّلة.</p>')
      + '<div class="row"><div><label>رمز الجهاز (من المستخدم)</label><input id="' + q + '_dev" dir="ltr" placeholder="مثال: Xk3p9...."></div><div><label>اسم الجهاز (اختياري)</label><input id="' + q + '_lab" placeholder="جوال / لابتوب"></div><div><label>مدة التفعيل</label><select id="' + q + '_days"><option value="30">30 يوماً</option><option value="90">90 يوماً</option><option value="180">180 يوماً</option><option value="365">سنة</option><option value="0">بلا انتهاء</option></select></div></div>'
      + '<p><button data-ha="uissue" data-u="' + esc(u.username) + '">إصدار كود تفعيل</button> <button class="sec sm" data-ha="utoggle" data-u="' + esc(u.username) + '">' + (u.status === 'active' ? 'تعطيل المستخدم' : 'تفعيل المستخدم') + '</button> <button class="sec sm" data-ha="upw" data-u="' + esc(u.username) + '">إعادة ضبط كلمة السر</button> <button class="r sm" data-ha="udel" data-u="' + esc(u.username) + '">حذف</button></p>'
      + (HAD.last && HAD.last.u === u.username ? '<div id="tokbox"><label>كود التفعيل (أرسله للمستخدم)</label><textarea class="tok" id="lastTok" rows="4" readonly>' + esc(HAD.last.token) + '</textarea><p><button class="sec sm" data-ha="ucopy">نسخ الكود</button></p></div>' : '') + '</div>';
  }
  window.HAdminUI = {
    html: function () {
      var us = HAD.users.slice().sort(function (a, b) { return a.username < b.username ? -1 : 1; });
      return (HAD.auth.seeded ? '<div class="gerr">⚠ تستعمل كلمة سر ابتدائية. غيّرها الآن من قسم «تغيير كلمة سر المدير» أسفل الصفحة.</div>' : '') + spCard() + cloudCard() + '<h2>👥 المستخدمون والأجهزة</h2><p class="small">لكل مستخدم حد أقصى ' + MAXDEV + ' جهازين. الخطوات: أنشئ المستخدم ← أرسل له (اسم المستخدم + كلمة السر + ملف المستخدمين من «تصدير نسخة المستخدمين») ← يعطيك «رمز الجهاز» من شاشة التفعيل ← تصدر له الكود. تنبيه: تعطيل المستخدم أو تحرير جهاز يمنع التجديد فقط؛ الكود الحالي يبقى صالحاً حتى تاريخ انتهائه.</p>'
        + '<div class="addbox"><h3>إضافة مستخدم</h3><div class="row"><div><label>اسم المستخدم (حروف إنجليزية صغيرة وأرقام)</label><input id="ua_user" dir="ltr" placeholder="sara"></div><div><label>الاسم الظاهر</label><input id="ua_name" placeholder="سارة"></div><div><label>كلمة السر (8 أحرف على الأقل)</label><input id="ua_pw" dir="ltr"></div></div><p><button class="sec sm" data-ha="ugen">توليد كلمة سر</button> <button data-ha="uadd">+ إضافة المستخدم</button></p></div>'
        + (us.length ? us.map(card).join('') : '<p class="small">لا مستخدمين بعد.</p>')
        + '<h3>تغيير كلمة سر المدير</h3><div class="addbox"><div class="row"><div><label>كلمة السر الحالية</label><input id="cp_old" type="password" autocomplete="current-password"></div><div><label>كلمة السر الجديدة (8 أحرف على الأقل)</label><input id="cp_new" type="password" autocomplete="new-password"></div><div><label>تأكيد الجديدة</label><input id="cp_new2" type="password" autocomplete="new-password"></div></div><p><button data-ha="chpw">تغيير كلمة السر</button> <small class="small">تُعاد تشفير بيانات عملائك بالكلمة الجديدة، وتُلغى كلمة السر المحفوظة. خذ نسخة احتياطية قبل ذلك.</small></p></div><h3>نسخة احتياطية للإدارة</h3><p class="small">تحوي مفتاح التوقيع (مشفّراً بكلمة سرك) وقائمة المستخدمين. احفظها خارج المتصفح. بدونها لا يمكن إصدار أكواد لنفس المستخدمين إذا فُقدت بيانات المتصفح.</p><p><button class="sec" data-ha="backup">تنزيل نسخة احتياطية للإدارة</button></p>';
    },
    exportUsers: function () {
      var html = usersHtml(); if (!html) return;
      window.HApp.download(new Blob([html], { type: 'text/html' }), 'hissa_users.html'); window.HApp.toast('صُدّرت نسخة المستخدمين (تحمل إعدادات النظام والشعار الحاليين)');
    },
    exportSite: function () {                           // ZIP جاهز للرفع على Cloudflare (Drop أو Workers): تطبيق المستخدمين + ترويسات الأمان + منع الفهرسة + شرح النشر
      var html = usersHtml(); if (!html) return;
      if (!confirm('تصدير موقع للنشر على الإنترنت.\n\n• كل من يعرف العنوان يستطيع تنزيل التطبيق (وفيه قاعدة الأصناف والوجبات)، لكنه لا يعمل بلا كود تفعيل منك. للحجب الكامل استعمل Cloudflare Access.\n• بيانات المستخدم مرتبطة بعنوان الموقع: من ينتقل من ملف على جهازه إلى العنوان الجديد يبدأ بجهاز جديد ويحتاج كوداً جديداً (ويُحتسب ضمن حد الجهازين)، وعليه أخذ نسخة احتياطية قبل الانتقال.\n• اختر العنوان النهائي قبل التوزيع: تغييره لاحقاً يعيد الأمر نفسه.\n\nمتابعة؟')) return;
      var enc = new TextEncoder(), files = [{ name: 'index.html', data: enc.encode(html) }, { name: '_headers', data: enc.encode(SITE_HEADERS) }, { name: 'robots.txt', data: enc.encode('User-agent: *\nDisallow: /\n') }, { name: 'README_DEPLOY_AR.txt', data: enc.encode(SITE_README) }, { name: '.assetsignore', data: enc.encode('.wrangler\nREADME_DEPLOY_AR.txt\n.assetsignore\n') }, { name: 'sw.js', data: enc.encode(HISSA_SW) }];
      files = files.concat(proIconFiles());
      try { var ic = atob(String(window.ASSETS.icon).split(',')[1]), u8i = new Uint8Array(ic.length); for (var q = 0; q < ic.length; q++) u8i[q] = ic.charCodeAt(q); files.push({ name: 'icon.png', data: u8i }); } catch (e) { }
      window.DPDocx.zipAsync(files).then(function (u8) { window.HApp.download(new Blob([u8], { type: 'application/zip' }), 'hissa_site.zip'); window.HApp.toast('صُدّر hissa_site.zip — اقرأ README_DEPLOY_AR.txt بداخله'); }).catch(function (e) { window.HApp.toast('تعذّر إنشاء الملف: ' + (e && e.message || e)); });
    }
  };
  var usersHtml = function () {                          // ملف المستخدمين: القالب + مفتاحك العام + إعدادات النظام الحالية
    var tpl = window.USER_TPL; if (!tpl) { window.HApp.toast('القالب غير متاح في هذه النسخة'); return null; } var base = window.HApp.getSettings();
    return tpl.replace('window.ADMIN_PUB=null;', function () { return 'window.ADMIN_PUB=' + JSON.stringify(HAD.auth.pub) + ';'; }).replace('window.BASE_SETTINGS=null;', function () { return 'window.BASE_SETTINGS=' + JSON.stringify(base).replace(/</g, '\\u003c') + ';'; });
  };
  var HISSA_SW = /*HISSA_SW*/'';
  var PRO_ICONS = /*PRO_ICONS*/{};                     // أيقونات «زن برو» (192/512/maskable/apple) تُضمَّن عند البناء من assets/zenhapro
  var PRO_MANIFEST = JSON.stringify({ id: '/', name: 'زن برو', short_name: 'زن برو', description: 'نظام أخصائي التغذية من زنها', lang: 'ar', dir: 'rtl', start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait', background_color: '#0E1440', theme_color: '#0E1440', icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] });
  var proIconFiles = function () { return Object.keys(PRO_ICONS).map(function (k) { var b = atob(PRO_ICONS[k]), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return { name: k + '.png', data: u }; }).concat([{ name: 'manifest.webmanifest', data: new TextEncoder().encode(PRO_MANIFEST) }]); };                       // عامل خدمة الموقع (إشعارات «زنها» للأخصائي) — يُضمَّن عند البناء من src/hissa_sw.js
  var SITE_HEADERS = ['/*', '  X-Content-Type-Options: nosniff', '  Referrer-Policy: no-referrer', '  X-Frame-Options: DENY', '  X-Robots-Tag: noindex, nofollow', '  Cache-Control: no-cache', '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()', "  Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob: 'self'; media-src data: blob:; font-src data:; connect-src https:; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'", ''].join('\n');
  var SITE_README = ['نشر تطبيق المستخدمين (حصة) على Cloudflare', '==========================================', 'المحتوى: index.html (تطبيق المستخدمين) • _headers (ترويسات الأمان) • robots.txt (منع الفهرسة)', '', 'قبل النشر — تنبيهات مهمة', '1) كل من يعرف العنوان يستطيع تنزيل التطبيق (قاعدة الأصناف والوجبات داخله) لكنه لا يعمل بلا كود تفعيل موقَّع منك. لحجب العنوان نفسه فعّل Cloudflare Access على النطاق.', '2) لا تنشر admin.html ولا admin_initial.html أبداً (واجهة الإدارة ومفتاحك).', '3) بيانات كل مستخدم محفوظة في متصفحه ومرتبطة بعنوان الموقع. من ينتقل من ملف على جهازه إلى هذا العنوان يبدأ بمساحة جديدة وجهاز جديد: يحتاج كوداً جديداً منك (ويُحتسب ضمن حد الجهازين)، وعليه أخذ «نسخة احتياطية» قبل الانتقال و«استرجاع» بعده.', '4) اختر العنوان النهائي قبل التوزيع: تغيير النطاق لاحقاً يكرر ما في البند 3.', '', 'النشر (أسرع طريقة)', '1) افتح https://cloudflare.com/drop واسحب ملف hissa_site.zip.', '2) تحصل على معاينة تعمل ساعة واحدة. اضغط Claim وسجّل الدخول بحسابك لتثبيت الموقع.', '(بديل: Workers & Pages في لوحة Cloudflare، أو wrangler. المرجع: developers.cloudflare.com/workers/static-assets)', '', 'ربط نطاقك', 'الشرط: نطاقك مضاف وفعّال (Active) في Cloudflare. ثم: Workers & Pages ← اختر موقعك ← Settings ← Domains & Routes ← Add ← Custom Domain ← اكتب مثلاً app.نطاقك.com ← Add Custom Domain.', 'لا يصح على اسم عليه سجل CNAME قائم؛ احذف ذلك السجل أولاً. تنشئ Cloudflare سجل DNS والشهادة تلقائياً.', '', 'بعد النشر', '1) افتح العنوان: ستظهر شاشة التفعيل مع «رمز الجهاز».', '2) من لوحة المدير: أصدر الكود لذلك الرمز (تبويب المستخدمون والأجهزة).', '3) إن فعّلت الاتصال بالذكاء الاصطناعي فلا تغيير مطلوب: الوسيط يقبل أي عنوان ما دام الكود صالحاً.', '', 'للتحديث: أعد التصدير وارفع الملف الجديد بدل القديم؛ لا تتغير بيانات المستخدمين ما دام العنوان نفسه.', ''].join('\n');
  var toast = function (m) { window.HApp.toast(m); }, refresh = function () { window.HApp.refresh(); }, find = function (u) { return HAD.users.filter(function (x) { return x.username === u; })[0]; }, save = function (u) { return kvPut(HAD.db, 'users', u); };
  var ACT = {
    ugen: function () { var a = H.b64u(H.rand(9)); $('#ua_pw').value = a; },
    uadd: async function () {
      var un = $('#ua_user').value.trim().toLowerCase(), nm = $('#ua_name').value.trim() || un, pw = $('#ua_pw').value;
      if (!/^[a-z0-9._-]{3,24}$/.test(un)) return toast('اسم المستخدم: 3–24 حرفاً إنجليزياً صغيراً أو أرقاماً أو . _ -'); if (pw.length < 8) return toast('كلمة السر 8 أحرف على الأقل'); if (find(un)) return toast('اسم المستخدم موجود');
      var v = await H.makeVerifier(pw), u = Object.assign({ username: un, name: nm, status: 'active', devices: [], created: Math.floor(Date.now() / 1000) }, v); await save(u); HAD.users.push(u); HAD.last = null; refresh(); toast('أُضيف المستخدم «' + nm + '». سلّمه كلمة السر الآن: ' + pw);
    },
    uissue: async function (el) {
      var u = find(el.dataset.u), q = 'ui_' + u.username, dev = $('#' + q + '_dev').value.trim(), days = +$('#' + q + '_days').value;
      HAD.last = null; var tb0 = $('#tokbox'); if (tb0) tb0.remove();                                   // لا يبقى كود سابق معروضاً بعد رفض أو إعادة إصدار
      if (u.status !== 'active') return toast('المستخدم معطّل'); if (dev.length < 8 || /\s/.test(dev)) return toast('رمز الجهاز غير صالح');
      var ex = (u.devices || []).filter(function (d) { return d.id === dev; })[0]; if (!ex && (u.devices || []).length >= MAXDEV) return toast('بلغ المستخدم الحد الأقصى (' + MAXDEV + ' أجهزة). حرّر جهازاً أولاً.');
      var tk = await H.issue(HAD.priv, u, dev, days), now = Math.floor(Date.now() / 1000), ent = { id: dev, label: $('#' + q + '_lab').value.trim() || (ex && ex.label) || '', issued: now, exp: days ? now + days * 86400 : 0 };
      u.devices = (u.devices || []).filter(function (d) { return d.id !== dev; }).concat([ent]); await save(u); HAD.last = { u: u.username, token: tk }; refresh(); toast('صدر الكود — انسخه وأرسله للمستخدم');
    },
    ucopy: function () { copy(HAD.last.token, function () { toast('تم نسخ الكود'); }); },
    udev: async function (el) { var u = find(el.dataset.u); u.devices = u.devices.filter(function (d) { return d.id !== el.dataset.d; }); await save(u); refresh(); toast('حُرِّر الجهاز (الكود القديم يبقى صالحاً حتى انتهائه)'); },
    utoggle: async function (el) { var u = find(el.dataset.u); u.status = u.status === 'active' ? 'off' : 'active'; await save(u); refresh(); },
    upw: async function (el) {
      var u = find(el.dataset.u), pw = prompt('كلمة السر الجديدة للمستخدم «' + u.name + '» (8 أحرف على الأقل).\nتنبيه: بياناته المخزنة على أجهزته تصير غير قابلة للقراءة إلا بنسخة احتياطية، وعليه إعادة التفعيل بأكواد جديدة.'); if (pw === null) return; if (pw.length < 8) return toast('كلمة السر 8 أحرف على الأقل');
      var v = await H.makeVerifier(pw); Object.assign(u, v, { devices: [] }); await save(u); HAD.last = null; refresh(); toast('تم ضبط كلمة سر جديدة. أصدر أكواد جديدة للأجهزة.');
    },
    udel: async function (el) { var u = find(el.dataset.u); if (!confirm('حذف المستخدم «' + u.name + '» من القائمة؟ (أكواده الحالية تبقى صالحة حتى انتهائها)')) return; await kvDel(HAD.db, 'users', u.username); HAD.users = HAD.users.filter(function (x) { return x.username !== u.username; }); refresh(); },
    chpw: async function () {
      var o = $('#cp_old').value, n1 = $('#cp_new').value, n2 = $('#cp_new2').value; if (n1.length < 8) return toast('كلمة السر الجديدة 8 أحرف على الأقل'); if (n1 !== n2) return toast('كلمتا السر الجديدتان غير متطابقتين'); if (n1 === o) return toast('الجديدة مثل الحالية');
      var priv; try { priv = await H.unwrapPriv(HAD.auth.wrap, o); } catch (e) { return toast('كلمة السر الحالية غير صحيحة'); }
      if (!confirm('سيُعاد تشفير بيانات عملائك بكلمة السر الجديدة. هل أخذتَ نسخة احتياطية؟ متابعة؟')) return;
      try { var wrap = await H.wrapPriv(priv, n1), key = await H.dataKey(n1, HAD.auth.saltD, wrap.iter); await window.HApp.reencrypt(key); CK = CLOUD ? key : CK; var auth = Object.assign({}, HAD.auth, { wrap: wrap, seeded: false, pwChanged: true }); await kvPut(HAD.db, 'kv', auth); HAD.auth = auth; await HAD.REM.clear(auth.user); await HAD.REM.setPrefs(false, false); toast('تم تغيير كلمة السر. استعمل الجديدة في الدخول القادم.'); refresh(); } catch (e) { toast('تعذّر التغيير: ' + (e && e.message || e)); }
    },
    spAdd: async function () {
      var em = ($('#sp_email').value || '').trim().toLowerCase(), nm = ($('#sp_name').value || '').trim(), days = +$('#sp_days').value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('اكتب بريداً صحيحاً'); if (!nm) return toast('اكتب اسم الأخصائي');
      if ((SP.list || []).some(function (x) { return x.email === em; })) return toast('هذا البريد مضاف بالفعل — استعمل «تمديد»');
      try { await spSave({ email: em, name: nm, exp: days ? Math.floor(Date.now() / 1000) + days * 86400 : 0 }, true); toast('أُضيف ' + nm + ' — يدخل «زنها Pro» ببريده'); spLoad(); } catch (e) { toast('⚠ ' + e.message); }
    },
    spExt: async function (el) { var x = (SP.list || []).filter(function (y) { return y.email === el.dataset.e; })[0]; if (!x) return; var t = Math.floor(Date.now() / 1000), base = x.exp && x.exp > t ? x.exp : t; x.exp = base + 30 * 86400; try { await spSave(x, true); toast('مُدّد حتى ' + new Date(x.exp * 1000).toLocaleDateString('ar-EG')); spLoad(); } catch (e) { toast('⚠ ' + e.message); } },
    spToggle: async function (el) { var x = (SP.list || []).filter(function (y) { return y.email === el.dataset.e; })[0]; if (!x) return; x.status = x.status === 'off' ? 'active' : 'off'; try { await spSave(x, false); spLoad(); } catch (e) { toast('⚠ ' + e.message); } },
    spDel: async function (el) { if (!confirm('حذف الأخصائي ' + el.dataset.e + '؟ لن يستطيع الدخول بعدها.')) return; try { await cloudApi('DELETE', '/api/specialists/' + encodeURIComponent(el.dataset.e)); spLoad(); } catch (e) { toast('⚠ ' + e.message); } },
    cmAdd: async function () {
      var em = ($('#cm_email').value || '').trim(), role = $('#cm_role').value, perms = [].map.call(document.querySelectorAll('[data-cmp]:checked'), function (x) { return x.dataset.cmp; });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('اكتب بريداً صحيحاً');
      try { await cloudApi('POST', '/api/members', { email: em, role: role, perms: perms }); toast('أُضيف ' + em + ' — يدخل من العنوان نفسه بالرمز الذي يصله'); CM.list = null; CM.err = ''; cmLoad(); } catch (e) { toast('⚠ ' + e.message); }
    },
    cmToggle: async function (el) { var m = (CM.list || []).filter(function (x) { return x.email === el.dataset.e; })[0]; if (!m) return; try { await cloudApi('POST', '/api/members', { email: m.email, role: m.role, perms: m.perms, disabled: !m.disabled }); cmLoad(); } catch (e) { toast('⚠ ' + e.message); } },
    cmDel: async function (el) { if (!confirm('حذف العضو ' + el.dataset.e + ' من نظام الإدارة؟')) return; try { await cloudApi('DELETE', '/api/members/' + encodeURIComponent(el.dataset.e)); cmLoad(); } catch (e) { toast('⚠ ' + e.message); } },
    backup: function () { window.HApp.download(new Blob([JSON.stringify({ app: 'hissa-admin', v: 1, auth: HAD.auth, users: HAD.users })], { type: 'application/json' }), 'hissa_admin_backup_' + new Date().toISOString().slice(0, 10) + '.json'); toast('احفظ هذا الملف في مكان آمن'); }
  };
  document.addEventListener('click', function (e) { var el = e.target.closest('[data-ha]'); if (el && ACT[el.dataset.ha] && HAD) { e.preventDefault(); ACT[el.dataset.ha](el); } });
  var fl = function (e) { K.showFatal(e && e.message || e); };
  if (MODE === 'admin') window.HAuth = { ready: adminGate().catch(fl) };
})();
