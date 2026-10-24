import { NextRequest, NextResponse } from "next/server";
import { listWrongAnswers } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/wrong-questions/recent
// 获取错题列表（按时间倒序，支持 limit）
// ============================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit") ?? "");
  const list = await listWrongAnswers();
  const result =
    Number.isFinite(limitParam) && limitParam > 0
      ? list.slice(0, limitParam)
      : list;

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
