#!/usr/bin/env node
// ينسخ «ملف المستخدمين» المُصدَّر من لوحة الإدارة (hissa_users.html) إلى www/index.html بعد التحقق أنه الملف الصحيح.
//   الاستعمال:  node scripts/sync-web.js ../hissa_users.html
// يرفض: admin.html (واجهة الإدارة)، وقالب المستخدمين غير المربوط بمدير (ADMIN_PUB=null)، وأي ملف تالف.
'use strict';
const fs = require('fs'), path = require('path');
function inspect(html) {
  const err = [];
  if (!/window\.APP_MODE="user"/.test(html)) err.push('ليس نسخة مستخدمين (APP_MODE ليس "user") — لا تضع admin.html داخل التطبيق');
  if (/window\.APP_MODE="admin"/.test(html)) err.push('الملف يحوي واجهة الإدارة');
  if (/window\.ADMIN_PUB=null;/.test(html)) err.push('الملف غير مربوط بمدير (ADMIN_PUB=null): صدّره من admin.html بزر «تصدير نسخة المستخدمين»');
  const m = /window\.BASE_SETTINGS=(\{.*?\});window\.USER_TPL/s.exec(html); let base = null;
  if (!m) { if (!/window\.BASE_SETTINGS=null;/.test(html)) err.push('تعذّر قراءة BASE_SETTINGS'); } else { try { base = JSON.parse(m[1]); } catch (e) { err.push('BASE_SETTINGS ليس JSON صالحاً'); } }
  if (!/window\.HNative=|root\.HNative/.test(html)) err.push('الملف لا يحوي جسر التطبيق الأصلي (HNative): أعد البناء بـ build_web.py');
  if (!/window\.ATHLETE=/.test(html)) err.push('ينقص نظام الرياضيين (ATHLETE)');
  return { err, base };
}
module.exports = { inspect };
if (require.main === module) {
  const src = process.argv[2]; if (!src) { console.error('الاستعمال: node scripts/sync-web.js <hissa_users.html>'); process.exit(2); }
  const html = fs.readFileSync(path.resolve(src), 'utf8'), r = inspect(html);
  if (r.err.length) { console.error('✘ رُفض الملف:\n - ' + r.err.join('\n - ')); process.exit(1); }
  const out = path.join(__dirname, '..', 'www'); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'index.html'), html);
  const b = r.base || {}, a = b.app || {}, ath = b.ath || { foods: [], hidden: [] };
  console.log('✔ نُسخ إلى www/index.html (' + Math.round(html.length / 1024) + ' كيلوبايت)\n  أصناف رياضيين معتمدة:', (ath.foods || []).length, '| مخفية:', (ath.hidden || []).length, '\n  روابط التطبيق في الإعدادات:', ['apk', 'play', 'ios', 'web'].filter(k => a[k]).join('، ') || 'لا شيء', a.version ? '| الإصدار المعلن: ' + a.version : '');
  console.log('التالي:  npm run sync   ثم   npm run android:open  أو  npm run ios:open');
}
