# 1.17 يولّد src/theme_zenha_auto.css: لكل قاعدة في الثيم الداكن (Linear + الزجاجي + ملف العميل) تحمل لوناً مصمَّماً للخلفية الداكنة
# (نص أبيض، أسطح بيضاء شفافة، حدود فاتحة، خلفيات كحلية) قاعدة مقابلة بالمظهر الفاتح بهوية «زنها» تحت html[data-tone="light"].
# التشغيل: python3 tools/theme_zenha_gen.py   (يُعاد بعد أي تعديل في ملفات الثيم الداكن)
import os, re

H = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = ['theme_linear.css', 'theme_glass.css', 'theme_cfile.css']
NAVY, MUT, ACC, WARN, ERR = '#0b1440', '#55607f', '#0f9f73', '#b25e00', '#c62f35'

def parse_color(v):
    v = v.strip().lower()
    m = re.match(r'#([0-9a-f]{3}|[0-9a-f]{6})$', v)
    if m:
        h = m.group(1); h = ''.join(c * 2 for c in h) if len(h) == 3 else h
        return [int(h[i:i + 2], 16) for i in (0, 2, 4)] + [1.0]
    m = re.match(r'rgba?\(([^)]*)\)$', v)
    if m:
        p = [x.strip() for x in m.group(1).split(',')]
        try: return [float(p[0]), float(p[1]), float(p[2]), float(p[3]) if len(p) > 3 else 1.0]
        except Exception: return None
    if v == '#fff' or v == 'white': return [255, 255, 255, 1.0]
    return None

def lum(c): return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255

def hue_kind(c):
    r, g, b = c[:3]
    if g > r + 25 and g > b - 10: return 'green'
    if r > 200 and g > 170 and b < 160: return 'yellow'
    if r > 200 and g < 190 and b < 190: return 'red'
    return ''

def map_text(v):
    c = parse_color(v)
    if not c or lum(c) < .55: return None
    k = hue_kind(c)
    if k == 'green': return ACC
    if k == 'yellow': return WARN
    if k == 'red': return ERR
    return NAVY if c[3] >= .75 else MUT

def map_bg_color(v):
    c = parse_color(v)
    if not c: return None
    if c[0] > 235 and c[1] > 235 and c[2] > 235:                 # سطح أبيض شفاف فوق الداكن ← لمسة كحلية خفيفة فوق الفاتح
        return 'rgba(11,20,64,%.3f)' % min(.08, c[3] * .45 + .01)
    if lum(c) < .3:                                               # خلفية كحلية/داكنة ← أبيض
        return '#ffffff'
    k = hue_kind(c)
    if k == 'green' and c[3] < .5: return 'rgba(15,159,115,%.2f)' % max(.08, c[3] * .7)
    return None

def map_border(v):
    def rep(m):
        c = parse_color(m.group(0))
        if not c: return m.group(0)
        if c[0] > 200 and c[1] > 200 and c[2] > 200: return 'rgba(11,20,64,%.2f)' % min(.22, c[3] * .6 + .06)
        if lum(c) < .25: return 'rgba(11,20,64,.14)'
        return m.group(0)
    out = re.sub(r'#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)', rep, v)
    return out if out != v else None

def map_background(v):
    if 'gradient' in v:                                           # تدرجات الثيم الداكن: تُبسَّط إلى أبيض إن كانت داكنة أو بيضاء شفافة
        cols = [parse_color(x) for x in re.findall(r'#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)', v)]
        cols = [c for c in cols if c]
        if cols and all(lum(c) < .35 or (c[0] > 235 and c[3] < .5) for c in cols): return '#ffffff'
        return None
    toks = re.findall(r'#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)', v)
    if len(toks) == 1:
        m = map_bg_color(toks[0])
        return v.replace(toks[0], m) if m else None
    return None

def convert(decls):
    out = []
    for d in decls:
        if ':' not in d: continue
        p, val = d.split(':', 1); p = p.strip().lower(); val = val.strip(); imp = '!important' in val; val = val.replace('!important', '').strip()
        nv = None
        if p == 'color': nv = map_text(val)
        elif p in ('background', 'background-color'): nv = map_background(val)
        elif p in ('border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-inline-start', 'border-inline-end', 'outline'): nv = map_border(val)
        elif p == 'box-shadow' and ('inset' in val or 'rgba(3,8,30' in val or 'rgba(0,0,0' in val): nv = '0 1px 2px rgba(11,20,64,.05),0 6px 18px rgba(11,20,64,.06)' if 'inset' not in val else 'none'
        elif p in ('backdrop-filter', '-webkit-backdrop-filter') and val != 'none': nv = 'none'
        elif p == 'fill' or p == 'stroke': nv = map_text(val)
        if nv: out.append('%s:%s%s' % (p, nv, '!important' if imp else ''))
    return out

def prefix(sel):
    s = sel.strip()
    if not s or s.startswith('@') or 'data-tone' in s: return None
    m = re.match(r'^html(\[data-theme="?(glass|linear)"?\]|:is\([^)]*\)|:where\([^)]*\))', s)
    if m: return 'html[data-tone="light"]' + s[len('html'):]
    return None

def rules(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S); i = 0; n = len(css); res = []
    while i < n:
        j = css.find('{', i)
        if j < 0: break
        head = css[i:j].strip()
        if head.startswith('@media') or head.startswith('@supports'):
            depth, k = 1, j + 1
            while k < n and depth: depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            inner = css[j + 1:k - 1]
            if 'print' not in head: res += rules(inner)
            i = k; continue
        if head.startswith('@'):
            depth, k = 1, j + 1
            while k < n and depth: depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            i = k; continue
        k = css.find('}', j); body = css[j + 1:k]; i = k + 1
        res.append((head, [d for d in body.split(';') if d.strip()]))
    return res

def split_sel(head):                                              # فصل المحددات عند الفواصل خارج الأقواس فقط (:is(a,b) يبقى كما هو)
    out, depth, cur = [], 0, ''
    for ch in head:
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if ch == ',' and depth == 0: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur); return out

def main():
    out = ['/* مولَّد بـ tools/theme_zenha_gen.py — لا تعدّله يدوياً. المظهر الفاتح بهوية «زنها» مقابل كل لون مصمَّم للداكن. */', '@media screen{']
    cnt = 0
    for f in SRC:
        for head, decls in rules(open(os.path.join(H, 'src', f), encoding='utf-8').read()):
            sels = [prefix(s) for s in split_sel(head)]; sels = [s for s in sels if s]
            if not sels: continue
            conv = convert(decls)
            if conv: out.append(','.join(sels) + '{' + ';'.join(conv) + '}'); cnt += 1
    out.append('}')
    open(os.path.join(H, 'src', 'theme_zenha_auto.css'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(cnt, 'قاعدة')

if __name__ == '__main__': main()
