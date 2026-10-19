// ============================================
// 数学项目学习 AI 导师（AI 的"大脑"）
//
// 真实模式（配置 DASHSCOPE_API_KEY）：
//   组织完整项目上下文 → Qwen3.5-Plus 输出结构化
//   状态分析 JSON（含给学生的引导回复）→ 解析校验
//
// Mock 模式（未配置 Key）：
//   基于任务蓝图的关键词检查点判定 + 四级提示
//
// 两种模式都返回统一的 TurnEvaluation，
// 由 projectTaskState 状态机决定任务推进。
// ============================================

import { qwenChat, extractText, type QwenMessage } from "./qwen";
import { AI_CONFIG, hasRealAIKey } from "./config";
import { resolveImageForModel } from "./imageResolver";
import { getBlueprint } from "../projectBlueprint";
import type {
  Project,
  Message,
  TurnEvaluation,
  ProjectTask,
} from "@/types";

export interface ProcessTurnParams {
  project: Project;
  currentTask: ProjectTask;
  studentText: string;
  studentImageUrl?: string;
  recentMessages: Message[];
}

export async function processTurn(
  params: ProcessTurnParams
): Promise<TurnEvaluation> {
  if (hasRealAIKey()) {
    return evaluateWithQwen(params);
  }
  return evaluateWithMock(params);
}

// ============================================
// 真实模型：Qwen3.5-Plus 多模态结构化分析
// ============================================

async function evaluateWithQwen(
  params: ProcessTurnParams
): Promise<TurnEvaluation> {
  const { project, currentTask, studentText, studentImageUrl, recentMessages } =
    params;

  const systemPrompt = buildSystemPrompt(project, currentTask);
  const history = await buildHistoryMessages(recentMessages);

  const userContent: QwenMessage["content"] = [];
  if (studentText.trim()) {
    userContent.push({ type: "text", text: `学生本轮回答：${studentText}` });
  }
  if (studentImageUrl) {
    const resolved = await resolveImageForModel(studentImageUrl);
    userContent.push({
      type: "text",
      text: "学生本轮上传了一张手写解答图片，请结合当前任务分析：",
    });
    if (resolved) {
      userContent.push({ type: "image_url", image_url: { url: resolved } });
    }
  }

  const messages: QwenMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userContent },
  ];

  const response = await qwenChat(messages, {
    model: AI_CONFIG.projectTutorModel,
    temperature: AI_CONFIG.temperature,
    maxTokens: AI_CONFIG.maxTokens,
    responseFormat: "json_object",
  });

  const raw = extractText(response);
  return parseAnalysis(raw);
}

