import type { Message, ProjectTask } from "@/types";

// ============================================
// AI导师对话服务（Mock）
// 引导式风格：优先提问、引导思考、不直接给答案、即时反馈、逐步推进任务
// 未来替换为真实大模型API时，只需替换 getAIReply 内部实现
// ============================================

// 每个任务对应的引导问题序列
const TASK_GUIDING_QUESTIONS: Record<number, string[]> = {
  1: [
    "我们先来分析这个易拉罐设计问题。请你说说，题目中告诉了我们哪些已知条件？",
    "很好！那厂家希望我们求出什么目标呢？请明确一下。",
  ],
  2: [
    "现在我们来整理已知条件。易拉罐的容积是多少立方厘米？",
    "对的。那圆柱体的体积公式是什么？",
    "非常好。那圆柱体的表面积由哪些部分组成呢？",
  ],
  3: [
    "接下来建立数学关系。如果我们设底面半径为 r 厘米，你能用 r 表示出高 h 吗？",
    "很好。请把 h 代入表面积公式，写出表面积 S 关于 r 的函数关系式。",
    "不错。这个函数的定义域是什么？从 r 的实际意义出发想一想。",
  ],
  4: [
    "现在来解决问题。要使表面积最小，我们用什么数学工具求这个函数的最小值呢？",
    "对，就是导数！请计算 S′(r)。",
    "很好。令 S′(r) = 0，解出此时的 r 值是多少？",
    "很好。请再算出此时的高 h 和最小表面积 S。",
  ],
  5: [
    "最后一步，解释你的方案。你得到的底面半径和高分别是多少？",
    "你发现半径和高之间有什么关系？这个结果在实际生产中意味着什么？",
    "太棒了！你已经完整地完成了这个项目。请总结一下你在这个项目中学到了什么？",
  ],
};

// 简单的关键词匹配，判断学生回答是否"正确"
// 真实场景下由大模型判断，这里用Mock模拟
function checkAnswerCorrectness(taskNo: number, questionIndex: number, studentAnswer: string): boolean {
  const answer = studentAnswer.toLowerCase().trim();
  if (answer.length < 2) return false;

  // 定义每个问题的正确关键词
  const correctKeywords: Record<string, string[]> = {
    "1-0": ["500", "易拉罐", "圆柱", "容积", "半径", "高", "表面积", "用料", "成本"],
    "1-1": ["最小", "最省", "表面积", "用料", "设计", "成本", "求"],
    "2-0": ["500", "五百", "立方", "容积"],
    "2-1": ["πr²h", "r²h", "π", "底面积", "高", "体积", "乘"],
    "2-2": ["侧面", "底面", "两个底", "圆", "侧面积", "2π"],
    "3-0": ["500", "πr²", "除", "h", "高", "容积"],
    "3-1": ["2πr²", "1000/r", "2πrh", "s", "乘", "表面积", "函数"],
    "3-2": ["r>0", "大于0", "正数", "定义域", "范围"],
    "4-0": ["导数", "求导", "最值", "导"],
    "4-1": ["4πr", "1000", "r²", "求导", "导数"],
    "4-2": ["4.3", "4.30", "250", "三次方根", "立方根", "根号", "r³"],
    "4-3": ["8.6", "8.60", "高", "表面积", "s", "最小"],
    "5-0": ["4.3", "8.6", "半径", "高", "表面积"],
    "5-1": ["2", "两倍", "直径", "高", "相等", "合理", "材料", "省"],
    "5-2": ["导数", "最值", "建模", "函数", "实际", "应用", "学到"],
  };

  const key = `${taskNo}-${questionIndex}`;
  const keywords = correctKeywords[key];
  if (!keywords) return true; // 未配置的问题默认通过

  // 至少匹配1个关键词即认为正确
  return keywords.some((kw) => answer.includes(kw));
}

