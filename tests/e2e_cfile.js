// ملف العميل الجديد (0.94): رأس ثابت بشارات الاشتراك و«زنها»، خمسة تبويبات، الأسماء القديمة تقود للمكان الصحيح، الحذف داخل «…»، وشريط التبويبات على الجوال
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, close } = await linked('cfile', errs);
  const vis = (s) => d.evaluate((q) => { const e = document.querySelector(q); return !!e && e.getClientRects().length > 0; }, s);
  const tabs = await d.evaluate(() => [...document.querySelectorAll('main .cftabs > button')].map((b) => b.textContent.trim()));
  assert.strictEqual(tabs.length, 5, tabs.join('|')); assert(/الملف/.test(tabs[0]) && /الخطة/.test(tabs[1]) && /المتابعة/.test(tabs[2]) && /المواعيد/.test(tabs[3]) && /الاشتراك/.test(tabs[4])); ok('خمسة تبويبات: الملف، الخطة، المتابعة، المواعيد، الاشتراك');
  assert(await vis('.cfhead .cfname')); assert(/مرتبط/.test(await d.textContent('.cfhead .cfzen'))); assert(await vis('.cfhead .cfsub')); assert(await vis('.cfhead [data-a="cfChat"]')); ok('الرأس: الاسم والكود وشارتا الاشتراك و«زنها» وزر المحادثة');
  assert.strictEqual(await d.locator('main .cftabs [data-a="del"]').count(), 0); await d.click('.cfhead .cmore summary'); assert(await vis('.cfhead .cmore [data-a="del"]')); ok('«حذف العميل» داخل قائمة «…» لا بين التبويبات');
  await d.evaluate(() => DPApp.A.tab('hx')); assert.strictEqual(await d.evaluate(() => DPApp.S.tab), 'day'); await d.evaluate(() => DPApp.A.tab('ver')); assert(await vis('.cfseg')); assert.strictEqual(await d.evaluate(() => DPApp.S.tab), 'ver'); assert(/الإصدارات/.test(await d.textContent('.cfseg'))); ok('الأسماء القديمة: «hx» للمرتبط ← المتابعة اليومية، و«ver» ← الإصدارات داخل «الخطة»');
  for (const t of ['client', 'med', 'plan', 'ci', 'appt', 'sub', 'ph', 'chal', 'link']) { await d.evaluate((k) => DPApp.A.tab(k), t); assert(await vis('.cfbody'), t); assert.strictEqual(await d.evaluate(() => DPApp.S.tab), t); } ok('كل الأقسام التسعة تفتح محتواها');
  await d.evaluate(() => DPApp.A.tab('client')); await d.setViewportSize({ width: 390, height: 844 }); await d.waitForTimeout(300);
  const fit = await d.evaluate(() => [...document.querySelectorAll('main .cftabs > button')].map((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.height >= 44; })); assert(fit.length === 5 && fit.every(Boolean), JSON.stringify(fit)); assert(await d.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); ok('الجوال: التبويبات الخمسة ظاهرة كلها بأهداف لمس كافية بلا تمرير أفقي للصفحة');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(String(e).slice(0, 1200)); process.exit(1); });
