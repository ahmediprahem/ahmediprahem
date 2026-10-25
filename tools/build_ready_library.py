# -*- coding: utf-8 -*-
"""يبني «مكتبة الأنظمة الجاهزة» من ناتج tools/import_ready_library.py:
  src/readylib/index.json    فهرس صغير (العائلات + كل خطة بمستواها وشكلها وسعراتها) — يُضمَّن في «حصة» و«حصتي» لاختيار النظام
  src/readylib/plans.json.gz محتوى الخطط كاملاً (الأيام، الوجبات، البدائل، الأدلة) مضغوطاً — يُضمَّن في «حصة» فقط
الاستعمال: python3 tools/build_ready_library.py <library_raw.json>
مكتبة المنتجات مستبعدة بقرار المالك. النصوص العلمية من ملفات المالك كما هي."""
import os, re, sys, json, gzip, hashlib

H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(H, 'src', 'readylib')

# العائلة الأساسية: الاسم، الهدف، النظام (حصص ex / جرامات g)، وصف قصير لمن يناسب (مختصر من دليل الأخصائي)
BASE = {
    'deficit':  dict(n='العجز المحسوب', goal='lose', sys='ex', who='بداية مناسبة لمعظم الناس: سعرات ثابتة بعجز محسوب وكل المجموعات الغذائية.', note='4 أشكال: المتوازن، عالي البروتين، الحجم الكبير، المتوسطي.'),
    'zigzag':   dict(n='الزجزاج', goal='lose', sys='ex', who='تبديل الأيام بين منخفض ومرتفع بنفس المتوسط الأسبوعي؛ لمن ملّ النظام الثابت أو ثبت وزنه مع التزام.', note='لا دليل على تفوقه على العجز الثابت؛ قيمته في المرونة والالتزام.'),
    'carbcycle': dict(n='تدوير الكربوهيدرات للتنحيف', goal='lose', sys='ex', who='البروتين ثابت والكارب يتغير (أيام عالية ومتوسطة ومنخفضة)؛ لمن يحب التنوع أو لديه عزائم وأيام نشاط ثابتة.', note='النزول مقارب للنظام الثابت؛ قيمته المرونة. والأفضل لمرضى السكر على الأدوية نظام ثابت الكارب.'),
    'lowcarb':  dict(n='اللو كارب', goal='lose', sys='ex', who='كارب أقل (معتدل 25–35% أو قوي <25%)؛ لمن يفضّله أو لديه مقاومة أنسولين أو ما قبل السكري.', note='نزول أكبر قليلاً أول 6 أشهر ثم تقارب؛ تحسن أوضح في الدهون الثلاثية والسكر.'),
    'keto':     dict(n='الكيتو', goal='lose', sys='ex', who='كارب 20–30 جم يومياً ودهون عالية؛ لمن يريد شبعاً أكبر بلا رز ولا خبز لفترة 8–12 أسبوعاً.', note='نزول أسرع أول أسابيع (جزء منه ماء) ثم تتقارب النتائج؛ له موانع صارمة.'),
    'glp1':     dict(n='مرافقة أدوية GLP-1', goal='lose', sys='ex', who='لمن يأخذ سيماغلوتايد أو تيرزيباتايد بجرعة ثابتة: بروتين مرتفع ووجبات صغيرة تحمي العضل.', note='الدواء يقود النزول؛ دور النظام حماية الكتلة العضلية والسوائل والألياف. الأخصائي لا يعدّل الدواء.'),
    'hair':     dict(n='تنحيف مع قوة الشعر', goal='lose', sys='ex', who='للسيدات: نزول وزن مع تغطية الحديد والبروتين والزنك وفيتامين د المرتبطة بالشعر.', note='يعالج الجانب الغذائي فقط؛ التساقط بسبب الغدة أو التكيس يحتاج طبيبة.'),
    'skin':     dict(n='تنحيف مع صفاء البشرة', goal='lose', sys='ex', who='للسيدات: نزول وزن بكارب بطيء الامتصاص وبلا سكر مضاف لدعم البشرة وحب الشباب الخفيف.', note='التحسن يحتاج 8–12 أسبوعاً ولا يغني عن علاج الجلدية.'),
    'fodmap':   dict(n='الفودماب للقولون العصبي', goal='lose', sys='ex', who='لمرضى القولون العصبي المشخّص: مرحلة حذف 2–6 أسابيع ثم إعادة إدخال، مع عجز معتدل.', note='ليس للتنحيف وحده؛ ولا يناسب التهاب الأمعاء النشط أو السيلياك.'),
    'veg':      dict(n='التنحيف النباتي (مع الألبان)', goal='lose', sys='ex', who='بدون لحوم ولا دواجن ولا أسماك ولا بيض، مع الألبان والبقوليات.', note='يُراجع B12 والحديد والبروتين.'),
    'gain':     dict(n='زيادة الوزن الصحية', goal='gain', sys='ex', who='للنحفاء وضعاف الشهية: فائض 300–500 سعرة بأطعمة مركزة وحجم صغير.', note='يُستبعد أولاً أي سبب طبي للنحافة.'),
    'bulk':     dict(n='التضخيم العضلي النظيف', goal='bulk', sys='g', who='لمن يتمرن مقاومة ويريد عضلاً بأقل دهون: فائض صغير وبروتين 1.6–2.2 جم/كجم.', note='الفائض الكبير لا يزيد العضل بل الدهون.'),
    'acut':     dict(n='التنشيف وإعادة تشكيل الجسم', goal='cut', sys='g', who='للرياضيين الهواة والمتوسطين: بروتين عالٍ وعجز يحفظ العضل، أو إعادة تشكيل بعجز صغير.', note='المعدل المستهدف 0.5–1% من الوزن أسبوعياً.'),
    'acc':      dict(n='الكارب سايكل للرياضيين', goal='cut', sys='g', who='تنشيف بكارب يتبع حجم التمرين: يوم عالٍ ومتوسط ومنخفض.', note='الدهون النازلة مقاربة للثابت؛ الميزة جودة التمرين والمرونة.'),
    'maint':    dict(n='التثبيت بعد التنحيف', goal='maintain', sys='ex', who='برنامج 8 أسابيع يرفع السعرات تدريجياً بعد انتهاء الحمية لتثبيت الوزن.', note='الأقوى للتثبيت العادات: الوزن المنتظم والنشاط والمتابعة.'),
    'plateau':  dict(n='كسر ثبات الوزن', goal='plateau', sys='ex', who='4 بروتوكولات حسب سبب الثبات (استراحة، ريفيد، إعادة حساب، احتباس ماء) لمدة 4 أسابيع.', note='الثبات الحقيقي 3–4 أسابيع بلا تغير مع التزام موثّق.'),
    'kids':     dict(n='الأطفال 6–12 سنة', goal='kids', sys='ex', who='للأطفال بوزن زائد: نزول بطيء مع نمو طبيعي، والنظام للأسرة كلها.', note='لا يغني عن طبيب الأطفال؛ لا نتحدث عن الوزن أمام الطفل.'),
    'teen':     dict(n='المراهقون 12–18 سنة', goal='teen', sys='ex', who='للمراهقين بوزن زائد: نزول تدريجي نحو 0.5 كجم أسبوعياً مع نمو طبيعي.', note='سلوكي أولاً؛ لا حميات قاسية ولا مكملات تنحيف.'),
}
# مجلد المكتبة ← (العائلة، المنطقة): eg = أكلات مصرية، sa = أكلات سعودية/خليجية، all = مشترك
FAMDIR = {
    'Deficit': ('deficit', 'sa'), 'ZigZag': ('zigzag', 'sa'), 'ZigZag_EG': ('zigzag', 'eg'),
    'CarbCycle_Slimming': ('carbcycle', 'sa'), 'CarbCycle_Slimming_EG': ('carbcycle', 'eg'),
    'LowCarb': ('lowcarb', 'sa'), 'LowCarb_EG': ('lowcarb', 'eg'), 'Keto': ('keto', 'sa'),
    'GLP1': ('glp1', 'sa'), 'GLP1_EG': ('glp1', 'eg'), 'Hair': ('hair', 'sa'), 'Hair_EG': ('hair', 'eg'),
    'Skin': ('skin', 'sa'), 'Skin_EG': ('skin', 'eg'), 'LowFODMAP': ('fodmap', 'sa'), 'LowFODMAP_EG': ('fodmap', 'eg'),
    'Vegetarian': ('veg', 'sa'), 'Vegetarian_EG': ('veg', 'eg'), 'WeightGain': ('gain', 'sa'), 'WeightGain_EG': ('gain', 'eg'),
    'LeanBulk': ('bulk', 'all'), 'AthleteCut': ('acut', 'sa'), 'AthleteCut_EG': ('acut', 'eg'),
    'AthleteCarbCycle': ('acc', 'sa'), 'AthleteCarbCycle_EG': ('acc', 'eg'),
    'Maintenance': ('maint', 'sa'), 'Maintenance_EG': ('maint', 'eg'), 'Plateau': ('plateau', 'sa'), 'Plateau_EG': ('plateau', 'eg'),
    'Kids': ('kids', 'sa'), 'Kids_EG': ('kids', 'eg'), 'Teen': ('teen', 'sa'), 'Teens_EG': ('teen', 'eg'),
}
# شكل النظام (من اسم الملف) ← مفتاح نمط الحياة + اسم عربي
FORMS = {
    'Egyptian-Classic': ('classic', 'المصري التقليدي'), 'Saudi-Classic': ('classic', 'السعودي التقليدي'),
    'Quick-Office': ('office', 'سريع للموظفين'), 'Quick-Office-Student': ('office', 'سريع للموظف أو الطالب'), 'Quick-Students-Office': ('office', 'سريع للطلاب والموظفين'),
    'Family-Grills': ('family', 'الأسرة والمشويات'), 'Home-Family': ('family', 'البيت والعائلة'), 'Fish-Grills': ('fish', 'سمك ومشويات'),
    'Low-Cost': ('budget', 'اقتصادي'), 'Two-Meals': ('twomeals', 'وجبتان فقط'), 'Weekend-High': ('weekend', 'أيام عالية في نهاية الأسبوع'),
    'Insulin-Resistance': ('ir', 'مقاومة الأنسولين وما قبل السكري'), 'Constipation-Diarrhea': ('gi', 'للإمساك والإسهال'), 'Eating-Out': ('eatout', 'الأكل خارج البيت'),
    'Six-Small-Meals': ('sixmeals', '6 وجبات صغيرة'), 'Poor-Appetite-6-Meals': ('sixmeals', 'ضعيف الشهية (6 وجبات)'),
    'School-Lunchbox': ('lunchbox', 'علبة المدرسة'), 'Picky-Eater': ('picky', 'الطفل الانتقائي'), 'Athletic': ('athletic', 'الرياضي'), 'Fast-and-Outside': ('outside', 'السريع والأكل خارج المنزل'),
    'Evening-Training': ('evening', 'تمرين مسائي'), 'Morning-Training': ('morning', 'تمرين صباحي'), '3-Training-Days': ('3days', '3 أيام تمرين أسبوعياً'), 'Recomposition': ('recomp', 'إعادة تشكيل الجسم'),
}
SUBS_AR = {'Balanced': ('balanced', 'المتوازن'), 'High-Protein': ('protein', 'عالي البروتين'), 'High-Volume': ('volume', 'الحجم الكبير'), 'Mediterranean': ('med', 'المتوسطي'),
           'Moderate_LowCarb': ('moderate', 'معتدل'), 'Strict_LowCarb': ('strict', 'قوي'),
           'P1_After-Regular-Diet': ('regular', 'بعد حمية عادية'), 'P2_After-GLP1': ('glp1', 'بعد أدوية GLP-1'), 'P3_After-Sleeve': ('sleeve', 'بعد التكميم'), 'P4_After-Very-Low-Calorie': ('vlc', 'بعد حمية قاسية جداً'),
           'P1_Diet-Break': ('break', 'استراحة الدايت'), 'P2_Refeed-Days': ('refeed', 'أيام الريفيد'), 'P3_Recalculate-Tighten': ('recalc', 'إعادة الحساب والتشديد'), 'P4_Water-Retention': ('water', 'احتباس الماء')}

