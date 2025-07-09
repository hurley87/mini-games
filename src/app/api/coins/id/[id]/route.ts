import { getCoin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('id', id);

    // Validate that the ID is provided and not "undefined"
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid coin ID provided' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid coin ID format' },
        { status: 400 }
      );
    }

    const coin = await getCoin(id);

    if (!coin) {
      return NextResponse.json({ error: 'Coin not found' }, { status: 404 });
    }

    return NextResponse.json({ coin });
  } catch (error) {
    console.error('Error fetching coin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}
