// ============================================
// 用户实体
// ============================================
export interface User {
  id: string;
  username: string;
  nickname: string;
  grade: string;
  createTime: string;
}

// ============================================
// 学生学习画像
// ============================================
export interface StudentProfile {
  userId: string;
  totalAnalyzedWrongQuestions: number;
  totalCompletedProjects: number;
  keyWeakAreas: string[];
  knowledgeMastery: {
    knowledgePointId: string;
    knowledgePointName: string;
    masteryLevel: "mastered" | "basic" | "needStrengthen" | "focus";
    errorCount: number;
  }[];
  abilityScores: {
    abilityName: string;
    score: number; // 0-100
  }[];
  errorTypeStats: {
    errorTypeId: string;
    errorTypeName: string;
    count: number;
  }[];
}

// ============================================
// 题目实体
// ============================================
export interface Question {
  id: string;
  content: string;
  imageUrl?: string;
  subject: string;
  grade: string;
}

// ============================================
// 错因类型
// ============================================
export interface ErrorType {
  id: string;
  name: string; // 运算错误、概念错误、审题错误、建模错误
  description: string;
}

// ============================================
// 知识点
// ============================================
export interface KnowledgePoint {
  id: string;
  name: string;
  chapter: string;
  grade: string;
  textbookVersion: string;
}

// ============================================
// 错题记录
// ============================================
export interface SolutionStep {
  stepNo: number;
  title: string;
  content: string;
  explanation?: string;
}

export interface WrongAnswer {
  id: string;
  userId: string;
  questionId: string;
  question: Question;
  studentAnswer: string;
  studentAnswerImage?: string;
  correctAnswer?: string;
  /** AI 生成的详细正确解答过程 */
  correctSolution?: SolutionStep[];
  studentSteps: {
    stepNo: number;
    content: string;
    isError: boolean;
    errorHint?: string;
  }[];
  errorTypeId: string;
  errorType: ErrorType;
  errorAnalysis: string;
  knowledgePointIds: string[];
  knowledgePoints: KnowledgePoint[];
  relatedAbility: string;
  weakLevel: "normal" | "needStrengthen" | "focus";
  createTime: string;
  status: "analyzed" | "inProject" | "completed";
}

// ============================================
// 教材母题
// ============================================
export interface TextbookQuestion {
  id: string;
  content: string;
  textbookVersion: string;
  grade: string;
  chapter: string;
  knowledgePointId: string;
  knowledgePoint: KnowledgePoint;
  difficulty: number; // 1-5
  relevance: string; // 与当前薄弱点的关联说明
}

// ============================================
// 项目任务
// ============================================

// 任务状态：未开始 / 进行中 / 需要引导 / 已完成
export type TaskStatus = "notStarted" | "inProgress" | "needsGuidance" | "completed";

// 学生单次尝试记录（用于学习过程追溯与后续评价）
export interface TaskAttempt {
  attemptNo: number;
  checkpointIndex: number; // 该次尝试对应的检查点序号
  content: string; // 学生文字内容
  imageUrl?: string; // 本次提交的图片
  checkpointPassed: boolean; // 当前检查点是否通过
  errorDetected: boolean; // 是否检测到错误
  hintLevel: number; // 本次采用的提示级别 0-4
  selfCorrected: boolean; // 是否为自我纠正
  time: string;
}

// 项目任务内的检查点（AI 生成项目时每个任务自带一套）
export interface TaskCheckpoint {
  question: string;
  acceptKeywords: string[];
  hints: string[]; // 1~4 级提示，缺省自动补齐
}

export interface ProjectTask {
  id: string;
  projectId: string;
  taskNo: number;
  title: string;
  description: string;
  objective: string; // 任务目标
  completionCriteria: string[]; // 任务完成标准（多条）
  status: TaskStatus;
  studentAnswer?: string;
  // —— 任务检查点（默认取自任务蓝图；AI 定制项目时随项目生成）——
  checkpoints?: TaskCheckpoint[];
  // —— 引导过程追踪（AI导师的"大脑"状态）——
  checkpointIndex: number; // 当前检查点序号（从0开始）
  hintLevel: number; // 当前提示级别 0-4（0表示无需提示）
  hintCount: number; // 累计提示次数
  attemptCount: number; // 累计尝试次数
  currentError?: string; // 最近识别出的错误描述
  errorType?: string; // 最近错误类型
  selfCorrected: boolean; // 本任务中是否出现过自我纠正
  attempts: TaskAttempt[]; // 完整尝试历史
  completedTime?: string; // 任务完成时间
}

