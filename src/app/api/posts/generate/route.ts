import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/llm";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  const theme = typeof body?.theme === "string" ? body.theme.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (!clientId || !reference || !theme) {
    return NextResponse.json(
      { error: "clientId, reference, theme are required" },
      { status: 400 }
    );
  }

  const context = await prisma.contextSummary.findUnique({ where: { clientId } });

  let system =
    "あなたはX(旧Twitter)運用のプロのライターです。与えられた参考ポストの文体・構成・トーンを分析し、指定されたテーマに沿った新しい投稿文を1本だけ作成してください。出力は投稿文の本文のみとし、説明や前置き、鍵カッコは付けないでください。";
  if (context?.summary) {
    system += `\n\n以下はこのクライアントの普段の発信内容・トーンのまとめです。矛盾のないように反映してください。\n${context.summary}`;
  }

  let userMsg = `【参考ポスト】\n${reference}\n\n【今回のテーマ】\n${theme}`;
  if (notes) userMsg += `\n\n【トーンや条件の補足】\n${notes}`;

  let output: string;
  try {
    output = await callLLM(system, userMsg);
  } catch (err) {
    console.error("generatePost failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const post = await prisma.post.create({
    data: { clientId, reference, theme, notes: notes || null, output },
  });

  return NextResponse.json(post);
}
