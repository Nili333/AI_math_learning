import type {
  User,
  StudentProfile,
  ErrorType,
  KnowledgePoint,
  WrongAnswer,
  TextbookQuestion,
  Project,
} from "@/types";
import { buildInitialTasks } from "@/services/projectTaskState";

// ============================================
// Mock用户数据
// ============================================
export const mockUser: User = {
  id: "u_001",
  username: "student01",
  nickname: "小明",
  grade: "高二",
  createTime: "2024-09-01 08:00:00",
};

// ============================================
// 错因类型
// ============================================
export const errorTypes: ErrorType[] = [
  { id: "et_1", name: "运算错误", description: "计算过程中的代数运算失误" },
  { id: "et_2", name: "概念错误", description: "对数学概念理解不准确" },
  { id: "et_3", name: "审题错误", description: "未能正确理解题目条件" },
  { id: "et_4", name: "建模错误", description: "建立数学模型时出现偏差" },
];

// ============================================
// 知识点
// ============================================
// 仅针对高中"函数与导数"模块（人教A版选择性必修第二册 第五章）
export const knowledgePoints: KnowledgePoint[] = [
  { id: "kp_1", name: "导数的概念与几何意义", chapter: "第五章 一元函数的导数及其应用", grade: "高二", textbookVersion: "人教A版选择性必修第二册" },
  { id: "kp_2", name: "导数的运算", chapter: "第五章 一元函数的导数及其应用", grade: "高二", textbookVersion: "人教A版选择性必修第二册" },
  { id: "kp_3", name: "利用导数研究函数的单调性", chapter: "第五章 一元函数的导数及其应用", grade: "高二", textbookVersion: "人教A版选择性必修第二册" },
  { id: "kp_4", name: "函数的极值与最值", chapter: "第五章 一元函数的导数及其应用", grade: "高二", textbookVersion: "人教A版选择性必修第二册" },
  { id: "kp_5", name: "导数在实际问题中的应用", chapter: "第五章 一元函数的导数及其应用", grade: "高二", textbookVersion: "人教A版选择性必修第二册" },
];

// ============================================
// 学生学习画像
// ============================================
export const mockStudentProfile: StudentProfile = {
  userId: "u_001",
  totalAnalyzedWrongQuestions: 18,
  totalCompletedProjects: 2,
  keyWeakAreas: ["导数的运算", "利用导数求最值"],
  knowledgeMastery: [
    { knowledgePointId: "kp_1", knowledgePointName: "导数的概念与几何意义", masteryLevel: "basic", errorCount: 3 },
    { knowledgePointId: "kp_2", knowledgePointName: "导数的运算", masteryLevel: "focus", errorCount: 8 },
    { knowledgePointId: "kp_3", knowledgePointName: "利用导数研究函数的单调性", masteryLevel: "needStrengthen", errorCount: 5 },
    { knowledgePointId: "kp_4", knowledgePointName: "函数的极值与最值", masteryLevel: "needStrengthen", errorCount: 4 },
    { knowledgePointId: "kp_5", knowledgePointName: "导数在实际问题中的应用", masteryLevel: "focus", errorCount: 6 },
  ],
  abilityScores: [
    { abilityName: "代数运算", score: 55 },
    { abilityName: "函数建模", score: 48 },
    { abilityName: "逻辑推理", score: 65 },
  ],
  errorTypeStats: [
    { errorTypeId: "et_1", errorTypeName: "运算错误", count: 8 },
    { errorTypeId: "et_4", errorTypeName: "建模错误", count: 5 },
    { errorTypeId: "et_2", errorTypeName: "概念错误", count: 3 },
    { errorTypeId: "et_3", errorTypeName: "审题错误", count: 2 },
  ],
};

