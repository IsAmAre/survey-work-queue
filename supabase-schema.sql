-- Create survey_requests table
CREATE TABLE survey_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number INTEGER NOT NULL,
    request_number TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    days_pending INTEGER NOT NULL DEFAULT 0,
    surveyor_name TEXT NOT NULL,
    survey_type TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search_logs table for security monitoring
CREATE TABLE search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    search_query JSONB NOT NULL,
    search_result BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_survey_requests_request_number ON survey_requests(request_number);
CREATE INDEX idx_survey_requests_applicant_name ON survey_requests(applicant_name);
CREATE INDEX idx_survey_requests_request_applicant ON survey_requests(request_number, applicant_name);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX idx_search_logs_ip ON search_logs(ip_address);

-- Enable Row Level Security (RLS)
ALTER TABLE survey_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for survey_requests
-- Public can only read data (search functionality)
CREATE POLICY "Allow public read access" ON survey_requests
    FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated users full access" ON survey_requests
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for search_logs
-- Only the system can insert logs
CREATE POLICY "Allow system insert logs" ON search_logs
    FOR INSERT WITH CHECK (true);

-- Only authenticated users (admin) can read logs
CREATE POLICY "Allow authenticated read logs" ON search_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert demo data (for testing purposes)
INSERT INTO survey_requests (order_number, request_number, applicant_name, days_pending, surveyor_name, survey_type, appointment_date, status) VALUES
(1, 'DEMO-001/2568', 'นายสมชาย  ใจดี', 45, 'นายสมศักดิ์  วิชาการ', 'ออกโฉนดที่ดิน', '15 มกราคม 2568', 'กำลังดำเนินการ'),
(2, 'DEMO-002/2568', 'นางสาวสุดา  รักงาน', 30, 'นายประเสริฐ  ช่างวัด', 'ตรวจสอบเขตที่ดิน', '20 มกราคม 2568', 'รอเอกสาร'),
(3, 'DEMO-003/2568', 'นายวิชัย  ตัวอย่าง', 15, 'นายสมศักดิ์  วิชาการ', 'แบ่งแยกที่ดิน', '25 มกราคม 2568', 'เสร็จสิ้น'),
(4, 'DEMO-004/2568', 'นางมาลี  ทดสอบ', 60, 'นายประเสริฐ  ช่างวัด', 'รวมโฉนดที่ดิน', '10 มกราคม 2568', 'รอการอนุมัติ'),
(5, 'DEMO-005/2568', 'นายทดสอบ  ระบบ', 5, 'นายสมศักดิ์  วิชาการ', 'ออกใบรับรอง', '30 มกราคม 2568', 'กำลังดำเนินการ');