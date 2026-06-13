import type { CampId } from '../types/database';
import { buildProfileKey, buildStayKey } from '../utils/guests';
import { dishUuid, guestUuid, profileUuid } from './uuids';

/** Demo "today" — keep seed aligned with product screenshots */
export const DEMO_TODAY = '2026-06-13';

export type DemoGuestRow = {
  id: number;
  profileId: number;
  camp: CampId;
  regNo: string;
  name: string;
  phone: string;
  nationality: string;
  tent: string;
  checkIn: string;
  checkOut: string;
  foodPref: string;
  allergies: string;
  dietNotes: string;
  experiences: string;
  feedback: string;
  chefNotes: string;
  status: 'in-house' | 'expected' | 'checked-out';
};

export const DEMO_GUESTS: DemoGuestRow[] = [
  // ══ JAWAI — present (in-house) ══════════════════════════════════
  {
    id: 1, profileId: 1, camp: 'jawai', regNo: 'JW-2026-014',
    name: 'James & Emily Hartley', phone: '+44 7700 900123', nationality: 'United Kingdom',
    tent: 'Tent 3', checkIn: '2026-06-10', checkOut: '2026-06-16',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Prefer lighter lunches; Emily avoids shellfish',
    experiences: 'Bush dinner booked 12 Jun; leopard safari 11 Jun', feedback: '',
    chefNotes: 'Celebrating anniversary — note on dessert plate', status: 'in-house',
  },
  {
    id: 2, profileId: 2, camp: 'jawai', regNo: 'JW-2026-018',
    name: 'Dr. Rajeev Mehta', phone: '+91 98200 11234', nationality: 'India',
    tent: 'Tent 7', checkIn: '2026-06-10', checkOut: '2026-06-16',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Low spice at breakfast; enjoys regional Godwar menu',
    experiences: 'Village walk 11 Jun', feedback: 'Excellent laal maas on previous visit',
    chefNotes: 'Returning guest — 3rd visit', status: 'in-house',
  },
  {
    id: 3, profileId: 3, camp: 'jawai', regNo: 'JW-2026-011',
    name: 'Sophie Laurent', phone: '+33 6 12 34 56 78', nationality: 'France',
    tent: 'Tent 12', checkIn: '2026-06-08', checkOut: '2026-06-14',
    foodPref: 'omnivore', allergies: 'Gluten', dietNotes: 'Strict gluten-free; ok with rice and millets',
    experiences: 'Photography drive 10 Jun', feedback: '',
    chefNotes: 'Use separate prep area for GF items', status: 'in-house',
  },
  {
    id: 4, profileId: 4, camp: 'jawai', regNo: 'JW-2026-019',
    name: 'Marcus & Linda Whitmore', phone: '+1 415 555 0198', nationality: 'United States',
    tent: 'Tent 5', checkIn: '2026-06-11', checkOut: '2026-06-17',
    foodPref: 'pescatarian', allergies: '', dietNotes: 'No red meat; fish and vegetarian mains only',
    experiences: 'Rock climbing 13 Jun', feedback: '', chefNotes: '', status: 'in-house',
  },
  // ══ JAWAI — future (expected) ═══════════════════════════════════
  {
    id: 5, profileId: 5, camp: 'jawai', regNo: 'JW-2026-022',
    name: 'David Chen', phone: '+65 9123 4567', nationality: 'Singapore',
    tent: 'Tent 9', checkIn: '2026-06-15', checkOut: '2026-06-19',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Prefers Asian-spiced breakfasts',
    experiences: 'Arriving afternoon of 15 Jun', feedback: '',
    chefNotes: 'Welcome amenity — mango lassi', status: 'expected',
  },
  {
    id: 6, profileId: 6, camp: 'jawai', regNo: 'JW-2026-025',
    name: 'Kenji & Yoko Fujimoto', phone: '+81 80 9876 5432', nationality: 'Japan',
    tent: 'Tent 11', checkIn: '2026-06-20', checkOut: '2026-06-24',
    foodPref: 'pescatarian', allergies: '', dietNotes: 'Light dinners; enjoys local fish preparations',
    experiences: 'Birding extension booked', feedback: '',
    chefNotes: 'First visit — confirm spice tolerance on arrival', status: 'expected',
  },
  // ══ JAWAI — past (checked-out) ═══════════════════════════════════
  {
    id: 7, profileId: 7, camp: 'jawai', regNo: 'JW-2026-004',
    name: 'Patricia Webb', phone: '+1 617 555 0144', nationality: 'United States',
    tent: 'Tent 2', checkIn: '2026-06-01', checkOut: '2026-06-06',
    foodPref: 'vegetarian', allergies: '', dietNotes: 'Enjoyed millet-based breakfasts',
    experiences: 'Departure 6 Jun', feedback: 'Wonderful Godwar flavours — will return',
    chefNotes: '', status: 'checked-out',
  },
  {
    id: 8, profileId: 8, camp: 'jawai', regNo: 'JW-2026-002',
    name: 'The Sinclair Family', phone: '+44 161 496 0345', nationality: 'United Kingdom',
    tent: 'Tent 6', checkIn: '2026-03-12', checkOut: '2026-03-18',
    foodPref: 'omnivore', allergies: 'Dairy', dietNotes: 'One child — mild spice; lactose-free desserts',
    experiences: 'Spring break safari', feedback: 'Kids loved the waffle breakfast',
    chefNotes: '', status: 'checked-out',
  },
  {
    id: 9, profileId: 1, camp: 'jawai', regNo: 'JW-2025-041',
    name: 'James & Emily Hartley', phone: '+44 7700 900123', nationality: 'United Kingdom',
    tent: 'Tent 8', checkIn: '2025-02-14', checkOut: '2025-02-18',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Anniversary trip — same couple as current stay',
    experiences: 'Valentine bush dinner', feedback: 'Memorable first SUJÁN stay',
    chefNotes: '', status: 'checked-out',
  },
  {
    id: 10, profileId: 10, camp: 'jawai', regNo: 'JW-2025-112',
    name: "Michael O'Brien", phone: '+353 87 123 4567', nationality: 'Ireland',
    tent: 'Tent 1', checkIn: '2025-12-20', checkOut: '2025-12-26',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Christmas week guest — prefers hearty breakfasts',
    experiences: 'Christmas Eve dinner', feedback: 'Laal maas was highlight',
    chefNotes: '', status: 'checked-out',
  },
  {
    id: 11, profileId: 11, camp: 'jawai', regNo: 'JW-2025-078',
    name: 'Sandra Liu', phone: '+86 138 0013 8000', nationality: 'China',
    tent: 'Tent 10', checkIn: '2025-10-05', checkOut: '2025-10-09',
    foodPref: 'omnivore', allergies: 'Shellfish', dietNotes: 'No prawns or crab — fish ok',
    experiences: 'Diwali week visit', feedback: '', chefNotes: '', status: 'checked-out',
  },
  {
    id: 12, profileId: 2, camp: 'jawai', regNo: 'JW-2025-089',
    name: 'Dr. Rajeev Mehta', phone: '+91 98200 11234', nationality: 'India',
    tent: 'Tent 4', checkIn: '2025-11-10', checkOut: '2025-11-14',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Low spice at breakfast',
    experiences: 'Birding walk', feedback: 'Memorable Godwar thali on last night',
    chefNotes: '', status: 'checked-out',
  },
  {
    id: 13, profileId: 13, camp: 'jawai', regNo: 'JW-2026-001',
    name: 'Arjun & Neha Kapoor', phone: '+91 98100 55443', nationality: 'India',
    tent: 'Tent 4', checkIn: '2026-01-08', checkOut: '2026-01-12',
    foodPref: 'vegetarian', allergies: '', dietNotes: 'Winter sun break — prefers hot soups at lunch',
    experiences: 'New Year stay', feedback: 'Excellent bakery selection',
    chefNotes: '', status: 'checked-out',
  },
  {
    id: 14, profileId: 14, camp: 'jawai', regNo: 'JW-2026-003',
    name: 'Robert & Helen Morris', phone: '+44 7700 900456', nationality: 'United Kingdom',
    tent: 'Tent 9', checkIn: '2026-04-02', checkOut: '2026-04-07',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Easter holiday — requested picnic hampers',
    experiences: 'Easter brunch outdoors', feedback: '', chefNotes: '', status: 'checked-out',
  },

  // ══ SHERBAGH — present ════════════════════════════════════════════
  {
    id: 21, profileId: 21, camp: 'sherbagh', regNo: 'SB-2026-006',
    name: 'Eleanor & Henry Ashworth', phone: '+44 20 7946 0958', nationality: 'United Kingdom',
    tent: 'Tent 2', checkIn: '2026-06-09', checkOut: '2026-06-15',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Classic Anglo-Indian comfort food',
    experiences: 'Horse safari 12 Jun', feedback: '', chefNotes: 'Tea service at 4pm daily', status: 'in-house',
  },
  {
    id: 22, profileId: 22, camp: 'sherbagh', regNo: 'SB-2026-008',
    name: 'Ananya Krishnan', phone: '+91 98450 12345', nationality: 'India',
    tent: 'Tent 6', checkIn: '2026-06-11', checkOut: '2026-06-18',
    foodPref: 'vegetarian', allergies: '', dietNotes: 'No onion-garlic on Tuesdays',
    experiences: 'Jungle drive 13 Jun', feedback: '', chefNotes: '', status: 'in-house',
  },
  // ══ SHERBAGH — checked out today (just departed) ══════════════════
  {
    id: 23, profileId: 23, camp: 'sherbagh', regNo: 'SB-2026-003',
    name: 'Thomas Berg', phone: '+49 170 1234567', nationality: 'Germany',
    tent: 'Tent 4', checkIn: '2026-06-07', checkOut: '2026-06-13',
    foodPref: 'omnivore', allergies: 'Nuts', dietNotes: 'Nut-free kitchen protocol',
    experiences: 'Departed 13 Jun morning', feedback: 'Loved the camp curry',
    chefNotes: '', status: 'checked-out',
  },
  // ══ SHERBAGH — expected ═══════════════════════════════════════════
  {
    id: 24, profileId: 24, camp: 'sherbagh', regNo: 'SB-2026-012',
    name: 'Priya & Arjun Nair', phone: '+91 98765 43210', nationality: 'India',
    tent: 'Tent 8', checkIn: '2026-06-16', checkOut: '2026-06-20',
    foodPref: 'omnivore', allergies: '', dietNotes: '',
    experiences: 'Honeymoon — arriving 16 Jun', feedback: '',
    chefNotes: 'Prepare welcome platter', status: 'expected',
  },
  {
    id: 29, profileId: 29, camp: 'sherbagh', regNo: 'SB-2026-015',
    name: 'Claire Morrison', phone: '+1 416 555 0188', nationality: 'Canada',
    tent: 'Tent 5', checkIn: '2026-06-18', checkOut: '2026-06-22',
    foodPref: 'gluten-free', allergies: 'Gluten', dietNotes: 'Celiac — strict GF throughout',
    experiences: 'Arriving 18 Jun', feedback: '', chefNotes: 'GF briefing for kitchen team', status: 'expected',
  },
  // ══ SHERBAGH — past ══════════════════════════════════════════════
  {
    id: 25, profileId: 21, camp: 'sherbagh', regNo: 'SB-2025-044',
    name: 'Eleanor & Henry Ashworth', phone: '+44 20 7946 0958', nationality: 'United Kingdom',
    tent: 'Tent 3', checkIn: '2025-09-14', checkOut: '2025-09-19',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Prior visit — requested same afternoon tea setup',
    experiences: 'Tiger safari anniversary', feedback: 'Governor General breakfast unforgettable',
    chefNotes: '', status: 'checked-out',
  },
  {
    id: 26, profileId: 26, camp: 'sherbagh', regNo: 'SB-2026-001',
    name: 'Vikram & Shalini Patel', phone: '+91 98250 66778', nationality: 'India',
    tent: 'Tent 1', checkIn: '2026-05-10', checkOut: '2026-05-15',
    foodPref: 'omnivore', allergies: '', dietNotes: 'May visit — enjoyed thali lunch',
    experiences: 'Family safari', feedback: 'Kids loved pancakes', chefNotes: '', status: 'checked-out',
  },
  {
    id: 27, profileId: 27, camp: 'sherbagh', regNo: 'SB-2026-002',
    name: 'George & Margaret Williams', phone: '+44 20 7946 0123', nationality: 'United Kingdom',
    tent: 'Tent 7', checkIn: '2026-02-20', checkOut: '2026-02-25',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Senior guests — soft textures preferred',
    experiences: 'Winter birding', feedback: '', chefNotes: '', status: 'checked-out',
  },
  {
    id: 28, profileId: 28, camp: 'sherbagh', regNo: 'SB-2025-098',
    name: 'Jean-Luc Dubois', phone: '+33 6 11 22 33 44', nationality: 'France',
    tent: 'Tent 9', checkIn: '2025-11-22', checkOut: '2025-11-27',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Wine pairing notes from F&B — coordinate desserts',
    experiences: 'Thanksgiving week', feedback: 'Mille feuille outstanding', chefNotes: '', status: 'checked-out',
  },

  // ══ THE SERAI — present ═══════════════════════════════════════════
  {
    id: 31, profileId: 31, camp: 'serai', regNo: 'SR-2026-005',
    name: 'Catherine Moore', phone: '+1 212 555 0142', nationality: 'United States',
    tent: 'Tent 1', checkIn: '2026-06-08', checkOut: '2026-06-14',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Enjoys wood-fired mains',
    experiences: 'Desert sundowner 11 Jun', feedback: '', chefNotes: '', status: 'in-house',
  },
  {
    id: 32, profileId: 32, camp: 'serai', regNo: 'SR-2026-007',
    name: 'Oliver & Grace Pemberton', phone: '+61 412 345 678', nationality: 'Australia',
    tent: 'Tent 3', checkIn: '2026-06-10', checkOut: '2026-06-17',
    foodPref: 'omnivore', allergies: '', dietNotes: 'One child — mild spice only',
    experiences: 'Camel ride 12 Jun', feedback: '', chefNotes: 'High chair required', status: 'in-house',
  },
  {
    id: 33, profileId: 33, camp: 'serai', regNo: 'SR-2026-002',
    name: 'Yuki Tanaka', phone: '+81 90 1234 5678', nationality: 'Japan',
    tent: 'Tent 5', checkIn: '2026-06-12', checkOut: '2026-06-16',
    foodPref: 'pescatarian', allergies: '', dietNotes: 'Prefers grilled fish and rice',
    experiences: 'Stargazing 13 Jun', feedback: '', chefNotes: '', status: 'in-house',
  },
  // ══ THE SERAI — expected ══════════════════════════════════════════
  {
    id: 34, profileId: 34, camp: 'serai', regNo: 'SR-2026-011',
    name: 'Isabelle Fontaine', phone: '+33 6 98 76 54 32', nationality: 'France',
    tent: 'Tent 7', checkIn: '2026-06-18', checkOut: '2026-06-22',
    foodPref: 'vegetarian', allergies: '', dietNotes: 'Organic produce preferred',
    experiences: 'Arriving 18 Jun', feedback: '', chefNotes: '', status: 'expected',
  },
  // ══ THE SERAI — past ══════════════════════════════════════════════
  {
    id: 35, profileId: 31, camp: 'serai', regNo: 'SR-2026-001',
    name: 'Catherine Moore', phone: '+1 212 555 0142', nationality: 'United States',
    tent: 'Tent 2', checkIn: '2026-03-05', checkOut: '2026-03-10',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Spring visit — loved wood oven chicken',
    experiences: 'Holi week stay', feedback: 'Best meal of the trip', chefNotes: '', status: 'checked-out',
  },
  {
    id: 36, profileId: 36, camp: 'serai', regNo: 'SR-2026-003',
    name: 'Hassan Al-Rashid', phone: '+971 50 123 4567', nationality: 'UAE',
    tent: 'Tent 4', checkIn: '2026-05-01', checkOut: '2026-05-06',
    foodPref: 'halal', allergies: '', dietNotes: 'Halal protocol; no alcohol in cooking',
    experiences: 'May long weekend', feedback: 'Lamb shank exceptional', chefNotes: '', status: 'checked-out',
  },
  {
    id: 37, profileId: 37, camp: 'serai', regNo: 'SR-2025-067',
    name: 'Klaus & Ingrid Schmidt', phone: '+49 170 9988776', nationality: 'Germany',
    tent: 'Tent 6', checkIn: '2025-12-10', checkOut: '2025-12-16',
    foodPref: 'omnivore', allergies: '', dietNotes: 'Christmas market tour guests',
    experiences: 'Festive dinner 15 Dec', feedback: '', chefNotes: '', status: 'checked-out',
  },
  {
    id: 38, profileId: 38, camp: 'serai', regNo: 'SR-2026-004',
    name: 'Amara Okonkwo', phone: '+234 803 456 7890', nationality: 'Nigeria',
    tent: 'Tent 8', checkIn: '2026-02-08', checkOut: '2026-02-12',
    foodPref: 'omnivore', allergies: 'Peanuts', dietNotes: 'Strict peanut allergy — kitchen alert',
    experiences: 'Valentine long weekend', feedback: 'Sticky toffee pudding favourite',
    chefNotes: '', status: 'checked-out',
  },
];

