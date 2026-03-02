-- Add position column to survey_requests table
ALTER TABLE survey_requests ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '';
