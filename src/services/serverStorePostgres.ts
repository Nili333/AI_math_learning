// ============================================
// Postgres 存储后端（Neon / Supabase / Vercel Postgres）
//
// 表结构：
//   kv(key TEXT PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ)
//   images(filename TEXT PRIMARY KEY, content_type TEXT, data BYTEA, created_at TIMESTAMPTZ)
//
// 使用单行 JSON 快照 + pg advisory lock 保证并发写安全，
// 适合演示 / 团队试用规模；数据量继续增长时可平滑替换为多表结构。
// ============================================

import { Pool } from "pg";
import type {
  Conversation,
  Evaluation,
  Message,
  Project,
  ProjectTask,
  StudentProfile,
  WrongAnswer,
} from "@/types";
import { ensureTrackingFields, isProjectCompleted } from "./projectTaskState";
import { getWelcomeMessage } from "./chatService";
import { seedStore, type ReportSnapshot, type StoreShape } from "./serverStoreFile";
import { databaseUrl } from "./storage/backend";

// --------------------------------------------
// 连接池（Vercel Serverless 环境需要较小的连接数）
// --------------------------------------------
const globalDb = globalThis as unknown as { __amsPgPool?: Pool };

function getPool(): Pool {
  const url = databaseUrl();
  if (!url) throw new Error("未配置数据库连接串 DATABASE_URL");

  if (!globalDb.__amsPgPool) {
    globalDb.__amsPgPool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
      allowExitOnIdle: true,
    });
  }
  return globalDb.__amsPgPool;
}

