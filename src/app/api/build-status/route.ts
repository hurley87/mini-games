import { NextResponse } from 'next/server';
import { getBuild, getCoinByBuildId } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildId = searchParams.get('buildId');

    if (!buildId) {
      return NextResponse.json(
        { success: false, message: 'Build ID is required' },
        { status: 400 }
      );
    }

    const build = await getBuild(buildId);

    // Fetch coin data to match the structure from /api/builds
    const coin = await getCoinByBuildId(build.id);
    const buildWithCoin = {
      ...build,
      isPublished: !!coin,
      coin: coin
        ? {
            address: coin.coin_address,
            name: coin.name,
            symbol: coin.symbol,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: buildWithCoin,
    });
  } catch (error) {
    console.error('Error fetching build status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch build status' },
      { status: 500 }
    );
  }
}
