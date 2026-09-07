import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const thread = await prisma.thread.findUnique({
    where: { clientId },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(thread);
}

export async function DELETE(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  await prisma.thread.deleteMany({ where: { clientId } });
  return NextResponse.json({ ok: true });
}
