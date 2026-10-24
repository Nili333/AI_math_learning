import { NextResponse } from "next/server";
import { resetDemoData } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// POST /api/data/reset
// 重置演示数据（清空新增错题、项目、会话、评价）
// ============================================
export async function POST() {
  await resetDemoData();
  return NextResponse.json({ success: true });
}
