// ============================================
// 图片 URL 解析（仅服务端）
// Qwen 需要可访问的图片地址或 base64 数据URI。
// 学生上传后的地址为 /api/uploads/xxx（相对路径），
// 模型服务器无法访问，需转换为 data URI：
//   - Postgres 后端：从数据库读取 BYTEA
//   - 文件后端：直接读取本地文件
// ============================================

import { readFile } from "fs/promises";
import { join } from "path";
import { isPostgresBackend } from "@/services/storage/backend";
import { readImage } from "@/services/serverStore";

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

  // /api/uploads/<filename> → 本地文件或数据库
  const match = imageUrl.match(/\/api\/uploads\/([^/?#]+)/);
  if (!match) return undefined;

  const filename = match[1];
  if (!isSafeFilename(filename)) return undefined;

  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const fallbackType = MIME_MAP[ext] || "image/jpeg";

  try {
    if (isPostgresBackend()) {
      const image = await readImage(filename);
      if (!image) {
        console.warn("[imageResolver] 数据库中找不到图片:", filename);
        return undefined;
      }
      return `data:${image.contentType || fallbackType};base64,${image.data.toString("base64")}`;
    }

    const buffer = await readFile(join(UPLOAD_DIR, filename));
    return `data:${fallbackType};base64,${buffer.toString("base64")}`;
  } catch {
    console.warn("[imageResolver] 图片读取失败:", filename);
    return undefined;
  }
}
