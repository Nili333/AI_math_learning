import { NextRequest, NextResponse } from "next/server";
import { recommendTextbookQuestions } from "@/services/ai/textbookRecommender";
import { getWrongAnswer } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 90;

// ============================================
// GET /api/textbook/questions?wrongAnswerId={id}
// 根据错题推荐教材母题（AI / Mock 自动切换）
// 未提供错题 ID 时返回通用母题列表
// ============================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wrongAnswerId = searchParams.get("wrongAnswerId");

  const wrongAnswer = wrongAnswerId
    ? await getWrongAnswer(wrongAnswerId)
    : undefined;

  const questions = await recommendTextbookQuestions(
    wrongAnswerId ?? "general",
    wrongAnswer ?? undefined
  );

  return NextResponse.json(questions, {
    headers: { "Cache-Control": "no-store" },
  });
}
