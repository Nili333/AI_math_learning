import { NextResponse } from "next/server";

// ============================================
// POST /api/projects/{id}/submit
// 提交项目任务完成（Mock）
// ============================================
export async function POST() {
  return NextResponse.json({ success: true });
}
