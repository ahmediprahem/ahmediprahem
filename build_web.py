# -*- coding: utf-8 -*-
"""يجمع المحرك والواجهة والبيانات والشعار في ملفين: admin.html (واجهة الإدارة) و index.html (قالب المستخدمين — يُفعَّل من ملف يصدّره المدير): py build_web.py"""
import os, json, base64, re
H = os.path.dirname(os.path.abspath(__file__)); R = lambda p: open(os.path.join(H, 'src', p), encoding='utf-8').read() + ('\n' + open(os.path.join(H, 'src', 'grp_core.js'), encoding='utf-8').read() + '\n' + open(os.path.join(H, 'src', 'hx_voice.js'), encoding='utf-8').read() + '\n' + open(os.path.join(H, 'src', 'hx_sticker.js'), encoding='utf-8').read() if p == 'hx_crypto.js' else '')
# خط الثيم الزجاجي (IBM Plex Sans Arabic — رخصة OFL في assets/fonts) مضمَّن data: بلا اتصال خارجي
RANGES = {'arabic': 'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200E,U+2010-2011,U+FB50-FDFF,U+FE70-FEFC', 'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'}
def font_css():
    out = ''
    for w in (400, 700):
        for sub, rng in RANGES.items():
            b = base64.b64encode(open(os.path.join(H, 'assets', 'fonts', 'ibm-plex-sans-arabic-%s-%d-normal.woff2' % (sub, w)), 'rb').read()).decode()
            out += "@font-face{font-family:'Hissa Plex';font-style:normal;font-display:swap;font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}\n" % (w, b, rng)
    return out
def serif_css():                                  # «حصتي» 0.60: خط النسخ (Amiri) وخط المصحف (Amiri Quran) مجزّآن على العربية، لرسائل العجلة
    out = ''
    for fam, f in (('Hissa Amiri', 'amiri-arabic-400.woff2'), ('Hissa Quran', 'amiri-quran-arabic-400.woff2')):
        out += "@font-face{font-family:'%s';font-style:normal;font-display:swap;font-weight:400 700;src:url(data:font/woff2;base64,%s) format('woff2')}\n" % (fam, base64.b64encode(open(os.path.join(H, 'assets', 'fonts', f), 'rb').read()).decode())
    return out
# 1.30 (طلب المالك): هوية مستلهمة من موقع ولاء بلس — أخضر العلامة ورمادي داكن للنصوص بدل الكحلي، وخطا Alexandria (العناوين) وAlmarai (النص) المجانيان (OFL) بديلين قريبين من Madani Arabic وFF Shamel Rounded التجاريين
WALA = (('#0b1440', '#102D3B'), ('rgba(11,20,64', 'rgba(16,45,59'), ('#1d2a5b', '#2A4654'), ('#253464', '#2F4B59'), ('#55607f', '#69767B'), ('#8a93ad', '#97A3A7'), ('#0f9f73', '#0F8A66'), ('rgba(15,159,115', 'rgba(36,201,154'), ('#0c8a63', '#0C7A5A'), ('#0f8f6b', '#0F8A66'), ('#30d0a0', '#24C99A'), ('#70f0a0', '#7FE3C4'), ('#04261a', '#102D3B'), ('#f4f7fb', '#F4F7F6'))      # 1.36: الهوية الموحدة الجديدة (قرار المالك): كحلي #102D3B، نعناعي #24C99A، خلفية #F4F7F6
def wala(css):
    for a, b in WALA: css = css.replace(a, b).replace(a.upper(), b)
    return css
def wala_fonts():
    out = ''
    for fam, f, w in (('Zenha Head', 'alexandria-%s-500-800.woff2', '500 800'),):      # 1.36: IBM Plex Sans Arabic (Hissa Plex) أساسي، وAlexandria للعناوين فقط؛ أُزيل Almarai
        for sub, rng in RANGES.items():
            fn = os.path.join(H, 'assets', 'fonts', f % sub)
            if os.path.exists(fn): out += "@font-face{font-family:'%s';font-style:normal;font-display:swap;font-weight:%s;src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}\n" % (fam, w, base64.b64encode(open(fn, 'rb').read()).decode(), rng)
    return out
