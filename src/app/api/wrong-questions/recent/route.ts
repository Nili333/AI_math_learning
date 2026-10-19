import { NextResponse } from "next/server";
import { mockRecentWrongAnswers } from "@/mock";

// ============================================
// GET /api/wrong-questions/recent
// 获取最近错题列表（Mock）
// ============================================
export async function GET() {
  return NextResponse.json(mockRecentWrongAnswers);
}
