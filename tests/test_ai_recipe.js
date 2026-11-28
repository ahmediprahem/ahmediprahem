// 1.80 (ر5) الوصفات في المحطة: وضع recipe والصورة (FLUX ثم Pixabay) — مزوّدون مُحاكَون (لا تُستهلك أي حصة)
'use strict';
const assert = require('assert'), path = require('path'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const W = await import(path.resolve(__dirname, '../worker/relay/index.mjs'));
  const good = { ok: true, title: 'فول بالزيت الحار', ingredients: ['1 كوب فول مدمس', '1 ملعقة صغيرة زيت زيتون', '1/2 حبة طماطم', 'ملح وكمون'], steps: ['سخّن الفول', 'أضف الزيت والكمون', 'قدّمه مع الطماطم'], minutes: 10, img: 'Egyptian fava beans <script> with olive oil in a clay bowl' };
  let R = {}, calls = [], flux = 'ok', px = null;
  const resp = (p) => { const x = R[p] || { st: 200, o: good }; if (x.st !== 200) return new Response('{}', { status: x.st }); const t = JSON.stringify(x.o);
    return new Response(JSON.stringify(p === 'gl' ? { candidates: [{ content: { parts: [{ text: t }] } }] } : { choices: [{ message: { content: t } }] }), { status: 200, headers: { 'content-type': 'application/json' } }); };
  globalThis.fetch = async (u, o) => { u = String(u);
    if (/pixabay\.com\/api/.test(u)) { calls.push({ p: 'pxq', u }); return new Response(JSON.stringify({ hits: px || [] }), { status: 200 }); }
    if (/cdn\.pixabay/.test(u)) { calls.push({ p: 'pxi' }); return new Response(new Uint8Array([255, 216, 255, 1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } }); }
    const p = /generativelanguage/.test(u) ? 'gl' : /groq/.test(u) ? 'groq' : /z\.ai/.test(u) ? 'zai' : '?'; calls.push({ p, o }); return resp(p); };
  const env = { DB: d1(), AI_DEMO: '1', AI_ROUTE: '1', GEMINI_API_KEY: 'g', GROQ_API_KEY: 'q', ZAI_API_KEY: 'z', PIXABAY_API_KEY: 'px', AI: { run: async (m, a) => { calls.push({ p: 'cf', m, a }); if (/flux/.test(m)) { if (flux === 'ok') return { image: 'AAAA' }; throw new Error('quota'); } throw new Error('cf'); } } };
  let ipn = 0; const call = async (p, obj) => { const r = await W.default.fetch(new Request('https://relay.example' + p, { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '10.2.0.' + (ipn++ % 200) }, body: JSON.stringify(Object.assign({ demo: 1 }, obj)) }), env); return { s: r.status, j: await r.json() }; };
  // 1) الوصفة: Gemini، والرد مُنظَّف، ووصف الصورة إنجليزي نظيف
  calls = []; let r = await call('/v1/ai/food', { mode: 'recipe', dish: 'فول بالزيت الحار', meal: 'الإفطار', foods: ['فول مدمس', 'زيت زيتون'], name: 'سلوى', phone: '0501234567' });
  assert.strictEqual(r.s, 200); assert.strictEqual(r.j.prov, 'gl'); assert.strictEqual(r.j.title, 'فول بالزيت الحار'); assert.strictEqual(r.j.ingredients.length, 4); assert.strictEqual(r.j.minutes, 10); assert(!/[<>]/.test(r.j.img) && /fava beans/.test(r.j.img));
  ok('الوصفة: Gemini أولاً، والرد مُنظَّف (مكونات وخطوات ووقت، ووصف صورة إنجليزي بلا رموز)');
  const sent = calls[0].o.body; assert(!/سلوى|0501234567/.test(sent)); assert(/فول مدمس/.test(sent)); ok('ما يُرسل: اسم الطبق ونوع الوجبة وأسماء أصناف القاعدة فقط (بلا اسم ولا جوال)');
  // 2) رد غير عربي يُرفض ويُجرَّب التالي
  R = { gl: { st: 200, o: Object.assign({}, good, { title: 'Foul', ingredients: ['1 cup fava beans'] }) } }; calls = []; r = await call('/v1/ai/food', { mode: 'recipe', dish: 'فول بالطماطم' });
  assert.strictEqual(r.j.prov, 'groq'); assert(/فول/.test(r.j.title)); ok('رد غير عربي يرفضه الحارس فيُستعمل Groq'); R = {};
  // 3) بلا اسم طبق: رفض بلا استدعاء، وخارج المعاينة يلزم توقيع أخصائي
  calls = []; r = await call('/v1/ai/food', { mode: 'recipe', dish: '' }); assert.strictEqual(r.s, 400); assert.strictEqual(calls.length, 0);
  const r4 = await W.default.fetch(new Request('https://relay.example/v1/ai/food', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'recipe', dish: 'فول' }) }), env); assert.strictEqual(r4.status, 401);
  const r4b = await W.default.fetch(new Request('https://relay.example/v1/ai/recipe-img', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'fava beans' }) }), env); assert.strictEqual(r4b.status, 401);
  ok('بلا اسم طبق: رفض بلا استدعاء؛ وبلا توقيع (خارج المعاينة): الوصفة والصورة مرفوضتان');
  // 4) الصورة: FLUX أولاً بوصف آمن
  calls = []; r = await call('/v1/ai/recipe-img', { prompt: 'Egyptian fava beans <b>with olive oil' }); assert.strictEqual(r.j.ok, true); assert.strictEqual(r.j.src, 'flux'); assert.strictEqual(r.j.img, 'AAAA');
  const fc = calls.find((c) => c.p === 'cf'); assert(/flux-1-schnell/.test(fc.m) && /fava beans/.test(fc.a.prompt) && !/[<>]/.test(fc.a.prompt) && /no text/.test(fc.a.prompt)); ok('الصورة: FLUX على Cloudflare أولاً، بوصف إنجليزي نظيف و«صورة توضيحية»');
  // 5) FLUX نفدت حصته ← Pixabay بصورة وسومها طعام فقط، وتُحمَّل (لا رابط مباشر)
  flux = 'fail'; px = [{ tags: 'football, soccer, beans', webformatURL: 'https://cdn.pixabay.com/x/ball.jpg', user: 'a' }, { tags: 'fava beans, food, dish, healthy', webformatURL: 'https://cdn.pixabay.com/x/foul.jpg', user: 'cook', pageURL: 'https://pixabay.com/p/1' }];
  calls = []; r = await call('/v1/ai/recipe-img', { prompt: 'fava beans stew' }); assert.strictEqual(r.j.src, 'pixabay'); assert(/cook/.test(r.j.credit)); assert.strictEqual(r.j.img, Buffer.from([255, 216, 255, 1, 2, 3]).toString('base64')); assert(calls.some((c) => c.p === 'pxi'));
  ok('نفدت حصة FLUX ← Pixabay: تُستبعد صورة كرة القدم، وتُختار صورة وسومها طعام، وتُحمَّل مع ذكر المصدر');
  px = [{ tags: 'football, soccer', webformatURL: 'https://cdn.pixabay.com/x/ball.jpg' }]; r = await call('/v1/ai/recipe-img', { prompt: 'fava beans stew' }); assert.strictEqual(r.j.ok, false); assert(/بلا صورة/.test(r.j.reason));
  ok('لا صورة مناسبة: تبقى الوصفة بلا صورة (لا تُعرض صورة خاطئة)');
  assert.strictEqual(W.imgPick([{ tags: 'person, woman, food', webformatURL: 'x' }], 'food'), null); ok('لا صور أشخاص');
  console.log('\nنجح', n, 'اختبارات الوصفات في المحطة 1.80');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
