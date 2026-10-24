// ============================================
// 本地文件存储后端（.data/store.json）
//
// 用于本机开发 / 无数据库演示。生产部署（Vercel）请配置 DATABASE_URL，
// 此时会自动切换到 serverStorePostgres。
// ============================================

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { dirname, join } from "path";
import type {
  Conversation,
  Evaluation,
  Message,
  Project,
  ProjectTask,
  StudentProfile,
  WrongAnswer,
} from "@/types";
import {
  generateMockProject,
  mockAllWrongAnswers,
  mockStudentProfile,
  mockTextbookQuestions,
} from "@/mock";
import { ensureTrackingFields, isProjectCompleted } from "./projectTaskState";
import { getWelcomeMessage } from "./chatService";

export const DATA_FILE = join(process.cwd(), ".data", "store.json");

export interface StoreShape {
  version: number;
  profile: StudentProfile;
  wrongAnswers: WrongAnswer[];
  projects: Project[];
  conversations: Record<string, Conversation>;
  evaluations: Record<string, Evaluation>;
  completedProjectIds: string[];
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: Project["status"];
  progress: number;
  completedTasks: number;
  totalTasks: number;
  currentTaskTitle: string | null;
  wrongAnswerId: string | null;
  createTime: string;
  updatedAt: string;
}

export interface EvaluationSummary {
  projectId: string;
  averageScore: number;
  createTime: string;
}

export interface ReportSnapshot {
  profile: StudentProfile;
  projects: ProjectSummary[];
  wrongAnswers: WrongAnswer[];
  evaluations: EvaluationSummary[];
  conversationCount: number;
}

// --------------------------------------------
// 基础工具
// --------------------------------------------

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function formatDateTime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function masteryLevelByCount(
  count: number
): StudentProfile["knowledgeMastery"][number]["masteryLevel"] {
  if (count >= 4) return "focus";
  if (count >= 3) return "needStrengthen";
  if (count >= 2) return "basic";
  return "mastered";
}

// --------------------------------------------
// 种子数据
// --------------------------------------------

function createDemoProject(): Project {
  const project = generateMockProject("demo", mockTextbookQuestions[1]);
  project.id = "proj_demo";
  project.name = "易拉罐优化设计——利用导数求最值";
  project.createTime = nowIso();
  project.status = "inProgress";
  project.tasks = project.tasks.map((task, index) => ({
    ...task,
    status: index === 0 ? "inProgress" : "notStarted",
  }));
  return project;
}

export function seedStore(): StoreShape {
  const demo = createDemoProject();
  return {
    version: 1,
    profile: clone(mockStudentProfile),
    wrongAnswers: clone(mockAllWrongAnswers),
    projects: [demo],
    conversations: {},
    evaluations: {},
    completedProjectIds: [],
    updatedAt: nowIso(),
  };
}

// --------------------------------------------
// 文件读写
// --------------------------------------------

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    if (!parsed || !Array.isArray(parsed.wrongAnswers) || !Array.isArray(parsed.projects)) {
      throw new Error("存储结构不完整");
    }
    return {
      version: parsed.version ?? 1,
      profile: parsed.profile ?? clone(mockStudentProfile),
      wrongAnswers: parsed.wrongAnswers ?? [],
      projects: parsed.projects ?? [],
      conversations: parsed.conversations ?? {},
      evaluations: parsed.evaluations ?? {},
      completedProjectIds: parsed.completedProjectIds ?? [],
      updatedAt: parsed.updatedAt ?? nowIso(),
    };
  } catch {
    // 首次启动或文件损坏：写入种子数据
    const seeded = seedStore();
    await writeStore(seeded);
    return seeded;
  }
}

async function writeStore(data: StoreShape): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const content = JSON.stringify(data, null, 2);
  const tempFile = `${DATA_FILE}.tmp`;
  await writeFile(tempFile, content, "utf8");
  try {
    await rename(tempFile, DATA_FILE);
  } catch {
    // Windows 下偶发占用导致 rename 失败，退化为直接写入
    await writeFile(DATA_FILE, content, "utf8");
  }
}

async function mutate<T>(fn: (db: StoreShape) => T | Promise<T>): Promise<T> {
  const db = await readStore();
  const result = await fn(db);
  db.updatedAt = nowIso();
  await writeStore(db);
  return result;
}

async function query<T>(fn: (db: StoreShape) => T): Promise<T> {
  const db = await readStore();
  return fn(db);
}

// --------------------------------------------
// 画像维护
// --------------------------------------------

function normalizeProfile(db: StoreShape): void {
  const profile = db.profile;
  profile.totalAnalyzedWrongQuestions = db.wrongAnswers.length;
  profile.knowledgeMastery = profile.knowledgeMastery.map((item) => ({
    ...item,
    masteryLevel: masteryLevelByCount(item.errorCount),
  }));
}

