import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Coin {
  name: string;
  image: string;
  symbol: string;
  coin_address: string;
  build_id: string;
  fid: number;
  updated_at: string;
  wallet_address: string;
  wallet_id: string;
  chain_type: string;
  pool_initialized?: boolean;
}

interface Build {
  id: string;
  title: string;
  html: string;
  fid: number;
  created_at: string;
  status?: string;
  coins?: Coin[];
}

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Get creator by primary address
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('primary_address', address)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get creator's builds
    const { data: builds, error: buildsError } = await supabase
      .from('builds')
      .select(`
        *,
        coins (*)
      `)
      .eq('fid', creator.fid)
      .order('created_at', { ascending: false });

    if (buildsError) {
      console.error('Error fetching builds:', buildsError);
      return NextResponse.json(
        { error: 'Failed to fetch builds' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      creator,
      builds: builds || [],
      stats: {
        totalBuilds: builds?.length || 0,
        publishedBuilds: builds?.filter((build: Build) => 
          build.status === 'completed' && build.html
        ).length || 0,
        tokenizedBuilds: builds?.filter((build: Build) => 
          build.coins && build.coins.length > 0
        ).length || 0,
      }
    });

  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}