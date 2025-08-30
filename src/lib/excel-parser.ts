import * as XLSX from 'xlsx';
import { UploadData } from '@/types/survey';

export function parseExcelFile(file: File): Promise<UploadData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and parse data
        const parsedData: UploadData[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as unknown[];
          
          if (row.length >= 8) {
            parsedData.push({
              order_number: Number(row[0]) || i,
              request_number: String(row[1] || '').trim(),
              applicant_name: String(row[2] || '').trim(),
              days_pending: Number(row[3]) || 0,
              surveyor_name: String(row[4] || '').trim(),
              survey_type: String(row[5] || '').trim(),
              appointment_date: String(row[6] || '').trim(),
              status: String(row[7] || '').trim(),
            });
          }
        }
        
        resolve(parsedData);
      } catch {
        reject(new Error('ไม่สามารถอ่านไฟล์ Excel ได้'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}