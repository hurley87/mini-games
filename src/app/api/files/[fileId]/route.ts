import { openai } from "@/lib/openai";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  const fileContent = await openai.files.retrieveContent(fileId);
  return new Response(fileContent as unknown as ReadableStream, {
    headers: { "Content-Type": "application/octet-stream" },
  });
}
