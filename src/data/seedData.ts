import type { CampId } from '../types/database';
import { dishUuid, ingrUuid, staffUuid, holidayUuid } from './uuids';

export const CAMPS = [
  { id: 'jawai' as CampId, name: 'JAWAI', opening_stock_value: 85000, purchases_value: 120000 },
  { id: 'sherbagh' as CampId, name: 'Sherbagh', opening_stock_value: 62000, purchases_value: 95000 },
  { id: 'serai' as CampId, name: 'The Serai', opening_stock_value: 74000, purchases_value: 108000 },
];

/** @deprecated Legacy constant — demo KOTs use guest-linked orders in demoSeed.ts */
export const KOT_DATES = [
  '2026-06-01',
  '2026-06-08',
  '2026-06-13',
];

/** @deprecated Use generateDemoKotRows from demoSeed.ts */
export function generateKotSeedRows(): never {
  throw new Error('generateKotSeedRows is removed — use generateDemoKotRows from demoSeed.ts');
}

const DISHES_LEGACY: Record<CampId, { id: number; name: string; cat: string; margin: number; price: number; section: string }[]> = {
  jawai: [
    { id: 1, name: 'Scrambled Eggs', cat: 'Breakfast', margin: 75, price: 650, section: 'western' },
    { id: 2, name: "Ranger's Breakfast", cat: 'Breakfast', margin: 65, price: 1800, section: 'western' },
    { id: 3, name: 'Quinoa Breakfast Hash', cat: 'Breakfast', margin: 70, price: 950, section: 'western' },
    { id: 4, name: 'Waffles & Pancakes', cat: 'Breakfast', margin: 68, price: 750, section: 'bakery' },
    { id: 5, name: 'Vada Pao Burger', cat: 'Breakfast', margin: 72, price: 600, section: 'indian' },
    { id: 6, name: "Kakosa's Laal Maas", cat: 'Brunch', margin: 62, price: 2200, section: 'indian' },
    { id: 7, name: 'Banana Leaf Fish', cat: 'Brunch', margin: 68, price: 1800, section: 'indian' },
    { id: 8, name: 'Chicken Cheeseburger', cat: 'Brunch', margin: 58, price: 1400, section: 'western' },
    { id: 9, name: 'Khao Suey Bowl', cat: 'Brunch', margin: 64, price: 1200, section: 'western' },
    { id: 10, name: 'Penne Pomodoro', cat: 'Brunch', margin: 70, price: 1100, section: 'western' },
    { id: 11, name: 'Pan Roasted Gnocchi', cat: 'Brunch', margin: 66, price: 1300, section: 'western' },
    { id: 12, name: 'Signature Banna Pizza', cat: 'Brunch', margin: 60, price: 1600, section: 'western' },
    { id: 13, name: 'Chicken Piccante Pizza', cat: 'Brunch', margin: 62, price: 1500, section: 'western' },
    { id: 14, name: 'Bianco Pizza', cat: 'Brunch', margin: 68, price: 1400, section: 'western' },
    { id: 15, name: 'Garden Harvest Pizza', cat: 'Brunch', margin: 70, price: 1300, section: 'western' },
    { id: 16, name: 'Chocolate Brownie', cat: 'Dessert', margin: 78, price: 850, section: 'bakery' },
    { id: 17, name: 'Mango Cheesecake', cat: 'Dessert', margin: 76, price: 900, section: 'bakery' },
    { id: 18, name: 'Grilled Fish', cat: 'Dinner', margin: 65, price: 1800, section: 'western' },
    { id: 19, name: 'Grilled Chicken', cat: 'Dinner', margin: 60, price: 1600, section: 'western' },
    { id: 20, name: 'Mushroom Girasoli', cat: 'Dinner', margin: 72, price: 1400, section: 'western' },
    { id: 21, name: 'Jackfruit Steam Buns', cat: 'Dinner', margin: 68, price: 1200, section: 'western' },
    { id: 22, name: 'Skillet Cornfed Chicken', cat: 'Dinner', margin: 58, price: 2000, section: 'western' },
    { id: 23, name: 'Maans Ka Salan', cat: 'Godwar', margin: 55, price: 1800, section: 'indian' },
    { id: 24, name: 'Hing Dhaniya Aloo', cat: 'Godwar', margin: 74, price: 700, section: 'indian' },
    { id: 25, name: 'Gawar Pathe Ro Saak', cat: 'Godwar', margin: 70, price: 800, section: 'indian' },
    { id: 26, name: 'Murgh Soweta', cat: 'Godwar', margin: 62, price: 1600, section: 'indian' },
    { id: 27, name: 'Kaju Ker Ki Dhaak', cat: 'Godwar', margin: 68, price: 900, section: 'indian' },
    { id: 28, name: 'Aamchori Macchi', cat: 'Godwar', margin: 64, price: 1600, section: 'indian' },
  ],
  sherbagh: [
    { id: 101, name: 'Porridge', cat: 'Breakfast', margin: 74, price: 600, section: 'western' },
    { id: 102, name: 'Mushrooms on Toast', cat: 'Breakfast', margin: 70, price: 750, section: 'western' },
    { id: 103, name: 'Pancakes', cat: 'Breakfast', margin: 68, price: 700, section: 'bakery' },
    { id: 104, name: "Malaji's Rumble Tumble", cat: 'Breakfast', margin: 72, price: 850, section: 'western' },
    { id: 105, name: 'Coddled Eggs', cat: 'Breakfast', margin: 71, price: 700, section: 'western' },
    { id: 106, name: 'Akuri Pao', cat: 'Breakfast', margin: 70, price: 650, section: 'indian' },
    { id: 107, name: 'Kedgeree', cat: 'Breakfast', margin: 65, price: 900, section: 'western' },
    { id: 108, name: 'Croque Tiger', cat: 'Breakfast', margin: 62, price: 850, section: 'western' },
    { id: 109, name: 'Bacon Butty', cat: 'Breakfast', margin: 60, price: 800, section: 'western' },
    { id: 110, name: "Governor General's Breakfast", cat: 'Breakfast', margin: 58, price: 2200, section: 'western' },
    { id: 111, name: 'Mulligatawny', cat: 'Lunch – Soup', margin: 72, price: 650, section: 'indian' },
    { id: 112, name: 'Courgette Soup', cat: 'Lunch – Soup', margin: 74, price: 600, section: 'western' },
    { id: 113, name: 'Chicken Consomme', cat: 'Lunch – Soup', margin: 70, price: 700, section: 'western' },
    { id: 114, name: 'SUJÁN Organic Garden Salad', cat: 'Lunch – Salad', margin: 76, price: 800, section: 'western' },
    { id: 115, name: 'Waldorf Salad', cat: 'Lunch – Salad', margin: 70, price: 900, section: 'western' },
    { id: 116, name: 'Truffle Lyonnaise', cat: 'Lunch – Salad', margin: 68, price: 1100, section: 'western' },
    { id: 117, name: 'Spaghetti Aglio Olio', cat: 'Lunch – Main', margin: 68, price: 1100, section: 'western' },
    { id: 118, name: 'Caesar', cat: 'Lunch – Main', margin: 65, price: 1000, section: 'western' },
    { id: 119, name: 'Eggplant Involtini', cat: 'Lunch – Main', margin: 70, price: 1200, section: 'western' },
    { id: 120, name: 'Anglo-Indian Camp Curry', cat: 'Lunch – Main', margin: 62, price: 1400, section: 'indian' },
    { id: 121, name: 'Jhalfarazie Fish Cake', cat: 'Lunch – Main', margin: 64, price: 1600, section: 'western' },
    { id: 122, name: 'Burrah Sahib Club Sandwich', cat: 'Lunch – Main', margin: 60, price: 1100, section: 'western' },
    { id: 123, name: 'Double Barrel Burger', cat: 'Lunch – Main', margin: 58, price: 1400, section: 'western' },
    { id: 124, name: 'Coronation Chicken Pie', cat: 'Lunch – Main', margin: 62, price: 1500, section: 'western' },
    { id: 125, name: 'Crepe Suzette', cat: 'Dessert', margin: 76, price: 800, section: 'bakery' },
    { id: 126, name: 'Classic Mille Feuille', cat: 'Dessert', margin: 74, price: 850, section: 'bakery' },
    { id: 127, name: 'Chocolate Profiterole', cat: 'Dessert', margin: 73, price: 800, section: 'bakery' },
    { id: 128, name: 'Homemade Ice-Creams', cat: 'Dessert', margin: 78, price: 700, section: 'bakery' },
    { id: 129, name: 'Jalfrezi Pizza', cat: 'Pizza', margin: 62, price: 1600, section: 'western' },
    { id: 130, name: 'Diavola Pizza', cat: 'Pizza', margin: 60, price: 1600, section: 'western' },
    { id: 131, name: 'Roast Garlic & Goat Cheese Pizza', cat: 'Pizza', margin: 64, price: 1700, section: 'western' },
    { id: 132, name: 'Margherita Pizza', cat: 'Pizza', margin: 66, price: 1400, section: 'western' },
    { id: 133, name: 'Garden Harvest Pizza', cat: 'Pizza', margin: 68, price: 1400, section: 'western' },
    { id: 134, name: 'Hari Mirch ka Keema', cat: 'Thali', margin: 60, price: 2400, section: 'indian' },
    { id: 135, name: 'Dal Churchurree', cat: 'Thali', margin: 70, price: 2400, section: 'indian' },
    { id: 140, name: 'Sailana Murgh', cat: 'Thali', margin: 62, price: 2400, section: 'indian' },
    { id: 144, name: 'Macchi Methi Dana', cat: 'Thali', margin: 64, price: 2400, section: 'indian' },
  ],
  serai: [
    { id: 201, name: 'Minestrone Genovese', cat: 'Soup', margin: 72, price: 850, section: 'western' },
    { id: 202, name: 'Sweet Potato Soup', cat: 'Soup', margin: 74, price: 850, section: 'western' },
    { id: 203, name: 'Spinach Soup', cat: 'Soup', margin: 75, price: 850, section: 'western' },
    { id: 204, name: 'Mushroom Soup', cat: 'Soup', margin: 73, price: 850, section: 'western' },
    { id: 205, name: 'Smoked Chicken Soup', cat: 'Soup', margin: 70, price: 950, section: 'western' },
    { id: 206, name: 'Smoked Beetroot Feta Salad', cat: 'Salad', margin: 68, price: 1400, section: 'western' },
    { id: 207, name: 'Quinoa Salad', cat: 'Salad', margin: 70, price: 1400, section: 'western' },
    { id: 208, name: 'Orange and Dates Salad', cat: 'Salad', margin: 71, price: 1400, section: 'western' },
    { id: 209, name: 'Farmed Carrot Salad', cat: 'Salad', margin: 72, price: 1400, section: 'western' },
    { id: 210, name: 'The Serai Caesar Salad', cat: 'Salad', margin: 65, price: 1500, section: 'western' },
    { id: 211, name: 'Carrot and Onion Fritters', cat: 'Small Plate', margin: 70, price: 1400, section: 'western' },
    { id: 212, name: 'Leeks with Muhammara', cat: 'Small Plate', margin: 68, price: 1400, section: 'western' },
    { id: 213, name: 'SUJAN Garden Crudites', cat: 'Small Plate', margin: 72, price: 1400, section: 'western' },
    { id: 214, name: 'Chicken Shish Taouk', cat: 'Small Plate', margin: 65, price: 1600, section: 'western' },
    { id: 215, name: 'Lamb Albondigas', cat: 'Small Plate', margin: 60, price: 2000, section: 'western' },
    { id: 216, name: 'La Verdezza Pizza', cat: 'Pizza', margin: 64, price: 1750, section: 'western' },
    { id: 217, name: 'Bianca Pizza', cat: 'Pizza', margin: 65, price: 1750, section: 'western' },
    { id: 218, name: 'Agilo Bruciato Pizza', cat: 'Pizza', margin: 63, price: 1750, section: 'western' },
    { id: 219, name: 'Proscuitto Pizza', cat: 'Pizza', margin: 60, price: 1950, section: 'western' },
    { id: 220, name: 'Lamb Pide', cat: 'Pizza', margin: 58, price: 1950, section: 'western' },
    { id: 221, name: 'Chicken Picante Pizza', cat: 'Pizza', margin: 62, price: 1950, section: 'western' },
    { id: 222, name: 'Classic Diavola Pizza', cat: 'Pizza', margin: 61, price: 1950, section: 'western' },
    { id: 223, name: 'Cauliflower Steak', cat: 'Main', margin: 72, price: 1500, section: 'western' },
    { id: 224, name: 'Melanzane Parmigiana', cat: 'Main', margin: 70, price: 1750, section: 'western' },
    { id: 225, name: 'Pesto and Almond Risotto', cat: 'Main', margin: 68, price: 1800, section: 'western' },
    { id: 226, name: 'Morel Pici Pasta', cat: 'Main', margin: 66, price: 2500, section: 'western' },
    { id: 227, name: 'River Sole Sauce Vierge', cat: 'Main', margin: 62, price: 2500, section: 'western' },
    { id: 228, name: 'Wood Oven Roasted Chicken', cat: 'Main', margin: 60, price: 2500, section: 'western' },
    { id: 229, name: 'Chicken Tajine', cat: 'Main', margin: 61, price: 2500, section: 'western' },
    { id: 230, name: 'Pan Seared Duck', cat: 'Main', margin: 56, price: 2800, section: 'western' },
    { id: 231, name: 'Peri Peri Scampi', cat: 'Main', margin: 58, price: 2800, section: 'western' },
    { id: 232, name: 'Braised Lamb Shank', cat: 'Main', margin: 55, price: 3200, section: 'western' },
    { id: 233, name: 'Lemon Posset', cat: 'Dessert', margin: 78, price: 950, section: 'bakery' },
    { id: 234, name: 'Sticky Toffee Date Pudding', cat: 'Dessert', margin: 76, price: 950, section: 'bakery' },
    { id: 235, name: 'Mahalabia', cat: 'Dessert', margin: 77, price: 950, section: 'bakery' },
    { id: 236, name: 'Orange and Polenta Cake', cat: 'Dessert', margin: 75, price: 950, section: 'bakery' },
    { id: 237, name: 'Ice Cream and Sorbets', cat: 'Dessert', margin: 80, price: 950, section: 'bakery' },
    { id: 238, name: 'SUJAN Brownie', cat: 'Dessert', margin: 78, price: 1200, section: 'bakery' },
    { id: 239, name: 'Thar Murgh Thali', cat: 'Thali', margin: 62, price: 6000, section: 'indian' },
    { id: 240, name: 'Laal Maans Thali', cat: 'Thali', margin: 60, price: 6000, section: 'indian' },
    { id: 241, name: 'Lunch Thali', cat: 'Thali', margin: 64, price: 5000, section: 'indian' },
    { id: 242, name: 'Khud Raan Thali', cat: 'Thali', margin: 58, price: 6000, section: 'indian' },
  ],
};

