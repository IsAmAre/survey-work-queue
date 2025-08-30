import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { searchSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = searchSchema.parse(body);
    
    // Search in database
    const { data, error } = await supabase
      .from('survey_requests')
      .select('*')
      .ilike('request_number', `%${validatedData.request_number}%`)
      .ilike('applicant_name', `%${validatedData.applicant_name}%`)
      .single();

    if (error || !data) {
      // Log search attempt (for security monitoring)
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      await supabase
        .from('search_logs')
        .insert([{
          ip_address: clientIP,
          search_query: validatedData,
          search_result: false,
        }]);

      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลที่ตรงกับการค้นหา' },
        { status: 404 }
      );
    }

    // Log successful search
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    await supabase
      .from('search_logs')
      .insert([{
        ip_address: clientIP,
        search_query: validatedData,
        search_result: true,
      }]);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}