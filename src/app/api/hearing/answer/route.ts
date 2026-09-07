import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/llm";
import { FIRST_QUESTION, MAX_HEARING_STEPS } from "@/lib/hearing";
import { finalizeHearingSession } from "@/lib/hearingFinalize";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";

  if (!clientId || !answer) {
    return NextResponse.json({ error: "clientId and answer are required" }, { status: 400 });
  }

  let session = await prisma.hearingSession.findUnique({
    where: { clientId },
    include: { qas: { orderBy: { order: "asc" } } },
  });
  if (!session) {
    session = await prisma.hearingSession.create({
      data: { clientId, pendingQuestion: FIRST_QUESTION },
      include: { qas: { orderBy: { order: "asc" } } },
    });
  }
  if (session.finished || !session.pendingQuestion) {
    return NextResponse.json({ error: "session already finished" }, { status: 400 });
  }

  const nextOrder = session.qas.length;
  await prisma.hearingQA.create({
    data: {
      sessionId: session.id,
      question: session.pendingQuestion,
      answer,
      order: nextOrder,
    },
  });

  const qaCount = nextOrder + 1;

  if (qaCount >= MAX_HEARING_STEPS) {
    try {
      const finalized = await finalizeHearingSession(session.id);
      return NextResponse.json(finalized);
    } catch (err) {
      console.error("finalize failed", err);
      return NextResponse.json({ error: "generation_failed" }, { status: 502 });
    }
  }

  const qas = await prisma.hearingQA.findMany({
    where: { sessionId: session.id },
    orderBy: { order: "asc" },
  });
  const transcript = qas.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n");
  const system = `あなたはX運用代行のヒアリング担当AIです。クライアントに運用方針を決めるためのヒアリングを行っています。これまでの質疑応答の履歴を踏まえ、次に聞くべき質問を1つだけ日本語で簡潔に生成してください。質問文のみを出力し、それ以外の説明は不要です。全体で${MAX_HEARING_STEPS}問を目安に、最初は目的やターゲットなど基本的なことから、徐々にトーンやNG事項など具体的な内容に深掘りしてください。現在${qaCount}問目まで完了しています。`;

  let nextQuestion: string;
  try {
    nextQuestion = await callLLM(system, transcript);
  } catch (err) {
    console.error("next question generation failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const updated = await prisma.hearingSession.update({
    where: { id: session.id },
    data: { pendingQuestion: nextQuestion || "次に、投稿で避けたい話題やNGワードがあれば教えてください。" },
    include: { qas: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(updated);
}
