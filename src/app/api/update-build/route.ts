import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateBuildByThreadId, getBuildByThreadId } from '@/lib/supabase';
import { validateAndFixHtml } from '@/lib/html-validator';

// Define the schema for the request body
const updateBuildSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required'),
  title: z.string().min(1, 'Title is required'),
  html: z.string().min(1, 'HTML is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('body', body);

    // Validate the request body
    const validatedData = updateBuildSchema.parse(body);
    const { threadId, title, html } = validatedData;

    // Validate and potentially fix HTML before saving
    const htmlValidation = validateAndFixHtml(html);
    
    if (!htmlValidation.isValid && !htmlValidation.fixedHtml) {
      console.error(`HTML validation failed for threadId ${threadId}:`, htmlValidation.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: 'HTML validation failed', 
          errors: htmlValidation.errors,
          warnings: htmlValidation.warnings
        },
        { status: 400 }
      );
    }

    // Use fixed HTML if available, otherwise use original
    const finalHtml = htmlValidation.fixedHtml || html;
    
    // Log any warnings or fixes that were applied
    if (htmlValidation.warnings.length > 0) {
      console.warn(`HTML warnings for threadId ${threadId}:`, htmlValidation.warnings);
    }

    // Get the build to check ownership
    const build = await getBuildByThreadId(threadId);

    if (!build) {
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

    // Update the build with validated/fixed HTML
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
