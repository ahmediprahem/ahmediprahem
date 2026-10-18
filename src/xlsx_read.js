/* قارئ xlsx وcsv بلا مكتبات: ZIP + DecompressionStream + تحليل XML بالتعابير النمطية. يعمل في المتصفح وNode. */
(function (root) {
  'use strict';
  var td = new TextDecoder('utf-8'), X = {};
  var u16 = function (b, o) { return b[o] | (b[o + 1] << 8); }, u32 = function (b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; };
  async function inflate(raw) {
    if (typeof DecompressionStream === 'undefined') throw new Error('هذا المتصفح لا يدعم قراءة xlsx — احفظ الملف بصيغة CSV أو استعمل Chrome/Edge حديثاً');
    var s = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return new Uint8Array(await new Response(s).arrayBuffer());
  }
  function entries(b) {
    var i = b.length - 22; for (; i >= 0; i--) if (u32(b, i) === 0x06054b50) break; if (i < 0) throw new Error('الملف ليس xlsx صالحاً');
    var n = u16(b, i + 10), p = u32(b, i + 16), ents = {};
    for (var k = 0; k < n; k++) { if (u32(b, p) !== 0x02014b50) throw new Error('بنية xlsx تالفة'); var nl = u16(b, p + 28), el = u16(b, p + 30), cl = u16(b, p + 32); ents[td.decode(b.subarray(p + 46, p + 46 + nl))] = { method: u16(b, p + 10), csz: u32(b, p + 20), lho: u32(b, p + 42) }; p += 46 + nl + el + cl; }
    return ents;
  }
  async function readEntry(b, e) { var lh = e.lho, start = lh + 30 + u16(b, lh + 26) + u16(b, lh + 28), raw = b.subarray(start, start + e.csz); if (e.method === 0) return raw; if (e.method === 8) return inflate(raw); throw new Error('طريقة ضغط غير مدعومة'); }
  var ent = function (s) { return s.indexOf('&') < 0 ? s : s.replace(/&#x([0-9a-fA-F]+);/g, function (_, h) { return String.fromCodePoint(parseInt(h, 16)); }).replace(/&#(\d+);/g, function (_, d) { return String.fromCodePoint(+d); }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&'); };
  var colIdx = function (s) { var n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n - 1; };
  function sharedStrings(xml) { var out = [], re = /<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g, m; while ((m = re.exec(xml))) { var s = '', tr = /<t\b[^>]*?>([\s\S]*?)<\/t>/g, t; while ((t = tr.exec(m[1] || ''))) s += t[1]; out.push(ent(s)); } return out; }
  function parseSheet(xml, sst) {
    var rows = [], rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, m, rn = 0;
    while ((m = rowRe.exec(xml))) {
      var rr = /\br="(\d+)"/.exec(m[1]), ri = rr ? +rr[1] - 1 : rn, row = [], cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, c, body = m[2] || '';
      while ((c = cRe.exec(body))) {
        var at = c[1], inner = c[2] || '', ref = /\br="([A-Z]+)\d+"/.exec(at), col = ref ? colIdx(ref[1]) : row.length, tt = /\bt="(\w+)"/.exec(at), t = tt ? tt[1] : '', v = null, vm;
        if (t === 's') { vm = /<v>(\d+)<\/v>/.exec(inner); v = vm ? (sst[+vm[1]] === undefined ? null : sst[+vm[1]]) : null; }
        else if (t === 'inlineStr') { var s2 = '', tr = /<t\b[^>]*?>([\s\S]*?)<\/t>/g, tm; while ((tm = tr.exec(inner))) s2 += tm[1]; v = ent(s2); }
        else { vm = /<v>([\s\S]*?)<\/v>/.exec(inner); if (vm) { v = ent(vm[1]); if (t === 'b') v = v === '1'; else if (t !== 'str' && t !== 'e') { var nn = +v; if (!isNaN(nn) && v !== '') v = nn; } } }
        row[col] = v;
      }
      for (var j = 0; j < row.length; j++) if (row[j] === undefined) row[j] = null; rows[ri] = row; rn = ri + 1;
    }
    for (var k = 0; k < rows.length; k++) if (!rows[k]) rows[k] = []; return rows;
  }
  X.openXlsx = async function (buf) {                      // buf: ArrayBuffer | Uint8Array → { names, sheet(name) → rows }
    var b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), ents = entries(b), get = async function (n) { return ents[n] ? td.decode(await readEntry(b, ents[n])) : null; };
    var wb = await get('xl/workbook.xml'), rels = await get('xl/_rels/workbook.xml.rels'); if (!wb || !rels) throw new Error('الملف ليس مصنّف Excel صالحاً');
    var target = {}, rm, rre = /<Relationship\b([^>]*?)\/?>/g; while ((rm = rre.exec(rels))) { var id = /\bId="([^"]*)"/.exec(rm[1]), tg = /\bTarget="([^"]*)"/.exec(rm[1]); if (id && tg) target[id[1]] = tg[1].replace(/^\/?(xl\/)?/, 'xl/'); }
    var sheets = [], sm, sre = /<sheet\b([^>]*?)\/?>/g; while ((sm = sre.exec(wb))) { var nm = /\bname="([^"]*)"/.exec(sm[1]), rid = /\br:id="([^"]*)"/.exec(sm[1]); if (nm && rid && target[rid[1]]) sheets.push({ name: ent(nm[1]), path: target[rid[1]] }); }
    var ss = await get('xl/sharedStrings.xml'), sst = ss ? sharedStrings(ss) : [], cache = {};
    return { names: sheets.map(function (s) { return s.name; }), sheet: async function (name) { if (cache[name]) return cache[name]; var s = sheets.filter(function (x) { return x.name === name; })[0]; if (!s) throw new Error('لا توجد ورقة باسم ' + name); var xml = await get(s.path); return (cache[name] = parseSheet(xml, sst)); } };
  };
  X.parseCSV = function (text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); var first = text.split(/\r?\n/)[0] || '', cnt = function (ch) { return first.split(ch).length - 1; }, delim = [',', ';', '\t'].sort(function (a, b) { return cnt(b) - cnt(a); })[0];
    var rows = [], row = [], cur = '', q = false, i = 0, n = text.length; for (; i < n; i++) { var ch = text[i]; if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === delim) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; rows.push(row); row = []; } else cur += ch; }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); } return rows.filter(function (r) { return r.some(function (v) { return String(v).trim() !== ''; }); });
  };
  X.openFile = async function (name, buf) {                // يعيد نفس الواجهة لـ xlsx وcsv
    if (/\.csv$|\.txt$/i.test(name)) { var rows = X.parseCSV(td.decode(buf instanceof Uint8Array ? buf : new Uint8Array(buf))); return { names: ['CSV'], sheet: async function () { return rows; } }; }
    return X.openXlsx(buf);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = X; else root.XLSXRead = X;
})(typeof window !== 'undefined' ? window : globalThis);
