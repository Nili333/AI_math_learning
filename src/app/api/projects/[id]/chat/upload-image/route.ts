import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { isPostgresBackend, backendLabel } from "@/services/storage/backend";
import { saveImage } from "@/services/serverStore";

const UPLOAD_DIR = join(process.cwd(), "uploads", "chat");
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE = 10 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof File))
      return NextResponse.json({ success: false, message: "未接收到图片文件" }, { status: 400 });
    if (!ALLOWED_MIME.includes(file.type))
      return NextResponse.json({ success: false, message: "不支持的图片格式，请上传 JPG、PNG 或 WebP" }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ success: false, message: "图片过大，请上传小于 10MB 的图片" }, { status: 400 });

    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const filename = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isPostgresBackend()) {
      // 无状态部署（Vercel）：图片存入数据库
      await saveImage(filename, file.type, buffer);
    } else {
      if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(join(UPLOAD_DIR, filename), buffer);
    }

    const imageUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ success: true, imageUrl, filename, storage: backendLabel() });
  } catch (err) {
    console.error("[upload-image] 失败:", err);
    return NextResponse.json({ success: false, message: "图片上传失败，请重试" }, { status: 500 });
  }
}
