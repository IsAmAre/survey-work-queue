'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SearchFormData, searchSchema } from '@/lib/validations';
import { SurveyRequest } from '@/types/survey';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface SearchFormProps {
  onSearch: (data: SearchFormData) => Promise<SurveyRequest | null>;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SurveyRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      request_number: '',
      applicant_name: '',
    },
  });

  const handleSearch = async (data: SearchFormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await onSearch(data);
      setResult(result);
      if (!result) {
        setError('ไม่พบข้อมูลที่ตรงกับการค้นหา');
      }
    } catch (err: any) {
      console.log('err', err);
      if (err?.error) {
        setError(err.error);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ค้นหาสถานะงานรังวัด</CardTitle>
          <CardDescription>
            กรุณาระบุเลขที่คำขอและชื่อผู้ขอเพื่อค้นหาข้อมูล
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={form.control}
                name="request_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลขที่คำขอ (ร.ว.12)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น 001/2568"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อผู้ขอ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น นายสมชาย ทำความดี"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังค้นหา...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    ค้นหา
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">ผลการค้นหา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-sm text-gray-600">เลขที่คำขอ</p>
                <p className="text-lg">{result.request_number}</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-600">ชื่อผู้ขอ</p>
                <p className="text-lg">{result.applicant_name}</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-600">จำนวนวันที่ค้าง</p>
                <p className="text-lg">{result.days_pending} วัน</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-600">ช่างรังวัด</p>
                <p className="text-lg">{result.surveyor_name}</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-600">ประเภทการรังวัด</p>
                <p className="text-lg">{result.survey_type}</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-600">วันที่นัดรังวัด</p>
                <p className="text-lg">{result.appointment_date}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-semibold text-sm text-gray-600">สถานะงาน</p>
                <p className="text-lg font-semibold text-blue-700">{result.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}