# 1.38 نظام ألوان Digital Wellness (قرار المالك): خريطة من الهوية السابقة إلى اللوحة المعتمدة، تُطبَّق على ملفي «زنها Pro» فقط (لا تطبيق العميل)
DW = (('#102D3B', '#172D43'), ('rgba(16,45,59', 'rgba(23,45,67'), ('rgba(16, 45, 59', 'rgba(23, 45, 67'), ('#24C99A', '#287E91'), ('rgba(36,201,154', 'rgba(40,126,145'), ('rgba(0,206,139', 'rgba(87,201,179'),
      ('#1FB88C', '#1F6474'), ('#0F8A66', '#246F80'), ('#7FE3C4', '#57C9B3'), ('#E7F7F1', '#DCECEB'), ('#F4F7F6', '#F4F7FA'), ('#E6EBE9', '#DCE4EA'), ('#DCE3E0', '#D3DDE5'), ('#69767B', '#5B6B7A'),
      ('#24A879', '#1A7A50'), ('#E7A34B', '#E9A23B'), ('#E66B70', '#C2413B'), ('#8A5A12', '#9A5B00'), ('#B5454A', '#B83A34'), ('#3D7FB0', '#2A6FBA'),
      ('#0F9F73', '#246F80'), ('#00A36C', '#246F80'), ('#0E9F86', '#246F80'), ('#3FBF93', '#57C9B3'), ('#6FE3A9', '#6FD6C2'), ('#5FD49B', '#57C9B3'), ('#7FE7B4', '#6FD6C2'),
      ('#1F9D55', '#1A7A50'), ('#2E9E5E', '#1A7A50'), ('#1E8C4E', '#1A7A50'), ('#1F7A45', '#1A7A50'), ('#C62F35', '#B83A34'), ('#B3261E', '#B83A34'), ('#C0392B', '#B83A34'), ('#B25E00', '#9A5B00'), ('#D08A00', '#9A5B00'),
      ('--g-cb:#f59e0b', '--g-cb:#C47F12'), ('--g-pr:#0ea5e9', '--g-pr:#287E91'), ('--g-ft:#a855f7', '--g-ft:#7B68B5'), ('--g-ok:#10b981', '--g-ok:#1A7A50'), ('--g-warn:#f59e0b', '--g-warn:#E9A23B'), ('--g-bad:#ef4444', '--g-bad:#C2413B'))
def dw(t):
    for a, b in DW: t = re.sub(re.escape(a), b, t, flags=re.I)
    return t
