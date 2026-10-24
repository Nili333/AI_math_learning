// ============================================
// OCR 服务 —— 通义千问 VL 视觉模型识别数学题图片
// 复用 DashScope API Key，无需单独开通 OCR 服务
// 模型：qwen3.8-max（支持图片+文字输入，精准识别数学公式）
//
// 支持两种识别目的（purpose）：
//   - question：只识别【题目本身】（题干、已知条件、求解目标）
//   - answer  ：只识别【学生手写作答】（解题步骤、推导过程、最终答案）
// ============================================

import { AI_CONFIG, hasRealAIKey } from "./config";
import { qwenChat, extractText, type QwenContentPart } from "./qwen";
import { formatOcrText } from "@/services/textFormat";

const OCR_MODEL = AI_CONFIG.vlModel;

export type OcrPurpose = "question" | "answer";

// 题目识别 prompt
const QUESTION_PROMPT = `你是一位专业的数学题 OCR 识别助手。用户会上传一张包含数学题目的图片。

【你的任务】
只识别图片中的【题目本身】：题干、已知条件、求解目标。**不要识别任何手写解答过程**。

【输出要求】
1. 只输出识别出的题目文字本身，不要添加任何解释、说明或前后缀
2. 数学公式必须用 LaTeX 格式表达：
   - 行内公式用 $...$ 包裹（如 $y = 3x^2 + 2x - 1$）
   - 分式用 \\frac{a}{b}，根式用 \\sqrt{x}
   - 上标用 x^2，下标用 x_1
   - 希腊字母用 \\alpha、\\beta、\\pi 等
3. 如果图片中有多道题，用空行分隔
4. **按语义换行**：题干、每个已知条件、每个小问、每个选项分别单独成行；如果原文是一段连续文字，请按句子断句换行，不要把整道题挤在一行
5. 保持题目原有的结构和换行
6. 中文文字正常输出，不要放入 $ 分隔符内
7. 如果图片模糊无法识别，返回空字符串`;

// 学生作答识别 prompt
const ANSWER_PROMPT = `你是一位专业的学生作业 OCR 识别助手。用户会上传一张图片，其中【手写部分】是学生的作答过程。

【你的任务】
只识别图片中的【手写作答内容】：学生的解题步骤、推导过程、计算过程和最终答案。
**不要识别图片中印刷体（打印/印刷）的题目文字**。

【如何区分】
- 印刷体文字（排版工整、字体统一）通常是题目，忽略它
- 手写文字/手写公式（笔迹）是学生的作答，提取它
- 如果图片中完全没有手写内容（例如只拍到了题目），返回空字符串

【输出要求】
1. 只输出学生手写作答的文字本身，不要添加任何解释、说明或前后缀
2. 数学公式必须用 LaTeX 格式表达：
   - 行内公式用 $...$ 包裹（如 $y = 3x^2 + 2x - 1$）
   - 分式用 \\frac{a}{b}，根式用 \\sqrt{x}，上标用 x^2，下标用 x_1
3. **按解题步骤换行**：每一步单独成行；在“解：、由、所以、因此、即、故、令”等逻辑转折处断行；不要把多个步骤挤在同一行
4. 保持解题步骤原有的换行结构，每一步单独成行
5. 中文文字正常输出，不要放入 $ 分隔符内
6. 如果图片中没有任何手写内容，返回空字符串`;

// ============================================
// 识别图片文字
// @param imageDataUrl base64 数据URI 或 公网图片URL
// @param purpose      识别目的：question（题目）/ answer（学生作答）
// @returns 识别出的文字（已尽量保留 LaTeX 公式）
// ============================================
export async function recognizeMathImage(
  imageDataUrl: string,
  purpose: OcrPurpose = "question"
): Promise<{ success: boolean; text: string; message?: string }> {
  if (!hasRealAIKey()) {
    return {
      success: false,
      text: "",
      message: "未配置 API Key，无法使用 OCR 识别",
    };
  }

  const imageUrl = imageDataUrl;
  const isAnswer = purpose === "answer";
  const systemPrompt = isAnswer ? ANSWER_PROMPT : QUESTION_PROMPT;
  const userText = isAnswer
    ? "请只识别这张图片中【学生手写】的解答过程和答案（忽略印刷的题目），数学公式用LaTeX格式，每个解题步骤单独换行。"
    : "请只识别这张图片中的【题目】文字（忽略任何手写解答），数学公式用LaTeX格式，题干、条件、小问和选项分别换行。";

  const userContent: QwenContentPart[] = [
    { type: "image_url", image_url: { url: imageUrl } },
    { type: "text", text: userText },
  ];

  try {
    const response = await qwenChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      {
        model: OCR_MODEL,
        temperature: 0.1, // OCR 需要低随机性
        maxTokens: 1000,
      }
    );

    const text = extractText(response).trim();
    if (!text) {
      return {
        success: false,
        text: "",
        message: isAnswer
          ? "未识别到手写作答内容，请确认图片中包含手写解答"
          : "未识别到题目内容，图片可能模糊或无文字",
      };
    }
    return {
      success: true,
      text: formatOcrText(text, isAnswer ? "answer" : "question"),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "识别失败";
    console.error("[ocrService] 识别失败:", msg);
    return { success: false, text: "", message: msg };
  }
}
