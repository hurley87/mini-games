import { ipfsService } from '@/lib/pinata';
import { getBuild, getCreatorByFID } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { title, symbol, buildId } = await request.json();
  console.log('create-metadata data', title, symbol, buildId);

  const build = await getBuild(buildId);

  const buildFid = build?.fid;

  const creator = await getCreatorByFID(buildFid);

  const username = creator?.username;
  const description = `Mini Game created by @${username} on Farcaster`;
  const buildImage = build?.image;

  const uri = await ipfsService.pinMetadata(title, description, buildImage!);

  return NextResponse.json({ success: true, uri, username, buildFid });
}
