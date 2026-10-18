// يجهّز مدير + مستخدم «sara» + ملف المستخدمين، ويفعّل جهاز المستخدم (للاختبارات والتصوير). يعيد {A, mkUser, USERS, dev}.
const { TMP, fileUrl, PY } = require('./_tmp.js');
const path = require('path'), login = require('./auth_helper');
module.exports = async function setup(browser, opts = {}) {
  const ADMIN = fileUrl(path.resolve(__dirname, '../admin.html')), USERS = opts.users || TMP + '/hissa_users_h.html', pw = opts.pw || 'Sara#pass2026', errs = [];
  const wire = (p, tag) => { p.on('pageerror', e => errs.push(tag + ':' + e)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(tag + ':' + m.text()); }); p.on('dialog', d => d.accept()); };
  const mk = async (tag, ctxOpts = {}) => { const c = await browser.newContext(Object.assign({ acceptDownloads: true, viewport: { width: 1300, height: 950 } }, ctxOpts)), p = await c.newPage(); wire(p, tag); p.ctx = c; return p; };
  const A = await mk('admin'); await A.goto(ADMIN); await login(A);
  await A.click('button:has-text("المستخدمون والأجهزة")'); await A.waitForSelector('#ua_user'); await A.fill('#ua_user', 'sara'); await A.fill('#ua_name', 'سارة'); await A.fill('#ua_pw', pw); await A.click('[data-ha="uadd"]'); await A.waitForSelector('.ucard:has-text("سارة")');
  const [dl] = await Promise.all([A.waitForEvent('download'), A.click('button:has-text("تصدير نسخة المستخدمين")')]); await dl.saveAs(USERS);
  const issue = async (dev, days = '30') => { await A.click('button:has-text("المستخدمون والأجهزة")'); await A.waitForSelector('#ui_sara_dev'); await A.evaluate(() => document.querySelectorAll('.toast').forEach(x => x.remove())); await A.fill('#ui_sara_dev', dev); await A.selectOption('#ui_sara_days', days); await A.click('[data-ha="uissue"][data-u="sara"]'); await A.waitForSelector('#lastTok'); return A.inputValue('#lastTok'); };
  // يفتح ملف المستخدمين على صفحة جديدة، ويفعّل الجهاز، ويصل إلى شاشة الدخول
  const activated = async (tag, ctxOpts) => { const U = await mk(tag, ctxOpts); await U.goto(fileUrl(USERS)); await U.waitForSelector('#devId'); const dev = (await U.textContent('#devId')).trim(), tok = await issue(dev); await U.fill('#actCode', tok); await U.click('#actBtn'); await U.waitForSelector('#lu'); return U; };
  return { A, mk, USERS, pw, errs, issue, activated };
};
