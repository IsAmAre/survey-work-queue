import { z } from 'zod';

export const searchSchema = z.object({
  search_term: z.string().min(1, 'กรุณาระบุเลขที่คำขอ หรือ เลขที่เอกสารสิทธิ์'),
});

export const uploadSchema = z.object({
  request_number: z.string().min(1),
  survey_type: z.string().default(''),
  applicant_name: z.string().min(1),
  document_type: z.string().default(''),
  document_number: z.string().default(''),
  surveyor_name: z.string().default(''),
  appointment_date: z.string().default(''),
  status: z.string().default(''),
  action_date: z.string().default(''),
});

export type SearchFormData = z.infer<typeof searchSchema>;
export type UploadFormData = z.infer<typeof uploadSchema>;