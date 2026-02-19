import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { searchSchema } from '@/lib/validations';
import { sanitizePostgrestFilter } from '@/lib/text-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = searchSchema.parse(body);
    const searchTerm = validatedData.search_term.trim();

    if (!searchTerm) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุคำค้นหา' },
        { status: 400 }
      );
    }

    const sanitized = sanitizePostgrestFilter(searchTerm);
    if (!sanitized) {
      return NextResponse.json(
        { success: false, error: 'คำค้นหาไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Search by request_number OR document_number
    const { data: results, error: fetchError } = await supabaseAdmin
      .from('survey_requests')
      .select('*')
      .or(`request_number.eq.${sanitized},document_number.eq.${sanitized}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      throw new Error(`Database query failed: ${fetchError.message}`);
    }

    // Build log entry
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // Log search using admin client
    await supabaseAdmin
      .from('search_logs')
      .insert([{
        ip_address: clientIP,
        search_query: `ค้นหา: ${searchTerm}`,
        applicant_name: '',
        results_found: results?.length || 0,
      }]);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { success: false, data: [], error: 'ไม่พบข้อมูลที่ตรงกับการค้นหา' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
