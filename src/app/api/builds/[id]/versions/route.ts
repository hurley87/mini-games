import { NextRequest, NextResponse } from 'next/server';
import { getBuildVersions, getBuild } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify the build exists
    const build = await getBuild(id);
    if (!build) {
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

    // Get versions for the build
    const versions = await getBuildVersions(id);

    return NextResponse.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('Error fetching build versions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}