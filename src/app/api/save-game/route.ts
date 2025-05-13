import supabase from '@/lib/supabase'
import { openai } from '@/lib/openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

    const messages = await openai.beta.threads.messages.list(threadId)

    console.log('messages:', messages);

    const instructions = `
You are now generating the implementation of a game.

This game will be rendered inside a sandboxed iframe with the following setup:
- React and ReactDOM are loaded via CDN
- Babel standalone is available for JSX transpilation
- The code will be executed in an IIFE (Immediately Invoked Function Expression)

Here are your constraints and responsibilities:

- Write a complete React component called 'Game'
- Use JSX syntax — it will be transpiled by Babel
- Do not include any 'import' or 'export' statements
- Do not include triple backticks or markdown formatting
- Do not explain or comment on the code
- The code should be valid JavaScript that can be executed in an IIFE
- The code will be automatically wrapped in an IIFE and rendered to the 'root' element
- React and ReactDOM are available globally in the iframe

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