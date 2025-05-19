import supabase from '@/lib/supabase'
import { openai } from '@/lib/openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: Request) {
  try {
    const { threadId, address, gameName, runId, category, buildInstructions } = await request.json();

    console.log('runId:', runId);


    if (runId) {
      try {
        await openai.beta.threads.runs.cancel(threadId, runId)
        console.log('Run cancelled');
      } catch (e) {
        console.warn('Could not cancel active run:', e)
      }
    }

    // Here you would typically save the code to your database or storage
    // For now, we'll just log it
    console.log('address:', address);
    console.log('gameName:', gameName);
    console.log('Saving code for thread:', threadId);

    const instructions = `
You are now generating the implementation of a simple, fun browser-based game.

You are a game generator. Create a complete HTML file that contains a canvas-based game using vanilla JS or Three.js. 
Wrap everything in <html><body><script> and avoid using external packages.
The code will be sandboxed in an iframe, so it must not rely on imports.
The game must be interactive and playable with simple mouse input only.
The canvas element must fill the entire screen at all times.

SPECIFIC GAME REQUIREMENTS:
${buildInstructions}

IMPORTANT CODE QUALITY REQUIREMENTS:
1. Use descriptive variable names that clearly indicate their purpose
2. Never use single-letter variable names (like 'r', 'x', 'y') unless they are loop counters in a very short scope
3. Always declare variables before use with 'let', 'const', or 'var'
4. Use consistent naming conventions throughout the code
5. For array iterations, use descriptive parameter names (e.g., 'ripple' instead of 'r')
6. Ensure all variables used in callbacks and event handlers are properly scoped
7. Add error handling for any potential undefined states
8. Use strict equality checks (=== and !==) instead of loose equality
9. Initialize all variables with default values where appropriate

At the appropriate moment (such as when the game ends or points are earned), you must call:

window.awardPoints(score);

Pass the player's score as a number. Do not define or modify this function — it is already provided by the environment.

Return only the full code — no explanation or extra text.
        `

    console.log('instructions:', instructions);

    // Generate code in this thread to retain full conversation context
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions,
    })

    console.log('NEW run:', run);

    // Poll for run completion
    let runResult = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runResult.status === 'in_progress' || runResult.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      runResult = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    console.log('runResult:', runResult);

    const tools = runResult.tools[0]

    console.log('tools:', tools);

    if (runResult.status === 'completed') {
      // Get the latest message which should contain our code
      const messages = await openai.beta.threads.messages.list(threadId);
      const latestMessage = messages.data[0];
      
      if (latestMessage) {
        const content = latestMessage.content[0];
        console.log('content:', content);
        if (content.type === 'text') {
          // Extract code from the message content
          const code = content.text.value.trim();
          // Here you would save the code to your database
          console.log('Generated code:', code);
          // Save the game code to Supabase
          const { data, error } = await supabase
            .from('games')
            .insert([
              {
                thread_id: threadId,
                user_address: address,
                name: gameName,
                category,
                build_instructions: buildInstructions,
                react_code: code,
              }
            ])
            .select('*');

          if (error) {
            console.error('Error inserting into Supabase:', error);
            return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
          }

          console.log('data:', data);

          if (data && data[0] && data[0].id) {
            return NextResponse.json({ success: true, game_id: data[0].id });
          }
        }
      }
    } else {
      console.error('Run failed or was cancelled:', runResult.status);
      return NextResponse.json(
        { error: 'Failed to generate code' },
        { status: 500 }
      );
    }



    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving code:', error);
    return NextResponse.json(
      { error: 'Failed to save code' },
      { status: 500 }
    );
  }
} 