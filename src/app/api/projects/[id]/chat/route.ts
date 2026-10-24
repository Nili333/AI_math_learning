import { NextRequest, NextResponse } from "next/server";
import { getCompletionMessage } from "@/services/chatService";
import { processTurn } from "@/services/ai/projectTutor";
import {
  applyTurn,
  ensureTrackingFields,
  findActiveTask,
  isProjectCompleted,
} from "@/services/projectTaskState";
import {
  appendMessage,
  getConversation,
  getProject,
  updateProjectTasks,
} from "@/services/serverStore";
import type { ChatRequest, ChatResponse, Message } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================
// GET /api/projects/{id}/chat
// 恢复会话：返回历史消息、任务状态与项目完成情况
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProject(params.id);
  if (!project) {
    return NextResponse.json({ message: "项目不存在" }, { status: 404 });
  }

  const tasks = ensureTrackingFields(project.tasks, project.id);
  const conversation = await getConversation(project.id);

  return NextResponse.json(
    {
      project: { ...project, tasks },
      tasks,
      messages: conversation.messages,
      conversationId: conversation.id,
      projectCompleted: isProjectCompleted(tasks),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ============================================
// POST /api/projects/{id}/chat
// 统一对话入口（文字 / 图片 / 文字+图片）
//
// 流程：
//   学生消息 → AI 状态分析（Qwen/Mock）
//   → 任务状态机推进（检查点/完成/切换）
//   → 持久化消息与任务状态，返回导师回复
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body: ChatRequest = await req.json();
    const { message, imageUrl } = body;

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 });
    }

    const tasks = ensureTrackingFields(project.tasks, projectId);
    project.tasks = tasks;

    const conversation = await getConversation(projectId);
    const conversationId = conversation.id;

    // —— 初始化：返回已有欢迎语与会话状态，不重复写入 ——
    if (message === "__init__") {
      return NextResponse.json({
        message: conversation.messages[0],
        updatedTasks: tasks,
        projectCompleted: isProjectCompleted(tasks),
        currentTaskId: findActiveTask(tasks)?.id,
        conversationId,
      } satisfies ChatResponse);
    }

    if (!message?.trim() && !imageUrl) {
      return NextResponse.json(
        { message: "消息内容不能为空" },
        { status: 400 }
      );
    }

    if (isProjectCompleted(tasks)) {
      return NextResponse.json({
        message: getCompletionMessage(conversationId),
        updatedTasks: tasks,
        projectCompleted: true,
        conversationId,
      } satisfies ChatResponse);
    }

    const currentTask = findActiveTask(tasks);
    if (!currentTask) {
      return NextResponse.json({
        message: getCompletionMessage(conversationId),
        updatedTasks: tasks,
        projectCompleted: true,
        conversationId,
      } satisfies ChatResponse);
    }

    const studentText = message?.trim() ?? "";

    // 1) 记录学生消息
    const studentMsg: Message = {
      id: `msg_student_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      conversationId,
      role: "student",
      type: imageUrl && studentText ? "text_and_image" : imageUrl ? "image" : "text",
      content: studentText || (imageUrl ? "[图片]" : ""),
      imageUrl: imageUrl || undefined,
      sendTime: new Date().toISOString(),
    };

    // 2) AI 状态分析（真实 Qwen 或 Mock），导师回复在 evaluation.reply
    const evaluation = await processTurn({
      project: { ...project, tasks },
      currentTask,
      studentText,
      studentImageUrl: imageUrl,
      recentMessages: conversation.messages,
    });

    // 3) 状态机推进：检查点 / 任务完成 / 自动进入下一任务
    const transition = applyTurn(
      tasks,
      currentTask.taskNo,
      studentText,
      imageUrl,
      evaluation
    );

    const savedProject = await updateProjectTasks(projectId, transition.tasks);
    const updatedTasks = savedProject?.tasks ?? transition.tasks;
    const projectCompleted = isProjectCompleted(updatedTasks);

    // 4) 写回会话消息
    const aiMessage: Message = {
      id: `msg_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      conversationId,
      role: "ai",
      type: "text",
      content: evaluation.reply,
      sendTime: new Date().toISOString(),
    };

    await appendMessage(projectId, studentMsg);
    await appendMessage(projectId, aiMessage);
    if (projectCompleted) {
      await appendMessage(projectId, getCompletionMessage(conversationId));
    }

    const response: ChatResponse = {
      message: aiMessage,
      updatedTasks,
      projectCompleted,
      taskStatus: transition.taskStatus,
      taskCompleted: transition.taskCompleted,
      currentTaskId: transition.currentTaskId,
      nextTaskId: transition.nextTaskId,
      hintLevel: transition.hintLevel,
      transitionNotice: transition.transitionNotice,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[projects/chat] 对话失败:", err);
    return NextResponse.json(
      { message: "对话失败，请重试" },
      { status: 500 }
    );
  }
}
