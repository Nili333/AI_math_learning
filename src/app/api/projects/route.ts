import { NextResponse } from "next/server";
import { listProjects } from "@/services/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================
// GET /api/projects
// 获取项目列表（含进度、当前任务）
// ============================================
export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(projects, {
    headers: { "Cache-Control": "no-store" },
  });
}
