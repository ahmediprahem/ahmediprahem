// تدقيق منطقية التوزيع: يولّد خططاً لعملاء من فئات مختلفة ويقيس مشاكل «قابلية التنفيذ» في كل وجبة ويوم.
// التشغيل: node docs/prototypes/audit_logic.js [عدد العملاء لكل فئة=40] [ملف JSON للنتيجة]
const fs = require('fs'), path = require('path');
const E = require('../../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/data.json'), 'utf8'));
const N = +process.argv[2] || 40, OUT = process.argv[3];
const M = {}; D.foods.forEach((f) => { M[f.n] = f; });
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, pick = (a) => a[Math.floor(rnd() * a.length)];
const act = D.settings.activity.map((a) => a[0]), goals = D.settings.goals.map((g) => g[0]);
const GARNISH = /^(بصل|بصل أخضر|بقدونس|فجل|كرفس|جرجير|خس|نعناع|كزبرة|ثوم)$/;
const PROT = { meat: 1, fish: 1, egg: 1, proc: 1, cheese: 1, leg: 1, tofu: 1 }, COUNT_U = /^(حبة|حبة صغيرة|حبة متوسطة|حبة كبيرة|بياضة|بيضة)$/;
const mk = (o) => { const male = rnd() < 0.45; return Object.assign({ name: 'ع', sex: male ? 'ذكر' : 'أنثى', age: 20 + Math.floor(rnd() * 45), weight: (male ? 70 : 58) + Math.floor(rnd() * 50), height: (male ? 165 : 152) + Math.floor(rnd() * 22), activity: pick(act.slice(0, 4)), goal: pick(goals.slice(0, 5)), meals: pick([3, 4, 5, 6]), macroMode: pick(['auto_pf', 'auto_pc']), cuisine: pick(['eg', 'sa']), budget: pick([1, 2, 3]), conditions: [], allergens: [], keywords: [], love: [], avoid: [] }, o); };
const NB = { B: true, L: true, D: true, S: true };
const SEG = [
  ['الحالي: v1 مع بنك الوجبات', () => mk({})],
  ['الحالي: v1 بلا بنك', () => mk({ noBank: NB })],
  ['v2 مع بنك الوجبات', () => mk({ v2: true })],
  ['v2 بلا بنك (الاستبيان)', () => mk({ v2: true, noBank: NB })],
  ['v2 + سكري', () => mk({ v2: true, noBank: NB, conditions: ['سكري النوع الثاني'] })],
  ['v2 + ضغط وكوليسترول', () => mk({ v2: true, noBank: NB, conditions: ['ضغط الدم المرتفع', 'ارتفاع الكوليسترول والدهون'] })],
  ['v2 + نقرس ودهون كبد', () => mk({ v2: true, noBank: NB, conditions: ['النقرس', 'دهون الكبد (MASLD)'] })],
  ['v2 + حساسية سمك', () => mk({ v2: true, noBank: NB, allergens: ['حساسية السمك'] })],
  ['v2 + حساسية حليب', () => mk({ v2: true, noBank: NB, allergens: ['حساسية الحليب (بروتين الحليب)'] })],
  ['v2 + نباتي', () => mk({ v2: true, noBank: NB, allergens: ['لا آكل اللحوم (نباتي)'] })],
  ['v2 + ميزانية منخفضة', () => mk({ v2: true, noBank: NB, budget: 1 })],
  ['v2 + 3 وجبات', () => mk({ v2: true, noBank: NB, meals: 3 })],
  ['v2 + 6 وجبات', () => mk({ v2: true, noBank: NB, meals: 6 })],
  ['v2 + سعرات منخفضة (امرأة قصيرة خاملة)', () => mk({ v2: true, noBank: NB, sex: 'أنثى', weight: 55 + Math.floor(rnd() * 10), height: 150 + Math.floor(rnd() * 6), activity: act[0], goal: goals[1] })],
  ['v2 + سعرات عالية (رجل نشيط زيادة)', () => mk({ v2: true, noBank: NB, sex: 'ذكر', weight: 85 + Math.floor(rnd() * 25), height: 178 + Math.floor(rnd() * 12), activity: act[3], goal: goals[4] })],
];
const KEYS = ['mealMany', 'prot3', 'lunchSmall', 'lunchShare', 'tinyProt', 'tinyBread', 'bigCount', 'oddFrac', 'garnishOnly', 'rawVegBig', 'eggs3', 'sweetDay', 'dupDay', 'rep4', 'kcalOff', 'consec', 'costHi', 'snackDairyOnly', 'dinnerNoStarch', 'fruitBig', 'missing'];
const LABEL = { mealMany: 'وجبة مزدحمة (رئيسية >5 أصناف أو سناك >3)', prot3: '3 مصادر بروتين أو أكثر في وجبة', lunchSmall: 'بروتين الغداء الرئيسي أقل من 90 جم', lunchShare: 'الغداء يحمل أقل من 30% من بروتين اليوم', tinyProt: 'سطر لحم/دجاج/سمك أقل من 30 جم', tinyBread: 'خبز أقل من نصف رغيف', bigCount: 'عدّ أكثر من 12 حبة', oddFrac: 'كمية بكسر غريب (¼ ¾ ⅓ ⅔ مع عدد، أو ½ ملعقة)', garnishOnly: 'خضار الوجبة «تزيين» فقط (بصل/بقدونس/فجل…)', rawVegBig: 'خضار أكثر من 1.5 كوب في سطر', eggs3: 'يوم فيه أكثر من بيضتين كاملتين', sweetDay: 'يوم فيه حلويات/سكريات', dupDay: 'الصنف نفسه مرتين في اليوم', rep4: 'مصدر بروتين يتكرر 4 أيام أو أكثر في الوجبة نفسها', kcalOff: 'يوم سعراته تبعد أكثر من 7% عن الهدف', consec: 'الغداء نفس البروتين يومين متتاليين', costHi: 'صنف غالٍ مع ميزانية منخفضة', snackDairyOnly: 'سناك ألبان/أجبان فقط', dinnerNoStarch: 'فطور أو عشاء بلا نشويات', fruitBig: 'فاكهة أكثر من حصتين في جلسة', missing: 'سطر بلا صنف' };
const BASE = { mealMany: 'meals', prot3: 'meals', lunchSmall: 'days', lunchShare: 'days', tinyProt: 'lines', tinyBread: 'lines', bigCount: 'lines', oddFrac: 'lines', garnishOnly: 'meals', rawVegBig: 'lines', eggs3: 'days', sweetDay: 'days', dupDay: 'days', rep4: 'clients', kcalOff: 'days', consec: 'days', costHi: 'lines', snackDairyOnly: 'snacks', dinnerNoStarch: 'bd', fruitBig: 'meals', missing: 'lines' };
const audit = (c) => {
  const r = { meals: 0, days: 0, lines: 0, snacks: 0, bd: 0, clients: 1 }; KEYS.forEach((k) => { r[k] = 0; });
  let p, T; try { T = E.targets(c, D); p = E.planWeek(c, D); } catch (e) { r.err = String(e).slice(0, 80); return r; }
  const rep = {}; let prevL = null;
  p.days.forEach((d) => {
    r.days++; let kc = 0, eggs = 0, sweet = 0, dayProt = 0, lunchProt = 0, lunchMain = 0; const seen = {}; let dup = 0, lcls = null;
    d.slots.forEach((s) => {
      if (!s.lines.length) return; r.meals++; if (s.type === 'S') r.snacks++; else if (s.type !== 'L') r.bd++;
      const roles = {}; let vegAll = 0, vegG = 0, starch = 0, fruitE = 0, prot = 0, dairyOnly = true;
      s.lines.forEach((l) => {
        r.lines++; const f = M[l.name]; if (!f || l.missing) { r.missing++; return; } const m = E.fmeta(f), q = E.qtyNum(f.upe * l.e, f.us, f.st), mac = E.lineMacros(f, l.e);
        kc += mac[3] != null ? mac[3] : mac[0] * 4 + mac[1] * 4 + mac[2] * 9;
        if (PROT[m.r]) { roles[m.r === 'proc' ? 'meat' : m.r] = 1; } if (m.r !== 'dairy' && m.r !== 'cheese') dairyOnly = false;
        if (l.g >= 2 && l.g <= 5) { dayProt += l.e; if (s.type === 'L') { lunchProt += l.e; if ((m.r === 'meat' || m.r === 'fish') && f.us === 'جم') lunchMain = Math.max(lunchMain, q); if (!lcls && E.protClass(f)) lcls = E.protClass(f); } }
        if ((m.r === 'meat' || m.r === 'fish' || m.r === 'proc') && f.us === 'جم' && q < 30) r.tinyProt++;
        if (m.r === 'bread' && /رغيف/.test(f.us) && q < 0.5) r.tinyBread++;
        if (COUNT_U.test(f.us) && q > 12) r.bigCount++;
        const fr = q - Math.floor(q + 1e-9); if ((f.us !== 'جم' && f.us !== 'مل') && ((q > 1 && fr > 0.01 && Math.abs(fr - 0.5) > 0.02) || (/ملعقة/.test(f.us) && q < 1))) r.oddFrac++;
        if (m.r === 'veg') { vegAll++; if (GARNISH.test(f.n)) vegG++; if (f.us === 'كوب' && q > 1.5) r.rawVegBig++; }
        if (m.r === 'grain' || m.r === 'bread' || m.r === 'cereal' || m.r === 'tuber') starch++;
        if (m.r === 'fruit' || m.r === 'juice') fruitE += l.e;
        if (m.r === 'egg' && !/بياض/.test(f.n)) eggs += q; if (m.r === 'sweet') sweet++;
        if (seen[f.n]) dup++; seen[f.n] = 1; if (PROT[m.r] && s.type !== 'S') { const key = s.type + '|' + f.n; rep[key] = rep[key] || {}; rep[key][d.name] = 1; }
        if (+c.budget === 1 && m.cost === 3) r.costHi++;
      });
      const np = Object.keys(roles).length; if (np >= 3) r.prot3++;
      if (s.lines.length > (s.type === 'S' ? 3 : 5)) r.mealMany++;
      if (vegAll && vegAll === vegG) r.garnishOnly++;
      if (s.type === 'S' && dairyOnly) r.snackDairyOnly++;
      if ((s.type === 'B' || s.type === 'D') && !starch) r.dinnerNoStarch++;
      if (fruitE > 2 + 1e-9) r.fruitBig++;
    });
    if (lunchMain < 90 && (c.allergens || []).indexOf('لا آكل اللحوم (نباتي)') < 0) r.lunchSmall++; if (dayProt > 0 && lunchProt / dayProt < 0.3) r.lunchShare++;
    if (eggs > 2 + 1e-9) r.eggs3++; if (sweet) r.sweetDay++; if (dup) r.dupDay++;
    if (Math.abs(kc - T.kcal) / T.kcal > 0.07) r.kcalOff++;
    if (lcls && prevL === lcls) r.consec++; prevL = lcls;
  });
  if (Object.keys(rep).some((k) => Object.keys(rep[k]).length >= 4)) r.rep4 = 1;
  return r;
};
const res = []; const t0 = Date.now();
SEG.forEach((sg) => { const tot = { meals: 0, days: 0, lines: 0, snacks: 0, bd: 0, clients: 0, err: 0 }; KEYS.forEach((k) => { tot[k] = 0; });
  for (let i = 0; i < N; i++) { const a = audit(sg[1]()); if (a.err) { tot.err++; continue; } Object.keys(tot).forEach((k) => { if (k !== 'err') tot[k] += a[k]; }); }
  const pct = {}; KEYS.forEach((k) => { const b = tot[BASE[k]]; pct[k] = b ? +(100 * tot[k] / b).toFixed(1) : 0; }); res.push({ seg: sg[0], n: tot.clients, err: tot.err, pct });
});
console.log('الفئات ' + SEG.length + ' × ' + N + ' عميل، ' + (Date.now() - t0) + 'ms\n');
KEYS.forEach((k) => { console.log(LABEL[k] + ' [% من ' + BASE[k] + ']'); console.log('   ' + res.map((r) => r.pct[k]).join(' | ')); });
console.log('\nالفئات بالترتيب: ' + res.map((r, i) => (i + 1) + ') ' + r.seg + (r.err ? ' (أخطاء ' + r.err + ')' : '')).join('  '));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ keys: KEYS, label: LABEL, base: BASE, res }, null, 1));
