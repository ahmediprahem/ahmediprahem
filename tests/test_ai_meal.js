// 1.78 (ر3) المُحلِّل في المحطة: وضع meal — مزوّدون مُحاكَون (لا تُستهلك أي حصة)
'use strict';
const assert = require('assert'), path = require('path'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const W = await import(path.resolve(__dirname, '../worker/relay/index.mjs'));
  const good = { ok: true, meals: [{ key: 'g0m0', pattern: 'rotate', rotation: ['جبن', 'بيض', 'زبادي', 'حليب', 'لبن'], always: ['خبز'], avoid: [], notTogether: [['حليب', 'لبن']], tags: ['high_protein', 'evil_tag'], understood: 'الفطور يتناوب يومياً على الجبن والبيض والزبادي والحليب واللبن مع الخبز، ولا يجتمع الحليب واللبن' },
    { key: 'zzz', pattern: 'rotate', rotation: ['مخترع'], understood: 'مفتاح غير موجود' }, { key: 'g0m1', pattern: 'free', rotation: [], always: [], avoid: [], notTogether: [], tags: [], understood: '' }], avoid: ['مقليات'], prefer: [], understood: ['عشاء خفيف بلا مقليات'] };
  const en = JSON.parse(JSON.stringify(good)); en.meals[0].understood = 'Breakfast rotates'; en.meals[0].rotation = ['cheese', 'egg']; en.meals[0].always = ['bread'];
  let R = {}, calls = [];
  const resp = (p) => { const x = R[p] || { st: 200, o: good }; if (x.st !== 200) return new Response('{}', { status: x.st }); const t = JSON.stringify(x.o);
    return new Response(JSON.stringify(p === 'gl' ? { candidates: [{ content: { parts: [{ text: t }] } }] } : { choices: [{ message: { content: t } }] }), { status: 200, headers: { 'content-type': 'application/json' } }); };
  globalThis.fetch = async (u, o) => { u = String(u); const p = /generativelanguage/.test(u) ? 'gl' : /groq/.test(u) ? 'groq' : /z\.ai/.test(u) ? 'zai' : '?'; calls.push({ p, o }); return resp(p); };
  const env = { DB: d1(), AI_DEMO: '1', AI_ROUTE: '1', GEMINI_API_KEY: 'g', GROQ_API_KEY: 'q', ZAI_API_KEY: 'z', AI: { run: async () => { calls.push({ p: 'cf' }); throw new Error('cf'); } } };
  let ipn = 0; const call = async (obj) => { const r = await W.default.fetch(new Request('https://relay.example/v1/ai/food', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '10.1.0.' + (ipn++ % 200) }, body: JSON.stringify(Object.assign({ demo: 1, mode: 'meal' }, obj)) }), env); return { s: r.status, j: await r.json() }; };
  const REQ = { meals: [{ key: 'g0m0', name: 'الإفطار', kind: 'main', desc: 'أريد أن تتنوع يومياً بين الجبن والبيض والزبادي والحليب واللبن مع الخبز', phone: '0501234567' }, { key: 'g0m1', name: 'الغداء', kind: 'main', desc: '' }], notes: 'عشاء خفيف بلا مقليات', name: 'سلوى' };
  // 1) Gemini أولاً، والرد يُنظَّف: مفاتيح الطلب فقط، ووسوم من القائمة فقط
  calls = []; let r = await call(REQ); assert.strictEqual(r.s, 200); assert.strictEqual(r.j.prov, 'gl'); assert.deepStrictEqual(r.j.meals.map((m) => m.key), ['g0m0', 'g0m1']);
  assert.deepStrictEqual(r.j.meals[0].rotation, ['جبن', 'بيض', 'زبادي', 'حليب', 'لبن']); assert.deepStrictEqual(r.j.meals[0].tags, ['high_protein']); assert.deepStrictEqual(r.j.meals[0].notTogether, [['حليب', 'لبن']]); assert.deepStrictEqual(r.j.avoid, ['مقليات']);
  ok('المُحلِّل: Gemini أولاً، والرد يُنظَّف (مفاتيح الطلب فقط، ووسوم من القائمة، ولا أصناف لمفتاح مخترع)');
  const sent = calls[0].o.body; assert(!/0501234567|سلوى/.test(sent), 'لا اسم ولا جوال في ما يُرسل'); assert(/الجبن والبيض/.test(sent)); ok('ما يُرسل للمزوّد: وصف الوجبات فقط (بلا اسم ولا جوال حتى لو أُرسلا خطأً)');
  // 2) الذاكرة
  calls = []; r = await call(REQ); assert.strictEqual(r.j.cached, 1); assert.strictEqual(calls.length, 0); ok('الطلب المطابق من الذاكرة بلا استهلاك');
  // 3) Gemini مشغول ← GLM (Z.ai)، ورد غير عربي يُرفض ويُجرَّب التالي
  R = { gl: { st: 429 }, groq: { st: 200, o: en } }; calls = []; r = await call(Object.assign({}, REQ, { notes: 'مختلف' })); assert.deepStrictEqual(calls.map((x) => x.p), ['gl', 'groq', 'zai']); assert.strictEqual(r.j.prov, 'zai');
  ok('Gemini مشغول ← Groq (الأدق في المعيار)، وردّه غير العربي يرفضه الحارس فيُستعمل GLM');
  const FX = { st: 200, o: Object.assign({}, good, { meals: [Object.assign({}, good.meals[0], { pattern: 'free', rotation: ['الدجاج', 'السمك', 'الدجاج', 'أرز'], always: ['أرز'] })] }) }; R = { gl: FX, groq: FX, zai: FX }; r = await call(Object.assign({}, REQ, { notes: 'تصحيح' }));
  assert.strictEqual(r.j.meals[0].pattern, 'rotate'); assert.deepStrictEqual(r.j.meals[0].rotation, ['دجاج', 'سمك']); assert.deepStrictEqual(r.j.meals[0].always, ['أرز']); ok('تصحيح حتمي: «حرة» مع أصناف = تناوب، وبلا تكرار ولا «ال»، وما في «كل يوم» لا يتناوب'); R = {};
  R = {};
  // 4) بلا وصف ولا تعليمات: لا يُستدعى أي مزوّد
  calls = []; r = await call({ meals: [{ key: 'g0m0', name: 'الإفطار', desc: '' }], notes: '' }); assert.strictEqual(r.s, 400); assert.strictEqual(calls.length, 0); ok('بلا وصف: رفض واضح بلا استدعاء');
  // 5) خارج المعاينة: يلزم توقيع أخصائي
  const r5 = await W.default.fetch(new Request('https://relay.example/v1/ai/food', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'meal', meals: REQ.meals }) }), env);
  assert.strictEqual(r5.status, 401); ok('بلا توقيع (خارج المعاينة): مرفوض');
  console.log('\nنجح', n, 'اختبارات المُحلِّل 1.78');
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1400)); process.exit(1); });
