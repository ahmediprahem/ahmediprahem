/* «حصتي» — طبقة الحركة واللمس والثيمات (JavaScript عادي، بلا مكتبات)
   الربط بالتطبيق سطر واحد في آخر render():   if (window.HxMotion) HxMotion.after();
   كل شيء هنا تحسين تدريجي: لو تعطّل الملف يبقى التطبيق يعمل كما هو. */
(function () {
  'use strict';
  var root = document.documentElement;
  var RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var canVibrate = 'vibrate' in navigator && !/iPad|iPhone|iPod/.test(navigator.userAgent);
  var themed = function () { var t = root.getAttribute('data-theme'); return t === 'rose' || t === 'pulse'; };

  /* ---------------- الثيم ---------------- */
  var THEMES = { classic: { meta: '#121c45', scheme: 'dark' }, rose: { meta: '#FAF6F2', scheme: 'light' }, pulse: { meta: '#0A0C0F', scheme: 'dark' } };
  var TKEY = 'hissati_theme';
  function applyTheme(name) {
    if (name === 'classic' || !THEMES[name]) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', name);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', THEMES[name] ? THEMES[name].meta : THEMES.classic.meta);
    var c = document.querySelector('meta[name="color-scheme"]'); if (c) c.setAttribute('content', THEMES[name] ? THEMES[name].scheme : 'dark');
  }
  var HxTheme = {
    get: function () { return root.getAttribute('data-theme') || 'classic'; },
    /* يغيّر الثيم بلا وميض: كشف دائري من مكان اللمس (View Transitions) أو تلاشٍ لوني متزامن */
    set: function (name, fromEl) {
      try { localStorage.setItem(TKEY, name); } catch (e) { }
      if (name === HxTheme.get()) return;
      if (fromEl && fromEl.getBoundingClientRect) {
        var r = fromEl.getBoundingClientRect();
        root.style.setProperty('--hx-vx', (r.left + r.width / 2) + 'px'); root.style.setProperty('--hx-vy', (r.top + r.height / 2) + 'px');
      }
      haptic('tap');
      if (document.startViewTransition && !RM.matches) { document.startViewTransition(function () { applyTheme(name); }); return; }
      root.classList.add('hx-theming'); applyTheme(name);
      setTimeout(function () { root.classList.remove('hx-theming'); }, 560);
    },
    boot: function () { var t = 'classic'; try { t = localStorage.getItem(TKEY) || 'classic'; } catch (e) { } applyTheme(t); }
  };

  /* ---------------- الاهتزاز (وبديله البصري على iOS) ---------------- */
  var PATTERNS = { tap: 8, select: 6, success: [12, 40, 18], complete: [20, 60, 30], error: [40, 30, 40], warn: [24] };
  function haptic(kind, el) {
    if (canVibrate) { try { navigator.vibrate(PATTERNS[kind] || 8); } catch (e) { } }
    if (el && !RM.matches && (kind === 'success' || kind === 'complete' || !canVibrate)) bump(el, kind === 'error' ? 'hx-shake' : 'hx-bump');
  }
  function bump(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, 700); }

  /* ---------------- التموّج الموضعي + استمرارية الضغط بعد إعادة الرسم ---------------- */
  var RIPPLE = '.btn,.opt,.chip,.food,.pad button,.daychips button,.tabs button,.qr button,.tabbar button,.adk,.hx-th,.chatbtn,.pf button';
  var lastPress = null;     // {key, x, y, t}
  function keyOf(el) { var a = el.getAttribute('data-act'), v = el.getAttribute('data-v'), k = el.getAttribute('data-k'); return a ? a + '|' + (v || '') + '|' + (k || '') : null; }
  function ripple(el, x, y, delay) {
    if (RM.matches || !themed()) return;
    var r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    var w = document.createElement('span'); w.className = 'hx-rip'; w.setAttribute('aria-hidden', 'true');
    var i = document.createElement('i'); i.style.cssText = '--x:' + (x - r.left) + 'px;--y:' + (y - r.top) + 'px;--d:' + d + 'px' + (delay ? ';animation-delay:-' + delay + 'ms' : '');
    w.appendChild(i); el.appendChild(w); setTimeout(function () { w.remove(); }, 560);
  }
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest && e.target.closest(RIPPLE); if (!el) return;
    lastPress = { key: keyOf(el), x: e.clientX, y: e.clientY, t: performance.now(), ox: e.clientX };
    ripple(el, e.clientX, e.clientY, 0);
  }, { passive: true });
  /* اهتزاز خفيف لأفعال التسجيل */
  var TAP_ACTS = { ck: 'tap', water: 'tap', hb: 'tap', whole: 'success', skip: 'select', doswap: 'success', weigh: 'success', tab: 'select', day: 'select', htoggle: 'select', like: 'tap', send: 'tap' };
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-act]'); if (!el) return;
    var k = TAP_ACTS[el.getAttribute('data-act')]; if (k && canVibrate) haptic(k);
  }, true);

  /* ---------------- تحريك القيم بين رسمين (الكوب، الحلقة، القلب، العدّاد) ----------------
     التطبيق يعيد بناء الـHTML في كل render() فلا تعمل CSS transitions تلقائياً.
     نحفظ القيمة السابقة لكل عنصر ونبدأ منها ثم نترك المتصفح ينتقل للجديدة بالنابض. */
  var MORPH = [
    { sel: '.ring svg circle:last-child', attr: 'stroke-dashoffset', mode: 'dash' },
    { sel: '.hw-gauge svg path:nth-of-type(2)', attr: 'stroke-dashoffset', mode: 'dash' },
    { sel: '.bottle .wv', attr: 'y', mode: 'y' },
    { sel: '.heart .hf', attr: 'y', mode: 'y' }
  ];
  var prev = {}, prevNum = {}, prevDone = {}, had = { sheet: false, toast: false }, ghosts = {}, bubCount = 0;
  function ctx(el) { var h = el.closest('[data-hb]'); return h ? h.getAttribute('data-hb') : (el.closest('.adheart') ? 'adh' : (el.closest('.celc') ? 'cel' : '')); }
  function morphValues() {
    var seen = {};
    MORPH.forEach(function (m) {
      document.querySelectorAll(m.sel).forEach(function (el, i) {
        var key = m.sel + '|' + ctx(el) + '|' + i, nv = parseFloat(el.getAttribute(m.attr)); if (isNaN(nv)) return; seen[key] = 1;
        var ov = prev[key]; prev[key] = nv;
        if (ov == null || Math.abs(ov - nv) < 0.01 || RM.matches || !themed()) return;
        if (m.mode === 'dash') {
          el.style.transition = 'none'; el.style.strokeDashoffset = ov; void el.getBoundingClientRect();
          el.style.transition = ''; el.style.strokeDashoffset = nv;
        } else {
          el.style.transition = 'none'; el.style.transform = 'translateY(' + (ov - nv) + 'px)'; void el.getBoundingClientRect();
          el.style.transition = ''; el.style.transform = 'translateY(0)';
          var wave = el.parentNode && el.parentNode.querySelector('.hwave'); if (wave) { wave.style.opacity = '0'; setTimeout(function () { wave.style.opacity = ''; }, 500); }
        }
      });
    });
    Object.keys(prev).forEach(function (k) { if (!seen[k]) delete prev[k]; });
  }
  /* عدّ الأرقام صعوداً (النسبة في الحلقة) */
  function countUp() {
    document.querySelectorAll('.ring .num').forEach(function (el, i) {
      var m = /^(\d+)%$/.exec(el.textContent.trim()); if (!m) return; var nv = +m[1], key = 'ring' + i, ov = prevNum[key]; prevNum[key] = nv;
      if (ov == null || ov === nv || RM.matches || !themed()) return;
      var t0 = performance.now(), D = 520;
      (function step(t) { var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(ov + (nv - ov) * e) + '%'; if (p < 1) requestAnimationFrame(step); })(t0);
      if (nv === 100 && ov < 100) haptic('complete', el.closest('.card'));
    });
  }
  /* إتمام عادة: بطاقة تستقر بهدوء، ثم تصعد العادة التالية إلى العين */
  function habitFlow() {
    var cards = document.querySelectorAll('.hb[data-hb]'), next = null, fresh = null;
    cards.forEach(function (c) {
      var id = c.getAttribute('data-hb'), d = c.classList.contains('done');
      if (d && prevDone[id] === false) fresh = c;
      prevDone[id] = d;
    });
    if (!fresh) return;
    haptic('success', fresh); if (!RM.matches) bump(fresh, 'hx-just-done');
    var after = false; cards.forEach(function (c) { if (c === fresh) after = true; else if (after && !next && !c.classList.contains('done')) next = c; });
    if (!next) return;
    setTimeout(function () {
      if (document.getElementById('cel')) return;            // الاحتفال أولاً؛ لا نحرّك الشاشة تحته
      var sc = document.querySelector('.scroll'); if (!sc) return;
      var r = next.getBoundingClientRect(), sr = sc.getBoundingClientRect();
      if (r.top > sr.top + sr.height * 0.55) sc.scrollTo({ top: sc.scrollTop + (r.top - sr.top) - 96, behavior: RM.matches ? 'auto' : 'smooth' });
    }, 900);
  }
  /* الورقة والإشعار: دخول مرة واحدة، وخروج حقيقي عند الإغلاق (نسخة شبحية تتلاشى) */
  function overlays() {
    var dev = document.querySelector('.device') || document.body;
    var sh = document.querySelector('.sheet'), bg = document.querySelector('.sheet-bg'), to = document.querySelector('.toast');
    if (sh && !had.sheet) {
      var ox = lastPress && performance.now() - lastPress.t < 1500 ? lastPress.ox - sh.getBoundingClientRect().left : null;
      if (ox != null) sh.style.setProperty('--hx-ox', Math.max(0, ox) + 'px');
      sh._opener = lastPress && lastPress.key;
      setTimeout(function () { if (document.querySelector('.sheet')) root.classList.add('hx-sheet-open'); }, 30);
      var f = sh.querySelector('.sb button,.sb input,.sb textarea,.sh .back'); if (f && !('ontouchstart' in window)) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { } }, 60);
      haptic('select');
    }
    if (!sh && had.sheet) {
      root.classList.remove('hx-sheet-open');
      if (ghosts.sheet && !RM.matches) { ghost(dev, ghosts.sheet, 'hx-exit-sheet'); ghost(dev, ghosts.bg, 'hx-exit-fade'); }
      var back = ghosts.opener && document.querySelector('[data-act="' + ghosts.opener.split('|')[0] + '"][data-v="' + ghosts.opener.split('|')[1] + '"]');
      if (back && !('ontouchstart' in window)) try { back.focus({ preventScroll: true }); } catch (e) { }
    }
    if (sh) { ghosts.sheet = sh.cloneNode(true); ghosts.bg = bg && bg.cloneNode(true); ghosts.opener = sh._opener || ghosts.opener; bindDrag(sh, bg); }
    had.sheet = !!sh;
    if (to && !had.toast) { setTimeout(function () { root.classList.add('hx-toast-on'); }, 30); haptic('success'); }
    if (!to && had.toast) { root.classList.remove('hx-toast-on'); if (ghosts.toast && !RM.matches) ghost(dev, ghosts.toast, 'hx-exit-toast'); }
    if (to) ghosts.toast = to.cloneNode(true);
    had.toast = !!to;
    /* فقاعات المحادثة: الجديدة فقط تدخل بحركة */
    var bubs = document.querySelectorAll('.thread .bub');
    if (bubs.length) { if (root.classList.contains('hx-thread-seen')) for (var i = bubCount; i < bubs.length; i++) bubs[i].classList.add('hx-new'); else setTimeout(function () { root.classList.add('hx-thread-seen'); }, 400); bubCount = bubs.length; }
    else { root.classList.remove('hx-thread-seen'); bubCount = 0; }
  }
  function ghost(parent, node, cls) {
    if (!node) return; node.removeAttribute('id'); node.setAttribute('aria-hidden', 'true'); node.classList.add(cls); node.style.animation = '';
    parent.appendChild(node); var done = function () { node.remove(); }; node.addEventListener('animationend', done); setTimeout(done, 400);
  }

  /* ---------------- السحب: الورقة تتبع الإصبع وتُغلق بالزخم ---------------- */
  function bindDrag(sh, bg) {
    if (sh._hxDrag) return; sh._hxDrag = 1;
    var y0 = 0, dy = 0, t0 = 0, samples = [], active = false, pid = null, H = 0;
    function start(e) {
      if (e.button > 0) return;
      var onHandle = e.target.closest('.grab,.sh') && !e.target.closest('button');
      var sb = sh.querySelector('.sb'), atTop = !sb || sb.scrollTop <= 0;
      if (!onHandle && !(atTop && e.pointerType === 'touch' && sb && sb.contains(e.target))) return;
      active = true; pid = e.pointerId; y0 = e.clientY; dy = 0; t0 = performance.now(); samples = [[t0, y0]]; H = sh.offsetHeight;
      sh._pending = !onHandle;      // داخل المحتوى: لا نلتقط إلا إن تحرّك الإصبع للأسفل
      if (onHandle) { try { sh.setPointerCapture(pid); } catch (x) { } sh.classList.add('hx-dragging'); }
    }
    function move(e) {
      if (!active || e.pointerId !== pid) return;
      var d = e.clientY - y0;
      if (sh._pending) { if (d < 6) { if (d < -6) active = false; return; } sh._pending = false; try { sh.setPointerCapture(pid); } catch (x) { } sh.classList.add('hx-dragging'); }
      dy = d > 0 ? d : d / 6;                                     // للأعلى: مقاومة مطاطية
      sh.style.transform = 'translateY(' + dy + 'px)';
      if (bg) bg.style.opacity = String(Math.max(0, 1 - dy / H));
      samples.push([performance.now(), e.clientY]); if (samples.length > 6) samples.shift();
      e.preventDefault();
    }
    function end(e) {
      if (!active || (e && e.pointerId !== pid)) return; active = false;
      if (sh._pending) { sh._pending = false; return; }
      sh.classList.remove('hx-dragging');
      var a = samples[0], b = samples[samples.length - 1], v = (b[1] - a[1]) / Math.max(1, b[0] - a[0]);   // px/ms
      var close = dy > H * 0.28 || v > 0.55;
      if (close) {
        var dist = H - dy, dur = Math.max(140, Math.min(300, dist / Math.max(v, 1.2)));
        sh.style.transition = 'transform ' + dur + 'ms cubic-bezier(.2,.6,.35,1)'; sh.style.transform = 'translateY(' + (H + 24) + 'px)';
        if (bg) { bg.style.transition = 'opacity ' + dur + 'ms linear'; bg.style.opacity = '0'; }
        haptic('select');
        setTimeout(function () { ghosts.sheet = null; ghosts.bg = null; var c = sh.querySelector('[data-act="close"]') || bg; if (c) c.click(); }, dur);
      } else {
        sh.style.transition = 'transform var(--hx-dur-standard) var(--hx-spring-standard)'; sh.style.transform = '';
        if (bg) { bg.style.transition = 'opacity 200ms'; bg.style.opacity = ''; }
      }
    }
    sh.addEventListener('pointerdown', start); sh.addEventListener('pointermove', move, { passive: false });
    sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
  }

  /* الزر الذي ضُغط قبل إعادة الرسم: نكمل ارتداده وتموّجه على نسخته الجديدة */
  function continuePress() {
    if (!lastPress || !lastPress.key || RM.matches || !themed()) return;
    var age = performance.now() - lastPress.t; if (age > 450) return;
    var p = lastPress.key.split('|'), sel = '[data-act="' + p[0] + '"]' + (p[1] ? '[data-v="' + p[1] + '"]' : '') + (p[2] ? '[data-k="' + p[2] + '"]' : '');
    var el = document.querySelector(sel); if (!el || el.querySelector('.hx-rip')) return;
    if (el.matches(RIPPLE)) { ripple(el, lastPress.x, lastPress.y, age); bump(el, 'hx-release'); }
  }

  var HxMotion = {
    after: function () { try { morphValues(); countUp(); habitFlow(); overlays(); continuePress(); } catch (e) { if (window.console) console.warn('HxMotion', e); } },
    haptic: haptic, bump: bump,
    /* لعناصر خارج render(): الاحتفال وطبقة الأذكار */
    celebrate: function () { haptic('complete'); }
  };
  window.HxMotion = HxMotion; window.HxTheme = HxTheme;
})();
