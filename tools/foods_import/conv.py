import json, re, difflib, sys
sys.path.insert(0, '.')
from cur import L
R = '/home/user/ahmediprahem/src/'
D = json.load(open(R + 'data.json')); A = json.load(open(R + 'athlete.json')); SR = json.load(open('sr.json'))
EX, G = D['EX'], D['groups']
ANAME = {f['n']: f for f in A['foods']}
UA = {'cup': ('كوب', 'أكواب'), 'tbsp': ('ملعقة كبيرة', 'ملاعق كبيرة'), 'tsp': ('ملعقة صغيرة', 'ملاعق صغيرة'), 'slice': ('شريحة', 'شرائح'), 'piece': ('حبة', 'حبات'), 'g': ('جم', 'جم')}
KW = {'cup': [r'\bcup', r'كوب'], 'tbsp': [r'\btbsp', r'tablespoon'], 'tsp': [r'\btsp', r'teaspoon'], 'slice': [r'\bslice'],
      'piece': [r'\bmedium\b', r'\blarge\b', r'\bsmall\b', r'\bfruit\b', r'\bpiece', r'\beach\b', r'\bnut\b', r'\bkernel', r'\btortilla', r'\bcracker', r'\begg\b', r'\bleaf\b', r'\bpepper\b', r'\bpatty', r'\bdate\b', r'\bclove\b', r'\bpod\b', r'\bberr', r'\bquince\b', r'\blitchi', r'\bloquat', r'\bpersimmon', r'\bfig\b', r'قرص', r'قطعة', r'\bfillet']}

def portions(item, src):
    out = []
    if src.startswith('U:'):
        for amt, unit, mod, gw in SR[src[2:]].get('por', []):
            if amt > 0 and gw > 0: out.append(((unit + ' ' + mod).strip().lower(), gw / amt))
    else:
        for part in (ANAME[src[2:]].get('ms') or '').split('|'):
            m = re.match(r'\s*([\d.]+)\s+(.+?)\s*=\s*([\d.]+)', part)
            if m: out.append((m.group(2).lower(), float(m.group(3)) / float(m.group(1))))
    return out

def kern(t, gw):
    m = re.search(r'\((\d+)(?:-(\d+))?\s*(?:whole\s+)?kernels?\)', t)
    return gw / ((int(m.group(1)) + int(m.group(2) or m.group(1))) / 2) if m else None
def pick(por, pref):
    for t, gw in por:
        if pref == 'piece' and kern(t, gw): return 'piece', kern(t, gw), t
    if pref == 'g': return 'g', 1.0, 'جرام'
    for p in [pref] + [x for x in ('piece', 'slice', 'cup', 'tbsp', 'tsp') if x != pref]:
        c = [(t, gw) for t, gw in por if any(re.search(k, t) for k in KW[p]) and not re.search(r'chopped|diced|sliced|mashed|pieces|grated|shredded|crumbled|melted|packed|cubes|pureed', t)]
        if not c: c = [(t, gw) for t, gw in por if any(re.search(k, t) for k in KW[p])]
        if c:
            c.sort(key=lambda x: len(x[0])); return p, c[0][1], c[0][0]
    return 'g', 1.0, 'جرام (لا مقياس منزلي في المصدر)'

def norm(s): return re.sub(r'\s*\(.*?\)|\b(مطبوخ|مطبوخة|نيء|نيئة|مسلوق|مسلوقة|مشوي|مشوية|جاف|طازج)\b|ال', '', s).strip()
EXIST = [(f['n'], 'الحصص') for f in D['foods']]

def grade(kind, fe):
    if kind == 'pr': return 2 if fe <= 1.5 else 3 if fe <= 4 else 4 if fe <= 6.5 else 5
    if kind == 'mk': return 6 if fe <= 3.5 else 7 if fe <= 6.5 else 8
