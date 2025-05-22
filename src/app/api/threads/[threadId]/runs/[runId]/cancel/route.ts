import { openai } from '@/lib/openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string; runId: string }> }
) {
  try {
    console.log('request', request);
    const { threadId, runId } = await params;

    console.log('threadId', threadId);
    console.log('runId', runId);

    await openai.beta.threads.runs.cancel(threadId, runId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling run:', error);
    return NextResponse.json(
      { error: 'Failed to cancel run' },
      { status: 500 }
    );
  }
}
