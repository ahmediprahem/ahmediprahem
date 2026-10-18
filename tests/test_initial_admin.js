'use strict';
const { TMP, fileUrl, PY } = require('./_tmp.js');
const assert = require('assert'), fs = require('fs'), path = require('path'), cp = require('child_process'), H = require('../src/sec.js'); H.ITER = 150000;
let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('✔', name); } catch (e) { console.log('✘', name, '\n   ', e.message.slice(0, 400)); process.exitCode = 1; } };
const OUT = TMP + '/ia', gen = (...args) => cp.spawnSync('node', [path.join(__dirname, '../make_initial_admin.js'), ...args], { env: Object.assign({}, process.env, { HISSA_OUT: OUT }), encoding: 'utf8' });
(async () => {
  await t('المولّد ينتج admin_initial.html بحساب مدير أولي: الكلمة تفتح مفتاح التوقيع والخاطئة لا تفتحه، ولا تُخزَّن الكلمة في الملف', async () => {
    const r = gen('hamed', 'Init#Pass-2026'); assert.strictEqual(r.status, 0, r.stderr); const html = fs.readFileSync(OUT + '/admin_initial.html', 'utf8'); assert(!html.includes('Init#Pass-2026'), 'كلمة السر ظاهرة في الملف');
    assert.strictEqual((html.match(/window\.ADMIN_SEED=\{/g) || []).length, 1); const m = /window\.ADMIN_SEED=(\{.*?\});window\.BASE_SETTINGS/s.exec(html), seed = JSON.parse(m[1]); assert.strictEqual(seed.user, 'hamed'); assert(seed.wrap && seed.pub && seed.saltD && seed.wrap.iter === 150000);
    const priv = await H.unwrapPriv(seed.wrap, 'Init#Pass-2026'); let bad = null; try { await H.unwrapPriv(seed.wrap, 'Init#Pass-2027'); } catch (e) { bad = e; } assert(bad, 'كلمة خاطئة فتحت المفتاح');
    const tk = await H.issue(priv, Object.assign({ username: 'u', name: 'u' }, await H.makeVerifier('x')), 'DEVICE123456', 5); assert.strictEqual((await H.verify(seed.pub, tk)).u, 'u'); });
  await t('نسخة المستخدمين المضمَّنة داخل الملف لا تحمل الحساب الأولي (ADMIN_SEED=null داخل القالب)', () => { const html = fs.readFileSync(OUT + '/admin_initial.html', 'utf8'), tpl = html.slice(html.indexOf('window.USER_TPL=')); assert(tpl.includes('window.ADMIN_SEED=null;'), 'قالب المستخدمين يحوي بذرة'); assert(!/ADMIN_SEED=\{/.test(tpl)); });
  await t('كل تشغيل يولّد مفاتيح وكلمة سر مختلفة عند عدم تحديدها، والكلمة قوية الصيغة؛ والمدخلات الضعيفة تُرفض', () => { const a = gen('hamed'), b = gen('hamed'); const pa = /كلمة السر الابتدائية: (\S+)/.exec(a.stdout)[1], pb = /كلمة السر الابتدائية: (\S+)/.exec(b.stdout)[1]; assert.notStrictEqual(pa, pb); assert(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(pa), pa); assert.strictEqual(gen('ab', 'longenough').status, 2); assert.strictEqual(gen('hamed', 'short').status, 2); assert(fs.readFileSync(OUT + '/ADMIN_INITIAL_LOGIN.txt', 'utf8').includes(pb)); gen('hamed', 'Init#Pass-2026'); });
  console.log('\nنجح', n, 'اختبارات حساب المدير الأولي');
})();
