/* طبقة الأمان بلا خادم: توقيع أكواد التفعيل (ECDSA P-256) + اشتقاق مفاتيح من كلمة السر (PBKDF2) + تشفير AES-GCM. WebCrypto فقط. */
(function (root) {
  'use strict';
  var C = root.crypto, subtle = C.subtle, enc = new TextEncoder(), dec = new TextDecoder(), H = { ITER: 150000 };
  H.b64 = function (u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
  H.ub64 = function (s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  H.b64u = function (u8) { return H.b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  H.ub64u = function (s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return H.ub64(s); };
  H.rand = function (n) { return C.getRandomValues(new Uint8Array(n)); };
  H.newDeviceId = function () { return H.b64u(H.rand(12)); };
  H.pbkdf2 = async function (pw, salt, iter) { var k = await subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']); return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, 256)); };
  H.aesKey = function (raw) { return subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); };
  H.dataKey = async function (pw, saltD, iter) { return H.aesKey(await H.pbkdf2(pw, H.ub64(saltD), iter)); };
  H.encJSON = async function (key, obj) { var iv = H.rand(12), ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(JSON.stringify(obj)))); return { iv: H.b64(iv), ct: H.b64(ct) }; };
  H.decJSON = async function (key, r) { return JSON.parse(dec.decode(await subtle.decrypt({ name: 'AES-GCM', iv: H.ub64(r.iv) }, key, H.ub64(r.ct)))); };
  H.genKeys = async function () { var k = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); return { pub: await subtle.exportKey('jwk', k.publicKey), priv: await subtle.exportKey('jwk', k.privateKey) }; };
  H.wrapPriv = async function (priv, pw) { var salt = H.rand(16), key = await H.aesKey(await H.pbkdf2(pw, salt, H.ITER)), e = await H.encJSON(key, priv); return { salt: H.b64(salt), iter: H.ITER, iv: e.iv, ct: e.ct }; };
  H.unwrapPriv = async function (w, pw) { var key = await H.aesKey(await H.pbkdf2(pw, H.ub64(w.salt), w.iter)); return H.decJSON(key, w); };
  H.sign = async function (priv, payload) { var k = await subtle.importKey('jwk', priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']), p = H.b64u(enc.encode(JSON.stringify(payload))), s = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, enc.encode(p))); return p + '.' + H.b64u(s); };
  H.verify = async function (pub, token) {
    var parts = String(token || '').replace(/\s+/g, '').split('.'); if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('تنسيق الكود غير صحيح');
    var k = await subtle.importKey('jwk', pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']), ok = false;
    try { ok = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, H.ub64u(parts[1]), enc.encode(parts[0])); } catch (e) { ok = false; }
    if (!ok) throw new Error('الكود غير صالح (توقيع خاطئ أو معدَّل)'); return JSON.parse(dec.decode(H.ub64u(parts[0])));
  };
  H.makeVerifier = async function (pw) { var sv = H.rand(16), sd = H.rand(16); return { sv: H.b64(sv), sd: H.b64(sd), it: H.ITER, vf: H.b64(await H.pbkdf2(pw, sv, H.ITER)) }; };
  H.checkPw = async function (pw, p) { var a = await H.pbkdf2(pw, H.ub64(p.sv), p.it), b = H.ub64(p.vf); if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
  H.issue = async function (priv, u, deviceId, days) {   // u: سجل المستخدم عند المدير {username,name,sv,sd,it,vf}
    var now = Math.floor(Date.now() / 1000), p = { v: 1, u: u.username, n: u.name || u.username, sv: u.sv, sd: u.sd, it: u.it, vf: u.vf, dev: deviceId, iat: now, jti: H.b64u(H.rand(8)) }; if (days) p.exp = now + Math.round(days * 86400); return H.sign(priv, p);
  };
  H.validate = function (p, ctx) {
    if (!p || p.v !== 1 || !p.u) return { ok: false, reason: 'bad' }; if (p.dev !== ctx.deviceId) return { ok: false, reason: 'device' };
    if (p.exp && ctx.now > p.exp * 1000) return { ok: false, reason: 'expired' }; if (ctx.maxSeen && ctx.now < ctx.maxSeen - 86400000) return { ok: false, reason: 'clock' }; return { ok: true };
  };
  H.REASONS = { bad: 'الكود غير صالح', device: 'هذا الكود مخصّص لجهاز آخر', expired: 'انتهت صلاحية التفعيل — أرسل رمز الجهاز للمدير للتجديد', clock: 'ساعة الجهاز غير صحيحة (رجعت للخلف) — صحّح التاريخ والوقت' };
  if (typeof module !== 'undefined' && module.exports) module.exports = H; else root.HSec = H;
})(typeof window !== 'undefined' ? window : globalThis);
