// الدخول بالبريد في «زنها Pro» (0.96): الموقع خلف Cloudflare Access يعطي رخصة البريد من /api/lic. أخصائي جديد يختار كلمة سر للجهاز،
// وغير المسجّل والمنتهي يريان رسالة واضحة، والمرتبط بحسابه القديم يكتب كلمة سره القديمة مرة فتبقى بياناته، وبلا Access يعمل الدخول القديم
const assert = require('assert'), fs = require('fs'), http = require('http'), { chromium } = require('playwright'), setup = require('./user_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const b = await chromium.launch(), S = await setup(b), A = S.A, html = fs.readFileSync(S.USERS); let LIC = { s: 401, j: { ok: false, code: 'access' } };
  const srv = http.createServer((q, r) => { if (q.url.startsWith('/api/lic')) { r.writeHead(LIC.s, { 'content-type': 'application/json' }); return r.end(JSON.stringify(LIC.j)); } r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';
  const sign = (pl) => A.evaluate((x) => HSec.sign(HAD.priv, x), pl), t0 = Math.floor(Date.now() / 1000);
  const lic = async (em, name, days, lu) => { const pl = { v: 1, t: 'em', u: 'em:' + em, em, n: name, iat: t0, exp: days ? t0 + days * 86400 : 0 }; if (lu) pl.lu = lu; return { s: 200, j: { ok: true, email: em, name, lic: await sign(pl) } }; };
  // 1) بلا Access (401): الدخول القديم كما هو
  const U = await S.mk('u'); await U.goto(URL0); await U.waitForSelector('#devId'); ok('بلا Cloudflare Access: تظهر شاشة التفعيل القديمة كما هي');
  // 2) بريد غير مسجّل
  LIC = { s: 403, j: { ok: false, code: 'none', email: 'who@x.com', error: 'بريدك غير مضاف إلى «زنها Pro»' } }; await U.reload(); await U.waitForSelector('#emOld');
  assert(/لم يُفعَّل حسابك/.test(await U.textContent('body')) && /who@x.com/.test(await U.textContent('body'))); await U.click('#emOld'); await U.waitForSelector('#devId'); ok('بريد غير مسجّل: رسالة واضحة باسم البريد، وزر للدخول بالطريقة القديمة');
  // 3) أخصائي جديد: يختار كلمة سر للجهاز ثم يدخل؛ وبعد إعادة التحميل تُطلب كلمة السر فقط
  LIC = await lic('new@x.com', 'د. جديد', 30); const N = await S.mk('n'); await N.goto(URL0); await N.waitForSelector('#ep2'); assert(/مرحباً د. جديد/.test(await N.textContent('body')));
  await N.fill('#ep', 'short'); await N.fill('#ep2', 'short'); await N.click('#ebtn'); await N.waitForFunction((t) => new RegExp(t).test(document.querySelector('#eerr').textContent), '8 أحرف', { timeout: 15000 });
  await N.fill('#ep', 'MyDevice#2026'); await N.fill('#ep2', 'MyDevice#2026'); await N.click('#ebtn'); await N.waitForSelector('aside .sidebtn', { state: 'attached' });
  await N.evaluate(() => DPApp.A.new('ex')); await N.fill('[data-f="name"]', 'عميل جديد'); await N.waitForTimeout(800);
  await N.reload(); await N.waitForSelector('#ep'); assert.strictEqual(await N.locator('#ep2').count(), 0); await N.fill('#ep', 'wrong-pass'); await N.click('#ebtn'); await N.waitForFunction((t) => new RegExp(t).test(document.querySelector('#eerr').textContent), 'غير صحيحة', { timeout: 15000 }); await N.waitForTimeout(2200);
  await N.fill('#ep', 'MyDevice#2026'); await N.click('#ebtn'); await N.waitForSelector('aside .sidebtn', { state: 'attached' }); assert(await N.evaluate(() => DPApp.S.clients.some((c) => c.name === 'عميل جديد')));
  ok('أخصائي جديد بالبريد: يختار كلمة سر للجهاز (8 أحرف وتأكيد)، يدخل ويضيف عميلاً، وبعد إعادة التحميل يدخل بكلمة السر فقط وعميله موجود');
  // 4) اشتراك منتهٍ
  LIC = await lic('new@x.com', 'د. جديد', -1); await N.reload(); await N.waitForSelector('#emOld'); assert(/انتهى اشتراكك/.test(await N.textContent('body'))); ok('الاشتراك المنتهي: رسالة «انتهى اشتراكك» ولا دخول');
  // 4ب) بلغ حد الأجهزة: رسالة واضحة، والطلب يحمل رمز الجهاز واسمه
  let lastQ = ''; srv.removeAllListeners('request'); srv.on('request', (q, r) => { if (q.url.startsWith('/api/lic')) { lastQ = q.url; r.writeHead(LIC.s, { 'content-type': 'application/json' }); return r.end(JSON.stringify(LIC.j)); } r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
  LIC = { s: 403, j: { ok: false, code: 'devices', email: 'new@x.com', max: 2, error: 'بلغت حد الأجهزة المسموح لك (2). اطلب من الإدارة تحرير جهاز قديم ثم أعد المحاولة.' } }; await N.reload(); await N.waitForSelector('#emOld');
  assert(/بلغت حد الأجهزة/.test(await N.innerText('body'))); assert(/[?&]d=[A-Za-z0-9_-]{6,}/.test(lastQ) && /[?&]l=/.test(lastQ), lastQ); ok('بلوغ حد الأجهزة: رسالة «بلغت حد الأجهزة»، والتطبيق يرسل رمز جهازه واسمه');
  // 5) أخصائي قديم رُبط بريده بحسابه: بياناته تبقى
  LIC = { s: 401, j: {} }; const O = await S.mk('o'); await O.goto(URL0); await O.waitForSelector('#devId'); const dev = (await O.textContent('#devId')).trim(), tok = await S.issue(dev);
  await O.fill('#actCode', tok); await O.click('#actBtn'); await O.waitForSelector('#lu'); await O.fill('#lu', 'sara'); await O.fill('#lp', S.pw); await O.click('#lbtn'); await O.waitForSelector('aside .sidebtn', { state: 'attached' });
  await O.evaluate(() => DPApp.A.new('ex')); await O.fill('[data-f="name"]', 'عميلة سارة القديمة'); await O.waitForTimeout(800);
  LIC = await lic('sara@x.com', 'سارة', 30, 'sara'); await O.reload(); await O.waitForSelector('#ep'); assert(/رُبط بريدك بحسابك السابق/.test(await O.textContent('body')));
  await O.fill('#ep', 'not-her-pass'); await O.click('#ebtn'); await O.waitForFunction((t) => new RegExp(t).test(document.querySelector('#eerr').textContent), 'غير صحيحة', { timeout: 15000 }); await O.waitForTimeout(4200);
  await O.fill('#ep', S.pw); await O.click('#ebtn'); await O.waitForSelector('aside .sidebtn', { state: 'attached' }); assert(await O.evaluate(() => DPApp.S.clients.some((c) => c.name === 'عميلة سارة القديمة')), 'ضاعت بيانات الحساب القديم');
  await O.reload(); await O.waitForSelector('#ep'); await O.waitForFunction(() => !/رُبط بريدك/.test(document.body.innerText) && document.querySelector('#ep'), null, { timeout: 15000 }); await O.fill('#ep', S.pw); await O.click('#ebtn'); await O.waitForSelector('aside .sidebtn', { state: 'attached' }); assert(await O.evaluate(() => DPApp.S.clients.some((c) => c.name === 'عميلة سارة القديمة')));
  ok('أخصائي قديم رُبط بريده بحسابه: يكتب كلمة سره المعتادة مرة واحدة فتبقى عملاؤه، وبعدها يدخل ببريده وكلمة الجهاز');
  assert.deepStrictEqual(S.errs.filter((e) => !/Failed to load|401|403/.test(e)), []); await b.close(); srv.close(); console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1500)); process.exit(1); });
