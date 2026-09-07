import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveUploadedImage } from "@/lib/uploads";

export async function GET() {
  const materials = await prisma.referenceMaterial.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(materials);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const image = form.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }

  let imagePath: string;
  try {
    imagePath = await saveUploadedImage(image);
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const material = await prisma.referenceMaterial.create({ data: { imagePath } });
  return NextResponse.json(material);
}
