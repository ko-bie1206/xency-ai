import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/llm";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  const hooks = await prisma.hook.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(hooks);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";
  const references: string[] = Array.isArray(body?.references)
    ? body.references.map((r: unknown) => String(r).trim()).filter(Boolean)
    : [];
  const elements = typeof body?.elements === "string" ? body.elements.trim() : "";

  if (!clientId || references.length === 0 || !elements) {
    return NextResponse.json(
      { error: "clientId, references, elements are required" },
      { status: 400 }
    );
  }

  const context = await prisma.contextSummary.findUnique({ where: { clientId } });

  let system =
    "あなたはX(旧Twitter)の「フック」（投稿冒頭で読者の目を止めて続きを読ませる一文、または数行）を専門に作成するプロのコピーライターです。与えられた複数の参考フックの型・リズム・テクニック（数字の使い方、問いかけ、意外性、共感の作り方など）を分析し、それらを踏まえて指定された要素を盛り込んだ新しいフックを1つだけ作成してください。参考フックの文章や内容をそのまま流用せず、型やテクニックだけを参考にしてください。出力はフックの文章のみとし、説明や前置き、鍵カッコは付けないでください。";
  if (context?.summary) {
    system += `\n\n以下はこのクライアントの普段の発信内容・トーンのまとめです。矛盾のないように反映してください。\n${context.summary}`;
  }

  const referencesText = references.map((r, i) => `${i + 1}. ${r}`).join("\n\n");
  const userMsg = `【参考フック】\n${referencesText}\n\n【フックに入れたい言葉や要素】\n${elements}`;

  let output: string;
  try {
    output = await callLLM(system, userMsg);
  } catch (err) {
    console.error("generateHook failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const hook = await prisma.hook.create({
    data: { clientId, references: referencesText, elements, output },
  });

  return NextResponse.json(hook);
}
