import { openai } from "@/lib/openai";

// Send a new message to a thread
export async function POST(request: Request): Promise<Response> {
  const { toolCallOutputs, runId } = await request.json();

  // Extract threadId from the URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const threadIdIndex = pathParts.findIndex(part => part === "threads") + 1;
  const threadId = pathParts[threadIdIndex];

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    { tool_outputs: toolCallOutputs }
  );

  return new Response(stream.toReadableStream());
}
