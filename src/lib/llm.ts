import { callClaude } from "@/lib/anthropic";
import { callGemini } from "@/lib/gemini";

export async function callLLM(system: string, userText: string): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (provider === "gemini") return callGemini(system, userText);
  return callClaude(system, userText);
}
