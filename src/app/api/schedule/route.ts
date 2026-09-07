import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveUploadedImage } from "@/lib/uploads";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!clientId || !from || !to) {
    return NextResponse.json({ error: "clientId, from, to are required" }, { status: 400 });
  }

  const posts = await prisma.scheduledPost.findMany({
    where: {
      clientId,
      scheduledDate: { gte: new Date(from), lt: new Date(to) },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const clientId = String(form.get("clientId") ?? "");
  const scheduledDate = String(form.get("scheduledDate") ?? "");
  const content = String(form.get("content") ?? "").trim();
  const image = form.get("image");

  if (!clientId || !scheduledDate || !content) {
    return NextResponse.json(
      { error: "clientId, scheduledDate, content are required" },
      { status: 400 }
    );
  }

  let imagePath: string | null = null;
  if (image instanceof File && image.size > 0) {
    try {
      imagePath = await saveUploadedImage(image);
    } catch (err) {
      const message = err instanceof Error ? err.message : "upload_failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const post = await prisma.scheduledPost.create({
    data: {
      clientId,
      scheduledDate: new Date(scheduledDate),
      content,
      imagePath,
    },
  });

  return NextResponse.json(post);
}
