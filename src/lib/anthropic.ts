import Anthropic from "@anthropic-ai/sdk";
import type { LLMImage } from "@/lib/llm";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

export async function callClaude(system: string, userText: string, image?: LLMImage): Promise<string> {
  const content: Anthropic.MessageParam["content"] = image
    ? [
        {
          type: "image",
          source: { type: "base64", media_type: image.mimeType as "image/jpeg", data: image.base64 },
        },
        { type: "text", text: userText },
      ]
    : userText;

  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1200,
    system,
    messages: [{ role: "user", content }],
  });

  return resp.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
