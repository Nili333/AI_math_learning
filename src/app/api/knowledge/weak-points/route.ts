import { NextResponse } from "next/server";
import { getProfile } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/knowledge/weak-points
// 获取薄弱点分析数据（实时画像）
// ============================================
export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(profile, {
    headers: { "Cache-Control": "no-store" },
  });
}
