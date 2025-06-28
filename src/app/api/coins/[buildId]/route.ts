import { getCoinByBuildId, updateCoin } from '@/lib/supabase';
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    const updateData = await request.json();

    // Validate that the build exists by checking if a coin exists for it
    const existingCoin = await getCoinByBuildId(buildId);
    if (!existingCoin) {
      return NextResponse.json(
        { error: 'Coin not found for this build' },
        { status: 404 }
      );
    }

    // Validate input data
    const validFields = [
      'duration',
      'max_points',
      'token_multiplier',
      'premium_threshold',
      'max_plays',
    ];
    const filteredUpdates = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => validFields.includes(key))
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Perform validation on the values
    const {
      duration,
      max_points,
      token_multiplier,
      premium_threshold,
      max_plays,
    } = filteredUpdates;

    if (
      duration !== undefined &&
      (typeof duration !== 'number' || duration < 0 || duration > 60)
    ) {
      return NextResponse.json(
        { error: 'Duration must be a number between 0 and 60' },
        { status: 400 }
      );
    }

    if (
      max_points !== undefined &&
      (typeof max_points !== 'number' || max_points < 1 || max_points > 100)
    ) {
      return NextResponse.json(
        { error: 'Max points must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    if (
      token_multiplier !== undefined &&
      (typeof token_multiplier !== 'number' ||
        token_multiplier < 1 ||
        token_multiplier > 1000000)
    ) {
      return NextResponse.json(
        { error: 'Token multiplier must be a number between 1 and 1,000,000' },
        { status: 400 }
      );
    }

    if (
      premium_threshold !== undefined &&
      (typeof premium_threshold !== 'number' ||
        premium_threshold < 1 ||
        premium_threshold > 10000000)
    ) {
      return NextResponse.json(
        {
          error: 'Premium threshold must be a number between 1 and 10,000,000',
        },
        { status: 400 }
      );
    }

    if (
      max_plays !== undefined &&
      (typeof max_plays !== 'number' || max_plays < 1 || max_plays > 100)
    ) {
      return NextResponse.json(
        { error: 'Max plays must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    const updatedCoin = await updateCoin(buildId, filteredUpdates);

    return NextResponse.json({
      coin: updatedCoin,
      message: 'Coin configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating coin:', error);
    return NextResponse.json(
      { error: 'Failed to update coin configuration' },
      { status: 500 }
    );
  }
}
