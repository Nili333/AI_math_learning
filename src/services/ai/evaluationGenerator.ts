// ============================================
// 学习评价生成服务（AI）
//
// 有 Key：调用 Qwen 从项目+学生答案生成结构化评价
// 无 Key：返回 Mock 评价
// ============================================

import { qwenChat, extractText } from "./qwen";
import { AI_CONFIG, hasRealAIKey } from "./config";
import type { Evaluation, EvaluationRequest, Project } from "@/types";

const DIMENSIONS = ["知识理解", "解题过程", "数学表达", "推理能力", "建模能力", "知识迁移"];

export async function generateEvaluation(
  projectId: string,
  req: EvaluationRequest,
  project?: Project | null
): Promise<Evaluation> {
  if (hasRealAIKey()) {
    try {
      return await generateWithAI(projectId, req, project ?? null);
    } catch (err) {
      console.error(
        "[evaluationGenerator] AI 评价失败，降级为本地评价：",
        err instanceof Error ? err.message : err
      );
    }
  }
  return generateWithMock(projectId, project ?? null);
}

async function generateWithAI(
  projectId: string,
  req: EvaluationRequest,
  project: Project | null
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

【输出要求】只输出一个 JSON 对象，不要输出任何其他文字，字段名必须完全一致：
{
  "dimension_scores": [
    {"dimension_name": "知识理解", "score": 0, "description": "..."},
    {"dimension_name": "解题过程", "score": 0, "description": "..."},
    {"dimension_name": "数学表达", "score": 0, "description": "..."},
    {"dimension_name": "推理能力", "score": 0, "description": "..."},
    {"dimension_name": "建模能力", "score": 0, "description": "..."},
    {"dimension_name": "知识迁移", "score": 0, "description": "..."}
  ],
  "mastered_contents": ["已掌握内容1", "已掌握内容2"],
  "weak_contents": ["仍需加强1", "仍需加强2"],
  "suggestions": ["学习建议1", "学习建议2"],
  "growth_path": [
    {"stage": "原始错题", "content": "..."},
    {"stage": "项目学习", "content": "..."},
    {"stage": "最终表现", "content": "..."}
  ]
}`;

  const taskContext = project
    ? project.tasks
        .map(
          (task) =>
            `- 任务${task.taskNo}《${task.title}》：${
              task.status === "completed" ? "已完成" : "未完成"
            }${task.studentAnswer ? `；学生最终作答：${task.studentAnswer}` : ""}`
        )
        .join("\n")
    : "（无任务记录）";

  const userMessage = `【项目名称】${project?.name ?? "利用导数求最值的项目式学习"}

【项目背景】${project?.background ?? "通过真实情境练习导数建模与最值求解"}

【学生项目任务完成情况】
${taskContext}

【学生对5个反思问题的回答】
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
      maxTokens: 3200,
    }
  );

  const raw = extractText(response);
  const normalized = normalizeEvalJson(raw);

  return {
    id: "eval_" + Date.now(),
    userId: "u_001",
    projectId,
    dimensionScores: ensureAllDimensions(normalized.dimensionScores),
    masteredContents: normalized.masteredContents,
    weakContents: normalized.weakContents,
    suggestions: normalized.suggestions,
    growthPath: normalized.growthPath,
    createTime: new Date().toISOString(),
  };
}

