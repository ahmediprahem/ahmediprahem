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
