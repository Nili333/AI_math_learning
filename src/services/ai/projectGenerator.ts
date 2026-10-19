// ============================================
// 学习项目生成服务（AI）
//
// 有 Key：根据错题内容生成定制化项目
// 无 Key：返回 Mock 项目（固定模板）
// ============================================

import { qwenChat, extractText } from "./qwen";
import { AI_CONFIG, hasRealAIKey } from "./config";
import type { WrongAnswer, Project, TextbookQuestion } from "@/types";
import { mockTextbookQuestions, generateMockProject } from "@/mock";
import { buildInitialTasks } from "@/services/projectTaskState";

interface ProjectJsonResult {
  project_name: string;
  project_background: string;
  learning_objectives: string[];
  source_textbook_question: {
    content: string;
    knowledge_point: string;
    relevance: string;
  };
}

export async function generateProjectFromWrongAnswer(
  wrongAnswerId: string,
  wrongAnswer?: WrongAnswer
): Promise<Project> {
  if (hasRealAIKey() && wrongAnswer) {
    return generateWithAI(wrongAnswerId, wrongAnswer);
  }
  // Mock 模式：使用模板
  const sourceTq = mockTextbookQuestions[1];
  return generateMockProject(wrongAnswerId, sourceTq);
}

async function generateWithAI(
  wrongAnswerId: string,
  wrongAnswer: WrongAnswer
): Promise<Project> {
  const { question, studentAnswer, correctAnswer, errorAnalysis, errorType } =
    wrongAnswer;

  const systemPrompt = `你是一位高中数学课程设计专家，擅长根据学生错题设计"项目式学习"方案。

【LaTeX 格式要求】项目描述中的数学公式必须用 LaTeX 格式：
- 行内公式用 $...$ 包裹（如 $y = x^3 - 3x^2 + 2$）
- 独立大公式用 $$...$$ 单独成行
- 中文说明文字不要放入 $ 分隔符内

项目设计要求：
- 一个好的项目应该围绕一个真实或拟真的问题情境展开，让学生在解决问题的过程中自然地用到目标知识点
- 项目名称要具体、有情境感，不超过20字
- 项目背景要描述清楚"为什么"——为什么要做这个项目，它和学生的错题有什么关系
- 学习目标要对应错题暴露的薄弱点，2-4条
- 配套一道教材母题作为项目的知识锚点

当前高中数学主要知识点：
- 导数的概念与几何意义
- 导数的运算（幂函数、乘积、复合函数求导等）
- 利用导数研究函数的单调性
- 函数的极值与最值
- 导数在实际问题中的应用

输出要求：只输出一个 JSON 对象。`;

  const userMessage = `【错题信息】
- 题目：${question.content}
- 学生答案：${studentAnswer}
${correctAnswer ? `- 正确答案：${correctAnswer}` : ""}
- 错因类型：${errorType?.name ?? "未知"}
- 错因分析：${errorAnalysis}

请为这个学生设计一个针对性的项目式学习方案，帮助他通过一个有意义的项目来真正掌握相关知识。`;

  const response = await qwenChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: AI_CONFIG.model,
      temperature: 0.4,
      responseFormat: "json_object",
      maxTokens: 1200,
    }
  );

  const raw = extractText(response);
  const parsed = safeParseJson<ProjectJsonResult>(raw);

  // 找到匹配的教材母题（或用第一个）
  const sourceTq: TextbookQuestion = mockTextbookQuestions[1];

  const projectId = `proj_${wrongAnswerId}`;
  const tasks = buildInitialTasks(projectId);
  tasks[0].status = "inProgress";

  return {
    id: projectId,
    name: parsed.project_name || "探究导数的优化作用——易拉罐设计项目",
    background:
      parsed.project_background ||
      "通过设计一个真实的问题情境，让学生在解决问题中掌握导数求最值的方法。",
    learningObjectives:
      parsed.learning_objectives?.slice(0, 4) ?? [
        "能根据实际条件建立函数模型",
        "能运用导数求函数的最值",
        "能解释模型结果的实际意义",
      ],
    sourceTextbookQuestionId: sourceTq.id,
    sourceTextbookQuestion: sourceTq,
    tasks,
    createTime: new Date().toISOString(),
    status: "inProgress",
  };
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
