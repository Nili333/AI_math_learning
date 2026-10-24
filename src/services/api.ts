import type {
  User,
  StudentProfile,
  WrongAnswer,
  TextbookQuestion,
  Project,
  ProjectSummary,
  ChatResponse,
  ChatHistoryResponse,
  Evaluation,
  LoginRequest,
  AnalyzeRequest,
  ChatRequest,
  EvaluationRequest,
  ReportData,
  SystemStatus,
} from "@/types";

// ============================================
// API 基础配置
// 所有请求均走 Next.js Route Handler；替换为真实后端时
// 只需修改 BASE_URL 或各函数实现。
// ============================================
const BASE_URL = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    cache: "no-store",
    ...options,
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "请求失败，请稍后重试" }));
    throw new Error(err.message || `请求失败（${res.status}）`);
  }
  return res.json();
}

// ============================================
// 1. 登录
// POST /api/auth/login
// ============================================
export async function loginApi(
  data: LoginRequest
): Promise<{ user: User; token: string }> {
  return request<{ user: User; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// 2. 学生学习画像
// ============================================
export async function getProfileApi(): Promise<StudentProfile> {
  return request<StudentProfile>("/student/profile");
}

// ============================================
// 3. 错题分析
// ============================================
export async function analyzeQuestionApi(
  data: AnalyzeRequest
): Promise<WrongAnswer> {
  return request<WrongAnswer>("/questions/analyze", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// 4. 错题列表
// ============================================
export async function getRecentWrongQuestionsApi(
  limit?: number
): Promise<WrongAnswer[]> {
  return request<WrongAnswer[]>(
    `/wrong-questions/recent${limit ? `?limit=${limit}` : ""}`
  );
}

// ============================================
// 5. 薄弱点分析
// ============================================
export async function getWeakPointsApi(): Promise<StudentProfile> {
  return request<StudentProfile>("/knowledge/weak-points");
}

// ============================================
// 6. 教材母题推荐
// ============================================
export async function getTextbookQuestionsApi(
  wrongAnswerId?: string
): Promise<TextbookQuestion[]> {
  const query = wrongAnswerId
    ? `?wrongAnswerId=${encodeURIComponent(wrongAnswerId)}`
    : "";
  return request<TextbookQuestion[]>(`/textbook/questions${query}`);
}

// ============================================
// 7. 生成学习项目
// ============================================
export async function generateProjectApi(
  wrongAnswerId: string,
  sourceTextbookQuestion?: TextbookQuestion
): Promise<Project> {
  return request<Project>(
    `/projects/generate?wrongAnswerId=${encodeURIComponent(wrongAnswerId)}`,
    {
      method: "POST",
      body: JSON.stringify(
        sourceTextbookQuestion ? { sourceTextbookQuestion } : {}
      ),
    }
  );
}

// ============================================
// 8. 项目详情
// ============================================
export async function getProjectApi(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${encodeURIComponent(projectId)}`);
}

// ============================================
// 8.1 项目列表
// ============================================
export async function listProjectsApi(): Promise<ProjectSummary[]> {
  return request<ProjectSummary[]>("/projects");
}

// ============================================
// 9. 项目对话
// ============================================
export async function chatApi(
  projectId: string,
  data: ChatRequest
): Promise<ChatResponse> {
  return request<ChatResponse>(
    `/projects/${encodeURIComponent(projectId)}/chat`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ============================================
// 9.1 恢复项目对话
// ============================================
export async function getChatHistoryApi(
  projectId: string
): Promise<ChatHistoryResponse> {
  return request<ChatHistoryResponse>(
    `/projects/${encodeURIComponent(projectId)}/chat`
  );
}

// ============================================
// 9.2 上传对话中的解答图片
// ============================================
export async function uploadChatImageApi(
  projectId: string,
  imageFile: File
): Promise<{ success: boolean; imageUrl?: string; message?: string }> {
  const formData = new FormData();
  formData.append("image", imageFile);
  const res = await fetch(
    `${BASE_URL}/projects/${encodeURIComponent(projectId)}/chat/upload-image`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = (await res.json().catch(() => ({}))) as {
    success: boolean;
    imageUrl?: string;
    message?: string;
  };
  if (!res.ok || !data.success) {
    throw new Error(data.message || "图片上传失败");
  }
  return data;
}

// ============================================
// 10. 提交项目
// ============================================
export async function submitProjectApi(
  projectId: string
): Promise<{ success: boolean; project?: Project }> {
  return request<{ success: boolean; project?: Project }>(
    `/projects/${encodeURIComponent(projectId)}/submit`,
    { method: "POST" }
  );
}

// ============================================
// 11. 生成学习评价
// ============================================
export async function generateEvaluationApi(
  projectId: string,
  data: EvaluationRequest
): Promise<Evaluation> {
  return request<Evaluation>(
    `/evaluation/generate?projectId=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ============================================
// 11.1 读取已生成的学习评价
// ============================================
export async function getEvaluationApi(
  projectId: string
): Promise<Evaluation | null> {
  const res = await fetch(
    `${BASE_URL}/evaluation/generate?projectId=${encodeURIComponent(projectId)}`,
    { cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "加载评价失败" }));
    throw new Error(err.message || "加载评价失败");
  }
  return (await res.json()) as Evaluation;
}

// ============================================
// 12. OCR 识别数学题图片
// ============================================
export async function recognizeOcrApi(
  image: string,
  purpose: "question" | "answer" = "question"
): Promise<{ success: boolean; text?: string; message?: string }> {
  return request<{ success: boolean; text?: string; message?: string }>(
    "/ocr/recognize",
    {
      method: "POST",
      body: JSON.stringify({ image, purpose }),
    }
  );
}

// ============================================
// 13. 学习报告 / 系统状态 / 数据管理
// ============================================
export async function getReportApi(): Promise<ReportData> {
  return request<ReportData>("/report");
}

export async function getSystemStatusApi(): Promise<SystemStatus> {
  return request<SystemStatus>("/system/status");
}

export async function resetDemoDataApi(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/data/reset", { method: "POST" });
}

export const DATA_EXPORT_URL = "/api/data/export";
