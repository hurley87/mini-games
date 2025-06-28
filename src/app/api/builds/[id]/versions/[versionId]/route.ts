import { NextRequest, NextResponse } from 'next/server';
import { getBuildVersion, deleteBuildVersion, getBuild } from '@/lib/supabase';

// Define custom error type for error handling
interface CustomError extends Error {
  code?: string;
}

function isCustomError(error: unknown): error is CustomError {
  return error instanceof Error && 'code' in error;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: buildId, versionId } = await params;

    // First, validate that the build exists
    try {
      await getBuild(buildId);
    } catch (error) {
      if (isCustomError(error) && error.code === 'BUILD_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Build not found' },
          { status: 404 }
        );
      }
      // For database errors or other server errors, let them bubble up
      throw error;
    }

    // Get the version and validate it exists
    let version;
    try {
      version = await getBuildVersion(versionId);
    } catch (error) {
      if (isCustomError(error) && error.code === 'VERSION_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Version not found' },
          { status: 404 }
        );
      }
      // For database errors or other server errors, let them bubble up
      throw error;
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

    // First, validate that the build exists
    try {
      await getBuild(buildId);
    } catch (error) {
      if (isCustomError(error) && error.code === 'BUILD_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Build not found' },
          { status: 404 }
        );
      }
      // For database errors or other server errors, let them bubble up
      throw error;
    }

    // Get the version and validate it exists
    let version;
    try {
      version = await getBuildVersion(versionId);
    } catch (error) {
      if (isCustomError(error) && error.code === 'VERSION_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Version not found' },
          { status: 404 }
        );
      }
      // For database errors or other server errors, let them bubble up
      throw error;
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
