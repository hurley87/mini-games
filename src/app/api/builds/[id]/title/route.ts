import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateBuild, getBuild, createBuildVersion } from '@/lib/supabase';

const updateTitleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate the request body
    const validatedData = updateTitleSchema.parse(body);
    const { title } = validatedData;

    // Get the build to verify it exists
    const build = await getBuild(id);
    if (!build) {
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

    // Create a version of the current build before updating title
    await createBuildVersion(
      id,
      build.title,
      build.html,
      build.fid,
      `Title changed from "${build.title}" to "${title}"`
    );

    // Update the build title
    const updatedBuild = await updateBuild(id, { title });

    return NextResponse.json({
      success: true,
      data: { title: updatedBuild.title },
    });
  } catch (error) {
    console.error('Error updating build title:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
