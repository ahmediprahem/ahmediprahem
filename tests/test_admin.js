// خادم الإدارة (0.95): رموز Cloudflare Access حقيقية (RS256) يتحقق منها الخادم، الأعضاء والصلاحيات تُفرض على الخادم، تخزين مشفّر بإصدارات، سجل تدقيق ونسخ احتياطية
const assert = require('assert'), path = require('path'), d1 = require('./d1_shim.js'), { fileUrl, TMP } = require('./_tmp.js'), fs = require('fs');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
const b64u = (b) => Buffer.from(b).toString('base64url');
(async () => {
  const wf = path.join(TMP, 'admin_worker_test.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/admin/index.mjs'), wf);
  const W = await import(fileUrl(wf)), S = globalThis.crypto.subtle;
  const kp = await S.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await S.exportKey('jwk', kp.publicKey); jwk.kid = 'k1';
  const kp2 = await S.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const realFetch = globalThis.fetch; let certCalls = 0;
  globalThis.fetch = async (u) => { if (String(u) === 'https://zteam.cloudflareaccess.com/cdn-cgi/access/certs') { certCalls++; return new Response(JSON.stringify({ keys: [jwk] })); } return realFetch(u); };
  const env = { DB: d1(), ACCESS_TEAM: 'zteam', ACCESS_AUD: 'aud123', OWNER_EMAIL: 'AH6171317@gmail.com' };
  const jwt = async (claims, key = kp.privateKey, kid = 'k1') => { const h = b64u(JSON.stringify({ alg: 'RS256', kid })), t = Math.floor(Date.now() / 1000); const c = b64u(JSON.stringify(Object.assign({ aud: ['aud123'], iss: 'https://zteam.cloudflareaccess.com', exp: t + 600, iat: t }, claims))); const sig = await S.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(h + '.' + c)); return h + '.' + c + '.' + b64u(new Uint8Array(sig)); };
  const call = async (tok, method, p, body) => { const h = {}; if (tok) h['cf-access-jwt-assertion'] = tok; if (body !== undefined) h['content-type'] = 'application/json'; const r = await W.default.fetch(new Request('https://zenha-admin.example' + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }), env); return { s: r.status, j: await r.json().catch(() => ({})) }; };
  const owner = await jwt({ email: 'ah6171317@gmail.com' });
  // 1) لا دخول بلا رمز Access صحيح
  assert.strictEqual((await call(null, 'GET', '/api/me')).s, 401);
  assert.strictEqual((await call(await jwt({ email: 'ah6171317@gmail.com', aud: ['other'] }), 'GET', '/api/me')).s, 401, 'جمهور آخر');
  assert.strictEqual((await call(await jwt({ email: 'ah6171317@gmail.com', exp: 1000 }), 'GET', '/api/me')).s, 401, 'منتهٍ');
  assert.strictEqual((await call(await jwt({ email: 'ah6171317@gmail.com' }, kp2.privateKey), 'GET', '/api/me')).s, 401, 'توقيع بمفتاح غريب');
  assert.strictEqual((await call(await jwt({ email: 'ah6171317@gmail.com', iss: 'https://evil.cloudflareaccess.com' }), 'GET', '/api/me')).s, 401, 'مُصدِر آخر');
  const t = owner.split('.'); assert.strictEqual((await call(t[0] + '.' + b64u(JSON.stringify({ email: 'x@y.com', aud: ['aud123'], exp: 9e9 })) + '.' + t[2], 'GET', '/api/me')).s, 401, 'محتوى معدَّل');
  ok('لا دخول بلا رمز Access صحيح: رمز مفقود أو لجمهور آخر أو منتهٍ أو بمفتاح غريب أو من مُصدِر آخر أو معدَّل = 401');
  // 2) المالك الأول تلقائياً، وأي بريد آخر ليس عضواً
  const me = await call(owner, 'GET', '/api/me'); assert.strictEqual(me.s, 200); assert.strictEqual(me.j.me.email, 'ah6171317@gmail.com'); assert.strictEqual(me.j.me.role, 'owner');
  const stranger = await jwt({ email: 'someone@gmail.com' }); assert.strictEqual((await call(stranger, 'GET', '/api/me')).s, 403); assert.strictEqual(certCalls, 1, 'شهادات Access تُخزَّن مؤقتاً');
  ok('ah6171317@gmail.com مالك تلقائياً (البريد بلا حساسية لحالة الأحرف)، وأي بريد آخر يجتاز Access لكنه ليس عضواً = 403');
  // 3) التخزين: مشفّر فقط، وإصدارات تمنع الكتابة فوق تعديل غيرك
  const box = { _e: 1, iv: 'aaaa', ct: 'bbbb' };
  assert.strictEqual((await call(owner, 'PUT', '/api/store/users', { v: { plain: 'سارة' }, ver: 0 })).s, 400, 'نص غير مشفّر');
  assert.strictEqual((await call(owner, 'PUT', '/api/store/users', { v: box, ver: 0 })).j.ver, 1);
  assert.strictEqual((await call(owner, 'PUT', '/api/store/users', { v: box, ver: 0 })).s, 409, 'إصدار قديم');
  assert.strictEqual((await call(owner, 'PUT', '/api/store/users', { v: box, ver: 1 })).j.ver, 2);
  const g = await call(owner, 'GET', '/api/store/users'); assert.deepStrictEqual(g.j.v, box); assert.strictEqual(g.j.ver, 2); assert.strictEqual(g.j.updated_by, 'ah6171317@gmail.com');
  assert.strictEqual((await call(owner, 'PUT', '/api/store/secret', { v: box, ver: 0 })).s, 400, 'مفتاح غير معروف');
  const raw = env.DB; ok('التخزين يقبل المحتوى المشفّر فقط، والكتابة على إصدار قديم تُرفض 409، ومن عدّل آخراً محفوظ');
  // 4) الأعضاء والصلاحيات
  assert.strictEqual((await call(owner, 'POST', '/api/members', { email: 'helper@gmail.com', role: 'member', perms: ['users', 'nope'] })).j.member.perms.join(), 'users');
  const helper = await jwt({ email: 'helper@gmail.com' });
  assert.strictEqual((await call(helper, 'GET', '/api/me')).j.me.role, 'member');
  assert.strictEqual((await call(helper, 'GET', '/api/store/users')).s, 200, 'له صلاحية الأخصائيين');
  assert.strictEqual((await call(helper, 'GET', '/api/store/keys')).s, 403, 'لا صلاحية الرخص');
  assert.strictEqual((await call(helper, 'PUT', '/api/store/settings', { v: box, ver: 0 })).s, 403, 'لا صلاحية الإعدادات');
  assert.deepStrictEqual((await call(helper, 'GET', '/api/store')).j.keys.map((x) => x.k), ['users'], 'يرى ما يملكه فقط');
  assert.strictEqual((await call(helper, 'POST', '/api/members', { email: 'x@gmail.com' })).s, 403, 'العضو لا يضيف أعضاء');
  assert.strictEqual((await call(helper, 'GET', '/api/members')).s, 403); assert.strictEqual((await call(helper, 'GET', '/api/audit')).s, 403);
  await call(owner, 'POST', '/api/members', { email: 'boss@gmail.com', role: 'admin' }); const boss = await jwt({ email: 'boss@gmail.com' });
  assert.strictEqual((await call(boss, 'GET', '/api/store/keys')).s, 200, 'المدير الكامل يصل لكل شيء'); assert.strictEqual((await call(boss, 'POST', '/api/members', { email: 'y@gmail.com' })).s, 403, 'لكنه لا يدير الأعضاء');
  assert.strictEqual((await call(owner, 'POST', '/api/members', { email: 'ah6171317@gmail.com', role: 'member' })).s, 400, 'المالك لا يُخفَّض');
  assert.strictEqual((await call(owner, 'DELETE', '/api/members/' + encodeURIComponent('ah6171317@gmail.com'))).s, 400, 'المالك لا يُحذف');
  await call(owner, 'POST', '/api/members', { email: 'helper@gmail.com', role: 'member', perms: ['users'], disabled: true }); assert.strictEqual((await call(helper, 'GET', '/api/me')).s, 403, 'العضو المعطَّل لا يدخل');
  assert.strictEqual((await call(owner, 'DELETE', '/api/members/helper%40gmail.com')).s, 200); assert.strictEqual((await call(helper, 'GET', '/api/me')).s, 403);
  ok('الصلاحيات تُفرض على الخادم: العضو يصل لما مُنح فقط، المدير الكامل لكل شيء عدا الأعضاء، المالك وحده يضيف ويعطّل ويحذف ولا يُخفَّض ولا يُحذف');
  // 5) سجل التدقيق والنسخ الاحتياطية
  const au = await call(owner, 'GET', '/api/audit'); const acts = au.j.rows.map((r) => r.action); assert(acts.includes('store.put') && acts.includes('member.add') && acts.includes('member.del'), acts.join());
  assert(au.j.rows.some((r) => r.email === 'ah6171317@gmail.com' && /helper@gmail.com/.test(r.detail)));
  const id = await W.default.scheduled({}, env, {}); assert(id > 0); const bk = await call(owner, 'GET', '/api/backups'); assert.strictEqual(bk.j.backups.length, 1);
  const data = JSON.parse((await raw.prepare('SELECT data FROM backups').first()).data); assert.strictEqual(data.store[0].k, 'users'); assert(!JSON.stringify(data).includes('سارة'));
  ok('كل تعديل في سجل التدقيق (من ومتى وماذا)، والنسخة الاحتياطية اليومية تلتقط التخزين المشفّر والأعضاء');
  const h = await W.default.fetch(new Request('https://zenha-admin.example/health'), env); assert.deepStrictEqual(await h.json(), { ok: true, ver: '0.1', access: true, owner: true });
  assert.strictEqual((await W.default.fetch(new Request('https://zenha-admin.example/health'), { DB: d1() })).status, 200); ok('/health يبيّن هل Access والمالك مضبوطان');
  // 6) الأخصائيون بالبريد: صلاحية users للقائمة، وlic لإرفاق رخصة
  await call(owner, 'POST', '/api/members', { email: 'u2@gmail.com', role: 'member', perms: ['users'] }); const u2 = await jwt({ email: 'u2@gmail.com' });
  assert.strictEqual((await call(u2, 'POST', '/api/specialists', { email: 'd@x.com', name: 'د', exp: 0 })).s, 200, 'إضافة بلا رخصة');
  assert.strictEqual((await call(u2, 'POST', '/api/specialists', { email: 'd@x.com', name: 'د', lic: 'aa.bb' })).s, 403, 'الرخصة تحتاج صلاحية lic');
  assert.strictEqual((await call(owner, 'POST', '/api/specialists', { email: 'd@x.com', name: 'د', lic: 'bad lic' })).s, 400);
  assert.strictEqual((await call(owner, 'POST', '/api/specialists', { email: 'D@X.com', name: 'د. د', lic: 'aa.bb', exp: 99 })).s, 200);
  const sl = (await call(u2, 'GET', '/api/specialists')).j.specialists; assert.strictEqual(sl.length, 1); assert.strictEqual(sl[0].email, 'd@x.com'); assert.strictEqual(sl[0].lic, undefined, 'الرخصة لا تُعرض في القائمة');
  assert.strictEqual((await call(helper, 'GET', '/api/specialists')).s, 403); assert.strictEqual((await call(u2, 'DELETE', '/api/specialists/d%40x.com')).s, 200);
  await call(owner, 'POST', '/api/specialists', { email: 'dm@x.com', name: 'حد', devmax: 3 }); await env.DB.prepare("INSERT INTO spdevices (email, dev, label, first, last) VALUES ('dm@x.com', 'dev123', 'Android', 1, 2)").run();
  let dm = (await call(u2, 'GET', '/api/specialists')).j.specialists.find((x) => x.email === 'dm@x.com'); assert.strictEqual(dm.devmax, 3); assert.strictEqual(dm.devices.length, 1); assert.strictEqual(dm.devices[0].label, 'Android');
  assert.strictEqual((await call(u2, 'DELETE', '/api/specialists/dm%40x.com/devices/dev123')).s, 200); dm = (await call(u2, 'GET', '/api/specialists')).j.specialists.find((x) => x.email === 'dm@x.com'); assert.strictEqual(dm.devices.length, 0);
  assert.strictEqual((await call(owner, 'POST', '/api/specialists', { email: 'dm@x.com', name: 'حد', devmax: 0 })).s, 200); assert.strictEqual((await call(u2, 'GET', '/api/specialists')).j.specialists.find((x) => x.email === 'dm@x.com').devmax, 0);
  ok('الأخصائيون بالبريد: حد الأجهزة يحفظه المدير ويحرّر الأجهزة، والقائمة بصلاحية «الأخصائيين»، وإرفاق رخصة بصلاحية «الرخص»، والرخصة لا تُعرض في القائمة');
  globalThis.fetch = realFetch; console.log('\nنجح ' + n + ' اختباراً');
})().catch((e) => { console.error('✘', e && e.stack ? e.stack.split('\n').slice(0, 6).join(' | ') : e); process.exit(1); });