def build(mode, tpl):
    t = R('template.html').replace('/*MODE*/', json.dumps(mode)).replace('/*TPL*/', tpl).replace('/*CSS*/', R('style.css')).replace('/*THEMECSS*/', R('theme_linear.css') + font_css() + R('theme_glass.css') + R('theme_cfile.css') + wala(R('theme_zenha_auto.css') + R('theme_zenha.css') + R('theme_mobile.css') + R('theme_gen.css')) + wala_fonts() + R('theme_wala.css') + R('theme_home.css') + R('theme_dw.css') + R('theme_layout.css') + R('zclick.css') + R('cf_wb.css') + R('pro148.css') + R('ntr150.css') + R('cf151.css') + R('gen152.css') + R('gen153.css') + R('home162.css') + R('protect164.css') + R('zds168.css') + R('ix169.css') + R('arch170.css') + R('gen171.css')).replace('/*ASSETS*/', R('assets.js')).replace('/*DATA*/', R('data.json')).replace('/*ATHLETE*/', R('athlete.json'))
    t = t.replace('<script>/*AUTH*/</script>', '<script>/*G161*/</script><script>/*AUTH*/</script>')      # 1.62 شاشة الدخول بتصميم صفحة الاستقبال (قبل auth.js)
    t = t.replace('/*ICONS*/', R('icons_lucide.js') + '\n/*ICONS*/')      # 1.40: بيانات Lucide قبل وحدة الأيقونات
    t = t.replace('/*ZIZO*/', '/*ZIZO*/\n' + R('zclick.js'))      # 1.40: مؤشر زنها Z-Click (زنها Pro فقط)
    for k, f in (('ICONS', 'icons.js'), ('DIGITS', 'digits.js'), ('ENGINE', 'engine.js'), ('ASSIST', 'assistant.js'), ('RECIPE', 'recipe.js'), ('DTICON', 'dt_icon.js'), ('NATIVE', 'native.js'), ('XLSXR', 'xlsx_read.js'), ('ATHIMP', 'athimport.js'), ('ATHENG', 'athlete.js'), ('DIETS', 'diets.js'), ('DOCX', 'docx.js'), ('SEC', 'sec.js'), ('HXC', 'hx_crypto.js'), ('FORMS', 'forms.js'), ('ZIZO', 'zizo.js'), ('APP', 'app.js'), ('AUTH', 'auth.js')): t = t.replace('/*%s*/' % k, R(f).replace('/*ATHUI*/', R('athlete_ui.js')).replace('/*ASSISTUI*/', R('assistant_ui.js')).replace('/*HUDUI*/', R('hud_ui.js')).replace('/*BANKUI*/', R('bank_ui.js')).replace('/*DAYSUI*/', R('daydist_ui.js')).replace('/*THEMEUI*/', R('theme_ui.js')).replace('/*SHELLUI*/', R('shell_ui.js')).replace('/*HXUI*/', R('hissati_ui.js')).replace('/*FORMSUI*/', R('forms_ui.js')).replace('/*VAULTUI*/', R('vault_ui.js')).replace('/*MEDUI*/', R('med_ui.js')).replace('/*FEEDUI*/', R('feed_ui.js')).replace('/*WORKUI*/', R('work_ui.js')).replace('/*SUBUI*/', R('sub_ui.js')).replace('/*CHATUI*/', R('chat_ui.js')).replace('/*GRPUI*/', R('grp_ui.js')).replace('/*RICHUI*/', R('rich_ui.js')).replace('/*CHALUI*/', R('chal_ui.js')).replace('/*DIETSUI*/', R('diets_ui.js')).replace('/*READYUI*/', R('ready_ui.js')).replace('/*PLIBUI*/', R('plib_ui.js')).replace('/*CHECKUI*/', R('checkin_ui.js')).replace('/*GYMUI*/', R('gym_ui.js')).replace('/*CFILEUI*/', R('cfile_ui.js') + '\n' + R('cf_wb.js') + '\n' + R('pro148.js') + '\n' + R('ntr150.js') + '\n' + R('cf151.js') + '\n' + R('gen152.js') + '\n' + R('gen153.js') + '\n' + R('msg154.js') + '\n' + R('home162.js') + '\n' + R('protect164.js') + '\n' + R('meas168.js') + '\n' + R('ix169.js') + '\n' + R('arch170.js') + '\n' + R('gen171.js')).replace('/*GENUI*/', R('gen_ui.js')) if k == 'APP' else R(f))
    t = t.replace('/*G161*/', R('gate161.js').replace('/*G161IMG*/', 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(H, 'assets', 'login', 'gate_hero.webp'), 'rb').read()).decode()))
    t = t.replace('/*READYIDX*/null', R('readylib/index.json')).replace('/*READYGZ*/', base64.b64encode(open(os.path.join(H, 'src', 'readylib', 'plans.json.gz'), 'rb').read()).decode()).replace('/*READYLIB*/', R('readylib.js')).replace('/*PLIBIDX*/null', R('plib/index.json')).replace('/*PLIBGZ*/', base64.b64encode(open(os.path.join(H, 'src', 'plib', 'plans.json.gz'), 'rb').read()).decode()).replace('/*PLIB*/', R('plib.js'))
    t = t.replace('<script>/*ADMIN*/</script>', '<script>' + R('admin.js').replace("/*PRO_ICONS*/{}", json.dumps({k: base64.b64encode(open(os.path.join(H, 'assets', 'zenhapro', k + '.png'), 'rb').read()).decode() for k in ('icon-192', 'icon-512', 'maskable-512', 'apple-180')})).replace("/*HISSA_SW*/''", json.dumps(R('hissa_sw.js'), ensure_ascii=False).replace('</', '<\\/')) + '</script>' if mode == 'admin' else '')
    return dw(t)
user = build('user', 'null'); admin = build('admin', json.dumps(user).replace('</', '<\\/'))
open(os.path.join(H, 'index.html'), 'w', encoding='utf-8').write(user); open(os.path.join(H, 'admin.html'), 'w', encoding='utf-8').write(admin)

