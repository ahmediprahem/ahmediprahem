# Nutrimind "dieta por equivalentes" brief (2026-11-20)
Target video: "Tutorial Nutrimind: Como generar una dieta por equivalentes/intercambios" (official channel, 9:02) https://youtu.be/0qRdWtLkJIU
Could NOT watch: video download blocked; YouTube page then rate-limited this session (Google "sorry" page). Nutrimind manual (nutrimind.net/manual/view/*) returns HTTP 500.
Confirmed facts (nutrimind.net home page, 2026): "Dietas automáticas por gramaje y por equivalentes"; "Solo selecciona las calorías, Nutrimind genera 50 opciones automáticamente"; "Asigna dietas semanales"; patient types: deportista, control de peso, clínico, pediátrico (OMS growth curves); antropometría, somatocarta, laboratorio; app for patients (day plan, check meals completed, photos). Third-party: plans by SMAE equivalents or grams, macro/micro analysis per meal time; databases SMAE, TACO, USDA (2,500+ foods).
Visible UI (docs/team/nutrimind_ui/menu_and_app.png): green left icon rail; meal-time tabs "Al despertar · Desayuno · Medio día · Comida · Media tarde · Cena"; each dish = card with photo + title + ingredient rows: name | grams (or ml) | household qty + unit (pieza, taza, cucharadita, hoja); pie chart (macros) + total "1972 cal".

## Standard exchange-diet method (the SMAE "cuadro dietosintético" method taught in Mexican nutrition programs; what the tutorial title refers to). Steps:
1. Energy: GET = basal (Harris-Benedict, Mifflin-St Jeor, FAO/OMS/UNU, Valencia [Mexican pop.], etc.) × activity factor (± ETA) ± goal adjustment.
2. Macro distribution % (e.g., CHO/PRO/LIP) → kcal → grams (4/4/9).
3. Cuadro dietosintético: list of equivalent groups (verduras, frutas, cereales sin/con grasa, leguminosas, AOA muy bajo/bajo/moderado/alto en grasa, leche descremada/semi/entera/con azúcar, aceites y grasas sin/con proteína, azúcares sin/con grasa). Professional types the NUMBER of equivalents per group; table sums kcal/PRO/LIP/CHO live; shows % adecuación vs target per macro and energy (commonly accepted 95–105%; to be confirmed by owner/Michael).
4. Distribution table: groups × meal times (desayuno, colación, comida, colación, cena); per-meal totals; row sums must equal daily equivalents.
5. Menu: for each meal, choose foods/dishes whose portions cover that meal's equivalents (each SMAE food has portion grams + household measure). Dish cards list ingredients in g + household measure.
6. Output: printable weekly menu; patient app.
Zenha mapping: our 13 groups in src/data.json (D.groups, D.EX per-exchange C/P/F, foods with g, upe, us, gpe) are an exchange system analogous to SMAE (milk 3 levels, meats 4 levels, starches, legumes, veg, fruit, fats, sugars).
