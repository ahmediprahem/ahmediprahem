// عامل خدمة «زنها Pro» على موقع الأخصائيين (يُضاف إلى «تصدير موقع للنشر» باسم sw.js): إشعارات «زنها» والموقع مغلق.
// بلا تخزين مؤقت عمداً: كل تحديث ترفعه للموقع يصل الأخصائيين فوراً. والإشعار بلا محتوى؛ «زنها Pro» تجلب الرسائل المشفّرة بنفسها عند الفتح.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cl.forEach((c) => c.postMessage({ t: 'hxpush' }));                    // «زنها Pro» المفتوحة تتحقق فوراً
    if (cl.some((c) => c.visibilityState === 'visible')) return;
    await self.registration.showNotification('حصة', { body: 'جديد من عملاء «زنها»: طلب أو رسالة', icon: 'icon.png', badge: 'icon.png', tag: 'hissa', renotify: true, lang: 'ar', dir: 'rtl' });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => { const c = cl.find((x) => 'focus' in x); return c ? c.focus() : self.clients.openWindow('./'); }));
});