function buildSystemPrompt(
  project: Project,
  task: ProjectTask
): string {
  const bp = getBlueprint(task.taskNo);
  const checkpoints = bp?.checkpoints ?? [];
  const currentCheckpoint = checkpoints[task.checkpointIndex];

  const taskListText = project.tasks
    .map((t) => {
      const mark =
        t.status === "completed"
          ? "[已完成]"
          : t.status === "inProgress"
          ? "[进行中]"
          : t.status === "needsGuidance"
          ? "[需要引导]"
          : "[未开始]";
      return `- 任务${t.taskNo}《${t.title}》${mark}`;
    })
    .join("\n");

  return `你是一位资深的"数学项目学习AI导师"，不是普通问答机器人。你的任务是帮助高中生独立完成当前数学项目。

【项目名称】${project.name}
【项目背景】${project.background}
【项目学习目标】
${project.learningObjectives.map((o) => `- ${o}`).join("\n")}

【全部任务及状态】
${taskListText}

【当前任务】任务${task.taskNo}《${task.title}》
【当前任务目标】${task.objective}
【当前任务完成标准】（学生必须真正达到，不能只凭一个最终答案判定完成）
${task.completionCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}
【当前引导问题】${currentCheckpoint?.question ?? "（收尾总结）"}

【学生学习状态数据】
- 本任务已尝试 ${task.attemptCount} 次，已收到提示 ${task.hintCount} 次
- 当前提示级别：${task.hintLevel}（0=尚未出错）
- 最近错误：${task.currentError ?? "无"}
- 最近错误类型：${task.errorType ?? "无"}
- 是否出现过自我纠正：${task.selfCorrected ? "是" : "否"}

【四级引导策略 —— 本轮请按当前提示级别对应的风格回复】
- Level 1 启发式提问：用开放问题引导，例如"这两个量之间有什么关系？"
- Level 2 定向提示：指出思考方向，例如"回到题目中的已知条件看看"
- Level 3 局部具体提示：给出具体可操作的台阶，但不替学生写出结果
- Level 4 知识解释：可解释所需知识并做局部示范，仍要保留一部分让学生自己完成
学生第一次出错用 Level 1；在同一处连续出错逐级升高；学生理解后立即降低，不重复解释。

【你的工作准则】
1. 始终围绕当前任务，不跳到未开始的任务；学生跑题时先回应再引回当前任务。
2. 先理解学生思路与采用的方法，再定位"最早出现的关键错误"，不要因最终答案错误就否定全部过程。
3. 优先使用：提问 → 提示 → 追问 → 局部纠正；不直接输出完整答案。
4. 学生回答正确时，先判断是"碰巧算对"还是"真正理解"：必要时追问"为什么"，能正确解释才算任务完成。
5. 图片模糊、遮挡或手写无法辨认时，在回复中明确请学生重新拍摄，严禁猜测或编造图片中不存在的内容。
6. 不要反复询问学生已经回答过的内容。

【LaTeX 格式要求】给学生的回复中所有数学公式必须用 LaTeX 格式：
- 行内公式（如 $f'(x) = 3x^2$）用 $...$ 包裹
- 独立的大公式用 $$...$$ 单独成行包裹
- 分式 \\frac{a}{b}、根式 \\sqrt{x}、上标 x^2、下标 x_1、希腊字母 \\alpha \\beta \\pi
- 中文说明文字不要放入 $ 分隔符内

【输出要求】
只输出一个 JSON 对象，不要输出任何其他文字，结构如下：
{
  "checkpoint_passed": 布尔值,
  "task_completed": 布尔值,
  "error_detected": 布尔值,
  "error_type": "概念理解错误|运算错误|公式使用错误|审题错误|推理错误|建模错误|方法选择错误|表征转换错误|其他|无法判断",
  "error_location": "错误所在的具体步骤，没有则为空字符串",
  "student_understanding": "对学生当前思路的简短分析",
  "self_corrected": 布尔值,
  "confidence": 0到1之间的数字,
  "reply": "给学生看的自然语言导师回复，符合当前引导级别"
}
图片看不清时 confidence 应低于 0.5，并在 reply 中说明。`;
}

async function buildHistoryMessages(
  recentMessages: Message[]
): Promise<QwenMessage[]> {
  // 只取最近 10 条；历史图片仅保留最近 2 张，其余以文字占位，控制上下文长度
  const sliced = recentMessages.slice(-10);
  const imageMsgIndexes = sliced
    .map((m, i) => (m.imageUrl ? i : -1))
    .filter((i) => i >= 0);
  const keptImageIndexes = new Set(imageMsgIndexes.slice(-2));

  const result: QwenMessage[] = [];
  for (let i = 0; i < sliced.length; i++) {
    const m = sliced[i];
    const role = m.role === "ai" ? "assistant" : "user";

    if (m.imageUrl && keptImageIndexes.has(i)) {
      const resolved = await resolveImageForModel(m.imageUrl);
      const parts: QwenMessage["content"] = [
        {
          type: "text",
          text: `${m.role === "student" ? "学生" : "你（AI导师）"}此前说：${m.content === "[图片]" ? "（发送了一张解答图片）" : m.content}`,
        },
      ];
      if (resolved) {
        parts.push({ type: "image_url", image_url: { url: resolved } });
      }
      result.push({ role, content: parts });
    } else if (m.imageUrl) {
      result.push({
        role,
        content: `${m.role === "student" ? "学生" : "AI导师"}此前发送过一张解答图片（较早的图片，已省略）。`,
      });
    } else {
      result.push({ role, content: m.content });
    }
  }
  return result;
}

