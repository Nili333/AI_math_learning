import { NextResponse } from "next/server";
import { mockStudentProfile } from "@/mock";

// ============================================
// GET /api/student/profile
// 获取学生学习画像（Mock）
// ============================================
export async function GET() {
  return NextResponse.json(mockStudentProfile);
}
