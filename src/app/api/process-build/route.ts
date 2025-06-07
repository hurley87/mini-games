import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { updateBuild, uploadImageFromUrl } from '@/lib/supabase';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

const openaiSDK = new OpenAI();

const processBuildSchema = z.object({
  buildId: z.string().min(1, 'Build ID is required'),
  description: z.string().min(1, 'Description is required'),
  model: z.string().min(1, 'Model is required'),
  fid: z.number().min(1, 'FID is required'),
});

const buildSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  html: z.string().min(1, 'HTML is required'),
  tutorial: z.string().min(1, 'Tutorial is required'),
});

const getSystemPrompt = () => {
  return 'You are a helpful assistant that generates a build for a mini game. You must respond with a JSON object containing "title" and "html" fields.';
};

const getActionPrompt = (description: string) => {
  return `

  You are now generating the implementation of a simple, fun browser-based game.
        
        You are a game generator. Create a complete HTML file that contains a canvas-based game using vanilla JS or Three.js. 
        Wrap everything in <html><body><script> and avoid using external packages.
        The code will be sandboxed in an iframe, so it must not rely on imports.
        The game must be interactive and playable with simple mouse input only.
        The canvas element must fill the entire screen at all times.
        
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

        Do not call window.awardPoints(score) directly. Instead, check if it exists first. Use this helper function:

        function tryAwardPoints(score) {
          if (typeof window.awardPoints === 'function') {
            window.awardPoints(score);
          } else {
            setTimeout(() => tryAwardPoints(score), 50);
          }
        }

        When the player earns points, call tryAwardPoints(score) instead of calling window.awardPoints(score) directly.
        
        Pass the player's score as a number. Do not define or modify this function — it is already provided by the environment.

        IMPORTANT UI REQUIREMENTS:
        - DO NOT display any text, numbers, scores, timers, or countdown elements anywhere on the screen
        - DO NOT show the player's score visually in the game
        - DO NOT display time remaining or any timer elements
        - The game should be purely visual with shapes, colors, and animations only
        - Keep track of score internally for the tryAwardPoints function, but never display it

        All games must be playable in the browser.

        The game should run continuously without showing time limits or countdowns to the player.

        Use simple colors and shapes. Interactions should be simple - just taps and clicks (no swipes or complex gestures). Don't use any external packacges. dont follow the users cursor.

        Return your response as a JSON object with the following structure:
        {
          "title": "The title of the game",
          "html": "The complete HTML code for the game",
          "tutorial": "A brief, clear description of how to play the game (2-3 sentences max)"
        }

⸻
Generate a build for a mini game based on the following description: ${description}`;
};

async function processBuildGeneration(
  buildId: string,
  description: string,
  model: string,
  fid: number
) {
  console.log('Processing build generation for buildId:', buildId);
  console.log('Fid:', fid);

  try {
    // Create a new thread
    const thread = await openaiSDK.beta.threads.create();

    // Update build with thread_id and status
    await updateBuild(buildId, {
      thread_id: thread.id,
      status: 'generating_content',
    });

    // Generate content using AI
    const { object: agentResponse } = await generateObject({
      model: openai(model),
      schema: buildSchema,
      mode: 'json',
      system: getSystemPrompt(),
      prompt: getActionPrompt(description),
    });

    const validatedResponse = buildSchema.parse(agentResponse);

    // Update build with generated content
    await updateBuild(buildId, {
      title: validatedResponse.title,
      html: validatedResponse.html,
      tutorial: validatedResponse.tutorial,
      status: 'generating_image',
    });

    // Generate an image based on the description
    const image = await openaiSDK.images.generate({
      prompt: `Create a square, text-free digital illustration inspired by the game description below.
        Use a bold, minimalist art style with flat shapes, soft lighting, and strong visual contrast.
        Focus on capturing the core mechanic, visual tone, and atmosphere of the game.
        Avoid realistic detail or clutter. Do not include any words or letters in the image.
        The image should look like a logo or visual identity — clean, iconic, and immediately readable.
        IMPORTANT: The illustration must fill the entire canvas edge-to-edge without any borders, padding, or empty space.
        Design the elements to extend all the way to the edges of the frame for a full-bleed appearance.

        Game description:
        ${description}`,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
      model: 'dall-e-3',
    });

    const imageUrl = image.data?.[0]?.url ?? '';
    const publicImageUrl = imageUrl ? await uploadImageFromUrl(imageUrl) : '';

    // Final update with image and completion status
    await updateBuild(buildId, {
      image: publicImageUrl,
      status: 'completed',
    });

    return {
      success: true,
      message: 'Build generation completed successfully',
    };
  } catch (error) {
    console.error('Error processing build generation:', error);

    // Update build with error status
    await updateBuild(buildId, {
      status: 'failed',
      error_message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });

    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = processBuildSchema.parse(body);

    const { buildId, description, model, fid } = validatedData;

    console.log('Processing build generation for buildId:', buildId);
    console.log('Fid:', fid);

    // Process the build generation
    const result = await processBuildGeneration(
      buildId,
      description,
      model,
      fid
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in process-build endpoint:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
