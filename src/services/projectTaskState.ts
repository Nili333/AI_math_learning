// ============================================
// 项目任务状态机（纯函数，可独立测试）
// 职责：
//   1. 根据评估结果推进检查点 / 完成任务 / 切换任务
//   2. 管理四级提示级别的自动升降
//   3. 完整记录每次尝试，识别"自我纠正"
// 不包含任何 AI 调用与 React 依赖
// ============================================

import type { ProjectTask, TaskAttempt, TurnEvaluation, TaskStatus } from "@/types";
import { getBlueprint, TASK_BLUEPRINTS } from "./projectBlueprint";

export const MAX_HINT_LEVEL = 4;

// —— Mock 项目启动时构建带完整追踪字段的任务列表 ——
export function buildInitialTasks(projectId: string): ProjectTask[] {
  return TASK_BLUEPRINTS.map((bp) => {
    const task: ProjectTask = {
      id: `${projectId}_task_${bp.taskNo}`,
      projectId,
      taskNo: bp.taskNo,
      title: bp.title,
      description: bp.description,
      objective: bp.objective,
      completionCriteria: bp.completionCriteria,
      status: "notStarted",
      checkpointIndex: 0,
      hintLevel: 0,
      hintCount: 0,
      attemptCount: 0,
      selfCorrected: false,
      attempts: [],
    };
    return task;
  });
}

// 用蓝图数据补全已有任务列表中缺失的追踪字段
// （兼容会话恢复/旧数据）
export function ensureTrackingFields(
  tasks: ProjectTask[],
  projectId: string
): ProjectTask[] {
  return tasks.map((t) => {
    const bp = getBlueprint(t.taskNo);
    return {
      ...t,
      checkpointIndex: t.checkpointIndex ?? 0,
      hintLevel: t.hintLevel ?? 0,
      hintCount: t.hintCount ?? 0,
      attemptCount: t.attemptCount ?? 0,
      selfCorrected: t.selfCorrected ?? false,
      attempts: t.attempts ?? [],
      objective: bp?.objective ?? t.description,
      completionCriteria: bp?.completionCriteria ?? [],
      id: t.id || `${projectId}_task_${t.taskNo}`,
      projectId: t.projectId || projectId,
    };
  });
}

export interface ApplyTurnResult {
  tasks: ProjectTask[];
  taskStatus: TaskStatus;
  taskCompleted: boolean;
  currentTaskId: string;
  nextTaskId: string | null;
  hintLevel: number;
  transitionNotice?: string;
}

/**
 * 将一轮评估结果应用到任务状态
 * @param tasks       全部任务
 * @param taskNo      当前任务编号
 * @param text        学生文字
 * @param imageUrl    学生图片
 * @param evaluation  本轮评估
 */