NOTDUP = {'فاصوليا حمراء (كيدني) مسلوقة', 'أرز بري مطبوخ', 'فاصوليا ليما مطبوخة', 'لحم ضأن مفروم مطبوخ', 'جبنة كريمية', 'زبادي يوناني كامل الدسم'}
rows = []
for ar, src, kind, r, cz, ck, pref in L:
    if src.startswith('U:'):
        s = SR[src[2:]]; n = {k: s.get(k, 0) for k in ('k', 'c', 'p', 'f', 'fi', 'su', 'na')}; ref = 'USDA SR Legacy #' + src[2:] + ' — ' + s['d']
    else:
        a = ANAME[src[2:]]; n = {k: a.get(k, 0) or 0 for k in ('k', 'c', 'p', 'f', 'fi', 'su', 'na')}; ref = 'نظام الجرامات' + (' — ' + a['src'] if a.get('src') else ' (USDA)')
    n['nc'] = max(0, n['c'] - (n['fi'] or 0))
    if kind == 'lg': anc, g = ('nc', 15), 1      # ADA: البقوليات والحبوب عالية الألياف بالكارب الصافي
    elif kind in ('st', 'fr', 'oc'): anc, g = ('c', 15), {'st': 0, 'fr': 10, 'oc': 12}[kind]
    elif kind == 'vg': anc, g = ('c', 5), 9
    elif kind == 'ft': anc, g = ('f', 5), 11
    elif kind == 'pr': anc, g = ('p', 7), None
    else: anc, g = ('p', 8), None
    gpe = anc[1] / n[anc[0]] * 100 if n[anc[0]] else 0
    m = {k: n[k] * gpe / 100 for k in n}
    if g is None: g = grade(kind, m['f'])
    X = EX[g]; dev = (m['k'] - X[3]) / X[3] if gpe else 9
    note = []
    if abs(dev) <= 0.20: st = 'مقبول'
    elif kind in ('st', 'fr') and m['p'] < X[1] and abs((m['k'] + 4 * (X[1] - m['p']) - X[3]) / X[3]) <= 0.20: st = 'مقبول'; note.append('البروتين أقل من الحصة القياسية (%.1f جم)؛ الكارب مطابق' % m['p'])
    else:
        extraF = m['f'] - X[2]; extraC = m['c'] - X[0]
        if kind in ('st', 'lg', 'oc', 'fr') and extraF >= 2.5: st = 'مركّب'; note.append('+ %.1f حصة دهون' % (extraF / 5))
        elif kind == 'pr' and extraC >= 4: st = 'مركّب'; note.append('+ %.1f حصة نشويات' % (extraC / 15))
        elif kind == 'lg' and m['p'] > 12: st = 'مركّب'; note.append('بروتين أعلى من البقوليات (أقرب لحصة لحم + نشويات)')
        else: st = 'مراجعة'
    if kind == 'vg' and gpe > 400: st = 'مراجعة'; note.append('سعرات قليلة جداً: يُعامل كخضار حرة؟')
    if kind == 'vg' and gpe < 20: note.append('كمية الحصة صغيرة (يُستعمل للنكهة)')
    if n['na'] * gpe / 100 > 400: note.append('صوديوم مرتفع %.0f ملغ/حصة' % (n['na'] * gpe / 100))
    if 'تقدير محلي' in ref: note.append('قيمة تقديرية محلية تحتاج مطابقة')
    u, gw, utxt = pick(portions(ar, src), pref)
    upe = gpe / gw if gw else gpe
    if u == 'cup' and upe < 0.25: u, upe = 'tbsp', upe * 16
    if u == 'tbsp' and upe < 0.5: u, upe = 'tsp', upe * 3
    dup = [] if ar in NOTDUP else [e for e in EXIST if difflib.SequenceMatcher(None, norm(ar), norm(e[0])).ratio() >= 0.8]
    if dup: st = 'مكرر محتمل'; note.append('يشبه: ' + '، '.join(x[0] for x in dup[:2]))
    rows.append({'n': ar, 'g': g, 'grp': G[g], 'gpe': round(gpe, 1), 'us': UA[u][0], 'up': UA[u][1], 'upe': round(upe, 2), 'unit_src': utxt,
                 'mac': [round(m['c'], 1), round(m['p'], 1), round(m['f'], 1), round(m['k'])], 'ex': X, 'dev': round(dev * 100), 'st': st, 'note': '؛ '.join(note),
                 'per100': n, 'src': ref, 'r': r, 'cz': cz, 'cooked': ck, 'from': 'الجرامات' if src.startswith('A:') else 'USDA'})
json.dump(rows, open('review.json', 'w'), ensure_ascii=False, indent=0)
from collections import Counter
print(len(rows), Counter(x['st'] for x in rows), Counter(x['from'] for x in rows))
for x in rows:
    if x['st'] != 'مقبول': print(x['st'], '|', x['n'], '|', x['grp'], x['gpe'], 'جم', x['mac'], 'vs', x['ex'], x['dev'], '%', '|', x['note'])
print('---units')
for x in rows: print(x['n'], '=', x['upe'], x['us'], '(', x['gpe'], 'جم) <-', x['unit_src'][:40])
