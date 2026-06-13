import { describe, expect, it } from 'vitest';
import { resolveDishCostPrice } from './mappers';
import type { Dish } from '../types/database';

const base: Dish = {
  id: 'd1',
  camp_id: 'jawai',
  legacy_id: 1,
  name: 'Scrambled Eggs',
  category: 'Breakfast',
  cost_price: 75,
  section: 'western',
};

describe('resolveDishCostPrice', () => {
  it('uses seed lookup when DB value looks like margin %', () => {
    expect(resolveDishCostPrice(base)).toBe(163);
  });

  it('uses DB value when it is a realistic Rs cost', () => {
    expect(resolveDishCostPrice({ ...base, cost_price: 163 })).toBe(163);
  });
});
