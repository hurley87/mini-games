import { openai } from "@/lib/openai";
import { NextRequest } from "next/server";

// Send a new message to a thread
export async function POST(
  request: NextRequest,
  context: { params: { threadId: string } }
): Promise<Response> {
  
  const { toolCallOutputs, runId } = await request.json();
  const { threadId } = await context.params;

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    // { tool_outputs: [{ output: result, tool_call_id: toolCallId }] },
    { tool_outputs: toolCallOutputs }
  );

  return new Response(stream.toReadableStream());
}
