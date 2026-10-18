// دخول المدير في الاختبارات (يُنشئ الحساب أول مرة ثم يسجّل الدخول)
module.exports = async function adminLogin(p, user = 'hamed', pw = 'Admin#2026pass') {
  await p.waitForSelector('#sBtn, #aBtn');
  if (await p.locator('#sBtn').count()) { await p.fill('#su', user); await p.fill('#sp', pw); await p.fill('#sp2', pw); await p.click('#sBtn'); await p.waitForSelector('#aBtn'); }
  await p.fill('#au', user); await p.fill('#ap', pw); await p.click('#aBtn'); await p.waitForSelector('aside .sidebtn', { state: 'attached' });
};
