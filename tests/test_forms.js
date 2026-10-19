// استبيانات «حصتي» (src/forms.js): الافتراضي لكل نظام، والتطبيع (استكمال الأساسي، منع إخفاء الأساسي جداً، تنظيف المخصّص)، ونصوص الإجابات.
'use strict';
const assert = require('assert'), F = require('../src/forms.js');
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 400)); process.exitCode = 1; } };
const ids = (sp) => sp.steps.map((s) => s.id + ':' + s.q.map((q) => q.id).join(',')).join(' | ');
t('الافتراضي: الحصص 5 أقسام (منها الوجبات)، والجرامات 5 أقسام (منها جدول التدريب والمكملات)', () => {
  assert.deepStrictEqual(F.defaults('ex').steps.map((s) => s.id), ['basic', 'health', 'meals', 'foods', 'habits']); assert.deepStrictEqual(F.defaults('g').steps.map((s) => s.id), ['basic', 'train', 'health', 'foods', 'habits']);
  assert(ids(F.defaults('g')).includes('train') && ids(F.defaults('g')).includes('supp') && ids(F.defaults('g')).includes('bf'));
});
t('التطبيع: يعيد الأساسي المحذوف لقسمه، ولا يقبل إخفاء الأساسي جداً، ويُبقي «بياناتك» أولاً', () => {
  const sp = F.defaults('ex'); sp.steps[0].q = sp.steps[0].q.filter((q) => q.id !== 'act'); sp.steps[0].q[0].hide = 1; sp.steps.splice(2, 1); sp.steps.reverse();
  const nn = F.normalize(sp, 'ex'); assert.strictEqual(nn.steps[0].id, 'basic'); assert(!nn.steps[0].q.find((q) => q.id === 'name').hide); assert(nn.steps[0].q.some((q) => q.id === 'act')); assert(nn.steps.some((s) => s.id === 'meals'));
});
t('المخصّص: نوع مجهول ← نص، الخيارات تُنظَّف (وخياران افتراضيان إن فرغت)، والقسم المخصّص يبقى، والأساسي المجهول يُحذف', () => {
  const sp = F.defaults('g'); sp.steps.push({ id: 's_1', custom: 1, t: 'قسم', q: [{ id: 'q_1', type: 'weird', label: 'أ' }, { id: 'q_2', type: 'one', label: 'ب', opts: [' ', 'x', ''] }, { id: 'zz', b: 1, label: 'مجهول' }, { id: 'q_3', type: 'many', label: 'ج', opts: [] }] });
  const s = F.normalize(sp, 'g').steps.find((x) => x.id === 's_1'); assert.deepStrictEqual(s.q.map((q) => q.type), ['text', 'one', 'many']); assert.deepStrictEqual(s.q[1].opts, ['x']); assert.deepStrictEqual(s.q[2].opts, ['نعم', 'لا']);
});
t('الأقسام الظاهرة تتجاهل المخفي والفارغ؛ ونصوص الإجابات', () => {
  const sp = F.defaults('ex'); sp.steps[2].hide = 1; sp.steps.push({ id: 's_e', custom: 1, t: 'فارغ', q: [] }); assert.strictEqual(F.visibleSteps(F.normalize(sp, 'ex')).length, 4);
  assert.strictEqual(F.answerText({ type: 'many' }, ['أ', 'ب']), 'أ، ب'); assert.strictEqual(F.answerText({ type: 'num', unit: 'ساعة' }, '7'), '7 ساعة'); assert.strictEqual(F.answerText({ type: 'scale' }, '4'), '4 من 5'); assert.strictEqual(F.answerText({ type: 'yn' }, 'n'), 'لا');
  assert(!F.answered({}, '') && !F.answered({}, []) && F.answered({}, 'x'));
});
console.log('\nنجح', n, 'اختبارات الاستبيانات');
