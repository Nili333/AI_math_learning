import { NextResponse } from "next/server";
import { mockStudentProfile } from "@/mock";

// ============================================
// GET /api/knowledge/weak-points
// 获取薄弱点分析数据（Mock）
// 未来替换为真实向量检索+数据分析接口
// ============================================
export async function GET() {
  return NextResponse.json(mockStudentProfile);
}
