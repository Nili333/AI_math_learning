import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/projects/{id}
// 获取项目详情（持久化，刷新不丢失任务进度）
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ message: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json(project, {
    headers: { "Cache-Control": "no-store" },
  });
}
