import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sanitizePostgrestFilter } from '@/lib/text-utils';

// Check if user is authenticated (basic check)
async function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

interface SearchLogsResponse {
  logs: Array<{
    id: string;
    search_query: string;
    applicant_name: string | null;
    ip_address: string;
    created_at: string;
    results_found: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: {
    totalSearches: number;
    uniqueIPs: number;
    totalSearchesToday: number;
    uniqueIPsToday: number;
    successRate: number;
    popularSearches: Array<{
      query: string;
      count: number;
    }>;
    topIPs: Array<{
      ip: string;
      count: number;
    }>;
  };
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

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // Cap at 100
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const searchTerm = searchParams.get('search') || '';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query using admin client to bypass RLS
    let query = supabaseAdmin
      .from('search_logs')
      .select('*', { count: 'exact' });

    let countQuery = supabaseAdmin
      .from('search_logs')
      .select('*', { count: 'exact', head: true });

    // Apply filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', fromDate.toISOString());
      countQuery = countQuery.gte('created_at', fromDate.toISOString());
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
      countQuery = countQuery.lte('created_at', toDate.toISOString());
    }

    if (searchTerm) {
      // Sanitize to prevent PostgREST filter injection
      const sanitized = sanitizePostgrestFilter(searchTerm);
      if (sanitized) {
        const searchPattern = `%${sanitized}%`;
        query = query.or(`search_query.ilike.${searchPattern},applicant_name.ilike.${searchPattern},ip_address.ilike.${searchPattern}`);
        countQuery = countQuery.or(`search_query.ilike.${searchPattern},applicant_name.ilike.${searchPattern},ip_address.ilike.${searchPattern}`);
      }
    }

    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute queries in parallel
    const [logsResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    if (logsResult.error) {
      console.error('Error fetching search logs:', logsResult.error);
      throw new Error('Failed to fetch search logs');
    }

    if (countResult.error) {
      console.error('Error fetching search logs count:', countResult.error);
      throw new Error('Failed to fetch search logs count');
    }

    const logs = logsResult.data || [];
    const total = countResult.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get today's date for statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    // Execute statistics queries in parallel
    const [
      totalSearchesResult,
      uniqueIPsResult,
      todaySearchesResult,
      todayUniqueIPsResult,
      successfulSearchesResult,
      popularSearchesResult,
      topIPsResult
    ] = await Promise.all([
      // Total searches
      supabaseAdmin
        .from('search_logs')
        .select('id', { count: 'exact', head: true }),
      
      // Unique IPs (all time)
      supabaseAdmin
        .from('search_logs')
        .select('ip_address')
        .not('ip_address', 'is', null),
      
      // Today's searches
      supabaseAdmin
        .from('search_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO),
      
      // Today's unique IPs
      supabaseAdmin
        .from('search_logs')
        .select('ip_address')
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO)
        .not('ip_address', 'is', null),
      
      // Successful searches (results_found > 0)
      supabaseAdmin
        .from('search_logs')
        .select('id', { count: 'exact', head: true })
        .gt('results_found', 0),
      
      // Popular searches (top 10)
      supabaseAdmin
        .from('search_logs')
        .select('search_query')
        .not('search_query', 'is', null)
        .limit(1000), // Get recent 1000 to analyze
      
      // Top IPs (top 10)
      supabaseAdmin
        .from('search_logs')
        .select('ip_address')
        .not('ip_address', 'is', null)
        .limit(1000) // Get recent 1000 to analyze
    ]);

    // Process unique IPs count
    const allUniqueIPs = new Set(
      (uniqueIPsResult.data || []).map(item => item.ip_address)
    );
    
    const todayUniqueIPs = new Set(
      (todayUniqueIPsResult.data || []).map(item => item.ip_address)
    );

    // Process popular searches
    const searchCounts: Record<string, number> = {};
    (popularSearchesResult.data || []).forEach(item => {
      const query = item.search_query?.trim();
      if (query) {
        searchCounts[query] = (searchCounts[query] || 0) + 1;
      }
    });

    const popularSearches = Object.entries(searchCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Process top IPs
    const ipCounts: Record<string, number> = {};
    (topIPsResult.data || []).forEach(item => {
      const ip = item.ip_address;
      if (ip) {
        ipCounts[ip] = (ipCounts[ip] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Calculate success rate
    const totalSearchesCount = totalSearchesResult.count || 0;
    const successfulSearchesCount = successfulSearchesResult.count || 0;
    const successRate = totalSearchesCount > 0 
      ? Math.round((successfulSearchesCount / totalSearchesCount) * 100)
      : 0;

    const response: SearchLogsResponse = {
      logs: logs.map(log => ({
        id: log.id,
        search_query: log.search_query || '',
        applicant_name: log.applicant_name,
        ip_address: log.ip_address || '',
        created_at: log.created_at,
        results_found: log.results_found || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        totalSearches: totalSearchesCount,
        uniqueIPs: allUniqueIPs.size,
        totalSearchesToday: todaySearchesResult.count || 0,
        uniqueIPsToday: todayUniqueIPs.size,
        successRate,
        popularSearches,
        topIPs
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET search-logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}