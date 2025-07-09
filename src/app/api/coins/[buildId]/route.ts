import {
  getCoinByBuildId,
  updateCoin,
  getBuild,
  getCreatorByFID,
  insertCoin,
} from '@/lib/supabase';
import { ipfsService } from '@/lib/pinata';
import { NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts';
import { Address, createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import {
  createCoin,
  DeployCurrency,
  validateMetadataURIContent,
  ValidMetadataURI,
} from '@zoralabs/coins-sdk';
import { PrivyClient } from '@privy-io/server-auth';

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    const formData = await request.json();

    // Console log all the form data
    console.log('=== Form Data Received ===');
    console.log('Build ID:', buildId);
    console.log('Form Data:', JSON.stringify(formData, null, 2));
    console.log('========================');

    // Extract individual fields
    const {
      title,
      symbol,
      duration,
      max_points,
      token_multiplier,
      premium_threshold,
      max_plays,
      ...otherData
    } = formData;

    console.log('Token Name:', title);
    console.log('Token Symbol:', symbol);
    console.log('Game Configuration:');
    console.log('  - Duration:', duration);
    console.log('  - Max Points:', max_points);
    console.log('  - Token Multiplier:', token_multiplier);
    console.log('  - Premium Threshold:', premium_threshold);
    console.log('  - Max Plays:', max_plays);

    // Validate required fields
    if (!title || !symbol) {
      return NextResponse.json(
        { error: 'Title and symbol are required' },
        { status: 400 }
      );
    }

    // Get build data
    const build = await getBuild(buildId);
    if (!build) {
      return NextResponse.json(
        { success: false, error: 'Build not found' },
        { status: 404 }
      );
    }

    const buildFid = build.fid;
    const creator = await getCreatorByFID(buildFid);
    const username = creator?.username;

    // Create description with username
    const description = `Mini Game created by @${username} on Farcaster`;

    // // Ensure build image is an IPFS URI
    let imageUri = build.image;
    if (imageUri && !imageUri.startsWith('ipfs://')) {
      try {
        console.log('Converting image to IPFS URI:', imageUri);
        // Generate a filename based on the title
        const imageFileName = `${title
          .replace(/\s+/g, '-')
          .toLowerCase()}-image`;
        // Upload the image to IPFS
        imageUri = await ipfsService.pinImageFromUrl(imageUri, imageFileName);
        console.log('Image uploaded to IPFS:', imageUri);
      } catch (error) {
        console.error('Failed to upload image to IPFS:', error);
        // Continue with the original URI if IPFS upload fails
        console.warn('Using original image URI due to IPFS upload failure');
      }
    }

    // Upload HTML content to IPFS
    console.log('Uploading HTML content to IPFS...');
    const htmlUri = await ipfsService.pinHtmlContent(
      build.html,
      `${title.replace(/\s+/g, '-').toLowerCase()}.html`
    );
    console.log('HTML uploaded to IPFS:', htmlUri);

    // Create and upload EIP-7572 compliant metadata
    console.log('Creating EIP-7572 metadata...');
    const uri = await ipfsService.pinGameMetadata(
      title,
      description,
      imageUri || '', // Fallback to empty string if no image
      htmlUri
    );

    console.log('Metadata uploaded to IPFS:', uri);

    // Create a Privy client
    const privy = new PrivyClient(
      process.env.PRIVY_APP_ID!,
      process.env.PRIVY_APP_SECRET!
    );

    const wallet = await privy.walletApi.createWallet({
      chainType: 'ethereum',
    });

    const walletId = wallet.id;
    const walletAddress = wallet.address as `0x${string}`;

    const privateKey = process.env.PRIVATE_KEY;
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const rpcUrl = process.env.RPC_URL;
    const chain = base;

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    try {
      await validateMetadataURIContent(uri as ValidMetadataURI);
      console.log('Metadata URI content is valid');
    } catch (error) {
      console.error('Error creating coin:', error);
      throw error;
    }

    const coinParams = {
      name: title,
      symbol,
      uri: uri as ValidMetadataURI,
      platformReferrer: '0x227cfb1d6fa4def9adb9e33c976127295228ea72' as Address,
      payoutRecipient: walletAddress as Address,
      chainId: base.id,
      currency: DeployCurrency.ETH,
    };

    console.log('coinParams', coinParams);

    try {
      const result = await createCoin(coinParams, walletClient, publicClient, {
        gasMultiplier: 120, // Optional: Add 20% buffer to gas (defaults to 100%)
        // account: customAccount, // Optional: Override the wallet client account
      });

      console.log('Transaction hash:', result.hash);
      console.log('Coin address:', result.address);

      const coin_address = result.address as `0x${string}`;

      const coin = await insertCoin({
        build_id: buildId,
        fid: buildFid,
        wallet_address: walletAddress,
        wallet_id: walletId,
        chain_type: 'ethereum',
        name: title,
        symbol,
        image: build.image || '',
        coin_address,
        duration,
        max_points,
        token_multiplier,
        premium_threshold,
        max_plays,
      });

      console.log('Coin inserted:', coin);

      return NextResponse.json({
        success: true,
        message: 'Coin metadata created successfully',
        coin,
        uri,
        htmlUri: '',
        username,
        buildFid,
        tokenAddress: coin_address,
        gameConfig: {
          duration,
          max_points,
          token_multiplier,
          premium_threshold,
          max_plays,
        },
        metadata: {
          version: 'eip-7572',
          name: title,
          description,
          image: build.image || '',
          animation_url: htmlUri,
          content: {
            mime: 'text/html',
            uri: htmlUri,
          },
          properties: {
            category: 'game',
          },
        },
        receivedData: {
          buildId,
          title,
          symbol,
          duration,
          max_points,
          token_multiplier,
          premium_threshold,
          max_plays,
          ...otherData,
        },
      });
    } catch (error) {
      console.error('Error creating coin:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating coin metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to create coin metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
