import { NextResponse } from "next/server";
import { getSystemStatus } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/system/status
// 系统运行状态：AI 配置、数据规模、更新时间
// ============================================
export async function GET() {
  const status = await getSystemStatus();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
