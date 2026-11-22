import csv, json, sys, os
B='/tmp/claude-0/usda/sr/FoodData_Central_sr_legacy_food_csv_2018-04/'
N={'1003':'p','1004':'f','1005':'c','1008':'k','1079':'fi','2000':'su','1093':'na','1092':'K','1258':'sf'}
food={r['fdc_id']:{'id':r['fdc_id'],'d':r['description'],'cat':r['food_category_id']} for r in csv.DictReader(open(B+'food.csv'))}
for r in csv.DictReader(open(B+'food_nutrient.csv')):
    k=N.get(r['nutrient_id'])
    if k and r['fdc_id'] in food: food[r['fdc_id']][k]=float(r['amount'] or 0)
mu={r['id']:r['name'] for r in csv.DictReader(open(B+'measure_unit.csv'))}
for r in csv.DictReader(open(B+'food_portion.csv')):
    if r['fdc_id'] in food: food[r['fdc_id']].setdefault('por',[]).append([float(r['amount'] or 0), mu.get(r['measure_unit_id'],''), r['modifier'], float(r['gram_weight'] or 0)])
json.dump(food,open('sr.json','w'))
print(len(food))
