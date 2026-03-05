CREATE TABLE IF NOT EXISTS public.search_daily_stats (
    stat_date date PRIMARY KEY,
    total_searches bigint NOT NULL DEFAULT 0,
    successful_searches bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.search_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rollup_search_log_to_daily_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.search_daily_stats (
        stat_date,
        total_searches,
        successful_searches,
        created_at,
        updated_at
    )
    VALUES (
        (NEW.created_at AT TIME ZONE 'Asia/Bangkok')::date,
        1,
        CASE WHEN COALESCE(NEW.results_found, 0) > 0 THEN 1 ELSE 0 END,
        now(),
        now()
    )
    ON CONFLICT (stat_date)
    DO UPDATE SET
        total_searches = public.search_daily_stats.total_searches + 1,
        successful_searches = public.search_daily_stats.successful_searches + EXCLUDED.successful_searches,
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS search_logs_daily_rollup_trigger ON public.search_logs;

CREATE TRIGGER search_logs_daily_rollup_trigger
AFTER INSERT ON public.search_logs
FOR EACH ROW
EXECUTE FUNCTION public.rollup_search_log_to_daily_stats();

INSERT INTO public.search_daily_stats (stat_date, total_searches, successful_searches, created_at, updated_at)
SELECT
    (created_at AT TIME ZONE 'Asia/Bangkok')::date AS stat_date,
    COUNT(*)::bigint AS total_searches,
    COUNT(*) FILTER (WHERE COALESCE(results_found, 0) > 0)::bigint AS successful_searches,
    now(),
    now()
FROM public.search_logs
GROUP BY 1
ON CONFLICT (stat_date)
DO UPDATE SET
    total_searches = EXCLUDED.total_searches,
    successful_searches = EXCLUDED.successful_searches,
    updated_at = now();
