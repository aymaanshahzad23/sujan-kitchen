/**
 * Push demo seed data to Supabase via the JS client (uses .env.local).
 * Run: npm run db:apply
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import type { CampId } from '../src/types/database';
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

function loadEnv() {
  const raw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function clearTable(sb: ReturnType<typeof createClient>, table: string, filterCol = 'id') {
  const { error } = await sb.from(table).delete().not(filterCol, 'is', null);
  if (error) throw new Error(`clear ${table}: ${error.message}`);
}

async function insertBatch(sb: ReturnType<typeof createClient>, table: string, rows: object[]) {
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await sb.from(table).insert(chunk);
    if (error) throw new Error(`insert ${table} @${i}: ${error.message}`);
  }
}

function dishName(camp: CampId, legacyId: number): string {
  return DISHES_RAW[camp].find((d) => d.id === legacyId)?.name ?? 'Unknown dish';
}

async function main() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });
  console.log('Connected to', url);
  console.log('Clearing existing data…');

  await clearTable(sb, 'guest_dish_logs');
  await clearTable(sb, 'complaints');
  await clearTable(sb, 'guests');
  await clearTable(sb, 'comp_offs');
  await clearTable(sb, 'leave_records');
  await clearTable(sb, 'staff');
  await clearTable(sb, 'issuances');
  await clearTable(sb, 'purchases');
  await clearTable(sb, 'camp_ingredient_stock', 'camp_id');
  await clearTable(sb, 'kots');
  await clearTable(sb, 'dish_direct_costs', 'dish_id');
  await clearTable(sb, 'recipe_lines', 'dish_id');
  await clearTable(sb, 'dishes');
  await clearTable(sb, 'ingredients');
  await clearTable(sb, 'public_holidays');
  await clearTable(sb, 'camps', 'id');

  console.log('Inserting camps, menu, inventory…');
  await insertBatch(sb, 'camps', CAMPS);
  await insertBatch(
    sb,
    'public_holidays',
    PUBLIC_HOLIDAYS_RAW.map((h) => ({ id: holidayUuid(h.id), date: h.date, name: h.name })),
  );
  await insertBatch(
    sb,
    'ingredients',
    INGREDIENTS_RAW.map((i) => ({
      id: ingrUuid(i.id),
      legacy_id: i.id,
      name: i.name,
      unit: i.unit,
      price: i.price,
      min_stock: i.minStock,
    })),
  );
  await insertBatch(
    sb,
    'camp_ingredient_stock',
    CAMPS.flatMap((camp) =>
      INGREDIENTS_RAW.map((i) => ({
        camp_id: camp.id,
        ingredient_id: ingrUuid(i.id),
        opening_stock: i.openStock,
      })),
    ),
  );
  await insertBatch(
    sb,
    'dishes',
    Object.entries(DISHES_RAW).flatMap(([camp, dishes]) =>
      dishes.map((d) => ({
        id: dishUuid(camp as CampId, d.id),
        camp_id: camp,
        legacy_id: d.id,
        name: d.name,
        category: d.cat,
        cost_price: d.cost_price,
        section: d.section,
      })),
    ),
  );
  await insertBatch(
    sb,
    'recipe_lines',
    Object.entries(RECIPES_RAW).flatMap(([legacyDishId, lines]) =>
      lines.map((line) => ({
        dish_id: dishUuid('jawai', Number(legacyDishId)),
        ingredient_id: ingrUuid(line.id),
        grams: line.g,
      })),
    ),
  );
  await insertBatch(
    sb,
    'staff',
    STAFF_RAW.map((s) => ({
      id: staffUuid(s.id),
      camp_id: s.camp,
      name: s.name,
      designation: s.designation,
      section: s.section,
      doj: s.doj,
      phone: s.phone || null,
      email: s.email || null,
      init_pl: s.initPL,
      init_cl: s.initCL,
      init_ml: s.initML,
    })),
  );

  console.log('Inserting guests…');
  const guestRows = DEMO_GUESTS.map((g) => ({
    id: guestRowId(g.id),
    camp_id: g.camp,
    reg_no: g.regNo,
    name: g.name,
    nationality: g.nationality,
    tent: g.tent,
    check_in: g.checkIn,
    check_out: g.checkOut,
    food_pref: g.foodPref,
    allergies: g.allergies || null,
    diet_notes: g.dietNotes || null,
    experiences: g.experiences || null,
    feedback: g.feedback || null,
    chef_notes: g.chefNotes || null,
    status: g.status,
    phone: g.phone,
    profile_id: guestProfileRowId(g.profileId),
    profile_key: guestProfileKey(g),
    stay_key: guestStayKey(g),
  }));
  await insertBatch(sb, 'guests', guestRows);

  console.log('Inserting leave, KOTs, logs…');
  await insertBatch(
    sb,
    'leave_records',
    DEMO_LEAVE_RECORDS.map((l) => ({
      id: leaveUuid(l.id),
      staff_id: staffUuid(l.staffLegacyId),
      type: l.type,
      date_from: l.dateFrom,
      date_to: l.dateTo,
      note: l.note,
      status: l.status,
      splits: l.splits ?? null,
    })),
  );
  await insertBatch(sb, 'comp_offs', [
    {
      staff_id: staffUuid(2),
      earned: '2026-05-25',
      expiry: '2026-08-25',
      used: false,
      reason: 'Worked Republic Day off-site event',
    },
  ]);

  const kotRows = generateDemoKotRows();
  await insertBatch(
    sb,
    'kots',
    kotRows.map((k) => ({
      camp_id: k.camp,
      dish_id: dishUuid(k.camp, k.dishLegacyId),
      date: k.date,
      qty: k.qty,
      type: k.type,
      revenue: k.revenue,
      tent: k.tent,
      guest_id: k.guestLegacyId ? guestUuid(k.guestLegacyId) : null,
    })),
  );

  await insertBatch(
    sb,
    'guest_dish_logs',
    DEMO_GUEST_DISH_LOGS.map((log) => ({
      guest_id: guestRowId(log.guestLegacyId),
      dish_id: guestDishId(log.camp, log.dishLegacyId),
      dish_name: dishName(log.camp, log.dishLegacyId),
      date: log.date,
      meal: log.meal,
      notes: log.notes,
    })),
  );

  await insertBatch(
    sb,
    'complaints',
    DEMO_COMPLAINTS.map((c) => ({
      id: complaintUuid(c.id),
      camp_id: c.camp,
      dish_id: c.dishLegacyId ? dishUuid(c.camp, c.dishLegacyId) : null,
      date: c.date,
      type: c.type,
      severity: c.severity,
      description: c.description,
      reporter: c.reporter,
    })),
  );

  const purchaseRows = [
    { camp_id: 'jawai', ingredient_id: ingrUuid(1), qty: 12, price: 220, date: '2026-06-10' },
    { camp_id: 'jawai', ingredient_id: ingrUuid(6), qty: 8, price: 110, date: '2026-06-11' },
    { camp_id: 'jawai', ingredient_id: ingrUuid(19), qty: 6, price: 80, date: '2026-06-12' },
    { camp_id: 'sherbagh', ingredient_id: ingrUuid(2), qty: 5, price: 650, date: '2026-06-09' },
    { camp_id: 'serai', ingredient_id: ingrUuid(3), qty: 4, price: 380, date: '2026-06-08' },
  ];
  await insertBatch(sb, 'purchases', purchaseRows);

  const { count: guestCount } = await sb.from('guests').select('*', { count: 'exact', head: true });
  const { count: kotCount } = await sb.from('kots').select('*', { count: 'exact', head: true });

  console.log('\nDone.');
  console.log(`  Guests: ${guestCount}`);
  console.log(`  KOTs:   ${kotCount}`);
  console.log('Refresh the dashboard — Guest Registry should be populated.');
}

main().catch((e) => {
  console.error('\nSeed failed:', e.message);
  if (/phone|profile_key|stay_key|guest_id|tent/.test(e.message)) {
    console.error('\nTip: run migrations 004 and 005 on Supabase first.');
  }
  process.exit(1);
});
