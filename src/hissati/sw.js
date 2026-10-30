// عامل الخدمة لـ«حصتي» (تقدّمه المحطة على /sw.js): إشعارات والتطبيق مغلق، وفتح سريع وبلا إنترنت.
// الإشعار بلا محتوى عمداً: لا تمر بيانات صحية عبر خدمات الإشعارات؛ والبيانات نفسها مشفّرة برمز الدخول فلا يقرؤها عامل الخدمة أصلاً.
const C = 'hissati-v3';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(['/', '/icon.png'])).catch(() => { }).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C && k !== 'hissati-rem').map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {                // الشبكة أولاً (أحدث نسخة دائماً)، والنسخة المحفوظة عند انقطاع الإنترنت. واجهة البيانات (/v1/) لا تُخزَّن أبداً
  const r = e.request, u = new URL(r.url); if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/v1/')) return;
  const key = r.mode === 'navigate' || u.pathname === '/' || u.pathname === '/index.html' ? '/' : u.pathname === '/icon.png' ? '/icon.png' : null; if (!key) return;
  e.respondWith(fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(C).then((c) => c.put(key, cp)); } return res; }).catch(() => caches.match(key)));
});
// نوع الإشعار يُسأل عنه من المحطة بعنوان الاشتراك (بلا محتوى عبر Google/Apple): تذكير ماء/وجبة، منشور تثقيفي، أو جديد من الأخصائي.
// أوقات التذكير يحفظها التطبيق هنا (hissati-rem) فيُعرض نص التذكير الأقرب للوقت الحالي.
async function remText() {                                   // كل البنود القريبة من الوقت الحالي (ضمن 8 دقائق من الأقرب) فيصل إشعار واحد جامع، لا إشعاران
  try {
    const r = await (await caches.open('hissati-rem')).match('/rem'); if (!r) return null; const d = new Date(), dk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), it = ((await r.json()).items || []).filter((x) => !x.d || x.d === dk), m = d.getHours() * 60 + d.getMinutes();
    const near = it.map((x) => ({ x, d: Math.min(Math.abs(x.m - m), 1440 - Math.abs(x.m - m)) })).filter((o) => o.d <= 25).sort((a, b) => a.d - b.d); if (!near.length) return null;
    return near.filter((o) => o.d <= near[0].d + 8).map((o) => o.x);
  } catch (e) { return null; }
}
const REMT = (x) => x.t === 'appt' ? '📅 غداً موعد متابعتك ' + (x.label || '') + ' — أكّده من «حصتي»' : x.t === 'wk' ? '⚖ غداً موعد قياسك الأسبوعي — على الريق بعد دخول الحمام' : x.t === 'water' ? '💧 وقت كوب ماء — سجّله في «حصتي»' : x.t === 'adhAm' ? '📿 أذكار الصباح — ابدأ يومك بذكر الله' : x.t === 'adhPm' ? '🌙 أذكار المساء — حصّن مساءك بذكر الله' : x.t === 'med' ? '💊 موعد دوائك' + (x.label ? ' — ' + x.label : '') : '🍽 حان وقت ' + (x.label || 'وجبتك') + ' — افتح خطتك';
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let kind = 'msg';
    try { const sub = await self.registration.pushManager.getSubscription(); if (sub) kind = (await (await fetch('/v1/push/last?ep=' + encodeURIComponent(sub.endpoint), { cache: 'no-store' })).json()).kind || 'msg'; } catch (x) { }
    const rems = kind === 'rem' ? await remText() : null; if (kind === 'rem' && !rems) return; const rem = rems ? rems[0] : null;           // تذكير أُلغي من الجوال: لا شيء
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const body = rems ? rems.map(REMT).join('\n') : kind === 'feed' ? '📣 منشور تثقيفي جديد من أخصائيك' : 'لديك جديد من أخصائيك — افتح «حصتي»';
    cl.forEach((c) => c.postMessage(rem ? { t: 'rem', text: body, items: rems } : { t: 'push', kind }));          // التطبيق المفتوح يجلب الجديد فوراً (أو يعرض التذكير)
    if (cl.some((c) => c.visibilityState === 'visible')) return;          // ظاهر أمام المستخدم: يكفي التنبيه داخل التطبيق
    await self.registration.showNotification(rem ? '⏰ ' + (rems.length > 1 ? 'تذكيراتك' : rem.t === 'med' ? 'موعد دوائك' : rem.t === 'adhAm' ? 'أذكار الصباح' : rem.t === 'adhPm' ? 'أذكار المساء' : rem.t === 'water' ? 'وقت الماء' : 'وقت وجبتك') : 'حصتي', Object.assign({ body, icon: '/icon.png', badge: '/icon.png', tag: rem ? 'hissati-rem' : 'hissati', renotify: true, lang: 'ar', dir: 'rtl' }, rem ? { requireInteraction: true, vibrate: [300, 120, 300, 120, 500], data: { items: rems } } : {}));
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close(); const its = e.notification.data && e.notification.data.items;
  e.waitUntil((async () => { if (its && its.length) { try { await (await caches.open('hissati-rem')).put('/alarm', new Response(JSON.stringify({ items: its, at: Date.now() }), { headers: { 'content-type': 'application/json' } })); } catch (x) { } } })().then(() =>self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => { const c = cl.find((x) => 'focus' in x); return c ? c.focus() : self.clients.openWindow('/'); })));
});
