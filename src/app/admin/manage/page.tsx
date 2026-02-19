'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminWrapper } from '@/components/admin/AdminWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, AlertCircle, CheckCircle, Loader2, ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet, Filter } from 'lucide-react';
import { SurveyRequest, AdminSurveyRequestsResponse } from '@/types/survey';
import { supabase } from '@/lib/supabase/client';

export default function ManagePage() {
  const [data, setData] = useState<AdminSurveyRequestsResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isInitialMount = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SurveyRequest | null>(null);
  const [deletingItem, setDeletingItem] = useState<SurveyRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Export states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    format: 'xlsx' as 'xlsx' | 'csv',
    dataScope: 'all' as 'all' | 'current' | 'filtered',
    statusFilter: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const [formData, setFormData] = useState({
    request_number: '',
    survey_type: '',
    applicant_name: '',
    document_type: '',
    document_number: '',
    surveyor_name: '',
    appointment_date: '',
    status: '',
    action_date: '',
  });

  const itemsPerPage = 20;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAlert('error', 'Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(debouncedSearch && { search: debouncedSearch })
      });

      const response = await fetch(`/api/admin/survey-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please try logging in again.');
        }
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const result: AdminSurveyRequestsResponse = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      showAlert('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleEdit = (item: SurveyRequest) => {
    setEditingItem(item);
    setFormData({
      request_number: item.request_number,
      survey_type: item.survey_type,
      applicant_name: item.applicant_name,
      document_type: item.document_type || '',
      document_number: item.document_number || '',
      surveyor_name: item.surveyor_name,
      appointment_date: item.appointment_date,
      status: item.status,
      action_date: item.action_date || '',
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      request_number: '',
      survey_type: '',
      applicant_name: '',
      document_type: '',
      document_number: '',
      surveyor_name: '',
      appointment_date: '',
      status: '',
      action_date: '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: SurveyRequest) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAlert('error', 'Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/survey-requests/${deletingItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please try logging in again.');
        }
        throw new Error(`Failed to delete item: ${response.status} ${response.statusText}`);
      }

      showAlert('success', 'ลบข้อมูลสำเร็จ');
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล';
      showAlert('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.request_number || !formData.applicant_name) {
      showAlert('error', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }
    
    const payload = {
      request_number: formData.request_number,
      survey_type: formData.survey_type || '',
      applicant_name: formData.applicant_name,
      document_type: formData.document_type || '',
      document_number: formData.document_number || '',
      surveyor_name: formData.surveyor_name || '',
      appointment_date: formData.appointment_date || '',
      status: formData.status || '',
      action_date: formData.action_date || '',
    };

    try {
      setIsSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAlert('error', 'Authentication required. Please log in again.');
        return;
      }
      
      const url = editingItem 
        ? `/api/admin/survey-requests/${editingItem.id}`
        : '/api/admin/survey-requests';
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please try logging in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save data: ${response.status}`);
      }

      showAlert('success', editingItem ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ');
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      showAlert('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    if (status.includes('อนุมัติ') || status.includes('เสร็จ')) return 'bg-green-100 text-green-800';
    if (status.includes('งดรังวัด')) return 'bg-red-100 text-red-800';
    if (status.includes('ส่ง') || status.includes('แจ้ง')) return 'bg-blue-100 text-blue-800';
    if (status.includes('บันทึก')) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAlert('error', 'Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams({
        format: exportConfig.format
      });

      if (exportConfig.dataScope === 'current' && searchTerm) {
        params.append('search', searchTerm);
      } else if (exportConfig.dataScope === 'filtered') {
        if (exportConfig.statusFilter !== 'all') {
          params.append('status', exportConfig.statusFilter);
        }
        if (exportConfig.dateFrom) {
          params.append('dateFrom', exportConfig.dateFrom);
        }
        if (exportConfig.dateTo) {
          params.append('dateTo', exportConfig.dateTo);
        }
      }

      const response = await fetch(`/api/admin/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed: ${response.status}`);
      }

      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `survey-export-${Date.now()}.${exportConfig.format}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showAlert('success', 'ส่งออกข้อมูลสำเร็จ');
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกข้อมูล';
      showAlert('error', errorMessage);
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <AdminWrapper>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">จัดการข้อมูล</h2>
            <p className="text-muted-foreground">
              เพิ่ม แก้ไข หรือลบข้อมูลงานรังวัด
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  ส่งออกข้อมูล
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>ส่งออกข้อมูล</DialogTitle>
                  <DialogDescription>
                    เลือกรูปแบบและตัวเลือกข้อมูลที่ต้องการส่งออก
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>รูปแบบไฟล์</Label>
                    <Select 
                      value={exportConfig.format} 
                      onValueChange={(value: 'xlsx' | 'csv') => 
                        setExportConfig({...exportConfig, format: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xlsx">
                          <div className="flex items-center">
                            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                            Excel (.xlsx)
                          </div>
                        </SelectItem>
                        <SelectItem value="csv">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-blue-600" />
                            CSV (.csv)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ข้อมูลที่จะส่งออก</Label>
                    <Select 
                      value={exportConfig.dataScope} 
                      onValueChange={(value: 'all' | 'current' | 'filtered') => 
                        setExportConfig({...exportConfig, dataScope: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ข้อมูลทั้งหมด</SelectItem>
                        <SelectItem value="current">
                          ผลการค้นหาปัจจุบัน
                          {searchTerm && ` (ค้นหา: "${searchTerm}")`}
                        </SelectItem>
                        <SelectItem value="filtered">กำหนดเงื่อนไขข้างล่าง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exportConfig.dataScope === 'filtered' && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-gray-700">
                        <Filter className="mr-2 h-4 w-4" />
                        ตัวเลือกการกรอง
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">สถานะ</Label>
                        <Select 
                          value={exportConfig.statusFilter} 
                          onValueChange={(value) => 
                            setExportConfig({...exportConfig, statusFilter: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            <SelectItem value="รอดำเนินการ">รอดำเนินการ</SelectItem>
                            <SelectItem value="เสร็จสิ้น">เสร็จสิ้น</SelectItem>
                            <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-sm">วันที่เริ่ม</Label>
                          <Input
                            type="date"
                            value={exportConfig.dateFrom}
                            onChange={(e) => setExportConfig({...exportConfig, dateFrom: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">วันที่สิ้นสุด</Label>
                          <Input
                            type="date"
                            value={exportConfig.dateTo}
                            onChange={(e) => setExportConfig({...exportConfig, dateTo: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} disabled={isExporting}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังส่งออก...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        ส่งออกข้อมูล
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มรายการใหม่
            </Button>
          </div>
        </div>

        {alert && (
          <Alert className={alert.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            {alert.type === 'success' ? 
              <CheckCircle className="h-4 w-4 text-green-600" /> :
              <AlertCircle className="h-4 w-4 text-red-600" />
            }
            <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>ค้นหาและจัดการข้อมูล</CardTitle>
            <CardDescription>
              ค้นหาจากเลขที่คำขอ ชื่อผู้ขอ เลขที่เอกสาร หรือช่างรังวัด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาจากเลขที่คำขอ, ชื่อผู้ขอ, เลขที่เอกสาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              {data && (
                <div className="text-sm text-gray-500">
                  แสดง {data.data.length} จาก {data.pagination.total.toLocaleString()} รายการ
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead>เลขที่คำขอ</TableHead>
                        <TableHead>ผู้ขอรังวัด</TableHead>
                        <TableHead>ประเภทการรังวัด</TableHead>
                        <TableHead>เอกสารสิทธิ์</TableHead>
                      <TableHead>ช่างรังวัด</TableHead>
                      <TableHead>สถานะ</TableHead>
                        <TableHead>วันที่ดำเนินการ</TableHead>
                      <TableHead className="text-right">การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.request_number}</TableCell>
                        <TableCell className="max-w-48 truncate">{item.applicant_name}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-40 truncate">{item.survey_type}</TableCell>
                        <TableCell className="text-sm max-w-40 truncate">
                          {item.document_type ? `${item.document_type} ${item.document_number}` : item.document_number || '-'}
                        </TableCell>
                        <TableCell>{item.surveyor_name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)} variant="secondary">
                            {item.status || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{item.action_date || '-'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteClick(item)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>

                {data && data.data.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'ไม่มีข้อมูล'}
                  </div>
                )}

                {/* Pagination */}
                {data && data.pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      หน้า {data.pagination.page} จาก {data.pagination.pages} ({data.pagination.total.toLocaleString()} รายการ)
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.pagination.page === 1}
                        onClick={() => handlePageChange(data.pagination.page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        ก่อนหน้า
                      </Button>

                      {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                        const pageNum = Math.max(1, data.pagination.page - 2) + i;
                        if (pageNum <= data.pagination.pages) {
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === data.pagination.page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.pagination.page === data.pagination.pages}
                        onClick={() => handlePageChange(data.pagination.page + 1)}
                      >
                        ถัดไป
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มรายการใหม่'}
              </DialogTitle>
              <DialogDescription>
                กรุณากรอกข้อมูลให้ครบถ้วน ข้อมูลที่มี * เป็นข้อมูลที่จำเป็น
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request_number">เลขที่คำขอ *</Label>
                <Input
                  id="request_number"
                  value={formData.request_number}
                  onChange={(e) => setFormData({...formData, request_number: e.target.value})}
                  placeholder="เช่น 251/2567"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="survey_type">ประเภทการรังวัด</Label>
                <Input
                  id="survey_type"
                  value={formData.survey_type}
                  onChange={(e) => setFormData({ ...formData, survey_type: e.target.value })}
                  placeholder="เช่น ออกโฉนดที่ดิน, สอบเขตโฉนดที่ดิน"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicant_name">ผู้ขอรังวัด *</Label>
                <Input
                  id="applicant_name"
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                  placeholder="ชื่อผู้ยื่นคำขอ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">ประเภทเอกสารสิทธิ</Label>
                  <Input
                    id="document_type"
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                    placeholder="เช่น โฉนดที่ดิน"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document_number">เลขที่</Label>
                  <Input
                    id="document_number"
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    placeholder="เลขที่เอกสาร"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="surveyor_name">ช่างรังวัด</Label>
                <Input
                  id="surveyor_name"
                  value={formData.surveyor_name}
                  onChange={(e) => setFormData({ ...formData, surveyor_name: e.target.value })}
                  placeholder="ชื่อช่างรังวัดที่รับผิดชอบ"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment_date">วันที่นัดรังวัด</Label>
                <Input
                  id="appointment_date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                  placeholder="เช่น 2 ต.ค. 2567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">สถานะ</Label>
                <Input
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  placeholder="เช่น ส่งหนังสือแจ้งข้างเคียง"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_date">วันที่ดำเนินการ</Label>
                <Input
                  id="action_date"
                  value={formData.action_date}
                  onChange={(e) => setFormData({ ...formData, action_date: e.target.value })}
                  placeholder="เช่น 3 ก.ย. 2567"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ยืนยันการลบ</DialogTitle>
              <DialogDescription>
                คุณแน่ใจหรือไม่ที่จะลบรายการนี้?
                {deletingItem && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>เลขที่คำขอ:</strong> {deletingItem.request_number}<br />
                    <strong>ผู้ขอรังวัด:</strong> {deletingItem.applicant_name}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    ลบรายการ
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminWrapper>
  );
}