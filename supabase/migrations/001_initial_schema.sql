-- SUJÁN Kitchen Dashboard — Phase 1 schema
-- RLS policies are permissive (dev-only) until Phase 2 auth

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Lookup / config ──────────────────────────────────────────────

CREATE TABLE camps (
  id text PRIMARY KEY,
  name text NOT NULL,
  opening_stock_value numeric NOT NULL DEFAULT 0,
  purchases_value numeric NOT NULL DEFAULT 0
);

CREATE TABLE public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  name text NOT NULL
);

CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id int UNIQUE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  price numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0
);

-- ── Menu (per camp) ───────────────────────────────────────────────

CREATE TABLE dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  legacy_id int,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  cost_price numeric NOT NULL DEFAULT 200,
  section text NOT NULL DEFAULT 'western',
  UNIQUE (camp_id, legacy_id)
);

CREATE TABLE recipe_lines (
  dish_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  grams numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (dish_id, ingredient_id)
);

CREATE TABLE dish_direct_costs (
  dish_id uuid PRIMARY KEY REFERENCES dishes(id) ON DELETE CASCADE,
  cost numeric NOT NULL DEFAULT 0
);

-- ── Operations ─────────────────────────────────────────────────────

CREATE TABLE kots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  date date NOT NULL,
  qty int NOT NULL DEFAULT 1,
  type text NOT NULL DEFAULT 'Guest' CHECK (type IN ('Guest', 'Manager')),
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Inventory (per camp) ───────────────────────────────────────────

CREATE TABLE camp_ingredient_stock (
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  opening_stock numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (camp_id, ingredient_id)
);

CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  qty numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  date date NOT NULL
);

CREATE TABLE issuances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  to_section text NOT NULL DEFAULT 'indian',
  qty numeric NOT NULL DEFAULT 0,
  date date NOT NULL,
  reason text
);

-- ── HR ─────────────────────────────────────────────────────────────

CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  name text NOT NULL,
  designation text NOT NULL,
  section text NOT NULL,
  doj date NOT NULL,
  phone text,
  email text,
  init_pl numeric NOT NULL DEFAULT 18,
  init_cl numeric NOT NULL DEFAULT 5,
  init_ml numeric NOT NULL DEFAULT 7
);

CREATE TABLE leave_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  type text NOT NULL,
  date_from date NOT NULL,
  date_to date,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  splits jsonb
);

CREATE TABLE comp_offs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  earned date NOT NULL,
  expiry date NOT NULL,
  used boolean NOT NULL DEFAULT false,
  reason text
);

-- ── Guests + complaints ────────────────────────────────────────────

CREATE TABLE guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  reg_no text,
  name text NOT NULL,
  nationality text,
  tent text,
  check_in date,
  check_out date,
  food_pref text NOT NULL DEFAULT 'omnivore',
  allergies text,
  diet_notes text,
  experiences text,
  feedback text,
  chef_notes text,
  status text NOT NULL DEFAULT 'in-house'
);

CREATE TABLE guest_dish_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  dish_id uuid REFERENCES dishes(id) ON DELETE SET NULL,
  dish_name text,
  date date NOT NULL,
  meal text,
  notes text
);

CREATE TABLE complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id text NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  dish_id uuid REFERENCES dishes(id) ON DELETE SET NULL,
  date date NOT NULL,
  type text NOT NULL DEFAULT 'complaint',
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  reporter text
);

-- ── Indexes ────────────────────────────────────────────────────────

CREATE INDEX idx_kots_camp_date ON kots(camp_id, date);
CREATE INDEX idx_kots_dish ON kots(dish_id);
CREATE INDEX idx_dishes_camp ON dishes(camp_id);
CREATE INDEX idx_leave_staff ON leave_records(staff_id, date_from);
CREATE INDEX idx_purchases_camp ON purchases(camp_id);
CREATE INDEX idx_issuances_camp ON issuances(camp_id);
CREATE INDEX idx_guests_camp ON guests(camp_id);
CREATE INDEX idx_complaints_camp ON complaints(camp_id);

-- ── RLS (Phase 1: permissive dev policies) ─────────────────────────

ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_direct_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kots ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_ingredient_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_offs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_dish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_all_camps" ON camps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_public_holidays" ON public_holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_dishes" ON dishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_recipe_lines" ON recipe_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_dish_direct_costs" ON dish_direct_costs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_kots" ON kots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_camp_ingredient_stock" ON camp_ingredient_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_issuances" ON issuances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_leave_records" ON leave_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_comp_offs" ON comp_offs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_guests" ON guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_guest_dish_logs" ON guest_dish_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_complaints" ON complaints FOR ALL USING (true) WITH CHECK (true);
