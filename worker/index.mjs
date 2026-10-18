/* وسيط dt/hamed على Cloudflare Workers (يعمل على الخطة المجانية).
   وظيفته الوحيدة: استلام «نص الطلب» بعد إزالة الهوية من تطبيق حصة، وتحويله بواسطة نموذج Workers AI إلى إجراءات JSON من قائمة محدودة.
   - لا يوجد أي مفتاح API في هذا الكود: ربط الذكاء الاصطناعي يتم عبر «binding» اسمه AI داخل لوحة Cloudflare.
   - لا يُخزِّن ولا يسجّل نص الطلبات (لا console.log لأي محتوى).
   - يقبل فقط من يحمل كود تفعيل موقَّعاً بمفتاح المدير (ADMIN_PUB) غير منتهٍ، فلا يستنزف أحد الحصة المجانية.
   - الخطة المجانية لا تُفوتِر تلقائياً: عند نفاد الحصة اليومية تفشل الطلبات فيعود التطبيق إلى الفهم المحلي. */
const ACTION_TYPES = ['replace_food', 'assign_foods', 'move_exchanges', 'set_group_total', 'generate_week', 'improve_variety', 'adapt_for_condition', 'show_diff', 'undo', 'clinical_info'];
const DEFAULT_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';
const MAX_BODY = 4096, MAX_TEXT = 500, RATE = { perMin: 12, perDay: 200 };
const enc = new TextEncoder(), dec = new TextDecoder();
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type', 'access-control-max-age': '86400' };
const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS, ...extra } });

const SYSTEM = `You are the command interpreter of "dt/hamed", an assistant inside an Arabic clinical-nutrition app for dietitians (Food Exchange System).
You DO NOT give medical advice, never invent foods, quantities, nutrient values or citations, and never compute anything.
Your only job: convert the user's Arabic or English request into JSON actions from the allowed list, or ask ONE short clarifying question.
Reply with ONE JSON object only, no prose, no markdown: {"actions":[...],"clarify":""}
Allowed action types and fields (omit unknown fields; never add other fields):
- {"type":"replace_food","from":"food as the user wrote it","to":"auto"|"food name","meal":"B|L|D|S","days":"all"|[0-6]}
- {"type":"assign_foods","meal":"B|L|D|S","days":[0-6],"assignments":[{"group":"starch|legumes|meat|vlean|lean|medium|high|milk|veg|fruit|fat|sweets","foods":["food names"]}]}
- {"type":"move_exchanges","group":"starch|legumes|vlean|lean|medium|high|milkskim|milklow|milkfull|veg|fruit|fat","from":"B|L|D|S","to":"B|L|D|S","amount":0.5-4,"days":"all"|[0-6]}
- {"type":"set_group_total","group":"milk","perDay":number,"subgroup":"full|low|skim","days":"all"|[0-6]}
- {"type":"generate_week"} {"type":"improve_variety"} {"type":"show_diff"} {"type":"undo"}
- {"type":"adapt_for_condition","condition":"condition name"} {"type":"clinical_info","topic":"short topic"}
Meals: B=breakfast, L=lunch, D=dinner, S=snack. Days: 0=Sunday,1=Monday,2=Tuesday,3=Wednesday,4=Thursday,5=Friday,6=Saturday.
Rules: keep food names exactly as the user said them. If the request is ambiguous or clinically consequential, put a question in "clarify" and leave actions empty. If it is not a plan-editing or nutrition-workflow request, return {"actions":[],"clarify":"لم أفهم الطلب"}.
Examples:
User: شيل الرز من العشاء وحط بدله صنف معتمد من نفس المجموعة
{"actions":[{"type":"replace_food","from":"الرز","to":"auto","meal":"D","days":"all"}],"clarify":""}
User: خلي العشاء توست أيام الأحد والثلاثاء وبيض مع سلطة وجبن باقي الأيام
{"actions":[{"type":"assign_foods","meal":"D","days":[0,2],"assignments":[{"group":"starch","foods":["توست"]}]},{"type":"assign_foods","meal":"D","days":[1,3,4,5,6],"assignments":[{"group":"meat","foods":["بيض","جبن"]},{"group":"veg","foods":["سلطة"]}]}],"clarify":""}
User: خفض الحليب إلى حصة واحدة كاملة الدسم يومياً
{"actions":[{"type":"set_group_total","group":"milk","perDay":1,"subgroup":"full","days":"all"}],"clarify":""}`;

