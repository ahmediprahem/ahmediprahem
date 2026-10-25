# -*- coding: utf-8 -*-
"""استيراد «مكتبة الأنظمة» (ملفات Word) إلى بيانات منظّمة لـ«حصة» و«حصتي».
الاستعمال: python3 tools/import_ready_library.py <مجلد المكتبة> [ملف الإخراج]
يتجاهل مكتبة المنتجات (Products_Library) بقرار المالك."""
import os, re, sys, json
import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

GROUPS = ['fa', 'ot', 'fr', 've', 'da', 'me', 'le', 'st']   # ترتيب أعمدة جدول الوجبة (من اليسار)

def blocks(d):
    for el in d.element.body.iterchildren():
        tag = el.tag.split('}')[1]
        if tag == 'p': yield Paragraph(el, d)
        elif tag == 'tbl': yield Table(el, d)

def rows(t):
    out = []
    for r in t.rows:
        cs = []
        prev = None
        for c in r.cells:
            if prev is not None and c._tc is prev: continue
            prev = c._tc; cs.append(c.text.strip())
        out.append(cs)
    return out

def raw_rows(t):
    return [[c.text.strip() for c in r.cells] for r in t.rows]

def num(s):
    m = re.search(r'-?\d+(?:\.\d+)?', s or '')
    return float(m.group()) if m else 0

def parse_meal_table(t):
    rr = raw_rows(t); meals = []
    for r in rr[3:]:
        if len(r) < 10: continue
        lines = [x.strip() for x in r[0].split('\n') if x.strip()]
        items = []
        for ln in lines:
            if ln.startswith('◂'):
                if items: items[-1] = [items[-1][0], ln.lstrip('◂ ').strip()]
            else: items.append([ln, ''])
        g = {}
        for i, k in enumerate(GROUPS):
            v = num(r[1 + i])
            if v: g[k] = v
        meals.append({'n': r[9], 'it': [a if not b else a + ' ◂ ' + b for a, b in items], 'g': g})
    tot = {}
    if len(rr) > 2:
        for i, k in enumerate(GROUPS):
            v = num(rr[2][1 + i])
            if v: tot[k] = v
    return meals, tot

def parse_gram_table(t):
    rr = rows(t); meals = []; tot = None
    for r in rr[1:]:
        if len(r) < 6: continue
        if r[0].startswith('المجموع'):
            tot = {'p': num(r[-4]), 'c': num(r[-3]), 'f': num(r[-2]), 'k': num(r[-1])}; continue
        meals.append({'n': r[0], 'it': [x.strip() for x in r[1].split('\n') if x.strip()], 'm': {'p': num(r[2]), 'c': num(r[3]), 'f': num(r[4]), 'k': num(r[5])}})
    return meals, tot

def parse(path):
    """المستند = أقسام (عنوان + فقرات + جداول) + أيام (وجبات + نصائح) + جدول البدائل."""
    d = docx.Document(path)
    P = {'secs': [], 'days': [], 'subs': [], 'ex': []}
    sec = {'t': '', 'p': [], 'tb': []}; P['secs'].append(sec); cur = None; insubs = False
    for b in blocks(d):
        if isinstance(b, Paragraph):
            tx = b.text.strip()
            if not tx: continue
            if b.style.name == 'Intense Quote':
                m = re.match(r'^(اليوم|يوم)\s', tx)
                if m and not tx.startswith('اليوم المثالي'):
                    k = re.search(r'\((\d+)\s*سعرة', tx)
                    cur = {'t': tx, 'kcal': int(k.group(1)) if k else 0, 'meals': [], 'tips': []}; P['days'].append(cur); insubs = False; continue
                cur = None; insubs = 'البدائل' in tx
                sec = {'t': tx, 'p': [], 'tb': []}; P['secs'].append(sec); continue
            if cur is None: sec['p'].append(tx)
            continue
        rr = rows(b)
        if not rr or not rr[0]: continue
        h = rr[0][0]
        if len(rr) == 1 and len(rr[0]) == 1 and 'title' not in P and not P['days']: P['title'] = h; continue
        if h.startswith('الإسب'): continue                      # بيانات العميل الفارغة
        if h.startswith('FOOD'): P['ex'].append({'t': h, 'r': rr[1:]}); continue
        if h.startswith('مكونات الوجبة'):
            if cur is None: continue
            m, tot = parse_meal_table(b); cur['meals'] += m; cur['tot'] = tot; continue
        if h == 'الوجبة' and len(rr[0]) >= 6 and 'بروتين' in ' '.join(rr[0]):
            if cur is None: continue
            m, tot = parse_gram_table(b); cur['meals'] += m; cur['gtot'] = tot; continue
        if h.startswith('نصائح'):
            if cur is not None: cur['tips'] += [r[0] for r in rr[1:] if r and r[0]]
            continue
        if cur is not None and len(rr) == 1: continue          # سطر ملخّص اليوم
        if insubs and len(rr[0]) == 2:
            P['subs'] += [[r[0], [x.strip() for x in (r[1] if len(r) > 1 else '').split('•') if x.strip()]] for r in rr[1:] if r]; continue
        if h.startswith('هدفي') or h.startswith('متابعة'): continue
        sec['tb'].append(rr)
    P['secs'] = [x for x in P['secs'] if x['p'] or x['tb'] or x['t']]
    return P

def meta(rel):
    parts = rel.replace('\\', '/').split('/')
    fam = parts[0]; fn = os.path.splitext(parts[-1])[0]
    m = {'fam': fam.replace('_Library', ''), 'file': fn, 'path': rel}
    k = re.search(r'(\d{3,4})kcal', fn); m['lvl'] = int(k.group(1)) if k else None
    f = re.search(r'Form(\d+)_([A-Za-z0-9-]+)', fn)
    if f: m['form'] = int(f.group(1)); m['formName'] = f.group(2)
    a = re.search(r'Age(\d+)-(\d+)', fn)
    if a: m['age'] = [int(a.group(1)), int(a.group(2))]
    for s in ('Boys', 'Girls'):
        if '_' + s + '_' in fn or fn.startswith(s): m['sex'] = 'm' if s == 'Boys' else 'f'
    if '_Active_' in fn: m['act'] = 'active'
    if '_LowActivity_' in fn: m['act'] = 'low'
    w = re.search(r'Week(\d+)', fn)
    if w: m['week'] = int(w.group(1))
    p = re.search(r'_P(\d)_', fn)
    if p: m['proto'] = int(p.group(1))
    if 'Low-Cost' in fn: m['lowcost'] = True
    sub = [x for x in parts[1:-1] if not re.match(r'^\d+kcal$', x) and not x.endswith('_Library') and x not in ('Boys', 'Girls')]
    if sub: m['sub'] = sub[0]
    if fam == 'Deficit_Library': m['sub'] = parts[1]
    mx = re.search(r'Mixed_([\d-]+)', fn)
    if mx: m['mixed'] = mx.group(1)
    return m

if __name__ == '__main__':
    root = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'library_raw.json'
    res = []; errs = []
    for dp, dn, fns in os.walk(root):
        dn.sort()
        for fn in sorted(fns):
            if not fn.endswith('.docx'): continue
            rel = os.path.relpath(os.path.join(dp, fn), root)
            if rel.startswith('Products_Library'): continue
            m = meta(rel)
            try: m['doc'] = parse(os.path.join(dp, fn))
            except Exception as e: errs.append((rel, repr(e))); continue
            res.append(m)
    json.dump(res, open(out, 'w'), ensure_ascii=False)
    print(len(res), 'files', len(errs), 'errors'); [print(e) for e in errs[:10]]
