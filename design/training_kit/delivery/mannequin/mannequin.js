/*! Mannequin 1.0 (hx-mq): Canvas-2D, no deps. Axes (left-handed): +X character's right, +Y up, +Z forward; metres; ground y=0; degrees. See RIG.md. */
((G) => {
var PI = Math.PI, D = PI / 180, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt, abs = Math.abs, MIN = Math.min, MAX = Math.max;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function mm(a, b) { var o = [], i, j; for (i = 0; i < 9; i += 3) for (j = 0; j < 3; j++) o.push(a[i] * b[j] + a[i+1] * b[3+j] + a[i+2] * b[6+j]); return o; }
function mv(m, v) { return [m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2]]; }
function RX(a) { var c = cos(a), s = sin(a); return [1,0,0, 0,c,-s, 0,s,c]; }
function RY(a) { var c = cos(a), s = sin(a); return [c,0,s, 0,1,0, -s,0,c]; }
function RZ(a) { var c = cos(a), s = sin(a); return [c,-s,0, s,c,0, 0,0,1]; }
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function mul(a, k) { return [a[0]*k, a[1]*k, a[2]*k]; }
function dot(a, b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function crs(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function nrm(a) { var l = sqrt(dot(a, a)) || 1; return [a[0]/l, a[1]/l, a[2]/l]; }
function tf(w, v) { return add(w.p, mv(w.R, v)); }
var JN = ['pelvis','spine1','spine2','chest','neck','head',
 'shoulderL','elbowL','wristL','shoulderR','elbowR','wristR',
 'hipL','kneeL','ankleL','toeL','hipR','kneeR','ankleR','toeR'];
var PAR = { spine1: 'pelvis', spine2: 'spine1', chest: 'spine2', neck: 'chest', head: 'neck' };
['L', 'R'].forEach((s) => {
 PAR['shoulder'+s] = 'chest'; PAR['elbow'+s] = 'shoulder'+s; PAR['wrist'+s] = 'elbow'+s;
 PAR['hip'+s] = 'pelvis'; PAR['knee'+s] = 'hip'+s; PAR['ankle'+s] = 'knee'+s; PAR['toe'+s] = 'ankle'+s;
});
var BONES = { spine1: .10, spine2: .12, chest: .12, neck: .14, head: .07, headLen: .20, clav: .17, shY: .11,
 upperArm: .30, foreArm: .26, hand: .17, hipX: .095, hipDrop: .04, thigh: .42, shin: .41,
 ankleH: .08, toeDrop: .05, footLen: .13, toe: .07 };
var BUILD = { slim: { sh: .92, hp: .94, m: .88 }, medium: { sh: 1, hp: 1, m: 1 }, strong: { sh: 1.1, hp: 1.06, m: 1.14 } };
var LIM = {
 spine1: { x: [-20,35], y: [-15,15], z: [-15,15] }, spine2: { x: [-15,30], y: [-20,20], z: [-15,15] },
 chest: { x: [-15,25], y: [-20,20], z: [-15,15] }, neck: { x: [-40,50], y: [-60,60], z: [-35,35] },
 head: { x: [-25,30], y: [-40,40], z: [-20,20] }, shoulder: { x: [-60,185], y: [-90,90], z: [-45,180] },
 elbow: { x: [0,150], y: [-90,90], z: [0,0] }, wrist: { x: [-70,80], y: [-80,80], z: [-30,35] },
 hip: { x: [-30,125], y: [-45,45], z: [-30,50] }, knee: { x: [0,145], y: [0,0], z: [0,0] },
 ankle: { x: [-50,25], y: [-20,20], z: [-25,25] }, toe: { x: [-30,60], y: [0,0], z: [0,0] }
};
function side(j) { var c = j.slice(-1); return c === 'L' ? -1 : c === 'R' ? 1 : 0; }
function base(j) { return /[LR]$/.test(j) ? j.slice(0, -1) : j; }
function pelvisH(b) { return b.ankleH + b.shin + b.thigh + b.hipDrop; }
function scaledBones(cm) { var k = cm / 170, o = {}; for (var i in BONES) o[i] = BONES[i] * k; return o; }
function limitsFull() { var o = {}; JN.forEach((j) => { if (j !== 'pelvis') o[j] = LIM[base(j)]; }); return o; }
var RIG = { joints: JN, parent: PAR, bones: BONES, build: BUILD, limits: limitsFull(), scaled: scaledBones };
function offsets(b, bd) {
 var o = { spine1: [0,b.spine1,0], spine2: [0,b.spine2,0], chest: [0,b.chest,0], neck: [0,b.neck,0], head: [0,b.head,0] };
 [-1, 1].forEach((sd) => {
  var S = sd < 0 ? 'L' : 'R';
  o['shoulder'+S] = [sd*b.clav*bd.sh, b.shY, 0]; o['elbow'+S] = [0, -b.upperArm, 0]; o['wrist'+S] = [0, -b.foreArm, 0];
  o['hip'+S] = [sd*b.hipX*bd.hp, -b.hipDrop, 0]; o['knee'+S] = [0, -b.thigh, 0]; o['ankle'+S] = [0, -b.shin, 0];
  o['toe'+S] = [0, -b.toeDrop, b.footLen];
 });
 return o;
}
function localRot(j, v, sd) {
 var x = (v.x || 0) * D, y = (v.y || 0) * D, z = (v.z || 0) * D, k = base(j);
 switch (k) {
  case 'spine1': case 'spine2': case 'chest': case 'neck': case 'head':
   return mm(RY(y), mm(RX(x), RZ(-z))); // x flex(+fwd) · y twist(+right) · z lateral bend(+right)
  case 'shoulder': case 'hip':
   return mm(RX(-x), mm(RZ(sd * z), RY(sd * y))); // x flex(+fwd) · z abduction(+away) · y external rotation(+)
  case 'elbow': return mm(RX(-x), RY(sd * y)); // x flexion(+)
  case 'wrist': return mm(RX(-x), mm(RZ(sd * z), RY(sd * y)));
  case 'knee': return RX(x); // flexion(+): shin goes backward
  case 'ankle': return mm(RX(-x), mm(RZ(-sd * z), RY(sd * y))); // x dorsiflexion(+)
  default: return RX(-x); // toe: extension(+)
 }
}
function neutral(h) {
 var p = { pelvis: { pos: [0, pelvisH(scaledBones(h || 170)), 0], rx: 0, ry: 0, rz: 0 } };
 JN.slice(1).forEach((j) => { p[j] = { x: 0, y: 0, z: 0 }; });
 p.shoulderL.z = p.shoulderR.z = 8;
 return p;
}
function warn(I, msg) {
 if (I.warnings.length < 60) I.warnings.push(msg);
 if (G.Mannequin.debug) console.warn('[Mannequin] ' + msg);
}
function cl(I, name, v, lo, hi) {
 v = +v; if (v !== v) { warn(I, name + ': قيمة غير رقمية'); return 0; }
 if (v < lo || v > hi) { warn(I, name + '=' + v + ' خارج الحد [' + lo + ',' + hi + ']'); return clamp(v, lo, hi); }
 return v;
}
function resolve(I, part) {
 var N = neutral(I.height), pp = part || {}, pv = pp.pelvis || {}, o = { pelvis: { pos: N.pelvis.pos.slice() } }, k, i, j, v;
 for (k in pp) if (!N[k]) warn(I, 'مفصل غير معروف: ' + k);
 if (pv.pos) o.pelvis.pos = [+pv.pos[0] || 0, +pv.pos[1] || 0, +pv.pos[2] || 0];
 ['rx', 'ry', 'rz'].forEach((a) => { o.pelvis[a] = pv[a] != null ? cl(I, 'pelvis.' + a, pv[a], -180, 180) : 0; });
 for (i = 1; i < JN.length; i++) {
  j = JN[i]; v = pp[j] || {}; o[j] = {};
  ['x', 'y', 'z'].forEach((a) => {
   o[j][a] = cl(I, j + '.' + a, v[a] != null ? v[a] : N[j][a], I.limits[j][a][0], I.limits[j][a][1]);
  });
 }
 return o;
}
function lerpPose(a, b, f, out) {
 var j, i, k;
 for (i = 0; i < 3; i++) out.pelvis.pos[i] = a.pelvis.pos[i] + (b.pelvis.pos[i] - a.pelvis.pos[i]) * f;
 ['rx', 'ry', 'rz'].forEach((q) => { out.pelvis[q] = a.pelvis[q] + (b.pelvis[q] - a.pelvis[q]) * f; });
 for (i = 1; i < JN.length; i++) { j = JN[i]; for (k in { x: 1, y: 1, z: 1 }) out[j][k] = a[j][k] + (b[j][k] - a[j][k]) * f; }
 return out;
}
function clonePose(p) {
 var o = { pelvis: { pos: p.pelvis.pos.slice(), rx: p.pelvis.rx, ry: p.pelvis.ry, rz: p.pelvis.rz } };
 for (var i = 1; i < JN.length; i++) o[JN[i]] = { x: p[JN[i]].x, y: p[JN[i]].y, z: p[JN[i]].z };
 return o;
}
var EASE = {
 linear: (f) => f,
 inOut: (f) => f * f * (3 - 2 * f),
 spring: (f) => 1 - Math.exp(-6 * f) * cos(8 * f)
};
function world(I, pose) {
 var W = {}, P = pose.pelvis, i, j, par, R, o, sd;
 W.pelvis = { R: mm(RY(P.ry * D), mm(RX(P.rx * D), RZ(-P.rz * D))), p: P.pos.slice() };
 for (i = 1; i < JN.length; i++) {
  j = JN[i]; par = W[PAR[j]]; sd = side(j);
  R = mm(par.R, localRot(j, pose[j], sd)); o = mv(par.R, I.off[j]);
  W[j] = { R: R, p: [par.p[0] + o[0], par.p[1] + o[1], par.p[2] + o[2]] };
 }
 return W;
}
var SPEC = [
 ['pelvis','pelvis',[0,-.03,0],[0,.10,0],[.165,.105],[.14,.095],'p'],
 ['spine1','spine1',[0,0,0],[0,.12,0],[.13,.092],[.112,.082],'p'],
 ['spine2','spine2',[0,0,0],[0,.12,0],[.112,.082],[.14,.092],'c'],
 ['chest','chest',[0,0,0],[0,.14,0],[.15,.1],[.172,.098],'c'],
 ['neck','neck',[0,-.01,0],[0,.075,0],[.042,.042],[.038,.04],'l'],
 ['head','head',[0,.07,0],[0,.125,.006],[.062,.072],[.07,.084],'l'],
 ['clav*','chest',[0,.12,0],'S',[.045,.045],[.042,.042],'c'],
 ['arm*','shoulder*',[0,0,0],[0,-.30,0],[.05,.048],[.037,.037],'l'],
 ['fore*','elbow*',[0,0,0],[0,-.26,0],[.04,.04],[.03,.03],'l'],
 ['hand*','wrist*',[0,0,0],[0,-.17,0],[.032,.014],[.036,.011],'l'],
 ['thigh*','hip*',[0,0,0],[0,-.42,0],[.086,.09],[.052,.058],'h'],
 ['shin*','knee*',[0,0,0],[0,-.41,0],[.052,.062],[.03,.036],'l'],
 ['foot*','ankle*',[0,-.035,-.03],[0,-.05,.13],[.036,.04],[.044,.028],'l'],
 ['toe*','toe*',[0,0,0],[0,-.005,.07],[.044,.027],[.03,.019],'l'],
 ['bSh*','shoulder*',.056], ['bEl*','elbow*',.043], ['bWr*','wrist*',.031], ['bKn*','knee*',.062]
];
var MUS = ['neck|neck|0|180|0|1', 'traps*|clav*|180|180|0|1', 'traps*|chest|155|45|.45|1', 'delts*|arm*|0|180|0|.4', 'chest|chest|0|58|.12|.88',
 'lats*|chest|140|42|0|.8', 'lats*|spine2|140|42|.3|1', 'upperBack|chest|180|45|.3|.95', 'lowerBack|spine1|180|50|.05|1', 'lowerBack|spine2|180|45|0|.5',
 'biceps*|arm*|0|50|.25|.8', 'triceps*|arm*|180|60|.2|.85', 'forearms*|fore*|0|180|.08|.92', 'abs|spine1|0|38|0|1', 'abs|spine2|0|38|0|1',
 'obliques*|spine1|75|32|0|1', 'obliques*|spine2|75|32|0|1', 'glutes|pelvis|180|75|0|.85', 'quads*|thigh*|0|58|.1|.92',
 'hamstrings*|thigh*|180|60|.1|.92', 'adductors*|thigh*|270|36|.15|.88', 'calves*|shin*|180|55|.08|.7'];
var LBL = { neck: 'الرقبة', traps: 'شبه المنحرف', delts: 'الكتف', chest: 'الصدر', lats: 'الظهرية العريضة', upperBack: 'أعلى الظهر',
 lowerBack: 'أسفل الظهر', biceps: 'العضد الأمامي', triceps: 'العضد الخلفي', forearms: 'الساعد', abs: 'البطن',
 obliques: 'الخاصرة', glutes: 'الأرداف', quads: 'الفخذ الأمامي', hamstrings: 'الفخذ الخلفي', adductors: 'الفخذ الداخلي', calves: 'السمانة' };
var MUSNAMES = {};
MUS.forEach((s) => { var n = s.split('|')[0]; if (n.slice(-1) === '*') { MUSNAMES[n.slice(0, -1) + 'L'] = 1; MUSNAMES[n.slice(0, -1) + 'R'] = 1; } else MUSNAMES[n] = 1; });
function expandMus(list) {
 var o = [];
 (list || []).forEach((n) => { if (MUSNAMES[n]) o.push(n); else if (MUSNAMES[n + 'L']) o.push(n + 'L', n + 'R'); });
 return o;
}
function labelOf(n) { var s = /[LR]$/.test(n) && LBL[n.slice(0, -1)]; return s ? s + (n.slice(-1) === 'L' ? ' — يسار' : ' — يمين') : (LBL[n] || n); }
function buildParts(I) {
 var hs = I.hs, bd = I.bd, out = [], byId = {};
 SPEC.forEach((sp) => {
  (sp[0].slice(-1) === '*' || /\*/.test(sp[0]) ? ['L', 'R'] : ['']).forEach((S) => {
   var id = sp[0].replace('*', S), j = sp[1].replace('*', S), pt = { id: id, j: j, mus: [], bias: 0 };
   if (sp.length === 3) { pt.r = sp[2] * hs * bd.m; pt.a = [0, 0, 0]; pt.bias = -.04 * hs; }
   else {
    var k = sp[6], xs = k === 'c' ? bd.sh : k === 'l' ? 1 : bd.hp;
    pt.a = mul(sp[2], hs); pt.b = sp[3] === 'S' ? I.off['shoulder' + S] : mul(sp[3], hs);
    pt.ra = [sp[4][0] * hs * bd.m * xs, sp[4][1] * hs * bd.m]; pt.rb = [sp[5][0] * hs * bd.m * xs, sp[5][1] * hs * bd.m];
    var e = nrm(sub(pt.b, pt.a)), ep = e[1] < 0 ? mul(e, -1) : e;
    pt.u = [1, 0, 0]; pt.v = nrm(crs(pt.u, ep)); pt.bias = id === 'neck' || sp[0] === 'clav*' ? .08 * hs : 0;
   }
   out.push(pt); byId[id] = pt;
  });
 });
 MUS.forEach((s) => {
  var q = s.split('|'), star = q[0].slice(-1) === '*';
  (star ? ['L', 'R'] : ['']).forEach((S) => {
   var pid = q[1].replace('*', S), pt = byId[pid]; if (!pt) return;
   var ang = +q[2]; if (S === 'L') ang = 360 - ang;
   pt.mus.push({ name: star ? q[0].slice(0, -1) + S : q[0], ang: ang, half: +q[3], t0: +q[4], t1: +q[5], g: 1.035 });
  });
 });
 return out;
}
var SC = null;
function parseC(s) {
 if (!SC) SC = document.createElement('canvas').getContext('2d');
 SC.fillStyle = '#000'; SC.fillStyle = s || '#888'; var v = SC.fillStyle;
 if (v[0] === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16), 1];
 var m = v.match(/[\d.]+/g); return [+m[0], +m[1], +m[2], m[3] != null ? +m[3] : 1];
}
function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? c[3] : a * c[3]) + ')'; }
function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 1]; }
var CVARS = ['body', 'hi', 'lo', 'rim', 'joint', 'glow', 'floor', 'prop', 'propHi', 'propLo', 'shadow', 'bg'];
function readColors(I) {
 var cs = G.getComputedStyle(I.cv), c = {};
 CVARS.forEach((k) => { c[k] = parseC(cs.getPropertyValue('--hx-mq-' + k.replace(/[A-Z]/g, (m) => { return '-' + m.toLowerCase(); })).trim()); });
 I.col = c;
}
function camOf(I) {
 var cm = I.cam, yaw = cm.yaw * D, pit = cm.pitch * D, tg = cm.target, cp = cos(pit);
 var pos = [tg[0] + cm.dist * sin(yaw) * cp, tg[1] + cm.dist * sin(pit), tg[2] + cm.dist * cos(yaw) * cp];
 var f = nrm(sub(tg, pos)), r = nrm(crs([0, 1, 0], f)), u = crs(f, r);
 return { pos: pos, f: f, r: r, u: u, S: (I.h / 2) / Math.tan(17 * D) * (cm.zoom || 1), cx: I.w / 2, cy: I.h * .5 };
}
function P(c, p) {
 var x = p[0] - c.pos[0], y = p[1] - c.pos[1], z = p[2] - c.pos[2], d = x*c.f[0] + y*c.f[1] + z*c.f[2];
 if (d < .05) d = .05; var k = c.S / d;
 return [c.cx + (x*c.r[0] + y*c.r[1] + z*c.r[2]) * k, c.cy - (x*c.u[0] + y*c.u[1] + z*c.u[2]) * k, d, k];
}
function cr(o, a, b) { return (a[0]-o[0]) * (b[1]-o[1]) - (a[1]-o[1]) * (b[0]-o[0]); }
function hull(Pt) {
 Pt.sort((a, b) => { return a[0] - b[0] || a[1] - b[1]; });
 var L = [], U = [], i, p;
 for (i = 0; i < Pt.length; i++) { p = Pt[i]; while (L.length > 1 && cr(L[L.length-2], L[L.length-1], p) <= 0) L.pop(); L.push(p); }
 for (i = Pt.length - 1; i >= 0; i--) { p = Pt[i]; while (U.length > 1 && cr(U[U.length-2], U[U.length-1], p) <= 0) U.pop(); U.push(p); }
 L.pop(); U.pop(); return L.concat(U);
}
function path(ctx, H) { ctx.beginPath(); ctx.moveTo(H[0][0], H[0][1]); for (var i = 1; i < H.length; i++) ctx.lineTo(H[i][0], H[i][1]); ctx.closePath(); }
var CIR = []; (() => { for (var k = 0; k < 10; k++) CIR.push([sin(k * PI / 5), cos(k * PI / 5)]); })();
function ring(c, pt, A, B, U, V, E, t, sc, ofs, T, out) {
 var ru = (pt.ra[0] + (pt.rb[0] - pt.ra[0]) * t) * sc, rv = (pt.ra[1] + (pt.rb[1] - pt.ra[1]) * t) * sc,
  cx = A[0] + (B[0]-A[0]) * t + E[0] * ofs, cy = A[1] + (B[1]-A[1]) * t + E[1] * ofs, cz = A[2] + (B[2]-A[2]) * t + E[2] * ofs;
 for (var k = 0; k < T.length; k++) {
  var s = T[k][0] * ru, q = T[k][1] * rv;
  out.push(P(c, [cx + U[0]*s + V[0]*q, cy + U[1]*s + V[1]*q, cz + U[2]*s + V[2]*q]));
 }
}
function shade(ctx, H, a2, b2, pal) {
 var mx = 0, my = 0, i, dx = b2[0] - a2[0], dy = b2[1] - a2[1], l = sqrt(dx*dx + dy*dy);
 if (l < 2) { dx = 0; dy = 1; l = 1; }
 var nx = -dy / l, ny = dx / l, s = (nx * -.6 + ny * -.8) >= 0 ? 1 : -1, w = 0;
 for (i = 0; i < H.length; i++) { mx += H[i][0]; my += H[i][1]; } mx /= H.length; my /= H.length;
 for (i = 0; i < H.length; i++) w = MAX(w, abs((H[i][0] - mx) * nx + (H[i][1] - my) * ny));
 var g = ctx.createLinearGradient(mx + s*nx*w, my + s*ny*w, mx - s*nx*w, my - s*ny*w);
 g.addColorStop(0, rgba(pal.hi)); g.addColorStop(.42, rgba(pal.body)); g.addColorStop(.86, rgba(pal.lo)); g.addColorStop(1, rgba(pal.rim));
 ctx.fillStyle = g; ctx.fill();
}
function ballDraw(ctx, x, y, r, pal) {
 var g = ctx.createRadialGradient(x - r*.35, y - r*.4, r*.1, x, y, r);
 g.addColorStop(0, rgba(pal.hi)); g.addColorStop(.6, rgba(pal.body)); g.addColorStop(.92, rgba(pal.lo)); g.addColorStop(1, rgba(pal.rim));
 ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * PI); ctx.fillStyle = g; ctx.fill();
}
function contacts(I, W, grp) {
 var s = I.hs, o = [];
 ['L', 'R'].forEach((S) => {
  if (grp === 'f') {
   var a = W['ankle' + S], t = W['toe' + S];
   o.push(tf(a, mul([0, -.075, -.045], s)), tf(t, mul([0, -.027, 0], s)), tf(t, mul([0, -.019, .075], s)));
  } else {
   var w = W['wrist' + S];
   o.push(add(tf(w, mul([0, -.05, 0], s)), [0, -.014 * s, 0]), add(tf(w, mul([0, -.17, 0], s)), [0, -.014 * s, 0]));
  }
 });
 return o;
}
function meanXZ(W, a, b) { return [(W[a].p[0] + W[b].p[0]) / 2, (W[a].p[2] + W[b].p[2]) / 2]; }
function ik(I, W) {
 var pf = I.pinFeet, ph = I.pinHands; if (!pf && !ph) return;
 var pts = [], dy = 1e9, an, cu, j, p;
 if (pf) pts = pts.concat(contacts(I, W, 'f')); if (ph) pts = pts.concat(contacts(I, W, 'h'));
 pts.forEach((q) => { dy = MIN(dy, q[1]); });
 if (pf) { an = (pf.at || [0, 0]); cu = meanXZ(W, 'ankleL', 'ankleR'); }
 else { cu = meanXZ(W, 'wristL', 'wristR'); if (!I.anchorH) I.anchorH = cu; an = I.anchorH; }
 var sh = [an[0] - cu[0], -dy, an[1] - cu[1]];
 for (j in W) { p = W[j].p; p[0] += sh[0]; p[1] += sh[1]; p[2] += sh[2]; }
 I.shift = sh;
}
function segd(p1, q1, p2, q2) {
 var d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2), a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r), c = dot(d1, r), b = dot(d1, d2),
  den = a*e - b*b, s = den > 1e-9 ? clamp((b*f - c*e) / den, 0, 1) : 0, t = (b*s + f) / e;
 if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
 var d = sub(add(p1, mul(d1, s)), add(p2, mul(d2, t))); return sqrt(dot(d, d));
}
function validate(I, partial) {
 var keep = I.warnings; I.warnings = []; var pose = resolve(I, partial), out = [], hs = I.hs;
 I.warnings.forEach((m) => { out.push({ type: 'limit', msg: m }); }); I.warnings = keep;
 var W = world(I, pose); ik(I, W);
 var chk = contacts(I, W, 'f').concat(contacts(I, W, 'h'), ['kneeL', 'kneeR'].map((n) => { return add(W[n].p, [0, -.06 * hs, 0]); }),
  ['elbowL', 'elbowR'].map((n) => { return add(W[n].p, [0, -.045 * hs, 0]); }), [add(W.pelvis.p, [0, -.1 * hs, 0]), tf(W.head, [0, .2 * hs, 0])]);
 chk.forEach((q) => { if (q[1] < -.01) out.push({ type: 'ground', msg: 'اختراق الأرض ' + (-q[1] * 100).toFixed(1) + ' سم' }); });
 var tip = (S) => { return tf(W['wrist' + S], mul([0, -.17, 0], hs)); }, sg = {};
 ['L', 'R'].forEach((S) => {
  sg['arm' + S] = [W['shoulder' + S].p, W['elbow' + S].p, .05]; sg['fore' + S] = [W['elbow' + S].p, tip(S), .04];
  sg['thigh' + S] = [W['hip' + S].p, W['knee' + S].p, .07]; sg['shin' + S] = [W['knee' + S].p, W['ankle' + S].p, .05];
 });
 sg.torso = [W.pelvis.p, W.neck.p, .12];
 var pr = 'foreL-torso foreR-torso foreL-thighL foreL-thighR foreR-thighL foreR-thighR foreL-shinL foreL-shinR foreR-shinL foreR-shinR armL-thighL armR-thighR shinL-shinR shinL-thighR shinR-thighL'.split(' ').map((s) => { return s.split('-'); });
 pr.forEach((q) => {
  var A = sg[q[0]], B = sg[q[1]], d = segd(A[0], A[1], B[0], B[1]);
  if (d < (A[2] + B[2]) * .8 * hs) out.push({ type: 'collision', msg: q[0] + ' ⟷ ' + q[1] + ' (المسافة ' + (d * 100).toFixed(1) + ' سم)' });
 });
 return out;
}
function propPal(I) { return { hi: I.col.propHi, body: I.col.prop, lo: I.col.propLo, rim: I.col.propHi }; }
function boxItems(I, c, Lw, items, cen, sz, ry, d0, pal) {
 var Rm = RY((ry || 0) * D), AX = [[1,0,0],[0,1,0],[0,0,1]], hh = [sz[0]/2, sz[1]/2, sz[2]/2], ctx = I.ctx;
 for (var a = 0; a < 3; a++) for (var sg = -1; sg <= 1; sg += 2) ((a, sg) => {
  var b1 = (a + 1) % 3, b2 = (a + 2) % 3, fc = add(cen, mv(Rm, mul(AX[a], sg * hh[a]))), nw = mv(Rm, mul(AX[a], sg));
  if (dot(nw, sub(c.pos, fc)) <= 0) return;
  var q = [[1,1],[1,-1],[-1,-1],[-1,1]].map((s) => {
   return P(c, add(cen, mv(Rm, add(mul(AX[a], sg * hh[a]), add(mul(AX[b1], s[0] * hh[b1]), mul(AX[b2], s[1] * hh[b2]))))));
  });
  var col = mixc(pal.lo, pal.hi, .25 + .75 * clamp(dot(nw, Lw), 0, 1));
  items.push({ d: P(c, fc)[2] + d0, f: () => {
   path(ctx, q); ctx.fillStyle = rgba(col); ctx.fill(); ctx.strokeStyle = rgba(pal.lo, .8); ctx.stroke();
  } });
 })(a, sg);
}
function capItem(I, c, items, A, B, rA, rB, pal, d0) {
 var a = P(c, A), b = P(c, B), pts = [], k, ra = rA * a[3], rb = rB * b[3], ctx = I.ctx;
 for (k = 0; k < 10; k++) pts.push([a[0] + CIR[k][0] * ra, a[1] + CIR[k][1] * ra], [b[0] + CIR[k][0] * rb, b[1] + CIR[k][1] * rb]);
 var H = hull(pts);
 items.push({ d: (a[2] + b[2]) / 2 + (d0 || 0), f: () => { path(ctx, H); shade(ctx, H, a, b, pal); } });
}
function jointPos(I, W, n) { // 'handL'/'handR', joint names or raw [x,y,z]
 if (Array.isArray(n)) return n;
 var m = /^hand([LR])$/.exec(n); if (m) return tf(W['wrist' + m[1]], mul([0, -.09, 0], I.hs));
 return W[n] ? W[n].p : [0, 0, 0];
}
function addProps(I, c, Lw, items, W) {
 var ctx = I.ctx, pal = propPal(I);
 I.props.forEach((p) => {
  var pos = p.pos || [0, 0, 0], ry = p.ry || 0, Ry = RY(ry * D), at = (o) => { return add(pos, mv(Ry, o)); };
  switch (p.type) {
   case 'floor': {
    var R = p.r || .75, pts = [], k, o = P(c, [0, 0, 0]);
    for (k = 0; k < 40; k++) pts.push(P(c, [R * cos(k * PI / 20), 0, R * sin(k * PI / 20)]));
    var rx = 1, ry = 1; pts.forEach((q) => { rx = MAX(rx, abs(q[0] - o[0])); ry = MAX(ry, abs(q[1] - o[1])); });
    items.push({ d: 1e9 + 2, f: () => {
     var k = rx / ry, g;
     ctx.save(); ctx.translate(o[0], o[1]); ctx.scale(1, 1 / k); g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
     g.addColorStop(0, rgba(I.col.floor, .85)); g.addColorStop(.6, rgba(I.col.floor, .35)); g.addColorStop(1, rgba(I.col.floor, 0));
     ctx.beginPath(); ctx.arc(0, 0, rx, 0, 2 * PI); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    } }); break; }
   case 'mat': boxItems(I, c, Lw, items, [pos[0], pos[1] + .01, pos[2]], [p.w || .7, .02, p.l || 1.8], ry, 1e9 + 1, { hi: mixc(I.col.propHi, I.col.floor, .3), body: I.col.prop, lo: I.col.propLo, rim: I.col.propHi }); break;
   case 'bench': case 'chair': {
    var ch = p.type === 'chair', h = p.h || .45, w = ch ? .42 : p.w || .3, l = ch ? .42 : p.l || 1.2, lg = ch ? .18 : 0;
    boxItems(I, c, Lw, items, at([0, h - .03, 0]), [w, .06, l], ry, 0, pal);
    if (ch) boxItems(I, c, Lw, items, at([0, h + .22, -.19]), [.42, .42, .04], ry, 0, pal);
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach((s) => { boxItems(I, c, Lw, items, at([s[0] * (lg || w / 2 - .03), (h - .06) / 2, s[1] * (lg || l / 2 - .05)]), [.05, h - .06, .05], ry, 0, pal); }); break; }
   case 'box': { var sz = p.size || [.4, .4, .4]; boxItems(I, c, Lw, items, [pos[0], pos[1] + sz[1] / 2, pos[2]], sz, ry, 0, pal); break; }
   case 'wall': {
    var z = p.pos ? pos[2] : -.7, q = [[-1.4, 0], [1.4, 0], [1.4, 2.5], [-1.4, 2.5]].map((v) => { return P(c, [v[0], v[1], z]); });
    items.push({ d: 1e9 + 3, f: () => { path(ctx, q); ctx.fillStyle = rgba(pal.body, .28); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(pal.lo, .6); ctx.stroke(); } }); break; }
   case 'dumbbell': {
    var sides = p.hand === 'L' ? ['L'] : p.hand === 'R' ? ['R'] : ['L', 'R'], len = p.len || .2;
    sides.forEach((S) => {
     var w = W['wrist' + S], G0 = tf(w, mul([0, -.09, 0], I.hs)), ax = mv(w.R, [0, 0, 1]), e1 = add(G0, mul(ax, len / 2)), e0 = sub(G0, mul(ax, len / 2));
     capItem(I, c, items, e0, e1, .013, .013, pal, -.02);
     [e0, e1].forEach((e, i) => { capItem(I, c, items, e, add(e, mul(ax, (i ? .035 : -.035))), .045, .045, pal, -.03); });
    }); break; }
   case 'band': {
    var a = jointPos(I, W, p.from || 'handL'), b = jointPos(I, W, p.to || 'handR'), L = sqrt(dot(sub(a, b), sub(a, b))), rest = p.rest || .5,
     st = clamp((L - rest) / rest, 0, 1), col = mixc(pal.body, I.col.glow, st);
    capItem(I, c, items, a, b, .014 * (1 - .4 * st), .014 * (1 - .4 * st), { hi: mixc(col, [255,255,255,1], .3), body: col, lo: mixc(col, [0,0,0,1], .4), rim: mixc(col, [255,255,255,1], .5) }, -.04); break; }
  }
 });
}
var CAP = [[.87, .5], [.66, .8], [.32, .97]];
function render(I, time) {
 var ctx = I.ctx, w = I.w, h = I.h, hs = I.hs, col = I.col, hl = I.hl, dbg = G.Mannequin.debug || I.dbg;
 ctx.setTransform(I.dpr, 0, 0, I.dpr, 0, 0); ctx.clearRect(0, 0, w, h);
 if (col.bg[3] > 0) { ctx.fillStyle = rgba(col.bg); ctx.fillRect(0, 0, w, h); }
 var W = world(I, I.cur); ik(I, W); I.W = W;
 var c = camOf(I), Lw = nrm(add(add(mul(c.r, -.45), mul(c.u, .7)), mul(c.f, -.55))), items = [], hits = [], shp = new Path2D(), pal = { hi: col.hi, body: col.body, lo: col.lo, rim: col.rim },
  jpal = { hi: mixc(col.joint, col.hi, .5), body: col.joint, lo: mixc(col.joint, col.lo, .6), rim: col.rim }, pulse = I.rm ? .6 : .5 + .5 * sin(time * 7.5);
 I.hits = hits;
 I.parts.forEach((pt) => {
  var wj = W[pt.j], R = wj.R, A = tf(wj, pt.a), q;
  if (pt.r) { q = P(c, A); var rr = pt.r * q[3]; items.push({ d: q[2] + pt.bias, f: () => { ballDraw(ctx, q[0], q[1], rr, jpal); } }); return; }
  var B = tf(wj, pt.b), U = mv(R, pt.u), V = mv(R, pt.v), E = nrm(sub(B, A)), pts = [], rA = (pt.ra[0] + pt.ra[1]) / 2, rB = (pt.rb[0] + pt.rb[1]) / 2;
  var rg = (t, sc, ofs, T, out) => { ring(c, pt, A, B, U, V, E, t, sc, ofs, T, out); };
  rg(0, 1, 0, CIR, pts); rg(1, 1, 0, CIR, pts);
  CAP.forEach((q) => { rg(0, q[0], -q[1] * rA, CIR, pts); rg(1, q[0], q[1] * rB, CIR, pts); });
  var H = hull(pts), a2 = P(c, A), b2 = P(c, B), d = (a2[2] + b2[2]) / 2 + pt.bias;
  var ga = [A[0] - Lw[0] * .5 * A[1], 0, A[2] - Lw[2] * .5 * A[1]], gb = [B[0] - Lw[0] * .5 * B[1], 0, B[2] - Lw[2] * .5 * B[1]], gp = [], pa = P(c, ga), pb = P(c, gb);
  for (var k = 0; k < 8; k++) { var s = sin(k * PI / 4) * (rA + rB) * .5, t = cos(k * PI / 4) * (rA + rB) * .5;
   gp.push(P(c, [ga[0] + s, 0, ga[2] + t]), P(c, [gb[0] + s, 0, gb[2] + t])); }
  var GH = hull(gp); shp.moveTo(GH[0][0], GH[0][1]); for (k = 1; k < GH.length; k++) shp.lineTo(GH[k][0], GH[k][1]); shp.closePath();
  items.push({ d: d, f: () => { path(ctx, H); shade(ctx, H, a2, b2, pal); } });
  if (pt.mus.some((m) => hl[m.name])) items.push({ d: d - .08 * hs, f: () => {
   pt.mus.forEach((m) => {
    var hv = hl[m.name]; if (!hv) return;
    var n = add(mul(U, sin(m.ang * D)), mul(V, cos(m.ang * D))), fc = m.half >= 170 ? 1 : dot(n, nrm(sub(c.pos, mul(add(A, B), .5))));
    if (fc < -.05) return;
    var T = [], st = m.half > 100 ? 10 : 6, o = [], kk;
    for (kk = 0; kk < st; kk++) { var an = (m.ang - m.half + 2 * m.half * kk / (st - 1)) * D; T.push([sin(an), cos(an)]); }
    rg(m.t0, m.g * .9, 0, T, o); rg((m.t0 + m.t1) / 2, m.g * 1.06, 0, T, o); rg(m.t1, m.g * .9, 0, T, o);
    var Hm = hull(o), al = clamp((fc + .05) / .55, 0, 1) * (hv.pulse ? .3 + .35 * pulse : .55);
    path(ctx, Hm); ctx.fillStyle = rgba(col.glow, al); ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(col.glow, MIN(1, al * 1.6)); ctx.stroke();
    if (al > .12) hits.push({ name: m.name, poly: Hm });
   });
  } });
 });
 var sc = col.shadow, kpx = c.S / I.cam.dist;
 items.push({ d: 1e9 + 1.5, f: () => {
  ctx.fillStyle = rgba(sc, .16); ctx.fill(shp); ctx.lineJoin = 'round'; ctx.lineWidth = .05 * kpx; ctx.strokeStyle = rgba(sc, .07); ctx.stroke(shp);
 } });
 addProps(I, c, Lw, items, W);
 items.sort((a, b) => { return b.d - a.d; });
 for (var i = 0; i < items.length; i++) items[i].f();
 I.nItems = items.length;
 if (dbg) debugDraw(I, c, W);
}
function debugDraw(I, c, W) {
 var ctx = I.ctx, j, i, q, p, v, hit;
 ctx.lineWidth = 1.5; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.strokeStyle = '#19d3ff';
 for (i = 1; i < JN.length; i++) { j = JN[i]; q = P(c, W[PAR[j]].p); p = P(c, W[j].p); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
 for (i = 0; i < JN.length; i++) {
  j = JN[i]; p = P(c, W[j].p); hit = false; v = I.cur[j];
  if (i) 'xyz'.split('').forEach((a) => { var l = I.limits[j][a]; if (l[1] > l[0] && (v[a] <= l[0] + .5 || v[a] >= l[1] - .5)) hit = true; });
  ctx.fillStyle = hit ? '#ff3b3b' : '#ffd400'; ctx.beginPath(); ctx.arc(p[0], p[1], hit ? 4.5 : 3.2, 0, 2 * PI); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(j, p[0] + 6, p[1] - 4);
 }
 ctx.fillStyle = '#ff3b3b'; ctx.fillText('warnings ' + I.warnings.length + ' | draws ' + I.nItems, 8, 14);
}
var PRE = { front: [0, 8], side: [90, 8], back: [180, 8], 'three-quarter': [35, 10] };
var STATE_TXT = { loading: 'جارٍ التحميل…', error: 'تعذّر عرض المجسّم', paused: 'متوقف', playing: 'يعمل' };
function inPoly(p, x, y) {
 var ins = false, i, j;
 for (i = 0, j = p.length - 1; i < p.length; j = i++)
  if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) ins = !ins;
 return ins;
}
function create(cv, o) {
 o = o || {};
 var host = cv.parentNode, ctx = cv.getContext && cv.getContext('2d'), mq = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)');
 var I = { cv: cv, ctx: ctx, height: +o.height || 170, buildName: BUILD[o.build] ? o.build : 'medium', limits: JSON.parse(JSON.stringify(RIG.limits)),
  warnings: [], props: [{ type: 'floor' }], hl: {}, hits: [], ev: {}, speed: 1, t: 0, reps: 0, playing: false, anim: null, alive: true, vis: true, state: 'loading',
  pinFeet: o.pinFeet ? (o.pinFeet === true ? {} : o.pinFeet) : null, pinHands: !!o.pinHands, dbg: false, raf: 0, last: 0, fc: 0, w: 1, h: 1, dpr: 1,
  cam: { yaw: 0, pitch: 8, dist: 3.2, target: [0, .9, 0], tyaw: 0, tpitch: 8, tdist: 3.2, zoom: 1, orbit: o.orbit !== false },
  rm: !!(mq && mq.matches), partial: {}, rig: {}, hasPulse: false }, dom = [], cleanup = [], m = {}, tools = null, tipEl, statusEl, stepsEl, ppBtn, slowBtn;
 function rebuild() {
  I.hs = I.height / 170; I.bones = scaledBones(I.height); I.bd = BUILD[I.buildName]; I.off = offsets(I.bones, I.bd); I.parts = buildParts(I);
  I.cam.target = [0, .9 * I.hs, 0]; I.rig.bones = I.bones; I.rig.limits = I.limits; I.rig.height = I.height; I.rig.build = I.buildName;
 }
 function emit(e, a, b) { (I.ev[e] || []).slice().forEach((f) => { f(a, b); }); }
 function setState(s) {
  if (I.state === s) return; I.state = s; if (host) host.setAttribute('data-state', s); if (statusEl) statusEl.textContent = STATE_TXT[s]; syncUI(); emit('state', s);
 }
 function req() { if (!I.raf && I.alive && I.vis && ctx && !(G.document && document.hidden)) I.raf = requestAnimationFrame(tick); }
 function setCur() {
  if (!I.anim) { I.cur = I.pose; return; }
  var K = I.anim.keys, i = 0, a, b, f;
  while (i < K.length - 2 && I.t >= K[i + 1].t) i++;
  a = K[i]; b = K[i + 1] || a; f = b.t > a.t ? clamp((I.t - a.t) / (b.t - a.t), 0, 1) : 1;
  f = (EASE[a.ease || I.anim.ease] || EASE.inOut)(f); I.cur = lerpPose(a.pose, b.pose, f, I.scratch);
 }
 function tick(ts) {
  I.raf = 0; if (!I.alive) return;
  var dt = I.last ? MIN((ts - I.last) / 1000, .1) : 0, moving = false, cm = I.cam, T;
  I.last = ts;
  if (I.playing && I.anim) {
   I.t += dt * I.speed; T = I.anim.T; moving = true;
   if (T > 0 && I.t >= T) {
    if (I.anim.loop) { I.reps += Math.floor(I.t / T); I.t = I.t % T; }
    else { I.t = T; I.playing = false; moving = false; setState('paused'); emit('end', I.t); }
   }
  }
  ['yaw', 'pitch', 'dist'].forEach((k) => {
   var d = cm['t' + k] - cm[k]; if (abs(d) > .05) { cm[k] += d * MIN(1, dt * 10 + .02); moving = true; } else cm[k] = cm['t' + k];
  });
  if (I.fc++ % 30 === 0) readColors(I);
  setCur(); render(I, ts / 1000);
  if (I.state === 'loading') setState(I.playing ? 'playing' : 'paused');
  emit('frame', I.t, { reps: I.reps, duration: I.anim ? I.anim.T : 0, playing: I.playing });
  if (moving || (I.hasPulse && !I.rm)) req(); else I.last = 0;
 }
 function resize() {
  var r = cv.getBoundingClientRect(); I.w = MAX(1, Math.round(r.width || cv.width)); I.h = MAX(1, Math.round(r.height || cv.height));
  I.dpr = MIN(G.devicePixelRatio || 1, 2); cv.width = Math.round(I.w * I.dpr); cv.height = Math.round(I.h * I.dpr); req();
 }
 function mk(txt, aria, fn) {
  var b = document.createElement('button'); b.type = 'button'; b.className = 'hx-mq-btn'; b.textContent = txt; b.setAttribute('aria-label', aria);
  b.addEventListener('click', fn); tools.appendChild(b); return b;
 }
 function syncUI() {
  if (ppBtn) { ppBtn.textContent = I.playing ? 'أوقف' : 'شغّل'; ppBtn.setAttribute('aria-label', I.playing ? 'إيقاف الحركة مؤقتاً' : 'تشغيل الحركة'); ppBtn.setAttribute('aria-pressed', I.playing ? 'true' : 'false'); }
  if (slowBtn) slowBtn.setAttribute('aria-pressed', I.speed === .5 ? 'true' : 'false');
 }
 function play() { if (!I.anim) return m; I.playing = true; I.last = 0; setState('playing'); req(); return m; }
 function pause() { I.playing = false; setState('paused'); syncUI(); req(); return m; }
 function seek(t) { if (I.anim) I.t = clamp(+t || 0, 0, I.anim.T); req(); return m; }
 function setSpeed(s) { I.speed = clamp(+s || 1, .05, 4); syncUI(); return m; }
 function camera(c) {
  var cm = I.cam;
  if (!c) return { yaw: cm.tyaw, pitch: cm.tpitch, dist: cm.tdist, orbit: cm.orbit };
  if (c.preset && PRE[c.preset]) { cm.tyaw = PRE[c.preset][0]; cm.tpitch = PRE[c.preset][1]; }
  if (c.yaw != null) cm.tyaw = +c.yaw;
  if (c.pitch != null) cm.tpitch = clamp(+c.pitch, -15, 70);
  if (c.dist != null) cm.tdist = clamp(+c.dist, 1.2, 8);
  if (c.zoom != null) cm.zoom = clamp(+c.zoom, .3, 4);
  if (c.target) cm.target = c.target.slice();
  if (c.orbit != null) cm.orbit = !!c.orbit;
  cm.tyaw = cm.yaw + (((cm.tyaw - cm.yaw + 540) % 360) - 180);
  if (c.instant) { cm.yaw = cm.tyaw; cm.pitch = cm.tpitch; cm.dist = cm.tdist; }
  req(); return m;
 }
 function applyAnim(spec, keepT) {
  var keys = (spec.keys || []).map((k) => { return { t: +k.t || 0, pose: resolve(I, k.pose), ease: k.ease }; }).sort((a, b) => { return a.t - b.t; });
  if (!keys.length) return;
  I.anim = { keys: keys, loop: !!spec.loop, ease: spec.ease || 'inOut', T: keys[keys.length - 1].t };
  I.scratch = clonePose(keys[0].pose); I.cur = I.scratch; if (!keepT) { I.t = 0; I.reps = 0; I.anchorH = null; }
 }
 function show(name) { I.cv.setAttribute('data-theme', name); readColors(I); req(); }
 function tap(x, y) {
  var i, h;
  for (i = I.hits.length - 1; i >= 0; i--) if (inPoly(I.hits[i].poly, x, y)) { h = I.hits[i]; break; }
  if (!tipEl) return;
  if (!h) { tipEl.hidden = true; return; }
  tipEl.textContent = labelOf(h.name); tipEl.hidden = false; tipEl.style.left = clamp(x, 40, I.w - 40) + 'px'; tipEl.style.top = MAX(8, y - 36) + 'px';
  clearTimeout(I.tipT); I.tipT = setTimeout(() => { tipEl.hidden = true; }, 2600);
 }
 function listen(el, ev, fn) { el.addEventListener(ev, fn); cleanup.push(() => { el.removeEventListener(ev, fn); }); }
 cv.classList.add('hx-mq'); cv.setAttribute('role', 'img'); cv.tabIndex = 0; cv.setAttribute('data-theme', o.theme || 'classic');
 cv.setAttribute('aria-label', o.label || 'مجسّم بشري ثلاثي الأبعاد');
 if (host) {
  host.classList.add('hx-mq-host'); host.setAttribute('data-state', 'loading');
  statusEl = document.createElement('div'); statusEl.className = 'hx-mq-status'; statusEl.setAttribute('role', 'status'); statusEl.textContent = STATE_TXT.loading;
  tipEl = document.createElement('div'); tipEl.className = 'hx-mq-tip'; tipEl.hidden = true; tipEl.setAttribute('role', 'status');
  host.appendChild(statusEl); host.appendChild(tipEl); dom.push(statusEl, tipEl);
  if (o.toolbar || I.rm) {
   tools = document.createElement('div'); tools.className = 'hx-mq-tools'; tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', 'أدوات المجسّم'); host.appendChild(tools); dom.push(tools);
   if (o.toolbar) {
    mk('أمام', 'زاوية الكاميرا: أمام', () => { camera({ preset: 'front' }); });
    mk('جانب', 'زاوية الكاميرا: جانب', () => { camera({ preset: 'side' }); });
    mk('خلف', 'زاوية الكاميرا: خلف', () => { camera({ preset: 'back' }); });
    slowBtn = mk('٠٫٥×', 'إبطاء الحركة إلى النصف', () => { setSpeed(I.speed === .5 ? 1 : .5); });
    mk('إعادة', 'إعادة تشغيل الحركة من البداية', () => { seek(0); play(); });
   }
   ppBtn = mk('شغّل', 'تشغيل الحركة', () => { I.playing ? pause() : play(); });
  }
 }
 if (!ctx) { setState('error'); }
 rebuild(); I.pose = resolve(I, {}); I.cur = I.pose; readColors(I); resize();
 if (G.ResizeObserver) { var ro = new ResizeObserver(resize); ro.observe(cv); cleanup.push(() => { ro.disconnect(); }); } else listen(G, 'resize', resize);
 if (G.IntersectionObserver) {
  var io = new IntersectionObserver((e) => { I.vis = e[e.length - 1].isIntersecting; if (I.vis) { I.last = 0; req(); } }); io.observe(cv); cleanup.push(() => { io.disconnect(); });
 }
 listen(document, 'visibilitychange', () => { if (!document.hidden) { I.last = 0; req(); } });
 listen(cv, 'pointerdown', (e) => { I.drag = { x: e.clientX, y: e.clientY, moved: false }; if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
 listen(cv, 'pointermove', (e) => {
  var d = I.drag; if (!d) return; var dx = e.clientX - d.x;
  if (abs(e.clientX - d.x) + abs(e.clientY - d.y) > 4) d.moved = true;
  if (I.cam.orbit && d.moved) { I.cam.yaw -= dx * .5; I.cam.tyaw = I.cam.yaw; d.x = e.clientX; req(); }
 });
 listen(cv, 'pointerup', (e) => {
  var d = I.drag; I.drag = null;
  if (d && !d.moved) { var r = cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); }
 });
 listen(cv, 'keydown', (e) => {
  var k = e.key, cm = I.cam, hit = true;
  if (k === 'ArrowLeft') camera({ yaw: cm.tyaw + 10 }); else if (k === 'ArrowRight') camera({ yaw: cm.tyaw - 10 });
  else if (k === 'ArrowUp') camera({ pitch: cm.tpitch + 5 }); else if (k === 'ArrowDown') camera({ pitch: cm.tpitch - 5 });
  else if (k === ' ') { I.playing ? pause() : play(); } else hit = false;
  if (hit) e.preventDefault();
 });
 m = {
  get state() { return I.state; }, get warnings() { return I.warnings.slice(); }, get duration() { return I.anim ? I.anim.T : 0; },
  get playing() { return I.playing; }, get rig() { return I.rig; },
  setPose: (p) => {
   I.warnings = []; I.partial = p || {}; I.pose = resolve(I, p); I.anim = null; I.animSpec = null; I.playing = false; I.anchorH = null; I.cur = I.pose;
   if (I.state !== 'loading') setState('paused'); req(); return m;
  },
  getPose: () => { return clonePose(I.cur); },
  animate: (spec) => {
   I.warnings = []; I.animSpec = spec; if (spec.speed) I.speed = clamp(+spec.speed, .05, 4);
   applyAnim(spec, false);
   if (spec.autoplay === false || I.rm) { I.playing = false; setState('paused'); } else { I.playing = true; I.last = 0; setState('playing'); }
   req(); return m;
  },
  play: play, pause: pause, seek: seek, setSpeed: setSpeed, camera: camera,
  highlight: (names, op) => {
   I.hl = {}; var list = expandMus(typeof names === 'string' ? [names] : names); I.hasPulse = false;
   list.forEach((n) => { I.hl[n] = { pulse: !!(op && op.pulse) }; if (op && op.pulse) I.hasPulse = true; });
   req(); return list;
  },
  props: (list) => { if (!list) return I.props.slice(); I.props = list.slice(); req(); return m; },
  setTheme: (n) => { show(n); return m; },
  setHeight: (cm) => {
   I.height = clamp(+cm || 170, 120, 220); rebuild(); I.warnings = [];
   if (I.animSpec) applyAnim(I.animSpec, true); else { I.pose = resolve(I, I.partial); I.cur = I.pose; }
   req(); return m;
  },
  setBuild: (b) => { if (BUILD[b]) { I.buildName = b; rebuild(); req(); } return m; },
  setOptions: (op) => {
   if ('pinFeet' in op) I.pinFeet = op.pinFeet ? (op.pinFeet === true ? {} : op.pinFeet) : null;
   if ('pinHands' in op) I.pinHands = !!op.pinHands;
   I.anchorH = null; req(); return m;
  },
  setDebug: (b) => { I.dbg = !!b; req(); return m; },
  describe: (d) => {
   if (d.label) cv.setAttribute('aria-label', d.label);
   if (d.steps && host) {
    if (!stepsEl) { stepsEl = document.createElement('ol'); stepsEl.className = 'hx-mq-steps'; stepsEl.id = 'hxmq' + Math.random().toString(36).slice(2, 7); host.appendChild(stepsEl); dom.push(stepsEl); cv.setAttribute('aria-describedby', stepsEl.id); }
    stepsEl.textContent = ''; d.steps.forEach((s) => { var li = document.createElement('li'); li.textContent = s; stepsEl.appendChild(li); });
   }
   return m;
  },
  validatePose: (p) => { return validate(I, p); },
  resize: () => { resize(); return m; },
  on: (e, f) => { (I.ev[e] = I.ev[e] || []).push(f); return () => { I.ev[e] = I.ev[e].filter((x) => { return x !== f; }); }; },
  snapshot: () => { if (!ctx) return ''; setCur(); render(I, 0); return cv.toDataURL('image/png'); },
  destroy: () => {
   I.alive = false; if (I.raf) cancelAnimationFrame(I.raf); clearTimeout(I.tipT); cleanup.forEach((f) => { f(); });
   dom.forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); }); I.ev = {};
  }
 };
 if (o.pose) m.setPose(o.pose);
 if (ctx) { setCur(); render(I, 0); }
 if (I.state === 'loading') setState('paused');
 syncUI(); req();
 return m;
}
G.Mannequin = { create: create, RIG: RIG, neutral: neutral(170), debug: false };
})(window);
