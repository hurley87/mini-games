import { getBuild } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Parse URL manually
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const gameId = url.searchParams.get('gameId');
  // Validate required parameters
  if (!userId || !gameId) {
    return NextResponse.json(
      { error: 'Missing required parameters: userId and gameId are required' },
      { status: 400 }
    );
  }

  const build = await getBuild(id);

  if (!build) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const html = build.html;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
