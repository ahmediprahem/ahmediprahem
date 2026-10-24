'use strict';
// تأليف أوضاع التمارين: node tools/mq_author.js <معرّفات مفصولة بفاصلة | *>  → يكتب/يدمج design/training_kit/program/poses_gen.json
// كل تمرين يُعرَّف بقيود فضائية (يد على بار، قدم على الأرض...) تُحلّ بـFK المجسّم الحقيقي، ثم تُحفظ الزوايا فقط.
const fs = require('fs'), path = require('path'), { open } = require('./mq_fit');
const OUT = path.join(__dirname, '../design/training_kit/program/poses_gen.json');
const merge = (...a) => { const o = {}; a.forEach((x) => { Object.keys(x || {}).forEach((k) => { o[k] = (typeof x[k] === 'object' && !Array.isArray(x[k]) && o[k]) ? Object.assign({}, o[k], x[k]) : x[k]; }); }); return o; };
const both = (j, v) => ({ [j + 'L']: Object.assign({}, v), [j + 'R']: Object.assign({}, v) });
const legs = (hip, knee, ankle, extra) => merge(both('hip', Object.assign({ x: hip }, extra && extra.hip)), both('knee', { x: knee }), both('ankle', { x: ankle }));
const BAR = { type: 'band', from: 'handL', to: 'handR', rest: 9 };
// أذرع: hand/elbow بالنسبة لمفصل (rel) أو عالمي (p) أو من الكتف (relW)؛ x لجهة اليمين وتُعكس لليسار
const armT = (S, h, e) => { const sg = S === 'L' ? -1 : 1, T = [], f = (v) => v == null ? v : (Array.isArray(v) ? [v[0] * sg, v[1], v[2]] : v); const mk = (j, off, spec, w) => { const t = { j: j + S, off, w }; if (spec.rel) t.rel = { j: spec.rel, off: f(spec.off) }; else if (spec.relW) t.relW = { j: spec.relW + S, off: spec.off }; else t.p = f(spec.p); return t; };
  if (h) T.push(mk('wrist', [0, -.09, 0], h, h.w || 1)); if (e) T.push(mk('elbow', [0, 0, 0], e, e.w || .15)); return T; };
