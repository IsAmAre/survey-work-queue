'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminWrapper } from '@/components/admin/AdminWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Download, 
  Calendar, 
  Users, 
  Activity, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileX,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface SearchLog {
  id: string;
  search_query: string;
  applicant_name: string | null;
  ip_address: string;
  created_at: string;
  results_found: number;
}

interface SearchLogsResponse {
  logs: SearchLog[];
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

export default function SearchLogsPage() {
  const [data, setData] = useState<SearchLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateeTo] = useState('');

  const fetchLogs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      if (dateFrom) {
        params.set('date_from', dateFrom);
      }

      if (dateTo) {
        params.set('date_to', dateTo);
      }

      const response = await fetch(`/api/admin/search-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please try logging in again.');
        }
        throw new Error(`Failed to fetch search logs: ${response.status} ${response.statusText}`);
      }

      const responseData: SearchLogsResponse = await response.json();
      setData(responseData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch search logs';
      setError(errorMessage);
      console.error('Error fetching search logs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchLogs();
  };

  const handleReset = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateeTo('');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }

      // Fetch all logs without pagination for export
      const params = new URLSearchParams({
        limit: '10000', // Large number to get all results
      });

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      if (dateFrom) {
        params.set('date_from', dateFrom);
      }

      if (dateTo) {
        params.set('date_to', dateTo);
      }

      const response = await fetch(`/api/admin/search-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      const exportData: SearchLogsResponse = await response.json();

      // Convert to CSV
      const csvContent = [
        // Header
        'Date,Time,Search Query,Applicant Name,IP Address,Results Found',
        // Rows
        ...exportData.logs.map(log => {
          const date = new Date(log.created_at);
          const dateStr = date.toLocaleDateString('th-TH');
          const timeStr = date.toLocaleTimeString('th-TH');
          
          return [
            dateStr,
            timeStr,
            `"${log.search_query.replace(/"/g, '""')}"`, // Escape quotes
            log.applicant_name ? `"${log.applicant_name.replace(/"/g, '""')}"` : '',
            log.ip_address,
            log.results_found.toString()
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      relative: formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: th 
      })
    };
  };

  const StatCard = ({ title, value, icon: Icon, description, trend }: {
    title: string;
    value: string | number;
    icon: any;
    description?: string;
    trend?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
            {trend && <span className="text-green-600 ml-1">{trend}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Search Logs</h2>
            <p className="text-muted-foreground">
              ติดตามและวิเคราะห์การค้นหาของผู้ใช้งาน
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || !data?.logs.length}
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
              {exporting ? 'กำลังส่งออก...' : 'ส่งออก CSV'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        {data?.statistics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="ค้นหาทั้งหมด"
              value={data.statistics.totalSearches}
              icon={Search}
              description="จำนวนการค้นหาทั้งหมด"
            />
            <StatCard
              title="ค้นหาวันนี้"
              value={data.statistics.totalSearchesToday}
              icon={Activity}
              description="จำนวนการค้นหาในวันนี้"
            />
            <StatCard
              title="ผู้ใช้ทั้งหมด"
              value={data.statistics.uniqueIPs}
              icon={Users}
              description={`วันนี้: ${data.statistics.uniqueIPsToday} คน`}
            />
            <StatCard
              title="อัตราความสำเร็จ"
              value={`${data.statistics.successRate}%`}
              icon={TrendingUp}
              description="การค้นหาที่มีผลลัพธ์"
            />
          </div>
        )}

        {/* Popular Searches */}
        {data?.statistics.popularSearches.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">คำค้นหายอดนิยม</CardTitle>
                <CardDescription>10 คำค้นหาที่ใช้บ่อยที่สุด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.statistics.popularSearches.slice(0, 5).map((search, index) => (
                    <div key={search.query} className="flex justify-between items-center">
                      <span className="text-sm truncate">{search.query}</span>
                      <Badge variant="secondary">{search.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">IP Address ที่ใช้บ่อย</CardTitle>
                <CardDescription>IP ที่ทำการค้นหาบ่อยที่สุด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.statistics.topIPs.slice(0, 5).map((ip, index) => (
                    <div key={ip.ip} className="flex justify-between items-center">
                      <span className="text-sm font-mono">{ip.ip}</span>
                      <Badge variant="secondary">{ip.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">กรองข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="search">ค้นหา</Label>
                <Input
                  id="search"
                  placeholder="ค้นหาคำค้นหา, ชื่อ, หรือ IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <Label htmlFor="dateFrom">วันที่เริ่มต้น</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">วันที่สิ้นสุด</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateeTo(e.target.value)}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  รีเซ็ต
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">บันทึกการค้นหา</CardTitle>
            <CardDescription>
              {data?.pagination && (
                <>
                  แสดง {((data.pagination.page - 1) * data.pagination.limit) + 1}-
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} 
                  จาก {data.pagination.total.toLocaleString()} รายการ
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">กำลังโหลด...</span>
              </div>
            ) : data?.logs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <FileX className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">ไม่พบข้อมูล</h3>
                <p className="text-muted-foreground">ไม่พบบันทึกการค้นหาที่ตรงกับเงื่อนไข</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>วันที่/เวลา</TableHead>
                        <TableHead>คำค้นหา</TableHead>
                        <TableHead>ชื่อผู้สมัคร</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">ผลลัพธ์</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.logs.map((log) => {
                        const dateTime = formatDateTime(log.created_at);
                        return (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{dateTime.date}</div>
                                <div className="text-sm text-muted-foreground">
                                  {dateTime.time}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {dateTime.relative}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={log.search_query}>
                                {log.search_query || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.applicant_name ? (
                                <div className="max-w-xs truncate" title={log.applicant_name}>
                                  {log.applicant_name}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{log.ip_address}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={log.results_found > 0 ? "default" : "secondary"}
                              >
                                {log.results_found}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-muted-foreground">
                      หน้า {data.pagination.page} จาก {data.pagination.totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!data.pagination.hasPrev}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        ก่อนหน้า
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!data.pagination.hasNext}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        ถัดไป
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminWrapper>
  );
}