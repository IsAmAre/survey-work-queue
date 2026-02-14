import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { searchSchema } from '@/lib/validations';
import { normalizeThaiName, sanitizePostgrestFilter } from '@/lib/text-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = searchSchema.parse(body);

    // Normalize names by trimming multiple spaces to single space
    const normalizedApplicantName = validatedData.applicant_name ? normalizeThaiName(validatedData.applicant_name) : '';

    // Build query with DB-side filtering instead of fetching entire table
    let query = supabaseAdmin
      .from('survey_requests')
      .select('*');

    if (validatedData.request_number?.trim()) {
      const sanitized = sanitizePostgrestFilter(validatedData.request_number.trim());
      if (sanitized) {
        query = query.ilike('request_number', `%${sanitized}%`);
      }
    }

    if (normalizedApplicantName) {
      const sanitized = sanitizePostgrestFilter(normalizedApplicantName);
      if (sanitized) {
        query = query.ilike('applicant_name', `%${sanitized}%`);
      }
    }

    query = query.limit(1);

    const { data: results, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Database query failed: ${fetchError.message}`);
    }

    const data = results?.[0] || null;

    // Build log entry
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    const searchParts = [];
    if (validatedData.request_number?.trim()) {
      searchParts.push(`หมายเลขคำขอ: ${validatedData.request_number}`);
    }
    if (validatedData.applicant_name?.trim()) {
      searchParts.push(`ชื่อผู้สมัคร: ${normalizedApplicantName}`);
    }
    const searchQuery = searchParts.join(', ');

    // Log search using admin client (no public INSERT RLS needed)
    await supabaseAdmin
      .from('search_logs')
      .insert([{
        ip_address: clientIP,
        search_query: searchQuery,
        applicant_name: normalizedApplicantName,
        results_found: data ? 1 : 0,
      }]);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลที่ตรงกับการค้นหา' },
        { status: 404 }
      );
    }

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
