import json,sys
F=json.load(open('sr.json'))
def s(q, n=3, ex=()):
    t=[w.lower() for w in q.split('|')]
    r=[f for f in F.values() if all(w in f['d'].lower() for w in t) and not any(e in f['d'].lower() for e in ex)]
    r.sort(key=lambda f: len(f['d']))
    return r[:n]
Q=[l.strip() for l in open(sys.argv[1]) if l.strip()]
for line in Q:
    ar,q=line.split('=',1)
    for f in s(q): print(ar,'|',f['id'],f['d'][:95],'| k',f.get('k'),'c',f.get('c'),'p',f.get('p'),'f',f.get('f'))
    if not s(q): print(ar,'| ???',q)
