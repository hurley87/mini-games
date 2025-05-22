import { assistantId } from '@/lib/assistant';
import { openai } from '@/lib/openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Helper function to wait for a run to complete
async function waitForRunCompletion(threadId: string, runId: string) {
  let run: unknown;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
    if (
      typeof run === 'object' &&
      run !== null &&
      'status' in run &&
      typeof (run as { status: string }).status === 'string'
    ) {
      const status = (run as { status: string }).status;
      console.log(
        `Run ${runId} status: ${status} (attempt ${
          attempts + 1
        }/${maxAttempts})`
      );
      if (
        status === 'completed' ||
        status === 'failed' ||
        status === 'cancelled'
      ) {
        console.log(`Run ${runId} final status: ${status}`);
        break;
      }
    }
    attempts++;
    if (attempts >= maxAttempts) {
      console.warn(`Run ${runId} did not complete within expected time`);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (true);
  return run;
}

// Send a new message to a thread
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { content } = await request.json();
    const { threadId } = await params;

    console.log('Processing message for thread:', threadId);

    // Check for active runs
    const runs = await openai.beta.threads.runs.list(threadId);
    console.log(
      'Current runs:',
      runs.data.map((r) => ({ id: r.id, status: r.status }))
    );

    const activeRun = runs.data.find(
      (run) =>
        typeof run.status === 'string' &&
        (run.status === 'in_progress' || run.status === 'queued')
    );

    // If there's an active run, cancel it and wait for completion
    if (activeRun) {
      console.log(
        'Found active run:',
        activeRun.id,
        'with status:',
        activeRun.status
      );

      try {
        await openai.beta.threads.runs.cancel(threadId, activeRun.id);
        console.log('Cancellation request sent for run:', activeRun.id);

        const cancelledRun = await waitForRunCompletion(threadId, activeRun.id);
        if (
          typeof cancelledRun === 'object' &&
          cancelledRun !== null &&
          'status' in cancelledRun &&
          typeof (cancelledRun as { status: string }).status === 'string'
        ) {
          const status = (cancelledRun as { status: string }).status;
          console.log('Run cancellation completed:', status);
          if (
            status !== 'cancelled' &&
            status !== 'completed' &&
            status !== 'failed'
          ) {
            throw new Error(
              `Run ${activeRun.id} could not be properly cancelled. Final status: ${status}`
            );
          }
        }
      } catch (cancelError: unknown) {
        console.error('Error during run cancellation:', cancelError);
        throw new Error(
          `Failed to cancel active run: ${
            cancelError instanceof Error ? cancelError.message : cancelError
          }`
        );
      }
    }

    // Add a small delay after cancellation to ensure system consistency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add the message with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(
          `Attempting to create message (attempt ${
            retryCount + 1
          }/${maxRetries})`
        );

        // Verify no active runs before creating message
        const currentRuns = await openai.beta.threads.runs.list(threadId);
        const hasActiveRun = currentRuns.data.some(
          (run) =>
            typeof run.status === 'string' &&
            (run.status === 'in_progress' || run.status === 'queued')
        );

        if (hasActiveRun) {
          throw new Error('Active run detected before message creation');
        }

        await openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: content,
        });
        console.log('Message created successfully');
        break;
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'message' in error) {
          console.error(
            `Message creation attempt ${retryCount + 1} failed:`,
            (error as { message: string }).message
          );
        } else {
          console.error(
            `Message creation attempt ${retryCount + 1} failed:`,
            error
          );
        }
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          (error as { status?: number }).status === 400 &&
          'message' in error &&
          typeof (error as { message: string }).message === 'string' &&
          (error as { message: string }).message.includes('active run')
        ) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error('Failed to add message after multiple retries');
          }
          const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Waiting ${delay}ms before retry ${retryCount + 1}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
    });

    return new Response(stream.toReadableStream());
  } catch (error: unknown) {
    console.error('Error in message creation:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStatus =
      error instanceof Error && 'status' in error
        ? (error as { status?: number }).status
        : 500;

    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: errorStatus }
    );
  }
}

// Get messages from a thread
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    console.log('request', request);
    const { threadId } = await params;

    console.log('Fetching messages for thread:', threadId);

    const messages = await openai.beta.threads.messages.list(threadId);

    return NextResponse.json({ messages: messages.data });
  } catch (error: unknown) {
    console.error('Error fetching messages:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStatus =
      error instanceof Error && 'status' in error
        ? (error as { status?: number }).status
        : 500;

    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: errorStatus }
    );
  }
}
