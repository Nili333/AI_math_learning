import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { isPostgresBackend } from "@/services/storage/backend";
import { readImage } from "@/services/serverStore";

const UPLOAD_DIR = join(process.cwd(), "uploads", "chat");
const MIME_MAP: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename;
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\"))
      return NextResponse.json({ message: "非法文件名" }, { status: 400 });
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = MIME_MAP[ext] || "image/jpeg";
    const cacheHeaders = { "Cache-Control": "public, max-age=86400" };

    if (isPostgresBackend()) {
      const image = await readImage(filename);
      if (!image) return NextResponse.json({ message: "图片不存在" }, { status: 404 });
      return new NextResponse(new Uint8Array(image.data), {
        headers: { "Content-Type": image.contentType || contentType, ...cacheHeaders },
      });
    }

    const buffer = await readFile(join(UPLOAD_DIR, filename));
    return new NextResponse(buffer, { headers: { "Content-Type": contentType, ...cacheHeaders } });
  } catch {
    return NextResponse.json({ message: "图片不存在" }, { status: 404 });
  }
}
