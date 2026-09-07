import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FIRST_QUESTION } from "@/lib/hearing";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  await prisma.hearingSession.deleteMany({ where: { clientId } });
  const session = await prisma.hearingSession.create({
    data: { clientId, pendingQuestion: FIRST_QUESTION },
    include: { qas: true },
  });

  return NextResponse.json(session);
}
