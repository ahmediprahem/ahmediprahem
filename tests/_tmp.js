// مساعد الاختبارات: مجلد مؤقت محمول (بدل /tmp الثابت) وتحويل المسارات إلى روابط file:// صحيحة على كل الأنظمة.
const os = require('os'), path = require('path'), fs = require('fs'), url = require('url');
const TMP = path.join(os.tmpdir(), 'hessa-tests'); fs.mkdirSync(TMP, { recursive: true });
module.exports = { TMP, fileUrl: (p) => url.pathToFileURL(p).href, PY: process.platform === 'win32' ? 'python' : 'python3' };