// ============================================
// 学习项目
// ============================================
export interface Project {
  id: string;
  name: string;
  background: string;
  learningObjectives: string[];
  sourceTextbookQuestionId: string;
  sourceTextbookQuestion: TextbookQuestion;
  tasks: ProjectTask[];
  createTime: string;
  status: "notStarted" | "inProgress" | "completed";
}

// ============================================
// 对话消息
// ============================================
export interface Message {
  id: string;
  conversationId: string;
  role: "ai" | "student";
  type?: "text" | "image" | "text_and_image"; // 消息类型，默认 text
  content: string;
  imageUrl?: string; // 图片 URL（type 为 image 或 text_and_image 时）
  sendTime: string;
}

// ============================================
// 对话会话
// ============================================
export interface Conversation {
  id: string;
  projectId: string;
  messages: Message[];
  createTime: string;
  updateTime: string;
}

// ============================================
// 学习评价
// ============================================
export interface Evaluation {
  id: string;
  userId: string;
  projectId: string;
  dimensionScores: {
    dimensionName: string; // 知识理解、解题过程、数学表达、推理能力、建模能力、知识迁移
    score: number; // 0-100
    description: string;
  }[];
  masteredContents: string[];
  weakContents: string[];
  suggestions: string[];
  growthPath: {
    stage: string;
    content: string;
  }[];
  createTime: string;
}

// ============================================
// API请求/响应类型
// ============================================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AnalyzeRequest {
  questionContent: string;
  questionImage?: string;
  studentAnswer: string;
  studentAnswerImage?: string; // 学生手写解答图片（base64 data URI）
  correctAnswer?: string;
}

export interface ChatRequest {
  message: string;
  conversationId: string;
  imageUrl?: string; // 可选：学生上传的解答图片 URL
}

export interface ChatResponse {
  message: Message;
  updatedTasks: ProjectTask[];
  projectCompleted: boolean;
  // —— 任务状态机扩展字段 ——
  taskStatus?: TaskStatus; // 本轮后当前任务的状态
  taskCompleted?: boolean; // 当前任务本轮是否完成
  currentTaskId?: string; // 当前任务ID
  nextTaskId?: string | null; // 下一任务ID（无则 null）
  hintLevel?: number; // 本轮提示级别 0-4
  transitionNotice?: string; // 任务切换提示语，如"很好，任务3完成，进入任务4"
  conversationId?: string; // 会话ID（服务端持久化）
}

// ============================================
// 项目列表摘要（GET /api/projects）
// ============================================
export interface ProjectSummary {
  id: string;
  name: string;
  status: "notStarted" | "inProgress" | "completed";
  progress: number;
  completedTasks: number;
  totalTasks: number;
  currentTaskTitle: string | null;
  wrongAnswerId: string | null;
  createTime: string;
  updatedAt: string;
}

// ============================================
// 对话恢复数据（GET /api/projects/{id}/chat）
// ============================================
export interface ChatHistoryResponse {
  project: Project;
  tasks: ProjectTask[];
  messages: Message[];
  conversationId: string;
  projectCompleted: boolean;
}

// ============================================
// 学习报告数据（GET /api/report）
// ============================================
export interface ReportData {
  profile: StudentProfile;
  projects: ProjectSummary[];
  wrongAnswers: WrongAnswer[];
  evaluations: {
    projectId: string;
    averageScore: number;
    createTime: string;
  }[];
}

// ============================================
// 系统状态（GET /api/system/status）
// ============================================
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
  storage?: "postgres" | "file" | string;
}

// 一轮对话的评估结果（服务端内部使用）
export interface TurnEvaluation {
  checkpointPassed: boolean; // 当前检查点是否通过
  taskCompleted: boolean; // 当前任务是否整体完成
  errorDetected: boolean;
  errorType?: string;
  errorLocation?: string;
  studentUnderstanding?: string;
  confidence: number;
  reply: string; // 给学生看的导师回复
}

export interface EvaluationRequest {
  answers: string[]; // 5个问题的答案
}