def sha(o): return hashlib.sha1(json.dumps(o, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:10]

def main(src):
    L = json.load(open(src, encoding='utf-8'))
    fams, plans, store, shared, guides = {}, [], {}, {}, {}
    def share(o):
        k = sha(o); shared.setdefault(k, o); return k
    for x in L:
        fd = x['fam']; base, rg = FAMDIR[fd]; d = x['doc']; fk = base + '_' + rg
        F = fams.setdefault(fk, {'b': base, 'rg': rg, 'dir': fd, 'forms': {}, 'subs': {}})
        if not d['days']:                                   # دليل الأخصائي أو دليل العميل لبروتوكول
            kind = 'spec' if 'Specialist' in x['file'] else 'client'
            g = guides.setdefault(fk, {'spec': [], 'client': {}})
            if kind == 'spec': g['spec'] = d['secs']
            else:
                sb = (x.get('sub') or '')
                g['client'][SUBS_AR.get(sb, (sb,))[0]] = d['secs']
            continue
        for y in d['days']:                                 # بعض العناوين بلا أقواس: «اليوم الأول - يوم 1200 سعرة»
            if not y['kcal']:
                k2 = re.search(r'(\d{3,4})\s*سعرة', y['t'])
                if k2: y['kcal'] = int(k2.group(1))
        ks = [y['kcal'] for y in d['days'] if y['kcal']]
        avg = round(sum(ks) / len(ks)) if ks else (x.get('lvl') or 0)
        e = {'i': x['file'], 'f': fk}
        if x.get('lvl'): e['l'] = x['lvl']
        if x.get('formName'):
            fo = FORMS[x['formName']]; e['fo'] = fo[0]; F['forms'][fo[0]] = fo[1]
        sb = x.get('sub')
        if sb and sb in SUBS_AR:
            s2 = SUBS_AR[sb]; e['sb'] = s2[0]; F['subs'][s2[0]] = s2[1]
        if x.get('mixed'): e['mx'] = 1
        for k in ('sex', 'age', 'act', 'week'):
            if x.get(k) is not None: e[{'sex': 'sx', 'age': 'ag', 'act': 'ac', 'week': 'wk'}[k]] = x[k]
        if x.get('lowcost') and 'fo' not in e: e['lc'] = 1
        if x.get('lowcost') and e.get('fo') == 'budget': pass
        e['k'] = avg
        if ks and max(ks) - min(ks) > 30: e['kr'] = [min(ks), max(ks)]
        if base in ('bulk', 'acut', 'acc'):           # نظام الجرامات: متوسط الماكروز من جدول الوجبات
            tp = tc = tf = 0; n = 0
            for y in d['days']:
                mm = [m[2] if isinstance(m, list) else m.get('m') for m in y['meals']]
                s = [sum((m.get('m') or {}).get(q, 0) for m in y['meals']) for q in 'pcf']
                tp += s[0]; tc += s[1]; tf += s[2]; n += 1
            if n: e['mac'] = [round(tp / n), round(tc / n), round(tf / n)]
        plans.append(e)
        store[x['file']] = {
            'days': [{'t': y['t'], 'k': y['kcal'], 'm': [[m['n'], m['it'], m.get('g') or m.get('m') or {}] for m in y['meals'] if m['it']], 'tp': y['tips']} for y in d['days']],
            'subs': share(d['subs']), 'ex': d['ex'], 'secs': share(d['secs']), 'title': d.get('title') or ''}
    for fk, F in fams.items():
        b = BASE[F['b']]; F.update({'n': b['n'], 'goal': b['goal'], 'sys': b['sys'], 'who': b['who'], 'note': b['note']})
    # ترتيب ثابت
    plans.sort(key=lambda e: (e['f'], e.get('sb') or '', e.get('sx') or '', str(e.get('ag')), e.get('ac') or '', e.get('l') or 0, e.get('wk') or 0, e.get('fo') or '', e.get('lc') or 0, e['i']))
    idx = {'v': 1, 'fams': fams, 'plans': plans}
    os.makedirs(OUT, exist_ok=True)
    json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    blob = json.dumps({'v': 1, 'plans': store, 'shared': shared, 'guides': guides}, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    with open(os.path.join(OUT, 'plans.json.gz'), 'wb') as f: f.write(gzip.compress(blob, 9, mtime=0))
    print('families', len(fams), '| plans', len(plans), '| index', os.path.getsize(os.path.join(OUT, 'index.json')) // 1024, 'KB | plans.gz', os.path.getsize(os.path.join(OUT, 'plans.json.gz')) // 1024, 'KB (raw', len(blob) // 1024, 'KB)')

if __name__ == '__main__':
    main(sys.argv[1])
