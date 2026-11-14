/* منطقية الكميات: سقف الكمية لكل صنف (mx في البيانات) يُحترم في كل سطر. ما زاد عن السقف يُنقل (بالحصص نفسها، فلا تتغير الماكروز)
   إلى سطر آخر من المجموعة نفسها في الوجبة نفسها، وإن لم يوجد فإلى صنف بديل يفضّله العميل. تُرجع عدد الأسطر المصحّحة وما تعذّر. ES5 */
(function (root) {
  'use strict';
  function capE(f) { var c = Math.floor((f.mx || 3 * (f.upe || 1)) / f.upe * 2 + 1e-9) / 2; return Math.max(0.5, c); }
  function over(E, f, e) { return E.qtyNum(f.upe * e, f.us, f.st) > (f.mx || 3 * (f.upe || 1)) + 1e-6; }
  function fixCaps(E, plan, D) {
    var byN = {}; D.foods.forEach(function (f) { byN[f.n] = f; });
    var res = { fixed: 0, left: 0 };
    plan.days.forEach(function (d) {
      d.slots.forEach(function (s) {
        for (var guard = 0; guard < 8; guard++) {
          var changed = false;
          for (var i = 0; i < s.lines.length; i++) {
            var l = s.lines[i], f = byN[l.name]; if (!f || l.bank) continue;
            if (!over(E, f, l.e)) continue;
            var keep = Math.min(l.e, capE(f)), surplus = l.e - keep; if (surplus < 0.5) { res.left++; continue; }
            var done = false;
            for (var j = 0; j < s.lines.length && !done; j++) {                       // سطر آخر من المجموعة نفسها فيه متسع
              if (j === i || s.lines[j].g !== l.g) continue; var f2 = byN[s.lines[j].name]; if (!f2) continue;
              var room = Math.floor((capE(f2) - s.lines[j].e) * 2 + 1e-9) / 2; if (room < 0.5) continue;
              var add = Math.min(room, surplus); s.lines[j].e += add; s.lines[j].text = E.lineText(f2, s.lines[j].e, plan.client.alias); l.e -= add; surplus -= add; if (surplus < 0.5) done = true;
            }
            if (!done) {                                                              // صنف بديل جديد (المفضّل أولاً)
              var used = {}; s.lines.forEach(function (q) { used[q.name] = 1; });
              var alts = E.alternatives(l, s.type, plan, D, 14).filter(function (a) { return !used[a.name] && byN[a.name]; });
              for (var k = 0; k < alts.length && surplus >= 0.5; k++) {
                var f3 = byN[alts[k].name], take = Math.min(capE(f3), surplus); if (take < 0.5) continue;
                s.lines.push({ g: l.g, name: f3.n, e: take, text: E.lineText(f3, take, plan.client.alias), tier: alts[k].tier, bank: false, split: true }); surplus -= take; l.e -= take;
              }
            }
            l.text = E.lineText(f, l.e, plan.client.alias);
            if (l.e < 0.5) { s.lines.splice(i, 1); i--; }
            changed = true; res.fixed++;
          }
          if (!changed) break;
        }
      });
    });
    return res;
  }
  var api = { fixCaps: fixCaps, capE: capE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FixCaps = api;
})(typeof window !== 'undefined' ? window : this);
