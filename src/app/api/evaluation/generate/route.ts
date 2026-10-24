import { NextRequest, NextResponse } from "next/server";
import { generateEvaluation } from "@/services/ai/evaluationGenerator";
import { getEvaluation, getProject, saveEvaluation } from "@/services/serverStore";
import { isProjectCompleted } from "@/services/projectTaskState";
import type { EvaluationRequest } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================
// GET /api/evaluation/generate?projectId={id}
// 读取已生成的学习评价（刷新 / 重新进入时使用）
// ============================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ message: "缺少 projectId 参数" }, { status: 400 });
  }
  const evaluation = await getEvaluation(projectId);
  if (!evaluation) {
    return NextResponse.json({ message: "尚未生成评价" }, { status: 404 });
  }
  return NextResponse.json(evaluation, {
    headers: { "Cache-Control": "no-store" },
  });
}

// ============================================
// POST /api/evaluation/generate?projectId={id}
// 生成学习评价（AI / Mock 自动切换），并标记项目完成
// ============================================
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const body: EvaluationRequest = await req.json();
    const { answers } = body;

    if (!projectId) {
      return NextResponse.json({ message: "缺少 projectId 参数" }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length !== 5) {
      return NextResponse.json(
        { message: "参数错误：需要5个问题的答案" },
        { status: 400 }
      );
    }
    if (answers.some((answer) => !answer?.trim())) {
      return NextResponse.json(
        { message: "请完整回答5个问题后再提交" },
        { status: 400 }
      );
    }

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 });
    }
    if (!isProjectCompleted(project.tasks)) {
      return NextResponse.json(
        { message: "请先完成全部项目任务，再进行最终讲解与评价" },
        { status: 400 }
      );
    }

    const evaluation = await generateEvaluation(projectId, body, project);
    await saveEvaluation(evaluation);
    return NextResponse.json(evaluation);
  } catch (err) {
    console.error("[evaluation/generate] 评价生成失败:", err);
    return NextResponse.json(
      { message: "评价生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
