import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.$transaction([
    prisma.post.deleteMany({ where: { clientId: id } }),
    prisma.contextSummary.deleteMany({ where: { clientId: id } }),
    prisma.hearingSession.deleteMany({ where: { clientId: id } }),
    prisma.scheduledPost.deleteMany({ where: { clientId: id } }),
  ]);
  return NextResponse.json({ ok: true });
}
