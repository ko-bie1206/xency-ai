import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FIRST_QUESTION } from "@/lib/hearing";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  let session = await prisma.hearingSession.findUnique({
    where: { clientId },
    include: { qas: { orderBy: { order: "asc" } } },
  });

  if (!session) {
    session = await prisma.hearingSession.create({
      data: { clientId, pendingQuestion: FIRST_QUESTION },
      include: { qas: { orderBy: { order: "asc" } } },
    });
  }

  return NextResponse.json(session);
}
