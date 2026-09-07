import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/llm";

export async function finalizeHearingSession(sessionId: string) {
  const session = await prisma.hearingSession.findUnique({
    where: { id: sessionId },
    include: { qas: { orderBy: { order: "asc" } } },
  });
  if (!session) throw new Error("session not found");

  const transcript = session.qas.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n");
  const system =
    "あなたはX運用代行のプロジェクトマネージャーです。以下のヒアリングの質疑応答をもとに、運用担当者がすぐに使える「ヒアリングシート」に整理してください。内容に応じて見出しを立て（例：【目的】【ターゲット】【トーン・話し方】【NG事項】【今後の方針】など）、簡潔な箇条書きでまとめてください。";

  const summary = await callLLM(system, transcript);

  return prisma.hearingSession.update({
    where: { id: sessionId },
    data: { finished: true, summary, pendingQuestion: null },
    include: { qas: { orderBy: { order: "asc" } } },
  });
}
