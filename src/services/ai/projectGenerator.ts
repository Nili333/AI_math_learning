// ============================================
// 学习项目生成服务（AI）
//
// 有 Key：根据错题 + 选定教材母题，生成一整套
//        项目背景、学习目标与 5 个递进任务（含检查点、提示）
// 无 Key 或 AI 失败：返回内置的易拉罐优化项目模板
// ============================================

import { qwenChat, extractText } from "./qwen";
import { AI_CONFIG, hasRealAIKey } from "./config";
import type { WrongAnswer, Project, TextbookQuestion } from "@/types";
import {
  generateMockProject,
  knowledgePoints,
  mockTextbookQuestions,
} from "@/mock";
import {
  buildInitialTasks,
} from "@/services/projectTaskState";
import type { TaskBlueprintDef } from "@/services/projectBlueprint";

interface ProjectTaskJson {
  title: string;
  description: string;
  objective: string;
  completion_criteria: string[];
  checkpoints: {
    question: string;
    accept_keywords: string[];
    hints: string[];
  }[];
}

interface ProjectJsonResult {
  project_name: string;
  project_background: string;
  learning_objectives: string[];
  source_textbook_question?: {
    content?: string;
    knowledge_point?: string;
    relevance?: string;
  };
  tasks: ProjectTaskJson[];
}

const TASK_FALLBACK_TITLES = [
  "分析问题",
  "寻找已知条件",
  "建立数学关系",
  "解决问题",
  "解释最终方案",
];

const HINT_FALLBACKS = [
  "先回到题目，把已知条件逐条写下来，看看哪个条件还没有用上。",
  "想一想这个问题涉及哪个数学公式，它把哪些量联系在了一起。",
  "把关键关系写成等式，再尝试用题目中的已知量表示未知量。",
  "检查你的式子是否满足题目条件，并说明每一步变形依据。",
];

