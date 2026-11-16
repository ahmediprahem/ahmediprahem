# رفع حزمة الملصقات (design/stickers/stickers.json) إلى قاعدة D1 «hissati» حيث تقدّمها المحطة على /v1/st.
# التشغيل بعد tools/stickers_build.py:  python3 tools/stickers_upload.py   (يحتاج CLOUDFLARE_ACCOUNT_ID وCLOUDFLARE_API_TOKEN)
import os, json, hashlib, urllib.request

H = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ACC, TOK = os.environ['CLOUDFLARE_ACCOUNT_ID'], os.environ['CLOUDFLARE_API_TOKEN']
API = 'https://api.cloudflare.com/client/v4/accounts/' + ACC + '/d1/database'
CH = 700000

def call(url, body=None):
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method='POST' if body is not None else 'GET', headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    j = json.load(urllib.request.urlopen(r, timeout=120))
    if not j.get('success'): raise SystemExit(str(j.get('errors')))
    return j['result']

def chunks(s): return [s[i:i + CH] for i in range(0, len(s), CH)]

def main():
    db = [x for x in call(API + '?per_page=100') if x['name'] == 'hissati'][0]['uuid']; q = API + '/' + db + '/query'
    s = open(os.path.join(H, 'design', 'stickers', 'stickers.json'), encoding='utf-8').read(); ver = hashlib.sha256(s.encode()).hexdigest()[:12]; parts = chunks(s)
    call(q, {'sql': 'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)'})
    call(q, {'sql': "DELETE FROM kv WHERE k = 'st.n'"})                              # الحزمة غير متاحة أثناء الرفع (تعرض المحطة حزمة فارغة لا ناقصة)
    call(q, {'sql': "DELETE FROM kv WHERE k LIKE 'st.%'"})
    for i, p in enumerate(parts): call(q, {'sql': 'INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', 'params': ['st.' + str(i), p]})
    call(q, {'sql': 'INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', 'params': ['st.n', str(len(parts)) + '|' + ver]})
    print('رُفعت الحزمة:', len(parts), 'أجزاء، الإصدار', ver, len(s) // 1024, 'KB')

if __name__ == '__main__': main()
