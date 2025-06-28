import { NextRequest, NextResponse } from 'next/server';
import { restoreBuildFromVersion, getBuildVersion, getBuild, createBuildVersion } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: buildId, versionId } = await params;

    // Verify the build exists
    const build = await getBuild(buildId);
    if (!build) {
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

    // Verify the version exists
    const version = await getBuildVersion(versionId);
    if (!version) {
      return NextResponse.json(
        { success: false, message: 'Version not found' },
        { status: 404 }
      );
    }

    // Create a version of the current build before restoring
    await createBuildVersion(
      buildId,
      build.title,
      build.html,
      build.fid,
      `Version created before restoring to v${version.version_number} at ${new Date().toISOString()}`
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