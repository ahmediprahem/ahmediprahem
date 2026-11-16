// ================= الرسائل الصوتية (1.08) — مشتركة بين «زنها» و«زنها Pro» (تُلحق بـ hx_crypto.js عند البناء)
// التسجيل على الجهاز ← تشفير AES-GCM بمفتاح عشوائي ← رفع النص المشفّر للمحطة على أجزاء ← المفتاح يسافر داخل الرسالة المشفّرة طرفاً لطرف.
// المحطة لا تسمع شيئاً، وتحذف التسجيل بعد 7 أيام. لا يُحفظ الصوت في التطبيق: يُجلب عند الاستماع فقط ويبقى في الذاكرة حتى إغلاق الصفحة.
(function (root) {
  var MAXS = 300, CH = 600000, TTL = 7 * 86400000, C = root.crypto, SB = C && C.subtle;
  var b64u = function (buf) { var b = new Uint8Array(buf), s = ''; for (var i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  var unb64u = function (s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  var R = null, reg = {}, urls = {}, cur = null;
  function ok() { return !!(root.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && root.MediaRecorder && SB); }
  function mime() { var c = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/aac']; for (var i = 0; i < c.length; i++) { try { if (MediaRecorder.isTypeSupported(c[i])) return c[i]; } catch (e) { } } return ''; }
  function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function start(onTick, onMax) {
    if (!ok()) return Promise.reject(new Error('جهازك أو متصفحك لا يدعم تسجيل الصوت'));
    if (R) return Promise.resolve();
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (st) {
      var m = mime(), o = { audioBitsPerSecond: 24000 }; if (m) o.mimeType = m; var mr; try { mr = new MediaRecorder(st, o); } catch (e) { mr = new MediaRecorder(st); }
      R = { mr: mr, st: st, parts: [], t0: Date.now(), m: mr.mimeType || m || 'audio/webm' };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) R.parts.push(e.data); };
      mr.start(1000);
      R.tm = setInterval(function () { var s = (Date.now() - R.t0) / 1000; if (onTick) onTick(fmt(s), s); if (s >= MAXS && onMax) onMax(); }, 250);
    }).catch(function (e) { R = null; throw new Error(e && e.name === 'NotAllowedError' ? 'اسمح للتطبيق باستعمال الميكروفون من إعدادات المتصفح' : (e && e.message) || 'تعذّر بدء التسجيل'); });
  }
  function stop(cancel) {
    if (!R) return Promise.resolve(null); var r = R; R = null; clearInterval(r.tm);
    return new Promise(function (res) {
      var done = function () { r.st.getTracks().forEach(function (t) { t.stop(); }); if (cancel) return res(null); var d = Math.min(MAXS, (Date.now() - r.t0) / 1000); if (d < 0.8 || !r.parts.length) return res(null); res({ blob: new Blob(r.parts, { type: r.m.split(';')[0] }), d: Math.round(d), m: r.m.split(';')[0] }); };
      if (r.mr.state === 'inactive') return done(); r.mr.onstop = done; try { r.mr.stop(); } catch (e) { done(); }
    });
  }
  function upload(rec, post) {                         // post(path, obj) → Promise(json) موقّع من التطبيق
    var key, iv = C.getRandomValues(new Uint8Array(12));
    return SB.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']).then(function (k) { key = k; return rec.blob.arrayBuffer(); })
      .then(function (buf) { return SB.encrypt({ name: 'AES-GCM', iv: iv }, key, buf); })
      .then(function (ct) {
        var s = b64u(ct), parts = []; for (var i = 0; i < s.length; i += CH) parts.push(s.slice(i, i + CH)); if (parts.length > 10) throw new Error('التسجيل أطول من المسموح');
        return post('/v1/vm/put', { i: 0, c: parts[0] }).then(function (j) { var k = j.k, ch = Promise.resolve(); parts.slice(1).forEach(function (p, i) { ch = ch.then(function () { return post('/v1/vm/put', { k: k, i: i + 1, c: p }); }); }); return ch.then(function () { return { k: k, n: parts.length }; }); });
      }).then(function (o) { return SB.exportKey('raw', key).then(function (raw) { var meta = { k: o.k, n: o.n, a: b64u(raw), iv: b64u(iv), d: rec.d, m: rec.m, x: Date.now() + TTL }; urls[o.k] = URL.createObjectURL(rec.blob); return meta; }); });
  }
  function clean(v) {                                  // تنقية بيانات الرسالة الصوتية الواردة
    if (!v || typeof v !== 'object' || !/^[A-Za-z0-9_-]{24}$/.test(String(v.k)) || !/^[A-Za-z0-9_-]{43}$/.test(String(v.a)) || !/^[A-Za-z0-9_-]{16}$/.test(String(v.iv))) return null;
    var m = /^audio\/[a-z0-9.+-]{1,20}$/.test(String(v.m)) ? v.m : 'audio/webm';
    return { k: v.k, n: Math.max(1, Math.min(10, v.n | 0)), a: v.a, iv: v.iv, d: Math.max(1, Math.min(MAXS, v.d | 0)), m: m, x: +v.x || Date.now() + TTL };
  }
  function gone(v) { return !v || Date.now() > v.x; }
  function html(v) {
    if (!v) return ''; reg[v.k] = v;
    if (gone(v)) return '<span class="hxv off">🎤 رسالة صوتية انتهت صلاحيتها</span>';
    var left = Math.max(1, Math.ceil((v.x - Date.now()) / 86400000));
    return '<span class="hxv" data-hxvk="' + v.k + '"><button type="button" class="hxvp" data-hxv="' + v.k + '" aria-label="تشغيل الرسالة الصوتية">▶</button><span class="hxvb"><i></i></span><span class="hxvd">' + fmt(v.d) + '</span><small class="hxvx" title="تُحذف تلقائياً">⏳ ' + left + ' ي</small></span>';
  }
  function getUrl(v, post) {
    if (urls[v.k]) return Promise.resolve(urls[v.k]); var parts = [], ch = Promise.resolve();
    for (var i = 0; i < v.n; i++) (function (i) { ch = ch.then(function () { return post('/v1/vm/get', { k: v.k, i: i }).then(function (j) { parts[i] = j.c; }); }); })(i);
    return ch.then(function () { return SB.importKey('raw', unb64u(v.a), 'AES-GCM', false, ['decrypt']); })
      .then(function (key) { return SB.decrypt({ name: 'AES-GCM', iv: unb64u(v.iv) }, key, unb64u(parts.join(''))); })
      .then(function (pt) { urls[v.k] = URL.createObjectURL(new Blob([pt], { type: v.m })); return urls[v.k]; });
  }
  function ui(k) { return document.querySelectorAll('[data-hxvk="' + k + '"]'); }
  function paint(k, f, play) { [].forEach.call(ui(k), function (el) { var i = el.querySelector('.hxvb i'), b = el.querySelector('.hxvp'); if (i) i.style.width = Math.round(f * 100) + '%'; if (b) b.textContent = play ? '❚❚' : '▶'; }); }
  function toggle(k, post, onErr) {
    var v = reg[k]; if (!v) return; if (cur && cur.k === k) { if (cur.a.paused) { cur.a.play(); paint(k, cur.a.currentTime / (cur.a.duration || v.d), 1); } else { cur.a.pause(); paint(k, cur.a.currentTime / (cur.a.duration || v.d), 0); } return; }
    if (cur) { cur.a.pause(); paint(cur.k, 0, 0); cur = null; }
    if (gone(v)) { if (onErr) onErr(new Error('انتهت صلاحية الرسالة الصوتية')); return; }
    [].forEach.call(ui(k), function (el) { var b = el.querySelector('.hxvp'); if (b) b.textContent = '…'; });
    getUrl(v, post).then(function (u) {
      var a = new Audio(u); cur = { k: k, a: a }; a.ontimeupdate = function () { paint(k, a.currentTime / (isFinite(a.duration) && a.duration ? a.duration : v.d), !a.paused); };
      a.onended = function () { paint(k, 0, 0); if (cur && cur.k === k) cur = null; }; return a.play().then(function () { paint(k, 0, 1); });
    }).catch(function (e) { paint(k, 0, 0); if (e && (e.status === 404 || e.code === 'gone')) { v.x = 0; if (onErr) onErr(new Error('انتهت صلاحية الرسالة الصوتية')); } else if (onErr) onErr(e); });
  }
  root.HXV = { ok: ok, start: start, stop: stop, upload: upload, clean: clean, html: html, toggle: toggle, fmt: fmt, rec: function () { return !!R; }, MAXS: MAXS, label: function (d) { return '🎤 رسالة صوتية (' + fmt(d) + ')'; } };
})(typeof self !== 'undefined' ? self : this);
