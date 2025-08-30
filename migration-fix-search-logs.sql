-- Migration to fix search_logs table schema
-- This script updates the search_logs table to match the expected API structure

-- First, backup existing data if any
CREATE TABLE search_logs_backup AS SELECT * FROM search_logs;

-- Drop the existing table (be careful - this will lose existing data)
DROP TABLE search_logs;

-- Recreate the table with correct schema
CREATE TABLE search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    search_query TEXT NOT NULL, -- Changed from JSONB to TEXT
    applicant_name TEXT, -- New column for applicant name
    results_found INTEGER NOT NULL DEFAULT 0, -- Changed from search_result BOOLEAN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX idx_search_logs_ip ON search_logs(ip_address);
CREATE INDEX idx_search_logs_applicant_name ON search_logs(applicant_name);

-- Enable Row Level Security (RLS)
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Allow system insert logs" ON search_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read logs" ON search_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Optional: If you have existing data in search_logs_backup, you can migrate it
-- UPDATE: Since the old schema had JSONB and BOOLEAN types, manual migration would be needed
-- This is left as a comment for manual review

-- Drop backup table after confirming migration is successful
-- DROP TABLE search_logs_backup;