/**
 * 图片处理工具（浏览器端）
 *
 * 上传的题目/作答照片往往有 3~8MB，直接以 data URI 发送给模型会导致
 * 请求体过大、响应缓慢。这里先在 canvas 中按最长边缩放并压缩为 JPEG。
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(
  file: File,
  options: { maxSize?: number; quality?: number } = {}
): Promise<string> {
  const { maxSize = 1400, quality = 0.82 } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("图片过大，请上传小于 10MB 的图片");
  }

  const dataUrl = await readFileAsDataUrl(file);

  // SVG / GIF 等格式直接返回原图，避免 canvas 处理后丢失信息
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return dataUrl;
  }

  try {
    const image = await loadImage(dataUrl);
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    const ratio = longest > maxSize ? maxSize / longest : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    // 白底，避免 PNG 透明区域在 JPEG 中变黑
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片解析失败"));
    image.src = src;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 压缩后转成 File，便于走 multipart 上传 */
export async function compressImageToFile(
  file: File,
  options: { maxSize?: number; quality?: number } = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  if (file.size <= 400 * 1024) return file;

  const dataUrl = await compressImageFile(file, options);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type.includes("png") ? "png" : "jpg";
  return new File([blob], `chat_${Date.now()}.${extension}`, {
    type: blob.type || "image/jpeg",
  });
}

