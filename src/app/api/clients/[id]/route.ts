import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.client.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.xHandle !== "string") {
    return NextResponse.json({ error: "xHandle is required" }, { status: 400 });
  }
  const xHandle = body.xHandle.trim().replace(/^@/, "");
  const client = await prisma.client.update({
    where: { id },
    data: { xHandle: xHandle || null },
  });
  return NextResponse.json(client);
}
