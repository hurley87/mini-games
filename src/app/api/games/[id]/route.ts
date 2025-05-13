import supabase from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  console.log('request', request);
  const { id } = await params;
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json(game);
} 