export type DemoLeaveRow = {
  id: number;
  staffLegacyId: number;
  type: string;
  dateFrom: string;
  dateTo: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  splits?: { type: string; days: number }[];
};

export const DEMO_LEAVE_RECORDS: DemoLeaveRow[] = [
  {
    id: 1,
    staffLegacyId: 1,
    type: 'CL',
    dateFrom: '2026-06-13',
    dateTo: '2026-06-15',
    note: 'Family visit in Jodhpur',
    status: 'approved',
  },
  {
    id: 2,
    staffLegacyId: 2,
    type: 'WO',
    dateFrom: '2026-06-13',
    dateTo: '2026-06-19',
    note: 'Summer break — split across WO and CL',
    status: 'approved',
    splits: [
      { type: 'WO', days: 4 },
      { type: 'CL', days: 3 },
    ],
  },
  {
    id: 3,
    staffLegacyId: 4,
    type: 'CL',
    dateFrom: '2026-06-18',
    dateTo: '2026-06-22',
    note: 'Personal errands',
    status: 'approved',
  },
  {
    id: 4,
    staffLegacyId: 3,
    type: 'CL',
    dateFrom: '2026-06-20',
    dateTo: '2026-06-21',
    note: 'Awaiting chef approval',
    status: 'pending',
  },
  {
    id: 5,
    staffLegacyId: 6,
    type: 'PL',
    dateFrom: '2026-06-14',
    dateTo: '2026-06-16',
    note: 'Family wedding',
    status: 'approved',
  },
];

