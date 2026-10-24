// ============================================
// OCR 文本排版工具
//
// 视觉模型识别出的文字有时会把题干、选项、解题步骤挤在同一行。
// 这里在不破坏 LaTeX 公式的前提下，按语义补全换行：
//   - 题目的每个句子 / 小问 / 选项单独成行
//   - 作答的每个步骤、逻辑转折单独成行
//   - 保护 $...$ / $$...$$ 中的公式不被拆开
// ============================================

type OcrPurpose = "question" | "answer";

const MATH_TOKEN = /@@MATH_(\d+)@@/g;

function protectMath(text: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];
  const protectedText = text.replace(
    /\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g,
    (match) => {
      const index = blocks.push(match) - 1;
      return `@@MATH_${index}@@`;
    }
  );
  return { text: protectedText, blocks };
}

function restoreMath(text: string, blocks: string[]): string {
  return text.replace(MATH_TOKEN, (_match, index: string) => {
    return blocks[Number(index)] ?? "";
  });
}

function splitSentences(line: string): string {
  // 仅在句子较长时按句号 / 分号断行，短句保持原样，避免碎片化
  if (line.length <= 38) return line;
  return line.replace(/([。！？；;])(?=\S)/g, "$1\n");
}

function breakBeforeMarkers(text: string, purpose: OcrPurpose): string {
  if (purpose === "answer") {
    return text
      // 解题步骤标记
      .replace(/(?<!\n)(?=(?:[（(]\d{1,2}[）)]|[①-⑳]|步骤[一二三四五六七八九十\d]+[：:、]?|解[：:]|证明[：:]|答[：:]))/g, "\n")
      // 逻辑转折：只在前方是标点 / 逗号时断行，避免把“自由”“立即”等词拆开
      .replace(
        /(?<=[，,。；;：:、])(?=(?:所以|因此|从而|故(?![事])|即(?![使便])|则|又因为|又|由题意|由已知|令))/g,
        "\n"
      );
  }

  return text
    // 小问、选项、序号
    .replace(/(?<!\n)(?=(?:[（(]\d{1,2}[）)]|[①-⑳]|[A-DＡ-Ｄ][.、．]\s?))/g, "\n")
    // 多道题之间的“注：”“例：”等
    .replace(/(?<!\n)(?=(?:注[：:]|例\s*\d|【[^】]+】))/g, "\n");
}

function splitLongAnswerLine(line: string): string {
  if (line.length <= 48) return line;
  // 长行在中文逗号后、且后面是完整小句时断行
  return line.replace(
    /([，,])(?=(?:所以|因此|从而|故|即|则|又|由|因为|令|当|将|把|代入|化简|整理|解得|得到))/g,
    "$1\n"
  );
}

function normalizeLines(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .filter((line, index, list) => line.length > 0 || (index > 0 && list[index - 1]?.length > 0))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatOcrText(raw: string, purpose: OcrPurpose): string {
  if (!raw) return "";

  let text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  const { text: protectedText, blocks } = protectMath(text);
  text = protectedText;

  // 逐行处理：先补句末换行，再处理标记词
  text = text
    .split("\n")
    .map((line) => {
      let next = splitSentences(line);
      if (purpose === "answer") next = splitLongAnswerLine(next);
      return next;
    })
    .join("\n");

  text = breakBeforeMarkers(text, purpose);

  // 清理因断行产生的首尾空行
  text = normalizeLines(text);

  return restoreMath(text, blocks);
}
