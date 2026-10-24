import { NextRequest, NextResponse } from "next/server";
import { generateProjectFromWrongAnswer } from "@/services/ai/projectGenerator";
import { getWrongAnswer, saveProject } from "@/services/serverStore";
import type { TextbookQuestion } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// POST /api/projects/generate?wrongAnswerId={id}
// 生成学习项目（AI / Mock 自动切换）
//
// body（可选）:
//   { sourceTextbookQuestion?: TextbookQuestion }
// 传入学生选定的教材母题后，项目会以该母题作为知识锚点。
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

    let sourceTextbookQuestion: TextbookQuestion | undefined;
    let bodyWrongAnswer: import("@/types").WrongAnswer | undefined;
    try {
      const body = await req.json();
      if (body?.sourceTextbookQuestion?.content) {
        sourceTextbookQuestion = body.sourceTextbookQuestion as TextbookQuestion;
      }
      if (body?.wrongAnswer?.question && body.wrongAnswer?.studentAnswer) {
        bodyWrongAnswer = body.wrongAnswer as import("@/types").WrongAnswer;
      }
    } catch {
      // body 为空或不是 JSON，忽略
    }

    const wrongAnswer =
      (await getWrongAnswer(wrongAnswerId)) ?? bodyWrongAnswer ?? undefined;

    const project = await generateProjectFromWrongAnswer(
      wrongAnswerId,
      wrongAnswer,
      sourceTextbookQuestion
    );
    await saveProject(project);
    return NextResponse.json(project);
  } catch (err) {
    console.error("[projects/generate] 项目生成失败:", err);
    return NextResponse.json(
      { message: "项目生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
