// ================= الملصقات (1.12) — مشتركة بين «زنها» و«زنها Pro» (تُلحق بـ hx_crypto.js عند البناء)
// حزمة الملصقات الجاهزة تُحمَّل من المحطة عند الحاجة (/v1/st) فلا تثقل التطبيق، وملصقات المستخدم («ملصقاتي») يصنعها من صورة مثل واتساب
// وتسافر صورتها داخل الرسالة المشفّرة طرفاً لطرف.
(function (root) {
  var st = null, wait = null;
  function load(base, onDone) {                            // تحميل الحزمة مرة واحدة (والمتصفح يخزّنها)
    if (st) return Promise.resolve(st); if (wait) return wait;
    wait = fetch(base + '/v1/st').then(function (r) { if (!r.ok) throw new Error('st'); return r.json(); }).then(function (j) { st = j.st || {}; root.HXST = st; if (onDone) onDone(); return st; })
      .catch(function () { wait = null; return {}; });
    return wait;
  }
  function okImg(s) { return typeof s === 'string' && s.length < 160000 && /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(s); }
  function make(file, text) {                              // صورة ← ملصق 220×220: قص مربع وحافة بيضاء مستديرة، ونص اختياري بفقاعة
    return new Promise(function (res, rej) {
      if (!file || !/^image\//.test(file.type)) return rej(new Error('اختر صورة'));
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var N = 220, c = document.createElement('canvas'); c.width = c.height = N; var x = c.getContext('2d'), s = Math.min(im.width, im.height), sx = (im.width - s) / 2, sy = (im.height - s) / 2, R = 30, P = 8;
        var rr = function (a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
        x.save(); x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 6; rr(3, 3, N - 6, N - 6, R); x.fillStyle = '#fff'; x.fill(); x.restore();
        x.save(); rr(P, P, N - 2 * P, N - 2 * P, R - 6); x.clip(); x.drawImage(im, sx, sy, s, s, P, P, N - 2 * P, N - 2 * P); x.restore();
        text = String(text || '').trim().slice(0, 40);
        if (text) {
          var fs = 26; x.direction = 'rtl'; do { x.font = '700 ' + fs + 'px "IBM Plex Sans Arabic","Hissa Plex",Tahoma,sans-serif'; fs -= 2; } while (x.measureText(text).width > N - 40 && fs > 12);
          var w = x.measureText(text).width + 28, h = fs + 20, bx = (N - w) / 2, by = 10; x.fillStyle = '#fff'; rr(bx - 4, by - 4, w + 8, h + 8, h / 2 + 4); x.fill(); x.fillStyle = '#fff3d6'; rr(bx, by, w, h, h / 2); x.fill();
          x.fillStyle = '#1d2a5b'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, N / 2, by + h / 2 + 1);
        }
        URL.revokeObjectURL(u); var d = c.toDataURL('image/webp', .72); if (d.indexOf('data:image/webp') !== 0 || d.length > 150000) d = c.toDataURL('image/png'); if (d.length > 150000) d = c.toDataURL('image/jpeg', .8);
        res(d);
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('تعذّر فتح الصورة')); }; im.src = u;
    });
  }
  function pick(cb) { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.style.display = 'none'; document.body.appendChild(i); i.onchange = function () { var f = i.files && i.files[0]; i.remove(); if (f) cb(f); }; i.click(); }
  root.HXSK = { load: load, okImg: okImg, make: make, pick: pick, has: function () { return !!st; } };
})(typeof self !== 'undefined' ? self : this);