export async function generateProjectFromWrongAnswer(
  wrongAnswerId: string,
  wrongAnswer?: WrongAnswer,
  sourceTextbookQuestion?: TextbookQuestion
): Promise<Project> {
  if (hasRealAIKey() && wrongAnswer) {
    try {
      return await generateWithAI(
        wrongAnswerId,
        wrongAnswer,
        sourceTextbookQuestion
      );
    } catch (err) {
      console.error(
        "[projectGenerator] AI 生成失败，降级为模板项目：",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Mock 模式：使用模板，并优先采用调用方选定的教材母题
  const matched =
    sourceTextbookQuestion ??
    mockTextbookQuestions.find((q) =>
      wrongAnswer?.knowledgePointIds?.includes(q.knowledgePointId)
    ) ??
    mockTextbookQuestions[1];

  const project = generateMockProject(wrongAnswerId, matched);
  if (wrongAnswer) {
    project.name = `突破「${wrongAnswer.errorType?.name ?? "导数"}」——${matched.knowledgePoint.name}项目`;
    project.background = `在最近一次练习中，你在「${wrongAnswer.question.content}」这道题上出现了${wrongAnswer.errorType?.name ?? "错误"}。本项目以教材母题「${matched.content}」为锚点，帮助你在真实情境中重新理解相关概念，并用导数解决一个完整的优化问题。`;
  }
  return project;
}

async function generateWithAI(
  wrongAnswerId: string,
  wrongAnswer: WrongAnswer,
  sourceTextbookQuestion?: TextbookQuestion
): Promise<Project> {
  const { question, studentAnswer, correctAnswer, errorAnalysis, errorType } =
    wrongAnswer;

  const sourceTq =
    sourceTextbookQuestion ??
    mockTextbookQuestions.find((q) =>
      wrongAnswer.knowledgePointIds.includes(q.knowledgePointId)
    ) ??
    mockTextbookQuestions[1];

  const systemPrompt = `你是一位高中数学课程设计专家，擅长根据学生错题设计完整的"项目式学习"方案。

【LaTeX 格式要求】项目描述、任务说明和提示中的数学公式必须用 LaTeX：
- 行内公式用 $...$ 包裹（如 $y = x^3 - 3x^2 + 2$）
- 独立大公式用 $$...$$ 单独成行
- 中文说明文字不要放入 $ 分隔符内

【设计要求】
1. 项目必须围绕一个真实或拟真的问题情境展开，让学生自然用到目标知识点。
2. 项目必须拆成 5 个递进任务，顺序固定为：
   任务1 分析问题 → 任务2 寻找已知条件 → 任务3 建立数学关系 → 任务4 解决问题 → 任务5 解释最终方案。
3. 每个任务需要：
   - title：不超过 10 个字
   - description：一句话说明学生要做什么
   - objective：可观察、可判断的任务目标
   - completion_criteria：2~3 条完成标准（学生必须真正达到）
   - checkpoints：2~4 个循序渐进的引导问题，每个问题包含：
     * question：导师向学生提出的问题
     * accept_keywords：4~10 个能说明学生回答正确的关键词（用于离线 Mock 判定，必须贴题）
     * hints：恰好 4 条逐级加强的提示（Level 1 启发 → Level 4 具体示范，但不要直接给出最终答案）
4. 任务4必须包含完整的导数求最值过程；任务5必须解释结果的实际意义。
5. 题目中的数值、函数关系必须自洽、正确；提示中不要出现错误计算。

【输出格式】只输出一个 JSON 对象，不要任何其他文字：
{
  "project_name": "不超过20字，有情境感",
  "project_background": "150-260字，说明为什么要做这个项目、它和学生错题的关系",
  "learning_objectives": ["2~4条"],
  "source_textbook_question": {
    "content": "教材母题内容",
    "knowledge_point": "知识点名称",
    "relevance": "与错题的关联"
  },
  "tasks": [
    {
      "title": "任务标题",
      "description": "任务说明",
      "objective": "任务目标",
      "completion_criteria": ["标准1", "标准2"],
      "checkpoints": [
        {
          "question": "引导问题",
          "accept_keywords": ["关键词1", "关键词2"],
          "hints": ["提示1", "提示2", "提示3", "提示4"]
        }
      ]
    }
  ]
}`;

  const userMessage = `【学生错题】
- 题目：${question.content}
- 学生答案：${studentAnswer}
${correctAnswer ? `- 正确答案：${correctAnswer}` : ""}
- 错因类型：${errorType?.name ?? "未知"}
- 错因分析：${errorAnalysis}
${
  wrongAnswer.correctSolution?.length
    ? `- 参考解答：\n${wrongAnswer.correctSolution
        .map((step) => `${step.stepNo}. ${step.title}：${step.content}`)
        .join("\n")}`
    : ""
}

【本轮选定的教材母题】
- 内容：${sourceTq.content}
- 知识点：${sourceTq.knowledgePoint.name}
- 教材：${sourceTq.textbookVersion} · ${sourceTq.chapter}

请围绕这道教材母题设计一个 5 任务的完整项目，项目情境可以生活化，但数学内容必须与母题和目标知识点一致。`;

  const response = await qwenChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: AI_CONFIG.model,
      temperature: 0.4,
      responseFormat: "json_object",
      maxTokens: 4096,
    }
  );

  const raw = extractText(response);
  const parsed = safeParseJson<ProjectJsonResult>(raw);

  const tasks = parsed.tasks;
  if (!Array.isArray(tasks) || tasks.length !== 5) {
    throw new Error("AI 返回的任务数量不是 5 个");
  }

  const blueprints: TaskBlueprintDef[] = tasks.map((task, index) => {
    const taskNo = index + 1;
    const checkpoints = Array.isArray(task.checkpoints)
      ? task.checkpoints
          .filter((item) => item && typeof item.question === "string" && item.question.trim())
          .slice(0, 5)
          .map((item, checkpointIndex) => ({
            question: item.question.trim(),
            acceptKeywords: Array.isArray(item.accept_keywords)
              ? item.accept_keywords
                  .filter((kw): kw is string => typeof kw === "string" && kw.trim().length > 0)
                  .slice(0, 12)
              : [],
            hints: normalizeHints(item.hints, `${taskNo}-${checkpointIndex}`),
          }))
      : [];

    if (checkpoints.length === 0) {
      throw new Error(`任务${taskNo}没有有效检查点`);
    }

    return {
      taskNo,
      title:
        typeof task.title === "string" && task.title.trim()
          ? task.title.trim().slice(0, 20)
          : TASK_FALLBACK_TITLES[index],
      description:
        typeof task.description === "string" && task.description.trim()
          ? task.description.trim()
          : "在导师引导下完成本任务。",
      objective:
        typeof task.objective === "string" && task.objective.trim()
          ? task.objective.trim()
          : "能够独立思考并解决当前问题。",
      completionCriteria:
        Array.isArray(task.completion_criteria) && task.completion_criteria.length > 0
          ? task.completion_criteria
              .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
              .slice(0, 4)
          : ["能够用自己的话解释本任务的结论"],
      checkpoints,
    };
  });

  // 若 AI 没有给出教材母题信息，优先使用调用方选定的母题
  const aiSource = parsed.source_textbook_question;
  const matchedKp =
    knowledgePoints.find((kp) => kp.name === aiSource?.knowledge_point) ??
    sourceTq.knowledgePoint;
  const projectSource: TextbookQuestion =
    sourceTextbookQuestion ??
    (aiSource?.content && aiSource.content.trim().length > 5
      ? {
          id: `tq_ai_${Date.now()}`,
          content: aiSource.content.trim(),
          textbookVersion: sourceTq.textbookVersion,
          grade: sourceTq.grade,
          chapter: sourceTq.chapter,
          knowledgePointId: matchedKp.id,
          knowledgePoint: matchedKp,
          difficulty: sourceTq.difficulty,
          relevance: aiSource.relevance || sourceTq.relevance,
        }
      : sourceTq);

  const projectId = `proj_${wrongAnswerId}`;
  const projectTasks = buildInitialTasks(projectId, blueprints);
  projectTasks[0].status = "inProgress";

  return {
    id: projectId,
    name: parsed.project_name?.trim() || "导数优化应用项目",
    background:
      parsed.project_background?.trim() ||
      "通过一个真实情境，把错题中暴露的薄弱点转化为可操作的数学任务。",
    learningObjectives:
      Array.isArray(parsed.learning_objectives) && parsed.learning_objectives.length > 0
        ? parsed.learning_objectives
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .slice(0, 4)
        : [
            "能根据实际条件建立函数模型",
            "能运用导数求函数的最值",
            "能解释模型结果的实际意义",
          ],
    sourceTextbookQuestionId: projectSource.id,
    sourceTextbookQuestion: projectSource,
    tasks: projectTasks,
    createTime: new Date().toISOString(),
    status: "inProgress",
  };
}

function normalizeHints(
  hints: unknown,
  key: string
): [string, string, string, string] {
  const list = Array.isArray(hints)
    ? hints.filter((hint): hint is string => typeof hint === "string" && hint.trim().length > 0)
    : [];
  const result = list.slice(0, 4);
  while (result.length < 4) {
    const seed = result.length + key.length;
    result.push(HINT_FALLBACKS[seed % HINT_FALLBACKS.length]);
  }
  return [result[0], result[1], result[2], result[3]];
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
    console.warn("[projectGenerator] JSON 解析失败，使用默认值");
    return {} as T;
  }
}
