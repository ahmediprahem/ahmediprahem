// 1.80 معيار المُحلِّل (ر3) على النماذج الحقيقية — المعاينة فقط (hissati-preview، وضع bench بسرّ AI_BENCH من متغير بيئة، لا يُحفظ في المستودع)
// الاستعمال (خلف وكيل: NODE_USE_ENV_PROXY=1): BENCH_KEY=… node tests/bench_meal_parse.js [gl|zai|groq ...]   — 30 وصفاً واقعياً بإجابة متوقعة، والهدف ≥ 90%
// التقييم لكل وصف: النمط (تناوب/ثابت/حر)، وكلمات التناوب، و«كل يوم»، و«بلا»، و«لا يجتمعان» — يُعدّ صحيحاً إن طابقت كل البنود المتوقعة.
'use strict';
const URL = process.env.RELAY || 'https://hissati-preview.ah6171317.workers.dev', KEY = process.env.BENCH_KEY, PROVS = process.argv.slice(2).length ? process.argv.slice(2) : ['gl', 'zai', 'groq'];
if (!KEY) { console.log('BENCH_KEY مطلوب'); process.exit(1); }
const N = (s) => String(s || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/^(وال|ال|و|ب)(?=..)/, '').trim();
// [وصف, متوقع: p=النمط، r=كلمات التناوب، a=كل يوم، x=بلا، t=لا يجتمعان]
const C = [
  ['أريد أن تتنوع يومياً بين الجبن والبيض والزبادي والحليب واللبن مع الخبز، ولا يجتمع الحليب واللبن', { p: 'rotate', r: ['جبن', 'بيض', 'زبادي', 'حليب', 'لبن'], a: ['خبز'], t: [['حليب', 'لبن']] }],
  ['فطور ثابت كل يوم: شوفان بالحليب', { p: 'fixed', r: ['شوفان', 'حليب'] }],
  ['يتناوب على الدجاج والسمك واللحم مع الأرز', { p: 'rotate', r: ['دجاج', 'سمك', 'لحم'], a: ['ارز'] }],
  ['غداء بدون أرز، يتنوع بين الدجاج المشوي والسمك', { p: 'rotate', r: ['دجاج', 'سمك'], x: ['ارز'] }],
  ['عشاء خفيف: زبادي مع فاكهة', { p: 'fixed', r: ['زبادي', 'فاكهه'] }],
  ['سناك مكسرات أو تمر بالتبادل', { p: 'rotate', r: ['مكسرات', 'تمر'] }],
  ['فول أو فلافل أو بيض، كل يوم واحد منها، مع عيش بلدي', { p: 'rotate', r: ['فول', 'فلافل', 'بيض'], a: ['عيش'] }],
  ['لا يحب السمك. الغداء دجاج أو لحم بقري', { p: 'rotate', r: ['دجاج', 'لحم'], x: ['سمك'] }],
  ['أي شيء خفيف', { p: 'free' }],
  ['نفس الإفطار يومياً: بيضتان وخبز توست', { p: 'fixed', r: ['بيض', 'توست'] }],
  ['تنويع بين التونة والجبنة القريش والبيض، بدون خبز أبيض', { p: 'rotate', r: ['تونه', 'جبنه', 'بيض'], x: ['خبز'] }],
  ['مرة شوفان ومرة كورن فليكس، مع حليب قليل الدسم دائماً', { p: 'rotate', r: ['شوفان', 'كورن'], a: ['حليب'] }],
  ['الغداء يتنوع: معكرونة، أرز، بطاطس، ومعه دائماً سلطة', { p: 'rotate', r: ['معكرونه', 'ارز', 'بطاطس'], a: ['سلطه'] }],
  ['فاكهة فقط: تفاح أو برتقال أو موز', { p: 'rotate', r: ['تفاح', 'برتقال', 'موز'] }],
  ['زبادي يوناني كل يوم', { p: 'fixed', r: ['زبادي'] }],
  ['بروتين عالٍ، يتنوع بين صدر الدجاج والتونة', { p: 'rotate', r: ['دجاج', 'تونه'] }],
  ['لا مقليات ولا سكريات. الفطور جبن أبيض أو لبنة', { p: 'rotate', r: ['جبن', 'لبنه'], x: ['مقلي', 'سكر'] }],
  ['حمص وفول بالتناوب، لا يجتمعان', { p: 'rotate', r: ['حمص', 'فول'], t: [['حمص', 'فول']] }],
  ['شوربة عدس يومياً قبل الغداء', { p: 'fixed', r: ['عدس'] }],
  ['يتغير بين الكبدة واللحم المفروم والدجاج، مع خبز عربي', { p: 'rotate', r: ['كبده', 'لحم', 'دجاج'], a: ['خبز'] }],
  ['عشاء: سلطة تونة أو سلطة دجاج', { p: 'rotate', r: ['تونه', 'دجاج'] }],
  ['حليب ولبن لا يجتمعان، والفطور يتنوع بين الحليب واللبن والزبادي', { p: 'rotate', r: ['حليب', 'لبن', 'زبادي'], t: [['حليب', 'لبن']] }],
  ['قبل التمرين: موزة مع زبدة فول سوداني', { p: 'fixed', r: ['موز', 'فول سوداني'] }],
  ['بدون منتجات ألبان. الفطور بيض أو فول', { p: 'rotate', r: ['بيض', 'فول'], x: ['البان'] }],
  ['بطاطا حلوة كل يوم مع الغداء', { p: 'fixed', r: ['بطاطا'] }],
  ['سمك مرتين في الأسبوع والباقي دجاج', { p: 'rotate', r: ['سمك', 'دجاج'] }],
  ['يحب البيض جداً، اجعله في الفطور كل يوم مع خبز أسمر', { p: 'fixed', r: ['بيض'], a: ['خبز'] }],
  ['ما يناسب العمل خارج البيت: ساندويتش جبن أو ساندويتش تونة', { p: 'rotate', r: ['جبن', 'تونه'] }],
  ['يتنوع بين العدس والفاصوليا والحمص، مع أرز بني', { p: 'rotate', r: ['عدس', 'فاصوليا', 'حمص'], a: ['ارز'] }],
  ['خفيف وبسيط، بدون خبز', { p: 'free', x: ['خبز'] }],
];
const has = (list, w) => (list || []).map(N).some((x) => x === N(w) || x.startsWith(N(w)) || N(w).startsWith(x) || x.includes(N(w)));
function score(got, exp) {
  const m = got && got.meals && got.meals.find((x) => x.key === 'g0m0'); if (!m) return ['لا رد للوجبة'];
  const bad = [], all = (m.rotation || []).concat(m.always || []), avoid = (m.avoid || []).concat(got.avoid || []);
  if (exp.p === 'free' ? m.pattern !== 'free' && all.length : exp.p === 'rotate' ? m.pattern !== 'rotate' : !(m.pattern === 'fixed' || (m.pattern === 'rotate' && (m.rotation || []).length <= 1 && all.length))) bad.push('النمط ' + m.pattern);
  (exp.r || []).forEach((w) => { if (!has(exp.p === 'fixed' ? all : m.rotation, w)) bad.push('ينقص ' + w); });
  if (exp.p === 'rotate' && (m.rotation || []).length > (exp.r || []).length + 1) bad.push('تناوب زائد ' + m.rotation.join('/'));
  (exp.a || []).forEach((w) => { if (!has(m.always, w)) bad.push('كل يوم ينقص ' + w); });
  (exp.x || []).forEach((w) => { if (!has(avoid, w)) bad.push('بلا ينقص ' + w); });
  (exp.t || []).forEach((pr) => { if (!(m.notTogether || []).some((q) => has(q, pr[0]) && has(q, pr[1]))) bad.push('لا يجتمعان ينقص'); });
  return bad;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const out = {};
  for (const pv of PROVS) {
    let okN = 0, n = 0, ms = 0, fails = [];
    for (const [i, [desc, exp]] of C.entries()) {
      const body = { demo: 1, bench: KEY, prov: pv, nocache: 1, mode: 'meal', meals: [{ key: 'g0m0', name: 'الوجبة', kind: 'main', desc }], notes: '' };
      let j = null, t0 = Date.now();
      for (let tr = 0; tr < 3 && !j; tr++) { try { const r = await fetch(URL + '/v1/ai/food', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const x = await r.json().catch(() => ({})); if (r.ok && x.ok) j = x; else { if (tr === 2) fails.push([i + 1, 'HTTP ' + r.status + ' ' + (x.code || x.error || '')]); await sleep(r.status === 429 ? 20000 : 4000); } } catch (e) { if (tr === 2) fails.push([i + 1, 'شبكة: ' + (e.cause && e.cause.code || e.message)]); await sleep(4000); } }
      ms += Date.now() - t0; n++;
      if (!j) continue; const bad = score(j, exp); if (!bad.length) okN++; else fails.push([i + 1, desc.slice(0, 40), bad.join('، '), JSON.stringify(j.meals && j.meals[0] && { p: j.meals[0].pattern, r: j.meals[0].rotation, a: j.meals[0].always, x: (j.meals[0].avoid || []).concat(j.avoid || []), t: j.meals[0].notTogether }).slice(0, 220)]);
      await sleep(pv === 'gl' ? 6500 : 3000);
    }
    out[pv] = { ok: okN, n, pct: Math.round(okN / n * 100), avgMs: Math.round(ms / n) };
    console.log('\n==', pv, okN + '/' + n, '=', out[pv].pct + '%', 'متوسط', out[pv].avgMs, 'ms'); fails.forEach((f) => console.log('  ✘', f.join(' | ')));
  }
  console.log('\nالخلاصة', JSON.stringify(out));
})();