function applyWrongAnswerToProfile(db: StoreShape, wrongAnswer: WrongAnswer): void {
  const profile = db.profile;

  const stat = profile.errorTypeStats.find(
    (item) => item.errorTypeId === wrongAnswer.errorTypeId
  );
  if (stat) stat.count += 1;
  else {
    profile.errorTypeStats.push({
      errorTypeId: wrongAnswer.errorTypeId,
      errorTypeName: wrongAnswer.errorType.name,
      count: 1,
    });
  }

  for (const kp of wrongAnswer.knowledgePoints) {
    const existing = profile.knowledgeMastery.find(
      (item) => item.knowledgePointId === kp.id
    );
    if (existing) {
      existing.errorCount += 1;
      existing.knowledgePointName = kp.name;
      existing.masteryLevel = masteryLevelByCount(existing.errorCount);
    } else {
      profile.knowledgeMastery.push({
        knowledgePointId: kp.id,
        knowledgePointName: kp.name,
        masteryLevel: "mastered",
        errorCount: 1,
      });
    }
  }

  const sorted = [...profile.knowledgeMastery].sort(
    (a, b) => b.errorCount - a.errorCount
  );
  profile.keyWeakAreas = sorted.slice(0, 2).map((item) => item.knowledgePointName);

  normalizeProfile(db);
}

function markProjectCompletedInDb(db: StoreShape, projectId: string): void {
  const project = db.projects.find((item) => item.id === projectId);
  if (!project) return;
  project.status = "completed";

  if (!db.completedProjectIds.includes(projectId)) {
    db.completedProjectIds.push(projectId);
    db.profile.totalCompletedProjects += 1;
  }

  if (projectId.startsWith("proj_")) {
    const wrongId = projectId.slice("proj_".length);
    const wrong = db.wrongAnswers.find((item) => item.id === wrongId);
    if (wrong) wrong.status = "completed";
  }
}

function summarizeProject(project: Project, updatedAt: string): ProjectSummary {
  const completedTasks = project.tasks.filter((task) => task.status === "completed").length;
  const totalTasks = project.tasks.length || 1;
  const currentTask =
    project.tasks.find((task) => task.status === "inProgress") ??
    project.tasks.find((task) => task.status === "needsGuidance");
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    progress: Math.round((completedTasks / totalTasks) * 100),
    completedTasks,
    totalTasks: project.tasks.length,
    currentTaskTitle: currentTask?.title ?? null,
    wrongAnswerId: project.id.startsWith("proj_")
      ? project.id.slice("proj_".length)
      : null,
    createTime: project.createTime,
    updatedAt,
  };
}

// --------------------------------------------
// 对外 API
// --------------------------------------------

export async function getProfile(): Promise<StudentProfile> {
  return query((db) => {
    normalizeProfile(db);
    return clone(db.profile);
  });
}

