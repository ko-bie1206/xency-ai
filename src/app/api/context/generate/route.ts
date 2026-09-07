import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/llm";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";
  const youtube = typeof body?.youtube === "string" ? body.youtube.trim() : "";
  const sns = typeof body?.sns === "string" ? body.sns.trim() : "";
  const other = typeof body?.other === "string" ? body.other.trim() : "";

  if (!clientId || (!youtube && !sns && !other)) {
    return NextResponse.json(
      { error: "clientId and at least one source are required" },
      { status: 400 }
    );
  }

  const system =
    "あなたはクライアントの発信内容を分析するブランディングアナリストです。与えられた発信内容の抜粋を読み込み、そのクライアントの人物像・普段語るテーマや思想・話し方のトーン・よく使うキーワード・避けるべき話題やNGワードを整理してください。出力は次の見出しを使った箇条書きにしてください：\n【人物像】\n【発信のトーン】\n【よく語るテーマ・思想】\n【キーワード】\n【避けるべきこと】";

  let userMsg = "";
  if (youtube) userMsg += `【YouTubeでの発信】\n${youtube}\n\n`;
  if (sns) userMsg += `【他SNSでの発信】\n${sns}\n\n`;
  if (other) userMsg += `【その他の発信・メモ】\n${other}\n\n`;

  let summary: string;
  try {
    summary = await callLLM(system, userMsg.trim());
  } catch (err) {
    console.error("generateContext failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const context = await prisma.contextSummary.upsert({
    where: { clientId },
    create: { clientId, youtube, sns, other, summary },
    update: { youtube, sns, other, summary },
  });

  return NextResponse.json(context);
}
