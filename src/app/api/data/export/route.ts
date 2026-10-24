import { NextResponse } from "next/server";
import { exportAllData } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/data/export
// 导出全部学习数据（JSON 下载）
// ============================================
export async function GET() {
  const data = await exportAllData();
  const filename = `ai-math-learning-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
