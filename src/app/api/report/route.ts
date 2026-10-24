import { NextResponse } from "next/server";
import { getReportData } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/report
// 学习报告数据：画像 + 项目 + 错题 + 评价摘要
// ============================================
export async function GET() {
  const data = await getReportData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
