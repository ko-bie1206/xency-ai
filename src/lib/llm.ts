import { callClaude } from "@/lib/anthropic";
import { callGemini } from "@/lib/gemini";

export type LLMImage = { mimeType: string; base64: string };

export async function callLLM(system: string, userText: string, image?: LLMImage): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (provider === "gemini") return callGemini(system, userText, image);
  return callClaude(system, userText, image);
}
