import { getBuilds, getCoinByBuildId } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const builds = await getBuilds();

    // Fetch coin data for each build
    const buildsWithCoins = await Promise.all(
      builds.map(async (build) => {
        const coin = await getCoinByBuildId(build.id);
        return {
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
      })
    );

    return NextResponse.json(buildsWithCoins);
  } catch (error) {
    console.error('Error fetching builds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builds' },
      { status: 500 }
    );
  }
}
