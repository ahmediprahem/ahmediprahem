// في الثيم الزجاجي يُطوى عمود العملاء خارج الرئيسية: يفتحه كما يفعل المستخدم (زر «العملاء» في شريط التنقل) قبل اختيار عميل من القائمة
module.exports.showClients = (p) => p.evaluate(() => { if (document.body.classList.contains('clx')) { const b = document.querySelector('aside [data-a="clToggle"]'); if (b) b.click(); } });
