import { getBuilds } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const builds = await getBuilds();
    return NextResponse.json(builds);
  } catch (error) {
    console.error('Error fetching builds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builds' },
      { status: 500 }
    );
  }
}
