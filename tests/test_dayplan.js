'use strict';
// توزيع الحصص على الأيام: regenDay يعيد بناء يوم واحد بأعداد صريحة دون المساس بغيره، وplanWeek يحترم client.dayCounts.
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', String(e.stack || e.message).split('\n').slice(0, 3).join('\n    ').slice(0, 600)); process.exitCode = 1; } };
const J = (x) => JSON.stringify(x), clone = (x) => JSON.parse(J(x)), mk = (i) => ({ code: 'C000' + i, name: 'س', sex: i % 2 ? 'ذكر' : 'أنثى', age: 26 + i * 3, weight: 58 + i * 6, height: 160 + i * 3, activity: D.settings.activity[2][0], goal: D.settings.goals[i % 3], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, meals: 5, conditions: [], allergens: [], keywords: [], love: [], avoid: [], favMeals: [] });
const got = (day) => { const g = new Array(13).fill(0); day.slots.forEach(s => E.actualGroups(s).forEach((v, i) => { g[i] += v; })); return g; };
(async () => {
  await t('regenDay: يوم واحد يُعاد بناؤه بأعداد صريحة (مطابقة للمطلوب)، وكل الأيام الأخرى تبقى حرفياً كما هي', () => {
    let tested = 0; for (let i = 0; i < 4; i++) for (let s = 0; s < 4; s++) {
      const c = mk(i), p = E.planWeek(c, D, { seed: s }), before = clone(p), d = (i + s) % 7, cn = p.days[d].counts.slice(); cn[0] += 1; cn[10] = Math.max(0, cn[10] - 1); const day = E.regenDay(p, d, cn, D);
      assert.deepStrictEqual(day.counts, cn); assert.deepStrictEqual(got(day).map(x => Math.round(x * 2) / 2), day.short && day.short.length ? got(day).map(x => Math.round(x * 2) / 2) : cn, 'الحصص الفعلية ≠ المطلوبة'); assert(day.custom && day.solver.manual && day.solver.day);
      p.days.forEach((dy, di) => { if (di !== d) assert.strictEqual(J(dy), J(before.days[di]), 'تغيّر يوم لم يُطلب: ' + di); }); assert.strictEqual(J(p.base), J(before.base)); tested++;
    } assert.strictEqual(tested, 16);
  });
  await t('regenDay: يحفظ أوقات الوجبات ويُحدّث حالة الأهداف والمجاميع لليوم المعدَّل فقط (نقص 3 نشويات ← كارب خارج الحد)', () => {
    const c = mk(1), p = E.planWeek(c, D, { seed: 2 }); p.days[3].slots.forEach((s, k) => { s.time = '0' + (k + 6) + ':15'; }); const times = p.days[3].slots.map(s => s.si + ':' + s.time), cn = p.days[3].counts.slice(), before = p.days[3].nominal[0]; assert(cn[0] >= 3); cn[0] -= 3;
    const day = E.regenDay(p, 3, cn, D); assert.strictEqual(day.okNominal, false); assert(day.nominal[0] < p.targets.cho - D.settings.tol[0] && day.nominal[0] < before - 30); day.slots.forEach(s => { const o = times.find(x => x.startsWith(s.si + ':')); if (o) assert.strictEqual(s.time, o.split(':').slice(1).join(':')); });
    const back = E.regenDay(p, 3, p.base.counts.slice(), D), T = p.targets, tl = D.settings.tol; assert(Math.abs(back.nominal[0] - T.cho) < Math.abs(day.nominal[0] - T.cho)); [T.cho, T.pro, T.fat].forEach((v, k) => assert(Math.abs(back.nominal[k] - v) <= 2.5 * tl[k], 'العودة للأساس ضمن ضعفي الحدود ' + k));
  });
  await t('regenDay يرفض المدخلات الخاطئة برسالة صريحة ولا يغيّر الخطة: طول خاطئ، سالب، غير مضاعف 0.5، نص، كلها أصفار، يوم غير موجود', () => {
    const p = E.planWeek(mk(0), D, { seed: 1 }), snap = J(p), ok = p.days[0].counts.slice();
    for (const bad of [ok.slice(1), ok.map((x, i) => i === 2 ? -1 : x), ok.map((x, i) => i === 2 ? 1.3 : x), ok.map((x, i) => i === 2 ? 'ab' : x), new Array(13).fill(0), null, 'x']) assert.throws(() => E.regenDay(p, 0, bad, D), /أعداد الحصص|يوم غير موجود/); assert.throws(() => E.regenDay(p, 9, ok, D), /يوم غير موجود/); assert.strictEqual(J(p), snap);
  });
  await t('عدد يتجاوز سقوف الوجبات: لا يُخفى النقص، بل يُسجَّل في day.short ويظهر للمستخدم', () => {
    const p = E.planWeek(mk(0), D, { seed: 1 }), cn = p.days[0].counts.slice(); cn[0] = 40; const day = E.regenDay(p, 0, cn, D); assert(day.short && day.short.length > 0, 'لم يُسجَّل النقص'); const placed = got(day)[0]; assert(placed < 40, 'وُضعت 40 حصة نشويات!'); assert.deepStrictEqual(day.counts, cn);
  });
  await t('planWeek يحترم client.dayCounts: يوم بتوزيع خاص وبقية الأيام بتوزيعها المعتاد، ويتقدّم على baseCounts اليدوي', () => {
    const c = mk(2), p0 = E.planWeek(c, D, { seed: 5 }), cn = p0.days[2].counts.slice(); cn[3] += 1; cn[11] = Math.max(0, cn[11] - 1);
    const c1 = clone(c); c1.dayCounts = { 2: cn }; const p1 = E.planWeek(c1, D, { seed: 5 }); assert.deepStrictEqual(p1.days[2].counts, cn); assert(p1.days[2].solver.day); [0, 1, 3, 4, 5, 6].forEach(d => assert.deepStrictEqual(p1.days[d].counts, p0.days[d].counts, 'تغيّر توزيع يوم لم يُخصَّص ' + d));
    const c2 = clone(c); c2.baseCounts = p0.base.counts.map((x, i) => i === 0 ? x + 1 : x); c2.dayCounts = { 2: cn }; const p2 = E.planWeek(c2, D, { seed: 5 }); assert.deepStrictEqual(p2.days[2].counts, cn); assert.deepStrictEqual(p2.days[0].counts, c2.baseCounts); assert(!p2.days[0].solver.day);
    const c3 = clone(c); c3.dayCounts = { 2: new Array(13).fill(0), 4: [1, 2] }; const p3 = E.planWeek(c3, D, { seed: 5 }); [2, 4].forEach(d => assert.deepStrictEqual(p3.days[d].counts, p0.days[d].counts, 'dayCounts غير صالح يجب أن يُتجاهل'));
  });
  await t('بعد regenDay تبقى أدوات التعديل تعمل على اليوم الجديد (regenSlot/alternatives) ولا ينكسر شيء في بقية الخطة', () => {
    const p = E.planWeek(mk(1), D, { seed: 4 }), cn = p.days[1].counts.slice(); cn[2] += 1; E.regenDay(p, 1, cn, D); const s = p.days[1].slots[0], n11 = E.colCounts(E.actualGroups(s)); n11[0] += 1; E.regenSlot(p, 1, 0, n11, D); assert(p.days[1].slots[0].lines.length); const ln = p.days[1].slots[1].lines[0]; assert(E.alternatives(ln, p.days[1].slots[1].type, p, D, 10).length >= 0);
    p.days.forEach(d => { assert(d.nominal.every(Number.isFinite)); assert(d.slots.every(x => x.lines.length)); });
  });
  await t('dayCaps: سقوف اليوم تتنبأ بالنقص: التجاوز يُنتج short في الغالب، وعند السقف تماماً لا نقص في الغالب', () => {
    const p = E.planWeek(mk(1), D, { seed: 2 }), d = 3, cap = E.dayCaps(p, d, D); assert.strictEqual(cap.length, 13); assert(cap.every(x => isFinite(x) && x >= 0)); let over = 0, tot = 0, at = 0, tot2 = 0;
    for (let g = 0; g < 13; g++) { const cn = p.days[d].counts.slice(); cn[g] = cap[g] + 2; const q = clone(p), day = E.regenDay(q, d, cn, D); tot++; if ((day.short || []).some(x => x[0] === g)) over++; if (cap[g] >= 1) { const c2 = p.days[d].counts.slice(); c2[g] = cap[g]; const q2 = clone(p), d2 = E.regenDay(q2, d, c2, D); tot2++; if (!(d2.short || []).some(x => x[0] === g)) at++; } }
    assert(over / tot >= 0.8, 'التجاوز: ' + over + '/' + tot); assert(at / tot2 >= 0.8, 'عند السقف: ' + at + '/' + tot2); console.log('   تنبؤ السقف: تجاوز ' + over + '/' + tot + '، عند السقف بلا نقص ' + at + '/' + tot2);
  });
  console.log('\nنجح', n, 'اختبارات توزيع الحصص على الأيام (المحرك)');
})();
