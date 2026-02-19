import ExcelJS from 'exceljs';
import { UploadData } from '@/types/survey';

export async function parseExcelFile(file: File): Promise<UploadData[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('ไม่พบ worksheet ในไฟล์');
    }

    const parsedData: UploadData[] = [];

    // Skip header row (row 1), iterate from row 2
    // CSV columns: เลขที่คำขอ, ประเภทการรังวัด, ผู้ขอรังวัด, ประเภทเอกสารสิทธิ, เลขที่, ตำแหน่ง, ชื่อ, วันที่นัดรังวัด, สถานะ, วันที่ดำเนินการ
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const values = row.values as unknown[];
      // exceljs row.values is 1-indexed (index 0 is undefined)
      if (values.length >= 2) {
        parsedData.push({
          request_number: String(values[1] || '').trim(),
          survey_type: String(values[2] || '').trim(),
          applicant_name: String(values[3] || '').trim(),
          document_type: String(values[4] || '').trim(),
          document_number: String(values[5] || '').trim(),
          // values[6] = ตำแหน่ง (skip - always "ช่างรังวัด")
          surveyor_name: String(values[7] || '').trim(),
          appointment_date: String(values[8] || '').trim(),
          status: String(values[9] || '').trim(),
          action_date: String(values[10] || '').trim(),
        });
      }
    });

    return parsedData;
  } catch {
    throw new Error('ไม่สามารถอ่านไฟล์ Excel ได้');
  }
}
