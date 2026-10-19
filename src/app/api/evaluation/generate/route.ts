import { NextRequest, NextResponse } from "next/server";
import { generateEvaluation } from "@/services/ai/evaluationGenerator";
import type { EvaluationRequest } from "@/types";

// ============================================
// POST /api/evaluation/generate?projectId={id}
// 生成学习评价（AI / Mock 自动切换）
// ============================================
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const body: EvaluationRequest = await req.json();
    const { answers } = body;

    if (!projectId) {
      return NextResponse.json(
        { message: "缺少 projectId 参数" },
        { status: 400 }
      );
    }
    if (!answers || answers.length !== 5) {
      return NextResponse.json(
        { message: "参数错误：需要5个问题的答案" },
        { status: 400 }
      );
    }

    const evaluation = await generateEvaluation(projectId, body);
    return NextResponse.json(evaluation);
  } catch (err) {
    console.error("[evaluation/generate] 评价生成失败:", err);
    return NextResponse.json(
      { message: "评价生成失败" },
      { status: 500 }
    );
  }
}
