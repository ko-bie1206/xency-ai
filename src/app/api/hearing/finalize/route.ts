import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { finalizeHearingSession } from "@/lib/hearingFinalize";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId : "";
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const session = await prisma.hearingSession.findUnique({
    where: { clientId },
    include: { qas: true },
  });
  if (!session || session.qas.length === 0) {
    return NextResponse.json({ error: "no answers yet" }, { status: 400 });
  }
  if (session.finished) {
    return NextResponse.json(session);
  }

  try {
    const finalized = await finalizeHearingSession(session.id);
    return NextResponse.json(finalized);
  } catch (err) {
    console.error("manual finalize failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }
}
