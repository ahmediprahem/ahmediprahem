# -*- coding: utf-8 -*-
"""يجمع المحرك والواجهة والبيانات والشعار في ملفين: admin.html (واجهة الإدارة) و index.html (قالب المستخدمين — يُفعَّل من ملف يصدّره المدير): py build_web.py"""
import os, json
H = os.path.dirname(os.path.abspath(__file__)); R = lambda p: open(os.path.join(H, 'src', p), encoding='utf-8').read()
def build(mode, tpl):
    t = R('template.html').replace('/*MODE*/', json.dumps(mode)).replace('/*TPL*/', tpl).replace('/*CSS*/', R('style.css')).replace('/*THEMECSS*/', R('theme_linear.css')).replace('/*ASSETS*/', R('assets.js')).replace('/*DATA*/', R('data.json')).replace('/*ATHLETE*/', R('athlete.json'))
    for k, f in (('ENGINE', 'engine.js'), ('ASSIST', 'assistant.js'), ('RECIPE', 'recipe.js'), ('DTICON', 'dt_icon.js'), ('NATIVE', 'native.js'), ('XLSXR', 'xlsx_read.js'), ('ATHIMP', 'athimport.js'), ('ATHENG', 'athlete.js'), ('DOCX', 'docx.js'), ('SEC', 'sec.js'), ('APP', 'app.js'), ('AUTH', 'auth.js')): t = t.replace('/*%s*/' % k, R(f).replace('/*ATHUI*/', R('athlete_ui.js')).replace('/*ASSISTUI*/', R('assistant_ui.js')).replace('/*HUDUI*/', R('hud_ui.js')).replace('/*BANKUI*/', R('bank_ui.js')).replace('/*DAYSUI*/', R('daydist_ui.js')).replace('/*THEMEUI*/', R('theme_ui.js')) if k == 'APP' else R(f))
    t = t.replace('<script>/*ADMIN*/</script>', '<script>' + R('admin.js') + '</script>' if mode == 'admin' else '')
    return t
user = build('user', 'null'); admin = build('admin', json.dumps(user).replace('</', '<\\/'))
open(os.path.join(H, 'index.html'), 'w', encoding='utf-8').write(user); open(os.path.join(H, 'admin.html'), 'w', encoding='utf-8').write(admin)
print('index.html (قالب المستخدمين)', round(len(user.encode('utf-8')) / 1024), 'KB | admin.html', round(len(admin.encode('utf-8')) / 1024), 'KB')