export async function listWrongAnswers(): Promise<WrongAnswer[]> {
  return query((db) =>
    clone(
      [...db.wrongAnswers].sort(
        (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      )
    )
  );
}

export async function getWrongAnswer(id: string): Promise<WrongAnswer | null> {
  return query((db) => {
    const found = db.wrongAnswers.find((item) => item.id === id);
    return found ? clone(found) : null;
  });
}

export async function addWrongAnswer(wrongAnswer: WrongAnswer): Promise<WrongAnswer> {
  return mutate((db) => {
    const existingIndex = db.wrongAnswers.findIndex(
      (item) => item.id === wrongAnswer.id
    );
    if (existingIndex >= 0) db.wrongAnswers[existingIndex] = wrongAnswer;
    else db.wrongAnswers.unshift(wrongAnswer);
    applyWrongAnswerToProfile(db, wrongAnswer);
    normalizeProfile(db);
    return clone(wrongAnswer);
  });
}

export async function saveProject(project: Project): Promise<Project> {
  return mutate((db) => {
    const normalized: Project = {
      ...project,
      tasks: ensureTrackingFields(project.tasks, project.id),
      status: project.status ?? "inProgress",
    };
    if (isProjectCompleted(normalized.tasks)) normalized.status = "completed";

    const index = db.projects.findIndex((item) => item.id === normalized.id);
    if (index >= 0) db.projects[index] = normalized;
    else db.projects.unshift(normalized);

    const wrongAnswerId = normalized.id.startsWith("proj_")
      ? normalized.id.slice("proj_".length)
      : null;
    if (wrongAnswerId) {
      const wrong = db.wrongAnswers.find((item) => item.id === wrongAnswerId);
      if (wrong) {
        wrong.status = normalized.status === "completed" ? "completed" : "inProject";
      }
    }

    if (normalized.status === "completed") {
      markProjectCompletedInDb(db, normalized.id);
    }

    return clone(normalized);
  });
}

export async function getProject(projectId: string): Promise<Project | null> {
  const existing = await query((db) => {
    const found = db.projects.find((item) => item.id === projectId);
    return found ? clone(found) : null;
  });
  if (existing) return existing;

  // 未生成过的项目：按错题 ID 自动补建，保证刷新 / 直接访问不会 404
  return mutate<Project | null>((db) => {
    let project: Project | null = null;
    if (projectId === "proj_demo") {
      project = createDemoProject();
    } else if (projectId.startsWith("proj_")) {
      const wrongId = projectId.slice("proj_".length);
      const wrong = db.wrongAnswers.find((item) => item.id === wrongId);
      if (wrong) {
        const kpId = wrong.knowledgePointIds[0];
        const sourceTq =
          mockTextbookQuestions.find((q) => q.knowledgePointId === kpId) ??
          mockTextbookQuestions[1];
        project = generateMockProject(wrongId, sourceTq);
        project.id = projectId;
      }
    }
    if (!project) return null;
    db.projects.unshift(project);
    const wrongId = projectId.startsWith("proj_") ? projectId.slice(5) : null;
    const wrong = wrongId ? db.wrongAnswers.find((item) => item.id === wrongId) : undefined;
    if (wrong) wrong.status = "inProject";
    return clone(project);
  });
}

export async function listProjects(): Promise<ProjectSummary[]> {
  return query((db) => {
    if (db.projects.length === 0) db.projects.push(createDemoProject());
    return db.projects
      .map((project) => summarizeProject(project, db.updatedAt))
      .sort(
        (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
  });
}

export async function completeProject(projectId: string): Promise<Project | null> {
  return mutate((db) => {
    const project = db.projects.find((item) => item.id === projectId);
    if (!project) return null;
    markProjectCompletedInDb(db, projectId);
    return clone(project);
  });
}

export async function getConversation(projectId: string): Promise<Conversation> {
  return mutate((db) => {
    let conversation = db.conversations[projectId];
    if (!conversation) {
      const welcome = getWelcomeMessage(`conv_${projectId}`);
      conversation = {
        id: `conv_${projectId}`,
        projectId,
        messages: [welcome],
        createTime: nowIso(),
        updateTime: nowIso(),
      };
      db.conversations[projectId] = conversation;
    }
    return clone(conversation);
  });
}

export async function saveConversation(conversation: Conversation): Promise<Conversation> {
  return mutate((db) => {
    conversation.updateTime = nowIso();
    db.conversations[conversation.projectId] = clone(conversation);
    return clone(conversation);
  });
}

export async function appendMessage(
  projectId: string,
  message: Message
): Promise<Conversation> {
  return mutate((db) => {
    let conversation = db.conversations[projectId];
    if (!conversation) {
      conversation = {
        id: `conv_${projectId}`,
        projectId,
        messages: [getWelcomeMessage(`conv_${projectId}`)],
        createTime: nowIso(),
        updateTime: nowIso(),
      };
    }
    conversation.messages.push(message);
    conversation.updateTime = nowIso();
    db.conversations[projectId] = conversation;
    return clone(conversation);
  });
}

export async function getEvaluation(projectId: string): Promise<Evaluation | null> {
  return query((db) => {
    const found = db.evaluations[projectId];
    return found ? clone(found) : null;
  });
}

export async function saveEvaluation(evaluation: Evaluation): Promise<Evaluation> {
  return mutate((db) => {
    db.evaluations[evaluation.projectId] = clone(evaluation);
    markProjectCompletedInDb(db, evaluation.projectId);
    return clone(evaluation);
  });
}

export async function getReportData(): Promise<ReportSnapshot> {
  return query((db) => {
    normalizeProfile(db);
    const projects = db.projects
      .map((project) => summarizeProject(project, db.updatedAt))
      .sort(
        (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
    const evaluations = Object.values(db.evaluations).map((evaluation) => ({
      projectId: evaluation.projectId,
      averageScore: Math.round(
        evaluation.dimensionScores.reduce((sum, item) => sum + item.score, 0) /
          Math.max(evaluation.dimensionScores.length, 1)
      ),
      createTime: evaluation.createTime,
    }));
    return {
      profile: clone(db.profile),
      projects: clone(projects),
      wrongAnswers: clone(db.wrongAnswers),
      evaluations: clone(evaluations),
      conversationCount: Object.keys(db.conversations).length,
    };
  });
}

export async function exportAllData(): Promise<StoreShape> {
  return query((db) => clone(db));
}

export async function resetDemoData(options?: { resetImages?: boolean }): Promise<StoreShape> {
  // 文件后端没有数据库图片表，resetImages 参数仅为与 Postgres 后端保持同一签名
  void options;
  const seeded = seedStore();
  await writeStore(seeded);
  return clone(seeded);
}

export async function updateProjectTasks(
  projectId: string,
  tasks: ProjectTask[]
): Promise<Project | null> {
  return mutate((db) => {
    const project = db.projects.find((item) => item.id === projectId);
    if (!project) return null;
    project.tasks = tasks;
    if (isProjectCompleted(tasks)) {
      project.status = "completed";
      markProjectCompletedInDb(db, projectId);
    } else if (project.status !== "completed") {
      project.status = "inProgress";
    }
    return clone(project);
  });
}
