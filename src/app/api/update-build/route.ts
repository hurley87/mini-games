import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateBuildByThreadId, getBuildByThreadId } from '@/lib/supabase';
import { headers } from 'next/headers';
import { privy } from '@/lib/clients';

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

    // Get the authorization token
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the token
    const token = authorization.replace('Bearer ', '');
    let userFid: number | undefined;

    try {
      const verifiedClaims = await privy.verifyAuthToken(token);
      // Get the user details to extract FID
      const user = await privy.getUser(verifiedClaims.userId);
      userFid = user.farcaster?.fid;

      if (!userFid) {
        return NextResponse.json(
          { success: false, message: 'User FID not found' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get the build to check ownership
    const build = await getBuildByThreadId(threadId);

    if (!build) {
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

    // Check if the user is the owner
    if (build.fid !== userFid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden: You are not the owner of this build',
        },
        { status: 403 }
      );
    }

    // Update the build
    const updatedBuild = await updateBuildByThreadId(threadId, {
      title,
      html,
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
