// ================= 1.64 «حماية البيانات» (المرحلة 0 من خطة زنها السحابي): نسخ احتياطي تلقائي مشفّر بلمسة واحدة + «كود الاسترداد»
// يستعمل خزنة 1.x نفسها (vault_ui.js) بلا أي تغيير في المحطة: معرّف النسخة = بريد الحساب (أو اسم المستخدم)، وكلمة سر النسخ = كود عشوائي يُعرض مرة واحدة.
// بطاقة لا تُتجاهل في «اليوم» ما دام عند الأخصائي عملاء بلا حماية، والكود يُحفظ نسخاً/تنزيلاً/طباعةً قبل الإغلاق.
var ZP = { busy: false };
function zpId() { var m = /^hissa_u_(.+)$/.exec(CFG.dbName || ''), u = m ? m[1] : (S.mode === 'admin' ? 'admin' : ''); var e = /^em_(.+?)(_r\d+)?$/.exec(u); return e ? e[1] : u; }      // بريد الحساب يبقى ثابتاً حتى بعد «نسيت كلمة السر»
function zpCode() { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.getRandomValues(new Uint8Array(20)), s = ''; for (var i = 0; i < 20; i++) { s += A[b[i] % 32]; if (i % 5 === 4 && i < 19) s += '-'; } return s; }      // 100 بت: XXXXX-XXXXX-XXXXX-XXXXX
function zpNeed() { return !!(VT.st && !VT.st.on && S.clients && S.clients.length && hxOn() && S.view !== 'settings'); }
function zpCard() {
  return '<section class="zp164" role="alert" aria-labelledby="zp164h"><div class="zpi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path class="zpck" d="M8.5 12.2l2.4 2.4 4.6-4.8"/></svg></div>'
    + '<div class="zpt"><h3 id="zp164h">احمِ بيانات عملائك الآن</h3><p>بيانات <b>' + S.clients.length + '</b> عميل محفوظة على هذا الجهاز فقط. إن نسيت كلمة السر أو مُسح المتصفح ضاعت. فعّل الحماية لتُحفظ نسخة مشفّرة تلقائياً بعد كل تعديل، وتسترجعها من أي جهاز بكود استرداد.</p></div>'
    + '<div class="zpb"><button data-a="zpOn"' + (ZP.busy ? ' disabled' : '') + '>' + (ZP.busy ? 'جارٍ التفعيل…' : 'فعّل الحماية الآن') + '</button></div></section>';
}
function zpShowCode(id, code) {
  var d = document.createElement('div'); d.className = 'zp164m'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'zpmh');
  d.innerHTML = '<div class="zpcard"><div class="zpi ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path class="zpck" d="M8.5 12.2l2.4 2.4 4.6-4.8"/></svg></div>'
    + '<h3 id="zpmh">فُعّلت الحماية ✓</h3><p>احفظ هذين في مكان آمن خارج هذا الجهاز (ورقة مطبوعة، أو مدير كلمات المرور). تحتاجهما لاسترجاع عملائك إن نسيت كلمة السر أو غيّرت الجهاز. <b>لن يظهر الكود مرة أخرى.</b></p>'
    + '<div class="zpkv"><small>معرّف النسخة</small><b dir="ltr">' + esc(id) + '</b></div><div class="zpkv code"><small>كود الاسترداد</small><b dir="ltr" id="zpcode">' + esc(code) + '</b></div>'
    + '<div class="zpact"><button class="sec" id="zpCopy">نسخ</button><button class="sec" id="zpDl">تنزيل ملف</button><button class="sec" id="zpPr">طباعة</button></div>'
    + '<label class="zpchk"><input type="checkbox" id="zpOk"> حفظت معرّف النسخة وكود الاسترداد في مكان آمن</label><button id="zpDone" disabled>تم</button></div>';
  document.body.appendChild(d);
  var txt = 'زنها Pro — بيانات استرجاع العملاء\nمعرّف النسخة: ' + id + '\nكود الاسترداد: ' + code + '\nالاسترجاع: الإعدادات ← النسخ والمزامنة ← استرجاع (أو «استرجاع عملائي» في جهاز جديد)\nاحفظه خارج هذا الجهاز ولا تشاركه.\n';
  d.querySelector('#zpCopy').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('✓ نُسخ'); }, function () { toast('انسخ الكود يدوياً'); }); };
  d.querySelector('#zpDl').onclick = function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = 'zenha-recovery.txt'; document.body.appendChild(a); a.click(); a.remove(); };
  d.querySelector('#zpPr').onclick = function () { var w = window.open('', '_blank'); if (!w) return toast('اسمح بالنوافذ المنبثقة للطباعة'); w.document.write('<html dir="rtl"><body style="font:18px system-ui;padding:40px;line-height:2"><pre style="font:inherit;white-space:pre-wrap">' + esc(txt) + '</pre><script>print()<\/script></body></html>'); w.document.close(); };
  var ok = d.querySelector('#zpOk'), dn = d.querySelector('#zpDone'); ok.onchange = function () { dn.disabled = !ok.checked; }; dn.onclick = function () { d.remove(); main(); };
  setTimeout(function () { ok.focus(); }, 50);
}
A.zpOn = function () {
  if (ZP.busy) return; var id = zpId(), code = zpCode(); if (!id) { toast('تعذّر تحديد معرّف الحساب'); return; }
  ZP.busy = true; main(); toast('جارٍ تجهيز الحماية المشفّرة…');
  vtDerive(id, code).then(function (k) {
    VT.st = Object.assign(VT.st || {}, { key: VKEY, on: 1, id: id, dev: VT.st && VT.st.dev || 'جهاز', vid: k.vid, auth: k.auth, enc: k.enc, sync: 1, tomb: (VT.st && VT.st.tomb) || [], seenVer: 0, syncAt: 0, zp: 1 });
    return vtSave().then(function () { return vtBackup('zp'); });
  }).then(function (ok) {
    ZP.busy = false; vtTimer(); vtRail(); main();
    if (ok) zpShowCode(id, code); else { toast('تعذّر رفع أول نسخة: ' + (VT.st.err || 'حاول مرة أخرى')); VT.st.on = 0; vtSave(); main(); }
  }).catch(function (e) { ZP.busy = false; if (VT.st) { VT.st.on = 0; vtSave(); } main(); toast('تعذّر التفعيل: ' + e.message); });
};
// تظهر البطاقة أعلى «اليوم» ما دامت الحماية غير مفعّلة (تُرسم بعد الصفحة؛ لا تغيّر محتواها)
(function () {
  var put = function () { var h = document.querySelector('.home'); if (!h) return; var c = h.querySelector('.zp164'); if (!zpNeed()) { if (c) c.remove(); return; } if (!c) { h.insertAdjacentHTML('afterbegin', zpCard()); } };
  if (window.MutationObserver) new MutationObserver(function () { if (document.querySelector('.home') && !document.querySelector('.home .zp164') && zpNeed()) put(); }).observe(document.documentElement, { childList: true, subtree: true });
  window.ZN_protect = { put: put, need: zpNeed, id: zpId };
})();
