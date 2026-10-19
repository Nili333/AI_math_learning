// ============================================
// 教材母题智能推荐服务（AI）
//
// 有 Key：根据错题内容推荐教材母题
// 无 Key：返回 Mock 母题列表
// ============================================

import { qwenChat, extractText } from "./qwen";
import { AI_CONFIG, hasRealAIKey } from "./config";
import type { WrongAnswer, TextbookQuestion } from "@/types";
import { mockTextbookQuestions, knowledgePoints } from "@/mock";

interface TqJson {
  content: string;
  knowledge_point_id: string;
  relevance: string;
  difficulty: number;
  chapter: string;
}

interface TqListJson {
  questions: TqJson[];
}

export async function recommendTextbookQuestions(
  wrongAnswerId: string,
  wrongAnswer?: WrongAnswer
): Promise<TextbookQuestion[]> {
  if (hasRealAIKey() && wrongAnswer) {
    return recommendWithAI(wrongAnswer);
  }
  return mockTextbookQuestions;
}

async function recommendWithAI(
  wrongAnswer: WrongAnswer
): Promise<TextbookQuestion[]> {
  const { question, errorType, knowledgePoints: kps } = wrongAnswer;

  const systemPrompt = `你是一位高中数学教材研究专家，精通人教A版高中数学教材。

【LaTeX 格式要求】推荐题目中的数学公式必须用 LaTeX 格式：
- 行内公式用 $...$ 包裹（如 $f(x) = x^3 - 3x$）
- 独立大公式用 $$...$$ 单独成行
- 中文说明文字不要放入 $ 分隔符内

任务：根据学生的错题情况，推荐3道最具针对性的教材原题，帮助学生巩固薄弱知识点。

可用知识点：
${knowledgePoints.map((kp) => `- ${kp.id} ${kp.name}`).join("\n")}

输出要求：只输出一个 JSON 对象，结构为：
{
  "questions": [
    {
      "content": "完整的教材原题",
      "knowledge_point_id": "kp_x",
      "relevance": "这道题和学生错题的关联说明（1-2句）",
      "difficulty": 1-5,
      "chapter": "教材章节"
    }
  ]
}

注意：推荐的题目必须是教材中的真实原题或高度仿真的题目，难度要匹配学生水平。`;

  const userMessage = `【学生错题】
- 题目：${question.content}
- 错因：${errorType?.name ?? "未知"}
- 薄弱知识点：${kps.map((kp) => kp.name).join("、") || "导数运算相关"}

请推荐3道教材母题。`;

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
  const parsed = safeParseJson<TqListJson>(raw);

  const questions = parsed.questions
    ?.slice(0, 3)
    .map((q, i) => {
      const kp =
        knowledgePoints.find((kp) => kp.id === q.knowledge_point_id) ??
        knowledgePoints[0];
      return {
        id: `tq_ai_${Date.now()}_${i}`,
        content: q.content,
        textbookVersion: "人教A版选择性必修第二册",
        grade: "高二",
        chapter: q.chapter || "第五章 一元函数的导数及其应用",
        knowledgePointId: kp.id,
        knowledgePoint: kp,
        difficulty: Math.max(1, Math.min(5, q.difficulty || 3)),
        relevance: q.relevance,
      } as TextbookQuestion;
    })
    .filter((q) => q.content?.length > 5);

  if (!questions || questions.length === 0) {
    return mockTextbookQuestions;
  }
  return questions;
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
    console.warn("[textbookRecommender] JSON 解析失败，使用默认值");
    return {} as T;
  }
}
