// 0.94: «العملاء» صفحة مستقلة (قائمة + بحث)، فالمساعد يفتحها بدل طيّ/فرد عمود العملاء القديم
module.exports.showClients = (p) => p.evaluate(() => { if (window.DPApp && DPApp.A.clients) DPApp.A.clients(); });
