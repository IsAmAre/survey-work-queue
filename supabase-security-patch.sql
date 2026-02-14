-- Security Patch: Tighten RLS policies
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Remove overly permissive public SELECT on survey_requests
-- (All access now goes through API routes using service_role)
DROP POLICY IF EXISTS "Allow public read access" ON survey_requests;

-- 2. Remove public INSERT on search_logs
-- (Search API now uses supabaseAdmin/service_role for log insertion)
DROP POLICY IF EXISTS "Allow system insert logs" ON search_logs;

-- 3. Revoke unnecessary grants from anon role
REVOKE ALL ON TABLE "public"."survey_requests" FROM "anon";
REVOKE ALL ON TABLE "public"."search_logs" FROM "anon";

-- 4. Grant minimal permissions
-- anon only needs SELECT on survey_requests (for direct Supabase client if needed)
-- If all access goes through service_role API, even this can be removed
GRANT SELECT ON TABLE "public"."survey_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_requests" TO "service_role";
GRANT ALL ON TABLE "public"."search_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."search_logs" TO "service_role";
