'use client';

import { SearchForm } from '@/components/search/SearchForm';
import { VersionBadge } from '@/components/VersionInfo';
import { SurveyRequest } from '@/types/survey';
import { SearchFormData } from '@/lib/validations';

export default function Home() {
  const handleSearch = async (data: SearchFormData): Promise<SurveyRequest | null> => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('ไม่พบข้อมูลที่ตรงกับการค้นหา');
    }

    const result = await response.json();
    return result.data as SurveyRequest | null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ระบบค้นหาสถานะงานรังวัด
          </h1>
          <p className="text-lg text-gray-600">
            ตรวจสอบความคืบหนาของงานรังวัดของคุณ
          </p>
        </div>
        <SearchForm onSearch={handleSearch} />
        
        {/* Version info at bottom */}
        <div className="fixed bottom-4 right-4">
          <VersionBadge />
        </div>
      </div>
    </div>
  );
}