export type DishSeedRow = {
  id: number;
  name: string;
  cat: string;
  cost_price: number;
  section: string;
};

/** Cost price derived from legacy margin/price pairs (food cost ≈ price × (1 − margin%)) */
export const DISHES_RAW: Record<CampId, DishSeedRow[]> = Object.fromEntries(
  Object.entries(DISHES_LEGACY).map(([camp, dishes]) => [
    camp,
    dishes.map((d) => ({
      id: d.id,
      name: d.name,
      cat: d.cat,
      cost_price: Math.round(d.price * (1 - d.margin / 100)),
      section: d.section,
    })),
  ]),
) as Record<CampId, DishSeedRow[]>;

/** Lookup for client fallback when DB still has margin % in cost_price */
export const COST_PRICE_LOOKUP: Record<string, number> = Object.fromEntries(
  Object.entries(DISHES_RAW).flatMap(([camp, dishes]) =>
    dishes.map((d) => [`${camp}-${d.id}`, d.cost_price] as const),
  ),
);

export const INGREDIENTS_RAW = [
  { id: 1, name: 'Chicken (Whole)', unit: 'kg', price: 220, openStock: 50, minStock: 10 },
  { id: 2, name: 'Lamb / Mutton', unit: 'kg', price: 650, openStock: 30, minStock: 8 },
  { id: 3, name: 'Fish (Fresh)', unit: 'kg', price: 380, openStock: 25, minStock: 6 },
  { id: 4, name: 'Eggs', unit: 'nos', price: 8, openStock: 300, minStock: 60 },
  { id: 5, name: 'Wheat Flour', unit: 'kg', price: 52, openStock: 40, minStock: 10 },
  { id: 6, name: 'Rice (Basmati)', unit: 'kg', price: 110, openStock: 30, minStock: 8 },
  { id: 7, name: 'Onion', unit: 'kg', price: 35, openStock: 60, minStock: 15 },
  { id: 8, name: 'Tomato', unit: 'kg', price: 40, openStock: 50, minStock: 12 },
  { id: 9, name: 'Potato', unit: 'kg', price: 28, openStock: 40, minStock: 10 },
  { id: 10, name: 'Spinach', unit: 'kg', price: 45, openStock: 20, minStock: 5 },
  { id: 11, name: 'Mushroom', unit: 'kg', price: 280, openStock: 12, minStock: 3 },
  { id: 12, name: 'Paneer', unit: 'kg', price: 320, openStock: 10, minStock: 2 },
  { id: 13, name: 'Fresh Cream', unit: 'ltr', price: 180, openStock: 15, minStock: 4 },
  { id: 14, name: 'Butter', unit: 'kg', price: 480, openStock: 10, minStock: 3 },
  { id: 15, name: 'Olive Oil', unit: 'ltr', price: 650, openStock: 8, minStock: 2 },
  { id: 16, name: 'Mozzarella', unit: 'kg', price: 520, openStock: 8, minStock: 2 },
  { id: 17, name: 'Pasta (Dry)', unit: 'kg', price: 95, openStock: 20, minStock: 5 },
  { id: 18, name: 'Dark Chocolate', unit: 'kg', price: 420, openStock: 8, minStock: 2 },
  { id: 19, name: 'Mango (Fresh)', unit: 'kg', price: 80, openStock: 25, minStock: 5 },
  { id: 20, name: 'Mixed Spices', unit: 'kg', price: 350, openStock: 5, minStock: 1 },
  { id: 21, name: 'Ginger-Garlic', unit: 'kg', price: 120, openStock: 10, minStock: 2 },
];

