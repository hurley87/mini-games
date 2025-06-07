import { assistantId } from '@/lib/assistant';
import { openai } from '@/lib/openai';
import { getBuild } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export const maxDuration = 300;

// Helper function to wait for a run to complete
async function waitForRunCompletion(threadId: string, runId: string) {
  let run: unknown;
  let attempts = 0;
  const maxAttempts = 30; // Increased from 10
  const baseDelay = 1000; // 1 second base delay

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
        status === 'cancelled' ||
        status === 'expired'
      ) {
        console.log(`Run ${runId} final status: ${status}`);
        return run;
      }
    }
    attempts++;
    if (attempts >= maxAttempts) {
      console.warn(`Run ${runId} did not complete within expected time`);
      return run;
    }
    // Progressive delay: 1s, 2s, 3s, etc. up to 5s max
    const delay = Math.min(baseDelay * attempts, 5000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  } while (true);
}

// Helper function to get all active runs
async function getActiveRuns(threadId: string) {
  const runs = await openai.beta.threads.runs.list(threadId);
  return runs.data.filter(
    (run) =>
      typeof run.status === 'string' &&
      (run.status === 'in_progress' ||
        run.status === 'queued' ||
        run.status === 'requires_action')
  );
}

// Helper function to cancel all active runs
async function cancelAllActiveRuns(threadId: string) {
  const activeRuns = await getActiveRuns(threadId);

  if (activeRuns.length === 0) {
    console.log('No active runs to cancel');
    return;
  }

  console.log(
    `Found ${activeRuns.length} active runs to cancel:`,
    activeRuns.map((r) => ({ id: r.id, status: r.status }))
  );

  // Cancel all active runs
  const cancelPromises = activeRuns.map(async (run) => {
    try {
      console.log(`Cancelling run ${run.id} with status ${run.status}`);
      await openai.beta.threads.runs.cancel(threadId, run.id);
      console.log(`Cancellation request sent for run: ${run.id}`);
      return run.id;
    } catch (error) {
      console.error(`Failed to send cancel request for run ${run.id}:`, error);
      return null;
    }
  });

  const cancelResults = await Promise.all(cancelPromises);
  const successfullyCancelled = cancelResults.filter((id) => id !== null);

  console.log(
    `Sent cancellation requests for ${successfullyCancelled.length} runs`
  );

  // Wait for all cancelled runs to complete
  const completionPromises = successfullyCancelled.map(async (runId) => {
    if (runId) {
      try {
        const completedRun = await waitForRunCompletion(threadId, runId);
        if (
          typeof completedRun === 'object' &&
          completedRun !== null &&
          'status' in completedRun
        ) {
          const status = (completedRun as { status: string }).status;
          console.log(`Run ${runId} finished with status: ${status}`);
          return { runId, status };
        }
      } catch (error) {
        console.error(`Error waiting for run ${runId} completion:`, error);
        return { runId, status: 'error' };
      }
    }
    return null;
  });

  const completionResults = await Promise.all(completionPromises);
  console.log('All cancellation operations completed:', completionResults);
}

// Send a new message to a thread
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { content, buildId } = await request.json();
    const { threadId } = await params;

    console.log('Processing message for thread:', threadId);

    // Cancel any active runs first
    await cancelAllActiveRuns(threadId);

    // Add a delay to ensure system consistency
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add the message with retry logic
    let retryCount = 0;
    const maxRetries = 5; // Increased retries
    let lastError: unknown;

    while (retryCount < maxRetries) {
      try {
        console.log(
          `Attempting to create message (attempt ${
            retryCount + 1
          }/${maxRetries})`
        );

        // Double-check for active runs before creating message
        const remainingActiveRuns = await getActiveRuns(threadId);

        if (remainingActiveRuns.length > 0) {
          console.log(
            'Still found active runs:',
            remainingActiveRuns.map((r) => ({ id: r.id, status: r.status }))
          );

          // Try to cancel them again
          await cancelAllActiveRuns(threadId);
          throw new Error(
            `Still have ${remainingActiveRuns.length} active runs after cancellation`
          );
        }

        // Create the message
        const messageResponse = await openai.beta.threads.messages.create(
          threadId,
          {
            role: 'user',
            content: content,
          }
        );

        console.log('Message created successfully:', messageResponse.id);
        break; // Success, exit the retry loop
      } catch (error: unknown) {
        lastError = error;
        console.error(
          `Message creation attempt ${retryCount + 1} failed:`,
          error
        );

        // Check if this is the specific "active run" error
        const isActiveRunError =
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message: string }).message === 'string' &&
          (error as { message: string }).message
            .toLowerCase()
            .includes('active run');

        if (isActiveRunError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(
              `Failed to add message after ${maxRetries} retries due to persistent active runs. ` +
                `Last error: ${(error as { message: string }).message}`
            );
          }

          // Exponential backoff with jitter
          const baseDelay = 2000;
          const jitter = Math.random() * 1000;
          const delay = baseDelay * Math.pow(2, retryCount - 1) + jitter;

          console.log(
            `Active run detected, waiting ${Math.round(delay)}ms before retry ${
              retryCount + 1
            }`
          );

          // Try to cancel active runs again before retry
          await cancelAllActiveRuns(threadId);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // For non-active-run errors, fail immediately
          throw error;
        }
      }
    }

    console.log('lastError', lastError);

    // Get the build and create the stream
    const build = await getBuild(buildId);
    const html = build.html;

    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
      instructions: `
        You are an interactive game editor assistant.
        You help users make changes to their HTML-based browser games.

        You will be given the current HTML code of a game.
        Wait for the user to describe what they want to change. If their request is unclear or ambiguous, ask a concise clarifying question.

        Once you're confident you understand the user's request, call the update_game function with the complete updated HTML file. Keep all changes inline (HTML, CSS, JS). Use only simple web features — no external libraries or imports.

        Never include explanations or return HTML directly — always use the update_game function, unless you're still asking questions.
        Here is the current version of the game:
        ${html}

        The user's request is:
        ${content}
      `,
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
