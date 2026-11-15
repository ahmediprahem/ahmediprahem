// تجربة 50 عميلاً متنوعاً بالمحرك الجديد (v2) عبر واجهة «زنها Pro» الحقيقية، ثم إرسال كل خطة إلى تطبيق «زنها» (iPhone محاكى) عبر محطة محلية
// التشغيل: node docs/prototypes/trial50.js [ملف JSON للنتائج]
// لا يمس أي خادم حقيقي: المحطة والموقع محليان (tests/hx_link_helper.js)
const path = require('path'), fs = require('fs');
const linked = require(path.resolve(__dirname, '../../tests/hx_link_helper.js'));
const OUT = process.argv[2] || '';
let seed = 20261115; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, pick = (a) => a[Math.floor(rnd() * a.length)];
const CONDS = [[], [], [], ['سكري النوع الثاني'], ['مقاومة الإنسولين / ما قبل السكري'], ['ضغط الدم المرتفع'], ['ارتفاع الكوليسترول والدهون'], ['أمراض القلب'], ['سكري النوع الثاني', 'ضغط الدم المرتفع'], ['ضغط الدم المرتفع', 'ارتفاع الكوليسترول والدهون'], ['النقرس'], ['دهون الكبد (MASLD)'], ['النقرس', 'دهون الكبد (MASLD)'], ['أمراض الكلى', 'ضغط الدم المرتفع'], ['خمول الغدة'], ['سكري النوع الثاني', 'ارتفاع الكوليسترول والدهون', 'ضغط الدم المرتفع']];
const ALG = [[], [], [], [], ['حساسية السمك'], ['حساسية الحليب (بروتين الحليب)'], ['عدم تحمل اللاكتوز'], ['حساسية البيض'], ['حساسية المكسرات'], ['حساسية القمح / الجلوتين (سيلياك)'], ['لا آكل اللحوم (نباتي)'], ['حساسية السمك', 'حساسية الحليب (بروتين الحليب)']];
const profiles = [];
for (let i = 0; i < 50; i++) {
  const male = rnd() < 0.45, cz = pick(['eg', 'eg', 'sa', 'sa', '']);
  profiles.push({ i, sex: male ? 'ذكر' : 'أنثى', age: 18 + Math.floor(rnd() * 52), weight: (male ? 68 : 52) + Math.floor(rnd() * 70), height: (male ? 162 : 148) + Math.floor(rnd() * 28),
    act: Math.floor(rnd() * 4), goal: pick([0, 0, 1, 1, 2, 3]), meals: pick([3, 4, 4, 5, 5, 6]), cuisine: cz, budget: pick([1, 2, 2, 3]), conditions: pick(CONDS), allergens: pick(ALG),
    freq: pick([null, null, { poultry: 3, red: 2, fish: 2 }, { poultry: 4, red: 1, fish: 2 }, { poultry: 2, red: 3, fish: 2 }, { poultry: 5, red: 2, fish: 0 }]), bank: rnd() < 0.3, fishDairy: rnd() < 0.85 });
}
(async () => {
  const errs = [], t0 = Date.now(); const L = await linked('trial50', errs); const { d, m, cPoll } = L; const rows = [];
  for (const P of profiles.slice(0, +process.env.N || 50)) {
    const r = { i: P.i, profile: P, ok: true, notes: [] };
    try {
      // ---------- زنها Pro: ملف العميل نفسه، تفعيل v2، توليد من الواجهة
      const pro = await d.evaluate((P) => {
        const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur) || DPApp.S.clients[0]; DPApp.S.cur = c.code; const D = DATA;
        Object.assign(c, { sex: P.sex, age: P.age, weight: P.weight, height: P.height, activity: D.settings.activity[P.act][0], goal: D.settings.goals[P.goal][0], meals: P.meals, cuisine: P.cuisine, budget: P.budget, conditions: P.conditions.slice(), allergens: P.allergens.slice(), v2: true, freq: P.freq, cult: { fishDairy: P.fishDairy }, noBank: P.bank ? {} : { B: true, L: true, D: true, S: true }, kcalManual: '', diet: null, planSrc: '' });
        DPApp.A.gen(); DPApp.A.tab('file');
        const box = document.querySelector('#mtailor'), tr = document.querySelector('#trial'), rep = DPEngine.planReport(c.plan, D);
        const v1 = DPEngine.planReport(DPEngine.planWeek(Object.assign(JSON.parse(JSON.stringify(c)), { v2: false, keywords: [] }), D), D);
        const cx = DPEngine.ctx(c, D); let banned = 0, missing = 0, lines = 0, fish = 0, eggOver = 0, sweetDays = 0, fruitOver = 0, kcalOff = 0, leg = 0; const T = c.plan.targets.kcal;
        c.plan.days.forEach((dy) => { let eg = 0, sw = 0; dy.slots.forEach((s) => { let fr = 0; s.lines.forEach((l) => { lines++; if (l.missing) missing++; if (cx.tierOf(l.name) === 3 || cx.isExcluded(l.name)) banned++; const f = D.foods.find((x) => x.n === l.name); if (!f) return; const k = DPEngine.protClass(f); if (k === 'fish' || k === 'shell') fish++; if (DPEngine.EGGS.includes(l.name)) eg += DPEngine.qtyNum(f.upe * l.e, f.us, DPEngine.fmeta(f).st); if (l.g === 12) sw = 1; if (l.g === 10) fr += l.e; }); if (cx.diab && fr > 1 + 1e-9) fruitOver++; if (s.type === 'L' && s.lines.some((l) => l.g === 1) && !s.lines.some((l) => l.g >= 2 && l.g <= 5)) leg++; }); const lim = cx.rules.reduce((a, rr) => rr.max_per_day && DPEngine.EGGS.includes(rr.kw) ? Math.min(a, rr.max_per_day) : a, DPEngine.EGG_DAY); if (eg > lim + 1e-9) eggOver++; sweetDays += sw; if (Math.abs(DPEngine.dayKcal(dy, D) - T) / T > 0.07) kcalOff++; });
        return { kcal: Math.round(T), box: !!box, trial: !!tr, score: rep.score, v1score: v1.score, items: rep.items.map((x) => x.msg), n: rep.n, v1n: v1.n, banned, missing, lines, fish, eggOver, sweetDays, fruitOver, kcalOff, leg, fit: c.plan.fit, sched: (DPEngine.weekSchedule(c, D) || []).join(' ') };
      }, P);
      Object.assign(r, { pro });
      if (!pro.box || !pro.trial) { r.ok = false; r.notes.push('بطاقة التفصيل أو أدوات التجربة لم تظهر'); }
      if (pro.banned) { r.ok = false; r.notes.push(pro.banned + ' سطر ممنوع'); } if (pro.missing) { r.ok = false; r.notes.push(pro.missing + ' سطر بلا صنف'); }
      if (P.allergens.includes('حساسية السمك') && pro.fish) { r.ok = false; r.notes.push('سمك رغم الحساسية'); }
      if (pro.eggOver) { r.ok = false; r.notes.push('بيض فوق الحد'); } if (pro.fruitOver) { r.ok = false; r.notes.push('فاكهة السكري فوق حصة'); }
      // ---------- إرسال إلى «زنها» وعرضها في تطبيق العميل
      const v0 = await d.evaluate(() => (DPApp.S.clients.find((x) => x.code === DPApp.S.cur).hx || {}).planV || 0);
      await d.evaluate(() => DPApp.A.tab('hx')); await d.click('main [data-a="hxSendPlan"]');
      await d.waitForFunction((v) => (DPApp.S.clients.find((x) => x.code === DPApp.S.cur).hx || {}).planV > v, v0, { timeout: 20000 });
      await cPoll(); await m.waitForFunction(() => { const S = window.HissatiApp.state(); return S.plan && S.plan.length; }, null, { timeout: 15000 });
      const sent = await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); return c.plan.days.map((dy) => dy.slots.map((s) => s.lines.map((l) => l.text))); });
      await m.click('[data-act="tab"][data-v="plan"]').catch(() => { }); await m.waitForTimeout(250);
      const app = await m.evaluate(() => { const S = window.HissatiApp.state(); const days = S.plan.map((dy) => (dy.slots || []).map((s) => (s.lines || []).map((l) => Array.isArray(l) ? l[2] : (l.text || '')))); const txt = document.body.innerText; const alts = []; S.plan.forEach((dy) => (dy.slots || []).forEach((s) => (s.lines || []).forEach((l) => { if (Array.isArray(l) && Array.isArray(l[3])) l[3].forEach((a) => alts.push(a[0])); }))); return { alts: Array.from(new Set(alts)), days, ver: S.planV || null, und: /undefined|NaN|\[object/.test(txt), plate: !!document.querySelector('.plc'), meals: document.querySelectorAll('.card.meal, .pmrow').length }; });
      const flatS = JSON.stringify(sent), flatA = JSON.stringify(app.days);
      const badAlt = await d.evaluate((names) => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur), cx = DPEngine.ctx(c, DATA); return names.filter((n) => cx.tierOf(n) === 3 || cx.isExcluded(n)); }, app.alts);
      if (badAlt.length) { r.ok = false; r.notes.push('بدائل ممنوعة في التطبيق: ' + badAlt.slice(0, 4).join('، ')); }
      r.app = { alts: app.alts.length, badAlt: badAlt.length, same: flatS === flatA, plate: app.plate, und: app.und, meals: app.meals, days: app.days.length };
      if (!r.app.same) { r.ok = false; r.notes.push('ما وصل التطبيق يختلف عما أُرسل'); } if (app.und) { r.ok = false; r.notes.push('نص غير صالح في التطبيق'); } if (!app.plate) r.notes.push('لا طبق في «خطتي» (قد يكون خارج وقت الوجبات)');
    } catch (e) { r.ok = false; r.notes.push('خطأ: ' + String(e).slice(0, 160)); }
    rows.push(r); process.stdout.write((r.ok ? '✔' : '✘') + ' ' + P.i + ' ' + (r.pro ? r.pro.score + '/' + r.pro.v1score : '') + ' ' + r.notes.join('؛ ') + '\n');
  }
  await L.close();
  const sum = { n: rows.length, ok: rows.filter((r) => r.ok).length, errs: errs.slice(0, 20), sec: Math.round((Date.now() - t0) / 1000) };
  console.log('\nنجح ' + sum.ok + ' من ' + sum.n + ' | أخطاء الصفحات ' + errs.length + ' | ' + sum.sec + ' ث');
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ sum, rows }, null, 1));
})().catch((e) => { console.error('✘', String(e && e.stack || e).slice(0, 1500)); process.exit(1); });