export type DemoComplaintRow = {
  id: number;
  camp: CampId;
  dishLegacyId: number | null;
  date: string;
  type: string;
  severity: string;
  description: string;
  reporter: string;
};

export const DEMO_COMPLAINTS: DemoComplaintRow[] = [
  {
    id: 1, camp: 'jawai', dishLegacyId: 16, date: '2026-06-11', type: 'complaint', severity: 'low',
    description: 'Brownie portion felt small for a sharing dessert — guest expected larger slice.',
    reporter: 'James Hartley · Tent 3',
  },
  {
    id: 2, camp: 'jawai', dishLegacyId: null, date: '2026-06-12', type: 'compliment', severity: 'low',
    description: 'Godwar thali for Dr. Mehta was outstanding — requested recipe card.',
    reporter: 'Dr. Rajeev Mehta · Tent 7',
  },
  {
    id: 3, camp: 'sherbagh', dishLegacyId: 120, date: '2026-06-10', type: 'complaint', severity: 'medium',
    description: 'Camp curry salt level high for guest — remade successfully.',
    reporter: 'Thomas Berg · Tent 4',
  },
  {
    id: 4, camp: 'serai', dishLegacyId: 228, date: '2026-06-11', type: 'compliment', severity: 'low',
    description: 'Wood oven chicken — best meal of the trip per guest feedback form.',
    reporter: 'Catherine Moore · Tent 1',
  },
  {
    id: 5, camp: 'jawai', dishLegacyId: 6, date: '2025-11-13', type: 'compliment', severity: 'low',
    description: 'Laal maas on final night — guest wrote thank-you note to kitchen.',
    reporter: 'Dr. Rajeev Mehta · Tent 4 (prior stay)',
  },
  {
    id: 6, camp: 'sherbagh', dishLegacyId: 125, date: '2025-09-17', type: 'compliment', severity: 'low',
    description: 'Classic mille feuille — requested again on return visit.',
    reporter: 'Eleanor Ashworth · Tent 3 (prior stay)',
  },
  {
    id: 7, camp: 'jawai', dishLegacyId: 2, date: '2025-02-16', type: 'compliment', severity: 'low',
    description: "Ranger's Breakfast on anniversary morning — perfect.",
    reporter: 'James Hartley · Tent 8 (prior stay)',
  },
];

