import { NextRequest, NextResponse } from 'next/server';
import { deleteBuild, getBuild, getCoinByBuildId } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const build = await getBuild(id);

    if (!build) {
      return NextResponse.json(
        { success: false, message: 'Build not found' },
        { status: 404 }
      );
    }

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
    console.error('Error fetching build:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch build' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteBuild(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting build:', error);
    console.log('request', request);
    return NextResponse.json(
      { error: 'Failed to delete build' },
      { status: 500 }
    );
  }
}
