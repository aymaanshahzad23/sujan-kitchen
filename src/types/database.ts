export type CampId = 'jawai' | 'sherbagh' | 'serai';

export type Section = 'indian' | 'western' | 'bakery';

export type KotType = 'Guest' | 'Manager';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveSplit = { type: string; days: number };

export interface Camp {
  id: CampId;
  name: string;
  opening_stock_value: number;
  purchases_value: number;
}

export interface Dish {
  id: string;
  camp_id: CampId;
  legacy_id: number | null;
  name: string;
  category: string;
  cost_price: number;
  section: Section;
}

export interface Ingredient {
  id: string;
  legacy_id: number | null;
  name: string;
  unit: string;
  price: number;
  min_stock: number;
}

export interface CampIngredientStock {
  camp_id: CampId;
  ingredient_id: string;
  opening_stock: number;
}

export interface RecipeLine {
  dish_id: string;
  ingredient_id: string;
  grams: number;
}

export interface Kot {
  id: string;
  camp_id: CampId;
  dish_id: string;
  date: string;
  qty: number;
  type: KotType;
  revenue: number;
  tent: string | null;
  guest_id: string | null;
  created_at?: string;
}

export interface Purchase {
  id: string;
  camp_id: CampId;
  ingredient_id: string;
  qty: number;
  price: number;
  date: string;
}

export interface Issuance {
  id: string;
  camp_id: CampId;
  ingredient_id: string;
  to_section: string;
  qty: number;
  date: string;
  reason: string | null;
}

export interface StaffMember {
  id: string;
  camp_id: CampId;
  name: string;
  designation: string;
  section: string;
  doj: string;
  phone: string | null;
  email: string | null;
  init_pl: number;
  init_cl: number;
  init_ml: number;
}

export interface LeaveRecord {
  id: string;
  staff_id: string;
  type: string;
  date_from: string;
  date_to: string | null;
  note: string | null;
  status: LeaveStatus;
  splits: LeaveSplit[] | null;
}

export interface CompOff {
  id: string;
  staff_id: string;
  earned: string;
  expiry: string;
  used: boolean;
  reason: string | null;
}

export interface PublicHoliday {
  id: string;
  date: string;
  name: string;
}

export interface Guest {
  id: string;
  camp_id: CampId;
  reg_no: string | null;
  name: string;
  phone: string | null;
  profile_id: string | null;
  profile_key: string | null;
  stay_key: string | null;
  nationality: string | null;
  tent: string | null;
  check_in: string | null;
  check_out: string | null;
  food_pref: string;
  allergies: string | null;
  diet_notes: string | null;
  experiences: string | null;
  feedback: string | null;
  chef_notes: string | null;
  status: string;
  dish_log?: GuestDishLog[];
}

export interface GuestDishLog {
  id: string;
  guest_id: string;
  dish_id: string | null;
  dish_name: string | null;
  date: string;
  meal: string | null;
  notes: string | null;
}

export interface Complaint {
  id: string;
  camp_id: CampId;
  dish_id: string | null;
  date: string;
  type: string;
  severity: string;
  description: string;
  reporter: string | null;
}

export interface DishDirectCost {
  dish_id: string;
  cost: number;
}

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      camps: TableDef<Camp>;
      dishes: TableDef<Dish, Omit<Dish, 'id'> & { id?: string }>;
      ingredients: TableDef<Ingredient, Omit<Ingredient, 'id'> & { id?: string; legacy_id?: number | null }>;
      camp_ingredient_stock: TableDef<CampIngredientStock>;
      recipe_lines: TableDef<RecipeLine>;
      dish_direct_costs: TableDef<DishDirectCost>;
      kots: TableDef<Kot, Omit<Kot, 'id' | 'created_at'> & { id?: string; created_at?: string }>;
      purchases: TableDef<Purchase, Omit<Purchase, 'id'> & { id?: string }>;
      issuances: TableDef<Issuance, Omit<Issuance, 'id'> & { id?: string }>;
      staff: TableDef<StaffMember, Omit<StaffMember, 'id'> & { id?: string }>;
      leave_records: TableDef<LeaveRecord, Omit<LeaveRecord, 'id'> & { id?: string }>;
      comp_offs: TableDef<CompOff, Omit<CompOff, 'id'> & { id?: string }>;
      public_holidays: TableDef<PublicHoliday, Omit<PublicHoliday, 'id'> & { id?: string }>;
      guests: TableDef<Guest, Omit<Guest, 'id' | 'dish_log'> & { id?: string }>;
      guest_dish_logs: TableDef<GuestDishLog, Omit<GuestDishLog, 'id'> & { id?: string }>;
      complaints: TableDef<Complaint, Omit<Complaint, 'id'> & { id?: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Legacy-compatible shapes used by ported UI logic
export interface LegacyKot {
  id: string;
  dishId: string;
  date: string;
  qty: number;
  type: KotType;
  revenue: number;
  tent: string;
  guestId: string;
}

export interface LegacyDish {
  id: string;
  name: string;
  cat: string;
  costPrice: number;
  section: Section;
}

export interface LegacyStaff {
  id: string;
  name: string;
  designation: string;
  section: string;
  doj: string;
  camp: CampId;
  initPL: number;
  initCL: number;
  initML: number;
  phone: string;
  email: string;
}

export interface LegacyLeave {
  id: string;
  staffId: string;
  type: string;
  date: string;
  dateTo?: string;
  note: string;
  status: LeaveStatus;
  splits?: LeaveSplit[];
}

export interface LegacyGuest {
  id: string;
  camp: CampId;
  regNo: string;
  name: string;
  phone: string;
  profileId: string;
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
  status: string;
  dishLog: { dishId: string; dishName: string; date: string; meal: string; notes: string }[];
}
