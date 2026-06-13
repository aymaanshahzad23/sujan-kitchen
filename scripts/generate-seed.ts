import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  CAMPS,
  DISHES_RAW,
  INGREDIENTS_RAW,
  RECIPES_RAW,
  STAFF_RAW,
  PUBLIC_HOLIDAYS_RAW,
} from '../src/data/seedData';
import {
  DEMO_COMPLAINTS,
  DEMO_GUEST_DISH_LOGS,
  DEMO_GUESTS,
  DEMO_LEAVE_RECORDS,
  DEMO_TODAY,
  generateDemoKotRows,
  guestDishId,
  guestProfileKey,
  guestProfileRowId,
  guestRowId,
  guestStayKey,
} from '../src/data/demoSeed';
import {
  complaintUuid,
  dishUuid,
  guestUuid,
  holidayUuid,
  ingrUuid,
  leaveUuid,
  staffUuid,
} from '../src/data/uuids';

const __dirname = dirname(fileURLToPath(import.meta.url));
const esc = (s: string) => s.replace(/'/g, "''");
const sqlStr = (s: string | null | undefined) => (s ? `'${esc(s)}'` : 'NULL');

const lines: string[] = [
  '-- SUJÁN Kitchen Dashboard — demo seed (coherent guest-linked mock data)',
  `-- Demo date anchor: ${DEMO_TODAY}`,
  '-- Run: npm run db:seed',
  '-- Requires migration 004_guest_identity_kot_tent.sql',
  '',
  'TRUNCATE guest_dish_logs, complaints, guests, comp_offs, leave_records, staff,',
  '  issuances, purchases, camp_ingredient_stock, kots, dish_direct_costs, recipe_lines,',
  '  dishes, ingredients, public_holidays, camps CASCADE;',
  '',
];

for (const c of CAMPS) {
  lines.push(
    `INSERT INTO camps (id, name, opening_stock_value, purchases_value) VALUES ('${c.id}', '${esc(c.name)}', ${c.opening_stock_value}, ${c.purchases_value});`,
  );
}

for (const h of PUBLIC_HOLIDAYS_RAW) {
  lines.push(
    `INSERT INTO public_holidays (id, date, name) VALUES ('${holidayUuid(h.id)}', '${h.date}', '${esc(h.name)}');`,
  );
}

for (const i of INGREDIENTS_RAW) {
  lines.push(
    `INSERT INTO ingredients (id, legacy_id, name, unit, price, min_stock) VALUES ('${ingrUuid(i.id)}', ${i.id}, '${esc(i.name)}', '${i.unit}', ${i.price}, ${i.minStock});`,
  );
}

for (const camp of CAMPS) {
  for (const i of INGREDIENTS_RAW) {
    lines.push(
      `INSERT INTO camp_ingredient_stock (camp_id, ingredient_id, opening_stock) VALUES ('${camp.id}', '${ingrUuid(i.id)}', ${i.openStock});`,
    );
  }
}

for (const [camp, dishes] of Object.entries(DISHES_RAW)) {
  for (const d of dishes) {
    lines.push(
      `INSERT INTO dishes (id, camp_id, legacy_id, name, category, cost_price, section) VALUES ('${dishUuid(camp as 'jawai', d.id)}', '${camp}', ${d.id}, '${esc(d.name)}', '${esc(d.cat)}', ${d.cost_price}, '${d.section}');`,
    );
  }
}

for (const [legacyDishId, recipeLines] of Object.entries(RECIPES_RAW)) {
  const dishId = dishUuid('jawai', Number(legacyDishId));
  for (const line of recipeLines) {
    lines.push(
      `INSERT INTO recipe_lines (dish_id, ingredient_id, grams) VALUES ('${dishId}', '${ingrUuid(line.id)}', ${line.g});`,
    );
  }
}

for (const s of STAFF_RAW) {
  lines.push(
    `INSERT INTO staff (id, camp_id, name, designation, section, doj, phone, email, init_pl, init_cl, init_ml) VALUES ('${staffUuid(s.id)}', '${s.camp}', '${esc(s.name)}', '${esc(s.designation)}', '${esc(s.section)}', '${s.doj}', ${s.phone ? `'${s.phone}'` : 'NULL'}, ${s.email ? `'${esc(s.email)}'` : 'NULL'}, ${s.initPL}, ${s.initCL}, ${s.initML});`,
  );
}

lines.push('', '-- Guests (profile + stay keys, phone, tents)', '');
for (const g of DEMO_GUESTS) {
  lines.push(
    `INSERT INTO guests (id, camp_id, reg_no, name, nationality, tent, check_in, check_out, food_pref, allergies, diet_notes, experiences, feedback, chef_notes, status, phone, profile_id, profile_key, stay_key) VALUES (` +
      `'${guestRowId(g.id)}', '${g.camp}', ${sqlStr(g.regNo)}, '${esc(g.name)}', ${sqlStr(g.nationality)}, ${sqlStr(g.tent)}, ` +
      `'${g.checkIn}', '${g.checkOut}', '${g.foodPref}', ${sqlStr(g.allergies)}, ${sqlStr(g.dietNotes)}, ` +
      `${sqlStr(g.experiences)}, ${sqlStr(g.feedback)}, ${sqlStr(g.chefNotes)}, '${g.status}', ` +
      `${sqlStr(g.phone)}, '${guestProfileRowId(g.profileId)}', '${esc(guestProfileKey(g))}', '${esc(guestStayKey(g))}');`,
  );
}

lines.push('', '-- Leave records (aligned with Staff tab demo)', '');
for (const l of DEMO_LEAVE_RECORDS) {
  const splits = l.splits ? `'${JSON.stringify(l.splits).replace(/'/g, "''")}'::jsonb` : 'NULL';
  lines.push(
    `INSERT INTO leave_records (id, staff_id, type, date_from, date_to, note, status, splits) VALUES (` +
      `'${leaveUuid(l.id)}', '${staffUuid(l.staffLegacyId)}', '${l.type}', '${l.dateFrom}', '${l.dateTo}', ` +
      `${sqlStr(l.note)}, '${l.status}', ${splits});`,
  );
}

lines.push('', '-- Comp offs', '');
lines.push(
  `INSERT INTO comp_offs (staff_id, earned, expiry, used, reason) VALUES ('${staffUuid(2)}', '2026-05-25', '2026-08-25', false, 'Worked Republic Day off-site event');`,
);

const kotRows = generateDemoKotRows();
lines.push('', `-- KOT orders: ${kotRows.length} rows (guest-linked where type = Guest)`, '');
for (const k of kotRows) {
  const guestId = k.guestLegacyId ? `'${guestUuid(k.guestLegacyId)}'` : 'NULL';
  const tent = k.tent ? `'${esc(k.tent)}'` : 'NULL';
  lines.push(
    `INSERT INTO kots (camp_id, dish_id, date, qty, type, revenue, tent, guest_id) VALUES (` +
      `'${k.camp}', '${dishUuid(k.camp, k.dishLegacyId)}', '${k.date}', ${k.qty}, '${k.type}', ${k.revenue}, ${tent}, ${guestId});`,
  );
}

lines.push('', '-- Guest dish preference logs (separate from KOT)', '');
for (const log of DEMO_GUEST_DISH_LOGS) {
  lines.push(
    `INSERT INTO guest_dish_logs (guest_id, dish_id, dish_name, date, meal, notes) VALUES (` +
      `'${guestRowId(log.guestLegacyId)}', '${guestDishId(log.camp, log.dishLegacyId)}', ` +
      `(SELECT name FROM dishes WHERE id = '${guestDishId(log.camp, log.dishLegacyId)}'), ` +
      `'${log.date}', '${esc(log.meal)}', ${sqlStr(log.notes)});`,
  );
}

lines.push('', '-- Feedback / complaints', '');
for (const c of DEMO_COMPLAINTS) {
  const dishId = c.dishLegacyId ? `'${dishUuid(c.camp, c.dishLegacyId)}'` : 'NULL';
  lines.push(
    `INSERT INTO complaints (id, camp_id, dish_id, date, type, severity, description, reporter) VALUES (` +
      `'${complaintUuid(c.id)}', '${c.camp}', ${dishId}, '${c.date}', '${c.type}', '${c.severity}', ` +
      `'${esc(c.description)}', '${esc(c.reporter)}');`,
  );
}

lines.push('', '-- Sample purchases (Food Cost tab)', '');
const purchaseRows = [
  { camp: 'jawai', ingr: 1, qty: 12, price: 220, date: '2026-06-10' },
  { camp: 'jawai', ingr: 6, qty: 8, price: 110, date: '2026-06-11' },
  { camp: 'jawai', ingr: 19, qty: 6, price: 80, date: '2026-06-12' },
  { camp: 'sherbagh', ingr: 2, qty: 5, price: 650, date: '2026-06-09' },
  { camp: 'serai', ingr: 3, qty: 4, price: 380, date: '2026-06-08' },
];
for (const p of purchaseRows) {
  lines.push(
    `INSERT INTO purchases (camp_id, ingredient_id, qty, price, date) VALUES ('${p.camp}', '${ingrUuid(p.ingr)}', ${p.qty}, ${p.price}, '${p.date}');`,
  );
}

writeFileSync(join(__dirname, '..', 'supabase', 'seed.sql'), lines.join('\n') + '\n');
console.log(`Wrote supabase/seed.sql (${lines.length} lines)`);
console.log(`  Guests: ${DEMO_GUESTS.length}`);
console.log(`  KOTs: ${kotRows.length} (${kotRows.filter((k) => k.guestLegacyId).length} guest-linked)`);
console.log(`  Leave records: ${DEMO_LEAVE_RECORDS.length}`);
