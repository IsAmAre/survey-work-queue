import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface DailyStatRow {
  stat_date: string;
  total_searches: number;
  updated_at: string | null;
}

function formatBangkokDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to format Bangkok date');
  }

  return `${year}-${month}-${day}`;
}

function shiftDate(dateString: string, days: number): string {
  const base = new Date(`${dateString}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const today = formatBangkokDate(new Date());
    const start7Days = shiftDate(today, -6);
    const start30Days = shiftDate(today, -29);

    const { data, error } = await supabaseAdmin
      .from('search_daily_stats')
      .select('stat_date,total_searches,updated_at')
      .order('stat_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch search stats: ${error.message}`);
    }

    const rows = (data || []) as DailyStatRow[];
    const todayRow = rows.find((row) => row.stat_date === today);

    const last7DaysSearches = rows
      .filter((row) => row.stat_date >= start7Days && row.stat_date <= today)
      .reduce((sum, row) => sum + (row.total_searches || 0), 0);
    const last30DaysSearches = rows
      .filter((row) => row.stat_date >= start30Days && row.stat_date <= today)
      .reduce((sum, row) => sum + (row.total_searches || 0), 0);
    const allTimeSearches = rows.reduce((sum, row) => sum + (row.total_searches || 0), 0);
    const todaySearches = todayRow?.total_searches || 0;

    const latestUpdated = rows.length > 0
      ? rows[rows.length - 1].updated_at
      : null;

    return NextResponse.json(
      {
        todaySearches,
        last7DaysSearches,
        last30DaysSearches,
        allTimeSearches,
        lastUpdatedAt: latestUpdated || new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Public search stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  }
}
