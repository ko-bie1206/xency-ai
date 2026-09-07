import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId : "";
  const decision = body?.decision === "approved" || body?.decision === "rejected" ? body.decision : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!postId || !decision) {
    return NextResponse.json({ error: "postId and decision are required" }, { status: 400 });
  }
  if (decision === "rejected" && !reason) {
    return NextResponse.json({ error: "reason is required for rejection" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { reviewToken: token } });
  if (!client) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const post = await prisma.scheduledPost.findUnique({ where: { id: postId } });
  if (!post || post.clientId !== client.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.scheduledPost.update({
    where: { id: postId },
    data: {
      status: decision,
      reviewNote: decision === "rejected" ? reason : null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
