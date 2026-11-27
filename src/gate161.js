// ================= 1.62 شاشة الدخول بتصميم صفحة الاستقبال (طلب المالك): لوحة صورة بجانب البطاقة، خلفية فاتحة، رسومات مطبخ خطية متحركة
// شكل فقط: نفس #gsp و#gcard ونفس الحقول والمعرّفات والمنطق في auth.js. يعمل مع الخلفية الافتراضية فقط؛ إن خصّص المدير خلفية أو فيديو يبقى تخصيصه كما هو.
(function () {
  var IMG = '/*G161IMG*/';
  var D = {
    knife: '<path d="M4 20L16 8l2 2L6 22z"/><path d="M16 8l3-3a1.4 1.4 0 0 1 2 2l-3 3"/><rect x="2" y="2" width="9" height="12" rx="2"/>',
    apple: '<path d="M12 7c-2-1.5-6-1-6.5 3.5C5 15 8 20 10 20c1 0 1.3-.6 2-.6s1 .6 2 .6c2 0 5-5 4.5-9.5C18 6 14 5.5 12 7z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
    mint: '<path d="M12 21V11"/><path d="M12 11c-5 0-7-3-7-7 4 0 7 2 7 7z"/><path d="M12 14c4 0 6-2.5 6-6-3.5 0-6 2-6 6z"/>',
    pom: '<circle cx="12" cy="13.5" r="7.5"/><path d="M9.5 6.5l1-3 1.5 2 1.5-2 1 3"/>',
    cup: '<path d="M6 8h12l-1.5 12h-9z"/><path d="M12 2.5c1 1.5 2 2.5 2 3.5a2 2 0 0 1-4 0c0-1 1-2 2-3.5z"/>',
    olive: '<path d="M3 20c5-3 9-8 18-16"/><ellipse cx="9" cy="12" rx="2" ry="3.2" transform="rotate(-35 9 12)"/><ellipse cx="15" cy="8" rx="1.8" ry="3" transform="rotate(50 15 8)"/>',
    x: '<path d="M8 8l8 8M16 8l-8 8"/>', o: '<circle cx="12" cy="12" r="5"/>'
  };
  var L = [['knife', 6, 8, 54, 'f'], ['o', 44, 6, 18, 'p'], ['apple', 58, 90, 44, 's'], ['mint', 4, 78, 48, 'f'], ['x', 52, 92, 18, 'p'], ['pom', 90, 82, 52, 's'], ['cup', 30, 88, 38, 'f'], ['olive', 70, 4, 50, 's']];
  var IC = {
    msg: '<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12l2.2 2.2 4.8-4.8"/>',
    spark: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  var svg = function (p, c, st) { return '<svg viewBox="0 0 24 24" class="' + (c || '') + '"' + (st ? ' style="' + st + '"' : '') + ' aria-hidden="true">' + p + '</svg>'; };
  var side = '<div class="g161s" aria-hidden="true"><div class="g161dz">' + L.map(function (d, i) { return svg(D[d[0]], 'g161-' + d[4], 'left:' + d[1] + '%;top:' + d[2] + '%;width:' + d[3] + 'px;height:' + d[3] + 'px;animation-delay:' + (-i * 1.6) + 's'); }).join('') + '</div>'
    + '<div class="g161txt"><span class="g161k"><i></i> نظام أخصائي التغذية</span><h2>تغذية علاجية <span>أقرب</span> لعميلك… كل يوم</h2><p>«زنها Pro» يبني الخطة، وتطبيق «زنها» يرافق عميلك في يومه حتى يصل.</p></div>'
    + '<div class="g161ph"><img src="' + IMG + '" alt=""><div class="g161f">' + svg(IC.msg) + '<span><b>رسالة من منى</b><small>التزمت بالخطة اليوم كلها ✓</small></span></div><div class="g161f g161f2">' + svg(IC.spark) + '<span><b>خطة جديدة جاهزة</b><small>بالحصص أو بالجرامات</small></span></div></div></div>';
  var css = ''
    + 'html:not(#mxz):not(#mxy) #gate.g161:not([style*="display: none"]):not([style*="display:none"]){display:grid!important}html:not(#mxz):not(#mxy) #gate.g161{background:#F5FAF9!important;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);align-items:stretch;justify-content:stretch;gap:0!important;padding:0!important;min-height:100vh;color:#16324A}'
    + 'html:not(#mxz):not(#mxy) body.gating:has(#gate.g161){background:#F5FAF9!important}'
    + '#gate.g161 .g161m{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:32px 24px;position:relative;z-index:1}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 #gsp,html:not(#mxz):not(#mxy) #gate.g161 #gsp :is(.hxlogo,svg,.hx-word,.hx-tag){color:#16324A!important}html:not(#mxz):not(#mxy) #gate.g161 #gsp .gvid{max-height:120px;width:auto;max-width:300px}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard{width:100%;background:#fff!important;color:#16324A!important;border:1px solid rgba(22,50,74,.10)!important;border-radius:26px!important;box-shadow:0 24px 60px rgba(22,50,74,.12)!important;padding:28px 30px!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard :is(h1,h2,h3,b,strong,label){color:#16324A!important;letter-spacing:normal!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard :is(h1,h2,h3){font-family:"Zenha Head","Hissa Plex","IBM Plex Sans Arabic",sans-serif!important;font-weight:800!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard :is(p,small,.small,span){color:#4A5E70}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard :is(input:not([type=checkbox]):not([type=radio]),select,textarea){background:#F7FBFA!important;color:#16324A!important;border:1.5px solid rgba(22,50,74,.14)!important;border-radius:14px!important;min-height:50px;box-shadow:none!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard :is(input,select,textarea):focus{border-color:#12A88E!important;box-shadow:0 0 0 4px rgba(79,227,164,.22)!important;outline:none}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard button:not(.link):not(.sec):not(.o){background:linear-gradient(135deg,#12A88E,#0E7F72)!important;color:#fff!important;border:0!important;border-radius:999px!important;min-height:52px;font-weight:700!important;box-shadow:0 10px 24px rgba(14,127,114,.28)!important;transition:transform .2s,box-shadow .2s}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard button:not(.link):not(.sec):not(.o):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(14,127,114,.34)!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard :is(button.sec,button.o){background:#fff!important;color:#0E7F72!important;border:1.5px solid rgba(14,127,114,.35)!important;border-radius:999px!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard a,html:not(#mxz):not(#mxy) #gate.g161 .gcard button.link{color:#0E7F72!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard .rembox{background:#F5FAF9!important;border:1px solid rgba(22,50,74,.08)!important;border-radius:16px!important}'
    + 'html:not(#mxz):not(#mxy) #gate.g161 .gcard input[type=checkbox]{accent-color:#12A88E}'
    + '#gate.g161 .g161s{position:relative;overflow:hidden;background:linear-gradient(160deg,#E4F7F0 0,#EEF9F5 55%,#F5FAF9 100%);display:flex;flex-direction:column;justify-content:center;gap:26px;padding:48px 48px 40px;border-inline-end:1px solid rgba(22,50,74,.06)}'
    + '#gate.g161 .g161dz{position:absolute;inset:0;pointer-events:none}'
    + '#gate.g161 .g161dz svg{position:absolute;color:rgba(18,168,142,.30);fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}'
    + '#gate.g161 .g161dz svg *{stroke-dasharray:220;stroke-dashoffset:220;animation:g161d 2.4s ease forwards}'
    + '@keyframes g161d{to{stroke-dashoffset:0}}'
    + '.g161-f{animation:g161f 9s ease-in-out infinite}.g161-s{animation:g161s 7s ease-in-out infinite;transform-origin:50% 90%}.g161-p{animation:g161p 5s ease-in-out infinite}'
    + '@keyframes g161f{0%,100%{translate:0 0}50%{translate:0 -14px}}@keyframes g161s{0%,100%{rotate:-7deg}50%{rotate:7deg}}@keyframes g161p{0%,100%{opacity:.5}50%{opacity:1}}'
    + '#gate.g161 .g161txt{position:relative;max-width:520px}'
    + '#gate.g161 .g161k{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:#0E7F72;background:rgba(79,227,164,.18);padding:6px 14px;border-radius:999px}'
    + '#gate.g161 .g161k i{width:8px;height:8px;border-radius:50%;background:#4FE3A4;box-shadow:0 0 10px #4FE3A4}'
    + '#gate.g161 .g161txt h2{font-family:"Zenha Head","Hissa Plex",sans-serif;font-weight:800;font-size:clamp(28px,3vw,42px);line-height:1.3;letter-spacing:normal;color:#16324A;margin:14px 0 10px}'
    + '#gate.g161 .g161txt h2 span{background:linear-gradient(transparent 12%,rgba(79,227,164,.34) 12%,rgba(79,227,164,.34) 92%,transparent 92%);border-radius:6px;padding-inline:.1em}'
    + '#gate.g161 .g161txt p{color:#4A5E70;font-size:16.5px;line-height:1.8}'
    + '#gate.g161 .g161ph{position:relative;max-width:620px}'
    + '#gate.g161 .g161ph img{display:block;width:100%;border-radius:28px;box-shadow:0 24px 60px rgba(22,50,74,.16)}'
    + '#gate.g161 .g161f{position:absolute;top:8%;inset-inline-start:-14px;display:flex;align-items:center;gap:10px;background:#fff;border-radius:18px;padding:10px 14px;box-shadow:0 10px 26px rgba(22,50,74,.14);font-size:13px;line-height:1.45;animation:g161b 6s ease-in-out infinite}'
    + '#gate.g161 .g161f2{top:auto;bottom:8%;inset-inline-start:auto;inset-inline-end:-14px;animation-delay:-3s}'
    + '#gate.g161 .g161f svg{flex:none;width:38px;height:38px;padding:9px;border-radius:12px;background:rgba(79,227,164,.18);color:#0E7F72;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    + '#gate.g161 .g161f b{display:block;font-size:14px;color:#16324A}#gate.g161 .g161f small{color:#7B8C9B}'
    + '@keyframes g161b{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}'
    + '#gate.g161 .g161sec{display:flex;align-items:center;gap:6px;color:#7B8C9B;font-size:13px}#gate.g161 .g161sec svg{width:15px;height:15px;fill:none;stroke:#12A88E;stroke-width:2}'
    + '#gate .gbtn{display:flex;justify-content:center;min-height:46px;margin:14px 0 6px}#gate .gbtn.wait{opacity:.5;pointer-events:none}#gate .gor{display:flex;align-items:center;gap:12px;margin:12px 0;color:#7B8C9B;font-size:13px}#gate .gor::before,#gate .gor::after{content:"";flex:1;height:1px;background:rgba(22,50,74,.12)}'
    + '@media (max-width:900px){html:not(#mxz):not(#mxy) #gate.g161{grid-template-columns:1fr}#gate.g161 .g161s{display:none}#gate.g161 .g161m{min-height:100vh;background:radial-gradient(600px 400px at 100% 0,rgba(79,227,164,.22),transparent 65%),#F5FAF9}}'
    + '@media (prefers-reduced-motion:reduce){#gate.g161 *{animation:none!important;transition:none!important}#gate.g161 .g161dz svg *{stroke-dashoffset:0}}';
  var st = document.createElement('style'); st.id = 'g161css'; st.textContent = css; (document.head || document.documentElement).appendChild(st);
  // يُستدعى من gate() بعد رسم الشاشة: يلبس الشاشة التصميم الجديد دون تغيير محتوى البطاقة
  window.G161 = function (g, cfg) {
    var on = cfg && cfg.bgType === 'default' && cfg.splash !== 'custom'; g.classList.toggle('g161', !!on); if (!on) return;
    g.style.background = '';
    if (!g.querySelector('.g161m')) {
      var m = document.createElement('div'); m.className = 'g161m'; var sp = g.querySelector('#gsp'), cd = g.querySelector('#gcard');
      if (sp) m.appendChild(sp); if (cd) m.appendChild(cd);
      m.insertAdjacentHTML('beforeend', '<div class="g161sec">' + svg(IC.lock) + ' دخول آمن، وبيانات عملائك مشفّرة على جهازك</div>');
      g.insertAdjacentHTML('afterbegin', side); g.appendChild(m);
    }
  };
})();
