// بديل D1 للاختبارات فوق node:sqlite (نفس واجهة Workers: prepare().bind().first()/all()/run() و batch) فيُختبر SQL المحطة الحقيقي محلياً
const { DatabaseSync } = require('node:sqlite');
module.exports = function d1() {
  const db = new DatabaseSync(':memory:');
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a),
    first: async () => { const r = db.prepare(q).get(...args); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(q).all(...args).map((r) => ({ ...r })) }),
    run: async () => { const r = db.prepare(q).run(...args); return { success: true, meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
    _exec: () => db.prepare(q).run(...args)
  });
  return { prepare: (q) => stmt(q), batch: async (list) => { db.exec('BEGIN'); try { const out = list.map((s) => s._exec()); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } }, _raw: db };
};
