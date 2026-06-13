import type { Dish } from '../types/database';

const MEAL_OPTIONS = ['Breakfast', 'Brunch', 'Lunch', 'Sundowner', 'Dinner', 'Late Night'] as const;
export type GuestDishMeal = (typeof MEAL_OPTIONS)[number];

export function mealFromDishCategory(category: string | null | undefined): GuestDishMeal {
  const cat = (category || '').toLowerCase();
  if (cat.includes('breakfast')) return 'Breakfast';
  if (cat.includes('brunch')) return 'Brunch';
  if (cat.includes('dessert')) return 'Dinner';
  if (cat.includes('dinner') || cat === 'godwar' || cat.includes('thali')) return 'Dinner';
  if (cat.includes('lunch')) return 'Lunch';
  return 'Lunch';
}

export function guestDishLogNotesFromKot(qty: number, preferenceNote?: string): string {
  if (preferenceNote?.trim()) return preferenceNote.trim();
  return qty > 1 ? `Qty ${qty}` : '';
}

export function buildGuestDishLogFromKot(input: {
  guest_id: string;
  dish: Pick<Dish, 'id' | 'name' | 'category'>;
  date: string;
  qty: number;
  preferenceNote?: string;
}) {
  return {
    guest_id: input.guest_id,
    dish_id: input.dish.id,
    dish_name: input.dish.name,
    date: input.date,
    meal: mealFromDishCategory(input.dish.category),
    notes: guestDishLogNotesFromKot(input.qty, input.preferenceNote),
  };
}

export async function punchGuestKotWithProfileSync(
  punchKot: (input: {
    dish_id: string;
    date: string;
    qty: number;
    type: 'Guest' | 'Manager';
    revenue: number;
    tent?: string | null;
    guest_id?: string | null;
  }) => Promise<unknown>,
  addGuestDish: (input: {
    guest_id: string;
    dish_id: string;
    dish_name: string;
    date: string;
    meal: string;
    notes: string;
  }) => Promise<unknown>,
  dish: Pick<Dish, 'id' | 'name' | 'category'> | undefined,
  payload: {
    dish_id: string;
    date: string;
    qty: number;
    type: 'Guest' | 'Manager';
    revenue: number;
    tent?: string | null;
    guest_id?: string | null;
  },
) {
  await punchKot(payload);
  if (payload.guest_id && dish) {
    await addGuestDish(buildGuestDishLogFromKot({
      guest_id: payload.guest_id,
      dish,
      date: payload.date,
      qty: payload.qty,
    }));
  }
}
