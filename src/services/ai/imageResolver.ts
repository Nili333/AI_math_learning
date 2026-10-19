// ============================================
// 图片 URL 解析（仅服务端）
// Qwen 需要可访问的图片地址或 base64 数据URI。
// 学生上传后的地址为 /api/uploads/xxx（相对路径），
// 模型服务器无法访问，需读取本地文件转为 data URI。
// ============================================

import { readFile } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads", "chat");

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function isSafeFilename(name: string): boolean {
  return !name.includes("..") && !name.includes("/") && !name.includes("\\");
}

export async function resolveImageForModel(
  imageUrl: string | undefined
): Promise<string | undefined> {
  if (!imageUrl) return undefined;

  // 已经是数据URI或公网可访问地址，直接使用
  if (imageUrl.startsWith("data:") || /^https?:\/\//.test(imageUrl)) {
    return imageUrl;
  }

  // /api/uploads/<filename> → 本地文件
  const match = imageUrl.match(/\/api\/uploads\/([^/?#]+)/);
  if (!match) return undefined;

  const filename = match[1];
  if (!isSafeFilename(filename)) return undefined;

  try {
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = MIME_MAP[ext] || "image/jpeg";
    const buffer = await readFile(join(UPLOAD_DIR, filename));
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    console.warn("[imageResolver] 图片读取失败:", filename);
    return undefined;
  }
}