// 稳健解析模型返回的分析 JSON
function parseAnalysis(raw: string): TurnEvaluation {
  let json: Record<string, unknown>;
  try {
    let text = raw.trim();
    // 去除 ```json 代码块包裹
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    // 截取最外层花括号
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("未找到 JSON 对象");
    }
    json = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    // JSON 格式错误：把原文降级为普通回复，不崩溃、不编造状态
    console.warn("[projectTutor] 模型返回不是合法 JSON，已降级处理");
    return {
      checkpointPassed: false,
      taskCompleted: false,
      errorDetected: false,
      confidence: 0.3,
      reply:
        raw.trim().slice(0, 500) ||
        "我刚刚没太听清，请你再把想法说一遍好吗？",
    };
  }

  const bool = (v: unknown) => v === true;
  const num = (v: unknown) =>
    typeof v === "number" && v >= 0 && v <= 1 ? v : 0.5;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const reply = str(json.reply) || "请你继续说说你的想法。";
  const errorLocation = str(json.error_location);
  const errorType = str(json.error_type);

  return {
    checkpointPassed: bool(json.checkpoint_passed),
    taskCompleted: bool(json.task_completed),
    errorDetected: bool(json.error_detected),
    errorType: errorType || undefined,
    errorLocation: errorLocation || undefined,
    studentUnderstanding: str(json.student_understanding) || undefined,
    confidence: num(json.confidence),
    reply,
  };
}

// ============================================
// Mock 模式：任务蓝图关键词判定 + 四级提示
// ============================================

function evaluateWithMock(params: ProcessTurnParams): TurnEvaluation {
  const { currentTask, studentText, studentImageUrl } = params;
  const bp = getBlueprint(currentTask.taskNo);
  const checkpoints = bp?.checkpoints ?? [];
  const checkpoint = checkpoints[currentTask.checkpointIndex];
  const isLastCheckpoint =
    currentTask.checkpointIndex + 1 >= checkpoints.length;

  const answer = studentText.toLowerCase().trim();
  const hasMeaningfulText = answer.length >= 2;

  // 纯图片（无文字）：中性处理，不判定错误，不升级提示级别
  if (!hasMeaningfulText && studentImageUrl) {
    return {
      checkpointPassed: false,
      taskCompleted: false,
      errorDetected: false,
      confidence: 0.7,
      reply:
        "我已经收到你的解答图片。为了确认你的思路，请你用文字告诉我：图片中你得到的关键结论是什么？",
    };
  }

  const passed =
    checkpoint?.acceptKeywords.some((kw) => answer.includes(kw)) ?? false;

  if (passed) {
    if (isLastCheckpoint) {
      return {
        checkpointPassed: true,
        taskCompleted: true,
        errorDetected: false,
        confidence: 0.9,
        reply: "太棒了！这个任务你完成得很出色，已经达到了全部完成标准。",
      };
    }
    const praises = ["很好！", "没错！", "回答得很准确！", "思路很清晰！"];
    const praise = praises[Math.floor(Math.random() * praises.length)];
    const nextQuestion = checkpoints[currentTask.checkpointIndex + 1]?.question ?? "";
    return {
      checkpointPassed: true,
      taskCompleted: false,
      errorDetected: false,
      confidence: 0.9,
      reply: `${praise}${nextQuestion}`,
    };
  }

  // 未通过：依据状态机即将设置的提示级别选择对应提示
  // 当前 hintLevel 0 → 本轮将升到 1 → 用 hints[0]
  const nextLevel = Math.min(currentTask.hintLevel + 1, 4);
  const hintText = checkpoint?.hints[nextLevel - 1]
    ?? "你可以再想想，或者换个角度思考这个问题。";

  return {
    checkpointPassed: false,
    taskCompleted: false,
    errorDetected: hasMeaningfulText,
    confidence: 0.8,
    reply: hintText,
  };
}
