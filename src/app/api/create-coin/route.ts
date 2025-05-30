import { privy } from '@/lib/clients';
import { insertCoin, getBuild } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const coinData = await request.json();
    console.log('create-coin data:', coinData);

    // Validate required fields
    if (
      !coinData.name ||
      !coinData.symbol ||
      !coinData.address ||
      !coinData.build_id ||
      !coinData.fid
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, symbol, address, build_id, fid',
        },
        { status: 400 }
      );
    }

    // Get build data to extract image and create description
    const build = await getBuild(coinData.build_id);
    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    const { id, address, chainType } = await privy.walletApi.createWallet({
      chainType: 'ethereum',
    });

    // Prepare coin data for database insertion
    const coin = {
      name: coinData.name,
      symbol: coinData.symbol,
      coin_address: coinData.address,
      build_id: coinData.build_id,
      fid: coinData.fid,
      image: build.image || '',
      wallet_address: address,
      wallet_id: id,
      chain_type: chainType,
    };

    // Insert the coin into the database
    const insertedCoin = await insertCoin(coin);

    console.log('Coin successfully created:', insertedCoin);

    return NextResponse.json({
      success: true,
      coin: insertedCoin,
      message: 'Coin created successfully',
    });
  } catch (error) {
    console.error('Error creating coin:', error);
    return NextResponse.json(
      {
        error: 'Failed to create coin',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
