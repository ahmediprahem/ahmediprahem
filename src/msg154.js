// ================= 1.54 (ملاحظات المالك 2026-11-27): الرسائل والإشعارات في «زنها Pro»
// 1) الرسائل لا تظهر إلا بتحديث الصفحة: صفحة «شات زنها» لم تكن تُعاد رسمها عند وصول رسائل جديدة، والتحقق كان كل 60 ثانية.
//    الآن: الشات المفتوح يتحقق كل 5 ثوانٍ ما دامت الصفحة ظاهرة، ويُعاد رسمه عند الجديد مع إبقاء المسودة ومكان المؤشر، والنزول لآخر رسالة إن كنت في الأسفل، وتعليم المحادثة المفتوحة مقروءة.
// 2) أيقونة «إشعار جديد» لا تختفي عند الفتح: العدد كان عدد كل المهام العاجلة دائماً. الآن الشارة = ما لم تره بعد، وفتح الجرس يعلّمها مرئية (القائمة نفسها لا تتغير).
var MSG154 = { k: 'zn_bellseen', fast: 0 };
function msgLive() {
  if (S.view !== 'chat') return;
  var t = document.getElementById('chIn'), v = t ? [t.value, document.activeElement === t, t.selectionStart] : null, bd = document.getElementById('chBody'), near = !bd || bd.scrollHeight - bd.scrollTop - bd.clientHeight < 120, top = bd ? bd.scrollTop : 0;
  var c = S.clients.filter(function (x) { return x.code === CHT.sel; })[0]; if (c) chRead(c);
  main();
  var t2 = document.getElementById('chIn'); if (t2 && v) { t2.value = v[0]; if (v[1]) { t2.focus(); try { t2.setSelectionRange(v[2], v[2]); } catch (e) { } } }
  var b2 = document.getElementById('chBody'); if (b2) b2.scrollTop = near ? b2.scrollHeight : top;
  if (typeof hxRail === 'function') hxRail();
}
hxPoll = (function (f) { return function () { return f.apply(this, arguments).then(function (got) { if (got && S.view === 'chat') msgLive(); return got; }); }; })(hxPoll);
// تحقق سريع ما دام الشات (أو محادثة داخل ملف العميل) مفتوحاً وظاهراً
setInterval(function () {
  if (document.visibilityState === 'hidden' || typeof hxOn !== 'function' || !hxOn() || HX.busy) return;
  var inChat = S.view === 'chat' || (S.view === 'client' && document.querySelector('main #chBody, main .chm'));
  if (inChat) hxPoll();
}, 5000);
// ---- الجرس: «جديد» = ما لم يُرَ
function msgSeen() { try { return JSON.parse(localStorage.getItem(MSG154.k) || '{}'); } catch (e) { return {}; } }
function msgUnseen() { var s = msgSeen(); return hqUrgent().filter(function (i) { return !s[i.key]; }).length; }
function msgMarkSeen() { try { var s = {}; hqUrgent().forEach(function (i) { s[i.key] = 1; }); localStorage.setItem(MSG154.k, JSON.stringify(s)); } catch (e) { } }      // المحفوظ = المهام الحالية فقط (لا يتضخم)
hqBtns = (function (f) { return function () {
  var h = f.apply(this, arguments), n = msgUnseen(), all = hqUrgent().length;
  return h.replace(/(<button class="hqb" data-a="hqBell" aria-label=")[^"]*("[^>]*>)([\s\S]*?)<\/button>/, function (m0, a, b, inner) {
    inner = inner.replace(/<em>[^<]*<\/em>/, ''); return a + 'الإشعارات العاجلة' + (all ? ' (' + all + (n ? '، ' + n + ' جديد' : '') + ')' : '') + b + inner + (n ? '<em>' + (n > 99 ? '99+' : n) + '</em>' : '') + '</button>';
  });
}; })(hqBtns);
A.hqBell = (function (f) { return function () { var r = f.apply(this, arguments); if (HQ.open === 'bell') { msgMarkSeen(); [].forEach.call(document.querySelectorAll('#hd [data-a="hqBell"] em'), function (e) { e.remove(); }); } return r; }; })(A.hqBell);
