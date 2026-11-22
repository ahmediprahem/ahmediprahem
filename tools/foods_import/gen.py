# يولّد src/foods_import.json من review.json بعد تقريب الكمية لأقرب مقياس منزلي (قرار المالك 2026-11-22: «أضف الكل مع التقريب»)
import json
R = json.load(open('review.json'))
D = json.load(open('/home/user/ahmediprahem/src/data.json'))
EX = D['EX']
CUP = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6]
PL = {'كوب': 'أكواب', 'ملعقة كبيرة': 'ملاعق كبيرة', 'ملعقة صغيرة': 'ملاعق صغيرة', 'شريحة': 'شرائح', 'حبة': 'حبات', 'جم': 'جم', 'طبق صغير': 'أطباق صغيرة'}
# أصناف بالجرام تُحوَّل لوحدة منزلية (وزن الوحدة بالجرام، USDA أو المصدر)
TOU = {'بذور الشيا': ('ملعقة كبيرة', 12), 'صنوبر': ('ملعقة كبيرة', 8.6), 'جوز هند مجفف غير محلى': ('ملعقة كبيرة', 5),
       'كشري (بلا صلصة حارة)': ('طبق صغير', 250), 'تمر هندي': ('ملعقة كبيرة', 15), 'مانجو مجففة (محلاة)': ('شريحة', 10),
       'بروتين مصل اللبن (بودرة)': ('ملعقة كبيرة', 8), 'عصير الجزر': ('كوب', 236), 'أرز كبسة (مطبوخ بتتبيل خفيف)': ('كوب', 160)}
def rnd(us, v):
    if us == 'جم': return max(5, round(v / 5) * 5)
    if us in ('كوب', 'طبق صغير'): return min(CUP, key=lambda c: abs(c - v))
    return max(0.5, round(v * 2) / 2) if v < 3 else round(v)          # ملاعق وحبات وشرائح: أنصاف حتى 3 ثم أعداد صحيحة
ROLE_M = {'bread': [1, 0, 1, 1], 'cereal': [1, 0, 0, 1], 'grain': [0, 1, 1, 0], 'tuber': [0, 1, 1, 0], 'snk': [1, 0, 0, 1], 'leg': [0, 1, 1, 0], 'meat': [0, 1, 1, 0], 'fish': [0, 1, 1, 0],
          'tofu': [0, 1, 1, 0], 'egg': [1, 0, 1, 0], 'cheese': [1, 0, 1, 1], 'dairy': [1, 0, 1, 1], 'veg': [0, 1, 1, 0], 'juice': [1, 0, 0, 1], 'fruit': [1, 1, 1, 1], 'nuts': [1, 0, 0, 1],
          'nutb': [1, 0, 0, 1], 'oil': [0, 1, 1, 0], 'spread': [1, 0, 1, 0], 'sweet': [1, 0, 0, 1]}
RAWV = ('نيء',)
NOVEGAN = {'جبنة كريمية', 'شوكولاتة بالحليب', 'بروتين مصل اللبن (بودرة)'}
SKIP = {'بيض السمان', 'ثوم'}          # حصته 6 بيضات تتعارض مع حدّ البيض اليومي (يُعدّ بيضاً بالاسم)
out = []
for r in R:
    if r['n'] in SKIP: continue
    us, upe0, gpe0 = r['us'], r['upe'], r['gpe']
    ug = gpe0 / upe0 if upe0 else 1
    if r['n'] in TOU: us, ug = TOU[r['n']]; upe0 = gpe0 / ug
    upe = rnd(us, upe0 if us != 'جم' else gpe0); gpe = upe * ug if us != 'جم' else upe
    k = gpe / 100; p = r['per100']
    mac = [round(p['c'] * k, 1), round(p['p'] * k, 1), round(p['f'] * k, 1), round(p['k'] * k)]
    X = EX[r['g']]; dev = round((mac[3] - X[3]) / X[3] * 100)
    rl = r['r']; m = ROLE_M.get(rl, [1, 1, 1, 1])
    if rl == 'veg' and r['cooked'] in RAWV: m = [1, 1, 1, 1]
    if rl in ('meat', 'fish', 'tofu') or (rl == 'leg' and 2 <= r['g'] <= 5): m = [0, 1, 0, 0]          # اللحوم والأسماك المستوردة للغداء (الفطور والعشاء أجبان وألبان وبيض غالباً)
    veg = 0 if rl in ('meat', 'fish') else 1; vegan = 0 if rl in ('meat', 'fish', 'egg', 'cheese', 'dairy') or r['n'] in NOVEGAN else 1
    out.append({'n': r['n'], 'g': r['g'], 'us': us, 'up': PL.get(us, us), 'upe': round(upe, 4), 'gpe': round(gpe, 1), 'units': round(upe, 4), 'exv': 1, 'mac': mac, 'cooked': r['cooked'],
                'm': m, 'veg': veg, 'vegan': vegan, 'on': 0 if r['n'] in ('أنشوجة معلبة بالزيت', 'جرجير مائي', 'تمبيه', 'إدامامي (فول صويا أخضر)', 'فول الصويا مطبوخ', 'ترمس مسلوق', 'بلح البحر مطبوخ') else 1, 'gi': None, 'nw': 1, 'src': r['src'], 'r': rl, 'cz': r['cz'], 'x': 1 if r['cz'] == 'intl' or 2 <= r['g'] <= 8 or (r['g'] == 9 and r['cooked'] == 'نيء') else 0, 'dev': dev,
                'na': round(p['na'] * k), 'fi': round((p['fi'] or 0) * k, 1)})
json.dump(out, open('/home/user/ahmediprahem/src/foods_import.json', 'w'), ensure_ascii=False, indent=0)
for o in out: print(o['n'], '|', ('%g' % o['upe']) + ' ' + o['us'], '=', o['gpe'], 'جم |', o['mac'], '| فرق', o['dev'], '%')
