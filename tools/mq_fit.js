'use strict';
// أداة تأليف الأوضاع: تحسب زوايا المفاصل من قيود في الفضاء (يد على بار، قدم على الأرض...) بالبحث المحلي فوق دالة FK الحقيقية للمجسّم.
// الاستعمال من Node: const {open} = require('./mq_fit'); const q = await open(); const r = await q.fit({base, vars:[...], targets:[...]}); await q.close();
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const MQ = path.join(__dirname, '../design/training_kit/delivery/mannequin');
async function open(height) {
  const b = await chromium.launch(), p = await b.newPage();
  const src = fs.readFileSync(MQ + '/mannequin.js', 'utf8').replace('get rig() { return I.rig; },', 'get rig() { return I.rig; }, get _I() { return I; }, _world: (pp) => { const pose = resolve(I, pp); const W = world(I, pose); ik(I, W); return W; },');
  await p.setContent('<style>' + fs.readFileSync(MQ + '/mannequin.css', 'utf8') + '</style><div class=hx-mq-host><canvas width=300 height=300></canvas></div><script>' + src + '</script>');
  await p.evaluate((h) => {
    window.M = Mannequin.create(document.querySelector('canvas'), { height: h || 170 }); const hs = (h || 170) / 170;
    const lim = M.rig.limits, get = (o, path) => path.split('.').reduce((a, k) => a == null ? a : a[k], o), set = (o, path, v) => { const ks = path.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { a[ks[i]] = a[ks[i]] || (isNaN(+ks[i + 1]) ? {} : []); a = a[ks[i]]; } a[ks[ks.length - 1]] = v; };
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const ptOf = (W, t) => { const w = W[t.j], o = t.off || [0, 0, 0]; return [w.p[0] + w.R[0] * o[0] * hs + w.R[1] * o[1] * hs + w.R[2] * o[2] * hs, w.p[1] + w.R[3] * o[0] * hs + w.R[4] * o[1] * hs + w.R[5] * o[2] * hs, w.p[2] + w.R[6] * o[0] * hs + w.R[7] * o[1] * hs + w.R[8] * o[2] * hs]; };
    const dirOf = (W, t) => { const w = W[t.j], o = t.dir; return [w.R[0] * o[0] + w.R[1] * o[1] + w.R[2] * o[2], w.R[3] * o[0] + w.R[4] * o[1] + w.R[5] * o[2], w.R[6] * o[0] + w.R[7] * o[1] + w.R[8] * o[2]]; };
    window.__fit = (spec) => {
      M.setOptions({ pinFeet: spec.pin === 'feet' ? true : false, pinHands: spec.pin === 'hands' }); M._I.anchorH = null;
      const pose = clone(spec.base || {}), vars = spec.vars, tg = spec.targets, reg = spec.reg == null ? .0004 : spec.reg, init = {};
      const bounds = (v) => { if (spec.bounds && spec.bounds[v]) return spec.bounds[v]; const [j, a] = v.split('.'); if (j === 'pelvis') return a === 'pos' ? [-3, 3] : [-180, 180]; return lim[j][a]; };
      vars.forEach((v) => { const g = get(pose, v); init[v] = g == null ? 0 : g; set(pose, v, init[v]); });
      const cost = () => { const W = M._world(pose); let c = 0; tg.forEach((t) => { if (t.dir) { const d = dirOf(W, t), tt = t.target, n = Math.hypot(...tt) || 1; c += (t.w || 1) * (Math.pow(d[0] - tt[0] / n, 2) + Math.pow(d[1] - tt[1] / n, 2) + Math.pow(d[2] - tt[2] / n, 2)) * 0.25; } else { const q = ptOf(W, t); let p = t.p; if (t.rel) p = ptOf(W, t.rel); else if (t.relW) { const w = W[t.relW.j].p, o = t.relW.off; p = [w[0] + o[0] * hs, w[1] + o[1] * hs, w[2] + o[2] * hs]; } ['0', '1', '2'].forEach((k) => { if (p[k] != null) c += (t.w || 1) * Math.pow(q[k] - p[k], 2); }); } });
        vars.forEach((v) => { const g = get(pose, v); c += reg * Math.pow((g - init[v]) / 90, 2); }); return c; };
      let best = cost(), step = 30;
      for (let it = 0; it < 400 && step > .05; it++) {
        let imp = false;
        vars.forEach((v) => { const b = bounds(v), is = v.includes('pos') ? .5 : 1, g0 = get(pose, v); [step * is * (v.includes('pos') ? .01 : 1), -step * is * (v.includes('pos') ? .01 : 1)].forEach((d) => { const nv = Math.min(b[1], Math.max(b[0], get(pose, v) + d)); if (nv === get(pose, v)) return; const old = get(pose, v); set(pose, v, nv); const c = cost(); if (c < best - 1e-12) { best = c; imp = true; } else set(pose, v, old); }); });
        if (!imp) step *= .6;
      }
      const W = M._world(pose), out = {}; tg.forEach((t, i) => { if (t.dir) { const d = dirOf(W, t); out['t' + i] = d.map((x) => +x.toFixed(2)); } else { const q = ptOf(W, t); out['t' + i] = q.map((x) => +x.toFixed(3)); } });
      const r = (o) => { if (Array.isArray(o)) return o.map(r); if (o && typeof o === 'object') { const z = {}; Object.keys(o).forEach((k) => { z[k] = r(o[k]); }); return z; } return typeof o === 'number' ? Math.round(o * 100) / 100 : o; };
      return { pose: r(pose), cost: best, reached: out };
    };
    window.__com = (spec) => {      // مركز الكتلة التقريبي (مع حمل اختياري عند منتصف اليدين) ومدى القدم
      M.setOptions({ pinFeet: spec.pin === 'feet', pinHands: spec.pin === 'hands' }); M._I.anchorH = null; const W = M._world(spec.pose);
      const mass = { head: .08, pelvis: .15, spine2: .2, chest: .15, shoulderL: .05, shoulderR: .05, elbowL: .03, elbowR: .03, hipL: .1, hipR: .1, kneeL: .05, kneeR: .05, ankleL: .015, ankleR: .015 }; let Mt = 0, cz = 0, cy = 0;
      Object.keys(mass).forEach((k) => { Mt += mass[k]; cz += mass[k] * W[k].p[2]; cy += mass[k] * W[k].p[1]; });
      if (spec.load) { const a = ptOf(W, { j: 'wristL', off: [0, -.09, 0] }), b = ptOf(W, { j: 'wristR', off: [0, -.09, 0] }), m = spec.load; cz += m * (a[2] + b[2]) / 2; cy += m * (a[1] + b[1]) / 2; Mt += m; }
      const heel = Math.min(W.ankleL.p[2], W.ankleR.p[2]) - .05, toe = Math.max(W.toeL.p[2], W.toeR.p[2]) + .07;
      return { cz: cz / Mt, cy: cy / Mt, heel, toe, pelvis: W.pelvis.p };
    };
  }, height);
  return { com: (spec) => p.evaluate((s) => window.__com(s), spec), fit: (spec) => p.evaluate((s) => window.__fit(s), spec), close: () => b.close(), page: p };
}
module.exports = { open };
