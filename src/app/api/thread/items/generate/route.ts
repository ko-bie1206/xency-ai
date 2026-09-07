import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/llm";
import { saveUploadedImage } from "@/lib/uploads";

export async function POST(req: Request) {
  const form = await req.formData();
  const clientId = String(form.get("clientId") ?? "");
  const itemId = form.get("itemId") ? String(form.get("itemId")) : null;
  const order = Number(form.get("order") ?? 0);
  const referenceText = String(form.get("referenceText") ?? "").trim();
  const instruction = String(form.get("instruction") ?? "").trim();
  const image = form.get("image");

  if (!clientId || !instruction || Number.isNaN(order)) {
    return NextResponse.json(
      { error: "clientId, order, instruction are required" },
      { status: 400 }
    );
  }

  const thread = await prisma.thread.upsert({
    where: { clientId },
    create: { clientId },
    update: {},
    include: { items: { orderBy: { order: "asc" } } },
  });

  let referenceImagePath: string | undefined;
  let imageForLLM: { mimeType: string; base64: string } | undefined;
  if (image instanceof File && image.size > 0) {
    try {
      referenceImagePath = await saveUploadedImage(image);
    } catch (err) {
      const message = err instanceof Error ? err.message : "upload_failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const buffer = Buffer.from(await image.arrayBuffer());
    imageForLLM = { mimeType: image.type, base64: buffer.toString("base64") };
  }

  const context = await prisma.contextSummary.findUnique({ where: { clientId } });
  const priorItems = thread.items.filter((i) => i.order < order && i.output);

  let system: string;
  if (order === 0) {
    system =
      "あなたはX(旧Twitter)運用のプロのライターです。スレッド（ツリー投稿）の一番最初の「元ポスト」を作成します。参考ポストは文体・構成の参考であり、内容をそのまま再現する必要はありません。画像が添付されている場合も、その文体・構成・雰囲気だけを参考にし、画像の内容をそのまま説明したり書き写したりしないでください。出力は投稿文の本文のみとし、説明や前置き、鍵カッコは付けないでください。";
  } else {
    system = `あなたはX(旧Twitter)運用のプロのライターです。スレッド（ツリー投稿）の${order}番目のリプライ投稿を作成します。これまでのスレッドの流れに自然につながる内容にしてください。参考ポストは文体・構成の参考であり、内容をそのまま再現する必要はありません。画像が添付されている場合も、その文体・構成・雰囲気だけを参考にし、画像の内容をそのまま説明したり書き写したりしないでください。出力は投稿文の本文のみとし、説明や前置き、鍵カッコは付けないでください。`;
  }
  if (context?.summary) {
    system += `\n\n以下はこのクライアントの普段の発信内容・トーンのまとめです。矛盾のないように反映してください。\n${context.summary}`;
  }

  let userMsg = "";
  if (priorItems.length > 0) {
    userMsg += "【これまでのスレッド】\n";
    priorItems.forEach((i) => {
      userMsg += `${i.order === 0 ? "元ポスト" : `ツリー${i.order}`}: ${i.output}\n`;
    });
    userMsg += "\n";
  }
  if (referenceText) {
    userMsg += `【参考ポスト】\n${referenceText}\n\n`;
  } else if (imageForLLM) {
    userMsg += "【参考ポスト】\n(添付画像を参照してください)\n\n";
  }
  userMsg += `【今回の指示】\n${instruction}`;

  let output: string;
  try {
    output = await callLLM(system, userMsg, imageForLLM);
  } catch (err) {
    console.error("thread item generation failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const data = {
    threadId: thread.id,
    order,
    referenceText: referenceText || null,
    instruction,
    output,
    ...(referenceImagePath !== undefined ? { referenceImagePath } : {}),
  };

  const item = itemId
    ? await prisma.threadItem.update({ where: { id: itemId }, data })
    : await prisma.threadItem.create({ data });

  return NextResponse.json(item);
}
