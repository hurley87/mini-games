import { NextRequest, NextResponse } from 'next/server';
import { getBuildVersion, deleteBuildVersion } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: buildId, versionId } = await params;

    // Get the version and validate it belongs to the specified build
    let version;
    try {
      version = await getBuildVersion(versionId);
    } catch (error) {
      // If version not found, return 404
      return NextResponse.json(
        { success: false, message: 'Version not found' },
        { status: 404 }
      );
    }

    // Validate that the version belongs to the specified build
    if (version.build_id !== buildId) {
      return NextResponse.json(
        { success: false, message: 'Version not found for this build' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Error fetching build version:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: buildId, versionId } = await params;

    // Get the version and validate it belongs to the specified build
    let version;
    try {
      version = await getBuildVersion(versionId);
    } catch (error) {
      // If version not found, return 404
      return NextResponse.json(
        { success: false, message: 'Version not found' },
        { status: 404 }
      );
    }

    // Validate that the version belongs to the specified build
    if (version.build_id !== buildId) {
      return NextResponse.json(
        { success: false, message: 'Version not found for this build' },
        { status: 404 }
      );
    }

    // Delete the version
    await deleteBuildVersion(versionId);

    return NextResponse.json({
      success: true,
      message: 'Version deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting build version:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
