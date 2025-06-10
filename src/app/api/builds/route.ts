import { getBuilds, getBuildsByFid, getCoinByBuildId } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get('fid');

    // Validate fid parameter if provided
    if (fidParam !== null) {
      const fid = Number(fidParam);
      if (isNaN(fid) || !Number.isInteger(fid) || fid < 0) {
        return NextResponse.json(
          { error: 'Invalid fid parameter. Must be a positive integer.' },
          { status: 400 }
        );
      }
    }

    const builds = fidParam
      ? await getBuildsByFid(Number(fidParam))
      : await getBuilds();

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
