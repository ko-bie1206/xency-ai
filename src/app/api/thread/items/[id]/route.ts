import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.threadItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