export function applyTurn(
  tasks: ProjectTask[],
  taskNo: number,
  text: string,
  imageUrl: string | undefined,
  evaluation: TurnEvaluation
): ApplyTurnResult {
  const now = new Date().toISOString();
  const bp = getBlueprint(taskNo);
  const targetTask = tasks.find((t) => t.taskNo === taskNo);
  if (!targetTask) {
    throw new Error(`当前任务 ${taskNo} 不存在`);
  }

  // 上一次在同一检查点是否出错（用于识别自我纠正）
  const lastAttempt = targetTask.attempts[targetTask.attempts.length - 1];
  const selfCorrectedThisTurn =
    Boolean(lastAttempt?.errorDetected) &&
    lastAttempt.checkpointIndex === targetTask.checkpointIndex &&
    evaluation.checkpointPassed;

  let updatedTasks = [...tasks];
  let taskStatus: TaskStatus = targetTask.status;
  let taskCompleted = false;
  let nextTaskId: string | null = null;
  let hintLevel = targetTask.hintLevel;
  let transitionNotice: string | undefined;

  if (evaluation.taskCompleted) {
    // —— 任务整体完成 ——
    taskCompleted = true;
    hintLevel = 0;
    taskStatus = "completed";

    const completedAttempt: TaskAttempt = {
      attemptNo: targetTask.attemptCount + 1,
      checkpointIndex: targetTask.checkpointIndex,
      content: text,
      imageUrl,
      checkpointPassed: true,
      errorDetected: false,
      hintLevel: 0,
      selfCorrected: selfCorrectedThisTurn,
      time: now,
    };

    updatedTasks = updatedTasks.map((t) => {
      if (t.taskNo !== taskNo) return t;
      return {
        ...t,
        status: "completed",
        studentAnswer: text || t.studentAnswer,
        hintLevel: 0,
        attemptCount: t.attemptCount + 1,
        selfCorrected: t.selfCorrected || selfCorrectedThisTurn,
        currentError: undefined,
        errorType: evaluation.errorType,
        completedTime: now,
        attempts: [...t.attempts, completedAttempt],
      };
    });

    // —— 自动推进下一任务 ——
    const nextBp = bp ? getBlueprint(taskNo + 1) : undefined;
    if (nextBp) {
      nextTaskId = updatedTasks.find((t) => t.taskNo === taskNo + 1)?.id ?? null;
      updatedTasks = updatedTasks.map((t) =>
        t.taskNo === taskNo + 1 ? { ...t, status: "inProgress" } : t
      );
      transitionNotice = `很好！你已经完成了任务${taskNo}「${bp?.title ?? ""}」，现在我们进入任务${taskNo + 1}「${nextBp.title}」。`;
    }
  } else if (evaluation.checkpointPassed) {
    // —— 检查点通过但任务未完成：推进到下一检查点 ——
    hintLevel = 0;
    taskStatus = "inProgress";
    const nextCheckpoint = targetTask.checkpointIndex + 1;

    const attempt: TaskAttempt = {
      attemptNo: targetTask.attemptCount + 1,
      checkpointIndex: targetTask.checkpointIndex,
      content: text,
      imageUrl,
      checkpointPassed: true,
      errorDetected: false,
      hintLevel: 0,
      selfCorrected: selfCorrectedThisTurn,
      time: now,
    };

    updatedTasks = updatedTasks.map((t) => {
      if (t.taskNo !== taskNo) return t;
      return {
        ...t,
        status: "inProgress",
        checkpointIndex: nextCheckpoint,
        hintLevel: 0,
        attemptCount: t.attemptCount + 1,
        selfCorrected: t.selfCorrected || selfCorrectedThisTurn,
        currentError: undefined,
        attempts: [...t.attempts, attempt],
      };
    });
  } else {
    // —— 未通过：进入需要引导状态，提示级别自动升级 ——
    const hasError = evaluation.errorDetected;
    hintLevel = hasError
      ? Math.min(targetTask.hintLevel + 1, MAX_HINT_LEVEL)
      : targetTask.hintLevel; // 纯图片等中性情况不升级
    taskStatus = "needsGuidance";

    const attempt: TaskAttempt = {
      attemptNo: targetTask.attemptCount + 1,
      checkpointIndex: targetTask.checkpointIndex,
      content: text,
      imageUrl,
      checkpointPassed: false,
      errorDetected: hasError,
      hintLevel,
      selfCorrected: false,
      time: now,
    };

    updatedTasks = updatedTasks.map((t) => {
      if (t.taskNo !== taskNo) return t;
      return {
        ...t,
        status: "needsGuidance",
        hintLevel,
        hintCount: hasError ? t.hintCount + 1 : t.hintCount,
        attemptCount: t.attemptCount + 1,
        currentError: evaluation.errorLocation || t.currentError,
        errorType: evaluation.errorType || t.errorType,
        attempts: [...t.attempts, attempt],
      };
    });
  }

  return {
    tasks: updatedTasks,
    taskStatus,
    taskCompleted,
    currentTaskId: targetTask.id,
    nextTaskId,
    hintLevel,
    transitionNotice,
  };
}

// 获取当前活跃任务（进行中 或 需要引导）
export function findActiveTask(tasks: ProjectTask[]): ProjectTask | undefined {
  return (
    tasks.find((t) => t.status === "inProgress") ||
    tasks.find((t) => t.status === "needsGuidance")
  );
}

// 判断整个项目是否完成
export function isProjectCompleted(tasks: ProjectTask[]): boolean {
  return tasks.length > 0 && tasks.every((t) => t.status === "completed");
}