// jawai legacy dish id -> ingredient lines
export const RECIPES_RAW: Record<number, { id: number; g: number }[]> = {
  1: [{ id: 4, g: 150 }, { id: 14, g: 20 }, { id: 21, g: 10 }],
  6: [{ id: 2, g: 250 }, { id: 7, g: 80 }, { id: 8, g: 60 }, { id: 20, g: 15 }, { id: 21, g: 20 }],
  7: [{ id: 3, g: 220 }, { id: 6, g: 100 }, { id: 10, g: 60 }, { id: 21, g: 15 }],
  8: [{ id: 1, g: 180 }, { id: 5, g: 80 }, { id: 7, g: 50 }, { id: 16, g: 40 }, { id: 13, g: 30 }],
  16: [{ id: 18, g: 80 }, { id: 5, g: 60 }, { id: 14, g: 40 }, { id: 13, g: 50 }],
  17: [{ id: 19, g: 120 }, { id: 13, g: 80 }, { id: 14, g: 30 }],
  19: [{ id: 1, g: 220 }, { id: 7, g: 60 }, { id: 20, g: 15 }, { id: 15, g: 20 }],
  23: [{ id: 2, g: 280 }, { id: 7, g: 80 }, { id: 20, g: 20 }, { id: 21, g: 15 }],
};

