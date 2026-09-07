import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const emails = await prisma.allowedEmail.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(emails);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
  }

  try {
    const created = await prisma.allowedEmail.create({ data: { email } });
    return NextResponse.json(created);
  } catch (err) {
    console.error("failed to add allowed email", err);
    return NextResponse.json({ error: "すでに登録されているか、追加に失敗しました" }, { status: 400 });
  }
}