export type DemoGuestDishLogRow = {
  guestLegacyId: number;
  camp: CampId;
  dishLegacyId: number;
  date: string;
  meal: string;
  notes: string;
};

export const DEMO_GUEST_DISH_LOGS: DemoGuestDishLogRow[] = [
  // Current in-house
  { guestLegacyId: 1, camp: 'jawai', dishLegacyId: 2, date: '2026-06-11', meal: 'Breakfast', notes: "Loved Ranger's Breakfast — repeat tomorrow" },
  { guestLegacyId: 2, camp: 'jawai', dishLegacyId: 23, date: '2026-06-11', meal: 'Dinner', notes: 'Godwar highlight' },
  { guestLegacyId: 3, camp: 'jawai', dishLegacyId: 3, date: '2026-06-10', meal: 'Breakfast', notes: 'GF quinoa hash — approved' },
  { guestLegacyId: 4, camp: 'jawai', dishLegacyId: 7, date: '2026-06-12', meal: 'Lunch', notes: 'Banana leaf fish — pescatarian favourite' },
  { guestLegacyId: 21, camp: 'sherbagh', dishLegacyId: 110, date: '2026-06-10', meal: 'Breakfast', notes: "Governor General's — special occasion" },
  { guestLegacyId: 22, camp: 'sherbagh', dishLegacyId: 134, date: '2026-06-12', meal: 'Dinner', notes: 'Vegetarian thali — no onion-garlic Tue' },
  { guestLegacyId: 31, camp: 'serai', dishLegacyId: 239, date: '2026-06-09', meal: 'Dinner', notes: 'Thar Murgh Thali — excellent' },
  { guestLegacyId: 32, camp: 'serai', dishLegacyId: 238, date: '2026-06-11', meal: 'Dessert', notes: 'Brownie for child — small portion' },
  { guestLegacyId: 33, camp: 'serai', dishLegacyId: 227, date: '2026-06-12', meal: 'Dinner', notes: 'River sole — light prep' },
  // Past stays — preference memory for returning guests
  { guestLegacyId: 9, camp: 'jawai', dishLegacyId: 2, date: '2025-02-15', meal: 'Breakfast', notes: 'Anniversary breakfast — same dish requested again 2026' },
  { guestLegacyId: 12, camp: 'jawai', dishLegacyId: 23, date: '2025-11-13', meal: 'Dinner', notes: 'Godwar thali — repeat on every visit' },
  { guestLegacyId: 25, camp: 'sherbagh', dishLegacyId: 110, date: '2025-09-15', meal: 'Breakfast', notes: 'Governor General — must have on return' },
  { guestLegacyId: 35, camp: 'serai', dishLegacyId: 228, date: '2026-03-08', meal: 'Dinner', notes: 'Wood oven chicken — ordered again this stay' },
  { guestLegacyId: 23, camp: 'sherbagh', dishLegacyId: 120, date: '2026-06-09', meal: 'Lunch', notes: 'Camp curry — nut-free confirmed' },
];

