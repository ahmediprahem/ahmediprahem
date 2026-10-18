#!/usr/bin/env node
// يُنتج admin_initial.html: نسخة من واجهة الإدارة بحساب مدير أولي جاهز (بلا شاشة إعداد)، وملف بيانات الدخول الأولية.
//   الاستعمال:  node make_initial_admin.js [اسم_المستخدم] [كلمة_السر]     (بلا كلمة سر → تُولَّد كلمة قوية عشوائية)
// أمان: كلمة السر لا تُخزَّن في الملف؛ يُخزَّن مفتاح التوقيع مغلَّفاً (PBKDF2 150 ألف دورة + AES-GCM). غيّر الكلمة فور أول دخول، ولا تشارك الملف.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), H = require('./src/sec.js');
(async () => {
  const user = process.argv[2] || 'hamed', alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', rnd = (n) => Array.from(crypto.randomBytes(n), b => alpha[b % alpha.length]).join('');
  const pw = process.argv[3] || (rnd(4) + '-' + rnd(4) + '-' + rnd(4) + '-' + rnd(4));
  if (user.length < 3 || pw.length < 8) { console.error('اسم المستخدم 3 أحرف على الأقل وكلمة السر 8 أحرف على الأقل'); process.exit(2); }
  const k = await H.genKeys(), wrap = await H.wrapPriv(k.priv, pw), seed = { user, wrap, pub: k.pub, saltD: H.b64(H.rand(16)), pwChanged: false };
  const OUT = process.env.HISSA_OUT || __dirname, src = path.join(__dirname, 'admin.html'), out = path.join(OUT, 'admin_initial.html'); fs.mkdirSync(OUT, { recursive: true }); let html = fs.readFileSync(src, 'utf8');
  if (!html.includes('window.ADMIN_SEED=null;')) throw new Error('admin.html لا يحوي موضع ADMIN_SEED — أعد البناء بـ build_web.py');
  html = html.replace('window.ADMIN_SEED=null;', () => 'window.ADMIN_SEED=' + JSON.stringify(seed) + ';');
  fs.writeFileSync(out, html);
  const note = 'بيانات الدخول الأولية للمدير — «حصة»\n==============================\nاسم المستخدم: ' + user + '\nكلمة السر   : ' + pw + '\nالملف       : admin_initial.html\n\n- افتح الملف في Chrome أو Edge، وسجّل الدخول، ثم غيّر كلمة السر فوراً من «👥 المستخدمون والأجهزة ← تغيير كلمة سر المدير».\n- احذف هذا الملف النصي بعد الحفظ في مدير كلمات سر. لا تشارك admin_initial.html مع أحد: من يملك الملف وكلمة السر يستطيع إدارة المستخدمين.\n- تُحفظ بيانات المدير داخل المتصفح الذي تفتحه (التخزين مرتبط بمسار الملف): افتح الملف من المكان نفسه دائماً، وخذ «نسخة احتياطية للإدارة» بعد الدخول.\n';
  fs.writeFileSync(path.join(OUT, 'ADMIN_INITIAL_LOGIN.txt'), note);
  console.log('✔ admin_initial.html (' + Math.round(html.length / 1024) + ' ك.ب)\n  المستخدم:', user, '| كلمة السر الابتدائية:', pw);
})();
