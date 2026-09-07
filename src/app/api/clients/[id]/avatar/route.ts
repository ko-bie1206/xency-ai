import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveUploadedImage } from "@/lib/uploads";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await req.formData();
  const image = form.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }

  let avatarPath: string;
  try {
    avatarPath = await saveUploadedImage(image);
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const client = await prisma.client.update({ where: { id }, data: { avatarPath } });
  return NextResponse.json(client);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await prisma.client.update({ where: { id }, data: { avatarPath: null } });
  return NextResponse.json(client);
}