// 模型有时会使用中文键名或不同的嵌套结构，这里做兼容归一化
function normalizeEvalJson(raw: string): {
  dimensionScores: Evaluation["dimensionScores"];
  masteredContents: string[];
  weakContents: string[];
  suggestions: string[];
  growthPath: Evaluation["growthPath"];
} {
  const parsed = safeParseJson<Record<string, unknown>>(raw);
  const dimensionScores = extractDimensionScores(parsed);

  const mastered = extractStringList(parsed, [
    "mastered_contents",
    "已掌握内容",
    "已掌握知识点",
    "掌握内容",
    "已掌握",
  ]);
  const weak = extractStringList(parsed, [
    "weak_contents",
    "仍需加强",
    "薄弱环节",
    "待提升内容",
    "薄弱内容",
  ]);
  const suggestions = extractStringList(parsed, [
    "suggestions",
    "改进建议",
    "学习建议",
    "建议",
  ]);
  const growthPath = extractGrowthPath(parsed);

  if (dimensionScores.length === 0) {
    console.warn(
      "[evaluationGenerator] 未能解析维度分数，原始返回：",
      raw.slice(0, 500)
    );
  }

  return {
    dimensionScores:
      dimensionScores.length > 0 ? dimensionScores : defaultDimensionScores(),
    masteredContents: mastered.length > 0 ? mastered.slice(0, 6) : defaultMastered(),
    weakContents: weak.length > 0 ? weak.slice(0, 5) : defaultWeak(),
    suggestions: suggestions.length > 0 ? suggestions.slice(0, 5) : defaultSuggestions(),
    growthPath: growthPath.length > 0 ? growthPath.slice(0, 5) : defaultGrowthPath(),
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function extractDimensionScores(
  record: Record<string, unknown>
): Evaluation["dimensionScores"] {
  const candidate = pick(record, [
    "dimension_scores",
    "评价维度得分",
    "维度得分",
    "dimensions",
    "dimensionScores",
  ]);

  const result: Evaluation["dimensionScores"] = [];

  // 形式一：[{ dimension_name, score, description }]
  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const dim = toRecord(item);
      if (!dim) continue;
      const name = pick(dim, [
        "dimension_name",
        "dimensionName",
        "name",
        "维度",
        "维度名称",
      ]);
      const score = pick(dim, ["score", "得分", "分数"]);
      if (typeof name !== "string") continue;
      result.push({
        dimensionName: canonicalDimension(name),
        score: clampScore(typeof score === "number" ? score : Number(score)),
        description:
          typeof (dim.description ?? dim["描述"] ?? dim["评语"]) === "string"
            ? String(dim.description ?? dim["描述"] ?? dim["评语"])
            : "该维度表现稳定，可结合具体作答进一步分析。",
      });
    }
  }

  // 形式二：{ "知识理解": 95, "解题过程": 90, ... }
  if (result.length === 0 && candidate) {
    const dimMap = toRecord(candidate);
    if (dimMap) {
      for (const [name, value] of Object.entries(dimMap)) {
        const valueRecord = toRecord(value);
        const rawScore = valueRecord
          ? pick(valueRecord, ["score", "得分", "分数"])
          : value;
        result.push({
          dimensionName: canonicalDimension(name),
          score: clampScore(
            typeof rawScore === "number" ? rawScore : Number(rawScore)
          ),
          description:
            valueRecord && typeof pick(valueRecord, ["description", "描述", "评语"]) === "string"
              ? String(pick(valueRecord, ["description", "描述", "评语"]))
              : "该维度表现稳定，可结合具体作答进一步分析。",
        });
      }
    }
  }

  return result;
}

function extractStringList(
  record: Record<string, unknown>,
  keys: string[]
): string[] {
  const value = pick(record, keys);
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|；|;/)
      .map((item) => item.replace(/^[-•\d.\s]+/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function extractGrowthPath(
  record: Record<string, unknown>
): Evaluation["growthPath"] {
  const value = pick(record, ["growth_path", "成长路径", "学习成长路径"]);
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const entry = toRecord(item);
      if (!entry) return null;
      const stage = pick(entry, ["stage", "阶段", "title", "名称"]);
      const content = pick(entry, ["content", "内容", "说明", "description"]);
      if (typeof stage !== "string" || typeof content !== "string") return null;
      return { stage, content };
    })
    .filter((item): item is { stage: string; content: string } => Boolean(item));
}

function generateWithMock(
  projectId: string,
  project: Project | null
): Evaluation {
  const taskTotal = project?.tasks.length ?? 5;
  const taskDone = project?.tasks.filter((task) => task.status === "completed").length ?? 5;
  const completionRatio = taskTotal > 0 ? taskDone / taskTotal : 1;
  const baseBoost = Math.round((completionRatio - 0.6) * 10);

  return {
    id: "eval_" + Date.now(),
    userId: "u_001",
    projectId,
    dimensionScores: [
      { dimensionName: "知识理解", score: clampScore(82 + baseBoost), description: "能够准确理解导数的基本概念和几何意义。" },
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
      `完成了《${project?.name ?? "项目学习"}》中的 ${taskDone}/${taskTotal} 个任务`,
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
      {
        stage: "原始错题",
        content: project
          ? `在「${project.sourceTextbookQuestion.content.slice(0, 42)}…」相关练习中出现错误`
          : "幂函数求导时漏乘指数，导致导数计算错误",
      },
      {
        stage: "项目学习",
        content: `通过《${project?.name ?? "导数求最值"}》项目，完成了 ${taskDone} 个任务，练习了建模与导数求最值`,
      },
      { stage: "最终表现", content: "能独立完成函数建模，用导数求出最值并解释结果的实际意义" },
    ],
    createTime: new Date().toISOString(),
  };
}

function clampScore(v: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 75;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function canonicalDimension(name: string | undefined): string {
  const value = (name ?? "").trim();
  if (!value) return "知识理解";
  return (
    DIMENSIONS.find((dim) => value.includes(dim) || dim.includes(value)) ?? value
  );
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
