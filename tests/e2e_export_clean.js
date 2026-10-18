// ملفات العميل (Word وHTML) لنظامَي الحصص والرياضيين: لا إرشادات داخلية للأخصائي، ولا قيم فارغة، والرياضي فيه «(1 كوب = 158 جم)».
const { TMP, fileUrl, PY } = require('./_tmp.js');
const { chromium } = require('playwright'); const fs = require('fs'), assert = require('assert'), path = require('path'), zlib = require('zlib'), cp = require('child_process'), login = require('./auth_helper');
let n = 0; const ok = (m) => { n++; console.log('✔', m); }, errs = [];
// ملاحظة: «المحرك الرئيسي للتركيب» جملة تدريبية مشروعة للعميل، لذلك يُمنع فقط وصف المحرك الداخلي للنظام
const FORBID = [/توزيع الحصص على الأيام/, /gdw|gdscroll|data-dg/, /هدف الحصص اليوم/, /هدف التوزيع اليومي/, /hudr|hudq/, /dt\/hamed/, /dtfab/, /dtp\b/, /🤖/, /يقترح (البرنامج|النظام)/, /تلقائياً/, /التوزيع الحالي/, /\(?يدوي\)?/, /اضغط/, /انقر/, /للأخصائي/, /محرك (الحصص|النظام|التخطيط)|المحرك (الذكي|الحسابي|الداخلي)/, /غير محدد/, /undefined/, /NaN/, /\[object/];
const wordText = (f) => cp.execFileSync('python3', ['-c', "import zipfile,re,sys;x=zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode('utf8');print('\\n'.join(re.sub(r'<[^>]+>','',m).strip() for m in re.findall(r'<w:p[ >].*?</w:p>',x,flags=re.S)))", f]).toString();
const htmlText = (f) => fs.readFileSync(f, 'utf8').replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1300, height: 950 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto(fileUrl(path.resolve(__dirname, '../admin.html'))); await login(p);
  const out = {};
  for (const kind of ['exchange', 'athlete']) {
    if (kind === 'exchange') { await p.click('button:has-text("عميل جديد")'); await p.fill('[data-f="name"]', 'سارة'); await p.press('[data-f="name"]', 'Tab'); } else { await p.click('button:has-text("عميل رياضي")'); await p.waitForSelector('#atg'); await p.fill('[data-f="name"]', 'أحمد'); await p.press('[data-f="name"]', 'Tab'); }
    await p.click('button:has-text("ولّد الخطة")'); await p.waitForSelector('.pnav button');
    const [w] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("تصدير Word")')]); await w.saveAs(TMP + '/ec_' + kind + '.docx'); const [h] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("صفحة HTML للعميل")')]); await h.saveAs(TMP + '/ec_' + kind + '.html');
    out[kind] = { word: wordText(TMP + '/ec_' + kind + '.docx'), html: htmlText(TMP + '/ec_' + kind + '.html') };
  }
  for (const kind of ['exchange', 'athlete']) for (const fmt of ['word', 'html']) { const t = out[kind][fmt]; assert(t.length > 3000, kind + ' ' + fmt + ' قصير'); for (const re of FORBID) { const m = re.exec(t); assert(!m, kind + ' ' + fmt + ': عبارة داخلية «' + (m && m[0]) + '» في: …' + (m && t.slice(Math.max(0, m.index - 40), m.index + 60))); } }
  ok('ملفات Word وHTML للعميل (الحصص والرياضيين) خالية من أي أثر للمساعد dt/hamed ومن إرشادات النظام للأخصائي، ومن «غير محدد» و«undefined» و«NaN»');
  const rows = out.athlete.word.split('\n').filter(l => l.startsWith('•')); assert(rows.length > 40); const withDef = rows.filter(l => /\(\d[\d.½¼¾⅓⅔]*\s+[^()=]+=\s*[\d.]+ جم\)/.test(l)); console.log('   أصناف Word الرياضي:', rows.length, '| بتعريف حصة بين قوسين:', withDef.length); assert(withDef.length / rows.length > 0.5); ok('Word الرياضي: مقدار الحصة المنزلية بين قوسين بجوار الصنف، مثل «' + withDef[0].replace(/\s+/g, ' ').slice(0, 70) + '»');
  assert(/يمكنك استبدال الحصص من جدول البدائل/.test(out.exchange.word)); ok('جملة العميل «يمكنك استبدال الحصص من جدول البدائل» باقية (موجَّهة للعميل لا للأخصائي)');
  assert.deepStrictEqual(errs, []); ok('لا أخطاء في وحدة التحكم'); console.log('\nنجح', n, 'اختبارات نظافة الملفات المُصدَّرة'); await b.close();
})().catch(e => { console.log('✘', String(e).slice(0, 900)); process.exit(1); });
