# -*- coding: utf-8 -*-
"""يبني mannequin3.js = هيكل وأوضاع وأجهزة mannequin2.js + عرض WebGL بجسد تشريحي (mq3_gl.js). py tools/build_mq3.py"""
import os
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); K = os.path.join(H, 'design/training_kit/delivery/mannequin')
s = open(os.path.join(K, 'mannequin2.js'), encoding='utf8').read(); g = open(os.path.join(K, 'mq3_gl.js'), encoding='utf8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) >= 1, a[:70]
    s = s.replace(a, b, n)
rep('/*! Mannequin 2.0', '/*! Mannequin 3.0 (hx-mq3): جسد تشريحي بشبكة مجلّدة وعرض WebGL بلا مكتبات، مع بديل Canvas-2D (2.0) عند غياب WebGL. Mannequin 2.0')
rep("function boxItems(I, c, Lw, items, cen, sz, ry, d0, pal) {\n", "function boxItems(I, c, Lw, items, cen, sz, ry, d0, pal) {\n if (GLQ) { GLQ.push({ k: 'box', c: cen, s: sz, R: RY((ry || 0) * D), pal: pal }); return; }\n")
rep("function capItem(I, c, items, A, B, rA, rB, pal, d0) {\n", "function capItem(I, c, items, A, B, rA, rB, pal, d0) {\n if (GLQ) { GLQ.push({ k: 'cap', a: A, b: B, ra: rA, rb: rB, pal: pal }); return; }\n")
rep("function oboxItem(I, c, Lw, items, ctr, size, Rm, pal, d0, bev) {\n", "function oboxItem(I, c, Lw, items, ctr, size, Rm, pal, d0, bev) {\n if (GLQ) { GLQ.push({ k: 'box', c: ctr, s: size, R: Rm, pal: pal }); return; }\n")
rep("function discItem(I, c, Lw, items, ctr, ax, R, th, pal, d0, hub) {\n", "function discItem(I, c, Lw, items, ctr, ax, R, th, pal, d0, hub) {\n if (GLQ) { GLQ.push({ k: 'disc', c: ctr, ax: ax, R: R, th: th, pal: pal, hub: hub }); return; }\n")
rep("   case 'floor': {\n", "   case 'floor': {\n    if (GLQ) { GLQ.push({ k: 'floor', r: p.r || .75, pal: pal }); break; }\n")
rep("   case 'wall': {\n", "   case 'wall': {\n    if (GLQ) { GLQ.push({ k: 'box', c: [0, 1.25, (p.pos ? pos[2] : -.7) - .02], s: [2.8, 2.5, .03], R: RY(0), pal: { body: mixc(pal.body, I.col.floor, .5), lo: pal.lo } }); break; }\n")
rep("  else if (q.k === 'cable') { ", "  else if (q.k === 'cable') { if (GLQ) { GLQ.push({ k: 'cap', a: endPt(I, W, q.a), b: endPt(I, W, q.b), ra: .004, rb: .004, pal: matPal(I, 'metal') }); return; } ")
rep("function render(I, time) {\n", "function render(I, time) {\n if (I.gl) return renderGL(I, time);\n")
rep("function create(cv, o) {", g + "\nfunction create(cv, o) {")
rep("var host = cv.parentNode, ctx = cv.getContext && cv.getContext('2d'),", "var host = cv.parentNode, gl3 = (o.renderer === '2d' || !cv.getContext) ? null : (cv.getContext('webgl', GLOPT) || cv.getContext('experimental-webgl', GLOPT)), ctx = gl3 || (cv.getContext && cv.getContext('2d')),")
rep("function create(cv, o) {\n o = o || {};", "var GLOPT = { antialias: true, stencil: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true };\nfunction create(cv, o) {\n o = o || {};")
rep(" function rebuild() {\n", " if (gl3) { I.gl = gl3; I.ctx = null; if (!glInit(I)) { I.gl = null; ctx = null; } }\n function rebuild() {\n  I.mesh = null;\n")
rep("   I.hl = {}; var list", "   I.hl = {}; I.hlDirty = true; var list")
rep("  for (i = I.hits.length - 1; i >= 0; i--) if (inPoly(I.hits[i].poly, x, y)) { h = I.hits[i]; break; }", "  if (I.gl) { var nm3 = tapGL(I, x, y); h = nm3 ? { name: nm3 } : null; } else for (i = I.hits.length - 1; i >= 0; i--) if (inPoly(I.hits[i].poly, x, y)) { h = I.hits[i]; break; }")
rep("G.Mannequin = { create: create, RIG: RIG, neutral: neutral(170), debug: false };", "G.Mannequin = { create: create, RIG: RIG, neutral: neutral(170), debug: false, version: 3 };")
open(os.path.join(K, 'mannequin3.js'), 'w', encoding='utf8').write(s); print('mannequin3.js', len(s.encode('utf8')) // 1024, 'KB')
