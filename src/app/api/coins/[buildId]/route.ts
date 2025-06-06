import { getCoinByBuildId } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    console.log('buildId', buildId);
    const coin = await getCoinByBuildId(buildId);

    console.log('coin', coin);

    // Only return the coin if the pool is initialized
    if (coin && !coin.pool_initialized) {
      return NextResponse.json({ coin: null });
    }

    return NextResponse.json({ coin });
  } catch (error) {
    console.error('Error fetching coin:', error);
    console.log('request', request?.url);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}