// 根据学生回答生成AI引导回复
function generateAIReply(
  taskNo: number,
  questionIndex: number,
  isCorrect: boolean
): string {
  if (isCorrect) {
    // 正确：肯定 + 下一个引导问题
    const nextQuestions = TASK_GUIDING_QUESTIONS[taskNo];
    const nextIndex = questionIndex + 1;
    const praises = [
      "很好！",
      "没错！",
      "回答得很准确！",
      "思路很清晰！",
      "非常棒！",
    ];
    const praise = praises[Math.floor(Math.random() * praises.length)];

    if (nextIndex < nextQuestions.length) {
      return `${praise}${nextQuestions[nextIndex]}`;
    } else {
      // 当前任务的所有引导问题完成
      return "太棒了！我们已经完成了这个任务，接下来进入下一个环节。";
    }
  } else {
    // 错误：给提示，不直接给答案
    const hints: Record<string, string> = {
      "1-0": "你可以再想想，题目中提到了哪些具体的数字和条件呢？",
      "1-1": "想想看，厂家希望达到什么目标？是求最大还是最小？",
      "2-0": "易拉罐的容积是多少？题目里有明确的数字哦，注意单位是立方厘米。",
      "2-1": "回忆一下圆柱体的体积公式：底面积 × 高。",
      "2-2": "圆柱的表面积 = 侧面积 + 上下两个底面面积。",
      "3-0": "利用体积公式 πr²h = 500，把 h 用含 r 的式子表示出来。",
      "3-1": "把 h 代入表面积公式 S = 2πr² + 2πrh，化简一下。",
      "3-2": "r 是底面半径，从实际意义出发想想 r 能取哪些值。",
      "4-0": "我们刚学过的导数，正是研究函数最值的有力工具。",
      "4-1": "对 S(r) = 2πr² + 1000/r 逐项求导试试。",
      "4-2": "令 4πr - 1000/r² = 0，两边同乘 r²，解出 r³ 再开立方。",
      "4-3": "把 r 的值代入 h = 500/(πr²)，再算 S(r)。",
      "5-0": "回顾一下你计算出的半径、高和最小表面积的具体数值。",
      "5-1": "算一算 h 和 r 的比值，你会有惊喜的发现！",
      "5-2": "想想你在这个项目中用到了哪些数学知识和方法。",
    };
    const key = `${taskNo}-${questionIndex}`;
    return hints[key] || "你可以再想想，或者换个角度思考这个问题。";
  }
}

// ============================================
// 对外接口：获取AI回复
// 这是未来替换为真实大模型API的入口
// ============================================
export interface ChatServiceResult {
  aiMessage: Message;
  updatedTasks: ProjectTask[];
  projectCompleted: boolean;
  nextQuestionIndex: number;
}

export function getAIReply(
  conversationId: string,
  studentMessage: string,
  tasks: ProjectTask[],
  currentTaskNo: number,
  currentQuestionIndex: number
): ChatServiceResult {
  const isCorrect = checkAnswerCorrectness(currentTaskNo, currentQuestionIndex, studentMessage);
  const replyContent = generateAIReply(currentTaskNo, currentQuestionIndex, isCorrect);

  const aiMessage: Message = {
    id: `msg_${Date.now()}`,
    conversationId,
    role: "ai",
    content: replyContent,
    sendTime: new Date().toISOString(),
  };

  let updatedTasks = [...tasks];
  let projectCompleted = false;
  let nextQuestionIndex = currentQuestionIndex;

  if (isCorrect) {
    const taskQuestions = TASK_GUIDING_QUESTIONS[currentTaskNo] || [];
    if (currentQuestionIndex + 1 >= taskQuestions.length) {
      // 当前任务完成
      updatedTasks = updatedTasks.map((t) => {
        if (t.taskNo === currentTaskNo) {
          return { ...t, status: "completed", studentAnswer: studentMessage };
        }
        if (t.taskNo === currentTaskNo + 1) {
          return { ...t, status: "inProgress" };
        }
        return t;
      });

      // 检查是否所有任务都完成
      projectCompleted = updatedTasks.every((t) => t.status === "completed");
      nextQuestionIndex = 0; // 下一个任务从第一个问题开始
    } else {
      nextQuestionIndex = currentQuestionIndex + 1;
    }
  }

  return {
    aiMessage,
    updatedTasks,
    projectCompleted,
    nextQuestionIndex,
  };
}

// ============================================
// 获取AI欢迎消息
// ============================================
export function getWelcomeMessage(conversationId: string): Message {
  return {
    id: `msg_welcome_${Date.now()}`,
    conversationId,
    role: "ai",
    content:
      "欢迎来到本次项目学习！我们会通过 5 个递进的小任务，一起把这个真实问题解决掉。\n\n先看左侧的项目背景与题目，然后告诉我：题目中给出了哪些已知条件？我们需要解决的核心问题是什么？",
    sendTime: new Date().toISOString(),
  };
}

// ============================================
// 获取项目完成提示消息
// ============================================
export function getCompletionMessage(conversationId: string): Message {
  return {
    id: `msg_complete_${Date.now()}`,
    conversationId,
    role: "ai",
    content: "恭喜你完成了所有项目任务！点击下方按钮进入最终讲解环节。",
    sendTime: new Date().toISOString(),
  };
}
