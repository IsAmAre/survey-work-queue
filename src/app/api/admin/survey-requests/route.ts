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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('survey_requests')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`request_number.ilike.%${search}%,applicant_name.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch survey requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('GET survey requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'order_number',
      'request_number',
      'applicant_name',
      'days_pending',
      'surveyor_name',
      'status'
    ];

    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const surveyRequest: Omit<SurveyRequest, 'id' | 'created_at' | 'updated_at'> = {
      order_number: parseInt(body.order_number),
      request_number: body.request_number,
      applicant_name: body.applicant_name,
      days_pending: parseInt(body.days_pending),
      surveyor_name: body.surveyor_name,
      survey_type: body.survey_type || '',
      appointment_date: body.appointment_date || '',
      status: body.status
    };

    const { data, error } = await supabaseAdmin
      .from('survey_requests')
      .insert([surveyRequest])
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
        { error: 'Failed to create survey request' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('POST survey request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}