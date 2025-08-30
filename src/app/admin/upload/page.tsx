'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminWrapper } from '@/components/admin/AdminWrapper';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { parseExcelFile } from '@/lib/excel-parser';
import { UploadData } from '@/types/survey';

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<UploadData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setErrorMessage('กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv)');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');

    try {
      const data = await parseExcelFile(file);
      setPreviewData(data.slice(0, 10)); // Show first 10 rows for preview
    } catch (error) {
      setErrorMessage('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const data = await parseExcelFile(selectedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        setUploadStatus('success');
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
        setUploadStatus('error');
      }
    } catch (error) {
      setErrorMessage('เกิดข้อผิดพลาดในการอัพโหลด');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const inputElement = document.getElementById('file-input') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputElement.files = dataTransfer.files;
      handleFileSelect({ target: { files: dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <AdminWrapper>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">อัพโหลดข้อมูล</h2>
          <p className="text-muted-foreground">
            นำเข้าข้อมูลงานรังวัดจากไฟล์ Excel หรือ CSV
          </p>
        </div>

      {uploadStatus === 'success' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            อัพโหลดข้อมูลสำเร็จ! กำลังเปลี่ยนหน้า...
          </AlertDescription>
        </Alert>
      )}

      {(uploadStatus === 'error' || errorMessage) && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>เลือกไฟล์</CardTitle>
          <CardDescription>
            รองรับไฟล์ Excel (.xlsx, .xls) และ CSV (.csv)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">ลากไฟล์มาวางที่นี่</p>
              <p className="text-sm text-gray-500">หรือคลิกเพื่อเลือกไฟล์</p>
            </div>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          
          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">
                ไฟล์ที่เลือก: {selectedFile.name}
              </p>
              <p className="text-sm text-blue-700">
                ขนาด: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ตัวอย่างข้อมูล</CardTitle>
            <CardDescription>
              แสดง 10 รายการแรกจากไฟล์ (ตรวจสอบความถูกต้องก่อนอัพโหลด)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>เลขที่คำขอ</TableHead>
                    <TableHead>ชื่อผู้ขอ</TableHead>
                    <TableHead>วันค้าง</TableHead>
                    <TableHead>ช่างรังวัด</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.order_number}</TableCell>
                      <TableCell>{row.request_number}</TableCell>
                      <TableCell className="max-w-48 truncate">{row.applicant_name}</TableCell>
                      <TableCell>{row.days_pending}</TableCell>
                      <TableCell>{row.surveyor_name}</TableCell>
                      <TableCell className="max-w-32 truncate">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 flex gap-4">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !selectedFile}
                className="flex-1"
              >
                {isUploading ? (
                  <>กำลังอัพโหลด...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    อัพโหลดข้อมูล
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewData([]);
                  setErrorMessage('');
                  setUploadStatus('idle');
                }}
              >
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </AdminWrapper>
  );
}