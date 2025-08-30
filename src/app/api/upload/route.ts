import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { uploadSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีข้อมูลสำหรับการอัพโหลด' },
        { status: 400 }
      );
    }

    // Validate each row
    const validatedData = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const validated = uploadSchema.parse(data[i]);
        validatedData.push(validated);
      } catch (error) {
        errors.push(`แถวที่ ${i + 1}: ข้อมูลไม่ถูกต้อง`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: `พบข้อผิดพลาด: ${errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Clear existing data (optional - you might want to modify this)
    const { error: deleteError } = await supabaseAdmin
      .from('survey_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      console.error('Delete error:', deleteError);
    }

    // Insert new data
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('survey_requests')
      .insert(validatedData);

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถบันทึกข้อมูลได้' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `อัพโหลดข้อมูลสำเร็จ จำนวน ${validatedData.length} รายการ`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}