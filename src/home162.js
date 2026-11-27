// ================= 1.63 صفحة «اليوم» بنظام زنها البصري: تزيين بعد الرسم فقط (رسومات خطية، كلمة مميزة، أيقونات الشارات)، بلا تغيير في البيانات أو الأزرار
// يعمل افتراضياً؛ المظهر السابق: localStorage zn_classic='1'
(function () {
  var R = document.documentElement; try { if (localStorage.getItem('zn_classic') !== '1') R.classList.add('zt162'); } catch (e) { R.classList.add('zt162'); }
  var D = { knife: '<path d="M4 20L16 8l2 2L6 22z"/><path d="M16 8l3-3a1.4 1.4 0 0 1 2 2l-3 3"/><rect x="2" y="2" width="9" height="12" rx="2"/>', apple: '<path d="M12 7c-2-1.5-6-1-6.5 3.5C5 15 8 20 10 20c1 0 1.3-.6 2-.6s1 .6 2 .6c2 0 5-5 4.5-9.5C18 6 14 5.5 12 7z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
    mint: '<path d="M12 21V11"/><path d="M12 11c-5 0-7-3-7-7 4 0 7 2 7 7z"/><path d="M12 14c4 0 6-2.5 6-6-3.5 0-6 2-6 6z"/>', pom: '<circle cx="12" cy="13.5" r="7.5"/><path d="M9.5 6.5l1-3 1.5 2 1.5-2 1 3"/>',
    cup: '<path d="M6 8h12l-1.5 12h-9z"/><path d="M12 2.5c1 1.5 2 2.5 2 3.5a2 2 0 0 1-4 0c0-1 1-2 2-3.5z"/>', olive: '<path d="M3 20c5-3 9-8 18-16"/><ellipse cx="9" cy="12" rx="2" ry="3.2" transform="rotate(-35 9 12)"/><ellipse cx="15" cy="8" rx="1.8" ry="3" transform="rotate(50 15 8)"/>',
    x: '<path d="M8 8l8 8M16 8l-8 8"/>', o: '<circle cx="12" cy="12" r="5"/>' };
  var dz = function (list) { return '<div class="z162dz" aria-hidden="true">' + list.map(function (d, i) { return '<svg viewBox="0 0 24 24" class="z162-' + d[4] + '" style="left:' + d[1] + '%;top:' + d[2] + '%;width:' + d[3] + 'px;height:' + d[3] + 'px;animation-delay:' + (-i * 1.5) + 's">' + D[d[0]] + '</svg>'; }).join('') + '</div>'; };
  var W = [['knife', 4, 18, 46, 's'], ['o', 30, 12, 16, 'p'], ['apple', 14, 58, 36, 'f'], ['x', 46, 70, 16, 'p'], ['olive', 60, 8, 44, 's']], P = [['mint', 6, 60, 46, 'f'], ['pom', 3, 8, 40, 's'], ['x', 30, 80, 14, 'p'], ['cup', 22, 20, 30, 'f']];
  var IC = { users: ['#12A88E', '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-3.5-5.5"/>'], cal: ['#4FA3E8', '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'],
    plan: ['#AD7CFF', '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 13l2.5 2.5 4.5-5"/>'], inbox: ['#FF8A65', '<path d="M4 13l2.5-7h11L20 13v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/>'], rep: ['#F2A541', '<path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2"/><path d="M20 4v4h-4M4 20v-4h4"/>'] };
  function icFor(b) { var a = b.getAttribute('data-a'), t = b.textContent; if (/الخطط/.test(t)) return IC.plan; if (a === 'appts') return IC.cal; if (a === 'hxv') return IC.inbox; if (a === 'tdFollow') return IC.rep; return IC.users; }
  var last = 0;
  function enhance(h) {
    h.setAttribute('data-z162', '1'); if (!R.classList.contains('zt162')) return;
    if (Date.now() - last > 4000) { h.classList.add('z162in'); setTimeout(function () { h.classList.remove('z162in'); }, 900); } last = Date.now();
    var w = h.querySelector('.zhw'); if (w && !w.querySelector('.z162dz')) { w.insertAdjacentHTML('afterbegin', dz(W)); var t = w.querySelector('h2'); if (t && !t.querySelector('.z162hl')) { var m = /^(.*?،\s*)(.+)$/.exec(t.textContent); if (m) { t.textContent = m[1]; var s = document.createElement('span'); s.className = 'z162hl'; s.textContent = m[2]; t.appendChild(s); } } }
    var ins = h.querySelector('.zhins'); if (ins && !ins.querySelector('.z162dz')) ins.insertAdjacentHTML('afterbegin', dz(P));
    [].forEach.call(h.querySelectorAll('.zhchips .zhs'), function (b) { if (b.querySelector('.z162ic')) return; var k = b.querySelector('.zhk') || b, c = icFor(b); k.insertAdjacentHTML('afterbegin', '<span class="z162ic" aria-hidden="true" style="background:' + c[0] + '"><svg viewBox="0 0 24 24">' + c[1] + '</svg></span>'); });
  }
  function scan() { var h = document.querySelector('.home.zh:not([data-z162])'); if (h) enhance(h); }
  if (window.MutationObserver) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  window.ZN_home162 = { scan: scan, classic: function (on) { try { localStorage.setItem('zn_classic', on ? '1' : '0'); } catch (e) { } R.classList.toggle('zt162', !on); } };
})();
