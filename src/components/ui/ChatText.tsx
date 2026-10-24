"use client";

import { MathText } from "./MathText";

/**
 * 对话气泡内容渲染：
 * - 保留学生的 LaTeX 公式渲染能力
 * - 兼容大模型常用的 Markdown 粗体 / 标题 / 列表符号
 * - 不引入完整 Markdown 解析器，避免把数学公式中的符号误解析
 */
export function ChatText({ children }: { children: string }) {
  const normalized = (children ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1");

  const parts = normalized.split(/(\*\*[^*\n]+\*\*)/g).filter(Boolean);

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={index} className="font-semibold">
              <MathText>{part.slice(2, -2)}</MathText>
            </strong>
          );
        }
        return <MathText key={index}>{part}</MathText>;
      })}
    </span>
  );
}
