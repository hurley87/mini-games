import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { threadId, extractedCode } = await request.json();

    // Here you would typically save the code to your database or storage
    // For now, we'll just log it
    console.log('extractedCode:', extractedCode);
    console.log('Saving code for thread:', threadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving code:', error);
    return NextResponse.json(
      { error: 'Failed to save code' },
      { status: 500 }
    );
  }
} 