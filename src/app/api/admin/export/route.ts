import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sanitizePostgrestFilter } from '@/lib/text-utils';
import { generateXlsx } from '@/lib/xlsx-writer';

// Check if user is authenticated
async function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    let query = supabaseAdmin
      .from('survey_requests')
      .select('*')
      .order('request_number', { ascending: true });

    // Apply search filter (sanitize to prevent PostgREST filter injection)
    if (search) {
      const sanitized = sanitizePostgrestFilter(search);
      if (sanitized) {
        query = query.or(`request_number.ilike.%${sanitized}%,applicant_name.ilike.%${sanitized}%,surveyor_name.ilike.%${sanitized}%,status.ilike.%${sanitized}%,document_number.ilike.%${sanitized}%`);
      }
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte('appointment_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('appointment_date', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch survey requests for export' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found to export' },
        { status: 404 }
      );
    }

    // Transform data for export
    const exportData = data.map((item) => ({
      'เลขที่คำขอ': item.request_number,
      'ประเภทการรังวัด': item.survey_type,
      'ผู้ขอรังวัด': item.applicant_name,
      'ประเภทเอกสารสิทธิ': item.document_type || '',
      'เลขที่': item.document_number || '',
      'ช่างรังวัด': item.surveyor_name,
      'วันที่นัดรังวัด': item.appointment_date,
      'สถานะ': item.status,
      'วันที่ดำเนินการ': item.action_date || '',
      'วันที่สร้าง': formatDateTimeForExport(item.created_at),
      'วันที่แก้ไขล่าสุด': formatDateTimeForExport(item.updated_at),
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    if (format === 'csv') {
      // Generate CSV
      const csv = convertToCSV(exportData);
      const fileName = `survey-data-export_${timestamp}.csv`;
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } else {
      // Generate Excel
      const columnWidths: Record<string, number> = {
        'เลขที่คำขอ': 15,
        'ประเภทการรังวัด': 20,
        'ผู้ขอรังวัด': 30,
        'ประเภทเอกสารสิทธิ': 25,
        'เลขที่': 10,
        'ช่างรังวัด': 20,
        'วันที่นัดรังวัด': 15,
        'สถานะ': 25,
        'วันที่ดำเนินการ': 15,
        'วันที่สร้าง': 20,
        'วันที่แก้ไขล่าสุด': 20,
      };

      const excelBuffer = await generateXlsx({
        sheetName: 'Survey Data',
        data: exportData,
        columnWidths,
      });

      const fileName = `survey-data-export_${timestamp}.xlsx`;

      return new NextResponse(new Uint8Array(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error during export' },
      { status: 500 }
    );
  }
}

// Helper function to format datetime for export
function formatDateTimeForExport(dateString: string): string {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

// Helper function to convert JSON to CSV
function convertToCSV(data: Record<string, string | number>[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] as string | number;
      // Wrap in quotes and escape internal quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}