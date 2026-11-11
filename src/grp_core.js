// ================= مجموعات «شات زنها» والتحديات (0.93) — منطق مشترك بين «زنها Pro» و«زنها» (ES5 بلا اعتماد على الواجهة)
// رسائل المجموعة المشفّرة بمفتاح المجموعة (انظر hx_crypto.js): {t:'m',nm,x,ts} نص · {t:'img',nm,k,cap,ts} صورة · {t:'act',nm,tool,ts,note,k?} إنجاز في تحدٍّ.
// النقاط لا تُصدَّق من المرسل: كل طرف يحسبها محلياً من تعريف التحدي (النقاط لكل أداة وحدّها اليومي)، فلا يستطيع أحد تضخيم نقاطه.
(function (root, factory) { var api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.GRP = api; })(typeof self !== 'undefined' ? self : this, function () {
  // أدوات التطبيق التي يمكن جعلها تحدياً: pts = نقاط المرة، max = أقصى مرات في اليوم، photo = تحتاج صورة
  var TOOLS = [
    { id: 'meal', ico: '🍽', name: 'صوّر وجبتك', pts: 10, max: 4, photo: true, fx: 'meal', say: 'صوّر وجبته' },
    { id: 'water', ico: '💧', name: 'كوب ماء', pts: 2, max: 8, fx: 'water', say: 'شرب ماءً' },
    { id: 'walk', ico: '🚶', name: 'مشي', pts: 15, max: 2, fx: 'walk', say: 'أنهى مشياً' },
    { id: 'gym', ico: '🏋', name: 'تمرين رياضي', pts: 20, max: 1, fx: 'sport', say: 'أنهى تمرينه' },
    { id: 'video', ico: '🎬', name: 'فيديو تمرين أو مشي', pts: 8, max: 1, fx: 'sport', say: 'شاهد فيديو التمرين' },
    { id: 'adhkar_m', ico: '🌅', name: 'أذكار الصباح', pts: 5, max: 1, fx: 'adhkar', say: 'قرأ أذكار الصباح' },
    { id: 'adhkar_e', ico: '🌙', name: 'أذكار المساء', pts: 5, max: 1, fx: 'adhkar', say: 'قرأ أذكار المساء' },
    { id: 'wird', ico: '📖', name: 'ورد القرآن', pts: 8, max: 1, fx: 'adhkar', say: 'أتمّ وِرده' },
    { id: 'sleep', ico: '😴', name: 'نوم مبكر', pts: 5, max: 1, fx: 'sleep', say: 'نام مبكراً' },
    { id: 'day', ico: '✅', name: 'إغلاق يوم الخطة', pts: 10, max: 1, fx: 'day', say: 'أغلق يوم خطته' }
  ];
  var BYID = {}; TOOLS.forEach(function (t) { BYID[t.id] = t; });
  var PRESETS = [   // قوالب جاهزة تُنشأ بنقرة (النقاط قابلة للتعديل)
    { id: 'meals', name: 'تحدي الوجبات', ico: '🍽', desc: 'صوّر وجباتك واكسب نقاطاً', tools: ['meal', 'water', 'day'], days: 7 },
    { id: 'move', name: 'تحدي الحركة', ico: '🚶', desc: 'مشي وتمرين وفيديوهات', tools: ['walk', 'gym', 'video', 'water'], days: 7 },
    { id: 'spirit', name: 'تحدي الروح', ico: '🌙', desc: 'أذكار وورد ونوم مبكر', tools: ['adhkar_m', 'adhkar_e', 'wird', 'sleep'], days: 7 },
    { id: 'all', name: 'التحدي الشامل', ico: '🏆', desc: 'كل الأدوات معاً', tools: TOOLS.map(function (t) { return t.id; }), days: 30 }
  ];
  var REWARDS = [   // أنماط الجوائز الجاهزة
    { id: 'first', name: 'الأول فقط', ico: '🥇', mode: 'first', items: [{ kind: 'disc', val: 10 }] },
    { id: 'top2', name: 'الأول والثاني', ico: '🥈', mode: 'top2', items: [{ kind: 'disc', val: 10 }, { kind: 'disc', val: 5 }] },
    { id: 'all', name: 'كل المراتب', ico: '🎁', mode: 'all', items: [{ kind: 'disc', val: 15 }, { kind: 'disc', val: 10 }, { kind: 'disc', val: 5 }, { kind: 'text', label: 'شهادة مشاركة' }] },
    { id: 'pts', name: 'حسب النقاط', ico: '⭐', mode: 'pts', items: [{ min: 300, kind: 'disc', val: 10 }, { min: 150, kind: 'disc', val: 5 }, { min: 50, kind: 'text', label: 'شهادة مشاركة' }] }
  ];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(key, n) { var p = key.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return dayKey(d.getTime()); }
  // تعريف تحدٍّ: {name, ico, tools:[{id,pts,max}], start:'YYYY-MM-DD', days, reward:{mode,items}}
  function tool(chal, id) { var t = ((chal && chal.tools) || []).filter(function (x) { return x.id === id; })[0]; return t ? { id: id, pts: Math.max(0, +t.pts || 0), max: Math.max(1, +t.max || 1) } : null; }
  function makeChal(preset, start, days) {
    var p = PRESETS.filter(function (x) { return x.id === preset; })[0] || PRESETS[0];
    return { name: p.name, ico: p.ico, start: start || dayKey(Date.now()), days: days || p.days, tools: p.tools.map(function (id) { var t = BYID[id]; return { id: id, pts: t.pts, max: t.max }; }), reward: copy(REWARDS[0]) };
  }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function range(chal) { return { from: chal.start, to: addDays(chal.start, Math.max(1, +chal.days || 1) - 1) }; }
  function state(chal, now) { var r = range(chal), t = dayKey(now || Date.now()); return t < r.from ? 'soon' : t > r.to ? 'ended' : 'live'; }
  function daysLeft(chal, now) { var r = range(chal), a = dayKey(now || Date.now()), x = new Date(r.to + 'T00:00:00'), y = new Date(a + 'T00:00:00'); return Math.max(0, Math.round((x - y) / 864e5) + 1); }
  // الترتيب: msgs = رسائل المجموعة المفتوحة [{from,body:{t,tool,nm,ts}}], opt.day = حصر في يوم واحد
  function board(msgs, chal, opt) {
    opt = opt || {}; var r = range(chal), per = {}, names = {};
    msgs.forEach(function (m) {
      var b = m.body || m; if (!b || b.t !== 'act') return; var t = tool(chal, b.tool); if (!t) return; var ts = b.ts || m.ts * 1000, k = dayKey(ts);
      if (k < r.from || k > r.to || (opt.day && k !== opt.day)) return;
      var id = m.from || b.from; if (!id) return; names[id] = b.nm || names[id] || ''; var u = per[id] = per[id] || { id: id, nm: '', pts: 0, last: 0, tools: {}, days: {} };
      var dk = u.days[k] = u.days[k] || {}; dk[t.id] = (dk[t.id] || 0) + 1; if (dk[t.id] > t.max) return;           // حدّ الأداة اليومي
      u.pts += t.pts; u.tools[t.id] = (u.tools[t.id] || 0) + 1; u.last = Math.max(u.last, ts);
    });
    var rows = Object.keys(per).map(function (id) { var u = per[id]; u.nm = names[id] || 'عضو'; u.act = Object.keys(u.days).length; return u; });
    rows.sort(function (a, b) { return b.pts - a.pts || a.last - b.last; });
    var rk = 0, prev = null; rows.forEach(function (u, i) { if (prev === null || u.pts !== prev) rk = i + 1; u.rank = rk; prev = u.pts; });
    return rows;
  }
  // ما بقي للعضو اليوم من نقاط ممكنة لكل أداة (لإظهار الأزرار المتاحة)
  function todayLeft(msgs, chal, id, now) {
    var k = dayKey(now || Date.now()), used = {}; msgs.forEach(function (m) { var b = m.body || m; if (b && b.t === 'act' && (m.from || b.from) === id && dayKey(b.ts || m.ts * 1000) === k) used[b.tool] = (used[b.tool] || 0) + 1; });
    return (chal.tools || []).map(function (t) { var d = tool(chal, t.id); return { id: t.id, left: Math.max(0, d.max - (used[t.id] || 0)), pts: d.pts }; });
  }
  function rewardLabel(it) { if (!it) return ''; return it.kind === 'disc' ? 'خصم ' + (+it.val || 0) + '٪ على التجديد القادم' : it.kind === 'days' ? (+it.val || 0) + ' أيام هدية على الاشتراك' : String(it.label || '').slice(0, 80); }
  // الجوائز المستحقة من ترتيب نهائي. تُسجَّل لدى الأخصائي «بانتظار الاعتماد»
  function rewards(rows, rw) {
    var out = [], items = (rw && rw.items) || [], mode = rw && rw.mode;
    rows.forEach(function (u) {
      var it = null;
      if (mode === 'first') it = u.rank === 1 ? items[0] : null;
      else if (mode === 'top2') it = u.rank <= 2 ? items[u.rank - 1] || items[items.length - 1] : null;
      else if (mode === 'all') it = items.length ? items[Math.min(u.rank - 1, items.length - 1)] : null;
      else if (mode === 'pts') it = items.slice().sort(function (a, b) { return (+b.min || 0) - (+a.min || 0); }).filter(function (x) { return u.pts >= (+x.min || 0); })[0] || null;
      if (it && u.pts > 0) out.push({ id: u.id, nm: u.nm, rank: u.rank, pts: u.pts, kind: it.kind || 'text', val: +it.val || 0, label: rewardLabel(it) });
    });
    return out;
  }
  var MEDAL = ['🥇', '🥈', '🥉'];
  function rankText(rows, label, max) {
    var top = rows.slice(0, max || 5); if (!top.length) return 'لا نشاط في ' + label + ' بعد — كن أول من يبدأ! 💪';
    return '🏁 ترتيب ' + label + '\n' + top.map(function (u) { return (MEDAL[u.rank - 1] || (u.rank + '.')) + ' ' + u.nm + ' — ' + u.pts + ' نقطة'; }).join('\n');
  }
  // رمز «رفيق الرحلة»: مشتق من معرّف العضو ثابتاً، بلا أحرف ملتبسة، ويُقارَن بلا حساسية لحالة الأحرف
  var AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function codeOf(id) { var h1 = 2166136261, h2 = 5381, s = String(id); for (var i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0; h2 = (Math.imul(h2, 33) + s.charCodeAt(i)) >>> 0; } var o = ''; for (var j = 0; j < 3; j++) { o += AL[h1 % 31]; h1 = Math.floor(h1 / 31); o += AL[h2 % 31]; h2 = Math.floor(h2 / 31); } return 'Z-' + o; }
  function normCode(c) { c = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.indexOf('Z') === 0) c = c.slice(1); return 'Z-' + c; }
  // ---------- مؤثرات مرئية وصوتية تظهر للجميع عند نشر إنجاز
  var ctx = null, muted = false;
  function audio() { try { if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) ctx = new C(); } if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (e) { ctx = null; } return ctx; }
  var TUNES = { meal: [523, 659, 784], water: [659, 880], walk: [392, 523, 659], sport: [440, 554, 659, 880], adhkar: [392, 494, 587], sleep: [330, 262], day: [523, 659, 784, 1047], rank: [523, 659, 784, 659, 880, 1047], lead: [784, 988, 1175] };
  function chime(kind) {
    if (muted) return; var a = audio(); if (!a) return; var seq = TUNES[kind] || TUNES.meal, t = a.currentTime + 0.02;
    seq.forEach(function (f, i) { try { var o = a.createOscillator(), g = a.createGain(); o.type = kind === 'adhkar' ? 'sine' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.11); g.gain.exponentialRampToValueAtTime(0.16, t + i * 0.11 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.3); o.connect(g); g.connect(a.destination); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.32); } catch (e) { } });
  }
  var CONF = { meal: ['🍎', '🥗', '✨'], water: ['💧', '🫧', '✨'], walk: ['👟', '✨', '🌿'], sport: ['💪', '🔥', '⚡'], adhkar: ['🌙', '✨', '🤍'], sleep: ['🌙', '💤', '⭐'], day: ['🎉', '⭐', '✨'], rank: ['🏆', '🎉', '🥇', '✨'], lead: ['👑', '🔥', '✨'] };
  var cssDone = false;
  function css() {
    if (cssDone || typeof document === 'undefined') return; cssDone = true; var s = document.createElement('style');
    s.textContent = '.gfx{position:fixed;inset-inline:0;top:max(12px,env(safe-area-inset-top));z-index:99999;display:flex;justify-content:center;pointer-events:none}.gfx>div{background:#14532d;color:#fff;border-radius:16px;padding:10px 16px;font:600 14px/1.4 inherit;box-shadow:0 10px 30px rgba(0,0,0,.28);animation:gfxIn .5s cubic-bezier(.2,1.4,.4,1) both;max-width:92vw;text-align:center}.gfx.out>div{animation:gfxOut .4s ease both}.gfx small{display:block;font-weight:400;opacity:.85}.gfxp{position:fixed;top:-30px;z-index:99998;pointer-events:none;animation:gfxFall linear forwards}@keyframes gfxIn{from{transform:translateY(-30px) scale(.8);opacity:0}to{transform:none;opacity:1}}@keyframes gfxOut{to{transform:translateY(-20px);opacity:0}}@keyframes gfxFall{to{transform:translateY(105vh) rotate(360deg);opacity:.9}}@media (prefers-reduced-motion:reduce){.gfxp{display:none}}';
    document.head.appendChild(s);
  }
  function fx(kind, text, sub, opt) {
    if (typeof document === 'undefined') return; opt = opt || {}; css(); chime(kind);
    var host = document.createElement('div'); host.className = 'gfx'; host.setAttribute('role', 'status'); host.innerHTML = '<div></div>'; var box = host.firstChild; box.textContent = text; if (sub) { var sm = document.createElement('small'); sm.textContent = sub; box.appendChild(sm); }
    document.body.appendChild(host); setTimeout(function () { host.className = 'gfx out'; }, opt.ms || 3200); setTimeout(function () { if (host.parentNode) host.parentNode.removeChild(host); }, (opt.ms || 3200) + 500);
    var set = CONF[kind] || CONF.meal, n = opt.n || 14;
    for (var i = 0; i < n; i++) { var p = document.createElement('span'); p.className = 'gfxp'; p.textContent = set[i % set.length]; p.style.left = Math.round(Math.random() * 96) + 'vw'; p.style.fontSize = (16 + Math.round(Math.random() * 16)) + 'px'; p.style.animationDuration = (1.6 + Math.random() * 1.6) + 's'; p.style.animationDelay = (Math.random() * 0.5) + 's'; document.body.appendChild(p); (function (q) { setTimeout(function () { if (q.parentNode) q.parentNode.removeChild(q); }, 3800); })(p); }
  }

  // ---------- صور المجموعة: تُضغط على الجهاز ثم تُشفَّر بمفتاح المجموعة قبل الرفع، ولا تفكّها إلا أجهزة الأعضاء
  function H() { return (typeof self !== 'undefined' ? self : this).HXC; }
  function shrink(file, maxBytes) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), im = new Image(); im.onerror = function () { URL.revokeObjectURL(url); no(new Error('تعذّر قراءة الصورة')); };
      im.onload = function () {
        URL.revokeObjectURL(url); var side = 960, q = 0.72;
        (function tryIt() {
          var k = Math.min(1, side / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k)); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          cv.toBlob(function (b) {
            if (!b) return no(new Error('تعذّر ضغط الصورة'));
            if (b.size > maxBytes && (q > 0.4 || side > 400)) { if (q > 0.4) q -= 0.1; else side -= 160; return tryIt(); }
            if (b.size > maxBytes) return no(new Error('الصورة كبيرة جداً'));
            var fr = new FileReader(); fr.onload = function () { ok(new Uint8Array(fr.result)); }; fr.onerror = function () { no(new Error('تعذّر قراءة الصورة')); }; fr.readAsArrayBuffer(b);
          }, 'image/jpeg', q);
        })();
      };
      im.src = url;
    });
  }
  var IMGS = {};
  function imgGet(base, gkey, mkey) {
    var id = gkey.slice(0, 8) + mkey; if (IMGS[id]) return IMGS[id];
    return (IMGS[id] = fetch(base + '/m/' + mkey).then(function (r) { if (!r.ok) throw new Error('انتهت صلاحية الصورة'); return r.arrayBuffer(); }).then(function (buf) { var x = H(); return x.gOpenBytes(gkey, x.b64u(new Uint8Array(buf))); }).then(function (u8) { return URL.createObjectURL(new Blob([u8], { type: 'image/jpeg' })); }).catch(function (e) { delete IMGS[id]; throw e; }));
  }
  function hydrate(el, base, gkey) {
    if (!el) return; [].forEach.call(el.querySelectorAll('img[data-gk]'), function (im) {
      var k = im.getAttribute('data-gk'); im.removeAttribute('data-gk');
      imgGet(base, gkey, k).then(function (u) { im.src = u; im.classList.add('ok'); }).catch(function () { im.alt = 'انتهت صلاحية الصورة (تُحذف بعد 7 أيام)'; im.classList.add('gone'); });
    });
  }
  function resize(file, maxBytes) { return shrink(file, maxBytes || 240000); }
  // رسالة الترتيب اليومي تُنشر من أي جهاز يفتح بعد التاسعة مساءً؛ تُعرض الأولى لكل يوم فقط فلا تتكرر
  function visible(msgs) { var seen = {}; return msgs.filter(function (m) { var b = m.body || m; if (!b || b.t !== 'rank') return true; var k = (b.fin ? 'f' : 'd') + (b.day || ''); if (seen[k]) return false; seen[k] = 1; return true; }); }
  return { shrink: resize, imgGet: imgGet, hydrate: hydrate, visible: visible, TOOLS: TOOLS, PRESETS: PRESETS, REWARDS: REWARDS, tool: tool, byId: function (id) { return BYID[id] || null; }, makeChal: makeChal, dayKey: dayKey, addDays: addDays, range: range, state: state, daysLeft: daysLeft, board: board, todayLeft: todayLeft, rewards: rewards, rewardLabel: rewardLabel, rankText: rankText, codeOf: codeOf, normCode: normCode, fx: fx, chime: chime, mute: function (m) { muted = !!m; }, copy: copy };
});
