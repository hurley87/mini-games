import { openai } from "@/lib/openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { fileId: string } }
): Promise<Response> {
  const { fileId } = params;
  const file = await openai.files.retrieveContent(fileId);
  const contentType = file.headers.get("content-type") || "application/octet-stream";
  return new Response(file.body as unknown as ReadableStream, {
    headers: { "Content-Type": contentType },
  });
}