export const STAFF_RAW = [
  { id: 1, name: 'Ramesh Kumar', designation: 'Executive Chef', section: 'Kitchen General', doj: '2020-01-15', camp: 'jawai' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '9001234567', email: 'ramesh@sujan.in' },
  { id: 2, name: 'Priya Sharma', designation: 'Sous Chef', section: 'Indian', doj: '2021-03-10', camp: 'jawai' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '9001234568', email: 'priya@sujan.in' },
  { id: 3, name: 'Anil Verma', designation: 'Chef de Partie', section: 'Western', doj: '2022-06-01', camp: 'jawai' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '9001234569', email: '' },
  { id: 4, name: 'Sunita Devi', designation: 'Baker', section: 'Bakery & Patisserie', doj: '2021-09-20', camp: 'jawai' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '', email: '' },
  { id: 5, name: 'Mohan Singh', designation: 'Chef de Partie', section: 'Indian', doj: '2023-01-05', camp: 'sherbagh' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '', email: '' },
  { id: 6, name: 'Deepa Nair', designation: 'Sous Chef', section: 'Western', doj: '2022-04-15', camp: 'sherbagh' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '', email: '' },
  { id: 7, name: 'Farhan Qureshi', designation: 'Commis Chef', section: 'Indian', doj: '2023-07-01', camp: 'serai' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '', email: '' },
  { id: 8, name: 'Laxmi Bai', designation: 'Pastry Chef', section: 'Bakery & Patisserie', doj: '2021-11-10', camp: 'serai' as CampId, initPL: 18, initCL: 5, initML: 7, phone: '', email: '' },
];

export const PUBLIC_HOLIDAYS_RAW = [
  { id: 1, date: '2026-01-26', name: 'Republic Day' },
  { id: 2, date: '2026-08-15', name: 'Independence Day' },
  { id: 3, date: '2026-10-02', name: 'Gandhi Jayanti' },
  { id: 4, date: '2026-10-20', name: 'Dussehra' },
  { id: 5, date: '2026-11-08', name: 'Diwali' },
];

export function getDishUuidForLegacy(camp: CampId, legacyId: number): string {
  return dishUuid(camp, legacyId);
}

export function getIngrUuidForLegacy(legacyId: number): string {
  return ingrUuid(legacyId);
}

export function getStaffUuidForLegacy(legacyId: number): string {
  return staffUuid(legacyId);
}

export function getHolidayUuidForLegacy(legacyId: number): string {
  return holidayUuid(legacyId);
}
