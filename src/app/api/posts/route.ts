import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  const posts = await prisma.post.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(posts);
}
