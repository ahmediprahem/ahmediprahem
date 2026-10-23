'use strict';
// اتساق «حصتي» و«حصة»: كل عادة في مكتبة «حصتي» معروفة عند الأخصائي (ملخص المتابعة + محرر التحديات)، ومجموع أذكار المساء متطابق، وقوالب المكتبة تستعمل عادات موجودة.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const R = (f) => fs.readFileSync(path.join(__dirname, '../src/' + f), 'utf8'); let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 400)); process.exitCode = 1; } };
const app = R('hissati/app.js'), ids = [...app.slice(app.indexOf('const HABITS = ['), app.indexOf('const HB = ')).matchAll(/\{ id: '(\w+)'/g)].map((m) => m[1]);
const adh = vm.runInNewContext(app.slice(app.indexOf('const ADHKAR = ['), app.indexOf('const adhList')) + ';[ADH_TOTAL, ADH_PM_TOTAL]');
t('مكتبة «حصتي»: 21 عادة (11 + 10 جديدة)', () => { assert.strictEqual(ids.length, 21, ids.join()); assert.strictEqual(new Set(ids).size, 21); });
t('كل عادة معروفة في محرر التحديات وملخص المتابعة وتعليقات الاحتفال والتحديات في «حصتي»', () => {
  const ch = R('chal_ui.js'), hx = R('hissati_ui.js'), g = ch.slice(ch.indexOf('var CH_G'), ch.indexOf('var CH_DEF')), hb = hx.slice(hx.indexOf('var HX_HB'), hx.indexOf('function hxHabits')), chg = app.slice(app.indexOf('const CHG ='), app.indexOf('const PHRASES')), cheer = app.slice(app.indexOf('const CHEER'), app.indexOf('function celebrate'));
  ids.forEach((id) => { if (id !== 'water') { assert(new RegExp('\\b' + id + ':').test(hb), 'ملخص المتابعة ينقصه ' + id); assert(new RegExp('\\b' + id + ':').test(cheer) || id === 'water' || id === 'coffee', 'احتفال ' + id); } assert(new RegExp('\\b' + id + ':').test(g), 'محرر التحديات ينقصه ' + id); assert(new RegExp('\\b' + id + ':').test(chg), 'CHG ينقصه ' + id); });
});
t('أذكار الصباح 254 والمساء متطابقان بين «حصتي» و«حصة»', () => { assert.strictEqual(adh[0], 254); const ch = R('chal_ui.js'), hx = R('hissati_ui.js'); assert(new RegExp('CH_ADH_PM = ' + adh[1] + ';').test(ch), 'CH_ADH_PM ≠ ' + adh[1]); assert(hx.includes('n >= ' + adh[1]) && hx.includes('/ ' + adh[1]), 'ملخص المتابعة'); });
t('مكتبة التحديات: 10 قوالب بمعرّفات فريدة وعادات موجودة وأسابيع 1–4 وأهداف بأيام 1–7', () => {
  const ch = R('chal_ui.js'), lib = vm.runInNewContext(ch.slice(ch.indexOf('var CH_LIB = ['), ch.indexOf('function chLibList')) + ';CH_LIB'); assert.strictEqual(lib.length, 10); assert.strictEqual(new Set(lib.map((x) => x.id)).size, 10);
  lib.forEach((x) => { assert(x.weeks.length >= 1 && x.weeks.length <= 4); x.weeks.forEach((w) => { assert(w.title && w.msg && w.goals.length >= 1); w.goals.forEach((gl) => { assert(ids.includes(gl.h) || gl.h === 'plan', x.id + ': ' + gl.h); assert(gl.d >= 1 && gl.d <= 7 && gl.v > 0); }); }); });
});
console.log('\nنجح', n, 'اختبارات اتساق العادات والتحديات');
