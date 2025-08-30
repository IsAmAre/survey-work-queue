import { z } from 'zod';

export const searchSchema = z.object({
  request_number: z.string().min(1, 'กรุณาระบุเลขที่คำขอ'),
  applicant_name: z.string().min(1, 'กรุณาระบุชื่อผู้ขอ'),
});

export const uploadSchema = z.object({
  order_number: z.number().min(1),
  request_number: z.string().min(1),
  applicant_name: z.string().min(1),
  days_pending: z.number().min(0),
  surveyor_name: z.string().min(1),
  survey_type: z.string().min(1),
  appointment_date: z.string().min(1),
  status: z.string().min(1),
});

export type SearchFormData = z.infer<typeof searchSchema>;
export type UploadFormData = z.infer<typeof uploadSchema>;