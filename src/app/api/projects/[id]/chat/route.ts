import { NextRequest, NextResponse } from "next/server";
import { getWelcomeMessage, getCompletionMessage } from "@/services/chatService";
import { processTurn } from "@/services/ai/projectTutor";
import {
  buildInitialTasks,
  ensureTrackingFields,
  applyTurn,
  findActiveTask,
  isProjectCompleted,
} from "@/services/projectTaskState";
import { mockTextbookQuestions, generateMockProject } from "@/mock";
import type {
  Message,
  ProjectTask,
  ChatRequest,
  ChatResponse,
  Project,
} from "@/types";

// ============================================
// POST /api/projects/{id}/chat
// 统一对话入口（文字 / 图片 / 文字+图片）
//
// 流程：
//   学生消息 → 任务状态分析（Qwen/Mock）
//   → 任务状态机推进（检查点/完成/切换）
//   → 返回导师回复与完整状态
// ============================================

// 内存中保存会话状态（Mock，未来替换为真实数据库）
interface ConversationState {
  tasks: ProjectTask[];
  messages: Message[];
}

const conversationStore = new Map<string, ConversationState>();

function getOrCreateState(
  projectId: string,
  conversationId: string
): ConversationState {
  const key = `${projectId}_${conversationId}`;
  let state = conversationStore.get(key);
  if (!state) {
    const tasks = buildInitialTasks(projectId);
    tasks[0].status = "inProgress";
    const welcome = getWelcomeMessage(conversationId);
    state = { tasks, messages: [welcome] };
    conversationStore.set(key, state);
  }
  return state;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body: ChatRequest = await req.json();
    const { message, conversationId, imageUrl } = body;

    if (!conversationId) {
      return NextResponse.json(
        { message: "缺少会话ID" },
        { status: 400 }
      );
    }

    const state = getOrCreateState(projectId, conversationId);

    // —— 初始化消息：仅确保会话存在，不做分析 ——
    if (message === "__init__") {
      return NextResponse.json({
        message: getWelcomeMessage(conversationId),
        updatedTasks: state.tasks,
        projectCompleted: false,
      } satisfies ChatResponse);
    }

    if (!message && !imageUrl) {
      return NextResponse.json(
        { message: "消息内容不能为空" },
        { status: 400 }
      );
    }

    // 兼容旧数据：补全新增追踪字段
    state.tasks = ensureTrackingFields(state.tasks, projectId);

    // 构建完整项目上下文（任务以会话实时状态为准）
    const project: Project = generateMockProject(
      projectId.replace("proj_", ""),
      mockTextbookQuestions[1]
    );
    project.tasks = state.tasks;
    project.id = projectId;

    const currentTask = findActiveTask(state.tasks);
    if (!currentTask) {
      return NextResponse.json({
        message: getCompletionMessage(conversationId),
        updatedTasks: state.tasks,
        projectCompleted: true,
      } satisfies ChatResponse);
    }

    const studentText = message || "";

    // 1) 记录学生消息
    const studentMsg: Message = {
      id: `msg_student_${Date.now()}`,
      conversationId,
      role: "student",
      type: imageUrl && studentText ? "text_and_image" : imageUrl ? "image" : "text",
      content: studentText || (imageUrl ? "[图片]" : ""),
      imageUrl: imageUrl || undefined,
      sendTime: new Date().toISOString(),
    };
    state.messages.push(studentMsg);

    // 2) AI 状态分析（真实 Qwen 或 Mock），导师回复在 evaluation.reply
    const evaluation = await processTurn({
      project,
      currentTask,
      studentText,
      studentImageUrl: imageUrl,
      recentMessages: state.messages.slice(0, -1),
    });

    // 3) 状态机推进：检查点 / 任务完成 / 自动进入下一任务
    const transition = applyTurn(
      state.tasks,
      currentTask.taskNo,
      studentText,
      imageUrl,
      evaluation
    );
    state.tasks = transition.tasks;

    const aiMessage: Message = {
      id: `msg_ai_${Date.now()}`,
      conversationId,
      role: "ai",
      type: "text",
      content: evaluation.reply,
      sendTime: new Date().toISOString(),
    };
    state.messages.push(aiMessage);

    const projectCompleted = isProjectCompleted(state.tasks);
    if (projectCompleted) {
      state.messages.push(getCompletionMessage(conversationId));
    }

    const response: ChatResponse = {
      message: aiMessage,
      updatedTasks: state.tasks,
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
