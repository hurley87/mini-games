import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCreatorByFID, insertBuild, updateBuild } from '@/lib/supabase';

const createBuildSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  fid: z.number().min(1, 'Fid is required'),
  model: z.string().min(1, 'Model is required'),
});

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createBuildSchema.parse(body);

    const { description, fid, model } = validatedData;

    // Check creator score before proceeding
    const creator = await getCreatorByFID(fid);
    if (!creator) {
      return NextResponse.json(
        { success: false, message: 'Creator not found' },
        { status: 404 }
      );
    }

    if (Number(creator.score) < 0.7) {
      return NextResponse.json(
        {
          success: false,
          message: `You need a neynar score of 0.7 or higher to create a build. Your score is ${creator.score}.`,
        },
        { status: 403 }
      );
    }

    // Create build immediately with pending status
    const build = await insertBuild({
      title: `Generating game...`, // Temporary title
      html: '', // Will be filled later
      description,
      model,
      fid,
      thread_id: '', // Will be filled later
      image: '', // Will be filled later
      tutorial: '', // Will be filled later
      status: 'pending',
    });

    // Trigger background processing via separate endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const payload = {
      buildId: build[0].id,
      description,
      model,
      fid,
    };

    const maxRetries = 3;
    let attempt = 0;
    let succeeded = false;
    let lastError: unknown = null;

    while (attempt < maxRetries && !succeeded) {
      try {
        const res = await fetch(`${baseUrl}/api/process-build.background`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        succeeded = true;
      } catch (err) {
        lastError = err;
        attempt += 1;
      }
    }

    if (!succeeded) {
      await updateBuild(build[0].id, {
        status: 'failed',
        error_message:
          lastError instanceof Error
            ? lastError.message
            : 'Failed to reach process-build endpoint',
      });
      return NextResponse.json(
        { success: false, message: 'Failed to start build processing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Build created and generation started',
      data: build,
    });
  } catch (error) {
    console.error('Error creating build:', error);
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
