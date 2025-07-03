import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId, score, duration } = await request.json();

    // Validate required fields
    if (!gameId || !userId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, userId, score' },
        { status: 400 }
      );
    }

    // Insert the score into the database
    const { data, error } = await supabase
      .from('game_scores')
      .insert({
        game_id: gameId,
        user_id: userId,
        score: score,
        duration: duration || 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving score:', error);
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error in save-score API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
