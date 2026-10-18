'use strict';
// تغيير مجموعتين معاً في وجبة واحدة (مثلاً بيض ← جبن: إنقاص عمود وزيادة آخر): الأصناف في بقية الأعمدة لا تتغير حرفياً.
const assert = require('assert'), fs = require('fs'), path = require('path'), E = require('../src/engine.js'), D = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data.json'), 'utf8'));
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 700)); process.exitCode = 1; } };
const base = (i) => ({ name: 'س', sex: i % 2 ? 'ذكر' : 'أنثى', age: 22 + i * 4, weight: 55 + i * 7, height: 160 + i * 2, activity: D.settings.activity[2][0], goal: D.settings.goals[i % 3], macroMode: 'auto_pf', proGkg: 1.8, fatPct: 0.3, meals: i % 2 ? 4 : 5, conditions: [], allergens: [], keywords: [], love: [], avoid: [], favMeals: [] });
const snap = (lines, cols) => lines.filter(l => !cols.some(ci => E.COLUMNS[ci][2].indexOf(l.g) >= 0)).map(l => [l.name, l.e, l.text, l.label || '', !!l.manual, l.g]);
t('تغيير عمودين معاً (−1 في أحدهما و+1 في الآخر) لا يغيّر أصناف بقية الأعمدة: كل أزواج الأعمدة على كل الوجبات', () => {
  let trials = 0, bad = [];
  for (let seed = 0; seed < 6; seed++) { const p = E.planWeek(base(seed), D, { seed }); for (let d = 0; d < 7; d++) for (let k = 0; k < p.days[d].slots.length; k++) { const cur = E.colCounts(E.actualGroups(p.days[d].slots[k]));
    for (let a = 0; a < 11; a++) { if (cur[a] < 1) continue; for (let b = 0; b < 11; b++) { if (a === b) continue; const q = JSON.parse(JSON.stringify(p)), n11 = cur.slice(); n11[a] -= 1; n11[b] += 1; const before = snap(q.days[d].slots[k].lines, [a, b]); let ns; try { ns = E.regenSlot(q, d, k, n11, D); } catch (e) { bad.push('خطأ ' + e.message + ' seed' + seed + ' d' + d + ' k' + k + ' ' + a + '→' + b); continue; } const after = snap(ns.lines, [a, b]); trials++; if (JSON.stringify(before) !== JSON.stringify(after)) bad.push('seed' + seed + ' يوم' + d + ' وجبة' + k + ' ' + E.COLUMNS[a][1] + ' −1 / ' + E.COLUMNS[b][1] + ' +1: قبل=' + before.map(x => x[0]) + ' بعد=' + after.map(x => x[0])); } } } }
  console.log('   محاولات:', trials, '| حالات تغيّر فيها صنف آخر:', bad.length); assert(trials > 3000, 'قليلة ' + trials); assert.strictEqual(bad.length, 0, bad.slice(0, 6).join('\n    '));
});
t('تسلسل تعديلات متتالية على الوجبة نفسها بقيم متنوعة (كما في الواجهة: خلية واحدة كل مرة من الأصناف الفعلية): بقية الأعمدة لا تتغير في أي خطوة', () => {
  let s = 12345; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; let steps = 0; const bad = [];
  for (let seed = 0; seed < 6; seed++) { const p = E.planWeek(base(seed), D, { seed }); for (let d = 0; d < 7; d++) for (let k = 0; k < p.days[d].slots.length; k++) for (let rep = 0; rep < 4; rep++) {
    const hist = []; for (let st = 0; st < 6; st++) { const cur = E.colCounts(E.actualGroups(p.days[d].slots[k])), ci = Math.floor(rnd() * 11), val = Math.floor(rnd() * 9) / 2, n11 = cur.slice(); n11[ci] = val; const before = snap(p.days[d].slots[k].lines, [ci]); hist.push(E.COLUMNS[ci][1] + '=' + val); let ns; try { ns = E.regenSlot(p, d, k, n11, D); } catch (e) { bad.push('خطأ ' + e.message + ' [' + hist.join(' ← ') + ']'); break; } const after = snap(ns.lines, [ci]); steps++; if (JSON.stringify(before) !== JSON.stringify(after)) { bad.push('seed' + seed + ' يوم' + d + ' وجبة' + k + ' [' + hist.join(' ← ') + '] قبل=' + before.map(x => x[0]) + ' بعد=' + after.map(x => x[0])); break; } } } }
  console.log('   خطوات تعديل:', steps, '| حالات تغيّر فيها صنف آخر:', bad.length); assert(steps > 3000); assert.strictEqual(bad.length, 0, bad.slice(0, 5).join('\n    '));
});
console.log('\nنجح', n, 'اختبارات تغيير مجموعتين معاً');
