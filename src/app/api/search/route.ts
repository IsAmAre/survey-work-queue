import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { searchSchema } from '@/lib/validations';
import { normalizeThaiName } from '@/lib/text-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = searchSchema.parse(body);
    
    // Normalize names by trimming multiple spaces to single space
    const normalizedApplicantName = validatedData.applicant_name ? normalizeThaiName(validatedData.applicant_name) : '';
    
    // Search in database with normalized name
    // First, get all data and normalize on both sides for comparison
    const { data: allData, error: fetchError } = await supabase
      .from('survey_requests')
      .select('*');

    if (fetchError) {
      throw new Error(`Database query failed: ${fetchError.message}`);
    }

    // Find matching record by normalizing both search input and database values
    const matchingRecord = allData?.find(record => {
      const normalizedDbName = normalizeThaiName(record.applicant_name);
      const normalizedDbRequest = record.request_number.trim();
      
      let matches = false;
      
      // Check if request number was provided and matches
      if (validatedData.request_number && validatedData.request_number.trim()) {
        const normalizedSearchRequest = validatedData.request_number.trim();
        const requestMatch = normalizedDbRequest.toLowerCase().includes(normalizedSearchRequest.toLowerCase());
        matches = requestMatch;
      }
      
      // Check if applicant name was provided and matches
      if (validatedData.applicant_name && validatedData.applicant_name.trim()) {
        const nameMatch = normalizedDbName.toLowerCase().includes(normalizedApplicantName.toLowerCase());
        if (validatedData.request_number && validatedData.request_number.trim()) {
          // If both fields provided, both must match (AND logic)
          matches = matches && nameMatch;
        } else {
          // If only name provided, name must match
          matches = nameMatch;
        }
      }
      
      return matches;
    });

    const data = matchingRecord || null;
    const error = !matchingRecord;

    if (error || !data) {
      // Log search attempt (for security monitoring)
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      // Create search query string for logging
      const searchParts = [];
      if (validatedData.request_number && validatedData.request_number.trim()) {
        searchParts.push(`หมายเลขคำขอ: ${validatedData.request_number}`);
      }
      if (validatedData.applicant_name && validatedData.applicant_name.trim()) {
        searchParts.push(`ชื่อผู้สมัคร: ${normalizedApplicantName}`);
      }
      const searchQuery = searchParts.join(', ');
      
      await supabase
        .from('search_logs')
        .insert([{
          ip_address: clientIP,
          search_query: searchQuery,
          applicant_name: normalizedApplicantName,
          results_found: 0,
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
    
    // Create search query string for logging
    const searchParts = [];
    if (validatedData.request_number && validatedData.request_number.trim()) {
      searchParts.push(`หมายเลขคำขอ: ${validatedData.request_number}`);
    }
    if (validatedData.applicant_name && validatedData.applicant_name.trim()) {
      searchParts.push(`ชื่อผู้สมัคร: ${normalizedApplicantName}`);
    }
    const searchQuery = searchParts.join(', ');
    
    await supabase
      .from('search_logs')
      .insert([{
        ip_address: clientIP,
        search_query: searchQuery,
        applicant_name: normalizedApplicantName,
        results_found: 1,
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