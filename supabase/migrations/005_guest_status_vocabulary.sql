-- Align guest status vocabulary with the app (in-house | expected | checked-out)

UPDATE guests SET status = 'checked-out' WHERE status IN ('departed', 'checked_out');

ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_status_check;
ALTER TABLE guests
  ADD CONSTRAINT guests_status_check
  CHECK (status IN ('in-house', 'expected', 'checked-out'));
