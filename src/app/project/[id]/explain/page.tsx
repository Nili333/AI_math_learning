"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { generateEvaluationApi } from "@/services/api";

const questions = [
  "你是如何分析问题的？",
  "你使用了哪些数学知识？",
  "为什么选择这种解题方法？",
  "你觉得哪一步最关键？",
  "最终结果代表什么实际意义？",
];

export default function ExplainPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { dispatch } = useApp();
  const { showToast } = useToast();

  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);

  const allFilled = answers.every((a) => a.trim().length > 0);

  const handleSubmit = async () => {
    if (!allFilled) {
      showToast("请回答所有问题后提交", "error");
      return;
    }
    setSubmitting(true);
    try {
      const evaluation = await generateEvaluationApi(projectId, { answers });
      dispatch({ type: "SET_CURRENT_EVALUATION", evaluation });
      showToast("讲解提交成功，正在生成评价...", "success");
      setTimeout(() => {
        router.push(`/project/${projectId}/evaluation`);
      }, 2000);
    } catch {
      showToast("提交失败，请重试", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <MainLayout title="提交讲解" subtitle="AI正在评价你的讲解">
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardContent>
              <Loading text="AI正在分析你的讲解，生成学习评价..." size="lg" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="最终讲解" subtitle="像向老师讲题一样，完整解释你的解题思路">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            请你像向老师讲题一样，完整解释你是如何完成这个项目的。认真思考后作答，这将帮助AI更准确地评价你的学习效果。
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={idx}>
              <CardContent>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2">
                    {idx + 1}
                  </span>
                  {q}
                </label>
                <textarea
                  value={answers[idx]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[idx] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  placeholder="请详细描述你的思路..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition resize-none text-sm"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!allFilled}
          >
            提交讲解
          </Button>
          {!allFilled && (
            <p className="text-xs text-slate-400 mt-2">请回答所有问题后提交</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
