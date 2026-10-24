// ============================================
// 存储后端选择
//
// 配置了 POSTGRES_URL / DATABASE_URL / POSTGRES_PRISMA_URL 时使用 Postgres，
// 否则回退到本地文件（.data/store.json），方便在本机无数据库时直接演示。
// ============================================

const GLOBAL_KEY = "__amsStorageBackend" as const;

type Backend = "postgres" | "file";
const globalRef = globalThis as unknown as Record<string, Backend | undefined>;

export function databaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ];
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

export function isPostgresBackend(): boolean {
  if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = databaseUrl() ? "postgres" : "file";
  }
  return globalRef[GLOBAL_KEY] === "postgres";
}

export function backendLabel(): string {
  return isPostgresBackend() ? "postgres" : "file";
}
