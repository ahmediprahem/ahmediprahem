'use strict';
// أداة تطوير: تعرض أوضاع المجسّم الثابتة في شبكة لقطات (أمام/جانب) لمراجعة الحركات بالعين: node tools/mq_harness.js <ملف_أوضاع.js> <معرّف_أو_*> [out.png]
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const R = path.join(__dirname, '..'), MQ = path.join(R, 'design/training_kit/delivery/mannequin');
async function sheet(items, out, opt) {   // items: [{label, pose, props, pin, cam:{yaw,pitch,dist,zoom,target}, theme}]
  opt = opt || {}; const b = await chromium.launch(), p = await b.newPage({ viewport: { width: opt.w || 1400, height: 900 }, deviceScaleFactor: 1 });
  const cw = opt.cw || 280, ch = opt.ch || 340;
  const html = '<!doctype html><meta charset=utf-8><style>' + fs.readFileSync(MQ + (process.env.MQV === '2' ? '/mannequin2.css' : '/mannequin.css'), 'utf8') + 'body{margin:0;background:#eef1f7;font:12px sans-serif}.g{display:flex;flex-wrap:wrap;gap:4px;padding:4px}.c{width:' + cw + 'px;background:#fff;border:1px solid #cdd3e3}.c canvas{width:' + cw + 'px;height:' + ch + 'px;display:block}.c b{display:block;padding:2px 6px;background:#253464;color:#fff;direction:rtl;font-size:11px}</style><div class=g id=g></div><script>' + fs.readFileSync(MQ + (process.env.MQV === '2' ? '/mannequin2.js' : '/mannequin.js'), 'utf8').replace('get rig() { return I.rig; },', 'get rig() { return I.rig; }, get _I() { return I; },') + '</script>';
  await p.setContent(html);
  const res = await p.evaluate(({ items, cw, ch }) => {
    const g = document.getElementById('g'), warns = [];
    items.forEach((it, i) => {
      const d = document.createElement('div'); d.className = 'c'; d.innerHTML = '<b>' + it.label + '</b><div class="hx-mq-host"><canvas></canvas></div>'; g.appendChild(d);
      const cv = d.querySelector('canvas'), o = { theme: it.theme || 'classic', build: it.build || 'medium', height: it.height || 170, pinFeet: it.pinFeet ? (it.pinFeet === true ? true : it.pinFeet) : false, pinHands: !!it.pinHands };
      cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      const m = Mannequin.create(cv, o); m.props([{ type: 'floor' }].concat(it.props || [])); m.setPose(it.pose); m.camera(Object.assign({ instant: true }, it.cam || { preset: 'front' }));
      if (it.hl) m.highlight(it.hl);
      m.snapshot(); const v = m.validatePose(it.pose); const W = m._I.W; if (W) { const mass = { head: .08, pelvis: .15, spine2: .2, chest: .15, shoulderL: .05, shoulderR: .05, elbowL: .03, elbowR: .03, hipL: .1, hipR: .1, kneeL: .05, kneeR: .05, ankleL: .015, ankleR: .015 }; let M = 0, cz = 0, cy = 0; Object.keys(mass).forEach((k) => { if (W[k]) { M += mass[k]; cz += mass[k] * W[k].p[2]; cy += mass[k] * W[k].p[1]; } }); const aL = W.ankleL.p, tL = W.toeL.p; warns.push(it.label + ' [COMz=' + (cz / M).toFixed(2) + ' ankleZ=' + aL[2].toFixed(2) + ' toeZ=' + tL[2].toFixed(2) + ' pelvisY=' + W.pelvis.p[1].toFixed(2) + ']'); } if (v.length) warns.push(it.label + ': ' + v.map((x) => x.type + ' ' + x.msg).join(' | '));
    });
    return warns;
  }, { items, cw, ch });
  await p.screenshot({ path: out, fullPage: true }); await b.close(); return res;
}
module.exports = { sheet };
if (require.main === module) {
  (async () => {
    const poses = require(path.resolve(process.argv[2])), id = process.argv[3] || '*', out = process.argv[4] || '/tmp/mq.png', list = id === '*' ? Object.keys(poses.EX) : id.split(',');
    const items = []; list.forEach((k) => { const e = poses.EX[k]; const EQ = process.env.EQ ? require(path.join(R, 'design/training_kit/program/equip.json')) : {}; ['a', 'b', 'c'].forEach((s) => { if (!e[s]) return; (process.env.MQVIEWS ? process.env.MQVIEWS.split(',') : ['front', 'side']).forEach((v) => items.push({ label: k + ' ' + s + ' ' + v, pose: e[s], props: EQ[k] || e.props, pinFeet: e.pinHands ? false : !!e.pinFeet, pinHands: e.pinHands, build: process.env.MQB || 'medium', theme: process.env.MQT || 'classic', cam: Object.assign({ preset: v }, e.cam && e.cam[v]) , hl: e.hl })); }); });
    const w = await sheet(items, out, { cw: 230, ch: 300, w: 1400 }); console.log('warnings:', w.length ? '\n' + w.join('\n') : 'none');
  })();
}