const SNAPSHOT_KEY = "store";
const ADVISORY_LOCK_ID = 725_001;

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS images (
          filename TEXT PRIMARY KEY,
          content_type TEXT NOT NULL,
          data BYTEA NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

// --------------------------------------------
// 快照读写（在锁内执行）
// --------------------------------------------
async function readSnapshot(): Promise<StoreShape> {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query<{ value: StoreShape }>(
    "SELECT value FROM kv WHERE key = $1",
    [SNAPSHOT_KEY]
  );
  if (result.rows.length > 0) {
    return result.rows[0].value;
  }

  const seeded = seedStore();
  await pool.query(
    "INSERT INTO kv(key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO NOTHING",
    [SNAPSHOT_KEY, JSON.stringify(seeded)]
  );
  return seeded;
}

async function query<T>(fn: (db: StoreShape) => T): Promise<T> {
  const db = await readSnapshot();
  return fn(db);
}

async function mutate<T>(fn: (db: StoreShape) => T | Promise<T>): Promise<T> {
  await ensureSchema();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [ADVISORY_LOCK_ID]);

    const result = await client.query<{ value: StoreShape }>(
      "SELECT value FROM kv WHERE key = $1",
      [SNAPSHOT_KEY]
    );
    const db: StoreShape = result.rows.length > 0 ? result.rows[0].value : seedStore();

    const output = await fn(db);
    db.updatedAt = nowIso();

    await client.query(
      `INSERT INTO kv(key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [SNAPSHOT_KEY, JSON.stringify(db)]
    );
    await client.query("COMMIT");
    return output;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

// --------------------------------------------
// 画像维护（与文件后端保持一致）
// --------------------------------------------
function masteryLevelByCount(
  count: number
): StudentProfile["knowledgeMastery"][number]["masteryLevel"] {
  if (count >= 4) return "focus";
  if (count >= 3) return "needStrengthen";
  if (count >= 2) return "basic";
  return "mastered";
}

function normalizeProfile(db: StoreShape): void {
  db.profile.totalAnalyzedWrongQuestions = db.wrongAnswers.length;
  db.profile.knowledgeMastery = db.profile.knowledgeMastery.map((item) => ({
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
  else
    profile.errorTypeStats.push({
      errorTypeId: wrongAnswer.errorTypeId,
      errorTypeName: wrongAnswer.errorType.name,
      count: 1,
    });

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

  const sorted = [...profile.knowledgeMastery].sort((a, b) => b.errorCount - a.errorCount);
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

function summarizeProjects(db: StoreShape) {
  return db.projects
    .map((project) => {
      const completedTasks = project.tasks.filter((t) => t.status === "completed").length;
      const totalTasks = project.tasks.length || 1;
      const currentTask =
        project.tasks.find((t) => t.status === "inProgress") ??
        project.tasks.find((t) => t.status === "needsGuidance");
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: Math.round((completedTasks / totalTasks) * 100),
        completedTasks,
        totalTasks: project.tasks.length,
        currentTaskTitle: currentTask?.title ?? null,
        wrongAnswerId: project.id.startsWith("proj_") ? project.id.slice(5) : null,
        createTime: project.createTime,
        updatedAt: db.updatedAt,
      };
    })
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
}

function createDemoProject(db: StoreShape): Project | null {
  const seeded = seedStore();
  const demo = seeded.projects.find((item) => item.id === "proj_demo") ?? null;
  if (demo) db.projects.unshift(demo);
  return demo;
}

// --------------------------------------------
// 对外 API（与文件后端保持同一签名）
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
    const index = db.wrongAnswers.findIndex((item) => item.id === wrongAnswer.id);
    if (index >= 0) db.wrongAnswers[index] = wrongAnswer;
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

    if (normalized.id.startsWith("proj_")) {
      const wrong = db.wrongAnswers.find(
        (item) => item.id === normalized.id.slice("proj_".length)
      );
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

  return mutate<Project | null>((db) => {
    let created: Project | null = null;
    if (projectId === "proj_demo") {
      created = createDemoProject(db);
    } else if (projectId.startsWith("proj_")) {
      const wrongId = projectId.slice("proj_".length);
      const wrong = db.wrongAnswers.find((item) => item.id === wrongId);
      if (wrong) {
        const seeded = seedStore();
        const template = seeded.projects.find((item) => item.id === "proj_demo");
        if (template) {
          created = {
            ...template,
            id: projectId,
            name: template.name,
            createTime: nowIso(),
            status: "inProgress",
            tasks: template.tasks.map((task) => ({
              ...task,
              id: `${projectId}_task_${task.taskNo}`,
              projectId,
              status: task.taskNo === 1 ? "inProgress" : "notStarted",
            })),
          };
          db.projects.unshift(created);
          wrong.status = "inProject";
        }
      }
    }
    return created ? clone(created) : null;
  });
}

export async function listProjects() {
  return mutate((db) => {
    if (db.projects.length === 0) createDemoProject(db);
    return summarizeProjects(db);
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
      conversation = {
        id: `conv_${projectId}`,
        projectId,
        messages: [getWelcomeMessage(`conv_${projectId}`)],
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
    return {
      profile: clone(db.profile),
      projects: clone(summarizeProjects(db)),
      wrongAnswers: clone(db.wrongAnswers),
      evaluations: clone(
        Object.values(db.evaluations).map((evaluation) => ({
          projectId: evaluation.projectId,
          averageScore: Math.round(
            evaluation.dimensionScores.reduce((sum, item) => sum + item.score, 0) /
              Math.max(evaluation.dimensionScores.length, 1)
          ),
          createTime: evaluation.createTime,
        }))
      ),
      conversationCount: Object.keys(db.conversations).length,
    };
  });
}

export async function exportAllData(): Promise<StoreShape> {
  return query((db) => clone(db));
}

export async function resetDemoData(options?: { resetImages?: boolean }): Promise<StoreShape> {
  const seeded = seedStore();
  await mutate((db) => {
    Object.assign(db, clone(seeded));
    return undefined;
  });
  if (options?.resetImages) {
    await ensureSchema();
    await getPool().query("DELETE FROM images");
  }
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

// --------------------------------------------
// 图片（上传的解答照片）
// --------------------------------------------
export async function saveImage(filename: string, contentType: string, data: Buffer) {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO images(filename, content_type, data, created_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (filename) DO UPDATE SET data = EXCLUDED.data, content_type = EXCLUDED.content_type`,
    [filename, contentType, data]
  );
  return { filename, contentType };
}

export async function readImage(
  filename: string
): Promise<{ contentType: string; data: Buffer } | null> {
  await ensureSchema();
  const result = await getPool().query<{ content_type: string; data: Buffer }>(
    "SELECT content_type, data FROM images WHERE filename = $1",
    [filename]
  );
  if (result.rows.length === 0) return null;
  return {
    contentType: result.rows[0].content_type,
    data: result.rows[0].data,
  };
}
