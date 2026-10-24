import { NextRequest, NextResponse } from "next/server";
import { completeProject, getProject } from "@/services/serverStore";
import { isProjectCompleted } from "@/services/projectTaskState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// POST /api/projects/{id}/submit
// 提交项目：标记完成并同步学习画像（幂等）
// ============================================
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ message: "项目不存在" }, { status: 404 });
  }
  if (!isProjectCompleted(project.tasks)) {
    return NextResponse.json(
      { success: false, message: "仍有任务未完成，暂时无法提交项目" },
      { status: 400 }
    );
  }
  const completed = await completeProject(params.id);
  return NextResponse.json({
    success: true,
    project: completed,
  });
}
