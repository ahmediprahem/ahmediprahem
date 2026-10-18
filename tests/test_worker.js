'use strict';
// وسيط Cloudflare (worker/index.mjs): التحقق من التوقيع، التحقق من الطلب، معالجة رد النموذج، الأخطاء، الخصوصية، والتكامل مع تطبيق حصة.
const assert = require('assert'), fs = require('fs'), path = require('path'); require('../src/sec.js'); const H = globalThis.HSec || require('../src/sec.js');
let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', String(e.message).slice(0, 600)); process.exitCode = 1; } };
(async () => {
  const W = await import('../worker/index.mjs'), E = require('../src/engine.js'), A = require('../src/assistant.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8')); A.bind(E, D);
  const keys = await H.genKeys(), other = await H.genKeys(), now = Date.now(), sec = Math.floor(now / 1000);
  let uidn = 0; const tok = (payload, priv) => H.sign(priv || keys.priv, Object.assign({ v: 1, u: 'user' + (uidn++), n: 'سارة', iat: sec }, payload || {}));   // مستخدم مختلف لكل كود حتى لا يتداخل تحديد المعدل بين الاختبارات
  const mkEnv = (run) => { const calls = []; return { calls, ADMIN_PUB: JSON.stringify(keys.pub), AI: { run: async (m, i) => { calls.push([m, i]); return run ? run(m, i) : { response: '{"actions":[{"type":"improve_variety"}],"clarify":""}' }; } } }; };
  const req = (body, o) => { o = o || {}; const raw = typeof body === 'string' ? body : JSON.stringify(body); return new Request('https://w.example/', { method: o.method || 'POST', headers: Object.assign({ 'content-type': 'application/json' }, o.headers || {}), body: o.method === 'GET' || o.method === 'OPTIONS' ? undefined : raw }); };
  const call = async (body, token, env, o) => { const r = await W.handle(req(body, { headers: token ? { authorization: 'Bearer ' + token } : {}, method: o && o.method }), env || mkEnv(), (o && o.now) || now + Math.floor(Math.random() * 1e3)); return { status: r.status, json: await r.json().catch(() => null), headers: r.headers }; };
  const good = { v: 1, text: 'نوّع الأصناف' };
  await t('الوسيط: طلب صالح بتوقيع صحيح → إجراءات، واستدعاء Workers AI بنموذج افتراضي وصيغة محددة ودرجة حرارة صفر وبلا رأس CORS ناقص', async () => {
    const env = mkEnv(), r = await call(good, await tok(), env); assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.json.actions, [{ type: 'improve_variety' }]); assert.strictEqual(r.json.model, '@cf/qwen/qwen3-30b-a3b-fp8');
    const [model, input] = env.calls[0]; assert.strictEqual(model, '@cf/qwen/qwen3-30b-a3b-fp8'); assert.strictEqual(input.temperature, 0); assert(input.max_tokens <= 500); assert.strictEqual(input.messages[0].role, 'system'); assert(input.messages[1].content.startsWith('نوّع الأصناف')); assert(/\/no_think$/.test(input.messages[1].content)); assert(/Reply with ONE JSON object only/.test(input.messages[0].content));
    assert.strictEqual(r.headers.get('access-control-allow-origin'), '*'); assert.strictEqual(r.headers.get('cache-control'), 'no-store'); const env2 = mkEnv(); env2.MODEL = '@cf/google/gemma-4-26b-a4b-it'; const r2 = await call(good, await tok(), env2); assert.strictEqual(r2.json.model, '@cf/google/gemma-4-26b-a4b-it'); assert(!/\/no_think/.test(env2.calls[0][1].messages[1].content));
  });
  await t('الوسيط: لا يُنفَّذ شيء بلا كود تفعيل صالح (مفقود، معدَّل، موقَّع بمفتاح آخر، منتهٍ) ولا يُستدعى النموذج', async () => {
    const env = mkEnv(), t0 = await tok(), parts = t0.split('.'), forged = Buffer.from(JSON.stringify({ v: 1, u: 'evil', iat: sec })).toString('base64url') + '.' + parts[1];
    for (const [label, token] of [['مفقود', ''], ['عشوائي', 'abc.def'], ['بلا نقطة', 'abcdef'], ['موقَّع بمفتاح آخر', await tok({}, other.priv)], ['حمولة معدَّلة', forged], ['منتهٍ', await tok({ exp: sec - 10 })], ['إصدار خاطئ', await tok({ v: 2 })], ['بلا مستخدم', await H.sign(keys.priv, { v: 1 })]]) { const r = await call(good, token, env); assert.strictEqual(r.status, 401, label + ' → ' + r.status); }
    assert.strictEqual(env.calls.length, 0); const okExp = await call(good, await tok({ exp: sec + 3600 }), env); assert.strictEqual(okExp.status, 200); const bad = mkEnv(); bad.ADMIN_PUB = 'ليس json'; assert.strictEqual((await call(good, await tok(), bad)).status, 401);
  });
  await t('الوسيط: التحقق من الطلب (الطريقة، الحجم، JSON، الحقول، طول النص) وCORS preflight', async () => {
    const tk = await tok(), env = mkEnv(); assert.strictEqual((await call(good, tk, env, { method: 'GET' })).status, 405); const pre = await call('', null, env, { method: 'OPTIONS' }); assert.strictEqual(pre.status, 204); assert(/authorization/.test(pre.headers.get('access-control-allow-headers')));
    assert.strictEqual((await call('{لا', tk, env)).status, 400); assert.strictEqual((await call({ v: 1 }, tk, env)).status, 400); assert.strictEqual((await call({ v: 2, text: 'x' }, tk, env)).status, 400); assert.strictEqual((await call({ v: 1, text: '   ' }, tk, env)).status, 400); assert.strictEqual((await call({ v: 1, text: 'س'.repeat(501) }, tk, env)).status, 400); assert.strictEqual((await call({ v: 1, text: 'x', pad: 'y'.repeat(5000) }, tk, env)).status, 413);
    assert.strictEqual(env.calls.length, 0); const nc = mkEnv(); delete nc.AI; assert.strictEqual((await call(good, tk, nc)).status, 500);
  });
  await t('الوسيط: يفهم أشكال ردود Workers AI المختلفة (نص، كائن، choices، <think>، أسوار markdown) ويصفّي الإجراءات غير المسموحة ويقتطع الزائد', async () => {
    const tk = await tok(), one = (resp) => call(good, tk, mkEnv(() => resp)); const act = { type: 'show_diff' };
    for (const resp of [{ response: JSON.stringify({ actions: [act], clarify: '' }) }, { response: { actions: [act], clarify: '' } }, { choices: [{ message: { content: JSON.stringify({ actions: [act] }) } }] }, { response: '<think>سأفكر…</think>\n```json\n' + JSON.stringify({ actions: [act], clarify: '' }) + '\n```' }, { result: { response: '  ' + JSON.stringify({ actions: [act] }) + '  ' } }]) { const r = await one(resp); assert.strictEqual(r.status, 200, JSON.stringify(resp).slice(0, 80)); assert.deepStrictEqual(r.json.actions, [act]); }
    const mix = await one({ response: JSON.stringify({ actions: [{ type: 'run_js', code: 'alert(1)' }, { type: 'delete_all' }, act, 'نص', null, act, act, act, act], clarify: 'س'.repeat(900) }) }); assert.strictEqual(mix.json.actions.length, 4); assert(mix.json.actions.every(a => a.type === 'show_diff')); assert(mix.json.clarify.length <= 300);
    for (const bad of [{ response: 'مرحباً، كيف أساعدك؟' }, { response: '' }, {}, { response: '{ليس json}' }, null]) assert.strictEqual((await one(bad)).status, 502);
  });
  await t('الوسيط: نفاد الحصة المجانية → 429، والمهلة → 504، وأي عطل آخر → 502، ولا تسريب لتفاصيل الخطأ', async () => {
    const tk = await tok(); const thr = (e) => call(good, tk, mkEnv(() => { throw e; }));
    for (const m of ['AiError: 4006: you have used up your daily free allocation of 10,000 neurons', 'Rate limit exceeded', 'quota exceeded', 'capacity temporarily exceeded']) { const r = await thr(new Error(m)); assert.strictEqual(r.status, 429, m); assert.strictEqual(r.json.error, 'quota'); assert(!JSON.stringify(r.json).includes(m)); }
    assert.strictEqual((await thr(Object.assign(new Error('timeout'), { code: 'TIMEOUT' }))).status, 504); const r = await thr(new Error('Internal server boom with secret-ish text')); assert.strictEqual(r.status, 502); assert(!JSON.stringify(r.json).includes('secret'));
  });
  await t('الوسيط: تحديد معدل بسيط لكل مستخدم (12 في الدقيقة) لا يمسّ غيره', async () => {
    const env = mkEnv(), tk = await tok({ u: 'rate-user' }), t0 = 5e12; let last = 0, codes = []; for (let i = 0; i < 14; i++) { const r = await W.handle(req(good, { headers: { authorization: 'Bearer ' + tk } }), env, t0 + i * 100); codes.push(r.status); last = r.status; }
    assert.strictEqual(codes.filter(c => c === 200).length, 12); assert.strictEqual(last, 429); const other = await W.handle(req(good, { headers: { authorization: 'Bearer ' + await tok({ u: 'someone-else' }) } }), env, t0 + 2000); assert.strictEqual(other.status, 200); const later = await W.handle(req(good, { headers: { authorization: 'Bearer ' + tk } }), env, t0 + 61000); assert.strictEqual(later.status, 200);
  });
  await t('الوسيط: الخصوصية — لا يُسجَّل نص الطلب في أي مخرجات، ولا يُعاد في الرد، ولا يوجد في الكود ما يكتب إلى console أو يخزّن', async () => {
    const logs = [], keep = {}; for (const k of ['log', 'info', 'warn', 'error', 'debug']) { keep[k] = console[k]; console[k] = (...a) => logs.push(a.join(' ')); }
    try { const secret = 'سر-المريض-12345'; const ok = await call({ v: 1, text: 'غيّر ' + secret }, await tok(), mkEnv()); const bad = await call({ v: 1, text: 'غيّر ' + secret }, await tok(), mkEnv(() => { throw new Error('boom'); })); assert(!JSON.stringify(ok.json).includes(secret) && !JSON.stringify(bad.json).includes(secret)); assert(!logs.some(l => l.includes(secret)), 'سُجّل نص الطلب'); } finally { Object.assign(console, keep); }
    const src = fs.readFileSync(path.join(__dirname, '../worker/index.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); assert(!/console\.(log|info|warn|error|debug)/.test(src)); assert(!/\.(put|get|delete)\(.*KV|env\.(DB|KV|R2|BUCKET)|fetch\(\s*['"`]https?:/.test(src), 'الوسيط يخزّن أو يتصل بخدمة خارجية'); assert(!/(sk-[A-Za-z0-9]{20,}|AIza|api[_-]?key\s*[:=]\s*['"])/.test(src));
  });
  await t('التكامل: تطبيق حصة ← الوسيط ← نموذج مُحاكى: طلب بصيغة حرة يعود بإجراءات تتحقق منها التطبيق، ثم يقترح المحرك تغييراً حقيقياً؛ وردّ خبيث من النموذج يُرفض', async () => {
    const c = { code: 'C0001', name: 'سارة محمد', phone: '0501234567', sex: 'أنثى', age: 34, weight: 68, height: 165, activity: D.settings.activity[2][0], goal: D.settings.goals[2][0], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, meals: 5, conditions: [], allergens: [], keywords: [], love: [], avoid: [], favMeals: [] }, plan = E.planWeek(c, D, { seed: 0 }), S = { client: c, plan }, token = await tok();
    const seen = []; const env = mkEnv((m, i) => { seen.push(i.messages[1].content); return { response: JSON.stringify({ actions: [{ type: 'set_group_total', group: 'milk', perDay: 1, subgroup: 'full', days: 'all' }], clarify: '' }) }; });
    const viaWorker = (u, init) => W.handle(new Request(u, init), env, now + 5); const cfg = { url: 'https://w.example/', token, consent: true, timeoutMs: 3000 };
    const r = await A.interpret('خلّي حليب سارة محمد 0501234567 حصة واحدة كاملة', S, { ai: cfg, fetch: viaWorker }); assert.strictEqual(r.source, 'ai'); assert(!seen[0].includes('سارة') && !seen[0].includes('0501234567') && seen[0].includes('[العميل]'), 'وصلت بيانات العميل إلى النموذج: ' + seen[0]);
    const p = A.propose(r.actions[0], S); assert(p.canApply && p.kind === 'change');
    const evil = mkEnv(() => ({ response: JSON.stringify({ actions: [{ type: 'set_group_total', group: 'milk', perDay: 999 }] }) })); const r2 = await A.interpret('خفض الحليب', S, { ai: cfg, fetch: (u, i) => W.handle(new Request(u, i), evil, now + 6) }); assert.strictEqual(r2.source, 'local'); assert(/رفضتُ رد النموذج/.test(r2.notice_ar));
    const noauth = await A.interpret('نوّع', S, { ai: Object.assign({}, cfg, { token: 'x.y' }), fetch: viaWorker }); assert.strictEqual(noauth.source, 'local'); assert(/غير صالح أو منتهٍ/.test(noauth.notice_ar));
  });
  console.log('\nنجح', n, 'اختبارات وسيط Cloudflare والتكامل');
})();
