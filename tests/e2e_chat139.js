// 1.39 (بلاغ المالك بصورتين): ألوان «شات زنها» في النهاري والليلي — كان مصمماً بخلفيات داكنة ثابتة من الزجاجي، وصفوفه تأخذ لون الزر الأساسي (Teal بنص كحلي).
// الآن: سطوح ونصوص من الرموز الدلالية، وصفوف المحادثات بلا لون الزر، وكل نصوص القائمة والمحادثة ≥ 4.5:1 على الجوال والحاسوب في الوضعين.
const { fileUrl } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const assert = require('assert'), path = require('path'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
const audit = (p) => p.evaluate(() => {
  const L = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const bg = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor, a = /rgba/.test(c) ? +c.match(/[\d.]+/g)[3] : 1; if (a >= 0.5) return c; e = e.parentElement; } return 'rgb(255, 255, 255)'; };
  const els = [...document.querySelectorAll('.chwrap b, .chwrap small, .chb, .chtm, .chsep span, .chlbar b, .chwrap .tabs > button')].filter((e) => e.getClientRects().length && e.textContent.trim());
  const low = els.map((e) => { const a = L(getComputedStyle(e).color), c = L(bg(e)); return [e.textContent.trim().slice(0, 18), Math.round((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05) * 100) / 100]; }).filter((x) => x[1] < 4.5);
  const row = document.querySelector('.chrow'); return { low, n: els.length, rowBg: row ? getComputedStyle(row).backgroundColor : null };
});
(async () => {
  const br = await chromium.launch();
  for (const mode of ['light', 'dark']) for (const dev of ['mobile', 'desktop']) {
    const ctx = await br.newContext(dev === 'mobile' ? { ...devices['iPhone 13'], reducedMotion: 'reduce' } : { viewport: { width: 1366, height: 820 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
    await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
    if (mode === 'dark') { await p.click('#hd .dwbtn'); await p.waitForFunction(() => document.documentElement.dataset.dw === 'dark'); }
    for (const [nm, sx] of [['هاجر', 'أنثى'], ['خالد الراجحي', 'ذكر'], ['أماني هشام', 'أنثى']]) { await p.evaluate(() => DPApp.A.new('ex')); await p.fill('[data-f="name"]', nm); await p.selectOption('[data-f="sex"]', sx); await p.press('[data-f="name"]', 'Tab'); }
    await p.evaluate(() => { const t = Date.now(); DPApp.S.clients.forEach((c, i) => { c.hx = { cid: 'c' + i, enc: 'x', tok: 'x', label: c.name, msgs: i === 0 ? [{ from: 'c', t: 'السلام عليكم ورحمة الله وبركاته', ts: t - 60000 }, { from: 'c', t: 'بغى استفسر عن شيء', ts: t - 58000 }, { from: 'd', t: 'وعليكم السلام معاك', ts: t - 50000, rd: 1 }] : i === 1 ? [{ from: 'c', t: 'الريك مش شغال', ts: t - 86400000 }] : [], unread: i === 1 ? 1 : 0, logs: {}, planV: 2 }; }); DPApp.A.zchat(); });
    await p.waitForSelector('.chrow'); let a = await audit(p);
    assert.deepStrictEqual(a.low, [], mode + ' ' + dev + ' القائمة: ' + JSON.stringify(a.low)); assert(a.n >= 6); assert.notStrictEqual(a.rowBg, 'rgb(40, 126, 145)', 'الصف بلون الزر الأساسي');
    await p.evaluate(() => DPApp.A.czOpen(DPApp.S.clients[0].code)); await p.waitForSelector('.chb'); a = await audit(p); assert.deepStrictEqual(a.low, [], mode + ' ' + dev + ' المحادثة: ' + JSON.stringify(a.low));
    ok((mode === 'light' ? 'النهاري' : 'الليلي') + ' — ' + (dev === 'mobile' ? 'الجوال' : 'الحاسوب') + ': قائمة المحادثات والفقاعات والأوقات مقروءة (≥ 4.5:1)، والصفوف بلا لون الزر');
    await ctx.close();
  }
  assert.deepStrictEqual(errs, [], errs.join('\n')); await br.close(); console.log('\nنجح ' + n + ' اختبارات ألوان شات زنها 1.39');
})().catch((e) => { console.log('✘', e.message.slice(0, 1500)); console.log(errs.join('\n')); process.exit(1); });
