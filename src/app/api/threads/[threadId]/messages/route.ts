import { assistantId } from "@/lib/assistant";
import { openai } from "@/lib/openai";

export const runtime = "nodejs";

// Send a new message to a thread
export async function POST(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  const { content } = await request.json();
  const { threadId } = await params;

  console.log('content', content);

  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: content,
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  return new Response(stream.toReadableStream());
}
