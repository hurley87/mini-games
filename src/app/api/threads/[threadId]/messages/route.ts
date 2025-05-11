import { assistantId } from "@/lib/assistant";
import { openai } from "@/lib/openai";

export const runtime = "nodejs";

// Send a new message to a thread
export async function POST(
  request: Request,
  context: { params: { threadId: string } }
) {
  const { content, prompt } = await request.json();
  const { threadId } = await context.params;

  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: content,
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  let fullOutput = ''
  let currentCodeBlock = ''

  ;(async () => {
    for await (const event of stream) {
      if (event.event === 'thread.message.delta') {
        const delta = event.data?.delta?.content?.[0]
        if (delta?.type === 'text') {
          const content = delta.text?.value
          if (content) {
            fullOutput += content

            // Check if we're inside a code block
            if (content.includes('```')) {
              currentCodeBlock += content
              // If we've found a complete code block, save it
              if (currentCodeBlock.split('```').length >= 3) {
                const codeMatch = currentCodeBlock.match(/```(?:tsx|jsx)?\n?([\s\S]*?)```/)
                const extractedCode = codeMatch?.[1]?.trim()
                
                if (extractedCode) {
                  await fetch(`${process.env.c}/api/save-game`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      prompt,
                      reactCode: extractedCode,
                      userId: 'user-123', // replace with session
                    }),
                  })
                }
                currentCodeBlock = ''
              }
              continue // Skip sending code block content to frontend
            }

            // Only send non-code content to frontend
            if (!currentCodeBlock) {
              const eventData = JSON.stringify({
                type: 'text',
                content: content
              }) + '\n'
              await writer.write(encoder.encode(eventData))
            }
          }
        }
      }
    }

    await writer.close()

    // Extract and save the code block
    const codeMatch = fullOutput.match(/```(?:tsx|jsx)?\n?([\s\S]*?)```/)
    const extractedCode = codeMatch?.[1]?.trim()

    if (extractedCode) {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/save-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          extractedCode,
          userId: 'user-123', // replace with session
        }),
      })
    }
  })()

  return new Response(readable, {
    headers: { 
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
