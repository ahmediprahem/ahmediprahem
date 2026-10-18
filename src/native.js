/* جسر التطبيق الأصلي (Capacitor): يكتشف البيئة تلقائياً. في المتصفح يعمل كل شيء كما كان؛ داخل تطبيق أندرويد/آيفون يحفظ الملفات ويشاركها بالطريقة الأصلية.
   يعتمد على window.Capacitor.Plugins (يعمل بلا حزمة bundler): Filesystem, Share, Device, App, Browser. */
(function (root) {
  'use strict';
  var N = {}, cap = function () { return root.Capacitor || null; };
  N.isNative = function () { var c = cap(); return !!(c && (c.isNativePlatform ? c.isNativePlatform() : (c.getPlatform && c.getPlatform() !== 'web'))); };
  N.platform = function () { var c = cap(); return c && c.getPlatform ? c.getPlatform() : 'web'; };
  N.plugin = function (n) { var c = cap(); return (c && c.Plugins && c.Plugins[n]) || null; };
  N.toBase64 = async function (blob) { var u = new Uint8Array(await blob.arrayBuffer()), s = '', CH = 0x8000; for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); };
  var safeName = function (n) { return String(n || 'file').replace(/[\\/:*?"<>|\s]+/g, '_'); };
  // حفظ ملف ثم فتح ورقة المشاركة (واتساب، بريد، «حفظ في الملفات»…). يعيد null إن لم تكن البيئة أصلية فيُستعمل التنزيل العادي.
  N.saveFile = async function (blob, name) {
    var FS = N.plugin('Filesystem'), SH = N.plugin('Share'); if (!N.isNative() || !FS) return null;
    var w = await FS.writeFile({ path: 'hissa/' + Date.now() + '_' + safeName(name), data: await N.toBase64(blob), directory: 'CACHE', recursive: true });
    var shared = false; if (SH) { try { await SH.share({ title: name, text: name, url: w.uri, dialogTitle: 'مشاركة أو حفظ الملف' }); shared = true; } catch (e) { shared = !/cancel/i.test(String(e && e.message || e)) ? false : true; } }
    return { native: true, uri: w.uri, shared: shared };
  };
  // مشاركة رابط/نص: أصلياً عبر Share، وفي المتصفح عبر Web Share أو النسخ.
  N.share = async function (o) {
    var SH = N.plugin('Share'); if (N.isNative() && SH) { try { await SH.share({ title: o.title, text: o.text, url: o.url, dialogTitle: o.title }); return 'shared'; } catch (e) { return 'cancel'; } }
    if (root.navigator && root.navigator.share) { try { await root.navigator.share({ title: o.title, text: o.text, url: o.url }); return 'shared'; } catch (e) { return 'cancel'; } }
    if (root.navigator && root.navigator.clipboard && o.url) { await root.navigator.clipboard.writeText(o.url); return 'copied'; } return 'none';
  };
  N.openUrl = function (url) { var B = N.plugin('Browser'); if (N.isNative() && B) return B.open({ url: url }); if (root.open) root.open(url, '_blank', 'noopener'); return Promise.resolve(); };
  // معرّف جهاز مستقر لربط التفعيل: أندرويد (ANDROID_ID) وآيفون (identifierForVendor) مُجزَّأ بـ SHA-256؛ لا يُكشف المعرّف الخام. null خارج التطبيق.
  N.deviceId = async function () {
    var D = N.plugin('Device'); if (!N.isNative() || !D) return null; var r = await D.getId(), raw = r && (r.identifier || r.uuid); if (!raw) return null;
    var h = new Uint8Array(await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode('hissa|' + N.platform() + '|' + raw))), s = ''; for (var i = 0; i < 12; i++) s += String.fromCharCode(h[i]);
    return 'N' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 15);
  };
  N.appInfo = async function () { var A = N.plugin('App'); if (!N.isNative() || !A || !A.getInfo) return null; try { var i = await A.getInfo(); return { version: i.version || '', build: i.build || '' }; } catch (e) { return null; } };
  N.cmpVersion = function (a, b) { var x = String(a || '0').split('.').map(Number), y = String(b || '0').split('.').map(Number); for (var i = 0; i < Math.max(x.length, y.length); i++) { var d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; };
  if (typeof module !== 'undefined' && module.exports) module.exports = N; else root.HNative = N;
})(typeof window !== 'undefined' ? window : globalThis);
