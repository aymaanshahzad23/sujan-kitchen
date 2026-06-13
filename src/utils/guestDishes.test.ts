import { describe, expect, it } from 'vitest';
import { buildGuestDishLogFromKot, mealFromDishCategory } from './guestDishes';

describe('guestDishes', () => {
  it('maps dish categories to meal slots', () => {
    expect(mealFromDishCategory('Breakfast')).toBe('Breakfast');
    expect(mealFromDishCategory('Lunch – Main')).toBe('Lunch');
    expect(mealFromDishCategory('Godwar')).toBe('Dinner');
    expect(mealFromDishCategory('Thali')).toBe('Dinner');
  });

  it('builds guest dish log rows from KOT punches', () => {
    const row = buildGuestDishLogFromKot({
      guest_id: 'guest-1',
      dish: { id: 'dish-1', name: "Ranger's Breakfast", category: 'Breakfast' },
      date: '2026-06-11',
      qty: 2,
    });
    expect(row.meal).toBe('Breakfast');
    expect(row.notes).toBe('Qty 2');
  });
});
