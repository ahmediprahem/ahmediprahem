// المحطة الوسيطة «حصة ↔ حصتي»: التسجيل، الدعوة، الانضمام، الرسائل المشفّرة من طرف إلى طرف، التحقق من التوقيع والعلاقات، والحدود.
'use strict';
const assert = require('assert'), path = require('path'), HXC = require('../src/hx_crypto.js'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const W = await import(path.resolve(__dirname, '../worker/relay/index.mjs'));
  const env = { DB: d1(), REG_KEY: 'clinic-secret' }, base = 'https://relay.example';
  const call = async (ident, method, p, obj, extraHeaders) => {
    const body = obj === undefined ? '' : JSON.stringify(obj), h = { 'content-type': 'application/json', ...(extraHeaders || {}) };
    if (ident) h.authorization = await HXC.signReq(ident, method, p, body);
    const r = await W.default.fetch(new Request(base + p, { method, headers: h, body: method === 'POST' ? body : undefined }), env); return { s: r.status, j: await r.json().catch(() => null) };
  };
  // 1) هويات ومعرّفات متطابقة بين الطرفين
  const dr = await HXC.genIdentity(), dr2 = await HXC.genIdentity(), cl = await HXC.genIdentity(), cl2 = await HXC.genIdentity();
  assert.strictEqual(dr.id, await W.idOf(dr.sigPub)); assert.strictEqual(await HXC.tokenHash('abc'), await W.tokenHash('abc'));
  const box0 = await HXC.seal(dr.encPub, { hi: 'مرحبا' }); assert.deepStrictEqual(await HXC.open(dr, box0), { hi: 'مرحبا' }); await assert.rejects(HXC.open(dr2, box0));
  const w = await HXC.wrap('1234', { k: 1 }); assert.deepStrictEqual(await HXC.unwrap('1234', w), { k: 1 }); await assert.rejects(HXC.unwrap('9999', w));
  ok('التشفير: معرّف المحطة = معرّف «حصة»، الرسالة لا يفتحها إلا صاحب المفتاح، وحفظ الهوية برمز الدخول (الرمز الخطأ يُرفض)');
  // 2) التسجيل
  assert.strictEqual((await call(null, 'GET', '/v1/health')).j.ok, true);
  assert.strictEqual((await call(dr, 'POST', '/v1/register', { sigPub: dr.sigPub, encPub: dr.encPub, name: 'د. أحمد', regKey: 'wrong' })).s, 403);
  assert.strictEqual((await call(dr2, 'POST', '/v1/register', { sigPub: dr.sigPub, encPub: dr.encPub, name: 'منتحل', regKey: 'clinic-secret' })).s, 401);
  assert.strictEqual((await call(dr, 'POST', '/v1/register', { sigPub: dr.sigPub, encPub: dr.encPub, name: 'د. أحمد حامد', regKey: 'clinic-secret' })).j.id, dr.id);
  assert.strictEqual((await call(dr2, 'POST', '/v1/register', { sigPub: dr2.sigPub, encPub: dr2.encPub, name: 'أخصائي آخر', regKey: 'clinic-secret' })).s, 200);
  ok('التسجيل: يحتاج مفتاح التسجيل الصحيح، ولا يسجّل أحد بمفتاح غيره (التوقيع يطابق المفتاح)');
  // 3) الدعوة
  const tok = HXC.token(), h = await HXC.tokenHash(tok), cat = { meals: [['شوفان بالحليب', [1, 0, 0, 0], 'شوفان']], foods: [['أرز أبيض', 0]] };
  assert.strictEqual((await call(cl, 'POST', '/v1/invites', { h, label: 'سارة' })).s, 401);
  const inv = await call(dr, 'POST', '/v1/invites', { h, label: 'سارة أحمد', exp: Math.floor(Date.now() / 1000) + 3 * 86400, cat }); assert.strictEqual(inv.s, 200);
  const info = await call(null, 'GET', '/v1/invites/' + h); assert.strictEqual(info.j.dname, 'د. أحمد حامد'); assert.deepStrictEqual(info.j.cat, cat); assert.strictEqual(await HXC.fpOf(info.j.encPub), await HXC.fpOf(dr.encPub));
  assert.strictEqual((await call(null, 'GET', '/v1/invites/' + 'x'.repeat(32))).s, 404);
  const t2 = HXC.token(), h2 = await HXC.tokenHash(t2); await call(dr, 'POST', '/v1/invites', { h: h2, label: 'ملغاة' }); assert.strictEqual((await call(dr2, 'POST', '/v1/invites/revoke', { h: h2 })).s, 200); assert.strictEqual((await call(null, 'GET', '/v1/invites/' + h2)).s, 200);
  assert.strictEqual((await call(dr, 'POST', '/v1/invites/revoke', { h: h2 })).s, 200); assert.strictEqual((await call(null, 'GET', '/v1/invites/' + h2)).s, 410);
  ok('الدعوة: يصدرها الأخصائي فقط ويلغيها هو وحده، ويقرأ العميل اسم الأخصائي ومفتاحه (البصمة تطابق) وقائمة الوجبات من الرمز وحده');
  // 4) الانضمام
  assert.strictEqual((await call(cl, 'POST', '/v1/join', { token: 'bad-token', sigPub: cl.sigPub, encPub: cl.encPub })).s, 404);
  const j = await call(cl, 'POST', '/v1/join', { token: tok, sigPub: cl.sigPub, encPub: cl.encPub }); assert.strictEqual(j.s, 200); assert.strictEqual(j.j.did, dr.id); assert.strictEqual(j.j.cid, cl.id);
  assert.strictEqual((await call(cl2, 'POST', '/v1/join', { token: tok, sigPub: cl2.sigPub, encPub: cl2.encPub })).s, 410); assert.strictEqual((await call(null, 'GET', '/v1/invites/' + h)).s, 410);
  ok('الانضمام: رمز خطأ يُرفض، والدعوة تُستعمل مرة واحدة فقط (الثانية 410)');
  // 5) رسائل مشفّرة في الاتجاهين + صندوق الوارد + الإقرار
  let ib = await call(dr, 'GET', '/v1/inbox?after=0'); assert.strictEqual(ib.j.msgs.length, 1); assert.strictEqual(ib.j.msgs[0].kind, 'join'); assert.strictEqual(ib.j.msgs[0].body.cid, cl.id); assert.strictEqual(ib.j.msgs[0].body.label, 'سارة أحمد');
  const intake = { t: 'intake', p: { name: 'سارة أحمد', weight: 72 } };
  assert.strictEqual((await call(cl, 'POST', '/v1/send', { to: dr.id, box: await HXC.seal(dr.encPub, intake) })).s, 200);
  ib = await call(dr, 'GET', '/v1/inbox?after=' + ib.j.msgs[0].id); assert.strictEqual(ib.j.msgs.length, 1); assert.strictEqual(ib.j.msgs[0].from, cl.id); assert.deepStrictEqual(await HXC.open(dr, ib.j.msgs[0].body), intake);
  const stored = env.DB._raw.prepare('SELECT body FROM msgs WHERE sender = ? AND kind = \'e\'').get(cl.id).body; assert(!stored.includes('سارة') && !stored.includes('72'), 'المحطة تخزّن نصاً مقروءاً!');
  await call(dr, 'POST', '/v1/ack', { upTo: ib.j.msgs[0].id }); assert.strictEqual((await call(dr, 'GET', '/v1/inbox?after=0')).j.msgs.length, 0);
  assert.strictEqual((await call(dr, 'POST', '/v1/send', { to: cl.id, box: await HXC.seal(cl.encPub, { t: 'plan', v: 1 }) })).s, 200);
  const cin = await call(cl, 'GET', '/v1/inbox?after=0'); assert.deepStrictEqual(await HXC.open(cl, cin.j.msgs[0].body), { t: 'plan', v: 1 });
  ok('الرسائل: العميل يرسل للأخصائي والأخصائي للعميل، والمحطة تخزّن نصاً مشفّراً فقط، والإقرار يحذف ما استُلم');
  // 6) العلاقات والتوقيع والوقت
  assert.strictEqual((await call(dr2, 'POST', '/v1/send', { to: cl.id, box: { v: 1 } })).s, 403);
  assert.strictEqual((await call(cl, 'POST', '/v1/send', { to: dr2.id, box: { v: 1 } })).s, 403);
  assert.strictEqual((await call(cl2, 'GET', '/v1/inbox?after=0')).s, 401);
  const forged = await HXC.signReq(dr2, 'GET', '/v1/inbox?after=0', ''); assert.strictEqual((await W.default.fetch(new Request(base + '/v1/inbox?after=0', { headers: { authorization: forged.replace(dr2.id, dr.id) } }), env)).status, 401);
  const old = await HXC.signReq(dr, 'GET', '/v1/inbox?after=0', '', Math.floor(Date.now() / 1000) - 3600); assert.strictEqual((await W.default.fetch(new Request(base + '/v1/inbox?after=0', { headers: { authorization: old } }), env)).status, 401);
  const tamper = await HXC.signReq(dr, 'POST', '/v1/send', JSON.stringify({ to: cl.id, box: { v: 1 } }));
  assert.strictEqual((await W.default.fetch(new Request(base + '/v1/send', { method: 'POST', headers: { authorization: tamper }, body: JSON.stringify({ to: cl.id, box: { v: 2 } }) }), env)).status, 401);
  ok('الحماية: أخصائي آخر لا يراسل عميلاً ليس له، والعميل لا يراسل غير أخصائيه، والتوقيع المزوّر أو القديم أو الجسم المعدَّل يُرفض');
  // 7) الحذف، الحدود، وتقديم تطبيق «حصتي»
  assert.strictEqual((await call(dr, 'POST', '/v1/send', { to: cl.id, box: { big: 'x'.repeat(500000) } })).s, 413);
  assert.strictEqual((await call(dr2, 'POST', '/v1/clients/remove', { cid: cl.id })).s, 404);
  assert.strictEqual((await call(dr, 'POST', '/v1/clients/remove', { cid: cl.id })).s, 200); assert.strictEqual((await call(cl, 'GET', '/v1/inbox?after=0')).s, 401);
  const app = await W.default.fetch(new Request(base + '/'), env); assert.strictEqual(app.status, 200); assert(/text\/html/.test(app.headers.get('content-type'))); assert(app.headers.get('content-security-policy').includes("connect-src 'self'"));
  const pre = await W.default.fetch(new Request(base + '/v1/send', { method: 'OPTIONS' }), env); assert.strictEqual(pre.status, 204); assert(pre.headers.get('access-control-allow-headers').includes('authorization'));
  assert.strictEqual((await W.default.fetch(new Request(base + '/v1/health'), { DB: null })).status, 500);
  ok('الحذف: الأخصائي يفصل عميله فتُحذف بياناته ورسائله، والرسالة الضخمة تُرفض، والصفحة الرئيسية تقدّم «حصتي» بسياسة أمان صارمة');
  // 8) الإشعارات: مفتاح VAPID ثابت، اشتراك من خدمات معروفة فقط، إشعار بلا محتوى عند push:true، حد زمني، وحذف الاشتراك الميت
  const env2 = { DB: d1() }, W2 = W.default, ctxs = [], ctx = { waitUntil: (pr) => ctxs.push(pr) }; W._test.reset();
  const call2 = async (ident, method, p, obj) => { const body = obj === undefined ? '' : JSON.stringify(obj), h = { 'content-type': 'application/json' }; if (ident) h.authorization = await HXC.signReq(ident, method, p, body); const r = await W2.fetch(new Request(base + p, { method, headers: h, body: method === 'POST' ? body : undefined }), env2, ctx); return { s: r.status, j: await r.json().catch(() => null) }; };
  const k1 = (await call2(null, 'GET', '/v1/push/key')).j.key, k2 = (await call2(null, 'GET', '/v1/push/key')).j.key; assert.strictEqual(k1, k2); assert.strictEqual(HXC.unb64u(k1).length, 65);
  const D = await HXC.genIdentity(), Cl = await HXC.genIdentity(), tk = HXC.token();
  await call2(D, 'POST', '/v1/register', { sigPub: D.sigPub, encPub: D.encPub, name: 'د' }); await call2(D, 'POST', '/v1/invites', { h: await HXC.tokenHash(tk), label: 'ع' });
  const calls = [], realFetch = globalThis.fetch; let status = 201; globalThis.fetch = async (u, o) => { calls.push({ u: String(u), o }); return new Response(null, { status }); };
  try {
    await call2(Cl, 'POST', '/v1/join', { token: tk, sigPub: Cl.sigPub, encPub: Cl.encPub }); await Promise.all(ctxs.splice(0)); assert.strictEqual(calls.length, 0);
    assert.strictEqual((await call2(null, 'POST', '/v1/push/sub', { ep: 'https://fcm.googleapis.com/fcm/send/abc12345' })).s, 401);
    assert.strictEqual((await call2(Cl, 'POST', '/v1/push/sub', { ep: 'https://evil.example/hook/123456789' })).s, 400);
    const EP = 'https://fcm.googleapis.com/fcm/send/cl-device-123456'; assert.strictEqual((await call2(Cl, 'POST', '/v1/push/sub', { ep: EP })).s, 200);
    await call2(D, 'POST', '/v1/send', { to: Cl.id, box: { v: 1 }, push: false }); await Promise.all(ctxs.splice(0)); assert.strictEqual(calls.length, 0, 'المتابعة الصامتة لا تُرسل إشعاراً');
    await call2(D, 'POST', '/v1/send', { to: Cl.id, box: { v: 1 }, push: true }); await Promise.all(ctxs.splice(0)); assert.strictEqual(calls.length, 1);
    const c0 = calls[0]; assert.strictEqual(c0.u, EP); assert.strictEqual(c0.o.method, 'POST'); assert.strictEqual(c0.o.headers['Content-Length'], '0'); assert(!c0.o.body, 'الإشعار يجب أن يكون بلا محتوى');
    const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(c0.o.headers.Authorization); assert(m, c0.o.headers.Authorization); assert.strictEqual(m[4], k1);
    const claims = JSON.parse(Buffer.from(m[2], 'base64url').toString()); assert.strictEqual(claims.aud, 'https://fcm.googleapis.com'); assert(claims.exp > Date.now() / 1000 && /^https:\/\//.test(claims.sub));
    const pk = await crypto.subtle.importKey('raw', HXC.unb64u(k1), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    assert(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pk, HXC.unb64u(m[3]), new TextEncoder().encode(m[1] + '.' + m[2])), 'توقيع VAPID غير صالح');
    await call2(D, 'POST', '/v1/send', { to: Cl.id, box: { v: 2 }, push: true }); await Promise.all(ctxs.splice(0)); assert.strictEqual(calls.length, 1, 'إشعار واحد كل 30 ثانية لكل جهاز');
    env2.DB._raw.prepare('UPDATE push_subs SET last = 0').run(); status = 410; await call2(D, 'POST', '/v1/send', { to: Cl.id, box: { v: 3 }, push: true }); await Promise.all(ctxs.splice(0));
    assert.strictEqual(calls.length, 2); assert.strictEqual(env2.DB._raw.prepare('SELECT COUNT(*) AS n FROM push_subs').get().n, 0, 'الاشتراك المنتهي (410) يُحذف');
    status = 201; await call2(Cl, 'POST', '/v1/push/sub', { ep: EP }); await call2(D, 'POST', '/v1/clients/remove', { cid: Cl.id }); assert.strictEqual(env2.DB._raw.prepare('SELECT COUNT(*) AS n FROM push_subs').get().n, 0);
  } finally { globalThis.fetch = realFetch; }
  ok('الإشعارات: مفتاح VAPID يُولَّد مرة ويبقى، الاشتراك من خدمات معروفة فقط، إشعار بلا محتوى وموقّع عند push فقط، حد 30 ثانية، وحذف الاشتراك المنتهي أو عند فصل العميل');
  // 9) نقل الحساب: يرفعه العميل فقط، يُؤخذ مرة واحدة، والمالك يعرف أنه استُلم؛ والمنتهي يُرفض
  {
    const env3 = { DB: d1() }; W._test.reset(); const c3 = async (ident, method, p, obj) => { const body = obj === undefined ? '' : JSON.stringify(obj), h = { 'content-type': 'application/json' }; if (ident) h.authorization = await HXC.signReq(ident, method, p, body); const r = await W.default.fetch(new Request(base + p, { method, headers: h, body: method === 'POST' ? body : undefined }), env3); return { s: r.status, j: await r.json().catch(() => null) }; };
    const D = await HXC.genIdentity(), Cl = await HXC.genIdentity(), tk = HXC.token(); await c3(D, 'POST', '/v1/register', { sigPub: D.sigPub, encPub: D.encPub, name: 'د' }); await c3(D, 'POST', '/v1/invites', { h: await HXC.tokenHash(tk), label: 'ع' }); await c3(Cl, 'POST', '/v1/join', { token: tk, sigPub: Cl.sigPub, encPub: Cl.encPub });
    const id = HXC.b64u(new Uint8Array(12).fill(7)), blob = { iv: 'aaa', c: 'bbb' };
    assert.strictEqual((await c3(D, 'POST', '/v1/xfer', { id, blob })).s, 403); assert.strictEqual((await c3(null, 'POST', '/v1/xfer', { id, blob })).s, 401); assert.strictEqual((await c3(Cl, 'POST', '/v1/xfer', { id: 'short', blob })).s, 400);
    assert.strictEqual((await c3(Cl, 'POST', '/v1/xfer', { id, blob })).s, 200); assert.strictEqual((await c3(Cl, 'GET', '/v1/xfer/' + id + '/status')).j.claimed, false);
    assert.strictEqual((await c3(D, 'GET', '/v1/xfer/' + id + '/status')).j.claimed, false, 'الحالة لمالك الحزمة فقط');
    const got = await c3(null, 'GET', '/v1/xfer/' + id); assert.deepStrictEqual(got.j.blob, blob); assert.strictEqual((await c3(null, 'GET', '/v1/xfer/' + id)).s, 410); assert.strictEqual((await c3(Cl, 'GET', '/v1/xfer/' + id + '/status')).j.claimed, true);
    assert.strictEqual(env3.DB._raw.prepare('SELECT blob FROM xfer').get().blob, '', 'الحزمة تُمسح من المحطة فور أخذها');
    const id2 = HXC.b64u(new Uint8Array(12).fill(9)); await c3(Cl, 'POST', '/v1/xfer', { id: id2, blob }); env3.DB._raw.prepare('UPDATE xfer SET exp = 1').run(); assert.strictEqual((await c3(null, 'GET', '/v1/xfer/' + id2)).s, 404);
    assert.strictEqual((await c3(Cl, 'POST', '/v1/xfer', { id: id2, blob: { c: 'x'.repeat(1600000) } })).s, 413);
    ok('نقل الحساب: يرفعه العميل وحده، ويُؤخذ مرة واحدة ثم يُمسح، ويعرف المالك أنه استُلم، والمنتهي أو الضخم يُرفض');
  }
  // 10) خزنة النسخ الاحتياطي: أجزاء ونسخ مرقّمة، كلمة السر (auth) تُفحص، والكتابة لأخصائي مسجّل فقط، وتُحفظ آخر 7 نسخ
  {
    const env4 = { DB: d1() }; W._test.reset(); const c4 = async (ident, method, p, obj) => { const body = obj === undefined ? '' : JSON.stringify(obj), h = { 'content-type': 'application/json' }; if (ident) h.authorization = await HXC.signReq(ident, method, p, body); const r = await W.default.fetch(new Request(base + p, { method, headers: h, body: method === 'POST' ? body : undefined }), env4); return { s: r.status, j: await r.json().catch(() => null) }; };
    const D = await HXC.genIdentity(); await c4(D, 'POST', '/v1/register', { sigPub: D.sigPub, encPub: D.encPub, name: 'د' });
    const vid = HXC.b64u(new Uint8Array(16).fill(1)), auth = HXC.b64u(new Uint8Array(16).fill(2)), up = (i) => HXC.b64u(new Uint8Array(12).fill(i));
    assert.strictEqual((await c4(null, 'POST', '/v1/vault/head', { vid, auth })).s, 404);
    assert.strictEqual((await c4(null, 'POST', '/v1/vault/put', { vid, auth, up: up(1), idx: 0, n: 1, data: 'x' })).s, 401, 'الكتابة تحتاج أخصائياً مسجّلاً');
    let r = await c4(D, 'POST', '/v1/vault/put', { vid, auth, up: up(1), idx: 1, n: 2, data: 'BBB', dev: 'جهاز 1' }); assert.strictEqual(r.j.done, false); assert.strictEqual((await c4(null, 'POST', '/v1/vault/head', { vid, auth })).j.head, 0);
    r = await c4(D, 'POST', '/v1/vault/put', { vid, auth, up: up(1), idx: 0, n: 2, data: 'AAA', dev: 'جهاز 1' }); assert.deepStrictEqual([r.j.done, r.j.ver], [true, 1]);
    const hd = (await c4(null, 'POST', '/v1/vault/head', { vid, auth })).j; assert.deepStrictEqual([hd.head, hd.vers[0].n, hd.vers[0].size, hd.vers[0].dev], [1, 2, 6, 'جهاز 1']);
    assert.strictEqual((await c4(null, 'POST', '/v1/vault/get', { vid, auth, ver: 1, idx: 1 })).j.data, 'BBB');
    assert.strictEqual((await c4(null, 'POST', '/v1/vault/head', { vid, auth: HXC.b64u(new Uint8Array(16).fill(9)) })).s, 403, 'كلمة سر خاطئة');
    assert.strictEqual((await c4(D, 'POST', '/v1/vault/put', { vid, auth: HXC.b64u(new Uint8Array(16).fill(9)), up: up(2), idx: 0, n: 1, data: 'Z' })).s, 403);
    assert.strictEqual((await c4(D, 'POST', '/v1/vault/put', { vid, auth, up: up(3), idx: 0, n: 1, data: 'x'.repeat(900001) })).s, 413);
    for (let i = 10; i < 18; i++) await c4(D, 'POST', '/v1/vault/put', { vid, auth, up: up(i), idx: 0, n: 1, data: 'v' + i });
    const h2 = (await c4(null, 'POST', '/v1/vault/head', { vid, auth })).j; assert.strictEqual(h2.head, 9); assert.deepStrictEqual(h2.vers.map((v) => v.ver), [9, 8, 7, 6, 5, 4, 3]);
    assert.strictEqual((await c4(null, 'POST', '/v1/vault/get', { vid, auth, ver: 1, idx: 0 })).s, 404); assert.strictEqual(env4.DB._raw.prepare("SELECT COUNT(*) AS n FROM vault_chunks").get().n, 7);
    ok('خزنة النسخ: تُرفع أجزاءً وتكتمل نسخة مرقّمة، كلمة سر النسخ تُفحص قراءةً وكتابة، الكتابة لأخصائي مسجّل، الجزء الضخم يُرفض، وتُحفظ آخر 7 نسخ فقط');
  }
  console.log('\nنجح', n, 'اختبارات المحطة الوسيطة');
})().catch((e) => { console.log('✘', e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e); process.exit(1); });
