import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  updateBuildByThreadId,
  getBuildByThreadId,
  createBuildVersion,
} from '@/lib/supabase';

// Define the schema for the request body
const updateBuildSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required'),
  title: z.string().min(1, 'Title is required'),
  html: z.string().min(1, 'HTML is required'),
  prompt: z.string().optional(), // Add user prompt field
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('body', body);

    // Validate the request body
    const validatedData = updateBuildSchema.parse(body);
    const { threadId, title, html, prompt } = validatedData;

    console.log('prompt', prompt);
    console.log('title', title);
    console.log('prompt', prompt);

    // HTML validation disabled - using original HTML directly
    const finalHtml = html;

    // Get the build to check ownership
    const build = await getBuildByThreadId(threadId);

    if (!build) {
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

    await createBuildVersion(
      build.id,
      build.title,
      build.html,
      build.fid,
      prompt || `Update at ${new Date().toISOString()}`
    );

    const updatedBuild = await updateBuildByThreadId(threadId, {
      title,
      html: finalHtml,
    });

    return NextResponse.json({
      success: true,
      data: updatedBuild,
    });
  } catch (error) {
    console.error('Error updating build:', error);

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
