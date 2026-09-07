import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from, to are required" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { reviewToken: token } });
  if (!client) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const posts = await prisma.scheduledPost.findMany({
    where: {
      clientId: client.id,
      scheduledDate: { gte: new Date(from), lt: new Date(to) },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json({
    clientName: client.name,
    xHandle: client.xHandle,
    avatarPath: client.avatarPath,
    posts,
  });
}
