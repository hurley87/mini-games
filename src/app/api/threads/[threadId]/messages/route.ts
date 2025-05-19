import { assistantId } from "@/lib/assistant";
import { openai } from "@/lib/openai";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { tmpdir } from "os";
import path from "path";

export const runtime = "nodejs";

// Send a new message to a thread
export async function POST(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  const { threadId } = await params;

  let content: Array<{ type: string; [key: string]: unknown }> = [];
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const text = formData.get("content") as string | null;
    const file = formData.get("image") as File | null;
    if (text) {
      content.push({ type: "text", text });
    }
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const tmpPath = path.join(tmpdir(), file.name);
      await fsPromises.writeFile(tmpPath, buffer);
      const uploaded = await openai.files.create({
        file: fs.createReadStream(tmpPath),
        purpose: "assistants",
      });
      content.push({
        type: "image_file",
        image_file: { file_id: uploaded.id },
      });
      await fsPromises.unlink(tmpPath);
    }
  } else {
    const body = await request.json();
    content = [{ type: "text", text: body.content }];
  }

  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  return new Response(stream.toReadableStream());
}
