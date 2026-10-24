// ============================================
// 服务端持久化存储（统一入口）
//
// 对外导出的函数签名保持不变，内部根据环境自动选择后端：
//   - 配置 POSTGRES_URL / DATABASE_URL → Postgres（Vercel 部署）
//   - 未配置 → 本地文件 .data/store.json（本机开发 / 演示）
//
// 所有写操作在服务端串行执行，避免并发覆盖。
// ============================================

import type {
  Conversation,
  Evaluation,
  Message,
  Project,
  ProjectTask,
  StudentProfile,
  WrongAnswer,
} from "@/types";
import * as fileStore from "./serverStoreFile";
import * as pgStore from "./serverStorePostgres";
import { backendLabel, isPostgresBackend } from "./storage/backend";

export type { ProjectSummary, EvaluationSummary, StoreShape } from "./serverStoreFile";

export interface ReportData {
  profile: StudentProfile;
  projects: import("./serverStoreFile").ProjectSummary[];
  wrongAnswers: WrongAnswer[];
  evaluations: import("./serverStoreFile").EvaluationSummary[];
}

export interface SystemStatus {
  aiConfigured: boolean;
  model: string;
  visionModel: string;
  counts: {
    wrongAnswers: number;
    projects: number;
    conversations: number;
    evaluations: number;
  };
  updatedAt: string;
  storage: string;
}

// 跨路由模块共享同一把锁（每个路由模块可能被单独打包）
const globalStore = globalThis as unknown as { __amsDbLock?: Promise<void> };

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = globalStore.__amsDbLock ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalStore.__amsDbLock = previous.then(() => current);
  return previous.then(task).finally(() => release());
}

function pick() {
  return isPostgresBackend() ? pgStore : fileStore;
}

export function getProfile(): Promise<StudentProfile> {
  return withLock(() => pick().getProfile());
}

export function listWrongAnswers(): Promise<WrongAnswer[]> {
  return withLock(() => pick().listWrongAnswers());
}

export function getWrongAnswer(id: string): Promise<WrongAnswer | null> {
  return withLock(() => pick().getWrongAnswer(id));
}

export function addWrongAnswer(wrongAnswer: WrongAnswer): Promise<WrongAnswer> {
  return withLock(() => pick().addWrongAnswer(wrongAnswer));
}

export function saveProject(project: Project): Promise<Project> {
  return withLock(() => pick().saveProject(project));
}

export function getProject(projectId: string): Promise<Project | null> {
  return withLock(() => pick().getProject(projectId));
}

export function listProjects() {
  return withLock(() => pick().listProjects());
}

export function completeProject(projectId: string): Promise<Project | null> {
  return withLock(() => pick().completeProject(projectId));
}

export function getConversation(projectId: string): Promise<Conversation> {
  return withLock(() => pick().getConversation(projectId));
}

export function saveConversation(conversation: Conversation): Promise<Conversation> {
  return withLock(() => pick().saveConversation(conversation));
}

export function appendMessage(projectId: string, message: Message): Promise<Conversation> {
  return withLock(() => pick().appendMessage(projectId, message));
}

export function getEvaluation(projectId: string): Promise<Evaluation | null> {
  return withLock(() => pick().getEvaluation(projectId));
}

export function saveEvaluation(evaluation: Evaluation): Promise<Evaluation> {
  return withLock(() => pick().saveEvaluation(evaluation));
}

export function getReportData(): Promise<ReportData> {
  return withLock(() => pick().getReportData());
}

export async function getSystemStatus(): Promise<SystemStatus> {
  // 延迟导入，避免在非服务端环境读取 process.env
  const { AI_CONFIG, hasRealAIKey } = await import("./ai/config");
  const snapshot = await withLock(() => pick().getReportData());
  return {
    aiConfigured: hasRealAIKey(),
    model: AI_CONFIG.model,
    visionModel: AI_CONFIG.vlModel,
    counts: {
      wrongAnswers: snapshot.wrongAnswers.length,
      projects: snapshot.projects.length,
      conversations: snapshot.conversationCount,
      evaluations: snapshot.evaluations.length,
    },
    updatedAt: new Date().toISOString(),
    storage: backendLabel(),
  };
}

export function exportAllData(): Promise<import("./serverStoreFile").StoreShape> {
  return withLock(() => pick().exportAllData());
}

export function resetDemoData(): Promise<import("./serverStoreFile").StoreShape> {
  return withLock(() => pick().resetDemoData({ resetImages: isPostgresBackend() }));
}

export function updateProjectTasks(
  projectId: string,
  tasks: ProjectTask[]
): Promise<Project | null> {
  return withLock(() => pick().updateProjectTasks(projectId, tasks));
}

// ============================================
// 图片数据（仅 Postgres 后端使用；文件后端直接读磁盘）
// ============================================
export async function saveImage(filename: string, contentType: string, data: Buffer) {
  return withLock(() => pgStore.saveImage(filename, contentType, data));
}

export async function readImage(
  filename: string
): Promise<{ contentType: string; data: Buffer } | null> {
  return withLock(() => pgStore.readImage(filename));
}
