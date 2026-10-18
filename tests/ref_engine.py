# -*- coding: utf-8 -*-
"""مرجع بايثون مستقل (كُتب منفصلاً عن engine.js) يولّد قيماً متوقعة لاختبار التطابق: الأهداف، محرك الحصص اليومي، توزيع الوجبات."""
import json, math, os, random
HERE = os.path.dirname(os.path.abspath(__file__)); D = json.load(open(os.path.join(HERE, '..', 'src', 'data.json'), encoding='utf-8'))
S = D['settings']; EX = D['EX']
def rnd(x): return math.floor(x + 0.5 + 1e-9)
def targets(c):
    w, h, a = c['weight'], c['height'], c['age']; pal = dict(S['activity'])[c['activity']]; adjk = dict(S['goals'])[c['goal']]
    ibw = (h - S['ibw_off']) * (S['ibw_f'] if c['sex'] == 'أنثى' else 1); bmr = 10 * w + 6.25 * h - 5 * a + (5 if c['sex'] == 'ذكر' else -161); tdee = bmr * pal
    kcal = c['kcalManual'] if c.get('kcalManual') else tdee + adjk; mode = c['macroMode']
    if mode == 'manual': cho, pro, fat = kcal * c['choPct'] / 4, kcal * c['proPct'] / 4, kcal * c['fatPct'] / 9
    elif mode == 'auto_pc': pro = c['proGkg'] * w; cho = kcal * c['choPct'] / 4; fat = (kcal * (1 - c['choPct']) - pro * 4) / 9
    else: pro = c['proGkg'] * w; fat = kcal * c['fatPct'] / 9; cho = (kcal - pro * 4 - fat * 9) / 4
    return dict(bmr=bmr, tdee=tdee, kcal=kcal, cho=cho, pro=pro, fat=fat, ibw=ibw)
def cap_totals(day, meals):
    pct = S['pct'][str(meals)]; return [sum(D['comp'][day][g][s][1] for s in range(6) if pct[s] > 0) for g in range(13)]
def solve(T, cap, sweets):
    best = None; tol = (10, 10, 5); sw = min(sweets, cap[12])
    for dv in (0, 1):
        for f in range(1, 5):
            for m in range(0, 4):
                for e in range(0, 4):
                    v = 3 + dv; rc = T['cho'] - sw * EX[12][0] - v * EX[9][0] - f * EX[10][0] - m * EX[7][0]
                    s = min(cap[0], max(0, rnd(rc / EX[0][0]))); l = min(3, cap[1], max(0, rnd((rc - cap[0] * EX[0][0]) / EX[1][0]))) if rc / EX[0][0] > cap[0] + 0.5 else 0
                    rp = T['pro'] - v * EX[9][1] - m * EX[7][1] - s * EX[0][1] - e * EX[4][1] - l * EX[1][1]; n = max(0, rnd(rp / EX[3][1])); a = min(cap[2], rnd(n * 0.5)); b = min(cap[3], n - a)
                    rf = T['fat'] - (s * EX[0][2] + l * EX[1][2] + a * EX[2][2] + b * EX[3][2] + e * EX[4][2] + m * EX[7][2] + v * EX[9][2] + f * EX[10][2]); t = min(40, cap[11], max(0, rnd(rf / EX[11][2])))
                    cnt = [s, l, a, b, e, 0, 0, m, 0, v, f, t, sw]; ach = [sum(cnt[g] * EX[g][k] for g in range(13)) for k in range(3)]
                    err = [ach[0] - T['cho'], ach[1] - T['pro'], ach[2] - T['fat']]; ok = all(abs(err[i]) <= tol[i] for i in range(3))
                    vio = sum(max(0, abs(err[i]) - tol[i]) / tol[i] for i in range(3)); ov = max(0, v - cap[9]) + max(0, f - cap[10]) + max(0, m - cap[7]) + max(0, e - cap[4])
                    score = (0 if (ok and ov == 0) else 100 + vio + 5 * ov) + abs(err[0]) / 10 * 2 + abs(err[1]) / 10 * 3 + abs(err[2]) / 5 + 0.05 * (dv + abs(f - 2) + abs(m - 1) + abs(e - 2)) + 0.2 * l
                    if best is None or score < best[0]: best = (score, cnt, ok and ov == 0)
    return {'score': best[0], 'counts': best[1], 'ok': best[2]}
