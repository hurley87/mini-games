import { NextResponse } from 'next/server';
import { insertCreator } from '@/lib/supabase';
import { z } from 'zod';
import { getUserByFid } from '@/lib/neynar';

const creatorSchema = z.object({
  fid: z.number(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = creatorSchema.parse(body);

    const { fid } = validatedData;

    const farcasterUser = await getUserByFid(fid);

    if (!farcasterUser) {
      return NextResponse.json(
        { error: 'Farcaster user not found' },
        { status: 404 }
      );
    }

    console.log('farcasterUser', farcasterUser);

    const {
      username,
      pfp_url,
      profile,
      verified_addresses,
      follower_count,
      following_count,
      power_badge,
      score,
    } = farcasterUser;

    if (!username) {
      return NextResponse.json(
        { error: 'Username not found' },
        { status: 404 }
      );
    }

    // Insert the creator into the database
    const creator = await insertCreator({
      fid,
      username,
      pfp: pfp_url || '',
      bio: profile?.bio?.text || '',
      primary_address: verified_addresses?.primary?.eth_address || '',
      follower_count: follower_count || 0,
      following_count: following_count || 0,
      power_badge: power_badge || false,
      score: score || 0,
    });

    return NextResponse.json({ data: creator }, { status: 200 });
  } catch (error) {
    console.error('Error creating creator:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create creator' },
      { status: 500 }
    );
  }
}
