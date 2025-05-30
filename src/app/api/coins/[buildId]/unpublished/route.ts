import { getCoinByBuildId } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    const coin = await getCoinByBuildId(buildId);

    // Return the coin regardless of pool_initialized status
    return NextResponse.json({ coin });
  } catch (error) {
    console.error('Error fetching unpublished coin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}
