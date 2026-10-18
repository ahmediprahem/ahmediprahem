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
  ok('الدعوة: يصدرها الأخصائي فقط، ويقرأ العميل اسم الأخصائي ومفتاحه (البصمة تطابق) وقائمة الوجبات من الرمز وحده');
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
  console.log('\nنجح', n, 'اختبارات المحطة الوسيطة');
})().catch((e) => { console.log('✘', e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e); process.exit(1); });
