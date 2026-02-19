'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SearchFormData, searchSchema } from '@/lib/validations';
import { SurveyRequest } from '@/types/survey';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search, FileText, User, Ruler, MapPin, ClipboardCheck, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface SearchFormProps {
  onSearch: (data: SearchFormData) => Promise<SurveyRequest[]>;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SurveyRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search_term: '',
    },
  });

  const handleSearch = async (data: SearchFormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    try {
      const results = await onSearch(data);
      if (results && results.length > 0) {
        setResult(results[0]);
      } else {
        setError('ไม่พบข้อมูลที่ตรงกับการค้นหา');
      }
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      if (error?.error) {
        setError(error.error);
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status.includes('งดรังวัด') || status.includes('*งดรังวัด*')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (status.includes('อนุมัติ') || status.includes('เสร็จ')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (status.includes('ส่ง') || status.includes('แจ้ง')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (status.includes('บันทึก')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-lg border-amber-200/50">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl text-amber-900">ค้นหาสถานะงานรังวัด</CardTitle>
          <CardDescription>
            ระบุเลขที่คำขอ หรือ เลขที่เอกสารสิทธิ์ เพื่อค้นหาข้อมูล
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={form.control}
                name="search_term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลขที่คำขอ หรือ เลขที่เอกสารสิทธิ์</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น 251/2567 หรือ 273"
                        {...field}
                        disabled={isLoading}
                        className="text-lg py-5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white py-5 text-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    กำลังค้นหา...
                  </>
                ) : (
                  <>
                      <Search className="mr-2 h-5 w-5" />
                    ค้นหา
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && hasSearched && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="shadow-xl border-green-200/60 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription className="text-green-700 font-medium text-sm">เลขที่คำขอ</CardDescription>
                <CardTitle className="text-2xl text-green-900 mt-1">{result.request_number}</CardTitle>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusStyle(result.status)}`}>
                {result.status || '-'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ชื่อผู้ขอ */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <User className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">ชื่อผู้ขอ</p>
                  <p className="text-sm font-semibold text-gray-900">{result.applicant_name}</p>
                </div>
              </div>

              {/* ประเภท */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Ruler className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">ประเภทการรังวัด</p>
                  <p className="text-sm font-semibold text-gray-900">{result.survey_type || '-'}</p>
                </div>
              </div>

              {/* ช่างรังวัด */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <MapPin className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">ช่างรังวัด</p>
                  <p className="text-sm font-semibold text-gray-900">{result.surveyor_name || '-'}</p>
                </div>
              </div>

              {/* เลขที่เอกสารสิทธิ์ */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">เลขที่เอกสารสิทธิ์</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {result.document_type ? `${result.document_type} ${result.document_number}` : result.document_number || '-'}
                  </p>
                </div>
              </div>

              {/* สถานะงาน */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <ClipboardCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">สถานะงาน</p>
                  <p className="text-sm font-semibold text-gray-900">{result.status || '-'}</p>
                </div>
              </div>

              {/* วันที่ */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <CalendarDays className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">วันที่ดำเนินการ</p>
                  <p className="text-sm font-semibold text-gray-900">{result.action_date || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}