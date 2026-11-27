// 1.28 مساعد الطعام: /v1/ai/food على المحطة — المفتاح على الخادم فقط، الطلب موقّع من عميل مسجّل (أو وضع المعاينة بحد يومي)، ونتائج منظّفة.
// Gemini مُحاكى هنا (لا يُستهلك المفتاح الحقيقي في الاختبار).
'use strict';
const assert = require('assert'), path = require('path'), HXC = require('../src/hx_crypto.js'), d1 = require('./d1_shim.js');
let n = 0; const ok = (m) => { n++; console.log('✔', m); };
(async () => {
  const W = await import(path.resolve(__dirname, '../worker/relay/index.mjs'));
  const env = { DB: d1(), REG_KEY: 'k', GEMINI_API_KEY: 'test-key-123' }, base = 'https://relay.example';
  let G = { status: 200, out: {} }, seen = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u, o) => {
    if (String(u).startsWith('https://generativelanguage.googleapis.com/')) { seen.push({ u: String(u), o }); if (G.throw) throw new Error('net'); return new Response(JSON.stringify(G.status === 200 ? { candidates: [{ content: { parts: [{ text: typeof G.out === 'string' ? G.out : JSON.stringify(G.out) }] } }] } : { error: {} }), { status: G.status }); }
    return realFetch(u, o);
  };
  const call = async (ident, obj, e, hdr) => {
    const body = JSON.stringify(obj), h = { 'content-type': 'application/json', ...(hdr || {}) };
    if (ident) h.authorization = await HXC.signReq(ident, 'POST', '/v1/ai/food', body);
    const r = await W.default.fetch(new Request(base + '/v1/ai/food', { method: 'POST', headers: h, body }), e || env); return { s: r.status, j: await r.json().catch(() => null) };
  };
  // عميل مسجّل مباشرة في القاعدة + أخصائي
  const cl = await HXC.genIdentity(), dr = await HXC.genIdentity();
  await W.default.fetch(new Request(base + '/v1/health'), env);
  await env.DB.prepare('INSERT INTO clients (id, did, sig, enc, label, created) VALUES (?, ?, ?, ?, ?, ?)').bind(cl.id, 'd0', JSON.stringify(cl.sigPub), JSON.stringify(cl.encPub), 'ع', 1).run();
  const rb = JSON.stringify({ sigPub: dr.sigPub, encPub: dr.encPub, name: 'د', regKey: 'k' });
  await W.default.fetch(new Request(base + '/v1/register', { method: 'POST', headers: { 'content-type': 'application/json', authorization: await HXC.signReq(dr, 'POST', '/v1/register', rb) }, body: rb }), env);

  // 1) الوصول
  G.out = { ok: true, title: 'برجر', items: [{ name: 'برجر لحم', portion: 'قطعة', grams: 200, kcal: 500, p: 25, c: 40, f: 25 }], total: { kcal: 9999 }, confidence: 'medium', note: 'تقدير' };
  assert.strictEqual((await call(null, { mode: 'text', text: 'برجر' })).s, 401);
  assert.strictEqual((await call(dr, { mode: 'text', text: 'برجر' })).s, 403);
  assert.strictEqual((await call(null, { mode: 'text', text: 'برجر', demo: 1 })).s, 401, 'وضع المعاينة مغلق ما لم تفعّله البيئة');
  const r1 = await call(cl, { mode: 'text', text: 'برجر بالجبنة' }); assert.strictEqual(r1.s, 200, JSON.stringify(r1.j)); assert.strictEqual(r1.j.ok, true);
  ok('الوصول: بلا توقيع 401، الأخصائي 403، المعاينة مغلقة في الإنتاج، والعميل المسجّل يحصل على التحليل');
  // 2) المفتاح في ترويسة الخادم فقط، والنموذج المطلوب
  const last = seen[seen.length - 1]; assert(/models\/gemini-2\.5-flash-lite:generateContent$/.test(last.u), last.u); assert.strictEqual(last.o.headers['x-goog-api-key'], 'test-key-123');
  assert(!/test-key-123/.test(JSON.stringify(r1.j)) && !/key=/.test(last.u)); ok('المفتاح يُرسل من الخادم في الترويسة فقط (لا في الرابط ولا في الرد)، والنموذج gemini-2.5-flash-lite');
  // 3) الوصف النصي: المجموع يُحسب من الأصناف لا من النموذج، والتقدير معلَن
  assert.deepStrictEqual(r1.j.total, { kcal: 500, p: 25, c: 40, f: 25 }); assert.strictEqual(r1.j.est, true); assert.strictEqual(r1.j.items[0].name, 'برجر لحم');
  ok('م2 الوصف: أصناف بحصصها وسعراتها وماكروزها، والمجموع محسوب من الأصناف (9999 من النموذج تُهمل)، ومعلَّم تقديرياً');
  // 4) الصورة: لا ثقة «عالية» من الصورة، والصورة غير الصالحة تُرفض قبل Gemini
  G.out = Object.assign({}, G.out, { confidence: 'high' }); const n0 = seen.length;
  const r2 = await call(cl, { mode: 'photo', img: 'QUJD', mime: 'image/jpeg' }); assert.strictEqual(r2.j.confidence, 'medium');
  assert.strictEqual((await call(cl, { mode: 'photo', img: '<script>', mime: 'image/jpeg' })).s, 400); assert.strictEqual((await call(cl, { mode: 'photo', img: 'QUJD', mime: 'image/gif' })).s, 400);
  assert.strictEqual(seen.length, n0 + 1); const parts = JSON.parse(seen[seen.length - 1].o.body).contents[0].parts; assert(parts.some((p) => p.inline_data && p.inline_data.mime_type === 'image/jpeg'));
  G.out = { ok: false, reason: 'الصورة غير واضحة' }; const r3 = await call(cl, { mode: 'photo', img: 'QUJD', mime: 'image/jpeg' }); assert.strictEqual(r3.j.ok, false); assert(/غير واضحة/.test(r3.j.reason));
  ok('م3 الصورة: تُرسل كصورة مضمّنة، لا «ثقة عالية» من صورة، والصورة غير الصالحة تُرفض، والغامضة تُعاد بسببها');
  // 5) الملصق + التقييم: ما لم يُذكر null، والتقييم بقيم معروفة فقط
  G.out = { ok: true, product: 'تونة', serving: '85 جم', per: { kcal: '180', fat: '12g', satFat: 2, transFat: '1.5 g', sodium: '640 ملجم', carbs: 0, sugars: 'x', protein: 17 }, ingredients: ['تونة', 'زيت نباتي مهدرج', 'ملح'], assessment: { rating: 'bad', summary: 'معتدل', positives: ['بروتين عالٍ'], concerns: ['دهون متحولة'], reasons: ['1.5 جم دهون متحولة'], alternatives: ['تونة بالماء'], tips: ['صفِّ الزيت'] } };
  const r4 = await call(cl, { mode: 'label', img: 'QUJD', mime: 'image/png' });
  assert.strictEqual(r4.j.per.transFat, 1.5); assert.strictEqual(r4.j.per.fat, 12); assert.strictEqual(r4.j.per.sodium, 640); assert.strictEqual(r4.j.per.kcal, 180); assert.strictEqual(r4.j.per.sugars, null); assert.strictEqual(r4.j.per.addedSugars, null); assert.strictEqual(r4.j.assessment.rating, 'moderate'); assert.deepStrictEqual(r4.j.assessment.concerns, ['دهون متحولة']);
  ok('م4–م5 الملصق: القيم المقروءة كما هي، وما لم يُذكر null (لا تخمين)، والتقييم صحي/معتدل/للمناسبات مع الإيجابيات والمخاوف والأسباب والبدائل');
  // 6) التخزين
  G.out = { ok: true, food: 'سمك بلطي', category: 'أسماك', place: 'freezer', temp: '4°م أو أقل', fridge: 'يومان', freezer: '6 أشهر', room: 'لا يزيد عن ساعتين', howTo: ['لفّه جيداً'], spoilSigns: ['رائحة نفاذة'], unsafeSigns: ['لزوجة'], handling: ['اطهه حتى 63°م'], note: 'السلامة لا تُؤكد من صورة' };
  const r5 = await call(cl, { mode: 'store', img: 'QUJD', mime: 'image/jpeg' }); assert.strictEqual(r5.j.place, 'freezer'); assert.strictEqual(r5.j.fridge, 'يومان'); assert(/صورة/.test(r5.j.note));
  ok('م6 التخزين: المكان والحرارة والمدد وعلامات الفساد والتعامل الآمن، مع تنبيه أن السلامة لا تُؤكد من صورة');
  // 7) الأخطاء
  G.status = 429; assert.strictEqual((await call(cl, { mode: 'text', text: 'أرز' })).s, 429); G.status = 403; const e2 = await call(cl, { mode: 'text', text: 'أرز' }); assert.strictEqual(e2.s, 502); assert(!/test-key/.test(JSON.stringify(e2.j)));
  G.status = 200; G.out = 'ليس JSON'; const e3 = await call(cl, { mode: 'text', text: 'أرز' }); assert.strictEqual(e3.j.ok, false);
  G.throw = 1; assert.strictEqual((await call(cl, { mode: 'text', text: 'أرز' })).s, 504); G.throw = 0;
  assert.strictEqual((await call(cl, { mode: 'nope' })).s, 400); assert.strictEqual((await call(cl, { mode: 'text', text: '' })).s, 400);
  assert.strictEqual((await call(cl, { mode: 'text', text: 'أرز' }, { DB: env.DB, REG_KEY: 'k' })).s, 503);
  ok('الأخطاء: مشغول 429، خطأ المفتاح 502 دون كشفه، رد غير مفهوم → ok:false، انقطاع 504، نوع أو نص فارغ 400، وبلا مفتاح 503');
  // 8) الحدود اليومية
  G.out = { ok: true, items: [{ name: 'أرز', kcal: 200 }] }; let last429 = 0; for (let i = 0; i < 45; i++) { const r = await call(cl, { mode: 'text', text: 'أرز' + i }); if (r.s === 429) { last429 = i; break; } }
  assert(last429 > 20 && last429 <= 40, last429); ok('حد يومي لكل عميل (' + 40 + ' تحليلاً) ثم 429 برسالة واضحة');
  const envD = { DB: env.DB, GEMINI_API_KEY: 'x', AI_DEMO: '1' }; let d429 = 0; for (let i = 0; i < 45; i++) { const r = await call(null, { mode: 'text', text: 'تفاح' + i, demo: 1 }, envD, { 'cf-connecting-ip': '1.2.3.4' }); if (r.s === 429) { d429 = i; break; } else assert.strictEqual(r.s, 200); }
  assert.strictEqual(d429, 40); ok('وضع المعاينة (AI_DEMO=1 فقط): بلا حساب، بحد 40 لكل عنوان يومياً وحد عام');
  // 8ب) 2.5 غير متاح للحسابات الجديدة: البديل تلقائياً
  { const e2 = { DB: env.DB, GEMINI_API_KEY: 'k2', AI_DEMO: '1' }, n1 = seen.length; G.out = { ok: true, items: [{ name: 'موز', kcal: 100 }] }; const f0 = globalThis.fetch;
    globalThis.fetch = async (u, o) => /gemini-2\.5-flash-lite/.test(String(u)) ? (seen.push({ u: String(u), o }), new Response('{}', { status: 404 })) : f0(u, o);
    const r = await call(null, { mode: 'text', text: 'موزة', demo: 1 }, e2, { 'cf-connecting-ip': '9.9.9.9' }); globalThis.fetch = f0;
    assert.strictEqual(r.j.ok, true); assert(/2\.5-flash-lite/.test(seen[n1].u) && /3\.5-flash-lite/.test(seen[n1 + 1].u)); ok('النموذج: gemini-2.5-flash-lite أولاً، وإن ردّت غوغل 404 (غير متاح للحسابات الجديدة) يُستعمل gemini-3.5-flash-lite تلقائياً'); }
  // 10) 1.56 تقييم المكملات: مغلق حتى يُفعَّل (AI_SUPP=1)، ويقبل الوصف أو الصورة، والجدول المرجعي في الطلب، ونتائج منظّفة
  { const cl2 = await HXC.genIdentity(); await env.DB.prepare('INSERT INTO clients (id, did, sig, enc, label, created) VALUES (?, ?, ?, ?, ?, ?)').bind(cl2.id, 'd0', JSON.stringify(cl2.sigPub), JSON.stringify(cl2.encPub), 'ع2', 1).run();
    G.status = 200; G.throw = 0; const off = await call(cl2, { mode: 'supp', text: 'فيتامين د 5000 وحدة' }); assert.strictEqual(off.s, 503); assert.strictEqual(off.j.code, 'nosupp');
    const eS = Object.assign({}, env, { AI_SUPP: '1' }); G.out = { ok: true, product: 'فيتامين د3', kind: 'vitamin', serving: 'كبسولة', grade: 'Z', summary: 'مفيد عند النقص', items: [{ name: 'فيتامين د3', amount: '5000 وحدة', form: 'D3', usual: '600–800 وحدة', upper: '4000 وحدة', verdict: 'high' }, { name: 'x', verdict: 'weird' }], proven: ['صحة العظام عند النقص', 'صحة القلب (دليل متباين)'], claimed: ['يمنع الاكتئاب'], who: ['من لديه نقص مثبت'], notNeeded: ['مستواك طبيعي'], onset: 'أسابيع', dose: '600–800 وحدة يومياً', timing: ['مع أكبر وجبة فيها دهون'], food: ['لا تعارض غذائي مهم'], howTo: ['مع وجبة فيها دهون'], cautions: ['ارتفاع الكالسيوم'], quality: [], foods: ['السمك الدهني'] };
    const n2 = seen.length, r6 = await call(cl2, { mode: 'supp', text: 'فيتامين د 5000 وحدة يومياً' }, eS); assert.strictEqual(r6.s, 200, JSON.stringify(r6.j));
    assert.strictEqual(r6.j.grade, 'C'); assert.strictEqual(r6.j.items[0].verdict, 'high'); assert.strictEqual(r6.j.items[1].verdict, 'unknown'); assert.deepStrictEqual(r6.j.proven, ['صحة العظام عند النقص']); assert.deepStrictEqual(r6.j.claimed, ['يمنع الاكتئاب', 'صحة القلب (دليل متباين)']); assert.strictEqual(r6.j.onset, 'أسابيع'); assert.strictEqual(r6.j.dose, '600–800 وحدة يومياً'); assert.deepStrictEqual(r6.j.timing, ['مع أكبر وجبة فيها دهون']); assert.deepStrictEqual(r6.j.food, ['لا تعارض غذائي مهم']);
    const body6 = JSON.parse(seen[n2].o.body).contents[0].parts.map((x) => x.text || '').join(' '); assert(/4000 وحدة يومياً/.test(body6) && /الشاي والقهوة والحليب/.test(body6) && /التعارض مع الطعام/.test(body6) && /الكرياتين مونوهيدرات/.test(body6) && /فيتامين د 5000/.test(body6), 'الجدول المرجعي ووصف المستخدم في الطلب');
    const r7 = await call(cl2, { mode: 'supp', img: 'QUJD', mime: 'image/jpeg' }, eS); assert.strictEqual(r7.s, 200); assert(JSON.parse(seen[seen.length - 1].o.body).contents[0].parts.some((x) => x.inline_data));
    assert.strictEqual((await call(cl2, { mode: 'supp', text: '' }, eS)).s, 400); assert(W.SUPP_REF.length >= 15 && W.SUPP_REF.every((r) => r.length === 8 && r[6] && r[7]));
    ok('م1.56 المكملات: مغلق حتى AI_SUPP=1، يقبل الوصف أو صورة الملصق، الجدول المرجعي (' + W.SUPP_REF.length + ' مكمّلاً بمصادرها) مع الطلب، الفائدة المثبتة والمروّجة ومن يستفيد، وحكم الجرعة low/ok/high'); }
  // 9) تنظيف العدّادات القديمة
  await env.DB.prepare("INSERT INTO kv (k, v) VALUES ('ai.old.2020-01-01', '5')").run(); await W.default.scheduled({ scheduledTime: Date.now() }, env, null).catch(() => { });
  await new Promise((r) => setTimeout(r, 50)); assert(!(await env.DB.prepare("SELECT v FROM kv WHERE k = 'ai.old.2020-01-01'").first())); ok('عدّادات الأيام السابقة تُحذف في المهمة الدورية');
  globalThis.fetch = realFetch; console.log('\nنجح', n, 'اختبارات مساعد الطعام (المحطة)');
})().catch((e) => { console.log('✘', e && e.stack || e); process.exit(1); });
