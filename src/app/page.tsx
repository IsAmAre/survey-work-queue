'use client';

import { SearchForm } from '@/components/search/SearchForm';
import { VersionBadge } from '@/components/VersionInfo';
import { SurveyRequest } from '@/types/survey';
import { SearchFormData } from '@/lib/validations';
import Image from 'next/image';

export default function Home() {
  const handleSearch = async (data: SearchFormData): Promise<SurveyRequest[]> => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ไม่พบข้อมูลที่ตรงกับการค้นหา');
    }

    const result = await response.json();
    return (result.data as SurveyRequest[]) || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col">
      {/* Banner Section */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden">
        <Image
          src="/land-banner.jpg"
          alt="สำนักงานที่ดินจังหวัดเชียงราย สาขาพญาเม็งราย"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />

        {/* Banner Content */}
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12">
          {/* Logo Left */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 relative rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 backdrop-blur-sm bg-white/10">
              <Image
                src="/land-logo.png"
                alt="Logo สำนักงานที่ดิน"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Text Right */}
          <div className="text-right">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg leading-tight">
              สำนักงานที่ดินจังหวัดเชียงราย
            </h1>
            <h2 className="text-lg md:text-2xl lg:text-3xl font-semibold text-amber-200 drop-shadow-lg mt-1">
              สาขาพญาเม็งราย
            </h2>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            ระบบค้นหาสถานะงานรังวัด
          </h2>
          <p className="text-base text-gray-500">
            ตรวจสอบความคืบหน้าของงานรังวัดของคุณ
          </p>
        </div>
        <SearchForm onSearch={handleSearch} />
      </div>

      {/* Footer Section */}
      <footer className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Contact Info */}
            <div className="text-center md:text-left">
              <p className="text-amber-200 text-sm font-medium mb-1">ติดต่อสำนักงาน</p>
              <p className="text-base md:text-lg font-semibold">
                เบอร์โทรศัพท์ 053799151
              </p>
              <p className="text-sm text-amber-200 mt-1">
                ต่อ 0(ฝ่ายอำนวยการ), 12(ฝ่ายทะเบียน), 13(ฝ่ายรังวัด)
              </p>
            </div>

            {/* QR Code */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 relative rounded-lg overflow-hidden shadow-lg border-2 border-white/20 bg-white p-1">
                <Image
                  src="/qrcode.png"
                  alt="QR Code"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Version info */}
      <div className="fixed bottom-4 right-4">
        <VersionBadge />
      </div>
    </div>
  );
}
