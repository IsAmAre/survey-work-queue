import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { SurveyRequest } from '@/types/survey';

// Check if user is authenticated (basic check)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Survey request ID is required' },
        { status: 400 }
      );
    }

    // Check if survey request exists
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('survey_requests')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Survey request not found' },
        { status: 404 }
      );
    }

    // Prepare update data (only include fields that are provided)
    const updateData: Partial<Omit<SurveyRequest, 'id' | 'created_at'>> = {
      updated_at: new Date().toISOString()
    };

    if (body.order_number !== undefined) {
      updateData.order_number = parseInt(body.order_number);
    }
    if (body.request_number !== undefined) {
      updateData.request_number = body.request_number;
    }
    if (body.applicant_name !== undefined) {
      updateData.applicant_name = body.applicant_name;
    }
    if (body.days_pending !== undefined) {
      updateData.days_pending = parseInt(body.days_pending);
    }
    if (body.surveyor_name !== undefined) {
      updateData.surveyor_name = body.surveyor_name;
    }
    if (body.survey_type !== undefined) {
      updateData.survey_type = body.survey_type;
    }
    if (body.appointment_date !== undefined) {
      updateData.appointment_date = body.appointment_date;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const { data, error } = await supabaseAdmin
      .from('survey_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Survey request with this number already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update survey request' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('PUT survey request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Survey request ID is required' },
        { status: 400 }
      );
    }

    // Check if survey request exists
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('survey_requests')
      .select('id, request_number')
      .eq('id', id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Survey request not found' },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin
      .from('survey_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete survey request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `Survey request ${existingRequest.request_number} deleted successfully` },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE survey request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}