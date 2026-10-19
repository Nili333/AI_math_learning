// ============================================
// 错题智能分析服务（AI）
//
// 有 Key：调用 Qwen 进行结构化错因诊断
// 无 Key：返回 Mock 分析结果
// ============================================

import { qwenChat, extractText } from "./qwen";
import { AI_CONFIG, hasRealAIKey } from "./config";
import type { AnalyzeRequest, WrongAnswer } from "@/types";
import { errorTypes, knowledgePoints } from "@/mock";

// 解析 AI 返回的 JSON → 构造 WrongAnswer 对象
interface AnalyzeJsonResult {
  error_type: string; // 运算错误 | 概念错误 | 审题错误 | 建模错误 | 公式使用错误 | 推理错误 | 其他
  error_analysis: string;
  knowledge_point_ids: string[]; // 知识点ID，如 ["kp_2"]
  related_ability: string; // 相关能力，如 代数运算能力
  weak_level: "normal" | "needStrengthen" | "focus";
  student_steps: { step_no: number; content: string; is_error: boolean; error_hint?: string }[];
}

export async function analyzeWrongAnswer(
  req: AnalyzeRequest
): Promise<WrongAnswer> {
  if (hasRealAIKey()) {
    return analyzeWithAI(req);
  }
  return analyzeWithMock(req);
}

async function analyzeWithAI(req: AnalyzeRequest): Promise<WrongAnswer> {
  const { questionContent, studentAnswer, correctAnswer } = req;

  const systemPrompt = `你是一位资深高中数学教研员，专门分析学生错题并给出结构化诊断。

【LaTeX 格式要求】所有数学公式必须用 LaTeX 格式表达：
- 行内公式（如 $y = 3x^2$）用 $...$ 包裹
- 独立的大公式用 $$...$$ 单独成行包裹
- 常用：分式 \\frac{a}{b}、根式 \\sqrt{x}、上标 x^2、下标 x_1、希腊字母 \\alpha \\beta
- 中文说明文字不要放入 $ 分隔符内

你的任务：阅读题目、学生答案和正确答案，精准定位错因并给出分步骤的错误分析。

可用错因类型（选其一）：运算错误、概念错误、审题错误、建模错误、公式使用错误、推理错误、表征转换错误、其他
可用知识点ID（从以下列表中选择）：
- kp_1 导数的概念与几何意义
- kp_2 导数的运算
- kp_3 利用导数研究函数的单调性
- kp_4 函数的极值与最值
- kp_5 导数在实际问题中的应用

输出要求：只输出一个 JSON 对象，结构如下：
{
  "error_type": "错因类型",
  "error_analysis": "用100-200字分析该错误的本质原因，说明学生在哪一步的思维或操作出现了偏差",
  "knowledge_point_ids": ["kp_2"],
  "related_ability": "如：代数运算能力 / 逻辑推理能力 / 数学建模能力 / 数学表达能力",
  "weak_level": "normal | needStrengthen | focus",
  "student_steps": [
    {"step_no": 1, "content": "步骤内容", "is_error": false, "error_hint": ""},
    {"step_no": 2, "content": "步骤内容", "is_error": true, "error_hint": "此处出现...错误，注意..."}
  ]
}`;

  const userMessage = `【题目】${questionContent}
${correctAnswer ? `【正确答案】${correctAnswer}` : ""}
【学生答案】${studentAnswer}

请分析这道错题。`;

  const response = await qwenChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: AI_CONFIG.model,
      temperature: 0.3,
      responseFormat: "json_object",
      maxTokens: 1200,
    }
  );

  const raw = extractText(response);
  const parsed = safeParseJson<AnalyzeJsonResult>(raw);

  const questionId = "q_" + Date.now();
  const waId = "wa_" + Date.now();

  // 查找匹配的 errorType
  const matchedErrorType =
    errorTypes.find((et) => et.name.includes(parsed.error_type) || parsed.error_type.includes(et.name)) ??
    errorTypes[0];

  // 查找匹配的知识点
  const kpIds = parsed.knowledge_point_ids?.filter((id) =>
    knowledgePoints.some((kp) => kp.id === id)
  ) ?? [];
  const matchedKps = kpIds.length
    ? knowledgePoints.filter((kp) => kpIds.includes(kp.id))
    : [knowledgePoints[0]];

  const steps = parsed.student_steps?.map((s) => ({
    stepNo: s.step_no,
    content: s.content,
    isError: s.is_error,
    errorHint: s.error_hint || undefined,
  })) ?? [
    { stepNo: 1, content: "阅读题目，理解题意", isError: false },
    { stepNo: 2, content: "列式计算" + studentAnswer, isError: true, errorHint: parsed.error_analysis },
    { stepNo: 3, content: "得出结果", isError: false },
  ];

  return {
    id: waId,
    userId: "u_001",
    questionId,
    question: {
      id: questionId,
      content: questionContent,
      subject: "数学",
      grade: "高二",
    },
    studentAnswer,
    correctAnswer: correctAnswer || undefined,
    studentSteps: steps,
    errorTypeId: matchedErrorType.id,
    errorType: matchedErrorType,
    errorAnalysis: parsed.error_analysis || "模型未能给出有效分析",
    knowledgePointIds: matchedKps.map((kp) => kp.id),
    knowledgePoints: matchedKps,
    relatedAbility: parsed.related_ability || "数学运算能力",
    weakLevel: parsed.weak_level || "needStrengthen",
    createTime: new Date().toLocaleString("zh-CN"),
    status: "analyzed",
  };
}

function analyzeWithMock(req: AnalyzeRequest): WrongAnswer {
  const { questionContent, studentAnswer, correctAnswer } = req;

  let errorType = errorTypes[0];
  let errorAnalysis = "在计算过程中出现运算失误，建议仔细检查每一步的符号和数值。";

  if (/函数|建模|关系/.test(questionContent)) {
    errorType = errorTypes[3];
    errorAnalysis = "在建立数学模型时对变量关系的理解存在偏差，未能准确将实际问题转化为数学表达式。";
  } else if (/概念|定义|性质/.test(questionContent)) {
    errorType = errorTypes[1];
    errorAnalysis = "对相关数学概念的理解不够准确，导致解题思路出现偏差。";
  }

  const questionId = "q_" + Date.now();

  return {
    id: "wa_" + Date.now(),
    userId: "u_001",
    questionId,
    question: {
      id: questionId,
      content: questionContent,
      subject: "数学",
      grade: "高二",
    },
    studentAnswer,
    correctAnswer: correctAnswer || undefined,
    studentSteps: [
      { stepNo: 1, content: "阅读题目，理解题意", isError: false },
      {
        stepNo: 2,
        content: "列式计算：" + studentAnswer,
        isError: true,
        errorHint: "此处计算过程出现错误，注意检查符号和运算顺序",
      },
      { stepNo: 3, content: "得出结果", isError: false },
    ],
    errorTypeId: errorType.id,
    errorType,
    errorAnalysis,
    knowledgePointIds: ["kp_1"],
    knowledgePoints: [knowledgePoints[0]],
    relatedAbility: "代数运算能力",
    weakLevel: "focus",
    createTime: new Date().toLocaleString("zh-CN"),
    status: "analyzed",
  };
}

// 稳健 JSON 解析
function safeParseJson<T>(raw: string): T {
  try {
    let text = raw.trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("no json");
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    console.warn("[wrongAnswerAnalyzer] JSON 解析失败，使用默认值");
    return {} as T;
  }
}
