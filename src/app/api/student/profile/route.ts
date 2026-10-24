import { NextResponse } from "next/server";
import { getProfile } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/student/profile
// 获取学生学习画像（由持久化数据实时计算）
// ============================================
export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(profile, {
    headers: { "Cache-Control": "no-store" },
  });
}
