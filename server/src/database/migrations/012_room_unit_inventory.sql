ALTER TABLE rooms ADD COLUMN unit_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE availability ADD COLUMN open_units INTEGER;

UPDATE availability
SET open_units = CASE
  WHEN open_units IS NULL THEN available
  ELSE open_units
END;


