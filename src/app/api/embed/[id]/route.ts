import { getBuild } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { validateHtml, createErrorFallbackHtml } from '@/lib/html-validator';

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

  // Validate HTML before serving
  const validation = validateHtml(html);
  
  if (!validation.isValid) {
    console.error(`HTML validation failed for build ${id}:`, validation.errors);
    
    // Serve a fallback error page instead of broken HTML
    const errorMessage = `Validation errors: ${validation.errors.join(', ')}`;
    const fallbackHtml = createErrorFallbackHtml(errorMessage);
    
    return new Response(fallbackHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 200, // Still return 200 to avoid iframe errors
    });
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn(`HTML validation warnings for build ${id}:`, validation.warnings);
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
