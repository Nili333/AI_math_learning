import { NextRequest, NextResponse } from "next/server";
import { recommendTextbookQuestions } from "@/services/ai/textbookRecommender";

// ============================================
// GET /api/textbook/questions?wrongAnswerId={id}
// 根据错题获取推荐母题（AI / Mock 自动切换）
//
// 支持两种调用方式：
//   1. 仅传 wrongAnswerId → 返回 mock 母题列表
//   2. 同时 POST body 传入完整 wrongAnswer → AI 推荐
// ============================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wrongAnswerId = searchParams.get("wrongAnswerId");

  if (!wrongAnswerId) {
    return NextResponse.json(
      { message: "缺少错题ID参数" },
      { status: 400 }
    );
  }

  // GET 请求默认返回 mock 数据（前端可通过 POST 方式传错题详情来获得 AI 推荐）
  const questions = await recommendTextbookQuestions(wrongAnswerId);
  return NextResponse.json(questions);
}
