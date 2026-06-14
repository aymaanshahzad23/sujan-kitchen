ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS guest_1_birthdate date,
  ADD COLUMN IF NOT EXISTS guest_2_birthdate date,
  ADD COLUMN IF NOT EXISTS anniversary_date date,
  ADD COLUMN IF NOT EXISTS checkin_id text;

CREATE UNIQUE INDEX IF NOT EXISTS guests_checkin_id_key
  ON guests (checkin_id)
  WHERE checkin_id IS NOT NULL;
