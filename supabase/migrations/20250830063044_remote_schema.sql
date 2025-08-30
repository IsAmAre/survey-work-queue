

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."search_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "text" NOT NULL,
    "search_query" "text" NOT NULL,
    "applicant_name" "text",
    "results_found" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."search_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_logs_backup" (
    "id" "uuid",
    "ip_address" "text",
    "search_query" "jsonb",
    "search_result" boolean,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."search_logs_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" integer NOT NULL,
    "request_number" "text" NOT NULL,
    "applicant_name" "text" NOT NULL,
    "days_pending" integer DEFAULT 0 NOT NULL,
    "surveyor_name" "text" NOT NULL,
    "survey_type" "text" NOT NULL,
    "appointment_date" "text" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_requests"
    ADD CONSTRAINT "survey_requests_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_search_logs_applicant_name" ON "public"."search_logs" USING "btree" ("applicant_name");



CREATE INDEX "idx_search_logs_created_at" ON "public"."search_logs" USING "btree" ("created_at");



CREATE INDEX "idx_search_logs_ip" ON "public"."search_logs" USING "btree" ("ip_address");



CREATE INDEX "idx_survey_requests_applicant_name" ON "public"."survey_requests" USING "btree" ("applicant_name");



CREATE INDEX "idx_survey_requests_request_applicant" ON "public"."survey_requests" USING "btree" ("request_number", "applicant_name");



CREATE INDEX "idx_survey_requests_request_number" ON "public"."survey_requests" USING "btree" ("request_number");



CREATE POLICY "Allow authenticated read logs" ON "public"."search_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users full access" ON "public"."survey_requests" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow public read access" ON "public"."survey_requests" FOR SELECT USING (true);



CREATE POLICY "Allow system insert logs" ON "public"."search_logs" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."search_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_requests" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."search_logs" TO "anon";
GRANT ALL ON TABLE "public"."search_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."search_logs" TO "service_role";



GRANT ALL ON TABLE "public"."search_logs_backup" TO "anon";
GRANT ALL ON TABLE "public"."search_logs_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."search_logs_backup" TO "service_role";



GRANT ALL ON TABLE "public"."survey_requests" TO "anon";
GRANT ALL ON TABLE "public"."survey_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
