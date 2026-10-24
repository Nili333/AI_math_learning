// ============================================
// 阿里云百炼 DashScope API 配置
// 官方文档：https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen
// ============================================
// Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
// 鉴权: Authorization: Bearer $DASHSCOPE_API_KEY
// 可用模型见：https://help.aliyun.com/zh/model-studio/models
// ============================================

export const AI_CONFIG = {
  apiKey: process.env.DASHSCOPE_API_KEY || "",
  // OpenAI 兼容模式（官方固定端点）
  // 公有云: https://dashscope.aliyuncs.com/compatible-mode/v1
  // 金融云: https://dashscope.aliyuncs4finance.com/compatible-mode/v1
  baseUrl:
    process.env.DASHSCOPE_BASE_URL ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
  // 默认模型：qwen-plus（效果/速度/成本均衡，推荐首选）
  // 可选文本模型：qwen3.8-max / qwen3.7-plus / qwen3.8-flash / qwen-plus / qwen-turbo
  model: process.env.QWEN_MODEL || "qwen-plus",
  // 视觉模型：支持图像理解（OCR、手写解答分析）
  // qwen3-vl-plus 在识别准确率与响应速度之间比较均衡；
  // 也可换成 qwen3.8-max 等更强的多模态模型（更慢）。
  vlModel: process.env.QWEN_VL_MODEL || "qwen3-vl-plus",
  projectTutorModel: process.env.QWEN_PROJECT_TUTOR_MODEL || "qwen-plus",
  temperature: 0.3,
  maxTokens: 1500,
} as const;

export function hasRealAIKey(): boolean {
  return Boolean(AI_CONFIG.apiKey && AI_CONFIG.apiKey.trim());
}