// ---------- التحقق من كود التفعيل (ECDSA P-256) — نفس صيغة تطبيق حصة: base64url(payload).base64url(signature)
const b64uToBytes = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
export async function verifyToken(token, adminPubJson, nowSec = Math.floor(Date.now() / 1000)) {
  const parts = String(token || '').replace(/\s+/g, '').split('.'); if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let pub; try { pub = JSON.parse(adminPubJson); } catch { return null; }
  try {
    const key = await crypto.subtle.importKey('jwk', pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uToBytes(parts[1]), enc.encode(parts[0])); if (!ok) return null;
    const p = JSON.parse(dec.decode(b64uToBytes(parts[0]))); if (p.v !== 1 || !p.u) return null; if (p.exp && p.exp < nowSec) return null; return p;
  } catch { return null; }
}
// ---------- تحديد المعدل (محلي لكل نسخة تشغيل، كحد أدنى للحماية؛ الحد الحقيقي هو الحصة اليومية المجانية لـ Workers AI)
const hits = new Map();
export function rateLimited(user, now) {
  const arr = (hits.get(user) || []).filter((t) => now - t < 86400000); const lastMin = arr.filter((t) => now - t < 60000).length;
  if (lastMin >= RATE.perMin || arr.length >= RATE.perDay) { hits.set(user, arr); return true; } arr.push(now); hits.set(user, arr); if (hits.size > 500) hits.delete(hits.keys().next().value); return false;
}
// ---------- استخراج JSON من رد النموذج بحذر (قد يضيف <think> أو أسوار markdown)
export function extractJson(raw) {
  if (raw && typeof raw === 'object') return raw; let t = String(raw || '');
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim(); const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}
const pickText = (r) => { if (!r) return ''; if (typeof r === 'string') return r; const c = r.choices && r.choices[0]; return (r.response !== undefined ? r.response : c && c.message ? c.message.content : c && c.text) || (r.result && r.result.response) || ''; };
const sanitize = (j) => {          // ترشيح هيكلي أولي؛ تطبيق حصة يعيد التحقق الصارم بعد الاستلام
  const actions = Array.isArray(j && j.actions) ? j.actions.filter((a) => a && typeof a === 'object' && ACTION_TYPES.includes(a.type)).slice(0, 4) : [];
  return { actions, clarify: typeof (j && j.clarify) === 'string' ? j.clarify.slice(0, 300) : '' };
};
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), ms))]);

export async function handle(request, env, now = Date.now()) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  if (!env || !env.ADMIN_PUB || !env.AI) return json({ ok: false, error: 'not_configured' }, 500);
  const auth = request.headers.get('authorization') || '', tok = auth.replace(/^Bearer\s+/i, ''), who = await verifyToken(tok, env.ADMIN_PUB, Math.floor(now / 1000));
  if (!who) return json({ ok: false, error: 'unauthorized' }, 401);
  if (rateLimited(String(who.u), now)) return json({ ok: false, error: 'rate_limited' }, 429, { 'retry-after': '60' });
  const len = +request.headers.get('content-length') || 0; if (len > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413);
  let body; try { const raw = await request.text(); if (raw.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413); body = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!body || body.v !== 1 || typeof body.text !== 'string' || !body.text.trim() || body.text.length > MAX_TEXT) return json({ ok: false, error: 'bad_request' }, 400);
  const model = env.MODEL || DEFAULT_MODEL, user = body.text.trim() + (/qwen3/i.test(model) ? ' /no_think' : '');
  let r;
  try { r = await withTimeout(env.AI.run(model, { messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }], max_tokens: 500, temperature: 0 }), 15000); }
  catch (e) { const m = String((e && e.message) || e).toLowerCase(); if (e && e.code === 'TIMEOUT') return json({ ok: false, error: 'timeout' }, 504); if (/quota|limit|neurons|exceed|429|capacity|billing/.test(m)) return json({ ok: false, error: 'quota' }, 429); return json({ ok: false, error: 'upstream' }, 502); }
  const j = extractJson(pickText(r)); if (!j) return json({ ok: false, error: 'invalid_model_output' }, 502);
  return json({ ok: true, ...sanitize(j), model });
}
export default { fetch: (request, env) => handle(request, env) };
