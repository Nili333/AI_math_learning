import { NextRequest, NextResponse } from "next/server";
import { analyzeWrongAnswer } from "@/services/ai/wrongAnswerAnalyzer";
import { addWrongAnswer } from "@/services/serverStore";
import type { AnalyzeRequest } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// POST /api/questions/analyze
// 错题智能分析（AI / Mock 自动切换），分析结果写入持久化错题本
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { questionContent, studentAnswer, studentAnswerImage } = body;

    if (!questionContent?.trim()) {
      return NextResponse.json(
        { message: "请填写题目内容" },
        { status: 400 }
      );
    }
    if (!studentAnswer?.trim() && !studentAnswerImage) {
      return NextResponse.json(
        { message: "请填写你的答案，或上传手写解答图片" },
        { status: 400 }
      );
    }

    const wrongAnswer = await analyzeWrongAnswer({
      ...body,
      questionContent: questionContent.trim(),
      studentAnswer: studentAnswer?.trim() ?? "",
    });
    await addWrongAnswer(wrongAnswer);
    return NextResponse.json(wrongAnswer);
  } catch (err) {
    console.error("[questions/analyze] 分析失败:", err);
    return NextResponse.json(
      { message: "分析失败，请重试" },
      { status: 500 }
    );
  }
}
