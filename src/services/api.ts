import type {
  User,
  StudentProfile,
  WrongAnswer,
  TextbookQuestion,
  Project,
  ChatResponse,
  Evaluation,
  LoginRequest,
  AnalyzeRequest,
  ChatRequest,
  EvaluationRequest,
} from "@/types";

// ============================================
// API基础配置
// 未来替换为真实API时，只需修改 BASE_URL 及各函数实现
// ============================================
const BASE_URL = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "请求失败" }));
    throw new Error(err.message || "请求失败");
  }
  return res.json();
}

// ============================================
// 1. 登录
// POST /api/auth/login
// ============================================
export async function loginApi(data: LoginRequest): Promise<{ user: User; token: string }> {
  return request<{ user: User; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// 2. 获取学生学习画像
// GET /api/student/profile
// ============================================
export async function getProfileApi(): Promise<StudentProfile> {
  return request<StudentProfile>("/student/profile");
}

// ============================================
// 3. 错题分析
// POST /api/questions/analyze
// ============================================
export async function analyzeQuestionApi(data: AnalyzeRequest): Promise<WrongAnswer> {
  return request<WrongAnswer>("/questions/analyze", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// 4. 获取最近错题列表
// GET /api/wrong-questions/recent
// ============================================
export async function getRecentWrongQuestionsApi(): Promise<WrongAnswer[]> {
  return request<WrongAnswer[]>("/wrong-questions/recent");
}

// ============================================
// 5. 获取薄弱点分析数据
// GET /api/knowledge/weak-points
// ============================================
export async function getWeakPointsApi(): Promise<StudentProfile> {
  return request<StudentProfile>("/knowledge/weak-points");
}

// ============================================
// 6. 根据错题获取推荐母题
// GET /api/textbook/questions?wrongAnswerId={id}
// ============================================
export async function getTextbookQuestionsApi(wrongAnswerId: string): Promise<TextbookQuestion[]> {
  return request<TextbookQuestion[]>(`/textbook/questions?wrongAnswerId=${wrongAnswerId}`);
}

// ============================================
// 7. 生成学习项目
// POST /api/projects/generate?wrongAnswerId={id}
// ============================================
export async function generateProjectApi(wrongAnswerId: string): Promise<Project> {
  return request<Project>(`/projects/generate?wrongAnswerId=${wrongAnswerId}`, {
    method: "POST",
  });
}

// ============================================
// 8. 获取项目详情
// GET /api/projects/{id}
// ============================================
export async function getProjectApi(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`);
}

// ============================================
// 9. 项目对话
// POST /api/projects/{id}/chat  支持纯文字、纯图片、文字+图片
// ============================================
export async function chatApi(
  projectId: string,
  data: ChatRequest
): Promise<ChatResponse> {
  return request<ChatResponse>(`/projects/${projectId}/chat`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// 9.1 上传对话中的解答图片
// POST /api/projects/{id}/chat/upload-image  (multipart/form-data, field: image)
// ============================================
export async function uploadChatImageApi(
  projectId: string,
  imageFile: File
): Promise<{ success: boolean; imageUrl?: string; message?: string }> {
  const formData = new FormData();
  formData.append("image", imageFile);
  const res = await fetch(`${BASE_URL}/projects/${projectId}/chat/upload-image`, {
    method: "POST",
    body: formData,
  });
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
// 10. 提交项目任务完成
// POST /api/projects/{id}/submit
// ============================================
export async function submitProjectApi(projectId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/projects/${projectId}/submit`, {
    method: "POST",
  });
}

// ============================================
// 11. 生成学习评价
// POST /api/evaluation/generate?projectId={id}
// ============================================
export async function generateEvaluationApi(
  projectId: string,
  data: EvaluationRequest
): Promise<Evaluation> {
  return request<Evaluation>(`/evaluation/generate?projectId=${projectId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
