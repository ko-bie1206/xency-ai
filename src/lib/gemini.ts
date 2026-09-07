import { GoogleGenAI } from "@google/genai";
import type { LLMImage } from "@/lib/llm";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(resp: any): string {
  if (typeof resp?.text === "function") return resp.text();
  if (typeof resp?.text === "string") return resp.text;
  const candidates = resp?.candidates;
  if (Array.isArray(candidates)) {
    return candidates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .flatMap((c: any) => c?.content?.parts ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p?.text ?? "")
      .join("\n");
  }
  return "";
}

export async function callGemini(system: string, userText: string, image?: LLMImage): Promise<string> {
  const parts = image
    ? [{ text: userText }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }]
    : [{ text: userText }];

  const resp = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: { systemInstruction: system },
  });
  return extractText(resp).trim();
}
