"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { generateEvaluationApi, getProjectApi } from "@/services/api";
import type { Project } from "@/types";

const questions = [
  "这个项目要解决的核心问题是什么？请用自己的话描述问题的背景和已知条件。",
  "你是如何把实际问题转化为数学模型的？请写出关键的变量设定和函数关系。",
  "在求解过程中，你用到了哪些数学知识和方法？为什么选择这种方法？",
  "过程中你遇到的最大困难是什么？你是如何发现并纠正它的？",
  "你得到的最终结果在实际情境中意味着什么？请解释它的现实意义。",
];

const placeholders = [
  "例如：这个项目要求在容积固定的条件下，设计用料最省的圆柱形易拉罐……",
  "例如：设底面半径为 r，利用体积公式把高 h 表示为 r 的函数，再代入表面积公式……",
  "例如：我使用了导数的运算法则，通过求导找到驻点，再判断它是最小值点……",
  "例如：一开始我忽略了定义域 r > 0，后来通过检验发现……",
  "例如：当高等于底面直径时用料最省，这解释了常见易拉罐细长的设计……",
];

export default function ExplainPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { state, dispatch } = useApp();
  const { showToast } = useToast();

  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(state.currentProject);

  const draftKey = `ai-math-learning-explain-${projectId}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length === 5) setAnswers(parsed);
      }
    } catch {
      // ignore
    }
    if (!state.currentProject || state.currentProject.id !== projectId) {
      getProjectApi(projectId).then(setProject).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const updateAnswer = (index: number, value: string) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const filledCount = answers.filter((a) => a.trim().length > 0).length;
  const allFilled = filledCount === questions.length;
  const totalChars = answers.reduce((sum, a) => sum + a.trim().length, 0);

  const handleSubmit = async () => {
    if (!allFilled) {
      showToast("请回答所有问题后再提交", "error");
      return;
    }
    setSubmitting(true);
    try {
      const evaluation = await generateEvaluationApi(projectId, {
        answers: answers.map((a) => a.trim()),
      });
      dispatch({ type: "SET_CURRENT_EVALUATION", evaluation });
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      showToast("讲解已提交，学习评价已生成", "success");
      router.push(`/project/${projectId}/evaluation`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "提交失败，请重试", "error");
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <MainLayout title="提交讲解" subtitle="AI正在评价你的讲解">
        <div className="max-w-2xl mx-auto mt-12 sm:mt-20">
          <Card>
            <CardContent className="py-10">
              <Loading text="AI 正在结合你的项目过程与讲解生成学习评价..." size="lg" />
              <p className="text-center text-xs text-slate-400 mt-2">
                通常需要 10~40 秒，请勿关闭页面
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="最终讲解" subtitle="像向老师讲题一样，完整解释你的解题思路">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        <button
          onClick={() => router.push(`/project/${projectId}/complete`)}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回项目成果
        </button>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm text-amber-800 leading-relaxed flex items-start gap-2">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              请你像向老师讲题一样，完整解释你是如何完成
              {project ? `「${project.name}」` : "这个项目"}
              的。认真思考后作答，AI 会结合你的项目任务记录与讲解内容，生成学习评价。
            </span>
          </p>
        </div>

        {/* 进度提示 */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className={`w-4 h-4 ${allFilled ? "text-green-500" : "text-slate-300"}`} />
            已完成 {filledCount}/{questions.length} 题
          </span>
          <span>已输入 {totalChars} 字</span>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={idx}>
              <CardContent>
                <label
                  htmlFor={`explain-${idx}`}
                  className="block text-sm font-medium text-slate-800 mb-2 leading-relaxed"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2 align-middle">
                    {idx + 1}
                  </span>
                  {q}
                </label>
                <textarea
                  id={`explain-${idx}`}
                  value={answers[idx]}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  placeholder={placeholders[idx]}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-y text-sm leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 text-right">
                  {answers[idx].trim().length} 字
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center pb-4">
          <Button size="lg" onClick={handleSubmit} disabled={!allFilled} loading={submitting}>
            <Send className="w-4 h-4" /> 提交讲解并生成评价
          </Button>
          {!allFilled && (
            <p className="text-xs text-slate-400 mt-2">
              请回答所有问题后再提交（草稿会自动保存）
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
