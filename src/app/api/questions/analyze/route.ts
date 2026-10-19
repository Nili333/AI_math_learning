import { NextRequest, NextResponse } from "next/server";
import { analyzeWrongAnswer } from "@/services/ai/wrongAnswerAnalyzer";
import type { AnalyzeRequest } from "@/types";

// ============================================
// POST /api/questions/analyze
// 错题智能分析（AI / Mock 自动切换）
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { questionContent, studentAnswer } = body;

    if (!questionContent || !studentAnswer) {
      return NextResponse.json(
        { message: "请填写题目和你的答案" },
        { status: 400 }
      );
    }

    const wrongAnswer = await analyzeWrongAnswer(body);
    return NextResponse.json(wrongAnswer);
  } catch (err) {
    console.error("[questions/analyze] 分析失败:", err);
    return NextResponse.json(
      { message: "分析失败，请重试" },
      { status: 500 }
    );
  }
}
