import { NextRequest, NextResponse } from 'next/server';
import { deleteBuild } from '@/lib/supabase';

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
