"use client";

import { useMemo } from "react";
import katex from "katex";

// ============================================
// MathText —— LaTeX 智能渲染组件
//
// 支持三种内容形态：
//   1. 纯文本（无 $ 分隔符）→ 原样渲染
//   2. 混合内容（$...$ 行内 + $$...$$ 块级）→ 分段渲染
//   3. 裸 LaTeX（无分隔符但包含 \frac、x^2 等）→ 自动包 $ 渲染
//
// 设计要点：
//   - 绝不强制给内容套 $$，避免中文被吞进 math mode
//   - KaTeX 渲染失败自动降级为纯文本，不崩溃
//   - 使用 useMemo 缓存分割结果避免重复计算
// ============================================

interface MathTextProps {
  /** 原始内容，可以是中文+LaTeX混合文本 */
  children: string;
  /** 是否把整个块视为独立公式（默认 false，走智能分割） */
  displayMode?: boolean;
  /** 行内文本样式（tailwind class） */
  className?: string;
}

// 判断字符串是否"像"裸 LaTeX（无 $ 但有 LaTeX 命令）
function isBareLatex(s: string): boolean {
  return /\\(frac|sqrt|sum|prod|int|lim|alpha|beta|gamma|theta|pi|infty|text|left|right|begin|end|over)\b/.test(s) ||
    /[a-zA-Z]\^[a-zA-Z0-9{}]/.test(s) ||       // x^2 形式
    /[a-zA-Z]_[a-zA-Z0-9{}]/.test(s) ||       // x_1 形式
    /\([a-zA-Z]+\)\^\{\-?1\}/.test(s);         // f(x)^{-1}
}

// 将文本按 $$...$$ 和 $...$ 分割
// 返回数组：{ type: "text"|"inline"|"block", content: string }
type Segment = { type: "text" | "inline" | "block"; content: string };

function splitContent(raw: string): Segment[] {
  const result: Segment[] = [];
  let remaining = raw;

  // 先处理 $$...$$（块级公式优先匹配）
  while (remaining.length > 0) {
    // 找下一个 $$ 起始
    const blockStart = remaining.indexOf("$$");
    if (blockStart === -1) {
      // 没有块级公式了，剩余部分继续按 $ 分割
      result.push(...splitInline(remaining));
      break;
    }

    // 块级公式前的文本
    if (blockStart > 0) {
      result.push(...splitInline(remaining.slice(0, blockStart)));
    }

    // 找 $$ 结束
    const blockEnd = remaining.indexOf("$$", blockStart + 2);
    if (blockEnd === -1) {
      // 没找到配对的 $$，把剩余当文本
      result.push({ type: "text", content: remaining.slice(blockStart) });
      break;
    }

    result.push({
      type: "block",
      content: remaining.slice(blockStart + 2, blockEnd).trim(),
    });
    remaining = remaining.slice(blockEnd + 2);
  }

  return result;
}

function splitInline(text: string): Segment[] {
  const result: Segment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const idx = remaining.indexOf("$");
    if (idx === -1) {
      result.push({ type: "text", content: remaining });
      break;
    }

    // $ 前的文本
    if (idx > 0) {
      result.push({ type: "text", content: remaining.slice(0, idx) });
    }

    // 找结束 $（跳过 \$ 转义）
    let end = idx + 1;
    while (end < remaining.length) {
      if (remaining[end] === "$" && remaining[end - 1] !== "\\") break;
      end++;
    }

    if (end >= remaining.length) {
      // 没配对，把 $ 及之后当文本
      result.push({ type: "text", content: remaining.slice(idx) });
      break;
    }

    result.push({
      type: "inline",
      content: remaining.slice(idx + 1, end),
    });
    remaining = remaining.slice(end + 1);
  }

  return result;
}

// 用 KaTeX 渲染一段公式，失败则返回 null
function renderLatex(latex: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
      output: "html",
    });
  } catch {
    return null;
  }
}

export function MathText({ children, displayMode = false, className = "" }: MathTextProps) {
  const html = useMemo(() => {
    const raw = children ?? "";
    if (!raw) return { segments: [] as Segment[], bare: null as string | null };

    // 整个内容直接当作一个块级公式
    if (displayMode) {
      const rendered = renderLatex(raw, true);
      return {
        segments: [] as Segment[],
        bare: rendered ?? raw,
        isBare: true,
      };
    }

    // 智能分割
    if (!raw.includes("$") && isBareLatex(raw)) {
      // 裸 LaTeX，自动尝试作为行内公式渲染
      const rendered = renderLatex(raw, false);
      if (rendered) {
        return { segments: [{ type: "inline", content: raw }], bare: null as string | null };
      }
    }

    const segments = splitContent(raw);
    return { segments, bare: null as string | null };
  }, [children, displayMode]);

  // 整个内容就是一个渲染后的公式块
  if (html.bare) {
    return (
      <span
        className={`math-content whitespace-pre-wrap break-words ${className}`}
        dangerouslySetInnerHTML={{ __html: html.bare }}
      />
    );
  }

  return (
    <span className={`math-content whitespace-pre-wrap break-words ${className}`}>
      {html.segments.map((seg, i) => {
        if (seg.type === "text") {
          // 纯文本：保留换行
          return <span key={i}>{seg.content}</span>;
        }

        const isBlock = seg.type === "block";
        const rendered = renderLatex(seg.content, isBlock);
        const htmlContent = rendered ?? seg.content;

        if (isBlock) {
          return (
            <span
              key={i}
              className="block my-2 text-center overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          );
        }

        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      })}
    </span>
  );
}

// 便捷组件：块级公式（居中、独立行）
export function MathBlock({ children }: { children: string }) {
  return <MathText displayMode>{children}</MathText>;
}

// 便捷组件：行内公式
export function MathInline({ children }: { children: string }) {
  return <MathText>{children}</MathText>;
}
