import { NextResponse } from 'next/server';
import { insertPlayer } from '@/lib/supabase';
import { z } from 'zod';

const playerSchema = z.object({
  fid: z.number(),
  bio: z.string(),
  username: z.string(),
  pfp: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = playerSchema.parse(body);

    // Insert the player into the database
    const player = await insertPlayer(validatedData);

    return NextResponse.json({ data: player }, { status: 200 });
  } catch (error) {
    console.error('Error creating player:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
