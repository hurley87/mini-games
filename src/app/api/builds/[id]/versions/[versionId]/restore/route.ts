import { NextRequest, NextResponse } from 'next/server';
import {
  restoreBuildFromVersion,
  getBuildVersion,
  getBuild,
  createBuildVersion,
} from '@/lib/supabase';

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
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

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

    // Create a version of the current build before restoring
    await createBuildVersion(
      buildId,
      build.title,
      build.html,
      build.fid,
      `Version created before restoring to v${
        version.version_number
      } at ${new Date().toISOString()}`
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
