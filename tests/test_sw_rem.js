'use strict';
// نص إشعار التذكير في عامل الخدمة: بنود قريبة من الوقت تُجمع في إشعار واحد، والبعيدة تُهمل، والدواء باسمه، وتذكير أُلغي لا يُظهر شيئاً.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', String(e.stack || e.message).slice(0, 400)); process.exitCode = 1; } };
const src = fs.readFileSync(path.join(__dirname, '../src/hissati/sw.js'), 'utf8');
function run(items, kind, visible) {
  const shown = [], handlers = {}, sent = [], puts = [];
  const self = { addEventListener: (k, f) => { handlers[k] = f; }, registration: { pushManager: { getSubscription: async () => ({ endpoint: 'https://x/e' }) }, showNotification: async (title, o) => { shown.push({ title, ...o }); } }, clients: { openWindow: async () => ({}), matchAll: async () => visible ? [{ visibilityState: 'visible', postMessage: (m) => sent.push(m) }] : [{ visibilityState: 'hidden', postMessage: (m) => sent.push(m) }], claim: async () => { } }, skipWaiting: async () => { } };
  const caches = { open: async () => ({ match: async () => items ? { json: async () => ({ items }) } : undefined, put: async (k, r) => { puts.push([k, r]); }, addAll: async () => { } }), keys: async () => [], delete: async () => true, match: async () => undefined };
  const ctx = { self, caches, Response, fetch: async () => ({ json: async () => ({ kind }) }), URL, Date, Promise, encodeURIComponent, location: { origin: 'https://x' }, console };
  vm.runInNewContext(src, ctx); let p; handlers.push({ waitUntil: (x) => { p = x; } }); return p.then(() => ({ shown, sent, puts, handlers }));
}
const nowM = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }, wrap = (m) => ((m % 1440) + 1440) % 1440;
(async () => {
  await t('أذكار الصباح والدواء في نفس الوقت: إشعار واحد جامع، والماء بعد ساعة لا يظهر', async () => {
    const m = nowM(), r = await run([{ m, t: 'adhAm' }, { m: wrap(m + 5), t: 'med', label: 'فيتامين د' }, { m: wrap(m + 60), t: 'water' }], 'rem', false);
    assert.strictEqual(r.shown.length, 1); const b = r.shown[0].body; assert(b.includes('أذكار الصباح') && b.includes('💊 موعد دوائك — فيتامين د') && !b.includes('كوب ماء'), b); assert.strictEqual(r.shown[0].tag, 'hissati-rem');
  });
  await t('أذكار المساء والدواء بلا اسم', async () => {
    const m = nowM(); let r = await run([{ m, t: 'adhPm' }], 'rem', false); assert(r.shown[0].body.includes('أذكار المساء'));
    r = await run([{ m, t: 'med', label: '' }], 'rem', false); assert.strictEqual(r.shown[0].body, '💊 موعد دوائك');
  });
  await t('تذكير ماء ووجبة كما كان', async () => {
    const m = nowM(); let r = await run([{ m, t: 'water' }], 'rem', false); assert(r.shown[0].body.includes('كوب ماء')); r = await run([{ m, t: 'meal', label: 'الغداء' }], 'rem', false); assert(r.shown[0].body.includes('حان وقت الغداء'));
  });
  await t('لا بند قريب (ألغاه العميل) أو لا بيانات: لا إشعار', async () => { const m = nowM(); let r = await run([{ m: wrap(m + 120), t: 'water' }], 'rem', false); assert.strictEqual(r.shown.length, 0); r = await run(null, 'rem', false); assert.strictEqual(r.shown.length, 0); });
  await t('التطبيق ظاهر أمام العميل: يُرسل للتطبيق نصه بلا إشعار نظام', async () => { const m = nowM(), r = await run([{ m, t: 'adhAm' }], 'rem', true); assert.strictEqual(r.shown.length, 0); assert(r.sent[0].t === 'rem' && r.sent[0].text.includes('أذكار الصباح')); });
    await t('إشعار التذكير يبقى على الشاشة ويهتز ويحمل بنوده؛ ولمسه يحفظ البنود لعرض المنبّه بعد الفتح', async () => {
    const m = nowM(), r = await run([{ m, t: 'adhAm' }, { m: wrap(m + 3), t: 'med', label: 'فيتامين د' }], 'rem', false), o = r.shown[0]; assert(o.requireInteraction === true && Array.isArray(o.vibrate) && o.vibrate.length >= 3); assert.strictEqual(o.data.items.length, 2); assert(/⏰/.test(o.title));
    const pr = []; await new Promise((res) => r.handlers.notificationclick({ notification: { close() { }, data: o.data }, waitUntil: (x) => { pr.push(x); x.then(res, res); } })); assert.strictEqual(r.puts.length >= 1 && r.puts[r.puts.length - 1][0], '/alarm'); const j = await r.puts[r.puts.length - 1][1].json(); assert.strictEqual(j.items.length, 2); assert(Math.abs(j.at - Date.now()) < 5000);
  });
  await t('إشعار الرسائل العادي بلا إصرار ولا اهتزاز طويل', async () => { const r = await run([], 'msg', false); assert(!r.shown[0].requireInteraction); });
  console.log('\nنجح', n, 'اختبارات نص تذكيرات عامل الخدمة');
})();