const ARM_V = ['shoulderL.x', 'shoulderL.y', 'shoulderL.z', 'elbowL.x', 'shoulderR.x', 'shoulderR.y', 'shoulderR.z', 'elbowR.x'];
const ARM0 = merge(both('shoulder', { x: -10, z: 45 }), both('elbow', { x: 100 }));
const INITS = [ARM0, merge(both('shoulder', { x: 160, z: 10 }), both('elbow', { x: 20 })), merge(both('shoulder', { x: 5, z: 10 }), both('elbow', { x: 20 })), merge(both('shoulder', { x: 90, z: 10 }), both('elbow', { x: 40 })), merge(both('shoulder', { x: 40, z: 30 }), both('elbow', { x: 120 }))];
async function arms(q, base, h, e, pin, extraT, init) {
  let best = null; for (const i0 of (init ? [init] : INITS)) { const r = await q.fit({ base: merge(i0, base), vars: ARM_V, pin, targets: armT('L', h, e).concat(armT('R', h, e), extraT || []), reg: .0008 }); if (!best || r.cost < best.cost) best = r; }
  return best;
}
const legAng = (rx, th, ts) => legs(th + rx, th + ts, ts);       // rx ميل الحوض، th زاوية الفخذ للأمام عن الشاقول، ts ميل الساق للأمام: قدم مسطحة
const fitArm = async (q, base, h, e, pin) => merge(base, pick((await arms(q, base, h, e, pin)).pose, ARMJ));
const pick = (pose, keys) => { const o = {}; keys.forEach((k) => { if (pose[k]) o[k] = pose[k]; }); return o; };
const ARMJ = ['shoulderL', 'shoulderR', 'elbowL', 'elbowR'];
const SUP = merge({ pelvis: { pos: [0, .56, 0], rx: -90 } }, legs(-8, 82, 0));
const SEAT = (h) => ({ type: 'chair', pos: [0, 0, 0], h: h || .38 }), SEATED = merge({ pelvis: { pos: [0, .50, 0], rx: 0 } }, legs(90, 90, 0));
const cable = (S, to) => ({ type: 'band', from: 'hand' + S, to, rest: 9 });
const mirror = (p) => { const o = {}; Object.keys(p).forEach((k) => { const n = /L$/.test(k) ? k.replace(/L$/, 'R') : /R$/.test(k) ? k.replace(/R$/, 'L') : k; o[n] = JSON.parse(JSON.stringify(p[k])); }); if (o.pelvis) { if (o.pelvis.pos) o.pelvis.pos[0] = -o.pelvis.pos[0]; if (o.pelvis.ry) o.pelvis.ry = -o.pelvis.ry; if (o.pelvis.rz) o.pelvis.rz = -o.pelvis.rz; } ['spine1', 'spine2', 'chest', 'neck', 'head'].forEach((j) => { if (o[j]) { if (o[j].y) o[j].y = -o[j].y; if (o[j].z) o[j].z = -o[j].z; } }); return o; };
const LEGJ = ['hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'toeL', 'toeR'];
const SPEC = {
  async squat(q) {
    const hand = { rel: 'chest', off: [.29, .16, -.11] }, el = { rel: 'chest', off: [.31, -.02, -.22] };
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0)), a = merge(A, pick((await arms(q, A, hand, el, 'feet')).pose, ARMJ));
    let best = null;                               // أعمق قرفصاء ممكنة بتوازن: مركز الكتلة (مع البار) فوق وسط القدم
    for (const th of [92, 90, 88, 86, 84]) for (const rx of [24, 28, 32, 36]) for (const sp of [0, 4, 8, 12]) {
      const hip = th + rx; if (hip > 124) continue; const ka = 24, k = th + ka, Bq = merge({ pelvis: { rx }, spine1: { x: sp }, spine2: { x: sp }, neck: { x: Math.max(-38, -(rx + sp * 2) + 10) }, head: { x: -8 } }, legs(hip, k, ka));
      const arm = pick((await arms(q, Bq, hand, el, 'feet')).pose, ARMJ), pose = merge(Bq, arm), c = await q.com({ pose, pin: 'feet', load: .45 });
      const err = Math.abs(c.cz - 0.07), lean = rx + 2 * sp; const score = Math.max(0, -.02 - c.cz) * 40 + lean * .01 + (92 - th) * .008; if (!best || score < best.score) best = { score, pose, c, th, rx, sp };
    }
    console.log('  squat:', JSON.stringify({ th: best.th, rx: best.rx, sp: best.sp, cz: +best.c.cz.toFixed(3) }));
    return { props: [BAR], pinFeet: true, cam: { side: {} }, hl: ['quads', 'glutes', 'adductors', 'lowerBack'], a, b: best.pose };
  },
  async bench_press(q) {
    const base = merge({ pelvis: { pos: [0, .56, 0], rx: -90 } }, legs(-8, 82, 0)), top = { p: [.23, 1.17, -.45], w: 1 }, bot = { p: [.26, .74, -.40], w: 1 }, eb = { p: [.40, .56, -.42], w: .15 };
    const a = merge(base, pick((await arms(q, base, top)).pose, ARMJ)), b = merge(base, pick((await arms(q, base, bot, eb)).pose, ARMJ));
    return { props: [{ type: 'bench', pos: [0, 0, -.3], w: .3, l: 1.25, h: .45 }, BAR], pinFeet: false, cam: { side: { target: [0, .6, -.2], dist: 4.2 } }, hl: ['chest', 'delts', 'triceps'], a, b };
  },
  async pullup(q) {
    const hand = { p: [.28, 2.2, 0], w: 1 }, lg = legs(10, 30, 0), a0 = merge({ pelvis: { pos: [0, 1.1, 0], rx: 0 }, spine1: { x: 3 } }, lg), b0 = merge({ pelvis: { pos: [0, 1.62, -.06], rx: -6 }, neck: { x: -15 }, head: { x: -5 } }, legs(10, 40, 0));
    const a = merge(a0, pick((await arms(q, a0, hand)).pose, ARMJ)), b = merge(b0, pick((await arms(q, b0, hand, { p: [.36, 1.82, -.05], w: .1 })).pose, ARMJ));
    return { props: [{ type: 'box', pos: [0, 2.18, 0], size: [1.1, .04, .04] }], pinFeet: false, cam: { side: { target: [0, 1.3, 0], dist: 3.8 }, front: { target: [0, 1.3, 0], dist: 3.8 } }, hl: ['lats', 'biceps', 'upperBack'], a, b };
  },
  async lateral_raise(q) {
    const e = both('elbow', { x: 12 }), a = merge({ shoulderL: { x: 4, z: 10 }, shoulderR: { x: 4, z: 10 } }, e), b = merge({ shoulderL: { x: 78, z: 68 }, shoulderR: { x: 78, z: 68 }, wristL: { x: 0 }, wristR: { x: 0 } }, e);
    return { props: [{ type: 'dumbbell' }], pinFeet: true, cam: { front: {} }, hl: ['delts'], a, b };
  },
  async rdl(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 6, 0)), Bq = merge({ pelvis: { rx: 62 }, neck: { x: -26 }, head: { x: -10 } }, legs(72, 22, 12));
    const a = merge(A, pick((await arms(q, A, { relW: 'shoulder', off: [.05, -.62, 0] }, null, 'feet')).pose, ARMJ)), b = merge(Bq, pick((await arms(q, Bq, { p: [.24, .42, .12], w: 1 }, null, 'feet')).pose, ARMJ));
    return { props: [BAR], pinFeet: true, cam: { side: {} }, hl: ['hamstrings', 'glutes', 'lowerBack'], a, b };
  },
  async plank(q) {
    const base = merge({ pelvis: { pos: [0, .25, 0], rx: 82 }, neck: { x: -10 } }, merge(both('knee', { x: 0 }), both('elbow', { x: 90 }), both('shoulder', { x: 80, z: 0 })));
    const r = await q.fit({ base, pin: 'hands', vars: ['pelvis.rx', 'shoulderL.x', 'shoulderR.x', 'ankleL.x', 'ankleR.x', 'toeL.x', 'toeR.x'], targets: [{ j: 'toeL', off: [0, -.019, .075], p: [null, 0.02, null], w: 6 }, { j: 'toeR', off: [0, -.019, .075], p: [null, 0.02, null], w: 6 }, { j: 'shoulderR', dir: [0, -1, 0], target: [0, -1, 0], w: 2 }, { j: 'shoulderL', dir: [0, -1, 0], target: [0, -1, 0], w: 2 }, { j: 'elbowR', dir: [0, -1, 0], target: [0, 0, 1], w: 2 }, { j: 'elbowL', dir: [0, -1, 0], target: [0, 0, 1], w: 2 }] });
    const a = r.pose, b = merge(a, { pelvis: Object.assign({}, a.pelvis, { rx: a.pelvis.rx - 2 }), spine1: { x: -2 }, neck: { x: -12 } });
    return { props: [{ type: 'mat', pos: [0, 0, .1], w: .7, l: 1.9 }], pinHands: true, cam: { side: { dist: 3.4, target: [0, .3, 0] }, front: { dist: 3.2, target: [0, .3, .2] } }, hl: ['abs', 'obliques'], a, b };
  },
  async ohp(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0)), hands = (y, z) => ({ rel: 'chest', off: [.20, y, z] });
    const a = await fitArm(q, A, hands(.19, .13), { rel: 'chest', off: [.25, -.03, .20], w: .15 }, 'feet'), b = await fitArm(q, merge(A, { spine2: { x: -3 }, neck: { x: -6 } }), hands(.80, -.01), null, 'feet');
    return { props: [BAR], pinFeet: true, cam: { side: { dist: 4.6, target: [0, 1.05, 0] }, front: { dist: 4.6, target: [0, 1.05, 0] } }, hl: ['delts', 'triceps', 'abs'], a, b };
  },
  async incline_db_press(q) {
    const base = merge({ pelvis: { pos: [0, .57, 0], rx: -22 }, neck: { x: 12 } }, legs(0, 0, 0)); const lg = await q.fit({ base, vars: ['hipL.x', 'hipR.x', 'kneeL.x', 'kneeR.x', 'ankleL.x', 'ankleR.x'], targets: [{ j: 'ankleL', p: [-.12, .09, .42], w: 3 }, { j: 'ankleR', p: [.12, .09, .42], w: 3 }], reg: 0 });
    const B = merge(base, pick(lg.pose, ['hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR']));
    const a = await fitArm(q, B, { rel: 'chest', off: [.22, .08, .60] }, null), b = await fitArm(q, B, { rel: 'chest', off: [.31, .05, .22] }, { rel: 'chest', off: [.38, -.10, .02], w: .2 });
    return { props: [{ type: 'chair', pos: [0, 0, 0], h: .45 }, { type: 'dumbbell' }], pinFeet: false, cam: { side: { target: [0, .8, .1], dist: 3.8 } }, hl: ['chest', 'delts', 'triceps'], a, b };
  },
  async pushdown(q) {
    const A = merge({ pelvis: { rx: 4 }, spine1: { x: 3 } }, legs(0, 0, 0)), anc = (x) => ({ type: 'band', from: x < 0 ? 'handL' : 'handR', to: [x, 2.3, .14], rest: 9 });
    const a = await fitArm(q, A, { relW: 'shoulder', off: [0, -.31, .34] }, { relW: 'shoulder', off: [0, -.30, .0], w: .6 }, 'feet'), b = await fitArm(q, A, { relW: 'shoulder', off: [0, -.60, .12] }, { relW: 'shoulder', off: [0, -.30, .0], w: .4 }, 'feet');
    return { props: [anc(-.13), anc(.13)], pinFeet: true, cam: { side: {} }, hl: ['triceps'], a, b };
  },
  async overhead_tri_ext(q) {
    const A = merge({ pelvis: { rx: 0 }, neck: { x: -4 } }, legs(0, 0, 0));
    const a = await fitArm(q, A, { rel: 'chest', off: [.05, .13, -.15] }, { rel: 'chest', off: [.14, .42, -.02], w: .7 }, 'feet'), b = await fitArm(q, A, { rel: 'chest', off: [.05, .78, -.02] }, null, 'feet');
    return { props: [{ type: 'dumbbell' }], pinFeet: true, cam: { side: {} }, hl: ['triceps'], a, b };
  },
  async deadlift(q) {
    const Bt = merge({ pelvis: { rx: 50 }, neck: { x: -22 }, head: { x: -6 } }, legAng(50, 60, 8)), Tp = merge({ pelvis: { rx: 0 }, spine2: { x: -2 }, neck: { x: -3 } }, legs(0, 0, 0));
    const a = await fitArm(q, Bt, { p: [.24, .23, .06], w: 1 }, null, 'feet'), b = await fitArm(q, Tp, { relW: 'shoulder', off: [.05, -.62, .02] }, null, 'feet');
    return { props: [BAR], pinFeet: true, cam: { side: {} }, hl: ['hamstrings', 'glutes', 'lowerBack', 'traps'], a, b };
  },
  async barbell_row(q) {
    const B0 = merge({ pelvis: { rx: 45 }, neck: { x: -24 }, head: { x: -8 } }, legAng(45, 28, 8));
    const a = await fitArm(q, B0, { relW: 'shoulder', off: [.06, -.62, .0] }, null, 'feet'), b = await fitArm(q, B0, { rel: 'chest', off: [.20, -.16, .16] }, { rel: 'chest', off: [.30, .04, -.12], w: .2 }, 'feet');
    return { props: [BAR], pinFeet: true, cam: { side: {} }, hl: ['lats', 'upperBack', 'biceps'], a, b };
  },
  async face_pull(q) {
    const A = merge({ pelvis: { rx: -3 }, spine1: { x: -2 } }, legs(0, 6, 0)), anc = (S, x) => ({ type: 'band', from: 'hand' + S, to: [x, 1.55, .95], rest: 9 });
    const a = await fitArm(q, A, { rel: 'chest', off: [.13, .14, .62] }, null, 'feet'), b = await fitArm(q, A, { rel: 'chest', off: [.24, .22, .08] }, { rel: 'chest', off: [.36, .14, -.02], w: .4 }, 'feet');
    return { props: [anc('L', -.1), anc('R', .1)], pinFeet: true, cam: { side: {}, front: {} }, hl: ['delts', 'upperBack', 'traps'], a, b };
  },
  async barbell_curl(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0));
    const a = await fitArm(q, A, { relW: 'shoulder', off: [.0, -.60, .06] }, null, 'feet'), b = await fitArm(q, A, { relW: 'shoulder', off: [.0, -.10, .36] }, { relW: 'shoulder', off: [0, -.30, .0], w: .8 }, 'feet');
    return { props: [BAR], pinFeet: true, cam: { side: {} }, hl: ['biceps', 'forearms'], a, b };
  },
  async hammer_curl(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0)), grip = both('shoulder', { y: 0 });
    const a = await fitArm(q, A, { relW: 'shoulder', off: [.06, -.60, .02] }, null, 'feet'), b = await fitArm(q, A, { relW: 'shoulder', off: [.06, -.12, .33] }, { relW: 'shoulder', off: [.04, -.30, .0], w: .8 }, 'feet');
    return { props: [{ type: 'dumbbell' }], pinFeet: true, cam: { front: {}, side: {} }, hl: ['biceps', 'forearms'], a, b };
  },
  async db_bench(q) {
    const top = { p: [.21, 1.17, -.45], w: 1 }, bot = { p: [.34, .68, -.42], w: 1 }, eb = { p: [.46, .52, -.43], w: .15 };
    const a = await fitArm(q, SUP, top, null), b = await fitArm(q, SUP, bot, eb);
    return { props: [{ type: 'bench', pos: [0, 0, -.3], w: .3, l: 1.25, h: .45 }, { type: 'dumbbell' }], cam: { side: { target: [0, .6, -.2], dist: 4.2 }, front: { target: [0, .8, -.3], dist: 3.8 } }, hl: ['chest', 'delts', 'triceps'], a, b };
  },
  async arnold_press(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0));
    const a = await fitArm(q, A, { rel: 'chest', off: [.14, .10, .27] }, { rel: 'chest', off: [.17, -.10, .22], w: .3 }, 'feet'), b = await fitArm(q, merge(A, { spine2: { x: -3 } }), { rel: 'chest', off: [.24, .82, -.01] }, null, 'feet');
    return { props: [{ type: 'dumbbell' }], pinFeet: true, cam: { front: { dist: 4.6, target: [0, 1.05, 0] }, side: { dist: 4.6, target: [0, 1.05, 0] } }, hl: ['delts', 'triceps'], a, b };
  },
  async cable_fly(q) {
    const A = merge({ pelvis: { rx: 4 }, spine1: { x: 3 } }, legs(0, 4, 0)), an = (S, x) => cable(S, [x, 1.85, .0]);
    const a = await fitArm(q, A, { rel: 'chest', off: [.66, .06, .08] }, null, 'feet'), b = await fitArm(q, A, { rel: 'chest', off: [.05, -.02, .46] }, null, 'feet');
    return { props: [an('L', -.95), an('R', .95)], pinFeet: true, cam: { front: { dist: 3.8 }, side: {} }, hl: ['chest'], a, b };
  },
  async pushup(q) {
    const base = merge({ pelvis: { pos: [0, .5, 0], rx: 80 }, neck: { x: -12 } }, merge(both('knee', { x: 0 }), both('shoulder', { x: 80, z: 12 }), both('elbow', { x: 0 })));
    const toes = [{ j: 'toeL', off: [0, -.019, .075], p: [null, .02, null], w: 6 }, { j: 'toeR', off: [0, -.019, .075], p: [null, .02, null], w: 6 }];
    const va = ['pelvis.rx', 'shoulderL.x', 'shoulderR.x', 'ankleL.x', 'ankleR.x', 'toeL.x', 'toeR.x'], dirD = [{ j: 'shoulderR', dir: [0, -1, 0], target: [0, -1, 0], w: 3 }, { j: 'shoulderL', dir: [0, -1, 0], target: [0, -1, 0], w: 3 }, { j: 'elbowR', dir: [0, -1, 0], target: [0, -1, 0], w: 3 }, { j: 'elbowL', dir: [0, -1, 0], target: [0, -1, 0], w: 3 }];
    const a = (await q.fit({ base, pin: 'hands', vars: va, targets: toes.concat(dirD) })).pose;
    const b0 = merge(base, { elbowL: { x: 105 }, elbowR: { x: 105 } }), b = (await q.fit({ base: b0, pin: 'hands', vars: ['pelvis.rx', 'shoulderL.x', 'shoulderR.x', 'shoulderL.z', 'shoulderR.z', 'ankleL.x', 'ankleR.x', 'toeL.x', 'toeR.x'], targets: toes.concat([{ j: 'chest', off: [0, 0, 0], p: [null, .27, null], w: 2 }]) })).pose;
    return { props: [{ type: 'mat', pos: [0, 0, 0], w: .7, l: 1.9 }], pinHands: true, cam: { side: { dist: 3.4, target: [0, .3, 0] }, front: { dist: 3.2, target: [0, .3, .2] } }, hl: ['chest', 'triceps', 'delts', 'abs'], a, b };
  },
  async rear_delt_fly(q) {
    const B0 = merge({ pelvis: { rx: 58 }, neck: { x: -22 }, head: { x: -6 } }, legAng(58, 14, 10));
    const a = await fitArm(q, B0, { relW: 'shoulder', off: [.04, -.62, .0] }, null, 'feet'), b = await fitArm(q, B0, { relW: 'shoulder', off: [.58, -.05, .0] }, null, 'feet');
    return { props: [{ type: 'dumbbell' }], pinFeet: true, cam: { front: { dist: 3.4 }, side: {} }, hl: ['delts', 'upperBack'], a, b };
  },
  async skullcrusher(q) {
    const a = await fitArm(q, SUP, { p: [.19, 1.17, -.45], w: 1 }, null), b = await fitArm(q, SUP, { p: [.07, .80, -.79], w: 1 }, { p: [.19, .90, -.46], w: .8 });
    return { props: [{ type: 'bench', pos: [0, 0, -.3], w: .3, l: 1.25, h: .45 }, BAR], cam: { side: { target: [0, .7, -.2], dist: 4.2 } }, hl: ['triceps'], a, b };
  },
  async lat_pulldown(q) {
    const A = merge(SEATED, { pelvis: { rx: -8 } }), ab = (S) => cable(S, [0, 2.7, .12]);
    const a = await fitArm(q, A, { p: [.42, 1.78, .04], w: 1 }, null), b = await fitArm(q, merge(A, { pelvis: { rx: -14 } }), { p: [.34, 1.22, .16], w: 1 }, { p: [.42, .95, -.04], w: .2 });
    return { props: [SEAT(), BAR, ab('L'), ab('R')], cam: { side: { target: [0, 1.1, 0], dist: 4 }, front: { target: [0, 1.1, 0], dist: 4 } }, hl: ['lats', 'biceps', 'upperBack'], a, b };
  },
  async seated_row(q) {
    const A = merge({ pelvis: { pos: [0, .50, 0], rx: 0 } }, legs(82, 28, -4)), ab = (S) => cable(S, [S === 'L' ? -.1 : .1, .62, 1.9]);
    const a = await fitArm(q, merge(A, { pelvis: { rx: 12 } }), { p: [.12, .86, .50], w: 1 }, null), b = await fitArm(q, merge(A, { pelvis: { rx: -6 } }), { p: [.16, .68, .12], w: 1 }, { p: [.24, .70, -.12], w: .2 });
    return { props: [SEAT(), BAR, ab('L'), ab('R')], cam: { side: { dist: 4 } }, hl: ['upperBack', 'lats', 'biceps'], a, b };
  },
  async db_row(q) {
    const B0 = merge({ pelvis: { rx: 66 }, neck: { x: -26 }, head: { x: -8 } }, legAng(66, 12, 10));
    const left = (await q.fit({ base: merge(B0, both('elbow', { x: 5 })), pin: 'feet', vars: ['shoulderL.x', 'shoulderL.y', 'shoulderL.z', 'elbowL.x'], targets: armT('L', { p: [.18, .47, .33], w: 1 }, null) })).pose;
    const mk = async (hand, el) => (await q.fit({ base: merge(B0, pick(left, ['shoulderL', 'elbowL']), ARM0), pin: 'feet', vars: ['shoulderR.x', 'shoulderR.y', 'shoulderR.z', 'elbowR.x'], targets: armT('R', hand, el) })).pose;
    const a = merge(B0, pick(left, ['shoulderL', 'elbowL']), pick(await mk({ relW: 'shoulder', off: [.0, -.62, .0] }), ['shoulderR', 'elbowR'])), b = merge(B0, pick(left, ['shoulderL', 'elbowL']), pick(await mk({ relW: 'shoulder', off: [-.02, -.30, -.10] }, { relW: 'shoulder', off: [.12, -.22, -.32], w: .3 }), ['shoulderR', 'elbowR']));
    return { props: [{ type: 'bench', pos: [-.18, 0, .33], w: .3, l: .8, h: .45 }, { type: 'dumbbell', hand: 'R' }], pinFeet: true, cam: { side: { target: [0, .7, .1] } }, hl: ['lats', 'upperBack', 'biceps'], a, b };
  },
  async shrug(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0)), a = await fitArm(q, A, { relW: 'shoulder', off: [.06, -.62, .0] }, null, 'feet'), b = merge(await fitArm(q, A, { relW: 'shoulder', off: [.06, -.58, .0] }, null, 'feet'), { neck: { x: 3 }, head: { x: 2 } });
    return { props: [{ type: 'dumbbell' }], pinFeet: true, cam: { front: {}, side: {} }, hl: ['traps'], a, b };
  },
  async incline_curl(q) {
    const A = merge({ pelvis: { pos: [0, .50, 0], rx: -30 }, neck: { x: 10 } }, legs(60, 90, 0)), rec = { chest: { x: 0 } };
    const a = await fitArm(q, A, { relW: 'shoulder', off: [.06, -.62, -.06] }, null), b = await fitArm(q, A, { relW: 'shoulder', off: [.05, -.24, .38] }, { relW: 'shoulder', off: [.03, -.28, -.08], w: .6 });
    return { props: [SEAT(), { type: 'dumbbell' }], cam: { side: { target: [0, .8, -.1], dist: 4 } }, hl: ['biceps'], a, b };
  },
  async reverse_curl(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0)), pr = both('elbow', { y: 80 });
    const a = merge(await fitArm(q, A, { relW: 'shoulder', off: [.0, -.60, .06] }, null, 'feet'), pr), b = merge(await fitArm(q, A, { relW: 'shoulder', off: [.0, -.10, .36] }, { relW: 'shoulder', off: [0, -.30, .0], w: .8 }, 'feet'), pr);
    return { props: [BAR], pinFeet: true, cam: { side: {} }, hl: ['forearms', 'biceps'], a, b };
  },
  async leg_press(q) {
    const lay = (kn, hipInit, z0) => merge({ pelvis: { pos: [0, .13, z0], rx: -90 } }, both('knee', { x: kn }), both('hip', { x: hipInit }), both('ankle', { x: 18 }));
    const fitL = async (kn, hipInit, z0, hr) => (await q.fit({ base: lay(kn, hipInit, z0), vars: ['hipL.x', 'hipR.x', 'pelvis.pos.2'], reg: 0, bounds: { 'hipL.x': hr, 'hipR.x': hr, 'pelvis.pos.2': [-.6, .6] }, targets: [{ j: 'ankleL', p: [-.12, .40, .88], w: 4 }, { j: 'ankleR', p: [.12, .40, .88], w: 4 }] })).pose;
    const a = await fitL(112, 95, -.2, [60, 118]), b = await fitL(12, 28, .1, [5, 60]);
    return { props: [{ type: 'mat', pos: [0, 0, .2], w: .7, l: 2.4 }, { type: 'box', pos: [0, .05, .98], size: [.75, .62, .05] }], cam: { side: { target: [0, .4, .3], dist: 4.2 } }, hl: ['quads', 'glutes'], a, b };
  },
  async leg_curl(q) {
    const A = merge({ pelvis: { pos: [0, .50, 0], rx: 0 }, spine1: { x: -2 } }, legs(88, 4, 0)), B = merge(A, both('knee', { x: 105 }));
    return { props: [SEAT(.38)], cam: { side: { dist: 3.6 } }, hl: ['hamstrings'], a: A, b: B };
  },
  async standing_calf(q) {
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 8), both('toe', { x: 0 })), B = merge({ pelvis: { rx: 0 } }, legs(0, 0, -42), both('toe', { x: 45 }));
    return { props: [{ type: 'box', pos: [0, 0, 0], size: [.5, .08, .3] }], pinFeet: true, cam: { side: {}, front: {} }, hl: ['calves'], a: A, b: B };
  },
  async front_squat(q) {
    const hand = { rel: 'chest', off: [.20, .20, .15] }, el = { rel: 'chest', off: [.24, .14, .30], w: .2 };
    const A = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0)), a = await fitArm(q, A, hand, el, 'feet'); let best = null;
    for (const th of [92, 90, 88]) for (const rx of [10, 16, 22, 28]) for (const sp of [0, 3, 6]) {
      const hip = th + rx; if (hip > 124) continue; const ka = 24, Bq = merge({ pelvis: { rx }, spine1: { x: sp }, spine2: { x: sp }, neck: { x: Math.max(-35, -(rx + sp * 2) + 8) }, head: { x: -6 } }, legs(hip, th + ka, ka));
      const pose = await fitArm(q, Bq, hand, el, 'feet'), c = await q.com({ pose, pin: 'feet', load: .45 }); const score = Math.max(0, -.01 - c.cz) * 40 + (rx + 2 * sp) * .01 + (92 - th) * .008; if (!best || score < best.score) best = { score, pose, c, th, rx, sp };
    }
    console.log('  front_squat:', JSON.stringify({ th: best.th, rx: best.rx, sp: best.sp, cz: +best.c.cz.toFixed(3) }));
    return { props: [BAR], pinFeet: true, cam: { side: {} }, hl: ['quads', 'glutes', 'abs'], a, b: best.pose };
  },
  async walking_lunge(q) {
    const AR = merge(both('elbow', { x: 6 })), S0 = merge({ pelvis: { rx: 0 } }, legs(0, 0, 0));
    const fl = await q.fit({ base: merge({ pelvis: { pos: [0, .55, .08], rx: 0 } }, legs(70, 90, 0), merge(both('toe', { x: 0 }))), vars: ['hipL.x', 'hipR.x', 'kneeL.x', 'kneeR.x', 'ankleL.x', 'ankleR.x', 'toeR.x', 'pelvis.pos.1', 'pelvis.pos.2'], reg: 0,
      targets: [{ j: 'ankleL', p: [-.10, .09, .62], w: 4 }, { j: 'kneeL', p: [null, null, .62], w: 1 }, { j: 'toeR', off: [0, -.019, .075], p: [.10, .02, -.42], w: 4 }, { j: 'kneeR', p: [null, .10, null], w: 2 }] });
    const lg = pick(fl.pose, LEGJ.concat(['pelvis'])), Lp = merge({ pelvis: { rx: 0 } }, lg);
    const arm = pick(await fitArm(q, Lp, { relW: 'shoulder', off: [.05, -.60, .0] }, null), ARMJ);
    const a = merge(S0, pick(await fitArm(q, S0, { relW: 'shoulder', off: [.05, -.60, .0] }, null, 'feet'), ARMJ)), b = merge(Lp, arm), c = mirror(b);
    return { props: [{ type: 'dumbbell' }], pinFeet: false, seq: ['a', 'b', 'a', 'c'], cam: { side: { target: [0, .75, .1], dist: 3.8 } }, hl: ['quads', 'glutes', 'adductors'], a: merge(a, { pelvis: { pos: [0, .95, 0] } }), b, c };
  },
  async hip_thrust(q) {
    const sh = { j: 'chest', off: [0, .12, 0], p: [0, .56, -.42], w: 3 };
    const mkp = async (y, rx) => { const base = merge({ pelvis: { pos: [0, y, 0], rx }, neck: { x: 18 } }, legs(0, 90, 0)); const r = await q.fit({ base, vars: ['pelvis.rx', 'pelvis.pos.2', 'hipL.x', 'hipR.x', 'kneeL.x', 'kneeR.x', 'ankleL.x', 'ankleR.x'], reg: 0, targets: [sh, { j: 'ankleL', p: [-.12, .09, .40], w: 3 }, { j: 'ankleR', p: [.12, .09, .40], w: 3 }] }); return r.pose; };
    const a0 = await mkp(.24, -40), b0 = await mkp(.55, -88), hd = (B) => pick(({}), []);
    const a = merge(a0, pick((await arms(q, a0, { rel: 'pelvis', off: [.27, -.0, .15] }, null)).pose, ARMJ)), b = merge(b0, pick((await arms(q, b0, { rel: 'pelvis', off: [.27, -.0, .15] }, null)).pose, ARMJ));
    return { props: [{ type: 'bench', pos: [0, 0, -.62], w: .3, l: .5, h: .45 }, BAR], cam: { side: { target: [0, .45, -.1], dist: 3.6 } }, hl: ['glutes', 'hamstrings'], a, b };
  },
  async leg_extension(q) {
    const A = merge({ pelvis: { pos: [0, .57, 0], rx: -4 } }, legs(88, 92, 0)), B = merge(A, both('knee', { x: 5 }), both('ankle', { x: 10 }));
    return { props: [SEAT(.45)], cam: { side: { dist: 3.6 } }, hl: ['quads'], a: A, b: B };
  },
  async seated_calf(q) {
    const A = merge(SEATED, both('ankle', { x: 12 }), both('toe', { x: 0 })), B = merge(SEATED, both('ankle', { x: -38 }), both('toe', { x: 40 }));
    const arm = pick((await arms(q, A, { rel: 'pelvis', off: [.24, .02, .46] }, null)).pose, ARMJ), a = merge(A, arm), b = merge(B, arm);
    return { props: [SEAT(.38), { type: 'dumbbell' }], cam: { side: { dist: 3.6 } }, hl: ['calves'], a, b };
  },
  async hanging_knee_raise(q) {
    const hand = { p: [.28, 2.2, 0], w: 1 }, A0 = merge({ pelvis: { pos: [0, 1.1, 0], rx: 0 } }, legs(6, 6, 6)), B0 = merge({ pelvis: { pos: [0, 1.1, 0], rx: -14 } }, legs(110, 118, 0));
    const a = merge(A0, pick((await arms(q, A0, hand)).pose, ARMJ)), b = merge(B0, pick((await arms(q, B0, hand)).pose, ARMJ));
    return { props: [{ type: 'box', pos: [0, 2.18, 0], size: [1.1, .04, .04] }], cam: { side: { target: [0, 1.3, 0], dist: 3.8 }, front: { target: [0, 1.3, 0], dist: 3.8 } }, hl: ['abs', 'obliques'], a, b };
  }
};
module.exports = { SPEC, merge, both, legs, BAR, armT, ARM_V, arms, pick, ARMJ };
if (require.main === module) (async () => {
  const want = process.argv[2] || '*', ids = want === '*' ? Object.keys(SPEC) : want.split(','), q = await open(), out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const id of ids) { if (!SPEC[id]) { console.log('لا مواصفة:', id); continue; } const t0 = Date.now(); out[id] = await SPEC[id](q); console.log('✔', id, ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
  fs.writeFileSync(OUT, JSON.stringify(out)); await q.close();
})();
