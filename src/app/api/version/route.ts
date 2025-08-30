import { NextResponse } from 'next/server';
import { getVersionInfo } from '@/lib/version';

export async function GET() {
  try {
    const versionInfo = getVersionInfo();
    
    return NextResponse.json({
      success: true,
      data: versionInfo
    });
  } catch (error) {
    console.error('Version API error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to get version information' },
      { status: 500 }
    );
  }
}