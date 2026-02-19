'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SearchFormData, searchSchema } from '@/lib/validations';
import { SurveyRequest } from '@/types/survey';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, ClipboardCheck, FileText, Loader2, MapPin, RefreshCw, Ruler, Search, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface SearchFormProps {
  onSearch: (data: SearchFormData) => Promise<SurveyRequest[]>;
}

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SurveyRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // CAPTCHA state
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError(null);
  }, []);

  // Regenerate captcha after each successful search
  useEffect(() => {
    if (hasSearched) {
      refreshCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, error]);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search_term: '',
    },
  });

  const handleSearch = async (data: SearchFormData) => {
    // Verify CAPTCHA first
    if (parseInt(captchaInput) !== captcha.answer) {
      setCaptchaError('คำตอบไม่ถูกต้อง กรุณาลองใหม่');
      refreshCaptcha();
      return;
    }
    setCaptchaError(null);

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
                        type='search'
                        placeholder="เช่น 1/2569 หรือ 123456"
                        {...field}
                        disabled={isLoading}
                        className="text-lg py-5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Math CAPTCHA */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  ยืนยันตัวตน
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg select-none">
                    <span className="text-lg font-bold text-amber-900 tracking-wider">
                      {captcha.a} + {captcha.b} = ?
                    </span>
                  </div>
                  <Input
                    type="number"
                    inputMode='numeric'
                    placeholder="คำตอบ"
                    value={captchaInput}
                    onChange={(e) => {
                      setCaptchaInput(e.target.value);
                      setCaptchaError(null);
                    }}
                    disabled={isLoading}
                    className="w-24 text-center text-lg py-5"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={refreshCaptcha}
                    className="text-gray-400 hover:text-amber-700"
                    title="เปลี่ยนคำถาม"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {captchaError && (
                  <p className="text-sm text-red-600 font-medium">{captchaError}</p>
                )}
              </div>

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
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 py-4">
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
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <User className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">ชื่อผู้ขอ</p>
                  <p className="text-sm font-semibold text-gray-900">{result.applicant_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Ruler className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">ประเภทการรังวัด</p>
                  <p className="text-sm font-semibold text-gray-900">{result.survey_type || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <MapPin className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">ช่างรังวัด</p>
                  <p className="text-sm font-semibold text-gray-900">{result.surveyor_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">เลขที่เอกสารสิทธิ์</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {result.document_type ? `${result.document_type} ${result.document_number}` : result.document_number || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <ClipboardCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">สถานะงาน</p>
                  <p className="text-sm font-semibold text-gray-900">{result.status || '-'}</p>
                </div>
              </div>

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