import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/llm";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  const themes = await prisma.theme.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(themes);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";
  const context = typeof body?.context === "string" ? body.context.trim() : "";
  const elements = typeof body?.elements === "string" ? body.elements.trim() : "";

  if (!clientId || (!context && !elements)) {
    return NextResponse.json(
      { error: "clientId and at least one of context/elements are required" },
      { status: 400 }
    );
  }

  const clientContext = await prisma.contextSummary.findUnique({ where: { clientId } });

  let system =
    "あなたはX(旧Twitter)運用のコンテンツ企画に強いプランナーです。与えられたコンテキストと要素をもとに、バズりやすい投稿の「テーマ案」を1つ提案してください。出力は必ず次の3つの見出しで構成してください：\n【テーマ】（投稿で扱う具体的な題材）\n【型】（どんな見せ方・構成で投稿するか。例：ビフォーアフター写真、あるあるリスト、実体験ストーリーなど）\n【フック案】（冒頭で読者の目を引く一文）";
  if (clientContext?.summary) {
    system += `\n\n以下はこのクライアントの普段の発信内容・トーンのまとめです。矛盾のないように反映してください。\n${clientContext.summary}`;
  }

  let userMsg = "";
  if (context) userMsg += `【コンテキスト】\n${context}\n\n`;
  if (elements) userMsg += `【使えそうな要素】\n${elements}`;

  let output: string;
  try {
    output = await callLLM(system, userMsg.trim());
  } catch (err) {
    console.error("generateTheme failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const theme = await prisma.theme.create({
    data: { clientId, context, elements, output },
  });

  return NextResponse.json(theme);
}