// ============================================
// 最近错题列表（Mock）
// ============================================
export const mockRecentWrongAnswers: WrongAnswer[] = [
  {
    id: "wa_001",
    userId: "u_001",
    questionId: "q_001",
    question: {
      id: "q_001",
      content: "求函数 y = x³ - 3x² + 2 的导数 y′。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "y′ = 3x² - 3x",
    correctAnswer: "y′ = 3x² - 6x",
    studentSteps: [
      { stepNo: 1, content: "对 x³ 求导：(x³)′ = 3x²", isError: false },
      { stepNo: 2, content: "对 -3x² 求导：(-3x²)′ = -3x", isError: true, errorHint: "幂函数求导公式 (xⁿ)′ = nxⁿ⁻¹，(-3x²)′ = -6x，漏乘了指数2" },
      { stepNo: 3, content: "常数2的导数为0，故 y′ = 3x² - 3x", isError: false },
    ],
    errorTypeId: "et_1",
    errorType: errorTypes[0],
    errorAnalysis: "使用幂函数求导公式时出现错误，(x²)′ = 2x，求导后漏乘指数，导致 (-3x²)′ 误写为 -3x。",
    knowledgePointIds: ["kp_2"],
    knowledgePoints: [knowledgePoints[1]],
    relatedAbility: "代数运算能力",
    weakLevel: "focus",
    createTime: "2024-10-02 15:30:00",
    status: "analyzed",
  },
  {
    id: "wa_002",
    userId: "u_001",
    questionId: "q_002",
    question: {
      id: "q_002",
      content: "求函数 f(x) = x³ - 3x 的极值。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "极小值 f(1) = -2",
    correctAnswer: "极大值 f(-1) = 2，极小值 f(1) = -2",
    studentSteps: [
      { stepNo: 1, content: "求导：f′(x) = 3x² - 3", isError: false },
      { stepNo: 2, content: "令 f′(x) = 0，即 3x² = 3，解得 x = 1", isError: true, errorHint: "解方程 3x² - 3 = 0 时开平方漏掉负根，应为 x = ±1，遗漏了极大值点 x = -1" },
      { stepNo: 3, content: "故 f(x) 在 x = 1 处取得极小值 f(1) = -2", isError: false },
    ],
    errorTypeId: "et_1",
    errorType: errorTypes[0],
    errorAnalysis: "解方程 3x² - 3 = 0 时开平方漏掉负根 x = -1，导致极大值点遗漏，极值求解不完整。",
    knowledgePointIds: ["kp_4"],
    knowledgePoints: [knowledgePoints[3]],
    relatedAbility: "逻辑推理能力",
    weakLevel: "needStrengthen",
    createTime: "2024-10-01 10:15:00",
    status: "completed",
  },
  {
    id: "wa_003",
    userId: "u_001",
    questionId: "q_003",
    question: {
      id: "q_003",
      content: "求曲线 y = x² 在点 P(1, 1) 处的切线方程。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "切线方程为 y = 2x - 1",
    correctAnswer: "切线方程为 y = 2x - 1",
    studentSteps: [
      { stepNo: 1, content: "求导：y′ = 2x", isError: false },
      { stepNo: 2, content: "切线斜率 k = y′|(x=1) = 2", isError: false },
      { stepNo: 3, content: "切线方程 y - 1 = 2(x - 1)，即 y = 2x - 1", isError: false },
    ],
    errorTypeId: "et_4",
    errorType: errorTypes[3],
    errorAnalysis: "虽然最终答案正确，但在说明导数几何意义（切线斜率）时表述不清晰，解题表达需要更加规范。",
    knowledgePointIds: ["kp_1"],
    knowledgePoints: [knowledgePoints[0]],
    relatedAbility: "数学表达能力",
    weakLevel: "needStrengthen",
    createTime: "2024-09-28 14:20:00",
    status: "completed",
  },
];

// ============================================
// 教材母题（Mock）
// ============================================
export const mockTextbookQuestions: TextbookQuestion[] = [
  {
    id: "tq_001",
    content: "求函数 f(x) = x³ - 3x² + 2 的单调区间。",
    textbookVersion: "人教A版选择性必修第二册",
    grade: "高二",
    chapter: "第五章 一元函数的导数及其应用",
    knowledgePointId: "kp_3",
    knowledgePoint: knowledgePoints[2],
    difficulty: 2,
    relevance: "与你在导数运算中出现的求导公式错误相关，通过完整求导巩固幂函数求导法则。",
  },
  {
    id: "tq_002",
    content: "要制作一个容积为500mL的圆柱形易拉罐，设底面半径为 r cm，高为 h cm，请写出表面积 S 关于 r 的函数关系式。",
    textbookVersion: "人教A版选择性必修第二册",
    grade: "高二",
    chapter: "第五章 一元函数的导数及其应用",
    knowledgePointId: "kp_5",
    knowledgePoint: knowledgePoints[4],
    difficulty: 3,
    relevance: "针对你在导数应用中的薄弱环节，练习从实际情境中建立函数关系并用导数求最值。",
  },
  {
    id: "tq_003",
    content: "已知函数 f(x) = x³ + ax² + bx 在 x = 1 处取得极值2，求 a、b 的值。",
    textbookVersion: "人教A版选择性必修第二册",
    grade: "高二",
    chapter: "第五章 一元函数的导数及其应用",
    knowledgePointId: "kp_4",
    knowledgePoint: knowledgePoints[3],
    difficulty: 4,
    relevance: "结合方程思想与极值条件，强化导数与方程联立的运算能力。",
  },
];

// ============================================
// 生成项目的工厂函数
// 任务列表（含目标、完成标准、引导追踪字段）由
// 任务蓝图 + 状态机统一构建，保证全系统唯一来源
// ============================================
export function generateMockProject(wrongAnswerId: string, sourceTq: TextbookQuestion): Project {
  const projectId = `proj_${wrongAnswerId}`;
  const tasks = buildInitialTasks(projectId);
  tasks[0].status = "inProgress"; // 第一个任务默认进行中

  return {
    id: projectId,
    name: "易拉罐优化设计——利用导数求最值项目",
    background:
      "学校运动会即将举行，需要订购一批圆柱形易拉罐饮料。厂家要求易拉罐容积为500mL（即500cm³），希望通过合理设计底面半径和高，使罐身用料（表面积）最少，从而降低成本。请你运用导数知识，为厂家设计一个用料最省的易拉罐方案。",
    learningObjectives: [
      "理解圆柱体体积与表面积的数学表达",
      "能根据实际条件建立函数模型，并用导数求函数的最小值",
      "能解释模型结果的实际意义，做出合理设计决策",
    ],
    sourceTextbookQuestionId: sourceTq.id,
    sourceTextbookQuestion: sourceTq,
    tasks,
    createTime: new Date().toISOString(),
    status: "inProgress",
  };
}
