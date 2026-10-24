import { NextRequest, NextResponse } from "next/server";
import { recognizeMathImage, type OcrPurpose } from "@/services/ai/ocrService";

// ============================================
// POST /api/ocr/recognize
// OCR 识别数学题图片（通义千问 VL 模型）
// body: { image: "data:image/png;base64,...", purpose?: "question" | "answer" }
// ============================================

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, purpose } = body as { image?: string; purpose?: OcrPurpose };

    if (!image) {
      return NextResponse.json(
        { success: false, message: "请提供图片数据" },
        { status: 400 }
      );
    }

    const result = await recognizeMathImage(image, purpose === "answer" ? "answer" : "question");

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "识别失败" },
        { status: 200 } // 业务失败也返回 200，方便前端处理提示
      );
    }

    return NextResponse.json({
      success: true,
      text: result.text,
    });
  } catch (err) {
    console.error("[ocr/recognize] 失败:", err);
    return NextResponse.json(
      { success: false, message: "识别失败，请重试" },
      { status: 500 }
    );
  }
}
