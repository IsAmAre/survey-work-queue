import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Check if user is authenticated (basic check)
async function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get today's date in ISO format (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get tomorrow's date for comparison (start of next day)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    // Execute all queries in parallel for better performance
    const [
      totalItemsResult,
      completedItemsResult,
      pendingItemsResult,
      todaySearchesResult
    ] = await Promise.all([
      // Total survey requests
      supabase
        .from('survey_requests')
        .select('id', { count: 'exact', head: true }),
      
      // Completed survey requests
      supabase
        .from('survey_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      
      // Pending survey requests (assuming 'pending' status or non-completed)
      supabase
        .from('survey_requests')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'completed'),
      
      // Today's searches
      supabase
        .from('search_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO)
    ]);

    // Check for errors
    if (totalItemsResult.error) {
      console.error('Error fetching total items:', totalItemsResult.error);
      throw new Error('Failed to fetch total items');
    }

    if (completedItemsResult.error) {
      console.error('Error fetching completed items:', completedItemsResult.error);
      throw new Error('Failed to fetch completed items');
    }

    if (pendingItemsResult.error) {
      console.error('Error fetching pending items:', pendingItemsResult.error);
      throw new Error('Failed to fetch pending items');
    }

    if (todaySearchesResult.error) {
      console.error('Error fetching today\'s searches:', todaySearchesResult.error);
      throw new Error('Failed to fetch today\'s searches');
    }

    // Get additional stats - status breakdown
    const { data: statusBreakdown, error: statusError } = await supabase
      .from('survey_requests')
      .select('status')
      .not('status', 'is', null);

    if (statusError) {
      console.error('Error fetching status breakdown:', statusError);
      throw new Error('Failed to fetch status breakdown');
    }

    // Process status breakdown
    const statusCounts: Record<string, number> = {};
    statusBreakdown?.forEach(item => {
      const status = item.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Get recent activity (last 7 days of searches)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const { data: recentSearches, error: recentError } = await supabase
      .from('search_logs')
      .select('created_at')
      .gte('created_at', sevenDaysAgoISO)
      .order('created_at', { ascending: true });

    if (recentError) {
      console.error('Error fetching recent searches:', recentError);
    }

    // Group recent searches by day
    const dailySearches: Record<string, number> = {};
    recentSearches?.forEach(search => {
      const date = new Date(search.created_at).toISOString().split('T')[0];
      dailySearches[date] = (dailySearches[date] || 0) + 1;
    });

    const stats = {
      totalItems: totalItemsResult.count || 0,
      completedItems: completedItemsResult.count || 0,
      pendingItems: pendingItemsResult.count || 0,
      todaySearches: todaySearchesResult.count || 0,
      statusBreakdown: statusCounts,
      dailySearches: dailySearches,
      completionRate: totalItemsResult.count > 0 
        ? Math.round(((completedItemsResult.count || 0) / totalItemsResult.count) * 100) 
        : 0
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('GET stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}