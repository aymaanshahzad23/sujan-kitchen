-- Enable Supabase Realtime for all dashboard tables.
-- Run once in the Supabase SQL editor (after 001_initial_schema.sql).

ALTER PUBLICATION supabase_realtime ADD TABLE camps;
ALTER PUBLICATION supabase_realtime ADD TABLE public_holidays;
ALTER PUBLICATION supabase_realtime ADD TABLE ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE recipe_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE dish_direct_costs;
ALTER PUBLICATION supabase_realtime ADD TABLE kots;
ALTER PUBLICATION supabase_realtime ADD TABLE camp_ingredient_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE issuances;
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_records;
ALTER PUBLICATION supabase_realtime ADD TABLE comp_offs;
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_dish_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
