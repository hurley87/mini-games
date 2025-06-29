import { NextRequest, NextResponse } from 'next/server';
import {
  restoreBuildFromVersion,
  getBuildVersion,
  getBuild,
  createBuildVersion,
} from '@/lib/supabase';

// Define custom error type for error handling
interface CustomError extends Error {
  code?: string;
}

function isCustomError(error: unknown): error is CustomError {
  return error instanceof Error && 'code' in error;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: buildId, versionId } = await params;

    // Verify the build exists
    let build;
    try {
      build = await getBuild(buildId);
    } catch (error) {
      // Check if it's a specific "not found" error
      if (isCustomError(error) && error.code === 'BUILD_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Build not found' },
          { status: 404 }
        );
      }
      // For other errors, let them bubble up to the outer catch block
      throw error;
    }

    // Get the version and validate it belongs to the specified build
    let version;
    try {
      version = await getBuildVersion(versionId);
    } catch (error) {
      // Check if it's a specific "not found" error
      if (isCustomError(error) && error.code === 'VERSION_NOT_FOUND') {
        return NextResponse.json(
          { success: false, message: 'Version not found' },
          { status: 404 }
        );
      }
      // For other errors, let them bubble up to the outer catch block
      throw error;
    }

    // Validate that the version belongs to the specified build
    if (version.build_id !== buildId) {
      return NextResponse.json(
        { success: false, message: 'Version not found for this build' },
        { status: 404 }
      );
    }

    // Create a version of the current build before restoring
    await createBuildVersion(
      buildId,
      build.title,
      build.html,
      build.fid,
      `Restored to version ${version.version_number}`
    );

    // Restore the build from the version
    const restoredBuild = await restoreBuildFromVersion(buildId, versionId);

    return NextResponse.json({
      success: true,
      data: restoredBuild,
      message: `Build restored to version ${version.version_number}`,
    });
  } catch (error) {
    console.error('Error restoring build version:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
