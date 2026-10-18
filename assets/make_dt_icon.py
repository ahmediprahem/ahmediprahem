# يولّد src/dt_icon.js (أيقونة المساعد dt/hamed مضمَّنة base64) من الصورة المصدر. الاستعمال: python3 assets/make_dt_icon.py
import base64, io, os
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); src = Image.open(os.path.join(H, 'dt_hamed_source.jpg')).convert('RGB')
box = (170, 40, 850, 720)                                # مربع يضم الوجه والكتفين والجهاز اللوحي وشارة AI
ic = src.crop(box).resize((192, 192), Image.LANCZOS); buf = io.BytesIO(); ic.save(buf, 'JPEG', quality=88, optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
open(os.path.join(H, '..', 'src', 'dt_icon.js'), 'w', encoding='utf-8').write("window.DT_ICON='data:image/jpeg;base64,%s';\n" % b64)
print('dt_icon.js', round(len(b64) / 1024, 1), 'KB (base64)')
