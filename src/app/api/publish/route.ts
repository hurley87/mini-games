import { getWalletClients } from '@/lib/clients';
import { ipfsService } from '@/lib/pinata';
import { NextResponse } from 'next/server';
import { createCoin } from '@zoralabs/coins-sdk';
import { getBuild, getPlayerByFID, insertCoin } from '@/lib/supabase';
import OpenAI from 'openai';

// Constants
const PLATFORM_REFERRER = process.env.PLATFORM_REFERRER as `0x${string}`;
const openaiSDK = new OpenAI();

export const maxDuration = 300;

async function generateSymbol(description: string): Promise<string> {
  const response = await openaiSDK.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that generates a 3-6 character uppercase symbol for a cryptocurrency based on its description. The symbol should be memorable and relevant to the project. Respond with ONLY the symbol, no additional text.',
      },
      {
        role: 'user',
        content: `Generate a 3-6 character uppercase symbol for a cryptocurrency with this description: ${description}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 10,
  });

  const symbol =
    response.choices[0]?.message?.content?.trim().toUpperCase() || 'COIN';
  return symbol.slice(0, 6); // Ensure max length of 6 characters
}

async function generateTitle(description: string): Promise<string> {
  const response = await openaiSDK.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that generates a clean, concise title for a cryptocurrency based on its description. The title should be 2-4 words maximum, memorable, and relevant. Respond with ONLY the title, no additional text.',
      },
      {
        role: 'user',
        content: `Generate a clean, concise title for a cryptocurrency with this description: ${description}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 20,
  });

  return response.choices[0]?.message?.content?.trim() || 'Game Coin';
}

async function generateDescription(description: string): Promise<string> {
  const response = await openaiSDK.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that generates a single-sentence tagline for a cryptocurrency based on its description. The tagline should be concise, engaging, and capture the essence of the project. Keep it to one sentence, maximum 15 words. Respond with ONLY the tagline, no additional text.',
      },
      {
        role: 'user',
        content: `Generate a single-sentence tagline for a cryptocurrency with this description: ${description}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 30,
  });

  return (
    response.choices[0]?.message?.content?.trim() ||
    'The ultimate gaming token for the future of play.'
  );
}

export async function POST(request: Request) {
  const { buildId } = await request.json();

  //   get build data
  const build = await getBuild(buildId);

  if (!build) {
    return NextResponse.json({ error: 'Build not found' }, { status: 404 });
  }

  // Generate metadata
  const [symbol, title, description] = await Promise.all([
    generateSymbol(build.description),
    generateTitle(build.description),
    generateDescription(build.description),
  ]);

  const uri = await ipfsService.pinMetadata(title, description, build.image);

  // Get wallet clients
  const { walletClient, publicClient } = await getWalletClients();

  const fid = build.fid;
  const player = await getPlayerByFID(fid);
  if (!player) {
    return NextResponse.json({ error: 'player not found' }, { status: 404 });
  }

  const payoutRecipient = player.primary_address as `0x${string}`;

  console.log('payoutRecipient', payoutRecipient);

  if (!payoutRecipient) {
    return NextResponse.json(
      { error: 'payoutRecipient not found' },
      { status: 404 }
    );
  }

  console.log('payoutRecipient', payoutRecipient);

  // Create coin
  const createCoinParams = {
    name: title,
    symbol,
    uri,
    payoutRecipient,
    platformReferrer: PLATFORM_REFERRER,
  };

  console.log('createCoinParams', createCoinParams);

  const zoraCoin = await createCoin(
    createCoinParams,
    walletClient,
    publicClient
  );

  console.log('zoraCoin', zoraCoin);

  try {
    await publicClient.waitForTransactionReceipt({ hash: zoraCoin.hash });

    // delay for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!zoraCoin.address) {
      throw new Error('Coin address is undefined');
    }

    const coinData = {
      name: title,
      symbol,
      address: zoraCoin.address,
      description,
      image: build.image,
      build_id: buildId,
      fid,
    };

    console.log('coinData', coinData);

    const coin = await insertCoin(coinData);

    console.log('coin', coin);

    return NextResponse.json({ success: true, coin });

    // insert coin into supabase
  } catch (error) {
    console.error('Error creating coin:', error);
    return NextResponse.json(
      { error: 'Failed to create coin' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
