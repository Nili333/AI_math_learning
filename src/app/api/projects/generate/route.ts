import { NextRequest, NextResponse } from "next/server";
import { generateProjectFromWrongAnswer } from "@/services/ai/projectGenerator";

// ============================================
// POST /api/projects/generate?wrongAnswerId={id}
// 生成学习项目（AI / Mock 自动切换）
//
// 支持两种调用方式：
//   1. 仅传 wrongAnswerId（无错题详情）→ 走 Mock 模板
//   2. 同时在 body 传入完整 wrongAnswer 对象 → 走 AI 定制
// ============================================
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wrongAnswerId = searchParams.get("wrongAnswerId");

    if (!wrongAnswerId) {
      return NextResponse.json(
        { message: "缺少错题ID参数" },
        { status: 400 }
      );
    }

    let wrongAnswer: import("@/types").WrongAnswer | undefined;
    try {
      const body = await req.json();
      if (body && body.question && body.studentAnswer) {
        wrongAnswer = body;
      }
    } catch {
      // body 为空或不是 JSON，忽略
    }

    const project = await generateProjectFromWrongAnswer(
      wrongAnswerId,
      wrongAnswer
    );
    return NextResponse.json(project);
  } catch (err) {
    console.error("[projects/generate] 项目生成失败:", err);
    return NextResponse.json(
      { message: "项目生成失败" },
      { status: 500 }
    );
  }
}
