// ===== 1.40 مؤشر زنها «Z-Click» (قرار المالك بالصورة): ١ سهم Mint في السكون ← ٢ تموّج عند الضغط ← ٣ انبثاق Z مع نقاط ← ٤ تلاشٍ
// السهم مؤشر CSS أصلي (يرسمه النظام فلا تأخير أبداً)، والتأثيرات عناصر عابرة pointer-events:none تُحذف بعد انتهائها. للفأرة فقط.
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement, NATIVE = 'input,textarea,select,option,[contenteditable="true"]';
  root.classList.add('zk-on');
  function mk(x, y, h, ms) { var w = document.createElement('div'); w.className = 'zk-fx' + (RM ? ' rm' : ''); w.style.left = x + 'px'; w.style.top = y + 'px'; w.innerHTML = h; document.body.appendChild(w); setTimeout(function () { w.remove(); }, ms); }
  function press(x, y) { mk(x, y, '<i class="zk-rip"></i><i class="zk-rip r2"></i>', RM ? 380 : 520); }      // ٢ لحظة الضغط: تموّج عند رأس السهم
  function pop(x, y) {      // ٣ انبثاق Z مع نقاط ← ٤ تلاشٍ (يُلغى مع «تقليل الحركة»)
    if (RM) return; var h = '<svg class="zk-z" viewBox="0 0 24 24"><path d="M5 5h14L5 19h14"/></svg>';
    for (var i = 0; i < 7; i++) { var a = (-80 + i * 22) * Math.PI / 180, d = 16 + (i % 3) * 7; h += '<i class="zk-p" style="--dx:' + Math.round(Math.cos(a) * d + 8) + 'px;--dy:' + Math.round(Math.sin(a) * d - 10) + 'px;--dl:' + (i * 18) + 'ms"></i>'; }
    mk(x, y, h, 900);
  }
  var down = null;
  document.addEventListener('pointerdown', function (e) { down = null; if (e.pointerType !== 'mouse' || e.button !== 0) return; if (e.target.closest && e.target.closest(NATIVE)) return; down = [e.clientX, e.clientY, Date.now()]; press(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('pointerup', function (e) { if (!down || e.pointerType !== 'mouse') return; var dx = e.clientX - down[0], dy = e.clientY - down[1]; if (dx * dx + dy * dy < 36 && Date.now() - down[2] < 600) pop(e.clientX, e.clientY); down = null; }, { passive: true });      // نقرة فقط: لا انبثاق أثناء السحب أو تحديد النص
})();