# 0.96: موقع الأخصائيين hessanu (worker/site): index.html بمفتاح المدير العام وعنوان المحطة من site.json، مع الأصول الثابتة
_sc = json.load(open(os.path.join(H, 'worker', 'site', 'site.json'), encoding='utf-8')); _sd = os.path.join(H, 'worker', 'site', 'public'); os.makedirs(_sd, exist_ok=True)
_si = user.replace('ADMIN_PUB=null', 'ADMIN_PUB=' + json.dumps(_sc['admin_pub'], separators=(',', ':')), 1).replace('BASE_SETTINGS=null', 'BASE_SETTINGS=' + json.dumps({"colors": {}, "over": {}, "deleted": [], "custom": [], "hx": {"relay": _sc['relay']}}, separators=(',', ':'), ensure_ascii=False), 1)
if _sc.get('google_cid'): _si = _si.replace('window.ADMIN_SEED=null;', 'window.ADMIN_SEED=null;window.GOOGLE_CID=' + json.dumps(_sc['google_cid']) + ';window.TRIAL_PUB=' + (json.dumps(_sc['trial_pub'], separators=(',', ':')) if _sc.get('trial_pub') else 'null') + ';', 1)      # 1.65 دخول Google والتجربة المجانية (المعرّف والمفتاح العام فقط)
assert 'ADMIN_PUB=null' not in _si and 'BASE_SETTINGS=null' not in _si, 'لم يُحقن مفتاح المدير في موقع الأخصائيين'
open(os.path.join(_sd, 'index.html'), 'w', encoding='utf-8').write(_si)
import shutil
for _f in os.listdir(os.path.join(H, 'worker', 'site', 'static')): shutil.copy(os.path.join(H, 'worker', 'site', 'static', _f), os.path.join(_sd, _f))
# 0.95: واجهة الإدارة على الإنترنت (zenha-admin): نسخة admin.html أصلاً ثابتاً للخادم، مع ترويسات الأمان
os.makedirs(os.path.join(H, 'worker', 'admin', 'public'), exist_ok=True)
open(os.path.join(H, 'worker', 'admin', 'public', 'index.html'), 'w', encoding='utf-8').write(admin)
open(os.path.join(H, 'worker', 'admin', 'public', '_headers'), 'w', encoding='utf-8').write("/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-cache\n  Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=()\n  Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob: 'self'; media-src data: blob:; font-src data:; connect-src 'self' https:; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'\n")
# «حصتي»: تطبيق العميل ملف واحد (hissati.html)، ونسخة المحطة الوسيطة الجاهزة للصق في Cloudflare (worker/relay/dist/worker.js) وهي تقدّمه على «/»
import re
A = R('assets.js'); js = lambda k: json.loads('"' + re.search(k + r':"((?:[^"\\]|\\.)*)"', A).group(1) + '"')
# 0.58: نص المصحف من Tanzil لا يُعدَّل أبداً — نتحقق من بصمته وعدد آياته قبل أي بناء
import hashlib
_qb = open(os.path.join(H, 'assets', 'quran', 'quran-uthmani.txt'), 'rb').read()
assert hashlib.sha256(_qb).hexdigest() == open(os.path.join(H, 'assets', 'quran', 'quran-uthmani.sha256')).read().strip(), 'نص المصحف تغيّر عن نسخة Tanzil الأصلية'
assert sum(1 for l in _qb.decode('utf-8').split('\n') if l and not l.startswith('#')) == 6236, 'عدد آيات المصحف ليس 6236'
# ثيم «إشراق» (sun) يرث كل قواعد «وردة»: نضيف sun بجانب rose في كل محدِّد، ثم يستبدل theme_sun.css المتغيرات
SUN = lambda css: css.replace('[data-theme="rose"]', ':is([data-theme="rose"],[data-theme="sun"])')
hx = open(os.path.join(H, 'src', 'hissati', 'template.html'), encoding='utf-8').read().replace('/*FONT*/', font_css() + serif_css()).replace('/*CSS*/', SUN(R('hissati/style.css'))).replace('/*THEMES*/', SUN(R('hissati/themes.css') + R('hissati/themes_glass.css') if os.path.exists(os.path.join(H, 'src', 'hissati', 'themes_glass.css')) else R('hissati/themes.css')) + R('hissati/theme_sun.css')).replace('/*MOTION*/', R('hissati/motion.js')).replace('/*ONB*/', json.dumps([('data:image/webp;base64,' + base64.b64encode(open(os.path.join(H, 'assets', 'onboarding', f), 'rb').read()).decode()) for f in sorted(os.listdir(os.path.join(H, 'assets', 'onboarding'))) if f.endswith('.webp')] if os.path.isdir(os.path.join(H, 'assets', 'onboarding')) else [])).replace('/*LOGO*/', json.dumps(open(os.path.join(H, 'assets', 'zenha', 'logo.svg'), encoding='utf-8').read(), ensure_ascii=False).replace('</', '<\\/')).replace('/*HXC*/', R('hx_crypto.js')).replace('/*FORMS*/', R('forms.js')).replace('/*READYIDX*/null', R('readylib/index.json')).replace('/*READYLIB*/', R('readylib.js')).replace('/*APP*/', R('hissati/wheel_msgs.js') + R('zizo.js') + R('hissati/app.js').replace('/*GRPCL*/', R('hissati/groups.js')).replace('/*QURANH*/', R('hissati/quran.js')).replace('/*KHAMS*/', R('hissati/khams.js').replace('/*QMETA*/null', open(os.path.join(H, 'assets', 'quran', 'meta.json'), encoding='utf-8').read())))
hx = hx.replace('/*AIFOOD*/', R('hissati/ai_food.js').replace('/*AICAMIMG*/', 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(H, 'assets', 'hissati', 'ai-cam.webp'), 'rb').read()).decode())).replace('/*AIFOODCSS*/', SUN(R('hissati/ai_food.css')))      # 1.28 مساعد الطعام بالذكاء الاصطناعي
open(os.path.join(H, 'hissati.html'), 'w', encoding='utf-8').write(hx)
_dm = os.path.join(H, 'src', 'hissati', 'demo_state.json')
if os.path.exists(_dm):      # نسخة تجريبية للعرض (Artifact): نفس التطبيق بحساب وهمي بلا شبكة
    # 0.60: العنوان يُقرأ بتعبير منتظم (صار «زنها»)، ويفشل البناء إن لم يحدث الاستبدال حتى لا ينكسر بصمت عند أي تغيير اسم لاحق
    _dh, _dn = re.subn(r'<title>(.*?)</title>', lambda m: '<title>' + m.group(1) + ' — نسخة تجريبية</title>', hx.replace('window.HX_DEMO=/*DEMO*/null;', 'window.HX_DEMO=' + open(_dm, encoding='utf-8').read().replace('</', '<\\/') + ';'), count=1, flags=re.S)
    assert _dn == 1 and 'نسخة تجريبية</title>' in _dh, 'لم يُستبدل عنوان نسخة العرض في hissati_demo.html'
    open(os.path.join(H, 'hissati_demo.html'), 'w', encoding='utf-8').write(_dh)
