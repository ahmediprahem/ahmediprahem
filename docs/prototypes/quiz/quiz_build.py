import json, os
import os
SP = os.path.dirname(os.path.abspath(__file__))
H = os.path.abspath(os.path.join(SP, '../../..'))
tpl = open(SP + '/quiz_tpl2.html', encoding='utf8').read()
data = json.load(open(H + '/src/data.json', encoding='utf8'))
for k in ('instr', 'tips', 'phrases'):
    pass
dj = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
eng = open(H + '/src/engine.js', encoding='utf8').read()
assert '</script' not in eng
fx = open(SP + '/fixcaps.js', encoding='utf8').read()
out = tpl.replace('/*DATA_JSON*/', dj).replace('/*ENGINE_JS*/', eng).replace('/*FIXCAPS_JS*/', fx)
open(SP + '/quiz.html', 'w', encoding='utf8').write(out)
print(len(out) // 1024, 'KB')
