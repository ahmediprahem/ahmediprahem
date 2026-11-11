/*! Mannequin 3.0 (hx-mq3): جسد تشريحي بشبكة مجلّدة وعرض WebGL بلا مكتبات، مع بديل Canvas-2D (2.0) عند غياب WebGL. Mannequin 2.0 (hx-mq2): تشريح عضلي + أجهزة مفصّلة فوق نفس هيكل 1.0 (الأوضاع متوافقة). Canvas-2D, no deps. Mannequin 1.0 (hx-mq): Canvas-2D, no deps. Axes (left-handed): +X character's right, +Y up, +Z forward; metres; ground y=0; degrees. See RIG.md. */
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
var BUILD = { slim: { sh: .92, hp: .94, m: .88 }, medium: { sh: 1, hp: 1, m: 1 }, strong: { sh: 1.1, hp: 1.06, m: 1.14 }, athletic: { sh: 1.15, hp: 1.03, m: 1.2 } };
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
 ['pelvis','pelvis',[0,-.03,0],[0,.07,0],[.165,.105],[.14,.095],'p'],
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
 ['sho*','hip*',[0,.03,0],[0,-.15,0],[.098,.102],[.09,.096],'h'],
 ['shin*','knee*',[0,0,0],[0,-.41,0],[.052,.062],[.03,.036],'l'],
 ['foot*','ankle*',[0,-.035,-.03],[0,-.05,.13],[.036,.04],[.044,.028],'l'],
 ['toe*','toe*',[0,0,0],[0,-.005,.07],[.044,.027],[.03,.019],'l'],
 ['bSh*','shoulder*',.05], ['bEl*','elbow*',.036], ['bWr*','wrist*',.027], ['bKn*','knee*',.05]
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

