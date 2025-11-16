-- Add search date columns to competitor_prices for better calendar tracking
ALTER TABLE competitor_prices ADD COLUMN search_checkin DATE;
ALTER TABLE competitor_prices ADD COLUMN search_checkout DATE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_competitor_prices_search_dates ON competitor_prices(search_checkin, search_checkout);

