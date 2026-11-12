/* بوابة الدخول (مدير / مستخدم) — بلا أي خادم: أكواد تفعيل موقَّعة، وكلمات سر مشتقة، وبيانات مشفّرة محلياً.
   هذا الملف: الأدوات المشتركة (البوابة، التخزين، «البقاء مسجلاً/حفظ كلمة السر»، الخلفية والفيديو القابلان للتخصيص) + بوابة المستخدم. */
(function () {
  'use strict';
  var H = window.HSec, MODE = window.APP_MODE, $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  document.title = 'زنها Pro'; var ic = document.createElement('link'); ic.rel = 'icon'; ic.href = window.ASSETS.icon; document.head.appendChild(ic);
  var reduced = function () { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); };
  // ---------- لا شاشة بيضاء: أي خطأ قبل بدء التطبيق يظهر بوضوح داخل البوابة
  function showFatal(msg) {
    var g = $('#gate'); if (!g || window.__appStarted) return; document.body.classList.add('gating'); g.style.display = 'flex'; $('#app').style.display = 'none';
    g.innerHTML = '<div class="gcard"><h2>تعذّر التشغيل</h2><div class="gerr">' + esc(msg) + '</div><p class="small">افتح الملف في Chrome أو Edge أو Safari حديث. التشفير يحتاج رابطاً آمناً (https) أو فتح الملف من القرص. وإن كنت تفتحه من تطبيق مراسلة فانسخ الرابط إلى المتصفح.</p><p><button onclick="location.reload()">إعادة المحاولة</button></p></div>';
  }
  window.addEventListener('error', function (e) { showFatal((e.message || 'خطأ غير معروف') + (e.filename ? ' — ' + String(e.filename).split('/').pop() + ':' + e.lineno : '')); });
  window.addEventListener('unhandledrejection', function (e) { showFatal(String(e.reason && e.reason.message || e.reason || 'خطأ غير معروف')); });
  // ---------- إعدادات واجهة الدخول: خلفية (افتراضي/لون/صورة) + فيديو أو شعار (افتراضي/مخصص/ثابت/بلا)
  var GATE_DEF = { bgType: 'default', bgColor: '#152257', bgImage: '', splash: 'video', video: '' };
  function gateCfg() { return Object.assign({}, GATE_DEF, window.HGateCfg || (window.BASE_SETTINGS && window.BASE_SETTINGS.gate) || {}); }
  function bgCss(cfg) { cfg = cfg || gateCfg(); if (cfg.bgType === 'image' && cfg.bgImage) return 'url(' + cfg.bgImage + ') center/cover no-repeat ' + (cfg.bgColor || GATE_DEF.bgColor); if (cfg.bgType === 'color' && cfg.bgColor) return cfg.bgColor; return window.ASSETS.splashBg; }
  function splashHtml(cfg, cls) {                              // 'video' (الافتراضي) = الشعار المتجهي المتحرك؛ 'custom' = فيديو المدير؛ 'logo' = ثابت على لوحة بيضاء
    cfg = cfg || gateCfg(); var m = cfg.splash || 'video'; if (m === 'none') return '';
    if (m === 'logo') return '<div class="logoplate ' + cls + '"><img src="' + window.ASSETS.light + '" alt="زنها Pro"></div>';
    if (m === 'custom' && cfg.video) return '<video class="' + cls + '" src="' + cfg.video + '" ' + (reduced() ? '' : 'autoplay ') + 'muted playsinline preload="auto"></video>';
    return '<div class="hxlogo ' + (reduced() ? '' : 'hxanim ') + cls + '">' + window.ASSETS.logoSvg + '</div>';
  }
  function bindVideo(root) {                                   // إن تعذّر تشغيل الفيديو (ترميز غير مدعوم) يظهر الشعار الثابت بدل فراغ
    [].forEach.call(root.querySelectorAll('video'), function (v) {
      var swap = function () { if (!v.parentNode) return; var d = document.createElement('div'); d.className = 'logoplate ' + v.className; d.innerHTML = '<img src="' + window.ASSETS.light + '" alt="زنها Pro">'; v.parentNode.replaceChild(d, v); };
      v.addEventListener('error', swap);
    });
  }
  function gate(inner, wide) {
    var g = $('#gate'), cfg = gateCfg(), sig = JSON.stringify([cfg.splash, cfg.video.length]); document.body.classList.add('gating'); g.style.display = 'flex'; g.style.background = bgCss(cfg);
    if (!g.querySelector('#gsp') || g.dataset.sig !== sig) { g.dataset.sig = sig; g.innerHTML = '<div id="gsp">' + splashHtml(cfg, 'gvid') + '</div><div class="gcard" id="gcard"></div>'; bindVideo(g); }
    var card = g.querySelector('#gcard'); card.style.maxWidth = (wide ? 580 : 410) + 'px'; card.innerHTML = inner; $('#app').style.display = 'none'; $('#hd').innerHTML = '';
  }
  function openGate() { $('#gate').style.display = 'none'; document.body.classList.remove('gating'); $('#app').style.display = ''; }
  function copy(txt, ok) { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { ok && ok(); }, function () { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok && ok(); } catch (e) { } ta.remove(); }); }
  // ---------- تخزين صغير (مفتاح/قيمة) منفصل عن بيانات التطبيق
  function openKV(name, users) { return new Promise(function (res, rej) { var r = indexedDB.open(name, 1); r.onupgradeneeded = function () { var d = r.result; d.createObjectStore('kv', { keyPath: 'key' }); if (users) d.createObjectStore('users', { keyPath: 'username' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; r.onblocked = function () { rej(new Error('التخزين المحلي محجوب')); }; }); }
  function kvGet(db, st, k) { return new Promise(function (res) { var q = db.transaction(st).objectStore(st).get(k); q.onsuccess = function () { res(q.result); }; }); }
  function kvAll(db, st) { return new Promise(function (res) { var q = db.transaction(st).objectStore(st).getAll(); q.onsuccess = function () { res(q.result); }; }); }
  function kvPut(db, st, v) { return new Promise(function (res, rej) { var t = db.transaction(st, 'readwrite'); t.objectStore(st).put(v); t.oncomplete = res; t.onerror = function () { rej(t.error); }; }); }
  function kvDel(db, st, k) { return new Promise(function (res) { var t = db.transaction(st, 'readwrite'); t.objectStore(st).delete(k); t.oncomplete = res; }); }
  var fails = 0, until = 0;
  function throttleLeft() { return Math.ceil((until - Date.now()) / 1000); }
  function failed() { fails++; until = Date.now() + Math.min(60, Math.pow(2, fails)) * 1000; }
  function resetFails() { fails = 0; }
  // ---------- «البقاء مسجلاً» و«حفظ كلمة السر»: كلمة السر تُشفَّر بمفتاح جهاز AES-GCM غير قابل للتصدير مخزَّن في IndexedDB (لا نص صريح أبداً)
  var DAYS = 30;
  function makeRem(db) {
    var enc = new TextEncoder(), dec = new TextDecoder();
    async function devKey() { var r = await kvGet(db, 'kv', 'devkey'); if (r && r.k) return r.k; var k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); await kvPut(db, 'kv', { key: 'devkey', k: k }); return k; }
    return {
      save: async function (u, pw, o) { var k = await devKey(), iv = H.rand(12), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, enc.encode(pw))); await kvPut(db, 'kv', { key: 'rem:' + u.toLowerCase(), u: u, iv: H.b64(iv), ct: H.b64(ct), stay: !!o.stay, fill: !!o.fill, exp: Date.now() + DAYS * 864e5, last: Date.now() }); await kvPut(db, 'kv', { key: 'prefs', stay: !!o.stay, fill: !!o.fill }); },
      get: function (u) { return kvGet(db, 'kv', 'rem:' + String(u || '').toLowerCase()); },
      pw: async function (r) { try { return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: H.ub64(r.iv) }, await devKey(), H.ub64(r.ct))); } catch (e) { return null; } },
      clear: async function (u) { await kvDel(db, 'kv', 'rem:' + String(u || '').toLowerCase()); },
      signOut: async function (u) { var r = await kvGet(db, 'kv', 'rem:' + String(u || '').toLowerCase()); if (!r) return; if (r.fill) { r.stay = false; await kvPut(db, 'kv', r); } else await kvDel(db, 'kv', 'rem:' + String(u).toLowerCase()); },
      prefs: async function () { return (await kvGet(db, 'kv', 'prefs')) || { stay: false, fill: false }; },
      setPrefs: function (stay, fill) { return kvPut(db, 'kv', { key: 'prefs', stay: !!stay, fill: !!fill }); },
      staying: async function () { var all = (await kvAll(db, 'kv')).filter(function (r) { return r.key.indexOf('rem:') === 0 && r.stay && r.exp > Date.now(); }); all.sort(function (a, b) { return b.last - a.last; }); return all[0] || null; }
    };
  }
  function remBox(p, hasSaved) { return '<div class="rembox"><label class="chk"><input type="checkbox" id="rmStay" ' + (p.stay ? 'checked' : '') + '> البقاء مسجلاً (لا يُطلب الدخول عند تحديث الصفحة أو إعادة فتح التطبيق)</label><label class="chk"><input type="checkbox" id="rmFill" ' + (p.fill ? 'checked' : '') + '> حفظ كلمة السر وتعبئتها تلقائياً</label><small class="small">لا تفعّل الخيارين على جهاز مشترك. تُحفظ كلمة السر مشفّرة بمفتاح الجهاز، ويلغي «قفل/خروج» البقاء مسجلاً.</small>' + (hasSaved ? '<br><a href="#" id="rmForget" class="small">نسيان كلمة السر المحفوظة على هذا الجهاز</a>' : '') + '</div>'; }
  window.HK = { gate: gate, openGate: openGate, copy: copy, openKV: openKV, kvGet: kvGet, kvAll: kvAll, kvPut: kvPut, kvDel: kvDel, throttleLeft: throttleLeft, failed: failed, resetFails: resetFails, esc: esc, $: $, makeRem: makeRem, remBox: remBox, gateCfg: gateCfg, bgCss: bgCss, splashHtml: splashHtml, bindVideo: bindVideo, showFatal: showFatal, GATE_DEF: GATE_DEF };
  // ======================================================= بوابة المستخدم
  async function userGate() {
    if (!window.ADMIN_PUB) { gate('<h2>هذه النسخة غير مرتبطة بمدير</h2><p class="small">استخدم ملف المستخدمين الذي يصدّره لك المدير من لوحة الإدارة (زر «تصدير نسخة المستخدمين»).</p>'); return; }
    if (!(window.crypto && window.crypto.subtle)) { showFatal('هذا المتصفح أو هذا السياق لا يوفّر التشفير (WebCrypto).'); return; }
    var db = await openKV('hissa_device'), nid = window.HNative ? await window.HNative.deviceId() : null, dev = await kvGet(db, 'kv', 'device'); if (!dev) { dev = { key: 'device', id: nid || H.newDeviceId(), maxSeen: 0 }; await kvPut(db, 'kv', dev); } else if (nid && dev.id !== nid) { dev.id = nid; await kvPut(db, 'kv', dev); }   // داخل التطبيق: معرّف الجهاز الأصلي (يبقى عند مسح بيانات التطبيق في أندرويد)
    var ctx = function () { return { deviceId: dev.id, now: Date.now(), maxSeen: dev.maxSeen }; }, REM = makeRem(db);
    async function attempt(name, pw) {                          // يتحقق من الكود المحفوظ والجهاز وكلمة السر
      name = String(name || '').trim(); var rec = name && await kvGet(db, 'kv', 'token:' + name.toLowerCase()), bad = 'اسم المستخدم أو كلمة السر غير صحيحة، أو لم يُفعَّل هذا الجهاز لهذا المستخدم';
      if (!rec) return { err: bad }; var p; try { p = await H.verify(window.ADMIN_PUB, rec.token); } catch (e) { return { err: 'الكود المحفوظ غير صالح — فعّل الجهاز من جديد' }; }
      var v = H.validate(p, ctx()); if (!v.ok) return { reason: v.reason, err: H.REASONS[v.reason] }; if (!(await H.checkPw(pw, p))) return { err: bad }; return { ok: true, p: p };
    }
    async function enter(p, pw, stay) { resetFails(); dev.maxSeen = Math.max(dev.maxSeen || 0, Date.now()); await kvPut(db, 'kv', dev); var key = await H.dataKey(pw, p.sd, p.it); openGate(); window.HApp.start({ mode: 'user', dbName: 'hissa_u_' + p.u.toLowerCase(), key: key, base: window.BASE_SETTINGS, userLabel: p.n, exp: p.exp, lockMin: 30, stay: !!stay, signOut: function () { return REM.signOut(p.u); },
      aiToken: async function () { var r = await kvGet(db, 'kv', 'token:' + p.u.toLowerCase()); return r && r.token; },     // الوسيط يتحقق من توقيع كود التفعيل؛ لا مفتاح سري في التطبيق
      legacyKeys: async function (pw, tokenText) {            // مفاتيح قديمة لهذا المستخدم: من الأكواد السابقة المحفوظة أو من كود قديم يلصقه المستخدم
        var toks = tokenText ? [tokenText] : (await kvAll(db, 'kv')).filter(function (r) { return r.key.indexOf('prev:' + p.u.toLowerCase() + ':') === 0; }).map(function (r) { return r.token; }), keys = [];
        for (var i = 0; i < toks.length; i++) { try { var po = await H.verify(window.ADMIN_PUB, toks[i]); if (po.u && po.u.toLowerCase() === p.u.toLowerCase() && await H.checkPw(pw, po)) keys.push(await H.dataKey(pw, po.sd, po.it)); } catch (e) { } } return keys;
      } }); }
    function activate(msg) {
      gate('<h2>تفعيل هذا الجهاز</h2>' + (msg ? '<div class="gerr" id="amsg">' + esc(msg) + '</div>' : '') + '<p class="small">أرسل «رمز الجهاز» للمدير ليعطيك كود التفعيل (حدّ أقصى جهازان لكل مستخدم)، ثم الصقه هنا.</p><label>رمز هذا الجهاز</label><div class="gdev"><code id="devId">' + dev.id + '</code> <button class="sec sm" id="cpDev">نسخ</button></div><label>كود التفعيل</label><textarea id="actCode" rows="4" placeholder="الصق الكود هنا"></textarea><p><button id="actBtn">تفعيل</button> <button class="sec" id="toLogin">لدي تفعيل — الدخول</button></p>');
      $('#cpDev').onclick = function () { copy(dev.id, function () { $('#cpDev').textContent = 'تم النسخ'; }); }; $('#toLogin').onclick = function () { login(); };
      $('#actBtn').onclick = async function () { var code = $('#actCode').value.replace(/\s+/g, ''); try { var p = await H.verify(window.ADMIN_PUB, code), v = H.validate(p, ctx()); if (!v.ok) { activate(H.REASONS[v.reason]); return; } var oldT = await kvGet(db, 'kv', 'token:' + p.u.toLowerCase()); if (oldT && oldT.token !== code) { try { var po = await H.verify(window.ADMIN_PUB, oldT.token); if (po.sd !== p.sd) await kvPut(db, 'kv', { key: 'prev:' + p.u.toLowerCase() + ':' + String(po.sd).slice(0, 12), token: oldT.token, u: p.u, at: Date.now() }); } catch (e) { } }   // يُحفظ الكود السابق ليمكن فكّ بيانات المفتاح القديم لاحقاً
        await kvPut(db, 'kv', { key: 'token:' + p.u.toLowerCase(), token: code, u: p.u }); login(p.u, 'تم تفعيل الجهاز للمستخدم «' + p.n + '». أدخل كلمة السر.'); } catch (e) { activate(e.message); } };
    }
    async function login(prefill, note) {
      var pr = await REM.prefs(), sr = prefill ? await REM.get(prefill) : null;
      gate('<h2>تسجيل الدخول</h2>' + (note ? '<div class="gok">' + esc(note) + '</div>' : '') + '<label>اسم المستخدم</label><input id="lu" autocomplete="username" value="' + esc(prefill || '') + '"><label>كلمة السر</label><input id="lp" type="password" autocomplete="current-password"><label class="chk"><input type="checkbox" id="showpw"> إظهار كلمة السر (للتأكد مما كتبته ولغة لوحة المفاتيح)</label><div id="lerr"></div>' + remBox(pr, !!(sr && sr.fill)) + '<p><button id="lbtn">دخول</button> <button class="sec" id="toAct">تفعيل / تجديد الكود</button></p>');
      $('#showpw').onchange = function () { $('#lp').type = this.checked ? 'text' : 'password'; };
      $('#toAct').onclick = function () { activate(); };
      var forgot = false, fill = async function () { var r = await REM.get($('#lu').value.trim()); if (r && r.fill && !$('#lp').value && !forgot) { var pw = await REM.pw(r); if (pw && !forgot) $('#lp').value = pw; } }; fill(); $('#lu').addEventListener('change', fill);
      var fg = $('#rmForget'); if (fg) fg.onclick = async function (e) { e.preventDefault(); forgot = true; await REM.clear($('#lu').value); await REM.setPrefs(false, false); $('#lp').value = ''; $('#rmFill').checked = false; $('#rmStay').checked = false; fg.remove(); };
      function fail(m) { failed(); $('#lerr').innerHTML = '<div class="gerr">' + esc(m) + '</div>'; }
      var go = async function () {
        var left = throttleLeft(); if (left > 0) { $('#lerr').innerHTML = '<div class="gerr">انتظر ' + left + ' ثانية قبل المحاولة</div>'; return; }
        var name = $('#lu').value.trim(), pw = $('#lp').value, r = await attempt(name, pw);
        if (!r.ok) { if (r.reason === 'expired' || r.reason === 'device') activate(r.err); else fail(r.err); return; }
        var stay = $('#rmStay').checked, fl = $('#rmFill').checked; if (stay || fl) await REM.save(r.p.u, pw, { stay: stay, fill: fl }); else { await REM.clear(r.p.u); await REM.setPrefs(false, false); } await enter(r.p, pw, stay);
      };
      $('#lbtn').onclick = go; $('#lp').onkeydown = function (e) { if (e.key === 'Enter') go(); };
    }
    // ---------- 0.96: الدخول بالبريد — موقع الأخصائيين خلف Cloudflare Access يعطي رخصة بريد الأخصائي من /api/lic (موقّعة بمفتاح المدير)،
    // وكلمة سر محلية يختارها الأخصائي مرة واحدة تشفّر بياناته على هذا الجهاز (لا يفتحها من يصل لبريده فقط). إن رُبط بحساب قديم (lu)
    // يكتب كلمة سره القديمة مرة واحدة فيُستعمل نفس مفتاح البيانات، فتظهر عملاؤه كما هي.
    async function emLic() {
      if (location.protocol === 'file:' || !window.fetch) return null;
      var ua = navigator.userAgent || '', lab = (/Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'جهاز') + ' • ' + (/Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'متصفح');
      try { var r = await fetch('/api/lic?d=' + encodeURIComponent(dev.id) + '&l=' + encodeURIComponent(lab), { cache: 'no-store', credentials: 'same-origin' }), j = await r.json().catch(function () { return {}; }); if (r.ok && j.lic) return j; if (r.status === 403 && j.code) return j; return null; }
      catch (e) { var acc = (await kvAll(db, 'kv')).filter(function (x) { return x.key.indexOf('emacct:') === 0; }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); })[0]; if (!acc) return null; var t = await kvGet(db, 'kv', 'token:' + acc.u.toLowerCase()); return t ? { lic: t.token, email: acc.em, offline: true } : null; }
    }
    function emNo(j) { gate('<h2>لم يُفعَّل حسابك بعد</h2><div class="gerr">' + esc(j.error || 'هذا البريد غير مسجّل') + '</div><p class="small">دخلت بالبريد <b dir="ltr">' + esc(j.email || '') + '</b>. اطلب من إدارة «زنها» إضافة بريدك أو تفعيله، ثم أعد تحميل الصفحة.</p><p><button class="sec" id="emOld">الدخول بالطريقة القديمة (اسم المستخدم وكلمة السر)</button></p>'); $('#emOld').onclick = function () { oldFlow(); }; }
    async function emailFlow(x) {
      var p; try { p = await H.verify(window.ADMIN_PUB, x.lic); } catch (e) { return emNo({ error: 'رخصة حسابك غير صالحة. تواصل مع الإدارة.', email: x.email }); }
      var em = String(x.email || '').toLowerCase(); if (p.t !== 'em' || String(p.em || '').toLowerCase() !== em) return emNo({ error: 'الرخصة لا تخص هذا البريد.', email: em });
      if (p.exp && p.exp * 1000 < Date.now()) return emNo({ error: 'انتهى اشتراكك في «زنها Pro». تواصل مع الإدارة للتجديد.', email: em });
      var acct = await kvGet(db, 'kv', 'emacct:' + em), u = acct ? acct.u : (p.lu ? String(p.lu) : 'em_' + em);
      var P = function (a) { return { u: a.u, n: p.n, exp: p.exp, sd: a.sd, it: a.it }; };
      var keep = async function (a) { a.at = Date.now(); await kvPut(db, 'kv', a); await kvPut(db, 'kv', { key: 'token:' + a.u.toLowerCase(), token: x.lic, u: a.u, em: 1 }); };
      var st = await REM.staying(); if (acct && st && st.u.toLowerCase() === acct.u.toLowerCase()) { var pw0 = await REM.pw(st); if (pw0 && await H.checkPw(pw0, acct)) { await keep(acct); await REM.save(acct.u, pw0, { stay: true, fill: st.fill }); return enter(P(acct), pw0, true); } await REM.clear(st.u); }
      var pr = await REM.prefs(), hello = '<h2>مرحباً ' + esc(p.n || '') + '</h2><p class="small">دخلت بالبريد <b dir="ltr">' + esc(em) + '</b>' + (x.offline ? ' (بلا اتصال — تُستعمل آخر رخصة محفوظة)' : '') + '.</p>';
      var old = !acct && p.lu ? await kvGet(db, 'kv', 'token:' + String(p.lu).toLowerCase()) : null, po = null; if (old && !old.em) { try { po = await H.verify(window.ADMIN_PUB, old.token); } catch (e) { po = null; } }
      if (acct) gate(hello + '<label for="ep">كلمة سر هذا الجهاز</label><input id="ep" type="password" autocomplete="current-password"><div id="eerr"></div>' + remBox(pr, false) + '<p><button id="ebtn">دخول</button></p><p class="small">كلمة السر هذه تفتح بياناتك المحفوظة على هذا الجهاز فقط.</p>');
      else if (po) gate(hello + '<div class="gok">رُبط بريدك بحسابك السابق «' + esc(po.n || p.lu) + '». اكتب كلمة سرك المعتادة مرة واحدة لتبقى بياناتك كما هي، وبعدها تدخل ببريدك.</div><label for="ep">كلمة سرك الحالية في «زنها Pro»</label><input id="ep" type="password" autocomplete="current-password"><div id="eerr"></div>' + remBox(pr, false) + '<p><button id="ebtn">متابعة</button></p>');
      else gate(hello + '<p class="small">اختر كلمة سر لهذا الجهاز (8 أحرف على الأقل). تشفّر بيانات عملائك على هذا الجهاز، فلا يفتحها من يصل إلى بريدك وحده.</p><label for="ep">كلمة سر الجهاز</label><input id="ep" type="password" autocomplete="new-password"><label for="ep2">تأكيدها</label><input id="ep2" type="password" autocomplete="new-password"><div id="eerr"></div>' + remBox(pr, false) + '<p><button id="ebtn">ابدأ</button></p>');
      var bad = function (m, form) { if (!form) failed(); $('#eerr').innerHTML = '<div class="gerr">' + esc(m) + '</div>'; };
      var go = async function () {
        var left = throttleLeft(); if (left > 0) return bad('انتظر ' + left + ' ثانية قبل المحاولة', 1); var pw = $('#ep').value, a = acct;
        if (acct) { if (!(await H.checkPw(pw, acct))) return bad('كلمة السر غير صحيحة'); }
        else if (po) { if (!(await H.checkPw(pw, po))) return bad('كلمة السر غير صحيحة'); a = { key: 'emacct:' + em, em: em, u: po.u, sv: po.sv, sd: po.sd, it: po.it, vf: po.vf }; }
        else { if (pw.length < 8) return bad('كلمة السر 8 أحرف على الأقل', 1); if (pw !== $('#ep2').value) return bad('كلمتا السر غير متطابقتين', 1); a = Object.assign({ key: 'emacct:' + em, em: em, u: u }, await H.makeVerifier(pw)); }
        await keep(a); var stay = $('#rmStay').checked, fl = $('#rmFill').checked; if (stay || fl) await REM.save(a.u, pw, { stay: stay, fill: fl }); else { await REM.clear(a.u); await REM.setPrefs(false, false); }
        await enter(P(a), pw, stay);
      };
      $('#ebtn').onclick = go; $('#ep').onkeydown = function (e) { if (e.key === 'Enter' && !$('#ep2')) go(); }; if ($('#ep2')) $('#ep2').onkeydown = function (e) { if (e.key === 'Enter') go(); };
    }
    var emx = await emLic(); if (emx) { if (emx.lic) return emailFlow(emx); return emNo(emx); }
    return oldFlow();
    async function oldFlow() {
    // دخول تلقائي لمن اختار «البقاء مسجلاً»
    var st = await REM.staying();
    if (st) { var pw0 = await REM.pw(st), r0 = pw0 ? await attempt(st.u, pw0) : { err: 'تعذّر قراءة كلمة السر المحفوظة' }; if (r0.ok) { await REM.save(r0.p.u, pw0, { stay: true, fill: st.fill }); await enter(r0.p, pw0, true); return; } await REM.clear(st.u); login(st.u, 'انتهت جلسة «البقاء مسجلاً»: ' + (r0.err || '') + '. أدخل كلمة السر.'); return; }
    var ts = (await kvAll(db, 'kv')).filter(function (r) { return r.key.indexOf('token:') === 0 && !r.em; }); if (ts.length) login(ts.length === 1 ? ts[0].u : ''); else activate();
    }
  }
  var fl = function (e) { showFatal(e && e.message || e); };
  if (MODE === 'user') window.HAuth = { ready: userGate().catch(fl) };
})();
