// 1.80 (ر5) تجربة الوصفات والصور على النماذج الحقيقية — المعاينة فقط (hissati-preview، وضع bench بسرّ AI_BENCH من متغير بيئة)
// الاستعمال: NODE_USE_ENV_PROXY=1 BENCH_KEY=… node tests/bench_recipe.js <مجلد الإخراج>
// لكل طبق: الوصفة (Gemini) ← الصورة (FLUX، أو Pixabay حين يُطلب) ← محرك الوصفة في زنها Pro يحسب نسبة الأسطر المعروفة في القاعدة
'use strict';
const fs = require('fs'), path = require('path'), { fileUrl } = require('./_tmp.js'), { chromium } = require('playwright'), login = require('./auth_helper');
const URL = process.env.RELAY || 'https://hissati-preview.ah6171317.workers.dev', KEY = process.env.BENCH_KEY, OUT = process.argv[2] || '.';
if (!KEY) { console.log('BENCH_KEY مطلوب'); process.exit(1); }
const DISHES = [['فول بالزيت الحار', 'الإفطار', 'flux'], ['مكرونة بشاميل صحية', 'الغداء', 'flux'], ['شوفان بالموز والقرفة', 'الإفطار', 'flux'], ['سلطة تونة بالخضار', 'العشاء', 'pixabay']];
const post = async (p, b) => { const t0 = Date.now(), r = await fetch(URL + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ demo: 1, bench: KEY }, b)) }); return { s: r.status, j: await r.json().catch(() => ({})), ms: Date.now() - t0 }; };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(), p = await (await b.newContext()).newPage(); await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const rep = [];
  for (const [dish, meal, src] of DISHES) {
    const foods = await p.evaluate((d) => RCP180.foods(d), dish);
    const r = await post('/v1/ai/food', { mode: 'recipe', prov: 'gl', nocache: 1, dish, meal, foods });
    if (!r.j.ok) { rep.push({ dish, err: r.s + ' ' + (r.j.error || r.j.reason || '') }); continue; }
    const K = await p.evaluate((x) => { const k = RCP180.calc(x); return { rows: k.rows.map((y) => [y.status, y.raw, y.food || '', y.eR || 0, y.reason || '']), kcal: k.kcal }; }, r.j);
    const known = K.rows.filter((y) => y[0] === 'ok').length, all = K.rows.filter((y) => y[0] !== 'skip').length;
    const im = await post('/v1/ai/recipe-img', { prompt: r.j.img || r.j.title, src });
    let file = ''; if (im.j.ok) { file = path.join(OUT, dish.replace(/\s+/g, '_') + (im.j.src === 'flux' ? '.jpg' : '.pixabay.jpg')); fs.writeFileSync(file, Buffer.from(im.j.img, 'base64')); }
    rep.push({ dish, prov: r.j.prov, ms: r.ms, title: r.j.title, minutes: r.j.minutes, img: r.j.img, ing: r.j.ingredients, steps: r.j.steps.length, known: known + '/' + all, kcal: K.kcal, review: K.rows.filter((y) => y[0] !== 'ok' && y[0] !== 'skip').map((y) => y[1] + ' ← ' + y[4].slice(0, 60)), image: im.j.ok ? im.j.src + ' ' + Math.round(im.j.img.length * 0.75 / 1024) + 'KB ' + im.ms + 'ms' : 'بلا صورة: ' + (im.j.reason || im.j.error || im.s), credit: im.j.credit || '' });
    console.log(JSON.stringify(rep[rep.length - 1]));
    await new Promise((s) => setTimeout(s, 5000));
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rep, null, 1)); await b.close();
})().catch((e) => { console.log('✘', String(e && e.stack || e).slice(0, 1200)); process.exit(1); });
