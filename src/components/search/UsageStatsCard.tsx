'use client';

import { Activity, BarChart3, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface UsageStatsResponse {
  todaySearches: number;
  last7DaysSearches: number;
  last30DaysSearches: number;
  allTimeSearches: number;
  lastUpdatedAt: string;
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 text-amber-100">
        <Icon className="h-4 w-4 text-amber-200" />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export function UsageStatsCard() {
  const [stats, setStats] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/public/search-stats', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch usage stats');
        }

        const data = (await response.json()) as UsageStatsResponse;
        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Usage stats fetch error:', error);
        if (mounted) {
          setStats(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    if (!stats?.lastUpdatedAt) {
      return '-';
    }

    const parsed = new Date(stats.lastUpdatedAt);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [stats?.lastUpdatedAt]);

  return (
    <div className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-4 w-full md:w-[270px] shadow-lg">
      <p className="text-sm font-bold text-white mb-3">สถิติการใช้งาน</p>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/20 animate-pulse" />
          <div className="h-4 w-11/12 rounded bg-white/20 animate-pulse" />
          <div className="h-4 w-10/12 rounded bg-white/20 animate-pulse" />
          <div className="h-4 w-9/12 rounded bg-white/20 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-2">
          <StatRow
            icon={Activity}
            label="ค้นหาวันนี้"
            value={stats ? stats.todaySearches.toLocaleString() : '-'}
          />
          <StatRow
            icon={BarChart3}
            label="7 วันล่าสุด"
            value={stats ? stats.last7DaysSearches.toLocaleString() : '-'}
          />
          <StatRow
            icon={CalendarDays}
            label="30 วันล่าสุด"
            value={stats ? stats.last30DaysSearches.toLocaleString() : '-'}
          />
          <StatRow
            icon={Activity}
            label="ทั้งหมด"
            value={stats ? stats.allTimeSearches.toLocaleString() : '-'}
          />
          <p className="text-[11px] text-amber-200/90 pt-1">อัปเดตล่าสุด {lastUpdatedLabel}</p>
        </div>
      )}
    </div>
  );
}
