// ================= النسخ الاحتياطي التلقائي المشفّر والمزامنة بين الأجهزة (يُدمج داخل app.js عند /*VAULTUI*/) — الإعدادات ← ☁ النسخ والمزامنة
// - «خزنة» على محطة «حصتي» نفسها: من «معرّف النسخة» و«كلمة سر النسخ» يُشتق (PBKDF2 310 ألف دورة) معرّف الخزنة ومفتاح الوصول ومفتاح التشفير.
//   كلمة السر لا تُحفظ ولا تُرسل؛ المحطة ترى بيانات مشفّرة (AES-GCM) فقط، وبصمة مفتاح الوصول.
// - النسخة = العملاء والإصدارات والإعدادات وارتباطات «حصتي» (مضغوطة ثم مشفّرة)، تُرفع أجزاءً، وتُحفظ آخر 7 نسخ.
// - تلقائياً: بعد كل تعديل (خلال 10 دقائق) ومرة يومياً على الأقل. والمزامنة: كل جهاز يدمج نسخ أجهزته الأخرى عميلاً بعميل (الأحدث يغلب،
//   والحذف يُنقل، وتعارض نفس العميل يحفظ النسخة الأقدم كإصدار فلا يضيع شيء، وتصادم الكود بين عميلين مختلفين يعطي الوارد كوداً جديداً).
// - ارتباطات «حصتي» (هوية المحطة) تُسترجع عند الاسترجاع على جهاز جديد فقط، ولا تُدمج أثناء المزامنة (جهاز واحد يستقبل رسائل العملاء).
var VT = { st: null, busy: false, msg: '', list: null, timer: 0, dirtyAt: 0 }, VKEY = 'vault', VITER = 310000;
function vtLoad() { return tx('meta', 'readonly', function (s) { return s.get(VKEY); }).then(function (r) { return r ? decRec('meta', r) : null; }).then(function (r) { VT.st = r || { key: VKEY, on: 0, tomb: [] }; VT.st.tomb = VT.st.tomb || []; vtTimer(); }).catch(function () { VT.st = { key: VKEY, on: 0, tomb: [] }; }); }
function vtSave() { saveQ = saveQ.then(function () { return dbPut('meta', VT.st); }).catch(function () { }); return saveQ; }
function vtIdDefault() { var m = /^hissa_u_(.+)$/.exec(CFG.dbName || ''); return m ? m[1] : S.mode === 'admin' ? 'admin' : ''; }
function vtRelay() { return hxRelay(); }
// اشتقاق معرّف الخزنة ومفتاح الوصول ومفتاح التشفير من (المعرّف + كلمة السر)
function vtDerive(id, pw) {
  var s = crypto.subtle, en = new TextEncoder();
  return s.importKey('raw', en.encode(String(pw)), 'PBKDF2', false, ['deriveBits']).then(function (k) { return s.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: en.encode('hissa-vault-v1:' + String(id).trim().toLowerCase()), iterations: VITER }, k, 512); })
    .then(function (b) { var u = new Uint8Array(b); return { vid: HXC0.b64u(u.slice(0, 16)), auth: HXC0.b64u(u.slice(16, 32)), enc: HXC0.b64u(u.slice(32, 64)) }; });
}
function vtKey(raw) { return crypto.subtle.importKey('raw', HXC0.unb64u(raw), 'AES-GCM', false, ['encrypt', 'decrypt']); }
function vtZip(u8, on) { if (typeof CompressionStream === 'undefined') return Promise.resolve(null); var cs = on ? new CompressionStream('gzip') : new DecompressionStream('gzip'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
function vtB64(u8) { var s = '', CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function vtPost(path, body, signed) { return hxFetch('POST', path, body, signed); }
// ---------- إنشاء النسخة ورفعها
function vtSnapshot() {
  return Promise.all([dbAll('clients'), dbAll('versions')]).then(function (r) {
    return { v: 1, at: Date.now(), dev: VT.st.dev || '', clients: r[0], versions: r[1].map(function (x) { var y = Object.assign({}, x); delete y.id; return y; }), settings: S.settings, tomb: VT.st.tomb || [], hx: HX.st && HX.st.reg ? HX.st : null };
  });
}
function vtBackup(why) {
  if (!VT.st || !VT.st.on || VT.busy || !hxOn()) return Promise.resolve(false);
  VT.busy = true; var t0 = Date.now(), raw, z = 0;
  return vtSnapshot().then(function (snap) { raw = new TextEncoder().encode(JSON.stringify(snap)); return vtZip(raw, true); }).then(function (c) {
    if (c) { raw = c; z = 1; } var iv = crypto.getRandomValues(new Uint8Array(12));
    return vtKey(VT.st.enc).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, raw); }).then(function (ct) { return JSON.stringify({ v: 1, z: z, iv: HXC0.b64u(iv), c: vtB64(new Uint8Array(ct)) }); });
  }).then(function (blob) {
    var up = HXC0.b64u(crypto.getRandomValues(new Uint8Array(12))), CH = 800000, n = Math.max(1, Math.ceil(blob.length / CH)), i = 0, last;
    if (n > 40) throw new Error('حجم البيانات أكبر من حد الخزنة (32 ميغابايت)');
    var next = function () { if (i >= n) return last; var part = blob.slice(i * CH, (i + 1) * CH), idx = i++; return vtPost('/v1/vault/put', { vid: VT.st.vid, auth: VT.st.auth, up: up, idx: idx, n: n, data: part, dev: VT.st.dev || '' }, true).then(function (r) { last = r; return next(); }); };
    return next().then(function (r) { VT.st.last = Date.now(); VT.st.lastVer = r.ver; VT.st.seenVer = Math.max(VT.st.seenVer || 0, r.ver); VT.st.size = blob.length; VT.st.err = ''; VT.dirtyAt = 0; return vtSave(); });
  }).then(function () { VT.busy = false; vtRail(); if (S.view === 'settings' && S.setTab === 'vault') main(); return true; })
    .catch(function (e) { VT.busy = false; VT.st.err = e.message; vtRail(); if (S.view === 'settings' && S.setTab === 'vault') main(); return false; });
}
// ---------- تنزيل نسخة وفك تشفيرها
function vtFetch(cred, ver) {
  var parts = [], idx = 0, n = 1;
  var next = function () { if (idx >= n) return Promise.resolve(); return vtPost('/v1/vault/get', { vid: cred.vid, auth: cred.auth, ver: ver, idx: idx }).then(function (r) { n = r.n; parts.push(r.data); idx++; return next(); }); };
  return next().then(function () {
    var b = JSON.parse(parts.join('')); return vtKey(cred.enc).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: HXC0.unb64u(b.iv) }, k, HXC0.unb64u(b.c)); })
      .catch(function () { throw new Error('تعذّر فك التشفير — كلمة سر النسخ غير صحيحة'); }).then(function (pt) { return b.z ? vtZip(new Uint8Array(pt), false) : new Uint8Array(pt); })
      .then(function (u) { return JSON.parse(new TextDecoder().decode(u)); });
  });
}
// ---------- الدمج: عميلاً بعميل (الأحدث يغلب) مع نقل الحذف وحفظ المتعارض
function vtMerge(snap, opt) {
  opt = opt || {}; var out = { add: 0, upd: 0, del: 0, conf: 0, ren: 0 }, since = (VT.st && VT.st.syncAt) || 0, ops = [];
  var uid = function (c) { return c.created ? 'u' + c.created : 'c' + c.code; }, byUid = {}, codes = {}, myTomb = {}, rem = {}, rtomb = {};   // هوية العميل الثابتة = وقت إنشائه (الكود قد يختلف بين الأجهزة)
  var nextCode = function () { var n = Object.keys(codes).reduce(function (a, k) { return Math.max(a, parseInt(k.slice(1)) || 0); }, 0) + 1; return 'C' + String(n).padStart(4, '0'); };
  S.clients.forEach(function (c) { byUid[uid(c)] = c; codes[c.code] = c; }); ((VT.st && VT.st.tomb) || []).forEach(function (t) { myTomb[uid(t)] = t.at; });
  (snap.clients || []).forEach(function (r) { rem[uid(r)] = r.updated || 0; }); (snap.tomb || []).forEach(function (t) { rtomb[uid(t)] = 1; });
  out.localNewer = S.clients.some(function (c) { var k = uid(c); return !rtomb[k] && (rem[k] === undefined || (c.updated || 0) > rem[k]); }) || ((VT.st && VT.st.tomb) || []).some(function (t) { return !rtomb[uid(t)]; }) || (S.settings._at || 0) > ((snap.settings || {})._at || 0);
  (snap.clients || []).forEach(function (r0) {
    var k = uid(r0), l = byUid[k], r = Object.assign({}, r0);
    if (myTomb[k] >= (r.updated || r.created || 0)) return;                                            // حذفناه هنا بعد آخر تعديل له هناك
    if (!l) {
      if (!opt.withHx) delete r.hx; if (codes[r.code]) { r.code = nextCode(); out.ren++; }             // كودان متطابقان لعميلين مختلفين: كود جديد للوارد
      S.clients.push(r); byUid[k] = r; codes[r.code] = r; ops.push(dbPut('clients', r)); out.add++; return;
    }
    if ((r.updated || 0) <= (l.updated || 0)) return;
    if ((l.updated || 0) > since && since) { ops.push(dbPut('versions', { code: l.code, at: Date.now(), note: 'نسخة من هذا الجهاز قبل المزامنة (عُدّلت هنا وعلى جهاز آخر)', plan: l.plan, client: ec(l) })); out.conf++; }
    if (!opt.withHx) { if (l.hx) r.hx = l.hx; else delete r.hx; }                                        // ارتباط «حصتي» يبقى على جهازه
    if (r.code !== l.code) { if (codes[r.code] && codes[r.code] !== l) r.code = l.code; else { ops.push(dbDel0('clients', l.code)); delete codes[l.code]; codes[r.code] = l; } }
    Object.keys(l).forEach(function (x) { delete l[x]; }); Object.assign(l, r); ops.push(dbPut('clients', l)); out.upd++;
  });
  (snap.tomb || []).forEach(function (t) {
    var l = byUid[uid(t)]; if (l && S.clients.indexOf(l) >= 0 && (l.updated || l.created || 0) <= t.at) { S.clients = S.clients.filter(function (x) { return x !== l; }); ops.push(dbDel0('clients', l.code)); out.del++; if (S.cur === l.code) S.cur = null; }
    if (VT.st && !VT.st.tomb.some(function (x) { return uid(x) === uid(t); })) VT.st.tomb.push(t);
  });
  return dbAll('versions').then(function (vs) {
    var have = {}; vs.forEach(function (v) { have[v.code + '|' + v.at] = 1; });
    (snap.versions || []).forEach(function (v) { if (!have[v.code + '|' + v.at]) { var y = Object.assign({}, v); delete y.id; ops.push(dbPut('versions', y)); } });
    if (snap.settings && (snap.settings._at || 0) > (S.settings._at || 0)) { var keepHx = S.settings.hx; S.settings = Object.assign({ colors: {}, over: {}, deleted: [], custom: [] }, snap.settings); if (keepHx && !snap.settings.hx) S.settings.hx = keepHx; ops.push(saveSettings0()); applyS(); }
    if (opt.withHx && snap.hx && snap.hx.ident && !(HX.st && HX.st.reg)) { HX.st = snap.hx; HX.st.key = 'hx'; ops.push(hxSave()); hxTimer(); }
    if (VT.st) { VT.st.tomb = VT.st.tomb.filter(function (t) { return Date.now() - t.at < 90 * 86400000; }); }
    return Promise.all(ops).then(function () { return out; });
  });
}
function vtSync() {                                                    // سحب نسخ الأجهزة الأخرى ودمجها
  if (!VT.st || !VT.st.on || !VT.st.sync || VT.busy || !hxOn()) return Promise.resolve(null);
  return vtPost('/v1/vault/head', { vid: VT.st.vid, auth: VT.st.auth }).then(function (h) {
    var top = h.vers[0]; if (!top || top.ver <= (VT.st.seenVer || 0)) return null;
    if (top.dev === VT.st.dev) { VT.st.seenVer = top.ver; return vtSave().then(function () { return null; }); }
    VT.busy = true; return vtFetch(VT.st, top.ver).then(function (snap) { return vtMerge(snap, {}); }).then(function (o) {
      VT.busy = false; VT.st.seenVer = top.ver; VT.st.syncAt = Date.now(); return vtSave().then(function () {
        if (o.add || o.upd || o.del) { render(); toast('☁ مزامنة من «' + (top.dev || 'جهاز آخر') + '»: ' + [o.add ? o.add + ' جديد' : '', o.upd ? o.upd + ' محدَّث' : '', o.del ? o.del + ' محذوف' : '', o.conf ? o.conf + ' تعارض حُفظ كإصدار' : ''].filter(Boolean).join('، ')); }
        if (o.localNewer) VT.dirtyAt = VT.dirtyAt || Date.now(); else VT.dirtyAt = 0; vtRail(); return o;
      });
    });
  }).catch(function (e) { VT.busy = false; VT.st.err = e.message; return null; });
}
function vtTimer() {
  clearInterval(VT.timer); if (!VT.st || !VT.st.on) return;
  var tick = function () { if (document.visibilityState === 'hidden') return; vtSync().then(function () { var age = Date.now() - (VT.st.last || 0); if ((VT.dirtyAt && Date.now() - VT.dirtyAt > VT.delay) || age > 86400000) vtBackup(); }); };
  VT.timer = setInterval(tick, VT.every); setTimeout(tick, 1500);
}
VT.every = 120000; VT.delay = 600000;                                   // كل دقيقتين: سحب؛ ورفع بعد 10 دقائق من آخر تعديل (أو يومياً)
// ---------- تتبع التعديلات (لرفعها) والحذف (لنقله)
var saveSettings0 = saveSettings, dbDel0 = dbDel;
function vtDirty() { VT.dirtyAt = VT.dirtyAt || Date.now(); vtRail(); }
(function (f) { persist = function (c) { vtDirty(); return f.apply(this, arguments); }; })(persist);
saveSettings = function () { S.settings._at = Date.now(); vtDirty(); return saveSettings0.apply(this, arguments); };
dbDel = function (st, k) { if (st === 'clients' && VT.st) { var c = S.clients.filter(function (x) { return x.code === k; })[0]; VT.st.tomb.push({ code: k, created: c ? c.created : 0, at: Date.now() }); vtSave(); vtDirty(); } return dbDel0.apply(this, arguments); };
// ---------- الواجهة
function vtAgo(t) { return t ? hxAgo(t) : 'لم تُؤخذ بعد'; }
function vtRail() {                                                     // تذكير في مجموعة «النسخ الاحتياطي» بالقائمة
  var g = document.querySelector('.sbg[data-g="bak"] .sbb'); if (!g) return; var b = g.querySelector('.vtrail'); if (!b) { b = document.createElement('button'); b.className = 'sec sidebtn vtrail'; b.setAttribute('data-a', 'vtOpen'); g.insertBefore(b, g.firstChild); }
  var on = VT.st && VT.st.on, old = !on || Date.now() - (VT.st.last || 0) > 3 * 86400000, warn = S.clients.length && old;
  b.innerHTML = (window.HIcon ? HIcon.svg('upload') : '') + '<span>' + (on ? '☁ النسخ التلقائي: ' + (VT.busy ? 'جارٍ…' : vtAgo(VT.st.last)) : '☁ فعّل النسخ التلقائي') + '</span>' + (warn ? '<em class="hxnb">!</em>' : '');
}
function vaultPage() {
  var st = VT.st || {}, on = st.on, relay = vtRelay(), hxok = hxOn();
  var restore = '<div class="ucard"><h3>استرجاع من نسخة سابقة (جهاز جديد أو بعد مسح المتصفح)</h3><div class="row"><div><label>عنوان المحطة</label><input id="vt_r" dir="ltr" value="' + esc((VT.rf && VT.rf.r) || relay) + '" placeholder="https://hissati.…workers.dev"></div><div><label>معرّف النسخة</label><input id="vt_ri" dir="ltr" value="' + esc((VT.rf && VT.rf.id) || st.id || vtIdDefault()) + '"></div><div><label>كلمة سر النسخ</label><input id="vt_rp" type="password" autocomplete="off"></div></div><p><button class="sec" data-a="vtList">عرض النسخ المتاحة</button></p>'
    + (VT.list ? '<div class="vtlist">' + VT.list.vers.map(function (v) { return '<div class="vtv"><b>نسخة ' + v.ver + '</b><small>' + new Date(v.at * 1000).toLocaleString('ar') + ' • ' + esc(v.dev || '') + ' • ' + Math.max(1, Math.round(v.size / 1024)) + ' ك.ب</small><button class="sm" data-a="vtRestore" data-v="' + v.ver + '">استرجاع</button></div>'; }).join('') + '<label class="chk"><input type="checkbox" id="vt_hx"' + (HX.st && HX.st.reg ? '' : ' checked') + '> استرجاع ارتباطات «حصتي» أيضاً (فقط إن لم يعد الجهاز القديم مستخدماً)</label><p class="small">الاسترجاع يدمج النسخة مع ما على هذا الجهاز ولا يحذف شيئاً منه.</p></div>' : '') + '</div>';
  return '<h3>☁ النسخ الاحتياطي التلقائي والمزامنة</h3><p class="small">نسخة مشفّرة من كل عملائك وإصداراتهم وإعداداتك تُحفظ تلقائياً على محطة «حصتي» (آخر 7 نسخ). تُشفَّر على جهازك بـ«كلمة سر النسخ» قبل أن تغادره، فلا تستطيع المحطة ولا أي أحد قراءتها. ومن أي جهاز آخر بنفس المعرّف وكلمة السر تُسترجع، أو تتزامن الأجهزة تلقائياً.</p>'
    + (!hxok ? '<div class="warn">اربط هذا الجهاز بالمحطة أولاً من «📲 حصتي» — الخزنة على المحطة نفسها. (الاسترجاع بالأسفل لا يحتاج الربط.)</div>'
      : on ? '<div class="ok">✓ النسخ التلقائي مفعّل لـ«' + esc(st.id) + '» على «' + esc(st.dev) + '». آخر نسخة: ' + vtAgo(st.last) + (st.lastVer ? ' (نسخة ' + st.lastVer + '، ' + Math.max(1, Math.round((st.size || 0) / 1024)) + ' ك.ب)' : '') + (VT.dirtyAt ? ' • تعديلات بانتظار الرفع' : '') + (st.err ? ' — <span style="color:#c0392b">' + esc(st.err) + '</span>' : '') + '</div>'
        + '<p class="two"><button data-a="vtNow"' + (VT.busy ? ' disabled' : '') + '>' + (VT.busy ? 'جارٍ…' : '☁ انسخ الآن') + '</button><button class="sec" data-a="vtSyncNow">↻ مزامنة الآن</button><button class="sec" data-a="vtOff">إيقاف</button></p>'
        + '<label class="chk"><input type="checkbox" data-vt="sync"' + (st.sync ? ' checked' : '') + '> مزامنة تلقائية مع أجهزتي الأخرى (كل دقيقتين أثناء فتح «حصة»)</label>'
      : '<div class="ucard"><h3>تفعيل النسخ التلقائي</h3><div class="row"><div><label>معرّف النسخة (اسمك أو اسم العيادة)</label><input id="vt_i" dir="ltr" value="' + esc(vtIdDefault()) + '"></div><div><label>اسم هذا الجهاز</label><input id="vt_d" value="' + esc(st.dev || (/Mobi/.test(navigator.userAgent) ? 'جوالي' : 'حاسوب العيادة')) + '"></div></div>'
        + '<div class="row"><div><label>كلمة سر النسخ (8 أحرف على الأقل)</label><input id="vt_p" type="password" autocomplete="new-password"></div><div><label>تأكيد كلمة السر</label><input id="vt_p2" type="password" autocomplete="new-password"></div></div>'
        + '<p class="small">⚠ احفظ كلمة سر النسخ: لا يمكن استرجاعها، وبدونها لا تُفتح النسخ. يمكن أن تكون كلمة سر دخولك نفسها. استعمل نفس المعرّف وكلمة السر على أجهزتك الأخرى لتتزامن.</p><p><button data-a="vtOn"' + (VT.busy ? ' disabled' : '') + '>تفعيل وأخذ أول نسخة</button></p></div>')
    + (VT.msg ? '<div class="warn">' + esc(VT.msg) + '</div>' : '') + restore;
}
function vtHomeCard() { return VT.st && !VT.st.on && !S.clients.length ? '<div class="ucard vthome"><h3>☁ جهاز جديد؟</h3><p class="small">إن كانت لديك نسخة احتياطية تلقائية على محطة «حصتي»، استرجع عملاءك هنا بمعرّف النسخة وكلمة سرها.</p><button data-a="vtOpen">استرجاع عملائي</button></div>' : ''; }
Object.assign(A, {
  vtOpen: function () { S.view = 'settings'; S.setTab = 'vault'; render(); },
  vtOn: function () {
    var id = ($('#vt_i').value || '').trim(), dev = ($('#vt_d').value || '').trim() || 'جهاز', p1 = $('#vt_p').value, p2 = $('#vt_p2').value;
    if (!id) { toast('اكتب معرّف النسخة'); return; } if (p1.length < 8) { toast('كلمة سر النسخ 8 أحرف على الأقل'); return; } if (p1 !== p2) { toast('كلمتا السر غير متطابقتين'); return; }
    VT.busy = true; VT.msg = ''; main(); toast('جارٍ تجهيز الخزنة المشفّرة…');
    vtDerive(id, p1).then(function (k) {
      return vtPost('/v1/vault/head', { vid: k.vid, auth: k.auth }).then(function (h) { return h; }, function (e) { if (e.code === 'novault') return null; throw e; }).then(function (h) {
        VT.st = Object.assign(VT.st || {}, { key: VKEY, on: 1, id: id, dev: dev, vid: k.vid, auth: k.auth, enc: k.enc, sync: 1, tomb: (VT.st && VT.st.tomb) || [], seenVer: 0, syncAt: 0 }); VT.busy = false;
        return vtSave().then(function () { return h && h.head ? vtSync() : null; }).then(function () { return vtBackup(); });
      });
    }).then(function (ok) { vtTimer(); main(); vtRail(); toast(ok ? '✓ فُعّل النسخ التلقائي وأُخذت أول نسخة' : 'فُعّل، لكن تعذّر الرفع الآن: ' + (VT.st.err || '')); })
      .catch(function (e) { VT.busy = false; VT.msg = e.message; main(); });
  },
  vtOff: function () { if (!confirm('إيقاف النسخ التلقائي على هذا الجهاز؟ النسخ المحفوظة على المحطة تبقى.')) return; VT.st.on = 0; clearInterval(VT.timer); vtSave(); main(); vtRail(); },
  vtNow: function () { vtBackup().then(function (ok) { toast(ok ? '✓ أُخذت نسخة احتياطية' : 'تعذّر النسخ: ' + (VT.st.err || '')); }); },
  vtSyncNow: function () { toast('جارٍ المزامنة…'); vtSync().then(function (o) { if (!o) toast('لا جديد من أجهزتك الأخرى'); main(); }); },
  vtList: function () {
    var r = ($('#vt_r').value || '').trim().replace(/\/+$/, ''), id = ($('#vt_ri').value || '').trim(), pw = $('#vt_rp').value; if (!hxUrlOk(r)) { toast('اكتب عنوان المحطة'); return; } if (!id || !pw) { toast('اكتب المعرّف وكلمة السر'); return; }
    if (!HX.st) HX.st = { key: 'hx', inv: {}, reqs: {}, after: 0 }; if (!hxRelay()) HX.st.relay = r; VT.msg = ''; VT.rf = { r: r, id: id }; toast('جارٍ البحث…');
    vtDerive(id, pw).then(function (k) { VT.cred = k; VT.credId = id; return vtPost('/v1/vault/head', { vid: k.vid, auth: k.auth }); }).then(function (h) { VT.list = h; main(); var p = $('#vt_rp'); if (p) p.value = pw; })
      .catch(function (e) { VT.list = null; VT.msg = e.code === 'novault' || e.code === 'vauth' ? 'لا توجد نسخة بهذا المعرّف وكلمة السر (تأكد من الكتابة كما وقت التفعيل)' : e.message; main(); });
  },
  vtRestore: function (v) {
    var withHx = ($('#vt_hx') || {}).checked; if (!confirm('استرجاع النسخة ' + v + ' ودمجها مع هذا الجهاز؟')) return; toast('جارٍ الاسترجاع…');
    vtFetch(VT.cred, +v).then(function (snap) { return vtMerge(snap, { withHx: withHx }); }).then(function (o) {
      VT.list = null; render(); toast('✓ استُرجع: ' + o.add + ' عميل جديد و' + o.upd + ' محدَّث' + (o.ren ? ' (' + o.ren + ' بكود جديد)' : ''));
      if (VT.st && !VT.st.on) VT.msg = 'لتستمر النسخ والمزامنة على هذا الجهاز: فعّل النسخ التلقائي بنفس المعرّف وكلمة السر.';
      main();
    }).catch(function (e) { toast('⚠ ' + e.message); VT.msg = e.message; main(); });
  }
});
document.addEventListener('change', function (e) { var t = e.target; if (t.dataset && t.dataset.vt === 'sync' && VT.st) { VT.st.sync = t.checked ? 1 : 0; vtSave(); } });
(function (f) { render = function () { var r = f.apply(this, arguments); if (!VT.st && DB && !VT.loading) { VT.loading = 1; vtLoad().then(function () { vtRail(); if (S.view === 'settings' || (!S.cur && S.view === 'client')) main(); }); } else vtRail(); return r; }; })(render);
