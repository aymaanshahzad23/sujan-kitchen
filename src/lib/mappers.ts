import type {
  CampId,
  Complaint,
  CompOff,
  Dish,
  Guest,
  GuestDishLog,
  Ingredient,
  Issuance,
  Kot,
  LeaveRecord,
  LegacyDish,
  LegacyGuest,
  LegacyKot,
  LegacyLeave,
  LegacyStaff,
  PublicHoliday,
  Purchase,
  RecipeLine,
  StaffMember,
} from '../types/database';
import { normalizeDate } from '../utils/helpers';
import { COST_PRICE_LOOKUP } from '../data/seedData';

/** Rs cost per portion — uses seed lookup when DB still has margin % after a bad migration */
export function resolveDishCostPrice(d: Dish): number {
  const raw = Number(d.cost_price);
  const seedKey = d.legacy_id != null ? `${d.camp_id}-${d.legacy_id}` : null;
  const fromSeed = seedKey ? COST_PRICE_LOOKUP[seedKey] : undefined;

  // cost_price <= 85 is almost certainly margin % (55–80), not Rs
  if (raw > 0 && raw <= 85 && fromSeed != null) return fromSeed;
  if (!Number.isNaN(raw) && raw > 0) return raw;
  if (fromSeed != null) return fromSeed;
  return 200;
}

export function toLegacyDish(d: Dish): LegacyDish {
  return {
    id: d.id,
    name: d.name,
    cat: d.category,
    costPrice: resolveDishCostPrice(d),
    section: d.section,
  };
}

export function toLegacyKot(k: Kot): LegacyKot {
  return {
    id: k.id,
    dishId: k.dish_id,
    date: normalizeDate(k.date),
    qty: k.qty,
    type: k.type,
    revenue: Number(k.revenue),
    tent: k.tent || '',
    guestId: k.guest_id || '',
  };
}

export function toLegacyStaff(s: StaffMember): LegacyStaff {
  return {
    id: s.id,
    name: s.name,
    designation: s.designation,
    section: s.section,
    doj: s.doj,
    camp: s.camp_id,
    initPL: Number(s.init_pl),
    initCL: Number(s.init_cl),
    initML: Number(s.init_ml),
    phone: s.phone || '',
    email: s.email || '',
  };
}

export function toLegacyLeave(l: LeaveRecord): LegacyLeave {
  return {
    id: l.id,
    staffId: l.staff_id,
    type: l.type,
    date: l.date_from,
    dateTo: l.date_to || undefined,
    note: l.note || '',
    status: l.status,
    splits: l.splits || undefined,
  };
}

export function toLegacyGuest(g: Guest, dishLogs: GuestDishLog[] = []): LegacyGuest {
  return {
    id: g.id,
    camp: g.camp_id,
    regNo: g.reg_no || '',
    name: g.name,
    phone: g.phone || '',
    profileId: g.profile_id || g.id,
    nationality: g.nationality || '',
    tent: g.tent || '',
    checkIn: g.check_in || '',
    checkOut: g.check_out || '',
    foodPref: g.food_pref,
    allergies: g.allergies || '',
    dietNotes: g.diet_notes || '',
    experiences: g.experiences || '',
    feedback: g.feedback || '',
    chefNotes: g.chef_notes || '',
    status: g.status,
    dishLog: dishLogs.map((d) => ({
      dishId: d.dish_id || '',
      dishName: d.dish_name || '',
      date: d.date,
      meal: d.meal || '',
      notes: d.notes || '',
    })),
  };
}

export function groupRecipes(lines: RecipeLine[]): Record<string, RecipeLine[]> {
  const map: Record<string, RecipeLine[]> = {};
  for (const line of lines) {
    if (!map[line.dish_id]) map[line.dish_id] = [];
    map[line.dish_id].push(line);
  }
  return map;
}

export function groupDirectCosts(
  rows: { dish_id: string; cost: number }[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) map[row.dish_id] = Number(row.cost);
  return map;
}

export function groupStockByCamp(
  rows: { camp_id: CampId; ingredient_id: string; opening_stock: number }[],
): Record<CampId, Record<string, number>> {
  const map: Record<CampId, Record<string, number>> = {
    jawai: {},
    sherbagh: {},
    serai: {},
  };
  for (const row of rows) {
    map[row.camp_id][row.ingredient_id] = Number(row.opening_stock);
  }
  return map;
}

export type { Complaint, CompOff, Dish, Guest, Ingredient, Issuance, Kot, LeaveRecord, PublicHoliday, Purchase, RecipeLine, StaffMember };