def allocate(total, w, cap, mn):
    n = len(w); base = [min(mn[i], cap[i]) for i in range(n)]; capR = [cap[i] - base[i] for i in range(n)]; Sx = max(0, total - sum(base)); a = [0.0] * n; wt = list(w)
    for _ in range(3):
        sw = sum(wt) or 1e-6; rem = Sx - sum(a); a = [min(capR[j], a[j] + rem * wt[j] / sw) for j in range(n)]; wt = [w[j] if a[j] < capR[j] - 1e-6 else 0 for j in range(n)]
    fl = [math.floor(x + 1e-6) for x in a]; fr = [a[j] - fl[j] for j in range(n)]; room = [fl[j] + 1 <= capR[j] + 1e-6 for j in range(n)]; k = max(0, rnd(Sx - sum(fl)))
    order = sorted([j for j in range(n) if room[j]], key=lambda j: (-fr[j], j)); extra = [0] * n
    for j in order[:k]: extra[j] = 1
    return [base[j] + fl[j] + extra[j] for j in range(n)]
def make(N=400, seed=5):
    rng = random.Random(seed); out = {'targets': [], 'solve': [], 'alloc': []}
    acts = [a[0] for a in S['activity']]; goals = [g[0] for g in S['goals']]
    for i in range(N):
        c = dict(sex=rng.choice(['ذكر', 'أنثى']), age=rng.randint(18, 70), weight=round(rng.uniform(45, 130), 1), height=rng.randint(148, 196), activity=rng.choice(acts), goal=rng.choice(goals[:5]),
                 macroMode=rng.choice(['auto_pf', 'auto_pc', 'manual']), proGkg=round(rng.uniform(1.0, 2.2), 2), choPct=round(rng.uniform(0.3, 0.55), 2), proPct=0.25, fatPct=round(rng.uniform(0.2, 0.4), 2), kcalManual=rng.choice([0, 0, 0, rng.randint(1200, 2600)]))
        if c['macroMode'] == 'manual': c['proPct'] = round(1 - c['choPct'] - c['fatPct'], 2)
        T = targets(c); out['targets'].append({'c': c, 'T': T})
        if T['cho'] > 0 and T['fat'] > 0 and T['pro'] > 0:
            day, meals, sweets = rng.randint(0, 6), rng.choice([3, 4, 5, 6]), rng.choice([0, 1]); cap = cap_totals(day, meals)
            out['solve'].append({'T': {'cho': T['cho'], 'pro': T['pro'], 'fat': T['fat']}, 'day': day, 'meals': meals, 'sweets': sweets, 'cap': cap, 'exp': solve(T, cap, sweets)})
    for i in range(400):
        n = 6; w = [rng.choice([0, 0, 1, 2, 3, 4]) for _ in range(n)]; cap = [rng.choice([0, 1, 2, 3, 4]) for _ in range(n)]; mn = [rng.choice([0, 0, 0, 1]) for _ in range(n)]
        w = [w[j] if cap[j] > 0 else 0 for j in range(n)]; total = rng.randint(0, 14); out['alloc'].append({'total': total, 'w': w, 'cap': cap, 'mn': mn, 'exp': allocate(total, w, cap, mn)})
    return out
if __name__ == '__main__':
    r = make(); json.dump(r, open(os.path.join(HERE, 'ref_cases.json'), 'w', encoding='utf-8'), ensure_ascii=False); print('ref cases:', len(r['targets']), len(r['solve']), len(r['alloc']))