// ---- تشريح (2.0): بروفايلات الأعضاء [t, ضرب العرض، ضرب العمق، إزاحة u، إزاحة v(أمام +)] وخطوط الألياف/التقسيم [زاوية بداية/نهاية، t بداية/نهاية، شفافية]
var PROF = {
 neck: [[0, 1.25, 1.1], [.5, 1.1, 1.05], [1, 1, 1]],
 pelvis: [[0, 1, 1, 0, 0], [.5, 1.03, 1.06, 0, -.004], [1, .98, 1]],
 spine1: [[0, 1, 1], [.5, .97, 1], [1, .95, .98]], spine2: [[0, .95, 1], [.5, .98, 1.04], [1, 1.04, 1.02]],
 chest: [[0, 1.02, 1.0], [.45, 1.1, 1.08, 0, .004], [1, 1.12, .96]],
 arm: [[0, 1.12, 1.1], [.28, 1.3, 1.26, 0, .004], [.6, 1.18, 1.2, 0, .003], [1, .96, .96]],
 fore: [[0, 1.22, 1.18], [.25, 1.34, 1.26], [.65, .92, .9], [1, .86, .86]],
 thigh: [[0, 1.0, 1.0], [.3, 1.2, 1.16, 0, .008], [.65, 1.12, 1.14, 0, .004], [1, .92, .94]],
 shin: [[0, .98, .98], [.24, 1.14, 1.22, 0, -.012], [.55, .96, .96], [1, .84, .84]],
 head: [[0, .78, .8, 0, .004], [.3, 1, .98], [.7, 1.04, 1.02], [1, .92, .9]]
};
Object.keys(PROF).forEach(function (k) { PROF[k] = PROF[k].map(function (r) { return [r[0], r[1], r[2], r[3] || 0, r[4] || 0]; }); });
var LINES = {
 spine1: [{a: [0, 0], t: [0, 1], al: .34}, {a: [-34, 34], t: [.25, .25], al: .3}, {a: [-34, 34], t: [.72, .72], al: .3}, {a: [180, 180], t: [0, 1], al: .3}, {a: [52, 66], t: [0, 1], al: .18}],
 spine2: [{a: [0, 0], t: [0, 1], al: .34}, {a: [-36, 36], t: [.4, .4], al: .3}, {a: [-40, 40], t: [.92, .92], al: .26}, {a: [180, 180], t: [0, 1], al: .3}, {a: [52, 70], t: [0, 1], al: .2}],
 chest: [{a: [0, 0], t: [.1, .88], al: .4}, {a: [6, 62], t: [.22, .3], al: .36}, {a: [-6, -62], t: [.22, .3], al: .36}, {a: [180, 180], t: [0, 1], al: .3}, {a: [140, 120], t: [.25, .7], al: .22}, {a: [-140, -120], t: [.25, .7], al: .22}, {a: [78, 86], t: [.1, .6], al: .2}],
 neck: [{a: [28, 14], t: [.05, .95], al: .3}, {a: [-28, -14], t: [.05, .95], al: .3}],
 arm: [{a: [0, 0], t: [.2, .88], al: .3}, {a: [180, 160], t: [.2, .85], al: .26}, {a: [60, 40], t: [.02, .5], al: .25}],
 fore: [{a: [20, 10], t: [.05, .95], al: .24}, {a: [-30, -14], t: [.05, .95], al: .24}, {a: [150, 160], t: [.1, .9], al: .2}],
 thigh: [{a: [0, 0], t: [.12, .9], al: .26}, {a: [38, 30], t: [.1, .92], al: .3}, {a: [-34, -26], t: [.1, .92], al: .3}, {a: [180, 180], t: [.12, .9], al: .26}],
 shin: [{a: [180, 180], t: [.08, .72], al: .3}, {a: [0, 0], t: [.1, .85], al: .22}, {a: [150, 160], t: [.15, .7], al: .2}],
 pelvis: [{a: [180, 180], t: [.15, 1], al: .34}, {a: [-30, -60], t: [.7, .98], al: .2}, {a: [30, 60], t: [.7, .98], al: .2}]
};
// كتل عضلية بيضاوية: [مفصل، مركز محلي، أنصاف أقطار محلية، اسم العضلة للإضاءة، الجانب]
var MASS = [
 ['chest', [.078, .085, .07], [.088, .062, .05], 'chest', 1], ['chest', [-.078, .085, .07], [.088, .062, .05], 'chest', -1],
 ['chest', [.115, .05, -.055], [.052, .115, .045], 'lats', 1], ['chest', [-.115, .05, -.055], [.052, .115, .045], 'lats', -1],
 ['chest', [.07, .115, -.045], [.095, .04, .05], 'traps', 1], ['chest', [-.07, .115, -.045], [.095, .04, .05], 'traps', -1],
 ['chest', [0, .08, -.065], [.1, .09, .035], 'upperBack', 0],
 ['pelvis', [.07, -.012, -.066], [.072, .078, .05], 'glutes', 1], ['pelvis', [-.07, -.012, -.066], [.072, .078, .05], 'glutes', -1],
 ['shoulder', [.012, -.045, .004], [.062, .085, .064], 'delts', 2],
 ['spine1', [.034, .03, .074], [.032, .026, .02], 'abs', 1], ['spine1', [-.034, .03, .074], [.032, .026, .02], 'abs', -1], ['spine1', [.034, .088, .074], [.032, .026, .02], 'abs', 1], ['spine1', [-.034, .088, .074], [.032, .026, .02], 'abs', -1], ['spine2', [.036, .04, .074], [.034, .03, .022], 'abs', 1], ['spine2', [-.036, .04, .074], [.034, .03, .022], 'abs', -1],
 ['spine1', [.098, .06, .0], [.03, .075, .055], 'obliques', 1], ['spine1', [-.098, .06, .0], [.03, .075, .055], 'obliques', -1], ['spine1', [.03, .06, -.07], [.028, .1, .03], 'lowerBack', 1], ['spine1', [-.03, .06, -.07], [.028, .1, .03], 'lowerBack', -1],
 ['shoulder', [.0, -.15, .034], [.04, .075, .036], 'biceps', 2], ['shoulder', [.0, -.14, -.034], [.04, .08, .034], 'triceps', 2], ['elbow', [.0, -.08, .004], [.036, .09, .034], 'forearms', 2],
 ['hip', [.0, -.2, .044], [.064, .16, .052], 'quads', 2], ['hip', [.038, -.27, .03], [.03, .09, .03], 'quads', 2], ['hip', [.0, -.2, -.044], [.058, .15, .045], 'hamstrings', 2], ['hip', [-.042, -.18, .0], [.03, .12, .042], 'adductors', 2], ['knee', [.0, -.12, -.036], [.042, .095, .04], 'calves', 2], ['knee', [.022, -.1, -.03], [.026, .08, .03], 'calves', 2],
 ['head', [.0, .135, -.008], [.068, .066, .078], 'hair', 0]
];
function lerpv(a, b, t) { return a + (b - a) * t; }
function buildParts(I) {
 var hs = I.hs, bd = I.bd, out = [], byId = {};
 SPEC.forEach((sp) => {
  (sp[0].slice(-1) === '*' || /\*/.test(sp[0]) ? ['L', 'R'] : ['']).forEach((S) => {
   var id = sp[0].replace('*', S), j = sp[1].replace('*', S), pt = { id: id, j: j, mus: [], bias: 0 };
   if (sp.length === 3) { pt.r = sp[2] * hs * bd.m; pt.a = [0, 0, 0]; pt.bias = -.04 * hs; }
   else {
    var k = sp[6], xs = k === 'c' ? bd.sh : k === 'l' ? 1 : bd.hp;
    pt.a = mul(sp[2], hs); pt.b = sp[3] === 'S' ? I.off['shoulder' + S] : mul(sp[3], hs);
    var mp = (sp[0] === 'pelvis' || sp[0] === 'spine1') ? 1 + .3 * (bd.m - 1) : (sp[0] === 'head' || sp[0] === 'neck') ? 1 + .5 * (bd.m - 1) : bd.m;
    pt.ra = [sp[4][0] * hs * mp * xs, sp[4][1] * hs * mp]; pt.rb = [sp[5][0] * hs * mp * xs, sp[5][1] * hs * mp];
    var e = nrm(sub(pt.b, pt.a)), ep = e[1] < 0 ? mul(e, -1) : e;
    pt.u = [1, 0, 0]; pt.v = nrm(crs(pt.u, ep)); pt.bias = id === 'neck' || sp[0] === 'clav*' ? .08 * hs : 0;
   }
   if (id === 'pelvis' || id.indexOf('sho') === 0) pt.bias = -.06 * hs;
   pt.hs = hs; var bid = id.replace(/[LR]$/, ''); pt.prof = PROF[bid] || null; pt.lines = (LINES[bid] || []).map(function (l) { return S === 'L' ? { a: [360 - l.a[0], 360 - l.a[1]], t: l.t, al: l.al } : l; });
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
var CVARS = ['body', 'hi', 'lo', 'rim', 'joint', 'glow', 'floor', 'prop', 'propHi', 'propLo', 'shadow', 'bg', 'line', 'hair', 'eye', 'lip', 'metal', 'metalHi', 'metalLo', 'pad', 'padHi', 'padLo', 'plate', 'plateHi', 'plateLo', 'rubber'];
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
function profAt(pt, t) {
 var P = pt.prof; if (!P) return [1, 1, 0, 0]; if (t <= P[0][0]) return P[0].slice(1);
 for (var i = 1; i < P.length; i++) if (t <= P[i][0]) { var a = P[i-1], b = P[i], f = (t - a[0]) / (b[0] - a[0] || 1); return [a[1] + (b[1]-a[1]) * f, a[2] + (b[2]-a[2]) * f, (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * f, (a[4] || 0) + ((b[4] || 0) - (a[4] || 0)) * f]; }
 return P[P.length-1].slice(1);
}
function ring(c, pt, A, B, U, V, E, t, sc, ofs, T, out) {
 var pf = profAt(pt, t), tc = t < 0 ? 0 : t > 1 ? 1 : t, hs = pt.hs || 1,
  ru = (pt.ra[0] + (pt.rb[0] - pt.ra[0]) * tc) * sc * pf[0], rv = (pt.ra[1] + (pt.rb[1] - pt.ra[1]) * tc) * sc * pf[1],
  cx = A[0] + (B[0]-A[0]) * t + E[0] * ofs + (U[0] * pf[2] + V[0] * pf[3]) * hs, cy = A[1] + (B[1]-A[1]) * t + E[1] * ofs + (U[1] * pf[2] + V[1] * pf[3]) * hs, cz = A[2] + (B[2]-A[2]) * t + E[2] * ofs + (U[2] * pf[2] + V[2] * pf[3]) * hs;
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
 if (GLQ) { GLQ.push({ k: 'box', c: cen, s: sz, R: RY((ry || 0) * D), pal: pal }); return; }
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
 if (GLQ) { GLQ.push({ k: 'cap', a: A, b: B, ra: rA, rb: rB, pal: pal }); return; }
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
    if (GLQ) { GLQ.push({ k: 'floor', r: p.r || .75, pal: pal }); break; }
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
   case 'bench': {
    var bh = p.h || .45, bw = p.w || .3, bl = p.l || 1.2, ry2 = ry, loc = (x, y, z) => { return add(pos, mv(Ry, [x, y, z])); }, pr = [{ k: 'box', p: loc(0, bh - .05, 0), s: [bw, .1, bl], m: 'pad', ry: ry2, bev: .012 }];
    [-1, 1].forEach((sx) => { pr.push({ k: 'box', p: loc(sx * (bw / 2 - .03), bh - .125, 0), s: [.045, .05, bl * .92], m: 'metal', ry: ry2 }); [-1, 1].forEach((sz) => { pr.push({ k: 'box', p: loc(sx * (bw / 2 - .03), (bh - .15) / 2, sz * (bl / 2 - .1)), s: [.05, bh - .15, .05], m: 'metal', ry: ry2 }); }); });
    [-1, 1].forEach((sz) => { pr.push({ k: 'box', p: loc(0, .02, sz * (bl / 2 - .1)), s: [bw + .16, .04, .07], m: 'metal', ry: ry2 }); });
    sceneItems(I, c, Lw, items, W, { parts: pr }); break; }
   case 'chair': {
    var ch = p.type === 'chair', h = p.h || .45, w = ch ? .42 : p.w || .3, l = ch ? .42 : p.l || 1.2, lg = ch ? .18 : 0;
    boxItems(I, c, Lw, items, at([0, h - .03, 0]), [w, .06, l], ry, 0, pal);
    if (ch) boxItems(I, c, Lw, items, at([0, h + .22, -.19]), [.42, .42, .04], ry, 0, pal);
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach((s) => { boxItems(I, c, Lw, items, at([s[0] * (lg || w / 2 - .03), (h - .06) / 2, s[1] * (lg || l / 2 - .05)]), [.05, h - .06, .05], ry, 0, pal); }); break; }
   case 'box': { var sz = p.size || [.4, .4, .4]; boxItems(I, c, Lw, items, [pos[0], pos[1] + sz[1] / 2, pos[2]], sz, ry, 0, pal); break; }
   case 'wall': {
    if (GLQ) { GLQ.push({ k: 'box', c: [0, 1.25, (p.pos ? pos[2] : -.7) - .02], s: [2.8, 2.5, .03], R: RY(0), pal: { body: mixc(pal.body, I.col.floor, .5), lo: pal.lo } }); break; }
    var z = p.pos ? pos[2] : -.7, q = [[-1.4, 0], [1.4, 0], [1.4, 2.5], [-1.4, 2.5]].map((v) => { return P(c, [v[0], v[1], z]); });
    items.push({ d: 1e9 + 3, f: () => { path(ctx, q); ctx.fillStyle = rgba(pal.body, .28); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(pal.lo, .6); ctx.stroke(); } }); break; }
   case 'barbell': barbellItems(I, c, Lw, items, W, p); break;
   case 'scene': sceneItems(I, c, Lw, items, W, p); break;
   case 'dumbbell': dumbbellItems(I, c, Lw, items, W, p); break;
   case 'dumbbell2': {
    var sides = p.hand === 'L' ? ['L'] : p.hand === 'R' ? ['R'] : ['L', 'R'], len = p.len || .2;
    sides.forEach((S) => {
     var w = W['wrist' + S], G0 = tf(w, mul([0, -.09, 0], I.hs)), ax = mv(w.R, [0, 0, 1]), e1 = add(G0, mul(ax, len / 2)), e0 = sub(G0, mul(ax, len / 2));
     capItem(I, c, items, e0, e1, .013, .013, pal, -.02);
     [e0, e1].forEach((e, i) => { capItem(I, c, items, e, add(e, mul(ax, (i ? .035 : -.035))), .045, .045, pal, -.03); });
    }); break; }
   case 'band': { if ((p.from || 'handL') === 'handL' && (p.to || 'handR') === 'handR' && (p.rest || .5) >= 9) { barbellItems(I, c, Lw, items, W, p); break; }
    var a = jointPos(I, W, p.from || 'handL'), b = jointPos(I, W, p.to || 'handR'), L = sqrt(dot(sub(a, b), sub(a, b))), rest = p.rest || .5,
     st = clamp((L - rest) / rest, 0, 1), col = mixc(pal.body, I.col.glow, st);
    capItem(I, c, items, a, b, .014 * (1 - .4 * st), .014 * (1 - .4 * st), { hi: mixc(col, [255,255,255,1], .3), body: col, lo: mixc(col, [0,0,0,1], .4), rim: mixc(col, [255,255,255,1], .5) }, -.04); break; }
  }
 });
}

function drawLines(I, c, pt, A, B, U, V, E) {
 var ctx = I.ctx, col = I.col.line, N = 9;
 ctx.lineCap = 'round'; ctx.lineJoin = 'round';
 pt.lines.forEach((ln) => {
  var prev = null, i;
  for (i = 0; i <= N; i++) {
   var s = i / N, ang = (ln.a[0] + (ln.a[1] - ln.a[0]) * s) * D, t = ln.t[0] + (ln.t[1] - ln.t[0]) * s, o = [];
   ring(c, pt, A, B, U, V, E, t, 1.014, 0, [[sin(ang), cos(ang)]], o);
   var n = add(mul(U, sin(ang)), mul(V, cos(ang))), md = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t], f = dot(n, nrm(sub(c.pos, md))), cur = o[0]; cur.f = f;
   if (prev && prev.f > .1 && f > .1) { ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.strokeStyle = rgba(col, MIN(1, ln.al * 1.6) * clamp((f + prev.f) * .8, 0, 1)); ctx.lineWidth = MAX(.8, .0062 * cur[3]); ctx.stroke(); }
   prev = cur;
  }
 });
}
function ellPts(c, ctr, ax, ay, az) {
 var pts = [], i, j;
 for (i = 1; i < 8; i++) { var th = i * PI / 8; for (j = 0; j < 20; j++) { var ph = j * PI / 10, x = sin(th) * cos(ph), y = cos(th), z = sin(th) * sin(ph); pts.push(P(c, add(ctr, add(mul(ax, x), add(mul(ay, y), mul(az, z)))))); } }
 pts.push(P(c, add(ctr, ay)), P(c, sub(ctr, ay))); return pts;
}
var SHORTS = { hi: [74, 74, 86, 1], body: [26, 26, 32, 1], lo: [10, 10, 14, 1], rim: [0, 0, 0, 1] };
var SIDED = { lats: 1, traps: 1, delts: 1, obliques: 1, lowerBack: 0, biceps: 1, triceps: 1, forearms: 1, quads: 1, hamstrings: 1, adductors: 1, calves: 1 };
function massItems(I, c, W, items, pal, hl, pulse) {
 var hs = I.hs, bm = I.bd.m, ctx = I.ctx, col = I.col;
 MASS.forEach((m) => {
  var sides = m[4] === 2 ? ['L', 'R'] : [''];
  sides.forEach((S) => {
   var jn = m[0] + S, wj = W[jn]; if (!wj) return;
   var sd = m[4] === 2 ? (S === 'L' ? -1 : 1) : m[4] || 1, cl = [m[1][0] * (m[4] === 2 ? sd : 1), m[1][1], m[1][2]], isHair = m[3] === 'hair', k = isHair ? 1 : bm,
    ctr = tf(wj, mul(cl, hs)), ax = mv(wj.R, [m[2][0] * hs * k, 0, 0]), ay = mv(wj.R, [0, m[2][1] * hs * k, 0]), az = mv(wj.R, [0, 0, m[2][2] * hs * k]);
   var name = SIDED[m[3]] ? m[3] + (m[4] === -1 || S === 'L' ? 'L' : 'R') : m[3], q = P(c, ctr), pl = m[3] === 'glutes' ? SHORTS : isHair ? { hi: mixc(col.hair, [255, 255, 255, 1], .25), body: col.hair, lo: mixc(col.hair, [0, 0, 0, 1], .45), rim: mixc(col.hair, [0, 0, 0, 1], .6) } : pal;
   if (isHair) { var fd = mv(wj.R, [0, 0, 1]), fv = dot(fd, nrm(sub(c.pos, ctr))); q[2] += fv > -.2 ? .035 * hs : -.035 * hs; }
   var H = hull(ellPts(c, ctr, ax, ay, az)), a2 = P(c, sub(ctr, ay)), b2 = P(c, add(ctr, ay));
   items.push({ d: q[2] - (isHair ? 0 : .012 * hs), f: () => {
    path(ctx, H); shade(ctx, H, a2, b2, pl);
    if (!isHair && hl[name]) { var hv = hl[name], al = hv.pulse ? .3 + .35 * pulse : .55; path(ctx, H); ctx.fillStyle = rgba(col.glow, al); ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(col.glow, MIN(1, al * 1.6)); ctx.stroke(); }
   } });
  });
 });
}
function faceItems(I, c, W, items) {
 var hs = I.hs, ctx = I.ctx, col = I.col, wj = W.head, ctr = tf(wj, mul([0, .1, .0], hs)), fd = mv(wj.R, [0, 0, 1]), fv = dot(fd, nrm(sub(c.pos, ctr)));
 if (fv < .18) return;
 var pt = (x, y, z) => P(c, tf(wj, mul([x, y, z], hs))), q = P(c, ctr), al = clamp((fv - .18) / .5, 0, 1);
 items.push({ d: q[2] - .06 * hs, f: () => {
  var k = q[3] * hs, e = (sx) => { var p = pt(sx * .03, .112, .076); ctx.beginPath(); ctx.ellipse(p[0], p[1], .0125 * p[3] * hs, .0072 * p[3] * hs, 0, 0, 2 * PI); ctx.fillStyle = rgba(col.eye, .85 * al); ctx.fill(); },
   br = (sx) => { var a = pt(sx * .016, .13, .074), b = pt(sx * .044, .134, .066); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineWidth = MAX(1, .0042 * a[3] * hs); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(col.hair, .8 * al); ctx.stroke(); };
  e(-1); e(1); br(-1); br(1);
  var n0 = pt(0, .118, .082), n1 = pt(0, .082, .091), n2 = pt(0, .074, .086); ctx.beginPath(); ctx.moveTo(n0[0], n0[1]); ctx.lineTo(n1[0], n1[1]); ctx.lineTo(n2[0], n2[1]); ctx.lineWidth = MAX(1, .0034 * n1[3] * hs); ctx.strokeStyle = rgba(col.line, .55 * al); ctx.stroke();
  var m0 = pt(-.018, .054, .08), m1 = pt(.018, .054, .08), mm1 = pt(0, .05, .084); ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.quadraticCurveTo(mm1[0], mm1[1], m1[0], m1[1]); ctx.lineWidth = MAX(1, .0042 * mm1[3] * hs); ctx.strokeStyle = rgba(col.lip, .7 * al); ctx.stroke();
 } });
}

// ================= الأجهزة (2.0): أوليات ثلاثية الأبعاد (صندوق مدوّر، قرص، أسطوانة) + مشهد وصفي قابل للتركيب
function Rrot(rx, ry) { return mm(RY((ry || 0) * D), RX((rx || 0) * D)); }
function matPal(I, m) {
 var C = I.col; switch (m) {
  case 'pad': return { hi: C.padHi, body: C.pad, lo: C.padLo, rim: C.padLo };
  case 'metal': return { hi: C.metalHi, body: C.metal, lo: C.metalLo, rim: C.metalLo };
  case 'plate': return { hi: C.plateHi, body: C.plate, lo: C.plateLo, rim: C.plateLo };
  case 'rubber': return { hi: mixc(C.rubber, [255, 255, 255, 1], .12), body: C.rubber, lo: mixc(C.rubber, [0, 0, 0, 1], .4), rim: C.rubber };
  case 'accent': return { hi: mixc(C.glow, [255, 255, 255, 1], .45), body: C.glow, lo: mixc(C.glow, [0, 0, 0, 1], .5), rim: mixc(C.glow, [0, 0, 0, 1], .6) };
  default: return { hi: C.propHi, body: C.prop, lo: C.propLo, rim: C.propLo };
 }
}
function endPt(I, W, e) { // سلسلة: [x,y,z] عالمي | 'handL' | 'ankleR'... | {j:'shoulderL', off:[...]}
 if (Array.isArray(e)) return e;
 if (typeof e === 'string') { var m = /^hand([LR])$/.exec(e); if (m) return tf(W['wrist' + m[1]], mul([0, -.09, 0], I.hs)); return W[e] ? W[e].p.slice() : [0, 0, 0]; }
 var w = W[e.j]; return w ? tf(w, mul(e.off || [0, 0, 0], I.hs)) : [0, 0, 0];
}
function oboxItem(I, c, Lw, items, ctr, size, Rm, pal, d0, bev) {
 if (GLQ) { GLQ.push({ k: 'box', c: ctr, s: size, R: Rm, pal: pal }); return; }
 var AX = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], hh = [size[0] / 2, size[1] / 2, size[2] / 2], ctx = I.ctx;
 for (var a = 0; a < 3; a++) for (var sg = -1; sg <= 1; sg += 2) ((a, sg) => {
  var b1 = (a + 1) % 3, b2 = (a + 2) % 3, fc = add(ctr, mv(Rm, mul(AX[a], sg * hh[a]))), nw = mv(Rm, mul(AX[a], sg));
  if (dot(nw, sub(c.pos, fc)) <= 0) return;
  var q = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map((s2) => { return P(c, add(ctr, mv(Rm, add(mul(AX[a], sg * hh[a]), add(mul(AX[b1], s2[0] * hh[b1]), mul(AX[b2], s2[1] * hh[b2])))))); });
  var lf = clamp(dot(nw, Lw), 0, 1), col = mixc(pal.lo, pal.hi, .2 + .8 * lf), fp = P(c, fc);
  items.push({ d: fp[2] + d0, f: () => {
   path(ctx, q); ctx.fillStyle = rgba(col); ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = MAX(1, (bev || .004) * fp[3]); ctx.strokeStyle = rgba(mixc(col, pal.hi, .35)); ctx.stroke();
  } });
 })(a, sg);
}
function discItem(I, c, Lw, items, ctr, ax, R, th, pal, d0, hub) {
 if (GLQ) { GLQ.push({ k: 'disc', c: ctr, ax: ax, R: R, th: th, pal: pal, hub: hub }); return; }
 var up = Math.abs(ax[1]) > .9 ? [1, 0, 0] : [0, 1, 0], u = nrm(crs(ax, up)), v = crs(ax, u), ctx = I.ctx, N = 28, k, pts = [], f0 = [], f1 = [];
 for (k = 0; k < N; k++) { var an = k * 2 * PI / N, o = add(mul(u, cos(an) * R), mul(v, sin(an) * R)), a = P(c, add(add(ctr, o), mul(ax, th / 2))), b = P(c, add(sub(ctr, mul(ax, th / 2)), o)); f0.push(a); f1.push(b); pts.push(a, b); }
 var H = hull(pts), q = P(c, ctr), fv = dot(ax, nrm(sub(c.pos, ctr))), face = fv > 0 ? f0 : f1, ctrP = P(c, add(ctr, mul(ax, (fv > 0 ? 1 : -1) * th / 2)));
 items.push({ d: q[2] + d0, f: () => {
  path(ctx, H); var ga = P(c, add(ctr, mul(v, R))), gb = P(c, sub(ctr, mul(v, R))); shade(ctx, H, ga, gb, pal);
  if (abs(fv) > .12) { path(ctx, face); var g = ctx.createRadialGradient(ctrP[0], ctrP[1], 0, ctrP[0], ctrP[1], R * ctrP[3]); g.addColorStop(0, rgba(pal.hi)); g.addColorStop(.55, rgba(pal.body)); g.addColorStop(1, rgba(pal.lo)); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = rgba(pal.rim, .8); ctx.stroke();
   if (hub !== false) { ctx.beginPath(); ctx.ellipse(ctrP[0], ctrP[1], R * .2 * ctrP[3], R * .2 * ctrP[3] * abs(fv), Math.atan2(0, 1), 0, 2 * PI); ctx.fillStyle = rgba(pal.lo, .85); ctx.fill(); } }
 } });
}
function barbellItems(I, c, Lw, items, W, p) {
 var a = endPt(I, W, p.from || 'handL'), b = endPt(I, W, p.to || 'handR'), mid = mul(add(a, b), .5), d = sub(b, a), L = sqrt(dot(d, d)), ax = L > .05 ? mul(d, 1 / L) : [1, 0, 0], half = (p.len || 2.2) / 2, hs = I.hs, pr = (p.plateR || .2) * hs, pm = matPal(I, 'plate'), mt = matPal(I, 'metal'), n = p.plates == null ? 2 : p.plates, e0 = sub(mid, mul(ax, half)), e1 = add(mid, mul(ax, half));
 capItem(I, c, items, e0, e1, .0125 * hs, .0125 * hs, mt, -.02);
 [-1, 1].forEach((sg) => {
  var s0 = add(mid, mul(ax, sg * .5)), s1 = add(mid, mul(ax, sg * half)); capItem(I, c, items, s0, s1, .025 * hs, .025 * hs, mt, -.03);
  for (var k = 0; k < n; k++) discItem(I, c, Lw, items, add(mid, mul(ax, sg * (.58 + k * .052))), ax, (k ? pr * .9 : pr), .046 * hs, pm, -.05);
  discItem(I, c, Lw, items, add(mid, mul(ax, sg * (.58 + n * .052 + .02))), ax, .032 * hs, .03 * hs, mt, -.06, false);
 });
}
function dumbbellItems(I, c, Lw, items, W, p) {
 var pm = matPal(I, 'plate'), mt = matPal(I, 'metal'), hs = I.hs, sides = p.hand === 'L' ? ['L'] : p.hand === 'R' ? ['R'] : ['L', 'R'], len = (p.len || .2) * hs;
 sides.forEach((S) => {
  var w = W['wrist' + S], g = tf(w, mul([0, -.09, 0], hs)), ax = mv(w.R, [0, 0, 1]);
  capItem(I, c, items, sub(g, mul(ax, len * .5)), add(g, mul(ax, len * .5)), .014 * hs, .014 * hs, mt, -.02);
  [-1, 1].forEach((sg) => { discItem(I, c, Lw, items, add(g, mul(ax, sg * len * .5)), ax, .052 * hs, .05 * hs, pm, -.04); });
 });
}
function sceneItems(I, c, Lw, items, W, p) {
 (p.parts || []).forEach((q) => {
  var pal = matPal(I, q.m), Rm = Rrot(q.rx, q.ry);
  if (q.k === 'box') { var pos = endPt(I, W, q.p), off = q.o ? mv(Rm, q.o) : [0, 0, 0]; oboxItem(I, c, Lw, items, add(pos, off), q.s, Rm, pal, q.d0 || 0, q.bev); }
  else if (q.k === 'cyl') capItem(I, c, items, endPt(I, W, q.a), endPt(I, W, q.b), q.r, q.r2 || q.r, pal, q.d0 || 0);
  else if (q.k === 'disc') { var ax = q.ax ? nrm(q.ax) : [1, 0, 0]; discItem(I, c, Lw, items, endPt(I, W, q.p), ax, q.R, q.th, pal, q.d0 || 0, q.hub); }
  else if (q.k === 'cable') { if (GLQ) { GLQ.push({ k: 'cap', a: endPt(I, W, q.a), b: endPt(I, W, q.b), ra: .004, rb: .004, pal: matPal(I, 'metal') }); return; } var A = P(c, endPt(I, W, q.a)), B = P(c, endPt(I, W, q.b)), ctx = I.ctx; items.push({ d: (A[2] + B[2]) / 2 + (q.d0 || 0), f: () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineCap = 'round'; ctx.lineWidth = MAX(1, .006 * (A[3] + B[3]) / 2); ctx.strokeStyle = rgba(I.col.metalLo, .95); ctx.stroke(); } }); }
 });
}
var CAP = [[.87, .5], [.66, .8], [.32, .97]];
function render(I, time) {
 if (I.gl) return renderGL(I, time);
 var ctx = I.ctx, w = I.w, h = I.h, hs = I.hs, col = I.col, hl = I.hl, dbg = G.Mannequin.debug || I.dbg;
 ctx.setTransform(I.dpr, 0, 0, I.dpr, 0, 0); ctx.clearRect(0, 0, w, h);
 if (col.bg[3] > 0) { ctx.fillStyle = rgba(col.bg); ctx.fillRect(0, 0, w, h); }
 var W = world(I, I.cur); ik(I, W); I.W = W;
 var c = camOf(I), Lw = nrm(add(add(mul(c.r, -.45), mul(c.u, .7)), mul(c.f, -.55))), items = [], hits = [], shp = new Path2D(), pal = { hi: col.hi, body: col.body, lo: col.lo, rim: col.rim },
  jpal = { hi: mixc(col.joint, col.hi, .5), body: col.joint, lo: mixc(col.joint, col.lo, .55), rim: mixc(col.joint, col.lo, .8) }, pulse = I.rm ? .6 : .5 + .5 * sin(time * 7.5);
 I.hits = hits;
 I.parts.forEach((pt) => {
  var wj = W[pt.j], R = wj.R, A = tf(wj, pt.a), q;
  if (pt.r) { q = P(c, A); var rr = pt.r * q[3]; items.push({ d: q[2] + pt.bias, f: () => { ballDraw(ctx, q[0], q[1], rr, jpal); } }); return; }
  var B = tf(wj, pt.b), U = mv(R, pt.u), V = mv(R, pt.v), E = nrm(sub(B, A)), pts = [], rA = (pt.ra[0] + pt.ra[1]) / 2, rB = (pt.rb[0] + pt.rb[1]) / 2;
  var rg = (t, sc, ofs, T, out) => { ring(c, pt, A, B, U, V, E, t, sc, ofs, T, out); };
  rg(0, 1, 0, CIR, pts); rg(1, 1, 0, CIR, pts);
  CAP.forEach((q) => { rg(0, q[0], -q[1] * rA, CIR, pts); rg(1, q[0], q[1] * rB, CIR, pts); });
  if (pt.prof) [.2, .4, .6, .8].forEach((t) => { rg(t, 1, 0, CIR, pts); });
  var H = hull(pts), a2 = P(c, A), b2 = P(c, B), d = (a2[2] + b2[2]) / 2 + pt.bias;
  var ga = [A[0] - Lw[0] * .5 * A[1], 0, A[2] - Lw[2] * .5 * A[1]], gb = [B[0] - Lw[0] * .5 * B[1], 0, B[2] - Lw[2] * .5 * B[1]], gp = [], pa = P(c, ga), pb = P(c, gb);
  for (var k = 0; k < 8; k++) { var s = sin(k * PI / 4) * (rA + rB) * .5, t = cos(k * PI / 4) * (rA + rB) * .5;
   gp.push(P(c, [ga[0] + s, 0, ga[2] + t]), P(c, [gb[0] + s, 0, gb[2] + t])); }
  var GH = hull(gp); shp.moveTo(GH[0][0], GH[0][1]); for (k = 1; k < GH.length; k++) shp.lineTo(GH[k][0], GH[k][1]); shp.closePath();
  var ppal = (pt.id === 'pelvis' || pt.id.indexOf('sho') === 0) ? SHORTS : pal;
  items.push({ d: d, f: () => { path(ctx, H); shade(ctx, H, a2, b2, ppal); if (pt.lines && pt.lines.length) drawLines(I, c, pt, A, B, U, V, E); } });
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
 massItems(I, c, W, items, pal, hl, pulse); faceItems(I, c, W, items);
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
// ===== 3.0: عرض WebGL بلا مكتبات — جسد تشريحي بشبكة مجلّدة (LBS) فوق نفس الهيكل والأوضاع، والأجهزة مجسّمات، وظل مسقط على الأرض =====
var GLQ = null;
var VS3 = 'attribute vec3 aP,aN,aC;attribute float aH;uniform mat4 uM;varying vec3 vN,vC,vW;varying float vH;void main(){vN=aN;vC=aC;vW=aP;vH=aH;gl_Position=uM*vec4(aP,1.);}';
var FS3 = 'precision mediump float;varying vec3 vN,vC,vW;varying float vH;uniform vec3 uL,uE,uG,uSky,uGnd;uniform float uP,uSh,uA;' +
 'void main(){if(uSh>.5){gl_FragColor=vec4(uG,uA);return;}vec3 N=normalize(vN),V=normalize(uE-vW);if(dot(N,V)<0.)N=-N;' +
 'float nl=dot(N,uL),d=clamp(nl*.62+.38,0.,1.);d=d*d*(3.-2.*d);vec3 amb=mix(uGnd,uSky,N.y*.5+.5);' +
 'float h=clamp(vH,0.,1.),sk=step(-.5,vH);vec3 base=mix(vC,uG,h*(.5+.32*uP));' +
 'float sp=pow(max(dot(N,normalize(uL+V)),0.),30.)*.2,rim=pow(1.-max(dot(N,V),0.),3.2)*.28;' +
 'vec3 c=base*(amb*.62+d*.78)+base*vec3(.42,.1,.05)*d*(1.-d)*1.3*sk+vec3(sp)*(.6+.4*sk)+uSky*rim*.5+uG*h*.12;gl_FragColor=vec4(c,1.);}';
function glInit(I) {
 var gl = I.gl, sh = (t, s) => { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, p = gl.createProgram();
 gl.attachShader(p, sh(gl.VERTEX_SHADER, VS3)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS3)); gl.linkProgram(p);
 if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
 gl.useProgram(p); I.pg = p; I.loc = {};
 ['uM', 'uL', 'uE', 'uG', 'uSky', 'uGnd', 'uP', 'uSh', 'uA'].forEach((n) => { I.loc[n] = gl.getUniformLocation(p, n); });
 ['aP', 'aN', 'aC', 'aH'].forEach((n) => { I.loc[n] = gl.getAttribLocation(p, n); });
 I.vb = gl.createBuffer(); I.ib = gl.createBuffer(); I.VA = new Float32Array(10 * 30000); I.IA = new Uint16Array(150000);
 return true;
}
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function keyAt(K, s) { // استيفاء ناعم (Catmull-Rom) لمفاتيح [s, …قيم]
 var n = K.length, i = 0; if (s <= K[0][0]) return K[0]; if (s >= K[n - 1][0]) return K[n - 1];
 while (i < n - 2 && s > K[i + 1][0]) i++;
 var p0 = K[MAX(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[MIN(n - 1, i + 2)], t = (s - p1[0]) / (p2[0] - p1[0]), o = [s], k, m1, m2;
 for (k = 1; k < 5; k++) {
  m1 = ((p2[k] || 0) - (p0[k] || 0)) / (p2[0] - p0[0]) * (p2[0] - p1[0]); m2 = ((p3[k] || 0) - (p1[k] || 0)) / (p3[0] - p1[0]) * (p2[0] - p1[0]);
  o[k] = (2 * t * t * t - 3 * t * t + 1) * (p1[k] || 0) + (t * t * t - 2 * t * t + t) * m1 + (-2 * t * t * t + 3 * t * t) * (p2[k] || 0) + (t * t * t - t * t) * m2;
 }
 return o;
}
// المفاتيح: [الموضع على المحور، نصف العرض، نصف العمق، إزاحة جانبية، إزاحة أمامية] بالمتر لقامة 170
var K_TORSO = [[.812, .045, .055, 0, 0], [.84, .112, .09, 0, -.004], [.88, .156, .108, 0, -.008], [.925, .17, .113, 0, -.008], [.975, .163, .105, 0, -.004], [1.03, .149, .097, 0, 0], [1.10, .133, .09, 0, .002], [1.17, .138, .094, 0, .004],
 [1.24, .15, .102, 0, .006], [1.31, .163, .11, 0, .008], [1.365, .172, .106, 0, .004], [1.405, .172, .092, 0, -.004], [1.435, .13, .074, 0, -.008], [1.46, .072, .06, 0, -.004], [1.50, .052, .054, 0, 0], [1.55, .05, .052, 0, .004]];
var K_HEAD = [[1.49, .02, .024, 0, .03], [1.512, .048, .062, 0, .016], [1.54, .062, .08, 0, .008], [1.575, .07, .09, 0, .004], [1.61, .074, .096, 0, 0], [1.645, .073, .095, 0, -.002], [1.675, .064, .084, 0, -.004], [1.695, .04, .054, 0, -.004], [1.704, .012, .016, 0, -.004]];
var K_ARM = [[.052, .016, .018, -.016, 0], [.036, .044, .048, -.008, 0], [.008, .057, .06, 0, 0], [-.03, .06, .062, .002, 0], [-.08, .056, .06, .002, 0], [-.13, .05, .056, 0, .002], [-.18, .047, .053, 0, .003], [-.23, .043, .047, 0, .002], [-.275, .04, .041, 0, 0], [-.30, .039, .038, 0, 0],
 [-.33, .041, .039, 0, 0], [-.37, .043, .039, 0, 0], [-.42, .04, .035, 0, 0], [-.48, .034, .029, 0, 0], [-.53, .029, .024, 0, 0], [-.56, .027, .02, 0, 0],
 [-.585, .03, .016, 0, 0], [-.62, .036, .014, 0, .002], [-.655, .037, .012, 0, .006], [-.69, .034, .01, 0, .014], [-.72, .026, .008, 0, .024], [-.736, .012, .005, 0, .03]];
var K_LEG = [[.078, .028, .032, -.012, 0], [.05, .066, .074, -.006, 0], [.01, .086, .094, 0, -.004], [-.05, .09, .096, .002, -.004], [-.12, .086, .092, .002, 0], [-.20, .078, .084, 0, .002], [-.28, .068, .074, 0, .002], [-.35, .058, .064, 0, 0], [-.40, .053, .058, 0, .002], [-.42, .052, .057, 0, .004],
 [-.46, .05, .054, 0, 0], [-.52, .052, .058, 0, -.006], [-.58, .052, .06, .002, -.01], [-.66, .045, .05, 0, -.006], [-.74, .036, .04, 0, -.002], [-.80, .031, .036, 0, 0], [-.83, .03, .036, 0, 0], [-.862, .028, .036, 0, .004]];
var K_FOOT = [[-.064, .01, .012, 0, -.052], [-.05, .026, .028, 0, -.05], [-.02, .032, .034, 0, -.045], [.02, .036, .032, 0, -.046], [.06, .04, .024, 0, -.056], [.10, .045, .016, 0, -.064], [.13, .046, .013, 0, -.067], [.165, .043, .01, 0, -.07], [.19, .034, .008, 0, -.072], [.203, .014, .005, 0, -.073]];
// النتوءات العضلية: [زاوية (0 أمام، 90 للخارج، 180 خلف)، المقدار، عرض زاوي، بداية، نهاية، مرآة]
var B_TORSO = [[28, .11, 24, 1.25, 1.375, 1, 1], [0, -.035, 8, 1.24, 1.36], [0, -.028, 7, 1.03, 1.22], [14, .036, 10, 1.03, 1.09, 1], [14, .038, 10, 1.095, 1.155, 1], [14, .038, 10, 1.16, 1.225, 1], [105, .05, 26, 1.15, 1.36, 1, 1], [180, -.05, 9, .98, 1.4], [165, .03, 10, 1.0, 1.25, 1],
 [155, .13, 26, .84, .975, 1], [150, .04, 18, 1.28, 1.4, 1, 1], [180, .12, 50, 1.41, 1.47, 0, 1], [60, .03, 30, 1.03, 1.14, 1]];
var B_HEAD = [[0, .1, 9, 1.565, 1.615], [0, .03, 40, 1.615, 1.64], [0, .06, 20, 1.495, 1.53], [90, .1, 8, 1.575, 1.625, 1], [180, .05, 60, 1.58, 1.67], [22, -.035, 9, 1.598, 1.626, 1]];
var B_ARM = [[90, .11, 50, .025, -.14, 0, 1], [0, .1, 34, -.10, -.27, 0, 1], [180, .09, 40, -.06, -.26, 0, 1], [50, .08, 40, -.31, -.44, 0, 1], [180, .05, 18, -.285, -.32], [270, .3, 22, -.585, -.66]];
var B_LEG = [[0, .07, 44, -.06, -.38, 0, 1], [60, .04, 30, -.10, -.36, 0, 1], [180, .06, 46, -.08, -.38, 0, 1], [270, .05, 36, -.02, -.25], [170, .1, 40, .06, -.06], [0, .07, 22, -.40, -.45], [180, .17, 48, -.47, -.66, 0, 1], [10, .03, 14, -.46, -.75], [90, .1, 16, -.81, -.85], [270, .1, 16, -.81, -.85]];
function bump(B, ang, s, mm2) {
 var k = 1, i, b, a, d, lo, hi, bell;
 for (i = 0; i < B.length; i++) {
  b = B[i]; lo = MIN(b[3], b[4]); hi = MAX(b[3], b[4]); if (s <= lo || s >= hi) continue;
  bell = sin(PI * (s - lo) / (hi - lo)); a = b[5] ? abs(ang > 180 ? 360 - ang : ang) : ang; d = abs(a - b[0]); if (d > 180) d = 360 - d;
  k += b[1] * (b[6] ? mm2 : 1) * Math.exp(-(d / b[2]) * (d / b[2])) * bell;
 }
 return k;
}
function buildBody(I) {
 var hs = I.hs, bd = I.bd, N0 = neutral(I.height), Wb = world(I, resolve({ height: I.height, limits: I.limits, warnings: [] }, {})), JI = {}, V = [], F = [], NS = 28;
 JN.forEach((j, i) => { JI[j] = i; });
 var jy = (j) => Wb[j].p[1];
 // حلقة: مركز عالمي، محوران، أنصاف أقطار، دالة نتوء، أوزان [[مفصل، وزن]…]، لون، وسم عضلي
 function ring(C, U, Vv, rx, rz, bfn, wts, colk, tag, flatY) {
  var st = V.length, k, an, a, r, x, z, p;
  for (k = 0; k < NS; k++) {
   an = k * 360 / NS; a = an * D; r = 1 / sqrt(cos(a) * cos(a) / (rz * rz) + sin(a) * sin(a) / (rx * rx)) * bfn(an); x = sin(a) * r; z = cos(a) * r;
   p = [C[0] + U[0] * x + Vv[0] * z, C[1] + U[1] * x + Vv[1] * z, C[2] + U[2] * x + Vv[2] * z];
   if (flatY != null && p[1] < flatY) p[1] = flatY;
   V.push({ p: p, c: C, w: wts, col: colk, tag: tag, ang: an });
  }
  return st;
 }
 function loft(rs, capA, capB) {
  var i, k, a, b;
  for (i = 0; i < rs.length - 1; i++) for (k = 0; k < NS; k++) { a = rs[i] + k; b = rs[i] + (k + 1) % NS; F.push(a, b, rs[i + 1] + k, b, rs[i + 1] + (k + 1) % NS, rs[i + 1] + k); }
  [[capA, rs[0]], [capB, rs[rs.length - 1]]].forEach((q) => { if (!q[0]) return; var c0 = V.length, src = V[q[1]]; V.push({ p: q[0], c: src.c, w: src.w, col: src.col, tag: src.tag, ang: 0, pole: 1 }); for (k = 0; k < NS; k++) F.push(c0, q[1] + k, q[1] + (k + 1) % NS); });
 }
 // ---- الجذع (من أسفل الحوض إلى أعلى الرقبة)
 var SP = ['pelvis', 'spine1', 'spine2', 'chest', 'neck', 'head'], rs = [], i, n = 46, y, y0 = K_TORSO[0][0], y1 = K_TORSO[K_TORSO.length - 1][0], kk, w, rx, t, tag;
 function spineW(yy) { var a = 0; while (a < SP.length - 2 && yy > jy(SP[a + 1])) a++; var f = clamp((yy - jy(SP[a])) / (jy(SP[a + 1]) - jy(SP[a])), 0, 1); return yy <= jy('pelvis') ? [['pelvis', 1]] : [[SP[a], 1 - f], [SP[a + 1], f]]; }
 function torsoTag(yy) { var u = yy / hs; return u < 1.02 ? ['pelvis', (u - .92) / .1] : u < 1.17 ? ['spine1', (u - 1.05) / .12] : u < 1.29 ? ['spine2', (u - 1.17) / .12] : u < 1.435 ? ['chest', (u - 1.29) / .14] : ['neck', (u - 1.42) / .085]; }
 for (i = 0; i <= n; i++) {
  y = y0 + (y1 - y0) * i / n; kk = keyAt(K_TORSO, y); w = smooth(1.0, 1.22, y); rx = kk[1] * (bd.hp * (1 - w) + bd.sh * w);
  rs.push(ring([0, y * hs, kk[4] * hs], [1, 0, 0], [0, 0, 1], rx * hs, kk[2] * hs * (.6 + .4 * bd.m), ((yy) => (an) => bump(B_TORSO, an, yy, bd.m))(y), spineW(y * hs), y < 1.012 ? 's' : 'k', torsoTag(y * hs).concat(0)));
 }
 loft(rs, [0, (y0 - .012) * hs, 0], null);
 // ---- الرأس
 rs = []; n = 20; y0 = K_HEAD[0][0]; y1 = K_HEAD[K_HEAD.length - 1][0];
 for (i = 0; i <= n; i++) { y = y0 + (y1 - y0) * i / n; kk = keyAt(K_HEAD, y); rs.push(ring([0, y * hs, kk[4] * hs], [1, 0, 0], [0, 0, 1], kk[1] * hs, kk[2] * hs, ((yy) => (an) => bump(B_HEAD, an, yy, 1))(y), [['head', 1]], 'h', null)); }
 loft(rs, [0, (y0 - .006) * hs, .03 * hs], [0, (y1 + .004) * hs, -.004 * hs]);
 V.forEach((v) => { if (v.col === 'h') { var u = v.p[1] / hs, back = v.ang > 78 && v.ang < 282; v.col = (u > 1.652 || (back && u > 1.585) || (v.ang > 150 && v.ang < 210 && u > 1.56)) ? 'r' : 'k'; } });
 // ---- الأطراف
 [-1, 1].forEach((sd) => {
  var S = sd < 0 ? 'L' : 'R', sh = Wb['shoulder' + S], hp = Wb['hip' + S], an = Wb['ankle' + S], m = bd.m;
  function limb(K, B, wj, segs, wfn, tagfn, colfn) {
   var r2 = [], a0 = K[0][0], a1 = K[K.length - 1][0], q, s, c, U = mv(wj.R, [sd, 0, 0]), Vz = mv(wj.R, [0, 0, 1]), Kn = K.map((e) => [-e[0], e[1], e[2], e[3], e[4]]);
   for (q = 0; q <= segs; q++) {
    s = a0 + (a1 - a0) * q / segs; kk = keyAt(Kn, -s); c = tf(wj, mul([sd * kk[3], s, kk[4]], hs));
    r2.push(ring(c, U, Vz, kk[1] * hs * (.82 + .18 * m), kk[2] * hs * (.82 + .18 * m), ((ss) => (ang) => bump(B, ang, ss, m))(s), wfn(s), colfn(s), tagfn(s)));
   }
   loft(r2, tf(wj, mul([sd * K[0][3], a0 + (a0 > 0 ? .012 : -.012), K[0][4]], hs)), tf(wj, mul([sd * (K[K.length - 1][3] || 0), a1 - .01, K[K.length - 1][4] || 0], hs)));
  }
  limb(K_ARM, B_ARM, sh, 46, (s) => {
   if (s > -.04) { var a = .4 + .6 * smooth(.052, -.04, s); return [['shoulder' + S, a], ['chest', 1 - a]]; }
   if (s > -.345) { var f = smooth(-.255, -.345, s); return [['shoulder' + S, 1 - f], ['elbow' + S, f]]; }
   var g = smooth(-.535, -.585, s); return [['elbow' + S, 1 - g], ['wrist' + S, g]];
  }, (s) => s > -.30 ? ['arm', -s / .30, sd] : s > -.56 ? ['fore', (-s - .30) / .26, sd] : ['hand', 0, sd], () => 'k');
  limb(K_LEG, B_LEG, hp, 50, (s) => {
   if (s > -.08) { var a = .45 + .55 * smooth(.078, -.08, s); return [['hip' + S, a], ['pelvis', 1 - a]]; }
   if (s > -.47) { var f = smooth(-.37, -.47, s); return [['hip' + S, 1 - f], ['knee' + S, f]]; }
   var g = smooth(-.80, -.86, s); return [['knee' + S, 1 - g], ['ankle' + S, g]];
  }, (s) => s > -.42 ? ['thigh', -s / .42, sd] : ['shin', (-s - .42) / .41, sd], (s) => s > -.17 ? 's' : 'k');
  // القدم: حلقات عمودية على محور الأمام، بنعل مسطّح
  var r3 = [], q, z, U = mv(an.R, [sd, 0, 0]), Uy = mv(an.R, [0, 1, 0]), solY = null;
  for (q = 0; q <= 16; q++) {
   z = K_FOOT[0][0] + (K_FOOT[K_FOOT.length - 1][0] - K_FOOT[0][0]) * q / 16; kk = keyAt(K_FOOT, z);
   var g2 = smooth(.105, .155, z), c2 = tf(an, mul([0, kk[4], z], hs)), st = V.length;
   r3.push(ring(c2, U, Uy, kk[1] * hs, kk[2] * hs, () => 1, [['ankle' + S, 1 - g2], ['toe' + S, g2]], 'k', null));
   for (var e = st; e < V.length; e++) { var loc = mv([an.R[0], an.R[3], an.R[6], an.R[1], an.R[4], an.R[7], an.R[2], an.R[5], an.R[8]], sub(V[e].p, an.p)); if (loc[1] < -.0785 * hs) { loc[1] = -.0785 * hs; V[e].p = tf(an, loc); } }
  }
  loft(r3, tf(an, mul([0, -.052, -.07], hs)), tf(an, mul([0, -.073, .21], hs)));
 });
 // ---- الأعمدة: مواضع محلية لكل مفصل + ناظمات + ألوان + أوسمة العضلات
 var nV = V.length, M = { n: nV, j1: new Uint8Array(nV), j2: new Uint8Array(nV), w1: new Float32Array(nV), l1: new Float32Array(nV * 3), l2: new Float32Array(nV * 3), n1: new Float32Array(nV * 3), n2: new Float32Array(nV * 3), ck: [], mus: [], idx: new Uint16Array(F), hw: new Float32Array(nV) };
 var NR = new Float32Array(nV * 3), a, b, c, e1, e2, nn, T = (R) => [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
 for (i = 0; i < F.length; i += 3) { a = V[F[i]].p; b = V[F[i + 1]].p; c = V[F[i + 2]].p; e1 = sub(b, a); e2 = sub(c, a); nn = crs(e1, e2); [F[i], F[i + 1], F[i + 2]].forEach((q) => { NR[q * 3] += nn[0]; NR[q * 3 + 1] += nn[1]; NR[q * 3 + 2] += nn[2]; }); }
 V.forEach((v, q) => {
  var nq = nrm([NR[q * 3], NR[q * 3 + 1], NR[q * 3 + 2]]), out = sub(v.p, v.c); if (dot(nq, out) < 0) nq = mul(nq, -1);
  var w0 = v.w[0], w1 = v.w[1] || v.w[0], A = Wb[w0[0]], B2 = Wb[w1[0]], la = mv(T(A.R), sub(v.p, A.p)), lb = mv(T(B2.R), sub(v.p, B2.p)), na = mv(T(A.R), nq), nb = mv(T(B2.R), nq);
  M.j1[q] = JI[w0[0]]; M.j2[q] = JI[w1[0]]; M.w1[q] = v.w[1] ? w0[1] : 1;
  M.l1.set(la, q * 3); M.l2.set(lb, q * 3); M.n1.set(na, q * 3); M.n2.set(nb, q * 3); M.ck.push(v.col);
  // أوسمة العضلات من جدول MUS نفسه (اسم|جزء|زاوية|نصف العرض|بداية|نهاية)
  var ms = [];
  if (v.tag) MUS.forEach((s) => {
   var f = s.split('|'), star = f[0].slice(-1) === '*', nm = star ? f[0].slice(0, -1) : f[0], part = f[1].replace('*', ''), t0 = +f[4], t1 = +f[5], ang = +f[2], half = +f[3];
   var vp = v.tag[0], tt = v.tag[1], sdv = v.tag[2];
   if (part === 'clav') { if (vp !== 'chest' || tt < .78) return; vp = 'clav'; tt = .5; }
   if (vp !== part) return;
   var an2 = v.ang, sideName = '';
   if (sdv) sideName = sdv < 0 ? 'L' : 'R'; else if (star) { sideName = (an2 > 180) ? 'L' : 'R'; an2 = an2 > 180 ? 360 - an2 : an2; }
   var dA = abs(an2 - ang); if (dA > 180) dA = 360 - dA;
   var sa = half >= 170 ? 1 : 1 - smooth(half * .55, half * 1.15, dA), stt = smooth(t0 - .1, t0 + .1, tt) * (1 - smooth(t1 - .1, t1 + .1, tt)), sv = sa * stt;
   if (sv > .02) ms.push([nm + (star ? sideName : ''), sv]);
  });
  M.mus.push(ms);
 });
 return M;
}
function hlWeights(I) {
 var M = I.mesh, q, i, v, ms; if (!M) return;
 for (q = 0; q < M.n; q++) { v = 0; ms = M.mus[q]; for (i = 0; i < ms.length; i++) if (I.hl[ms[i][0]]) v = MAX(v, ms[i][1]); M.hw[q] = v; }
 I.hlDirty = false;
}
function c3(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
function renderGL(I, time) {
 var gl = I.gl, col = I.col, hs = I.hs, W = world(I, I.cur); ik(I, W); I.W = W;
 if (!I.mesh) { I.mesh = buildBody(I); I.hlDirty = true; } if (I.hlDirty) hlWeights(I);
 var M = I.mesh, VA = I.VA, IA = I.IA, nv = 0, ni = 0, q, o, c = camOf(I), Lw = nrm(add(add(mul(c.r, -.45), mul(c.u, .7)), mul(c.f, -.55)));
 var CK = { k: c3(col.body), s: c3(SHORTS.body), r: c3(col.hair), h: c3(col.body) }, Rs = [], Ps = [], j;
 for (j = 0; j < JN.length; j++) { Rs.push(W[JN[j]].R); Ps.push(W[JN[j]].p); }
 for (q = 0; q < M.n; q++) {
  var a = M.j1[q], b = M.j2[q], w = M.w1[q], u = 1 - w, Ra = Rs[a], Rb = Rs[b], pa = Ps[a], pb = Ps[b], x = M.l1[q * 3], y = M.l1[q * 3 + 1], z = M.l1[q * 3 + 2], x2 = M.l2[q * 3], y2 = M.l2[q * 3 + 1], z2 = M.l2[q * 3 + 2], ck = CK[M.ck[q]];
  o = q * 10;
  VA[o] = w * (Ra[0] * x + Ra[1] * y + Ra[2] * z + pa[0]) + u * (Rb[0] * x2 + Rb[1] * y2 + Rb[2] * z2 + pb[0]);
  VA[o + 1] = w * (Ra[3] * x + Ra[4] * y + Ra[5] * z + pa[1]) + u * (Rb[3] * x2 + Rb[4] * y2 + Rb[5] * z2 + pb[1]);
  VA[o + 2] = w * (Ra[6] * x + Ra[7] * y + Ra[8] * z + pa[2]) + u * (Rb[6] * x2 + Rb[7] * y2 + Rb[8] * z2 + pb[2]);
  x = M.n1[q * 3]; y = M.n1[q * 3 + 1]; z = M.n1[q * 3 + 2]; x2 = M.n2[q * 3]; y2 = M.n2[q * 3 + 1]; z2 = M.n2[q * 3 + 2];
  VA[o + 3] = w * (Ra[0] * x + Ra[1] * y + Ra[2] * z) + u * (Rb[0] * x2 + Rb[1] * y2 + Rb[2] * z2);
  VA[o + 4] = w * (Ra[3] * x + Ra[4] * y + Ra[5] * z) + u * (Rb[3] * x2 + Rb[4] * y2 + Rb[5] * z2);
  VA[o + 5] = w * (Ra[6] * x + Ra[7] * y + Ra[8] * z) + u * (Rb[6] * x2 + Rb[7] * y2 + Rb[8] * z2);
  VA[o + 6] = ck[0]; VA[o + 7] = ck[1]; VA[o + 8] = ck[2]; VA[o + 9] = M.hw[q];
 }
 nv = M.n; IA.set(M.idx, 0); ni = M.idx.length; I.bodyN = ni;
 // ---- الأجهزة: نجمع الأشكال الأولية من نفس دوال 2.0 ثم نحوّلها إلى مثلثات
 function vtx(p, n, cl) { o = nv * 10; VA[o] = p[0]; VA[o + 1] = p[1]; VA[o + 2] = p[2]; VA[o + 3] = n[0]; VA[o + 4] = n[1]; VA[o + 5] = n[2]; VA[o + 6] = cl[0]; VA[o + 7] = cl[1]; VA[o + 8] = cl[2]; VA[o + 9] = -1; return nv++; }
 function quad(p0, p1, p2, p3, n, cl) { var a0 = vtx(p0, n, cl), a1 = vtx(p1, n, cl), a2 = vtx(p2, n, cl), a3 = vtx(p3, n, cl); IA[ni++] = a0; IA[ni++] = a1; IA[ni++] = a2; IA[ni++] = a0; IA[ni++] = a2; IA[ni++] = a3; }
 function cyl(A, B, rA, rB, cl, caps) {
  var d = sub(B, A), L = sqrt(dot(d, d)) || 1e-6, ax = mul(d, 1 / L), up = abs(ax[1]) > .9 ? [1, 0, 0] : [0, 1, 0], u2 = nrm(crs(ax, up)), v2 = crs(ax, u2), NS2 = 14, k, st = nv, an, dr;
  for (k = 0; k < NS2; k++) { an = k * 2 * PI / NS2; dr = add(mul(u2, cos(an)), mul(v2, sin(an))); vtx(add(A, mul(dr, rA)), dr, cl); vtx(add(B, mul(dr, rB)), dr, cl); }
  for (k = 0; k < NS2; k++) { var k2 = (k + 1) % NS2; IA[ni++] = st + k * 2; IA[ni++] = st + k2 * 2; IA[ni++] = st + k * 2 + 1; IA[ni++] = st + k2 * 2; IA[ni++] = st + k2 * 2 + 1; IA[ni++] = st + k * 2 + 1; }
  if (caps !== false) [[A, rA, -1], [B, rB, 1]].forEach((e) => { var nn2 = mul(ax, e[2]), c0 = vtx(e[0], nn2, cl), s2 = nv; for (k = 0; k < NS2; k++) { an = k * 2 * PI / NS2; vtx(add(e[0], mul(add(mul(u2, cos(an)), mul(v2, sin(an))), e[1])), nn2, cl); } for (k = 0; k < NS2; k++) { IA[ni++] = c0; IA[ni++] = s2 + k; IA[ni++] = s2 + (k + 1) % NS2; } });
 }
 GLQ = []; addProps(I, c, Lw, [], W); var Q = GLQ; GLQ = null; I.floorR = 0;
 Q.forEach((g) => {
  var cl = c3(g.pal.body);
  if (g.k === 'box') { var AX = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], hh = [g.s[0] / 2, g.s[1] / 2, g.s[2] / 2], a2, sg; for (a2 = 0; a2 < 3; a2++) for (sg = -1; sg <= 1; sg += 2) { var b1 = (a2 + 1) % 3, b2 = (a2 + 2) % 3, nw = mv(g.R, mul(AX[a2], sg)), cr2 = (s0, s1) => add(g.c, mv(g.R, add(mul(AX[a2], sg * hh[a2]), add(mul(AX[b1], s0 * hh[b1]), mul(AX[b2], s1 * hh[b2]))))); quad(cr2(1, 1), cr2(1, -1), cr2(-1, -1), cr2(-1, 1), nw, cl); } }
  else if (g.k === 'cap') cyl(g.a, g.b, MAX(g.ra, .003), MAX(g.rb, .003), cl);
  else if (g.k === 'disc') { cyl(sub(g.c, mul(g.ax, g.th / 2)), add(g.c, mul(g.ax, g.th / 2)), g.R, g.R, cl); if (g.hub !== false) cyl(sub(g.c, mul(g.ax, g.th / 2 + .004)), add(g.c, mul(g.ax, g.th / 2 + .004)), g.R * .22, g.R * .22, c3(g.pal.lo)); }
  else if (g.k === 'floor') I.floorR = g.r;
 });
 // ---- المصفوفات والرسم
 var n = .08, f = 60, sx = c.S / (I.w / 2), sy = c.S / (I.h / 2), A2 = (f + n) / (f - n), B3 = -2 * f * n / (f - n), r = c.r, uu = c.u, ff = c.f, ps = c.pos, tr = -dot(r, ps), tu = -dot(uu, ps), tfv = -dot(ff, ps);
 var MVP = [sx * r[0], sy * uu[0], A2 * ff[0], ff[0], sx * r[1], sy * uu[1], A2 * ff[1], ff[1], sx * r[2], sy * uu[2], A2 * ff[2], ff[2], sx * tr, sy * tu, A2 * tfv + B3, tfv];
 var Ls = nrm([.28, 1, .2]), kx = -Ls[0] / Ls[1], kz = -Ls[2] / Ls[1], SH = [1, 0, 0, 0, kx, 0, kz, 0, 0, 0, 1, 0, 0, .003, 0, 1], MS = [], ii, jj, kq, sm;
 for (ii = 0; ii < 4; ii++) for (jj = 0; jj < 4; jj++) { sm = 0; for (kq = 0; kq < 4; kq++) sm += MVP[kq * 4 + jj] * SH[ii * 4 + kq]; MS[ii * 4 + jj] = sm; }
 gl.viewport(0, 0, I.cv.width, I.cv.height); gl.clearColor(col.bg[0] / 255 * col.bg[3], col.bg[1] / 255 * col.bg[3], col.bg[2] / 255 * col.bg[3], col.bg[3]); gl.clearStencil(0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
 gl.useProgram(I.pg); gl.bindBuffer(gl.ARRAY_BUFFER, I.vb);
 // الأرضية: حلقات متدرجة الشفافية
 var fl0 = nv, fi0 = ni, FR = I.floorR, fc = c3(col.floor);
 if (FR) { var fcen = vtx([0, 0, 0], [0, 1, 0], fc), fk; for (fk = 0; fk < 40; fk++) vtx([FR * cos(fk * PI / 20), 0, FR * sin(fk * PI / 20)], [0, 1, 0], fc); for (fk = 0; fk < 40; fk++) { IA[ni++] = fcen; IA[ni++] = fl0 + 1 + fk; IA[ni++] = fl0 + 1 + (fk + 1) % 40; } }
 gl.bufferData(gl.ARRAY_BUFFER, VA.subarray(0, nv * 10), gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, I.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, IA.subarray(0, ni), gl.DYNAMIC_DRAW);
 var L = I.loc; [['aP', 3, 0], ['aN', 3, 12], ['aC', 3, 24], ['aH', 1, 36]].forEach((e) => { gl.enableVertexAttribArray(L[e[0]]); gl.vertexAttribPointer(L[e[0]], e[1], gl.FLOAT, false, 40, e[2]); });
 gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
 gl.uniform1f(L.uSh, 1);
 if (FR) { gl.uniformMatrix4fv(L.uM, false, new Float32Array(MVP)); gl.uniform3fv(L.uG, fc); gl.uniform1f(L.uA, .075); var sc = [1, .92, .84, .76, .68, .6, .52, .44, .36, .28, .2]; sc.forEach((s) => { var Sm = MVP.slice(); for (ii = 0; ii < 4; ii++) { Sm[ii] *= s; Sm[8 + ii] *= s; } gl.uniformMatrix4fv(L.uM, false, new Float32Array(Sm)); gl.drawElements(gl.TRIANGLES, ni - fi0, gl.UNSIGNED_SHORT, fi0 * 2); }); }
 // الظل: الجسد والأجهزة مسقطة على الأرض مرة واحدة لكل بكسل (stencil)
 gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.EQUAL, 0, 255); gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
 gl.uniformMatrix4fv(L.uM, false, new Float32Array(MS)); gl.uniform3fv(L.uG, c3(col.shadow)); gl.uniform1f(L.uA, .2); gl.drawElements(gl.TRIANGLES, fi0, gl.UNSIGNED_SHORT, 0);
 gl.disable(gl.STENCIL_TEST); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
 gl.uniform1f(L.uSh, 0); gl.uniformMatrix4fv(L.uM, false, new Float32Array(MVP)); gl.uniform3fv(L.uL, Lw); gl.uniform3fv(L.uE, c.pos); gl.uniform3fv(L.uG, c3(col.glow));
 gl.uniform3fv(L.uSky, c3(mixc(col.hi, [255, 255, 255, 1], .35))); gl.uniform3fv(L.uGnd, c3(mixc(col.lo, col.floor, .4))); gl.uniform1f(L.uP, I.hasPulse && !I.rm ? .5 + .5 * sin(time * 7.5) : .6);
 gl.drawElements(gl.TRIANGLES, fi0, gl.UNSIGNED_SHORT, 0);
 I.nItems = ni / 3; I.lastC = c;
}
function tapGL(I, x, y) { // أقرب رأس مضاء (عضلة مستهدفة) إلى موضع اللمس
 var M = I.mesh, c = I.lastC, best = 28 * 28, name = null, q, p, d, i, ms, VA = I.VA; if (!M || !c) return null;
 for (q = 0; q < M.n; q++) { if (M.hw[q] < .35) continue; p = P(c, [VA[q * 10], VA[q * 10 + 1], VA[q * 10 + 2]]); if (VA[q * 10 + 3] * (c.pos[0] - VA[q * 10]) + VA[q * 10 + 4] * (c.pos[1] - VA[q * 10 + 1]) + VA[q * 10 + 5] * (c.pos[2] - VA[q * 10 + 2]) < 0) continue;
  d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (d < best) { ms = M.mus[q]; for (i = 0; i < ms.length; i++) if (I.hl[ms[i][0]] && ms[i][1] >= .35) { best = d; name = ms[i][0]; break; } } }
 return name;
}

var GLOPT = { antialias: true, stencil: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true };
function create(cv, o) {
 o = o || {};
 var host = cv.parentNode, gl3 = (o.renderer === '2d' || !cv.getContext) ? null : (cv.getContext('webgl', GLOPT) || cv.getContext('experimental-webgl', GLOPT)), ctx = gl3 || (cv.getContext && cv.getContext('2d')), mq = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)');
 var I = { cv: cv, ctx: ctx, height: +o.height || 170, buildName: BUILD[o.build] ? o.build : 'medium', limits: JSON.parse(JSON.stringify(RIG.limits)),
  warnings: [], props: [{ type: 'floor' }], hl: {}, hits: [], ev: {}, speed: 1, t: 0, reps: 0, playing: false, anim: null, alive: true, vis: true, state: 'loading',
  pinFeet: o.pinFeet ? (o.pinFeet === true ? {} : o.pinFeet) : null, pinHands: !!o.pinHands, dbg: false, raf: 0, last: 0, fc: 0, w: 1, h: 1, dpr: 1,
  cam: { yaw: 0, pitch: 8, dist: 3.2, target: [0, .9, 0], tyaw: 0, tpitch: 8, tdist: 3.2, zoom: 1, orbit: o.orbit !== false },
  rm: !!(mq && mq.matches), partial: {}, rig: {}, hasPulse: false }, dom = [], cleanup = [], m = {}, tools = null, tipEl, statusEl, stepsEl, ppBtn, slowBtn;
 if (gl3) { I.gl = gl3; I.ctx = null; if (!glInit(I)) { I.gl = null; ctx = null; } }
 function rebuild() {
  I.mesh = null;
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
  if (I.gl) { var nm3 = tapGL(I, x, y); h = nm3 ? { name: nm3 } : null; } else for (i = I.hits.length - 1; i >= 0; i--) if (inPoly(I.hits[i].poly, x, y)) { h = I.hits[i]; break; }
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
   I.hl = {}; I.hlDirty = true; var list = expandMus(typeof names === 'string' ? [names] : names); I.hasPulse = false;
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
G.Mannequin = { create: create, RIG: RIG, neutral: neutral(170), debug: false, version: 3 };
})(window);
