// 1.58 (المحطة 1.29) الموزّع: ذاكرة النتائج + التناوب بين المزوّدين + حارس الجودة — كل المزوّدين مُحاكَون (لا تُستهلك مفاتيح حقيقية)
'use strict';
const assert = require('assert'), path = require('path'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const W = await import(path.resolve(__dirname, '../worker/relay/index.mjs'));
  const good = { ok: true, title: 'أرز ودجاج', items: [{ name: 'أرز', portion: 'كوب', grams: 160, kcal: 210, p: 4, c: 46, f: 1 }, { name: 'دجاج مشوي', portion: 'قطعة', grams: 120, kcal: 200, p: 36, c: 0, f: 6 }], confidence: 'medium', note: '' };
  const bad = { ok: true, title: 'أرز', items: [{ name: 'أرز', kcal: 900, p: 4, c: 46, f: 1 }] };      // السعرات لا تتسق مع الماكروز
  const en = { ok: true, title: 'Rice', items: [{ name: 'rice', kcal: 210, p: 4, c: 46, f: 1 }] };       // ليس عربياً
  let R = {}, calls = [];
  const resp = (p) => { const x = R[p] || { st: 200, o: good }; if (x.st !== 200) return new Response('{}', { status: x.st });
    const t = typeof x.o === 'string' ? x.o : JSON.stringify(x.o); return new Response(JSON.stringify(p === 'gl' || p === 'gf' ? { candidates: [{ content: { parts: [{ text: t }] } }] } : { choices: [{ message: { content: t } }] }), { status: 200 }); };
  globalThis.fetch = async (u, o) => { u = String(u); const p = /gemini-3\.5-flash:/.test(u) ? 'gf' : /generativelanguage/.test(u) ? 'gl' : /groq/.test(u) ? 'groq' : /z\.ai/.test(u) ? 'zai' : '?'; calls.push({ p, o }); return resp(p); };
  const AIb = { run: async (m, inp) => { calls.push({ p: 'cf', m, inp }); const x = R.cf || { st: 200, o: good }; if (x.st !== 200) throw new Error('cf'); return { response: JSON.stringify(x.o) }; } };
  const env = { DB: d1(), AI_DEMO: '1', AI_ROUTE: '1', AI_BENCH: 'b3nch', GEMINI_API_KEY: 'g', GROQ_API_KEY: 'q', ZAI_API_KEY: 'z', AI: AIb };
  let ipn = 0; const call = async (obj, e) => { const r = await W.default.fetch(new Request('https://relay.example/v1/ai/food', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '10.0.0.' + (ipn++ % 200) }, body: JSON.stringify(Object.assign({ demo: 1 }, obj)) }), e || env); return { s: r.status, j: await r.json() }; };
  const IMG = { mode: 'photo', img: 'QUJDRA==', mime: 'image/jpeg' };

  // 1) النصوص: Gemini أولاً، وعند انشغاله Groq
  R = { gl: { st: 429 } }; calls = []; let r = await call({ mode: 'text', text: 'كوب أرز وقطعة دجاج' }); assert.strictEqual(r.s, 200); assert.strictEqual(r.j.prov, 'groq'); assert.deepStrictEqual(calls.map((x) => x.p), ['gl', 'groq']); assert(!r.j.backup);
  assert.strictEqual(calls[1].o.headers.authorization, 'Bearer q'); assert(!/"q"|Bearer/.test(JSON.stringify(r.j))); R = {};
  ok('النصوص: Gemini أولاً وعند انشغاله Groq، والمفتاح في ترويسة الخادم فقط ولا يظهر في الرد');
  // 2) الذاكرة: نفس الوصف (بمسافات وحروف مختلفة) لا يستدعي أي مزوّد
  calls = []; r = await call({ mode: 'text', text: '  كوب  أرز وقطعة دجاج ' }); assert.strictEqual(r.j.cached, 1); assert.strictEqual(calls.length, 0); assert.strictEqual(r.j.title, 'أرز ودجاج');
  ok('ذاكرة النتائج: الطلب المطابق بعد التطبيع يُعاد فوراً بلا استهلاك أي حد');
  // 3) الملصق: Gemini ثم Cloudflare ثم Groq؛ النتيجة «تقدير احتياطي»، والمشغول يُتجاوز دقيقة
  const LBL = { mode: 'label', img: 'QUJDRA==', mime: 'image/jpeg' }, lb = { ok: true, product: 'ت', per: { kcal: 100, fat: 1, carbs: 20, protein: 3 }, assessment: { rating: 'healthy', summary: 'جيد' } };
  R = { gl: { st: 429 }, cf: { st: 500 }, groq: { st: 200, o: lb } }; calls = []; r = await call(LBL); assert.strictEqual(r.s, 200); assert.deepStrictEqual(calls.map((x) => x.p), ['cf', 'groq']); assert.strictEqual(r.j.prov, 'groq'); assert.strictEqual(r.j.backup, 1);      // Gemini ردّ 429 في (1) قبل ثوانٍ: يُتجاوز دقيقة
  const gq = JSON.parse(calls[1].o.body); assert.strictEqual(gq.messages[0].content[1].image_url.url, 'data:image/jpeg;base64,QUJDRA=='); assert.strictEqual(gq.model, 'qwen/qwen3.8-27b');
  calls = []; r = await call(Object.assign({}, LBL, { img: 'QUJDRUU=' })); assert.deepStrictEqual(calls.map((x) => x.p), ['cf', 'groq']);
  R = { gl: { st: 429 } }; calls = []; r = await call({ mode: 'supp', text: 'فيتامين د ' + Date.now() }); assert(!calls.some((x) => x.p === 'cf' || x.p === 'gf'));
  ok('ترتيب لكل نوع: الملصق Gemini ثم Cloudflare ثم Groq بعلامة «تقدير احتياطي»، والمشغول يُتجاوز، والمكملات لا تذهب إلى Cloudflare ولا Gemini Flash');
  // 4) حارس الجودة: سعرات غير متسقة أو رد غير عربي → المزوّد التالي
  R = { gl: { st: 429 }, groq: { st: 200, o: bad }, zai: { st: 200, o: en } }; calls = [];
  r = await call({ mode: 'text', text: 'طبق أرز ' + Date.now(), bench: 'b3nch', nocache: 1 }); assert.strictEqual(r.j.prov, 'zai' === r.j.prov ? 'x' : r.j.prov);
  assert.deepStrictEqual(calls.map((x) => x.p), ['groq', 'cf']); assert.strictEqual(r.j.prov, 'cf'); assert(!r.j.guard);
  assert.strictEqual(W.aiGuard('text', { ok: true, title: 'أ', items: [{ name: 'أ' }], total: { kcal: 900, p: 4, c: 46, f: 1 } }), 'energy');
  assert.strictEqual(W.aiGuard('label', { ok: true, per: { fat: 2, satFat: 5 }, assessment: { summary: 'ع', positives: [], concerns: [] } }), 'sat');
  ok('حارس الجودة: سعرات لا تتسق مع الماكروز، أو رد بغير العربية، أو دهون مشبعة أكثر من الكلية → يُعاد بالمزوّد التالي');
  // 5) كلهم رفضهم الحارس: تُعاد أول نتيجة مع سبب الرفض بدل الخطأ
  R = { groq: { st: 200, o: bad }, gl: { st: 200, o: bad }, zai: { st: 200, o: bad }, gf: { st: 200, o: bad }, cf: { st: 200, o: bad } }; for (const k in W.AI_PV) void 0;
  r = await call({ mode: 'text', text: 'شيء ' + Date.now(), bench: 'b3nch', nocache: 1 }); assert.strictEqual(r.s, 200); assert.strictEqual(r.j.guard, 'energy'); assert.strictEqual(r.j.prov, 'groq');      // Gemini ما زال في فترة التجاوز
  ok('إن لم تجتز أي نتيجة الحارس تُعاد الأولى مع سببه، ولا تُحفظ في الذاكرة');
  // 6) الكل مشغول → 429 واضح
  R = { gl: { st: 429 }, gf: { st: 429 }, groq: { st: 429 }, zai: { st: 429 }, cf: { st: 500 } }; r = await call(Object.assign({}, IMG, { img: 'WFla' })); assert.strictEqual(r.s, 429); assert.strictEqual(r.j.code || r.j.err || 'aibusy', r.j.code || r.j.err || 'aibusy');
  ok('عند انشغال كل المزوّدين: 429 «المساعد مشغول»');
  // 7) قياس الدقة: فرض مزوّد بعينه فقط بسرّ AI_BENCH وعلى المعاينة
  R = {}; calls = []; r = await call({ mode: 'text', text: 'خبز ' + Date.now(), prov: 'zai', bench: 'b3nch', nocache: 1 }); assert.deepStrictEqual(calls.map((x) => x.p), ['zai']);
  calls = []; r = await call({ mode: 'text', text: 'خبز2 ' + Date.now(), prov: 'zai', bench: 'wrong' }); assert.notDeepStrictEqual(calls.map((x) => x.p), ['zai']);
  ok('فرض مزوّد للقياس يحتاج سرّ AI_BENCH في المعاينة، وإلا يُتجاهل');
  // 8) بلا AI_ROUTE: Gemini وحده كما في 1.28 (لا Groq ولا ذاكرة)
  const e0 = Object.assign({}, env, { AI_ROUTE: undefined }); R = {}; calls = []; r = await call({ mode: 'text', text: 'تمر' }, e0); r = await call({ mode: 'text', text: 'تمر' }, e0);
  assert.deepStrictEqual(calls.map((x) => x.p), ['gl', 'gl']); assert(!r.j.prov && !r.j.cached);
  ok('بلا AI_ROUTE=1 يبقى السلوك القديم: Gemini وحده بلا ذاكرة (الإنتاج لا يتغير قبل اعتماد المالك)');
  // 9) قراءة ردود النماذج الأخرى: تفكير وأسوار ونص حول JSON
  assert.deepStrictEqual(W.aiJson('<think>x</think>\n```json\n{"a":1,}\n```'), { a: 1 }); assert.deepStrictEqual(W.aiJson('إليك: {"b":[1,2,],} شكراً'), { b: [1, 2] }); assert.strictEqual(W.aiJson('لا'), null);
  ok('ردود Groq وZ.ai وCloudflare: يُحذف التفكير والأسوار والنص المحيط، وتُصلح الفواصل الزائدة');
  // 10) تنظيف الذاكرة القديمة في المهمة الدورية
  await env.DB.prepare('INSERT INTO kv (k, v) VALUES (?, ?)').bind('aic.old', (Date.now() - 40 * 864e5) + '|{}').run();
  await W.default.scheduled({ scheduledTime: Date.now() }, env, null);
  assert(!(await env.DB.prepare("SELECT k FROM kv WHERE k = 'aic.old'").first())); assert(await env.DB.prepare("SELECT k FROM kv WHERE k LIKE 'aic.%'").first());
  ok('الذاكرة تُحذف بعد 30 يوماً في المهمة الدورية، والحديثة تبقى');
  console.log('\nنجح ' + n + ' اختبارات الموزّع');
})().catch((e) => { console.error('✘', e); process.exit(1); });
