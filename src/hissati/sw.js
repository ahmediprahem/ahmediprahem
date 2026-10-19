// عامل الخدمة لـ«حصتي» (تقدّمه المحطة على /sw.js): إشعارات والتطبيق مغلق، وفتح سريع وبلا إنترنت.
// الإشعار بلا محتوى عمداً: لا تمر بيانات صحية عبر خدمات الإشعارات؛ والبيانات نفسها مشفّرة برمز الدخول فلا يقرؤها عامل الخدمة أصلاً.
const C = 'hissati-v2';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(['/', '/icon.png'])).catch(() => { }).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {                // الشبكة أولاً (أحدث نسخة دائماً)، والنسخة المحفوظة عند انقطاع الإنترنت. واجهة البيانات (/v1/) لا تُخزَّن أبداً
  const r = e.request, u = new URL(r.url); if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/v1/')) return;
  const key = r.mode === 'navigate' || u.pathname === '/' || u.pathname === '/index.html' ? '/' : u.pathname === '/icon.png' ? '/icon.png' : null; if (!key) return;
  e.respondWith(fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(C).then((c) => c.put(key, cp)); } return res; }).catch(() => caches.match(key)));
});
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cl.forEach((c) => c.postMessage({ t: 'push' }));                       // التطبيق المفتوح يجلب الجديد فوراً
    if (cl.some((c) => c.visibilityState === 'visible')) return;          // ظاهر أمام المستخدم: يكفي التنبيه داخل التطبيق
    await self.registration.showNotification('حصتي', { body: 'لديك جديد من أخصائيك — افتح «حصتي»', icon: '/icon.png', badge: '/icon.png', tag: 'hissati', renotify: true, lang: 'ar', dir: 'rtl' });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => { const c = cl.find((x) => 'focus' in x); return c ? c.focus() : self.clients.openWindow('/'); }));
});
