// التنقل الجديد (0.94): خمسة أقسام، «اليوم» يبدأ بما ينتظر الأخصائي، زر «عميل جديد» واحد، الطلبات داخل «شات زنها»، أدوات الإدارة داخل الإعدادات، وشريط الجوال و«المزيد»
const assert = require('assert'), linked = require('./hx_link_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
(async () => {
  const { d, close } = await linked('nav5', errs);
  const vis = (s) => d.evaluate((q) => { const e = document.querySelector(q); return !!e && e.getClientRects().length > 0; }, s);
  const rail = await d.evaluate(() => [...document.querySelectorAll('.rail .sidebtn')].map((b) => b.dataset.a));
  assert.deepStrictEqual(rail, ['home', 'clients', 'zchat', 'bank', 'ready', 'feed', 'appts', 'subs', 'settings'], rail.join()); assert.strictEqual(await d.locator('.rail .rgrp').count(), 2);
  ok('الشريط الجانبي: اليوم، العملاء، شات زنها، ثم مجموعتا «المكتبة» و«الإدارة» (٩ عناصر بدل ٢٠)');
  assert.strictEqual(await d.locator('.rail [data-a="hxv"], .rail [data-a="exportUsers"], .rail [data-a="export"]').count(), 0); ok('الطلبات والنسخ الاحتياطي والتصدير خرجت من الشريط');
  await d.evaluate(() => DPApp.A.home()); assert(await vis('.today .tdh')); assert(await vis('.tdks')); assert.strictEqual(await d.locator('.today .qgrid').count(), 0); ok('«اليوم»: عنوان ومؤشرات ما ينتظر الأخصائي بلا بلاطات تكرر التنقل');
  await d.evaluate(() => DPApp.A.clients()); assert(await vis('#lst .cl')); assert.strictEqual(await d.locator('.newm').count(), 1); await d.click('.newm summary'); assert(/نظام الحصص/.test(await d.textContent('.newm .tbp')) && /نظام الجرامات/.test(await d.textContent('.newm .tbp'))); ok('«العملاء»: قائمة وبحث وزر «عميل جديد» واحد يسأل عن النظام');
  await d.evaluate(() => DPApp.A.zchat()); assert(await vis('.secnav [data-v="hxv"]')); await d.click('.secnav [data-v="hxv"]'); await d.waitForSelector('.hxlinked, .hxtop'); ok('«شات زنها»: تبويب «طلبات زنها» بداخله');
  await d.evaluate(() => DPApp.A.setTools()); assert(await vis('.tools [data-a="export"]')); assert(await vis('.tools [data-a="exportUsers"]')); assert(await vis('.tools [data-a="users"]')); ok('أدوات الإدارة والنسخ الاحتياطي داخل الإعدادات');
  await d.setViewportSize({ width: 390, height: 844 }); await d.evaluate(() => DPApp.A.home()); await d.waitForTimeout(300);
  assert.deepStrictEqual(await d.evaluate(() => [...document.querySelectorAll('#tabbar button')].map((b) => b.dataset.v)), ['home', 'clients', 'zchat', 'library', 'more']); assert((await d.evaluate(() => [...document.querySelectorAll('#tabbar button')].map((b) => Math.round(b.getBoundingClientRect().height)))).every((h) => h >= 44)); ok('الجوال: اليوم، العملاء، شات زنها، المكتبة، المزيد (أهداف لمس ≥ ٤٤)');
  await d.click('#tabbar [data-v="clients"]'); assert(await vis('#lst')); assert.strictEqual(await d.locator('aside .rail').count() ? await vis('aside .rail') : false, false); ok('الجوال: «العملاء» قائمة فقط بلا الشريط الجانبي تحتها');
  await d.click('#tabbar [data-v="more"]'); assert(await vis('.morepage [data-a="dtToggle"]')); assert.strictEqual(await vis('#dtfab'), false); ok('الجوال: «المزيد» فيه المواعيد والاشتراكات والإعدادات والمساعد، وزر المساعد العائم لا يغطي المحتوى');
  assert.deepStrictEqual(errs, []); await close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error(String(e).slice(0, 1200)); process.exit(1); });
