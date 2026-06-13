-- Guest identity (profile + stay keys), phone, and KOT tent/guest linkage

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS profile_key text,
  ADD COLUMN IF NOT EXISTS stay_key text;

ALTER TABLE kots
  ADD COLUMN IF NOT EXISTS tent text,
  ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES guests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_guests_profile_key ON guests(camp_id, profile_key);
CREATE INDEX IF NOT EXISTS idx_guests_stay_key ON guests(camp_id, stay_key);
CREATE INDEX IF NOT EXISTS idx_kots_guest ON kots(guest_id);
CREATE INDEX IF NOT EXISTS idx_kots_tent ON kots(camp_id, tent, date);

-- One active stay per tent+name+phone at a camp
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_active_stay_key
  ON guests(camp_id, stay_key)
  WHERE status IN ('in-house', 'expected') AND stay_key IS NOT NULL;
