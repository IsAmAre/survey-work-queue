import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

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
      .order('order_number', { ascending: true });

    // Apply search filter
    if (search) {
      query = query.or(`request_number.ilike.%${search}%,applicant_name.ilike.%${search}%,surveyor_name.ilike.%${search}%,status.ilike.%${search}%`);
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
      'ลำดับ': item.order_number,
      'เลขที่คำขอ': item.request_number,
      'ชื่อผู้ขอ': item.applicant_name,
      'ประเภทงาน': item.survey_type,
      'วันนัดหมาย': formatDateForExport(item.appointment_date),
      'วันค้าง': item.days_pending,
      'ช่างรังวัด': item.surveyor_name,
      'สถานะ': item.status,
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
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 15 },  // เลขที่คำขอ
        { wch: 25 },  // ชื่อผู้ขอ
        { wch: 15 },  // ประเภทงาน
        { wch: 15 },  // วันนัดหมาย
        { wch: 10 },  // วันค้าง
        { wch: 20 },  // ช่างรังวัด
        { wch: 15 },  // สถานะ
        { wch: 20 },  // วันที่สร้าง
        { wch: 20 },  // วันที่แก้ไขล่าสุด
      ];
      worksheet['!cols'] = colWidths;

      // Add some styling
      const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (worksheet[headerCell]) {
          worksheet[headerCell].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "E6E6FA" } }
          };
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Data');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      const fileName = `survey-data-export_${timestamp}.xlsx`;
      
      return new NextResponse(excelBuffer, {
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

// Helper function to format date for export
function formatDateForExport(dateString: string): string {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
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