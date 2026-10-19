// ============================================
// 学习评价生成服务（AI）
//
// 有 Key：调用 Qwen 从项目+学生答案生成结构化评价
// 无 Key：返回 Mock 评价
// ============================================

import { qwenChat, extractText } from "./qwen";
import { AI_CONFIG, hasRealAIKey } from "./config";
import type { Evaluation, EvaluationRequest } from "@/types";

interface EvalJsonResult {
  dimension_scores: { dimension_name: string; score: number; description: string }[];
  mastered_contents: string[];
  weak_contents: string[];
  suggestions: string[];
  growth_path: { stage: string; content: string }[];
}

const DIMENSIONS = ["知识理解", "解题过程", "数学表达", "推理能力", "建模能力", "知识迁移"];

export async function generateEvaluation(
  projectId: string,
  req: EvaluationRequest
): Promise<Evaluation> {
  if (hasRealAIKey()) {
    return generateWithAI(projectId, req);
  }
  return generateWithMock(projectId);
}

async function generateWithAI(
  projectId: string,
  req: EvaluationRequest
): Promise<Evaluation> {
  const { answers } = req;

  const systemPrompt = `你是一位资深高中数学教师，擅长对学生的项目式学习表现进行多维度评价。

【LaTeX 格式要求】评语中的数学公式必须用 LaTeX 格式：
- 行内公式用 $...$ 包裹（如 $f'(x) = 3x^2 - 6x$）
- 独立大公式用 $$...$$ 单独成行
- 分式 \\frac、根式 \\sqrt、上标 x^2、下标 x_1、积分 \\int、求和 \\sum
- 中文说明文字不要放入 $ 分隔符内

背景：学生刚刚完成了一个"利用导数求最值"的数学项目，回答了5个问题。请根据他的回答，从以下6个维度打分（每项0-100分）并给出详细评语：
1. 知识理解：对相关概念和原理的掌握程度
2. 解题过程：步骤的规范性和逻辑性
3. 数学表达：数学语言使用的准确性和严谨性
4. 推理能力：逻辑链条的完整性和严密性
5. 建模能力：从实际问题到数学模型的转化能力
6. 知识迁移：将所学知识应用到新情境的能力

同时给出：已掌握的知识点、薄弱环节、改进建议、成长路径（3-5条）

输出要求：只输出一个 JSON 对象。`;

  const userMessage = `【项目名称】易拉罐优化设计——利用导数求最值项目

【学生对5个问题的回答】
${answers.map((a, i) => `问题${i + 1}：${a}`).join("\n\n")}

请给出完整的学习评价。`;

  const response = await qwenChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: AI_CONFIG.model,
      temperature: 0.4,
      responseFormat: "json_object",
      maxTokens: 1500,
    }
  );

  const raw = extractText(response);
  const parsed = safeParseJson<EvalJsonResult>(raw);

  const dimScores = parsed.dimension_scores?.map((d) => ({
    dimensionName: d.dimension_name,
    score: clampScore(d.score),
    description: d.description,
  })) ?? defaultDimensionScores();

  // 确保6个维度都有
  const finalDimScores = ensureAllDimensions(dimScores);

  return {
    id: "eval_" + Date.now(),
    userId: "u_001",
    projectId,
    dimensionScores: finalDimScores,
    masteredContents:
      parsed.mastered_contents?.slice(0, 6) ?? defaultMastered(),
    weakContents: parsed.weak_contents?.slice(0, 5) ?? defaultWeak(),
    suggestions: parsed.suggestions?.slice(0, 5) ?? defaultSuggestions(),
    growthPath: parsed.growth_path?.slice(0, 5) ?? defaultGrowthPath(),
    createTime: new Date().toISOString(),
  };
}

function generateWithMock(projectId: string): Evaluation {
  return {
    id: "eval_" + Date.now(),
    userId: "u_001",
    projectId,
    dimensionScores: [
      { dimensionName: "知识理解", score: 82, description: "能够准确理解导数的基本概念和几何意义。" },
      { dimensionName: "解题过程", score: 78, description: "解题步骤较为清晰，求导与解方程的环节衔接可以更紧密。" },
      { dimensionName: "数学表达", score: 75, description: "数学语言使用基本规范，符号表达有待加强。" },
      { dimensionName: "推理能力", score: 80, description: "能够从已知条件出发进行合理推理，逻辑链条完整。" },
      { dimensionName: "建模能力", score: 76, description: "能将实际问题转化为函数模型，变量设定合理。" },
      { dimensionName: "知识迁移", score: 72, description: "能将课堂知识迁移到实际情境中，应用意识较好。" },
    ],
    masteredContents: [
      "能够正确求出常见幂函数的导数",
      "掌握了利用导数判断单调性和求最值的方法",
      "能从实际情境中提取数学信息",
      "理解了导数在优化问题中的应用",
    ],
    weakContents: [
      "面对实际情境时，对变量之间约束关系的识别仍需加强",
      "在建立函数关系式时，对自变量取值范围的考虑不够充分",
      "数学表达的规范性有待提升，部分步骤的书写可以更严谨",
    ],
    suggestions: [
      "建议多练习从实际问题中建立函数模型的题目，强化变量关系的分析能力。",
      "在解题时注意明确写出自变量的取值范围，培养严谨的数学思维。",
      "可以尝试用多种方法解决同一问题，比较不同建模思路的优劣。",
    ],
    growthPath: [
      { stage: "原始错题", content: "幂函数求导时漏乘指数，导致导数计算错误" },
      { stage: "项目学习", content: "通过易拉罐优化设计项目，练习了导数建模与利用导数求最值" },
      { stage: "最终表现", content: "能独立完成函数建模，用导数求出最值并解释结果的实际意义" },
    ],
    createTime: new Date().toISOString(),
  };
}

function clampScore(v: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 75;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function ensureAllDimensions(
  scores: Evaluation["dimensionScores"]
): Evaluation["dimensionScores"] {
  const result = [...scores];
  for (const dim of DIMENSIONS) {
    if (!result.find((s) => s.dimensionName === dim)) {
      result.push({
        dimensionName: dim,
        score: 75,
        description: "待补充评价",
      });
    }
  }
  return result.slice(0, 6);
}

function defaultDimensionScores() {
  return DIMENSIONS.map((d) => ({
    dimensionName: d,
    score: 75,
    description: "评价已生成，具体描述待完善",
  }));
}
function defaultMastered() {
  return ["能够正确运用导数解决基本问题", "理解了导数的几何意义"];
}
function defaultWeak() {
  return ["在复杂情境下建模能力有待加强"];
}
function defaultSuggestions() {
  return ["建议多做变式练习，巩固知识迁移能力"];
}
function defaultGrowthPath() {
  return [
    { stage: "初始状态", content: "存在基础概念错误" },
    { stage: "项目学习中", content: "逐步纠正并掌握方法" },
    { stage: "最终表现", content: "能够独立解决相关问题" },
  ];
}

function safeParseJson<T>(raw: string): T {
  try {
    let text = raw.trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("no json");
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    console.warn("[evaluationGenerator] JSON 解析失败，使用默认值");
    return {} as T;
  }
}
