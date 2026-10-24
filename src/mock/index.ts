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
  { id: "et_5", name: "公式使用错误", description: "公式记忆或套用不准确" },
  { id: "et_6", name: "推理错误", description: "逻辑推理链条存在漏洞" },
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
  totalAnalyzedWrongQuestions: 8,
  totalCompletedProjects: 0,
  keyWeakAreas: ["导数的运算", "函数的极值与最值"],
  knowledgeMastery: [
    { knowledgePointId: "kp_1", knowledgePointName: "导数的概念与几何意义", masteryLevel: "basic", errorCount: 2 },
    { knowledgePointId: "kp_2", knowledgePointName: "导数的运算", masteryLevel: "needStrengthen", errorCount: 3 },
    { knowledgePointId: "kp_3", knowledgePointName: "利用导数研究函数的单调性", masteryLevel: "mastered", errorCount: 1 },
    { knowledgePointId: "kp_4", knowledgePointName: "函数的极值与最值", masteryLevel: "basic", errorCount: 2 },
    { knowledgePointId: "kp_5", knowledgePointName: "导数在实际问题中的应用", masteryLevel: "mastered", errorCount: 1 },
  ],
  abilityScores: [
    { abilityName: "代数运算", score: 55 },
    { abilityName: "函数建模", score: 48 },
    { abilityName: "逻辑推理", score: 65 },
  ],
  errorTypeStats: [
    { errorTypeId: "et_1", errorTypeName: "运算错误", count: 3 },
    { errorTypeId: "et_2", errorTypeName: "概念错误", count: 2 },
    { errorTypeId: "et_4", errorTypeName: "建模错误", count: 2 },
    { errorTypeId: "et_5", errorTypeName: "公式使用错误", count: 1 },
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
    correctSolution: [
      { stepNo: 1, title: "识别函数结构", content: "$y=x^3-3x^2+2$ 是多项式函数，可以逐项求导。", explanation: "多项式函数在 $\\mathbb{R}$ 上可导，直接使用幂函数求导法则。" },
      { stepNo: 2, title: "逐项求导", content: "$(x^3)'=3x^2$，$(-3x^2)'=-6x$，$(2)'=0$。", explanation: "使用 $(x^n)'=nx^{n-1}$；系数 $-3$ 要保留，指数 $2$ 也要参与相乘；常数项导数为 $0$。" },
      { stepNo: 3, title: "合并结果", content: "$y'=3x^2-6x$。", explanation: "把各项导数相加，得到最终的导函数。" },
    ],
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
    correctSolution: [
      { stepNo: 1, title: "求导", content: "$f'(x)=3x^2-3=3(x-1)(x+1)$。", explanation: "先对三次多项式求导，再因式分解，便于求驻点。" },
      { stepNo: 2, title: "求驻点", content: "令 $f'(x)=0$，得 $x=-1$ 或 $x=1$。", explanation: "极值点只能在导数为零或导数不存在的点中产生。" },
      { stepNo: 3, title: "判断单调性", content: "当 $x<-1$ 或 $x>1$ 时 $f'(x)>0$；当 $-1<x<1$ 时 $f'(x)<0$。", explanation: "由导数的符号判断：先增后减为极大值，先减后增为极小值。" },
      { stepNo: 4, title: "计算极值", content: "$f(-1)=-1+3=2$，$f(1)=1-3=-2$。", explanation: "因此 $x=-1$ 处取得极大值 $2$，$x=1$ 处取得极小值 $-2$。" },
    ],
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
    correctSolution: [
      { stepNo: 1, title: "求导数", content: "$y=x^2$，所以 $y'=2x$。", explanation: "导函数在某点的值就是曲线在该点处切线的斜率。" },
      { stepNo: 2, title: "求切线斜率", content: "在 $P(1,1)$ 处，$k=y'|_{x=1}=2$。", explanation: "把切点横坐标代入导函数，得到切线斜率。" },
      { stepNo: 3, title: "写切线方程", content: "由点斜式：$y-1=2(x-1)$，化简得 $y=2x-1$。", explanation: "已知切点和斜率，用点斜式写出直线方程并化简。" },
    ],
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
// 补充错题（用于形成更完整的学习画像）
// ============================================
export const mockAdditionalWrongAnswers: WrongAnswer[] = [
  {
    id: "wa_004",
    userId: "u_001",
    questionId: "q_004",
    question: {
      id: "q_004",
      content: "求函数 f(x) = x³ - 3x² + 2 的单调递增区间。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "单调递增区间为 (0, 2)",
    correctAnswer: "单调递增区间为 (-∞, 0) 和 (2, +∞)",
    correctSolution: [
      { stepNo: 1, title: "求导", content: "$f'(x)=3x^2-6x=3x(x-2)$。", explanation: "先求导并因式分解，便于判断导数符号。" },
      { stepNo: 2, title: "解不等式", content: "令 $f'(x)>0$，即 $3x(x-2)>0$，解得 $x<0$ 或 $x>2$。", explanation: "二次不等式“大于取两边”，因此解集是两根之外。" },
      { stepNo: 3, title: "写出区间", content: "单调递增区间为 $(-\\infty,0)$ 和 $(2,+\\infty)$。", explanation: "导数大于零的区间就是函数单调递增的区间，多个区间之间用“和”连接。" },
    ],
    studentSteps: [
      { stepNo: 1, content: "f′(x) = 3x² - 6x", isError: false },
      { stepNo: 2, content: "令 f′(x) > 0，即 3x² - 6x > 0，约去 3 得 x² - 2x > 0", isError: false },
      { stepNo: 3, content: "解得 0 < x < 2", isError: true, errorHint: "解 x² - 2x > 0 时符号方向判断反了，应为 x < 0 或 x > 2" },
      { stepNo: 4, content: "所以单调递增区间为 (0, 2)", isError: true, errorHint: "把导数大于零的解集写反，导致单调区间完全颠倒" },
    ],
    errorTypeId: "et_2",
    errorType: errorTypes[1],
    errorAnalysis: "解一元二次不等式 x² - 2x > 0 时，将“两根之外”误判为“两根之间”，导致单调递增区间与正确答案完全相反。本质是对二次函数图像与不等式解集的关系理解不牢。",
    knowledgePointIds: ["kp_3"],
    knowledgePoints: [knowledgePoints[2]],
    relatedAbility: "逻辑推理能力",
    weakLevel: "needStrengthen",
    createTime: "2024-09-26 16:40:00",
    status: "completed",
  },
  {
    id: "wa_005",
    userId: "u_001",
    questionId: "q_005",
    question: {
      id: "q_005",
      content: "用长为 20m 的篱笆围成一个矩形菜园，求菜园面积的最大值。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "设长 x、宽 y，由 x + y = 20 得 S = xy ≤ 100，所以最大面积为 100 m²",
    correctAnswer: "2(x + y) = 20，即 x + y = 10，S = xy ≤ 25，最大面积为 25 m²",
    correctSolution: [
      { stepNo: 1, title: "设变量", content: "设矩形长为 $x$ m，宽为 $y$ m，则 $x>0$，$y>0$。", explanation: "先用字母表示未知量，并注明实际意义下的取值范围。" },
      { stepNo: 2, title: "建立约束", content: "篱笆总长为周长：$2(x+y)=20$，所以 $x+y=10$，即 $y=10-x$，其中 $0<x<10$。", explanation: "矩形有两条长和两条宽，注意不要把总长直接当成 $x+y$。" },
      { stepNo: 3, title: "建立面积函数", content: "$S=xy=x(10-x)=-x^2+10x$。", explanation: "把约束关系代入面积公式，化为一元函数。" },
      { stepNo: 4, title: "求最值", content: "$S'=10-2x$，令 $S'=0$ 得 $x=5$；此时 $y=5$，$S_{\\max}=25$。", explanation: "二次函数开口向下，顶点处取得最大值；也可用配方法 $S=-(x-5)^2+25$。" },
    ],
    studentSteps: [
      { stepNo: 1, content: "设矩形的长为 x m，宽为 y m", isError: false },
      { stepNo: 2, content: "由周长得 x + y = 20", isError: true, errorHint: "篱笆总长是周长，应为 2(x + y) = 20，即 x + y = 10" },
      { stepNo: 3, content: "S = xy ≤ ((x + y)/2)² = 100", isError: true, errorHint: "约束条件用错，代入的应是 x + y = 10" },
      { stepNo: 4, content: "最大面积为 100 m²", isError: true, errorHint: "正确结果为 25 m²" },
    ],
    errorTypeId: "et_4",
    errorType: errorTypes[3],
    errorAnalysis: "把“篱笆总长”直接当成“长与宽之和”，忽略了矩形有两条长和两条宽，导致约束条件少除以 2，最终面积放大了 4 倍。这是典型的建模错误。",
    knowledgePointIds: ["kp_5"],
    knowledgePoints: [knowledgePoints[4]],
    relatedAbility: "数学建模能力",
    weakLevel: "focus",
    createTime: "2024-09-25 09:20:00",
    status: "analyzed",
  },
  {
    id: "wa_006",
    userId: "u_001",
    questionId: "q_006",
    question: {
      id: "q_006",
      content: "求函数 y = x·e^x 的导数。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "y′ = e^x",
    correctAnswer: "y′ = (x + 1)e^x",
    correctSolution: [
      { stepNo: 1, title: "识别乘积结构", content: "令 $u=x$，$v=e^x$，则 $y=uv$。", explanation: "函数是两个函数的乘积，应使用乘积法则，不能只对其中一个因子求导。" },
      { stepNo: 2, title: "分别求导", content: "$u'=1$，$v'=e^x$。", explanation: "$x$ 的导数为 $1$，$e^x$ 的导数仍为 $e^x$。" },
      { stepNo: 3, title: "应用乘积法则", content: "$y'=u'v+uv'=1\\cdot e^x+x\\cdot e^x=(x+1)e^x$。", explanation: "乘积法则是 $(uv)'=u'v+uv'$，两项都不能漏。" },
    ],
    studentSteps: [
      { stepNo: 1, content: "识别函数为两个函数的乘积：u = x，v = e^x", isError: false },
      { stepNo: 2, content: "使用乘积法则，但只对 e^x 求导，得到 y′ = e^x", isError: true, errorHint: "乘积法则为 (uv)′ = u′v + uv′，不能只对其中一个因子求导" },
      { stepNo: 3, content: "所以 y′ = e^x", isError: true, errorHint: "正确结果为 y′ = 1·e^x + x·e^x = (x + 1)e^x" },
    ],
    errorTypeId: "et_5",
    errorType: errorTypes[4],
    errorAnalysis: "对乘积法则 (uv)′ = u′v + uv′ 记忆不完整，只保留了第二项，漏掉了 u′v 部分。说明公式处于“半记忆”状态，需要通过对比练习固化。",
    knowledgePointIds: ["kp_2"],
    knowledgePoints: [knowledgePoints[1]],
    relatedAbility: "代数运算能力",
    weakLevel: "focus",
    createTime: "2024-09-24 19:05:00",
    status: "analyzed",
  },
  {
    id: "wa_007",
    userId: "u_001",
    questionId: "q_007",
    question: {
      id: "q_007",
      content: "函数 f(x) = x³ 在 x = 0 处是否取得极值？请说明理由。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "因为 f′(0) = 0，所以 x = 0 是 f(x) 的极值点",
    correctAnswer: "不是极值点。f′(x) = 3x² ≥ 0，f(x) 在 R 上单调递增，x = 0 两侧函数值大小关系不变",
    correctSolution: [
      { stepNo: 1, title: "求导", content: "$f'(x)=3x^2$。", explanation: "先求导，准备用导数符号研究单调性。" },
      { stepNo: 2, title: "分析导数符号", content: "对任意 $x\\in\\mathbb{R}$，$f'(x)=3x^2\\ge 0$，且仅在 $x=0$ 处等于 $0$。", explanation: "导数非负且只在一点为零，说明函数在整个定义域上单调递增。" },
      { stepNo: 3, title: "判断极值", content: "因为 $f'(x)$ 在 $x=0$ 两侧没有变号，所以 $x=0$ 不是极值点。", explanation: "$f'(x_0)=0$ 只是极值点的必要条件；还需导数在 $x_0$ 两侧变号，才能判定为极值点。" },
    ],
    studentSteps: [
      { stepNo: 1, content: "求导：f′(x) = 3x²", isError: false },
      { stepNo: 2, content: "令 f′(x) = 0，得 x = 0", isError: false },
      { stepNo: 3, content: "由 f′(0) = 0 直接判定 x = 0 为极值点", isError: true, errorHint: "f′(x₀) = 0 只是极值点的必要条件，还需判断 x₀ 两侧导数是否变号" },
    ],
    errorTypeId: "et_2",
    errorType: errorTypes[1],
    errorAnalysis: "把“导数为零”当成了“极值点”的充分条件。极值点还要求导数在该点两侧变号；f(x) = x³ 在 x = 0 处导数不变号，因此不是极值点。",
    knowledgePointIds: ["kp_4"],
    knowledgePoints: [knowledgePoints[3]],
    relatedAbility: "逻辑推理能力",
    weakLevel: "needStrengthen",
    createTime: "2024-09-23 11:10:00",
    status: "inProject",
  },
  {
    id: "wa_008",
    userId: "u_001",
    questionId: "q_008",
    question: {
      id: "q_008",
      content: "求曲线 y = x³ - 2x 在点 P(1, -1) 处的切线方程。",
      subject: "数学",
      grade: "高二",
    },
    studentAnswer: "y′ = 3x² - 2，k = 1，所以切线方程为 y = x - 1",
    correctAnswer: "y = x - 2",
    correctSolution: [
      { stepNo: 1, title: "求导", content: "$y'=3x^2-2$。", explanation: "曲线在某点处的切线斜率等于导函数在该点的值。" },
      { stepNo: 2, title: "求斜率", content: "在 $P(1,-1)$ 处，$k=y'|_{x=1}=3-2=1$。", explanation: "把切点横坐标代入导函数，得到切线斜率。" },
      { stepNo: 3, title: "写切线方程", content: "由点斜式：$y-(-1)=1\\cdot(x-1)$，化简得 $y=x-2$。", explanation: "注意切点纵坐标是 $-1$，代入点斜式时不要漏掉负号。" },
    ],
    studentSteps: [
      { stepNo: 1, content: "求导：y′ = 3x² - 2", isError: false },
      { stepNo: 2, content: "切线斜率 k = y′|ₓ₌₁ = 1", isError: false },
      { stepNo: 3, content: "由点斜式得 y - 1 = 1·(x - 1)", isError: true, errorHint: "切点纵坐标是 -1，点斜式应为 y - (-1) = 1·(x - 1)" },
      { stepNo: 4, content: "化简得 y = x - 1", isError: true, errorHint: "正确化简结果为 y = x - 2" },
    ],
    errorTypeId: "et_1",
    errorType: errorTypes[0],
    errorAnalysis: "求导与斜率计算都正确，但在代入点斜式时把切点纵坐标 -1 误写为 1，属于典型的符号代入失误。建议在代入前先把切点坐标完整写出。",
    knowledgePointIds: ["kp_1"],
    knowledgePoints: [knowledgePoints[0]],
    relatedAbility: "代数运算能力",
    weakLevel: "needStrengthen",
    createTime: "2024-09-22 08:30:00",
    status: "completed",
  },
];

export const mockAllWrongAnswers: WrongAnswer[] = [
  ...mockRecentWrongAnswers,
  ...mockAdditionalWrongAnswers,
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