jsstr = lambda v: json.dumps(v, ensure_ascii=False).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
wk = open(os.path.join(H, 'worker', 'relay', 'index.mjs'), encoding='utf-8').read()
wk = re.sub(r'/\*HISSATI_HTML\*/.*?/\*END\*/', lambda m: '/*HISSATI_HTML*/' + jsstr(hx) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*HISSATI_ICONS\*/.*?/\*END\*/', lambda m: '/*HISSATI_ICONS*/' + json.dumps({k: base64.b64encode(open(os.path.join(H, 'assets', 'hissati', k + '.png'), 'rb').read()).decode().replace('+', '-').replace('/', '_').rstrip('=') for k in [n + t for t in ('', '-rose', '-pulse', '-firoz') for n in ('icon-192', 'icon-512', 'maskable-512', 'apple-180')]}) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*HISSATI_SW\*/.*?/\*END\*/', lambda m: '/*HISSATI_SW*/' + jsstr(R('hissati/sw.js')) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*QURAN_TXT\*/.*?/\*END\*/', lambda m: '/*QURAN_TXT*/' + jsstr(_qb.decode('utf-8')) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*QURAN_FONT\*/.*?/\*END\*/', lambda m: '/*QURAN_FONT*/' + jsstr(base64.b64encode(open(os.path.join(H, 'assets', 'fonts', 'AmiriQuran-Regular.ttf'), 'rb').read()).decode()) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*HISSATI_ICON\*/.*?/\*END\*/', lambda m: '/*HISSATI_ICON*/' + jsstr(base64.b64encode(open(os.path.join(H, 'assets', 'zenha', 'icon-256.png'), 'rb').read()).decode()) + '/*END*/', wk, count=1, flags=re.S)
os.makedirs(os.path.join(H, 'worker', 'relay', 'dist'), exist_ok=True); open(os.path.join(H, 'worker', 'relay', 'dist', 'worker.js'), 'w', encoding='utf-8').write(wk)
if os.path.exists(_dm):      # 1.28: نسخة المعاينة (hissati-preview): نفس المحطة، و«/» يقدّم نسخة العرض بحساب تجريبي لتجربة مساعد الطعام قبل اعتماده — لا تُنشر على hissati
    open(os.path.join(H, 'worker', 'relay', 'dist', 'preview.js'), 'w', encoding='utf-8').write(re.sub(r'/\*HISSATI_HTML\*/.*?/\*END\*/', lambda m: '/*HISSATI_HTML*/' + jsstr(_dh) + '/*END*/', wk, count=1, flags=re.S))
print('hissati.html', round(len(hx.encode('utf-8')) / 1024), 'KB | worker/relay/dist/worker.js', round(len(wk.encode('utf-8')) / 1024), 'KB')
print('index.html (قالب المستخدمين)', round(len(user.encode('utf-8')) / 1024), 'KB | admin.html', round(len(admin.encode('utf-8')) / 1024), 'KB')