export type DemoKotRow = {
  camp: CampId;
  dishLegacyId: number;
  date: string;
  qty: number;
  type: 'Guest' | 'Manager';
  revenue: number;
  tent: string | null;
  guestLegacyId: number | null;
};

const DISH_PRICE: Record<CampId, Record<number, number>> = {
  jawai: Object.fromEntries(
    [
      [1, 650], [2, 1800], [3, 950], [4, 750], [5, 600], [6, 2200], [7, 1800], [8, 1400],
      [9, 1200], [10, 1100], [16, 850], [17, 900], [18, 1800], [19, 1600], [23, 1800],
      [24, 700], [26, 1600], [28, 1600],
    ],
  ),
  sherbagh: Object.fromEntries(
    [
      [101, 600], [103, 700], [106, 650], [110, 2200], [111, 650], [117, 1100], [120, 1400],
      [122, 1100], [125, 800], [132, 1400], [134, 2400],
    ],
  ),
  serai: Object.fromEntries(
    [
      [201, 850], [210, 1500], [216, 1750], [224, 1750], [227, 2500], [228, 2500], [233, 950],
      [238, 1200], [239, 6000], [241, 5000],
    ],
  ),
};

/** Default dish rotation per camp — used for any guest without a custom plan */
const CAMP_DEFAULT_DISHES: Record<CampId, number[]> = {
  jawai: [1, 2, 5, 6, 7, 10, 16, 18, 23, 26],
  sherbagh: [101, 103, 106, 110, 117, 120, 122, 125, 132, 134],
  serai: [201, 210, 216, 224, 227, 228, 233, 238, 239, 241],
};

