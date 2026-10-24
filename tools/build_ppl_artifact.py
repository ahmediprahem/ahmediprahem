# -*- coding: utf-8 -*-
"""يبني صفحة مجسّم التمارين (Artifact) من القالب + mannequin.js + برنامج PPL + الأوضاع: py tools/build_ppl_artifact.py [out.html]"""
import json, os, sys
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); K = os.path.join(H, 'design/training_kit')
rd = lambda p: open(os.path.join(K, p), encoding='utf8').read()
prog = json.loads(rd('program/ppl_program.json'))
for d in prog['days']:
    for e in d['exercises']: e.pop('poses', None)
poses = json.loads(rd('program/poses_gen.json'))
js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
t = rd('program/ppl_artifact.template.html').replace('/*MQ*/', rd('delivery/mannequin/mannequin2.js').replace('</script', '<\\/script')).replace('/*MQCSS*/', rd('delivery/mannequin/mannequin2.css')).replace('/*EQUIP*/null', js(json.loads(rd('program/equip.json')))).replace('/*PROG*/null', js(prog)).replace('/*POSES*/null', js(poses))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(H, 'review/ppl_mannequin_demo.html')
open(out, 'w', encoding='utf8').write(t); print(out, round(len(t.encode('utf8')) / 1024), 'KB')
