import supabase from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the schema for the request body
const awardSchema = z.object({
  userId: z.string(),
  gameId: z.string(),
  score: z.number().min(0),
});

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = awardSchema.parse(body);
    const { userId, gameId, score } = validatedData;

    console.log('userId', userId);
    console.log('gameId', gameId);
    console.log('score', score);

    // Insert the score into the scores table
    const { data, error } = await supabase
      .from('scores')
      .insert([
        {
          user_id: userId,
          game_id: gameId,
          score: score,
          created_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting score:', error);
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { headers: corsHeaders() }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.error('Error processing award:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
} 