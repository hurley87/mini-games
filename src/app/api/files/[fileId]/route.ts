import { openai } from "@/lib/openai";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  const file = await openai.files.retrieveContent(fileId);
  const contentType = file.headers.get("content-type") || "application/octet-stream";
  return new Response(file.body as unknown as ReadableStream, {
    headers: { "Content-Type": contentType },
  });
}
