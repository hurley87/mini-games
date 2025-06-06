import { NextResponse } from 'next/server';
import { getBuild } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildId = searchParams.get('buildId');

    if (!buildId) {
      return NextResponse.json(
        { success: false, message: 'Build ID is required' },
        { status: 400 }
      );
    }

    const build = await getBuild(buildId);

    console.log('build', build);

    return NextResponse.json({
      success: true,
      data: build,
    });
  } catch (error) {
    console.error('Error fetching build status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch build status' },
      { status: 500 }
    );
  }
}
