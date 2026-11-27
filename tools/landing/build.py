# يبني صفحة استقبال «زنها Pro» إلى worker/landing/public (أصول ثابتة فقط)
import os, shutil, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); P = lambda *a: os.path.join(ROOT, *a)
OUT = P('worker', 'landing', 'public'); APP = os.environ.get('APPURL', 'https://hessanu.ah6171317.workers.dev/')
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(os.path.join(OUT, 'img')); os.makedirs(os.path.join(OUT, 'fonts'))
logo = open(P('assets', 'zenha', 'pro_logo.svg'), encoding='utf-8').read(); logo = re.sub(r'<\?xml[^>]*>', '', logo).strip()
h = open(P('src', 'landing', 'index.html'), encoding='utf-8').read()
h = h.replace('/*PROLOGO*/', logo.replace('<svg ', '<svg style="color:#16324A" ', 1)).replace('/*PROLOGO_DARK*/', logo.replace('<svg ', '<svg style="color:#fff" ', 1).replace('id="pzg"', 'id="pzg2"').replace('url(#pzg)', 'url(#pzg2)').replace('id="pzs"', 'id="pzs2"').replace('url(#pzs)', 'url(#pzs2)')).replace('/*APPURL*/', APP)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(h)
for pg in ('privacy', 'terms'):      # صفحات مطلوبة لنشر تطبيق Google OAuth
    q = open(P('src', 'landing', pg + '.html'), encoding='utf-8').read(); q = q.replace('/*PROLOGO*/', logo.replace('<svg ', '<svg style="color:#16324A" ', 1)).replace('/*PROLOGO_DARK*/', logo.replace('<svg ', '<svg style="color:#fff" ', 1).replace('id="pzg"', 'id="pzg2"').replace('url(#pzg)', 'url(#pzg2)').replace('id="pzs"', 'id="pzs2"').replace('url(#pzs)', 'url(#pzs2)')).replace('/*APPURL*/', APP)
    open(os.path.join(OUT, pg + '.html'), 'w', encoding='utf-8').write(q)
for f in os.listdir(P('src', 'landing', 'img')): shutil.copy(P('src', 'landing', 'img', f), os.path.join(OUT, 'img', f))
shutil.copy(P('assets', 'zenha', 'pro_mark.svg'), os.path.join(OUT, 'img', 'mark.svg'))
F = {'plex-ar-400': 'ibm-plex-sans-arabic-arabic-400-normal', 'plex-ar-700': 'ibm-plex-sans-arabic-arabic-700-normal', 'plex-lat-400': 'ibm-plex-sans-arabic-latin-400-normal', 'plex-lat-700': 'ibm-plex-sans-arabic-latin-700-normal', 'head-ar': 'alexandria-arabic-500-800', 'head-lat': 'alexandria-latin-500-800'}
for k, v in F.items(): shutil.copy(P('assets', 'fonts', v + '.woff2'), os.path.join(OUT, 'fonts', k + '.woff2'))
open(os.path.join(OUT, '_headers'), 'w').write('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/img/*\n  Cache-Control: public, max-age=604800\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n')
print('landing ->', OUT, sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs) // 1024, 'KB')
