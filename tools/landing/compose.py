# تركيب الشاشات الحقيقية على الشاشات الخضراء في صور صفحة الاستقبال (منظور + قناع + إزالة الأثر الأخضر) ثم WebP مضغوط
import sys, os, numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); A = lambda f: os.path.join(ROOT, 'assets/login', f)
SH, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
def green_mask(im):
    a = np.asarray(im.convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (g > 185) & (r < 110) & (b < 110) & (g - r > 110)
def corners(m):
    ys, xs = np.nonzero(m); s, d = xs + ys, xs - ys
    return [(xs[s.argmin()], ys[s.argmin()]), (xs[d.argmax()], ys[d.argmax()]), (xs[s.argmax()], ys[s.argmax()]), (xs[d.argmin()], ys[d.argmin()])]  # أعلى-يسار، أعلى-يمين، أسفل-يمين، أسفل-يسار
def coeffs(dst, src):
    M = []; B = []
    for (x, y), (u, v) in zip(dst, src):
        M += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; B += [u, v]
    return np.linalg.solve(np.array(M, float), np.array(B, float)).tolist()
def place(base, scr, out, grow=2, fit='cover'):
    im = Image.open(A(base)).convert('RGB'); m = green_mask(im); q = corners(m)
    # توسيع بسيط للقناع ليغطي الحافة المضادة للتعرج
    mi = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(2 * grow + 1)).filter(ImageFilter.GaussianBlur(0.8))
    s = Image.open(scr).convert('RGB'); W = int(max(np.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), np.hypot(q[2][0] - q[3][0], q[2][1] - q[3][1]))); H = int(max(np.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]), np.hypot(q[2][0] - q[1][0], q[2][1] - q[1][1])))
    r = max(W / s.width, H / s.height); s = s.resize((max(W, int(s.width * r)), max(H, int(s.height * r))), Image.LANCZOS); s = s.crop((0, 0, W, H)) if fit == 'top' else s.crop(((s.width - W) // 2, (s.height - H) // 2, (s.width - W) // 2 + W, (s.height - H) // 2 + H))
    src = [(0, 0), (W, 0), (W, H), (0, H)]; pad = grow
    dst = [(q[0][0] - pad, q[0][1] - pad), (q[1][0] + pad, q[1][1] - pad), (q[2][0] + pad, q[2][1] + pad), (q[3][0] - pad, q[3][1] + pad)]
    warped = s.transform(im.size, Image.PERSPECTIVE, coeffs(dst, src), Image.BICUBIC)
    res = Image.composite(warped, im, mi)
    a = np.asarray(res).astype(int); edge = (np.asarray(mi) > 0) & (np.asarray(mi) < 255) | (green_mask(res))      # إزالة أي أثر أخضر متبقٍ على الحواف
    g = a[..., 1]; lim = np.maximum(a[..., 0], a[..., 2]) + 10; a[..., 1] = np.where(edge & (g > lim), lim, g)
    Image.fromarray(a.clip(0, 255).astype('uint8')).save(os.path.join(OUT, out), 'WEBP', quality=84, method=6); print(out, q)
def plain(base, out, w=None):
    im = Image.open(A(base)).convert('RGB')
    if w and im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, out), 'WEBP', quality=82, method=6)
S = lambda f: os.path.join(SH, f)
place('1_dietitian_laptop.webp', S('pro_home.png'), 'hero.webp', fit='top')
for n in ['pro_home', 'pro_client']: place('5_desk_laptop.webp', S(n + '.png'), 'desk_' + n[4:] + '.webp', fit='top')
place('2_client_cooking.webp', S('app_today.png'), 'cook.webp', fit='top')
for n in ['app_today', 'app_plate', 'app_ai_meal']: place('3_hand_phone.webp', S(n + '.png'), 'hand_' + n[4:] + '.webp', fit='top')
place('7_ai_hero.webp', S('vf.png'), 'ai_hero.webp'); place('8a_ai_meal.webp', S('vf.png'), 'ai_meal.webp')
place('8b_ai_supp.webp', S('app_ai_supp.png'), 'ai_supp.webp', fit='top'); place('8c_ai_fridge.webp', S('app_ai_store.png'), 'ai_store.webp', fit='top')
plain('6_session.webp', 'session.webp', 1600); plain('4_plate.webp', 'plate.webp', 900)
