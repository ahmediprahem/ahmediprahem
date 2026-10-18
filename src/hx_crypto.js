// ================= تشفير «حصة ↔ حصتي» (مشترك: «حصة» في المتصفح، «حصتي» في المتصفح، المحطة الوسيطة، والاختبارات في Node)
// كل طرف (أخصائي أو عميل) يملك مفتاحين P-256: ECDSA للتوقيع (يثبت هويته للمحطة) وECDH للتشفير (لا يفتح رسائله غيره).
// الرسائل مشفّرة من طرف إلى طرف: ECDH بمفتاح مؤقت + HKDF-SHA256 + AES-GCM-256. المحطة ترى بيانات مشفّرة فقط.
// الطلبات موقَّعة: Authorization: Hissa id=<المعرّف>,ts=<ثوانٍ>,sig=<توقيع base64url> على «الطريقة\nالمسار\nالوقت\nSHA-256(الجسم)».
(function (root, factory) { var api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.HXC = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var C = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto : (typeof require === 'function' ? require('crypto').webcrypto : null);
  var S = C.subtle, enc = new TextEncoder(), dec = new TextDecoder();
  var b64u = function (buf) { var b = new Uint8Array(buf), s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  var unb64u = function (s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  var rand = function (n) { return C.getRandomValues(new Uint8Array(n)); };
  var sha256 = function (data) { return S.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data); };
  var hex = function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };
  var EC = { name: 'ECDSA', namedCurve: 'P-256' }, DH = { name: 'ECDH', namedCurve: 'P-256' }, SIG = { name: 'ECDSA', hash: 'SHA-256' };
  var pubOnly = function (j) { return { kty: j.kty, crv: j.crv, x: j.x, y: j.y }; };

  // معرّف ثابت قصير من مفتاح التوقيع العام (22 حرفاً = 128 بت)
  function idOf(sigPubJwk) { var j = pubOnly(sigPubJwk); return sha256(j.crv + '.' + j.x + '.' + j.y).then(function (h) { return b64u(h).slice(0, 22); }); }
  // بصمة مفتاح التشفير (توضع في رابط الدعوة فلا تستطيع المحطة استبدال مفتاح الأخصائي)
  function fpOf(encPubJwk) { var j = pubOnly(encPubJwk); return sha256('enc.' + j.x + '.' + j.y).then(function (h) { return b64u(h).slice(0, 11); }); }
  function genIdentity() {
    return Promise.all([S.generateKey(EC, true, ['sign', 'verify']), S.generateKey(DH, true, ['deriveBits'])]).then(function (k) {
      return Promise.all([S.exportKey('jwk', k[0].privateKey), S.exportKey('jwk', k[1].privateKey)]);
    }).then(function (j) { var id = { sig: j[0], enc: j[1] }; return idOf(j[0]).then(function (i) { id.id = i; id.sigPub = pubOnly(j[0]); id.encPub = pubOnly(j[1]); return id; }); });
  }
  function signReq(ident, method, path, body, ts) {
    ts = ts || Math.floor(Date.now() / 1000);
    return Promise.all([S.importKey('jwk', ident.sig, EC, false, ['sign']), sha256(body || '')]).then(function (r) {
      return S.sign(SIG, r[0], enc.encode(method.toUpperCase() + '\n' + path + '\n' + ts + '\n' + hex(r[1])));
    }).then(function (sig) { return 'Hissa id=' + ident.id + ',ts=' + ts + ',sig=' + b64u(sig); });
  }
  function parseAuth(h) { var m = /^Hissa id=([A-Za-z0-9_-]{22}),ts=(\d{9,11}),sig=([A-Za-z0-9_-]{40,120})$/.exec(String(h || '').trim()); return m ? { id: m[1], ts: +m[2], sig: m[3] } : null; }
  function verifyReq(sigPubJwk, auth, method, path, body) {
    return Promise.all([S.importKey('jwk', pubOnly(sigPubJwk), EC, false, ['verify']), sha256(body || '')]).then(function (r) {
      return S.verify(SIG, r[0], unb64u(auth.sig), enc.encode(method.toUpperCase() + '\n' + path + '\n' + auth.ts + '\n' + hex(r[1])));
    }).catch(function () { return false; });
  }
  // تشفير لمستلم بمفتاح ECDH العام: { v, e: مفتاح مؤقت، s: ملح، iv، c: النص المشفّر }
  function seal(encPubJwk, obj) {
    var eph, salt = rand(16), iv = rand(12);
    return S.generateKey(DH, true, ['deriveBits']).then(function (k) { eph = k; return S.importKey('jwk', pubOnly(encPubJwk), DH, false, []); })
      .then(function (pub) { return S.deriveBits({ name: 'ECDH', public: pub }, eph.privateKey, 256); })
      .then(function (bits) { return aesKey(bits, salt); })
      .then(function (key) { return Promise.all([S.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(JSON.stringify(obj))), S.exportKey('jwk', eph.publicKey)]); })
      .then(function (r) { return { v: 1, e: { x: r[1].x, y: r[1].y }, s: b64u(salt), iv: b64u(iv), c: b64u(r[0]) }; });
  }
  function open(ident, box) {
    return S.importKey('jwk', ident.enc, DH, false, ['deriveBits'])
      .then(function (priv) { return S.importKey('jwk', { kty: 'EC', crv: 'P-256', x: box.e.x, y: box.e.y }, DH, false, []).then(function (pub) { return S.deriveBits({ name: 'ECDH', public: pub }, priv, 256); }); })
      .then(function (bits) { return aesKey(bits, unb64u(box.s)); })
      .then(function (key) { return S.decrypt({ name: 'AES-GCM', iv: unb64u(box.iv) }, key, unb64u(box.c)); })
      .then(function (pt) { return JSON.parse(dec.decode(pt)); });
  }
  function aesKey(bits, salt) { return S.importKey('raw', bits, 'HKDF', false, ['deriveKey']).then(function (k) { return S.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: salt, info: enc.encode('hissa-hissati-v1') }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }); }
  // حفظ الهوية على جهاز العميل مقفلة برمز الدخول (PBKDF2 + AES-GCM)
  function wrap(pin, obj) { var salt = rand(16), iv = rand(12); return pinKey(pin, salt).then(function (k) { return S.encrypt({ name: 'AES-GCM', iv: iv }, k, enc.encode(JSON.stringify(obj))); }).then(function (c) { return { s: b64u(salt), iv: b64u(iv), c: b64u(c) }; }); }
  function unwrap(pin, w) { return pinKey(pin, unb64u(w.s)).then(function (k) { return S.decrypt({ name: 'AES-GCM', iv: unb64u(w.iv) }, k, unb64u(w.c)); }).then(function (pt) { return JSON.parse(dec.decode(pt)); }); }
  function pinKey(pin, salt) { return S.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveKey']).then(function (k) { return S.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: 200000 }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }); }
  function token() { return b64u(rand(18)); }                  // رمز الدعوة (144 بت)
  function tokenHash(t) { return sha256('inv.' + t).then(function (h) { return b64u(h).slice(0, 32); }); }
  return { b64u: b64u, unb64u: unb64u, sha256: sha256, hex: hex, idOf: idOf, fpOf: fpOf, genIdentity: genIdentity, signReq: signReq, parseAuth: parseAuth, verifyReq: verifyReq, seal: seal, open: open, wrap: wrap, unwrap: unwrap, token: token, tokenHash: tokenHash, pubOnly: pubOnly };
});
