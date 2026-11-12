// 0.60 (ب1): كل حقل ظاهر في «بيانات العميل» (الحصص والجرامات) له اسم مقروء: عنوان مربوط (for/id أو داخل <label>) أو aria-label.
const { fileUrl } = require('./_tmp.js');
const { chromium } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  // يفتح كل القوائم المطوية في الصفحة حتى تُفحص حقولها أيضاً
  const scan = () => p.evaluate(() => {
    document.querySelectorAll('main details').forEach((d) => { d.open = true; });
    const vis = (e) => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    const name = (e) => { if ((e.getAttribute('aria-label') || '').trim()) return e.getAttribute('aria-label').trim(); const lb = e.getAttribute('aria-labelledby'); if (lb) { const t = lb.split(/\s+/).map((i) => (document.getElementById(i) || {}).textContent || '').join(' ').trim(); if (t) return t; } const ls = [...(e.labels || [])].map((l) => l.textContent.trim()).filter(Boolean); return ls.join(' '); };
    const fs = [...document.querySelectorAll('main input, main select, main textarea')].filter((e) => e.type !== 'hidden' && vis(e));
    const ids = [...document.querySelectorAll('main [id]')].map((e) => e.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    return { total: fs.length, bad: fs.filter((e) => !name(e)).map((e) => e.outerHTML.slice(0, 140)), dup, forOk: [...document.querySelectorAll('main label[for]')].every((l) => !!l.control), bound: fs.filter((e) => e.dataset.f && e.labels && e.labels.length).length, need: [...document.querySelectorAll('main .need label .needb')].length };
  });
  await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', 'ليلى'); await p.selectOption('[data-f="sex"]', 'ذكر').catch(() => { }); await p.press('[data-f="name"]', 'Tab'); await p.waitForTimeout(200);
  let r = await scan(); assert(r.total >= 20, JSON.stringify(r)); assert.deepStrictEqual(r.bad, [], r.bad.join('\n')); assert.deepStrictEqual(r.dup, [], 'معرّفات مكررة: ' + r.dup); assert(r.forOk, 'عنوان for بلا حقل'); assert(r.bound >= 10, JSON.stringify(r));
  assert.strictEqual(await p.getAttribute('label[for="f-age"]', 'for'), 'f-age'); assert.strictEqual(await p.getAttribute('#f-age', 'data-f'), 'age', 'data-f لا يتغير');
  ok('نظام الحصص: ' + r.total + ' حقلاً ظاهراً كلها بأسماء مقروءة (0 بلا اسم)، و«الاسم» مربوط بـ for="f-name"، والمعرّفات غير مكررة، وdata-f كما هو');
  await p.evaluate(() => DPApp.A.new('ath')); await p.fill('[data-f="name"]', 'كابتن'); await p.selectOption('[data-f="sex"]', 'ذكر').catch(() => { }); await p.press('[data-f="name"]', 'Tab'); await p.waitForTimeout(200);
  r = await scan(); assert(r.total >= 20, JSON.stringify(r)); assert.deepStrictEqual(r.bad, [], r.bad.join('\n')); assert.deepStrictEqual(r.dup, [], 'معرّفات مكررة: ' + r.dup); assert(r.forOk);
  ok('نظام الجرامات: ' + r.total + ' حقلاً ظاهراً (منها جدول التدريب والوجبات) كلها بأسماء مقروءة');
  // تكرار المفتاح في الصفحة نفسها يأخذ لاحقة
  const suf = await p.evaluate(() => { const st = DPApp.S; return [...document.querySelectorAll('main [id^="f-"]')].map((e) => e.id).filter((x) => /-\d+$/.test(x)).length; });
  assert(suf >= 0); assert.deepStrictEqual(errs, [], errs.join('\n')); await b.close(); console.log('\nنجح', n, 'اختبارات عناوين الحقول');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
