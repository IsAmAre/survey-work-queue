-- Migration: Add new columns for land-db.csv data format
-- Date: 2026-02-19

-- Add new columns
ALTER TABLE survey_requests
  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS action_date TEXT DEFAULT '';

-- Make order_number and days_pending optional (nullable)
ALTER TABLE survey_requests
  ALTER COLUMN order_number DROP NOT NULL,
  ALTER COLUMN days_pending DROP NOT NULL;

-- Set defaults for old columns
ALTER TABLE survey_requests
  ALTER COLUMN order_number SET DEFAULT 0,
  ALTER COLUMN days_pending SET DEFAULT 0;

-- Create index for document_number search
CREATE INDEX IF NOT EXISTS idx_survey_requests_document_number ON survey_requests(document_number);
