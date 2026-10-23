# -*- coding: utf-8 -*-
"""يجمع المحرك والواجهة والبيانات والشعار في ملفين: admin.html (واجهة الإدارة) و index.html (قالب المستخدمين — يُفعَّل من ملف يصدّره المدير): py build_web.py"""
import os, json, base64
H = os.path.dirname(os.path.abspath(__file__)); R = lambda p: open(os.path.join(H, 'src', p), encoding='utf-8').read()
# خط الثيم الزجاجي (IBM Plex Sans Arabic — رخصة OFL في assets/fonts) مضمَّن data: بلا اتصال خارجي
RANGES = {'arabic': 'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200E,U+2010-2011,U+FB50-FDFF,U+FE70-FEFC', 'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'}
def font_css():
    out = ''
    for w in (400, 700):
        for sub, rng in RANGES.items():
            b = base64.b64encode(open(os.path.join(H, 'assets', 'fonts', 'ibm-plex-sans-arabic-%s-%d-normal.woff2' % (sub, w)), 'rb').read()).decode()
            out += "@font-face{font-family:'Hissa Plex';font-style:normal;font-display:swap;font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}\n" % (w, b, rng)
    return out
def build(mode, tpl):
    t = R('template.html').replace('/*MODE*/', json.dumps(mode)).replace('/*TPL*/', tpl).replace('/*CSS*/', R('style.css')).replace('/*THEMECSS*/', R('theme_linear.css') + font_css() + R('theme_glass.css')).replace('/*ASSETS*/', R('assets.js')).replace('/*DATA*/', R('data.json')).replace('/*ATHLETE*/', R('athlete.json'))
    for k, f in (('ICONS', 'icons.js'), ('DIGITS', 'digits.js'), ('ENGINE', 'engine.js'), ('ASSIST', 'assistant.js'), ('RECIPE', 'recipe.js'), ('DTICON', 'dt_icon.js'), ('NATIVE', 'native.js'), ('XLSXR', 'xlsx_read.js'), ('ATHIMP', 'athimport.js'), ('ATHENG', 'athlete.js'), ('DOCX', 'docx.js'), ('SEC', 'sec.js'), ('HXC', 'hx_crypto.js'), ('FORMS', 'forms.js'), ('APP', 'app.js'), ('AUTH', 'auth.js')): t = t.replace('/*%s*/' % k, R(f).replace('/*ATHUI*/', R('athlete_ui.js')).replace('/*ASSISTUI*/', R('assistant_ui.js')).replace('/*HUDUI*/', R('hud_ui.js')).replace('/*BANKUI*/', R('bank_ui.js')).replace('/*DAYSUI*/', R('daydist_ui.js')).replace('/*THEMEUI*/', R('theme_ui.js')).replace('/*SHELLUI*/', R('shell_ui.js')).replace('/*HXUI*/', R('hissati_ui.js')).replace('/*FORMSUI*/', R('forms_ui.js')).replace('/*VAULTUI*/', R('vault_ui.js')).replace('/*MEDUI*/', R('med_ui.js')).replace('/*FEEDUI*/', R('feed_ui.js')).replace('/*WORKUI*/', R('work_ui.js')).replace('/*RICHUI*/', R('rich_ui.js')).replace('/*CHALUI*/', R('chal_ui.js')) if k == 'APP' else R(f))
    t = t.replace('<script>/*ADMIN*/</script>', '<script>' + R('admin.js').replace("/*HISSA_SW*/''", json.dumps(R('hissa_sw.js'), ensure_ascii=False).replace('</', '<\\/')) + '</script>' if mode == 'admin' else '')
    return t
user = build('user', 'null'); admin = build('admin', json.dumps(user).replace('</', '<\\/'))
open(os.path.join(H, 'index.html'), 'w', encoding='utf-8').write(user); open(os.path.join(H, 'admin.html'), 'w', encoding='utf-8').write(admin)
# «حصتي»: تطبيق العميل ملف واحد (hissati.html)، ونسخة المحطة الوسيطة الجاهزة للصق في Cloudflare (worker/relay/dist/worker.js) وهي تقدّمه على «/»
import re
A = R('assets.js'); js = lambda k: json.loads('"' + re.search(k + r':"((?:[^"\\]|\\.)*)"', A).group(1) + '"')
hx = open(os.path.join(H, 'src', 'hissati', 'template.html'), encoding='utf-8').read().replace('/*FONT*/', font_css()).replace('/*CSS*/', R('hissati/style.css')).replace('/*THEMES*/', R('hissati/themes.css') + R('hissati/themes_glass.css') if os.path.exists(os.path.join(H, 'src', 'hissati', 'themes_glass.css')) else R('hissati/themes.css')).replace('/*MOTION*/', R('hissati/motion.js')).replace('/*LOGO*/', json.dumps(js('logoSvg'), ensure_ascii=False).replace('</', '<\\/')).replace('/*HXC*/', R('hx_crypto.js')).replace('/*FORMS*/', R('forms.js')).replace('/*APP*/', R('hissati/app.js'))
open(os.path.join(H, 'hissati.html'), 'w', encoding='utf-8').write(hx)
jsstr = lambda v: json.dumps(v, ensure_ascii=False).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
wk = open(os.path.join(H, 'worker', 'relay', 'index.mjs'), encoding='utf-8').read()
wk = re.sub(r'/\*HISSATI_HTML\*/.*?/\*END\*/', lambda m: '/*HISSATI_HTML*/' + jsstr(hx) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*HISSATI_ICONS\*/.*?/\*END\*/', lambda m: '/*HISSATI_ICONS*/' + json.dumps({k: base64.b64encode(open(os.path.join(H, 'assets', 'hissati', k + '.png'), 'rb').read()).decode().replace('+', '-').replace('/', '_').rstrip('=') for k in [n + t for t in ('', '-rose', '-pulse') for n in ('icon-192', 'icon-512', 'maskable-512', 'apple-180')]}) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*HISSATI_SW\*/.*?/\*END\*/', lambda m: '/*HISSATI_SW*/' + jsstr(R('hissati/sw.js')) + '/*END*/', wk, count=1, flags=re.S)
wk = re.sub(r'/\*HISSATI_ICON\*/.*?/\*END\*/', lambda m: '/*HISSATI_ICON*/' + jsstr(js('icon').split(',', 1)[1]) + '/*END*/', wk, count=1, flags=re.S)
os.makedirs(os.path.join(H, 'worker', 'relay', 'dist'), exist_ok=True); open(os.path.join(H, 'worker', 'relay', 'dist', 'worker.js'), 'w', encoding='utf-8').write(wk)
print('hissati.html', round(len(hx.encode('utf-8')) / 1024), 'KB | worker/relay/dist/worker.js', round(len(wk.encode('utf-8')) / 1024), 'KB')
print('index.html (قالب المستخدمين)', round(len(user.encode('utf-8')) / 1024), 'KB | admin.html', round(len(admin.encode('utf-8')) / 1024), 'KB')
