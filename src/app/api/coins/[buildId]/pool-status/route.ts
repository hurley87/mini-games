import { updateCoinPoolStatus } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    const { poolInitialized } = await request.json();

    if (typeof poolInitialized !== 'boolean') {
      return NextResponse.json(
        { error: 'poolInitialized must be a boolean' },
        { status: 400 }
      );
    }

    const updatedCoin = await updateCoinPoolStatus(buildId, poolInitialized);

    return NextResponse.json({ coin: updatedCoin });
  } catch (error) {
    console.error('Error updating pool status:', error);
    return NextResponse.json(
      { error: 'Failed to update pool status' },
      { status: 500 }
    );
  }
}
