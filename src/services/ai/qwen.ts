import { AI_CONFIG } from "./config";

export interface QwenTextPart { type: "text"; text: string; }
export interface QwenImagePart { type: "image_url"; image_url: { url: string }; }
export type QwenContentPart = QwenTextPart | QwenImagePart;
export interface QwenMessage { role: "system" | "user" | "assistant"; content: string | QwenContentPart[]; }
export interface QwenChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: "json_object" | "text"; // 强制 JSON 输出模式
}
export interface QwenResponse {
  choices: { message: { role: string; content: string }; finish_reason: string }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function qwenChat(messages: QwenMessage[], options: QwenChatOptions = {}): Promise<QwenResponse> {
  if (!AI_CONFIG.apiKey) throw new Error("DASHSCOPE_API_KEY 未配置");
  const model = options.model || AI_CONFIG.model;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? AI_CONFIG.temperature,
    max_tokens: options.maxTokens ?? AI_CONFIG.maxTokens,
  };
  if (options.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_CONFIG.apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const errText = await res.text().catch(() => ""); throw new Error(`Qwen 调用失败 (HTTP ${res.status}): ${errText || res.statusText}`); }
  return (await res.json()) as QwenResponse;
}

export function extractText(response: QwenResponse): string {
  return response.choices?.[0]?.message?.content ?? "";
}
