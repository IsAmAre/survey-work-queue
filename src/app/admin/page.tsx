'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Search, BarChart3, Users, RefreshCw, AlertTriangle, Activity, Download } from 'lucide-react';
import { AdminWrapper } from '@/components/admin/AdminWrapper';
import { supabase } from '@/lib/supabase/client';

interface AdminStatsResponse {
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  todaySearches: number;
  statusBreakdown: Record<string, number>;
  dailySearches: Record<string, number>;
  completionRate: number;
}

// Loading skeleton component for cards
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
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

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please try logging in again.');
        }
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
      }

      const data: AdminStatsResponse = await response.json();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    fetchStats();
  };

  return (
    <AdminWrapper>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              จัดการข้อมูลงานรังวัดและตรวจสอบสถิติการใช้งาน
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                ลองใหม่
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    รายการทั้งหมด
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalItems.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    รายการงานรังวัดทั้งหมด
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    การค้นหาวันนี้
                  </CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.todaySearches.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    จำนวนการค้นหาในวันนี้
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    งานที่เสร็จแล้ว
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.completedItems.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    งานที่ดำเนินการเสร็จแล้ว
                    {stats?.completionRate && (
                      <span className="text-green-600 ml-1">
                        ({stats.completionRate.toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    งานค้าง
                  </CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.pendingItems.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    งานที่ยังรอดำเนินการ
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>อัพโหลดข้อมูล</CardTitle>
            <CardDescription>
              นำเข้าข้อมูลงานรังวัดจากไฟล์ Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/upload">
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                อัพโหลดไฟล์ Excel
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>จัดการข้อมูล</CardTitle>
            <CardDescription>
              แก้ไข ลบ หรือเพิ่มข้อมูลงานรังวัด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/manage">
              <Button className="w-full" variant="outline">
                <Search className="mr-2 h-4 w-4" />
                จัดการข้อมูล
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>บันทึกการค้นหา</CardTitle>
            <CardDescription>
              ดูประวัติการค้นหาและสถิติการใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/logs">
              <Button className="w-full" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                ดูบันทึกค้นหา
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ส่งออกข้อมูล</CardTitle>
            <CardDescription>
              ดาวน์โหลดข้อมูลงานรังวัดในรูปแบบ Excel หรือ CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/manage">
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ส่งออกข้อมูล
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminWrapper>
  );
}