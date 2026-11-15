# استيراد مكتبة الأنظمة الجديدة (hessa-plans: 30 نظاماً × مصر والسعودية × مستويات سعرات) إلى src/plib/
# التشغيل: python3 tools/import_hessa_plans.py <مجلد hessa-plans أو ملف zip>
# المخرجات: src/plib/index.json (الأنظمة والأنواع والمستويات والماكروز) + src/plib/plans.json.gz (الأيام والوجبات)
import json, gzip, os, sys, zipfile, io

H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]

def opener():
    if src.endswith('.zip'):
        z = zipfile.ZipFile(src)
        names = z.namelist()
        root = [n for n in names if n.endswith('data/types.json')][0][:-len('types.json')]
        return (lambda p: json.loads(z.read(root + p).decode('utf8'))), (lambda d: sorted(n[len(root):] for n in names if n.startswith(root + d) and n.endswith('.json')))
    root = os.path.join(src, 'data') + '/'
    return (lambda p: json.load(open(root + p, encoding='utf8'))), (lambda d: sorted(os.path.relpath(os.path.join(dp, f), root) for dp, _, fs in os.walk(root + d) for f in fs if f.endswith('.json')))

rd, ls = opener()
types = rd('types.json'); cat = rd('catalog.json')
meta = {p['id']: p for p in cat['plans']}
plans = {}
for f in ls('plans/'):
    plans.update(rd(f))

GOAL = {'loss': 'lose', 'maint': 'maintain', 'gain': 'gain', 'kids': 'kids', 'teen': 'teen', 'athcut': 'cut', 'bulk': 'bulk'}
libs = {}
for cc, L in types.items():
    for k, l in L.items():
        e = libs.setdefault(str(l['lib']), {'n': l['name'], 'goal': GOAL.get(l['goal'], l['goal']), 'm': 'g' if l['method'] == 'grams' else 'ex', 'cc': {}})
        vs = []
        for v in l['variants']:
            lv = []
            for x in v['levels']:
                m = meta.get(x['id'], {})
                lv.append([x['level'], x['kcal'], x['id'], m.get('protein', 0), m.get('carbs', 0), m.get('fat', 0), m.get('mealsPerDay', 0), m.get('sex') or '', m.get('age') or '', m.get('activity') or '', m.get('economy', 0), m.get('week') or ''])
            vs.append([v['variant'], v['name'], lv])
        e['cc'][cc] = vs

out = {}
for pid, p in plans.items():
    out[pid] = [p['title'], [[d['title'], d['kcal'], [[m['label'], m['items'], m.get('groups') or {}, m.get('macros') or {}, m.get('time', '')] for m in d['meals']]] for d in p['days']]]

os.makedirs(os.path.join(H, 'src', 'plib'), exist_ok=True)
idx = {'v': cat.get('version', ''), 'count': len(out), 'libs': libs}
json.dump(idx, open(os.path.join(H, 'src', 'plib', 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
raw = json.dumps(out, ensure_ascii=False, separators=(',', ':')).encode('utf8')
open(os.path.join(H, 'src', 'plib', 'plans.json.gz'), 'wb').write(gzip.compress(raw, 9, mtime=0))
print('libs', len(libs), 'plans', len(out), 'index', len(json.dumps(idx, ensure_ascii=False)) // 1024, 'KB', 'gz', os.path.getsize(os.path.join(H, 'src', 'plib', 'plans.json.gz')) // 1024, 'KB')