/** Per-guest order plan overrides (optional — falls back to camp defaults) */
const GUEST_ORDER_OVERRIDES: Partial<Record<number, number[]>> = {
  1: [1, 2, 4, 8, 16, 18],
  2: [5, 6, 23, 24, 26, 28],
  3: [3, 7, 10, 17, 20],
  4: [7, 9, 10, 18, 21],
  22: [106, 114, 134, 135],
  23: [101, 111, 120, 122, 132],
};

function orderPlanForGuest(guest: DemoGuestRow): { camp: CampId; dishes: number[] } {
  const override = GUEST_ORDER_OVERRIDES[guest.id];
  return {
    camp: guest.camp,
    dishes: override ?? CAMP_DEFAULT_DISHES[guest.camp],
  };
}

function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(from + 'T12:00:00');
  const end = new Date(to + 'T12:00:00');
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function guestActiveOnDate(g: DemoGuestRow, date: string): boolean {
  return date >= g.checkIn && date <= g.checkOut && g.status !== 'expected';
}

function dishPrice(camp: CampId, legacyId: number): number {
  return DISH_PRICE[camp]?.[legacyId] ?? 1000;
}

/** Guest-linked KOT rows — every past + present stay gets orders; expected guests skipped */
export function generateDemoKotRows(): DemoKotRow[] {
  const rows: DemoKotRow[] = [];

  for (const guest of DEMO_GUESTS) {
    if (guest.status === 'expected') continue;
    const plan = orderPlanForGuest(guest);
    const dates = eachDate(guest.checkIn, guest.checkOut);
    let dishIdx = 0;

    for (const date of dates) {
      if (!guestActiveOnDate(guest, date)) continue;
      const isLastDay = date === guest.checkOut;
      const ordersToday = guest.status === 'checked-out'
        ? 2
        : isLastDay
          ? 1
          : 2 + (guest.id % 2);
      for (let o = 0; o < ordersToday; o++) {
        const dishLegacyId = plan.dishes[dishIdx % plan.dishes.length];
        dishIdx++;
        const qty = 1 + (o === 0 ? 0 : guest.id % 2);
        const price = dishPrice(plan.camp, dishLegacyId);
        rows.push({
          camp: plan.camp,
          dishLegacyId,
          date,
          qty,
          type: 'Guest',
          revenue: price * qty,
          tent: guest.tent,
          guestLegacyId: guest.id,
        });
      }
    }
  }

  // Manager/staff meals — no guest link
  const managerMeals: { camp: CampId; dishLegacyId: number; date: string }[] = [
    { camp: 'jawai', dishLegacyId: 1, date: '2026-06-11' },
    { camp: 'jawai', dishLegacyId: 5, date: '2026-06-12' },
    { camp: 'jawai', dishLegacyId: 24, date: '2026-06-13' },
    { camp: 'sherbagh', dishLegacyId: 106, date: '2026-06-11' },
    { camp: 'sherbagh', dishLegacyId: 111, date: '2026-06-12' },
    { camp: 'serai', dishLegacyId: 201, date: '2026-06-10' },
    { camp: 'serai', dishLegacyId: 241, date: '2026-06-12' },
  ];
  for (const m of managerMeals) {
    rows.push({
      camp: m.camp,
      dishLegacyId: m.dishLegacyId,
      date: m.date,
      qty: 2,
      type: 'Manager',
      revenue: 0,
      tent: null,
      guestLegacyId: null,
    });
  }

  return rows;
}

export function guestProfileKey(g: DemoGuestRow): string {
  return buildProfileKey(g.name, g.phone);
}

export function guestStayKey(g: DemoGuestRow): string {
  return buildStayKey(g.tent, g.name, g.phone);
}

export function guestDishId(camp: CampId, legacyId: number): string {
  return dishUuid(camp, legacyId);
}

export function guestRowId(legacyId: number): string {
  return guestUuid(legacyId);
}

export function guestProfileRowId(profileId: number): string {
  return profileUuid(profileId);
}
