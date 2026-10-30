// مساعد مشترك (0.49+): محطة محلية + «حصة» على موقع محلي + «حصتي» على iPhone، ثم دعوة وتسجيل واعتماد وخطة مُرسلة.
const { fileUrl, TMP } = require('./_tmp.js');
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs'), http = require('http'), login = require('./auth_helper'), d1 = require('./d1_shim.js');
module.exports = async function linked(tag, errs, opts) {
  opts = opts || {};
  const wf = path.join(TMP, 'relay_worker_' + tag + '.mjs'); fs.copyFileSync(path.resolve(__dirname, '../worker/relay/dist/worker.js'), wf);
  const W = await import(fileUrl(wf)), env = { DB: d1(), REG_KEY: 'clinic-key' };
  const srv = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
    const r = await W.default.fetch(new Request('http://127.0.0.1:' + srv.address().port + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : body }), env);
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const RELAY = 'http://127.0.0.1:' + srv.address().port;
  const site = http.createServer((q, r) => { const f = { '/': '../admin.html', '/sw.js': '../src/hissa_sw.js' }[q.url.split('?')[0]]; if (!f) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' }); r.end(fs.readFileSync(path.resolve(__dirname, f))); });
  await new Promise((r) => site.listen(0, '127.0.0.1', r)); const SITE = 'http://127.0.0.1:' + site.address().port;
  const b = await chromium.launch(), dctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }), d = await dctx.newPage(); d.on('pageerror', (e) => errs.push('حصة: ' + e)); d.on('dialog', (x) => x.accept(x.type() === 'prompt' ? (globalThis.PR || '') : undefined));
  const mctx = await b.newContext({ ...devices['iPhone 13'] }); await mctx.addInitScript(() => { try { localStorage.setItem('hissati_onb', '1'); } catch (e) { } }); const m = await mctx.newPage(); m.on('pageerror', (e) => errs.push('حصتي: ' + e)); m.on('dialog', (x) => x.accept());
  const hxCheck = async () => { await d.click('main [data-a="hxCheck"]'); await d.waitForFunction(() => ![...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('جارٍ التحقق')), null, { timeout: 8000 }); await d.waitForTimeout(300); };
  const cPoll = async () => { await m.evaluate(() => window.HissatiApp.flush()); await m.evaluate(() => window.HissatiApp.poll()); await m.waitForTimeout(250); };
  const C = () => d.evaluate(() => JSON.parse(JSON.stringify(DPApp.S.clients.find((x) => x.code === DPApp.S.cur) || DPApp.S.clients[0])));
  await d.goto(SITE + '/'); await login(d); await d.click('.rail [data-a="settings"]'); await d.click('[data-a="setTab"][data-v="hx"]');
  await d.fill('#hx_relay', RELAY); await d.fill('#hx_key', 'clinic-key'); await d.fill('#hx_name', 'د. أحمد حامد'); await d.click('[data-a="hxReg"]'); await d.waitForSelector('main .ok');
  await d.click('.rail [data-a="hxv"]'); await d.click('main [data-a="hxInvForm"]'); await d.fill('#hxi_l', 'منى علي'); await d.fill('#hxi_p', '01001234567'); await d.click('[data-a="hxInvMake"]');
  await d.waitForSelector('.hxinv.made .hxlink'); const link = (await d.textContent('.hxinv.made .hxlink')).trim();
  await m.goto(link); await m.waitForSelector('.invite .dr'); await m.click('[data-act="go"][data-v="pin"]'); for (const k of '12341234') await m.click(`.pad [data-v="${k}"]`); await m.waitForSelector('.prog');
  await m.fill('#f_phone', '01001234567'); await m.fill('#f_age', '34'); await m.fill('#f_weight', '88'); await m.fill('#f_height', '162');
  if (opts.wizard) await opts.wizard(m);
  for (let i = 0; i < 14 && !(await m.isVisible('#consent')); i++) { if (await m.isDisabled('.foot .btn')) { const t = await m.textContent('.scr h2'); throw new Error('خطوة لا تكتمل: ' + t); } await m.click('.foot .btn'); await m.waitForTimeout(150); }
  await m.check('#consent'); await m.click('[data-act="submit"]'); await m.waitForSelector('text=وصل طلبك إلى أخصائيك'); await cPoll();
  await hxCheck(); await d.waitForSelector('.hxreq:not(.wait)'); await d.click('[data-a="hxOk"]'); await d.waitForSelector('main [data-a="gen"]');
  await d.evaluate(() => { const c = DPApp.S.clients.find((x) => x.code === DPApp.S.cur); c.goal = c.goal || DATA.settings.goals[2][0]; c.activity = c.activity || DATA.settings.activity[2][0]; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  await d.click('main [data-a="gen"]'); await d.waitForSelector('.pnav');
  await d.click('main .tabs [data-v="hx"]'); await d.click('main [data-a="hxSendPlan"]'); await d.waitForFunction(() => (DPApp.S.clients[0].hx || {}).planV >= 1, null, { timeout: 15000 });
  await cPoll(); await m.waitForSelector('.tabbar', { timeout: 10000 });
  return { b, d, m, env, hxCheck, cPoll, C, close: async () => { await b.close(); srv.close(); site.close(); } };
};
