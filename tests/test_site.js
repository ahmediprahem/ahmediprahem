// خادم موقع الأخصائيين (0.96): /api/lic يعيد رخصة البريد المسجّل فقط، والمنتهي والموقوف وغير المسجّل يُرفضون، وبلا Access = 401، وغيره أصول ثابتة
const assert = require('assert'), path = require('path'), fs = require('fs'), d1 = require('./d1_shim.js'), { fileUrl, TMP } = require('./_tmp.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const wf = path.join(TMP, 'site_worker_test.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/site/index.mjs'), wf); const W = await import(fileUrl(wf));
  const db = d1(); await db.prepare('CREATE TABLE specialists (email TEXT PRIMARY KEY, name TEXT, exp INTEGER, status TEXT, lic TEXT, created INTEGER, updated INTEGER, updated_by TEXT, last_seen INTEGER, note TEXT, devmax INTEGER DEFAULT 2)').run(); await db.prepare('CREATE TABLE spdevices (email TEXT NOT NULL, dev TEXT NOT NULL, label TEXT, first INTEGER, last INTEGER, PRIMARY KEY (email, dev))').run();
  const t = Math.floor(Date.now() / 1000); for (const r of [['ok@x.com', 'د. نعم', t + 999, 'active', 'aa.bb'], ['old@x.com', 'منتهٍ', t - 10, 'active', 'cc.dd'], ['off@x.com', 'موقوف', 0, 'off', 'ee.ff'], ['nolic@x.com', 'بلا رخصة', 0, 'active', null]]) await db.prepare('INSERT INTO specialists (email, name, exp, status, lic) VALUES (?, ?, ?, ?, ?)').bind(...r).run();
  const env = { ADB: db, ASSETS: { fetch: async () => new Response('<html>site</html>') } };
  const call = async (email, p = '/api/lic?d=device-aa&l=Android') => { W._test.setVerifier(() => (email ? { email } : null)); const r = await W.default.fetch(new Request('https://hessanu.example' + p), env); if (!p.startsWith('/api/lic')) return { s: r.status, t: await r.text() }; return { s: r.status, j: await r.json().catch(() => ({})) }; };
  assert.strictEqual((await call(null)).s, 401); ok('بلا رمز Access صحيح: 401 (فيعمل الدخول القديم)');
  const g = await call('ok@x.com'); assert.strictEqual(g.s, 200); assert.strictEqual(g.j.lic, 'aa.bb'); assert.strictEqual(g.j.name, 'د. نعم'); assert((await db.prepare("SELECT last_seen FROM specialists WHERE email = 'ok@x.com'").first()).last_seen >= t); ok('البريد المسجّل الفعّال يأخذ رخصته واسمه، ويُسجَّل «آخر دخول»');
  for (const [e, c] of [['who@x.com', 'none'], ['old@x.com', 'expired'], ['off@x.com', 'off'], ['nolic@x.com', 'none']]) { const r = await call(e); assert.strictEqual(r.s, 403, e); assert.strictEqual(r.j.code, c, e); assert.strictEqual(r.j.email, e); assert(!r.j.lic); }
  ok('غير المسجّل والمنتهي والموقوف وبلا رخصة: 403 برسالة ورمز واضح، ولا رخصة');
  // حد الأجهزة يحدده المدير
  await db.prepare("UPDATE specialists SET devmax = 1 WHERE email = 'ok@x.com'").run();
  assert.strictEqual((await call('ok@x.com', '/api/lic?d=device-aa')).s, 200, 'الجهاز المعروف يدخل');
  const d2 = await call('ok@x.com', '/api/lic?d=device-bb'); assert.strictEqual(d2.s, 403); assert.strictEqual(d2.j.code, 'devices'); assert.strictEqual(d2.j.max, 1); assert(/حد الأجهزة/.test(d2.j.error));
  assert.strictEqual((await db.prepare("SELECT label FROM spdevices WHERE email = 'ok@x.com'").first()).label, 'Android');
  await db.prepare("DELETE FROM spdevices WHERE email = 'ok@x.com' AND dev = 'device-aa'").run(); assert.strictEqual((await call('ok@x.com', '/api/lic?d=device-bb')).s, 200, 'بعد تحرير جهاز يدخل الجديد');
  await db.prepare("UPDATE specialists SET devmax = 0 WHERE email = 'ok@x.com'").run(); for (const d of ['device-c1', 'device-c2', 'device-c3']) assert.strictEqual((await call('ok@x.com', '/api/lic?d=' + d)).s, 200, 'بلا حد');
  assert.strictEqual((await call('ok@x.com', '/api/lic')).s, 400, 'بلا رمز جهاز');
  ok('حد الأجهزة يحدده المدير: الجهاز المعروف يدخل، والجديد بعد بلوغ الحد يُرفض برسالة واضحة حتى يُحرَّر جهاز، و«بلا حد» يقبل أي عدد');
  W._test.setVerifier(null); W._test.reset(); const fr = await W.default.fetch(new Request('https://hessanu.example/api/lic', { headers: { 'cf-access-jwt-assertion': 'a.b.c' } }), Object.assign({ ACCESS_TEAM: 'x', SITE_AUD: 'y' }, env)); assert.strictEqual(fr.status, 401); ok('رمز مزوّر بلا توقيع صالح: 401');
  assert.strictEqual((await call('ok@x.com', '/')).t, '<html>site</html>'); ok('بقية المسارات أصول الموقع الثابتة كما هي');
  console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 800)); process.exit(1); });
