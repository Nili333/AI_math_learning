import { NextRequest, NextResponse } from "next/server";
import { mockTextbookQuestions, generateMockProject } from "@/mock";

// ============================================
// GET /api/projects/{id}
// 获取项目详情（Mock）
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const wrongAnswerId = projectId.replace("proj_", "");
  const sourceTq = mockTextbookQuestions[1];
  const project = generateMockProject(wrongAnswerId, sourceTq);
  project.id = projectId;

  return NextResponse.json(project);
}
